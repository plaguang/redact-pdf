"use client";

import { useRef, useState } from "react";

// 一个涂黑框：坐标为页面渲染尺寸的比例（0~1），与缩放无关
type Box = { x: number; y: number; w: number; h: number; auto?: string };
type Page = { img: string; w: number; h: number; wPt: number; hPt: number; boxes: Box[] };

const RENDER_SCALE = 2; // 渲染分辨率：越高导出越清晰

// 自动识别的敏感信息规则
const PATTERNS: { name: string; re: RegExp }[] = [
  { name: "Email", re: /[\w.+-]+@[\w-]+\.[\w.-]+/g },
  { name: "Phone", re: /(\+?\d{1,2}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g },
  { name: "SSN", re: /\b\d{3}-\d{2}-\d{4}\b/g },
  { name: "Card", re: /\b(?:\d[ -]?){13,16}\b/g },
];

// 用离屏 canvas 测量文字宽度（无衬线字体近似 PDF 常见字体）
let measureCtx: CanvasRenderingContext2D | null = null;
function measure(s: string) {
  measureCtx ??= document.createElement("canvas").getContext("2d")!;
  measureCtx.font = "100px Helvetica, Arial, sans-serif";
  return measureCtx.measureText(s).width;
}

export default function Redactor() {
  const [pages, setPages] = useState<Page[]>([]);
  const [busy, setBusy] = useState("");
  const [fileName, setFileName] = useState("");
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ Email: true, Phone: true, SSN: true, Card: true });
  const drag = useRef<{ page: number; x0: number; y0: number } | null>(null);
  const [draft, setDraft] = useState<{ page: number; box: Box } | null>(null);

  async function load(file: File) {
    setBusy("Loading PDF…");
    setFileName(file.name.replace(/\.pdf$/i, ""));
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const out: Page[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      setBusy(`Rendering page ${i}/${doc.numPages}…`);
      const page = await doc.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const vp = page.getViewport({ scale: RENDER_SCALE });
      const canvas = document.createElement("canvas");
      canvas.width = vp.width;
      canvas.height = vp.height;
      await page.render({ canvas, viewport: vp }).promise;

      // 文本层：根据正则自动生成涂黑框
      const boxes: Box[] = [];
      const tc = await page.getTextContent();
      for (const it of tc.items as { str: string; transform: number[]; width: number; height: number }[]) {
        if (!it.str?.trim()) continue;
        const [, , , d, e, f] = it.transform;
        const fontH = Math.abs(d) || it.height;
        for (const p of PATTERNS) {
          for (const m of it.str.matchAll(p.re)) {
            // 用 canvas 按真实字宽估算子串位置（比例字体下比按字符数准确得多）
            const full = measure(it.str) || 1;
            const start = measure(it.str.slice(0, m.index ?? 0)) / full;
            const len = measure(m[0]) / full;
            const pad = fontH * 0.25; // 两侧安全边距，宁多勿漏
            const x = e + it.width * start - pad;
            const yTop = base.height - f - fontH; // PDF 坐标 y 轴向上，翻转
            boxes.push({
              x: x / base.width,
              y: (yTop - fontH * 0.15) / base.height,
              w: (it.width * len + pad * 2) / base.width,
              h: (fontH * 1.35) / base.height,
              auto: p.name,
            });
          }
        }
      }
      out.push({ img: canvas.toDataURL("image/png"), w: vp.width, h: vp.height, wPt: base.width, hPt: base.height, boxes });
    }
    setPages(out);
    setBusy("");
  }

  function rel(e: React.PointerEvent, el: HTMLElement) {
    const r = el.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  }

  function onDown(e: React.PointerEvent<HTMLDivElement>, page: number) {
    if ((e.target as HTMLElement).dataset.box) return;
    const p = rel(e, e.currentTarget);
    drag.current = { page, x0: p.x, y0: p.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const p = rel(e, e.currentTarget);
    const { x0, y0, page } = drag.current;
    setDraft({ page, box: { x: Math.min(x0, p.x), y: Math.min(y0, p.y), w: Math.abs(p.x - x0), h: Math.abs(p.y - y0) } });
  }
  function onUp() {
    if (draft && draft.box.w > 0.005 && draft.box.h > 0.003) {
      setPages((ps) => ps.map((pg, i) => (i === draft.page ? { ...pg, boxes: [...pg.boxes, draft.box] } : pg)));
    }
    drag.current = null;
    setDraft(null);
  }
  function removeBox(page: number, idx: number) {
    setPages((ps) => ps.map((pg, i) => (i === page ? { ...pg, boxes: pg.boxes.filter((_, j) => j !== idx) } : pg)));
  }
  const visible = (b: Box) => !b.auto || enabled[b.auto];

  // 导出：把每页渲染成图片并烧录黑框 —— 原文字层被彻底丢弃，无法复制恢复
  async function exportPdf() {
    setBusy("Building redacted PDF…");
    const { jsPDF } = await import("jspdf");
    let pdf: InstanceType<typeof jsPDF> | null = null;
    for (const pg of pages) {
      const img = new Image();
      img.src = pg.img;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = pg.w;
      c.height = pg.h;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      ctx.fillStyle = "#000";
      for (const b of pg.boxes.filter(visible)) ctx.fillRect(b.x * pg.w, b.y * pg.h, b.w * pg.w, b.h * pg.h);
      const orient = pg.wPt > pg.hPt ? "l" : "p";
      if (!pdf) pdf = new jsPDF({ unit: "pt", format: [pg.wPt, pg.hPt], orientation: orient });
      else pdf.addPage([pg.wPt, pg.hPt], orient);
      pdf.addImage(c.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pg.wPt, pg.hPt);
    }
    pdf?.save(`${fileName || "document"}-redacted.pdf`);
    setBusy("");
  }

  const counts = PATTERNS.map((p) => ({ name: p.name, n: pages.reduce((s, pg) => s + pg.boxes.filter((b) => b.auto === p.name).length, 0) }));
  const total = pages.reduce((s, pg) => s + pg.boxes.filter(visible).length, 0);

  if (!pages.length)
    return (
      <label
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center cursor-pointer hover:border-slate-900 transition"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) load(f);
        }}
      >
        <input type="file" accept="application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && load(e.target.files[0])} />
        <span className="text-4xl">📄</span>
        <span className="text-lg font-semibold">{busy || "Drop a PDF here or click to choose"}</span>
        <span className="text-sm text-slate-500">Processed 100% in your browser. Your file is never uploaded.</span>
      </label>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-xl bg-white/95 p-3 shadow backdrop-blur">
        <span className="text-sm font-medium">Auto-detect:</span>
        {counts.map((c) => (
          <label key={c.name} className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={enabled[c.name]} onChange={(e) => setEnabled({ ...enabled, [c.name]: e.target.checked })} />
            {c.name} ({c.n})
          </label>
        ))}
        <span className="text-sm text-slate-500">Drag on the page to add a box · click a box to remove</span>
        <div className="ml-auto flex gap-2">
          <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => setPages([])}>New file</button>
          <button className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={!!busy} onClick={exportPdf}>
            {busy || `Download redacted PDF (${total})`}
          </button>
        </div>
      </div>
      {pages.map((pg, pi) => (
        <div
          key={pi}
          className="relative mx-auto w-full max-w-3xl select-none touch-none shadow-lg"
          style={{ aspectRatio: `${pg.w}/${pg.h}` }}
          onPointerDown={(e) => onDown(e, pi)}
          onPointerMove={onMove}
          onPointerUp={onUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pg.img} alt={`Page ${pi + 1}`} className="pointer-events-none absolute inset-0 h-full w-full" draggable={false} />
          {pg.boxes.map((b, bi) =>
            visible(b) ? (
              <div
                key={bi}
                data-box="1"
                title={b.auto ? `${b.auto} (click to remove)` : "Click to remove"}
                onClick={() => removeBox(pi, bi)}
                className="absolute cursor-pointer bg-black/85 hover:bg-red-600/70"
                style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.w * 100}%`, height: `${b.h * 100}%` }}
              />
            ) : null,
          )}
          {draft?.page === pi && (
            <div className="absolute border-2 border-red-500 bg-black/40" style={{ left: `${draft.box.x * 100}%`, top: `${draft.box.y * 100}%`, width: `${draft.box.w * 100}%`, height: `${draft.box.h * 100}%` }} />
          )}
          <span className="absolute -left-10 top-0 text-xs text-slate-400">{pi + 1}</span>
        </div>
      ))}
    </div>
  );
}

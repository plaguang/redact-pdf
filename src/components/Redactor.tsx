"use client";

import { useRef, useState } from "react";
import { trackPdfEvent } from "@/lib/analytics";

type TextSpan = { str: string; x: number; yTop: number; width: number; fontH: number };

// 一个涂黑框：坐标为页面渲染尺寸的比例（0~1），与缩放无关
type Box = { x: number; y: number; w: number; h: number; auto?: string };
type Page = {
  img: string;
  w: number;
  h: number;
  wPt: number;
  hPt: number;
  boxes: Box[];
  spans: TextSpan[];
};

type RedactStyle = "black" | "white" | "stamp";

const RENDER_SCALE = 2; // 渲染分辨率：越高导出越清晰

// 自动识别的敏感信息规则（涵盖邮箱、电话、SSN、银行卡、日期与金额）
const PATTERNS: { name: string; re: RegExp }[] = [
  { name: "Email", re: /[\w.+-]+@[\w-]+\.[\w.-]+/g },
  { name: "Phone", re: /(\+?\d{1,2}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g },
  { name: "SSN", re: /\b\d{3}-\d{2}-\d{4}\b/g },
  { name: "Card", re: /\b(?:\d[ -]?){13,16}\b/g },
  { name: "Date", re: /\b(?:0?[1-9]|1[0-2])\/(?:0?[1-9]|[12]\d|3[01])\/(?:19|20)\d{2}\b/g },
  { name: "Amount", re: /\$\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?\b/g },
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
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    Email: true,
    Phone: true,
    SSN: true,
    Card: true,
    Date: false,
    Amount: false,
  });
  const [style, setStyle] = useState<RedactStyle>("black");
  const [keyword, setKeyword] = useState("");
  const [kwCount, setKwCount] = useState<number | null>(null);
  const drag = useRef<{ page: number; x0: number; y0: number } | null>(null);
  const [draft, setDraft] = useState<{ page: number; box: Box } | null>(null);

  async function load(file: File, isDemo = false) {
    setBusy("Loading PDF…");
    setFileName(file.name.replace(/\.pdf$/i, ""));
    setKwCount(null);
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

      const boxes: Box[] = [];
      const spans: TextSpan[] = [];
      const tc = await page.getTextContent();
      for (const it of tc.items as { str: string; transform: number[]; width: number; height: number }[]) {
        if (!it.str?.trim()) continue;
        const [, , , d, e, f] = it.transform;
        const fontH = Math.abs(d) || it.height;
        const yTop = base.height - f - fontH;
        spans.push({ str: it.str, x: e, yTop, width: it.width, fontH });

        for (const p of PATTERNS) {
          for (const m of it.str.matchAll(p.re)) {
            const full = measure(it.str) || 1;
            const start = measure(it.str.slice(0, m.index ?? 0)) / full;
            const len = measure(m[0]) / full;
            const pad = fontH * 0.25;
            const x = e + it.width * start - pad;
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
      out.push({
        img: canvas.toDataURL("image/png"),
        w: vp.width,
        h: vp.height,
        wPt: base.width,
        hPt: base.height,
        boxes,
        spans,
      });
    }
    setPages(out);
    setBusy("");
    trackPdfEvent(isDemo ? "pdf_demo_load" : "pdf_file_upload", { pages: out.length });
  }

  // 一键生成并加载 2 页机密示例 PDF（含 SSN、邮箱、电话、银行卡、金额、日期）
  async function loadSamplePdf() {
    setBusy("Generating sample confidential PDF…");
    const { jsPDF } = await import("jspdf");
    const d = new jsPDF();
    d.setFontSize(16);
    d.text("CONFIDENTIAL TAX & BANK STATEMENT SUMMARY", 20, 24);
    d.setFontSize(12);
    d.text("Applicant Name: Johnathan Doe (Project BLUEBIRD)", 20, 42);
    d.text("Primary Email: john.doe@acme-corp.com | Phone: (415) 555-0134", 20, 56);
    d.text("Taxpayer SSN: 123-45-6789 | Filing Date: 10/14/2026", 20, 70);
    d.text("Corporate Settlement Card: 4532 0151 1283 0094", 20, 84);
    d.text("Wire Transfer Balance: $14,850.00 (Cleared)", 20, 98);
    d.addPage();
    d.setFontSize(14);
    d.text("Page 2: Secondary Contact & Escrow Authorization", 20, 28);
    d.setFontSize(12);
    d.text("Escrow Contact: jane.smith@example.org | Tel: (212) 555-0199", 20, 46);
    d.text("Escrow Reserve Amount: $82,400.00 | Release Date: 12/01/2026", 20, 60);
    const buf = d.output("arraybuffer");
    await load(new File([buf], "sample-confidential-statement.pdf", { type: "application/pdf" }), true);
  }

  // 按自定义关键词批量全页搜索并涂黑
  function applyKeywordRedact() {
    const q = keyword.trim();
    if (!q) return;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "gi");
    let matched = 0;

    setPages((prev) =>
      prev.map((pg) => {
        const added: Box[] = [];
        for (const sp of pg.spans) {
          for (const m of sp.str.matchAll(re)) {
            matched++;
            const full = measure(sp.str) || 1;
            const start = measure(sp.str.slice(0, m.index ?? 0)) / full;
            const len = measure(m[0]) / full;
            const pad = sp.fontH * 0.25;
            const x = sp.x + sp.width * start - pad;
            added.push({
              x: x / pg.wPt,
              y: (sp.yTop - sp.fontH * 0.15) / pg.hPt,
              w: (sp.width * len + pad * 2) / pg.wPt,
              h: (sp.fontH * 1.35) / pg.hPt,
            });
          }
        }
        return added.length ? { ...pg, boxes: [...pg.boxes, ...added] } : pg;
      })
    );
    setKwCount(matched);
    trackPdfEvent("keyword_redact_add", { matches: matched });
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
    setDraft({
      page,
      box: { x: Math.min(x0, p.x), y: Math.min(y0, p.y), w: Math.abs(p.x - x0), h: Math.abs(p.y - y0) },
    });
  }
  function onUp() {
    if (draft && draft.box.w > 0.005 && draft.box.h > 0.003) {
      setPages((ps) => ps.map((pg, i) => (i === draft.page ? { ...pg, boxes: [...pg.boxes, draft.box] } : pg)));
      trackPdfEvent("manual_box_add");
    }
    drag.current = null;
    setDraft(null);
  }
  function removeBox(page: number, idx: number) {
    setPages((ps) =>
      ps.map((pg, i) => (i === page ? { ...pg, boxes: pg.boxes.filter((_, j) => j !== idx) } : pg))
    );
  }
  const visible = (b: Box) => !b.auto || enabled[b.auto];

  // 导出：把每页渲染成图片并烧录遮盖框 —— 原文字层与 PDF 元数据被彻底销毁，无法复制恢复
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

      for (const b of pg.boxes.filter(visible)) {
        const rx = b.x * pg.w;
        const ry = b.y * pg.h;
        const rw = b.w * pg.w;
        const rh = b.h * pg.h;
        ctx.fillStyle = style === "white" ? "#ffffff" : "#000000";
        ctx.fillRect(rx, ry, rw, rh);
        if (style === "white") {
          ctx.strokeStyle = "#cbd5e1";
          ctx.strokeRect(rx, ry, rw, rh);
        } else if (style === "stamp" && rw > 42 && rh > 12) {
          ctx.fillStyle = "#ffffff";
          ctx.font = `bold ${Math.min(18, Math.max(10, Math.floor(rh * 0.55)))}px Helvetica, Arial, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("REDACTED", rx + rw / 2, ry + rh / 2);
        }
      }
      const orient = pg.wPt > pg.hPt ? "l" : "p";
      if (!pdf) pdf = new jsPDF({ unit: "pt", format: [pg.wPt, pg.hPt], orientation: orient });
      else pdf.addPage([pg.wPt, pg.hPt], orient);
      pdf.addImage(c.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pg.wPt, pg.hPt);
    }
    pdf?.save(`${fileName || "document"}-redacted.pdf`);
    setBusy("");
    trackPdfEvent("download_redacted_pdf", { totalBoxes: total, style });
  }

  const counts = PATTERNS.map((p) => ({
    name: p.name,
    n: pages.reduce((s, pg) => s + pg.boxes.filter((b) => b.auto === p.name).length, 0),
  }));
  const total = pages.reduce((s, pg) => s + pg.boxes.filter(visible).length, 0);

  if (!pages.length)
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label
          className="relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 sm:p-10 text-center transition hover:border-slate-900 active:scale-[0.99]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) load(f);
          }}
        >
          <input
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(e) => e.target.files?.[0] && load(e.target.files[0])}
          />
          <span className="pointer-events-none text-4xl">📄</span>
          <span className="pointer-events-none text-lg font-semibold">{busy || "Drop a PDF here or click to choose"}</span>
          <span className="pointer-events-none inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs">
            📂 Tap or Click Here to Select PDF Document
          </span>
          <span className="pointer-events-none text-sm text-slate-500">
            100% In-Browser Sanitization · Strips underlying text layer &amp; metadata · Zero server upload
          </span>
        </label>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={loadSamplePdf}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            ✨ Load Sample Confidential PDF (Test SSN, Email &amp; Bank Redaction)
          </button>
        </div>
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-14 z-10 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/95 p-4 shadow backdrop-blur">
        {/* 第一行：自动 PII 检测开关 + 导出按钮 */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Auto-detect PII:</span>
          {counts.map((c) => (
            <label
              key={c.name}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${
                enabled[c.name]
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-700"
              }`}
            >
              <input
                type="checkbox"
                className="accent-indigo-500"
                checked={enabled[c.name]}
                onChange={(e) => setEnabled({ ...enabled, [c.name]: e.target.checked })}
              />
              {c.name} ({c.n})
            </label>
          ))}

          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100"
              onClick={() => setPages([])}
            >
              New file
            </button>
            <button
              type="button"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              disabled={!!busy}
              onClick={exportPdf}
            >
              {busy || `Download redacted PDF (${total})`}
            </button>
          </div>
        </div>

        {/* 第二行：按关键词全页查找涂黑 + 遮盖样式切换 */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyKeywordRedact()}
              placeholder="Find & redact word/name across all pages…"
              aria-label="Find and redact keyword"
              className="w-60 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
            />
            <button
              type="button"
              onClick={applyKeywordRedact}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 font-semibold text-white hover:bg-indigo-700"
            >
              + Redact All Matches
            </button>
            {kwCount !== null && (
              <span className="text-emerald-700 font-medium">Added {kwCount} match(es)</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500">Style:</span>
            {(
              [
                ["black", "█ Solid Blackout"],
                ["white", "□ Whiteout / Erase"],
                ["stamp", "[REDACTED] Stamp"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setStyle(k)}
                className={`rounded-md border px-2 py-1 font-medium ${
                  style === k ? "border-indigo-600 bg-indigo-50 text-indigo-800" : "border-slate-200 text-slate-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-center text-xs text-emerald-900">
        🔒 <b>True Flatten Sanitization:</b> Drag anywhere on a page to draw a redaction box, or click any box to remove
        it. Exported pages are flattened into rasterized images so hidden text can never be copy-pasted or recovered.
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
          <img
            src={pg.img}
            alt={`Page ${pi + 1}`}
            className="pointer-events-none absolute inset-0 h-full w-full"
            draggable={false}
          />
          {pg.boxes.map((b, bi) =>
            visible(b) ? (
              <div
                key={bi}
                data-box="1"
                title={b.auto ? `${b.auto} (click to remove)` : "Click to remove"}
                onClick={() => removeBox(pi, bi)}
                className={`absolute flex cursor-pointer items-center justify-center overflow-hidden transition ${
                  style === "white"
                    ? "border border-slate-400 bg-white/95 hover:bg-red-100"
                    : "bg-black/90 text-white hover:bg-red-600/80"
                }`}
                style={{
                  left: `${b.x * 100}%`,
                  top: `${b.y * 100}%`,
                  width: `${b.w * 100}%`,
                  height: `${b.h * 100}%`,
                }}
              >
                {style === "stamp" && (
                  <span className="pointer-events-none text-[9px] font-bold tracking-wider text-white">
                    REDACTED
                  </span>
                )}
              </div>
            ) : null
          )}
          {draft?.page === pi && (
            <div
              className="absolute border-2 border-red-500 bg-black/40"
              style={{
                left: `${draft.box.x * 100}%`,
                top: `${draft.box.y * 100}%`,
                width: `${draft.box.w * 100}%`,
                height: `${draft.box.h * 100}%`,
              }}
            />
          )}
          <span className="absolute -left-8 top-0 text-xs font-mono text-slate-400">P{pi + 1}</span>
        </div>
      ))}
    </div>
  );
}

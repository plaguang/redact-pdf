// 端到端测试：上传 → 自动识别 → 手动框选 → 删除 → 导出 → 校验导出 PDF 已无敏感文字
import { chromium } from "playwright-core";
import { jsPDF } from "jspdf";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from "node:fs";

const URL = process.env.URL || "http://localhost:3456";
const SHOTS = process.env.SHOTS || "e2e-shots";
fs.mkdirSync(SHOTS, { recursive: true });
let fail = 0;
const ok = (c, m) => { console.log(`${c ? "✅" : "❌"} ${m}`); if (!c) fail++; };

// 1. 生成两页测试 PDF
const d = new jsPDF();
d.setFontSize(14);
d.text("Contact John at john.doe@acme.com or (415) 555-0134.", 20, 30);
d.text("SSN: 123-45-6789", 20, 50);
d.text("Secret project codename: BLUEBIRD", 20, 70);
d.addPage();
d.text("Page two: jane@example.org", 20, 30);
fs.writeFileSync("/tmp/e2e-in.pdf", Buffer.from(d.output("arraybuffer")));

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ acceptDownloads: true, viewport: { width: 1280, height: 1600 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

await page.goto(URL);
ok((await page.title()).includes("Redact PDF"), "页面标题正确");

// 2. 上传
await page.setInputFiles('input[type="file"]', "/tmp/e2e-in.pdf");
await page.waitForSelector('img[alt="Page 1"]', { timeout: 20000 });
ok(await page.locator('img[alt^="Page"]').count() === 2, "渲染出 2 页");

// 3. 自动识别计数
const bar = await page.locator(".sticky").innerText();
console.log("   工具栏:", bar.replace(/\s+/g, " "));
const autoBoxes = await page.locator("[data-box]").count();
ok(autoBoxes === 4, `自动识别 4 处（实际 ${autoBoxes}：2 邮箱 + 1 电话 + 1 SSN）`);
await page.screenshot({ path: `${SHOTS}/1-auto.png` });

// 4. 关闭 Email 开关 → 框数减少
await page.getByLabel(/^Email/).uncheck();
ok(await page.locator("[data-box]").count() === 2, "关闭 Email 后剩 2 框");
await page.getByLabel(/^Email/).check();

// 5. 手动拖拽框选第 1 页的 "BLUEBIRD" 一行
const p1 = page.locator('img[alt="Page 1"]').locator("..");
const bb = await p1.boundingBox();
// jsPDF A4: 210mm 宽；y=70mm 处的文字，约在页面高度 70/297
const y = bb.y + bb.height * (66 / 297), x0 = bb.x + bb.width * (15 / 210), x1 = bb.x + bb.width * (120 / 210);
await page.mouse.move(x0, y - 8);
await page.mouse.down();
await page.mouse.move((x0 + x1) / 2, y + 2, { steps: 5 });
await page.mouse.move(x1, y + 12, { steps: 5 });
await page.mouse.up();
ok(await page.locator("[data-box]").count() === 5, "手动拖拽新增 1 框（共 5）");

// 6. 点击删除再重画（验证删除功能）
await p1.locator("[data-box]").last().click();
ok(await page.locator("[data-box]").count() === 4, "点击框后删除（回到 4）");
await page.mouse.move(x0, y - 8); await page.mouse.down();
await page.mouse.move(x1, y + 12, { steps: 8 }); await page.mouse.up();
ok(await page.locator("[data-box]").count() === 5, "重新框选（共 5）");
await page.screenshot({ path: `${SHOTS}/2-manual.png` });

// 7. 导出下载
const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 30000 }), page.getByRole("button", { name: /Download redacted PDF/ }).click()]);
const outPath = "/tmp/e2e-out.pdf";
await dl.saveAs(outPath);
ok(dl.suggestedFilename() === "e2e-in-redacted.pdf", `文件名 ${dl.suggestedFilename()}`);

// 8. 校验导出 PDF：2 页、无可提取文字（敏感信息不可恢复）
const out = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(outPath)) }).promise;
ok(out.numPages === 2, `导出 ${out.numPages} 页`);
let text = "";
for (let i = 1; i <= out.numPages; i++) text += (await (await out.getPage(i)).getTextContent()).items.map((t) => t.str).join(" ");
ok(!/acme|555|6789|BLUEBIRD|jane/.test(text), `导出文件不含敏感文字（提取到 ${text.trim().length} 字符）`);

// 9. 像素层面以截图人工复核（见 e2e-shots/）

ok(errors.length === 0, `无页面 JS 错误${errors.length ? "：" + errors.join("; ") : ""}`);
await browser.close();
console.log(fail ? `\n${fail} 项失败` : "\n全部通过 🎉");
process.exit(fail ? 1 : 0);

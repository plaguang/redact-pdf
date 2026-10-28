// 端到端测试：上传 / 示例加载 → 自动识别 → 关键词全页检索涂黑 → 手动框选 → 删除 → 导出 → 校验导出 PDF 已无敏感文字
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
await page.route(/googletagmanager|google-analytics|clarity\.ms|_vercel\/insights/i, (route) => route.abort());
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

await page.goto(URL, { waitUntil: "domcontentloaded" });
ok((await page.title()).includes("Redact PDF"), "页面标题正确");
ok(await page.locator("header nav a").count() === 5, "顶部吸顶导航包含全部 5 个工具入口");

const isBlocked = await page.evaluate(() => navigator.webdriver === true && typeof window.gtag === "undefined");
ok(isBlocked, "自动化测试环境已成功屏蔽 GA4 / Clarity / Vercel 统计污染");

// 2. 上传
await page.setInputFiles('input[type="file"]', "/tmp/e2e-in.pdf");
await page.waitForSelector('img[alt="Page 1"]', { timeout: 20000 });
ok(await page.locator('img[alt^="Page"]').count() === 2, "渲染出 2 页");

// 3. 自动识别计数
const autoBoxes = await page.locator("[data-box]").count();
ok(autoBoxes === 4, `自动识别 4 处（实际 ${autoBoxes}：2 邮箱 + 1 电话 + 1 SSN）`);
await page.screenshot({ path: `${SHOTS}/1-auto.png` });

// 4. 关闭 Email 开关 → 框数减少
await page.getByLabel(/^Email/).uncheck();
ok(await page.locator("[data-box]").count() === 2, "关闭 Email 后剩 2 框");
await page.getByLabel(/^Email/).check();

// 5. 测试按关键词全页查找涂黑 ("BLUEBIRD")
await page.getByLabel("Find and redact keyword").fill("BLUEBIRD");
await page.getByRole("button", { name: "+ Redact All Matches" }).click();
ok(await page.locator("[data-box]").count() === 5, "按关键词 BLUEBIRD 自动新增 1 处遮盖框（共 5）");

// 6. 点击删除再手动拖拽框选（验证删除与手动框选功能）
const p1 = page.locator('img[alt="Page 1"]').locator("..");
await p1.locator("[data-box]").last().click();
ok(await page.locator("[data-box]").count() === 4, "点击框后删除（回到 4）");

const bb = await p1.boundingBox();
const y = bb.y + bb.height * (66 / 297), x0 = bb.x + bb.width * (15 / 210), x1 = bb.x + bb.width * (120 / 210);
await page.mouse.move(x0, y - 8); await page.mouse.down();
await page.mouse.move(x1, y + 12, { steps: 8 }); await page.mouse.up();
ok(await page.locator("[data-box]").count() === 5, "手动拖拽重新框选（共 5）");
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

// 9. 验证全部 5 个 SEO 着陆页 + Sitemap + LLMs.txt + AI 引荐识别
for (const route of ["/black-out-text-in-pdf", "/remove-personal-information-from-pdf", "/redact-ssn-in-pdf", "/redact-bank-statement-pdf", "/sitemap.xml", "/robots.txt", "/llms.txt"]) {
  const res = await page.goto(`${URL}${route}`, { waitUntil: "domcontentloaded" });
  ok(res && res.status() === 200, `路由 ${route} 返回 HTTP 200`);
}
await page.goto(`${URL}/redact-ssn-in-pdf?utm_source=perplexity.ai`, { waitUntil: "networkidle" });
const aiAttr = await page.locator("html").getAttribute("data-ai-referral");
ok(aiAttr === "perplexity:perplexity", `GEOInflow AI 引荐归因识别 html[data-ai-referral="${aiAttr}"]`);

ok(errors.length === 0, `无页面 JS 错误${errors.length ? "：" + errors.join("; ") : ""}`);
await browser.close();
console.log(fail ? `\n${fail} 项失败` : "\n全部通过 🎉");
process.exit(fail ? 1 : 0);

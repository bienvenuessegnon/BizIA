import puppeteer from "puppeteer-core";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME_PATH || "/usr/local/bin/google-chrome";
const OUT = process.env.FRAME_DIR || "/tmp/li-frames";
const FPS = 25;
const TOTAL = 45 * FPS;

function parseFrames(argv) {
  const arg = argv.find((a) => a.startsWith("--frames="));
  if (!arg) return null;
  return arg
    .slice("--frames=".length)
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
}

const selected = parseFrames(process.argv);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--hide-scrollbars",
    "--font-render-hinting=none",
    "--disable-gpu",
    `--window-size=1080,1350`,
  ],
});

const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });
await page.goto(`file://${path.join(__dirname, "film.html")}`, { waitUntil: "load" });
await page.evaluate(async () => {
  await document.fonts.ready;
});
const fontOk = await page.evaluate(() => document.fonts.check("700 100px Inter"));
const sample = await page.evaluate(() => {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  ctx.font = "700 100px Inter, sans-serif";
  return ctx.measureText("LinkedIn").width;
});
console.log(`font check=${fontOk} sampleWidth=${sample.toFixed(1)}`);
if (!fontOk || sample < 200) {
  console.warn("Inter may have fallen back — widths look unexpected.");
}

await mkdir(OUT, { recursive: true });
const frames = selected ?? Array.from({ length: TOTAL }, (_, i) => i);
const t0 = Date.now();
for (let i = 0; i < frames.length; i++) {
  const f = frames[i];
  await page.evaluate((frame) => window.renderFrame(frame), f);
  const buf = await page.screenshot({
    type: "png",
    clip: { x: 0, y: 0, width: 1080, height: 1350 },
    omitBackground: false,
  });
  const name = selected ? `preview-${String(f).padStart(4, "0")}.png` : `${String(f).padStart(4, "0")}.png`;
  await writeFile(path.join(OUT, name), buf);
  if (i % 25 === 0 || i === frames.length - 1) {
    const el = (Date.now() - t0) / 1000;
    const rate = (i + 1) / el;
    const left = (frames.length - i - 1) / rate;
    console.log(`frame ${f}  ${i + 1}/${frames.length}  ${rate.toFixed(1)} fps  eta ${left.toFixed(0)}s`);
  }
}
await browser.close();
console.log(`wrote ${frames.length} frames to ${OUT}`);

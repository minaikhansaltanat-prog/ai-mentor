import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CHROME_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

function findChrome() {
  for (const p of CHROME_CANDIDATES) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("No local Chrome/Edge install found. Install Chrome or set CHROME_PATH.");
}

const url = process.argv[2] || "http://localhost:3000";
const label = process.argv[3] || "";
const viewportArg = process.argv[4] || "desktop"; // desktop | mobile | both

const outDir = path.join(__dirname, "temporary screenshots");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function nextIndex() {
  const files = fs.readdirSync(outDir).filter((f) => /^screenshot-(\d+)/.test(f));
  const nums = files.map((f) => parseInt(f.match(/^screenshot-(\d+)/)[1], 10));
  return nums.length ? Math.max(...nums) + 1 : 1;
}

const viewports = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 },
};

async function shoot(vpName) {
  const executablePath = process.env.CHROME_PATH || findChrome();
  const browser = await puppeteer.launch({ executablePath, headless: "new" });
  const page = await browser.newPage();
  const vp = viewports[vpName];
  await page.setViewport(vp);
  await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
  // scroll through the full page so scroll-reveal animations trigger before capture
  await page.evaluate(async () => {
    const step = Math.max(200, window.innerHeight * 0.85);
    let y = 0;
    const max = document.body.scrollHeight;
    while (y < max) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
      y += step;
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 200));
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 500));
  // force-reveal everything for screenshot QA purposes (production timing is independently fine)
  await page.evaluate(() => {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
  });
  await new Promise((r) => setTimeout(r, 150));
  const idx = nextIndex();
  const suffix = [label, vpName].filter(Boolean).join("-");
  const fileName = `screenshot-${idx}${suffix ? "-" + suffix : ""}.png`;
  const filePath = path.join(outDir, fileName);
  await page.screenshot({ path: filePath, fullPage: true });
  await browser.close();
  console.log("Saved:", filePath);
}

(async () => {
  if (viewportArg === "both") {
    await shoot("desktop");
    await shoot("mobile");
  } else {
    await shoot(viewportArg);
  }
})();

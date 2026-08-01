import { chromium } from "playwright";
import path from "node:path";

const outDir = process.argv[2];
const viewport = process.argv[3] === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const suffix = process.argv[3] === "mobile" ? "-mobile" : "";
const urls = process.argv.slice(4);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport });
await page.setViewportSize(viewport);

for (const url of urls) {
  const name = url.replace(/^https?:\/\/[^/]+/, "").replace(/[\/?&=]/g, "_") || "_home";
  try {
    await page.goto(`http://localhost:3000${url}`, { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(400);

    const height = await page.evaluate(() => document.body.scrollHeight);
    const step = 400;
    for (let y = 0; y < height; y += step) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(120);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    await page.screenshot({ path: path.join(outDir, `${name}${suffix}.png`), fullPage: true });
    console.log(`OK ${url}`);
  } catch (err) {
    console.log(`FAIL ${url}: ${err.message}`);
  }
}

await browser.close();

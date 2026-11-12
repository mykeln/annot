import { chromium } from "@playwright/test";
import { mkdir, readFile, copyFile } from "node:fs/promises";

const svg = await readFile("assets/annot.svg", "utf8");
await mkdir("extension/icons", { recursive: true });
await mkdir("store/assets", { recursive: true });
const browser = await chromium.launch({ channel: "chromium" });
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const size of [16, 32, 48, 128]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
    await page.screenshot({ path: `extension/icons/icon-${size}.png`, omitBackground: true });
  }
  await copyFile("extension/icons/icon-128.png", "store/assets/icon-128.png");
  for (const [width, height, filename] of [[440, 280, "promo-small.png"], [1400, 560, "promo-marquee.png"]]) {
    const scale = width / 440;
    await page.setViewportSize({ width, height });
    await page.setContent(`<style>
      *{box-sizing:border-box}body{margin:0;background:#302a43;color:#faf8f3;font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif;overflow:hidden}
      .art{width:440px;height:${height / scale}px;transform:scale(${scale});transform-origin:top left;display:flex;align-items:center;padding:32px;gap:20px;position:relative}
      .art:before{content:'';position:absolute;right:-80px;top:-100px;width:300px;height:300px;border:1px solid #e6dcff20;border-radius:50%;box-shadow:0 0 0 50px #e6dcff08,0 0 0 100px #e6dcff05}
      svg{width:110px;height:110px;flex:none;z-index:1}section{z-index:1}h1{font-size:43px;margin:0 0 8px;letter-spacing:-2px}p{font-size:16px;line-height:1.5;margin:0;color:#d8cdeb;max-width:220px}
    </style><div class="art">${svg}<section><h1>annot</h1><p>Point at the change.<br>Bring it to your code.</p></section></div>`);
    await page.screenshot({ path: `store/assets/${filename}` });
  }
} finally { await browser.close(); }
console.log("Generated extension icons and Chrome Web Store promotional images.");

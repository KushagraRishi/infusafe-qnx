// Renders chosen frames of the explainer to PNGs, plus a 3x3 contact sheet.
//   node stills.mjs <out-dir> t1 t2 ...
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const [, , outDir, ...ts] = process.argv;
const times = ts.map(Number);
fs.mkdirSync(outDir, { recursive: true });

const lib = fs.readFileSync(path.join(here, '..', 'lib.js'), 'utf8');
const ex = fs.readFileSync(path.join(here, '..', 'explainer.js'), 'utf8');
const html = `<!doctype html><html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&family=Nunito:wght@400;700;800;900&display=block"></head>
<body style="margin:0"><canvas id="c" width="1280" height="720"></canvas><script>${lib}</script><script>${ex}</script></body></html>`;

const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-first-run'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });
await page.setContent(html, { waitUntil: 'networkidle0' });
await page.evaluate(async () => { await Promise.all(['900 64px "Nunito"', '800 32px "Nunito"', '700 28px "Nunito"'].map((f) => document.fonts.load(f, 'AaZz09'))); await document.fonts.ready; });
const ms = [];
for (const t of times) {
  const res = await page.evaluate((t) => {
    const c = document.getElementById('c'), x = c.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.clearRect(0, 0, 1280, 720);
    const t0 = performance.now(); window.explainer(x, 1280, 720, t); const dt = performance.now() - t0;
    return { url: c.toDataURL('image/png'), dt };
  }, t);
  fs.writeFileSync(path.join(outDir, `f_${t.toFixed(2)}.png`), Buffer.from(res.url.split(',')[1], 'base64'));
  ms.push(res.dt.toFixed(0));
}
console.log('frame ms:', ms.join(' '));
await browser.close();

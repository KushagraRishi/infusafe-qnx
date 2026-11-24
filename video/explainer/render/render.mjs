// Renders the explainer to MP4: frames from headless Chrome into ffmpeg, sound from the offline score.
//   node render.mjs out.mp4 [--stills t1,t2,...] [--from s --to s]
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const args = process.argv.slice(2);
const out = path.resolve(args[0] || 'explainer.mp4');
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const stills = opt('--stills');
const FPS = 30;

// tiny static server so the canvas can read footage frames without tainting
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port;
fs.writeFileSync(path.join(root, 'render.html'), `<!doctype html><html><head>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&family=Nunito:wght@400;700;800;900&display=block"></head>
<body style="margin:0"><canvas id="c" width="1280" height="720"></canvas>
<script src="lib.js"></script><script src="sound.js"></script><script src="explainer.js"></script></body></html>`);

const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-first-run', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });
await page.goto(`http://127.0.0.1:${port}/render.html`, { waitUntil: 'networkidle0' });
await page.evaluate(async () => { await Promise.all(['900 64px "Nunito"', '800 32px "Nunito"', '700 28px "Nunito"'].map((f) => document.fonts.load(f, 'AaZz09'))); await document.fonts.ready; });

const frame = (t, q) => page.evaluate(async (t, q) => {
  await window.prepare(t);
  const c = document.getElementById('c'), x = c.getContext('2d');
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, 1280, 720);
  window.explainer(x, 1280, 720, t);
  return c.toDataURL('image/jpeg', q).split(',')[1];
}, t, q);

if (stills) {
  fs.mkdirSync(out, { recursive: true });
  for (const t of stills.split(',').map(Number)) fs.writeFileSync(path.join(out, `s_${t.toFixed(2)}.jpg`), Buffer.from(await frame(t, 0.9), 'base64'));
  console.log('stills written to', out);
} else {
  const D = await page.evaluate(() => window.DURATION);
  const t0 = Number(opt('--from') || 0), t1 = Number(opt('--to') || D);
  // sound first: the offline score, in voiceover mode so a narration can sit on top
  const audio = await page.evaluate(async (t0, t1) => {
    const r = await SOUND.renderOffline(window.scoreSound, window.DURATION, 48000, { voiceover: true });
    const s0 = Math.floor(t0 * 48000) * 2, s1 = Math.floor(t1 * 48000) * 2;
    const seg = r.inter.subarray(s0, s1), i16 = new Int16Array(seg.length);
    for (let i = 0; i < seg.length; i++) i16[i] = Math.max(-1, Math.min(1, seg[i])) * 32767;
    let bin = ''; const u8 = new Uint8Array(i16.buffer); for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return { b64: btoa(bin), peak: r.peak };
  }, t0, t1);
  const pcm = Buffer.from(audio.b64, 'base64');
  const wavPath = out.replace(/\.mp4$/, '.wav');
  const hdr = Buffer.alloc(44);
  hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + pcm.length, 4); hdr.write('WAVE', 8); hdr.write('fmt ', 12);
  hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22); hdr.writeUInt32LE(48000, 24);
  hdr.writeUInt32LE(48000 * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34); hdr.write('data', 36); hdr.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(wavPath, Buffer.concat([hdr, pcm]));
  console.log('audio peak', audio.peak.toFixed(3));

  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', wavPath,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round((t1 - t0) * FPS);
  for (let i = 0; i < n; i++) {
    const buf = Buffer.from(await frame(t0 + i / FPS, 0.93), 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`frame ${i}/${n}`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log('wrote', out);
}
await browser.close();
server.close();

// Schritt 3: Komposition Frame für Frame rendern (JPEG) — deterministisch über
// window.__seek(t). Danach baut build.mjs daraus mit ffmpeg die MP4.
// Aufruf: node promo/render.mjs                 alle Frames nach work/frames
//         node promo/render.mjs --stills 2,9.5  nur Kontrollbilder nach work/stills
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from './lib/cdp.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const FPS = Number(process.env.PROMO_FPS ?? 30);
const args = process.argv.slice(2);
const stillsArg = args.includes('--stills') ? args[args.indexOf('--stills') + 1] : null;

// Mini-Static-Server für das Paketverzeichnis (Fonts/Masken brauchen http://)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] ?? 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/promo/scenes/promo.html?t=0`;

const browser = await launchBrowser({ profileDir: path.join(here, 'work', 'profile-render'), port: 9334 });
const page = await browser.newPage({ width: 1920, height: 1080 });
await page.goto(url);
await page.eval('window.__ready');
const duration = await page.eval('window.__duration');

async function frame(t, file, quality = 95) {
  await page.eval(`window.__seek(${t}); new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`);
  await page.screenshot(file, { format: 'jpeg', quality });
}

if (stillsArg) {
  const dir = path.join(here, 'work', 'stills');
  fs.mkdirSync(dir, { recursive: true });
  for (const t of stillsArg.split(',').map(Number)) {
    await frame(t, path.join(dir, `t${String(t).replace('.', '_')}.jpg`), 85);
    console.log('still', t);
  }
} else {
  const dir = path.join(here, 'work', 'frames');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const total = Math.round(duration * FPS);
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    await frame(i / FPS, path.join(dir, `f_${String(i + 1).padStart(5, '0')}.jpg`));
    if (i % 60 === 0) console.log(`frame ${i}/${total}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  console.log(`fertig: ${total} Frames in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}

await browser.close();
server.close();

// Schritt 1: echte App-Screens von der Demo-Instanz abgreifen (PNG).
// Voraussetzung: node promo/demo-server.mjs läuft (Port 3199).
// Aufruf: node promo/capture.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser, sleep } from './lib/cdp.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'work', 'screens');
fs.mkdirSync(out, { recursive: true });
const BASE = `http://localhost:${process.env.PROMO_PORT ?? 3199}`;

// frisches Profil: kein localStorage aus früheren Läufen (sonst andere Anmeldeansicht)
const profileDir = path.join(here, 'work', 'profile-capture');
fs.rmSync(profileDir, { recursive: true, force: true });
const browser = await launchBrowser({ profileDir });

async function login(page, area, prefix, name) {
  const { players } = await (await fetch(`${BASE}/${area}/api/players`)).json();
  const p = players.find((x) => x.name === name);
  const res = await fetch(`${BASE}/${area}/api/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId: p.id, pin: '1111' }),
  });
  const { token } = await res.json();
  await page.goto(`${BASE}/${area}/abende`);
  await page.eval(`(() => {
    localStorage.setItem('${prefix}_token', ${JSON.stringify(token)});
    localStorage.setItem('${prefix}_player_id', ${JSON.stringify(p.id)});
    localStorage.setItem('${prefix}_last_player_id', ${JSON.stringify(p.id)});
    localStorage.setItem('${prefix}_player_name', ${JSON.stringify(name)});
  })()`);
}

const shots = [
  { file: 'tv-pk', url: '/partykeller/tv', w: 1920, h: 1080, wait: 5000 },
  { file: 'tv-ys', url: '/youngstars/tv', w: 1920, h: 1080, wait: 5000 },
  { file: 'start', url: '/', w: 1920, h: 1080, wait: 3500 },
  { file: 'abende-desktop', url: '/partykeller/abende', w: 1920, h: 1080, wait: 3500 },
  { file: 'onboarding', url: '/partykeller/onboarding', w: 390, h: 844, scale: 3, mobile: true, wait: 3500 },
  { file: 'dashboard', url: '/partykeller/dashboard', w: 390, h: 844, scale: 3, mobile: true, wait: 4500, login: ['partykeller', 'pk', 'Basti'], full: true },
  { file: 'dashboard-ys', url: '/youngstars/dashboard', w: 390, h: 844, scale: 3, mobile: true, wait: 4500, login: ['youngstars', 'ys', 'Emma'] },
  { file: 'abende', url: '/partykeller/abende', w: 390, h: 844, scale: 3, mobile: true, wait: 3500, full: true },
  // Ein Tipp auf „Bier +" — danach Handy und TV im neuen Zustand
  { file: 'dashboard-tap', url: '/partykeller/dashboard', w: 390, h: 844, scale: 3, mobile: true, wait: 4500, login: ['partykeller', 'pk', 'Basti'], tap: '#add-beer' },
  { file: 'tv-pk-after', url: '/partykeller/tv', w: 1920, h: 1080, wait: 5000 },
  { file: 'profile', url: '/partykeller/dashboard', w: 390, h: 844, scale: 3, mobile: true, wait: 4000, login: ['partykeller', 'pk', 'Basti'], click: '#tab-btn-profile', full: true },
];

const meta = {};
for (const s of shots) {
  const page = await browser.newPage({ width: s.w, height: s.h, scale: s.scale ?? 1, mobile: !!s.mobile });
  if (s.login) await login(page, ...s.login);
  await page.goto(BASE + s.url);
  await sleep(s.wait);
  if (s.click) {
    await page.eval(`document.querySelector('${s.click}').click()`);
    await sleep(2500);
  }
  if (s.tap) {
    meta.tap = await page.eval(`(() => { const r = document.querySelector('${s.tap}').getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: ${s.w}, h: ${s.h} }; })()`);
    await page.eval(`document.querySelector('${s.tap}').click()`);
    await sleep(350);
    await page.screenshot(path.join(out, `${s.file}-pop.png`));
    await sleep(3000);
  }
  await page.screenshot(path.join(out, `${s.file}.png`));
  if (s.full) {
    // ganze Seite: alle Einblendungen auslösen, dann lang abfotografieren
    await page.eval(`(async () => {
      const h = document.documentElement.scrollHeight;
      for (let y = 0; y < h; y += 300) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
      window.scrollTo(0, 0);
    })()`);
    await sleep(1500);
    await page.screenshot(path.join(out, `${s.file}-full.png`), { fullPage: true });
  }
  await page.close();
  console.log('ok', s.file);
}

fs.writeFileSync(path.join(out, 'meta.json'), JSON.stringify(meta, null, 2));
await browser.close();

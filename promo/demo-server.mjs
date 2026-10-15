// Demo-Instanz für die Promo-Aufnahmen: eigener Port, eigene Wegwerf-DBs mit
// reproduzierbaren Fake-Daten. Die echten DBs in data/ werden nie angefasst.
// Aufruf: node promo/demo-server.mjs   (Port über PROMO_PORT, Standard 3199)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgDir = path.resolve(here, '..');
const workDir = path.join(here, 'work');
fs.mkdirSync(workDir, { recursive: true });

process.chdir(pkgDir); // .env (Secrets) liegt im Paket
process.env.PORT = process.env.PROMO_PORT ?? '3199';
process.env.DB_PATH = path.join(workDir, 'demo-pk.db');
process.env.YOUNGSTARS_DB_PATH = path.join(workDir, 'demo-ys.db');

for (const f of ['demo-pk.db', 'demo-ys.db']) {
  for (const ext of ['', '-wal', '-shm']) fs.rmSync(path.join(workDir, f + ext), { force: true });
}

const { createDb } = await import('../server/db.js');
const { hashPin } = await import('../server/auth.js');

// Deterministischer Zufall (mulberry32), damit jede Aufnahme gleich aussieht
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seed(dbPath, roster, seedNo) {
  const db = createDb(dbPath);
  const rand = rng(seedNo);
  const pin = hashPin('1111');
  const players = roster.map(([name, thirst]) => ({ p: db.createPlayer(name, pin), thirst }));
  const DAY = 24 * 3600 * 1000;
  const now = Date.now();
  // Sechs vergangene Abende (je Woche einer) plus der laufende Abend
  for (let w = 6; w >= 0; w--) {
    const start = w === 0 ? now - 3 * 3600 * 1000 : now - w * 7 * DAY - 3 * 3600 * 1000;
    const span = w === 0 ? 3 * 3600 * 1000 - 60 * 1000 : 5 * 3600 * 1000;
    for (const { p, thirst } of players) {
      if (w > 0 && rand() < 0.2) continue; // nicht jeder ist jedes Mal da
      const n = Math.round(thirst * (0.6 + rand() * 0.8));
      for (let i = 0; i < n; i++) {
        const r = rand();
        const drink = r < 0.62 ? 'beer' : r < 0.86 ? 'shot' : 'mix';
        db.logDrink(p.id, drink, Math.round(start + rand() * span));
      }
    }
  }
}

seed(process.env.DB_PATH, [
  ['Basti', 11], ['Flo', 10], ['Jule', 9], ['Mira', 8], ['Tom', 8],
  ['Nina', 7], ['Pauli', 6], ['Lea', 5], ['Kathi', 5], ['Jonas', 4],
], 7);
seed(process.env.YOUNGSTARS_DB_PATH, [
  ['Max', 8], ['Emma', 7], ['Luis', 7], ['Sophie', 6], ['Ben', 5], ['Lina', 4], ['Noah', 4],
], 11);

await import('../server/index.js');

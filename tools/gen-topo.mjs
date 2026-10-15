// Erzeugt die Höhenlinien public/assets/topo.svg (quer) und topo-portrait.svg (hoch)
// im Stil von landonorris.com: weiches Höhenfeld aus überlagerten Gauß-Hügeln +
// Sinus-Rauschen, Iso-Linien per Marching Squares, verkettet und mit Chaikin geglättet.
// Einmalig erzeugt (D-078):
//   node tools/gen-topo.mjs public/assets/topo.svg 7
//   node tools/gen-topo.mjs public/assets/topo-portrait.svg 99 1000 1600
import fs from 'node:fs';

const out = process.argv[2];
let seed = Number(process.argv[3] ?? 7);
const W = Number(process.argv[4] ?? 1600), H = Number(process.argv[5] ?? 1000);
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

const hills = Array.from({ length: 34 }, () => ({
  x: rnd() * W * 1.2 - W * 0.1, y: rnd() * H * 1.2 - H * 0.1,
  r: 70 + rnd() * 260, a: (rnd() - 0.4) * 1.6,
}));
const waves = Array.from({ length: 5 }, () => ({ fx: (rnd() - 0.5) * 0.012, fy: (rnd() - 0.5) * 0.012, p: rnd() * 6.28, a: 0.12 + rnd() * 0.12 }));
function field(x, y) {
  let v = 0;
  for (const h of hills) { const dx = x - h.x, dy = y - h.y; v += h.a * Math.exp(-(dx * dx + dy * dy) / (2 * h.r * h.r)); }
  for (const w of waves) v += w.a * Math.sin(x * w.fx + y * w.fy + w.p);
  return v;
}

const STEP = 8;
const nx = Math.ceil(W / STEP) + 1, ny = Math.ceil(H / STEP) + 1;
const g = new Float64Array(nx * ny);
let min = Infinity, max = -Infinity;
for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
  const v = field(i * STEP, j * STEP); g[j * nx + i] = v; if (v < min) min = v; if (v > max) max = v;
}

const LEVELS = 11;
const paths = [];
for (let l = 1; l < LEVELS; l++) {
  const iso = min + (max - min) * (l / LEVELS);
  const segs = [];
  const lerp = (a, b, va, vb) => a + (b - a) * ((iso - va) / (vb - va));
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const x = i * STEP, y = j * STEP;
    const a = g[j * nx + i], b = g[j * nx + i + 1], c = g[(j + 1) * nx + i + 1], d = g[(j + 1) * nx + i];
    const idx = (a > iso ? 8 : 0) | (b > iso ? 4 : 0) | (c > iso ? 2 : 0) | (d > iso ? 1 : 0);
    if (idx === 0 || idx === 15) continue;
    const top = [lerp(x, x + STEP, a, b), y], right = [x + STEP, lerp(y, y + STEP, b, c)];
    const bottom = [lerp(x, x + STEP, d, c), y + STEP], left = [x, lerp(y, y + STEP, a, d)];
    const table = {
      1: [[left, bottom]], 2: [[bottom, right]], 3: [[left, right]], 4: [[top, right]],
      5: [[left, top], [bottom, right]], 6: [[top, bottom]], 7: [[left, top]], 8: [[left, top]],
      9: [[top, bottom]], 10: [[left, bottom], [top, right]], 11: [[top, right]], 12: [[left, right]],
      13: [[bottom, right]], 14: [[left, bottom]],
    };
    for (const s of table[idx]) segs.push(s);
  }
  // Segmente zu Linienzügen verketten
  const key = (p) => `${Math.round(p[0] * 10)},${Math.round(p[1] * 10)}`;
  const byPt = new Map();
  segs.forEach((s, k) => { for (const p of s) { const kk = key(p); if (!byPt.has(kk)) byPt.set(kk, []); byPt.get(kk).push(k); } });
  const used = new Uint8Array(segs.length);
  for (let k = 0; k < segs.length; k++) {
    if (used[k]) continue;
    used[k] = 1;
    const line = [segs[k][0], segs[k][1]];
    for (const dir of [1, 0]) {
      for (;;) {
        const end = dir ? line[line.length - 1] : line[0];
        const cand = (byPt.get(key(end)) || []).find((m) => !used[m]);
        if (cand === undefined) break;
        used[cand] = 1;
        const [p, q] = segs[cand];
        const nxt = key(p) === key(end) ? q : p;
        if (dir) line.push(nxt); else line.unshift(nxt);
      }
    }
    if (line.length < 12) continue;
    // ausdünnen + Chaikin
    let pts = line.filter((_, n) => n % 2 === 0 || n === line.length - 1);
    for (let it = 0; it < 2; it++) {
      const res = [pts[0]];
      for (let n = 0; n < pts.length - 1; n++) {
        const [x0, y0] = pts[n], [x1, y1] = pts[n + 1];
        res.push([x0 * 0.75 + x1 * 0.25, y0 * 0.75 + y1 * 0.25], [x0 * 0.25 + x1 * 0.75, y0 * 0.25 + y1 * 0.75]);
      }
      res.push(pts[pts.length - 1]);
      pts = res;
    }
    pts = pts.filter((_, n) => n % 2 === 0 || n === pts.length - 1);
    const f = (v) => Math.round(v * 10) / 10;
    paths.push('M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L'));
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><path fill="none" stroke="#000" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round" d="${paths.join('')}"/></svg>\n`;
fs.writeFileSync(out, svg);
console.log(out, paths.length, 'Linien', (svg.length / 1024).toFixed(1), 'KB');

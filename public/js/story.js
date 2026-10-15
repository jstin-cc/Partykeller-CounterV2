// Abendrückblick als Bild im Story-Format (D-049): 1080 x 1920 auf einem
// Canvas, aus denselben Daten wie die Abend-Karte im Archiv. Alles passiert im
// Browser — kein Server, keine Bibliothek, funktioniert offline im WLAN.
//
// Seit D-078 im Stil von landonorris.com: Bereichsgrund mit Höhenlinien,
// Wortmarke, riesige Versal-Headline mit Serif-Akzent, der Abendsieger als
// Lime- bzw. Orange-Kerbenkarte mit Lorbeer, Plätze 2/3 als Versal-Zeilen
// zwischen Haarlinien, Bilanz in großen Zahlen und der Verlauf als Kurve in
// der Akzentfarbe. Formen (Kerbe, Kringel) kommen aus lando.js — dieselben
// wie auf den Seiten.
//
// Das Modul wird erst beim Klick auf den Story-Knopf geladen (dynamischer
// Import), damit die Archiv-Seite nicht bei jedem Aufruf mehr JavaScript holt.
import { AREA } from './area.js';
import { buildCurve } from './curve.js';
import { notchPath, SCRIBBLES } from './lando.js';

const W = 1080;
const H = 1920;
const PAD_X = 84;
const INNER = W - 2 * PAD_X;
const PAD_TOP = 145;      // oben und unten bleibt Luft für die Instagram-Bedienelemente
const PAD_BOTTOM = 205;

// Dieselben Schriften wie auf den Seiten (theme.css, lokal als woff2)
const SANS = "'Mona Sans', 'Arial Narrow', Arial, sans-serif";
const SERIF = "'Instrument Serif', 'Times New Roman', serif";

const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

// --- Hilfsmittel -----------------------------------------------------------

// Farben kommen aus den Tokens des Bereichs. Gelesen wird an einem kleinen
// Mess-Element mit .area-pk: html[data-surface] färbt die Seite
// beim Scrollen um (Creme im Abend-Abschnitt) — das Story-Bild bleibt aber
// immer im dunklen Bereichslook. Alle gelesenen Tokens sind Hex-Farben und
// damit canvas-lesbar (Haarlinien entstehen über globalAlpha, nicht über die
// halbtransparenten --line-Tokens).
function themeColors() {
  const probe = document.createElement('span');
  probe.className = 'area-pk';
  probe.hidden = true;
  document.body.append(probe);
  const css = getComputedStyle(probe);
  const val = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
  const c = {
    bg: val('--bg', '#0f131c'),
    ink: val('--ink', '#f4f4ed'),
    ink2: val('--ink-2', '#dde1d2'),
    muted: val('--ink-muted', '#b4b8a5'),
    faint: val('--ink-faint', '#80846f'),
    accent: val('--accent', '#ff6b00'),
    accentInk: val('--accent-ink', '#140a02'),
    accentText: val('--accent-text', '#ff8a3d'),
    topo: val('--topo-line', '#1d2433'),
    beer: val('--beer', '#ff6b00'),
    shot: val('--shot', '#f4f4ed'),
    mix: val('--mixc', '#2c3650'),
  };
  probe.remove();
  return c;
}

// SVGs werden als Text geholt und bekommen feste Maße: Ohne width/height
// zeichnen manche Browser ein SVG gar nicht auf ein Canvas.
async function loadSvg(file, width, height, patch = (s) => s) {
  let text;
  try {
    const res = await fetch(new URL(`../assets/${file}`, import.meta.url));
    if (!res.ok) throw new Error();
    text = await res.text();
  } catch {
    throw new Error(`Bild fehlt: ${file}`);
  }
  text = patch(text)
    .replace(/\s(width|height)="[^"]*"/g, '')
    .replace('<svg', `<svg width="${width}" height="${height}"`);
  const url = URL.createObjectURL(new Blob([text], { type: 'image/svg+xml' }));
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Bild fehlt: ${file}`));
      img.src = url;
    });
  } finally {
    // Erst nach dem Laden freigeben (onload ist dann schon durch)
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

// Schwarze Strichzeichnung (Höhenlinien, Lorbeer) in einer Farbe einfärben:
// auf eine eigene Ebene zeichnen, dann per source-in übermalen.
function tinted(img, w, h, color) {
  const layer = document.createElement('canvas');
  layer.width = Math.ceil(w);
  layer.height = Math.ceil(h);
  const lc = layer.getContext('2d');
  lc.drawImage(img, 0, 0, w, h);
  lc.globalCompositeOperation = 'source-in';
  lc.fillStyle = color;
  lc.fillRect(0, 0, w, h);
  return layer;
}

// Laufweite: moderne Browser kennen ctx.letterSpacing, sonst ohne.
function setFont(ctx, font, spacing = 0) {
  ctx.font = font;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${spacing}px`;
}

// Versalhöhe einer Schrift (für Oberkanten-genaues Setzen)
function capHeight(ctx, font) {
  ctx.font = font;
  const m = ctx.measureText('H');
  return m.actualBoundingBoxAscent || parseFloat(font.match(/(\d+)px/)[1]) * 0.72;
}

// Winzige Versal-Zeile wie .eyebrow
function eyebrow(ctx, str, x, y, { size = 24, color, align = 'left', weight = 650 }) {
  setFont(ctx, `${weight} ${size}px ${SANS}`, size * 0.08);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  const cap = capHeight(ctx, ctx.font);
  ctx.fillText(str.toUpperCase(), x, y + cap);
  return ctx.measureText(str.toUpperCase()).width;
}

// Größe suchen, bei der ein Text in die Breite passt; notfalls kürzen.
// Gibt Text und die gewählte Schrift zurück (die der Aufrufer auch benutzt).
function fitFont(ctx, str, maxWidth, { weight = 800, size, minSize, family = SANS, track = -0.03 }) {
  let px = size;
  const font = (p) => `${weight} ${p}px ${family}`;
  setFont(ctx, font(px), px * track);
  while (px > minSize && ctx.measureText(str).width > maxWidth) {
    px -= 2;
    setFont(ctx, font(px), px * track);
  }
  let text = str;
  if (ctx.measureText(str).width > maxWidth) {
    while (text.length > 1 && ctx.measureText(`${text}…`).width > maxWidth) text = text.slice(0, -1);
    text = `${text.trimEnd()}…`;
  }
  return { text, px, font: font(px), spacing: px * track };
}

// Längere Abendnamen auf höchstens zwei Zeilen umbrechen; erst kleiner setzen.
function wrapFit(ctx, str, maxWidth, { size, minSize, family = SERIF, weight = 400, lines: maxLines = 2 }) {
  const words = str.split(/\s+/).filter(Boolean);
  const layout = (px) => {
    setFont(ctx, `${weight} ${px}px ${family}`, 0);
    const lines = [];
    let cur = '';
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (!cur || ctx.measureText(next).width <= maxWidth) cur = next;
      else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    return lines;
  };
  let px = size;
  let lines = layout(px);
  while (px > minSize && (lines.length > maxLines || lines.some((l) => ctx.measureText(l).width > maxWidth))) {
    px -= 4;
    lines = layout(px);
  }
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    lines[maxLines - 1] += '…';
  }
  // Einzelne überlange Wörter notfalls kürzen
  lines = lines.map((l) => {
    let t = l;
    while (t.length > 1 && ctx.measureText(t).width > maxWidth) t = `${t.slice(0, -2)}…`;
    return t;
  });
  return { lines, px, font: `${weight} ${px}px ${family}` };
}

function hairline(ctx, y, c, alpha = 0.18, x = PAD_X, w = INNER) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = c.ink;
  ctx.fillRect(x, Math.round(y), w, 2);
  ctx.restore();
}

// Kringel aus lando.js (gleiche Form wie auf der Seite) in beliebige Box
// gestreckt; die Strichstärke bleibt dabei gleich.
function drawScribble(ctx, name, x, y, w, h, color, width) {
  const s = SCRIBBLES[name];
  const [, , vw, vh] = s.vb.split(' ').map(Number);
  const path = new Path2D();
  path.addPath(new Path2D(s.d), new DOMMatrix([w / vw, 0, 0, h / vh, x, y]));
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke(path);
  ctx.restore();
}

// Kerben-Karte wie auf den Seiten (notchPath aus lando.js), verschoben an x/y
function notchShape(x, y, w, h, opts) {
  const p = new Path2D();
  p.addPath(new Path2D(notchPath(w, h, opts)), new DOMMatrix([1, 0, 0, 1, x, y]));
  return p;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const hourLabel = (h) => `${((h % 24) + 24) % 24} Uhr`;
const drinks = (n) => (n === 1 ? 'Getränk' : 'Getränke');

// --- Bausteine -------------------------------------------------------------
// Jeder Baustein kennt seine Höhe und zeichnet sich ab einer Oberkante y.

// Kopf: Wortmarke links (Serif über fetter Grotesk), rechts Lorbeer + Zeile
function topBlock(c, laurel, lines = ['Abendrückblick', 'aus dem Abend-Archiv']) {
  const [top, bottom] = ['Party', 'Keller'];
  return {
    height: 86,
    draw(ctx, y) {
      const fTop = `400 50px ${SERIF}`;
      const fBottom = `800 45px ${SANS}`;
      ctx.fillStyle = c.ink;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      setFont(ctx, fTop, -0.5);
      const capT = capHeight(ctx, fTop);
      ctx.fillText(top.toUpperCase(), PAD_X, y + capT);
      setFont(ctx, fBottom, -1.4);
      ctx.fillText(bottom.toUpperCase(), PAD_X, y + capT + 42);

      const size = 76;
      ctx.drawImage(tinted(laurel, size, size, c.accentText), W - PAD_X - size, y + 2, size, size);
      eyebrow(ctx, lines[0], W - PAD_X - size - 18, y + 20, { size: 21, color: c.ink2, align: 'right' });
      eyebrow(ctx, lines[1], W - PAD_X - size - 18, y + 50, { size: 21, color: c.muted, align: 'right' });
    },
  };
}

// Riesige Versal-Headline: Wochentag in Mona, darunter Datum bzw. Abendname
// in der Serif (Akzentfarbe) mit selbstgezeichnetem Unterstrich-Kringel
function headBlock(ctx, night, c, L) {
  const eyebrowText = night.name ? `${night.weekday}, ${night.date}` : 'Der Abend im Überblick';
  const weekday = fitFont(ctx, night.weekday.toUpperCase(), INNER, { size: L.week, minSize: Math.min(L.week, 110), track: -0.035 });
  const accent = night.name
    ? wrapFit(ctx, night.name.toUpperCase(), INNER, { size: L.name, minSize: Math.min(L.name, 88) })
    : wrapFit(ctx, night.date, INNER, { size: L.date, minSize: Math.min(L.date, 110), lines: 1 });
  const capW = capHeight(ctx, weekday.font);
  const capA = capHeight(ctx, accent.font);
  const lineA = accent.px * 0.9;
  const EYE = 26;
  const height = EYE + 30 + capW + 34 + capA + lineA * (accent.lines.length - 1) + 40;
  return {
    height,
    draw(ctx2, y) {
      eyebrow(ctx2, eyebrowText, PAD_X, y, { size: 24, color: c.muted });
      let base = y + EYE + 30 + capW;
      setFont(ctx2, weekday.font, weekday.spacing);
      ctx2.fillStyle = c.ink;
      ctx2.textAlign = 'left';
      ctx2.textBaseline = 'alphabetic';
      ctx2.fillText(weekday.text, PAD_X - 4, base);

      base += 34 + capA;
      setFont(ctx2, accent.font, 0);
      ctx2.fillStyle = c.accentText;
      let lastW = 0;
      accent.lines.forEach((line, i) => {
        // Instrument Serif ist feiner als Landos „Brier" — wie auf den Seiten
        // (theme.css) mit einer hauchdünnen Kontur etwas kräftiger
        const by = base + lineA * i;
        ctx2.lineWidth = accent.px * 0.03;
        ctx2.strokeStyle = c.accentText;
        ctx2.lineJoin = 'round';
        ctx2.strokeText(line, PAD_X - 2, by);
        ctx2.fillText(line, PAD_X - 2, by);
        lastW = ctx2.measureText(line).width;
      });
      const uy = base + lineA * (accent.lines.length - 1) + 6;
      drawScribble(ctx2, 'underline', PAD_X - 14, uy, Math.min(INNER, lastW + 30), 30, c.accent, 7);
    },
  };
}

// Abendsieger als gefüllte Kerben-Karte (wie der Rekord in der Hall of Fame):
// Name riesig in Versalien, rechts Lorbeer mit Serif-Initiale, im Etikett
// in der Kerbe die Getränkezahl.
function winnerBlock(ctx, first, c, laurel, L) {
  const CARD_H = L.winner;
  const TAB_H = 64;
  const TAB_W = 316;
  const CREST = 164;
  const nameMax = INNER - 44 - CREST - 40;
  const name = fitFont(ctx, first.name.toUpperCase(), nameMax, { size: Math.round(Math.min(124, CARD_H * 0.44)), minSize: 58, track: -0.035 });
  return {
    height: CARD_H,
    draw(ctx2, y) {
      const shape = notchShape(PAD_X, y, INNER, CARD_H, { tabW: TAB_W, tabH: TAB_H, r: 26, slant: 34 });
      ctx2.fillStyle = c.accent;
      ctx2.fill(shape);

      eyebrow(ctx2, 'Abendsieger', PAD_X + 40, y + 40, { size: 23, color: c.accentInk, weight: 750 });
      setFont(ctx2, name.font, name.spacing);
      ctx2.fillStyle = c.accentInk;
      ctx2.textAlign = 'left';
      ctx2.textBaseline = 'alphabetic';
      ctx2.fillText(name.text, PAD_X + 38, y + CARD_H - TAB_H - 30);

      // Lorbeer mit Namenskreis (Initiale in der Serif)
      const cx = W - PAD_X - 40 - CREST / 2;
      const cy = y + (CARD_H - TAB_H) / 2 + 4;
      ctx2.drawImage(tinted(laurel, CREST, CREST, c.accentInk), cx - CREST / 2, cy - CREST / 2, CREST, CREST);
      ctx2.fillStyle = c.accentInk;
      ctx2.beginPath();
      ctx2.arc(cx, cy, 46, 0, Math.PI * 2);
      ctx2.fill();
      setFont(ctx2, `400 66px ${SERIF}`, 0);
      ctx2.fillStyle = c.accent;
      ctx2.textAlign = 'center';
      const initial = ([...first.name.trim()][0] ?? '?').toUpperCase();
      ctx2.fillText(initial, cx, cy + capHeight(ctx2, ctx2.font) / 2);

      // Etikett in der Kerbe: steht auf dem Seitengrund
      const tagY = y + CARD_H - 10;
      setFont(ctx2, `800 54px ${SANS}`, -1.5);
      ctx2.fillStyle = c.accent;
      ctx2.textAlign = 'right';
      ctx2.fillText(String(first.total), W - PAD_X - 6, tagY);
      const numW = ctx2.measureText(String(first.total)).width;
      eyebrow(ctx2, drinks(first.total), W - PAD_X - 6 - numW - 16, tagY - 22, { size: 22, color: c.ink2, align: 'right' });
    },
  };
}

// Plätze 2 und 3 als Versal-Zeilen zwischen Haarlinien
function placesBlock(ctx, rest, c) {
  const ROW = 92;
  return {
    height: ROW * rest.length,
    draw(ctx2, y) {
      rest.forEach((p, i) => {
        const ry = y + ROW * i;
        hairline(ctx2, ry, c);
        const base = ry + ROW / 2 + 18;
        setFont(ctx2, `800 30px ${SANS}`, 0);
        ctx2.fillStyle = c.accentText;
        ctx2.textAlign = 'left';
        ctx2.textBaseline = 'alphabetic';
        ctx2.fillText(String(i + 2).padStart(2, '0'), PAD_X, base - 6);

        setFont(ctx2, `800 50px ${SANS}`, -1.5);
        ctx2.textAlign = 'right';
        ctx2.fillStyle = c.ink;
        ctx2.fillText(String(p.total), W - PAD_X, base);
        const numW = ctx2.measureText(String(p.total)).width;
        eyebrow(ctx2, drinks(p.total), W - PAD_X - numW - 14, base - 22, { size: 19, color: c.muted, align: 'right' });

        const nameMax = INNER - 84 - numW - 170;
        const name = fitFont(ctx2, p.name.toUpperCase(), nameMax, { size: 52, minSize: 30, track: -0.025 });
        ctx2.fillStyle = c.ink;
        ctx2.textAlign = 'left';
        ctx2.fillText(name.text, PAD_X + 84, base);
      });
      hairline(ctx2, y + ROW * rest.length, c);
    },
  };
}

// Bilanz: vier große Zahlen, darunter Versal-Label mit Farbquadrat
// (gleiche Reihenfolge und Farben wie die Kennzahlen der Abend-Karte)
function statsBlock(night, c) {
  const cells = [
    ['Bier', night.beers, c.beer],
    ['Shots', night.shots, c.shot],
    ['Mischen', night.mixes, c.mix],
    ['Gesamt', night.total, c.ink],
  ];
  const cw = INNER / cells.length;
  return {
    height: 148,
    draw(ctx, y) {
      cells.forEach(([label, value, color], i) => {
        const x = PAD_X + cw * i;
        const f = `800 86px ${SANS}`;
        setFont(ctx, f, -3);
        ctx.fillStyle = i === cells.length - 1 ? c.accentText : c.ink;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        const cap = capHeight(ctx, f);
        ctx.fillText(String(value), x, y + cap);
        const ly = y + cap + 34;
        ctx.fillStyle = color;
        ctx.fillRect(x, ly + 2, 16, 16);
        eyebrow(ctx, label, x + 26, ly + 1, { size: 20, color: c.muted });
      });
    },
  };
}

// Verlauf pro Stunde als Kontur-Kerbenkarte: Kurve in der Akzentfarbe,
// Spitzenstunde als Akzent-Streifen, im Etikett die Teilnehmerzahl.
function curveBlock(night, c, L) {
  const { timeline } = night;
  const CARD_H = L.curve;
  const TAB_W = 300;
  const TAB_H = 58;
  const x0 = PAD_X + 36;
  const plotW = INNER - 72;
  // Die Zeitachse endet oberhalb der Kerbe, damit „1 Uhr" nicht auf der
  // Stufe steht
  const PLOT_H = CARD_H - 208;
  const { max, peak, xAt, yAt, segments, points } = buildCurve(timeline.counts, plotW, PLOT_H, 18);
  const n = timeline.counts.length;
  const people = night.participants === 1 ? '1 Teilnehmer' : `${night.participants} Teilnehmer`;
  return {
    height: CARD_H,
    draw(ctx, y) {
      const shape = notchShape(PAD_X, y, INNER, CARD_H, { tabW: TAB_W, tabH: TAB_H, r: 26, slant: 32, inset: 1 });
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = c.ink;
      ctx.lineWidth = 2;
      ctx.stroke(shape);
      ctx.restore();

      eyebrow(ctx, 'Verlauf pro Stunde', x0, y + 38, { size: 22, color: c.muted });
      // Spitze als Akzent-Chip oben rechts
      const chip = `Spitze ${hourLabel(timeline.startHour + peak)} · ${max}`.toUpperCase();
      setFont(ctx, `800 23px ${SANS}`, 1);
      const cwid = ctx.measureText(chip).width + 36;
      roundRect(ctx, W - PAD_X - 36 - cwid, y + 26, cwid, 46, 9);
      ctx.fillStyle = c.accent;
      ctx.fill();
      ctx.fillStyle = c.accentInk;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(chip, W - PAD_X - 36 - cwid / 2, y + 50);

      const py0 = y + 104;
      ctx.save();
      ctx.translate(x0, py0);
      // Spitzenstunde als Streifen hinter der Kurve (wie auf der Karte)
      const step = n === 1 ? plotW : plotW / (n - 1);
      const bandW = Math.min(plotW, Math.max(26, step * 0.55));
      const bandX = Math.min(plotW - bandW, Math.max(0, xAt(peak) - bandW / 2));
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = c.accent;
      ctx.fillRect(bandX, 0, bandW, PLOT_H);

      const trace = () => {
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        if (segments.length === 0) ctx.lineTo(plotW, points[0][1]);
        for (const s of segments) ctx.bezierCurveTo(s[0], s[1], s[2], s[3], s[4], s[5]);
      };
      trace();
      ctx.lineTo(plotW, PLOT_H);
      ctx.lineTo(0, PLOT_H);
      ctx.closePath();
      ctx.globalAlpha = 0.14;
      ctx.fill();

      ctx.globalAlpha = 0.3;
      ctx.fillStyle = c.ink;
      ctx.fillRect(0, PLOT_H, plotW, 2);
      ctx.globalAlpha = 1;

      trace();
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 6;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();

      // Spitze: Punkt in Akzent mit Ring in Grundfarbe
      const px = xAt(peak);
      const pyy = yAt(max);
      ctx.beginPath();
      ctx.arc(px, pyy, 14, 0, Math.PI * 2);
      ctx.fillStyle = c.bg;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px, pyy, 9, 0, Math.PI * 2);
      ctx.fillStyle = c.accent;
      ctx.fill();
      ctx.restore();

      // Zeitachse: erste und letzte Stunde des Abends
      eyebrow(ctx, hourLabel(timeline.startHour), x0, py0 + PLOT_H + 14, { size: 20, color: c.muted });
      if (n > 1) {
        eyebrow(ctx, hourLabel(timeline.startHour + n - 1), x0 + plotW, py0 + PLOT_H + 14, { size: 20, color: c.muted, align: 'right' });
      }

      // Etikett in der Kerbe
      eyebrow(ctx, people, W - PAD_X - 6, y + CARD_H - TAB_H / 2 - 10, { size: 22, color: c.ink2, align: 'right' });
    },
  };
}

// Fuß: Serif-Zeile links, Bereich und (ohne Kurve) Teilnehmer rechts
function footBlock(night, c, withPeople) {
  const people = night.participants === 1 ? '1 Teilnehmer' : `${night.participants} Teilnehmer`;
  return {
    height: 70,
    draw(ctx, y) {
      hairline(ctx, y, c);
      setFont(ctx, `400 44px ${SERIF}`, 0);
      ctx.fillStyle = c.ink2;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('Prost auf den nächsten.', PAD_X, y + 60);
      eyebrow(ctx, withPeople ? `${people} · ${AREA.name}` : AREA.name, W - PAD_X, y + 34, { size: 20, color: c.muted, align: 'right' });
    },
  };
}

// --- Bild bauen ------------------------------------------------------------

// Satzstufen: Schriftgrößen der Headline und Höhen von Sieger- und
// Kurvenkarte, von großzügig bis kompakt
const LEVELS = [
  { week: 188, name: 164, date: 176, winner: 272, curve: 360 },
  { week: 164, name: 136, date: 156, winner: 258, curve: 340 },
  { week: 140, name: 112, date: 136, winner: 246, curve: 320 },
  { week: 120, name: 90, date: 116, winner: 240, curve: 300 },
];

// Eine flache Linie sagt nichts: der Verlauf kommt erst ab drei Stunden mit
// unterschiedlichen Werten aufs Bild.
function hasCurve(timeline) {
  const counts = timeline?.counts ?? [];
  return counts.length >= 3 && Math.max(...counts) > Math.min(...counts);
}

export async function buildStoryBlob(night, top) {
  const c = themeColors();
  await Promise.all([
    document.fonts.load(`800 80px ${SANS}`),
    document.fonts.load(`600 24px ${SANS}`),
    document.fonts.load(`80px ${SERIF}`),
  ]);
  // Höhenlinien etwas kräftiger als auf dem Bildschirm, damit sie das
  // Komprimieren in der Story-App überstehen
  const [topoImg, laurelImg] = await Promise.all([
    loadSvg('topo-portrait.svg', W, H, (s) => s.replace(/stroke-width="[^"]*"/, 'stroke-width="1.7"')),
    loadSvg('laurel.svg', 256, 256),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Bild konnte nicht erstellt werden');

  // Bausteine vorbereiten und die Höhen kennen, bevor gezeichnet wird. Mit
  // langem Abendnamen, drei Plätzen und Kurve wird es eng: dann Stufe für
  // Stufe kompakter setzen, bis alles zwischen die Instagram-Ränder passt.
  const curve = hasCurve(night.timeline);
  const [first, ...rest] = top;
  const MIN_GAP = 30;
  const avail = H - PAD_TOP - PAD_BOTTOM;
  let blocks;
  for (const L of LEVELS) {
    blocks = [topBlock(c, laurelImg), headBlock(ctx, night, c, L), winnerBlock(ctx, first, c, laurelImg, L)];
    if (rest.length) blocks.push(placesBlock(ctx, rest, c));
    blocks.push(statsBlock(night, c));
    if (curve) blocks.push(curveBlock(night, c, L));
    blocks.push(footBlock(night, c, !curve));
    const need = blocks.reduce((sum, b) => sum + b.height, 0) + MIN_GAP * (blocks.length - 1);
    if (need <= avail) break;
  }

  // Zwischenräume gleichmäßig verteilen (höchstens 120 px, Rest mittig)
  const used = blocks.reduce((sum, b) => sum + b.height, 0);
  const free = avail - used;
  const gap = Math.max(MIN_GAP, Math.min(free / (blocks.length - 1), 120));
  let y = PAD_TOP + Math.max(0, (free - gap * (blocks.length - 1)) / 2);
  const positions = blocks.map((b) => { const at = y; y += b.height + gap; return at; });
  const winnerY = positions[2] + blocks[2].height / 2;

  // Grund, Höhenlinien und ein Akzent-Schein hinter dem Sieger (wie das
  // Spotlight auf den Seiten)
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(tinted(topoImg, W, H, c.topo), 0, 0);
  const glow = tinted(topoImg, W, H, c.accent);
  const gc = glow.getContext('2d');
  gc.globalCompositeOperation = 'destination-in';
  const g = gc.createRadialGradient(W * 0.72, winnerY, 0, W * 0.72, winnerY, 560);
  g.addColorStop(0, 'rgba(0,0,0,0.55)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  gc.fillStyle = g;
  gc.fillRect(0, 0, W, H);
  ctx.drawImage(glow, 0, 0);

  blocks.forEach((b, i) => b.draw(ctx, positions[i]));

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Bild konnte nicht erstellt werden'))), 'image/png');
  });
}

// '2026-09-05' -> { date: '05.09.2026', weekday: 'Samstag' }
function fmtDay(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return {
    date: `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`,
    weekday: WEEKDAYS[new Date(y, m - 1, d).getDay()],
  };
}

// Story eines Abends bauen und als PNG speichern. `night` ist der Eintrag aus
// /api/archive; die Plätze kommen aus der Tagesliste, die schon nach Menge
// sortiert ist (Personen ohne Getränke bleiben draußen).
export async function downloadStory(night) {
  const res = await fetch(`${AREA.base}/api/archive/${night.day}`);
  if (!res.ok) throw new Error('Abend konnte nicht geladen werden');
  const { players } = await res.json();
  const top = players.filter((p) => p.total > 0).slice(0, 3).map((p) => ({ name: p.name, total: p.total }));
  if (top.length === 0) throw new Error('Dieser Abend hat keine Getränke');

  const blob = await buildStoryBlob({ ...night, ...fmtDay(night.day) }, top);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${AREA.id}-abend-${night.day}.png`;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Jahresrückblick (L23, D-095) -------------------------------------------
// Ein Bild mit der Bilanz eines Jahres aus /api/players/:id/review: Kopf wie
// die Abend-Story, „Dein Jahr" mit der Jahreszahl in der Serif, die Summe als
// Riesenzahl, darunter Mischung und vier Kennzahlen.
const DRINK_NAMES = { beer: 'Bier', shot: 'Shots', mix: 'Mischen' };

export async function buildReviewBlob(r, name) {
  const c = themeColors();
  await Promise.all([
    document.fonts.load(`800 80px ${SANS}`),
    document.fonts.load(`600 24px ${SANS}`),
    document.fonts.load(`80px ${SERIF}`),
  ]);
  const [topoImg, laurelImg] = await Promise.all([
    loadSvg('topo-portrait.svg', W, H, (t) => t.replace(/stroke-width="[^"]*"/, 'stroke-width="1.7"')),
    loadSvg('laurel.svg', 256, 256),
  ]);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Bild konnte nicht erstellt werden');

  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(tinted(topoImg, W, H, c.topo), 0, 0);
  const glow = tinted(topoImg, W, H, c.accent);
  const gc = glow.getContext('2d');
  gc.globalCompositeOperation = 'destination-in';
  const g = gc.createRadialGradient(W * 0.7, 1040, 0, W * 0.7, 1040, 600);
  g.addColorStop(0, 'rgba(0,0,0,0.55)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  gc.fillStyle = g;
  gc.fillRect(0, 0, W, H);
  ctx.drawImage(glow, 0, 0);

  topBlock(c, laurelImg, ['Jahresrückblick', name]).draw(ctx, PAD_TOP);

  // „Dein Jahr" + Jahreszahl
  let y = PAD_TOP + 190;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const fHead = `800 150px ${SANS}`;
  setFont(ctx, fHead, -5);
  ctx.fillStyle = c.ink;
  const capHead = capHeight(ctx, fHead);
  ctx.fillText('DEIN JAHR', PAD_X - 4, y + capHead);
  y += capHead + 40;
  const fYear = `400 300px ${SERIF}`;
  setFont(ctx, fYear, -4);
  ctx.fillStyle = c.accentText;
  const capYear = capHeight(ctx, fYear);
  ctx.fillText(String(r.year), PAD_X - 8, y + capYear);
  const yearW = ctx.measureText(String(r.year)).width;
  drawScribble(ctx, 'underline', PAD_X, y + capYear + 6, Math.min(INNER, yearW + 20), 44, c.accent, 8);

  // Summe als Riesenzahl
  y += capYear + 130;
  const total = fitFont(ctx, String(r.total), INNER, { size: 330, minSize: 200, track: -0.055 });
  setFont(ctx, total.font, total.spacing);
  ctx.fillStyle = c.ink;
  const capTotal = capHeight(ctx, total.font);
  ctx.fillText(total.text, PAD_X - 10, y + capTotal);
  y += capTotal + 30;
  eyebrow(ctx, `Getränke an ${r.nights} ${r.nights === 1 ? 'Abend' : 'Abenden'}`, PAD_X, y, { size: 26, color: c.ink2 });

  // Mischung als Balken mit Legende
  y += 90;
  const parts = [['beer', c.beer], ['shot', c.shot], ['mix', c.mix]];
  let x = PAD_X;
  ctx.save();
  roundRect(ctx, PAD_X, y, INNER, 34, 8);
  ctx.clip();
  for (const [k, col] of parts) {
    const w = r.total ? (r.drinks[k] / r.total) * INNER : 0;
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, 34);
    x += w;
  }
  ctx.restore();
  y += 62;
  parts.forEach(([k, col], i) => {
    const lx = PAD_X + (INNER / 3) * i;
    ctx.fillStyle = col;
    ctx.fillRect(lx, y + 2, 18, 18);
    eyebrow(ctx, `${DRINK_NAMES[k]} ${r.drinks[k]}`, lx + 30, y, { size: 22, color: c.muted });
  });

  // Vier Kennzahlen
  y += 110;
  const cells = [
    ['Bester Abend', r.best ? String(r.best.total) : '–'],
    ['Abendsiege', String(r.wins)],
    ['Stunde', r.topHour ? `${r.topHour.hour}` : '–'],
    ['Platz', r.rank ? `${r.rank}` : '–'],
  ];
  const cw = INNER / cells.length;
  cells.forEach(([label, value], i) => {
    const cx = PAD_X + cw * i;
    const f = `800 96px ${SANS}`;
    setFont(ctx, f, -3);
    ctx.fillStyle = i === 0 ? c.accentText : c.ink;
    ctx.textAlign = 'left';
    const cap = capHeight(ctx, f);
    ctx.fillText(value, cx, y + cap);
    eyebrow(ctx, label === 'Stunde' ? 'Uhr (stärkste)' : label === 'Platz' ? `Platz von ${r.of}` : label, cx, y + cap + 26, { size: 20, color: c.muted });
  });

  // Fuß wie bei der Abend-Story
  const fy = H - PAD_BOTTOM - 70;
  hairline(ctx, fy, c);
  setFont(ctx, `400 44px ${SERIF}`, 0);
  ctx.fillStyle = c.ink2;
  ctx.textAlign = 'left';
  ctx.fillText(`Prost auf ${r.year + 1}.`, PAD_X, fy + 60);
  eyebrow(ctx, AREA.name, W - PAD_X, fy + 34, { size: 20, color: c.muted, align: 'right' });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Bild konnte nicht erstellt werden'))), 'image/png');
  });
}

export async function downloadReviewStory(r, name) {
  const blob = await buildReviewBlob(r, name);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${AREA.id}-jahr-${r.year}.png`;
  a.click();
  URL.revokeObjectURL(url);
}

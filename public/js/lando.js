import { initTopoFluid } from './topo-fluid.js';

// Lando-Stil (D-078): gemeinsame Bewegungs- und Form-Helfer für alle Seiten.
// Vorbild ist landonorris.com — Einblenden beim Scrollen, Wörter, die aus
// einer Maske gleiten, handgezeichnete Kringel, die sich selbst zeichnen,
// Karten mit Kerbe unten rechts, das Vollbild-Menü, Laufband und Spotlight
// auf den Höhenlinien. Reines ES-Modul ohne Abhängigkeiten; alles respektiert
// „Bewegung reduzieren" und fängt keine Tipps ab.

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

// Die versteckten Ausgangszustände der Einblendungen gelten nur mit dieser
// Klasse — ohne JS bleibt alles sichtbar. Die Seiten setzen sie schon im
// <head>, damit nichts aufblitzt; hier zur Sicherheit noch einmal.
document.documentElement.classList.add('js-motion');

/* ------------------------------------------------------------------------
   Handgezeichnete Kringel (Unterstrich, Kreis, Pfeil, Durchstreichen …).
   Jeder Pfad hat pathLength="1", damit die Zeichen-Animation über
   stroke-dashoffset für alle Formen gleich funktioniert.
   ------------------------------------------------------------------------ */
export const SCRIBBLES = {
  underline: {
    vb: '0 0 240 30',
    d: 'M5 19C52 10 118 6 168 9c25 1 46 4 66 9M22 25c44-6 104-8 160-4',
  },
  circle: {
    vb: '0 0 260 130',
    d: 'M176 14C128 1 58 6 24 34-4 58 12 104 88 118c64 12 150 0 164-40 11-32-26-64-92-72-40-5-80 1-104 12',
  },
  arrow: {
    vb: '0 0 140 80',
    d: 'M8 70C28 34 64 14 116 22M100 8l18 15-16 18',
  },
  strike: {
    vb: '0 0 240 30',
    d: 'M4 18c26-8 44 6 70-2s46-9 74-2 52 5 88-6',
  },
  tick: {
    vb: '0 0 60 50',
    d: 'M6 28c8 5 13 10 17 17 9-18 20-31 32-40',
  },
  loop: {
    vb: '0 0 200 70',
    d: 'M6 52c30-2 52-14 62-30 7-12-4-19-12-10-10 12 4 32 30 34 34 3 64-10 108-30',
  },
  signature: {
    // SV-Partykeller-Unterschrift (D-088): ein Zug, nur der t-Strich setzt ab
    vb: '0 0 268 141',
    d: 'M 33.3 80.9 C 38.1 91.8 58.4 82.1 58.9 68.3 C 59.3 57.7 39.8 64.2 47.2 46.1 C 53 32.1 69 25.5 74.1 32.7 C 70.4 50.1 68.3 65.4 66.4 80 C 76.8 58.9 88.6 37 102.8 17.1 C 89.2 53 72.5 97 57.4 136.9 C 71.5 96.5 89.3 50.5 104.1 18.7 C 141.6 -4.7 149.1 23.2 118.2 42.9 C 108.1 49.1 101.2 46.6 99 39.2 C 102.6 46.3 106.9 52.3 107.3 55.9 C 105.1 53.8 99 62.7 99.7 69.8 C 99.9 73.2 103.3 69.1 107 57.2 C 106.6 63.7 103.1 71.4 107.5 69.7 C 108.4 65.4 110.5 57.9 112.4 55.7 C 112.3 58.9 114.5 56.8 116.4 54.3 C 115.2 60.5 114.2 65.6 115.9 67.9 C 116.7 63 122.7 47.5 128.1 31.9 C 123.2 48.5 118 63.3 120.4 66.7 C 121.9 64.7 122.9 57.2 125.6 53.8 C 122.4 62.3 123.6 65.8 125.6 63.8 C 127.7 60.9 129.7 54.9 131 51.3 C 125.8 69.3 122.7 81.9 118.7 82.9 C 116 86.2 119.3 77 124.6 71.4 C 126.5 69.8 129.1 66 130.4 64.9 C 135.4 53.9 140.1 38.1 146 19.3 C 140.5 38.4 134.9 55 131.4 65.8 C 135.9 55.6 140.5 48.9 141.1 51.3 C 141.2 56.2 136.7 58.8 135 57.1 C 136.5 60.6 137.5 65.2 139.9 65.1 C 142.2 62.3 146.3 54.7 145.7 50.7 C 146.9 46.8 141.7 53.5 141.5 57.6 C 139.7 65.9 142.4 64.9 146.3 60.9 C 149.7 52.2 154.7 37.6 157.2 28.6 C 157.2 24.2 155.5 24.6 152.1 38.8 C 147.7 52.2 145.5 64.1 148 63.4 C 153.5 52.6 157.5 41 160.2 32.4 C 160 27.4 157.5 29 154.5 40.4 C 150.9 53.2 150.4 63.3 151.8 62.6 C 154.8 60 158.3 54.4 157.9 50.9 C 158.7 48.3 154.7 54.6 154.2 56.6 C 153.5 63.3 156.1 61 158.3 57.2 C 159.5 55.2 161.3 51.1 161.3 50.6 C 162.1 52.1 163.9 50.7 166.8 46.8 C 163.9 51.5 164.5 56.5 165.4 55.2 C 197.5 50.7 231.7 29.1 252.8 11.1 C 260.2 4.9 258.7 1.4 251.7 6.4 C 204 38.4 116.6 88.6 12.2 126.2 C 1.5 130 1.2 135.6 11.5 131.3 C 70.3 112.9 152.6 82.8 210.6 58.3 C 236.3 47.6 252.6 39.7 264 33.4 M 120.8 48.7 C 128.7 44.8 137.8 40.7 149.5 33.1',
  },
};

// SVG-Markup eines Kringels als String (für Templates). Mit draw=true wartet er
// auf .is-drawn (siehe drawScribble / initScribbles), sonst steht er sofort da.
export function scribble(name, { cls = '', draw = true, stretch = true } = {}) {
  const s = SCRIBBLES[name] ?? SCRIBBLES.underline;
  const par = stretch ? ' preserveAspectRatio="none"' : '';
  return `<svg class="scribble scribble--${name}${draw ? '' : ' is-drawn is-static'}${cls ? ' ' + cls : ''}" viewBox="${s.vb}"${par} fill="none" aria-hidden="true" focusable="false"><path d="${s.d}" pathLength="1"/></svg>`;
}

// Zeichnet einen Kringel (neu). restart=true spielt die Animation erneut ab.
export function drawScribble(svg, { restart = false, delay = 0 } = {}) {
  if (!svg) return;
  if (restart) { svg.classList.remove('is-drawn'); void svg.getBoundingClientRect(); }
  if (delay) svg.style.setProperty('--draw-delay', `${delay}ms`);
  svg.classList.add('is-drawn');
}

// Kringel mit data-draw zeichnen sich, sobald sie ins Bild kommen.
export function initScribbles(root = document) {
  const els = [...root.querySelectorAll('.scribble[data-draw]:not(.is-drawn)')];
  observeOnce(els, (el) => drawScribble(el, { delay: Number(el.dataset.draw) || 0 }));
}

/* ------------------------------------------------------------------------
   Einblenden beim Scrollen: data-reveal="up" | "fade" | "words" | "wipe" |
   "scale". data-delay="120" verzögert in ms.
   "words" zerlegt den Text in Wörter, die einzeln aus einer Maske gleiten —
   nur für statische Überschriften verwenden (JS-befüllte Texte würden die
   Zerlegung wieder überschreiben, dann einfach "up" nehmen).
   ------------------------------------------------------------------------ */
export function initReveal(root = document) {
  const els = [...root.querySelectorAll('[data-reveal]:not(.is-in)')];
  for (const el of els) {
    if (el.dataset.delay) el.style.setProperty('--d', el.dataset.delay);
    if (el.dataset.reveal === 'words' && !el.dataset.split) splitWords(el);
  }
  // Beim Kaltstart-Bild (D-093) erst einblenden, wenn es wegwischt
  const run = () => observeOnce(els, (el) => el.classList.add('is-in'));
  const boot = document.documentElement.pkBootDone;
  if (boot) boot.then(() => setTimeout(run, 280)); else run();
}

// Sofort einblenden (z. B. nach dem Umschalten eines Tabs, wenn der Inhalt
// schon im Bild ist).
export function revealNow(root = document) {
  root.querySelectorAll('[data-reveal]').forEach((el) => {
    if (el.dataset.reveal === 'words' && !el.dataset.split) splitWords(el);
    el.classList.add('is-in');
  });
}

export function splitWords(el) {
  el.dataset.split = '1';
  let i = 0;
  const walk = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3) {
        const parts = child.textContent.split(/(\s+)/);
        if (parts.every((p) => !p.trim())) continue;
        const frag = document.createDocumentFragment();
        for (const part of parts) {
          if (!part) continue;
          if (!part.trim()) { frag.append(document.createTextNode(part)); continue; }
          const outer = document.createElement('span');
          outer.className = 'rw';
          const inner = document.createElement('span');
          inner.className = 'rw-i';
          inner.style.setProperty('--i', i++);
          inner.textContent = part;
          outer.append(inner);
          frag.append(outer);
        }
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && !child.matches('svg, br, img')) {
        walk(child);
      }
    }
  };
  walk(el);
}

function observeOnce(els, fn) {
  if (!els.length) return;
  if (reducedMotion() || !('IntersectionObserver' in window)) { els.forEach(fn); return; }
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      fn(en.target);
      io.unobserve(en.target);
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
  els.forEach((el) => io.observe(el));
}

/* ------------------------------------------------------------------------
   Kerben-Form wie die „Helmets Hall of Fame"-Karten: Rechteck mit runden
   Ecken, unten rechts (oder links) ist eine Stufe ausgespart, in der ein
   Etikett (.notch-tag) frei auf dem Seitengrund steht.
   Das Element selbst wird NICHT beschnitten (sonst verschwände das Etikett):
   notch() legt eine Hintergrund-Ebene .notch-bg als erstes Kind an und gibt
   ihr die Form als clip-path: path() in echten Pixeln (bei Größenänderung
   neu). Die Füllung kommt aus --notch-fill; direkte Kinder mit .notch-clip
   (z. B. Höhenlinien in der Karte) bekommen dieselbe Form. stroke=true legt
   eine feine Kontur darüber (Farbe über --notch-line).
   ------------------------------------------------------------------------ */
export function notchPath(w, h, { tabW = 140, tabH = 30, r = 12, slant = 18, side = 'right', inset = 0 } = {}) {
  const i = inset;
  const W = w - i, H = h - i, x0 = i, y0 = i;
  const yT = H - tabH;                         // Unterkante über dem Etikett
  const rr = Math.max(0, Math.min(r, (W - x0) / 2, (yT - y0) / 2));
  const c = Math.min(8, tabH / 3);             // Rundung an der Stufe
  const f = (v) => Math.round(v * 100) / 100;
  if (side === 'left') {
    // gespiegelt: Etikett unten links
    const xs = x0 + tabW;                      // obere Stufe endet hier
    return [
      `M${f(x0 + rr)} ${f(y0)}`, `H${f(W - rr)}`, `Q${f(W)} ${f(y0)} ${f(W)} ${f(y0 + rr)}`,
      `V${f(H - rr)}`, `Q${f(W)} ${f(H)} ${f(W - rr)} ${f(H)}`,
      `H${f(xs + slant + c)}`, `Q${f(xs + slant)} ${f(H)} ${f(xs + slant - c * 0.6)} ${f(H - c * 0.8)}`,
      `L${f(xs + c * 0.6)} ${f(yT + c * 0.8)}`, `Q${f(xs)} ${f(yT)} ${f(xs - c)} ${f(yT)}`,
      `H${f(x0 + rr)}`, `Q${f(x0)} ${f(yT)} ${f(x0)} ${f(yT - rr)}`,
      `V${f(y0 + rr)}`, `Q${f(x0)} ${f(y0)} ${f(x0 + rr)} ${f(y0)}`, 'Z',
    ].join('');
  }
  const xs = W - tabW;                         // obere Stufe beginnt hier
  return [
    `M${f(x0 + rr)} ${f(y0)}`, `H${f(W - rr)}`, `Q${f(W)} ${f(y0)} ${f(W)} ${f(y0 + rr)}`,
    `V${f(yT - rr)}`, `Q${f(W)} ${f(yT)} ${f(W - rr)} ${f(yT)}`,
    `H${f(xs + c)}`, `Q${f(xs)} ${f(yT)} ${f(xs - c * 0.6)} ${f(yT + c * 0.8)}`,
    `L${f(xs - slant + c * 0.6)} ${f(H - c * 0.8)}`, `Q${f(xs - slant)} ${f(H)} ${f(xs - slant - c)} ${f(H)}`,
    `H${f(x0 + rr)}`, `Q${f(x0)} ${f(H)} ${f(x0)} ${f(H - rr)}`,
    `V${f(y0 + rr)}`, `Q${f(x0)} ${f(y0)} ${f(x0 + rr)} ${f(y0)}`, 'Z',
  ].join('');
}

const notchObservers = new WeakMap();
export function notch(el, opts = {}) {
  if (!el) return;
  const o = { tabW: 140, tabH: 30, r: 12, slant: 18, side: 'right', stroke: false, ...opts };
  el.classList.add('is-notched');
  el.style.setProperty('--notch-w', `${o.tabW}px`);
  el.style.setProperty('--notch-h', `${o.tabH}px`);
  let bg = el.querySelector(':scope > .notch-bg');
  if (!bg) {
    bg = document.createElement('span');
    bg.className = 'notch-bg';
    bg.setAttribute('aria-hidden', 'true');
    el.prepend(bg);
  }
  const apply = () => {
    const w = el.offsetWidth, h = el.offsetHeight;
    if (!w || !h) return;
    const clip = `path('${notchPath(w, h, o)}')`;
    bg.style.clipPath = clip;
    el.querySelectorAll(':scope > .notch-clip').forEach((c) => { c.style.clipPath = clip; });
    if (o.stroke) {
      let svg = el.querySelector(':scope > .notch-line');
      if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'notch-line');
        svg.setAttribute('aria-hidden', 'true');
        svg.innerHTML = '<path/>';
        el.append(svg);
      }
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.firstChild.setAttribute('d', notchPath(w, h, { ...o, inset: 0.75, r: Math.max(0, o.r - 0.75) }));
    }
  };
  apply();
  if (!notchObservers.has(el) && 'ResizeObserver' in window) {
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    notchObservers.set(el, ro);
  }
  return apply;
}

// Alle Elemente mit data-notch (Werte als JSON-artige Kurzform
// "tabW:150;tabH:34;side:left;stroke") bekommen die Kerbe.
export function initNotches(root = document) {
  root.querySelectorAll('[data-notch]').forEach((el) => {
    const opts = {};
    for (const part of (el.dataset.notch || '').split(';')) {
      const [k, v] = part.split(':').map((s) => s && s.trim());
      if (!k) continue;
      opts[k] = v === undefined ? true : (Number.isNaN(Number(v)) ? v : Number(v));
    }
    notch(el, opts);
  });
}

/* ------------------------------------------------------------------------
   Vollbild-Menü wie auf landonorris.com: [data-menu-toggle] öffnet/schließt
   #site-menu; Esc und ein Tipp auf einen Link schließen es wieder. Der
   aktive Eintrag (.menu-link.is-current) bekommt einen Kringel.
   ------------------------------------------------------------------------ */
export function initMenu() {
  const menu = document.getElementById('site-menu');
  const toggles = [...document.querySelectorAll('[data-menu-toggle]')];
  if (!menu || !toggles.length) return;
  const set = (open) => {
    document.documentElement.classList.toggle('menu-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    menu.inert = !open;
    toggles.forEach((t) => t.setAttribute('aria-expanded', String(open)));
    if (open) {
      menu.querySelectorAll('.menu-link.is-current .scribble').forEach((s) => drawScribble(s, { restart: true, delay: 380 }));
      menu.querySelector('.menu-link, button, a')?.focus({ preventScroll: true });
    }
  };
  set(false);
  toggles.forEach((t) => t.addEventListener('click', () => set(!document.documentElement.classList.contains('menu-open'))));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
  menu.addEventListener('click', (e) => { if (e.target.closest('a, [data-menu-close]')) set(false); });
  return set;
}

/* ------------------------------------------------------------------------
   Hintergrund wechselt beim Scrollen (dunkel → oliv → creme), wie die
   Abschnitte auf landonorris.com: Abschnitte mit data-surface="light|dark|
   black|olive" setzen html[data-surface], sobald sie die Bildmitte erreichen.
   ------------------------------------------------------------------------ */
export function initSurfaceMorph(root = document) {
  const sections = [...root.querySelectorAll('[data-surface]')];
  if (!sections.length || !('IntersectionObserver' in window)) return;
  const html = document.documentElement;
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) html.dataset.surface = en.target.dataset.surface;
  }, { rootMargin: '-50% 0px -50% 0px' });
  sections.forEach((s) => io.observe(s));
}

/* ------------------------------------------------------------------------
   Spotlight: auf Geräten mit Maus leuchten die Höhenlinien in der
   Akzentfarbe auf. Standard ist die Strömungs-Variante wie auf
   landonorris.com (topo-fluid.js, D-081): das Leuchten fließt der Maus mit
   Schwung nach und verwirbelt. Ohne WebGL2 bleibt der einfache Lichtkreis
   unter dem Cursor (.topo-spot liest --mx/--my).
   Ohne Maus (Handy, D-089) wischt ab und zu ein unsichtbarer Finger über
   die Linien und ein Tipp lässt sie aufleuchten; ohne WebGL2 bleiben dort
   die stillen Linien.
   ------------------------------------------------------------------------ */
export function initSpotlight(target = document.documentElement) {
  if (reducedMotion()) return;
  if (!finePointer()) { initTopoFluid({ touch: true }); return; }
  if (initTopoFluid({ onFail: () => initCssSpotlight(target) })) return;
  initCssSpotlight(target);
}

function initCssSpotlight(target) {
  let raf = 0, x = 0, y = 0;
  addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      target.style.setProperty('--mx', `${x}px`);
      target.style.setProperty('--my', `${y}px`);
      target.classList.add('spot-on');
    });
  }, { passive: true });
  document.addEventListener('pointerleave', () => target.classList.remove('spot-on'));
}

/* ------------------------------------------------------------------------
   Magnetische Knöpfe (nur mit Maus): [data-magnetic] folgt dem Cursor ein
   kleines Stück.
   ------------------------------------------------------------------------ */
export function initMagnetic(root = document) {
  if (!finePointer() || reducedMotion()) return;
  root.querySelectorAll('[data-magnetic]').forEach((el) => {
    const k = Number(el.dataset.magnetic) || 0.25;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.translate = `${(e.clientX - r.left - r.width / 2) * k}px ${(e.clientY - r.top - r.height / 2) * k}px`;
    });
    el.addEventListener('pointerleave', () => { el.style.translate = ''; });
  });
}

/* ------------------------------------------------------------------------
   Laufband: [data-marquee] enthält eine .marquee-track; deren Inhalt wird
   verdoppelt und läuft endlos (reines CSS, Tempo über --marquee-speed px/s).
   ------------------------------------------------------------------------ */
export function initMarquee(el) {
  const track = el?.querySelector('.marquee-track');
  if (!track) return;
  track.querySelectorAll('[data-clone]').forEach((n) => n.remove());
  const items = [...track.children];
  for (const it of items) {
    const c = it.cloneNode(true);
    c.dataset.clone = '1';
    c.setAttribute('aria-hidden', 'true');
    track.append(c);
  }
  const speed = Number(getComputedStyle(el).getPropertyValue('--marquee-speed')) || 60;
  requestAnimationFrame(() => {
    track.style.setProperty('--marquee-dur', `${Math.max(8, track.scrollWidth / 2 / speed)}s`);
  });
}

/* ------------------------------------------------------------------------
   Abgänge: Blätter, Dialoge, Meldungen und aufgeklappte Zeilen verschwinden
   nicht schlagartig. leave() setzt .is-leaving (die Abgangs-Animation steht
   in theme.css bzw. der Seite), wartet, bis sie durch ist, und ruft dann
   after auf (Standard: hidden). enter() zeigt das Element wieder und bricht
   einen laufenden Abgang ab. Ohne Bewegung oder ohne Abgangs-Animation wird
   sofort versteckt.
   ------------------------------------------------------------------------ */
const leaving = new WeakMap();
export function leave(el, after = () => { el.hidden = true; }) {
  if (!el) return Promise.resolve();
  if (leaving.has(el)) return leaving.get(el);
  if (el.hidden || !el.getClientRects().length || reducedMotion()) { after(); return Promise.resolve(); }
  el.classList.add('is-leaving');
  // Endlos-Animationen (Puls, Drift) im Inneren nicht abwarten
  const anims = el.getAnimations({ subtree: true }).filter((a) => a.effect?.getTiming().iterations !== Infinity);
  const p = Promise.race([
    Promise.all(anims.map((a) => a.finished.catch(() => {}))),
    new Promise((r) => setTimeout(r, 1000)),
  ]).then(() => {
    if (leaving.get(el) === p) leaving.delete(el);
    if (!el.classList.contains('is-leaving')) return;   // zwischendurch wieder geöffnet
    el.classList.remove('is-leaving');
    after();
  });
  leaving.set(el, p);
  return p;
}

export function enter(el) {
  if (!el) return;
  leaving.delete(el);
  el.classList.remove('is-leaving');
  el.hidden = false;
}

// Eine Einblend-Klasse erneut abspielen (z. B. nach dem Umschalten Heute/
// All-Time) und danach wieder entfernen.
export function replay(el, cls) {
  if (!el || reducedMotion()) return;
  el.classList.remove(cls);
  void el.offsetWidth;   // Reflow, damit die Animation neu startet
  el.classList.add(cls);
  el.addEventListener('animationend', function done(e) {
    if (e.target !== el) return;
    el.classList.remove(cls);
    el.removeEventListener('animationend', done);
  });
}

/* ------------------------------------------------------------------------
   Morph per Skript (FLIP): Elemente mit view-transition-name gleiten von
   ihrer alten an die neue Position. Grundlage für die Ansichtswechsel
   innerhalb einer Seite (überall) und für Seitenwechsel in Browsern ohne
   seitenübergreifende View Transitions (Firefox). Läuft bewusst nicht über
   document.startViewTransition: Firefox' Umsetzung zeigt dabei leere Bilder
   (D-087).
   ------------------------------------------------------------------------ */
const MORPH_OPTS = { duration: 750, easing: 'cubic-bezier(0.65, 0.05, 0, 1)' };
const FADE_OPTS = { duration: 450, easing: 'ease', delay: 90, fill: 'backwards' };

// Sichtbare Elemente mit einem view-transition-name, als Map name → Element
export function morphTargets(root = document) {
  const map = new Map();
  for (const el of root.querySelectorAll('body *')) {
    if (el.closest('[hidden]')) continue;
    const cs = getComputedStyle(el);
    const n = cs.viewTransitionName;
    if (!n || n === 'none' || n === 'auto' || map.has(n) || cs.visibility === 'hidden' || !el.getClientRects().length) continue;
    map.set(n, el);
  }
  return map;
}

const rectOf = (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };

// Alte Positionen (name → Rechteck): die neuen Elemente gleiten von dort an
// ihren Platz. Gibt die gefundenen Gegenstücke zurück.
export function flipFrom(oldRects) {
  const moved = [];
  for (const [n, el] of morphTargets()) {
    const a = oldRects[n];
    if (!a) continue;
    const b = rectOf(el);
    if (!b.w || !b.h) continue;
    const dx = a.x - b.x, dy = a.y - b.y, sx = a.w / b.w, sy = a.h / b.h;
    moved.push(el);
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) continue;
    el.animate([
      { transformOrigin: '0 0', transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
      { transformOrigin: '0 0', transform: 'none' },
    ], MORPH_OPTS);
  }
  return moved;
}

// Alles außer den gleitenden Elementen blendet ein bzw. aus: animiert werden
// die Geschwister entlang der Pfade zu den Morph-Elementen (deren Vorfahren
// selbst bleiben stehen, sonst blendeten die Morph-Elemente mit)
const SKIP_FADE = '.topo, .topo-spot, .topo-fluid, .site-menu, script, style, [hidden]';
function fadeTargets(keep, scope = document.body) {
  const anc = new Set([scope]);
  for (const el of keep) for (let p = el.parentElement; p && p !== scope; p = p.parentElement) anc.add(p);
  const out = [];
  for (const a of anc) for (const c of a.children) if (!anc.has(c) && !keep.includes(c) && !c.matches(SKIP_FADE)) out.push(c);
  return out;
}
export function fadeAllBut(keep, { out = false } = {}) {
  const frames = out ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 1 }];
  const opts = out ? { duration: 200, easing: 'ease-in', fill: 'forwards' } : FADE_OPTS;
  return fadeTargets(keep).map((el) => el.animate(frames, opts));
}

const settled = (anims) => Promise.all(anims.map((a) => a.finished.catch(() => {})));

/* ------------------------------------------------------------------------
   Ansichtswechsel innerhalb einer Seite (Onboarding-Schritte, Admin-
   Bereiche, Admin-Login). dir:
   - 'next' | 'prev': die Ansicht (erstes Element von from/to) gleitet in
     Richtung des Umschalters hinaus, die neue von der anderen Seite herein;
     weitere Elemente blenden nur aus und ein.
   - 'morph': Elemente mit view-transition-name (z. B. per html[data-morph])
     gleiten an ihren neuen Platz, alles andere blendet aus und wieder ein.
   from/to: Element(e) vor und nach dem Wechsel (to als Funktion, wenn es
   erst nach update feststeht). Das Versprechen erfüllt sich am Ende.
   ------------------------------------------------------------------------ */
let swapping = Promise.resolve();
export function swapView(update, { dir = 'next', from = [], to = from } = {}) {
  const run = async () => {
    if (reducedMotion() || document.hidden) { update(); return; }
    const list = (v) => [].concat(typeof v === 'function' ? v() : v).filter(Boolean);
    if (dir === 'morph') {
      const rects = {};
      const targets = morphTargets();
      for (const [n, el] of targets) rects[n] = rectOf(el);
      const out = fadeAllBut([...targets.values()], { out: true });
      await settled(out);
      update();
      out.forEach((a) => a.cancel());
      await settled(fadeAllBut(flipFrom(rects)));
      return;
    }
    const sign = dir === 'prev' ? -1 : 1;
    const [main, ...rest] = list(from);
    const leave = [
      main?.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-40 * sign}px)` }],
        { duration: 260, easing: 'cubic-bezier(0.55, 0, 1, 0.45)', fill: 'forwards' }),
      ...rest.map((el) => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-in', fill: 'forwards' })),
    ].filter(Boolean);
    await settled(leave);
    update();
    leave.forEach((a) => a.cancel());
    const [nMain, ...nRest] = list(to);
    await settled([
      nMain?.animate([{ opacity: 0, transform: `translateX(${56 * sign}px)` }, { opacity: 1, transform: 'none' }],
        { duration: 650, easing: 'cubic-bezier(0.65, 0.05, 0, 1)' }),
      ...nRest.map((el) => el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: 'ease' })),
    ].filter(Boolean));
  };
  // Schnelles Doppeltippen: Wechsel laufen nacheinander, nicht ineinander
  swapping = swapping.then(run, run);
  return swapping;
}

/* ------------------------------------------------------------------------
   Seitenwechsel mit Morph (D-085): Was auf beiden Seiten vorkommt, gleitet
   an seinen neuen Platz — Wortmarke, Menüknopf, Logo, Namenskreis und Name
   (Anmeldung ⇄ Dashboard), „Admin" aus dem Menü in den Admin-Titel, der
   Knopf „Konto anlegen" in „Weiter" des Onboardings, die Getränkekarten des
   Onboardings in die des Dashboards.
   Feste Paare stehen als view-transition-name in theme.css bzw. der Seite.
   Paare, die erst der Klick festlegt, laufen über einen Schlüssel:
   - Ein Link mit data-morph="key" (oder go(url, { morph: 'key' })) legt
     den Schlüssel in sessionStorage ab; das Kopf-Skript der Zielseite setzt
     ihn vor dem ersten Bild als html[data-morph] und die Seite benennt
     daraufhin ihr Gegenstück.
   - Mit data-morph-self heißt der angeklickte Link selbst „morph-<key>".
   Chrome/Safari: seitenübergreifende View Transition (CSS in theme.css).
   Firefox (D-087): dieselben Paare per Skript — vor dem Wechsel merkt sich
   die alte Seite die Positionen (pk-flip) und blendet den Rest kurz aus;
   die neue startet unsichtbar (html[data-flip], Kopf-Skript), legt die
   Elemente an die alten Positionen und lässt sie an ihren Platz gleiten.
   ------------------------------------------------------------------------ */
const MORPH_KEY = 'pk-morph';
const FLIP_KEY = 'pk-flip';
const crossDocVT = () => 'CSSViewTransitionRule' in window;
const outgoing = [];

export function go(url, { replace = false, morph = '' } = {}) {
  const nav = () => (replace ? location.replace(url) : location.assign(url));
  try { if (morph) sessionStorage.setItem(MORPH_KEY, morph); } catch { /* ohne Speicher kein Morph */ }
  if (crossDocVT() || reducedMotion()) { nav(); return; }
  if (outgoing.length) return;   // Doppeltipp
  if (morph) document.documentElement.dataset.morph = morph;   // eigenes Gegenstück benennen (z. B. Admin-Titel)
  const targets = morphTargets();
  const rects = {};
  for (const [n, el] of targets) rects[n] = rectOf(el);
  try { sessionStorage.setItem(FLIP_KEY, JSON.stringify({ t: Date.now(), rects })); } catch { nav(); return; }
  outgoing.push(...fadeAllBut([...targets.values()], { out: true }));
  settled(outgoing).then(nav);
}

export function initPageTransitions() {
  const html = document.documentElement;
  // Firefox: hereinkommender Morph (das Kopf-Skript hat html[data-flip] gesetzt)
  if (html.dataset.flip) {
    let rects = null;
    try { rects = JSON.parse(sessionStorage.getItem(FLIP_KEY) || 'null')?.rects; } catch { /* egal */ }
    try { sessionStorage.removeItem(FLIP_KEY); } catch { /* egal */ }
    const moved = rects ? flipFrom(rects) : [];
    const fades = fadeAllBut(moved);
    delete html.dataset.flip;   // im selben Bild: Seite sichtbar, Elemente an alter Stelle
    settled(fades).then(() => { if (html.pkMorphEnd) html.pkMorphEnd(); else delete html.dataset.morph; });
  }
  // Zurück aus dem bfcache: ausgeblendete Seite wieder zeigen, Namen lösen
  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    outgoing.splice(0).forEach((a) => a.cancel());
    delete html.dataset.morph;
    html.classList.remove('menu-open');
    document.querySelectorAll('[data-morph-self]').forEach((a) => { a.style.viewTransitionName = ''; });
  });
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest?.('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) return;   // Anker, dieselbe Seite
    const morph = a.dataset.morph || '';
    if (morph && a.hasAttribute('data-morph-self')) {
      a.style.viewTransitionName = `morph-${morph}`;
      // Link im Vollbild-Menü: das Menü bleibt offen, sonst wischte es den
      // Link weg, während er hinübergleiten soll
      if (a.closest('.site-menu')) html.classList.add('menu-open');
    }
    if (crossDocVT() || reducedMotion()) {
      try { if (morph) sessionStorage.setItem(MORPH_KEY, morph); } catch { /* egal */ }
      return;   // der Browser navigiert, die View Transition morpht
    }
    e.preventDefault();
    go(url.href, { morph });
  });
}

/* ------------------------------------------------------------------------
   Zahl hochzählen (z. B. Kennzahlen im Archiv), deutsch formatiert.
   ------------------------------------------------------------------------ */
export function countUp(el, to, { dur = 1100, from = 0, format = (n) => n.toLocaleString('de-DE') } = {}) {
  if (!el) return;
  if (reducedMotion()) { el.textContent = format(to); return; }
  const t0 = performance.now();
  const ease = (t) => 1 - Math.pow(1 - t, 4);
  const step = (now) => {
    const t = Math.min(1, (now - t0) / dur);
    el.textContent = format(Math.round(from + (to - from) * ease(t)));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ------------------------------------------------------------------------
   Kaltstart-Bild (D-093): Das Kopf-Skript setzt html.pk-boot (orange Fläche)
   und h.pkBootDone. Hier steht eine Kopie der Wortmarke groß in der Mitte,
   ihre Zeilen gleiten aus einer Maske. Sobald die Seite bereit ist, fliegt
   sie mit leichter Drehung an den Platz der echten Wortmarke in der
   Kopfleiste und nimmt dabei deren Farbe an; die Fläche wischt nach oben weg.
   Läuft beim Import des Moduls, also vor dem Laden der Daten.
   ------------------------------------------------------------------------ */
function initBoot() {
  const h = document.documentElement;
  if (!h.classList.contains('pk-boot') || !h.pkBootDone) return;
  const real = [...document.querySelectorAll('.topbar .wordmark')]
    .find((el) => !el.closest('.site-menu') && el.getClientRects().length);
  if (!real) return;
  const cs = getComputedStyle(real);
  const mark = real.cloneNode(true);
  for (const attr of ['href', 'id', 'aria-label', 'data-home']) mark.removeAttribute(attr);
  mark.setAttribute('aria-hidden', 'true');
  mark.classList.add('pk-boot-mark');
  mark.style.fontSize = cs.fontSize;
  // Zeilen in eine innere Spanne packen: die äußere ist die Maske
  for (const line of mark.children) {
    const inner = document.createElement('span');
    inner.append(...line.childNodes);
    line.append(inner);
  }
  document.body.append(mark);

  // Groß in der Bildmitte, gemessen an der echten Wortmarke
  const place = () => {
    const r = real.getBoundingClientRect();
    Object.assign(mark.style, { left: `${r.left}px`, top: `${r.top}px` });
    const s = Math.min((innerWidth * 0.6) / r.width, (innerHeight * 0.28) / r.height, 7);
    const dx = innerWidth / 2 - (r.left + r.width / 2);
    const dy = innerHeight / 2 - (r.top + r.height / 2);
    return `translate(${dx}px, ${dy}px) scale(${s})`;
  };
  mark.style.transform = place();
  const ease = 'cubic-bezier(0.65, 0.05, 0, 1)';
  [...mark.children].forEach((line, i) => line.firstElementChild.animate(
    [{ transform: 'translateY(105%) rotate(4deg)' }, { transform: 'none' }],
    { duration: 600, delay: 60 + i * 90, easing: ease, fill: 'backwards' },
  ));

  h.pkBootDone.then(() => {
    const big = place();              // Fonts/Layout können sich inzwischen verschoben haben
    const from = getComputedStyle(mark).color;
    // Drei Phasen mit eigenem Easing: kurz ausholen, in einem Bogen an den
    // Platz fliegen (die Fläche wischt dicht dahinter nach oben weg, die
    // Farbe kippt erst, wenn die Wortmarke den dunklen Grund erreicht) und
    // mit einem kleinen Nachfedern einrasten.
    const wind = big.replace(/scale\(([\d.]+)\)/, (_, v) => `scale(${v * 1.07})`);
    const fly = mark.animate([
      { transform: `${big} rotate(0deg)`, color: from, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
      { transform: `${wind} rotate(-4deg)`, color: from, offset: 0.2, easing: 'cubic-bezier(0.7, 0, 0.15, 1)' },
      { color: from, offset: 0.52 },
      { color: cs.color, offset: 0.7 },
      { transform: 'translate(0, 0) scale(0.94) rotate(1.5deg)', offset: 0.84, easing: 'cubic-bezier(0.3, 1.4, 0.5, 1)' },
      { transform: 'translate(0, 0) scale(1) rotate(0deg)', color: cs.color },
    ], { duration: 1250, easing: 'linear', fill: 'forwards' });
    // die untere Zeile zieht im Flug leicht nach wie bei einem Schwung
    mark.children[1]?.firstElementChild.animate(
      [{ transform: 'none' }, { transform: 'translateX(9%)', offset: 0.45 }, { transform: 'none', offset: 0.84 }, { transform: 'none' }],
      { duration: 1250, easing: 'cubic-bezier(0.45, 0, 0.2, 1)' },
    );
    const done = () => { mark.remove(); h.classList.remove('pk-boot', 'pk-boot-out'); };
    fly.finished.then(done, done);
  });
}
initBoot();

// Alles Übliche auf einmal; jede Seite ruft das einmal nach dem Rendern auf
// und nach dynamischem Nachladen erneut initReveal/initScribbles/initNotches.
export function initLando({ spotlight = true } = {}) {
  initPageTransitions();
  initReveal();
  initScribbles();
  initNotches();
  initMenu();
  initSurfaceMorph();
  initMagnetic();
  if (spotlight) initSpotlight();
  document.querySelectorAll('[data-marquee]').forEach(initMarquee);
}

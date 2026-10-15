// Saison-Akzente (D-071): kleine Deko zu Oktoberfest, Halloween, Winter,
// Silvester und Fasching, die sich nach dem Datum selbst ein- und ausschaltet.
// Ein Abend zählt bis 6 Uhr früh zum Vortag. Der Admin kann alles abschalten
// (Einstellung „Saison-Akzente“, kommt im State als `seasonal`).
// Gezeichnet im Lando-Stil (D-078): flache Formen, feine Linien, Farben aus den
// Tokens; beim Erscheinen spielt jede Form einmal eine kurze Einblendung
// (Klasse .season-in, siehe theme.css „Saison-Akzente“).
//
// Zum Ausprobieren stellt ?jetzt=2026-12-31T23:58 in der Adresse die Uhr
// dieser Seite; sie läuft von dort aus weiter.

const clockOffset = (() => {
  const v = new URLSearchParams(location.search).get('jetzt');
  const t = v ? Date.parse(v) : NaN;
  return Number.isFinite(t) ? t - Date.now() : 0;
})();
export const now = () => new Date(Date.now() + clockOffset);

const day = (y, m, d) => new Date(y, m - 1, d);
const addDays = (dt, n) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + n);

// Ostersonntag (Gaußsche Osterformel, gregorianisch)
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), date = ((h + l - 7 * m + 114) % 31) + 1;
  return day(y, month, date);
}

// Wiesn: erster Samstag nach dem 15. September bis zum ersten Sonntag im
// Oktober, mindestens aber bis zum 3. Oktober
function wiesn(y) {
  let start = day(y, 9, 16);
  while (start.getDay() !== 6) start = addDays(start, 1);
  let end = day(y, 10, 1);
  while (end.getDay() !== 0) end = addDays(end, 1);
  if (end.getDate() < 3) end = day(y, 10, 3);
  return [start, end];
}

const within = (d, [a, b]) => d >= a && d <= b;

// Welcher Anlass gilt zum Zeitpunkt t? null = keiner
export function seasonAt(t = now()) {
  const eff = new Date(t.getTime() - 6 * 3600e3);
  const d = day(eff.getFullYear(), eff.getMonth() + 1, eff.getDate());
  const y = d.getFullYear(), m = d.getMonth() + 1, date = d.getDate();
  // Silvester: 31.12. ab 18 Uhr bis 1.1. um 6 Uhr
  if (m === 12 && date === 31 && (t.getDate() !== 31 || t.getHours() >= 18)) return 'silvester';
  if (m === 10 && date === 31) return 'halloween';
  const e = easter(y);
  if (within(d, [addDays(e, -52), addDays(e, -47)])) return 'fasching';   // Weiberfastnacht bis Faschingsdienstag
  if (within(d, wiesn(y))) return 'oktoberfest';
  if (m === 12 || (m === 1 && date <= 6)) return 'winter';
  return null;
}

// Silvester: in der letzten Stunde ein Countdown, nach Mitternacht bis 1 Uhr
// ein Gruß. phase: 'countdown' | 'greeting' | 'after' | 'none'
export function newYear(t = now()) {
  if (t.getMonth() === 11 && t.getDate() === 31) {
    const midnight = new Date(t.getFullYear() + 1, 0, 1);
    const left = Math.ceil((midnight - t) / 1000);
    return left <= 3600 ? { phase: 'countdown', left, year: midnight.getFullYear() } : { phase: 'none' };
  }
  if (t.getMonth() === 0 && t.getDate() === 1 && t.getHours() < 6) {
    const since = t - new Date(t.getFullYear(), 0, 1);
    return { phase: t.getHours() < 1 ? 'greeting' : 'after', since, year: t.getFullYear() };
  }
  return { phase: 'none' };
}
export const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

// --- Aktiver Anlass: html[data-season] plus Deko in den markierten Flächen ---
// [data-deco-top="phone|tv"]  oben: Wimpelkette, Luftschlangen
// [data-deco-foot="phone|tv"] auf der Unterkante: Kürbisse, Schneewehe
// Die Klasse .season-deco gehört allein diesem Modul (decorate() räumt alle ab).
let enabled = null;   // bis der erste State da ist, bleibt alles aus
let current = null;
const listeners = new Set();

export function onSeason(cb) { listeners.add(cb); cb(current); }

export function setSeasonEnabled(on) {
  enabled = on !== false;
  refresh();
}

function refresh() {
  const s = enabled ? seasonAt() : null;
  if (s === current) return;
  current = s;
  if (s) document.documentElement.dataset.season = s;
  else delete document.documentElement.dataset.season;
  decorate(true);
  for (const cb of listeners) cb(s);
}
setInterval(refresh, 30 * 1000);

// Bei Größenänderung nur neu bauen, wenn sich die Breite der Kopf-Flächen
// wirklich geändert hat (die Wimpelkette hängt davon ab). Am Handy feuert
// resize auch beim Ein- und Ausblenden der Adresszeile — dann bleibt alles
// stehen und die Einblendung spielt nicht erneut.
const topWidths = () => [...document.querySelectorAll('[data-deco-top]')].map((el) => el.offsetWidth).join(',');
let builtFor = '';
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { if (current && topWidths() !== builtFor) decorate(false); }, 250);
});

function decorate(animate) {
  document.querySelectorAll('.season-deco').forEach((el) => el.remove());
  builtFor = topWidths();
  if (!current) return;
  const add = (host, el) => { if (animate) el.classList.add('season-in'); host.append(el); };
  for (const el of document.querySelectorAll('[data-deco-top]')) {
    const tv = el.dataset.decoTop === 'tv';
    if (current === 'oktoberfest') add(el, bunting(el.offsetWidth, tv));
    if (current === 'fasching') add(el, placeStreamers(el, streamers(tv), tv));
  }
  for (const el of document.querySelectorAll('[data-deco-foot]')) {
    const tv = el.dataset.decoFoot === 'tv';
    if (current === 'halloween') (tv ? [25, 51, 76] : [27, 70]).forEach((left, i) => add(el, pumpkin(left, tv, i)));
    if (current === 'winter' || current === 'silvester') add(el, drift(tv));
  }
}

function deco(cls, html) {
  const el = document.createElement('div');
  el.className = `season-deco ${cls}`;
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = html;
  return el;
}

const f1 = (v) => v.toFixed(1);

// Oktoberfest: blau-weiße Wimpelkette an einer dünnen Schnur, auf dem TV in
// mehreren Bögen. Die Wimpel sind flache Dreiecke; ihre Neigung folgt der
// Schnur und steckt direkt in den Punkten, damit CSS die Wimpel frei bewegen
// kann (Einblenden, Schaukeln auf dem TV).
function bunting(width, tv) {
  const w = Math.max(200, Math.round(width));
  const swags = tv ? Math.max(2, Math.round(w / 640)) : 1;
  const perSwag = tv ? 9 : Math.max(7, Math.round(w / 36));
  const top = tv ? 4 : 3, sag = tv ? 12 : 7, flagH = tv ? 30 : 15;
  const sw = w / swags, fw = (sw / perSwag) * 0.7;
  let path = `M0 ${top} `, flags = '', n = 0;
  for (let s = 0; s < swags; s++) {
    const x0 = s * sw;
    path += `Q${f1(x0 + sw / 2)} ${top + sag * 2} ${f1(x0 + sw)} ${top} `;
    for (let i = 0; i < perSwag; i++, n++) {
      const t = (i + 0.5) / perSwag;
      const x = x0 + t * sw, y = top + 4 * sag * t * (1 - t);
      const a = Math.atan2(4 * sag * (1 - 2 * t), sw);
      const cos = Math.cos(a), sin = Math.sin(a);
      const pt = (dx, dy) => `${f1(x + dx * cos - dy * sin)},${f1(y + dx * sin + dy * cos)}`;
      // Einblenden folgt der Schnur von links nach rechts
      const delay = Math.round(120 + (x / w) * 820);
      flags += `<g class="season-flag" style="transform-origin:${f1(x)}px ${f1(y)}px;animation-delay:${(-n * 0.37).toFixed(2)}s;--fd:${delay}ms">`
        + `<polygon class="season-flag-${n % 2 ? 'white' : 'blue'}" points="${pt(-fw / 2, 0)} ${pt(fw / 2, 0)} ${pt(0, flagH)}"/></g>`;
    }
  }
  const h = top + sag + flagH + 4;
  return deco('season-bunting', `<svg viewBox="0 0 ${w} ${h}"><path class="season-string" d="${path}" stroke-width="${tv ? 1.6 : 1}"/>${flags}</svg>`);
}

// Fasching: Luftschlangen als feine Kringel-Linien plus flaches Konfetti.
// Handy: oben mittig zwischen Wortmarke und Menüknopf, flach genug, um im
// Kopf zu bleiben. TV: in der freien Kopf-Mitte.
function streamers(tv) {
  const scale = tv ? 2 : 0.8;
  const anchors = tv
    ? [[40, 62], [130, 88], [226, 56], [320, 84], [414, 60], [510, 90], [606, 66]]
    : [[14, 40], [38, 52], [62, 36], [84, 48]];
  const w = tv ? 680 : 96;
  const colors = ['var(--accent)', 'var(--accent-2)', 'var(--mixc)', 'var(--ink)'];
  let paths = '', bits = '';
  anchors.forEach(([x0, len], n) => {
    const r = 5 * scale, k = 2.2 + (n % 3) * 0.45, drift = (n % 2 ? 1 : -1) * 8 * scale;
    let d = '';
    for (let i = 0; i <= 80; i++) {
      const t = i / 80;
      const x = x0 + drift * t + r * Math.sin(2 * Math.PI * k * t);
      const y = t * len + r * 0.8 * (1 - Math.cos(2 * Math.PI * k * t));
      d += `${i ? 'L' : 'M'}${f1(x)} ${f1(y)} `;
    }
    paths += `<path d="${d}" fill="none" style="stroke:${colors[n % colors.length]}" stroke-width="${f1((tv ? 3 : 1.6))}" stroke-linecap="round" stroke-linejoin="round"/>`;
    // Konfetti: abwechselnd Streifen und Punkte
    for (let j = 0; j < 3; j++) {
      const cx = x0 + (j - 1) * 13 * scale + drift, cy = len * (0.25 + 0.3 * j) + 6 * scale;
      const c = colors[(n + j + 1) % colors.length];
      bits += (n + j) % 3 === 0
        ? `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(1.7 * scale)}" style="fill:${c}"/>`
        : `<rect x="${f1(cx)}" y="${f1(cy)}" width="${f1(2.4 * scale)}" height="${f1(6 * scale)}" transform="rotate(${((n * 47 + j * 31) % 90) - 45} ${f1(cx)} ${f1(cy)})" style="fill:${c}"/>`;
    }
  });
  const h = Math.max(...anchors.map((a) => a[1])) + 16 * scale;
  return deco(`season-streamers season-streamers--${tv ? 'tv' : 'phone'}`, `<svg viewBox="0 0 ${w} ${f1(h)}">${paths}${bits}</svg>`);
}

// Am Handy hängen die Luftschlangen mittig in der Lücke zwischen Wortmarke und
// den Kopf-Aktionen (Logo, Menüknopf). Die Lücke ist je Seite verschieden
// breit, deshalb wird sie gemessen; ohne
// Kopfleiste bleibt es bei der CSS-Mitte (left 50 %).
function placeStreamers(host, el, tv) {
  if (tv) return el;
  const bar = host.querySelector('.topbar');
  const wm = bar?.querySelector('.wordmark');
  const actions = bar?.querySelector('.topbar-actions');
  if (!wm || !actions) return el;
  const place = () => {
    if (host.offsetWidth === 0) return;
    const h = host.getBoundingClientRect();
    const a = wm.getBoundingClientRect().right - h.left;
    const b = actions.getBoundingClientRect().left - h.left;
    const gap = b - a - 16;   // je 8 px Luft zu beiden Seiten
    el.style.left = el.style.width = '';
    if (gap < 40) return;
    el.style.left = `${Math.round((a + b) / 2)}px`;
    if (gap < 96) el.style.width = `${Math.floor(gap)}px`;
  };
  place();
  // Logo-Bild oder Schrift kommen evtl. erst nach dem ersten State an und
  // verschieben die Lücke — dann einmal nachmessen
  for (const img of actions.querySelectorAll('img')) if (!img.complete) img.addEventListener('load', place, { once: true });
  document.fonts?.ready.then(place);
  return el;
}

// Halloween: flacher Kürbis in Landos Orange, Rippen als feine Linien,
// dunkles Gesicht, Stiel in Lime-Off
const PUMPKIN = '<svg viewBox="0 0 40 36">'
  + '<path d="M20 8.5 C20.4 5 22.6 2.6 26 1.6" fill="none" stroke="var(--lando-lime-off, #b2c73a)" stroke-width="2.4" stroke-linecap="round"/>'
  + '<path d="M22.5 5.2 C25.5 5.6 27.6 4.2 28.6 2.4" fill="none" stroke="var(--lando-lime-off, #b2c73a)" stroke-width="1.1" stroke-linecap="round"/>'
  + '<g fill="var(--lando-orange, #ff6b00)"><ellipse cx="11.5" cy="21.5" rx="9.5" ry="12"/><ellipse cx="28.5" cy="21.5" rx="9.5" ry="12"/><ellipse cx="20" cy="21.5" rx="10.5" ry="13.5"/></g>'
  + '<path d="M14.5 9.5 C11 15 11 28 14.5 34 M25.5 9.5 C29 15 29 28 25.5 34" fill="none" stroke="var(--lando-black, #111112)" stroke-opacity="0.28" stroke-width="0.9"/>'
  + '<path d="M11.5 15.5 L16.5 19.5 L11 20.5 Z M28.5 15.5 L23.5 19.5 L29 20.5 Z M20 21 L21.6 23.6 L18.4 23.6 Z" fill="var(--lando-black, #111112)"/>'
  + '<path d="M10 25.5 L13.6 28.2 L16.6 25.8 L20 29.2 L23.4 25.8 L26.4 28.2 L30 25.5 C28.6 30 24.6 32 20 32 C15.4 32 11.4 30 10 25.5 Z" fill="var(--lando-black, #111112)"/>'
  + '</svg>';

function pumpkin(left, tv, i) {
  const el = deco(`season-pumpkin season-pumpkin--${tv ? 'tv' : 'phone'}`, PUMPKIN);
  el.style.left = `${left}%`;
  el.style.setProperty('--i', i);
  return el;
}

// Winter und Silvester: Schneewehe in Creme auf der Unterkante, darüber zwei
// feine Linien wie Höhenlinien (Baum-Footer und Schneekappen gibt es nicht mehr)
// Die Wellen werden aus zwei überlagerten Sinuswellen berechnet; die Breite
// des viewBox wächst mit der Fläche (TV 1600, Handy 400), damit die Hügel
// auf dem breiten Bildschirm nicht platt gezogen wirken. Die beiden Linien
// darüber folgen derselben Form, nur flacher — wie Höhenlinien.
function drift(tv) {
  const W = tv ? 1600 : 400, H = 24;
  const surf = (x, lift, amp) => H - 10.5 - lift
    - amp * (0.68 * Math.sin((x / 250) * 6.283 + 0.6) + 0.32 * Math.sin((x / 137) * 6.283 + 2.1));
  const line = (lift, amp) => {
    let d = '';
    for (let x = 0; x <= W; x += 8) d += `${x ? 'L' : 'M'}${x} ${f1(surf(x, lift, amp))} `;
    return d;
  };
  const stroke = 'fill="none" stroke="var(--lando-cream, #efefe5)" stroke-width="1" vector-effect="non-scaling-stroke"';
  return deco(`season-drift season-drift--${tv ? 'tv' : 'phone'}`,
    `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">`
    + `<path d="${line(9, 1.6)}" ${stroke} stroke-opacity="0.2"/>`
    + `<path d="${line(4.5, 2.6)}" ${stroke} stroke-opacity="0.42"/>`
    + `<path d="${line(0, 3.6)}L${W} ${H} L0 ${H} Z" fill="var(--lando-cream, #efefe5)"/>`
    + '</svg>');
}

// Bewegte Saison-Akzente für den TV (D-071): Schneefall, Bläschen, Konfetti,
// Feuerwerk und eine Fledermaus. Zwei Canvas-Flächen auf der Bühne — eine
// hinter der Rangliste (Schnee), eine davor (Momente). Die Flächen rechnen in
// halber Auflösung und schlafen, solange nichts zu zeichnen ist oder der Tab
// nicht sichtbar ist. Bei „Bewegung reduzieren“ bleibt alles still.
// Lando-Stil (D-078): flache Formen und feine Linien, Farben aus den neuen
// Tokens (--accent, --accent-2, --mixc, --ink, --beer) mit Hex-Fallbacks aus
// der Lando-Palette.

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const rand = (a, b) => a + Math.random() * (b - a);

export function createSeasonFx(stage) {
  const layer = (z) => {
    const c = document.createElement('canvas');
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = `position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:${z};`;
    return c;
  };
  const back = layer(0), front = layer(5);
  stage.firstElementChild.after(back);   // über den Höhenlinien, unter der Rangliste
  stage.append(front);

  let W = 1920, H = 1080;
  function size() {
    W = stage.offsetWidth || 1920; H = stage.offsetHeight || 1080;
    for (const c of [back, front]) { c.width = Math.round(W / 2); c.height = Math.round(H / 2); }
  }
  size();
  window.addEventListener('resize', size);

  let snow = [];
  let bursts = [];
  let running = false;
  const bats = new Set();

  // Token lesen und prüfen, ob der Canvas die Farbe versteht; sonst Fallback
  const probe = document.createElement('canvas').getContext('2d');
  function color(token, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    probe.fillStyle = '#010203';
    probe.fillStyle = v;
    return v && probe.fillStyle !== '#010203' ? v : fallback;
  }
  const palette = () => [
    color('--accent', '#ff6b00'), color('--accent-2', '#f4f4ed'),
    color('--mix-text', '#9aa6c2'), color('--accent-text', '#ff8a3d'),
  ];
  let snowColor = '#f4f4ed';

  function kick() {
    if (running || document.hidden) return;
    running = true;
    requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', kick);

  function frame() {
    if (document.hidden) { running = false; return; }
    drawBack();
    drawFront();
    if (snow.length || bursts.length) requestAnimationFrame(frame);
    else { running = false; clear(back); clear(front); }
  }
  function clear(c) { const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); }

  // Schnee: runde Flocken und feine Kreuzchen in Off-White
  function drawBack() {
    const g = back.getContext('2d');
    g.setTransform(0.5, 0, 0, 0.5, 0, 0);
    g.clearRect(0, 0, W, H);
    if (!snow.length) return;
    g.fillStyle = snowColor; g.strokeStyle = snowColor; g.lineWidth = 1.6; g.lineCap = 'round';
    g.globalAlpha = 0.62;
    g.beginPath();
    for (const p of snow) {
      p.y += p.vy; p.ph += 0.012; p.x += Math.sin(p.ph) * 0.4;
      if (p.y > H + 8) { p.y = -8; p.x = rand(0, W); }
      if (!p.cross) { g.moveTo(p.x + p.r, p.y); g.arc(p.x, p.y, p.r, 0, 6.283); }
    }
    g.fill();
    g.beginPath();
    for (const p of snow) {
      if (!p.cross) continue;
      const s = p.r * 1.5;
      g.moveTo(p.x - s, p.y); g.lineTo(p.x + s, p.y);
      g.moveTo(p.x, p.y - s); g.lineTo(p.x, p.y + s);
    }
    g.stroke();
    g.globalAlpha = 1;
  }

  function drawFront() {
    const g = front.getContext('2d');
    g.setTransform(0.5, 0, 0, 0.5, 0, 0);
    g.clearRect(0, 0, W, H);
    g.lineCap = 'round';
    const spawned = [];
    for (const p of bursts) {
      if (p.delay > 0) { p.delay--; continue; }
      if (p.t === 'confetti') {
        p.x += p.vx + Math.sin(p.y / 60) * 0.8; p.y += p.vy; p.rot += p.vr;
        if (p.y > H + 20) p.life = 0;
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.scale(1, Math.cos(p.rot * 2));
        g.fillStyle = p.c;
        if (p.dot) { g.beginPath(); g.arc(0, 0, p.h / 2, 0, 6.283); g.fill(); } else g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        g.restore();
      } else if (p.t === 'bubble') {
        p.y -= p.vy; p.ph += 0.08; p.x += Math.sin(p.ph) * 0.9;
        if (p.y < p.top) p.life -= 0.03;
        g.globalAlpha = Math.max(0, Math.min(1, p.life)) * 0.9; g.strokeStyle = p.c; g.lineWidth = 2;
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.283); g.stroke();
        // kleiner Glanzpunkt oben links
        g.fillStyle = p.c; g.beginPath(); g.arc(p.x - p.r * 0.38, p.y - p.r * 0.38, Math.max(1.2, p.r * 0.16), 0, 6.283); g.fill();
        g.globalAlpha = 1;
      } else if (p.t === 'rocket') {
        p.y += p.vy; p.vy *= 0.985;
        // feine Leuchtspur statt Raketenkörper
        const grad = g.createLinearGradient(p.x, p.y, p.x, p.y + 60);
        grad.addColorStop(0, p.c); grad.addColorStop(1, 'rgba(0,0,0,0)');
        g.strokeStyle = grad; g.lineWidth = 3;
        g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x, p.y + 60); g.stroke();
        // Platzen am Ziel — oder wenn der Schwung vorher ausgeht (die Bremse
        // trägt eine langsame Rakete nicht bis ganz nach oben; sonst bliebe
        // ihre Spur als Striemen in der Luft stehen)
        if (p.y <= p.ty || p.vy > -2) {
          p.life = 0;
          spawned.push({ t: 'ring', x: p.x, y: p.y, r: 8, c: p.c, life: 1 });
          for (let i = 0; i < 56; i++) {
            const a = (i / 56) * 6.283 + rand(-0.04, 0.04), s = rand(3, 8.5);
            spawned.push({ t: 'spark', x: p.x, y: p.y, px: p.x, py: p.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, c: p.c, life: 1 });
          }
        }
      } else if (p.t === 'spark') {
        p.px = p.x; p.py = p.y;
        p.x += p.vx; p.y += p.vy; p.vx *= 0.965; p.vy = p.vy * 0.965 + 0.09; p.life -= 0.012;
        // Funken als kurze Striche in Flugrichtung
        g.globalAlpha = Math.max(0, p.life); g.strokeStyle = p.c; g.lineWidth = 3;
        g.beginPath(); g.moveTo(p.px - (p.x - p.px) * 1.6, p.py - (p.y - p.py) * 1.6); g.lineTo(p.x, p.y); g.stroke();
        g.globalAlpha = 1;
      } else if (p.t === 'ring') {
        // feiner Ring, der sich beim Platzen ausbreitet (wie eine Höhenlinie)
        p.r += (190 - p.r) * 0.06; p.life -= 0.022;
        g.globalAlpha = Math.max(0, p.life) * 0.7; g.strokeStyle = p.c; g.lineWidth = 1.5;
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.283); g.stroke(); g.globalAlpha = 1;
      }
    }
    bursts = bursts.filter((p) => p.life > 0).concat(spawned);
  }

  // --- Öffentliche Schnittstelle ---
  return {
    // Schneefall hinter der Rangliste (Winter, Silvester)
    setSnow(on) {
      snowColor = color('--lando-white', '#f4f4ed');
      snow = on && !reduce.matches
        ? Array.from({ length: 70 }, (_, i) => ({ x: rand(0, W), y: rand(-H, H), r: rand(1.6, 4.2), vy: rand(0.5, 1.4), ph: rand(0, 6.28), cross: i % 4 === 0 }))
        : [];
      if (!snow.length) clear(back);
      kick();
    },
    // Oktoberfest: Bläschen in der Bierfarbe steigen über dem Fun-Fact-Band auf
    bubbles(bandTop) {
      if (reduce.matches) return;
      const cols = [color('--beer', '#ff6b00'), color('--accent-2', '#f4f4ed')];
      for (let i = 0; i < 46; i++) {
        bursts.push({ t: 'bubble', x: rand(120, W * 0.75), y: bandTop + rand(10, 60), top: bandTop - 300, vy: rand(1.6, 3.4), r: rand(4, 13), ph: rand(0, 6.28), delay: rand(0, 60), c: cols[i % 3 ? 0 : 1], life: 1 });
      }
      kick();
    },
    // Fasching: Konfetti-Regen (Streifen und Punkte)
    confetti() {
      if (reduce.matches) return;
      const cols = palette();
      for (let i = 0; i < 170; i++) {
        bursts.push({ t: 'confetti', x: rand(0, W), y: rand(-700, -20), vx: rand(-1.2, 1.2), vy: rand(3, 6), rot: rand(0, 6.28), vr: rand(-0.15, 0.15), w: rand(6, 10), h: rand(12, 20), dot: i % 5 === 0, c: cols[i % cols.length], life: 1 });
      }
      kick();
    },
    // Silvester: n Raketen, über `spread` Frames verteilt
    fireworks(n = 7, spread = 180) {
      if (reduce.matches) return;
      const cols = palette();
      for (let i = 0; i < n; i++) {
        bursts.push({ t: 'rocket', x: rand(W * 0.14, W * 0.86), y: H, ty: rand(H * 0.17, H * 0.44), vy: rand(-15, -12), delay: (i / n) * spread + rand(0, 12), c: cols[i % cols.length], life: 1 });
      }
      kick();
    },
    // Halloween: eine Fledermaus flattert einmal quer über den Bildschirm —
    // dunkle Silhouette mit feiner Kontur und Augen in der Akzentfarbe
    bat() {
      if (reduce.matches) return;
      const el = document.createElement('div');
      el.setAttribute('aria-hidden', 'true');
      el.style.cssText = 'position:absolute;left:0;top:0;width:150px;pointer-events:none;z-index:6;';
      const body = 'fill="var(--lando-black, #111112)" stroke="var(--ink-muted, #b4b8a5)" stroke-opacity="0.9" stroke-width="1.2" stroke-linejoin="round"';
      el.innerHTML = '<svg viewBox="0 0 120 60" style="display:block;width:100%;height:auto;overflow:visible">'
        + `<path class="wing" style="transform-origin:58px 30px" d="M58 30 C44 12 26 10 4 16 C14 22 16 30 12 38 C22 32 30 36 34 44 C40 34 50 34 58 36 Z" ${body}/>`
        + `<path class="wing" style="transform-origin:62px 30px" d="M62 30 C76 12 94 10 116 16 C106 22 104 30 108 38 C98 32 90 36 86 44 C80 34 70 34 62 36 Z" ${body}/>`
        + `<path d="M54 25 L55 17 L58.5 22.5 L61.5 22.5 L65 17 L66 25 C67.5 29 67.5 38 60 43 C52.5 38 52.5 29 54 25 Z" ${body}/>`
        + '<circle cx="57.5" cy="28.5" r="1.5" fill="var(--accent, #d2ff00)"/><circle cx="62.5" cy="28.5" r="1.5" fill="var(--accent, #d2ff00)"/></svg>';
      stage.append(el);
      bats.add(el);
      for (const wing of el.querySelectorAll('.wing')) {
        wing.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(0.35)' }], { duration: 220, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
      }
      el.animate([
        { transform: `translate(-160px, ${H * 0.48}px) rotate(-8deg)` },
        { transform: `translate(${W * 0.22}px, ${H * 0.28}px) rotate(6deg)` },
        { transform: `translate(${W * 0.5}px, ${H * 0.39}px) rotate(-6deg)` },
        { transform: `translate(${W * 0.77}px, ${H * 0.19}px) rotate(8deg)` },
        { transform: `translate(${W + 180}px, ${H * 0.31}px) rotate(-4deg)` },
      ], { duration: 4200, easing: 'cubic-bezier(0.45, 0.05, 0.55, 0.95)' }).finished
        .then(() => { el.remove(); bats.delete(el); }, () => {});
    },
    // Effekt-Demo beenden (D-099): laufende Momente sofort weg, Schnee bleibt
    // Sache von setSnow
    clear() {
      bursts = [];
      clear(front);
      for (const el of bats) el.remove();
      bats.clear();
    },
  };
}

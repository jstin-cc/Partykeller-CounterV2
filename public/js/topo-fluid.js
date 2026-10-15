// Höhenlinien mit Flüssigkeits-Spotlight (D-081), nach dem Vorbild von
// landonorris.com: Die Maus rührt in einer kleinen Strömungssimulation
// (Stable Fluids, WebGL2) Strömung und „Tinte" an. Die Tinte fließt mit
// Schwung nach, verwirbelt und verblasst langsam; wo sie steht, leuchten die
// Höhenlinien in der Akzentfarbe und werden von der Strömung leicht verbogen.
// Schnelle Bewegungen färben stärker als langsame. Steht die Maus eine Weile
// still, zieht ein schwacher Schimmer von selbst über die Linien.
//
// Ohne Maus (Handy, D-089) zieht hin und wieder ein unsichtbarer Finger in
// einem Bogen über das Bild und rührt die Linien an wie die Maus; ein Tipp
// lässt die Linien an der Stelle kurz aufleuchten. Dazwischen schläft die
// Simulation (Akku): kein Eigen-Schimmer, kein Bild pro Frame.
//
// Die Linien selbst sind dieselben SVGs wie beim CSS-Hintergrund (.topo),
// werden hier aber als Textur gezeichnet — der CSS-Hintergrund wird dafür
// ausgeblendet (html.topo-gl). Ohne WebGL2/Float-Rendering liefert
// initTopoFluid() false und lando.js nimmt das alte CSS-Spotlight.

const SIM_RES = 112;          // Strömung: Zellen auf der kurzen Seite
const DYE_RES = 320;          // Tinte: Auflösung auf der kurzen Seite
const VEL_DISSIPATION = 0.97; // pro Frame bei 60 fps
const DYE_DISSIPATION = 0.982;
const PRESSURE_KEEP = 0.8;
const PRESSURE_ITERATIONS = 16;
const CURL = 12;              // Verwirbelung
const FORCE = 5200;           // Schub pro Bildschirmbreite Mausweg
const RADIUS_PX = 90;        // Größe eines Tintentupfers
const IDLE_AFTER = 3000;      // ms ohne Mausbewegung bis zum Eigen-Schimmer
// Touch: kleinere Felder, Wischer alle paar Sekunden
const TOUCH = { SIM_RES: 80, DYE_RES: 224, PRESSURE_ITERATIONS: 10, MAX_PIXELS: 2.5e6 };
const SWEEP_FIRST = 1200;     // ms bis zum ersten Wischer
const SWEEP_GAP = [7000, 13000];
const SWEEP_DUR = [2600, 3600];
const AWAKE_AFTER = 4500;     // ms Nachlauf, bis die Tinte verblasst ist

const VS = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

const head = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 o;
uniform vec2 uTexel;
`;

const FS = {
  splat: `${head}
uniform sampler2D uTarget;
uniform float uAspect;
uniform vec2 uPoint;
uniform vec3 uValue;
uniform float uRadius;
uniform float uMax;
void main() {
  vec2 p = vUv - uPoint;
  p.x *= uAspect;
  vec3 v = texture(uTarget, vUv).xyz + exp(-dot(p, p) / uRadius) * uValue;
  o = vec4(clamp(v, -uMax, uMax), 1.0);
}`,
  advect: `${head}
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform float uDt;
uniform float uDissipation;
void main() {
  vec2 c = vUv - uDt * texture(uVelocity, vUv).xy * uTexel;
  o = uDissipation * texture(uSource, c);
}`,
  curl: `${head}
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vUv - vec2(uTexel.x, 0.0)).y;
  float R = texture(uVelocity, vUv + vec2(uTexel.x, 0.0)).y;
  float T = texture(uVelocity, vUv + vec2(0.0, uTexel.y)).x;
  float B = texture(uVelocity, vUv - vec2(0.0, uTexel.y)).x;
  o = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`,
  vorticity: `${head}
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float uCurlStrength;
uniform float uDt;
void main() {
  float L = texture(uCurl, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture(uCurl, vUv + vec2(uTexel.x, 0.0)).x;
  float T = texture(uCurl, vUv + vec2(0.0, uTexel.y)).x;
  float B = texture(uCurl, vUv - vec2(0.0, uTexel.y)).x;
  float C = texture(uCurl, vUv).x;
  vec2 f = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  f /= length(f) + 0.0001;
  f *= uCurlStrength * C;
  f.y *= -1.0;
  vec2 v = texture(uVelocity, vUv).xy + f * uDt;
  o = vec4(clamp(v, -1000.0, 1000.0), 0.0, 1.0);
}`,
  divergence: `${head}
uniform sampler2D uVelocity;
void main() {
  vec2 C = texture(uVelocity, vUv).xy;
  float L = texture(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
  float T = texture(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
  float B = texture(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
  if (vUv.x - uTexel.x < 0.0) L = -C.x;
  if (vUv.x + uTexel.x > 1.0) R = -C.x;
  if (vUv.y + uTexel.y > 1.0) T = -C.y;
  if (vUv.y - uTexel.y < 0.0) B = -C.y;
  o = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`,
  scale: `${head}
uniform sampler2D uSource;
uniform float uValue;
void main() { o = uValue * texture(uSource, vUv); }`,
  pressure: `${head}
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main() {
  float L = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float T = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  float B = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float d = texture(uDivergence, vUv).x;
  o = vec4((L + R + B + T - d) * 0.25, 0.0, 0.0, 1.0);
}`,
  gradient: `${head}
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main() {
  float L = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float T = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  float B = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  vec2 v = texture(uVelocity, vUv).xy - vec2(R - L, T - B);
  o = vec4(v, 0.0, 1.0);
}`,
  // Bild: Linien (Alpha der SVG-Textur), von der Strömung verschoben; in der
  // Tinte Akzentfarbe, ein weicher Lichthof um die Linien und ein Hauch Fläche.
  // Ausgabe vormultipliziert, die Seite scheint durch.
  display: `${head}
uniform sampler2D uLines;
uniform sampler2D uDye;
uniform sampler2D uVelocity;
uniform vec2 uSimTexel;
uniform vec2 uPx;
uniform vec3 uLineColor;
uniform vec3 uGlowColor;
void main() {
  vec2 disp = texture(uVelocity, vUv).xy * uSimTexel * 0.008;
  float dl = length(disp);
  if (dl > 0.008) disp *= 0.008 / dl;
  vec2 uv = vUv - disp;
  float line = texture(uLines, uv).a;
  float dye = texture(uDye, vUv).r;
  float glow = smoothstep(0.02, 0.9, dye);
  vec2 dx = vec2(uPx.x * 2.0, 0.0), dy = vec2(0.0, uPx.y * 2.0);
  float halo = (texture(uLines, uv + dx).a + texture(uLines, uv - dx).a
              + texture(uLines, uv + dy).a + texture(uLines, uv - dy).a) * 0.25;
  float glowLine = max(line, halo * 0.45);
  float a = mix(line, glowLine * 0.8, glow);
  vec3 col = mix(uLineColor, uGlowColor, glow);
  float haze = glow * 0.015;
  o = vec4(col * a + uGlowColor * haze * (1.0 - a), a + haze * (1.0 - a));
}`,
};

// Farbe aus einem CSS-Wert (Hex, rgb(), Name) als [r, g, b] in 0..1
const colorCtx = document.createElement('canvas').getContext('2d');
function parseColor(str, fallback) {
  colorCtx.fillStyle = '#000';
  colorCtx.fillStyle = str || fallback;
  const v = colorCtx.fillStyle;
  if (v.startsWith('#')) return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16) / 255);
  const m = v.match(/[\d.]+/g) ?? [0, 0, 0];
  return m.slice(0, 3).map((n) => Number(n) / 255);
}

function resolution(res, w, h) {
  const aspect = w / h;
  const lo = res, hi = Math.round(res * (aspect < 1 ? 1 / aspect : aspect));
  return aspect >= 1 ? [hi, lo] : [lo, hi];
}

let started = false;

export function initTopoFluid({ onFail, touch = false } = {}) {
  if (started) return true;
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
  // In Halbfloat-Texturen rendern: EXT_color_buffer_float, auf manchen Handys nur die Halbfloat-Variante
  if (!gl || !(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'))) return false;
  try {
    setup(canvas, gl, onFail, touch);
  } catch (err) {
    console.warn('Höhenlinien-Effekt aus:', err);
    canvas.remove();
    return false;
  }
  started = true;
  return true;
}

function setup(canvas, gl, onFail, touch) {
  const simRes = touch ? TOUCH.SIM_RES : SIM_RES;
  const dyeRes = touch ? TOUCH.DYE_RES : DYE_RES;
  const pressureIterations = touch ? TOUCH.PRESSURE_ITERATIONS : PRESSURE_ITERATIONS;
  const maxPixels = touch ? TOUCH.MAX_PIXELS : 6e6;

  canvas.className = 'topo-fluid';
  canvas.setAttribute('aria-hidden', 'true');
  const spot = document.querySelector('body > .topo-spot');
  if (spot) spot.after(canvas); else document.body.prepend(canvas);
  const html = document.documentElement;

  // --- Programme ---
  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  const vs = compile(gl.VERTEX_SHADER, VS);
  const prog = {};
  for (const [name, src] of Object.entries(FS)) {
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, src));
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const { name: un } = gl.getActiveUniform(p, i);
      u[un] = gl.getUniformLocation(p, un);
    }
    prog[name] = { p, u };
  }

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  // --- Render-Ziele ---
  function target(w, h, internal, format) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, gl.HALF_FLOAT, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('FBO');
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fbo, w, h, texel: [1 / w, 1 / h] };
  }
  function double(w, h, internal, format) {
    const t = { read: target(w, h, internal, format), write: target(w, h, internal, format) };
    t.swap = () => { [t.read, t.write] = [t.write, t.read]; };
    return t;
  }
  function freeTarget(t) { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fbo); }

  let unit = 0;
  function use(name) { unit = 0; gl.useProgram(prog[name].p); return prog[name].u; }
  function tex(loc, t) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t.tex ?? t);
    gl.uniform1i(loc, unit);
    unit += 1;
  }
  function blit(dst) {
    if (dst) { gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fbo); gl.viewport(0, 0, dst.w, dst.h); }
    else { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height); }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // --- Größe, Linien-Textur und Simulationsfelder ---
  let W = 1, H = 1, dpr = 1;
  let velocity, dye, pressure, divergence, curl, lines = null, ready = false;
  const svgCache = {};

  async function svgImage(name) {
    if (!svgCache[name]) {
      svgCache[name] = (async () => {
        const text = await (await fetch(`assets/${name}`)).text();
        const [, , vw, vh] = text.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
        // Feste Größe im SVG-Kopf, sonst zeichnen manche Browser es nicht auf ein Canvas
        const sized = text.replace('<svg ', `<svg width="${vw}" height="${vh}" `);
        const url = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml' }));
        const img = new Image();
        img.src = url;
        await img.decode();
        return { img, vw, vh };
      })();
    }
    return svgCache[name];
  }

  let sizeToken = 0;
  async function resize() {
    const token = ++sizeToken;
    const cw = canvas.clientWidth || innerWidth, ch = canvas.clientHeight || innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 2);
    if (cw * ch * dpr * dpr > maxPixels) dpr = Math.sqrt(maxPixels / (cw * ch));
    W = Math.max(1, Math.round(cw * dpr));
    H = Math.max(1, Math.round(ch * dpr));

    // Gleiche Linien wie der CSS-Hintergrund: quer ab Seitenverhältnis 1:1, sonst hoch;
    // „cover" mittig, wie mask-size: cover
    const { img, vw, vh } = await svgImage(cw >= ch ? 'topo.svg' : 'topo-portrait.svg');
    if (token !== sizeToken) return;
    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    const s = Math.max(W / vw, H / vh);
    off.getContext('2d').drawImage(img, (W - vw * s) / 2, (H - vh * s) / 2, vw * s, vh * s);

    canvas.width = W; canvas.height = H;
    if (!lines) lines = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, lines);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, off);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

    for (const t of [velocity, dye, pressure]) if (t) { freeTarget(t.read); freeTarget(t.write); }
    for (const t of [divergence, curl]) if (t) freeTarget(t);
    const [sw, sh] = resolution(simRes, W, H);
    const [dw, dh] = resolution(dyeRes, W, H);
    velocity = double(sw, sh, gl.RG16F, gl.RG);
    dye = double(dw, dh, gl.R16F, gl.RED);
    pressure = double(sw, sh, gl.R16F, gl.RED);
    divergence = target(sw, sh, gl.R16F, gl.RED);
    curl = target(sw, sh, gl.R16F, gl.RED);

    if (!ready) {
      ready = true;
      html.classList.add('topo-gl');
      readColors(true);
      if (touch) scheduleSweep(SWEEP_FIRST);
    }
    wake(400);
  }

  // --- Farben aus den Tokens (wechseln beim Scrollen über helle Flächen) ---
  const col = { line: [0, 0, 0], glow: [1, 0.4, 0], lineT: null, glowT: null };
  function readColors(snap) {
    const cs = getComputedStyle(html);
    col.lineT = parseColor(cs.getPropertyValue('--topo-line').trim(), '#1d2433');
    col.glowT = parseColor(cs.getPropertyValue('--accent').trim(), '#ff6b00');
    if (snap) { col.line = col.lineT.slice(); col.glow = col.glowT.slice(); }
  }
  new MutationObserver(() => { readColors(false); wake(1200); })
    .observe(html, { attributes: true, attributeFilter: ['data-surface', 'data-area', 'class', 'style'] });

  // --- Maus ---
  const ptr = { x: 0, y: 0, ex: 0, ey: 0, inside: false, lastMove: performance.now() };
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    ptr.x = e.clientX; ptr.y = e.clientY;
    // Nach dem Betreten des Fensters nicht quer übers Bild nachziehen
    if (!ptr.inside) { ptr.ex = ptr.x; ptr.ey = ptr.y; ptr.inside = true; }
    ptr.lastMove = performance.now();
  }, { passive: true });
  addEventListener('mouseout', (e) => { if (!e.relatedTarget) ptr.inside = false; });

  // --- Touch: ein Tipp leuchtet kurz auf ---
  const taps = [];
  if (touch) {
    addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      taps.push([e.clientX, e.clientY]);
      wake();
    }, { passive: true });
  }
  function burst(x, y) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.4;
      splat(x + Math.cos(a) * 8, y + Math.sin(a) * 8, Math.cos(a) * 320, -Math.sin(a) * 320, 0.2, RADIUS_PX * 0.7);
    }
  }

  // --- Touch: unsichtbarer Finger, der in einem Bogen übers Bild wischt ---
  let sweep = null, sweepTimer = 0;
  const rand = (a, b) => a + Math.random() * (b - a);
  function edgePoint(side, cw, ch) {
    const m = 60;   // knapp außerhalb, damit der Wischer von außen hereinkommt
    if (side === 0) return [-m, rand(0.15, 0.85) * ch];
    if (side === 1) return [cw + m, rand(0.15, 0.85) * ch];
    if (side === 2) return [rand(0.15, 0.85) * cw, -m];
    return [rand(0.15, 0.85) * cw, ch + m];
  }
  function scheduleSweep(delay) {
    clearTimeout(sweepTimer);
    sweepTimer = setTimeout(() => {
      if (document.hidden || !ready) { scheduleSweep(rand(...SWEEP_GAP)); return; }
      const cw = canvas.clientWidth || innerWidth, ch = canvas.clientHeight || innerHeight;
      const from = Math.floor(Math.random() * 4);
      const to = [1, 0, 3, 2][from];   // gegenüberliegende Seite
      const p0 = edgePoint(from, cw, ch), p3 = edgePoint(to, cw, ch);
      // Kontrollpunkte quer zur Strecke versetzt: ein Bogen, mal links-, mal rechtsherum
      const dx = p3[0] - p0[0], dy = p3[1] - p0[1], len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const bend = rand(0.18, 0.4) * (Math.random() < 0.5 ? -1 : 1) * Math.min(cw, ch);
      const bend2 = bend * rand(0.3, 1.2);
      const p1 = [p0[0] + dx * 0.3 + nx * bend, p0[1] + dy * 0.3 + ny * bend];
      const p2 = [p0[0] + dx * 0.7 + nx * bend2, p0[1] + dy * 0.7 + ny * bend2];
      sweep = { p: [p0, p1, p2, p3], t0: performance.now(), dur: rand(...SWEEP_DUR), ex: p0[0], ey: p0[1] };
      wake();
      scheduleSweep(rand(...SWEEP_GAP));
    }, delay);
  }
  function bezier([p0, p1, p2, p3], t) {
    const u = 1 - t;
    return [0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]);
  }
  // Langsam an, zügig durch die Mitte, langsam aus — wie eine Handbewegung
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

  function splat(x, y, fx, fy, amount, radiusPx) {
    const cw = canvas.clientWidth || innerWidth, ch = canvas.clientHeight || innerHeight;
    const aspect = cw / ch;
    const r = (radiusPx / ch) ** 2;
    let u = use('splat');
    gl.uniform2f(u.uTexel, ...velocity.read.texel);
    tex(u.uTarget, velocity.read);
    gl.uniform1f(u.uAspect, aspect);
    gl.uniform2f(u.uPoint, x / cw, 1 - y / ch);
    gl.uniform3f(u.uValue, fx, fy, 0);
    gl.uniform1f(u.uRadius, r * 0.6);
    gl.uniform1f(u.uMax, 1000);
    blit(velocity.write);
    velocity.swap();

    u = use('splat');
    gl.uniform2f(u.uTexel, ...dye.read.texel);
    tex(u.uTarget, dye.read);
    gl.uniform1f(u.uAspect, aspect);
    gl.uniform2f(u.uPoint, x / cw, 1 - y / ch);
    gl.uniform3f(u.uValue, amount, 0, 0);
    gl.uniform1f(u.uRadius, r);
    gl.uniform1f(u.uMax, 1);
    blit(dye.write);
    dye.swap();
  }

  // Tupfer entlang einer Strecke, damit schnelle Bewegungen keine Lücken lassen
  function stroke(x0, y0, x1, y1, amountPerPx, minAmount, maxAmount) {
    const cw = canvas.clientWidth || innerWidth;
    const dist = Math.hypot(x1 - x0, y1 - y0);
    if (dist < 0.3) return;
    const steps = Math.min(12, Math.max(1, Math.ceil(dist / (RADIUS_PX * 0.35))));
    const fx = ((x1 - x0) / cw) * FORCE / steps;
    const fy = (-(y1 - y0) / cw) * FORCE / steps;
    const amount = Math.min(maxAmount, Math.max(minAmount, dist * amountPerPx)) / steps;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      splat(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, fx, fy, amount, RADIUS_PX);
    }
  }

  // --- Simulationsschritt ---
  function step(dt) {
    const k = dt * 60;
    gl.disable(gl.BLEND);
    const tx = velocity.read.texel;

    let u = use('curl');
    gl.uniform2f(u.uTexel, ...tx);
    tex(u.uVelocity, velocity.read);
    blit(curl);

    u = use('vorticity');
    gl.uniform2f(u.uTexel, ...tx);
    tex(u.uVelocity, velocity.read);
    tex(u.uCurl, curl);
    gl.uniform1f(u.uCurlStrength, CURL);
    gl.uniform1f(u.uDt, dt);
    blit(velocity.write);
    velocity.swap();

    u = use('divergence');
    gl.uniform2f(u.uTexel, ...tx);
    tex(u.uVelocity, velocity.read);
    blit(divergence);

    u = use('scale');
    gl.uniform2f(u.uTexel, ...tx);
    tex(u.uSource, pressure.read);
    gl.uniform1f(u.uValue, PRESSURE_KEEP);
    blit(pressure.write);
    pressure.swap();

    for (let i = 0; i < pressureIterations; i++) {
      u = use('pressure');
      gl.uniform2f(u.uTexel, ...tx);
      tex(u.uPressure, pressure.read);
      tex(u.uDivergence, divergence);
      blit(pressure.write);
      pressure.swap();
    }

    u = use('gradient');
    gl.uniform2f(u.uTexel, ...tx);
    tex(u.uPressure, pressure.read);
    tex(u.uVelocity, velocity.read);
    blit(velocity.write);
    velocity.swap();

    u = use('advect');
    gl.uniform2f(u.uTexel, ...tx);
    tex(u.uVelocity, velocity.read);
    tex(u.uSource, velocity.read);
    gl.uniform1f(u.uDt, dt);
    gl.uniform1f(u.uDissipation, VEL_DISSIPATION ** k);
    blit(velocity.write);
    velocity.swap();

    u = use('advect');
    gl.uniform2f(u.uTexel, ...tx);
    tex(u.uVelocity, velocity.read);
    tex(u.uSource, dye.read);
    gl.uniform1f(u.uDt, dt);
    gl.uniform1f(u.uDissipation, DYE_DISSIPATION ** k);
    blit(dye.write);
    dye.swap();
  }

  function render() {
    const u = use('display');
    gl.uniform2f(u.uTexel, 1 / W, 1 / H);
    gl.uniform2f(u.uPx, 1 / W, 1 / H);
    gl.uniform2f(u.uSimTexel, ...velocity.read.texel);
    tex(u.uLines, lines);
    tex(u.uDye, dye.read);
    tex(u.uVelocity, velocity.read);
    gl.uniform3f(u.uLineColor, ...col.line);
    gl.uniform3f(u.uGlowColor, ...col.glow);
    blit(null);
  }

  // Eigen-Schimmer: ein virtueller Punkt auf einer langsamen Schleifenbahn
  let idlePrev = null;
  function idlePoint(t) {
    const cw = canvas.clientWidth || innerWidth, ch = canvas.clientHeight || innerHeight;
    return [
      cw * (0.5 + 0.38 * Math.sin(t * 0.11) + 0.08 * Math.sin(t * 0.37 + 1.3)),
      ch * (0.5 + 0.34 * Math.sin(t * 0.083 + 2.1) + 0.08 * Math.cos(t * 0.29)),
    ];
  }

  let last = performance.now();
  let raf = 0;
  // Touch: die Simulation läuft nur, solange etwas passiert (plus Nachlauf)
  let awakeUntil = 0;
  function wake(ms = AWAKE_AFTER) {
    awakeUntil = Math.max(awakeUntil, performance.now() + ms);
    if (ready && !raf && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }
  function frame(now) {
    raf = 0;
    if (document.hidden || !ready) return;
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;

    // Lerp der Farben (die Seite blendet ihre Flächen ebenfalls weich über)
    const a = 1 - Math.exp(-dt * 5);
    for (const key of ['line', 'glow']) {
      const c = col[key], t = col[`${key}T`];
      for (let i = 0; i < 3; i++) c[i] += (t[i] - c[i]) * a;
    }

    // Die Maus wird gedämpft verfolgt: der Tupfer läuft mit Schwung nach
    if (ptr.inside) {
      const f = 1 - Math.exp(-dt * 16);
      const nx = ptr.ex + (ptr.x - ptr.ex) * f;
      const ny = ptr.ey + (ptr.y - ptr.ey) * f;
      stroke(ptr.ex, ptr.ey, nx, ny, 0.01, 0.0, 0.35);
      ptr.ex = nx; ptr.ey = ny;
    }

    while (taps.length) burst(...taps.shift());

    if (sweep) {
      const t = Math.min(1, (now - sweep.t0) / sweep.dur);
      const [x, y] = bezier(sweep.p, easeInOut(t));
      // gedämpft nachgeführt wie die Maus, damit die Strömung Schwung bekommt
      const f = 1 - Math.exp(-dt * 16);
      const nx = sweep.ex + (x - sweep.ex) * f, ny = sweep.ey + (y - sweep.ey) * f;
      stroke(sweep.ex, sweep.ey, nx, ny, 0.012, 0.0, 0.3);
      sweep.ex = nx; sweep.ey = ny;
      if (t >= 1) sweep = null;
      awakeUntil = Math.max(awakeUntil, now + AWAKE_AFTER);
    }

    if (!touch && now - ptr.lastMove > IDLE_AFTER) {
      const p = idlePoint(now / 1000);
      if (idlePrev) stroke(idlePrev[0], idlePrev[1], p[0], p[1], 0.0015, 0.0008, 0.0015);
      idlePrev = p;
    } else {
      idlePrev = null;
    }

    step(dt);
    render();
    if (!touch || now < awakeUntil) raf = requestAnimationFrame(frame);
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && ready && !raf) wake(touch ? 600 : 0);
  });

  let resizeTimer = 0;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => resize().catch(fail), 150);
  });

  function fail(err) {
    console.warn('Höhenlinien-Effekt aus:', err);
    ready = false;
    if (raf) cancelAnimationFrame(raf);
    clearTimeout(sweepTimer);
    canvas.remove();
    html.classList.remove('topo-gl');
    onFail?.();
  }
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); fail(new Error('WebGL-Kontext verloren')); });

  resize().catch(fail);
}

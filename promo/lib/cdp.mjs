// Minimaler Chrome-DevTools-Protocol-Client: startet Chrome/Edge headless und
// steuert Tabs über einen Browser-WebSocket (flatten-Sessions).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import WebSocket from 'ws';

const CANDIDATES = [
  process.env.PROMO_BROWSER,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/chromium', '/usr/bin/google-chrome',
].filter(Boolean);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launchBrowser({ profileDir, port = 9333 }) {
  const exe = CANDIDATES.find((p) => fs.existsSync(p));
  if (!exe) throw new Error('Kein Chrome/Edge gefunden (PROMO_BROWSER setzen)');
  fs.mkdirSync(profileDir, { recursive: true });
  const proc = spawn(exe, [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${path.resolve(profileDir)}`,
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio',
    '--force-color-profile=srgb', '--disable-gpu-vsync', '--run-all-compositor-stages-before-draw',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
    'about:blank',
  ], { stdio: 'ignore' });

  let wsUrl;
  for (let i = 0; i < 100 && !wsUrl; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      wsUrl = (await res.json()).webSocketDebuggerUrl;
    } catch { await sleep(100); }
  }
  if (!wsUrl) { proc.kill(); throw new Error('Browser-Debug-Port nicht erreichbar'); }

  const ws = new WebSocket(wsUrl, { perMessageDeflate: false, maxPayload: 512 * 1024 * 1024 });
  await new Promise((res, rej) => { ws.once('open', res); ws.once('error', rej); });

  let nextId = 1;
  const pending = new Map();
  const listeners = new Set();
  ws.on('message', (raw) => {
    const msg = JSON.parse(raw);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(`${msg.error.message} ${msg.error.data ?? ''}`)) : resolve(msg.result);
    } else if (msg.method) {
      for (const l of listeners) l(msg);
    }
  });

  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });

  async function newPage({ width, height, scale = 1, mobile = false }) {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const s = (method, params) => send(method, params, sessionId);
    await s('Page.enable');
    await s('Runtime.enable');
    await s('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile });
    if (mobile) await s('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });

    const waitEvent = (name, timeout = 15000) => new Promise((resolve, reject) => {
      const t = setTimeout(() => { listeners.delete(l); reject(new Error(`Timeout: ${name}`)); }, timeout);
      const l = (m) => { if (m.sessionId === sessionId && m.method === name) { clearTimeout(t); listeners.delete(l); resolve(m.params); } };
      listeners.add(l);
    });

    return {
      send: s,
      async goto(url) {
        const loaded = waitEvent('Page.loadEventFired');
        await s('Page.navigate', { url });
        await loaded;
      },
      async eval(expression) {
        const r = await s('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
        if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
        return r.result.value;
      },
      async screenshot(file, { format = 'png', quality, fullPage = false } = {}) {
        const params = { format, quality, captureBeyondViewport: fullPage, optimizeForSpeed: format === 'jpeg' };
        if (fullPage) {
          const { cssContentSize } = await s('Page.getLayoutMetrics');
          params.clip = { x: 0, y: 0, width: width, height: Math.ceil(cssContentSize.height), scale: 1 };
        }
        const { data } = await s('Page.captureScreenshot', params);
        const buf = Buffer.from(data, 'base64');
        if (file) fs.writeFileSync(file, buf);
        return buf;
      },
      close: () => send('Target.closeTarget', { targetId }),
    };
  }

  async function close() {
    try { await send('Browser.close'); } catch { /* schon zu */ }
    ws.close();
    setTimeout(() => proc.kill(), 500);
  }

  return { newPage, close };
}

export { sleep };

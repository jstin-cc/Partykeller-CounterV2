import { AREA } from './area.js';

// WS-Client mit Auto-Reconnect: onState wird bei jedem State-Broadcast gerufen,
// onFact bei jedem Wechsel des Fun-Fact-Bands (D-043), onDemo bei einer
// Effekt-Demo aus dem Admin (D-099). Trägt eine gesendete Nachricht ein
// `ref`, kommt dazu genau eine Antwort: onAck(ref) bei Erfolg oder
// onError(text, { code, ref }) — code 'auth' heißt neu anmelden (D-101).
// Verbindet sich mit dem WS-Endpunkt des eigenen Bereichs (D-019).
export function connectState({ onState, onFact, onDemo, onError, onAck } = {}) {
  let ws = null;
  let retryMs = 500;
  let closed = false;

  function open() {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${proto}//${location.host}${AREA.base}/ws`);

    ws.onopen = () => { retryMs = 500; };

    ws.onmessage = (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }
      if (msg.type === 'state') onState?.(msg);
      if (msg.type === 'fact') onFact?.(msg);
      if (msg.type === 'demo') onDemo?.(msg);
      if (msg.type === 'ack') onAck?.(msg.ref);
      if (msg.type === 'error') onError?.(msg.message, { code: msg.code, ref: msg.ref });
    };

    ws.onclose = () => {
      if (closed) return;
      setTimeout(open, retryMs);
      retryMs = Math.min(retryMs * 2, 10000);
    };
  }

  open();

  return {
    send(msg) {
      if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
      else onError?.('Keine Verbindung zum Server', { ref: msg.ref });
    },
    close() {
      closed = true;
      ws?.close();
    },
  };
}

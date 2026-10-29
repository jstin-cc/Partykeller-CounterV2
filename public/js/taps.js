import { AREA } from './area.js';

// Tipp-Warteschlange (D-120): Jeder Tipp bekommt eine Kennung und wartet im
// localStorage, bis der Server ihn quittiert. Reißt das WLAN ab, bleibt er
// liegen und geht nach dem Wiederverbinden (auch nach einem Neuladen) raus;
// der Server zählt jede Kennung nur einmal. Gesendet wird immer nur ein Tipp
// zur Zeit, der nächste nach der Quittung.
const KEY = `${AREA.keyPrefix}_taps`;
const THROTTLE_RETRY_MS = 1100;

// crypto.randomUUID gibt es nur über https; im WLAN läuft die App über http
function newId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function load() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// send(msg) schickt eine Nachricht, isOpen() sagt, ob die Verbindung steht.
export function createTapQueue({ send, isOpen }) {
  // Nachgereicht wird alles, was beim Laden noch wartet
  let queue = load().map((t) => ({ ...t, late: true }));
  let inflight = null;
  let retryTimer = null;

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(queue)); } catch { /* voll: bleibt im Speicher */ }
  }

  function remove(id) {
    queue = queue.filter((t) => t.id !== id);
    save();
  }

  function flush() {
    if (inflight || retryTimer || !queue.length || !isOpen()) return;
    inflight = queue[0];
    const { id, token, playerId, drink, at } = inflight;
    send({ type: 'increment', token, playerId, drink, delta: 1, tapId: id, ago: Math.max(0, Date.now() - at), ref: id });
  }

  return {
    tap(drink, token, playerId) {
      queue.push({ id: newId(), drink, token, playerId, at: Date.now(), late: !isOpen() });
      save();
      flush();
    },

    // Quittung: true, wenn sie zu einem Tipp gehörte
    ack(ref) {
      if (!queue.some((t) => t.id === ref)) return false;
      if (inflight?.id === ref) inflight = null;
      remove(ref);
      flush();
      return true;
    },

    // Fehler zu einem Tipp. true = still erledigt, false = der Aufrufer zeigt
    // ihn an. Nachgereichte Tipps prallen nicht an der Drossel ab, sie warten
    // kurz; Tipps eines anderen Kontos (abgemeldet) verfallen still.
    fail(ref, code, playerId) {
      const t = queue.find((x) => x.id === ref);
      if (!t) return false;
      if (inflight?.id === ref) inflight = null;
      if (code === 'throttle' && t.late) {
        retryTimer = setTimeout(() => { retryTimer = null; flush(); }, THROTTLE_RETRY_MS);
        return true;
      }
      remove(ref);
      flush();
      return t.playerId !== playerId;
    },

    // Verbindung weg: was noch wartet, gilt ab jetzt als nachgereicht
    disconnected() {
      inflight = null;
      queue.forEach((t) => { t.late = true; });
      save();
    },

    flush,

    // Wartende Tipps eines Kontos je Sorte (für die Anzeige)
    pending(playerId) {
      const n = { beer: 0, shot: 0, mix: 0 };
      for (const t of queue) if (t.playerId === playerId && t.drink in n) n[t.drink] += 1;
      return n;
    },
  };
}

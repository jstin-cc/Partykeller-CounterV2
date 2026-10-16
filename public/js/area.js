// Bereich der App (D-019, seit D-110 wieder zwei): erkannt am URL-Präfix.
// AREA liefert API-/WS-Präfix, Storage-Keys (Prefix 'pk' bzw. 'ys', bestehende
// Logins bleiben gültig), den Namen und die Wortmarke. Beide Bereiche sehen
// gleich aus; die Seiten bekommen Wortmarke und html[data-area] schon vom
// Server (server/index.js renderPage).
const AREAS = {
  partykeller: { id: 'partykeller', base: '/partykeller', name: 'SV Partykeller', title: 'SV Partykeller', label: 'Partykeller', keyPrefix: 'pk', mark: ['Party', 'Keller'] },
  youngstars: { id: 'youngstars', base: '/youngstars', name: 'Youngstars', title: 'Youngstars', label: 'Youngstars', keyPrefix: 'ys', mark: ['Young', 'Stars'] },
};

export const AREA = location.pathname.startsWith('/youngstars') ? AREAS.youngstars : AREAS.partykeller;

// Für die Auswahlseite: zuletzt genutzter Bereich („Zuletzt hier", Sprung
// beim Öffnen von /, wenn man in beiden angemeldet ist)
try { localStorage.setItem('last_area', AREA.id); } catch { /* ohne Speicher egal */ }

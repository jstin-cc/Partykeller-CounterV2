import { config } from './config.js';
import { createDb } from './db.js';

// Bereiche der App. Seit D-080 gibt es nur noch den Partykeller (Youngstars
// ist darin aufgegangen); die Struktur bleibt, damit API, WebSocket und Tokens
// unverändert bereichsbezogen arbeiten. `broadcast` wird von setupWs() gesetzt
// und schickt den State an alle WebSocket-Clients.
export const areas = [
  {
    id: 'partykeller',
    base: '/partykeller',
    name: 'SV Partykeller',
    db: createDb(config.dbPath),
    adminPassword: config.adminPassword,
    broadcast: () => {},
  },
];

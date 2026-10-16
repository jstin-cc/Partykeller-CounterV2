import { config } from './config.js';
import { createDb } from './db.js';

// Bereiche der App (D-019). Seit D-110 wieder zwei: Partykeller und
// Youngstars, im gleichen Design (D-080), nur mit eigener Wortmarke, eigener
// Datenbank und eigenem Admin-Passwort. `mark` ist die Wortmarke (Serif über
// fetter Grotesk), `title` der Name im Fenstertitel, `label` der
// Kurzname (Manifest). `broadcast` wird von
// setupWs() gesetzt und schickt den State an alle WebSocket-Clients.
export const areas = [
  {
    id: 'partykeller',
    base: '/partykeller',
    name: 'SV Partykeller',
    title: 'SV Partykeller',
    label: 'Partykeller',
    mark: ['Party', 'Keller'],
    db: createDb(config.dbPath),
    adminPassword: config.adminPassword,
    broadcast: () => {},
  },
  {
    id: 'youngstars',
    base: '/youngstars',
    name: 'Youngstars',
    title: 'Youngstars',
    label: 'Youngstars',
    mark: ['Young', 'Stars'],
    db: createDb(config.youngstarsDbPath),
    adminPassword: config.youngstarsAdminPassword,
    broadcast: () => {},
  },
];

import { config } from './config.js';
import path from 'node:path';
import { createDb } from './db.js';
import { createAutoBackup } from './autobackup.js';

// Bereiche der App (D-019). Seit D-110 wieder zwei: Partykeller und
// Youngstars, im gleichen Design (D-080), nur mit eigener Wortmarke, eigener
// Datenbank und eigenem Admin-Passwort. `mark` ist die Wortmarke (Serif über
// fetter Grotesk), `title` der Name im Fenstertitel, `label` der
// Kurzname (Manifest). `broadcast` wird von
// setupWs() gesetzt und schickt den State an alle WebSocket-Clients.
// `backups` sichert beim ersten Getränk des Tages nach `backups/` neben der
// Datenbank (D-121); `clients` zählt die verbundenen Geräte (D-123).
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

for (const area of areas) {
  const dbPath = area.id === 'youngstars' ? config.youngstarsDbPath : config.dbPath;
  area.backups = createAutoBackup(area, path.join(path.dirname(dbPath), 'backups'));
}

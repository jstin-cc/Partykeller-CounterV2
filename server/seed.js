// Dev-Seed: legt Testnutzer mit PIN 1111 an (nur für lokale Entwicklung).
// Aufruf: npm run seed
import { config } from './config.js';
import { createDb } from './db.js';
import { hashPin } from './auth.js';

const db = createDb(config.dbPath);

const demo = [
  { name: 'Basti', beers: 14, shots: 6, mixes: 4 },
  { name: 'Flo', beers: 11, shots: 9, mixes: 2 },
  { name: 'Jule', beers: 9, shots: 3, mixes: 7 },
  { name: 'Mira', beers: 7, shots: 5, mixes: 1 },
  { name: 'Tom', beers: 5, shots: 2, mixes: 3 },
  { name: 'Nina', beers: 6, shots: 4, mixes: 5 },
  { name: 'Pauli', beers: 4, shots: 1, mixes: 2 },
  { name: 'Lea', beers: 3, shots: 7, mixes: 0 },
];

const pinHash = hashPin('1111');
for (const { name, beers, shots, mixes } of demo) {
  if (db.getPlayerByName(name)) {
    console.log(`überspringe ${name} (existiert schon)`);
    continue;
  }
  const p = db.createPlayer(name, pinHash);
  // Alles als echte Protokolleinträge (D-104: Zähler = Protokoll): verteilt
  // auf die letzten drei Samstage ab 21 Uhr, dazu je eins für „heute"
  const counts = { beer: beers, shot: shots, mix: mixes };
  const sat = new Date();
  sat.setDate(sat.getDate() - ((sat.getDay() + 1) % 7 || 7));
  sat.setHours(21, 0, 0, 0);
  let i = 0;
  for (const [drink, n] of Object.entries(counts)) {
    for (let k = 1; k < n; k++, i++) {
      db.logDrink(p.id, drink, sat.getTime() - (i % 3) * 7 * 86400000 + i * 4 * 60000);
    }
    if (n > 0) db.logDrink(p.id, drink);
  }
  console.log(`angelegt: ${name} (PIN 1111, ${beers} Bier / ${shots} Shots / ${mixes} Mischen)`);
}

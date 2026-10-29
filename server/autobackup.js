import fs from 'node:fs';
import path from 'node:path';
import { partyDayString } from './db.js';

// Automatische Sicherung (D-121): Das erste Getränk eines Party-Tags legt eine
// Vollsicherung des Bereichs ab — den Stand des letzten Abends plus dieses
// eine Getränk. Es bleiben die drei jüngsten liegen. Gleiches Format wie
// „Backup herunterladen“ (D-034), einspielen also ganz normal im Admin.
const KEEP = 3;

export function createAutoBackup(area, dir) {
  const prefix = `${area.id}-auto-`;
  const files = () => {
    try {
      return fs.readdirSync(dir).filter((f) => f.startsWith(prefix) && f.endsWith('.json')).sort();
    } catch {
      return [];
    }
  };
  // Tag der jüngsten vorhandenen Sicherung: nach einem Neustart nicht noch einmal
  let lastDay = files().at(-1)?.slice(prefix.length, -'.json'.length) ?? null;

  async function write(day) {
    const file = path.join(dir, `${prefix}${day}.json`);
    const json = JSON.stringify({ ...area.db.exportBackup(), area: area.id });
    await fs.promises.mkdir(dir, { recursive: true });
    // Erst vollständig schreiben, dann umbenennen: nie eine halbe Datei
    await fs.promises.writeFile(`${file}.tmp`, json);
    await fs.promises.rename(`${file}.tmp`, file);
    for (const old of files().slice(0, -KEEP)) await fs.promises.rm(path.join(dir, old), { force: true });
  }

  // Jüngste Sicherung für den Server-Status im Admin (D-123)
  function latest() {
    const name = files().at(-1);
    if (!name) return null;
    try {
      return { file: name, at: fs.statSync(path.join(dir, name)).mtimeMs };
    } catch {
      return null;
    }
  }

  // Nach jedem gezählten Getränk aufrufen; schreibt nur beim ersten des Tages
  function afterDrink() {
    const day = partyDayString();
    if (day === lastDay) return;
    const previous = lastDay;
    lastDay = day;
    // Nach der Antwort an das Handy, damit der Tipp nicht auf die Platte wartet
    setImmediate(() => {
      write(day).catch((err) => {
        lastDay = previous;   // beim nächsten Getränk neu versuchen
        console.warn(`[${area.id}] Automatische Sicherung fehlgeschlagen: ${err.message}`);
      });
    });
  }

  return { afterDrink, latest };
}

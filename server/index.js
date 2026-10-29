import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { config } from './config.js';
import { areas } from './areas.js';
import { hashPin, verifyPin, playerToken, adminToken, checkPassword, verifyToken, tokenArea } from './auth.js';
import { setupWs } from './ws.js';
import { validName, validPin } from './validate.js';
import { validDayString } from './db.js';
import { archiveCsv } from './csv.js';
import { parseBackup } from './backup.js';
import { loginLimiter, createRateLimiter } from './ratelimit.js';

// Datum fürs Dateinamens-Suffix der Sicherung (lokal, nicht UTC)
const STARTED_AT = Date.now();

function todayStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');

const app = express();

// Body-Parser: normal knapp gehalten, nur die eingespielte Vollsicherung darf
// groß sein (ein Log über mehrere Jahre sprengt sonst das Standardlimit).
const smallJson = express.json({ limit: '100kb' });
const backupJson = express.json({ limit: '20mb' });
app.use((req, res, next) =>
  (req.path.endsWith('/api/import/backup') ? backupJson : smallJson)(req, res, next));

// Rate-Limit gegen PIN-Raten: max. 5 Fehlversuche pro Minute und IP,
// danach 60 Sekunden Sperre. Erfolgreicher Login setzt zurück.
// Geteilt mit dem Reset über den WebSocket (ratelimit.js).

// Missbrauchsschutz für die offene Kontoerstellung: max. 6 neue Konten pro
// Minute und IP, und ein harter Gesamt-Deckel pro Bereich (verhindert
// Massen-Anlage/DB-Spam durch ein Skript; für echte Gäste unmerklich).
const createLimiter = createRateLimiter({ max: 6, windowMs: 60_000 });
const MAX_PLAYERS = 200;

// Ein API-Router pro Bereich (D-019): identische Endpunkte, aber eigene DB,
// eigenes Admin-Passwort und bereichsgestempelte Tokens.
function createApiRouter(area) {
  const router = express.Router();
  const db = area.db;

  router.get('/state', (_req, res) => res.json(db.getState()));

  // Kurzstand für die Auswahlseite (D-110): Getränke heute, wer heute dabei
  // ist und wer vorne liegt (ohne Ausgeblendete, Tiebreak wie auf dem TV)
  router.get('/summary', (_req, res) => {
    const today = db.rankedPlayers()
      .filter((p) => !p.hidden)
      .map((p) => ({ name: p.name, n: p.beersToday + p.shotsToday + p.mixesToday, ts: p.lastDrinkTsToday ?? Infinity }))
      .filter((p) => p.n > 0)
      .sort((a, b) => b.n - a.n || a.ts - b.ts || a.name.localeCompare(b.name, 'de'));
    res.json({
      drinksToday: today.reduce((sum, p) => sum + p.n, 0),
      activeToday: today.length,
      leader: today[0]?.name ?? null,
    });
  });

  // Nur die Konten für die Anmeldeliste (D-047): id, Name, ausgeblendet, PIN
  // gesetzt — in Ranglisten-Reihenfolge, ohne den Rest des States.
  router.get('/players', (_req, res) => res.json({
    players: db.rankedPlayers().map((p) => ({ id: p.id, name: p.name, hidden: p.hidden, hasPin: p.hasPin })),
  }));

  // Abend-Archiv: alle Party-Tage mit Sieger, Teilnehmern und Gesamtmengen
  router.get('/archive', (_req, res) => res.json({ days: db.getArchive() }));

  // Detail eines Party-Tags (Story-Grafik im Archiv)
  router.get('/archive/:day', (req, res) => {
    if (!validDayString(req.params.day)) return res.status(400).json({ error: 'Ungültiger Tag' });
    res.json(db.getArchiveDay(req.params.day));
  });

  // Übergabedateien (CSV) fürs Abend-Archiv (D-025): alle Abende am Stück oder
  // ein einzelner. Wie die Archiv-Bearbeitung nur für Admins (D-027) — das
  // Token kommt im Authorization-Header, deshalb holt die Archiv-Seite die
  // Datei per fetch und nicht über einen einfachen Link.
  function requireAdmin(req, res) {
    const auth = verifyToken((req.get('authorization') ?? '').replace(/^Bearer /, ''));
    if (auth?.role !== 'admin' || tokenArea(auth) !== area.id) {
      res.status(403).json({ error: 'Nur für Admins' });
      return false;
    }
    return true;
  }

  // Getränke-Protokoll eines Abends (D-073): jedes Getränk einzeln, mit Uhrzeit —
  // nur für Admins, wie die Exporte
  router.get('/log/:day', (req, res) => {
    if (!requireAdmin(req, res)) return;
    if (!validDayString(req.params.day)) return res.status(400).json({ error: 'Ungültiger Tag' });
    res.json(db.getDayLog(req.params.day));
  });

  function sendCsv(res, filename, csv) {
    res.type('text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  router.get('/export/archive', (req, res) => {
    if (!requireAdmin(req, res)) return;
    sendCsv(res, `${area.id}-abende-gesamt.csv`, archiveCsv(db.getExportNights()));
  });

  router.get('/export/archive/:day', (req, res) => {
    if (!requireAdmin(req, res)) return;
    const { day } = req.params;
    if (!validDayString(day)) return res.status(400).json({ error: 'Ungültiger Tag' });
    sendCsv(res, `${area.id}-abend-${day}.csv`, archiveCsv(db.getExportNights(day)));
  });

  // Vollsicherung (D-034): eine JSON-Datei mit allem, was der Bereich braucht,
  // um nach einem Geräte-Tausch identisch weiterzulaufen. Wie die CSV-Exporte
  // nur für Admins, deshalb Token im Header und Download per fetch.
  router.get('/export/backup', (req, res) => {
    if (!requireAdmin(req, res)) return;
    const backup = { ...db.exportBackup(), area: area.id };
    res.type('application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${area.id}-backup-${todayStamp()}.json"`);
    res.send(JSON.stringify(backup));
  });

  // Server-Status für den Admin (D-123): verbundene Geräte, Adressen im WLAN
  // (für die QR-Adresse), letzte automatische Sicherung, Laufzeit
  router.get('/admin/status', (req, res) => {
    if (!requireAdmin(req, res)) return;
    const addresses = Object.values(os.networkInterfaces()).flat()
      .filter((a) => a && a.family === 'IPv4' && !a.internal)
      .map((a) => `http://${a.address}:${config.port}${area.base}/`);
    res.json({
      startedAt: STARTED_AT,
      clients: area.clients?.() ?? { tv: 0, handy: 0, admin: 0 },
      addresses,
      lastBackup: area.backups.latest(),
    });
  });

  // Gegenstück: eine Sicherung wieder einspielen. Das ersetzt den kompletten
  // Bestand des Bereichs, ist also so destruktiv wie der Reset — deshalb
  // dasselbe eigene Lösch-Passwort (RESET_PASSWORD) und dasselbe Rate-Limit.
  router.post('/import/backup', (req, res) => {
    if (!requireAdmin(req, res)) return;
    if (rateLimited(req, res)) return;
    const { password, backup } = req.body ?? {};
    if (!checkPassword(password, config.resetPassword)) {
      loginLimiter.fail(req.ip);
      return res.status(403).json({ error: 'Falsches Lösch-Passwort' });
    }
    loginLimiter.clear(req.ip);
    // Sicherung des anderen Bereichs: technisch möglich, aber praktisch immer
    // ein Versehen (Youngstars-Daten im Partykeller) — deshalb abweisen.
    if (backup?.area && backup.area !== area.id) {
      return res.status(400).json({ error: 'Diese Sicherung stammt aus dem anderen Bereich' });
    }
    let parsed;
    try {
      parsed = parseBackup(backup);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
    let counts;
    try {
      counts = db.importBackup(parsed);
    } catch (err) {
      return res.status(400).json({ error: `Einspielen fehlgeschlagen: ${err.message}` });
    }
    area.broadcast();
    res.json(counts);
  });

  // Persönliche Statistik + Achievements fürs Nutzer-Dashboard
  router.get('/players/:id/stats', (req, res) => {
    if (!db.getPlayer(req.params.id)) return res.status(404).json({ error: 'Nutzer nicht gefunden' });
    res.json(db.getPlayerStats(req.params.id));
  });

  // Jahresrückblick einer Person (L23, D-095); ?year=2026, sonst das jüngste Jahr
  router.get('/players/:id/review', (req, res) => {
    if (!db.getPlayer(req.params.id)) return res.status(404).json({ error: 'Nutzer nicht gefunden' });
    const year = req.query.year === undefined ? null : Number(req.query.year);
    if (year !== null && !(Number.isInteger(year) && year >= 2000 && year <= 2100)) {
      return res.status(400).json({ error: 'Ungültiges Jahr' });
    }
    res.json(db.getPlayerReview(req.params.id, year));
  });

  function rateLimited(req, res) {
    const wait = loginLimiter.blockedFor(req.ip);
    if (wait === null) return false;
    res.status(429).json({ error: `Zu viele Fehlversuche – bitte ${wait} Sekunden warten.` });
    return true;
  }

  // Nutzer legen sich selbst an (Name + optionale PIN, D-018)
  router.post('/players', (req, res) => {
    if (!createLimiter.take(req.ip)) {
      return res.status(429).json({ error: 'Zu viele neue Konten – bitte kurz warten.' });
    }
    const { name, pin } = req.body ?? {};
    if (!validName(name)) return res.status(400).json({ error: 'Ungültiger Name (1-24 Zeichen)' });
    // PIN ist optional (D-018): leer => Konto ohne PIN; sonst müssen es 4 Ziffern sein
    const hasPin = pin !== undefined && pin !== null && pin !== '';
    if (hasPin && !validPin(pin)) return res.status(400).json({ error: 'PIN muss 4 Ziffern haben' });
    if (db.getPlayerByName(name.trim())) return res.status(409).json({ error: 'Name ist schon vergeben' });
    if (db.countPlayers() >= MAX_PLAYERS) {
      return res.status(429).json({ error: 'Maximale Teilnehmerzahl erreicht.' });
    }

    const player = db.createPlayer(name.trim(), hasPin ? hashPin(pin) : '');
    area.broadcast();
    res.status(201).json({
      player: { id: player.id, name: player.name },
      token: playerToken(player.id, area.id),
    });
  });

  // Gilt das Token auf diesem Handy noch? Das Dashboard fragt beim Öffnen
  // nach — nach einem neuen TOKEN_SECRET oder einem gelöschten Konto meldet es
  // sich dann ab, statt jeden Tipp still zu verwerfen.
  router.get('/session', (req, res) => {
    const auth = verifyToken((req.get('authorization') ?? '').replace(/^Bearer /, ''));
    const player = auth?.role === 'player' && tokenArea(auth) === area.id ? db.getPlayer(auth.sub) : null;
    if (!player) return res.status(401).json({ error: 'Nicht angemeldet' });
    res.json({ player: { id: player.id, name: player.name } });
  });

  router.post('/login', (req, res) => {
    if (rateLimited(req, res)) return;
    const { playerId, pin } = req.body ?? {};
    const player = typeof playerId === 'string' && playerId ? db.getPlayer(playerId) : null;
    if (!player) {
      loginLimiter.fail(req.ip);
      return res.status(401).json({ error: 'Name oder PIN falsch' });
    }
    // Konto ohne PIN (D-018): direkt anmelden. Sonst muss die PIN stimmen.
    if (player.pin_hash) {
      if (!validPin(pin) || !verifyPin(pin, player.pin_hash)) {
        loginLimiter.fail(req.ip);
        return res.status(401).json({ error: 'Name oder PIN falsch' });
      }
    }
    loginLimiter.clear(req.ip);
    res.json({
      player: { id: player.id, name: player.name },
      token: playerToken(player.id, area.id),
    });
  });

  router.post('/admin/login', (req, res) => {
    if (rateLimited(req, res)) return;
    if (!checkPassword(req.body?.password, area.adminPassword)) {
      loginLimiter.fail(req.ip);
      return res.status(401).json({ error: 'Falsches Passwort' });
    }
    loginLimiter.clear(req.ip);
    res.json({ token: adminToken(area.id) });
  });

  return router;
}

const [partykeller] = areas;

// Seiten eines Bereichs (D-110): dieselben HTML-Dateien für beide Bereiche,
// beim Ausliefern bekommen sie den Bereich (html[data-area]), dessen
// Wortmarke und den Fenstertitel. So steht schon im ersten Bild die richtige
// Wortmarke (kein Umschalten per Skript, Kaltstart-Bild und Morphs greifen).
// Jedes Mal frisch gelesen (wie vorher sendFile): ein Update der Dateien
// wirkt ohne Neustart, und die Seiten sind klein.
function renderPage(area, file) {
  const [top, bottom] = area.mark;
  return fs.readFileSync(path.join(publicDir, file), 'utf8')
    .replace('<html lang="de"', `<html lang="de" data-area="${area.id}"`)
    .replace('<title>SV Partykeller –', `<title>${area.title} –`)
    .replaceAll('<span class="wm-top">Party</span><span class="wm-bottom">Keller</span>',
      `<span class="wm-top">${top}</span><span class="wm-bottom">${bottom}</span>`);
}
const sendPage = (area, file) => (_req, res) => res.type('html').send(renderPage(area, file));

// Installierbare App je Bereich: eigenes Manifest mit eigenem Start-Pfad,
// damit beide nebeneinander auf dem Handy liegen können
function manifest(area) {
  const base = JSON.parse(fs.readFileSync(path.join(publicDir, 'manifest.webmanifest'), 'utf8'));
  if (area === partykeller) return base;
  return {
    ...base,
    name: `${area.label} Counter`,
    short_name: area.label,
    description: `Getränke-Counter für die ${area.name} – Bier, Shots und Mischen zählen.`,
    start_url: `${area.base}/`,
    scope: `${area.base}/`,
  };
}

// API: /<bereich>/api/*; der Alt-Pfad /api/* bleibt als Partykeller-Alias
// erhalten (bestehende Geräte/Links).
for (const area of areas) {
  app.use(area === partykeller ? ['/api', `${area.base}/api`] : `${area.base}/api`, createApiRouter(area));
}

app.get('/health', (_req, res) => res.json({ ok: true }));

// Wurzel: Auswahlseite der beiden Bereiche (D-110). Angemeldete Handys
// springen dort per Kopf-Skript direkt in ihren Bereich.
app.get('/', (_req, res) => res.sendFile(path.join(publicDir, 'start.html')));

for (const area of areas) {
  // /<bereich> -> /<bereich>/ (mit Slash lösen relative Links korrekt auf);
  // Express behandelt beide Schreibweisen gleich, daher req.path prüfen.
  app.get(area.base, (req, res) => {
    if (!req.path.endsWith('/')) return res.redirect(`${area.base}/`);
    sendPage(area, 'index.html')(req, res);
  });
  app.get(`${area.base}/index.html`, sendPage(area, 'index.html'));
  for (const page of ['dashboard', 'onboarding', 'tv', 'admin', 'abende']) {
    app.get(`${area.base}/${page}`, sendPage(area, `${page}.html`));
  }
  const mf = JSON.stringify(manifest(area));
  app.get(`${area.base}/manifest.webmanifest`, (_req, res) => res.type('application/manifest+json').send(mf));
  // Statics unter dem Präfix (Assets/CSS/JS sind in den Seiten relativ verlinkt)
  app.use(area.base, express.static(publicDir, { index: false }));
}

// Alt-Pfade aus der Zeit vor der Auswahlseite -> Partykeller-Bereich
// (gespeicherte QR-Codes, Lesezeichen, TV-Kiosk auf dem Pi).
for (const p of ['/dashboard', '/onboarding', '/tv', '/admin', '/abende']) {
  app.get(p, (_req, res) => res.redirect(`${partykeller.base}${p}`));
}

app.use(express.static(publicDir, { index: false }));

// Fehler aus dem Body-Parser als JSON beantworten (die Admin-Oberfläche zeigt
// error an) — sonst käme beim Import einer kaputten Datei eine HTML-Seite.
app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') {
    const backup = req.path.endsWith('/api/import/backup');
    return res.status(413).json({ error: backup ? 'Sicherung ist zu groß (max. 20 MB)' : 'Anfrage ist zu groß' });
  }
  if (err instanceof SyntaxError && 'body' in err) return res.status(400).json({ error: 'Datei ist kein gültiges JSON' });
  if (res.headersSent) return next(err);
  // Alles andere knapp als JSON, ohne Stacktrace: Express' Standardseite zeigte
  // sonst Dateipfade und Code-Zeilen jedem im WLAN
  const status = Number.isInteger(err?.status) && err.status >= 400 ? err.status : 500;
  if (status >= 500) console.error(`${req.method} ${req.path}: ${err?.stack ?? err}`);
  return res.status(status).json({ error: status >= 500 ? 'Interner Fehler' : 'Ungültige Anfrage' });
});

const server = app.listen(config.port, () => {
  console.log(`Partykeller-Counter läuft auf http://0.0.0.0:${config.port}`);
});

// Stand des Frontends (D-122): Prüfsumme über alle Dateien in public/. Ändert
// sie sich nach einem Update, lädt der TV beim Wiederverbinden selbst neu.
function buildId(dir) {
  const hash = crypto.createHash('sha1');
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else hash.update(path.relative(dir, p)).update(fs.readFileSync(p));
    }
  };
  walk(dir);
  return hash.digest('hex').slice(0, 12);
}

setupWs(server, areas, { build: buildId(publicDir) });

# CLAUDE.md — Projektregeln Getränke-Counter Partykeller

## Was das ist

Getränke-Counter für einen Partykeller: Gäste zählen Biere/Shots/Mischen am
Handy, ein TV zeigt die All-Time-Rangliste. Läuft als **ein Node.js-Prozess** auf
einem Laptop oder Raspberry Pi im lokalen WLAN, **ohne Internet**. Seit D-110
gibt es wieder **zwei Bereiche im gleichen Design** (Fast-Schwarz/Orange,
D-080): **Partykeller** (`/partykeller/*`) und **Youngstars**
(`/youngstars/*`), getrennt nach Datenbank, Tokens und Admin-Passwort; sie
unterscheiden sich nur über die Wortmarke (und das SV-Logo, das nur der
Partykeller zeigt, auf dem TV beide). `/` ist die Auswahlseite
(`public/start.html`). Dieselben HTML-Dateien bedienen beide Bereiche: der Server setzt beim Ausliefern
`html[data-area]`, Wortmarke und Titel (`server/index.js` `renderPage`),
`public/js/area.js` erkennt den Bereich am Pfad. Vollständiger Plan in
[PLAN.md](PLAN.md), Entscheidungen in [DECISIONS.md](DECISIONS.md), Stand in
[PROGRESS.md](PROGRESS.md).

## Stack (festgelegt, siehe D-001)

- Node.js, Express (Statics + REST), `ws` (WebSockets), `better-sqlite3`, `dotenv`
- Frontend: statisches HTML/CSS/Vanilla-JS (ES-Module), **kein Build-Step, kein Framework**
- DB: SQLite (WAL), je Bereich eine Datei: `data/partykeller.db`,
  `data/youngstars.db`; Schema in PLAN.md §3

## Harte Regeln

1. **PROGRESS.md nach jedem abgeschlossenen Schritt aktualisieren** (abhaken,
   „Aktueller Stand" und „Offen" pflegen, Verlauf neueste oben) und
   mitcommitten — sie ist die Kontextverlust-Sicherung. Älterer Verlauf
   wandert wortgleich nach `docs/PROGRESS-ARCHIV.md`.
2. Jede Architektur-/Stack-Entscheidung kommt in **DECISIONS.md**: Die Datei
   beschreibt nach Themen, was **heute gilt** (D-117). Neue Entscheidung =
   nächste D-Nummer, Regel im passenden Abschnitt ergänzen oder ersetzen
   (Überholtes streichen), Nummer in Klammern dahinter, eine Zeile im
   „Verlauf“ unten. Nummern werden nie neu vergeben. Der alte Wortlaut
   D-001–D-116 liegt unverändert in `docs/DECISIONS-ARCHIV.md` und wird nicht
   mehr ergänzt.
3. README.md und CLAUDE.md bei relevanten Änderungen sofort mitziehen.
4. **Keine CDN-/Internet-Ressourcen im Frontend** — alles wird in `public/`
   vendored (Fonts, Libs). Die App muss offline im WLAN funktionieren.
5. Keine Secrets im Repo: `ADMIN_PASSWORD`, `YOUNGSTARS_ADMIN_PASSWORD`,
   `RESET_PASSWORD` und `TOKEN_SECRET` nur über `.env` (Vorlage:
   `.env.example`). Der Design-Prototyp-Wert `keller2026` wird nie übernommen.
6. Server validiert jede Mutation (Token, Rolle, Wertebereiche); Nutzer dürfen
   nur den eigenen Zähler um +1 erhöhen, alles andere ist Admin (D-004).
   Tokens sind bereichsgestempelt (D-019) und gelten nur im eigenen Bereich.
7. Persistenz ist zwingend: Ein Server-Neustart darf keine Daten und keine
   Logins verlieren (D-006).

## Design (verbindlich)

- Quelle seit D-078: **Designsprache von landonorris.com**, festgehalten in
  [docs/DESIGN-LANDO.md](docs/DESIGN-LANDO.md) (löst die Claude-Design-v3-
  Vorlage und PLAN.md §8 ab).
- Tokens und Komponenten in `public/css/theme.css` (Lando-Palette:
  Fast-Schwarz, Orange als Akzent, Off-White als Zweitakzent; Schriften Mona Sans +
  Instrument Serif, lokal), Bewegung und Formen (Kerben-Karten, Kringel,
  Einblendungen, Menü) in `public/js/lando.js`. Referenz-Umsetzung:
  `public/index.html`. Neue Seiten/Komponenten nur mit diesen Bausteinen,
  keine hart codierten Farben, kein `backdrop-filter`.
- UI-Sprache ist Deutsch, **ohne Gendern** (kein Doppelpunkt, Sternchen oder
  Binnen-I) — „12 Teilnehmer", nicht „12 Teilnehmer:innen" (D-050).
  Zähler mit der Klasse `.num` (Mona Sans, **proportionale** Ziffern — keine
  `tabular-nums`, deren durchgestrichene Null nicht zum Lando-Look passt;
  Spalten über feste Breiten/rechtsbündig ausrichten, D-078).

## Konventionen

- Sprache im Repo (Doku, Commits): Deutsch; Code-Bezeichner Englisch.
- Commits: klein, beschreibend, ein Thema pro Commit.
- Keine neuen npm-Dependencies ohne DECISIONS.md-Eintrag.
- Pull Requests nach dem Push **immer direkt mergen** — nicht auf ein Review
  warten (Wunsch des Nutzers, 2026-09-24).
- `data/` und `.env` sind gitignored; niemals committen.

## Status

Alle Meilensteine (M0–M8) sind umgesetzt, die App ist funktional komplett.
Aktueller Stand und offene Restpunkte stehen immer in PROGRESS.md — vor
jeder Arbeit dort nachsehen.

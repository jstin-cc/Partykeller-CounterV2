# DECISIONS.md — Entscheidungen, Stand heute

Was im Projekt gilt und warum, nach Themen geordnet. Jede Regel steht so da,
wie sie **heute** gilt; die D-Nummern in Klammern verweisen auf die
Entscheidungen, aus denen sie stammt (so bleiben Verweise wie „D-053“ in
Code-Kommentaren auffindbar). Der vollständige alte Wortlaut aller Einträge
D-001 bis D-116, mit Entstehungsgeschichte und ausführlicher Begründung,
steht unverändert in [docs/DECISIONS-ARCHIV.md](docs/DECISIONS-ARCHIV.md).

**Pflege (D-116, D-117):** Eine neue Entscheidung bekommt die nächste Nummer
(zuletzt D-119) und wird im passenden Abschnitt eingearbeitet: neue Regel
ergänzen oder die bestehende ersetzen, Überholtes streichen statt daneben
stehen lassen. Unten im Abschnitt „Verlauf“ kommt je Nummer eine Zeile dazu
(Datum, worum es ging). Nummern werden nie neu vergeben; D-082 gibt es nicht.

---

## 1. Grundlagen und Betrieb

- **Stack:** ein Node.js-Prozess mit Express (Statics + REST), `ws`
  (WebSockets), `better-sqlite3`, `dotenv`. Synchrones SQLite in einem
  Event-Loop, dadurch keine Race Conditions. (D-001)
- **Frontend:** statisches HTML/CSS/Vanilla-JS als ES-Module, kein Build-Step,
  kein Framework. (D-007)
- **Offline:** keine CDN- oder Internet-Ressourcen; Schriften und Bibliotheken
  liegen in `public/`. Die App läuft im WLAN ohne Internet. (D-007, D-078)
- **Neue npm-Abhängigkeiten** nur mit Eintrag hier. Diagramme, Story-Bilder,
  Effekte und Strömung sind deshalb von Hand gebaut (SVG, Canvas, WebGL2).
  (D-029, D-049, D-081)
- **Konfiguration** über `.env` (Vorlage `.env.example`): `ADMIN_PASSWORD`
  (Pflicht), `TOKEN_SECRET` (Pflicht, mind. 16 Zeichen), `RESET_PASSWORD`
  (sonst gilt `ADMIN_PASSWORD`), `YOUNGSTARS_ADMIN_PASSWORD` (sonst gilt
  `ADMIN_PASSWORD`), `PORT`, `DB_PATH`, `YOUNGSTARS_DB_PATH`. Ohne Pflichtwerte
  startet der Server nicht; im Repo stehen nie Passwörter. (D-003, D-014,
  D-110)
- **Betrieb:** auf einem Laptop oder Raspberry Pi im Keller, als systemd-Dienst
  (`deploy/`), TV im Chromium-Kiosk auf `/tv`. Updates per `git pull` und
  Neustart; der TV lädt danach von selbst neu, sobald sich der Stand von
  `public/` geändert hat (Prüfsumme, nach jedem Verbinden als
  `{ type: 'build' }` geschickt). `package.json` erlaubt die Build-Skripte von better-sqlite3
  (`allowScripts`); bei „compiled against a different Node.js version“ hilft
  die Anleitung im README. Die Instanz im Partykeller kam per
  `git remote set-url` + `git reset --hard` aus dem alten Repo. (D-109,
  D-122)
- **PWA:** je Bereich ein Manifest (`/<bereich>/manifest.webmanifest`) mit
  eigenem Start-Pfad, Icons aus dem Logo. Der Service Worker ist bewusst ohne
  Cache, und Statics bekommen kein `Cache-Control: max-age` (ETag reicht):
  nach einem Update haben alle Handys sofort die neuen Dateien. (D-015, D-048,
  D-110)
- **Fehler:** unerwartete REST-Fehler antworten knapp als JSON, ohne
  Stacktrace; eine kaputte WebSocket-Adresse bringt den Server nicht zum
  Absturz. (D-109)
- **Dev-Daten:** `npm run seed` legt Testdaten als echte Protokolleinträge an;
  `promo/demo-server.mjs` startet eine Demo-Instanz mit Wegwerf-Datenbanken.
  (D-104)

## 2. Bereiche: Partykeller und Youngstars

- **Zwei Bereiche** in einem Prozess: `/partykeller/*` und `/youngstars/*`,
  getrennt nach Datenbank (`data/partykeller.db`, `data/youngstars.db`),
  Tokens und Admin-Passwort; das Lösch-Passwort ist gemeinsam, ein Reset
  löscht nur den eigenen Bereich. (D-019, D-110)
- **Gleiches Design:** beide sehen gleich aus (Fast-Schwarz/Orange, D-080) und
  haben dieselbe Getränke-Reihenfolge. Unterschied ist nur die Wortmarke
  („Party / Keller“ bzw. „Young / Stars“) und das SV-Logo, das nur der
  Partykeller zeigt; auf dem TV steht es in beiden Bereichen. „SV Partykeller“ (Unterschrift, ©, Emblem) steht in beiden
  Bereichen, die Youngstars gehören zum SV. (D-110, D-113, D-119)
- **Eine Codebasis:** dieselben HTML-Dateien bedienen beide Bereiche. Der
  Server setzt beim Ausliefern `html[data-area]`, Wortmarke und Titel
  (`renderPage`), damit schon das erste Bild stimmt; `public/js/area.js`
  erkennt den Bereich am Pfad und liefert API-/WS-Präfix, Storage-Präfix
  (`pk_*`/`ys_*`), Namen und Wortmarke. (D-019, D-110)
- **Auswahlseite** `/` (`public/start.html`): zwei Kerbenkarten mit Wortmarke
  und Live-Zeile aus `GET /<bereich>/api/summary` (Getränke heute, dabei,
  vorne). Ein Tipp lässt die Karte die Seite füllen, ihre Wortmarke gleitet in
  die Kopfleiste. Angemeldete Handys springen direkt ins Dashboard (bei beiden
  in den zuletzt genutzten, `last_area`); `/?wahl` zeigt die Auswahl trotzdem.
  Im Menü steht „Bereich wechseln“. (D-110)
- **Alt-Pfade** ohne Präfix (`/tv`, `/dashboard`, `/admin`, `/abende`, `/api`,
  `/ws`) gehören zum Partykeller (QR-Codes, Lesezeichen, TV-Kiosk). (D-019,
  D-110)

## 3. Daten und Persistenz

- **Neustart verliert nichts:** alle Daten in SQLite (WAL), Logins über
  zustandslose Tokens. `synchronous` bleibt auf dem sicheren Standard.
  (D-006, D-046)
- **Datenmodell:** `players` mit All-Time-Zählern (`beers`, `shots`, `mixes`,
  `hidden`, `pin_hash`, `created_at`), `drink_log` mit jedem Getränk
  (`player_id`, `drink` ∈ beer/shot/mix, `ts`), `settings` als
  Schlüssel-Wert-Speicher, `facts` für eigene Fun-Facts, `taps` mit den
  Kennungen gezählter Tipps (älter als 7 Tage fliegt beim Start raus). Schema-Änderungen
  laufen beim Start idempotent als Migration. (D-005, D-010, D-012, D-015,
  D-120)
- **Drei Getränke:** Bier, Shots, Mischen (Code `beer`, `shot`, `mix`); ab zwei
  heißt es „Mischen“. (D-012, D-038)
- **Zähler = Protokoll:** jedes Getränk ist ein Log-Eintrag, Zähler +1 und
  Log-Eintrag laufen in einer Transaktion. Korrigiert wird nur über das
  Getränke-Protokoll, die Zähler ziehen dort immer mit. (D-046, D-073, D-104)
- **Party-Tag** = 06:00 bis 05:59 des Folgetags, als Uhrzeit gerechnet (auch in
  der Nacht der Zeitumstellung): in SQL erst Ortszeit, dann −6 h. Um 06:00
  schickt der Server von sich aus den neuen Stand. (D-005, D-101, D-109)
- **Einstellungen** in `settings`: `join_url` (QR-Adresse), `board_mode` und
  `board_day` (TV-Ansicht), `scroll_seconds` (1–30 s), `funfact_seconds`
  (30–300 s), `seasonal`, `pace_compare`, `night_name:<tag>` (Abend-Namen).
  (D-010, D-013, D-015, D-016, D-022, D-028, D-071, D-075)
- **Tempo:** Aggregate über vergangene Abende liegen in einem Cache
  (`getHistory()`), der beim Tageswechsel und bei Änderungen an der
  Vergangenheit verworfen wird; Heute-Abfragen laufen fest über
  `idx_drink_log_ts`; Broadcasts werden 100 ms gebündelt. (D-047, D-066)
- **Vollsicherung** als JSON im Admin: herunterladen und einspielen (alles des
  Bereichs inkl. IDs, PIN-Hashes, Log, Einstellungen, Fun-Facts). Einspielen
  ersetzt alles in einer Transaktion nach voller Prüfung, braucht das
  Lösch-Passwort und nimmt keine Sicherung des anderen Bereichs. Die `.env`
  gehört getrennt gesichert. (D-034)
- **Automatische Sicherung:** Das erste Getränk eines Party-Tags legt je
  Bereich eine Vollsicherung im selben Format nach `backups/` neben der
  Datenbank (`data/backups/<bereich>-auto-<tag>.json`, gitignored); die drei
  jüngsten bleiben. Geschrieben wird nach der Antwort ans Handy, erst in eine
  `.tmp`, dann umbenannt. (D-121)
- **CSV-Export** im Abend-Archiv, nur für Admins: ein Abend oder alle, Langformat
  `Tag;Datum;Wochentag;Name;Bier;Shots;Mischen;Gesamt`, Semikolon, CRLF,
  UTF-8-BOM, Formel-Zeichen entschärft, keine Summenzeile. Geladen per `fetch`
  mit Bearer-Token. (D-025, D-027)

## 4. Konten, Anmeldung und Sicherheit

- **Tokens:** HMAC-signiert mit `TOKEN_SECRET`, im `localStorage`, mit
  Bereichs-Stempel; ein Token gilt nur im eigenen Bereich. Ungültige Tokens
  (Fehler mit `code: 'auth'`) melden Dashboard, Archiv und Admin ab;
  `GET /api/session` prüft beim Öffnen. (D-006, D-019, D-101)
- **PIN optional pro Konto** (4 Ziffern, scrypt). Ohne PIN meldet ein Tipp auf
  den Namen direkt an; das ist für die Partyrunde gewollt. Der State verrät nur
  `hasPin`, nie den Hash. Der Admin kann PINs setzen und entfernen. (D-018)
- **Rechte:** Gäste dürfen nur den eigenen Zähler um +1 erhöhen; alles andere
  ist Admin und wird vom Server geprüft (Token, Rolle, Wertebereiche). Admins
  zählen nicht über `increment`, sondern korrigieren im Protokoll. (D-004,
  D-104)
- **Missbrauchsschutz:** 5 Fehlversuche pro Minute und IP sperren Logins,
  Admin-Login, Reset und Sicherungs-Import für 60 s (gemeinsamer
  `loginLimiter`); neue Konten höchstens 6 pro Minute und IP, maximal 200 je
  Bereich; +1 je Spieler im Schnitt einmal pro Sekunde, kurz bis zu 5.
  Passwörter werden zeitkonstant verglichen. (D-015, D-017, D-101)
- **WebSocket:** Fehler-Listener, `maxPayload` 16 KB, Heartbeat alle 30 s,
  Handler nur über `Object.hasOwn`. Nachrichten dürfen ein `ref` mitschicken;
  der Server antwortet dann mit `ack` oder `error` — Admin-Dialoge schließen
  erst auf Quittung. Die Quittung geht vor dem neuen Stand raus; die Drossel
  meldet `code: 'throttle'`. (D-046, D-101, D-120)
- **Tipps ohne WLAN gehen nicht verloren:** Jeder Tipp bekommt im Dashboard
  eine Kennung (`tapId`, 32 Hex-Zeichen) und wartet im `localStorage`, bis der
  Server ihn quittiert; gesendet wird einer nach dem anderen. Reißt die
  Verbindung ab, zählt die Anzeige trotzdem sofort mit, und nach dem
  Wiederverbinden (auch nach Neuladen) geht alles raus, mit dem Alter `ago`,
  damit der Tipp zu seiner Tippzeit zählt (höchstens 12 h zurück). Eine schon
  bekannte Kennung wird nur quittiert, nicht noch einmal gezählt. Nachgereichte
  Tipps warten an der Drossel, statt zu verfallen. (D-120)
- **Bewusst offen:** `/api/state` ist öffentlich (TV), Klartext-HTTP im WLAN,
  4-stellige PINs. (D-017)
- **Anmeldeliste** kommt aus `GET /api/players` (nur id, Name, ausgeblendet,
  PIN gesetzt), in Ranglisten-Reihenfolge; das zuletzt auf diesem Handy
  benutzte Konto steht ohne Kennzeichnung oben. Wer schon angemeldet ist,
  springt direkt ins Dashboard. (D-041, D-047, D-101)
- **Ausblenden** (Admin): das Konto fehlt in der All-Time-Rangliste (TV,
  Dashboard) und in der Anmeldeliste, zählt aber weiter und erscheint in
  „Heute“. Es ist keine Sperre. (D-013, D-015, D-037, D-102)

## 5. Rangliste und Kennzahlen

- **Tiebreak:** bei gleicher Summe vorn, wer zuerst auf dem Stand war (letztes
  Getränk früher); der Name nur als letzter Fallback. Gilt für TV, Dashboard,
  Archiv-Sieger und Tagessieger. (D-020, D-022)
- **Tagessieger:** wer an einem Party-Tag die meisten Getränke hat (Tiebreak
  wie oben). Das Wort ist überall „Tagessieger“, im Archiv „Abendsieger“ für
  den Sieger eines Abends. (D-023, D-070)
- **Rekordkurs:** der laufende Abend gegen den bisherigen Abend mit den meisten
  Getränken (aller Personen), jeweils ab dem ersten Getränk gerechnet; Pille
  ab 30 min, wenn der Abend vorn liegt: „🔥 Auf Rekordkurs! 73 : 32 nach 3 h ·
  Rekord-Abend 19.09.2026 (68)“. Der TV holt den Stand zusätzlich alle 5 min,
  weil der Vergleich mit der Uhr wandert. (D-024, D-045, D-115)
- **Meilensteine:** Hausmarke bei jedem 50. Getränk im Bereich; persönlich
  volle 100 gesamt und volle 50 je Sorte (30 min sichtbar). Grundlage ist das
  Log, weil nur dort steht, wann eine Marke fiel. (D-036, D-112)

## 6. Dashboard (Handy)

- **Kopf:** Namenskreis und großer Name; ab dem ersten Tagessieg ein Lorbeer um
  den Kreis und der Chip „n× Tagessieger“. Beim Scrollen fliegen Kreis und
  Name stufenlos in eine Pille der klebenden Kopfleiste. (D-040, D-067,
  D-070, D-098)
- **Zwei Tabs, Zählen und Profil**, der neue Inhalt gleitet von der Seite
  seines Tabs herein. (D-023, D-069)
- **Zählen:** „Getränke heute“ groß, daneben ▲/▼ mit dem Abstand zum eigenen
  Schnitt der früheren Abende bis zur gleichen Uhrzeit (Viertelstunden ab
  06:00 aus `/stats`, im Admin abschaltbar). Darunter je Getränk eine
  Kerbenkarte in der Getränkefarbe, die als Ganzes der Knopf ist (+1), mit
  Heute-Zahl und „Gesamt“ im Etikett; der alte Stand hallt als Umriss nach.
  Kein Minus-Knopf. (D-004, D-039, D-072, D-075, D-095, D-096, D-113)
- **Profil:** eine Ranglisten-Karte mit Umschalter Heute/All-Time (wählt
  selbst, bis man ihn anfasst), Platz, Vorder- und Hintermann („gleichauf“ bei
  Gleichstand) und „Ganze Rangliste ansehen“ als Blatt von unten (eigene Zeile
  markiert, „Du“-Pille, Rangkreise wie auf dem TV, Ausgeblendete fehlen außer
  man selbst). Darunter „Dein Jahr“, der All-Time-Stapel („Gesamt“, darunter
  der Stand nach den letzten Abenden), Abende, bester Abend, Ø pro Abend,
  Mischung, Anteil am Haus und die Abzeichen. Unten die Fußkarte mit
  Unterschrift. (D-030, D-033, D-040, D-054, D-095, D-102, D-113)
- **Abzeichen** als Umriss-Kerbenkarten mit eigenen Strich-Icons, gezählt über
  alle Abende: Tagessieger, Erster Trinker, Mitternachtsbier (Bier 00–01 Uhr),
  Drei in einer Stunde, Mischmeister (3 Mischen), dazu das Treue-Abzeichen
  nach Abenden (10 Stammgast, 20 Dauergast, 50 Kellerlegende, 100
  Ehrenmitglied, 200 Urgestein; nur die höchste Stufe, unter 10 keins).
  Grau = nie, Akzent-Linie = schon erreicht, gefüllt = heute. (D-015, D-023,
  D-031, D-093)
- **Jahresrückblick** („Dein Jahr“): Story-Seiten im Vollbild aus
  `GET /api/players/:id/review` (Summe, Lieblingsgetränk, bester Abend,
  Stempelkarte der Abende ab zwei Abenden, stärkste Stunde, Rivale, Abschluss);
  Tippen blättert, Halten pausiert, die letzte Seite speichert ein Bild. Die
  Karte wächst ins Vollbild, gleiche Titelwörter und die große Zahl gleiten
  von Seite zu Seite. (D-095, D-103, D-105, D-108)
- **Fuß:** nur „Abmelden“ (beendet die Sitzung, gleitet in die Anmeldeliste);
  alles andere steht im Menü. (D-090, D-092)
- **Onboarding** nach dem Anlegen eines Kontos (nicht beim Anmelden): drei
  Seiten (Zählen, TV-Rangliste, Profil) mit Schaubildern im Look der echten
  Oberfläche, „Überspringen“ jederzeit, `location.replace` ins Dashboard.
  (D-052, D-054, D-102)

## 7. TV-Scoreboard

- **Bühne:** feste 1080-Design-Pixel-Bühne, als Ganzes auf die Fenstergröße
  skaliert; sieht auf jeder Auflösung gleich aus. (D-021)
- **Ansichten**, nur im Admin umschaltbar: All-Time (ohne Ausgeblendete),
  Heute (wer heute etwas hat), Archiv-Abend (ein vergangener Abend, Titel mit
  Namen oder Datum). Beim Wechsel fährt das Board seitlich raus und rein.
  (D-013, D-015, D-022, D-028)
- **Kopf:** links Logo und Wortmarke, rechts die Teilnehmerzahl mit Summen und
  Rekordkurs-Pille rechtsbündig direkt links neben der QR-Karte („Scan / zum
  Beitreten“, Etikett „Mitmachen“). Der QR zeigt auf `join_url` (Admin),
  sonst auf die eigene Adresse. (D-010, D-059)
- **Podest** für die Plätze 1–3 als gefüllte Kerbenkarten in den Rangfarben,
  Namen darüber. Ab Platz 4 eine Tabelle mit Gesamtzahl in gefüllter Pille.
  (D-051, D-078)
- **Liste ab Platz 4:** Zeilenhöhe 66 Design-Pixel; passen nicht alle Zeilen,
  rücken sie zuerst zusammen (bis 54). Reicht das nicht, rotiert das Fenster
  Zeile für Zeile (Tempo im Admin) und springt am Ende schnell nach oben;
  sichtbar sind nur ganze Zeilen, die letzten beiden blenden über ihre
  Deckkraft aus (55 %, 20 %), die angeschnittene wird weggeschnitten.
  Werte ändern sich in den Zeilen (Pop, kurzes Aufleuchten), Umsortieren
  gleitet per FLIP. (D-012, D-014, D-021, D-055, D-056, D-113)
- **Positionswechsel:** einige Sekunden ▲n/▼n am Namen; wer in der Liste
  überholt, zieht eine Geisterspur aus Umriss-Kopien hinter sich her. Keine
  Abstände, Bestwert- oder Hausrekord-Etiketten. (D-093, D-106, D-107)
- **Fun-Fact-Band** eine Zeile hoch, lange Texte schrumpfen statt umzubrechen.
  Inhalte: Tages-Bestleistungen, Rekorde je Sorte, Statistik (Rekord-Abend,
  Stammgast, Seriensieger, Frühstart, durstigste Stunde, Bilanz), Comeback,
  Marken, Führungswechsel, Rekordkurs und eigene Meldungen. Die Liste rechnet
  `public/js/facts.js` (TV und Admin gleich); der Server ist die Uhr
  (`factIndex`, Takt aus `funfact_seconds`), damit alle TVs dasselbe zeigen.
  Einzahl bei 1. (D-012, D-014, D-023, D-026, D-036, D-043, D-054)
- **Große Momente** im Vollbild, nacheinander und nie beim ersten Stand nach
  dem Laden: Namens-Plakat (Abendsieger eines Archiv-Abends, neue Nr. 1 des
  Abends ab drei Getränken, höchstens alle drei Minuten) und Meilenstein-Bild
  („PROST“-Kacheln, Zahlkarte). Zum Ausprobieren `?moment=plakat` bzw.
  `?moment=meilenstein`. (D-095, D-096, D-100)
- **Effekt-Demo:** der Admin kann jeden Effekt auf allen TVs des Bereichs
  auslösen (`demoEffect`, ändert keine Daten) und mit „Alle Effekte beenden“
  sofort abräumen. (D-099, D-100)

## 8. Admin

- **Aufbau:** am Rechner zwei Spalten (Konten bzw. Protokoll links, klebende
  Seitenleiste mit TV-Anzeige, eigenen Fun-Facts, Einrichtung und Danger Zone
  rechts), auf Handy und Tablet ein Umschalter Konten / Protokoll / TV / Mehr.
  Menüknopf wie überall, „Admin abmelden“, „‹ Zurück“ bzw. „‹ Zur Anmeldung“.
  Das Admin-Token liegt in der `sessionStorage`. (D-061, D-065, D-073,
  D-102)
- **Konten:** alphabetisch, Suche und Filter Alle / Heute dabei /
  Ausgeblendet, Zähler nur zur Ansicht. Umbenennen, PIN, Ausblenden, Löschen
  (eigener Dialog) und „Im Protokoll ansehen“ im ⋯-Menü; ausgeblendete Konten
  dimmen nur ihren Inhalt. (D-014, D-061, D-063, D-064, D-102, D-104)
- **Getränke-Protokoll:** jedes Getränk eines Abends einzeln, nach Stunde
  gruppiert, Filter nach Konto und Sorte, Abende per ‹ ›. Konto, Sorte und
  Uhrzeit ändern (im selben Abend, nicht in der Zukunft), löschen mit
  Rückgängig, nachtragen. „Doppelt?“ markiert dasselbe Getränk desselben
  Kontos binnen 5 s. Gefüllte Getränke-Pillen. Lesen per
  `GET /api/log/<tag>` (Admin), ändern per `editLog`/`deleteLog`/`addLog`.
  (D-073, D-074)
- **TV-Anzeige:** Ansicht umschalten, Rotations- und Fun-Fact-Takt, „Gerade
  auf dem TV“ mit vor/zurück und „Alle Fun-Facts ansehen“. Eigene Fun-Facts
  (Titel bis 30, Text bis 160 Zeichen, max. 50) als kompakte, in sich
  scrollende Liste mit ⋯-Menü am `<body>`. Darunter die Effekt-Demo. (D-015,
  D-016, D-043, D-062, D-099)
- **Einrichtung:** QR-Adresse, Schalter Saison-Akzente und Schnitt-Vergleich,
  „Backup herunterladen“. **Danger Zone** (bleibt englisch): „Backup
  einspielen“ und „Alles zurücksetzen“, beide mit Lösch-Passwort. (D-034,
  D-061, D-070, D-071, D-075, D-114)

## 9. Abend-Archiv

- **Aufbau:** Chronik mit Hintergrundwechsel beim Scrollen: Kopf mit
  Kennzahlen-Satz („7 Abende, 399 Getränke, ein Keller.“), „Letzter Abend“ mit
  Abendsieger, Hall of Fame, alle Abende, Fußkarte mit „Nach oben“. (D-078,
  D-092, D-113)
- **Hall of Fame:** Bestenliste der Abendsiege — wer wie oft gewonnen hat, mit
  seinem besten Abend; Platz 1 gefüllt, „Rekord“ an dem, dem der stärkste
  Siegerabend gehört. (D-113)
- **Alle Abende** als seitlich blätterbares 3D-Register (natives Scrollen mit
  Snap, gedreht wird eine innere Ebene), Zähler, Fortschrittsbalken, Pfeile;
  gezeichnet in Blöcken von zwölf, der nächste kommt beim Blättern. Ohne
  Bewegung ein flaches Karussell. (D-042, D-094)
- **Abend-Karte:** Datum und Name, Abendsieger, Teilnehmer, Mengen, Verlauf pro
  Stunde als Kurve (alle zusammen, ab zwei Stunden, Spitzenstunde markiert),
  „Story“ für alle. (D-029, D-032, D-091)
- **Story-Bild:** der Abend (bzw. der Jahresrückblick) als PNG 1080 × 1920, im
  Browser auf Canvas gezeichnet (`js/story.js`), Farben aus den Tokens,
  Wortmarke des Bereichs. Landet in den Downloads (kein Teilen über `http://`).
  (D-049, D-113)
- **Für Admins:** Name des Abends antippen zum Benennen (max. 40 Zeichen),
  „Protokoll“ öffnet das Getränke-Protokoll des Abends, „Auf den TV“, CSV je
  Abend und gesamt. Eine eigene Korrektur im Archiv gibt es nicht mehr.
  (D-022, D-027, D-028, D-076, D-077)

## 10. Design

- **Quelle** ist die Designsprache von landonorris.com, festgehalten in
  [docs/DESIGN-LANDO.md](docs/DESIGN-LANDO.md); Tokens und Bausteine in
  `public/css/theme.css`, Bewegung und Formen in `public/js/lando.js`. Keine
  hart codierten Farben. (D-078)
- **Palette:** Fast-Schwarz mit Navy-Stich als Grund; Orange als Akzent (Bier,
  Knöpfe, Platz 1), Off-White als Zweitakzent (Shots, Platz 2), Navy-Grau für
  Mischen (Platz 3). Lime nur noch als Detail in der Saison-Deko. (D-078,
  D-080)
- **Schriften:** Mona Sans und Instrument Serif, lokal. Zahlen (`.num`) mit
  proportionalen Ziffern, Spalten über feste Breiten. (D-078)
- **Signaturen:** Höhenlinien, Kerbenkarten, selbstzeichnende Kringel, die
  „SV Partykeller“-Unterschrift, Vollbild-Menü, Wortmarke. (D-078, D-088)
- **Kringel sparsam:** höchstens einer pro Seite, im Kopf (Auswahl „heute“,
  Anmeldung „du?“, Admin-Login „Zugang“, Archiv „Keller“, Onboarding Schritt 1).
  Dazu nur Kringel mit Bedeutung: Ereignisse (neue Nr. 1 auf dem TV, Sprung zu
  einem Abend im Archiv), Hinweis-Pfeile, der Menü-Strich und die
  Unterschrift. Kein Kringel unter Zwischen- und Fußüberschriften, im
  Admin-Kopf oder unter dem TV-Titel. (D-118)
- **Bewusst weggelassen:** Glas-Optik und `backdrop-filter`, Fotos, 3D-Modelle.
  (D-078)
- **Höhenlinien-Leuchten:** Strömungssimulation in WebGL2
  (`js/topo-fluid.js`). Auf allen Geräten zieht alle 7–13 s ein unsichtbarer
  Finger in einem Bogen darüber, ein Tipp oder Klick lässt die Linien
  aufleuchten, dazwischen schläft die Simulation; Handys mit kleineren Feldern.
  Ohne WebGL2 oder mit „Bewegung reduzieren“ stille Linien. (D-081, D-089,
  D-111)
- **Kaltstart-Bild:** beim ersten Öffnen in einem Tab fliegt die Wortmarke von
  einer orangen Fläche in die Kopfleiste. (D-093)
- **Saison-Akzente** nach Datum (Oktoberfest, Halloween, Winter, Silvester,
  Fasching): stehende Deko am Rand, auf dem TV Momente und Effekte; im Admin
  abschaltbar, `?jetzt=` stellt die Uhr zum Ausprobieren. (D-071, D-078)
- **Texte:** keine Erklär- und Fülltexte; es bleiben Überschriften, Labels,
  Zahlen, Fehlermeldungen, Leer-Zustände, Warnungen der Danger Zone und das
  Onboarding. Kein Gendern („Teilnehmer“). (D-035, D-038, D-050, D-079)
- **Hover** nur mit Maus; Handys sehen keine hängenden Hover-Zustände. (D-102)

## 11. Menü, Übergänge und Bewegung

- **Ein Menü** auf Anmeldung, Dashboard, Archiv und Admin
  (`js/site-menu.js`): angemeldet Zählen, Profil — Mehr: Abend-Archiv, TV,
  Admin, Bereich wechseln, Abmelden; abgemeldet Anmeldung statt Zählen und
  Profil, ohne Abmelden.
  Der aktuelle Punkt ist durchgestrichen, „TV“ öffnet einen neuen Tab.
  Onboarding und TV haben kein Menü. (D-092, D-102, D-110)
- **Seitenwechsel als Morph:** Elemente, die auf beiden Seiten stehen, gleiten
  an ihren neuen Platz (Wortmarke, Menüknopf, Logo, Namenskreis und Name,
  Menüpunkte in die Überschriften der Zielseite …), der Rest blendet über.
  Chrome/Safari per View Transition, Firefox per Skript (FLIP über
  `sessionStorage`). Paare, die erst ein Klick festlegt, laufen über
  `data-morph`. Kein Vorhang. (D-068, D-085, D-086, D-087, D-103)
- **Innerhalb einer Seite:** was animiert erscheint, verschwindet animiert
  (`leave()`/`enter()`); Ansichtswechsel (`swapView`) per Web Animations.
  (D-083, D-087)
- **„Bewegung reduzieren“** schaltet überall Animationen ab; die Bedienung
  wartet nie auf eine Animation. (D-078, D-083)

---

## Verlauf

Je Nummer eine Zeile; der volle Wortlaut steht im Archiv.

| Nr. | Datum | Worum es ging |
|---|---|---|
| D-001 | 2026-07-14 | Stack Node.js |
| D-002 | 2026-07-14 | PIN verpflichtend (abgelöst durch D-018) |
| D-003 | 2026-07-14 | Admin-Passwort über .env |
| D-004 | 2026-07-14 | Kein Minus-Knopf |
| D-005 | 2026-07-14 | drink_log, Party-Tag 06:00 |
| D-006 | 2026-07-14 | HMAC-Tokens statt Sessions |
| D-007 | 2026-07-14 | Kein Build-Step, kein CDN |
| D-008 | 2026-07-14 | Interims-Grafiken (abgelöst) |
| D-009 | 2026-07-15 | Finale Bild-Assets |
| D-010 | 2026-07-15 | settings-Tabelle, QR-Adresse |
| D-011 | 2026-07-15 | Glas-Optik (abgelöst durch D-078) |
| D-012 | 2026-07-15 | Drittes Getränk Mischen, Live-Fun-Facts |
| D-013 | 2026-07-15 | Reset-Passwort, Ausblenden, TV-Modus |
| D-014 | 2026-07-15 | Rekord-Facts, Lösch-Passwort, FLIP |
| D-015 | 2026-07-16 | Rotation, eigene Facts, Archiv, Abzeichen, PWA, Rate-Limit |
| D-016 | 2026-07-16 | Fun-Fact-Takt |
| D-017 | 2026-07-16 | Missbrauchsschutz |
| D-018 | 2026-07-16 | PIN optional |
| D-019 | 2026-07-17 | Zweiter Bereich Youngstars |
| D-020 | 2026-08-16 | Tiebreak nach Uhrzeit |
| D-021 | 2026-08-26 | TV-Bühne skaliert |
| D-022 | 2026-08-26 | Archiv-Korrektur, Archiv-Abend auf dem TV |
| D-023 | 2026-08-26 | Profil-Tab, Tagessieger, Statistik-Facts |
| D-024 | 2026-08-26 | Rekordkurs |
| D-025 | 2026-08-31 | CSV-Export |
| D-026 | 2026-08-31 | Fun-Fact-Band eine Zeile hoch |
| D-027 | 2026-08-31 | CSV nur für Admins |
| D-028 | 2026-09-01 | Abende benennen |
| D-029 | 2026-09-01 | Verlauf auf der Abend-Karte |
| D-030 | 2026-09-01 | Ganze Rangliste |
| D-031 | 2026-09-01 | Treue-Abzeichen |
| D-032 | 2026-09-01 | Verlauf als Kurve |
| D-033 | 2026-09-01 | Ein Knopf für die ganze Rangliste |
| D-034 | 2026-09-01 | Vollsicherung als JSON |
| D-035 | 2026-09-01 | Erklärtexte entfernt |
| D-036 | 2026-09-04 | Comeback und Meilensteine |
| D-037 | 2026-09-04 | Ausgeblendete nicht in der Anmeldeliste |
| D-038 | 2026-09-08 | Oberfläche aufgeräumt |
| D-039 | 2026-09-09 | Getränkefelder als Knöpfe |
| D-040 | 2026-09-09 | Profil: eine Rangliste, Kopf, Anteil am Haus |
| D-041 | 2026-09-09 | Letztes Konto oben |
| D-042 | 2026-09-09 | Archiv in Blöcken von zwölf |
| D-043 | 2026-09-09 | Server gibt Fun-Fact-Takt vor |
| D-044 | 2026-09-10 | Design-Feinschliff (vor dem Redesign) |
| D-045 | 2026-09-10 | Rekordkurs ab dem ersten Getränk |
| D-046 | 2026-09-10 | Stabilität WebSocket |
| D-047 | 2026-09-10 | Historien-Cache |
| D-048 | 2026-09-10 | Logo verkleinert, keine Cache-Header |
| D-049 | 2026-09-10 | Story-Bild |
| D-050 | 2026-09-10 | Keine Gendersprache |
| D-051 | 2026-09-21 | TV-Podest gefüllt, neues Logo |
| D-052 | 2026-09-21 | Onboarding |
| D-053 | 2026-09-24 | TV-Verlauf (abgelöst durch D-055/D-056) |
| D-054 | 2026-09-24 | Design-Analyse umgesetzt |
| D-055 | 2026-09-24 | TV-Verlauf über Deckkraft |
| D-056 | 2026-09-24 | TV nur ganze Zeilen |
| D-057 | 2026-09-24 | TV-Teilnehmerzahl (abgelöst durch D-059) |
| D-058 | 2026-09-24 | TV-Teilnehmerzahl (abgelöst durch D-059) |
| D-059 | 2026-09-24 | TV-Teilnehmerzahl links neben dem QR |
| D-060 | 2026-09-24 | Admin-Zeilen ohne Panel |
| D-061 | 2026-09-24 | Admin neu (E7) |
| D-062 | 2026-09-24 | Eigene Fun-Facts kompakt |
| D-063 | 2026-09-24 | Ausgeblendete dimmen nur den Inhalt |
| D-064 | 2026-09-24 | Kein „alphabetisch“ |
| D-065 | 2026-09-24 | Zurück-Link im Admin |
| D-066 | 2026-09-24 | Fester Index, Broadcasts gebündelt |
| D-067 | 2026-09-28 | Lorbeer im Profil |
| D-068 | 2026-09-28 | Übergang beim Anmelden |
| D-069 | 2026-09-28 | Tab-Wechsel gleitet |
| D-070 | 2026-09-28 | Ein Wort für den Sieg |
| D-071 | 2026-09-28 | Saison-Akzente |
| D-072 | 2026-09-29 | Vergleich zum eigenen Schnitt |
| D-073 | 2026-09-29 | Getränke-Protokoll |
| D-074 | 2026-09-29 | Protokoll-Pillen gefüllt |
| D-075 | 2026-09-29 | Schnitt-Vergleich abschaltbar |
| D-076 | 2026-09-29 | Archiv ohne eigene Korrektur |
| D-077 | 2026-09-29 | Abend-Name als Knopf |
| D-078 | 2026-09-29 | Redesign nach landonorris.com |
| D-079 | 2026-10-01 | Keine Erklärtexte |
| D-080 | 2026-10-14 | Ein Bereich in Youngstars-Farben (Bereiche seit D-110 wieder zwei) |
| D-081 | 2026-10-14 | Höhenlinien-Strömung |
| D-083 | 2026-10-14 | Übergänge beim Schließen |
| D-084 | 2026-10-14 | Seitenvorhang (abgelöst durch D-085/D-086) |
| D-085 | 2026-10-14 | Seitenwechsel als Morph |
| D-086 | 2026-10-14 | Vorhang entfernt |
| D-087 | 2026-10-14 | Morphs in Firefox |
| D-088 | 2026-10-14 | Unterschrift |
| D-089 | 2026-10-14 | Leuchten auf dem Handy |
| D-090 | 2026-10-14 | Dashboard-Fuß nur Abmelden |
| D-091 | 2026-10-14 | Handy-Durchgang |
| D-092 | 2026-10-14 | Archiv-Kopf am Handy, Menü ohne Konto wechseln |
| D-093 | 2026-10-14 | Abzeichen-Karten, Timing-Tower, Kaltstart |
| D-094 | 2026-10-15 | Archiv als 3D-Register |
| D-095 | 2026-10-15 | Echo-Zahl, Plakat, Jahresrückblick, Meilenstein |
| D-096 | 2026-10-15 | Echo als Nachhall |
| D-097 | 2026-10-15 | Name dockt an (abgelöst durch D-098) |
| D-098 | 2026-10-15 | Name fliegt in die Kopfleiste |
| D-099 | 2026-10-16 | Effekt-Demo |
| D-100 | 2026-10-16 | Effekte beenden |
| D-101 | 2026-10-16 | Code-Check |
| D-102 | 2026-10-16 | Ein Menü für alle Seiten |
| D-103 | 2026-10-16 | Mehr Übergänge |
| D-104 | 2026-10-16 | Keine Zähler-Korrekturen in der Kontenliste |
| D-105 | 2026-10-16 | Rückblick aus einem Guss |
| D-106 | 2026-10-16 | Geisterspur |
| D-107 | 2026-10-16 | TV ohne Abstand und Bestwert |
| D-108 | 2026-10-16 | Stempelkarte |
| D-109 | 2026-10-16 | Umzug vom alten Repo |
| D-110 | 2026-10-16 | Youngstars wieder da, Auswahlseite |
| D-111 | 2026-10-24 | Leuchten am PC wie am Handy |
| D-112 | 2026-10-24 | Hausmarke alle 50 |
| D-113 | 2026-10-24 | Feinschliff nach Gesamtdurchsicht |
| D-114 | 2026-10-24 | Danger Zone und Backup bleiben |
| D-115 | 2026-10-24 | Rekordkurs-Pille wieder kurz |
| D-116 | 2026-10-24 | Archive für DECISIONS und PROGRESS |
| D-117 | 2026-10-24 | DECISIONS nach Themen neu geschrieben |
| D-118 | 2026-10-27 | Weniger Kringel |
| D-119 | 2026-10-27 | SV-Logo auch auf dem Youngstars-TV |
| D-120 | 2026-10-29 | Tipps ohne WLAN puffern und nachreichen |
| D-121 | 2026-10-29 | Automatische Sicherung beim ersten Getränk, drei rollierend |
| D-122 | 2026-10-29 | TV lädt nach einem Update selbst neu |

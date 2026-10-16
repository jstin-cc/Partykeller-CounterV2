# DECISIONS.md — Architektur- & Stack-Entscheidungen

Jede Entscheidung mit Datum, Kontext und Begründung. Neueste unten anfügen.

## 2026-07-14 · D-001: Stack = Node.js (statt Rust)

**Entscheidung:** Node.js + Express (Statics + REST), `ws` (WebSockets),
`better-sqlite3` (Persistenz), `dotenv` (Config). Ein Prozess für alles.

**Begründung:** Vom Nutzer bestätigt. Für eine LAN-App mit einer Handvoll
gleichzeitiger Clients ist Node mehr als ausreichend; `better-sqlite3` ist
synchron und damit trivial korrekt bei konkurrierenden Mutationen (ein
Event-Loop, keine Race Conditions). Rust hätte geringeren RAM-Bedarf, aber
deutlich höheren Entwicklungs- und Wartungsaufwand ohne praktischen Nutzen
auf einem Pi mit dieser Last.

## 2026-07-14 · D-002: PIN ist verpflichtend

**Entscheidung:** Jeder Account braucht eine PIN (4-stellig). Anlegen nur mit
PIN, Login nur mit PIN. Admin kann PINs zurücksetzen (`setPin`).

**Begründung:** Vom Nutzer so entschieden — bewusste Abweichung von der
Empfehlung in Prompt.md („optional, standardmäßig aus"). Schützt Accounts
gegen Spaß-Einträge anderer Gäste. Konsequenz: Der Login-Screen braucht
immer ein PIN-Feld, und der Admin braucht eine PIN-Reset-Funktion für
vergessene PINs.

## 2026-07-14 · D-003: Admin-Passwort über .env

**Entscheidung:** `ADMIN_PASSWORD` kommt aus `.env` (dokumentiert in
`.env.example`). Ohne gesetzten Wert startet der Server nicht (kein
unsicherer Default im Repo).

**Begründung:** Vom Nutzer bestätigt. Kein Passwort im Code/Repo, auf dem Pi
ohne Code-Änderung anpassbar. Der Design-Prototyp (`store.js`) hatte
`keller2026` hartcodiert — das wird nicht übernommen.

## 2026-07-14 · D-004: Kein Minus-Button im Nutzer-Dashboard

**Entscheidung:** Nutzer können nur hinzufügen (`delta = +1`). Korrekturen
macht ausschließlich der Admin über sein Dashboard (direktes Bearbeiten der
Zähler laut Prompt.md).

**Begründung:** Vom Nutzer bestätigt. Prompt.md nennt zwar „Plus/Minus", das
verbindliche v3-Design hat aber bewusst nur Plus-Buttons — und das
log-basierte „Heute"-Feature bleibt so konsistent (ein Log-Eintrag pro
Getränk, kein Entfernen-Pfad nötig).

## 2026-07-14 · D-005: drink_log ergänzt das Datenmodell aus Prompt.md

**Entscheidung:** Zusätzlich zu den All-Time-Zählern `beers`/`shots` auf dem
Player gibt es eine `drink_log`-Tabelle (`player_id`, `drink`, `ts`).
„Heute" = Party-Tag von 06:00 bis 05:59 des Folgetags.

**Begründung:** Das verbindliche v3-Design zeigt „Getränke heute" und
Heute/Gesamt-Spalten pro Getränk — das Prompt-Modell (nur All-Time-Zähler)
kann das nicht liefern. Die Zähler bleiben als schnelle All-Time-Wahrheit
erhalten (kein Aggregieren über das Log für die Rangliste); das Log dient
nur für Tageswerte. Party-Tag-Grenze 06:00 stammt aus dem Design-Prototyp
(`store.js`, `partyDayKey`). Admin-Korrekturen ändern nur Zähler, der
Komplett-Reset leert beides.

## 2026-07-14 · D-006: Stateless HMAC-Tokens statt Session-Tabelle

**Entscheidung:** Login (Nutzer wie Admin) liefert ein HMAC-signiertes Token
(Secret `TOKEN_SECRET` aus `.env`, Payload: playerId bzw. Rolle). Clients
speichern es im `localStorage` und senden es mit jeder WS-Nachricht.
PINs werden mit scrypt (`node:crypto`) gehasht.

**Begründung:** Übersteht Server-Neustarts ohne Session-Tabelle und ohne
Re-Login aller Gäste (wichtig: „Neustart darf nichts verlieren"). Keine
zusätzliche Dependency. Für ein privates LAN angemessen dimensioniert.

## 2026-07-14 · D-007: Kein Build-Step, keine CDN-Ressourcen

**Entscheidung:** Frontend als statisches HTML/CSS/Vanilla-JS (ES-Module),
kein Bundler/Framework. Fonts (Bitter, Work Sans) und die QR-Code-Lib werden
lokal in `public/` vendored.

**Begründung:** Die App läuft im WLAN ohne Internet — Google-Fonts-Links aus
dem Design würden dort nicht laden. Ohne Build-Step bleibt das Deployment
auf dem Pi ein `git pull` + Neustart, und das Projekt bleibt in Jahren noch
wartbar.

## 2026-07-14 · D-008: Interims-SVGs für Logo und Wald-Footer

**Entscheidung:** `logo-gold.svg` und `footer-woods.svg` sind selbstgebaute
Interims-Assets im Design-Stil. Die Original-PNGs aus dem Design-Projekt
(`assets/logo-gold.png`, `assets/footer-woods.png`) überschreiten das
256-KiB-Limit des Design-API-Exports und müssen einmal manuell exportiert
und nach `public/assets/` gelegt werden (offener Punkt in PROGRESS.md M2).

**Begründung:** Der Screen soll nicht an zwei Bilddateien scheitern. Die
SVGs nutzen dieselben Farb-Tokens und Platzverhältnisse, sodass der spätere
Tausch nur die zwei `<img src>`-Verweise betrifft. `zapfen-raw.svg` (das
Wasserzeichen) konnte 1:1 übernommen werden.

## 2026-07-15 · D-009: Finale Bild-Assets eingesetzt, Interims ersetzt

**Entscheidung:** Die vom Nutzer hochgeladenen Original-Assets sind jetzt
eingebunden; die Interims aus D-008 wurden gelöscht:

- `logo.png` — das weiße Logo (`SVPartykellerLogo2.0`), da die gesamte UI
  dunkel ist. (Die mitgelieferten „SVG"-Logos waren nur PNG-Raster in einem
  SVG-Rahmen, boten also keinen Vektorvorteil → PNG genommen.)
- `footer-woods.png` — der echte Wald-Streifen; der Abdunkel-Filter wurde von
  `brightness(0.55)` auf `0.8` gelockert, damit das Grün sichtbar bleibt.
- `zapfen-bg.svg` — der Rothaus-Zapfen (vom Nutzer als `gemini-svg` mit
  Grünfüllung `#11682e` geliefert), **fest um 180° gedreht** (Zapfen hängen nach
  unten) und mit fester Pixelgröße versehen. Weil die Drehung nun in der Datei
  steckt, entfielen die kompensierenden `rotate(180deg)` in Login/TV/Admin.
  Das Wasserzeichen wird als **Hintergrundbild** mit niedriger Deckkraft
  (~0.14–0.22) eingesetzt, nicht mehr als CSS-Maske: die frühere Masken-Variante
  (`mask-image` + `--bg-hi`) blieb auf dem fast schwarzen Grün unsichtbar. So
  scheinen die grünen Zapfen dezent durch — die vom Nutzer gewünschte, „leicht
  andere Helligkeit" gegenüber dem Rest.
- `cones-flat.png` — als Favicon eingebunden.

**Rundung:** Neue Tokens `--radius` (12px) und `--radius-lg` (18px) ersetzen
die bisherigen 3–4px-Ecken (Karten, Buttons, Felder, Stepper, Podest, QR),
sodass die eckigen Elemente durchgängig leicht abgerundet sind.

**Begründung:** Vom Nutzer angefordert. Alles bleibt offline/vendored
(D-007); keine neuen Dependencies. D-008 ist damit erledigt.

## 2026-07-15 · D-010: settings-Tabelle + einstellbare QR-Adresse, TV-Feinschliff

**Entscheidung:**

- Neue Tabelle `settings (key TEXT PRIMARY KEY, value TEXT)` als schlichter
  Schlüssel-Wert-Speicher. Erster Eintrag: `join_url` — die Adresse, auf die der
  TV-QR-Code zeigt. Sie steckt jetzt im persistenten State (`getState().joinUrl`)
  und übersteht damit Neustarts (D-006).
- Neuer WS-Handler `setJoinUrl` (admin-only). Eingaben werden über
  `normalizeJoinUrl()` validiert: leer = Fallback auf die eigene Server-Adresse,
  sonst zu einer vollständigen `http(s)`-URL normalisiert (fehlt das Schema, wird
  `http://` ergänzt). Ungültiges wirft und wird nicht gespeichert.
- Der TV baut den QR aus `joinUrl` (Fallback `location.origin`), rendert ihn neu,
  sobald sich die Adresse ändert; der QR-Rahmen ist bewusst **nicht** abgerundet.
- Admin bekommt dafür ein Feld „QR-Adresse" über der Nutzerliste.

**TV-Layout (kein Architektur-, nur UI-Feinschliff, hier der Vollständigkeit
halber):** Podest deutlich kompakter (Höhen/Schriftgrößen reduziert); unter dem
Podest maximal 5 Plätze gleichzeitig, bei mehr rotiert das Fenster alle 4,5 s um
eine Position nach oben; zwischen Tabelle und Footer ein Fun-Facts-Band als
Platzhalter (später echte Statistiken wie Bier-Rekord/Shot-Meister).

**Begründung:** Der QR muss auf die tatsächliche LAN-Adresse des Pi zeigen
können, ohne Code-Änderung — daher einstellbar und persistent. Die Rotation hält
auch bei vielen Gästen die Liste lesbar, ohne dass das Podest Platz verschwendet.
Kein Build-Step, keine neuen Dependencies (D-007).

## 2026-07-15 · D-011: Dunkles „Liquid Glass" statt brauner Flächen (experimentell)

**Entscheidung (auf Nutzerwunsch zum Ausprobieren):** Die braunen Oberflächen
(Design-Tokens mit Hue 55) werden durch dunkles Glassmorphism ersetzt. Die
`--surface`-Tokens sind jetzt halbtransparent und leicht grünstichig
(Hue 160, Alpha 0.55–0.68 = „relativ dunkel, relativ undurchsichtig"). Eine
Utility-Klasse `.glass` (plus direkte Anwendung an `.card`, `.field`, Podest,
Nutzer-/Admin-Zeilen, Modals, Fun-Facts-Band) ergänzt `backdrop-filter: blur(16px)`
und eine feine helle Glaskante (`--glass-edge`). Farbige Aktions-Elemente
(Bier-/Shot-/Grün-Buttons, Podest-Badges) bleiben bewusst kräftig.

**Begründung:** Der Nutzer möchte die Optik testen; Braun gefiel noch nicht.
Reine CSS-Änderung, offline (D-007), keine neuen Dependencies. `backdrop-filter`
wird von Chromium (Pi-Kiosk) unterstützt; ohne Unterstützung bleibt die Fläche
einfach dunkel-transluzent. Kann bei Nichtgefallen leicht zurückgedreht werden.

## 2026-07-15 · D-012: Drittes Getränk „Mischen" + TV-Feinschliff, Live-Fun-Facts, grüner Glas-Rand

**Entscheidung (auf Nutzerwunsch):**

- **Drittes Getränk „Mischen"** (Code-Bezeichner `mix`, Spalte `players.mixes`,
  Log-Wert `'mix'`). Zieht sich durch alle Ebenen: DB, Validierung
  (`increment`/`setCounter` erlauben jetzt `beer|shot|mix`), Nutzer-Dashboard
  (eigene Mischen-Karte), Admin (eigene Mischen-Spalte mit Stepper) und TV
  (Podest-Detailzeile + Ranglisten-Spalte). `total = beers + shots + mixes`.
  Eigene Farbe `--mix` (violett/cocktailhaft), um es klar von Bier (amber) und
  Shots (brick) zu trennen.
- **DB-Migration statt Datenverlust (D-006):** Bestehende Datenbanken werden
  beim Start idempotent nachgezogen — `players.mixes` per `ALTER TABLE`, und
  `drink_log` wird einmalig neu aufgebaut, weil SQLite die alte CHECK-Constraint
  (`drink IN ('beer','shot')`) nicht per ALTER auf `'mix'` erweitern kann. Die
  vorhandenen Log-Einträge und Einstellungen (`join_url`) bleiben erhalten.
- **Fun-Facts jetzt live** statt Platzhalter: berechnet aus dem State die
  Tages-Bestleistungen (Bier-König / Shot-Meister / Misch-Meister des Abends je
  nach höchstem Heute-Wert) plus „Fleißigste:r heute" (meiste Getränke gesamt).
  Ohne Getränke heute erscheint ein Fallback-Text. Kein neuer Server-Endpunkt —
  „Heute"-Werte kommen ohnehin aggregiert aus `getState()`.
- **Rangliste ab Platz 4 scrollt jetzt endlich (nicht mehr endlos rotierend):**
  max. 5 sichtbar; bei mehr wandert das Fenster Zeile für Zeile nach unten und
  springt am Ende **schnell zurück nach oben**, dann von vorne. Umsetzung per
  `translateY` auf einem Track im Viewport (kein Framework, reines CSS/JS).
- **Podest-Überlappung behoben:** die Rang-Badges (1/2/3) ragten in den Namen;
  die Karten haben nun mehr Kopf-Abstand (padding-top), Zahl/Name überschneiden
  sich nicht mehr.
- **Tabellen als großes gerundetes Panel:** TV-Rangliste und Admin-Liste liegen
  in einem `--radius-lg`-Panel, die einzelnen Zeilen sind eigenständig
  abgerundet (`--radius`) mit Lücke — statt flacher Trennlinien.
- **Wasserzeichen zurück nach rechts:** der große Zapfen auf dem TV sitzt wieder
  rechts (vom Nutzer bevorzugt), nicht mehr mittig.
- **Test: dünner dunkelgrüner Glas-Rand.** `--glass-edge` ist von der hellen
  Kante (oklch 0.92/0.12) auf ein dezentes Dunkelgrün (oklch 0.52 0.11 150 / 0.60)
  umgestellt — passend zum Glassmorphism, wirkt auf alle `.glass`-Elemente.
  Reine Token-Änderung, leicht zurückdrehbar.

**Begründung:** Alles vom Nutzer angefordert. Keine neuen Dependencies, offline
(D-007), Persistenz gewahrt (D-006). Die Fun-Facts erfüllen den in D-010
angekündigten „echte Statistiken"-Platzhalter.

## 2026-07-15 · D-013: Reset-Passwort, Scoreboard-Sichtbarkeit, TV-Modus, Lebendigkeit

**Entscheidung (auf Nutzerwunsch):**

- **Komplett-Reset braucht das Admin-Passwort.** Das „Gedrückt halten"-Muster
  ist durch ein Modal ersetzt, in dem das Admin-Passwort (dieselbe `.env` wie der
  Login, D-003) erneut eingegeben werden muss. Der Server prüft es im `reset`-
  Handler gegen `config.adminPassword`; ohne korrektes Passwort passiert nichts.
- **Sichtbarkeit pro Nutzer im Scoreboard.** Neue Spalte `players.hidden`
  (Migration für bestehende DBs, D-006). Ein Haken je Zeile im Admin schaltet
  `setHidden` (admin-only). Der TV **filtert** verborgene Spieler komplett heraus
  und **rankt die sichtbaren neu** (Teilnehmerzahl, Summen und Fun-Facts zählen
  nur Sichtbare). Dashboard/Login bleiben unberührt – „hidden" betrifft nur den TV.
- **TV-Ansicht umschaltbar: All-Time ↔ Heute.** Neue Einstellung `board_mode`
  (`settings`-Tabelle, Default `alltime`), nur im Admin umschaltbar (kein
  Auto-Wechsel). Der TV rechnet die Spalten/Podest-Werte je Modus (All-Time =
  Gesamtzähler, Heute = Party-Tag-Werte) und sortiert/rankt entsprechend neu.
  Beim Wechsel fährt das ganze Board seitlich raus und wieder rein (CSS-Transition
  auf `#board`); Kopf, Fun-Fact und Wald-Footer bleiben stehen.
- **Grüner Glas-Rand zurückgenommen.** Der Test aus D-012 (dunkelgrüne
  `--glass-edge`) gefiel nicht → zurück auf die feine helle Glaskante
  (oklch 0.92 0.02 160 / 0.12).
- **Mehr Lebendigkeit (reines CSS/JS):** jeder Button sinkt beim Drücken leicht ein
  (`:active` scale), Zähler „ploppen" beim Hochzählen (`pk-pop`), Podest-Zahlen
  poppen bei Anstieg und leuchten kurz auf, wenn ein anderer Mensch den Platz
  übernimmt (`pk-flash`). `prefers-reduced-motion` schaltet die Keyframes ab.
- **Dashboard-Logo größer** (34 → 80 px).
- **Fun-Facts-Band schlanker, Wald-Footer höher** (70 → 96 px), damit die Bäume
  frei bleiben und nicht vom Band verdeckt wirken.

**Begründung:** Alles vom Nutzer angefordert. Keine neuen Dependencies, offline
(D-007), Persistenz und Migrationen gewahrt (D-006). Der Board-Modus ist bewusst
nur manuell (Admin) – ein Auto-Wechsel kann später ergänzt werden.

## 2026-07-15 · D-014: Tabellen-Animation, Rekord-Fun-Facts, getrenntes Lösch-Passwort, Admin-Sortierung, QR-Kasten

**Entscheidung (auf Nutzerwunsch):**

- **Animationen auch in der TV-Rangliste.** Das Rendern der Liste ab Platz 4 ist
  jetzt diff-basiert: bei gleicher Reihenfolge werden die Werte in den vorhandenen
  Zeilen aktualisiert (Scrollposition bleibt erhalten), gestiegene Zähler „poppen"
  und die Zeile leuchtet kurz gold auf. Ändert sich die Reihenfolge, wird neu
  aufgebaut und die Zeilen gleiten per **FLIP** von ihrer alten an die neue
  Position (neue Zeilen blenden ein). `prefers-reduced-motion` schaltet das ab.
- **Fun-Facts mit All-Time-Tagesrekorden**, schön ausformuliert, z. B. „Bier-Rekord:
  Die meisten Biere an einem Abend hat Jonas am 25.09.2025 geschafft – ganze 13
  Stück." Serverseitig neu: `getRecords()` bildet je Sorte den (Spieler, Party-Tag)
  mit den meisten Getränken aus `drink_log` (Party-Tag-Grenze 06:00 in SQL über
  `date((ts/1000)-21600,'unixepoch','localtime')`). Ausgeblendete Spieler zählen
  nicht. Die Rekorde stehen im State (`records`) und rotieren mit den bisherigen
  Tages-Bestleistungen im Fun-Fact-Band.
- **Eigenes Lösch-Passwort** (`RESET_PASSWORD`), getrennt vom Admin-Login. Der
  `reset`-Handler prüft gegen `config.resetPassword`. Ist `RESET_PASSWORD` nicht
  gesetzt, gilt weiter `ADMIN_PASSWORD` (Backward-Compat). In `.env.example`
  dokumentiert; das Reset-Modal fragt jetzt das „Lösch-Passwort" ab.
- **Admin-Liste alphabetisch nach Name** sortiert (nicht mehr nach Punktestand),
  damit Nutzer beim Verwalten leichter zu finden sind. Betrifft nur die Admin-
  Ansicht; TV/Rangliste bleiben nach Punkten sortiert.
- **Glassmorphism-Kasten um QR-Code** und „Scan zum Beitreten" auf dem TV (Test).

**Begründung:** Alles vom Nutzer angefordert. Keine neuen Dependencies, offline
(D-007), Persistenz gewahrt (D-006). `getRecords()` läuft pro State-Broadcast über
das Log – bei Party-Größe vernachlässigbar; bei Bedarf später cachebar.

## 2026-07-16 · D-015: TV-Rotation einstellbar, eigene Fun-Facts, Heute-Filter, Abend-Archiv, persönliche Statistik + Achievements, PWA, Login-Rate-Limit

**Entscheidung (auf Nutzerwunsch):**

- **Rotationsgeschwindigkeit der TV-Rangliste im Admin einstellbar.** Neuer
  Settings-Key `scroll_seconds` (Verweildauer pro Scroll-Schritt, Default 3,2 s),
  WS-Handler `setScrollSpeed` (Admin, 1–30 s), Regler in der TV-Anzeige-Leiste
  des Admin-Dashboards. Der TV übernimmt Änderungen live (laufender Takt wird
  neu gestartet). Zeilenhöhe richtet sich jetzt immer am 5er-Raster aus, damit
  wenige Zeilen (Heute-Ansicht) nicht gestreckt werden.
- **Eigene Fun-Facts/Meldungen** (Titel + Text) in neuer Tabelle `facts`
  (`CREATE TABLE IF NOT EXISTS` → migrationssicher). WS-Handler `addFact` /
  `deleteFact` (Admin; Titel 1–30, Text 1–160 Zeichen, max. 50 Meldungen),
  Pflege im Admin-Dashboard. Das TV-Band zeigt jetzt je Eintrag Titel + Text;
  eigene Meldungen rotieren mit den berechneten Facts.
- **„Heute"-Ansicht zeigt nur, wer heute geloggt hat.** Der Sichtbarkeits-Haken
  im Admin gilt nur noch für die Gesamtansicht (All-Time); die Tagesliste
  filtert automatisch auf Spieler mit mindestens einem Getränk am laufenden
  Party-Tag (Kopfzeile: „N heute dabei").
- **Abend-Archiv unter `/abende`** (`public/abende.html`, `GET /api/archive`,
  serverseitig `getArchive()`): jeder Party-Tag als Karte mit Wochentag/Datum,
  Sieger (👑 + Getränkezahl), Teilnehmerzahl und Gesamtmengen je Sorte.
  Verlinkt von Login- und Dashboard-Fußzeile.
- **Persönliche Statistik im Nutzer-Dashboard** (`GET /api/players/:id/stats`,
  serverseitig `getPlayerStats()`): Anzahl eigener Abende, bestes Ergebnis
  (mit Datum), Verteilungsbalken Bier/Shots/Mischen (aus den All-Time-Zählern).
  Wird bei jedem neuen Log-Ereignis nachgeladen (State-Broadcast als Trigger).
- **Achievements als Badges** (auf den laufenden Party-Tag bezogen, im selben
  Endpoint): 🥇 Erster Trinker (erstes Log des Abends), 🌙 Mitternachtsbier
  (Bier zwischen 00:00 und 00:59), ⚡ Drei in einer Stunde (drei Logs binnen
  60 min), 🍹 Mischmeister (≥ 3 Mischen heute). Verdiente Badges leuchten gold,
  offene sind gedimmt.
- **PWA:** `manifest.webmanifest` (Name, Standalone, `#010f05` als Theme-Farbe
  = exakter sRGB-Wert von `--bg`), Icons 192/512 px aus dem Logo gerendert
  (`assets/icon-192/512.png`, maskable-tauglich), `theme-color`/
  `apple-touch-icon` auf allen Seiten. Dazu ein **bewusst cache-freier**
  Mini-Service-Worker (`sw.js`, fetch-Handler ohne `respondWith`): macht die
  App auch auf älteren Android-Chromes installierbar, liefert aber nie
  veraltete Dateien aus (wichtig für Updates auf dem Pi, D-006).
- **Rate-Limit auf Logins** (`server/ratelimit.js`, ohne neue Dependency):
  pro IP werden Fehlversuche gezählt; nach 5 Fehlversuchen binnen 1 min sind
  `POST /api/login` und `POST /api/admin/login` für 5 min gesperrt (HTTP 429
  mit Restzeit). Erfolgreicher Login setzt zurück. In-Memory reicht (ein
  Prozess, LAN); ein Neustart hebt Sperren auf.

**Begründung:** Alles vom Nutzer angefordert. Keine neuen npm-Dependencies,
offline-fähig (D-007: Icons/Manifest liegen in `public/`), Persistenz gewahrt
(D-006: nur additive Schema-Änderung per `CREATE TABLE IF NOT EXISTS`).
Rate-Limit schützt die 4-stelligen PINs (10 000 Kombinationen) gegen
Durchprobieren, ohne legitime Gäste zu stören.

## 2026-07-16 · D-016: Fun-Fact-Wechseltakt im Admin einstellbar

**Entscheidung (auf Nutzerwunsch):** Der Wechseltakt des Fun-Fact-Bands am TV
ist jetzt im Admin-Dashboard einstellbar – kürzeste Stufe **30 Sekunden**,
längste **5 Minuten (300 s)**. Neuer Settings-Key `funfact_seconds` (Default
30 s), WS-Handler `setFunfactSpeed` (Admin, 30–300 s, serverseitig geprüft),
zweiter Regler in der TV-Anzeige-Leiste neben dem Ranglisten-Tempo. Der TV
liest `funfactSeconds` aus dem State und startet den Rotations-Timer bei
Änderung neu (übernimmt also live). Das bisherige feste 7-Sekunden-Intervall
entfällt.

**Begründung:** Vom Nutzer angefordert; analog zu D-015 (`scroll_seconds`)
umgesetzt. Keine neuen Dependencies, offline-fähig, Persistenz gewahrt (Setting
überlebt den Neustart). 30 s als Untergrenze verhindert hektisches Flackern,
5 min als Obergrenze lässt eine Meldung lange stehen.

## 2026-07-16 · D-017: Missbrauchsschutz – Kontoerstellung-Limit und Increment-Throttle

**Entscheidung (nach Security-Review):** Zwei Missbrauchspunkte der offenen
Party-App gehärtet, ohne echte Gäste zu stören:

- **Kontoerstellung gedrosselt und gedeckelt.** `POST /api/players` ist bewusst
  ohne Login (Gäste melden sich selbst an, D-002), war aber unbegrenzt. Jetzt:
  max. 6 neue Konten pro Minute und IP (`createRateLimiter` in
  `server/ratelimit.js`, zählt jeden Versuch im gleitenden Fenster → HTTP 429)
  plus harter Gesamt-Deckel `MAX_PLAYERS = 200`. Verhindert Massen-Anlage/
  DB-Spam durch ein Skript.
- **Spieler-Increments gedrosselt.** Ein Spieler durfte sein „+1" beliebig
  schnell senden (Zähler-/Log-Flut, Broadcast-Sturm zu allen TVs). Jetzt
  Token-Bucket **pro Spieler** (`auth.sub`, nicht pro Verbindung – Neu-Verbinden
  hebelt den Schutz nicht aus): im Schnitt ~1 Getränk/Sekunde, kurzer Burst bis
  5. Admins bleiben ungedrosselt (Korrekturen, D-004).

**Bewusst NICHT geändert (Design-Kompromisse der LAN-App):** 4-stellige PINs
und die öffentliche `/api/state` (fürs Scoreboard) bleiben – das Rate-Limit auf
den Logins (D-015, 5 Fehlversuche/min → 60 s Sperre) bremst PIN-Raten
ausreichend; Klartext-HTTP im WLAN bleibt (kein TLS auf dem Kiosk-Pi).

**Begründung:** Beides vom Nutzer nach dem Review gewünscht. Keine neuen
Dependencies, In-Memory (ein Prozess, LAN), Persistenz unberührt. Verifiziert:
7. Konto in einer Minute → 429; 20 schnelle Spieler-Increments → nur 5 durch,
Rest gedrosselt; Neu-Verbinden setzt den Bucket nicht zurück; Admin
ungedrosselt; Bucket füllt sich über die Zeit nach.

## 2026-07-16 · D-018: PIN wieder optional pro Nutzer (ersetzt D-002)

**Entscheidung (auf Nutzerwunsch):** Die 4-stellige Nutzer-PIN ist wieder
**optional** – pro Konto. Das kehrt die frühere Verpflichtung aus **D-002**
bewusst um und entspricht wieder dem ursprünglichen Design-Prototyp
(„PIN (optional)"). D-002 bleibt als historischer Eintrag stehen und gilt ab
hier als überholt.

**Umsetzung:**
- Beim Anlegen (Login-Seite und Admin) ist das PIN-Feld optional. Leer =
  Konto ohne PIN. In der DB wird dafür `pin_hash = ''` gespeichert (leerer
  String als „keine PIN"); **keine Schema-Migration nötig**, die Spalte bleibt
  `NOT NULL`. Bestehende Konten mit PIN sind unberührt.
- Login: Konten **ohne** PIN werden durch Antippen des Namens **direkt**
  angemeldet (kein Eingabefeld). Konten **mit** PIN verlangen sie wie bisher;
  falsche/fehlende PIN → 401. Das Login-Rate-Limit (D-015) bleibt aktiv.
- Der State liefert pro Spieler `hasPin` (nur der Boolean, **nie** der Hash),
  damit die Login-Seite direkt-anmelden vs. abfragen unterscheiden kann und der
  Admin PIN-lose Konten markiert („ohne PIN").
- Admin kann per PIN-Modal eine PIN setzen **oder entfernen** (leeres Feld).

**Sicherheits-Hinweis (bewusst akzeptiert):** Ein Konto **ohne** PIN ist nicht
geschützt – wer den Namen antippt, ist als diese Person angemeldet und kann
deren Zähler erhöhen / das Dashboard sehen. Für eine lockere Partyrunde
gewollt; wer Schutz will, vergibt eine PIN. Admin-Login, Lösch-Passwort und
alle Server-seitigen Rollenprüfungen (D-004) sind davon **nicht** betroffen.

**Begründung:** Vom Nutzer gewünscht, entspricht dem Original-Design. Keine
neuen Dependencies, keine Migration, Persistenz gewahrt (D-006). Verifiziert:
Anlegen/Login ohne PIN klappt, PIN-Konten und Bestandsnutzer bleiben geschützt,
Admin kann PIN setzen/entfernen, kein Konsolenfehler.

## D-019 (2026-07-17): Zweiter Bereich „Partykeller Youngstars" — getrennte Daten, eigenes Theme

**Entscheidung:** Die App bekommt einen zweiten, eigenständigen Bereich für die
Partykeller **Youngstars** — gleiche Funktionen, aber komplett getrennte Daten,
eigener Admin-Zugang und eigenes Farbkonzept. Ein Node.js-Prozess bedient beide.

**Umsetzung:**
- **URL-Bereiche:** `/partykeller/*` und `/youngstars/*`; `/` ist eine
  vorgeschaltete **Auswahlseite** mit beiden Logos (`start.html`). Alt-Pfade
  (`/tv`, `/dashboard`, `/admin`, `/abende`) leiten auf den Partykeller um,
  `/api/*` und `/ws` bleiben als Partykeller-Alias — nichts Bestehendes bricht.
- **Datentrennung:** `server/db.js` ist jetzt eine Factory (`createDb`); je
  Bereich eine eigene SQLite-Datei (`data/partykeller.db`, `data/youngstars.db`)
  mit identischem Schema. Nutzer, Logs, Settings, Fun-Facts und Archiv können
  sich nie vermischen.
- **Auth:** Tokens tragen einen **Bereichs-Stempel** (`area`); ein
  Partykeller-Token gilt nicht im Youngstars-Bereich und umgekehrt (auch für
  Admins). Alt-Tokens ohne Stempel gelten als Partykeller (niemand fliegt beim
  Update raus). Youngstars-Admin: **`YOUNGSTARS_ADMIN_PASSWORD`** (Pflicht in
  der .env). Das **Lösch-Passwort bleibt gemeinsam** (`RESET_PASSWORD`), der
  Reset löscht aber immer nur den Bereich, in dem er ausgelöst wurde.
- **Frontend:** Dieselben HTML-Dateien bedienen beide Bereiche.
  `public/js/area.js` erkennt den Bereich am URL-Präfix und steuert API-/WS-
  Präfix, getrennte Storage-Keys (`pk_*`/`ys_*`) und das Theme über
  `html[data-area]`. WS-Endpunkte: `/partykeller/ws`, `/youngstars/ws`.
- **Getränke:** unverändert Bier/Shots/Mischen — aber im Youngstars-Dashboard
  steht **Bier ganz unten** (Reihenfolge Shots, Mischen, Bier). Kein Aperol
  (zunächst angedacht, vom Nutzer wieder verworfen).
- **Theme Youngstars:** dunkles **Navyblau** statt Dunkelgrün, Akzente in
  **Orange** (am Neon-Logo orientiert), Shots in einem **Pinkton** aus den
  Glut-Tönen des Logos; Zapfen-Hintergrund als hellere Navy-Variante
  (`zapfen-bg-navy.svg`); **kein Baum-Footer**. Neben dem Partykeller-Logo
  steht das Youngstars-Neon-PNG (`assets/youngstars-logo.png`; aktuell eine
  programmatisch freigestellte Übergangsversion, wird durch die Original-Datei
  des Nutzers ersetzt).
- **PWA:** eigenes Manifest (`manifest-youngstars.webmanifest`, start_url
  `/youngstars/`) mit eigenen Orange-Icons; das Partykeller-Manifest zeigt
  jetzt auf `/partykeller/` — beide Apps können nebeneinander installiert sein.

**Begründung:** Youngstars brauchen eine eigene Rangliste ohne Datenvermischung
mit dem Partykeller. Ein Prozess + zwei DB-Dateien hält den Pi-Betrieb simpel
(keine zweite Instanz, kein zweiter Port) und erfüllt die harte
Ein-Prozess-Regel; gemeinsame HTML/JS-Dateien vermeiden doppelte Pflege.

## D-020 (2026-08-16): Tiebreak bei Punktegleichstand = Uhrzeit statt Name

**Entscheidung:** Stehen zwei Spieler:innen beim Gesamtwert (Bier+Shots+Mischen)
gleichauf, entscheidet künftig, wer **zuerst** auf diesen Stand kam (Zeitpunkt
des jeweils letzten geloggten Getränks, aufsteigend). Alphabetisch nach Name
ist nur noch der letzte Fallback, falls auch dazu kein Log-Eintrag existiert
(z. B. reine Admin-Korrektur ohne organischen Trink-Eintrag). Betrifft die
Rangliste server-seitig (`getState()` in `server/db.js`, u. a. für die
Rang-Anzeige im Nutzer-Dashboard) sowie das TV-Board (`public/tv.html`, beide
Modi All-Time/Heute). Dafür neue Abfragen `lastLogTs`/`lastLogTsToday`
(`MAX(ts)` je Spieler:in aus `drink_log`), keine Schemaänderung.

**Begründung:** Vom Nutzer gewünscht. Passt zum Charakter eines
Trinkspiel-Wettbewerbs ("wer war zuerst dran"); Namensalphabet als Tiebreak
wirkte willkürlich. Keine neuen Dependencies, `drink_log` trug die nötigen
Zeitstempel bereits.

## D-021 (2026-08-26): TV-Board auf feste Design-Bühne skaliert, Rotation an feste Zeilenhöhe gekoppelt

**Entscheidung:** Das TV-Scoreboard wird auf eine feste **Design-Bühne**
(1080 Design-Pixel Höhe, Breite fluid ab 1440) gelayoutet und als Ganzes per
`transform: scale()` auf die echte Fenstergröße skaliert (`.stage` +
`fitStage()` in `public/tv.html`). Die Ranglisten-Zeilen haben eine **feste
Zeilenhöhe** (64 px im Design-Raster); wie viele Zeilen sichtbar sind, ergibt
sich aus dem Platz — die Rotation (`syncScroll()`) berechnet Sichtfenster und
Endposition bei jeder Größenänderung neu und blendet die angeschnittene Zeile
unten weich aus (mask-image).

**Begründung:** Im Praxistest (Laptop, Win11/Chrome, kleinere effektive
Auflösung durch 125-%-Skalierung) zerquetschten die bisher festen Pixelmaße
von Kopfzeile/Podest die Tabelle: Zeilenhöhe wurde aus dem Restplatz durch 5
geteilt, Zeilen überlappten, die Rotation lief gegen falsche Grenzen. Mit der
skalierten Bühne sieht das Board auf **jeder Auflösung exakt gleich** aus
(Wunsch-Referenz „Beispiel-gut"), die Tabelle bekommt allen Restplatz, und die
Rotation hängt nicht mehr von gemessenen Pixelhöhen ab (auch der späte
Font-Swap kann nichts mehr verschieben).

## D-022 (2026-08-26): Abend-Archiv nachträglich korrigierbar + Archiv-Abend auf dem TV

**Entscheidung:** Admins können vergangene Party-Tage korrigieren und wieder
anzeigen:
- **Korrektur** (`adjustArchive` über WS, `db.adjustArchiveDrink`): ±1 Getränk
  je Spieler/Sorte/Party-Tag. Wirkt in einer Transaktion auf **drink_log UND
  den All-Time-Zähler** — beim Entfernen fliegt der jüngste Log-Eintrag der
  Sorte in dem Party-Tag raus, beim Ergänzen wird ein Eintrag hinter das letzte
  Getränk des Spielers an dem Abend gelegt (sonst 20:00). Damit bleiben
  Rangliste, Rekorde, Abzeichen und Archiv konsistent. UI: „Bearbeiten"-Modal
  auf `/abende` (alle Spieler, auch mit 0 — Nachtragen möglich), sichtbar nur
  mit Admin-Login derselben Browser-Session.
- **Archiv-Replay:** `setBoardMode` kennt neben `alltime`/`today` jetzt
  `archive` + `board_day`; der State liefert dann die fertig sortierten Werte
  des Tages (`archivePlayers`), das TV zeigt „Abend vom …". Umschaltbar im
  Admin (Auswahlliste) und direkt auf den Archiv-Karten („Auf dem TV zeigen").
- Neuer REST-Endpunkt `GET /api/archive/:day` (Tagesdetail); der
  Archiv-Sieger nutzt jetzt ebenfalls den D-020-Tiebreak (Uhrzeit statt
  Map-Reihenfolge).

**Begründung:** In der Testwoche wurden Getränke vergessen oder falsch
gezählt; Korrekturen sollen gezielt am betroffenen Abend passieren statt nur
am All-Time-Zähler (der Log ist die Quelle für Archiv/Rekorde/Abzeichen).
Vergangene Abende nochmal zeigen zu können war ausdrücklicher Wunsch.

## D-023 (2026-08-26): Profil-Tab im Dashboard, Abzeichen-Zähler, Tagessieger-Abzeichen, Statistik-Fun-Facts

**Entscheidung:**
- Das Nutzer-Dashboard bekommt einen Umschalter **„Zählen" / „Profil"**: Zählen
  enthält nur noch die Eingabe (Heute-Karte + drei Getränke-Karten), das Profil
  bündelt Statistik: Stand heute (Platz, wer direkt **vor/hinter** einem liegt,
  inkl. Abstand; „gleichauf" bei Gleichstand), All-Time-Stand mit Umfeld,
  persönliche Statistik (Abende, bestes Ergebnis, **Ø pro Abend**, Verteilung)
  und die Abzeichen.
- **Abzeichen** werden jetzt **pro Party-Tag über alle Abende gezählt**
  (`getPlayerStats` liefert `{count, today}` je Abzeichen) statt nur „heute
  geschafft ja/nein". Neues Abzeichen **👑 Tagessieger** (Gesamt-Tagessieger
  des Abends, heute = führt aktuell; Tiebreak D-020 über `getDayWinners`).
- Das Fun-Fact-Band speist sich zusätzlich aus neuen Server-Kennzahlen
  (`funStats` im State): Rekord-Abend (alle zusammen), Stammgast (meiste
  Abende), Seriensieger (meiste Tagessiege), Frühstart (erstes Getränk heute),
  durstigste Stunde heute, Gesamtbilanz über alle Abende.
- Eigene Fun-Facts sind **bearbeitbar** (`updateFact` über WS, Inline-Formular
  im Admin).

**Begründung:** Wunsch aus der Testwoche: Statistik raus aus dem Eingabefluss
auf eine eigene Profil-Seite, mehr Kontext („wer ist vor/hinter mir"),
sichtbare Abzeichen-Historie, ein Abzeichen für den Tagessieg und mehr
abwechslungsreiche Fun-Facts aus echten Daten. Alles aus `drink_log`
berechenbar — keine Schemaänderung, keine neuen Dependencies.

## D-024 (2026-08-26): Rekordkurs (Bier-Pace) live auf dem TV

**Entscheidung:** Der State enthält `funStats.pace`: Getränke des laufenden
Abends (sichtbare Spieler) im Vergleich zum besten **bisherigen** Abend zum
**gleichen Zeitpunkt** (gleiche Zeitspanne seit dem 06:00-Start, gezählt über
`drink_log`). Liegt der Abend vorn (`onPace`, ab 3 Getränken), zeigt das TV
eine glühende Pill im Kopfbereich („🔥 Auf Rekordkurs! 34 : 28 vs. 22.08.2026")
plus einen Fun-Fact; im Archiv-Modus ist sie ausgeblendet. Da der Vergleich
zwischen zwei Getränken altert (der Rekord-Abend „zieht weiter"), holt sich
das TV den Pace-Stand zusätzlich alle 5 Minuten per REST — der übrige State
läuft unverändert über die WS-Broadcasts.

**Begründung:** Nutzerwunsch (aus den Vorschlägen bestätigt): Live-Spannung
auf dem Board, ob der Abend den Rekord knackt. Der laufende Abend wird bewusst
gegen den besten *vergangenen* Abend verglichen (sonst wäre der Rekord-Abend
irgendwann er selbst und die Anzeige sinnlos). Keine Schemaänderung, eine
zusätzliche COUNT-Abfrage.

## D-025 (2026-08-31): CSV-Übergabedateien im Abend-Archiv

**Entscheidung:** `/abende` bietet Downloads im **Langformat** an — je eine
Zeile pro Party-Tag und Person mit den Spalten
`Tag;Datum;Wochentag;Name;Bier;Shots;Mischen;Gesamt`. Zwei Leseendpunkte je
Bereich: `GET <base>/api/export/archive` (alle Abende, Datei
`<bereich>-abende-gesamt.csv`) und `GET <base>/api/export/archive/:day` (ein
Abend, `<bereich>-abend-<tag>.csv`). Der Server erzeugt die Datei und liefert
sie per `Content-Disposition: attachment`.

Formatentscheidungen (`server/csv.js`): **Semikolon** als Trennzeichen,
**CRLF** und ein **UTF-8-BOM**, damit ein deutsches Excel die Datei per
Doppelklick korrekt und mit intakten Umlauten öffnet. `Tag` ist zusätzlich in
ISO-Form (`2026-08-22`) dabei, damit die Datei auch maschinell sortierbar ist.
**Keine Summenzeile** — die Datei bleibt eine saubere Tabelle und ist direkt
als Pivot auswertbar. Zellen, die mit `= + - @` beginnen, werden mit einem
vorangestellten `'` entschärft (Namen kommen von Gästen, Excel würde sie sonst
als Formel ausführen). Personen ohne Getränke an dem Abend fallen raus,
ausgeblendete Personen sind dabei — wie in den Tagessummen des Archivs.

Die Endpunkte sind **ohne Login** erreichbar, genau wie `/archive` und
`/archive/:day`, aus denen sie sich speisen. Der CSV-Knopf je Abend und
„Alle Abende als CSV" sind deshalb für alle sichtbar; Bearbeiten und „Auf dem
TV zeigen" bleiben Admin-only.

**Begründung:** Nutzerwunsch: eine Übergabedatei, die sich auswerten lässt —
pro Abend oder gesamt. CSV im Langformat ist das, was Excel/LibreOffice ohne
Zwischenschritt einlesen und pivotieren; serverseitig erzeugt spart es
Blob-Bastelei im Frontend und liefert einen echten Dateinamen. Keine neuen
Dependencies, keine Schemaänderung.

## D-026 (2026-08-31): Fun-Fact-Band auf dem TV ist eine Zeile hoch

**Entscheidung:** Das Fun-Fact-Band auf dem TV ist **exakt so hoch wie eine
Ranglistenzeile** (64 Design-Pixel, `ROW_H`) und der Fact-Text steht in
**Namensgröße** (28 px, wie `.col-name`); die Überschrift „Fun Fact" bei
18 px. Das Band bleibt einzeilig: Passt ein Fact nicht in die Breite, skaliert
`fitFactText()` die Schrift proportional herunter (Untergrenze 15 px, darunter
schneidet `text-overflow: ellipsis` ab). Neu gemessen wird bei jedem
Fact-Wechsel, bei `resize` und wenn der Webfont fertig geladen ist.

**Begründung:** Das Band war mit 14 px Text vom Sofa aus praktisch nicht mehr
lesbar (Gegenentscheidung zur Verkleinerung aus #16, die Platz für die
Rangliste schaffen sollte). Eine Ranglistenzeile als Maß hält es optisch im
Raster des Boards und kostet nur ~30 Design-Pixel, also weniger als eine
Tabellenzeile — bei 1080p bleiben 11 sichtbare Ränge. Das Herunterskalieren
statt Umbrechen hält die Bühnenhöhe stabil, sodass die Rangliste nicht bei
jedem Fact-Wechsel springt.

## D-027 (2026-08-31): CSV-Export nur für Admins

**Entscheidung:** Die Übergabedateien aus dem Abend-Archiv sind nur noch mit
Admin-Login erreichbar — genau wie „Bearbeiten" und „Auf dem TV zeigen". Das
gilt auf beiden Ebenen: die Knöpfe „⬇ CSV" und „⬇ Alle Abende als CSV"
erscheinen nur mit Admin-Token in der Browser-Session, und
`GET <base>/api/export/archive[/:day]` antwortet ohne gültiges Admin-Token
dieses Bereichs mit **403**. Ein Spieler-Token oder ein Admin-Token des anderen
Bereichs reicht nicht (D-019).

Weil ein einfacher `<a href download>` keinen Authorization-Header mitschicken
kann, holt die Archiv-Seite die Datei jetzt per `fetch` mit
`Authorization: Bearer <token>` und speichert den Blob über einen erzeugten
Klick-Link. Das Token bleibt damit aus URL, Browser-Verlauf und Server-Logs
heraus — anders als bei einem Query-Parameter. Fehlschläge (abgelaufenes
Token, Netzwerk) zeigt ein kleiner Toast, der auch ohne offenes
Bearbeiten-Modal sichtbar ist. Ersetzt die Freigabe aus D-025.

**Begründung:** Nutzerwunsch. Die Kartenansicht des Archivs (Sieger,
Teilnehmerzahl, Tagessummen) bleibt für alle offen, aber die namentliche
Aufschlüsselung „wer hat an welchem Abend wie viel getrunken" als Datei zum
Mitnehmen ist etwas anderes als eine Zahl auf dem Bildschirm — das gehört
hinter denselben Zugang wie die Archiv-Korrektur.

## D-028 (2026-09-01): Abende im Archiv benennen

**Entscheidung:** Jeder Party-Tag kann einen freien Namen bekommen („Saison-
abschluss", „Bierpong-Turnier"). Das Feld steht **im Bearbeiten-Dialog** der
Abend-Karte — also hinter demselben Admin-Zugang wie die Korrekturen und der
CSV-Export (D-027) und für Gäste gar nicht sichtbar. Gespeichert wird als
Zeile in der bestehenden `settings`-Tabelle unter dem Schlüssel
`night_name:<YYYY-MM-DD>`; ein leeres Feld löscht die Zeile wieder. Der Name
erscheint auf der Abend-Karte unter dem Datum und im TV-Titel, wenn der Abend
über „Auf dem TV zeigen" läuft (`Saisonabschluss · 31.08.2026`). Der Server
prüft Tag und Länge (max. 40 Zeichen) wie jede andere Mutation.

**Begründung:** Nutzerwunsch. `settings` statt einer eigenen Tabelle, weil ein
Name genau ein Schlüssel-Wert-Paar ist: keine Migration, keine Fremdschlüssel,
und die Persistenz über Neustarts (D-006) gilt automatisch. Ein Abend ohne
Namen kostet dadurch auch keine Zeile. Die 40 Zeichen sind die Grenze, ab der
der TV-Titel in der Kopfzeile zu breit würde — dort steht er einzeilig mit
Ellipsis, damit die Bühnenhöhe des Boards unverändert bleibt (D-021).

## D-029 (2026-09-01): Verlaufsgraph auf jeder Abend-Karte

**Entscheidung:** Jede Karte im Abend-Archiv zeigt den Verlauf des Abends als
Balken je Stunde — **alle Personen zusammen**, nicht pro Sorte und nicht pro
Person. Der Server liefert ihn im Archiv-Endpunkt gleich mit
(`timeline: { startHour, counts }`), gezählt über `drink_log` gruppiert nach
Party-Tag und Uhr-Stunde. Leere Stunden am Anfang und Ende fallen weg, in der
Mitte bleiben sie als Lücke stehen. Die Spitzenstunde ist golden hervorgehoben
und steht als Text über dem Graphen („Spitze 23 Uhr: 11").

**Begründung:** Nutzerwunsch. Die Werte kommen mit der Liste mit, statt je
Karte einen eigenen Request auszulösen — bei 30 Abenden wären das sonst 30
Anfragen für eine Kleinigkeit. Gezeichnet wird als Inline-SVG mit
`preserveAspectRatio="none"`: kein Chart-Paket (Regel „keine neuen
Dependencies", D-001) und keine Breitenmessung im JS, die Karte skaliert den
Graphen selbst. Stunden statt feinerer Schritte, weil ein Abend so auf 6–10
Balken kommt — auf 280 px Kartenbreite ist das die Auflösung, die man noch
lesen kann.

## D-030 (2026-09-01): Ganze Rangliste im Profil

**Entscheidung:** Die Profil-Karten „Heute Abend" und „All-Time" bekommen je
einen Knopf „Ganze Rangliste ansehen ›". Er öffnet **ein** Blatt, das von
unten hereinfährt, oben zwischen Heute und All-Time umschaltet und die
komplette Liste zeigt: Platz, Name, Gesamt. Die eigene Zeile ist grün
umrandet, mit „(du)" beschriftet und wird beim Öffnen in die Mitte gescrollt.
Die Liste stammt aus demselben State-Broadcast wie die Karten darüber und
läuft live weiter, solange das Blatt offen ist. Schließen per Knopf, Klick auf
den Hintergrund oder Escape.

**Begründung:** Nutzerwunsch — bisher zeigte das Profil nur den eigenen Platz
und die direkten Nachbarn, „wo stehen eigentlich alle?" ging nur über den TV.
Ein Blatt statt einer eigenen Seite, weil der Weg zurück sonst über den
Browser-Zurück-Knopf ginge und die WS-Verbindung neu aufgebaut würde. Ein
gemeinsames Blatt für beide Zeiträume statt zwei Ansichten, weil der Vergleich
„heute vs. insgesamt" genau der Grund ist, aus dem man die Liste aufmacht.
Bewusst dieselbe Sortierung wie in den Karten (inkl. Tiebreak D-020), damit
Platzangabe oben und Liste unten nie auseinanderlaufen.

## D-031 (2026-09-01): Treue-Abzeichen nach Anzahl der Abende

**Entscheidung:** Neues Abzeichen im Profil, das zählt, an wie vielen Abenden
jemand dabei war. Stufen bei **10 (Stammgast), 20 (Dauergast), 50
(Kellerlegende), 100 (Ehrenmitglied) und 200 (Urgestein)**. Angezeigt wird
immer nur die **höchste erreichte** Stufe; unter 10 Abenden erscheint gar
kein Abzeichen. Die Pill zeigt die tatsächliche Zahl der Abende, der Tooltip
die nächste Stufe. Der Server berechnet die Stufe in `getPlayerStats`, das
Frontend zeigt nur an.

**Begründung:** Nutzerwunsch. Die Stufen sind bewusst als „höchste gewinnt"
umgesetzt statt als Reihe von fünf Abzeichen — sonst füllt sich die Zeile mit
Stufen, die man längst hinter sich hat. Kein Abzeichen unterhalb der ersten
Schwelle, damit die Abzeichen-Zeile für neue Gäste nicht mit einem leeren
Platzhalter startet. Anders als die übrigen Abzeichen („leuchtet, wenn heute
geschafft") ist es dauerhaft verdient — der Hinweistext über der Zeile sagt
das jetzt dazu.

## D-032 (2026-09-01): Verlauf als Kurve statt als Balken

**Entscheidung:** Der Verlaufsgraph auf der Abend-Karte ist eine **weiche
Kurve mit gefüllter Fläche** statt der Balkenreihe aus D-029. Die Datenlage
bleibt unverändert (ein Wert je Stunde, alle Personen zusammen); nur die
Darstellung wechselt. Gezeichnet als Catmull-Rom-Kurve, von Hand in kubische
Béziers umgerechnet, mit geklemmten Kontrollpunkten, damit die Kurve bei
starken Sprüngen nicht unter die Grundlinie ausschlägt. Die Spitzenstunde
bekommt eine gestrichelte Markierung bis zur Grundlinie und einen goldenen
Punkt; unsichtbare Streifen je Stunde halten den Tooltip. Ersetzt die
Balkendarstellung aus D-029.

**Begründung:** Nutzerwunsch. Ein Abend hat 5–10 Stunden mit Werten — als
Balken ist das eine Reihe breiter Klötze, als Kurve sieht man den Bogen des
Abends (langsam an, Spitze, Ausklang) auf einen Blick. Zwei Details fallen
dabei an: Die Fläche wird per `preserveAspectRatio="none"` ungleichmäßig auf
die Kartenbreite gezogen, deshalb hängt die Linienstärke an
`vector-effect: non-scaling-stroke` — sonst würde die Linie mitverzerrt. Und
der Punkt auf der Spitze ist ein HTML-Element über der Fläche, weil ein
`<circle>` durch dieselbe Skalierung zur Ellipse würde.

## D-033 (2026-09-01): Ein Knopf für die ganze Rangliste

**Entscheidung:** Statt eines Knopfes in jeder der beiden Profil-Karten
(D-030) steht **ein** Knopf „Ganze Rangliste ansehen ›" allein unter der
All-Time-Karte. Er öffnet das Blatt in der All-Time-Ansicht; auf Heute wird im
Blatt selbst umgeschaltet.

**Begründung:** Nutzerwunsch. Zwei Knöpfe, die dasselbe Blatt öffnen, in dem
ohnehin zwischen beiden Zeiträumen gewechselt wird, sind eine Wiederholung —
und in der Karte sah der Knopf wie ein weiterer Karteninhalt aus. Freistehend
liest er sich als das, was er ist: der Weg aus dem eigenen Umfeld in die
vollständige Liste.

## D-034 (2026-09-01): Vollsicherung als JSON — Download und Import im Admin

**Entscheidung:** Der Admin-Bereich bekommt zwei Knöpfe: **„⬇ Backup
herunterladen"** lädt den kompletten Bereich als eine JSON-Datei
(`GET /<bereich>/api/export/backup`), **„⬆ Backup einspielen"** stellt daraus
alles wieder her (`POST /<bereich>/api/import/backup`). In der Datei stehen
Nutzer inklusive ID, PIN-Hash, Zählern und Sichtbarkeit, das komplette
`drink_log` mit IDs und Zeitstempeln, alle `settings` (TV-Modus, Abend-Namen,
QR-Adresse, Takte) und die eigenen Fun-Facts. Der Import ersetzt den Bestand
des Bereichs vollständig, in **einer Transaktion**, nach einer kompletten
Prüfung in `server/backup.js` — schlägt irgendetwas fehl, bleibt der alte Stand
unverändert. Weil er so destruktiv ist wie „Alles zurücksetzen", verlangt er
dasselbe **Lösch-Passwort** (`RESET_PASSWORD`), hängt am selben Rate-Limit und
ist nur mit Admin-Token des eigenen Bereichs erreichbar; eine Sicherung des
anderen Bereichs (Feld `area`) wird abgewiesen. Format-Kennung
`partykeller-counter-backup`, `version: 1`.

**Begründung:** Nutzerwunsch — bisher hing der ganze Keller an einer
SQLite-Datei auf einem Laptop, und die CSV-Exporte (D-025) sind
Auswertungsdateien, keine Sicherung: ihnen fehlen IDs, PIN-Hashes und
Einstellungen. JSON statt einer Kopie der `.db`, weil die Datei so aus dem
Browser heraus über das Admin-Login geladen werden kann (kein Dateizugriff auf
dem Server nötig), auch bei laufendem Server konsistent ist (WAL-Dateien
einzeln zu kopieren ist es nicht) und beim Einspielen Feld für Feld geprüft
werden kann. IDs wandern bewusst mit: nur dann zeigen alte Links, Abend-Namen
und vor allem die **Tokens auf den Handys** nach der Wiederherstellung wieder
auf dieselben Personen (D-006). Nicht in der Datei steht die `.env` — sie
gehört getrennt gesichert, und nur mit demselben `TOKEN_SECRET` bleiben die
Logins gültig. Der Body-Parser bekommt für diesen einen Endpunkt 20 MB (sonst
100 kB), damit auch ein Log über Jahre durchpasst.

## D-035 (2026-09-01): Erklärtexte an Abzeichen, TV-Anzeige und Fun-Facts entfernt

**Entscheidung:** Die drei beschreibenden Untertitel sind raus: „Leuchtet, wenn
heute geschafft …" unter *Abzeichen* im Profil, „Haken in der Liste gilt nur
für die Gesamtansicht …" im Admin-Block *TV-Anzeige* und „Laufen im TV-Band
zusammen mit den Live-Facts durch." bei *Eigene Fun-Facts*. Die Tooltips an den
einzelnen Abzeichen bleiben.

**Begründung:** Nutzerwunsch. Die Bereiche sind eingeführt und werden von
denselben paar Leuten bedient — der Dauertext erklärt nichts mehr, kostet aber
in jeder Ansicht Platz und Ruhe.

## D-036 (2026-09-04): Vier neue Fun-Facts — Comeback und die Meilensteine

**Entscheidung:** Das TV-Band bekommt vier weitere berechnete Facts:

- **Comeback** — wer heute wieder dabei ist, davor aber mindestens einen Monat
  gefehlt hat („nach 4 Monaten wieder dabei – zuletzt am 07.05.2026"). Es
  gewinnt die längste Pause.
- **Persönliche Marke** — volle 50er je Sorte und volle 100er insgesamt
  („steht jetzt bei 50 Shots insgesamt"), sichtbar für 30 Minuten nach dem
  Getränk, das die Marke gerissen hat.
- **Hausmarke** — volle 500er über alle Personen zusammen; sie fällt selten
  genug, um den ganzen Abend stehen zu bleiben.
- **Führungswechsel** — wer heute an die Spitze der All-Time-Liste gezogen ist
  und wen er dafür überholt hat.

Alle vier rechnen aus `drink_log` (Server, `getFunStats`), ausgeblendete
Personen zählen wie überall nicht mit.

**Begründung:** Nutzerwunsch aus einer Ideenliste. Grundlage ist bewusst das
Log und nicht die All-Time-Zähler: nur im Log steht, **wann** eine Marke
gefallen ist — ohne Zeitstempel gäbe es kein „gerade eben". Weil Admin-Korrekturen
(`setCounter`) am Log vorbeigehen, können Log-Stand und sichtbarer Platz 1
auseinanderlaufen; beim Führungswechsel wird deshalb gegengeprüft, und stimmen
beide nicht überein, sagt das Band lieber nichts, statt auf dem Fernseher eine
falsche Überholung zu behaupten. Die Marken sind Momente, keine Dauerzustände —
darum das 30-Minuten-Fenster für die persönliche Marke; ohne das würde sie bis
zum nächsten Meilenstein im Band kleben. Die Facts beschreiben, was passiert
ist, und fordern niemanden zu etwas auf.

## D-037 (2026-09-04): Ausgeblendete Konten stehen auch nicht mehr in der Anmeldeliste

**Entscheidung:** Der Sichtbarkeits-Haken im Admin blendet ein Konto jetzt auch
auf der Anmeldeseite („Wer bist du?") aus, nicht mehr nur in der TV-Gesamtansicht.
`renderUsers` in `public/index.html` filtert dafür `hidden`-Konten aus der
Auswahl; sind alle ausgeblendet, greift der normale Leertext. Server und
Datenmodell bleiben unverändert: Wer bereits ein Token auf dem Handy hat, bleibt
angemeldet und zählt weiter, und `POST /api/login` weist ausgeblendete Konten
nicht ab.

**Begründung:** Nutzerwunsch. Der Haken war bisher nur eine TV-Einstellung, das
Konto stand aber weiter in der Anmeldeliste — bei Gästen, die einmal da waren
und nicht wiederkommen, wächst die Liste auf dem Handy immer weiter zu. Bewusst
nur eine Anzeige-Entscheidung im Frontend und keine Sperre: „ausgeblendet" heißt
weiterhin „nicht in der Rangliste", nicht „gesperrt". Zwei Folgen, die man kennen
sollte — der Name eines ausgeblendeten Kontos bleibt vergeben („Name ist schon
vergeben" beim Neuanlegen), und wer sein Konto nach dem Ausblenden am Handy
abmeldet, kommt ohne den Admin nicht mehr hinein.

## D-038 (2026-09-08): Oberfläche aufgeräumt — weniger Erklärtext, keine Farbkante, ruhigere Zahlen

**Entscheidung:** Eine Runde Feinschliff quer durch alle Screens, nach
Rückmeldung aus dem Betrieb:

- **Anmeldung:** Überschrift „Wer bist du?" → „Anmeldung", der Untertitel
  („Wähle deinen Account oder starte neu.") entfällt, der Trenner über dem
  Anlege-Formular heißt „Registrieren" statt „oder neu anmelden".
- **Dashboard:** „Gesamt seit Beginn" in der Heute-Karte und die Rang-Pille
  oben rechts entfallen — beides steht im Profil-Tab. Der Aufmunterungssatz
  („Heute noch nichts getrunken – …") entfällt. „X Getränke zurück" heißt jetzt
  „X Getränke Rückstand".
- **Admin:** „Nur für die Kellermeister." entfällt; „Leer = Adresse dieses
  Servers." entfällt, wodurch *QR-Adresse* und *Sicherung* in eine Zeile passen
  (ein Trennstrich zwischen beiden Gruppen).
- **Abend-Archiv:** Untertitel „Jeder Party-Tag auf einen Blick." und der
  Hinweis „Spieler mit 0 stehen unten – …" entfallen; der Punkt auf der
  Spitzenstunde leuchtet nicht mehr.
- **Karten ohne Farbkante:** `.card` (Dashboard), `.night-card` und `.edit-card`
  (Archiv) und das Ranglisten-Blatt haben oben keine farbige Kante mehr, nur
  noch die Glaskante rundum. Damit entfallen `--edge` und die Modifier
  `.card--green/amber/brick`; die Farbe der Karte trägt jetzt allein ihre
  Überschrift. `.pill` war danach ungenutzt und ist raus.
- **TV:** Ab zwei heißt es „Mischen" statt „Mische" (Kopfzeile *und*
  Podest-Details, `fmtMixes`); alle drei Podestzahlen bekommen dasselbe
  Leuchten wie bisher nur Platz 1
  (`text-shadow: 0 0 46px oklch(0.80 0.15 83 / 0.65)`).
- **Pop-Animation:** `bump()` im Dashboard nimmt die Klasse `pk-pop` nach dem
  Lauf wieder ab (`animationend`, `{ once: true }`).

**Begründung:** Nutzerwunsch nach einem Abend im echten Betrieb. Die Texte
erklärten Dinge, die man nach zwei Minuten selbst sieht, und die Zahlen standen
doppelt — einmal beim Zählen, einmal im Profil; wer sie sucht, findet sie dort.
Die Farbkante oben stammt aus dem Design-Prototyp (v3); sie wird hier bewusst
aufgegeben, weil die Kartenfarbe schon in der Überschrift steckt und die
Oberfläche mit den vielen Karten sonst unruhig wirkt — PLAN.md §8 ist
entsprechend nachgezogen. Beim Pop war die stehengebliebene Klasse der
eigentliche Fehler: `display:none` durch den Tab-Wechsel startet eine noch
gesetzte CSS-Animation neu, also ploppten die Zahlen bei jedem Umschalten
wieder auf, obwohl sich nichts geändert hatte.

## D-039 (2026-09-09): Getränkefelder sind ganzflächige Knöpfe in der Getränkefarbe

**Entscheidung:** Im Zählen-Tab ist jedes Getränk jetzt **ein einziger Knopf**,
der komplett in der Getränkefarbe liegt: Bier amber, Shots brick, Mischen
violett. Die separate Knopfzeile („+ Bier hinzufügen") entfällt; Name, ein
Plus-Zeichen und die Heute/Gesamt-Zahlen sitzen direkt auf der Farbe. Die
Schriftfarbe ist dieselbe Paarung, die vorher auf dem Knopf saß — dunkler
Grund (`--bg`) auf Bier und Mischen, Creme (`--ink`) auf Shots, weil Brick für
dunkle Schrift zu dunkel ist. Beides hängt als `--fill`/`--on` am Element, die
Klasse `.drink` in `public/dashboard.html` bedient sich daraus. Das Plus steht
ohne Kreis frei in der Kontrastfarbe. `.btn-big` war danach nirgends mehr in
Gebrauch und ist aus `theme.css` raus; die Youngstars-Umsortierung (Bier
zuunterst) hängt jetzt an den Feldern selbst statt an eigenen Karten-IDs.

**Begründung:** Nutzerwunsch nach einem Entwurf mit zwei Varianten — ganzes
Feld als Knopf gegen farbige Karte mit weiterhin eigenem Knopf. Die erste
gewinnt: ein Feld schrumpft von 233 auf 128 Pixel, der ganze Zählen-Tab von
890 auf 567, damit passen alle drei Getränke plus Tageszähler ohne Scrollen
auf ein Handy — und im Keller wird mit einer Hand und schräg gehaltenem
Display getippt, da ist die größere Fläche mehr wert als die ruhige Karte
drumherum. Preis dafür: es gibt keine tote Zone mehr, ein Tipper auf die
Zahlen zählt mit. Das ist vertretbar, weil Hochzählen die einzige Aktion auf
diesem Bildschirm ist und ein Verzähler ohnehin nur über den Admin
zurückgeht (kein Minus-Button, PLAN.md §8). Das Plus bleibt als Hinweis, dass
hier getippt wird, aber ohne Kreis — der Kreis hätte wieder ein Ziel
suggeriert, obwohl die ganze Fläche eines ist.

## D-040 (2026-09-09): Profil-Tab — eine Rangliste, ein Kopf, Anteil am Haus

**Entscheidung:** Drei Änderungen im Profil-Tab, aus einem Entwurf mit
Gegenüberstellung gewählt:

- **Eine Ranglisten-Karte statt zwei.** „Heute Abend" und „All-Time" hatten
  denselben Aufbau und standen untereinander; jetzt gibt es eine Karte
  „Rangliste" mit demselben gleitenden Umschalter, den Zählen/Profil und das
  Ranglisten-Blatt schon benutzen. „Ganze Rangliste ansehen" sitzt als
  Fußzeile (`.card-foot`) in derselben Karte und öffnet das Blatt **im gerade
  gewählten Zeitraum**. Solange niemand den Schalter angefasst hat, wählt die
  Karte selbst: „Heute", sobald man heute etwas geloggt hat, sonst „All-Time".
  Nach der ersten Berührung bleibt die Wahl stehen.
- **Kopf statt Name.** Über den Tabs steht ein Streifen aus Namenszeichen
  (dasselbe `.avatar` wie in der Anmeldeliste, dafür nach `theme.css` gezogen),
  Name und „Dabei seit 16.08.2026 · 13 Abende". `createdAt` stand schon im
  Zustand und wurde bisher nirgends angezeigt; die Zahl der Abende kommt aus
  `/stats`. Der Streifen gilt für beide Ansichten — deshalb ersetzt er den
  zentrierten Namen, statt zusätzlich dazuzukommen.
- **Anteil am Haus.** Unter „Deine Mischung" ein zweiter Balken auf derselben
  Spur, darunter „69 von 114 Getränken · 60,5 %". Grundlage ist dieselbe
  Spielerliste, aus der direkt darüber auch der All-Time-Platz stammt.

Nebenbei heißt „Bestes Ergebnis" jetzt „Bester Abend" (passt in eine Zeile),
und `bump()` nimmt einen optionalen Schlüssel, damit sich Heute- und
All-Time-Wert dasselbe Element teilen können, ohne dass das Umschalten als
Anstieg gilt.

**Begründung:** Der Tab war fünf Blöcke lang und zeigte zweimal dieselbe Form;
zusammengelegt sind es vier und rund 150 Pixel weniger. Der Kopf gibt dem
Profil eine Identität, statt sofort mit Zahlen anzufangen, und nutzt endlich
ein Feld, das seit dem ersten Schema mitgeschleppt wird. Der Anteil am Haus
gibt der All-Time-Zahl einen Maßstab, ohne ein Ziel zu setzen — bewusst als
Anteil formuliert und nicht als Rückstand auf irgendwen, und bewusst ohne
Vergleich zum Hausschnitt, der für alle darunter eine Aufforderung wäre
aufzuholen.

## D-041 (2026-09-09): Das zuletzt benutzte Konto steht in der Anmeldeliste oben

**Entscheidung:** Die Anmeldeliste zeigt das Konto, mit dem sich dieses Handy
zuletzt angemeldet hat, an erster Stelle — ohne Kennzeichnung, ohne eigene
Überschrift, einfach oben. Dahinter bleibt die bisherige Reihenfolge unberührt.
Dafür schreibt `setSession()` zusätzlich `<prefix>_last_player_id` in den
`localStorage`; `clearSession()` löscht diesen Schlüssel **nicht**, das Abmelden
beendet also die Sitzung, nicht die Erinnerung. `renderUsers` in
`public/index.html` zieht den passenden Eintrag nach vorn, falls er in der
Liste steht.

**Begründung:** Nutzerwunsch. Die Liste kommt aus `getState` und ist damit nach
der All-Time-Rangliste sortiert — das steht nirgends und soll auch so bleiben,
aber es heißt, dass ein neues Konto ganz unten landet und man den eigenen Namen
bei jedem Besuch sucht. Bewusst ohne Beschriftung („Zuletzt: …" o. ä.): Wer sein
Handy kennt, findet den Namen sofort oben, und für alle anderen sieht die Liste
aus wie vorher. Der Schlüssel liegt nur auf dem Gerät, es geht nichts an den
Server, und ein gelöschtes oder ausgeblendetes Konto fällt einfach durch den
vorhandenen Filter.

## D-042 (2026-09-09): Das Abend-Archiv zeichnet in Blöcken von zwölf

**Entscheidung:** `public/abende.html` rendert zunächst die zwölf jüngsten
Abende; ein Knopf darunter („12 ältere Abende laden (noch 48)") zeichnet die
nächsten zwölf und springt zur ersten neuen Karte. Der Server bleibt
unverändert und liefert weiterhin alle Abende auf einmal.

**Begründung:** Nutzerwunsch, und die Messung zeigt, wo die Kosten wirklich
liegen: bei 60 Abenden und 6 600 Log-Zeilen braucht `getArchive()` rund 42 ms
und liefert 11 KB JSON — serverseitig also kein Problem. Teuer ist das
Zeichnen, weil jede Karte eine eigene SVG-Kurve mitbringt. Deshalb bleibt die
Datenseite, wie sie ist (eine Abfrage, kein Paging-Zustand, der mit
Korrekturen aus dem Bearbeiten-Dialog synchron gehalten werden müsste), und
begrenzt wird nur, was gemalt wird.

## D-043 (2026-09-09): Der Server gibt den Fun-Fact-Takt vor, der Admin kann blättern

**Entscheidung:** Das Fun-Fact-Band bekommt eine Übersicht im Admin — ein
eigenes Fenster hinter „Alle Fun-Facts ansehen ›" im vorhandenen Block
*Eigene Fun-Facts*: oben die Meldung, die gerade auf dem Fernseher steht, mit
Restzeit-Balken, darunter ‹ Zurück / „7 von 16" / Weiter ›, darunter die
komplette Liste mit Herkunfts-Chip (Rekord, Eigene, Heute, Statistik, Moment,
Bilanz); ein Klick auf eine Zeile springt dorthin. Dafür drei Änderungen unter
der Haube:

1. **`public/js/facts.js`** — `computeFacts()` ist aus `tv.html` heraus in ein
   gemeinsames Modul gewandert, das TV und Admin importieren. Nur so zeigt die
   Übersicht garantiert dieselbe Liste in derselben Reihenfolge wie der
   Fernseher. Jeder Eintrag trägt zusätzlich ein `kind` (die Herkunft); das
   Band zeigt es nicht, die Übersicht gruppiert danach.
2. **Der Server ist die Uhr.** Er hält je Bereich eine laufende Nummer
   (`area.factIndex`) und schaltet sie im eingestellten Takt weiter; welcher
   Fact das ist, rechnen die Clients mit `index % listenlänge` selbst aus. Die
   Nummer geht als eigene Nachricht `{ type: 'fact', index, since, seconds }`
   raus — bewusst **nicht** im State-Broadcast, sonst würde der Fernseher alle
   30 Sekunden seine ganze Rangliste neu zeichnen.
3. **`setFactIndex(index)`** ist eine normale Admin-Nachricht mit Token- und
   Rollenprüfung (CLAUDE.md Regel 6).

Die Position steht bewusst nicht in der Datenbank: nach einem Neustart fängt
das Band wieder vorn an.

**Begründung:** Nutzerwunsch nach einem Entwurf. Der Weg über den Server war
die einzige Variante, die ohne Loch auskommt: Der Fernseher hat kein Token —
ließe man ihn seinen Stand melden, wäre das eine Schreibnachricht ohne
Anmeldung, und genau das verbietet Regel 6. Umgekehrt braucht der Server die
Fact-**Texte** nicht zu kennen, um zu zählen, also bleiben die deutschen
Formulierungen da, wo sie hingehören: im Frontend. Zwei angenehme Nebenwirkungen:
zwei Fernseher im selben Bereich zeigen jetzt garantiert dieselbe Meldung, und
der Takt-Regler setzt die Restzeit sofort neu, statt gegen die alte Dauer
weiterzulaufen. Ist noch kein Fernseher verbunden, zeigt das Fenster trotzdem
die Liste — die rechnet der Admin selbst — und schaltet die Knöpfe ab.

## D-044 (2026-09-10): Design-Feinschliff — Abschnittszeilen mit Gold-Haarlinie, weniger Kästchen

**Entscheidung:** Nach einer Analyse aller Screens und einer Entwurfsrunde mit
Freigabe bleibt das Grunddesign (Farben, Knöpfe, Glas, Zapfen, Wald, Zählen-
Ansicht, Bereichsauswahl) unverändert. Umgesetzt werden nur die freigegebenen
Punkte:

1. **Abschnittszeile** `.sec` in `theme.css`: Gold-Eyebrow, dahinter eine
   Haarlinie in Gold, die nach rechts ausläuft (`--hair-gold`, für Youngstars
   im Orange-Gold). Ersetzt die grüne Vollunterstreichung auf der Anmeldung
   und die `.card-title`-Zeilen im Profil; ein optionaler Hinweis (`.sec-hint`,
   z. B. „All-Time", „3 von 5 heute") steht vor der Linie.
2. **Anmeldeliste als eine Tafel**: die Konten sind Zeilen mit Haarlinie in
   einer Glasfläche (`.user-list`) statt einer Kachel je Konto; die
   PIN-Eingabe bleibt in der Zeile des Kontos.
3. **Profil-Tab**: die Ranglisten-Karte ist die einzige Karte (die Bühne);
   „Deine Statistik" und „Abzeichen" stehen darunter rahmenlos unter
   Abschnittszeilen. Nachbarn (vor/hinter dir) sind Zeilen mit Haarlinie statt
   Kästchen, Beschriftungen in gemischter Schreibung (`.label--plain`), die
   Balken 10 statt 14 px hoch. Getränkenamen in der Legende bleiben Wörter.
4. **TV-Fun-Fact-Band**: keine Gold-Oberkante mehr; das Etikett „Fun Fact"
   steht links mit einer senkrechten Gold-Haarlinie, der Text folgt
   linksbündig. Der Rest des TV-Bilds bleibt.
5. **Abend-Archiv**: der Sieger ist eine Zeile über einer Haarlinie statt
   eines Kästchens in der Karte; im Kopf steht „‹ Zur Anmeldung" unter dem
   Titel neben dem Logo.
6. **Admin**: der TV-Anzeige-Umschalter ist ein Segment-Umschalter mit
   gleitendem grünen Balken wie im Profil. Dafür sind `.tabs`, `.tab-btn` und
   `.tab-indicator` aus `dashboard.html` nach `theme.css` gezogen und über
   `--tabs` (Anzahl Segmente) verallgemeinert.

**Verworfen** nach der Entwurfsrunde: Körnung und Vignette im Hintergrund,
Lichtkante auf Karten, Verlaufs-Knöpfe mit Creme-Schrift, Icon-Wasserzeichen
auf den Getränkefeldern, Linien-Icons in Legenden und Spaltenköpfen, ein
wärmeres Mischen-Violett, Punktleitlinien und neuer Titel auf dem TV,
±-Knöpfe als Umrisse im Admin.

**Begründung:** Nutzerwunsch, das Design „hochwertiger, einzigartiger" zu
machen, ausdrücklich ohne Stilbruch. Die Schwächen aus der Analyse waren
Karte-in-Karte (Archiv-Sieger, Nachbarn, drei gleich schwere Profil-Karten),
Versalien mit Sperrung auf fast jedem Label und acht einzelne Glaskacheln auf
der Anmeldung, durch die das Wasserzeichen durchschien. Die Gold-Haarlinie
ist der eine neue, wiederkehrende Baustein — sie gibt jedem Screen dieselbe
Abschnittsgliederung, ohne Farben oder Knöpfe anzufassen. Alles, was den
Look in Richtung eines neuen Stils geschoben hätte, hat der Nutzer in der
Entwurfsrunde abgelehnt; das ist hier festgehalten, damit es nicht erneut
vorgeschlagen wird.

## D-045 (2026-09-10): Rekordkurs ab dem ersten Getränk, Umschalter-Breite, Band-Strich

**Entscheidung:** Drei Korrekturen nach Nutzer-Rückmeldung:

1. **Rekordkurs** (ergänzt D-024): Der Vergleich läuft nicht mehr nach
   Uhrzeit seit dem 06:00-Start, sondern ab dem **ersten Getränk** des
   jeweiligen Abends: Heute seit dem ersten Getränk vergangene Zeit → Getränke
   des Rekord-Abends in derselben Zeitspanne nach *seinem* ersten Getränk.
   Rekord-Abend ist der bisherige Abend mit den meisten Getränken **aller**
   Personen (wie das Archiv ihn zeigt; D-024 zählte nur sichtbare Spieler).
   Die Pille erscheint erst nach 30 Minuten und nur, wenn der Rekord-Abend zu
   dem Zeitpunkt selbst schon Getränke hatte. Sie nennt jetzt Vergleichsdauer
   und Gesamtzahl des Rekord-Abends:
   „🔥 Auf Rekordkurs! 27 : 11 nach 2 h · Rekord-Abend 26.08.2026 (30)".
   `funStats.pace` bekommt dafür `elapsedMin`; `recordTotal` gab es schon.
2. **Admin-Umschalter**: die feste Segmentbreite steht als `width`, nicht
   als `flex-basis` — Firefox rechnet `flex-basis` nicht in die Breite des
   Umschalters ein, der dritte Knopf lief über den Rand und kollidierte mit
   dem Rotations-Regler.
3. **TV-Fun-Fact-Band**: der Trennstrich neben „Fun Fact" ist auf Texthöhe
   plus 4 px Luft gekürzt statt auf volle Bandhöhe.

**Begründung:** Beim Testen am Nachmittag zeigte die Pille „27 : 0 vs.
26.08.2026": Der Rekord-Abend hatte um diese Uhrzeit noch nicht begonnen,
deshalb stand er bei 0 und jeder Nachmittag war „auf Rekordkurs" — technisch
korrekt gerechnet, aber ohne Aussage. Der Vergleich ab dem ersten Getränk
misst, was gemeint ist: ob *dieser* Abend schneller läuft als der beste. Dass
die Pille den Abend (mit Gesamtzahl) und die Dauer nennt, macht den
Vergleich nachvollziehbar. Ausgeblendete Personen zählen für den Rekord-Abend
mit, weil der Nutzer den Rekord-Abend aus dem Archiv kennt und die beiden
Anzeigen sonst verschiedene Abende nennen.

## D-046 (2026-09-10): Stabilität — WebSocket-Fehler, Heartbeat, atomares Getränk, Admin-Eingaben

**Entscheidung:** Vier Härtungen ohne Funktionsänderung:

1. Jede WebSocket-Verbindung bekommt einen `error`-Listener (Warnung ins
   Log), der `WebSocketServer` ebenso; `maxPayload` ist 16 KB (Standard
   100 MB).
2. Heartbeat: alle 30 s ein Ping an jeden Client; wer bis zum nächsten Ping
   nicht geantwortet hat, wird beendet.
3. `db.logDrink(id, drink)`: Zähler +1 und Log-Eintrag als eine Transaktion;
   der WS-Handler `increment` nutzt sie für Spieler (Admin-Korrekturen bleiben
   ohne Log, D-005).
4. Admin-Nutzerliste: steht der Fokus in einem Eingabefeld der Liste (Name,
   Zählerwert), wird ein State-Broadcast nicht sofort gerendert, sondern
   nachgeholt, sobald das Feld den Fokus verliert.

**Begründung:** Ein Test mit einem ungültigen UTF-8-Frame hat den Server
reproduzierbar beendet („Unhandled 'error' event") — systemd startet neu,
aber alle Handys und der TV verlieren die Verbindung und die Fact-Uhr
springt zurück. Ein alter Browser oder ein Handy mit Funkloch reicht dafür.
Handys im Standby bleiben ohne Heartbeat minutenlang als tote Verbindungen
in `wss.clients` und füllen bei jedem Broadcast ihre Sendepuffer; im Test
räumt der Server eine stumme Verbindung nach 50 s weg. Zähler und Log waren
zwei getrennte Commits: bei einem Absturz genau dazwischen hätte der
All-Time-Wert gestimmt, der Heute-Wert gefehlt. Die Admin-Liste wurde bei
jedem Broadcast komplett neu gebaut, was ein gerade bearbeitetes Feld samt
Eingabe verwarf, sobald irgendein Gast trank.

Nicht umgesetzt: `synchronous = NORMAL` für SQLite. Der Gewinn pro Commit
ist klein, und beim gezogenen Stecker am Ende des Abends könnten die letzten
Sekunden fehlen — Persistenz geht vor (D-006).

## D-047 (2026-09-10): Historien-Cache — konstante Antwortzeit statt „mit jedem Getränk langsamer"

**Entscheidung:** Alle Tages-Aggregate über *vergangene* Party-Tage (Rekorde
je Sorte, Getränke je Spieler und Abend, Verlauf je Stunde, erstes Getränk je
Abend, Stand vor dem heutigen 06:00-Start, letzter Zeitstempel je Spieler)
liest `db.js` einmal in einen Speicher-Cache (`getHistory()`), gebunden an
den Tagesstart. Der laufende Party-Tag kommt aus eigenen Abfragen mit
`ts >= Tagesstart` dazu, die über den neuen Index `idx_drink_log_ts` laufen.
Helfer wie `rowsDayPlayerTotals()` liefern dieselben Zeilen wie vorher die
Abfragen über das ganze Log, sodass die Auswertungen (Rekorde, Fun-Facts,
Archiv, Statistik, Export) unverändert bleiben. Der Cache wird verworfen bei
Tageswechsel (automatisch), Archiv-Korrektur, Log-Eintrag in der
Vergangenheit, Import, Reset und Löschen eines Nutzers. Namen und
Ausblendungen werden weiterhin beim Lesen aufgelöst.

Dazu drei kleine Entlastungen der Clients:
- `GET /api/players` liefert nur die Konten (id, Name, ausgeblendet, PIN
  gesetzt) in Ranglisten-Reihenfolge; die Anmeldeseite nutzt ihn statt des
  ganzen States. Dafür ist der Ranglisten-Aufbau als `rankedPlayers()` aus
  `getState()` herausgelöst.
- Das Dashboard lädt die persönliche Statistik nach einem Getränk entprellt
  (0,8–2 s, zufällig gestreut) statt sofort auf allen Handys gleichzeitig.
- Der Admin lädt die Archiv-Auswahl beim Öffnen höchstens alle 10 s neu.

**Begründung:** Messung mit realistischen Daten (60 Konten, 40 Abende,
19.000 Log-Zeilen): ein State-Broadcast kostete 95 ms, das Archiv 96 ms, die
persönliche Statistik 47 ms — bei jedem Getränk, auf jedem Handy, auf einem
Pi etwa das Vier- bis Fünffache. Mit 180.000 Zeilen war es eine Sekunde pro
Getränk. Ursache: fünf komplette Log-Durchläufe mit Datumsformatierung pro
Zeile je Broadcast, obwohl sich davon nur der laufende Tag ändert. Nach der
Änderung: 6,5 ms / 3,6 ms / 1,3 ms (19k) bzw. 54 / 40 / 10 ms (180k), und die
Ausgaben sind gegen den alten Code Zeile für Zeile identisch (Ausnahme:
mehrere Einträge in derselben Millisekunde, wo der alte Code bei „Erster
Trinker" einen beliebigen nahm, der neue den ältesten). Kein Schema-Umbau,
keine neue Dependency; der Cache belegt bei 150 Abenden wenige MB.

## D-048 (2026-09-10): Logo verkleinert; keine Cache-Header für Statics

**Entscheidung:** `public/assets/logo.png` ist von 2004 × 1697 px (140 KB)
auf 567 × 480 px (42 KB) verkleinert — das Vierfache der größten
Anzeigehöhe (120 px auf der TV-Bühne), also auch auf einem 4K-Fernseher
scharf. Das Youngstars-Logo bleibt: verlustfrei ist nichts zu holen, und es
wird ohnehin durch die Original-PNG des Nutzers ersetzt (siehe PROGRESS).

Bewusst **nicht** eingeführt: `Cache-Control: max-age` für Statics. Express
liefert die Dateien mit ETag, ein zweiter Aufruf kostet im WLAN nur eine
Rückfrage von wenigen Millisekunden. Ein `max-age` würde dagegen nach einem
Update auf dem Pi bis zum Ablauf alte CSS-/JS-Dateien auf den Handys lassen
(genau das vermeidet auch der bewusst cache-freie Service Worker).

**Begründung:** Abschluss der Effizienz-Analyse (Paket 3): das Logo war das
einzige Asset, das gegenüber seiner Anzeigegröße deutlich überdimensioniert
war. Alles Weitere aus der Analyse ist mit D-045 bis D-047 umgesetzt.

## D-049 (2026-09-10): Abendrückblick als Story-Bild aus dem Archiv

**Entscheidung:** Jede Abend-Karte im Archiv hat einen Knopf „⬇ Story", der
den Abend als PNG im Hochformat 1080 × 1920 herunterlädt: Datum, Abendname,
Abendsieger und die Plätze 2 und 3 als Zeilen über Haarlinien, die Bilanz
(Gesamt/Bier/Shots/Mischen) als Kacheln und darunter der Verlauf pro Stunde.
Der Knopf ist für **alle** sichtbar; CSV, Korrekturen und TV-Anzeige bleiben
wie bisher dem Admin vorbehalten und stehen in einer eigenen Zeile darunter.

Gezeichnet wird im Browser auf einem `<canvas>` (`public/js/story.js`), aus
denselben Daten wie die Karte selbst plus `GET /api/archive/:day` für die
Plätze. Farben kommen über `getComputedStyle` aus den Theme-Tokens, deshalb
gilt das Bereichs-Theme automatisch — Youngstars bekommt Navy/Orange, sein
Neon-Logo neben dem Vereinslogo und keinen Baum-Footer (D-019). Das Modul
wird erst beim Klick geladen (dynamischer `import`).

Der Verlauf kommt nur aufs Bild, wenn er etwas erzählt: mindestens drei
Stunden mit unterschiedlichen Werten, sonst wäre es eine flache Linie. Fehlt
er, rücken die übrigen Blöcke zusammen (Lücken auf 130 px gedeckelt) statt
über die Seite zu fliegen. Die Kurvenformel liegt jetzt einmal in
`public/js/curve.js` und wird von der Archiv-Karte (SVG) und vom Story-Bild
(Canvas) gemeinsam benutzt.

**Begründung:** Gewünscht war ein teilbarer Rückblick fürs Handy. Canvas
statt Server-Rendering hält die Regeln des Projekts ein: keine neue
Dependency, kein Build-Step, funktioniert offline im WLAN — und der Pi
bekommt keine Bildarbeit ab. Kein direktes Teilen: die App läuft über
`http://` im WLAN, damit ist die Teilen-Funktion des Browsers (nur in
sicherem Kontext) nicht verfügbar; das Bild landet in den Downloads und wird
von dort in die Story gezogen.

## D-050 (2026-09-10): Keine Gendersprache in der Oberfläche

**Entscheidung:** Texte in der App werden nicht gegendert — kein Doppelpunkt,
Sternchen oder Binnen-I. Betroffen waren „Teilnehmer:innen" auf den
Abend-Karten und im Story-Bild (jetzt „Teilnehmer") und der Fun-Fact
„Fleißigste:r heute" (jetzt „Fleißigster heute"). Die Konvention steht in
CLAUDE.md; ältere DECISIONS-Einträge bleiben im Wortlaut stehen (harte
Regel: bestehende Einträge nicht umschreiben).

**Begründung:** Vorgabe des Nutzers.

## D-051 (2026-09-21): TV-Podest gefüllt in Rangfarben, Board ohne Kästen, neues Logo

**Entscheidung:** Das TV-Podest wird neu gestaltet (Entwurf „O" aus einer
Entwurfsreihe mit Mockups):

1. **Namen über dem Podest**: Der Name steht über dem Feld auf dem
   Boardgrund, in der jeweiligen Rangfarbe (Bitter 800, 32/26/24 px). Die
   Felder werden entsprechend flacher (160/130/118 px statt 196/148/130), der
   Podiumsblock misst 240 px. Die Aufstellung 2 · 1 · 3 mit gestaffelten
   Höhen bleibt.
2. **Gefüllte Felder statt Glaskarten**: Das Feld ist eine Vollfläche in der
   Rangfarbe mit dunkler Schrift — dieselbe Behandlung wie die Getränkefelder
   im Dashboard (D-039). Darin zentriert die Gesamtzahl und die Getränkezeile,
   einfarbig; die Mittelpunkte trennen bei `opacity .42`. Der Gold-Schein auf
   den Zahlen entfällt (auf heller Fläche nur Matsch).
3. **Rangkreis wie gehabt** auf der Feldkante, vollfarbig in der Rangfarbe.
   Da Kreis und Feld dieselbe Farbe haben, stellt ihn ein Ring in der
   Hintergrundfarbe frei (`box-shadow: 0 0 0 7px var(--bg)`) statt des
   bisherigen farbigen Scheins. Das Aufleuchten beim Platzwechsel
   (`--pk-flash`) nimmt jetzt die Farbe des Platzes statt immer Gold.
4. **Silber und Bronze sind Tokens**: `--silver: oklch(0.78 0.015 240)` und
   `--bronze: oklch(0.64 0.09 45)` stehen in `theme.css` statt hart in
   `tv.html`. Es sind dieselben Werte wie bisher; sie gelten in beiden
   Bereichen, Gold kippt im Youngstars-Bereich wie gehabt ins Orange-Gold.
5. **Gesamt-Spalte als gefüllte Pille**: In der Rangliste sitzt die
   Gesamtzahl in einer gefüllten Gold-Pille. Damit wiederholt sich die
   Vollfläche im ganzen Board, das Podest ist kein Einzelfall.
6. **Weniger Kästen**: Die Rangliste verliert den äußeren Rahmen und die
   Füllung, das Fun-Fact-Band ebenfalls. Die Zeilen behalten ihre Glaskante
   samt `backdrop-filter`, der Rahmen um den QR-Code bleibt.

Außerdem: **neues `logo.png`** (Creme `#eee4cd` statt Weiß, transparent,
1181 × 1000 bei gleichem Seitenverhältnis) — wird überall verwendet, wo das
Logo schon eingebunden war (alle Seiten und das Story-Bild), ohne Änderung
an den Einbindungen. Die Datei des Nutzers wird unverändert übernommen; sie
ist mit 247 KB größer als die nach D-048 verkleinerte Fassung (42 KB, 567 ×
480) und entspricht dem Achtfachen der größten Anzeigehöhe. Im WLAN fällt das
nicht ins Gewicht; falls doch, lässt sie sich jederzeit auf 567 × 480
herunterrechnen.

**Begründung:** Das bisherige Podest unterschied die Plätze fast nur über die
Größe — alle drei Zahlen waren Gold mit demselben Leuchten —, war mit 822 px
deutlich schmaler als die Tabelle darunter und stapelte Badge auf Karte auf
Glas. Die Vollfläche macht den Rang auf einen Blick lesbar. Weil „gefüllte
Fläche" im Projekt bisher „Knopf" hieß (D-039) und auf dem TV nichts
angetippt wird, übernimmt die Rangliste die Füllung in der Gesamt-Spalte mit;
dadurch ist es eine Board-Sprache und kein geborgtes Handy-Element. Die
Kästen um Rangliste und Fun-Fact-Band waren doppelt (Kasten im Kasten, wie
schon bei D-044 abgeräumt) und kosteten Platz. Entwürfe A–O mit Mockups
wurden durchgespielt; gewählt hat der Nutzer O.

## D-052 (2026-09-21): Onboarding für neue Konten

**Entscheidung:** „Konto erstellen & los" führt nicht mehr direkt ins
Dashboard, sondern auf `/<bereich>/onboarding` — drei Vollbild-Seiten, danach
das Dashboard:

1. **Getränke Tracken** — „Tippe auf ein Getränkefeld um es zu tracken.",
   darunter die drei Getränkefelder als Schaubild (gleiche Anatomie wie im
   Dashboard, D-039, nur kleiner und ohne Funktion). Der Eyebrow begrüßt mit
   dem gerade angelegten Namen.
2. **Rangliste** — was auf dem Fernseher läuft: Podest in Gold/Silber/Bronze
   (D-051) mit dem eigenen Namen auf Platz 1, zwei Ranglistenzeilen und das
   Fun-Fact-Band.
3. **Platz, Abende, Abzeichen** — was im Profil-Tab steht: Ranglisten-Karte,
   Statistik und Abzeichen.

Unten drei Punkte und ein Knopf („Weiter", zuletzt „Los geht's"), oben rechts
„Überspringen" (auf der letzten Seite ausgeblendet). Beide Wege gehen per
`location.replace` weiter, damit die Zurück-Taste aus dem Dashboard nicht ins
Onboarding zurückfällt. Ohne Anmeldung leitet die Seite auf die Anmeldung.

Die Zahlen in den Schaubildern sind Beispielwerte, kein echter Stand — die
Seiten sollen zeigen, wie die Oberfläche aussieht, bevor sie leer ist.

**Begründung:** Bisher landete ein neues Konto ohne ein Wort direkt im
Dashboard. Drei Dinge erfährt man dort nicht von selbst: dass ein Tipp auf das
Feld zählt, dass der eigene Name im Keller auf dem Fernseher steht und dass es
neben dem Zählen einen Profil-Tab gibt. Der Ablauf hängt bewusst an der
Kontoerstellung und nicht am Anmelden — wer sich zum zwanzigsten Mal anmeldet,
sieht ihn nie. Alternativen waren eine geführte Ersteinrichtung (Name → PIN →
fertig) und Hinweise direkt im Dashboard; beide hätten Seiten angefasst, die
täglich benutzt werden (Anmeldung bzw. Zählen-Tab, D-044). Entwürfe A, B und C
mit Mockups wurden durchgespielt; gewählt hat der Nutzer A.

## D-053 (2026-09-24): TV-Rangliste läuft unten in einem Verlauf aus

**Entscheidung:** Wenn die Rangliste ab Platz 4 rotiert, blendet sie unten
über 120 Design-Pixel (knapp zwei Zeilen) weich aus, statt am Rand hart
abzubrechen. Der Verlauf hat eine Zwischenstufe (45 % Deckkraft auf halber
Höhe) und ist 8 px vor dem Rand schon ganz durchsichtig, damit von der
angeschnittenen Zeile keine Kante stehen bleibt. Die Rotation zählt jetzt
nur die Zeilen oberhalb des Verlaufs als sichtbar: Am Listenende steht der
letzte Platz voll lesbar da, darunter bleibt der Verlauf leer. Ob rotiert
wird, entscheidet weiter die volle Fensterhöhe — passen alle Zeilen hinein,
gibt es weder Rotation noch Verlauf.

**Begründung:** Der bisherige Verlauf war nur 48 px hoch, also kleiner als
eine Zeile (64 px). Von der angeschnittenen Zeile blieb so der obere Teil mit
Kante und halber Schrift voll stehen, was am Fernseher wie ein harter Schnitt
wirkte. Ein Verlauf über fast zwei Zeilen liest sich als „da kommt noch
mehr". Damit er keinen Platz frisst, der vorher für den letzten Platz der
Liste gebraucht wurde, rechnet die Rotation einen Schritt weiter.

## D-054 (2026-09-24): Design-Analyse umgesetzt: Fehler A1–A13, Ranglisten-Blatt (E4), Onboarding (E5)

**Entscheidung:** Aus `docs/DESIGN-REVIEW.md` sind alle Fehler A1–A13 sowie
die Entwürfe E4 und E5 umgesetzt:

- **Farben je Bereich:** Die Abdunklung hinter Dialogen ist jetzt ein Token
  `--scrim` (Navy im Youngstars-Bereich statt grünstichig). Alle bisher fest
  eingetragenen Goldtöne (Rekordkurs-Pille, Zeilen-Aufleuchten,
  Podest-Flash, Abzeichen) und der Glow um „Getränke heute" werden per
  `color-mix` aus `--gold` bzw. `--green` abgeleitet.
- **Schrift in Formularen:** `input, button, select, textarea` erben die
  Schrift der Seite. PIN-Felder tragen nicht mehr `.num`, der Platzhalter
  steht in Work Sans statt Bitter fett.
- **Admin:** Anmeldung und Dialoge ohne 4-px-Farbkante oben (wie Karten seit
  D-038). Gefährliche Dialoge erkennt man am roten Bestätigungsknopf.
- **Profil:** „Du führst!" bei Gleichstand „gleichauf mit …" statt
  „0 Getränke Vorsprung". Der doppelte Hinweis „Heute/All-Time" neben
  RANGLISTE entfällt. „Bester Abend" ohne Datum in der Beschriftung (steht
  im Tooltip), damit die drei Statistik-Werte auf einer Linie bleiben.
- **Ganze Rangliste (E4):** Plätze ohne „#", die ersten drei im Rangkreis in
  Gold/Silber/Bronze wie auf dem TV. Die eigene Zeile trägt eine „Du"-Pille
  statt „(du)". Die Zählzeile sagt „20 heute dabei" bzw. „20 Teilnehmer" wie
  das TV-Board.
- **Onboarding (E5):** „Getränke zählen" / „Tipp auf ein Getränkefeld, und es
  zählt eins dazu.", Logo in Anmeldungsgröße, im Youngstars-Bereich Bier
  unten wie im Dashboard. Das Profil-Schaubild entspricht dem echten Profil
  („#1 von 12 heute", Beschriftung in gemischter Schreibung, Statistik
  rahmenlos, Abzeichen „Stammgast ×13" und „Tagessieger ×3"). Im
  TV-Schaubild „Fun Fact" wie auf dem Fernseher. Abzeichen und
  `.label--plain` liegen dafür jetzt gemeinsam in `theme.css`.
- **Fun-Facts:** Einzahl bei 1 („1 Shot", „1 Mische", „1 Getränk", „genau
  eins", „einen Shot").
- **Links:** Das Abend-Archiv führt mit Anmeldung „‹ Zurück" ins Dashboard.
  „Zur Anmeldung" im Dashboard ohne Konto führt auf die Anmeldung des
  Bereichs statt auf die Bereichsauswahl.

**Begründung:** Die Analyse vom selben Tag hat gezeigt, dass die meisten
Unstimmigkeiten aus fest eingetragenen Werten und seitenweise kopierten
Bausteinen kamen. Fehler A sind ohne Design-Entscheidung behebbar. E4 bringt
das Ranglisten-Blatt in dieselbe Sprache wie das TV. E5 sorgt dafür, dass das
Onboarding zeigt, was man danach wirklich sieht. E1, E2, E3 (Rest: offene
Abzeichen) und E6 bleiben Entwürfe. Nicht umgeschrieben: der Text von D-052,
der noch die alten Onboarding-Sätze nennt.

## D-055 (2026-09-24): TV-Verlauf über die Deckkraft der Zeilen statt mask-image

**Entscheidung:** Der Verlauf unten in der TV-Rangliste (D-053) entsteht
nicht mehr über eine `mask-image` auf dem Ranglisten-Fenster. Stattdessen
setzt `applyFade()` jeder Zeile die Deckkraft, die zu ihrer Position passt:
oberhalb der untersten 120 Design-Pixel voll, darin linear abnehmend (bei
1080p z. B. 0,75 und 0,15 für die letzten beiden Zeilen). Zeilen außerhalb
des Fensters stehen auf 0. Beim Weiterrücken und beim Sprung nach oben
blenden die Zeilen im selben Takt wie die Bewegung ein und aus, oben
hinausgeschobene Zeilen verschwinden also weich statt an der Kopfzeile
abgeschnitten zu werden. Neue Zeilen blenden auf ihre Verlaufs-Deckkraft
ein. Ohne Rotation bleiben alle Zeilen voll. Die Zählung aus D-053 (nur
Zeilen oberhalb des Verlaufs gelten als sichtbar) bleibt.

**Begründung:** Beim Nutzer am echten Rechner kam die Maske nicht an: Die
Liste endete weiter mit einer harten Kante, auch die ursprüngliche
48-px-Maske war dort nie zu sehen. In Chromium (headless und mit
GPU-Rendering) ließ sich das nicht nachstellen. Die Zeilen tragen
`backdrop-filter`, und die Kombination mit einer Maske auf einem Vorfahren
setzen Browser und Grafiktreiber nicht überall um. Die Deckkraft einzelner
Elemente dagegen funktioniert überall. Verzichtet wird dafür auf den
stufenlosen Verlauf innerhalb einer Zeile: Jede Zeile hat eine Deckkraft,
der Verlauf entsteht über die Zeilen hinweg.

## D-056 (2026-09-24): TV-Rangliste zeigt nur ganze Zeilen, die letzten beiden blenden aus

**Entscheidung:** Der Verlauf unten in der TV-Rangliste (D-053, D-055) geht
nicht mehr von der Pixelposition aus, sondern von ganzen Zeilen. Sichtbar
sind nur so viele Zeilen, wie vollständig ins Fenster passen. Die letzten
beiden davon stehen auf 55 % bzw. 20 % Deckkraft. Die angeschnittene Zeile
darunter steht auf 0 und wird zusätzlich per `clip-path` weggeschnitten.
Beim Weiterrücken blendet die nachrückende Zeile von 0 auf ihre Stufe ein.
Am Listenende steht der letzte Platz voll lesbar da, darunter bleiben die
beiden Verlaufsplätze leer. Der Rest des Fensters unter der letzten ganzen
Zeile (je nach Format bis knapp eine Zeile) bleibt frei.

**Begründung:** Mit D-055 hatte die angeschnittene Zeile noch 15 %
Deckkraft. In Firefox und Chrome war ihre abgeschnittene Unterkante, z. B.
die halbe Gesamt-Pille, weiter als Kante zu sehen. Solange eine
angeschnittene Zeile überhaupt sichtbar ist, bleibt eine Kante. Deshalb
zeigt das Fenster jetzt nur ganze Zeilen und legt den Verlauf auf deren
Deckkraft.

## D-057 (2026-09-24): TV-Teilnehmerzahl links neben der QR-Pille

**Entscheidung:** Im TV-Kopf steht der Block aus Teilnehmerzahl, Summen und
Rekordkurs-Pille nicht mehr oben in der Mitte. Er sitzt jetzt linksbündig
direkt links neben der QR-Pille, und beide bilden rechts eine Gruppe. Die
Kopfzeile besteht damit aus zwei Gruppen: links Logo und Titel, rechts
Zahlen und QR-Code.

**Begründung:** Wunsch des Nutzers. Die Mitte bleibt frei, und die
Kennzahlen stehen beim QR-Code gebündelt.

## D-058 (2026-09-24): TV-Teilnehmerzahl rechts neben der QR-Pille

**Entscheidung:** Der Block aus Teilnehmerzahl, Summen und
Rekordkurs-Pille steht rechtsbündig ganz rechts im TV-Kopf, also rechts
neben der QR-Pille. Das ersetzt die Position aus D-057 links neben der
QR-Pille.

**Begründung:** Der Nutzer hatte „links“ geschrieben, aber „rechts“
gemeint.

## D-059 (2026-09-24): TV-Teilnehmerzahl rechtsbündig links neben der QR-Pille

**Entscheidung:** Die QR-Pille steht wieder ganz rechts im TV-Kopf. Der
Block aus Teilnehmerzahl, Summen und Rekordkurs-Pille steht direkt links
daneben und ist rechtsbündig. Das ersetzt D-058 (Block rechts neben der
Pille). Von D-057 bleibt die Position, nur rechtsbündig statt linksbündig.

**Begründung:** Wunsch des Nutzers nach Ansicht von D-058: „tausch doch
nochmal Pille und Anzahl". Rechtsbündig schließen die Zahlen bündig zur
QR-Pille ab.

## D-060 (2026-09-24): Admin-Namenszeilen ohne umschließendes Panel

**Entscheidung:** Das Glas-Panel um Tabellenkopf und Namenszeilen im
Admin-Dashboard entfällt. Die Zeilen sind schon selbst Glas-Elemente mit
Rahmen und stehen jetzt frei auf dem Hintergrund, bündig mit den Panels
darüber. Der Tabellenkopf ist um die Rahmenbreite eingerückt und steht
über den Spalten.

**Begründung:** Wunsch des Nutzers („passt nicht mehr ins Bild“). Rahmen
in Rahmen wirkt doppelt, und das übrige Design (Dashboard, Ranglisten-Blatt)
setzt Zeilen ebenfalls ohne äußeren Kasten.

## D-061 (2026-09-24): Admin-Bereich im aktuellen Design (Entwurf E7)

**Entscheidung:** Der Admin ist nach Entwurf E7 (`docs/DESIGN-REVIEW.md`)
umgebaut:
- **Kopf wie im Profil:** „Admin“, darunter *Bereich · n Konten · m Getränke
  gesamt*. Rechts „+ Neues Konto“ und „Abmelden“ als leiser Link.
- **Zwei Spalten:** links die Konten, rechts eine mitlaufende Seitenleiste
  (sticky) mit *TV-Anzeige*, *Eigene Fun-Facts*, *Einrichtung* und
  *Danger Zone*. Ist die Leiste höher als das Fenster, klebt sie erst, wenn
  ihr unteres Ende sichtbar ist. So bleibt die Danger Zone erreichbar.
- **Abschnitte mit `.sec-title`** statt eigener Glas-Kästen mit Überschrift.
- **Konten:** Namenskreis, runde Stepper („–“ als Umriss, „+“ gefüllt in der
  Getränkefarbe). Die Zahl ist ein rahmenloses Eingabefeld und bleibt direkt
  eintippbar. Gesamt steht in Gold. Umbenennen, PIN, Ein-/Ausblenden und
  Löschen liegen im ⋯-Menü und ersetzen Häkchen, Textlinks und die roten
  Löschknöpfe. Chips zeigen *ausgeblendet* und *ohne PIN*. Über der Liste
  stehen Suche und Filter *Alle / Heute dabei / Ausgeblendet*. *Heute dabei*
  nutzt die Heute-Werte, die der Server ohnehin schickt.
- **TV-Karte** mit Umschalter, Reglern und *Gerade auf dem TV* (Meldung,
  Restzeit, ‹ ›). Das Fenster „Alle Fun-Facts ansehen“ bleibt.
- **Danger Zone** (gestrichelt in brick): „Backup einspielen“ und „Alles
  zurücksetzen“. Beide stehen nicht mehr im Kopf bzw. neben „Backup
  herunterladen“. Die Überschrift ist auf Wunsch des Nutzers englisch.
- **Unter 1180 px** wird die Seitenleiste zu einem Umschalter *Konten | TV |
  Mehr*. **Unter 760 px** werden die Konten zweizeilige Karten mit
  beschrifteten Steppern nebeneinander. „+ Neues Konto“ ist dann ein runder
  Knopf neben der Suche.
- „Nutzer“ heißt im Admin jetzt „Konto“ (Abschnitt B der Design-Analyse).

**Begründung:** Wunsch des Nutzers nach Ansicht des Entwurfs („gerne so
umsetzen wie im Entwurf, aber Dangerzone auf englisch“). Der Admin hatte die
Formensprache von Dashboard und Profil noch nicht. Auf dem Handy war er rund
6 300 px lang, und der TV-Umschalter lief aus dem Bild. Gefährliche Knöpfe
standen direkt neben alltäglichen.

## D-062 (2026-09-24): Liste der eigenen Fun-Facts begrenzt und kompakt

**Entscheidung:** In der Admin-Seitenleiste ist jede eigene Meldung ein
Einzeiler (Titel-Chip, Text mit „…“ gekürzt, voller Text als Tooltip, ⋯).
Die Liste ist auf etwa sechs Einträge (236 px) begrenzt und scrollt darüber
hinaus in sich. Das ⋯-Menü dieser Liste hängt am `<body>` und ist fest
positioniert: unter dem Knopf, oder darüber, wenn unten kein Platz ist.
Beim Scrollen schließt es sich.

**Begründung:** Wunsch des Nutzers. Mit vielen eigenen Meldungen wurde die
Karte und damit die mitlaufende Seitenleiste endlos lang. Im Scrollbereich
würde ein normal angehängtes Menü abgeschnitten, und die Glas-Karte
(`backdrop-filter`) wäre der Bezugsrahmen für `position: fixed`. Deshalb
hängt das Menü am `<body>`.

## D-063 (2026-09-24): Ausgeblendete Konten dimmen nur den Inhalt

**Entscheidung:** Ein ausgeblendetes Konto im Admin dimmt nur Namenskreis,
Name, Stepper und Gesamt auf 50 %, nicht mehr die ganze Zeile. ⋯-Knopf,
⋯-Menü und der Chip „ausgeblendet“ bleiben voll deckend.

**Begründung:** Der Nutzer hat es gemeldet. Mit `opacity` auf der ganzen
Zeile (D-061) wurde das darin aufklappende ⋯-Menü mit durchsichtig, und die
Zeilen darunter schienen durch. Einstellungen sollen auch für ausgeblendete
Konten normal aussehen.

## D-064 (2026-09-24): Kein Hinweis „alphabetisch“ neben „Konten“

**Entscheidung:** Neben der Abschnittsüberschrift „Konten“ im Admin steht
kein „alphabetisch“ mehr. Nur wenn Suche oder Filter die Liste einschränken,
erscheint dort „n von m“.

**Begründung:** Wunsch des Nutzers. Die Sortierung erklärt sich von selbst.

## D-065 (2026-09-24): Zurück-Link im Admin wie im Abend-Archiv

**Entscheidung:** Unter „Admin“ steht ein grüner Link wie im Abend-Archiv
(D-054), daneben die Kennzahlen. Mit Gast-Anmeldung auf diesem Gerät heißt
er „‹ Zurück“ und führt ins Dashboard, sonst „‹ Zur Anmeldung“ und führt
zur Bereichs-Startseite. Das Admin-Token bleibt in der `sessionStorage`,
wer zurückkommt, ist also noch angemeldet.

**Begründung:** Wunsch des Nutzers. Aus dem Admin kam man bisher nur über
„Abmelden“ oder den Browser heraus.

## D-066 (2026-09-24): Heute-Abfragen mit festem Index, Broadcasts gebündelt

**Entscheidung:** Zwei Änderungen nach einem Lasttest (60 Handys, 2 TVs,
Admin; Test-Datenbanken mit 6 000, 120 000 und 627 000 Log-Einträgen):

1. Die drei Heute-Abfragen mit `GROUP BY player_id` (`todayCounts`,
   `todayPlayerTotals`, `lastLogTsToday`) nutzen fest `INDEXED BY
   idx_drink_log_ts`.
2. `area.broadcast()` bündelt: Der erste State geht sofort raus, alles, was
   in den nächsten 100 ms dazukommt, als ein gemeinsamer State hinterher.

**Begründung:** Wegen des `GROUP BY` wählte SQLite den Index
`(player_id, ts)` und las bei jedem Getränk das komplette Log aller Abende.
Der Historien-Cache (D-047) half dagegen nicht. Dazu rechnete jedes Getränk
den State einzeln aus und schickte ihn an alle Geräte. Tippten 60 Leute
gleichzeitig (Runde), wartete man bei 120 000 Einträgen bis 1,7 s und bei
627 000 bis 17 s auf die Bestätigung, bei Mehrfach-Tippen bis 5 s bzw. 51 s.
Dabei gingen 277 MB bzw. 684 MB übers WLAN. Nachher sind es 0,12 s bzw.
0,17 s und 3 MB bzw. 8 MB. Im Normalbetrieb sinkt die Zeit von 57 auf 21 ms
bzw. von 340 auf 73 ms. `ANALYZE` hätte den Plan ebenfalls korrigiert,
hängt aber von gepflegten Statistiken ab. Der feste Index ist
vorhersehbar. Der Inhalt des States bleibt unverändert.

## D-067 (2026-09-28): Lorbeer im Profil, Abzeichen ohne Leuchten

**Entscheidung:** Ab dem ersten Abendsieg steht der Namenskreis im
Dashboard-Kopf in einem goldenen Lorbeerkranz (Entwurf L4 aus
`docs/INSPIRATION-LANDO.md`). Unter dem Namen zeigt ein Chip „n×
Abendsieger“. Die Zahl ist `achievements.dayWinner.count` aus der
persönlichen Statistik. Ohne Sieg bleibt der Kopf wie bisher. Der Kranz ist
`public/assets/laurel.svg`, eingesetzt als CSS-Maske, damit er das Gold des
jeweiligen Bereichs annimmt.

Außerdem leuchten heute erreichte Abzeichen nicht mehr: Der goldene Schein
(`box-shadow`) um `.badge.earned` ist weg. Goldene Schrift und Rand bleiben.

**Begründung:** Wunsch des Nutzers. Der Kranz erst ab dem ersten Sieg sorgt
dafür, dass er etwas bedeutet. Das Leuchten der Abzeichen passte nicht mehr
zum flachen Stil der übrigen Chips.

## D-068 (2026-09-28): Übergang beim Seitenwechsel, Namenskreis gleitet ins Dashboard

**Entscheidung:** Die Seiten nutzen seitenübergreifende View Transitions
(`@view-transition { navigation: auto; }` in `theme.css`, nur bei
`prefers-reduced-motion: no-preference`). Beim Anmelden gleiten Namenskreis
und Name der angetippten Zeile in den Dashboard-Kopf
(`view-transition-name: me-avatar` / `me-name`). Danach wächst der Lorbeer
(D-067) mit kurzer Verzögerung herein. Die Logos tragen auf allen
Handy-Seiten gemeinsame Namen (`area-logo`, `ys-logo`) und gleiten mit, statt
doppelt überzublenden. Auf der Startseite bekommt nur das Logo der
angetippten Karte den Namen. Alles andere blendet in 0,22 s über.

Damit der Kreis im ersten Bild des Dashboards schon steht, merkt sich das
Handy den Namen des Kontos (`pk_player_name` / `ys_player_name`, gesetzt beim
Anmelden und bei jedem State, gelöscht beim Abmelden). Ein kleines
Inline-Skript füllt den Kopf, bevor Module und WebSocket da sind.
`<link rel="expect" href="#main-tabs" blocking="render">` hält das erste
Bild so lange zurück.

**Begründung:** Wunsch des Nutzers („Übergang im Profilbild“). Ohne
Bibliothek und ohne Build-Schritt: Browser ohne View Transitions (z. B.
Firefox) wechseln wie bisher hart. Getestet mit Chromium 141: Anmeldung →
Dashboard lief in jedem Durchlauf. Das Überblenden zwischen den übrigen
Seiten startet im Testbrowser nicht zuverlässig. Laut Trace bleibt es
dort beim Warten auf das erste Bild der neuen Seite hängen, sobald sie
Module per `import` lädt. Dann wechselt die Seite hart wie vorher, es geht
also nichts kaputt.

## D-069 (2026-09-28): Tab-Wechsel Zählen/Profil gleitet

**Entscheidung:** Beim Wechsel zwischen den Dashboard-Tabs Zählen und Profil
gleitet der neue Inhalt von der Seite herein, auf der sein Tab liegt:
Profil von rechts, Zählen von links. Dazu blendet er ein (0,32 s, 36 px). Das
ist dieselbe Richtung wie beim grünen Balken. Das ist eine reine
CSS-Animation (`.tab-in-right` / `.tab-in-left`), die nach dem Lauf wieder
entfernt wird. Ein Tipp auf den schon offenen Tab löst nichts aus. Bei
`prefers-reduced-motion` gibt es keine Animation. `.screen` schneidet über
`overflow: hidden` ab, dadurch entsteht beim Gleiten keine seitliche
Scrollleiste.

**Begründung:** Wunsch des Nutzers (Vorschlag 1 aus der Übergangs-Runde).
Bisher glitt nur der Balken, der Inhalt sprang. Nur der neue Inhalt wird
animiert, nicht zusätzlich der alte beim Hinausgleiten. So muss der Tipp
nicht auf ein Ende warten, und beide Tabs stehen nie gleichzeitig im Layout.

## D-070 (2026-09-28): Ein Wort für den Sieg, Archiv-Kopf am Handy, Startseite ohne Untertitel

**Entscheidung:**
- Der Sieger eines Abends heißt überall **„Tagessieger“**, so wie das
  Abzeichen (👑 Tagessieger). Das gilt für den Chip im Profil-Kopf
  („n× Tagessieger“, bisher „Abendsieger“, D-067) und für die Story-Grafik
  im Abend-Archiv.
- Im Abend-Archiv steht am Handy (≤ 760 px) nur das Partykeller-Logo neben
  dem Titel, wie im Admin-Kopf. Bisher standen bei den Youngstars beide
  Logos nebeneinander, und „Abend-Archiv“ brach auf zwei Zeilen um.
- Die Startseite hat keinen Untertitel mehr („Wähle deinen Bereich – beide
  haben eigene Listen und Logins.“).
- „Danger Zone“ im Admin bleibt englisch.

**Begründung:** Wünsche des Nutzers nach der Design-Durchsicht vom
2026-09-28. Zwei Wörter für dieselbe Sache standen im Profil direkt
untereinander.

## D-071 (2026-09-28): Saison-Akzente

**Entscheidung:** Zu fünf Anlässen schaltet sich nach dem Datum von selbst
eine kleine Deko ein (Entwurf 8, Artefakt „Saison-Akzente“):

| Anlass | Handy & TV | Moment auf dem TV |
|---|---|---|
| Oktoberfest | blau-weiße Wimpelkette oben | „O’zapft is!“ beim ersten Bier des Abends |
| Halloween | Kürbis-Laternen zwischen den Bäumen | Fledermaus bei Führungswechsel |
| Winter | Schneekappen, auf dem TV Schneefall | – |
| Silvester | wie Winter, dazu Countdown in der letzten Stunde | Feuerwerk um 0 Uhr, danach bis 6 Uhr alle 3–7 Minuten ein paar Raketen |
| Fasching | Luftschlangen | Konfetti bei Führungswechsel |

- `public/js/season.js` bestimmt den Anlass. Grundlage ist die Uhr des
  Geräts, ein Abend zählt bis 6 Uhr früh. Fasching wird über die Osterformel
  berechnet, das Oktoberfest über die Wiesn-Regel. Die Datei setzt
  `html[data-season]` und baut die stehende Deko in die Flächen, die mit
  `data-deco-top` / `data-deco-foot` markiert sind (Dashboard, TV). Die
  Schneekappen brauchen kein neues Bild: Der Baum-Footer liegt als Maske
  zweimal übereinander, um wenige Pixel versetzt und voneinander abgezogen.
- `public/js/seasonfx.js` (nur TV) zeichnet Schnee, Bläschen, Konfetti und
  Feuerwerk auf zwei Canvas-Flächen in halber Auflösung. Dazu kommt die
  Fledermaus. Die Flächen schlafen, wenn nichts zu zeichnen ist oder der Tab
  versteckt ist.
- Ein Moment übernimmt für 8 s das Fun-Fact-Band, zu Neujahr für 30 s.
  Führungswechsel lösen höchstens alle zwei Minuten einen Moment aus.
- Am Handy steht die Deko still und liegt am Rand. Mit
  `prefers-reduced-motion` gibt es nur stehende Deko, Momente ändern dann nur
  den Text im Band.
- Admin, Einrichtung: Schalter „Saison-Akzente“ (Einstellung `seasonal`,
  Standard an, kommt im State mit). `?jetzt=<Datum/Zeit>` in der Adresse
  stellt zum Ausprobieren die Uhr einer Seite.

**Begründung:** Wunsch des Nutzers. Sommer (Glühwürmchen) ist bewusst
weggelassen. Die Wimpel sind blau-weiß, und das Silvester-Feuerwerk geht nach
Mitternacht hin und wieder weiter. Die Deko kommt ohne Internet und ohne neue
Abhängigkeit aus (SVG, CSS, Canvas). Weil sie nie über Zahlen oder Knöpfen
liegt, stört sie das Zählen nicht.

## D-072 (2026-09-29): Getränke heute mit Vergleich zum eigenen Schnitt

**Entscheidung:** Im Zählen-Tab steht rechts neben der großen Zahl „Getränke
heute“ ein kleines Dreieck mit dem Abstand zum eigenen Schnitt, darunter
„über/unter Ø x · um diese Zeit“ (Entwurf A aus „Getränke heute vs.
Schnitt“).

- Verglichen wird mit dem **Schnitt der früheren Abende bis zur gleichen
  Uhrzeit**, nicht mit ganzen Abenden. Sonst stünde früh am Abend fast immer
  ein ▼.
- Der Server liefert in `/api/players/:id/stats` das Feld `pace`:
  `{ nights, slots }`, 96 Viertelstunden ab 06:00. Jeder Wert ist der
  Schnitt der Getränke bis zum Ende dieser Viertelstunde, nur über Abende,
  an denen die Person dabei war. Der laufende Abend zählt nicht mit.
- Das Handy liest den Wert für jetzt ab (innerhalb der Viertelstunde linear)
  und rechnet jede Minute neu, weil der Vergleichswert auch ohne neues
  Getränk mit der Uhr wandert.
- ▲ in Gold, ▼ in Grau (weniger trinken ist kein Fehler). Liegt der Abstand
  unter 0,5, steht „±0 · genau im Ø“. Vor dem ersten Getränk des Abends gibt
  es kein ▼, nur den Schnitt. Ohne frühere Abende steht „erster Abend“.
- `?jetzt=` stellt auch diese Uhr (wie bei den Saison-Akzenten).

**Begründung:** Wunsch des Nutzers. Die Uhrzeit ist leichter zu verstehen
als „seit dem ersten Getränk“. Dafür zieht ein spät begonnener Abend den
Schnitt für frühe Uhrzeiten etwas nach unten.

## D-073 (2026-09-29): Getränke-Protokoll im Admin

**Entscheidung:** Der Admin bekommt neben „Konten“ einen Bereich
**Protokoll** (Entwurf „Admin: Getränke-Protokoll“). Er zeigt jedes
gezählte Getränk eines Abends einzeln, das neueste zuerst und nach Stunde
gruppiert. Filtern lässt sich nach Konto und Sorte, zwischen den Abenden
blättert man mit ‹ ›.

- **Bearbeiten:** Konto, Sorte und Uhrzeit. Die Uhrzeit muss im selben Abend
  bleiben und darf nicht in der Zukunft liegen. Ein Hinweis sagt vorher, was
  mit den Zählern passiert („Das Bier wandert von Flo zu Lena.“).
- **Löschen** mit Rückgängig. Rückgängig trägt denselben Eintrag mit
  derselben Uhrzeit wieder ein. **Nachtragen** legt ein Getränk mit Uhrzeit
  an.
- Die **All-Time-Zähler ziehen immer mit**, wie bei der Archiv-Korrektur,
  damit Rangliste, Archiv und Rekorde zusammenpassen. Korrekturen über +/−
  in der Kontenliste landen weiterhin nicht im Log (D-005) und erscheinen
  deshalb nicht im Protokoll.
- **Doppelt getippt?** Ein Konto hat dasselbe Getränk innerhalb von 5 s
  zweimal gezählt. Die Zeilen tragen den Chip „Doppelt?“, die Seitenleiste
  listet die Paare mit „Einen löschen“ (entfernt den zweiten Eintrag).
  Daneben stehen die Zahlen des Abends und die Getränke je Stunde.
- Lesen: `GET /<bereich>/api/log/<tag>`, nur mit Admin-Token. Ändern per
  WebSocket: `editLog`, `deleteLog`, `addLog`, nur für Admins, vom Server
  geprüft. Die Liste lädt bei jedem neuen Stand neu. Eine offene Bearbeitung
  bleibt dabei stehen.
- Aufbau: Breit schaltet über der Hauptspalte ein Umschalter
  *Konten | Protokoll*, und die Seitenleiste zeigt im Protokoll oben die
  Zahlen und Doppeltipps. Schmal wird der Umschalter oben vierteilig
  (*Konten | Protokoll | TV | Mehr*). Am Handy öffnet ein Tipp auf die Zeile
  ein Blatt von unten mit Löschen/Speichern. Die Zahlen des Abends fallen
  dort weg, die Doppeltipps stehen nur da, wenn es welche gibt. Im ⋯-Menü
  eines Kontos führt „Im Protokoll ansehen“ direkt zu dessen Getränken von
  heute.

**Begründung:** Wunsch des Nutzers. Bisher ließ sich ein Fehltipp nur als
„−1 an diesem Abend“ korrigieren. Welches Getränk das war (Uhrzeit, Sorte),
war nicht zu sehen, und ein falsch zugeordnetes Getränk ließ sich nicht
umhängen.

## D-074 (2026-09-29): Protokoll-Zeilen mit gefüllten Pillen

**Entscheidung:** Im Getränke-Protokoll (D-073) ist die Getränke-Pille voll
in der Getränkefarbe gefüllt. Die Schrift steht im Kontrast darauf: dunkel
auf Bier und Mische, hell auf Shot. Das ist dieselbe Paarung wie bei den
Getränkefeldern am Handy und wie bei der Gesamt-Pille auf dem TV (D-051).
Bearbeiten und Löschen sind gefüllte Kreise im selben Stil: Bearbeiten in
der Akzentfarbe, Löschen in Brick. „Doppelt?“ steht als goldener Hinweis
ohne Pille drumherum. Am Handy bleibt rechts der schlichte Pfeil.

**Begründung:** Wunsch des Nutzers. Die gefüllten Pillen sind auf einen
Blick zu unterscheiden, die Umriss-Pillen wirkten neben den Zeilen blass.

## D-075 (2026-09-29): Schnitt-Vergleich im Admin abschaltbar

**Entscheidung:** Admin, Einrichtung: neuer Schalter **Schnitt-Vergleich**.
Er blendet ▲/▼ und den Abstand neben „Getränke heute“ (D-072) auf allen
Handys des Bereichs ein oder aus. Die Einstellung heißt `pace_compare`
(Standard an) und kommt im State als `paceCompare`. Geschaltet wird per
WebSocket mit `setPaceCompare` (nur Admin). Die Handys übernehmen die
Änderung sofort, ohne neu zu laden.

**Begründung:** Wunsch des Nutzers. Der Vergleich soll sich pro Bereich
abschalten lassen, z. B. wenn er an einem Abend nicht passt. Umgesetzt ist
er wie der Schalter für die Saison-Akzente (D-071).

## D-076 (2026-09-29): Archiv ohne eigene Korrektur, dafür Sprung ins Protokoll

**Entscheidung:** Die ±1-Korrektur je Spieler und Getränk im Abend-Archiv
entfällt. Getränke eines Abends korrigiert der Admin nur noch im
Getränke-Protokoll (D-073). Dort sieht er jedes Getränk einzeln und kann es
umhängen, löschen oder nachtragen.

- Auf den Archiv-Karten stehen für Admins jetzt **Benennen** (kleines
  Fenster nur mit dem Namen des Abends, D-028) und **Protokoll**. Protokoll
  öffnet `admin?protokoll=<tag>`, der Admin landet direkt im Protokoll
  dieses Abends.
- Server: WebSocket-Nachricht `adjustArchive`, `db.adjustArchiveDrink` und
  die beiden nur dafür genutzten Abfragen sind entfernt.
  `GET /api/archive/:day` bleibt, weil Story-Grafik und TV-Archiv ihn
  brauchen.

**Begründung:** Wunsch des Nutzers. Zwei Wege zur selben Korrektur wären
doppelt. Die alte Korrektur arbeitete blind: „−1“ nahm das jüngste Getränk
der Sorte, „+1“ legte eines mit geschätzter Uhrzeit an.

## D-077 (2026-09-29): Abend-Name im Archiv ist der Knopf zum Benennen

**Entscheidung:** Der eigene Knopf „Benennen“ auf der Archiv-Karte
(D-076) entfällt. Für Admins ist der Name unter dem Datum selbst anklickbar
und trägt einen kleinen Stift. Ohne Namen steht dort leise „Namen geben“.
Ein Tipp öffnet wie bisher das kleine Fenster für den Namen. Ohne
Admin-Login bleibt der Name reiner Text. Der TV-Knopf heißt kurz
„Auf den TV“ (bzw. „✓ Auf dem TV“), damit die Knopfreihe am Handy nicht
umbricht.

**Begründung:** Wunsch des Nutzers. Mit vier Knöpfen brachen die
Beschriftungen am Handy auf zwei Zeilen um. Der Name sitzt ohnehin dort,
wo man ihn ändern will.

## D-078 (2026-09-29): Komplett-Redesign im Stil von landonorris.com

**Entscheidung:** Die ganze App (Start, Anmeldung, Onboarding, Dashboard,
TV, Admin, Abend-Archiv, Story-Bild, Saison-Akzente) folgt jetzt der
Designsprache von landonorris.com. Verbindliche Design-Quelle ist
[docs/DESIGN-LANDO.md](docs/DESIGN-LANDO.md); sie löst die Claude-Design-v3-
Vorlage (PLAN.md §8) ab.

- **Palette 1:1 von der Seite:** Partykeller = Dunkelgrün `#282C20`,
  Off-White `#F4F4ED`, Neon-Lime `#D2FF00` (Schrift-Akzent Lime-Off
  `#B2C73A`); Youngstars = Fast-Schwarz mit Navy-Stich `#0F131C` und Landos
  Orange `#FF6B00`. Getränke: Bier = Akzent, Shots = Zweitakzent (Orange bzw.
  Lime), Mischen = Creme. Die alten Token-Namen bleiben als Aliase, weil
  Canvas-Code sie per `getComputedStyle` liest.
- **Schriften:** Mona Sans (variabel, OFL) für Versal-Headlines, Text und
  Zahlen; Instrument Serif (OFL) als freie Entsprechung zu Landos
  kommerzieller „Brier" für Akzentwörter. Beide lokal in
  `public/assets/fonts/` (Download von Google Fonts mit Freigabe des Nutzers).
  Bitter und Work Sans werden nicht mehr verwendet.
- **Signaturelemente:** Höhenlinien (`assets/topo.svg`, `topo-portrait.svg`,
  einmalig erzeugt mit `tools/gen-topo.mjs`, als CSS-Maske eingefärbt),
  Kerben-Karten wie die „Helmets Hall of Fame" (`notch()` in
  `public/js/lando.js`, `clip-path: path()` auf einer Hintergrund-Ebene, das
  Etikett steht frei in der Stufe), selbstzeichnende Handschrift-Kringel,
  Lime-Knöpfe mit fliegendem Pfeil, Vollbild-Menü, Wort-Masken-Einblendung,
  Hintergrundwechsel beim Scrollen, Wortmarke „PARTY / KELLER" bzw.
  „YOUNG / STARS" mit den Vereinslogos als Emblem, Seitenwechsel als Vorhang.
- **Bewusst weggelassen:** Glas-Optik (`backdrop-filter`), Zapfen-Wasserzeichen
  und Baum-Footer (ersetzt durch die Höhenlinien), Fotos, WebGL/3D.
- **Saison-Akzente bleiben** (Datumslogik, Admin-Schalter, TV-Momente), sind
  aber flach und in der Lando-Palette neu gezeichnet. Ohne Bäume entfallen die
  Schneekappen; beide Bereiche bekommen die Schneewehe auf der Unterkante.
- **Zahlen mit proportionalen Ziffern** (`.num`): Die Tabellenziffern von
  Mona Sans haben eine durchgestrichene Null und eine „1" mit Fuß und wirken
  wie eine Code-Schrift — landonorris.com setzt Zahlen ebenfalls
  proportional. Die frühere Regel „Zähler mit `tabular-nums`" entfällt;
  Spalten richten sich über feste Breiten und rechtsbündigen Satz aus,
  tickende Anzeigen (Silvester-Countdown) über eine Mindestbreite.
- Keine neue npm-Abhängigkeit, kein Build-Step; alles ist statisches
  CSS/SVG/Vanilla-JS und läuft offline.

**Begründung:** Wunsch des Nutzers: Stil der Seite vollständig übernehmen,
inklusive hochwertigem Design, Animationen und interaktiven Elementen; der
Aufbau durfte frei geändert werden, alle Features bleiben erhalten. Die
Entwürfe aus docs/INSPIRATION-LANDO.md (L1 Kringel bei Führungswechsel,
L2 Kennzahlen-Headline, L3 Hall of Fame, L5 Höhenlinien) gehen darin auf.
Die dort genannten Vorbehalte (Lime als fremde Markenfarbe, Cursor-Effekte)
sind mit diesem ausdrücklichen Wunsch überholt; Cursor-Effekte gibt es nur
auf Geräten mit Maus, die Zählseite bleibt ohne Umweg bedienbar.

## D-079 (2026-10-01): Keine Erklär- und Fülltexte in der Oberfläche

**Entscheidung:** Die erklärenden Untertitel, Hinweiszeilen und Taglines
sind aus allen Seiten entfernt. Dazu gehören „Läuft lokal im Keller-WLAN“
und „ganz ohne Internet“ in Kopf- und Fußzeilen, Lead-Sätze unter
Überschriften (Start, Anmeldung, Registrieren, Admin-Login, Archiv),
Erklärsätze in Dialogen und Einstellungen (Abend benennen, PIN setzen,
Doppelt getippt, Saison-Akzente, Schnitt-Vergleich) und der
Änderungs-Hinweis im Protokoll-Editor. Dynamische Status-Hinweise zeigen
nur noch den Zustand („Aktiv“, „Aus“) statt eines Erklärsatzes.
Stehen bleiben Überschriften, Labels, Knöpfe, Zahlen und Daten,
Fehlermeldungen, Leer-Zustände, Marke und Copyright, die Warnungen vor
Zurücksetzen und Wiederherstellen (Danger Zone) und die Schritt-Texte des
Onboardings, weil das Onboarding selbst die Erklärung ist.
Neue Seiten und Komponenten kommen ohne solche Texte aus.

**Begründung:** Wunsch des Nutzers: Die Texte wirken wie KI-Beschriftungen
und sind unnötig. Die Bedienung erschließt sich aus der Oberfläche.

## D-080 (2026-10-14): Nur noch ein Bereich — Partykeller in Youngstars-Farben

**Entscheidung:** Die beiden Bereiche aus D-019 werden zusammengeführt. Es
gibt nur noch den Partykeller (`/partykeller/*`), aber in der bisherigen
Youngstars-Palette: Fast-Schwarz mit Navy-Stich, Orange als Akzent (Bier,
Knöpfe, Platz 1), Lime als Zweitakzent (Shots). Name, Wortmarke „Party
Keller“, Logo, Icons und Getränke-Reihenfolge (Bier, Shots, Mischen) bleiben
die des Partykellers.

- `/` leitet direkt auf `/partykeller/`, die Auswahlseite `start.html` ist
  entfernt. Alte `/youngstars/…`-Links (QR-Codes, Lesezeichen, installierte
  PWA) leiten auf denselben Pfad unter `/partykeller/`.
- Server: nur noch ein Eintrag in `server/areas.js`; `YOUNGSTARS_ADMIN_PASSWORD`
  und `YOUNGSTARS_DB_PATH` entfallen. Die Bereichs-Struktur (Router, WS,
  bereichsgestempelte Tokens) bleibt, damit sich an API und Logins nichts
  ändert; Youngstars-Tokens und -Sicherungen werden abgewiesen.
- Daten werden **nicht** zusammengeführt: `data/youngstars.db` bleibt
  unangetastet liegen, wird aber nicht mehr gelesen.
- Frontend: `html[data-area]`, `.only-pk`/`.only-ys`, `.area-ys`, das
  Youngstars-Logo, die Youngstars-Icons und das Youngstars-Manifest sind
  entfernt; die Tokens in `:root`/`.area-pk` tragen die Youngstars-Werte.

**Begründung:** Wunsch des Nutzers: nur noch den Partykeller-Bereich, aber
mit den Youngstars-Farben.

## D-081 (2026-10-14): Höhenlinien-Leuchten als Strömung wie auf landonorris.com

**Entscheidung:** Das Spotlight auf den Höhenlinien ist kein fester
Lichtkreis unter dem Cursor mehr, sondern eine kleine Strömungssimulation
(Stable Fluids) in `public/js/topo-fluid.js`, wie sie landonorris.com nutzt:

- Mausbewegungen geben Schub und „Tinte“ in ein grobes Strömungsfeld
  (112 Zellen auf der kurzen Seite, Tinte 320). Die Maus wird gedämpft
  verfolgt, Tupfer werden entlang der Strecke verteilt; schnelle Bewegungen
  färben stärker. Die Tinte fließt nach, verwirbelt leicht und verblasst
  in gut einer Sekunde.
- Wo Tinte steht, leuchten die Linien in `--accent` mit weichem Lichthof
  und einem Hauch Fläche; die Strömung verbiegt die Linien leicht.
- Ohne Mausbewegung zieht nach drei Sekunden ein schwacher Schimmer auf
  einer langsamen Bahn über die Linien.
- Die Linien sind dieselben SVGs wie beim CSS-Hintergrund, im Canvas als
  Textur mit „cover“ gezeichnet; der CSS-Hintergrund tritt dafür zurück
  (`html.topo-gl`). Linien- und Leuchtfarbe kommen aus `--topo-line` und
  `--accent` und gleiten beim Flächenwechsel (Archiv) mit.
- Reines WebGL2 ohne Bibliothek, kein Build-Step, offline. Nur auf Geräten
  mit Maus und ohne „Bewegung reduzieren“; ohne WebGL2/Float-Rendering oder
  bei Kontextverlust bleibt der bisherige CSS-Lichtkreis. Handys und der TV
  sind nicht betroffen. Die Simulation pausiert in Hintergrund-Tabs.

**Begründung:** Wunsch des Nutzers: Der Topographie-Effekt soll wie auf
landonorris.com wirken, mit einem Leuchtbereich, der dynamischer ist, statt
nur unter der Maus zu sitzen.

## D-083 (2026-10-14): Übergänge auch beim Schließen und Umschalten

**Entscheidung:** Alles, was animiert erscheint, verschwindet auch animiert,
und Ansichtswechsel innerhalb einer Seite gleiten statt umzuspringen.

- `lando.js` bekommt `leave()`/`enter()`: `.is-leaving` spielt eine
  Abgangs-Animation (gemeinsame Keyframes in theme.css), erst danach wird
  versteckt bzw. entfernt; ein erneutes Öffnen bricht den Abgang ab.
  Genutzt für Ranglisten-Blatt und Fehlermeldung im Dashboard, alle Admin-
  Dialoge, das Protokoll-Blatt und die Admin-Meldungen, den Benennen-Dialog
  und die Meldung im Archiv sowie den Fehlerbanner der Anmeldung.
- Anmeldung: Die PIN-Zeile klappt in der Liste auf und zu (Höhe gleitet mit),
  statt die Liste neu aufzubauen; ein zweiter Tipp schließt sie wieder.
- `swapView()` nutzt same-document View Transitions: Onboarding-Schritte und
  Admin-Bereiche (Konten/Protokoll/TV/Mehr) gleiten in Richtung des
  Umschalters, die Admin-Anmeldung fährt als Vorhang in die Zentrale über.
  Ohne View-Transition-Unterstützung wird einfach umgeschaltet.
- Heute/All-Time im Profil und im Ranglisten-Blatt: der Inhalt gleitet kurz
  von der Seite des Balkens herein (`replay()`).
- „Bewegung reduzieren" schaltet alles ab; keine neue Bibliothek.

**Begründung:** Wunsch des Nutzers: Übergänge zwischen den Bereichen fehlten
an einigen Stellen — Schließen war bisher überall ein harter Schnitt.

## D-084 (2026-10-14): Seitenwechsel als Vorhang statt View-Transition-Wisch

**Entscheidung:** Wechsel zwischen den Seiten (Anmeldung, Dashboard, Archiv,
Admin, Onboarding) laufen über einen eigenen Vorhang im Stil von
landonorris.com statt über den bisherigen View-Transition-Wisch:

- Beim Klick auf einen Link zu einer anderen Seite (oder `go(url)` im
  Skript) steigt eine Akzentfläche von unten über die alte Seite, eine
  dunkle Fläche folgt und deckt ab (≈ 0,5 s), dann wird navigiert.
- Die neue Seite startet verdeckt: ein Inline-Skript im `<head>` liest das
  Flag aus `sessionStorage` und setzt `html.curtain-in`. Die dunkle Fläche
  zieht nach oben ab, die Akzentfläche hinterher; die Einblendungen der
  Seite warten über `--page-delay` (300 ms), bis sie frei sind. Beim
  Ankommen fängt der Vorhang keine Tipps ab.
- Die Flächen sind `html::before`/`html::after` — kein zusätzliches Markup.
  Die View Transition wird bei diesen Wechseln übersprungen (`pageswap`).
- Anmelden → Dashboard behält das Gleiten von Namenskreis und Name (D-068);
  Zurück/Vor im Browser nutzt weiter die View Transition, eine aus dem
  bfcache zurückkehrende Seite hebt ihren Vorhang wieder.
- „Bewegung reduzieren": kein Vorhang, sofortige Navigation.

**Begründung:** Wunsch des Nutzers: beim Wechsel zwischen den Bereichen gab
es oft harte Schnitte. Der Wisch dunkel über dunkel war kaum sichtbar, die
neue Seite füllte sich erst danach, und Browser ohne Cross-Document View
Transitions (Firefox, ältere Safari) schnitten hart.

## D-085 (2026-10-14): Seitenwechsel als Morph, Vorhang nur noch als Ersatz

**Entscheidung:** Wechsel zwischen den Seiten laufen als Shared-Element-
Morph per View Transition: Elemente, die auf beiden Seiten vorkommen,
gleiten an ihren neuen Platz und wachsen bzw. schrumpfen dabei; die Seite
selbst blendet nur weich über (alt sinkt leicht weg, neu steigt auf).

- Immer: Wortmarke und Menüknopf der Kopfleiste, das Logo.
- Anmeldung → Dashboard: Namenskreis und Name gleiten in den Kopf (D-068).
  Neu auch zurück: „Konto wechseln" und „Abmelden" lassen beide in die
  eigene Zeile der Anmeldeliste zurückgleiten. Die Liste steht dafür im
  ersten Bild (Inline-Skript aus dem Zwischenspeicher `pk_players_cache`,
  das Modul übernimmt nach dem Übergang).
- „Admin" im Menü (Anmeldung, Archiv) gleitet ins Titelwort „Admin" der
  Admin-Seite; Admin-Anmeldung → Zentrale: Titelwort, Admin-Chip und
  Wortmarke gleiten (same-document, `swapView` mit `dir: 'morph'`),
  Abmelden zurück ebenso.
- „Konto anlegen" gleitet in „Weiter" des Onboardings; vom ersten
  Onboarding-Schritt aus gleiten die Probier-Getränkekarten an den Platz der
  echten im Dashboard und der Name aus der Begrüßung in den Kopf.
- Paare, die erst ein Klick festlegt, laufen über einen Schlüssel in
  `sessionStorage` (`data-morph` am Link bzw. `go(url, { morph })`), den das
  Kopf-Skript der Zielseite vor dem ersten Bild als `html[data-morph]` setzt
  und nach dem Übergang wieder löst.
- Der Vorhang aus D-084 bleibt nur für Browser ohne seitenübergreifende
  View Transitions (Firefox); dort gibt es keine Morphs.

**Begründung:** Wunsch des Nutzers: Übergänge eher als Morph wie beim
Anmelden (Name fährt an seine Position im Profil) statt eines Vorhangs, der
die Seiten verdeckt.

## D-086 (2026-10-14): Seitenvorhang entfernt

**Entscheidung:** Der Vorhang aus D-084 (orange und dunkle Fläche, die beim
Seitenwechsel über die Seite steigen) ist vollständig entfernt — auch als
Ersatz für Browser ohne seitenübergreifende View Transitions. Seitenwechsel
laufen nur noch als Morph (D-085); wo der Browser das nicht kann, wird
einfach umgeschaltet. `go()` navigiert direkt, `initPageTransitions()`
legt nur noch den Morph-Schlüssel von Links mit `data-morph` ab; Styles,
Kopf-Skript-Teil und `--page-delay` sind weg.

**Begründung:** Wunsch des Nutzers: die orangen Blöcke beim Seitenwechsel
sollen weg.

## D-087 (2026-10-14): Morphs auch in Firefox, Ansichtswechsel ohne View Transitions

**Entscheidung:**

- Ansichtswechsel innerhalb einer Seite (`swapView`: Onboarding-Schritte,
  Admin-Bereiche, Admin-Login) laufen per Web Animations statt
  `document.startViewTransition`: Die alte Ansicht gleitet hinaus, danach
  die neue herein; bei `morph` gleiten benannte Elemente (FLIP), der Rest
  blendet aus und ein. Firefox 157 kann zwar View Transitions innerhalb
  einer Seite, zeigte dabei aber leere Bilder (Flackern im Onboarding).
- Firefox kann keine seitenübergreifenden View Transitions. Dort laufen die
  Morph-Paare aus D-085 per Skript: `go()` bzw. der Link-Klick merkt sich
  die Positionen aller Elemente mit `view-transition-name` (`pk-flip` in
  `sessionStorage`) und blendet den Rest in 0,2 s aus; das Kopf-Skript der
  neuen Seite setzt `html[data-flip]` (Seite unsichtbar), `lando.js` legt
  die Gegenstücke an die alten Positionen, macht die Seite im selben Bild
  sichtbar und lässt sie gleiten, der Rest blendet ein.
- Ein Morph-Link im Vollbild-Menü hält das Menü offen, bis navigiert ist.
- Chrome/Safari behalten die seitenübergreifende View Transition.

**Begründung:** Wunsch des Nutzers: in Firefox fehlte die Hälfte der
Übergänge und das Onboarding flackerte.

## D-088 (2026-10-14): SV-Partykeller-Unterschrift statt Zackenlinie

**Entscheidung:** Die Unterschrift in den Fußkarten (Profil im Dashboard,
Abend-Archiv) und die Form `signature` in `lando.js` sind eine gestische
„SV Partykeller"-Unterschrift nach dem Vorbild von Landos Unterschrift: ein
durchgehender Zug, steil geneigt, große Anfangsbuchstaben, „artykeller" als
enges, unregelmäßiges Bündel, lange Schleife zurück unter das „S" und quer
durch das Ganze; nur der t-Strich setzt ab und wird zuletzt gezeichnet.
Aussehen geht vor Lesbarkeit. Die Pfade sind fest berechnet (Neigung und
Drehung eingerechnet), Seitenverhältnis 268 : 141, daher ohne
`preserveAspectRatio="none"`. Fußkarte im Profil unten etwas höher, damit
die Unterschrift nicht in den Titel ragt; Zeichendauer 2,2 s.

**Begründung:** Wunsch des Nutzers: statt der abstrakten Linie ein
stilisierter Schriftzug, „mehr Unterschrift, weniger normale Buchstaben",
aber nicht zu perfekt (Entwurf 1 von 3 Rauheitsstufen gewählt).

## D-089 (2026-10-14): Höhenlinien-Leuchten auch auf dem Handy

**Entscheidung:** Ohne Maus (Touch-Geräte) läuft die Strömungssimulation
aus D-081 jetzt ebenfalls, in einem Sparmodus:

- Alle 7–13 s zieht ein unsichtbarer Finger in einem Bogen (Bézier, von
  einer Bildschirmseite zur gegenüberliegenden, 2,6–3,6 s, langsam an und
  aus) über das Bild und rührt die Linien an wie die Maus; der erste Wischer
  kommt gut eine Sekunde nach dem Laden.
- Ein Tipp lässt die Linien an der Stelle kurz aufleuchten.
- Dazwischen schläft die Simulation (kein Bild pro Frame, kein
  Eigen-Schimmer); sie wacht für Wischer, Tipps, Größen- und
  Farbwechsel auf und läuft gut 4 s nach, bis die Tinte verblasst ist.
- Kleinere Felder auf dem Handy (Strömung 80, Tinte 224 Zellen, 10
  Druck-Iterationen, höchstens 2,5 Mio. Pixel).
- Rendern in Halbfloat-Texturen wird auch mit `EXT_color_buffer_half_float`
  akzeptiert (manche Handys bieten nur das).
- Mit `prefers-reduced-motion` bleibt alles still; ohne WebGL2 bleiben die
  stillen CSS-Linien. Am Desktop ändert sich nichts.

**Begründung:** Wunsch des Nutzers: gezählt wird am Handy, dort fehlte der
Maus-Effekt ganz; er soll ab und zu von selbst über den Hintergrund gehen.
Der Schlafmodus schont den Akku über einen langen Abend.

## D-090 (2026-10-14): Dashboard-Fußzeile nur noch mit „Abmelden"

**Entscheidung:** Unter dem Dashboard steht nur noch ein Knopf,
„Abmelden" (mit Zurück-Pfeil, beendet die Sitzung und gleitet in die
Anmeldeliste). „Abend-Archiv" und „Konto wechseln" sind dort entfallen; das
Archiv bleibt über das Menü erreichbar. Das Menü selbst ist unverändert.

**Begründung:** Wunsch des Nutzers: unten reicht ein Knopf; das Archiv
erreicht man oben, „Konto wechseln" und „Abmelden" führen beide zur
Anmeldung. „Abmelden" bleibt, weil es die Sitzung tatsächlich beendet
(geteilte Handys im Keller).

## D-091 (2026-10-14): Handy-Durchgang über alle Seiten (außer TV)

**Entscheidung:** Alle Seiten wurden in Handygröße (375 × 812) ganzseitig
geprüft und an diesen Stellen angepasst:
- **Abend-Archiv, Kopf:** Auf dem Handy steht das Logo oben unter der
  Kopfzeile (wie auf der Anmeldung); „Letzter Abend" ist dort eine Leiste
  über die volle Breite (Wochentag + Datum links, Lorbeer + Sieger rechts)
  statt eines schmalen Kärtchens neben dem Logo. Desktop unverändert.
- **Abend-Archiv, Karten:** Story-/CSV-Knöpfe mit dem Pfeil-Symbol der Seite
  statt „⬇" (das Zeichen fehlt in Mona Sans und erschien als Strich). Der
  Stundenverlauf erscheint erst ab zwei Stunden; eine einzelne Stunde ergab
  nur einen flachen Strich mit einem breiten Block.
- **Dashboard:** Der Lorbeer um den Namenskreis klebt nicht mehr am
  Bildschirmrand; in „Vor dir / Hinter dir" bricht der Abstand rechts um,
  damit der Name nicht abgeschnitten wird.
- **Menü:** Nur der aktuelle Punkt trägt den Strich, auch bei reduzierter
  Bewegung (dort standen im Dashboard-Menü sonst „Zählen" und „Profil"
  durchgestrichen).

**Begründung:** Wunsch des Nutzers: das Archiv sah auf dem Handy nicht gut
aus, alle Bereiche sollen dort sauber sitzen. Anmeldung, Onboarding und
Admin (alle Reiter) waren ohne Befund.

## D-092 (2026-10-14): Archiv-Kopf auf dem Handy ohne Leere; Menü ohne „Konto wechseln"

**Entscheidung:**
- Der Archiv-Kopf ist auf dem Handy nicht mehr bildschirmhoch. Er beginnt
  direkt unter der Kopfzeile: Emblem, Kennzahlen-Satz, darunter
  „Letzter Abend" als Datenleiste zwischen Haarlinien (links Wochentag und
  Datum, rechts „Abendsieger" mit Lorbeer und Name · Getränke), darunter
  Hall-of-Fame-Knopf und Logo in einer Reihe, dann das Laufband. Das löst die
  Handy-Variante aus D-091 ab (Logo oben, umrandete Leiste). Am Desktop
  bleibt alles wie bisher; dafür sind Knopf, Logo und Kärtchen jetzt
  Geschwister in einem Raster mit Bereichsnamen.
- Im Dashboard-Menü entfällt „Konto wechseln"; „Abmelden" führt ebenfalls
  zur Anmeldung und beendet dabei die Sitzung.

**Begründung:** Wunsch des Nutzers: die Variante aus D-091 sah auf dem
Handy nicht schön aus (große Leere über dem Satz, verloren wirkendes Logo,
schlichte Kastenleiste). „Konto wechseln" und „Abmelden" führten an
dieselbe Stelle (siehe D-090).

## D-093 (2026-10-14): Abzeichen als Kerbenkarten, TV-Timing-Tower, Kaltstart-Bild

Umsetzung der Ideen L9, L18 und L15 aus
[docs/INSPIRATION-LANDO-2.md](docs/INSPIRATION-LANDO-2.md).

**Entscheidung:**
- **Abzeichen (L9):** Im Profil und im Beispiel-Profil des Onboardings stehen
  die Abzeichen als Umriss-Kerbenkarten wie die Helm-Karten auf
  landonorris.com: eigenes Strich-Icon (Medaille, Krone, Krug mit „1“, Mond,
  Blitz, Cocktailglas) statt Emoji, Name darunter, Anzahl in der Kerbe.
  Drei Zustände: grau = noch nie, Akzent-Linie (`.is-won`) = schon erreicht,
  gefüllt (`.is-today`) = heute erreicht. Die Stile stehen in theme.css,
  `.earned` entfällt.
- **TV-Timing-Tower (L18):** Neue Spalte „Abstand“ (Getränke hinter dem
  Vordermann), auf dem Podest neben dem Namen. Gewinnt oder verliert jemand
  Plätze, steht 10 s lang ▲n (grün) bzw. ▼n (rot) neben dem Namen — nur
  innerhalb derselben Ansicht, nicht beim ersten Stand, nicht beim
  Moduswechsel, nicht im Archiv. In den Live-Ansichten bekommt, wer heute
  mehr hat als an seinem besten früheren Abend, das Etikett „Bestwert“
  (grün), wer mehr hat als je eine Person an einem Abend (ohne
  Ausgeblendete), „Hausrekord“ (lila); in „Heute“ färbt sich zusätzlich die
  Gesamt-Pille. Grün/Lila sind die Sektorfarben der F1-Grafik. Der Server
  liefert dafür `players[].bestNight` und `houseBestNight` im State, berechnet
  aus dem Historien-Cache (nur vergangene Abende, keine zusätzliche Abfrage
  pro Getränk). Neue Tokens `--gain`, `--loss`, `--pb`, `--record` (+ `-ink`).
- **Kaltstart-Bild (L15):** Beim ersten Öffnen in einem Tab (PWA-Start, neuer
  Tab; Merker `pk-booted` in sessionStorage) zeigen Anmeldung, Dashboard,
  Archiv und Onboarding eine Fläche in Akzentfarbe. Darauf steht groß die
  Wortmarke „Party / Keller“, ihre Zeilen gleiten aus einer Maske; sobald die
  Seite geladen ist (frühestens 0,8 s, spätestens 1,4 s), holt sie kurz aus,
  fliegt mit leichter Drehung an ihren Platz in der Kopfleiste, nimmt dort
  deren Farbe an und rastet mit einem Nachfedern ein, während die Fläche
  dicht dahinter nach oben wegwischt. Einblendungen der Seite starten erst
  dann. Nie bei Seitenwechseln (Morph), nie mit „Bewegung reduzieren“; TV und
  Admin setzen nur den Merker. Fehlt die Wortmarke (z. B. Dashboard ohne
  Anmeldung), wischt nur die Fläche weg.

**Begründung:** Wunsch des Nutzers: L9, L15 und L18 umsetzen; für das
Startbild ausdrücklich die Wortmarke, die mit einer Animation an ihren
Platz fährt.

## D-094 (2026-10-15): Abend-Archiv als 3D-Register statt Kartenraster

**Entscheidung:** Die Abend-Karten im Archiv („Alle Abende") stehen nicht mehr
in einem 1–3-spaltigen Raster, sondern in einem seitlich blätterbaren
Register über die volle Breite:
- Gescrollt wird **nativ** (`overflow-x` mit `scroll-snap`), damit Wischen,
  Trackpad und Schwung auf dem Handy wie gewohnt funktionieren. JS liest nur
  die Position und setzt pro Karte `transform`/`opacity` (rAF): Seitenkarten
  drehen sich wie auf einer Trommel weg, rücken zusammen und nach hinten.
- Gedreht wird eine **innere Ebene** (`.night-plate`), nicht die
  Einrast-Hülle (`.night-slide`): Chrome misst Einrastpunkte an der
  transformierten Box, sonst springt das Register zurück.
- Maus: Ziehen mit Schwung (Snap während des Ziehens aus), Klick auf eine
  Seitenkarte holt sie nach vorn, die vordere Karte neigt sich leicht zur
  Maus. Tastatur: Pfeile, Pos1/Ende; Tab in eine Seitenkarte holt sie nach vorn.
- Darunter Zähler („03 / 15"), klickbarer Fortschrittsbalken, Vor/Zurück.
- Beim ersten Erscheinen fächert sich ein Kartenstapel zum Register auf.
- Die Blöcke aus D-042 bleiben: der nächste Block wird automatisch
  nachgezeichnet, sobald man sich dem Ende nähert („Ältere laden" entfällt).
- Mit „Bewegung reduzieren" bleibt es ein flaches Karussell ohne 3D.

**Begründung:** Wunsch des Nutzers: Die Abende nahmen untereinander sehr viel
Platz ein; gewünscht war ein seitlich scrollbares Register, das sich
hochwertig und dynamisch in 3D durchblättern lässt.

## D-095 (2026-10-15): Echo-Zahl, Namens-Plakat, Jahresrückblick, Meilenstein-Bild (L20, L21, L23, L24)

**Entscheidung:** Vier Ideen aus [docs/INSPIRATION-3.md](docs/INSPIRATION-3.md)
sind umgesetzt:
- **L20 Echo-Zahl (Dashboard):** Steigt eine Heute-Zahl auf einer
  Getränkekarte, rutscht der alte Stand als Umriss nach unten weg und
  verblasst (rein dekorativ, `pointer-events: none`, nicht bei „Bewegung
  reduzieren"). Im Profil steht über den Kennzahlen der All-Time-Stand als
  Riesenzahl, darunter der Stand nach den letzten Abenden, jede Zeile
  blasser. Dafür liefert `/api/players/:id/stats` zusätzlich `recentNights`
  (die letzten vier Abende); das Dashboard rechnet von der aktuellen Summe
  zurück.
- **L21 Namens-Plakat (TV):** Vollbild-Moment mit dem Namen als riesiger
  Umrissschrift, davor Initiale im Lorbeer. Kommt, wenn der Admin einen
  Abend auf den TV legt („Abendsieger"), und live bei einem Führungswechsel
  am Abend („Führt heute", ab drei Getränken, höchstens alle drei Minuten).
- **L23 Jahresrückblick (Dashboard):** Akzentkarte „Dein Jahr 2026" im
  Profil öffnet sechs Story-Seiten im Vollbild (Summe, Lieblingsgetränk,
  bester Abend mit Verlauf, stärkste Stunde, Rivale und Platz, Abschluss).
  Tippen rechts/links blättert, Halten pausiert, jede Seite steht sieben
  Sekunden. Die letzte Seite speichert ein Story-Bild (`buildReviewBlob` in
  `js/story.js`, gleiche Bausteine wie die Abend-Story). Neuer Endpunkt
  `GET /api/players/:id/review?year=` (ohne Jahr das jüngste Jahr mit
  Getränken). „Jahr" heißt Kalenderjahr nach Party-Tagen — die App kennt
  keine Sport-Saison, `season.js` meint nur die Deko-Anlässe.
- **L24 Meilenstein-Bild (TV):** Bei einer runden Hausmarke (alle 500) oder
  einer persönlichen Marke (100er gesamt, 50er je Sorte) klappt ein Raster
  aus „PROST"-Kacheln auf, Pfeile fahren ein, in der Mitte „1000. Getränk im
  Keller" bzw. „100. Getränk von Tom". Grundlage sind die schon vorhandenen
  `funStats.houseMilestone` und `funStats.milestone`; der Server rechnet
  nichts Neues.
- Beide TV-Momente laufen über eine Warteschlange nacheinander, nie beim
  ersten Stand nach dem Laden (ein Neustart des TV wiederholt nichts). Zum
  Ausprobieren: `/tv?moment=plakat` bzw. `/tv?moment=meilenstein`.

**Begründung:** Wunsch des Nutzers nach den Mockups in
docs/inspiration/l20-l27.html: genau diese vier umsetzen.


## D-096 (2026-10-15): Echo-Zahl als Nachhall, Meilenstein-Karte deckend

**Entscheidung:** Korrektur zu D-095.
- **Echo-Zahl (L20):** Die alte Zahl rutscht nicht mehr nach unten weg,
  sondern wächst als Umriss hinter der neuen auf und verblasst. Nach unten
  lag sie fast deckungsgleich hinter der neuen Zahl und wurde an der
  Kartenkante abgeschnitten, das Echo war praktisch unsichtbar.
- **Meilenstein-Bild (L24):** Die Karte in der Mitte springt nur über
  Skalierung auf, ohne Durchsicht; dazu feste Ebenen (Raster 0, Karte und
  Pfeile 3). Halb durchsichtig wirkte sie, als läge sie hinter dem Raster.

**Begründung:** Rückmeldung des Nutzers (Firefox): Echo nicht zu sehen,
Meilenstein-Text hinter dem Raster. In einem echten Firefox 158 (headless,
WebDriver BiDi) gegen die Demo-Instanz geprüft.

## D-097 (2026-10-15): Name dockt in der Kopfleiste an (D3)

**Entscheidung:** Im Dashboard schrumpft der Namensblock (Initiale, Chips,
großer Name) beim Scrollen und verblasst. Sobald er dort wäre, wo oben eine
Leiste liegt, gleitet eine fixierte, schmale Leiste herein: Wortmarke links,
Namens-Pille mit Initiale in der Mitte, Menü rechts. Ein Tipp auf die Pille
scrollt nach oben, die Leiste verschwindet wieder.
- Gemessen wird am unverkleinerten Layout (`#user-view`, `offsetHeight`),
  sonst schaukelt sich die eigene Skalierung auf.
- Angedockt wird, sobald 60 % des Namens hinter der Leistenhöhe lägen — so
  greift es auch auf dem kurzen Zählen-Tab, der kaum scrollt.
- Leiste deckend in der Grundfarbe, kein `backdrop-filter` (Design-Regel).
  Das zweite Menü-Symbol hängt über `data-menu-toggle` am selben Menü.
- Nur rAF-gebündelt beim Scrollen; bei „Bewegung reduzieren" ohne Schrumpfen
  und ohne Gleiten.

**Begründung:** Wunsch des Nutzers aus docs/INSPIRATION-DESIGN.md (D3).
In der Demo-Instanz in Handy- und Desktopbreite sowie in Firefox 158 geprüft.

## D-098 (2026-10-15): Name fliegt in die Kopfleiste (D3, sauberer Übergang)

**Entscheidung:** Korrektur zu D-097. Statt „Namensblock verblasst, dann
gleitet eine zweite Leiste herein" klebt die vorhandene Kopfleiste oben
(`position: sticky`), und Initiale und Name fliegen beim Scrollen stufenlos
in eine Pille in ihrer Mitte: Weg und Größe hängen am Scroll-Fortschritt
(weich beschleunigt), Chips und Lorbeer blenden früh aus, Leistenfläche und
Kapsel blenden mit ein. Bei p = 1 liegen Kreis und Schrift deckungsgleich auf
der Pille (gleiche Schrift, Laufweite und Zeilenhöhe, nur kleiner) und werden
unsichtbar übergeben. Je Bild wird ohne Transform gemessen, dann mit
Transform gesetzt (rAF, nur beim Scrollen). Auf kurzen Seiten reicht das
maximale Scrollen für den ganzen Weg. Bei „Bewegung reduzieren" kein Flug,
nur der Wechsel am Ende.

**Begründung:** Rückmeldung des Nutzers: Übergang soll sauber sein. In der
Demo-Instanz als Video (Hin- und Rückweg) sowie in Firefox 158 geprüft.

## D-099 (2026-10-16): Effekt-Demo im Admin

**Entscheidung:** Neue Karte „Effekt-Demo" im Admin (Reiter *TV*). Jeder
Knopf schickt `demoEffect` über den WebSocket; der Server prüft Admin-Token
und eine feste Effekt-Liste und reicht `{type: 'demo', effect[, season]}` an
alle Clients des Bereichs weiter — nur `tv.html` reagiert darauf. Es ändert
sich nichts an Daten oder Einstellungen, deshalb gibt der Handler `false`
zurück und es folgt kein State-Broadcast. Der TV spielt den Effekt so ab wie
im echten Moment, mit Namen und Zahlen aus dem aktuellen Stand: Namens-Plakat,
Meilenstein-Bild (letzte 500er-Marke des Hauses), Konfetti, Fledermaus,
Bierbläschen (jeweils mit Band-Meldung), Feuerwerk, Schneefall für 20 s,
Silvester-Countdown im Schnelldurchlauf (10 s, dann Feuerwerk und Gruß; an
echtem Silvester gesperrt, dort gehört die Pille dem echten Countdown) und
die Saison-Deko jedes Anlasses für 45 s (`previewSeason` in season.js, gilt
auch bei abgeschalteten Saison-Akzenten, danach wieder das Datum).

**Begründung:** Wunsch des Nutzers, die Effekte vorführen zu können, ohne
auf den Anlass zu warten oder am TV die Adresse (`?jetzt=`, `?moment=`) zu
ändern. Über den Server, damit ein Klick am Handy auf dem echten Fernseher
landet. In der Demo-Instanz (Admin + TV) geprüft, Validierung per
WS-Testskript.

## D-100 (2026-10-16): Effekte beenden, Raketen platzen sicher, Meilenstein-Kacheln in 2D

**Entscheidung:**
- Effekt-Demo bekommt „Alle Effekte beenden" (`demoEffect` mit `effect:
  'clear'`): Der TV räumt laufenden Moment samt Warteschlange, Canvas-Effekte
  (Konfetti, Feuerwerk, Bläschen, Fledermaus), Demo-Schnee, Band-Meldung,
  Demo-Countdown und Saison-Vorschau sofort ab; noch ausstehende Demo-Timer
  werden gelöscht. Stehende Deko nach Datum bleibt.
- Feuerwerk: Eine Rakete platzt am Ziel **oder sobald ihr der Schwung
  ausgeht** (vy > −2). Vorher bremste eine langsame Rakete (vy −12, Bremse
  1,5 %/Bild, Reichweite ≈ 800 px) vor einem hohen Ziel aus und hing für
  immer als Leuchtspur in der Luft — die „Striemen", die besonders im Winter
  (Schnee hält die Zeichenschleife wach) auffielen.
- Meilenstein-Bild: Kacheln klappen per `scaleY` statt `rotateX` mit
  `perspective` auf. Mit der 3D-Variante malte ein Browser die Kacheln über
  die Zahlkarte, trotz z-index.

**Begründung:** Rückmeldungen des Nutzers (Screenshots). In der Demo-Instanz
geprüft: Feuerwerk zeichnet und hinterlässt danach keinen Pixel, „Beenden"
räumt Meilenstein, Konfetti, Countdown und Winter-Vorschau sofort ab.

## D-101 (2026-10-16): Code-Check — Quittungen, Abmelden bei ungültigem Token, Zeitumstellung

**Entscheidung:**
- **Quittungen über den WebSocket:** Eine Nachricht darf ein `ref` (frei
  gewählte Kennung, max. 40 Zeichen) mitschicken. Der Server antwortet dem
  Absender dann mit genau einer Nachricht: `{ type: 'ack', ref }` bei Erfolg
  oder `{ type: 'error', message, ref }`. Der Admin nutzt das für Reset, Neues
  Konto, PIN und Konto löschen (Dialog schließt erst bei Erfolg, Fehler stehen
  im Dialog), das Archiv fürs Benennen eines Abends. Vorher galt beim Reset
  *irgendein* State-Broadcast als Erfolg — trank währenddessen jemand, stand
  „Zurückgesetzt!" da, obwohl das Passwort falsch war.
- **`code: 'auth'`** in Fehlern heißt: Token taugt nicht (ungültig, anderer
  Bereich, Konto gelöscht). Dashboard, Archiv und Admin melden sich dann ab.
  Neu `GET /api/session` (Bearer-Token) — das Dashboard prüft damit beim
  Öffnen, ob das Token noch gilt. Vorher verwarf der Server nach einem neuen
  `TOKEN_SECRET` jeden Tipp still, das Handy blieb scheinbar angemeldet.
- Die **Anmeldeseite leitet angemeldete Handys direkt ins Dashboard** (QR-Code
  am TV gescannt → Zähler statt Namensliste und PIN).
- **Zeitumstellung:** Das Ende eines Party-Tags ist 06:00 des Folgetags als
  Uhrzeit, nicht Start + 24 h; in SQL wird erst in Ortszeit umgerechnet, dann
  6 h abgezogen (`date(ts/1000, 'unixepoch', 'localtime', '-6 hours')`). Sonst
  fehlten in der Nacht der Umstellung auf Winterzeit die Getränke zwischen
  05:00 und 06:00 in Archiv-Detail, TV-Archiv und Protokoll, und im März
  rutschte 06:00–07:00 in den Vortag.
- Reset-Passwort zeitkonstant vergleichen und mit demselben Fehlversuch-Limit
  wie Logins und Backup-Import (`loginLimiter` ist jetzt ein gemeinsames
  Modul-Objekt in `ratelimit.js`). WS-Handler nur über `Object.hasOwn` (keine
  geerbten Methoden wie `toString`).
- Kleinkram: Download-Links (CSV, Backup, Story) erst nach 30 s freigeben
  (Safari brach sonst ab); Anmelden/Anlegen gegen Doppeltipp gesperrt, falsche
  PIN leert das Feld; Admin-Archiv lädt nach neuen Getränken höchstens alle
  2 s nach, zeichnet nur bei echter Änderung und nicht mitten im Wischen neu;
  Wind-up der Wortmarke im Kaltstart-Bild (Regex ohne Backslashes) repariert;
  „1 Getränk Rückstand"/„Gleichstand" im Jahresrückblick.

**Begründung:** Ausführlicher Code-Check auf Wunsch des Nutzers, mit Fokus auf
Handy-Nutzung. In der Demo-Instanz in Handybreite geprüft (Anmeldung,
Dashboard, Archiv, Admin), Server per WS-Testskript (Reset falsch + parallel
ein Getränk, Sperre nach Fehlversuchen, `toString`, ungültiges Token, `ref`),
Zeitumstellung mit `TZ=Europe/Berlin`.

## D-102 (2026-10-16): Ein Menü für alle Seiten

**Entscheidung:** Das Vollbild-Menü baut `public/js/site-menu.js` auf jeder
Seite gleich (Anmeldung, Dashboard, Abend-Archiv, Admin): angemeldet
„Dein Abend: Zählen, Profil — Mehr: Abend-Archiv, TV, Admin, Abmelden",
abgemeldet „Anmeldung — Mehr: Abend-Archiv, TV, Admin". Der Eintrag der
aktuellen Seite ist durchgestrichen und schließt nur das Menü; „Profil" von
einer anderen Seite öffnet `dashboard#profil`; „TV" öffnet einen neuen Tab;
unten steht „Angemeldet als …". Der Admin hat dafür einen Menüknopf im Kopf;
die eigenen Archiv-/TV-Knöpfe dort entfallen, sein Abmelden heißt „Admin
abmelden" (zur Unterscheidung vom Abmelden des Gastes). Onboarding und TV
bleiben ohne Menü (geführter Ablauf bzw. Kiosk).

Dazu Design-Angleichungen: Hover-Zustände nur noch mit Maus (`hover: hover`),
auf dem Handy blieben sie nach dem Tippen stehen; Onboarding-Schritt 3 zeigt
die Bausteine des echten Profils (Platzkarte mit Nachbar, Statistik-Raster);
„Ausblenden" im Admin heißt nur noch so (es betrifft All-Time-Rangliste und
Anmeldeliste, nicht „Heute", D-013) und die All-Time-Liste im Dashboard
lässt Ausgeblendete weg wie der TV (außer man ist es selbst), damit „Dein
Platz" zum Fernseher passt; Konto löschen über einen eigenen Dialog statt
`confirm()`; ohne Anmeldung kein „Abmelden" im Dashboard-Fuß.

**Begründung:** Wunsch des Nutzers („überall das gleiche Menü"). Vorher hatte
jede Seite eigene Einträge („Archiv" vs. „Abend-Archiv", TV nur im Archiv,
Admin ganz ohne Menü). In Handybreite auf allen vier Seiten geprüft.

## D-103 (2026-10-16): Mehr Übergänge — Menüpunkte werden zu Überschriften

**Entscheidung:** Das Muster „Admin" aus dem Menü → Admin-Titel gilt jetzt
für alle Menüpunkte und ein paar Wege innerhalb der Seiten:
- **Seitenwechsel (View Transitions / Firefox-FLIP wie D-085/D-087):**
  „Abend-Archiv" → Zeile über der Archiv-Headline, „Zählen"/„Profil" →
  Tab-Knöpfe im Dashboard, „Anmeldung" → Zeile über „Wer bist du?",
  „Abmelden" auf Archiv/Admin → der Name aus „Angemeldet als …" gleitet in
  die eigene Zeile der Anmeldeliste (das Menü bleibt dafür stehen), Knopf
  „Protokoll" an einer Abendkarte → „Getränke-Protokoll" im Admin, Onboarding
  Schritt 3 „Los geht's" → die Ranglisten-Karte an ihren Platz im Profil.
  Die Zielelemente stehen dafür sofort da statt einzublenden.
- Damit die Ziele im ersten Bild stehen: `dashboard#profil` öffnet den
  Profil-Tab per Inline-Skript (der Render-Blocker `rel="expect"` wartet auf
  `#tab-start` dahinter), `admin?protokoll=<tag>` schaltet das Protokoll schon
  im Inline-Skript ein.
- **Innerhalb der Seite (Web Animations):** Der Jahresrückblick wächst aus
  der orangen Karte ins Vollbild (Ausschnitt und Farbe, der Kartentitel
  fliegt an den Platz des Titels der ersten Seite) und schrumpft beim
  Schließen zurück. „Ganze Rangliste ansehen": „Dein Platz" fliegt in die
  eigene markierte Zeile des Blatts, die erst danach mit kleinem Federn
  erscheint.
- Nachtrag: Kachel und erste Story-Seite teilen den Titel gleich auf („Dein
  Jahr" | „2026"). Die echten Titelteile der Story starten deckungsgleich auf
  den Kachelteilen (Lage, Schriftgröße, Farbe) und gleiten an ihren Platz;
  beim Schließen auf Seite 1 laufen sie zurück in die Kachel. Gemessen: im
  Startbild pixelgleich mit der Kachel.

**Begründung:** Wunsch des Nutzers nach mehr Übergängen wie beim
Admin-Menü. Geprüft in der Demo-Instanz in Handybreite: Übergangsnamen auf
Quell- und Zielseite (der eingebaute Test-Browser bricht View Transitions
grundsätzlich ab, auch auf einer leeren Seite), Rückblick und Platz-Flug mit
Zwischenbildern, Onboarding Schritt 3 landet im Profil.

## D-104 (2026-10-16): Keine Zähler-Korrekturen mehr in der Kontenliste

**Entscheidung:** Die −/+-Knöpfe und eintippbaren Zahlen je Getränk in der
Admin-Kontenliste entfallen; Bier, Shots und Mischen stehen dort nur noch zur
Ansicht (farbiger Punkt und Zahl, am Handy kompakt unter dem Namen).
Korrigiert wird ausschließlich im Getränke-Protokoll (D-073; aus der
Kontenliste über ⋯ → „Im Protokoll ansehen"). Serverseitig: Der WS-Handler
`setCounter` ist weg, `increment` erlaubt nur noch Gästen ihr eigenes +1 —
ein Admin bekommt „Korrekturen bitte im Getränke-Protokoll". Das Dev-Seed
(`npm run seed`) legt seine Testdaten als echte Protokolleinträge an
(drei vergangene Samstage plus heute).

**Begründung:** Wunsch des Nutzers. Korrekturen am Zähler standen nicht im
Protokoll; Zähler und Protokoll konnten so auseinanderlaufen (Archiv,
Rekorde und Meilensteine rechnen aus dem Protokoll, die Rangliste aus den
Zählern). Ab jetzt gilt immer Zähler = Protokoll. Die echte Datenbank hatte
vorher keine Abweichungen (19 Konten geprüft), es bleibt also nichts Schiefes
zurück. Geprüft: WS-Test (Admin-increment und setCounter abgewiesen, Gast
+1 quittiert), Seed gegen Wegwerf-DB, Kontenliste in Handy- und
Desktopbreite.

Nachtrag D-103: Der Rückblick-Titel flog nach dem Übergang ein zweites Mal
herein — die Klasse, die seine Einblendung während des Übergangs abschaltet,
wurde nach 0,8 s entfernt und startete sie neu. Sie bleibt jetzt bis zum
nächsten Seitenwechsel in der Story stehen.

## D-105 (2026-10-16): Rückblick blättert aus einem Guss

**Entscheidung:** Der Wechsel zwischen den Story-Seiten des Jahresrückblicks
ist kein harter Schnitt mit neuer Einblendung mehr. Beide Seiten stehen kurz
übereinander (Web Animations, ca. 0,7 s):
- Titel bestehen aus einzelnen Wortblöcken. Wörter, die auch im neuen Titel
  stehen („Dein"), gleiten an ihren neuen Platz; „Deine" ist „Dein" + „e",
  damit das Wort auch dort stehen bleibt. Die Kachel ist gleich aufgeteilt
  („Dein" „Jahr" „2026").
- Die große Zahl gleitet weiter und zählt dabei vom alten auf den neuen Wert;
  die Einheit (%, Uhr) läuft durch eine Maske aus und ein.
- Alle anderen Wörter steigen durch eine unsichtbare Kante aus und ein
  (Masken-Reveal wie `data-reveal="words"`), der übrige Inhalt blendet
  versetzt über — alles in Tipprichtung (zurück = von oben).
- Schnelles Tippen bricht den laufenden Wechsel ab und startet von der
  aktuell sichtbaren Lage; bei `prefers-reduced-motion` bleibt der harte
  Wechsel.

**Begründung:** Wunsch des Nutzers — die Übergänge innerhalb des Rückblicks
wirkten langweilig. Geprüft in der Demo-Instanz in Handybreite (Zwischenbilder
der Übergänge, Vor/Zurück, schnelles Tippen, keine Konsolenfehler).

## D-106 (2026-10-16): Geisterspur beim Überholen auf dem TV (L33)

**Entscheidung:** Rückt jemand in der TV-Rangliste (Plätze ab 4) an einer
anderen Zeile vorbei, ziehen vier Umriss-Kopien von Name und Gesamtzahl
(orange Kontur, abnehmende Deckkraft) zeitversetzt hinter seiner Zeile her
und verblassen am Ziel; die Überholten dimmen währenddessen kurz ab. Die
FLIP-Bewegung aller Zeilen dauert dafür 0,9 s mit `--ease` statt 0,6 s.
Als Überholen zählt nur, wer an einer Zeile vorbeizieht, die vorher über ihm
stand — nicht das Aufrücken, wenn jemand aufs Podest wechselt, und nicht der
Versatz durch die laufende Rotation. Bei `prefers-reduced-motion` keine
Geister und kein Abdunkeln.

**Begründung:** Wunsch des Nutzers aus Inspiration Runde 4 (L33, Codrops
„Ghost Trails“). Macht Überholmanöver auf dem Fernseher aus der Entfernung
sichtbar. Geprüft in der Demo-Instanz per WS-Testskript (echte Überholungen
mit und ohne laufende Rotation, keine Konsolenfehler).

## D-107 (2026-10-16): TV ohne Abstand und Bestwert-Etiketten

**Entscheidung:** Vom Timing-Tower (D-093) bleibt auf dem TV nur ▲▼ mit den
gewonnenen bzw. verlorenen Plätzen für einige Sekunden. Entfernt sind die
Spalte „Abstand“ (+X zum Vordermann) in der Liste, das +X über den
Podestplätzen, die Etiketten „Bestwert“ und „Hausrekord“ sowie die grüne bzw.
lila Gesamtzahl in der Heute-Ansicht. Die Rekordkurs-Anzeige im Kopf bleibt.
Die Tokens `--pb`/`--record` bleiben im Theme, werden auf dem TV aber nicht
mehr benutzt.

**Begründung:** Wunsch des Nutzers — der TV soll ruhiger sein; die Pfeile
hatte er ausdrücklich freigegeben. Die Liste gewinnt dadurch Platz für die
Namen. Geprüft in der Demo-Instanz (Überholen per WS-Testskript: ▲▼
erscheinen, keine Abstands- oder Bestwert-Elemente, keine Konsolenfehler).

## D-108 (2026-10-16): Stempelkarte im Jahresrückblick (L34)

**Entscheidung:** Der Jahresrückblick bekommt nach „Dein bester Abend“ die
Seite „Deine Abende“: die Zahl der Abende, an denen man dabei war („5 von
7“), darunter jeder Party-Abend des Jahres als Kreis mit Datum — dabei =
Stempel (Kontur, leicht schräg), gewonnen = gefüllt in Orange, verpasst =
gestrichelt. Die Stempel schlagen nacheinander auf. Das Raster passt die
Spaltenzahl an die Zahl der Abende an (4 bis 8). Der Server liefert dafür in
`/players/:id/review` neu `stamps: [{ day, on, win }]` (alle Party-Abende des
Jahres, aus den Abendsiegern). Die Seite erscheint ab zwei Abenden im Jahr.
Bewusst nicht im Profil und ohne die Serie (L35).

**Begründung:** Wunsch des Nutzers — das Profil soll nicht voller werden;
im Rückblick belohnt die Karte das Dabeisein statt der Menge. Geprüft in der
Demo-Instanz in Handybreite (Daten, Übergang von „Dein bester Abend“,
keine Konsolenfehler).

## D-109 (2026-10-16): Umzug vom alten Repo; Härtungen aus dem alten Repo nachgezogen

**Entscheidung:** Die laufende Instanz im Partykeller (alter Stand aus
`jstin-cc/Partykeller-Counter`) wird im selben Ordner auf dieses Repo
umgestellt: `git remote set-url`, `git fetch`, `git reset --hard
origin/main`, danach wie gewohnt `git pull`. Anleitung samt Sicherung und
Rückweg im README („Umzug vom alten Partykeller-Counter“). Datenbank und
`.env` bleiben liegen; das Schema ist in beiden Ständen gleich, eine
Migration ist nicht nötig. Aus dem alten Repo, das sich nach der Abspaltung
noch weiterentwickelt hat (dort D-080 bis D-085), fehlten hier noch:
- `allowScripts` für better-sqlite3 in der `package.json` und der
  README-Abschnitt zum Fehler „compiled against a different Node.js
  version“ (Node 24 auf dem Partykeller-PC).
- Kein Absturz durch eine kaputte WebSocket-Adresse (`new URL` im
  `upgrade`-Handler abgefangen).
- Broadcast um 06:00: Beim Wechsel des Party-Tags schickt der Server von
  sich aus den neuen Stand, statt bis zum nächsten Getränk die Zahlen der
  letzten Nacht zu zeigen.
- Unerwartete REST-Fehler als knappes JSON statt Express-Fehlerseite mit
  Stacktrace; `/api/login` prüft, dass `playerId` ein Text ist.
Die übrigen Fixes von dort (Party-Tag bei Zeitumstellung, Lösch-Passwort
mit Fehlversuch-Sperre, `Object.hasOwn`, Download-Freigabe nach 30 s,
Emoji-Initialen) waren hier schon drin; die Design-Änderungen von dort sind
durch die eigenen dieses Repos ersetzt.

**Begründung:** Wunsch des Nutzers, die Instanz im Partykeller per Git auf
das neue Programm zu heben und so aktuell zu halten; den Youngstars-Bereich
braucht es nicht mehr. Geprüft mit einer Datenbank, die der alte Code
angelegt hat (Konten mit und ohne PIN, ausgeblendetes Konto, vier Abende,
Abend-Name, Fun-Fact, QR-Adresse): Der neue Server startet darauf, Zähler,
Archiv, Abend-Namen, Login mit PIN, vom alten Code ausgestellte Tokens,
Jahresrückblick und Admin-Login funktionieren; eine kaputte WS-Adresse
lässt den Server weiterlaufen.

## D-110 (2026-10-16): Youngstars wieder da, im gleichen Design; Auswahlseite

**Entscheidung:** Der Youngstars-Bereich kommt zurück, diesmal im genau
gleichen Design wie der Partykeller (D-080). Die Bereichs-Struktur aus D-019
(Router, WebSocket, bereichsgestempelte Tokens) war geblieben und trägt
wieder zwei Einträge in `server/areas.js`.

- **Daten:** die alte `data/youngstars.db` wird wieder gelesen
  (`YOUNGSTARS_DB_PATH`), Konten und Abende sind sofort zurück. Vom alten
  Code ausgestellte Youngstars-Tokens gelten wieder (gleiches
  `TOKEN_SECRET`), Handys mit `ys_*`-Login bleiben angemeldet.
- **Admin:** eigenes Passwort `YOUNGSTARS_ADMIN_PASSWORD`; nicht gesetzt =>
  es gilt `ADMIN_PASSWORD`, damit bestehende Setups ohne neue Pflichtangabe
  starten. Das Lösch-Passwort bleibt gemeinsam.
- **Design:** dieselben Seiten, Farben, Getränke-Reihenfolge. Unterschied
  nur die Wortmarke („Young / Stars“) und das SV-Logo, das nur der
  Partykeller zeigt (Youngstars: nur Wortmarke, `html[data-area]` blendet
  `.pk-logo`/`.tv-emblem` aus). Wortmarke, Titel und `data-area` setzt der
  Server beim Ausliefern (`renderPage`), damit schon das erste Bild stimmt
  und Kaltstart-Bild und Morphs greifen; Skripte nehmen sie aus
  `js/area.js` (Bereich am Pfad, Storage-Prefix `pk`/`ys`). Eigenes Manifest
  je Bereich (`/<bereich>/manifest.webmanifest`).
- **Auswahlseite** `/` (`public/start.html`, Variante 1 aus
  `docs/INSPIRATION-AUSWAHL.md`, nach „On Track / Off Track“ auf
  landonorris.com): zwei Kerbenkarten mit riesiger Wortmarke und Live-Zeile
  aus dem neuen öffentlichen `GET /<bereich>/api/summary` (Getränke heute,
  dabei, vorne; ohne Ausgeblendete). Ein Tipp lässt die Karte die Seite
  füllen, dann gleitet ihre Wortmarke als `site-wordmark` in die Kopfleiste
  der Anmeldung (bzw. des Dashboards). Angemeldete Handys springen direkt
  in ihr Dashboard (bei beiden in den zuletzt genutzten Bereich,
  `localStorage.last_area`); `/?wahl` zeigt die Auswahl trotzdem.
- **Menü:** neuer Punkt „Bereich wechseln“ unter „Mehr“; er gleitet in
  „Bereich wählen“, die Kopfleisten-Wortmarke in die Karte des Bereichs.
- Alt-Pfade ohne Präfix (`/tv`, `/api`, `/ws`, …) bleiben beim Partykeller;
  `/youngstars/…` leitet nicht mehr um.

**Begründung:** Wunsch des Nutzers: Youngstars wieder als eigener Bereich,
aber mit dem genau gleichen Design; Auswahlseite nach Recherche
(Awwwards, Dribbble, landonorris.com) als Variante 1 gewählt, mit schönem
Übergang ins nächste Fenster. Daten, Startverhalten, Admin-Passwort und
Logo nach Rückfrage beim Nutzer.

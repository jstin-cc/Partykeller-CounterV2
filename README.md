# Getränke-Counter Partykeller 🍺

Gäste zählen ihre Biere und Shots über das Handy, ein Fernseher zeigt die
dauerhafte All-Time-Rangliste. Läuft komplett im lokalen WLAN auf einem
Laptop oder Raspberry Pi — keine Internet-Abhängigkeit.

Die App läuft unter `/partykeller` (Fast-Schwarz mit Orange, Partykeller-Logo);
`/` leitet direkt dorthin. Den früheren zweiten Bereich *Youngstars* gibt es
seit D-080 nicht mehr — alte `/youngstars/…`-Links leiten in den Partykeller.
Das Design folgt seit D-078 der Designsprache von
[landonorris.com](https://landonorris.com/) — siehe [Design](#design).

**Status:** Funktional komplett (M0–M8) — Login, Nutzer-Dashboard,
TV-Scoreboard mit QR-Code und Admin-Bereich laufen live über WebSocket.
Offene Restpunkte in [PROGRESS.md](PROGRESS.md).

## Voraussetzungen

- **Node.js 20 LTS oder neuer** (aktuelles LTS empfohlen). `better-sqlite3`
  bringt dafür fertige Binaries mit — es muss nichts kompiliert werden, keine
  Visual-Studio-Build-Tools nötig.
- **Git**.
- Unter **Windows** muss PowerShell einmalig Skripte erlauben, sonst
  verweigert es `npm` — siehe
  [Windows: `npm` wird von PowerShell blockiert](#windows-npm-wird-von-powershell-blockiert).

## Erste Einrichtung

**macOS/Linux (bash):**

```bash
git clone https://github.com/jstin-cc/Partykeller-CounterV2.git
cd Partykeller-CounterV2
npm install
cp .env.example .env          # ADMIN_PASSWORD und TOKEN_SECRET setzen
npm run seed                  # optional: Testnutzer (PIN 1111)
npm start                     # http://localhost:3000
```

**Windows (PowerShell):**

```powershell
git clone https://github.com/jstin-cc/Partykeller-CounterV2.git
cd Partykeller-CounterV2
npm install
Copy-Item .env.example .env   # ADMIN_PASSWORD und TOKEN_SECRET setzen
npm run seed                  # optional: Testnutzer (PIN 1111)
npm start                     # http://localhost:3000
```

> Die `.env` muss `ADMIN_PASSWORD` und `TOKEN_SECRET` enthalten (Vorlage: `.env.example`), sonst startet der Server
> bewusst nicht. Ein sicheres `TOKEN_SECRET` erzeugst du z. B. mit
> `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

### Windows: `npm` wird von PowerShell blockiert

PowerShell verbietet standardmäßig jedes Skript (`Restricted`) — auch das
`npm.ps1`, das hinter dem `npm`-Befehl steckt. Der Fehler sieht so aus:

```
npm : Die Datei "C:\Program Files\nodejs\npm.ps1" kann nicht geladen werden,
da die Ausführung von Skripts auf diesem System deaktiviert ist.
```

Einmalig für den eigenen Benutzer freischalten — **kein Admin nötig**, gilt
dauerhaft für alle künftigen Fenster:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Wenn du nichts dauerhaft ändern willst, reicht das hier — gilt aber nur für
das gerade offene Fenster und muss nach jedem Neustart der Konsole wieder
gesetzt werden:

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

Aktuellen Stand prüfen mit `Get-ExecutionPolicy -List`. Steht bei
`CurrentUser` schon `RemoteSigned`, ist alles erledigt und der Befehl wird
nicht noch einmal gebraucht.

`RemoteSigned` erlaubt lokal erstellte Skripte und verlangt bei aus dem
Internet heruntergeladenen eine gültige Signatur — für eine Entwicklungs-
maschine die übliche Einstellung. In der **Eingabeaufforderung (cmd)** oder im
**Git Bash** tritt das Problem gar nicht auf, dort läuft `npm.cmd` statt
`npm.ps1`.

### Fehler „was compiled against a different Node.js version“

Nach einem Node-Update (z. B. von Node 22 auf 24) bricht `npm start` so ab:

```
Error: The module '...\better_sqlite3.node'
was compiled against a different Node.js version using
NODE_MODULE_VERSION 127. This version of Node.js requires
NODE_MODULE_VERSION 137.
```

`better-sqlite3` enthält ein fertiges Binary, das genau zu einer
Node-Version passt. Im `node_modules`-Ordner liegt noch das alte, und ein
erneutes `npm install` tauscht es nicht aus, weil sich am Paket nichts
geändert hat. Abhilfe — **die Daten in `data/` bleiben erhalten**:

```powershell
npm rebuild better-sqlite3
npm start
```

Hilft das nicht, `node_modules` ganz löschen und neu installieren (siehe
[Auf neue Version aktualisieren](#auf-neue-version-aktualisieren--neustart)).
Für den Download des passenden Binarys braucht dieser eine Schritt
Internet; danach läuft die App wieder offline.

Die Freigabe für das Install-Skript von better-sqlite3 (ab npm 11.16 nötig)
steht in der `package.json` (`allowScripts`).

## Auf neue Version aktualisieren / Neustart

Laufenden Server im Terminal stoppen (**Strg + C**), dann ins Projektverzeichnis
wechseln und aktualisieren.

**Windows (PowerShell):**

```powershell
cd <dein-Projektordner>       # z. B. D:\claude-projects\Partykeller\Partykeller-Counter
git checkout main
git pull
Remove-Item -Recurse -Force node_modules   # nach Dependency-Updates wichtig
npm install
npm start
```

**macOS/Linux (bash):**

```bash
cd <dein-Projektordner>
git checkout main
git pull
rm -rf node_modules           # nach Dependency-Updates wichtig
npm install
npm start
```

Deine Daten (`data/*.db`) und die `.env` sind gitignored und bleiben
beim Update erhalten. Meldet `git pull` „local changes" und du hast am Code
nichts geändert, hilft `git reset --hard origin/main` — das lässt `data/` und
`.env` unangetastet.

Beschwert sich PowerShell hier über `npm`, siehe
[Windows: `npm` wird von PowerShell blockiert](#windows-npm-wird-von-powershell-blockiert).

## Umzug vom alten Partykeller-Counter

Wer noch die alte Version aus
[jstin-cc/Partykeller-Counter](https://github.com/jstin-cc/Partykeller-Counter)
betreibt, stellt denselben Ordner auf dieses Repo um. Datenbank, `.env`,
Pfade und Autostart bleiben, wie sie sind; das Datenbankformat ist gleich,
alle Konten, Getränke, Abende, Abend-Namen und Fun-Facts sind danach da.
Mit demselben `TOKEN_SECRET` bleiben auch die Handys angemeldet.

Vorher im Admin **⬇ Backup herunterladen** und die Datei auf einen
USB-Stick legen. Dann den Server stoppen (**Strg + C**).

**Windows (PowerShell):**

```powershell
cd <dein-Projektordner>
Copy-Item -Recurse data ..\partykeller-sicherung-v1
Copy-Item .env ..\partykeller-sicherung-v1\.env
git remote set-url origin https://github.com/jstin-cc/Partykeller-CounterV2.git
git fetch origin
git checkout main
git reset --hard origin/main
Remove-Item -Recurse -Force node_modules
npm install
npm start
```

**macOS/Linux (bash):**

```bash
cd <dein-Projektordner>
cp -r data ../partykeller-sicherung-v1
cp .env ../partykeller-sicherung-v1/.env
git remote set-url origin https://github.com/jstin-cc/Partykeller-CounterV2.git
git fetch origin
git checkout main
git reset --hard origin/main
rm -rf node_modules
npm install
npm start
```

Für diesen einen Wechsel `git reset --hard` statt `git pull`: Das neue Repo
hat eine eigene Git-Geschichte, `git pull` bricht mit „refusing to merge
unrelated histories“ ab. `data/` und `.env` sind gitignored und bleiben
unangetastet. Ab dann reicht für jedes Update wieder `git pull` wie unter
[Auf neue Version aktualisieren](#auf-neue-version-aktualisieren--neustart).

In der `.env` können `YOUNGSTARS_ADMIN_PASSWORD` und `YOUNGSTARS_DB_PATH`
raus; `data/youngstars.db` wird nicht mehr gelesen und kann gelöscht werden.
Alte `/youngstars/…`-Links und -QR-Codes leiten in den Partykeller.

**Zurück zur alten Version**, falls etwas schiefgeht: Server stoppen,
`data` und `.env` aus `..\partykeller-sicherung-v1` zurückkopieren, dann
`git remote set-url origin https://github.com/jstin-cc/Partykeller-Counter.git`,
`git fetch origin`, `git reset --hard origin/main`, `npm install`, `npm start`.

## Screens

Alle Routen liegen unter `/partykeller/…` (in der Tabelle `/<bereich>/`).
Alte Links ohne Präfix (z. B. `/tv`) und `/youngstars/…` leiten dorthin.

| Route | Screen |
|---|---|
| `/` | Weiterleitung auf `/partykeller/` |
| `/<bereich>/` | Nutzer-Login (Name wählen/anlegen; PIN optional, rate-limitiert). Das Konto, mit dem sich dieses Handy zuletzt angemeldet hat, steht oben. Beim Anmelden gleiten Namenskreis und Name in den Dashboard-Kopf (View Transitions; ältere Browser wechseln hart). Wer auf diesem Handy schon angemeldet ist, landet direkt im Dashboard. Auf Anmeldung, Dashboard, Archiv und Admin steht dasselbe Vollbild-Menü (Zählen, Profil, Abend-Archiv, TV, Admin, Abmelden bzw. ohne Anmeldung „Anmeldung“); jeder Menüpunkt gleitet auf der Zielseite in sein Gegenstück (D-103) |
| `/<bereich>/onboarding` | Drei Willkommens-Seiten nach dem Anlegen eines Kontos (Getränke tracken, Rangliste auf dem Fernseher, Profil-Tab) mit Punkten, „Weiter“ und „Überspringen“; danach das Dashboard. Nur für neue Konten, beim Anmelden kommt sie nicht |
| `/<bereich>/dashboard` | Nutzer-Dashboard (im Kopf ab dem ersten Abendsieg ein Lorbeer um den Namenskreis und „n× Tagessieger“; beim Scrollen schrumpft der Name und dockt als Pille in einer fixierten Kopfleiste an) mit zwei Tabs — **Zählen** (oben „Getränke heute“, rechts daneben ▲/▼ mit dem Abstand zum eigenen Schnitt der früheren Abende bis zur gleichen Uhrzeit; darunter drei große Kerben-Karten in der Getränkefarbe — antippen zählt +1, mit der Heute-Zahl auf der Fläche und „Gesamt“ im Etikett) und **Profil** (eine Ranglisten-Karte, oben umschaltbar zwischen heute und all-time, inkl. wer direkt vor/hinter einem liegt und **„Ganze Rangliste ansehen"** als Blatt von unten mit markierter eigener Zeile, Abende, bester Abend, Ø pro Abend, Verteilung, Anteil am Haus, Abzeichen als Umriss-Kerbenkarten mit eigenen Strich-Icons und Zähler in der Kerbe — gefüllt, wenn heute erreicht, Akzent-Linie, wenn schon einmal erreicht; u. a. Tagessieger und das Treue-Abzeichen ab 10 Abenden). Beim Zählen rutscht der alte Stand als Umriss weg (Echo-Zahl); im Profil steht der All-Time-Stand mit dem Stand nach den letzten Abenden darunter und die Karte **„Dein Jahr“**: ein Jahresrückblick als Story-Seiten zum Durchtippen, die letzte speichert ein Bild 1080 × 1920. |
| `/<bereich>/tv` | TV-Scoreboard: umschaltbar All-Time / Heute / Archiv-Abend (animiert, benannte Abende stehen mit ihrem Namen im Titel; „Heute" zeigt nur, wer heute geloggt hat), Podest Top 3, QR-Code zum Beitritt, ab Platz 4 durchscrollende Liste (Tempo im Admin einstellbar), Live-Fun-Facts inkl. eigener Meldungen und Statistik-Facts (Rekorde, Tages-Bestleistungen, Comeback nach langer Pause, runde Marken, Führungswechsel), Rekordkurs-Anzeige 🔥 wenn der Abend seit seinem ersten Getränk schneller läuft als der beste bisherige Abend in derselben Zeit. Bei einem Führungswechsel zeichnet sich ein Kringel um die neue Nr. 1. Bei Positionswechseln steht für einige Sekunden ▲/▼ mit den gewonnenen bzw. verlorenen Plätzen am Namen; wer überholt, zieht eine Geisterspur aus Umriss-Kopien hinter sich her (D-106). Keine Abstände, Bestwert- oder Hausrekord-Etiketten (D-107). Große Momente im Vollbild: **Namens-Plakat** (Sieger eines Archiv-Abends bzw. neue Nr. 1 des Abends) und **Meilenstein-Bild** bei runden Marken (Haus alle 500, persönlich 100er/50er); zum Ausprobieren `?moment=plakat` bzw. `?moment=meilenstein`. Skaliert als 1080p-Design-Bühne — sieht auf jeder Auflösung identisch aus |
| `/<bereich>/admin` | Admin: Konten verwalten (Bier/Shots/Mischen je Konto zur Ansicht; korrigiert wird nur im Getränke-Protokoll, D-104) — Suche und Filter (Alle / Heute dabei / Ausgeblendet), Umbenennen/PIN/Ausblenden/Löschen/„Im Protokoll ansehen“ im ⋯-Menü —, **Getränke-Protokoll** (jedes Getränk eines Abends einzeln: Konto, Sorte und Uhrzeit ändern, löschen mit Rückgängig, nachtragen; die Zähler ziehen mit; daneben Zahlen des Abends und mögliche Doppeltipps), in der Gesamtansicht und in der Anmeldeliste ein-/ausblenden, TV-Ansicht (inkl. Archiv-Abend) & Rotationstempo einstellen, eigene Fun-Facts pflegen und bearbeiten, **alle rotierenden Fun-Facts ansehen** (welcher gerade auf dem TV läuft, vor/zurück, Sprung per Klick), QR-Adresse setzen, Saison-Akzente und Schnitt-Vergleich im Dashboard ein-/ausschalten, **Effekt-Demo** (TV-Effekte auf Knopfdruck, siehe unten), **Backup herunterladen und einspielen**, Komplett-Reset (mit Lösch-Passwort). Am Rechner zwei Spalten (Konten links, mitlaufende Seitenleiste rechts), über der Hauptspalte *Konten / Protokoll*; auf Handy und Tablet ein Umschalter *Konten / Protokoll / TV / Mehr*; Einspielen und Reset stehen gesammelt in der **Danger Zone** |
| `/<bereich>/abende` | Abend-Archiv als Chronik (der Hintergrund wechselt beim Scrollen): oben die Kennzahlen als Headline („24 Abende, 3 412 Getränke, ein Keller.“), darunter die **Hall of Fame** der Abendsieger, dann jeder Party-Tag als Karte in einem seitlich blätterbaren 3D-Register (Wischen, Ziehen, Pfeile; Zähler und Fortschrittsbalken) mit Sieger, Teilnehmerzahl, Gesamtmengen und dem **Verlauf des Abends** (Getränke pro Stunde, alle zusammen, Spitzenstunde hervorgehoben). Mit Admin-Login zusätzlich: **CSV-Download** je Abend und über alle Abende, „Protokoll“ (öffnet das Getränke-Protokoll im Admin für diesen Abend, dort werden Getränke einzeln korrigiert), **Abend benennen** (ein Tipp auf den Namen unter dem Datum bzw. auf „Namen geben“; der Name steht auf der Karte und im TV-Titel) und „Auf den TV". Jede Karte hat „⬇ Story": lädt den Abend als Bild 1080 × 1920 fürs Handy herunter (Datum, Sieger und Plätze 2/3, Bilanz, Verlauf) — für alle, ohne Login. Gezeichnet wird in Blöcken von zwölf, der nächste Block kommt beim Blättern automatisch dazu |

### Übergabedatei (CSV) aus dem Abend-Archiv

Auf `/<bereich>/abende` liefert **„⬇ CSV"** die Teilnehmerliste eines einzelnen
Abends, **„⬇ Alle Abende als CSV"** oben rechts alle Abende in einer Datei.
Beide Knöpfe erscheinen **nur mit Admin-Login** — genauso wie das Benennen, „Protokoll“ und
„Auf den TV"; ohne gültiges Admin-Token antworten die Endpunkte mit 403
(D-027). Die Karten mit Sieger, Teilnehmerzahl und Tagessummen bleiben für alle
sichtbar.

Format: eine Zeile **je Abend und Person** (Langformat, direkt als Pivot
auswertbar), Spalten
`Tag;Datum;Wochentag;Name;Bier;Shots;Mischen;Gesamt`. Trennzeichen ist das
Semikolon, die Datei hat ein UTF-8-BOM — deutsches Excel und LibreOffice
öffnen sie per Doppelklick korrekt inklusive Umlauten. `Tag` ist zusätzlich in
ISO-Form (`2026-08-22`) dabei, damit sich die Datei auch maschinell sortieren
lässt. Personen ohne Getränke an dem Abend stehen nicht drin; eine Summenzeile
gibt es bewusst nicht.

Die Dateien heißen `partykeller-abend-2026-08-22.csv` bzw.
`partykeller-abende-gesamt.csv`, die Endpunkte
dahinter sind `GET /<bereich>/api/export/archive[/<tag>]` mit dem Admin-Token
im `Authorization`-Header.

### Sicherung: alles herunterladen und im Notfall wiederherstellen

Im Admin-Bereich unter **Einrichtung → Sicherung** (auf dem Handy im Reiter *Mehr*); das Einspielen steht bewusst getrennt in der **Danger Zone**:

- **⬇ Backup herunterladen** speichert den kompletten Bereich als eine
  JSON-Datei (`partykeller-backup-2026-09-01.json`): alle Nutzer mit ID,
  PIN-Hash, Zählern und Sichtbarkeit, das gesamte Getränke-Log, die
  Einstellungen (TV-Ansicht, Abend-Namen, QR-Adresse, Tempi) und die eigenen
  Fun-Facts. Am besten nach jedem Abend einmal auf einen USB-Stick oder in die
  Cloud legen.
- **⬆ Backup einspielen** stellt daraus alles wieder her — z. B. auf einem
  neuen Laptop oder nach einer kaputten SD-Karte. Das **ersetzt** den
  kompletten Bestand des Bereichs, deshalb ist wie beim Komplett-Reset das
  **Lösch-Passwort** nötig. Geht beim Einspielen etwas schief (kaputte Datei,
  Sicherung des anderen Bereichs), bleibt der alte Stand unangetastet.

Alte Youngstars-Sicherungen lassen sich nicht einspielen.

Wichtig: Die **`.env` ist nicht Teil der Sicherung** — sie muss getrennt
aufgehoben werden. Nur mit demselben `TOKEN_SECRET` bleiben nach der
Wiederherstellung auch die Logins auf den Handys gültig; mit einem neuen
Secret müssen sich alle einmal neu anmelden (die PINs stimmen weiterhin).

Die Endpunkte dahinter sind `GET /<bereich>/api/export/backup` und
`POST /<bereich>/api/import/backup`, beide nur mit Admin-Token im
`Authorization`-Header (D-034).

### Saison-Akzente

Zu ein paar Anlässen im Jahr schaltet sich von selbst eine kleine Deko ein —
am Handy im Dashboard (steht still, am Rand) und auf dem TV (darf sich leise
bewegen, dazu ein kurzer Moment im Fun-Fact-Band). Ein Abend zählt dabei bis
6 Uhr früh.

| Anlass | Zeitraum | Handy & TV | Moment auf dem TV |
|---|---|---|---|
| Oktoberfest | Wiesn (Samstag nach dem 15.09. bis 1. Oktober-Sonntag, mind. 03.10.) | blau-weiße Wimpelkette oben | „O’zapft is!“ beim ersten Bier des Abends, Bläschen |
| Halloween | 31.10. | flache Kürbis-Laternen auf der Unterkante | Fledermaus bei Führungswechsel |
| Winter | 01.12. bis 06.01. | Schneewehe mit Höhenlinien auf der Unterkante, auf dem TV leiser Schneefall | – |
| Silvester | 31.12. ab 18 Uhr bis 01.01. 6 Uhr | wie Winter, dazu Countdown in der letzten Stunde | Feuerwerk um 0 Uhr, danach alle paar Minuten ein paar Raketen |
| Fasching | Weiberfastnacht bis Faschingsdienstag | Luftschlangen mittig oben | Konfetti bei Führungswechsel |

Die Deko ist flach und in der Lando-Palette gezeichnet (D-078). Führungswechsel lösen höchstens alle zwei Minuten einen
Saison-Moment aus. Mit
„Bewegung reduzieren“ am Gerät bleibt nur die stehende Deko.

Abschalten lässt sich alles im Admin unter **Einrichtung → Saison-Akzente**.
Zum Ausprobieren stellt `?jetzt=…` die Uhr einer Seite, z. B.
`/partykeller/tv?jetzt=2026-12-31T23:59:30` (Silvester-Countdown) oder
`/partykeller/dashboard?jetzt=2026-10-31T21:00` (Halloween).

### Effekt-Demo

Im Admin unter **TV → Effekt-Demo** spielt ein Knopf einen Effekt sofort auf
allen offenen Fernsehern ab — etwa um Gästen zu zeigen, was passieren kann:
Namens-Plakat und Meilenstein-Bild (mit Namen und Zahlen aus dem aktuellen
Stand), Konfetti, Fledermaus, Bierbläschen, Feuerwerk, Schneefall (20 s),
Silvester-Countdown im Schnelldurchlauf (10 s, dann Feuerwerk und Gruß) und
die Saison-Deko jedes Anlasses für 45 s. **Alle Effekte beenden** räumt
alles Laufende sofort ab. Daten und Einstellungen bleiben unberührt; das
geht auch bei abgeschalteten Saison-Akzenten.

Die App ist als **PWA installierbar**: Seite am Handy öffnen → „Zum
Startbildschirm hinzufügen" — dann liegt der Counter als App-Icon auf dem
Home-Screen (funktioniert komplett offline im WLAN, es wird nichts gecacht).

## Design

Seit D-078 folgt die App der Designsprache von
[landonorris.com](https://landonorris.com/): Lando-Palette (Fast-Schwarz
mit Navy-Stich, Off-White, Orange, Neon-Lime als Zweitakzent; seit D-080), riesige Versal-Headlines
in **Mona Sans** mit Akzentwörtern in **Instrument Serif**, Höhenlinien im
Hintergrund, Kerben-Karten wie Landos „Helmets Hall of Fame“, sich selbst
zeichnende Handschrift-Kringel, Akzent-Knöpfe mit Pfeil, Vollbild-Menü und
Einblend-Animationen. Beide Schriften (OFL) liegen lokal in
`public/assets/fonts/`, es wird nichts aus dem Internet geladen.

- Design-System und Regeln: [docs/DESIGN-LANDO.md](docs/DESIGN-LANDO.md)
- Tokens und Komponenten: `public/css/theme.css`, Bewegung und Formen:
  `public/js/lando.js`, Referenz-Umsetzung: `public/index.html`
- Auf Geräten mit Maus leuchten die Höhenlinien wie auf landonorris.com in
  einer Strömung auf, die der Maus nachfließt, verwirbelt und langsam
  verblasst (`public/js/topo-fluid.js`, WebGL2, D-081); ohne WebGL2 bleibt
  der einfache Lichtkreis unter dem Cursor
- Die Höhenlinien (`public/assets/topo*.svg`) erzeugt einmalig
  `node tools/gen-topo.mjs …` (Aufruf im Dateikopf)
- „Bewegung reduzieren“ am Gerät schaltet alle Animationen ab

## Stack

Node.js · Express · ws (WebSockets) · SQLite (better-sqlite3) ·
statisches Frontend ohne Build-Step. Ein Prozess serviert alles.

## Promo-Video

Ein 43-Sekunden-Spot wird komplett aus Code erzeugt (Demo-Daten, echte Screens,
synthetischer Soundtrack, Frame-genaues Rendering) — Ablauf in
[promo/README.md](promo/README.md).

## Projekt-Dokumente

- [PLAN.md](PLAN.md) — Architektur, Datenmodell, API-/WS-Contract, Meilensteine
- [PROGRESS.md](PROGRESS.md) — Meilensteine mit Status (wird laufend abgehakt)
- [DECISIONS.md](DECISIONS.md) — Entscheidungen mit Begründung
- [CLAUDE.md](CLAUDE.md) — Projektregeln und Konventionen
- [docs/DESIGN-LANDO.md](docs/DESIGN-LANDO.md) — Design-System im Stil von landonorris.com (D-078)
- [Prompt.md](Prompt.md) — ursprüngliche Aufgabenstellung
- [ideen.md](ideen.md) — Ideensammlung; [docs/BIERPONG.md](docs/BIERPONG.md) — zwei Entwürfe für einen Bierpong-Counter mit Mockups (nicht umgesetzt)

## Betrieb auf dem Raspberry Pi

Der Betrieb funktioniert genauso auf einem Laptop (`npm start`, TV-Browser im
Vollbild auf `/tv` — F11 in Chrome); die Pi-Anleitung bleibt für den Fall der
Fälle erhalten.

Anleitung in [deploy/PI-SETUP.md](deploy/PI-SETUP.md): systemd-Service
([deploy/partykeller.service](deploy/partykeller.service)), mDNS-Name
`partykeller.local`, TV im Chromium-Kiosk-Modus auf `/tv`, Backup der
`data/partykeller.db`. Konfiguration über `.env` (siehe `.env.example`).

## Lizenz

[MIT](LICENSE) — frei verwendbar, auch für den eigenen Keller.

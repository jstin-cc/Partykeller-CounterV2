# PROGRESS.md — Meilensteine & Status

Nach jedem abgeschlossenen Schritt hier abhaken und committen. Diese Datei ist
die Wahrheit über den Projektstand (Kontextverlust-sicher). Der ältere Verlauf
(bis 2026-10-16), die abgehakten Meilensteine M0–M8 und die
Verifikationsprotokolle stehen wortgleich in
[docs/PROGRESS-ARCHIV.md](docs/PROGRESS-ARCHIV.md).

**Aktueller Stand:** Alle Meilensteine M0–M8 abgeschlossen — die App ist
funktional komplett und end-to-end im Browser getestet: zwei Bereiche
(Partykeller, Youngstars) mit Auswahlseite, Anmeldung mit Onboarding,
Dashboard mit Profil-Tab und Jahresrückblick, TV-Scoreboard mit QR und großen
Momenten, Admin mit Getränke-Protokoll und Effekt-Demo, Abend-Archiv mit
Hall of Fame, CSV-Export und Story-Bild.

## Offen

- [ ] Echter Testlauf vor Ort: 2 Handys + TV im WLAN (M7; Betrieb läuft
      voraussichtlich auf einem Laptop statt auf dem Pi), dabei Höhenlinien
      und Einblendungen im Kiosk-Chromium; Test auf einem echten iPhone.
- Ideen zur Auswahl, noch nichts entschieden:
  - [docs/INSPIRATION-LANDO-2.md](docs/INSPIRATION-LANDO-2.md): L6–L8,
    L10–L14, L16, L17, L19
  - [docs/INSPIRATION-3.md](docs/INSPIRATION-3.md): L22, L25–L29
  - [docs/INSPIRATION-4.md](docs/INSPIRATION-4.md): L30–L32, L35–L38
  - [docs/INSPIRATION-DESIGN.md](docs/INSPIRATION-DESIGN.md): D1, D2, D4–D9
  - [docs/IDEEN.md](docs/IDEEN.md) und [docs/BIERPONG.md](docs/BIERPONG.md):
    Duell-Modus, Abend-Tipprunde, Bierpong
  - Anmeldeseite, Kopf: H3 (Wochentag) gefällt, Feinschliff H3a–H3e in
    [docs/inspiration/anmeldung-kopf-3.html](docs/inspiration/anmeldung-kopf-3.html);
    übrige Ideen H1–H5 in
    [docs/inspiration/anmeldung-kopf-2.html](docs/inspiration/anmeldung-kopf-2.html)
    (O4 umgesetzt; O1–O3, O5 in anmeldung-details.html weiter offen)

## Verlauf

Neueste oben. Wird der Verlauf lang, wandern ältere Einträge wortgleich ins
Archiv.

Seit 2026-11-05: **Jahresrückblick überarbeitet** (D-128) — jede Story-Seite
hat ihre Farbstimmung (dunkel, Orange, Creme, Navy; Getränkeseite in der
Farbe des Lieblingsgetränks), die neue Farbe geht beim Blättern als Kreis vom
Tippunkt auf. Neue Grafiken: Jahreszahl als Umriss hochkant am Rand,
Getränkebalken, randlose Abendkurve mit Spitzenpunkt, Stempelkarte auf
Creme, 24-Stunden-Zifferblatt mit Zeiger, Kräftemessen-Balken beim Rivalen,
gekreuzte „Prost“-Laufbänder auf der orangen Abschlussseite; Kringel unter
Serif-Wörtern, feines Filmkorn. Geprüft in der Demo (375×812 und 360×640,
schnelles Tippen, Schließen auf farbiger Seite, Öffnen aus der Kachel).

Seit 2026-11-04: **Krone gezeichnet** — „Du führst!“ in der Ranglisten-Karte
zeigt statt des 👑-Emojis eine flache SVG-Krone in Akzentfarbe, passend zu ▲/▼.

Seit 2026-11-04: **Abschnittszeile ohne Quadrat** — `.sec-title` hat kein
oranges Quadrat mehr davor („Rangliste“, „Rückblick“, Onboarding-Vorschau).

Seit 2026-11-04: **Rückblick-Karte mit Abschnittszeile** — „Rückblick“ im
Profil steht jetzt wie „Rangliste“ als `.sec` (Quadrat + auslaufende Linie),
auf Orange in Akzent-Tinte.

Seit 2026-11-04: **Fußkarte zeigt den Abend** — statt „Stand heute Abend“
steht oben in der Abschiedskarte des Dashboards der Abend-Name (D-028), sonst
das Datum („Mi, 04.11.“). Der Server liefert dafür `todayName` im State.

Seit 2026-11-04: **Entwurf Wochentag im Kopf** — `docs/inspiration/anmeldung-kopf-3.html`:
H3a mit Datum darüber, H3b direkt am Titel, H3c schräg mit Kringel, H3d hell
mit orangem Punkt, H3e riesig und blass im Hintergrund. Der Wochentag folgt
dem Party-Abend (bis 6 Uhr der Vortag, D-005). Noch nichts entschieden.

Seit 2026-11-04: **Entwurf Kopf, Runde zwei** — `docs/inspiration/anmeldung-kopf-2.html`:
H1 „● 7 heute da“ rechts in der Titelzeile (Legende zum Punkt), H2 Titel als
Laufband, H3 Wochentag in der orangen Serif, H4 Karteireiter (die Linie über
der Liste hebt sich um den Titel), H5 Umriss füllt sich (Idee D5).
Vorschlag: H4 + H1. Noch nichts entschieden.

Seit 2026-11-04: **„Heute da“-Punkt in der Anmeldeliste** (D-127, Entwurf O4
ohne Puls) — wer am laufenden Abend schon etwas gezählt hat, bekommt einen
orangen Punkt unten rechts am Namenskreis. `GET /api/players` liefert dafür
`today` (nur ja/nein). Der Punkt sitzt neben dem Kreis, nicht darin, damit er
beim Anmelden nicht mit in den Dashboard-Kopf gleitet. Geprüft in der Demo
(neues Konto ohne Getränk ohne Punkt, Anmelden bis ins Dashboard).

Seit 2026-11-04: **Entwurf kleine Details für die Anmeldeseite** —
`docs/inspiration/anmeldung-details.html`: O1 Kringel unter „Anmeldung“,
O2 Kontozahl als orange Serif-Hochzahl, O3 Umriss-Zahl hinter der Titelzeile
(Idee D6), O4 „Heute da“-Punkt am Namenskreis (bräuchte ein Feld mehr in
`/api/players`), O5 Auftakt (Titel wischt herein, Linie zeichnet sich).
Vorschlag: O1 + O2 + O4 + O5. Noch nichts entschieden.

Seit 2026-11-04: **Anmeldeseite mit schlichtem Kopf** (D-126, Entwurf N1 ohne
„Neu hier“) — das Logo steht oben rechts in der Kopfleiste wie im Dashboard,
darunter nur „Anmeldung“ als Titelzeile, dann die Liste (unverändert). Weg
sind „Wer bist du?“ mit Kringel, der „Neu hier“-Sprung und die Zeile „Dein
Konto · 15 Konten“. Am Handy (375 × 667) steht der erste Name bei 126 statt
444 px, sieben Namen sind ohne Scrollen zu sehen. Am Rechner Liste links,
Registrierkarte rechts (klebt beim Scrollen). „Anmeldung“ aus dem Menü
gleitet weiter in die Überschrift.

Seit 2026-11-04: **Entwurf Kopf der Anmeldeseite** —
`docs/inspiration/anmeldung-kopf.html`: die Liste bleibt unverändert, nur der
Kopf wird kleiner, das Logo wandert (außer in K3) in die Kopfleiste. K1 eine
Titelzeile „Wer bist du?“ mit Kringel (erster Name bei 182 statt 444 px),
K2 nur eine Abschnittszeile (118 px), K3 eine kleine Kerbenkarte mit „Neu
hier“ in der Kerbe (256 px). Dazu ohne „Wer bist du?“, nur mit „Anmeldung“: N1 Titelzeile mit „Neu
hier“ daneben (128 px), N2 groß über die ganze Breite (182 px), N3 nur die
Abschnittszeile (118 px). Noch nichts entschieden.

Seit 2026-11-04: **Registrieren mit dem PIN-Blatt** (D-125) — „Neu hier?“
fragt nur noch den Namen. „Konto anlegen“ öffnet das Blatt mit Ziffernblock:
„PIN festlegen“, dann „PIN wiederholen“ (passen sie nicht: Punkte wackeln rot,
zurück zu „festlegen“), oder „Ohne PIN“ (gleitet in „Weiter“ des
Onboardings). Ein vergebener Name meldet sich schon vor dem Blatt. Geprüft in
der Demo: vergebener Name, falsche Wiederholung, Anlegen mit PIN (Konto
verlangt danach die PIN) und ohne PIN, jeweils bis ins Onboarding.

Seit 2026-11-04: **PIN-Ziffernblock reagiert auch bei schnellem Tippen** —
die Tasten lösen schon beim Aufsetzen des Fingers aus (`pointerdown` statt
`click`); vorher verschluckte der Browser Klicks, wenn sich zwei Berührungen
überlappten oder der Finger beim Loslassen verrutschte. Nach einer falschen
PIN ist die Eingabe sofort wieder frei (vorher gingen Ziffern in den ersten
0,45 s verloren). Tastatur (Enter/Leertaste auf einer Taste, Ziffern,
Rücktaste, Esc) geht weiter.

Seit 2026-11-04: **PIN-Eingabe als Blatt mit Ziffernblock** (D-124, Entwurf
P1) — die aufklappende PIN-Zeile in der Anmeldeliste ist weg. Ein Tipp auf ein
Konto mit PIN öffnet ein Blatt von unten (ab 640 px als Karte in der Mitte):
Namenskreis, Name, vier Punkte, eigener Ziffernblock. Nach der vierten Ziffer
wird sofort angemeldet; eine falsche PIN färbt die Punkte rot, sie wackeln
und leeren sich. Schließen über ✕, Tipp daneben oder Esc; am Laptop gehen auch
Zifferntasten und Rücktaste. Beim Anmelden gleiten Namenskreis und Name aus
dem Blatt in den Dashboard-Kopf. Geprüft in der Demo am Handy (375 px) und am
Rechner: falsche PIN, Löschen, Esc, richtige PIN bis ins Dashboard.

Seit 2026-11-04: **Entwurf neue Anmeldeseite** — `docs/inspiration/anmeldung-neu.html`
(über `ideen-mockups`, Port 3198): Kopf auf eine Zeile „Wer bist du?“
verkleinert, Logo in die Kopfleiste. Liste A (kompakte Zeilen, „Neues Konto“
unten angedockt, 8 von 15 Namen sichtbar), B (Raster, letztes Konto als breite
Kachel, 9 von 15), C (Namensplakat, alle 15). PIN P1 als Blatt mit eigenem
Ziffernblock (Auto-Absenden nach 4 Ziffern, falsche PIN wackelt) oder P2 als
aufgeräumte Inline-Karte. Noch nichts entschieden.

Seit 2026-11-04: **Zählseite passt sich der Displayhöhe an** — am Handy
füllt die Seite genau den Bildschirm: die drei Getränkekarten teilen sich die
freie Höhe bis „Abmelden“ (94–220 px), Name, Plus und Zahl wachsen mit der
Kartenhöhe (Container-Einheiten), die Tageszahl mit der Displayhöhe. Geprüft
auf 375 × 667 (unverändert kompakt), 390 × 844, 430 × 932 und 532 × 1100.
Seit 2026-11-04: **Zählseite passt aufs Handy** — Entwurf A aus
[docs/inspiration/zaehlen-kompakt.html](docs/inspiration/zaehlen-kompakt.html)
umgesetzt (nur unter 960 px): kleinerer Kopf, flachere Umschalter, Tageszahl
84 statt 112 px, Getränkekarten 94 statt 124 px. Auf 375 × 667 endet die
Mischen-Karte bei 636 px statt 802 px; Andocken und Profil-Tab geprüft,
Desktop unverändert.
Seit 2026-11-04: **Getränkeknöpfe ohne „Heute“** — die Zahl auf den
Bier/Shots/Mischen-Karten (Dashboard und Onboarding-Vorschau) steht allein.
Seit 2026-11-04: **Design angeglichen** — Menüknopf überall 44 px (Archiv
und Admin waren kleiner, der Morph sprang); die Fußkarte des Dashboards ist
jetzt Baustein `.farewell` in theme.css und steht so auch im Archiv (statt der
eigenen Karte mit Schimmer; Etikett „Nach oben“ auf Creme dunkel, ohne
Hex-Wert); Blatt von unten nur noch als `.sheet` aus theme.css (Rangliste im
Dashboard, Protokoll-Blatt im Admin; gemeinsame Höhe, Kante und Abgang). In
der Demo-Instanz am Handy und Rechner geprüft.
Seit 2026-10-29 (D-123): **Server-Status im Admin** — verbundene Geräte
nach TV/Handys/Admin, Adresse im WLAN mit „Als QR“, letzte automatische
Sicherung, Laufzeit; alle 10 s neu. In der Demo-Instanz geprüft (Zählung je
Art, QR übernehmen, Sicherung erscheint nach dem ersten Getränk, Desktop und
Handy ohne Überlauf).
Seit 2026-10-29 (D-121, D-122): **Automatische Sicherung und TV-Neuladen**
— das erste Getränk eines Abends legt je Bereich eine Sicherung nach
`data/backups/` (drei rollierend, gitignored); der TV lädt nach einem Update
selbst neu, wenn sich `public/` geändert hat. In der Demo-Instanz geprüft:
eine Sicherung beim ersten Getränk, keine beim zweiten, nach vier älteren
bleiben drei; Neustart ohne Änderung lässt den TV stehen, mit geänderter
Datei lädt er neu.
Seit 2026-10-29 (D-120): **Tipps ohne WLAN puffern** — das Dashboard
zählt bei Verbindungsabriss sofort weiter und reicht die Tipps nach dem
Wiederverbinden (auch nach Neuladen) zur Tippzeit nach; der Server erkennt
doppelte Tipps an ihrer Kennung (Tabelle `taps`). In der Demo-Instanz
geprüft: online +1, offline drei Tipps mit sofortiger Anzeige, Nachreichen
nach dem Wiederverbinden, Neuladen mit wartenden Tipps, doppelter Tipp zählt
einmal, ungültige Kennung abgelehnt.

Seit 2026-10-29: **Strich unter „Zugang“** — beim Admin-Login lag der
Kringel auf den Buchstaben, jetzt sitzt er wie auf den übrigen Seiten darunter.
Seit 2026-10-27 (D-119): **SV-Logo auf dem Youngstars-TV** — der TV zeigt
in beiden Bereichen links das Logo vor der Wortmarke; auf den übrigen
Youngstars-Seiten bleibt es weg.
Seit 2026-10-27 (D-118): **Weniger Kringel** — höchstens einer pro Seite im
Kopf, dazu nur noch die mit Bedeutung (neue Nr. 1, Sprung zu einem Abend,
Pfeile, Menü-Strich, Unterschrift). Weg sind die Kringel unter „Zentrale“
(Admin), dem TV-Titel, „nächsten“ (Archiv-Fuß), „Abende“ (Archiv leer) und
„live“/„Profil“ (Onboarding). In der Demo-Instanz geprüft.
Seit 2026-10-24 (D-117): **DECISIONS.md neu geschrieben** — nach Themen
geordnet, beschreibt nur noch, was heute gilt (je Regel die D-Nummern in
Klammern, unten ein Verlauf je Nummer); alle Einträge D-001–D-116 stehen im
alten Wortlaut in `docs/DECISIONS-ARCHIV.md`. Regel 2 in CLAUDE.md
entsprechend geändert.
Seit 2026-10-24 (D-116): **Doku aufgeräumt** — 8 vollständig abgelöste
Entscheidungen wortgleich nach `docs/DECISIONS-ARCHIV.md`, der Verlauf bis
2026-10-16 samt Meilensteinen M0–M8 und Verifikationen wortgleich nach
`docs/PROGRESS-ARCHIV.md`; hier stehen nur noch Stand, Offenes und der
jüngste Verlauf.
Seit 2026-10-24 (D-115): Rekordkurs-Pille auf dem TV wieder mit dem alten,
kurzen Text (der Satz aus D-113 war zu lang).
Seit 2026-10-24 (D-114): Im Admin wieder „Danger Zone" und „Backup" (die
Umbenennung aus D-113 war nicht gewünscht).
Seit 2026-10-24 (D-113): **Feinschliff nach Gesamtdurchsicht** — Story-Bild
mit der Wortmarke des Bereichs, Profil-Stapel „Gesamt / nach …“, Mischen-
Gesamtzahl lesbar, Archiv ohne Laufband und mit Hall of Fame als Bestenliste
der Abendsiege, Anmeldung und Archiv-Fuß ohne Doppeltes, TV-Liste
rückt zusammen statt wegen einer Zeile zu rotieren,
tote CSS-Regeln raus. In der
Demo-Instanz geprüft (beide Bereiche, Handy, Desktop, TV 1600 × 900 und
1280 × 720 mit vielen Teilnehmern, Story-Bild Youngstars).
Seit 2026-10-24 (D-112): **Meilenstein-Bild öfter** — die Hausmarke fällt
jetzt bei jedem 50. Getränk im Bereich statt bei jedem 500.; persönliche
Marken unverändert.
Seit 2026-10-24 (D-111): **Höhenlinien am PC wie am Handy** — das Leuchten
folgt nicht mehr der Maus, sondern ein unsichtbarer Finger wischt ab und zu
in einem Bogen darüber, ein Klick leuchtet auf; Verwirbelung und Verbiegen
der Linien halbiert; CSS-Lichtkreis ohne WebGL2 entfernt. Am Desktop in
der Demo-Instanz geprüft (Wischer, Klick, keine Konsolenfehler).

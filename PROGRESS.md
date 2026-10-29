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

## Verlauf

Neueste oben. Wird der Verlauf lang, wandern ältere Einträge wortgleich ins
Archiv.

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

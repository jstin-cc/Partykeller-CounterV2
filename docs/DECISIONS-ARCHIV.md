# DECISIONS-ARCHIV.md — abgelöste Entscheidungen

Einträge aus [DECISIONS.md](../DECISIONS.md), die von späteren Entscheidungen
vollständig abgelöst sind. Der Text jedes Eintrags ist unverändert; darüber
steht nur, welcher Eintrag ihn ablöst. Teilweise überholte Einträge bleiben
in DECISIONS.md.

> Abgelöst durch D-018 (PIN wieder optional pro Konto).

## 2026-07-14 · D-002: PIN ist verpflichtend

**Entscheidung:** Jeder Account braucht eine PIN (4-stellig). Anlegen nur mit
PIN, Login nur mit PIN. Admin kann PINs zurücksetzen (`setPin`).

**Begründung:** Vom Nutzer so entschieden — bewusste Abweichung von der
Empfehlung in Prompt.md („optional, standardmäßig aus"). Schützt Accounts
gegen Spaß-Einträge anderer Gäste. Konsequenz: Der Login-Screen braucht
immer ein PIN-Feld, und der Admin braucht eine PIN-Reset-Funktion für
vergessene PINs.

> Abgelöst durch D-009 (finale Bild-Assets).

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

> Abgelöst durch D-078 (Redesign ohne Glas-Optik und ohne `backdrop-filter`).

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

> Abgelöst durch D-055 und D-056 (Verlauf über die Deckkraft ganzer Zeilen).

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

> Abgelöst durch D-058 und D-059 (Position der Teilnehmerzahl).

## D-057 (2026-09-24): TV-Teilnehmerzahl links neben der QR-Pille

**Entscheidung:** Im TV-Kopf steht der Block aus Teilnehmerzahl, Summen und
Rekordkurs-Pille nicht mehr oben in der Mitte. Er sitzt jetzt linksbündig
direkt links neben der QR-Pille, und beide bilden rechts eine Gruppe. Die
Kopfzeile besteht damit aus zwei Gruppen: links Logo und Titel, rechts
Zahlen und QR-Code.

**Begründung:** Wunsch des Nutzers. Die Mitte bleibt frei, und die
Kennzahlen stehen beim QR-Code gebündelt.

> Abgelöst durch D-059 (Position der Teilnehmerzahl).

## D-058 (2026-09-24): TV-Teilnehmerzahl rechts neben der QR-Pille

**Entscheidung:** Der Block aus Teilnehmerzahl, Summen und
Rekordkurs-Pille steht rechtsbündig ganz rechts im TV-Kopf, also rechts
neben der QR-Pille. Das ersetzt die Position aus D-057 links neben der
QR-Pille.

**Begründung:** Der Nutzer hatte „links“ geschrieben, aber „rechts“
gemeint.

> Abgelöst durch D-085 und D-086 (Morph statt Vorhang, Vorhang entfernt).

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

> Abgelöst durch D-098 (Name fliegt in die Kopfleiste).

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

# Inspiration, Runde 2: Entwürfe L6–L16 (Stand 2026-10-14)

**Status:** L9, L15 und L18 umgesetzt (D-093), der Rest sind Vorschläge. Grundlage ist das Design-System
aus [DESIGN-LANDO.md](DESIGN-LANDO.md) (D-078 bis D-092). Was dort schon steht
(Höhenlinien-Strömung, Kerben-Karten, Kringel, Wortmarke, Morphs,
Flächenwechsel, Laufband), wird hier nicht noch einmal vorgeschlagen.

Quellen:
- [landonorris.com](https://landonorris.com/) mit Start, „On Track“ und
  „Calendar“ (erneut angesehen am 2026-10-14). Die Seite ist von OFF+BRAND und
  hat im April 2026 den DesignRush-Award gewonnen.
- [charlesleclerc.com](https://charlesleclerc.com/) (Apart, Awwwards Site of
  the Day im April 2025).
- Die TV-Grafiken der Formel 1 (Timing-Tower) und gängige Muster aus
  Zähl- und Rückblick-Apps.

Alle Ideen kommen ohne Fotos, ohne neue Abhängigkeit und ohne Internet aus.
Die Zählseite bleibt sofort bedienbar, und es gibt keine Erklärtexte (D-079).

## Neu auf landonorris.com gesehen

| Element | Wo | Übertragung |
|---|---|---|
| Riesige Zahl, vom Rand angeschnitten, Etikett daneben („49 PODIUMS“) | On Track | L6 Profil, L13 Archiv |
| Nachkommastellen klein hochgestellt („6 .28“), Ordinalzahlen hochgestellt („2ND“), Einheiten klein („308.728 KM“) | On Track, Calendar | L7 überall |
| Feature-Karte für das nächste Rennen: Umriss in Lime, Titel hochkant, Datenraster, Strecke als Leuchtlinie, Zeitplan mit hervorgehobener Zeile | Calendar | L8 Archiv |
| Helm-Karten nur als Umriss: dunkle Fläche, 1-px-Linie folgt der Kerbe, Jahr in Akzentfarbe | Helmets Hall of Fame | L9 Abzeichen |
| Zwei riesige Zeilen laufen gegeneinander, oben Serif in Lime, unten Grotesk, Porträt in der Mitte | Message from Lando | L10 Archiv / TV-Pause |
| Dunkler Abschnitt endet in einem gewölbten Bogen | vor „World Drivers' Champion“ | L11 Flächenwechsel |
| Fußzeile als eingesetzte Karte mit Lasche oben, Akzent-Verlauf dahinter | Footer | L12 Archiv-Ende |
| Kleines „Next Race“-Kästchen, unten links fixiert, mit Haarlinien-Raster | Start | L14 Anmeldung |
| Ladebild ganz in Lime mit Logo und Mini-Zeile | Calendar | L15 Kaltstart |
| Riesiger Kritzel quer über einer Überschrift | Calendar | L16 Rekord-Momente |
| Jahreszeilen als Akkordeon mit Pfeil in Akzentfarbe | Calendar (All Results) | in L13 |

Weggelassen sind Foto-Collagen (Schwarzweiß, in Farbe beim Hover), der
3D-Helm, „Tap to lock“, der Kartenfächer bei „Socials“ (kein Inhalt dafür) und
der Slogan in der Fußzeile, weil er Fülltext wäre.

Von charlesleclerc.com gibt es wenig Brauchbares. Die Seite sperrt das
Scrollen, und ein Raster als Hintergrund hätte neben den Höhenlinien keinen
Platz. Höchstens das Kapitel-Menü oben rechts passt zu L13.

## Aus anderen Quellen

| Muster | Herkunft | Übertragung |
|---|---|---|
| Ziffern rollen wie ein Zählwerk, statt hart zu wechseln | Zählwerke, Anzeigetafeln | L17 Dashboard + TV |
| Timing-Tower: Kürzel, Abstand zum Vordermann, ▲▼ bei Positionswechsel, Farben für Bestwerte (Lila = Rekord, Grün = persönliche Bestleistung) | F1-TV-Grafik | L18 TV |
| Kurzes Vibrieren beim Tippen (nur Android, iOS kann es im Browser nicht) | native Zähl-Apps | L19 Dashboard |

---

## L6 – Profil: eine Zahl, die den Bildschirm füllt
Wie „49 PODIUMS“. Die All-Time-Getränke stehen so groß, dass sie rechts vom
Rand angeschnitten werden. Daneben steht das Etikett „GETRÄNKE“ in der
Grotesk und darunter „SEIT 2025“ in der Serif. Darunter zwei kleinere
Riesenzahlen nebeneinander: „ABENDSIEGE“ und „BESTER ABEND“. Das ersetzt das
heutige dreispaltige Statistik-Raster. Die Zahlen zählen beim Sichtbarwerden
hoch (`countUp`).

## L7 – Typo-Feinheiten bei Zahlen
- Ø pro Abend als „6“ mit kleinem, hochgestelltem „,3“.
- Platz als „2“ mit kleinem, hochgestelltem Punkt bzw. „PL.“.
- Einheiten klein und gedämpft neben großen Zahlen („23 GETR.“, „4 STD“).
Das ist eine Regel in theme.css (`.num sup`, `.num .unit`) und betrifft alle
Seiten.

## L8 – Archiv: „Letzter Abend“ als Feature-Karte
Wie die Austin-Karte im Kalender. Sie hat einen Umriss in `--accent` mit
Kerbe. Links steht hochkant „MI 14.10.“. Oben liegt ein Datenraster mit
Getränken, Gästen, Dauer und Spitzenstunde. In der Mitte ist die Kurve des
Abends als Leuchtlinie gezeichnet, wie die Strecke, und zeichnet sich beim
Einblenden selbst. Rechts steht die Top 3 als kleine Tabelle, der Sieger in
Akzentfarbe hervorgehoben wie die Zeile „RACE“. Am Handy steht alles
untereinander, das Datum quer.

## L9 – Abzeichen als Umriss-Kerbenkarten mit eigenen Strich-Icons
Die Emojis (🎖👑🥇🌙⚡🍹) sind das letzte Stilbruch-Element im Profil. Jedes
Abzeichen wird eine kleine Karte nur als Umriss, wie die Helm-Karten. In der
Mitte sitzt ein Strich-Icon im Stil von Lorbeer und Kringel: Krone, Mond,
Blitz, Glas, Medaille, Uhr. Unten rechts in der Kerbe stehen Name und „×4“
in Akzentfarbe. Erreichte Abzeichen bekommen Linie und Icon in `--accent`,
die anderen bleiben in `--line-strong`. Zwei Spalten am Handy.

## L10 – Gegenläufiges Doppel-Laufband
Das Archiv-Laufband wird zweizeilig. Oben laufen die Siegernamen in der Serif
in Akzentfarbe nach links, unten die Zahlen in der fetten Grotesk nach
rechts („14 ABENDE · 654 GETRÄNKE · …“). In der Mitte kann das Logo stehen.
Auf dem TV wäre das der Bildschirm, wenn gerade niemand trinkt.

## L11 – Gewölbte Kante beim Flächenwechsel
Im Archiv endet der dunkle Abschnitt vor der Creme-Fläche in einem flachen
Bogen statt einer geraden Kante. Das ist ein `clip-path: ellipse()` bzw. ein
SVG-Pfad am Abschnittsende, und die Kante kann beim Scrollen leicht
nachfedern.

## L12 – Archiv-Ende als eingesetzte Karte
Die letzte Fläche des Archivs ist eine Karte mit Lasche oben und
Höhenlinien darin. Sie enthält groß die Wortmarke, die Links „Zählen“,
„Profil“ und „CSV“ und unten ein Laufband mit den Namen aller Gäste. Das
ersetzt den heutigen schlichten Schluss.

## L13 – Archiv: Jahre und Monate als Akkordeon
Wie „All Results“. Die Chronik bekommt je Monat eine große Zeile mit
Monatsname, Abenden, Getränken, Sieger und Pfeil in Akzentfarbe. Aufgeklappt
erscheinen die Abende. Je länger das Archiv wird, desto mehr lohnt sich das.
Oben steht optional eine riesige angeschnittene Zahl wie in L6.

## L14 – Anmeldung: Live-Kästchen „Heute“
Unten links, wie das „Next Race“-Kästchen. Es hat ein Haarlinien-Raster mit
„HEUTE“, Getränken, Gästen und dem aktuellen Führenden und zählt live über
den WebSocket mit. Ohne laufenden Abend zeigt es den letzten Abend. Am Handy
steht es über der Kontenliste.

## L15 – Kaltstart-Bild in Orange
Nur beim ersten Öffnen (PWA-Start, neuer Tab): eine Fläche in `--accent` mit
dem Logo in der Mitte, die nach dem Laden nach oben wegwischt. Höchstens
0,6 s lang, nie bei Seitenwechseln innerhalb der App, nie vor dem Zählen
blockierend.

## L16 – Kritzel bei Rekorden
Bei einem neuen Hausrekord oder einem neuen persönlichen Bestwert zeichnet
sich ein großer, wilder Kritzel quer über die Zahl, statt nur des
Unterstreich-Kringels. Das gilt auf dem TV und im Dashboard.

## L17 – Rollende Ziffern
Ändert sich eine Zahl (Getränke heute, Zähler auf den Getränkekarten,
TV-Gesamt), rollt nur die Ziffer, die sich ändert, nach oben heraus, und die
neue rollt von unten nach. Jede Ziffer ist eine Spalte mit `overflow: hidden`
und `transform`, ohne Layout-Sprünge. Mit „Bewegung reduzieren“ wechselt die
Zahl sofort.

## L18 – TV-Rangliste als Timing-Tower
- Hinter dem Namen steht der Abstand zum Vordermann („+3“), beim Ersten
  „FÜHRT“.
- Wer Plätze gewinnt oder verliert, bekommt für einige Sekunden ▲2 oder ▼1
  in Grün bzw. Rot. Die Zeile gleitet an ihren neuen Platz (FLIP).
- Wer gerade seinen persönlichen Bestwert übertrifft, bekommt seine
  Gesamtzahl in Grün, wer den Hausrekord bricht, in Lila. Das sind die
  F1-Sektorfarben und für jeden Fan sofort lesbar.

## L19 – Haptik beim Tippen
Ein `navigator.vibrate(12)` bei jedem +1 und ein doppelter Puls beim
Rückgängig. Auf iOS passiert nichts, dort schadet es nicht.

## Vorschlag zur Reihenfolge

1. **L17 + L7**: kleine Änderungen, die bei jeder Zahl in der App wirken.
2. **L9**: entfernt den letzten Stilbruch (Emojis).
3. **L18**: macht den TV lebendiger, genau dann, wenn alle hinschauen.
4. **L6 + L8**: der größte Lando-Effekt in Profil und Archiv.
5. Der Rest nach Geschmack: L10, L11, L14, L16, L19. L12, L13 und L15
   lohnen sich eher später.

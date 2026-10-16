# Inspiration, Runde 4: Entwürfe L30–L38 (Stand 2026-10-16)

**Status:** Vorschläge, nichts davon ist umgesetzt. Mockups im echten Theme
(mit Animationen): [inspiration/l30-l38.html](inspiration/l30-l38.html).
Was schon in den Runden davor steht ([INSPIRATION-LANDO.md](INSPIRATION-LANDO.md),
[INSPIRATION-LANDO-2.md](INSPIRATION-LANDO-2.md), [INSPIRATION-3.md](INSPIRATION-3.md),
[INSPIRATION-DESIGN.md](INSPIRATION-DESIGN.md)) oder in der App läuft, wird
hier nicht noch einmal vorgeschlagen. Diesmal bewusst weg von F1: Kneipe,
Festival, Nightlife.

Quellen (angesehen am 2026-10-16):
- Awwwards, Sites of the Day: [Santioni Spirits](https://www.awwwards.com/sites/santioni-spirits)
  (SOTD 05.10.2026, Einschenken per Maus, Comic-Erzählung),
  [OFFFForum](https://www.awwwards.com/sites/offfforum) (SOTD 16.10.2026,
  Festival-Line-up und Programm), [The Tie-break](https://www.awwwards.com/sites/the-tie-break)
  (SOTD 25.09.2026, spielerische Übergänge).
- Dribbble: Festival-Plakate
  ([4848 2026 Festival Lineup Poster](https://dribbble.com/shots/27503916-4848-2026-Festival-Lineup-Poster),
  [Northlands Lineup Marquee](https://dribbble.com/shots/23421864-Northlands-Music-Festival-Lineup-Marquee)),
  Bons ([Digital Receipt UI](https://dribbble.com/shots/27720938-Digital-Receipt-UI-Restaurant-Mobile-App)),
  Nightlife ([Nightlife App UI](https://dribbble.com/shots/26545980-Nightlife-App-UI),
  [Membership reward Nightlife](https://dribbble.com/shots/27118371-Membership-reward-Nightlife-iOS-Mobile-App)),
  Serien ([Streak animation](https://dribbble.com/shots/26703203-Streak-animation-with-sound-design)),
  Trink-Tracker (Suche „drink tracker app“, Wasserstand mit Welle und Blasen).
- Codrops, Tutorials Oktober 2026:
  „Typography That Leaves a Trace: Scroll-Driven Ghost Trails“ (13.10.) und
  die Pixel-Überblendung aus „Minimal Architecture Studio Landing Page“
  (09.10.), siehe [Codrops-Tutorials](https://tympanus.net/codrops/category/tutorials/).

Alles ohne Fotos, ohne neue Abhängigkeit, ohne WebGL und ohne Internet. Keine
Erklärtexte (D-079).

## Gesehen und übertragen

| Muster | Herkunft | Übertragung |
|---|---|---|
| Strichliste mit Querstrich, Bierdeckel als Fläche | Kneipe, Dribbble-Bons | L30 Bierdeckel |
| Bon mit Zackenrand, gepunktete Führungslinien, Barcode | Dribbble „Digital Receipt UI“ | L31 Abend-Bon |
| Line-up mit Rangstufen, Namen durch Punkte getrennt | Festival-Plakate auf Dribbble, OFFFForum | L32 Line-up des Abends |
| Umriss-Kopien laufen der Schrift nach | Codrops „Ghost Trails“ | L33 Geisterspur |
| Stempel- und Bonuskarten im Club | Dribbble „Membership reward Nightlife“ | L34 Stempelkarte |
| Pulsierende Flamme, große Serif-Zahl | Dribbble „Streak animation“ | L35 Serie |
| Wasserstand mit Welle, Blasen; Einschenken als Interaktion | Trink-Tracker auf Dribbble, Santioni Spirits | L36 Schwappen |
| Orange Lichtstreifen auf Schwarz | Dribbble „Nightlife App UI“ | L37 Lichtstreifen |
| Raster aus Kacheln deckt ab und gibt frei | Codrops, Pixel-Überblendung | L38 Pixel-Wechsel |

Weggelassen: 3D-Flaschen und Eingieß-Simulationen in WebGL (zu schwer für
Handy und Pi), Fotos von Gästen (kein Upload), Fortschrittsringe auf ein
Trinkziel (wie in Runde 3: mehr trinken ist kein Ziel).

---

## L30 – Strichliste auf dem Bierdeckel
Im Zählen-Tab steht statt (oder über) den Heute-Zahlen ein runder Deckel in
Off-White. Jedes Getränk ist ein Strich in seiner Farbe, der fünfte quer
durch. Neue Striche zeichnen sich wie die Kringel (`drawScribble`), mit
leichtem Zittern, damit es von Hand aussieht. Rand mit „Partykeller · Heute“
als Kreisschrift.
Daten: Reihenfolge der heutigen Getränke (Protokoll). Aufwand: klein.

## L31 – Abend-Bon
Im Abend-Archiv (und als Abschluss am Morgen danach) ein Kassenbon des
eigenen Abends: Posten je Getränk mit Uhrzeit des ersten, Summe groß, Platz,
letztes Getränk, Barcode, „Prost & bis Samstag“ in der Serif. Der Bon fährt
zeilenweise aus einem Schlitz. Als Bild speicherbar wie die Story (D-095).
Daten: Protokoll des Abends. Aufwand: mittel (Bild-Export wie `story.js`).

## L32 – Line-up des Abends
Auf dem TV nach Mitternacht oder im Archiv: alle Gäste als Festival-Plakat.
Sieger riesig in Orange, dann Stufen nach Getränken, Namen mit ● getrennt,
kleine Zahl hochgestellt. Stufen steigen nacheinander ein. Fußzeile mit Gästen,
Getränken und letzter Uhrzeit.
Daten: Rangliste des Abends. Aufwand: klein.

## L33 – Geisterspur beim Überholen
Wenn jemand in der TV-Rangliste nach oben rückt, ziehen vier Umriss-Kopien
seines Namens hinterher und verblassen; die Überholten dimmen kurz ab. Ergänzt
den Timing-Tower (L18), der bisher nur gleitet.
Daten: vorhanden. Aufwand: klein (CSS-Animation, Kopien nur während der
Bewegung).

## L34 – Stempelkarte der Abende
Im Profil ein Raster aller Party-Abende der Saison: dabei = Stempel mit Datum,
leicht schräg, Abendsiege gefüllt in Orange; verpasst = gestrichelter Kreis.
Der neueste Stempel schlägt mit Federn auf. Belohnt Dabeisein statt Trinken.
Daten: Abende der Saison (Archiv) und eigene Teilnahme. Aufwand: klein.

## L35 – Serie: Abende in Folge
Zahl der Party-Abende in Folge, an denen man dabei war, groß in der Serif mit
pulsierender Flamme darüber; darunter die letzten Samstage als Punkte, der
nächste gestrichelt und blinkend.
Daten: wie L34. Aufwand: klein. Passt mit L34 auf eine Karte.

## L36 – Schwappen beim Tippen
Die Getränkekarte hat unten eine Flüssigkeit in der Getränkefarbe mit Welle,
Schaumkrone und Blasen. Jeder Tipp lässt sie schwappen und ein Stück steigen,
um 6 Uhr ist sie wieder leer. Rein optisch, kein Ziel, kein Maximum.
Daten: keine neuen. Aufwand: klein; auf schwachen Handys ohne Blasen.

## L37 – Lichtstreifen
Neuer TV-Effekt bei Führungswechsel und für das Plakat (L21): diagonale orange
Lichtstreifen ziehen über den Bildschirm, der Name blendet dabei auf. Auch
als Knopf in der Effekt-Demo (D-099).
Daten: vorhanden. Aufwand: klein (CSS, `filter: blur` statt
`backdrop-filter`).

## L38 – Pixel-Wechsel auf dem TV
Beim Wechsel zwischen „Heute“ und „All-Time“ decken orange Kacheln den
Bildschirm in zufälliger Reihenfolge ab und geben die neue Ansicht frei.
Daten: keine. Aufwand: klein; 144 Kacheln mit Transform, ohne Canvas.

## Vorschlag zur Reihenfolge
1. L30 Bierdeckel und L36 Schwappen: sofort am Handy spürbar.
2. L32 Line-up und L33 Geisterspur: machen den TV zum Event.
3. L34/L35 zusammen als Profil-Karte.
4. L31 Abend-Bon, dann L37/L38 als Feinschliff.

# Entwurf: Auswahlseite Partykeller / Youngstars (Stand 2026-10-16)

**Status:** Entwurf, noch nicht umgesetzt. Wunsch des Nutzers: den
Youngstars-Bereich wieder hinzufügen, im genau gleichen Design wie der
Partykeller. Mockup im echten Theme (mit Animationen, Umschalter `?v=1|2|3`):
[inspiration/start-auswahl.html](inspiration/start-auswahl.html).

Beide Bereiche sehen gleich aus und unterscheiden sich nur über die
Wortmarke („Party / Keller“, „Young / Stars“). Zahlen im Mockup sind
Platzhalter; in echt kämen sie aus dem öffentlichen `/state` beider Bereiche.

## Quellen (angesehen am 2026-10-16)

- [landonorris.com](https://landonorris.com/): Abschnitt „On Track / Off
  Track“, zwei gleich gebaute Hälften (kleine Zeile über großem Wort, ganze
  Fläche als Link). Wichtigstes Vorbild.
- Awwwards-Elemente [Big font Menu](https://www.awwwards.com/inspiration/big-font-menu)
  und [Typographic hover](https://www.awwwards.com/inspiration/typographic-hover):
  riesige Versal-Zeilen mit Hover-Reaktion.
- Split mit Hover-Wachsen: [Expanding Split-Screen Grid Navigation](https://freefrontend.com/code/expanding-split-screen-grid-navigation-2026-02-04/),
  [Framer „Expanding blocks“](https://www.framer.com/marketplace/components/expanding-blocks).
- Dribbble: [Split-Screen-Tag](https://dribbble.com/tags/split-screen); keine
  passende Auswahlseite für zwei gleichwertige Bereiche gefunden.

## Varianten

| | Idee | Mockup |
|---|---|---|
| 1 Split (Empfehlung) | Zwei Kerbenkarten mit riesiger Wortmarke und Live-Zeile (Getränke heute, dabei, vorne), „Zuletzt hier“-Etikett; Maus: Karte wächst, Höhenlinien leuchten, Strich unter der Wortmarke; Tipp: Karte füllt die Bühne, Wortmarke morpht in die Kopfleiste der Anmeldung | `auswahl-v1-*.png` |
| 2 Liste | Bereiche als riesige Zeilen wie im Vollbild-Menü, Hover streicht durch; Handy: Zeilen unten in der Daumenzone | `auswahl-v2-*.png` |
| 3 Karten | Hall-of-Fame-Karten mit heutigem Podest je Bereich | `auswahl-v3-*.png` |

# Design-System „Lando" (D-078)

Seit 2026-09-29 folgt die ganze App der Designsprache von
[landonorris.com](https://landonorris.com/). Diese Datei ist die verbindliche
Design-Quelle (sie löst die Claude-Design-v3-Vorlage ab). Code:
[`public/css/theme.css`](../public/css/theme.css) (Tokens + Komponenten) und
[`public/js/lando.js`](../public/js/lando.js) (Bewegung + Formen). Referenz-
Umsetzung: [`public/start.html`](../public/start.html).

## 1. Was die Seite ausmacht und wie wir es übertragen

| landonorris.com | bei uns |
|---|---|
| Dunkelgrün `#282C20`, Off-White `#F4F4ED`, Neon-Lime `#D2FF00`, Lime-Off `#B2C73A`, Orange `#FF6B00` | 1:1 übernommen. Partykeller = Dunkelgrün + Lime, Youngstars = Fast-Schwarz/Navy `#0F131C` + Orange (Lime wird dort Zweitakzent) |
| Mona Sans fett, Versalien, enge Laufweite, Zeilenhöhe < 0,9 | `.t-impact`, `.t-title`, `.t-h3` |
| Einzelne Wörter in „Brier" (Serif), oft in Lime-Off | Instrument Serif: `<span class="t-serif t-accent">` im Titel |
| Winzige Versal-Zeilen („NEXT RACE", „QATAR, 2024") | `.eyebrow` |
| Höhenlinien als Hintergrund | `.topo` (statisches SVG als Maske, Farbe `--topo-line`), auf Geräten mit Maus `public/js/topo-fluid.js` (Strömungs-Spotlight wie auf landonorris.com: Leuchten fließt der Maus nach, verwirbelt und verblasst, D-081); auf Touch-Geräten wischt ab und zu ein unsichtbarer Finger darüber, ein Tipp leuchtet auf, dazwischen schläft die Simulation (D-089); ohne WebGL2 `.topo-spot` (Lichtkreis unter dem Cursor, nur mit Maus) |
| „Helmets Hall of Fame"-Karten mit Kerbe unten rechts und Etikett darin | `data-notch` + `.notch-tag` (lando.js `notch()`) |
| Handschrift-Kringel und Unterschrift in Lime, die sich selbst zeichnen | `.scribble` / `scribble()` / `data-draw` |
| Lime-Knopf mit ↗, das beim Hover hinaus- und wieder hineinfliegt | `.btn` + `<span class="i-arrow"></span>` |
| Vollbild-Menü mit riesigen Versal-Links, aktiver Link mit Kringel | `.site-menu` + `initMenu()` |
| Wörter gleiten zeilenweise aus einer Maske, Lime-Block wischt über Text | `data-reveal="words"`, `data-reveal="wipe"` |
| Hintergrund wechselt beim Scrollen (dunkel → oliv → creme) | `data-surface="light|dark|black|olive"` + `initSurfaceMorph()` |
| Lorbeer-Emblem mit Mini-Zeile („McLaren F1 since 2019") | `.emblem` + `.laurel` |
| Laufband (Partner-Logos) | `[data-marquee] > .marquee-track` |
| Wortmarke „LANDO / NORRIS" (Serif über fetter Grotesk) | `.wordmark` → „PARTY / KELLER" bzw. „YOUNG / STARS" |
| Seitenübergang | Morph per View Transition (D-085): Elemente, die auf beiden Seiten stehen, gleiten an ihren neuen Platz, die Seite blendet weich über; in Firefox dieselben Morphs per Skript (FLIP, D-087) |
| Easing `cubic-bezier(0.65, 0.05, 0, 1)`, 0,75 s | `--ease`, `--dur` |

Bewusst **nicht** übernommen: Fotos/Collagen (keine Porträts der Gäste), 3D-Helm
und WebGL (zu schwer für den Pi), Scroll-Hijacking. Die Zählseite bleibt sofort
bedienbar — Animationen blockieren nie eine Eingabe.

## 2. Tokens

Alle Farben kommen aus Tokens; nie Hex-Werte in Seiten hart codieren (Ausnahme:
Rohwerte `--lando-*`). Die Bereichsfarben setzt `html[data-area]`; die Klassen
`.area-pk` / `.area-ys` geben einem einzelnen Element die Farben eines Bereichs,
`.surface-light` / `.surface-black` / `.surface-olive` einer Fläche die helle,
schwarze oder olivgrüne Variante.

| Token | Bedeutung |
|---|---|
| `--bg`, `--bg-deep`, `--bg-hi` | Seitengrund, tiefer (Menü, Blätter), heller |
| `--surface`, `--surface-alt`, `--surface-2` | Karte, eingelassene Fläche (Felder), erhabene Chips |
| `--line`, `--line-strong` | Haarlinien (12 % / 24 %) |
| `--topo-line` | Farbe der Höhenlinien |
| `--ink`, `--ink-2`, `--ink-muted`, `--ink-faint` | Schrift: Haupt, Fließtext, gedämpft, sehr leise |
| `--accent`, `--accent-ink` | Akzentfläche (Lime/Orange) und Schrift darauf |
| `--accent-text` | Akzent als Schriftfarbe (Serif-Wörter, lesbar auf dem Grund) |
| `--accent-2`, `--accent-2-ink` | Zweitakzent (Orange bzw. Lime) |
| `--beer`/`--beer-ink`, `--shot`/`--shot-ink`, `--mixc`/`--mixc-ink` | Getränke: Bier = Akzent, Shots = Zweitakzent, Mischen = Creme |
| `--rank-1..3` | Podest: Akzent, Off-White, Zweitakzent |
| `--danger`, `--scrim` | Fehler/Löschen, Abdunklung hinter Blättern |
| `--gain`, `--loss`, `--pb`, `--record` (+ `-ink`) | TV-Timing-Tower: Plätze gewonnen/verloren, persönlicher Bestwert (Grün), Hausrekord (Lila) — Sektorfarben der F1 (D-093) |
| `--radius-sm/--radius/--radius-lg/--radius-xl` | 7 / 10 / 14 / 32 px |
| `--font-sans`, `--font-serif` | Mona Sans / Instrument Serif |
| `--ease`, `--ease-out`, `--ease-spring`, `--dur` | Bewegung |

Alte Namen (`--green`, `--gold`, `--amber`, `--brick`, `--mix`, `--creme`,
`--silver`, `--bronze`, `--glass-edge`, `--hair-gold`) zeigen auf die neuen
Tokens, weil Canvas-Code (seasonfx.js, story.js) sie per `getComputedStyle`
liest. In neuem Code die neuen Namen verwenden.

## 3. Typografie

- `.t-impact` — riesige Versal-Headline (Mona 800, Zeilenhöhe .86, −0,035 em).
- `.t-title` — Abschnittstitel („HELMETS / HALL OF FAME"), `.t-h3` — Kartentitel.
- Akzentwort: `<span class="t-serif t-accent">Heute</span>` innerhalb eines
  Titels. Die Serif wird in Display-Größen automatisch leicht verstärkt.
- `.t-quote` — Zitat in der Serif („It doesn't matter where you start …").
- `.eyebrow` — winzige Versal-Zeile, `.t-body`, `.t-small` — Fließtext.
- `.num` — Zahlen: Mona 800 mit **proportionalen** Ziffern. Keine
  `tabular-nums`: Deren durchgestrichene Null und „1" mit Fuß wirken wie
  Code-Schrift. Spalten über feste Breiten und rechtsbündig ausrichten,
  tickende Anzeigen über eine Mindestbreite.
- Deutsch ohne Gendern; Versalien nur per CSS (`text-transform`), nie im Text.

## 4. Komponenten (Markup)

```html
<!-- Kopfleiste: Wortmarke links, Aktionen rechts -->
<header class="topbar">
  <a class="wordmark" href="./">
    <span class="wm-top only-pk">Party</span><span class="wm-bottom only-pk">Keller</span>
    <span class="wm-top only-ys">Young</span><span class="wm-bottom only-ys">Stars</span>
  </a>
  <div class="topbar-actions">
    <a class="btn btn--sm" href="…">Archiv <span class="i-arrow"></span></a>
    <button class="btn btn--ghost btn--icon" data-menu-toggle aria-controls="site-menu" aria-expanded="false" aria-label="Menü"><span class="i-menu"></span></button>
  </div>
</header>

<!-- Knöpfe -->
<button class="btn">Weiter <span class="i-arrow"></span></button>
<button class="btn btn--ghost">Abbrechen</button>
<button class="btn btn--danger">Löschen</button>
<!-- Varianten: btn--dark, btn--quiet, btn--sm, btn--lg, btn--block, btn--icon -->

<!-- Kerben-Karte: Füllung über --notch-fill, Etikett in der Stufe -->
<article class="…" data-notch="tabW:150;tabH:34;r:14;slant:20" style="--notch-fill: var(--surface)">
  <span class="topo topo--abs notch-clip"></span>   <!-- optional: Linien in der Karte -->
  …Inhalt…
  <span class="notch-tag">22.08. <span class="hl">18</span></span>
</article>
<!-- Optionen: tabW, tabH, r, slant, side:left, stroke (Kontur, Farbe --notch-line).
     Das Etikett steht auf dem SEITENgrund: Schriftfarbe über --notch-tag-ink.
     Das Element bekommt automatisch position: relative (Spezifität 0 – eine
     eigene Positionierung der Seite gewinnt). Rahmen, Hintergrund und
     box-shadow des Elements sind abgeschaltet; Leuchten daher per
     filter: drop-shadow (folgt der Kerbe).
     Dynamisch erzeugte Karten danach mit initNotches(container) oder notch(el, {...}). -->

<!-- Kringel -->
<span class="scribbled">Wort<svg class="scribble scribble--underline" data-draw="300" …></svg></span>
<!-- oder in JS: el.insertAdjacentHTML('beforeend', scribble('circle')); drawScribble(svg) -->
<!-- Formen: underline, circle, arrow, strike, tick, loop, signature (SV-Partykeller-Unterschrift, D-088; mit stretch: false einbinden) -->

<!-- Einblenden -->
<h2 class="t-title" data-reveal="words">Hall of <span class="t-serif t-accent">Fame</span></h2>
<p data-reveal="up" data-delay="200">…</p>
<!-- up | fade | scale | clip | words | wipe; "words" nur für statischen Text -->

<!-- Vollbild-Menü -->
<nav id="site-menu" class="site-menu" aria-hidden="true">
  <div class="topo topo--abs"></div>
  <div class="topbar">…Wortmarke… <button class="btn btn--icon" data-menu-toggle aria-label="Menü schließen"><span class="i-menu"></span></button></div>
  <div class="menu-nav">
    <a class="menu-link is-current" style="--i:0" href="…">Zählen<svg class="scribble scribble--strike" …></svg></a>
    <a class="menu-link" style="--i:1" href="…">Archiv</a>
  </div>
  <div class="menu-foot"><div class="emblem"><span class="laurel"></span><span class="eyebrow">SV Partykeller</span></div></div>
</nav>

<!-- Höhenlinien (einmal pro Seite, erstes Kind von body bzw. der Bühne) -->
<div class="topo" aria-hidden="true"></div>
<div class="topo-spot" aria-hidden="true"></div>  <!-- nur Seiten mit Maus -->
```

Weitere Klassen: `.card` (flache Karte, 14 px Radius, Haarlinie), `.chip`
(`.chip--accent`, `.chip--line`), `.badge` (Umriss-Kerbenkarte mit `.badge-icon` als Strich-SVG, `.badge-name`, `.notch-tag.badge-count`; Zustände `.is-won`, `.is-today`, D-093),
`.tabs`/`.tab-btn`/`.tab-indicator` (Lime-Balken, `data-pos`, `--tabs`),
`.field`, `.sec`/`.sec-title` (Abschnittszeile mit Lime-Quadrat), `.split`/`.cell`,
`.avatar` (Initiale in der Serif), `.sheet`/`.sheet-scrim`/`.sheet-grip`,
`.marquee`, `.emblem`/`.laurel`, `.only-pk`/`.only-ys`, `.pk-pop`, `.pk-flash`.

`lando.js` exportiert: `initLando()`, `initReveal()`, `revealNow()`,
`initScribbles()`, `scribble()`, `drawScribble()`, `notch()`, `notchPath()`,
`initNotches()`, `initMenu()`, `initSurfaceMorph()`, `initSpotlight()`,
`initMagnetic()`, `initMarquee()`, `countUp()`, `reducedMotion()`,
`leave()`, `enter()`, `replay()`, `swapView()`, `go()`, `initPageTransitions()`.

## 5. Bewegung

- Easing `--ease` (0,65 / 0,05 / 0 / 1) für alles Große, 0,6–0,95 s.
  Kleine Rückmeldungen (Druck, Hover) 0,12–0,3 s.
- Einblendungen nur einmal (beim ersten Sichtbarwerden), gestaffelt 40–60 ms.
- `prefers-reduced-motion`: theme.css schaltet Animationen global ab; Kringel
  stehen dann sofort da. Der versteckte Ausgangszustand gilt nur mit
  `html.js-motion` — jede Seite setzt die Klasse im `<head>`.
- Kein `backdrop-filter` (teuer auf Handy und Pi). Dauer-Animationen nur über
  `transform`/`opacity`, auf dem TV höchstens eine langsame (Höhenlinien-Drift).
- Touch hat kein Hover: alles, was sich per Hover zeigt, muss auch ohne da sein.
- Was aufgeht, geht auch wieder animiert zu (D-083): Blätter, Dialoge,
  Meldungen und aufklappende Zeilen nie per `hidden = true` verstecken,
  sondern mit `leave(el)` (spielt `.is-leaving`, Keyframes `leave-fade`,
  `leave-down`, `leave-drop`, `leave-sink`, `leave-up` aus theme.css) und mit
  `enter(el)` öffnen.
- Seitenwechsel morphen (D-085): Was auf beiden Seiten vorkommt, bekommt
  denselben `view-transition-name`. Fest: `site-wordmark`, `site-menu-btn`
  (Kopfleiste, theme.css), `area-logo`, `me-avatar`/`me-name` (Dashboard-
  Kopf). Paare, die erst ein Klick festlegt: Link mit `data-morph="key"`
  (+ `data-morph-self`, dann heißt der Link `morph-key`) bzw.
  `go(url, { morph })`; die Zielseite liest den Schlüssel im Kopf-Skript als
  `html[data-morph]` und benennt ihr Gegenstück per CSS. Das Gegenstück muss
  im ersten Bild stehen (kein Einblenden, kein Nachladen) — daher setzt die
  Anmeldung ihre Liste beim Rückweg per Inline-Skript aus `pk_players_cache`.
  Kein `blocking="render"`: das schaltet in Chrome den Übergang ab.
  Firefox (keine seitenübergreifenden View Transitions): `go()` merkt sich
  die Positionen aller benannten Elemente (`pk-flip`), blendet den Rest aus;
  die neue Seite startet unsichtbar (`html[data-flip]`) und lässt die
  Gegenstücke von dort gleiten (`flipFrom`, `fadeAllBut`).
  Weiterleitungen im Skript laufen über `go(url)` statt `location.href`.
- Ansichtswechsel innerhalb einer Seite (Schritte, Bereiche, Login → Inhalt)
  über `swapView(update, { dir, from, to })`: `next`/`prev` gleiten seitlich
  in Richtung des Umschalters, `morph` blendet aus/ein und lässt benannte
  Elemente gleiten. Läuft per Web Animations, **nicht** über
  `document.startViewTransition` — Firefox zeigt dabei leere Bilder (D-087).
  Inhalt nach Heute/All-Time-Umschaltern mit `replay(el, 'swap-in-l|r')`.

- Kaltstart-Bild (D-093): Beim ersten Öffnen in einem Tab setzt das
  Kopf-Skript `html.pk-boot` (orange Fläche über `body::before`) und
  `h.pkBootDone`; `initBoot()` in lando.js lässt eine Kopie der Wortmarke
  groß aus der Maske steigen und an ihren Platz in der Kopfleiste fliegen,
  `initReveal` wartet darauf. Neue Gästeseiten übernehmen den Kopf-Schnipsel
  samt `pk-booted`-Merker.

## 6. Seiten

- **Start** (`/`): helle Creme-Fläche, Hero-Headline, Bereichskarten mit Kerbe.
- **Anmeldung / Onboarding**: dunkler Bereichsgrund, große Statement-Titel,
  Kontenliste als Versal-Zeilen mit Haarlinien, Menü mit Archiv/Admin/Bereich.
- **Dashboard**: Wortmarke + Menü, großer Name, riesige Tageszahl, drei
  Getränke-Kerbenkarten in Lime/Orange/Creme, Profil mit Rang, Statistik,
  Abzeichen und Lando-Fußkarte.
- **TV**: 1080p-Bühne, Höhenlinien mit langsamer Drift, Podest als Kerbenkarten
  in den Rangfarben, Liste mit Haarlinien, Fun-Fact-Band in der Serif,
  Kringel um die neue Nr. 1, Rangliste als Timing-Tower (Abstand, ▲/▼,
  Bestwert/Hausrekord, D-093).
- **Admin**: Werkzeug zuerst — Designsprache über Typo, Farben, Knöpfe, Karten.
- **Abend-Archiv**: Chronik mit Hintergrundwechsel beim Scrollen: Kennzahlen-
  Statement, „Hall of Fame" der Abendsieger als Kerbenkarten, alle Abende auf Creme.

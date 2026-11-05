# Quellen und Vorbilder (Stand 2026-11-05)

Woher Elemente der App stammen, ohne landonorris.com (die Grundlage des
ganzen Designs, siehe [DESIGN-LANDO.md](DESIGN-LANDO.md)). Nur was heute in
der App steckt; reine Entwürfe stehen in den INSPIRATION-Dateien.

## Fremdcode, Schriften, Pakete

| Was | Wo in der App | Quelle | Lizenz |
|---|---|---|---|
| Mona Sans | alle Seiten (Headlines, Text, Zahlen) | [GitHub, github/mona-sans](https://github.com/github/mona-sans) | OFL |
| Instrument Serif | Akzentwörter, Serif-Zahlen | [Google Fonts](https://fonts.google.com/specimen/Instrument+Serif) | OFL |
| QR-Code-Erzeugung (`public/js/vendor/qrcode.js`) | TV („Scan zum Beitreten“), Admin „Als QR“ | Kazuhiko Arase, [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) | MIT |
| Express | Server, Seiten und REST | [npm: express](https://www.npmjs.com/package/express) | MIT |
| ws | Live-Updates per WebSocket | [npm: ws](https://www.npmjs.com/package/ws) | MIT |
| better-sqlite3 | Datenbank | [npm: better-sqlite3](https://www.npmjs.com/package/better-sqlite3) | MIT |
| dotenv | `.env` lesen | [npm: dotenv](https://www.npmjs.com/package/dotenv) | BSD-2 |
| Stable Fluids (Jos Stam, 1999) | Höhenlinien-Leuchten (`public/js/topo-fluid.js`) | Verfahren aus der Fachliteratur, eigene Umsetzung in WebGL2 | – |

## Bilder vom Verein

| Datei | Verwendung | Herkunft |
|---|---|---|
| `public/assets/logo.png` | SV-Partykeller-Logo (Anmeldung, Dashboard, Archiv, Onboarding, TV) | vom Nutzer geliefert (`SVPartykellerLogo2.0`, D-009) |
| `public/assets/cones-flat.png` | nicht mehr eingebunden (früheres Favicon) | vom Nutzer geliefert (D-009) |

Lorbeer (`laurel.svg`), Höhenlinien (`topo.svg`, `topo-portrait.svg`), die
Abzeichen-Icons und die Kringel sind für die App gezeichnet.

## Gestaltungs-Vorbilder

| Element in der App | Vorbild | Entscheidung |
|---|---|---|
| Jahresrückblick zum Durchtippen (Story-Seiten, Fortschrittsstriche, eine Aussage je Seite) | Spotify Wrapped ([Newsroom](https://newsroom.spotify.com/?p=37865), [Rive-Fallstudie](https://rive.app/blog/spotify-used-rive-for-spotify-wrapped-2025)), Dribbble-Suche „year in review app“ | D-095 (L23) |
| Stempelkarte im Rückblick („Deine Abende“) | Dribbble [Membership reward Nightlife](https://dribbble.com/shots/27118371-Membership-reward-Nightlife-iOS-Mobile-App) | D-108 (L34) |
| Echo-Zahl beim Tippen, gestapelte Werte der letzten Abende im Profil | Dribbble „year in review app“, Nixtio [Formula 1 Racing Mobile App Concept](https://dribbble.com/shots/27462952-Formula-1-Racing-Mobile-App-Concept) | D-095 (L20) |
| Namens-Plakat für den Abendsieger (TV) | Sport-Broadcast-Grafiken auf Dribbble | D-095 (L21) |
| Meilenstein-Bild „PROST“ im Kachelraster (TV) | Sport-Broadcast-Grafiken auf Dribbble | D-095 (L24) |
| ▲▼ bei Platzwechseln in der TV-Rangliste | F1-TV-Grafik (Timing-Tower) | D-093 (L18), gekürzt in D-107 |
| Geisterspur beim Überholen (TV) | Codrops-Tutorial „Typography That Leaves a Trace: Scroll-Driven Ghost Trails“, [Codrops-Tutorials](https://tympanus.net/codrops/category/tutorials/) | D-106 (L33) |
| Auswahlseite Partykeller / Youngstars (riesige Wortmarken, Hover) | Awwwards [Big font Menu](https://www.awwwards.com/inspiration/big-font-menu) und [Typographic hover](https://www.awwwards.com/inspiration/typographic-hover); Split mit Wachsen: [Expanding Split-Screen Grid Navigation](https://freefrontend.com/code/expanding-split-screen-grid-navigation-2026-02-04/), [Framer „Expanding blocks“](https://www.framer.com/marketplace/components/expanding-blocks) | D-110 |

Angesehen, aber nichts übernommen: [charlesleclerc.com](https://charlesleclerc.com/),
[Built for Mars: „The promotion zone“](https://builtformars.com/ux-bites/leaderboards-the-promotion-zone)
(Podestlinie, nur Entwurf L26), die Festival-, Bon- und Nightlife-Shots aus
[INSPIRATION-4.md](INSPIRATION-4.md) sowie die Awwwards-Sites Santioni
Spirits, OFFFForum und The Tie-break.

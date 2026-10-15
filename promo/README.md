# Promo-Video

Reproduzierbare, code-gesteuerte Pipeline für den 43-Sekunden-Spot
(1920×1080, 30 fps, H.264 + AAC). Ergebnis: `promo/out/partykeller-promo.mp4`.

## Ablauf

1. **Demo-Instanz** — `node promo/demo-server.mjs` startet den echten Server auf
   Port 3199 mit Wegwerf-DBs in `promo/work/` und deterministischen Fake-Daten
   (sieben Abende, zwei Bereiche). Die echten DBs in `data/` bleiben unberührt.
2. **Screens** — `node promo/capture.mjs` fotografiert TV, Anmeldung, Dashboard,
   Profil, Archiv und Youngstars per Headless-Chrome/Edge (CDP) ab, inklusive
   eines echten Tipps auf „Bier +" und des TV-Zustands danach.
3. **Soundtrack** — `python promo/music.py` (numpy) synthetisiert 120 BPM in
   A-Moll; Kicks, Tipp-Sounds und Übergänge liegen auf den Szenen-Zeiten.
4. **Frames** — `node promo/render.mjs` rendert `scenes/promo.html` Frame für
   Frame: `window.__seek(t)` berechnet jeden Stil aus der Zeit, ohne CSS-
   Animationen, damit jeder Lauf identisch ist.
5. **Encoding** — `node promo/build.mjs` führt 3–5 aus und kodiert mit ffmpeg.
   Mit `--capture` werden auch die Screens neu aufgenommen (Demo-Server muss
   laufen), mit `--encode-only` nur kodiert.

Vorschau im Browser (über einen beliebigen Static-Server im Paketordner):
`promo/scenes/promo.html?play` oder ein Einzelbild mit `?t=14.2`.

Benötigt: Node ≥ 20, Python 3 mit numpy, Chrome oder Edge (`PROMO_BROWSER`),
ffmpeg mit libx264 (`FFMPEG`).

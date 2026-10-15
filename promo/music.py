"""Soundtrack für die Promo: 43 s, 120 BPM, A-Moll (Am-F-C-G), komplett
synthetisch (numpy) — reproduzierbar, keine Lizenzfragen. Treffer liegen auf
den Szenen-Zeiten aus scenes/promo.html.
Aufruf: python promo/music.py  ->  promo/work/music.wav
"""
import os
import wave

import numpy as np

SR = 44100
DUR = 43.0
BEAT = 0.5
N = int(DUR * SR)
rng = np.random.default_rng(42)

# Szenen-Zeiten (müssen zu SCENES in promo.html passen)
CUTS = [4, 8, 13, 18, 24.5, 30.5, 35, 38.5]
CURTAIN_LEAD = 0.3
TAPS = [10.0, 14.0, 19.3]          # Tipp-Geräusche (S3, S4, S5)
WIRE = (19.35, 19.95)              # Signal Handy -> TV
TV_HIT = 19.95                     # TV springt um
FINAL = 38.5


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def place(bus, sig, t0, gain=1.0):
    i = int(round(t0 * SR))
    if i >= len(bus):
        return
    j = min(len(bus), i + len(sig))
    bus[i:j] += sig[: j - i] * gain


def band(sig, lo, hi):
    spec = np.fft.rfft(sig)
    f = np.fft.rfftfreq(len(sig), 1 / SR)
    spec[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(spec, len(sig))


def saw(f, t, harmonics=7):
    return sum(np.sin(2 * np.pi * f * k * t) / k for k in range(1, harmonics + 1))


# --- Instrumente -------------------------------------------------------------
def kick(gain=1.0):
    t = tt(0.45)
    f = 46 + 120 * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 7.5)
    click = band(rng.standard_normal(len(t)), 1500, 6000) * np.exp(-t * 180) * 0.3
    return (body + click) * gain


def clap():
    t = tt(0.3)
    n = band(rng.standard_normal(len(t)), 900, 5000)
    env = np.exp(-t * 18)
    for d in (0.0, 0.011, 0.022):
        env += 0.6 * np.exp(-np.clip(t - d, 0, None) * 160) * (t >= d)
    return n * env * 0.55


def hat(open_=False):
    t = tt(0.25 if open_ else 0.06)
    n = band(rng.standard_normal(len(t)), 7000, 16000)
    return n * np.exp(-t * (14 if open_ else 70)) * 0.35


def boom():
    t = tt(2.2)
    f = 32 + 70 * np.exp(-t * 6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    sub = np.sin(ph) * np.exp(-t * 1.8)
    crash = band(rng.standard_normal(len(t)), 3000, 15000) * np.exp(-t * 2.2) * 0.35
    return sub * 1.1 + crash


def whoosh(d=0.6):
    t = tt(d)
    n = band(rng.standard_normal(len(t)), 400, 9000)
    env = (t / d) ** 2.2
    return n * env * 0.45


def riser(d):
    t = tt(d)
    f = 200 * (8 ** (t / d))
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = np.sin(ph) * 0.25 + band(rng.standard_normal(len(t)), 2000, 12000) * 0.2
    return tone * (t / d) ** 2


def blip(f0=880, f1=1480):
    t = tt(0.14)
    f = f0 + (f1 - f0) * np.minimum(t / 0.03, 1)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 32) * 0.45


def bell(f=1318.5):
    t = tt(1.6)
    s = (np.sin(2 * np.pi * f * t) * np.exp(-t * 3)
         + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)
         + 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 10))
    return s * 0.35


def zip_(d):
    t = tt(d)
    f = 500 * (5 ** (t / d))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.sin(np.pi * t / d) * 0.22


def pluck(f, d=0.25):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 14) * 0.22


# --- Harmonie ----------------------------------------------------------------
CHORDS = [  # (Bass-Grundton, Akkordtöne) je Takt (2 s)
    (33, [57, 60, 64]),  # Am
    (29, [57, 60, 65]),  # F
    (36, [55, 60, 64]),  # C
    (31, [55, 59, 62]),  # G
]
AM_FINAL = (33, [57, 60, 64, 71])


def chord_at(t):
    if t >= FINAL:
        return AM_FINAL
    return CHORDS[int(t // 2) % 4]


def full_groove(t):
    return (4 <= t < 24.5) or (30.5 <= t < FINAL)


def breakdown(t):
    return 24.5 <= t < 30.5


# --- Busse -------------------------------------------------------------------
drums = np.zeros(N)
bass = np.zeros(N)
padL = np.zeros(N)
padR = np.zeros(N)
fx = np.zeros(N)
side = np.ones(N)  # Sidechain-Hüllkurve für Bass/Pad

kick_times = []
t = 0.0
while t < DUR:
    if full_groove(t):
        kick_times.append(t)
    elif t < 4 and abs(t - round(t)) < 1e-9:   # Intro: Kick auf jedem Wort (ganze Sekunden)
        kick_times.append(t)
    elif 30.0 <= t < 30.5:
        kick_times.append(t)
    t = round(t + BEAT, 4)

for k in kick_times:
    place(drums, kick(), k)
    i = int(k * SR)
    seg = np.arange(min(N - i, int(0.4 * SR))) / SR
    side[i:i + len(seg)] = np.minimum(side[i:i + len(seg)], 1 - 0.65 * np.exp(-seg * 9))

# Clap auf 2 und 4, Hats auf den Achtel-Offbeats, Snare-Wirbel vor dem Finale
t = 0.0
while t < DUR:
    beat_no = int(round(t / BEAT))
    if full_groove(t):
        if beat_no % 2 == 1:
            place(drums, clap(), t)
        place(drums, hat(open_=(beat_no % 4 == 3)), t + BEAT / 2, 0.9)
    if breakdown(t):
        place(drums, hat(), t + BEAT / 2, 0.5)
    t = round(t + BEAT, 4)

roll_t = 36.5
step = 0.125
while roll_t < FINAL - 0.02:
    g = 0.25 + 0.75 * (roll_t - 36.5) / (FINAL - 36.5)
    place(drums, clap(), roll_t, 0.55 * g)
    if roll_t >= 37.5:
        step = 0.0625
    roll_t = round(roll_t + step, 5)

# Intro-Wörter: Clap + Sub auf 0/1/2/3
for w in (0.0, 1.0, 2.0, 3.0):
    place(drums, clap(), w, 0.7)

# Bass: pumpende Achtel
t = 0.0
while t < DUR:
    if full_groove(t) or (30.0 <= t < 30.5):
        root, _ = chord_at(t)
        f = midi(root + 12)
        nt = tt(BEAT / 2 * 0.95)
        env = np.minimum(nt / 0.005, 1) * np.exp(-nt * 4)
        oct_ = 2 if int(round(t / (BEAT / 2))) % 4 == 3 else 1
        place(bass, saw(f * oct_, nt, 6) * env * 0.32, t)
    t = round(t + BEAT / 2, 4)

# Pad: Akkordflächen je Takt, links/rechts leicht verstimmt
for bar in range(int(DUR // 2) + 1):
    t0 = bar * 2.0
    if t0 >= FINAL:
        break
    _, notes = chord_at(t0)
    d = min(2.0, FINAL - t0) + 0.25
    nt = tt(d)
    env = np.minimum(nt / 0.25, 1) * np.minimum((d - nt) / 0.25, 1)
    level = 0.10 if t0 < 4 else 0.16
    for m in notes:
        f = midi(m)
        place(padL, saw(f * 2 ** (-4 / 1200), nt, 5) * env * level, t0)
        place(padR, saw(f * 2 ** (4 / 1200), nt, 5) * env * level, t0)

# Finaler Akkord, lang ausklingend
fd = DUR - FINAL
nt = tt(fd)
env = np.minimum(nt / 0.02, 1) * np.exp(-nt * 0.9)
for m in AM_FINAL[1] + [45]:
    f = midi(m)
    place(padL, saw(f * 2 ** (-5 / 1200), nt, 6) * env * 0.17, FINAL)
    place(padR, saw(f * 2 ** (5 / 1200), nt, 6) * env * 0.17, FINAL)

# Breakdown-Arpeggio (Sechzehntel)
t = 24.5
i = 0
while t < 30.5:
    _, notes = chord_at(t)
    seq = [notes[0], notes[1], notes[2], notes[1] + 12]
    place(fx, pluck(midi(seq[i % 4] + 12)), t)
    t = round(t + BEAT / 4, 5)
    i += 1

# Effekte an Schnitten und Interaktionen
place(fx, riser(1.0), 3.0)
place(fx, boom(), 4.0, 0.9)
for c in CUTS[1:]:
    if c == FINAL:
        continue
    place(fx, whoosh(0.6), c - CURTAIN_LEAD - 0.45, 0.8)
place(fx, riser(1.6), 36.9, 1.2)
place(fx, boom(), FINAL, 1.1)
for tap in TAPS:
    place(fx, blip(), tap, 1.0)
place(fx, blip(1320, 2200), 14.0, 0.8)              # +1 etwas heller
place(fx, bell(1760), 14.08, 0.5)
place(fx, zip_(WIRE[1] - WIRE[0]), WIRE[0])
place(fx, bell(), TV_HIT, 0.9)

# Echo für den FX-Bus (punktierte Achtel, Ping-Pong)
delay = int(0.375 * SR)
fxL = fx.copy()
fxR = fx.copy()
for n in range(1, 4):
    g = 0.35 ** n
    sh = delay * n
    tgt = fxL if n % 2 else fxR
    tgt[sh:] += fx[:-sh] * g

# --- Mix ---------------------------------------------------------------------
bass *= side
padL *= side
padR *= side
L = drums * 0.9 + bass + padL + fxL * 0.8
R = drums * 0.9 + bass + padR + fxR * 0.8
mixed = np.stack([L, R], axis=1)
mixed = np.tanh(mixed * 1.3) / np.tanh(1.3)
mixed /= np.max(np.abs(mixed)) / 0.89

fade_in = int(0.01 * SR)
mixed[:fade_in] *= np.linspace(0, 1, fade_in)[:, None]
fade_out = int(0.7 * SR)
mixed[-fade_out:] *= np.linspace(1, 0, fade_out)[:, None] ** 1.5

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'work', 'music.wav')
os.makedirs(os.path.dirname(out), exist_ok=True)
with wave.open(out, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mixed * 32767).astype('<i2').tobytes())
print('music.wav', round(len(mixed) / SR, 2), 's')

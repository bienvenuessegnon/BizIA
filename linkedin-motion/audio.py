#!/usr/bin/env python3
"""Original score for the 45-second LinkedIn motion study. No third-party music."""

from pathlib import Path

import numpy as np

SR = 48000
DUR = 45.0
N = int(round(SR * DUR))
rng = np.random.default_rng(11)
t = np.arange(N) / SR


def place(buf, start_s, clip, gain=1.0):
    i = int(round(start_s * SR))
    if i >= N or len(clip) == 0:
        return
    j = min(N, i + len(clip))
    buf[i:j] += clip[: j - i] * gain


def bell(freq, dur=1.6, decay=3.2, gain=1.0):
    n = int(SR * dur)
    tt = np.arange(n) / SR
    y = np.zeros(n)
    for partial, amp, dec in (
        (1.0, 1.0, decay),
        (2.003, 0.32, decay * 1.35),
        (2.997, 0.14, decay * 1.7),
        (4.17, 0.05, decay * 2.1),
    ):
        y += amp * np.sin(2 * np.pi * freq * partial * tt) * np.exp(-tt * dec)
    y *= np.minimum(1.0, tt / 0.007)
    peak = np.max(np.abs(y)) + 1e-9
    return y / peak * gain


def thump(freq=70.0, dur=0.6, gain=1.0):
    n = int(SR * dur)
    tt = np.arange(n) / SR
    y = np.sin(2 * np.pi * freq * tt * np.exp(-tt * 0.6)) * np.exp(-tt * 7.5)
    y *= np.minimum(1.0, tt / 0.004)
    return y * gain


def whoosh(dur=0.5, gain=1.0):
    n = int(SR * dur)
    tt = np.linspace(0, 1, n, endpoint=False)
    noise = rng.standard_normal(n)
    y = np.zeros(n)
    acc = 0.0
    for i in range(n):
        fc = 220 + 4800 * np.sin(np.pi * tt[i]) ** 2
        coef = np.exp(-2 * np.pi * fc / SR)
        acc = (1 - coef) * noise[i] + coef * acc
        y[i] = acc
    y *= np.sin(np.pi * tt) ** 1.6
    peak = np.max(np.abs(y)) + 1e-9
    return y / peak * gain


def tick(freq=1400.0, dur=0.045, gain=1.0):
    n = int(SR * dur)
    tt = np.arange(n) / SR
    return np.sin(2 * np.pi * freq * tt) * np.exp(-tt * 70) * gain


fade = np.clip(t / 0.35, 0, 1) * np.clip((DUR - t) / 0.55, 0, 1)
swell = 0.72 + 0.28 * np.sin(2 * np.pi * t / 16.0 - 0.4)

drone_l = (
    0.10 * np.sin(2 * np.pi * 55.0 * t)
    + 0.045 * np.sin(2 * np.pi * 82.41 * t)
    + 0.028 * np.sin(2 * np.pi * 110.0 * t)
    + 0.012 * np.sin(2 * np.pi * 164.81 * t)
)
drone_r = (
    0.10 * np.sin(2 * np.pi * 55.06 * t)
    + 0.042 * np.sin(2 * np.pi * 82.2 * t)
    + 0.028 * np.sin(2 * np.pi * 110.35 * t)
    + 0.012 * np.sin(2 * np.pi * 165.1 * t)
)
drone_l *= swell * fade
drone_r *= swell * fade

noise = rng.standard_normal(N)
kernel = np.exp(-np.linspace(0, 1, 700))
kernel /= kernel.sum()
air = np.convolve(noise, kernel, mode="same")
air /= np.max(np.abs(air)) + 1e-9
air *= 0.012 * fade

hits = np.zeros(N)
place(hits, 0.04, thump(92, 0.7, 0.55))
place(hits, 0.06, bell(440, 2.0, 2.2, 0.22))
place(hits, 1.12, bell(554.37, 1.3, 2.8, 0.16))
place(hits, 5.60, bell(659.25, 1.5, 2.5, 0.20))
place(hits, 5.55, whoosh(0.42, 0.16))
place(hits, 10.28, whoosh(0.55, 0.18))
place(hits, 10.36, bell(523.25, 1.4, 2.6, 0.16))
place(hits, 16.72, thump(62, 0.85, 0.7))
place(hits, 16.78, bell(440, 1.6, 2.1, 0.18))
place(hits, 18.44, bell(880, 0.8, 4.5, 0.12))
place(hits, 20.00, bell(659.25, 1.2, 2.8, 0.16))
place(hits, 20.00, thump(78, 0.45, 0.35))

for i, frame in enumerate((566, 584, 602, 620, 638)):
    place(hits, frame / 25, tick(920 + i * 70, gain=0.22))
    place(hits, frame / 25, bell(494 * (1.04 ** i), 0.4, 7, 0.07))

for frame in range(304, 352, 14):
    place(hits, frame / 25, tick(1600, dur=0.03, gain=0.08))

place(hits, 29.52, whoosh(0.4, 0.14))
place(hits, 29.58, bell(493.88, 1.3, 2.8, 0.14))
place(hits, 34.96, whoosh(0.7, 0.20))
place(hits, 35.04, bell(440, 2.4, 1.5, 0.18))
place(hits, 35.10, bell(554.37, 2.5, 1.6, 0.11))
place(hits, 35.18, bell(659.25, 2.6, 1.45, 0.09))
place(hits, 40.40, thump(55, 1.3, 0.75))
place(hits, 40.48, bell(220.00, 4.4, 0.85, 0.22))
place(hits, 40.48, bell(277.18, 4.4, 0.95, 0.13))
place(hits, 40.48, bell(329.63, 4.5, 1.00, 0.10))

mix_l = drone_l + air + hits
mix_r = drone_r + np.roll(air, int(0.012 * SR)) * 0.85 + hits
peak = max(float(np.max(np.abs(mix_l))), float(np.max(np.abs(mix_r))), 1e-9)
mix_l = np.tanh(mix_l / peak * 1.2)
mix_r = np.tanh(mix_r / peak * 1.2)
peak = max(float(np.max(np.abs(mix_l))), float(np.max(np.abs(mix_r))))
target = 10 ** (-3.0 / 20)
mix_l *= target / peak
mix_r *= target / peak

out = Path(__file__).resolve().parent / "dist" / "audio.wav"
out.parent.mkdir(parents=True, exist_ok=True)
pcm = np.clip(np.column_stack([mix_l, mix_r]), -1, 1)
pcm_i = (pcm * 32767.0).astype(np.int16)
import wave

with wave.open(str(out), "w") as handle:
    handle.setnchannels(2)
    handle.setsampwidth(2)
    handle.setframerate(SR)
    handle.writeframes(pcm_i.tobytes())

rms = float(np.sqrt(np.mean(pcm**2)))
print(f"wrote {out} samples={N} peak={float(np.max(np.abs(pcm))):.3f} rms={rms:.3f}")

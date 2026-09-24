"""Bruitages synthétisés (48 kHz, stéréo). Chaque fonction renvoie un tableau (2, n)."""
from __future__ import annotations

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
rng = np.random.default_rng(11)


def _t(d: float) -> np.ndarray:
    return np.arange(int(d * SR)) / SR


def _pan(x: np.ndarray, pan) -> np.ndarray:
    pan = np.broadcast_to(np.asarray(pan, dtype=float), x.shape)
    return np.stack([x * np.cos((pan + 1) * np.pi / 4), x * np.sin((pan + 1) * np.pi / 4)])


def _sweep_filter(x: np.ndarray, freqs: np.ndarray, kind: str = "band", q: float = 0.6) -> np.ndarray:
    blk = 256
    out = np.zeros_like(x)
    zi = np.zeros((2, 2)) if kind != "band" else np.zeros((2, 2))
    for i in range(0, len(x), blk):
        f = float(np.clip(freqs[min(i, len(freqs) - 1)], 40, SR * 0.45))
        if kind == "band":
            lo, hi = f * (1 - q / 2), min(f * (1 + q), SR * 0.45)
            sos = butter(1, [lo, hi], btype="band", fs=SR, output="sos")
        else:
            sos = butter(2, f, btype=kind, fs=SR, output="sos")
        if zi.shape[0] != sos.shape[0]:
            zi = np.zeros((sos.shape[0], 2))
        out[i : i + blk], zi = sosfilt(sos, x[i : i + blk], zi=zi)
    return out


def _room(x: np.ndarray, seconds: float = 1.2, decay: float = 5.0, wet: float = 0.25) -> np.ndarray:
    n = int(seconds * SR)
    env = np.exp(-decay * np.arange(n) / SR)
    out = []
    for c in range(2):
        ir = rng.standard_normal(n) * env
        ir /= np.sqrt(np.sum(ir**2))
        out.append(x[c] + wet * fftconvolve(x[c], ir)[: x.shape[1]])
    return np.stack(out)


def whoosh(d: float = 0.8, direction: int = 1) -> np.ndarray:
    t = _t(d)
    u = t / d
    env = np.sin(np.pi * u) ** 1.6
    freqs = 350 + 3200 * np.sin(np.pi * u) ** 2
    x = _sweep_filter(rng.standard_normal(len(t)), freqs, "band", q=0.9) * env
    x = _pan(x * 1.6, direction * (u * 1.6 - 0.8))
    return _room(x, 0.8, 6.0, 0.2)


def impact(d: float = 2.2) -> np.ndarray:
    t = _t(d)
    f = 32 + 60 * np.exp(-t / 0.08)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.55)
    nz = sosfilt(butter(2, 1800, "low", fs=SR, output="sos"), rng.standard_normal(len(t))) * np.exp(-t / 0.06)
    x = np.tanh(1.8 * (sub * 0.9 + nz * 0.5))
    return _room(_pan(x, 0.0), 2.0, 2.4, 0.35)


def riser(d: float = 2.0) -> np.ndarray:
    t = _t(d)
    u = t / d
    nz = _sweep_filter(rng.standard_normal(len(t)), 500 + 7000 * u**2, "high")
    tone = sum(np.sin(2 * np.pi * np.cumsum(f0 * (1 + 1.5 * u**2)) / SR) for f0 in (220, 277.2, 329.6)) / 3
    x = (nz * 0.5 + tone * 0.25) * u**2.2
    x[-int(0.01 * SR):] *= np.linspace(1, 0, int(0.01 * SR))
    return _room(_pan(x, 0.0), 1.0, 4.0, 0.3)


def tick(freq: float = 2600.0) -> np.ndarray:
    t = _t(0.05)
    x = np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.008)
    x[:48] += rng.standard_normal(48) * 0.3
    return _pan(x * 0.6, 0.0)


def blip(f0: float = 880.0, f1: float = 1320.0, d: float = 0.12) -> np.ndarray:
    t = _t(d)
    f = f0 + (f1 - f0) * np.minimum(1, t / (d * 0.4))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (d * 0.35)) * np.minimum(1, t / 0.003)
    return _room(_pan(x * 0.5, 0.0), 0.5, 7.0, 0.25)


def servo(d: float = 1.0, pitch: float = 1.0) -> np.ndarray:
    t = _t(d)
    u = t / d
    base = pitch * (170 + 90 * np.sin(np.pi * u))
    wob = 1 + 0.02 * np.sin(2 * np.pi * 23 * t)
    ph = 2 * np.pi * np.cumsum(base * wob) / SR
    x = sum(np.sin(k * ph) / k for k in range(1, 9))
    x = sosfilt(butter(2, [350, 2600], "band", fs=SR, output="sos"), x)
    x += sosfilt(butter(2, 4000, "high", fs=SR, output="sos"), rng.standard_normal(len(t))) * 0.05
    env = np.minimum(1, t / 0.06) * np.minimum(1, (d - t) / 0.12)
    return _pan(x * env * 0.5, 0.0)


def clunk() -> np.ndarray:
    t = _t(0.35)
    thump = np.sin(2 * np.pi * np.cumsum(90 + 120 * np.exp(-t / 0.01)) / SR) * np.exp(-t / 0.05)
    metal = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / dd) for f, dd in ((1870, 0.05), (2930, 0.035), (4410, 0.02)))
    nz = sosfilt(butter(2, 2500, "low", fs=SR, output="sos"), rng.standard_normal(len(t))) * np.exp(-t / 0.015)
    x = thump * 0.8 + metal * 0.12 + nz * 0.5
    return _room(_pan(x, 0.0), 0.6, 8.0, 0.2)


def shimmer(d: float = 1.6) -> np.ndarray:
    t = _t(d)
    x = np.zeros(len(t))
    for i, f in enumerate((1318.5, 1760.0, 2217.5, 2637.0)):
        on = i * 0.07
        tt = np.clip(t - on, 0, None)
        x += np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.5) * (t >= on)
    return _room(_pan(x * 0.16, 0.0), 1.6, 2.5, 0.5)


LIB = {
    "whoosh": whoosh,
    "impact": impact,
    "riser": riser,
    "tick": tick,
    "blip": blip,
    "servo": servo,
    "clunk": clunk,
    "shimmer": shimmer,
}

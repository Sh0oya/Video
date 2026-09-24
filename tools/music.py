#!/usr/bin/env python3
"""Bande-son originale, synthétisée de A à Z (numpy/scipy), calée sur la timeline.

L'intensité de chaque scène (champ "music" dans script/narration.json, de 0 à 1) active
progressivement les couches : nappe -> arpège -> basse -> charley -> grosse caisse -> clap.
Sortie : public/audio/music.wav (stéréo, 48 kHz).
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, lfilter, sosfilt

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
BPM = 100.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT
rng = np.random.default_rng(7)


def midi(n: float) -> float:
    return 440.0 * 2 ** ((n - 69) / 12)


# Ré mineur : Dm - Bb - F - C (i - VI - III - VII), un accord par mesure.
PROGRESSION = [
    (50, [62, 65, 69]),  # Dm
    (46, [62, 65, 70]),  # Bb
    (53, [60, 65, 69]),  # F
    (48, [60, 64, 67]),  # C
]


def saw(freq: float, n: int, phase: float = 0.0) -> np.ndarray:
    t = np.arange(n) / SR
    return 2.0 * ((freq * t + phase) % 1.0) - 1.0


def lowpass(x: np.ndarray, cutoff: float, order: int = 2) -> np.ndarray:
    sos = butter(order, min(cutoff, SR * 0.45), btype="low", fs=SR, output="sos")
    return sosfilt(sos, x)


def highpass(x: np.ndarray, cutoff: float, order: int = 2) -> np.ndarray:
    sos = butter(order, cutoff, btype="high", fs=SR, output="sos")
    return sosfilt(sos, x)


def bandpass(x: np.ndarray, lo: float, hi: float, order: int = 2) -> np.ndarray:
    sos = butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return sosfilt(sos, x)


def add(buf: np.ndarray, sig: np.ndarray, at: float, pan: float = 0.0, gain: float = 1.0) -> None:
    i = int(at * SR)
    if i >= buf.shape[1] or i + len(sig) <= 0:
        return
    sig = sig[: buf.shape[1] - i]
    l = np.cos((pan + 1) * np.pi / 4) * gain
    r = np.sin((pan + 1) * np.pi / 4) * gain
    buf[0, i : i + len(sig)] += sig * l
    buf[1, i : i + len(sig)] += sig * r


def reverb_ir(seconds: float = 2.8, decay: float = 3.2) -> np.ndarray:
    n = int(seconds * SR)
    t = np.arange(n) / SR
    env = np.exp(-decay * t)
    ir = np.stack([rng.standard_normal(n) * env, rng.standard_normal(n) * env])
    ir = np.stack([lowpass(ch, 6000) for ch in ir])
    ir[:, : int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    return ir / np.sqrt(np.sum(ir**2, axis=1, keepdims=True))


def reverb(x: np.ndarray, ir: np.ndarray) -> np.ndarray:
    return np.stack([fftconvolve(x[c], ir[c])[: x.shape[1]] for c in range(2)])


def intensity_curve(timeline: dict, spec: dict, n: int) -> np.ndarray:
    fps = timeline["fps"]
    levels = {s["id"]: s.get("music", 0.5) for s in spec["scenes"]}
    pts_t, pts_v = [], []
    for sc in timeline["scenes"]:
        a = sc["from"] / fps
        b = (sc["from"] + sc["duration"]) / fps
        v = levels.get(sc["id"], 0.5)
        pts_t += [a + 0.8, b - 0.4]
        pts_v += [v, v]
    t = np.arange(n) / SR
    return np.interp(t, pts_t, pts_v)


def render(total: float, curve_fn) -> np.ndarray:
    n = int((total + 4.0) * SR)
    pad = np.zeros((2, n))
    arp = np.zeros((2, n))
    bass = np.zeros((2, n))
    drums = np.zeros((2, n))
    kick_times = []

    bars = int(np.ceil(total / BAR)) + 1
    for b in range(bars):
        t0 = b * BAR
        if t0 > total + 1.0:
            break
        I = curve_fn(t0 + BAR / 2)
        root, chord = PROGRESSION[b % 4]

        # Nappe : saws désaccordées, attaque lente, relâchement qui chevauche la mesure suivante.
        ln = int((BAR + 1.6) * SR)
        env = np.minimum(1.0, np.arange(ln) / (0.5 * SR))
        rel = np.clip((BAR + 1.6 - np.arange(ln) / SR) / 1.6, 0, 1)
        env = env * np.minimum(1.0, rel * 1.6)
        for k, note in enumerate(chord + [chord[0] - 12]):
            for d, pan in ((-0.09, -0.7), (0.0, 0.0), (0.08, 0.7)):
                s = saw(midi(note + d), ln, phase=rng.random())
                add(pad, s * env * 0.05, t0, pan=pan)

        # Arpège en doubles croches sur deux octaves.
        if I >= 0.28:
            tones = chord + [c + 12 for c in chord]
            order = [0, 2, 1, 3, 5, 4, 3, 1]
            step = BEAT / 4
            for i in range(16):
                note = tones[order[i % 8]] + 12
                ln2 = int(0.28 * SR)
                tt = np.arange(ln2) / SR
                s = 0.6 * saw(midi(note), ln2) + 0.4 * np.sign(np.sin(2 * np.pi * midi(note) * tt))
                s *= np.exp(-tt / 0.07)
                accent = 1.0 if i % 4 == 0 else 0.7
                add(arp, s * 0.07 * accent, t0 + i * step, pan=0.35 * np.sin(i * 0.9))

        # Basse en croches.
        if I >= 0.45:
            for i in range(8):
                ln3 = int(BEAT / 2 * SR)
                tt = np.arange(ln3) / SR
                f = midi(root - 12)
                s = np.sin(2 * np.pi * f * tt) + 0.35 * saw(f, ln3)
                s *= np.minimum(1, tt / 0.005) * np.exp(-tt / 0.22)
                add(bass, s * 0.22, t0 + i * BEAT / 2)

        # Batterie.
        for beat in range(4):
            tb = t0 + beat * BEAT
            if I >= 0.6 or (I >= 0.5 and beat in (0, 2)):
                ln4 = int(0.45 * SR)
                tt = np.arange(ln4) / SR
                freq = 45 + 110 * np.exp(-tt / 0.03)
                ph = 2 * np.pi * np.cumsum(freq) / SR
                k = np.sin(ph) * np.exp(-tt / 0.16)
                k[: int(0.002 * SR)] += rng.standard_normal(int(0.002 * SR)) * 0.4
                add(drums, np.tanh(k * 1.6) * 0.42, tb)
                kick_times.append(tb)
            if I >= 0.5:
                ln5 = int(0.06 * SR)
                h = highpass(rng.standard_normal(ln5), 7000) * np.exp(-np.arange(ln5) / SR / 0.012)
                add(drums, h * 0.12, tb + BEAT / 2, pan=0.3)
            if I >= 0.8 and beat in (1, 3):
                ln6 = int(0.25 * SR)
                c = np.zeros(ln6)
                for off in (0.0, 0.009, 0.018):
                    j = int(off * SR)
                    c[j:] += rng.standard_normal(ln6 - j) * np.exp(-np.arange(ln6 - j) / SR / 0.05)
                add(drums, bandpass(c, 900, 3500) * 0.16, tb, pan=-0.1)

    # Filtre de l'arpège qui s'ouvre avec l'intensité (traitement par blocs, état conservé).
    blk = 1024
    out = np.zeros_like(arp)
    zi = [np.zeros((1, 2)) for _ in range(2)]
    for i in range(0, n, blk):
        cutoff = 900 + 5200 * curve_fn(i / SR)
        sos = butter(2, cutoff, btype="low", fs=SR, output="sos")
        for c in range(2):
            out[c, i : i + blk], zi[c] = sosfilt(sos, arp[c, i : i + blk], zi=zi[c])
    arp = out
    # Écho ping-pong à la croche pointée.
    d = int(BEAT * 0.75 * SR)
    mono = arp.mean(axis=0)
    echo = np.zeros_like(arp)
    for k in range(1, 5):
        echo[k % 2, d * k :] += mono[: n - d * k] * 0.38**k
    arp = arp + np.stack([lowpass(echo[c], 4000) for c in range(2)]) * 0.8

    pad = np.stack([lowpass(pad[c], 2200) for c in range(2)])
    bass = np.stack([lowpass(bass[c], 380) for c in range(2)])

    # Effet de pompe (sidechain) sur nappe et basse, déclenché par la grosse caisse.
    duck = np.ones(n)
    for kt in kick_times:
        i = int(kt * SR)
        ln = int(0.32 * SR)
        seg = 1 - 0.45 * np.exp(-np.arange(ln) / SR / 0.09)
        duck[i : i + ln] = np.minimum(duck[i : i + ln], seg[: max(0, min(ln, n - i))])
    pad *= duck
    bass *= duck

    # Gain par couche suivant l'intensité (volume doux entre les paliers).
    t = np.arange(n) / SR
    I = np.array([curve_fn(x) for x in t[:: SR // 100]])
    I = np.interp(t, t[:: SR // 100], I)
    pad *= 0.75 + 0.25 * I
    ir = reverb_ir()
    wet = reverb(pad * 0.5 + arp * 0.6 + drums * 0.08, ir)
    mix = pad + arp + bass + drums + wet * 0.55

    # Fin : fondu sur les deux dernières secondes, queue de réverbération conservée.
    fade_start = total - 2.5
    g = np.clip((total + 1.5 - t) / 4.0, 0, 1) ** 2
    g[t < fade_start] = 1.0
    mix *= g
    fade_in = np.minimum(1, t / 1.5)
    mix *= fade_in

    mix = np.stack([highpass(mix[c], 28) for c in range(2)])
    mix = np.tanh(mix * 1.2) / 1.2
    mix /= np.max(np.abs(mix)) + 1e-9
    return (mix * 0.89)[:, : int((total + 0.5) * SR)]


def main() -> None:
    spec = json.loads((ROOT / "script" / "narration.json").read_text(encoding="utf-8"))
    timeline = json.loads((ROOT / "src" / "data" / "timeline.json").read_text(encoding="utf-8"))
    total = timeline["durationInFrames"] / timeline["fps"]
    n = int((total + 4.0) * SR)
    curve = intensity_curve(timeline, spec, n)

    def curve_fn(sec: float) -> float:
        return float(curve[min(len(curve) - 1, max(0, int(sec * SR)))])

    mix = render(total, curve_fn)
    sf.write(ROOT / "public" / "audio" / "music.wav", mix.T.astype(np.float32), SR)
    print(f"Musique : {mix.shape[1] / SR:.1f} s")


if __name__ == "__main__":
    main()

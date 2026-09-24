#!/usr/bin/env python3
"""Mixage final : voix traitée + musique avec ducking + bruitages, puis normalisation à -14 LUFS.

Les bruitages sont déclarés par scène dans script/narration.json :
  "sfx": [{"type": "whoosh", "at": "scene", "offset": -0.3},
          {"type": "tick", "at": "line:1", "offset": 0.2, "repeat": 10, "every": 0.07, "gain": 0.5}]
"at" vaut "scene" (début de scène), "end" (fin de scène), "line:N" (début de la réplique N)
"sub:N:M" (début du bloc de sous-titre M de la réplique N) ou "match:motif" (premier bloc
dont le texte correspond à l'expression régulière, pour rester calé sur un mot prononcé).
"accel" (< 1) raccourcit chaque intervalle entre répétitions d'un facteur constant.
Musique : par défaut public/audio/music.wav (tools/music.py). Si narration.json contient
"music_file", ce fichier est décodé puis remonté selon "edits" : une liste de segments
{"from": s, "to": s, "at": s} (secondes source -> position dans la vidéo), raccordés par de
courts fondus à puissance constante. Les coupes se placent juste avant un temps fort.
Sortie : public/audio/mix.wav puis out/mix.wav (loudnorm).
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, resample_poly, sosfilt

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sfx  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SR = 48000


def process_voice(v: np.ndarray) -> np.ndarray:
    v = resample_poly(v, 2, 1)
    v = sosfilt(butter(2, 75, "high", fs=SR, output="sos"), v)
    # Présence : léger relief autour de 2,5-5 kHz, chaleur vers 180 Hz.
    pres = sosfilt(butter(2, [2500, 5000], "band", fs=SR, output="sos"), v)
    warm = sosfilt(butter(2, [140, 260], "band", fs=SR, output="sos"), v)
    v = v + 0.35 * pres + 0.2 * warm
    # Compression RMS douce (ratio 3:1 au-dessus de -20 dBFS).
    win = int(0.02 * SR)
    pad = np.pad(v**2, (win, win), mode="edge")
    rms = np.sqrt(np.convolve(pad, np.ones(win) / win, "same")[win:-win] + 1e-10)
    db = 20 * np.log10(rms + 1e-10)
    over = np.maximum(0, db - (-20))
    gain = 10 ** (-(over * (1 - 1 / 3)) / 20)
    gain = np.convolve(gain, np.ones(240) / 240, "same")
    v = v * gain
    return v / (np.max(np.abs(v)) + 1e-9) * 0.7


def duck_envelope(timeline: dict, n: int, low: float, high: float) -> np.ndarray:
    fps = timeline["fps"]
    env = np.full(n, high)
    for sc in timeline["scenes"]:
        for ln in sc["lines"]:
            a = max(0, int((ln["from"] / fps - 0.25) * SR))
            b = min(n, int((ln["to"] / fps + 0.35) * SR))
            env[a:b] = low
    k = int(0.35 * SR)
    kernel = np.hanning(k)
    kernel /= kernel.sum()
    return np.convolve(env, kernel, "same")


def cue_time(cue: dict, sc: dict, fps: int) -> float:
    at = cue.get("at", "scene")
    if at == "scene":
        base = sc["from"]
    elif at == "end":
        base = sc["from"] + sc["duration"]
    elif at.startswith("line:"):
        base = sc["lines"][int(at.split(":")[1])]["from"]
    elif at.startswith("sub:"):
        _, li, bi = at.split(":")
        base = sc["lines"][int(li)]["subs"][int(bi)]["from"]
    elif at.startswith("match:"):
        pat = re.compile(at[len("match:") :], re.I)
        hits = [b["from"] for ln in sc["lines"] for b in ln["subs"] if pat.search(b["text"])]
        if not hits:
            raise ValueError(f"aucun sous-titre ne correspond à {at!r} dans la scène {sc['id']}")
        base = hits[0]
    else:
        raise ValueError(at)
    return base / fps + cue.get("offset", 0.0)


def load_music_file(cfg: dict, n: int) -> np.ndarray:
    """Décode le fichier musique (48 kHz stéréo) et applique le montage "edits"."""
    raw = subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(ROOT / cfg["path"]), "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
        capture_output=True, check=True,
    ).stdout
    src = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).T.astype(np.float64)
    xf = int(cfg.get("xfade", 0.02) * SR)
    out = np.zeros((2, n))
    edits = cfg.get("edits") or [{"from": 0.0, "to": src.shape[1] / SR, "at": 0.0}]
    for k, e in enumerate(edits):
        a, b, at = int(e["from"] * SR), int(e["to"] * SR), int(e["at"] * SR)
        # Chaque segment déborde de xf/2 de part et d'autre de la coupe, avec des rampes sin/cos.
        pa = xf // 2 if k > 0 else 0
        pb = xf // 2 if k < len(edits) - 1 else 0
        a0, b0, d0 = max(0, a - pa), min(src.shape[1], b + pb), at - (a - max(0, a - pa))
        seg = src[:, a0:b0].copy()
        if pa:
            seg[:, :xf] *= np.sin(np.linspace(0, np.pi / 2, xf))
        if pb:
            seg[:, -xf:] *= np.cos(np.linspace(0, np.pi / 2, xf))
        d0 = max(0, d0)
        L = min(seg.shape[1], n - d0)
        if L > 0:
            out[:, d0 : d0 + L] += seg[:, :L]
    fi = int(cfg.get("fade_in", 0.0) * SR)
    if fi:
        out[:, :fi] *= np.linspace(0, 1, fi)
    fo = int(cfg.get("fade_out", 0.0) * SR)
    if fo:
        out[:, n - fo :] *= np.linspace(1, 0, fo)
    return out * 10 ** (cfg.get("gain_db", 0.0) / 20)


def limiter(x: np.ndarray, ceiling: float = 0.94) -> np.ndarray:
    from scipy.ndimage import minimum_filter1d, uniform_filter1d

    peak = np.max(np.abs(x), axis=0)
    look = int(0.005 * SR)
    g = 1.0 / np.maximum(1.0, peak / ceiling)
    # Min glissant sur la fenêtre d'anticipation, puis lissage pour éviter les clics.
    g = minimum_filter1d(g, size=2 * look + 1)
    g = uniform_filter1d(g, size=look)
    return x * g


def main() -> None:
    spec = json.loads((ROOT / "script" / "narration.json").read_text(encoding="utf-8"))
    tl = json.loads((ROOT / "src" / "data" / "timeline.json").read_text(encoding="utf-8"))
    fps = tl["fps"]
    total = tl["durationInFrames"] / fps
    n = int(total * SR)

    voice, vsr = sf.read(ROOT / "public" / "audio" / "voice.wav", dtype="float64")
    assert vsr == 24000
    voice = process_voice(voice)[:n]
    voice = np.pad(voice, (0, n - len(voice)))

    if spec.get("music_file"):
        music = load_music_file(spec["music_file"], n)
    else:
        music, msr = sf.read(ROOT / "public" / "audio" / "music.wav", dtype="float64")
        assert msr == SR
        music = music.T[:, :n]
        music = np.pad(music, ((0, 0), (0, n - music.shape[1])))
    env = duck_envelope(tl, n, low=spec.get("music_under_voice", 0.2), high=spec.get("music_level", 0.5))
    # Creuse la bande de présence de la voix (1-4 kHz) dans la musique pendant les répliques : -5 dB.
    speaking = (env.max() - env) / (env.max() - env.min() + 1e-9)
    band = np.stack([sosfilt(butter(2, [1000, 4000], "band", fs=SR, output="sos"), music[c]) for c in range(2)])
    music = (music - band * (1 - 10 ** (-5 / 20)) * speaking) * env

    fx = np.zeros((2, n))
    scenes = {s["id"]: s for s in spec["scenes"]}
    for sc in tl["scenes"]:
        for cue in scenes[sc["id"]].get("sfx", []):
            t0 = cue_time(cue, sc, fps)
            args = cue.get("args", {})
            for r in range(cue.get("repeat", 1)):
                sig = sfx.LIB[cue["type"]](**args)
                if cue["type"] == "riser":
                    start = t0 - sig.shape[1] / SR
                else:
                    # "accel" < 1 : chaque intervalle raccourcit (répétitions qui s'accélèrent).
                    k = cue.get("accel", 1.0)
                    e = cue.get("every", 0.1)
                    start = t0 + (e * r if k == 1.0 else e * (1 - k**r) / (1 - k))
                i = int(start * SR)
                if i < 0:
                    sig, i = sig[:, -i:], 0
                sig = sig[:, : max(0, n - i)]
                fx[:, i : i + sig.shape[1]] += sig * cue.get("gain", 1.0) * spec.get("sfx_level", 0.45)

    mix = music + fx + voice[None, :]
    mix = limiter(mix)
    raw = ROOT / "public" / "audio" / "mix_raw.wav"
    sf.write(raw, mix.T.astype(np.float32), SR, subtype="FLOAT")

    out = ROOT / "public" / "audio" / "mix.wav"
    # Normalisation EBU R128 en deux passes : -14 LUFS intégrés, crête vraie -1,5 dBTP.
    p = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(raw), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
        capture_output=True, text=True,
    )
    js = json.loads(p.stderr[p.stderr.rfind("{") : p.stderr.rfind("}") + 1])
    af = (
        f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
        f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true"
    )
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(raw), "-af", af, "-ar", str(SR), str(out)], check=True)
    print(f"Mix : {total:.1f} s, entrée {js['input_i']} LUFS -> -14 LUFS")


if __name__ == "__main__":
    main()

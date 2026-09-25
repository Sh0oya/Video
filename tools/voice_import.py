#!/usr/bin/env python3
"""Importe une voix off enregistrée d'un bloc (ex. ElevenLabs via fal) et la découpe en répliques.

Configuration dans script/narration.json :
  "voice_file": {"path": "assets/audio/voix.mp3", "text": "docs/fal/voix.json",
                 "tempo": 1.06, "pause_keep": 0.12, "pause_ratio": 0.35, "pause_max": 0.4,
                 "lines_dir": "public/audio/voice_ext"}

1. Repère les silences du fichier, puis choisit, parmi eux, les N-1 frontières entre répliques :
   programmation dynamique sur l'écart entre le temps de parole cumulé et la position attendue
   de chaque frontière (proportionnelle au nombre de phonèmes), avec un bonus pour les pauses longues.
2. Pour chaque réplique : raccourcit les pauses internes (garde `pause_keep` s plus `pause_ratio`
   de l'excédent, au plus `pause_max`), puis accélère le débit de `tempo` (atempo, sans changer la hauteur).
3. Écrit <lines_dir>/NN.wav (48 kHz mono), lus ensuite par tools/tts.py à la place de Kokoro.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
FRAME = 0.01


def decode(path: Path) -> np.ndarray:
    raw = subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def frames_db(x: np.ndarray) -> np.ndarray:
    w = int(FRAME * SR)
    n = len(x) // w
    rms = np.sqrt(np.mean(x[: n * w].reshape(n, w) ** 2, axis=1) + 1e-12)
    return 20 * np.log10(rms)


def silences(db: np.ndarray, thresh: float, min_len: float) -> list[tuple[int, int]]:
    """Intervalles silencieux [a, b) en trames."""
    out, start = [], None
    for i, q in enumerate(np.append(db < thresh, False)):
        if q and start is None:
            start = i
        elif not q and start is not None:
            if (i - start) * FRAME >= min_len:
                out.append((start, i))
            start = None
    return out


def choose_boundaries(sil: list[tuple[int, int]], speech_before: np.ndarray, ph: np.ndarray, total: float) -> list[int]:
    """Choisit len(ph) - 1 silences, dans l'ordre, comme frontières entre répliques.

    Coût d'une réplique : écart (en log) entre son temps de parole observé et celui attendu d'après
    son nombre de phonèmes au débit moyen ; bonus pour les pauses longues, typiques d'un changement
    de paragraphe. Programmation dynamique sur (frontière, silence).
    """
    K, S = len(ph) - 1, len(sil)
    sp = np.array([speech_before[a] for a, _ in sil])
    dur = np.array([(b - a) * FRAME for a, b in sil])
    rate = ph.sum() / total
    exp = ph / rate

    def seg(k: int, t0: float, t1: float) -> float:
        return (np.log(max(t1 - t0, 0.05) / exp[k]) / 0.18) ** 2

    bonus = 4.0 * np.minimum(dur, 1.0)
    INF = 1e18
    D = np.full((K, S), INF)
    P = np.full((K, S), -1)
    for j in range(S):
        D[0, j] = seg(0, 0.0, sp[j]) - bonus[j]
    for k in range(1, K):
        for j in range(k, S):
            prev = D[k - 1, :j] + np.array([seg(k, sp[i], sp[j]) for i in range(j)])
            i = int(np.argmin(prev))
            D[k, j] = prev[i] - bonus[j]
            P[k, j] = i
    last = np.array([D[K - 1, j] + seg(K, sp[j], total) for j in range(S)])
    j = int(np.argmin(last))
    picks = [j]
    for k in range(K - 1, 0, -1):
        j = int(P[k, j])
        picks.append(j)
    return picks[::-1]


def compress_pauses(x: np.ndarray, keep: float, ratio: float, pmax: float, thresh: float) -> np.ndarray:
    db = frames_db(x)
    w = int(FRAME * SR)
    xf = int(0.005 * SR)
    parts, pos = [], 0
    for a, b in silences(db, thresh, keep + 0.02):
        if a == 0 or b >= len(db) - 1:
            continue
        d = (b - a) * FRAME
        new = min(pmax, keep + ratio * (d - keep))
        cut0 = int((a * FRAME + new / 2) * SR)
        cut1 = int((b * FRAME - new / 2) * SR)
        if cut1 - cut0 <= 2 * xf:
            continue
        parts.append(x[pos:cut0 + xf].copy())
        pos = cut1 - xf
    parts.append(x[pos:].copy())
    out = parts[0]
    ramp = np.linspace(0, 1, 2 * xf)
    for p in parts[1:]:
        out = np.concatenate([out[: -2 * xf], out[-2 * xf:] * (1 - ramp) + p[: 2 * xf] * ramp, p[2 * xf:]])
    return out


def tempo(x: np.ndarray, factor: float) -> np.ndarray:
    if abs(factor - 1) < 1e-3:
        return x
    out = subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
         "-af", f"atempo={factor}", "-f", "f32le", "-"],
        input=x.astype(np.float32).tobytes(), capture_output=True, check=True,
    ).stdout
    return np.frombuffer(out, dtype=np.float32).astype(np.float64)


def trim(x: np.ndarray, thresh: float, pad: float = 0.03) -> np.ndarray:
    db = frames_db(x)
    v = np.where(db > thresh)[0]
    if len(v) == 0:
        return x
    w = int(FRAME * SR)
    return x[max(0, v[0] * w - int(pad * SR)) : min(len(x), (v[-1] + 1) * w + int(pad * SR))]


def main() -> None:
    spec = json.loads((ROOT / "script" / "narration.json").read_text(encoding="utf-8"))
    cfg = spec["voice_file"]
    texts = json.loads((ROOT / cfg["text"]).read_text(encoding="utf-8"))["text"].split("\n\n")
    n_lines = sum(len(s["lines"]) for s in spec["scenes"])
    if len(texts) != n_lines:
        sys.exit(f"{len(texts)} paragraphes dans {cfg['text']} pour {n_lines} répliques dans le script")

    x = decode(ROOT / cfg["path"])
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.9
    db = frames_db(x)
    thresh = cfg.get("silence_db", -40.0)
    speech = db >= thresh
    speech_before = np.concatenate([[0], np.cumsum(speech)]) * FRAME
    total_speech = speech_before[-1]

    from kokoro_onnx.tokenizer import Tokenizer

    tok = Tokenizer()
    ph = np.array([max(1, len(tok.phonemize(t, "fr-fr").replace(" ", ""))) for t in texts], dtype=float)
    sil = silences(db, thresh, 0.2)
    picks = choose_boundaries(sil, speech_before, ph, total_speech)
    cuts = [0] + [int((sil[j][0] + sil[j][1]) / 2) for j in picks] + [len(db)]

    out_dir = ROOT / cfg.get("lines_dir", "public/audio/voice_ext")
    out_dir.mkdir(parents=True, exist_ok=True)
    w = int(FRAME * SR)
    rates, before, after = [], 0.0, 0.0
    for i in range(n_lines):
        seg = trim(x[cuts[i] * w : cuts[i + 1] * w], thresh)
        before += len(seg) / SR
        seg = compress_pauses(seg, cfg.get("pause_keep", 0.12), cfg.get("pause_ratio", 0.35), cfg.get("pause_max", 0.4), thresh)
        seg = trim(tempo(seg, cfg.get("tempo", 1.0)), thresh)
        after += len(seg) / SR
        sf.write(out_dir / f"{i:02d}.wav", seg.astype(np.float32), SR)
        sp = (speech_before[cuts[i + 1]] - speech_before[cuts[i]])
        rates.append(ph[i] / max(sp, 1e-3))
    med = float(np.median(rates))
    for i, (t, r) in enumerate(zip(texts, rates)):
        flag = "  <-- à vérifier" if abs(r / med - 1) > 0.25 else ""
        pause = (sil[picks[i]][1] - sil[picks[i]][0]) * FRAME if i < len(picks) else 0.0
        print(f"{i:02d}  {r:5.1f} ph/s  pause après {pause:4.2f} s  {t[:56]}{flag}")
    print(f"Voix : {len(x) / SR:.1f} s au départ, {before:.1f} s de répliques, {after:.1f} s après resserrage")


if __name__ == "__main__":
    main()

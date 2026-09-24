#!/usr/bin/env python3
"""Synthèse de la narration (Kokoro-82M, voix française ff_siwis) et calcul de la timeline.

Entrée  : script/narration.json
Sorties : public/audio/voice/<hash>.wav   (une réplique par fichier, en cache)
          public/audio/voice.wav          (piste voix complète, placée sur la timeline)
          src/data/timeline.json          (images de début/fin de chaque scène, réplique, sous-titre)

Dans le script, "tts" est le texte prononcé (nombres en toutes lettres) et "sub" le texte
affiché. Le caractère "|" découpe une réplique en blocs de sous-titres ; "tts" et "sub"
doivent contenir le même nombre de blocs.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "script" / "narration.json"
VOICE_DIR = ROOT / "public" / "audio" / "voice"
TIMELINE = ROOT / "src" / "data" / "timeline.json"
SR = 24000


NBSP = "\u00a0"


def typo(text: str) -> str:
    """Typographie française des sous-titres : apostrophes courbes, espaces insécables."""
    text = text.replace("'", "\u2019")
    text = re.sub(r"\s*([:;?!%»])", lambda m: NBSP + m.group(1), text)
    text = re.sub(r"«\s*", "«" + NBSP, text)
    text = re.sub(r"(\d) (?=\d{3}\b)", r"\1" + NBSP, text)  # séparateur de milliers
    text = re.sub(r"(\d) (?=[^\W\d])", r"\1" + NBSP, text)  # nombre + mot
    return text


def load_kokoro():
    from kokoro_onnx import Kokoro

    return Kokoro(str(ROOT / "models" / "kokoro-q8.onnx"), str(ROOT / "models" / "voices-v1.0.bin"))


def trim_silence(audio: np.ndarray, thresh_db: float = -45.0, pad: float = 0.02) -> np.ndarray:
    win = int(0.01 * SR)
    n = len(audio) // win
    if n == 0:
        return audio
    rms = np.sqrt(np.mean(audio[: n * win].reshape(n, win) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms / (np.max(np.abs(audio)) + 1e-9))
    voiced = np.where(db > thresh_db)[0]
    if len(voiced) == 0:
        return audio
    a = max(0, voiced[0] * win - int(pad * SR))
    b = min(len(audio), (voiced[-1] + 1) * win + int(pad * SR))
    return audio[a:b]


def silence_gaps(audio: np.ndarray, thresh_db: float = -38.0, min_len: float = 0.07) -> list[float]:
    """Centres (en secondes) des silences internes, candidats pour caler les coupes de sous-titres."""
    win = int(0.01 * SR)
    n = len(audio) // win
    rms = np.sqrt(np.mean(audio[: n * win].reshape(n, win) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms / (np.max(np.abs(audio)) + 1e-9))
    quiet = db < thresh_db
    gaps, start = [], None
    for i, q in enumerate(quiet):
        if q and start is None:
            start = i
        elif not q and start is not None:
            if (i - start) * 0.01 >= min_len and start > 0:
                gaps.append((start + i) / 2 * 0.01)
            start = None
    return gaps


def synth(kokoro, text: str, voice: str, speed: float) -> np.ndarray:
    key = hashlib.sha1(f"{voice}|{speed}|{text}".encode()).hexdigest()[:16]
    path = VOICE_DIR / f"{key}.wav"
    if path.exists():
        audio, _ = sf.read(path, dtype="float32")
        return audio
    audio, sr = kokoro.create(text, voice=voice, speed=speed, lang="fr-fr", trim=True)
    assert sr == SR
    audio = trim_silence(audio.astype(np.float32))
    sf.write(path, audio, SR)
    return audio


def main() -> None:
    spec = json.loads(SCRIPT.read_text(encoding="utf-8"))
    fps = spec.get("fps", 30)
    voice = spec.get("voice", "ff_siwis")
    base_speed = spec.get("speed", 1.0)
    VOICE_DIR.mkdir(parents=True, exist_ok=True)

    from kokoro_onnx.tokenizer import Tokenizer

    tok = Tokenizer()
    kokoro = load_kokoro()

    def f(sec: float) -> int:
        return int(round(sec * fps))

    t = spec.get("start_pad", 0.0)
    placed: list[tuple[float, np.ndarray]] = []
    scenes_out = []
    report = []
    for scene in spec["scenes"]:
        s_start = t
        t += scene.get("lead", 0.5)
        lines_out = []
        lines = scene.get("lines", [])
        for li, line in enumerate(lines):
            tts_chunks = [c.strip() for c in line["tts"].split("|")]
            sub_chunks = [c.strip() for c in line.get("sub", line["tts"]).split("|")]
            if len(tts_chunks) != len(sub_chunks):
                sys.exit(f"[{scene['id']}#{li}] {len(tts_chunks)} blocs tts / {len(sub_chunks)} blocs sub")
            text = " ".join(tts_chunks)
            audio = synth(kokoro, text, voice, line.get("speed", scene.get("speed", base_speed)))
            dur = len(audio) / SR

            # Coupes des sous-titres : proportionnelles au nombre de phonèmes, calées sur un silence proche.
            weights = [max(1, len(tok.phonemize(c, "fr-fr").replace(" ", ""))) for c in tts_chunks]
            cum = np.cumsum(weights) / sum(weights)
            gaps = silence_gaps(audio)
            cuts = []
            for c in cum[:-1]:
                est = c * dur
                near = [g for g in gaps if abs(g - est) < 0.45 and (not cuts or g > cuts[-1] + 0.3)]
                cuts.append(min(near, key=lambda g: abs(g - est)) if near else est)
            bounds = [0.0, *cuts, dur]
            subs = [
                {"text": typo(sub_chunks[i]), "from": f(t + bounds[i]), "to": f(t + bounds[i + 1])}
                for i in range(len(sub_chunks))
            ]
            lines_out.append({"from": f(t), "to": f(t + dur), "subs": subs, "key": line.get("key", f"l{li}")})
            placed.append((t, audio))
            report.append((scene["id"], li, dur, len(text) / dur, text[:70]))
            t += dur
            if li < len(lines) - 1:
                t += line.get("pause", scene.get("gap", 0.35))
        t += scene.get("tail", 0.6)
        t = max(t, s_start + scene.get("min", 0))
        s_end_f = f(t)
        t = s_end_f / fps
        scenes_out.append({"id": scene["id"], "from": f(s_start), "duration": s_end_f - f(s_start), "lines": lines_out})

    t += spec.get("end_pad", 0.0)
    total = f(t)
    track = np.zeros(int(total / fps * SR) + SR, dtype=np.float32)
    for start, audio in placed:
        i = int(round(start * SR))
        track[i : i + len(audio)] += audio
    sf.write(ROOT / "public" / "audio" / "voice.wav", track, SR)

    TIMELINE.parent.mkdir(parents=True, exist_ok=True)
    TIMELINE.write_text(json.dumps({"fps": fps, "durationInFrames": total, "scenes": scenes_out}, ensure_ascii=False, indent=1), encoding="utf-8")

    for sid, li, dur, cps, txt in report:
        print(f"{sid:12s} #{li}  {dur:5.2f}s  {cps:4.1f} car/s  {txt}")
    print(f"Durée totale : {total / fps:.1f} s ({total} images)")


if __name__ == "__main__":
    main()

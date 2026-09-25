#!/usr/bin/env python3
"""Recale une musique externe sur la timeline, à la mesure près, et écrit music_file.edits.

Configuration (script/narration.json, bloc "music_file") :
  "bpm": 110, "beats_per_bar": 4, "first_downbeat": 0.0,
  "anchors": [{"bar": 7, "scene": "title"}, {"bar": 40, "scene": "labour"}, ...]

Chaque ancre place le début d'une mesure de la musique au début d'une scène (plus "offset" s).
Entre deux ancres, l'outil retire ou répète des mesures entières pour que la suivante tombe au
plus près (à une demi-mesure près), à l'endroit où la coupe s'entend le moins : il compare le
spectre des mesures et choisit le raccord entre les deux mesures les plus semblables.
Les coupes se font juste avant un temps fort. À lancer après tools/tts.py, avant tools/mix.py.
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from scipy.signal import stft

import mix

ROOT = Path(__file__).resolve().parent.parent
SR = mix.SR


def bar_spectra(x: np.ndarray, t0: float, bar: float, n: int) -> list[np.ndarray]:
    edges = np.geomspace(40, 16000, 49)
    out = []
    for k in range(n):
        seg = x[int((t0 + k * bar) * SR) : int((t0 + (k + 1) * bar) * SR)]
        f, _, Z = stft(seg, SR, nperseg=4096)
        P = np.abs(Z) ** 2
        b = np.log10(np.array([P[(f >= lo) & (f < hi)].sum(0) for lo, hi in zip(edges[:-1], edges[1:])]) + 1e-10)
        out.append(b)
    return out


def main() -> None:
    path = ROOT / "script" / "narration.json"
    spec = json.loads(path.read_text(encoding="utf-8"))
    tl = json.loads((ROOT / "src" / "data" / "timeline.json").read_text(encoding="utf-8"))
    cfg = spec["music_file"]
    fps = tl["fps"]
    total = tl["durationInFrames"] / fps
    bar = 60 / cfg.get("bpm", 110) * cfg.get("beats_per_bar", 4)
    d0 = cfg.get("first_downbeat", 0.0)
    seam = cfg.get("seam_before", 0.01)

    src = mix.load_music_file({"path": cfg["path"]}, int(400 * SR)).mean(0)
    src_len = np.max(np.nonzero(np.abs(src) > 1e-6)) / SR
    n_bars = int((src_len - d0) / bar)
    spectra = bar_spectra(src, d0, bar, n_bars)

    def sim(i: int, j: int) -> float:
        A, B = spectra[i], spectra[j]
        n = min(A.shape[1], B.shape[1])
        A, B = A[:, :n].ravel() - A.mean(), B[:, :n].ravel() - B.mean()
        return float(A @ B / (np.linalg.norm(A) * np.linalg.norm(B) + 1e-9))

    starts = {s["id"]: s["from"] / fps for s in tl["scenes"]}
    anchors = [(a["bar"], starts[a["scene"]] + a.get("offset", 0.0), a["scene"]) for a in cfg["anchors"]]
    T = lambda b: d0 + b * bar  # début de la mesure b dans la source

    # Plan en mesures : liste de (mesure source de début, mesure source de fin exclue).
    plan: list[list[int]] = []
    cur_bar = anchors[0][0]
    landed = anchors[0][1]
    log = []
    for (b0, v0, _), (b1, v1, name) in zip(anchors, anchors[1:]):
        need = int(round((v1 - landed) / bar))
        have = b1 - b0
        k = have - need
        if k > 0:  # retirer k mesures consécutives [a, a+k)
            cands = [(sim(a, a + k), a) for a in range(b0 + 1, b1 - k)]
            s, a = max(cands)
            plan += [[cur_bar, a], [a + k, b1]]
            log.append(f"{name:9s} : {k} mesure(s) retirée(s) ({a}-{a + k - 1}), raccord {s:.2f}")
        elif k < 0:  # répéter -k mesures [a+k, a)
            k = -k
            cands = [(sim(a - k, a), a) for a in range(b0 + k + 1, b1)]
            s, a = max(cands)
            plan += [[cur_bar, a], [a - k, b1]]
            log.append(f"{name:9s} : {k} mesure(s) répétée(s) ({a - k}-{a - 1}), raccord {s:.2f}")
        else:
            plan += [[cur_bar, b1]]
            log.append(f"{name:9s} : aucun changement")
        cur_bar = b1
        landed += need * bar
        log[-1] += f", tombe à {landed:6.2f} s pour {v1:6.2f} s (écart {landed - v1:+.2f} s)"
    plan.append([cur_bar, None])

    # Fusionne les segments contigus, puis convertit en secondes.
    merged: list[list] = []
    for a, b in plan:
        if merged and merged[-1][1] == a:
            merged[-1][1] = b
        else:
            merged.append([a, b])
    edits = []
    t_video = None
    pre_start = max(0.0, T(anchors[0][0]) - anchors[0][1])  # la source commence ici pour la vidéo t=0
    for i, (a, b) in enumerate(merged):
        s_from = pre_start if i == 0 else T(a) - seam
        s_to = src_len if b is None else T(b) - seam
        # Le premier segment démarre de sorte que la première ancre tombe pile sur sa scène.
        at = max(0.0, anchors[0][1] - T(anchors[0][0])) if i == 0 else t_video
        edits.append({"from": round(s_from, 4), "to": round(s_to, 4), "at": round(at, 4)})
        t_video = at + (s_to - s_from)
    cfg["edits"] = edits
    cfg["fade_out"] = cfg.get("fade_out", 1.5)
    path.write_text(json.dumps(spec, ensure_ascii=False, indent=2), encoding="utf-8")
    for line in log:
        print(line)
    print(f"{len(edits)} segments ; musique jusqu'à {t_video:.1f} s pour une vidéo de {total:.1f} s")


if __name__ == "__main__":
    main()

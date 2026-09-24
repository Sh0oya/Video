#!/usr/bin/env python3
"""Assemble script/narration.json (V2) : texte issu du panel d'écriture + mise en scène.

Usage : python3 tools/assemble_v2.py panel.json
panel.json = {"scenes": [{"id", "lines": [{"tts", "sub"}]}], "params": {...}, "chapters": {"c01".."c04"}}
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
W = {"type": "whoosh", "at": "scene", "offset": -0.25}

# Mise en scène par scène : respiration (s), intensité musicale, bruitages, chapitre.
STAGING = {
    "coldopen": dict(music=0.35, lead=2.4, gap=0.45, tail=0.7, chapter=None, sfx=[
        {"type": "tick", "at": "scene", "offset": 0.3, "repeat": 24, "every": 0.075, "gain": 0.35},
        {"type": "riser", "at": "line:0", "args": {"d": 2.2}, "gain": 0.8},
        {"type": "impact", "at": "line:0", "offset": -0.05, "gain": 1.0},
        {"type": "clunk", "at": "line:2", "offset": 0.05, "gain": 0.7},
    ]),
    "title": dict(music=0.5, lead=0.9, tail=1.3, chapter=None, sfx=[
        {**W, "gain": 0.9}, {"type": "shimmer", "at": "scene", "offset": 0.35, "gain": 0.8},
    ]),
    "stock": dict(music=0.6, lead=0.8, gap=0.5, tail=1.3, chapter="c01", sfx=[
        W, {"type": "tick", "at": "scene", "offset": 0.45, "repeat": 11, "every": 0.09, "gain": 0.4, "args": {"freq": 2200}},
        {"type": "blip", "at": "line:1", "offset": 0.3, "repeat": 3, "every": 0.27, "gain": 0.6},
        {"type": "shimmer", "at": "line:1", "offset": 1.0, "gain": 0.6},
    ]),
    "installs": dict(music=0.7, lead=0.6, gap=0.45, tail=1.0, chapter="c01", sfx=[
        W, {"type": "tick", "at": "sub:1:1", "offset": 0.05, "repeat": 18, "every": 0.065, "gain": 0.35},
        {"type": "blip", "at": "sub:1:2", "offset": 0.1, "gain": 0.7},
        {"type": "clunk", "at": "line:2", "offset": 0.1, "gain": 0.8},
        {"type": "tick", "at": "line:2", "offset": 0.3, "repeat": 16, "every": 0.12, "gain": 0.22, "args": {"freq": 3400}},
    ]),
    "quote": dict(music=0.45, lead=0.7, gap=0.6, tail=1.2, chapter="c02", sfx=[
        {**W, "gain": 0.8}, {"type": "shimmer", "at": "line:1", "offset": 0.1, "gain": 0.7},
    ]),
    "china": dict(music=0.7, lead=0.6, gap=0.45, tail=1.1, chapter="c02", sfx=[
        W, {"type": "tick", "at": "match:35\\d", "offset": 0.0, "repeat": 14, "every": 0.07, "gain": 0.3},
        {"type": "tick", "at": "match:59", "offset": -0.1, "repeat": 20, "every": 0.04, "gain": 0.3, "args": {"freq": 3100}},
        {"type": "impact", "at": "match:59", "offset": 0.73, "gain": 0.45},
    ]),
    "usajapan": dict(music=0.72, lead=0.6, gap=0.45, tail=1.0, chapter="c02", sfx=[
        W, {"type": "servo", "at": "sub:0:1", "offset": 0.15, "args": {"d": 0.9}, "gain": 0.7},
        {"type": "clunk", "at": "sub:0:1", "offset": 1.02, "gain": 0.6},
        {"type": "blip", "at": "match:38|12", "offset": 0.1, "gain": 0.6},
    ]),
    "labour": dict(music=0.55, lead=0.7, gap=0.5, tail=1.2, chapter="c03", sfx=[
        W, {"type": "blip", "at": "sub:1:1", "offset": 0.0, "repeat": 6, "every": 0.233, "gain": 0.45, "args": {"f0": 700, "f1": 420}},
        {"type": "clunk", "at": "line:2", "offset": 0.13, "repeat": 6, "every": 0.267, "gain": 0.55},
        {"type": "shimmer", "at": "line:2", "offset": 1.9, "gain": 0.7},
    ]),
    "hardtasks": dict(music=0.7, lead=0.6, gap=0.5, tail=1.1, chapter="c03", sfx=[
        W, {"type": "blip", "at": "sub:0:0", "offset": -0.1, "gain": 0.5},
        {"type": "servo", "at": "sub:0:0", "offset": 0.45, "args": {"d": 0.5}, "gain": 0.45},
        {"type": "blip", "at": "sub:0:1", "offset": -0.1, "gain": 0.5},
        {"type": "servo", "at": "sub:0:1", "offset": 0.45, "args": {"d": 0.5, "pitch": 1.1}, "gain": 0.45},
        {"type": "blip", "at": "sub:0:2", "offset": -0.1, "gain": 0.5},
        {"type": "servo", "at": "sub:0:2", "offset": 0.45, "args": {"d": 0.5, "pitch": 1.2}, "gain": 0.45},
        {"type": "shimmer", "at": "line:1", "offset": 0.4, "gain": 0.6},
    ]),
    "sectors": dict(music=0.82, lead=0.6, gap=0.5, tail=1.2, chapter="c03", sfx=[
        W, {"type": "blip", "at": "match:productiv", "offset": 0.0, "gain": 0.55},
        {"type": "blip", "at": "match:compétitiv", "offset": 0.0, "gain": 0.55, "args": {"f0": 990, "f1": 1480}},
        {"type": "blip", "at": "match:agroalimentaire|alimentaire", "offset": 0.0, "gain": 0.55, "args": {"f0": 1100, "f1": 1650}},
        {"type": "blip", "at": "match:logistique", "offset": 0.0, "gain": 0.55, "args": {"f0": 1175, "f1": 1760}},
        {"type": "blip", "at": "match:santé|médical", "offset": 0.0, "gain": 0.55, "args": {"f0": 1320, "f1": 1980}},
    ]),
    "forecast": dict(music=0.92, lead=0.6, gap=0.5, tail=1.4, chapter="c04", sfx=[
        W, {"type": "blip", "at": "line:1", "offset": 0.6, "gain": 0.6},
        {"type": "riser", "at": "line:2", "offset": 0.9, "args": {"d": 1.6}, "gain": 0.6},
        {"type": "impact", "at": "line:2", "offset": 0.9, "gain": 0.7},
    ]),
    "outro": dict(music=0.6, lead=0.7, gap=0.55, tail=5.5, chapter=None, sfx=[
        W, {"type": "servo", "at": "line:1", "offset": 0.2, "args": {"d": 1.2, "pitch": 0.9}, "gain": 0.6},
        {"type": "clunk", "at": "line:1", "offset": 1.45, "gain": 0.7},
        {"type": "shimmer", "at": "end", "offset": -4.6, "gain": 0.8},
        {"type": "impact", "at": "end", "offset": -4.7, "gain": 0.5},
    ]),
}
ORDER = list(STAGING)


def main() -> None:
    panel = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    old = json.loads((ROOT / "script" / "narration.json").read_text(encoding="utf-8"))
    by_id = {s["id"]: s for s in panel["scenes"]}
    missing = [i for i in ORDER if i not in by_id]
    if missing:
        sys.exit(f"scènes manquantes : {missing}")
    chapters = panel.get("chapters", {})
    params = panel.get("params", {})
    scenes = []
    for sid in ORDER:
        st = dict(STAGING[sid])
        ch = st.pop("chapter")
        num = {"c01": "01", "c02": "02", "c03": "03", "c04": "04"}.get(ch or "", "")
        lines = [{"tts": l["tts"].strip(), "sub": l["sub"].strip()} for l in by_id[sid]["lines"]]
        for l in lines:
            if l["tts"].count("|") != l["sub"].count("|"):
                sys.exit(f"{sid}: blocs tts/sub différents : {l}")
        name = chapters.get(ch, "").replace(" ?", "\u00a0?").replace(" !", "\u00a0!").replace(" :", "\u00a0:")
        scene = {"id": sid, "chapter": f"{num} · {name}" if ch else "", **st, "lines": lines}
        if sid in params:
            scene["params"] = params[sid]
        scenes.append(scene)
    out = {k: v for k, v in old.items() if k != "scenes"}
    out["scenes"] = scenes
    (ROOT / "script" / "narration.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    words = sum(len(l["tts"].replace("|", " ").split()) for s in scenes for l in s["lines"])
    print(f"{len(scenes)} scènes, {sum(len(s['lines']) for s in scenes)} répliques, {words} mots")


if __name__ == "__main__":
    main()

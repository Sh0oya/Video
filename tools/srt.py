#!/usr/bin/env python3
"""Sous-titres SRT à partir de src/data/timeline.json (sortie standard)."""
import json
from pathlib import Path

tl = json.loads((Path(__file__).resolve().parent.parent / "src" / "data" / "timeline.json").read_text(encoding="utf-8"))
fps = tl["fps"]
subs = [b for s in tl["scenes"] for l in s["lines"] for b in l["subs"]]


def ts(frame: int) -> str:
    ms = round(frame / fps * 1000)
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


for i, b in enumerate(subs, 1):
    end = b["to"] + 6
    if i < len(subs):
        end = min(end, subs[i]["from"])
    print(f"{i}\n{ts(b['from'])} --> {ts(end)}\n{b['text']}\n")

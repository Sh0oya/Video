#!/usr/bin/env python3
"""Planches contact des images de contrôle : out/stills/sheet-<scene>.jpg"""
import glob, os, sys
from PIL import Image, ImageDraw
files = sorted(glob.glob("out/stills/*-[0-9][0-9].jpg"))
groups = {}
for f in files:
    groups.setdefault(os.path.basename(f).rsplit("-", 1)[0], []).append(f)
for scene, fs in groups.items():
    ims = [Image.open(f) for f in fs]
    w, h = ims[0].size
    cols = 2
    rows = (len(ims) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * w + (cols + 1) * 8, rows * h + (rows + 1) * 8), (40, 40, 40))
    d = ImageDraw.Draw(sheet)
    for i, im in enumerate(ims):
        x = 8 + (i % cols) * (w + 8); y = 8 + (i // cols) * (h + 8)
        sheet.paste(im, (x, y))
        d.rectangle([x, y, x + 150, y + 26], fill=(255, 255, 0)); d.text((x + 6, y + 6), os.path.basename(fs[i]), fill=(0, 0, 0))
    sheet.save(f"out/stills/sheet-{scene}.jpg", quality=85)
    print(scene, len(ims))

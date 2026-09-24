# 5 millions de robots

Vidéo explicative en français (1920×1080, 30 i/s, environ 2 min 30), tirée du communiqué de l'IFR du 24 septembre 2026 : [« Five Million Robots Now Operate in Factories Globally »](https://ifr.org/ifr-press-releases/news/five-million-robots-now-operate-in-factories-globally) (rapport *World Robotics 2026*).

Tout est produit par du code, sans banque d'images, de sons ou de musique :

| Élément | Outil |
|---|---|
| Animation, graphiques, carte en points, bras robotisé | [Remotion](https://www.remotion.dev) (React + TypeScript, SVG) |
| Voix off | [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) (Apache-2.0), voix française `ff_siwis`, via `kokoro-onnx` |
| Musique | Synthèse additive et soustractive en numpy/scipy (`tools/music.py`) |
| Bruitages | Synthèse procédurale (`tools/sfx.py`) |
| Mixage | Ducking de la musique sous la voix, limiteur, normalisation EBU R128 à -14 LUFS (`tools/mix.py`) |
| Carte du monde | `world-atlas` + `d3-geo`, pré-calculée en points (`tools/build-map.mjs`) |

La vidéo finale est dans `video/cinq-millions-de-robots.mp4` (2 min 24, 1080p, 38 Mo), avec ses sous-titres `video/cinq-millions-de-robots.srt` et une miniature `video/miniature.jpg`. Les sous-titres sont aussi incrustés dans l'image.

## Contenu

Les chiffres, leurs sources et leur niveau de confiance sont détaillés dans [`docs/fiche-faits.md`](docs/fiche-faits.md). Le texte de la voix off et des sous-titres est dans [`script/narration.json`](script/narration.json).

## Reproduire le rendu

Prérequis : Node 22, Python 3.11, ffmpeg, Chromium (ou `chrome-headless-shell`).

```bash
npm install
pip install kokoro-onnx soundfile numpy scipy pillow
bash tools/fetch_models.sh   # modèle Kokoro q8 et voix, depuis npm

node tools/build-map.mjs     # carte en points -> src/data/map.json
python3 tools/tts.py         # voix + timeline -> src/data/timeline.json
python3 tools/music.py       # musique calée sur la timeline
python3 tools/mix.py         # mixage final -> public/audio/mix.wav
bash tools/render.sh         # rendu Remotion + multiplexage -> video/
```

La timeline est pilotée par la voix : `tts.py` mesure chaque réplique, en déduit la durée des scènes et le calage des sous-titres, puis les scènes Remotion lisent `timeline.json`. Modifier une phrase du script suffit pour que tout se recale : animations, sous-titres, musique et bruitages.

Outils de contrôle : `node tools/stills.mjs [scène...]` rend des images aux moments clés de chaque scène, et `python3 tools/contact.py` les assemble en planches contact dans `out/stills/`.

## Structure

```
script/narration.json   texte prononcé (tts) et affiché (sub), bruitages, intensité musicale
docs/fiche-faits.md     faits vérifiés, calculs, éléments écartés
src/scenes/             une scène par fichier
src/components/         fond, HUD, sous-titres, bras robotisé, carte, composants d'interface
src/data/               données des graphiques, timeline générée, carte générée
tools/                  voix, musique, bruitages, mixage, carte, rendu, contrôle
```

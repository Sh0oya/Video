# La grande accélération : 5 millions de robots

Vidéo explicative en français (1920×1080, 30 i/s, environ 2 min 52), tirée du communiqué de l'IFR du 24 septembre 2026 : [« Five Million Robots Now Operate in Factories Globally »](https://ifr.org/ifr-press-releases/news/five-million-robots-now-operate-in-factories-globally) (rapport *World Robotics 2026*).

Le fil conducteur : le monde se robotise à une vitesse folle, et cette accélération peut être une chance si elle est accompagnée. La vidéo suit quatre chapitres :

1. **Tout s'accélère** : 5 millions de robots en service, trois fois plus qu'en 2015, un record d'installations en 2025 (plus de 600 000, soit plus d'un par minute), au-delà des prévisions.
2. **Partout sur la planète** : l'Asie en tête, la Chine premier marché, les États-Unis qui passent devant le Japon.
3. **Une chance à saisir** : pénurie de main-d'œuvre, tâches répétitives, pénibles ou dangereuses, accidents du travail, productivité, prix, nouveaux secteurs. Chaque bénéfice est sourcé (IFR, Graetz et Michaels 2018, Gihleb et al. 2022) et nuancé : certains emplois disparaissent, et il faut former.
4. **Ce n'est qu'un début** : 655 000 installations prévues en 2026, 806 000 en 2029.

Tout est produit par du code, sans banque d'images, de sons ou de musique :

| Élément | Outil |
|---|---|
| Animation, graphiques, carte en points, bras robotisé, pictogrammes | [Remotion](https://www.remotion.dev) (React + TypeScript, SVG) |
| Voix off | [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) (Apache-2.0), voix française `ff_siwis`, via `kokoro-onnx` |
| Musique | Synthèse additive et soustractive en numpy/scipy, ré majeur, 110 BPM, intensité par scène (`tools/music.py`) |
| Bruitages | Synthèse procédurale (`tools/sfx.py`) |
| Mixage | Ducking de la musique sous la voix, creux de 5 dB sur 1-4 kHz pendant la parole, limiteur, normalisation EBU R128 à -14 LUFS (`tools/mix.py`) |
| Carte du monde | `world-atlas` + `d3-geo`, pré-calculée en points (`tools/build-map.mjs`) |

La vidéo finale est dans `video/cinq-millions-de-robots.mp4` (2 min 52, 1080p, 44 Mo), avec ses sous-titres `video/cinq-millions-de-robots.srt` et une miniature `video/miniature.jpg`. Les sous-titres sont aussi incrustés dans l'image.

## Contenu

Les chiffres, leurs sources, leur niveau de confiance, les formulations prudentes retenues et ce qu'il ne faut pas affirmer sont détaillés dans [`docs/fiche-faits.md`](docs/fiche-faits.md). Le texte de la voix off et des sous-titres est dans [`script/narration.json`](script/narration.json) ; il est assemblé par `tools/assemble_v2.py` (texte + mise en scène : respirations, intensité musicale, bruitages, chapitres).

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

La timeline est pilotée par la voix : `tts.py` mesure chaque réplique, en déduit la durée des scènes et le calage des sous-titres (blocs séparés par `|`), puis les scènes Remotion lisent `timeline.json`. Les animations se calent sur les mots prononcés (`findSub(scène, /motif/)`), les bruitages aussi (`"at": "match:motif"`). Modifier une phrase du script suffit pour que tout se recale : animations, sous-titres, musique et bruitages. Les textes affichés propres à une scène (titres, légendes, source du bandeau) sont dans ses `params`.

Outils de contrôle : `node tools/stills.mjs [scène...]` rend des images aux moments clés de chaque scène, et `python3 tools/contact.py` les assemble en planches contact dans `out/stills/`.

## Structure

```
script/narration.json   texte prononcé (tts) et affiché (sub), paramètres, bruitages, intensité musicale
docs/fiche-faits.md     faits vérifiés, calculs, formulations prudentes, éléments écartés
src/scenes/             une scène par fichier
src/components/         fond, HUD, sous-titres, bras robotisé, carte, pictogrammes, composants d'interface
src/data/               données des graphiques, timeline générée, carte générée
tools/                  voix, musique, bruitages, mixage, carte, assemblage du script, rendu, contrôle
```

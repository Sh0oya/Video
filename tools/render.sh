#!/usr/bin/env bash
# Rendu final : image (Remotion) + son (mix.wav) -> video/cinq-millions-de-robots.mp4 (+ .srt)
set -euo pipefail
cd "$(dirname "$0")/.."
BROWSER=${BROWSER:-/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell}
mkdir -p out video
npx remotion render src/index.ts Main out/video-muette.mp4 \
  --muted --codec=h264 --crf=17 --x264-preset=medium --pixel-format=yuv420p \
  --concurrency="${CONCURRENCY:-4}" --browser-executable="$BROWSER"
# Master Remotion en CRF 17, puis encodage de diffusion (x264 lent, réglage animation) + son AAC.
ffmpeg -y -hide_banner -loglevel error -i out/video-muette.mp4 -i public/audio/mix.wav \
  -map 0:v:0 -map 1:a:0 -c:v libx264 -crf "${CRF:-21}" -preset slow -tune animation -pix_fmt yuv420p \
  -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart \
  -metadata title="La grande accélération : 5 millions de robots" -metadata language=fra \
  video/cinq-millions-de-robots.mp4
python3 tools/srt.py > video/cinq-millions-de-robots.srt
ffprobe -hide_banner -v error -show_entries format=duration,size,bit_rate -of default=nw=1 video/cinq-millions-de-robots.mp4

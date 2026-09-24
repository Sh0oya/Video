#!/usr/bin/env bash
# Récupère le modèle TTS Kokoro-82M (q8, Apache-2.0) et les voix depuis npm,
# puis reconstruit les fichiers attendus par kokoro-onnx dans models/.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p models
tmp=$(mktemp -d)
(
  cd "$tmp"
  npm pack kokoro-q8-shards@1.0.0 kokoro-js@1.2.1 --silent >/dev/null
  mkdir shards voices
  tar xzf kokoro-q8-shards-1.0.0.tgz -C shards --strip-components=1
  tar xzf kokoro-js-1.2.1.tgz -C voices --strip-components=1
)
cat "$tmp"/shards/kokoro-q8.part{0,1,2,3,4,5}.bin > models/kokoro-q8.onnx
echo "fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478  models/kokoro-q8.onnx" | sha256sum -c -
python3 - "$tmp/voices/voices" <<'EOF'
import glob, os, sys
import numpy as np
src = sys.argv[1]
voices = {
    os.path.basename(f)[:-4]: np.fromfile(f, dtype=np.float32).reshape(510, 1, 256)
    for f in glob.glob(os.path.join(src, "*.bin"))
}
with open("models/voices-v1.0.bin", "wb") as fh:
    np.savez(fh, **voices)
print(f"{len(voices)} voix écrites dans models/voices-v1.0.bin")
EOF
rm -rf "$tmp"

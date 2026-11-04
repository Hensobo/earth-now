#!/usr/bin/env bash
# Downloads the planet and Moon textures from Solar System Scope (CC BY 4.0,
# https://www.solarsystemscope.com/textures/) and stores web-sized copies in
# web/textures/planets/. Run by .github/workflows/textures.yml; works locally too.
#
# Needs curl and ImageMagick (convert).
set -euo pipefail
cd "$(dirname "$0")/../.."

OUT=web/textures/planets
BASE=https://www.solarsystemscope.com/textures/download
mkdir -p "$OUT" build/textures

# name in the app   candidates on solarsystemscope.com (best first)   target width
while read -r name candidates width; do
  got=""
  for c in ${candidates//,/ }; do
    if curl -fsSL --retry 3 -o "build/textures/$c" "$BASE/$c"; then got=$c; break; fi
    echo "  not available: $c"
  done
  [[ -n "$got" ]] || { echo "No source for $name"; exit 1; }
  if [[ "$name" == *.png ]]; then
    convert "build/textures/$got" -resize "${width}x" -strip "$OUT/$name"
  else
    convert "build/textures/$got" -resize "${width}x" -strip -sampling-factor 4:2:0 -quality 86 -interlace JPEG "$OUT/$name"
  fi
  echo "$name <- $got ($(identify -format '%wx%h' "$OUT/$name"), $(du -h "$OUT/$name" | cut -f1))"
done <<'EOF'
mercury.jpg  8k_mercury.jpg,2k_mercury.jpg                         4096
venus.jpg    4k_venus_atmosphere.jpg,2k_venus_atmosphere.jpg       2048
moon.jpg     8k_moon.jpg,2k_moon.jpg                               4096
mars.jpg     8k_mars.jpg,2k_mars.jpg                               4096
jupiter.jpg  8k_jupiter.jpg,2k_jupiter.jpg                         4096
saturn.jpg   8k_saturn.jpg,2k_saturn.jpg                           4096
saturn-ring.png 8k_saturn_ring_alpha.png,2k_saturn_ring_alpha.png  2048
uranus.jpg   2k_uranus.jpg                                         2048
neptune.jpg  2k_neptune.jpg                                        2048
EOF

rm -rf build/textures
ls -la "$OUT"

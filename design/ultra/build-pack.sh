#!/usr/bin/env bash
# Builds the "Ultra" texture pack: NASA Blue Marble NG (day, October 2004, 21600x10800) and
# Black Marble 2016 (night, 13500x6750) at full resolution, cut into 10°x10° tiles
# (36 columns x 18 rows; column 0 starts at 180° W, row 0 at 90° N).
# Output: build/ultra/earth-now-ultra-<version>.zip and .sha256. Needs curl, libvips, zip.
# Run by .github/workflows/ultra-pack.yml. All imagery: public domain, credit "NASA Earth Observatory".
set -euo pipefail
cd "$(dirname "$0")/../.."
VERSION=${ULTRA_VERSION:-1}
OUT=build/ultra; PACK=$OUT/pack
rm -rf "$OUT"; mkdir -p "$PACK/day" "$PACK/night"
get() { curl -fsSL --http1.1 --retry 5 --retry-all-errors "$@"; }
DAY=https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography-bathymetry/october/world.topo.bathy.200410.3x21600x10800.jpg
NIGHT=https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/144000/144898/BlackMarble_2016_3km.jpg
get -o "$OUT/day.jpg" "$DAY"; get -o "$OUT/night.jpg" "$NIGHT"

tiles() {  # src  outdir  tile-px  quality
  local src=$1 dir=$2 px=$3 q=$4
  vips dzsave "$src" "$OUT/dz" --tile-size "$px" --overlap 0 --depth one --suffix ".jpg[Q=$q,strip]" --layout dz
  # dz names tiles <col>_<row>.jpg in dz_files/<level>/ (single level with --depth one)
  local lvl; lvl=$(ls "$OUT/dz_files" | sort -n | tail -1)
  mv "$OUT/dz_files/$lvl"/*.jpg "$dir/"; rm -rf "$OUT/dz_files" "$OUT/dz.dzi"
  echo "$(ls "$dir" | wc -l) tiles in $dir"
}
tiles "$OUT/day.jpg" "$PACK/day" 600 86      # 60 px per degree
tiles "$OUT/night.jpg" "$PACK/night" 375 88  # 37.5 px per degree

cat > "$PACK/manifest.json" <<JSON
{ "version": $VERSION, "tileDegrees": 10, "columns": 36, "rows": 18,
  "day":   { "tilePx": 600, "source": "NASA Blue Marble Next Generation, October 2004, 21600x10800" },
  "night": { "tilePx": 375, "source": "NASA Black Marble 2016, 13500x6750" },
  "credit": "NASA Earth Observatory (public domain)" }
JSON
(cd "$PACK" && zip -q -r -0 "../earth-now-ultra-$VERSION.zip" .)   # JPEGs do not compress further
(cd "$OUT" && shasum -a 256 "earth-now-ultra-$VERSION.zip" | tee "earth-now-ultra-$VERSION.zip.sha256")
du -h "$OUT/earth-now-ultra-$VERSION.zip"

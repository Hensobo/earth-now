#!/usr/bin/env bash
# High-resolution Earth textures for the launch videos only (the app keeps its own textures).
# Run by .github/workflows/launch-textures.yml (NASA hosts are not reachable from every sandbox).
#
# WebGL in the software renderer allows at most 8192 px per texture, so:
#   clouds-8k.jpg     NASA Blue Marble clouds, whole globe, 8192x4096 (grey = cloud cover)
#   night-8k.jpg      NASA Black Marble 2016, whole globe, 8192x4096
#   *-europe.jpg      full-resolution crops over Europe (lon -32..48, lat 22..74) for the close views:
#                     day (Blue Marble NG, October 2004, the month of web/textures/day.jpg),
#                     night (Black Marble 2016) and clouds
# All NASA imagery: public domain, credit "NASA Earth Observatory".
set -euo pipefail
cd "$(dirname "$0")/../.."
OUT=design/launch/textures
TMP=build/hires
mkdir -p "$OUT" "$TMP"
LON0=-32; LON1=48; LAT0=22; LAT1=74

ua="Mozilla/5.0 (compatible; earth-now-textures)"
get() { curl -fsSL --retry 3 -A "$ua" "$@"; }
# find the first link matching a pattern on one of the given pages
find_link() {
  local pattern=$1; shift
  for page in "$@"; do
    url=$(get "$page" 2>/dev/null | grep -oE "https?://[^\"' ]*${pattern}" | head -1 || true)
    [[ -n "$url" ]] && { echo "$url"; return 0; }
  done
  return 1
}

DAY_URL=$(find_link 'world\.topo\.bathy\.200410\.3x21600x10800\.(jpg|png)' \
  https://visibleearth.nasa.gov/images/73909/december-blue-marble-next-generation-w-topography-and-bathymetry \
  "https://visibleearth.nasa.gov/search?q=blue+marble+october+topography+bathymetry" \
  https://visibleearth.nasa.gov/collection/1484/blue-marble \
  "https://visibleearth.nasa.gov/collection/1484/blue-marble?page=2" \
  "https://visibleearth.nasa.gov/collection/1484/blue-marble?page=3" \
  https://neo.gsfc.nasa.gov/view.php?datasetId=BlueMarbleNG-TB) || true
NIGHT_URL=$(find_link 'BlackMarble_2016_3km(_geo)?\.(jpg|tif)' \
  https://earthobservatory.nasa.gov/features/NightLights/page3.php \
  https://earthobservatory.nasa.gov/images/144898/earth-at-night-black-marble-2016-color-maps \
  https://visibleearth.nasa.gov/images/144898/earth-at-night-black-marble-2016-color-maps) || true
CLOUD_URL=$(find_link 'cloud_combined_(21600|8192|4096)\.(jpg|tif|png)' \
  https://visibleearth.nasa.gov/images/57747/blue-marble-clouds \
  https://visibleearth.nasa.gov/images/57747/blue-marble-clouds/57747l) || true
echo "day:    ${DAY_URL:-not found}"
echo "night:  ${NIGHT_URL:-not found}"
echo "clouds: ${CLOUD_URL:-not found}"

crop() {  # src  out  width_of_src  quality
  local src=$1 out=$2 w=$3 q=$4
  local ppd; ppd=$(python3 -c "print($w/360)")
  local x y cw ch
  x=$(python3 -c "print(round(($LON0+180)*$ppd))"); cw=$(python3 -c "print(round(($LON1-$LON0)*$ppd))")
  y=$(python3 -c "print(round((90-$LAT1)*$ppd))");  ch=$(python3 -c "print(round(($LAT1-$LAT0)*$ppd))")
  vips extract_area "$src" "$TMP/crop.v" "$x" "$y" "$cw" "$ch"
  # stay within the 8192 px texture limit
  if (( cw > 8192 )); then vips resize "$TMP/crop.v" "$TMP/crop2.v" "$(python3 -c "print(8192/$cw)")"; mv "$TMP/crop2.v" "$TMP/crop.v"; fi
  vips jpegsave "$TMP/crop.v" "$out" --Q "$q" --strip
}
global8k() {  # src out width quality
  vips resize "$1" "$TMP/g.v" "$(python3 -c "print(8192/$3)")" --kernel lanczos3
  vips jpegsave "$TMP/g.v" "$2" --Q "$4" --strip
}

if [[ -n "${DAY_URL:-}" ]]; then
  get -o "$TMP/day.src" "$DAY_URL"
  w=$(vipsheader -f width "$TMP/day.src"); echo "day source ${w}px"
  crop "$TMP/day.src" "$OUT/day-europe.jpg" "$w" 90
fi
if [[ -n "${NIGHT_URL:-}" ]]; then
  get -o "$TMP/night.src" "$NIGHT_URL"
  w=$(vipsheader -f width "$TMP/night.src"); echo "night source ${w}px"
  global8k "$TMP/night.src" "$OUT/night-8k.jpg" "$w" 88
  crop "$TMP/night.src" "$OUT/night-europe.jpg" "$w" 90
fi
if [[ -n "${CLOUD_URL:-}" ]]; then
  get -o "$TMP/clouds.src" "$CLOUD_URL"
  w=$(vipsheader -f width "$TMP/clouds.src"); echo "cloud source ${w}px"
  vips colourspace "$TMP/clouds.src" "$TMP/cg.v" b-w
  if (( w > 8192 )); then global8k "$TMP/cg.v" "$OUT/clouds-8k.jpg" "$w" 90; crop "$TMP/cg.v" "$OUT/clouds-europe.jpg" "$w" 90
  else vips jpegsave "$TMP/cg.v" "$OUT/clouds-8k.jpg" --Q 90 --strip; fi
fi
rm -rf "$TMP"
ls -la "$OUT"
for f in "$OUT"/*.jpg; do echo "$f $(vipsheader -f width "$f")x$(vipsheader -f height "$f")"; done

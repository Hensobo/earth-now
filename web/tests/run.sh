#!/usr/bin/env bash
# Runs the renderer's unit tests with plain Node (no dependencies).
set -euo pipefail
cd "$(dirname "$0")"
TMP=$(mktemp -d)
cp ../planets.js "$TMP/planets.mjs"
cp planets.test.mjs "$TMP/"
node "$TMP/planets.test.mjs"

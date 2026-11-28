#!/bin/sh
# Renders the SW-160 gate 0 storyboard and times each concept: the two sheets
# (book and Mule) built from the pieces with their fonts embedded, then each
# rasterised by `npm run png` (headless Chrome, ADR 0008). Run from the
# repository root after `npm ci`:
#   sh docs/spikes/2026-11-27-idempotent-receiver-storyboard/render.sh [out-dir]
# Output: <out-dir>/<concept>-<scene>.svg and .png, and one timing line per concept.
set -eu
out="${1:-out/storyboard}"
here="docs/spikes/2026-11-27-idempotent-receiver-storyboard"
mkdir -p "$out"
for concept in A B C; do
  start=$(node -e 'console.log(Date.now())')
  npx tsx "$here/storyboard.mts" "$out" "$concept" >/dev/null
  for scene in book mule; do
    npm run -s png -- "$out/$concept-$scene.svg" --out "$out/$concept-$scene.png" --width 1400 >/dev/null
  done
  end=$(node -e 'console.log(Date.now())')
  echo "concept $concept: $((end - start)) ms (2 sheets, 12 frames)"
done

# Model sheet: supporting-characters (AB#337)

The model sheet of the supporting cast, Balão (`balao`, the requester and approver) and Chaves (`chaves`, the developer), for the owner's gate of change `supporting-characters` (art-direction SHEET-1; tasks 6.1 and 6.2). It is drawn by `model-sheet.ts` (this folder) from the built pieces in `src/pieces/` only, and shown in Google Chrome on macOS (`/Applications/Google Chrome.app`, headless, device scale 1) through one `<img>` per SVG with its Source faces embedded (ADR 0008; never `rsvg-convert`). The approved concept sheet (identity studio, 2026-11-12, concept C) is exploration and stays in the brain vault (art-direction DIV-2). Each file here is a build output kept only as evidence, under 200 KB.

| File | Size | What it shows |
|---|---|---|
| `model-sheet.svg` | 1580 x 3606 | the whole sheet: every panel below, with an English `<title>` and `<desc>` (illustration STY-8) |
| `balao.png` | 1444 x 1270 | Balão at scale 0.85: front and back on light and dark, the silhouette, the four expressions, `waiting` with the `doubt` emote at its spot (dark), `speaks` and `holdsStamp: { word: "GO" }` facing right and left (and on dark), a sheet the scene places beside it (answering), `done` with the `worked` emote facing left |
| `chaves.png` | 1384 x 1270 | Chaves at scale 0.85: the same views, silhouette and expressions, `failed` with the `problem` emote at its spot (dark), `types` under a `codePanel` the sheet places as the screen, `points` and `holdsSheet` facing right and left, `types` on dark, `done` with the `worked` emote facing left |
| `cast-row-light.png` | 1540 x 320 | Mira, Visor, Balão, Chaves, Drone, Kiu and Sinal at scale 1 on one ground line (motion CAST-5; Drone flies 40 above it) |
| `cast-row-dark.png` | 1540 x 320 | the same on the dark surface |
| `small-sizes.png` | 1540 x 210 | the same row shown with Balão 48 and 24 px tall, light and dark: the size at which the concept's Chaves read as a pillow |

The emote sits at the spot the README documents, (`x` ± 116·`scale`, `y` − 200·`scale`), at the character's scale (design §8). The typing tiles draw the README's screen, 132 × 62 at (106, −148) facing right and (−238, −148) facing left in Chaves's units, which clears that spot.

`model-sheet.ts` is a one-off evidence script, like the other spikes' scripts: it sits outside `tsconfig.json`'s `include`, so CI does not typecheck it; rerun it (below) when the pieces change.

## Commands

From the repository root, after `npm ci`:

```sh
D=docs/spikes/2026-11-12-supporting-characters
OUT=$(mktemp -d)
npx tsx $D/model-sheet.ts $OUT
cp $OUT/model-sheet.svg $D/
for f in balao chaves cast-row-light cast-row-dark small-sizes; do
  npm run png -- $OUT/$f.svg --out $D/$f.png
done
```

`npm run png -- $D/model-sheet.svg --out <file.png>` renders the whole sheet (about 500 KB, so it is not kept here).

# Evidence: sdd-scene-pieces (AB#333)

Renders for the owner's gate of change `sdd-scene-pieces` (task 7.2), made on 2026-11-12 with `evidence.ts` (this folder) and `npm run png`, Google Chrome on macOS (`/Applications/Google Chrome.app`, headless, device scale 1), each SVG shown through one `<img>` with its Source faces embedded (ADR 0008; never `rsvg-convert`). Each PNG is a build output kept here only as evidence (under 200 KB each).

| File | Size | What it shows |
|---|---|---|
| `visor-holds-sheet-light.png` | 1020 x 740 | Visor at scale 1.15 holding a short (150 x 120) and a tall (150 x 218) sheet with the `proposal.md` label, facing right (top) and left (bottom), on `color.panel` |
| `visor-holds-sheet-dark.png` | 1020 x 740 | the same with `surface: "dark"`, on `surface.dark.background` |
| `visor-sheet-label.png` | 1280 x 400 | the smallest sheet (80 x 80) with the label, which reaches behind Visor's left ear (accepted, design §2: the scene uses a page at least as wide as its label); a 150-wide sheet with the label; the same sheet without it |
| `visor-facing-light.png` | 1220 x 320 | Visor pointing, facing right and left, with and without the card |
| `visor-facing-dark.png` | 1220 x 320 | the same on the dark surface |
| `question-token-light.png` | 560 x 230 | a sheet's two question rows beside `questionToken` at scale 1, 1.5 and 2 |
| `question-token-dark.png` | 560 x 230 | the same on the dark surface (the page outlined as Visor's held sheet is: `surface.dark.muted`, marks in ink) |
| `stage.png` | 960 x 540 | the 1920 x 1080 stage shown at 960: the rings from `stageRingRadii` and `scene.ringWidth`, a dashed path from `scene.path*` with round caps, two question tokens on it |

A contact sheet that puts frames 4 and 6 of the gate-0 storyboard (AB#144, concept A) beside the same frames drawn with these pieces is written by the same script when it is given the gate-0 folder; it holds the gate-0 PNGs, so it stays out of the repository.

The held sheet's edge sits at x −98 (facing right) and 98 (facing left) in Visor's units: the first draft's ±84 put the hand over the first question mark facing left and over a tail check facing right (design §2).

## Commands

From the repository root, after `npm ci`:

```sh
D=docs/spikes/2026-11-12-sdd-scene-pieces
OUT=$(mktemp -d)
npx tsx $D/evidence.ts $OUT            # add the gate-0 folder as a second argument for the contact sheet
for f in visor-holds-sheet-light visor-holds-sheet-dark visor-sheet-label visor-facing-light visor-facing-dark question-token-light question-token-dark; do
  npm run png -- $OUT/$f.svg --out $D/$f.png
done
npm run png -- $OUT/stage.svg --out $D/stage.png --width 960
```

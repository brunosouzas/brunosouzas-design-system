# Evidence: sdd-without-with-spec-scene (AB#144, scene 1)

The stills' contact sheet of change `sdd-without-with-spec-scene` (task 6.2), made on 2026-11-12 from `npm run stills -- sdd-without-with-spec` (frames 89, 239, 309, 377, 509, 599, 689, 779) plus frame 450, rendered with `npx remotion still src/index.ts sdd-without-with-spec-16x9 <file> --frame=450` to show Visor holding the page. The nine 1920 x 1080 PNGs are laid out in an HTML grid at 600 x 338 each and screenshotted by Google Chrome on macOS (headless, device scale 1). The PNGs are build outputs kept here only as evidence.

| File | Size | What it shows |
|---|---|---|
| `stills-sheet.png` | 1928 x 1353 | the eight key frames of design §7 and frame 450, each captioned with its beat and article lines |
| `web-mp4-sheet.png` | 1928 x 1353 | the same nine frames taken from the web copy `out/web/sdd-without-with-spec-16x9.mp4` (x264 CRF 30), each extracted with `npx remotion ffmpeg -ss <frame/30> -i <file> -frames:v 1` (MOT-5: checked from the file the page loads) |

The video itself (`out/master/`, `out/web/`) is not committed: rendered videos are build outputs (AGENTS.md).

## Commands

From the repository root, after `npm ci` (rendering needs the network for the Source fonts):

```sh
npm run stills -- sdd-without-with-spec
npx remotion still src/index.ts sdd-without-with-spec-16x9 out/stills/sdd-without-with-spec-16x9/450.png --frame=450
npm run studio    # frame-by-frame review; the boundary frames 270, 330, 344, 378, 390, 476, 480, 502 and 660
npm run render -- sdd-without-with-spec
npx remotion ffmpeg -v error -y -ss 2.966667 -i out/web/sdd-without-with-spec-16x9.mp4 -frames:v 1 89.png   # one frame, n/30 seconds
```

The bundled ffmpeg's `select` filter does not survive `npx` quoting here, and it has no `tile` filter, so each frame is extracted on its own and the sheet is an HTML grid.

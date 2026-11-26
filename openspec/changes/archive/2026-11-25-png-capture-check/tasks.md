# Tasks: png-capture-check

"Unit" means vitest without a browser (`npm test`). "Local" means a command run with the owner's Chrome and recorded in the pull request.

## 1. Window, band and cut (cover-cli, "PNG render")

- [x] 1.1 `scripts/png.ts`: `captureWindow`, the band in `pngPage`, `decodePng`, `encodePng`, `pageOfCapture`, and `runPng` using them. Unit, `test/scripts/png.test.ts`: "PNG size read" (the window's size), "Page on a ground" (window 840 x 400), "Short, wide page: a capture drawn in part fails, a whole one is cut to the page", "PNG written through a rename, temporary folder removed".
- [x] 1.2 Local: `npm run png` on a 512x112 SVG and on a 1584x112 SVG with `--ground #1B1D24` writes 512x112 and 1632x160 PNGs drawn whole; with the least window height set to 0 by hand, the 512x112 run fails with `the browser drew the page only in part (row 112 of 120 is not drawn)`, a local check of the fix beside "Real PNG (local)".

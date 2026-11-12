# Circuit-breaker topology scene: stills and video sheets (AB#334)

Evidence for the owner's media gate (G3) of change `circuit-breaker-topology-scene`, rendered on 2026-11-12 from branch `feature/ab334-circuit-breaker-topology-scene`. The images here are JPEG copies, reduced to keep the repository small; the full-size PNGs and the web MP4 stay outside it (rendered videos are build outputs).

| File | What it shows | How it was made |
|---|---|---|
| `stills-sheet.jpg` | the 14 key-frame stills (59, 389, 449, 509, 569, 819, 949, 1019, 1149, 1219, 1489, 1599, 1799, 1919) and the 9 boundary frames of design §7 (174, 768, 870, 930, 1000, 1200, 1390, 1580, 1830), lossless PNGs at frame width 640 | `npm run stills -- circuit-breaker-topology` and `npx remotion still … --frame=<f>`, laid out in an HTML grid screenshotted by headless Chrome |
| `phone-sheet-341.jpg` | the 14 stills plus 174, 870 and 1000 at **341 CSS px**, the video's width in the site's article column on a 360 px phone (measured on the live page, design §2.2) | the same grid at 341 CSS px per frame, screenshotted at device pixel ratio 3 (1023 px per frame), reduced here to ratio 2 |
| `web-mp4-sheet.jpg` | the 14 still frames taken from the web copy `out/web/circuit-breaker-topology-16x9.mp4` (x264 CRF 30), frame width 640 | each frame extracted with `npx remotion ffmpeg -ss <(f − 0.1)/30> -i <web mp4> -frames:v 1` |
| `web-mp4-phone-sheet-341.jpg` | the same web-MP4 frames plus 174, 870 and 1000 at 341 CSS px | as the phone sheet |

Render on an Apple M3 (2026-11-12): 34 s for the composition; master 44.5 MB, web copy 1.4 MB; both 1920 × 1080, 30 fps, 64.0 s, one video stream and no audio stream (SCN-5). Frames 1830 and 1919 rendered as PNGs are byte-identical (SHA-256 `9ebab41b…0365`, SCN-4).

Review it frame by frame with `npm run studio` (folder `circuit-breaker-topology`).

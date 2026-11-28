# Idempotent Receiver Mule scene: stills and video sheets (SW-160)

Evidence for gate 1 (the spec plus the stills) and the owner's media gate (G3, the video) of change `idempotent-receiver-mule-scene`, first rendered on 2026-11-28 from branch `feature/sw-160-idempotent-receiver-mule-scene`. The scene is concept B of the gate-0 storyboard in [`../2026-11-27-idempotent-receiver-storyboard/`](../2026-11-27-idempotent-receiver-storyboard/README.md) (sheet `B-mule.png`), as the owner chose it; its sibling, the book scene, is in [`../2026-11-27-idempotent-receiver-book/`](../2026-11-27-idempotent-receiver-book/README.md).

| File | What it shows | How it was made |
|---|---|---|
| `stills-sheet.png` | the 18 key-frame stills (phase ends 39, 119, 179, 239, 329, 419, 499, 609, 669, 749, 809, 869, 959, 1049, 1129, 1179, 1249 and the last frame 1349) and 13 frames between phase ends (60, 150, 222, 280, 380, 445, 485, 520, 640, 850, 905, 1075 and 1195: the request leaving, the `?`, the statement row, the `worked` emote, the retry, the focus, the orange retry, the 409, the rewind, the red request, the `problem` emote, take 2's focus, take 1's count), each with its beat | `npm run stills -- idempotent-receiver-mule` and `npx remotion still … --frame=<f>`, laid out in an HTML grid screenshotted by headless Chrome |
| `web-mp4-sheet.jpg` | the 18 key frames taken from the web copy `out/web/idempotent-receiver-mule-16x9.mp4` (x264), frame width 640 | each frame extracted with `npx remotion ffmpeg -ss <(f − 0.1)/30> -i <web mp4> -frames:v 1`, laid out in an HTML grid screenshotted by headless Chrome, saved as JPEG |
| `web-mp4-phone-sheet-341.jpg` | the same web-MP4 frames plus 150, 280, 445, 520, 850 and 905 (the `?`, the `worked` emote, the focus, the 409, the red request, the `problem` emote) at **341 CSS px**, the video's width in the site's article column on a 360 px phone | the same grid at 341 CSS px per frame, device pixel ratio 2, saved as JPEG |

Timing on an Apple M5: the 18 stills took 30 s with the bundle cached. The owner approved gate 1 on `9c4b5e3` with every recommendation (design §7 of the change).

**Render (task 4.5), Apple M5, 2026-11-28, on `9c4b5e3`'s scene code (unchanged since):** `npm run render -- idempotent-receiver-mule` took 19 s for the composition; master 28.6 MB, web copy 917 KB; both 1920 × 1080, 30 fps, 45.0 s (1350 frames), one video stream and no audio stream (SCN-5). Frames 1250 and 1349 rendered as PNGs with `npx remotion still` are byte-identical (SHA-256 `1dd952c9…ef1c4`, SCN-4). The stills of the seven other scenes (116 PNGs) are byte-identical on this branch and on `origin/main` (`2df19be`). The rendered videos are build outputs and are not committed.

Review it frame by frame with `npm run studio` (folder `idempotent-receiver-mule`).

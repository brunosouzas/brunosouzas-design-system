# Idempotent Receiver book scene: stills and video sheets (SW-160)

Evidence for gate 1 (the spec plus the stills) and the owner's media gate (G3, the video) of change `idempotent-receiver-book-scene`, first rendered on 2026-11-27 from branch `feature/sw-160-idempotent-receiver-storyboard`. The scene is concept B of the gate-0 storyboard in [`../2026-11-27-idempotent-receiver-storyboard/`](../2026-11-27-idempotent-receiver-storyboard/README.md), as the owner chose it.

| File | What it shows | How it was made |
|---|---|---|
| `stills-sheet.png` | the 14 key-frame stills (phase ends 39, 119, 179, 239, 319, 379, 459, 519, 579, 619, 679, 739, 799 and the last frame 899) and 9 frames between phase ends (140, 350, 428, 450, 470, 610, 650, 698, 760), each with its beat | `npm run stills -- idempotent-receiver-book` and `npx remotion still … --frame=<f>`, laid out in an HTML grid screenshotted by headless Chrome |
| `web-mp4-sheet.jpg` | the 14 key frames taken from the web copy `out/web/idempotent-receiver-book-16x9.mp4` (x264), frame width 640 | each frame extracted with `npx remotion ffmpeg -ss <(f − 0.1)/30> -i <web mp4> -frames:v 1`, laid out in an HTML grid screenshotted by headless Chrome, saved as JPEG |
| `web-mp4-phone-sheet-341.jpg` | the same web-MP4 frames plus 140, 428, 650 and 698 at **341 CSS px**, the video's width in the site's article column on a 360 px phone | the same grid at 341 CSS px per frame, device pixel ratio 2, saved as JPEG |

Timing on an Apple M5: the 14 stills took 71 s on the first run (a cold bundle) and 23 to 24 s once the bundle was cached. The first stills (26 s of video) were retimed to 30 s by the owner's rule of 2026-11-27, understanding before length (design §2.8 of the change).

**Redrawn after gate 1, on 2026-11-28 (task 4.4a).** The owner's answers to points 5 and 8 of design §7 came through package 0.15.0 (SW-249): the channel is now a `queueNode` without words (x 196, width 180, height 96, centred on the lane and on the token's rest in the channel), and every EIP icon is flat, without the notation's offset shadows. `stills-sheet.png` was rendered again from the same frames, the same way; the timeline is unchanged. The 14 stills took 25 s with the bundle cached.

**Render (task 4.5), Apple M5, 2026-11-28, on `c68b537`:** `npm run render -- idempotent-receiver-book` took 14 s for the composition (15 s with the command); master 15.6 MB, web copy 473 KB; both 1920 × 1080, 30 fps, 30.0 s (900 frames), one video stream and no audio stream (SCN-5). Frames 800 and 899 rendered as PNGs with `npx remotion still` are byte-identical (SHA-256 `48eace01…a423`, SCN-4), as is the still of 899 from `npm run stills`. The rendered videos are build outputs and are not committed.

Review it frame by frame with `npm run studio` (folder `idempotent-receiver-book`).

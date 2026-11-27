# Idempotent Receiver book scene: stills for gate 1 (SW-160)

Evidence for gate 1 of change `idempotent-receiver-book-scene` (the spec plus the stills), rendered on 2026-11-27 from branch `feature/sw-160-idempotent-receiver-storyboard`. The scene is concept B of the gate-0 storyboard in [`../2026-11-27-idempotent-receiver-storyboard/`](../2026-11-27-idempotent-receiver-storyboard/README.md), as the owner chose it.

| File | What it shows | How it was made |
|---|---|---|
| `stills-sheet.png` | the 14 key-frame stills (phase ends 39, 99, 159, 219, 259, 319, 379, 439, 499, 539, 589, 639, 679 and the last frame 779) and 8 frames between phase ends (120, 290, 368, 400, 530, 560, 608, 650), each with its beat | `npm run stills -- idempotent-receiver-book` and `npx remotion still … --frame=<f>`, laid out in an HTML grid screenshotted by headless Chrome |

Timing on an Apple M5: the 14 stills took 71 s on a cold run (the first bundle) and 23 s once the bundle was cached. The video's render time is measured at the render, after gate 1.

Review it frame by frame with `npm run studio` (folder `idempotent-receiver-book`).

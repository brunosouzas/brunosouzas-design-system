# Idempotent Receiver Mule scene: stills for gate 1 (SW-160)

Evidence for gate 1 of change `idempotent-receiver-mule-scene` (the spec plus the stills), rendered on 2026-11-28 from branch `feature/sw-160-idempotent-receiver-mule-scene`. The scene is concept B of the gate-0 storyboard in [`../2026-11-27-idempotent-receiver-storyboard/`](../2026-11-27-idempotent-receiver-storyboard/README.md) (sheet `B-mule.png`), as the owner chose it; its sibling, the book scene, is in [`../2026-11-27-idempotent-receiver-book/`](../2026-11-27-idempotent-receiver-book/README.md).

| File | What it shows | How it was made |
|---|---|---|
| `stills-sheet.png` | the 18 key-frame stills (phase ends 39, 119, 179, 239, 329, 419, 499, 609, 669, 749, 809, 869, 959, 1049, 1129, 1179, 1249 and the last frame 1349) and 13 frames between phase ends (60, 150, 222, 280, 380, 445, 485, 520, 640, 850, 905, 1075 and 1195: the request leaving, the `?`, the statement row, the `worked` emote, the retry, the focus, the orange retry, the 409, the rewind, the red request, the `problem` emote, take 2's focus, take 1's count), each with its beat | `npm run stills -- idempotent-receiver-mule` and `npx remotion still … --frame=<f>`, laid out in an HTML grid screenshotted by headless Chrome |

Timing on an Apple M5: the 18 stills took 30 s with the bundle cached. The video's render time is measured at the render, after gate 1.

Review it frame by frame with `npm run studio` (folder `idempotent-receiver-mule`).

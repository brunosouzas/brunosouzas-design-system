# Idempotent Receiver book scene: stills for gate 1 (SW-160)

Evidence for gate 1 of change `idempotent-receiver-book-scene` (the spec plus the stills), rendered on 2026-11-27 from branch `feature/sw-160-idempotent-receiver-storyboard`. The scene is concept B of the gate-0 storyboard in [`../2026-11-27-idempotent-receiver-storyboard/`](../2026-11-27-idempotent-receiver-storyboard/README.md), as the owner chose it.

| File | What it shows | How it was made |
|---|---|---|
| `stills-sheet.png` | the 14 key-frame stills (phase ends 39, 119, 179, 239, 319, 379, 459, 519, 579, 619, 679, 739, 799 and the last frame 899) and 9 frames between phase ends (140, 350, 428, 450, 470, 610, 650, 698, 760), each with its beat | `npm run stills -- idempotent-receiver-book` and `npx remotion still … --frame=<f>`, laid out in an HTML grid screenshotted by headless Chrome |

Timing on an Apple M5: the 14 stills took 71 s on the first run (a cold bundle) and 23 to 24 s once the bundle was cached. The first stills (26 s of video) were retimed to 30 s by the owner's rule of 2026-11-27, understanding before length (design §2.8 of the change). The video's render time is measured at the render, after gate 1.

**Redrawn after gate 1, on 2026-11-28 (task 4.4a).** The owner's answers to points 5 and 8 of design §7 came through package 0.15.0 (SW-249): the channel is now a `queueNode` without words (x 196, width 180, height 96, centred on the lane and on the token's rest in the channel), and every EIP icon is flat, without the notation's offset shadows. `stills-sheet.png` was rendered again from the same frames, the same way; the timeline is unchanged. The 14 stills took 25 s with the bundle cached.

Review it frame by frame with `npm run studio` (folder `idempotent-receiver-book`).

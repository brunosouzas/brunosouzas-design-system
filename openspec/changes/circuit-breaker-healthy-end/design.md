# Design: circuit-breaker-healthy-end

## Context

See proposal.md for the request and Bruno's decisions (2026-11-12: q53 A; HTTP codes allowed, replacing q54; q55 A). Observed today (0.12.0, `655525d`):

- `src/scenes/circuit-breaker-states/scene.ts`: the pilot's timeline. The last phase is CLOSED `[820, 990]` with eight `ok` events every 9 frames (834 to 897); outro 910; duration 1000. The calls are squares in the blocks (`CallSquare`: `ok` white with ✓, `fail` red with ✕, `blocked` ink with –); no code or backend is drawn.
- `src/brand/motion.ts`, `focusFactors`: dims the blocks that are not in focus only while `introEnd <= frame < outro`; from the outro every opacity factor is 1. So at frame 909 CLOSED is lit and OPEN and HALF_OPEN are at `motion.dimOpacity` (0.42), and at frame 910 all three jump to full opacity (stills `909.png` and `910.png` differ; `990.png` and `999.png` are the final still with every block lit).
- `focusFactors` and `blockAppearance` are used only by this scene (`Scene.tsx`) and by `test/brand/motion.test.ts`; `publish-subscribe` draws its nodes with its own flow logic. `src/brand/motion.ts` is not in the package's `exports`, so no consumer outside the repository calls it.
- Frame 909 of 0.12.0 is the end Bruno asked for (CLOSED lit with eight `ok`, OPEN and HALF_OPEN dimmed, the CLOSED caption); the change makes it the final still, gives the healthy stretch before it more time and adds the codes.
- The first call is at frame 56, so frame 55 is the last frame with nothing for a code to show. Stills of 0.12.0 render byte-identically twice on this machine (frame 55 of 16x9-pt; earlier, 775 of 16x9-en and 819 of 4x5-pt), so a SHA-256 comparison is a valid local proof, as in change `sdd-scene-pieces`.
- The article's codes (both languages, same line numbers): L75 sequence diagram, CLOSED: "200 OK comes back"; L84 "Closed circuit — calls pass through normally"; L87-88 "the first 5 calls are real 502s; the 6th is already 503, without the backend being called"; L105-107 replica table: "502 (real backend failure)", "503 circuit_open". L87-88 and L105 are cited for what a code means (`502` a real backend failure, `503` blocked without calling the backend); the scene's first CLOSED phase keeps its mixed results (ok, ok, fail, ok, fail, fail, fail, fail), so it does not replay the demo's five failures in a row.

## Goals / Non-Goals

**Goals:** the reader sees what each call got back (`200`, `502`, `503`) through the whole loop; a final CLOSED stretch of 8 s whose calls come back `200`; only CLOSED lit from that stretch to the last frame; a 3 s final still; the existing elements' timing untouched up to frame 819; no new token, colour or piece.

**Non-Goals:** a backend element, a rolling window, any code or string beyond `200`, `502`, `503`, a caption change, any change to `publish-subscribe`.

## Decisions

### 1. The outro keeps the focus (shared rule) rather than a per-scene option

| Option | For | Against |
|---|---|---|
| **A. Change the shared focus rule: dimming runs to the last frame; the outro changes no factor** (chosen) | One condition in `focusFactors`; reuses the exact dimming of the run (MOT-6: `motion.dimOpacity`, `motion.focusScale`, `motion.focus`); removes the 0.42-to-1 jump at the outro; the only caller is this scene | Changes "Focus on the active state" for every future state-machine scene (none exists) |
| B. An opt-in timeline field (`outroFocus: "keep" \| "release"`) | No shared behaviour changes | Configurability nobody asked for (config.yaml, specs rule); a second mode to test with one user |
| C. Override the appearance in `Scene.tsx` | Touches only the scene | Frame logic outside the pure, tested functions (scene workflow: "keep frame logic in pure functions"); duplicates `focusFactors` |

`outro` keeps its other meaning: the frame from which nothing moves (the catalogue's "Movement inside the reading hold" check). The `Timeline.outro` doc comment changes from "every block back to full opacity" to that meaning.

### 2. Eight `ok` calls, one every 26 frames, filling the eight CLOSED slots once

| Option | For | Against |
|---|---|---|
| **A. Eight calls spread over the stretch, 26 frames apart** (chosen) | No new slot logic: the slots fill as in the first CLOSED phase; 26 frames is the rhythm of the OPEN phases' blocked calls; each call re-pops the `200` tag, so the stretch reads "call, 200, call, 200"; ends on eight of eight `ok`, the window full of successes (article L66) | About one call per 0.87 s, slower than the first CLOSED phase (17 frames) |
| B. More calls with a rolling window (slots shift, oldest out) | Literal sliding window (L66); calls as dense as in the first phase | New frame logic in `blockContents` and a new reading device (MOT-1 choice); the first CLOSED phase does not roll |
| C. Keep the 9-frame burst (834 to 897) and only lengthen the hold | Smallest timeline edit | The slots are full after 2 s; the remaining 6 s show no call |

### 3. Timing of the end

The final CLOSED phase starts at 820 as before. The outro sits 240 frames (8.0 s) after it, at 1060, and the composition ends `motion.readingHold` (90) frames later, at 1149 (duration 1150); the outro equals `duration - readingHold`, the catalogue's limit. The last call lands at 1016, 44 frames before the outro: the pop spring is within 0.0000012 of 1 at 44 frames (it is 1.017 at 13 frames, which is why the 0.12.0 frames 910 and 990 differ), so the 90 hold frames are pixel-identical (SCN-4); the square and the tag use the same spring. The phase ends at 1140, `duration - 10` as in the pilot (990 of 1000), so the phase-end still falls inside the hold.

### 4. One code tag per block, showing its latest call

| Option | For | Against |
|---|---|---|
| **A. One tag per block, on its top border, with the code of the block's latest call** (chosen) | Big enough to read in the page video (pill size, 30 px, like the transition labels); three tags at most on screen; re-pops on each call, so the code is tied to the call that just landed; the squares keep the history; reuses the call squares' fills and the pill's shape (tokens only) | Shows only the latest code per block, not each square's |
| B. A code under every square | Every call has its code | Up to fifteen 3-digit labels at once; at about 18 px they are unreadable once the 1920 frame is shown 800 px wide on the page; the CLOSED row has no room below in 4:5 |
| C. The code inside each square instead of its glyph | No new element | Same size problem (a 40 px square); loses the ✓ ✕ – the pilot approved |

The tag is drawn inside its block's element, so it inherits the block's pop-in, focus and dimming (at the end OPEN's `503` and HALF_OPEN's `200` are dimmed with their blocks). Its own style therefore carries only the pill pop-in from the latest call's frame; the product "block × pop-in" is its effective appearance, computed for the tests and never written into its style (otherwise a dimmed tag would show at 0.42² ≈ 0.18). It is absolutely positioned, out of the block's centred flex column, so the state name, the squares and the countdown keep their 0.12.0 positions. It belongs to the block layer of SCN-6 (arrows, blocks, tokens, pills, caption): a travelling token or a transition pill passes over it, never under.

Look: a pill (`radius.pill`, `outline.small` in ink, `shadow.small`), fill and text colour from `callAppearance(kind)` (`ok`: `color.white` with `color.ink`; `fail`: `color.state.failure` with `color.white`; `blocked`: `color.ink` with `color.white`), text `font.mono` at `font.weightBold`, size `layout.size.pill` (30 in both formats), padding as the transition `Pill` (0.35 and 0.8 of the size). About 102 × 56 px.

Place: a new layout value per format, `codes: Record<StateId, number>`, the distance from the block's outer left edge to the tag's centre; the centre sits on the middle of the block's top border. Inside the block's element (whose padding box starts inside the border) that is `left = codes[state] - outline.block`, `top = -outline.block / 2`, translated by half the tag's size, before the block's scale. Composition centres at scale 1:

| Format | CLOSED | OPEN | HALF_OPEN |
|---|---|---|---|
| 16:9 (`codes` 80, 80, 80) | (270, 150) | (1330, 150) | (770, 610) |
| 4:5 (`codes` 80, 80, 180) | (180, 250) | (660, 250) | (470, 790) |

Clearances estimated from the layout numbers and the focus scale 1.06 about each block's centre (text widths estimated from size, to be confirmed on the stills): 16:9, the toOpen pill spans about x 760 to 1160 around y 160 and the toOpen arrow enters OPEN at (1232, 255), both clear of the OPEN tag (x 1279 to 1381); the HALF_OPEN to OPEN arrow leaves at (1080, 598), 260 px right of the HALF_OPEN tag. 4:5: the toOpen arrow leaves CLOSED at x 305 and enters OPEN at x 785, more than 70 px from the nearest tag; the toOpen pill ends near y 200, about 15 px above the OPEN tag when OPEN is in focus; the HALF_OPEN tag moved to 470 because at 370 it came within 9 px of the PT three-line HALF_OPEN to CLOSED pill (about x 4 to 336, y 614 to 746) in frames 780 to 819, when HALF_OPEN is in focus; at 470 it spans about x 414 to 518 in focus, 78 px from that pill and 120 px from the HALF_OPEN to OPEN arrow (x 640). The state names are centred and start about 40 px below the top border; the tag reaches 28 px into the block, so it sits about 12 px above them. If a still shows an overlap, one `codes` value is tuned before Bruno's review and this table is updated.

## Timeline, frame by frame

30 fps; phase ranges inclusive. Rows marked "same" keep the 0.12.0 value.

| Item | 0.12.0 (pilot) | This change |
|---|---|---|
| Duration | 1000 (33.33 s) | **1150 (38.33 s)** |
| Intro end (first phase starts, dimming starts) | 40 | same |
| Outro (no movement from here on) | 910 (every block back to full opacity) | **1060 (focus and dimming unchanged)** |
| Start marker fade | 4 to 14 | same |
| Block pop-in (CLOSED, OPEN, HALF_OPEN) | 6, 14, 22 | same |
| Rings fade | 0 to 20 | same |
| Phase 1 CLOSED `[40, 200]` | ok, ok, fail, ok, fail, fail, fail, fail at 56, 73, 90, 107, 124, 141, 158, 175 | same; **codes 200, 200, 502, 200, 502, 502, 502, 502** |
| Phase 2 OPEN `[245, 365]` | blocked at 262, 288, 314, 340 | same; **503 × 4** |
| Phase 3 HALF_OPEN `[410, 500]` | ok at 424, fail at 458 | same; **200, 502** |
| Phase 4 OPEN `[545, 620]` | blocked at 560, 586 | same; **503 × 2** |
| Phase 5 HALF_OPEN `[665, 775]` | ok at 680, 710, 740 | same; **200 × 3** |
| Phase 6 CLOSED | `[820, 990]`, ok at 834, 843, 852, 861, 870, 879, 888, 897 | **`[820, 1140]`, ok at 834, 860, 886, 912, 938, 964, 990, 1016; 200 × 8** |
| Fires | CLOSED to OPEN 215; OPEN to HALF_OPEN 380 and 630; HALF_OPEN to OPEN 515; HALF_OPEN to CLOSED 790 | same |
| Arrow draw (first fire minus 18) | 197, 362, 497, 772 | same |
| Pill pop-in (draw plus 8) | 205, 370, 505, 780 | same |
| Slots | CLOSED 8, OPEN 4, HALF_OPEN 3 | same |
| `arrowLead`, `pillDelay` | 18, 8 | same |
| Code tags | none | **from 56: each block's latest call; hidden at a phase start until its first call (CLOSED 820 to 833, OPEN 545 to 559, HALF_OPEN 665 to 679)** |
| Focus at the end | CLOSED lit to 909; all lit from 910 | **CLOSED lit, OPEN and HALF_OPEN at `motion.dimOpacity`, to 1149** |
| Final still | 910 to 999, all three lit (910 to 922 still settling) | **1060 to 1149: CLOSED lit with `200`; OPEN `503` and HALF_OPEN `200` dimmed; identical** |
| Final caption | CLOSED + article L42 | same |

What stays identical: frames 0 to 55 (pixels, pinned by stills); the frame logic of every 0.12.0 element at frames 0 to 819 (pinned by a unit test). From frame 56 every frame shows code tags and differs from 0.12.0.

## Beats and article lines (MOT-1)

Article: `writing/circuit-breaker-in-mulesoft/circuit-breaker-in-mulesoft.{en,pt}.md` in `brunosouzas-content`; the same line numbers in both languages.

| Frames | Beat | Article line |
|---|---|---|
| 0 to 55 | Intro and CLOSED takes the focus, unchanged | L40-46 |
| 56 to 200 | Calls pass through: two `200`, then failures come back `502` (five in all) until the threshold | L42; L75 ("200 OK comes back"); L87-88 ("the first 5 calls are real 502s"); L105 ("502 (real backend failure)"); L46 diagram label |
| 215 to 365 | OPEN: calls are blocked at once, each `503`; the countdown runs | L43 ("without touching the backend"); L88 ("the 6th is already 503, without the backend being called"); L106-107 ("503 circuit_open"); L46 (resetTimeout) |
| 380 to 500 | HALF_OPEN: a test call `200`, then a test call fails `502`, back to OPEN | L44; L46 ("any failure during the test"); L105 |
| 545 to 620 | OPEN again: `503` | L43, L88 |
| 630 to 775 | HALF_OPEN: three test calls `200` | L44; L95 ("back to CLOSED once a test call succeeds") |
| 790 to 812 | The token of HALF_OPEN to CLOSED travels; "enough successful test calls" | L44, L46 (diagram label); L95 |
| 820 to 850 | CLOSED takes the focus; OPEN and HALF_OPEN dim (with their last codes); the CLOSED caption fades in; the CLOSED tag is hidden until the first call | L42 (caption, verbatim) |
| 834 to 1016 | Eight calls pass through, each comes back `200`, filling the window | L42 "calls pass through normally; the circuit watches the outcomes"; L66 "sliding window of the last N calls"; L75; L84 "Closed circuit — calls pass through normally" |
| 1060 to 1149 | Final still: only CLOSED lit with `200`; OPEN `503` and HALF_OPEN `200` still on screen, dimmed | L42-43 (in CLOSED the circuit keeps watching and can open again: the states stay), q53 A |

Marked choices approved by Bruno on 2026-11-12 (MOT-1): `200` on `ok` calls ("pass through normally"; also L75); the dimming of OPEN and HALF_OPEN at the end (q53 A). Derived from his "real failures 502", not approved separately: `502` on a failed HALF_OPEN test call too (a test call reaches the backend, L44; L105). Choices for G1: see Questions for G1. Out of scope as outcomes the article only implies: the circuit opening again after the healthy end; a backend receiving the calls.

## Text table and final caption

The text table gains `codes: { ok: "200", fail: "502", blocked: "503" }` in both `pt` and `en` (identical: codes are not translated, SCN-1). Nothing else changes. From frame 830 (820 plus `motion.fade` 10) to 1149 the caption is:

| Language | Pill | Sentence | Source |
|---|---|---|---|
| en | CLOSED | Calls pass through normally; the circuit watches the outcomes. | EN L42: "**CLOSED**: calls pass through normally; the circuit watches the outcomes." |
| pt | CLOSED | Chamadas passam normalmente; o circuito observa os resultados. | PT L42: "**CLOSED**: chamadas passam normalmente; o circuito observa os resultados." |

## Questions for G1

Each with the recommendation; none blocks the spec's structure, each changes values only.

1. **Backend.** Bruno's request says "ok calls reaching the backend"; the scene draws no backend (neither does the article's states diagram, L46). Recommendation: no backend element; the calls stay the squares, `200` says the call went through, and `503` plus the OPEN caption ("without touching the backend") say it did not. Alternative: a backend piece and call tokens, a new layout in both formats (its own change).
2. **"About 8 s of ok calls".** This change measures 8.0 s from the CLOSED phase start (820) to the outro (1060); the eight calls themselves span 834 to 1016 (6.1 s), then 1.5 s settles before the 3 s still. Recommendation: keep. Alternative: calls every 30 frames from 834 to 1044, outro 1088, duration 1178 (calls span 7 s, 39.3 s total).
3. **One tag per block** with the latest call's code (decision 4) rather than a code on every square. Recommendation: keep (readable at page size).
4. **The dimmed tags on the final still** (OPEN `503`, HALF_OPEN `200`). A reader might read the dimmed `503` as "still blocking". Recommendation: keep them (they are the last thing each state did, dimmed like their blocks; the lit CLOSED with `200` and its caption carry the present). Alternative: hide the tags of dimmed blocks from 820.
5. **Rhythm** of the healthy calls: 26 frames, the OPEN phases' rhythm (decision 2). Recommendation: keep.
6. **Release type** `feat:` (minor) instead of the `fix:` the request suggested, because the codes add a visible element, a text key and layout values. Recommendation: `feat:`.

## Stills plan

1. **Baseline (done, 2026-11-12):** at `655525d`, frame 55 of the four compositions; SHA-256 in `stills-0.12.0.sha256`. A re-render gave the same hash. (The 0.12.0 phase-end stills, 200 to 999, were also rendered for the before-and-after sheet; they are not a pin, since codes change them.)
2. **Unchanged before the first call (local):** frame 55 at the change's head on the same machine; the four SHA-256 equal the baseline. If one differs, re-render the baseline from a worktree at `655525d` in the same session before concluding.
3. **Phase stills:** `npm run stills -- circuit-breaker-states`: 200, 365, 500, 620, 775, 1140, 1149 (28 PNGs).
4. **Existing elements in place (local):** render 200, 365, 500, 620 and 775 at `655525d` (a worktree) and at the head on the same machine; paint the same mask over every tag's area in both (`npx remotion ffmpeg -i <png> -vf "drawbox=x=..:y=..:w=..:h=..:color=black:t=fill,..." -f rawvideo -pix_fmt rgba - | shasum -a 256`); the 20 pairs of hashes are equal.
5. **Code tag frames (local, four compositions):** 56 (first `200`), 175 (fifth `502`), 340 (`503` with the countdown), 458 (test `502`), 586, 740, 790 and 800 (HALF_OPEN in focus with the HALF_OPEN to CLOSED pill near the HALF_OPEN tag): look at every PNG for overlaps and contrast (MOT-5).
6. **Healthy end frames:** 820 (CLOSED takes the focus, no tag), 834 (first `200`), 912 (the frame where 0.12.0 had already lit every block), 1016 (eighth `200`), 1060 (outro). 1060, 1140 and 1149 have the same SHA-256.
7. **Before and after sheet:** 0.12.0's 999 next to this change's 1149, and 0.12.0's 175 and 340 next to this change's, per composition, in the pull request.
8. **From the web file (MOT-5):** after the render, a contact sheet of frames 175, 340, 458, 775, 912 and 1149 taken from `out/web/<id>.mp4`.

## Risks / Trade-offs

- [Stills differ across machines or browser versions] → the SHA-256 and masked proofs are local and same-machine; the CI proofs are the 0.12.0 frame-hash fixture over frames 0 to 819 (generated by the 0.12.0 code, so a change in `motion.ts` that alters an existing element fails it) and the frame-state comparison over 1060 to 1149.
- [A final still hash differs because a spring has not settled] → move the last healthy call earlier (keep at least 44 frames before the outro) and update the timeline table.
- [A tag collides with a state name, arrow or token in one format] → positions come from one layout value per format; checked on the stills of step 4 before Bruno's review.
- [The shared focus rule changes for future state-machine scenes] → intended: a final still that shows the last state, as during the run; a scene that needs every block lit at the end asks for it in its own change.
- [38 s is longer than the 33 s the site and post were planned with] → SCN-5: length follows what the scene must show; the 4:5 cut keeps the same timeline.
- [The approved pilot look changes from frame 56] → Bruno asked for the codes; the before-and-after sheet shows the difference at G1 and at the stills review.

## Migration Plan

None beyond the release: a `feat:` minor from release-please. The site's embed (AB#142) and the article's content pull request (q55 A) take the new web copy after the release; the old 1000-frame video is a build output and is not kept.

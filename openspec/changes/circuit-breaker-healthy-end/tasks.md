# Tasks: circuit-breaker-healthy-end

Every scenario of the three spec deltas is named below with the test that proves it. Unit tests run in CI (`npm test`); "local" checks need rendering (network, Chrome) and run on the machine that recorded `stills-0.12.0.sha256`.

## 1. Pins written before any code change

- [ ] 1.1 In a new `test/scenes/circuit-breaker-frames.test.ts`, copy the 0.12.0 timeline (`scene.ts` at `655525d`) and text table as literals. Verify: the file's literal equals the 0.12.0 `scene.ts` values (diff by eye against `git show 655525d:src/scenes/circuit-breaker-states/scene.ts`), and the tests of 1.2 pass on the unchanged code.
- [ ] 1.2 Write the comparison helper and the tests "Frame logic equals 0.12.0 before frame 820" (unit: `blockAppearance`, `blockContents`, `captionAt`, `arrowAt` with `arrowDrawAt`, `pillPopIn` with `pillAt`, `tokenPositions` for every state and transition at every frame 0 to 819) and "Earlier frames differ on a changed timeline" (unit: fire 790 moved to 791 fails first at frame 772, naming `halfToClosed`). Verify: `npx vitest run test/scenes/circuit-breaker-frames.test.ts` passes before and after the change.

## 2. Frame logic (`src/brand/motion.ts`)

- [ ] 2.1 `focusFactors`: dim from `introEnd` to the last frame; the outro changes no factor; update the `Timeline.outro` doc comment ("no movement from here on"). Verify in `test/brand/motion.test.ts`: "Focus changes to the next state", "Between two phases", "Intro and outro" (rewritten: in the outro CLOSED keeps 1 and `focusScale`, OPEN and HALF_OPEN keep `dimOpacity` and scale 1, equal to the frame before the outro), "Pop-in during the intro" (unchanged).
- [ ] 2.2 Add a pure `latestCall(frame, state, timeline)` (the last non-empty slot of `blockContents`, kind and frame, or null) and the tag's appearance (pill pop-in from the call's frame). Verify in `test/brand/motion.test.ts`: "Latest call follows the slots" (CLOSED at 89, 90, 400), "No call yet" (OPEN at 100 and 545), "Tag pop-in times the block" (opacity and scale at F + 5 equal the block's times the pill pop-in at 5 frames).

## 3. Scene data (`src/scenes/circuit-breaker-states/scene.ts`)

- [ ] 3.1 Timeline: duration 1150, outro 1060, phase 6 `[820, 1140]` with `ok` at 834 + 26 i (i = 0 to 7); every other value unchanged (design, timeline table). Verify in `test/scenes/circuit-breaker.test.ts`: "Timing equals the approved pilot" (the `PILOT` constant keeps the 0.12.0 values; the test compares every value except duration, outro and phase 6), "Timing equals the healthy-end timeline" (a new `HEALTHY_END` constant from the design's table, compared in full), and unchanged "Phase and transition order", "Failure crosses the threshold before OPEN", "The failed test reopens, the successful test closes", "Caption follows the active state", "Caption outside phases" (the outro frame read at 1100 instead of 950).
- [ ] 3.2 Text table: add `codes: { ok: "200", fail: "502", blocked: "503" }` to `pt` and `en` and to the `CircuitBreakerText` type. Verify in `test/scenes/circuit-breaker.test.ts`: "Codes equal in both languages", "Text table changes only by the codes" (against the literal of task 1.1); in `test/scenes/catalogue.test.ts`: "A missing code fails the catalogue" (a copy without `en` `codes.blocked` fails naming the scene, `en` and `codes.blocked`).
- [ ] 3.3 Healthy end. Verify in `test/scenes/circuit-breaker.test.ts`: "Eight ok calls over eight seconds", "Healthy end has no failure" (events and fires at or after 791), "The window fills with ok" (CLOSED at 1015, 1016, 1149), "Each healthy call comes back 200" (tag code and pop-in start at each of the eight frames).
- [ ] 3.4 Codes through the loop. Verify in `test/scenes/circuit-breaker.test.ts`: "Codes through the loop" (frames 56, 90, 175, 262, 424, 458, 560, 680, 834), "The tag restarts with a new phase" (OPEN at 544, 545, 559, 560; CLOSED at 819, 820, 833, 834), "No code before the first call" (no tag for any state at frames 0 to 55).
- [ ] 3.5 The end. Verify in `test/scenes/circuit-breaker.test.ts`: "Only CLOSED lit through the last frame" (850, 1059, 1060, 1100, 1149), "No jump at the outro" (1059 equals 1060), "The three states stay on screen" (block and tag opacity at 1149), "Frame state holds" (every frame 1060 to 1149 equals 1149 within 0.000001; last call's square and tag pop-ins at 1060 within 0.00001 of 1), "Final caption per language" (830, 1060, 1149 in `en` and `pt`), "Caption at the start of the final CLOSED phase" (820 opacity 0, 830 opacity 1).
- [ ] 3.6 Update the scene's header comment (pilot timing up to frame 819, healthy end, codes) and the existing fixtures that read the old values: `test/scenes/catalogue.test.ts` ("Circuit-breaker compositions" `durationInFrames` 1150; "Phase beyond the composition" with `to` 1150 and 1155 and `[0, 1149]`; "Outro inside the reading hold" on a 1000-frame copy with outro 950, so the scenario stays as specified; "Movement inside the reading hold" with the outro at 1060 and phase 6 `[820, 1140]`, which also proves "Movement after the outro is refused" with an extra `ok` at 1060). Verify: `npx vitest run test/scenes` passes; `test/scenes/catalogue-flow.test.ts` passes without edits ("Both kinds in the catalogue", "Shared checks still reject a broken flow").

## 4. Layout and composition

- [ ] 4.1 `layout.ts`: add `codeInset` (80) to both layouts; the tag's centre is `(box.x + codeInset, box.y)`. `Scene.tsx`: draw the tag inside `StateBlock` (so it takes the block's appearance), as the design's decision 4 (pill, `callAppearance` fill and glyph colour, `font.mono` bold, `layout.size.pill`). No literal colour, size or font (MOT-6). Verify: `test/brand/no-colour-literals.test.ts` passes; "Tag colours follow the call kind" (unit, `test/brand/motion.test.ts` or `test/scenes/circuit-breaker.test.ts`: the tag look for `ok`, `fail`, `blocked` equals `callAppearance`'s fill and glyph colour).
- [ ] 4.2 `npm run typecheck && npm run tokens:check && npm run build && npm test` pass. Record the output in S1.

## 5. Stills and render (local)

- [ ] 5.1 "Unchanged stills before the first call (local)": render frame 55 of the four compositions; `shasum -a 256` equals `stills-0.12.0.sha256` (4 of 4). On a mismatch, re-render the baseline from a worktree at `655525d` in the same session (design, stills plan 2).
- [ ] 5.2 "Stills of the circuit-breaker scene" and "Stale stills removed": `npm run stills -- circuit-breaker-states` prints 28 paths, frames 200, 365, 500, 620, 775, 1140, 1149; a planted `123.png` is gone. The command lists are also proved in `test/scripts/cli.test.ts` (`FRAMES` becomes `[200, 365, 500, 620, 775, 1140, 1149]`; "Dry run of stills" stays 28 commands).
- [ ] 5.3 "Tags clear of other elements (local)": render 175, 340, 458, 586, 740 and 1149 (plus 56, 790, 800, 820, 834, 912, 1016 of the stills plan) for the four compositions; open every PNG; no overlap, every tag readable. Tune `codeInset` or a position if needed and update the design's table.
- [ ] 5.4 "Identical final stills (local)": frames 1060, 1140 and 1149 have the same SHA-256 in each composition.
- [ ] 5.5 Gate: post the stills sheets and the before-and-after sheet (design, stills plan 6) on the pull request for Bruno; apply his answers to the spec before the render.
- [ ] 5.6 "Render of the circuit-breaker scene", "Progress line", "Rendering again": `npm run render -- circuit-breaker-states`; four progress lines; `npx remotion ffmpeg -hide_banner -i out/web/<id>.mp4` shows 1150 frames at 30 fps and no audio; each web copy smaller than its master; a contact sheet from the web files (stills plan 7).

## 6. Documentation

- [ ] 6.1 `README.md`: the scene table row (pilot timing with HTTP codes, healthy end) and the render line (about 38 s). Verify: `grep -n "33 s\|approved pilot, unchanged" README.md` finds nothing.

## Workflow follow-up

- Code review (two clean-context reviewers), `openspec archive circuit-breaker-healthy-end -y`, `openspec validate --all --strict`, mark the pull request ready (engineering OUT1).
- After the merge and the release: the vault notes (`changelog.md`, `architecture.md`), then the article's content pull request and the site's embed (q55 A).

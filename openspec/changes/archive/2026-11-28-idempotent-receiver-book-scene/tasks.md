# Tasks: idempotent-receiver-book-scene

Card SW-160, from the gate-0 pick of 2026-11-27 (concept B for both scene types). Each task names the scenarios it proves and the test that proves them. "Unit" means vitest without a browser (`npm test`). "Local" means a command the implementer runs and records in the pull request, because CI does not render. As the motion workflow orders it, the scene is built up to its stills before gate 1 (the spec plus the stills' sheet); the render, the code review and the archive follow the owner's answers.

## 1. The branch and the shared code (scene-catalogue)

- [x] 1.1 Merge `origin/main` into `feature/sw-160-idempotent-receiver-storyboard` with a merge commit (no rebase, no force push), so the branch has `storeNode` without words (SW-248, `d26f254`). Check: `git merge-base --is-ancestor d26f254 HEAD` succeeds.
- [x] 1.2 `src/scenes/eip-book.ts`, the book scene type of design §2.1 (`LANE`, `BOOK_TEXT`, `ICON_ARROW_Y`, `iconOnLane`, `channelOnLane` (since 4.4a), `TOKEN`, `messageToken`, `emptyStore`, `storedId`). Proven through the scene's tests below ("Layout equals the design", "No shape of its own").
- [x] 1.3 Add `lookupMark`, `ghost` and `matchFocus` to `TakesDevice` in `src/scenes/takes-kind.ts` (design §2.5). Unit, `test/scenes/idempotent-receiver-book-catalogue.test.ts`: "Devices where the owner approved them" (a type error before 1.3).

## 2. Scene data and timeline (scene-catalogue)

- [x] 2.1 `src/scenes/idempotent-receiver-book/scene.ts`: the entry (kind `takes`, neutral, `16x9`, both sources of design §2.7, the `text.en` table of design §5). Register it between `sddScene3Archive` and `circuitBreakerTopology` in `src/scenes/index.ts`.
- [x] 2.2 `src/scenes/idempotent-receiver-book/timeline.ts`: `makeTimeline(travel, fade)` with the phases of design §4.1 and the frame table of §4.2; `timeline = makeTimeline()`. Unit, `test/scenes/idempotent-receiver-book.test.ts`: "Timeline equals the beat table" (an independent transcription of design §4 in the test), "Travel token changed".
- [x] 2.3 Unit, `test/scenes/idempotent-receiver-book-catalogue.test.ts`: "Registered entry", "Word table", "One composition, before the topology scene", "Broken entry rejected", "Takes checks pass", "No cast", "Every phase cites the article".
- [x] 2.4 Edit only the assertions that list every registered scene: in `test/scenes/catalogue-flow.test.ts`, "Takes fixture beside the registered scenes", "Three scenes in the catalogue", "Four scenes in the catalogue", "Five scenes in the catalogue", "Six scenes in the catalogue" and a new "Seven scenes in the catalogue"; the lists in the catalogue tests of `sdd-request-relay`, `sdd-scene-2-files` and `sdd-scene-3-archive`; the two `available scenes:` lines of `test/scripts/cli.test.ts`. These prove the MODIFIED requirement's scenarios ("Both kinds in the catalogue" and "Shared checks still reject a broken flow" run unedited).

## 3. Frame logic, stage and composition (scene-catalogue)

- [x] 3.1 `src/scenes/idempotent-receiver-book/frame.ts` (`objectFrame`, `frameAt`, pure, no React; design §2.3, §4.2), `layout.ts` (design §6.1), `stage.ts` (the four layers of design §6.2) and `Scene.tsx` (`Rings`, the guides, the layers); register `idempotent-receiver-book-16x9` in `src/Root.tsx`.
- [x] 3.2 Unit, `test/scenes/idempotent-receiver-book.test.ts`, one `describe` per requirement: "Seeking in any order", "Take 2 repeats take 1 by 340 frames"; "One delivery, looked up, processed and stored"; "Object frames", "Same stage before each take", "Badge and mark"; "Sent once, delivered twice"; "Found and set aside", "The store in focus at the match"; "Take 1's result faded beside take 2's", "Final hold identical".
- [x] 3.3 Unit, `test/scenes/idempotent-receiver-book-layout.test.ts` (with `test/scenes/book-tree.ts`): "Layout equals the design", "Layer order", "Every settled word at its minimum", "Too small rejected", "Placement at every checked frame", "Collision rejected".
- [x] 3.4 Unit, `test/scenes/idempotent-receiver-book-words.test.ts`: "Words over the whole composition", "Unlisted word rejected", "No shape of its own"; and "No colour literal" (the existing `test/brand/no-colour-literals.test.ts` over `src/scenes/` and `src/brand/`).

## 4. Stills, render and the commands (scene-rendering)

- [x] 4.1 Unit, `test/scripts/idempotent-receiver-book.test.ts`, with the existing injected runner: "Idempotent Receiver book key-frame stills", "Idempotent Receiver book stills dry run", "Idempotent Receiver book still failure", "Idempotent Receiver book render dry run", "Idempotent Receiver book render failure".
- [x] 4.2 Local: `npm run stills -- idempotent-receiver-book` (14 PNGs) and `npx remotion still` at frames 140, 350, 428, 450, 470, 610, 650, 698 and 760 (the moments between phase ends). Open every PNG: overlaps, clipping, contrast, the tokens on their routes (MOT-5).
- [x] 4.3 Local: the stills sheet into `docs/spikes/2026-11-27-idempotent-receiver-book/` for gate 1.
- [x] 4.4 Gate 1: the owner reads the spec and the stills' sheet; the owner's answers (design §7) change the spec and the code in this branch, and a comment names the approved commit. Done 2026-11-27 on `42544d9`: every recommendation (design §7).
- [x] 4.4a After the design-system change that adds `queueNode` without words and `eipIcon` without offset shadows merges: merge `origin/main` into this branch with a merge commit; the channel becomes a `queueNode` without words (point 5); the spec, the layout, the stills and the sheet follow, and the owner sees the new stills before the render. Merged 2026-11-28 (`5b29668`, 0.15.0); the channel, spec, design, layout test, stills and sheet changed in the next commit; the owner approved the new stills on `c68b537` the same day.
- [x] 4.5 Local, after gate 1: `npm run render -- idempotent-receiver-book`; read the web copy with `npx remotion ffmpeg -hide_banner -i …`; the web-MP4 sheet and its 341 px sheet; frames 800 and 899 rendered with `npx remotion still` and compared byte for byte. This proves "Idempotent Receiver book video verified from output (local)" (SCN-4, SCN-5). Done 2026-11-28 on `c68b537`: the render took 14 s; a 30 s video (900 frames, no audio), master 15.6 MB, web 473 KB; frames 800 and 899 equal (spike README).
- [x] 4.6 The owner's look at the video (G3): the web MP4, its sheets and the Studio. The owner's answers change the spec and the code in this branch before the archive. Done 2026-11-28 on `d6d0295`: the owner approved the video as it is, no change.

## 5. Checks, docs and review

- [x] 5.1 `npm run typecheck && npm run tokens:check && npm run build && npm test` and `openspec validate --all --strict`: all pass. With `git diff origin/main...HEAD --stat -- src/scenes` this proves "Other scenes untouched".
- [x] 5.2 Local: "Stills byte-identical (local)": the stills of `circuit-breaker-states`, `publish-subscribe`, `sdd-request-relay`, `sdd-scene-2-files`, `sdd-scene-3-archive` and `circuit-breaker-topology` on `origin/main` (`d26f254`) and on the branch, compared by SHA-256. Done 2026-11-27: 102 stills, every pair equal. Again on 2026-11-28 against `origin/main` at `4caa26c` (0.15.0), after the code review: 102 stills, every pair equal.
- [x] 5.3 Docs (proposal "Documentation"): `README.md` (the scene row, its files, the book scene type) and `docs/roadmap.md` (the Idempotent Receiver row).
- [x] 5.4 Code review by a clean-context reviewer, at most two rounds; fix every right high and medium. Done 2026-11-28: round 1 on `c474687`, NO-GO with 3 medium and 5 low, all fixed in `6dd5cce`; no high, so no second round.
- [x] 5.5 After G3: `openspec archive idempotent-receiver-book-scene -y`, then `openspec validate --all --strict`.

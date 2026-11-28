# Tasks: idempotent-receiver-mule-scene

Card SW-160, from the gate-0 pick of 2026-11-27 (concept B for both scene types). Each task names the scenarios it proves and the test that proves them. "Unit" means vitest without a browser (`npm test`). "Local" means a command the implementer runs and records in the pull request, because CI does not render. As the motion workflow orders it, the scene is built up to its stills before gate 1 (the spec plus the stills' sheet); the render, the code review and the archive follow the owner's answers. The book scene's change (`2026-11-28-idempotent-receiver-book-scene`) is the model; its code review's lesson (prove what the stage draws, each phase's events and the layers' membership) is applied from the start.

## 1. The branch and the shared code (scene-catalogue)

- [x] 1.1 Branch `feature/sw-160-idempotent-receiver-mule-scene` from `origin/main` at `2df19be` (the book scene merged; 0.15.0's pieces).
- [x] 1.2 `src/scenes/eip-mule.ts`, the Mule scene type of design §2.1 (`MULE_TEXT`, `component`, `ABOVE_GAP`, `restAbove`, `client`). Proven through the scene's tests below ("Layout equals the design", "No shape of its own").

## 2. Scene data and timeline (scene-catalogue)

- [x] 2.1 `src/scenes/idempotent-receiver-mule/scene.ts`: the entry (kind `takes`, neutral, `16x9`, the book scene's sources, the `text.en` table of design §5). Register it between `idempotentReceiverBook` and `circuitBreakerTopology` in `src/scenes/index.ts`. Verified by 2.3.
- [x] 2.2 `src/scenes/idempotent-receiver-mule/timeline.ts`: `makeTimeline(travel, fade)` with the phases of design §4.1, the frame table of §4.2 and the reverse cast of §2.3; `timeline = makeTimeline()`. Unit, `test/scenes/idempotent-receiver-mule.test.ts`: "Timeline equals the beat table" (an independent transcription of design §4 in the test, each phase's events included), "Travel token changed", "The rewind's reverse cast".
- [x] 2.3 Unit, `test/scenes/idempotent-receiver-mule-catalogue.test.ts`: "Registered entry", "Word table", "One composition, after the book scene", "Broken entry rejected", "Takes checks pass", "Devices as in the book scene", "Balão the only actor, reacting to 200 and 500 only", "Bad emote rejected", "Every phase cites the article".
- [x] 2.4 Edit only the assertions that list every registered scene: in `test/scenes/catalogue-flow.test.ts`, "Takes fixture beside the registered scenes", "Three scenes in the catalogue" to "Seven scenes in the catalogue" and a new "Eight scenes in the catalogue"; the lists in the catalogue tests of `sdd-request-relay`, `sdd-scene-2-files`, `sdd-scene-3-archive` and `idempotent-receiver-book`; the two `available scenes:` lines of `test/scripts/cli.test.ts`. These prove the MODIFIED requirement's scenarios ("Both kinds in the catalogue" and "Shared checks still reject a broken flow" run unedited).

## 3. Frame logic, stage and composition (scene-catalogue)

- [x] 3.1 `src/scenes/idempotent-receiver-mule/frame.ts` (`objectFrame`, `frameAt`, pure, no React; design §2.3, §4.2), `layout.ts` (design §6.1), `stage.ts` (the five layers of design §6.2) and `Scene.tsx` (`Rings`, the four guides, the layers); register `idempotent-receiver-mule-16x9` in `src/Root.tsx`. Verified by 3.2 to 3.4 and "Registered entry".
- [x] 3.2 Unit, `test/scenes/idempotent-receiver-mule.test.ts`, one `describe` per requirement, each reading the stage trees for what is drawn: "Seeking in any order", "Take 2 repeats take 1 by 630 frames"; "Charged once, 200", "The retry gets 409, still one charge", "The store in focus at each match"; "Object frames", "Same stage before each take", "Badge and mark"; "The charge fails: 500, the orderId stays", "The retry gets the same 409"; "Take 1's count faded beside take 2's", "Final hold identical".
- [x] 3.3 Unit, `test/scenes/idempotent-receiver-mule-layout.test.ts` (with `test/scenes/mule-tree.ts`): "Layout equals the design", "Layer order", "Every settled word at its minimum", "Too small rejected", "Placement at every checked frame", "Collision rejected".
- [x] 3.4 Unit, `test/scenes/idempotent-receiver-mule-words.test.ts`: "Words over the whole composition", "Unlisted word rejected", "No shape of its own"; and "No colour literal" (the existing `test/brand/no-colour-literals.test.ts` over `src/scenes/` and `src/brand/`).

## 4. Stills, render and the commands (scene-rendering)

- [x] 4.1 Unit, `test/scripts/idempotent-receiver-mule.test.ts`, with the existing injected runner: "Idempotent Receiver Mule key-frame stills", "Idempotent Receiver Mule stills dry run", "Idempotent Receiver Mule still failure", "Idempotent Receiver Mule render dry run", "Idempotent Receiver Mule render failure".
- [x] 4.2 Local: `npm run stills -- idempotent-receiver-mule` (18 PNGs) and `npx remotion still` at frames 60, 150, 222, 280, 380, 445, 485, 520, 640, 850, 905, 1075 and 1195 (the moments between phase ends: the request leaving, the `?`, the row, the `worked` emote, the retry, the focus, the orange retry, the 409, the rewind, the red request, the `problem` emote, take 2's focus, take 1's count). Open every PNG: overlaps, clipping, contrast, the tokens on their routes (MOT-5). Done 2026-11-28: 18 stills in 30 s (cached bundle); every PNG read.
- [x] 4.3 Local: the stills sheet into `docs/spikes/2026-11-28-idempotent-receiver-mule/` for gate 1.
- [x] 4.4 Gate 1: the owner reads the spec and the stills' sheet; the answers (design §7) change the spec and the code in this branch, and a comment names the approved commit. Done 2026-11-28 on `9c4b5e3`: every recommendation (design §7).
- [ ] 4.5 Local, after gate 1: `npm run render -- idempotent-receiver-mule`; read the web copy with `npx remotion ffmpeg -hide_banner -i …`; the web-MP4 sheet and its 341 px sheet, each frame extracted at `(f − 0.1)/30`; frames 1250 and 1349 rendered with `npx remotion still` and compared byte for byte. This proves "Idempotent Receiver Mule video verified from output (local)" (SCN-4, SCN-5).
- [ ] 4.6 The owner's look at the video (G3): the web MP4, its sheets and the Studio. The owner's answers change the spec and the code in this branch before the archive.

## 5. Checks, docs and review

- [ ] 5.1 `npm run typecheck && npm run tokens:check && npm run build && npm test` and `openspec validate --all --strict`: all pass. With `git diff origin/main...HEAD --stat -- src/scenes` this proves "Other scenes untouched".
- [ ] 5.2 Local: "Stills byte-identical (local)": the stills of the seven other scenes on `origin/main` and on the branch, compared by SHA-256.
- [ ] 5.3 Docs (proposal "Documentation"): `README.md` (the scene row, its commands and files, the Mule scene type) and `docs/roadmap.md` (the Idempotent Receiver row).
- [ ] 5.4 Code review by a clean-context reviewer, at most two rounds; fix every right high and medium.
- [ ] 5.5 After G3: `openspec archive idempotent-receiver-mule-scene -y`, then `openspec validate --all --strict`.

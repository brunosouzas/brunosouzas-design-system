# Tasks: sdd-scene-3-archive

Each task names the scenarios it proves and the test that proves them. "Unit" means vitest without a browser (`npm test`). "Local" means a command the implementer runs and records in the pull request, because CI does not render.

## 1. Port the `sequence` kind (scene-catalogue)

- [ ] 1.1 Port `src/scenes/sequence-kind.ts` from `sdd-scene-2-files` (PR #48) unmodified; apply the same export-only edit to `src/scenes/takes-kind.ts` (export `CueTimeline`, `checkCast`, `checkHold`) and the same `CatalogueScene` union edit to `src/scenes/catalogue.ts`. Also edit `test/scenes/catalogue-flow.test.ts` (the four-scene registry list and `entries[9]`), `test/scenes/sdd-request-relay-catalogue.test.ts` (`entries[9]` and the scene list) and `test/scripts/cli.test.ts` (the two `available scenes:` lines) the way scene 2 did, to the five-scene list below. Unit: `diff` against the PR #48 branch's copies is empty for the three ported files; the existing `test/scenes/catalogue-takes.test.ts` and `circuit-breaker-topology-catalogue.test.ts` pass unedited.
- [ ] 1.2 Port the two sequence requirements ("Sequence scene kind", "Sequence cast and hold") into this change's own `specs/scene-catalogue/spec.md` as ADDED, verbatim from `sdd-scene-2-files`'s delta (design §2.1 — a prior condensed version was wrong; copy the full requirement text, scenarios may retarget to this scene). Unit: `test/scenes/catalogue-sequence.test.ts`, fixtures rebuilt on the archive scene's own registered entry.

## 2. Scene data and timeline (scene-catalogue)

- [ ] 2.1 `src/scenes/sdd-scene-3-archive/scene.ts`: the entry (kind `sequence`, neutral, `16x9`, both sources, the `text.en` table of design §8.1). Register it right after `sddRequestRelay` and before `circuit-breaker-topology` in `src/scenes/index.ts` (this branch's position; the owner reconciles with `sdd-scene-2-files` at merge time, per open question 6).
- [ ] 2.2 `src/scenes/sdd-scene-3-archive/timeline.ts`: `makeTimeline(travel, fade)` returning the beat table of design §4; `timeline = makeTimeline()`.
- [ ] 2.3 Unit, `test/scenes/sdd-scene-3-archive-catalogue.test.ts`: "Archive registered entry", "Archive word table", "One composition, after this branch's earlier scenes", "Archive broken entry rejected".
- [ ] 2.4 Unit, `test/scenes/sdd-scene-3-archive.test.ts`: "Archive timeline equals the beat table" (an independent transcription of design §4), "Archive travel token changed".

## 3. Frame logic (scene-catalogue)

- [ ] 3.1 `src/scenes/sdd-scene-3-archive/frame.ts`: `frameAt(f)`, the whole stage state as data, pure, no React.
- [ ] 3.2 Unit, `test/scenes/sdd-scene-3-archive.test.ts`, one `describe` per requirement:
  - **Beats and timing:** "Archive seeking in any order".
  - **Cast:** "Archive cast in place at every frame", "Archive emote beside the head".
  - **Archive:** "Archive frames" (the first folder's trip and parking; the book's new line).
  - **Second request and propose:** "Request and propose frames", "No second folder before propose".
  - **The breaking fact and the single finding:** "Break and finding frames", "No finding before the review", "At most one finding mark at a time".
  - **Approval:** "Approval frames", "No GO before the owner".
  - **Second archive, apply and ending:** "Second archive, apply and ending frames", "No field-count change before the second archive", "No cast act during archive or review", "Archive final hold identical".

## 4. Stage, layout and composition (scene-catalogue)

- [ ] 4.1 `src/scenes/sdd-scene-3-archive/layout.ts`: the values of design §6.1 and the routes of §4.3.
- [ ] 4.2 `src/scenes/sdd-scene-3-archive/stage.ts`: the stage SVG layers of design §6.2 from `frameAt(f)`, each element in a `data-element` group.
- [ ] 4.3 `src/scenes/sdd-scene-3-archive/Scene.tsx`: `Rings`, the `MotionPath` guide and the stage layers, words through `withSansFamily`; register `sdd-scene-3-archive-16x9` in `src/Root.tsx`.
- [ ] 4.4 Unit, `test/scenes/sdd-scene-3-archive-layout.test.ts`: "Layout equals the design", "Every settled archive word at its minimum", "Archive word too small rejected", "Archive placement at every checked frame", "Archive collision rejected". Measure "exactly two/three fields" and `GO` with harfbuzzjs; pin the numbers in design.md (§2.2 gives the measured values); if any value forces a layout change, update design.md and this spec in the same commit.
- [ ] 4.5 Unit, `test/scenes/sdd-scene-3-archive-words.test.ts`: "Archive words over the whole composition", "Archive words in the loaded face", "Archive unlisted word rejected", "Archive scene has no shape of its own", "Archive scene has no colour literal".

## 5. Stills, render and the commands (scene-rendering)

- [ ] 5.1 Unit, `test/scripts/sdd-scene-3-archive.test.ts`: "Archive key-frame stills", "Archive stills dry run", "Archive still failure", "Archive render dry run", "Archive render failure".
- [ ] 5.2 Local: `npm run stills -- sdd-scene-3-archive` (PNGs at the phase ends and the last frame of design §7) and `npx remotion still` at design §7's extra frames. Open every PNG: cast, overlaps, clipping, contrast.
- [ ] 5.3 Local: the stills sheet and the phone sheet (341 CSS px) into `docs/spikes/2026-11-13-sdd-scene-3-archive/`.
- [ ] 5.4 Local: `npm run render -- sdd-scene-3-archive`; the web-MP4 sheet and its 341 px sheet; the outro and last frame rendered with `npx remotion still` and compared byte for byte.
- [ ] 5.5 The owner's look at the video (G3), across all three scenes together. His answers change the spec and the code in this branch before the archive.

## 6. Checks, docs and review

- [ ] 6.1 `npm run typecheck && npm run tokens:check && npm run build && npm test` and `openspec validate --all --strict`: all pass. `git diff origin/main --stat -- src/scenes/circuit-breaker-states src/scenes/publish-subscribe src/scenes/sdd-request-relay src/scenes/circuit-breaker-topology` empty. This proves "Existing scenes unchanged by the archive scene".
- [ ] 6.2 Local: "Existing scenes unchanged by the archive scene" (stills half) — `circuit-breaker-states`, `publish-subscribe`, `sdd-request-relay`, `circuit-breaker-topology` on `origin/main` and on the branch, SHA-256 compared.
- [ ] 6.3 Docs: `README.md` (the scene row), `docs/roadmap.md` (the SDD row, scene 3 of 3).
- [x] 6.4 Spec review: two independent clean-context reviewers per round (plain `claude -p --permission-mode plan`, then the `reviewer.md` persona), one after the other, at most two rounds; fix every right high and medium, reject lows with a stated reason. (Round 1 and round 2 complete; this file reflects both rounds' fixes. Remaining round-2 lows — exact requirement-text fidelity to scene 2's wording, a still-frame description off by ~30 frames, a `?`-pill/folder-decoration geometry note, and an added L234 citation — are deferred to implementation/task 4.4's own layout-test pass rather than re-editing prose further, since none blocks writing a correct test or component.)
- [ ] 6.5 Code review: same two-reviewer, two-round, strictly sequential pattern over the implementation diff.
- [ ] 6.6 After the owner's look at all three videos (G3): archive in dependency order — `sdd-scene-1-relay` first if not already, then `sdd-scene-2-files`, then this change. Before this change's own `openspec archive sdd-scene-3-archive -y`: if the "Sequence scene kind"/"Sequence cast and hold" requirements are already in `openspec/specs/` from scene 2's archive, delete this change's own duplicate ADDED blocks for them (design §2.1's round-2 correction — OpenSpec rejects a duplicate ADDED header) and rebuild the MODIFIED "State-machine and flow catalogue compatibility" block against the spec as it stands after scenes 1 and 2 are archived, not against this design's own copy. Then `openspec validate --all --strict`. Waits for G3; not this change's job.

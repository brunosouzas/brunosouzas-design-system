# Tasks: sdd-scene-2-files

Each task names the scenarios it proves and the test that proves them. "Unit" means vitest without a browser (`npm test`). "Local" means a command the implementer runs and records in the pull request, because CI does not render.

## 1. The `sequence` kind (scene-catalogue)

- [x] 1.1 `src/scenes/takes-kind.ts`: export `CueTimeline`, `checkCast(id, t: CueTimeline)` and `checkHold(id, t: CueTimeline & { rewind?: … }, settle)`; `checkHold` adds the rewind line only when the timeline has a `rewind` (design §2.1). No other change. Unit: the existing `test/scenes/catalogue-takes.test.ts` and `circuit-breaker-topology-catalogue.test.ts` pass unedited, and `sdd-request-relay-catalogue.test.ts` unedited except the registration assertions of design §2.6 ("Takes scenes unchanged").
- [x] 1.2 `src/scenes/sequence-kind.ts`: `SequenceDevice`, `SequencePhase`, `SequenceTimeline`, `checkSequence` (design §2.1), which also rejects a `rewind` and a phase `take`. `src/scenes/catalogue.ts`: `SequenceSceneData` in `CatalogueScene`; `checkTimeline` calls `checkSequence` for kind `sequence`.
- [x] 1.3 Unit, `test/scenes/catalogue-sequence.test.ts` (fixtures are the registered scene with one edit): "Valid sequence", "Sequence phase without an article line", "Localised sequence scene", "Sequence with a take or a rewind rejected", "Sequence outro inside the reading hold", "Overlapping acts in a sequence", "Cue in the reading hold", "Takes scenes unchanged".

## 2. Scene data and timeline (scene-catalogue)

- [x] 2.1 `src/scenes/sdd-scene-2-files/scene.ts`: the entry (kind `sequence`, neutral, `16x9`, both sources, the `text.en` table). Register it right after `sddRequestRelay` in `src/scenes/index.ts`.
- [x] 2.2 `src/scenes/sdd-scene-2-files/timeline.ts`: `makeTimeline(travel, fade)` returning the `FilesTimeline` of design §2.7 with the phases of §4.1 and the frame table of §4.2; `timeline = makeTimeline()`.
- [x] 2.3 Unit, `test/scenes/sdd-scene-2-files-catalogue.test.ts`: "Files registered entry", "Files word table", "One composition, after the relay scene", "Files broken entry rejected", "Other scenes' code untouched" (the scene list; the `git diff` half is local, task 6.1), "No actor in the reviews".
- [x] 2.4 Edit only the assertions design §2.6 lists: in `test/scenes/catalogue-flow.test.ts`, "Takes fixture beside the registered scenes", "Three scenes in the catalogue", "Four scenes in the catalogue" and a new "Five scenes in the catalogue"; the two `available scenes:` lines of `test/scripts/cli.test.ts`; in `test/scenes/sdd-request-relay-catalogue.test.ts`, the `entries[9]` assertion and the scene list; in `openspec/changes/sdd-scene-1-relay/specs/scene-catalogue/spec.md`, the one sentence of "One composition, before the topology scene" (the rule of design §2.6: scene 1's MODIFIED block is not edited). These prove the MODIFIED requirement's scenarios ("Both kinds in the catalogue" and "Shared checks still reject a broken flow" run unedited in `test/scenes/catalogue-flow.test.ts`).
- [x] 2.5 Unit, `test/scenes/sdd-scene-2-files.test.ts`: "Files timeline equals the beat table" (an independent transcription of design §4 in the test) and "Files travel token changed".

## 3. Frame logic (scene-catalogue)

- [x] 3.1 `src/scenes/sdd-scene-2-files/frame.ts`: `frameAt(f)`, the whole stage state as data, pure, no React (design §2.3–§2.5, §2.7).
- [x] 3.2 Unit, `test/scenes/sdd-scene-2-files.test.ts`, one `describe` per requirement:
  - **Beats and timing:** "Files seeking in any order".
  - **Cast:** "Files cast in place at every frame" (with its CAST-4 half, the test "Every cast change inside an act or a face entry"), "Files emote beside the head".
  - **Init and propose:** "Init and propose frames", "No file before propose".
  - **Questions and answers:** "Questions and answers frames", "No finding before the review".
  - **Review round 1:** "Review 1 frames".
  - **Fix and review round 2:** "Fix and review 2 frames", "One NO-GO at a time".
  - **Approval:** "Approval frames", "No GO before the owner".
  - **Apply and final still:** "Apply frames", "No code before the approval", "Files final hold identical".

## 4. Stage, layout and composition (scene-catalogue)

- [x] 4.1 `src/scenes/sdd-scene-2-files/layout.ts`: the values of design §6.1, the routes of §4.3 and the body boxes of §6.2.
- [x] 4.2 `src/scenes/sdd-scene-2-files/stage.ts`: the six stage SVG layers of design §6.2 from `frameAt(f)`, each element in a `data-element` group.
- [x] 4.3 `src/scenes/sdd-scene-2-files/Scene.tsx`: `Rings`, the `MotionPath` guide and the stage layers, words through `withSansFamily`; register `sdd-scene-2-files-16x9` in `src/Root.tsx`.
- [x] 4.4 Unit, `test/scenes/sdd-scene-2-files-layout.test.ts`: "Layout equals the design" (§6.1, §4.3), "Every settled files word at its minimum", "Files word too small rejected", "Files placement at every checked frame", "Files collision rejected". If a design §6.1 value fails, change it in design.md and the spec in the same commit and list it for the owner.
- [x] 4.5 Unit, `test/scenes/sdd-scene-2-files-words.test.ts`: "Files words over the whole composition", "Files words in the loaded face", "Files unlisted word rejected", "Files scene has no shape of its own", and "Files scene has no colour literal" (the existing `test/brand/no-colour-literals.test.ts` over `src/scenes/` and `src/brand/`).

## 5. Stills, render and the commands (scene-rendering)

- [x] 5.1 Unit, `test/scripts/sdd-scene-2-files.test.ts`, with the existing injected runner: "SDD files key-frame stills", "SDD files stills dry run", "SDD files still failure", "SDD files render dry run", "SDD files render failure".
- [x] 5.2 Local: `npm run stills -- sdd-scene-2-files` (12 PNGs) and `npx remotion still` at the frames of design §7. Open every PNG: CAST-3, CAST-4, CAST-5, overlaps, clipping, contrast (MOT-5).
- [x] 5.3 Local: the stills sheet and the phone sheet (341 CSS px) into `docs/spikes/2026-11-13-sdd-scene-2-files/`, captured with headless Chrome through `<img>` (ADR 0008).
- [x] 5.4 Local: `npm run render -- sdd-scene-2-files`; read the web copy with `npx remotion ffmpeg -hide_banner -i …`; the web-MP4 sheet and its 341 px sheet; frames 770 and 869 rendered with `npx remotion still` and compared byte for byte. This proves "SDD files video verified from output (local)" (SCN-4, SCN-5).
- [ ] 5.5 The owner's look at the video (G3): the web MP4, its sheets and the Studio. His answers change the spec and the code in this branch before the archive.

## 6. Checks, docs and review

- [x] 6.1 `npm run typecheck && npm run tokens:check && npm run build && npm test` and `openspec validate --all --strict`: all pass. With `git diff origin/main --stat -- src/scenes/circuit-breaker-states src/scenes/publish-subscribe src/scenes/sdd-request-relay src/scenes/circuit-breaker-topology` empty, this proves "Other scenes' code untouched".
- [x] 6.2 Local: "Other scenes' stills byte-identical (local)". Render the stills of `circuit-breaker-states`, `publish-subscribe`, `sdd-request-relay` and `circuit-breaker-topology` on `origin/main` and on the branch, and compare their SHA-256.
- [x] 6.3 Docs (proposal "Documentation"): `README.md` (the scene row, its files, the `sequence` kind) and `docs/roadmap.md` (the SDD row).
- [x] 6.4 Code review: two independent clean-context reviewers per round, one after the other, at most two rounds; fix every right high and medium.
- [ ] 6.5 After the owner's look at the video (G3): `openspec archive sdd-scene-2-files -y` (after `sdd-scene-1-relay` is archived, since both modify "State-machine and flow catalogue compatibility"), then `openspec validate --all --strict`. This task waits for G3.

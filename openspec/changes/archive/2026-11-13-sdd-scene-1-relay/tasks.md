# Tasks: sdd-scene-1-relay

Each task names the scenarios it proves and the test that proves them. "Unit" means vitest without a browser (`npm test`). "Local" means a command the implementer runs and records in the pull request, because CI does not render.

## 0. The branch

- [x] 0.1 Merge `origin/main` into `feature/ab144-sdd-without-with-spec-scene` with a merge commit (no rebase, no force push), conflicts resolved to `main`'s version (design §2.1). Then remove, in a new commit, the old scene (`src/scenes/sdd-without-with-spec/`, its tests, `docs/spikes/2026-11-12-sdd-without-with-spec/` and the archived change `2026-11-12-sdd-without-with-spec-scene`). Check: `git diff origin/main --stat` is empty after that commit.

## 1. Shared code (motion-components, scene-catalogue)

- [x] 1.1 Move `withSansFamily` to `src/brand/svg-fonts.ts`; `src/scenes/circuit-breaker-topology/stage.ts` imports and re-exports it, and its `Scene.tsx` is unchanged. Unit, `test/brand/svg-fonts.test.ts`: "Sans mapped, mono kept", "Tree without words", "Every scene word mapped". `test/scenes/circuit-breaker-topology-fonts.test.ts` runs unedited.
- [x] 1.2 Add `balao` and `chaves` to `Actor` in `src/scenes/takes-kind.ts` (design §2.6). Unit, `test/scenes/sdd-request-relay-catalogue.test.ts`: "Overlapping acts of the supporting cast" (fails before 1.2 at the type level and passes after).

## 2. Scene data and timeline (scene-catalogue)

- [x] 2.1 `src/scenes/sdd-request-relay/scene.ts`: the entry (kind `takes`, neutral, `16x9`, both sources, the `text.en` table). Register it between `publishSubscribe` and `circuitBreakerTopology` in `src/scenes/index.ts`.
- [x] 2.2 `src/scenes/sdd-request-relay/timeline.ts`: `makeTimeline(travel, fade)` returning the `RelayTimeline` of design §2.10 with the phases of §4.1, the frame table of §4.2 and the reverse entries of §4.3; `timeline = makeTimeline()`.
- [x] 2.3 Unit, `test/scenes/sdd-request-relay-catalogue.test.ts`: "Registered entry", "Word table", "One composition, before the topology scene", "Broken entry rejected", "Takes checks pass", "Fright before the agent's failure".
- [x] 2.4 Edit only the assertions that list every registered scene: in `test/scenes/catalogue-flow.test.ts`, "Takes fixture beside the registered scenes" (the four ids), "Three scenes in the catalogue" (the three earlier scenes' relative order, topology last) and a new "Four scenes in the catalogue"; the two `available scenes:` lines of `test/scripts/cli.test.ts`. These prove the MODIFIED requirement's four scenarios ("Both kinds in the catalogue" and "Shared checks still reject a broken flow" run unedited).
- [x] 2.5 Unit, `test/scenes/sdd-request-relay.test.ts`: "Timeline equals the beat table" (an independent transcription of design §4 in the test) and "Travel token changed".

## 3. Frame logic (scene-catalogue)

- [x] 3.1 `src/scenes/sdd-request-relay/frame.ts`: `objectFrame(f)` and `frameAt(f)`, the whole stage state as data, pure, no React (design §2.7–§2.9).
- [x] 3.2 Unit, `test/scenes/sdd-request-relay.test.ts`, one `describe` per requirement:
  - **Beats and timing:** "Seeking in any order".
  - **Cast:** "Cast in place at every frame", "Emotes beside the head".
  - **Take 1 relay:** "Request and relay frames", "Take 2 repeats the relay".
  - **Code alone:** "The questions sink into the code", "No sheet before take 2".
  - **Error and fright:** "Error frames".
  - **Rewind:** "Object frames", "Same stage before each take", "Cast replayed backwards".
  - **Open questions listed:** "Rows from the questions", "No code before the approval".
  - **Carry and answer:** "Carry frames", "Answer and stamp frames".
  - **Implementation and final still:** "Return and implementation frames", "Final hold identical".
  - Plus a consistency test: every frame where a cast action parameter changes lies inside a declared act of that actor, and every frame where a face changes has its `faces` entry (CAST-4 against the drawn state).

## 4. Stage, layout and composition (scene-catalogue)

- [x] 4.1 `src/scenes/sdd-request-relay/layout.ts`: the values of design §6.1, the routes of §4.4 and the body boxes of §6.2.
- [x] 4.2 `src/scenes/sdd-request-relay/stage.ts`: the five stage SVG layers of design §6.2 from `frameAt(f)`, each element in a `data-element` group, words passed through `withSansFamily` by the composition.
- [x] 4.3 `src/scenes/sdd-request-relay/Scene.tsx`: `Rings`, the `MotionPath` guides and the stage layers; register `sdd-request-relay-16x9` in `src/Root.tsx`.
- [x] 4.4 Unit, `test/scenes/sdd-request-relay-layout.test.ts`: "Layout equals the design" (§6.1, §4.4), "Every settled word at its minimum", "Too small rejected", "Placement at every checked frame", "Collision rejected". If a design §6.1 value fails, change it in design.md and the spec in the same commit and list it for the owner.
- [x] 4.5 Unit, `test/scenes/sdd-request-relay-words.test.ts`: "Words over the whole composition", "Unlisted word rejected", "No shape of its own", and "No colour literal" (the existing `test/brand/no-colour-literals.test.ts` over `src/scenes/` and `src/brand/`).

## 5. Stills, render and the commands (scene-rendering)

- [x] 5.1 Unit, `test/scripts/sdd-request-relay.test.ts`, with the existing injected runner: "SDD relay key-frame stills", "SDD relay stills dry run", "SDD relay still failure", "SDD relay render dry run", "SDD relay render failure".
- [x] 5.2 Local: `npm run stills -- sdd-request-relay` (14 PNGs) and `npx remotion still` at the frames of design §7. Open every PNG: CAST-3, CAST-4, CAST-5, overlaps, clipping, contrast (MOT-5).
- [x] 5.3 Local: the stills sheet and the phone sheet (341 CSS px) into `docs/spikes/2026-11-12-sdd-request-relay/`.
- [x] 5.4 Local: `npm run render -- sdd-request-relay`; read the web copy with `npx remotion ffmpeg -hide_banner -i …`; the web-MP4 sheet and its 341 px sheet; frames 980 and 1079 rendered with `npx remotion still` and compared byte for byte. This proves "SDD relay video verified from output (local)" (SCN-4, SCN-5).

- [x] 5.5 The owner's look at the video (G3): the web MP4, its sheets and the Studio. His answers change the spec and the code in this branch before the archive. Done: Bruno watched the rendered web MP4 (2026-11-13) and approved, no changes requested.

## 6. Checks, docs and review

- [x] 6.1 `npm run typecheck && npm run tokens:check && npm run build && npm test` and `openspec validate --all --strict`: all pass. This also proves "Other scenes' tests untouched" (with `git diff origin/main --stat -- src/scenes/circuit-breaker-states src/scenes/publish-subscribe` empty).
- [x] 6.2 Docs (proposal "Documentation"): `README.md` (the scene row, its files, `svg-fonts.ts`) and `docs/roadmap.md` (the SDD row).
- [x] 6.3 Code review: two independent clean-context reviewers per round, at most two rounds; fix every right high and medium.
- [x] 6.4 Local: "Stills byte-identical (local)". Render the stills of `circuit-breaker-states`, `publish-subscribe` and `circuit-breaker-topology` on `origin/main` and on the branch, and compare their SHA-256.
- [x] 6.5 After the owner's look at the video (G3): `openspec archive sdd-scene-1-relay -y`, then `openspec validate --all --strict`. This task waits for G3, because the owner judges the scene on the video. Done (PR #50).

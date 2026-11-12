# Tasks: circuit-breaker-topology-scene

Each task names the scenarios it proves and the test that proves them. "Unit" means vitest without a browser (`npm test`). "Local" means a command the implementer runs and records in the pull request, because CI does not render.

## 0. Before implementing

- [x] 0.1 Stack this branch on PR #45 (`scene-takes-infrastructure`, AB#144), which holds the neutral scenes, the `takes` kind and `MotionPath` the owner moved out of #41 (q71 A): merge `origin/feature/ab144-scene-takes-infrastructure` into this branch (a merge, not a rebase; no force push). After #45 merges, merge `origin/main` in. Re-run `openspec validate --all --strict`: #45's archived specs and this change's deltas must both pass.
- [x] 0.2 Check that the interfaces this change uses exist on #45's branch: `takes` kind and `checkTakes` (`src/scenes/takes-kind.ts`), `neutral` scenes in `catalogue.ts`, `MotionPath` and `motionPathAt`. Compare this change's MODIFIED "State-machine and flow catalogue compatibility" with #45's text in `openspec/specs/scene-catalogue/spec.md`. The expected differences are exactly these: the requirement's text is unchanged; in "Both kinds", the GIVEN adds "registered with later scenes after them" and the THEN reads "their eight compositions are returned unchanged"; in "Takes fixture beside the registered scenes", the THEN no longer counts nine compositions and the catalogue registers the three scenes; and the new scenario "Three scenes in the catalogue". A difference becomes a question in the pull request, not a silent change.

## 1. Failure-rate bar (motion-components)

- [x] 1.1 Add `src/brand/rate-bar-shape.ts`, the pure geometry of design §2.4 with its `RangeError`s, and `src/brand/rate-bar.tsx`, which draws it. Edit neither `components.tsx` nor `motion.ts`.
- [x] 1.2 Add the optional `radius` to `positionedTokenStyle` and `PositionedToken` (`src/brand/flow-shapes.ts`, `src/brand/flow-components.tsx`; default 17, `RangeError` otherwise; design §2.7).
- [x] 1.3 Unit, `test/brand/token-radius.test.ts`, proving "Default unchanged" (plus `test/scenes/publish-subscribe.test.ts` unedited), "Smaller token" and "Bad radius".
- [x] 1.4 Unit, `test/brand/rate-bar.test.ts`, proving:
  - "Fill and tick"
  - "Narrow track"
  - "Small and empty rates"
  - "Full rate"
  - "Drawn from the tokens" (with `test/brand/no-colour-literals.test.ts` scanning the new files)
  - "Bad props"
  - "Boundary props accepted"

## 2. Scene data and timeline (scene-catalogue)

- [x] 2.1 `src/scenes/circuit-breaker-topology/scene.ts`: the entry (kind `takes`, neutral, `16x9`, 1920 frames, outro 1800, both sources, the `text.en` table of design §8.1).
- [x] 2.2 `src/scenes/circuit-breaker-topology/timeline.ts`: the `TopologyTimeline` of design §2.10, with the phases of §4.1 and every cue of §4.2. The calls, trips, counters, lights, tags, arrows and window come from the formulas of §4.2–§4.6, with no React. Every movement end is also in `cues`. Register the scene last in `src/scenes/index.ts`.
- [x] 2.3 Unit, `test/scenes/circuit-breaker-topology-catalogue.test.ts`, proving:
  - "Registered entry"
  - "Word table"
  - "One composition, last"
  - "No 4:5 and no second language"
  - "Broken entry rejected"
  - "Takes checks pass"
  - "Circuit-breaker states untouched". This one runs `test/scenes/circuit-breaker.test.ts` unedited.
- [x] 2.4 Edit only the assertions that list every registered scene: `test/scenes/catalogue-flow.test.ts` ("Both kinds in the catalogue" checks the first two scenes; "Takes fixture beside the registered scenes" counts the registered compositions; add "Three scenes in the catalogue") and the two `available scenes:` lines of `test/scripts/cli.test.ts` (lines 140 and 150). These prove "Both kinds in the catalogue", "Takes fixture beside the registered scenes", "Three scenes in the catalogue" and "Shared checks still reject a broken flow" (MODIFIED requirement).
- [x] 2.5 Unit, `test/scenes/circuit-breaker-topology.test.ts`, "Timeline equals the beat table" and "Travel token changed". The test holds its own transcription of design §4: the phase table, the cue table, and the formulas re-implemented independently.

## 3. Frame logic (scene-catalogue)

- [x] 3.1 `src/scenes/circuit-breaker-topology/frame.ts`: `frameAt(f)` returns the whole stage state from `f` and the object frame `o(f)` (design §2.5): pops, swaps, leaves, fades, tokens on legs, counters, lights, tags, arrows, window, bar rate, clock. It is pure, with no React.
- [x] 3.2 Unit, `test/scenes/circuit-breaker-topology.test.ts`, one `describe` per requirement:
  - **Beats and timing:** "Seeking in any order".
  - **Take 1:** "First request", "The service goes down", "Held down".
  - **Rewind:** "Object frame", "Same stage before each take", "Badge swap".
  - **Breaker wraps the call:** "Drop-in frames", "Retry gone in take 2".
  - **CLOSED fills the window:** "Results enter the window", "At the threshold, still CLOSED", "Calls counted on arrival".
  - **OPEN fails fast:** "Service left alone", "Fail-fast stream", "Cut line drawn", "Customer message beside the error".
  - **Clock:** "Clock frames", "Clock gone in CLOSED".
  - **HALF_OPEN:** "One test call each", "Test fails, OPEN again", "Test succeeds, CLOSED".
  - **Noise:** "Window cleared", "One timeout is noise", "Timeout shows on the lines".
  - **Business error:** "400 drops off", "400 tags".
  - **Sliding window:** "Slides", "Mid-slide".
  - **Final still:** "Final hold identical", "Last movement before the hold".

## 4. Stage, layout and composition (scene-catalogue)

- [x] 4.1 `src/scenes/circuit-breaker-topology/layout.ts`: the values of design §6.1 and the routes of §4.3.
- [x] 4.2 `src/scenes/circuit-breaker-topology/stage.ts`: builds the two stage SVG trees from `frameAt(f)` with the pieces of design §3, each element in a `data-element` group. It also lists the component props (squares, bar, clock, tokens, drop path).
- [x] 4.3 `src/scenes/circuit-breaker-topology/Scene.tsx`: the layers of design §6.2 (stage units, the component box scaled × 2, `Rings` and `MotionPath` in composition pixels). Register `circuit-breaker-topology-16x9` in `src/Root.tsx`.
- [x] 4.4 Add a test helper, `test/scenes/text-measure.ts`. It measures a string's advance on the `fonts/` faces with harfbuzzjs's shaper (`harfbuzzjs/dist/harfbuzz.wasm`; harfbuzzjs is already a dependency) and returns its box per design §6.3.
- [x] 4.5 Unit, `test/scenes/circuit-breaker-topology-layout.test.ts`, proving:
  - "Layout equals the design"
  - "Layer order"
  - "Every settled string at its minimum"
  - "Too small rejected"
  - "Placement at every checked frame"
  - "Exempt and checked frames"
  - "Collision rejected"
  - "Covered light rejected"

  If a design §6.1 value fails, change it in design.md and the spec in the same commit and list it for the owner.
- [x] 4.6 Unit, `test/scenes/circuit-breaker-topology-words.test.ts`, proving:
  - "Words over the whole composition"
  - "Words at their boundaries"
  - "Unlisted word rejected"
  - "Roles over the whole composition"
  - "Red payment label rejected"
  - "No shape of its own"
  - "No colour literal" (the existing `test/brand/no-colour-literals.test.ts` over `src/scenes/` and `src/brand/`)

## 5. Stills, render and the commands (scene-rendering)

- [x] 5.1 Unit, `test/scripts/circuit-breaker-topology.test.ts`, with the existing injected runner, proving:
  - "Topology key-frame stills"
  - "Topology stills dry run"
  - "Topology still failure"
  - "Topology render dry run"
  - "Topology render failure"
- [x] 5.2 Local: `npm run stills -- circuit-breaker-topology` (14 PNGs), plus `npx remotion still` at the boundary frames of design §7. Open every PNG and check overlaps, clipping and contrast (MOT-5).
- [x] 5.3 Local: write the stills sheet and the phone sheet viewed at 341 CSS px (design §7, method recorded) to `docs/spikes/2026-11-12-circuit-breaker-topology/`. This proves "Stills reviewed (local)" with the owner at the media gate.
- [x] 5.4 Local: "Stills byte-identical (local)". Render the stills of every earlier scene on the merge base and on the branch, and compare their SHA-256.
- [x] 5.5 Local, after the owner's ok on the stills:
  - `npm run render -- circuit-breaker-topology`;
  - read the web copy with `npx remotion ffmpeg -hide_banner -i …`;
  - make a contact sheet from the web MP4 at the 14 still frames, plus the same frames viewed at 341 CSS px;
  - prove "Final PNGs identical (local)" by rendering frames 1830 and 1919 and comparing their bytes.

  This proves "Topology video verified from output (local)".

## 6. Checks, docs and review

- [x] 6.1 Run `npm run typecheck && npm run tokens:check && npm run build && npm test` and `openspec validate --all --strict`. All must pass.
- [x] 6.2 Update the docs (proposal "Documentation"):
  - `README.md`: the scene row, the failure-rate bar, the scene's files.
  - `docs/roadmap.md`: the circuit-breaker row.
  - The ADR 0004 amendment for the take numbers, as the owner answers G1 question 2, with its row in `docs/adr/README.md`.
- [ ] 6.3 Code review, by two independent clean-context reviewers per round (the owner's rule). Fix every right high and medium finding; run a second round only if the first had a high or medium.
- [ ] 6.4 Run `openspec archive circuit-breaker-topology-scene -y`, then `openspec validate --all --strict`. Mark the pull request ready only at OUT1.

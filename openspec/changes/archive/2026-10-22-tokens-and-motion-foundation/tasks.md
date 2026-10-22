# Tasks

Test levels: **unit** (vitest, no files), **integration** (vitest with a temporary folder or an injected command runner), **local** (a command the owner runs on a Mac, with its expected output; not in CI because it renders).

## 1. Project setup

- [x] 1.1 Add `package.json` (scripts `tokens`, `tokens:check`, `stills`, `render`, `studio`, `test`, `typecheck`; Node 22 or later), `tsconfig.json`, the dependencies listed in the proposal, and `vitest.config.ts`. Check: `npm ci && npm run typecheck` exits 0.
- [x] 1.2 Add `.github/workflows/ci.yml` (actions pinned by commit SHA): `npm ci`, `npm run typecheck`, `npm run tokens:check`, `npm test` on Node 22. Check: the workflow passes on the pull request.

## 2. Design tokens (`design-tokens`)

- [x] 2.1 Write `tokens/source.json` with the pilot's values (same hex, sizes and timings as the pilot's `tokens.ts`; `font.sans` from design §8), every required token with its required type. Check: `npm run tokens` exits 0 and prints three paths.
- [x] 2.2 Implement validation in `scripts/tokens.ts`. Tests in `test/tokens/validate.test.ts` (unit):
  - "Source file missing or not an object", "Source with an unknown group", "Token without a type", "Invalid JSON", "Name that is not camelCase", "Too deep or unknown token key", "Group that is not an object", "Two paths with one CSS name"
  - "Unknown group and missing token together", "Problems inside an unknown group are not reported", "Wrong required type hides the value check"
  - "Malformed colour", "Zero or negative frame count", "Non-integer or off-step values", "Opacity above one", "Font family that would break the CSS", "Boundary values accepted"
  - "Missing required token", "Required token with the wrong type", "Missing motion token", "Frame rate with the wrong type", "Extra token in a known group" (accepted part)
- [x] 2.3 Implement the three emitters. Tests in `test/tokens/emit.test.ts` (unit): "Kebab case with capitals and digits", "CSS custom property names and units", "TypeScript and JSON keep the nesting", "Generated files say they are generated", "Extra token in a known group" (appears in all three outputs), "Key order does not matter".
- [x] 2.4 Implement write and check modes. Tests in `test/tokens/files.test.ts` (integration, temporary folder): "Same source, same bytes", "Stale output", "Missing output", "Invalid source during the check", and "writes no file" for the invalid-source scenarios of 2.2 (the folder is byte-identical after a failed build).
- [x] 2.5 Commit `tokens/generated/`. Check: `npm run tokens:check` exits 0.

## 3. Motion components (`motion-components`)

- [x] 3.1 Port the frame logic into `src/brand/motion.ts`. Tests in `test/brand/motion.test.ts` (unit): "Before the draw frame", "Half way", "Fully drawn", "Token position over a trip", "Transition fires twice", "Focus changes to the next state" (tolerance 0.01 at 30 frames), "Between two phases", "Intro and outro" (scale kept in the outro), "Pop-in during the intro" (focus factors 1 at frame 10, pop-in values from the pilot's springs), "Blocked call inside the OPEN block", "Countdown at the phase boundaries". Tests in `test/scenes/circuit-breaker.test.ts` (unit, block contents function of `motion.ts` over the scene's timeline): "OPEN between its two phases", "Results persist, then reset", "Before the state's first phase".
- [x] 3.2 Port the components into `src/brand/components.tsx` and `src/brand/fonts.ts`, reading the tokens from `tokens/generated/tokens.ts`. Test in `test/brand/no-colour-literals.test.ts` (unit): "Colour literal in a component" (two fixture files, one with `#FF8A3D`, one with `rgb(255, 138, 61)`, each reported with file and line) and "Real sources are clean" (scans `src/brand/` and `src/scenes/`).
- [x] 3.3 "Token change reaches the components" (local): set `color.ink` to `#FF0000` in `tokens/source.json`, run `npm run tokens` and `npx remotion still src/index.ts circuit-breaker-states-16x9-en out/ink-check.png --frame=999`; expected: outlines and shadows are red in the PNG. Then `git checkout tokens/` and `npm run tokens:check` exits 0.

## 4. Scene catalogue (`scene-catalogue`)

- [x] 4.1 Add `src/scenes/index.ts`, `src/Root.tsx` and `src/index.ts`; register compositions from scene data, one folder per scene. Tests in `test/scenes/catalogue.test.ts` (unit): "Circuit-breaker compositions" (ids, sizes, fps and folder name from the registration data), "Duplicate composition id" (two fixture scenes with one id).
- [x] 4.2 Add the catalogue checks for text tables and timelines, run over every registered scene and over broken fixture scenes, in `test/scenes/catalogue.test.ts` (unit): "Key missing in one language", "Lists of different lengths", "Empty list", "Empty string or missing source", "Phase beyond the composition", "Fire outside its window", "Outro inside the reading hold", "Overlapping phases", "Event outside its phase", "Movement inside the reading hold".
- [x] 4.3 Port the circuit-breaker scene into `src/scenes/circuit-breaker-states/` (`scene.ts`, `layout.ts`, `Scene.tsx`) with the pilot's strings, layouts and the timeline of design §8, and the source URLs of both languages. Tests in `test/scenes/circuit-breaker.test.ts` (unit): "Timing equals the approved pilot" (the scene data against the table of design §8, copied into the test as a fixture), "Phase and transition order", "Failure crosses the threshold before OPEN", "The failed test reopens, the successful test closes", "Caption follows the active state" and "Caption outside phases" (the caption function of `motion.ts` at one frame inside each phase, at frame 0, at 220 and at 950).
- [x] 4.4 "Caption follows the active state" (local): `npm run stills -- circuit-breaker-states`; expected: in each of the 28 PNGs the caption names the phase's state and shows its sentence in the composition's language. Compare the 16:9 and 4:5 stills with the pilot's contact sheets in `docs/spikes/2026-10-22-motion-pilot/`: same layout and colours.

## 5. Scene rendering (`scene-rendering`)

- [x] 5.1 Implement `scripts/cli.ts` (argument parsing, scene lookup, command list, injectable runner), `scripts/stills.ts` and `scripts/render.ts`. Tests in `test/scripts/cli.test.ts` (integration, injected runner that creates the expected files in a temporary `out/`): "Dry run of a render", "Dry run of stills", "Stale stills removed", "Unknown scene", "Missing argument", "Unknown option", "Two scene names", "Repeated or valued dry run", "Unknown option and unknown scene together", "Render failure", "Still failure", "Encode failure" (files of the 16x9 compositions still present), "Rendering again" (every render command carries `--overwrite` and every encode `-y`), "Progress line" (one line per composition, with id, seconds and both sizes, printed before the next composition's first command), "Paths of every media output" (every output path in the command list is under `out/`), and for "Stills of the circuit-breaker scene" the 28 commands with frames 200, 365, 500, 620, 775, 990, 999 and the 28 printed paths.
- [x] 5.2 "Stills of the circuit-breaker scene" (local): `npm run stills -- circuit-breaker-states`; expected: 4 folders under `out/stills/`, 7 PNGs each, 28 paths printed.
- [x] 5.3 "Render of the circuit-breaker scene" (local): `npm run render -- circuit-breaker-states`; expected: 4 files in `out/master/` and 4 in `out/web/`, 4 progress lines; `npx remotion ffmpeg -hide_banner -i out/web/<id>.mp4` shows 1920x1080 or 1080x1350, 30 fps, 33.33 s; each web file is smaller than its master.

## 6. Documentation and delivery

- [x] 6.1 Update `README.md` (status, commands, how a scene is built), `AGENTS.md` (Build, Test, Run; remove "nothing is implemented") and `docs/roadmap.md` (row 1 delivered). Check: every command in the README runs.
- [x] 6.2 Run `openspec validate tokens-and-motion-foundation --strict`, then archive the change in the branch and replace any `TBD` purpose. Check: `openspec validate --all --strict` and `openspec validate --archived` exit 0.

# Tasks: sdd-scene-pieces

Implementation starts after the owner's ok at gate 1. Test levels: **unit** (vitest, pure functions and source reads), **integration** (vitest, the cover command in temporary folders), **local** (a real render and the owner's eyes; not in CI, rendering needs the network). Existing tests stay green unless a task names the change. Each scenario is named with the test that proves it.

## 1. Baselines before any code change

- [ ] 1.1 `scripts/freeze-cast.ts` (pattern of `scripts/freeze-emote.ts`) writes `test/fixtures/cast-0.11.0.json` from the code at `d162a39`: the 138 calls of "Cast calls of 0.11.0 unchanged" (x 100, y 300), each with its tree and `toSvg(g({}, ...body, ...text))`. Run it before touching `src/pieces/brand-cast.ts`, note the commit and the command in a fixtures README line, and commit both alone. Check: `git log --oneline -- test/fixtures/cast-0.11.0.json` shows a commit before any `src/` change; the file holds 138 calls.
- [ ] 1.2 Write `test/fixtures/scene-rings-0.11.0.json` from the 0.11.0 loop of `src/brand/components.tsx` (first radius 100, step 34, reach 1.2, stroke 2.5) for `circuit-breaker-states` and `publish-subscribe`, 16:9 (1920 × 1080) and 4:5 (1080 × 1350): four entries with scene, format, width, height, stroke width and radii; committed with task 1.1. Check: 65 radii (100 to 2276) for 16:9 and 45 (100 to 1596) for 4:5.
- [ ] 1.3 Local: `npm run stills -- circuit-breaker-states` and `npm run stills -- publish-subscribe` at `d162a39`; keep `shasum -a 256 out/stills/*/*.png` in the scratch folder for task 3.4.

## 2. Scene tokens (`design-tokens`)

- [ ] 2.1 `tokens/source.json`: the `scene` group with the eight values of design §5, `pathColor` with a `$description` naming `brand.light.textMuted`; `scripts/tokens.ts`: `scene` in `GROUPS`, the eight entries in `REQUIRED`; `npm run tokens`. Unit tests in `test/tokens/illustration.test.ts`, describe "Required scene tokens": "Scene token missing", "Scene token with the wrong type", "Measured scene values", "A ring reach that is not a number". Check: `npm run tokens:check && npm test -- test/tokens`.
- [ ] 2.2 The path colour check (pattern of `backdropCreditMismatches` in `test/tokens/metro.test.ts`), unit tests "Path colour matches its role", "A path colour that drifts", "A missing path colour". Check: `npm test -- test/tokens/metro.test.ts`.

## 3. Stage rings (`motion-components`)

- [ ] 3.1 `stageRingRadii(width, height, values = tokens.scene)` in `src/brand/motion.ts` (design §6), with `MAX_RINGS` from the pieces. Unit tests in `test/brand/motion.test.ts`, describe "Stage ring radii": "16:9 stage", "4:5 stage", "Given values", "Frame smaller than the first ring", "Bad sizes and values", "Ring limit". Check: `npm test -- test/brand/motion.test.ts`.
- [ ] 3.2 `Rings` in `src/brand/components.tsx` draws `stageRingRadii(width, height)` with `strokeWidth={tokens.scene.ringWidth}`; the four `RING_*` constants go. Unit test "Existing scenes keep their rings" in `test/brand/stage-rings.test.ts`, against the fixture of task 1.2. Check: `npm test -- test/brand`.
- [ ] 3.3 Unit test "No ring constant in the component" (`test/brand/stage-rings.test.ts`, reads `src/brand/components.tsx`); "Real sources are clean" (`test/brand/no-colour-literals.test.ts`) stays green. Check: `npm test -- test/brand`.
- [ ] 3.4 Local "Same stills (local)": stills of both scenes at the change's head on the same machine as task 1.3; every SHA-256 equal. Record the command and the result in the pull request (S1).

## 4. The question token (`illustration-pieces`)

- [ ] 4.1 `src/pieces/question-token.ts` (design §4): `questionToken` with its schema, exported from `src/pieces/library.ts` (last in `PIECES`) and the package root; `REQUIRED_ONLY.questionToken = { cx: 0, cy: 0 }` in `test/pieces/required-only.ts`. Unit tests in `test/pieces/question-token.test.ts`: "Default token", "Same mark as a sheet's question row", "Scaled token", "Token on the dark surface", "Token carries its own stroke", "Same token through React" (with the normal form of `test/pieces/normal-form.ts`), "Scale bounds", "Missing position and unknown parameters". Check: `npm test -- test/pieces/question-token.test.ts`.
- [ ] 4.2 Catalogue: `test/pieces/catalogue.test.ts` expects 64 pieces ("Every piece draws with its defaults"), adds "Question token in the catalogue" and "The token's only glyph"; "Catalogue sheet" (`test/scripts/pieces-sheet.test.ts`), "Seven-role cast gone", "Stamp word" and "Empty label" stay green unchanged. Check: `npm test -- test/pieces/catalogue.test.ts test/scripts/pieces-sheet.test.ts`.

## 5. Visor holds a sheet and faces left or right (`illustration-pieces`)

- [ ] 5.1 `holdsSheet` and `facing` in `src/pieces/brand-cast.ts` (design §1 to §3): schema, the `holds`/`holdsSheet` relation, the held group, the marks group's ink stroke, the text group, the `scale(-1,1)` body group. Unit tests in `test/pieces/brand-pieces.test.ts`, describe "Visor holds a sheet": "Sheet in the left hand", "The sheet's words are Visor's text", "Held sheet on the dark surface", "Held sheet scales with Visor", "Answered sheet", "No sheet, no text"; describe "Held sheet parameters": "Card and sheet together", "Sheet with holds false", "Sizes out of range", "Rows out of range", "Unknown field and empty label". Check: `npm test -- test/pieces/brand-pieces.test.ts`.
- [ ] 5.2 Unit tests in `test/pieces/brand-pieces.test.ts`, describe "Visor faces left or right": "Mirror of the default", "Facing right is the default" (over the fixture's `visor` calls), "Back view and card mirrored", "Unknown facing"; describe "Mirrored Visor keeps its outline and words": "Same outline both ways", "Sheet on the right, unmirrored", "Words read the same"; plus "Visor's schema lists its actions" and "Visor's words". "Mira state faces", "Every expression, both themes", "Back view has no face", "Scale resizes without changing the drawing", "Unknown expression rejected" and "Pure and token-only" stay green unchanged.
- [ ] 5.3 Unit tests in `test/pieces/frozen.test.ts`: "Frozen cast calls" against `cast-0.11.0.json`, and "A changed cast drawing is caught" (a copy of one pinned tree with one coordinate changed is reported by call). The existing frozen tests (0.2.0, 0.5.0, 0.8.0, emote, message arrow, UI icons) stay green unchanged. Check: `npm test -- test/pieces/frozen.test.ts`.
- [ ] 5.4 Palette: `test/pieces/palette.test.ts` "Every piece in the v2 palette" adds the Visor holding a sheet with a `question` row and a `tail` check, facing right and left, on both surfaces; new test "A held sheet's check"; "Dark card on a piece without a surface", "A decorative state colour is caught", "Only the default track rings", "The product accent is caught", "State colours where they mean a state" and "Failing light only when failing" stay green. Check: `npm test -- test/pieces/palette.test.ts`.

## 6. The cover command (`cover-cli`)

- [ ] 6.1 Integration tests in `test/scripts/cover.test.ts`: "Token and held sheet drawn", "Problems at their paths"; "Mascot refused" lists 64 names ending with `questionToken` (the expected list at line 239 gains it); "Emote drawn" and the cover goldens ("Golden output") stay green unchanged. Check: `npm test -- test/scripts/cover.test.ts`.

## 7. Documentation and the owner's gate

- [ ] 7.1 README: "The cast and the emotes" (`holdsSheet`, `facing`, `questionToken`), "Illustration pieces and covers" (64 pieces), "How a scene is built" (the `scene` tokens and `stageRingRadii`), "Upgrading to 0.12.0" (added names; nothing removed or renamed; every 0.11.0 call, spec and scene unchanged); `docs/roadmap.md` row 13e `sdd-scene-pieces`, AB#333. Check: `grep -n "holdsSheet\|questionToken\|scene.ringStep\|0.12.0" README.md` lists each section.
- [ ] 7.2 Evidence in `docs/spikes/<date>-sdd-scene-pieces/` (PNG through Chrome and `<img>`, never `rsvg-convert`, ADR 0008), each under 200 KB, with a README naming the commands: Visor holding a short and a tall sheet facing right and left at scale 1.15 on light and dark; Visor facing left pointing, with and without the card; the token at scale 1, 1.5 and 2 beside a sheet's question row; a 960 × 540 stage with the rings and a dashed path from the tokens. Check: shown to the owner (G3 stills) before the pull request is marked ready.
- [ ] 7.3 Full checks: `npm run typecheck && npm run tokens:check && npm run build && npm test` exits 0; `openspec validate sdd-scene-pieces --strict` and `openspec validate --all --strict` pass.

## Workflow follow-up

- After the code review: `openspec archive sdd-scene-pieces -y`, then `openspec validate --all --strict`, in the same branch.
- The pull request title stays `feat: pieces for the SDD scene: Visor holds a sheet and mirrors, question token, motion path and ring tokens (AB#333)`, with the `BEGIN_COMMIT_OVERRIDE` block of the proposal if the owner chooses it at gate 1; release-please proposes 0.12.0. After the owner merges the release and approves `npm`: `npm view @brunosouzas/design-system version` prints `0.12.0`; then the vault's project notes.

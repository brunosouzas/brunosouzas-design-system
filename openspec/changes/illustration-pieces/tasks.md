# Tasks

Before gate 1 the implementer builds tasks 1 to 4 so the owner can judge the pieces from rendered evidence (catalogue sheet and the three proof covers next to the published ones), with the owner's answers of design §9. Tasks 5 and 6 wait for the gate. Codex reviews; Claude implements.

Test levels: **unit** (vitest, pure functions), **integration** (vitest, the CLI with temporary folders), **local** (exact command and expected output; needs `rsvg-convert` and ffmpeg, not in CI). Existing tests stay unchanged except the token tests that list the required tokens or the groups, and the no-colour-literals test, which adds `src/pieces/`.

## 1. Tokens (`design-tokens`)

- [ ] 1.1 Add `illustration`, `cover` and `coverBackground` to the validator's groups and required tokens, and the pair rule, in `scripts/tokens.ts`. Unit `test/tokens/validate.test.ts`: "Source with an unknown group", "New groups accepted", "Missing illustration token", "Cover token with the wrong type", "Entry without a ring", "Extra token in an entry", "Token directly under the group", "Ring with another type", "Missing group"; existing "Missing required token", "Required token with the wrong type", "Source file missing or not an object", "Token without a type" keep passing. Check: `npm test -- test/tokens`.
- [ ] 1.2 Add the 8 illustration colours, 8 cover measures and 21 background pairs of design §2 to `tokens/source.json`; run `npm run tokens`; add `test/fixtures/cover-backgrounds.json`. Unit `test/tokens/files.test.ts`: "Measured values", "Measured cover values", "Source matches the measured table", "A pair drifts". Check: `npm run tokens:check` exits 0.

## 2. Node contract and renderers (`illustration-pieces`)

- [ ] 2.1 `src/pieces/node.ts`: `SvgNode`, `Drawn`, `el`, `g`, `shadowed`, colour-path and number guards. Unit `test/pieces/node.test.ts`: "Shapes and words apart", "Non-finite number", "Hex passed as a colour", "Default shadow".
- [ ] 2.2 `src/pieces/render.ts`: `toSvg`; `src/pieces/react.ts`: `toReact`. Unit `test/pieces/render.test.ts`: "Escaping", "Deterministic text", "Same drawing through React", "Unknown hyphenated attribute" (normal form parser in the test).
- [ ] 2.3 `src/pieces/pose.ts`. Unit `test/pieces/pose.test.ts`: "Squash keeps the base", "Identity", "Impossible values", "Non-finite values", "Hop over twenty frames".
- [ ] 2.4 Extend `test/brand/no-colour-literals.test.ts` to `src/pieces/` and add an import scan. Unit: "Source without literals", "No file access in piece modules".

## 3. Pieces and EIP icons (`illustration-pieces`)

- [ ] 3.1 Port the prototype's pieces and draw the new ones (design §4) in `src/pieces/`, each with its parameter schema (used by the CLI) and defaults. Unit `test/pieces/catalogue.test.ts`: "Every piece draws with its defaults", "Same parameters, same tree", "Stamp word", "Empty label", "Missing and unknown parameters", "Out of range", "Road path with something else".
- [ ] 3.2 `src/pieces/eip-icons.ts` imported once from the 26 published icons with token colours and the CC BY 4.0 credit; `eipIcon`. Unit `test/pieces/eip-icons.test.ts`: "The 26 names", "Icon colours", "Unknown icon".
- [ ] 3.3 `scripts/pieces-sheet.ts` and `npm run pieces:sheet`. Integration `test/scripts/pieces-sheet.test.ts`: "Catalogue sheet" (26 labels, every piece's name).

## 4. Cover CLI and parity (`cover-cli`)

- [ ] 4.1 `src/pieces/cover.ts` (spec validation, cover frame) and `scripts/cover.ts`, `npm run cover`. Integration `test/scripts/cover.test.ts` with temporary folders: "Proof cover", "Running twice", "Missing out", "Wrong extension and two specs", "Missing folder", "Out names a folder", "Write fails", "Invalid JSON", "Unknown background and piece", "Unsafe id", "Several problems in one piece", "Colour literal anywhere", "Problems sorted", "One problem per path", "Wrong container", "Array of objects", "Allowed object", "Forbidden content", "External reference", "Transform outside the grammar", "Layer order", "Ring colour from the pair".
- [ ] 4.2 Write the three proof specs in `test/fixtures/covers/` from the published covers' geometry (title and description verbatim), their `README.md` with the published files' SHA-256, and generate the goldens with the CLI. Unit `test/scripts/cover.test.ts`: "Golden output"; `test/pieces/render.test.ts` "Same drawing through React" uses the same fixtures.
- [ ] 4.3 Local "Visual parity (local)": render each golden and its published cover with `rsvg-convert -w 800`, run `ffmpeg -i published.png -i rebuilt.png -lavfi psnr -f null -`; expected PSNR ≥ 39.4, 31.8, 23.3 dB. Build the gate-1 contact sheet (published | rebuilt, plus the catalogue sheet) and inspect it. Check: values recorded on the pull request.

## 5. After gate 1: review and documentation

- [ ] 5.1 Run `npm run typecheck && npm run tokens:check && npm test` and `openspec validate illustration-pieces --strict`; Codex code review, findings handled per the engineering playbook.
- [ ] 5.2 README: pieces, `npm run cover` and the spec format, `npm run pieces:sheet`, the EIP icon credit, status. Check: every documented command runs.
- [ ] 5.3 `docs/roadmap.md`: mark this change delivered. Check: matches the brain roadmap.

## 6. Archive

- [ ] 6.1 `openspec archive illustration-pieces`; `openspec validate --specs --strict` exits 0.

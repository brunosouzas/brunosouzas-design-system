# Tasks

At gate 1 the owner sees this spec and the spike sheet (`~/.hermes/spikes/design-system/designer-formats/contact-sheet.png`, outside the repository). Implementation starts after the owner's ok. Codex reviews and Claude implements.

Test levels: **unit** (vitest, pure functions), **integration** (vitest, the command with temporary folders), **local** (render and look; needs `rsvg-convert` and ffmpeg, not in CI). Existing tests stay, except those that count token groups (thirteen to fourteen) and pieces (51 to 52).

## 1. Tokens (`design-tokens`)

- [x] 1.1 Add `bodyDiagram` to `GROUPS` and its five required `dimension` tokens to `REQUIRED` in `scripts/tokens.ts`; add 800, 560, 14, 70 and 11 to `tokens/source.json` (edited as text, one token per line, with `$description` naming the measured source) and run `npm run tokens`. Unit tests in `test/tokens/illustration.test.ts`: "Source with an unknown group" (fourteen), "New groups accepted" (with `bodyDiagram.radius`), "Body diagram token missing", "Body diagram token with the wrong type", "Measured body diagram values". Carried unchanged and still passing: "Source file missing or not an object", "Source with an unknown group" and "Token without a type" in `test/tokens/validate.test.ts`, and `test/tokens/files.test.ts`. Check: `npm test -- test/tokens` and `npm run tokens:check` exit 0.

## 2. `stateStart` (`illustration-pieces`)

- [x] 2.1 Add `stateStart` (design §4) to `src/pieces/diagram.ts` and to `PIECES` last, so the catalogue order holds. Unit tests in `test/pieces/body-diagram.test.ts`: "Default start dot" (exact node), "Start dot on the dark surface", "Bad radius". Add it to the list of "New pieces carry their own stroke" in `test/pieces/icons.test.ts`. Check: `npm test -- test/pieces`.
- [x] 2.2 Piece count 51 to 52 in `test/pieces/catalogue.test.ts` ("Every piece draws with its defaults"), `test/package/package.test.ts`, the cover-cli scenario "Unknown background and piece" (`test/scripts/cover.test.ts`), and the pieces sheet ("Catalogue sheet", `test/scripts/pieces-sheet.test.ts`). Check: `npm test`.

## 3. Command and validation (`cover-cli`)

- [x] 3.1 `--lang` in `parseCoverArgs` and the usage line (`scripts/cover.ts`). Integration tests in `test/scripts/cover.test.ts`: "Language option problems"; "Missing out", "Wrong extension and two specs", "Missing folder" and "Out names a folder" keep passing.
- [x] 3.2 Text tables and references in `src/pieces/cover.ts` (design §3, §10): `text` in `TOP_LEVEL`, table checks, the language choice, resolution, ids `<id>-<code>`; `validateCoverSpec` and `coverTree` take `{ lang }`. Integration tests: "Table problems stop the check", "Missing translation", "Bad table", "One spec, two languages", "Unknown key", "Value of the wrong type", "At sign without tables", "No language chosen", "Unknown language", "Language without tables", "Ids per language".
- [x] 3.3 Formats `diagram` and `icon` in `FORMATS`, their keys and frames (design §2, §5). Integration tests: "Unknown format", "Ring count in a spec" (a diagram added), "Diagram frame", "Smallest diagram", "Height out of range", "Background in a diagram", "Height on a cover", "Pill in a diagram", "Piece with its own stroke", "Published rings", "First ring beyond every corner", "Centre far outside the diagram", "Most rings", "Colour literal in a refused key", "Current colour in an icon spec", "EIP icon", "UI icon box", "Not one icon piece", "Icon off the origin", "Rings in an icon", "Title on an EIP icon", "UI icon without a title", and "Start dot inside the outlined group" (unit level, `test/pieces/body-diagram.test.ts`, through `coverTree`). "Unknown background and piece", "Unsafe id", "Invalid JSON", "Problems sorted", "One problem per path", "Wrong container", "Paths in code-point order", "Current colour in a cover", "Current colour on another piece" and "Token colour in a cover" (all in `test/scripts/cover.test.ts`) keep passing.
- [x] 3.4 `customAt` (design §6). Integration tests: "Custom under a pill", "Default place", "Bad customAt"; "Array of objects", "Allowed object", "Layer order", "Ring colour from the pair" and "Default format is the cover" keep passing.
- [x] 3.5 Fixtures of design §8, byte for byte: `circuit-breaker-states.json`, `eip-splitter.json`; goldens written with `npm run cover -- <spec> [--lang <code>] --out <golden>`. Integration test "Golden output" over the seven goldens. Check: `npm test`.
- [x] 3.6 Local check of "Visual parity (local)": proof covers unchanged (39.4, 31.8, 23.3 dB); both diagram goldens at least 22.0 dB against `circuit-breaker-states-{pt,en}.svg`; `eip-splitter.svg` pixel-identical to the published icon. Check: the ffmpeg lines and the 800 and 375 px PNGs in the pull request.

## 4. Documentation and release

- [ ] 4.1 README (body diagrams and icons through the command, the `npx --package @brunosouzas/design-system@<v> brunosouzas-cover` call, text tables, `customAt`, `stateStart`, `bodyDiagram` tokens, the background sentence of decision 2), `docs/roadmap.md` (AB#173 delivered), `test/fixtures/covers/README.md` (two fixtures, sources, SHA-256). Check: `npm run typecheck && npm run tokens:check && npm run build && npm test` exits 0.
- [ ] 4.2 Version bump from gate-1 decision 1 with `npm version <v> --no-git-tag-version`, after reading `release.yml` and `docs/release.md` on `origin/main`. Check: `package.json` and `package-lock.json` show it.
- [ ] 4.3 Vault: `architecture.md`, `roadmap.md` and `changelog.md` in `10-personal/projects/brunosouzas-design-system/`, directly on the vault's `main`, before `openspec archive`.

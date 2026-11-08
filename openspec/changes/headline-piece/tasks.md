# Tasks: a serif headline piece

## 1. The face

- [ ] 1.1 Add `fonts/SourceSerif4-Bold.ttf`, byte-copied from `TTF/SourceSerif4-Bold.ttf` of `source-serif-4.005_Desktop.zip` (`gh release download 4.005R -R adobe-fonts/source-serif`), and its SHA-256 to `test/fixtures/fonts-sha256.json`; NOTICE names the release and file. Proves "Release files verified" and "A changed font file is caught" (unit, `test/package/fonts.test.ts`, its count and header to six) and "Files in the installed package", "Font file missing" (package test, the expected file list in `test/package/fonts.test.ts`). "One pinned dependency" stays green unchanged.
- [ ] 1.2 `FACES` in `src/fonts/embed.ts` gains `{ family: "Source Serif 4", weight: 700, upTo: Infinity, range: "100 900", file: "SourceSerif4-Bold.ttf" }` after Source Sans 3 (the code-point order of the rules); fix the module's comments ("the five unmodified Adobe files"). Proves "Family names compared exactly", "One serif face for every weight", "Every sort key" (unit, `test/pieces/fonts.test.ts`, updated or added), and "No shipped face, nothing loaded" with the Georgia tree (unit, same file: the test at line 288 moves from the serif stack to `Georgia, serif`). "First family outside Source", "Weights snapped" and "Weight keywords" stay green unchanged.

## 2. The piece

- [ ] 2.1 `headline` in a new `src/pieces/headline.ts` with `definePiece`, schema `x`, `y` (`pos()`), `lines` (1 to 4 non-empty strings), `size` (24 to 160), `anchor` (`start`, `middle`, `end`), `surface`; registered last in `PIECES` (`src/pieces/library.ts`) and exported from the root. Proves "Three lines at 96", "Defaults and the dark surface" and "Out-of-range parameters" (unit, new `test/pieces/headline.test.ts`).
- [ ] 2.2 `REQUIRED_ONLY` gains `headline: { x: 0, y: 0, lines: ["Title"] }` (`test/pieces/required-only.ts`); the catalogue test's text-only exception covers `edgeLabel` and `headline`. Proves "Every piece draws with its defaults" (unit, `test/pieces/catalogue.test.ts`) and "Every piece in the v2 palette" (unit, `test/pieces/palette.test.ts`: `#121212` and `#F1EEE8` are `brand.*` values). `npm run pieces:sheet` lays the piece out in its cell; "Catalogue sheet" stays green (`test/scripts/pieces-sheet.test.ts`).
- [ ] 2.3 Update every literal "62" the change makes false: `test/scripts/cover.test.ts` (or wherever "Unknown background and piece" and "Mascot refused" assert the piece list), so they list 63 names. Proves those two scenarios (integration).

## 3. The command

- [ ] 3.1 Fixture `test/fixtures/covers/og-headline.json`: an `og` spec, `background: "neutral"`, `signature: true`, rings and the one `headline` of the scenario at (140, 190); its golden `og-headline.svg` written by the cover command once the owner has approved the renders (4.2). Test "Title on the og image" (integration, `test/scripts/cover-formats.test.ts`): size, exactly one `@font-face` `Source Serif 4` `100 900`, no stroked ancestor of the headline group, equal to the golden.
- [ ] 3.2 Test "Headline out of range in a spec" (integration, `test/scripts/cover-formats.test.ts`): both problems printed, exit 1, nothing written. "Goldens unchanged" and the frozen fixtures stay green: every existing golden is byte-identical.

## 4. Docs, version and evidence

- [ ] 4.1 ADR 0008 amendment "Source Serif 4 Bold for the headline piece (card 307)" and its "Amended" line; README: `headline` among the pieces, the shipped faces in "Type in a written image", "Upgrading to 0.9.0" (added: `headline`, `fonts/SourceSerif4-Bold.ttf`; changed: nothing). Check: `grep -n "no Source Serif 4" README.md docs/adr/0008-type-inside-the-image.md` hits only the amended ADR's original text.
- [ ] 4.2 Renders, made by the parent through `<img>` in Chrome before the pull request is marked ready: the og spec of concept C built with the branch's CLI, beside the approved preview (`approved/og-concept-c.png`), at 1200 and as the LinkedIn thumbnail; the light and dark catalogue sheets. The owner approves them before the golden of 3.1 is written.
- [ ] 4.3 `package.json` and lockfile at 0.9.0 with the Node of CI; only the version fields change in the lockfile.
- [ ] 4.4 Full checks: `npm run typecheck && npm run tokens:check && npm run build && npm test` (with the GIT_CONFIG signing override for the release tests only); `openspec validate --all --strict`.
- [ ] 4.5 Archive in the same branch (`openspec archive headline-piece -y`), then `openspec validate --specs --strict` and `openspec validate --archived --no-interactive`.

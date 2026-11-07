# Tasks: stackledger's product layer

## 1. Tokens

- [x] 1.1 Add `stackledgerAccent` to `brand.light` (`#3B5BDB`) and `brand.dark` (`#7D8CFF`) in `tokens/source.json` and to `REQUIRED` in `scripts/tokens.ts`; extend `SEPIA_BRAND` in `test/tokens/brand.test.ts` to seventeen tokens and its `toHaveLength(16)` to 17; add the wrong-type source to `invalidSources` in `test/tokens/files.test.ts` ("writes no file"); `npm run tokens`. Proves "Missing brand role", "Product accent with the wrong type", "Extra brand theme", "Measured brand roles, light theme", "Measured brand roles, dark theme" (unit, `test/tokens/brand.test.ts`) and "Product accent in the CSS" (unit, `test/tokens/metro.test.ts`, next to the site CSS lines).
- [x] 1.2 `productAccentContrastBelow` in `test/tokens/metro.test.ts`, beside `siteContrastBelow`, throwing on a missing or non-`#RRGGBB` value. Proves "Accent above the floor", "An accent below the floor" and "A missing accent value" (unit).
- [x] 1.3 Retune the eight `surface.*.backdrop*` values in `tokens/source.json`; `npm run tokens`. Update the literals in `test/tokens/metro.test.ts` ("Measured surfaces", "Backdrop tokens in the CSS", unit). "Surface entry without its shadow", "… without its zone opacity", "… without its backdrop water" and "Extra surface" keep their tests in `test/tokens/metro.test.ts` and `test/tokens/files.test.ts`, green unchanged.
- [x] 1.4 `backdropCreditMismatches` in `test/tokens/metro.test.ts`, throwing on a missing or non-`#RRGGBB` value. Proves "Credit matches its role", "A credit that drifts" and "A missing credit value" (unit).
- [x] 1.5 "Product accent in a spec": a test in `test/scripts/cover.test.ts` (integration) builds a banner spec with a `pipe` filled `brand.light.stackledgerAccent` and finds the pipe's coloured path stroked `#3B5BDB`.

## 2. ledgerMark

- [x] 2.1 Redraw `ledgerMark` in `src/pieces/metro.ts` as the design's "Folha" (one rect at (0.625, 0.625) 30.75 × 30.75, radius 6.6, fill `color.white`, outline 1.25 in `color.ink` or `surface.dark.muted`; the dark band removed) and fix its comment. Update the mark tests in `test/pieces/diagram.test.ts` (lines 94-130). Proves "Favicon size", "Scaled and too small", "Mark on a dark surface" and "Unknown surface on the mark" (unit). `test/pieces/palette.test.ts` stays green unchanged.
- [x] 2.2 "Ink on the dark surface": the test of "Stations inside the ink square" in `test/pieces/diagram.test.ts` (line 237) asserts the scenario's new text (the page `rect` stroked `#ADA79D`, the stations stroked `#121212`; unit). The scenario keeps its name because OpenSpec 1.14 refuses to drop a scenario of a modified requirement. "Light surface unchanged" keeps its test, green.
- [x] 2.3 "New pieces carry their own stroke": its existing test stays green with the page `rect` carrying a `stroke` (unit, the test that walks the new pieces' bodies).
- [x] 2.4 Regenerate the trees of the three `ledgerMark` calls in `test/fixtures/pieces-0.2.0.json` with `scripts/freeze-pieces.ts`, run once for 0.8.1 with a header line saying so (the owner approved the drawing from renders, AB#303 Q5b); update the header of `test/pieces/frozen.test.ts`. Add "Only the mark trees change in 0.8.1" to `test/pieces/frozen.test.ts` (unit), comparing with the 0.8.0 fixture saved from `git show v0.8.0:test/fixtures/pieces-0.2.0.json` as `test/fixtures/pieces-0.8.0.json`. "Goldens unchanged" and "Frozen 0.2.0 calls" stay green; "Same calls after the regeneration" is proved once by `diff <(jq '[.[] | {piece, params}]' test/fixtures/pieces-0.8.0.json) <(jq '[.[] | {piece, params}]' test/fixtures/pieces-0.2.0.json)` printing nothing.

- [x] 2.5 "V2 palette of every piece": remove `brand.*.stackledgerAccent` from `ALLOWED` in `test/pieces/palette.test.ts` and add "The product accent is caught" (unit). "Every piece in the v2 palette" stays green.

## 3. Docs, version and evidence

- [x] 3.1 ADR 0006 amendment "The stackledger accent and the v2 backdrop (card 303)": the role, its values and contrast, and the backdrop values with the credit rule. README: `ledgerMark` (white page, one outline), the backdrop line, and "Upgrading to 0.8.1" (its table as the proposal's Documentation says). Check: `grep -n 'muted band' README.md` returns nothing.
- [x] 3.2 `package.json` and lockfile at 0.8.1, with the Node of CI; only the version fields change in the lockfile.
- [ ] 3.3 Renders before and after, made by the parent through `<img>` in Chrome: the pieces catalogue in light and dark, `ledgerMark` at 96, 32 and 16 px, and a map with the London backdrop drawn by stackledger with the branch's tokens. Shown to the owner before the pull request is marked ready.
- [x] 3.4 Full checks: `npm run typecheck && npm run tokens:check && npm run build && npm test` (with the GIT_CONFIG signing override for the release tests); `openspec validate --all --strict`.
- [ ] 3.5 Archive the change in the same branch (`openspec archive stackledger-product-layer -y`), then `openspec validate --specs --strict` and `openspec validate --archived --no-interactive`.

# Tasks: stackledger's product layer

## 1. Tokens

- [ ] 1.1 Add the `stackledger` group to `tokens/source.json` (light and dark `accent`), to `GROUPS`, `CLOSED_GROUPS` and `LIGHT_DARK_GROUPS`, and its two paths to `REQUIRED` in `scripts/tokens.ts`; `npm run tokens`. Proves "Measured product accent", "Product accent missing or extra" and "Extra product theme": new tests in `test/tokens/brand.test.ts` (unit), same shape as the `brand` ones, plus the CSS lines in `test/tokens/metro.test.ts`.
- [ ] 1.2 `productAccentContrastBelow` in `test/tokens/metro.test.ts`, beside `siteContrastBelow`, throwing on a missing or non-`#RRGGBB` value. Proves "Accent above the floor", "An accent below the floor" and "A missing accent value" (unit).
- [ ] 1.3 Retune the eight `surface.*.backdrop*` values in `tokens/source.json`; `npm run tokens`. Update the literals in `test/tokens/metro.test.ts`. Proves "Measured surfaces" and "Backdrop tokens in the CSS" (unit). The other "Surface tokens" scenarios keep their existing tests in `test/tokens/validate.test.ts`.
- [ ] 1.4 A mapping check for `backdropCredit` against `brand.<theme>.textMuted` in `test/tokens/metro.test.ts`. Proves "Credit matches its role" and "A credit that drifts" (unit).

## 2. ledgerMark

- [ ] 2.1 Redraw `ledgerMark` in `src/pieces/metro.ts` as the design's "Folha" (one rect, white fill, 1.25 outline in `color.ink` or `surface.dark.muted`; the dark band removed). Update the mark tests in `test/pieces/metro.test.ts`. Proves "Favicon size", "Scaled and too small", "Mark on a dark surface" and "Unknown surface on the mark" (unit). `test/pieces/palette.test.ts` must stay green unchanged.
- [ ] 2.2 Regenerate the frozen `ledgerMark` fixtures with `scripts/freeze-pieces.ts` (the owner approved the drawing from renders, AB#303 Q5b). The normalised diff of the fixture must change only the two `ledgerMark` calls. `test/pieces/frozen.test.ts` green.
- [ ] 2.3 "Product accent in a spec": a test in `test/scripts/cover.test.ts` (integration) builds a banner spec with a `pipe` filled `stackledger.light.accent` and finds `#3B5BDB` on it.

## 3. Docs, version and evidence

- [ ] 3.1 ADR 0006 amendment "A product's own layer (card 303)": the `stackledger` group, its values and contrast, the backdrop values and the credit rule. README: `ledgerMark` (white page, one outline), the backdrop line, the `stackledger` group, and "Upgrading to 0.8.1". Check: `grep -n 'muted band' README.md` returns nothing.
- [ ] 3.2 `package.json` and lockfile at 0.8.1.
- [ ] 3.3 Renders before and after, made by the parent through `<img>` in Chrome: the pieces catalogue in light and dark, `ledgerMark` at 96, 32 and 16 px, and a map with the London backdrop drawn by stackledger with the branch's tokens. Shown to the owner before the pull request is marked ready.
- [ ] 3.4 Full checks: `npm run typecheck && npm run tokens:check && npm run build && npm test` (with the GIT_CONFIG signing override for the release tests); `openspec validate --all --strict`.
- [ ] 3.5 Archive the change in the same branch (`openspec archive stackledger-product-layer -y`), then `openspec validate --specs --strict` and `openspec validate --archived --no-interactive`.

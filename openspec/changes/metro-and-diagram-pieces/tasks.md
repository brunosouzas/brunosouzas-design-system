# Tasks

Gate 1 shows the owner this spec and the spike sheet (`~/.hermes/spikes/design-system/metro-pieces/out/contact-sheet-ab157-gate1.png`: the nine pieces on the light and the dark surface, above stackledger's current map and diagrams). Implementation starts after the owner's ok. Codex reviews; Claude implements.

Test levels: **unit** (vitest, pure functions), **integration** (vitest, the commands with temporary folders), **local** (render and look; needs `rsvg-convert`, not in CI). Existing tests stay unchanged except those that list the groups, the required tokens or the 26 piece names.

## 1. Tokens (`design-tokens`)

- [ ] 1.1 Add `surface`, `map` and `site` to the validator's groups, the required `map` and `site` tokens, and the surface rule (exactly `light` and `dark`, eight tokens each) in `scripts/tokens.ts`. Allow `dimension` from 0 to 10000 with two decimals. Unit `test/tokens/validate.test.ts`: "Source with an unknown group", "New groups accepted", "Surface entry without its shadow", "Extra surface", "Map token with the wrong type", "Site palette entry missing", "Non-integer or off-step values", "Boundary values accepted". Check: `npm test -- test/tokens`.
- [ ] 1.2 Add the values of design §2 to `tokens/source.json`; run `npm run tokens`. Unit `test/tokens/files.test.ts`: "Measured surfaces", "Measured map values", "Measured site palette". Check: `npm run tokens:check` exits 0.

## 2. Sticker and data colours (`illustration-pieces`)

- [ ] 2.1 A sticker helper and the `surface` and `inkScale` parameters in `src/pieces/`. Unit `test/pieces/metro.test.ts`: "Light sticker", "Dark sticker with its rim", "Ink scale and its bounds", "Unknown surface or a parameter a piece does not take", "Badge too low for its ink"; existing "Default shadow" and "Shadow of a turned shape" keep passing.
- [ ] 2.2 Parameter kind `dataColor` in `src/pieces/params.ts`, used by `pipe.fill` and `lineBadge.fill` only. Unit `test/pieces/metro.test.ts`: "Catalogue line colour", "Not a data colour"; existing "Hex passed as a colour" and "Source without literals" keep passing. Integration `test/scripts/cover.test.ts`: "Data colour in a cover spec".
- [ ] 2.3 `pipe.d` checked with the path grammar plus a leading `M` or `m`. Unit `test/pieces/metro.test.ts`: "Pipe path with something else".

## 3. Pieces (`illustration-pieces`)

- [ ] 3.1 `lineBadge`, `stationMarker`, `pipe`, `countBadge` (design §3). Unit `test/pieces/metro.test.ts`: "Interchange capsule", "Interchange at one point", "Flat badge", "Badge narrower than tall", "Count shape follows its size".
- [ ] 3.2 `nodeBlock`, `pillNode`, `hexNode` over one drawing function. Unit `test/pieces/diagram.test.ts`: "Focus node on dark", "Placeholder", "Node too narrow, without a title, or a placeholder with a subtitle".
- [ ] 3.3 `messageArrow`. Unit `test/pieces/diagram.test.ts`: "Curved arrow with a head", "Vertical arrow", "Labelled straight arrow", "Arrow too short".
- [ ] 3.4 `ledgerMark`. Unit `test/pieces/diagram.test.ts`: "Favicon size", "Scaled and too small".
- [ ] 3.5 Add the nine to `PIECE_NAMES`, the catalogue test and the sheet's samples. Unit `test/pieces/catalogue.test.ts`: "Every piece draws with its defaults" (35); "Smallest and largest accepted sizes draw valid geometry" covers the new sizes. Integration `test/scripts/pieces-sheet.test.ts`: "Catalogue sheet" (35 labels); `test/scripts/cover.test.ts`: "Unknown background and piece" (35 names).
- [ ] 3.6 Local: render the sheet and a light and dark sample of the nine pieces with `rsvg-convert`, compare them with the gate-1 spike sheet and look at them. Check: PNGs attached to the pull request.

## 4. Documentation

- [ ] 4.1 README (pieces and tokens), `docs/roadmap.md` (AB#157 delivered). Check: links resolve; `openspec validate --specs --strict` passes after the archive.
- [ ] 4.2 ADR 0003 amendment for the dark-surface shadow (design §7), written with the spec so the owner approves it at gate 1. Check: the amendment names the change and keeps the colour meanings.

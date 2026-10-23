# Tasks

At gate 1 the owner sees this spec and the spike sheet (`~/.hermes/spikes/design-system/banner-format/contact-sheet.png`, outside the repository). Implementation starts after the owner's ok. Codex reviews and Claude implements.

Test levels: **unit** (vitest, pure functions), **integration** (vitest, the command with temporary folders), **local** (render and look; needs `rsvg-convert` and ffmpeg, not in CI). The existing tests stay unchanged, except those that list the token groups (twelve to thirteen) and the catalogue's boundary test, which also draws `rings` with `count` 1 and 1000.

## 1. Tokens (`design-tokens`)

- [x] 1.1 Add `banner` to `GROUPS` and its required tokens (width, height, radius as `dimension`) in `scripts/tokens.ts`. Add the values 1200, 420 and 20 to `tokens/source.json` and run `npm run tokens`. Unit tests in `test/tokens/illustration.test.ts`: "Source with an unknown group" (thirteen), "New groups accepted" (with `banner.radius`), "Banner token missing", "Banner token with the wrong type", "Measured banner values". The delta repeats three scenarios unchanged, and their unit tests in `test/tokens/validate.test.ts` keep passing: "Source with an unknown group", "Source file missing or not an object" and "Token without a type". `test/tokens/files.test.ts` also keeps passing. Check: `npm test -- test/tokens` and `npm run tokens:check` both exit 0.

## 2. Rings count (`illustration-pieces`)

- [x] 2.1 `rings` takes `count: count(1, 1000)`, default `RING_COUNT` (14), in `src/pieces/library.ts`. Unit tests in `test/pieces/catalogue.test.ts`: "Default count", "Given count", "Count out of range". "Every piece draws with its defaults" and "Smallest and largest accepted sizes draw valid geometry" keep passing, with `count` 1 and 1000 added to the latter. Check: `npm test -- test/pieces`.

## 3. Banner frame (`cover-cli`)

- [x] 3.1 In `src/pieces/cover.ts`, add `format` to `TOP_LEVEL` and validate it (`cover`, `banner`). Reject `rings.count` as is done for `rings.color`. Integration tests in `test/scripts/cover.test.ts`: "Unknown format", "Ring count in a spec". "Unknown background and piece", "Unsafe id" and "Invalid JSON" keep passing.
- [x] 3.2 Make `coverTree` draw the banner frame of design §4: tokens `banner.*`, `rx` on the clip and background rects, the ring count from design §3, and pieces and labels clipped. A cover keeps today's tree. Integration tests in `test/scripts/cover.test.ts`: "Banner frame", "Piece past a corner", "Same command for both formats", "Published centre", "First ring beyond every corner", "Centre far outside the frame", "Default format is the cover". "Layer order" and "Ring colour from the pair" keep passing.
- [x] 3.3 Add the fixture `test/fixtures/covers/home-banner.json` exactly as written in design §6. Write its golden with `npm run cover -- test/fixtures/covers/home-banner.json --out test/fixtures/covers/home-banner.svg`. Integration test in `test/scripts/cover.test.ts`: "Golden output (home-banner)", added to the three. Check: `npm test`.
- [x] 3.4 Local check of "Visual parity (local)": the three proof covers still reach 39.4, 31.8 and 23.3 dB (their goldens are unchanged, so this repeats the measure). Render `home-banner.svg` at 1200 and at 375 with `rsvg-convert`, and look at both next to the published banner. Check: PNGs attached to the pull request.

## 4. Documentation

- [x] 4.1 README (cover command: `format`, a banner example, the `banner` tokens), `docs/roadmap.md` (item 5, AB#156, delivered), `test/fixtures/covers/README.md` (the banner fixture, its published source `brunosouzas.com/public/images/home/home-banner.svg` at `e8ad098`, and why it may be public). Check: `npm run typecheck && npm run tokens:check && npm run build && npm test` exits 0.
- [ ] 4.2 After the pull request is ready, update the vault's `architecture.md`, `roadmap.md` and `changelog.md` in `10-personal/projects/brunosouzas-design-system/`, directly on the vault's `main`.

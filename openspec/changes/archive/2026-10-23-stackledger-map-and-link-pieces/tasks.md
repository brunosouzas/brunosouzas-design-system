# Tasks

At gate 1 the owner sees this spec and the spike sheet (`~/.hermes/spikes/design-system/stackledger-pieces/out/contact-sheet.png`, outside the repository). Implementation starts after the owner's ok. Codex reviews and Claude implements.

Test levels: **unit** (vitest, pure functions), **integration** (vitest, the command with temporary folders), **local** (render and look; needs `rsvg-convert`, not in CI). Existing tests stay unchanged, except: the catalogue count (35 to 41) in `test/pieces/catalogue.test.ts`, the placeholder-subtitle refusal in `test/pieces/diagram.test.ts` (it moves to the scenario "Node too narrow, without a title, or a placeholder with a subtitle"), the `lineBadge` required-parameter case in the catalogue's missing-parameter test, `ledgerMark`'s unknown-`surface` case in the sticker test, the token tests that list the `map` and `surface` tokens, and the piece count (35 to 41) in `test/package/package.test.ts`.

## 0. Freeze 0.2.0 first

- [x] 0.1 Before any other code change, write `scripts/freeze-pieces.ts` (design §6b) and run it on the tree of `897f2ff` to write `test/fixtures/pieces-0.2.0.json`; commit both alone. Check: the fixture holds the calls of design §6b and the commit's parent is `897f2ff` or the spec commits after it.

## 1. Tokens (`design-tokens`)

- [x] 1.1 Add `map.ringWidth` 3, `map.haloWidth` 1.5, `map.licenceSize` 10, `map.zonePadding` 32 (`dimension`), `map.zoneTitleTint` 0.6 (`number`), and `surface.light.zoneOpacity` 0.12 and `surface.dark.zoneOpacity` 0.22 (`opacity`) to `tokens/source.json` (edited as text, one token per line) and to the required lists in `scripts/tokens.ts`; run `npm run tokens`. Unit tests in `test/tokens/metro.test.ts`: "Surface entry without its shadow", "Surface entry without its zone opacity", "Extra surface", "Measured surfaces", "Map token with the wrong type", "Measured map values". Check: `npm test -- test/tokens` and `npm run tokens:check` exit 0.

## 2. New map pieces (`illustration-pieces`)

- [x] 2.1 `renewalRing` and `suggestedHalo` in `src/pieces/metro.ts` (design §3). Unit tests in `test/pieces/metro.test.ts`: "Light ring", "Dark ring with its rim", "Ring too small for its bands", "Halo on both surfaces", "Halo without a radius".
- [x] 2.2 `licenceMark` with its room rule (design §3). Unit tests in `test/pieces/metro.test.ts`: "Owned licence", "Licence to buy on dark", "Unknown state", "Default size at the default ink", "Too small for its ink". The sticker test in `test/pieces/metro.test.ts` keeps passing ("Light sticker", "Dark sticker with its rim", "Ink scale and its bounds") and gains the `ledgerMark` `inkScale` case of "Unknown surface or a parameter a piece does not take".
- [x] 2.3 `zone` with `fill` as a `dataColor` (design §3). Unit tests in `test/pieces/metro.test.ts`: "Three points", "One and two points on dark", "Points out of range", "Title on light and dark", "Title without its position"; in `test/pieces/metro.test.ts` (data colours): "Catalogue line colour" and "Not a data colour" with the `zone` case. "Source without literals" and "Hex passed as a colour" keep passing (`test/brand/no-colour-literals.test.ts`, `test/pieces/catalogue.test.ts`). Integration: "Data colour in a cover spec" keeps passing in `test/scripts/cover.test.ts`.
- [x] Check for section 2: `npm test -- test/pieces`.

## 3. Icons (`illustration-pieces`)

- [x] 3.1 `UI_ICONS` and `uiIcon` in a new `src/pieces/ui-icons.ts`, exported from `src/pieces/index.ts` (design §5). Unit tests in a new `test/pieces/icons.test.ts`: "Default sun", "The seven names", "Unknown icon or a hex colour".
- [x] 3.2 `LINK_ICONS` and `linkIcon` in a new `src/pieces/link-icons.ts` (design §6). Copy the glyphs from brunosouzas.com `e29b3dd` `public/images/home/social-{github,linkedin,email}.svg` with colours replaced by tokens, and the GitHub path unchanged. Unit tests in `test/pieces/icons.test.ts`: "GitHub on light" (its path compared with the one in the site's file, read in the test from a copy in `test/fixtures/link-icons/social-github.svg`, whose source, brunosouzas.com `e29b3dd`, and licence, Font Awesome CC BY 4.0, are written in `test/fixtures/link-icons/README.md`), "Dark frame", "Unknown icon", "Every icon as a standalone file" (checks on the node objects, then on the written string; no XML parser, no new dependency).
- [x] 3.3 Unit test in `test/pieces/icons.test.ts`: "Inside the outlined group", over the six new pieces and the dark `ledgerMark`.
- [x] Check for section 3: `npm test -- test/pieces/icons.test.ts`.

## 4. Changes to existing pieces (`illustration-pieces`)

- [x] 4.1 Placeholder subtitle in `nodeLimits` and `drawNode` (design §4). Unit tests in `test/pieces/diagram.test.ts`: "Placeholder with a subtitle", "Node too narrow, without a title, or a placeholder with a subtitle". "Default state", "Node radius out of range", "Focus node on dark" and "Placeholder" keep passing.
- [x] 4.2 `lineBadge.text` optional (design §4). Unit tests in `test/pieces/metro.test.ts`: "Default badge without a letter", "Banner badge without a letter", "Empty letter and narrow badge". "Flat badge" and "Badge narrower than tall" keep passing.
- [x] 4.3 `ledgerMark` takes `surface` (design §4). Unit tests in `test/pieces/diagram.test.ts` (where the mark's tests live): "Mark on a dark surface", "Unknown surface on the mark". "Favicon size" and "Scaled and too small" keep passing.
- [x] 4.4 Integration test "Goldens unchanged" in `test/scripts/cover.test.ts` (the four goldens byte for byte; the existing golden tests already do it, so this names them), and unit test "Frozen 0.2.0 calls" in a new `test/pieces/frozen.test.ts`, reading `test/fixtures/pieces-0.2.0.json`.

## 5. Catalogue and cover command

- [x] 5.1 Add the six pieces to `PIECES` (and so to `PIECE_NAMES`) in the order of design §8, and their required parameters to `REQUIRED_ONLY` and their size bounds to the boundary list in `test/pieces/catalogue.test.ts`. Unit tests: "Every piece draws with its defaults" (41), "Smallest and largest accepted sizes draw valid geometry", "Missing and unknown parameters". Integration in `test/scripts/pieces-sheet.test.ts`: "Catalogue sheet". Integration in `test/scripts/cover.test.ts`: "Unknown background and piece" (41 names); "Unsafe id", "Invalid JSON", "Unknown format" and "Ring count in a spec" keep passing.
- [x] 5.2 Version `0.3.0` with `npm version 0.3.0 --no-git-tag-version`. Check: `npm test -- test/package`.

## 6. Documentation and checks

- [x] 6.1 README (the six pieces, the subtitle, the optional letter, the mark's surface, the new tokens), `docs/roadmap.md` (the stackledger requests delivered under AB#167), and the ADR 0003 amendment of design §2. Check: `npm run typecheck && npm run tokens:check && npm run build && npm test` exits 0.
- [x] 6.2 Local check: render the catalogue sheet (`npm run pieces:sheet`) and each new piece on light and dark with `rsvg-convert`, and compare with the spike sheet. Check: PNGs attached to the pull request.
- [x] 6.3 (brain `138b7c2`) After the pull request is ready, update the vault's `architecture.md`, `roadmap.md` and `changelog.md` in `10-personal/projects/brunosouzas-design-system/`, directly on the vault's `main`.

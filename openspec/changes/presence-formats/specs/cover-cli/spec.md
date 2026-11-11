## MODIFIED Requirements

### Requirement: Cover spec format
A spec SHALL be a JSON object with `id` (safe slug), `title` and `description` (non-empty strings), optional `format` (`cover`, `banner`, `diagram`, `icon`, `favicon`, `linkedin-card`, `og`, `avatar`, `linkedin-banner`; default `cover`), and the keys its format allows: `background`, `rings` (`cx`, `cy`, optional `radius`), `pieces`, `custom`, `customAt`, `height`, `text`, `signature`. Each format's requirement says which it refuses or needs. Any other top-level key is an error.

#### Scenario: Unknown background and piece
- **WHEN** a spec has `background: "pink"` and a piece `{ "piece": "rocket" }`
- **THEN** both are reported, `background` before `pieces[0].piece`, the second listing the 63 piece names

#### Scenario: Unsafe id
- **WHEN** `id` is `../sdd` or `SDD`
- **THEN** `id` is reported as not a safe slug

#### Scenario: Invalid JSON
- **WHEN** the spec has a trailing comma
- **THEN** the command prints the parser's line and column, exits 1 and writes nothing

#### Scenario: Unknown format
- **WHEN** a spec has `format: "poster"`, or `format: 1`
- **THEN** exactly one problem is printed for `format`: "expected one of cover, banner, diagram, icon, favicon, linkedin-card, og, avatar, linkedin-banner", the command exits 1 and writes nothing

#### Scenario: Ring count in a spec
- **WHEN** a cover, banner or diagram spec has `rings.count: 30`
- **THEN** `rings.count` is reported as "unknown parameter: the ring count comes from the format"

### Requirement: Signature lockup
A `cover`, `banner`, `linkedin-card` or `og` spec SHALL accept an optional boolean `signature`; `true` adds the Mira-and-symbol lockup after every piece and before the labels, anchored to the frame's bottom-right corner by `cover.signatureMargin` from both edges, with `mira` at `scale: 0.25`. A `diagram`, `favicon`, `avatar`, `icon` or `linkedin-banner` spec refuses the key (for the icon: "Icon keys").

#### Scenario: Signature drawn
- **WHEN** a cover spec has `signature: true`
- **THEN** the written SVG's outlined group ends with a group holding both the `mira` piece at `scale: 0.25` and the symbol, its bounding box's right and bottom edges `cover.signatureMargin` from the frame's right and bottom edges

#### Scenario: No signature by default
- **WHEN** a cover spec omits `signature`
- **THEN** the written SVG has no signature group

#### Scenario: Signature refused by an icon
- **WHEN** an icon spec has `signature: true`
- **THEN** `signature` is reported as "not used by the icon format" and nothing is written, where 0.6.x accepted it and drew nothing

#### Scenario: Signature refused by a LinkedIn banner
- **WHEN** a `linkedin-banner` spec has `signature: true`, then `signature: false`
- **THEN** each run reports `signature` as "not used by the linkedin-banner format", exits 1 and writes nothing

### Requirement: New icon formats
`format` SHALL accept `favicon` (the symbol, both themes, no `pieces`), `linkedin-card` (1080×1080, cover frame conventions), `og` (1200×630, cover frame conventions, the site's generic social-preview image) and `avatar` (500×500, the symbol on a square ground, "Avatar ground"; `pieces`, `rings`, `custom`, `customAt`, `height` and `signature` are refused). This command writes SVG only; the repository's PNG script ("PNG from a written SVG") is a development tool, and a favicon or social-preview PNG set is the consuming site's build step.

#### Scenario: Favicon is the symbol, both themes, no pieces
- **WHEN** a spec with `format: "favicon"` is built
- **THEN** the written SVG is 32×32, holds a light-theme symbol group and a dark-theme symbol group with a `<style>` block switching them by `prefers-color-scheme`, and a `pieces` array in the spec is rejected (`"not used by the favicon format"`)

#### Scenario: LinkedIn card and og image are fixed sizes
- **WHEN** a spec with `format: "linkedin-card"` is built
- **THEN** the written SVG has `width="1080" height="1080" viewBox="0 0 1080 1080"`
- **WHEN** a spec with `format: "og"` is built
- **THEN** the written SVG has `width="1200" height="630" viewBox="0 0 1200 630"`

#### Scenario: Avatar refuses a background and pieces
- **WHEN** a spec with `format: "avatar"` has a non-empty `pieces`, then `rings` `{ "cx": 0, "cy": 0 }`, then `background: "pink"`
- **THEN** the first two are reported as "not used by the avatar format", the third as `background: expected one of <the cover background names>, found "pink"`; each run exits 1 and writes nothing

### Requirement: Parity with the published proof covers
The repository SHALL keep as spec fixtures, with their golden SVG output: the three published proof covers (`spec-driven-development`, `ai-writes-code`, `integration-patterns`), the banner `home-banner`, the body diagram `circuit-breaker-states` (one spec, a golden per language), the icon `eip-splitter`, the og image `og-headline` and `linkedin-banner`. No other spec enters the repository. Cover and banner fixtures use a remaining background; goldens are drawn in the v2 grammar.

#### Scenario: Golden output
- **WHEN** the test builds each fixture, the diagram once with `--lang pt` and once with `--lang en`
- **THEN** each of the nine results equals its golden SVG byte for byte

#### Scenario: Visual parity (local)
- **WHEN** the owner renders each golden at its width (800, 1200 for the banner and the og image, 1584 for the LinkedIn banner, 64 for the icon) in headless Chrome through an `<img>`, next to the 0.6.1 golden
- **THEN** the text shows in Source, the layout, rings and words match the 0.6.1 golden, and the owner approves the pair; no PSNR against the published originals applies, because the v2 colours and type differ from them by design; `og-headline` and `linkedin-banner` have no 0.6.1 golden and are approved from their own renders

#### Scenario: Golden drifts
- **WHEN** one byte of a golden differs from what the command writes
- **THEN** the golden test fails naming that fixture

## ADDED Requirements

### Requirement: LinkedIn banner output
When `format` is `linkedin-banner`, the output SHALL be a 1584x396 `svg` (`viewBox="0 0 1584 396"`, LinkedIn's personal profile background) with a cover's attributes, `title`, `desc`, LF ending and layers: the clip-path `<id>-frame` and the background rect, both without `rx`, the clipped rings, then the outlined group and the label group, unclipped as on a cover.

#### Scenario: LinkedIn banner frame
- **WHEN** a spec with `format: "linkedin-banner"`, `background: "trackDelivery"`, `rings` (1188, 198, radius 60) and one `headline` with `lines: ["Integration"]` and `size: 64` at (900, 120) is built
- **THEN** the root has `width="1584" height="396" viewBox="0 0 1584 396"`, the clip rect and the background rect have no `rx`, the background is `#B9DEC3`, and the `headline` group is in the label group

#### Scenario: Same command, same bytes
- **WHEN** the owner runs `npm run cover -- linkedin.json --out out/linkedin.svg` twice on a valid LinkedIn banner spec
- **THEN** each run prints `wrote out/linkedin.svg` and exits 0, and the file is byte-identical after both

### Requirement: LinkedIn banner keys
A `linkedin-banner` spec SHALL need `background` (a `coverBackground` name), `rings` and `pieces`, and accept `custom` and `customAt` as a cover does. It SHALL accept `text` with one table, `en`, because the words in the image are English (STY-8); any other language is reported at `text.<lang>` as "a LinkedIn banner's words are English". It SHALL refuse `height` with "only a diagram takes a height" and `signature` with "not used by the linkedin-banner format".

#### Scenario: Missing background
- **WHEN** a `linkedin-banner` spec has no `background`
- **THEN** `background` is reported as `expected one of <the cover background names>, found nothing`, the command exits 1 and writes nothing

#### Scenario: Height on a LinkedIn banner
- **WHEN** a `linkedin-banner` spec has `height: 396`
- **THEN** `height` is reported as "only a diagram takes a height" and nothing is written

#### Scenario: English table
- **WHEN** a `linkedin-banner` spec has `text.en.claim: "Integration"` and a `headline` with `lines: "@claim"`, built with `--lang en`
- **THEN** the image is written with the headline `Integration` and ids `<id>-en`

#### Scenario: Another language on a LinkedIn banner
- **WHEN** a `linkedin-banner` spec has tables `en` and `pt` with the same keys
- **THEN** `text.pt` is reported as "a LinkedIn banner's words are English", whatever `--lang` names, and nothing is written

### Requirement: LinkedIn banner rings reach the corners
On a LinkedIn banner the rings SHALL be drawn with `count = max(1, ceil((d - radius) / cover.ringStep) + 1)`, where `d` is the distance from (`cx`, `cy`) to the farthest corner of the 1584x396 frame and `radius` is the spec's first radius or `cover.ringRadius`, stroked in the background's ring colour at `cover.ringWidth`.

#### Scenario: Rings of the fixture
- **WHEN** a LinkedIn banner spec has `rings` `cx` 1188, `cy` 198, `radius` 60
- **THEN** 42 rings are drawn, radii 60 to 1208 in steps of 28

#### Scenario: First ring beyond every corner on a LinkedIn banner
- **WHEN** a LinkedIn banner spec has `rings` `cx` 1100, `cy` 150, `radius` 2000
- **THEN** exactly one ring is drawn, of radius 2000

#### Scenario: Centre far outside a LinkedIn banner
- **WHEN** a LinkedIn banner spec has `rings` `cx` -10000, `cy` -10000 and no `radius`
- **THEN** the image is written with 554 rings, radii 90 to 15574

### Requirement: Ring count takes a frame size
`bannerRingCount(cx, cy, radius, width, height)` SHALL take the frame size as two optional parameters after `radius`, defaulting to the banner's 1200x420, so every existing call keeps its result and nothing is removed from the public API.

#### Scenario: Banner ring count unchanged
- **WHEN** `bannerRingCount(600, 225, 60)` and `bannerRingCount(1188, 198, 60, 1584, 396)` are called
- **THEN** they return 22 and 42

### Requirement: LinkedIn profile photo zones
The package SHALL export from its root entry `LINKEDIN_PHOTO_ZONES`, a frozen array of the circles LinkedIn's profile photo covers, in banner units, white ring included, as measured on the owner's screenshots of 2026-11-11 (about ±2 units), and `LINKEDIN_PHOTO_MARGIN`, 16. Each zone's `safeRadius` is its `r` plus the margin.

#### Scenario: Zone values
- **WHEN** `LINKEDIN_PHOTO_ZONES` and `LINKEDIN_PHOTO_MARGIN` are read from the package root
- **THEN** the margin is 16 and the zones are exactly `{ name: "desktop", cx: 207, cy: 362, r: 160, safeRadius: 176 }` and `{ name: "ios", cx: 244, cy: 409, r: 187, safeRadius: 203 }`, in that order; the array and every entry are frozen, so in strict mode `LINKEDIN_PHOTO_ZONES[0].cx = 1` and `LINKEDIN_PHOTO_ZONES.push(x)` both throw

### Requirement: Photo zones are not checked by the command
The cover command SHALL NOT check pieces, `custom` or words against the photo zones or against a word size: keeping pieces out of the zones is the composer's job, checked by the owner on a render with the zones drawn ("Photo zones overlay").

#### Scenario: A piece in a zone is not refused
- **WHEN** a valid LinkedIn banner spec has a `stationMarker` centred at (207, 362)
- **THEN** the image is written and the command prints only `wrote <file.svg>`

### Requirement: PNG script outside the package
The repository SHALL hold a development script, `scripts/png.ts`, run as `npm run png -- <file.svg> --out <file.png> [--width <px>] [--ground <#rrggbb>] [--zones]`. It is not compiled into the package, not a `bin`, and not part of the cover command.

#### Scenario: Not in the package
- **WHEN** the package test packs the build
- **THEN** no packed file is a `png` script and `bin` names only `brunosouzas-cover`

### Requirement: PNG render
The PNG script SHALL render the SVG through one `<img>` at the SVG's own size (or `--width`, the height in proportion), device scale 1. The window is the page's size; `--ground` adds a 24 px margin of that colour on every side ("Page on a ground"). The script SHALL check that the result is a PNG of the page's size, and write it through a temporary file and a rename. Any problem SHALL exit 1 and leave the target as it was.

#### Scenario: PNG size read
- **WHEN** the header reader gets a PNG of 1584 x 309 while the page is 1584 x 396
- **THEN** the script reports `cannot render <file.png>: the browser wrote 1584x309, expected 1584x396` and writes nothing

#### Scenario: Page on a ground
- **WHEN** the page is built for a 1584x396 SVG with `--width 792 --ground #1B1D24 --zones`
- **THEN** the page and the window are 840 x 246, the body is `#1B1D24`, the `<img>` and the zones `svg` both sit at (24, 24), and the expected PNG size is 840 x 246

#### Scenario: Real PNG (local)
- **WHEN** the owner runs `npm run png` on the `linkedin-banner` golden and on an avatar on `neutral` with his own Chrome
- **THEN** the PNGs are 1584 x 396 and 500 x 500, and their words and pieces match the SVG shown through `<img>` in Chrome

### Requirement: Browser for the PNG script
The PNG script SHALL use `BRUNOSOUZAS_CHROME` when set, else the macOS Chrome and Chromium application paths, else `google-chrome` or `chromium` on `PATH`; start it without a shell, with a fresh profile in a temporary folder it removes, `--host-resolver-rules="MAP * ~NOTFOUND"` so every host name resolves nowhere, and stop it after 60 s.

#### Scenario: Browser arguments
- **WHEN** the script builds the browser's argument list for a page
- **THEN** it holds `--headless`, `--user-data-dir=<a temporary folder>`, `--force-device-scale-factor=1`, `--window-size=<page width>,<page height>` and `--host-resolver-rules=MAP * ~NOTFOUND`, and never `--no-sandbox`

#### Scenario: Lookup order
- **WHEN** `BRUNOSOUZAS_CHROME` is unset and both the macOS Chrome path and `chromium` on `PATH` exist
- **THEN** the macOS Chrome path is used

#### Scenario: No browser
- **WHEN** `BRUNOSOUZAS_CHROME` names a file that does not exist
- **THEN** the script prints `npm run png needs Google Chrome or Chromium: set BRUNOSOUZAS_CHROME to its executable`, exits 1 and writes nothing

### Requirement: Photo zones overlay
With `--zones`, for a 1584x396 SVG only, the PNG script SHALL draw each zone's photo circle and safe circle from `LINKEDIN_PHOTO_ZONES` over the image, dashed, in the page and never in the image.

#### Scenario: Page with zones
- **WHEN** the page is built for a 1584x396 SVG with `--width 792` and `--zones`
- **THEN** it holds one `<img src="image.svg" width="792" height="198">` and, over it, an `svg` with `viewBox="0 0 1584 396"` holding four dashed circles at the two zones' centres, of radii 160, 176, 187 and 203

#### Scenario: Zones on another size
- **WHEN** the script gets `--zones` with a 500x500 SVG
- **THEN** it prints `--zones is for a 1584x396 LinkedIn banner, found 500x500` with the usage, exits 1 and writes nothing

### Requirement: Avatar ground
An `avatar` spec SHALL accept an optional `background`, a `coverBackground` name; the square behind the symbol takes that pair's `fill`, and its ring colour is unused. Without `background` the square stays `brand.light.accentText` and the output is byte-identical to 0.9.1's.

#### Scenario: Avatar on the neutral ground
- **WHEN** an avatar spec has `background: "neutral"`
- **THEN** the written SVG is 500x500 and its square is filled `#F6F3EC`, with the same symbol group as without `background`

#### Scenario: Default avatar unchanged
- **WHEN** the `av` avatar spec of `test/scripts/cover.test.ts` (no `background`) is built
- **THEN** the output equals, byte for byte, `test/fixtures/covers/avatar-0.9.1.svg`, captured from the published 0.9.1 before any change, whose SHA-256 is recorded in `test/fixtures/covers/README.md`

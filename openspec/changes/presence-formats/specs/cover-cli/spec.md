## MODIFIED Requirements

### Requirement: Invocation problems
The command SHALL exit 1 with the problem and the usage line, writing nothing, when: an option other than `--out`, `--lang` or `--png` is given; `--out` has no value, is missing or repeated, does not end in `.svg`, its folder does not exist or it names a folder; `--lang` has no value, is repeated or is not a language code; `--png` has the problems of "PNG option problems"; no spec path or more than one is given; or the spec cannot be read. Only the first is reported, in that order.

#### Scenario: Missing out
- **WHEN** the owner runs `npm run cover -- cover.json`
- **THEN** it prints `--out <file.svg> is required` and the usage, exits 1, and writes nothing

#### Scenario: Wrong extension and two specs
- **WHEN** the owner runs `npm run cover -- a.json b.json --out cover.png`
- **THEN** only the out-path problem is printed, because it comes first in the order, and the command exits 1

#### Scenario: Missing folder
- **WHEN** `--out` names `missing/cover.svg` and `missing/` does not exist
- **THEN** it prints that the folder does not exist and exits 1

#### Scenario: Out names a folder
- **WHEN** `--out` names `covers.svg` and `covers.svg/` is a folder
- **THEN** it prints that the output is a folder and exits 1

#### Scenario: Language option problems
- **WHEN** the owner runs the command with a valid `--out` and `--lang` with no value, then with `--lang pt --lang en`, then with `--lang PT`
- **THEN** it prints `--lang needs a value: <code>`, then `--lang given more than once`, then `--lang expects a language code such as pt or en, found PT`, each with the usage, exits 1 and writes nothing

#### Scenario: Unknown option with a PNG
- **WHEN** the owner runs `npm run cover -- banner.json --out banner.svg --png banner.png --jpg banner.jpg`
- **THEN** it prints `unknown option --jpg` and the usage, exits 1 and writes nothing

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
`format` SHALL accept `favicon` (the symbol, both themes, no `pieces`), `linkedin-card` (1080×1080, cover frame conventions), `og` (1200×630, cover frame conventions, the site's generic social-preview image) and `avatar` (500×500, the symbol on a square ground, "Avatar ground"; `pieces`, `rings`, `custom`, `customAt`, `height` and `signature` are refused). PNG comes from `--png` for an avatar; a favicon or social-preview PNG set is the consuming site's build step.

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
- **WHEN** the owner renders each golden at its width (800, 1200 for the banner, 64 for the icon) in headless Chrome through an `<img>`, next to the 0.6.1 golden
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
A `linkedin-banner` spec SHALL need `background` (a `coverBackground` name), `rings` and `pieces`, accept `custom`, `customAt` and `text` as a cover does, and refuse `height` with "only a diagram takes a height" and `signature` with "not used by the linkedin-banner format".

#### Scenario: Missing background
- **WHEN** a `linkedin-banner` spec has no `background`
- **THEN** `background` is reported as `expected one of <the cover background names>, found nothing`, the command exits 1 and writes nothing

#### Scenario: Height on a LinkedIn banner
- **WHEN** a `linkedin-banner` spec has `height: 396`
- **THEN** `height` is reported as "only a diagram takes a height" and nothing is written

### Requirement: LinkedIn banner rings reach the corners
On a LinkedIn banner the rings SHALL be drawn with `count = max(1, ceil((d - radius) / cover.ringStep) + 1)`, where `d` is the distance from (`cx`, `cy`) to the farthest corner of the 1584x396 frame and `radius` is the spec's first radius or `cover.ringRadius`, stroked in the background's ring colour at `cover.ringWidth`. The banner's own count is unchanged.

#### Scenario: Rings of the fixture
- **WHEN** a LinkedIn banner spec has `rings` `cx` 1188, `cy` 198, `radius` 60
- **THEN** 42 rings are drawn, radii 60 to 1208 in steps of 28

#### Scenario: First ring beyond every corner on a LinkedIn banner
- **WHEN** a LinkedIn banner spec has `rings` `cx` 1100, `cy` 150, `radius` 2000
- **THEN** exactly one ring is drawn, of radius 2000

#### Scenario: Centre far outside a LinkedIn banner
- **WHEN** a LinkedIn banner spec has `rings` `cx` -10000, `cy` -10000 and no `radius`
- **THEN** the image is written with 554 rings, radii 90 to 15574

### Requirement: Profile photo zones
A `linkedin-banner` spec SHALL keep every entry of `pieces`, and `custom`, out of two circles in banner units, where LinkedIn's profile photo covers the image: `desktop`, centre (205, 333), radius 174, and `phone`, centre (405, 396), radius 174. An entry whose drawn box (stroke included) comes closer than the radius to a centre is a problem at its path: `sits under the profile photo on desktop`, `on a phone`, or `on desktop and on a phone`.

#### Scenario: Under both photos
- **WHEN** a LinkedIn banner spec has `custom` a `rect` at (300, 300), 40 x 40, with no own stroke width
- **THEN** the command prints `custom: sits under the profile photo on desktop and on a phone`, exits 1 and writes nothing

#### Scenario: Under one photo
- **WHEN** `pieces[0]` is a `stationMarker` centred at (80, 270), then one centred at (500, 330), each in a LinkedIn banner spec
- **THEN** the first run prints `pieces[0]: sits under the profile photo on desktop`, the second `pieces[0]: sits under the profile photo on a phone`, and neither writes anything

#### Scenario: Just clear of the photo
- **WHEN** a LinkedIn banner spec has `custom` a `rect` at (185, 101), 56 high and 40 wide, whose box ends at y 159, exactly 174 above the desktop centre
- **THEN** the spec is valid and the image is written; with the rect at y 102 the command prints `custom: sits under the profile photo on desktop`

#### Scenario: Rings and background under the photo
- **WHEN** a LinkedIn banner spec has `rings` centred at (205, 333) and no entry in either zone
- **THEN** the spec is valid: the rings and the background are not checked

#### Scenario: A rotated object
- **WHEN** a LinkedIn banner spec has `custom` a `g` with `transform` `rotate(45 290 100)` holding a `rect` at (240, 50), 100 x 100, then the same `rect` without the group
- **THEN** the first run prints `custom: sits under the profile photo on desktop`, because the box is measured after the rotation; the second is valid and written

### Requirement: Drawn box of every piece
The box used by "Profile photo zones" SHALL contain every shape and word an entry draws: each piece's default output and `custom`, under its `translate`, `scale` and `rotate` transforms, each shape widened by half its stroke width (own, inherited, or the outlined group's `outline.block`), and each word estimated at 0.6 em per character, 0.8 em above and 0.25 em below its baseline, placed by its anchor.

#### Scenario: Every piece has a box
- **WHEN** the test computes the box of each of the 63 pieces' required-only calls and of every entry of the golden fixtures
- **THEN** every box is finite and contains every point of every shape the entry draws, sampled along each path, line and outline

#### Scenario: A transform the box cannot read
- **WHEN** the box function is given a group with `transform="skewX(10)"`
- **THEN** it throws an error naming the transform, and no piece's default output makes it throw

### Requirement: Words that read on a phone
Every word a `linkedin-banner` spec draws SHALL have an effective size of 44 units or more: its own `font-size` or its nearest ancestor's, else `cover.labelSize`, times the scale of its transforms. A smaller word is a problem at its entry's path: `words at <size> units show at about <size / 4, one decimal> px on a phone; a LinkedIn banner takes words of 44 units or more`.

#### Scenario: A pill label
- **WHEN** `pieces[0]` of a LinkedIn banner spec is a `pill` at (1000, 100) with `text: "APIs"`
- **THEN** the command prints `pieces[0]: words at 19 units show at about 4.8 px on a phone; a LinkedIn banner takes words of 44 units or more`, exits 1 and writes nothing

#### Scenario: Headline at the floor
- **WHEN** a LinkedIn banner spec has a `headline` at (900, 120) with `lines: ["Integration"]` and `size: 44`, then with `size: 43`
- **THEN** the first is written; the second prints `pieces[0]: words at 43 units show at about 10.8 px on a phone; a LinkedIn banner takes words of 44 units or more`

#### Scenario: Free-form words
- **WHEN** a LinkedIn banner spec has `custom` a `text` node at (900, 100) with `font-size` 30
- **THEN** `custom` is reported with `words at 30 units show at about 7.5 px on a phone`, and nothing is written

### Requirement: PNG export
With `--png <file.png>`, the command SHALL, for a valid `linkedin-banner` or `avatar` spec, render the written SVG through one `<img>` in a local Google Chrome or Chromium at the format's size and device scale 1, check that the result is a PNG of that size, then write the SVG and the PNG with the "Safe write" rules and print `wrote <file.svg>` then `wrote <file.png>`. When the render or its check fails, neither target changes.

#### Scenario: Banner and its PNG
- **WHEN** the owner runs `npm run cover -- linkedin.json --out out/linkedin.svg --png out/linkedin.png` on a valid LinkedIn banner spec, with `BRUNOSOUZAS_CHROME` naming the test's stand-in browser
- **THEN** it prints `wrote out/linkedin.svg` then `wrote out/linkedin.png`, exits 0, the PNG's header gives 1584 x 396, and the browser got `--headless`, `--window-size=1584,396`, `--force-device-scale-factor=1`, `--host-resolver-rules=MAP * ~NOTFOUND` and a local page holding one `<img src="image.svg" width="1584" height="396">`

#### Scenario: Avatar PNG
- **WHEN** the same command builds a valid avatar spec with `--png out/app.png`
- **THEN** the PNG's header gives 500 x 500 and the browser got `--window-size=500,500`

#### Scenario: PNG for another format
- **WHEN** the owner passes `--png out/cover.png` with a valid cover spec
- **THEN** it prints `--png is for the linkedin-banner and avatar formats, found cover`, exits 1 and writes neither file

#### Scenario: Real PNG (local)
- **WHEN** the owner builds the `linkedin-banner` fixture and an avatar with `--png` and his own Chrome
- **THEN** each PNG has the format's size, its words and pieces match the SVG shown through `<img>` in Chrome, and no network request is made

### Requirement: PNG option problems
`--png` SHALL be an invocation problem, after the `--lang` problems, when it has no value (`--png needs a value: <file.png>`), is repeated (`--png given more than once`), does not end in `.png` (`the PNG output must be a .png file, found <path>`), or its folder does not exist (`the PNG output folder does not exist: <folder>`) or it names a folder (`the PNG output is a folder: <path>`).

#### Scenario: PNG option problems
- **WHEN** the owner runs the command with a valid `--out` and `--png` with no value, then `--png a.png --png b.png`, then `--png banner.jpg`, then `--png missing/banner.png`
- **THEN** it prints each message above with the usage, exits 1 and writes nothing

### Requirement: Browser for the PNG
The command SHALL use the browser named by `BRUNOSOUZAS_CHROME` when set, else the first found of Chrome and Chromium in their macOS application folders, then `google-chrome`, `google-chrome-stable`, `chromium`, `chromium-browser` on `PATH`; start it without a shell, with a fresh profile in a temporary folder that it removes; and stop it after 60 s. No browser found, or a browser that fails, is too slow or writes the wrong size, exits 1 and writes nothing.

#### Scenario: No browser
- **WHEN** `BRUNOSOUZAS_CHROME` names a file that does not exist
- **THEN** the command prints `--png needs Google Chrome or Chromium: set BRUNOSOUZAS_CHROME to its executable`, exits 1 and writes neither file

#### Scenario: Browser fails
- **WHEN** the stand-in browser exits 1 after printing `boom` on its error output
- **THEN** the command prints `cannot render out/linkedin.png: the browser exited with 1: boom`, exits 1, and existing `out/linkedin.svg` and `out/linkedin.png` keep their bytes

#### Scenario: Wrong size from the browser
- **WHEN** the stand-in browser writes a PNG of 1584 x 309
- **THEN** the command prints `cannot render out/linkedin.png: the browser wrote 1584x309, expected 1584x396`, exits 1, writes neither file and leaves no temporary file in `out/`

#### Scenario: Browser too slow
- **WHEN** the browser has not exited when the time limit passes (60 s, shortened in the unit test)
- **THEN** it is stopped, the command prints `cannot render <file.png>: the browser did not finish in 60 s` and writes neither file

#### Scenario: Lookup order
- **WHEN** `BRUNOSOUZAS_CHROME` is unset and both the macOS Chrome path and `chromium` on `PATH` exist
- **THEN** the macOS Chrome path is used

### Requirement: Avatar ground
An `avatar` spec SHALL accept an optional `background`, a `coverBackground` name; the square behind the symbol takes that pair's `fill`, and its ring colour is unused. Without `background` the square stays `brand.light.accentText` and the output is byte-identical to 0.9.1's.

#### Scenario: Avatar on the neutral ground
- **WHEN** an avatar spec has `background: "neutral"`
- **THEN** the written SVG is 500x500 and its square is filled `#F6F3EC`, with the same symbol group as without `background`

#### Scenario: Default avatar unchanged
- **WHEN** an avatar spec without `background` is built
- **THEN** the output equals, byte for byte, the 0.9.1 output of the same spec kept as `test/fixtures/covers/avatar-0.9.1.svg`

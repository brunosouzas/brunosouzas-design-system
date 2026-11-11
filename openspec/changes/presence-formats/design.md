# Design: presence-formats

Gate 1 (q36 A): the owner chose the simple version. The zones are measured, documented and drawn on a render for his gate; the command checks keys, not placement or word size; PNG is a repository script, not a command option.

## 1. The LinkedIn banner frame

| Key | LinkedIn banner | Why |
|---|---|---|
| Size | 1584x396, `viewBox="0 0 1584 396"` | LinkedIn's recommended upload for a personal profile background (4:1). An image of exactly that size is shown without LinkedIn's cropper rescaling it |
| Corners | square, no `rx`, no clip on pieces | LinkedIn rounds its own card; a rounded image would show the background colour in the corners. Same as `linkedin-card` and `og` |
| `background` | required, a `coverBackground` name | cover frame convention; the track families and `neutral` are the brand's grounds |
| `rings` | required; drawn out to the farthest corner, `count = max(1, ceil((d - radius) / cover.ringStep) + 1)` over 1584x396 | a cover's default 14 rings stop short on a 4:1 frame (14 rings from `cover.ringRadius`, 90, reach 454; the frame's half-diagonal is 816); the banner's rule already solves it |
| `pieces`, `custom`, `customAt` | accepted | cover frame conventions |
| `text` | accepted, with one table, `en` | STY-8: the words in an image are English; the key keeps `@key` references working for a consumer that writes its words in a table. Any other language is reported at `text.<lang>`: "a LinkedIn banner's words are English" |
| `signature` | refused, "not used by the linkedin-banner format" | §4 |
| `height` | refused, "only a diagram takes a height" | the existing message |

The frame's constants live in `src/pieces/cover.ts` beside `AVATAR_SIZE` and `OG_WIDTH` (`LINKEDIN_BANNER_WIDTH`, `LINKEDIN_BANNER_HEIGHT`), not in tokens: they are a platform's measures, not style.

**Ring count.** `bannerRingCount(cx, cy, radius = cover.ringRadius, width = banner.width, height = banner.height)`: the frame size becomes two optional parameters after `radius`. Every existing call keeps its result (the banner's 1200x420); the LinkedIn banner calls it with 1584 and 396. Nothing is removed from the public API. Checked numbers (`cover.ringStep` 28):

| Centre, radius | Farthest corner | Rings | Radii |
|---|---|---|---|
| (1188, 198), 60 (the fixture) | 1204.4, at (0, 0) and (0, 396) | 42 | 60 to 1208 |
| (1100, 150), 2000 | 1127.2 | 1 | 2000 |
| (-10000, -10000), default 90 | 15564.9, at (1584, 396) | 554 | 90 to 15574 |

## 2. The profile photo zones, measured

LinkedIn publishes the upload size, not the layout around it, and a script cannot see the profile page behind its sign-in wall. The zones were measured by the owner on 2026-11-11 from screenshots of his own profile, converted to banner units, the photo's white ring included:

| Surface | How the banner is shown | Photo centre | Radius |
|---|---|---|---|
| Desktop web | profile card 792 px wide: the banner at 0.5 scale, 792x198 | (207, 362) | 160 |
| iOS app | full screen width, still 4:1, **not** cropped at the sides; on a 440-pt-wide phone about 0.28 scale, 440x110 | (244, 409) | 187 |

The iOS centre lies 13 units below the image's bottom edge: the photo hangs over it. The measures are approximate, about ±2 units (screenshot pixels to banner units). **Not measured:** the Android app and desktop windows narrow enough to change the card's width. The README says so.

**Safe areas.** Each radius gets a 16-unit margin (`LINKEDIN_PHOTO_MARGIN`), for the measuring error, the platform's rounding and small layout drift:

| Zone | Centre | Photo radius | Safe radius | Safe area covers (x, y) |
|---|---|---|---|---|
| `desktop` | (207, 362) | 160 | 176 | 31 to 383, 186 to 396 |
| `ios` | (244, 409) | 187 | 203 | 41 to 447, 206 to 396 |

Together they leave free the whole frame right of x 447 and the band above y 186 everywhere.

**Exported, not checked.** `LINKEDIN_PHOTO_ZONES` (root entry) is a frozen array of `{ name, cx, cy, r, safeRadius }`, in the order above, and `LINKEDIN_PHOTO_MARGIN` is 16. The `illustration` skill and the PNG script read the same numbers. The command does not check a spec against them: a piece in a zone is written like any other (owner's choice, q36 A). The guard is the overlay (§6): the owner sees the zones on the render at his gate.

## 3. Why no automatic check

The first draft measured each piece's drawn box (a walker over paths, transforms and estimated text widths) and refused pieces under the photo and words under 44 units. The owner chose the simple version:

| Option | For | Against |
|---|---|---|
| **A. Documented constants and an overlay on the render** (chosen) | No box walker to write and keep in step with 63 pieces; the zones are platform measures that may drift, and a render shows them as they are; one person composes these banners, a handful of times | A covered piece is caught by eye, not by the command |
| B. A drawn-box check in the command | Catches every covered piece | A new module and its tests for one format; text widths estimated; refuses pieces that just clear the photo |

## 4. No signature on a LinkedIn banner

The lockup is anchored bottom-right at `cover.signatureMargin`. On a phone the 44-unit lockup shows about 12 pt tall, beside Bruno's own photo and name, which sign the profile already. Refused with "not used by the linkedin-banner format". ADR 0007 (the lockup on every piece) is not contradicted: the signature is already optional and refused by four formats; Mira can stand on the banner as a `mira` piece, at a size that reads.

## 5. Words: few, large, English

Written guidance, not a check, as the site banner rule: words are few or none, large, in English (STY-8; ADR 0005 as amended), from an approved source (ADR 0004). At the phone's 0.28 scale a cover label (`cover.labelSize`, 19) shows at about 5 pt, a 44-unit headline at about 12 pt, a 64-unit headline at about 18 pt; on desktop (0.5) the label shows at about 9.5 px. So words come from `headline`, at 44 units or more; the README says so. The command only enforces the language of a `text` table (§1).

## 6. PNG by a repository script

LinkedIn takes PNG or JPG; GitHub takes PNG, JPG or GIF for an App's logo. Both images are made by the owner, a few times; consumers do not need it. So the PNG is a development script, not part of the published command:

| Option | For | Against |
|---|---|---|
| **A. `scripts/png.ts` (`npm run png`), Chrome through `<img>`** (chosen) | No npm dependency; the renderer ADR 0008 names for written images (embedded fonts honoured); not shipped, so no public option to keep | Needs Chrome on the owner's machine |
| B. `--png` on the published command | Consumers get PNG too | Browser lookup, timeouts and a stand-in browser for tests in the public command, for two images |
| C. `rsvg-convert` | Small | Ignores embedded fonts (ADR 0008) |
| D. `@resvg/resvg-js` or `sharp` | Fast | A runtime or dev dependency with native or wasm binaries |

**Not shipped.** `tsconfig.build.json` includes only `scripts/cover.ts`, and `files` ships `dist/`; `scripts/png.ts` runs through `tsx` (already a dev dependency), so it can import the zone constants from `src/`. The package test checks that the packed build holds no `png` script.

**Usage.** `npm run png -- <file.svg> --out <file.png> [--width <px>] [--ground <#rrggbb>] [--zones]`

- The size is the SVG root's own `width` and `height`; `--width` shows it smaller (the height follows, rounded), for evidence images.
- `--ground` puts the image on a page of that colour with a 24 px margin, to see it on a light or dark page.
- `--zones` (a 1584x396 SVG only) draws, in an inline `<svg viewBox="0 0 1584 396">` laid over the `<img>`, each zone's photo circle (dashed ink) and safe circle (dashed `illustration.accent`), each named (`desktop`, `ios`). The overlay is in the page, never in the image.

**Flow.** Find the browser: `BRUNOSOUZAS_CHROME` if set, else the first of `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, `/Applications/Chromium.app/Contents/MacOS/Chromium`, then `google-chrome`, `chromium` on `PATH`. In a new temporary folder (`mkdtemp`) write `image.svg` (a copy) and `page.html` (`<body style="margin:0">`, one `<img src="image.svg" width="W" height="H" style="display:block">`, the overlay if asked). Start the browser with `execFile` (no shell), 60 s timeout:

```
--headless --disable-gpu --hide-scrollbars --no-first-run --no-default-browser-check
--user-data-dir=<tmp>/profile --force-device-scale-factor=1 --window-size=W,H
--host-resolver-rules=MAP * ~NOTFOUND --screenshot=<tmp>/image.png file://<tmp>/page.html
```

Check that the result starts with the PNG signature and its `IHDR` gives the window's size (read with `node:fs`, no decoder); then write it to the target through a temporary file in its folder and a rename; remove the temporary folder in every case. Problems (bad arguments, no browser, a browser that fails, times out or writes the wrong size) print the reason with the usage or as `cannot render <file.png>: <reason>`, exit 1 and leave the target as it was.

**Tests.** The pure parts are unit-tested: the argument parser, the page (with and without `--zones` and `--ground`) and the PNG header reader. A real render is a local check with the owner's Chrome; CI renders nothing (AGENTS.md).

## 7. The avatar's ground (the GitHub App icon)

The avatar's ground is fixed and the format refuses `background`. With an optional `background` the App icon is a consumer spec, and `npm run png` makes its PNG:

```json
{ "id": "release-app", "format": "avatar", "background": "neutral",
  "title": "Bruno Souza's release app", "description": "The b-with-moon symbol on the brand's cream ground." }
```

`background` names a `coverBackground` pair; the square takes its `fill` (no rings in an avatar). Without `background` the tree is unchanged, byte for byte. The symbol keeps its light-surface drawing, which every `coverBackground` fill (all light tones) carries. Rejected: a `ground` key taking any colour token (a second way to name a ground; the twelve pairs are the brand's grounds).

**Baseline before any change.** The 0.9.1 output of the avatar spec of `test/scripts/cover.test.ts` (`id` `av`) is captured first, from the published 0.9.1 (`npx -p @brunosouzas/design-system@0.9.1 brunosouzas-cover <spec> --out test/fixtures/covers/avatar-0.9.1.svg`) or from commit `b925798` (`npm run cover`), and its SHA-256 is recorded in `test/fixtures/covers/README.md`. The test "Default avatar unchanged" compares against it.

## 8. The stackledger link icon

Same box (46), face (2, 2) 38 x 38, radius 9, white, outline 2.5 (ink on light, `surface.dark.muted` on dark), drawn by `linkIcon` unchanged. The glyph is `ledgerMark`'s content mapped from its 32-unit page onto the 38-unit face (x 1.1875, then +2), without its page (the face is the page, so there is one outline). Positions and radii are scaled; stroke widths are as stated here, not all scaled:

| Node | Mark (32 box) | Icon (46 box) | Width |
|---|---|---|---|
| line | `M7 23 L14 16 L25 16`, width 4.5, round | `M10.3 29.3 L18.6 21 L31.7 21`, `illustration.accent`, round caps and joins, fill `none` | 5.3: the mark's 4.5 scaled (4.5 x 1.1875 = 5.34, rounded) |
| big station | (14, 16) r 4, white, ink 2 | (18.6, 21) r 4.75, `color.white`, ink | 2.5: the family's outline width, not the scaled 2.4 |
| small station | (25, 16) r 2.6, white, ink 1.6 | (31.7, 21) r 3.1, `color.white`, ink | 2: the family's width kept in the mark's ratio (1.6 / 2 x 2.5), not the scaled 1.9 |

**Inside the face.** With strokes and round caps, the glyph spans x 7.65 to 35.8 and y 15 to 31.95, inside the face's 2 to 40 on both axes; a test checks every glyph shape's box against it.

The glyph keeps the mark's composition (its weight sits a little below centre), so it reads as the same mark at 28 px. The line is `illustration.accent`, as `ledgerMark` draws it; stackledger's own accent would need a colour parameter on `linkIcon` that nobody asked for. Title `stackledger` (the product writes its name in lower case), description `stackledger icon: the product's mark, a bent line through two stations.` `face` is `color.white`. On dark, only the face outline changes ("Ink on the dark surface": the stations sit on the white face and stay ink). The palette check passes unchanged.

## 9. Fixture

`test/fixtures/covers/linkedin-banner.json`, a banner with no words, and its golden `linkedin-banner.svg`. Draft (task 3.4 fixes the coordinates from renders with `--zones`, so that no piece enters a safe area):

```json
{
  "id": "linkedin-banner",
  "format": "linkedin-banner",
  "title": "Integration, delivery and AI between systems",
  "description": "Illustration on a peach background with soft rings. Mira stands on the left above the profile photo's place; a white browser window sends an orange pipe into a Mule flow with a Choice and a For Each component, and the pipe runs on through two green checks into a white cloud on the right.",
  "background": "trackIntegration",
  "rings": { "cx": 1188, "cy": 198, "radius": 60 },
  "pieces": [
    { "piece": "mira", "x": 470, "y": 140, "scale": 0.7 },
    { "piece": "pipe", "d": "M800,120 C900,120 920,200 1000,200", "fill": "illustration.accent", "width": 22, "casing": 8 },
    { "piece": "pipe", "d": "M1262,200 H1440", "fill": "illustration.accent", "width": 22, "casing": 8 },
    { "piece": "browserWindow", "x": 620, "y": 60, "width": 180, "height": 120 },
    { "piece": "muleFlow", "x": 1000, "y": 140, "width": 262, "height": 120, "tiles": [{ "x": 1028, "kind": "choice" }, { "x": 1148, "kind": "for-each" }], "tileWidth": 86 },
    { "piece": "checkBadge", "cx": 1310, "cy": 200, "r": 24 },
    { "piece": "checkBadge", "cx": 1380, "cy": 200, "r": 24 },
    { "piece": "cloud", "cx": 1470, "cy": 205, "scale": 0.9 }
  ]
}
```

With `rings` (1188, 198, 60) the frame draws 42 rings, radii 60 to 1208 (§1). The title and description describe the image (alt text); no word is drawn.

## 10. Evidence and release

Renders for the owner's gate with `npm run png`, each PNG small (under 200 KB), in `docs/spikes/<date>-presence-formats/`, with a `README.md` naming the commands and grounds used:

- `linkedin-banner-light.png`, `linkedin-banner-dark.png`: the fixture at 792 wide (desktop's shown size) with `--zones`, on a light and on a dark page ground.
- `stackledger-icon-light.png`, `stackledger-icon-dark.png`: the stackledger link icon from an icon spec at size 184, on light, and with `surface: "dark"` on `surface.dark.background`.
- `release-app-avatar.png`: the App's avatar on `neutral` at 250 wide.

Release: the pull request is titled `feat: LinkedIn banner format and stackledger link icon (AB#325)`; with `bump-minor-pre-major`, release-please proposes 0.10.0. The version is never set by hand (AGENTS.md).

## 11. Gate-1 decisions

Taken (q36 A): no zone check, no box walker, no word size check, no `--png` on the command; measured zones exported and drawn by a repository script. Still open in the proposal: (1) screenshots kept out of the repository, (2) Android and narrow desktop left unmeasured, (3) `neutral` ground for the App icon, (4) no signature on the banner.

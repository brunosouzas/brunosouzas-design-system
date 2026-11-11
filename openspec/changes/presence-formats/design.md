# Design: presence-formats

## 1. The LinkedIn banner frame

| Key | LinkedIn banner | Why |
|---|---|---|
| Size | 1584x396, `viewBox="0 0 1584 396"` | LinkedIn's recommended upload for a personal profile background (4:1). An image of exactly that size is shown without LinkedIn's cropper rescaling it |
| Corners | square, no `rx`, no clip on pieces | LinkedIn rounds its own card; a rounded image would show the background colour in the corners. Same as `linkedin-card` and `og` |
| `background` | required, a `coverBackground` name | cover frame convention; the track families and `neutral` are the brand's grounds |
| `rings` | required; drawn out to the farthest corner, `count = max(1, ceil((d - radius) / cover.ringStep) + 1)` over 1584x396 | a cover's fixed 14 rings stop short on a 4:1 frame (14 rings from radius 96 reach 460, the frame's half-diagonal is 816); the banner's rule already solves it |
| `pieces`, `custom`, `customAt`, `text` | accepted | cover frame conventions; `text` tables for a Portuguese variant if the owner ever wants one |
| `signature` | refused | §4 |
| `height` | refused, "only a diagram takes a height" | the existing message |

The frame's constants live in `src/pieces/cover.ts` beside `AVATAR_SIZE` and `OG_WIDTH` (`LINKEDIN_BANNER_WIDTH`, `LINKEDIN_BANNER_HEIGHT`), not in tokens: they are a platform's measures, not style. The ring count reuses `bannerRingCount`, generalised to take the frame's size (the banner's results are unchanged).

## 2. LinkedIn's layout and the photo zones

LinkedIn publishes the upload size, not the layout around it, and the public profile page is behind a sign-in wall for a script (tried on 2026-11-11). The zones below come from a model of the current layout, cross-checked against three published guides (linkedin.com Pulse "Banner Size Guide", usevisuals.com, linkedgrow.ai), and are confirmed or corrected by a live measurement on the owner's own profile before any code (task 1.1).

**Desktop web** (viewport 1128 px or wider). The profile card is 804 CSS px wide and shows the banner at full width, 804x201. The photo is a 152 px circle with a 4 px white border (160 outer), 24 px from the card's left edge, its top 112 px above the banner's bottom edge. In banner units (x 1584 / 804 = 1.970): centre (204.9, 333.0), radius 157.6. The circle covers x 47 to 363 and y 175 to the bottom edge, which matches the guides' "about 364 x 224, bottom left".

**Phone app** (390 pt wide screen). The banner is shown full width at about 3:1 (390x130), so the 4:1 image is scaled to the height and cropped equally on both sides: 198 units on each side are not seen (12.5 %). The photo is a circle about 104 pt across, 16 pt from the screen's left edge, centred on the banner's bottom edge. In banner units (x 396 / 130 = 3.046): centre (405.1, 396), radius 158.4. It covers x 247 to 563 and y 238 to the bottom edge (the guides: "about 568 x 264, bottom left").

**Zones.** Each radius gets a 16-unit margin, for the photo's border, the platform's rounding and small layout drift:

| Zone | Centre | Radius | Covers (x, y) |
|---|---|---|---|
| `desktop` | (205, 333) | 174 | 31 to 379, 159 to 396 |
| `phone` | (405, 396) | 174 | 231 to 579, 222 to 396 |

Together they leave free the top band (y < 159 everywhere), the whole frame right of x 579, and the top-left corner above the desktop photo. The constants are exported as `LINKEDIN_PHOTO_ZONES` (name, `cx`, `cy`, `r`) so the `illustration` skill and the evidence script can draw the same circles; the README shows them as a figure.

**The phone's side crop** (x < 198 and x > 1386) is documented, not checked: on desktop those strips are visible, and a decorative piece (a cloud, the end of a pipe) may run into them as the rings do. Words and the subject belong between them; the README says so.

## 3. Error, not warning

| Option | For | Against |
|---|---|---|
| **A. Error: the command writes nothing** (chosen) | A piece under the photo is hidden from every visitor on that surface: it is always a mistake, not a taste. The command has one outcome per problem today (every problem stops the write), and the `illustration` skill already loops on problems | A piece the owner wants half-hidden needs moving; the margin may refuse a piece that would have just cleared the photo |
| B. Warning: printed, image written | Lets the owner override | A new output channel for one format; a warning in an agent's log is easy to miss, and the image goes out with a covered piece |

The check covers what can be hidden: every entry of `pieces` and the `custom` object. The background and the rings are not checked: they are meant to run under the photo.

**How a box meets a circle.** A piece's drawn box is an axis-aligned rectangle (§6). It reaches a zone when the distance from the circle's centre to the nearest point of the rectangle is less than the radius; a rectangle that only touches the circle (distance equal to the radius) is outside. One problem per entry, naming every zone it reaches: `pieces[3]: sits under the profile photo on desktop and on a phone`.

## 4. No signature on a LinkedIn banner

The lockup is anchored bottom-right at `cover.signatureMargin`. On this frame that corner falls in the phone's right-side crop, and at a quarter of the size the 44-unit lockup shows about 11 px tall, under Bruno's own photo and name, which sign the profile already. Refused with "not used by the linkedin-banner format". ADR 0007 (the lockup on every piece) is not contradicted: the signature is already optional and refused by four formats; Mira can stand on the banner as a `mira` piece, at a size that reads.

## 5. Words that read on a phone

A phone shows the image about 390 px wide, a quarter of its 1584 units. A word of 44 units shows at about 11 px, the smallest size the site's own body text goes to; a cover label (`cover.labelSize`, 19) shows at about 5 px. Rule: every `text` node a LinkedIn banner draws (pieces' words and `custom` words) has an effective size of 44 or more: its own `font-size` or its nearest ancestor's, else the label group's `cover.labelSize`, times the scale of its transforms. Smaller is a problem at the entry: `pieces[2]: words at 19 units show at about 5 px on a phone; a LinkedIn banner takes words of 44 units or more`. In practice words come from `headline` (24 to 160); a `pill` label cannot pass, which is the intent ("no small words"). Words are few or none, as on the site banner, in English (ADR 0005 as amended), and from an approved source (ADR 0004); the README says so, the command does not judge them.

## 6. The drawn box

The zone check needs the space each entry paints, and no piece reports a box today.

| Option | For | Against |
|---|---|---|
| **A. One box function over the drawn tree** (chosen) | One pure function for all 63 pieces and `custom`; a new piece is covered without code | Paths and transforms must be parsed; text widths are estimated |
| B. A box declared by each piece | Exact for each piece | 63 functions to write and keep in step with the drawings |
| C. The entry's `x`, `y` only | Trivial | Misses a piece's extent: a 300-wide flow whose anchor is clear would cover the photo |

`drawnBox(nodes)` in `src/pieces/box.ts`, pure, walks a node tree with a 2D matrix: `translate`, `scale` and `rotate(a [cx cy])` (the only transforms pieces and `custom` write; anything else throws, and a test walks every piece's default output to prove none does). Shapes: `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon`, and `path` with every SVG command, absolute and relative (curves by their control points, which contain the curve; an arc by its end points widened by its larger radius). Each shape grows by half its effective stroke width (own, inherited, or the outlined group's `outline.block`). Text: from the baseline, 0.8 em up and 0.25 em down, and 0.6 em per character, placed by `text-anchor`; Source Sans 3 Bold averages below 0.6 em, so the estimate is on the safe side. The result is conservative: a box can be larger than the ink, never smaller.

## 7. PNG export

LinkedIn takes PNG or JPG; GitHub takes PNG, JPG or GIF for an App's logo. The repository renders PNG today only for Remotion stills (`npm run stills`), through Remotion's own browser, a dev dependency that a consumer's `npx … brunosouzas-cover` does not have.

| Option | For | Against |
|---|---|---|
| **A. `--png <file.png>` that drives a locally installed Chrome or Chromium through `<img>`** (chosen) | No npm dependency; the renderer ADR 0008 names for written images (embedded fonts honoured); works from `npx` in any consumer; the quirks (margins, scrollbars, scale factor, size check) are coded once | Needs Chrome on the machine; CI tests use a stand-in browser |
| B. A documented Chrome command in the README | No code | Every consumer repeats an HTML wrapper and the flags by hand; nothing checks the size |
| C. `rsvg-convert` | Small, scriptable | Ignores embedded fonts (ADR 0008): the PNG would not be in Source |
| D. `@resvg/resvg-js` or `sharp` | Fast, no browser | A second runtime dependency: an ADR, and native or wasm binaries in every install |
| E. Remotion's browser | Already used for stills | A dev dependency; not available to consumers |

**Flow.** After the spec is valid and before anything is written: find the browser, `BRUNOSOUZAS_CHROME` if set (it must name an executable file), otherwise the first of `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, `/Applications/Chromium.app/Contents/MacOS/Chromium`, then `google-chrome`, `google-chrome-stable`, `chromium`, `chromium-browser` on `PATH`. In a new temporary folder (`mkdtemp`), write the embedded SVG as `image.svg` and `page.html`, which is `<!doctype html><html><body style="margin:0"><img src="image.svg" width="W" height="H" style="display:block"></body></html>`. Start the browser with `execFile` (no shell), 60 s timeout:

```
--headless --disable-gpu --hide-scrollbars --no-first-run --no-default-browser-check
--user-data-dir=<tmp>/profile --force-device-scale-factor=1 --window-size=W,H
--host-resolver-rules=MAP * ~NOTFOUND --screenshot=<tmp>/image.png file://<tmp>/page.html
```

Check the result: the file exists, starts with the PNG signature, and its `IHDR` width and height equal the format's (read with `node:fs`, no decoder). Then write the SVG and the PNG with the existing safe write (temporary file in the output folder, rename), the SVG first; remove the temporary folder in every case. Any failure before both renames leaves both targets as they were. Output: `wrote <file.svg>`, then `wrote <file.png>`.

**Scope.** `--png` is accepted for `linkedin-banner` (1584x396) and `avatar` (500x500), the two formats asked; any other format is refused before writing (open question 2 recommends adding `linkedin-card` and `og`). One size, scale factor 1: LinkedIn shows the banner at most about 804 CSS px wide, so 1584 already covers a 2x screen, and an App logo is shown far below 500. A PNG is not byte-reproducible across Chrome versions; its reproducible source is the SVG, and only its size is checked.

**Testing without a browser.** The integration tests set `BRUNOSOUZAS_CHROME` to a small Node script in `test/fixtures/fake-chrome.mjs` that records its arguments and writes a valid PNG (signature, `IHDR`, one `IDAT` from `node:zlib`, `IEND`) of the `--window-size` it was given, or of a size set by an environment variable to test the mismatch. A real render is a local check with the owner's Chrome.

## 8. The avatar's ground (the GitHub App icon)

The App's icon needs package changes: the avatar's ground is fixed and the format refuses `background`, and the command writes no PNG. With `--png` (§7) and an optional `background` the icon is a consumer spec:

```json
{ "id": "release-app", "format": "avatar", "background": "neutral",
  "title": "Bruno Souza's release app", "description": "The b-with-moon symbol on the brand's cream ground." }
```

`background` names a `coverBackground` pair; the square takes its `fill` (no rings in an avatar). Without `background` the tree is unchanged, byte for byte. The symbol keeps its light-surface drawing, which every `coverBackground` fill (all light tones) carries. Rejected: a `ground` key taking any colour token (a second way to name a ground; the twelve pairs are the brand's grounds), and a `linkedin-card` with a `symbol` piece (1080, and rings always drawn).

## 9. The stackledger link icon

Same box (46), face (2, 2) 38 x 38, radius 9, white, outline 2.5 (ink on light, `surface.dark.muted` on dark), drawn by `linkIcon` unchanged. The glyph is `ledgerMark`'s content mapped from its 32-unit page onto the 38-unit face (x 1.1875, then +2), without its page (the face is the page, so there is one outline), with the stroke widths of the link icon family rather than scaled ones:

| Node | Mark (32 box) | Icon (46 box) |
|---|---|---|
| line | `M7 23 L14 16 L25 16`, width 4.5, `illustration.accent`, round | `M10.3 29.3 L18.6 21 L31.7 21`, width 5.3, `illustration.accent`, round caps and joins, fill `none` |
| big station | (14, 16) r 4, white, ink 2 | (18.6, 21) r 4.75, `color.white`, ink 2.5 |
| small station | (25, 16) r 2.6, white, ink 1.6 | (31.7, 21) r 3.1, `color.white`, ink 2 |

The glyph keeps the mark's composition (its weight sits a little below centre), so it reads as the same mark at 28 px. Title `stackledger` (the product writes its name in lower case), description `stackledger icon: the product's mark, a bent line through two stations.` `face` is `color.white`. On dark, only the face outline changes ("Ink on the dark surface": the stations sit on the white face and stay ink). The palette check passes unchanged: the line is `illustration.accent`.

## 10. Fixture

`test/fixtures/covers/linkedin-banner.json`, a banner with no words that passes both checks, and its golden `linkedin-banner.svg`. Draft (task 3.6 fixes the coordinates from renders; the checks must pass):

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

With `rings` (1188, 198, 60) the frame draws 42 rings, radii 60 to 1208. The title and description describe the image (alt text); no word is drawn.

## 11. Evidence and release

Renders for the owner's gate, through `<img>` in Chrome (ADR 0008), each PNG small (under 200 KB), in `docs/spikes/<date>-presence-formats/`:

- `linkedin-banner-light.png`, `linkedin-banner-dark.png`: the fixture at 792x198 on LinkedIn's light and dark page colours, with the two zones and the phone crop outlined (dashed, drawn by the evidence script, not by the command), and a 390-wide phone crop beside it.
- `link-icons-light.png`, `link-icons-dark.png`: the five link icons at 46 and 28 px.
- `release-app-avatar.png`: the App's avatar on the chosen ground at 500 and 40 px, next to Bruno's avatar.

Release: the pull request is titled `feat: LinkedIn banner format, stackledger link icon and PNG export (AB#325)`; with `bump-minor-pre-major`, release-please proposes 0.10.0. The version is never set by hand (AGENTS.md).

## 12. Gate-1 decisions

The proposal's open questions, with these recommendations: (1) accept the zone model, corrected only by the live measurement; (2) add `--png` for `linkedin-card` and `og`; (3) `neutral` ground for the App icon; (4) no signature on the banner; (5) the icon's line in `illustration.accent`.

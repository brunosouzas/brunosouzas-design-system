## MODIFIED Requirements

### Requirement: Link icons as data
The library SHALL hold `LINK_ICONS`, five stickers: the four of `stackledger-map-and-link-pieces` design §6 (`github`, `linkedin`, `email`, `website`) and `stackledger`, drawn from `ledgerMark`'s line and stations. `linkIcon({ icon, x, y, size, surface })` SHALL draw one in a group `translate(x y) scale(size / 46)`: the face rect, white with its outline and no frame behind it, then the glyph. `size` defaults to 46. The `github` description credits Font Awesome and CC BY 4.0.

#### Scenario: GitHub on light
- **WHEN** `linkIcon({ icon: "github", x: 0, y: 0 })` is called
- **THEN** its group has transform `translate(0 0) scale(1)` and holds first the face rect (2, 2) 38 × 38 radius 9 fill `#FFFFFF` stroke `#121212` at 2.5, then a group `translate(9.5 9) scale(0.0455)` with the path of brunosouzas.com `social-github.svg` (`e29b3dd`)

#### Scenario: Dark frame
- **WHEN** `linkIcon({ icon: "email", x: 0, y: 0, surface: "dark" })` is called
- **THEN** its group starts with the face rect (2, 2) 38 × 38 radius 9 filled `#FFFFFF` and stroked `#ADA79D`, with no frame rect before it

#### Scenario: Unknown icon
- **WHEN** `linkIcon` gets `icon: "x"`, or no `icon`
- **THEN** each call throws a `RangeError` naming `icon`, the first listing `github, linkedin, email, website, stackledger`

#### Scenario: Link icon list
- **WHEN** `LINK_ICON_NAMES` is read
- **THEN** it is `github`, `linkedin`, `email`, `website`, `stackledger`, in that order, and every entry of `LINK_ICONS` has a non-empty English `title` and `description`

### Requirement: Icons hold no link, style or script
Every `uiIcon` and `linkIcon` tree, on both surfaces, SHALL use only the node contract's tags, hold no attribute named `href`, `xlink:href`, `style` or starting with `on`, and no attribute value or text containing `url(` or `://`. So a consumer can wrap it in a standalone SVG and ship it under a strict content policy.

#### Scenario: Every icon as a standalone file
- **WHEN** the test walks the node tree of each of the 7 UI icons and each of the 5 link icons, on light and dark (24 trees), and then writes each wrapped in `el("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 46 46" }, …body)` with `toSvg`
- **THEN** in the trees no tag is outside `SVG_TAGS`, no attribute is `href`, `xlink:href`, `style` or `on…`, and no attribute value or text holds `url(` or `://`; and each written string holds `://` exactly once, in the root's `xmlns`

## ADDED Requirements

### Requirement: The stackledger link icon
`linkIcon` with `icon: "stackledger"` SHALL draw, after the face, `ledgerMark`'s bent line in `illustration.accent` and its two stations, white with ink outlines, mapped from the mark's 32-unit page onto the 38-unit face (x 1.1875, then +2), every shape inside the face. Its title is `stackledger` and its description `stackledger icon: the product's mark, a bent line through two stations.`

#### Scenario: stackledger on light
- **WHEN** `linkIcon({ icon: "stackledger", x: 0, y: 0 })` is called
- **THEN** its group holds, in order, the face rect (2, 2) 38 × 38 radius 9 fill `#FFFFFF` stroke `#121212` at 2.5, the path `M10.3 29.3 L18.6 21 L31.7 21` stroked `#E04E17` at 5.3 (the mark's 4.5 scaled, rounded) with round caps and joins and no fill, then the circles (18.6, 21) r 4.75 and (31.7, 21) r 3.1, filled `#FFFFFF` and stroked `#121212` at the family's 2.5 and 2, and nothing else

#### Scenario: stackledger on dark
- **WHEN** `linkIcon({ icon: "stackledger", x: 0, y: 0, surface: "dark" })` is called
- **THEN** only the face rect's stroke differs from the light call, `#ADA79D`; the line stays `#E04E17` and the stations stay stroked `#121212`

#### Scenario: Glyph inside the face
- **WHEN** the test computes the box of each glyph shape of the stackledger icon, widened by half its stroke width (the line's round caps included)
- **THEN** every box lies within 2 to 40 on both axes (the glyph spans x 7.65 to 35.8, y 15 to 31.95)

#### Scenario: Same size as the other link icons
- **WHEN** `linkIcon({ icon: "stackledger", x: 10, y: 20, size: 28 })` is called
- **THEN** its group has the same transform as `linkIcon({ icon: "github", x: 10, y: 20, size: 28 })`, `translate(10 20) scale(28 / 46)`

#### Scenario: stackledger in an icon spec
- **WHEN** an icon spec holds `{ "piece": "linkIcon", "icon": "stackledger" }` with a title and a description
- **THEN** the command writes a 46 x 46 SVG holding the icon, and the palette check passes it on both surfaces

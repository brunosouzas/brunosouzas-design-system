## ADDED Requirements

### Requirement: Renewal ring
`renewalRing({ cx, cy, r, width, surface, inkScale })` SHALL draw circles at (cx, cy) with radius `r`, fill none and no shadow: a rim band in `surface.rim` at width + o + 2w when `rimWidth` > 0, an ink band at width + o, then `color.blocked` at `width` (default `map.ringWidth`, greater than 0, at most 50), as `stackledger-map-and-link-pieces` design §3. An `r` below (width + o + 2w) / 2 throws a `RangeError` naming `r`.

#### Scenario: Light ring
- **WHEN** `renewalRing({ cx: 0, cy: 0, r: 18 })` is called
- **THEN** its body is two circles of radius 18 with fill none: stroke `#0A1033` at 6, then stroke `#FF8A3D` at 3, and its text is empty

#### Scenario: Dark ring with its rim
- **WHEN** `renewalRing({ cx: 0, cy: 0, r: 18, surface: "dark" })` is called
- **THEN** its body is three circles: stroke `#EEF2FF` at 8, stroke `#0A1033` at 6, stroke `#FF8A3D` at 3

#### Scenario: Ring too small for its bands
- **WHEN** `renewalRing` gets `r: 3` on light, then `r: 3.9` on dark, then `width: 0` or `width: 51`
- **THEN** the light call with `r` 3 draws; the dark call throws a `RangeError` naming `r` (at least 4); the other two name `width`

### Requirement: Suggested halo
`suggestedHalo({ cx, cy, r, surface })` SHALL draw one circle at (cx, cy) with radius `r`, fill none, stroke `surface.muted` at `map.haloWidth` and `stroke-dasharray` `4 3`. It draws no ink and takes no `inkScale`.

#### Scenario: Halo on both surfaces
- **WHEN** `suggestedHalo({ cx: 0, cy: 0, r: 21 })` is called, then with `surface: "dark"`
- **THEN** each body is one circle of radius 21 with stroke-width 1.5 and dasharray `4 3`, stroked `#5B6694` on light and `#8F9BD0` on dark

#### Scenario: Halo without a radius
- **WHEN** `suggestedHalo` is called without `r`, or with `r: 0`, or with `inkScale: 1`
- **THEN** each call throws a `RangeError` naming `r`, `r` and `inkScale`

### Requirement: Licence mark
`licenceMark({ cx, cy, state, size, surface, inkScale })` SHALL draw a disc sticker of radius `size` / 2 (default `map.licenceSize`) centred on (cx, cy), with face `color.healthy` when `state` is `owned` (default) and `color.white` when it is `toBuy`.

#### Scenario: Owned licence
- **WHEN** `licenceMark({ cx: 27, cy: -15 })` is called
- **THEN** its body is two circles of radius 5: the shadow at (30.5, -11.5) with fill and stroke `#0A1033` at 3, then the face at (27, -15) with fill `#3DDC84` and stroke `#0A1033` at 3

#### Scenario: Licence to buy on dark
- **WHEN** `licenceMark({ cx: 0, cy: 0, state: "toBuy", surface: "dark" })` is called
- **THEN** its body is three circles of radius 5 (shadow `#4C5CB8`, rim `#EEF2FF`, then the face `#FFFFFF`)

#### Scenario: Unknown state
- **WHEN** `licenceMark` gets `state: "expired"`
- **THEN** it throws a `RangeError` naming `state` and listing `owned, toBuy`

### Requirement: Licence room
A `licenceMark`'s `size` SHALL be at least 3 × `map.outline` × `inkScale`, equality accepted; a smaller one throws a `RangeError` naming `size`. "Room for the outline" does not apply to it.

#### Scenario: Default size at the default ink
- **WHEN** `licenceMark` is drawn with the default size 10 at `inkScale` 1, and with `size: 9`
- **THEN** both draw

#### Scenario: Too small for its ink
- **WHEN** `licenceMark` gets `size: 8.9`, or the default size with `inkScale: 1.2`
- **THEN** each call throws a `RangeError` naming `size`

### Requirement: Zone
`zone({ points, fill, title, titleAt, surface })` SHALL paint the outline it is given, in order, without computing a hull: a group with `opacity` `surface.zoneOpacity` holding a circle of radius `map.zonePadding` for one point, a line stroked at 2 × `map.zonePadding` with round caps for two, or a polygon filled and stroked at 2 × `map.zonePadding` with round joins for three or more, all in `fill`. `points` holds 1 to 10000 points.

#### Scenario: Three points
- **WHEN** `zone({ points: [[0, 0], [100, 0], [50, 80]], fill: "#7B3FE4" })` is called
- **THEN** its body is one group with `opacity` 0.12 holding one polygon with points `0,0 100,0 50,80`, fill and stroke `#7B3FE4`, stroke-width 64 and round joins, and its text is empty

#### Scenario: One and two points on dark
- **WHEN** `zone` gets `points: [[10, 20]]`, then `points: [[0, 0], [100, 0]]`, both with `surface: "dark"`
- **THEN** the first group has `opacity` 0.22 and holds a circle at (10, 20) of radius 32 filled with the fill; the second holds a line from (0, 0) to (100, 0) stroked at 64 with round caps

#### Scenario: Points out of range
- **WHEN** `zone` gets `points: []`, 10001 points, or `points: [[0, NaN]]`
- **THEN** each call throws a `RangeError` naming `points` or `points[0]`

### Requirement: Zone title
A `zone` with a `title` SHALL draw it at (titleAt.x, titleAt.y + 13), bold, `map.labelSize`, start anchor, in `fill` on light, and on dark in `fill` mixed with white by `map.zoneTitleTint` (each channel `round(c × (1 − t) + 255 × t)`, upper-case hex). `title` and `titleAt` go together; one without the other throws a `RangeError` naming the missing one.

#### Scenario: Title on light and dark
- **WHEN** `zone` gets `points: [[0, 0]]`, `fill: "#7B3FE4"`, `title: "Payments"` and `titleAt: [-24, -56]`, once on light and once on dark
- **THEN** each text holds `Payments` at (-24, -43), font-size 13, bold, filled `#7B3FE4` on light and `#CAB2F4` on dark

#### Scenario: Title without its position
- **WHEN** `zone` gets a `title` without `titleAt`, then a `titleAt` without `title`, then `title: ""`
- **THEN** the calls throw a `RangeError` naming `titleAt`, `title` and `title`

### Requirement: UI icons as data
The library SHALL hold `UI_ICONS`, the seven icons of `stackledger-map-and-link-pieces` design §5 (`sun`, `moon`, `zoomIn`, `zoomOut`, `reset`, `calendar`, `download`), each with a title, a description and nodes in a 24 × 24 box without colours. `uiIcon({ name, x, y, size, colour })` SHALL place one in a group `translate(x y) scale(size / 24)` whose `fill` and `stroke` are `colour` (a token path, default `color.ink`).

#### Scenario: Default sun
- **WHEN** `uiIcon({ name: "sun", x: 0, y: 0 })` is called
- **THEN** its body is one group with transform `translate(0 0) scale(1)`, fill and stroke `#0A1033`, holding the sun's circle and its rays path

#### Scenario: The seven names
- **WHEN** the test lists `UI_ICONS`
- **THEN** the names are exactly the seven above, in that order, each with a non-empty title and description, and no node of the data carries a colour

#### Scenario: Unknown icon or a hex colour
- **WHEN** `uiIcon` gets `name: "menu"`, or `colour: "#FFFFFF"`
- **THEN** each call throws a `RangeError` naming `name` or `colour`

### Requirement: Link icons as data
The library SHALL hold `LINK_ICONS`, the four stickers of `stackledger-map-and-link-pieces` design §6 (`github`, `linkedin`, `email`, `website`), and `linkIcon({ icon, x, y, size, surface })` SHALL draw one in a group `translate(x y) scale(size / 46)`: the light or dark frame of design §6, the face rect, then the glyph. `size` defaults to 46. The `github` description credits Font Awesome and CC BY 4.0.

#### Scenario: GitHub on light
- **WHEN** `linkIcon({ icon: "github", x: 0, y: 0 })` is called
- **THEN** its group has transform `translate(0 0) scale(1)` and holds a rect (5, 5) 38 × 38 radius 9 fill `#0A1033`, the face rect (2, 2) 38 × 38 radius 9 fill `#FFFFFF` stroke `#0A1033` at 2.5, and a group `translate(9.5 9) scale(0.0455)` with the path of brunosouzas.com `social-github.svg` (`e29b3dd`)

#### Scenario: Dark frame
- **WHEN** `linkIcon({ icon: "email", x: 0, y: 0, surface: "dark" })` is called
- **THEN** its group starts with a rect (4, 4) 41 × 41 radius 11 fill `#4C5CB8`, then a rect (0.5, 0.5) 41 × 41 radius 11 fill `#EEF2FF`, then the face rect filled `#FFD25A`

#### Scenario: Unknown icon
- **WHEN** `linkIcon` gets `icon: "x"`, or no `icon`
- **THEN** each call throws a `RangeError` naming `icon`

### Requirement: Icons hold no link, style or script
Every `uiIcon` and `linkIcon` tree, on both surfaces, SHALL use only the node contract's tags, hold no attribute named `href`, `xlink:href`, `style` or starting with `on`, and no attribute value or text containing `url(` or `://`. So a consumer can wrap it in a standalone SVG and ship it under a strict content policy.

#### Scenario: Every icon as a standalone file
- **WHEN** the test wraps each of the 7 UI icons and each of the 4 link icons, on light and dark (22 trees), in `el("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 46 46" }, …body)`, writes it with `toSvg` and parses it as XML
- **THEN** each parses, and below the root no element is outside the contract's tags, no attribute is `href`, `xlink:href`, `style` or `on…`, and no value or text holds `url(` or `://`

### Requirement: New pieces carry their own stroke
Every shape a new piece draws (`renewalRing`, `suggestedHalo`, `licenceMark`, `zone`, `uiIcon`, `linkIcon`, and the dark `ledgerMark` rim) SHALL carry its own `stroke`, or sit in a group of the piece that sets one, so it draws the same inside the cover command's outlined group (`stroke` ink, width 4) as on its own.

#### Scenario: Inside the outlined group
- **WHEN** the test walks each new piece's body, drawn with its required parameters on light and dark, plus `zone` with one, two and three points
- **THEN** every `circle`, `ellipse`, `rect`, `line`, `polyline`, `polygon` and `path` has a `stroke` attribute or an ancestor `g` inside the piece's body that has one

### Requirement: Badge without a letter
`lineBadge.text` SHALL be optional. Without it, the body is drawn as with a text, the `text` array is empty, and the default width is the one-character width, 30. `text: ""` is still rejected naming `text`. A call with a text draws as in 0.2.0.

#### Scenario: Default badge without a letter
- **WHEN** `lineBadge({ x: 50, y: 20, fill: "color.healthy" })` is called
- **THEN** its face is a rect at (35, 10), 30 × 20, radius 10, and its text is empty

#### Scenario: Banner badge without a letter
- **WHEN** `lineBadge({ x: 110, y: 300, fill: "color.healthy", height: 34, width: 54, surface: "dark", inkScale: 1.6 })` is called
- **THEN** its body equals the body of the same call with `text: "B"`, and its text is empty

#### Scenario: Empty letter and narrow badge
- **WHEN** `lineBadge` gets `text: ""`, or no text with `height: 34` and no width
- **THEN** the first throws a `RangeError` naming `text`; the second names `width`

### Requirement: Existing calls unchanged
Every call that is valid in 0.2.0 SHALL draw the same tree in this version: the proof cover and banner goldens stay byte-identical, and the calls frozen from 0.2.0 in `test/fixtures/pieces-0.2.0.json` (`stackledger-map-and-link-pieces` design §6b: `lineBadge` with a text, nodes without a placeholder subtitle, `ledgerMark` without `surface`) draw deep-equal trees.

#### Scenario: Goldens unchanged
- **WHEN** the four golden fixtures are built
- **THEN** each output equals its golden byte for byte

#### Scenario: Frozen 0.2.0 calls
- **WHEN** each call of `test/fixtures/pieces-0.2.0.json` is made again
- **THEN** its tree is deep-equal to the frozen one, and each `ledgerMark` call with `surface: "light"` added is deep-equal to the same frozen tree

## MODIFIED Requirements

### Requirement: Colours only from tokens
Pieces SHALL take every colour from the generated tokens; `src/pieces/` holds no colour literal (`#` with three or six hex digits, `rgb(`, `hsl(`). A colour parameter SHALL be a token path of type `color`, such as `color.healthy`; any other value is rejected. Only `pipe.fill`, `lineBadge.fill` and `zone.fill` are data colours: they also accept `#RRGGBB` (see "Line colours from data").

#### Scenario: Source without literals
- **WHEN** the no-colour-literals test scans `src/pieces/`
- **THEN** it finds nothing

#### Scenario: Hex passed as a colour
- **WHEN** `pill` is called with `fill: "#FFFFFF"` or `fill: "outline.block"`
- **THEN** it throws a `RangeError` naming `fill` and saying a colour token path is expected

### Requirement: Line colours from data
`pipe.fill`, `lineBadge.fill` and `zone.fill` SHALL accept a colour token path or a data colour matching `^#[0-9A-Fa-f]{6}$`, drawn as given. Any other string is rejected. A cover spec still rejects every colour literal, data colours included.

#### Scenario: Catalogue line colour
- **WHEN** `pipe({ d: "M0,0 L100,0", fill: "#7B3FE4" })` is called
- **THEN** its second path has `stroke` `#7B3FE4` and stroke-width 12, over an ink path of stroke-width 18

#### Scenario: Not a data colour
- **WHEN** `lineBadge` gets `fill: "#7B3FE4; onload"`, `fill: "red"` or `fill: "url(#x)"`, or `zone` gets `fill: "red"`
- **THEN** each call throws a `RangeError` naming `fill`

#### Scenario: Data colour in a cover spec
- **WHEN** a cover spec has a `pipe` with `fill: "#7B3FE4"`
- **THEN** the cover command reports `pieces[0].fill` as a colour literal and writes nothing

### Requirement: Piece catalogue
The library SHALL export these pieces, with the parameters and defaults of the designs (`illustration-pieces` §4, `metro-and-diagram-pieces` §3, `stackledger-map-and-link-pieces` §3): pill, rings, sheet, blockArrow, arcArrow, rail, checkBadge, priceTag, nameTag, codePanel, serverStack, cloud, stamp, robot, magnifier, gear, parcel, road, milestonePin, browserWindow, speechBubble, steps, folder, book, muleFlow, eipIcon, lineBadge, stationMarker, pipe, countBadge, nodeBlock, pillNode, hexNode, messageArrow, ledgerMark, renewalRing, suggestedHalo, licenceMark, zone, uiIcon, linkIcon.

#### Scenario: Every piece draws with its defaults
- **WHEN** the catalogue test calls each of the 41 pieces with only its required parameters
- **THEN** each returns a non-empty `body`, valid tags only, and colours that are token values

#### Scenario: Catalogue sheet
- **WHEN** `npm run pieces:sheet -- --out <file.svg>` runs
- **THEN** it writes one SVG with every piece once, labelled with its name in the mono font, and prints `wrote <file>`

### Requirement: Ink sticker on a surface
`lineBadge` (unless flat), `stationMarker`, `countBadge`, `licenceMark` and the three nodes (unless placeholder) SHALL draw the sticker of `metro-and-diagram-pieces` design §3: a shadow copy moved by `map.shadow` × `inkScale` in `surface.shadow`, a rim in `surface.rim` when `rimWidth` > 0, then the face outlined in `color.ink`. `surface` is `light` (default) or `dark`; `inkScale` is 0.25 to 8; `pipe` takes neither, and `ledgerMark` takes only `surface`.

#### Scenario: Light sticker
- **WHEN** `stationMarker({ cx: 100, cy: 50 })` is called
- **THEN** its body is two circles of radius 12: the first at (103.5, 53.5) with fill and stroke `#0A1033` and stroke-width 3, the second at (100, 50) with fill `#FFFFFF`, stroke `#0A1033` and stroke-width 3

#### Scenario: Dark sticker with its rim
- **WHEN** `stationMarker({ cx: 100, cy: 50, surface: "dark" })` is called
- **THEN** its body is three circles: the shadow at (103.5, 53.5) in `#4C5CB8` with stroke-width 5, the rim at (100, 50) in `#EEF2FF` with stroke-width 5, then the white face with stroke-width 3

#### Scenario: Ink scale and its bounds
- **WHEN** `nodeBlock` is drawn with `inkScale: 1.6`, and then with `inkScale: 0.1` and `inkScale: 9`
- **THEN** the first has outline 4.8 and its shadow moved by 5.6; the other two throw a `RangeError` naming `inkScale`

#### Scenario: Unknown surface or a parameter a piece does not take
- **WHEN** `countBadge` gets `surface: "sepia"`, `pipe` gets `surface: "dark"`, or `ledgerMark` gets `inkScale: 2`
- **THEN** the first throws a `RangeError` naming `surface` and listing `light, dark`; the other two name `surface` and `inkScale` as unknown parameters

### Requirement: Diagram nodes
`nodeBlock`, `pillNode` and `hexNode` SHALL draw a box, a pill or a hexagon with `title` and an optional `subtitle` in the states `normal`, `focus` (face `color.caller`, ink text) and `placeholder` (dashed `5 4` in `surface.muted`, no fill, no shadow). A placeholder's title is centred when it has no subtitle; with one, both follow `stackledger-map-and-link-pieces` design §4. Width is at least twice the height; `nodeBlock.radius` is at most height / 2.

#### Scenario: Default state
- **WHEN** `nodeBlock` is called without `state`
- **THEN** it draws the `normal` sticker: face `#FFFFFF` on the light surface

#### Scenario: Node radius out of range
- **WHEN** `nodeBlock` gets `radius: -1` or `radius: 24` with height 46
- **THEN** each call throws a `RangeError` naming `radius`

#### Scenario: Focus node on dark
- **WHEN** `nodeBlock` is drawn with `state: "focus"` and `surface: "dark"`
- **THEN** its face has fill `#8FB2FF` and its title fill `#0A1033`

#### Scenario: Placeholder
- **WHEN** `hexNode` is drawn with `state: "placeholder"` and `title: "Nothing"`
- **THEN** its body is one `polygon` with `fill` none and `stroke-dasharray` `5 4`, and its only text is `Nothing`, centred

#### Scenario: Placeholder with a subtitle
- **WHEN** `nodeBlock({ x: 10, y: 10, width: 200, title: "Stripe", subtitle: "external service", state: "placeholder" })` is called
- **THEN** its body is the one dashed rect, and its text is `Stripe` at (22, 30), bold, font-size 13, then `external service` at (22, 47), weight 400, font-size 11, both filled `#5B6694` with start anchor

#### Scenario: Node too narrow, without a title, or a placeholder with a subtitle
- **WHEN** `pillNode` gets `width: 80` with height 46, or `title: ""`, or `state: "placeholder"` with an empty `subtitle: ""`; and then `state: "placeholder"` with `subtitle: "agent"`
- **THEN** the first three calls throw a `RangeError` naming `width`, `title` or `subtitle`; the last one draws (a placeholder's subtitle is no longer refused)

### Requirement: Ledger mark
`ledgerMark` SHALL draw the 32-unit mark of `metro-and-diagram-pieces` design §3, "The mark", in a group translated to (`x`, `y`) and scaled by `size` / 32: an ink square, the bent line in `line` and two white ink-outlined stations, no text. `size` is from 12 to 512. On a surface whose `rimWidth` is above 0, a rim lines the square as in `stackledger-map-and-link-pieces` design §4.

#### Scenario: Favicon size
- **WHEN** `ledgerMark({ x: 0, y: 0 })` is called
- **THEN** its group has transform `translate(0 0) scale(1)` and holds the `rect` 32 × 32 with radius 7 and fill `#0A1033`, the `path` `M7 23 L14 16 L25 16` with stroke `#1E6FEB` and width 4.5, and circles at (14, 16) r 4 and (25, 16) r 2.6

#### Scenario: Scaled and too small
- **WHEN** `ledgerMark` gets `size: 16`, and then `size: 8`
- **THEN** the first group has `scale(0.5)` with the same children; the second throws a `RangeError` naming `size`

#### Scenario: Mark on a dark surface
- **WHEN** `ledgerMark({ x: 0, y: 0, surface: "dark" })` is called
- **THEN** its group holds a rect (0, 0) 32 × 32 radius 7 fill `#EEF2FF`, then the ink rect (2, 2) 28 × 28 radius 5, then the same path and circles as "Favicon size"

#### Scenario: Unknown surface on the mark
- **WHEN** `ledgerMark` gets `surface: "navy"`
- **THEN** it throws a `RangeError` naming `surface` and listing `light, dark`

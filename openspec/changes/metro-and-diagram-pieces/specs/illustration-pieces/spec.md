## MODIFIED Requirements

### Requirement: Colours only from tokens
Pieces SHALL take every colour from the generated tokens; `src/pieces/` holds no colour literal (`#` with three or six hex digits, `rgb(`, `hsl(`). A colour parameter SHALL be a token path of type `color`, such as `color.healthy`; any other value is rejected. Only `pipe.fill` and `lineBadge.fill` are data colours: they also accept `#RRGGBB` (see "Line colours from data").

#### Scenario: Source without literals
- **WHEN** the no-colour-literals test scans `src/pieces/`
- **THEN** it finds nothing

#### Scenario: Hex passed as a colour
- **WHEN** `pill` is called with `fill: "#FFFFFF"` or `fill: "outline.block"`
- **THEN** it throws a `RangeError` naming `fill` and saying a colour token path is expected

### Requirement: Piece catalogue
The library SHALL export these pieces, with the anchors, parameters and defaults of the `illustration-pieces` design §4 and the `metro-and-diagram-pieces` design §3: pill, rings, sheet, blockArrow, arcArrow, rail, checkBadge, priceTag, nameTag, codePanel, serverStack, cloud, stamp, robot, magnifier, gear, parcel, road, milestonePin, browserWindow, speechBubble, steps, folder, book, muleFlow, eipIcon, lineBadge, stationMarker, pipe, countBadge, nodeBlock, pillNode, hexNode, messageArrow, ledgerMark.

#### Scenario: Every piece draws with its defaults
- **WHEN** the catalogue test calls each of the 35 pieces with only its required parameters
- **THEN** each returns a non-empty `body`, valid tags only, and colours that are token values

#### Scenario: Catalogue sheet
- **WHEN** `npm run pieces:sheet -- --out <file.svg>` runs
- **THEN** it writes one SVG with every piece once, labelled with its name in the mono font, and prints `wrote <file>`

## ADDED Requirements

### Requirement: Ink sticker on a surface
`lineBadge` (unless flat), `stationMarker`, `countBadge`, `nodeBlock`, `pillNode` and `hexNode` (unless placeholder) SHALL draw a sticker: a copy moved by `map.shadow` × `inkScale` in `surface.shadow`, stroked `map.outline` plus twice `rimWidth`, both × `inkScale`; when `rimWidth` > 0, the shape in `surface.rim` at that width; then the face, outlined in `color.ink` at `map.outline` × `inkScale`. `surface` is `light` (default) or `dark`.

#### Scenario: Light sticker
- **WHEN** `stationMarker({ cx: 100, cy: 50 })` is called
- **THEN** its body is two circles of radius 12: the first at (103.5, 53.5) with fill and stroke `#0A1033` and stroke-width 3, the second at (100, 50) with fill `#FFFFFF`, stroke `#0A1033` and stroke-width 3

#### Scenario: Dark sticker with its rim
- **WHEN** `stationMarker({ cx: 100, cy: 50, surface: "dark" })` is called
- **THEN** its body is three circles: the shadow in `#4C5CB8` with stroke-width 5, the rim in `#EEF2FF` with stroke-width 5 at (100, 50), then the white face with stroke-width 3

#### Scenario: Ink scale and its bounds
- **WHEN** `nodeBlock` is drawn with `inkScale: 1.6`, and then with `inkScale: 0.1` and `inkScale: 9`
- **THEN** the first has outline 4.8 and its shadow moved by 5.6; the other two throw a `RangeError` naming `inkScale`

#### Scenario: Unknown surface
- **WHEN** `countBadge` gets `surface: "sepia"`
- **THEN** it throws a `RangeError` naming `surface` and listing `light, dark`

### Requirement: Line colours from data
`pipe.fill` and `lineBadge.fill` SHALL accept a colour token path or a data colour matching `^#[0-9A-Fa-f]{6}$`, drawn as given. Any other string is rejected. A cover spec still rejects every colour literal, data colours included.

#### Scenario: Catalogue line colour
- **WHEN** `pipe({ d: "M0,0 L100,0", fill: "#7B3FE4" })` is called
- **THEN** its second path has `stroke` `#7B3FE4` and stroke-width 12, over an ink path of stroke-width 18

#### Scenario: Not a data colour
- **WHEN** `lineBadge` gets `fill: "#7B3FE4; onload"`, `fill: "red"` or `fill: "url(#x)"`
- **THEN** each call throws a `RangeError` naming `fill`

#### Scenario: Data colour in a cover spec
- **WHEN** a cover spec has a `pipe` with `fill: "#7B3FE4"`
- **THEN** the cover command reports `pieces[i].fill` as a colour literal and writes nothing

### Requirement: Metro pieces
`lineBadge`, `stationMarker`, `pipe` and `countBadge` SHALL draw as in `metro-and-diagram-pieces` design §3. `lineBadge` `flat` keeps the outline inside its box and draws no shadow or rim. `stationMarker` with `to` draws one capsule from (cx, cy) to `to` with radius `r`, and `deprecated` fills it with `surface.muted`. `countBadge` is a disc for one character and a pill otherwise.

#### Scenario: Interchange capsule
- **WHEN** `stationMarker({ cx: 0, cy: 0, to: [40, 0] })` is called
- **THEN** its face is a `path` whose points lie within 14 of the segment from (0, 0) to (40, 0), and no `circle`

#### Scenario: Flat badge
- **WHEN** `lineBadge({ x: 50, y: 20, text: "SH", fill: "color.healthy", flat: true })` is called
- **THEN** its body is one `rect` of height 17 inset by 1.5, and its text node is `SH` in `#FFFFFF`

#### Scenario: Badge narrower than tall
- **WHEN** `lineBadge` gets `width: 10` with the default height 20
- **THEN** it throws a `RangeError` naming `width`

#### Scenario: Count of one and of many
- **WHEN** `countBadge` is drawn with `text: "3"` and with `text: "12"`
- **THEN** the first face is 16 wide and 16 high, the second wider than 16 with radius 8

### Requirement: Diagram nodes
`nodeBlock`, `pillNode` and `hexNode` SHALL draw a box, a pill or a hexagon with `title` and an optional `subtitle` in the states `normal`, `focus` (face `color.caller`, ink text) and `placeholder` (dashed `5 4` in `surface.muted`, no fill, no shadow, title centred, no subtitle). Width is at least twice the height.

#### Scenario: Focus node on dark
- **WHEN** `nodeBlock` is drawn with `state: "focus"` and `surface: "dark"`
- **THEN** its face has fill `#8FB2FF` and its title fill `#0A1033`

#### Scenario: Placeholder
- **WHEN** `hexNode` is drawn with `state: "placeholder"` and `title: "Nothing"`
- **THEN** its body is one `polygon` with `fill` none and `stroke-dasharray` `5 4`, and its only text is `Nothing`, centred

#### Scenario: Node too narrow or without a title
- **WHEN** `pillNode` gets `width: 80` with height 46, or `title: ""`
- **THEN** each call throws a `RangeError` naming `width` or `title`

### Requirement: Message arrow
`messageArrow` SHALL draw a path from `from` to the base of a filled head at `to`, in `surface.text` at `width`. `bezier` leaves and enters horizontally, with both control points at the middle x; `straight` is a line. `head: false` draws no head and ends at `to`. A `label` sits in a pill at the middle. `from` equal to `to` is rejected.

#### Scenario: Curved arrow with a head
- **WHEN** `messageArrow({ from: [0, 0], to: [200, 100] })` is called
- **THEN** its path is `M0,0 C100,0 100,100 …` ending left of x 200 at y 100, and its head is a `polygon` with one point at (200, 100)

#### Scenario: Labelled straight arrow
- **WHEN** `messageArrow` gets `curve: "straight"` and `label: "used by"`
- **THEN** its text holds `used by` once, at the middle of the segment

#### Scenario: Zero-length arrow
- **WHEN** `from` and `to` are both `[10, 10]`
- **THEN** it throws a `RangeError` naming `to`

### Requirement: Ledger mark
`ledgerMark` SHALL draw stackledger's mark in a `size` square at (`x`, `y`): a rounded ink square, a bent line in `line` (`illustration.accent` by default) and two white stations outlined in ink, scaled from a 32-unit drawing. `size` is from 12 to 512.

#### Scenario: Favicon size
- **WHEN** `ledgerMark({ x: 0, y: 0 })` is called
- **THEN** its first shape is a `rect` 32 × 32 with radius 7 and fill `#0A1033`, and it draws no text

#### Scenario: Mark too small
- **WHEN** `ledgerMark` gets `size: 8`
- **THEN** it throws a `RangeError` naming `size`

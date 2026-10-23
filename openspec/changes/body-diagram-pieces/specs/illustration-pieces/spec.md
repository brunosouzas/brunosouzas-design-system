## MODIFIED Requirements

### Requirement: SVG node tree
A piece SHALL return `{ body, text }`, two arrays of SVG nodes (`tag`, `attrs`, `children`), where `body` holds shapes and `text` holds words and glyphs. Tags are limited to `svg`, `g`, `title`, `desc`, `defs`, `clipPath`, `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon`, `path`, `text`, `tspan`. A `tspan` appears only as a child of a `text` node. Attribute values are strings or finite numbers.

#### Scenario: Shapes and words apart
- **WHEN** `pill({ x: 132, y: 174, text: "request" })` is called
- **THEN** its `body` holds one `rect` of height 36 and its `text` holds one `text` node whose only child is `request`

#### Scenario: Non-finite number
- **WHEN** a piece is called with `x: NaN` or `width: Infinity`
- **THEN** it throws a `RangeError` naming the parameter

### Requirement: Piece catalogue
The library SHALL export 51 pieces with the parameters and defaults of their designs, in this order: the 26 cover pieces of `illustration-pieces` §4, the nine metro and diagram pieces of `metro-and-diagram-pieces` §3, the six map and icon pieces of `stackledger-map-and-link-pieces` §3, and the ten body diagram pieces of `body-diagram-pieces` §3.

#### Scenario: Every piece draws with its defaults
- **WHEN** the catalogue test calls each of the 51 pieces with only its required parameters
- **THEN** each returns a non-empty `body` or `text`, valid tags only, and colours that are token values

#### Scenario: Catalogue sheet
- **WHEN** `npm run pieces:sheet -- --out <file.svg>` runs
- **THEN** it writes one SVG with every piece once, labelled with its name in the mono font, and prints `wrote <file>`

### Requirement: Ink sticker on a surface
`lineBadge` (unless flat), `stationMarker`, `countBadge`, `licenceMark`, the three nodes (unless placeholder), the five diagram shapes (`diagramBox`, `decisionNode`, `storeNode`, `queueNode`, `exchangeNode`), `taggedContainer` (frame and tab) and `phaseBand` SHALL draw the sticker of `metro-and-diagram-pieces` design §3: a shadow copy moved by `map.shadow` × `inkScale` in `surface.shadow`, a rim in `surface.rim` when `rimWidth` > 0, then the face outlined in `color.ink`. `surface` is `light` (default) or `dark`; `inkScale` is 0.25 to 8; `pipe` takes neither; `ledgerMark`, `lifeline`, `altFrame` and `edgeLabel` take only `surface`.

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
- **WHEN** `countBadge` gets `surface: "sepia"`, `pipe` gets `surface: "dark"`, `ledgerMark` gets `inkScale: 2`, or `lifeline` gets `inkScale: 2`
- **THEN** the first throws a `RangeError` naming `surface` and listing `light, dark`; the others name `surface`, `inkScale` and `inkScale` as unknown parameters

#### Scenario: Dark diagram box
- **WHEN** `diagramBox({ x: 0, y: 0, width: 120, text: ["Sender"], shape: "pill", surface: "dark" })` is called
- **THEN** its body is three rects of 120 × 46 with `rx` 23: the shadow at (3.5, 3.5) in `#4C5CB8` with stroke-width 5, the rim at (0, 0) in `#EEF2FF` with stroke-width 5, and the face `#1C2D74` with stroke `#0A1033` and stroke-width 3; its word `Sender` is at (60, 27.5) in `#EEF2FF`

### Requirement: Room for the outline
The smallest dimension of an outlined shape (`height` of a `lineBadge`, flat or not, of a `countBadge`, of a `normal` or `focus` node, of a `queueNode`, an `exchangeNode` and a `phaseBand`; the smaller of `width` and `height` of a `diagramBox`, a `decisionNode`, a `storeNode` and a `taggedContainer`; `2 × r` of a `stationMarker`) SHALL be at least 4 × `map.outline` × `inkScale`; a smaller one throws a `RangeError` naming `height` or `r`, equality accepted. A `placeholder` node is exempt: it draws no ink.

#### Scenario: Badge too low for its ink
- **WHEN** `lineBadge` gets `flat: true` and `inkScale: 8` with the default height 20, and then `height: 96`, `width: 120` and `inkScale: 8`
- **THEN** the first throws a `RangeError` naming `height`; the second draws a rect 96 wide and 72 high, inset by 12

#### Scenario: Placeholder without ink
- **WHEN** `nodeBlock` is drawn with `state: "placeholder"`, `height: 20`, `width: 40` and `inkScale: 8`
- **THEN** it draws the dashed box without an error

#### Scenario: Diagram box too low
- **WHEN** `diagramBox` gets `height: 10`, and then `height: 12`, each with `width: 120` and `text: ["a"]`
- **THEN** the first throws a `RangeError` naming `height` and saying it needs at least 12; the second draws

### Requirement: Message arrow
`messageArrow` SHALL draw as in `metro-and-diagram-pieces` design §3, "The arrow": a path to the base of a head of length 5 × `width` at `to`, in `surface.text` or the colour of its `kind` ("Message arrow kinds"); `bezier` leaves and enters horizontally, and falls back to `straight` when the horizontal distance is at most twice the head; `controls` gives its own curve ("Message arrow through control points"); `head: false` ends at `to`; a `label` sits in a pill at the middle.

#### Scenario: Curved arrow with a head
- **WHEN** `messageArrow({ from: [0, 0], to: [200, 100] })` is called
- **THEN** its path `d` is `M0,0 C100,0 100,100 187.5,100` and its head is the polygon (200, 100), (187.5, 105), (187.5, 95)

#### Scenario: Vertical arrow and the fallback boundary
- **WHEN** `messageArrow` goes from `[0, 0]` to `[0, 100]`, and from `[0, 0]` to `[25, 100]` (horizontal distance exactly 2 × 12.5)
- **THEN** both are drawn straight: the first path ends at (0, 87.5) with the head pointing down to (0, 100); the second's head points along the segment

#### Scenario: Labelled straight arrow
- **WHEN** `messageArrow` gets `from: [0, 0]`, `to: [100, 0]`, `curve: "straight"` and `label: "used by"`
- **THEN** its text holds `used by` once, at (50, 4), in a rect of height 18 centred on (50, 0)

#### Scenario: Arrow too short
- **WHEN** `from` and `to` are both `[10, 10]`, or 20 apart with the default head
- **THEN** each call throws a `RangeError` naming `to`

### Requirement: New pieces carry their own stroke
Every shape a new piece draws (`renewalRing`, `suggestedHalo`, `licenceMark`, `zone`, `uiIcon`, `linkIcon`, the dark `ledgerMark` rim, and the ten body diagram pieces) SHALL carry its own `stroke`, or sit in a group of the piece that sets one, so it draws the same inside the cover command's outlined group (`stroke` ink, width 4) as on its own.

#### Scenario: Inside the outlined group
- **WHEN** the test walks each new piece's body, drawn with its required parameters on light and dark, plus `zone` with one, two and three points, `altFrame` with a condition and one section, and `edgeLabel` with `backdrop: true`
- **THEN** every `circle`, `ellipse`, `rect`, `line`, `polyline`, `polygon` and `path` has a `stroke` attribute or an ancestor `g` inside the piece's body that has one

## ADDED Requirements

### Requirement: Diagram shapes
`diagramBox`, `decisionNode`, `storeNode`, `queueNode` and `exchangeNode` SHALL take the parameters and draw the geometry of `body-diagram-pieces` design §3, from the top-left `x`, `y`: a box or pill, a diamond, a cylinder with its lid, a box with two rails, and a hexagon with points 0.26 × height in.

#### Scenario: Default diagram box
- **WHEN** `diagramBox({ x: 0, y: 0, width: 120, text: ["Orders API"] })` is called
- **THEN** its body is two rects of 120 × 46 with `rx` 10: the shadow at (3.5, 3.5) with fill and stroke `#0A1033`, and the face at (0, 0) with fill `#FFFFFF`, stroke `#0A1033` and stroke-width 3; its text is one node `Orders API` at (60, 27.5), `#0A1033`, size 13, weight 700, anchor `middle`

#### Scenario: Diamond
- **WHEN** `decisionNode({ x: 0, y: 0, width: 200, height: 100, text: ["Seen before?"] })` is called
- **THEN** its face polygon has points `100,0 200,50 100,100 0,50`, its shadow `103.5,3.5 203.5,53.5 103.5,103.5 3.5,53.5`, and its word is at (100, 54.5)

#### Scenario: Cylinder
- **WHEN** `storeNode({ x: 0, y: 0, width: 100, height: 60, text: ["IDs"] })` is called
- **THEN** its body is the shadow path `M3.5,11.5 A50,8 0 0 1 103.5,11.5 V55.5 A50,8 0 0 1 3.5,55.5 Z`, the face path `M0,8 A50,8 0 0 1 100,8 V52 A50,8 0 0 1 0,52 Z` and the lid `M0,8 A50,8 0 0 0 100,8` with fill `none`, stroke `#0A1033` and stroke-width 2.25; its word is at (50, 38.5)

#### Scenario: Queue
- **WHEN** `queueNode({ x: 0, y: 0, width: 100, text: ["orders"] })` is called
- **THEN** its two rects are 100 × 46 with `rx` 6, and its last body node is the path `M10,0 V46 M90,0 V46` with fill `none`, stroke `#0A1033` and stroke-width 2.25

#### Scenario: Exchange
- **WHEN** `exchangeNode({ x: 0, y: 0, width: 120, text: ["exchange"] })` is called
- **THEN** its face polygon has points `11.96,0 108.04,0 120,23 108.04,46 11.96,46 0,23`

#### Scenario: Shape limits
- **WHEN** `diagramBox` gets `radius: 30` with the default height, `storeNode` gets `ry: 20` with `height: 60`, `queueNode` gets `width: 40`, `diagramBox` gets four lines of text, and `diagramBox` gets `text: ["a", ""]`
- **THEN** each throws a `RangeError` naming `radius`, `ry`, `width`, `text` and `text[1]`

### Requirement: Diagram words
The words of the diagram shapes SHALL be centred lines as in `body-diagram-pieces` design §3: line step `textSize` × 1.25, an optional subtitle 15 below the last line at size 11, weight 400. Without `fill` the face is `surface.panel`, the lines `surface.text` and the subtitle `surface.muted`; with `fill` the face is that colour token and every word `color.ink`.

#### Scenario: Two lines and a subtitle on a fill
- **WHEN** `diagramBox({ x: 0, y: 0, width: 200, height: 70, text: ["Payment", "consumer"], subtitle: "Idempotent Receiver", fill: "color.healthy" })` is called
- **THEN** the face is `#3DDC84`, and its text is `Payment` at (100, 23.88), `consumer` at (100, 40.13), both size 13, and `Idempotent Receiver` at (100, 55.13), size 11, all three `#0A1033`

#### Scenario: Smaller text
- **WHEN** `diagramBox({ x: 0, y: 0, width: 160, height: 26, text: ["a note"], textSize: 11, radius: 6, fill: "color.transitional" })` is called
- **THEN** its word is at (80, 16.81), size 11, and its face is `#FFD25A` with `rx` 6

### Requirement: Code in words
In every text parameter of the ten body diagram pieces, a string with an even number of backticks SHALL be drawn as a `text` node whose children are the plain parts as strings and each part between backticks as a `tspan` with only `font-family` `font.mono`; empty parts are dropped and the backticks are not drawn. A string with an odd number of backticks is drawn as is. Other pieces' words are unchanged.

#### Scenario: A code run inside a label
- **WHEN** ``edgeLabel({ x: 0, y: 0, lines: ["adopts a `correlationId`"] })`` is called
- **THEN** its text node's children are `adopts a ` and a `tspan` whose `font-family` is `ui-monospace, 'SF Mono', Menlo, Consolas, monospace` holding `correlationId`

#### Scenario: Only code, and an odd backtick
- **WHEN** `edgeLabel` gets ``lines: ["`200 OK`"]``, and then ``lines: ["a `b"]``
- **THEN** the first text node's only child is a `tspan` holding `200 OK`; the second's only child is the string ``a `b``

#### Scenario: Code through both renderers
- **WHEN** ``diagramBox({ x: 0, y: 0, width: 200, text: ["adopts a `correlationId`"] })`` is written with `toSvg` and with `toReact`
- **THEN** `toSvg` writes the text node with its `tspan` on one line, and both outputs have the same normal form

#### Scenario: Message arrow label stays plain
- **WHEN** `messageArrow` gets ``label: "`x`"``
- **THEN** its text node's only child is the string `` `x` ``

### Requirement: Tagged container
`taggedContainer` SHALL draw a frame sticker with `rx` `map.nodeRadius` and a tab sticker at (x + 14, y − 12), `tagWidth` × 24 with `rx` 12, in `tagFill` (default `color.transitional`), with the `tag` word in `color.ink`, bold, size `map.badgeTextSize`, centred on the tab. `tagWidth` defaults to 7.2 × characters + 24. A width below `tagWidth` + 28 is rejected naming `width`.

#### Scenario: Container with its tab
- **WHEN** `taggedContainer({ x: 0, y: 0, width: 300, height: 120, tag: "Anypoint MQ" })` is called
- **THEN** its body is the frame's shadow and face (300 × 120, `rx` 10, the face `#FFFFFF`), then the tab's shadow at (17.5, −8.5) and face at (14, −12), both 103.2 × 24 with `rx` 12, the face `#FFD25A`; its word is at (65.6, 4.5), size 12, `#0A1033`

#### Scenario: Tag wider than the frame
- **WHEN** `taggedContainer({ x: 0, y: 0, width: 100, height: 120, tag: "Anypoint MQ" })` is called
- **THEN** it throws a `RangeError` naming `width`

### Requirement: Lifeline
`lifeline` SHALL draw one `line` from (x, y1) to (x, y2) in `surface.muted`, width `width` (default 1.75, as given): `active` (default) with dash `5 5` and cap `butt`, `inactive` with dash `1 6` and cap `round`. `y2` equal to `y1` is rejected naming `y2`.

#### Scenario: Active lifeline
- **WHEN** `lifeline({ x: 100, y1: 40, y2: 400 })` is called
- **THEN** its body is one `line` from (100, 40) to (100, 400) with stroke `#5B6694`, stroke-width 1.75, dash `5 5` and cap `butt`, and its text is empty

#### Scenario: Inactive lifeline on dark
- **WHEN** `lifeline({ x: 100, y1: 40, y2: 400, state: "inactive", surface: "dark" })` is called
- **THEN** its line has stroke `#8F9BD0`, dash `1 6` and cap `round`

#### Scenario: Lifeline of no length
- **WHEN** `lifeline({ x: 100, y1: 40, y2: 40 })` is called
- **THEN** it throws a `RangeError` naming `y2`

### Requirement: Phase band
`phaseBand` SHALL draw a pill sticker (`rx` height / 2, default height 26) in the required colour token `fill`, with its `text` in `color.ink`, bold, at (x + width / 2, y + height / 2 + 4.5 × `textSize` / 13), anchor `middle`. A width below the height is rejected naming `width`.

#### Scenario: Band
- **WHEN** `phaseBand({ x: 0, y: 0, width: 400, text: "Circuit CLOSED", fill: "color.healthy" })` is called
- **THEN** its face is a rect 400 × 26 with `rx` 13 and fill `#3DDC84`, and its word is at (200, 17.5), size 13, `#0A1033`

#### Scenario: Band without a fill, or too narrow
- **WHEN** `phaseBand` is called without `fill`, and then with `width: 20`
- **THEN** each throws a `RangeError` naming `fill` and `width`

### Requirement: Alt frame
`altFrame` SHALL draw the frame, one dashed divider per section, and a head (tag, then the optional condition on a backdrop) for the frame and for each section, as in `body-diagram-pieces` design §3, all in the surface's colours. A section whose `y` is not strictly inside the frame is rejected naming `sections[<i>].y`.

#### Scenario: Frame with one section
- **WHEN** `altFrame({ x: 0, y: 0, width: 300, height: 200, tag: "alt", condition: "[found]", sections: [{ y: 120, tag: "else", condition: "[not found]" }] })` is called
- **THEN** its body is the rect 300 × 200 (`rx` 7, fill `none`, stroke `#0A1033`, width 1.75); the `line` from (0, 120) to (300, 120) with stroke-width 1.4 and dash `4 4`; the tag rect at (7, 6), 33.2 × 17, fill `#0A1033`; the condition backdrop at (42.2, 7.5), 51.4 × 14, fill `#EEF2FF`; the tag rect at (7, 126), 39.6 × 17; and the backdrop at (48.6, 127.5), 76.2 × 14. Its text is `alt` at (23.6, 18.5) in `#FFFFFF`, size 10, weight 900; `[found]` at (46.2, 18.5); `else` at (26.8, 138.5); `[not found]` at (52.6, 138.5)

#### Scenario: Section outside the frame
- **WHEN** `altFrame` gets `y: 0`, `height: 200` and `sections: [{ y: 200, tag: "else" }]`
- **THEN** it throws a `RangeError` naming `sections[0].y`

### Requirement: Edge label
`edgeLabel` SHALL draw its 1 to 4 `lines` from the baseline (x, y) down by 13 × `textSize` / 11 per line, in `surface.text`, bold, size `textSize` (default 11), with the `anchor` (default `middle`); with `backdrop`, a rect per line in `surface.background` behind it, of width `width` or the estimate of design §3.

#### Scenario: Two lines on a backdrop
- **WHEN** `edgeLabel({ x: 100, y: 50, lines: ["request", "X-ID"], backdrop: true })` is called
- **THEN** its body is a rect at (74.3, 40), 51.4 × 14, and a rect at (83.6, 53), 32.8 × 14, both `rx` 3, fill `#EEF2FF`, stroke `none`; its text is `request` at (100, 50) and `X-ID` at (100, 63), both size 11, weight 700, anchor `middle`

#### Scenario: Anchored at the end with a measured width
- **WHEN** `edgeLabel({ x: 100, y: 50, lines: ["delivery 1"], anchor: "end", backdrop: true, width: 80 })` is called
- **THEN** its backdrop is at (24, 40), 80 × 14, and its word has anchor `end`

#### Scenario: Backticks do not count in the estimate
- **WHEN** ``edgeLabel({ x: 0, y: 0, lines: ["`200 OK`"], backdrop: true })`` is called
- **THEN** its backdrop is 45.2 wide, at (−22.6, −10)

#### Scenario: Too many lines
- **WHEN** `edgeLabel` gets five lines
- **THEN** it throws a `RangeError` naming `lines`

### Requirement: Message arrow kinds
`messageArrow` SHALL take `kind`: `message` (default) and `reply` paint `surface.text`, `failure` paints `color.failure`, `failFast` paints `color.failFast`; the path's stroke and the head's fill and stroke take that paint. `reply`, `failure` and `failFast` add `stroke-dasharray` `2.4 × width` `3.2 × width` as the path's last attribute. The label keeps `surface.text`.

#### Scenario: Reply
- **WHEN** `messageArrow({ from: [0, 0], to: [100, 0], curve: "straight", kind: "reply" })` is called
- **THEN** its path is `M0,0 L87.5,0` with stroke `#0A1033`, stroke-width 2.5, cap `round` and dash `6 8`, and its head is the polygon `100,0 87.5,5 87.5,-5` in `#0A1033`

#### Scenario: Failure and fail-fast
- **WHEN** the same call is made with `kind: "failure"`, and with `kind: "failFast"` and `surface: "dark"`
- **THEN** the first's path and head are `#E04848`, the second's `#E0661F`, both with dash `6 8`

#### Scenario: Message kind is the 0.3.1 drawing
- **WHEN** each call of `test/fixtures/message-arrow-0.3.1.json` is made again with `kind: "message"` added
- **THEN** its tree is deep-equal to the frozen one

### Requirement: Message arrow through control points
`messageArrow` SHALL take `controls`, exactly two points: the path is `M from C c1 c2 end`, `end` the base of the head, and the head points from the last of `c2`, `c1`, `from` that differs from `to`. `controls` with `curve` is rejected naming `controls`.

#### Scenario: Vertical curve
- **WHEN** `messageArrow({ from: [0, 0], to: [100, 100], controls: [[0, 50], [100, 50]] })` is called
- **THEN** its path `d` is `M0,0 C0,50 100,50 100,87.5` and its head is the polygon `100,100 95,87.5 105,87.5`

#### Scenario: Last control point on the end
- **WHEN** `controls` is `[[0, 50], [100, 100]]` with the same ends
- **THEN** its path `d` is `M0,0 C0,50 100,100 88.82,94.41` and its head is the polygon `100,100 86.58,98.88 91.06,89.94`

#### Scenario: Controls with a curve, or three points
- **WHEN** `controls` comes with `curve: "bezier"`, or holds three points
- **THEN** each call throws a `RangeError` naming `controls`

### Requirement: Message arrow calls of 0.3.1 unchanged
Every `messageArrow` call valid in 0.3.1 SHALL draw the same tree and the same `toSvg` bytes as in 0.3.1.

#### Scenario: Frozen 0.3.1 arrow calls
- **WHEN** the test re-calls the fixture `test/fixtures/message-arrow-0.3.1.json`, written on `origin/main` (`b0712a9`) before any code, with the eight calls of `body-diagram-pieces` design §5
- **THEN** each tree deep-equals its frozen tree and its `toSvg` output equals its frozen string

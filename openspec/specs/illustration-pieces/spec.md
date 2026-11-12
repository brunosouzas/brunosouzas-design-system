# illustration-pieces Specification

## Purpose
Draws the blog's recurring illustration objects once, as pure TypeScript pieces that return SVG node trees from the tokens, so covers, body diagrams and Remotion scenes share one drawing instead of copies that drift.

## Requirements

### Requirement: SVG node tree
A piece SHALL return `{ body, text }`, two arrays of SVG nodes (`tag`, `attrs`, `children`), where `body` holds shapes and `text` holds words and glyphs. Tags are limited to `svg`, `g`, `title`, `desc`, `defs`, `clipPath`, `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon`, `path`, `text`, `tspan`. A `tspan` appears only as a child of a `text` node. Attribute values are strings or finite numbers.

#### Scenario: Shapes and words apart
- **WHEN** `pill({ x: 132, y: 174, text: "request" })` is called
- **THEN** its `body` holds one `rect` of height 36 and its `text` holds one `text` node whose only child is `request`

#### Scenario: Non-finite number
- **WHEN** a piece is called with `x: NaN` or `width: Infinity`
- **THEN** it throws a `RangeError` naming the parameter

### Requirement: Pure pieces
A piece SHALL depend only on its parameters and the generated tokens: the same parameters give deep-equal output, calls in any order give the same results, and no piece module imports `node:fs`, `node:path` or anything that reads files or the clock.

#### Scenario: Same parameters, same tree
- **WHEN** `robot({ cx: 400, top: 140 })` is called twice, with other pieces called in between
- **THEN** both results are deep-equal

#### Scenario: No file access in piece modules
- **WHEN** the test scans `src/pieces/` for imports
- **THEN** no file imports a `node:` module

### Requirement: Colours only from tokens
Pieces SHALL take every colour from the generated tokens; `src/pieces/` holds no colour literal (`#` with three or six hex digits, `rgb(`, `hsl(`). A colour parameter SHALL be a token path of type `color`, such as `color.state.healthy`; any other value is rejected. Only `pipe.fill`, `lineBadge.fill` and `zone.fill` are data colours: they also accept `#RRGGBB` (see "Line colours from data"). Only `uiIcon.colour` also accepts `currentColor` (see "Current colour on UI icons").

#### Scenario: Source without literals
- **WHEN** the no-colour-literals test scans `src/pieces/`
- **THEN** it finds nothing

#### Scenario: Hex passed as a colour
- **WHEN** `pill` is called with `fill: "#FFFFFF"` or `fill: "outline.block"`
- **THEN** it throws a `RangeError` naming `fill` and saying a colour token path is expected

#### Scenario: Current colour elsewhere
- **WHEN** `pill` is called with `fill: "currentColor"`, or `lineBadge` with `fill: "currentColor"`
- **THEN** each call throws a `RangeError` naming `fill`

#### Scenario: Removed top-level state path
- **WHEN** `pill` is called with `fill: "color.healthy"`
- **THEN** it throws a `RangeError` naming `fill`, `color.healthy` being no longer a token path

### Requirement: SVG renderer
`toSvg(node)` SHALL write the tree as SVG text: two-space indent per level (a `text` node, and any node holding a string child, is written inline with its whole subtree, so no whitespace is added to its text), attributes in insertion order, numbers through `String`, `&`, `<`, `>` and `"` escaped in text and attribute values, LF line ends. The same tree gives the same string.

#### Scenario: Escaping
- **WHEN** a `text` node holds `a < b & "c"`
- **THEN** the output holds `a &lt; b &amp; &quot;c&quot;`

#### Scenario: Mixed text content
- **WHEN** a `text` node holds `a`, a `title` node and `b`, inside an `svg`
- **THEN** `toSvg` writes `<text>a<title>tooltip</title>b</text>` on one line, and the React path matches it

#### Scenario: Deterministic text
- **WHEN** the same cover tree is rendered twice
- **THEN** both strings are byte-identical

#### Scenario: Text holding only a tspan
- **WHEN** `toSvg` writes the text node of ``edgeLabel({ x: 0, y: 0, lines: ["`200 OK`"] })``
- **THEN** the output is exactly `<text x="0" y="0" font-family="'Source Sans 3', 'Helvetica Neue', Helvetica, Arial, sans-serif" fill="#121212" font-size="11" font-weight="700" text-anchor="middle"><tspan font-family="'Source Code Pro', ui-monospace, 'SF Mono', Menlo, Consolas, monospace">200 OK</tspan></text>`

### Requirement: React renderer
`toReact(node)` SHALL return React elements for the same tree, renaming hyphenated attributes to React's names (`stroke-width` to `strokeWidth`, `clip-path` to `clipPath`) and keeping `aria-*`, `xmlns` and `viewBox`. `renderToStaticMarkup` of the result and `toSvg` of the tree SHALL describe the same elements, attributes and text in the same order.

#### Scenario: Same drawing through React
- **WHEN** each proof cover fixture's tree is rendered by `toSvg` and by `renderToStaticMarkup(toReact(tree))`
- **THEN** both parse to the same normal form (tag, attribute names and values, text, order)

#### Scenario: Unknown hyphenated attribute
- **WHEN** a node has an attribute `data-piece`
- **THEN** React receives `data-piece` unchanged and the normal forms still match

### Requirement: Animation by parameter
`pose(node, params)` SHALL wrap a node in a `g` with transform `translate(x+shake y-hop) rotate(tilt) scale(scale/√squash scale·squash) translate(-x -y)` and `opacity` when below 1. `x` and `y` are required; defaults: tilt 0, squash 1, hop 0, scale 1, shake 0, opacity 1. With all defaults it returns the node unchanged.

#### Scenario: Squash keeps the base
- **WHEN** a robot is posed at `x` 400, `y` 300 with `squash` 1.21
- **THEN** the transform is `translate(400 300) rotate(0) scale(0.9090909090909091 1.21) translate(-400 -300)`

#### Scenario: Identity
- **WHEN** `pose` is called with only `x` and `y`
- **THEN** it returns the same node object

### Requirement: Pose parameters checked
Every `pose` parameter SHALL be a finite number; `squash` and `scale` SHALL be greater than 0 and `opacity` within 0 and 1. Otherwise `pose` throws a `RangeError` naming the first offending parameter in the order x, y, tilt, squash, hop, scale, shake, opacity.

#### Scenario: Impossible values
- **WHEN** `pose` gets `squash: 0`, `scale: -1` or `opacity: 1.5`
- **THEN** it throws a `RangeError` naming that parameter

#### Scenario: Non-finite values
- **WHEN** `pose` gets `scale: Infinity`; `tilt: NaN` with `hop: Infinity`; or `squash: 0` with `hop: Infinity`
- **THEN** it throws a `RangeError` naming `scale`, then `tilt`, then `squash`

### Requirement: Frame by frame
A scene SHALL be able to recompute a piece and its pose for every frame from frame-derived numbers, and the React path SHALL match the SVG path at every frame.

#### Scenario: Hop over twenty frames
- **WHEN** a test poses a robot with `hop = 28·sin(π·f/12)` for frames 0 to 19 and renders each frame both ways
- **THEN** the normal forms match at every frame, each transform carries `translate(400 300−hop)`, and at frame 6 it is `translate(400 272)`

### Requirement: Piece catalogue
The library SHALL export 67 pieces with the parameters and defaults of their designs, in order: the 26 cover pieces of `illustration-pieces` §4, the nine of `metro-and-diagram-pieces` §3, the six of `stackledger-map-and-link-pieces` §3, the ten of `body-diagram-pieces` §3, `stateStart`, `emote`, `mira`, `visor`, `drone`, `kiu`, `sinal`, `bankObject`, `symbol`, `brandNotationIcon`, `categoryIcon`, `headline`, `questionToken`, `balao`, `chaves` and `keyboard`.

#### Scenario: Every piece draws with its defaults
- **WHEN** the catalogue test calls each of the 67 pieces with only its required parameters
- **THEN** each returns valid tags only and colours that are token values; every piece except `edgeLabel` and `headline` returns a non-empty `body`, and those two return an empty `body` and a non-empty `text`

#### Scenario: Catalogue sheet
- **WHEN** `npm run pieces:sheet -- --out <file.svg>` runs
- **THEN** it writes one SVG with every piece once, labelled with its name in the mono font, and prints `wrote <file>`

#### Scenario: Seven-role cast gone
- **WHEN** the test reads the package root's exports and `PIECE_NAMES`
- **THEN** `mascot`, `MASCOTS`, `MASCOT_ACTIONS` and `MASCOT_FACES` are absent, while `emote` and `EMOTE_KINDS` are exported

#### Scenario: Question token in the catalogue
- **GIVEN** the package root's exports
- **WHEN** the test reads `PIECE_NAMES` and `PIECES`
- **THEN** `questionToken` is the 64th of the 67 names, after `headline`, and `PIECES.questionToken` is the exported `questionToken`

#### Scenario: Supporting cast in the catalogue
- **GIVEN** the package root's exports
- **WHEN** the test reads `PIECE_NAMES` and `PIECES`
- **THEN** `PIECE_NAMES` has 67 names ending with `headline`, `questionToken`, `balao`, `chaves`, `keyboard`, each of the first 64 at its 0.12.0 index, and `PIECES.balao`, `PIECES.chaves` and `PIECES.keyboard` are the exported pieces of those names

### Requirement: Piece parameters checked
Each piece SHALL check its parameters before drawing and throw a `RangeError` naming the first problem: a missing or unknown parameter, a wrong JSON type, a non-finite or out-of-range number, an unknown enum value, or a colour that is not a token path (except "Line colours from data" and "Current colour on UI icons"). Sizes lie within 10000, counts and lists within the designs' limits, sizes leave room for insets; `road.d` and `pipe.d` take only path characters.

#### Scenario: Missing and unknown parameters
- **WHEN** each piece is called without one of its required parameters, and `pill` with an extra `colour`
- **THEN** each call throws a `RangeError` naming the missing parameter, and the `pill` call names `colour`

#### Scenario: Out of range
- **WHEN** `gear` gets `teeth: 3`, `serverStack` gets `units: 1.5`, or `sheet` gets a row with `lead: "star"`
- **THEN** each call throws a `RangeError` naming `teeth`, `units` or `rows[0].lead`

#### Scenario: Sizes that would break the drawing
- **WHEN** `stamp` gets `r: 1`, `browserWindow` gets `width: 20`, or `folder` gets `scale: 1e307`
- **THEN** each call throws a `RangeError` naming `r`, `width` or `scale`

#### Scenario: Smallest and largest accepted sizes draw valid geometry
- **WHEN** each piece is drawn with each bounded size parameter at its smallest and at its largest accepted value, the stickers also at `inkScale` 0.25 and 8
- **THEN** no drawn width, height or radius is negative and no value is infinite or NaN

#### Scenario: Too many repeated parts
- **WHEN** `steps` gets `count: 4294967296`, `gear` gets `teeth: 65`, or `rail` gets 51 nodes
- **THEN** each call throws a `RangeError` naming `count`, `teeth` or `nodes` before drawing

#### Scenario: Road path with something else
- **WHEN** `road` gets `d: "M0,0 L10,10\" onload=\"x"`
- **THEN** it throws a `RangeError` naming `d`

#### Scenario: Pipe path with something else
- **WHEN** `pipe` gets `d: ""`, `d: "L10,10"` or `d: "M0,0 L10,10\" onload=\"x"`
- **THEN** each call throws a `RangeError` naming `d`

### Requirement: Words come from the caller
A piece SHALL draw no word of its own: the only text nodes are the caller's `text`, `word` or label parameters and the glyphs `?` (a question row, on a `sheet` or on the sheet Visor or Chaves holds, and `questionToken`) and the tick path. An empty label is rejected.

#### Scenario: Stamp word
- **WHEN** `stamp` is called with `word: "GO"`
- **THEN** its `text` holds exactly one text node, `GO`

#### Scenario: Empty label
- **WHEN** `pill` is called with `text: ""`
- **THEN** it throws a `RangeError` naming `text`

#### Scenario: The token's only glyph
- **GIVEN** `questionToken({ cx: 0, cy: 0 })`
- **WHEN** the strings of its `text` are listed
- **THEN** the list is exactly `?`

#### Scenario: Visor's words
- **GIVEN** Visor holding a sheet with rows `question`, `checkbox` and `none` and `label: "proposal.md"`
- **WHEN** the strings of its `text` are listed
- **THEN** the list is exactly `?`, `proposal.md`

#### Scenario: Balão's and Chaves's words
- **GIVEN** `balao` with `holdsStamp: { word: "GO" }`, `chaves` with a held sheet whose rows are `question` and `none` and `label: "proposal.md"`, `chaves` with `types: true`, and `keyboard({ x: 0, y: 0 })`
- **WHEN** the strings of their `text` are listed
- **THEN** they are exactly `GO`; `?`, `proposal.md`; nothing; and nothing

### Requirement: EIP icons as data
The library SHALL hold the 26 published EIP icons as data (name, title, description, nodes in a 64x40 box) with token colours, and `eipIcon({ name, x, y, scale })` SHALL place one inside a group with `stroke="none"`. Each icon keeps its CC BY 4.0 credit in its description; an unknown name is rejected.

#### Scenario: The 26 names
- **WHEN** the test lists the icon names
- **THEN** they are the 26 published names, from `aggregator` to `transactional-client`, each with a non-empty title and a description that names Gregor Hohpe and Bobby Woolf and CC BY 4.0

#### Scenario: Icon colours
- **WHEN** the test collects every colour in the icon data
- **THEN** each is the value of `color.ink`, `color.white`, `color.state.healthy`, `color.state.transitional`, `color.state.caller`, `color.state.backend` or `illustration.iconLine`

#### Scenario: Unknown icon
- **WHEN** `eipIcon` is called with `name: "message-bus"`
- **THEN** it throws a `RangeError` naming `name` and listing that the name is not one of the 26

### Requirement: Ink sticker on a surface
`lineBadge` (unless flat), `stationMarker`, `countBadge`, `licenceMark` and the three nodes (unless placeholder) SHALL draw the sticker of `metro-and-diagram-pieces` design §3: a `surface.shadow` copy moved by `map.shadow` × `inkScale` when above 0, a rim in `surface.rim` when `rimWidth` > 0, then the face outlined in ink ("Ink on the dark surface"). `surface` is `light` (default) or `dark`; `inkScale` is 0.25 to 8; `pipe` takes neither, and `ledgerMark` takes only `surface`.

#### Scenario: Light sticker
- **WHEN** `stationMarker({ cx: 100, cy: 50 })` is called
- **THEN** its body is one circle of radius 12 at (100, 50) with fill `#FFFFFF`, stroke `#121212` and stroke-width 3, with no shadow copy (`map.shadow` is 0)

#### Scenario: Dark sticker with its rim
- **WHEN** `stationMarker({ cx: 100, cy: 50, surface: "dark" })` is called
- **THEN** its body is one circle of radius 12 at (100, 50) with fill `#FFFFFF`, stroke `#ADA79D` and stroke-width 3: no shadow copy, and no rim since `surface.dark.rimWidth` is 0

#### Scenario: Ink scale and its bounds
- **WHEN** `nodeBlock` is drawn with `inkScale: 1.6`, and then with `inkScale: 0.1` and `inkScale: 9`
- **THEN** the first has outline 4.8 and no shadow copy; the other two throw a `RangeError` naming `inkScale`

#### Scenario: Unknown surface or a parameter a piece does not take
- **WHEN** `countBadge` gets `surface: "sepia"`, `pipe` gets `surface: "dark"`, or `ledgerMark` gets `inkScale: 2`
- **THEN** the first throws a `RangeError` naming `surface` and listing `light, dark`; the other two name `surface` and `inkScale` as unknown parameters

### Requirement: Room for the outline
The smallest dimension of an outlined shape (`height` of a `lineBadge`, flat or not, of a `countBadge` and of a `normal` or `focus` node; `2 × r` of a `stationMarker`) SHALL be at least 4 × `map.outline` × `inkScale`; a smaller one throws a `RangeError` naming `height` or `r` (`textSize` for a count badge whose height comes from it, "Count badge text size"), equality accepted. A `placeholder` node is exempt: it draws no ink.

#### Scenario: Badge too low for its ink
- **WHEN** `lineBadge` gets `flat: true` and `inkScale: 8` with the default height 20, and then `height: 96`, `width: 120` and `inkScale: 8`
- **THEN** the first throws a `RangeError` naming `height`; the second draws a rect 96 wide and 72 high, inset by 12

#### Scenario: Placeholder without ink
- **WHEN** `nodeBlock` is drawn with `state: "placeholder"`, `height: 20`, `width: 40` and `inkScale: 8`
- **THEN** it draws the dashed box without an error

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

### Requirement: Metro pieces
`lineBadge`, `stationMarker`, `pipe` and `countBadge` SHALL draw as in `metro-and-diagram-pieces` design §3. `stationMarker` with `to` draws one closed capsule path from (cx, cy) to `to`, or the interchange disc when `to` equals (cx, cy); `deprecated` fills it with `surface.muted`. A count badge is a circle when width equals height and a pill otherwise.

#### Scenario: Interchange capsule
- **WHEN** `stationMarker({ cx: 0, cy: 0, to: [40, 0] })` is called
- **THEN** its face is one `path` with two arc commands of radius 14, closed with `Z`, spanning x −14 to 54 and y −14 to 14, and no `circle`

#### Scenario: Interchange at one point
- **WHEN** `stationMarker({ cx: 5, cy: 5, to: [5, 5] })` is called
- **THEN** its face is a `circle` at (5, 5) of radius 14

#### Scenario: Flat badge
- **WHEN** `lineBadge({ x: 50, y: 20, text: "SH", fill: "color.state.healthy", flat: true })` is called
- **THEN** its body is one `rect` of height 17 inset by 1.5, and its text node is `SH` in `#FFFFFF`

#### Scenario: Badge narrower than tall
- **WHEN** `lineBadge` gets `width: 10` with the default height 20, or `text: "SH"` and `height: 96` without a width
- **THEN** each call throws a `RangeError` naming `width`

#### Scenario: Pipe widths out of range
- **WHEN** `pipe` gets `width: 0`, `width: 101`, `casing: -1` or `casing: 51`
- **THEN** each call throws a `RangeError` naming `width` or `casing`; `casing: 0` draws the colour path alone

#### Scenario: Count shape follows its size
- **WHEN** `countBadge` is drawn with `text: "3"`, with `text: "12"`, and with `text: "3", width: 40`
- **THEN** the first face is a circle of radius 8, the second a rect wider than 16 with radius 8, the third a rect 40 wide

### Requirement: Diagram nodes
`nodeBlock`, `pillNode` and `hexNode` SHALL draw a box, a pill or a hexagon with `title` and an optional `subtitle` in the states `normal`, `focus` (face `color.state.caller`, ink text) and `placeholder` (dashed `5 4` in `surface.muted`, no fill, no shadow). A placeholder's title is centred when it has no subtitle; with one, both follow `stackledger-map-and-link-pieces` design §4. Width is at least twice the height; `nodeBlock.radius` is at most height / 2.

#### Scenario: Default state
- **WHEN** `nodeBlock` is called without `state`
- **THEN** it draws the `normal` sticker: face `#FFFFFF` on the light surface

#### Scenario: Node radius out of range
- **WHEN** `nodeBlock` gets `radius: -1` or `radius: 24` with height 46
- **THEN** each call throws a `RangeError` naming `radius`

#### Scenario: Focus node on dark
- **WHEN** `nodeBlock` is drawn with `state: "focus"` and `surface: "dark"`
- **THEN** its face has fill `#8FB2FF` (`color.state.caller`) and its title fill `#121212`

#### Scenario: Placeholder
- **WHEN** `hexNode` is drawn with `state: "placeholder"` and `title: "Nothing"`
- **THEN** its body is one `polygon` with `fill` none and `stroke-dasharray` `5 4`, and its only text is `Nothing`, centred

#### Scenario: Placeholder with a subtitle
- **WHEN** `nodeBlock({ x: 10, y: 10, width: 200, title: "Stripe", subtitle: "external service", state: "placeholder" })` is called
- **THEN** its body is the one dashed rect, and its text is `Stripe` at (22, 30), bold, font-size 13, then `external service` at (22, 47), weight 400, font-size 11, both filled `#5C5852` with start anchor

#### Scenario: Node too narrow, without a title, or a placeholder with a subtitle
- **WHEN** `pillNode` gets `width: 80` with height 46, or `title: ""`, or `state: "placeholder"` with an empty `subtitle: ""`; and then `state: "placeholder"` with `subtitle: "agent"`
- **THEN** the first three calls throw a `RangeError` naming `width`, `title` or `subtitle`; the last one draws (a placeholder's subtitle is no longer refused)

### Requirement: Message arrow
`messageArrow` SHALL draw as in `metro-and-diagram-pieces` design §3, "The arrow": a path to the base of a head of length 5 × `width` at `to` (other heads: "Message arrow heads"), in `surface.text` or the colour of its `kind` ("Message arrow kinds"); `bezier` leaves and enters horizontally, and falls back to `straight` when the horizontal distance is at most twice the head; `controls` gives its own curve; `head: false` ends at `to`; a `label` sits in a pill at the middle.

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

### Requirement: Ledger mark
`ledgerMark` SHALL draw the 32-unit mark in a group translated to (`x`, `y`) and scaled by `size` / 32: a white page with one outline 1.25 wide, the bent line in `line` and two white ink-outlined stations, no text. `size` is from 12 to 512. The outline is `color.ink` on the light surface and `surface.dark.muted` on the dark one, so the page keeps one outline that reads on either background (ADR 0009).

#### Scenario: Favicon size
- **WHEN** `ledgerMark({ x: 0, y: 0 })` is called
- **THEN** its group has transform `translate(0 0) scale(1)` and holds, in order, the `rect` at (0.625, 0.625) 30.75 × 30.75 with radius 6.6, fill `#FFFFFF`, stroke `#121212` and stroke-width 1.25, the `path` `M7 23 L14 16 L25 16` with stroke `#E04E17` and width 4.5, and circles at (14, 16) r 4 and (25, 16) r 2.6

#### Scenario: Scaled and too small
- **WHEN** `ledgerMark` gets `size: 16`, and then `size: 8`
- **THEN** the first group has `scale(0.5)` with the same children; the second throws a `RangeError` naming `size`

#### Scenario: Mark on a dark surface
- **WHEN** `ledgerMark({ x: 0, y: 0, surface: "dark" })` is called
- **THEN** its group holds the same children as "Favicon size" except that the `rect`'s stroke is `#ADA79D`, and it holds no other `rect`

#### Scenario: Unknown surface on the mark
- **WHEN** `ledgerMark` gets `surface: "navy"`
- **THEN** it throws a `RangeError` naming `surface` and listing `light, dark`

### Requirement: Positions of any size
Every position parameter and every point (`[x, y]`) parameter of every piece SHALL accept any finite number, with no bound. A position or point holding `NaN`, `Infinity`, `-Infinity` or a non-number is still a `RangeError` naming the parameter. Pieces draw a far position exactly as a near one, moved by the same amount.

#### Scenario: Far map position
- **WHEN** `stationMarker`, `lineBadge`, `countBadge`, `nodeBlock`, `pillNode`, `hexNode` and `ledgerMark` are drawn at 6400000 on both axes, and again at -6400000
- **THEN** each draws without error, and, taking the numbers of its tree in order (attributes, then those in path data and transforms), the absolute coordinates differ from the drawing at 0 by exactly the shift (6400000 or -6400000), within 0.01, and every other number is equal. Absolute coordinates are the attributes `x`, `y`, `cx`, `cy`, `x1`, `y1`, `x2`, `y2` outside a group with a `transform`, the `translate` of such a group, the `points` of a polygon, and in path data the points of `M`, `L`, `C`, `Q` and the end point of `A` (not its radii or flags)

#### Scenario: Far interchange and arrow
- **WHEN** `stationMarker` gets `cx` 6400000, `cy` 6400000, `to` [6400000, 6400640], and `messageArrow` gets `from` [6399900, 6400000] and `to` [6400100, 6400000]
- **THEN** both draw, and against the drawing at `cx` 0, `cy` 0, `to` [0, 640] (and `from` [-100, 0], `to` [100, 0]) the absolute coordinates (as in "Far map position") differ by exactly 6400000, within 0.01, and every other number is equal

#### Scenario: Not finite
- **WHEN** `stationMarker` gets `cx: NaN`, `lineBadge` gets `y: Infinity`, `arcArrow` gets `from: [-Infinity, 0]`, `nodeBlock` gets `x: "6400000"`, or `messageArrow` gets `from: [null, 0]`
- **THEN** each call throws a `RangeError` naming `cx`, `y`, `from`, `x` or `from`

#### Scenario: Far rings centre
- **WHEN** `rings` gets `cx` 6400000 and `cy` -6400000
- **THEN** it draws its 14 circles centred there

### Requirement: Drawing overflow
A piece SHALL throw a `RangeError` naming the piece and "the drawing overflows" when a number it computes and draws (an attribute, or a number it writes into path data or a transform) is not finite, for example after dividing by the distance between two points at opposite ends of the number range. It draws nothing then. Path data passed in by the caller (`road.d`, `pipe.d`) keeps its own check. Parameters whose positions and points lie within ±1e15 never trigger it.

#### Scenario: Distance overflows
- **WHEN** `messageArrow` gets `from` [-1.7e308, 0], `to` [1.7e308, 0] and `curve: "straight"`, or `stationMarker` gets `cx` -1.7e308, `cy` 0 and `to` [1.7e308, 0]
- **THEN** each call throws a `RangeError` starting with `messageArrow: the drawing overflows` or `stationMarker: the drawing overflows`

#### Scenario: Large but finite
- **WHEN** `stationMarker` gets `cx` 1e15 and `cy` 0
- **THEN** it draws, and its circle's `cx` is written as `1000000000000000`

### Requirement: Ring count
`rings` SHALL take an optional `count`, an integer from 1 to 1000, default 14, and draw that many circles from `radius` in steps of `cover.ringStep`. A `count` that is not an integer or lies outside 1 to 1000 throws a `RangeError` naming `count`.

#### Scenario: Default count
- **WHEN** `rings({ cx: 400, cy: 210 })` is called
- **THEN** its body holds one group with 14 circles, radii 90 to 454

#### Scenario: Given count
- **WHEN** `rings({ cx: 600, cy: 225, radius: 60, count: 22 })` is called
- **THEN** its body holds one group with 22 circles, radii 60 to 648

#### Scenario: Count out of range
- **WHEN** `rings` is called with `count` 0, 1001 or 2.5
- **THEN** it throws a `RangeError` naming `count`

### Requirement: Renewal ring
`renewalRing({ cx, cy, r, width, surface, inkScale })` SHALL draw circles at (cx, cy) with radius `r`, fill none and no shadow: a rim band in `surface.rim` at width + o + 2w when `rimWidth` > 0, an ink band at width + o, then `color.state.blocked` at `width` (default `map.ringWidth`, greater than 0, at most 50), as `stackledger-map-and-link-pieces` design §3. An `r` below (width + o + 2w) / 2 throws a `RangeError` naming `r`.

#### Scenario: Light ring
- **WHEN** `renewalRing({ cx: 0, cy: 0, r: 18 })` is called
- **THEN** its body is two circles of radius 18 with fill none: stroke `#121212` at 6, then stroke `#FF8A3D` at 3, and its text is empty

#### Scenario: Dark ring with its rim
- **WHEN** `renewalRing({ cx: 0, cy: 0, r: 18, surface: "dark" })` is called
- **THEN** its body is two circles, with no rim band since `surface.dark.rimWidth` is 0: stroke `#ADA79D` at 6 ("Ink on the dark surface"), then stroke `#FF8A3D` at 3

#### Scenario: Ring too small for its bands
- **WHEN** `renewalRing` gets `r: 3` on light and on dark, then `r: 2.99` on dark, then `width: 0` or `width: 51`
- **THEN** both calls with `r` 3 draw; the call with `r` 2.99 throws a `RangeError` naming `r` (at least 3); the other two name `width`

### Requirement: Suggested halo
`suggestedHalo({ cx, cy, r, surface })` SHALL draw one circle at (cx, cy) with radius `r`, fill none, stroke `surface.muted` at `map.haloWidth` and `stroke-dasharray` `4 3`. It draws no ink and takes no `inkScale`.

#### Scenario: Halo on both surfaces
- **WHEN** `suggestedHalo({ cx: 0, cy: 0, r: 21 })` is called, then with `surface: "dark"`
- **THEN** each body is one circle of radius 21 with stroke-width 1.5 and dasharray `4 3`, stroked `#5C5852` on light and `#ADA79D` on dark

#### Scenario: Halo without a radius
- **WHEN** `suggestedHalo` is called without `r`, or with `r: 0`, or with `inkScale: 1`
- **THEN** each call throws a `RangeError` naming `r`, `r` and `inkScale`

### Requirement: Licence mark
`licenceMark({ cx, cy, state, size, surface, inkScale })` SHALL draw a disc sticker of radius `size` / 2 (default `map.licenceSize`) centred on (cx, cy), with face `color.state.healthy` when `state` is `owned` (default) and `color.white` when it is `toBuy`.

#### Scenario: Owned licence
- **WHEN** `licenceMark({ cx: 27, cy: -15 })` is called
- **THEN** its body is one circle of radius 5 at (27, -15) with fill `#3DDC84` and stroke `#121212` at 3, with no shadow copy

#### Scenario: Licence to buy on dark
- **WHEN** `licenceMark({ cx: 0, cy: 0, state: "toBuy", surface: "dark" })` is called
- **THEN** its body is one circle of radius 5, the face `#FFFFFF` stroked `#ADA79D`, with no shadow and no rim

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
The library SHALL hold `UI_ICONS`, the seven icons of `stackledger-map-and-link-pieces` design §5 (`sun`, `moon`, `zoomIn`, `zoomOut`, `reset`, `calendar`, `download`), each with a title, a description and nodes in a 24 × 24 box without colours. `uiIcon({ name, x, y, size, colour })` SHALL place one in a group `translate(x y) scale(size / 24)` whose `fill` and `stroke` are `colour` (a token path, default `color.ink`, or `currentColor`).

#### Scenario: Default sun
- **WHEN** `uiIcon({ name: "sun", x: 0, y: 0 })` is called
- **THEN** its body is one group with transform `translate(0 0) scale(1)`, fill and stroke `#121212`, holding the sun's circle and its rays path

#### Scenario: The seven names
- **WHEN** the test lists `UI_ICONS`
- **THEN** the names are exactly the seven above, in that order, each with a non-empty title and description, and no node of the data carries a colour

#### Scenario: Unknown icon or a hex colour
- **WHEN** `uiIcon` gets `name: "menu"`, or `colour` `"#FFFFFF"`, `"currentcolor"`, `"inherit"` or `" currentColor"`
- **THEN** each call throws a `RangeError` naming `name` or `colour`

### Requirement: Link icons as data
The library SHALL hold `LINK_ICONS`, six stickers: the four of `stackledger-map-and-link-pieces` design §6 (`github`, `linkedin`, `email`, `website`), `stackledger` (the product's mark) and `brunosouzas` (the brand symbol). `linkIcon({ icon, x, y, size, surface })` SHALL draw one in a group `translate(x y) scale(size / 46)`: the face rect, white with its outline and no frame behind it, then the glyph. `size` defaults to 46. The `github` description credits Font Awesome and CC BY 4.0.

#### Scenario: GitHub on light
- **WHEN** `linkIcon({ icon: "github", x: 0, y: 0 })` is called
- **THEN** its group has transform `translate(0 0) scale(1)` and holds first the face rect (2, 2) 38 × 38 radius 9 fill `#FFFFFF` stroke `#121212` at 2.5, then a group `translate(9.5 9) scale(0.0455)` with the path of brunosouzas.com `social-github.svg` (`e29b3dd`)

#### Scenario: Dark frame
- **WHEN** `linkIcon({ icon: "email", x: 0, y: 0, surface: "dark" })` is called
- **THEN** its group starts with the face rect (2, 2) 38 × 38 radius 9 filled `#FFFFFF` and stroked `#ADA79D`, with no frame rect before it

#### Scenario: Unknown icon
- **WHEN** `linkIcon` gets `icon: "x"`, or no `icon`
- **THEN** each call throws a `RangeError` naming `icon`, the first listing `github, linkedin, email, website, stackledger, brunosouzas`

#### Scenario: Link icon list
- **WHEN** `LINK_ICON_NAMES` is read
- **THEN** it is `github`, `linkedin`, `email`, `website`, `stackledger`, `brunosouzas`, in that order, and every entry of `LINK_ICONS` has a non-empty English `title` and `description`

### Requirement: Icons hold no link, style or script
Every `uiIcon` and `linkIcon` tree, on both surfaces, SHALL use only the node contract's tags, hold no attribute named `href`, `xlink:href`, `style` or starting with `on`, and no attribute value or text containing `url(` or `://`. So a consumer can wrap it in a standalone SVG and ship it under a strict content policy.

#### Scenario: Every icon as a standalone file
- **WHEN** the test walks the node tree of each of the 7 UI icons and each of the 6 link icons, on light and dark (26 trees), and then writes each wrapped in `el("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 46 46" }, …body)` with `toSvg`
- **THEN** in the trees no tag is outside `SVG_TAGS`, no attribute is `href`, `xlink:href`, `style` or `on…`, and no attribute value or text holds `url(` or `://`; and each written string holds `://` exactly once, in the root's `xmlns`

### Requirement: New pieces carry their own stroke
Every shape a new piece draws (`renewalRing`, `suggestedHalo`, `licenceMark`, `zone`, `uiIcon`, `linkIcon`, the `ledgerMark` page, and the ten body diagram pieces) SHALL carry its own `stroke`, or sit in a group of the piece that sets one, so it draws the same inside the cover command's outlined group (`stroke` ink, width 4) as on its own.

#### Scenario: Inside the outlined group
- **WHEN** the test walks each new piece's body, drawn with its required parameters on light and dark, plus `zone` with one, two and three points, `altFrame` with a condition and one section, and `edgeLabel` with `backdrop: true`
- **THEN** every `circle`, `ellipse`, `rect`, `line`, `polyline`, `polygon` and `path` has a `stroke` attribute or an ancestor `g` inside the piece's body that has one

### Requirement: Badge without a letter
`lineBadge.text` SHALL be optional. Without it, the body is drawn as with a text, the `text` array is empty, and the default width is the one-character width, 30. `text: ""` is still rejected naming `text`. A call with a text draws as in 0.2.0.

#### Scenario: Default badge without a letter
- **WHEN** `lineBadge({ x: 50, y: 20, fill: "color.state.healthy" })` is called
- **THEN** its face is a rect at (35, 10), 30 × 20, radius 10, and its text is empty

#### Scenario: Banner badge without a letter
- **WHEN** `lineBadge({ x: 110, y: 300, fill: "color.state.healthy", height: 34, width: 54, surface: "dark", inkScale: 1.6 })` is called
- **THEN** its body equals the body of the same call with `text: "B"`, and its text is empty

#### Scenario: Empty letter and narrow badge
- **WHEN** `lineBadge` gets `text: ""`, or no text with `height: 34` and no width
- **THEN** the first throws a `RangeError` naming `text`; the second names `width`

### Requirement: Existing calls unchanged
Every call valid in 0.2.0, with each top-level `color.<state>` value written `color.state.<state>`, SHALL stay valid and draw the tree pinned in `test/fixtures/pieces-0.2.0.json` (`stackledger-map-and-link-pieces` design §6b). 0.7.0 regenerated the fixture from the v2 drawing with the same calls except that rewrite, and the proof cover and banner goldens with it; 0.8.1 replaces only the trees of its three `ledgerMark` calls with the "Folha" mark the owner approved (card 303).

#### Scenario: Goldens unchanged
- **WHEN** the four golden fixtures are built
- **THEN** each output equals its regenerated golden byte for byte

#### Scenario: Frozen 0.2.0 calls
- **WHEN** each call of `test/fixtures/pieces-0.2.0.json` is made again
- **THEN** its tree is deep-equal to the pinned one, and each `ledgerMark` call with `surface: "light"` added is deep-equal to the same pinned tree

#### Scenario: Same calls after the regeneration
- **WHEN** the regenerated fixture is compared with the 0.6.1 one
- **THEN** both list the same calls in the same order with the same parameters, except that each `color.<state>` value (`lineBadge.fill`, `ledgerMark.line`) is now `color.state.<state>`; only the trees differ

#### Scenario: Only the mark trees change in 0.8.1
- **WHEN** the 0.8.1 fixture is compared with the 0.8.0 one
- **THEN** both list the same calls with the same parameters in the same order, the trees of the three `ledgerMark` calls differ, and every other tree is deep-equal

### Requirement: Current colour on UI icons
`uiIcon` SHALL accept the exact keyword `currentColor` as `colour` and write it as is as the group's `fill` and `stroke`, with the same children as a token colour, so an icon inline in a page follows its element's text colour. No other spelling is accepted.

#### Scenario: Current colour
- **WHEN** `uiIcon({ name: "zoomIn", x: 4, y: 8, size: 16, colour: "currentColor" })` is called
- **THEN** its body is one group with transform `translate(4 8) scale(0.6666666666666666)`, fill and stroke `currentColor`, and the same children as `uiIcon({ name: "zoomIn", x: 4, y: 8, size: 16 })`

#### Scenario: Current colour on every icon
- **WHEN** each of the seven icons is drawn with `colour: "currentColor"`, written with `toSvg` and with `toReact`
- **THEN** no node holds a hex colour, every `fill` and `stroke` is `currentColor` or `none`, and the "Icons hold no link, style or script" rule holds for each tree

### Requirement: UI icon calls of 0.3.0 unchanged
Every `uiIcon` call valid in 0.3.0 SHALL stay valid and draw the tree and `toSvg` bytes pinned in `test/fixtures/ui-icons-0.3.0.json`, which this change regenerates once with 0.7.0 output and the same 21 calls (none passes a top-level `color.<state>`, so no call is rewritten); only the colours of the drawing change.

#### Scenario: Frozen 0.3.0 icon calls
- **WHEN** the test re-calls the fixture's 21 calls: each of the seven icons with no colour at (0, 0), with `colour: "surface.dark.text"` at (0, 0), and with `colour: "color.white"` at (3.5, -2) with `size` 18
- **THEN** each tree deep-equals its pinned tree and its `toSvg` output equals its pinned string

#### Scenario: White icons keep their 0.3.0 bytes
- **WHEN** the seven `color.white` calls are written with `toSvg`
- **THEN** each string equals its string in the 0.6.1 fixture, since `color.white` keeps `#FFFFFF`

### Requirement: Diagram shapes
`diagramBox`, `decisionNode`, `storeNode`, `queueNode` and `exchangeNode` SHALL take the parameters and draw the geometry of `body-diagram-pieces` design §3, from the top-left `x`, `y`: a box or pill, a diamond, a cylinder with its lid, a box with two rails, and a hexagon with points 0.26 × height in.

#### Scenario: Default diagram box
- **WHEN** `diagramBox({ x: 0, y: 0, width: 120, text: ["Orders API"] })` is called
- **THEN** its body is one rect of 120 × 46 with `rx` 10 at (0, 0) with fill `#FFFFFF`, stroke `#121212` and stroke-width 3, with no shadow copy; its text is one node `Orders API` at (60, 27.5), `#121212`, size 13, weight 700, anchor `middle`

#### Scenario: Diamond
- **WHEN** `decisionNode({ x: 0, y: 0, width: 200, height: 100, text: ["Seen before?"] })` is called
- **THEN** its face polygon has points `100,0 200,50 100,100 0,50`, it has no shadow polygon, and its word is at (100, 54.5)

#### Scenario: Cylinder
- **WHEN** `storeNode({ x: 0, y: 0, width: 100, height: 60, text: ["IDs"] })` is called
- **THEN** its body is the face path `M0,8 A50,8 0 0 1 100,8 V52 A50,8 0 0 1 0,52 Z` and the lid `M0,8 A50,8 0 0 0 100,8` with fill `none`, stroke `#121212` and stroke-width 2.25, with no shadow path; its word is at (50, 38.5)

#### Scenario: Queue
- **WHEN** `queueNode({ x: 0, y: 0, width: 100, text: ["orders"] })` is called
- **THEN** its one rect is 100 × 46 with `rx` 6, and its last body node is the path `M10,0 V46 M90,0 V46` with fill `none`, stroke `#121212` and stroke-width 2.25

#### Scenario: Exchange
- **WHEN** `exchangeNode({ x: 0, y: 0, width: 120, text: ["exchange"] })` is called
- **THEN** its face polygon has points `11.96,0 108.04,0 120,23 108.04,46 11.96,46 0,23`

#### Scenario: Shape limits
- **WHEN** `diagramBox` gets `radius: 30` with the default height, `storeNode` gets `ry: 20` with `height: 60`, `queueNode` gets `width: 40`, `diagramBox` gets four lines of text, `diagramBox` gets `text: ["a", ""]`, and `diagramBox` gets `shape: "pill"` with `radius: 5`
- **THEN** each throws a `RangeError` naming `radius`, `ry`, `width`, `text`, `text[1]` and `radius`

#### Scenario: First limit wins
- **WHEN** `diagramBox` gets `height: 10` and `radius: 30` with `width: 120`, and `messageArrow` gets `from: [0, 0]`, `to: [20, 0]`, `controls: [[5, 0], [15, 0]]` and `curve: "straight"`
- **THEN** the first names `height` and the second names `to`

#### Scenario: Queue as narrow as its rails allow
- **WHEN** `queueNode` gets `height: 12` with `width: 31`, and then with `width: 32`
- **THEN** the first throws a `RangeError` naming `width`; the second draws its rails at 10 and 22

### Requirement: Sticker of the body diagram pieces
The five diagram shapes, `taggedContainer` (frame and tab) and `phaseBand` SHALL draw the sticker of the requirement "Ink sticker on a surface" and take `surface` and `inkScale`; `lifeline`, `altFrame` and `edgeLabel` SHALL take only `surface`.

#### Scenario: Dark diagram box
- **WHEN** `diagramBox({ x: 0, y: 0, width: 120, text: ["Sender"], shape: "pill", surface: "dark" })` is called
- **THEN** its body is one rect of 120 × 46 with `rx` 23 at (0, 0): the face `#1D1C1A` with stroke `#ADA79D` and stroke-width 3, with no shadow and no rim; its word `Sender` is at (60, 27.5) in `#F1EEE8`

#### Scenario: Ink scale on a lifeline
- **WHEN** `lifeline` gets `inkScale: 2`
- **THEN** it throws a `RangeError` naming `inkScale` as an unknown parameter

### Requirement: Room in the body diagram pieces
The rule of "Room for the outline" SHALL apply to the body diagram stickers: `height` of a `queueNode`, an `exchangeNode` and a `phaseBand`, and the smaller of `width` and `height` of a `diagramBox`, a `decisionNode`, a `storeNode` and a `taggedContainer`. The error names `width` when the width is the smaller, otherwise `height`.

#### Scenario: Diagram box too low
- **WHEN** `diagramBox` gets `height: 10`, and then `height: 12`, each with `width: 120` and `text: ["a"]`
- **THEN** the first throws a `RangeError` naming `height` and saying it needs at least 12; the second draws a rect 12 high with `rx` 6

#### Scenario: Diamond too narrow
- **WHEN** `decisionNode` gets `width: 10` and `height: 100`
- **THEN** it throws a `RangeError` naming `width`

### Requirement: Diagram words
The words of the diagram shapes SHALL be centred lines as in `body-diagram-pieces` design §3: line step `textSize` × 1.25, an optional subtitle 15 below the last line at size 11, weight 400. Without `fill` the face is `surface.panel`, the lines `surface.text` and the subtitle `surface.muted`; with `fill` the face is that colour token and every word `color.ink`.

#### Scenario: Two lines and a subtitle on a fill
- **WHEN** `diagramBox({ x: 0, y: 0, width: 200, height: 70, text: ["Payment", "consumer"], subtitle: "Idempotent Receiver", fill: "color.state.healthy" })` is called
- **THEN** the face is `#3DDC84`, and its text is `Payment` at (100, 23.88), `consumer` at (100, 40.13), both size 13, and `Idempotent Receiver` at (100, 55.13), size 11, all three `#121212`

#### Scenario: Smaller text
- **WHEN** `diagramBox({ x: 0, y: 0, width: 160, height: 26, text: ["a note"], textSize: 11, radius: 6, fill: "color.state.transitional" })` is called
- **THEN** its word is at (80, 16.81), size 11, and its face is `#FFD25A` with `rx` 6

### Requirement: Code in words
In every text parameter of the ten body diagram pieces and in `pill.text`, a string with an even number of backticks SHALL be drawn as a `text` node whose children are the plain parts as strings and each part between backticks as a `tspan` with only `font-family` `font.mono`; empty parts are dropped and the backticks are not drawn. A string with an odd number of backticks is drawn as is. With an even number, a pill's default width ignores them. Other pieces' words are unchanged.

#### Scenario: A code run inside a label
- **WHEN** ``edgeLabel({ x: 0, y: 0, lines: ["adopts a `correlationId`"] })`` is called
- **THEN** its text node's children are `adopts a ` and a `tspan` whose `font-family` is `'Source Code Pro', ui-monospace, 'SF Mono', Menlo, Consolas, monospace` holding `correlationId`

#### Scenario: Only code, and an odd backtick
- **WHEN** `edgeLabel` gets ``lines: ["`200 OK`"]``, and then ``lines: ["a `b"]``
- **THEN** the first text node's only child is a `tspan` holding `200 OK`; the second's only child is the string ``a `b``

#### Scenario: Code through both renderers
- **WHEN** ``diagramBox({ x: 0, y: 0, width: 200, text: ["adopts a `correlationId`"] })`` is written with `toSvg` and with `toReact`
- **THEN** `toSvg` writes the text node with its `tspan` on one line, and both outputs have the same normal form

#### Scenario: Message arrow label stays plain
- **WHEN** `messageArrow` gets ``label: "`x`"``
- **THEN** its text node's only child is the string `` `x` ``

#### Scenario: Code in a pill
- **WHEN** `pill({ x: 0, y: 0 })` gets ``text: "`main`"``, then ``text: "deploy to `prod`"``, then ``text: "a `b"``
- **THEN** the first rect is 76 wide and its text node's only child is a mono `tspan` holding `main`, written on one line by `toSvg`; the second rect is 181 wide with children `deploy to ` and a `tspan` holding `prod`; the third rect is 76 wide and its only child is the string ``a `b``; ``text: "abcd`ef"`` (odd) gives a rect 108 wide, ``text: "abcd`e`f"`` a rect 97 wide

### Requirement: Tagged container
`taggedContainer` SHALL draw a frame sticker with `rx` `map.nodeRadius` and a tab sticker at (x + 14, y − 12), `tagWidth` × 24 with `rx` 12, in `tagFill` (default `color.white`), with the `tag` word in `color.ink`, bold, size `map.badgeTextSize`, centred on the tab. `tagWidth` defaults to 7.2 × characters + 24. The tab follows the room rule (design §3), and a width below `tagWidth` + 28 is rejected naming `width`.

#### Scenario: Container with its tab
- **WHEN** `taggedContainer({ x: 0, y: 0, width: 300, height: 120, tag: "Anypoint MQ" })` is called
- **THEN** its body is the frame's face (300 × 120, `rx` 10, `#FFFFFF`), then the tab's face at (14, −12), 103.2 × 24 with `rx` 12, `#FFFFFF` (0.6.1: `#FFD25A`), with no shadow copies; its word is at (65.6, 4.5), size 12, `#121212`

#### Scenario: Tab colour on request
- **WHEN** the same call gets `tagFill: "color.state.transitional"`
- **THEN** the tab's face is `#FFD25A`

#### Scenario: Tag wider than the frame
- **WHEN** `taggedContainer({ x: 0, y: 0, width: 100, height: 120, tag: "Anypoint MQ" })` is called
- **THEN** it throws a `RangeError` naming `width`

#### Scenario: Room for the tab
- **WHEN** `taggedContainer` gets `width: 300`, `height: 120` and `tag: "MQ"`, once with `tagWidth: 23`, once with `inkScale: 2.1` and once with `inkScale: 2` (no `tagWidth` in the last two)
- **THEN** the first throws a `RangeError` naming `tagWidth`, the second naming `inkScale`, and the third draws a tab 24 high with stroke-width 6

### Requirement: Lifeline
`lifeline` SHALL draw one `line` from (x, y1) to (x, y2) in `surface.muted`, width `width` (default 1.75, as given): `active` (default) with dash `5 5` and cap `butt`, `inactive` with dash `1 6` and cap `round`. `y2` equal to `y1` is rejected naming `y2`.

#### Scenario: Active lifeline
- **WHEN** `lifeline({ x: 100, y1: 40, y2: 400 })` is called
- **THEN** its body is one `line` from (100, 40) to (100, 400) with stroke `#5C5852`, stroke-width 1.75, dash `5 5` and cap `butt`, and its text is empty

#### Scenario: Inactive lifeline on dark
- **WHEN** `lifeline({ x: 100, y1: 40, y2: 400, state: "inactive", surface: "dark" })` is called
- **THEN** its line has stroke `#ADA79D`, dash `1 6` and cap `round`

#### Scenario: Lifeline of no length
- **WHEN** `lifeline({ x: 100, y1: 40, y2: 40 })` is called
- **THEN** it throws a `RangeError` naming `y2`

### Requirement: Phase band
`phaseBand` SHALL draw a pill sticker (`rx` height / 2, default height 26) in the required colour token `fill`, with its `text` in `color.ink`, bold, at (x + width / 2, y + height / 2 + 4.5 × `textSize` / 13), anchor `middle`. A width below the height is rejected naming `width`.

#### Scenario: Band
- **WHEN** `phaseBand({ x: 0, y: 0, width: 400, text: "Circuit CLOSED", fill: "color.state.healthy" })` is called
- **THEN** its face is a rect 400 × 26 with `rx` 13 and fill `#3DDC84`, and its word is at (200, 17.5), size 13, `#121212`

#### Scenario: Band without a fill, or too narrow
- **WHEN** `phaseBand` is called without `fill`, and then with `width: 20`
- **THEN** each throws a `RangeError` naming `fill` and `width`

### Requirement: Alt frame
`altFrame` SHALL draw the frame, one dashed divider per section, and a head (tag, then the optional condition on a backdrop) for the frame and for each section, as in `body-diagram-pieces` design §3, all in the surface's colours. A section whose `y` is not strictly inside the frame is rejected naming `sections[<i>].y`.

#### Scenario: Frame with one section
- **WHEN** `altFrame({ x: 0, y: 0, width: 300, height: 200, tag: "alt", condition: "[found]", sections: [{ y: 120, tag: "else", condition: "[not found]" }] })` is called
- **THEN** its body is the rect 300 × 200 (`rx` 7, fill `none`, stroke `#121212`, width 1.75); the `line` from (0, 120) to (300, 120) with stroke-width 1.4 and dash `4 4`; the tag rect at (7, 6), 33.2 × 17, fill `#121212`; the condition backdrop at (42.2, 7.5), 51.4 × 14, fill `#F6F3EC`; the tag rect at (7, 126), 39.6 × 17; and the backdrop at (48.6, 127.5), 76.2 × 14. Its text is `alt` at (23.6, 18.5) in `#FFFFFF`, size 10, weight 900; `[found]` at (46.2, 18.5); `else` at (26.8, 138.5); `[not found]` at (52.6, 138.5)

#### Scenario: Measured widths in a section
- **WHEN** `altFrame` gets `x: 0`, `y: 0`, `width: 300`, `height: 200`, `tag: "alt"` and `sections: [{ y: 120, tag: "else", condition: "[not found]", tagWidth: 50, conditionWidth: 90 }]`
- **THEN** the section's tag rect is 50 wide at (7, 126), its condition backdrop is 90 wide at (59, 127.5), and its condition starts at (63, 138.5)

#### Scenario: Section outside the frame
- **WHEN** `altFrame` gets `y: 0`, `height: 200` and `sections: [{ y: 200, tag: "else" }]`
- **THEN** it throws a `RangeError` naming `sections[0].y`

### Requirement: Edge label
`edgeLabel` SHALL draw its 1 to 4 `lines` from the baseline (x, y) down by 13 × `textSize` / 11 per line, in `surface.text`, bold, size `textSize` (default 11), with the `anchor` (default `middle`); with `backdrop`, a rect per line in `surface.background` behind it, of width `width` or the estimate of design §3.

#### Scenario: Two lines on a backdrop
- **WHEN** `edgeLabel({ x: 100, y: 50, lines: ["request", "X-ID"], backdrop: true })` is called
- **THEN** its body is a rect at (74.3, 40), 51.4 × 14, and a rect at (83.6, 53), 32.8 × 14, both `rx` 3, fill `#F6F3EC`, stroke `none`; its text is `request` at (100, 50) and `X-ID` at (100, 63), both size 11, weight 700, anchor `middle`

#### Scenario: Anchored at the end with a measured width
- **WHEN** `edgeLabel({ x: 100, y: 50, lines: ["delivery 1"], anchor: "end", backdrop: true, width: 80 })` is called
- **THEN** its backdrop is at (24, 40), 80 × 14, and its word has anchor `end`

#### Scenario: Backticks do not count in the estimate
- **WHEN** ``edgeLabel({ x: 0, y: 0, lines: ["`200 OK`"], backdrop: true })`` is called
- **THEN** its backdrop is 45.2 wide, at (−22.6, −10)

#### Scenario: Too many lines
- **WHEN** `edgeLabel` gets five lines
- **THEN** it throws a `RangeError` naming `lines`

#### Scenario: Text size bounds
- **WHEN** `edgeLabel` gets `textSize: 49`, `phaseBand` gets `textSize: 5`, and `edgeLabel` gets `textSize: 48`
- **THEN** the first two throw a `RangeError` naming `textSize`; the third draws its line at size 48

### Requirement: Message arrow kinds
`messageArrow` SHALL take `kind`: `message` (default) and `reply` paint `surface.text`, `failure` paints `color.state.failure`, `failFast` paints `color.state.failFast`; the path's stroke and each head's fill and stroke take that paint. Unless `dashed` says otherwise ("Message arrow dash"), `reply`, `failure` and `failFast` add `stroke-dasharray` `2.4 × width` `3.2 × width` as the path's last attribute. The label keeps `surface.text`.

#### Scenario: Reply
- **WHEN** `messageArrow({ from: [0, 0], to: [100, 0], curve: "straight", kind: "reply" })` is called
- **THEN** its path is `M0,0 L87.5,0` with stroke `#121212`, stroke-width 2.5, cap `round` and dash `6 8`, and its head is the polygon `100,0 87.5,5 87.5,-5` in `#121212`

#### Scenario: Failure and fail-fast
- **WHEN** the same call is made with `kind: "failure"`, and with `kind: "failFast"` and `surface: "dark"`
- **THEN** the first's path and head are `#E04848`, the second's `#E0661F`, both with dash `6 8`

#### Scenario: Message kind is the 0.3.1 drawing
- **WHEN** each call of `test/fixtures/message-arrow-0.3.1.json` is made again with `kind: "message"` added
- **THEN** its tree is deep-equal to the pinned one

### Requirement: Message arrow through control points
`messageArrow` SHALL take `controls`, exactly two points: the path is `M start C c1 c2 end`, `start` being `from` or the base of a head at `from`, `end` the base of a head at `to` or `to`; the head at `to` points from the last of `c2`, `c1`, `from` that differs from `to` (a head at `from`: "Message arrow heads"). `controls` with `curve` is rejected naming `controls`.

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
Every `messageArrow` call valid in 0.3.1 SHALL stay valid and draw the tree and the `toSvg` bytes pinned in `test/fixtures/message-arrow-0.3.1.json`, which this change regenerates once with 0.7.0 output and the same eight calls of `body-diagram-pieces` design §5 (none passes a top-level `color.<state>`, so no call is rewritten).

#### Scenario: Frozen 0.3.1 arrow calls
- **WHEN** the test re-calls the eight calls of `test/fixtures/message-arrow-0.3.1.json`
- **THEN** each tree deep-equals its pinned tree, and its body nodes then its text nodes, each through `toSvg` and joined with no separator, equal its pinned string

#### Scenario: A changed arrow is caught
- **WHEN** the head length of the drawing changes
- **THEN** the test fails and names the calls that differ

### Requirement: State start
`stateStart` SHALL draw the initial state of a state machine: one `circle` at (`cx`, `cy`) of radius `r` (default `bodyDiagram.startRadius × bodyDiagram.layoutWidth / bodyDiagram.width`, 7.7), filled with the `text` colour of its `surface` (`light` by default, or `dark`), with `stroke="none"`, no shadow and no text. `r` is a size above 0 and at most 10000.

#### Scenario: Default start dot
- **WHEN** `stateStart` is called with `cx` 30.8 and `cy` 84
- **THEN** its body is exactly `<circle cx="30.8" cy="84" r="7.7" fill="#121212" stroke="none"/>` and its text is empty

#### Scenario: Start dot on the dark surface
- **WHEN** it is called with `cx` 0, `cy` 0, `r` 11 and `surface: "dark"`
- **THEN** the circle has `r="11"` and `fill="#F1EEE8"`

#### Scenario: Start dot inside the outlined group
- **WHEN** the cover command draws a `stateStart` in its outlined group (stroke ink, width 4)
- **THEN** the circle keeps `stroke="none"`, so its size does not grow by the group's outline

#### Scenario: Bad radius
- **WHEN** `stateStart` is called with `r` 0, or without `cy`
- **THEN** it throws a `RangeError` naming `r`, or `cy`

### Requirement: Emote
`emote` SHALL draw one reaction symbol with a fixed meaning, `kind` one of `idea`, `doubt`, `problem`, `worked`, `refused`, `pressure`, `liked`, `waiting` (design §5), centred on `x`, `y`. Its `body` SHALL be one group with `data-emote` and `stroke` `none`, plus `transform` `translate(x y) scale(s) translate(-x -y)` when `scale` is not 1; its `text` SHALL be empty. `burst` (default true) SHALL add the rays of `idea`, `problem` and `worked`, with no disc behind them.

#### Scenario: Scaled check
- **WHEN** `emote` is called with `kind: "worked"`, `x: 10`, `y: 20`, `scale: 2`
- **THEN** its body is one `g` with `data-emote` `worked`, `stroke` `none` and `transform` `translate(10 20) scale(2) translate(-10 -20)`

#### Scenario: Idea without its burst
- **WHEN** `idea` is drawn with `burst: false`, and with the default
- **THEN** the default group holds every child of the first plus the rays only, each a stroked shape with no fill, and neither group holds a disc behind the bulb or a shadow copy; on `surface: "dark"` both counts are the same as on light

#### Scenario: Problem in failure red
- **WHEN** `problem` and `refused` are drawn
- **THEN** their main shape is filled `color.state.failure`, and `worked` is filled `color.state.healthy`

### Requirement: Emote parameters
`emote` SHALL check `kind` (one of the eight), `x` and `y` (required, any finite number), `scale` (greater than 0, at most 10, default 1), `burst` (boolean) and `surface` (`light` or `dark`, default `light`) with the shared schema.

#### Scenario: Unknown kind
- **WHEN** `emote` gets `kind: "zzz"`
- **THEN** it throws a `RangeError` naming `kind` and the eight kinds

#### Scenario: Scale out of range
- **WHEN** `emote` gets `scale: 0` or `scale: 11`
- **THEN** it throws a `RangeError` naming `scale`

#### Scenario: Unknown surface
- **WHEN** `emote` gets `surface: "navy"`
- **THEN** it throws a `RangeError` naming `surface`

### Requirement: Milestone pin size
`milestonePin` SHALL take `size`, the head's radius, a number from 6 to 48, default 18. With k = `size` / 18, the head's centre is at `y − stem − 14k` with `stroke-width` `3k`, and the label's baseline is at `y − stem − 7k`, these three rounded to two decimals when `size` is given; the head's `r` and the label's `font-size` are `size` as given. Without `size` the pin's geometry is as in 0.5.0 ("Piece calls of 0.5.0 unchanged").

#### Scenario: Larger pin
- **WHEN** `milestonePin({ x: 100, y: 200, text: "S", size: 27 })` is called
- **THEN** its body is a `line` from (100, 200) to (100, 156) and a `circle` with `cx` 100, `cy` 135, `r` 27 and `stroke-width` 4.5, and its text node has `y` 145.5 and `font-size` 27

#### Scenario: Pin size bounds
- **WHEN** `milestonePin` gets `x: 0`, `y: 100`, `text: "1"` and `size` 6, 48, 5.99, 48.01 or `"26"`
- **THEN** size 6 draws a circle with `cy` 51.33, `r` 6 and `stroke-width` 1; size 48 a circle with `cy` 18.67, `r` 48 and `stroke-width` 8; the other three throw a `RangeError` naming `size`

#### Scenario: Fractional pin size
- **WHEN** `milestonePin({ x: 0, y: 100, text: "1", size: 18.123 })` is called
- **THEN** its circle has `cy` 41.9, `r` 18.123 and `stroke-width` 3.02, and its text node has `y` 48.95 and `font-size` 18.123

### Requirement: Count badge text size
`countBadge` SHALL take `textSize`, a number from 6 to 48, default `map.countTextSize`. With k = `textSize` / 11: without `height`, the height is `map.countHeight` × k rounded to two decimals; without `width`, a text of two or more characters is max(height, (6.4 × characters + 8) × k) wide, the product rounded to two decimals unless k is 1; the baseline is `cy + 4k`. When the height comes from `textSize`, "Room for the outline" checks that rounded height and names `textSize`.

#### Scenario: Larger count
- **WHEN** `countBadge` is called with `cx: 0`, `cy: 0`, `textSize: 22` and `text: "1"`, then `text: "12"`, then `text: "1"` with `textSize: 20` and `height: 30`
- **THEN** the first face is a circle of radius 16 and its text has `y` 8 and `font-size` 22; the second face is a rect 41.6 wide and 32 high; the third face is a circle of radius 15 and its text has `y` 7.27 and `font-size` 20

#### Scenario: Count text size 11 is the default
- **WHEN** `countBadge({ cx: 13.605, cy: 0, text: "128" })` is called with `textSize: 11` and without it
- **THEN** both trees are deep-equal

#### Scenario: Count text size bounds
- **WHEN** `countBadge({ cx: 0, cy: 0, text: "1" })` gets `textSize` 48, 6 with `height: 12`, 8.25, 8.249, 8.24, 5, 49, or 20 with `height: 10`
- **THEN** 48 draws a circle of radius 34.91 with text `y` 17.45 and `font-size` 48; 6 with height 12 a circle of radius 6 with text `y` 2.18 and `font-size` 6; 8.25 and 8.249 (derived height 12 after rounding) draw a circle of radius 6; 8.24 throws a `RangeError` naming `textSize` (derived height 11.99, below 12); 5 and 49 throw naming `textSize`; the last throws naming `height`

### Requirement: Message arrow heads
`messageArrow` SHALL take `heads`: `end` (default), `start` or `both`. A head at `from` points at `from` from the first of `c1`, `c2`, `to` that differs from `from` with `controls`, from the horizontal for a `bezier` not drawn straight, else along the segment; the path starts at its base. `both` needs a distance of 20 × `width`. `heads` with `head: false` is rejected naming `heads`; `head: true` is accepted.

#### Scenario: Two heads on a straight arrow
- **WHEN** `messageArrow({ from: [0, 0], to: [100, 0], curve: "straight", heads: "both" })` is called
- **THEN** its path `d` is `M12.5,0 L87.5,0`, then the polygon `100,0 87.5,5 87.5,-5`, then the polygon `0,0 12.5,-5 12.5,5`

#### Scenario: Head at the start of a curve
- **WHEN** `messageArrow({ from: [0, 0], to: [200, 100], heads: "start" })` is called, and then with `controls: [[0, 0], [100, 50]]`, `to: [100, 100]` and `heads: "both"`
- **THEN** the first path is `M12.5,0 C100,0 100,100 200,100` with one polygon `0,0 12.5,-5 12.5,5`; the second path is `M11.18,5.59 C0,0 100,50 100,87.5` and its start polygon is `0,0 13.42,1.12 8.94,10.06`

#### Scenario: Heads against head and room
- **WHEN** `messageArrow` from `[0, 0]` gets `to: [100, 0]` with `head: false` and `heads: "both"` or `heads: "end"`, `heads: "up"`, or `heads: "both"` with `to: [49.99, 0]`; and `heads: "both"`, `curve: "straight"`, `to: [50, 0]`
- **THEN** the first two throw a `RangeError` naming `heads`, the third names `heads`, the fourth names `to`; the last draws the path `M12.5,0 L37.5,0` and two polygons

### Requirement: Message arrow dash
`messageArrow` SHALL take `dashed`, a boolean. Without it, `reply`, `failure` and `failFast` are dashed and `message` is solid ("Message arrow kinds"). `dashed: false` draws any kind without `stroke-dasharray`; `dashed: true` adds the dash of "Message arrow kinds" to a `message`.

#### Scenario: Solid failure and dashed message
- **WHEN** `messageArrow({ from: [0, 0], to: [100, 0], curve: "straight" })` is called with `kind: "failure", dashed: false`, then with `dashed: true`, then with `dashed: "no"`
- **THEN** the first path has stroke `#E04848` and no `stroke-dasharray`, its head is `#E04848`; the second path has stroke `#121212` and `stroke-dasharray` `6 8` as its last attribute; the third throws a `RangeError` naming `dashed`

### Requirement: Piece calls of 0.5.0 unchanged
Every `milestonePin`, `countBadge`, `pill` and `messageArrow` call valid in 0.5.0, with each top-level `color.<state>` value written `color.state.<state>`, SHALL stay valid and draw the tree and the `toSvg` bytes pinned in `test/fixtures/pieces-0.5.0.json`, which this change regenerates once with 0.7.0 output and the same 44 calls except that rewrite.

#### Scenario: Frozen 0.5.0 calls
- **WHEN** the test re-calls the 44 calls of `test/fixtures/pieces-0.5.0.json`
- **THEN** all 44 trees deep-equal their pinned trees, and their body then text nodes through `toSvg`, joined with no separator, equal the pinned strings; the pill with ``text: "a `b` c"`` has the children `a `, a `tspan` holding `b`, and ` c`

#### Scenario: A changed pin is caught
- **WHEN** the default stem of `milestonePin` changes
- **THEN** the test fails and names the pin calls that differ

#### Scenario: Same 0.5.0 calls after the regeneration
- **WHEN** the regenerated fixture is compared with the 0.6.1 one
- **THEN** both list the same 44 calls in the same order with the same parameters, except that each `color.<state>` value (for example a `milestonePin` or `pill` `fill: "color.transitional"`) is now `color.state.<state>`

### Requirement: Mira and the pillar cast pieces
The package SHALL export `mira` and the pillar pieces `visor`, `drone`, `kiu`, `sinal`: pure functions of their parameters and the tokens, returning `{ body, text }`. Each accepts `x`, `y`, `surface`, `scale` (0.25 to 4), `view` (`front`, `back`) and `expression` (`idle`, `done`, `waiting`, `failed`; none on the back), plus its own actions: `needleAngle`, `carries`, `stride` (Mira); `holds`, `holdsSheet`, `points`, `facing` (Visor); `carries` (Drone); `steps` (Kiu).

#### Scenario: Mira state faces
- **WHEN** `mira({ x: 0, y: 0, expression: "done" })` and `mira({ x: 0, y: 0, expression: "waiting" })` are called
- **THEN** both return a valid `{ body, text }` tree, and the trees differ

#### Scenario: Every expression, both themes
- **WHEN** each of the five pieces is called once for each of `idle`, `done`, `waiting`, `failed`, with `surface: "light"` and again with `surface: "dark"`
- **THEN** every call returns a valid tree, and for each piece and theme the four trees are pairwise different

#### Scenario: Back view has no face
- **WHEN** `mira` is called with `view: "back"` and `expression: "done"`, and again with `expression: "failed"`
- **THEN** the two trees are identical (the back carries no face)

#### Scenario: Scale resizes without changing the drawing
- **WHEN** `mira({ x: 0, y: 0 })` and `mira({ x: 0, y: 0, scale: 0.25 })` are compared
- **THEN** the second tree's root group carries `scale(0.25)` in its transform and is otherwise the same tree as the first

#### Scenario: Unknown expression rejected
- **WHEN** `visor` is called with `expression: "confused"`, and again with an unknown parameter `face`
- **THEN** each throws a `RangeError` naming the parameter (`expression`, listing the four valid values; `face`, as an unknown parameter)

#### Scenario: Pure and token-only
- **WHEN** the no-colour-literals test scans `src/pieces/` after this change
- **THEN** it still finds nothing, including inside the new piece modules

#### Scenario: Visor's schema lists its actions
- **GIVEN** `PIECES.visor.schema`
- **WHEN** the test reads its keys
- **THEN** they include `holds` (boolean), `holdsSheet` (object), `points` (boolean) and `facing` (enum `right`, `left`), and none of `mira`, `drone`, `kiu` and `sinal` has `holdsSheet` or `facing` (the supporting cast's own schemas are in "Supporting cast follows the cast rules")

### Requirement: Bank objects
The package SHALL export one `bankObject({ name, x, y, surface, scale })` piece and `BANK_OBJECT_NAMES` (`courier`, `lume`, `carga`, `anel`, `modulo`, `hub`), each object drawn with the cast's idle eyes in `cast.eyes` on its screen and no other expression, for use on track covers; `modulo` has no inner strokes between its legs. A bank object SHALL NOT accept an `expression` or `face` parameter.

#### Scenario: Every bank object draws
- **WHEN** `bankObject` is called once for each name in `BANK_OBJECT_NAMES`, in both themes
- **THEN** every call returns a valid tree

#### Scenario: Idle eyes on every screen
- **WHEN** each bank object is drawn in both themes
- **THEN** each tree holds the idle eyes, filled `#FFC98A`, inside its screen, and the eyes are the same shapes in both themes

#### Scenario: Modulo legs
- **WHEN** `bankObject({ name: "modulo", x: 0, y: 0 })` is called
- **THEN** its tree holds no path `M-22 -40 L-32 -2 M22 -40 L32 -2`, the 0.6.1 drawing's two inner strokes between its legs

#### Scenario: Bank object has no face
- **WHEN** `bankObject({ name: "carga", x: 0, y: 0, face: "done" })` is called
- **THEN** it throws a `RangeError` naming `face` as an unknown parameter

### Requirement: Brand notation icons
The package SHALL export the brand notation, a family separate from the 26 diagram icons (`EIP_ICONS`, `EIP_ICON_NAMES`, `eipIcon`): `BRAND_NOTATION_ICON_NAMES` (19 camelCase names: 13 EIP, 3 delivery, 3 AI) and the piece `brandNotationIcon({ name, x, y, surface, scale })`. The two families share no export and no piece; the same pattern may carry the same word in both name lists (`splitter`, `aggregator`), each drawn only by its own piece.

#### Scenario: Two families, no shared export
- **WHEN** the package's exports are read
- **THEN** `brandNotationIcon` and `eipIcon` are different pieces, and `BRAND_NOTATION_ICON_NAMES` and `EIP_ICON_NAMES` are different lists

#### Scenario: Notation icon count
- **WHEN** `BRAND_NOTATION_ICON_NAMES` is read
- **THEN** it has exactly 19 entries

#### Scenario: Drawing a notation icon
- **WHEN** `brandNotationIcon({ name: "contentBasedRouter", x: 100, y: 100 })` is called
- **THEN** it returns a valid `{ body, text }` tree, and calling it with a name outside `BRAND_NOTATION_ICON_NAMES` throws a `RangeError` naming `name`

### Requirement: Category icon
The package SHALL export `CATEGORY_ICON_NAMES` and `categoryIcon({ category, x, y, scale })`: one group `translate(x y) scale(scale)` with a disc (centre 21, 21, radius 19.5, ring 1) then a glyph on the light surface at 9, 9, scale 0.5. Per category, the `coverBackground` pair and glyph: `integration` trackIntegration, pointToPointChannel; `delivery` trackDelivery, gateToProduction; `aiEngineering` trackAi, contextWindow; `personalTools` trackPersonal, its own glyph.

#### Scenario: Integration badge
- **WHEN** `categoryIcon({ category: "integration", x: 0, y: 0 })` is called
- **THEN** its body is one group with `transform` `translate(0 0) scale(1)` whose first child is a circle `cx` 21, `cy` 21, `r` 19.5, `fill` `#F7C6A1`, `stroke` `#E3AB84`, `stroke-width` 1, and whose second child is the group of `brandNotationIcon({ name: "pointToPointChannel", x: 9, y: 9, scale: 0.5, surface: "light" })`

#### Scenario: Personal tools category icon
- **WHEN** `categoryIcon({ category: "personalTools", x: 0, y: 0 })` is called
- **THEN** its disc is filled `#F4DD8E` and ringed `#DDC46C`, and the group's second child is a group `translate(9 9) scale(0.5)` holding its own glyph (the wrench-and-screwdriver path in `brand.light.text` and the bolt ring in `brand.light.accent`)

#### Scenario: One track tone per category
- **WHEN** each name of `CATEGORY_ICON_NAMES` is drawn
- **THEN** the names are `integration`, `delivery`, `aiEngineering` and `personalTools` in that order; the disc fills are `#F7C6A1`, `#B9DEC3`, `#C5CDF2` and `#F4DD8E` and the rings `#E3AB84`, `#98C6A5`, `#A5AEDA` and `#DDC46C`; and `delivery` and `aiEngineering` carry the `gateToProduction` and `contextWindow` glyphs

#### Scenario: Placed and scaled
- **WHEN** `categoryIcon({ category: "delivery", x: 10, y: 20, scale: 4 })` is called
- **THEN** its group's `transform` is `translate(10 20) scale(4)` and its children are those of the same call at 0, 0 and scale 1

#### Scenario: Unknown category rejected
- **WHEN** `categoryIcon` is called with `category: "news"`
- **THEN** it throws a `RangeError` naming `category`

#### Scenario: Surface no longer a parameter
- **WHEN** `categoryIcon` is called with `category: "delivery"` and `surface: "dark"`
- **THEN** it throws a `RangeError` naming `surface` as an unknown parameter

### Requirement: Fonts embedded in an SVG tree
`embedFonts(tree)`, async, SHALL resolve to a new tree with one `style` node right after the root's `desc` (or as its first child without one) holding one `@font-face` per face of the tree's drawn text ("Drawn text", "Face of a text", "Face weights"), each with `src: url(data:font/ttf;base64,…) format('truetype')` and a subset of only the characters drawn in that face. The input tree is not modified. A tree with no face to embed resolves deep-equal to the input.

#### Scenario: Cover tree with labels
- **WHEN** `embedFonts` gets the tree of a cover whose only text is the label `request` at `cover.labelWeight`
- **THEN** the result's root holds `title`, `desc`, then one `style` with exactly one `@font-face`, naming `Source Sans 3`, `font-weight:550 799` and `font-style:normal`, whose font holds the glyphs of `r`, `e`, `q`, `u`, `s`, `t` and no other character

#### Scenario: Tree without text
- **WHEN** `embedFonts` gets the tree of an `eipIcon` or a `stateStart` wrapped in an `svg`
- **THEN** it resolves to a tree deep-equal to the input, with no `style` node

#### Scenario: Character the face lacks
- **WHEN** a tree's only text is `漢 ok` in Source Sans 3
- **THEN** `embedFonts` resolves without error and the embedded subset holds the glyphs of `o`, `k` and the space but none for `漢`

#### Scenario: Same tree, same bytes
- **WHEN** `embedFonts` runs twice on the same tree, with other calls in between
- **THEN** `toSvg` of both results is byte-identical, and the input tree is not modified

### Requirement: Fonts entry point
`embedFonts` SHALL be exported only from the subpath `@brunosouzas/design-system/fonts` (`package.json` `exports["./fonts"]`, module `src/fonts/embed.ts`), never from the package root. The root entry (`src/pieces/index.ts`) imports nothing from `src/fonts/`, reads no file and loads no WebAssembly, so a browser bundle can import it; "Pure pieces" holds unchanged. The wasm module and the font files load only when a call needs them ("Fonts loaded on first need"), never at import.

#### Scenario: Root entry stays pure
- **WHEN** the test scans the imports (static, side-effect, dynamic `import()` and `require()`) of every module under `src/pieces/` and of every module reachable by relative imports from the root entry (the source of `package.json` `exports["."]`), and reads the root entry's exports
- **THEN** no module imports from `src/fonts/` or a `node:` module, and the root exports no `embedFonts`

#### Scenario: Nothing loads at import
- **WHEN** the test imports `src/fonts/embed.ts` with file reads and WebAssembly instantiation observed, then calls `embedFonts` once on a tree with one Source Sans 3 text
- **THEN** no font file is read and no wasm module instantiated before the call, and both have happened after it

#### Scenario: Subpath in the installed package
- **WHEN** the package test imports `embedFonts` from `@brunosouzas/design-system/fonts` in the installed package and passes it the `coverTree` of a valid cover spec with one `pill`, imported from the root
- **THEN** it resolves to a tree whose `style` holds one `@font-face` for `Source Sans 3`, and importing `embedFonts` from the root gives `undefined`

### Requirement: Fonts loaded on first need
`embedFonts` SHALL read only the font files of the faces its tree's drawn text resolves to, each file once per process, on the first call that needs it, and load the `harfbuzzjs` wasm module once, on the first call that has such a face. A tree with no drawn text in a shipped face loads neither. A failed load is not cached: that call rejects ("Font embedding failure") and the next call that needs the file or the module tries again.

#### Scenario: Only the faces used
- **WHEN** the test makes the read of the Source Code Pro Regular file fail and calls `embedFonts` twice on a tree whose only text is in Source Sans 3 at 700
- **THEN** both calls resolve with the `550 799` face, the Source Sans 3 Bold file is read once, and no other font file is read

#### Scenario: No shipped face, nothing loaded
- **WHEN** the test makes the instantiation of the `harfbuzzjs` wasm module fail and calls `embedFonts` on a text-free tree, then on a tree whose only text is in `Georgia, serif`
- **THEN** both calls resolve deep-equal to their input, with no `style` node, and no font file is read

#### Scenario: Failure not cached
- **WHEN** the read of the Source Sans 3 Bold file fails on a first call on a tree with a Source Sans 3 text at 700, and succeeds on a second call on the same tree
- **THEN** the first call rejects naming that file, the second resolves with the `550 799` face, and the file has been read twice

#### Scenario: Subsetter not resolvable, not cached
- **WHEN** the resolution of the `harfbuzzjs` wasm file fails on a first call on a tree with a Source Sans 3 text at 400, before any await, and succeeds on a second call on the same tree
- **THEN** the first call rejects naming `harfbuzzjs`, the second resolves with the `100 549` face, and the wasm file has been resolved twice

### Requirement: Drawn text
The drawn text of a tree SHALL be the string children of its `text` and `tspan` nodes, excluding every string inside a `title`, `desc` or `style` subtree, wherever that subtree sits. Each string is drawn in the face of the nearest `text` or `tspan` that holds it.

#### Scenario: Title inside a text
- **WHEN** `embedFonts` gets an `svg` whose only `text`, in Source Sans 3 at 700, holds `a`, a `title` holding `tooltip`, then `b`
- **THEN** the one `@font-face`'s subset holds the glyphs of `a` and `b` and none of `t`, `o`, `l`, `i`, `p`

#### Scenario: Icon with only a title and a description
- **WHEN** `embedFonts` gets the `coverTree` of the `eip-splitter` fixture, whose root holds a `title` and a `desc` but no `text`
- **THEN** it resolves deep-equal to the input, with no `style` node

### Requirement: Face of a text
A text's family, weight and style SHALL be its own `font-family`, `font-weight` and `font-style`, or the nearest ancestor's. The family is the first comma-separated entry, trimmed, quotes stripped, compared exactly with `Source Sans 3`, `Source Code Pro` and `Source Serif 4`; any other family adds no face. An `italic` or `oblique` run uses the upright face of its weight. A face is embedded only when one of its drawn characters has a glyph in it.

#### Scenario: Label with a code run
- **WHEN** `embedFonts` gets a tree holding ``edgeLabel({ x: 0, y: 0, lines: ["adopts a `correlationId`"] })``
- **THEN** the `style` holds two faces in this order: `Source Code Pro` at `550 900` (the `tspan`, whose own `font-family` wins) holding `correlationId`'s characters, then `Source Sans 3` at `550 799` holding those of `adopts a `

#### Scenario: Family names compared exactly
- **WHEN** four texts at 400 have the `font-family` `"Source Sans 3", serif`, then `'Source Code Pro' , monospace` with a leading space, then `source sans 3, sans-serif`, then `'Source Serif 4', serif`
- **THEN** the faces are `Source Code Pro` and `Source Sans 3`, both at `100 549`, then `Source Serif 4` at `100 900`, and the lower-case family adds none

#### Scenario: First family outside Source
- **WHEN** a tree's only text has `font-family` `Georgia, serif`
- **THEN** `embedFonts` returns the tree unchanged, with no `style` node

#### Scenario: Italic and oblique runs
- **WHEN** a `g` with `font-style` `oblique` and `font-weight` 700 holds a Source Sans 3 text `ab`, beside a Source Sans 3 text `cd` with `font-style` `italic` at 700 and a text `ef` at 700
- **THEN** the `style` holds one `@font-face`, `Source Sans 3` at `550 799` with `font-style:normal`, whose subset holds the glyphs of `a` to `f`

#### Scenario: Text the face lacks
- **WHEN** a tree's only text is `漢字` in Source Sans 3 at 700
- **THEN** `embedFonts` resolves to a tree deep-equal to the input, with no `style` node

### Requirement: Face weights
A text's weight SHALL be 400 when its resolved `font-weight` is missing, `normal`, `bolder`, `lighter` or a non-numeric string, 700 for `bold`, and otherwise its number. Each `@font-face` declares a range (Source Sans 3: `100 549`, `550 799`, `800 900`; Source Code Pro: `100 549`, `550 900`; Source Serif 4: `100 900`, its one face); a weight takes the first face whose range's upper bound it does not exceed, so a fraction between two ranges takes the heavier face, as browser matching does.

#### Scenario: Weights snapped
- **WHEN** texts are drawn in Source Sans 3 at 549, 549.5, 550, 799, 799.5 and 800, and in Source Code Pro at 549, 549.5, 550 and 900
- **THEN** the `style` holds five faces: `Source Code Pro` `100 549` (the 549 text), `Source Code Pro` `550 900` (the 549.5, 550 and 900 texts), `Source Sans 3` `100 549` (the 549 text), `Source Sans 3` `550 799` (the 549.5, 550 and 799 texts) and `Source Sans 3` `800 900` (the 799.5 and 800 texts)

#### Scenario: Weight keywords
- **WHEN** Source Sans 3 texts have no `font-weight`, then `normal`, `bold`, `bolder`, `lighter` and `heavy`
- **THEN** the `bold` text uses the `550 799` face and the five others share the `100 549` face

#### Scenario: One serif face for every weight
- **WHEN** texts are drawn in Source Serif 4 at 400, 700 and 900
- **THEN** the `style` holds one face, `Source Serif 4` at `100 900`, whose subset holds the characters of all three texts

### Requirement: Order of the faces
The `@font-face` rules SHALL be ordered by family name in code-point order, then by weight ascending; each rule names `font-family`, `font-weight` (its range) and `font-style:normal`, the only style shipped.

#### Scenario: Every sort key
- **WHEN** a tree draws, in this order, Source Serif 4 at 700, Source Sans 3 at 900, Source Code Pro at 700, Source Sans 3 italic at 400 and Source Code Pro at 400
- **THEN** the rules are `Source Code Pro` `100 549`, `Source Code Pro` `550 900`, `Source Sans 3` `100 549`, `Source Sans 3` `800 900`, `Source Serif 4` `100 900`, each with `font-style:normal`

### Requirement: Font embedding failure
When a font file cannot be read or the WebAssembly module fails to load, `embedFonts` SHALL reject with an `Error` naming the cause: the path of the file that could not be read, or `harfbuzzjs` for the module. It never resolves with a tree that lacks a face its text uses.

#### Scenario: Unreadable font file
- **WHEN** the test makes the read of the Source Sans 3 Bold file in `fonts/` fail and calls `embedFonts` on a tree with a Source Sans 3 text at 700
- **THEN** the promise rejects with an `Error` whose message holds that file's path

#### Scenario: WebAssembly fails to load
- **WHEN** the test makes the instantiation of the `harfbuzzjs` wasm module fail and calls `embedFonts` on a tree with text
- **THEN** the promise rejects with an `Error` whose message names `harfbuzzjs`

### Requirement: Fonts shipped with the package
The package SHALL ship in `fonts/` the unmodified static TTF files of the faces the pieces draw, Source Sans 3 3.052R (Regular, Bold, Black), Source Code Pro 2.042R (Regular, Bold) and Source Serif 4 4.005R (Bold), with `OFL.txt`; their SHA-256 sums are in `test/fixtures/fonts-sha256.json`. `embedFonts` reads only these files, never the network, through `harfbuzzjs`, the package's one runtime dependency, pinned exactly. The piece modules stay free of file access.

#### Scenario: Files in the installed package
- **WHEN** the package test packs and installs the package
- **THEN** the installed `fonts/` holds the six TTF files and `OFL.txt`, each TTF byte-identical to the repository's copy

#### Scenario: Release files verified
- **WHEN** the test hashes every TTF file in the repository's `fonts/`
- **THEN** there are exactly six, and each SHA-256 equals its entry in `test/fixtures/fonts-sha256.json`

#### Scenario: A changed font file is caught
- **WHEN** the hash check runs on a copy of `fonts/` where one TTF differs by one byte, and on a copy holding a seventh TTF
- **THEN** each run fails naming that file

#### Scenario: Font file missing
- **WHEN** one of the six files is absent from the packed package
- **THEN** the package test fails naming that file

#### Scenario: One pinned dependency
- **WHEN** the test reads `package.json`
- **THEN** `dependencies` holds exactly `harfbuzzjs`, at an exact version with no range, and the scan of `src/pieces/` still finds no `node:` import

### Requirement: No hard offset shadow
No piece SHALL draw a hard offset shadow (ADR 0009): each of the 26 cover pieces draws each shape once, with no ink copy behind it, whatever offset it used before 0.7.0. `shadowed(shape, offset)`, still exported, returns the shape alone when `offset` is 0 (its default, `shadow.block`, is 0), and otherwise an ink copy translated by the offset before the shape's own transform, then the shape.

#### Scenario: Sheet without a shadow
- **WHEN** `sheet` draws its page at `x` 300, `y` 112
- **THEN** the first body node is the page `rect` at (300, 112) with `fill` `#FFFFFF` and no `transform`, and no body node is filled `#121212` with a `translate` transform

#### Scenario: Every cover piece is flat
- **WHEN** each of the 26 cover pieces is drawn with its required parameters
- **THEN** no body node is an ink-filled copy, translated, of the node after it

#### Scenario: Shadow of a turned shape
- **WHEN** a shape with `transform="rotate(30)"` is passed to `shadowed` with offset 8, and then with offset 0
- **THEN** the first result is the ink copy with transform `translate(8 8) rotate(30)` then the shape; the second is the shape alone

### Requirement: Ink on the dark surface
On the dark surface, every ink stroke on the dark background or on a dark face SHALL take `surface.dark.muted` instead of `color.ink`: sticker outlines, the `storeNode` lid, the `queueNode` rails, a flat `lineBadge`'s outline, the `renewalRing` ink band, emote outlines, rays and Z casings, the `linkIcon` face outline. Marks over a light or state fill (`?`, `!`, ticks, crosses, the bulb filament, link glyphs) or on a white face (`ledgerMark`'s stations, on its white page) stay `color.ink`.

#### Scenario: Stickers and diagram strokes on dark
- **WHEN** `stationMarker`, `storeNode`, `queueNode` and a flat `lineBadge` are drawn with `surface: "dark"`
- **THEN** the marker's face, the store's face and lid, the queue's face and rails, and the badge's outline are stroked `#ADA79D`, and none of them holds a stroke `#121212`

#### Scenario: Emote on dark
- **WHEN** `problem` and `waiting` are drawn with `surface: "dark"`
- **THEN** every outline, ray and Z casing is stroked `#ADA79D`, the `!` mark stays `#121212`, the group holds no `rim` group and no shadow copy, and it has as many children as the light call

#### Scenario: Link icon on dark
- **WHEN** `linkIcon({ icon: "github", x: 0, y: 0, surface: "dark" })` is called
- **THEN** its face rect is filled `#FFFFFF` and stroked `#ADA79D`, and the glyph inside it keeps `#121212`

#### Scenario: Stations inside the ink square
- **WHEN** `ledgerMark({ x: 0, y: 0, surface: "dark" })` is called
- **THEN** its page `rect` is filled `#FFFFFF` and stroked `#ADA79D`, and its two station circles are filled `#FFFFFF` and stroked `#121212`

#### Scenario: Light surface unchanged
- **WHEN** `stationMarker`, `storeNode`, `queueNode`, a flat `lineBadge`, `renewalRing`, `ledgerMark`, `linkIcon` and the emotes `problem` and `waiting` are each drawn with `surface: "light"` and without `surface`
- **THEN** both trees of each piece are deep-equal, their ink strokes are `#121212`, and `#ADA79D` appears in neither

### Requirement: Robot in the v2 grammar
`robot({ cx, top })` SHALL draw a white body and white ears, a `brand.light.text` visor showing the cast's idle eyes in `cast.eyes`, one grille bar in `brand.light.border`, and an antenna tip in `brand.light.accent`. No shape takes a state colour: the 0.6.1 green body, green ears and eyes, three mouth bars and orange `color.blocked` tip are gone.

#### Scenario: V2 robot
- **WHEN** `robot({ cx: 400, top: 140 })` is called
- **THEN** its body fills are only `#FFFFFF`, `#121212`, `#FFC98A`, `#E04E17` and `#D7D1C5`, with `#FFC98A` inside the visor and exactly one grille bar filled `#D7D1C5`, and no fill is `#3DDC84`, `#2BB673` or `#FF8A3D`

#### Scenario: Robot takes no colour
- **WHEN** `robot` gets `fill: "color.state.healthy"`
- **THEN** it throws a `RangeError` naming `fill` as an unknown parameter

### Requirement: White defaults of the cover pieces
Without a colour from the caller, `serverStack`, `gear`, `parcel`, `steps`, `speechBubble`, `nameTag`, `milestonePin` and `rail` SHALL draw their main fill in `color.white`, with `serverStack`'s bars in `illustration.textBar`, `gear`'s hub in `brand.light.bg`, `speechBubble`'s line in `illustration.textBar` and `rail`'s centre line in `brand.light.border`; `muleFlow`'s default bar is `brand.light.bg`. A colour the caller passes is drawn as given.

#### Scenario: Defaults
- **WHEN** each of the nine pieces is drawn with only its required parameters
- **THEN** the main fill of the first eight is `#FFFFFF`, `serverStack`'s bars are `#D7D1C5`, `gear`'s hub is `#F6F3EC`, `rail`'s centre line is `#D7D1C5`, and `muleFlow`'s bar is `#F6F3EC`

#### Scenario: Explicit colour still drawn
- **WHEN** `serverStack` gets `fill: "color.state.backend"` and `gear` gets `fill: "color.state.transitional"`
- **THEN** the units are filled `#FF6B6B` and the gear `#FFD25A`

#### Scenario: Failing light keeps its meaning
- **WHEN** `serverStack` gets `units: 3` and `failing: 1`
- **THEN** that unit's light is `#E04848` and every other unit is white

### Requirement: Ink defaults on pale backgrounds
`arcArrow` SHALL default its `color` to `color.ink`, because white vanishes on the pale backgrounds, and `priceTag` SHALL draw its string in `color.ink`. A `color` the caller passes to `arcArrow` is drawn as given.

#### Scenario: Default arc arrow and price tag string
- **WHEN** `arcArrow` is drawn with only its points, and `priceTag` with a `stringFrom`
- **THEN** the arrow's path and head are `#121212`, and the tag's string is stroked `#121212`

#### Scenario: White arc arrow on request
- **WHEN** `arcArrow` gets `color: "color.white"`
- **THEN** its path and head are `#FFFFFF`

### Requirement: Folder, browser window and book in the v2 grammar
`folder` SHALL draw a white front over a `brand.light.border` back; `browserWindow` SHALL draw its three dots in `color.white` and a `brand.light.bg` hero block; `book` SHALL draw no ink shape behind or offset from its front cover (the 0.6.1 offset ink back page goes), and its spine stays `color.ink`.

#### Scenario: V2 drawings
- **WHEN** `folder`, `browserWindow` and `book` are drawn with their required parameters
- **THEN** the folder's fills are `#FFFFFF` and `#D7D1C5`; the window's three dots are filled `#FFFFFF` (0.6.1: `#FF6B6B`, `#FFD25A`, `#3DDC84`) and its hero block `#F6F3EC`; the book's only shape filled `#121212` is its spine, the 20-wide rect at (`x`, `y`), with no ink rect behind the front cover or offset from it

#### Scenario: Folder takes no colour
- **WHEN** `folder` gets `fill: "color.white"`
- **THEN** it throws a `RangeError` naming `fill` as an unknown parameter

### Requirement: Code panel lines in the v2 grammar
`codePanel` SHALL draw each line in `brand.dark.textMuted`, a line whose `color` is `white` in `brand.dark.text`, and a `tall` line (the one under review) in `brand.dark.accent` whatever its `color`. The `color` enum keeps its values (`healthy`, `caller`, `white`, `backend`), so existing specs stay valid.

#### Scenario: Lines by kind
- **WHEN** `codePanel` gets lines with `color` `healthy`, `caller`, `white`, `backend`, and a `healthy` line with `tall: true`
- **THEN** the lines are filled `#ADA79D`, `#ADA79D`, `#F1EEE8`, `#ADA79D` and `#FF7A45`, on a panel `#1D1C1A`

#### Scenario: Unknown line colour
- **WHEN** a line has `color: "red"`
- **THEN** it throws a `RangeError` naming `lines[0].color`

### Requirement: Sheet marks in the v2 grammar
By default `sheet` SHALL draw a checked box in `color.ink` with a `color.white` tick, and a question row's `?` on a white disc; a row's `tail` check keeps `color.state.healthy`, a done check. `leadFill` and `tick`, when given, are drawn as given.

#### Scenario: Default marks
- **WHEN** `sheet` gets rows with `lead` `checked`, `lead` `question` and `tail` `check`
- **THEN** the checked box is `#121212` with a tick stroked `#FFFFFF`, the question disc is `#FFFFFF` with its `?`, and the tail box is `#3DDC84`

#### Scenario: Given lead colour
- **WHEN** the same sheet gets `leadFill: "color.state.caller"`
- **THEN** the checked box is `#8FB2FF`

### Requirement: Emote colours
An emote SHALL draw no shadow, its idea bulb in `cast.eyes` and its base in `brand.light.border`, no disc behind a burst (rays only), its drops and Zs in `color.white`, and its heart in `brand.light.accent`; `problem` and `refused` keep `color.state.failure` and `worked` `color.state.healthy`. It reads no `cast` colour other than `cast.eyes`.

#### Scenario: Idea and liked
- **WHEN** `idea` and `liked` are drawn
- **THEN** the bulb is `#FFC98A`, its base `#D7D1C5`, the heart `#E04E17`, and no shape is a translated ink copy

#### Scenario: Every colour is allowed
- **WHEN** every kind is drawn with and without its burst, on both surfaces
- **THEN** every `fill` and `stroke` is `none` or the value of `color.white`, `color.ink`, `surface.dark.muted`, `cast.eyes`, `brand.light.border`, `brand.light.accent`, `color.state.failure` or `color.state.healthy`

### Requirement: Emote look frozen
For each emote call in `test/fixtures/emote-0.7.0.json` (each kind, with and without its burst, on both surfaces, at scale 1 and 2), the SHA-256 of `toSvg(g({}, ...body, ...text))` SHALL equal the call's recorded hash. The fixture is written once in this change from the drawing the owner approved, and replaces `cast-0.5.0.json` and `cast-dark-0.5.2.json`.

#### Scenario: Every call matches
- **WHEN** the test re-makes each call of the fixture
- **THEN** every hash matches

#### Scenario: A changed drawing is caught
- **WHEN** one coordinate of the idea's bulb changes
- **THEN** the test fails and names the calls whose hash differs

### Requirement: Emotes carry their own stroke
Every shape `emote` draws, on either surface, SHALL carry its own `stroke` or sit in a group of the piece that sets one, so an emote draws the same inside the cover command's outlined group as on its own. No shape SHALL use a colour outside the tokens.

#### Scenario: Inside the outlined group
- **WHEN** the test walks every emote with and without its burst, on `light` and on `dark`
- **THEN** every `circle`, `ellipse`, `rect`, `path` has a `stroke` attribute or an ancestor `g` inside the piece that has one, and every `fill` and `stroke` is `none` or a token value

### Requirement: Catalogue sheet in Source
`npm run pieces:sheet` SHALL pass the sheet's tree through `embedFonts` before writing, so the owner's Chrome review of the sheet shows the pieces' text and the name labels in Source. When `embedFonts` rejects, the command prints the error's message, exits 1 and writes nothing.

#### Scenario: Sheet carries its faces
- **WHEN** `npm run pieces:sheet -- --out <file.svg>` runs
- **THEN** it prints `wrote <file>`, and the written SVG's first child is a `style` whose `@font-face` rules include `Source Code Pro` at `550 900` (the name labels) and `Source Sans 3` at `550 799` (the pieces' labels), each with a `data:font/ttf;base64,` source

#### Scenario: Sheet font failure
- **WHEN** the test makes a font file unreadable and runs the sheet with `--out sheet.svg`
- **THEN** the command prints the `Error`'s message, naming the file, exits 1, and `sheet.svg` does not exist

### Requirement: Dark catalogue sheet
`npm run pieces:sheet -- --out <file.svg> --surface dark` SHALL write the sheet on a `surface.dark.background` page drawing every piece that takes `surface` with `surface: "dark"` in a dark cell labelled in `surface.dark.text`, and the others in their light cell as on the light sheet, its fonts embedded as on the light sheet. `--surface light`, or no `--surface`, writes the light sheet. Any other value prints the problem and the usage, exits 1 and writes nothing.

#### Scenario: Dark sheet
- **WHEN** `npm run pieces:sheet -- --out dark.svg --surface dark` runs
- **THEN** it prints `wrote dark.svg`; the page rect is filled `#121110`; the `storeNode` face is filled `#1D1C1A` and stroked `#ADA79D`; the `gear` cell (no `surface`) keeps its light cell and shapes; and the first child is a `style` holding a `Source Code Pro` face at `550 900`

#### Scenario: Unknown sheet surface
- **WHEN** `npm run pieces:sheet -- --out dark.svg --surface blue` runs
- **THEN** it prints a line naming `--surface` and `blue`, then `usage: npm run pieces:sheet -- --out <file.svg> [--surface light|dark]`, exits 1, and `dark.svg` does not exist

### Requirement: V2 palette of every piece
Each of the 67 pieces drawn with its defaults, on `light` and on `dark` when it takes `surface` and once otherwise, SHALL use as `fill` and `stroke` only `none` or the value (hex, not path) of a `brand.*` token but `stackledgerAccent`, a `surface.*` token, a default track ring (`coverBackground.track*.ring`), `color.white`, `color.ink`, `color.ring`, `color.panel`, an `illustration.*` token or `cast.eyes`; a `color.state.*` value only where "State colours that keep a meaning" names it.

#### Scenario: Every piece in the v2 palette
- **WHEN** the test walks every node of each piece's required-only call of the catalogue test (`REQUIRED_ONLY`), with every required colour parameter (`rail.nodes`, `lineBadge.fill`, `pipe.fill`, `zone.fill`, `phaseBand.fill`) set to `illustration.accent`, `emote` drawn once per kind, `categoryIcon` drawn once per category, plus a `sheet` with a `tail` check, a `serverStack` with `failing: 1`, a `visor` holding a sheet with a `question` row and a `tail` check, facing right and facing left, and, on both surfaces and facing both ways, a `balao` speaking, a `balao` holding a stamp, a `chaves` typing, pointing, and holding a sheet with a `question` row and a `tail` check
- **THEN** each `fill` and `stroke` is `none` or one of those values, a `color.state.*` value appears only on a piece's part listed in "State colours that keep a meaning" (the node of that part, not another node of the same piece), and each listed part the call draws holds its state value

#### Scenario: Dark card on a piece without a surface
- **WHEN** the check walks `codePanel`, which takes no `surface`, with one line of each `color` and a `tall` line
- **THEN** it passes: the panel `#1D1C1A` and the lines `#ADA79D`, `#F1EEE8` and `#FF7A45` are values of `brand.dark.*`

#### Scenario: A decorative state colour is caught
- **WHEN** the palette check is given a `gear` tree whose body is filled `#FFD25A` (its 0.6.1 default, `color.transitional`), then a `checkBadge` tree whose tick is also stroked `#3DDC84`
- **THEN** it reports `gear` and `#FFD25A`, then `checkBadge`, `#3DDC84` and the tick's node, though the badge's disc may be `#3DDC84`

#### Scenario: Only the default track rings
- **WHEN** the palette check is given a `pill` tree filled `#E0ABC0` (`coverBackground.personalRose.ring`)
- **THEN** it reports `pill` and `#E0ABC0`, while every `categoryIcon` call passes

#### Scenario: The product accent is caught
- **WHEN** the palette check is given a `pill` tree filled `#3B5BDB` (`brand.light.stackledgerAccent`)
- **THEN** it reports `pill` and `#3B5BDB`: a product's accent is drawn only where a spec names it

### Requirement: State colours that keep a meaning
A `color.state.*` value SHALL appear in the output of "V2 palette of every piece" only where it means a state: `checkBadge`'s disc and a `tail` check on a `sheet` or on the sheet Visor or Chaves holds (done), `stamp`'s face, also the stamp Balão holds (approved), `serverStack`'s failing light, the emotes `problem`, `refused` (failure) and `worked` (done), `renewalRing`'s inner band (renewal due), an owned `licenceMark`, and `eipIcon` and `nameTag`'s icon ("Icon colours").

#### Scenario: State colours where they mean a state
- **WHEN** `checkBadge`, `stamp`, `licenceMark` and `renewalRing` are drawn with their required parameters
- **THEN** the badge's disc, the stamp's face and the licence's face are `#3DDC84`, and the ring's inner band is `#FF8A3D`

#### Scenario: Failing light only when failing
- **WHEN** `serverStack` is drawn with `units: 3`, once without `failing` and once with `failing: 1`
- **THEN** the first holds no `color.state.*` value, and the second holds `#E04848` only on that unit's light

#### Scenario: A held sheet's check
- **GIVEN** Visor holding a sheet whose only row has `tail: "check"`, and the same Visor without the tail
- **WHEN** both are drawn
- **THEN** the first holds `#3DDC84` only on the tail box, and the second holds no `color.state.*` value

#### Scenario: The supporting cast's state colours
- **GIVEN** `balao` with and without `holdsStamp: { word: "GO" }`, and `chaves` holding a sheet whose only row has `tail: "check"`, with and without the tail
- **WHEN** they are drawn
- **THEN** the stamp's face is `#3DDC84` and the call without the stamp holds no `color.state.*` value; the sheet's tail box is `#3DDC84` and the sheet without the tail holds no `color.state.*` value

### Requirement: Headline
`headline` SHALL draw its 1 to 4 `lines` (non-empty strings, drawn as written) in one `g` with `data-piece` `headline`, returned as its `text` with an empty `body`: `font.serif` at `font.weightBold`, integer `size` 24 to 160 (default 64), `letter-spacing` −`size`/100 in user units, fill `brand.<surface>.text` (`surface` default light), `text-anchor` = `anchor` (default start). Line `i` (from 0) sits at `x` as given and `y` + `i` × 1.1 × `size`, rounded to two decimals.

#### Scenario: Three lines at 96
- **WHEN** `headline({ x: 140, y: 190, lines: ["Code that runs", "for the problem", "you have."], size: 96 })` is called
- **THEN** its `body` is empty and its `text` is one `g` with `data-piece` `headline`, `font-family` `'Source Serif 4', Georgia, 'Times New Roman', serif`, `font-size` 96, `font-weight` 700, `letter-spacing` -0.96, `fill` `#121212` and `text-anchor` `start`, holding three `text` nodes at (140, 190), (140, 295.6) and (140, 401.2) with those strings

#### Scenario: Defaults and the dark surface
- **WHEN** `headline({ x: 600, y: 100, lines: ["Title"], anchor: "middle", surface: "dark" })` is called
- **THEN** the group has `font-size` 64, `letter-spacing` -0.64, `fill` `#F1EEE8` and `text-anchor` `middle`

#### Scenario: Out-of-range parameters
- **WHEN** `headline` gets `lines: []`, then five lines, then `lines: [""]`, then `size: 200`, then `size: 24.5`, then `anchor: "left"`, then `surface: "navy"`
- **THEN** each call throws a `RangeError` naming `lines`, `lines`, `lines[0]`, `size`, `size`, `anchor` and `surface` in turn

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

### Requirement: The brunosouzas link icon
`linkIcon` with `icon: "brunosouzas"` SHALL draw, after the face, one group `translate(5.56 6.52) scale(0.875)` holding the brand symbol's three shapes exactly as `symbol` draws them on the light surface (`brand.light.text` haste and ring, `brand.light.accent` moon), on both surfaces, every shape inside the face. Its title is `brunosouzas.com` and its description `brunosouzas.com icon: the brand symbol, a b with a moon.`

#### Scenario: brunosouzas on light
- **WHEN** `linkIcon({ icon: "brunosouzas", x: 0, y: 0 })` is called
- **THEN** its group holds, in order, the face rect (2, 2) 38 × 38 radius 9 fill `#FFFFFF` stroke `#121212` at 2.5 and a group `translate(5.56 6.52) scale(0.875)` holding the rect (5, 3) 5.5 × 26 radius 2.75 filled `#121212`, the circle (17.5, 20.5) r 7.3 with no fill stroked `#121212` at 4.6, then the circle (27.5, 9) r 2.8 filled `#E04E17`, and nothing else

#### Scenario: brunosouzas on dark
- **WHEN** `linkIcon({ icon: "brunosouzas", x: 0, y: 0, surface: "dark" })` is called
- **THEN** only the face rect's stroke differs from the light call, `#ADA79D`; the haste and ring stay `#121212` and the moon `#E04E17`

#### Scenario: Same drawing as the symbol
- **WHEN** the glyph group's children are compared with the shapes inside the group of `symbol({ x: 0, y: 0 })`
- **THEN** they are equal, node for node

#### Scenario: Glyph inside the face, brunosouzas
- **WHEN** the test computes the box of each glyph shape through the group's transform, widened by half its stroke width
- **THEN** every box lies within 2 to 40 on both axes, and the box of all three (about x 9.9 to 32.1, y 9.1 to 32.9) has its centre within 0.01 of the face's centre (21, 21)

#### Scenario: brunosouzas in an icon spec
- **WHEN** an icon spec holds `{ "piece": "linkIcon", "icon": "brunosouzas" }` with a title and a description, on light and with `surface: "dark"`
- **THEN** the command writes a 46 x 46 SVG holding the icon, and the palette check passes the drawn tree on both surfaces

### Requirement: Each link icon stands alone
Each link icon, `brunosouzas` included, SHALL be its own piece call and its own file: one `linkIcon` call draws one icon, and an icon spec (`format: "icon"`) holding that one piece writes it alone, 46 x 46. The package SHALL have no piece, format or export that draws several link icons as one image; a consumer lays its icons out itself, and the row of icons in this change's evidence is a gate image only, not an asset.

#### Scenario: Two link icons in one icon spec
- **WHEN** an icon spec holds two pieces, `linkIcon` `brunosouzas` and `linkIcon` `website`
- **THEN** `pieces` is reported as "an icon spec holds exactly one piece: eipIcon, uiIcon, linkIcon or categoryIcon", the command exits 1 and writes nothing

#### Scenario: No combined link icons in the package
- **WHEN** the package root's exports and the names of `PIECES` are read
- **THEN** the only export whose name matches `/link.?icon|icon.?row|links/i` are `LINK_ICONS`, `LINK_ICON_NAMES`, `LINK_ICON_SIZE` and `linkIcon`, and the only piece among them is `linkIcon`

### Requirement: Visor holds a sheet
`visor` SHALL take `holdsSheet`, an object, to hold a sheet in its left hand instead of the card: the page and rows as `sheet` draws them, with the marks on the page in ink, and an optional `label` pill as `pill` draws it, in one group with `data-held` `sheet` (`stroke` the skin's outline, `stroke-width` `outline.block`, round joins), drawn before the body. The card is not drawn; the hand is over the sheet's edge (design §2). Its words (`?`, label), if any, are Visor's `text`.

#### Scenario: Sheet in the left hand
- **GIVEN** `visor({ x: 0, y: 0, holdsSheet: { width: 130, height: 218, rows: [{ lead: "question", bar: 40 }], label: "proposal.md" } })`
- **WHEN** it is drawn
- **THEN** the root group holds two children: first a `g` with `data-held` `sheet`, `stroke` `#121212`, `stroke-width` 4 and `stroke-linejoin` `round`, whose children deep-equal `sheet({ x: -228, y: -222, width: 130, height: 218, rows: [{ lead: "question", bar: 40 }] }).body` with `stroke` `#121212` added to its marks group (the `g` with `stroke-width` 3), followed by `pill({ x: -163, y: -222, text: "proposal.md" }).body`; then the body group, with no transform, whose children deep-equal those of `visor({ x: 0, y: 0, holds: true })`'s body group without the card (the rect filled `#E04E17`, 28 wide and 24 high), so the left hand is the circle at (−92, −66), radius 15

#### Scenario: The sheet's words are Visor's text
- **GIVEN** the call of "Sheet in the left hand"
- **WHEN** its `text` is read
- **THEN** it holds one `g` with `transform` `translate(0 0) scale(1)`, `font-family` `font.sans`, `font-size` 19, `font-weight` 700, `fill` `#121212` and `text-anchor` `middle`, holding the `?` text node at (−198, −158) with `font-size` 19 and `font-weight` 900, then a text node at (−163, −215) holding `proposal.md`

#### Scenario: Held sheet on the dark surface
- **GIVEN** the call of "Sheet in the left hand" with `surface: "dark"`
- **WHEN** it is drawn
- **THEN** the held group's `stroke` is `#ADA79D` (the page's and the pill's outlines, on the dark background), the marks group keeps `stroke` `#121212` (marks over the white page stay ink, ADR 0009), the page is filled `#FFFFFF`, and the text group's `fill` stays `#121212`

#### Scenario: Held sheet scales with Visor
- **GIVEN** the call of "Sheet in the left hand" with `x: 480`, `y: 440` and `scale: 1.15`
- **WHEN** it is drawn
- **THEN** the root group's and the text group's `transform` are both `translate(480 440) scale(1.15)`, and the held group's children are the same as at scale 1

#### Scenario: Answered sheet
- **GIVEN** `holdsSheet` with `rows: [{ lead: "question", bar: 40, tail: "check" }]`, `width: 150`, `height: 120`
- **WHEN** Visor is drawn
- **THEN** the held group holds the tail box filled `#3DDC84` with its tick stroked `#121212`, as `sheet` draws them

#### Scenario: No sheet, no text
- **GIVEN** `visor({ x: 0, y: 0 })` and `visor({ x: 0, y: 0, holds: true })`
- **WHEN** they are drawn
- **THEN** both `text` arrays are empty and neither body holds a `data-held` group

#### Scenario: The hand clears the row marks
- **GIVEN** `holdsSheet` `{ width: 150, height: 120, rows: [{ lead: "question", bar: 40, tail: "check" }] }`, facing right and facing left
- **WHEN** Visor is drawn
- **THEN** the left hand (radius 15, outline 8, at x −92 or 92) overlaps the page's edge, and no lead mark or tail check of the held sheet, with its outline, reaches under it

#### Scenario: Sheet without words
- **GIVEN** `visor({ x: 0, y: 0, holdsSheet: { width: 130, height: 120, rows: [{ bar: 40 }, { lead: "checked", bar: 30 }] } })`
- **WHEN** it is drawn
- **THEN** it draws the held group and its `text` is empty, with no empty text group

### Requirement: Held sheet parameters
`holdsSheet` SHALL take `width` (80 to 300) and `height` (80 to 400), both required; `rows`, required, 1 to 8 rows of the `sheet` row shape (`lead`, `bar`, `tail`); `top` and `step`, sizes as in `sheet` (defaults 46 and 38); and `label`, a non-empty string. Any other field is unknown. With `holdsSheet`, `holds: true` and `view: "back"` are refused (a card or a sheet, not both; the sheet only in front). A `RangeError` names the first problem, the schema's before these.

#### Scenario: Card and sheet together
- **GIVEN** `visor({ x: 0, y: 0, holds: true, holdsSheet: { width: 130, height: 218, rows: [{ bar: 40 }] } })`
- **WHEN** it is called
- **THEN** it throws a `RangeError` with the message `visor: holdsSheet: Visor holds a card or a sheet, not both`

#### Scenario: Sheet seen from behind
- **GIVEN** a valid `holdsSheet` with `view: "back"`, then with `view: "back"` and `holds: true`
- **WHEN** Visor is called
- **THEN** the first throws a `RangeError` with the message `visor: holdsSheet: Visor holds a sheet only in the front view`; the second names the card first, `visor: holdsSheet: Visor holds a card or a sheet, not both`

#### Scenario: Schema before relation
- **GIVEN** `holds: true` with `holdsSheet: { width: 79, height: 218, rows: [{ bar: 40 }] }`
- **WHEN** Visor is called
- **THEN** it throws naming `holdsSheet.width`

#### Scenario: Sheet with holds false
- **GIVEN** the same `holdsSheet` with `holds: false`
- **WHEN** Visor is drawn
- **THEN** it draws the held sheet, as without `holds`

#### Scenario: Sizes out of range
- **GIVEN** `holdsSheet` with `width` 79, then 301, then `height` 79, then 401, each with `rows: [{ bar: 40 }]` and the other size valid
- **WHEN** Visor is called
- **THEN** each call throws a `RangeError` naming `holdsSheet.width` or `holdsSheet.height`; a call with `width` 80 and `height` 80, and one with `width` 300 and `height` 400, draw

#### Scenario: Rows out of range
- **GIVEN** `holdsSheet` with no `rows`, with `rows: []`, with nine rows, or with a row `{ lead: "star", bar: 40 }`
- **WHEN** Visor is called
- **THEN** each call throws a `RangeError` naming `holdsSheet.rows` (the first three) or `holdsSheet.rows[0].lead`; eight rows draw

#### Scenario: Unknown field and empty label
- **GIVEN** `holdsSheet` with an extra `fill: "color.white"`, then with `label: ""`, then `holdsSheet: true`
- **WHEN** Visor is called
- **THEN** the calls throw a `RangeError` naming `holdsSheet.fill` as an unknown parameter, `holdsSheet.label`, and `holdsSheet`

### Requirement: Visor faces left or right
`visor` SHALL take `facing`, `right` (the default) or `left`. Facing right it draws as without `facing`. Facing left it draws the mirror image: the root group's only body child, or its second after a held sheet, is the body group with `transform` `scale(-1,1)` holding the same children as facing right, so `points` reaches left and the card sits on the right. Any other value throws a `RangeError` naming `facing`.

#### Scenario: Mirror of the default
- **GIVEN** `visor({ x: 100, y: 300 })` and `visor({ x: 100, y: 300, facing: "left" })`
- **WHEN** both are drawn
- **THEN** both root groups have the same attributes (`data-piece` `visor`, `transform` `translate(100 300) scale(1)`, `stroke` `none`); the second's only child is a `g` whose only attribute is `transform` `scale(-1,1)` and whose children deep-equal the children of the first's only child

#### Scenario: Facing right is the default
- **GIVEN** each call of `test/fixtures/cast-0.11.0.json` for `visor`
- **WHEN** it is drawn again with `facing: "right"` added
- **THEN** its tree is deep-equal to the call without `facing`

#### Scenario: Back view and card mirrored
- **GIVEN** `visor({ x: 0, y: 0, view: "back", holds: true, points: false, facing: "left" })`
- **WHEN** it is drawn
- **THEN** its body group has `transform` `scale(-1,1)` and children deep-equal those of the same call facing right, and the tree holds no face

#### Scenario: Unknown facing
- **GIVEN** `visor({ x: 0, y: 0, facing: "up" })`
- **WHEN** it is called
- **THEN** it throws a `RangeError` naming `facing` and listing `right, left`

### Requirement: Mirrored Visor keeps its outline and words
Facing left SHALL change no fill, stroke colour or stroke width (ADR 0009): the only negative scale in Visor's tree is the body group's `scale(-1,1)`. A held sheet and every word stay unmirrored: facing left, the held group sits outside the mirrored group with the page's left edge at local x 98, and the `text` group carries the root's transform with no negative scale.

#### Scenario: Same outline both ways
- **GIVEN** `visor` with each `expression`, on `light` and on `dark`, with `holds: true`, once facing right and once facing left
- **WHEN** the shapes of both trees are listed as (tag, `fill`, `stroke`, `stroke-width`)
- **THEN** both lists are equal, and the only `transform` that differs is the body group's `scale(-1,1)`

#### Scenario: Sheet on the right, unmirrored
- **GIVEN** the call of "Sheet in the left hand" with `facing: "left"`
- **WHEN** it is drawn
- **THEN** the held group is the root's first child and has no `transform`; its children deep-equal `sheet({ x: 98, y: -222, width: 130, height: 218, rows: [{ lead: "question", bar: 40 }] }).body` with `stroke` `#121212` added to its marks group, followed by `pill({ x: 163, y: -222, text: "proposal.md" }).body`; the second child is the body group with `transform` `scale(-1,1)`

#### Scenario: Words read the same
- **GIVEN** the calls of "Sheet in the left hand" facing right and facing left
- **WHEN** their `text` trees are compared
- **THEN** they hold the same strings with the same attributes except `x`: each `x` facing left is its value facing right plus 326 (196 plus the sheet's width), so the `?` is at 128 and `proposal.md` at 163, and no `transform` in either `text` holds a negative number

### Requirement: Cast calls of 0.11.0 unchanged
The five cast pieces SHALL draw, for every call in `test/fixtures/cast-0.11.0.json`, the tree and `toSvg` bytes it pins. The fixture is written once from 0.11.0, before any change to `brand-cast.ts`: at x 100, y 300, every `surface`, `view` and `expression` of `mira`, `drone`, `kiu` and `sinal` (64 calls), the same for `visor` over `holds` and `points` (64), and each piece at `scale` 0.25 and 4 (10): 138 calls.

#### Scenario: Frozen cast calls
- **GIVEN** the 138 calls of `test/fixtures/cast-0.11.0.json`
- **WHEN** each call is made again
- **THEN** its tree is deep-equal to the pinned tree and `toSvg(g({}, ...body, ...text))` equals the pinned string

#### Scenario: A changed cast drawing is caught
- **GIVEN** a `visor` wrapped so its pointing hand is moved by one unit
- **WHEN** the frozen comparison runs over the fixture with it
- **THEN** it reports exactly the 34 `visor` calls whose `points` is not `false` (32 with `points: true` and the two scale calls), and no other call

### Requirement: Question token
The package SHALL export `questionToken({ cx, cy, scale, surface })`, the open question as an object (ADR 0009), the mark of a `sheet` question row: a `color.white` circle of radius 13 outlined at `outline.small` (ink on light, `surface.dark.muted` on dark) and a `?` at (`cx`, `cy` + 7), `font.sans` 19 at `font.weightHeavy`, `color.ink`, centred. Body and text each sit in a `g` with `data-piece` `questionToken`, transformed `translate(cx cy) scale(s) translate(-cx -cy)` when `scale` is not 1.

#### Scenario: Default token
- **GIVEN** `questionToken({ cx: 100, cy: 50 })`
- **WHEN** it is drawn
- **THEN** its `body` is one `g` with `data-piece` `questionToken` and no `transform`, holding one `circle` with `cx` 100, `cy` 50, `r` 13, `fill` `#FFFFFF`, `stroke` `#121212` and `stroke-width` 3; its `text` is one `g` with `data-piece` `questionToken` holding one `text` at (100, 57) with `font-family` `font.sans`, `font-size` 19, `font-weight` 900, `fill` `#121212`, `text-anchor` `middle` and the only child `?`

#### Scenario: Same mark as a sheet's question row
- **GIVEN** `sheet({ x: 0, y: 0, width: 100, height: 100, rows: [{ lead: "question", bar: 40 }] })` and `questionToken({ cx: 30, cy: 57 })`
- **WHEN** both are drawn
- **THEN** the sheet's question circle and the token's circle have the same `cx`, `cy`, `r` and `fill`, the token's `stroke-width` equals the sheet's marks group's, and both `?` text nodes have `x` 30, `y` 64, `font-size` 19 and `font-weight` 900

#### Scenario: Scaled token
- **GIVEN** `questionToken({ cx: 100, cy: 50, scale: 2 })`
- **WHEN** it is drawn
- **THEN** both groups have `transform` `translate(100 50) scale(2) translate(-100 -50)`, and the circle and text node are deep-equal to the default token's

#### Scenario: Token on the dark surface
- **GIVEN** `questionToken({ cx: 0, cy: 0, surface: "dark" })`
- **WHEN** it is drawn
- **THEN** the circle is filled `#FFFFFF` and stroked `#ADA79D`, and the `?` stays `#121212`

#### Scenario: Token carries its own stroke
- **GIVEN** the token drawn on `light` and on `dark`, at `scale` 1 and 2
- **WHEN** the test walks its body
- **THEN** the circle has its own `stroke` and `stroke-width`, so it draws the same inside the cover command's outlined group as on its own

#### Scenario: Same token through React
- **GIVEN** the default, dark and scaled tokens
- **WHEN** each `g({}, ...body, ...text)` is rendered by `toSvg` and by `renderToStaticMarkup(toReact(…))`
- **THEN** both parse to the same normal form, so a scene draws the same token as an SVG

### Requirement: Question token parameters
`questionToken` SHALL check `cx` and `cy` (required, any finite number), `scale` (above 0, at most 10, default 1) and `surface` (`light` or `dark`, default `light`) with the shared schema, and throw a `RangeError` naming the first problem. It takes no colour and no text.

#### Scenario: Scale bounds
- **GIVEN** `questionToken({ cx: 0, cy: 0 })` with `scale` 0, 10.01, 10 and 0.01
- **WHEN** each is called
- **THEN** 0 and 10.01 throw a `RangeError` naming `scale`; 10 and 0.01 draw

#### Scenario: Missing position and unknown parameters
- **GIVEN** `questionToken({ cx: 0 })`, `questionToken({ cx: 0, cy: 0, text: "!" })`, `questionToken({ cx: 0, cy: 0, fill: "color.white" })` and `questionToken({ cx: 0, cy: 0, surface: "navy" })`
- **WHEN** each is called
- **THEN** they throw a `RangeError` naming `cy`, `text` as an unknown parameter, `fill` as an unknown parameter, and `surface`

### Requirement: Balão
The package SHALL export `balao`, the requester and approver (ADR 0007, amended 2026-11-12): a speech balloon on Mira's legs, its tail low on the front side pointing out, the screen face, a request line on its belly and the hood tip, drawn as in `supporting-characters` design §2 with the shared skin. `speaks: true` fills the request line with the skin's accent instead of `illustration.textBar`. The back view draws no face and no request line.

#### Scenario: Balão at rest
- **GIVEN** `balao({ x: 100, y: 300 })`
- **WHEN** it is drawn
- **THEN** its `body` is one `g` with `data-piece` `balao`, `transform` `translate(100 300) scale(1)` and `stroke` `none`, whose only child is a `g` with no attribute holding, in order, the legs, the body path of `supporting-characters` design §2 filled `#FFFFFF` and stroked `#121212` at width 8, the face, the request line `rect` (−30, −88, 60 × 9, radius 4.5) filled `#D7D1C5`, the hood tip filled `#E04E17`, and two hand circles of radius 15 at (−86, −100) and (92, −132); its `text` is empty

#### Scenario: The tail points at the listener
- **GIVEN** `balao({ x: 0, y: 0 })`
- **WHEN** the end points of its body path are listed
- **THEN** the tail's tip, (94, −76), is the point with the largest x, it lies above the hips (y −62), and no end point lies below y −60, where the legs are

#### Scenario: Balão speaks
- **GIVEN** `balao({ x: 0, y: 0, speaks: true })` on light and on dark
- **WHEN** they are drawn
- **THEN** the request line is filled `#E04E17` on light and `#FF7A45` on dark, and every other node is deep-equal to the same call without `speaks`

#### Scenario: Balão holds the stamp
- **GIVEN** `balao({ x: 0, y: 0, holdsStamp: { word: "GO" } })`
- **WHEN** it is drawn
- **THEN** the root group's first child is a `g` with `data-held` `stamp`, `stroke` `#121212`, `stroke-width` 4 and `stroke-linejoin` `round`, whose children deep-equal `stamp({ cx: 132, cy: -70, r: 24, word: "GO" }).body`; the second is the body group, its front hand at (132, −100); its `text` is one `g` with the root's `transform`, `font-family` `font.sans`, `font-size` 19, `font-weight` 700, `fill` `#121212` and `text-anchor` `middle`, holding the stamp's text node `GO` at (132, −60)

#### Scenario: Balão from behind
- **GIVEN** `balao` with `view: "back"`, once for each `expression` and once with `speaks: true`
- **WHEN** they are drawn
- **THEN** every tree is identical, holds no face and no request line, keeps the body path of the front view and draws the hood tip's back (`M-28 -162 Q0 -170 28 -162 Q0 -154 -28 -162 Z`)

### Requirement: Balão parameters
`balao` SHALL check `x`, `y` (required), `surface`, `scale` (0.25 to 4), `expression` and `view` as the cast pieces do, `facing` (`right`, `left`), `speaks` (boolean) and `holdsStamp` (an object with one field, `word`, a non-empty label), throwing a `RangeError` naming the first problem. After the schema, at most one relation problem, the first of: `holdsStamp` with `speaks: true`, then `holdsStamp` with `view: "back"`, both naming `holdsStamp`.

#### Scenario: Speaking and stamping together
- **GIVEN** `balao({ x: 0, y: 0, speaks: true, holdsStamp: { word: "GO" } })`, then the same with `view: "back"`
- **WHEN** each is called
- **THEN** both throw a `RangeError` with the message `balao: holdsStamp: Balão does one action at a time`, and `PIECES.balao.relations` returns exactly one problem for the second

#### Scenario: Stamp from behind
- **GIVEN** `balao({ x: 0, y: 0, view: "back", holdsStamp: { word: "GO" } })`
- **WHEN** it is called
- **THEN** it throws a `RangeError` with the message `balao: holdsStamp: Balão holds a stamp only in the front view`

#### Scenario: Bad stamp and parameters
- **GIVEN** `holdsStamp: {}`, `holdsStamp: { word: "" }`, `holdsStamp: { word: "GO", fill: "color.white" }`, `holdsStamp: true`, `scale: 5`, `facing: "up"` and an unknown `colour`, each alone, and `speaks: true` with `holdsStamp: { word: "" }`
- **WHEN** each is called
- **THEN** they throw naming `holdsStamp.word`, `holdsStamp.word`, `holdsStamp.fill` (unknown), `holdsStamp`, `scale`, `facing` (listing `right, left`), `colour` (unknown), and `holdsStamp.word` (the schema before the relation)

### Requirement: Chaves
The package SHALL export `chaves`, the developer (ADR 0007, amended 2026-11-12): a `{ }` body on Mira's legs, the screen face, a cursor in the skin's accent under it and the hood tip, drawn as in `supporting-characters` design §3 with the shared skin. Its actions: `types` draws the `keyboard` under the front hand, `points` swaps the front hand for Visor's pointing hand, `holdsSheet` holds a sheet out in the front hand. The back view draws no face and no cursor.

#### Scenario: Chaves at rest
- **GIVEN** `chaves({ x: 100, y: 300 })`
- **WHEN** it is drawn
- **THEN** its `body` is one `g` with `data-piece` `chaves`, `transform` `translate(100 300) scale(1)` and `stroke` `none`, whose only child is a `g` with no attribute holding, in order, the legs, the body path of `supporting-characters` design §3 filled `#FFFFFF` and stroked `#121212` at width 8, the face, the cursor `rect` (−9, −76, 18 × 8, radius 2) filled `#E04E17`, the hood tip, and two hand circles of radius 15 at (−100, −50) and (100, −50); its `text` is empty

#### Scenario: Chaves types
- **GIVEN** `chaves({ x: 0, y: 0, types: true })` on light and on dark
- **WHEN** they are drawn
- **THEN** the root group's first child is a `g` whose only attribute is `data-held` `keyboard` and whose children deep-equal the children of `keyboard({ x: 98, y: -74, width: 150, surface }).body[0]` for that surface (no `data-piece` inside Chaves but its own), the second is the body group with its front hand at (120, −80), and the `text` is empty

#### Scenario: Chaves points
- **GIVEN** `chaves({ x: 0, y: 0, points: true })`
- **WHEN** it is drawn
- **THEN** the body group's last child is a `g` with `transform` `translate(104,-128) rotate(55)` holding the finger `rect` (−6, −30, 12 × 26, radius 6, stroke width 4.5) and the palm circle (0, 0, radius 15), and no hand circle sits at (100, −50)

#### Scenario: Chaves hands a sheet over
- **GIVEN** `chaves({ x: 0, y: 0, holdsSheet: { width: 150, height: 160, rows: [{ lead: "question", bar: 40 }], label: "proposal.md" } })`
- **WHEN** it is drawn
- **THEN** the root group's first child is a `g` with `data-held` `sheet`, as Visor draws its held sheet, whose children deep-equal `sheet({ x: 118, y: -200, width: 150, height: 160, rows: [{ lead: "question", bar: 40 }] }).body` with `stroke` `#121212` added to its marks group, followed by `pill({ x: 193, y: -200, text: "proposal.md" }).body`; the body group's front hand is at (112, −92); the `text` group, with Visor's text attributes, holds `?` at (148, −136) and `proposal.md` at (193, −193)

#### Scenario: Chaves from behind
- **GIVEN** `chaves` with `view: "back"`, once for each `expression`, and once with `points: true`
- **WHEN** they are drawn
- **THEN** the four trees without `points` are identical and hold no face and no cursor, and draw the hood tip's back (`M-28 -150 Q0 -158 28 -150 Q0 -142 -28 -150 Z`, filled `#E04E17`, stroked `#121212` at width 5, round joins); the call with `points` holds the pointing hand as in "Chaves points"

### Requirement: Chaves's silhouette
Chaves's body SHALL read as a brace at 24 px tall: its contour is the path of `supporting-characters` design §3, whose two brace points at mid height (y −88) reach x ±90, 36 units outside its corners (x ±54) and 46 units outside its waist (x ±44), each point a corner between two curves.

#### Scenario: Brace points and waist
- **GIVEN** `chaves({ x: 0, y: 0 })`
- **WHEN** the end points of its body path's segments are listed
- **THEN** the points with the largest and smallest x are (90, −88) and (−90, −88); the waist end points (±44, −108) and (±44, −68) have |x| 44, less than the corners' 54 at (±54, −128) and (±54, −48), which is less than the points' 90; on y, −128 < −108 < −88 < −68 < −48; the curves into and out of (90, −88) have the control points (60, −96) and (60, −80); and the path is symmetric about x 0

#### Scenario: Reads at 24 px (local)
- **GIVEN** the model sheet's small-size row, rendered in Chrome through an `<img>` with Chaves about 24 px and 48 px tall on light and dark
- **WHEN** the owner looks at it at gate 3
- **THEN** he accepts the silhouette as a brace, not a pillow; otherwise the path, its scenario and `supporting-characters` design §3 change together

### Requirement: Chaves parameters
`chaves` SHALL check `x`, `y`, `surface`, `scale` (0.25 to 4), `expression` and `view` as the cast pieces do, `facing` (`right`, `left`), `types` and `points` (booleans) and `holdsSheet` (Visor's held-sheet object), throwing a `RangeError` naming the first problem. After the schema, at most one relation problem, the first of: two actions on (naming the second of `types`, `points`, `holdsSheet` that is on), then `types` or `holdsSheet` with `view: "back"` (naming it).

#### Scenario: One action at a time
- **GIVEN** `chaves` with `types: true, points: true`, then `points: true` and a valid `holdsSheet`, then all three
- **WHEN** each is called
- **THEN** they throw a `RangeError` with the messages `chaves: points: Chaves does one action at a time`, `chaves: holdsSheet: Chaves does one action at a time` and `chaves: points: Chaves does one action at a time`, and `PIECES.chaves.relations` returns exactly one problem for the third, also with `view: "back"` added

#### Scenario: Props from behind
- **GIVEN** `chaves` with `view: "back"` and `types: true`, then with `view: "back"` and a valid `holdsSheet`
- **WHEN** each is called
- **THEN** they throw `chaves: types: Chaves types only in the front view` and `chaves: holdsSheet: Chaves holds a sheet only in the front view`

#### Scenario: Bad held sheet and parameters
- **GIVEN** the valid held sheet of "Chaves hands a sheet over" with `width: 79`, the same with `rows: []`, the same with an extra `fill`, then `types: "yes"`, `facing: "up"`, `scale: 0.2`, and `types: true` with `points: true` and that sheet with `width: 79`
- **WHEN** each is called
- **THEN** they throw naming `holdsSheet.width`, `holdsSheet.rows`, `holdsSheet.fill` (unknown), `types`, `facing`, `scale`, and `holdsSheet.width` (the schema before the relations)

#### Scenario: Actions off by default
- **GIVEN** `chaves({ x: 0, y: 0 })` and `chaves({ x: 0, y: 0, types: false, points: false, facing: "right" })`
- **WHEN** both are drawn
- **THEN** the trees are deep-equal, and so are `balao({ x: 0, y: 0 })` and `balao({ x: 0, y: 0, speaks: false, facing: "right" })`

### Requirement: Supporting characters face left or right
`balao` and `chaves` SHALL take `facing`, `right` (the default) or `left`. Facing left, the body group carries `transform` `scale(-1,1)` and the same children as facing right, so the tail and the front hand go left; a held stamp, keyboard or sheet sits outside it at the mirrored position (`supporting-characters` design §2, §3), and the `text` group carries the root's transform with no negative scale. No fill, stroke colour or stroke width changes.

#### Scenario: Mirror of the default
- **GIVEN** `balao({ x: 100, y: 300 })` and `balao({ x: 100, y: 300, facing: "left" })`, the same two calls with `view: "back"`, and the same four calls of `chaves`
- **WHEN** they are drawn
- **THEN** for each piece both root groups have the same attributes, and the second's only child is a `g` whose only attribute is `transform` `scale(-1,1)` and whose children deep-equal the children of the first's only child

#### Scenario: Props stay readable facing left
- **GIVEN** `balao` with `holdsStamp: { word: "GO" }`, `chaves` with `types: true`, and `chaves` with the sheet of "Chaves hands a sheet over", each facing left, and `balao` with `facing: "up"`
- **WHEN** they are drawn
- **THEN** the held group is the root's first child with no `transform`, deep-equal to the facing-right group drawn at `stamp` `cx` −132, `keyboard` `x` −248, and `sheet` `x` −268 with the pill at x −193; the stamp's word is at (−132, −60), the `?` at (−238, −136) and `proposal.md` at (−193, −193); the last call throws a `RangeError` naming `facing`

#### Scenario: Same outline both ways
- **GIVEN** each piece with each `expression`, on light and on dark, facing right and facing left
- **WHEN** the shapes of both trees are listed as (tag, `fill`, `stroke`, `stroke-width`)
- **THEN** both lists are equal, and the only `transform` that differs is the body group's `scale(-1,1)`

### Requirement: Keyboard
The package SHALL export `keyboard({ x, y, width, surface })`, the laptop's base (`supporting-characters` design §4): one `g` with `data-piece` `keyboard` holding a `rect` at (`x`, `y`), `width` × 16, radius 6, filled `color.white`, stroked at `outline.block` (ink on light, `surface.dark.muted` on dark), then a `g` with `stroke` `none` holding floor((`width` − 44) / 21) + 1 keys, 12 × 4, radius 2, filled `color.ink`, at (`x` + 16 + 21·i, `y` + 6). No `text`.

#### Scenario: Default keyboard
- **GIVEN** `keyboard({ x: 0, y: 0 })`
- **WHEN** it is drawn
- **THEN** its body is one `g` with `data-piece` `keyboard` holding the slab `rect` (0, 0, 150 × 16, radius 6, `fill` `#FFFFFF`, `stroke` `#121212`, `stroke-width` 4, `stroke-linejoin` `round`), then a `g` whose only attribute is `stroke` `none`, holding six keys at x 16, 37, 58, 79, 100 and 121, y 6, each filled `#121212`; its `text` is empty

#### Scenario: Keyboard on the dark surface
- **GIVEN** `keyboard({ x: 0, y: 0, surface: "dark" })`
- **WHEN** it is drawn
- **THEN** the slab is stroked `#ADA79D` and the keys stay `#121212`

#### Scenario: Key count follows the width
- **GIVEN** `keyboard` with `width` 80 and 300
- **WHEN** they are drawn
- **THEN** they hold 2 and 13 keys, the last ending at least 16 units inside the slab's right edge

#### Scenario: Keyboard carries its own stroke
- **GIVEN** the keyboard on light and dark
- **WHEN** the test walks its body
- **THEN** the slab has its own `stroke` and `stroke-width`, and every key has a `fill` and an ancestor `g` inside the piece with `stroke` `none`, so no shape takes the cover command's outline ("Supporting cast drawn" checks it in a cover)

### Requirement: Keyboard parameters
`keyboard` SHALL check `x` and `y` (required, any finite number), `width` (80 to 300, default 150) and `surface` (`light` or `dark`, default `light`) with the shared schema, and throw a `RangeError` naming the first problem. It takes no colour and no text.

#### Scenario: Width bounds and unknown parameters
- **GIVEN** `keyboard({ x: 0, y: 0 })` with `width` 79, 301, 80 and 300, then `keyboard({ x: 0 })`, `keyboard({ x: 0, y: 0, fill: "color.white" })` and `keyboard({ x: 0, y: 0, surface: "navy" })`
- **WHEN** each is called
- **THEN** 79 and 301 throw naming `width`, 80 and 300 draw, and the others throw naming `y`, `fill` (unknown) and `surface`

### Requirement: Supporting cast follows the cast rules
`balao` and `chaves` SHALL share the cast's skin (ADR 0006, 0009) and take no colour parameter; `expression` changes only the screen face; their anchor is the centre of the ground line and `scale` resizes about it, so `pose` and the timing helpers of `src/brand/cast-motion.ts` apply as to the five cast pieces; every action is off unless set.

#### Scenario: Shared skin in every expression
- **GIVEN** each piece with each `expression`, on light and on dark
- **WHEN** they are drawn
- **THEN** the body is filled `#FFFFFF` and stroked with the skin's outline (`#121212` on light, `#ADA79D` on dark), the visor is the skin's (`#121212` on light, `#121110` on dark), the eyes `#FFC98A`, and for each piece and surface the four trees differ only inside the face group

#### Scenario: Scale about the ground point
- **GIVEN** `balao({ x: 0, y: 0 })` and `balao({ x: 0, y: 0, scale: 0.25 })`, and the same for `chaves` with `types: true`
- **WHEN** they are compared
- **THEN** each second tree's root group carries `scale(0.25)` in its transform and is otherwise the same tree as the first

#### Scenario: Feet on the ground point
- **GIVEN** `balao({ x: 0, y: 0 })` and `chaves({ x: 0, y: 0 })`
- **WHEN** their legs path and foot pills are read
- **THEN** the legs end at (±28, 0) for Balão and (±26, 0) for Chaves, the two foot pills are `rect`s 20 × 7 with `y` −6, symmetric about x 0, and no other shape reaches below y 1, so the anchor (`x`, `y`) is the centre of the ground line as for Mira; posed with `pose` about (`x`, `y`), the feet's centre stays there

#### Scenario: Schemas list the shared and own parameters
- **GIVEN** `PIECES.balao.schema` and `PIECES.chaves.schema`
- **WHEN** the test reads their keys
- **THEN** both hold `x`, `y`, `surface`, `scale`, `expression`, `view` and `facing`; `balao` adds exactly `speaks` and `holdsStamp`, `chaves` exactly `types`, `points` and `holdsSheet`; neither has a colour parameter

### Requirement: Emote spot beside the head
For `balao` and `chaves` the emote spot SHALL be (116, −200) in local units facing right and (−116, −200) facing left, for an `emote` at the character's `scale` (CAST-3): a disc of radius 44 there clears every shape the piece draws at rest, pointing, typing or holding the stamp, both facings, and the README's typing screen; no `emote` there touches them. A held sheet taller than 114 reaches it, or taller than 96 with a label whose pill is at least as wide as the page.

#### Scenario: Spot clear of the body and props
- **GIVEN** `balao` at rest and holding a stamp, `chaves` at rest, pointing and typing, each facing right and left at `x` 0, `y` 0, each of the eight `emote` kinds at the spot at scale 1, and the README's screen for Chaves typing (a `codePanel` 132 × 62 at (106, −148), mirrored facing left) in the cover command's 4-unit outline
- **WHEN** the bounding box of every shape (a path's per segment, from its end and control points; with half its stroke width, the pointing hand's rotation applied) is compared with the disc of radius 44 at the spot, and each emote shape's box with each of the piece's and the screen's (a cubic's box from its two control points, an arc's from its circle)
- **THEN** none of the piece's shapes nor the screen overlaps the disc, and no emote shape's box meets a box of the piece's shapes or, for Chaves typing, of the screen

#### Scenario: A tall held sheet reaches the spot
- **GIVEN** `chaves` holding the sheet of "Chaves hands a sheet over" (height 160, width 150, label `proposal.md`, whose pill is as wide as the page), the same without the label at heights 100, 114 and 115, and with the label at heights 96 and 100, each facing right and left
- **WHEN** the page's and the label pill's boxes are compared with the disc
- **THEN** the page at 160 and 115 overlaps it, nothing at 100 and 114 without a label nor at 96 with it does, and the pill at 100 does; the README says a scene moves the emote or the sheet then

### Requirement: Existing outputs unchanged by the supporting cast
Adding the supporting cast SHALL change no existing output: every existing file in `test/fixtures/` stays as it is, and every call and golden it pins (the cast of 0.11.0 included) draws its pinned tree and bytes; Visor's 0.12.0 scenarios and the scenes' ring radii hold unchanged. `stamp`, moved to its own module, draws every call of a new fixture written from 0.12.0 before the move.

#### Scenario: Frozen outputs after the change
- **GIVEN** the branch with the three new pieces
- **WHEN** `test/pieces/frozen.test.ts`, `test/brand/stage-rings.test.ts`, the cover goldens of `test/scripts/cover.test.ts` and the Visor tests of `test/pieces/brand-pieces.test.ts` run
- **THEN** they pass, and `git diff origin/main --stat -- test/fixtures` lists only the new `stamp-0.12.0.json`

#### Scenario: Stamp calls of 0.12.0 unchanged
- **GIVEN** `test/fixtures/stamp-0.12.0.json`, written from `655525d` before the move: `stamp` round and `rect`, at the default `r` and at 24, with the default and a set `rotate` (0) and `fill` (`illustration.accent`), word `GO` (8 calls)
- **WHEN** each call is made with `stamp` from its new module
- **THEN** its tree is deep-equal to the pinned tree and its `toSvg` bytes are equal

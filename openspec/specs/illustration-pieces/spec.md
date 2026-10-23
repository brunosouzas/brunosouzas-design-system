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
Pieces SHALL take every colour from the generated tokens; `src/pieces/` holds no colour literal (`#` with three or six hex digits, `rgb(`, `hsl(`). A colour parameter SHALL be a token path of type `color`, such as `color.healthy`; any other value is rejected. Only `pipe.fill`, `lineBadge.fill` and `zone.fill` are data colours: they also accept `#RRGGBB` (see "Line colours from data"). Only `uiIcon.colour` also accepts `currentColor` (see "Current colour on UI icons").

#### Scenario: Source without literals
- **WHEN** the no-colour-literals test scans `src/pieces/`
- **THEN** it finds nothing

#### Scenario: Hex passed as a colour
- **WHEN** `pill` is called with `fill: "#FFFFFF"` or `fill: "outline.block"`
- **THEN** it throws a `RangeError` naming `fill` and saying a colour token path is expected

#### Scenario: Current colour elsewhere
- **WHEN** `pill` is called with `fill: "currentColor"`, or `lineBadge` with `fill: "currentColor"`
- **THEN** each call throws a `RangeError` naming `fill`

### Requirement: Hard shadow with the outline
A shadowed shape of the 26 cover pieces SHALL be drawn twice: first a copy filled with `color.ink` and translated by the shadow offset (default `shadow.block`), then the shape. Both sit in the outlined group, so the shadow copy carries the outline too. A shape with its own transform casts a shadow with `translate(offset offset)` before that transform. The metro and diagram pieces draw stickers instead ("Ink sticker on a surface").

#### Scenario: Default shadow
- **WHEN** `sheet` draws its page at `x` 300, `y` 112
- **THEN** the first body node is a `rect` at the same position with `fill` ink and `transform` `translate(10 10)`, and the next one is the white page

#### Scenario: Shadow of a turned shape
- **WHEN** a shape with `transform="rotate(30)"` is shadowed with offset 8
- **THEN** the shadow's transform is `translate(8 8) rotate(30)`

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
- **THEN** the output is exactly `<text x="0" y="0" font-family="Lato, 'Helvetica Neue', Helvetica, Arial, sans-serif" fill="#0A1033" font-size="11" font-weight="700" text-anchor="middle"><tspan font-family="ui-monospace, 'SF Mono', Menlo, Consolas, monospace">200 OK</tspan></text>`

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
The library SHALL export 51 pieces with the parameters and defaults of their designs, in this order: the 26 cover pieces of `illustration-pieces` §4, the nine metro and diagram pieces of `metro-and-diagram-pieces` §3, the six map and icon pieces of `stackledger-map-and-link-pieces` §3, and the ten body diagram pieces of `body-diagram-pieces` §3.

#### Scenario: Every piece draws with its defaults
- **WHEN** the catalogue test calls each of the 51 pieces with only its required parameters
- **THEN** each returns valid tags only and colours that are token values; every piece except `edgeLabel` returns a non-empty `body`, and `edgeLabel` returns an empty `body` and a non-empty `text`

#### Scenario: Catalogue sheet
- **WHEN** `npm run pieces:sheet -- --out <file.svg>` runs
- **THEN** it writes one SVG with every piece once, labelled with its name in the mono font, and prints `wrote <file>`

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
A piece SHALL draw no word of its own: the only text nodes are the caller's `text`, `word` or label parameters and the glyphs `?` (question row) and the tick path. An empty label is rejected.

#### Scenario: Stamp word
- **WHEN** `stamp` is called with `word: "GO"`
- **THEN** its `text` holds exactly one text node, `GO`

#### Scenario: Empty label
- **WHEN** `pill` is called with `text: ""`
- **THEN** it throws a `RangeError` naming `text`

### Requirement: EIP icons as data
The library SHALL hold the 26 published EIP icons as data (name, title, description, nodes in a 64x40 box) with token colours, and `eipIcon({ name, x, y, scale })` SHALL place one inside a group with `stroke="none"`. Each icon keeps its CC BY 4.0 credit in its description; an unknown name is rejected.

#### Scenario: The 26 names
- **WHEN** the test lists the icon names
- **THEN** they are the 26 published names, from `aggregator` to `transactional-client`, each with a non-empty title and a description that names Gregor Hohpe and Bobby Woolf and CC BY 4.0

#### Scenario: Icon colours
- **WHEN** the test collects every colour in the icon data
- **THEN** each is the value of `color.ink`, `color.white`, `color.healthy`, `color.transitional`, `color.caller`, `color.backend` or `illustration.iconLine`

#### Scenario: Unknown icon
- **WHEN** `eipIcon` is called with `name: "message-bus"`
- **THEN** it throws a `RangeError` naming `name` and listing that the name is not one of the 26

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

### Requirement: Room for the outline
The smallest dimension of an outlined shape (`height` of a `lineBadge`, flat or not, of a `countBadge` and of a `normal` or `focus` node; `2 × r` of a `stationMarker`) SHALL be at least 4 × `map.outline` × `inkScale`; a smaller one throws a `RangeError` naming `height` or `r`, equality accepted. A `placeholder` node is exempt: it draws no ink.

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
- **WHEN** `lineBadge({ x: 50, y: 20, text: "SH", fill: "color.healthy", flat: true })` is called
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
The library SHALL hold `UI_ICONS`, the seven icons of `stackledger-map-and-link-pieces` design §5 (`sun`, `moon`, `zoomIn`, `zoomOut`, `reset`, `calendar`, `download`), each with a title, a description and nodes in a 24 × 24 box without colours. `uiIcon({ name, x, y, size, colour })` SHALL place one in a group `translate(x y) scale(size / 24)` whose `fill` and `stroke` are `colour` (a token path, default `color.ink`, or `currentColor`).

#### Scenario: Default sun
- **WHEN** `uiIcon({ name: "sun", x: 0, y: 0 })` is called
- **THEN** its body is one group with transform `translate(0 0) scale(1)`, fill and stroke `#0A1033`, holding the sun's circle and its rays path

#### Scenario: The seven names
- **WHEN** the test lists `UI_ICONS`
- **THEN** the names are exactly the seven above, in that order, each with a non-empty title and description, and no node of the data carries a colour

#### Scenario: Unknown icon or a hex colour
- **WHEN** `uiIcon` gets `name: "menu"`, or `colour` `"#FFFFFF"`, `"currentcolor"`, `"inherit"` or `" currentColor"`
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
- **WHEN** the test walks the node tree of each of the 7 UI icons and each of the 4 link icons, on light and dark (22 trees), and then writes each wrapped in `el("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 46 46" }, …body)` with `toSvg`
- **THEN** in the trees no tag is outside `SVG_TAGS`, no attribute is `href`, `xlink:href`, `style` or `on…`, and no attribute value or text holds `url(` or `://`; and each written string holds `://` exactly once, in the root's `xmlns`

### Requirement: New pieces carry their own stroke
Every shape a new piece draws (`renewalRing`, `suggestedHalo`, `licenceMark`, `zone`, `uiIcon`, `linkIcon`, the dark `ledgerMark` rim, and the ten body diagram pieces) SHALL carry its own `stroke`, or sit in a group of the piece that sets one, so it draws the same inside the cover command's outlined group (`stroke` ink, width 4) as on its own.

#### Scenario: Inside the outlined group
- **WHEN** the test walks each new piece's body, drawn with its required parameters on light and dark, plus `zone` with one, two and three points, `altFrame` with a condition and one section, and `edgeLabel` with `backdrop: true`
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

### Requirement: Current colour on UI icons
`uiIcon` SHALL accept the exact keyword `currentColor` as `colour` and write it as is as the group's `fill` and `stroke`, with the same children as a token colour, so an icon inline in a page follows its element's text colour. No other spelling is accepted.

#### Scenario: Current colour
- **WHEN** `uiIcon({ name: "zoomIn", x: 4, y: 8, size: 16, colour: "currentColor" })` is called
- **THEN** its body is one group with transform `translate(4 8) scale(0.6666666666666666)`, fill and stroke `currentColor`, and the same children as `uiIcon({ name: "zoomIn", x: 4, y: 8, size: 16 })`

#### Scenario: Current colour on every icon
- **WHEN** each of the seven icons is drawn with `colour: "currentColor"`, written with `toSvg` and with `toReact`
- **THEN** no node holds a hex colour, every `fill` and `stroke` is `currentColor` or `none`, and the "Icons hold no link, style or script" rule holds for each tree

### Requirement: UI icon calls of 0.3.0 unchanged
Every `uiIcon` call valid in 0.3.0 SHALL draw the same tree and the same `toSvg` bytes as in 0.3.0.

#### Scenario: Frozen 0.3.0 icon calls
- **WHEN** the test re-calls the frozen fixture `test/fixtures/ui-icons-0.3.0.json`, written on `origin/main` (`2bfe4a5`) before any code: each of the seven icons with no colour at (0, 0), with `colour: "surface.dark.text"` at (0, 0), and with `colour: "color.white"` at (3.5, -2) with `size` 18
- **THEN** each of the 21 trees deep-equals its frozen tree and its `toSvg` output equals its frozen string

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
- **THEN** its body is three rects of 120 × 46 with `rx` 23: the shadow at (3.5, 3.5) in `#4C5CB8` with stroke-width 5, the rim at (0, 0) in `#EEF2FF` with stroke-width 5, and the face `#1C2D74` with stroke `#0A1033` and stroke-width 3; its word `Sender` is at (60, 27.5) in `#EEF2FF`

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
`taggedContainer` SHALL draw a frame sticker with `rx` `map.nodeRadius` and a tab sticker at (x + 14, y − 12), `tagWidth` × 24 with `rx` 12, in `tagFill` (default `color.transitional`), with the `tag` word in `color.ink`, bold, size `map.badgeTextSize`, centred on the tab. `tagWidth` defaults to 7.2 × characters + 24. The tab follows the room rule (design §3), and a width below `tagWidth` + 28 is rejected naming `width`.

#### Scenario: Container with its tab
- **WHEN** `taggedContainer({ x: 0, y: 0, width: 300, height: 120, tag: "Anypoint MQ" })` is called
- **THEN** its body is the frame's shadow and face (300 × 120, `rx` 10, the face `#FFFFFF`), then the tab's shadow at (17.5, −8.5) and face at (14, −12), both 103.2 × 24 with `rx` 12, the face `#FFD25A`; its word is at (65.6, 4.5), size 12, `#0A1033`

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

#### Scenario: Text size bounds
- **WHEN** `edgeLabel` gets `textSize: 49`, `phaseBand` gets `textSize: 5`, and `edgeLabel` gets `textSize: 48`
- **THEN** the first two throw a `RangeError` naming `textSize`; the third draws its line at size 48

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
- **THEN** each tree deep-equals its frozen tree, and its body nodes then its text nodes, each through `toSvg` and joined with no separator, equal its frozen string

# illustration-pieces Specification

## Purpose
Draws the blog's recurring illustration objects once, as pure TypeScript pieces that return SVG node trees from the tokens, so covers, body diagrams and Remotion scenes share one drawing instead of copies that drift.

## Requirements

### Requirement: SVG node tree
A piece SHALL return `{ body, text }`, two arrays of SVG nodes (`tag`, `attrs`, `children`), where `body` holds shapes and `text` holds words and glyphs. Tags are limited to `svg`, `g`, `title`, `desc`, `defs`, `clipPath`, `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon`, `path`, `text`. Attribute values are strings or finite numbers.

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
Pieces SHALL take every colour from the generated tokens; `src/pieces/` holds no colour literal (`#` with three or six hex digits, `rgb(`, `hsl(`). A colour parameter SHALL be a token path of type `color`, such as `color.healthy`; any other value is rejected.

#### Scenario: Source without literals
- **WHEN** the no-colour-literals test scans `src/pieces/`
- **THEN** it finds nothing

#### Scenario: Hex passed as a colour
- **WHEN** `pill` is called with `fill: "#FFFFFF"` or `fill: "outline.block"`
- **THEN** it throws a `RangeError` naming `fill` and saying a colour token path is expected

### Requirement: Hard shadow with the outline
A shadowed shape SHALL be drawn twice: first a copy filled with `color.ink` and translated by the shadow offset (default `shadow.block`), then the shape. Both sit in the outlined group, so the shadow copy carries the outline too. A shape with its own transform casts a shadow with `translate(offset offset)` before that transform.

#### Scenario: Default shadow
- **WHEN** `sheet` draws its page at `x` 300, `y` 112
- **THEN** the first body node is a `rect` at the same position with `fill` ink and `transform` `translate(10 10)`, and the next one is the white page

#### Scenario: Shadow of a turned shape
- **WHEN** a shape with `transform="rotate(30)"` is shadowed with offset 8
- **THEN** the shadow's transform is `translate(8 8) rotate(30)`

### Requirement: SVG renderer
`toSvg(node)` SHALL write the tree as SVG text: two-space indent per level (a node holding any text is written inline, so no whitespace is added to its text), attributes in insertion order, numbers through `String`, `&`, `<`, `>` and `"` escaped in text and attribute values, LF line ends. The same tree gives the same string.

#### Scenario: Escaping
- **WHEN** a `text` node holds `a < b & "c"`
- **THEN** the output holds `a &lt; b &amp; &quot;c&quot;`

#### Scenario: Mixed text content
- **WHEN** a `text` node holds `a`, a `title` node and `b`, inside an `svg`
- **THEN** `toSvg` writes `<text>a<title>tooltip</title>b</text>` on one line, and the React path matches it

#### Scenario: Deterministic text
- **WHEN** the same cover tree is rendered twice
- **THEN** both strings are byte-identical

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
The library SHALL export these pieces, with the anchors, parameters and defaults of `design.md` §4: pill, rings, sheet, blockArrow, arcArrow, rail, checkBadge, priceTag, nameTag, codePanel, serverStack, cloud, stamp, robot, magnifier, gear, parcel, road, milestonePin, browserWindow, speechBubble, steps, folder, book, muleFlow, eipIcon.

#### Scenario: Every piece draws with its defaults
- **WHEN** the catalogue test calls each of the 26 pieces with only its required parameters
- **THEN** each returns a non-empty `body`, valid tags only, and colours that are token values

#### Scenario: Catalogue sheet
- **WHEN** `npm run pieces:sheet -- --out <file.svg>` runs
- **THEN** it writes one SVG with every piece once, labelled with its name in the mono font, and prints `wrote <file>`

### Requirement: Piece parameters checked
Each piece SHALL check its parameters against its schema before drawing and throw a `RangeError` naming the first problem: a missing required parameter, an unknown one, a wrong JSON type, a non-finite or out-of-range number, an unknown enum value, or a colour that is not a colour token path. Sizes, coordinates and points lie within ±10000, counts and lists have the limits of `design.md` §4, and a size leaves room for the piece's fixed insets. `road.d` accepts only path characters.

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
- **WHEN** each piece is drawn with each bounded size parameter at its smallest and at its largest accepted value
- **THEN** no drawn width, height or radius is negative and no value is infinite or NaN

#### Scenario: Too many repeated parts
- **WHEN** `steps` gets `count: 4294967296`, `gear` gets `teeth: 65`, `rail` gets 51 nodes, or `arcArrow` gets `from: [10001, 0]`
- **THEN** each call throws a `RangeError` naming `count`, `teeth`, `nodes` or `from` before drawing

#### Scenario: Road path with something else
- **WHEN** `road` gets `d: "M0,0 L10,10\" onload=\"x"`
- **THEN** it throws a `RangeError` naming `d`

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

## ADDED Requirements

### Requirement: Milestone pin size
`milestonePin` SHALL take `size`, the head's radius, a number from 6 to 48, default 18. With k = `size` / 18, the head's centre is at `y − stem − 14k` with `stroke-width` `3k`, and the label has `font-size` `size` and baseline `y − stem − 7k`, each rounded to two decimals when `size` is given. Without `size` the pin draws as in 0.5.0 ("Piece calls of 0.5.0 unchanged").

#### Scenario: Larger pin
- **WHEN** `milestonePin({ x: 100, y: 200, text: "S", size: 27 })` is called
- **THEN** its body is a `line` from (100, 200) to (100, 156) and a `circle` with `cx` 100, `cy` 135, `r` 27 and `stroke-width` 4.5, and its text node has `y` 145.5 and `font-size` 27

#### Scenario: Pin size bounds
- **WHEN** `milestonePin` gets `x: 0`, `y: 100`, `text: "1"` and `size` 6, 48, 5.99, 48.01 or `"26"`
- **THEN** size 6 draws a circle with `cy` 51.33, `r` 6 and `stroke-width` 1; size 48 a circle with `cy` 18.67, `r` 48 and `stroke-width` 8; the other three throw a `RangeError` naming `size`

### Requirement: Count badge text size
`countBadge` SHALL take `textSize`, a number from 6 to 48, default `map.countTextSize`. With k = `textSize` / 11: without `height`, the height is `map.countHeight` × k rounded to two decimals; without `width`, a text of two or more characters is max(height, (6.4 × characters + 8) × k rounded to two decimals) wide; the baseline is `cy + 4k`. When the height comes from `textSize`, "Room for the outline" names `textSize` instead of `height`.

#### Scenario: Larger count
- **WHEN** `countBadge` is called with `cx: 0`, `cy: 0`, `textSize: 22` and `text: "1"`, then `text: "12"`, then `text: "1"` with `textSize: 20` and `height: 30`
- **THEN** the first face is a circle of radius 16 and its text has `y` 8 and `font-size` 22; the second face is a rect 41.6 wide and 32 high; the third face is a circle of radius 15 and its text has `y` 7.27 and `font-size` 20

#### Scenario: Count text size bounds
- **WHEN** `countBadge({ cx: 0, cy: 0, text: "1" })` gets `textSize` 8.25, 8.24, 5, 49, or 20 with `height: 10`
- **THEN** 8.25 draws a circle of radius 6; 8.24 throws a `RangeError` naming `textSize` (derived height 11.99, below 12); 5 and 49 throw naming `textSize`; the last throws naming `height`

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
- **THEN** the first path has stroke `#E04848` and no `stroke-dasharray`, its head is `#E04848`; the second path has stroke `#0A1033` and `stroke-dasharray` `6 8` as its last attribute; the third throws a `RangeError` naming `dashed`

### Requirement: Piece calls of 0.5.0 unchanged
Every `milestonePin`, `countBadge`, `pill` and `messageArrow` call valid in 0.5.0 SHALL draw the same tree and the same `toSvg` bytes as in 0.5.0, except a `pill` whose text has an even number of backticks, which now draws code ("Code in words").

#### Scenario: Frozen 0.5.0 calls
- **WHEN** the test re-calls the 44 calls of `test/fixtures/pieces-0.5.0.json`, written on `origin/main` (`f91ba2e`) before any code
- **THEN** 43 trees deep-equal their frozen trees, and their body then text nodes through `toSvg`, joined with no separator, equal the frozen strings; the pill with ``text: "a `b` c"`` differs from its frozen tree and its text node's children are `a `, a `tspan` holding `b`, and ` c`

#### Scenario: Goldens unchanged
- **WHEN** the cover command builds every spec of `test/fixtures/covers/`
- **THEN** each output equals its golden SVG byte for byte

## MODIFIED Requirements

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

### Requirement: Message arrow kinds
`messageArrow` SHALL take `kind`: `message` (default) and `reply` paint `surface.text`, `failure` paints `color.failure`, `failFast` paints `color.failFast`; the path's stroke and each head's fill and stroke take that paint. Unless `dashed` says otherwise ("Message arrow dash"), `reply`, `failure` and `failFast` add `stroke-dasharray` `2.4 × width` `3.2 × width` as the path's last attribute. The label keeps `surface.text`.

#### Scenario: Reply
- **WHEN** `messageArrow({ from: [0, 0], to: [100, 0], curve: "straight", kind: "reply" })` is called
- **THEN** its path is `M0,0 L87.5,0` with stroke `#0A1033`, stroke-width 2.5, cap `round` and dash `6 8`, and its head is the polygon `100,0 87.5,5 87.5,-5` in `#0A1033`

#### Scenario: Failure and fail-fast
- **WHEN** the same call is made with `kind: "failure"`, and with `kind: "failFast"` and `surface: "dark"`
- **THEN** the first's path and head are `#E04848`, the second's `#E0661F`, both with dash `6 8`

#### Scenario: Message kind is the 0.3.1 drawing
- **WHEN** each call of `test/fixtures/message-arrow-0.3.1.json` is made again with `kind: "message"` added
- **THEN** its tree is deep-equal to the frozen one

### Requirement: Room for the outline
The smallest dimension of an outlined shape (`height` of a `lineBadge`, flat or not, of a `countBadge` and of a `normal` or `focus` node; `2 × r` of a `stationMarker`) SHALL be at least 4 × `map.outline` × `inkScale`; a smaller one throws a `RangeError` naming `height` or `r` (`textSize` for a count badge whose height comes from it, "Count badge text size"), equality accepted. A `placeholder` node is exempt: it draws no ink.

#### Scenario: Badge too low for its ink
- **WHEN** `lineBadge` gets `flat: true` and `inkScale: 8` with the default height 20, and then `height: 96`, `width: 120` and `inkScale: 8`
- **THEN** the first throws a `RangeError` naming `height`; the second draws a rect 96 wide and 72 high, inset by 12

#### Scenario: Placeholder without ink
- **WHEN** `nodeBlock` is drawn with `state: "placeholder"`, `height: 20`, `width: 40` and `inkScale: 8`
- **THEN** it draws the dashed box without an error

### Requirement: Code in words
In every text parameter of the ten body diagram pieces and in `pill.text`, a string with an even number of backticks SHALL be drawn as a `text` node whose children are the plain parts as strings and each part between backticks as a `tspan` with only `font-family` `font.mono`; empty parts are dropped and the backticks are not drawn. A string with an odd number of backticks is drawn as is. A pill's default width ignores backticks. Other pieces' words are unchanged.

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

#### Scenario: Code in a pill
- **WHEN** `pill({ x: 0, y: 0 })` gets ``text: "`main`"``, then ``text: "deploy to `prod`"``, then ``text: "a `b"``
- **THEN** the first rect is 76 wide and its text node's only child is a mono `tspan` holding `main`, written on one line by `toSvg`; the second rect is 181 wide with children `deploy to ` and a `tspan` holding `prod`; the third rect is 76 wide and its only child is the string ``a `b``

## ADDED Requirements

### Requirement: EIP icons without offset shadows
No EIP icon SHALL draw an offset shadow (ADR 0009). An offset shadow is a node or group moved by a `transform`, or an ink-filled node without a stroke that repeats the shape of a later node of the same icon moved right and down by the same amount, at most 3. Every other node of each 0.14.1 icon stays, in its order and unchanged, with the icon's name, title and description.

#### Scenario: No offset shadow
- **WHEN** the shadow rule of design §1 is applied to each of the 26 icons
- **THEN** it finds no node

#### Scenario: Every face kept
- **GIVEN** `test/fixtures/eip-icons-0.14.1.json`, written by `scripts/freeze-eip-book-pieces.ts` from `d26f254` before any code
- **WHEN** each icon is compared with its frozen entry
- **THEN** its name, title and description equal the frozen ones, and its nodes deep-equal the frozen nodes without the 46 nodes listed in design §1

#### Scenario: A shadow is caught
- **WHEN** the shadow rule is applied to the frozen 0.14.1 icons, and then to `splitter` with a copy of its face rect, filled `#121212`, without a stroke and moved by (2.5, 2.5), put before the face
- **THEN** it finds exactly the 46 nodes of design §1 in the first, and that one node in the second

### Requirement: Queue without words
`queueNode`'s `text` SHALL be optional. Without it (absent or `undefined`), the piece draws the body the same call draws with `text` (the box and its rails, on the same surface, fill and ink scale) and no text node. Without `text`, `subtitle` and then `textSize` are rejected naming each, before the width and room limits, which apply as with words; `text: []` is rejected naming `text`.

#### Scenario: Empty queue
- **WHEN** `queueNode({ x: 0, y: 0, width: 100 })` is called
- **THEN** its body is one rect of 100 × 46 with `rx` 6, filled `#FFFFFF`, and the rails `M10,0 V46 M90,0 V46`, deep-equal to the body of the same call with `text: ["orders"]`, and its text list is empty

#### Scenario: Empty queue on the dark surface
- **WHEN** `queueNode({ x: 0, y: 0, width: 100, surface: "dark", inkScale: 2 })` is called
- **THEN** its body is deep-equal to the body of the same call with `text: ["orders"]`, its face is filled `#1D1C1A` and stroked `#ADA79D`, and its text list is empty

#### Scenario: Words asked of an empty queue
- **WHEN** `queueNode` with `x: 0`, `y: 0`, `width: 100` gets `text: []`, `subtitle: "a"`, `textSize: 20`, `subtitle: "a"` with `textSize: 20`, `subtitle: "a"` with `width: 40`, `subtitle: "a"` with `text: undefined`, and, with no words, `width: 40` alone and `height: 10` alone
- **THEN** each of the eight calls throws a `RangeError`, naming in turn `text`, `subtitle`, `textSize`, `subtitle`, `subtitle`, `subtitle`, `width` and `height`; the `subtitle` and `textSize` messages are `queueNode: <name>: needs text: it styles words that are not drawn`

### Requirement: Queue node calls of 0.14.1 unchanged
Every `queueNode` call valid in 0.14.1 SHALL draw the same tree and the same `toSvg` bytes as in 0.14.1.

#### Scenario: Frozen queue node calls
- **GIVEN** `test/fixtures/queue-node-0.14.1.json`, written by `scripts/freeze-eip-book-pieces.ts` from `d26f254` before any code. It holds 8 calls at `x: 0`, `y: 0`:
  - at `width: 100`, `text: ["orders"]`: alone, with `subtitle: "durable"`, with `fill: "color.state.healthy"` and with `surface: "dark"`;
  - `width: 100`, `height: 60`, `text: ["orders"]`;
  - `width: 160`, `height: 120`, `text: ["a", "b", "c"]`;
  - ``width: 200, height: 60, text: ["`orderId`"], textSize: 36``;
  - `width: 120`, `height: 60`, `text: ["orders"]`, `inkScale: 2`.
- **WHEN** each call is made again
- **THEN** its tree is deep-equal to the pinned tree, and its body then text nodes through `toSvg`, joined with no separator, equal the pinned string

#### Scenario: A changed queue node is caught
- **GIVEN** the same fixture
- **WHEN** each call is made with `height: 47` unless the call sets its own `height`
- **THEN** exactly the 4 calls without `height` differ from their pinned tree

## MODIFIED Requirements

### Requirement: Diagram shapes
`diagramBox`, `decisionNode`, `storeNode`, `queueNode` and `exchangeNode` SHALL take the parameters and draw the geometry of `body-diagram-pieces` design §3, from the top-left `x`, `y`: a box or pill, a diamond, a cylinder with its lid, a box with two rails, and a hexagon with points 0.26 × height in. `storeNode`'s and `queueNode`'s `text` is optional ("Store without words", "Queue without words").

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


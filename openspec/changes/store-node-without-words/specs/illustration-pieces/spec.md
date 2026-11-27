## ADDED Requirements

### Requirement: Store without words
`storeNode`'s `text` SHALL be optional. Without it, the piece draws the body the same call draws with `text` (the cylinder face and its lid, on the same surface, fill and ink scale) and no text node. Without `text`, `subtitle` and then `textSize` are rejected naming each; `text: []` is rejected naming `text`. Room for the outline and the `ry` limit apply as with words.

#### Scenario: Empty store
- **WHEN** `storeNode({ x: 0, y: 0, width: 100, height: 60 })` is called
- **THEN** its body is the face path `M0,8 A50,8 0 0 1 100,8 V52 A50,8 0 0 1 0,52 Z` and the lid `M0,8 A50,8 0 0 0 100,8`, deep-equal to the body of the same call with `text: ["IDs"]`, and its text list is empty

#### Scenario: Empty store on the dark surface
- **WHEN** `storeNode({ x: 0, y: 0, width: 100, height: 60, surface: "dark", inkScale: 2 })` is called
- **THEN** its body is deep-equal to the body of the same call with `text: ["IDs"]`, its face is filled `#1D1C1A` and stroked `#ADA79D`, and its text list is empty

#### Scenario: Words asked of an empty store
- **WHEN** `storeNode` with `x: 0`, `y: 0`, `width: 100`, `height: 60` gets `text: []`, `subtitle: "a"`, `textSize: 20`, `subtitle: "a"` with `textSize: 20`, and, with no words, `height: 10` and `ry: 20`
- **THEN** each throws a `RangeError`, naming in turn `text`, `subtitle`, `textSize`, `subtitle`, `height` and `ry`

### Requirement: Store node calls of 0.14.1 unchanged
Every `storeNode` call valid in 0.14.1 SHALL draw the same tree and the same `toSvg` bytes as in 0.14.1.

#### Scenario: Frozen store node calls
- **GIVEN** `test/fixtures/store-node-0.14.1.json`, written by `scripts/freeze-store-node.ts` from `d334273` (0.14.1) before any code: 8 calls with one and three lines, a subtitle, a fill, a code run at `textSize` 36, `ry` 15, the dark surface and `inkScale` 2
- **WHEN** each call is made again
- **THEN** its tree is deep-equal to the pinned tree and its body then text nodes through `toSvg`, joined with no separator, equal the pinned string

## MODIFIED Requirements

### Requirement: Diagram shapes
`diagramBox`, `decisionNode`, `storeNode`, `queueNode` and `exchangeNode` SHALL take the parameters and draw the geometry of `body-diagram-pieces` design §3, from the top-left `x`, `y`: a box or pill, a diamond, a cylinder with its lid, a box with two rails, and a hexagon with points 0.26 × height in. `storeNode`'s `text` is optional ("Store without words").

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


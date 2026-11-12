## ADDED Requirements

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
For `balao` and `chaves` the emote spot SHALL be (116, −200) in local units facing right and (−116, −200) facing left, for an `emote` at the character's `scale` (CAST-3): a disc of radius 44 (the emote's 40 and its outline) there clears every shape the piece draws at rest, pointing, typing or holding the stamp, in both facings. A held sheet 114 or taller reaches it.

#### Scenario: Spot clear of the body and props
- **GIVEN** `balao` at rest and holding a stamp, `chaves` at rest, pointing and typing, each facing right and left at `x` 0, `y` 0
- **WHEN** the bounding box of every shape (with half its stroke width, the pointing hand's rotation applied) is compared with the disc of radius 44 at the spot
- **THEN** none of them overlaps the disc

#### Scenario: A tall held sheet reaches the spot
- **GIVEN** `chaves` holding the sheet of "Chaves hands a sheet over" (height 160), and the same with height 100
- **WHEN** the page's box is compared with the disc
- **THEN** the first overlaps it and the second does not; the README says a scene moves the emote or the sheet then

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

## MODIFIED Requirements

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

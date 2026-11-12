## ADDED Requirements

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
- **THEN** the left hand (radius 15, outline 4, at x −92 or 92) overlaps the page's edge, and no lead mark or tail check of the held sheet, with its outline, reaches under it

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

## MODIFIED Requirements

### Requirement: Piece catalogue
The library SHALL export 64 pieces with the parameters and defaults of their designs, in order: the 26 cover pieces of `illustration-pieces` §4, the nine metro and diagram pieces of `metro-and-diagram-pieces` §3, the six map and icon pieces of `stackledger-map-and-link-pieces` §3, the ten body diagram pieces of `body-diagram-pieces` §3, `stateStart`, `emote`, `mira`, `visor`, `drone`, `kiu`, `sinal`, `bankObject`, `symbol`, `brandNotationIcon`, `categoryIcon`, `headline` and `questionToken`.

#### Scenario: Every piece draws with its defaults
- **WHEN** the catalogue test calls each of the 64 pieces with only its required parameters
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
- **THEN** `PIECE_NAMES` has 64 names ending with `headline`, `questionToken`, and `PIECES.questionToken` is the exported `questionToken`

### Requirement: Words come from the caller
A piece SHALL draw no word of its own: the only text nodes are the caller's `text`, `word` or label parameters and the glyphs `?` (a question row, on a `sheet` or on the sheet Visor holds, and `questionToken`) and the tick path. An empty label is rejected.

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
- **THEN** they include `holds` (boolean), `holdsSheet` (object), `points` (boolean) and `facing` (enum `right`, `left`), and no other cast piece's schema has `holdsSheet` or `facing`

### Requirement: V2 palette of every piece
Each of the 64 pieces drawn with its defaults, on `light` and on `dark` when it takes `surface` and once otherwise, SHALL use as `fill` and `stroke` only `none` or the value (hex, not path) of a `brand.*` token but `stackledgerAccent`, a `surface.*` token, a default track ring (`coverBackground.track*.ring`), `color.white`, `color.ink`, `color.ring`, `color.panel`, an `illustration.*` token or `cast.eyes`; a `color.state.*` value only where "State colours that keep a meaning" names it.

#### Scenario: Every piece in the v2 palette
- **WHEN** the test walks every node of each piece's required-only call of the catalogue test (`REQUIRED_ONLY`), with every required colour parameter (`rail.nodes`, `lineBadge.fill`, `pipe.fill`, `zone.fill`, `phaseBand.fill`) set to `illustration.accent`, `emote` drawn once per kind, `categoryIcon` drawn once per category, plus a `sheet` with a `tail` check, a `serverStack` with `failing: 1`, and a `visor` holding a sheet with a `question` row and a `tail` check, facing right and facing left
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
A `color.state.*` value SHALL appear in the output of "V2 palette of every piece" only where it means a state: `checkBadge`'s disc and a `tail` check on a `sheet` or on the sheet Visor holds (done), `stamp`'s face (approved), `serverStack`'s failing light, the emotes `problem`, `refused` (failure) and `worked` (done), `renewalRing`'s inner band (renewal due), an owned `licenceMark`, and `eipIcon` and `nameTag`'s icon ("Icon colours").

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

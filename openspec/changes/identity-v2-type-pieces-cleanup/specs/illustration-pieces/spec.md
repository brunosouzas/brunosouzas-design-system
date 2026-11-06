## ADDED Requirements

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
- **WHEN** the test makes the instantiation of the `harfbuzzjs` wasm module fail and calls `embedFonts` on a text-free tree, then on a tree whose only text is in `'Source Serif 4', serif`
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
A text's family, weight and style SHALL be its own `font-family`, `font-weight` and `font-style`, or the nearest ancestor's. The family is the first comma-separated entry, trimmed, quotes stripped, compared exactly with `Source Sans 3` and `Source Code Pro`; any other family, `Source Serif 4` included (no file ships), adds no face. An `italic` or `oblique` run uses the upright face of its weight. A face is embedded only when one of its drawn characters has a glyph in it.

#### Scenario: Label with a code run
- **WHEN** `embedFonts` gets a tree holding ``edgeLabel({ x: 0, y: 0, lines: ["adopts a `correlationId`"] })``
- **THEN** the `style` holds two faces in this order: `Source Code Pro` at `550 900` (the `tspan`, whose own `font-family` wins) holding `correlationId`'s characters, then `Source Sans 3` at `550 799` holding those of `adopts a `

#### Scenario: Family names compared exactly
- **WHEN** four texts at 400 have the `font-family` `"Source Sans 3", serif`, then `'Source Code Pro' , monospace` with a leading space, then `source sans 3, sans-serif`, then `'Source Serif 4', serif`
- **THEN** the faces are `Source Code Pro` and `Source Sans 3`, both at `100 549`, and neither the lower-case family nor Source Serif 4 adds one

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
A text's weight SHALL be 400 when its resolved `font-weight` is missing, `normal`, `bolder`, `lighter` or a non-numeric string, 700 for `bold`, and otherwise its number, snapped to a shipped weight: Source Sans 3 below 550 → 400, 550 to below 800 → 700, 800 and above → 900; Source Code Pro below 550 → 400, 550 and above → 700. Each `@font-face` declares the range its weight stands for: `100 549`, `550 799` or `800 900` for Source Sans 3, `100 549` or `550 900` for Source Code Pro.

#### Scenario: Weights snapped
- **WHEN** texts are drawn in Source Sans 3 at 549, 549.5, 550, 799, 799.5 and 800, and in Source Code Pro at 549, 549.5, 550 and 900
- **THEN** the `style` holds five faces: `Source Code Pro` `100 549` (the 549 and 549.5 texts), `Source Code Pro` `550 900`, `Source Sans 3` `100 549` (the 549 and 549.5 texts), `Source Sans 3` `550 799` (the 550, 799 and 799.5 texts) and `Source Sans 3` `800 900`

#### Scenario: Weight keywords
- **WHEN** Source Sans 3 texts have no `font-weight`, then `normal`, `bold`, `bolder`, `lighter` and `heavy`
- **THEN** the `bold` text uses the `550 799` face and the five others share the `100 549` face

### Requirement: Order of the faces
The `@font-face` rules SHALL be ordered by family name in code-point order, then by weight ascending; each rule names `font-family`, `font-weight` (its range) and `font-style:normal`, the only style shipped.

#### Scenario: Every sort key
- **WHEN** a tree draws, in this order, Source Sans 3 at 900, Source Code Pro at 700, Source Sans 3 italic at 400 and Source Code Pro at 400
- **THEN** the rules are `Source Code Pro` `100 549`, `Source Code Pro` `550 900`, `Source Sans 3` `100 549`, `Source Sans 3` `800 900`, each with `font-style:normal`

### Requirement: Font embedding failure
When a font file cannot be read or the WebAssembly module fails to load, `embedFonts` SHALL reject with an `Error` naming the cause: the path of the file that could not be read, or `harfbuzzjs` for the module. It never resolves with a tree that lacks a face its text uses.

#### Scenario: Unreadable font file
- **WHEN** the test makes the read of the Source Sans 3 Bold file in `fonts/` fail and calls `embedFonts` on a tree with a Source Sans 3 text at 700
- **THEN** the promise rejects with an `Error` whose message holds that file's path

#### Scenario: WebAssembly fails to load
- **WHEN** the test makes the instantiation of the `harfbuzzjs` wasm module fail and calls `embedFonts` on a tree with text
- **THEN** the promise rejects with an `Error` whose message names `harfbuzzjs`

### Requirement: Fonts shipped with the package
The package SHALL ship in `fonts/` the unmodified static TTF files of the faces the pieces draw, Source Sans 3 3.052R (Regular, Bold, Black) and Source Code Pro 2.042R (Regular, Bold), with `OFL.txt`; their SHA-256 sums are in `test/fixtures/fonts-sha256.json`. `embedFonts` reads only these files, never the network, through `harfbuzzjs`, the package's one runtime dependency, pinned exactly. The piece modules stay free of file access.

#### Scenario: Files in the installed package
- **WHEN** the package test packs and installs the package
- **THEN** the installed `fonts/` holds the five TTF files and `OFL.txt`, each TTF byte-identical to the repository's copy

#### Scenario: Release files verified
- **WHEN** the test hashes every TTF file in the repository's `fonts/`
- **THEN** there are exactly five, and each SHA-256 equals its entry in `test/fixtures/fonts-sha256.json`

#### Scenario: A changed font file is caught
- **WHEN** the hash check runs on a copy of `fonts/` where one TTF differs by one byte, and on a copy holding a sixth TTF
- **THEN** each run fails naming that file

#### Scenario: Font file missing
- **WHEN** one of the five files is absent from the packed package
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
On the dark surface, every ink stroke on the dark background or on a dark face SHALL take `surface.dark.muted` instead of `color.ink`: sticker outlines, the `storeNode` lid, the `queueNode` rails, a flat `lineBadge`'s outline, the `renewalRing` ink band, emote outlines, rays and Z casings, the `linkIcon` face outline. Marks over a light or state fill (`?`, `!`, ticks, crosses, the bulb filament, link glyphs) or inside a piece's own ink face (`ledgerMark`'s stations) stay `color.ink`.

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
- **THEN** its two station circles are filled `#FFFFFF` and stroked `#121212`, inside its ink square

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
Each of the 62 pieces drawn with its defaults, on `light` and on `dark` when it takes `surface` and once as drawn otherwise, SHALL use as `fill` and `stroke` only `none` or the value (hex compared, not the path) of a `brand.*` or `surface.*` token of either theme, `color.white`, `color.ink`, `color.ring`, `color.panel`, an `illustration.*` token or `cast.eyes`; a `color.state.*` value only where "State colours that keep a meaning" names it.

#### Scenario: Every piece in the v2 palette
- **WHEN** the test walks every node of each piece's required-only call of the catalogue test (`REQUIRED_ONLY`), with every required colour parameter (`rail.nodes`, `lineBadge.fill`, `pipe.fill`, `zone.fill`, `phaseBand.fill`) set to `illustration.accent`, `emote` drawn once per kind, plus a `sheet` with a `tail` check and a `serverStack` with `failing: 1`
- **THEN** each `fill` and `stroke` is `none` or one of those values, a `color.state.*` value appears only on a piece's part listed in "State colours that keep a meaning" (the node of that part, not another node of the same piece), and each listed part the call draws holds its state value

#### Scenario: Dark card on a piece without a surface
- **WHEN** the check walks `codePanel`, which takes no `surface`, with one line of each `color` and a `tall` line
- **THEN** it passes: the panel `#1D1C1A` and the lines `#ADA79D`, `#F1EEE8` and `#FF7A45` are values of `brand.dark.*`

#### Scenario: A decorative state colour is caught
- **WHEN** the palette check is given a `gear` tree whose body is filled `#FFD25A` (its 0.6.1 default, `color.transitional`), then a `checkBadge` tree whose tick is also stroked `#3DDC84`
- **THEN** it reports `gear` and `#FFD25A`, then `checkBadge`, `#3DDC84` and the tick's node, though the badge's disc may be `#3DDC84`

### Requirement: State colours that keep a meaning
A `color.state.*` value SHALL appear in the output of "V2 palette of every piece" only where it means a state: `checkBadge`'s disc and a `sheet` `tail` check (done), `stamp`'s face (approved), `serverStack`'s failing light, the emotes `problem`, `refused` (failure) and `worked` (done), `renewalRing`'s inner band (renewal due), an owned `licenceMark`, and `eipIcon` and `nameTag`'s icon ("Icon colours").

#### Scenario: State colours where they mean a state
- **WHEN** `checkBadge`, `stamp`, `licenceMark` and `renewalRing` are drawn with their required parameters
- **THEN** the badge's disc, the stamp's face and the licence's face are `#3DDC84`, and the ring's inner band is `#FF8A3D`

#### Scenario: Failing light only when failing
- **WHEN** `serverStack` is drawn with `units: 3`, once without `failing` and once with `failing: 1`
- **THEN** the first holds no `color.state.*` value, and the second holds `#E04848` only on that unit's light

## MODIFIED Requirements

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

### Requirement: Piece catalogue
The library SHALL export 62 pieces with the parameters and defaults of their designs, in this order: the 26 cover pieces of `illustration-pieces` §4, the nine metro and diagram pieces of `metro-and-diagram-pieces` §3, the six map and icon pieces of `stackledger-map-and-link-pieces` §3, the ten body diagram pieces of `body-diagram-pieces` §3, `stateStart`, `emote`, `mira`, `visor`, `drone`, `kiu`, `sinal`, `bankObject`, `symbol`, `brandNotationIcon` and `categoryIcon`.

#### Scenario: Every piece draws with its defaults
- **WHEN** the catalogue test calls each of the 62 pieces with only its required parameters
- **THEN** each returns valid tags only and colours that are token values; every piece except `edgeLabel` returns a non-empty `body`, and `edgeLabel` returns an empty `body` and a non-empty `text`

#### Scenario: Catalogue sheet
- **WHEN** `npm run pieces:sheet -- --out <file.svg>` runs
- **THEN** it writes one SVG with every piece once, labelled with its name in the mono font, and prints `wrote <file>`

#### Scenario: Seven-role cast gone
- **WHEN** the test reads the package root's exports and `PIECE_NAMES`
- **THEN** `mascot`, `MASCOTS`, `MASCOT_ACTIONS` and `MASCOT_FACES` are absent, while `emote` and `EMOTE_KINDS` are exported

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

### Requirement: Ledger mark
`ledgerMark` SHALL draw the 32-unit mark of `metro-and-diagram-pieces` design §3, "The mark", in a group translated to (`x`, `y`) and scaled by `size` / 32: an ink square, the bent line in `line` and two white ink-outlined stations, no text. `size` is from 12 to 512. On the dark surface a 2-unit band in `surface.dark.muted` lines the square inside its 32 box, whatever `rimWidth` is, so the ink square never sits bare on the dark background.

#### Scenario: Favicon size
- **WHEN** `ledgerMark({ x: 0, y: 0 })` is called
- **THEN** its group has transform `translate(0 0) scale(1)` and holds the `rect` 32 × 32 with radius 7 and fill `#121212`, the `path` `M7 23 L14 16 L25 16` with stroke `#E04E17` and width 4.5, and circles at (14, 16) r 4 and (25, 16) r 2.6

#### Scenario: Scaled and too small
- **WHEN** `ledgerMark` gets `size: 16`, and then `size: 8`
- **THEN** the first group has `scale(0.5)` with the same children; the second throws a `RangeError` naming `size`

#### Scenario: Mark on a dark surface
- **WHEN** `ledgerMark({ x: 0, y: 0, surface: "dark" })` is called
- **THEN** its group holds first a `rect` 32 × 32 radius 7 filled `#ADA79D`, then the ink `rect` (2, 2) 28 × 28 radius 5, then the same path and circles as "Favicon size"

#### Scenario: Unknown surface on the mark
- **WHEN** `ledgerMark` gets `surface: "navy"`
- **THEN** it throws a `RangeError` naming `surface` and listing `light, dark`

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
The library SHALL hold `LINK_ICONS`, the four stickers of `stackledger-map-and-link-pieces` design §6 (`github`, `linkedin`, `email`, `website`), and `linkIcon({ icon, x, y, size, surface })` SHALL draw one in a group `translate(x y) scale(size / 46)`: the face rect, white with its outline and no frame behind it, then the glyph. `size` defaults to 46. The `github` description credits Font Awesome and CC BY 4.0.

#### Scenario: GitHub on light
- **WHEN** `linkIcon({ icon: "github", x: 0, y: 0 })` is called
- **THEN** its group has transform `translate(0 0) scale(1)` and holds first the face rect (2, 2) 38 × 38 radius 9 fill `#FFFFFF` stroke `#121212` at 2.5, then a group `translate(9.5 9) scale(0.0455)` with the path of brunosouzas.com `social-github.svg` (`e29b3dd`)

#### Scenario: Dark frame
- **WHEN** `linkIcon({ icon: "email", x: 0, y: 0, surface: "dark" })` is called
- **THEN** its group starts with the face rect (2, 2) 38 × 38 radius 9 filled `#FFFFFF` and stroked `#ADA79D`, with no frame rect before it

#### Scenario: Unknown icon
- **WHEN** `linkIcon` gets `icon: "x"`, or no `icon`
- **THEN** each call throws a `RangeError` naming `icon`

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
Every call valid in 0.2.0, with each top-level `color.<state>` value written `color.state.<state>`, SHALL stay valid and draw the tree pinned in `test/fixtures/pieces-0.2.0.json` (`stackledger-map-and-link-pieces` design §6b). This change regenerates the fixture once from the v2 drawing the owner approved, with the same calls except that rewrite; the proof cover and banner goldens are regenerated with it.

#### Scenario: Goldens unchanged
- **WHEN** the four golden fixtures are built
- **THEN** each output equals its regenerated golden byte for byte

#### Scenario: Frozen 0.2.0 calls
- **WHEN** each call of `test/fixtures/pieces-0.2.0.json` is made again
- **THEN** its tree is deep-equal to the pinned one, and each `ledgerMark` call with `surface: "light"` added is deep-equal to the same pinned tree

#### Scenario: Same calls after the regeneration
- **WHEN** the regenerated fixture is compared with the 0.6.1 one
- **THEN** both list the same calls in the same order with the same parameters, except that each `color.<state>` value (`lineBadge.fill`, `ledgerMark.line`) is now `color.state.<state>`; only the trees differ

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

## REMOVED Requirements

### Requirement: Hard shadow with the outline
**Reason**: ADR 0009 retires the hard offset shadow: the shadow tokens become 0 and no piece draws an ink copy.
**Migration**: "No hard offset shadow" keeps `shadowed(shape, offset)` for a caller that passes an offset above 0; pieces draw each shape once.

### Requirement: Mascot
**Reason**: The seven-role cast is retired in 0.7.0 (ADR 0007 amendment); the pillar cast replaces it.
**Migration**: Draw a character with `mira`, `visor`, `drone`, `kiu` or `sinal`; `mascot` is no longer exported.

### Requirement: Mascot parameters
**Reason**: Removed with `mascot`.
**Migration**: The pillar cast pieces take their own parameters ("Mira and the pillar cast pieces").

### Requirement: Mascot parts
**Reason**: Removed with `mascot`.
**Migration**: None; the pillar cast pieces have their own drawing.

### Requirement: Expression without limbs
**Reason**: Removed with `mascot` and `MASCOT_ACTIONS`.
**Migration**: Use the pillar cast's actions (`carries`, `holds`, `points`, `steps`, `stride`).

### Requirement: Faces
**Reason**: Removed with `mascot` and `MASCOT_FACES`.
**Migration**: Use the pillar cast's `expression` (`idle`, `done`, `waiting`, `failed`).

### Requirement: Cast look frozen
**Reason**: Its fixture `cast-0.5.0.json` pins mascot calls and the removed motion test's frames, and the emotes are redrawn.
**Migration**: "Emote look frozen" pins the emote calls in `test/fixtures/emote-0.7.0.json`.

### Requirement: Cast pieces carry their own stroke
**Reason**: `mascot` is removed; the rule now covers emotes alone.
**Migration**: "Emotes carry their own stroke".

### Requirement: Cast on the light surface unchanged
**Reason**: The emotes are redrawn in the v2 grammar, so their 0.5.0 light trees no longer hold, and `mascot` is removed.
**Migration**: "Emote look frozen" pins the new light and dark emote trees.

### Requirement: Cast on the dark surface
**Reason**: The dark rim and shadow pass (`darken`) is retired: rims and shadows are gone in the v2 grammar.
**Migration**: "Ink on the dark surface" gives the dark emote its strokes.

### Requirement: Dark cast look frozen
**Reason**: Its fixture `cast-dark-0.5.2.json` pins mascot calls and the old dark emotes.
**Migration**: "Emote look frozen" pins the dark emote calls in `test/fixtures/emote-0.7.0.json`.

## ADDED Requirements

### Requirement: Headline
`headline` SHALL draw its 1 to 4 `lines` (non-empty strings, drawn as written) in one `g` with `data-piece` `headline`, returned as its `text` with an empty `body`: `font.serif` at `font.weightBold`, `size` from 24 to 160 (default 64), `letter-spacing` −`size`/100, fill `brand.<surface>.text`, `text-anchor` from `anchor`. Line `i` (from 0) has its baseline at `y` + `i` × 1.1 × `size`, rounded to two decimals.

#### Scenario: Three lines at 96
- **WHEN** `headline({ x: 140, y: 190, lines: ["Code that runs", "for the problem", "you have."], size: 96 })` is called
- **THEN** its `body` is empty and its `text` is one `g` with `data-piece` `headline`, `font-family` `'Source Serif 4', Georgia, 'Times New Roman', serif`, `font-size` 96, `font-weight` 700, `letter-spacing` -0.96, `fill` `#121212` and `text-anchor` `start`, holding three `text` nodes at (140, 190), (140, 295.6) and (140, 401.2) with those strings

#### Scenario: Defaults and the dark surface
- **WHEN** `headline({ x: 600, y: 100, lines: ["Title"], anchor: "middle", surface: "dark" })` is called
- **THEN** the group has `font-size` 64, `letter-spacing` -0.64, `fill` `#F1EEE8` and `text-anchor` `middle`

#### Scenario: Out-of-range parameters
- **WHEN** `headline` gets `lines: []`, then five lines, then `size: 200`, then `anchor: "left"`, then `surface: "navy"`
- **THEN** each call throws a `RangeError` naming `lines`, `lines`, `size`, `anchor` and `surface` in turn

## MODIFIED Requirements

### Requirement: Piece catalogue
The library SHALL export 63 pieces with the parameters and defaults of their designs, in this order: the 26 cover pieces of `illustration-pieces` §4, the nine metro and diagram pieces of `metro-and-diagram-pieces` §3, the six map and icon pieces of `stackledger-map-and-link-pieces` §3, the ten body diagram pieces of `body-diagram-pieces` §3, `stateStart`, `emote`, `mira`, `visor`, `drone`, `kiu`, `sinal`, `bankObject`, `symbol`, `brandNotationIcon`, `categoryIcon` and `headline`.

#### Scenario: Every piece draws with its defaults
- **WHEN** the catalogue test calls each of the 63 pieces with only its required parameters
- **THEN** each returns valid tags only and colours that are token values; every piece except `edgeLabel` and `headline` returns a non-empty `body`, and those two return an empty `body` and a non-empty `text`

#### Scenario: Catalogue sheet
- **WHEN** `npm run pieces:sheet -- --out <file.svg>` runs
- **THEN** it writes one SVG with every piece once, labelled with its name in the mono font, and prints `wrote <file>`

#### Scenario: Seven-role cast gone
- **WHEN** the test reads the package root's exports and `PIECE_NAMES`
- **THEN** `mascot`, `MASCOTS`, `MASCOT_ACTIONS` and `MASCOT_FACES` are absent, while `emote` and `EMOTE_KINDS` are exported

### Requirement: V2 palette of every piece
Each of the 63 pieces drawn with its defaults, on `light` and on `dark` when it takes `surface` and once otherwise, SHALL use as `fill` and `stroke` only `none` or the value (hex, not path) of a `brand.*` token but `stackledgerAccent`, a `surface.*` token, a default track ring (`coverBackground.track*.ring`), `color.white`, `color.ink`, `color.ring`, `color.panel`, an `illustration.*` token or `cast.eyes`; a `color.state.*` value only where "State colours that keep a meaning" names it.

#### Scenario: Every piece in the v2 palette
- **WHEN** the test walks every node of each piece's required-only call of the catalogue test (`REQUIRED_ONLY`), with every required colour parameter (`rail.nodes`, `lineBadge.fill`, `pipe.fill`, `zone.fill`, `phaseBand.fill`) set to `illustration.accent`, `emote` drawn once per kind, `categoryIcon` drawn once per category, plus a `sheet` with a `tail` check and a `serverStack` with `failing: 1`
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

### Requirement: Order of the faces
The `@font-face` rules SHALL be ordered by family name in code-point order, then by weight ascending; each rule names `font-family`, `font-weight` (its range) and `font-style:normal`, the only style shipped.

#### Scenario: Every sort key
- **WHEN** a tree draws, in this order, Source Serif 4 at 700, Source Sans 3 at 900, Source Code Pro at 700, Source Sans 3 italic at 400 and Source Code Pro at 400
- **THEN** the rules are `Source Code Pro` `100 549`, `Source Code Pro` `550 900`, `Source Sans 3` `100 549`, `Source Sans 3` `800 900`, `Source Serif 4` `100 900`, each with `font-style:normal`

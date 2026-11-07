## MODIFIED Requirements

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

### Requirement: New pieces carry their own stroke
Every shape a new piece draws (`renewalRing`, `suggestedHalo`, `licenceMark`, `zone`, `uiIcon`, `linkIcon`, the `ledgerMark` page, and the ten body diagram pieces) SHALL carry its own `stroke`, or sit in a group of the piece that sets one, so it draws the same inside the cover command's outlined group (`stroke` ink, width 4) as on its own.

#### Scenario: Inside the outlined group
- **WHEN** the test walks each new piece's body, drawn with its required parameters on light and dark, plus `zone` with one, two and three points, `altFrame` with a condition and one section, and `edgeLabel` with `backdrop: true`
- **THEN** every `circle`, `ellipse`, `rect`, `line`, `polyline`, `polygon` and `path` has a `stroke` attribute or an ancestor `g` inside the piece's body that has one

### Requirement: V2 palette of every piece
Each of the 62 pieces drawn with its defaults, on `light` and on `dark` when it takes `surface` and once otherwise, SHALL use as `fill` and `stroke` only `none` or the value (hex, not path) of a `brand.*` token but `stackledgerAccent`, a `surface.*` token, a default track ring (`coverBackground.track*.ring`), `color.white`, `color.ink`, `color.ring`, `color.panel`, an `illustration.*` token or `cast.eyes`; a `color.state.*` value only where "State colours that keep a meaning" names it.

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

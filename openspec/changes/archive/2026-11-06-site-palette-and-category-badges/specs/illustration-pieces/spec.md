## MODIFIED Requirements

### Requirement: Category icon
The package SHALL export `CATEGORY_ICON_NAMES` and `categoryIcon({ category, x, y, scale })`: one group `translate(x y) scale(scale)` with a disc (centre 21, 21, radius 19.5, ring 1) then a glyph on the light surface at 9, 9, scale 0.5. Per category, the `coverBackground` pair and glyph: `integration` trackIntegration, pointToPointChannel; `delivery` trackDelivery, gateToProduction; `aiEngineering` trackAi, contextWindow; `personalTools` trackPersonal, its own glyph.

#### Scenario: Integration badge
- **WHEN** `categoryIcon({ category: "integration", x: 0, y: 0 })` is called
- **THEN** its body is one group with `transform` `translate(0 0) scale(1)` whose first child is a circle `cx` 21, `cy` 21, `r` 19.5, `fill` `#F7C6A1`, `stroke` `#E3AB84`, `stroke-width` 1, and whose second child is the group of `brandNotationIcon({ name: "pointToPointChannel", x: 9, y: 9, scale: 0.5, surface: "light" })`

#### Scenario: Personal tools category icon
- **WHEN** `categoryIcon({ category: "personalTools", x: 0, y: 0 })` is called
- **THEN** its disc is filled `#F4DD8E` and ringed `#DDC46C`, and the group's second child is a group `translate(9 9) scale(0.5)` holding its own glyph (the wrench-and-screwdriver path in `brand.light.text` and the bolt ring in `brand.light.accent`)

#### Scenario: One track tone per category
- **WHEN** each name of `CATEGORY_ICON_NAMES` is drawn
- **THEN** the names are `integration`, `delivery`, `aiEngineering` and `personalTools` in that order; the disc fills are `#F7C6A1`, `#B9DEC3`, `#C5CDF2` and `#F4DD8E` and the rings `#E3AB84`, `#98C6A5`, `#A5AEDA` and `#DDC46C`; and `delivery` and `aiEngineering` carry the `gateToProduction` and `contextWindow` glyphs

#### Scenario: Placed and scaled
- **WHEN** `categoryIcon({ category: "delivery", x: 10, y: 20, scale: 4 })` is called
- **THEN** its group's `transform` is `translate(10 20) scale(4)` and its children are those of the same call at 0, 0 and scale 1

#### Scenario: Unknown category rejected
- **WHEN** `categoryIcon` is called with `category: "news"`
- **THEN** it throws a `RangeError` naming `category`

#### Scenario: Surface no longer a parameter
- **WHEN** `categoryIcon` is called with `category: "delivery"` and `surface: "dark"`
- **THEN** it throws a `RangeError` naming `surface` as an unknown parameter

### Requirement: V2 palette of every piece
Each of the 62 pieces drawn with its defaults, on `light` and on `dark` when it takes `surface` and once as drawn otherwise, SHALL use as `fill` and `stroke` only `none` or the value (hex compared, not the path) of a `brand.*` or `surface.*` token, a default track ring (`coverBackground.track*.ring`), `color.white`, `color.ink`, `color.ring`, `color.panel`, an `illustration.*` token or `cast.eyes`; a `color.state.*` value only where "State colours that keep a meaning" names it.

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

## MODIFIED Requirements

### Requirement: Category icon
The package SHALL export `categoryIcon({ category, x, y, scale })` and `CATEGORY_ICON_NAMES` (`integration`, `delivery`, `aiEngineering`, `personalTools`): a badge in a 48 × 48 box before `scale`. It draws a disc centred at 24, 24, of radius 22, filled with its track's default `coverBackground` fill and ringed 1.25 wide in that tone's ring. On the disc, the glyph is drawn on the light surface at scale 0.6 from 9.6, 9.6, as mapped in `design.md` Decision 2.

#### Scenario: Integration badge
- **WHEN** `categoryIcon({ category: "integration", x: 0, y: 0 })` is called
- **THEN** its body starts with a circle `cx` 24, `cy` 24, `r` 22, `fill` `#F7C6A1`, `stroke` `#E3AB84`, `stroke-width` 1.25, followed by the nodes of `brandNotationIcon({ name: "pointToPointChannel", x: 9.6, y: 9.6, scale: 0.6, surface: "light" })`

#### Scenario: Personal tools category icon
- **WHEN** `categoryIcon({ category: "personalTools", x: 0, y: 0 })` is called
- **THEN** its disc is filled `#F4DD8E` and ringed `#DDC46C`, and its own glyph (wrench and screwdriver) is drawn in `brand.light.text` with the bolt ring in `brand.light.accent`

#### Scenario: One track tone per category
- **WHEN** each name of `CATEGORY_ICON_NAMES` is drawn
- **THEN** the disc fills are `#F7C6A1`, `#B9DEC3`, `#C5CDF2` and `#F4DD8E` in that order, and `delivery` and `aiEngineering` carry the `gateToProduction` and `contextWindow` glyphs

#### Scenario: Unknown category rejected
- **WHEN** `categoryIcon` is called with `category: "news"`
- **THEN** it throws a `RangeError` naming `category`

#### Scenario: Surface no longer a parameter
- **WHEN** `categoryIcon` is called with `category: "delivery"` and `surface: "dark"`
- **THEN** it throws a `RangeError` naming `surface` as an unknown parameter

### Requirement: V2 palette of every piece
Each of the 62 pieces drawn with its defaults, on `light` and on `dark` when it takes `surface` and once as drawn otherwise, SHALL use as `fill` and `stroke` only `none` or the value (hex compared, not the path) of a `brand.*`, `surface.*` or `coverBackground.*` token, `color.white`, `color.ink`, `color.ring`, `color.panel`, an `illustration.*` token or `cast.eyes`; a `color.state.*` value only where "State colours that keep a meaning" names it.

#### Scenario: Every piece in the v2 palette
- **WHEN** the test walks every node of each piece's required-only call of the catalogue test (`REQUIRED_ONLY`), with every required colour parameter (`rail.nodes`, `lineBadge.fill`, `pipe.fill`, `zone.fill`, `phaseBand.fill`) set to `illustration.accent`, `emote` drawn once per kind, `categoryIcon` drawn once per category, plus a `sheet` with a `tail` check and a `serverStack` with `failing: 1`
- **THEN** each `fill` and `stroke` is `none` or one of those values, a `color.state.*` value appears only on a piece's part listed in "State colours that keep a meaning" (the node of that part, not another node of the same piece), and each listed part the call draws holds its state value

#### Scenario: Dark card on a piece without a surface
- **WHEN** the check walks `codePanel`, which takes no `surface`, with one line of each `color` and a `tall` line
- **THEN** it passes: the panel `#1D1C1A` and the lines `#ADA79D`, `#F1EEE8` and `#FF7A45` are values of `brand.dark.*`

#### Scenario: A decorative state colour is caught
- **WHEN** the palette check is given a `gear` tree whose body is filled `#FFD25A` (its 0.6.1 default, `color.transitional`), then a `checkBadge` tree whose tick is also stroked `#3DDC84`
- **THEN** it reports `gear` and `#FFD25A`, then `checkBadge`, `#3DDC84` and the tick's node, though the badge's disc may be `#3DDC84`

#### Scenario: Badge ring in the palette
- **WHEN** the check walks `categoryIcon` with `category: "integration"`
- **THEN** it passes: `#E3AB84` is `coverBackground.trackIntegration.ring`

## ADDED Requirements

### Requirement: Source type tokens
`font.sans` SHALL be `'Source Sans 3', 'Helvetica Neue', Helvetica, Arial, sans-serif`, `font.mono` `'Source Code Pro', ui-monospace, 'SF Mono', Menlo, Consolas, monospace`, and the new required `font.serif` (`fontFamily`) `'Source Serif 4', Georgia, 'Times New Roman', serif`. A missing `font.serif`, or one of another type, is an error. `font.weightBold` stays 700 and `font.weightHeavy` 900.

#### Scenario: Source stacks in the outputs
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json` has `font.sans` `'Source Sans 3', 'Helvetica Neue', Helvetica, Arial, sans-serif` and `font.mono` `'Source Code Pro', ui-monospace, 'SF Mono', Menlo, Consolas, monospace`, and `tokens.css` has `--ds-font-serif: 'Source Serif 4', Georgia, 'Times New Roman', serif;`

#### Scenario: Missing serif stack
- **WHEN** the source lacks `font.serif`
- **THEN** the build fails, names `font.serif` as missing (type fontFamily), and writes no file

#### Scenario: Serif stack with another type
- **WHEN** `font.serif` is declared `fontWeight`
- **THEN** the build fails, naming `font.serif` and the expected type `fontFamily`, and writes no file

### Requirement: V2 component values
The repository's source SHALL give the component tokens the v2 values of ADR 0009, paths unchanged: `color.ink` `#121212` (`brand.light.text`), `color.panel` `#F6F3EC` (`brand.light.bg`), `color.ring` `#EDE8DE`, and `shadow.block`, `shadow.pill`, `shadow.small` 0, so no piece or component draws a hard offset shadow.

#### Scenario: V2 values in the outputs
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json` has `color.ink` `#121212`, `color.panel` `#F6F3EC`, `color.ring` `#EDE8DE` and `shadow` block, pill and small 0, and `color.ink` equals `brand.light.text` and `color.panel` equals `brand.light.bg`

#### Scenario: Zero shadow is a valid dimension
- **WHEN** the build writes `shadow.block` 0
- **THEN** it accepts the value and `tokens.css` has `--ds-shadow-block: 0px;`

#### Scenario: A v2 value drifts
- **WHEN** a test copy of the source sets `color.ink` back to `#0A1033`
- **THEN** the token test fails naming `color.ink`

## MODIFIED Requirements

### Requirement: Every problem reported at once
When the source breaks several rules, the build and the check SHALL report every problem, one line each, sorted by path in Unicode code-point order and then by message text (a problem with no path first), and exit 1. A missing file, invalid JSON or a non-object root stops validation. Validation does not look inside an unknown group. A token whose `$type` is wrong or unsupported gets one problem, and its value is not checked.

#### Scenario: Unknown group and missing token together
- **WHEN** the source has a group `colour` and lacks `color.state.failure`
- **THEN** the build prints both problems, `color.state.failure` before `colour`, and exits 1

#### Scenario: Problems inside an unknown group are not reported
- **WHEN** the unknown group `colour` holds a token with an invalid value
- **THEN** only the unknown group is reported for that path

#### Scenario: Wrong required type hides the value check
- **WHEN** `outline.block` is declared `number` with the value `1.5`
- **THEN** exactly one problem is printed for `outline.block`: the expected type `dimension`

### Requirement: Required tokens
The source SHALL define these tokens with these types; a missing one, or one with another type, is an error. `color`: ink, white, panel, ring; `color.state`: healthy, blocked, transitional, caller, backend, failure, failFast (`color`). `outline`: block, arrow, small; `shadow` and `radius`: block, pill, small (`dimension`). `font`: sans, mono, serif (`fontFamily`); weightBold, weightHeavy (`fontWeight`). The motion, illustration and cover tokens are separate requirements.

#### Scenario: Missing required token
- **WHEN** the source lacks `color.state.failure`
- **THEN** the build fails, names `color.state.failure` as missing, and writes no file

#### Scenario: Required token with the wrong type
- **WHEN** `outline.block` is declared with type `number`
- **THEN** the build fails, naming `outline.block` and the expected type `dimension`, and writes no file

#### Scenario: State colours only under color.state
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json` has `color.state.healthy` `#3DDC84` and no `color.healthy`, and `tokens.css` declares `--ds-color-state-healthy` and no `--ds-color-healthy`, `--ds-color-fail-fast` or other top-level state colour

#### Scenario: Top-level state colour no longer required
- **WHEN** a source has every `color.state` token and no `color.healthy` … `color.failFast`
- **THEN** the build accepts it

### Requirement: Required illustration tokens
The source SHALL define these `color` tokens: `illustration` accent, codePanel, textBar, road, tape, iconLine. A missing one, or one with another type, is an error. Their values are the v2 values of ADR 0009, each taken from a `brand` role.

#### Scenario: Missing illustration token
- **WHEN** the source lacks `illustration.iconLine`
- **THEN** the build fails, names `illustration.iconLine` as missing (type color), and writes no file

#### Scenario: Measured values
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json` has `illustration.accent` `#E04E17`, `codePanel` `#1D1C1A`, `textBar` `#D7D1C5`, `road` `#5C5852`, `tape` `#F4E4D8`, `iconLine` `#D7D1C5`, and no `illustration.healthyShade` or `illustration.transitionalShade`

#### Scenario: Shades no longer required
- **WHEN** a source has the six illustration tokens and no `illustration.healthyShade` or `illustration.transitionalShade`
- **THEN** the build accepts it

### Requirement: Required cover tokens
The source SHALL define `cover` width, height, pillHeight, labelSize, ringStep, ringWidth, ringRadius (`dimension`) and labelWeight (`fontWeight`). A missing one, or one with another type, is an error. Values: 800, 420, 36, 19, 28, 2, 90 and 700 (Source Sans 3 ships no static 800).

#### Scenario: Cover token with the wrong type
- **WHEN** `cover.labelWeight` is declared `dimension`
- **THEN** the build fails, naming `cover.labelWeight` and the expected type `fontWeight`, and writes no file

#### Scenario: Measured cover values
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.ts` exports `tokens.cover.width` 800, `height` 420, `pillHeight` 36, `labelSize` 19, `ringStep` 28, `ringWidth` 2, `ringRadius` 90 and `labelWeight` 700

### Requirement: Measured cover backgrounds
The repository's source SHALL hold exactly four `coverBackground` pairs, pinned in `test/fixtures/cover-backgrounds.json`: the three track pairs of ADR 0006 (`trackIntegration`, `trackDelivery`, `trackAi`) and `neutral`. The 21 pairs measured from the covers published before 0.6.0 are removed.

#### Scenario: Source matches the measured table
- **WHEN** the token test reads `tokens/source.json` and the fixture
- **THEN** both list the same 4 names with the same `fill` and `ring` values, for example `trackIntegration` `#F4E4D8` and `#D7C9BE`, and `neutral` `#F6F3EC` and `#D8D6D0`

#### Scenario: A pair drifts
- **WHEN** a test copy of the source changes `coverBackground.trackIntegration.ring` to `#D7C9BF`
- **THEN** the comparison fails naming `trackIntegration`

#### Scenario: A removed pair comes back
- **WHEN** a test copy of the source adds `coverBackground.blush` with `#F6CFE0` and `#ECBAD0`
- **THEN** the comparison fails naming `blush`

### Requirement: Surface tokens
The source SHALL define a `surface` group with exactly the entries `light` and `dark`, each with exactly `background`, `text`, `muted`, `grid`, `panel`, `shadow`, `rim`, `backdropWater`, `backdropWaterEdge`, `backdropPark`, `backdropCredit` (`color`), `rimWidth` (`dimension`) and `zoneOpacity` (`opacity`). A missing entry or token, an extra one, or another type is an error naming the path. Values: "Measured surfaces".

#### Scenario: Surface entry without its shadow
- **WHEN** the source has `surface.dark` without `shadow`
- **THEN** the build fails, naming `surface.dark.shadow` as missing (type color), and writes no file

#### Scenario: Surface entry without its zone opacity
- **WHEN** the source has `surface.light` without `zoneOpacity`
- **THEN** the build fails, naming `surface.light.zoneOpacity` as missing (type opacity), and writes no file

#### Scenario: Surface entry without its backdrop water
- **WHEN** the source has `surface.dark` without `backdropWater`
- **THEN** the build fails, naming `surface.dark.backdropWater` as missing (type color), and writes no file

#### Scenario: Extra surface
- **WHEN** the source also has `surface.sepia` with the thirteen tokens
- **THEN** the build fails, naming `surface.sepia` and "expected light and dark", and writes no file

#### Scenario: Measured surfaces
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json` has `surface.light` background `#F6F3EC`, text `#121212`, muted `#5C5852`, grid `#EDE8DE`, panel `#FFFFFF`, shadow `#121212`, rim `#F6F3EC`, rimWidth 0, zoneOpacity 0.12, backdropWater `#C9D8FF`, backdropWaterEdge `#B5C7F5`, backdropPark `#D4F2DF`, backdropCredit `#5A6385`, and `surface.dark` background `#121110`, text `#F1EEE8`, muted `#ADA79D`, grid `#3B3834`, panel `#1D1C1A`, shadow `#121110`, rim `#F1EEE8`, rimWidth 0, zoneOpacity 0.22, backdropWater `#1E3175`, backdropWaterEdge `#2A3F8A`, backdropPark `#183F52`, backdropCredit `#9AA6D6`

#### Scenario: Backdrop tokens in the CSS
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.css` declares `--ds-surface-light-backdrop-water: #C9D8FF` and `--ds-surface-dark-backdrop-credit: #9AA6D6`

### Requirement: Map tokens
The source SHALL define the `map` tokens outline, shadow, lineWidth, casing, badgeHeight, badgeTextSize, countHeight, countTextSize, stopRadius, interchangeExtra, nodeHeight, nodeRadius, edgeWidth, labelSize, ringWidth, haloWidth, licenceSize, zonePadding and bendRadius as `dimension`, and zoneTitleTint as `number`. A missing one, or one with another type, is an error. Values: 3, 0, 12, 6, 20, 12, 16, 11, 12, 2, 46, 10, 2.5, 13, 3, 1.5, 10, 32, 32 and 0.6.

#### Scenario: Map token with the wrong type
- **WHEN** `map.lineWidth` is declared `number`, `map.bendRadius` is declared `number`, or `map.zoneTitleTint` is declared `dimension`
- **THEN** the build fails, naming `map.lineWidth` or `map.bendRadius` with the expected type `dimension`, or `map.zoneTitleTint` with `number`, and writes no file

#### Scenario: Measured map values
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.ts` exports the twenty `map` values above, `tokens.json` has `map.bendRadius` 32 and `map.shadow` 0, and `tokens.css` has `--ds-map-shadow: 0px;`, `--ds-map-line-width: 12px;`, `--ds-map-halo-width: 1.5px;`, `--ds-map-bend-radius: 32px;` and `--ds-map-zone-title-tint: 0.6;`

#### Scenario: Missing bend radius
- **WHEN** `map.bendRadius` is removed from the source
- **THEN** the build fails naming `map.bendRadius` and writes no file

### Requirement: Site palette tokens
The source SHALL define `site.light` and `site.dark`, each with exactly primary, body, border, light, dark, text, textDark and textLight (`color`); `site.font` primary and secondary (`fontFamily`); `site.fontSize` base and baseSmall (`dimension`); and `site.heading` h1 to h6 and h1Small to h6Small (`number`, rem). A missing or extra one, or another type, is an error.

#### Scenario: Site palette entry missing
- **WHEN** the source has `site.dark` without `textLight`
- **THEN** the build fails, naming `site.dark.textLight` as missing (type color), and writes no file

#### Scenario: Measured site palette
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json` holds the site values, among them `site.light.primary` `#121212`, `site.dark.body` `#1C1C1C`, `site.font.primary` `'Source Sans 3', sans-serif`, `site.font.secondary` `'Source Serif 4', serif`, `site.fontSize.base` 16 and `site.heading.h1` 2.985984

### Requirement: Required cast tokens
The source SHALL define `cast.emotePop` damping, stiffness and mass, of type `number`; a missing one, or one with another type, is an error. The seven-role colours (`cast` ground, metal, mouth, glow and the `dev`, `agent`, `architect`, `devops`, `data`, `request` entries) are no longer required, and the repository's source no longer holds them. `cast.eyes` is "Cast eyes colour and signature margin".

#### Scenario: Cast token missing
- **WHEN** the source lacks `cast.emotePop.damping`
- **THEN** the build fails, names `cast.emotePop.damping` as missing (type number), and writes no file

#### Scenario: Cast token with the wrong type
- **WHEN** `cast.emotePop.mass` is declared `dimension`
- **THEN** the build fails, naming `cast.emotePop.mass` and the expected type `number`, and writes no file

#### Scenario: Approved cast values
- **WHEN** the repository's source is built
- **THEN** `tokens.json`'s `cast` holds exactly `eyes` and `emotePop`, with `cast.emotePop.stiffness` 170, `damping` 9 and `mass` 0.7, and `tokens.css` has no `--ds-cast-dev-fill`

#### Scenario: Seven-role colour no longer required
- **WHEN** a source lacks `cast.devops.fill` and every other seven-role colour
- **THEN** the build accepts it

## REMOVED Requirements

### Requirement: State colour alias
**Reason**: The one-release alias period of ADR 0006 ends in 0.7.0: the top-level `color.healthy` … `color.failFast` duplicates are removed, and `color.state.*` is the only path of the diagram state colours ("Required tokens").
**Migration**: Read `color.state.<name>` (CSS `--ds-color-state-<name>`, for example `--ds-color-state-fail-fast`) instead of `color.<name>`; the values are unchanged.

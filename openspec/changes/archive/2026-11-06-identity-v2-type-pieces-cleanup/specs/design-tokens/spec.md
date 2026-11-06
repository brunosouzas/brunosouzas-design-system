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
The source SHALL define these `color` tokens: `illustration` accent, codePanel, textBar, road, tape, iconLine. A missing one, or one with another type, is an error. Their values are the v2 values of ADR 0009, each taken from a `brand` role, except `tape`, which keeps the pale integration tint `#F4E4D8` when the track roles move to the families (`design.md`, "Track families").

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
The repository's source SHALL hold exactly twelve `coverBackground` pairs, pinned in `test/fixtures/cover-backgrounds.json`, as track families: each track has a default `track<Name>` (`trackIntegration`, `trackDelivery`, `trackAi`, `trackPersonal`) and named tones `<track><Tone>` (`integrationClay`, `integrationSand`, `deliveryMint`, `deliveryOlive`, `aiSky`, `aiLilac`, `personalRose`); `neutral` is for a cover with no track. Values: `design.md`, "Track families".

#### Scenario: Source matches the measured table
- **WHEN** the token test reads `tokens/source.json` and the fixture
- **THEN** both list the same 12 names with the same `fill` and `ring` values, for example `trackIntegration` `#F7C6A1` and `#E3AB84`, `deliveryMint` `#A9DCD6` and `#88C4BD`, `trackPersonal` `#F4DD8E` and `#DDC46C`, and `neutral` `#F6F3EC` and `#D8D6D0`

#### Scenario: Every tone belongs to a family
- **WHEN** the token test reads the fixture's names
- **THEN** each is `neutral`, one of the four defaults `track<Name>`, or a tone `<name><Tone>` whose default `track<Name>` is in the table, and each default's `fill` equals `brand.light.track<Name>`

#### Scenario: A tone without its family
- **WHEN** a test copy of the source adds `coverBackground.opsTeal` with `#B5E0E0` and `#94C8C8`
- **THEN** the family check fails naming `opsTeal`, and the comparison with the fixture fails naming `opsTeal`

#### Scenario: A pair drifts
- **WHEN** a test copy of the source changes `coverBackground.trackIntegration.ring` to `#E3AB85`
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

### Requirement: Brand colour roles
The source SHALL define a `brand` group with exactly the entries `light` and `dark`, each with exactly `bg`, `cardBg`, `text`, `textMuted`, `border`, `borderStrong`, `accent`, `accentText`, `onAccent`, `success`, `failure`, `warning`, `trackIntegration`, `trackDelivery`, `trackAi`, `trackPersonal` (`color`). A missing entry, an extra one, or a wrong type is an error naming the path; an entry other than `light` or `dark` is an error, the same rule `surface` already follows.

#### Scenario: Missing brand role
- **WHEN** the source has `brand.light` without `accent`, or `brand.dark` without `trackPersonal`
- **THEN** the build fails, naming `brand.light.accent` (or `brand.dark.trackPersonal`) as missing (type color), and writes no file

#### Scenario: Extra brand theme
- **WHEN** the source also has `brand.sepia` with the sixteen tokens
- **THEN** the build fails, naming `brand.sepia` and "expected light and dark", and writes no file

#### Scenario: Measured brand roles, light theme
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json`'s `brand.light` has `bg` `#F6F3EC`, `cardBg` `#FFFFFF`, `text` `#121212`, `textMuted` `#5C5852`, `border` `#D7D1C5`, `borderStrong` `#5C5852`, `accent` `#E04E17`, `accentText` `#B83A0C`, `onAccent` `#FFFFFF`, `success` `#2B7A4B`, `failure` `#A1124B`, `warning` `#8F5F00`, `trackIntegration` `#F7C6A1`, `trackDelivery` `#B9DEC3`, `trackAi` `#C5CDF2`, `trackPersonal` `#F4DD8E`

#### Scenario: Measured brand roles, dark theme
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json`'s `brand.dark` has `bg` `#121110`, `cardBg` `#1D1C1A`, `text` `#F1EEE8`, `textMuted` `#ADA79D`, `border` `#3B3834`, `borderStrong` `#ADA79D`, `accent` `#FF7A45`, `accentText` `#FF7A45`, `onAccent` `#121110`, `success` `#5BBF86`, `failure` `#FF6696`, `warning` `#EBB34B`, `trackIntegration` `#2A1C15`, `trackDelivery` `#18231D`, `trackAi` `#1B1F28`, `trackPersonal` `#29240F`

## REMOVED Requirements

### Requirement: State colour alias
**Reason**: The one-release alias period of ADR 0006 ends in 0.7.0: the top-level `color.healthy` … `color.failFast` duplicates are removed, and `color.state.*` is the only path of the diagram state colours ("Required tokens").
**Migration**: Read `color.state.<name>` (CSS `--ds-color-state-<name>`, for example `--ds-color-state-fail-fast`) instead of `color.<name>`; the values are unchanged.

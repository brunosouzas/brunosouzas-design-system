# design-tokens Specification

## Purpose
Keeps the visual identity's values (colour, type, outline, shadow, radius, motion) in one source file and generates the CSS, TypeScript and JSON files that every consumer reads, so the copies cannot drift.

## Requirements

### Requirement: Token source
The repository SHALL keep every token in one source file, `tokens/source.json`, whose root is a JSON object. Each token has a value and a type. Tokens sit in exactly these top-level groups: `color`, `outline`, `shadow`, `radius`, `font`, `motion`, `illustration`, `cover`, `coverBackground`, `surface`, `brand`, `map`, `site`, `banner`, `bodyDiagram`, `cast`, `scene`; a group may nest one more level (for example `motion.pop.damping`, `brand.light.accent`).

#### Scenario: Source file missing or not an object
- **WHEN** `tokens/source.json` does not exist, or its root is `[]` or `null`
- **THEN** the build fails, saying which, and writes no file

#### Scenario: Source with an unknown group
- **WHEN** the source has a top-level group outside the seventeen named groups, such as `colour`
- **THEN** the build fails, names the group, and writes no file

#### Scenario: Token without a type
- **WHEN** a token has a value but no type, or a type outside the supported types
- **THEN** the build fails, names the token's full path and the reason, and writes no file

#### Scenario: New groups accepted
- **WHEN** the source has `illustration.accent`, `cover.width`, `coverBackground.blush.fill`, `surface.dark.shadow`, `brand.light.accent`, `map.lineWidth`, `site.light.primary`, `banner.radius`, `bodyDiagram.radius`, `cast.dev.fill` and `scene.ringStep` with valid types and values
- **THEN** the build accepts them and they appear in all three outputs, for example `--ds-cover-background-blush-fill`, `--ds-surface-dark-shadow`, `--ds-brand-light-accent`, `--ds-banner-radius`, `--ds-body-diagram-radius`, `--ds-cast-dev-fill` and `--ds-scene-ring-step` in `tokens.css`

### Requirement: Token shape, names and nesting
A token SHALL be an object with `$value` and `$type`, and MAY have a string `$description`, which no output uses; any other key in a token is an error. A group SHALL be an object of tokens or (at the second level) groups. Names SHALL match `^[a-z][a-zA-Z0-9]*$`. A token sits two or three levels deep (`color.ink`, `motion.pop.damping`); deeper nesting or an empty group is an error. Invalid JSON is an error.

#### Scenario: Invalid JSON
- **WHEN** `tokens/source.json` has a trailing comma
- **THEN** the build fails with the parser's line and column, and writes no file

#### Scenario: Name that is not camelCase
- **WHEN** the source has a token `color.fail-fast` or `color.Ink`
- **THEN** the build fails, naming the token path and "expected camelCase", and writes no file

#### Scenario: Too deep or unknown token key
- **WHEN** the source has `motion.pop.spring.damping`, or a token with a `$unit` key, or a token `color.ink` that also holds a child `dark`
- **THEN** the build fails, naming the path, and writes no file

#### Scenario: Group that is not an object
- **WHEN** the source has `"outline": 4` or `"color": []`
- **THEN** the build fails, naming the group, and writes no file

### Requirement: CSS names
Each token's CSS name SHALL be `--ds-` followed by its path joined with `-`, where each name is put in kebab case: a `-` before each capital letter, which is lowercased; digits stay as they are. Two tokens whose CSS names are equal are an error.

#### Scenario: Kebab case with capitals and digits
- **WHEN** the source has `color.failFast`, `color.okHTTP` and `color.ink2Dark`
- **THEN** their CSS names are `--ds-color-fail-fast`, `--ds-color-ok-h-t-t-p` and `--ds-color-ink2-dark`

#### Scenario: Two paths with one CSS name
- **WHEN** the source has both `motion.pop.damping` and `motion.popDamping`
- **THEN** the build fails, naming both paths and the shared name `--ds-motion-pop-damping`, and writes no file

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

### Requirement: Supported token types and their values
The build SHALL accept these types and reject a value that does not fit: `color` (`#RRGGBB`, either case, written as in the source), `dimension` (pixels from 0 to 10000, at most two decimals), `frames` (a positive integer), `number` (finite, above zero), `opacity` (above 0, at most 1), `fontFamily` (non-empty, without `;`, `{`, `}`, `<`, `>` or a line break), `fontWeight` (100 to 900 in steps of 100).

#### Scenario: Malformed colour
- **WHEN** a `color` token has the value `#12345` or `red`
- **THEN** the build fails, naming the token path and "expected #RRGGBB", and writes no file

#### Scenario: Zero or negative frame count
- **WHEN** a `frames` token has the value `0` or `-5`
- **THEN** the build fails, naming the token path, and writes no file

#### Scenario: Non-integer or off-step values
- **WHEN** a `frames` token is `0.5`, a `dimension` token is `-1`, `1.555` or `10001`, or a `fontWeight` token is `450` or `950`
- **THEN** the build fails, naming each token path, and writes no file

#### Scenario: Opacity above one
- **WHEN** an `opacity` token has the value `1.2`
- **THEN** the build fails, naming the token path, and writes no file

#### Scenario: Font family that would break the CSS
- **WHEN** `font.sans` is `Lato; } body { color: red`
- **THEN** the build fails, naming `font.sans`, and writes no file

#### Scenario: Boundary values accepted
- **WHEN** an `opacity` token is `1`, a `fontWeight` token is `900`, and `dimension` tokens are `0`, `3.5`, `12.8` and `10000`
- **THEN** the build accepts them, and `tokens.css` writes `3.5px` and `12.8px`

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

### Requirement: Required motion tokens
The source SHALL define these motion tokens with these types; a missing one, or one with another type, is an error: `motion` fps, drawArrow, travel, fade, readingHold (`frames`); dimOpacity (`opacity`); focusScale (`number`); `motion.pop` and `motion.focus` damping, stiffness, mass (`number`).

#### Scenario: Missing motion token
- **WHEN** the source lacks `motion.focus.mass`
- **THEN** the build fails, names `motion.focus.mass` as missing, and writes no file

#### Scenario: Frame rate with the wrong type
- **WHEN** `motion.fps` is declared with type `number`
- **THEN** the build fails, naming `motion.fps` and the expected type `frames`, and writes no file

#### Scenario: Extra token in a known group
- **WHEN** the source adds `color.accent` with type `color` and a valid value
- **THEN** the build accepts it and it appears in all three outputs

### Requirement: Generated outputs
`npm run tokens` SHALL write three files in `tokens/generated/`: `tokens.css` (one CSS custom property per token on `:root`, named `--ds-` plus the path in kebab case, `failFast` becoming `fail-fast`; `dimension` values with `px`; `fontFamily` values as written), `tokens.ts` (a typed, read-only object with the source's nesting) and `tokens.json` (the same nesting with plain values). It prints one line per file written.

#### Scenario: CSS custom property names and units
- **WHEN** the source has `outline.block` = 4 (`dimension`) and `motion.pop.damping` = 13 (`number`)
- **THEN** `tokens.css` contains `--ds-outline-block: 4px;` and `--ds-motion-pop-damping: 13;`

#### Scenario: TypeScript and JSON keep the nesting
- **WHEN** the source has `motion.pop.damping` = 13
- **THEN** `tokens.ts` exports it as `tokens.motion.pop.damping` with the number 13, and `tokens.json` has the same path with the number 13

#### Scenario: Generated files say they are generated
- **WHEN** the build writes `tokens.css` and `tokens.ts`
- **THEN** each starts with a comment saying it is generated from `tokens/source.json` and must not be edited by hand

### Requirement: Deterministic build
The build SHALL produce byte-identical outputs from the same source, whatever the order of keys in the source file (outputs list keys sorted by Unicode code point, with LF line endings), and running it twice SHALL leave the files unchanged.

#### Scenario: Same source, same bytes
- **WHEN** the build runs twice on an unchanged source
- **THEN** the three files are byte-identical after both runs

#### Scenario: Key order does not matter
- **WHEN** two sources hold the same tokens in a different key order
- **THEN** their outputs are byte-identical

### Requirement: Freshness check
`npm run tokens:check` SHALL compare the files in `tokens/generated/` with what the build would produce, write nothing, exit 0 when they match, and otherwise exit 1 naming each stale or missing file.

#### Scenario: Stale output
- **WHEN** `tokens/source.json` changed and the build was not run
- **THEN** the check exits 1 and names the files that differ

#### Scenario: Missing output
- **WHEN** `tokens/generated/tokens.json` does not exist
- **THEN** the check exits 1 and names it as missing

#### Scenario: Invalid source during the check
- **WHEN** the source is invalid
- **THEN** the check exits 1 with the same message the build gives, and writes nothing

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

### Requirement: Cover background pairs
`coverBackground` SHALL hold at least one entry, and each entry SHALL be a group with exactly two `color` tokens, `fill` and `ring`. A missing `coverBackground`, an empty one, an entry without `fill` or `ring`, an entry with another token, or a token of another type, is an error naming the path.

#### Scenario: Entry without a ring
- **WHEN** the source has `coverBackground.blush.fill` and no `coverBackground.blush.ring`
- **THEN** the build fails, naming `coverBackground.blush.ring` as missing, and writes no file

#### Scenario: Extra token in an entry
- **WHEN** an entry `coverBackground.blush` also has `shadow`
- **THEN** the build fails, naming `coverBackground.blush.shadow`, and writes no file

#### Scenario: Token directly under the group
- **WHEN** the source has `coverBackground.blush` as a token instead of a group
- **THEN** the build fails, naming `coverBackground.blush` and "expected a group with fill and ring", and writes no file

#### Scenario: Ring with another type
- **WHEN** `coverBackground.blush.ring` is declared `dimension`
- **THEN** the build fails, naming it and the expected type `color`, and writes no file

#### Scenario: Missing group
- **WHEN** the source has no `coverBackground` group
- **THEN** the build fails, naming `coverBackground` as missing, and writes no file

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
- **THEN** `tokens.json` has `surface.light` background `#F6F3EC`, text `#121212`, muted `#5C5852`, grid `#EDE8DE`, panel `#FFFFFF`, shadow `#121212`, rim `#F6F3EC`, rimWidth 0, zoneOpacity 0.12, backdropWater `#C7DAEA`, backdropWaterEdge `#A9C4DA`, backdropPark `#D6E4CF`, backdropCredit `#5C5852`, and `surface.dark` background `#121110`, text `#F1EEE8`, muted `#ADA79D`, grid `#3B3834`, panel `#1D1C1A`, shadow `#121110`, rim `#F1EEE8`, rimWidth 0, zoneOpacity 0.22, backdropWater `#1C2733`, backdropWaterEdge `#2A3846`, backdropPark `#1A241D`, backdropCredit `#ADA79D`

#### Scenario: Backdrop tokens in the CSS
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.css` declares `--ds-surface-light-backdrop-water: #C7DAEA` and `--ds-surface-dark-backdrop-credit: #ADA79D`

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
The source SHALL define `site.light` and `site.dark`, each with exactly primary, body, border, light, dark, text, textDark, textLight and link (`color`); `site.font` primary, secondary and mono (`fontFamily`); `site.fontSize` base and baseSmall (`dimension`); and `site.heading` h1 to h6 and h1Small to h6Small (`number`, rem). A missing or extra one, or another type, is an error.

#### Scenario: Site palette entry missing
- **WHEN** the source has `site.dark` without `textLight`, and then `site.light` without `link`
- **THEN** each build fails, naming `site.dark.textLight`, then `site.light.link`, as missing (type color), and writes no file

#### Scenario: Measured site palette
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json` holds `site.light` `{ primary: #121212, body: #F6F3EC, border: #D7D1C5, light: #FFFFFF, dark: #121212, text: #121212, textDark: #121212, textLight: #5C5852, link: #B83A0C }`, `site.dark` `{ primary: #F1EEE8, body: #121110, border: #3B3834, light: #1D1C1A, dark: #F1EEE8, text: #F1EEE8, textDark: #F1EEE8, textLight: #ADA79D, link: #FF7A45 }`, `site.font.primary` `'Source Sans 3', sans-serif`, `site.font.secondary` `'Source Serif 4', serif`, `site.font.mono` `'Source Code Pro', monospace`, `site.fontSize.base` 16 and `site.heading.h1` 2.985984, and `tokens.css` holds `--ds-site-light-link` and `--ds-site-font-mono`

### Requirement: Required banner tokens
The source SHALL define `banner` width, height and radius, each of type `dimension`. A missing one, or one with another type, is an error. Values: 1200, 420 and 20, measured from the published brunosouzas.com home banner.

#### Scenario: Banner token missing
- **WHEN** the source lacks `banner.radius`
- **THEN** the build fails, names `banner.radius` as missing, and writes no file

#### Scenario: Banner token with the wrong type
- **WHEN** `banner.width` is declared `number`
- **THEN** the build fails, naming `banner.width` and the expected type `dimension`, and writes no file

#### Scenario: Measured banner values
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.ts` exports `tokens.banner.width` 1200, `height` 420 and `radius` 20, and `tokens.css` has `--ds-banner-width: 1200px;`

### Requirement: Bend radius meaning
`map.bendRadius` in `tokens/source.json` SHALL carry the `$description` "Radius of a bundle's centre line at a 45° or 90° bend, in map units (stackledger round-bends, AB#166)." The generated files hold only the value, as for every token. No piece reads it; a map engine draws its bends with it.

#### Scenario: Described bend radius
- **WHEN** the test reads `tokens/source.json`
- **THEN** `map.bendRadius` has `$value` 32, `$type` `dimension` and that `$description`, and the generated `tokens.json` holds `map.bendRadius` as the plain number 32

### Requirement: Required body diagram tokens
The source SHALL define `bodyDiagram` width, layoutWidth, radius, ringRadius and startRadius, each of type `dimension`. A missing one, or one with another type, is an error. Values: 800, 560, 14, 70 and 11, measured from the published body diagrams at their shown width (800); a diagram is laid out 560 wide.

#### Scenario: Body diagram token missing
- **WHEN** the source lacks `bodyDiagram.layoutWidth`
- **THEN** the build fails, names `bodyDiagram.layoutWidth` as missing, and writes no file

#### Scenario: Body diagram token with the wrong type
- **WHEN** `bodyDiagram.radius` is declared `number`
- **THEN** the build fails, naming `bodyDiagram.radius` and the expected type `dimension`, and writes no file

#### Scenario: Measured body diagram values
- **WHEN** the repository's source is built
- **THEN** `tokens.ts` exports `bodyDiagram` 800, 560, 14, 70 and 11, and `tokens.css` has `--ds-body-diagram-layout-width: 560px;`

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
The source SHALL define a `brand` group with exactly the entries `light` and `dark`, each with exactly `bg`, `cardBg`, `text`, `textMuted`, `border`, `borderStrong`, `accent`, `accentText`, `onAccent`, `success`, `failure`, `warning`, `trackIntegration`, `trackDelivery`, `trackAi`, `trackPersonal`, `stackledgerAccent` (`color`). A missing entry, an extra one, or a wrong type is an error naming the path; an entry other than `light` or `dark` is an error, the same rule `surface` already follows.

#### Scenario: Missing brand role
- **WHEN** the source has `brand.light` without `accent`, or `brand.dark` without `trackPersonal`, or `brand.dark` without `stackledgerAccent`
- **THEN** the build fails, naming `brand.light.accent` (or `brand.dark.trackPersonal`, or `brand.dark.stackledgerAccent`) as missing (type color), and writes no file

#### Scenario: Product accent with the wrong type
- **WHEN** the source declares `brand.light.stackledgerAccent` with type `dimension`
- **THEN** the build fails, naming `brand.light.stackledgerAccent` with the expected type `color`, and writes no file

#### Scenario: Extra brand theme
- **WHEN** the source also has `brand.sepia` with the seventeen tokens
- **THEN** the build fails, naming `brand.sepia` and "expected light and dark", and writes no file

#### Scenario: Measured brand roles, light theme
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json`'s `brand.light` has `bg` `#F6F3EC`, `cardBg` `#FFFFFF`, `text` `#121212`, `textMuted` `#5C5852`, `border` `#D7D1C5`, `borderStrong` `#5C5852`, `accent` `#E04E17`, `accentText` `#B83A0C`, `onAccent` `#FFFFFF`, `success` `#2B7A4B`, `failure` `#A1124B`, `warning` `#8F5F00`, `trackIntegration` `#F7C6A1`, `trackDelivery` `#B9DEC3`, `trackAi` `#C5CDF2`, `trackPersonal` `#F4DD8E`, `stackledgerAccent` `#3B5BDB`

#### Scenario: Measured brand roles, dark theme
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json`'s `brand.dark` has `bg` `#121110`, `cardBg` `#1D1C1A`, `text` `#F1EEE8`, `textMuted` `#ADA79D`, `border` `#3B3834`, `borderStrong` `#ADA79D`, `accent` `#FF7A45`, `accentText` `#FF7A45`, `onAccent` `#121110`, `success` `#5BBF86`, `failure` `#FF6696`, `warning` `#EBB34B`, `trackIntegration` `#2A1C15`, `trackDelivery` `#18231D`, `trackAi` `#1B1F28`, `trackPersonal` `#29240F`, `stackledgerAccent` `#7D8CFF`

#### Scenario: Product accent in the CSS
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.css` declares `--ds-brand-light-stackledger-accent: #3B5BDB` and `--ds-brand-dark-stackledger-accent: #7D8CFF`

#### Scenario: Product accent in a spec
- **WHEN** a banner spec gives a `pipe` the fill `brand.light.stackledgerAccent`
- **THEN** the cover command accepts it, and the pipe's coloured path is stroked `#3B5BDB`

### Requirement: Cast eyes colour and signature margin
`cast` SHALL gain `eyes` (`color`), shared by every character in both themes. `cover` SHALL gain `signatureMargin` (`dimension`), the signature lockup's fixed distance from a frame's right and bottom edges.

#### Scenario: Cast eyes present
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json`'s `cast.eyes` is `#FFC98A`

#### Scenario: Signature margin present
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.ts` exports `tokens.cover.signatureMargin` as a positive number of pixels

#### Scenario: Cast colour is not a token
- **WHEN** a piece draws a character's body, outline or visor
- **THEN** it picks `color.white` (body), `brand.light.text`/`brand.dark.textMuted` (outline) or `brand.light.text`/`brand.dark.bg` (visor) itself from its `surface` parameter; the visor is deliberately not the mirror of the outline, since the approved sheets keep the screen face near-black in both themes

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

### Requirement: Site colours are brand roles
Each `site.<theme>` colour SHALL equal the `brand.<theme>` role it stands for: primary, dark, text and textDark equal `text`; body equals `bg`; light equals `cardBg`; border equals `border`; textLight equals `textMuted`; link equals `accentText`. The token test's mapping check, `siteRoleMismatches(source)`, returns every pair that differs as `<site path> ≠ <brand path>`.

#### Scenario: Every site colour matches its role
- **WHEN** the mapping check runs on the repository's source
- **THEN** it returns no mismatch for the eighteen pairs

#### Scenario: A site colour that drifts from its role
- **WHEN** the mapping check runs on a copy of the source whose `site.dark.textLight` is `#B4AFB6` (its 0.7.0 value)
- **THEN** it returns exactly `site.dark.textLight ≠ brand.dark.textMuted`

### Requirement: Site palette contrast
In each theme, `site.<theme>.text`, `textLight` and `link` SHALL each reach a WCAG 2.x contrast of at least 4.5:1 on `site.<theme>.body` and on `site.<theme>.light`. The token test's contrast check, `siteContrastBelow(source, 4.5)`, returns every pair under the floor, comparing the unrounded ratio and reporting it rounded to two decimals.

#### Scenario: Site pairs above the floor
- **WHEN** the contrast check runs on the repository's source
- **THEN** it returns no pair

#### Scenario: A link below the floor
- **WHEN** the contrast check runs on a copy of the source whose `site.light.link` is `#E04E17` (`brand.light.accent`)
- **THEN** it returns exactly `site.light.link` on `site.light.body` at 3.59 and `site.light.link` on `site.light.light` at 3.98

### Requirement: Product accent contrast
In each theme, `brand.<theme>.stackledgerAccent` SHALL reach a WCAG 2.x contrast of at least 4.5:1 on `site.<theme>.body` and on `site.<theme>.light`. The token test's check, `productAccentContrastBelow(source, 4.5)`, returns every pair under the floor as `<accent path> on <site path> at <ratio>`, comparing the unrounded ratio and writing it with two decimals; a missing or non-`#RRGGBB` value throws naming the path.

#### Scenario: Accent above the floor
- **WHEN** the check runs on the repository's source
- **THEN** it returns no pair

#### Scenario: An accent below the floor
- **WHEN** the check runs on a copy of the source whose `brand.light.stackledgerAccent` is `#8FB2FF`
- **THEN** it returns exactly `brand.light.stackledgerAccent on site.light.body at 1.90` and `brand.light.stackledgerAccent on site.light.light at 2.10`

#### Scenario: A missing accent value
- **WHEN** the check runs on a copy of the source without `brand.dark.stackledgerAccent`
- **THEN** it throws naming `brand.dark.stackledgerAccent`

### Requirement: Backdrop credit is the muted text role
`surface.<theme>.backdropCredit` SHALL equal `brand.<theme>.textMuted`. The token test's check, `backdropCreditMismatches(source)`, returns every pair that differs as `<surface path> ≠ <brand path>`; a missing or non-`#RRGGBB` value throws naming the path.

#### Scenario: Credit matches its role
- **WHEN** the check runs on the repository's source
- **THEN** it returns no mismatch

#### Scenario: A credit that drifts
- **WHEN** the check runs on a copy of the source whose `surface.dark.backdropCredit` is `#9AA6D6` (its 0.8.0 value)
- **THEN** it returns exactly `surface.dark.backdropCredit ≠ brand.dark.textMuted`

#### Scenario: A missing credit value
- **WHEN** the check runs on a copy of the source without `surface.light.backdropCredit`
- **THEN** it throws naming `surface.light.backdropCredit`

### Requirement: Required scene tokens
The source SHALL define the `scene` group, the stage of a video in composition pixels, the same in every format: `ringRadius`, `ringStep`, `ringWidth` (the stage rings), `pathDash`, `pathGap`, `pathWidth` (the dashed motion path) of type `dimension`, `ringReach` of type `number` and `pathColor` of type `color`. A missing one, or one with another type, is an error. Values: 100, 34, 2.5, 4, 18, 6, 1.2 and `#5C5852`.

#### Scenario: Scene token missing
- **GIVEN** a copy of the source without `scene.pathGap`
- **WHEN** the build runs
- **THEN** it fails, names `scene.pathGap` as missing (type dimension), and writes no file

#### Scenario: Scene token with the wrong type
- **GIVEN** a copy of the source where `scene.ringReach` is declared `dimension`, and another where `scene.pathColor` is declared `dimension` with the value 4
- **WHEN** the build runs on each
- **THEN** each fails, naming `scene.ringReach` and the expected type `number`, then `scene.pathColor` and the expected type `color`, and writes no file

#### Scenario: Scene values
- **GIVEN** the repository's source
- **WHEN** the build runs
- **THEN** `tokens.ts` exports `tokens.scene` as exactly `ringRadius` 100, `ringStep` 34, `ringWidth` 2.5, `ringReach` 1.2, `pathDash` 4, `pathGap` 18, `pathWidth` 6 and `pathColor` `#5C5852`, `tokens.css` has `--ds-scene-ring-width: 2.5px;`, `--ds-scene-ring-reach: 1.2;` and `--ds-scene-path-color: #5C5852;`, and `scene.pathDash` has a `$description` saying the path is drawn with round caps

#### Scenario: A ring reach of zero
- **GIVEN** a copy of the source where `scene.ringReach` is 0
- **WHEN** the build runs
- **THEN** it fails naming `scene.ringReach` (a `number` is finite and above zero), and writes no file

### Requirement: Scene path colour is the muted text role
`scene.pathColor` SHALL equal `brand.light.textMuted`, and its `$description` SHALL say so. The token test's check returns `scene.pathColor ≠ brand.light.textMuted` when the two differ, and throws naming the path when either value is missing or not `#RRGGBB`.

#### Scenario: Path colour matches its role
- **GIVEN** the repository's source
- **WHEN** the check runs
- **THEN** it returns no mismatch, and `scene.pathColor` has a `$description` naming `brand.light.textMuted`

#### Scenario: A path colour that drifts
- **GIVEN** a copy of the source whose `scene.pathColor` is `#121212`
- **WHEN** the check runs
- **THEN** it returns exactly `scene.pathColor ≠ brand.light.textMuted`

#### Scenario: A missing or malformed path colour
- **GIVEN** a copy of the source without `scene.pathColor`, and another whose `brand.light.textMuted` is `grey`
- **WHEN** the check runs on each
- **THEN** the first throws naming `scene.pathColor`, the second naming `brand.light.textMuted`

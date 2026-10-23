## MODIFIED Requirements

### Requirement: Token source
The repository SHALL keep every token in one source file, `tokens/source.json`, whose root is a JSON object. Each token has a value and a type. Tokens sit in exactly these top-level groups: `color`, `outline`, `shadow`, `radius`, `font`, `motion`, `illustration`, `cover`, `coverBackground`, `surface`, `map`, `site`; a group may nest one more level (for example `motion.pop.damping`).

#### Scenario: Source file missing or not an object
- **WHEN** `tokens/source.json` does not exist, or its root is `[]` or `null`
- **THEN** the build fails, saying which, and writes no file

#### Scenario: Source with an unknown group
- **WHEN** the source has a top-level group outside the twelve named groups, such as `colour`
- **THEN** the build fails, names the group, and writes no file

#### Scenario: Token without a type
- **WHEN** a token has a value but no type, or a type outside the supported types
- **THEN** the build fails, names the token's full path and the reason, and writes no file

#### Scenario: New groups accepted
- **WHEN** the source has `illustration.accent`, `cover.width`, `coverBackground.blush.fill`, `surface.dark.shadow`, `map.lineWidth` and `site.light.primary` with valid types and values
- **THEN** the build accepts them and they appear in all three outputs, for example `--ds-cover-background-blush-fill` and `--ds-surface-dark-shadow` in `tokens.css`

### Requirement: Supported token types and their values
The build SHALL accept these types and reject a value that does not fit its type: `color` (a `#RRGGBB` hex string, letters in either case, written to the outputs as in the source), `dimension` (a number of pixels from 0 to 10000 with at most two decimal places), `frames` (a positive integer), `number` (a finite number greater than zero), `opacity` (a number greater than 0 and at most 1), `fontFamily` (a non-empty string without `;`, `{`, `}`, `<`, `>` or a line break), `fontWeight` (an integer from 100 to 900 in steps of 100).

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

## ADDED Requirements

### Requirement: Surface tokens
The source SHALL define a `surface` group with exactly the entries `light` and `dark`, each with exactly `background`, `text`, `muted`, `grid`, `panel`, `shadow`, `rim` (`color`) and `rimWidth` (`dimension`). A missing entry or token, an extra one, or another type is an error naming the path. The repository's values are those of `design.md` §2.

#### Scenario: Surface entry without its shadow
- **WHEN** the source has `surface.dark` without `shadow`
- **THEN** the build fails, naming `surface.dark.shadow` as missing (type color), and writes no file

#### Scenario: Extra surface
- **WHEN** the source also has `surface.sepia` with the eight tokens
- **THEN** the build fails, naming `surface.sepia` and "expected light and dark", and writes no file

#### Scenario: Measured surfaces
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json` has `surface.light` background `#EEF2FF`, text `#0A1033`, muted `#5B6694`, grid `#E0E7FB`, panel `#FFFFFF`, shadow `#0A1033`, rim `#EEF2FF`, rimWidth 0, and `surface.dark` background `#14215A`, text `#EEF2FF`, muted `#8F9BD0`, grid `#1C2D74`, panel `#1C2D74`, shadow `#4C5CB8`, rim `#EEF2FF`, rimWidth 1

### Requirement: Map tokens
The source SHALL define the `map` tokens outline, shadow, lineWidth, casing, badgeHeight, badgeTextSize, countHeight, countTextSize, stopRadius, interchangeExtra, nodeHeight, nodeRadius, edgeWidth and labelSize, all `dimension`. A missing one, or one with another type, is an error. Values: 3, 3.5, 12, 6, 20, 12, 16, 11, 12, 2, 46, 10, 2.5 and 13.

#### Scenario: Map token with the wrong type
- **WHEN** `map.lineWidth` is declared `number`
- **THEN** the build fails, naming `map.lineWidth` and the expected type `dimension`, and writes no file

#### Scenario: Measured map values
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.ts` exports the fourteen `map` values above, and `tokens.css` has `--ds-map-line-width: 12px;`

### Requirement: Site palette tokens
The source SHALL define `site.light` and `site.dark`, each with exactly primary, body, border, light, dark, text, textDark and textLight (`color`); `site.font` primary and secondary (`fontFamily`); `site.fontSize` base and baseSmall (`dimension`); and `site.heading` h1 to h6 and h1Small to h6Small (`number`, rem). A missing or extra one, or another type, is an error.

#### Scenario: Site palette entry missing
- **WHEN** the source has `site.dark` without `textLight`
- **THEN** the build fails, naming `site.dark.textLight` as missing (type color), and writes no file

#### Scenario: Measured site palette
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json` holds the values of `design.md` §2, among them `site.light.primary` `#121212`, `site.dark.body` `#1C1C1C`, `site.font.primary` `Heebo, sans-serif`, `site.fontSize.base` 16 and `site.heading.h1` 2.985984

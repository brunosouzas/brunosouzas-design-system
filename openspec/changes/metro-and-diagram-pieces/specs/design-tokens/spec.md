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

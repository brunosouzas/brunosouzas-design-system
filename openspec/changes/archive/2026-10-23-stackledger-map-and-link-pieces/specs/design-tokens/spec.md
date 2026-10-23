## MODIFIED Requirements

### Requirement: Surface tokens
The source SHALL define a `surface` group with exactly the entries `light` and `dark`, each with exactly `background`, `text`, `muted`, `grid`, `panel`, `shadow`, `rim` (`color`), `rimWidth` (`dimension`) and `zoneOpacity` (`opacity`). A missing entry or token, an extra one, or another type is an error naming the path. The repository's values are those of the designs (`metro-and-diagram-pieces` §2, `stackledger-map-and-link-pieces` §7).

#### Scenario: Surface entry without its shadow
- **WHEN** the source has `surface.dark` without `shadow`
- **THEN** the build fails, naming `surface.dark.shadow` as missing (type color), and writes no file

#### Scenario: Surface entry without its zone opacity
- **WHEN** the source has `surface.light` without `zoneOpacity`
- **THEN** the build fails, naming `surface.light.zoneOpacity` as missing (type opacity), and writes no file

#### Scenario: Extra surface
- **WHEN** the source also has `surface.sepia` with the nine tokens
- **THEN** the build fails, naming `surface.sepia` and "expected light and dark", and writes no file

#### Scenario: Measured surfaces
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json` has `surface.light` background `#EEF2FF`, text `#0A1033`, muted `#5B6694`, grid `#E0E7FB`, panel `#FFFFFF`, shadow `#0A1033`, rim `#EEF2FF`, rimWidth 0, zoneOpacity 0.12, and `surface.dark` background `#14215A`, text `#EEF2FF`, muted `#8F9BD0`, grid `#1C2D74`, panel `#1C2D74`, shadow `#4C5CB8`, rim `#EEF2FF`, rimWidth 1, zoneOpacity 0.22

### Requirement: Map tokens
The source SHALL define the `map` tokens outline, shadow, lineWidth, casing, badgeHeight, badgeTextSize, countHeight, countTextSize, stopRadius, interchangeExtra, nodeHeight, nodeRadius, edgeWidth, labelSize, ringWidth, haloWidth, licenceSize and zonePadding as `dimension`, and zoneTitleTint as `number`. A missing one, or one with another type, is an error. Values: 3, 3.5, 12, 6, 20, 12, 16, 11, 12, 2, 46, 10, 2.5, 13, 3, 1.5, 10, 32 and 0.6.

#### Scenario: Map token with the wrong type
- **WHEN** `map.lineWidth` is declared `number`, or `map.zoneTitleTint` is declared `dimension`
- **THEN** the build fails, naming `map.lineWidth` with the expected type `dimension`, or `map.zoneTitleTint` with `number`, and writes no file

#### Scenario: Measured map values
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.ts` exports the nineteen `map` values above, and `tokens.css` has `--ds-map-line-width: 12px;`, `--ds-map-halo-width: 1.5px;` and `--ds-map-zone-title-tint: 0.6;`

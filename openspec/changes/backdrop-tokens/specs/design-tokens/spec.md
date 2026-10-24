## MODIFIED Requirements

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
- **THEN** `tokens.json` has `surface.light` background `#EEF2FF`, text `#0A1033`, muted `#5B6694`, grid `#E0E7FB`, panel `#FFFFFF`, shadow `#0A1033`, rim `#EEF2FF`, rimWidth 0, zoneOpacity 0.12, backdropWater `#C9D8FF`, backdropWaterEdge `#B5C7F5`, backdropPark `#D4F2DF`, backdropCredit `#5A6385`, and `surface.dark` background `#14215A`, text `#EEF2FF`, muted `#8F9BD0`, grid `#1C2D74`, panel `#1C2D74`, shadow `#4C5CB8`, rim `#EEF2FF`, rimWidth 1, zoneOpacity 0.22, backdropWater `#1E3175`, backdropWaterEdge `#2A3F8A`, backdropPark `#183F52`, backdropCredit `#9AA6D6`

#### Scenario: Backdrop tokens in the CSS
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.css` declares `--ds-surface-light-backdrop-water: #C9D8FF` and `--ds-surface-dark-backdrop-credit: #9AA6D6`

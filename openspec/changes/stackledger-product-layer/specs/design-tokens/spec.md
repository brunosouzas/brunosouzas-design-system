## ADDED Requirements

### Requirement: Product accent tokens
The source SHALL define a `stackledger` group with exactly the entries `light` and `dark`, each with exactly `accent` (`color`). A missing token, an extra one, a wrong type or an entry other than `light` or `dark` is an error naming the path, the rule `brand` follows. Values: `#3B5BDB` (light) and `#7D8CFF` (dark).

#### Scenario: Measured product accent
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json` has `stackledger.light.accent` `#3B5BDB` and `stackledger.dark.accent` `#7D8CFF`, and `tokens.css` declares `--ds-stackledger-light-accent: #3B5BDB` and `--ds-stackledger-dark-accent: #7D8CFF`

#### Scenario: Product accent missing or extra
- **WHEN** the source has `stackledger.dark` without `accent`, and then `stackledger.light` with an extra `link`
- **THEN** each build fails, naming `stackledger.dark.accent` as missing (type color), then `stackledger.light.link` as unexpected, and writes no file

#### Scenario: Extra product theme
- **WHEN** the source also has `stackledger.sepia` with `accent`
- **THEN** the build fails, naming `stackledger.sepia` and "expected light and dark", and writes no file

#### Scenario: Product accent in a spec
- **WHEN** a banner spec gives a `pipe` the fill `stackledger.light.accent`
- **THEN** the cover command accepts it and the pipe's fill is `#3B5BDB`

### Requirement: Product accent contrast
In each theme, `stackledger.<theme>.accent` SHALL reach a WCAG 2.x contrast of at least 4.5:1 on `site.<theme>.body` and on `site.<theme>.light`. The token test's check, `productAccentContrastBelow(source, 4.5)`, returns every pair under the floor, comparing the unrounded ratio and reporting it rounded to two decimals; a missing or non-`#RRGGBB` value throws naming the path.

#### Scenario: Accent above the floor
- **WHEN** the check runs on the repository's source
- **THEN** it returns no pair

#### Scenario: An accent below the floor
- **WHEN** the check runs on a copy of the source whose `stackledger.light.accent` is `#8FB2FF`
- **THEN** it returns exactly `stackledger.light.accent on site.light.body at 1.9` and `stackledger.light.accent on site.light.light at 2.1`

#### Scenario: A missing accent value
- **WHEN** the check runs on a copy of the source without `stackledger.dark.accent`
- **THEN** it throws naming `stackledger.dark.accent`

### Requirement: Backdrop credit is the muted text role
`surface.<theme>.backdropCredit` SHALL equal `brand.<theme>.textMuted`. The token test's mapping check returns every pair that differs as `<surface path> ≠ <brand path>`.

#### Scenario: Credit matches its role
- **WHEN** the mapping check runs on the repository's source
- **THEN** it returns no mismatch

#### Scenario: A credit that drifts
- **WHEN** the mapping check runs on a copy of the source whose `surface.dark.backdropCredit` is `#9AA6D6` (its 0.8.0 value)
- **THEN** it returns exactly `surface.dark.backdropCredit ≠ brand.dark.textMuted`

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
- **THEN** `tokens.json` has `surface.light` background `#F6F3EC`, text `#121212`, muted `#5C5852`, grid `#EDE8DE`, panel `#FFFFFF`, shadow `#121212`, rim `#F6F3EC`, rimWidth 0, zoneOpacity 0.12, backdropWater `#C7DAEA`, backdropWaterEdge `#A9C4DA`, backdropPark `#D6E4CF`, backdropCredit `#5C5852`, and `surface.dark` background `#121110`, text `#F1EEE8`, muted `#ADA79D`, grid `#3B3834`, panel `#1D1C1A`, shadow `#121110`, rim `#F1EEE8`, rimWidth 0, zoneOpacity 0.22, backdropWater `#1C2733`, backdropWaterEdge `#2A3846`, backdropPark `#1A241D`, backdropCredit `#ADA79D`

#### Scenario: Backdrop tokens in the CSS
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.css` declares `--ds-surface-light-backdrop-water: #C7DAEA` and `--ds-surface-dark-backdrop-credit: #ADA79D`

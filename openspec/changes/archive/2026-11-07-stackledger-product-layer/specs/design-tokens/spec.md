## MODIFIED Requirements

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

## ADDED Requirements

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

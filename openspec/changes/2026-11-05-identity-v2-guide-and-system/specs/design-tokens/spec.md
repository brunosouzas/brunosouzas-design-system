## ADDED Requirements

### Requirement: Brand colour roles
The source SHALL define `color.brand` with the semantic roles measured in the identity studio (phase 3, AB#266): `bg`, `surface`, `text`, `textMuted`, `border`, `borderStrong`, `accent`, `accentText`, `onAccent`, `success`, `failure`, `warning` (`color`), each present for both `light` and `dark` (`color.brand.light.bg`, `color.brand.dark.bg`, and so on). A missing entry, an extra one, or a wrong type is an error naming the path.

#### Scenario: Missing brand role
- **WHEN** the source lacks `color.brand.light.accent`
- **THEN** the build fails, naming `color.brand.light.accent` as missing (type color), and writes no file

#### Scenario: Measured brand roles
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json` has `color.brand.light.bg` `#F6F3EC`, `color.brand.light.accent` `#E04E17`, `color.brand.light.accentText` `#B83A0C`, `color.brand.dark.bg` `#121110`, `color.brand.dark.accent` `#FF7A45`

### Requirement: Track colours
`color.brand.light` and `color.brand.dark` SHALL each also carry `trackIntegration`, `trackDelivery` and `trackAi` (`color`), the three content-pillar backgrounds measured in the identity studio.

#### Scenario: Track colours present in both themes
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json` has `color.brand.light.trackIntegration` `#F4E4D8`, `color.brand.dark.trackIntegration` `#2A1C15`, and the delivery and AI tracks for both themes

### Requirement: State colour alias
The source SHALL keep every token currently required under `color` (ink, white, panel, ring, healthy, blocked, transitional, caller, backend, failure, failFast) unchanged in value and type, and additionally expose each one under `color.state` with the same value and type (`color.state.healthy` equal to `color.healthy`, and so on). The alias group is removed in a later release; this change only adds it.

#### Scenario: State alias matches the original
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json`'s `color.state.healthy` equals `color.healthy`, and `tokens.css` declares both `--ds-color-healthy` and `--ds-color-state-healthy` with the same value

#### Scenario: Alias does not replace the original
- **WHEN** the source has `color.healthy` but not `color.state`
- **THEN** the build still succeeds (the alias is derived, not hand-written in the source)

### Requirement: Cast character colour roles
`cast` SHALL carry one group per new character (`mira`, `visor`, `drone`, `kiu`, `sinal`), each with `body`, `outline`, `visor`, `eyes` (`color`) for both `light` and `dark` (for example `cast.mira.light.body`, `cast.mira.dark.outline`). A missing entry, an extra one, or a wrong type is an error naming the path.

#### Scenario: Missing cast role token
- **WHEN** the source has `cast.mira.light` without `eyes`
- **THEN** the build fails, naming `cast.mira.light.eyes` as missing (type color), and writes no file

#### Scenario: Measured cast colours
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json` has `cast.mira.light.body` `#FFFFFF`, `cast.mira.dark.outline` equal to `color.brand.dark.textMuted`'s value, and `cast.mira.light.eyes` `#FFC98A`

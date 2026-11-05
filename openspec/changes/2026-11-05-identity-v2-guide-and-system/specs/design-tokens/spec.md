## ADDED Requirements

### Requirement: Brand colour roles
The source SHALL define `color.brand` with the semantic roles measured in the identity studio (phase 3, AB#266) and committed in this change's `design.md` ("Measured values"): `bg`, `cardBg`, `text`, `textMuted`, `border`, `borderStrong`, `accent`, `accentText`, `onAccent`, `success`, `failure`, `warning` (`color`), each present for both `light` and `dark` (`color.brand.light.bg`, `color.brand.dark.bg`, and so on). A missing entry, an extra one, or a wrong type is an error naming the path.

#### Scenario: Missing brand role
- **WHEN** the source lacks `color.brand.light.accent`
- **THEN** the build fails, naming `color.brand.light.accent` as missing (type color), and writes no file

#### Scenario: Measured brand roles, light theme
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json`'s `color.brand.light` has `bg` `#F6F3EC`, `cardBg` `#FFFFFF`, `text` `#121212`, `textMuted` `#5C5852`, `border` `#D7D1C5`, `borderStrong` `#5C5852`, `accent` `#E04E17`, `accentText` `#B83A0C`, `onAccent` `#FFFFFF`, `success` `#2B7A4B`, `failure` `#A1124B`, `warning` `#8F5F00`

#### Scenario: Measured brand roles, dark theme
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json`'s `color.brand.dark` has `bg` `#121110`, `cardBg` `#1D1C1A`, `text` `#F1EEE8`, `textMuted` `#ADA79D`, `border` `#3B3834`, `borderStrong` `#ADA79D`, `accent` `#FF7A45`, `accentText` `#FF7A45`, `onAccent` `#121110`, `success` `#5BBF86`, `failure` `#FF6696`, `warning` `#EBB34B`

### Requirement: Track colours
`color.brand.light` and `color.brand.dark` SHALL each also carry `trackIntegration`, `trackDelivery` and `trackAi` (`color`), the three content-pillar backgrounds measured in the identity studio.

#### Scenario: Track colours present in both themes
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json` has `color.brand.light.trackIntegration` `#F4E4D8`, `color.brand.light.trackDelivery` `#DFE8E1`, `color.brand.light.trackAi` `#E2E4EC`, `color.brand.dark.trackIntegration` `#2A1C15`, `color.brand.dark.trackDelivery` `#18231D`, `color.brand.dark.trackAi` `#1B1F28`

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

#### Scenario: Measured cast colours, all five characters
- **WHEN** the build runs on the repository's source
- **THEN** for each of `mira`, `visor`, `drone`, `kiu`, `sinal`: `body` is `#FFFFFF` in both themes, `eyes` is `#FFC98A` in both themes, `outline` equals `color.brand.light.text` in light and `color.brand.dark.textMuted` in dark, and `visor` equals `color.brand.light.text` in light and `color.brand.dark.text` in dark (design.md, "Measured values")

### Requirement: Signature margin token
`cover` SHALL gain `signatureMargin` (`dimension`), the fixed distance of the signature lockup (cover-cli's "Signature lockup") from the frame's right and bottom edges.

#### Scenario: Signature margin present
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.ts` exports `tokens.cover.signatureMargin` as a positive number of pixels

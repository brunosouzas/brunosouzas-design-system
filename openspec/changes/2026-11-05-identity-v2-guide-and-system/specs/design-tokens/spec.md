## MODIFIED Requirements

### Requirement: Token source
The repository SHALL keep every token in one source file, `tokens/source.json`, whose root is a JSON object. Each token has a value and a type. Tokens sit in exactly these top-level groups: `color`, `outline`, `shadow`, `radius`, `font`, `motion`, `illustration`, `cover`, `coverBackground`, `surface`, `brand`, `map`, `site`, `banner`, `bodyDiagram`, `cast`; a group may nest one more level (for example `motion.pop.damping`, `brand.light.accent`).

#### Scenario: Source file missing or not an object
- **WHEN** `tokens/source.json` does not exist, or its root is `[]` or `null`
- **THEN** the build fails, saying which, and writes no file

#### Scenario: Source with an unknown group
- **WHEN** the source has a top-level group outside the sixteen named groups, such as `colour`
- **THEN** the build fails, names the group, and writes no file

#### Scenario: Token without a type
- **WHEN** a token has a value but no type, or a type outside the supported types
- **THEN** the build fails, names the token's full path and the reason, and writes no file

#### Scenario: New groups accepted
- **WHEN** the source has `illustration.accent`, `cover.width`, `coverBackground.blush.fill`, `surface.dark.shadow`, `brand.light.accent`, `map.lineWidth`, `site.light.primary`, `banner.radius`, `bodyDiagram.radius` and `cast.dev.fill` with valid types and values
- **THEN** the build accepts them and they appear in all three outputs, for example `--ds-cover-background-blush-fill`, `--ds-surface-dark-shadow`, `--ds-brand-light-accent`, `--ds-banner-radius`, `--ds-body-diagram-radius` and `--ds-cast-dev-fill` in `tokens.css`

## ADDED Requirements

### Requirement: Brand colour roles
The source SHALL define a `brand` group with exactly the entries `light` and `dark`, each with exactly `bg`, `cardBg`, `text`, `textMuted`, `border`, `borderStrong`, `accent`, `accentText`, `onAccent`, `success`, `failure`, `warning`, `trackIntegration`, `trackDelivery`, `trackAi` (`color`). A missing entry, an extra one, or a wrong type is an error naming the path; an entry other than `light` or `dark` is an error, the same rule `surface` already follows.

#### Scenario: Missing brand role
- **WHEN** the source has `brand.light` without `accent`
- **THEN** the build fails, naming `brand.light.accent` as missing (type color), and writes no file

#### Scenario: Extra brand theme
- **WHEN** the source also has `brand.sepia` with the fifteen tokens
- **THEN** the build fails, naming `brand.sepia` and "expected light and dark", and writes no file

#### Scenario: Measured brand roles, light theme
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json`'s `brand.light` has `bg` `#F6F3EC`, `cardBg` `#FFFFFF`, `text` `#121212`, `textMuted` `#5C5852`, `border` `#D7D1C5`, `borderStrong` `#5C5852`, `accent` `#E04E17`, `accentText` `#B83A0C`, `onAccent` `#FFFFFF`, `success` `#2B7A4B`, `failure` `#A1124B`, `warning` `#8F5F00`, `trackIntegration` `#F4E4D8`, `trackDelivery` `#DFE8E1`, `trackAi` `#E2E4EC`

#### Scenario: Measured brand roles, dark theme
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json`'s `brand.dark` has `bg` `#121110`, `cardBg` `#1D1C1A`, `text` `#F1EEE8`, `textMuted` `#ADA79D`, `border` `#3B3834`, `borderStrong` `#ADA79D`, `accent` `#FF7A45`, `accentText` `#FF7A45`, `onAccent` `#121110`, `success` `#5BBF86`, `failure` `#FF6696`, `warning` `#EBB34B`, `trackIntegration` `#2A1C15`, `trackDelivery` `#18231D`, `trackAi` `#1B1F28`

### Requirement: State colour alias
The source SHALL keep every token currently required under `color` unchanged, and additionally expose `healthy`, `blocked`, `transitional`, `caller`, `backend`, `failure` and `failFast` under `color.state` with the same value and type as the `color.*` original. The alias is a literal duplicate (the build has no alias mechanism), kept for one release and removed once every consumer reads the new path.

#### Scenario: State alias matches the original
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json`'s `color.state.healthy` equals `color.healthy`, and `tokens.css` declares both `--ds-color-healthy` and `--ds-color-state-healthy` with the same value

#### Scenario: Alias covers only the six meanings
- **WHEN** the source has `color.state` with the seven aliased entries
- **THEN** the build does not require `color.state.ink`, `color.state.white`, `color.state.panel` or `color.state.ring`

### Requirement: Cast eyes colour and signature margin
`cast` SHALL gain `eyes` (`color`), shared by every character in both themes (the body is `color.white`; the outline reads `brand.light.text`/`brand.dark.textMuted` and the visor reads `brand.light.text`/`brand.dark.bg`, directly in the piece's own code by its `surface` parameter, like any existing surface-aware piece — neither needs a dedicated token, and the visor is deliberately not the mirror of the outline, since the screen face stays near-black in both themes). `cover` SHALL gain `signatureMargin` (`dimension`), the signature lockup's fixed distance from a frame's right and bottom edges.

#### Scenario: Cast eyes present
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json`'s `cast.eyes` is `#FFC98A`

#### Scenario: Signature margin present
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.ts` exports `tokens.cover.signatureMargin` as a positive number of pixels

## ADDED Requirements

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

## MODIFIED Requirements

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

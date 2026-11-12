## ADDED Requirements

### Requirement: Required scene tokens
The source SHALL define the `scene` group, the stage of a video in 16:9 composition pixels: `ringRadius`, `ringStep`, `ringWidth` (the stage rings), `pathDash`, `pathGap`, `pathWidth` (the dashed motion path) of type `dimension`, `ringReach` of type `number` and `pathColor` of type `color`. A missing one, or one with another type, is an error. Values: 100, 34, 2.5, 4, 18, 6, 1.2 and `#5C5852`.

#### Scenario: Scene token missing
- **GIVEN** a copy of the source without `scene.pathGap`
- **WHEN** the build runs
- **THEN** it fails, names `scene.pathGap` as missing (type dimension), and writes no file

#### Scenario: Scene token with the wrong type
- **GIVEN** a copy of the source where `scene.ringReach` is declared `dimension`, and another where `scene.pathColor` is declared `dimension` with the value 4
- **WHEN** the build runs on each
- **THEN** each fails, naming `scene.ringReach` and the expected type `number`, then `scene.pathColor` and the expected type `color`, and writes no file

#### Scenario: Measured scene values
- **GIVEN** the repository's source
- **WHEN** the build runs
- **THEN** `tokens.ts` exports `tokens.scene` as exactly `ringRadius` 100, `ringStep` 34, `ringWidth` 2.5, `ringReach` 1.2, `pathDash` 4, `pathGap` 18, `pathWidth` 6 and `pathColor` `#5C5852`, and `tokens.css` has `--ds-scene-ring-width: 2.5px;`, `--ds-scene-ring-reach: 1.2;` and `--ds-scene-path-color: #5C5852;`

#### Scenario: A ring reach that is not a number
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

#### Scenario: A missing path colour
- **GIVEN** a copy of the source without `scene.pathColor`
- **WHEN** the check runs
- **THEN** it throws naming `scene.pathColor`

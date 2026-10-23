## MODIFIED Requirements

### Requirement: Token source
The repository SHALL keep every token in one source file, `tokens/source.json`, whose root is a JSON object. Each token has a value and a type. Tokens sit in exactly these top-level groups: `color`, `outline`, `shadow`, `radius`, `font`, `motion`, `illustration`, `cover`, `coverBackground`; a group may nest one more level (for example `motion.pop.damping`).

#### Scenario: Source file missing or not an object
- **WHEN** `tokens/source.json` does not exist, or its root is `[]` or `null`
- **THEN** the build fails, saying which, and writes no file

#### Scenario: Source with an unknown group
- **WHEN** the source has a top-level group outside the nine named groups, such as `colour`
- **THEN** the build fails, names the group, and writes no file

#### Scenario: Token without a type
- **WHEN** a token has a value but no type, or a type outside the supported types
- **THEN** the build fails, names the token's full path and the reason, and writes no file

#### Scenario: New groups accepted
- **WHEN** the source has `illustration.accent`, `cover.width` and `coverBackground.blush.fill` with valid types and values
- **THEN** the build accepts them and they appear in all three outputs, for example `--ds-cover-background-blush-fill` in `tokens.css`

### Requirement: Required tokens
The source SHALL define these tokens with these types; a missing one, or one with another type, is an error. `color`: ink, white, panel, ring, healthy, blocked, transitional, caller, backend, failure, failFast (`color`). `outline`: block, arrow, small; `shadow` and `radius`: block, pill, small (`dimension`). `font`: sans, mono (`fontFamily`); weightBold, weightHeavy (`fontWeight`). The motion, illustration and cover tokens are separate requirements.

#### Scenario: Missing required token
- **WHEN** the source lacks `color.failure`
- **THEN** the build fails, names `color.failure` as missing, and writes no file

#### Scenario: Required token with the wrong type
- **WHEN** `outline.block` is declared with type `number`
- **THEN** the build fails, naming `outline.block` and the expected type `dimension`, and writes no file

## ADDED Requirements

### Requirement: Required illustration tokens
The source SHALL define these `color` tokens: `illustration` accent, codePanel, textBar, healthyShade, transitionalShade, road, tape, iconLine. A missing one, or one with another type, is an error. Their values are the ones measured in the published covers (`design.md` §2).

#### Scenario: Missing illustration token
- **WHEN** the source lacks `illustration.iconLine`
- **THEN** the build fails, names `illustration.iconLine` as missing (type color), and writes no file

#### Scenario: Measured values
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json` has `illustration.accent` `#1E6FEB`, `codePanel` `#14215A`, `textBar` `#C9D6F5`, `healthyShade` `#2BB673`, `transitionalShade` `#E8B830`, `road` `#5B6478`, `tape` `#FFE2C8`, `iconLine` `#B9C3E0`

### Requirement: Required cover tokens
The source SHALL define `cover` width, height, pillHeight, labelSize, ringStep, ringWidth, ringRadius (`dimension`) and labelWeight (`fontWeight`). A missing one, or one with another type, is an error. Values: 800, 420, 36, 19, 28, 2, 90 and 800.

#### Scenario: Cover token with the wrong type
- **WHEN** `cover.labelWeight` is declared `dimension`
- **THEN** the build fails, naming `cover.labelWeight` and the expected type `fontWeight`, and writes no file

#### Scenario: Measured cover values
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.ts` exports `tokens.cover.width` 800, `height` 420, `pillHeight` 36, `labelSize` 19, `ringStep` 28, `ringWidth` 2, `ringRadius` 90 and `labelWeight` 800

### Requirement: Cover background pairs
`coverBackground` SHALL hold at least one entry, and each entry SHALL be a group with exactly two `color` tokens, `fill` and `ring`. A missing `coverBackground`, an empty one, an entry without `fill` or `ring`, an entry with another token, or a token of another type, is an error naming the path.

#### Scenario: Entry without a ring
- **WHEN** the source has `coverBackground.blush.fill` and no `coverBackground.blush.ring`
- **THEN** the build fails, naming `coverBackground.blush.ring` as missing, and writes no file

#### Scenario: Extra token in an entry
- **WHEN** an entry `coverBackground.blush` also has `shadow`
- **THEN** the build fails, naming `coverBackground.blush.shadow`, and writes no file

#### Scenario: Token directly under the group
- **WHEN** the source has `coverBackground.blush` as a token instead of a group
- **THEN** the build fails, naming `coverBackground.blush` and "expected a group with fill and ring", and writes no file

#### Scenario: Missing group
- **WHEN** the source has no `coverBackground` group
- **THEN** the build fails, naming `coverBackground` as missing, and writes no file

### Requirement: Measured cover backgrounds
The repository's source SHALL hold exactly the 21 pairs measured from the published covers, with the names and values of `design.md` §2, pinned in `test/fixtures/cover-backgrounds.json`.

#### Scenario: Source matches the measured table
- **WHEN** the token test reads `tokens/source.json` and the fixture
- **THEN** both list the same 21 names with the same `fill` and `ring` values, for example `blush` `#F6CFE0` and `#ECBAD0`

#### Scenario: A pair drifts
- **WHEN** a test copy of the source changes `coverBackground.blush.ring` to `#ECBAD1`
- **THEN** the comparison fails naming `blush`

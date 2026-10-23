# design-tokens Specification

## Purpose
Keeps the visual identity's values (colour, type, outline, shadow, radius, motion) in one source file and generates the CSS, TypeScript and JSON files that every consumer reads, so the copies cannot drift.

## Requirements

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

### Requirement: Token shape, names and nesting
A token SHALL be an object with `$value` and `$type`, and MAY have a string `$description`, which no output uses; any other key in a token is an error. A group SHALL be an object of tokens or (at the second level) groups. Names SHALL match `^[a-z][a-zA-Z0-9]*$`. A token sits two or three levels deep (`color.ink`, `motion.pop.damping`); deeper nesting or an empty group is an error. Invalid JSON is an error.

#### Scenario: Invalid JSON
- **WHEN** `tokens/source.json` has a trailing comma
- **THEN** the build fails with the parser's line and column, and writes no file

#### Scenario: Name that is not camelCase
- **WHEN** the source has a token `color.fail-fast` or `color.Ink`
- **THEN** the build fails, naming the token path and "expected camelCase", and writes no file

#### Scenario: Too deep or unknown token key
- **WHEN** the source has `motion.pop.spring.damping`, or a token with a `$unit` key, or a token `color.ink` that also holds a child `dark`
- **THEN** the build fails, naming the path, and writes no file

#### Scenario: Group that is not an object
- **WHEN** the source has `"outline": 4` or `"color": []`
- **THEN** the build fails, naming the group, and writes no file

### Requirement: CSS names
Each token's CSS name SHALL be `--ds-` followed by its path joined with `-`, where each name is put in kebab case: a `-` before each capital letter, which is lowercased; digits stay as they are. Two tokens whose CSS names are equal are an error.

#### Scenario: Kebab case with capitals and digits
- **WHEN** the source has `color.failFast`, `color.okHTTP` and `color.ink2Dark`
- **THEN** their CSS names are `--ds-color-fail-fast`, `--ds-color-ok-h-t-t-p` and `--ds-color-ink2-dark`

#### Scenario: Two paths with one CSS name
- **WHEN** the source has both `motion.pop.damping` and `motion.popDamping`
- **THEN** the build fails, naming both paths and the shared name `--ds-motion-pop-damping`, and writes no file

### Requirement: Every problem reported at once
When the source breaks several rules, the build and the check SHALL report every problem, one line each, sorted by path in Unicode code-point order and then by message text (a problem with no path first), and exit 1. A missing file, invalid JSON or a non-object root stops validation. Validation does not look inside an unknown group. A token whose `$type` is wrong or unsupported gets one problem, and its value is not checked.

#### Scenario: Unknown group and missing token together
- **WHEN** the source has a group `colour` and lacks `color.failure`
- **THEN** the build prints both problems, `color.failure` before `colour`, and exits 1

#### Scenario: Problems inside an unknown group are not reported
- **WHEN** the unknown group `colour` holds a token with an invalid value
- **THEN** only the unknown group is reported for that path

#### Scenario: Wrong required type hides the value check
- **WHEN** `outline.block` is declared `number` with the value `1.5`
- **THEN** exactly one problem is printed for `outline.block`: the expected type `dimension`

### Requirement: Supported token types and their values
The build SHALL accept these types and reject a value that does not fit its type: `color` (a `#RRGGBB` hex string, letters in either case, written to the outputs as in the source), `dimension` (a positive integer of pixels), `frames` (a positive integer), `number` (a finite number greater than zero), `opacity` (a number greater than 0 and at most 1), `fontFamily` (a non-empty string without `;`, `{`, `}`, `<`, `>` or a line break), `fontWeight` (an integer from 100 to 900 in steps of 100).

#### Scenario: Malformed colour
- **WHEN** a `color` token has the value `#12345` or `red`
- **THEN** the build fails, naming the token path and "expected #RRGGBB", and writes no file

#### Scenario: Zero or negative frame count
- **WHEN** a `frames` token has the value `0` or `-5`
- **THEN** the build fails, naming the token path, and writes no file

#### Scenario: Non-integer or off-step values
- **WHEN** a `frames` token is `0.5`, a `dimension` token is `1.5`, or a `fontWeight` token is `450` or `950`
- **THEN** the build fails, naming each token path, and writes no file

#### Scenario: Opacity above one
- **WHEN** an `opacity` token has the value `1.2`
- **THEN** the build fails, naming the token path, and writes no file

#### Scenario: Font family that would break the CSS
- **WHEN** `font.sans` is `Lato; } body { color: red`
- **THEN** the build fails, naming `font.sans`, and writes no file

#### Scenario: Boundary values accepted
- **WHEN** an `opacity` token is `1`, a `fontWeight` token is `900` and a `dimension` token is `1`
- **THEN** the build accepts them

### Requirement: Required tokens
The source SHALL define these tokens with these types; a missing one, or one with another type, is an error. `color`: ink, white, panel, ring, healthy, blocked, transitional, caller, backend, failure, failFast (`color`). `outline`: block, arrow, small; `shadow` and `radius`: block, pill, small (`dimension`). `font`: sans, mono (`fontFamily`); weightBold, weightHeavy (`fontWeight`). The motion, illustration and cover tokens are separate requirements.

#### Scenario: Missing required token
- **WHEN** the source lacks `color.failure`
- **THEN** the build fails, names `color.failure` as missing, and writes no file

#### Scenario: Required token with the wrong type
- **WHEN** `outline.block` is declared with type `number`
- **THEN** the build fails, naming `outline.block` and the expected type `dimension`, and writes no file

### Requirement: Required motion tokens
The source SHALL define these motion tokens with these types; a missing one, or one with another type, is an error: `motion` fps, drawArrow, travel, fade, readingHold (`frames`); dimOpacity (`opacity`); focusScale (`number`); `motion.pop` and `motion.focus` damping, stiffness, mass (`number`).

#### Scenario: Missing motion token
- **WHEN** the source lacks `motion.focus.mass`
- **THEN** the build fails, names `motion.focus.mass` as missing, and writes no file

#### Scenario: Frame rate with the wrong type
- **WHEN** `motion.fps` is declared with type `number`
- **THEN** the build fails, naming `motion.fps` and the expected type `frames`, and writes no file

#### Scenario: Extra token in a known group
- **WHEN** the source adds `color.accent` with type `color` and a valid value
- **THEN** the build accepts it and it appears in all three outputs

### Requirement: Generated outputs
`npm run tokens` SHALL write three files in `tokens/generated/`: `tokens.css` (one CSS custom property per token on `:root`, named `--ds-` plus the path in kebab case, `failFast` becoming `fail-fast`; `dimension` values with `px`; `fontFamily` values as written), `tokens.ts` (a typed, read-only object with the source's nesting) and `tokens.json` (the same nesting with plain values). It prints one line per file written.

#### Scenario: CSS custom property names and units
- **WHEN** the source has `outline.block` = 4 (`dimension`) and `motion.pop.damping` = 13 (`number`)
- **THEN** `tokens.css` contains `--ds-outline-block: 4px;` and `--ds-motion-pop-damping: 13;`

#### Scenario: TypeScript and JSON keep the nesting
- **WHEN** the source has `motion.pop.damping` = 13
- **THEN** `tokens.ts` exports it as `tokens.motion.pop.damping` with the number 13, and `tokens.json` has the same path with the number 13

#### Scenario: Generated files say they are generated
- **WHEN** the build writes `tokens.css` and `tokens.ts`
- **THEN** each starts with a comment saying it is generated from `tokens/source.json` and must not be edited by hand

### Requirement: Deterministic build
The build SHALL produce byte-identical outputs from the same source, whatever the order of keys in the source file (outputs list keys sorted by Unicode code point, with LF line endings), and running it twice SHALL leave the files unchanged.

#### Scenario: Same source, same bytes
- **WHEN** the build runs twice on an unchanged source
- **THEN** the three files are byte-identical after both runs

#### Scenario: Key order does not matter
- **WHEN** two sources hold the same tokens in a different key order
- **THEN** their outputs are byte-identical

### Requirement: Freshness check
`npm run tokens:check` SHALL compare the files in `tokens/generated/` with what the build would produce, write nothing, exit 0 when they match, and otherwise exit 1 naming each stale or missing file.

#### Scenario: Stale output
- **WHEN** `tokens/source.json` changed and the build was not run
- **THEN** the check exits 1 and names the files that differ

#### Scenario: Missing output
- **WHEN** `tokens/generated/tokens.json` does not exist
- **THEN** the check exits 1 and names it as missing

#### Scenario: Invalid source during the check
- **WHEN** the source is invalid
- **THEN** the check exits 1 with the same message the build gives, and writes nothing

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

#### Scenario: Ring with another type
- **WHEN** `coverBackground.blush.ring` is declared `dimension`
- **THEN** the build fails, naming it and the expected type `color`, and writes no file

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

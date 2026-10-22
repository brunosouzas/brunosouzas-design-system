# Spec Delta

## Purpose

Keeps the visual identity's values (colour, type, outline, shadow, radius, motion) in one source file and generates the CSS, TypeScript and JSON files that every consumer reads, so the copies cannot drift.

## ADDED Requirements

### Requirement: Token source
The repository SHALL keep every token in one source file, `tokens/source.json`. Each token has a value and a type. Tokens sit in exactly these top-level groups: `color`, `outline`, `shadow`, `radius`, `font`, `motion`; a group may nest one more level (for example `motion.pop.damping`).

#### Scenario: Source with an unknown group
- **WHEN** the source has a top-level group outside the six named groups
- **THEN** the build fails, names the group, and writes no file

#### Scenario: Token without a type
- **WHEN** a token has a value but no type, or a type outside the supported types
- **THEN** the build fails, names the token's full path and the reason, and writes no file

### Requirement: Token shape, names and nesting
A token SHALL be an object with `$value` and `$type`, and MAY have `$description`, which no output uses; any other key starting with `$` is an error. Group and token names SHALL be camelCase ASCII (`^[a-z][a-zA-Z0-9]*$`). A token sits two or three levels deep (`color.ink`, `motion.pop.damping`); deeper nesting, or a group holding no token, is an error. A file that is not valid JSON is an error.

#### Scenario: Invalid JSON
- **WHEN** `tokens/source.json` has a trailing comma
- **THEN** the build fails with the parser's line and column, and writes no file

#### Scenario: Name that is not camelCase
- **WHEN** the source has a token `color.fail-fast` or `color.Ink`
- **THEN** the build fails, naming the token path and "expected camelCase", and writes no file

#### Scenario: Too deep or unknown token key
- **WHEN** the source has `motion.pop.spring.damping`, or a token with a `$unit` key
- **THEN** the build fails, naming the path, and writes no file

### Requirement: Supported token types and their values
The build SHALL accept these types and reject a value that does not fit its type: `color` (a `#RRGGBB` hex string, letters in either case, written to the outputs as in the source), `dimension` (a positive integer of pixels), `frames` (a positive integer), `number` (a finite number greater than zero), `opacity` (a number greater than 0 and at most 1), `fontFamily` (a non-empty string), `fontWeight` (an integer from 100 to 900 in steps of 100).

#### Scenario: Malformed colour
- **WHEN** a `color` token has the value `#12345` or `red`
- **THEN** the build fails, naming the token path and "expected #RRGGBB", and writes no file

#### Scenario: Zero or negative frame count
- **WHEN** a `frames` token has the value `0` or `-5`
- **THEN** the build fails, naming the token path, and writes no file

#### Scenario: Opacity above one
- **WHEN** an `opacity` token has the value `1.2`
- **THEN** the build fails, naming the token path, and writes no file

#### Scenario: Boundary values accepted
- **WHEN** an `opacity` token is `1`, a `fontWeight` token is `900` and a `dimension` token is `1`
- **THEN** the build accepts them

### Requirement: Required tokens
The source SHALL define every token the components read: `color` ink, white, panel, ring, healthy, blocked, transitional, caller, backend, failure, failFast; `outline` block, arrow, small; `shadow` block, pill, small; `radius` block, pill, small; `font` sans, mono, weightBold, weightHeavy; `motion` fps, pop and focus (each damping, stiffness, mass), drawArrow, travel, fade, dimOpacity, focusScale, readingHold.

#### Scenario: Missing required token
- **WHEN** the source lacks `color.failure`
- **THEN** the build fails, names `color.failure` as missing, and writes no file

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

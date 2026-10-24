## MODIFIED Requirements

### Requirement: Token source
The repository SHALL keep every token in one source file, `tokens/source.json`, whose root is a JSON object. Each token has a value and a type. Tokens sit in exactly these top-level groups: `color`, `outline`, `shadow`, `radius`, `font`, `motion`, `illustration`, `cover`, `coverBackground`, `surface`, `map`, `site`, `banner`, `bodyDiagram`; a group may nest one more level (for example `motion.pop.damping`).

#### Scenario: Source file missing or not an object
- **WHEN** `tokens/source.json` does not exist, or its root is `[]` or `null`
- **THEN** the build fails, saying which, and writes no file

#### Scenario: Source with an unknown group
- **WHEN** the source has a top-level group outside the fourteen named groups, such as `colour`
- **THEN** the build fails, names the group, and writes no file

#### Scenario: Token without a type
- **WHEN** a token has a value but no type, or a type outside the supported types
- **THEN** the build fails, names the token's full path and the reason, and writes no file

#### Scenario: New groups accepted
- **WHEN** the source has `illustration.accent`, `cover.width`, `coverBackground.blush.fill`, `surface.dark.shadow`, `map.lineWidth`, `site.light.primary`, `banner.radius` and `bodyDiagram.radius` with valid types and values
- **THEN** the build accepts them and they appear in all three outputs, for example `--ds-cover-background-blush-fill`, `--ds-surface-dark-shadow`, `--ds-banner-radius` and `--ds-body-diagram-radius` in `tokens.css`

## ADDED Requirements

### Requirement: Required body diagram tokens
The source SHALL define `bodyDiagram` width, layoutWidth, radius, ringRadius and startRadius, each of type `dimension`. A missing one, or one with another type, is an error. Values: 800, 560, 14, 70 and 11, measured from the published body diagrams at their shown width (800); a diagram is laid out 560 wide.

#### Scenario: Body diagram token missing
- **WHEN** the source lacks `bodyDiagram.layoutWidth`
- **THEN** the build fails, names `bodyDiagram.layoutWidth` as missing, and writes no file

#### Scenario: Body diagram token with the wrong type
- **WHEN** `bodyDiagram.radius` is declared `number`
- **THEN** the build fails, naming `bodyDiagram.radius` and the expected type `dimension`, and writes no file

#### Scenario: Measured body diagram values
- **WHEN** the repository's source is built
- **THEN** `tokens.ts` exports `bodyDiagram` 800, 560, 14, 70 and 11, and `tokens.css` has `--ds-body-diagram-layout-width: 560px;`

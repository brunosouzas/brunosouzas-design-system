## MODIFIED Requirements

### Requirement: Token source
The repository SHALL keep every token in one source file, `tokens/source.json`, whose root is a JSON object. Each token has a value and a type. Tokens sit in exactly these top-level groups: `color`, `outline`, `shadow`, `radius`, `font`, `motion`, `illustration`, `cover`, `coverBackground`, `surface`, `map`, `site`, `banner`; a group may nest one more level (for example `motion.pop.damping`).

#### Scenario: Source file missing or not an object
- **WHEN** `tokens/source.json` does not exist, or its root is `[]` or `null`
- **THEN** the build fails, saying which, and writes no file

#### Scenario: Source with an unknown group
- **WHEN** the source has a top-level group outside the thirteen named groups, such as `colour`
- **THEN** the build fails, names the group, and writes no file

#### Scenario: Token without a type
- **WHEN** a token has a value but no type, or a type outside the supported types
- **THEN** the build fails, names the token's full path and the reason, and writes no file

#### Scenario: New groups accepted
- **WHEN** the source has `illustration.accent`, `cover.width`, `coverBackground.blush.fill`, `surface.dark.shadow`, `map.lineWidth`, `site.light.primary` and `banner.radius` with valid types and values
- **THEN** the build accepts them and they appear in all three outputs, for example `--ds-cover-background-blush-fill`, `--ds-surface-dark-shadow` and `--ds-banner-radius` in `tokens.css`

## ADDED Requirements

### Requirement: Required banner tokens
The source SHALL define `banner` width, height and radius, each of type `dimension`. A missing one, or one with another type, is an error. Values: 1200, 420 and 20, measured from the published brunosouzas.com home banner.

#### Scenario: Banner token missing
- **WHEN** the source lacks `banner.radius`
- **THEN** the build fails, names `banner.radius` as missing, and writes no file

#### Scenario: Banner token with the wrong type
- **WHEN** `banner.width` is declared `number`
- **THEN** the build fails, naming `banner.width` and the expected type `dimension`, and writes no file

#### Scenario: Measured banner values
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.ts` exports `tokens.banner.width` 1200, `height` 420 and `radius` 20, and `tokens.css` has `--ds-banner-width: 1200px;`

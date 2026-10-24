## ADDED Requirements

### Requirement: Required cast tokens
The source SHALL define, of type `color`: `cast` ground, metal, mouth, glow; `cast.dev` fill, chin, screen; `cast.agent` neck, shine; `cast.architect` and `cast.devops` fill, shine; `cast.data` fill, lid, shine, lens; `cast.request.shine`; and, of type `number`, `cast.emotePop` damping, stiffness, mass. A missing one, or one with another type, is an error. Values: design §6 of `cast-and-emotes`, the approved spike's.

#### Scenario: Cast token missing
- **WHEN** the source lacks `cast.devops.fill`
- **THEN** the build fails, names `cast.devops.fill` as missing (type color), and writes no file

#### Scenario: Cast token with the wrong type
- **WHEN** `cast.emotePop.mass` is declared `dimension`
- **THEN** the build fails, naming `cast.emotePop.mass` and the expected type `number`, and writes no file

#### Scenario: Approved cast values
- **WHEN** the repository's source is built
- **THEN** `tokens.json` has the 18 colours and three numbers of design §6, for example `cast.dev.fill` `#5B7CFA`, `cast.glow` `#7FD1FF` and `cast.emotePop.stiffness` 170, and `tokens.css` has `--ds-cast-dev-fill: #5B7CFA;`

## MODIFIED Requirements

### Requirement: Token source
The repository SHALL keep every token in one source file, `tokens/source.json`, whose root is a JSON object. Each token has a value and a type. Tokens sit in exactly these top-level groups: `color`, `outline`, `shadow`, `radius`, `font`, `motion`, `illustration`, `cover`, `coverBackground`, `surface`, `map`, `site`, `banner`, `bodyDiagram`, `cast`; a group may nest one more level (for example `motion.pop.damping`).

#### Scenario: Source file missing or not an object
- **WHEN** `tokens/source.json` does not exist, or its root is `[]` or `null`
- **THEN** the build fails, saying which, and writes no file

#### Scenario: Source with an unknown group
- **WHEN** the source has a top-level group outside the fifteen named groups, such as `colour`
- **THEN** the build fails, names the group, and writes no file

#### Scenario: Token without a type
- **WHEN** a token has a value but no type, or a type outside the supported types
- **THEN** the build fails, names the token's full path and the reason, and writes no file

#### Scenario: New groups accepted
- **WHEN** the source has `illustration.accent`, `cover.width`, `coverBackground.blush.fill`, `surface.dark.shadow`, `map.lineWidth`, `site.light.primary`, `banner.radius`, `bodyDiagram.radius` and `cast.dev.fill` with valid types and values
- **THEN** the build accepts them and they appear in all three outputs, for example `--ds-cover-background-blush-fill`, `--ds-surface-dark-shadow`, `--ds-banner-radius`, `--ds-body-diagram-radius` and `--ds-cast-dev-fill` in `tokens.css`

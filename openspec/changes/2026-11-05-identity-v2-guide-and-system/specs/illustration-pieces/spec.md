## ADDED Requirements

### Requirement: Mira and the pillar cast pieces
The package SHALL export a `mira` piece (front and back, both themes, four state faces: idle, done, waiting, failed) and four pillar-character pieces (`visor`, `drone`, `kiu`, `sinal`), each a pure function of its parameters and the generated tokens, returning `{ body, text }` with every colour a token path, no literal, overflow guarded, like any existing piece. Each piece accepts `surface: "light" | "dark"` and a `face` limited to the character's defined states.

#### Scenario: Mira state faces
- **WHEN** `mira({ x: 0, y: 0, face: "done", surface: "light" })` and `mira({ x: 0, y: 0, face: "waiting", surface: "light" })` are called
- **THEN** both return a valid `{ body, text }` tree and the only difference between them is the visor's drawn expression

#### Scenario: Unknown face rejected
- **WHEN** `visor` is called with `face: "confused"`
- **THEN** it throws a `RangeError` naming `face` and listing the character's valid faces

#### Scenario: Pure and token-only
- **WHEN** the no-colour-literals test scans `src/pieces/` after this change
- **THEN** it still finds nothing, including inside the five new piece modules

### Requirement: Bank objects
The package SHALL export six bank-object pieces, `correio`, `lume`, `carga`, `anel`, `modulo`, `hub`, each drawn with its screen off (no face), for use on track covers. A bank object SHALL NOT accept a `face` parameter.

#### Scenario: Bank object has no face
- **WHEN** `carga` is called with a `face` parameter
- **THEN** it throws a `RangeError` naming `face` as not supported by this piece

### Requirement: Brand notation icons
The package SHALL export a brand notation icon set, distinct from `EIP_ICON_NAMES` (the 26 diagram icons), named `BRAND_NOTATION_ICON_NAMES` with exactly 19 entries: 13 EIP pattern icons, 3 delivery icons, 3 AI icons. No name in this set SHALL also appear in `EIP_ICON_NAMES`, and no piece or export is shared between the two families.

#### Scenario: No overlap between the two EIP icon families
- **WHEN** `BRAND_NOTATION_ICON_NAMES` and `EIP_ICON_NAMES` are compared
- **THEN** their intersection is empty

#### Scenario: Notation icon count
- **WHEN** `BRAND_NOTATION_ICON_NAMES` is read
- **THEN** it has exactly 19 entries, with the 13 EIP ones each naming the same canonical pattern name used in `EIP_ICON_NAMES`'s existing diagram icon, where that pattern is also in the notation

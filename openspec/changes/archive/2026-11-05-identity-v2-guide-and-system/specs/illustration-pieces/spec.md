## ADDED Requirements

### Requirement: Mira and the pillar cast pieces
The package SHALL export a `mira` piece and four pillar-character pieces (`visor`, `drone`, `kiu`, `sinal`), each a pure function of its parameters and the generated tokens, returning `{ body, text }` with every colour a token path, no literal, overflow guarded, like any existing piece. Each accepts `surface: "light" | "dark"`, `view: "front" | "back"` (default `"front"`), a `face` limited to the character's defined states (ignored on the back view), and `scale`.

#### Scenario: Mira state faces
- **WHEN** `mira({ x: 0, y: 0, face: "done", surface: "light" })` and `mira({ x: 0, y: 0, face: "waiting", surface: "light" })` are called
- **THEN** both return a valid `{ body, text }` tree and the only difference between them is the visor's drawn expression

#### Scenario: Mira every face, both themes
- **WHEN** `mira` is called once for each of `idle`, `done`, `waiting`, `failed`, with `surface: "light"` and again with `surface: "dark"`
- **THEN** all eight calls return a valid tree, and the four light-theme trees differ from each other only in the visor's expression, as do the four dark-theme ones

#### Scenario: Back view has no face
- **WHEN** `mira` is called with `view: "back"` and any `face`
- **THEN** the returned tree draws no visor expression (the back carries no face)

#### Scenario: Scale resizes without changing the drawing
- **WHEN** `mira({ x: 0, y: 0, face: "idle", surface: "light", scale: 1 })` and the same call with `scale: 0.25` are compared
- **THEN** the second tree's root group carries a `scale(0.25)` transform (0.25 to 4 accepted) and is otherwise the same tree as the first

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
The package SHALL export a brand notation icon set, distinct from `EIP_ICON_NAMES` (the 26 diagram icons), named `BRAND_NOTATION_ICON_NAMES`, plus a drawing function `brandNotationIcon({ name, x, y, scale })`, parallel to the existing `eipIcon({ name, x, y, scale })`. No name SHALL appear in both sets, and no export is shared between the two families.

#### Scenario: No overlap between the two EIP icon families
- **WHEN** `BRAND_NOTATION_ICON_NAMES` and `EIP_ICON_NAMES` are compared
- **THEN** their intersection is empty

#### Scenario: Notation icon count
- **WHEN** `BRAND_NOTATION_ICON_NAMES` is read
- **THEN** it has exactly 19 entries, with the 13 EIP ones each naming the same canonical pattern name used in `EIP_ICON_NAMES`'s existing diagram icon, where that pattern is also in the notation

#### Scenario: Drawing a notation icon
- **WHEN** `brandNotationIcon({ name: "content-based-router", x: 100, y: 100 })` is called
- **THEN** it returns a valid `{ body, text }` tree, and calling it with a name outside `BRAND_NOTATION_ICON_NAMES` throws a `RangeError` naming `name`

### Requirement: Category icon
The package SHALL export a `categoryIcon` piece for a site category that has no notation or diagram icon, called as `categoryIcon({ category, x, y, scale, surface })`. For this change, `category` accepts `"personalTools"` and is drawn in `brand.<theme>.text` (neutral: no track colour), per `design.md`'s decision 4.

#### Scenario: Personal tools category icon
- **WHEN** `categoryIcon({ category: "personalTools", x: 0, y: 0, surface: "light" })` is called
- **THEN** it returns a valid `{ body, text }` tree whose only colour is `brand.light.text`

#### Scenario: Unknown category rejected
- **WHEN** `categoryIcon` is called with `category: "news"`
- **THEN** it throws a `RangeError` naming `category`

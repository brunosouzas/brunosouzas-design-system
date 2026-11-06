## ADDED Requirements

### Requirement: Mira and the pillar cast pieces
The package SHALL export `mira` and the pillar pieces `visor`, `drone`, `kiu`, `sinal`: pure functions of their parameters and the tokens, returning `{ body, text }`. Each accepts `x`, `y`, `surface`, `scale` (0.25 to 4), `view` (`front`, `back`) and `expression` (`idle`, `done`, `waiting`, `failed`; none on the back), plus its own actions: `needleAngle`, `carries`, `stride` (Mira); `holds`, `points` (Visor); `carries` (Drone); `steps` (Kiu).

#### Scenario: Mira state faces
- **WHEN** `mira({ x: 0, y: 0, expression: "done" })` and `mira({ x: 0, y: 0, expression: "waiting" })` are called
- **THEN** both return a valid `{ body, text }` tree, and the trees differ

#### Scenario: Every expression, both themes
- **WHEN** each of the five pieces is called once for each of `idle`, `done`, `waiting`, `failed`, with `surface: "light"` and again with `surface: "dark"`
- **THEN** every call returns a valid tree, and for each piece and theme the four trees are pairwise different

#### Scenario: Back view has no face
- **WHEN** `mira` is called with `view: "back"` and `expression: "done"`, and again with `expression: "failed"`
- **THEN** the two trees are identical (the back carries no face)

#### Scenario: Scale resizes without changing the drawing
- **WHEN** `mira({ x: 0, y: 0 })` and `mira({ x: 0, y: 0, scale: 0.25 })` are compared
- **THEN** the second tree's root group carries `scale(0.25)` in its transform and is otherwise the same tree as the first

#### Scenario: Unknown expression rejected
- **WHEN** `visor` is called with `expression: "confused"`, and again with an unknown parameter `face`
- **THEN** each throws a `RangeError` naming the parameter (`expression`, listing the four valid values; `face`, as an unknown parameter)

#### Scenario: Pure and token-only
- **WHEN** the no-colour-literals test scans `src/pieces/` after this change
- **THEN** it still finds nothing, including inside the new piece modules

### Requirement: Bank objects
The package SHALL export one `bankObject({ name, x, y, surface, scale })` piece and `BANK_OBJECT_NAMES` (`courier`, `lume`, `carga`, `anel`, `modulo`, `hub`), each object drawn with its screen off (no face), for use on track covers. A bank object SHALL NOT accept an `expression` or `face` parameter.

#### Scenario: Every bank object draws
- **WHEN** `bankObject` is called once for each name in `BANK_OBJECT_NAMES`, in both themes
- **THEN** every call returns a valid tree

#### Scenario: Bank object has no face
- **WHEN** `bankObject({ name: "carga", x: 0, y: 0, face: "done" })` is called
- **THEN** it throws a `RangeError` naming `face` as an unknown parameter

### Requirement: Brand notation icons
The package SHALL export the brand notation, a family separate from the 26 diagram icons (`EIP_ICONS`, `EIP_ICON_NAMES`, `eipIcon`): `BRAND_NOTATION_ICON_NAMES` (19 camelCase names: 13 EIP, 3 delivery, 3 AI) and the piece `brandNotationIcon({ name, x, y, surface, scale })`. The two families share no export and no piece; the same pattern may carry the same word in both name lists (`splitter`, `aggregator`), each drawn only by its own piece.

#### Scenario: Two families, no shared export
- **WHEN** the package's exports are read
- **THEN** `brandNotationIcon` and `eipIcon` are different pieces, and `BRAND_NOTATION_ICON_NAMES` and `EIP_ICON_NAMES` are different lists

#### Scenario: Notation icon count
- **WHEN** `BRAND_NOTATION_ICON_NAMES` is read
- **THEN** it has exactly 19 entries

#### Scenario: Drawing a notation icon
- **WHEN** `brandNotationIcon({ name: "contentBasedRouter", x: 100, y: 100 })` is called
- **THEN** it returns a valid `{ body, text }` tree, and calling it with a name outside `BRAND_NOTATION_ICON_NAMES` throws a `RangeError` naming `name`

### Requirement: Category icon
The package SHALL export a `categoryIcon` piece for a site category that has no notation or diagram icon, called as `categoryIcon({ category, x, y, scale, surface })`. For this change, `category` accepts `"personalTools"`, drawn in `brand.<theme>.text` with one part in `brand.<theme>.accent` (the bolt ring) and no track colour, per `design.md`'s decision 4.

#### Scenario: Personal tools category icon
- **WHEN** `categoryIcon({ category: "personalTools", x: 0, y: 0, surface: "light" })` is called
- **THEN** it returns a valid `{ body, text }` tree whose only colours are `brand.light.text` and `brand.light.accent`

#### Scenario: Unknown category rejected
- **WHEN** `categoryIcon` is called with `category: "news"`
- **THEN** it throws a `RangeError` naming `category`

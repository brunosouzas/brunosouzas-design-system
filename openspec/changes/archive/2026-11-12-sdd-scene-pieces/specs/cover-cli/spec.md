## ADDED Requirements

### Requirement: Question token and held sheet in a spec
Every format that takes `pieces` but `icon` SHALL accept `questionToken`, and a `visor` with `facing` and `holdsSheet`, like any piece: checked against their parameters and relations, with each problem at its JSON path. Their shapes go in the outlined group, their words (the `?` and the sheet's label) in the labels group, never stroked.

#### Scenario: Token and held sheet drawn
- **GIVEN** a valid cover spec whose `pieces` are `{ "piece": "visor", "x": 520, "y": 380, "facing": "left", "holdsSheet": { "width": 120, "height": 160, "rows": [{ "lead": "question", "bar": 40 }], "label": "proposal.md" } }` and `{ "piece": "questionToken", "cx": 200, "cy": 120, "scale": 1.5 }`
- **WHEN** the command builds it
- **THEN** it writes the cover; the outlined group holds the `visor` group, whose first child is the `data-held` `sheet` group, and the `questionToken` body group; the labels group holds two `?` text nodes and one holding `proposal.md`, none with an ancestor carrying a `stroke` attribute

#### Scenario: Problems at their paths
- **GIVEN** a cover spec whose `pieces` are a `visor` with `holds: true` and a valid `holdsSheet`, a `visor` with `holdsSheet` `{ "width": 130, "height": 218, "rows": [] }`, and a `questionToken` with `scale: 0`
- **WHEN** the command runs
- **THEN** it prints `pieces[0].holdsSheet` ("Visor holds a card or a sheet, not both"), `pieces[1].holdsSheet.rows` and `pieces[2].scale`, in that order, exits 1 and writes nothing

## MODIFIED Requirements

### Requirement: Cover spec format
A spec SHALL be a JSON object with `id` (safe slug), `title` and `description` (non-empty strings), optional `format` (`cover`, `banner`, `diagram`, `icon`, `favicon`, `linkedin-card`, `og`, `avatar`, `linkedin-banner`; default `cover`), and the keys its format allows: `background`, `rings` (`cx`, `cy`, optional `radius`), `pieces`, `custom`, `customAt`, `height`, `text`, `signature`. Each format's requirement says which it refuses or needs. Any other top-level key is an error.

#### Scenario: Unknown background and piece
- **WHEN** a spec has `background: "pink"` and a piece `{ "piece": "rocket" }`
- **THEN** both are reported, `background` before `pieces[0].piece`, the second listing the 64 piece names, the last `questionToken`

#### Scenario: Unsafe id
- **WHEN** `id` is `../sdd` or `SDD`
- **THEN** `id` is reported as not a safe slug

#### Scenario: Invalid JSON
- **WHEN** the spec has a trailing comma
- **THEN** the command prints the parser's line and column, exits 1 and writes nothing

#### Scenario: Unknown format
- **WHEN** a spec has `format: "poster"`, or `format: 1`
- **THEN** exactly one problem is printed for `format`: "expected one of cover, banner, diagram, icon, favicon, linkedin-card, og, avatar, linkedin-banner", the command exits 1 and writes nothing

#### Scenario: Ring count in a spec
- **WHEN** a cover, banner or diagram spec has `rings.count: 30`
- **THEN** `rings.count` is reported as "unknown parameter: the ring count comes from the format"


### Requirement: Emote on a cover
A cover, banner or diagram spec SHALL accept `emote` in `pieces` like any other piece, checked with the same schema and relations, with problems reported at their JSON path. `mascot` is no longer a piece: an entry naming it is an unknown piece.

#### Scenario: Emote drawn
- **WHEN** a cover spec has the piece `{ "piece": "emote", "kind": "idea", "x": 520, "y": 160 }`
- **THEN** the command writes the cover, and its outlined group holds a `g` with `data-emote` `idea`

#### Scenario: Mascot refused
- **WHEN** a cover spec has `{ "piece": "mascot", "who": "dev", "x": 0, "y": 0 }` and `{ "piece": "emote", "kind": "zzz", "x": 0, "y": 0 }`
- **THEN** both are reported, `pieces[0].piece` ("unknown piece \"mascot\"", listing the 64 piece names, the last `questionToken`) before `pieces[1].kind`, the command exits 1 and writes nothing

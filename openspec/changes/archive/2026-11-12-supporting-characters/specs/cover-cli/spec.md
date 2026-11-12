## ADDED Requirements

### Requirement: Supporting cast in a spec
Every format that takes `pieces` but `icon` SHALL accept `balao`, `chaves` and `keyboard` like any piece: checked against their parameters and relations, with each problem at its JSON path. Their shapes go in the outlined group, their words (the stamp's word, a held sheet's `?` and label) in the labels group, never stroked.

#### Scenario: Supporting cast drawn
- **GIVEN** a valid cover spec whose `pieces` are `{ "piece": "balao", "x": 200, "y": 380, "holdsStamp": { "word": "GO" } }`, `{ "piece": "chaves", "x": 560, "y": 380, "facing": "left", "holdsSheet": { "width": 150, "height": 160, "rows": [{ "lead": "question", "bar": 40 }], "label": "proposal.md" } }` and `{ "piece": "keyboard", "x": 300, "y": 300 }`
- **WHEN** the command builds it
- **THEN** it writes the cover; the outlined group holds the `balao` group, whose first child is the `data-held` `stamp` group, the `chaves` group, whose first child is the `data-held` `sheet` group, and the `keyboard` group, whose keys each have an ancestor inside the `keyboard` group with `stroke` `none`; the labels group holds `GO`, `?` and `proposal.md`, none with an ancestor carrying a `stroke` attribute

#### Scenario: Supporting cast problems at their paths
- **GIVEN** a cover spec whose `pieces` are a `balao` with `speaks: true`, `view: "back"` and `holdsStamp: { "word": "GO" }`, a `chaves` with `types: true`, `points: true` and a valid `holdsSheet`, and a `keyboard` with `width: 79`
- **WHEN** the command runs
- **THEN** it prints exactly three problems, `pieces[0].holdsStamp` ("Balão does one action at a time"), `pieces[1].points` ("Chaves does one action at a time") and `pieces[2].width`, in that order, exits 1 and writes nothing

## MODIFIED Requirements

### Requirement: Cover spec format
A spec SHALL be a JSON object with `id` (safe slug), `title` and `description` (non-empty strings), optional `format` (`cover`, `banner`, `diagram`, `icon`, `favicon`, `linkedin-card`, `og`, `avatar`, `linkedin-banner`; default `cover`), and the keys its format allows: `background`, `rings` (`cx`, `cy`, optional `radius`), `pieces`, `custom`, `customAt`, `height`, `text`, `signature`. Each format's requirement says which it refuses or needs. Any other top-level key is an error.

#### Scenario: Unknown background and piece
- **WHEN** a spec has `background: "pink"` and a piece `{ "piece": "rocket" }`
- **THEN** both are reported, `background` before `pieces[0].piece`, the second listing the 67 piece names, the last `keyboard`

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
- **THEN** both are reported, `pieces[0].piece` ("unknown piece \"mascot\"", listing the 67 piece names, the last `keyboard`) before `pieces[1].kind`, the command exits 1 and writes nothing

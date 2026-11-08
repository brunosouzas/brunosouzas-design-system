## ADDED Requirements

### Requirement: Headline in a written image
Every format that takes `pieces` but `icon` (cover, banner, linkedin-card, og, diagram) SHALL accept `headline` like any piece, checked against its parameters. Its group is written in the labels group, outside the outlined group, so its letters are never stroked, and the written SVG embeds the Source Serif 4 face its lines use ("Fonts embedded in every written image").

#### Scenario: Title on the og image
- **WHEN** an `og` spec with `background: "neutral"`, `signature: true` and one `headline` with `lines: ["Code that runs", "for the problem", "you have."]` and `size: 96` is built
- **THEN** the written SVG is 1200×630, its `<style>` holds exactly one `@font-face`, `Source Serif 4` with `font-weight:100 900` and `font-style:normal`, and the `headline` group has no ancestor carrying a `stroke` attribute

#### Scenario: Title on a diagram
- **WHEN** a `diagram` spec holds one `headline` with `lines: ["States"]`
- **THEN** the command writes the diagram, its `headline` group has no ancestor carrying a `stroke` attribute, and its `<style>` holds a `Source Serif 4` face at `100 900`

#### Scenario: Headline out of range in a spec
- **WHEN** an `og` spec has a `headline` with `size: 200` and `lines: []`
- **THEN** `pieces[0].lines` and `pieces[0].size` are reported, the command exits 1 and writes nothing

## MODIFIED Requirements

### Requirement: Cover spec format
A spec SHALL be a JSON object with `id` (safe slug), `title` and `description` (non-empty strings), optional `format` (`cover`, `banner`, `diagram`, `icon`, `favicon`, `linkedin-card`, `og`, `avatar`; default `cover`), and the keys its format allows: `background`, `rings` (`cx`, `cy`, optional `radius`), `pieces`, `custom`, `customAt`, `height`, `text`, `signature`. Each format's requirement says which it refuses or needs. Any other top-level key is an error.

#### Scenario: Unknown background and piece
- **WHEN** a spec has `background: "pink"` and a piece `{ "piece": "rocket" }`
- **THEN** both are reported, `background` before `pieces[0].piece`, the second listing the 63 piece names

#### Scenario: Unsafe id
- **WHEN** `id` is `../sdd` or `SDD`
- **THEN** `id` is reported as not a safe slug

#### Scenario: Invalid JSON
- **WHEN** the spec has a trailing comma
- **THEN** the command prints the parser's line and column, exits 1 and writes nothing

#### Scenario: Unknown format
- **WHEN** a spec has `format: "poster"`, or `format: 1`
- **THEN** exactly one problem is printed for `format`: "expected one of cover, banner, diagram, icon, favicon, linkedin-card, og, avatar", the command exits 1 and writes nothing

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
- **THEN** both are reported, `pieces[0].piece` ("unknown piece \"mascot\"", listing the 63 piece names) before `pieces[1].kind`, the command exits 1 and writes nothing

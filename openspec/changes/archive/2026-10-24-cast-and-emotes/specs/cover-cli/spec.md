## ADDED Requirements

### Requirement: Cast on a cover
A cover, banner or diagram spec SHALL accept `mascot` and `emote` in `pieces` like any other piece, checked with the same schema and relations, with problems reported at their JSON path.

#### Scenario: Mascot and emote drawn
- **WHEN** a cover spec has the pieces `{ "piece": "mascot", "who": "architect", "x": 400, "y": 380, "action": "rest" }` and `{ "piece": "emote", "kind": "idea", "x": 520, "y": 160 }`
- **THEN** the command writes the cover, and its outlined group holds a `g` with `data-mascot` `architect` and a `g` with `data-emote` `idea`

#### Scenario: Head tilt on a dev in a spec
- **WHEN** a cover spec has `{ "piece": "mascot", "who": "dev", "x": 0, "y": 0, "headTilt": 5 }` and `{ "piece": "emote", "kind": "zzz", "x": 0, "y": 0 }`
- **THEN** both are reported, `pieces[0].headTilt` ("applies only to the agent") before `pieces[1].kind`, the command exits 1 and writes nothing

## MODIFIED Requirements

### Requirement: Cover spec format
A spec SHALL be a JSON object with `id` (safe slug), `title` and `description` (non-empty strings), optional `format` (`cover`, `banner`, `diagram` or `icon`; default `cover`), `background` (a `coverBackground` name), `rings` (`cx`, `cy`, optional `radius`; finite numbers), `pieces` (array of objects with `piece` and its parameters), and the optional `custom`, `customAt`, `height` and `text`. Each format's requirement says which keys it refuses or needs. Any other top-level key is an error.

#### Scenario: Unknown background and piece
- **WHEN** a spec has `background: "pink"` and a piece `{ "piece": "rocket" }`
- **THEN** both are reported, `background` before `pieces[0].piece`, the second listing the 54 piece names

#### Scenario: Unsafe id
- **WHEN** `id` is `../sdd` or `SDD`
- **THEN** `id` is reported as not a safe slug

#### Scenario: Invalid JSON
- **WHEN** the spec has a trailing comma
- **THEN** the command prints the parser's line and column, exits 1 and writes nothing

#### Scenario: Unknown format
- **WHEN** a spec has `format: "poster"`, or `format: 1`
- **THEN** exactly one problem is printed for `format`: "expected one of cover, banner, diagram, icon", the command exits 1 and writes nothing

#### Scenario: Ring count in a spec
- **WHEN** a cover, banner or diagram spec has `rings.count: 30`
- **THEN** `rings.count` is reported as "unknown parameter: the ring count comes from the format"

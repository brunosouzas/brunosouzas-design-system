## Purpose

Builds a blog cover from a JSON spec kept with the article in the private vault, using only the public pieces and tokens, so every cover is reproducible and draft covers never enter the public repository.

## ADDED Requirements

### Requirement: Cover command
`npm run cover -- <spec.json> --out <file.svg>` SHALL read one cover spec, build the cover and write it to the `--out` path, replacing an existing file, then print `wrote <file.svg>` and exit 0.

#### Scenario: Proof cover
- **WHEN** the owner runs `npm run cover -- test/fixtures/covers/spec-driven-development.json --out out/covers/sdd.svg` with `out/covers/` present
- **THEN** `out/covers/sdd.svg` equals `test/fixtures/covers/spec-driven-development.svg` and `wrote out/covers/sdd.svg` is printed

#### Scenario: Running twice
- **WHEN** the same command runs twice
- **THEN** the file is byte-identical after both runs

### Requirement: Invocation problems
The command SHALL exit 1 with the problem and the usage line, writing nothing, when: an option other than `--out` is given, `--out` is missing, repeated or has no value, the out path does not end in `.svg`, its folder does not exist, no spec path or more than one is given, or the spec file cannot be read. Only the first of these is reported, in that order.

#### Scenario: Missing out
- **WHEN** the owner runs `npm run cover -- cover.json`
- **THEN** it prints `--out <file.svg> is required` and the usage, exits 1, and writes nothing

#### Scenario: Wrong extension and two specs
- **WHEN** the owner runs `npm run cover -- a.json b.json --out cover.png`
- **THEN** only the out-path problem is printed, because it comes first in the order, and the command exits 1

#### Scenario: Missing folder
- **WHEN** `--out` names `missing/cover.svg` and `missing/` does not exist
- **THEN** it prints that the folder does not exist and exits 1

### Requirement: Cover spec format
A spec SHALL be a JSON object with `id` (safe slug), `title` and `description` (non-empty strings), `background` (a `coverBackground` name), `rings` (`cx`, `cy`, optional `radius`; finite numbers), `pieces` (array of objects with `piece` and its parameters) and optional `custom`. Any other top-level key is an error.

#### Scenario: Unknown background and piece
- **WHEN** a spec has `background: "pink"` and a piece `{ "piece": "rocket" }`
- **THEN** both are reported, `background` before `pieces[0].piece`, the second listing the 26 piece names

#### Scenario: Unsafe id
- **WHEN** `id` is `../sdd` or `SDD`
- **THEN** `id` is reported as not a safe slug

#### Scenario: Invalid JSON
- **WHEN** the spec has a trailing comma
- **THEN** the command prints the parser's line and column, exits 1 and writes nothing

### Requirement: Piece parameters checked
Each entry of `pieces` SHALL be checked against its piece's parameters: a required one missing, an unknown one, a wrong JSON type, a non-finite or out-of-range number, an unknown enum value, or a colour that is not a token path of type `color` is a problem naming its JSON path.

#### Scenario: Several problems in one piece
- **WHEN** `pieces[2]` is a `sheet` without `rows`, with `colour: "color.white"` and `width: -5`
- **THEN** three problems are printed for `pieces[2].colour`, `pieces[2].rows` and `pieces[2].width`, in that order

#### Scenario: Colour literal anywhere
- **WHEN** any string in the spec is `#FFFFFF`, `#fff`, `rgb(0,0,0)` or `hsl(0,0%,0%)`
- **THEN** that path is reported with "colour literals are not allowed; use a token path"

### Requirement: Every spec problem at once
When a readable spec breaks several rules, the command SHALL print every problem, one line each as `<json path>: <message>`, sorted by path in Unicode code-point order with array indexes compared as numbers, exit 1 and write nothing.

#### Scenario: Problems sorted
- **WHEN** a spec has a bad `title`, a bad `pieces[10]` and a bad `pieces[2]`
- **THEN** the order is `pieces[2]`, `pieces[10]`, `title`

### Requirement: One free-form object
A spec SHALL have at most one free-form object, `custom`, a single JSON node tree (not an array). Its tags are limited to `g`, `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon`, `path`, `text`; attribute names match `^[a-z][a-z-]*$` and are not `on*`, `href`, `style` or `class`; colour attributes are `none` or a token path.

#### Scenario: Array of objects
- **WHEN** `custom` is an array of two trees
- **THEN** `custom` is reported as "one free-form object per cover; a repeated object must be a piece"

#### Scenario: Forbidden content
- **WHEN** `custom` holds a `script` or `image` node, or an attribute `onload` or `href`
- **THEN** each is reported by its path and nothing is written

#### Scenario: Allowed object
- **WHEN** `custom` is a `g` with a `path` whose `fill` is `color.blocked`
- **THEN** the cover draws it after the pieces' bodies, with `fill` resolved to the token's value

### Requirement: Cover output
The cover SHALL be an 800x420 `svg` with `role="img"`, `aria-labelledby` naming `<id>-title` and `<id>-desc`, the sans font, then `title`, `desc`, a clip-path `<id>-frame`, the background fill, the clipped rings in the background's ring colour, one outlined group with every piece body in paint order and then `custom`, and one label group with every text, ending in LF.

#### Scenario: Layer order
- **WHEN** a spec has a `pill` before a `sheet`
- **THEN** the pill's rect comes before the sheet's shapes in the outlined group, and the pill's label is in the label group after all shapes

#### Scenario: Ring colour from the pair
- **WHEN** a spec has `background: "peach"` and `rings.radius` 100
- **THEN** the background is `#F4D8BC`, the 14 rings are stroked `#EAC7A3`, width 2, radii 100 to 464 in steps of 28

### Requirement: Parity with the published proof covers
The repository SHALL keep the three published proof covers (`spec-driven-development`, `ai-writes-code`, `integration-patterns`) as spec fixtures with their golden SVG output; no other cover spec enters the repository.

#### Scenario: Golden output
- **WHEN** the test builds each of the three fixtures
- **THEN** each result equals its golden SVG byte for byte

#### Scenario: Visual parity (local)
- **WHEN** the owner renders each golden and its published cover at 800 px with `rsvg-convert` and measures PSNR with ffmpeg
- **THEN** the values are at least 39.4, 31.8 and 23.3 dB

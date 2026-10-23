## ADDED Requirements

### Requirement: No current colour in a spec
A cover or banner spec SHALL refuse `currentColor` in `uiIcon.colour`, the one parameter that accepts it, with the problem "currentColor is for icons inline in a page; a cover uses a token path" at that path, sorted and printed with any other problem; the command exits 1 and writes nothing. `currentColor` in any other colour parameter gets that parameter's usual token-path problem.

#### Scenario: Current colour in a cover
- **WHEN** `pieces[0]` is a `uiIcon` with `name: "sun"`, `x: 10`, `y: 10` and `colour: "currentColor"`
- **THEN** the command prints `pieces[0].colour: currentColor is for icons inline in a page; a cover uses a token path`, exits 1, and an existing output file keeps its bytes

#### Scenario: Current colour on another piece
- **WHEN** `pieces[0]` is a `pill` with valid parameters and `fill: "currentColor"`
- **THEN** the command prints `pieces[0].fill: expected a colour token path such as color.healthy, found "currentColor"` and exits 1

#### Scenario: Token colour in a cover
- **WHEN** `pieces[0]` is the same `uiIcon` with `colour: "color.white"`
- **THEN** the spec is valid and the cover is written with the icon's group filled and stroked `#FFFFFF`

## ADDED Requirements

### Requirement: No current colour in a spec
A cover or banner spec SHALL refuse the keyword `currentColor` in any colour parameter of a piece, because a cover is a standalone image whose colours come from tokens. It is a problem at that parameter's path with the message "currentColor is for icons inline in a page; a cover uses a token path", sorted and printed with any other problem; the command exits 1 and writes nothing.

#### Scenario: Current colour in a cover
- **WHEN** `pieces[0]` is a `uiIcon` with `name: "sun"`, `x: 10`, `y: 10` and `colour: "currentColor"`
- **THEN** the command prints `pieces[0].colour: currentColor is for icons inline in a page; a cover uses a token path`, exits 1, and an existing output file keeps its bytes

#### Scenario: Token colour in a cover
- **WHEN** `pieces[0]` is the same `uiIcon` with `colour: "color.white"`
- **THEN** the spec is valid and the cover is written with the icon's group filled and stroked `#FFFFFF`

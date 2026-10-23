## ADDED Requirements

### Requirement: Spec positions stay in the frame's range
A cover spec SHALL keep the `rings` centre (`rings.cx`, `rings.cy`) within ±10000, as before this change, although the `rings` piece itself takes any finite number. Piece positions in `pieces` follow the pieces' own rules.

#### Scenario: Rings centre out of range in a spec
- **WHEN** a cover spec has `rings.cy: -10001`
- **THEN** `rings.cy` is reported as "expected a number at least -10000", the command exits 1 and writes nothing

#### Scenario: Far piece in a spec
- **WHEN** a cover spec places a `pill` at `x` 20000
- **THEN** the spec is valid and the cover is written, with the pill outside the visible frame

### Requirement: Overflow reported as a spec problem
When a piece of a valid spec throws "the drawing overflows", the command SHALL report it as a spec problem at that entry's path (`pieces[<i>]: the drawing overflows`), sorted and printed with any other problem, exit 1 and write nothing. Each overflowing entry is reported once.

#### Scenario: Overflowing arrow in a spec
- **WHEN** `pieces[1]` is a `messageArrow` with `from` [-1.7e308, 0], `to` [1.7e308, 0] and `curve: "straight"`
- **THEN** the command prints `pieces[1]: the drawing overflows`, exits 1, and an existing output file keeps its bytes

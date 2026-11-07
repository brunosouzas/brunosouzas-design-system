## MODIFIED Requirements

### Requirement: Ledger mark
`ledgerMark` SHALL draw the 32-unit mark in a group translated to (`x`, `y`) and scaled by `size` / 32: a white page with one outline 1.25 wide, the bent line in `line` and two white ink-outlined stations, no text. `size` is from 12 to 512. The outline is `color.ink` on the light surface and `surface.dark.muted` on the dark one, so the page keeps one outline that reads on either background (ADR 0009).

#### Scenario: Favicon size
- **WHEN** `ledgerMark({ x: 0, y: 0 })` is called
- **THEN** its group has transform `translate(0 0) scale(1)` and holds, in order, the `rect` at (0.625, 0.625) 30.75 × 30.75 with radius 6.6, fill `#FFFFFF`, stroke `#121212` and stroke-width 1.25, the `path` `M7 23 L14 16 L25 16` with stroke `#E04E17` and width 4.5, and circles at (14, 16) r 4 and (25, 16) r 2.6

#### Scenario: Scaled and too small
- **WHEN** `ledgerMark` gets `size: 16`, and then `size: 8`
- **THEN** the first group has `scale(0.5)` with the same children; the second throws a `RangeError` naming `size`

#### Scenario: Mark on a dark surface
- **WHEN** `ledgerMark({ x: 0, y: 0, surface: "dark" })` is called
- **THEN** its group holds the same children as "Favicon size" except that the `rect`'s stroke is `#ADA79D`, and it holds no other `rect`

#### Scenario: Unknown surface on the mark
- **WHEN** `ledgerMark` gets `surface: "navy"`
- **THEN** it throws a `RangeError` naming `surface` and listing `light, dark`

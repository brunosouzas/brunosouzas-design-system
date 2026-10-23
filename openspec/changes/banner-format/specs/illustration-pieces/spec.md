## ADDED Requirements

### Requirement: Ring count
`rings` SHALL take an optional `count`, an integer from 1 to 1000, default 14, and draw that many circles from `radius` in steps of `cover.ringStep`. A `count` that is not an integer or lies outside 1 to 1000 throws a `RangeError` naming `count`.

#### Scenario: Default count
- **WHEN** `rings({ cx: 400, cy: 210 })` is called
- **THEN** its body holds one group with 14 circles, radii 90 to 454

#### Scenario: Given count
- **WHEN** `rings({ cx: 600, cy: 225, radius: 60, count: 22 })` is called
- **THEN** its body holds 22 circles, radii 60 to 648

#### Scenario: Count out of range
- **WHEN** `rings` is called with `count` 0, 1001 or 2.5
- **THEN** it throws a `RangeError` naming `count`

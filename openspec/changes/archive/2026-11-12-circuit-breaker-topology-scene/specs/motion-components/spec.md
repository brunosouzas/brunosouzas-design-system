## ADDED Requirements

### Requirement: Failure-rate bar
A `FailureRateBar` component SHALL draw, from `rate`, `threshold`, `width` and `height` and reading no frame: a white track with an `outline.small` ink outline and round ends; a `color.state.failure` fill from the left, `min(width, max(height, rate × width))` wide with round ends when `rate` is above 0, nothing at 0; and an ink threshold tick at `threshold × width`, reaching `0.5 × height` beyond the track on both sides, drawn over the fill.

#### Scenario: Fill and tick
- **GIVEN** `rate` 0.2, `threshold` 0.8, `width` 290 and `height` 16
- **WHEN** its shapes are computed
- **THEN** the track is 290x16 with radius 8, the fill is 58 wide with radius 8 in `color.state.failure`, and the tick is at x 232 from y −8 to 24

#### Scenario: Small and empty rates
- **GIVEN** `rate` 0.01 and then `rate` 0, with `width` 290 and `height` 16
- **WHEN** the shapes are computed
- **THEN** the first fill is 16 wide (not 2.9), and the second has no fill shape

#### Scenario: Narrow track
- **GIVEN** `rate` 0.5, `threshold` 0.8, `width` 10 and `height` 16
- **WHEN** the shapes are computed
- **THEN** the fill is 10 wide, as wide as the track and never wider, with radius 8

#### Scenario: Full rate
- **GIVEN** `rate` 1 and `threshold` 0.8
- **WHEN** the shapes are computed
- **THEN** the fill is as wide as the track and the tick is the last shape, drawn over it

#### Scenario: Drawn from the tokens
- **GIVEN** the component's source files
- **WHEN** the colour-literal test scans them
- **THEN** it reports nothing, and every colour and outline comes from `color.*` and `outline.*`

### Requirement: Failure-rate bar input
The failure-rate bar SHALL throw a `RangeError` naming the prop for a `rate` outside [0, 1] or not finite, a `threshold` outside the open interval (0, 1) or not finite, and a `width` or `height` that is not finite or not above 0.

#### Scenario: Bad props
- **GIVEN** separate calls with `rate` −0.1, `rate` 1.01, `rate` NaN, `threshold` 0, `threshold` 1, `threshold` NaN, `width` 0, `width` NaN and `height` Infinity
- **WHEN** the shapes are computed
- **THEN** each throws a `RangeError` naming `rate`, `rate`, `rate`, `threshold`, `threshold`, `threshold`, `width`, `width` and `height`

#### Scenario: Boundary props accepted
- **GIVEN** `rate` 0 and `rate` 1 with `threshold` 0.5
- **WHEN** the shapes are computed
- **THEN** neither throws

### Requirement: Token radius
`PositionedToken` and its style helper SHALL accept an optional `radius`, a finite number above 0, defaulting to 17; the drawn token's radius SHALL equal it. Every existing caller that passes no `radius` SHALL draw exactly as before. A `radius` that is not finite or not above 0 SHALL throw a `RangeError` naming `radius`.

#### Scenario: Default unchanged
- **GIVEN** a token style computed without `radius`
- **WHEN** it is read
- **THEN** its radius is 17 and every other field equals today's, and the publish-subscribe tests pass without edits

#### Scenario: Smaller token
- **GIVEN** `radius` 10
- **WHEN** the style is computed
- **THEN** its radius is 10, with the same fill, stroke and stroke width as the default

#### Scenario: Bad radius
- **GIVEN** `radius` 0, −1 or NaN
- **WHEN** the style is computed
- **THEN** each throws a `RangeError` naming `radius`

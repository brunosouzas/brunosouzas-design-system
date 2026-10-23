## MODIFIED Requirements

### Requirement: Piece parameters checked
Each piece SHALL check its parameters before drawing and throw a `RangeError` naming the first problem: a missing or unknown parameter, a wrong JSON type, a non-finite or out-of-range number, an unknown enum value, or a colour that is not a token path (except "Line colours from data"). Sizes lie within 10000, counts and lists within the designs' limits, sizes leave room for insets; `road.d` and `pipe.d` take only path characters.

#### Scenario: Missing and unknown parameters
- **WHEN** each piece is called without one of its required parameters, and `pill` with an extra `colour`
- **THEN** each call throws a `RangeError` naming the missing parameter, and the `pill` call names `colour`

#### Scenario: Out of range
- **WHEN** `gear` gets `teeth: 3`, `serverStack` gets `units: 1.5`, or `sheet` gets a row with `lead: "star"`
- **THEN** each call throws a `RangeError` naming `teeth`, `units` or `rows[0].lead`

#### Scenario: Sizes that would break the drawing
- **WHEN** `stamp` gets `r: 1`, `browserWindow` gets `width: 20`, or `folder` gets `scale: 1e307`
- **THEN** each call throws a `RangeError` naming `r`, `width` or `scale`

#### Scenario: Smallest and largest accepted sizes draw valid geometry
- **WHEN** each piece is drawn with each bounded size parameter at its smallest and at its largest accepted value, the stickers also at `inkScale` 0.25 and 8
- **THEN** no drawn width, height or radius is negative and no value is infinite or NaN

#### Scenario: Too many repeated parts
- **WHEN** `steps` gets `count: 4294967296`, `gear` gets `teeth: 65`, or `rail` gets 51 nodes
- **THEN** each call throws a `RangeError` naming `count`, `teeth` or `nodes` before drawing

#### Scenario: Road path with something else
- **WHEN** `road` gets `d: "M0,0 L10,10\" onload=\"x"`
- **THEN** it throws a `RangeError` naming `d`

#### Scenario: Pipe path with something else
- **WHEN** `pipe` gets `d: ""`, `d: "L10,10"` or `d: "M0,0 L10,10\" onload=\"x"`
- **THEN** each call throws a `RangeError` naming `d`

## ADDED Requirements

### Requirement: Positions of any size
Every position parameter and every point (`[x, y]`) parameter SHALL accept any finite number, with no bound, except the `rings` centre (`cx`, `cy`), which stays within ±10000. A position or point holding `NaN`, `Infinity`, `-Infinity` or a non-number is still a `RangeError` naming the parameter. Pieces draw a far position exactly as a near one, moved by the same amount.

#### Scenario: Far map position
- **WHEN** `stationMarker`, `lineBadge`, `countBadge`, `nodeBlock`, `pillNode`, `hexNode` and `ledgerMark` are drawn at 6400000 on both axes, and again at -6400000
- **THEN** each draws without error, and every number in its tree (attributes and path data) equals, within 0.01, the same number drawn at 0 moved by the same amount

#### Scenario: Far interchange and arrow
- **WHEN** `stationMarker` gets `cx` 6400000, `cy` 6400000, `to` [6400000, 6400640], and `messageArrow` gets `from` [6399900, 6400000] and `to` [6400100, 6400000]
- **THEN** both draw, and every number equals, within 0.01, the drawing at `cx` 0, `cy` 0, `to` [0, 640] (and `from` [-100, 0], `to` [100, 0]) moved by 6400000 on both axes

#### Scenario: Not finite
- **WHEN** `stationMarker` gets `cx: NaN`, `lineBadge` gets `y: Infinity`, or `arcArrow` gets `from: [-Infinity, 0]`
- **THEN** each call throws a `RangeError` naming `cx`, `y` or `from`

#### Scenario: Rings centre stays bounded
- **WHEN** `rings` gets `cx: 10001`, or a cover spec has `rings.cy: -10001`
- **THEN** the call throws a `RangeError` naming `cx`, and the cover command reports `rings.cy`

### Requirement: Drawing overflow
A piece SHALL throw a `RangeError` naming the piece and "the drawing overflows" when a number it would draw (in an attribute or in path data) is not finite, for example the distance between two points near opposite ends of the number range. It draws nothing then. A drawing within the limits never triggers this check.

#### Scenario: Distance overflows
- **WHEN** `messageArrow` gets `from` [-1.7e308, 0] and `to` [1.7e308, 0], or `stationMarker` gets `cx` -1.7e308, `cy` 0 and `to` [1.7e308, 0]
- **THEN** each call throws a `RangeError` starting with `messageArrow: the drawing overflows` or `stationMarker: the drawing overflows`

#### Scenario: Large but finite
- **WHEN** `stationMarker` gets `cx` 1e15 and `cy` 0
- **THEN** it draws, and its circle's `cx` is written as `1000000000000000`

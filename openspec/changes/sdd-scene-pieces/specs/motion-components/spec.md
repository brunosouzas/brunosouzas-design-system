## ADDED Requirements

### Requirement: Stage ring radii
`src/brand/motion.ts` SHALL export `stageRingRadii(width, height, values = tokens.scene)`: the radii from `values.ringRadius` in steps of `values.ringStep` while below max(`width`, `height`) × `values.ringReach`, ascending; none when the first radius is not below it. `width`, `height` and the three values are positive finite numbers, and a call gives at most 1000 radii (`MAX_RINGS`); anything else throws a `RangeError` naming the parameter (`values.ringStep` for too many radii).

#### Scenario: 16:9 stage
- **GIVEN** the repository's tokens
- **WHEN** `stageRingRadii(1920, 1080)` is called
- **THEN** it returns 65 radii, 100, 134, … 2276

#### Scenario: 4:5 stage
- **GIVEN** the repository's tokens
- **WHEN** `stageRingRadii(1080, 1350)` is called
- **THEN** it returns 45 radii, 100, 134, … 1596

#### Scenario: Given values
- **GIVEN** `values` `{ ringRadius: 10, ringStep: 5, ringReach: 1 }`
- **WHEN** `stageRingRadii(20, 10, values)` is called, then with `ringRadius` 20
- **THEN** the first returns `[10, 15]` (20 is not below the reach) and the second returns `[]`

#### Scenario: Frame smaller than the first ring
- **GIVEN** the repository's tokens
- **WHEN** `stageRingRadii(50, 50)` is called
- **THEN** it returns `[]`

#### Scenario: Bad sizes and values
- **GIVEN** `stageRingRadii` with `width` 0, −1, `NaN` or `Infinity`, then `height` 0, then `values` with `ringStep` 0, `ringRadius` −1 or `ringReach` `NaN`
- **WHEN** each is called
- **THEN** each throws a `RangeError` naming `width`, `height`, `values.ringStep`, `values.ringRadius` or `values.ringReach`

#### Scenario: Ring limit
- **GIVEN** `values` `{ ringRadius: 1, ringStep: 1, ringReach: 1 }`
- **WHEN** `stageRingRadii(1001, 10, values)` and `stageRingRadii(1002, 10, values)` are called
- **THEN** the first returns 1000 radii, 1 to 1000, and the second throws a `RangeError` naming `values.ringStep`

### Requirement: Stage rings from the scene tokens
The `Rings` component SHALL draw one circle per `stageRingRadii(width, height)` radius, centred on its `cx`, `cy`, with no fill, stroked `color.ring` at `scene.ringWidth`, over a `color.panel` rect, fading in as today, and SHALL keep no ring constant of its own. The circuit-breaker and publish-subscribe scenes SHALL draw the same rings as in 0.11.0.

#### Scenario: Existing scenes keep their rings
- **GIVEN** `test/fixtures/scene-rings-0.11.0.json`, written before any change from the 0.11.0 constants (first radius 100, step 34, reach 1.2) for the 16:9 and 4:5 frames of `circuit-breaker-states` and `publish-subscribe`
- **WHEN** `stageRingRadii` is called with each entry's width and height
- **THEN** it returns the pinned radii, and `scene.ringWidth` equals the pinned stroke width 2.5

#### Scenario: No ring constant in the component
- **GIVEN** `src/brand/components.tsx` after the change
- **WHEN** the test reads it
- **THEN** it declares none of `RING_FIRST_RADIUS`, `RING_STEP`, `RING_STROKE`, `RING_REACH`, and the `Rings` component calls `stageRingRadii` and reads `scene.ringWidth`

#### Scenario: Same stills (local)
- **GIVEN** the stills of `circuit-breaker-states` and `publish-subscribe` rendered at the base commit (`d162a39`, 0.11.0) and at the change's head, on the same machine
- **WHEN** their SHA-256 are compared, still by still
- **THEN** every pair is equal

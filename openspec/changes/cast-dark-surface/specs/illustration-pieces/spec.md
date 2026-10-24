## MODIFIED Requirements

### Requirement: Mascot parameters
`mascot` SHALL take `face` (design §3, default `normal`), `action` (§4, default `none`), `scale` (greater than 0, at most 10, default 1), `look` (-1 to 1, default 0), `headTilt` (-30 to 30, default 0), `prop` (boolean, default true) and `surface` (`light` or `dark`, default `light`), checked with the shared schema. A non-zero `headTilt` on a character other than the agent SHALL be a relation problem at `headTilt`: "applies only to the agent".

#### Scenario: Unknown character and face
- **WHEN** `mascot` gets `who: "writer"`, or `face: "proud"`
- **THEN** it throws a `RangeError` naming `who`, or `face`, and the values it accepts

#### Scenario: Out of range
- **WHEN** `mascot` gets `scale: 0`, `scale: 10.5`, `look: 1.5` or `headTilt: 31`
- **THEN** it throws a `RangeError` naming that parameter

#### Scenario: Head tilt on the dev
- **WHEN** `mascot` gets `who: "dev"`, `headTilt: 5`
- **THEN** it throws a `RangeError` with `headTilt: applies only to the agent`; with `who: "agent"` it draws

#### Scenario: Unknown surface
- **WHEN** `mascot` gets `surface: "navy"`
- **THEN** it throws a `RangeError` naming `surface` and `light`, `dark`

### Requirement: Emote parameters
`emote` SHALL check `kind` (one of the eight), `x` and `y` (required, any finite number), `scale` (greater than 0, at most 10, default 1), `burst` (boolean) and `surface` (`light` or `dark`, default `light`) with the shared schema.

#### Scenario: Unknown kind
- **WHEN** `emote` gets `kind: "zzz"`
- **THEN** it throws a `RangeError` naming `kind` and the eight kinds

#### Scenario: Scale out of range
- **WHEN** `emote` gets `scale: 0` or `scale: 11`
- **THEN** it throws a `RangeError` naming `scale`

#### Scenario: Unknown surface
- **WHEN** `emote` gets `surface: "navy"`
- **THEN** it throws a `RangeError` naming `surface`

### Requirement: Cast pieces carry their own stroke
Every shape `mascot` and `emote` draw, on either surface, SHALL carry its own `stroke` or sit in a group of the piece that sets one, so a cast piece draws the same inside the cover command's outlined group as on its own. No shape SHALL use a colour outside the tokens.

#### Scenario: Inside the outlined group
- **WHEN** the test walks every character in every action and every emote with and without its burst, on `light` and on `dark`
- **THEN** every `circle`, `ellipse`, `rect`, `path` has a `stroke` attribute or an ancestor `g` inside the piece that has one, and every `fill` and `stroke` is `none` or a token value

## ADDED Requirements

### Requirement: Cast on the light surface unchanged
A `mascot` or `emote` call with `surface: "light"`, or without `surface`, SHALL draw the same tree as in 0.5.0: every call of `test/fixtures/cast-0.5.0.json` keeps its hash, and adding `surface: "light"` to it keeps the hash too.

#### Scenario: Explicit light
- **WHEN** the test re-makes each fixture call of `cast-0.5.0.json` with `surface: "light"` added
- **THEN** every hash equals the recorded one

### Requirement: Cast on the dark surface
With `surface: "dark"`, `mascot` and `emote` SHALL draw as design §3: every hard shadow filled `surface.dark.shadow`, the mascot's ground filled `surface.dark.grid`, and one group with `data-part` `rim` before the drawing (after the ground), whose shapes are stroked `surface.dark.rim`. The face SHALL be drawn as on light. The piece group's attributes SHALL be those of the light call.

#### Scenario: Dark dev waving
- **WHEN** `mascot` is called with `who: "dev"`, `x: 0`, `y: 0`, `action: "wave"`, `surface: "dark"`
- **THEN** the group's first children have `data-part` `ground` (its ellipse filled `surface.dark.grid`) then `rim`; no shape with a `translate` transform is filled `color.ink`; and the `face` subtree equals the light call's

#### Scenario: Arms are rimmed
- **WHEN** the dev is drawn dark with `action: "wave"`
- **THEN** the `rim` group holds `arm-left`, `arm-right` and `legs` groups, and each arm's path has `stroke-width` 15 + 4 × `surface.dark.rimWidth`

#### Scenario: Emote disc shadow
- **WHEN** `emote` draws `worked` with `surface: "dark"`
- **THEN** the disc's offset circle is filled `surface.dark.shadow`, the group's first child is the `rim` group, and the emote has no `ground`

#### Scenario: Idea glow keeps no rim
- **WHEN** `idea` is drawn dark with its burst
- **THEN** the circle with `opacity` 0.35 is drawn, and the `rim` group has no shape with an `opacity`

### Requirement: Dark cast look frozen
For each of the 73 calls in `test/fixtures/cast-dark-0.5.2.json` (design §4), the SHA-256 of `toSvg(g({}, ...body, ...text))` SHALL equal the call's recorded hash, and the fixture's own SHA-256 SHALL be the one in design §4.

#### Scenario: Every dark call matches
- **WHEN** the test re-makes each call of the fixture
- **THEN** every hash matches and the test names any call that differs

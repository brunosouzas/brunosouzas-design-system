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

### Requirement: Mascot parts
Every part of a mascot SHALL be a group named by `data-part`, in design §2's order: `ground`, the arms when behind (`arm-left`, `arm-right`), `legs`, the character's parts, `face` (holding `eyes`, `brows` when drawn, and `mouth`), `prop`, the arms when in front (`hold`, `type`). The agent's `face` SHALL sit inside its `head`, which turns `headTilt` degrees round the neck top. On the dark surface a `rim` group SHALL follow `ground`; parts are listed outside it.

#### Scenario: Parts at rest
- **WHEN** the test lists the `data-part` values, in document order, of each character with `action: "rest"`
- **THEN** dev gives `ground arm-left arm-right legs stand body screen-code mark face eyes mouth`, agent `ground arm-left arm-right legs neck body mark head face eyes mouth`, architect `ground arm-left arm-right legs pencil body mark face eyes mouth prop`, data `ground arm-left arm-right legs body mark lid face eyes mouth prop`, and devops, request and message as design §2

#### Scenario: Parts at rest on dark
- **WHEN** the same list is made with `surface: "dark"`, skipping the subtree of `rim`
- **THEN** each character gives its light list with `rim` inserted after `ground`

#### Scenario: Head tilt
- **WHEN** the agent is drawn with `headTilt: 10`
- **THEN** its `head` group has `transform` `rotate(10 124 110)`

### Requirement: Expression without limbs
With `action: "none"` a mascot SHALL draw no arm and no legs; with any other action it SHALL draw both arms and the legs, at the mitten targets of design §4. The signature prop SHALL be drawn only for `architect`, `devops` and `data`, with `action` `rest` or `hold` and `prop` true. On the dark surface these rules hold outside `rim`, and `rim` copies exactly the arms, legs and prop drawn.

#### Scenario: Face only
- **WHEN** devops is drawn with only its required parameters
- **THEN** its parts are `ground body mark face eyes mouth`

#### Scenario: Hold puts the arms in front
- **WHEN** devops is drawn with `action: "hold"`
- **THEN** its parts are `ground legs body mark face eyes mouth prop arm-left arm-right`

#### Scenario: Prop switched off or not held
- **WHEN** data is drawn with `action: "rest", prop: false`, or with `action: "wave"`
- **THEN** no `prop` part is drawn

#### Scenario: Face only on dark
- **WHEN** devops is drawn with `surface: "dark"` and no action
- **THEN** its `rim` holds no `arm-left`, `arm-right` or `legs`

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

#### Scenario: Only shadows change colour
- **WHEN** every character in every action and every emote is drawn dark
- **THEN** no shape inside `rim` is a shadow copy (`transform` `translate(8 8)` or `translate(6 6)`, or fill `surface.dark.shadow`), and the feet and mittens are still filled `color.ink`

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

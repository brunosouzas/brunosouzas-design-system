## ADDED Requirements

### Requirement: Mascot
`mascot` SHALL draw one character (`dev`, `agent`, `architect`, `devops`, `data`, `request`, `message`) standing with the centre of its ground line at `x`, `y`, as design §2 to §4. Its `body` SHALL be one group with `data-mascot` set to the character, `transform` `translate(x y) scale(k) translate(-ax -ay)` (`k` the scale times the character's own, `ax`, `ay` its anchor) and `stroke` `none`; its `text` SHALL be empty.

#### Scenario: Default dev
- **WHEN** `mascot` is called with `who: "dev"`, `x: 0`, `y: 0`
- **THEN** its body is one `g` with `data-mascot` `dev`, `transform` `translate(0 0) scale(1) translate(-110 -230)` and `stroke` `none`, and its text is empty

#### Scenario: Message at twice the size
- **WHEN** `mascot` is called with `who: "message"`, `x: 300`, `y: 500`, `scale: 2`
- **THEN** the group's transform is `translate(300 500) scale(1.4) translate(-105 -216)`

### Requirement: Mascot parameters
`mascot` SHALL take `face` (design §3, default `normal`), `action` (§4, default `none`), `scale` (greater than 0, at most 10, default 1), `look` (-1 to 1, default 0), `headTilt` (-30 to 30, default 0) and `prop` (boolean, default true), checked with the shared schema. A non-zero `headTilt` on a character other than the agent SHALL be a relation problem at `headTilt`: "applies only to the agent".

#### Scenario: Unknown character and face
- **WHEN** `mascot` gets `who: "writer"`, or `face: "proud"`
- **THEN** it throws a `RangeError` naming `who`, or `face`, and the values it accepts

#### Scenario: Out of range
- **WHEN** `mascot` gets `scale: 0`, `scale: 10.5`, `look: 1.5` or `headTilt: 31`
- **THEN** it throws a `RangeError` naming that parameter

#### Scenario: Head tilt on the dev
- **WHEN** `mascot` gets `who: "dev"`, `headTilt: 5`
- **THEN** it throws a `RangeError` with `headTilt: applies only to the agent`; with `who: "agent"` it draws

### Requirement: Mascot parts
Every part of a mascot SHALL be a group named by `data-part`, in design §2's order: `ground`, the arms when behind (`arm-left`, `arm-right`), `legs`, the character's parts, `face` (holding `eyes`, `brows` when drawn, and `mouth`), `prop`, the arms when in front (`hold`, `type`). The agent's `face` SHALL sit inside its `head`, which turns `headTilt` degrees round the neck top.

#### Scenario: Parts at rest
- **WHEN** the test lists the `data-part` values, in document order, of each character with `action: "rest"`
- **THEN** dev gives `ground arm-left arm-right legs stand body screen-code mark face eyes mouth`, agent `ground arm-left arm-right legs neck body mark head face eyes mouth`, architect `ground arm-left arm-right legs pencil body mark face eyes mouth prop`, data `ground arm-left arm-right legs body mark lid face eyes mouth prop`, and devops, request and message as design §2

#### Scenario: Head tilt
- **WHEN** the agent is drawn with `headTilt: 10`
- **THEN** its `head` group has `transform` `rotate(10 124 110)`

### Requirement: Expression without limbs
With `action: "none"` a mascot SHALL draw no arm and no legs; with any other action it SHALL draw both arms and the legs, at the mitten targets of design §4. The signature prop SHALL be drawn only for `architect`, `devops` and `data`, with `action` `rest` or `hold` and `prop` true.

#### Scenario: Face only
- **WHEN** devops is drawn with only its required parameters
- **THEN** its parts are `ground body mark face eyes mouth`

#### Scenario: Hold puts the arms in front
- **WHEN** devops is drawn with `action: "hold"`
- **THEN** its parts are `ground legs body mark face eyes mouth prop arm-left arm-right`

#### Scenario: Prop switched off or not held
- **WHEN** data is drawn with `action: "rest", prop: false`, or with `action: "wave"`
- **THEN** no `prop` part is drawn

### Requirement: Faces
A mascot's face SHALL be one of `normal`, `blink`, `happy`, `wink`, `surprised`, `worried`, `thinking`, `focused`, drawn the same on every character (design §3). It SHALL be ink with `cast.mouth` open mouths on every character except the agent, whose face and open mouths are `cast.glow`. Brows SHALL be drawn only for `worried`, `surprised` and `thinking`. `look` SHALL move the face `6·look` to the right.

#### Scenario: Agent's glowing face
- **WHEN** the agent and the dev are drawn with `face: "surprised"`
- **THEN** every fill and stroke in the agent's `face` is `cast.glow` or `color.white` (the eye highlight), and the dev's are `color.ink`, `color.white` or `cast.mouth`

#### Scenario: No brows on a normal face
- **WHEN** a character is drawn with `normal` or `happy`
- **THEN** its `face` has no `brows` part

#### Scenario: Gaze
- **WHEN** the request is drawn with `look: -1`
- **THEN** its `face` group has `transform` `translate(-6 0)`; with `look: 0` it has none

### Requirement: Emote
`emote` SHALL draw one reaction symbol with a fixed meaning, `kind` one of `idea`, `doubt`, `problem`, `worked`, `refused`, `pressure`, `liked`, `waiting` (design §5), centred on `x`, `y`. Its `body` SHALL be one group with `data-emote` and `stroke` `none`, plus `transform` `translate(x y) scale(s) translate(-x -y)` when `scale` is not 1; its `text` SHALL be empty. `burst` (default true) SHALL add the rays of `idea`, `problem` and `worked`, and the idea's glow.

#### Scenario: Scaled check
- **WHEN** `emote` is called with `kind: "worked"`, `x: 10`, `y: 20`, `scale: 2`
- **THEN** its body is one `g` with `data-emote` `worked`, `stroke` `none` and `transform` `translate(10 20) scale(2) translate(-10 -20)`

#### Scenario: Idea without its burst
- **WHEN** `idea` is drawn with `burst: false`
- **THEN** its group holds 6 children; with the default it holds 14

#### Scenario: Problem in failure red
- **WHEN** `problem` and `refused` are drawn
- **THEN** their main shape is filled `color.failure`, and `worked` is filled `color.healthy`

### Requirement: Emote parameters
`emote` SHALL check `kind` (one of the eight), `x` and `y` (required, any finite number), `scale` (greater than 0, at most 10, default 1) and `burst` (boolean) with the shared schema.

#### Scenario: Unknown kind
- **WHEN** `emote` gets `kind: "zzz"`
- **THEN** it throws a `RangeError` naming `kind` and the eight kinds

#### Scenario: Scale out of range
- **WHEN** `emote` gets `scale: 0` or `scale: 11`
- **THEN** it throws a `RangeError` naming `scale`

### Requirement: Cast look frozen
The cast pieces SHALL reproduce the look approved at gate 1: for each of the 130 calls in `test/fixtures/cast-0.5.0.json`, the SHA-256 of `toSvg(g({}, ...body, ...text))` SHALL equal the call's recorded hash. The fixture is the gate-1 file, byte for byte (design §9).

#### Scenario: Every call matches
- **WHEN** the test re-makes each call of the fixture
- **THEN** every hash matches, and the fixture's own SHA-256 is the one in design §9

#### Scenario: A changed drawing is caught
- **WHEN** one coordinate of the dev's chin changes
- **THEN** the test fails and names the calls whose hash differs

### Requirement: Cast pieces carry their own stroke
Every shape `mascot` and `emote` draw SHALL carry its own `stroke` or sit in a group of the piece that sets one, so a cast piece draws the same inside the cover command's outlined group as on its own. No shape SHALL use a colour outside the tokens.

#### Scenario: Inside the outlined group
- **WHEN** the test walks every character in every action and every emote with and without its burst
- **THEN** every `circle`, `ellipse`, `rect`, `path` has a `stroke` attribute or an ancestor `g` inside the piece that has one, and every `fill` and `stroke` is `none` or a token value

## MODIFIED Requirements

### Requirement: Piece catalogue
The library SHALL export 54 pieces with the parameters and defaults of their designs, in this order: the 26 cover pieces of `illustration-pieces` §4, the nine metro and diagram pieces of `metro-and-diagram-pieces` §3, the six map and icon pieces of `stackledger-map-and-link-pieces` §3, the ten body diagram pieces of `body-diagram-pieces` §3, `stateStart` of `designer-formats` §4, and `mascot` and `emote` of `cast-and-emotes` §2 and §5.

#### Scenario: Every piece draws with its defaults
- **WHEN** the catalogue test calls each of the 54 pieces with only its required parameters
- **THEN** each returns valid tags only and colours that are token values; every piece except `edgeLabel` returns a non-empty `body`, and `edgeLabel` returns an empty `body` and a non-empty `text`

#### Scenario: Catalogue sheet
- **WHEN** `npm run pieces:sheet -- --out <file.svg>` runs
- **THEN** it writes one SVG with every piece once, labelled with its name in the mono font, and prints `wrote <file>`

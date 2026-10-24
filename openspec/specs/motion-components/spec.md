# motion-components Specification

## Purpose
Provides the reusable animation pieces of the visual language (blocks, pills, arrows, travelling tokens, call results, countdowns) so every scene moves and looks the same, with all values taken from the design tokens.

## Requirements

### Requirement: Components take values only from the tokens
Every colour, and every value a token group defines (outlines, shadows, radii, fonts, motion timings), SHALL come from the generated TypeScript tokens. Files under `src/brand/` and `src/scenes/` SHALL contain no colour literal (`#` with three or six hex digits, `rgb(`, `hsl(`); `transparent` and `none` are allowed. The component constants listed in the design stay in code; choreography frames belong to the scene's timeline.

#### Scenario: Colour literal in a component
- **WHEN** a component file contains `#FF8A3D`, or another contains `rgb(255, 138, 61)`
- **THEN** the component test fails and names each file and line

#### Scenario: Real sources are clean
- **WHEN** the test scans the repository's `src/brand/` and `src/scenes/`
- **THEN** it reports no colour literal

#### Scenario: Token change reaches the components
- **WHEN** `color.ink` changes in the source and the tokens are rebuilt
- **THEN** a still rendered afterwards draws outlines and shadows in the new ink

### Requirement: Self-drawing arrow
An arrow SHALL be invisible before its draw frame (set by the scene's timeline), draw its path from start to end over `motion.drawArrow` frames, and show its arrowhead only once fully drawn. It then stays drawn until the end of the composition.

#### Scenario: Before the draw frame
- **WHEN** the frame is one before the arrow's draw frame
- **THEN** no part of the arrow is drawn

#### Scenario: Half way
- **WHEN** the frame is the draw frame plus half of `motion.drawArrow`
- **THEN** about half of the path is drawn and the arrowhead is not shown

#### Scenario: Fully drawn
- **WHEN** the frame is the draw frame plus `motion.drawArrow` or later
- **THEN** the whole path and its arrowhead are drawn

### Requirement: Travelling token
Each time a transition fires, a token SHALL travel along its arrow from the path's start to its end over `motion.travel` frames, and SHALL be shown only during that trip.

#### Scenario: Token position over a trip
- **WHEN** a transition fires at frame F
- **THEN** at frame F the token is at the path's start, at F plus half of `motion.travel` it is at the path's midpoint by length, and from F plus `motion.travel` it is no longer shown

#### Scenario: Transition fires twice
- **WHEN** a transition fires at frames F1 and F2, more than `motion.travel` frames apart
- **THEN** one token travels in each trip and none is shown between them

### Requirement: Focus on the active state
Focus SHALL give each state block an opacity factor and a scale factor, multiplied with its pop-in animation. From the first phase's start, the latest started phase's state is in focus (opacity 1, scale `motion.focusScale`); until the outro frame the others get `motion.dimOpacity`. Focus moves with a `motion.focus` spring. Before the first phase both factors are 1 for every block; from the outro on every opacity factor is 1 and the state in focus keeps its scale.

#### Scenario: Focus changes to the next state
- **WHEN** a new phase starts on another state
- **THEN** within 30 frames the new state is within 0.01 of full opacity and of `motion.focusScale`, and the previous one is within 0.01 of `motion.dimOpacity`

#### Scenario: Between two phases
- **WHEN** the frame falls after one phase's end and before the next phase's start
- **THEN** the state of the phase that ended stays in focus

#### Scenario: Intro and outro
- **WHEN** the frame is before the first phase's start, or at or after the outro frame
- **THEN** every block's opacity factor is 1; in the intro every scale factor is 1, and in the outro the last state in focus keeps `motion.focusScale` and the others are at 1

#### Scenario: Pop-in during the intro
- **WHEN** the circuit-breaker scene is at frame 10
- **THEN** the CLOSED block is mid pop-in (opacity and scale come from its pop-in, since both focus factors are 1) and the HALF_OPEN block, whose pop-in starts at 22, is not visible

### Requirement: State block contents at a frame
A state block SHALL show one slot per call its scene allows. While a phase of its state runs, and after it until the state's next phase starts, the slots hold that phase's results that have happened, in order, and the rest are `empty`. When the state's next phase starts, the slots restart empty. Before the state's first phase, every slot is `empty` and a countdown is empty.

#### Scenario: OPEN between its two phases
- **WHEN** the circuit-breaker scene is at frame 620 (end of the second OPEN phase)
- **THEN** the OPEN block shows 2 `blocked` and 2 `empty` slots, and its countdown is empty

#### Scenario: Results persist, then reset
- **WHEN** the circuit-breaker scene is at frame 400 and then at frame 840
- **THEN** at 400 the CLOSED block still shows the 8 results of its first phase; at 840 it shows 1 `ok` and 7 `empty`

#### Scenario: Before the state's first phase
- **WHEN** the circuit-breaker scene is at frame 100
- **THEN** the OPEN block shows 4 `empty` slots and an empty countdown, and the HALF_OPEN block 3 `empty` slots

### Requirement: Call results and countdown
A call-result square SHALL show one of four kinds: `ok` (white fill, ink check mark), `fail` (failure colour, white cross), `blocked` (ink fill, white dash) and `empty` (dashed outline, no fill). A countdown ring SHALL be full at its phase's `from` frame and empty at its `to` frame (phase ranges are inclusive), decreasing linearly between them.

#### Scenario: Blocked call inside the OPEN block
- **WHEN** a `blocked` result is shown inside a block filled with `color.blocked`
- **THEN** the square is filled with `color.ink`, not with the block's colour

#### Scenario: Countdown at the phase boundaries
- **WHEN** the frame is the phase's `from`, its midpoint, and its `to`
- **THEN** the ring is full, half full, and empty

### Requirement: Exchange queue and tagged container shapes
Reusable exchange, queue and tagged-container shapes SHALL use generated tokens for colours, type, outlines, hard shadows, radii and motion. The exchange SHALL be a white elongated hexagon; the queue a white rounded rectangle with two inset end rails; the container white with a yellow pill tab. Contents and placement SHALL be supplied by the scene, not hard-coded broker names or topology.

#### Scenario: Generic shapes match the diagram language
- **GIVEN** shapes with scene-supplied text and bounds
- **WHEN** their settled appearance is inspected
- **THEN** they have ink outlines and hard offset shadows, the exchange's six vertices, queue's two end rails and container's tab; they contain no hard-coded Anypoint or order labels and use existing token values only

#### Scenario: Shapes before appearance
- **GIVEN** each shape's pop-in frame
- **WHEN** the preceding frame and the pop-in frame are evaluated
- **THEN** it is invisible before appearance and uses the existing token-driven pop spring on appearance, without replacing its opacity with scene focus

### Requirement: Persistent and routed tokens
A reusable token SHALL support scene-supplied stationary points and path travel over `motion.travel` frames, with the existing token's appearance and an optional scene-supplied fill. Travel SHALL be by path length, with no token drawn before departure or after handoff to its destination. Multiple copies and return paths SHALL use the same primitive; the scene SHALL own their identities, counts, split, ACK and NACK rules.

#### Scenario: Stationary path and return placement
- **GIVEN** a stationary token and a routed token departing at F along either a forward or return path
- **WHEN** F−1, F, F+11 and F+22 are evaluated with current `motion.travel` 22
- **THEN** the stationary token stays at its supplied point, the routed one is absent before F, at the path start at F, halfway by length at F+11, and absent at F+22 for an atomic scene-owned destination handoff

#### Scenario: Token path cannot yield a point
- **GIVEN** path evaluation returns no point
- **WHEN** a routed token is placed
- **THEN** no token is drawn and the renderer does not dereference a null point; missing scene routes are separately rejected by flow validation

### Requirement: Failure and confirmation contrast
Checks SHALL be white squares with ink checks. From the invoice failure on, the Invoice consumer block SHALL be filled with `color.failure` and carry a white square with an ink cross, sized and placed like the ACK checks. The return path and returned token outline SHALL use `color.failure`, other outlines ink; tokens SHALL be filled with `color.caller`. Other blocks SHALL stay healthy; no mark SHALL take its block's hue.

#### Scenario: Failure stays local and marks remain visible
- **GIVEN** the invoice failure and NACK frames
- **WHEN** scene appearance data and review stills are inspected
- **THEN** only the invoice block turns `color.failure`, with a white square and ink cross, and only invoice has the red return path/token outline; payment, inventory and API checks remain white/ink against green application blocks; every token is filled with `color.caller`; there is no orange blocked path or red publisher

### Requirement: Cast timing helpers
`src/brand/cast-motion.ts` SHALL export the pure helpers of design §7: `emotePop` (Remotion `spring` with `cast.emotePop`), `leave`, `blinking`, `breathe`, `squashAfter` and `hop`, with the formulas, defaults and input checks given there. The spring's values SHALL come from the tokens, so the no-colour-literal and token rules of the components apply to the file.

#### Scenario: Emote pop
- **WHEN** `emotePop` is read at `at − 1`, `at`, `at + 7` and `at + 30` at 30 fps
- **THEN** it gives 0, 0, 1.2371 (to four decimals, its peak) and a value within 0.001 of 1

#### Scenario: Leave
- **WHEN** `leave(f, 100)` is read at 99, 105, 110 and 200
- **THEN** it gives 1, 0.875, 0 and 0

#### Scenario: Squash after a landing
- **WHEN** `squashAfter(f, 62, 0.1)` is read at 61, 62 and 69
- **THEN** it gives 1, 1.1 and 0.9632 (to four decimals)

#### Scenario: Helper inputs checked
- **WHEN** `hop` gets `len: 0`, `leave` gets `len: -1`, `emotePop` gets `fps: 0` or `frame: NaN`, or `blinking` gets `starts: [1, Infinity]`
- **THEN** each throws a `RangeError` naming `len`, `len`, `fps`, `frame` and `starts[1]`

#### Scenario: Hop and blink bounds
- **WHEN** `hop(f, 246, 60)` is read at 245, 253 and 261, and `blinking` with starts `[18]` at 17, 18, 21 and 22
- **THEN** the hop gives 0, 60 and 0, and the blink false, true, true and false

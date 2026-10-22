# Spec Delta

## Purpose

Provides the reusable animation pieces of the visual language (blocks, pills, arrows, travelling tokens, call results, countdowns) so every scene moves and looks the same, with all values taken from the design tokens.

## ADDED Requirements

### Requirement: Components take values only from the tokens
Every colour used by the components and scenes SHALL come from the generated TypeScript tokens, and so SHALL every value a token group defines (outline widths, shadow offsets, radii, fonts, the motion timings). Files under `src/brand/` and `src/scenes/` SHALL contain no colour literal: `#` plus three or six hex digits, `rgb(` or `hsl(`. Other geometry (ring spacing, token radius) is component code; choreography frames belong to the scene's timeline.

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
From the first phase's start until the scene's outro frame, the state of the latest phase that has started SHALL be in focus: fully opaque and scaled by `motion.focusScale`; every other state block SHALL use `motion.dimOpacity`. Focus moves with a spring using the `motion.focus` values. Before the first phase (the intro) and from the outro frame on, every block is fully opaque.

#### Scenario: Focus changes to the next state
- **WHEN** a new phase starts on another state
- **THEN** within 30 frames the new state is within 0.01 of full opacity and of `motion.focusScale`, and the previous one is within 0.01 of `motion.dimOpacity`

#### Scenario: Between two phases
- **WHEN** the frame falls after one phase's end and before the next phase's start
- **THEN** the state of the phase that ended stays in focus

#### Scenario: Intro and outro
- **WHEN** the frame is before the first phase's start, or at or after the outro frame
- **THEN** every state block is fully opaque

### Requirement: Call results and countdown
A call-result square SHALL show one of four kinds: `ok` (white fill, ink check mark), `fail` (failure colour, white cross), `blocked` (ink fill, white dash) and `empty` (dashed outline, no fill). A countdown ring SHALL be full at its phase's `from` frame and empty at its `to` frame (phase ranges are inclusive), decreasing linearly between them.

#### Scenario: Blocked call inside the OPEN block
- **WHEN** a `blocked` result is shown inside a block filled with `color.blocked`
- **THEN** the square is filled with `color.ink`, not with the block's colour

#### Scenario: Countdown at the phase boundaries
- **WHEN** the frame is the phase's `from`, its midpoint, and its `to`
- **THEN** the ring is full, half full, and empty

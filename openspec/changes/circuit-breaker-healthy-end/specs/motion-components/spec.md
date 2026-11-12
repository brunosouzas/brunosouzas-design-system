## MODIFIED Requirements

### Requirement: Focus on the active state
Focus SHALL give each state block an opacity factor and a scale factor, multiplied with its pop-in animation. From the first phase's start to the composition's last frame, the latest started phase's state is in focus (opacity 1, scale `motion.focusScale`) and the others get `motion.dimOpacity`; the outro frame changes neither factor. Focus moves with a `motion.focus` spring. Before the first phase both factors are 1 for every block.

#### Scenario: Focus changes to the next state
- **WHEN** a new phase starts on another state
- **THEN** within 30 frames the new state is within 0.01 of full opacity and of `motion.focusScale`, and the previous one is within 0.01 of `motion.dimOpacity`

#### Scenario: Between two phases
- **WHEN** the frame falls after one phase's end and before the next phase's start
- **THEN** the state of the phase that ended stays in focus

#### Scenario: Intro and outro
- **WHEN** the frame is before the first phase's start, or at or after the outro frame
- **THEN** in the intro every opacity and scale factor is 1; in the outro the last state in focus keeps opacity 1 and `motion.focusScale`, and the others keep `motion.dimOpacity` and scale 1, the same factors as on the frame before the outro

#### Scenario: Pop-in during the intro
- **WHEN** the circuit-breaker scene is at frame 10
- **THEN** the CLOSED block is mid pop-in (opacity and scale come from its pop-in, since both focus factors are 1) and the HALF_OPEN block, whose pop-in starts at 22, is not visible

## ADDED Requirements

### Requirement: Latest call of a state block
The frame logic SHALL give, for a state at a frame, the latest call shown in its block (its kind and the frame it happened), or none: the last non-empty slot of the block's contents at that frame. A code tag pops in from that call's frame with the pill pop-in (`motion.pop` spring, from 70 % scale) and is multiplied with its block's appearance, never replacing it.

#### Scenario: Latest call follows the slots
- **GIVEN** the circuit-breaker timeline
- **WHEN** the latest call of CLOSED is read at frames 89, 90 and 400
- **THEN** it is `ok` at 73, then `fail` at 90, then `fail` at 175

#### Scenario: No call yet
- **GIVEN** the circuit-breaker timeline
- **WHEN** the latest call of OPEN is read at frame 100 (before its first phase) and at 545 (its second phase started, no call yet)
- **THEN** there is none at both frames

#### Scenario: Tag pop-in times the block
- **GIVEN** a call at frame F in a block whose appearance at F + 5 is opacity A and scale S
- **WHEN** the tag's appearance is read at F + 5
- **THEN** its opacity is A times the pill pop-in opacity at 5 frames and its scale is S times the pill pop-in scale at 5 frames

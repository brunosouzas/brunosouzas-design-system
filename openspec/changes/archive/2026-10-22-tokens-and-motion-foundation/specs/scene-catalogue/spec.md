# Spec Delta

## Purpose

Defines how an animated scene is registered in the catalogue (formats, languages, text tables, timelines, source article) and holds the first scene, the circuit-breaker state machine.

## ADDED Requirements

### Requirement: One composition per format and language
Each scene SHALL be registered as one composition per format and language, with the id `<scene>-<format>-<language>`: format `16x9` (1920x1080) or `4x5` (1080x1350), language `pt` or `en`, frame rate `motion.fps`. The Studio SHALL list a scene's compositions in a folder named after the scene.

#### Scenario: Circuit-breaker compositions
- **WHEN** the catalogue is loaded
- **THEN** it holds `circuit-breaker-states-16x9-pt`, `circuit-breaker-states-16x9-en`, `circuit-breaker-states-4x5-pt` and `circuit-breaker-states-4x5-en`, with the sizes above and 30 frames per second, grouped under the folder `circuit-breaker-states`

#### Scenario: Duplicate composition id
- **WHEN** two scenes would register the same composition id
- **THEN** the catalogue test fails and names the id

### Requirement: Text table per language
Each scene SHALL keep every on-screen string in one text table with a `pt` and an `en` entry holding the same keys at every level, and SHALL record the URL of its source article for each language. A list of strings counts as one key: it must be non-empty in both languages, and its length may differ between them (a label can wrap into more lines in Portuguese).

#### Scenario: Key missing in one language
- **WHEN** the `en` entry lacks a key the `pt` entry has, at any level
- **THEN** the catalogue test fails and names the scene, the language and the key path

#### Scenario: Lists of different lengths
- **WHEN** a label is a list of three lines in `pt` and two in `en`
- **THEN** the catalogue test passes

#### Scenario: Empty list
- **WHEN** a label is an empty list in one language
- **THEN** the catalogue test fails and names the scene, the language and the key path

#### Scenario: Empty string or missing source
- **WHEN** a string is empty, or a language has no source article URL starting with `https://`
- **THEN** the catalogue test fails and names the scene and the entry

### Requirement: Valid timeline
Each scene's timeline SHALL list phases as inclusive ranges `[from, to]` within `[0, duration − 1]`, each starting after the previous `to`; each event SHALL fall inside its phase. A transition fire SHALL fall after the `from` of a phase of its source state and before the `from` of the next phase, which SHALL be of its target state. The outro frame SHALL be at most `duration − motion.readingHold`, and every phase start, event, fire, arrow draw and pill pop-in SHALL come before it.

#### Scenario: Phase beyond the composition
- **WHEN** a phase's `to` is equal to or greater than the duration
- **THEN** the catalogue test fails and names the scene and the phase

#### Scenario: Fire outside its window
- **WHEN** a CLOSED to OPEN fire falls before its CLOSED phase starts, or after the next phase starts, or the next phase is not OPEN
- **THEN** the catalogue test fails and names the scene, the transition and the frame

#### Scenario: Outro inside the reading hold
- **WHEN** a 1000-frame scene with `motion.readingHold` 90 sets its outro at 950
- **THEN** the catalogue test fails and names the scene and the outro frame

#### Scenario: Overlapping phases
- **WHEN** a phase's `from` is equal to or before the previous phase's `to`
- **THEN** the catalogue test fails and names the scene and both phases

#### Scenario: Event outside its phase
- **WHEN** an event's frame is after its phase's end
- **THEN** the catalogue test fails and names the scene, the phase and the frame

#### Scenario: Movement inside the reading hold
- **WHEN** an event, a fire, an arrow draw or a pill pop-in happens at or after the outro frame
- **THEN** the catalogue test fails and names the scene and the frame

### Requirement: Circuit-breaker state machine scene
The scene `circuit-breaker-states` SHALL animate the states CLOSED, OPEN and HALF_OPEN of the article "Circuit Breaker in MuleSoft" (`https://brunosouzas.com/blog/circuit-breaker-in-mulesoft`, Portuguese at `https://brunosouzas.com/pt/blog/circuit-breaker-in-mulesoft`) through one loop, with the article's diagram labels and its three state sentences. The OPEN block carries the countdown. Its timing is the approved pilot's, listed frame by frame in the design.

#### Scenario: Timing equals the approved pilot
- **WHEN** the scene's timeline is compared with the pilot timeline table in the design
- **THEN** duration, intro end, outro frame, start-marker fade, block pop-in frames, rings fade, every phase range, every event, every transition fire, every draw and pill frame, and the slot counts are equal

#### Scenario: Phase and transition order
- **WHEN** the scene's timeline is read
- **THEN** the phases run CLOSED, OPEN, HALF_OPEN, OPEN, HALF_OPEN, CLOSED, and the transitions fire in the order CLOSED to OPEN, OPEN to HALF_OPEN, HALF_OPEN to OPEN, OPEN to HALF_OPEN, HALF_OPEN to CLOSED

#### Scenario: Failure crosses the threshold before OPEN
- **WHEN** the first CLOSED phase's call results are read
- **THEN** they contain both `ok` and `fail` results, the last results are `fail`, and the CLOSED to OPEN transition fires after the last of them

#### Scenario: The failed test reopens, the successful test closes
- **WHEN** the two HALF_OPEN phases are read
- **THEN** the first ends with a `fail` result followed by the HALF_OPEN to OPEN transition, and the second holds only `ok` results followed by the HALF_OPEN to CLOSED transition

#### Scenario: Caption follows the active state
- **WHEN** a still is taken during each phase
- **THEN** the caption shows the active state's name and its sentence from the article, in the composition's language

#### Scenario: Caption outside phases
- **WHEN** the frame is before the first phase, or between two phases, or in the outro
- **THEN** there is no caption before the first phase; between phases and in the outro the caption of the latest phase that started stays

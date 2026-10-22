# Spec Delta

## Purpose

Defines how an animated scene is registered in the catalogue (formats, languages, text tables, timelines, source article) and holds the first scene, the circuit-breaker state machine.

## ADDED Requirements

### Requirement: One composition per format and language
Each scene SHALL be registered as one composition per format and language, with the id `<scene>-<format>-<language>`: format `16x9` (1920x1080) or `4x5` (1080x1350), language `pt` or `en`, frame rate `motion.fps`. The Studio SHALL list a scene's compositions in a folder named after the scene.

#### Scenario: Circuit-breaker compositions
- **WHEN** the catalogue is loaded
- **THEN** it holds `circuit-breaker-states-16x9-pt`, `circuit-breaker-states-16x9-en`, `circuit-breaker-states-4x5-pt` and `circuit-breaker-states-4x5-en`, with the sizes above and 30 frames per second

#### Scenario: Duplicate composition id
- **WHEN** two scenes would register the same composition id
- **THEN** the catalogue test fails and names the id

### Requirement: Text table per language
Each scene SHALL keep every on-screen string in one text table with a `pt` and an `en` entry holding the same keys, and SHALL record the URL of its source article for each language.

#### Scenario: Key missing in one language
- **WHEN** the `en` entry lacks a key the `pt` entry has
- **THEN** the catalogue test fails and names the scene, the language and the key

#### Scenario: Empty string or missing source
- **WHEN** a string is empty, or a language has no source article URL starting with `https://`
- **THEN** the catalogue test fails and names the scene and the entry

### Requirement: Valid timeline
Each scene's timeline SHALL list phases in increasing, non-overlapping frame ranges inside the composition; each event SHALL fall inside its phase; each transition fire SHALL fall after the start of its source phase and before the start of the phase it leads to. No phase start, event or fire SHALL happen in the last `motion.readingHold` frames.

#### Scenario: Overlapping phases
- **WHEN** a phase starts before the previous phase ends
- **THEN** the catalogue test fails and names the scene and both phases

#### Scenario: Event outside its phase
- **WHEN** an event's frame is after its phase's end
- **THEN** the catalogue test fails and names the scene, the phase and the frame

#### Scenario: Movement inside the reading hold
- **WHEN** an event happens within the last `motion.readingHold` frames
- **THEN** the catalogue test fails and names the scene and the frame

### Requirement: Circuit-breaker state machine scene
The scene `circuit-breaker-states` SHALL animate the states CLOSED, OPEN and HALF_OPEN of the article "Circuit Breaker in MuleSoft" through one loop: CLOSED, OPEN, HALF_OPEN, OPEN, HALF_OPEN, CLOSED. Its strings are the article's diagram labels and its three state sentences, in Portuguese and English. It lasts 1000 frames.

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

# scene-catalogue Specification

## Purpose
Defines how an animated scene is registered in the catalogue (formats, languages, text tables, timelines, source article) and holds the first scene, the circuit-breaker state machine.

## Requirements

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
Each scene SHALL have ordered, non-overlapping inclusive phases within its duration and events inside their phases. The outro SHALL leave at least `motion.readingHold` frames. State-machine fires SHALL retain their source/next-target window rule. Phase starts, events, fires, arrow draws and pill pop-ins SHALL precede the outro. Flow trips and visible animation SHALL finish before the outro; flow-specific validation SHALL replace state-machine slot/fire rules only for flow scenes.

#### Scenario: Phase beyond the composition
- **GIVEN** a registered scene of either kind
- **WHEN** a phase's `to` is equal to or greater than the duration
- **THEN** the catalogue test fails and names the scene and the phase

#### Scenario: Fire outside its window
- **GIVEN** the circuit-breaker state-machine scene
- **WHEN** a CLOSED to OPEN fire falls before its CLOSED phase starts, or after the next phase starts, or the next phase is not OPEN
- **THEN** the catalogue test fails and names the scene, the transition and the frame

#### Scenario: Outro inside the reading hold
- **GIVEN** a 1000-frame scene with `motion.readingHold` 90
- **WHEN** it sets its outro at 950
- **THEN** the catalogue test fails and names the scene and the outro frame

#### Scenario: Overlapping phases
- **GIVEN** a registered scene of either kind
- **WHEN** a phase's `from` is equal to or before the previous phase's `to`
- **THEN** the catalogue test fails and names the scene and both phases

#### Scenario: Event outside its phase
- **GIVEN** a registered scene of either kind
- **WHEN** an event's frame is after its phase's end
- **THEN** the catalogue test fails and names the scene, the phase and the frame

#### Scenario: Movement inside the reading hold
- **GIVEN** a registered scene of either kind
- **WHEN** an event, a fire, an arrow draw or a pill pop-in happens at or after the outro frame
- **THEN** the catalogue test fails and names the scene and the frame

#### Scenario: Flow trip crosses the outro
- **GIVEN** a flow scene with outro 910
- **WHEN** a token trip starts at 900 and arrives at 922
- **THEN** validation fails naming the scene, route and arrival frame, although the departure precedes the outro

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

### Requirement: State-machine and flow catalogue compatibility
The catalogue SHALL register both state-machine and message-flow scenes through the same composition, text, source and phase-range contract, without requiring flow nodes to be active states or hold call slots. The circuit-breaker scene's data, four compositions, frame behaviour, pinned timing assertions and existing tests SHALL remain unchanged, except assertions that list every registered scene, which SHALL list both scenes in registration order.

#### Scenario: Both kinds in the catalogue
- **GIVEN** the circuit-breaker and pub-sub scenes
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** both pass and eight unique compositions are returned, circuit-breaker first, pub-sub second; the existing circuit-breaker test suite and pinned timeline pass without edits

#### Scenario: Shared checks still reject a broken flow
- **GIVEN** a pub-sub fixture with a duplicate composition id, a missing English text key or a non-HTTPS source
- **WHEN** catalogue validation runs on each fixture
- **THEN** each is rejected by the corresponding existing shared rule with the scene and offending entry named

### Requirement: Publish-subscribe compositions and source text
The scene `publish-subscribe` SHALL provide 16x9 and 4x5 compositions in PT and EN, 1000 frames at 30 fps, sourced from the two published Publish-Subscribe wiki pages. Every displayed string SHALL match the article or its Anypoint MQ diagram in that language, as transcribed in the design; line breaks SHALL NOT change words, punctuation or identifiers.

#### Scenario: Pub-sub compositions and text provenance
- **GIVEN** the source and text tables transcribed in the design
- **WHEN** compositions and on-screen text are inspected in both languages
- **THEN** ids are `publish-subscribe-16x9-pt`, `publish-subscribe-16x9-en`, `publish-subscribe-4x5-pt`, `publish-subscribe-4x5-en`, with standard format sizes, the source URLs, exact diagram labels and exact caption fragments

#### Scenario: Caption windows and final caption
- **GIVEN** the design's caption windows
- **WHEN** frame 0, each window boundary and frame 999 are evaluated in either language
- **THEN** no caption precedes frame 40; each window uses its assigned verbatim fragment with the standard fade; the final caption remains fully visible throughout frames 910–999; internal phase ids are never displayed

### Requirement: Publish acceptance and independent copies
The pub-sub scene SHALL animate one event from the API to the exchange, confirm acceptance at the API before fan-out, split into exactly three queue copies, then consume each from its own queue. Two successful copies SHALL disappear on ACK. Only invoice SHALL fail and return to its queue on NACK. The design's exact timing and ownership table SHALL be followed, with no subsequent redelivery or publisher failure signal.

#### Scenario: Publish confirms exchange acceptance only
- **GIVEN** frames 99, 100, 111 and 122
- **WHEN** frame state is evaluated
- **THEN** before 100 there is no token; at 100 it leaves the API, at 111 it is halfway by path length, and at 122 it rests at the exchange and the API gains a white square with ink check, before any queue receives a copy

#### Scenario: Three copies split and wait
- **GIVEN** the accepted exchange token
- **WHEN** frames 279, 280, 291 and 302 are evaluated
- **THEN** at 279 one token rests at the exchange; at 280 it is replaced by three distinct travelling copies; at 291 each is halfway along its binding; at 302 exactly one rests in each queue and none remains at the exchange

#### Scenario: ACKs and invoice NACK are independent
- **GIVEN** three queued copies at frame 469
- **WHEN** frames 470, 492, 550, 580, 610, 640 and 662 are evaluated
- **THEN** all three depart at 470 and arrive at their consumers at 492; payment ACKs and loses its copy at 550, inventory at 580; invoice fails at 610, returns from 640 to 662, and waits only in the invoice queue thereafter; both successful checks and the API confirmation persist

#### Scenario: Final scene holds without redelivery
- **GIVEN** the invoice copy returned and the final caption settled
- **WHEN** every frame from 910 through 999 is compared
- **THEN** visible scene state is identical: one invoice queue copy, no other tokens, two consumer checks, the red invoice block with its cross, unchanged API confirmation, no fourth subscriber and no successful redelivery

### Requirement: Deterministic flow validation
Flow choreography SHALL be seekable without accumulating state. Validation SHALL reject unknown route endpoints, invalid event ranges and impossible copy ownership (a copy on two routes or in a queue while travelling), naming the scene and offending item. Event boundaries SHALL transfer ownership atomically without double drawing or losing a copy.

#### Scenario: Unknown endpoint and impossible ownership
- **GIVEN** separate broken fixtures with an unknown route endpoint, an inverted event range, overlapping trips for the invoice copy, or a queue dwell overlapping its departure
- **WHEN** flow validation runs
- **THEN** each fixture fails with the scene and offending node, route or copy/event named

#### Scenario: Seeking and handoff boundaries
- **GIVEN** frames immediately before, at and after every departure, split, arrival, ACK and NACK
- **WHEN** they are evaluated forward, backward and in a shuffled order
- **THEN** each frame returns the same ownership and marks every time, with no duplicate copy at any boundary

### Requirement: Independent readable layouts
The scene SHALL use an independent layout and routes for each format, preserving the diagram's containment and queue-to-consumer relationships. In 4x5 node names SHALL be at least 54 px, labels and mono identifiers at least 30 px, and captions at least 38 px. Identifiers SHALL remain complete; labels, tokens and captions SHALL NOT overlap or clip.

#### Scenario: Portrait identifiers and long Portuguese names fit
- **GIVEN** the portrait layout in each language, including `order-created-inventory` and `Consumidor de nota fiscal`
- **WHEN** all phase stills and the final frame are reviewed at 1080x1350
- **THEN** queue/consumer rows and wrapped names remain legible at the minimum sizes, every queue is inside MQ, every consumer outside, the bindings leave the exchange as one trunk with a short branch per queue, the rows extend to just above the caption, and all text, shadows and travelling token routes stay clear of other labels and the caption area

#### Scenario: Landscape preserves diagram topology
- **GIVEN** the landscape layout in each language
- **WHEN** phase stills and token mid-trip frames are reviewed at 1920x1080
- **THEN** the API sits above the MQ container, exchange above three queue columns inside it, and three consumers below it; labels remain exact and unobscured, including on the invoice return route

### Requirement: Cast motion test
The Studio SHALL register the approved cast motion test as composition `cast-motion-test` in a folder `cast`: 1920×1080, `motion.fps`, 360 frames, no words. It SHALL draw `castMotionTestFrame(frame)` from `src/scenes/cast-motion-test/frames.ts`, the timeline of design §8 of `cast-and-emotes`. It SHALL NOT be a catalogue scene: it illustrates no article (ADR 0004), so it is not in `src/scenes/index.ts`.

#### Scenario: Registered outside the catalogue
- **WHEN** the test calls `RemotionRoot()` and walks the returned element tree
- **THEN** it finds exactly one `Composition` with id `cast-motion-test`, inside a `Folder` named `cast`, with width 1920, height 1080, fps 30 and 360 frames, and `scenes` from `src/scenes/index.ts` has no scene with that id

#### Scenario: Not a scene for the commands
- **WHEN** `npm run stills -- cast-motion-test --dry-run` runs
- **THEN** it fails as for any unknown scene, listing the catalogue's scenes

### Requirement: One emote at a time in the motion test
The motion test SHALL show at most one emote per frame, each popping in with its character's face change and gone before the next emote appears, as design §8: `idea` with the agent's `happy` at 62, `doubt` with the requester's `thinking` at 142, `problem` with the dev's `surprised` at 246.

#### Scenario: Emote windows
- **WHEN** the test lists the `data-emote` groups of every frame
- **THEN** frames 63–121 hold only `idea`, 143–215 only `doubt`, 247–319 only `problem`, and every other frame none

#### Scenario: Onset with the face
- **WHEN** frames 62, 142 and 246 are drawn
- **THEN** the agent's face is `happy`, the requester's `thinking` and the dev's `surprised` respectively, and the emote is absent at that frame and present at the next

### Requirement: Motion test frames frozen
For each frame f from 0 to 359, the SHA-256 of `toSvg(castMotionTestFrame(f))` SHALL equal entry f of `frames` in `test/fixtures/cast-0.5.0.json`. The frame has no text node.

#### Scenario: Every frame matches
- **WHEN** the test renders all 360 frames to SVG strings
- **THEN** every hash matches its entry, and no frame holds a `text` node

#### Scenario: A changed beat is caught
- **WHEN** the idea emote's pop-in moves from frame 62 to 63
- **THEN** the test fails and names frames 63 to 111, and only those (the emote is absent at 62 either way, and leaves from 112 on the same curve)

#### Scenario: React path matches
- **WHEN** frames 0, 75, 160 and 280 are rendered with `toReact` inside an `svg` root and with `toSvg`
- **THEN** their normal forms match

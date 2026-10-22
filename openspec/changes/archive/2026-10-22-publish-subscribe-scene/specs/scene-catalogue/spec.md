## MODIFIED Requirements

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

## ADDED Requirements

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

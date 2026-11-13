# scene-catalogue Specification

## Purpose
Defines how an animated scene is registered in the catalogue (formats, languages, text tables, timelines, source article) and holds the first scene, the circuit-breaker state machine.

## Requirements

### Requirement: One composition per format and language
Each localised scene SHALL be registered as one composition per format and language, with the id `<scene>-<format>-<language>`: format `16x9` (1920x1080) or `4x5` (1080x1350), language `pt` or `en`. A neutral scene SHALL be registered as one composition per format, with the id `<scene>-<format>`. Every composition runs at `motion.fps`. The Studio SHALL list a scene's compositions in a folder named after the scene.

#### Scenario: Circuit-breaker compositions
- **WHEN** the catalogue is loaded
- **THEN** it holds `circuit-breaker-states-16x9-pt`, `circuit-breaker-states-16x9-en`, `circuit-breaker-states-4x5-pt` and `circuit-breaker-states-4x5-en`, with the sizes above and 30 frames per second, grouped under the folder `circuit-breaker-states`

#### Scenario: Neutral composition
- **GIVEN** the test fixture `takes-fixture`, a neutral scene of 780 frames, format `16x9` only
- **WHEN** its compositions are enumerated
- **THEN** exactly one is returned: id `takes-fixture-16x9`, folder `takes-fixture`, format `16x9`, language `en`, 1920x1080, 30 frames per second, 780 frames

#### Scenario: Duplicate composition id
- **WHEN** two scenes would register the same composition id
- **THEN** the catalogue test fails and names the id

#### Scenario: Duplicate neutral composition id
- **GIVEN** the fixture `takes-fixture` listed twice
- **WHEN** the catalogue is checked
- **THEN** it fails naming `duplicate composition id takes-fixture-16x9`

### Requirement: Text table per language
Each localised scene SHALL keep every on-screen string in one text table with a `pt` and an `en` entry holding the same keys at every level, and SHALL record the URL of its source article for each language. A list of strings counts as one key: it must be non-empty in both languages, and its length may differ between them (a label can wrap into more lines in Portuguese). Neutral scenes follow "Neutral scenes" instead.

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
Each scene SHALL have ordered, non-overlapping inclusive phases within its duration and events inside their phases. The outro SHALL leave at least `motion.readingHold` frames. State-machine fires SHALL retain their source/next-target window rule. Phase starts, events, fires, arrow draws and pill pop-ins SHALL precede the outro. Flow trips and visible animation SHALL finish before the outro; flow and takes validation SHALL replace state-machine slot/fire rules only for scenes of that kind.

#### Scenario: Phase beyond the composition
- **GIVEN** a scene of any kind (a registered scene, or the fixture `takes-fixture`)
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
- **GIVEN** a scene of any kind (a registered scene, or the fixture `takes-fixture`)
- **WHEN** a phase's `from` is equal to or before the previous phase's `to`
- **THEN** the catalogue test fails and names the scene and both phases

#### Scenario: Event outside its phase
- **GIVEN** a scene of any kind (a registered scene, or the fixture `takes-fixture`)
- **WHEN** an event's frame is after its phase's end
- **THEN** the catalogue test fails and names the scene, the phase and the frame

#### Scenario: Movement inside the reading hold
- **GIVEN** a scene of any kind (a registered scene, or the fixture `takes-fixture`)
- **WHEN** an event, a fire, an arrow draw or a pill pop-in happens at or after the outro frame
- **THEN** the catalogue test fails and names the scene and the frame

#### Scenario: Flow trip crosses the outro
- **GIVEN** a flow scene with outro 910
- **WHEN** a token trip starts at 900 and arrives at 922
- **THEN** validation fails naming the scene, route and arrival frame, although the departure precedes the outro

#### Scenario: Takes scene needs no slots or fires
- **GIVEN** the fixture `takes-fixture`, kind `takes`, which has no `slots`, `transitions` or `fires`
- **WHEN** its timeline is checked
- **THEN** it passes, and no state-machine message (`never fires`, `outside its window`) is reported for it

#### Scenario: Takes outro inside the reading hold
- **GIVEN** the fixture `takes-fixture` (780 frames) with its outro moved to 691
- **WHEN** its timeline is checked
- **THEN** it fails naming the scene and outro frame 691 (at most 690)

#### Scenario: Takes phase starting in the reading hold
- **GIVEN** the fixture `takes-fixture` (outro 690) with its last phase `t2-result` moved to 690–700, with no events
- **WHEN** its timeline is checked
- **THEN** it fails naming the scene, the start of phase `t2-result` and frame 690

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
The catalogue SHALL register state-machine, message-flow, two-take and sequence scenes through the same composition, text, source and phase-range contract, without requiring flow nodes, takes or sequences to be active states or hold call slots. The circuit-breaker and publish-subscribe scenes' data, compositions, frame behaviour, pinned timing assertions and existing tests SHALL remain unchanged, except assertions that list every registered scene, which SHALL list them in registration order.

#### Scenario: Both kinds in the catalogue
- **GIVEN** the circuit-breaker and pub-sub scenes, registered with later scenes after them
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** both pass and their eight compositions are returned unchanged, circuit-breaker first, pub-sub second; the existing circuit-breaker test suite and pinned timeline pass without edits

#### Scenario: Takes fixture beside the registered scenes
- **GIVEN** the registered scenes on this branch followed by the fixtures `takes-fixture` and a sequence fixture
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass and the registered scenes' compositions are returned unchanged and in order, the fixtures last, every id unique; the catalogue itself registers exactly `circuit-breaker-states`, `publish-subscribe`, `sdd-request-relay`, `sdd-scene-2-files`, `sdd-scene-3-archive` and `circuit-breaker-topology`, in that order

#### Scenario: Three scenes in the catalogue
- **GIVEN** the circuit-breaker, pub-sub and `circuit-breaker-topology` scenes, registered with the SDD scenes between pub-sub and topology
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass and the three keep their relative order, their nine compositions are returned unchanged, and `circuit-breaker-topology-16x9` is the last composition

#### Scenario: Four scenes in the catalogue
- **GIVEN** the circuit-breaker, pub-sub, `sdd-request-relay` and `circuit-breaker-topology` scenes, registered with `sdd-scene-2-files` and `sdd-scene-3-archive` between the relay and topology scenes
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass, the four keep their relative order, and `sdd-request-relay-16x9` is the ninth composition

#### Scenario: Five scenes in the catalogue
- **GIVEN** the circuit-breaker, pub-sub, `sdd-request-relay`, `sdd-scene-2-files` and `circuit-breaker-topology` scenes, registered in that order with `sdd-scene-3-archive` excluded
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass and eleven unique compositions are returned in registration order, `sdd-scene-2-files-16x9` tenth and `circuit-breaker-topology-16x9` last, and the commands' `available scenes:` line lists the five scenes in that order

#### Scenario: Six scenes in the catalogue
- **GIVEN** the circuit-breaker, pub-sub, `sdd-request-relay`, `sdd-scene-2-files`, `sdd-scene-3-archive` and `circuit-breaker-topology` scenes, registered in that order
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass and twelve unique compositions are returned in registration order, `sdd-scene-2-files-16x9` tenth, `sdd-scene-3-archive-16x9` eleventh and `circuit-breaker-topology-16x9` last, and the commands' `available scenes:` line lists the six scenes in that order

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

### Requirement: Neutral scenes
A scene marked neutral SHALL declare the language `en` only (its words are English, ADR 0005 as amended), SHALL keep its on-screen strings in one `en` table with no empty string or list, and SHALL record `https://` source URLs for both `pt` and `en`, because its one video serves both pages. The catalogue SHALL reject any other combination, naming the scene and the problem.

#### Scenario: Valid neutral scene
- **GIVEN** the fixture `takes-fixture` with `languages` `["en"]`, `text.en` only and both sources
- **WHEN** the catalogue is checked
- **THEN** it reports no problem for the scene

#### Scenario: Neutral scene with a Portuguese table
- **GIVEN** the fixture with a `text.pt` table added
- **WHEN** the catalogue is checked
- **THEN** it fails naming the scene and saying a neutral scene has no `pt` text table

#### Scenario: Neutral scene in two languages
- **GIVEN** the fixture with `languages` `["pt", "en"]`, or `["pt"]`
- **WHEN** the catalogue is checked
- **THEN** each fails naming the scene and saying a neutral scene declares `en` only

#### Scenario: Neutral scene missing a source
- **GIVEN** the fixture without `sources.pt`, or with `sources.pt` starting `http://`
- **WHEN** the catalogue is checked
- **THEN** each fails naming the scene and `pt` source

#### Scenario: Neutral scene with an empty word
- **GIVEN** the fixture with `text.en.label` set to `""`, or `text.en.takes` set to `[]`
- **WHEN** the catalogue is checked
- **THEN** each fails naming the scene, `en` and the key path

### Requirement: Two-take scene kind
A scene of kind `takes` SHALL order its phases as one or more take-1 phases, exactly one rewind phase, then one or more take-2 phases, and every phase SHALL cite at least one line of its English source as a positive integer. The catalogue SHALL reject any other order or a phase without a valid line, naming the scene and the phase. A `takes` scene SHALL be neutral.

#### Scenario: Valid takes
- **GIVEN** the fixture `takes-fixture`, phases `t1-open`, `t1-act`, `t1-result` (take 1), `rewind`, `t2-open`, `t2-act`, `t2-result` (take 2), each citing lines
- **WHEN** its timeline is checked
- **THEN** no takes problem is reported

#### Scenario: Takes out of order
- **GIVEN** separate fixtures where `t2-open` is marked take 1, where `t1-result` is marked take 2, where a second rewind phase follows `t2-open`, where the three take-1 phases are removed, and where the three take-2 phases are removed
- **WHEN** each timeline is checked
- **THEN** each fails naming the scene and the first phase that breaks the order (`t2-open`, `t1-result`, the second rewind, `rewind`), or, for the last, saying the takes end at phase `rewind` without completing the order

#### Scenario: Phase without an article line
- **GIVEN** separate fixtures where `t1-act` cites `[]`, `[0]` or `[26.5]`
- **WHEN** each timeline is checked
- **THEN** each fails naming the scene and phase `t1-act`

#### Scenario: Localised takes scene
- **GIVEN** a `takes` fixture that is not neutral
- **WHEN** the catalogue is checked
- **THEN** it fails naming the scene and saying a `takes` scene is neutral

### Requirement: Two-take cast timing
In a `takes` scene, acts of different actors SHALL NOT overlap (inclusive ranges); every emote SHALL enter on a frame where its actor's expression changes; at most one emote SHALL be visible at a frame (from its entrance until 10 frames after its leave, or to the end); an emote SHALL be gone before any act that starts after it. Problems name the scene and the item.

#### Scenario: The fixture's own cues pass
- **GIVEN** the fixture `takes-fixture` with Visor's acts 90–90, 344–344, 390–480 and 600–600, faces at 270, 344, 504, 600 and 660, emotes `problem` (270, leaving at 320) and `worked` (660, never leaving)
- **WHEN** its timeline is checked
- **THEN** no cast problem is reported

#### Scenario: Two actors at once
- **GIVEN** a fixture adding a `mira` act 470–490 while Visor's act 390–480 runs
- **WHEN** its timeline is checked
- **THEN** it fails naming the scene and both acts

#### Scenario: Emote off an expression change
- **GIVEN** a fixture with the `problem` emote entering at 271 while the face changes at 270, and a fixture whose emote enters on a face entry that repeats the current expression
- **WHEN** each timeline is checked
- **THEN** each fails naming the scene, the emote and its frame

#### Scenario: Two emotes on screen
- **GIVEN** a fixture whose `problem` emote never leaves, plus the `worked` emote at 660
- **WHEN** its timeline is checked
- **THEN** it fails naming the scene and both emotes

#### Scenario: Emote still visible at the next action
- **GIVEN** a fixture whose `problem` emote leaves at 336, so it is visible until frame 345, and Visor's act at 344
- **WHEN** its timeline is checked
- **THEN** it fails naming the scene, emote `problem` and the act at 344; with the leave at 334 (gone at 344) it passes

### Requirement: Two-take reading hold
In a `takes` scene, nothing SHALL move from the outro on: acts, expression changes, emote entrances and leaves, trip arrivals, fade ends and the other cue frames SHALL be before the outro, and every pop-in, including an emote's, SHALL start at or before the outro minus `motion.fps`, so it is settled by the outro. Problems name the scene, the item and its frame.

#### Scenario: The fixture's own hold passes
- **GIVEN** the fixture `takes-fixture`, outro 690, its last pop-in the `worked` emote at 660 and its last fade ending at 610
- **WHEN** its timeline is checked
- **THEN** no hold problem is reported

#### Scenario: Cue at or after the outro
- **GIVEN** separate fixtures with outro 690 and, each, one of: a face change at 690, an act starting at 700, a trip arriving at 691, a fade ending at 695, a cue at 690, an emote leave ending at 695, an element leave ending at 690, the rewind ending at 690, the rings fade ending at 695
- **WHEN** each timeline is checked
- **THEN** each fails naming the scene, the item and its frame

#### Scenario: Pop-in too late to settle
- **GIVEN** separate fixtures with the `stamp` pop-in at 661 and the `worked` emote (with its face change) at 661
- **WHEN** each timeline is checked
- **THEN** each fails naming the scene, the item and frame 661 (at most 660); at 660 both pass

### Requirement: Topology scene registration
The catalogue SHALL register `circuit-breaker-topology` after every scene registered before it: kind `takes`, neutral, format `16x9` only, 1920 frames at 30 fps, outro 1800, sources `https://brunosouzas.com/blog/circuit-breaker-in-mulesoft` (`en`) and `https://brunosouzas.com/pt/blog/circuit-breaker-in-mulesoft` (`pt`), and the `text.en` table of scenario "Word table". `src/Root.tsx` SHALL map its composition to the scene's component.

#### Scenario: Registered entry
- **GIVEN** the catalogue
- **WHEN** `findScene("circuit-breaker-topology")` is read
- **THEN** it returns the entry above with `neutral` true, `languages` `["en"]`, `text.en` only, and both sources, and `src/Root.tsx` registers `circuit-breaker-topology-16x9` with the scene's component

#### Scenario: Word table
- **GIVEN** the registered entry
- **WHEN** `text.en` is read
- **THEN** it equals `checkout` "Checkout", `payment` "Payment", `retry` "retry ×3", `breaker` ["`circuit-breaker:`", "`execute`"], `states` {`closed` "CLOSED", `open` "OPEN", `halfOpen` "HALF_OPEN"}, `timeout` "`HTTP:TIMEOUT`", `open` "`CIRCUIT-BREAKER:OPEN`", `message` ["payment temporarily", "unavailable"], `ok` "`200`", `business` "`400`", `clock` "`resetTimeout 10s`", `requests` "requests", `calls` "backend calls", `takes` ["1", "2"]; backticks mark code and are not drawn

#### Scenario: One composition, last
- **GIVEN** every registered scene
- **WHEN** the compositions are enumerated without React or font loading
- **THEN** the last one is `circuit-breaker-topology-16x9` (1920x1080, 30 fps, 1920 frames, folder `circuit-breaker-topology`), every id is unique, and the compositions of the scenes before it are returned unchanged and in their order

#### Scenario: No 4:5 and no second language
- **GIVEN** the registered entry
- **WHEN** its formats and compositions are read
- **THEN** formats are `["16x9"]` and no composition id of the scene ends in `-4x5`, `-pt` or `-en`

#### Scenario: Broken entry rejected
- **GIVEN** separate fixtures of the entry with a `text.pt` table, with `sources.pt` starting `http://`, or with its outro at 1831
- **WHEN** the catalogue is checked
- **THEN** each fails naming `circuit-breaker-topology` and the problem (Portuguese table, `pt` source, outro inside the reading hold)

### Requirement: Existing scenes unchanged by the topology scene
Adding the topology scene SHALL leave every scene registered before it unchanged: data, compositions, frame behaviour and tests, except the assertions that list every registered scene (in `test/scenes/catalogue-flow.test.ts` and `test/scripts/cli.test.ts`). In particular `circuit-breaker-states` SHALL keep its four compositions, its per-language text and its stills.

#### Scenario: Circuit-breaker states untouched
- **GIVEN** the branch after this change and `main` before it
- **WHEN** `test/scenes/circuit-breaker.test.ts` and the pinned circuit-breaker timeline run
- **THEN** they pass without edits, and `git diff` shows no change under `src/scenes/circuit-breaker-states/`

#### Scenario: Stills byte-identical (local)
- **GIVEN** the stills of every scene registered before the topology scene, rendered on the merge base and on the branch
- **WHEN** their SHA-256 are compared
- **THEN** every pair is equal

### Requirement: Topology words on screen
At every frame, every string the scene draws SHALL be a value of its `text.en` table (without backticks), a counter number (`0` to `60`), or a `CallSquare` glyph (✓, ✕). Across the composition every `text.en` value SHALL appear. A string counts as drawn when its element has opacity above 0 and scale above 0.001. The scene SHALL have no caption.

#### Scenario: Words over the whole composition
- **GIVEN** the stage trees and component props of frames 0 to 1919
- **WHEN** every drawn string is collected
- **THEN** each one is in the allowed set above, and the union holds every `text.en` value

#### Scenario: Words at their boundaries
- **GIVEN** frames 843, 844, 845, 949, 960, 1187, 1189 and 1919
- **WHEN** their drawn strings are read
- **THEN** `CIRCUIT-BREAKER:OPEN` and `payment temporarily` are not drawn at 843 or 844 and are drawn at 845 and 949; neither is drawn at 960; `200` is not drawn at 1187 and is drawn at 1189; frame 1919 draws `200` twice, `CLOSED`, `Checkout`, `Payment`, `circuit-breaker:`, `execute`, `2` and five ✓, and no `retry ×3`, `requests` or `resetTimeout 10s`

#### Scenario: Unlisted word rejected
- **GIVEN** a fixture whose stage draws the literal `fallback`, absent from `text.en`, in the `left` tag at frame 870
- **WHEN** the words test runs
- **THEN** it fails naming `fallback` and frame 870

### Requirement: Topology text size
Every word the scene draws SHALL have an effective font size, its `font-size` times every scale applied once its pop-in has settled, of at least 33 stage units (66 px in the composition; 11.7 px in the site's 341 px column on a 360 px phone); state names, the take number and the counter numbers at least 36; the ✓ and ✕ glyphs at least 30 (squares of 50 units).

#### Scenario: Every settled string at its minimum
- **GIVEN** every frame from 0 to 1919
- **WHEN** each drawn string whose pop-in has settled is measured
- **THEN** its effective size is at least 33; at least 36 for `CLOSED`, `OPEN`, `HALF_OPEN`, `1`, `2` and the counter numbers; at least 30 for ✓ and ✕

#### Scenario: Too small rejected
- **GIVEN** a fixture whose `requests` caption is drawn at 32, one whose state pill is drawn at 35, and one whose squares are 48 (glyph 29.8)
- **WHEN** the size test runs
- **THEN** each fails naming the string, its size and the first frame it is drawn

### Requirement: Topology text placement
Every drawn text box (measured advance on the `fonts/` faces times effective size) and badge SHALL lie inside the stage less 12 units, SHALL NOT intersect another text box or a token, and SHALL NOT intersect a block it does not label, per design §6.3: frames, units, breaker, pill bodies, squares, bar, clock ring, badges, rewind mark. No pill or text SHALL cover a Payment light. Moving and settling frames of design §6.3 item 7 are exempt.

#### Scenario: Placement at every checked frame
- **GIVEN** every frame from 0 to 1919 except the exempt frames of design §6.3 item 7
- **WHEN** the drawn text boxes, badges, blocks, lights and tokens are computed
- **THEN** each text box and badge lies within x 12–948 and y 12–528, and none intersects another text box, a token, a block it does not label, or a Payment light

#### Scenario: Exempt and checked frames
- **GIVEN** frames 531, 560 and 1681
- **WHEN** the placement test lists the elements it checks at each frame
- **THEN** at 531 the breaker box and its text are not checked (drop-in) and Checkout, Payment and their labels are; at 560 Checkout, Payment and the breaker text are checked and the state pill and the window are not (they settle at 578 and 584); at 1681 the window (slide) and the two tags (swapped at 1654 and 1676, settling until 1684 and 1706) are not checked, and Checkout, Payment, the breaker, the state pill and the tokens are

#### Scenario: Collision rejected
- **GIVEN** a fixture moving the customer message to x 300
- **WHEN** the placement test runs
- **THEN** it fails naming the customer message, the window, and the first frame where both are drawn and settled

#### Scenario: Covered light rejected
- **GIVEN** a fixture centring the `Payment` label at (846, 160)
- **WHEN** the placement test runs
- **THEN** it fails naming the `Payment` label and unit 0's light

### Requirement: Topology colour roles
`color.state.failure` SHALL appear only on Payment's failing units (body and light), the ✕ squares, the bar's fill and `failure` arrows; `color.state.failFast` only on `failFast` arrows; `color.state.blocked`, `healthy` and `transitional` only on the `OPEN`, `CLOSED` and `HALF_OPEN` pills; `color.state.caller` only on the `Checkout` label; `color.state.backend` nowhere. The `Payment` label SHALL be white.

#### Scenario: Roles over the whole composition
- **GIVEN** the stage trees and component props of frames 0 to 1919
- **WHEN** every fill and stroke is mapped to its `data-element`
- **THEN** each state colour appears only on the elements above, and the `Payment` label's fill is `color.white`

#### Scenario: Red payment label rejected
- **GIVEN** a fixture whose `Payment` label is filled `color.state.backend`
- **WHEN** the colour test runs
- **THEN** it fails naming the `Payment` label and `color.state.backend`

### Requirement: Topology built from package pieces
The scene SHALL draw only through the pieces `browserWindow`, `serverStack`, `diagramBox`, `messageArrow`, `edgeLabel`, `countBadge` and `uiIcon`, and the components `Rings`, `MotionPath`, `CallSquare`, `Countdown`, `FailureRateBar` and `PositionedToken`. Its files SHALL contain no colour literal and create no SVG shape of their own, and SHALL draw no cast piece or emote.

#### Scenario: No shape of its own
- **GIVEN** the files under `src/scenes/circuit-breaker-topology/`
- **WHEN** a test reads them
- **THEN** none calls `el(` with `path`, `rect`, `circle`, `ellipse`, `line`, `polygon` or `polyline`, none contains a JSX element of those tags, and none imports a cast piece or `emote`

#### Scenario: No colour literal
- **WHEN** the colour-literal test scans `src/scenes/` and `src/brand/`
- **THEN** it reports nothing for the new files

### Requirement: Topology beats and timing
The scene's timeline SHALL equal the change's design §4: the thirteen phases with their takes, frames and cited lines; every pop-in, swap, leave, fade, trip, counter value, light, tag and window event; the rewind's object frames; the outro. Every leg SHALL end `motion.travel` frames after it starts. The timeline SHALL have no acts, faces or emotes.

#### Scenario: Timeline equals the beat table
- **GIVEN** design §4 transcribed in the test and `motion.travel` 22
- **WHEN** it is compared with the scene's timeline
- **THEN** every value is equal, including phases `setup` 0–59, `retry` 60–389, `down` 390–449, `rewind` 450–509, `wrap` 510–569, `closed` 570–819, `open` 820–949, `half-open-fail` 950–1019, `open-again` 1020–1149, `half-open-ok` 1150–1219, `closed-noise` 1220–1489, `closed-business` 1490–1599 and `closed-healthy` 1600–1799

#### Scenario: Takes checks pass
- **GIVEN** the registered scene
- **WHEN** `checkTimeline` and the `takes` checks run
- **THEN** no problem is reported

#### Scenario: Seeking in any order
- **GIVEN** every frame from 0 to 1919
- **WHEN** the state is evaluated forward, backward and in a shuffled order
- **THEN** each frame gives the same state every time

#### Scenario: Travel token changed
- **GIVEN** the timeline built with `motion.travel` 20
- **WHEN** it is compared with the beat table
- **THEN** the comparison fails naming the first leg whose arrival differs

### Requirement: Topology take 1, retry only
In take 1 Checkout SHALL call Payment directly with `retry ×3`: 20 requests 15 frames apart, each departing as a group of three attempts two frames apart; `requests` SHALL count departed requests and `backend calls` arrived attempts; Payment's units SHALL fail (red) at calls 20, 40 and 60; the reply line SHALL be a `failure` arrow tagged `HTTP:TIMEOUT`. No breaker is drawn.

#### Scenario: First request
- **GIVEN** frames 59, 60, 62, 64, 75, 81 and 82
- **WHEN** the state is read
- **THEN** 59 has no token and counters `0` and `0`; 60 has one token at the start of `direct-req` and `requests` `1`; 62 and 64 add the second and third attempt; 75 has `requests` `2` and its first attempt departing; 81 has `backend calls` `0`; 82 has `backend calls` `1` and the reply arrow's fade starting

#### Scenario: The service goes down
- **GIVEN** frames 173, 174, 276, 277, 370, 371 and 389
- **WHEN** Payment's units and the counters are read
- **THEN** 173 has no failing unit and `19` calls; 174 has unit 0 failing and `20` calls; 276 has one failing unit; 277 adds unit 1 and `40`; 370 has two failing units; 371 has three and `60` calls; 389 has `20` requests, `60` calls, three failing units and no token

#### Scenario: Held down
- **GIVEN** frames 390 to 449
- **WHEN** the state is compared with frame 390
- **THEN** every frame is equal

### Requirement: Topology rewind
From 450 the rewind mark SHALL pop beside the take badge and the object layer SHALL play take 1 backwards with object frame `round(449 − (f − 450) × 390 / 49)` to 59 at 499, holding 59 to 509. At 500 the badge SHALL swap `1` to `2`. Rings, Checkout, Payment's boxes and labels SHALL not move.

#### Scenario: Object frame
- **GIVEN** frames 449, 450, 475, 499, 500 and 509
- **WHEN** the object frame is read
- **THEN** it is 449, 449, 250, 59, 59 and 59

#### Scenario: Same stage before each take
- **GIVEN** the states at 59 and at 509
- **WHEN** they are compared, leaving out the take badge and the rewind mark
- **THEN** they are equal: no token, counters `0` and `0`, white lights, `retry ×3`, the direct request arrow and no reply arrow or tag

#### Scenario: Badge swap
- **GIVEN** frames 499, 500 and 501
- **WHEN** the badge is read
- **THEN** 499 draws `1`, 500 draws no badge and 501 draws `2`, with the rewind mark drawn at all three

### Requirement: Topology breaker wraps the call
In `wrap`, `retry ×3` and the direct arrow SHALL leave, the breaker box SHALL travel down the drop path from 520 to 542, the two request arrows fade in, `CLOSED` SHALL pop at 548, the empty window and bar pop at 554, and Payment's unit 0 SHALL fail (red) at 560 and stay failing until 1188.

#### Scenario: Drop-in frames
- **GIVEN** frames 519, 531, 542, 548, 554 and 560
- **WHEN** the state is read
- **THEN** 519 draws no breaker box; 531 has its centre at (480, 95.5) on the drop path; 542 has it at (480, 251); 548 has the `CLOSED` pop starting; 554 the window's; 560 has unit 0 red and units 1 and 2 white

#### Scenario: Retry gone in take 2
- **GIVEN** every frame from 520 to 1919
- **WHEN** the drawn strings are read
- **THEN** `retry ×3` is not drawn

### Requirement: Topology CLOSED fills the window
In `closed`, five calls SHALL reach Payment and come back `HTTP:TIMEOUT`; each result SHALL add a ✕ square to the window and move the bar linearly over `motion.fade` frames to its failure count over five; the circuit SHALL stay CLOSED while the rate is at or below the 0.8 threshold and switch to OPEN after it is above it.

#### Scenario: Results enter the window
- **GIVEN** frames 641, 642, 652, 768 and 810
- **WHEN** the window, bar and pill are read
- **THEN** 641 has five empty slots and rate 0; 642 has square 0's pop starting; 652 has rate 0.2; 768 has four ✕ and the pill `CLOSED`; 810 has five ✕

#### Scenario: At the threshold, still CLOSED
- **GIVEN** frames 778 to 819
- **WHEN** the pill and the bar are read
- **THEN** from 778 to 809 the rate is exactly 0.8 and the pill is `CLOSED`; from 820 the pill is `OPEN`

#### Scenario: Calls counted on arrival
- **GIVEN** frames 619, 620 and 788
- **WHEN** `backend calls` is read
- **THEN** it reads `0`, `1` and `5`

### Requirement: Topology OPEN fails fast
In `open` and `open-again`, no token SHALL travel `out-req` or `out-rep`, which are dashed at opacity 0.25. Each request SHALL come back on `in-rep` as a `failFast` arrow on the frame it reaches the breaker. `CIRCUIT-BREAKER:OPEN` and `payment temporarily unavailable` SHALL show on the customer side. `backend calls` SHALL stay `5`.

#### Scenario: Service left alone
- **GIVEN** every frame from 820 to 949 and from 1020 to 1149
- **WHEN** the tokens are read
- **THEN** none is on `out-req` or `out-rep`, and `backend calls` reads `5` whenever it is drawn

#### Scenario: Fail-fast stream
- **GIVEN** frames 822, 844, 906, 912 and 950
- **WHEN** the tokens and counters are read
- **THEN** 822 has request 6 departing and `requests` `6`; 844 has its reply departing on `in-rep`; 906 has `requests` `20`; 912 has the ghost `60`'s pop starting beside `5`; 950 has no token on `in-rep`

#### Scenario: Cut line drawn
- **GIVEN** frames 830, 960, 1030 and 1300
- **WHEN** the `out-req`, `out-rep` and `in-rep` arrows are read
- **THEN** at 830 and 1030 `out-req` and `out-rep` are dashed at opacity 0.25 and `in-rep` is solid at 1; at 960 all three are solid, `out-req` and `out-rep` at 1 and `in-rep` at 0.25; at 1300 all three are solid at 1

#### Scenario: Customer message beside the error
- **GIVEN** frame 870
- **WHEN** the left side is read
- **THEN** the `left` tag reads `CIRCUIT-BREAKER:OPEN` and the customer message reads `payment temporarily` / `unavailable`, under Checkout

### Requirement: Topology resetTimeout clock
On each entry into OPEN (820 and 1020) the clock SHALL pop or refill full with the label `resetTimeout 10s` and empty linearly over 130 frames (empty at 949 and 1149). In HALF_OPEN the ring and its label SHALL stay at opacity 0.6, the ring empty. It SHALL leave at 1220.

#### Scenario: Clock frames
- **GIVEN** frames 820, 885, 949, 1000, 1020 and 1149
- **WHEN** the clock's `left` and opacity are read
- **THEN** `left` is 1, 64/129, 0, 0, 1 and 0, and the label reads `resetTimeout 10s`; opacity at 1000 is 0.6

#### Scenario: Clock gone in CLOSED
- **GIVEN** frames 1230 to 1919
- **WHEN** the clock is read
- **THEN** it is not drawn

### Requirement: Topology HALF_OPEN test calls
Each HALF_OPEN SHALL send exactly one test call from the breaker's right edge to Payment: at 966 it times out and the circuit SHALL be OPEN again at 1020; at 1166 it returns `200`, Payment's unit 0 SHALL recover (white) on its arrival at 1188, and the circuit SHALL be CLOSED at 1220. The customer side SHALL be dimmed and quiet.

#### Scenario: One test call each
- **GIVEN** every frame from 950 to 1019 and from 1150 to 1219
- **WHEN** the tokens are read
- **THEN** at most one token is drawn, only on `out-req` or `out-rep`, only during the test call's legs of design §4.2 (966–987 and 988–1009; 1166–1187 and 1188–1209), and no token is on `in-req` or `in-rep`

#### Scenario: Test fails, OPEN again
- **GIVEN** frames 988, 1019 and 1020
- **WHEN** the tag and pill are read
- **THEN** 988 pops `HTTP:TIMEOUT` on the right; 1019 is `HALF_OPEN`; 1020 swaps to `OPEN`

#### Scenario: Test succeeds, CLOSED
- **GIVEN** frames 1187, 1188, 1219 and 1220
- **WHEN** the light, tag and pill are read
- **THEN** 1187 has unit 0 red; 1188 has it white and the right tag's text `200` (its pop starting); 1219 is `HALF_OPEN`; 1220 swaps to `CLOSED`

### Requirement: Topology CLOSED ignores noise
At 1220 the window SHALL clear (the ✕ squares leave, the bar moves linearly to 0 over `motion.fade` frames). The next five calls SHALL give ✓, ✓, ✕ (`HTTP:TIMEOUT`), ✓, ✓, leaving the rate at 0.2 and the circuit CLOSED.

#### Scenario: Window cleared
- **GIVEN** frames 1219, 1230 and 1301
- **WHEN** the window is read
- **THEN** 1219 has five ✕ at opacity 0.3; 1230 and 1301 have five empty slots, rate 0 and opacity 1

#### Scenario: One timeout is noise
- **GIVEN** frames 1382, 1392 and 1489
- **WHEN** the window, bar and pill are read
- **THEN** 1382 has square 2's ✕ pop starting; 1392 has rate 0.2; 1489 has `✓ ✓ ✕ ✓ ✓`, rate 0.2 and `CLOSED`

#### Scenario: Timeout shows on the lines
- **GIVEN** frames 1360, 1399 and 1400
- **WHEN** `out-rep` and the `right` tag are read
- **THEN** 1360 is kind `failure` with the tag's text `HTTP:TIMEOUT` (its pop starting); 1399 is kind `failure` drawing `HTTP:TIMEOUT`; 1400 is kind `reply` with the tag's text `200` (its pop starting)

### Requirement: Topology business error not counted
The `400` of call c5 SHALL travel back as a `reply` arrow tagged `400` on both gaps; its result SHALL NOT enter the window: a dashed empty square pops beside the window at 1566, falls 40 units and is gone at 1586, while the window and bar stay unchanged.

#### Scenario: 400 drops off
- **GIVEN** frames 1565, 1567, 1581 and 1586 to 1599
- **WHEN** the window, bar and dropped square are read
- **THEN** the window is `✓ ✓ ✕ ✓ ✓` and the rate 0.2 at every one of them; the dropped square is drawn at 1567 at slot 5, lower and fading at 1581, and not drawn from 1586

#### Scenario: 400 tags
- **GIVEN** frames 1544 and 1566
- **WHEN** the tags are read
- **THEN** 1544 swaps the `right` tag to `400` and 1566 swaps the `left` tag to `400`

### Requirement: Topology sliding window
When a result arrives with the window full, the leftmost square SHALL move 60 units left and fade out over `motion.fade` frames, the others SHALL move one slot left over the same frames, and the new square pops in slot 4. Calls c6 to c8 SHALL slide the timeout out, ending with five ✓ and rate 0.

#### Scenario: Slides
- **GIVEN** frames 1686, 1726 and 1766
- **WHEN** the window is read
- **THEN** 1686 is `✓ ✕ ✓ ✓ ✓`; 1726 is `✕ ✓ ✓ ✓ ✓`; 1766 is five ✓ with rate 0

#### Scenario: Mid-slide
- **GIVEN** frame 1681
- **WHEN** the squares are read
- **THEN** the old leftmost square is 30 units left of slot 0 at opacity 0.5, the others are halfway between slots, and the new square's pop has started in slot 4

### Requirement: Topology final still
Every frame from the outro (1800) to the last (1919) SHALL be identical in scene state, and the last `motion.readingHold` frames identical as rendered PNGs: `CLOSED`, five ✓, an empty bar, `200` on both gaps, badge `2`, white lights, no token, counter or clock.

#### Scenario: Final hold identical
- **GIVEN** the scene states of frames 1800 to 1919
- **WHEN** each is compared with frame 1800
- **THEN** all are deep-equal

#### Scenario: Last movement before the hold
- **GIVEN** frames 1777, 1778 and 1800
- **WHEN** the tokens are read
- **THEN** 1777 draws c8's reply on `in-rep`, 1778 and 1800 draw no token

#### Scenario: Final PNGs identical (local)
- **GIVEN** the frames 1830 and 1919 rendered with `npx remotion still`
- **WHEN** their bytes are compared
- **THEN** they are equal

### Requirement: Topology layout and layers
The scene SHALL use the stage layout of the change's design §6.1 in 960x540 stage units drawn at 1920x1080, with the layer order of design §6.2: arrows under blocks, tokens over blocks, labels and tags over tokens.

#### Scenario: Layout equals the design
- **GIVEN** design §6.1 and §4.3 transcribed in the test
- **WHEN** they are compared with the scene's layout data
- **THEN** every position, size and route is equal

#### Scenario: Layer order
- **GIVEN** frames 870 and 1300
- **WHEN** the drawn layers are listed bottom to top
- **THEN** they follow design §6.2, and every token's `data-element` is above every block's and below every tag's

#### Scenario: Stills reviewed (local)
- **GIVEN** the stills and boundary frames of design §7 and their phone sheet viewed at 341 CSS px
- **WHEN** the owner and the implementer open each one
- **THEN** each shows what §4.2 lists at that frame, with no overlap or clipping; every word is readable, and the failing Payment units, red against ink arrows and dashed cut lines are told apart at 341 px

### Requirement: SDD relay registration
The catalogue SHALL register `sdd-request-relay` right after `publish-subscribe` and before `circuit-breaker-topology`: kind `takes`, neutral, format `16x9` only, 1080 frames at 30 fps, outro 980, sources `https://brunosouzas.com/blog/spec-driven-development-in-practice` (`en`) and `https://brunosouzas.com/pt/blog/spec-driven-development-in-practice` (`pt`), and the `text.en` table of scenario "Word table". `src/Root.tsx` SHALL map its composition to the scene's component.

#### Scenario: Registered entry
- **GIVEN** the catalogue
- **WHEN** `findScene("sdd-request-relay")` is read
- **THEN** it returns the entry above with `neutral` true, `languages` `["en"]`, `text.en` only and both sources, and `src/Root.tsx` registers `sdd-request-relay-16x9` with the scene's component

#### Scenario: Word table
- **GIVEN** the registered entry
- **WHEN** `text.en` is read
- **THEN** it equals `file` "proposal.md", `approval` "GO", `question` "?", `takes` ["1", "2"]

#### Scenario: One composition, before the topology scene
- **GIVEN** every registered scene
- **WHEN** the compositions are enumerated without React or font loading
- **THEN** `sdd-request-relay-16x9` (1920x1080, 30 fps, 1080 frames, folder `sdd-request-relay`) comes right after the eight compositions of `circuit-breaker-states` and `publish-subscribe`, unchanged and in order, and before `circuit-breaker-topology-16x9`, with `sdd-scene-2-files-16x9` and `sdd-scene-3-archive-16x9` between them, in that order; every id is unique

#### Scenario: Broken entry rejected
- **GIVEN** separate fixtures of the entry with a `text.pt` table, with `sources.pt` starting `http://`, or with its outro at 991
- **WHEN** the catalogue is checked
- **THEN** each fails naming `sdd-request-relay` and the problem (Portuguese table, `pt` source, outro inside the reading hold)

### Requirement: Existing scenes unchanged by the relay scene
Adding the relay scene SHALL leave every other registered scene unchanged: data, compositions, frame behaviour, tests and stills, except the assertions that list every registered scene (in `test/scenes/catalogue-flow.test.ts` and `test/scripts/cli.test.ts`). Moving `withSansFamily` SHALL NOT change any pixel of the circuit-breaker topology scene.

#### Scenario: Other scenes' tests untouched
- **GIVEN** the branch after this change and `main` before it
- **WHEN** `npm test` runs
- **THEN** the test files of `circuit-breaker-states`, `publish-subscribe` and `circuit-breaker-topology` pass with no edit, and `git diff` shows no change under `src/scenes/circuit-breaker-states/` or `src/scenes/publish-subscribe/`

#### Scenario: Stills byte-identical (local)
- **GIVEN** the stills of `circuit-breaker-states`, `publish-subscribe` and `circuit-breaker-topology`, rendered on `main` and on the branch
- **WHEN** their SHA-256 are compared
- **THEN** every pair is equal

### Requirement: SDD relay cast
The scene SHALL draw, left to right on one ground line (stage y 476) at one scale (0.95), Balão at x 104 facing right (its tail toward Chaves), Chaves at x 505, and Visor at x 852 facing left, from the cast pieces `balao`, `chaves` and `visor`, never recoloured. Expressions change only the face and the body pose; at most one emote SHALL be on screen, beside its character's head.

#### Scenario: Cast in place at every frame
- **GIVEN** frames 0 to 1079
- **WHEN** the cast pieces' parameters are read
- **THEN** each drawn cast piece has `scale` 0.95 and ground y 476 (a pop-in scales it through `pose` about that point), Balão x 104 facing right, Chaves x 505, Visor x 852 facing left, and none has a fill or colour parameter

#### Scenario: Emotes beside the head
- **GIVEN** frames 347 and 1000
- **WHEN** the emote is read
- **THEN** at 347 it is `problem` at (214.2, 286) at scale 0.8 and at 1000 `worked` at (800, 292) at scale 0.75, and no other emote is drawn at either frame

### Requirement: SDD relay cast timing
The `takes` kind SHALL accept `balao` and `chaves` as actors, with the same cast checks as the pillar cast. The scene's acts SHALL NOT overlap, every emote SHALL enter on its actor's expression change, and the `problem` emote SHALL be gone before Visor's face turns `failed`.

#### Scenario: Takes checks pass
- **GIVEN** the registered scene
- **WHEN** `checkTimeline` and the `takes` checks run
- **THEN** no problem is reported

#### Scenario: Overlapping acts of the supporting cast
- **GIVEN** a fixture of the scene's timeline with a `chaves` act 752–760 added during Balão's act 752–836
- **WHEN** the `takes` checks run
- **THEN** they fail naming the scene, the `balao` act and the `chaves` act

#### Scenario: Fright before the agent's failure
- **GIVEN** the scene's timeline
- **WHEN** its faces and emotes are read
- **THEN** Balão turns `failed` at 316 with the `problem` emote, the emote leaves at 350 (gone at 360), and Visor turns `failed` at 366

### Requirement: SDD relay beats and timing
The scene's timeline SHALL equal the change's design §4: the thirteen phases with their takes, frames and cited lines; every act, face, emote, trip, pop-in, fade, leave and cue; the rewind's object frames; the outro. Every trip SHALL end `motion.travel` frames after it starts, and every fade SHALL last `motion.fade` frames.

#### Scenario: Timeline equals the beat table
- **GIVEN** design §4 transcribed in the test, `motion.travel` 22 and `motion.fade` 10
- **WHEN** it is compared with the scene's timeline
- **THEN** every value is equal, including phases `setup` 0–49, `t1-request` 50–129, `t1-relay` 130–219, `t1-code` 220–299, `t1-error` 300–389, `rewind` 390–449, `t2-request` 450–529, `t2-relay` 530–619, `t2-list` 620–699, `t2-carry` 700–749, `t2-answer` 750–849, `t2-return` 850–889 and `t2-implement` 890–979

#### Scenario: Travel token changed
- **GIVEN** the timeline built with `motion.travel` 20
- **WHEN** it is compared with the beat table
- **THEN** the comparison fails naming the first trip whose arrival differs

#### Scenario: Seeking in any order
- **GIVEN** every frame from 0 to 1079
- **WHEN** the state is evaluated forward, backward and in a shuffled order
- **THEN** each frame gives the same state every time

### Requirement: SDD relay take 1 relay
In each take, Balão SHALL speak to Chaves while six `?` travel from its tail to a row above Chaves's head; Chaves SHALL then turn to the laptop and type, the request line SHALL appear on the screen, and the `?` SHALL travel into a row inside the screen. Take 2 SHALL repeat these frames 400 frames later.

#### Scenario: Request and relay frames
- **GIVEN** frames 55, 56, 82, 113, 135, 136, 142, 199 and 210
- **WHEN** the state is evaluated
- **THEN** at 55 Balão does not speak and no `?` is drawn; from 56 Balão speaks; at 82 `?` 5 has arrived above Chaves; at 113 all six wait above Chaves, who faces left; at 136 Chaves faces right and types; from 142 the screen shows the request line; at 199 all six wait in the screen; at 210 Chaves no longer types

#### Scenario: Take 2 repeats the relay
- **GIVEN** every frame f from 50 to 225
- **WHEN** the stage of f and of f + 400 are compared without the badge and the rewind mark
- **THEN** they are equal

### Requirement: SDD relay take 1 code alone
In take 1 Visor SHALL write the code alone: it points at the screen, six code lines appear, each `?` sinks into the code as its line appears, and Visor's face turns `done`. No `proposal.md` SHALL be drawn in take 1 or the rewind.

#### Scenario: The questions sink into the code
- **GIVEN** frames 225, 226, 232, 242, 272, 282 and 286
- **WHEN** the state is evaluated
- **THEN** Visor points from 226; the screen shows code line 1 from 232 and six code lines from 272; `?` 0 is drawn sinking at 232 and gone from 242; no `?` is drawn from 282; Visor's face is `done` from 286

#### Scenario: No sheet before take 2
- **GIVEN** every frame from 0 to 625
- **WHEN** the stage is read
- **THEN** no `proposal.md` and no `GO` is drawn

### Requirement: SDD relay error and fright
The first error SHALL come back from the code to Balão as a `failure` arrow; Balão SHALL then turn `failed` with the `problem` emote and a fright pose (tilt and squash); after the emote is gone Visor SHALL turn `failed`. These are reading devices approved at gate 0 (q79 A, q81 A).

#### Scenario: Error frames
- **GIVEN** frames 299, 305, 316, 330, 360 and 366
- **WHEN** the state is evaluated
- **THEN** no failure arrow is drawn at 299; it fades in from 300 to 310; Balão is `failed`, tilted -5 degrees and squashed from 316; the `problem` emote is drawn at 330 and gone at 360; Visor is `failed` from 366

### Requirement: SDD relay rewind
From 390 to 439 the whole stage except the badge and the rewind mark SHALL be drawn from an object frame playing take 1 backwards from 389 to 49, the cast included, with no emote; from 440 to 449 it SHALL hold object frame 49. The rewind mark SHALL pop at 390 and leave at 450; the badge SHALL read `1` until 439 and `2` from 440.

#### Scenario: Object frames
- **GIVEN** frames 389, 390, 414, 439 and 445
- **WHEN** the object frame is read
- **THEN** it is 389, 389, 222, 49 and 49

#### Scenario: Same stage before each take
- **GIVEN** frames 49, 449 and 450
- **WHEN** their stages are compared without the badge and the rewind mark
- **THEN** they are equal

#### Scenario: Cast replayed backwards
- **GIVEN** the scene's timeline
- **WHEN** its acts and faces inside the rewind are read
- **THEN** Visor turns `done` at 394, Balão `idle` at 401, Visor `idle` at 405; the acts are Visor 414, Chaves 416–427, Balão 430 and Balão 439; no emote enters between 390 and 449

### Requirement: SDD relay open questions listed
In take 2 Visor SHALL point and `proposal.md` SHALL appear above the screen with no rows; each `?` SHALL travel from the screen into the sheet and become its question row on arrival. No code line SHALL be drawn in take 2 before 902.

#### Scenario: Rows from the questions
- **GIVEN** frames 625, 626, 627, 636, 658, 698 and 702
- **WHEN** the state is evaluated
- **THEN** no sheet is drawn at 625 or 626; Visor points from 626, when the sheet's pop-in starts; from 627 the sheet is drawn above the screen with no rows; `?` 0 departs at 636 and row 1 is drawn from 658; six rows from 698; at 702 Visor no longer points and its face is `waiting`

#### Scenario: No code before the approval
- **GIVEN** every frame from 450 to 901
- **WHEN** the screen is read
- **THEN** it shows the request line only (from 542) and no code line

### Requirement: SDD relay carry and answer
Chaves SHALL turn to Balão and take the sheet into his hand; Balão SHALL then answer the six `?`, one check per row, and stamp `GO`, which stays on the sheet. Only Balão's answers and stamp SHALL change the sheet while Chaves holds it.

#### Scenario: Carry frames
- **GIVEN** frames 711, 712, 723 and 734
- **WHEN** the state is evaluated
- **THEN** at 711 the sheet is above the screen; at 712 Chaves faces left and the sheet starts its trip; at 723 it is halfway; from 734 Chaves holds it, with the `proposal.md` label at its top edge

#### Scenario: Answer and stamp frames
- **GIVEN** frames 751, 752, 760, 800, 806, 816, 835, 836 and 837
- **WHEN** the state is evaluated
- **THEN** Balão speaks from 752 to 805; row 1 is checked from 760 and all six from 800; Balão holds the stamp from 816 to 835; at 836 Balão no longer holds it, its face is `done` and the `GO` mark's pop-in starts; from 837 the mark is drawn on the sheet

### Requirement: SDD relay implementation and final still
Chaves SHALL bring the approved sheet back above the screen and face the laptop; Visor SHALL then implement: it points, six code lines appear, and its face turns `done` with the `worked` emote. From the outro on, nothing SHALL change.

#### Scenario: Return and implementation frames
- **GIVEN** frames 851, 852, 874, 896, 902, 942 and 950
- **WHEN** the state is evaluated
- **THEN** Chaves holds the sheet at 851; from 852 the sheet travels back and is above the screen from 874, with six checks and `GO`, when Chaves faces right; Visor points from 896; code line 1 from 902, six lines from 942; Visor `done` with the `worked` emote from 950

#### Scenario: Final hold identical
- **GIVEN** frames 980 to 1079
- **WHEN** the stage and component state of each are compared
- **THEN** they are deep-equal

### Requirement: SDD relay words on screen
At every frame, every string the scene draws SHALL be a value of its `text.en` table. Across the composition every value SHALL appear. A string counts as drawn when its element has opacity above 0 and scale above 0.001. The scene SHALL have no caption.

#### Scenario: Words over the whole composition
- **GIVEN** the stage trees of frames 0 to 1079
- **WHEN** every drawn string is collected
- **THEN** each one is `proposal.md`, `GO`, `?`, `1` or `2`, and all five appear

#### Scenario: Unlisted word rejected
- **GIVEN** a fixture whose stage draws the literal `spec` in the sheet's label at frame 700
- **WHEN** the words test runs
- **THEN** it fails naming `spec` and frame 700

### Requirement: SDD relay text size
Every word the scene draws SHALL have an effective font size, its `font-size` times every scale applied once its pop-in has settled, of at least 33 stage units (11.7 px in the site's 341 px column), and the take numbers at least 36. The `?` mark is a symbol, exempt; so is the `GO` on Balão's held stamp during Balão's act.

#### Scenario: Every settled word at its minimum
- **GIVEN** every frame from 0 to 1079
- **WHEN** each drawn string whose pop-in has settled is measured
- **THEN** `proposal.md` and the `GO` mark are at least 33 and `1` and `2` at least 36; a `GO` below 33 is drawn only inside Balão's act 752–836

#### Scenario: Too small rejected
- **GIVEN** a fixture whose label is drawn at 32 and one whose badge is drawn at 35
- **WHEN** the size test runs
- **THEN** each fails naming the string, its size and the first frame it is drawn

### Requirement: SDD relay text placement
Every drawn word box (measured advance on the `fonts/` faces times effective size), the label pill, the `GO` mark and the badge SHALL lie inside the stage less 12 units and SHALL NOT intersect each other, the rewind mark or a cast body box of design §6.2. Moving and settling frames of design §6.3 are exempt.

#### Scenario: Placement at every checked frame
- **GIVEN** every frame from 0 to 1079 except the exempt frames
- **WHEN** the boxes are computed
- **THEN** each lies within x 12–948 and y 12–528, and none intersects another, the rewind mark or a cast body box

#### Scenario: Collision rejected
- **GIVEN** a fixture drawing the take badge at (665, 40)
- **WHEN** the placement test runs
- **THEN** it fails naming the badge, the label pill and frame 656, the first frame both are drawn and settled

### Requirement: SDD relay built from package pieces
The scene SHALL draw only through the pieces `balao`, `chaves`, `visor`, `emote`, `keyboard`, `codePanel`, `questionToken`, `sheet`, `diagramBox`, `stamp`, `messageArrow`, `countBadge` and `uiIcon`, `pose`, and the components `Rings` and `MotionPath`. Its files SHALL contain no colour literal and create no SVG shape of their own.

#### Scenario: No shape of its own
- **GIVEN** the files under `src/scenes/sdd-request-relay/`
- **WHEN** a test reads them
- **THEN** none calls `el(` with `path`, `rect`, `circle`, `ellipse`, `line`, `polygon` or `polyline`, and none contains a JSX element of those tags

#### Scenario: No colour literal
- **WHEN** the colour-literal test scans `src/scenes/` and `src/brand/`
- **THEN** it reports nothing for the new files

### Requirement: Sequence scene kind
A scene of kind `sequence` SHALL be neutral and run its phases once, in order: no phase has a `take` and the timeline has no `rewind`. Every phase SHALL cite at least one line of its English source as a positive integer, and its outro SHALL be at most `duration` minus `motion.readingHold`, with no phase start and no event at or after it. The catalogue SHALL reject a scene that breaks one of these, naming the scene and the item.

#### Scenario: Valid sequence
- **GIVEN** the registered scene `sdd-scene-2-files`
- **WHEN** `checkTimeline` and `checkSequence` run on it
- **THEN** neither reports a problem

#### Scenario: Sequence phase without an article line
- **GIVEN** separate fixtures of that scene where phase `init` cites `[]`, `[0]` or `[26.5]`
- **WHEN** each timeline is checked
- **THEN** each fails naming the scene and phase `init`

#### Scenario: Localised sequence scene
- **GIVEN** a fixture of that scene that is not neutral
- **WHEN** its timeline is checked
- **THEN** it fails naming the scene and saying a `sequence` scene is neutral

#### Scenario: Sequence with a take or a rewind rejected
- **GIVEN** separate fixtures of that scene where phase `review-1` has `take: 1`, and where the timeline has a `rewind`
- **WHEN** each timeline is checked
- **THEN** the first fails naming the scene and phase `review-1` ("has a take"), the second naming the scene and saying a `sequence` scene has no rewind

#### Scenario: Sequence outro inside the reading hold
- **GIVEN** a fixture of that scene with its outro at 781
- **WHEN** its timeline is checked
- **THEN** it fails naming the scene and saying the outro at frame 781 is inside the reading hold (at most 780)

### Requirement: Sequence cast and hold
A `sequence` scene SHALL pass the `takes` kind's cast rules (acts of different actors never overlap; an emote enters on its actor's expression change, alone, and is gone before any later act) and reading-hold rules (no act, face, trip, fade, leave or cue at or after the outro; pop-ins and emotes settled by it), with the same messages. A `takes` scene SHALL get exactly the problems it got before.

#### Scenario: Overlapping acts in a sequence
- **GIVEN** a fixture of `sdd-scene-2-files` with a `chaves` act 610–612 added during Balão's act 606–626
- **WHEN** its timeline is checked
- **THEN** it fails naming the scene, the `balao` act [606, 626] and the `chaves` act [610, 612]

#### Scenario: Cue in the reading hold
- **GIVEN** a fixture of that scene with a `codeLines` cue at 770
- **WHEN** its timeline is checked
- **THEN** it fails naming the scene, the cue and frame 770 (at or after the outro, frame 770)

#### Scenario: Takes scenes unchanged
- **GIVEN** the `takes-fixture`, `sdd-request-relay` and `circuit-breaker-topology`
- **WHEN** the `takes` tests run, unedited except the registration assertions design §2.6 lists, and the catalogue checks run
- **THEN** they pass, and `checkTakes` on each registered `takes` scene returns no problem

### Requirement: SDD files registration
The catalogue SHALL register `sdd-scene-2-files` right after `sdd-request-relay` and before `circuit-breaker-topology`: kind `sequence`, neutral, format `16x9` only, 870 frames at 30 fps, outro 770, sources `https://brunosouzas.com/blog/spec-driven-development-in-practice` (`en`) and `https://brunosouzas.com/pt/blog/spec-driven-development-in-practice` (`pt`), and the `text.en` table of scenario "Files word table". `src/Root.tsx` SHALL map its composition to the scene's component.

#### Scenario: Files registered entry
- **GIVEN** the catalogue
- **WHEN** `findScene("sdd-scene-2-files")` is read
- **THEN** it returns the entry above with `neutral` true, `languages` `["en"]`, `text.en` only and both sources, and `src/Root.tsx` registers `sdd-scene-2-files-16x9` with the scene's component

#### Scenario: Files word table
- **GIVEN** the registered entry
- **WHEN** `text.en` is read
- **THEN** it equals `folder` "openspec/", `files` {`proposal` "proposal.md", `design` "design.md", `tasks` "tasks.md", `spec` "spec.md"}, `verdicts` {`rejected` "NO-GO", `approved` "GO"}, `question` "?"

#### Scenario: One composition, after the relay scene
- **GIVEN** every registered scene
- **WHEN** the compositions are enumerated without React or font loading
- **THEN** `sdd-scene-2-files-16x9` (1920x1080, 30 fps, 870 frames, folder `sdd-scene-2-files`) comes right after `sdd-request-relay-16x9` and right before `circuit-breaker-topology-16x9`, the compositions before it are unchanged and in order, and every id is unique

#### Scenario: Files broken entry rejected
- **GIVEN** separate fixtures of the entry with a `text.pt` table, with `sources.pt` starting `http://`, or with its outro at 781
- **WHEN** the catalogue is checked
- **THEN** each fails naming `sdd-scene-2-files` and the problem (Portuguese table, `pt` source, outro inside the reading hold)

### Requirement: Existing scenes unchanged by the files scene
Adding the files scene SHALL leave every other scene unchanged: data, compositions, frame behaviour and stills. Their tests SHALL pass, edited only in the assertions that list the registered scenes or name the composition after `sdd-request-relay-16x9` (`test/scenes/catalogue-flow.test.ts`, `test/scripts/cli.test.ts`, `test/scenes/sdd-request-relay-catalogue.test.ts`).

#### Scenario: Other scenes' code untouched
- **GIVEN** the branch after this change and `main` before it
- **WHEN** `npm test` runs and `git diff` is read
- **THEN** every test passes, and `git diff` shows no change under `src/scenes/circuit-breaker-states/`, `src/scenes/publish-subscribe/`, `src/scenes/sdd-request-relay/` or `src/scenes/circuit-breaker-topology/`

#### Scenario: Other scenes' stills byte-identical (local)
- **GIVEN** the stills of `circuit-breaker-states`, `publish-subscribe`, `sdd-request-relay` and `circuit-breaker-topology`, rendered on `main` and on the branch
- **WHEN** their SHA-256 are compared
- **THEN** every pair is equal

### Requirement: SDD files cast
The scene SHALL draw, left to right on one ground line (stage y 476) at one scale (0.95), Balão at x 104 facing right, Chaves at x 505 facing right (toward the laptop) and Visor at x 852 facing left, from the pieces `balao`, `chaves` and `visor`, never recoloured. Expressions change only the face and the body pose; at most one emote SHALL be on screen, beside its character's head.

#### Scenario: Files cast in place at every frame
- **GIVEN** frames 0 to 869
- **WHEN** the cast pieces' parameters are read
- **THEN** each drawn cast piece has `scale` 0.95 and ground y 476 (a pop-in scales it through `pose` about that point), Balão x 104 facing right, Chaves x 505 facing right, Visor x 852 facing left with `points` set, and none has a fill or colour parameter; every change of a cast action falls inside a declared act of its actor and every face change on a `faces` entry (CAST-4)

#### Scenario: Files emote beside the head
- **GIVEN** frames 735, 736 and 800
- **WHEN** the emote is read
- **THEN** none is drawn at 735; at 736 and 800 the only emote is `worked` at (800, 292), at scale 0.75 at 800

### Requirement: SDD files beats and timing
The scene's timeline SHALL equal the change's design §4: the eleven phases with their frames, cited lines and devices; every act, face, emote, trip, pop-in, fade, leave, cue and row change; the outro. Every trip SHALL end `motion.travel` frames after it starts, and every fade SHALL last `motion.fade` frames.

#### Scenario: Files timeline equals the beat table
- **GIVEN** design §4 transcribed in the test, `motion.travel` 22 and `motion.fade` 10
- **WHEN** it is compared with the scene's timeline
- **THEN** every value is equal, including phases `setup` 0–39, `init` 40–89, `propose` 90–149, `list` 150–209, `answer` 210–279, `review-1` 280–409, `fix-1` 410–459, `review-2` 460–559, `fix-2` 560–599, `approve` 600–669 and `apply` 670–769

#### Scenario: Files travel token changed- **GIVEN** the timeline built with `motion.travel` 20
- **WHEN** it is compared with the beat table
- **THEN** the comparison fails naming the first trip whose arrival differs

#### Scenario: Files seeking in any order
- **GIVEN** every frame from 0 to 869
- **WHEN** the state is evaluated forward, backward and in a shuffled order
- **THEN** each frame gives the same state every time

### Requirement: SDD files init and propose
Chaves SHALL type while a command line appears on the screen and the `openspec/` folder pops above the stage; then Visor SHALL point while `proposal.md`, `design.md`, `tasks.md` and `spec.md` travel out of the folder to their slots, growing to full size, and the folder SHALL leave once the four have arrived.

#### Scenario: Init and propose frames
- **GIVEN** frames 39, 40, 46, 53, 84, 90, 96, 107, 118, 136, 140 and 150, and every frame of a file's flight
- **WHEN** the state is evaluated
- **THEN** at 39 no folder is drawn and Chaves does not type; Chaves types from 40 to 83; the command line is drawn from 46; the folder from 53; Visor points from 90; at 96 `proposal.md` is at the folder's centre (480, 139.1) at scale 0.4; at 107 it is halfway along its route at 0.7; from 118 it is at its slot at scale 1; from 136 all four are; the folder is leaving from 140 and gone at 150; a file's name pill in flight stays inside x 12–948 and y 12–528

#### Scenario: No file before propose
- **GIVEN** every frame from 0 to 95
- **WHEN** the stage is read
- **THEN** no file and no file name is drawn

### Requirement: SDD files questions and answers
`proposal.md` SHALL arrive with no row and then gain six `?` rows, one at a time, and Visor SHALL stop pointing and wait; then Balão SHALL speak while each row gets its check.

#### Scenario: Questions and answers frames
- **GIVEN** frames 118, 153, 154, 194, 202, 210, 218, 258 and 266
- **WHEN** the state is evaluated
- **THEN** `proposal.md` has no row from 118 to 153, one `?` row from 154 and six from 194; at 202 Visor does not point and is `waiting`; Balão speaks from 210 to 265; row 1 is answered (a `?` and a check) from 218 and all six from 258

#### Scenario: No finding before the review
- **GIVEN** every frame from 0 to 289
- **WHEN** the files' rows are read
- **THEN** no row of `design.md`, `tasks.md` or `spec.md` is flagged or checked, and no file jolts

### Requirement: SDD files review round 1
With no actor on stage, the review SHALL flag `spec.md` rows 1, 2 and 3 and `tasks.md` row 3, one at a time, each with a `?` on the row and a 12-frame jolt of its file; then a `NO-GO` stamp in `color.state.failure` SHALL pop on the change at (512, 194).

#### Scenario: Review 1 frames
- **GIVEN** frames 289, 290, 291, 302, 344, 356, 364, 365, 394 and 409
- **WHEN** the state is evaluated
- **THEN** no row is flagged at 289; `spec.md` row 1 is flagged from 290; `spec.md` jolts at 291 (angle not 0) and not at 302 (row 1's jolt is over); at 356 exactly `spec.md` rows 1–3 and `tasks.md` row 3 are flagged and no file jolts; no stamp is drawn at 364; `NO-GO` is drawn from 365, settled at scale 1.25 from 394 to 409

#### Scenario: No actor in the reviews
- **GIVEN** the scene's timeline
- **WHEN** its acts and faces between 280 and 599 are read
- **THEN** there is none

### Requirement: SDD files fix and review round 2
The first `NO-GO` SHALL leave and the four flagged rows SHALL get their check; the review SHALL then flag `spec.md` rows 4 and 5, rows the first review did not flag, each with a jolt; a second `NO-GO` SHALL pop at the same place, leave, and the two rows SHALL get their check.

#### Scenario: Fix and review 2 frames
- **GIVEN** frames 410, 420, 428, 446, 470, 494, 515, 560, 570 and 584
- **WHEN** the state is evaluated
- **THEN** `NO-GO` 1 is leaving at 410 and gone at 420; `spec.md` row 1 is checked from 428; the four rows are checked at 446; `spec.md` row 4 is flagged from 470 and row 5 from 494; `NO-GO` 2 is drawn from 515, leaving from 560 and gone at 570; at 584 every row of `spec.md` and `tasks.md` row 3 are checked, and no row is flagged twice in the scene

#### Scenario: One NO-GO at a time
- **GIVEN** every frame from 0 to 869
- **WHEN** the stamps are read
- **THEN** at most one `NO-GO` is drawn, and none from 0 to 364, from 420 to 514 or from 570 to 869

### Requirement: SDD files approval
After the second fix, Balão SHALL hold up its `GO` stamp; the stamp SHALL then leave its hand and travel to the change, growing about its centre from scale 0.95 to 1.6, land at (512, 194) and stay; Balão's face SHALL turn `done` as it lets go.

#### Scenario: Approval frames
- **GIVEN** frames 605, 606, 625, 626, 637 and 648
- **WHEN** the state is evaluated
- **THEN** at 605 Balão holds nothing; it holds the stamp with `GO` from 606 to 625; at 626 it holds nothing, its face is `done`, and the `GO` stamp is at (229.4, 409.5) at scale 0.95; at 637 it is halfway along its route; from 648 it is at (512, 194) at scale 1.6, drawn to 869

#### Scenario: No GO before the owner
- **GIVEN** every frame from 0 to 605
- **WHEN** the stage's words are read
- **THEN** `GO` is not drawn

### Requirement: SDD files apply and final still
Visor SHALL point at the screen and six code lines SHALL appear after the command line; Visor's face SHALL then turn `done` with the `worked` emote. No code line SHALL be drawn before 682. From the outro on, nothing SHALL change.

#### Scenario: Apply frames
- **GIVEN** frames 675, 676, 682, 722 and 736
- **WHEN** the state is evaluated
- **THEN** Visor does not point at 675 and points from 676; the screen shows code line 1 from 682 and six from 722; Visor is `done` with the `worked` emote from 736

#### Scenario: No code before the approval
- **GIVEN** every frame from 0 to 681
- **WHEN** the screen is read
- **THEN** it shows no code line (only the command line, from 46)

#### Scenario: Files final hold identical
- **GIVEN** frames 770 to 869
- **WHEN** the stage and component state of each are compared
- **THEN** they are deep-equal

### Requirement: SDD files words on screen
At every frame, every string the scene draws SHALL be a value of its `text.en` table, and across the composition every value SHALL appear. A string counts as drawn when its element has opacity above 0 and scale above 0.001. The scene SHALL have no caption.

#### Scenario: Files words over the whole composition
- **GIVEN** the stage trees of frames 0 to 869
- **WHEN** every drawn string is collected
- **THEN** each one is `openspec/`, `proposal.md`, `design.md`, `tasks.md`, `spec.md`, `NO-GO`, `GO` or `?`, and all eight appear

#### Scenario: Files words in the loaded face
- **GIVEN** the stage layers of frames 85, 400 and 869
- **WHEN** each passes through `withSansFamily`
- **THEN** each layer that holds words held the `font.sans` stack before and holds none after

#### Scenario: Files unlisted word rejected
- **GIVEN** a fixture whose stage draws the literal `spec` in `spec.md`'s label at frame 700
- **WHEN** the words test runs
- **THEN** it fails naming `spec` and frame 700

### Requirement: SDD files text size
Every word the scene draws SHALL have an effective font size, its `font-size` times every scale applied once its pop-in has settled, of at least 33 stage units (11.7 px in the site's 341 px column). Exempt: the `?` mark (a symbol), a file's name in flight, and `GO` in Balão's hand (606–625) or in flight (626–647).

#### Scenario: Every settled files word at its minimum
- **GIVEN** every frame from 0 to 869
- **WHEN** each drawn string whose pop-in has settled is measured
- **THEN** the folder name and the file names are at least 33, `NO-GO` at least 33 and the landed `GO` at least 33; a smaller `GO` is drawn only from 606 to 647

#### Scenario: Files word too small rejected
- **GIVEN** a fixture whose file names are drawn at 32 and one whose `NO-GO` group is scaled 1.2 (32.4)
- **WHEN** the size test runs
- **THEN** each fails naming the string, its size and the first frame it is checked (settled and not in flight)

### Requirement: SDD files text placement
The folder and file name pills, the stamps' discs and every drawn word box but the `?` (advance on the `fonts/` faces times effective size) SHALL lie inside the stage less 12 units and SHALL NOT intersect each other, a word not counting against its own element, or a cast body box; no stamp's circle SHALL meet a flagged row's `?` circle. Moving and settling frames of design §6.3 are exempt, but a file's name in flight stays inside.

#### Scenario: Files placement at every checked frame
- **GIVEN** every frame from 0 to 869 except the exempt frames
- **WHEN** the boxes are computed
- **THEN** each lies within x 12–948 and y 12–528, none intersects another or a cast body box, and no stamp's circle meets a flagged row's `?` circle (centre distance at most the sum of the radii with half their outlines)

#### Scenario: Files collision rejected
- **GIVEN** a fixture drawing the `NO-GO` stamps with their centre at (512, 120)
- **WHEN** the placement test runs
- **THEN** it fails naming `no-go-1`, a file name pill and frame 394, the first frame the stamp is drawn and settled

### Requirement: SDD files built from package pieces
The scene SHALL draw only through the pieces `balao`, `chaves`, `visor`, `emote`, `keyboard`, `codePanel`, `folder`, `sheet`, `diagramBox` and `stamp`, `pose`, and the components `Rings` and `MotionPath`. Its files SHALL contain no colour literal and create no SVG shape of their own.

#### Scenario: Files scene has no shape of its own
- **GIVEN** the files under `src/scenes/sdd-scene-2-files/`
- **WHEN** a test reads them
- **THEN** none calls `el(` with `path`, `rect`, `circle`, `ellipse`, `line`, `polygon` or `polyline`, none contains a JSX element of those tags, and the pieces imported are those above

#### Scenario: Files scene has no colour literal
- **WHEN** the colour-literal test scans `src/scenes/` and `src/brand/`
- **THEN** it reports nothing for the new files

### Requirement: SDD archive registration
The catalogue SHALL register `sdd-scene-3-archive` right after `sdd-scene-2-files` and before `circuit-breaker-topology`: kind `sequence`, neutral, format `16x9` only, 600 frames at 30 fps, outro 500. `src/Root.tsx` SHALL map its composition to the scene's component.

#### Scenario: Archive registered entry
- **GIVEN** the catalogue
- **WHEN** `findScene("sdd-scene-3-archive")` is read
- **THEN** it returns the entry above with `neutral` true, `languages` `["en"]`, `text.en` only and both sources, and `src/Root.tsx` registers `sdd-scene-3-archive-16x9` with the scene's component

#### Scenario: Archive word table
- **GIVEN** the registered entry
- **WHEN** `text.en` is read
- **THEN** it equals `fieldCount` {`was` "exactly two fields", `now` "exactly three fields"}, `verdict` "GO", `question` "?"

#### Scenario: One composition, after the files scene
- **GIVEN** every registered scene
- **WHEN** the compositions are enumerated without React or font loading
- **THEN** `sdd-scene-3-archive-16x9` (1920x1080, 30 fps, 600 frames, folder `sdd-scene-3-archive`) comes right after `sdd-scene-2-files-16x9` and right before `circuit-breaker-topology-16x9`, the compositions before it are unchanged and in order, and every id is unique

#### Scenario: Archive broken entry rejected
- **GIVEN** separate fixtures of the entry with a `text.pt` table, with `sources.pt` starting `http://`, or with its outro at 511
- **WHEN** the catalogue is checked
- **THEN** each fails naming `sdd-scene-3-archive` and the problem (Portuguese table, `pt` source, outro inside the reading hold — the limit is `duration` 600 minus `motion.readingHold` 90 = 510)

### Requirement: Existing scenes unchanged by the archive scene
Adding the archive scene SHALL leave every other registered scene unchanged: data, compositions, frame behaviour, tests and stills, except the assertions that list every registered scene (`test/scenes/catalogue-flow.test.ts`, `test/scenes/sdd-request-relay-catalogue.test.ts`, `test/scripts/cli.test.ts`), which this change edits to the six-scene order above.

#### Scenario: Other scenes' tests untouched
- **GIVEN** the branch after this change and `origin/main` before it
- **WHEN** `npm test` runs
- **THEN** the test files of `circuit-breaker-states`, `publish-subscribe`, `sdd-request-relay`, `sdd-scene-2-files` and `circuit-breaker-topology` pass with no edit beyond the registration assertions named above, and `git diff` shows no change under `src/scenes/circuit-breaker-states/`, `src/scenes/publish-subscribe/`, `src/scenes/sdd-request-relay/`, `src/scenes/sdd-scene-2-files/` or `src/scenes/circuit-breaker-topology/`

#### Scenario: Stills byte-identical (local)
- **GIVEN** the stills of `circuit-breaker-states`, `publish-subscribe`, `sdd-request-relay`, `sdd-scene-2-files` and `circuit-breaker-topology`, rendered on `origin/main` and on the branch
- **WHEN** their SHA-256 are compared
- **THEN** every pair is equal

### Requirement: SDD archive cast
The scene SHALL draw, left to right on one ground line (stage y 476) at one scale (0.95), Balão at x 104 facing right, Chaves at x 505 facing right and Visor at x 852 facing left, from the pieces `balao`, `chaves` and `visor`, never recoloured. Chaves SHALL carry no action parameter in this scene.

#### Scenario: Archive cast in place at every frame
- **GIVEN** frames 0 to 599
- **WHEN** the cast pieces' parameters are read
- **THEN** each drawn cast piece has `scale` 0.95 and ground y 476, Balão x 104 facing right, Chaves x 505 facing right with no action set, Visor x 852 facing left; `points` is set only inside Visor's act 184–246; and none has a fill or colour parameter; every change of a cast action falls inside a declared act of its actor and every face change on a `faces` entry (CAST-4)

#### Scenario: Archive emote beside the head
- **GIVEN** frames 403, 404 and 550
- **WHEN** the emote is read
- **THEN** none is drawn at 403; at 404 and 550 the only emote is `worked` at (800, 292), at scale 0.75

### Requirement: SDD archive beats and timing
The scene's timeline SHALL equal the change's design §4: the nine phases with their frames, cited lines and devices; every act, face, emote, trip, pop-in, fade, leave, jolt and cue; the outro. Every trip SHALL end `motion.travel` frames after it starts, and every fade SHALL last `motion.fade` frames.

#### Scenario: Archive timeline equals the beat table
- **GIVEN** design §4 transcribed in the test, `motion.travel` 22 and `motion.fade` 10
- **WHEN** it is compared with the scene's timeline
- **THEN** every value is equal, including phases `setup` 0-39, `archive-1` 40-119, `request` 120-179, `propose` 180-259, `review` 260-339, `approve` 340-399, `apply` 400-419, `archive-2` 420-469 and `ending` 470-499

#### Scenario: Archive travel token changed- **GIVEN** the timeline built with `motion.travel` 20
- **WHEN** it is compared with the beat table
- **THEN** the comparison fails naming the first trip whose arrival differs

#### Scenario: Archive seeking in any order
- **GIVEN** every frame from 0 to 599
- **WHEN** the state is evaluated forward, backward and in a shuffled order
- **THEN** each frame gives the same state every time

### Requirement: SDD archive mechanics (first archive)
With no cast member acting, the first change's folder SHALL travel from its stage centre to a parked position and stay there; the `book` SHALL already be on stage and gain a field-count pill reading "exactly two fields" once the folder has parked.

#### Scenario: Archive frames
- **GIVEN** frames 11, 12, 13, 43, 44, 55, 66, 99, 100
- **WHEN** the state is evaluated
- **THEN** no folder is drawn at 11; the first folder pops at 12 and is first drawn at 13, at (480, 140) scale 0.9 from 13 to 43; it departs at 44, is partway along its route at 55, and is parked at (900, 70) scale 0.4 from 66; no field-count pill is drawn at 99; it is first drawn at 101 and reads "exactly two fields" from 100

### Requirement: SDD archive second request and propose
Balão SHALL speak with no text on screen; then Visor SHALL point while a second folder pops in a fresh slot, and the `book` SHALL jolt once (the breaking fact), independent of any finding on the second folder.

#### Scenario: Request and propose frames
- **GIVEN** frames 123, 124, 163, 164, 183, 184, 189, 190, 191, 209, 210, 221, 222, 245, 246
- **WHEN** the state is evaluated
- **THEN** Balão does not speak at 123 and speaks from 124 to 163, silent again from 164; Visor does not point at 183 and points from 184; no second folder is drawn at 189, it pops at 190 and is first drawn at 191; the book does not jolt at 209, jolts from 210 to 221 (angle not 0 at 215), and is not jolting at 222; Visor stops pointing at 246

#### Scenario: No second folder before propose
- **GIVEN** every frame from 0 to 189
- **WHEN** the stage is read
- **THEN** no second folder is drawn

### Requirement: SDD archive single review round
With no cast member acting, the review SHALL flag the second folder once (a `?` pill and a 12-frame jolt), then clear the `?` once fixed. No `NO-GO` stamp or device SHALL ever appear in this scene.

#### Scenario: Break and finding frames
- **GIVEN** frames 267, 268, 269, 279, 280, 303, 304, 313, 314
- **WHEN** the state is evaluated
- **THEN** no `?` pill is drawn at 267; it pops at 268 and is first drawn at 269, and the second folder jolts 268-279 (angle not 0 at 272, 0 at 280); the `?` pill is leaving from 304 and gone at 314

#### Scenario: No finding before the review
- **GIVEN** every frame from 0 to 267
- **WHEN** the second folder and the `?` pill are read
- **THEN** neither the folder jolts nor the `?` pill is drawn

#### Scenario: At most one finding mark at a time
- **GIVEN** every frame from 0 to 599
- **WHEN** the `?` pill and any stamp are read
- **THEN** no `NO-GO` word or device is ever drawn, and at most one `?` pill is drawn at a time

### Requirement: SDD archive approval
After the finding is fixed, Balão SHALL hold up its `GO` stamp; the stamp SHALL then leave its hand and travel to the second folder's slot, growing about its centre from scale 0.95 to 1.6, and land there and stay until the second archive (SDD archive mechanics (second archive), apply and ending, below); Balão's face SHALL turn `done` as it lets go.

#### Scenario: Approval frames
- **GIVEN** frames 343, 344, 359, 360, 371, 382, 419, 420
- **WHEN** the state is evaluated
- **THEN** at 343 Balão holds nothing; it holds the stamp with `GO` from 344 to 359; at 360 it holds nothing, its face is `done`, and the `GO` stamp is at (229.4, 409.5) at scale 0.95; at 371 it is partway along its route; from 382 to 419 it is at (380, 150) at scale 1.6; it is leaving from 420

#### Scenario: No GO before the owner
- **GIVEN** every frame from 0 to 343
- **WHEN** the stage's words are read
- **THEN** `GO` is not drawn

### Requirement: SDD archive mechanics (second archive), apply and ending
Visor's face SHALL first turn `done` with the `worked` emote (the implementation). With no cast member acting, the landed `GO` SHALL then fade away and the second folder SHALL travel to park beside the first; only once parked SHALL the field-count pill's text change (implementation, archive, new wording — L193-199, L236). Chaves's face SHALL then turn `done`; nothing else SHALL move after.

#### Scenario: Second archive, apply and ending frames
- **GIVEN** frames 403, 404, 419, 420, 429, 430, 451, 452, 473, 474
- **WHEN** the state is evaluated
- **THEN** Visor is not `done` with no emote at 403 and is `done` with the `worked` emote from 404; the `GO` stamp is at (380, 150) scale 1.6 at 419, leaving from 420 and gone at 430; the second folder is at (380, 150) scale 0.95 at 429, departs at 430, and is parked at (900, 170) scale 0.4 from 452; the pill reads "exactly two fields" at 451 and "exactly three fields" from 452; Chaves is not `done` at 473 and is `done` from 474

#### Scenario: No field-count change before the second archive
- **GIVEN** every frame from 0 to 451
- **WHEN** the field-count pill is read
- **THEN** it reads "exactly two fields" from 100 to 451 and is not drawn before 100

#### Scenario: No cast act during archive or review
- **GIVEN** frames 40-119 (`archive-1`), 260-339 (`review`) and 420-469 (`archive-2`)
- **WHEN** the scene's `acts` are read
- **THEN** none falls inside those ranges

#### Scenario: Archive final hold identical
- **GIVEN** frames 500 to 599
- **WHEN** the stage and component state of each are compared
- **THEN** they are deep-equal

### Requirement: SDD archive words on screen
At every frame, every string the scene draws SHALL be a value of its `text.en` table. A string counts as drawn when its element has opacity above 0 and scale above 0.001. The scene SHALL have no caption.

#### Scenario: Archive words over the whole composition
- **GIVEN** the stage trees of frames 0 to 599
- **WHEN** every drawn string is collected
- **THEN** each one is "exactly two fields", "exactly three fields", "GO" or "?", and all four appear

#### Scenario: Archive words in the loaded face
- **GIVEN** the stage layers of frames 105, 455 and 599
- **WHEN** each passes through `withSansFamily`
- **THEN** each layer that holds words held the `font.sans` stack before and holds none after

#### Scenario: Archive unlisted word rejected
- **GIVEN** a fixture whose field-count pill reads the literal "exactly four fields" at frame 450
- **WHEN** the words test runs
- **THEN** it fails naming "exactly four fields" and frame 450

### Requirement: SDD archive text size
Every word the scene draws SHALL have an effective font size of at least 33 stage units (11.7 px in the site's 341 px column). Exempt: the `?` mark, `GO` in Balão's hand (344-359) or in flight (360-381).

#### Scenario: Every settled archive word at its minimum
- **GIVEN** every frame from 0 to 599
- **WHEN** each drawn string whose pop-in has settled is measured
- **THEN** the field-count pill is at least 33 and the landed `GO` is at least 33; a smaller `GO` is drawn only from 344 to 381

#### Scenario: Archive word too small rejected
- **GIVEN** a fixture whose field-count pill is drawn at 32
- **WHEN** the size test runs
- **THEN** it fails naming the string, its size and the first checked frame

### Requirement: SDD archive text placement
The field-count pill, the `?` pill, the `book`'s own box, the `GO` stamp's disc and every drawn word box but `?` SHALL lie inside the stage less 12 units and SHALL NOT intersect each other or a cast body box. The `?` pill's placement is checked at every frame it is drawn except while it is settling (269-297) or leaving (304-313); it IS checked from 298 to 303.

#### Scenario: Archive placement at every checked frame
- **GIVEN** every frame from 0 to 599 except exempt (moving/settling/leaving) frames
- **WHEN** the boxes are computed
- **THEN** each lies within x 12-948 and y 12-528, and none intersects another or a cast body box

#### Scenario: Archive collision rejected
- **GIVEN** a fixture moving the field-count pill to overlap the `?` pill's position at frame 300
- **WHEN** the placement test runs
- **THEN** it fails naming both elements and frame 300 (300 is outside the `?` pill's settle/leave exemption windows, so the fixture is falsifiable)

### Requirement: SDD archive built from package pieces
The scene SHALL draw only through the pieces `balao`, `chaves`, `visor`, `emote`, `folder`, `book`, `diagramBox` and `stamp`, `pose`, and the components `Rings` and `MotionPath`. Its files SHALL contain no colour literal and create no SVG shape of their own.

#### Scenario: Archive scene has no shape of its own
- **GIVEN** the files under `src/scenes/sdd-scene-3-archive/`
- **WHEN** a test reads them
- **THEN** none calls `el(` with `path`, `rect`, `circle`, `ellipse`, `line`, `polygon` or `polyline`, none contains a JSX element of those tags, and the pieces imported are those above

#### Scenario: Archive scene has no colour literal
- **WHEN** the colour-literal test scans `src/scenes/` and `src/brand/`
- **THEN** it reports nothing for the new files

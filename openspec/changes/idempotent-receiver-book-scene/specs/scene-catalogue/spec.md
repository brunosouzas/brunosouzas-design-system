# Spec delta: scene-catalogue (idempotent-receiver-book-scene)

## ADDED Requirements

### Requirement: Idempotent Receiver book registration
The catalogue SHALL register `idempotent-receiver-book` after `sdd-scene-3-archive` and before `circuit-breaker-topology`: kind `takes`, neutral, format `16x9` only, 780 frames at 30 fps, outro 680, sources `https://brunosouzas.com/wiki/idempotent-receiver-in-mulesoft/` (`en`) and `https://brunosouzas.com/pt/wiki/idempotent-receiver-in-mulesoft/` (`pt`), and the `text.en` table of scenario "Word table". `src/Root.tsx` SHALL map its composition to the scene's component.

#### Scenario: Registered entry
- **GIVEN** the catalogue
- **WHEN** `findScene("idempotent-receiver-book")` is read
- **THEN** it returns the entry above with `neutral` true, `languages` `["en"]`, `text.en` only and both sources, and `src/Root.tsx` registers `idempotent-receiver-book-16x9` with the scene's component

#### Scenario: Word table
- **GIVEN** the registered entry
- **WHEN** `text.en` is read
- **THEN** it equals `sender` "Sender", `id` "42", `question` "?", `takes` ["1", "2"]

#### Scenario: One composition, before the topology scene
- **GIVEN** every registered scene
- **WHEN** the compositions are enumerated without React or font loading
- **THEN** the first eleven are those of the five earlier scenes, unchanged and in order; the twelfth is `idempotent-receiver-book-16x9` (1920x1080, 30 fps, 780 frames, folder `idempotent-receiver-book`); the thirteenth and last is `circuit-breaker-topology-16x9`; every id is unique

#### Scenario: Broken entry rejected
- **GIVEN** separate fixtures of the entry with a `text.pt` table, with `sources.pt` starting `http://`, or with its outro at 691
- **WHEN** the catalogue is checked
- **THEN** each fails naming `idempotent-receiver-book` and the problem (Portuguese table, `pt` source, outro inside the reading hold)

#### Scenario: Takes checks pass
- **GIVEN** the registered scene
- **WHEN** `checkTimeline`, `checkCatalogue` and the `takes` checks run
- **THEN** no problem is reported

### Requirement: Idempotent Receiver book reading devices
The `takes` kind's reading devices SHALL include `lookupMark` and `ghost`. The scene SHALL name `takeNumbers` in `setup`, `lookupMark` in `t1-lookup` and `t2-lookup`, `rewind` and `takeNumbers` in `rewind`, and `ghost` in `t2-compare`, and no other device. It SHALL have no cast, and every phase SHALL cite lines 28 or 32 of the English page only.

#### Scenario: Devices where the owner approved them
- **GIVEN** the scene's phases
- **WHEN** their devices are listed in phase order
- **THEN** they are `setup:takeNumbers`, `t1-lookup:lookupMark`, `rewind:rewind`, `rewind:takeNumbers`, `t2-lookup:lookupMark` and `t2-compare:ghost`

#### Scenario: No cast
- **GIVEN** the scene's timeline
- **WHEN** its acts, faces and emotes are read
- **THEN** all three are empty

#### Scenario: Every phase cites the article
- **GIVEN** the scene's phases
- **WHEN** their cited lines are read
- **THEN** every line is 28 or 32

### Requirement: Idempotent Receiver book beats and timing
The scene's timeline SHALL equal the change's design §4: the thirteen phases with their takes, frames, cited lines and devices; every trip, pop-in, fade, leave and cue; the rewind's object frames; the outro. Every trip SHALL end `motion.travel` frames after it starts, and every fade SHALL last `motion.fade` frames. Take 2 SHALL repeat take 1's frames 40 to 219 at an offset of 280.

#### Scenario: Timeline equals the beat table
- **GIVEN** design §4 transcribed in the test, `motion.travel` 22 and `motion.fade` 10
- **WHEN** it is compared with the scene's timeline
- **THEN** every value is equal, including phases `setup` 0–39, `t1-send` 40–99, `t1-lookup` 100–159, `t1-process` 160–219, `t1-hold` 220–259, `rewind` 260–319, `t2-send` 320–379, `t2-lookup` 380–439, `t2-process` 440–499, `t2-deliver` 500–539, `t2-match` 540–589, `t2-ignore` 590–639 and `t2-compare` 640–679

#### Scenario: Travel token changed
- **GIVEN** the timeline built with `motion.travel` 20
- **WHEN** it is compared with the beat table
- **THEN** the comparison fails naming trip `send-t1`, whose arrival is 66 instead of 68

#### Scenario: Seeking in any order
- **GIVEN** every frame from 0 to 779
- **WHEN** the state is evaluated forward, backward and in a shuffled order
- **THEN** each frame gives the same state every time

#### Scenario: Take 2 repeats take 1 by 280 frames
- **GIVEN** every frame f from 40 to 219
- **WHEN** the states of f and f + 280 are compared without the take, the object frame, the badge, the rewind mark, take 2's copy and guide P1
- **THEN** they are equal

### Requirement: Idempotent Receiver book take 1
In take 1 the token `42` SHALL leave the Sender, enter the channel and reach the receiver once; the lookup SHALL turn solid with a `?` that leaves before it ends; the token SHALL then turn green and move to the processed side, `42` SHALL appear in the store, and a check SHALL pop on the processed token. No second copy SHALL be drawn before take 2.

#### Scenario: One delivery, looked up, processed and stored
- **GIVEN** frames 40, 45, 70, 99, 100, 104, 134, 149, 150, 159, 160, 161, 177, 188 and 218, and every frame from 0 to 259
- **WHEN** the state is evaluated
- **THEN** no token at 40; the token is at the Sender's side at 45, in the channel at 70 and at the door at 99; the lookup is solid from 100 to 149; the `?` is not drawn at 104, settled at 134 and gone at 150; at 159 the token is white and the store empty; from 160 the token is green and from 161 `42` is drawn in the store; at 177 the token is halfway along route `process`; at 188 it is at the processed side, with the check drawn from 189 and settled at 218; no copy is drawn before 260

### Requirement: Idempotent Receiver book rewind
From 260 to 309 the stage except the badge and the rewind mark SHALL be drawn from an object frame playing take 1 backwards from 259 to 39; from 310 to 319 it SHALL hold object frame 39, the stage take 2 starts from. The rewind mark SHALL pop at 260 and leave at 320; the badge SHALL read `1` until 309 and `2` from 310 without a new pop-in.

#### Scenario: Object frames
- **GIVEN** frames 259, 260, 285, 309 and 315
- **WHEN** the object frame is read
- **THEN** it is 259, 259, 147, 39 and 39

#### Scenario: Same stage before each take
- **GIVEN** frames 39, 319 and 320
- **WHEN** their stages are compared without the `above` layer (the badge and the rewind mark)
- **THEN** they are equal

#### Scenario: Badge and mark
- **GIVEN** frames 259, 261, 309, 310 and 330
- **WHEN** the badge and the rewind mark are read
- **THEN** the badge reads `1` at 309 and `2` at 310; the mark is not drawn at 259, is drawn at 261 and is gone at 330

### Requirement: Idempotent Receiver book take 2 deliveries
In take 2 the token SHALL be sent once, as in take 1; once the first delivery has left the channel, a copy SHALL pop in the channel and wait there while the first delivery is looked up and processed; the copy SHALL then reach the receiver.

#### Scenario: Sent once, delivered twice
- **GIVEN** frames 367, 368, 368 to 499, and 522
- **WHEN** the state is evaluated
- **THEN** no copy is drawn at 367; at 368 the copy is drawn in the channel and the first delivery is more than 84 units to its right; the copy stays in the channel through 499; at 522 it is at the door

### Requirement: Idempotent Receiver book duplicate ignored
When the copy reaches the receiver, the lookup SHALL turn solid with no `?`, while the store holds `42`; the copy SHALL then turn orange and move to the ignored side. From the second processing on, exactly one green token and one check SHALL be drawn.

#### Scenario: Found and set aside
- **GIVEN** frames 539, 540, 580, 589, 590 and 618, and every frame from 469 to 779
- **WHEN** the state is evaluated
- **THEN** the lookup is dashed at 539, solid from 540 and dashed again at 580; the stored `42` is settled at 540; no `?` is drawn from 500 to 679; the copy is white at 589, orange from 590 and at the ignored side at 618; from 469 to 779 exactly one token is green and the check is drawn

### Requirement: Idempotent Receiver book final still
From 640 take 1's processed token SHALL fade in at the ghost place, beside take 2's tokens, at `motion.dimOpacity`. From the outro (680) on, nothing SHALL change.

#### Scenario: Take 1's result faded beside take 2's
- **GIVEN** frames 639, 645 and 650
- **WHEN** the ghost's opacity factor is read
- **THEN** it is 0, 0.5 and 1

#### Scenario: Final hold identical
- **GIVEN** frames 680 to 779
- **WHEN** the state and the stage of each are compared with frame 680
- **THEN** they are deep-equal

### Requirement: Idempotent Receiver book words on screen
At every frame, every string the scene draws SHALL be a value of its `text.en` table, and across the composition every value SHALL appear. A string counts as drawn when its element has opacity above 0 and scale above 0.001. The scene SHALL have no caption.

#### Scenario: Words over the whole composition
- **GIVEN** the stage trees of frames 0 to 779
- **WHEN** every drawn string is collected
- **THEN** each one is `Sender`, `42`, `?`, `1` or `2`, and all five appear

#### Scenario: Unlisted word rejected
- **GIVEN** a fixture whose stage draws `Remetente` in place of `Sender` at frame 200
- **WHEN** the words test runs
- **THEN** it fails naming `Remetente` and frame 200

### Requirement: Idempotent Receiver book text size
Every word the scene draws SHALL have an effective font size, its `font-size` times every scale applied once its element has settled, of at least 33 stage units for `Sender` and at least 36 for `42`, `1` and `2`. The `?` is a symbol, exempt.

#### Scenario: Every settled word at its minimum
- **GIVEN** every frame from 0 to 779
- **WHEN** each drawn string whose element has settled is measured
- **THEN** none is below its minimum, and at frame 680 `Sender` is 33 and the token's `42`, the stored `42` and the badge's `2` are 36

#### Scenario: Too small rejected
- **GIVEN** a fixture whose Sender word is drawn at 32 and one whose badge is drawn at 35
- **WHEN** the size test runs
- **THEN** the first fails naming `Sender`, 32 and frame 31, and the second naming `1` at frame 39 and `2` at frame 310

### Requirement: Idempotent Receiver book layout
The scene's positions, sizes and routes SHALL equal design §6.1, and its elements SHALL be drawn in the layer order of design §6.2.

#### Scenario: Layout equals the design
- **GIVEN** the scene's layout and the book scene type's constants
- **WHEN** they are read
- **THEN** they equal design §6.1: lane 212, text sizes 33 and 36, the token, the icons' arrow heights, the Sender, channel, receiver, store, lookup, token rests, check, `?`, badge, rewind mark, rings centre, the four routes and the three guides

#### Scenario: Layer order
- **GIVEN** frames 120, 290, 610 and 680
- **WHEN** the elements of each layer are read
- **THEN** they follow `below` (lookup), `nodes` (sender, channel, receiver, store, stored), `tokens` (ghost, message, copy, check, question), `above` (badge, rewind-mark), and every named element appears in at least one of those frames

### Requirement: Idempotent Receiver book text placement
Every settled word box (measured advance on the `fonts/` faces times effective size), the badge and the rewind mark SHALL lie inside the stage less 12 units, and no two of different elements SHALL cross. Elements popping, fading or leaving, and tokens not at one of their rests, are exempt at that frame (design §6.3).

#### Scenario: Placement at every checked frame
- **GIVEN** every frame from 0 to 779
- **WHEN** the boxes are computed
- **THEN** each checked box lies within x 12–948 and y 12–528 and none crosses another element's, and at frame 680 the checked words are the badge's `2`, the copy's, the ghost's, the message's and the stored `42`, and `Sender`

#### Scenario: Collision rejected
- **GIVEN** a fixture drawing the ghost token 108 units lower, on the ignored token
- **WHEN** the placement test runs
- **THEN** its first problem is at frame 650, the ghost's `42` crossing the copy's `42`

### Requirement: Idempotent Receiver book built from package pieces
The scene SHALL draw only through the pieces `eipIcon`, `diagramBox`, `storeNode`, `messageArrow`, `checkBadge`, `questionToken`, `countBadge` and `uiIcon`, through the book scene type `src/scenes/eip-book.ts`, and the components `Rings` and `MotionPath`. Its files and the book scene type SHALL contain no colour literal and create no SVG shape of their own.

#### Scenario: No shape of its own
- **GIVEN** the files under `src/scenes/idempotent-receiver-book/` and `src/scenes/eip-book.ts`
- **WHEN** a test reads them
- **THEN** the folder holds exactly `Scene.tsx`, `frame.ts`, `layout.ts`, `scene.ts`, `stage.ts` and `timeline.ts`, and none of the files calls `el(` with `path`, `rect`, `circle`, `ellipse`, `line`, `polygon` or `polyline` or contains a JSX element of those tags

#### Scenario: No colour literal
- **WHEN** the colour-literal test scans `src/scenes/` and `src/brand/`
- **THEN** it reports nothing for the new files

### Requirement: Existing scenes unchanged by the book scene
Adding the book scene SHALL leave every other registered scene unchanged: data, compositions, frame behaviour, tests and stills, except the assertions that list every registered scene (in `test/scenes/catalogue-flow.test.ts`, the catalogue tests of the three SDD scenes and `test/scripts/cli.test.ts`).

#### Scenario: Other scenes untouched
- **GIVEN** the branch after this change and `main` before it
- **WHEN** `npm test` runs and `git diff origin/main --stat -- src/scenes` is read
- **THEN** every test passes and the diff lists only `src/scenes/idempotent-receiver-book/`, `src/scenes/eip-book.ts`, `src/scenes/index.ts` and `src/scenes/takes-kind.ts`

#### Scenario: Stills byte-identical (local)
- **GIVEN** the stills of `circuit-breaker-states`, `publish-subscribe`, `sdd-request-relay` and `circuit-breaker-topology`, rendered on `main` and on the branch
- **WHEN** their SHA-256 are compared
- **THEN** every pair is equal

## MODIFIED Requirements

### Requirement: State-machine and flow catalogue compatibility
The catalogue SHALL register state-machine, message-flow, two-take and sequence scenes through the same composition, text, source and phase-range contract, without requiring flow nodes, takes or sequences to be active states or hold call slots. The circuit-breaker and publish-subscribe scenes' data, compositions, frame behaviour, pinned timing assertions and existing tests SHALL remain unchanged, except assertions that list every registered scene, which SHALL list them in registration order.

#### Scenario: Both kinds in the catalogue
- **GIVEN** the circuit-breaker and pub-sub scenes, registered with later scenes after them
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** both pass and their eight compositions are returned unchanged, circuit-breaker first, pub-sub second; the existing circuit-breaker test suite and pinned timeline pass without edits

#### Scenario: Takes fixture beside the registered scenes
- **GIVEN** the registered scenes on this branch followed by the fixtures `takes-fixture` and a sequence fixture
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass and the registered scenes' compositions are returned unchanged and in order, the fixtures last, every id unique; the catalogue itself registers exactly `circuit-breaker-states`, `publish-subscribe`, `sdd-request-relay`, `sdd-scene-2-files`, `sdd-scene-3-archive`, `idempotent-receiver-book` and `circuit-breaker-topology`, in that order

#### Scenario: Three scenes in the catalogue
- **GIVEN** the circuit-breaker, pub-sub and `circuit-breaker-topology` scenes, registered with the SDD scenes and `idempotent-receiver-book` between pub-sub and topology
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass and the three keep their relative order, their nine compositions are returned unchanged, and `circuit-breaker-topology-16x9` is the last composition

#### Scenario: Four scenes in the catalogue
- **GIVEN** the circuit-breaker, pub-sub, `sdd-request-relay` and `circuit-breaker-topology` scenes, registered with `sdd-scene-2-files`, `sdd-scene-3-archive` and `idempotent-receiver-book` between the relay and topology scenes
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass, the four keep their relative order, and `sdd-request-relay-16x9` is the ninth composition

#### Scenario: Five scenes in the catalogue
- **GIVEN** the circuit-breaker, pub-sub, `sdd-request-relay`, `sdd-scene-2-files` and `circuit-breaker-topology` scenes, registered in that order with `sdd-scene-3-archive` and `idempotent-receiver-book` excluded
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass and eleven unique compositions are returned in registration order, `sdd-scene-2-files-16x9` tenth and `circuit-breaker-topology-16x9` last

#### Scenario: Six scenes in the catalogue
- **GIVEN** the circuit-breaker, pub-sub, `sdd-request-relay`, `sdd-scene-2-files`, `sdd-scene-3-archive` and `circuit-breaker-topology` scenes, registered in that order with `idempotent-receiver-book` excluded
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass and twelve unique compositions are returned in registration order, `sdd-scene-2-files-16x9` tenth, `sdd-scene-3-archive-16x9` eleventh and `circuit-breaker-topology-16x9` last

#### Scenario: Seven scenes in the catalogue
- **GIVEN** the circuit-breaker, pub-sub, `sdd-request-relay`, `sdd-scene-2-files`, `sdd-scene-3-archive`, `idempotent-receiver-book` and `circuit-breaker-topology` scenes, registered in that order
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass and thirteen unique compositions are returned in registration order, `idempotent-receiver-book-16x9` twelfth and `circuit-breaker-topology-16x9` last, and the commands' `available scenes:` line lists the seven scenes in that order

#### Scenario: Shared checks still reject a broken flow
- **GIVEN** a pub-sub fixture with a duplicate composition id, a missing English text key or a non-HTTPS source
- **WHEN** catalogue validation runs on each fixture
- **THEN** each is rejected by the corresponding existing shared rule with the scene and offending entry named

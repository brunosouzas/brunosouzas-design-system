# Spec delta: scene-catalogue (idempotent-receiver-mule-scene)

## ADDED Requirements

### Requirement: Idempotent Receiver Mule registration
The catalogue SHALL register `idempotent-receiver-mule` after `idempotent-receiver-book` and before `circuit-breaker-topology`: kind `takes`, neutral, format `16x9` only, 1350 frames at 30 fps, outro 1250, the book scene's two sources, and the `text.en` table of scenario "Word table". `src/Root.tsx` SHALL map its composition to the scene's component.

#### Scenario: Registered entry
- **GIVEN** the catalogue
- **WHEN** `findScene("idempotent-receiver-mule")` is read
- **THEN** it returns the entry above with `neutral` true, `languages` `["en"]`, `text.en` only and the sources `https://brunosouzas.com/wiki/idempotent-receiver-in-mulesoft/` (`en`) and `https://brunosouzas.com/pt/wiki/idempotent-receiver-in-mulesoft/` (`pt`), and `src/Root.tsx` registers `idempotent-receiver-mule-16x9` with the scene's component

#### Scenario: Word table
- **GIVEN** the registered entry
- **WHEN** `text.en` is read
- **THEN** it equals `listener` ["HTTP", "Listener"], `validator` ["Idempotent", "Message", "Validator"], `charge` ["Simulated", "charge"], `id` "`orderId`", `accepted` "200", `duplicate` "409", `failed` "500", `counts` ["0", "1"], `question` "?", `takes` ["1", "2"]

#### Scenario: One composition, after the book scene
- **GIVEN** every registered scene
- **WHEN** the compositions are enumerated without React or font loading
- **THEN** the first twelve are those of the six earlier scenes, unchanged and in order, the twelfth being `idempotent-receiver-book-16x9`; the thirteenth is `idempotent-receiver-mule-16x9` (1920x1080, 30 fps, 1350 frames, folder `idempotent-receiver-mule`); the fourteenth and last is `circuit-breaker-topology-16x9`; every id is unique

#### Scenario: Broken entry rejected
- **GIVEN** separate fixtures of the entry with a `text.pt` table, with `sources.pt` starting `http://`, or with its outro at 1261
- **WHEN** the catalogue is checked
- **THEN** each fails naming `idempotent-receiver-mule` and the problem (Portuguese table, `pt` source, outro inside the reading hold)

#### Scenario: Takes checks pass
- **GIVEN** the registered scene
- **WHEN** `checkTimeline`, `checkCatalogue` and the `takes` checks run
- **THEN** no problem is reported

### Requirement: Idempotent Receiver Mule reading devices and cast
The scene SHALL name `takeNumbers` in `setup`, `lookupMark` in `t1-lookup` and `t2-lookup`, `matchFocus` in `t1-match` and `t2-match`, `rewind` and `takeNumbers` in `rewind` and `ghost` in `t2-compare`, and no other device. Balão SHALL be its only actor, with the `worked` emote and face `done` as `200` arrives, `problem` and `failed` as `500` arrives, and no face or emote as a `409` arrives. Every phase SHALL cite lines 36, 38, 42, 44, 95, 109, 122 or 159 only.

#### Scenario: Devices as in the book scene
- **GIVEN** the scene's phases
- **WHEN** their devices are listed in phase order
- **THEN** they are `setup:takeNumbers`, `t1-lookup:lookupMark`, `t1-match:matchFocus`, `rewind:rewind`, `rewind:takeNumbers`, `t2-lookup:lookupMark`, `t2-match:matchFocus` and `t2-compare:ghost`

#### Scenario: Balão the only actor, reacting to 200 and 500 only
- **GIVEN** the scene's timeline
- **WHEN** its acts, faces and emotes are read
- **THEN** every one is Balão's; the emotes are `worked` at 264 leaving at 300 and `problem` at 894 leaving at 930; the faces at 264 and 894 are `done` and `failed`; and no face or emote is at 528 or 1158, the arrivals of the 409s

#### Scenario: Bad emote rejected
- **GIVEN** the timeline with one more emote, `problem` at 1158 leaving at 1190, where Balão's face does not change
- **WHEN** the `takes` checks run
- **THEN** they report exactly `idempotent-receiver-mule: emote problem at frame 1158 is not on an expression change of balao`

#### Scenario: Every phase cites the article
- **GIVEN** the scene's phases
- **WHEN** their cited lines are read
- **THEN** every line is 36, 38, 42, 44, 95, 109, 122 or 159

### Requirement: Idempotent Receiver Mule beats and timing
The timeline SHALL equal design §4: the seventeen phases with their takes, frames, lines and devices and each phase's events; every trip, pop-in, fade, leave, cue, the focus, Balão's speaking spans, faces and emotes; the rewind with its reverse acts and faces; the outro. Every trip SHALL last `motion.travel` frames and every fade but the rings' `motion.fade`. Take 2 SHALL repeat take 1 630 frames later, except the charge's outcome, Balão's reaction to it and take 1's count.

#### Scenario: Timeline equals the beat table
- **GIVEN** design §4 transcribed in the test, `motion.travel` 22 and `motion.fade` 10
- **WHEN** it is compared with the scene's timeline
- **THEN** every value is equal, each phase's events included, among them phases `setup` 0–39, `t1-send` 40–119, `t1-lookup` 120–179, `t1-charge` 180–239, `t1-answer` 240–329, `t1-retry` 330–419, `t1-match` 420–499, `t1-duplicate` 500–609, `rewind` 610–669, `t2-send` 670–749, `t2-lookup` 750–809, `t2-charge` 810–869, `t2-answer` 870–959, `t2-retry` 960–1049, `t2-match` 1050–1129, `t2-duplicate` 1130–1179 and `t2-compare` 1180–1249

#### Scenario: Travel token changed
- **GIVEN** the timeline built with `motion.travel` 20
- **WHEN** it is compared with the beat table
- **THEN** the comparison fails naming trip `send-t1`, whose arrival is 66 instead of 68

#### Scenario: The rewind's reverse cast
- **GIVEN** the timeline's faces and acts from 610 to 669
- **WHEN** they are read
- **THEN** the faces are `done` at 639 and `idle` at 646, and the acts are 635–638 and 667–669

#### Scenario: Seeking in any order
- **GIVEN** every frame from 0 to 1349
- **WHEN** the state is evaluated forward, backward and in a shuffled order
- **THEN** each frame gives the same state every time

#### Scenario: Take 2 repeats take 1 by 630 frames
- **GIVEN** every frame f from 40 to 215 and from 340 to 528
- **WHEN** the states of f and f + 630 are compared without the take, the object frame, the badge, the rewind mark and the emote, and, from 340, without the statement's charges and count
- **THEN** they are equal

### Requirement: Idempotent Receiver Mule take 1
In take 1 the request SHALL leave Balão and reach the validator; the lookup SHALL turn solid with a `?` that leaves before it ends; `orderId` SHALL appear in the store, the request SHALL reach the charge, the statement SHALL gain its row with the count 1, and a green `200` SHALL travel back, Balão reacting. The retry SHALL reach the validator, the lookup SHALL find `orderId` with no `?` and the store in focus, and an orange `409` SHALL travel back with no reaction.

#### Scenario: Charged once, 200
- **GIVEN** frames 40 to 310
- **WHEN** the state and the stage are read
- **THEN** no request at 40; it is above Balão at 45, halfway along route `send` at 57 and above the validator at 99; Balão speaks at 41 and not at 68; the lookup is dashed at 119 and 170 and solid at 120 and 169; the `?` is not drawn at 124, settled at 154 and gone at 170; the store draws nothing at 180 and `orderId` at 181; the request is above the charge at 208; the count reads `0` at 215 and `1` at 217, and the statement draws more shapes at 216 than at 215; at 236 neither the request nor the answer is drawn; `200` is drawn green at 237 and above Balão at 264; Balão is `idle` at 263 and `done` at 264, the `worked` emote is drawn at 265 and gone at 310

#### Scenario: The retry gets 409, still one charge
- **GIVEN** frames 330 to 609
- **WHEN** the state and the stage are read
- **THEN** Balão is `idle` at 330; the answer is gone at 340; the retry is above Balão at 345 and above the validator at 399; the lookup is dashed at 419 and 470 and solid at 420 and 469; no `?` from 330 to 609; the retry is white at 479 and orange from 480, and gone at 500; `409` is drawn orange at 501 and above Balão at 528; from 500 to 609 Balão is `idle` and no emote is drawn; from 216 to 609 the statement holds one charge

#### Scenario: The store in focus at each match
- **GIVEN** every frame from 0 to 1349
- **WHEN** the store's focus scale is read
- **THEN** it is 1 before 425, from 495 to 609, from 670 to 1054 and from 1125; exactly 1.06 from 455 to 465 and from 1085 to 1095; and at 460 the store and the stored ID are drawn scaled 1.06 about (533, 435), at 400 without a transform; from 420 to 499 and from 1050 to 1129 the store is drawn at its focus scale, on the spring's rise and fall too

### Requirement: Idempotent Receiver Mule rewind
From 610 to 669 the stage, Balão included, except the badge, the rewind mark and the emote SHALL be drawn from an object frame playing take 1 backwards from 609 to 39, the stage take 2 starts from. The rewind mark SHALL pop at 610 and leave at 670; the badge SHALL read `1` until 659 and `2` from 660 without a new pop-in.

#### Scenario: Object frames
- **GIVEN** frames 609, 610, 640 and 669
- **WHEN** the object frame is read
- **THEN** it is 609, 609, 319 and 39

#### Scenario: The rewind draws take 1 backwards
- **GIVEN** every frame f from 610 to 669
- **WHEN** its stage is compared with the stage of its object frame
- **THEN** the `below`, `nodes` and `tokens` layers, Balão as drawn and the guides are equal; no emote is drawn; Balão is drawn with the reverse cast's face and speech: `done` from 639 to 645 and speaking at 635–637 and 667–668; the `200` is drawn at 640 and the `?` at 658 (object frame 145)

#### Scenario: Same stage before each take
- **GIVEN** frames 39 and 669
- **WHEN** their stages are compared without the `above` layer (the badge and the rewind mark)
- **THEN** they are equal

#### Scenario: Badge and mark
- **GIVEN** frames 609, 611, 659, 660 and 680
- **WHEN** the badge and the rewind mark are read
- **THEN** the badge reads `1` at 659 and `2` at 660; the mark is not drawn at 609, is drawn at 611 and is gone at 680

### Requirement: Idempotent Receiver Mule take 2
In take 2 the request SHALL reach the charge as in take 1 and turn red there; a red `500` SHALL travel back, Balão reacting; the store SHALL keep `orderId` and the statement no charge to the end. The retry SHALL get the same orange `409` as in take 1, with no `?` and no reaction.

#### Scenario: The charge fails: 500, the orderId stays
- **GIVEN** frames 838 to 1349
- **WHEN** the state and the stage are read
- **THEN** the request is above the charge at 838, white at 845 and red at 846; `500` is drawn red at 867 and above Balão at 894; Balão is `failed` at 894, the `problem` emote is drawn at 895 and gone at 940; from 811 to 1349 the stored `orderId` is drawn and the statement holds no charge

#### Scenario: The retry gets the same 409
- **GIVEN** frames 960 to 1349
- **WHEN** the state and the stage are read
- **THEN** the lookup is dashed at 1049 and 1100 and solid at 1050 and 1099; no `?` from 960 to 1249; the retry is orange at 1110; `409` is drawn orange at 1131 and above Balão at 1158; from 1130 to 1349 Balão is `idle` and no emote is drawn

### Requirement: Idempotent Receiver Mule final still
From 1180 take 1's count `1` SHALL fade in beside the statement's count `0`, at `motion.dimOpacity`. From the outro (1250) on, nothing SHALL change.

#### Scenario: Take 1's count faded beside take 2's
- **GIVEN** frames 1179, 1185 and 1190
- **WHEN** the ghost is read and drawn
- **THEN** its factor is 0, 0.5 and 1; it is not drawn at 1179, and drawn at half of `motion.dimOpacity` at 1185 and at `motion.dimOpacity` at 1190, reading `1` beside the count's `0`

#### Scenario: Final hold identical
- **GIVEN** frames 1250 to 1349
- **WHEN** the state and the stage of each are compared with frame 1250
- **THEN** they are deep-equal

### Requirement: Idempotent Receiver Mule words on screen
At every frame, every string the scene draws SHALL be a value of its `text.en` table (a code run without its backticks), and across the composition every value SHALL appear. A string counts as drawn when its element has opacity above 0 and scale above 0.001. The scene SHALL have no caption.

#### Scenario: Words over the whole composition
- **GIVEN** the stage trees of frames 0 to 1349
- **WHEN** every drawn string is collected
- **THEN** each one is `HTTP`, `Listener`, `Idempotent`, `Message`, `Validator`, `Simulated`, `charge`, `orderId`, `200`, `409`, `500`, `0`, `1`, `2` or `?`, and all fifteen appear

#### Scenario: Unlisted word rejected
- **GIVEN** a fixture whose stage draws `Cobrança` in place of `Simulated` at frame 200
- **WHEN** the words test runs
- **THEN** it fails naming `Cobrança` and frame 200

### Requirement: Idempotent Receiver Mule text size
Every word the scene draws SHALL have an effective font size, its `font-size` times every scale applied once its element has settled, of at least 33 stage units for the seven component words and at least 36 for `orderId`, `200`, `409`, `500`, `0`, `1` and `2`. The `?` is a symbol, exempt.

#### Scenario: Every settled word at its minimum
- **GIVEN** every frame from 0 to 1349
- **WHEN** each drawn string whose element has settled is measured
- **THEN** none is below its minimum, and at frame 1250 `Listener`, `Validator` and `charge` are 33 and the stored `orderId`, the `409`, the count's `0`, the ghost's `1` and the badge's `2` are 36

#### Scenario: Too small rejected
- **GIVEN** a fixture whose validator words are drawn at 32 and one whose `409` tokens are drawn at 35
- **WHEN** the size test runs
- **THEN** the first fails naming `Idempotent`, `Message` and `Validator` at 32 from frame 33, and the second naming `409` at 35 from frame 530

### Requirement: Idempotent Receiver Mule layout
The scene's positions, sizes and routes SHALL equal design §6.1, and its elements SHALL be drawn in the layer order of design §6.2.

#### Scenario: Layout equals the design
- **GIVEN** the scene's layout and the Mule scene type's constants
- **WHEN** they are read
- **THEN** they equal design §6.1: text sizes 33 and 36, the rest gap 36, Balão, the three components, the store, the lookup, the statement, the counts, the token rests, the `?`, the emote, the badge, the rewind mark, the rings centre, the seven routes and the four guides

#### Scenario: Layer order
- **GIVEN** frames 150, 270, 470, 640, 900 and 1250
- **WHEN** the elements of each layer are read
- **THEN** the layers are `below`, `nodes`, `cast`, `tokens` and `above` in that order; every element drawn in a layer is one of that layer's and they follow `below` (lookup), `nodes` (listener, validator, charge, store, stored, statement, count), `cast` (balao, emote), `tokens` (ghost, request, answer, retry, duplicate, question), `above` (badge, rewind-mark); and every named element appears in at least one of those frames

### Requirement: Idempotent Receiver Mule text placement
Every settled word box (measured advance on the `fonts/` faces times effective size), the `?` included, the badge and the rewind mark SHALL lie inside the stage less 12 units, and no two of different elements SHALL cross. Elements popping, fading, leaving or in focus, and tokens not at one of their rests, are exempt at that frame (design §6.3).

#### Scenario: Placement at every checked frame
- **GIVEN** every frame from 0 to 1349
- **WHEN** the boxes are computed
- **THEN** each checked box lies within x 12–948 and y 12–528 and none crosses another element's, and at frame 1250 the checked words are the badge's `2`, the seven component words, the count's `0`, the `409`, the ghost's `1` and the stored `orderId`

#### Scenario: Collision rejected
- **GIVEN** a fixture drawing take 1's count moved onto the statement's count (by −70, 0)
- **WHEN** the placement test runs
- **THEN** its first problem is at frame 1190, the count's `0` crossing the ghost's `1`

### Requirement: Idempotent Receiver Mule built from package pieces
The scene SHALL draw only through the pieces `diagramBox`, `storeNode`, `sheet`, `countBadge`, `messageArrow`, `questionToken`, `balao`, `emote` and `uiIcon`, through the book and Mule scene types (`src/scenes/eip-book.ts`, `src/scenes/eip-mule.ts`), and the components `Rings` and `MotionPath`. Its files and the scene types SHALL contain no colour literal and create no SVG shape of their own.

#### Scenario: No shape of its own
- **GIVEN** the files under `src/scenes/idempotent-receiver-mule/`, `src/scenes/eip-book.ts` and `src/scenes/eip-mule.ts`
- **WHEN** a test reads them
- **THEN** the folder holds exactly `Scene.tsx`, `frame.ts`, `layout.ts`, `scene.ts`, `stage.ts` and `timeline.ts`, and none of the files calls `el(` with `path`, `rect`, `circle`, `ellipse`, `line`, `polygon` or `polyline` or contains a JSX element of those tags

#### Scenario: No colour literal
- **WHEN** the colour-literal test scans `src/scenes/` and `src/brand/`
- **THEN** it reports nothing for the new files

### Requirement: Existing scenes unchanged by the Mule scene
Adding the Mule scene SHALL leave every other registered scene unchanged: data, compositions, frame behaviour, tests and stills, except the assertions that list every registered scene (in `test/scenes/catalogue-flow.test.ts`, the catalogue tests of the three SDD scenes and of the book scene, and `test/scripts/cli.test.ts`).

#### Scenario: Other scenes untouched
- **GIVEN** the branch after this change
- **WHEN** `npm test` runs and `git diff origin/main...HEAD --stat -- src/scenes` is read
- **THEN** every test passes and the diff lists only `src/scenes/idempotent-receiver-mule/`, `src/scenes/eip-mule.ts` and `src/scenes/index.ts`

#### Scenario: Stills byte-identical (local)
- **GIVEN** the stills of `circuit-breaker-states`, `publish-subscribe`, `sdd-request-relay`, `sdd-scene-2-files`, `sdd-scene-3-archive`, `idempotent-receiver-book` and `circuit-breaker-topology`, rendered on `main` and on the branch
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
- **THEN** all pass and the registered scenes' compositions are returned unchanged and in order, the fixtures last, every id unique; the catalogue itself registers exactly `circuit-breaker-states`, `publish-subscribe`, `sdd-request-relay`, `sdd-scene-2-files`, `sdd-scene-3-archive`, `idempotent-receiver-book`, `idempotent-receiver-mule` and `circuit-breaker-topology`, in that order

#### Scenario: Three scenes in the catalogue
- **GIVEN** the circuit-breaker, pub-sub and `circuit-breaker-topology` scenes, registered with the SDD scenes, `idempotent-receiver-book` and `idempotent-receiver-mule` between pub-sub and topology
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass and the three keep their relative order, their nine compositions are returned unchanged, and `circuit-breaker-topology-16x9` is the last composition

#### Scenario: Four scenes in the catalogue
- **GIVEN** the circuit-breaker, pub-sub, `sdd-request-relay` and `circuit-breaker-topology` scenes, registered with `sdd-scene-2-files`, `sdd-scene-3-archive`, `idempotent-receiver-book` and `idempotent-receiver-mule` between the relay and topology scenes
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass, the four keep their relative order, and `sdd-request-relay-16x9` is the ninth composition

#### Scenario: Five scenes in the catalogue
- **GIVEN** the circuit-breaker, pub-sub, `sdd-request-relay`, `sdd-scene-2-files` and `circuit-breaker-topology` scenes, registered in that order with `sdd-scene-3-archive`, `idempotent-receiver-book` and `idempotent-receiver-mule` excluded
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass and eleven unique compositions are returned in registration order, `sdd-scene-2-files-16x9` tenth and `circuit-breaker-topology-16x9` last

#### Scenario: Six scenes in the catalogue
- **GIVEN** the circuit-breaker, pub-sub, `sdd-request-relay`, `sdd-scene-2-files`, `sdd-scene-3-archive` and `circuit-breaker-topology` scenes, registered in that order with `idempotent-receiver-book` and `idempotent-receiver-mule` excluded
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass and twelve unique compositions are returned in registration order, `sdd-scene-2-files-16x9` tenth, `sdd-scene-3-archive-16x9` eleventh and `circuit-breaker-topology-16x9` last

#### Scenario: Seven scenes in the catalogue
- **GIVEN** the circuit-breaker, pub-sub, `sdd-request-relay`, `sdd-scene-2-files`, `sdd-scene-3-archive`, `idempotent-receiver-book` and `circuit-breaker-topology` scenes, registered in that order with `idempotent-receiver-mule` excluded
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass and thirteen unique compositions are returned in registration order, `idempotent-receiver-book-16x9` twelfth and `circuit-breaker-topology-16x9` last

#### Scenario: Eight scenes in the catalogue
- **GIVEN** the circuit-breaker, pub-sub, `sdd-request-relay`, `sdd-scene-2-files`, `sdd-scene-3-archive`, `idempotent-receiver-book`, `idempotent-receiver-mule` and `circuit-breaker-topology` scenes, registered in that order
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass and fourteen unique compositions are returned in registration order, `idempotent-receiver-book-16x9` twelfth, `idempotent-receiver-mule-16x9` thirteenth and `circuit-breaker-topology-16x9` last, and the commands' `available scenes:` line lists the eight scenes in that order

#### Scenario: Shared checks still reject a broken flow
- **GIVEN** a pub-sub fixture with a duplicate composition id, a missing English text key or a non-HTTPS source
- **WHEN** catalogue validation runs on each fixture
- **THEN** each is rejected by the corresponding existing shared rule with the scene and offending entry named

# Spec delta: scene-catalogue (sdd-scene-1-relay)

## ADDED Requirements

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
- **THEN** `sdd-request-relay-16x9` (1920x1080, 30 fps, 1080 frames, folder `sdd-request-relay`) comes right after the eight compositions of `circuit-breaker-states` and `publish-subscribe`, unchanged and in order, and right before `circuit-breaker-topology-16x9`; every id is unique

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
- **GIVEN** frames 330 and 1000
- **WHEN** the emote is read
- **THEN** at 330 it is `problem` at (214.2, 286) at scale 0.8 and at 1000 `worked` at (800, 292) at scale 0.75, and no other emote is drawn at either frame

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

## MODIFIED Requirements

### Requirement: State-machine and flow catalogue compatibility
The catalogue SHALL register state-machine, message-flow and two-take scenes through the same composition, text, source and phase-range contract, without requiring flow nodes or takes to be active states or hold call slots. The circuit-breaker and publish-subscribe scenes' data, compositions, frame behaviour, pinned timing assertions and existing tests SHALL remain unchanged, except assertions that list every registered scene, which SHALL list them in registration order.

#### Scenario: Both kinds in the catalogue
- **GIVEN** the circuit-breaker and pub-sub scenes, registered with later scenes after them
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** both pass and their eight compositions are returned unchanged, circuit-breaker first, pub-sub second; the existing circuit-breaker test suite and pinned timeline pass without edits

#### Scenario: Takes fixture beside the registered scenes
- **GIVEN** the registered scenes followed by the fixture `takes-fixture`
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass and the registered scenes' compositions are returned unchanged and in order, `takes-fixture-16x9` last, every id unique; the catalogue itself registers exactly `circuit-breaker-states`, `publish-subscribe`, `sdd-request-relay` and `circuit-breaker-topology`, in that order

#### Scenario: Three scenes in the catalogue
- **GIVEN** the circuit-breaker, pub-sub and `circuit-breaker-topology` scenes, registered with the relay scene between pub-sub and topology
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass and the three keep their relative order, their nine compositions are returned unchanged, and `circuit-breaker-topology-16x9` is the last composition

#### Scenario: Four scenes in the catalogue
- **GIVEN** the circuit-breaker, pub-sub, `sdd-request-relay` and `circuit-breaker-topology` scenes, registered in that order
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass and ten unique compositions are returned in registration order, `sdd-request-relay-16x9` ninth and `circuit-breaker-topology-16x9` last, and the commands' `available scenes:` line lists the four scenes in that order

#### Scenario: Shared checks still reject a broken flow
- **GIVEN** a pub-sub fixture with a duplicate composition id, a missing English text key or a non-HTTPS source
- **WHEN** catalogue validation runs on each fixture
- **THEN** each is rejected by the corresponding existing shared rule with the scene and offending entry named

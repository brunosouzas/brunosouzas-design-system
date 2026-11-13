# Spec delta: scene-catalogue (sdd-scene-2-files)

## ADDED Requirements

### Requirement: Sequence scene kind
A scene of kind `sequence` SHALL be neutral and run its phases once, in order, with no take and no rewind. Every phase SHALL cite at least one line of its English source as a positive integer, and its outro SHALL be at most `duration` minus `motion.readingHold`, with no phase start and no event at or after it. The catalogue SHALL reject a scene that breaks one of these, naming the scene and the item.

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
- **WHEN** the `takes` tests and the catalogue checks run unedited
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

#### Scenario: Takes stills byte-identical (local)
- **GIVEN** the stills of `sdd-request-relay` and `circuit-breaker-topology`, rendered on `main` and on the branch
- **WHEN** their SHA-256 are compared
- **THEN** every pair is equal

### Requirement: SDD files cast
The scene SHALL draw, left to right on one ground line (stage y 476) at one scale (0.95), Balão at x 104 facing right, Chaves at x 505 facing right (toward the laptop) and Visor at x 852 facing left, from the pieces `balao`, `chaves` and `visor`, never recoloured. Expressions change only the face and the body pose; at most one emote SHALL be on screen, beside its character's head.

#### Scenario: Files cast in place at every frame
- **GIVEN** frames 0 to 869
- **WHEN** the cast pieces' parameters are read
- **THEN** each drawn cast piece has `scale` 0.95 and ground y 476 (a pop-in scales it through `pose` about that point), Balão x 104 facing right, Chaves x 505 facing right, Visor x 852 facing left with `points` set, and none has a fill or colour parameter

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

#### Scenario: Files travel token changed
- **GIVEN** the timeline built with `motion.travel` 20
- **WHEN** it is compared with the beat table
- **THEN** the comparison fails naming the first trip whose arrival differs

#### Scenario: Files seeking in any order
- **GIVEN** every frame from 0 to 869
- **WHEN** the state is evaluated forward, backward and in a shuffled order
- **THEN** each frame gives the same state every time

### Requirement: SDD files init and propose
Chaves SHALL type while a command line appears on the screen and the `openspec/` folder pops above the stage; then Visor SHALL point while `proposal.md`, `design.md`, `tasks.md` and `spec.md` travel out of the folder to their slots, growing to full size, and the folder SHALL leave once the four have arrived.

#### Scenario: Init and propose frames
- **GIVEN** frames 39, 40, 46, 53, 84, 90, 96, 107, 118, 136, 140 and 150
- **WHEN** the state is evaluated
- **THEN** at 39 no folder is drawn and Chaves does not type; Chaves types from 40 to 83; the command line is drawn from 46; the folder from 53; Visor points from 90; at 96 `proposal.md` is at the folder's centre (480, 139.1) at scale 0.4; at 107 it is halfway along its route at 0.7; from 118 it is at its slot at scale 1; from 136 all four are; the folder is leaving from 140 and gone at 150

#### Scenario: No file before propose
- **GIVEN** every frame from 0 to 95
- **WHEN** the stage is read
- **THEN** no file and no file name is drawn

### Requirement: SDD files questions and answers
After the files arrive, `proposal.md` SHALL gain six `?` rows, one at a time, and Visor SHALL stop pointing and wait; then Balão SHALL speak while each row gets its check.

#### Scenario: Questions and answers frames
- **GIVEN** frames 153, 154, 194, 202, 210, 218, 258 and 266
- **WHEN** the state is evaluated
- **THEN** `proposal.md` has no row at 153, one `?` row from 154 and six from 194; at 202 Visor does not point and is `waiting`; Balão speaks from 210 to 265; row 1 is answered (a `?` and a check) from 218 and all six from 258

#### Scenario: No finding before the review
- **GIVEN** every frame from 0 to 289
- **WHEN** the files' rows are read
- **THEN** no row of `design.md`, `tasks.md` or `spec.md` is flagged or checked, and no file jolts

### Requirement: SDD files review round 1
With no actor on stage, the review SHALL flag `spec.md` rows 1, 2 and 3 and `tasks.md` row 3, one at a time, each with a `?` on the row and a 12-frame jolt of its file; then a `NO-GO` stamp in `color.state.failure` SHALL pop on the change at (516, 190).

#### Scenario: Review 1 frames
- **GIVEN** frames 289, 290, 291, 302, 344, 356, 364, 365, 394 and 409
- **WHEN** the state is evaluated
- **THEN** no row is flagged at 289; `spec.md` row 1 is flagged from 290; `spec.md` jolts at 291 (angle not 0) and not from 302; at 356 exactly `spec.md` rows 1–3 and `tasks.md` row 3 are flagged and no file jolts; no stamp is drawn at 364; `NO-GO` is drawn from 365, settled at scale 1.25 from 394 to 409

#### Scenario: No actor in the reviews
- **GIVEN** the scene's timeline
- **WHEN** its acts and faces between 280 and 599 are read
- **THEN** there is none

### Requirement: SDD files fix and review round 2
The first `NO-GO` SHALL leave and the four flagged rows SHALL get their check; the review SHALL then flag `spec.md` row 2 again (its check goes) and `spec.md` row 4, each with a jolt; a second `NO-GO` SHALL pop at the same place, leave, and the two rows SHALL get their check.

#### Scenario: Fix and review 2 frames
- **GIVEN** frames 410, 420, 428, 446, 470, 494, 515, 560, 570 and 584
- **WHEN** the state is evaluated
- **THEN** `NO-GO` 1 is leaving at 410 and gone at 420; `spec.md` row 1 is checked from 428; the four rows are checked at 446; `spec.md` row 2 is flagged again from 470 and row 4 from 494; `NO-GO` 2 is drawn from 515, leaving from 560 and gone at 570; at 584 `spec.md` rows 1–4 and `tasks.md` row 3 are checked and `spec.md` row 5 is plain

#### Scenario: One NO-GO at a time
- **GIVEN** every frame from 0 to 869
- **WHEN** the stamps are read
- **THEN** at most one `NO-GO` is drawn, and none from 0 to 364, from 420 to 514 or from 570 to 869

### Requirement: SDD files approval
After the second fix, Balão SHALL hold up its `GO` stamp; the stamp SHALL then leave its hand and travel to the change, growing from scale 0.95 to 1.6, land at (516, 190) and stay; Balão's face SHALL turn `done` as it lets go.

#### Scenario: Approval frames
- **GIVEN** frames 605, 606, 625, 626, 637 and 648
- **WHEN** the state is evaluated
- **THEN** at 605 Balão holds nothing; it holds the stamp with `GO` from 606 to 625; at 626 it holds nothing, its face is `done`, and the `GO` stamp is at (229.4, 409.5) at scale 0.95; at 637 it is halfway along its route; from 648 it is at (516, 190) at scale 1.6, drawn to 869

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
- **THEN** each fails naming the string, its size and the first frame it is drawn

### Requirement: SDD files text placement
Every drawn word box (measured advance on the `fonts/` faces times effective size), the folder and file name pills and the stamps' discs SHALL lie inside the stage less 12 units, SHALL NOT intersect each other or a cast body box of design §6.2, and no stamp SHALL cover a flagged row's `?`. The moving and settling frames of design §6.3 are exempt.

#### Scenario: Files placement at every checked frame
- **GIVEN** every frame from 0 to 869 except the exempt frames
- **WHEN** the boxes are computed
- **THEN** each lies within x 12–948 and y 12–528, none intersects another or a cast body box, and no stamp disc intersects a flagged row's `?` disc

#### Scenario: Files collision rejected
- **GIVEN** a fixture drawing the `NO-GO` stamps with their centre at (516, 120)
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

## MODIFIED Requirements

### Requirement: State-machine and flow catalogue compatibility
The catalogue SHALL register state-machine, message-flow, two-take and sequence scenes through the same composition, text, source and phase-range contract, without requiring flow nodes, takes or sequences to be active states or hold call slots. The circuit-breaker and publish-subscribe scenes' data, compositions, frame behaviour, pinned timing assertions and existing tests SHALL remain unchanged, except assertions that list every registered scene, which SHALL list them in registration order.

#### Scenario: Both kinds in the catalogue
- **GIVEN** the circuit-breaker and pub-sub scenes, registered with later scenes after them
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** both pass and their eight compositions are returned unchanged, circuit-breaker first, pub-sub second; the existing circuit-breaker test suite and pinned timeline pass without edits

#### Scenario: Takes fixture beside the registered scenes
- **GIVEN** the registered scenes followed by the fixture `takes-fixture`
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass and the registered scenes' compositions are returned unchanged and in order, `takes-fixture-16x9` last, every id unique; the catalogue itself registers exactly `circuit-breaker-states`, `publish-subscribe`, `sdd-request-relay`, `sdd-scene-2-files` and `circuit-breaker-topology`, in that order

#### Scenario: Three scenes in the catalogue
- **GIVEN** the circuit-breaker, pub-sub and `circuit-breaker-topology` scenes, registered with the SDD scenes between pub-sub and topology
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass and the three keep their relative order, their nine compositions are returned unchanged, and `circuit-breaker-topology-16x9` is the last composition

#### Scenario: Four scenes in the catalogue
- **GIVEN** the circuit-breaker, pub-sub, `sdd-request-relay` and `circuit-breaker-topology` scenes, registered with `sdd-scene-2-files` between the relay and topology scenes
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass, the four keep their relative order, and `sdd-request-relay-16x9` is the ninth composition

#### Scenario: Five scenes in the catalogue
- **GIVEN** the circuit-breaker, pub-sub, `sdd-request-relay`, `sdd-scene-2-files` and `circuit-breaker-topology` scenes, registered in that order
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass and eleven unique compositions are returned in registration order, `sdd-scene-2-files-16x9` tenth and `circuit-breaker-topology-16x9` last, and the commands' `available scenes:` line lists the five scenes in that order

#### Scenario: Shared checks still reject a broken flow
- **GIVEN** a pub-sub fixture with a duplicate composition id, a missing English text key or a non-HTTPS source
- **WHEN** catalogue validation runs on each fixture
- **THEN** each is rejected by the corresponding existing shared rule with the scene and offending entry named

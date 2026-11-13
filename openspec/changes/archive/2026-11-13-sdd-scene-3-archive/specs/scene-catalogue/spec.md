# Spec delta: scene-catalogue (sdd-scene-3-archive)

## ADDED Requirements

### Requirement: Sequence scene kind
A `sequence` scene SHALL be neutral and run its phases once, no `take`, no `rewind`. Each phase SHALL cite a positive-integer line. The outro SHALL be at most `duration` minus `motion.readingHold`, with no phase or event at or after it.

Ported verbatim from `sdd-scene-2-files` (PR #48, unmerged); design §2.1 explains why this branch needs its own copy.

#### Scenario: Valid sequence
- **GIVEN** the registered scene `sdd-scene-3-archive`
- **WHEN** `checkTimeline` and `checkSequence` run on it
- **THEN** neither reports a problem

#### Scenario: Sequence phase without an article line
- **GIVEN** separate fixtures of that scene where phase `request` cites `[]`, `[0]` or `[203.5]`
- **WHEN** each timeline is checked
- **THEN** each fails naming the scene and phase `request`

#### Scenario: Localised sequence scene
- **GIVEN** a fixture of that scene that is not neutral
- **WHEN** its timeline is checked
- **THEN** it fails naming the scene and saying a `sequence` scene is neutral

#### Scenario: Sequence with a take or a rewind rejected
- **GIVEN** separate fixtures of that scene where phase `review` has `take: 1`, and where the timeline has a `rewind`
- **WHEN** each timeline is checked
- **THEN** the first fails naming the scene and phase `review` ("has a take"), the second naming the scene and saying a `sequence` scene has no rewind

#### Scenario: Sequence outro inside the reading hold
- **GIVEN** a fixture of that scene with its outro at 515
- **WHEN** its timeline is checked
- **THEN** it fails naming the scene and saying the outro at frame 515 is inside the reading hold (at most 510)

### Requirement: Sequence cast and hold
A `sequence` scene SHALL pass the `takes` kind's cast rules (acts of different actors never overlap; an emote enters on its actor's expression change, alone, and is gone before any later act) and reading-hold rules (no act, face, trip, fade, leave or cue at or after the outro; pop-ins and emotes settled by it), with the same messages. A `takes` scene SHALL get exactly the problems it got before.

#### Scenario: Overlapping acts in a sequence
- **GIVEN** a fixture of `sdd-scene-3-archive` with a `chaves` act 350–355 added during Balão's act 344–360
- **WHEN** its timeline is checked
- **THEN** it fails naming the scene, the `balao` act [344, 360] and the `chaves` act [350, 355]

#### Scenario: Cue in the reading hold
- **GIVEN** a fixture of that scene with an `ending` cue at 500
- **WHEN** its timeline is checked
- **THEN** it fails naming the scene, the cue and frame 500 (at or after the outro, frame 500)

#### Scenario: Takes scenes unchanged
- **GIVEN** the `takes-fixture`, `sdd-request-relay` and `circuit-breaker-topology`
- **WHEN** the `takes` tests run, unedited except the registration assertions task 1.1 lists, and the catalogue checks run
- **THEN** they pass, and `checkTakes` on each registered `takes` scene returns no problem

### Requirement: SDD archive registration
The catalogue SHALL register `sdd-scene-3-archive` right after `sdd-request-relay` and before `circuit-breaker-topology` (this branch's order; reconciled with `sdd-scene-2-files` at merge time): kind `sequence`, neutral, format `16x9` only, 600 frames at 30 fps, outro 500. `src/Root.tsx` SHALL map its composition to the scene's component.

#### Scenario: Archive registered entry
- **GIVEN** the catalogue
- **WHEN** `findScene("sdd-scene-3-archive")` is read
- **THEN** it returns the entry above with `neutral` true, `languages` `["en"]`, `text.en` only and both sources, and `src/Root.tsx` registers `sdd-scene-3-archive-16x9` with the scene's component

#### Scenario: Archive word table
- **GIVEN** the registered entry
- **WHEN** `text.en` is read
- **THEN** it equals `fieldCount` {`was` "exactly two fields", `now` "exactly three fields"}, `verdict` "GO", `question` "?"

#### Scenario: One composition, after this branch's earlier scenes
- **GIVEN** every registered scene on this branch
- **WHEN** the compositions are enumerated without React or font loading
- **THEN** `sdd-scene-3-archive-16x9` (1920x1080, 30 fps, 600 frames, folder `sdd-scene-3-archive`) comes right after `sdd-request-relay-16x9` and right before `circuit-breaker-topology-16x9`, the compositions before it are unchanged and in order, and every id is unique

#### Scenario: Archive broken entry rejected
- **GIVEN** separate fixtures of the entry with a `text.pt` table, with `sources.pt` starting `http://`, or with its outro at 511
- **WHEN** the catalogue is checked
- **THEN** each fails naming `sdd-scene-3-archive` and the problem (Portuguese table, `pt` source, outro inside the reading hold — the limit is `duration` 600 minus `motion.readingHold` 90 = 510)

### Requirement: Existing scenes unchanged by the archive scene
Adding the archive scene SHALL leave every other registered scene unchanged: data, compositions, frame behaviour, tests and stills, except the assertions that list every registered scene (`test/scenes/catalogue-flow.test.ts`, `test/scenes/sdd-request-relay-catalogue.test.ts`, `test/scripts/cli.test.ts`), which this change edits to the five-scene order above.

#### Scenario: Other scenes' tests untouched
- **GIVEN** the branch after this change and `origin/main` before it
- **WHEN** `npm test` runs
- **THEN** the test files of `circuit-breaker-states`, `publish-subscribe`, `sdd-request-relay` and `circuit-breaker-topology` pass with no edit beyond the registration assertions named above, and `git diff` shows no change under `src/scenes/circuit-breaker-states/`, `src/scenes/publish-subscribe/`, `src/scenes/sdd-request-relay/` or `src/scenes/circuit-breaker-topology/`

#### Scenario: Stills byte-identical (local)
- **GIVEN** the stills of `circuit-breaker-states`, `publish-subscribe`, `sdd-request-relay` and `circuit-breaker-topology`, rendered on `origin/main` and on the branch
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

#### Scenario: Archive travel token changed
- **GIVEN** the timeline built with `motion.travel` 20
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
- **THEN** all pass and the registered scenes' compositions are returned unchanged and in order, the fixtures last, every id unique; the catalogue itself registers exactly `circuit-breaker-states`, `publish-subscribe`, `sdd-request-relay`, `sdd-scene-3-archive` and `circuit-breaker-topology`, in that order (on this branch; the owner reconciles with `sdd-scene-2-files` at merge time, proposal.md's open question 6)

#### Scenario: Three scenes in the catalogue
- **GIVEN** the circuit-breaker, pub-sub and `circuit-breaker-topology` scenes, registered with the SDD scenes between pub-sub and topology
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass and the three keep their relative order, their nine compositions are returned unchanged, and `circuit-breaker-topology-16x9` is the last composition

#### Scenario: Four scenes in the catalogue
- **GIVEN** the circuit-breaker, pub-sub, `sdd-request-relay` and `circuit-breaker-topology` scenes, registered with `sdd-scene-3-archive` between the relay and topology scenes
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass, the four keep their relative order, and `sdd-request-relay-16x9` is the ninth composition

#### Scenario: Five scenes in the catalogue
- **GIVEN** the circuit-breaker, pub-sub, `sdd-request-relay`, `sdd-scene-3-archive` and `circuit-breaker-topology` scenes, registered in that order
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass and eleven unique compositions are returned in registration order, `sdd-scene-3-archive-16x9` tenth and `circuit-breaker-topology-16x9` last, and the commands' `available scenes:` line lists the five scenes in that order

#### Scenario: Shared checks still reject a broken flow
- **GIVEN** a pub-sub fixture with a duplicate composition id, a missing English text key or a non-HTTPS source
- **WHEN** catalogue validation runs on each fixture
- **THEN** each is rejected by the corresponding existing shared rule with the scene and offending entry named

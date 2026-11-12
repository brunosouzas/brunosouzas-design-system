## MODIFIED Requirements

### Requirement: One composition per format and language
Each localised scene SHALL be registered as one composition per format and language, with the id `<scene>-<format>-<language>`: format `16x9` (1920x1080) or `4x5` (1080x1350), language `pt` or `en`. A neutral scene SHALL be registered as one composition per format, with the id `<scene>-<format>`. Every composition runs at `motion.fps`. The Studio SHALL list a scene's compositions in a folder named after the scene.

#### Scenario: Circuit-breaker compositions
- **WHEN** the catalogue is loaded
- **THEN** it holds `circuit-breaker-states-16x9-pt`, `circuit-breaker-states-16x9-en`, `circuit-breaker-states-4x5-pt` and `circuit-breaker-states-4x5-en`, with the sizes above and 30 frames per second, grouped under the folder `circuit-breaker-states`

#### Scenario: Neutral composition
- **GIVEN** the neutral scene `sdd-without-with-spec`, format `16x9` only
- **WHEN** its compositions are enumerated
- **THEN** exactly one is returned: id `sdd-without-with-spec-16x9`, folder `sdd-without-with-spec`, format `16x9`, language `en`, 1920x1080, 30 frames per second, 780 frames

#### Scenario: Duplicate composition id
- **WHEN** two scenes would register the same composition id
- **THEN** the catalogue test fails and names the id

#### Scenario: Duplicate neutral composition id
- **GIVEN** the scene `sdd-without-with-spec` registered twice
- **WHEN** the catalogue is checked
- **THEN** it fails naming `duplicate composition id sdd-without-with-spec-16x9`

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
- **GIVEN** a registered scene of any kind
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
- **GIVEN** a registered scene of any kind
- **WHEN** a phase's `from` is equal to or before the previous phase's `to`
- **THEN** the catalogue test fails and names the scene and both phases

#### Scenario: Event outside its phase
- **GIVEN** a registered scene of any kind
- **WHEN** an event's frame is after its phase's end
- **THEN** the catalogue test fails and names the scene, the phase and the frame

#### Scenario: Movement inside the reading hold
- **GIVEN** a registered scene of any kind
- **WHEN** an event, a fire, an arrow draw or a pill pop-in happens at or after the outro frame
- **THEN** the catalogue test fails and names the scene and the frame

#### Scenario: Flow trip crosses the outro
- **GIVEN** a flow scene with outro 910
- **WHEN** a token trip starts at 900 and arrives at 922
- **THEN** validation fails naming the scene, route and arrival frame, although the departure precedes the outro

#### Scenario: Takes scene needs no slots or fires
- **GIVEN** the `takes` scene `sdd-without-with-spec`, which has no `slots`, `transitions` or `fires`
- **WHEN** its timeline is checked
- **THEN** it passes, and no state-machine message (`never fires`, `outside its window`) is reported for it

#### Scenario: Takes outro inside the reading hold
- **GIVEN** the scene `sdd-without-with-spec` (780 frames) with its outro moved to 691
- **WHEN** its timeline is checked
- **THEN** it fails naming the scene and outro frame 691 (at most 690)

### Requirement: State-machine and flow catalogue compatibility
The catalogue SHALL register state-machine, message-flow and two-take scenes through the same composition, text, source and phase-range contract, without requiring flow nodes or takes to be active states or hold call slots. The circuit-breaker and publish-subscribe scenes' data, compositions, frame behaviour, pinned timing assertions and existing tests SHALL remain unchanged, except assertions that list every registered scene, which SHALL list the three scenes in registration order.

#### Scenario: Both kinds in the catalogue
- **GIVEN** the circuit-breaker and pub-sub scenes, registered with a third scene after them
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** both pass and their eight compositions are returned unchanged, circuit-breaker first, pub-sub second; the existing circuit-breaker test suite and pinned timeline pass without edits

#### Scenario: Three kinds in the catalogue
- **GIVEN** the circuit-breaker, pub-sub and `sdd-without-with-spec` scenes
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass and nine unique compositions are returned, circuit-breaker's four first, pub-sub's four second, `sdd-without-with-spec-16x9` last; the circuit-breaker and pub-sub suites and pinned timelines pass, edited only where they list every registered scene

#### Scenario: Shared checks still reject a broken flow
- **GIVEN** a pub-sub fixture with a duplicate composition id, a missing English text key or a non-HTTPS source
- **WHEN** catalogue validation runs on each fixture
- **THEN** each is rejected by the corresponding existing shared rule with the scene and offending entry named

## ADDED Requirements

### Requirement: Neutral scenes
A scene marked neutral SHALL declare the language `en` only (its words are English, ADR 0005 as amended), SHALL keep its on-screen strings in one `en` table with no empty string or list, and SHALL record `https://` source URLs for both `pt` and `en`, because its one video serves both pages. The catalogue SHALL reject any other combination, naming the scene and the problem.

#### Scenario: Valid neutral scene
- **GIVEN** `sdd-without-with-spec` with `languages` `["en"]`, `text.en` only and both sources
- **WHEN** the catalogue is checked
- **THEN** it reports no problem for the scene

#### Scenario: Neutral scene with a Portuguese table
- **GIVEN** the scene with a `text.pt` table added
- **WHEN** the catalogue is checked
- **THEN** it fails naming the scene and saying a neutral scene has no `pt` text table

#### Scenario: Neutral scene in two languages
- **GIVEN** the scene with `languages` `["pt", "en"]`, or `["pt"]`
- **WHEN** the catalogue is checked
- **THEN** each fails naming the scene and saying a neutral scene declares `en` only

#### Scenario: Neutral scene missing a source
- **GIVEN** the scene without `sources.pt`, or with `sources.pt` starting `http://`
- **WHEN** the catalogue is checked
- **THEN** each fails naming the scene and `pt` source

#### Scenario: Neutral scene with an empty word
- **GIVEN** the scene with `text.en.approval` set to `""`, or `text.en.takes` set to `[]`
- **WHEN** the catalogue is checked
- **THEN** each fails naming the scene, `en` and the key path

### Requirement: Two-take scene kind
A scene of kind `takes` SHALL order its phases as one or more take-1 phases, exactly one rewind phase, then one or more take-2 phases, and every phase SHALL cite at least one line of its English source as a positive integer. The catalogue SHALL reject any other order or a phase without a valid line, naming the scene and the phase. A `takes` scene SHALL be neutral.

#### Scenario: Valid takes
- **GIVEN** `sdd-without-with-spec`, phases `request`, `guess`, `error` (take 1), `rewind`, `ask`, `answer`, `implement` (take 2), each citing lines
- **WHEN** its timeline is checked
- **THEN** no takes problem is reported

#### Scenario: Takes out of order
- **GIVEN** separate fixtures where `ask` is marked take 1, where `error` is marked take 2, where a second rewind phase follows `ask`, and where no phase is take 1
- **WHEN** each timeline is checked
- **THEN** each fails naming the scene and the first phase that breaks the order (`ask`, `error`, the second rewind, `rewind`)

#### Scenario: Phase without an article line
- **GIVEN** separate fixtures where `guess` cites `[]`, `[0]` or `[26.5]`
- **WHEN** each timeline is checked
- **THEN** each fails naming the scene and phase `guess`

#### Scenario: Localised takes scene
- **GIVEN** a `takes` fixture that is not neutral
- **WHEN** the catalogue is checked
- **THEN** it fails naming the scene and saying a `takes` scene is neutral

### Requirement: Two-take cast timing
In a `takes` scene, acts of different actors SHALL NOT overlap (inclusive ranges); every emote SHALL enter on a frame where its actor's expression changes; at most one emote SHALL be visible at a frame (from its entrance until 10 frames after its leave, or to the end); an emote SHALL be gone before any act that starts after it; acts, expression changes, emote entrances and trip arrivals SHALL precede the outro. Problems name the scene and the item.

#### Scenario: The scene's own cues pass
- **GIVEN** `sdd-without-with-spec` with Visor's acts 90–90, 344–344, 390–476 and 590–590, faces at 270, 344, 488, 590 and 660, emotes `problem` (270, leaving at 320) and `worked` (660, never leaving)
- **WHEN** its timeline is checked
- **THEN** no cast problem is reported

#### Scenario: Two actors at once
- **GIVEN** a fixture adding a second actor's act 470–480 while Visor's act 390–476 runs
- **WHEN** its timeline is checked
- **THEN** it fails naming the scene and both acts

#### Scenario: Emote off an expression change
- **GIVEN** a fixture with the `problem` emote entering at 271 while the face changes at 270
- **WHEN** its timeline is checked
- **THEN** it fails naming the scene, emote `problem` and frame 271

#### Scenario: Two emotes on screen
- **GIVEN** a fixture whose `problem` emote never leaves, plus the `worked` emote at 660
- **WHEN** its timeline is checked
- **THEN** it fails naming the scene and both emotes

#### Scenario: Emote still visible at the next action
- **GIVEN** a fixture whose `problem` emote leaves at 336, so it is visible until frame 345, and Visor's act at 344
- **WHEN** its timeline is checked
- **THEN** it fails naming the scene, emote `problem` and the act at 344; with the leave at 334 (gone at 344) it passes

#### Scenario: Cue at or after the outro
- **GIVEN** separate fixtures with a face change at 690, an emote entering at 690, an act starting at 700 and a trip arriving at 691, outro 690
- **WHEN** each timeline is checked
- **THEN** each fails naming the scene, the cue and its frame

### Requirement: SDD scene registration
The catalogue SHALL register the scene `sdd-without-with-spec`, kind `takes`, neutral, format `16x9` only, 780 frames at 30 fps, outro 690, with sources `https://brunosouzas.com/blog/spec-driven-development-in-practice` (`en`) and `https://brunosouzas.com/pt/blog/spec-driven-development-in-practice` (`pt`), and the English word table `file` `proposal.md`, `approval` `GO`, `question` `?`, `takes` `["1", "2"]`.

#### Scenario: Registered entry
- **GIVEN** the catalogue
- **WHEN** `findScene("sdd-without-with-spec")` is read
- **THEN** it returns the entry above, and `src/Root.tsx` maps the id to the scene's component

#### Scenario: No 4:5 and no second language
- **GIVEN** the registered entry
- **WHEN** its formats, languages and compositions are read
- **THEN** formats are `["16x9"]`, languages `["en"]`, and no composition id ends in `-4x5`, `-pt` or `-en`

### Requirement: SDD words on screen
At every frame, the only strings the scene draws SHALL be `proposal.md`, `GO`, `?`, `1` and `2`, each from the scene's word table or a piece's own `?` glyph; across the composition all five SHALL appear. The scene SHALL have no caption. Emotes, the rewind mark and the code lines carry no words.

#### Scenario: Words over the whole composition
- **GIVEN** the stage trees of frames 0 to 779
- **WHEN** every text node's content is collected
- **THEN** each content is one of the five strings, and the union is all five

#### Scenario: Words at their boundaries
- **GIVEN** frames 17, 18, 377, 378, 389, 390, 575 and 576
- **WHEN** their text is read
- **THEN** 17 draws no word; 18 to 377 draw `1`; 378 and later draw `2` and never `1`; `proposal.md` first appears at 390; `GO` first appears at 576

### Requirement: SDD beats and timing
The scene's timeline SHALL equal the beat table of the change's design §4: the seven phases with their takes, frame ranges and cited lines, every pop-in, trip, path fade, code-line and row frame, the acts, faces and emotes, the object frame of the rewind and the outro. Arrival frames SHALL be departure plus `motion.travel`.

#### Scenario: Timeline equals the beat table
- **GIVEN** the beat table transcribed in the test
- **WHEN** it is compared with the scene's timeline and `motion.travel` is 22
- **THEN** every value is equal, including phases `request` 24–89, `guess` 90–239, `error` 240–309, `rewind` 340–377, `ask` 390–489, `answer` 490–589, `implement` 590–689

#### Scenario: Travel token changed
- **GIVEN** the timeline built with a `motion.travel` of 20
- **WHEN** it is compared with the beat table
- **THEN** the comparison fails naming the first trip whose arrival differs

### Requirement: SDD take 1, the questions sink into the code
In take 1 the balloon SHALL hold six `?` from their pop-ins until each departs; each `?` SHALL travel its route into the code panel and, on its arrival frame, be gone while the code panel gains one line; two more lines follow; no sheet, answer or stamp is drawn in take 1.

#### Scenario: Request before the agent acts
- **GIVEN** frame 89
- **WHEN** the state is read
- **THEN** the balloon holds six `?`, the code panel has 0 lines, Visor is idle with `points` false and no sheet

#### Scenario: First question in flight and arriving
- **GIVEN** frames 111, 112, 123 and 134
- **WHEN** `?` 0 is read
- **THEN** at 111 it is in slot 0; at 112 it is at the start of `guess-0`; at 123 halfway by length; at 134 it is gone and the code panel has 1 line

#### Scenario: Take 1 complete
- **GIVEN** frames 209, 210 and 239
- **WHEN** the state is read
- **THEN** 209 shows 7 lines, 210 and 239 show 8, the balloon is empty and path P1 is fully transparent at 239

### Requirement: SDD take 1, the error comes back
The failure arrow SHALL draw from the code panel to the balloon from frame 240 over `motion.drawArrow` frames, in `color.state.failure`. At 270 Visor's expression SHALL become `failed`, the `problem` emote SHALL pop in beside its head and its body SHALL squash and tilt (−5°); the emote SHALL leave from 320 and be gone at 330.

#### Scenario: Arrow boundaries
- **GIVEN** frames 239, 250 and 260
- **WHEN** the arrow state is read
- **THEN** 239 draws nothing; 250 draws half the path without a head; 260 draws the whole path with its head

#### Scenario: Fright frames
- **GIVEN** frames 269, 270, 329 and 330
- **WHEN** Visor and the emote are read
- **THEN** 269 is `idle`, upright, with no emote; 270 is `failed`, tilt −5, with the `problem` emote entering; 329 still shows the emote at an opacity above 0; 330 shows no emote and Visor still `failed`

### Requirement: SDD rewind
From 340 the rewind mark SHALL pop beside the take badge. At 344 Visor SHALL reset at once (`idle`, `points` false, upright) and from 344 to 377 the object layer (the `?`, code lines, path P1, the failure arrow) SHALL show take 1 backwards, its object frame going from 339 to 89. At 378 the badge SHALL read `2` and the rewind mark leave, gone at 388.

#### Scenario: Object frame
- **GIVEN** frames 343, 344, 360, 377, 378 and 389
- **WHEN** the object frame is read
- **THEN** it is 343, 339, 218, 89, 89 and 89

#### Scenario: Rewind ends on the request
- **GIVEN** frame 377
- **WHEN** the state is read
- **THEN** the objects equal those of frame 89, Visor is idle without pointing, the badge reads `1` and the rewind mark is visible

#### Scenario: The fright is not replayed
- **GIVEN** every frame from 344 to 389
- **WHEN** Visor and the emote are read
- **THEN** Visor is `idle`, upright, with `points` false, and no emote is drawn

### Requirement: SDD same stage in both takes
The state at frame 389, the last before take 2 acts, SHALL equal the state at frame 89, the last before take 1 acts, except the take badge's text: the same balloon and six `?`, the same empty code panel, Visor at the same place, scale, face and action, with every pop-in settled.

#### Scenario: Fair comparison
- **GIVEN** the state at 89 and at 389
- **WHEN** they are compared field by field
- **THEN** only the badge differs (`1` and `2`); at 389 the rewind mark is gone

#### Scenario: Settled pop-ins
- **GIVEN** each pop-in frame *a* of the timeline
- **WHEN** the appearance is read at *a* − 1, *a* and *a* + 30
- **THEN** it is absent at *a* − 1 (except the badge's second pop-in at 378, where frame 377 shows the badge reading `1`), starts at *a*, and is exactly opacity 1 and scale 1 from *a* + 30

### Requirement: SDD take 2, the questions written down
At 390 Visor SHALL hold the `proposal.md` sheet with one heading row. Each `?` SHALL travel its `ask` route and, on its arrival frame, be gone while the sheet gains that question row, without a tail check. At 488 Visor's face SHALL become `waiting`, with no emote.

#### Scenario: Sheet appears with its heading
- **GIVEN** frames 389 and 390
- **WHEN** Visor is read
- **THEN** 389 holds nothing; 390 holds the sheet labelled `proposal.md` with exactly the heading row

#### Scenario: Questions become rows
- **GIVEN** frames 425, 426 and 476
- **WHEN** the balloon and the sheet are read
- **THEN** 425 has 3 `?` in the balloon (3, 4, 5), 3 in flight (0, 1, 2) and 1 row; 426 has 2 rows (heading and question 1) and 2 `?` in flight; 476 has an empty balloon, nothing in flight and 7 rows, every question row without a check

#### Scenario: Visor waits
- **GIVEN** frames 487 and 488
- **WHEN** Visor and the emote are read
- **THEN** 487 is `idle`; 488 is `waiting` and no emote is drawn

### Requirement: SDD take 2, answered and approved
Six answer tokens filled `color.state.caller` SHALL travel from the balloon, one per question row; on its arrival frame each SHALL be gone while its row gains its tail check. At 576 the `GO` stamp SHALL pop onto the sheet. Visor SHALL not act during the answers.

#### Scenario: First answer
- **GIVEN** frames 491, 492 and 514
- **WHEN** answer 0 and row 1 are read
- **THEN** 491 has no answer token; 492 has it at the start of `answer-0`; 514 has no token and row 1 has its check

#### Scenario: All answered, then GO
- **GIVEN** frames 564, 575 and 576
- **WHEN** the sheet and the stamp are read
- **THEN** 564 has six checked rows and no stamp; 575 has no stamp; 576 has the `GO` stamp entering

### Requirement: SDD take 2, implemented from the sheet
At 590 Visor's face SHALL become `idle` and it SHALL point at the code; path P2 fades out and path P3 fades in over 590 to 600; the code panel gains its eight lines at 612 to 654, six frames apart; at 660 Visor's face SHALL become `done` and the `worked` emote SHALL pop in beside its head and stay.

#### Scenario: Implementation frames
- **GIVEN** frames 589, 590, 611, 612, 654 and 660
- **WHEN** the state is read
- **THEN** 589 is `waiting` without pointing and 0 lines; 590 is `idle` pointing; 611 has 0 lines; 612 has 1; 654 has 8; 660 is `done` with the `worked` emote entering

### Requirement: SDD final still
Every frame from the outro (690) to the last (779) SHALL be identical: no breathing, blinking, pop-in or fade in progress. The scene SHALL hold at least `motion.readingHold` frames (3 s at 30 fps).

#### Scenario: Final hold identical
- **GIVEN** the stage trees and the composition-pixel layer states of frames 690 to 779
- **WHEN** each is compared with frame 690
- **THEN** all are deep-equal

#### Scenario: Last movement before the hold
- **GIVEN** frames 689 and 690
- **WHEN** the `worked` emote's appearance is read
- **THEN** 689 is still settling (scale not exactly 1) and 690 is exactly settled

### Requirement: SDD cast rules
Visor SHALL be the scene's only character, drawn at scale 1.15 on the ground line y 440 (stage units), never recoloured, with opacity 1 from its settled pop-in; its expression SHALL change only at the five face frames and its action parameters (`points`, the held sheet) only at its acts or by a row's arrival or check. Emotes sit beside the head, never over the screen face.

#### Scenario: Expression changes only at face frames
- **GIVEN** every pair of consecutive frames
- **WHEN** Visor's expression differs between them
- **THEN** the later frame is one of 270, 344, 488, 590, 660

#### Scenario: Actions only inside acts
- **GIVEN** every pair of consecutive frames
- **WHEN** Visor's `points` or held sheet differs between them
- **THEN** the later frame is inside an act, or is a `?` arrival or an answer arrival frame

#### Scenario: Emote beside the head
- **GIVEN** frames 300 and 700
- **WHEN** the emote's box and Visor's screen face (431.7–528.3 × 292.8–352.6) are compared
- **THEN** they do not intersect

#### Scenario: One character, same skin
- **GIVEN** the stage trees of every key frame
- **WHEN** the cast pieces are listed
- **THEN** only `visor` appears, once, with scale 1.15, y 440, `surface` light, and no fill overriding its body

### Requirement: SDD built from package pieces
The scene SHALL draw only through the package's pieces (`speechBubble`, `questionToken`, `codePanel`, `visor`, `stamp`, `countBadge`, `uiIcon`, `emote`), `pose`, and the components `Rings`, `MotionPath`, `Arrow` and `PositionedToken`. Its files SHALL contain no colour literal and SHALL create no SVG shape of their own.

#### Scenario: No shape of its own
- **GIVEN** the files under `src/scenes/sdd-without-with-spec/`
- **WHEN** a test reads them
- **THEN** none calls `el(` with `path`, `rect`, `circle`, `ellipse`, `line`, `polygon` or `polyline`, and none contains a JSX element of those tags

#### Scenario: No colour literal
- **WHEN** the colour-literal test scans `src/scenes/`
- **THEN** it reports nothing for the new scene's files

### Requirement: SDD layout and layers
The scene SHALL use the stage layout of the change's design §6 in 960x540 stage units drawn at 1920x1080, with its layer order. No travelling `?` or answer SHALL overlap Visor's screen face; the held sheet's label SHALL clear the balloon; the stamp SHALL clear every row mark.

#### Scenario: Layout equals the design
- **GIVEN** the design §6 tables transcribed in the test
- **WHEN** they are compared with the scene's layout data
- **THEN** every position, size, scale and route is equal

#### Scenario: Tokens clear the face
- **GIVEN** each `guess`, `ask` and `answer` route sampled at 100 points by length, with each token's radius in stage units
- **WHEN** each disc is compared with Visor's screen face
- **THEN** none intersects it

#### Scenario: Label and stamp clearances
- **GIVEN** the derived label pill (194.8–367.3 × 157.1–198.5), the balloon (bottom 150) and the stamp (centre (281, 428), radius 28)
- **WHEN** they are compared with the balloon and the six row marks (radius 13 × 1.15)
- **THEN** the pill does not touch the balloon and the stamp touches no row mark

#### Scenario: Stills reviewed (local)
- **GIVEN** the eight stills of design §7
- **WHEN** the owner and the implementer open each PNG
- **THEN** each shows what §7 lists, with no overlap, clipping or unreadable word

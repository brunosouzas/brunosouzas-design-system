## MODIFIED Requirements

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

### Requirement: State-machine and flow catalogue compatibility
The catalogue SHALL register state-machine, message-flow and two-take scenes through the same composition, text, source and phase-range contract, without requiring flow nodes or takes to be active states or hold call slots. The circuit-breaker and publish-subscribe scenes' data, compositions, frame behaviour, pinned timing assertions and existing tests SHALL remain unchanged, except assertions that list every registered scene, which SHALL list them in registration order.

#### Scenario: Both kinds in the catalogue
- **GIVEN** the circuit-breaker and pub-sub scenes
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** both pass and eight unique compositions are returned, circuit-breaker first, pub-sub second; the existing circuit-breaker test suite and pinned timeline pass without edits

#### Scenario: Takes fixture beside the registered scenes
- **GIVEN** the registered scenes followed by the fixture `takes-fixture`
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass and nine unique compositions are returned: the registered scenes' eight unchanged and in order, `takes-fixture-16x9` last; the catalogue itself still registers exactly `circuit-breaker-states` and `publish-subscribe`

#### Scenario: Shared checks still reject a broken flow
- **GIVEN** a pub-sub fixture with a duplicate composition id, a missing English text key or a non-HTTPS source
- **WHEN** catalogue validation runs on each fixture
- **THEN** each is rejected by the corresponding existing shared rule with the scene and offending entry named

## ADDED Requirements

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

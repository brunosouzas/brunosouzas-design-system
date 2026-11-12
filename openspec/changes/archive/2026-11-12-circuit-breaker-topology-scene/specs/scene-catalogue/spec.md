## ADDED Requirements

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
- **THEN** all pass and the registered scenes' compositions are returned unchanged and in order, `takes-fixture-16x9` last, every id unique; the catalogue itself registers exactly `circuit-breaker-states`, `publish-subscribe` and `circuit-breaker-topology`, in that order

#### Scenario: Three scenes in the catalogue
- **GIVEN** the circuit-breaker, pub-sub and `circuit-breaker-topology` scenes, registered in that order
- **WHEN** catalogue checks and composition enumeration run without React or font loading
- **THEN** all pass and nine unique compositions are returned in registration order, `circuit-breaker-topology-16x9` last, and the commands' `available scenes:` line lists the three scenes in that order

#### Scenario: Shared checks still reject a broken flow
- **GIVEN** a pub-sub fixture with a duplicate composition id, a missing English text key or a non-HTTPS source
- **WHEN** catalogue validation runs on each fixture
- **THEN** each is rejected by the corresponding existing shared rule with the scene and offending entry named

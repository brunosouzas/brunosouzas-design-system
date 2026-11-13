# Design: sdd-scene-2-files

See `proposal.md` for the why. This file holds:

- §1 the story;
- §2 the decisions;
- §3 the pieces;
- §4 the beat table, frame by frame;
- §5 the reading choices;
- §6 the layout, the layers and what the layout test proves;
- §7 the stills plan;
- §8 the article lines and the words;
- §9 the open questions, with the recommended answers this change implements.

Observed sources:

- **The gate-0 sheet** `concept-A-files-not-relay.png`, the phone check `phone-check-scene2-A4-A6.png` and `index.md` (brain vault, `evidence/2026-11-13-sdd-cena-2-gate-0/`), drawn on a 960 × 540 frame with the 0.13.0 pieces.
- **The English article** `brunosouzas-content/writing/spec-driven-development-in-practice/spec-driven-development-in-practice.en.md`, last changed by `brunosouzas-content` commit `728d6f4`. Line numbers `Lnn` are that file's; the Portuguese sibling has the same line numbers for every line cited here.
- **The code** at `208b654`: `src/scenes/sdd-request-relay/` (scene 1, the model for the files, layers and tests), `src/scenes/takes-kind.ts`, `src/scenes/catalogue.ts`, `src/pieces/library.ts` (`folder`, `codePanel`, `diagramBox`), `paper.ts` (`sheet`), `stamp.ts`, `supporting-cast.ts` (Balão's held stamp: radius 24, centre (132, −70) in its units), `keyboard.ts`.
- **Text widths:** harfbuzzjs 1.6.4 on `fonts/SourceSans3-Bold.ttf` at 33: `openspec/` 150.4, `proposal.md` 185.6, `design.md` 153.3, `tasks.md` 133.8, `spec.md` 123.1, `NO-GO` 99.1, `GO` 43.6. At 27 (the stamp's own size): `NO-GO` 81.1, `GO` 35.7.

## 1. The story: what the viewer must understand

Scene 1 showed why a request goes through a written list of questions and an owner's `GO`. Scene 2 opens the box: what those files are and what happens to them before any code. On scene 1's stage, Chaves types and an `openspec/` folder appears; the agent proposes and four named files come out of it. `proposal.md` lists six open questions, and the logistics team answers them. Then, with nobody on stage acting, the change is reviewed: four lines are flagged and a red `NO-GO` lands; the next version fixes them; two finer lines are flagged and a second `NO-GO` lands; the fourth version fixes them. Only then does the owner's `GO` land on the change, and only then does the agent write the code. The viewer should leave with L146: "every fix was made in a few lines of markdown, before a single line of code existed", and with L148: approval is the owner's explicit decision.

| State | What is on stage | Changes into the next state when |
|---|---|---|
| S0 set-up | rings; the laptop (screen and keyboard); Balão, Chaves (facing the laptop), Visor | Chaves starts typing |
| S1 init | Chaves types; a command line on the screen; the `openspec/` folder pops above the stage | Chaves stops typing |
| S2 propose | Visor points; `proposal.md`, `design.md`, `tasks.md` and `spec.md` fly out of the folder to a row across the top; the folder leaves | the folder is gone |
| S3 list | six `?` rows appear on `proposal.md`; Visor stops pointing, `waiting` | the last row is drawn |
| S4 answer | Balão speaks; a check on each `?` row | Balão stops speaking |
| S5 review 1 | `spec.md` rows 1–3 and `tasks.md` row 3 are flagged in turn (a `?` and a jolt of the file); `NO-GO` pops on the change | the stamp leaves |
| S6 fix 1 | the four flagged rows get their check | the last check |
| S7 review 2 | `spec.md` row 2 (its check goes) and row 4 are flagged; a second `NO-GO` | the stamp leaves |
| S8 fix 2 | the two rows get their check | the last check |
| S9 approve | Balão holds up its `GO` stamp; the stamp travels to the change and lands; Balão `done` | the stamp has landed |
| S10 apply | Visor points; six code lines appear; Visor `done`, `worked` emote | the final still is held |

## 2. Decisions

### 2.1 A `sequence` kind, not `takes`

The catalogue knows three kinds: the state machine (phases are states, transitions fire), the message flow (nodes, queues, ACK/NACK) and `takes` (take-1 phases, exactly one rewind, take-2 phases; `checkTakes` rejects any other order). This scene is none of them: it runs once, in order, and its three verdicts are three moments of one change.

| Option | Why not, or why |
|---|---|
| `takes` with take 1 = review 1, the rewind, take 2 = review 2 and the GO | a rewind plays the stage backwards: it would say the second version undid the first, and the article says the next version fixed it (L133); a third verdict has no take |
| `takes` with the whole scene in one take | the kind requires a rewind and a take 2 |
| A new kind with its own copies of the cast and hold rules | two copies of one set of rules |
| **A `sequence` kind in `src/scenes/sequence-kind.ts` that runs the `takes` kind's cast and hold checks, exported from `takes-kind.ts` unchanged (chosen)** | ADR 0005's rules (one actor at a time, an emote on its face change, nothing moving in the reading hold) are checked the same way; `takes-kind.ts` changes only by `export` and by skipping the rewind line when a timeline has no rewind |

`sequence-kind.ts` holds:

- `SequenceDevice = "findingMark" | "noGoStamp" | "goStamp"`: the reading devices a phase lists (MOT-1; §5).
- `SequencePhase = { id, from, to, cites, devices?, events }`, as `TakesPhase` without `take`.
- `SequenceTimeline = CueTimeline & { phases: readonly SequencePhase[] }`, where `CueTimeline` (exported by `takes-kind.ts`) is `TakesTimeline` without `phases` and `rewind`: `duration`, `outro`, `ringsFade`, `acts`, `faces`, `emotes`, `trips`, `pops`, `fades`, `leaves`, `cues`.
- `checkSequence(scene, readingHold, settle)`: the scene is neutral ("a sequence scene is neutral"); the outro is at most `duration − readingHold`; no phase starts and no event falls at or after the outro; every phase cites at least one positive integer line; then `checkCast` and `checkHold` of `takes-kind.ts`. The messages are the `takes` kind's, with "sequence" for "takes" in the neutral one.

`checkHold` adds "end of the rewind" only when the timeline has a `rewind`, so the `takes` scenes get exactly the problems they got before. `catalogue.ts` gains `SequenceSceneData` (as `TakesSceneData` with `kind: "sequence"` and the `SequenceTimeline`) in the `CatalogueScene` union, and `checkTimeline` calls `checkSequence` for that kind, after the common checks (phase ranges, order, events inside phases).

### 2.2 Words that read on a phone

As in scene 1 (its design §2.2): the site shows the video 341 px wide, 0.355 px per stage unit; the words' rule is 33 stage units (11.7 px).

- **File names and the folder's name:** `diagramBox` pills with `textSize` 33 on each file's top edge (scene 1's `proposal.md` label), on the folder's front.
- **`NO-GO`:** the `stamp` piece draws its word at 27 whatever the radius. In a group scaled 1.25 the word is 33.75. A round stamp of radius 46 holds the word's box (81.1 × 28.35 at 27, corners 43.8 from the centre) inside its disc; scaled, the disc is 115 units across.
- **`GO`:** Balão's own stamp (radius 24) while Balão holds it (25.65 units, inside Balão's act, exempt like scene 1's held `GO`), in flight (moving, exempt), and landed at scale 1.6 (43.2 units).
- **`?`:** a symbol, not a word: the sheet's question rows draw it at 19 × 0.95 = 18 units, as in scene 1.

### 2.3 A finding is a gesture on a row (q4)

The four findings of L128–L131 and the two of L133 must read without words. The gesture uses the scene's own vocabulary: a row of a file is a line of that file; the `?` already means "a question the text does not answer" (scene 1, and L106–L113 here); a check means "answered" (L120).

- **Flagged:** at the finding's frame the row's lead becomes the sheet's `?` (`lead: "question"`), and the whole file (sheet and label) jolts about its centre for 12 frames: angle `5 · sin(2π(f − a)/6) · (1 − (f − a)/12)` degrees from frame `a` to `a + 11`, 0 otherwise. The jolt is the "brief emphatic motion" of q4; the `?` stays on the row until the fix, so a still shows every open finding of the round.
- **Fixed:** the row's `?` goes and the row gets the sheet's tail check (`lead: "none"`, `tail: "check"`).
- **Each finding to its file and row** (§4.2): what the review found lives in the requirements (`spec.md`, L99) or in the verification tasks (`tasks.md`, L101).

| Finding | Line | File, row |
|---|---|---|
| leading zeros: is `01001` order `1001`? | L128 | `spec.md` row 1 |
| `POST` had no contract | L129 | `spec.md` row 2 |
| "only two fields" contradicted the error responses | L130 | `spec.md` row 3 |
| the verification tasks did not cover the behaviour | L131 | `tasks.md` row 3 |
| "any method other than `GET` gets `405` with a JSON body" included `HEAD` | L133 | `spec.md` row 2 again: the method rule the first fix wrote; its check goes |
| `POST /api/orders/abc/delivery-status` under two rules (`400` and `405`) | L133 | `spec.md` row 4 |

The second round has two flagged rows to the first round's four, and one of them is a row the first fix had checked: "finer details" (L133) is what the viewer sees. The rows are bars; which rule a bar stands for is this design's mapping, not a claim on screen.

### 2.4 The verdicts

- **`NO-GO` has no actor.** The review is Codex, "another agent, in a clean session" (L124), not a cast member, so nobody on stage acts: the stamp pops on the change (a block pop-in at its centre) and leaves when the next version starts. It is `stamp` with `fill: "color.state.failure"` (gate-0 q5): the review failed.
- **`GO` is the owner's.** The article names two reviews, then the fourth version and the owner's approval of that commit (L135, L148); it states no third review. Balão is the owner of the request (ADR 0007, amended 2026-11-12; scene 1), so Balão holds up its stamp (`holdsStamp: { word: "GO" }`, the approval green), then the stamp leaves its hand and travels to the change, growing from the cast scale to 1.6, and stays.
- **Where the stamps land:** on the change, across the gap between `design.md` and `tasks.md`, centre (516, 190): over the lower rows of both, clear of every flagged row (§6.3).

### 2.5 Stage units, pop-ins and when an element is drawn

As in scene 1 (its §2.3 and §2.8): the pieces are laid out in **960 × 540 stage units** in an SVG with `viewBox="0 0 960 540"` over the 1920 × 1080 composition; `Rings` and `MotionPath` are drawn in composition pixels (stage × 2), below the stage layers. Blocks pop with `blockPopIn`; an element popping at frame *a* is drawn from *a* + 1 (opacity above 0 and scale above 0.001) and exactly settled from *a* + `motion.fps`. A cast piece pops through `pose`. `leave(f, at)` (10 frames) multiplies the opacity of an element that leaves. The `worked` emote never leaves and is drawn from its own frame, its scale floored at the piece's minimum on that frame (scene 1's rule).

A file in flight is drawn from its trip's first frame at its point on the route, scaled about its centre by `0.4 + 0.6 · p` (p the trip's progress, 0 to 1), with its label; from its arrival frame it is parked at its slot at scale 1. The `GO` stamp in flight is drawn the same way at scale `0.95 + 0.65 · p`, rotated as the stamp piece draws it (−12°).

### 2.6 Registration order

| Option | Result |
|---|---|
| Register last, after `circuit-breaker-topology` | the topology requirement's scenario "One composition, last" and its test become false; a MODIFIED block of a requirement of another article's scene |
| Before `sdd-request-relay` | scene 1's "right after `publish-subscribe`" becomes false; the article's scenes out of order |
| **Right after `sdd-request-relay`, before `circuit-breaker-topology` (chosen)** | the article's scenes stay together and in order; the topology scene stays last and its requirement and tests stay true and unedited; scene 1's scenario "One composition, before the topology scene" and two of its test assertions name the scene that now follows it |

Edits outside this scene's files:

- `test/scenes/catalogue-flow.test.ts`: "Takes fixture beside the registered scenes" (the five ids), "Three scenes in the catalogue" (the earlier scenes' order), "Four scenes in the catalogue" (the four keep their order) and a new "Five scenes in the catalogue"; the two `available scenes:` lines of `test/scripts/cli.test.ts`. These are the MODIFIED requirement's scenarios.
- `test/scenes/sdd-request-relay-catalogue.test.ts`: in "One composition, before the topology scene", `entries[9]` becomes `sdd-scene-2-files-16x9` and `entries[10]` `circuit-breaker-topology-16x9`; in "Other scenes' tests untouched", the list of scene ids gains `sdd-scene-2-files`.
- `openspec/changes/sdd-scene-1-relay/specs/scene-catalogue/spec.md`, scenario "One composition, before the topology scene": "and right before `circuit-breaker-topology-16x9`" becomes "and before `circuit-breaker-topology-16x9`, with only `sdd-scene-2-files-16x9` between them". That change is merged but not archived (the owner archives it after G3); its scenario must stay true for its own archive.

### 2.7 The timeline's data shape

The scene's timeline is `FilesTimeline = SequenceTimeline & { … }` in the scene's `timeline.ts`.

| Field | What it holds |
|---|---|
| `acts`, `faces`, `emotes`, `trips`, `pops`, `fades`, `leaves`, `cues` (CueTimeline) | §4 |
| `actions` | the cast's action changes: `{ actor, at, set }`, `set` a subset of `speaks`, `holdsStamp`, `types`, `points` (§4.2) |
| `rows` | each row change of a file: `{ file, row, at, to }`, `file` one of `proposal`, `design`, `tasks`, `spec`, `row` 1-based, `to` one of `question`, `answered`, `checked`, `flagged` (§4.2) |

A row's state at frame *f* is its last change at or before *f*, `plain` before any. `flagged` draws as `question` (a `?` lead, no tail); `answered` as a `?` lead with the tail check; `checked` as no lead with the tail check. Every row change is also a `cues` entry, and every finding's change starts a jolt of its file. `makeTimeline(travel, fade)` builds the timeline, so a change of `motion.travel` or `motion.fade` moves the arrivals and fades and fails the pinned beat-table test.

## 3. Pieces and components (MOT-6, CAST-1)

| On stage | Drawn with |
|---|---|
| Balão (the logistics team: requester and approver, owner of the request) | `balao` (`facing` right, `speaks`, `holdsStamp` `{ word: "GO" }`), posed with `pose` for the pop-in |
| Chaves (developer) | `chaves` (`facing` right, `types`) |
| Visor (AI agent) | `visor` (`facing` left, `points` always explicit) |
| laptop | `codePanel` (screen) and `keyboard` (its base; Chaves's own keyboard replaces it while he types) |
| `openspec/` | `folder` at scale 0.9; its name a `diagramBox` pill (`textSize` 33) on its front |
| the four files | `sheet` at scale 0.95, each named by a `diagramBox` pill (`textSize` 33) on its top edge |
| findings, answers, fixes | the `sheet`'s own row leads (`question`) and tail checks |
| `NO-GO` | `stamp` (radius 46, `fill` `color.state.failure`, word `NO-GO`) in a group scaled 1.25 |
| `GO` | Balão's held `stamp`, then the `stamp` piece (radius 24, word `GO`) in a group scaled 0.95 to 1.6 |
| reaction | `emote` (`worked`) |
| motion guide | `MotionPath` (the `GO` trip) |
| stage rings | `Rings` |

The `book` piece is not used: the article's change is a folder of files (L89–L96), and every file is a `sheet`, as `proposal.md` was in scene 1. The scene's files contain no colour literal and create no SVG shape of their own.

## 4. Beat table

Constants: `motion.fps` 30, `motion.travel` (T) 22, `motion.fade` (F) 10, `motion.readingHold` 90, jolt 12 frames. Duration **870** frames (29 s), outro **770**, final hold 770–869 (100 frames).

### 4.1 Phases

| # | Phase id | Frames | Cites (English lines) | Devices |
|---|---|---|---|---|
| 1 | `setup` | 0–39 | 20, 26 | — |
| 2 | `init` | 40–89 | 44, 47, 50 | — |
| 3 | `propose` | 90–149 | 86, 89, 98, 99, 100, 101 | — |
| 4 | `list` | 150–209 | 103, 106, 108, 109, 110, 111, 112, 113 | — |
| 5 | `answer` | 210–279 | 118, 120 | — |
| 6 | `review-1` | 280–409 | 124, 126, 128, 129, 130, 131 | findingMark, noGoStamp |
| 7 | `fix-1` | 410–459 | 133, 146 | findingMark |
| 8 | `review-2` | 460–559 | 133 | findingMark, noGoStamp |
| 9 | `fix-2` | 560–599 | 135, 146 | findingMark |
| 10 | `approve` | 600–669 | 34, 124, 148 | goStamp |
| 11 | `apply` | 670–769 | 152, 154, 157, 158, 159, 160, 161, 162 | — |

Every phase's `events` are the change frames of §4.2 that fall inside it, sorted by frame and then by id.

### 4.2 Frame table (frames, element, action, article line)

| Frames | Element | Action | Line |
|---|---|---|---|
| 0–20 | rings | fade in | — |
| 2 | laptop (screen, empty; keyboard) | pops (block) | L26 |
| 4 / 6 / 8 | Balão / Chaves (facing right) / Visor (`points` false) | pop (block, through `pose`) | L20, L26 |
| 40 | Chaves | act: `types` on | L26, L44 |
| 46 | screen | the command line (accent, tall) appears | L47, L86 |
| 52 | folder `openspec/` | pops (block), with its name | L50, L53 |
| 84 | Chaves | act: `types` off | L44 |
| 90 | Visor | act: `points` on | L86 |
| 96 / 102 / 108 / 114 | `proposal.md` / `design.md` / `tasks.md` / `spec.md` | departs the folder on route `file-<name>`; arrives T later (118 / 124 / 130 / 136) at its slot | L89–L96, L98–L101 |
| 140 | folder | leaves (gone 150) | device (§5) |
| 154 + 8j, j = 0…5 | `proposal.md` row j + 1 | appears, a `?` row (`question`) | L103, L106–L113 |
| 202 | Visor | act: `points` off; face `waiting` | L116 |
| 210 | Balão | act: `speaks` on | L120 |
| 218 + 8k, k = 0…5 | `proposal.md` row k + 1 | its check (`answered`) | L120 |
| 266 | Balão | act: `speaks` off | L120 |
| 290 | `spec.md` row 1 | `flagged`; `spec.md` jolts 290–301 | L128 |
| 308 | `spec.md` row 2 | `flagged`; jolt 308–319 | L129 |
| 326 | `spec.md` row 3 | `flagged`; jolt 326–337 | L130 |
| 344 | `tasks.md` row 3 | `flagged`; `tasks.md` jolts 344–355 | L131 |
| 364 | `NO-GO` 1 | pops (block) at (516, 190) | L124, L126 |
| 410 | `NO-GO` 1 | leaves (gone 420) | L133 ("the next version") |
| 428 / 434 / 440 / 446 | `spec.md` rows 1, 2, 3; `tasks.md` row 3 | `checked` | L133 ("fixed all four") |
| 470 | `spec.md` row 2 | `flagged` (its check goes); jolt 470–481 | L133 (`HEAD`) |
| 494 | `spec.md` row 4 | `flagged`; jolt 494–505 | L133 (`400` or `405`) |
| 514 | `NO-GO` 2 | pops (block) at (516, 190) | L133 ("also NO-GO") |
| 560 | `NO-GO` 2 | leaves (gone 570) | L135 |
| 578 / 584 | `spec.md` rows 2, 4 | `checked` | L135 |
| 606 | Balão | act: `holdsStamp` `{ word: "GO" }` on | L148 |
| 626 | Balão | act: `holdsStamp` off; face `done` | L148 |
| 626 | `GO` | departs Balão's hand on route `go`, scale 0.95; arrives 648 at (516, 190), scale 1.6, and stays | L34, L124, L148 |
| 626–636, 648–658 | guide `go` | fades in, fades out | device |
| 676 | Visor | act: `points` on | L152 |
| 682 + 8j, j = 0…5 | screen | code line j + 1 appears | L154, L157–L162 |
| 736 | Visor | face `done`, `worked` emote (stays) | L152, L167 |
| 770–869 | everything | still | SCN-4 |

**Acts** (inclusive ranges): Chaves 40–84; Visor 90–90, 202–202, 676–676; Balão 210–266, 606–626.

**Faces:** Visor `waiting` 202, `done` 736; Balão `done` 626. **Emotes:** `worked` (Visor, 736, never leaving).

**Pops:** `laptop` 2, `balao` 4, `chaves` 6, `visor` 8, `folder` 52, `noGo1` 364, `noGo2` 514. **Fades:** `go-guide` in 626–636, out 648–658. **Leaves:** `folder` 140, `noGo1` 410, `noGo2` 560.

**Trips:** `file-proposal` 96, `file-design` 102, `file-tasks` 108, `file-spec` 114, `go` 626; each ends T frames after it starts.

**Cues:** `commandLine` 46; `rows` 154 … 194; `answers` 218 … 258; `findings1` 290, 308, 326, 344; `fixes1` 428, 434, 440, 446; `findings2` 470, 494; `fixes2` 578, 584; `joltEnds` each finding + 12 (302, 320, 338, 356, 482, 506); `codeLines` 682 … 722; and every action frame.

**Row changes** (`rows`, §2.7): `proposal` rows 1–6 `question` at 154 + 8(k − 1) and `answered` at 218 + 8(k − 1); `spec` row 1 `flagged` 290, `checked` 428; `spec` row 2 `flagged` 308, `checked` 434, `flagged` 470, `checked` 578; `spec` row 3 `flagged` 326, `checked` 440; `tasks` row 3 `flagged` 344, `checked` 446; `spec` row 4 `flagged` 494, `checked` 584. `design` rows 1–3, `tasks` rows 1, 2, 4 and `spec` row 5 stay `plain`.

### 4.3 Routes (stage units)

`C_k` is file k's slot centre: (199, 141), (419, 141), (613, 141), (792, 141) for `proposal`, `design`, `tasks`, `spec`; the folder's centre is (480, 139.1).

| Route | Path |
|---|---|
| `file-<name>` (the file's centre) | `M 480,139.1 C 480,40 C_k.x,40 C_k.x,141` |
| `go` (the stamp's centre) | `M 229.4,409.5 C 300,300 420,190 516,190` |
| guide `go` | the `go` route |

An object travels its route in T frames, linear by length, and is drawn from the trip's start frame up to the frame before its arrival; at arrival it is parked at the route's end. The guide is drawn × 2 in composition pixels by `MotionPath`.

## 5. Reading choices (MOT-1) and out-of-scope outcomes

Approved at gate 0 (2026-11-13): concept A (q1); no relay (q2); two separate NO-GO rounds (q3); findings as gestures (q4); no new pieces, `NO-GO` on the `stamp` in the failure colour (q5).

Made in this design, for G3 (§9): the `sequence` kind; who gives each verdict; the finding as a `?` and a jolt, the fix as a check (devices `findingMark`); the `NO-GO` stamp popping with no actor (`noGoStamp`); Balão's `GO` travelling to the change (`goStamp`, scene 1's q49 B device); no round number; the folder leaving; one typing act; the answer beat; the length (29 s); the stamp sizes; `waiting` after listing and `done` with `worked` after implementing (scene 1's faces).

Out of scope, because the article does not state them: a third review's verdict; the third version; who fixed the change; version numbers; the words of the findings; the proof; the archive.

## 6. Layout (stage units, 960 × 540; composition = × 2)

### 6.1 Elements

| Element | Piece and parameters | Position |
|---|---|---|
| cast | `scale` 0.95 (CAST-5) | ground y 476; Balão x 104, Chaves x 505, Visor x 852 (scene 1's) |
| screen | `codePanel` w 162, h 124, top 20, step 15 | x 584, y 258; pop anchor (665, 320) |
| command line | `{ indent 0, w 96, color "white", tall }` | first line |
| code lines | widths 46, 78, 66, 106, 58, 99; indents 0, 16, 0, 16, 0, 16; `color` "white" | after the command line (the `if` / result pairs of L157–L162) |
| keyboard | `keyboard` width 150 in Chaves's units at (98, −74) | as scene 1 |
| folder | `folder` x 394.5, y 50, scale 0.9 (171 × 178.2) | centre (480, 139.1); pop anchor its centre |
| folder name | `diagramBox` pill w 172, h 44, `textSize` 33, fill `color.white`, `["openspec/"]` | centred (480, 162.5), on the folder's front |
| files | `sheet` 160 × 200, top 32, step 23, at scale 0.95 (152 × 190) | top-left (123, 46), (343, 46), (537, 46), (716, 46) |
| file names | `diagramBox` pills h 44, `textSize` 33, fill `color.white`; w 206, 174, 154, 144 | centred on each top edge: (199, 46), (419, 46), (613, 46), (792, 46) |
| rows | `proposal` bars 56, 44, 60, 50, 58, 40; `design` 96, 70, 84; `tasks` 80, 66, 56, 74; `spec` 58, 50, 60, 54, 46 | row k's centre y = 86.85 + 21.85(k − 1); its `?` at x = file left + 28.5 |
| `NO-GO` | `stamp` r 46, `fill` `color.state.failure`, word `NO-GO`, × 1.25 | centre (516, 190) |
| `GO` | `stamp` r 24, word `GO`; × 0.95 in flight, growing to × 1.6 | from (229.4, 409.5) (Balão's held stamp) to (516, 190) |
| emote `worked` | `emote` scale 0.75 | (800, 292) |
| rings | `Rings` | centre (960, 540) composition pixels |

### 6.2 Layers (SCN-6) and cast body boxes

From the bottom: 1 `Rings`; 2 `MotionPath` `go`; 3 stage `below`: keyboard, screen; 4 stage `folder`: the folder, its name; 5 stage `files`: `proposal`, `design`, `tasks`, `spec` (each sheet with its name); 6 stage `cast`: Visor, Chaves, Balão; 7 stage `verdicts`: `no-go-1`, `no-go-2`, `go`; 8 stage `above`: the emote. Every element sits in a group with a `data-element` name.

Cast body boxes (scene 1's): Balão x 45.1–193.3, y 322.1–476; Chaves x 419.5–590.5, y 333.5–476; Visor x 789.3–914.7, y 341.1–476.

### 6.3 What the layout test proves

1. **Layout equals the design:** the values of §6.1 and §4.3.
2. **Minimum size:** the folder name and the file names at 33, `NO-GO` at least 33 settled, the landed `GO` at least 33; a smaller `GO` only inside Balão's act 606–626 or in flight 626–647; the `?` not checked (a symbol); a file's name in flight not checked.
3. **Boxes:** a word's box is its advance width × its effective size, placed by its anchor, from 0.8 × size above the baseline to 0.25 × size below it (`test/scenes/text-measure.ts`); a pill's box is its body; a stamp's box is its disc's square.
4. **Inside the frame:** every box lies inside x 12–948 and y 12–528.
5. **No overlaps:** no two of the folder name, the file names and the stamps intersect, none intersects a cast body box, and no stamp's disc intersects a flagged row's `?` disc.
6. **When it runs:** every frame from 0 to 869 except an element before *a* + `motion.fps` from its pop-in at *a*, during its 10-frame leave, a file and its name in flight or jolting, the folder name from the first file's departure (96), and `GO` before it lands (648).

If a value of §6.1 fails 2–5, the implementer changes it here and in the spec in the same commit and lists it for the owner.

## 7. Stills plan (MOT-5)

`npm run stills -- sdd-scene-2-files` renders the phase ends and the last frame: **39, 89, 149, 209, 279, 409, 459, 559, 599, 669, 769, 869** (12 PNGs). The implementer also renders these frames with `npx remotion still`:

| Frame | What it checks |
|---|---|
| 70 | Chaves typing, the folder |
| 110 | the files flying out of the folder |
| 294 | the first jolt, `spec.md` row 1 flagged |
| 380 | review 1: four flagged rows and `NO-GO` |
| 530 | review 2: two flagged rows and the second `NO-GO` |
| 616 | Balão holding up `GO` |
| 637 | `GO` in flight |
| 700 | the code being written |

Every PNG is opened and checked for the cast (CAST-3, CAST-4, CAST-5), overlaps, clipping and contrast. Sheets in `docs/spikes/2026-11-13-sdd-scene-2-files/`:

- **the stills sheet** of the 12 stills and the 8 frames above;
- **a phone sheet:** the 12 stills at **341 CSS px** wide (device pixel ratio 3); the file names, `NO-GO` and `GO` must read;
- after the render, **the web-MP4 sheet:** the 12 frames extracted from `out/web/sdd-scene-2-files-16x9.mp4` with `npx remotion ffmpeg -ss <t> … -frames:v 1`, laid out in an HTML grid and captured with headless Chrome, plus the same at 341 CSS px.

## 8. Article lines (English)

| Line | What it supports |
|---|---|
| L20 | the logistics team (Balão) |
| L26 | developers (Chaves) and an AI agent (Visor) |
| L34 | the person who approves the spec decides |
| L44, L47 | it all starts with one command, `openspec init` |
| L50, L53 | the result is an `openspec/` folder |
| L86 | the request went to Claude with `/opsx:propose`; what comes out is a change |
| L89–L96 | the change's tree: `proposal.md`, `design.md`, `tasks.md`, `specs/delivery-status/spec.md` |
| L98–L101 | what each file holds; `design.md` "stayed a few lines long"; `tasks.md` lists the work and how each task is verified |
| L103 | the proposal listed what the sentence didn't answer |
| L106–L113 | `## Open Questions`, six numbered questions (L107 is blank) |
| L116 | the questions, addressed to the people who can answer them |
| L118, L120 | "Answer, review, approve"; the logistics team answered the six questions |
| L124 | an independent review by another agent; the verdict was GO or NO-GO |
| L126 | the first verdict was NO-GO, four major findings |
| L128–L131 | the four findings |
| L133 | the next version fixed all four; the second review, also NO-GO, over `HEAD` and the `400`/`405` precedence |
| L135 | the fourth version closed both points |
| L146 | two rejections; every fix in a few lines of markdown, before any code |
| L148 | approval applies to a specific commit; only the owner's explicit decision releases the implementation |
| L152 | the agent implements what the tasks say and nothing more (`/opsx:apply`) |
| L154, L157–L162 | the DataWeave transformation; the order of the checks mirrors the spec |
| L167 | each line recognised: method first, then the format, then `404` |

### 8.1 Words on screen

| Words | Lines |
|---|---|
| `openspec/` | L50, L53 |
| `proposal.md`, `design.md`, `tasks.md`, `spec.md` | L90–L92, L95, L98–L101 |
| `NO-GO` | L124, L126, L133 |
| `GO` | L124, L148 (scene 1's approval device, q49 B) |
| `?` | L106–L113 (a symbol) |

## Risks / trade-offs

- **The `?` reads small on a phone** (8.8 px disc), as in scene 1; the jolt draws the eye to the file first. The phone sheet is the check.
- **Nobody on stage acts during the reviews (280–599).** That is the article: the reviewer is not a character. The jolts and the stamps carry the motion; the video is the check.
- **A row's bar shifts right by 30 units when it is flagged** (the sheet's `?` lead moves the bar) and back when fixed. It underlines the change of state.
- **The stamps cover the lower rows of `design.md` and `tasks.md`.** No flagged row is under them (§6.3 item 5).

## Migration

None for consumers: scenes are not in the package. `takes-kind.ts` only gains exports.

## 9. Open questions

The owner follows the recommendations and judges the scene on the video (G3); this change implements each recommended answer, and the same list is in `proposal.md` and the pull request.

1. **A new `sequence` kind** (§2.1). Recommended: accept.
2. **`NO-GO` with no actor, `GO` from Balão** (§2.4). Recommended: keep.
3. **A finding is a `?` and a jolt; a fix is a check** (§2.3). Recommended: keep.
4. **No round number on screen.** Recommended: no badge.
5. **Gate-0 frame 8 (the proof) folded into the final still.** Recommended: accept.
6. **Registration right after `sdd-request-relay`** and the edits it needs in scene 1's test and unarchived spec (§2.6). Recommended: accept.
7. **The folder leaves once the files are out.** Recommended: keep.
8. **`NO-GO` in the failure red** (gate-0 q5). Recommended: keep.
9. **One typing act and one command line for `init` and `propose`.** Recommended: keep.
10. **The answer beat** (L120). Recommended: keep.
11. **Length 29 s** (870 frames, final still 100 frames). Recommended: accept.
12. **Stamp sizes** (§2.2). Recommended: accept.

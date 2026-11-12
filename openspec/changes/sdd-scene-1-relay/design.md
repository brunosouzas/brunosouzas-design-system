# Design: sdd-scene-1-relay

See `proposal.md` for the why. This file holds:

- §1 the story;
- §2 the decisions;
- §3 the pieces;
- §4 the beat table, frame by frame;
- §5 the reading choices;
- §6 the layout, the layers and what the layout test proves;
- §7 the stills plan;
- §8 the article lines;
- §9 the open questions for G1, with the recommended answers this change implements.

What was observed is marked with its file; what is assumed is marked "assumed".

Observed sources:

- **The gate-0 sheet** `concept-A-two-takes-relay.png` and the phone check `phone-check-A1-A7.png` (brain vault, `evidence/2026-11-12-sdd-cena-1-gate-0-v2/`), and the prototype `~/.hermes/cache/scratch/ab144-scene1-v2/` (`lib.ts`, `stage.ts`, `concept-a.ts`), drawn on a 960 × 540 frame with the 0.13.0 pieces. A layout spike for this design is `v3.ts` in the same folder.
- **The English article** `brunosouzas-content/writing/spec-driven-development-in-practice/spec-driven-development-in-practice.en.md` at commit `728d6f4` (2026-11-05). Line numbers `Lnn` are that file's, checked one by one (§8).
- **The code** at `1505477` (0.13.0): `src/scenes/takes-kind.ts`, `src/scenes/circuit-breaker-topology/` (the first `takes` scene, the model for this one), `src/pieces/supporting-cast.ts`, `brand-cast.ts`, `paper.ts`, `stamp.ts`, `keyboard.ts`, `question-token.ts`.
- **The site's article column:** 341 px wide on a 360 px phone (measured for the circuit-breaker topology scene, its design §2.2).
- **Text widths:** harfbuzzjs 1.6.4 on `fonts/SourceSans3-Bold.ttf`: `proposal.md` at 33 is 185.6 units; `GO` at 33 is 43.6.

## 1. The story: what the viewer must understand

One request, played twice on one stage. **Take 1:** the logistics team (Balão) asks the developer (Chaves) for something, and six open questions ride along with the request. Chaves types it to the AI agent (Visor) at their shared laptop, and the questions go in with it. Visor writes the code alone; the questions sink into the code, answered by nobody. It works, until the first error comes back to the logistics team, who never saw those decisions. **Take 2,** after a rewind: the same request, the same relay. This time Visor writes the questions down in `proposal.md` instead of choosing; Chaves takes the sheet to the people who can answer; Balão answers each one and stamps `GO`; the approved sheet goes back to the laptop, and only then does Visor implement. The viewer should leave with L34: "the person who approves the spec decides what the system does".

| State | What is on stage | Changes into the next state when |
|---|---|---|
| S0 set-up | rings; the laptop (screen and keyboard) between Chaves and Visor; Balão, Chaves (facing Balão), Visor; badge `1` | Balão starts speaking |
| S1 request | Balão speaks (the accent request line on its belly); six `?` travel from its tail to a row above Chaves | the last `?` arrives |
| S2 relay | Chaves turns to the laptop and types; the request line (accent) appears on the screen; the `?` hop into a row inside the screen | Chaves stops typing |
| S3 code alone | Visor points at the screen; six code lines appear and each `?` sinks into the code; Visor `done` | Visor's face changes |
| S4 error | a red failure arrow from the code to Balão; Balão `failed`, `problem` emote, fright pose; then Visor `failed` | the rewind mark appears |
| S5 rewind | take 1 plays backwards, the cast included; badge `2` | take 2 starts |
| S6 request and relay again | as S1 and S2, 400 frames later | Chaves stops typing |
| S7 list | Visor points; `proposal.md` pops above the screen; each `?` rises from the screen into the sheet and becomes a question row; Visor stops pointing, `waiting` | the last row is drawn |
| S8 carry | Chaves turns to Balão; the sheet travels into his hand | Chaves holds it |
| S9 answer | Balão speaks; a check on each row; Balão holds the stamp to the sheet; the `GO` mark stays on it; Balão `done` | Balão puts the stamp away |
| S10 return | Chaves lets go; the sheet travels back above the screen; Chaves faces the laptop | the sheet is back |
| S11 implement | Visor points; six code lines appear; Visor `done`, `worked` emote | the final still is held |

## 2. Decisions

### 2.1 PR #41's history and this change

PR #41 (draft) held the old scene 1 and its archived change `sdd-without-with-spec-scene`. Its infrastructure (neutral scenes, the `takes` kind, `MotionPath`) reached `main` through PR #45, and the circuit-breaker topology scene (#44) and the supporting characters (#43) followed, released in 0.13.0. The owner asked to keep #41 and its published history (no force push).

- `origin/main` is merged into the branch with a merge commit; conflicts in shared files take `main`'s version, since `main` holds the reviewed infrastructure.
- A new commit removes the old scene's code, tests, evidence and archived change. None of it reached `main`, so nothing is lost, and the branch's tree equals `main` before this change starts.
- This change, `sdd-scene-1-relay`, is a new folder. The old change name would describe the old concept.

### 2.2 A larger sheet that reads on a phone (q80 A)

The site shows the video about 341 px wide on a 360 px phone: 0.355 px per stage unit. The circuit-breaker topology scene's rule is 33 stage units for words (11.7 px) and 36 for state names and take numbers (12.8 px). On the gate-0 sheet, `proposal.md` was drawn by the held sheet's `pill` at `cover.labelSize` 19 times the cast scale 0.95: 18 units, 6.4 px.

| Option | Why not, or why |
|---|---|
| Scale the whole cast up so the held label reaches 33 (scale 1.74) | three characters and a laptop no longer fit on one 960-unit stage |
| Draw the sheet as a prop at its own larger scale (1.74) | the sheet would jump in size when Chaves takes it, since `holdsSheet` draws at the holder's scale; at 1.74 it is 410 units tall and fits nowhere above the screen |
| **Draw the sheet at the cast scale but wider (180 × 226 sheet units, against 150 × 236), without the held sheet's own label, and add the label as a `diagramBox` pill with `textSize` 33 on its top edge, wherever the sheet is (chosen)** | the same drawing on the desk, in flight and in Chaves's hand; `proposal.md` at 33 (11.7 px); the pill (206 units) is 35 units wider than the sheet (171), like a tab |

- **`GO`:** the mark that stays on the sheet is the `stamp` piece (radius 24) in a group scaled 1.25: its word is 27 × 1.25 = 33.75 units. Balão's own held stamp (`holdsStamp`) draws `GO` at 27 × 0.95 = 25.7 units; it is on screen only during Balão's stamping act (816–835) and is exempt, like any word in motion (G1 question 3).
- **Take numbers:** `countBadge` at `textSize` 36, as in the topology scene.
- **`?`:** the question mark is a symbol, not a word: the `questionToken` and the sheet's question rows draw it at 19 × 0.95 = 18 units (6.4 px) in a disc of 24.7 units (8.8 px). The token is exactly a sheet row's mark (`question-token.ts`), so it stays at the cast scale and becomes a row without a jump. It is checked on the phone sheet (G1 question 4).

### 2.3 Stage units

As in the topology scene (its design §2.3), the pieces are laid out in **960 × 540 stage units**, in SVG with `viewBox="0 0 960 540"`, filling the 1920 × 1080 composition. `Rings` and `MotionPath` read composition-pixel tokens (`scene.*`) and are drawn at stage coordinates × 2, below the stage layers. The scene uses no other React component.

### 2.4 Registration order (G1 question 6)

| Option | Result |
|---|---|
| Register last, after `circuit-breaker-topology` | the topology requirement's scenario "One composition, last" and its test become false; a MODIFIED block and an edit of the topology scene's catalogue test |
| **Register after `publish-subscribe`, before `circuit-breaker-topology` (chosen)** | the topology scene's requirement and tests stay true and unedited ("after every scene registered before it", "the last one is `circuit-breaker-topology-16x9`"); only the assertions that list every scene change |

The one MODIFIED requirement is "State-machine and flow catalogue compatibility": its scenario "Takes fixture beside the registered scenes" names the registered scenes; "Three scenes in the catalogue" now checks that the three earlier scenes keep their relative order with the topology scene last (a MODIFIED block cannot drop a scenario); and "Four scenes in the catalogue" is added. The allowed edits are `test/scenes/catalogue-flow.test.ts` (those two tests) and the two `available scenes:` lines of `test/scripts/cli.test.ts`.

### 2.5 `withSansFamily` moves to `src/brand/svg-fonts.ts`

The pieces name the sans face `tokens.font.sans` ("Source Sans 3", ADR 0008), while `@remotion/google-fonts` registers it as "Source Sans Three"; without the mapping every SVG word of a video falls back to Helvetica (the topology scene's code review round 1). This scene draws words in SVG too.

| Option | Why not, or why |
|---|---|
| Copy the function into this scene | two copies of one fix |
| Import it from `circuit-breaker-topology/stage.ts` | one scene depending on another scene's file |
| **Move it to `src/brand/svg-fonts.ts` (no React, no Remotion), import it in both scenes; the topology `stage.ts` re-exports it (chosen)** | one shared function next to the other scene helpers; the topology scene's test imports stay unedited; its stills stay byte-identical (task 6.4) |

### 2.6 Balão and Chaves as actors

`takes-kind.ts` types an actor as one of the five pillar characters. This scene's actors are Balão, Chaves and Visor, so the `Actor` union gains `balao` and `chaves`. The checks do not change: they compare actor names, so the supporting cast gets the same CAST-3 and CAST-4 checks. Nothing else in `takes-kind.ts` changes.

### 2.7 The rewind replays the cast (G1 question 5)

The topology scene has no cast; its rewind plays the object layer backwards. Here the cast acted in take 1, and take 2 must start from the same stage.

| Option | Why not, or why |
|---|---|
| Objects backwards, the cast snaps back to its start pose on one frame | three characters change on one frame (Visor stops pointing, Chaves turns, Balão's face): two or three acts at once, against CAST-4 |
| **Everything on stage except the badge and the rewind mark is drawn from the object frame `o(f)`, so the cast replays its take-1 acts in reverse (chosen)** | a rewind reads as the tape running backwards; take-1 acts never overlap, so their reverse does not either; the reverse acts and faces are declared in the timeline, so the `takes` checks see them |

- `o(f) = f` before 390;
- `o(f) = round(389 − (f − 390) × 340 / 49)` from 390 to 439, so `o(390) = 389` and `o(439) = 49`;
- `o(f) = 49` from 440 to 449.

A take-1 change at frame *a* shows in reverse at the first rewind frame *f* with `o(f) < a`. Emotes are not replayed: they are drawn from the real frame only, and the take-1 emote is gone at 360. The take-1 timeline's acts and faces mapped this way are in §4.3.

**Take 2 starts from the same stage.** Every cast piece and the laptop settle by frame 46, and the first act is at 56, so take-1 frame 49 (where the rewind stops) and frame 50 draw the same stage; take 2 repeats take 1's frames 50–225 at +400 (450–625).

### 2.8 Pop-ins and when an element is drawn

As in the topology scene (its design §2.6): blocks pop with `blockPopIn` and badges with `pillPopIn` (`src/brand/motion.ts`); an element is drawn when its opacity is above 0 and its scale above 0.001, so an element popping at frame *a* first shows at *a* + 1; from *a* + `motion.fps` it is drawn exactly settled. A cast piece pops through `pose` (scale and opacity about its ground point); a piece without a `scale` parameter pops inside a group scaled about its anchor (§6.1). `leave(f, at)` (10 frames) multiplies the opacity of an element that leaves. Emotes pop with `emotePop` and leave with `leave`.

### 2.9 The held sheet and its content

Chaves holds the sheet with `holdsSheet` (the sheet units of §2.2, no `label`), so it is drawn by the cast piece. The scene draws the label pill and, after the stamp, the `GO` mark over the held sheet at the same places as on the desk sheet. While Chaves holds it, the rows' checks change: they are the sheet's content, changed by Balão's answers (L120), not an action of Chaves, whose action (holding) does not change between 734 and 851.

When the sheet travels (carry and return), it is drawn as a free prop: the `sheet` piece in a group at the cast scale with the cast's outline, at the trip's point, with its label and mark. At 734 the free sheet and the held sheet are drawn at the same place with the same rows, so the hand-over has no jump; the same at 852.

### 2.10 The timeline's data shape

The scene's timeline type is `RelayTimeline = TakesTimeline & { … }` in the scene's `timeline.ts`; `takes-kind.ts` changes only as §2.6 says.

| Field | What it holds |
|---|---|
| `acts`, `faces`, `emotes`, `trips`, `pops`, `fades`, `leaves`, `cues`, `rewind` (TakesTimeline) | §4; `faces` and `acts` include the reverse entries of §4.3 |
| `actions` | the cast's action changes in real frames of take 1 and take 2: `{ actor, at, set }`, `set` a subset of `speaks`, `holdsStamp`, `facing`, `types`, `holdsSheet`, `points` (§4.2) |
| `poses` | the fright: `{ actor: "balao", at: 316, tilt: -5, squash: -0.07 }` |

Every change is also a `cues` entry or a trip end, so `checkHold` sees it. `makeTimeline(travel, fade)` builds it, so a change of `motion.travel` or `motion.fade` moves the arrivals and fades and fails the pinned beat-table test.

## 3. Pieces and components (MOT-6, CAST-1)

| On stage | Drawn with |
|---|---|
| Balão (logistics team: requester and approver) | `balao` (`facing` right, `speaks`, `holdsStamp` `{ word: "GO" }`), posed with `pose` for the pop-in and the fright |
| Chaves (developer) | `chaves` (`facing`, `types`, `holdsSheet`) |
| Visor (AI agent) | `visor` (`facing` left, `points` always explicit) |
| laptop | `codePanel` (screen) and `keyboard` (its base, at Chaves's typing spot; Chaves's own keyboard replaces it while he types) |
| the open questions | `questionToken` at the cast scale |
| `proposal.md` | `sheet` (free) or Chaves's `holdsSheet`; label `diagramBox` (`shape: "pill"`, `textSize` 33) |
| `GO` mark | `stamp` (radius 24) in a group scaled 1.25 |
| the error | `messageArrow` (kind `failure`, curve as on the gate-0 sheet) |
| reactions | `emote` (`problem`, `worked`) |
| take badge | `countBadge` (`textSize` 36) |
| rewind mark | `uiIcon` `reset` |
| motion guides | `MotionPath` (P1, P2, P4) |
| stage rings | `Rings` |

The ADR 0007 rows: Balão is the requester and approver, Chaves the developer, Visor the AI agent (ADR 0007, amended 2026-11-12). The scene's files contain no colour literal and create no SVG shape of their own.

## 4. Beat table

Constants: `motion.fps` 30, `motion.travel` (T) 22, `motion.fade` (F) 10, `motion.readingHold` 90. Duration **1080** frames (36 s), outro **980**, final hold 980–1079 (100 frames). Take-2 frames of the request and relay are take-1 frames + **400**.

### 4.1 Phases

| # | Phase id | Take | Frames | Cites (English lines) | Devices |
|---|---|---|---|---|---|
| 1 | `setup` | 1 | 0–49 | 20, 26 | takeNumbers |
| 2 | `t1-request` | 1 | 50–129 | 20, 22, 24 | — |
| 3 | `t1-relay` | 1 | 130–219 | 26, 32 | — |
| 4 | `t1-code` | 1 | 220–299 | 26 | — |
| 5 | `t1-error` | 1 | 300–389 | 122, 26 | fright |
| 6 | `rewind` | rewind | 390–449 | 22 | rewind, takeNumbers |
| 7 | `t2-request` | 2 | 450–529 | 20, 22, 24 | — |
| 8 | `t2-relay` | 2 | 530–619 | 26, 32 | — |
| 9 | `t2-list` | 2 | 620–699 | 32, 72, 80, 98, 106, 108, 109, 110, 111, 112, 113 | — |
| 10 | `t2-carry` | 2 | 700–749 | 116, 118 | — |
| 11 | `t2-answer` | 2 | 750–849 | 34, 118, 120, 148 | goStamp |
| 12 | `t2-return` | 2 | 850–889 | 32, 148 | — |
| 13 | `t2-implement` | 2 | 890–979 | 32, 152 | — |

Every phase's `events` are the change frames of §4.2 that fall inside it. `rewind` is `{ from: 390, to: 439, objects: [389, 49] }`.

### 4.2 Frame table (frames, element, action, article line)

`?` *i* is numbered 0–5 from the left of its row; row *k* of the sheet is numbered 1–6 from the top.

| Frames | Element | Action | Line |
|---|---|---|---|
| 0–20 | rings | fade in | — |
| 4 | laptop (screen, empty; keyboard) | pops (block) | L26 |
| 8 / 12 / 16 | Balão / Chaves (facing left) / Visor (`points` false) | pop (block, through `pose`) | L20, L26 |
| 20 | badge `1` | pops (pill) | device |
| 56 | Balão | act: `speaks` on | L20, L22 |
| 56–66, 118–128 | P1 | fades in, fades out | device |
| 60 + 6(5 − i), i = 0…5 | `?` i | departs Balão's tail on route `ask-i`; arrives T later above Chaves (the last, `?` 0, at 112) | L24 |
| 118 | Balão | act: `speaks` off | L22 |
| 136 | Chaves | act: `facing` right, `types` on | L26, L32 |
| 142 | screen | the request line (accent) appears | L22, L32 |
| 142–152, 204–214 | P2 | fades in, fades out | device |
| 146 + 6(5 − i) | `?` i | departs on route `hop-i`; arrives T later in the screen (the last at 198) | L24, L26 |
| 210 | Chaves | act: `types` off | L26 |
| 226 | Visor | act: `points` on | L26 |
| 232 + 8j, j = 0…5 | screen; `?` j | code line j + 1 appears; `?` j sinks over F frames (opacity 1 → 0, 16 units down, linear), gone at 242 + 8j | L26 |
| 286 | Visor | face `done` (it works) | L26 |
| 300–310 | failure arrow | fades in | L122 |
| 316 | Balão | face `failed`, `problem` emote, fright pose (tilt −5, `squashAfter` −0.07) | L122; choice q79 A |
| 350 | `problem` emote | leaves (gone 360) | CAST-3 |
| 366 | Visor | face `failed` | L26, L122; choice q81 A |
| 390 | rewind mark | pops (pill) | device |
| 390–439 | stage | drawn from `o(f)`, take 1 backwards (§2.7, §4.3) | device |
| 440 | badge | swap `1` → `2` (pill pop) | device |
| 450 | rewind mark | leaves (gone 460) | device |
| 456 … 610 | Balão, `?`, Chaves, screen, P1, P2 | as 56 … 210, + 400 | L20–L26, L32 |
| 626 | Visor | act: `points` on | L32 |
| 626 | `proposal.md` | pops above the screen (block), label, no rows | L32, L98 |
| 636 + 8j, j = 0…5 | `?` j | departs on route `list-j`; arrives T later (658 + 8j) and becomes row j + 1 | L72, L80, L106–L113 |
| 702 | Visor | act: `points` off; face `waiting` | L80 |
| 712 | Chaves | act: `facing` left | L116 |
| 712–734 | `proposal.md` | travels on route `carry` (free sheet) | L116 |
| 712–722, 734–744 | P4 | fades in, fades out | device |
| 734 | Chaves | act: `holdsSheet` on (the sheet in his hand) | L116, L118 |
| 752 | Balão | act: `speaks` on | L118, L120 |
| 760 + 8k, k = 0…5 | row k + 1 | its check appears | L120 |
| 806 | Balão | act: `speaks` off | L120 |
| 816 | Balão | act: `holdsStamp` on (the stamp at the sheet's lower left) | L34, L148; device q49 B |
| 836 | Balão | act: `holdsStamp` off; face `done` | L34, L148 |
| 836 | `GO` mark | pops (block) on the sheet | L148; device q49 B |
| 852 | Chaves | act: `holdsSheet` off | L148 |
| 852–874 | `proposal.md` | travels on route `return` (free sheet, with checks and `GO`) | L32 |
| 852–862, 874–884 | P4 | fades in, fades out | device |
| 874 | Chaves | act: `facing` right | L32 |
| 896 | Visor | act: `points` on | L152 |
| 902 + 8j, j = 0…5 | screen | code line j + 1 appears | L152 |
| 950 | Visor | face `done`, `worked` emote (stays) | L152 |
| 980–1079 | everything | still | SCN-4 |

**Acts** (inclusive ranges): Balão 56–56, 118–118, 456–456, 518–518, 752–836; Chaves 136–210, 536–610, 712–734, 852–874; Visor 226–226, 626–626, 702–702, 896–896; plus the rewind's (§4.3).

**Faces:** Visor `done` 286, `failed` 366, `waiting` 702, `done` 950; Balão `failed` 316, `done` 836; plus the rewind's. **Emotes:** `problem` (Balão, 316, leaving 350); `worked` (Visor, 950, never leaving).

**Pops:** `laptop` 4, `balao` 8, `chaves` 12, `visor` 16, `badge1` 20, `rewindMark` 390, `badge2` 440, `sheet` 626, `goMark` 836. **Fades:** `p1-t1` 56/118, `p2-t1` 142/204, `failureArrow` 300 (in only), `p1-t2` 456/518, `p2-t2` 542/604, `p4-carry` 712/734, `p4-return` 852/874 (in and out, F frames each). **Leaves:** `problem` 350, `rewindMark` 450.

**Cues:** `requestLine` 142, 542; `codeLines1` 232 … 272; `sinks` 232 … 272 and their ends 242 … 282; `rows` 658 … 698; `checks` 760 … 800; `codeLines2` 902 … 942; `badgeSwap` 440; and every action frame of §4.2.

**Trips:** `ask-t1-i` (60 + 6(5 − i)), `hop-t1-i` (146 + 6(5 − i)), `ask-t2-i` (+400), `hop-t2-i` (+400), `list-i` (636 + 8i), `carry` (712), `return` (852); each ends T frames after it starts.

### 4.3 The rewind's reverse entries

From §2.7, with `o(f)`: 389, 382, 375, 368, 361, 354, 347, 340, 333, 327, 320, 313, 306, 299, 292, 285, 278, 271, 264, 257, 250, 243, 236, 229, 222, 216, 209, 202, 195, 188, 181, 174, 167, 160, 153, 146, 139, 132, 125, 118, 111, 105, 98, 91, 84, 77, 70, 63, 56, 49 for 390–439.

| Take-1 change | Reverse frame (objects: derived, about) | Entry |
|---|---|---|
| Visor `failed` (366) | 394 | face Visor `done` |
| failure arrow fade (300–310) | 402–403 | the arrow fades out |
| Balão `failed` (316) | 401 | face Balão `idle`; the fright pose ends |
| Visor `done` (286) | 405 | face Visor `idle` |
| sinks and code lines (232–282) | 409–421 | the `?` come back out of the code, the lines go |
| Visor `points` on (226) | 414 | act Visor 414–414 (`points` off) |
| Chaves `types` off (210) | 416 | act Chaves 416–427 (`types` on at 416; `types` off and `facing` left at 427) |
| Chaves `facing` right, `types` on (136) | 427 | (in the act above) |
| hops and request line (142–198) | 418–428 | the `?` fly back above Chaves; the line goes |
| Balão `speaks` off (118) | 430 | act Balão 430–430 (`speaks` on) |
| asks (60–112) | 430–438 | the `?` fly back into Balão's tail |
| Balão `speaks` on (56) | 439 | act Balão 439–439 (`speaks` off) |

No emote enters during the rewind.

### 4.4 Routes (stage units)

`X_i = 437.5 + 27i` (the row above Chaves, y 300); `Y_i = 597.5 + 27i` (the row in the screen, y 340); `R_k = 76.15 + 21.85(k − 1)` (row k's mark on the desk sheet, x 608).

| Route | Path |
|---|---|
| `ask-i` | `M 193.3,403.8 C 230,250 340,215 X_i,300` |
| `hop-i` | `M X_i,300 C X_i+60,240 Y_i−40,270 Y_i,340` |
| `list-i` | `M Y_i,340 C Y_i,290 608,R_{i+1}+50 608,R_{i+1}` |
| `carry` (the sheet's top-left) | `M 579.5,35.3 C 474.5,10 314.5,90 221.9,223.3` |
| `return` | `carry` reversed |
| P1 (guide) | `M 193.3,403.8 C 230,250 340,215 505,300` |
| P2 (guide) | `M 505,300 C 565,240 625,270 665,340` |
| P4 (guide, the label's centre) | `carry` moved right by 85.5 |

A token travels its route in T frames, linear by length, and is drawn from the trip's start frame up to the frame before its arrival; at arrival it is parked at the route's end (or becomes a row). The guides are drawn × 2 in composition pixels by `MotionPath`.

## 5. Reading choices (MOT-1) and out-of-scope outcomes

Approved at gate 0 (2026-11-12): the concept and its relay (q78 A); Balão's fright (q79 A); the larger sheet (q80 A); Visor turning `failed` after the fright (q81 A); the rewind and the take numbers (q48 A); the stamp word `GO` (q49 B).

Made in this design, for G1 (§9): the questions waiting above Chaves and in the screen (two hops); the sink (fade and drift); Visor's `done` face before the error (L26 "delivers something that works"); the rewind replaying the cast; the label as a pill wider than the sheet; the held stamp's smaller `GO`; the `GO` mark placed left of the sheet's centre; the `waiting` face after listing; Balão speaking while it answers; no emote for Visor's `failed`; the length (36 s).

Out of scope, because the article only implies them: which code take 1 picked; the `400`/`404` debate; the review rounds; the commits; the `curl` proof (`proposal.md`).

## 6. Layout (stage units, 960 × 540; composition = × 2)

### 6.1 Elements

| Element | Piece and parameters | Position |
|---|---|---|
| cast | `scale` 0.95 (CAST-5) | ground y 476; Balão x 104, Chaves x 505, Visor x 852 |
| screen | `codePanel` w 162, h 124, top 22, step 16 | x 584, y 258; pop anchor (665, 320) |
| request line | `{ indent 0, w 96, color "white", tall }` | first line |
| code lines | widths 70, 100, 64, 90, 56, 30; indents 0, 16, 32, 32, 16, 0; `color` "white" | after the request line |
| keyboard | `keyboard` width 150 in Chaves's units at (98, −74) | stage x 598.1, y 405.7, w 142.5 |
| sheet | `sheet` 180 × 226, top 32, step 23, rows `{ lead: "question", bar, tail }` with bars 76, 58, 84, 66, 80, 52; at scale 0.95 (171 × 214.7) | desk top-left (579.5, 35.3); held top-left (221.9, 223.3) |
| label | `diagramBox` pill w 206, h 44, `textSize` 33, fill `color.white`, `["proposal.md"]` | centred on the sheet's top edge: (sheet x + 85.5, sheet y) |
| `GO` mark | `stamp` r 24, word `GO`, × 1.25 | (sheet x + 58.9, sheet y + 183.35); pop anchor its centre |
| `?` | `questionToken` scale 0.95 | routes §4.4 |
| failure arrow | `messageArrow` from (588, 266) to (124, 284), controls (500, 80) and (160, 100), kind `failure` | — |
| emote `problem` | `emote` scale 0.8 | (214.2, 286) |
| emote `worked` | `emote` scale 0.75 | (800, 292) |
| badge | `countBadge` `textSize` 36 | (912, 52) |
| rewind mark | `uiIcon` `reset` size 48 | x 826, y 28 |
| rings | `Rings` | centre (960, 540) composition pixels |

### 6.2 Layers (SCN-6) and cast body boxes

From the bottom: 1 `Rings`; 2 `MotionPath` P1, P2, P4; 3 stage `below`: failure arrow, keyboard, screen; 4 stage `cast`: Visor, Chaves, Balão (Balão last, so its stamp is over the held sheet); 5 stage `sheet`: the free sheet, the label and the `GO` mark; 6 stage `tokens`: the `?`; 7 stage `above`: the badge, the rewind mark and the emote. Every element sits in a group with a `data-element` name.

Cast body boxes for the placement test (stage units; the body only, not the hands or props): Balão x 45.1–193.3, y 322.1–476; Chaves x 419.5–590.5, y 333.5–476; Visor x 789.3–914.7, y 341.1–476.

### 6.3 What the layout test proves

1. **Layout equals the design:** the values of §6.1 and §4.4.
2. **Minimum size:** `proposal.md` and the `GO` mark at least 33 effective, `1` and `2` at least 36; a smaller `GO` only inside Balão's act 752–836; the `?` not checked (a symbol).
3. **Boxes:** a word's box is its advance width × its effective size, placed by its anchor, from 0.8 × size above the baseline to 0.25 × size below it (`test/scenes/text-measure.ts`); the label pill's, the `GO` mark's (its circle) and the badge's boxes are their bodies.
4. **Inside the frame:** every box lies inside x 12–948 and y 12–528.
5. **No overlaps:** no two of the label pill, the `GO` mark, the badge and the rewind mark intersect, and none intersects a cast body box.
6. **When it runs:** every frame from 0 to 1079 except an element before *a* + `motion.fps` from its pop-in at *a*, during its 10-frame leave, and the sheet with its label and mark during the trips (712–733, 852–873).

If a value of §6.1 fails 2–5, the implementer changes it here and in the spec in the same commit (BUILD) and lists it for the owner.

## 7. Stills plan (MOT-5)

`npm run stills -- sdd-request-relay` renders the phase ends and the last frame: **49, 129, 219, 299, 389, 449, 529, 619, 699, 749, 849, 889, 979, 1079** (14 PNGs). The implementer also renders these frames with `npx remotion still`:

| Frame | What it checks |
|---|---|
| 90 | the `?` riding from Balão to Chaves |
| 170 | the hop into the screen, Chaves typing |
| 250 | the `?` sinking into the code |
| 330 | Balão's fright with the `problem` emote |
| 370 | Visor `failed` |
| 420 | mid-rewind |
| 660 | the list, a `?` becoming a row |
| 723 | the carry, mid-trip |
| 790 | answering, checks appearing |
| 825 | the held stamp at the sheet |
| 863 | the return, mid-trip |
| 1000 | inside the final hold |

Every PNG is opened and checked for the cast (CAST-3, CAST-4, CAST-5), overlaps, clipping and contrast. Sheets in `docs/spikes/2026-11-12-sdd-request-relay/`:

- **the stills sheet** of the 14 stills and the 12 frames above;
- **a phone sheet:** the 14 stills at **341 CSS px** wide (exported at device pixel ratio 3), viewed in a page that shows them at 341 CSS px; `proposal.md`, `GO` and the take numbers must read;
- after the render, **the web-MP4 sheet:** the same 14 frames extracted from `out/web/sdd-request-relay-16x9.mp4` with `npx remotion ffmpeg -ss <t> … -frames:v 1`, laid out in an HTML grid and captured with headless Chrome, plus the same frames at 341 CSS px.

The owner's G1 is given by his standing ok to the recommendations; he judges the scene at G3, on the video.

## 8. Article lines (English, `728d6f4`)

| Line | What it supports |
|---|---|
| L20 | the logistics team sends the development team a one-line message |
| L22 | the request: an API that, given the order number, returns the delivery status |
| L24 | short, reasonable and incomplete: the open questions |
| L26 | developers answer them while writing code; an AI agent does the same, faster: picks a format, picks an error code, delivers something that works; nobody approved the decisions |
| L32 | SDD: a spec before writing code with AI; the source of truth for the human and the AI |
| L34 | the person who approves the spec decides what the system does |
| L72 | the rule: when the request is unclear, list the open question instead of choosing |
| L80 | the open-questions rule stops the agent from choosing silently |
| L98 | `proposal.md` says what is still unknown |
| L106–L113 | `## Open Questions`, six numbered questions (L107 is blank) |
| L116 | the same questions, written down and addressed to the people who can answer them |
| L118 | "Answer, review, approve" |
| L120 | the logistics team answered the six questions |
| L122 | without the spec … the logistics team would only find out which when the first error came back |
| L148 | only an explicit decision by the owner of the request releases the implementation |
| L152 | the agent implements what the tasks say and nothing more |

### 8.1 Words on screen

| Words | Lines |
|---|---|
| `proposal.md` | L98, L116 |
| `?` | L24, L106–L113 |
| `GO` | device (q49 B), for L34 and L148 |
| `1`, `2` | device (ADR 0004 amendment for AB#334) |

## Risks / trade-offs

- **The `?` reads small on a phone** (8.8 px disc). It is a symbol the motion explains; the phone sheet is the check, and G1 question 4 offers a larger token.
- **The rewind replays three characters in 50 frames.** Their acts are 2 to 13 frames apart there; a reader may see it as a blur. That is the intent of a rewind; the 420 still and the video are the check.
- **The label pill is wider than the sheet.** A choice of §2.2, visible on every still.
- **36 s, against the ~30 s of gate 0.** Length follows the message (SCN-5); the extra seconds are the carry and the return, which the relay needs.

## Migration

None for consumers: scenes and `src/brand/` are not in the package. `withSansFamily` moves inside `src/`, which is not exported.

## 9. Open questions for G1

The owner follows the recommendations and judges at the video (G3); this change implements each recommended answer, and the same list is in the pull request.

1. **Two hops for the `?`** (Balão → above Chaves → into the screen), so the relay reads. Recommended: keep.
2. **The sink:** each `?` fades and drops 16 units as its code line appears. Recommended: keep.
3. **Balão's held stamp shows `GO` at 25.7 units** while it stamps (20 frames); the mark that stays is 33.75. Recommended: accept.
4. **The `?` stays at the cast scale** (a symbol, 8.8 px disc on a phone), so it becomes a sheet row without a jump. Recommended: accept, and judge on the phone sheet; the alternative is a larger token that shrinks on arrival.
5. **The rewind replays the cast backwards** (§2.7). Recommended: keep.
6. **Registration before `circuit-breaker-topology`** (§2.4). Recommended: accept.
7. **`withSansFamily` moves to `src/brand/svg-fonts.ts`** (§2.5). Recommended: accept.
8. **The label pill is wider than the sheet** (206 against 171), and the sheet is 171 × 214.7. Recommended: accept.
9. **Visor turns `waiting` after listing** and stops pointing; **Balão speaks while answering.** Recommended: keep.
10. **No emote for Visor's `failed`** (one emote per reaction, the fright is Balão's, q79 A). Recommended: keep.
11. **Length 36 s** (1080 frames, final still 100 frames). Recommended: accept.

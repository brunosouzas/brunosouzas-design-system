# Design: idempotent-receiver-book-scene

See `proposal.md` for the why. The approved concept is the gate-0 sheet `docs/spikes/2026-11-27-idempotent-receiver-storyboard/B-book.png` (concept B, book; owner's pick of 2026-11-27); its notation script `storyboard.mts` is in the same folder. What the sheet did not fix (timing, exact positions, how the second delivery appears) is decided here and marked as such.

## 1. The story and its lines

Every beat animates line 28 of the English page (the Portuguese page has the same lines) or its book diagram, whose alt text is line 32 and whose labels are the keys of `writing/integration-patterns-in-mulesoft/design/idempotent-receiver-in-mulesoft-book.json` at `0162e3a`:

| Beat | What the viewer sees | Source |
|---|---|---|
| The sender sends order 42 once | the token `42` leaves the Sender into the channel | L28 "even when the sender sends a message only once"; L32 "The Sender sends order 42 once to the Message channel"; diagram label `once` |
| The channel delivers it | take 1: once; take 2: a second copy appears in the channel and both reach the receiver in turn | L28 "the receiver may receive it more than once"; L32 "which delivers order 42 twice to the Idempotent Receiver"; diagram labels `d1`, `d2` |
| The receiver looks up its processed IDs | the lookup arrow turns solid; the first time a `?` shows that 42 is not there | L28 "keeps the ID of each processed message"; L32 "The receiver looks up the processed IDs and asks whether ID 42 was already processed"; diagram label `decision` |
| It processes the message and stores the ID | the token turns green and moves to the processed side with a check; `42` appears in the store | L28; L32 "if no, it processes and stores the ID in the processed IDs" |
| The duplicate is found and ignored | the store comes into focus as the lookup finds 42; the second delivery turns orange and is set aside | L28 "ignores any message that arrives with a known ID"; L32 "if yes, it ignores the duplicate" |
| Same effect, once or several times | take 1's result fades in beside take 2's: one processed message in both | L28 "produces the same effect whether it is received once or several times" |

**The channel's shape (the owner's answer at gate 1, design §7, point 5).** The page and its diagram say "Message channel" (L32, label `channel`, drawn there as a `queueNode`). The package has no generic Message Channel icon, and `point-to-point-channel` would name a channel type the page does not, so the scene draws the diagram's own shape: a `queueNode` without words (since 0.15.0, SW-249), centred on the lane.

## 2. Decisions

### 2.1 The EIP book scene type (`src/scenes/eip-book.ts`)

The card asks that this first EIP video yield the reusable book scene type, so the next pages (Dead Letter Channel, Correlation Identifier, Publish-Subscribe Channel) are mostly data.

| Option | Why not, or why |
|---|---|
| Everything in the scene's folder; extract with the second book scene | the second scene would copy the lane, the token and the store |
| A new scene kind `eip-book` with its own checks | a book scene is a `takes` or a `sequence` scene; it needs no new rule, only shared drawing |
| A generic book stage and frame builder now (tokens, rests, routes and outcomes as data) | it would be designed from one example; what the next pattern needs (a dead-letter channel, a correlation pair) is not known yet |
| **A React-free module beside the kinds, with only what every book scene draws (chosen)** | the lane (`LANE` 212), the text sizes (`BOOK_TEXT` 33 and 36), the message token (`messageToken`, a pill 56 high with its ID at 36), a message channel on the lane (`channelOnLane`, a `queueNode` without words centred on the lane), an EIP icon with its message arrow on the lane (`iconOnLane`, from `ICON_ARROW_Y` per icon: the y of the arrow's line in the icon drawing), and the store empty or holding an ID (`emptyStore`, `storedId`) |

What the chosen module does not cover, said plainly: the next book scene still writes its own `scene.ts`, `timeline.ts`, `layout.ts`, `frame.ts`, `stage.ts` and `Scene.tsx` (here about 400 lines of code, most of it frame and stage logic), reusing the module's drawing and this scene's files as a model. Whether that meets the card's "almost only data", or a generic builder should be extracted now or with the second book scene, is the owner's call (design §7, point 4).

The module draws only through the package's pieces (MOT-6). A pattern's scene adds its icons to `ICON_ARROW_Y`. It is not exported by the package (`src/scenes/` is not shipped).

### 2.2 Text sizes

The circuit-breaker topology scene's phone rule (its design §2.2): every word at least 33 stage units (66 px in the composition, 11.7 px in the site's 341 px column), every ID, count and take number at least 36. Here: `Sender` at 33; every `42` (token and store) and the take numbers at 36. The `?` is the `questionToken`'s symbol, exempt from the size rule.

### 2.3 Takes and the rewind

As in `sdd-request-relay` (its design §2.7): before take 2 the stage is drawn from an object frame `o(f)`, which runs take 1 backwards during the rewind; the badge and the rewind mark read the real frame; from take 2 everything reads the real frame.

- `o(f) = f` before 320; `o(f) = round(319 − (f − 320) × 280 / 49)` from 320 to 369, so `o(320)` is 319 and `o(369)` is 39; `o(f) = 39` from 370 to 379.
- Take 2 repeats take 1's frames 40 to 239 (send, first delivery, lookup, processing) **340 frames** later (`TAKE2_OFFSET`), except that take 2's copy appears at 427 and take 2 keeps guide P1 until the second delivery arrives (fade-out 602–612, not 438–448). It then adds the second delivery, the match and the ignore.
- The stage pops in during 0–39 and every pop has settled (pop + `motion.fps`) by frame 39, so the rewind lands on exactly the stage take 2 starts from.

### 2.4 Registration

After `sdd-scene-3-archive` and before `circuit-breaker-topology`, which stays last, as every scene since the topology scene was registered. The assertions that list every scene follow (proposal, "Modified Capabilities").

### 2.5 Reading devices

`TakesDevice` gains three names, so the phases list every device the scene uses:

- `lookupMark`: the `?` shown while a lookup finds nothing, that is the diagram's decision (label `decision`) answered "no". The gate-0 README's marked choice 1 says "the question mark at each lookup", while its sheet B-book drew no `?` at the match; the scene follows the sheet, as the owner chose at G1 (§7, point 7).
- `ghost`: take 1's processed token, faded (`motion.dimOpacity`), beside take 2's at the end (marked choice 3, approved). As the topology scene's ghost, it compares the two takes' effect.
- `matchFocus`: the store and its `42` come into focus (`motion.focusScale`) while the lookup finds 42 (§2.8). It shows the lookup line 28 and the diagram state ("arrives with a known ID", "if yes"), no new fact; it is new since gate 0, and the owner kept it at G1 (§7, point 1).

The rewind and the take numbers are the `takes` kind's devices (ADR 0004, amendment of 2026-11-12). Take 1's single delivery is the first half of the definition at L28 (marked choice 2, approved).

### 2.6 How take 2's second delivery appears (decided here)

The sheet drew two copies side by side between the channel and the receiver. In motion, the copy pops in the channel (`copy`, frame 427) once the first delivery has left it, so the two tokens never sit on one point, and it waits there while the first one is looked up and processed. Before the first lookup both tokens rest for 22 frames (438–459), the first at the receiver's door and the copy in the channel: the channel holds the message twice without a second send.

### 2.7 Sources

`https://brunosouzas.com/wiki/idempotent-receiver-in-mulesoft/` and `https://brunosouzas.com/pt/wiki/idempotent-receiver-in-mulesoft/` (both answer 200; the URL without the slash redirects to them).

### 2.8 Understanding before length (the owner, 2026-11-27)

At this change's spec stage the owner set the rule for these videos: a short video that explains is best, but length must not cost understanding ("não vamos nos apegar a isso pq senão podemos cometer o erro básico que é a pressa que se torna inimiga da perfeição"). The first stills ran 26 s; this design spends more time where it helps the reading:

- a rest at the receiver's door before each lookup: 22 frames (98–119 and 438–459, where take 2 also shows the copy waiting in the channel), and 18 frames before the match (602–619);
- take 1's result held for 80 frames after its check settles (240–319);
- the match: the store in focus (§2.5) from 625, held from 655 to 665, then falling back; the duplicate turns orange at 680, while the focus still settles, and the store is at rest again from 695;
- a 32-frame rest after the ignore before take 1's result fades in (708–739).

The scene is 30 s (900 frames). The length is a result of these beats, not a target.

## 3. Pieces

`queueNode` (the channel, without words), `eipIcon` (`idempotent-receiver`), `diagramBox` (the Sender pill, the tokens), `storeNode` (empty, and its words alone for the stored ID), `messageArrow` (the lookup, both heads), `checkBadge`, `questionToken`, `countBadge` (the take badge), `uiIcon` (`reset`, the rewind mark), and the components `Rings` and `MotionPath`. No colour literal; the fills are `color.state.caller` (the Sender), `color.white`, `color.state.healthy` (processed, ADR 0006) and `color.state.blocked` (ignored, as the book diagram's "Ignore the duplicate" box).

## 4. Beat table (30 fps, `motion.travel` 22, `motion.fade` 10)

### 4.1 Phases

| Phase | Take | Frames | Cites | Devices |
|---|---|---|---|---|
| `setup` | 1 | 0–39 | 28, 32 | `takeNumbers` |
| `t1-send` | 1 | 40–119 | 28, 32 | |
| `t1-lookup` | 1 | 120–179 | 28, 32 | `lookupMark` |
| `t1-process` | 1 | 180–239 | 28, 32 | |
| `t1-hold` | 1 | 240–319 | 28 | |
| `rewind` | rewind | 320–379 | 28 | `rewind`, `takeNumbers` |
| `t2-send` | 2 | 380–459 | 28, 32 | |
| `t2-lookup` | 2 | 460–519 | 28, 32 | `lookupMark` |
| `t2-process` | 2 | 520–579 | 28, 32 | |
| `t2-deliver` | 2 | 580–619 | 28, 32 | |
| `t2-match` | 2 | 620–679 | 28, 32 | `matchFocus` |
| `t2-ignore` | 2 | 680–739 | 28, 32 | |
| `t2-compare` | 2 | 740–799 | 28 | `ghost` |

Duration 900, outro 800 (a still of 100 frames, at least `motion.readingHold` 90), rings fade 0–20 (the shared `Rings` fade, not `motion.fade`). Each phase's events are every change frame below that falls in it. No cast: no act, face or emote.

### 4.2 Elements and cues

How things move: the stage nodes (`sender`, `channel`, `receiver`, `store`) and the check pop in with `blockPopIn`; the tokens, the stored ID, the `?`, the badge and the rewind mark with `pillPopIn` (`src/brand/motion.ts`). An element popping at frame a is drawn from a + 1 and settled from a + 30. A trip from a to a + 22 moves linearly along its route (`pointAlong` at (f − a) / 22) from a to a + 21 and is at its destination from a + 22. The `?` and the rewind mark leave over 10 frames (`leave`). The store's focus rises and falls with the `motion.focus` spring to `motion.focusScale`, exactly 1.06 from `on` + 30 and exactly 1 from `off` + 30. Fades are linear.

| Frame | Element | Change |
|---|---|---|
| 1, 3, 5, 7, 9 | `sender`, `channel`, `receiver`, `store` (with the lookup arrow), `badge1` | pop in |
| 40 | `message-t1` | pops at the Sender's side (`AT.sender`) |
| 40–50 / 98–108 | guide P1 (the lane) | fades in / out |
| 46 → 68 | trip `send-t1` | `AT.sender` → `AT.channel` |
| 76 → 98 | trip `deliver-t1` | `AT.channel` → `AT.door` |
| 120 / 170 | lookup | solid / back to dashed |
| 124 (leaves 160, gone 170) | `question-t1` | pops |
| 180 | `processed` cue, `stored-t1` | the message turns green; `42` pops in the store |
| 180–190 / 208–218 | guide P2 (processing) | fades in / out |
| 186 → 208 | trip `process-t1` | `AT.door` → `AT.processed` |
| 208 | `check-t1` | pops |
| 320 (leaves 380, gone 390) | `rewindMark` | pops |
| 320–369, 370–379 | rewind | object frames 319 → 39, then 39 |
| 370 | `badgeSwap` | the badge reads `2` (no new pop) |
| 380 | `message-t2` | pops at `AT.sender` |
| 380–390 / 602–612 | guide P1 | fades in / out |
| 386 → 408 | trip `send-t2` | as `send-t1` |
| 416 → 438 | trip `deliver-t2` | as `deliver-t1` |
| 427 | `copy` | pops in the channel (§2.6) |
| 460 / 510 | lookup | solid / dashed |
| 464 (leaves 500, gone 510) | `question-t2` | pops |
| 520 | `processed` cue, `stored-t2` | the message turns green; `42` pops in the store |
| 520–530 / 548–558 | guide P2 | fades in / out |
| 526 → 548 | trip `process-t2` | as `process-t1` |
| 548 | `check-t2` | pops |
| 580 → 602 | trip `deliver2-t2` (route `deliver`) | the copy: `AT.channel` → `AT.door` |
| 620 / 670 | lookup | solid / dashed: the match, no `?` |
| 625 / 665 | `focus` cue | the store and its `42` rise to focus / fall back (§2.8) |
| 680 | `ignored` cue | the copy turns orange |
| 680–690 / 708–718 | guide P3 (ignore) | fades in / out |
| 686 → 708 | trip `ignore-t2` | `AT.door` → `AT.ignored` |
| 740–750 | `ghost` | take 1's result fades in at `AT.ghost` (to `motion.dimOpacity`) |
| 800–899 | everything | still |

## 5. Words

`text.en`: `sender` "Sender" (the diagram's label `sender`, L32), `id` "42" (its order, L32), `question` "?" (the `questionToken`'s symbol), `takes` ["1", "2"]. No caption (SCN-2): the motion carries every beat.

## 6. Layout

### 6.1 Positions and routes (960 × 540 stage units)

| What | Value |
|---|---|
| Lane | y 212 |
| Sender | pill x 16, y 180, 150 × 64, `color.state.caller`, `Sender` at 33 |
| Channel | a `queueNode` without words, x 196, width 180, height 96, centred on the lane (y 164 to 260) and on its token rest (x 286) |
| Receiver | `idempotent-receiver` at x 520, scale 3.4, its arrow line (y 23) on the lane |
| Store | x 560, y 366, 160 × 128; `42` at 36 when stored; focus about its centre |
| Lookup | `messageArrow` (640, 274) → (640, 362), both heads; dashed width 2.5 at rest, solid width 4 while looking up |
| Token rests (`AT`) | sender (212, 212), channel (286, 212), door (488, 212), processed (852, 212), ghost (852, 320), ignored (300, 428): the duplicate is set aside away from the store and the lookup |
| Token | pill 56 high, at least 84 wide (19 per character + 44), `42` at 36 |
| Check | `checkBadge` (902, 178), r 22 |
| `?` | `questionToken` (700, 318), scale 2 |
| Badge | `countBadge` (912, 52), text 36 |
| Rewind mark | `uiIcon` `reset` x 826, y 28, size 48 |
| Rings | centre (960, 540) composition pixels |
| Route `send` | `M 212,212 L 286,212` |
| Route `deliver` | `M 286,212 L 488,212` |
| Route `process` | `M 488,212 C 600,110 760,140 852,212` |
| Route `ignore` | `M 488,212 C 470,330 380,428 300,428` (down and back from the door, clear of the lookup and the store) |
| Guides | P1 `M 166,212 L 520,212`; P2 = `process`; P3 = `ignore`; drawn × 2 by `MotionPath` |

### 6.2 Layers (SCN-6), bottom to top

1 `Rings`; 2 the guides P1, P2, P3; 3 `below`: the lookup arrow; 4 `nodes`: sender, channel, receiver, store, stored ID; 5 `tokens`: ghost, message, copy, check, `?`; 6 `above`: badge, rewind mark. Every element sits in a group named by `data-element`; an element not drawn is left out of the tree.

### 6.3 Checks

- **Size:** every drawn word whose element has settled: `Sender` at least 33, `42`, `1` and `2` at least 36, measured as `font-size` times every scale applied. The `?` is exempt.
- **Placement:** every settled word box (advance on the `fonts/` faces times effective size), the `?` included, the badge (radius 26.18 plus half its outline, so a box of ±28) and the rewind mark lie inside the stage less 12 units, and no two of different elements cross. Exempt at a frame: an element popping, fading or leaving, and a token not at one of its rests.

## 7. Open points for G1

**Answered by the owner on 2026-11-27** (gate 1 on commit `42544d9`): every recommendation, (a) for points 1, 3, 4, 6 and 7, (b) for points 5 and 8. Points 1, 3, 6 and 7 are what the scene already does, and point 4 leaves the shared builder to the second book scene. Points 5 and 8 need pieces the package does not have yet: `queueNode` cannot be drawn without words (its `text` is required, as `storeNode`'s was before SW-248) and `eipIcon` still draws the offset shadows. Both come first in a design-system change of their own, as SW-248 did; this branch then takes them from `main` (task 4.4a).

1. **The match.** The store and its `42` come into focus while the lookup finds 42 (`matchFocus`, §2.5), new since gate 0. Options: (a) keep the focus; (b) only the solid lookup arrow, no focus. Recommended: (a), the found ID is the beat line 28 turns on.
2. **Length.** Answered by the owner on 2026-11-27: understanding before length (§2.8); the scene is 30 s.
3. **The copy in the channel** (§2.6) rather than two tokens leaving together. Options: (a) the copy appears in the channel once the first delivery leaves; (b) two tokens leave the channel side by side, as the sheet drew them. Recommended: (a).
4. **How much of the book scene type is shared** (§2.1). Today the next book scene reuses the drawing module and copies this scene's frame and stage logic (about 400 lines). Options: (a) extract a generic builder with the second book scene, when two patterns show what is common; (b) extract a generic book stage and frame builder in this change, before the scene ships. Recommended: (a).
5. **The channel's icon** (§1): the page says "Message channel"; the package has no icon for it. Options: (a) keep `point-to-point-channel`, the icon of the Point-to-Point Channel pattern, a channel type the page does not name; (b) a `queueNode` with no words, as the diagram draws the channel's shape; (c) a `queueNode` labelled `Message channel` at 33, the diagram's label. Recommended: (b), the diagram's own shape without naming another pattern.
6. **The receiver icon's own `1`.** The `idempotent-receiver` EIP icon carries a circled `1` (its "once" mark); in take 2 it shares the screen with the take badge `2`. Options: (a) keep the published icon (the badge is apart, top right); (b) ask the design system for a variant without the mark. Recommended: (a).
7. **The `?` at the match.** Options: (a) the `?` only while a lookup finds nothing, as the sheet drew it (the scene today); (b) the `?` at every lookup, the match included, as the README's text said. Recommended: (a), so the match shows the found ID, not a question.
8. **The EIP icons' offset shadows.** `eipIcon` draws the published notation's hard offset shadows (src/pieces/eip-icons.ts), which ADR 0009 removed from every other piece ("no piece passes a literal offset of its own"); this would be the first published video to show them, at scales 2.8 and 3.4. Options: (a) ship as is and open a design-system card to redraw the 26 icons; (b) a design-system change to `eipIcon` first, as SW-248 came before this scene; (c) an ADR 0009 amendment that exempts the published EIP notation. Recommended: (b), so the series' first video and every later one show the icons in the v2 grammar.

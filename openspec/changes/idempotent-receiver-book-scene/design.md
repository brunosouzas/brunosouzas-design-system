# Design: idempotent-receiver-book-scene

See `proposal.md` for the why. The approved concept is the gate-0 sheet `docs/spikes/2026-11-27-idempotent-receiver-storyboard/B-book.png` (concept B, book; owner's pick of 2026-11-27); its notation script `storyboard.mts` is in the same folder. What the sheet did not fix (timing, exact positions, how the second delivery appears) is decided here and marked as such.

## 1. The story and its lines

Every beat animates line 28 of the English page (the Portuguese page has the same lines) or its book diagram (L30–L32, the alt text at L32):

| Beat | What the viewer sees | Line |
|---|---|---|
| The sender sends order 42 once | the token `42` leaves the Sender into the channel | L28 "even when the sender sends a message only once"; L32 "sends order 42 once" |
| The channel delivers it | take 1: once; take 2: a second copy appears in the channel and both reach the receiver in turn | L28 "the receiver may receive it more than once"; L32 "delivery 1 … delivery 2 of order 42" |
| The receiver looks up its processed IDs | the lookup arrow turns solid; the first time a `?` shows that 42 is not there | L28 "keeps the ID of each processed message"; L32 "looks up the processed IDs and asks whether ID 42 was already processed" |
| It processes the message and stores the ID | the token turns green and moves to the processed side with a check; `42` appears in the store | L28; L32 "if no, it processes and stores the ID" |
| The duplicate is ignored | the second delivery, found in the store, turns orange and is set aside | L28 "ignores any message that arrives with a known ID"; L32 "if yes, it ignores the duplicate" |
| Same effect, once or several times | take 1's result fades in beside take 2's: one processed message in both | L28 "the same effect whether it is received once or several times" |

## 2. Decisions

### 2.1 The EIP book scene type (`src/scenes/eip-book.ts`)

The card asks that this first EIP video yield the reusable book scene type, so the next pages (Dead Letter Channel, Correlation Identifier, Publish-Subscribe Channel) are mostly data.

| Option | Why not, or why |
|---|---|
| Everything in the scene's folder; extract with the second book scene | the card asks for the type now, and the second scene would copy the lane, the token and the store |
| A new scene kind `eip-book` with its own checks | a book scene is a `takes` or a `sequence` scene; it needs no new rule, only shared drawing |
| **A React-free module beside the kinds, with only what every book scene draws (chosen)** | the lane (`LANE` 212), the text sizes (`BOOK_TEXT` 33 and 36), the message token (`messageToken`, a pill 56 high with its ID at 36), an EIP icon with its message arrow on the lane (`iconOnLane`, from `ICON_ARROW_Y` per icon), and the store empty or holding an ID (`emptyStore`, `storedId`); the scene keeps its own layout, routes, timeline and frame logic |

The module draws only through the package's pieces (MOT-6). A pattern's scene adds its icons to `ICON_ARROW_Y`. It is not exported by the package (`src/scenes/` is not shipped).

### 2.2 Text sizes

The circuit-breaker topology scene's phone rule (its design §2.2): every word at least 33 stage units (66 px in the composition, 11.7 px in the site's 341 px column), every ID, count and take number at least 36. Here: `Sender` at 33; every `42` (token and store) and the take numbers at 36. The `?` is the `questionToken`'s symbol, exempt.

### 2.3 Takes and the rewind

As in `sdd-request-relay` (its design §2.7): before take 2 the stage is drawn from an object frame `o(f)`, which runs take 1 backwards during the rewind; the badge and the rewind mark read the real frame; from take 2 everything reads the real frame.

- `o(f) = f` before 260; `o(f) = round(259 − (f − 260) × 220 / 49)` from 260 to 309, so `o(260)` is 259 and `o(309)` is 39; `o(f) = 39` from 310 to 319.
- Take 2 repeats take 1's send, first delivery, lookup and processing **280 frames** later (`TAKE2_OFFSET`), then adds the second delivery, the match and the ignore.
- The stage pops in during 0–39 and every pop has settled (pop + `motion.fps`) by frame 39, so the rewind lands on exactly the stage take 2 starts from.

### 2.4 Registration

After `sdd-scene-3-archive` and before `circuit-breaker-topology`, which stays last, as every scene since the topology scene was registered. The assertions that list every scene follow (proposal, "Modified Capabilities").

### 2.5 Reading devices

`TakesDevice` gains two names, so the phases list every device the owner approved:

- `lookupMark`: the `?` shown at a lookup that finds nothing (marked choice 1 of the gate-0 README, approved with concept B). It stands for the book diagram's decision "Has ID 42 already been processed?" (L32), without words.
- `ghost`: take 1's processed token, faded (`motion.dimOpacity`), beside take 2's at the end (marked choice 3, approved). As the topology scene's ghost, it compares the two takes' effect.

The rewind and the take numbers are the `takes` kind's devices (ADR 0004, amendment of 2026-11-12). Take 1's single delivery is the first half of the definition at L28 (marked choice 2, approved).

### 2.6 How take 2's second delivery appears (decided here)

The sheet drew two copies side by side between the channel and the receiver. In motion, the copy pops in the channel (`copy`, frame 367) once the first delivery has left it, so the two tokens never sit on one point, and it waits there until the first one is processed. This reads as "the channel holds the message twice" without a second send.

### 2.7 Sources

`https://brunosouzas.com/wiki/idempotent-receiver-in-mulesoft/` and `https://brunosouzas.com/pt/wiki/idempotent-receiver-in-mulesoft/` (both answer 200; the URL without the slash redirects to them).

## 3. Pieces

`eipIcon` (`point-to-point-channel`, `idempotent-receiver`), `diagramBox` (the Sender pill, the tokens), `storeNode` (empty, and its words alone for the stored ID), `messageArrow` (the lookup, both heads), `checkBadge`, `questionToken`, `countBadge` (the take badge), `uiIcon` (`reset`, the rewind mark), and the components `Rings` and `MotionPath`. No colour literal; the fills are `color.state.caller` (the Sender), `color.white`, `color.state.healthy` (processed, ADR 0006) and `color.state.blocked` (ignored, as the book diagram's "Ignore the duplicate" box).

## 4. Beat table (30 fps, `motion.travel` 22, `motion.fade` 10)

### 4.1 Phases

| Phase | Take | Frames | Cites | Devices |
|---|---|---|---|---|
| `setup` | 1 | 0–39 | 28, 32 | `takeNumbers` |
| `t1-send` | 1 | 40–99 | 28, 32 | |
| `t1-lookup` | 1 | 100–159 | 28, 32 | `lookupMark` |
| `t1-process` | 1 | 160–219 | 28, 32 | |
| `t1-hold` | 1 | 220–259 | 28 | |
| `rewind` | rewind | 260–319 | 28 | `rewind`, `takeNumbers` |
| `t2-send` | 2 | 320–379 | 28, 32 | |
| `t2-lookup` | 2 | 380–439 | 28, 32 | `lookupMark` |
| `t2-process` | 2 | 440–499 | 28, 32 | |
| `t2-deliver` | 2 | 500–539 | 28, 32 | |
| `t2-match` | 2 | 540–589 | 28, 32 | |
| `t2-ignore` | 2 | 590–639 | 28, 32 | |
| `t2-compare` | 2 | 640–679 | 28 | `ghost` |

Duration 780, outro 680 (a still of 100 frames, at least `motion.readingHold` 90), rings fade 0–20. Each phase's events are every change frame below that falls in it. No cast: no act, face or emote.

### 4.2 Elements and cues

An element popping at frame a is drawn from a + 1 and settled from a + 30; a trip from a to a + 22 is on its route from a to a + 21 and at its destination from a + 22.

| Frame | Element | Change |
|---|---|---|
| 1, 3, 5, 7, 9 | `sender`, `channel`, `receiver`, `store` (with the lookup arrow), `badge1` | pop in |
| 40 | `message-t1` | pops at the Sender's side (`AT.sender`) |
| 40–50 / 98–108 | guide P1 (the lane) | fades in / out |
| 46 → 68 | trip `send-t1` | `AT.sender` → `AT.channel` |
| 76 → 98 | trip `deliver-t1` | `AT.channel` → `AT.door` |
| 100 / 150 | lookup | solid / back to dashed |
| 104 (leaves 140, gone 150) | `question-t1` | pops |
| 160 | `processed` cue, `stored-t1` | the message turns green; `42` pops in the store |
| 160–170 / 188–198 | guide P2 (processing) | fades in / out |
| 166 → 188 | trip `process-t1` | `AT.door` → `AT.processed` |
| 188 | `check-t1` | pops |
| 260 (leaves 320, gone 330) | `rewindMark` | pops |
| 260–309, 310–319 | rewind | object frames 259 → 39, then 39 |
| 310 | `badgeSwap` | the badge reads `2` (no new pop) |
| 320 | `message-t2` | pops at `AT.sender` |
| 320–330 / 522–532 | guide P1 | fades in / out |
| 326 → 348 | trip `send-t2` | as `send-t1` |
| 356 → 378 | trip `deliver-t2` | as `deliver-t1` |
| 367 | `copy` | pops in the channel (§2.6) |
| 380 / 430 | lookup | solid / dashed |
| 384 (leaves 420, gone 430) | `question-t2` | pops |
| 440 | `processed` cue, `stored-t2` | the message turns green; `42` pops in the store |
| 440–450 / 468–478 | guide P2 | fades in / out |
| 446 → 468 | trip `process-t2` | as `process-t1` |
| 468 | `check-t2` | pops |
| 500 → 522 | trip `deliver2-t2` (route `deliver`) | the copy: `AT.channel` → `AT.door` |
| 540 / 580 | lookup | solid / dashed: the match, no `?` |
| 590 | `ignored` cue | the copy turns orange |
| 590–600 / 618–628 | guide P3 (ignore) | fades in / out |
| 596 → 618 | trip `ignore-t2` | `AT.door` → `AT.ignored` |
| 640–650 | `ghost` | take 1's result fades in at `AT.ghost` (to `motion.dimOpacity`) |
| 680–779 | everything | still |

## 5. Words

`text.en`: `sender` "Sender" (the book diagram's word, L32), `id` "42" (its order, L32), `question` "?" (the `questionToken`'s symbol), `takes` ["1", "2"]. No caption (SCN-2): the motion carries every beat.

## 6. Layout

### 6.1 Positions and routes (960 × 540 stage units)

| What | Value |
|---|---|
| Lane | y 212 |
| Sender | pill x 16, y 180, 150 × 64, `color.state.caller`, `Sender` at 33 |
| Channel | `point-to-point-channel` at x 196, scale 2.8, its arrow (y 19.5 in the icon) on the lane |
| Receiver | `idempotent-receiver` at x 520, scale 3.4, its arrow (y 24) on the lane |
| Store | x 560, y 366, 160 × 128; `42` at 36 when stored |
| Lookup | `messageArrow` (640, 274) → (640, 362), both heads; dashed width 2.5 at rest, solid width 4 while looking up |
| Token rests (`AT`) | sender (212, 212), channel (286, 212), door (488, 212), processed (852, 212), ghost (852, 320), ignored (852, 428) |
| Token | pill 56 high, at least 84 wide (19 per character + 44), `42` at 36 |
| Check | `checkBadge` (902, 178), r 22 |
| `?` | `questionToken` (700, 318), scale 2 |
| Badge | `countBadge` (912, 52), text 36 |
| Rewind mark | `uiIcon` `reset` x 826, y 28, size 48 |
| Rings | centre (960, 540) composition pixels |
| Route `send` | `M 212,212 L 286,212` |
| Route `deliver` | `M 286,212 L 488,212` |
| Route `process` | `M 488,212 C 600,110 760,140 852,212` |
| Route `ignore` | `M 488,212 C 560,320 780,300 852,428` (between the receiver and the store) |
| Guides | P1 `M 166,212 L 520,212`; P2 = `process`; P3 = `ignore`; drawn × 2 by `MotionPath` |

### 6.2 Layers (SCN-6), bottom to top

1 `Rings`; 2 the guides P1, P2, P3; 3 `below`: the lookup arrow; 4 `nodes`: sender, channel, receiver, store, stored ID; 5 `tokens`: ghost, message, copy, check, `?`; 6 `above`: badge, rewind mark. Every element sits in a group named by `data-element`; an element not drawn is left out of the tree.

### 6.3 Checks

- **Size:** every drawn word whose element has settled: `Sender` at least 33, `42`, `1` and `2` at least 36, measured as `font-size` times every scale applied. The `?` is exempt.
- **Placement:** every settled word box (advance on the `fonts/` faces times effective size), the badge (radius 26.18 plus half its outline, so a box of ±28) and the rewind mark lie inside the stage less 12 units, and no two of different elements cross. Exempt at a frame: an element popping, fading or leaving, and a token not at one of its rests.

## 7. Open points for G1

1. **The match (540–580).** Only the lookup arrow turns solid when the receiver finds 42; the store shows `42` all along. An option is a focus pulse on the stored `42` (`motion.focusScale`, 1.06) during the match. Recommended: add it; it shows the lookup the line states (L28, L32), no new claim.
2. **Length 26 s** (780 frames) against about 24 s at gate 0. Recommended: accept.
3. **The copy in the channel** (§2.6) rather than two tokens leaving together. Recommended: accept.

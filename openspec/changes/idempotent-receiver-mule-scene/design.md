# Design: idempotent-receiver-mule-scene

See `proposal.md` for the why. The approved concept is the gate-0 sheet `docs/spikes/2026-11-27-idempotent-receiver-storyboard/B-mule.png` (concept B, Mule; owner's pick of 2026-11-27); its notation script `storyboard.mts` is in the same folder, and its stage (`boxes`, `CLIENT`, `muleStage`) gave this scene's positions. What the sheet did not fix (timing, how a request travels, how the failure shows, the second request of each take) is decided here and marked as such. The book scene (`2026-11-28-idempotent-receiver-book-scene`) is the model for everything the two share.

## 1. The story and its lines

Every beat animates a line of the English page (the Portuguese page has the same lines) or its charge-flow diagram, whose alt text is line 42 and whose labels are the keys of `writing/integration-patterns-in-mulesoft/design/idempotent-receiver-in-mulesoft-charge-flow.json` at `0162e3a`:

| Beat | What the viewer sees | Source |
|---|---|---|
| The client asks for a charge | Balão speaks; the token `orderId` leaves it, passes the HTTP Listener and reaches the validator | L38 "receives `{ orderId, amount }`… the validator sits in the flow, after the source"; L42 |
| The validator looks up and stores the ID | the lookup turns solid; the first time a `?` shows that the `orderId` is not there; `orderId` appears in the store | L36 "lets through only messages with an ID it has not seen yet, stores the IDs in an object store"; L42 "looks up and stores the orderId"; L109 "stores the ID when it accepts the message, before the rest of the flow runs" |
| The charge goes through, 200 | the token reaches the Simulated charge; the statement gains a row and its count reads 1; `200` (green) travels back to Balão, who is pleased (`done`, `worked`) | L44 "the flow charges… and answers `accepted`… each one becomes an entry… in a statement"; L42 "200: accepted" |
| The same order again, 409 | Balão asks again; the validator finds `orderId` (the store comes into focus); the request turns orange; `409` (orange) travels back; no reaction; still one charge | L36 "throws `MULE:DUPLICATE_MESSAGE` for repeats"; L42 "MULE:DUPLICATE_MESSAGE gives 409: duplicate"; L95 and L159 "charged once; the second request comes back as `duplicate`" |
| Storing the charge fails, 500 | take 2: the token reaches the charge and turns red; `500` (red) travels back; Balão `failed`, `problem`; `orderId` stays in the store; the statement keeps no row | L109 "makes storing the charge fail… after the validator has already accepted the order"; L122 "The first attempt answers 500, the `orderId` stays in the store"; L42 "An error in the charge… gives 500, and the orderId stays in the store" |
| The retry gets the same 409 | the same 409 as in take 1, no reaction; the statement ends at 0, take 1's 1 faded beside it | L122 "the retry gets 409 and the statement ends with zero charges: the order is never charged. It is a quieter error than a double charge, because the retry got back a 409" |

## 2. Decisions

### 2.1 The EIP Mule scene type (`src/scenes/eip-mule.ts`)

The card asks that this first EIP video yield the reusable Mule scene type, as the book scene yielded the book scene type. The same options as the book scene's design §2.1 apply, and the same choice: **a React-free module beside the kinds, with only what every Mule scene draws**: the text sizes (`MULE_TEXT`, the book's 33 and 36), a component of the flow as a box with the diagram's name in centred lines at 33 (`component`), a token's rest centred above a component, clear of its words (`restAbove`, 36 above its top edge), and the client, Balão facing the flow (`client`). The token and the store are the book scene type's (`messageToken`, `emptyStore`, `storedId`). The statement, the counts and the failure belong to this page's example and stay in the scene.

What it does not cover, said plainly: the next Mule scene still writes its own six files (here about 450 lines of code, most of it frame and stage logic). As for the book scene type, the owner chose to extract a generic builder with the second scene of a type (book design §7, point 4); this design keeps that (§7, point 6).

### 2.2 Text sizes

As the book scene (its design §2.2): every word at least 33 stage units (`HTTP`, `Listener`, `Idempotent`, `Message`, `Validator`, `Simulated`, `charge`), every ID, code, count and take number at least 36 (`orderId`, `200`, `409`, `500`, `0`, `1`, `2`). The `?` is the `questionToken`'s symbol, exempt.

### 2.3 Takes and the rewind

As the book scene (its design §2.3) and `sdd-request-relay` (its design §2.7): before take 2 the stage, Balão included, is drawn from an object frame `o(f)`, which runs take 1 backwards during the rewind; the badge, the rewind mark and the emotes read the real frame (an emote is not replayed). From take 2 everything reads the real frame.

- `o(f) = f` before 610; `o(f) = round(609 − (f − 610) × 570 / 59)` from 610 to 669, so `o(610)` is 609 and `o(669)` is 39.
- **Take 2 is take 1 630 frames later** (`TAKE2_OFFSET`): the request, the lookup, the stored ID, the trip to the charge, the answer's trip, the retry, the match and the 409. It differs only at the charge (the `failed` cue at 846 turns the request red and the answer is `500`, where take 1's `charged` cue at 216 adds the statement row and the answer is `200`), in Balão's face and emote on the answer's arrival, and then adds take 1's count beside the statement.
- The rewind's reverse acts and faces are derived from take 1's with the object frame (as in `sdd-request-relay`, design §4.3): each reverse face restores the expression before it (639 `done`, 646 `idle`), and each act shows reversed (635–638, 667–669).
- The stage pops in during 0–39 and every pop has settled by frame 39, so the rewind lands on exactly the stage take 2 starts from.

### 2.4 How a request travels and how the outcome shows (decided here)

The sheet drew a token riding above a component (`onBox`). In motion, a request token `orderId` pops above Balão's head (where answers land), travels above the listener, then above the validator, and, if it is let through, above the charge; tokens are drawn above blocks (SCN-6), so they rest above the boxes, clear of their words. At the charge, take 1's request leaves as the statement gains its row and count (the charge recorded, L44); take 2's turns red (`color.state.failure`, the failure) and then leaves. At a match, the retry turns orange (`color.state.blocked`, the duplicate, as the diagram's `409: duplicate`) and then leaves. Each answer is its own token, `200`, `500` or `409` in its state colour, that pops where the request ended and travels back over the stage to Balão. The four dashed guides show each route while a token travels it.

**The provider request is not drawn.** The diagram (L42) and L44 put a fourth step after the charge, the payment request to the provider; the gate-0 sheet drew three components, and the trap the scene shows (L109, L122) fails at the charge, before it. So the `200` leaves the Simulated charge, and the provider's own failure (L122, second sentence) stays out of scope.

### 2.5 Reading devices and the cast

The scene uses the book scene's devices, approved at its gates, and the `takes` kind's: `takeNumbers` (setup, rewind), `rewind`, `lookupMark` (the `?` at each take's first lookup, when the store does not have the ID), `matchFocus` (the store and its `orderId` come into focus at each retry's match) and `ghost` (take 1's count `1` faded beside take 2's `0`, `motion.dimOpacity`).

Balão is the only actor (ADR 0007: the requester acting; gate 0 q2). Its acts are the two speaking spans of each take (40–68 and 340–368, and 630 later). Its faces: `done` with the `worked` emote when `200` arrives (264), `failed` with the `problem` emote when `500` arrives (894), each emote leaving 36 frames later (CAST-3, gone before Balão speaks again), and back to `idle` as its answer leaves (330, 960), before it asks again (340, 970; decided here). No face or emote when `409` arrives (gate 0 q3: the article's quiet error, L122).

### 2.6 Understanding before length (the owner, 2026-11-27)

The owner's rule of the book scene (its design §2.8) holds: the length is a result of the beats. Each take has two requests, so the scene runs 45 s (1350 frames): a 22-frame rest at the validator before each lookup, 82 frames from the 409's arrival to the rewind (528–609; the rewind starts at 610), and a 22-frame rest after take 2's 409 before take 1's count fades in (1158–1179).

### 2.7 Sources

`https://brunosouzas.com/wiki/idempotent-receiver-in-mulesoft/` and `https://brunosouzas.com/pt/wiki/idempotent-receiver-in-mulesoft/`, the book scene's.

## 3. Pieces

`diagramBox` (the three components, the tokens), `storeNode` (empty, and its words alone for the stored ID), `sheet` (the statement, one row with a check per charge), `countBadge` (the count, take 1's count faded, the take badge), `messageArrow` (the lookup, both heads), `questionToken`, `balao`, `emote` (`worked`, `problem`), `uiIcon` (`reset`, the rewind mark), and the components `Rings` and `MotionPath`, through the Mule and book scene types. No colour literal; the fills are `color.white`, `color.state.healthy` (`200`), `color.state.blocked` (the duplicate and `409`) and `color.state.failure` (the failed request and `500`), ADR 0006.

## 4. Beat table (30 fps, `motion.travel` 22, `motion.fade` 10)

### 4.1 Phases

| Phase | Take | Frames | Cites | Devices |
|---|---|---|---|---|
| `setup` | 1 | 0–39 | 38, 42 | `takeNumbers` |
| `t1-send` | 1 | 40–119 | 38, 42 | |
| `t1-lookup` | 1 | 120–179 | 36, 42 | `lookupMark` |
| `t1-charge` | 1 | 180–239 | 44, 109 | |
| `t1-answer` | 1 | 240–329 | 42, 44 | |
| `t1-retry` | 1 | 330–419 | 95, 159 | |
| `t1-match` | 1 | 420–499 | 36, 95 | `matchFocus` |
| `t1-duplicate` | 1 | 500–609 | 42, 44, 95 | |
| `rewind` | rewind | 610–669 | 122 | `rewind`, `takeNumbers` |
| `t2-send` | 2 | 670–749 | 38, 42 | |
| `t2-lookup` | 2 | 750–809 | 36, 42 | `lookupMark` |
| `t2-charge` | 2 | 810–869 | 109 | |
| `t2-answer` | 2 | 870–959 | 109, 122 | |
| `t2-retry` | 2 | 960–1049 | 122 | |
| `t2-match` | 2 | 1050–1129 | 109, 122 | `matchFocus` |
| `t2-duplicate` | 2 | 1130–1179 | 122 | |
| `t2-compare` | 2 | 1180–1249 | 122 | `ghost` |

Duration 1350, outro 1250 (a still of 100 frames, at least `motion.readingHold` 90), rings fade 0–20. Each phase's events are every change frame below that falls in it, Balão's acts, faces and emotes included.

### 4.2 Elements and cues

How things move: the components, the store (with the lookup arrow), the statement and Balão pop in with `blockPopIn`; the tokens, the stored ID, the count's change, the `?`, the badge and the rewind mark with `pillPopIn`; the emotes with `emotePop`. An element popping at frame a is drawn from a + 1 and settled from a + 30. A trip from a to a + 22 moves along its route from a to a + 21 and is at its destination from a + 22. Tokens, the `?`, the emotes and the rewind mark leave over 10 frames (`leave`). The store's focus rises and falls with the `motion.focus` spring to `motion.focusScale` (1.06), exactly 1.06 from `on` + 30 and exactly 1 from `off` + 30. Fades are linear.

| Frame (take 1) | Take 2 | Element | Change |
|---|---|---|---|
| 1, 2, 3, 4, 5, 6, 9 | | `balao`, `listener`, `validator`, `charge`, `store` (with the lookup arrow), `statement` (with the count `0`), `badge1` | pop in |
| 40 | 670 | `request` | pops above Balão (`AT.client`); Balão speaks 40–68 (670–698) |
| 40–50 / 208–218 | 670–680 / 838–848 | guide P1 (client to charge) | fades in / out |
| 46 → 68 | 676 → 698 | trip `send` | `AT.client` → `AT.listener` |
| 76 → 98 | 706 → 728 | trip `pass` | `AT.listener` → `AT.validator` |
| 120 / 170 | 750 / 800 | lookup | solid / back to dashed |
| 124 (leaves 160) | 754 (leaves 790) | `question` | pops |
| 180 | 810 | `stored` | `orderId` pops in the store |
| 186 → 208 | 816 → 838 | trip `charge` | `AT.validator` → `AT.charge` |
| 216 | | `charged` cue | the statement gains its row; the count pops reading `1` |
| | 846 | `failed` cue | the request turns red |
| 226 | 856 | `request` | leaves |
| 236 | 866 | `answer` | `200` (green; take 2: `500`, red) pops at `AT.charge` |
| 236–246 / 264–274 | 866–876 / 894–904 | guide P2 (charge to client) | fades in / out |
| 242 → 264 | 872 → 894 | trip `reply` | `AT.charge` → `AT.client` |
| 264 (leaves 300) | 894 (leaves 930) | Balão | face `done` and emote `worked` (take 2: `failed`, `problem`) |
| 330 | 960 | Balão, `answer` | face `idle`; the answer leaves |
| 340 | 970 | `retry` | pops above Balão; Balão speaks 340–368 (970–998) |
| 340–350 / 398–408 | 970–980 / 1028–1038 | guide P3 (client to validator) | fades in / out |
| 346 → 368, 376 → 398 | 976 → 998, 1006 → 1028 | trips `retrySend`, `retryPass` | as `send`, `pass` |
| 420 / 470 | 1050 / 1100 | lookup | solid / dashed: the match, no `?` |
| 425 / 465 | 1055 / 1095 | `focus` cue | the store and its `orderId` rise to focus / fall back |
| 480 | 1110 | `duplicate` cue | the retry turns orange |
| 490 | 1120 | `retry` | leaves |
| 500 | 1130 | `duplicate` | `409` (orange) pops at `AT.validator` |
| 500–510 / 528–538 | 1130–1140 / 1158–1168 | guide P4 (validator to client) | fades in / out |
| 506 → 528 | 1136 → 1158 | trip `dupReply` | `AT.validator` → `AT.client`; no reaction |
| 610 (leaves 670) | | `rewindMark` | pops |
| 610–669 | | rewind | object frames 609 → 39 |
| 660 | | `badgeSwap` | the badge reads `2` (no new pop) |
| | 1180–1190 | `ghost` | take 1's count `1` fades in beside the count (to `motion.dimOpacity`) |
| | 1250–1349 | everything | still |

## 5. Words

`text.en`: `listener` ["HTTP", "Listener"], `validator` ["Idempotent", "Message", "Validator"], `charge` ["Simulated", "charge"] (the diagram's names, L42), `id` "`orderId`" (L38, L42, drawn in the mono face), `accepted` "200", `duplicate` "409", `failed` "500" (L42), `counts` ["0", "1"] (the statement's charges, L44, L122), `question` "?" (the `questionToken`'s symbol), `takes` ["1", "2"]. No caption (SCN-2).

## 6. Layout

### 6.1 Positions and routes (960 × 540 stage units)

| What | Value |
|---|---|
| Balão | `balao` at x 112, ground 336, scale 0.8, facing right |
| HTTP Listener | box x 215, y 150, 160 × 112, `HTTP` / `Listener` at 33 |
| Idempotent Message Validator | box x 415, y 132, 236 × 148, three lines at 33 |
| Simulated charge | box x 691, y 150, 176 × 112, two lines at 33 |
| Store | x 433, y 374, 200 × 122; `orderId` at 36 when stored; focus about its centre (533, 435) |
| Lookup | `messageArrow` (533, 284) → (533, 370), both heads; dashed width 2.5 at rest, solid width 4 while looking up |
| Statement | `sheet` x 725, y 314, 108 × 190, top 52, step 44; one row (bar 52, a check) per charge |
| Count | `countBadge` (833, 314), text 36; take 1's count faded at (903, 314) |
| Token rests (`AT`) | client (112, 140), listener (295, 114), validator (533, 96), charge (779, 114): 36 above each box's top edge |
| Token | the book scene's: a pill 56 high, at least 84 wide (19 per character + 44), its word at 36 |
| `?` | `questionToken` (593, 327), scale 2 |
| Emote | `emote` x 34, y 214, scale 0.75 (the gate-0 sheet's place, beside Balão's head) |
| Badge | `countBadge` (912, 52), text 36 |
| Rewind mark | `uiIcon` `reset` x 826, y 28, size 48 |
| Rings | centre (960, 540) composition pixels |
| Route `send` (and `retrySend`) | `M 112,140 C 190,140 220,114 295,114` |
| Route `pass` (and `retryPass`) | `M 295,114 C 380,114 450,96 533,96` |
| Route `charge` | `M 533,96 C 620,96 700,114 779,114` |
| Route `reply` | `M 779,114 C 779,44 230,40 112,140` |
| Route `dupReply` | `M 533,96 C 533,40 230,40 112,140` |
| Guides | P1 `send`, `pass`, `charge` joined; P2 `reply`; P3 `send`, `pass` joined; P4 `dupReply`; drawn × 2 by `MotionPath` |

### 6.2 Layers (SCN-6), bottom to top

1 `Rings`; 2 the guides P1 to P4; 3 `below`: the lookup arrow; 4 `nodes`: listener, validator, charge, store, stored ID, statement, count; 5 `cast`: Balão, emote; 6 `tokens`: ghost, request, answer, retry, duplicate, `?`; 7 `above`: badge, rewind mark. Every element sits in a group named by `data-element`; an element not drawn is left out of the tree.

### 6.3 Checks

- **Size:** every drawn word whose element has settled: the seven component words at least 33; `orderId`, `200`, `409`, `500`, `0`, `1` and `2` at least 36, measured as `font-size` times every scale applied. The `?` is exempt.
- **Placement:** every settled word box (advance on the `fonts/` faces times effective size), the `?` included, the badge (a box of ±28) and the rewind mark lie inside the stage less 12 units, and no two of different elements cross. Exempt at a frame: an element popping, fading, leaving or in focus, and a token not at one of its rests.

## 7. Open points for G1

Decided already, so not asked again: the `?` at each take's first lookup only (gate 0, approved with concept B; the book scene's G1, point 7), and a generic Mule builder only with the second Mule scene (the owner's rule for a scene type, the book scene's G1, point 4; §2.1).

1. **Length.** The scene is 45 s, the book scene 30 s: each take has two requests (§2.6). Options: (a) keep 45 s; (b) shorten the rests and holds to about 40 s. Recommended: (a), by the owner's rule.
2. **How the failure shows** (§2.4). The request turns red at the charge, and `500` travels back on a grey dashed guide, like every route. Options: (a) as now; (b) the `500`'s route drawn red, as the gate-0 sheet drew a red failure arrow (`messageArrow` kind `failure`). Recommended: (a): the red `500` and the red request carry the failure, and the guides stay one notation; (b) would add an arrow the other routes do not have.
3. **No focus at the 500.** The `orderId` stays in the store from the 500 on; the store comes into focus only at the retry's match, which shows that it stayed. Options: (a) as now; (b) also bring the store into focus when the 500 arrives. Recommended: (a), one focus per lookup as in the book scene.
4. **The emote's place** (§6.1): beside Balão's head, as the gate-0 sheet drew it; the emote touches Balão's left hand. Options: (a) keep the sheet's place; (b) move it up and left, clear of the hand. Recommended: (a), approved at gate 0; (b) if the stills read cluttered.

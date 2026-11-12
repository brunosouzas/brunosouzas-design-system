# Design: circuit-breaker-topology-scene

See `proposal.md` for the why. This file holds:

- §1 the story;
- §2 the decisions;
- §3 the pieces;
- §4 the beat table, frame by frame;
- §5 the reading choices;
- §6 the layout and the text sizes;
- §7 the stills plan;
- §8 the article lines.

What was observed is marked with its file; what is assumed is marked "assumed".

Observed sources:

- **The gate-0 sheet** `concept-A-two-takes.png` (brain vault, `evidence/2026-11-12-circuit-breaker-gate-0/`) and its prototype `~/.hermes/cache/scratch/ab334-cb-scene/` (`lib.ts`, `concept-a.ts`). They are drawn on a 960 × 540 frame with the 0.12.0 pieces.
- **The English article** `brunosouzas-content/writing/circuit-breaker-in-mulesoft/circuit-breaker-in-mulesoft.en.md` at commit `728d6f4` (2026-11-05). Line numbers `Lnn` below are that file's.
- **The code** at `655525d` (0.12.0).
- **PR #41's branch** `feature/ab144-sdd-without-with-spec-scene` at `852bcd0`: `src/scenes/takes-kind.ts`, its archived change `2026-11-12-sdd-without-with-spec-scene`, `MotionPath` and `motionPathAt`.

## 1. The story: what the viewer must understand

One checkout and one payment service, played twice. **Take 1:** checkout retries every failed call three times, so the slow service gets three times the load and goes down: 20 requests, 60 backend calls. **Take 2,** after a rewind: the breaker wraps the call. It watches the failures in a window, opens when the failure rate passes the threshold, and fails the next calls at once with a clear message, so the service is left alone (5 calls, not 60). It tests recovery on its own after `resetTimeout`, closes again, ignores one unlucky timeout and a business error, and ends healthy. The viewer should leave with L25: retry "becomes the final push", and a circuit breaker "stops hammering the service that's already struggling, fails the next requests immediately with a clear error, and tests recovery on its own".

| State | What is on stage | Changes into the next state when |
|---|---|---|
| S0 set-up | rings, Checkout with `retry ×3`, Payment (three white lights), one direct arrow, take badge `1`, counters `0` `requests` and `0` `backend calls` | the first request leaves |
| S1 retry storm | tokens in threes along the direct line; the counters climb to 20 and 60; a red `HTTP:TIMEOUT` reply line; the lights go red at calls 20, 40 and 60 | the 60th call arrives |
| S2 down | everything still: 20, 60, three red lights | the rewind mark appears |
| S3 rewind | take 1 plays backwards to S0; then badge `2` | the breaker drops onto the line |
| S4 wrapped | `circuit-breaker:execute` between them, pill `CLOSED`, empty window of 5 and its bar with the 80% tick, one red light (the service is slow) | the first request leaves |
| S5 CLOSED, failing | five calls reach Payment and come back `HTTP:TIMEOUT`; each adds a red square, the bar grows 20% at a time | the fifth square takes the bar past the tick |
| S6 OPEN | pill `OPEN`; the line to Payment dimmed and dashed; the clock `resetTimeout 10s` runs; 15 requests bounce back at once with `CIRCUIT-BREAKER:OPEN` and `payment temporarily unavailable`; `20` requests, `5` backend calls beside a ghost `60` | the clock runs out |
| S7 HALF_OPEN, fails | pill `HALF_OPEN`; the counters leave; one test call times out | the reply reaches the breaker |
| S8 OPEN again | pill `OPEN`; the clock runs again; three requests fail fast | the clock runs out |
| S9 HALF_OPEN, recovers | one test call; Payment's red light clears; `200` comes back | the reply reaches the breaker |
| S10 CLOSED, noise | the window clears; normal traffic; one timeout leaves the bar at 20%, under the tick | the fifth result |
| S11 CLOSED, business error | a `400` comes back; its square drops off; window and bar unchanged | the `400` reaches Checkout |
| S12 CLOSED, healthy | three more successes slide the timeout out of the window: five ✓, bar empty | the final still is held |

## 2. Decisions

### 2.1 How this change relates to PR #41 (G1 question 1)

PR #41 (AB#144, draft, implemented and waiting for the owner's media gate) adds what a two-take scene needs: neutral scenes (`neutral`, one composition `<scene>-<format>`, one `en` table, both sources), the `takes` kind (`src/scenes/takes-kind.ts`: take order, a cited line per phase, cast timing, the reading hold) and `MotionPath`/`motionPathAt`. `main` has none of them.

| Option | Result |
|---|---|
| A. Specify a second `takes` kind and neutral scenes here, against `main` | two definitions of the same rules; the same files (`catalogue.ts`, `index.ts`, `Root.tsx`, `components.tsx`, `motion.ts`) edited by both pull requests; conflicts in code and in the archived specs |
| B. Branch this change from #41's branch | the spec pull request would carry #41's commits and could not merge before #41; a reviewer reads two changes at once |
| **C. Depend on #41; spec deltas only ADD requirements here, under names #41 does not use; implement after #41 merges, rebased onto that `main` (chosen)** | the spec branch touches only `openspec/changes/circuit-breaker-topology-scene/`, so it conflicts with nothing; at implementation the scene is one more `takes` scene and the shared code is #41's |

How C avoids conflicts:

- **Requirement names** all start with "Topology" (or "Failure-rate bar"). #41 adds "Neutral scenes", "Two-take …", "SDD …" and "Dashed motion path", and modifies four existing requirements. This change modifies none.
- **The one shared assertion.** #41's "Three kinds in the catalogue" test lists every registered scene. It is the one allowed edit (scene-workflow: "the one allowed edit is an assertion that lists every registered scene"). Its spec text stays true: it is a GIVEN about those three scenes.
- **No edit to #41's files** `takes-kind.ts`, `components.tsx` (`MotionPath`) or `motion.ts`. The failure-rate bar lives in new files (§2.4).
- **Edits to shared files are one line each,** after the rebase: `src/scenes/index.ts`, `src/Root.tsx`, the README scene table, the roadmap row and the ADR 0004 amendment.

If #41 changes before it merges (its G3 may ask for changes), the rebase picks them up; this change uses only the interfaces named above.

### 2.2 The text-size rule (owner's correction at gate 0)

On the sheet, labels were 15 stage units (30 px in the composition). A 16:9 video shown 360 CSS px wide on a phone is drawn at 360 / 1920 = 0.1875 of the composition, so those labels read at 5.6 px. The rule:

- **Every string the scene draws** has an effective font size of at least **30 stage units**. That is 60 px in the 1920 × 1080 composition and **11.25 px on a 360 px wide phone**. "Effective" means the piece's `font-size` times every scale applied to it once its pop-in has settled.
- **State names, the take number and the counter numbers** have at least **36 stage units** (13.5 px on the phone).
- **The glyphs ✓ and ✕** in the window's squares count as strings. Squares are 50 units, so the glyph is 0.62 × 50 = 31.
- **Words were cut where the frame cannot hold them** at that size:
  - `Payment` instead of `Payment service` (the pill would pass the frame's right edge);
  - `circuit-breaker:` / `execute` on two lines (one line needs a 440-unit box, which leaves 46 units of arrow on each side);
  - the customer message on two lines, `payment temporarily` / `unavailable`;
  - no `400` inside the dropped square (it would be 27 units).

| Option | Why not, or why |
|---|---|
| Keep the sheet's sizes and rely on the article text | the owner rejected it at gate 0 |
| Scale the whole stage up and crop | the topology no longer fits; the comparison needs both ends on screen |
| **A minimum per string, measured, with words cut to fit (chosen)** | readable on a phone; a test can prove it (§6.3) |

Rejected minimum: 36 for every string. `CIRCUIT-BREAKER:OPEN` would be 432 units wide and could not sit beside the customer message.

### 2.3 Stage units

As in #41 §2.3, the pieces are laid out in **960 × 540 stage units**, in SVG with `viewBox="0 0 960 540"`, filling the 1920 × 1080 composition. The gate-0 outline weights and proportions hold.

- **The React components** (`CallSquare`, `Countdown`, `PositionedToken` and the new `FailureRateBar`) are drawn inside a 960 × 540 box scaled × 2. Their sizes and outlines are therefore in stage units, like the pieces.
- **`Rings` and `MotionPath`** read composition-pixel tokens (`scene.*`). They stay in composition pixels, at stage coordinates × 2, below the stage layers (as in #41).

### 2.4 The failure-rate bar (G1 question 12)

The bar with its threshold tick is the one shape the scene needs that neither the pieces nor the components have. On the sheet it was storyboard notation in `lib.ts` (`windowOf`).

| Option | Why not, or why |
|---|---|
| A new piece in `src/pieces/` | a public, frozen, schema-checked piece for one scene; the frozen fixtures and the palette test grow; the package API changes |
| Drawn in the scene's own files | breaks MOT-6 (shared shapes go to `src/brand/` or the pieces) and the "no shape of its own" rule the scenes follow |
| **A component `FailureRateBar` in a new file `src/brand/rate-bar.tsx`, with its pure geometry in `src/brand/rate-bar-shape.ts` (chosen)** | the shape lives in `src/brand/` next to `CallSquare` and `Countdown`; new files do not touch #41's edits of `components.tsx` and `motion.ts`; `src/brand/` is not shipped, so the package API does not change |

**Props:** `rate` (0–1), `threshold` (0–1, exclusive), `width`, `height`. It reads no frame.

**Drawing:**

- **Track:** white, outline `outline.small`, ends rounded to `height / 2`.
- **Fill:** from the left, `rate × width` wide but never narrower than `height` when `rate > 0`. Its colour is `color.state.failure` with the same outline. Nothing is drawn at `rate = 0`.
- **Tick:** an ink line at `threshold × width`, from `0.5 × height` above the track to `0.5 × height` below it, stroke `outline.small + 0.5`, round caps. The tick sits above the fill.

**Invalid input:** a `rate` outside [0, 1], a `threshold` outside (0, 1), or a `width` or `height` that is not finite or not above 0 throws a `RangeError` naming the prop.

**The two files.** The geometry function returns the three shapes as data, so vitest checks them without a browser. The `.tsx` draws them. The two have different names because of the macOS case-insensitive pitfall in scene-workflow. The scene computes the rate it passes (§4.6).

### 2.5 The rewind (reading device, approved at gate 0)

The **object layer** is drawn from an **object frame** `o(f)`: the take-1 tokens, the counters' values, Payment's lights, the direct request and reply arrows, the `HTTP:TIMEOUT` tag of take 1 and the `retry ×3` pill.

- `o(f) = f` before 450;
- `o(f) = round(449 − (f − 450) × 390 / 49)` from 450 to 499, so `o(450) = 449` and `o(499) = 59`: take 1 backwards in 50 frames;
- `o(f) = 59` from 500 to 509.

From 510 the take-1 objects are those of object frame 59: the `retry ×3` pill and the direct request arrow, which then leave (§4.2). The counters keep their `0` values and count take 2 from there.

The rings, Checkout, Payment's boxes and labels, the take badge and the rewind mark are drawn from the real frame. `frameAt(f)` computes the whole stage state from `f` and `o(f)`, and no component reads the frame except `Rings` (its fade ends at 20) and `CallSquare` (its own pop, which is not in the object layer).

Rejected: a cut to take 2 with only the mark. It reads as a new scene, not "the same 20 requests again".

### 2.6 Pop-ins and when an element is drawn

Blocks pop with `blockPopIn` and pills, badges and labels with `pillPopIn` (`src/brand/motion.ts`). An element is drawn when its opacity is above 0 and its scale above 0.001, so an element popping at frame *a* first shows at *a* + 1. From *a* + `motion.fps` the scene draws it exactly settled (opacity 1, scale 1), as #41 does. A piece without a `scale` parameter pops inside a group scaled about its anchor, with the opacity on that group.

`leave(f, at)` (`src/brand/cast-motion.ts`, 10 frames) multiplies the opacity of an element that leaves. A linear `fadeIn` (`src/brand/motion.ts`) moves an opacity between two values over `motion.fade` frames.

A **swap** (a state pill, the badge, a tag whose text changes) removes the old element on frame *a* and pops the new one at *a*. Window squares pop through `CallSquare`'s own spring (`appearAt`).

### 2.7 Tokens on the lines

Each request or reply is one `PositionedToken`: white fill, ink outline, radius 11 stage units.

- **A leg** is a straight route travelled in `motion.travel` (22) frames, linear by length. A token is drawn from its leg's start frame up to the frame before its arrival.
- **Through the breaker:** a request that passes the breaker ends its `in-req` leg on the breaker's left edge and starts its `out-req` leg on the right edge on the same frame. The scene never draws a token inside the box.
- **A fail-fast reply** starts its `in-rep` leg on the frame its request arrives.
- **Take 1** draws request tokens only, on `direct-req`. The `HTTP:TIMEOUT` reply is the red reply arrow and its tag. Sixty reply tokens would add nothing the arrow does not say.

### 2.8 Result tags

There are three tag places: `direct` (take 1), `left` (Checkout ↔ breaker) and `right` (breaker ↔ Payment). A tag is an `edgeLabel` with a backdrop.

- **Text:** a gap's tag shows the code of the latest reply leg started on that gap, from that leg's start frame.
- **Leaving:** the tag leaves (10 frames) where §4.2 says so: at a state change that cuts or dims its gap, and at the HALF_OPEN starts. Otherwise it stays, so the final still shows `200` on both gaps (sheet frame 8).
- **Swaps:** a change of text is a swap (§2.6). The same text again is not.

### 2.9 Colour roles (ADR 0006 and ADR 0009; owner's correction)

| Colour token | Only on |
|---|---|
| `color.state.failure` (red) | Payment's failing lights, the ✕ squares, the bar's fill, and arrows of kind `failure` |
| `color.state.failFast` | arrows of kind `failFast` |
| `color.state.blocked` (orange) | the `OPEN` pill |
| `color.state.healthy` | the `CLOSED` pill |
| `color.state.transitional` | the `HALF_OPEN` pill |
| `color.state.caller` | the `Checkout` label |
| `color.state.backend` | nowhere; the `Payment` label is white (the owner's correction) |

Everything else is white, ink or a neutral the pieces draw (`color.panel`, `illustration.textBar`, the backdrop).

## 3. Pieces and components (MOT-6, CAST-1)

There is no character, no emote and no caption.

| On stage | Drawn with |
|---|---|
| Checkout | `browserWindow` and a `diagramBox` (`shape: "pill"`) label |
| Payment | three `serverStack` (`units: 1`, `failing: 0` when red) and a `diagramBox` pill label |
| breaker | `diagramBox` (box) with two code lines |
| state pill, `retry ×3` | `diagramBox` (`shape: "pill"`) |
| arrows | `messageArrow` (`curve: "straight"`, `width: 3`; kinds `message`, `reply`, `failure`, `failFast`; `dashed: true` when cut) |
| tags, clock label, captions, customer message | `edgeLabel` |
| take badge, counters | `countBadge` |
| rewind mark | `uiIcon` `reset` |
| window squares | `CallSquare` |
| clock | `Countdown` |
| bar | `FailureRateBar` (new, §2.4) |
| tokens | `PositionedToken` |
| drop-in path | `MotionPath` (#41) |
| stage rings | `Rings` |

`pill` is not used: it has no `textSize`, and its height (`cover.pillHeight` 36) is fixed. The scene's files contain no colour literal and create no SVG shape of their own.

## 4. Beat table

Constants: `motion.fps` 30, `motion.travel` (T) 22, `motion.fade` (F) 10, `motion.readingHold` 90. Duration **1920** frames (64 s), outro **1800**, final hold 1800–1919 (120 frames).

### 4.1 Phases

Takes follow #41's `takes` kind.

| # | Phase id | Take | Frames | Cites (English lines) | Devices |
|---|---|---|---|---|---|
| 1 | `setup` | 1 | 0–59 | 23 | takeNumbers |
| 2 | `retry` | 1 | 60–389 | 23, 25, 27, 29 | — |
| 3 | `down` | 1 | 390–449 | 23, 29 | — |
| 4 | `rewind` | rewind | 450–509 | 27 | rewind, takeNumbers |
| 5 | `wrap` | 2 | 510–569 | 30, 52, 59, 60, 61 | — |
| 6 | `closed` | 2 | 570–819 | 30, 42, 43, 46, 66, 150 | — |
| 7 | `open` | 2 | 820–949 | 30, 43, 71, 73, 77 | — |
| 8 | `half-open-fail` | 2 | 950–1019 | 44, 46, 77, 95 | — |
| 9 | `open-again` | 2 | 1020–1149 | 43, 46, 77 | — |
| 10 | `half-open-ok` | 2 | 1150–1219 | 44, 46, 75, 81, 95 | — |
| 11 | `closed-noise` | 2 | 1220–1489 | 42, 66, 75, 150 | — |
| 12 | `closed-business` | 2 | 1490–1599 | 68, 92, 153 | — |
| 13 | `closed-healthy` | 2 | 1600–1799 | 42, 66, 75 | — |

Every phase's `events` are the cue frames of §4.2 that fall inside it. The timeline's `acts`, `faces` and `emotes` are empty. `rewind` is `{ from: 450, to: 499, objects: [449, 59] }`.

### 4.2 Frame table (frames, element, action, article line)

| Frames | Element | Action | Line |
|---|---|---|---|
| 0–20 | rings | fade in | — |
| 4 | Checkout (window and label) | pops (block) | L23 |
| 8 | Payment (three units, white lights, label) | pops (block) | L23 |
| 12 | badge `1` | pops (pill) | device |
| 16–26 | arrow `direct-req` (message) | fades in | L23 |
| 20 | `retry ×3` | pops (pill) | L23, L29 |
| 24 | counters `0` `requests`, `0` `backend calls` | pop (pill) | L27, L29 |
| 60 + 15(k − 1), k = 1…20 | `requests` counter | reads k | L27 |
| 60 + 5(n − 1), n = 1…60 | attempt n | departs on `direct-req` (attempts 3k−2, 3k−1, 3k belong to request k) | L23, L29 |
| 82 + 5(n − 1) | attempt n | arrives; `backend calls` reads n | L29 |
| 82–92 | arrow `direct-rep` (failure) | fades in | L27 |
| 82 | tag `direct` `HTTP:TIMEOUT` | pops | L27 |
| 177 / 277 / 377 | Payment unit 0 / 1 / 2 | light turns red (calls 20, 40, 60) | L23 |
| 390–449 | everything | still: `20`, `60`, three red lights | L23, L29 |
| 450 | rewind mark | pops (pill) beside the badge | device |
| 450–499 | object layer | plays from object frame 449 back to 59 (§2.5) | device |
| 500 | badge | swap `1` → `2` | device |
| 510 | `retry ×3` | leaves (gone 520) | choice, §5 |
| 510–520 | arrow `direct-req` | fades out | L52 |
| 510–520, 542–552 | drop path (`MotionPath`, (480, −60) → (480, 246)) | fades in, fades out | device |
| 520 | rewind mark | leaves (gone 530) | device |
| 520–542 | breaker box | travels down the drop path (its centre on the path) | L52, L59–61 |
| 542–552 | arrows `in-req`, `out-req` (message) | fade in | L30 |
| 548 | pill `CLOSED` | pops | L42 |
| 554 | window (five empty slots) and bar (rate 0, tick 0.8) | pop (block) | L66, L150 |
| 560 | Payment unit 0 | light turns red (slow, not down) | L23, choice |
| d = 576 + 42i, i = 0…4 | call i | departs `in-req`; `requests` reads i + 1 | L30 |
| d + 22 | call i | `out-req` | L30 |
| d + 44 | call i | arrives; `backend calls` reads i + 1; `out-rep` (failure) departs | L30, L27 |
| d + 66 | call i | square i (✕) pops; bar eases to (i + 1)/5 over F; `in-rep` (failure) departs | L66 |
| 620–630; 642–652 | arrows `out-rep`; `in-rep` (failure) | fade in | L27 |
| 620; 642 | tag `right`; tag `left` `HTTP:TIMEOUT` | pop | L27 |
| 768 | window | 4 of 5 ✕, rate 0.8 = threshold: still CLOSED | L43, L46 |
| 810 | window | 5 of 5 ✕, rate 1.0 > 0.8 | L30, L43 |
| 820 | pill | swap `CLOSED` → `OPEN` | L43 |
| 820–830 | arrows `out-req`, `out-rep` | dashed from 820, opacity 1 → 0.25 | L43, L73 |
| 820 | tag `right` | leaves (gone 830) | L43 |
| 820 | clock and label `resetTimeout 10s` | pop; ring full at 820, empty at 949 (`countdownLeft(f, 820, 949)`) | L77, L95 |
| e = 822 + 6j, j = 0…14 | request 6 + j | departs `in-req`; `requests` reads 6 + j | L30 |
| e + 22 | request 6 + j | arrives at the breaker; `in-rep` (failFast) departs | L30, L43 |
| 844 | arrow `in-rep` | kind failure → failFast | L30 |
| 844 | tag `left` | swap `HTTP:TIMEOUT` → `CIRCUIT-BREAKER:OPEN` | L30, L71 |
| 844 | customer message `payment temporarily` / `unavailable` | pops | L71 |
| 912 | ghost `60` beside `5` | pops at opacity 0.4 | L29, L30; choice |
| 950 | pill | swap `OPEN` → `HALF_OPEN` | L44 |
| 950 | counters, ghost, tag `left`, customer message | leave (gone 960) | choice |
| 950–960 | arrows `in-req`, `in-rep` | opacity 1 → 0.25 | L44 |
| 950–960 | arrows `out-req`, `out-rep` | solid from 950, opacity 0.25 → 1 | L44 |
| 950–960 | window and bar; clock | opacity → 0.3; → 0.6 (ring empty) | choice |
| 966–988 | test call 1 | `out-req` (appears on the breaker's right edge) | L44 |
| 988–1010 | test call 1 | `out-rep` (failure); tag `right` `HTTP:TIMEOUT` pops at 988 | L46 |
| 1020 | pill | swap `HALF_OPEN` → `OPEN` | L46 |
| 1020–1030 | arrows `out-req`, `out-rep` | dashed, → 0.25; tag `right` leaves at 1020 | L43 |
| 1020–1030 | arrows `in-req`, `in-rep`; window and bar; clock | → 1 | L46 |
| 1020 | clock | refilled; ring full at 1020, empty at 1149 | L77 |
| e = 1040, 1070, 1100 | request | departs `in-req`; at e + 22 `in-rep` (failFast) departs | L43 |
| 1062 | tag `left` `CIRCUIT-BREAKER:OPEN`, customer message | pop | L71 |
| 1150 | pill | swap `OPEN` → `HALF_OPEN` | L44 |
| 1150 | tag `left`, customer message | leave (gone 1160) | — |
| 1150–1160 | same dimming as 950–960 | | L44 |
| 1166–1188 | test call 2 | `out-req` | L44, L95 |
| 1188 | Payment unit 0 | light clears (white) | L81; choice |
| 1188 | arrow `out-rep` | kind → reply; tag `right` `200` pops | L75 |
| 1188–1210 | test call 2 | `out-rep` (reply) | L75 |
| 1220 | pill | swap `HALF_OPEN` → `CLOSED` | L95 |
| 1220 | the five ✕ squares; clock | leave (gone 1230); slots empty | L95; choice |
| 1220–1230 | bar rate 1 → 0; window, bar, `in-req`, `in-rep` → opacity 1; `in-rep` kind → reply | | L42 |
| g = 1236 + 40i, i = 0…4 | call c*i* | `in-req` g, `out-req` g + 22, `out-rep` g + 44, square at g + 66, `in-rep` g + 66 | L42, L75 |
| 1316 (c2) | call c2 | times out: `out-rep` and `in-rep` kind failure, tags `HTTP:TIMEOUT` (1360 right, 1382 left), square ✕ at 1382, bar eases to 0.2 | L66, L150 |
| 1400; 1422 | arrows `out-rep`; `in-rep` | kind back to reply; tags swap back to `200` | L75 |
| 1302 | tag `left` `200` | pops | L75 |
| 1462 | window | `✓ ✓ ✕ ✓ ✓`, rate 0.2 < 0.8: CLOSED | L66 |
| 1500 | call c5 | `in-req` 1500, `out-req` 1522, `out-rep` (reply) 1544, `in-rep` (reply) 1566 | L68 |
| 1544; 1566 | tags `right`; `left` | swap to `400` | L92 |
| 1566 | dropped square (`CallSquare` `empty`) | pops at slot 5 | L68; choice |
| 1576–1586 | dropped square | falls 40 units and fades out | L68; choice |
| 1566–1599 | window and bar | unchanged | L68 |
| g = 1610, 1650, 1690 | calls c6, c7, c8 (200) | legs as above; tags swap back to `200` at 1654 (right) and 1676 (left) | L75 |
| 1676, 1716, 1756 | window | slides (§4.6); new ✓ pops in slot 4 | L66 |
| 1756–1766 | bar | rate 0.2 → 0 | L66 |
| 1778 | call c8 | arrives at Checkout: the last movement | L75 |
| 1800–1919 | everything | still: `CLOSED`, five ✓, empty bar, `200` both sides, badge `2` | L42, L75; SCN-4 |

### 4.3 Routes (stage units)

| Route | From | To |
|---|---|---|
| `direct-req` | (218, 228) | (740, 228) |
| `direct-rep` (arrow only) | (740, 266) | (218, 266) |
| `in-req` | (218, 228) | (316, 228) |
| `out-req` | (644, 228) | (740, 228) |
| `out-rep` | (740, 266) | (644, 266) |
| `in-rep` | (316, 266) | (218, 266) |
| drop path (breaker centre) | (480, −60) | (480, 246) |

Each arrow is drawn on its route with a head at the end. A leg's `trips` entry in the timeline has `route`, `from` and `to = from + motion.travel`.

### 4.4 Counters

| Frames | `requests` | `backend calls` |
|---|---|---|
| 24–59 and take 1 by object frame | requests departed (0–20) | attempts arrived (0–60) |
| 510–819 | calls departed in take 2 (0–5), then 6–20 at the fail-fast departures | calls arrived at Payment (0–5) |
| 820–949 | up to 20 at 906 | 5; ghost `60` from 912 |
| from 950 | leaving, gone 960, then not drawn | the same |

### 4.5 Arrows per frame range

| Frames | `in-req` | `in-rep` | `out-req` | `out-rep` |
|---|---|---|---|---|
| 542–819 | message, 1 | from 642: failure, 1 | message, 1 | from 620: failure, 1 |
| 820–949 | message, 1 | failure until 843, then failFast, 1 | dashed, → 0.25 | dashed, → 0.25 |
| 950–1019 | → 0.25 | failFast, → 0.25 | solid, → 1 | failure, → 1 |
| 1020–1149 | → 1 | failFast, → 1 | dashed, → 0.25 | dashed, → 0.25 |
| 1150–1219 | → 0.25 | failFast, → 0.25 | solid, → 1 | failure, reply from 1188 |
| 1220–1919 | → 1 | reply (failure 1382–1421) | 1 | reply (failure 1360–1399) |

"→ x" is a linear `motion.fade` from the range's first frame.

### 4.6 The window

- **Slots:** five slots left to right. Results fill the first empty slot. When all five are full, a new result **slides** the window: the leftmost square moves 60 units left and fades out over F frames from the arrival, the other four move one slot left over the same frames (linear), and the new square pops in slot 4 at the arrival.
- **Rate:** failures ÷ 5. The bar eases to the new rate over F frames from the arrival.
- **Trips:** the circuit trips only when the rate is **above** the threshold 0.8. 4 of 5 is exactly 0.8 and does not trip, as in L43 ("crosses") and L46 ("exceeds").
- **Not counted:** a `400` never enters the window (§4.2, 1566).

## 5. Reading choices (MOT-1) and out-of-scope outcomes

Approved at gate 0 (2026-11-12, all recommendations):

- the rewind and the numbered takes;
- the breaker dropping in;
- N = 5 and the 80% threshold, the bar and its tick;
- the ghost `60`;
- one test call in HALF_OPEN;
- the lights clearing;
- the `400` dropping off;
- the clock compressed to about 4 s (q69 A);
- the customer message (q70 A).

Made in this design, for G1:

- the clock runs 130 frames (4.3 s; question 4);
- `retry ×3` leaves in take 2 (question 5);
- the window clears on CLOSED (question 6);
- one red light means "slow" in take 2 (question 7);
- the test call starts at the breaker, and the counters leave at the first HALF_OPEN (question 8);
- the word cuts (question 3);
- the dimming of the window (0.3) and the clock (0.6) in HALF_OPEN, as on the sheet.

Out of scope, because the article only implies them: a successful retry in take 1, several test calls, the replicas, the latencies and the HTTP status mapping (`proposal.md`).

## 6. Layout (stage units, 960 × 540; composition = × 2)

### 6.1 Elements

| Element | Piece and parameters | Position |
|---|---|---|
| Checkout window | `browserWindow` | x 24, y 150, w 190, h 160 |
| Checkout label | `diagramBox` pill, fill `color.state.caller`, textSize 30, `["Checkout"]` | x 34, y 126, w 170, h 48 |
| Payment units | `serverStack` units 1, w 190 | x 746; y 150, 200, 250 |
| Payment label | `diagramBox` pill, fill `color.white`, textSize 30, `["Payment"]` | x 761, y 126, w 160, h 48 |
| breaker | `diagramBox` box, fill `color.white`, textSize 30, ``["`circuit-breaker:`", "`execute`"]`` | x 320, y 196, w 320, h 100 |
| state pill | `diagramBox` pill, textSize 36, state fill (§2.9) | centred (480, 196), h 52; w 190 (`CLOSED`, `OPEN`), 240 (`HALF_OPEN`) |
| `retry ×3` | `diagramBox` pill, fill `color.white`, textSize 30 | centred (119, 310), w 160, h 48 |
| take badge | `countBadge` textSize 36 | cx 912, cy 52 |
| rewind mark | `uiIcon` `reset`, size 48 | x 836, y 28 |
| clock ring | `Countdown` size 56 | centre (330, 70) |
| clock label | `edgeLabel` textSize 30, anchor start, ``["`resetTimeout 10s`"]`` | x 372, y 80 |
| tags | `edgeLabel` backdrop, textSize 30, anchor middle, code in backticks | y 362; x 480 (`direct`), 267 (`left`), 693 (`right`) |
| customer message | `edgeLabel` textSize 30, anchor start, `["payment temporarily", "unavailable"]` | x 24, y 420 |
| window squares | `CallSquare` size 50 | slot s at x 335 + 60s, y 390; the dropped square at slot 5 (x 635) |
| bar | `FailureRateBar` w 290, h 16, threshold 0.8 | x 335, y 456 (tick at x 567) |
| `requests` | `countBadge` textSize 36 at (56, 505); `edgeLabel` textSize 30 anchor start | label at x 92, y 515 |
| `backend calls` | `countBadge` textSize 36 at (706, 505); ghost `60` at (646, 505), opacity 0.4; `edgeLabel` textSize 30 anchor end | label at x 936, y 515 |
| arrows | `messageArrow` straight, width 3 | §4.3 |
| tokens | `PositionedToken` r 11 | on their legs |

### 6.2 Layers (SCN-6)

From the bottom:

1. `Rings`
2. `MotionPath`
3. stage SVG 1: arrows, then Checkout, Payment and the breaker box
4. the component box: window squares, bar, `Countdown`
5. the tokens
6. stage SVG 2: the labels, state pill, `retry ×3`, tags, clock label, customer message, counters and badge

Every stage element is wrapped in a group with a `data-element` name, as in #41, so tests find it.

### 6.3 What the layout test proves

The test measures text with harfbuzzjs's shaper on the package's `fonts/` faces. harfbuzzjs is already the package's dependency; this is test-only use.

1. **Minimum size.** Every drawn string has an effective size of at least 30 (36 for the state pill, badge and counter numbers).
2. **Text boxes.** A string's box is its advance width × its effective size, by its anchor, and from 0.8 × size above the baseline to 0.25 × size below it.
3. **Inside the frame.** Every text box lies inside x 12–948 and y 12–528.
4. **No overlaps.** No two drawn text boxes intersect. No text box intersects a block it does not label (Checkout, Payment, breaker, window, bar, clock ring), and none intersects a token on its leg.
5. **When it runs.** At every frame of the composition, once each element has settled.

If a value of §6.1 fails 1–4, the implementer changes the value here and in the spec in the same commit (BUILD), and lists it for the owner.

## 7. Stills plan (MOT-5)

`npm run stills -- circuit-breaker-topology` renders the phase ends and the last frame: **59, 389, 449, 509, 569, 819, 949, 1019, 1149, 1219, 1489, 1599, 1799, 1919** (14 PNGs). The implementer also renders these boundary frames with `npx remotion still`:

| Frame | What it checks |
|---|---|
| 177 | first red light |
| 768 | 4 of 5 ✕ at the tick, still CLOSED |
| 870 | the fail-fast stream, `CIRCUIT-BREAKER:OPEN`, customer message, clock half |
| 930 | `20`, `5` and the ghost `60` |
| 1000 | the HALF_OPEN test timing out |
| 1200 | `200`, white lights |
| 1390 | the noise ✕ under the tick |
| 1580 | the dropped `400` square |
| 1830 | inside the final hold |

Every PNG is opened and checked for overlaps, clipping and contrast. Two contact sheets go into `docs/spikes/2026-11-12-circuit-breaker-topology/`:

- **the stills sheet** at frame width 640;
- **a phone sheet:** the 14 stills scaled to **360 px wide**, checked by eye so every word is readable (the owner's correction).

After the render, a third sheet is taken from `out/web/circuit-breaker-topology-16x9.mp4` at the same 14 frames. The owner's ok on the stills comes before the render, as #41 requires for its scene.

## 8. Article lines (English, `728d6f4`)

| Line | What it supports |
|---|---|
| L23 | peak day; checkout calls the payment service; slower; retry; three attempts; it stops responding |
| L25 | retry becomes the final push; the breaker stops hammering, fails immediately, tests recovery on its own |
| L27 | `RetryVsCircuitBreakerDemoTest`: 20 requests, backend returns `HTTP:TIMEOUT` on every call, run both ways |
| L29 | retry only: up to 3 times, 60 backend calls, zero successes |
| L30 | each call goes through `circuit-breaker:execute`; the first 5 feed the sliding window and trip the circuit; the remaining 15 get `CIRCUIT-BREAKER:OPEN`; 5 backend calls |
| L42–L44 | CLOSED watches outcomes; OPEN blocks immediately once the failure rate crosses the threshold; HALF_OPEN after a wait period, test calls decide |
| L46 | (diagram alt text) the rate exceeds the threshold; `resetTimeout` elapses; any failure during the test reopens |
| L52, L59–L61 | the plugin wraps one processor, the call to the payment service; `<circuit-breaker:execute …>` around `<http:request …>` |
| L66 | sliding window of the last N; one slow call is noise |
| L68 | a declined card is a business error and does not count |
| L71 | `CIRCUIT-BREAKER:OPEN`; "payment temporarily unavailable" to the customer |
| L73 | the next requests fail immediately; the payment service stops receiving traffic |
| L75 | (diagram alt text) `200 OK` |
| L77 | tests recovery every `resetTimeout` |
| L81 | the backend recovers on the next call |
| L92 | a business error, always 400, never opens the circuit |
| L95 | the default 10-second `resetTimeout`; back to `CLOSED` once a test call succeeds |
| L150, L153 | a sliding window handles spikes; business errors are told apart from infrastructure failures |

### 8.1 Words on screen

All in `text.en` except the counter digits, which are computed, and the square glyphs, which `CallSquare` draws.

| Words | Lines |
|---|---|
| `Checkout`, `Payment` | L23 |
| `retry ×3` | L23, L29 |
| `circuit-breaker:`, `execute` | L30, L59 |
| `CLOSED`, `OPEN`, `HALF_OPEN` | L42–L44 |
| `HTTP:TIMEOUT` | L27 |
| `CIRCUIT-BREAKER:OPEN` | L30, L71 |
| `payment temporarily`, `unavailable` | L71 |
| `200` | L75 |
| `400` | L92 |
| `resetTimeout 10s` | L77, L95 |
| `requests` | L27 |
| `backend calls` | L29 |
| `1`, `2` | device |
| digits `0`–`60` | L27, L29, L30 |
| ✓, ✕ | the window's results |

## Risks / trade-offs

- **#41 may change at its G3.** The rebase takes the change, and anything that breaks an interface named in §2.1 goes to this pull request's Questions.
- **Text at 30 units makes the stage dense.** §6.3 proves no overlap at every frame, and the phone sheet is the owner's check.
- **`CallSquare`'s spring is not clamped.** It is still above 1 by about 8e-7 at +44 frames. The last square pops at 1756, 74 frames before the SCN-4 frames 1830–1919, where it is below 1e-9: pixel-identical. The scene state is deep-equal from 1800.
- **156 trips in one timeline.** They are generated by the formulas of §4.2 in `timeline.ts`. The test compares them with an independent transcription of the same formulas and spot-checks frames.
- **A merge conflict with AB#337** (supporting characters, in parallel): only in `README.md` and `docs/roadmap.md`, in different sections; this scene uses no cast piece.

## Migration

None for consumers: scenes and `src/brand/` are not in the package. Merge order: #41, then this change (rebased); AB#337 in either order.

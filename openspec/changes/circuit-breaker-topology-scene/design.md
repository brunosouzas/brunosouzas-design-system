# Design: circuit-breaker-topology-scene

See `proposal.md` for the why. This file holds:

- §1 the story;
- §2 the decisions;
- §3 the pieces;
- §4 the beat table, frame by frame;
- §5 the reading choices;
- §6 the layout and the text sizes;
- §7 the stills plan;
- §8 the article lines;
- §9 the open questions for G1.

What was observed is marked with its file; what is assumed is marked "assumed".

Observed sources:

- **The gate-0 sheet** `concept-A-two-takes.png` (brain vault, `evidence/2026-11-12-circuit-breaker-gate-0/`) and its prototype `~/.hermes/cache/scratch/ab334-cb-scene/` (`lib.ts`, `concept-a.ts`). They are drawn on a 960 × 540 frame with the 0.12.0 pieces.
- **The English article** `brunosouzas-content/writing/circuit-breaker-in-mulesoft/circuit-breaker-in-mulesoft.en.md` at commit `728d6f4` (2026-11-05). Line numbers `Lnn` below are that file's.
- **The code** at `655525d` (0.12.0).
- **PR #41's branch** `feature/ab144-sdd-without-with-spec-scene` at `852bcd0`: `src/scenes/takes-kind.ts`, its archived change `2026-11-12-sdd-without-with-spec-scene`, `MotionPath` and `motionPathAt`, and `test/scripts/cli.test.ts`.
- **The site's article column:** measured in a browser on the live article page (`https://brunosouzas.com/blog/circuit-breaker-in-mulesoft`, 360 × 740 viewport, 2026-11-12). `.content` and every body image are **340.8 px** wide at x 9.6. A video embedded like the body images is therefore about **341 px** wide on a 360 px phone. The `.container` rule (`brunosouzas.com/src/styles/components.css:11`, `px-4`) is one of the gutters.
- **Text widths:** measured with harfbuzzjs 1.6.4 on `fonts/SourceSans3-Bold.ttf` and `fonts/SourceCodePro-Bold.ttf`, the faces `diagramBox`, `edgeLabel` and `countBadge` draw (§6.1).

## 1. The story: what the viewer must understand

One checkout and one payment service, played twice. **Take 1:** checkout retries every failed call three times, so the slow service gets three times the load and goes down: 20 requests, 60 backend calls. **Take 2,** after a rewind: the breaker wraps the call. It watches the failures in a window, opens when the failure rate passes the threshold, and fails the next calls at once with a clear message, so the service is left alone (5 calls, not 60). It tests recovery on its own after `resetTimeout`, closes again, ignores one unlucky timeout and a business error, and ends healthy. The viewer should leave with L25: retry "becomes the final push", and a circuit breaker "stops hammering the service that's already struggling, fails the next requests immediately with a clear error, and tests recovery on its own".

| State | What is on stage | Changes into the next state when |
|---|---|---|
| S0 set-up | rings, Checkout with `retry ×3`, Payment (three white lights), one direct arrow, take badge `1`, counters `0` `requests` and `0` `backend calls` | the first request leaves |
| S1 retry storm | tokens in threes along the direct line; the counters climb to 20 and 60; a red `HTTP:TIMEOUT` reply line; Payment's units fail (red) at calls 20, 40 and 60 | the 60th call arrives |
| S2 down | everything still: 20, 60, three red units | the rewind mark appears |
| S3 rewind | take 1 plays backwards to S0; then badge `2` | the breaker drops onto the line |
| S4 wrapped | `circuit-breaker:execute` between them, pill `CLOSED`, empty window of 5 and its bar with the 80% tick, one failing (red) unit (the service is slow) | the first request leaves |
| S5 CLOSED, failing | five calls reach Payment and come back `HTTP:TIMEOUT`; each adds a red square, the bar grows 20% at a time | the fifth square takes the bar past the tick |
| S6 OPEN | pill `OPEN`; the line to Payment dimmed and dashed; the clock `resetTimeout 10s` runs; 15 requests bounce back at once with `CIRCUIT-BREAKER:OPEN` and `payment temporarily unavailable`; `20` requests, `5` backend calls beside a ghost `60` | the clock runs out |
| S7 HALF_OPEN, fails | pill `HALF_OPEN`; the counters leave; one test call times out | the reply reaches the breaker |
| S8 OPEN again | pill `OPEN`; the clock runs again; three requests fail fast | the clock runs out |
| S9 HALF_OPEN, recovers | one test call; Payment's failing unit recovers; `200` comes back | the reply reaches the breaker |
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
| **C. Depend on #41; spec deltas ADD requirements under names #41 does not use and modify only the one requirement a fourth scene makes false; implement after #41 merges, rebased onto that `main` (chosen)** | the spec branch touches only `openspec/changes/circuit-breaker-topology-scene/`, so it conflicts with nothing; at implementation the scene is one more `takes` scene and the shared code is #41's |

How C avoids conflicts:

- **New requirement names** all start with "Topology", "Failure-rate bar" or "Token radius". #41 adds "Neutral scenes", "Two-take …", "SDD …" and "Dashed motion path".
- **One requirement modified: "State-machine and flow catalogue compatibility".** As #41 leaves it, its assertions that list every registered scene "SHALL list the three scenes in registration order", and its scenario "Three kinds in the catalogue" expects nine compositions. A fourth scene makes both false.
  - This change's MODIFIED block is #41's text, generalised to "every registered scene in registration order", with a fourth-scene scenario added. It is written against #41's version, so it applies only after #41 is archived on `main`, which task 0.1 requires.
  - At the rebase, task 0.2 compares it with the merged text, so a late #41 edit is not overwritten.
- **Assertions that list every scene,** the allowed edits (scene-workflow: "the one allowed edit is an assertion that lists every registered scene"):
  - `test/scenes/catalogue-flow.test.ts`: "Three kinds in the catalogue" keeps checking the first three scenes and their nine compositions (its assertion on exactly three ids becomes "the first three"), and a new test, "Four scenes in the catalogue", checks the full list of four scenes and ten compositions;
  - `test/scripts/cli.test.ts`, whose two `available scenes:` lines on #41's branch (lines 140 and 150) gain `circuit-breaker-topology`.
- **No edit to #41's files** `takes-kind.ts`, `components.tsx` (`MotionPath`) or `motion.ts`. The failure-rate bar lives in new files (§2.4).
- **Edits to shared files are one line each,** after the rebase: `src/scenes/index.ts`, `src/Root.tsx`, the README scene table, the roadmap row and the ADR 0004 amendment.

If #41 changes before it merges (its G3 may ask for changes), the rebase picks them up; this change uses only the interfaces named above.

### 2.2 The text-size rule (owner's correction at gate 0; G1 question 10)

On the sheet, labels were 15 stage units (30 px in the composition). The site's article column shows the video about **341 px** wide on a 360 px phone (measured above), that is 341 / 1920 = 0.178 of the composition, or **0.355 px per stage unit**. Those labels read at 5.3 px. The rule:

| What | Minimum (stage units) | Composition | At 341 px | At 360 px |
|---|---|---|---|---|
| every word, code and caption | **33** | 66 px | **11.7 px** | 12.4 px |
| state names, the take number, the counter numbers | **36** | 72 px | **12.8 px** | 13.5 px |
| the ✓ and ✕ glyphs in the window (symbols, not words) | **30** (squares of 50: 0.62 × 50 = 31) | 62 px | 11.0 px | 11.6 px |

- **"Effective" size** is the piece's `font-size` times every scale applied to it once its pop-in has settled. Opacity does not count: dimmed text (the clock at 0.6) is checked on the phone sheet (§7).
- **Words were cut where the frame cannot hold them** at that size (widths measured, §6.1):
  - `Payment` instead of `Payment service`: 130 against 251, and the pill would pass the frame's right edge;
  - `circuit-breaker:` / `execute` on two lines: one line is 455 units, which would leave 46 units of arrow on each side;
  - the customer message on two lines, `payment temporarily` / `unavailable`: 310 and 170;
  - no `400` inside the dropped square, which would be 31 units on a 50-unit square.

| Option | Why not, or why |
|---|---|
| Keep the sheet's sizes and rely on the article text | the owner rejected it at gate 0 |
| Scale the whole stage up and crop | the topology no longer fits; the comparison needs both ends on screen |
| 30 for words (11.25 px only at a full 360 px width; 10.7 px in the real column) | below 11 px where readers actually see it |
| **33 for words, 36 for states, take and counters, measured, with words cut to fit (chosen)** | at least 11.7 px in the real column; a test proves it (§6.3) |

Rejected minimum: 36 for every word. `CIRCUIT-BREAKER:OPEN` would be 432 units wide and the customer message 338, which do not fit beside the window.

If the site's video embed (AB#142) ends up narrower than 341 px, these sizes read smaller in proportion. The phone sheet is viewed at 341 CSS px so the owner judges what readers will see (§7).

### 2.3 Stage units

As in #41 §2.3, the pieces are laid out in **960 × 540 stage units**, in SVG with `viewBox="0 0 960 540"`, filling the 1920 × 1080 composition. The gate-0 outline weights and proportions hold.

- **The React components** (`CallSquare`, `Countdown`, `PositionedToken` and the new `FailureRateBar`) are drawn inside a 960 × 540 box scaled × 2. Their sizes and outlines are therefore in stage units, like the pieces.
- **`CallSquare` in `empty` kind** ignores `appearAt` and has a fixed opacity of 0.35. The empty window and the dropped square pop through a wrapping group with `blockPopIn` on its opacity and scale, about the group's centre.
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
- **Fill:** from the left, `min(width, max(height, rate × width))` wide when `rate > 0`, ends rounded to `height / 2` like the track. Its colour is `color.state.failure` with the same outline. Nothing is drawn at `rate = 0`.
- **Tick:** an ink line at `threshold × width`, from `0.5 × height` above the track to `0.5 × height` below it, stroke `outline.small + 0.5`, round caps. The tick sits above the fill.

**Invalid input:** a `rate` outside [0, 1] or not finite, a `threshold` outside (0, 1) or not finite, or a `width` or `height` that is not finite or not above 0 throws a `RangeError` naming the prop.

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

Each request or reply is one `PositionedToken`: white fill, ink outline, radius **10** stage units.

- **`PositionedToken` gains an optional `radius`.** Today its radius is fixed at 17 (`src/brand/flow-shapes.ts`, `positionedTokenStyle`); in the × 2 component box that would be 17 stage units. Tokens 34 wide leaving 6 frames (26.7 units) apart on a 98-unit leg would overlap.
  - The change is an optional prop on `positionedTokenStyle` and `PositionedToken`, defaulting to 17, so `publish-subscribe` is unchanged ("Token radius").
  - Neither #41 nor AB#337 edits `flow-shapes.ts` or `flow-components.tsx` (checked on #41's file list).
  - Rejected: drawing tokens in composition pixels at 17 px. That is 8.5 stage units, 3.0 px of radius on a phone.
- **Spacing:** two tokens on one route keep their centres at least 2 × 10 + `outline.small + 1` = 24 units apart. The closest pair is the fail-fast stream, at 26.7.

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
| `color.state.failure` (red) | Payment's failing units (body and light), the ✕ squares, the bar's fill, and arrows of kind `failure` |
| `color.state.failFast` | arrows of kind `failFast` |
| `color.state.blocked` (orange) | the `OPEN` pill |
| `color.state.healthy` | the `CLOSED` pill |
| `color.state.transitional` | the `HALF_OPEN` pill |
| `color.state.caller` | the `Checkout` label |
| `color.state.backend` | nowhere; the `Payment` label is white (the owner's correction) |

Everything else is white, ink or a neutral the pieces draw (`color.panel`, `illustration.textBar`, the backdrop).

### 2.10 The timeline's data shape

#41's `TakesTimeline` keeps one frame per key in `pops` and `leaves`, fades only in (to 1) and out (to 0), and has no dims, arrow kinds, counters, lights, tags or window. This scene pops and leaves some elements several times (the `left` tag, the customer message, the clock), dims to 0.25, 0.3 and 0.6, and changes kinds and contents.

The scene's timeline type is `TopologyTimeline = TakesTimeline & { … }`, in the scene's `timeline.ts`; `takes-kind.ts` does not change. Its fields:

| Field | What it holds |
|---|---|
| `pops`, `leaves` (TakesTimeline) | one key per occurrence, `<element>@<frame>`, for example `tag-left@844`, `message@1062`, `clock@820` |
| `fades` (TakesTimeline) | only 0→1 and →0 fades (the arrows' first fade-in, the drop path), keyed the same way |
| `ramps` | opacity ramps between any two values: `{ element, from, to, values: [a, b] }`, linear over `motion.fade` (the dims to 0.25, 0.3, 0.6 and back) |
| `arrows` | per route, a list of `{ at, kind, dashed }` changes (§4.5) |
| `calls` | one entry per request or test call: `{ id, legs: { route, from }[], result }`, with `result` one of `timeout`, `ok`, `business`, `failFast`; the trips are derived from it |
| `lights` | `{ unit, at, failing }` changes |
| `tags` | per place, `{ at, text }` swaps and `{ at, leave: true }` leaves |
| `window` | `{ at, result }` arrivals (with `ok`, `fail`, `drop`), plus `{ at, clear: true }` |
| `clock` | `{ at, full: true, emptyAt }` runs |

**Every movement end is also a `cues` entry,** so #41's `checkHold` sees it: every ramp end, arrow change, light change, tag swap or leave, window arrival plus `motion.fade` (slides and bar eases), and every clock run's end. The trips are listed in `trips`.

## 3. Pieces and components (MOT-6, CAST-1)

There is no character, no emote and no caption.

| On stage | Drawn with |
|---|---|
| Checkout | `browserWindow` and a `diagramBox` (`shape: "pill"`) label |
| Payment | three `serverStack` (`units: 1`; a failing unit has `fill: "color.state.failure"` and `failing: 0`) and a `diagramBox` pill label |
| breaker | `diagramBox` (box) with two code lines |
| state pill, `retry ×3` | `diagramBox` (`shape: "pill"`) |
| arrows | `messageArrow` (`curve: "straight"`, `width` `outline.arrow` (4); kinds `message`, `reply`, `failure`, `failFast`; `dashed` explicit, true only when cut) |
| tags, clock label, captions, customer message | `edgeLabel` |
| take badge, counters | `countBadge` |
| rewind mark | `uiIcon` `reset` |
| window squares | `CallSquare` |
| clock | `Countdown` |
| bar | `FailureRateBar` (new, §2.4) |
| tokens | `PositionedToken` with the new optional `radius` 10 |
| drop-in path | `MotionPath` (#41) |
| stage rings | `Rings` |

`pill` is not used: it has no `textSize`, and its height (`cover.pillHeight` 36) is fixed. The scene's files contain no colour literal and create no SVG shape of their own.

## 4. Beat table

Constants: `motion.fps` 30, `motion.travel` (T) 22, `motion.fade` (F) 10, `motion.readingHold` 90. Duration **1920** frames (64 s), outro **1800**, final hold 1800–1919 (120 frames).

### 4.1 Phases

Takes follow #41's `takes` kind.

| # | Phase id | Take | Frames | Cites (English lines) | Devices |
|---|---|---|---|---|---|
| 1 | `setup` | 1 | 0–59 | 23, 27, 29 | takeNumbers |
| 2 | `retry` | 1 | 60–389 | 23, 25, 27, 29 | — |
| 3 | `down` | 1 | 390–449 | 23, 29 | — |
| 4 | `rewind` | rewind | 450–509 | 27 | rewind, takeNumbers |
| 5 | `wrap` | 2 | 510–569 | 30, 52, 59, 60, 61 | — |
| 6 | `closed` | 2 | 570–819 | 30, 42, 43, 46, 66, 150 | — |
| 7 | `open` | 2 | 820–949 | 30, 43, 71, 73, 77 | — |
| 8 | `half-open-fail` | 2 | 950–1019 | 44, 46, 77, 95 | — |
| 9 | `open-again` | 2 | 1020–1149 | 43, 46, 71, 77 | — |
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
| 60 + 15(k − 1) + 2j, k = 1…20, j = 0…2 | attempt j of request k (call n = 3(k − 1) + j + 1) | departs on `direct-req`; a request's three attempts travel as a group of three, about 49 units apart, with 11 frames between groups (the sheet's ○○○) | L23, L29 |
| 82 + 15(k − 1) + 2j | call n | arrives; `backend calls` reads n | L29 |
| 82–92 | arrow `direct-rep` (failure) | fades in | L27 |
| 82 | tag `direct` `HTTP:TIMEOUT` | pops | L27 |
| 174 / 277 / 371 | Payment unit 0 / 1 / 2 | fails (calls 20, 40, 60): body and light `color.state.failure` | L23 |
| 390–449 | everything | still: `20`, `60`, three failing units | L23, L29 |
| 450 | rewind mark | pops (pill) beside the badge | device |
| 450–499 | object layer | plays from object frame 449 back to 59 (§2.5) | device |
| 500 | badge | swap `1` → `2` | device |
| 510 | `retry ×3` | leaves (gone 520) | choice, §5 |
| 510–520 | arrow `direct-req` | fades out | L52 |
| 510–520, 542–552 | drop path (`MotionPath`, (480, −60) → (480, 251)) | fades in, fades out | device |
| 520 | rewind mark | leaves (gone 530) | device |
| 520–542 | breaker box | travels down the drop path, linear by length (its centre on the path) | L52, L59–61 |
| 542–552 | arrows `in-req`, `out-req` (message) | fade in | L30 |
| 548 | pill `CLOSED` | pops | L42 |
| 554 | window (five empty slots) and bar (rate 0, tick 0.8) | pop (block) | L66, L150 |
| 560 | Payment unit 0 | fails (slow, not down) | L23, choice |
| d = 576 + 42i, i = 0…4 | call i | departs `in-req`; `requests` reads i + 1 | L30 |
| d + 22 | call i | `out-req` | L30 |
| d + 44 | call i | arrives; `backend calls` reads i + 1; `out-rep` (failure) departs | L30, L27 |
| d + 66 | call i | square i (✕) pops; bar moves linearly to (i + 1)/5 over F; `in-rep` (failure) departs | L66 |
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
| 1150 | tag `left`, customer message | leave (gone 1160) | choice |
| 1150–1160 | same dimming as 950–960 | | L44 |
| 1166–1188 | test call 2 | `out-req` | L44, L95 |
| 1188 | Payment unit 0 | recovers (white body, white light) | L81; choice |
| 1188 | arrow `out-rep` | kind → reply; tag `right` `200` pops | L75 |
| 1188–1210 | test call 2 | `out-rep` (reply) | L75 |
| 1220 | pill | swap `HALF_OPEN` → `CLOSED` | L95 |
| 1220 | the five ✕ squares; clock | leave (gone 1230); slots empty | L95; choice |
| 1220–1230 | bar rate 1 → 0; window, bar, `in-req`, `in-rep` → opacity 1; `in-rep` kind → reply | | L42 |
| g = 1236 + 40i, i = 0…4 | call c*i* | `in-req` g, `out-req` g + 22, `out-rep` g + 44, square at g + 66, `in-rep` g + 66 | L42, L75 |
| 1316 (c2) | call c2 | times out: `out-rep` and `in-rep` kind failure, tags `HTTP:TIMEOUT` (1360 right, 1382 left), square ✕ at 1382, bar moves to 0.2 | L66, L150 |
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

| Route | From | To | Length |
|---|---|---|---|
| `direct-req` | (208, 228) | (752, 228) | 544 |
| `direct-rep` (arrow only) | (752, 266) | (208, 266) | 544 |
| `in-req` | (208, 228) | (306, 228) | 98 |
| `out-req` | (654, 228) | (752, 228) | 98 |
| `out-rep` | (752, 266) | (654, 266) | 98 |
| `in-rep` | (306, 266) | (208, 266) | 98 |
| drop path (breaker centre) | (480, −60) | (480, 251) | 311 |

Each arrow is drawn on its route with a head at the end. A leg's `trips` entry in the timeline has `route`, `from` and `to = from + motion.travel`.

### 4.4 Counters

| Frames | `requests` | `backend calls` |
|---|---|---|
| 24–59 and take 1 by object frame | requests departed (0–20) | attempts arrived (0–60) |
| 510–819 | calls departed in take 2 (0–5), then 6–20 at the fail-fast departures | calls arrived at Payment (0–5) |
| 820–949 | up to 20 at 906 | 5; ghost `60` from 912 |
| from 950 | leaving, gone 960, then not drawn | the same |

### 4.5 Arrows per frame range

Every arrow passes `dashed` explicitly. `messageArrow` dashes every kind except `message` by default (`dashed ?? kind !== "message"`, `src/pieces/metro.ts`). Here **dashed means only "cut"**, and reply arrows are solid while their line is open.

| Frames | `in-req` | `in-rep` | `out-req` | `out-rep` |
|---|---|---|---|---|
| 542–819 | message, solid, 1 | from 642: failure, solid, 1 | message, solid, 1 | from 620: failure, solid, 1 |
| 820–949 | message, solid, 1 | failure until 843, then failFast; solid, 1 | message, **dashed**, → 0.25 | failure, **dashed**, → 0.25 |
| 950–1019 | message, solid, → 0.25 | failFast, solid, → 0.25 | message, solid, → 1 | failure, solid, → 1 |
| 1020–1149 | message, solid, → 1 | failFast, solid, → 1 | message, **dashed**, → 0.25 | failure, **dashed**, → 0.25 |
| 1150–1219 | message, solid, → 0.25 | failFast, solid, → 0.25 | message, solid, → 1 | failure, then reply from 1188; solid, → 1 |
| 1220–1919 | message, solid, → 1 | reply (failure 1382–1421, back to reply at 1422), solid | message, solid, 1 | reply (failure 1360–1399, back to reply at 1400), solid |

"→ x" is a linear `motion.fade` ramp from the range's first frame. Take 1's `direct-req` is message, solid; `direct-rep` is failure, solid.

### 4.6 The window

- **Slots:** five slots left to right. Results fill the first empty slot. When all five are full, a new result **slides** the window over F frames from the arrival, all of it linear:
  - the leftmost square moves 60 units left and its opacity goes linearly from 1 to 0 (not `leave`'s ease);
  - the other four move one slot left;
  - the new square pops in slot 4 at the arrival.
- **Rate:** failures ÷ 5, also before the window is full (a reading choice: the bar shows the share of the window, as on the sheet). The bar moves linearly to the new rate over F frames from the arrival.
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
- one failing unit means "slow" in take 2 (question 7);
- the test call starts at the breaker, and the counters leave at the first HALF_OPEN (question 8);
- the word cuts (question 3);
- the dimming of the window (0.3) and the clock (0.6) in HALF_OPEN, as on the sheet;
- the lights turning red at calls 20, 40 and 60 (the article says only that the service "stops responding altogether", L23);
- a request's three attempts travelling as a group, 2 frames apart (the article's retries are sequential; the scene compresses them and keeps the sheet's groups of three);
- reply arrows solid while their line is open, dashed only when cut (on the sheet every reply arrow is dashed; question 14);
- a failing Payment unit drawn red as a whole, not only its light (question 13);
- the rate counted over the window's five slots before it is full (§4.6);
- the tag and customer message leaving at each HALF_OPEN.

Out of scope, because the article only implies them: a successful retry in take 1, several test calls, the replicas, the latencies and the HTTP status mapping (`proposal.md`).

## 6. Layout (stage units, 960 × 540; composition = × 2)

### 6.1 Elements

Text widths are measured (harfbuzzjs, Bold faces): `Checkout` 137.4, `Payment` 130.0, `retry ×3` 114.2, `requests` 125.5, `backend calls` 196.0, `payment temporarily` 309.7 and `unavailable` 170.4 at 33; `CLOSED` 132.5, `OPEN` 94.7 and `HALF_OPEN` 200.7 at 36; mono at 33 is 19.8 per character (`circuit-breaker:` 316.8, `resetTimeout 10s` 316.8, `HTTP:TIMEOUT` 237.6, `CIRCUIT-BREAKER:OPEN` 396.0).

| Element | Piece and parameters | Position |
|---|---|---|
| Checkout window | `browserWindow` | x 24, y 164, w 180, h 150 |
| Checkout label | `diagramBox` pill, fill `color.state.caller`, textSize 33, `["Checkout"]` | centred (114, 146), w 170, h 50 |
| Payment units | `serverStack` units 1, w 180 | x 756; y 164, 214, 264 (lights at (912, 184), (912, 234), (912, 284), r 6) |
| Payment label | `diagramBox` pill, fill `color.white`, textSize 33, `["Payment"]` | centred (846, 146), w 160, h 50 |
| breaker | `diagramBox` box, fill `color.white`, textSize 33, ``["`circuit-breaker:`", "`execute`"]`` | x 310, y 196, w 340, h 110 (centre (480, 251)) |
| state pill | `diagramBox` pill, textSize 36, state fill (§2.9) | centred (480, 184), h 54; w 180 (`CLOSED`, `OPEN`), 240 (`HALF_OPEN`) |
| `retry ×3` | `diagramBox` pill, fill `color.white`, textSize 33 | centred (114, 314), w 150, h 50 |
| take badge | `countBadge` textSize 36 | cx 912, cy 52 |
| rewind mark | `uiIcon` `reset`, size 48 | x 826, y 28 (12 units clear of the badge) |
| clock ring | `Countdown` size 56 | centre (330, 70) |
| clock label | `edgeLabel` textSize 33, anchor start, ``["`resetTimeout 10s`"]`` | x 372, y 82 |
| tags | `edgeLabel` backdrop, textSize 33, anchor middle, code in backticks; backdrop `width` 262 (`HTTP:TIMEOUT`), 420 (`CIRCUIT-BREAKER:OPEN`), 84 (`200`, `400`) | y 362; x 480 (`direct`), 257 (`left`), 703 (`right`) |
| customer message | `edgeLabel` textSize 33, anchor start, `["payment temporarily", "unavailable"]` | x 24, y 412 (second baseline 451) |
| window squares | `CallSquare` size 50 | slot s at x 360 + 60s, y 382; the dropped square at slot 5 (x 660) |
| bar | `FailureRateBar` w 290, h 16, threshold 0.8 | x 360, y 442 (tick at x 592, y 434–466) |
| `requests` | `countBadge` textSize 36 at (60, 500); `edgeLabel` textSize 33, anchor start | label at x 106, y 512 |
| `backend calls` | `countBadge` textSize 36 at (700, 500); ghost `60` at (622, 500), opacity 0.4; `edgeLabel` textSize 33, anchor end | label at x 936, y 512 |
| arrows | `messageArrow` straight, width `outline.arrow` (4), `dashed` explicit (§4.5) | §4.3 |
| tokens | `PositionedToken` radius 10 | on their legs |

The window sits right-aligned under the breaker (x 360–650, against the box's 310–650), so the customer message (x 24–334) clears it by 26 units.

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

The test measures text with harfbuzzjs's shaper on the package's `fonts/` faces. harfbuzzjs is already the package's dependency; this is test-only use. The ✓ and ✕ glyphs are not in Source Sans 3; they are checked for size only, not shaped (see Risks).

1. **Minimum size.** Every drawn string has an effective size of at least 33. The state pill, badge and counter numbers are at least 36, and the square glyphs at least 30.
2. **Boxes.**
   - A string's box is its advance width × its effective size, placed by its anchor, from 0.8 × size above the baseline to 0.25 × size below it.
   - A `countBadge`'s box is its body.
3. **Inside the frame.** Every text box and badge lies inside x 12–948 and y 12–528.
4. **No text overlaps.** No two text boxes intersect, and no text box intersects a token.
5. **No text over a block it does not label.** The blocks are Checkout's window, Payment's units, the breaker box, every pill body, the window squares, the bar with its tick, the clock ring, the badges and the rewind mark; the rewind mark and the take badge also must not touch each other. What labels what:

   | Text | Labels |
   |---|---|
   | `Checkout`, `retry ×3` | the Checkout window |
   | `Payment` | Payment's units |
   | the state pill's text, `circuit-breaker:`, `execute` | the breaker box (and its own pill) |
   | each pill's text | its pill |
   | the clock label | nothing |
   | `requests`, `backend calls` | nothing (their badges sit beside them) |
   | tags, customer message | nothing |
6. **Payment's lights are clear.** No pill body or text box intersects a light of Payment's units (with their outlines).
7. **When it runs.** At every frame from 0 to 1919, except these moving or settling frames:
   - an element before *a* + `motion.fps` from its pop-in at *a*;
   - an element during its 10-frame leave;
   - the breaker box and its text during the drop-in, 520–541;
   - the window during its slides, 1676–1685, 1716–1725 and 1756–1765;
   - the dropped square, 1566–1585.

   Checking these frames would test the motion, not the layout. Tokens are never exempt.

If a value of §6.1 fails 1–6, the implementer changes the value here and in the spec in the same commit (BUILD), and lists it for the owner.

## 7. Stills plan (MOT-5)

`npm run stills -- circuit-breaker-topology` renders the phase ends and the last frame: **59, 389, 449, 509, 569, 819, 949, 1019, 1149, 1219, 1489, 1599, 1799, 1919** (14 PNGs). The implementer also renders these boundary frames with `npx remotion still`:

| Frame | What it checks |
|---|---|
| 174 | first failing unit |
| 768 | 4 of 5 ✕ at the tick, still CLOSED |
| 870 | the fail-fast stream, `CIRCUIT-BREAKER:OPEN`, customer message, clock half |
| 930 | `20`, `5` and the ghost `60` |
| 1000 | the HALF_OPEN test timing out |
| 1200 | `200`, Payment recovered |
| 1390 | the noise ✕ under the tick |
| 1580 | the dropped `400` square |
| 1830 | inside the final hold |

Every PNG is opened and checked for overlaps, clipping and contrast. Two contact sheets go into `docs/spikes/2026-11-12-circuit-breaker-topology/`:

- **the stills sheet** at frame width 640;
- **a phone sheet:** the 14 stills plus frames 174, 870 and 1000 (HALF_OPEN, dimmed clock and window), at **341 CSS px wide**, the video's width in the site's column on a 360 px phone. Each frame is exported at 341 × 3 = 1023 px wide (device pixel ratio 3) and viewed either on a real 360 px phone or in a browser page that shows it at 341 CSS px. The method used is recorded. Every word must be readable, and the failing Payment units, the red against ink arrows and the dashed cut lines must be told apart (the owner's correction).

After the render, a third sheet is taken from `out/web/circuit-breaker-topology-16x9.mp4` at the same 14 frames, and a fourth is the same frames from the web MP4 at 341 CSS px, because compressed thin text is what readers see. The owner's ok on the stills comes before the render, as #41 requires for its scene.

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
- **Text at 33 and 36 units makes the stage dense.** §6.3 proves no overlap at every frame, and the phone sheet is the owner's check.
- **`CallSquare`'s spring is not clamped.** It is still above 1 by about 8e-7 at +44 frames. The last square pops at 1756, 74 frames before the SCN-4 frames 1830–1919, where it is below 1e-9: pixel-identical. The scene state is deep-equal from 1800.
- **156 trips in one timeline.** They are generated by the formulas of §4.2 in `timeline.ts`. The test compares them with an independent transcription of the same formulas and spot-checks frames.
- **A merge conflict with AB#337** (supporting characters, in parallel): in `README.md`, `docs/roadmap.md` and `docs/adr/README.md` (if AB#337 amends ADR 0007 and this change amends ADR 0004, both add an index row). These are small text conflicts, resolved at whichever rebase comes second. This scene uses no cast piece.
- **✕ and ✓ are not in the Source faces.** `CallSquare` draws them in the composition's sans family. Source Sans 3 lacks them (harfbuzz returns `.notdef`), so the browser falls back to a system font. This is the existing `circuit-breaker-states` behaviour, and the render is reproducible on the same machine. A glyph piece is out of scope; the stills show the result.
- **The video's width on the page** was measured on the live page as the body images' width (340.8 px at a 360 px viewport). AB#142 may embed the video differently; the phone sheet then follows the real width.

## Migration

None for consumers: scenes and `src/brand/` are not in the package. Merge order: #41, then this change (rebased); AB#337 in either order.

## 9. Open questions for G1

Each has a recommended answer. The same list is in the pull request.

1. **Dependency on #41** (§2.1). Recommended: implement only after #41 merges, rebased, with the MODIFIED requirement checked against #41's merged text.
2. **The take numbers `1` and `2`** are device words. #41's ADR 0004 amendment allows them for the SDD scene only. Recommended: amend ADR 0004 so take numbers are allowed in every `takes` scene.
3. **Word cuts** (§2.2). Recommended: accept.
4. **Clock length:** 130 frames (4.3 s) instead of 4 s, so the 15 fail-fast tokens keep 26.7 units between centres. Recommended: accept.
5. **`retry ×3` leaves in take 2,** as on the approved sheet. Recommended: keep.
6. **The window clears on HALF_OPEN → CLOSED.** Otherwise the old five ✕ would make the next timeout trip at once. Recommended: clear.
7. **One failing unit means "slow"** in take 2, and it recovers with the `200`. Recommended: keep.
8. **The test call starts at the breaker,** and the counters leave at the first HALF_OPEN. Recommended: accept.
9. **Length:** 64 s rather than about 70 s. Recommended: accept.
10. **Text sizes** (§2.2): 33 / 36 stage units, at least 11.7 px in the site's 341 px column (measured). Recommended: accept, and judge the 341 px phone sheet at the media gate.
11. **The customer message sits under Checkout,** with the window right-aligned under the breaker. Recommended: accept.
12. **`FailureRateBar` in new `src/brand/` files,** and an optional `radius` on `PositionedToken` (default 17, pub-sub unchanged). Recommended: accept.
13. **A failing Payment unit is red as a whole** (`serverStack` `fill: color.state.failure`), not only its 6-unit light, which is about 2 px of radius on a phone. It is still a state colour on the failing element (ADR 0006). Recommended: accept. The alternative is lights only, checked on the phone sheet.
14. **Reply arrows are solid while their line is open** and dashed only when the breaker cuts it; on the sheet every reply arrow is dashed. Recommended: accept, so dashing means one thing.

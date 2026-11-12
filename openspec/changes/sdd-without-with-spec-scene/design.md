# Design: sdd-without-with-spec-scene

See `proposal.md` for the why. This file holds the story (§1), the decisions (§2), the cast and pieces (§3), the beat table frame by frame (§4), the data and validation (§5), the layout (§6), the stills plan (§7) and the article lines (§8). What was observed is marked with its file; what is assumed is marked "assumed".

Observed sources: the gate-0 sheet `concept-A-one-stage-two-takes.png` and its prototype (`~/.hermes/cache/scratch/ab144-scene1/lib.ts`, `concept-a.ts`, drawn on a 960 × 540 frame with the 0.11.0 pieces); the English article `brunosouzas-content/writing/spec-driven-development-in-practice/spec-driven-development-in-practice.en.md` at commit `728d6f4` (2026-11-05; line numbers below are that file's); the code at `655525d` (0.12.0).

## 1. The story: what the viewer must understand

One request, played twice on the same stage. **Take 1**: the agent answers the request's open questions alone, inside the code; an error comes back to whoever asked. **Take 2**, after a rewind: the agent writes the same questions down in `proposal.md`, the requester answers them and stamps `GO`, and only then does the agent implement. The viewer should leave with the article's line "this changes who decides: the person who approves the spec decides what the system does" (L34).

States and what changes in each (the beat table in §4 gives the frames):

| State | What is on stage | Changes into the next state when |
|---|---|---|
| S0 empty stage | rings, the dark code panel (no lines), Visor idle, take badge `1` | the balloon arrives |
| S1 request | the balloon with six `?` inside | Visor points at the code |
| S2 guessing | the `?` travel one by one into the code; each becomes a line; two more lines | the last line is written |
| S3 error | a red arrow from the code back to the balloon; Visor's fright | the rewind mark appears |
| S4 rewind | everything but Visor plays backwards to S1; Visor resets at once | the badge reads `2` |
| S5 asking | Visor holds `proposal.md`; the `?` travel into it, one row each; Visor waits | the first answer leaves the balloon |
| S6 answered | six answers travel from the balloon, each ticking a row; the `GO` stamp lands | Visor points at the code |
| S7 implemented | a dashed path from the sheet to the code; eight code lines; Visor done | the final still is held |

## 2. Decisions

### 2.1 Neutral registration (G1 question 1)

| Option | Fit | Cost |
|---|---|---|
| A. Keep one composition per language (`-16x9-pt`, `-16x9-en`) rendering the same frames | no catalogue change | two renders and two reviews of the same video; contradicts ADR 0005 as amended and SCN-1 |
| B. One composition, id `<scene>-<format>-en` | no id rule change | the id claims a language; the Portuguese page would embed an "`-en`" file; a second language would look missing |
| C. **A neutral scene: one composition per format, id `<scene>-<format>` (chosen)** | the id says what it is; one render; ADR 0005's consequence ("the first neutral scene changes that rule in its own change") | `compositionsOf`, `checkText` and the scene types learn a `neutral` flag; the localised scenes keep their ids and tests |

A neutral scene sets `neutral: true` and `languages: ["en"]` (its words are English, ADR 0005 amended), has only `text.en`, and keeps both `sources.pt` and `sources.en`, because both pages show the one video. Its `CompositionEntry` has `lang: "en"`; `src/Root.tsx` passes it as today, and the scene ignores it.

### 2.2 The `takes` kind (G1 question 2)

| Option | Why not, or why |
|---|---|
| State machine | the scene has no states with slots and transition fires; forcing them breaks the storyboard reference §2 ("never force a flow into states") |
| Flow | the `?` could be flow copies on routes, but flow ownership has no rewind, no acts, faces or emotes, and its checks (queues, ACK/NACK splits) do not apply; the cast rules would stay unchecked |
| **`takes` (chosen)** | the comparison is the structure: take 1, one rewind, take 2. Its checks are the ones a comparison and the cast need: take order, an article line per phase (MOT-1), one actor at a time (CAST-4), emotes on expression changes and gone before the next action (CAST-3), nothing moving in the reading hold (SCN-4) |

The common rules stay as they are (phases in range and in order, events inside phases, outro at most `duration − motion.readingHold`, phase starts and events before the outro). `checkTimeline` dispatches on `kind` as it already does for `flow`; the state-machine branch is untouched.

### 2.3 Stage units: the gate-0 frame scaled by 2

The pieces have fixed outlines (`outline.block` 4) and only the cast takes a `scale`. The gate-0 sheet drew everything on a 960 × 540 frame; a 1920 × 1080 composition drawn with the same piece parameters would show every outline at half the weight the owner approved, and the balloon, code panel and sheet (no `scale`) at half size.

| Option | Result |
|---|---|
| Lay out in composition pixels and double every size by hand | the outlines still draw at 4 px (half the approved look); every piece without `scale` needs its numbers doubled; drift risk |
| **One stage layer authored in 960 × 540 stage units, drawn in an SVG with `viewBox="0 0 960 540"` filling the 1920 × 1080 composition (chosen)** | the approved proportions and outline weights, with the gate-0 coordinates (§6) |

What is not a piece stays in composition pixels, below or above the stage layer: the `Rings` (the `scene.ring*` tokens are composition pixels; AB#333's G1 question 3 accepted that the rings read twice as dense as on the gate-0 sheet), the dashed paths (`scene.path*`, composition pixels, chosen in AB#333 as the gate-0 look), the failure `Arrow` and the answer tokens (`PositionedToken`). Their coordinates are the stage coordinates × 2.

### 2.4 The dashed motion path (G1 question 3)

AB#333 added the `scene.path*` tokens and left the drawing to the first scene that needs it. Scenes 2 and 3 of AB#144 use the same storyboard notation, so it becomes a shared component, `MotionPath`, in `src/brand/components.tsx`, with its frame logic in a pure helper `motionPathAt(frame, fadeIn, fadeOut?)` in `src/brand/motion.ts`: opacity rises linearly over the `fadeIn` range and falls over the optional `fadeOut` range (each `[from, to]`, the `fadeIn` helper's convention). The scene uses `motion.fade` (10 frames) for every range. The path is drawn whole (no progressive draw): a dashed path cannot use the arrow's dash-offset reveal without fighting its own dash pattern. Rejected: a scene-local drawing (scenes 2 and 3 would copy it).

### 2.5 The rewind (G1 question 9; reading device, q48 A)

The **object layer** (the `?` in the balloon and in flight, the code lines, the take-1 dashed path, the failure arrow) is drawn from an **object frame** `o(f)`: `o(f) = f` before 344; `o(f) = round(339 − (f − 344) × 250 / 33)` from 344 to 377 (so `o(344) = 339`, `o(377) = 89`, take 1 backwards in 34 frames); `o(f) = 89` from 378 to 389. From 390 the object layer is take 2's own. Visor is not in the object layer: it resets at once at 344 (face `idle`, `points: false`, upright), so the rewind never replays the fright or its emote. The take badge and the rewind mark are drawn from the real frame. Rejected: a cut to take 2 with only the rewind mark (reads as a new scene, not "the same request again").

### 2.6 Smaller choices made here (listed for G1)

- **No `facing`** (G1 question 4): Visor faces right in both takes; the held sheet sits on the requester's side, the pointing hand on the code's side.
- **A heading row** (G1 question 5): `holdsSheet` needs at least one row; the sheet appears with one bar row, the article's `## Open Questions` heading (L106), then one `question` row per arriving `?`.
- **Answers as tokens** (G1 question 6): six `PositionedToken`s filled `color.state.caller` (the caller colour on flow elements, ADR 0007's requester row) travel from the balloon; each ticks its row on arrival (the sheet row's `tail: "check"`, the state colour that means done, ADR 0009).
- **Settled pop-ins:** every pop-in (`blockPopIn`, `pillPopIn`, `emotePop`) is drawn exactly settled (opacity 1, scale 1) from `motion.fps` (30) frames after it starts, like pub-sub's `settledPop`; the springs are within 1e-3 of 1 by then (observed: `blockPopIn` 1.00004 and `emotePop` 0.99937 at +30). This makes the two takes' first frames and the final hold exactly comparable.
- **No idle breathing or blinking:** nothing moves that the beat table does not list, so the final still is identical (SCN-4) and CAST-4's "every action parameter as in the frame before" is checked on data alone.
- **The code stays neutral:** code lines are `white` in both takes; colour means state, and the code itself is not the failure (the arrow is).
- **The error is an arrow, not a status:** the failure `Arrow` (`color.state.failure`, the failure path) shows "an error came back"; no code, number or word says which (MOT-1: the article says the team would only find out which when the error came back, L122).

## 3. Cast and pieces (MOT-6, CAST-1, CAST-6)

| Role | Drawn with | Allowed by |
|---|---|---|
| The AI agent | `visor` (x 480, y 440, scale 1.15; `points`, `holdsSheet`, `expression`), posed with `pose` | ADR 0007, row "AI agent → Visor" |
| The requester | `speechBubble` with `fill: "color.state.caller"` (not a character, no face) | ADR 0007, row "Requester/caller: a state colour on message/flow elements" |
| An open question | `questionToken` (scale 1.15, the held sheet's row mark at Visor's scale) | 0.12.0, made for this scene |
| The code | `codePanel` (dark panel, `white` lines) | a generic prop (CAST-2) |
| `proposal.md` | Visor's `holdsSheet` with `label: "proposal.md"` | 0.12.0 |
| An answer | `PositionedToken` filled `color.state.caller` | motion-components "Persistent and routed tokens" |
| Approval | `stamp` with `word: "GO"` (default face `color.state.healthy`, which ADR 0009 keeps as "approved") | q49 B |
| The error coming back | `Arrow` stroked `color.state.failure` | motion-components "Self-drawing arrow"; the failure path colour |
| Take numbers | `countBadge` with `text` `1` / `2` (AB#333: the take numbers stay `countBadge`) | q48 A |
| Rewind mark | `uiIcon` `reset` | q48 A |
| Reactions | `emote` `problem` (a problem appears) and `worked` (it worked) | README emote table |
| Stage, paths | `Rings`, `MotionPath` | `scene.*` tokens |

Mira is out (CAST-6): the scene has no protagonist role the article gives her. No piece is drawn in the scene's own files; the scene only computes parameters, positions and frames.

## 4. Beat table

30 fps, 780 frames (26.0 s), outro at 690, final still 690–779 (90 frames, 3.0 s). `motion.travel` is 22, so every trip arrives 22 frames after it departs. "Article" gives the English line numbers (§8 quotes them); **DEVICE** marks a reading device the text does not state, kept by the owner at gate 0 (q48 A, q49 B).

| # | Phase (take) | Frames | Actor | Action, frame by frame | Article |
|---|---|---|---|---|---|
| 0 | none (intro) | 0–23 | — | rings fade in 0–20; code panel pops at 6 (0 lines); Visor pops at 12 (idle, `points: false`); take badge `1` pops at 18 | badge: DEVICE (take numbers) |
| 1 | `request` (1) | 24–89 | requester | balloon pops at 24; the six `?` pop into its slots at 30, 34, 38, 42, 46, 50 | L20, L22 (the request), L24 (short, reasonable, incomplete; the questions it leaves open); six = L108–L113 |
| 2 | `guess` (1) | 90–239 | Visor | 90: Visor points at the code (act 90–90); dashed path P1 fades in 90–100; `?` *i* (0–5) departs its slot at 112 + 12*i* along route `guess-i`, arrives at 134 + 12*i* (134 … 194) and the code panel gains one line at each arrival (lines 1–6); lines 7 and 8 at 202 and 210; P1 fades out 220–230 | L26 (picks a format, picks an error code, delivers something that works, moves on; the decisions live inside the code); L80 (to choose silently) |
| 3 | `error` (1) | 240–309 | — then Visor | 240: the failure arrow draws from the code to the balloon (`motion.drawArrow` 20; head at 260); 270: Visor's face `failed`, emote `problem` pops beside its head, body squash `squashAfter(f, 270, −0.07)` and tilt −5° | L122 (would only find out which when the first error came back); L26 (nobody approved them); fright: DEVICE |
| — | gap | 310–339 | — | the `problem` emote leaves 320–330 (`leave(f, 320)`) | — |
| 4 | `rewind` (rewind) | 340–377 | — | 340: rewind mark pops beside the badge; 344: Visor resets (act 344–344: face `idle`, `points: false`, tilt 0, squash 1); 344–377: the object layer plays take 1 backwards (§2.5), ending on the state of frame 89 | rewind: DEVICE; the same request again: L22 |
| — | gap | 378–389 | — | 378: badge reads `2` and pops; the rewind mark leaves 378–388 (`leave(f, 378)`) | take numbers: DEVICE |
| 5 | `ask` (2) | 390–489 | Visor | 390: Visor holds the `proposal.md` sheet with its heading row (act 390–476); path P2 (balloon → sheet) fades in 394–404; `?` *i* departs at 404 + 10*i* along `ask-i`, arrives at 426 + 10*i* (426 … 476) and the sheet gains question row *i* + 1 at each arrival; 488: Visor's face `waiting` (no emote) | L72 (list the open question instead of choosing an answer), L82 (if a decision is missing, it stops and asks), L98 (`proposal.md` says … what is still unknown), L103 (listed what the sentence didn't answer), L106–L113, L116 (now written down) |
| 6 | `answer` (2) | 490–589 | requester | answer *i* departs the balloon at 492 + 10*i* along `answer-i`, arrives at 514 + 10*i* (514 … 564) and row *i* + 1 gets its tail check; 576: the `GO` stamp pops onto the sheet | L120 (answered the six questions); L148 (only an explicit decision by the owner releases the implementation); L34; the word `GO`: L124 (the verdict was GO or NO-GO), q49 B |
| 7 | `implement` (2) | 590–689 | Visor | 590: Visor's face `idle` and it points at the code (act 590–590); P2 fades out 590–600 and P3 (sheet → code) fades in 590–600; code lines 1–8 appear at 612 + 6*j* (612 … 654); 660: Visor's face `done`, emote `worked` pops beside its head (it stays) | L32 (the agent implements from it), L152 (implements what the tasks say and nothing more), L34 |
| — | outro | 690–779 | — | nothing moves; every value settled | SCN-4 |

Acts (CAST-4): Visor only, at 90–90, 344–344, 390–476 and 590–590. Expression changes: 270 `failed`, 344 `idle`, 488 `waiting`, 590 `idle`, 660 `done`. Emotes: `problem` at 270 (gone at 330, before the act at 344); `worked` at 660 (no act follows). The requester's beats (balloon, answers, stamp) are objects, not a character, so they do not count as acts.

## 5. Data and validation

React-free data, as pub-sub: `src/scenes/sdd-without-with-spec/scene.ts` (the catalogue entry), `timeline.ts` (the table above as data), `takes.ts` (frame logic: `frameAt(frame)` returns the state of every element; `objectFrame(frame)`), `layout.ts` (§6), `stage.ts` (`stageAt(frame)`: the pieces' trees for the three stage layers, with no React, so tests read words, pieces and positions), `Scene.tsx` (draws `stageAt` with `toReact`, plus `Rings`, `MotionPath`, `Arrow`, `PositionedToken`). Imports with explicit extensions (`scene.ts` and `Scene.tsx` share the folder).

The timeline type, sketched (names may differ; what the spec checks is the behaviour):

```ts
type TakesPhase = { id: string; take: 1 | 2 | "rewind"; from: number; to: number;
  cites: readonly number[]; devices?: readonly ("fright" | "rewind" | "takeNumbers")[];
  events: readonly { id: string; at: number }[] };
type TakesTimeline = { duration: number; outro: number; ringsFade: readonly [number, number];
  phases: readonly TakesPhase[];
  acts: readonly { actor: "visor"; from: number; to: number }[];
  faces: readonly { actor: "visor"; at: number; expression: CastExpression }[];
  emotes: readonly { actor: "visor"; kind: EmoteKind; at: number; leaveAt: number | null }[];
  trips: readonly { id: string; route: string; from: number; to: number }[];
  pops: Readonly<Record<string, number>> };
type TakesSceneData = SceneContract<TakesTimeline> & { kind: "takes"; neutral: true };
```

`CatalogueScene` becomes `SceneData | FlowSceneData | TakesSceneData`. `checkTimeline` adds a `takes` branch: the common rules, then the takes rules of the spec ("Two-take scene kind", "Two-take cast timing"). An emote is visible from `at` until `leaveAt + 10` (exclusive; `leave`'s default length), or to the end when `leaveAt` is `null`. Messages name the scene id first, as the other kinds do (for example `sdd-without-with-spec: emote problem at frame 271 is not on an expression change of visor`).

The English word table is `text.en = { file: "proposal.md", approval: "GO", question: "?", takes: ["1", "2"] }`; the pieces draw these words from the same constants (the stage passes `text.en.file` as the sheet's label, `text.en.approval` as the stamp's word, `text.en.takes[n − 1]` as the badge's text; the `?` is the pieces' own glyph).

## 6. Layout (stage units, 960 × 540; composition = × 2)

Copied from the gate-0 prototype (`concept-a.ts`), with three observed adjustments: the balloon moves up 16 units (y 40, was 56) so the held sheet's label clears it; the sheet is held (0.12.0) instead of standing beside Visor; the page is 224 high so the stamp clears the last row. Assumed, to be confirmed on the stills at gate 1: every position below reads at 1920 × 1080 without overlaps.

| Element | Values |
|---|---|
| Rings | composition centre (960, 600), `ringsFade` [0, 20] |
| Balloon | `speechBubble` x 50, y 40, width 280, height 110, fill `color.state.caller` (tail tip at (70, 170)) |
| Slots | slot *i* centre (86 + 42*i*, 118), *i* = 0 … 5; `questionToken` scale 1.15 |
| Code panel | `codePanel` x 690, y 200, width 210, height 220, top 34, step 22; lines, in order, all `white`: (indent, w) = (0, 90), (18, 120), (36, 80), (36, 110), (18, 70), (36, 100), (18, 60), (0, 40) |
| Visor | `visor` x 480, y 440 (the ground line), scale 1.15, facing right |
| Held sheet | `holdsSheet` width 150, height 224, top 30, step 22, label `proposal.md`; row 0 `{ lead: "none", bar: 90 }`; rows 1–6 `{ lead: "question", bar: 44 / 34 / 50 / 40 / 46 / 30, tail: "none" → "check" }`. Derived (from `brand-cast.ts` and `paper.ts`): page 194.8–367.3 × 177.8–435.4; label pill centred (281.05, 177.8), 172.5 × 41.4; row *k* (1–6) mark centre (229.3, 440 + 1.15 × (−187 + 22*k*)), so *y* = 250.25, 275.55, 300.85, 326.15, 351.45, 376.75; tail check centre x 333.95 |
| Stamp | `stamp` cx 281, cy 428, r 28, word `GO`, default fill and rotation (−12) |
| Take badge | `countBadge` cx 918, cy 42, textSize 22 |
| Rewind mark | `uiIcon` name `reset`, x 852, y 24, size 38 |
| Emotes | `problem` at (360, 292), scale 0.8 (left of the head; take 1 has no sheet); `worked` at (606, 222), scale 0.72 (above right of the head, clear of the held sheet and of the pointing finger, whose tip is at about (561, 292)) |
| Visor's screen face | 431.7–528.3 × 292.8–352.6 (from `faceAt(−42, −128, 84, 52)`) |

Routes and paths (stage units; the composition draws × 2):

| Id | Path | Used by |
|---|---|---|
| `guess-i` | M (86 + 42*i*, 118) C 430,110 610,130 770,290 | `?` *i* in take 1 (ends inside the code panel) |
| `ask-i` | M (86 + 42*i*, 118) C 120,135 150,*y*ₖ 229.3,*y*ₖ with *k* = *i* + 1 | `?` *i* in take 2 (ends on row *k*'s mark) |
| `answer-i` | M (86 + 42*i*, 118) C 390,110 390,*y*ₖ 333.95,*y*ₖ | answer *i* (ends on row *k*'s tail check) |
| P1 | M 332,108 C 430,110 610,130 770,290 | dashed path, take 1 |
| P2 | M 94,172 C 120,190 150,200 194,210 | dashed path, take 2, balloon → sheet |
| P3 | M 367,330 C 440,470 600,470 690,380 | dashed path, take 2, sheet → code |
| Failure arrow | M 700,206 C 620,90 420,70 332,96 | the error coming back |

A `?` in flight is at its route's point by length at `(f − from) / 22`; at its arrival frame it is gone and the code line or the sheet row exists (the handoff is atomic, as pub-sub's).

Layers, bottom to top (SCN-6): 1 `Rings`; 2 `MotionPath` P1, P2, P3; 3 the failure `Arrow`; 4 stage pieces (balloon, code panel, posed Visor with its held sheet, stamp, take badge, rewind mark); 5 the `?` tokens, in the balloon and in flight; 6 the answer tokens; 7 the emote. Stage layers draw piece bodies inside the cover command's outlined group (`stroke` `color.ink`, `stroke-width` `outline.block`, round joins) and their words inside its labels group (`font-size` `cover.labelSize`, `font-weight` `cover.labelWeight`, `fill` `color.ink`, `text-anchor` `middle`, no stroke), with the loaded Source Sans 3 family (`src/pieces/cover.ts` lines 710–712; the prototype's `frame`). Visor is posed with `pose({ x: 480, y: 440, tilt, squash, scale, opacity })` from its pop-in and left out while the pop's scale is at most 0.001.

## 7. Stills plan (MOT-5)

`npm run stills -- sdd-without-with-spec` renders one PNG per phase end plus the last frame, for the one composition:

| Still | Frame | What it must show |
|---|---|---|
| 1 | 89 | the request: balloon with six `?`, empty code panel, Visor idle, badge `1` |
| 2 | 239 | take 1 done: empty balloon, eight code lines, Visor pointing, no path |
| 3 | 309 | the error: red arrow from the code to the balloon, Visor `failed`, tilted, `problem` emote beside its head |
| 4 | 377 | the rewind: the stage of still 1 again, Visor idle, badge `1` with the rewind mark beside it |
| 5 | 489 | take 2 asking: empty balloon, Visor `waiting` holding `proposal.md` with the heading and six `?` rows, path P2 |
| 6 | 589 | answered: six checks, the `GO` stamp on the sheet |
| 7 | 689 | implemented: path P3, eight code lines, Visor `done` and pointing, `worked` emote |
| 8 | 779 | the final still (equal to frame 690) |

The owner sees the eight stills as one contact sheet at gate 1, with the boundary frames that phase-end stills skip (270, 330, 344, 378, 390, 660) checked in Studio (CAST-3).

## 8. Article lines (English, `728d6f4`)

| Line | Text (excerpt) |
|---|---|
| L20 | "they send the development team a one-line message" |
| L22 | "We need an API that, given the order number, returns the delivery status." |
| L24 | "short, reasonable and incomplete. It doesn't say what an order number is …" |
| L26 | "An AI agent does the same, only faster: it picks a format, picks an error code, delivers something that works and moves on. The decisions exist, but they live inside the code, and nobody approved them." |
| L32 | "that spec becomes the source of truth for both the human and the AI … The agent implements from it." |
| L34 | "this changes who decides: the person who approves the spec decides what the system does." |
| L72 | "When the request is unclear, list the open question instead of choosing an answer." |
| L80 | "It stops the agent from doing what it would do by default, which is to choose silently." |
| L82 | "if a decision is missing, it stops and asks" |
| L98 | "`proposal.md` says why the change exists, … and what is still unknown." |
| L103 | "it marked each suggestion as a proposal and listed what the sentence didn't answer" |
| L106–L113 | "## Open Questions" and the six numbered questions |
| L116 | "the same questions as in the opening, now written down, numbered and addressed to the people who can answer them" |
| L120 | "The logistics team answered the six questions." |
| L122 | "the logistics team would only find out which when the first error came back" |
| L124 | "the verdict was GO or NO-GO" |
| L148 | "only an explicit decision by the owner of the request releases the implementation" |
| L152 | "the agent implements what the tasks say and nothing more" |

## Risks / trade-offs

- [The rewind at about 7× speed may flicker] → it is 34 frames of tokens and lines only; checked in Studio and on the web file's contact sheet; G1 question 9 offers the cut.
- [Stage-unit outlines are twice the existing scenes' outline weight in composition pixels] → intended: the gate-0 look; the circuit-breaker and pub-sub scenes are untouched.
- [Positions are assumed until the stills] → one table (§6); the clearance scenarios fail on overlap before the owner sees a still.
- [`motion.travel` or the pop springs change later] → the timeline derives arrivals from `motion.travel`, and a pinned test compares the timeline with §4, so a token change fails the test instead of silently retiming the scene.

## Migration

None for consumers: the package builds only `src/pieces`, `src/fonts`, the tokens and the cover command (`tsconfig.build.json`), so the scene catalogue, `MotionPath` and `motionPathAt` (in `src/brand/`) are not shipped and no consumer sees them. The localised scenes keep their compositions, files and tests. Roll back: revert the merge; nothing persisted depends on it.

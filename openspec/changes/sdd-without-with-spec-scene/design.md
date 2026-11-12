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
| S5 asking | Visor holds `proposal.md`; the `?` travel into it, one row each; Visor hands the sheet over to the requester's side and waits | the first answer leaves the balloon |
| S6 answered | six answers travel from the balloon to the sheet, each ticking a row; the `GO` stamp lands on it | Visor points at the code |
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

What is not a piece stays in composition pixels, below the stage layer: the `Rings` (the `scene.ring*` tokens are composition pixels; AB#333's G1 question 3 accepted that the rings read twice as dense as on the gate-0 sheet) and the dashed paths (`scene.path*`, composition pixels, chosen in AB#333 as the gate-0 look); their coordinates are the stage coordinates × 2. The answer tokens are `PositionedToken`s drawn in stage units (the component's own SVG sized 960 × 540 inside a box scaled × 2), so they read at the `?`'s size and outline weight (radius 17 against the `?`'s 15).

### 2.4 The dashed motion path (G1 question 3)

AB#333 added the `scene.path*` tokens and left the drawing to the first scene that needs it. Scenes 2 and 3 of AB#144 use the same storyboard notation, so it becomes a shared component, `MotionPath`, in `src/brand/components.tsx`, with its frame logic in a pure helper `motionPathAt(frame, fadeIn, fadeOut?)` in `src/brand/motion.ts`: opacity rises linearly over the `fadeIn` range and falls over the optional `fadeOut` range (each `[from, to]`, the `fadeIn` helper's convention). The component takes `d`, `opacity`, `width` and `height` and reads no frame of its own, so a scene can feed it the opacity of any frame (the rewind feeds the object frame, §2.5). The scene uses `motion.fade` (10 frames) for every range. The path is drawn whole (no progressive draw): a dashed path cannot use the arrow's dash-offset reveal without fighting its own dash pattern. Rejected: a scene-local drawing (scenes 2 and 3 would copy it).

### 2.5 The rewind (G1 question 9; reading device, q48 A)

The **object layer** (the `?` in the balloon and in flight, the code lines, the take-1 dashed path, the failure arrow) is drawn from an **object frame** `o(f)`: `o(f) = f` before 344; `o(f) = round(339 − (f − 344) × 250 / 33)` from 344 to 377 (so `o(344) = 339`, `o(377) = 89`, take 1 backwards in 34 frames); `o(f) = 89` from 378 to 389. From 390 the object layer is take 2's own, and the take-1 objects (P1, the failure arrow, the take-1 code lines) are not drawn. The mechanism: `frameAt(f)` computes every object from `o(f)` and the scene draws only that state. No component in the scene reads the frame except `Rings` (its fade ends at 20): the failure arrow is the `messageArrow` piece in the stage layer with a computed opacity, `MotionPath` takes its opacity, and `PositionedToken` takes its point. Visor is not in the object layer: it resets at once at 344 (face `idle`, `points: false`, upright), so the rewind never replays the fright or its emote. The take badge and the rewind mark are drawn from the real frame. Rejected: a cut to take 2 with only the rewind mark (reads as a new scene, not "the same request again").

### 2.6 Smaller choices made here (listed for G1)

- **The hand-over** (G1 question 10; gate-0 frames 4 to 6, "sheet handed over"): Visor writes the rows into the sheet it holds, then hands it over: at 480 its `holdsSheet` is removed and the same page, drawn as the `sheet` and `pill` pieces in a group `translate(X Y) scale(1.15)`, travels in 22 frames (`motion.travel`, linear) from Visor's hand (194.8, 159.4) to its place beside the balloon (100, 196). At 480 the standalone page draws exactly where the held one was (same outline, rows and words). The answers and the stamp then land on the requester's side, and the implementation path starts from there, as on the gate-0 sheet. Article: L116 ("addressed to the people who can answer them").
- **The error as the gate-0 arrow** (G1 question 11): the `messageArrow` piece with the prototype's parameters (`kind: "failure"`), in the stage layer, fading in over `motion.fade` frames from 240, instead of the self-drawing `Arrow` component (solid, `outline.arrow` in composition pixels, half the gate-0 weight).
- **No `facing`** (G1 question 4): Visor faces right in both takes; the held sheet sits on the requester's side, the pointing hand on the code's side.
- **A heading row** (G1 question 5): `holdsSheet` needs at least one row; the sheet appears with one bar row, the article's `## Open Questions` heading (L106), then one `question` row per arriving `?`.
- **Answers as tokens** (G1 question 6): six `PositionedToken`s filled `color.state.caller` (the caller colour on flow elements, ADR 0007's requester row), drawn in stage units, leave from just below the balloon's tail (70, 180), never inside the caller-coloured balloon (SCN-6: no small element in its host's hue), and travel to their row's `?` mark; on arrival the token is gone and the row gets its tail check (`tail: "check"`, the state colour that means done, ADR 0009).
- **Pop-ins and when an element is drawn:** each element pops in with the helper below. An element is drawn when its opacity is above 0 and its scale above 0.001; at its pop frame *a* a block or pill has opacity 0 and an emote scale 0, so it first shows at *a* + 1. From *a* + `motion.fps` (30) it is drawn exactly settled (opacity 1, scale 1), as pub-sub's `settledPop` does at +90; the springs are within 1e-3 of 1 by then (observed: `blockPopIn` 1.00004, `pillPopIn` 1.00003 and `emotePop` 0.99937 at +30). This makes the two takes' first frames and the final hold exactly comparable. `leave` multiplies the opacity of the rewind mark and of the `problem` emote. A piece without a `scale` parameter pops in inside a group scaled about its own anchor (below), with the opacity on that group; Visor pops through `pose` about its ground point (480, 440); an emote through its own `scale` (its value times the pop).

  | Element | Helper | Frame *a* |
  |---|---|---|
  | code panel (about its centre (795, 310)) | `blockPopIn` | 6 |
  | Visor (through `pose` scale and opacity, about (480, 440)) | `blockPopIn` | 12 |
  | take badge `1` (about (918, 42)) | `pillPopIn` | 18 |
  | balloon (about its body's centre (190, 81)) | `blockPopIn` | 24 |
  | slot `?` *i* (the token's `scale` 1.15 times the pop, opacity on its group) | `pillPopIn` | 30 + 4*i* |
  | rewind mark (about its centre (871, 43)) | `pillPopIn` | 340 |
  | take badge `2` (badge `1` is removed at 378; about (918, 42)) | `pillPopIn` | 378 |
  | `GO` stamp (about its centre (189, 432.3)) | `blockPopIn` | 584 |
  | emote `problem`, `worked` (scale; opacity 1) | `emotePop` | 270, 660 |
- **No idle breathing or blinking:** nothing moves that the beat table does not list, so the final still is identical (SCN-4) and CAST-4's "every action parameter as in the frame before" is checked on data alone.
- **The code stays neutral:** code lines are `white` in both takes; colour means state, and the code itself is not the failure (the arrow is).
- **The error is an arrow, not a status:** the failure arrow (`messageArrow` `kind: "failure"`, the failure path colour) shows "an error came back"; no code, number or word says which (MOT-1: the article says the team would only find out which when the error came back, L122).

## 3. Cast and pieces (MOT-6, CAST-1, CAST-6)

| Role | Drawn with | Allowed by |
|---|---|---|
| The AI agent | `visor` (x 480, y 440, scale 1.15; `points`, `holdsSheet`, `expression`), posed with `pose` | ADR 0007, row "AI agent → Visor" |
| The requester | `speechBubble` with `fill: "color.state.caller"` (not a character, no face) | ADR 0007, row "Requester/caller: a state colour on message/flow elements" |
| An open question | `questionToken` (scale 1.15, the sheet's row mark at Visor's scale) | 0.12.0, made for this scene |
| The code | `codePanel` (dark panel, `white` lines) | a generic prop (CAST-2) |
| `proposal.md` in Visor's hand | Visor's `holdsSheet` with `label: "proposal.md"` | 0.12.0 |
| `proposal.md` handed over | the `sheet` and `pill` pieces with the same page, rows and label, in a group `translate(X Y) scale(1.15)` | the pieces Visor's held sheet is made of (`brand-cast.ts`) |
| An answer | `PositionedToken` filled `color.state.caller`, in stage units | motion-components "Persistent and routed tokens" |
| Approval | `stamp` with `word: "GO"` (default face `color.state.healthy`, which ADR 0009 keeps as "approved") | q49 B |
| The error coming back | `messageArrow` with `kind: "failure"` (the gate-0 call) | the failure path colour |
| Take numbers | `countBadge` with `text` `1` / `2` (AB#333: the take numbers stay `countBadge`) | q48 A |
| Rewind mark | `uiIcon` `reset` | q48 A |
| Reactions | `emote` `problem` (a problem appears) and `worked` (it worked) | README emote table |
| Stage, paths | `Rings`, `MotionPath` | `scene.*` tokens |

Mira is out (CAST-6): the scene has no protagonist role the article gives her. No piece is drawn in the scene's own files; the scene only computes parameters, positions and frames.

## 4. Beat table

30 fps, 780 frames (26.0 s), outro at 690, final still 690–779 (90 frames, 3.0 s). `motion.travel` is 22, so every trip and the hand-over end 22 frames after they start. A pop-in at *a* first shows at *a* + 1 (§2.6). "Article" gives the English line numbers (§8 quotes them); **DEVICE** marks a reading device the text does not state, kept by the owner at gate 0 (q48 A, q49 B).

| # | Phase (take) | Frames | Actor | Action, frame by frame | Article |
|---|---|---|---|---|---|
| 0 | none (intro) | 0–23 | — | rings fade in 0–20; code panel pops at 6 (0 lines); Visor pops at 12 (idle, `points: false`); take badge `1` pops at 18 | badge: DEVICE (take numbers) |
| 1 | `request` (1) | 24–89 | requester | balloon pops at 24; the six `?` pop into its slots at 30, 34, 38, 42, 46, 50 | L20, L22 (the request), L24 (short, reasonable, incomplete; the questions it leaves open); six = L108–L113 |
| 2 | `guess` (1) | 90–239 | Visor | 90: Visor points at the code (act 90–90); dashed path P1 fades in 90–100; `?` *i* departs its slot at 112 + 12 × (5 − *i*) along route `guess-i`, so the rightmost leaves first and no token crosses one still waiting (slot 5 at 112, slot 0 at 172), arrives 22 frames later (134 … 194) and the code panel gains one line at each arrival (lines 1–6); lines 7 and 8 at 202 and 210; P1 fades out 220–230 | L26 (picks a format, picks an error code, delivers something that works, moves on; the decisions live inside the code); L80 (to choose silently) |
| 3 | `error` (1) | 240–309 | — then Visor | 240–250: the failure arrow (code → balloon) fades in; 270: Visor's face `failed`, emote `problem` pops beside its head, body squash `squashAfter(f, 270, −0.07)` and tilt −5° | L122 (would only find out which when the first error came back); L26 (nobody approved them); fright: DEVICE |
| — | gap | 310–339 | — | the `problem` emote leaves 320–330 (`leave(f, 320)`) | — |
| 4 | `rewind` (rewind) | 340–377 | — | 340: rewind mark pops beside the badge; 344: Visor resets (act 344–344: face `idle`, `points: false`, tilt 0, squash 1); 344–377: the object layer plays take 1 backwards (§2.5), ending on the state of frame 89 | rewind: DEVICE; the same request again: L22 |
| — | gap | 378–389 | — | 378: badge `1` is removed and badge `2` pops; the rewind mark stays beside it (gate-0 frame 4) | take numbers: DEVICE |
| 5 | `ask` (2) | 390–509 | Visor | 390: Visor holds the `proposal.md` sheet with its heading row (act 390–480); path P2 (balloon → held sheet) fades in 394–404; the rewind mark leaves 400–410 (`leave(f, 400)`); `?` *i* departs at 404 + 10*i* along `ask-i` (slot 0 first: the routes leave to the left, so no token crosses one still waiting), arrives at 426 + 10*i* (426 … 476) and the held sheet gains question row *i* + 1 at each arrival; 480: Visor hands the sheet over (its `holdsSheet` is removed; the page travels 480–502 to beside the balloon) and P2 fades out 480–490; 504: Visor's face `waiting` (no emote) | L32 (writing a spec before writing code; the source of truth), L72 (list the open question instead of choosing an answer), L82 (if a decision is missing, it stops and asks), L98 (`proposal.md` says … what is still unknown), L103 (listed what the sentence didn't answer), L106–L113, L116 (written down, numbered and addressed to the people who can answer them) |
| 6 | `answer` (2) | 510–599 | requester | answer *i* departs from below the balloon's tail at 512 + 8*i* along `answer-i`, arrives on row *i* + 1's `?` at 534 + 8*i* (534 … 574) and that row gets its tail check; 584: the `GO` stamp pops onto the sheet | L120 (answered the six questions); L148 (only an explicit decision by the owner releases the implementation); L34; the word `GO` on the owner's stamp: DEVICE (q49 B; in L124 `GO` is the independent review's verdict) |
| 7 | `implement` (2) | 600–689 | Visor | 600: Visor's face `idle` and it points at the code (act 600–600); path P3 (sheet → code) fades in 600–610; code lines 1–8 appear at 616 + 5*j* (616 … 651); 660: Visor's face `done`, emote `worked` pops beside its head (it stays) | L32 (the agent implements from it), L152 (implements what the tasks say and nothing more), L34; the `done` face and `worked` emote: L169 (each scenario proven by a real call), as on gate-0 frame 6 |
| — | outro | 690–779 | — | nothing moves; every value settled | SCN-4 |

A phase's `events` are the frames its row names inside its range (pop-ins, departures, arrivals, line, row and check frames, faces, acts, emote entrances, the hand-over); cues in a gap row (the leaves at 320, the badge at 378) are top-level cues of the timeline, outside any phase.

Acts (CAST-4): Visor only, at 90–90, 344–344, 390–480 and 600–600. Expression changes: 270 `failed`, 344 `idle`, 504 `waiting`, 600 `idle`, 660 `done`. Emotes: `problem` at 270 (gone at 330, before the act at 344); `worked` at 660 (no act follows). The requester's beats (balloon, answers, stamp) and the page's trip after the hand-over are objects, not a character, so they do not count as acts.

## 5. Data and validation

React-free data, as pub-sub: `src/scenes/sdd-without-with-spec/scene.ts` (the catalogue entry), `timeline.ts` (the table above as data), `takes.ts` (frame logic: `frameAt(frame)` returns the state of every element; `objectFrame(frame)`), `layout.ts` (§6), `stage.ts` (`stageAt(frame)`: the pieces' trees for the three stage layers of §6, `pieces` (layer 3), `tokens` (layer 4) and `emote` (layer 6), with no React, so tests read words, pieces and positions), `Scene.tsx` (draws `stageAt` with `toReact`, plus `Rings`, `MotionPath` and `PositionedToken` from `frameAt`). Imports with explicit extensions (`scene.ts` and `Scene.tsx` share the folder).

The timeline type, sketched (names may differ; what the spec checks is the behaviour):

```ts
type Actor = "mira" | "visor" | "drone" | "kiu" | "sinal";
type TakesPhase = { id: string; take: 1 | 2 | "rewind"; from: number; to: number;
  cites: readonly number[]; devices?: readonly ("fright" | "rewind" | "takeNumbers" | "goStamp")[];
  events: readonly { id: string; at: number }[] };
type TakesTimeline = { duration: number; outro: number; ringsFade: readonly [number, number];
  phases: readonly TakesPhase[];
  acts: readonly { actor: Actor; from: number; to: number }[];
  faces: readonly { actor: Actor; at: number; expression: CastExpression }[];
  emotes: readonly { actor: Actor; kind: EmoteKind; at: number; leaveAt: number | null }[];
  trips: readonly { id: string; route: string; from: number; to: number }[];
  pops: Readonly<Record<string, number>>;
  fades: Readonly<Record<string, { in: readonly [number, number]; out?: readonly [number, number] }>>;
  cues: Readonly<Record<string, readonly number[]>> };   // code lines, rows, checks, the hand-over
type TakesSceneData = Omit<SceneContract<TakesTimeline>, "text"> &
  { kind: "takes"; neutral: true; text: { readonly en: TextTable } };
```

`CatalogueScene` becomes `SceneData | FlowSceneData | TakesSceneData`; a localised fixture of kind `takes` (for the "Localised takes scene" scenario) is built by casting. `checkTimeline` adds a `takes` branch: the common rules, then the takes rules of the spec ("Two-take scene kind", "Two-take cast timing", "Two-take reading hold"). An emote is visible from `at` until `leaveAt + 10` (exclusive; `leave`'s default length), or to the end when `leaveAt` is `null`. Messages name the scene id first, as the other kinds do (for example `sdd-without-with-spec: emote problem at frame 271 is not on an expression change of visor`).

The English word table is `text.en = { file: "proposal.md", approval: "GO", question: "?", takes: ["1", "2"] }`; the pieces draw these words from the same constants (the stage passes `text.en.file` as the sheet's label, `text.en.approval` as the stamp's word, `text.en.takes[n − 1]` as the badge's text; the `?` is the pieces' own glyph, which a test compares with `text.en.question`).

## 6. Layout (stage units, 960 × 540; composition = × 2)

Copied from the gate-0 prototype (`concept-a.ts`), except these deviations, each listed for gate 1 with its reason:

| Deviation from gate 0 | Reason |
|---|---|
| Balloon y 26 (was 56); slots, P1, P2 and the error arrow's end move up with it | the held page's label must clear the balloon |
| Visor holds the page while it writes, then hands it over (gate 0 drew it beside Visor, then beside the balloon) | 0.12.0's `holdsSheet` (AB#333); the hand-over keeps frames 5 and 6 |
| Page height 240, top 24, step 31 (gate 0: 244, 34, 27), with a heading row (row 0) above the six questions | marks 31 apart against a 29-unit disc (radius 13 plus its outline) leave a visible gap, which gate 0's 27 did not; top 24 keeps the heading clear of the label and the page between the balloon and the ground; `holdsSheet` needs one row from the start |
| Label pill 150 wide (was 140) | `holdsSheet` draws the label with `pill`'s default width |
| Page rests at (100, 196) (was (70, 204) at scale 1) | clears the balloon's tail (x 70–94) and keeps the label off the balloon |
| Stamp r 32 as gate 0, centred over rows 5 and 6's bars at (189, 432.3) (gate 0: lower left) | the page has no free space below its rows; there it clears every `?` mark and tail check |
| Emotes left of the head at (335, 296) and (340, 292) (gate 0: (360, 292), (358, 300)) | clear of the tilted face at the pop's overshoot, and of the handed-over page |
| No dotted Visor → sheet path in take 2 (gate-0 frame 5) | the hand-over is shown by the page travelling |
| The rewind mark stays beside badge `2` until 400–410 | as gate-0 frame 4 |
| P1 and P2 keep the gate-0 notation, not the exact token routes | they are the storyboard's guide lines; the tokens' own routes are below |

Assumed, to be confirmed on the stills at gate 1: every position below reads at 1920 × 1080 without overlaps.

| Element | Values |
|---|---|
| Rings | composition centre (960, 600), the gate-0 ring centre (480, 300) × 2 (the frame's centre is (960, 540)); `ringsFade` [0, 20] |
| Balloon | `speechBubble` x 50, y 26, width 280, height 110, fill `color.state.caller` (bottom 136, tail tip at (70, 156)) |
| Slots | slot *i* centre (86 + 42*i*, 104), *i* = 0 … 5; `questionToken` scale 1.15 |
| Code panel | `codePanel` x 690, y 200, width 210, height 220, top 34, step 22; lines, in order, all `white`: (indent, w) = (0, 90), (18, 120), (36, 80), (36, 110), (18, 70), (36, 100), (18, 60), (0, 40) |
| Visor | `visor` x 480, y 440 (the ground line), scale 1.15, facing right |
| The page | width 150, height 240, top 24, step 31, label `proposal.md`; row 0 `{ lead: "none", bar: 90 }`; rows 1–6 `{ lead: "question", bar: 44 / 34 / 50 / 40 / 46 / 30, tail: "none" → "check" }`. Rows are 31 apart against a mark of radius 13 plus its outline (a 29-unit disc) and a 22-unit check plus its outline (25), so neighbouring marks and checks leave a gap |
| Held (390–479) | Visor's `holdsSheet` with the page. Derived (from `brand-cast.ts` and `paper.ts`; page at Visor's local (−248, −244)): page 194.8–367.3 × 159.4–435.4; label pill centred (281.05, 159.4), 172.5 × 41.4 (194.8–367.3 × 138.7–180.1); row *k* (1–6) mark centre (229.3, 440 + 1.15 × (−209 + 31*k*)): *y* = 235.3, 270.95, 306.6, 342.25, 377.9, 413.55 |
| Handed over (from 480) | `sheet` (x 0, y 0) and `pill` (x 75, y 0) of the page in a group `translate(X Y) scale(1.15)`, drawn in layer 3 before Visor (so Visor's empty hand stays above it, as it was above the held page); (X, Y) goes linearly from (194.8, 159.4) at 480 to (100, 196) at 502 and stays (at 491: (147.4, 177.7)). At rest: page 100–272.5 × 196–472; pill 100–272.5 × 175.3–216.7; row *k* mark centre (134.5, 196 + 1.15 × (35 + 31*k*)): *y* = 271.9, 307.55, 343.2, 378.85, 414.5, 450.15; tail check box x 226.5–251.8, centre x 239.15 |
| Stamp | `stamp` cx 189, cy 432.3, r 32, word `GO`, default fill and rotation (−12): over rows 5 and 6's bars, 5.8 units clear of the `?` marks (right edge about 151.2 with outline) and 5.5 clear of the checks (226.5) |
| Take badge | `countBadge` cx 918, cy 42, textSize 22 |
| Rewind mark | `uiIcon` name `reset`, x 852, y 24, size 38 |
| Emotes | `problem` at (335, 296), scale 0.8; `worked` at (340, 292), scale 0.72; left of the head (the pointing hand is on the right, whose finger tip is at about (561, 292); the handed-over page ends at x 272.5). If "Emote beside the head" fails at the pop's overshoot (`emotePop` peaks at about 1.237), the implementer moves only the emote positions until it passes and writes them here in the same commit |
| Visor's screen face | 431.7–528.3 × 292.8–352.6 upright (from `faceAt(−42, −128, 84, 52)`); with tilt and squash, the same box transformed by Visor's pose |
| Answer tokens | `PositionedToken` radius 17 (stage units), fill `color.state.caller`, stroke ink |

Routes and paths (stage units; the composition draws P1–P3 × 2):

| Id | Path | Used by |
|---|---|---|
| `guess-i` | M (86 + 42*i*, 104) C 430,96 610,130 770,290 | `?` *i* in take 1 (ends inside the code panel) |
| `ask-i` | M (86 + 42*i*, 104) C 40,96 120,*y*ₖ 229.3,*y*ₖ with *k* = *i* + 1 and the held *y*ₖ | `?` *i* in take 2 (ends on held row *k*'s mark; goes left of the label pill) |
| `answer-i` | M 70,180 C 62,(*y*ₖ − 40) 80,*y*ₖ 134.5,*y*ₖ with the handed-over *y*ₖ | answer *i* (ends on row *k*'s `?` mark, left of the pill) |
| P1 | M 332,92 C 430,96 610,130 770,290 | dashed path, take 1 |
| P2 | M 94,158 C 120,176 150,186 194,196 | dashed path, take 2, balloon → held sheet |
| P3 | M 272,330 C 380,470 600,470 690,380 | dashed path, take 2, handed-over sheet → code (passes under Visor) |
| Failure arrow | `messageArrow` from (700, 206) to (332, 82), controls (620, 90), (420, 70), `kind: "failure"` | the error coming back |

The control points of `ask-i` and `answer-i` are a starting point: if "Tokens clear the face and the label" fails, the implementer moves only those control points until it passes and writes the new values here in the same commit. A `?` or an answer in flight is at its route's point by length at `(f − from) / 22`; at its arrival frame it is gone and the code line, row or check exists (the handoff is atomic, as pub-sub's).

Layers, bottom to top (SCN-6): 1 `Rings`; 2 `MotionPath` P1, P2, P3; 3 stage pieces (the failure arrow, balloon, code panel, the handed-over page, posed Visor with its held sheet, stamp, take badge, rewind mark); 4 the `?` tokens, in the balloon and in flight; 5 the answer tokens; 6 the emote. A travelling token is drawn above the label pill, against SCN-6's order (pills above tokens), but no route lets a token touch the pill ("Tokens clear the face and the label"), so neither hides the other. Stage layers draw piece bodies inside the cover command's outlined group (`stroke` `color.ink`, `stroke-width` `outline.block`, round joins) and their words inside its labels group (`font-size` `cover.labelSize`, `font-weight` `cover.labelWeight`, `fill` `color.ink`, `text-anchor` `middle`, no stroke), with the loaded Source Sans 3 family (`src/pieces/cover.ts` lines 710–712; the prototype's `frame`). Visor is posed with `pose({ x: 480, y: 440, tilt, squash, scale, opacity })` from its pop-in, and left out while it is not drawn (§2.6).

## 7. Stills plan (MOT-5)

`npm run stills -- sdd-without-with-spec` renders one PNG per phase end plus the last frame, for the one composition:

| Still | Frame | What it must show |
|---|---|---|
| 1 | 89 | the request: balloon with six `?`, empty code panel, Visor idle, badge `1` |
| 2 | 239 | take 1 done: empty balloon, eight code lines, Visor pointing, no path |
| 3 | 309 | the error: red arrow from the code to the balloon, Visor `failed`, tilted, `problem` emote beside its head |
| 4 | 377 | the rewind: the stage of still 1 again, Visor idle, badge `1` with the rewind mark beside it |
| 5 | 509 | take 2 asking: empty balloon, the `proposal.md` page with the heading and six `?` rows beside the balloon, Visor `waiting` with empty hands, badge `2` alone |
| 6 | 599 | answered: six checks, the `GO` stamp on the page |
| 7 | 689 | implemented: path P3, eight code lines, Visor `done` and pointing, `worked` emote |
| 8 | 779 | the final still (equal to frame 690) |

The owner sees the eight stills as one contact sheet at gate 1. The boundary frames phase-end stills skip (270, 330, 344, 378, 390, 476, 480, 502, 660) are checked in Studio (CAST-3), and frame 450 (the held sheet mid-writing) is added to the sheet so the owner sees Visor holding the page.

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
| L169 | "Each spec scenario becomes a `curl` call against the running application" |

## Risks / trade-offs

- [The rewind at about 7× speed may flicker] → it is 34 frames of tokens and lines only; checked in Studio and on the web file's contact sheet; G1 question 9 offers the cut.
- [Stage-unit outlines are twice the existing scenes' outline weight in composition pixels] → intended: the gate-0 look; the circuit-breaker and pub-sub scenes are untouched.
- [The hand-over could jump if the standalone page differs from the held one] → "Seamless hand-over" compares the two drawings at 479 and 480.
- [Positions are assumed until the stills] → one table (§6); the clearance scenarios fail on overlap before the owner sees a still.
- [`motion.travel` or the pop springs change later] → the timeline derives arrivals from `motion.travel`, and a pinned test compares the timeline with §4, so a token change fails the test instead of silently retiming the scene.

## Migration

None for consumers: the package builds only `src/pieces`, `src/fonts`, the tokens and the cover command (`tsconfig.build.json`), so the scene catalogue, `MotionPath` and `motionPathAt` (in `src/brand/`) are not shipped and no consumer sees them. The localised scenes keep their compositions, files and tests. Roll back: revert the merge; nothing persisted depends on it.

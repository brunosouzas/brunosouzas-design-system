# Design: sdd-scene-3-archive

See `proposal.md` for the why. This file holds: §1 the story; §2 decisions; §3 pieces; §4 the beat table; §5 reading choices; §6 layout; §7 stills plan; §8 article lines and words; §9 open questions.

**Round-1 spec review (two reviewers, sequential) found real defects, fixed here; round-2 found further issues in those fixes, also fixed here (see inline round-2 notes in §2.1, §2.6, §6.1):** the living spec's text must change at the *second* archive, which itself follows the implementation beat, not before it (L193-199, L236; round 2 reordered `apply` before `archive-2`); several article-line citations were wrong (§8 corrected); pop-in scenario wording didn't follow the `+1`-frame convention (§2.5, fixed in §4.2/spec); the book overlapped Chaves's body box and the field-count pill overlapped the `worked` emote (both repositioned, §6.1); the `?` pill's own box fell outside the frame margin once its placement was actually checked (round 2, §6.1); the MODIFIED catalogue requirement regressed scene 1's own unarchived copy (fixed, now additive, with a corrected "Four scenes" scenario per round 2); the `sequence` kind's two requirements were referenced but never added to this change's own spec (now ported, condensed, as ADDED, §2.1) — round 2 found the "no-op second archive" claim for this port was false (OpenSpec rejects a duplicate ADDED header), corrected to an explicit manual step; "no actor on stage" was imprecise and is now phrased as "no cast member acts"; the outro-rejection fixture used a value inside the valid range (now 511/515 against the limit 510); the `?` pill's placement exemption covered its whole lifetime, making the "collision rejected" fixture unfalsifiable (narrowed to its settle/leave windows only, fixture moved off that window).

Observed sources:

- **The gate-0 sheet** `concept-A-archive-and-the-break.png`, the phone check `phone-check-scene3-A4-A8.png` and `index.md` (brain vault, `evidence/2026-11-13-sdd-cena-3-gate-0/`). Gate 0's own q4 answer: "mantém a abreviação do achado no storyboard, a legenda real (se houver) cita o artigo de perto" — the pure-gesture choice below (no text for the finding at all) is this design's own recommendation, going further than gate 0 asked, not a restatement of it.
- **The English article**, `spec-driven-development-in-practice.en.md`; the Portuguese sibling shares line numbers (not independently re-checked in this round; flagged as unverified by round-1 reviewer A).
- **The code** at `origin/main` (`208b654`, scene 1 only) and `sdd-scene-2-files` (PR #48, unmerged): `src/scenes/sdd-request-relay/`, `src/scenes/takes-kind.ts`, `src/scenes/sequence-kind.ts`, `src/scenes/catalogue.ts`, `src/pieces/library.ts` (`folder`, `book`, `diagramBox`), `src/pieces/supporting-cast.ts` (`balao`, `chaves` — only `holdsSheet`, tied to the `sheet` piece, exists as a held-prop mechanism), `src/pieces/stamp.ts`, `src/pieces/emote.ts`, `src/brand/motion.ts` (`blockPopIn`/`popSpring`: an element popping at frame *a* has opacity 0 at *a* and is first drawn at *a* + 1, settled from *a* + `motion.fps`).
- **Text widths** (harfbuzzjs on `fonts/SourceSans3-Bold.ttf`, the scene 2 worktree's `test/scenes/text-measure.ts`), measured at size 33: `exactly two fields` 254.9, `exactly three fields` 277.0, `GO` 43.6. Both field-count phrases fit a 300-unit pill with margin.

## 1. The story

Scene 2 ended with the implementation; this scene starts right after. **The first change is archived** (L193-199): its folder travels off stage into a small parked shape (no cast member acts during the trip — the archive is a mechanical step, like scene 2's unattended `NO-GO`), and the `book` — the living spec, already on stage beside Chaves — pops and, once the folder has parked, gains one line: "exactly two fields" (what the first change promised; L199 — the delta merges into `specs/` at archive time). Days later, Balão speaks again with no text on screen (as scenes 1-2 render requests): a one-line ask (L201-205). Visor proposes a second change; its folder pops in a fresh slot. The proposal's impact section does something nobody asked for: it points at the book's own line and jolts it — a jolt of the book, not of the new folder — because the second request breaks a promise that was only visible because it was written down (L223, L226-228, L232). The new change's folder itself carries one open point (a single low finding, unlike scene 2's four and two): a brief `?` and jolt, then fixed. No `NO-GO` appears anywhere; the review gives `GO` in its first round (L236). Balão's `GO` stamp lands on the second folder. **That change is archived too** — its folder travels off stage to park beside the first (L193-197, L236, "then came... the archive") — and only then does the book's line change: "exactly two fields" becomes "exactly three fields" (L215-216, L236). The scene closes with Chaves, beside the book the whole time, settling into a quiet `done`: he is "whoever joins the project" next, reading the living spec (L242, L264).

| State | What is on stage | Changes into the next state when |
|---|---|---|
| S0 setup | rings; Balão, Chaves, Visor at scene 1/2's places; the `book` (closed) beside Chaves; the first change's folder, centred high on stage | pop-ins settle |
| S1 archive-1 | the folder travels to a small parked shape and stays there; the book gains its "exactly two fields" line once it has parked | the book's line has appeared |
| S2 request | Balão speaks, no text | Balão stops speaking |
| S3 propose | Visor points; a second folder pops in a fresh slot; the book's line jolts once (the breaking fact, surfaced by the proposal, not asked for) | the book's jolt ends |
| S4 review | with no cast member acting, a `?` pops over the second folder and it jolts (the single low finding); then the `?` goes (fixed) | the `?` is gone |
| S5 approve | Balão holds up its `GO` stamp; it leaves his hand, travels to the second folder and lands, growing to scale 1.6; Balão's face turns `done` | the stamp has landed |
| S6 apply | Visor's face turns `done` with the `worked` emote (the implementation, L152) | the emote is drawn |
| S7 archive-2 | with no cast member acting, the landed `GO` fades away and the second folder travels off stage to park beside the first (L236: implementation, then the archive) | the folder has parked |
| S8 fieldFlip | the field-count pill's text changes to "exactly three fields", coincident with the folder parking | the text has changed |
| S9 ending | Chaves's face turns `done`; nothing else moves | the final hold starts |

## 2. Decisions

### 2.1 No new scene kind; the `sequence` kind ported, not depended on

This scene's shape — phases that run once, in order, one short review round and one `GO`, no rewind — is exactly what `sequence-kind.ts` (added by `sdd-scene-2-files`, design §2.1 there) already checks: neutral, no `take`, no `rewind`, an article line per phase, the `takes` kind's cast and hold rules. A bespoke kind, or a "two-phase sequence" variant, would duplicate that logic for zero behavioural gain.

This branch is cut from `origin/main` at `208b654` (scene 1 only; PR #48 has not merged), so `src/scenes/sequence-kind.ts` does not exist on `main` yet, and (round-1 fix) **neither does a spec requirement for it** unless this change adds one. This change ports the code and a condensed version of the two requirements it needs ("Sequence scene kind", "Sequence cast and hold") into its own `specs/scene-catalogue/spec.md` as ADDED (this change's own spec delta).

**Round-2 correction:** OpenSpec 1.14.1 refuses to add a requirement whose header already exists (`ADDED failed … already exists`), so the two changes' ADDED blocks do **not** merge as a harmless duplicate the way the proposal first claimed. Whichever of the two PRs archives second must, as an explicit manual step before its own `openspec archive` (added to task 6.6 of both changes' owners' checklists): drop the duplicate "Sequence scene kind"/"Sequence cast and hold" ADDED blocks from its own delta (the code they describe is already in `openspec/specs/` from the first archive), and rebuild its MODIFIED "State-machine and flow catalogue compatibility" block against the spec as it stands after the first archive, not against this design's own six-scenario copy. This is real manual work at merge/archive time, not a no-op; it is called out here so the owner budgets for it rather than discovering it as an archive failure.

The code files (`sequence-kind.ts`, the `takes-kind.ts`/`catalogue.ts` edits) are ported **byte-identical** to `sdd-scene-2-files`' own commit (verified with `diff` in task 1.1). The registration files (`src/scenes/index.ts`, `src/Root.tsx`, `README.md`, `docs/roadmap.md`, and the three tests that pin the registry list: `test/scenes/catalogue-flow.test.ts`, `test/scenes/sdd-request-relay-catalogue.test.ts`, `test/scripts/cli.test.ts`) are **not** expected to merge cleanly against PR #48 — both branches add a fifth scene at the same point, so this is an ordinary merge conflict the owner resolves by hand when merging the two PRs in order (scene 2 first, by number), not a silent risk. (Round-2 code review addition: this branch also adds `test/fixtures/sequence-scene.ts`, a test-only `sequence` fixture that `catalogue-flow.test.ts`'s "Takes fixture beside the registered scenes" scenario needs; scene 2's branch has no such file, so it is a clean add, not a conflict.)

| Option | Why not, or why |
|---|---|
| Depend on the `sdd-scene-2-files` branch directly (base this branch on it) | the task requires a fresh worktree off `origin/main`; scene 2 is a reference, not a dependency, and may still change before it merges |
| A new `sequence2` kind, or extend `sequence` with a "review rounds" count | the existing kind already handles "phases run once, in order"; a round count is scene data, not a kind-level concern |
| Port the code only, reference scene 2's spec requirements without adding them here | leaves this change's own code unspecified until scene 2 merges and archives — a change SHALL NOT ship code with no requirement behind it |
| **Port the code byte-identical, and the two requirements verbatim as this change's own ADDED (chosen)** | self-contained; the registration-file conflict is explicit and ordinary, not hidden |

### 2.2 Words that read on a phone

As scenes 1-2 (11.7 px rule at 341 px, 0.355 px/unit): every settled word at least 33 stage units. Measured at size 33 (§ sources above): `exactly two fields` 254.9, `exactly three fields` 277.0, `GO` 43.6.

- **`exactly two fields` / `exactly three fields`:** one `diagramBox` pill, `textSize` 33, width 300 (clears both measured widths with margin), placed clear of the book, the cast and the `worked` emote (§6.1; round-1 fix — it previously overlapped the emote).
- **`GO`:** Balão's own stamp (radius 24) while held (effective ~25.65, exempt in his act), in flight (exempt), landed at scale 1.6 (43.2).
- **`?`:** a symbol, exempt, drawn as a small `diagramBox` pill with `textSize` 24 above the flagged folder.

### 2.3 One finding, one verdict, no `NO-GO`

The article's second review "gave GO in the first round, with a single minor finding" (L236) — not a rejection fixed on a later version, unlike the first change's two `NO-GO`s. The finding is a pure gesture: a `?` over the second change's folder plus a 12-frame jolt (the same jolt formula as `sdd-scene-2-files`, design §2.3: `5 · sin(2π(f − a)/6) · (1 − (f − a)/12)` degrees from frame `a` to `a + 11`), then the `?` is simply removed (fixed, "the fix was one sentence", L236) — no stamp of any colour marks this step; the stamp that appears is `GO`, after the fix, exactly once. This asymmetry with scene 2's two rejected rounds is the article's own point, kept deliberately visible.

The breaking-change fact is a separate gesture, on a separate element: a jolt of the **book** (not the new folder) during the `propose` phase, because the break is something the living spec already knew and the proposal's impact section surfaced (L223, L232), not something review found. Balão's `GO` is the owner's approval (L148), distinct from the review's own verdict (L236); the review's "GO in the first round" and the owner's explicit decision are the same beat in this compressed scene (as scene 1/2 also compress distinct article beats), not a claim that review and approval are the same act.

### 2.4 The book stays closed; Chaves does not hold it

`book` has no "open" variant and `supporting-cast.ts` has no held-book mechanism (`chaves.holdsSheet` is typed to the `sheet` piece). Adding one would be a shared-piece change outside this scene's own files, and outside gate 0's "no new pieces" (q5). Instead the book is placed beside Chaves, clear of his body box (§6.1 — round-1 fix moved it from an overlapping position), so the final frame reads as "Chaves beside the living spec" through proximity and his settled `done` face, with no camera move.

### 2.5 Stage units and pop-ins

As scenes 1-2: 960 × 540 stage units in an SVG `viewBox="0 0 960 540"` over the 1920 × 1080 composition; `Rings` and `MotionPath` in composition pixels, below the stage layers. `blockPopIn`: an element popping at frame *a* has opacity 0 at *a*, is first drawn (opacity above 0) from *a* + 1, and is settled from *a* + `motion.fps`. A **content change** of an element already on stage (a row's state, a stamp's position mid-flight, the field-count pill's text) is not a pop-in and takes effect at its own frame, with no `+1` offset — this matches scene 2's own frame-table language ("row 1 is checked from 428"). The `worked` emote never leaves and is drawn from its own frame (also not a pop-in by this rule, per scene 1/2's convention for emotes, though its *entrance* must still settle by the reading hold per `checkHold`).

### 2.6 A second archive beat, not a silent text change

Round-1 reviewer B's high-severity finding: the article merges the delta into the living spec **at archive** (L193-199), and L236 places "the archive" after "the implementation" and before the spec reads "exactly three fields". The first design skipped straight from `GO` to a text flip, which states something the article doesn't. This design adds phases `apply` (Visor's `done`/`worked`, the implementation itself) and `archive-2` (§4.1): once `GO` has landed and the implementation beat has played, the landed `GO` stamp fades away and the second folder — unchanged otherwise — travels off stage to park beside the first (same mechanism as `archive-1`, no cast member acting); only once it has parked does the field-count pill's text change, coincident with the parking (round-2 fix: this also avoids ever having to specify the `GO` stamp's size or position while shrinking with a travelling folder, since the stamp is gone before the trip starts). This also means the ending frame shows two parked folders (the two archived changes) beside the book, which matches gate 0's own phrase for concept A ("o arquivo acumula uma segunda change datada").

## 3. Pieces (MOT-6, CAST-1)

| On stage | Drawn with |
|---|---|
| Balão (requester and approver) | `balao`, `facing` right, `speaks`, `holdsStamp { word: "GO" }` |
| Chaves ("whoever joins the project" in the final frame) | `chaves`, `facing` right, no action parameter — present and still |
| Visor (AI agent) | `visor`, `facing` left, `points` |
| the first change, archived | `folder` at scale 0.9 initially, parked at scale 0.4 |
| the second change | `folder` at scale 0.95 initially, parked at scale 0.4 beside the first, no name pill |
| the living spec | `book`, closed, with a `diagramBox` pill above it for the field-count phrase |
| the single finding | a `diagramBox` pill (`?`, size 24) above the second folder, plus a jolt of that folder |
| the breaking fact | a jolt of the `book` (no new element) |
| `GO` | Balão's held `stamp`, then the `stamp` piece in flight and landed |
| reaction | `emote` (`worked`) |
| motion guide | `MotionPath` (the `GO` trip) |
| stage rings | `Rings` |

No `sheet`, `keyboard` or `codePanel`: this scene has no command typed and no row-by-row file. The scene's files contain no colour literal and create no SVG shape of their own.

## 4. Beat table

Constants: `motion.fps` 30, `motion.travel` (T) 22, `motion.fade` (F) 10, `motion.readingHold` 90, jolt 12 frames. Duration **600** frames (20 s), outro **500**, final hold 500-599 (100 frames).

### 4.1 Phases

| # | Phase id | Frames | Cites (English lines) | Devices |
|---|---|---|---|---|
| 1 | `setup` | 0-39 | 193, 199 | — |
| 2 | `archive-1` | 40-119 | 193, 195, 196, 197, 199 | — |
| 3 | `request` | 120-179 | 201, 203, 205 | — |
| 4 | `propose` | 180-259 | 207, 209, 211, 221, 223, 226, 227, 228, 232 | — |
| 5 | `review` | 260-339 | 236 | findingMark |
| 6 | `approve` | 340-399 | 124, 148, 236 | goStamp |
| 7 | `apply` | 400-419 | 152, 236 | — |
| 8 | `archive-2` | 420-469 | 193, 195, 196, 197, 236 | — |
| 9 | `ending` | 470-499 | 242, 264 | — |

### 4.2 Frame table

Pop-ins follow §2.5: an element popping at *a* is first drawn at *a* + 1. Content changes (row/pill text, a stamp parking) take effect at their own frame with no offset.

| Frames | Element | Action | Line |
|---|---|---|---|
| 0-20 | rings | fade in | — |
| 4 / 6 / 8 | Balão / Chaves / Visor | pop at 4/6/8 (block, through `pose`); first drawn 5/7/9 | L193 |
| 10 | `book` | pops; first drawn 11 | L199 |
| 12 | first-change `folder` | pops at (480, 140), scale 0.9; first drawn 13 | L193 |
| 44 | first-change `folder` | departs on route `archive-1`; arrives 66 at parked position, scale 0.4 | L193, L195-197 |
| 100 | field-count pill | pops reading "exactly two fields"; first drawn 101 | L199 |
| 124 | Balão | act: `speaks` on | L201, L203, L205 |
| 164 | Balão | act: `speaks` off | L205 |
| 184 | Visor | act: `points` on | L207, L209 |
| 190 | second-change `folder` | pops at its own slot, scale 0.95; first drawn 191 | L207, L211 |
| 210 | `book` | jolts 210-221 | L221, L223, L226-228, L232 |
| 246 | Visor | act: `points` off | L223 |
| 268 | `?` pill | pops above the second folder; first drawn 269; folder jolts 268-279 | L236 ("a single minor finding") |
| 304 | `?` pill | leaves (gone 314) | L236 ("the fix was one sentence") |
| 344 | Balão | act: `holdsStamp { word: "GO" }` on | L148 |
| 360 | Balão | act: `holdsStamp` off; face `done` | L148 |
| 360 | `GO` | departs Balão's hand on route `go`, scale 0.95; arrives 382 at the second folder's slot (380, 150), scale 1.6, stays until it leaves at 420 | L124, L148, L236 |
| 360-370, 382-392 | guide `go` | fades in, fades out | device |
| 404 | Visor | face `done`, `worked` emote (stays) | L152 (scene 1/2's completion device) |
| 420 | `GO` | leaves (fades, gone 430) | L236 ("then came... the archive") |
| 430 | second-change `folder` | departs on route `archive-2`; arrives 452 at its parked position, scale 0.4 | L193-197, L236 |
| 452 | field-count pill | text changes to "exactly three fields" (coincident with the folder parking) | L215-216, L236 |
| 474 | Chaves | face `done` | L242, L264 |
| 500-599 | everything | still | SCN-4 |

**Acts:** Balão 124-164 (`speaks`), 344-360 (`holdsStamp`); Visor 184-246 (`points`). Chaves has none.

**Faces:** Balão `done` 360; Visor `done` 404; Chaves `done` 474. **Emotes:** `worked` (Visor, 404, never leaving).

**Pops:** `balao` 4, `chaves` 6, `visor` 8, `book` 10, `firstFolder` 12, `fieldPill` 100, `secondFolder` 190, `findingMark` 268. **Fades:** `goGuide` in 360-370, out 382-392; `go` (the landed stamp itself) leaves 420-430. **Leaves:** `findingMark` 304 (gone 314); `go` 420 (gone 430).

**Trips:** `archive-1` (first folder) 44→66; `go` 360→382; `archive-2` (second folder, alone — `GO` has already left) 430→452.

**Jolts:** `book` 210-221; `secondFolder` 268-279 (same 12-frame formula as `sdd-scene-2-files`, design §2.3).

**Cues:** `request` 124; `propose` 184, 190; `breakJolt` 210; `finding` 268; `fix` 304; `approve` 344; `apply` 404; `goLeaves` 420; `archive2` 430; `fieldFlip` 452; `ending` 474; and every action, pop, trip and fade frame above.

### 4.3 Routes (stage units)

| Route | Path |
|---|---|
| `archive-1` (first folder's centre) | `M 480,140 C 650,70 820,70 900,70` |
| `go` (the stamp's centre) | `M 229.4,409.5 C 320,280 380,190 380,150` |
| `archive-2` (second folder's centre) | `M 380,150 C 600,100 800,130 900,170` |

An object travels its route in T frames, linear by length, drawn from its trip's start frame to the frame before arrival; at arrival it is parked at the route's end. The guide is drawn × 2 in composition pixels by `MotionPath`.

## 5. Reading choices (MOT-1) and out-of-scope outcomes

Approved at gate 0: concept A (q1); the asymmetry with scene 2's two NO-GO rounds kept visible; Chaves as "whoever joins the project"; no new pieces.

Made in this design, for G3 (§9 and proposal's open questions): no new scene kind, the `sequence` kind ported with its own spec requirements (§2.1); no `NO-GO` anywhere, only `GO`; the breaking fact as a jolt of the book, decoupled from the single finding on the second folder; the book kept closed, Chaves beside it rather than holding it; the field-count phrase as the only literal text that changes, and it changes at the second archive, not at apply (§2.6); length 20 s, the shortest of the three scenes, matching the article's shortest act.

Out of scope: who runs the review; version numbers; the exact sentence fixed beyond "exactly two/three fields"; the other recorded answers (`null` for delivered orders, no time component, fixed value); a `v2` or consumer conversation (a hypothesis the article raises and drops, L234's second sentence); the proof/`curl` calls.

## 6. Layout (stage units, 960 × 540; composition = × 2)

### 6.1 Elements

| Element | Piece and parameters | Position |
|---|---|---|
| cast | `scale` 0.95 (CAST-5) | ground y 476; Balão x 104, Chaves x 505, Visor x 852 (scenes 1-2's) |
| `book` | `book` x 620, y 300, width 90, height 160 | centre (665, 380) — clear of Chaves's body box (x ≤ 590.5) by 29.5 units |
| field-count pill | `diagramBox` pill w 300, h 44, `textSize` 33, fill `color.white` | centred (665, 230) — above the book, clear of the `worked` emote (y 208-252 vs. the emote's ≈ y 266-318) |
| first-change `folder` | `folder` scale 0.9 → parked 0.4 | from centre (480, 140) to (900, 70) |
| second-change `folder` | `folder` scale 0.95 → parked 0.4 | initially centre (380, 150), parked (900, 170) |
| `?` finding pill | `diagramBox` pill w 40, h 32, `textSize` 24 | centred (505, 50) — beside the second folder's front (x ≤ ≈ 470), clear of the frame margin (box x 483.5-526.5, y 32.5-67.5 with half the outline) and clear of the folder's two peeking papers (round-2 code review fix: shrinking the pill to clear the papers vertically, round-1's attempt, left the `?` glyph overflowing a height-18 pill; moving sideways instead keeps the pill at its full size) |
| `GO` | `stamp` r 24, word `GO`; × 0.95 in flight, growing to × 1.6; leaves (fades) once parked, before `archive-2` | from (229.4, 409.5) (Balão's held stamp) to (380, 150) |
| emote `worked` | `emote` scale 0.75 | (800, 292) |
| rings | `Rings` | centre (960, 540) composition pixels |

If a value here fails the layout test (minimum size, collision, inside-frame), the implementer changes it here and in the spec in the same commit and lists it for the owner.

### 6.2 Layers

From the bottom: 1 `Rings`; 2 `MotionPath` `go`; 3 stage `book`: the book, its pill; 4 stage `folders`: the first and second `folder`, the `?` pill; 5 stage `cast`: Visor, Chaves, Balão; 6 stage `verdict`: `go`; 7 stage `above`: the emote.

Cast body boxes (scenes 1-2's): Balão x 45.1-193.3, y 322.1-476; Chaves x 419.5-590.5, y 333.5-476; Visor x 789.3-914.7, y 341.1-476.

### 6.3 What the layout test proves

1. Layout equals §6.1 and §4.3.
2. Minimum size: the field-count pill and settled `GO` at least 33; `GO` only smaller inside Balão's act 344-359 or in flight 360-381; the `?` not checked (a symbol).
3. Boxes: a pill's box is its body with half its outline; a stamp's box is its disc's square, against the frame, the pills, the `book`'s own box and the cast.
4. Inside the frame: every box within x 12-948 and y 12-528.
5. No overlaps: none of the field-count pill, the `?` pill, the `book` and the `GO` stamp intersect each other or a cast body box.
6. **The `?` pill's placement is exempt only while it is settling (pop frame 268 through *268 + `motion.fps`* − 1 = 297) and while it is leaving (304-313); it is checked normally from 298 to 303** (round-1 fix — the previous wording exempted its whole 268-314 lifetime, which made the "collision rejected" fixture unfalsifiable).
7. When it runs: every frame 0-599 except an element before its pop-in settles, during a jolt (rotation only; the box checked is the un-rotated box, per `sdd-scene-2-files`'s own convention), in flight, or item 6's `?` windows.

## 7. Stills plan (MOT-5)

`npm run stills -- sdd-scene-3-archive` renders the phase ends and the last frame: **39, 119, 179, 259, 339, 399, 419, 469, 499, 599** (10 PNGs). The implementer also renders with `npx remotion still`:

| Frame | What it checks |
|---|---|
| 55 | the first folder in flight toward its parked position |
| 105 | the book's new "exactly two fields" line |
| 215 | the book jolting (the breaking fact) |
| 272 | the second folder's single finding, flagged |
| 370 | `GO` in flight |
| 440 | the second folder travelling to park (round-2 code review fix: at 410 `GO` is still landed and the trip has not departed yet) |
| 455 | the field-count pill reading "exactly three fields" |
| 480 | Chaves beside the book, settled |

Every PNG is checked for the cast, overlaps, clipping and contrast. Sheets in `docs/spikes/2026-11-13-sdd-scene-3-archive/`: the stills sheet, a phone sheet (341 CSS px, device pixel ratio 3) and, after the render, the web-MP4 sheet (frames extracted with `npx remotion ffmpeg`).

## 8. Article lines (English)

| Line | What it supports |
|---|---|
| L193-197 | archiving moves the change folder to `changes/archive/...` |
| L199 | archiving "merges the delta into `openspec/specs/...`. This is the living spec" |
| L201-205 | days later, the logistics team's second request, quoted directly |
| L207-211 | the agent proposed a delta that modifies an existing requirement |
| L215-216 | the modified requirement's own words: "exactly three fields" |
| L221 | the open questions the sentence didn't answer |
| L223 | "The impact section raised something nobody had asked about" (L224 is blank) |
| L226-227 | the breaking-change line itself: "the body no longer has 'exactly two fields'" (L228 is the closing code fence) |
| L232 | "The spec knew: it shows what the request forgot" |
| L234 (first sentence) | "the owner of the request knowingly accepted the break and recorded the reason" |
| L234 (second sentence) | the `v2`/consumer-conversation hypothesis (out of scope) |
| L236 | GO in the first round, one minor finding, the one-sentence fix, the implementation, the archive, "exactly three fields" after the split |
| L242 | "Anyone new to the project, person or agent, can read there what the API promises" |
| L264 | "the next person to pick up the work starts from `openspec/specs/...spec.md`" |

### 8.1 Words on screen

| Words | Lines |
|---|---|
| `exactly two fields` | L227, L232, L254 (the phrase and the promise it names) |
| `exactly three fields` | L215-216, L236 |
| `GO` | L124, L148 (scene 1-2's approval device) |
| `?` | L221 (the open questions device), reused here for the single finding (L236) |

## Risks / trade-offs

- **No `NO-GO` in this scene** could read as "review always says GO", if watched out of context; scene 2 (watched first, per the catalogue order) already establishes `NO-GO` exists. The video is the check at G3.
- **Two parked, unlabeled folders by the ending** could read as decorative rather than "two archived changes". The jolt-free, no-act handling (§2.3, §2.6) mirrors scene 2's unattended `NO-GO`, which the owner already judges familiar at G3.
- **Chaves never acts in this scene.** That is deliberate (§2.4): his stillness, next to the book, is the closing image, not a missing beat.
- **The registration-file conflict with PR #48 is real, not hypothetical** (§2.1): both branches add a fifth scene at the same point in `src/scenes/index.ts`, `src/Root.tsx`, `README.md`, `docs/roadmap.md` and three pinned test files. This is an ordinary merge conflict, not a defect in either change; the owner resolves it when merging the two PRs (scene 2 first).

## Migration

None for consumers: scenes are not in the package. Porting `sequence-kind.ts` only adds exports to `takes-kind.ts`, as `sdd-scene-2-files` already does.

## 9. Open questions

Same list as `proposal.md`'s "Open questions"; the owner judges each at G3.

# Proposal: sdd-scene-3-archive

## Why

Scene 1 (`sdd-scene-1-relay`, merged #41) showed why a request goes through a written proposal and an owner's `GO`. Scene 2 (`sdd-scene-2-files`, PR #48, not yet merged) opened the files themselves: the four named files, the questions, two NO-GO rounds and a GO. The article's last act (`spec-driven-development-in-practice`, English lines cited below) closes the loop: the first change is archived into the living spec (L193-199); days later a second, apparently trivial request arrives (L201-205); its proposal names an exact breaking change the living spec makes visible, something nobody asked about (L221-228); one independent review round gives GO with a single low finding, unlike scene 2's two NO-GO rounds (L236); the fix is applied and the living spec now reads "exactly three fields" where it used to read "exactly two fields" (L215-216, L236); and the scene closes on L242/L264: whoever next joins the project reads the living spec, not the code or someone's memory.

On **2026-11-13** the owner chose, at gate 0 (brain vault `10-personal/projects/brunosouzas-design-system/evidence/2026-11-13-sdd-cena-3-gate-0/`), **concept A, "archive, the breaking-change line, the living spec"**, with every recommendation:

- **q1 A:** archive as a place (the change's folder moving into `archive/`) and the living spec as a place (`specs/`, the `book` piece) before either is touched again, not a words-only version of the same beat.
- **q2:** keep the asymmetry between scene 2's two NO-GO rounds and this scene's one GO-with-one-low-finding round visible; it is the article's own point about the living spec making the second change cheaper, not accidental repetition.
- **q3:** Chaves represents "whoever joins the project" in the final frame, not Mira (excluded by CAST-6) and not a new silhouette.
- **q4 (gate 0's own answer):** keep the finding abbreviated in the storyboard description; if the real implementation shows any on-screen text for it, that text quotes the article closely (ADR 0004), never invents wording. This change goes further than gate 0 asked, as its own recommendation (design §2.3, proposal's open question 4): the finding shows no text at all, only a `?` gesture and a jolt, which needs no wording and so cannot misquote.
- **q5:** no new pieces. `book` (already in the package, closed) is the living spec; `folder` is the archive.

## What Changes

- **A new catalogue scene, `sdd-scene-3-archive`**, kind `sequence` (the kind `sdd-scene-2-files` added to `src/scenes/sequence-kind.ts`; design §2.1 explains why this branch, cut from `origin/main` before PR #48 merges, ports that same infrastructure — code and its two spec requirements — rather than depending on an unmerged branch). Neutral, one 16:9 composition `sdd-scene-3-archive-16x9`, 600 frames (20 s) at 30 fps, outro 500, final hold 100 frames. Its words are `exactly two fields`, `exactly three fields`, `GO` and `?` (no `NO-GO`: the article's second review is a single GO-round with a fixed low finding, not a rejection).
  - **First archive:** on scene 1/2's stage, the finished first change's folder travels off stage to a parked position and stays; the `book` (closed, already present beside Chaves) gains a line once the folder has parked: `exactly two fields` (the just-merged requirement, L199).
  - **Second request:** days later (a plain cut, no device beyond a beat gap), Balão speaks again, no text (as scenes 1-2 for spoken lines).
  - **Propose and the breaking line:** Visor points; a second change's folder pops in a fresh slot; the book's existing line jolts once — the proposal's impact section surfacing a break nobody asked about (L223, L226-228, L232) — decoupled from any finding on the new folder.
  - **Review and GO:** with no cast member acting (the reviewer is again another agent, off stage, as scene 2's), a `?` and a jolt flag the second folder once (the single low finding, L236), then it is fixed (the `?` goes) and a single `GO` stamp (Balão's) lands on the folder. No `NO-GO` appears anywhere in this scene.
  - **Second archive:** once `GO` has landed, the second folder travels off stage to park beside the first — the article places the archive after the implementation and before the spec's new wording (L236) — and only then does the field-count pill flip from `exactly two fields` to `exactly three fields` (the only literal on-screen text change, a verbatim article quote, L215-216 and L236).
  - **Ending:** Chaves is beside the `book` throughout (placed clear of his own body box from frame 0, so the final close-up reads without a camera move); his face settles to `done` and nothing else moves through the final hold — he is "whoever joins the project" reading the living spec.
- **No new scene kind.** A 2-step review (one finding, one GO, no rewind, no second rejection) is still a linear sequence of phases, which the existing `sequence` kind already models; a bespoke kind would duplicate it for no behavioural gain (design §2.1).
- **The catalogue registers five scenes on this branch** (the owner reconciles the exact order with `sdd-scene-2-files` when merging the two PRs, scene 2 first): this scene goes right after `sdd-request-relay` and before `circuit-breaker-topology`. Because this branch is cut before PR #48 merges, it also ports the `sequence`-kind code byte-identical to `sdd-scene-2-files`' own commit, plus its two spec requirements as this change's own ADDED (design §2.1). The registration files themselves (`src/scenes/index.ts`, `src/Root.tsx`, README, roadmap, three pinned tests) will conflict with PR #48 in the ordinary way two branches both adding a fifth scene do; this is called out as a known, expected merge step, not hidden as risk-free.

## Capabilities

### New Capabilities

none

### Modified Capabilities

- `scene-catalogue`: the `sequence` kind (ADDED, ported — see above); the archive scene's registration, cast, timing, beats, words, text size and placement, and pieces (ADDED); "State-machine and flow catalogue compatibility" is MODIFIED so its scenarios count the registered scenes at the time this change lands.
- `scene-rendering`: stills and the master and web copies for the archive scene (ADDED).

## Out of scope

- **Embedding the video on the article pages** (the site's change, `brunosouzas.com`).
- **The proof / `curl` calls** (L169-191, already out of scope for scene 2).
- **What the article does not state:** who runs the review; version numbers; the exact wording of the fixed requirement sentence beyond "exactly two/three fields"; a `v2` or a consumer conversation (L234's second sentence, explicitly a hypothetical the article raises and drops); the other recorded answers of L235 (`null` for a delivered order, no time component, fixed value) — the scene shows one wording change, not the whole delta.
- **A 4:5 cut and any sound** (SCN-3, SCN-5, as scenes 1-2).
- **New pieces or tokens, or changes to existing pieces** (q5). `book` is drawn closed throughout (its only variant); no "open book" or "Chaves holds the book" mechanism is added to `supporting-cast.ts` — see open question 1.
- **Changes to the `takes` kind's behaviour, to neutral scenes, to `MotionPath` or to the `sequence` kind's own rules** beyond porting them unmodified (design §2.1).

## Implicit requirements

- **Errors and invalid input:** the catalogue rejects a broken entry through the shared rules and the existing `sequence` checks; the archive scene's own registration requirement adds a "broken entry rejected" scenario. Stills and render commands keep their existing failure policy.
- **Limits:** every settled word at least 33 stage units (11.7 px in the 341 px column); the `?` is a symbol and exempt; words inside the frame and clear of the cast. The final hold is at least `motion.readingHold` frames.
- **No error scenario, and why:** "Existing scenes unchanged by the archive scene" is proved by the other scenes' own tests and stills; "Archive scene built from package pieces" is a static check of the scene's files.
- **Repetition and idempotency:** every frame is a pure function of its frame number (seeking test). Renders are reproducible.
- **Concurrency:** n/a.
- **Security:** n/a. No user input, no secret, no network beyond the existing font load at render time.
- **Logs and observability:** n/a beyond the existing progress lines of the stills and render commands.

## Open questions

The owner follows the recommendations and judges the scene on the video (G3). Each question has a recommended answer, which this change implements; they are the same as design §9 and the pull request's.

1. **Chaves does not hold the `book`; it sits beside him.** Holding it would need a new held-prop mechanism on `supporting-cast.ts` (only `holdsSheet`, tied to the `sheet` piece, exists), which is a shared-piece change outside this scene's own files and outside q5's "no new pieces". Recommended: keep the book beside Chaves, clear of his body box, so the ending reads as "reading" through proximity and a settled `done` face, with no camera move and no new piece parameter.
2. **No `NO-GO` anywhere in this scene.** The article's second review gives GO in its first round with one low finding fixed before the GO lands (L236), unlike scene 2's two rejections; a stray `NO-GO` would misstate the article's own asymmetry (q2). Recommended: keep — only `GO`.
3. **The breaking-change text is the field-count phrase itself** (`exactly two fields` → `exactly three fields`), not the proposal's full sentence ("Breaking for clients that reject unknown fields..."). It is short enough to read on a phone, and it is the exact words the living spec and the article both use (L215-216, L226-227, L236), so it needs no paraphrase. Recommended: keep.
4. **The single low finding stays a pure gesture** (a `?` and a jolt, no text at all, not even abbreviated) — simpler and safer than needing new wording that could misquote the article. Recommended: keep.
5. **No new `sequence`-kind variant for a one-round review.** Confirmed in design §2.1: the existing kind's phases already run once, in order, with no rewind, which is exactly this scene's shape. Recommended: keep.
6. **Registration right after `sdd-request-relay`, and the registration-file conflict with PR #48.** This change's own tests pin only this branch's five-scene order; `src/scenes/index.ts`, `src/Root.tsx`, README, roadmap and the three pinned test files will need an ordinary manual merge when the owner merges both PRs (scene 2 first, by number) — this is flagged as an expected step, not a silent risk (design §2.1). Recommended: accept; reconcile at merge time.
7. **The `sequence`-kind requirements are duplicated** in this change's own spec delta rather than only referenced, so the code has a requirement behind it however the two PRs are archived (design §2.1). Recommended: accept; whichever change archives the pair first is authoritative, the second's archive of the same requirement text is then redundant.
8. **Length 20 s (600 frames),** shorter than scene 1 (36 s) and scene 2 (29 s) — the article's own closing act (L193-264) is the shortest of the three. Recommended: accept.
9. **The review's `GO` and the owner's `GO` are drawn as one beat.** L236 (review GO) and L148/L234 (the owner's explicit approval) are compressed into a single stamp landing, the way scenes 1-2 already compress distinct article beats into one gesture. Recommended: keep the compression, but note it for the owner since this scene, unlike scene 2, has no separate review-verdict stamp to distinguish them.

## Documentation

- `README.md`: the scene in the catalogue table, its files.
- `docs/roadmap.md`: the SDD row under "Videos per article" (scene 3 of 3, epic complete pending G3).
- `docs/spikes/2026-11-13-sdd-scene-3-archive/`: the stills sheet, the phone sheet and the web-MP4 sheets.
- No ADR change: ADR 0004 and ADR 0005 already cover a neutral scene's words and reading devices; this scene adds no new device beyond scene 2's (`findingMark`, `goStamp`; it does not use `noGoStamp`).
- Brain vault after the merge (S7): `10-personal/projects/brunosouzas-design-system/` `architecture.md`, `roadmap.md` and `changelog.md`.

# Proposal: sdd-scene-2-files

## Why

Scene 1 of the article "Spec-driven development in practice" (`sdd-request-relay`, change `sdd-scene-1-relay`, merged in #41) shows, in the abstract, why a request goes through `proposal.md` and an owner's `GO` before any code. The article then shows the concrete mechanism: `openspec init` makes an `openspec/` folder (L44–L58); `/opsx:propose` writes a change of four named files (L86–L101) whose `proposal.md` lists six open questions (L103–L113); the logistics team answers them (L120); an independent review rejects the change twice, NO-GO with four findings (L126–L131) and NO-GO again over finer ones (L133); the fourth version closes both (L135); the owner's explicit decision approves it (L148); and the agent implements what the tasks say and nothing more, with `/opsx:apply` (L152–L163). The roadmap plans this as the article's second scene (AB#144).

On **2026-11-13** the owner chose **concept A, "the files, not the relay"**, with every recommendation (gate 0; brain vault `10-personal/projects/brunosouzas-design-system/evidence/2026-11-13-sdd-cena-2-gate-0/`, `index.md`, `concept-A-files-not-relay.png`, `phone-check-scene2-A4-A6.png`):

- **q1 A:** the concrete files and findings, not scene 1's relay again.
- **q2:** the scene may assume the viewer saw scene 1; it does not repeat the carry of the sheet.
- **q3:** both NO-GO rounds stay separate beats (NO-GO, NO-GO, then GO).
- **q4:** findings are gestures, never text pills; the storyboard's pills were annotation only (ADR 0005).
- **q5:** no new pieces: `folder` and `stamp` (any word) are enough.

## What Changes

- **A new scene kind, `sequence`** (`src/scenes/sequence-kind.ts`): a neutral scene whose phases run once, in order, with no takes and no rewind. It reuses the `takes` kind's cast rules (one actor at a time, emotes on face changes) and reading-hold rules, which `takes-kind.ts` now exports without changing them. Reason in design §2.1: the review rounds are consecutive versions of one change, not replays of one stage, so the `takes` kind (take 1, one rewind, take 2) does not describe them.
- **A new catalogue scene, `sdd-scene-2-files`** (kind `sequence`), neutral, one 16:9 composition `sdd-scene-2-files-16x9`: 870 frames (29 s) at 30 fps, outro 770, a final still of 100 frames. Its words are the file names `openspec/`, `proposal.md`, `design.md`, `tasks.md`, `spec.md`, the verdicts `NO-GO` and `GO`, and the `?` mark.
  - **Scene 1's stage:** Balão (the logistics team), Chaves (the developer) at the laptop, Visor (the AI agent), at scene 1's places.
  - **Init and propose:** Chaves types; the `openspec/` folder appears; Visor points and four named files come out of the folder.
  - **Questions and answers:** `proposal.md` lists six `?`; Balão answers and each gets its check.
  - **Review 1:** with no actor (the reviewer is another agent, off stage), four rows are flagged, three in `spec.md` and one in `tasks.md`, each a `?` on the row and a jolt of the file; a red `NO-GO` stamp lands on the change. The next version checks the four rows.
  - **Review 2:** two finer rows of `spec.md` are flagged; a second `NO-GO`; the fourth version checks them.
  - **Approval:** Balão holds up its `GO` stamp, which travels to the change and stays.
  - **Apply:** Visor points and six code lines (the DataWeave `if`/`else if` chain) appear; Visor `done`, `worked` emote; the final still holds.
- **The catalogue registers five scenes.** The new scene goes right after `sdd-request-relay` and before `circuit-breaker-topology`, which stays last. The assertions that list every scene change, and so do two assertions of scene 1's catalogue test and one scenario sentence of the unarchived change `sdd-scene-1-relay` that name the scene after the relay (design §2.6; question 6). Every existing scene keeps its data, compositions and stills byte for byte.

## Capabilities

### New Capabilities

none

### Modified Capabilities

- `scene-catalogue`: the `sequence` kind (ADDED); the files scene's registration, cast, timing, beats, words, text size and placement, and pieces (ADDED); "State-machine and flow catalogue compatibility" is MODIFIED so its scenarios count five scenes.
- `scene-rendering`: stills and the master and web copies for the files scene (ADDED).

## Out of scope

- **Embedding the video on the article pages** (the site's change in `brunosouzas.com`).
- **Scene 3** (what remains after delivery: the archive, the living spec, the second request), its own change.
- **The proof** (the `curl` calls in the README, L169–L191). The gate-0 sheet's frame 8 ("proof") becomes the final still with no proof device (question 5).
- **What the article does not state** (MOT-1): a third review and its verdict (the article names two reviews and the owner's approval, L124–L148); the third version (L133–L135 name the "next" and the "fourth"); version numbers; who fixed the change; what each finding says, as words; the `400`/`404` debate (L122); `config.yaml`, `specs/` and `changes/` as separate folders; Codex as a character.
- **A 4:5 cut and any sound** (SCN-3, SCN-5).
- **New pieces or tokens, or changes to existing pieces** (q5). The `book` piece is not used (design §3).
- **Changes to the `takes` kind's behaviour, to neutral scenes or to `MotionPath`.**

## Implicit requirements

- **Errors and invalid input:** the catalogue rejects a broken entry through the shared rules and the `sequence` checks ("Sequence scene kind", "Sequence cast and hold"; "SDD files registration", scenario "Broken entry rejected"). The stills and render commands keep their failure policy ("SDD files stills through existing commands", "SDD files master and web copy").
- **Limits:** every settled word at an effective size of at least 33 stage units (11.7 px in the site's 341 px column; the `?` is a symbol and exempt, so is a word in motion); every word inside the frame and clear of the cast ("SDD files text size", "SDD files text placement"). The final hold is at least `motion.readingHold` frames.
- **Repetition and idempotency:** every frame is a pure function of its frame number ("SDD files beats and timing", scenario "Seeking in any order"). Renders are reproducible.
- **Concurrency:** n/a. Frames render independently; the scene runs no concurrent process.
- **Security:** n/a. No user input, no secret, no network beyond the existing font load at render time.
- **Logs and observability:** n/a beyond the existing progress lines of the stills and render commands.

## Open questions

The owner follows the recommendations and judges the scene on the video (G3). Each question has a recommended answer, which this change implements; they are the same as design §9 and the pull request's.

1. **A new `sequence` kind** instead of the `takes` kind (design §2.1). Recommended: accept.
2. **Who gives each verdict.** The `NO-GO` stamps land with no actor (the reviewer is Codex, another agent, not a cast member); `GO` is Balão's own stamp, the owner's explicit decision (L148), not a third review (the article names none). Recommended: keep.
3. **A finding is a `?` on the flagged row plus a jolt of its file; a fix is that row's check** (design §2.3). Recommended: keep.
4. **No round number on screen.** The rounds read apart by their findings (four, then two finer ones) and the fix between them. A `1`/`2` badge would be a new reading device (ADR 0004 allows take numbers only in `takes` scenes). Recommended: no badge.
5. **Gate-0 frame 8 (the proof) folded into the final still.** Recommended: accept; the proof is out of scope.
6. **Registration right after `sdd-request-relay`.** This edits two assertions of `test/scenes/sdd-request-relay-catalogue.test.ts` and the scenario "One composition, before the topology scene" of the unarchived change `sdd-scene-1-relay` (design §2.6). Recommended: accept.
7. **The folder leaves once the four files are out**, so the files have the top of the stage. Recommended: keep.
8. **`NO-GO` in `color.state.failure`** (gate-0 q5), not the blocked orange. Recommended: keep.
9. **One typing act for `init` and `propose`**, one command line on the screen. Recommended: keep.
10. **The answer beat** (Balão answers, six checks; L120), which the gate-0 sheet skips, so the review is not read as a review of unanswered questions. Recommended: keep.
11. **Length 29 s** (870 frames), against ~26 s at gate 0 and 36 s for scene 1. Recommended: accept.
12. **Stamp sizes:** `NO-GO` is a round stamp of radius 46 scaled 1.25 (its word at 33.75); `GO` is Balão's stamp (radius 24) landing at scale 1.6 (its word at 43.2). Recommended: accept.

## Documentation

- `README.md`: the scene in the catalogue table, its files and the `sequence` kind.
- `docs/roadmap.md`: the SDD row under "Videos per article".
- `docs/spikes/2026-11-13-sdd-scene-2-files/`: the stills sheet, the phone sheet and the web-MP4 sheets.
- No ADR change: ADR 0004's amendment of 2026-11-12 (AB#144) leaves a neutral scene's words to the scene; every word here is an article word (design §8.1); the `sequence` kind applies ADR 0005's rules as the `takes` kind does.
- Brain vault after the merge (S7): `10-personal/projects/brunosouzas-design-system/` `architecture.md`, `roadmap.md` and `changelog.md`.

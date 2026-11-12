# Proposal: sdd-without-with-spec-scene (AB#144, scene 1 of 3)

## Why

The article "From a one-line request to a living spec: spec-driven development in practice" (published in English at `https://brunosouzas.com/blog/spec-driven-development-in-practice` and in Portuguese at `https://brunosouzas.com/pt/blog/spec-driven-development-in-practice`) opens with a process in time: a one-line request reaches an AI agent, which either answers the request's open questions silently inside the code or writes them down for the requester to answer and approve before it implements. AB#144 plans three neutral videos for that article; this change is the first, "without a spec, and with one".

Gate 0 is done (MOT-3). On **2026-11-12** the owner picked **concept A, "one stage, two takes"**, about 26 s (q47 A), kept the agent's fright, the rewind and the take numbers 1 and 2 as reading devices (q48 A), and chose the word `GO` on the approval stamp (q49 B). The storyboard and the decisions are in the brain vault, `10-personal/projects/brunosouzas-design-system/evidence/2026-11-12-sdd-cena-1-gate-0/` (`index.md`, `concept-A-one-stage-two-takes.png`). The design-system gaps the storyboard worked around were closed first (q50 A, AB#333, change `sdd-scene-pieces`, released in 0.12.0): Visor holds a sheet (`holdsSheet`) and faces either way (`facing`), the `questionToken` piece, and the `scene.*` stage tokens.

It is also the first language-neutral scene of the catalogue. ADR 0005 (amended 2026-11-09) makes a new scene one video for both pages, with its few words in English, and says the first neutral scene (AB#144) changes the catalogue's one-composition-per-language rule in its own change. This is that change.

## What changes

- **A neutral scene in the catalogue.** A scene can be registered as neutral: one composition per format, id `<scene>-<format>` with no language suffix, one English word table (`text.en`) and both source pages (`sources.pt`, `sources.en`), because the one video serves both pages (SCN-1). The two localised scenes keep their four compositions and their pinned tests.
- **A two-take comparison kind.** A scene of kind `takes` compares two runs of the same stage: take 1, one rewind, take 2. It is not a state machine and not a message flow (storyboards reference §2: a comparison is its own kind), so it gets its own validation: the take order, an English article line cited by every phase (MOT-1), one actor at a time (CAST-4), each emote entering on its actor's expression change and leaving before the next action (CAST-3), and nothing moving inside the final reading hold (SCN-4).
- **The scene `sdd-without-with-spec`**, 16:9 only (SCN-3), 780 frames at 30 fps (26 s), no caption (SCN-2), no audio (SCN-5), told by Visor (the AI agent, ADR 0007), a speech balloon in `color.state.caller` (the requester, not a character), the `GO` stamp (the owner's approval) and the `questionToken` (an open question). Mira is out (CAST-6). The only words on screen are `proposal.md`, `GO`, `?`, `1` and `2`, in English (SCN-1). The story, frame by frame, is the beat table of design §4:
  - **Take 1:** the request arrives holding six `?`; Visor points at the code and the six `?` sink into it, each one becoming a line of code; an error comes back from the code to the request; Visor's fright.
  - **Rewind:** the stage plays take 1 backwards to the same request.
  - **Take 2:** Visor holds a `proposal.md` sheet and the six `?` move into it as rows; Visor waits; six answers travel from the request, each ticking a row; the `GO` stamp lands on the sheet; Visor implements from the sheet, the code appears, Visor is done; the last frame is held 3 s.
- **A dashed motion path component** in `src/brand/`, drawn from the `scene.path*` tokens (AB#333 left it to the first scene that draws the path; G1 question 3).
- **Stills and render** of the one composition through the existing commands: 8 key-frame stills (one per beat plus the last frame), one master and one web copy.
- **No release by itself:** the pull request title is `feat:`, so the next release-please release carries it (Model 2); Bruno merges that release.

## Gate 0 (owner, 2026-11-12)

| Decision | Answer | Where it lands |
|---|---|---|
| q47 | A: one stage, two takes, about 26 s | the whole story; 780 frames |
| q48 | A: keep Visor's fright, the rewind and the take numbers 1 and 2 | beats 3 and 4, the take badge; marked as reading devices (MOT-1) |
| q49 | B: the stamp says `GO` | beat 6 |
| q50 | A: the design-system gaps first (AB#333, 0.12.0) | the pieces used here |
| Cast | Visor is the AI agent; the requester is a balloon in `color.state.caller`; approval is the `GO` stamp; Mira out (CAST-6) | design §3 |

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `scene-catalogue`: neutral registration (one composition per format), the `takes` kind and its validation, the catalogue holding three scenes, and the scene `sdd-without-with-spec` itself (words, beats, cast rules, layout).
- `scene-rendering`: stills and the master and web copy of the new scene.
- `motion-components`: the dashed motion path.

## Out of scope

- Scenes 2 and 3 of AB#144 (their own changes, each from its own gate 0).
- A 4:5 cut (SCN-3: on demand, when a post needs it); a Portuguese or second English composition.
- A caption or any word beyond `proposal.md`, `GO`, `?`, `1`, `2`; audio.
- Outcomes the article does not show in its opening (MOT-1): a second error in take 2, the review rounds and the NO-GO verdicts (L124–L135), the leading-zero scenario, the archive; the error in take 1 is shown only as "an error comes back to the request", never as a status code.
- Mira, a human developer character, or any new character (CAST-1, CAST-6); a new emote or expression.
- Converting the existing scenes to neutral, or changing their data, compositions or pinned tests (the only edits allowed are assertions that list every registered scene).
- Embedding the video on the site (a change in brunosouzas.com, WEB-1, WEB-2).
- Changing a piece, a token or `facing` usage beyond what design §3 lists; the motion skill's SCN-1 check text (a kit change after this merge).

## Questions for gate 1

Each has a recommended answer; the spec is written as recommended. Details in design §2.

1. **Neutral composition id.** `sdd-without-with-spec-16x9`, with no language suffix (recommended), or `sdd-without-with-spec-16x9-en`?
2. **Scene kind.** A `takes` kind with its own rules (recommended), or model the scene as a `flow` with copies and routes and add the cast rules there?
3. **Dashed path.** A shared `MotionPath` component in `src/brand/` (recommended: scenes 2 and 3 will need it), or drawn inside this scene only?
4. **Visor's `facing`.** Not used (recommended: facing right, the held sheet is on the requester's side and the pointing hand on the code's side), or Visor turns left to the balloon when it "stops and asks" (the sheet then sits on the far side)?
5. **The sheet's first row.** The held sheet appears with one heading row, the article's `## Open Questions` (L106), before the six question rows (recommended: `holdsSheet` needs at least one row, so the page cannot appear empty), or the page appears with the first question?
6. **How the requester answers.** Six caller-coloured message tokens travel from the balloon, each ticking one row on arrival (recommended: the answers read as the requester's), or the six checks just appear (they may read as Visor ticking its own list)?
7. **Final hold.** 3 s, the minimum of SCN-4, keeping the 26 s of gate 0 (recommended), or 4 s (27 s)?
8. **Article lines.** Beats cite the two opening sections (L18–L40) first and, where gate 0 did, the later lines that show the same step (L72–L152) (recommended), or only the two opening sections?
9. **Rewind.** The object layer (tokens, code lines, paths, the error arrow) plays take 1 backwards in 34 frames while Visor resets at once (recommended), or a cut to take 2 with only the rewind mark?
10. **Emote sides.** `problem` left of the head in take 1, `worked` above right of the head in take 2, because the held sheet fills the left (recommended), or both on one side?

## Implicit requirements

- **Errors and invalid input:** requirement. The catalogue rejects a neutral scene with a `pt` text table, a language other than `en`, or a missing `pt` or `en` source; a `takes` scene whose takes are out of order, a phase without an article line, two actors acting at once, an emote not on an expression change, two emotes at once, an emote still visible at the next action, or movement inside the reading hold. Each problem names the scene and the offending item. The stills and render commands keep their invocation errors unchanged.
- **Limits:** requirement. 16:9 only; 780 frames; the outro at 690 leaves exactly `motion.readingHold` (90) frames; six questions; at most 8 rows on the held sheet (the piece's limit; this scene uses 7).
- **Repetition and idempotency:** requirement. Every frame is a pure function of the frame number (no accumulated state), so stills and renders are reproducible and Studio can seek in any order; a second render overwrites the first, as today.
- **Concurrency:** n/a. One render at a time; the frame functions are pure.
- **Security:** n/a. No input from outside the repository, no new dependency, no network beyond the existing font load at render time.
- **Logs and observability:** n/a beyond today: the stills and render commands print their paths and progress lines as they do for the other scenes.

## Documentation

- `README.md`, "How a scene is built": the catalogue table gains the scene; neutral registration (one composition per format, `text.en`, both sources); the `takes` kind and its checks; the `MotionPath` component.
- `docs/roadmap.md`: the AB#144 row says scene 1 is implemented, owner media gate pending.
- ADR: none. ADR 0005's consequence ("the first neutral scene (AB#144) changes that rule in its own change") is what this change does; it contradicts no ADR.
- Evidence for gate 1: the stills' contact sheet in `docs/spikes/2026-11-12-sdd-without-with-spec/` (small PNGs only).
- After the merge, outside this repository: the brain vault's project notes (`architecture.md`, `roadmap.md`, `changelog.md`), and the motion skill's SCN-1 check ("until AB#144 the catalogue still registers a composition per language") in the kit.

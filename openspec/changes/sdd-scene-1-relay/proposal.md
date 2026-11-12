# Proposal: sdd-scene-1-relay

## Why

The article "Spec-driven development in practice" opens with a one-line request from the logistics team (L20–L22) that leaves six questions open (L24, L106–L113). Without a spec, the developer and the AI agent answer them silently inside the code, and the logistics team finds out which answer was picked "when the first error came back" (L26, L122). With a spec, the agent lists the open questions in `proposal.md` instead of choosing (L72, L80), the people who can answer them do (L116–L120), and "the person who approves the spec decides" (L34) before the agent implements (L32, L152). The roadmap plans this as the article's first scene (AB#144).

PR #41 held an earlier scene 1 whose requester was a floating speech balloon, so it was not clear who spoke to whom. With the supporting characters of 0.13.0 (Balão, the requester and approver, and Chaves, the developer; AB#337), the owner redid gate 0 and on **2026-11-12** picked **concept A, "one stage, two takes, a relay"** with every recommendation (q78 A to q81 A). Evidence: brain vault `10-personal/projects/brunosouzas-design-system/evidence/2026-11-12-sdd-cena-1-gate-0-v2/` (`index.md`, `concept-A-two-takes-relay.png`, `phone-check-A1-A7.png`); prototype `~/.hermes/cache/scratch/ab144-scene1-v2/` (`lib.ts`, `stage.ts`, `concept-a.ts`). The pick came with three decisions:

- **q79 A, the fright is Balão's.** The error comes back to the logistics team (L122), so Balão gets the `failed` face and the `problem` emote. This replaces the agent's fright of the old concept (q48 A).
- **q80 A, a larger sheet.** The scene draws `proposal.md` large enough to read on a phone: at least the circuit-breaker topology scene's text rule (about 11.7 px in the site's 341 px column), and the same for `GO` and the take numbers.
- **q81 A, then the agent fails too.** After Balão's fright, Visor's face turns `failed`, one actor at a time (CAST-4).

Choices approved earlier still stand: the rewind and the take numbers `1` and `2` (q48 A), the stamp's word `GO` (q49 B), a neutral video with English words only, 16:9 only, no sound, and a length that follows the message.

## What Changes

- **The old scene 1 is removed from this branch.** Its code, tests, evidence and archived change (`sdd-without-with-spec-scene`) never reached `main`; the infrastructure it introduced (neutral scenes, the `takes` kind, `MotionPath`) reached `main` through PR #45. This change replaces it.
- **A new catalogue scene, `sdd-request-relay`.** A two-take scene (kind `takes`), neutral, with one 16:9 composition `sdd-request-relay-16x9`: 1080 frames (36 s) at 30 fps, outro at 980, a final still of 100 frames. Its words are `proposal.md`, `GO`, `?` and the take numbers.
  - **One stage, left to right:** Balão (the logistics team), Chaves (the developer) at a shared laptop, Visor (the AI agent) on the other side of it. Same scale, one ground line.
  - **Take 1:** Balão speaks to Chaves and six `?` ride along to him; Chaves turns to the laptop and types the request, and the `?` go into the screen with it; Visor writes the code alone and the `?` sink into it; it works (Visor `done`). The first error comes back from the code to Balão: Balão's fright (`failed`, `problem` emote), then Visor turns `failed`.
  - **The rewind:** a rewind mark; take 1 plays backwards, the cast included; badge `1` becomes `2`.
  - **Take 2:** the same request and the same relay. Visor lists the `?` on `proposal.md` instead of writing code; Chaves takes the sheet to Balão; Balão answers the six `?` and stamps `GO`; Chaves brings the approved sheet back; Visor implements from it (`done`, `worked` emote), and the final still holds.
- **`withSansFamily` moves to `src/brand/`.** The circuit-breaker topology scene's fix for SVG words in Remotion (Source Sans 3 is registered as "Source Sans Three") is needed by this scene too, so it moves to a shared module; the topology scene re-exports it, and its stills stay byte-identical.
- **The `takes` kind accepts `balao` and `chaves` as actors,** so the cast checks (CAST-3, CAST-4) cover the supporting characters.
- **The catalogue registers four scenes.** The new scene is registered before `circuit-breaker-topology`; the assertions that list every scene are updated. Every existing scene keeps its data, compositions and stills byte for byte.

## Capabilities

### New Capabilities

none

### Modified Capabilities

- `scene-catalogue`: the relay scene's registration, cast, words, text size and placement, beats and timing (take 1, error, rewind, list, carry, answer, return, implementation, final still), and pieces (ADDED). "State-machine and flow catalogue compatibility" is MODIFIED so its scenarios count four scenes.
- `scene-rendering`: stills and the master and web copies for the relay scene (ADDED).
- `motion-components`: the shared sans-family mapping for SVG words in a video frame (ADDED).

## Out of scope

- **Embedding the video on the article pages.** That is the site's change in `brunosouzas.com` (web copy, poster, text description; WEB-1, WEB-2). The pages' static images stay (MOT-2).
- **Scenes 2 and 3 of the article** (the stages and files; what remains after delivery), which the roadmap plans as their own changes.
- **A 4:5 cut** (SCN-3) and **any sound** (SCN-5).
- **New pieces or tokens, or changes to existing pieces.** The scene uses Balão, Chaves, Visor, `keyboard`, `questionToken`, `sheet`, `stamp` and the others as 0.13.0 ships them.
- **Outcomes the article only implies** (MOT-1): which status code the take-1 code picked; the debate between `400` and `404` (L122); the four commits of the change and the review rounds (L124–L148); the `curl` proof (L169). The scene shows one error coming back, one list, one approval and one implementation.
- **Changes to the `takes` checks themselves** beyond the two actor names, to neutral scenes or to `MotionPath`.

## Implicit requirements

- **Errors and invalid input:** the catalogue rejects a broken entry through the shared rules and the `takes` checks ("SDD relay registration", scenario "Broken entry rejected"; "SDD relay cast timing", scenario "Overlapping acts of the supporting cast"). The stills and render commands keep their failure policy ("SDD relay stills through existing commands", "SDD relay master and web copy").
- **Limits:** every word except the `?` mark at an effective size of at least 33 stage units (11.7 px in the site's 341 px column); the take numbers at 36 ("SDD relay text size"). Every word stays inside the frame and clear of the cast ("SDD relay text placement"). The final hold is at least `motion.readingHold` frames.
- **Repetition and idempotency:** every frame is a pure function of its frame number ("SDD relay beats and timing", scenario "Seeking in any order"). Renders are reproducible.
- **Concurrency:** n/a. Frames render independently; the scene runs no concurrent process.
- **Security:** n/a. No user input, no secret, no network beyond the existing font load at render time.
- **Logs and observability:** n/a beyond the existing progress lines of the stills and render commands.

## Documentation

- `README.md`: the scene in the catalogue table and its files; the shared sans-family mapping.
- `docs/roadmap.md`: the SDD row under "Videos per article".
- `docs/spikes/2026-11-12-sdd-request-relay/`: the stills sheet, the phone sheet and the web-MP4 sheets.
- No ADR change: ADR 0004's amendment of 2026-11-12 (AB#144) leaves the words and devices of a scene to that scene, and its amendment for AB#334 allows the take numbers in every `takes` scene; `GO` is the reading device the owner approved (q49 B), recorded in design §5.
- Brain vault after the merge (S7): `10-personal/projects/brunosouzas-design-system/` `architecture.md`, `roadmap.md` and `changelog.md`.

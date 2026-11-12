# Proposal: circuit-breaker-topology-scene

## Why

The article "Circuit Breaker in MuleSoft: When Retry Makes Things Worse" argues one comparison: retry alone turns a slow payment service into an outage (20 requests become 60 backend calls), while a circuit breaker stops calling it after 5 (L23–L30). The catalogue's `circuit-breaker-states` scene shows the state machine only, not that comparison. The owner wants a scene that shows the traffic itself, and this scene replaces the state-machine scene on the article page.

Gate 0 (MOT-3): on **2026-11-12** the owner picked **concept A, "one topology, two takes"** with all recommendations (q68 A, q69 A, q70 A). Evidence: brain vault `10-personal/projects/brunosouzas-design-system/evidence/2026-11-12-circuit-breaker-gate-0/` (`index.md`, `concept-A-two-takes.png`); prototype `~/.hermes/cache/scratch/ab334-cb-scene/` (`lib.ts`, `concept-a.ts`). The pick came with corrections:

- **Much larger text.** On the sheet, labels were about 5–6 px on a phone. This change sets a minimum size so they read on a 360 px phone, where the site's column shows the video 328 px wide, and shortens words where needed.
- **A neutral `Payment` label.** Red stays on failing elements only (ADR 0006 colour meaning).
- **A compressed `resetTimeout` clock** of about 4 s, labelled `resetTimeout 10s` (q69 A).
- **The customer's message in OPEN.** The customer side shows `payment temporarily unavailable` (L71) beside `CIRCUIT-BREAKER:OPEN` (q70 A).
- **Also approved:** numbered takes with a rewind mark, a sliding window of N = 5 with an 80% threshold, one test call in HALF_OPEN with no queue, no sound, one neutral 16:9 composition for both pages, and English words only (SCN-1).

## What Changes

- **A new catalogue scene, `circuit-breaker-topology`.** It is a two-take scene (kind `takes`), neutral, with one 16:9 composition `circuit-breaker-topology-16x9`. It runs 1920 frames (64 s) at 30 fps, then holds a 120-frame final still. It has no character, no caption and no sound.
  - **Take 1, retry only.** Checkout calls the payment service directly with `retry ×3`. 20 requests make 60 backend calls, and the service's three lights go red one by one.
  - **The rewind.** A rewind mark, take 1 played backwards, then badge `2`.
  - **Take 2, the breaker wraps the call.** `circuit-breaker:execute` drops onto the line.
    - **CLOSED:** five timeouts fill a sliding window of 5 and push the failure-rate bar past the 80% tick. At 4 of 5 (80%) the circuit stays CLOSED.
    - **OPEN:** 15 requests fail fast with `CIRCUIT-BREAKER:OPEN` and `payment temporarily unavailable`, and the service gets no traffic. The counter shows 5 backend calls against a ghost 60. A `resetTimeout 10s` clock runs.
    - **HALF_OPEN:** one test call times out, so the circuit is OPEN again. A later test call returns `200`, so the circuit is CLOSED.
    - **CLOSED again:** one timeout is noise (20%, under the tick), and a `400` (business error) does not count. The window slides back to five successes, and the healthy end holds still.
- **The failure-rate bar, a new shared component.** It draws a track, a fill for the failure rate and a threshold tick, in new files in `src/brand/`.
- **`PositionedToken` gains an optional `radius`.** It defaults to today's 17, so `publish-subscribe` is unchanged; this scene draws its tokens at 10.
- **The catalogue, stills and render commands accept the new scene,** with the shared rules unchanged. Every existing scene (`circuit-breaker-states`, `publish-subscribe`, and `sdd-without-with-spec` once PR #41 is merged) keeps its data, compositions and stills byte for byte.

**This change depends on PR #41 (AB#144, `sdd-without-with-spec-scene`).** That PR adds neutral scenes, the `takes` scene kind and `MotionPath`. It is implemented and waits for the owner's media gate; it is not on `main`. This change reuses those three things and does not redefine them. Implementation starts after #41 is merged, on a branch rebased onto that `main`. Its spec deltas ADD requirements under names #41 does not use. They modify only #41's "State-machine and flow catalogue compatibility", whose "three scenes" a fourth scene makes false, so the two archives merge cleanly in that order. See design §2.1 and G1 question 1.

## Capabilities

### New Capabilities

none

### Modified Capabilities

- `scene-catalogue`: the topology scene's registration, words, text size and placement, colour roles, beats and timing (take 1, rewind, the breaker's states, the window, the final still), layout and layers (ADDED). "State-machine and flow catalogue compatibility" is MODIFIED (as #41 leaves it) so that it lists every registered scene, not three.
- `scene-rendering`: stills and the master and web copies for the topology scene (ADDED).
- `motion-components`: the failure-rate bar and an optional token radius on `PositionedToken` (ADDED).

## Out of scope

- **Embedding the video on the article page** and replacing the state-machine video there. That is the site's change in `brunosouzas.com` (AB#142: web copy, poster, text description, WEB-1, WEB-2). The page's static diagrams stay (MOT-2).
- **Removing or changing `circuit-breaker-states`.** It stays in the package and the catalogue unchanged, with its 4:5 and per-language compositions.
- **A 4:5 cut** (SCN-3, only on demand) and **any sound** (SCN-5).
- **Characters or emotes.** The scene uses pieces only, as approved at gate 0. The supporting characters of AB#337 are a parallel change, and this scene uses none of them.
- **Outcomes the article only implies** (MOT-1):
  - a retry that succeeds in take 1;
  - more than one test call in HALF_OPEN, or a queue of them;
  - the replicas and the CloudHub 2.0 race (L97–L127);
  - the latency figures (~1929 ms against ~139 ms, +5.6 ms);
  - the Choice mapping of `CIRCUIT-BREAKER:OPEN` to an HTTP status, and the 503 of the demo app.
- **Changes to the `takes` kind, neutral scenes or `MotionPath`** (PR #41). This change only uses them. The `TakesDevice` union is not extended; the reading choices are listed in design §5. The scene's own timeline type extends `TakesTimeline` (design §2.10).
- **A new piece in `src/pieces/`, or a change to an existing piece or token.** The one shared-component change is the optional token radius.

## Implicit requirements

- **Errors and invalid input:** the catalogue rejects a broken entry through the shared rules and #41's `takes` checks. The failure-rate bar rejects a rate outside [0, 1], a threshold outside (0, 1) and non-finite sizes with a `RangeError` ("Failure-rate bar"). The stills and render commands keep their existing failure policy ("Topology stills through existing commands", "Topology master and web copy").
- **Limits:** text at least 33 stage units (66 px in the composition, 11.3 px in the site's 328 px column), and 36 for state names, the take number and the counter numbers ("Topology text size"). Every text box stays inside the frame and clear of the others ("Topology text placement"). The final hold is at least `motion.readingHold` frames.
- **Repetition and idempotency:** every frame is a pure function of its frame number, with no accumulated state ("Topology beats and timing", seeking in any order). Renders are reproducible.
- **Concurrency:** n/a. A video renders frames independently; the scene runs no concurrent process.
- **Security:** n/a. No input from users, no network beyond the existing font load at render time, and no secret.
- **Logs and observability:** n/a beyond the existing progress lines of the stills and render commands.

## Documentation

- `README.md`: the scene in the catalogue table, the failure-rate bar, and the scene's files.
- `docs/roadmap.md`: the circuit-breaker row under "Videos per article" (the topology scene, AB#334, replaces the state-machine scene on the page; `circuit-breaker-states` stays in the package).
- `docs/adr/0004-scenes-illustrate-published-articles.md`: an amendment for the take numbers `1` and `2`. PR #41's amendment allows them for the SDD scene only (G1 question 2).
- `docs/spikes/2026-11-12-circuit-breaker-topology/`: the stills, the phone-size sheet and the web-MP4 sheet.
- Brain vault after the merge (S7): `10-personal/projects/brunosouzas-design-system/` `architecture.md`, `roadmap.md` and `changelog.md`.

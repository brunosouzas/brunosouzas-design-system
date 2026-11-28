# Proposal: idempotent-receiver-mule-scene (SW-160)

## Why

The wiki page "Idempotent Receiver in Mule" (`brunosouzas-content` at `0162e3a`, `writing/integration-patterns-in-mulesoft/idempotent-receiver-in-mulesoft.{en,pt}.md`) has two halves: the pattern as the book describes it, now a video (`idempotent-receiver-book`, #53), and the pattern as Mule implements it. In Mule the Idempotent Message Validator "stores the IDs in an object store and throws `MULE:DUPLICATE_MESSAGE` for repeats" (L36), and the page's caveat is its trap: "The validator stores the ID when it accepts the message, before the rest of the flow runs, and does not remove it if the flow fails afterward" (L109); "The first attempt answers 500, the `orderId` stays in the store, the retry gets 409 and the statement ends with zero charges: the order is never charged. It is a quieter error than a double charge, because the retry got back a 409" (L122). The roadmap plans two neutral videos for every EIP page; this is the second of card SW-160, and from it comes the reusable Mule scene type.

At gate 0, on **2026-11-27**, the owner chose **concept B, "one stage, two takes", for both scene types**, with every recommendation (pull request #53; `docs/spikes/2026-11-27-idempotent-receiver-storyboard/`, `B-mule.png`, README section "Owner's pick"). For the Mule scene that means: Balão is the client (q2); Balão reacts with `done` and `worked` on 200, `failed` and `problem` on 500, and not at all on 409 (q3); the published diagram's component names on screen at 33 units, no new Mule glyphs (q5); and this scene in its own change (q6).

## What Changes

- **A new catalogue scene, `idempotent-receiver-mule`.** A two-take scene (kind `takes`), neutral, one 16:9 composition `idempotent-receiver-mule-16x9`: 1350 frames (45 s) at 30 fps, outro 1250, a final still of 100 frames. Its length follows the owner's rule of 2026-11-27, understanding before length (design §2.6). Its words are the charge-flow diagram's (L42): `HTTP Listener`, `Idempotent Message Validator`, `Simulated charge`, `orderId`, `200`, `409`, `500`; the statement's counts `0` and `1` (L44, L122); the `?`; and the take numbers. Balão is the one cast member.
  - **One stage, left to right:** Balão (the client), the HTTP Listener, the Idempotent Message Validator with its object store under it, the Simulated charge with its statement of charges under it.
  - **Take 1:** Balão asks for the charge of an order; the request passes the listener; the validator looks up its store (`?`: not there), stores the `orderId` and lets the request through; the charge goes through (one statement row, count 1) and `200` comes back. Balão asks again: the validator finds the `orderId` (the store comes into focus), the request turns orange and `409` comes back. Still one charge.
  - **The rewind:** take 1 plays backwards; badge `1` becomes `2`.
  - **Take 2:** the same request and lookup; the validator stores the `orderId`; storing the charge fails (the request turns red) and `500` comes back; the `orderId` stays in the store. Balão asks again and gets the same `409`. The statement ends at `0`; take 1's `1` fades in beside it, and the final still holds.
- **The EIP Mule scene type,** `src/scenes/eip-mule.ts`: a component box with the diagram's name at 33, a token's rest above a component, and the client (Balão facing the flow), which every Mule scene draws (design §2.1). It reuses the book scene type's token and store (`src/scenes/eip-book.ts`).
- **The catalogue registers eight scenes.** The new scene is registered after `idempotent-receiver-book` and before `circuit-breaker-topology`, which stays last; the assertions that list every scene are updated. Every existing scene keeps its data, compositions and stills.

## Capabilities

### New Capabilities

none

### Modified Capabilities

- `scene-catalogue`: the Mule scene's registration, reading devices and cast, beats and timing (take 1, rewind, take 2, the final still), words, text size, layout and placement, and pieces (ADDED); "State-machine and flow catalogue compatibility" is MODIFIED so its scenarios count eight scenes; the `available scenes:` clause moves from "Seven scenes" to the new "Eight scenes".
- `scene-rendering`: stills and the master and web copies for the Mule scene (ADDED).

## Out of scope

- **What the page says beyond the trap of L109 and L122** (MOT-1), as the card and gate 0 left out: removing the ID (L128), a charge after the 409, exactly-once, the Anypoint MQ path as if it were a run (L124 says it is not tested), the provider failure after a successful charge (L122, second sentence), the default `correlationId` key and the "before" endpoint (L36, L92–L105), the time to live and clusters (L133–L137).
- **Embedding the video on the wiki page.** That is the site's change in `brunosouzas.com` (WEB-1, WEB-2).
- **A 4:5 cut** (SCN-3) and **any sound** (SCN-5).
- **New pieces or tokens.** The scene uses `diagramBox`, `storeNode`, `sheet`, `countBadge`, `messageArrow`, `questionToken`, `balao`, `emote` and `uiIcon` as the package ships them (0.15.0).
- **A generic Mule stage and frame builder** (design §2.1, §7 point 6).
- **Changes to the `takes` checks.** The scene uses the devices the book scene added (`lookupMark`, `ghost`, `matchFocus`).

## Implicit requirements

- **Errors and invalid input:** the catalogue rejects a broken entry through the shared rules and the `takes` checks ("Idempotent Receiver Mule registration", scenario "Broken entry rejected"; "... reading devices and cast", scenario "Bad emote rejected"). The stills and render commands keep their failure policy ("Idempotent Receiver Mule stills through existing commands", "Idempotent Receiver Mule master and web copy").
- **Limits:** every word at an effective size of at least 33 stage units, and every ID, code, count and take number at least 36 (11.7 px and 12.8 px in the site's 341 px column); the `?` is a symbol, exempt ("Idempotent Receiver Mule text size"). Every word stays inside the frame less 12 units and clear of the others ("Idempotent Receiver Mule text placement"). The final hold is at least `motion.readingHold` frames.
- **Repetition and idempotency:** every frame is a pure function of its frame number ("Idempotent Receiver Mule beats and timing", scenario "Seeking in any order"). Renders are reproducible.
- **Concurrency:** n/a. Frames render independently; the scene runs no concurrent process.
- **Security:** n/a. No user input, no secret, no network beyond the existing font load at render time.
- **Logs and observability:** n/a beyond the existing progress lines of the stills and render commands.
- **Structural requirements without a separate error scenario:** "Idempotent Receiver Mule layout", "Idempotent Receiver Mule built from package pieces" and "Existing scenes unchanged by the Mule scene" are checked by exact equality against the expected values (layout values and layer lists, file list and patterns, the other scenes' tests and stills); any deviation fails that equality, so a separate negative fixture would only repeat it.

## Documentation

- `README.md`: the scene in the catalogue table, its commands and files; the Mule scene type.
- `docs/roadmap.md`: the Idempotent Receiver row under "Videos per article".
- `docs/spikes/2026-11-28-idempotent-receiver-mule/`: the stills sheet (gate 1), then the web-MP4 sheets.
- No ADR change: ADR 0004's amendments of 2026-11-12 leave a neutral scene's words and devices to the scene and allow the take numbers in every `takes` scene; ADR 0007 names Balão as the requester acting; the devices are the book scene's, approved at its gates.
- Brain vault after the merge (S7): `10-personal/projects/brunosouzas-design-system/` `changelog.md` and `roadmap.md`.

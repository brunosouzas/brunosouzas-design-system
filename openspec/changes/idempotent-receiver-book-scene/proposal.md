# Proposal: idempotent-receiver-book-scene (SW-160)

## Why

The wiki page "Idempotent Receiver in Mule" (`brunosouzas-content` at `0162e3a`, `writing/integration-patterns-in-mulesoft/idempotent-receiver-in-mulesoft.{en,pt}.md`) explains the pattern as the book describes it: "even when the sender sends a message only once, the receiver may receive it more than once"; the book "calls a message idempotent when it produces the same effect whether it is received once or several times"; "the receiver keeps the ID of each processed message and ignores any message that arrives with a known ID" (L28). Its book diagram shows the Sender sending order 42 once, the channel delivering it twice, and the receiver looking up the processed IDs, processing and storing on the first delivery and ignoring the second (L30–L32). The roadmap plans two neutral videos for every EIP page, the pattern as the book describes it and as Mule implements it, and this card (SW-160, formerly AB#145) is the first: from it come the two reusable scene types, so the next pages are mostly data.

At gate 0, on **2026-11-27**, the owner chose **concept B, "one stage, two takes", for both scene types**, with every recommendation (pull request #53; `docs/spikes/2026-11-27-idempotent-receiver-storyboard/`, `B-book.png`, README section "Owner's pick"). For the book scene that means: take 1, the channel delivers order 42 once; a rewind; take 2, the same order, sent once, is delivered twice; both takes end with the same effect. The marked reading devices were approved with it: the `?` at each lookup, take 1 as the definition's first half, and take 1's result faded beside take 2's. Question 6 sends the book scene's spec to this branch and the Mule scene to its own change; question 4 (an empty store) was delivered first by SW-248 (pull request #54, merged in `d26f254`).

## What Changes

- **A new catalogue scene, `idempotent-receiver-book`.** A two-take scene (kind `takes`), neutral, one 16:9 composition `idempotent-receiver-book-16x9`: 900 frames (30 s) at 30 fps, outro 800, a final still of 100 frames. Its length follows the owner's rule of 2026-11-27, understanding before length (design §2.8). Its words are `Sender`, `42`, the `?` mark and the take numbers. No cast.
  - **One stage, left to right, on one lane:** the Sender (a pill in the caller's colour), the point-to-point channel and the Idempotent Receiver (EIP icons), the processed IDs (an empty store) under the receiver, the outcomes on the right.
  - **Take 1:** the Sender sends order 42 into the channel; the channel delivers it once; the receiver looks up its store (`?`: not there), processes the message (green, checked) and stores 42.
  - **The rewind:** a rewind mark; take 1 plays backwards; badge `1` becomes `2`.
  - **Take 2:** the same order, sent once; a second copy appears in the channel; the first delivery is processed and stored as in take 1; the second reaches the receiver, the lookup finds 42 (the store comes into focus), and the duplicate is set aside (orange). Take 1's result fades in beside take 2's: one processed message in both, and the final still holds.
- **The EIP book scene type,** `src/scenes/eip-book.ts`: the lane, the text sizes, the message token, an icon placed on the lane, and the store empty or holding an ID, which every book scene draws (design §2.1). The next book scene still writes its own timeline, layout, frame and stage logic, using this scene as its model; whether a generic builder should come now or with the second book scene is an open point for the owner (design §7, point 4). It draws through the package's pieces.
- **The `takes` kind's reading devices** gain `lookupMark`, `ghost` and `matchFocus` (design §2.5): the first two approved at gate 0, the third new for G1.
- **The catalogue registers seven scenes.** The new scene is registered after `sdd-scene-3-archive` and before `circuit-breaker-topology`, which stays last; the assertions that list every scene are updated. Every existing scene keeps its data, compositions and stills.

## Capabilities

### New Capabilities

none

### Modified Capabilities

- `scene-catalogue`: the book scene's registration, reading devices, beats and timing (take 1, rewind, take 2's two deliveries, the duplicate ignored, the final still), words, text size, layout and placement, and pieces (ADDED); "State-machine and flow catalogue compatibility" is MODIFIED so its scenarios count seven scenes; the `available scenes:` clause moves from "Five scenes" and "Six scenes" to the new "Seven scenes", since the line now lists seven.
- `scene-rendering`: stills and the master and web copies for the book scene (ADDED).

## Out of scope

- **The Mule scene** (the trap of L109 and L122): its own change, after this one (gate 0, question 6).
- **Embedding the video on the wiki pages.** That is the site's change in `brunosouzas.com` (web copy, poster, text description; WEB-1, WEB-2). The pages keep their book diagram (MOT-2).
- **A 4:5 cut** (SCN-3) and **any sound** (SCN-5).
- **New pieces or tokens.** The scene uses `eipIcon`, `diagramBox`, `storeNode` (empty since SW-248), `messageArrow`, `checkBadge`, `questionToken`, `countBadge` and `uiIcon` as the package ships them.
- **What the page says beyond the book's example** (MOT-1): the book's second path (an idempotent message, L28), Mule, the key, the time to live, the store's persistence and the trap (L36–L141). The scene shows one sender, one order, two deliveries and one processing.
- **Changes to the `takes` checks** beyond the two device names.

## Implicit requirements

- **Errors and invalid input:** the catalogue rejects a broken entry through the shared rules and the `takes` checks ("Idempotent Receiver book registration", scenario "Broken entry rejected"). The stills and render commands keep their failure policy ("Idempotent Receiver book stills through existing commands", "Idempotent Receiver book master and web copy").
- **Limits:** every word at an effective size of at least 33 stage units and every ID and take number at least 36 (11.7 px and 12.8 px in the site's 341 px column); the `?` is a symbol, exempt ("Idempotent Receiver book text size"). Every word stays inside the frame less 12 units and clear of the others ("Idempotent Receiver book text placement"). The final hold is at least `motion.readingHold` frames.
- **Repetition and idempotency:** every frame is a pure function of its frame number ("Idempotent Receiver book beats and timing", scenario "Seeking in any order"). Renders are reproducible.
- **Concurrency:** n/a. Frames render independently; the scene runs no concurrent process.
- **Security:** n/a. No user input, no secret, no network beyond the existing font load at render time.
- **Logs and observability:** n/a beyond the existing progress lines of the stills and render commands.
- **Structural requirements without a separate error scenario:** "Idempotent Receiver book reading devices", "Idempotent Receiver book layout", "Idempotent Receiver book built from package pieces" and "Existing scenes unchanged by the book scene" are checked by exact equality against the expected values (device list, layout values, file list and patterns, the other scenes' tests, diff and stills); any deviation fails that equality, so a separate negative fixture would only repeat it.

## Documentation

- `README.md`: the scene in the catalogue table and its files; the book scene type.
- `docs/roadmap.md`: the Idempotent Receiver row under "Videos per article".
- `docs/spikes/2026-11-27-idempotent-receiver-book/`: the stills sheet (gate 1), then the phone sheet and the web-MP4 sheets.
- No ADR change: ADR 0004's amendments of 2026-11-12 leave a neutral scene's words and devices to the scene and allow the take numbers in every `takes` scene; the two new devices are the ones the owner approved at gate 0, recorded in design §2.5.
- Brain vault after the merge (S7): `10-personal/projects/brunosouzas-design-system/` `architecture.md`, `roadmap.md` and `changelog.md`.

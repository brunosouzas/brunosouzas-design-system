# Idempotent Receiver videos: gate 0 storyboard (SW-160)

Gate 0 of card SW-160 (EIP videos: Idempotent Receiver, book + Mule): three concepts that differ in structure, each drawn for both reusable scene types the series will reuse, the **book** scene (EIP icons) and the **Mule** scene (components). Rendered on 2026-11-27 from branch `feature/sw-160-idempotent-receiver-storyboard`. No spec and no scene code exist yet: the owner picks or mixes the concepts first (ADR 0005, motion MOT-3).

Source of every beat: `writing/integration-patterns-in-mulesoft/idempotent-receiver-in-mulesoft.{en,pt}.md` in `brunosouzas-content` at commit `0162e3a` (the Portuguese page has the same line numbers; the caption lines of the card are 109 and 122). Each frame on the sheets carries its beat and its line.

| Sheet | Concept | Scene type |
|---|---|---|
| [`B-book.png`](B-book.png) | **B, one stage, two takes (recommended)** | book |
| [`B-mule.png`](B-mule.png) | **B, one stage, two takes (recommended)** | Mule |
| [`A-book.png`](A-book.png) | A, the diagram comes alive | book |
| [`A-mule.png`](A-mule.png) | A, the diagram comes alive | Mule |
| [`C-book.png`](C-book.png) | C, the ID tag (close-up) | book |
| [`C-mule.png`](C-mule.png) | C, the ID tag (close-up) | Mule |

## The concepts

**B, one stage, two takes (recommended).** The `takes` scene kind the topology and SDD scenes already use: one stage played twice, a rewind, take numbers.

- *Book:* take 1, the channel delivers order 42 once; take 2, it delivers it twice. Both takes end with the same effect (one processed message, 42 stored once), which is the book's own definition of an idempotent message (L28). About 24 s.
- *Mule:* the client sends the same order twice in both takes. Take 1: stored, charged, 200, then 409, statement at 1 (L44, L95, L159). Take 2: stored, the charge fails, 500, then the same 409, statement at 0 (L109, L122). The 409 looks the same in both takes; only the statement differs, which is the article's point that this error is quieter than a double charge (L122). The store and the statement are on screen the whole time, apart from each other, as the card asks. About 30 s.
- Why first: the trap reads as a contrast and not as one more error; the kind, the rewind and the take numbers exist and are approved (ADR 0004, amended 2026-11-12), so the next EIP pages fill the same two stages with data.

**A, the diagram comes alive.** One `sequence` (the kind of the SDD scenes 2 and 3) on the published body diagrams, laid left to right: the order travels, the receiver looks up, stores, ignores; in Mule, the trap told once. No cast. About 18 s (book) and 20 s (Mule). The cheapest per page, but without a comparison the 409 of the Mule scene reads as an ordinary refusal, and the book scene repeats the body diagram beside it.

**C, the ID tag (close-up).** The camera sits on the receiver's door; each message carries its ID on a tag; the processed IDs are a rack of tags in the store; a duplicate is caught when its tag matches one on the rack. In Mule, the tag is hung before the charge and outlives it. No cast. About 18 s and 20 s. The most concrete metaphor for the ID, but it fits the next patterns less well (Dead Letter Channel, Correlation Identifier have no tag to match), and it needs the tag type at 33 units (the sheet scales `priceTag`, whose mono text is 22).

## Cast, words and colours

- **Cast (CAST-6, ADR 0007):** only concept B's Mule scene has a character: **Balão** as the client that asks for the charge and asks again (ADR 0007, row Requester/caller: "Balão when the requester acts"). Every other actor is notation: EIP icons (book), the published diagram's components (Mule). The stores are the diagrams' `storeNode`, not a bank object.
- **Words on screen (SCN-1, English, all from the article or its diagrams):** `Sender`, `42` (book diagram, L32); `HTTP Listener`, `Idempotent Message Validator`, `Simulated charge` (charge-flow diagram, L42); `orderId` (L38, L109, L122); `200`, `409`, `500` (L42, L44, L122); the statement's count `0` and `1` (L95, L122); the take numbers `1` and `2` (concept B, a takes-kind device). Every word is at least 33 stage units and every code or counter 36 (the circuit-breaker topology's phone rule).
- **Colours (ADR 0006's `color.state.*`):** the processed message and `200` green (healthy), the ignored duplicate and `409` orange (blocked, as the book diagram's "ignore" exit and the charge-flow diagram's `409: duplicate`), `500` and its path red (failure), the sender light blue (caller).

## Marked choices for the owner's ok (MOT-1)

1. **The question mark at each lookup** (A, B, C): the book diagram's decision "Has ID 42 already been processed?" drawn as the `questionToken`, with no words.
2. **Concept B, book, take 1 (one delivery):** the article states the definition (same effect, received once or several times, L28), not a run with one delivery; take 1 is that definition's first half.
3. **Concept B, the ghost:** take 1's result stays faded beside take 2's last frame (as the topology scene's ghost).
4. **Concept B, Balão's reactions:** `done` and the `worked` emote on 200, `failed` and the `problem` emote on 500, and no reaction on 409, on purpose: the article says the 409 is the quiet part (L122).
5. **Concept C, the tag and the rack:** the ID drawn as a tag and the store as a rack are a metaphor; the article says the validator stores the ID (L36, L109).

## Out of scope

As the card says: removing the ID (L128), a charge after the 409, exactly-once, and the Anypoint MQ path as if it were a run (L124 says it is not tested). Also left out: the provider failure after a successful charge (L122, second sentence), the default `correlationId` key and the "before" endpoint (L36, L92-L105), the time to live and clusters (L133-L137).

## What the design system lacks (art-direction TRI-1)

- **An empty store.** `storeNode` requires a line of text, so the sheets draw an empty store as the piece's shape without its words. Every concept needs it. Recommended: a small design-system change making `text` optional on `storeNode`, before the first scene.
- **Concept C only:** the price tag's type at 33 units (a `textSize` on `priceTag`), or scaling the tag in the scene as the sheets do.
- Nothing else: every other shape on the sheets is an existing piece.

## Timings

Measured on 2026-11-27 on an Apple M5 (32 GB), Node.js 24.22.1, Google Chrome 158, with [`render.sh`](render.sh): per concept, both sheets built from the pieces with their fonts embedded and rasterised by `npm run png`.

| Concept | Render of its two sheets (12 frames) |
|---|---|
| A | 2.5 s (includes `tsx`'s first compile of the run) |
| B | 1.9 s |
| C | 1.9 s |

Authoring: from `npm ci` (16:17 UTC) to the final render (16:28 UTC), about 10 minutes for the shared notation and all three concepts together, with two rounds of rendering, reviewing every frame and fixing (clipped frames, an emote moved beside Balão's head per CAST-3, tokens lifted off the components' names, counters apart). The concepts were written together, so that time does not split by concept. Reading the card, the ADRs and the article came first and is not counted.

Video render, **estimated, not measured:** the circuit-breaker topology scene rendered 64 s of video in 34 s on an Apple M3 (its spike README), about 0.53 s per second of video; at that rate the chosen concept's two scenes would take roughly 10 to 16 s each to render. The real number is measured at gate 1 with `npm run render`.

## How to render again

```sh
npm ci
sh docs/spikes/2026-11-27-idempotent-receiver-storyboard/render.sh out/storyboard
```

[`storyboard.mts`](storyboard.mts) is storyboard notation, not a scene: it imports the pieces from `src/pieces/`, draws each 960 x 540 frame and writes the sheets. It is outside `tsconfig.json`, the tests and the package.

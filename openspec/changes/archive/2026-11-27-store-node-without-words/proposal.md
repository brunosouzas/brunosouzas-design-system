# Proposal: store-node-without-words (SW-248)

## Why

The Idempotent Receiver videos (SW-160) show the receiver's store of processed IDs empty before the first ID goes in, and then holding it. `storeNode` requires `text` (one to three lines), so a store cannot be drawn empty: the gate 0 storyboard drew the piece's shape and dropped its words by hand (`docs/spikes/2026-11-27-idempotent-receiver-storyboard/` on pull request #53, `emptyStore` in `storyboard.mts`). A scene cannot do that: it draws only through the pieces (motion MOT-6). At the gate 0 pick on 2026-11-27 the owner chose concept B for both scenes and answered question 4: a small design-system change first, so `storeNode` can be drawn empty.

## What Changes

- `storeNode`'s `text` becomes optional. Without it, the piece draws the same body as with it (the cylinder and its lid) and no words.
- Without `text`, `subtitle` and `textSize` are rejected by name: they style words that are not drawn.
- `text: []` is still rejected, as today: no words is said by leaving `text` out.
- Every call valid in 0.14.1 draws the same tree and bytes, proven by a frozen fixture written on `main` before any code.
- Release: a `feat:` title, so release-please proposes 0.15.0 (`bump-minor-pre-major`); the owner merges the release pull request.

## Capabilities

### Modified Capabilities

- `illustration-pieces`: "Diagram shapes" names the optional `text` of `storeNode`; a new requirement "Store without words"; a new requirement pinning the 0.14.1 calls.

## Out of scope

- The other four diagram shapes (`diagramBox`, `decisionNode`, `queueNode`, `exchangeNode`) keep a required `text`: no scene asks for them empty.
- The Idempotent Receiver scenes themselves (SW-160): their own changes after this release.
- The cover command and `cover-cli`: a cover spec checks each piece entry with the piece's own schema, so a diagram spec may leave `text` out of a `storeNode` with no change there.
- The `priceTag` text size of the storyboard's concept C: the owner chose concept B, which does not use it.

## Implicit requirements

- **Errors and invalid input:** requirement. `text: []`, `subtitle` without `text` and `textSize` without `text` each throw a `RangeError` naming the parameter.
- **Limits:** the existing limits hold (`text` one to three lines, room for the outline, `ry`); no new number or array.
- **Repetition and idempotency:** the existing "Pure pieces" requirement holds.
- **Concurrency:** n/a. Pure functions.
- **Security:** n/a. No new string reaches an attribute.
- **Logs and observability:** n/a. Pieces do not log.

## Documentation

- `README.md`: the body diagram paragraph says `storeNode`'s words are optional.
- `docs/roadmap.md`: none: the roadmap lists planned changes and this one came from SW-160's gate 0; the SW-160 row keeps pointing to the card.
- Vault: after the merge (S7), the project's `changelog.md`.
- ADR: none. A parameter made optional changes no decision of ADR 0004, 0006 or 0009.

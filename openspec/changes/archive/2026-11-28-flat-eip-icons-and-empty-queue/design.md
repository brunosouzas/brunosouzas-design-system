# Design: flat-eip-icons-and-empty-queue

## 1. Which nodes are shadows

A node is an offset shadow when one of two things holds:

- it is a node or group with a `transform` of `translate(…)`, the published notation's way of copying a whole drawing;
- or it is filled `color.ink`, has no stroke, and repeats the shape of a later node of the same icon moved right and down by the same amount, more than 0 and at most 3. The shape is the same rect size, the same circle radius, or the same polygon points.

Offsets and coordinates are compared after rounding to 2 decimals (`r2`). Exact float equality finds only 42 nodes: subtracting decimal strings such as 22.60 − 21.00 leaves offsets like 1.6000000000000014.

The rule lives in one test helper, `test/pieces/eip-shadows.ts`. `test/pieces/eip-icons.test.ts` uses it, and so does "Every cover piece is flat" in `test/pieces/node.test.ts`. That test's own check, `isShadowOf`, looks only for a translated copy just before its twin, so it missed these shadows: the splitter's is a plain rect at (8.5, 6.5).

On the 0.14.1 data it finds exactly these 46 top-level nodes (icon, then the node indexes):

`aggregator` 0; `canonical-data-model` 0, 4, 12; `channel-adapter` 0, 2, 6; `claim-check` 0; `competing-consumers` 0, 2; `content-based-router` 0; `content-enricher` 0; `content-filter` 0; `correlation-identifier` 0, 2, 8, 9; `dead-letter-channel` 0, 3; `event-driven-consumer` 0, 2; `guaranteed-delivery` 0, 3; `idempotent-receiver` 0, 2, 6; `invalid-message-channel` 0, 3; `message-expiration` 0; `message-filter` 0, 2; `message-translator` 0; `point-to-point-channel` 0; `polling-consumer` 0, 2; `process-manager` 0; `publish-subscribe-channel` 0; `request-reply` 0, 2, 5, 8; `return-address` 0; `scatter-gather` 0; `splitter` 0; `transactional-client` 0, 4.

The ink nodes the rule leaves alone are drawing, not shadow: arrowheads, diamonds, dots, the dark outline layer under a channel arrow, and the `!` dot. The before and after sheet of the 26 icons (task 3.2) is the visual check.

**Decision: delete the nodes from the data** (`eip-icons.ts` is edited by hand since its import). The rejected alternative was to keep the data and filter the shadows when `eipIcon` draws. That leaves 46 dead nodes in the source, and the next reader has to know the rule to read an icon.

## 2. The queue without words

The queue follows the `storeNode` change (archive `2026-11-27-store-node-without-words`, design §1 and §2), so there is one way to draw a shape empty:

- `text` left out means no words; `text: []` stays an error;
- `subtitle` then `textSize` without `text` are rejected through the piece's relations, before the width and room limits, with the same message: `needs text: it styles words that are not drawn`.

`queueNode` computes its body from `x`, `y`, `width`, `height`, `fill`, `surface` and `inkScale` only. `QueueNodeParams` makes `text` optional, and `ShapeParams` stays as it is for `diagramBox`, `decisionNode` and `exchangeNode`.

## 3. Proof that only the shadows went

`scripts/freeze-eip-book-pieces.ts` runs once before any code, while `src/` and `tokens/` equal `d26f254`. In those files `eipIcon`, `nameTag` and `queueNode` draw as in 0.14.1: `git diff d334273 d26f254 -- src tokens` touches only `storeNode` in `src/pieces/diagram.ts`. The script writes two fixtures, committed alone:

- `test/fixtures/eip-icons-0.14.1.json`: each icon's data;
- `test/fixtures/queue-node-0.14.1.json`: the 8 calls of "Frozen queue node calls".

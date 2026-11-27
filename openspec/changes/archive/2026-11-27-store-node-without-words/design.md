# Design: store-node-without-words

No decision between real alternatives beyond the two below; the change follows the existing schema and drawing of `src/pieces/diagram.ts`.

1. **How a caller says "no words":** by leaving `text` out. `text: []` stays an error (`expected at least 1 item(s)`), so an empty list in a cover spec is still caught as a likely mistake, and there is one way to ask for an empty store. Alternative rejected: accepting `[]` as "no words", which would make two spellings of one drawing.
2. **`subtitle` and `textSize` without `text`:** rejected naming each, in that order, through the piece's `relations`, placed before the room and `ry` limits in `limits(...)`, so a call from code throws the words problem first and the cover command reports all of them. The message is `needs text: it styles words that are not drawn` (thrown as `storeNode: subtitle: needs text: …`). Alternative rejected: ignoring them silently, which would draw something other than what the caller wrote. This rejection is the agent's choice, not in the owner's request: it goes to G1 for his ok.

Drawing: `storeNode` computes its body from `x`, `y`, `width`, `height`, `ry`, `fill`, `surface` and `inkScale` only, so without `text` the body is the one the same call draws with `text`, and the text list is empty (no `centred` call). The schema keeps `text` as `lines(3)` with `required: false`; `ShapeParams` stays as it is for the other four shapes, and `StoreNodeParams` makes `text` optional.

Proof that 0.14.1 calls keep their bytes: `scripts/freeze-store-node.ts` (new, so it is added on this branch, as `scripts/freeze-stamp.ts` was) runs while `src/` and `tokens/` still equal `d334273` (0.14.1) and writes `test/fixtures/store-node-0.14.1.json` with the 8 calls of the scenario "Frozen store node calls", committed alone; its header records that condition. `test/pieces/frozen.test.ts` redraws each call, and draws them again with the default `ry` at 9 to show a change is caught.

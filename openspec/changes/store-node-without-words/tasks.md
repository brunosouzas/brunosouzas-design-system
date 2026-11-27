# Tasks

Card SW-248, from the gate 0 pick of SW-160 (2026-11-27, question 4). Gate 1 with the owner, then tests before code; a clean-context reviewer reviews, Claude implements. Test level: **unit** (vitest) for the piece.

Scenarios carried unchanged into the MODIFIED "Diagram shapes" keep their tests in `test/pieces/body-diagram.test.ts` (unit): "Default diagram box", "Diamond", "Cylinder", "Queue", "Exchange", "Shape limits", "First limit wins" and "Queue as narrow as its rails allow"; the full check in 3.2 runs them again.

## 1. Frozen 0.14.1 calls

- [ ] 1.1 Before any code: `scripts/freeze-store-node.ts` (new, in the shape of `scripts/freeze-stamp.ts`) run on this branch while `src/` and `tokens/` equal `d334273` (its header says so, as `scripts/freeze-stamp.ts` does) writes `test/fixtures/store-node-0.14.1.json` with the 8 calls of the spec scenario "Frozen store node calls", committed alone. Check: the commit holds only the script and the fixture, the fixture has 8 entries, and `git diff d334273 <that commit> -- src tokens` is empty.
- [ ] 1.2 Test "Frozen store node calls" in `test/pieces/frozen.test.ts` (unit), new `describe("Store node calls of 0.14.1 unchanged")`: every call deep-equals its tree and its `svg` (`changedCalls` is empty), and "A changed store node is caught": drawn with `{ ry: 9, ...params }`, `changedCalls` lists exactly the 7 calls without `ry`. Check: both pass before and after 2.2.

## 2. Store without words (`illustration-pieces`)

- [ ] 2.1 Tests first in `test/pieces/body-diagram.test.ts` (unit), new `describe("Store without words")`: "Empty store", "Empty store on the dark surface" and "Words asked of an empty store". Check: the three fail on the code of 0.14.1 (`text` is required).
- [ ] 2.2 In `src/pieces/diagram.ts`: `storeNode`'s schema takes `text` as `lines(3)` not required, `StoreNodeParams` makes `text` optional, the drawing skips the words without `text`, and the relations reject `subtitle` then `textSize` without `text` (design §2). `test/pieces/required-only.ts` and the copy in `test/pieces/icons.test.ts` drop `text` from `storeNode`, so they stay the smallest valid call; `test/pieces/palette.test.ts`, which builds its calls from `REQUIRED_ONLY`, gains one `storeNode` call with `text: ["a"]` on each surface, so the store's word colours stay checked. Check: the three tests of 2.1, "Cylinder", the "Missing and unknown parameters" test of `test/pieces/catalogue.test.ts` (unit), the palette test (unit) and "Frozen store node calls" pass.

## 3. Documentation and checks

- [ ] 3.1 `README.md`: the body diagram paragraph says `storeNode`'s words are optional. No version change (release-please proposes it from the `feat:` title). Check: `git diff origin/main -- package.json` is empty.
- [ ] 3.2 Check: `npm run typecheck && npm run tokens:check && npm run build && npm test` exits 0, and `git diff origin/main --stat -- test/fixtures` lists only `store-node-0.14.1.json`.

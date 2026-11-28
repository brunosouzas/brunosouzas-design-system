# Tasks

Card SW-249, from gate 1 of SW-160 (2026-11-27, design §7 points 5 and 8, owner: every recommendation). Gate 1 with the owner comes first, on the spec and on sheets drawn from a scratch copy of `d26f254` with the 46 nodes removed. Then tests go before code. A clean-context reviewer reviews, and Claude implements. Test level: **unit** (vitest) for the pieces; the cover goldens through the existing cover tests (unit).

Scenarios carried unchanged into the MODIFIED "Diagram shapes" keep their tests in `test/pieces/body-diagram.test.ts` (unit), and the full check in 3.3 runs them again:

- "Default diagram box", "Diamond", "Cylinder", "Queue", "Exchange";
- "Shape limits", "First limit wins", "Queue as narrow as its rails allow".

## 1. Frozen 0.14.1 drawings

- [x] 1.1 Before any code, add `scripts/freeze-eip-book-pieces.ts`, in the shape of `scripts/freeze-store-node.ts`, and run it while `src/` and `tokens/` equal `d26f254`; its header says so.
  - It writes `test/fixtures/eip-icons-0.14.1.json` (the 26 icons' data) and `test/fixtures/queue-node-0.14.1.json` (the 8 calls of "Frozen queue node calls").
  - Commit the script and the two fixtures alone.
  - Check: the commit holds only those three files, and `git diff d26f254 <that commit> -- src tokens` is empty.
- [x] 1.2 In `test/pieces/frozen.test.ts` (unit), add a new `describe("Queue node calls of 0.14.1 unchanged")` with two tests:
  - "Frozen queue node calls";
  - "A changed queue node is caught".
  - Check: both pass before and after 2.4.

## 2. Tests, then the pieces (`illustration-pieces`)

- [x] 2.1 Write the shadow rule of design §1 in `test/pieces/eip-shadows.ts`. In `test/pieces/eip-icons.test.ts` (unit), add a new `describe("EIP icons without offset shadows")` with three tests:
  - "No offset shadow";
  - "Every face kept";
  - "A shadow is caught".
  - Check: the first two fail on the 0.14.1 data, and the third passes, since it reads only the frozen fixture.
  - In `test/pieces/node.test.ts` (unit), "Every cover piece is flat" also applies the rule to the icon group of `eipIcon` and of `nameTag` with `icon: "splitter"`. Check: it fails on the 0.14.1 data. "Sheet without a shadow" and "Shadow of a turned shape" are unchanged and still pass.
- [x] 2.2 In `test/pieces/body-diagram.test.ts` (unit), add a new `describe("Queue without words")` with three tests:
  - "Empty queue";
  - "Empty queue on the dark surface";
  - "Words asked of an empty queue".
  - Check: the three fail on the 0.14.1 code (`text` is required).
- [x] 2.3 In `src/pieces/eip-icons.ts`, delete the 46 nodes of design §1 and nothing else.
  - Check: the three tests of 2.1 pass.
- [x] 2.4 Change `src/pieces/diagram.ts` as design §2 says:
  - `queueNode`'s schema takes `text` as `lines(3)`, not required;
  - `QueueNodeParams` makes `text` optional;
  - the drawing skips the words without `text`;
  - the relations reject `subtitle`, then `textSize`, without `text`, sharing `storeNode`'s message.

  `test/pieces/required-only.ts` and the copy in `test/pieces/icons.test.ts` drop `text` from `queueNode`. `test/pieces/palette.test.ts` gains one `queueNode` call with `text: ["a"]` on each surface. "No piece invents a word" in `test/pieces/catalogue.test.ts` gains `["queueNode", { ...REQUIRED_ONLY.queueNode, text: ["a"] }]`, as it has for `storeNode`.
  - Check: the three tests of 2.2 pass, and so do "No piece invents a word", "Queue", "Shape limits", "Queue as narrow as its rails allow", the "Missing and unknown parameters" test of `test/pieces/catalogue.test.ts` (unit), the palette test (unit) and "Frozen queue node calls".

## 3. Goldens, documentation and checks

- [x] 3.1 Regenerate the goldens `test/fixtures/covers/integration-patterns.svg` and `eip-splitter.svg` with `npm run cover -- <spec> --out <golden>`, and change no other golden.
  - Check: `git diff --stat -- test/fixtures/covers` lists those two SVGs and the README only. "Golden output" and "Golden drifts" of `test/scripts/cover.test.ts` (unit) pass.
- [ ] 3.2 Local, after 3.1 (sheets rebuilt 2026-11-28; the owner's approval pending): rebuild from this branch the sheets the owner saw at gate 1, and commit them as small PNGs with a README in `docs/spikes/2026-11-27-flat-eip-icons/`. The owner approves the drawing from them before 3.4. The sheets are:
  - the 26 icons, 0.14.1 and new, side by side at scale 3;
  - the two goldens next to their 0.14.1 goldens, rendered in headless Chrome through an `<img>`. This is in addition to cover-cli's "Visual parity (local)", which compares with the 0.6.1 goldens;
  - and the empty queue on both surfaces.
- [x] 3.3 Docs:
  - in `README.md`, the body diagram paragraph and "EIP icons";
  - in `test/fixtures/covers/README.md`, the two regenerated goldens;
  - no version change.
  - Check: `npm run typecheck && npm run tokens:check && npm run build && npm test` exits 0, `openspec validate --all --strict` passes, and `git diff origin/main -- package.json` is empty.
- [ ] 3.4 Code review by a clean-context reviewer, at most two rounds; fix every right high and medium.
- [ ] 3.5 `openspec archive flat-eip-icons-and-empty-queue -y`, then `openspec validate --all --strict`.

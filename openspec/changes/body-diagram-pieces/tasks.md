# Tasks

Card AB#141. Gate 1 with the owner, then tests before code; Codex reviews, Claude implements. Test levels: **unit** (vitest) for pieces and renderers; **integration** (vitest running the cover command, the pieces sheet and the packed package) where named. Existing tests stay unchanged except the ones named below.

Scenarios carried unchanged into MODIFIED requirements keep their existing tests, run again by the full check in 5.2: "Shapes and words apart" and "Non-finite number" (`test/pieces/node.test.ts`, unit); "Catalogue sheet" (`test/scripts/pieces-sheet.test.ts`, integration); "Escaping", "Mixed text content" and "Deterministic text" (`test/pieces/render.test.ts`, unit); "Curved arrow with a head", "Vertical arrow and the fallback boundary", "Labelled straight arrow" and "Arrow too short" (`test/pieces/diagram.test.ts`, unit); "Unsafe id", "Invalid JSON", "Unknown format" and "Ring count in a spec" (`test/scripts/cover.test.ts`, integration).

## 1. Frozen arrow calls

- [ ] 1.1 Before any code: `scripts/freeze-message-arrow.ts` (header as `scripts/freeze-ui-icons.ts`), run once on `origin/main` (`b0712a9`), writes `test/fixtures/message-arrow-0.3.1.json` with the eight calls of design §5; script and fixture committed alone. Test "Frozen 0.3.1 arrow calls" in `test/pieces/frozen.test.ts` (unit). Check: it passes on that commit.

## 2. Node tree and code in words

- [ ] 2.1 Tests first: in `test/pieces/node.test.ts`, a `tspan` inside a `text` node is a valid tree (requirement "SVG node tree"); in `test/pieces/render.test.ts`, "Text holding only a tspan" (exact string) and "Code through both renderers" (unit). Then `tspan` in `SVG_TAGS` (`src/pieces/node.ts`) and the inline rule for `text` nodes in `src/pieces/render.ts` (design §4). Check: those pass, and "Escaping", "Mixed text content", "Deterministic text", "Same drawing through React", "Goldens unchanged" and the three frozen fixtures pass unchanged.
- [ ] 2.2 Move `inkOf`, `sticker`, `words`, `limits`, `roomFor` and `atLeast` from `src/pieces/metro.ts` to `src/pieces/ink.ts` (design §8), with no other change. Check: `test/pieces/metro.test.ts`, `test/pieces/diagram.test.ts`, "Frozen 0.2.0 calls", "Frozen 0.3.0 icon calls" and "Frozen 0.3.1 arrow calls" pass unchanged, and the package test finds none of those six names in the package's exports.

## 3. The ten pieces (`src/pieces/diagram.ts`)

- [ ] 3.1 Tests first in a new `test/pieces/body-diagram.test.ts` (unit): "Default diagram box", "Diamond", "Cylinder", "Queue", "Exchange", "Shape limits", "First limit wins", "Queue as narrow as its rails allow", "Diagram box too low", "Diamond too narrow", "Dark diagram box", "Ink scale on a lifeline", "Two lines and a subtitle on a fill", "Smaller text", "A code run inside a label", "Only code, and an odd backtick", "Container with its tab", "Tag wider than the frame", "Active lifeline", "Inactive lifeline on dark", "Lifeline of no length", "Band", "Band without a fill, or too narrow", "Frame with one section", "Section outside the frame", "Two lines on a backdrop", "Anchored at the end with a measured width", "Backticks do not count in the estimate", "Too many lines". Then the pieces of design §3 and §4. Check: those tests pass.
- [ ] 3.2 Catalogue: `DIAGRAM_PIECES` after `linkIcon` in `PIECES`; `test/pieces/catalogue.test.ts` gains the ten required-only calls and the bounded sizes (with `inkScale` 0.25 and 8 for the stickers), and expects 51 ("Every piece draws with its defaults": a non-empty body for every piece except `edgeLabel`, whose body is empty and text non-empty; and "Missing and unknown parameters", "Out of range", "Sizes that would break the drawing", "Smallest and largest accepted sizes draw valid geometry", "Too many repeated parts" over the new pieces); "No piece invents a word" collects the caller's words from string arrays and objects too (backticks removed) and keeps its assertion; `test/package/package.test.ts` expects 51; `scripts/pieces-sheet.ts` draws the ten. Check: catalogue, package (integration) and pieces-sheet (integration) tests pass.
- [ ] 3.3 "Inside the outlined group" in `test/pieces/icons.test.ts` walks the ten pieces with the calls the scenario names (unit). Check: it passes.

## 4. The message arrow

- [ ] 4.1 Tests first in `test/pieces/diagram.test.ts` (unit): "Reply", "Failure and fail-fast", "Message kind is the 0.3.1 drawing", "Vertical curve", "Last control point on the end", "Controls with a curve, or three points", "Message arrow label stays plain". Then `kind` and `controls` in `src/pieces/metro.ts` (design §5). Check: those tests and "Frozen 0.3.1 arrow calls" pass.

## 5. Cover command, version and documentation

- [ ] 5.1 `test/scripts/cover.test.ts`: "Unknown background and piece" expects 51 names (integration). Check: it passes and the proof cover and banner goldens stay byte-identical ("Goldens unchanged").
- [ ] 5.2 `npm version 0.3.2 --no-git-tag-version`; README (the ten pieces, the text model, the arrow parameters, the port's scale of design §2) and `docs/roadmap.md` (AB#141 row delivered; the 0.3.1 row of AB#170 set to delivered). Check: `package.json` and the root of `package-lock.json` say `0.3.2`, and `npm run typecheck && npm run tokens:check && npm run build && npm test` exits 0.
- [ ] 5.3 Vault notes (`10-personal/projects/brunosouzas-design-system/{architecture,roadmap,changelog}.md`) on the vault's `main` after the pull request is ready, before `openspec archive`. Check: the vault commit exists and names AB#141.

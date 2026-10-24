# Proposal: designer-formats

## Why

The kit's `designer` skill (AB#151, kit pull request #133, draft) now draws the blog's covers from cover specs. Its proof on 2026-10-24 (`~/.hermes/spikes/design-system/ab151-designer/`, cover approved by the owner) left five gaps in the package, sent as one request (`~/.hermes/spikes/design-system/designer-formats/request.md`, card AB#173). The port of the 21 covers and 14 body diagrams (AB#140) and the merge of kit #133 wait for this release.

1. **Body diagrams have no format.** The proof's state diagram is a Node script that writes the frame by hand (root, `title`, `desc`, clip, panel, rings) and calls `toSvg`. It only runs from a folder with the package installed, because an ESM `import` does not see the `npx` cache. Its rings come from the `rings` piece, whose step (28) and width (2) are cover units: laid out at 560 and shown at 800 they become 40 and 2.86, while every published diagram has 28 and 2 at 800 (28 diagrams measured in brain `50-writing`, commit `18ffd2e`).
2. **Icons have no format.** The 26 published EIP icons (`50-writing/integration-patterns-in-mulesoft/images/icons/eip-*.svg`, 64x40, `title` and `desc` with the CC BY 4.0 credit) only come out of a script.
3. **No start marker.** The published state diagram starts with a filled ink dot (r 11 at 800); `stationMarker` is white with a shadow. The proof used a `circle` in `custom`-like code.
4. **Cover backgrounds are used up.** The 21 `coverBackground` pairs each belong to one of the 21 published covers; the next new cover has no free pair under the skill's rule COV-4.
5. **`custom` is always painted last,** so a `pill` cannot sit on top of the free-form object; in the proof the OPEN label had to move off the breaker.

## What Changes

- **`format: "diagram"`** in the cover command: `height` in layout units, laid out 560 wide and shown 800 wide, on a `color.panel` panel with rounded corners, rings in `color.ring` drawn so they show at step 28 and width 2, out to the farthest corner. Pieces are outlined at `map.outline` and labelled at `map.labelSize`. Same validator, same `custom` rules.
- **Text tables:** an optional `text` with one table per language (`{"pt": {...}, "en": {...}}`); any string `"@key"` outside it is replaced by that key's value for the language chosen with `--lang <code>`. Every language must define the same keys. Ids in the output gain the language (`<id>-pt`). Works in every format.
- **`format: "icon"`:** one `eipIcon`, `uiIcon` or `linkIcon` at 0,0 in a box of the piece's size. An EIP icon takes its title and description, credit included, from the icon's data.
- **`stateStart`**, a new piece: the filled start dot of a state machine, in the surface's text colour, no outline, no shadow.
- **`customAt`:** optional index; `custom` is drawn before `pieces[customAt]`. The default (after every piece) keeps the goldens byte-identical.
- **Tokens:** a new group `bodyDiagram` (width 800, layoutWidth 560, radius 14, ringRadius 70, startRadius 11), measured from the published diagrams at their shown size.
- **Backgrounds:** no new pair. The README stops saying each pair belongs to one cover; which covers may share a pair is the `designer` skill's rule (gate-1 decision 2).
- **Fixtures:** `circuit-breaker-states` (diagram, PT and EN goldens from one spec) and `eip-splitter` (icon).
- **Release:** the version bump of gate-1 decision 1.

## Capabilities

### Modified Capabilities

- `cover-cli`: the `diagram` and `icon` formats, text tables and `--lang`, `customAt`, the two fixtures.
- `illustration-pieces`: `stateStart` and the catalogue count (52).
- `design-tokens`: the fourteenth group, `bodyDiagram`.

`motion-components`, `scene-catalogue` and `scene-rendering` do not change.

## Out of scope

- Porting any published cover, diagram or icon (AB#140, in brunosouzas.com) and any change in the kit or the site.
- New `coverBackground` pairs (decision 2, alternative A), and the cast (AB#152): the designer uses neither.
- A dark-surface diagram, a second layout width, or text that wraps by itself. A diagram is laid out by its spec, as the proof was.
- A piece for the tilted request stack of the circuit breaker cover (the consumer uses `rail`).
- Measuring text: label widths stay the pieces' estimates, or the caller's.

## Implicit requirements

- **Errors and invalid input:** requirement. Every new key and option has its problem, reported with the others by JSON path; a bad `--lang` is an invocation problem. Nothing is written on any problem.
- **Limits:** requirement. `height` from 1 to 10000; the rings centre within ±10000 as for covers (at most 1153 rings on a diagram); `customAt` from 0 to the piece count; language codes `^[a-z]{2}(-[a-z]{2})?$`.
- **Repetition and idempotency:** requirement. Same spec and language give the same bytes (existing "Running twice"); a spec without the new keys gives today's bytes.
- **Concurrency:** n/a. A one-shot command and pure functions.
- **Security:** requirement. Text references only substitute strings from the spec's own tables, checked afterwards like any other value; the `custom` allowlist and the colour-literal check are unchanged. Icons add no node the pieces do not already draw.
- **Logs and observability:** n/a. The command prints `wrote <file>` or its problems, as today.

## Documentation

- `README.md`: body diagrams and icons through the command, text tables, `customAt`, `stateStart`, the `bodyDiagram` tokens, the background sentence.
- `docs/roadmap.md`: AB#173 delivered; AB#151's row points to it.
- `test/fixtures/covers/README.md`: the two new fixtures and their published sources.
- Vault: `10-personal/projects/brunosouzas-design-system/{architecture,roadmap,changelog}.md`, after the pull request is ready.
- No ADR: the diagram frame follows ADR 0003 (panel, rings, ink outline, hard shadow); the start dot is a small element in ink (ADR 0003).

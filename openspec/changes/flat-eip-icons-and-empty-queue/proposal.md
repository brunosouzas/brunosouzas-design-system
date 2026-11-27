# Proposal: flat-eip-icons-and-empty-queue

## Why

The Idempotent Receiver book scene (SW-160, pull request #53) passed gate 1 on 2026-11-27, and the owner took every recommendation of its design §7. Two of those answers need pieces the package does not have:

- **Point 5, the channel.** The wiki page's diagram draws the message channel as a queue, with no pattern's name. The scene should draw a `queueNode` with no words. `queueNode` requires `text` (one to three lines), as `storeNode` did before SW-248. A scene draws only through the pieces (motion MOT-6), so it cannot drop the words by hand.
- **Point 8, the icons' shadows.** `eipIcon` still draws the hard offset shadows of the published notation (src/pieces/eip-icons.ts): 46 ink copies of a face, moved right and down by 1.5 to 2.5 units. ADR 0009 removed those shadows from every other piece ("no piece passes a literal offset of its own"). The book scene would be the first published video to show them, at scales 2.8 and 3.4. The owner chose to fix the piece first, as SW-248 came before the scene.

## What Changes

- **`eipIcon` without offset shadows.** The 46 shadow nodes are removed from the icon data. Every other node of each icon stays, in order and unchanged, and so do every name, title, description and the CC BY 4.0 credit. `nameTag`, which draws an EIP icon, loses the shadow with it.
- **The goldens that draw an EIP icon are regenerated:** `integration-patterns.svg` and `eip-splitter.svg` (test/fixtures/covers/README.md, "only when a change means to alter the drawing"). The owner reviews them next to their 0.14.1 goldens.
- **`queueNode`'s `text` becomes optional,** exactly as `storeNode`'s did in SW-248:
  - without `text` the piece draws the same body (box and rails) and no words;
  - `subtitle` and `textSize` without `text` are rejected by name;
  - `text: []` stays an error.
- **Every `queueNode` call valid in 0.14.1 draws the same tree and bytes,** proven by a frozen fixture written before any code. The 0.14.1 icon data is frozen the same way, so the test proves that only the 46 shadow nodes went.
- **Release:** a `feat:` title (`bump-minor-pre-major` proposes the next minor). The owner merges the release pull request; the scene then takes the pieces from `main`.

## Capabilities

### Modified Capabilities

- `illustration-pieces`:
  - "Diagram shapes" names `queueNode`'s optional `text`;
  - new requirements "EIP icons without offset shadows", "Queue without words" and "Queue node calls of 0.14.1 unchanged".

## Out of scope

- **The scene itself** (SW-160): it merges `main` after this change and swaps its channel (its task 4.4a).
- **The brand notation (`brandNotationIcon`):** already in the v2 grammar.
- **Other diagram shapes:** `diagramBox`, `decisionNode` and `exchangeNode` keep a required `text`; no scene asks for them empty.
- **The images already published on brunosouzas.com** (the wiki's EIP icons and diagrams). They change only when their specs are rebuilt on the new version, in the site's or the content repository's own change.
- **Any other redraw of the EIP icons:** their strokes, colours and layout stay as published. Removing the shadows is the only change.
- **An ADR change:** this applies ADR 0009 to the one piece it had not reached.

## Implicit requirements

- **Errors and invalid input:**
  - `queueNode` with `text: []`, `subtitle` without `text` or `textSize` without `text` throws a `RangeError` naming the parameter ("Words asked of an empty queue");
  - a shadow put back into an icon is caught by the shadow rule ("A shadow is caught").
- **Limits:** the existing limits hold (one to three lines, room for the outline, the rails' width); no new number.
- **Repetition and idempotency:** the existing "Pure pieces" requirement holds.
- **Concurrency:** n/a. Pure functions.
- **Security:** n/a. No new string reaches an attribute.
- **Logs and observability:** n/a. Pieces do not log.

## Documentation

- `README.md`:
  - the body diagram paragraph says `queueNode`'s words are optional;
  - "EIP icons" says the icons draw no offset shadow since this change, and that an image rebuilt on it loses them.
- `test/fixtures/covers/README.md`: the two goldens regenerated in this change, and why.
- Vault: after the merge (S7), the project's `changelog.md`.
- ADR: none (see Out of scope).

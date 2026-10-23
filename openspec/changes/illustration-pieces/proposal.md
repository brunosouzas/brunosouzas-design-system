# Proposal: illustration-pieces

## Why

The blog has 21 published covers and 14 body diagrams (28 files, PT and EN), all drawn by hand with no versioned generator. The same objects are redrawn in each file and have drifted: colours outside the tokens (`#1E6FEB`, `#14215A`, `#C9D6F5`, `#2BB673` and others), ring tints picked per cover, shadows with and without the outline, arrow heads of different sizes, and EIP icons pasted by copy into two covers. The coming videos (cast, EIP scenes) need the same objects as React. A prototype (`~/.hermes/spikes/design-system/illustration-pieces/`) rebuilt three published covers from shared pieces, at 39.4, 31.8 and 23.3 dB PSNR against the originals, and the same tree passed through React gave identical pixels. The owner approved its approach (option A in `design.md`).

## What Changes

- **Tokens.** Three new groups in `tokens/source.json`: `illustration` (eight colours the pieces need and that have no token today), `cover` (the cover's size, pill, label and ring measures) and `coverBackground` (the 21 background and ring pairs measured from the published covers, one named pair per background).
- **Piece contract.** A piece is a pure TypeScript function from plain parameters to an SVG node tree, built only from tokens. Two renderers consume the same tree: an SVG string (covers, diagrams) and React elements (Remotion scenes). A `pose` wrapper animates any piece by parameter (tilt, squash, hop, scale, shake, opacity), recomputed per frame as in the approved cast motion test.
- **Pieces.** 26 pieces: the card's 22 items (pill, rings, sheet, block arrow, arc arrow, rail with nodes, check badge, tag, code panel, server stack, cloud, stamp, robot, magnifier, gear, parcel, road with pin, browser window, speech bubble, steps, folder, book), where the tag splits into price tag and name tag and the road into road and milestone pin; a Mule flow (bar, processor tiles and glyphs), which the integration-patterns cover repeats three times; and `eipIcon`. Exact list and parameters: `design.md` §4.
- **EIP icons as data.** The 26 published EIP icons become one data module of node trees with token colours and their CC BY 4.0 attribution, used through an `eipIcon` piece instead of pasted markup.
- **Cover CLI.** `npm run cover -- <spec.json> --out <file.svg>` validates a cover spec (JSON) and writes a deterministic 800x420 SVG. The spec names a background, the ring centre, the pieces in paint order, and at most one free-form object, which is a JSON node tree under the same colour and tag rules. Cover specs live with each article in the private vault; the repository keeps only pieces and the three published proof covers as test fixtures.
- **Catalogue sheet.** `npm run pieces:sheet -- --out <file.svg>` draws every piece once with its name, the evidence the owner reviews.
- **Roadmap.** `docs/roadmap.md` takes the order revised on 2026-10-23 (pieces, cast, cover port, body diagrams, site video, per-article videos).

## Capabilities

### New Capabilities

- `illustration-pieces`: node contract, SVG and React renderers, `pose`, the piece catalogue, EIP icon data.
- `cover-cli`: the cover spec format, its validation, the one-object limit and the `npm run cover` command.

### Modified Capabilities

- `design-tokens`: three new groups and their required tokens; the cover background pair rule.

`motion-components`, `scene-catalogue` and `scene-rendering` do not change: no scene uses the pieces yet (the cast, AB#152, is the first).

## Out of scope

- Porting the other 18 covers and writing their specs (AB#140); changing any published cover or image in the vault.
- Body diagrams on the pieces (AB#141), the site, video embeds, the site palette.
- The cast of mascots, their faces and emotes, and ADR 0005 (AB#152). This change only gives them the contract: parameters and `pose`.
- Any scene using the pieces; Remotion compositions; rendering PNGs in CI.
- Checking that a cover's labels come from its article: that is the designer and editor review of the article, not the CLI (see Implicit requirements).
- New token types, a sprite sheet, a Python generator, publishing the pieces as a package.

## Implicit requirements

- **Errors and invalid input:** requirement. The CLI reports every problem of a spec at once, by JSON path, exits 1 and writes nothing; a failed write leaves an existing cover untouched (`cover-cli`). Pieces called from code reject impossible values (non-positive sizes, unknown names) with an error naming the parameter (`illustration-pieces`). Token validation keeps its current behaviour for the new groups.
- **Limits:** requirement. One cover is 800x420; at most one free-form object per cover; a free-form object holds only drawing tags; ring count and step are fixed by the measured covers.
- **Repetition and idempotency:** requirement. Same spec, same bytes; running the CLI twice leaves the file unchanged. Pieces are pure: the same parameters give a deep-equal tree, so a scene can seek to any frame.
- **Concurrency:** n/a. One command writes one file; parallel runs on the same output are not supported, as for `stills` and `render`.
- **Security:** requirement. A cover spec is author input but becomes public SVG: a free-form object takes only drawing tags and an allowlist of geometry, paint and text attributes, no value may reference anything (`url(`, `//`), transforms are translate and scale only, path data is checked, text is escaped, and the id is a safe slug. Draft cover specs never enter this public repository; only the three published proof covers are fixtures. No secrets, no network.
- **Logs and observability:** requirement. The CLI prints one line with the written path, or the problem list on failure.

Text provenance (ADR 0004): pieces draw no words of their own; every word on a cover comes from the spec (pill labels, stamp word, tag text, title and description). Whether those words come from the published article is checked by the `designer`/`editor` review the covers already have, not by code.

## Impact

New `src/pieces/` (node contract, renderers, `pose`, pieces, EIP icon data), `scripts/cover.ts`, `test/pieces/` and `test/scripts/cover.test.ts`, fixtures in `test/fixtures/covers/`; `tokens/source.json`, `scripts/tokens.ts` (groups, required tokens, pair rule) and the regenerated `tokens/generated/`. `package.json` gains the `cover` script and no dependency (`react-dom/server` is already installed with `react-dom`). Existing scenes, components and their tests stay unchanged; the no-colour-literals test extends to `src/pieces/`.

## Open questions

For gate 1 (recommendation in `design.md` §9): hue names for the 21 backgrounds; the four extra illustration colours beyond the card's list; the three proof covers as public fixtures; the Mule flow as a piece; the stamp's word turning with the stamp despite ADR 0003. The evidence for gate 1 is built with the recommended answers.

## Documentation

- `README.md`: the pieces, the cover command and spec format, the EIP icon attribution, the updated status.
- `docs/roadmap.md`: the revised order (this change).
- No ADR is superseded: ADR 0002 (one token source) and 0003 (fixed colour meanings) apply as they are; the backgrounds are decorative and carry no meaning.
- Brain (after the pull request is ready, on the vault's `main`): the project's `architecture.md`, `roadmap.md` and `changelog.md`.

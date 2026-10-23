# Proposal: bend-radius-and-current-colour

## Why

stackledger asked for two more things before its next release (request: `~/.hermes/spikes/design-system/stackledger-0.3.1-prompt.md`, AB#170). Without them it would copy a value or draw around the package:

- **Round bends (stackledger AB#166).** Its maps turn with mitred corners. Its change `round-bends` (brunosouzas/stackledger#30, gate 1 approved) turns them with concentric arcs whose centre-line radius is 32 map units. The owner approved 32 on the spike contact sheet (`~/.hermes/spikes/design-system/round-bends/contact-sheet.png`). The `map.*` tokens hold every other map measure, but no bend radius.
- **Icons in buttons (stackledger AB#169).** stackledger puts `uiIcon` glyphs in its site's `.btn` (zoom in, zoom out, reset, download). The button inverts its colours on hover and when pressed, in both themes. `uiIcon` paints `fill` and `stroke` with one token colour (`colour`, a token path, `src/pieces/ui-icons.ts`), so any fixed colour disappears or loses contrast in one state of each theme.

## What Changes

- **Token `map.bendRadius` = 32** (`dimension`), in `tokens.json`, `tokens.ts` and `tokens.css` (`--ds-map-bend-radius: 32px`). It is the radius of a bundle's centre line at a 45° or 90° bend, in map units. No piece reads it: `pipe.d` already takes the `A` command, and the consumer writes the arcs.
- **`uiIcon` with `colour: "currentColor"`.** The icon's group gets `fill="currentColor"` and `stroke="currentColor"`, so an icon written inline in a page follows the text colour of its element. Only that exact spelling is accepted. The default stays `color.ink`, and every call valid in 0.3.0 draws the same tree.
- **A cover or banner spec refuses `currentColor`.** A cover is a standalone image: `currentColor` there resolves to the image's initial colour, not to a token. The command reports it at its path.
- Release: patch `0.3.1` (additive, for a consumer), through `docs/release.md`. The owner tags and approves. The release also carries the body-diagram pieces of AB#141 if they merge first; that is another change.

## Capabilities

### Modified Capabilities

- `design-tokens`: the map tokens gain `bendRadius`.
- `illustration-pieces`: `uiIcon`'s `colour` also takes `currentColor`.
- `cover-cli`: a spec's colour parameters stay token paths (no `currentColor`).

## Out of scope

- Drawing the bends: stackledger's change `round-bends` does it with its own writer. The banner keeps its `Q` curves.
- `currentColor` on any other piece. The map and diagram pieces paint tokens or data colours; the link icons keep their light and dark frames.
- Other icon glyphs, sizes or names: `zoomIn` and `zoomOut` of 0.3.0 serve the zoom buttons.
- Any change in stackledger or brunosouzas.com.

## Implicit requirements

- **Errors and invalid input:** requirement. Any other keyword or spelling (`currentcolor`, `inherit`) is still rejected and named; a cover spec names `currentColor` at its path.
- **Limits:** n/a. One token and one keyword.
- **Repetition and idempotency:** the existing "Pure pieces" requirement holds.
- **Concurrency:** n/a. Pure functions.
- **Security:** requirement. The icon trees keep the "Icons hold no link, style or script" rule: `currentColor` is a paint keyword, not a reference.
- **Logs and observability:** n/a.

## Documentation

- `README.md`: the `map.*` list names the bend radius; the `uiIcon` line names `currentColor` and that it only works when the SVG is inline in the page (an `<img>` does not inherit the page's colour).
- `docs/roadmap.md`: the delivered row for AB#170.
- Vault: `10-personal/projects/brunosouzas-design-system/{architecture,roadmap,changelog}.md`, after the pull request is ready.

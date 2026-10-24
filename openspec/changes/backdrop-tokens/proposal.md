# Proposal: backdrop-tokens

## Why

stackledger's `map-backgrounds` change (AB#134, stackledger PR #39, draft) draws a city backdrop (water and parks of central London from OpenStreetMap) behind the software map, plus an "© OpenStreetMap contributors" credit. It writes no colour of its own, so it needs those four colours from this package, one set per surface (card AB#180). Its spike (`~/.hermes/spikes/stackledger/map-backgrounds/`, contact sheet in `out/contact-sheet.png`) checked provisional values for readability in both themes at 1200 and 390 px.

## What changes

- `surface.light` and `surface.dark` each gain four `color` tokens: `backdropWater` (fill of rivers, docks and lakes), `backdropWaterEdge` (outline of the water), `backdropPark` (fill of parks) and `backdropCredit` (the attribution text). The values are the spike's (design §1).
- The `surface` group stays closed: each surface now holds exactly thirteen tokens, and a missing backdrop token is an error naming its path.
- They come out in the three outputs like every surface token (`--ds-surface-light-backdrop-water` in `tokens.css`, `tokens.surface.light.backdropWater` in TypeScript and JSON).
- Release 0.5.3 (additive tokens asked by a consumer: a patch).

## Out of scope

- A neutral dashed arrow (the card's second item): it already exists. `messageArrow({ dashed: true })` with the default `kind: "message"` draws a dashed arrow in `surface.text` (spec `illustration-pieces`, "Message arrow dash", since 0.3.2). Nothing to add.
- Coastline, rings for a textured `neutral` backdrop, other cities: stackledger did not ask for them.
- Any piece that draws the backdrop: stackledger draws it with its own writer.
- Deeper token nesting (`surface.light.backdrop.water`): see design §2.

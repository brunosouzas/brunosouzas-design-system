# Proposal: backdrop-tokens

## Why

stackledger's `map-backgrounds` change (AB#134, stackledger PR #39, draft) draws a city backdrop (water and parks of central London from OpenStreetMap) behind the software map, plus an "© OpenStreetMap contributors" credit. It writes no colour of its own, so it needs those four colours from this package, one set per surface (card AB#180). Its spike (`~/.hermes/spikes/stackledger/map-backgrounds/`, contact sheet in `out/contact-sheet.png`) checked provisional values for readability in both themes at 1200 and 390 px.

## What changes

- `surface.light` and `surface.dark` each gain four `color` tokens: `backdropWater` (fill of rivers, docks and lakes), `backdropWaterEdge` (outline of the water), `backdropPark` (fill of parks) and `backdropCredit` (the attribution text). The values are the spike's (design §1).
- The `surface` group stays closed: each surface now holds exactly thirteen tokens, and a missing backdrop token is an error naming its path.
- They come out in the three outputs like every surface token (`--ds-surface-light-backdrop-water` in `tokens.css`, `tokens.surface.light.backdropWater` in TypeScript and JSON).
- Release 0.5.3 (additive tokens asked by a consumer: a patch).
- A reply for the stackledger session (the flat names, the version, the existing dashed arrow), so its draft spec can rename the four paths.

## Out of scope

- A neutral dashed arrow (the card's second item): it already exists. `messageArrow({ dashed: true })` with the default `kind: "message"` draws a dashed arrow in `surface.text` (spec `illustration-pieces`, "Message arrow dash", since 0.5.1, AB#190). Nothing to add; stackledger needs 0.5.1 or later for it.
- Coastline, rings for a textured `neutral` backdrop, other cities: stackledger did not ask for them.
- Any piece that draws the backdrop: stackledger draws it with its own writer.
- Deeper token nesting (`surface.light.backdrop.water`): see design §2.

## Implicit requirements

- **Errors and invalid input:** requirement. A missing backdrop token, an extra one or another type is an error naming the path, and the build writes no file (the existing "Surface tokens" and "writes no file" rules).
- **Limits:** n/a. Four colours; colour syntax is already validated.
- **Repetition and idempotency:** the existing build rules hold (same source, same bytes).
- **Concurrency:** n/a. A build script over one file.
- **Security:** n/a. Values are validated hex colours, as for every colour token.
- **Logs and observability:** n/a. The build's existing error output.

## Documentation

README (surface tokens line), `docs/roadmap.md`; vault `10-personal/projects/brunosouzas-design-system/` (`roadmap.md`, `changelog.md`, `architecture.md`) after the pull request is ready. No ADR: the backdrop is decorative, and ADR 0003's meanings are untouched (design §1).

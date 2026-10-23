# Proposal: metro-and-diagram-pieces

## Why

stackledger (`@brunosouzas/stackledger`) draws a metro map of software and two kinds of page diagram, and it should carry the identity of brunosouzas.com. Today it copies that identity by hand: 25 distinct hex values in `src/map/themes.ts` and `site/src/styles/tokens.css`, of which only 9 are design-system tokens, and its own sticker helper (ink outline, hard shadow, a light rim on dark). The inventory of 2026-10-23 (`~/.hermes/spikes/design-system/stackledger-inventory/report.md`, approved by the owner) lists 33 drawn elements and recommends the smallest set of pieces and tokens that lets stackledger stop copying. The design system's pieces are drawn at cover size, on a light background only, so they cannot be used for the map yet.

This change gives the design system what stackledger needs; stackledger adopts it in its own repository and session.

## What Changes

- **Tokens.** Three new groups:
  - `surface`: the light and the dark background a map or diagram sits on (background, text, muted, grid, panel, shadow, rim and rim width), measured from stackledger's map themes;
  - `map`: the map and diagram measures (outline, shadow offset, line width, casing, badge, count, stop radius, node height and radius, edge width, label size);
  - `site`: the page palette of brunosouzas.com in light and dark, its two fonts and its type scale, measured from that site's `src/styles/generated-theme.css`.
- **Ink sticker on a surface.** New pieces take `surface` (`light`, `dark`) and `inkScale`: the outline, the hard shadow in the surface's shadow colour and, on dark, the light rim, as stackledger draws them today.
- **Line colours from data.** A map's line colours come from the consumer's catalogue, not from the identity, so `pipe.fill` and `lineBadge.fill` also accept a `#RRGGBB` value. Every other colour stays a token path, and a cover spec still rejects any colour literal.
- **Nine pieces.** Metro: `lineBadge`, `stationMarker` (stop, interchange as a capsule, deprecated), `pipe`, `countBadge`. Diagram: `nodeBlock`, `pillNode`, `hexNode` (states normal, focus, placeholder) and `messageArrow` (curved or straight, with a head and an optional label). Mark: `ledgerMark` (favicon and header mark). Parameters: `design.md` §3.
- **Catalogue sheet** gains the nine pieces; the library goes from 26 to 35 pieces.
- **Roadmap and README** say what the package now gives a metro map.

## Capabilities

### Modified Capabilities

- `design-tokens`: the `surface`, `map` and `site` groups and their required tokens.
- `illustration-pieces`: the ink sticker on a surface, data colours for lines, the nine pieces, the catalogue of 35.

`cover-cli` keeps its behaviour: the new pieces are accepted in a cover spec like any other piece, and a colour literal in a spec is still an error. `motion-components`, `scene-catalogue` and `scene-rendering` do not change.

## Out of scope

- Any change in stackledger or brunosouzas.com: each adopts the package in its own repository.
- Laying out a map or a diagram: positions, text measurement and truncation stay with the caller. Pieces paint what they are given.
- The later items of the inventory: renewal ring and suggested halo, licence marker, zone, kind glyph inside a station, UI icons (sun, moon, zoom, calendar, download), status pill, empty-state illustration.
- The generic diagram pieces stackledger does not use (decision, store, queue, exchange, lifelines, phase band, alt frame): they stay with the body diagrams (AB#141).
- The banner format (AB#156) and the home banner; a new palette for the site (roadmap item "site palette"): `site` holds today's values only.
- Giving the 26 cover pieces a surface or an ink scale.
- Publishing a version: releases follow `docs/release.md` after the merge.

## Implicit requirements

- **Errors and invalid input:** requirement. The new pieces check parameters like the others (RangeError with the first problem; the cover command lists all). A data colour that is not `#RRGGBB` is rejected; a colour literal in a cover spec is still rejected.
- **Limits:** requirement. Coordinates, sizes and points within ±10000; `inkScale` from 0.25 to 8; text parameters non-empty; badge and node sizes leave room for their outline.
- **Repetition and idempotency:** requirement. Same parameters, same tree (existing requirement "Pure pieces").
- **Concurrency:** n/a. Pure functions; no shared state.
- **Security:** requirement. Words come only from the caller and are escaped by the existing renderers; the data colour pattern admits nothing but six hex digits, so it cannot carry markup or `url(`.
- **Logs and observability:** n/a. A library with no output of its own.

## Documentation

- `README.md`: the pieces section lists the new pieces and the `surface`, `map` and `site` tokens.
- `docs/roadmap.md`: item 6 (AB#157) delivered.
- Vault: `10-personal/projects/brunosouzas-design-system/{architecture,roadmap,changelog}.md` after the pull request is ready.
- No ADR: ADR 0003's colour meanings hold; data colours are the consumer's, not new meanings.

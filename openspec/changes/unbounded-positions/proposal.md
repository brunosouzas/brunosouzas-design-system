# Proposal: unbounded-positions

## Why

stackledger cannot adopt 0.1.0 (AB#164, brunosouzas/stackledger#29). Pieces reject a position outside ±10000: `pos()` has `min: -MAX_SIZE, max: MAX_SIZE` and the `point` kind requires `Math.abs(n) <= MAX_SIZE` (`src/pieces/params.ts`). stackledger places grid point `[c, r]` at `(64c, 64r)` (its spec `metro-map`, "Map units"). Its `MapLayout` accepts any non-negative integer as a coordinate, with no maximum (`src/schema.ts`: `z.number().int().nonnegative()`), so column 157 is already at 10048. A valid catalogue would stop drawing its map, and stackledger cannot clamp coordinates without moving stations.

## What Changes

- **Positions of any size.** Every position parameter built with `pos()` and every `point` parameter accepts any finite number. `NaN`, `Infinity` and non-numbers are still rejected and named. That covers all 34 `pos()` uses in the cover and metro pieces and the `point` parameters of `arcArrow`, `priceTag`, `stationMarker` and `messageArrow`.
- **Exception: `rings`.** The centre (`cx`, `cy`) keeps ±10000. The rings are a frame's background, not a map position, and the banner format (AB#156) computes its ring count from the centre.
- **Sizes unchanged.** `size()` (widths, heights, radii, scales) keeps its 10000 limit.
- **Overflow is an error.** A piece that would draw a number that is not finite throws a `RangeError` and draws nothing. For example, the distance between two points at opposite ends of the number range becomes `Infinity`, and `Infinity` must never reach an SVG.
- **No drawing change.** Every measure, token and drawing stays as in 0.1.0: a piece within ±10000 gives the same tree as before.
- Release: patch `0.1.1`, through `docs/release.md` (the owner tags and approves).

## Capabilities

### Modified Capabilities

- `illustration-pieces`: the parameter limits (positions and points unbounded, rings centre bounded, sizes bounded) and the overflow check.

`cover-cli` takes the same schemas, so a cover spec accepts positions of any size too. Its requirements do not mention the limit.

## Out of scope

- The stackledger requests that do not block it. They are noted in `docs/roadmap.md`, not built: an optional subtitle on `placeholder`; pieces for the renewal ring, the suggested-position halo, the licence marker at 10 units and the map zones; UI icons (sun, moon, zoom, calendar, download).
- Raising the size limit.
- Changing `r2`. It rounds to two decimals below 1e12, and from there on the number is written as JavaScript gives it. stackledger's largest coordinate (64 × 2^53) is below 1e18, so it is written in full, without an exponent.
- Any change in stackledger.

## Implicit requirements

- **Errors and invalid input:** requirement. Non-finite positions are still rejected and named, and a drawing that overflows is a `RangeError`.
- **Limits:** requirement. Positions and points have no bound beyond being finite. The `rings` centre stays within ±10000 and sizes within 10000.
- **Repetition and idempotency:** requirement. The existing requirement "Pure pieces" holds: the same parameters give the same tree.
- **Concurrency:** n/a. Pure functions.
- **Security:** requirement. Only finite numbers reach the SVG, and the overflow check keeps `Infinity` and `NaN` out of attributes and path data.
- **Logs and observability:** n/a.

## Documentation

- `README.md`: the pieces section states the limits.
- `docs/roadmap.md`: the stackledger requests that are not blocking, in "Out of scope for now" or as later items.
- Vault: `10-personal/projects/brunosouzas-design-system/{architecture,roadmap,changelog}.md`, after the pull request is ready.

# Design: unbounded-positions

## 1. Where the limit lives

`src/pieces/params.ts`: `pos()` (`min: -MAX_SIZE, max: MAX_SIZE`) and the `point` check (`Math.abs(n) <= MAX_SIZE`). `pos()` drops its bounds and `point` keeps only `Number.isFinite`. `rings` gets a local bounded position (`{ kind: "number", required: true, min: -MAX_SIZE, max: MAX_SIZE }`) for `cx` and `cy`. `size()`, `count()` and `MAX_SIZE` stay as they are.

The point's message becomes "expected a point [x, y] of finite numbers".

## 2. Overflow check (decision)

Without a bound, a finite position can still produce a non-finite drawing. The distance between −1.7e308 and 1.7e308 is `Infinity`, and a capsule or an arrow then divides by it and gets `NaN`. With sizes at most 10000, adding a size to a position cannot overflow, because the sum rounds back to the position.

- **Chosen:** after `draw`, `definePiece` walks the returned tree once. If any number attribute is not finite, or any string attribute holds `Infinity` or `NaN`, it throws `RangeError("<piece>: the drawing overflows")`. That is one check for all pieces, and it costs one pass over a small tree.
- Rejected: per-piece guards that name a parameter. There are 35 pieces, and the overflow comes from a combination of parameters, not from one.
- Rejected: a large fixed bound such as ±1e15. stackledger has no maximum (its largest is 64 × (2^53 − 1)), so any bound only moves the failure.

## 3. Rounding

`r2` (`src/pieces/node.ts`) rounds to two decimals below 1e12 and writes larger values as they are. `toSvg` writes numbers with `String`, which uses an exponent only from 1e21. stackledger's coordinates stop below 6e17, so they are written in full. No change.

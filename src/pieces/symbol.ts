// The brand symbol: the "b" with a moon (identity studio I5): the haste and
// the ring read as a lowercase b, the moon sits on the accent of the ring.
// Ported from `~/.hermes/cache/scratch/ab267/board4.py`'s `bmoon()`, the
// approved source (reused unchanged by every later script, through `final.py`).
import { drawn, el, g, type Drawn } from "./node.ts";
import { surfaceParam, type SurfaceName } from "./ink.ts";
import { pos, num, type Schema } from "./params.ts";
import { definePiece } from "./piece.ts";
import { colour } from "./params.ts";

export type SymbolParams = { x: number; y: number; surface?: SurfaceName; scale?: number };

const c = (path: string): string => colour(path);

const drawSymbol = (p: SymbolParams): Drawn => {
  const light = (p.surface ?? "light") === "light";
  const color = light ? c("brand.light.text") : c("brand.dark.text");
  const moon = light ? c("brand.light.accent") : c("brand.dark.accent");
  const scale = p.scale ?? 1; // size is in the 32×32 glyph box, scaled like any other piece
  const body = g({ transform: `translate(${p.x} ${p.y}) scale(${scale})` },
    el("rect", { x: 5, y: 3, width: 5.5, height: 26, rx: 2.75, fill: color }),
    el("circle", { cx: 17.5, cy: 20.5, r: 7.3, fill: "none", stroke: color, "stroke-width": 4.6 }),
    el("circle", { cx: 27.5, cy: 9, r: 2.8, fill: moon }));
  return drawn([body]);
};

/** The brand symbol ("b" with a moon, I5), in a 32×32 box before `scale`. Favicon and avatar are built from this. */
export const symbol = definePiece<SymbolParams>(
  "symbol",
  { x: pos(), y: pos(), surface: surfaceParam, scale: num({ min: 0.1, max: 20 }) } satisfies Schema,
  drawSymbol,
);

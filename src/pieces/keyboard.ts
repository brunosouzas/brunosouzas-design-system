// The `keyboard` prop piece (spec illustration-pieces, "Keyboard"; change
// supporting-characters, design §4): the base of a laptop, a white slab with a
// row of key marks. Chaves types at it (`types`, supporting-cast.ts); a cover
// can draw it alone, under a `codePanel` as the screen.
//
// Why the keys sit in a `stroke: none` group: the cover command wraps every
// body in an ink-stroked group (cover.ts, the outlined group), so a key with
// only a fill would take a 4-unit outline there and blur into a blob; the slab
// carries its own stroke, so the piece draws the same alone, in a cover and in
// Chaves's hand (as `sheet` keeps its bars).
//
// What can go wrong: the schema rejects a width outside 80 to 300, a missing x
// or y, an unknown surface and any other parameter (no colour, no text), naming it.
import { tokens } from "../../tokens/generated/tokens.ts";
import { drawn, el, g } from "./node.ts";
import { inkOf, surfaceParam, type SurfaceName } from "./ink.ts";
import { num, pos, type Schema } from "./params.ts";
import { definePiece } from "./piece.ts";

export type KeyboardParams = { x: number; y: number; width?: number; surface?: SurfaceName };

/** The slab's height and the key marks' measures (design §4, from the approved concept sheet's deck). */
const SLAB_HEIGHT = 16;
const SLAB_RADIUS = 6;
const KEY = { inset: 16, top: 6, pitch: 21, width: 12, height: 4, radius: 2 } as const;

/** Key marks that fit the slab: the first `KEY.inset` in, each `KEY.pitch` apart, the last at least `KEY.inset` from the right edge. */
const keyCount = (width: number): number => Math.floor((width - 2 * KEY.inset - KEY.width) / KEY.pitch) + 1;

/** The laptop's base: a white slab outlined in the surface's ink line, with ink key marks. */
export const keyboard = definePiece<KeyboardParams>(
  "keyboard",
  { x: pos(), y: pos(), width: num({ min: 80, max: 300 }), surface: surfaceParam } satisfies Schema,
  ({ x, y, width = 150, surface = "light" }) => {
    const keys = Array.from({ length: keyCount(width) }, (_, i) =>
      // Marks on a white face stay ink on the dark surface too (ADR 0009).
      el("rect", { x: x + KEY.inset + KEY.pitch * i, y: y + KEY.top, width: KEY.width, height: KEY.height, rx: KEY.radius, fill: tokens.color.ink }));
    return drawn([
      g({ "data-piece": "keyboard" },
        el("rect", { x, y, width, height: SLAB_HEIGHT, rx: SLAB_RADIUS, fill: tokens.color.white, stroke: inkOf({ surface }).line, "stroke-width": tokens.outline.block, "stroke-linejoin": "round" }),
        g({ stroke: "none" }, ...keys)),
    ]);
  },
);

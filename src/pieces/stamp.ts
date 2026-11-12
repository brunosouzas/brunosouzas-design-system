// The `stamp` piece (spec illustration-pieces, "Piece catalogue"), moved
// unchanged from library.ts by change supporting-characters (card 337): Balão
// holds a stamp (`holdsStamp`, supporting-cast.ts), and supporting-cast.ts
// cannot import library.ts, which imports it to list Balão in PIECES (the same
// cycle paper.ts broke for `pill` and `sheet`). library.ts re-exports it and
// keeps it at its place in PIECES. test/fixtures/stamp-0.12.0.json pins its
// 0.12.0 drawings ("Stamp calls of 0.12.0 unchanged").
//
// What can go wrong: the schema rejects an empty word, a radius under 12 and an
// unknown shape, naming the parameter. The word is drawn at size 27 whatever
// the radius, so a long word overhangs a small stamp: fitting it is the caller's job.
import { tokens } from "../../tokens/generated/tokens.ts";
import { drawn, el, g } from "./node.ts";
import { col, colour, label, pos, size } from "./params.ts";
import { definePiece } from "./piece.ts";

export type StampParams = { cx: number; cy: number; word: string; fill?: string; r?: number; rotate?: number; shape?: "round" | "rect" };
/** Rubber stamp, round (dashed inner ring) or rectangular, tilted, with one word. */
export const stamp = definePiece<StampParams>(
  "stamp",
  { cx: pos(), cy: pos(), word: label(), fill: col(), r: size(false, 12), rotate: { kind: "number" }, shape: { kind: "enum", values: ["round", "rect"] } },
  ({ cx, cy, word, fill = "color.state.healthy", r = 40, rotate = -12, shape = "round" }) => {
    const turn = `rotate(${rotate} ${cx} ${cy})`;
    const face =
      shape === "round"
        ? [
            el("circle", { cx, cy, r, fill: colour(fill, "fill") }),
            el("circle", { cx, cy, r: r - 10, fill: "none", stroke: tokens.color.white, "stroke-width": tokens.outline.small, "stroke-dasharray": "6 5" }),
          ]
        : [
            el("rect", { x: cx - r * 1.6, y: cy - r * 0.7, width: r * 3.2, height: r * 1.4, rx: 8, fill: colour(fill, "fill") }),
            el("rect", { x: cx - r * 1.6 + 8, y: cy - r * 0.7 + 8, width: r * 3.2 - 16, height: r * 1.4 - 16, rx: 4, fill: "none", stroke: tokens.color.white, "stroke-width": tokens.outline.small }),
          ];
    return drawn([g({ transform: turn }, ...face)], [el("text", { x: cx, y: cy + 10, "font-size": 27, "font-weight": tokens.font.weightHeavy, transform: turn }, word)]);
  },
);

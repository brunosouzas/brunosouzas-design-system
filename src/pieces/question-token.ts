// `questionToken` (spec illustration-pieces, "Question token", "Question token
// parameters"; change sdd-scene-pieces, design §4): the open question as an
// object that travels in a scene or sits on a cover, in the v2 grammar of ADR
// 0009. Its mark is exactly a `sheet` question row's (a white disc of radius 13
// outlined at `outline.small`, a `?` at size 19 and weight heavy, baseline +7),
// because in the SDD scene the token travels into a sheet and becomes a row.
//
// Why a piece of its own: `countBadge` is a stackledger map sticker (its face is
// the surface's panel, its size grows from `textSize` with the map tokens), so
// the gate-0 storyboard's `?` drawn with it read as a dark disc on the dark
// surface and tied the scene's object to the map's evolution.
//
// The disc carries its own stroke, so it draws the same inside the cover
// command's outlined group as in a scene; the `?` carries its own font, so it
// reads the same through `toReact` where no labels group exists. `scale` scales
// the outline with the disc (as `emote`), so a large token keeps the row's
// proportions.
//
// What can go wrong: the schema rejects a missing position, a scale outside
// (0, 10], an unknown surface, and any colour or text parameter (the token takes
// none), naming the parameter.
import { tokens } from "../../tokens/generated/tokens.ts";
import { drawn, el, g, type Drawn } from "./node.ts";
import { inkOf, surfaceParam, type SurfaceName } from "./ink.ts";
import { pos, type Schema } from "./params.ts";
import { definePiece } from "./piece.ts";

/** The radius of a sheet question row's disc (`sheet` in paper.ts). */
const MARK_RADIUS = 13;
/** The `?` of a sheet question row: its size, and its baseline below the disc's centre. */
const GLYPH_SIZE = 19;
const GLYPH_BASELINE = 7;

export type QuestionTokenParams = { cx: number; cy: number; scale?: number; surface?: SurfaceName };

const drawQuestionToken = ({ cx, cy, scale = 1, surface = "light" }: QuestionTokenParams): Drawn => {
  // The ink line of the surface: ink on light, `surface.dark.muted` on dark (ADR 0009's dark rule).
  const { line } = inkOf({ surface });
  const attrs: Record<string, string> = scale === 1
    ? { "data-piece": "questionToken" }
    : { "data-piece": "questionToken", transform: `translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})` };
  return drawn(
    [g(attrs, el("circle", { cx, cy, r: MARK_RADIUS, fill: tokens.color.white, stroke: line, "stroke-width": tokens.outline.small }))],
    [g(attrs, el("text", {
      x: cx,
      y: cy + GLYPH_BASELINE,
      "font-family": tokens.font.sans,
      "font-size": GLYPH_SIZE,
      "font-weight": tokens.font.weightHeavy,
      fill: tokens.color.ink,
      "text-anchor": "middle",
    }, "?"))],
  );
};

/** The open question as an object: a white disc with a `?`, the mark of a sheet's question row. */
export const questionToken = definePiece<QuestionTokenParams>(
  "questionToken",
  { cx: pos(), cy: pos(), scale: { kind: "number", min: 0, exclusiveMin: true, max: 10 }, surface: surfaceParam } satisfies Schema,
  drawQuestionToken,
);

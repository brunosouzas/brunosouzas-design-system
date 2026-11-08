// A title in the brand's serif (change headline-piece, card 307; studio
// decision I9: Source Serif 4 for titles). The default share image of
// brunosouzas.com is its first use: the slogan in three lines on an `og` image.
//
// Like `edgeLabel`, it draws nothing in `body`: its group is `text`, which a
// cover-frame format writes in the labels group, outside the ink-outlined
// group, so no stroke reaches the letters. One `g` carries every shared
// attribute (overriding the labels group's size, weight, fill and anchor), and
// one `text` per line carries only its position. Values match the approved
// preview: −0.01 em tracking, written in user units, and a 1.1 × size step.
import { tokens } from "../../tokens/generated/tokens.ts";
import { surfaceParam, type SurfaceName } from "./ink.ts";
import { drawn, el, g, r2, type Drawn } from "./node.ts";
import { label, num, pos, type Schema } from "./params.ts";
import { definePiece } from "./piece.ts";

export type HeadlineParams = { x: number; y: number; lines: string[]; size?: number; anchor?: "start" | "middle" | "end"; surface?: SurfaceName };

/** Line step as a share of the size. */
const LEADING = 1.1;

const drawHeadline = ({ x, y, lines, size = 64, anchor = "start", surface = "light" }: HeadlineParams): Drawn =>
  drawn(
    [],
    [
      g(
        {
          "data-piece": "headline",
          "font-family": tokens.font.serif,
          "font-size": size,
          "font-weight": tokens.font.weightBold,
          "letter-spacing": r2(-size / 100),
          fill: tokens.brand[surface].text,
          "text-anchor": anchor,
        },
        ...lines.map((line, i) => el("text", { x, y: r2(y + i * LEADING * size) }, line)),
      ),
    ],
  );

/** One to four lines of a title in Source Serif 4 Bold, the first baseline at (x, y). */
export const headline = definePiece<HeadlineParams>(
  "headline",
  {
    x: pos(),
    y: pos(),
    lines: { kind: "array", required: true, minItems: 1, maxItems: 4, of: label() },
    size: num({ min: 24, max: 160, integer: true }),
    anchor: { kind: "enum", values: ["start", "middle", "end"] },
    surface: surfaceParam,
  } satisfies Schema,
  drawHeadline,
);

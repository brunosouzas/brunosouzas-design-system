// The brand notation: 19 icons (13 EIP + 3 delivery + 3 AI), one grammar,
// used on covers, home, LinkedIn and GitHub (identity studio I11). Separate
// from the 26 body-diagram icons (`eip-icons.ts`): never shared, never the
// same export (review finding S of AB#268's spec round). Redraws each
// pattern's market-recognised silhouette in the new ink-outline grammar —
// never the EIP book's own artwork, per the brand strategy.
//
// Geometry ported unchanged from the approved phase-3/4 source
// (`~/.hermes/cache/scratch/ab267/final.py`'s `icons()`).
import { drawn, el, g, type Drawn, type SvgNode } from "./node.ts";
import { surfaceParam, type SurfaceName } from "./ink.ts";
import { pos, num, type Schema } from "./params.ts";
import { definePiece } from "./piece.ts";
import { colour } from "./params.ts";

export const BRAND_NOTATION_ICON_NAMES = [
  "message", "pointToPointChannel", "messageQueue", "publishSubscribeChannel", "contentBasedRouter",
  "messageFilter", "splitter", "aggregator", "messageTranslator", "contentEnricher",
  "correlationIdentifier", "idempotentReceiver", "deadLetterChannel",
  "pipelineStage", "gateToProduction", "rollback",
  "toolCall", "contextWindow", "guardrail",
] as const;
export type BrandNotationIconName = (typeof BRAND_NOTATION_ICON_NAMES)[number];

type Palette = { c: string; a: string; f: string; bg: string; mu: string };

const ln = (d: string, c: string, w = 4, dash = false): SvgNode =>
  el("path", { d, stroke: c, "stroke-width": w, "stroke-linecap": "round", "stroke-linejoin": "round", fill: "none", ...(dash ? { "stroke-dasharray": "0.1 8" } : {}) });
const dot = (x: number, y: number, col: string, r = 5): SvgNode => el("circle", { cx: x, cy: y, r, fill: col });
const sq = (x: number, y: number, col: string, s = 11): SvgNode => el("rect", { x: x - s / 2, y: y - s / 2, width: s, height: s, rx: 2, fill: col });
const node = (x: number, y: number, a: string): SvgNode => el("path", { d: `M${x} ${y - 8} L${x + 8} ${y} L${x} ${y + 8} L${x - 8} ${y} Z`, fill: a });

const DRAW: Record<BrandNotationIconName, (p: Palette) => SvgNode[]> = {
  message: (p) => [dot(24, 24, p.c, 8)],
  pointToPointChannel: (p) => [ln("M6 24 H38", p.c), el("circle", { cx: 42, cy: 24, r: 5, fill: p.bg, stroke: p.c, "stroke-width": 3.5 })],
  messageQueue: (p) => [ln("M6 24 H38", p.c, 4, true), dot(14, 24, p.c), dot(24, 24, p.c), el("circle", { cx: 42, cy: 24, r: 5, fill: p.bg, stroke: p.c, "stroke-width": 3.5 })],
  publishSubscribeChannel: (p) => {
    const ring = (x: number, y: number) => el("circle", { cx: x, cy: y, r: 5, fill: p.bg, stroke: p.c, "stroke-width": 3.5 });
    return [ln("M4 24 H19 M29 24 H40 M24 19 V8 M24 29 V40", p.c), ring(24, 24), ring(43, 24), ring(24, 6), ring(24, 42)];
  },
  contentBasedRouter: (p) => [ln("M4 24 H16 M32 24 H34 Q38 24 38 20 V14 Q38 10 42 10 H44 M34 24 Q38 24 38 28 V34 Q38 38 42 38 H44", p.c), node(24, 24, p.a)],
  messageFilter: (p) => [ln("M4 24 H44", p.c), ln("M24 24 V36", p.c), ln("M18 40 H30", p.c), node(24, 24, p.a)],
  splitter: (p) => [
    ln("M4 24 H16 M30 16 H44 M30 24 H44 M30 32 H44", p.c), sq(10, 24, p.c, 12), sq(40, 16, p.c, 7), sq(40, 24, p.c, 7), sq(40, 32, p.c, 7),
    el("path", { d: "M22 14 V34", stroke: p.c, "stroke-width": 4, "stroke-linecap": "round" }),
  ],
  aggregator: (p) => [
    ln("M4 16 H18 M4 24 H18 M4 32 H18 M32 24 H44", p.c), sq(8, 16, p.c, 7), sq(8, 24, p.c, 7), sq(8, 32, p.c, 7),
    el("path", { d: "M26 14 V34", stroke: p.c, "stroke-width": 4, "stroke-linecap": "round" }), sq(40, 24, p.c, 12),
  ],
  messageTranslator: (p) => [ln("M4 24 H44", p.c), dot(14, 24, p.c, 6), sq(36, 24, p.c, 12)],
  contentEnricher: (p) => [ln("M4 24 H44", p.c), ln("M24 8 V18", p.c, 4, true), sq(16, 24, p.c, 10), el("rect", { x: 28, y: 16, width: 14, height: 16, rx: 2, fill: p.c })],
  correlationIdentifier: (p) => [
    sq(14, 24, p.c, 14), el("circle", { cx: 14, cy: 24, r: 3, fill: p.bg }), ln("M22 24 H28", p.c, 3), sq(36, 24, p.c, 14), el("circle", { cx: 36, cy: 24, r: 3, fill: p.bg }),
  ],
  idempotentReceiver: (p) => [
    ln("M4 18 H34 M4 30 H34", p.c), dot(12, 18, p.c), dot(12, 30, p.c), el("rect", { x: 34, y: 12, width: 10, height: 24, rx: 3, fill: p.c }), ln("M20 30 L28 30", p.mu, 3),
  ],
  deadLetterChannel: (p) => [ln("M4 14 H20 Q26 14 26 20 V30", p.f, 4, true), ln("M14 36 V42 H38 V36", p.f, 3.5), dot(26, 36, p.f, 4)],
  pipelineStage: (p) => [ln("M4 24 H44", p.c), ln("M18 14 V34 M32 14 V34", p.c), dot(10, 24, p.c)],
  gateToProduction: (p) => [ln("M4 24 H44", p.c), el("rect", { x: 20, y: 10, width: 8, height: 28, rx: 3, fill: p.a }), dot(10, 24, p.c), el("circle", { cx: 42, cy: 24, r: 5, fill: p.bg, stroke: p.c, "stroke-width": 3.5 })],
  rollback: (p) => [ln("M40 24 H14", p.c), ln("M14 24 Q6 24 6 16 Q6 8 14 8 H24", p.c, 4, true), el("circle", { cx: 42, cy: 24, r: 5, fill: p.bg, stroke: p.c, "stroke-width": 3.5 })],
  toolCall: (p) => [
    ln("M8 18 H32", p.c), ln("M32 32 H10", p.c, 4, true), el("circle", { cx: 6, cy: 25, r: 5, fill: p.bg, stroke: p.c, "stroke-width": 3.5 }), el("rect", { x: 34, y: 12, width: 10, height: 24, rx: 3, fill: p.c }),
  ],
  contextWindow: (p) => [
    el("rect", { x: 6, y: 12, width: 36, height: 24, rx: 5, fill: "none", stroke: p.c, "stroke-width": 3.5 }), dot(14, 24, p.c, 3.5), dot(22, 24, p.c, 3.5), dot(30, 24, p.c, 3.5),
    el("path", { d: "M36 20 V28", stroke: p.c, "stroke-width": 3 }),
  ],
  guardrail: (p) => [ln("M4 24 H44", p.c), el("path", { d: "M24 8 V40", stroke: p.a, "stroke-width": 4 }), dot(12, 24, p.c), el("circle", { cx: 40, cy: 24, r: 5, fill: p.bg, stroke: p.c, "stroke-width": 3.5 })],
};

export type BrandNotationIconParams = { name: BrandNotationIconName; x: number; y: number; surface?: SurfaceName; scale?: number };

const c = (path: string): string => colour(path);

const drawBrandNotationIcon = (p: BrandNotationIconParams): Drawn => {
  const light = (p.surface ?? "light") === "light";
  const palette: Palette = {
    c: light ? c("brand.light.text") : c("brand.dark.text"),
    a: light ? c("brand.light.accent") : c("brand.dark.accent"),
    f: light ? c("brand.light.failure") : c("brand.dark.failure"),
    bg: light ? c("brand.light.bg") : c("brand.dark.bg"),
    mu: light ? c("brand.light.textMuted") : c("brand.dark.textMuted"),
  };
  const glyph = DRAW[p.name](palette);
  return drawn([g({ "data-piece": `brand-icon-${p.name}`, transform: `translate(${p.x} ${p.y}) scale(${p.scale ?? 1})`, stroke: "none" }, ...glyph)]);
};

/** One of the 19 brand notation icons (I11): 13 EIP + 3 delivery + 3 AI, a 48×48 glyph before `scale`. */
export const brandNotationIcon = definePiece<BrandNotationIconParams>(
  "brandNotationIcon",
  { name: { kind: "enum", required: true, values: BRAND_NOTATION_ICON_NAMES }, x: pos(), y: pos(), surface: surfaceParam, scale: num({ min: 0.25, max: 8 }) } satisfies Schema,
  drawBrandNotationIcon,
);

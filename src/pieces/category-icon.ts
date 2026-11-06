// The "Ferramentas pessoais" / "Personal tools" category icon (design.md
// decision 4): the only site category with no notation or diagram icon,
// requested of the design system in phase 4 (A6), glyph choice the agent's
// call (triage TRI-1). Ported from `~/.hermes/cache/scratch/ab267/phase4.py`'s
// `cat_icon()`, the "else" branch (a wrench crossing a screwdriver, a ring
// for the bolt) — the other three site categories already read from the
// brand notation / diagram grammar and are not this piece's job.
import { drawn, el, g, type Drawn } from "./node.ts";
import { surfaceParam, type SurfaceName } from "./ink.ts";
import { pos, num, type Schema } from "./params.ts";
import { definePiece } from "./piece.ts";
import { colour } from "./params.ts";

export const CATEGORY_ICON_NAMES = ["personalTools"] as const;
export type CategoryIconName = (typeof CATEGORY_ICON_NAMES)[number];

const c = (path: string): string => colour(path);

export type CategoryIconParams = { category: CategoryIconName; x: number; y: number; surface?: SurfaceName; scale?: number };

const drawCategoryIcon = (p: CategoryIconParams): Drawn => {
  const light = (p.surface ?? "light") === "light";
  const text = light ? c("brand.light.text") : c("brand.dark.text");
  const accent = light ? c("brand.light.accent") : c("brand.dark.accent");
  const glyph = [
    el("path", { d: "M12 36 L28 20 M24 12 L36 24", stroke: text, "stroke-width": 5, "stroke-linecap": "round", "stroke-linejoin": "round", fill: "none" }),
    el("circle", { cx: 16, cy: 32, r: 6, fill: "none", stroke: accent, "stroke-width": 3.5 }),
  ];
  return drawn([g({ "data-piece": "category-icon-personal-tools", transform: `translate(${p.x} ${p.y}) scale(${p.scale ?? 1})`, stroke: "none" }, ...glyph)]);
};

/** The site's fourth category icon ("Ferramentas pessoais" / "Personal tools"), neutral (no track colour), a 48×48 glyph before `scale`. */
export const categoryIcon = definePiece<CategoryIconParams>(
  "categoryIcon",
  { category: { kind: "enum", required: true, values: CATEGORY_ICON_NAMES }, x: pos(), y: pos(), surface: surfaceParam, scale: num({ min: 0.25, max: 8 }) } satisfies Schema,
  drawCategoryIcon,
);

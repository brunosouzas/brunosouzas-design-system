// The site's category badge (change site-palette-and-category-badges, design.md
// Decision 2; owner's choice Q7 of card 302): a disc in the default tone of the
// category's track family, ringed in that tone's cover ring, with a glyph on
// it. Integration, delivery and AI take a brand notation glyph; personal tools
// keeps its own (a wrench crossing a screwdriver, a ring for the bolt), ported
// from `~/.hermes/cache/scratch/ab267/phase4.py`'s `cat_icon()`. The geometry is
// the approved preview (`~/.hermes/cache/scratch/ab302/cat/cat.mjs`, 168 x 168)
// at a quarter: a 42 x 42 box before `scale`.
import { brandNotationIcon, type BrandNotationIconName } from "./brand-notation-icons.ts";
import { drawn, el, g, type Drawn, type SvgNode } from "./node.ts";
import { colour, num, pos, type Schema } from "./params.ts";
import { definePiece } from "./piece.ts";

export const CATEGORY_ICON_NAMES = ["integration", "delivery", "aiEngineering", "personalTools"] as const;
export type CategoryIconName = (typeof CATEGORY_ICON_NAMES)[number];

/** The badge's box before `scale` (spec cover-cli, "Icon output"). */
export const CATEGORY_ICON_SIZE = 42;

const TRACK: Record<CategoryIconName, string> = {
  integration: "trackIntegration",
  delivery: "trackDelivery",
  aiEngineering: "trackAi",
  personalTools: "trackPersonal",
};
const GLYPH: Record<Exclude<CategoryIconName, "personalTools">, BrandNotationIconName> = {
  integration: "pointToPointChannel",
  delivery: "gateToProduction",
  aiEngineering: "contextWindow",
};
const KEBAB: Record<CategoryIconName, string> = { integration: "integration", delivery: "delivery", aiEngineering: "ai-engineering", personalTools: "personal-tools" };

export type CategoryIconParams = { category: CategoryIconName; x: number; y: number; scale?: number };

/** Personal tools' own glyph, in its 48 x 48 box, at 9, 9 and scale 0.5 like a notation glyph. */
const personalToolsGlyph = (): SvgNode =>
  g(
    { transform: "translate(9 9) scale(0.5)", stroke: "none" },
    el("path", { d: "M12 36 L28 20 M24 12 L36 24", stroke: colour("brand.light.text"), "stroke-width": 5, "stroke-linecap": "round", "stroke-linejoin": "round", fill: "none" }),
    el("circle", { cx: 16, cy: 32, r: 6, fill: "none", stroke: colour("brand.light.accent"), "stroke-width": 3.5 }),
  );

const drawCategoryIcon = (p: CategoryIconParams): Drawn => {
  const track = TRACK[p.category];
  const disc = el("circle", { cx: 21, cy: 21, r: 19.5, fill: colour(`coverBackground.${track}.fill`), stroke: colour(`coverBackground.${track}.ring`), "stroke-width": 1 });
  const glyph = p.category === "personalTools" ? personalToolsGlyph() : brandNotationIcon({ name: GLYPH[p.category], x: 9, y: 9, scale: 0.5, surface: "light" }).body[0]!;
  return drawn([g({ "data-piece": `category-icon-${KEBAB[p.category]}`, transform: `translate(${p.x} ${p.y}) scale(${p.scale ?? 1})` }, disc, glyph)]);
};

/** One of the site's four category badges: the glyph on a disc in its track's default tone, a 42×42 box before `scale`. */
export const categoryIcon = definePiece<CategoryIconParams>(
  "categoryIcon",
  { category: { kind: "enum", required: true, values: CATEGORY_ICON_NAMES }, x: pos(), y: pos(), scale: num({ min: 0.25, max: 8 }) } satisfies Schema,
  drawCategoryIcon,
);

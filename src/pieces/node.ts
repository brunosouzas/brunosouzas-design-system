// SVG node contract of the illustration pieces (spec illustration-pieces;
// design §3 of the illustration-pieces change).
//
// Why: a piece returns plain data, not markup or React, so the same drawing
// becomes an SVG string for covers and diagrams and React elements for
// Remotion scenes, and tests can inspect it without a browser.
//
// What can go wrong: nothing here reads files or the clock; helpers only build
// objects. Colour and number guards live in params.ts.
import { tokens } from "../../tokens/generated/tokens.ts";

export const SVG_TAGS = [
  "svg",
  "g",
  "title",
  "desc",
  "defs",
  "clipPath",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "path",
  "text",
] as const;
export type SvgTag = (typeof SVG_TAGS)[number];

export type AttrValue = string | number;
export type Attrs = Readonly<Record<string, AttrValue>>;
export type SvgNode = { readonly tag: SvgTag; readonly attrs: Attrs; readonly children: readonly (SvgNode | string)[] };

/** What a piece draws: shapes go in the outlined group, words and glyphs after every shape. */
export type Drawn = { readonly body: readonly SvgNode[]; readonly text: readonly SvgNode[] };

type Child = SvgNode | string | null | false | undefined;

export const el = (tag: SvgTag, attrs: Attrs = {}, ...children: Child[]): SvgNode => ({
  tag,
  attrs,
  children: children.filter((child): child is SvgNode | string => child !== null && child !== false && child !== undefined),
});

export const g = (attrs: Attrs, ...children: Child[]): SvgNode => el("g", attrs, ...children);

export const drawn = (body: readonly SvgNode[], text: readonly SvgNode[] = []): Drawn => ({ body, text });

/**
 * Hard offset shadow (STY-1): an ink copy of the shape translated by `offset`,
 * then the shape. Inside the outlined group the copy keeps the outline too, as
 * the motion components' shadow does.
 */
export const shadowed = (shape: SvgNode, offset: number = tokens.shadow.block): SvgNode[] => [
  { ...shape, attrs: { ...shape.attrs, fill: tokens.color.ink, transform: `translate(${offset} ${offset})` } },
  shape,
];

/** Rounds to two decimals so computed geometry stays short and stable in the output. */
export const r2 = (value: number): number => Math.round(value * 100) / 100;

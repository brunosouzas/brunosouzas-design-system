// Ink helpers shared by the metro, diagram and body diagram pieces (moved from
// metro.ts unchanged; change body-diagram-pieces, design §8). Internal: the
// package does not export this module.
import { tokens } from "../../tokens/generated/tokens.ts";
import { el, r2, type Attrs, type SvgNode } from "./node.ts";
import type { ParamSpec, Problem, Schema } from "./params.ts";

export type Point = [number, number];
export const SURFACES = ["light", "dark"] as const;
export type SurfaceName = (typeof SURFACES)[number];
export type Ink = { surface?: SurfaceName; inkScale?: number };

const ink = tokens.color.ink;
const font = tokens.font.sans;
const M = tokens.map;

export const surfaceParam: ParamSpec = { kind: "enum", values: SURFACES };
export const inkScaleParam: ParamSpec = { kind: "number", min: 0.25, max: 8 };
export const inkSchema: Schema = { surface: surfaceParam, inkScale: inkScaleParam };

/** Collects the limits between parameters (piece.ts, `relations`). */
export const limits = (...checks: (Problem | false)[]): Problem[] => checks.filter((check): check is Problem => check !== false);

/** The surface's colours and the ink measures at a scale. */
export const inkOf = ({ surface = "light", inkScale = 1 }: Ink) => {
  const s = tokens.surface[surface];
  return { s, outline: M.outline * inkScale, rim: s.rimWidth * inkScale, offset: M.shadow * inkScale };
};

/** Outlined shapes need room for their ink: smallest dimension ≥ 4 × outline. */
export const roomFor = (name: string, smallest: number, inkParams: Ink): Problem | false => {
  const need = 4 * inkOf(inkParams).outline;
  return smallest < need && { path: name, message: `leaves no room for the outline: needs at least ${r2(need)} at this ink scale` };
};
export const atLeast = (name: string, value: number, least: number, what: string): Problem | false =>
  value < least && { path: name, message: `must be at least ${what} (${r2(least)}), found ${r2(value)}` };

export type Shape = (dx: number, dy: number, attrs: Attrs) => SvgNode;

/** The ink sticker (metro-and-diagram-pieces design §3): shadow copy, rim on dark, then the face. */
export const sticker = (shape: Shape, face: string, inkParams: Ink): SvgNode[] => {
  const { s, outline, rim, offset } = inkOf(inkParams);
  const wide = r2(outline + 2 * rim);
  return [
    // Joins are set here, so a sticker draws the same inside any group.
    shape(offset, offset, { fill: s.shadow, stroke: s.shadow, "stroke-width": wide, "stroke-linejoin": "round" }),
    ...(s.rimWidth > 0 ? [shape(0, 0, { fill: s.rim, stroke: s.rim, "stroke-width": wide, "stroke-linejoin": "round" })] : []),
    shape(0, 0, { fill: face, stroke: ink, "stroke-width": r2(outline), "stroke-linejoin": "round" }),
  ];
};

// Every text sets its own anchor, size and weight, so a surrounding group (a cover's label style) does not leak in.
export const words = (x: number, y: number, value: string, attrs: Attrs): SvgNode => el("text", { x: r2(x), y: r2(y), "font-family": font, ...attrs }, value);

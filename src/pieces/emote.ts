// `emote` (spec illustration-pieces, "Emote", "Emote colours", "Emotes carry
// their own stroke", "Ink on the dark surface"): eight reaction symbols with a
// fixed meaning (ADR 0005), drawn in the v2 grammar of ADR 0009. Moved from
// cast.ts in 0.7.0, when the seven-role cast was removed (ADR 0007 amendment).
//
// The v2 drawing is the one the owner approved in the card 301 preview: no hard
// shadow; the idea bulb glows in the cast's eye amber (`cast.eyes`) on a
// `brand.light.border` base, its burst is rays only (no disc); drops and Zs are
// white; the heart takes the one accent; `problem` and `refused` keep the
// failure colour and `worked` the healthy one, because they mean it.
//
// On the dark surface the outlines, the rays and the Z casings take
// `surface.dark.muted` (ink vanishes on black, the cast's rule); the marks drawn
// over a light or state fill (?, !, tick, X, the bulb filament) stay ink. The
// shapes are the same on both surfaces, only those strokes change.
//
// What can go wrong: the schema rejects an unknown kind, a scale outside
// (0, 10] or an unknown surface, naming the parameter.
import { drawn, el, g, type Drawn, type SvgNode } from "./node.ts";
import { surfaceParam, type SurfaceName } from "./ink.ts";
import { colour, pos, type Schema } from "./params.ts";
import { definePiece } from "./piece.ts";

export const EMOTE_KINDS = ["idea", "doubt", "problem", "worked", "refused", "pressure", "liked", "waiting"] as const;
export type EmoteKind = (typeof EMOTE_KINDS)[number];
export type EmoteParams = { kind: EmoteKind; x: number; y: number; scale?: number; burst?: boolean; surface?: SurfaceName };

const c = (path: string): string => colour(path);
const ink = () => c("color.ink");

/** The strokes that sit on the background: ink on light, the dark surface's muted grey on dark. */
type Line = string;
const lineOf = (surface: SurfaceName | undefined): Line => (surface === "dark" ? c("surface.dark.muted") : ink());

const rays = (line: Line, cx: number, cy: number, r1: number, r2: number, n: number, from = -150, to = -30) =>
  Array.from({ length: n }, (_, i) => {
    const a = ((from + (i * (to - from)) / (n - 1)) * Math.PI) / 180;
    const r = (v: number) => Math.round(v * 100) / 100;
    return el("path", { d: `M${r(cx + r1 * Math.cos(a))},${r(cy + r1 * Math.sin(a))} L${r(cx + r2 * Math.cos(a))},${r(cy + r2 * Math.sin(a))}`, stroke: line, "stroke-width": 6, "stroke-linecap": "round" });
  });
/** The outline of an emote's body shape. */
const outline = (line: Line) => ({ stroke: line, "stroke-width": 5, "stroke-linejoin": "round" as const, "stroke-linecap": "round" as const });
const disc = (line: Line, cx: number, cy: number, r: number, fill: string) => el("circle", { cx, cy, r, fill, ...outline(line) });
const zed = (line: Line, x: number, y: number, s: number) => {
  // A Z of height s with its top-left at (x, y - s): a casing in the line colour, a white fill.
  const w = s * 0.72, d = `M${x},${y - s} H${x + w} L${x},${y} H${x + w}`;
  return [
    el("path", { d, fill: "none", stroke: line, "stroke-width": s * 0.34, "stroke-linecap": "round", "stroke-linejoin": "round" }),
    el("path", { d, fill: "none", stroke: c("color.white"), "stroke-width": s * 0.16, "stroke-linecap": "round", "stroke-linejoin": "round" }),
  ];
};

const drawEmote = (p: EmoteParams): Drawn => {
  const { kind, x: cx, y: cy } = p, burst = p.burst ?? true, s = p.scale ?? 1;
  const line = lineOf(p.surface);
  const parts: SvgNode[] = [];
  switch (kind) {
    case "idea": {
      if (burst) parts.push(...rays(line, cx, cy - 6, 50, 72, 7, -180, 0));
      const bulb = `M${cx - 30},${cy - 10} A34,34 0 1 1 ${cx + 30},${cy - 10} Q${cx + 22},${cy + 6} ${cx + 18},${cy + 22} H${cx - 18} Q${cx - 22},${cy + 6} ${cx - 30},${cy - 10} Z`;
      parts.push(
        el("path", { d: bulb, fill: c("cast.eyes"), ...outline(line) }),
        el("path", { d: `M${cx - 16},${cy - 22} Q${cx - 12},${cy - 32} ${cx - 2},${cy - 34}`, fill: "none", stroke: c("color.white"), "stroke-width": 6, "stroke-linecap": "round" }),
        el("path", { d: `M${cx - 8},${cy + 22} V${cy} L${cx},${cy + 8} L${cx + 8},${cy} V${cy + 22}`, fill: "none", stroke: ink(), "stroke-width": 4, "stroke-linejoin": "round" }),
        el("rect", { x: cx - 18, y: cy + 22, width: 36, height: 12, rx: 3, fill: c("brand.light.border"), ...outline(line), "stroke-width": 4 }),
        el("rect", { x: cx - 14, y: cy + 34, width: 28, height: 10, rx: 5, fill: c("brand.light.border"), ...outline(line), "stroke-width": 4 }),
      );
      break;
    }
    case "doubt":
      parts.push(
        disc(line, cx, cy, 40, c("color.white")),
        el("path", { d: `M${cx - 14},${cy - 12} Q${cx - 14},${cy - 28} ${cx},${cy - 28} Q${cx + 16},${cy - 28} ${cx + 16},${cy - 13} Q${cx + 16},${cy - 2} ${cx + 2},${cy + 4} V${cy + 10}`, fill: "none", stroke: ink(), "stroke-width": 9, "stroke-linecap": "round", "stroke-linejoin": "round" }),
        el("circle", { cx: cx + 2, cy: cy + 24, r: 6, fill: ink() }),
      );
      break;
    case "problem":
      if (burst) parts.push(...rays(line, cx, cy, 48, 70, 5));
      parts.push(
        el("path", { d: `M${cx},${cy - 44} L${cx + 46},${cy + 34} H${cx - 46} Z`, fill: c("color.state.failure"), ...outline(line) }),
        el("path", { d: `M${cx},${cy - 18} V${cy + 8}`, stroke: ink(), "stroke-width": 9, "stroke-linecap": "round" }),
        el("circle", { cx, cy: cy + 22, r: 5.5, fill: ink() }),
      );
      break;
    case "pressure":
      // Two white drops; no highlight (a white stroke on a white drop would not show).
      for (const [dx, dy, k] of [[0, 0, 1], [30, 22, 0.6]]) parts.push(
        el("path", { d: `M${cx + dx},${cy + dy - 34 * k} Q${cx + dx + 24 * k},${cy + dy} ${cx + dx},${cy + dy + 12 * k} Q${cx + dx - 24 * k},${cy + dy} ${cx + dx},${cy + dy - 34 * k} Z`, fill: c("color.white"), ...outline(line), "stroke-width": 4 }),
      );
      break;
    case "liked":
      parts.push(el("path", { d: `M${cx},${cy + 30} C${cx - 50},${cy} ${cx - 34},${cy - 40} ${cx},${cy - 16} C${cx + 34},${cy - 40} ${cx + 50},${cy} ${cx},${cy + 30} Z`, fill: c("brand.light.accent"), ...outline(line) }));
      break;
    case "worked":
      if (burst) parts.push(...rays(line, cx, cy, 48, 68, 5));
      parts.push(disc(line, cx, cy, 38, c("color.state.healthy")), el("path", { d: `M${cx - 16},${cy} L${cx - 4},${cy + 12} L${cx + 18},${cy - 12}`, fill: "none", stroke: ink(), "stroke-width": 8, "stroke-linecap": "round", "stroke-linejoin": "round" }));
      break;
    case "refused":
      parts.push(disc(line, cx, cy, 38, c("color.state.failure")), el("path", { d: `M${cx - 13},${cy - 13} L${cx + 13},${cy + 13} M${cx + 13},${cy - 13} L${cx - 13},${cy + 13}`, stroke: ink(), "stroke-width": 8, "stroke-linecap": "round" }));
      break;
    case "waiting":
      parts.push(...zed(line, cx - 12, cy + 12, 26), ...zed(line, cx + 20, cy - 20, 20), ...zed(line, cx + 44, cy - 46, 14));
      break;
  }
  const attrs: Record<string, string> = s === 1 ? { "data-emote": kind, stroke: "none" } : { "data-emote": kind, stroke: "none", transform: `translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})` };
  return drawn([g(attrs, ...parts)]);
};

const unit = { kind: "number", min: 0, exclusiveMin: true, max: 10 } as const;

/** One reaction symbol with a fixed meaning, centred on (x, y), beside a head. */
export const emote = definePiece<EmoteParams>(
  "emote",
  { kind: { kind: "enum", required: true, values: EMOTE_KINDS }, x: pos(), y: pos(), scale: unit, burst: { kind: "boolean" }, surface: surfaceParam } satisfies Schema,
  drawEmote,
);

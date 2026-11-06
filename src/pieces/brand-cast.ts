// Mira, protagonist of the parent brand (ADR 0007, identity studio I2). The
// geometry is the approved round-7 model sheet's, ported unchanged
// (`~/.hermes/cache/scratch/ab267/sheet7.py`, functions `mira`/`peak`/`legs`/`needle`;
// `casting3.py`'s `face`). Front and back view only (round 7b dropped the
// side view and the middle leg).
import { drawn, el, g, type Drawn, type SvgNode } from "./node.ts";
import { surfaceParam, type SurfaceName } from "./ink.ts";
import { pos, num, type Schema } from "./params.ts";
import { definePiece } from "./piece.ts";
import { outlined, skin, type Skin } from "./skin.ts";

export const CAST_EXPRESSIONS = ["idle", "done", "waiting", "failed"] as const;
export type CastExpression = (typeof CAST_EXPRESSIONS)[number];
export const CAST_VIEWS = ["front", "back"] as const;
export type CastView = (typeof CAST_VIEWS)[number];

/** The face mode each piece draws, keyed by the shared `CastExpression` (sheets' `m`). */
const FACE_MODE: Record<CastExpression, "idle" | "happy" | "wait" | "fail"> = { idle: "idle", done: "happy", waiting: "wait", failed: "fail" };

/**
 * The screen face, the message state (identity studio I2: 4 expressions = parked, done, waiting, failed).
 * Ported from `casting3.py`'s `face(x, y, w, h, S, mode)`.
 */
export const faceAt = (x: number, y: number, w: number, h: number, s: Skin, expression: CastExpression): SvgNode => {
  const mode = FACE_MODE[expression];
  const rx = h / 2.4;
  const visor = el("rect", { x, y, width: w, height: h, rx, fill: s.visor });
  const cx = x + w / 2, cy = y + h / 2, dx = w * 0.2, ew = Math.max(5, w * 0.11), eh = h * 0.42, eye = s.eye;
  const eyes: SvgNode[] = [];
  if (mode === "idle") {
    for (const sx of [-dx, dx]) eyes.push(el("rect", { x: cx + sx - ew / 2, y: cy - eh / 2, width: ew, height: eh, rx: ew / 2, fill: eye }));
  } else if (mode === "happy") {
    for (const sx of [-dx, dx]) eyes.push(el("path", { d: `M${cx + sx - ew} ${cy + eh * 0.2} Q${cx + sx} ${cy - eh * 0.6} ${cx + sx + ew} ${cy + eh * 0.2}`, fill: "none", stroke: eye, "stroke-width": ew * 0.7, "stroke-linecap": "round" }));
  } else if (mode === "wait") {
    for (const sx of [-dx, 0, dx]) eyes.push(el("circle", { cx: cx + sx, cy, r: ew * 0.45, fill: eye }));
  } else {
    for (const sx of [-dx, dx]) {
      const a = ew * 0.8;
      eyes.push(el("path", { d: `M${cx + sx - a} ${cy - a} L${cx + sx + a} ${cy + a} M${cx + sx + a} ${cy - a} L${cx + sx - a} ${cy + a}`, stroke: eye, "stroke-width": ew * 0.6, "stroke-linecap": "round" }));
    }
  }
  return g({}, visor, ...eyes);
};

/** The hood tip, dipping over the forehead: the parent-brand family device (ADR 0007, I4). Absent on Sinal. */
export const peak = (s: Skin, cx: number, top: number, w = 30, dip = 28): SvgNode =>
  el("path", { d: `M${cx - w} ${top + 3} Q${cx} ${top - 6} ${cx + w} ${top + 3} Q${cx + w * 0.4} ${top + 8} ${cx} ${top + dip} Q${cx - w * 0.4} ${top + 8} ${cx - w} ${top + 3} Z`, fill: s.accent, stroke: s.outline, "stroke-width": 5, "stroke-linejoin": "round" });

/** The hood tip drawn as a cap sitting astride a circle's rim (Visor, Drone, Kiu use this form; `final.py`'s `tipcap`). */
export const tipCap = (s: Skin, cx: number, cy: number, r: number, depth: number): SvgNode => {
  const k = 0.70710678;
  return el("path", {
    d: `M${cx - k * r} ${cy - k * r} A${r} ${r} 0 0 1 ${cx + k * r} ${cy - k * r} Q${cx + r * 0.28} ${cy - r * 0.62} ${cx} ${cy - depth} Q${cx - r * 0.28} ${cy - r * 0.62} ${cx - k * r} ${cy - k * r} Z`,
    fill: s.accent, stroke: s.outline, "stroke-width": 5, "stroke-linejoin": "round",
  });
};

const miraLegs = (s: Skin, stride = 0): SvgNode[] => [
  el("path", { d: `M-16 -44 L${-34 + stride} 0 M16 -44 L${34 + stride} 0`, stroke: s.outline, "stroke-width": 8, "stroke-linecap": "round" }),
  el("rect", { x: -44 + stride, y: -6, width: 20, height: 7, rx: 3.5, fill: s.outline }),
  el("rect", { x: 24 + stride, y: -6, width: 20, height: 7, rx: 3.5, fill: s.outline }),
];

const miraNeedle = (s: Skin, a: number, carry: boolean): SvgNode => {
  const msg = carry ? [el("path", { d: "M86 0 V16", stroke: s.outline, "stroke-width": 3 }), el("circle", { cx: 86, cy: 26, r: 10, fill: s.accent })] : [];
  return g({ transform: `translate(0,-90) rotate(${a})` },
    el("rect", { x: -74, y: -3.5, width: 74, height: 7, rx: 3.5, fill: s.outline }),
    el("circle", { cx: -74, cy: 0, r: 8, fill: s.outline }),
    el("path", { d: "M14 -7 L96 0 L14 7 Z", fill: s.accent }),
    ...msg);
};

export type MiraParams = {
  x: number; y: number; surface?: SurfaceName; scale?: number;
  expression?: CastExpression; view?: CastView;
  /** The needle's angle in degrees (the sheets' `a`); the needle acts first (motion principle, identity sheet). */
  needleAngle?: number;
  /** A message riding the needle's tip. */
  carries?: boolean;
  /** A walking stride offset on the legs. */
  stride?: number;
};

const drawMira = (p: MiraParams): Drawn => {
  const s = skin(p.surface ?? "light");
  const expression = p.expression ?? "idle", view = p.view ?? "front";
  const a = p.needleAngle ?? -40, carry = p.carries ?? false, stride = p.stride ?? 0;
  const scale = p.scale ?? 1;
  let body: SvgNode;
  if (view === "back") {
    const rete = [
      el("circle", { cx: 0, cy: -90, r: 28, fill: "none", stroke: s.outline, "stroke-width": 3 }),
      el("path", { d: "M-28 -90 H28 M0 -118 V-62", stroke: s.outline, "stroke-width": 3 }),
    ];
    body = g({},
      ...miraLegs(s),
      el("circle", { cx: 0, cy: -90, r: 50, ...outlined(s, 8) }),
      ...rete,
      miraNeedle(s, -140, false),
      el("path", { d: "M-28 -137 Q0 -146 28 -137 Q0 -128 -28 -137 Z", fill: s.accent, stroke: s.outline, "stroke-width": 5, "stroke-linejoin": "round" }));
  } else {
    body = g({},
      ...miraLegs(s, stride),
      miraNeedle(s, a, carry),
      el("circle", { cx: 0, cy: -90, r: 50, ...outlined(s, 8) }),
      faceAt(-30, -104, 60, 32, s, expression),
      peak(s, 0, -140, 28, 26));
  }
  return drawn([g({ "data-piece": "mira", transform: `translate(${p.x} ${p.y}) scale(${scale})`, stroke: "none" }, body)]);
};

/** Mira, the protagonist: an astrolabe whose needle points the route each message takes. */
export const mira = definePiece<MiraParams>(
  "mira",
  {
    x: pos(), y: pos(), surface: surfaceParam,
    scale: num({ min: 0.25, max: 4 }),
    expression: { kind: "enum", values: CAST_EXPRESSIONS },
    view: { kind: "enum", values: CAST_VIEWS },
    needleAngle: num({ min: -180, max: 180 }),
    carries: { kind: "boolean" },
    stride: num({ min: 0, max: 20 }),
  } satisfies Schema,
  drawMira,
);

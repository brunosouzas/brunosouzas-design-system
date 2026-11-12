// Mira, protagonist of the parent brand (ADR 0007, identity studio I2). The
// geometry is the approved round-7 model sheet's, ported unchanged
// (`~/.hermes/cache/scratch/ab267/sheet7.py`, functions `mira`/`peak`/`legs`/`needle`;
// `casting3.py`'s `face`). Front and back view only (round 7b dropped the
// side view and the middle leg).
import { tokens } from "../../tokens/generated/tokens.ts";
import { drawn, el, g, type Drawn, type SvgNode } from "./node.ts";
import { limits, surfaceParam, type SurfaceName } from "./ink.ts";
import { pill, sheet, sheetRowSchema, type SheetRow } from "./paper.ts";
import { label, pos, num, size, type Schema } from "./params.ts";
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

// ---------------------------------------------------------------- Visor (AI pillar)
// Ported from final.py's `visor()`: an agent at work, the hands do, the face shows the state.
// `holdsSheet` and `facing` (change sdd-scene-pieces, design §1 to §3): Visor holds
// a sheet in its left hand instead of the card, and faces left as the mirror image.

export const VISOR_FACINGS = ["right", "left"] as const;
export type VisorFacing = (typeof VISOR_FACINGS)[number];

/** The sheet Visor holds: the `sheet` piece's page parameters, plus the file name pill. */
export type VisorHeldSheet = { width: number; height: number; rows: SheetRow[]; top?: number; step?: number; label?: string };

export type VisorParams = {
  x: number; y: number; surface?: SurfaceName; scale?: number; expression?: CastExpression; view?: CastView;
  /** The small accent card in the left hand. */
  holds?: boolean;
  /** A sheet in the left hand instead of the card; refused with `holds: true` or `view: "back"`. */
  holdsSheet?: VisorHeldSheet;
  points?: boolean;
  /** `right` (the default, the drawing of 0.11.0) or `left`, the mirror image; the held sheet and words stay unmirrored. */
  facing?: VisorFacing;
};

// Where the held sheet sits, in Visor's units (design §2): its edge against the
// left hand (x -84 facing right, 84 facing left), its bottom 4 above the ground line.
const HELD_SHEET_EDGE = 84;
const HELD_SHEET_BOTTOM = -4;

/**
 * The held sheet: the `sheet` and `pill` pieces' own drawings in one group that
 * gives them Visor's outline (cast pieces set `stroke: none` on their root), so
 * it draws the same in a cover and in a scene. The marks sit on the white page,
 * so they stay ink on the dark surface too (ADR 0009). Its words go to Visor's text.
 */
const heldSheet = (held: VisorHeldSheet, s: Skin, facing: VisorFacing): Drawn => {
  const x = facing === "right" ? -HELD_SHEET_EDGE - held.width : HELD_SHEET_EDGE;
  const y = HELD_SHEET_BOTTOM - held.height;
  const page = sheet({ x, y, width: held.width, height: held.height, rows: held.rows, top: held.top, step: held.step });
  const tag = held.label === undefined ? null : pill({ x: x + held.width / 2, y, text: held.label });
  // The sheet's marks group (the `g` at outline.small) gets its ink stroke here.
  const body = page.body.map((node) =>
    node.tag === "g" && node.attrs["stroke-width"] === tokens.outline.small && node.attrs.stroke === undefined
      ? { ...node, attrs: { ...node.attrs, stroke: tokens.color.ink } }
      : node);
  return drawn(
    [g({ "data-held": "sheet", stroke: s.outline, "stroke-width": tokens.outline.block, "stroke-linejoin": "round" }, ...body, ...(tag?.body ?? []))],
    [...page.text, ...(tag?.text ?? [])],
  );
};

const drawVisor = (p: VisorParams): Drawn => {
  const s = skin(p.surface ?? "light");
  const expression = p.expression ?? "idle", view = p.view ?? "front", back = view === "back";
  const hold = p.holds ?? false, point = p.points ?? true, facing = p.facing ?? "right";
  const held = p.holdsSheet === undefined ? null : heldSheet(p.holdsSheet, s, facing);
  const handR: SvgNode = point
    ? g({ transform: "translate(88,-104) rotate(-35)" }, el("rect", { x: -6, y: -30, width: 12, height: 26, rx: 6, ...outlined(s, 4.5) }), el("circle", { cx: 0, cy: 0, r: 15, ...outlined(s) }))
    : el("circle", { cx: 86, cy: -58, r: 15, ...outlined(s) });
  // With a held sheet the card hand stays where it is, without the card, over the sheet's edge.
  const handL: SvgNode[] = hold || held
    ? [...(held ? [] : [el("rect", { x: -106, y: -96, width: 28, height: 24, rx: 5, fill: s.accent })]), el("circle", { cx: -92, cy: -66, r: 15, ...outlined(s) })]
    : [el("circle", { cx: -86, cy: -58, r: 15, ...outlined(s) })];
  const faceG = back ? null : faceAt(-42, -128, 84, 52, s, expression);
  const pk = back
    ? el("path", { d: "M-34 -144 Q0 -152 34 -144 Q0 -136 -34 -144 Z", fill: s.accent, stroke: s.outline, "stroke-width": 5, "stroke-linejoin": "round" })
    : el("path", { d: "M-34 -144 Q0 -152 34 -144 Q14 -138 0 -120 Q-14 -138 -34 -144 Z", fill: s.accent, stroke: s.outline, "stroke-width": 5, "stroke-linejoin": "round" });
  const vent = back
    ? el("path", { d: "M-24 -110 H24 M-24 -96 H24 M-24 -82 H24", stroke: s.outline, "stroke-width": 4, "stroke-linecap": "round" })
    : null;
  // Facing left mirrors the body only: a uniform -1 scale keeps every stroke width and colour (ADR 0009).
  const body = g(facing === "left" ? { transform: "scale(-1,1)" } : {},
    el("rect", { x: -66, y: -114, width: 14, height: 32, rx: 4, fill: s.outline }),
    el("rect", { x: 52, y: -114, width: 14, height: 32, rx: 4, fill: s.outline }),
    el("rect", { x: -56, y: -142, width: 112, height: 88, rx: 30, ...outlined(s) }),
    faceG, vent, pk,
    el("path", { d: "M-16 -52 H16 L10 -40 H-10 Z", fill: s.outline }),
    ...handL, handR);
  const transform = `translate(${p.x} ${p.y}) scale(${p.scale ?? 1})`;
  // The words carry their own font, so they read the same in a scene, where no labels group exists.
  const text = held && held.text.length > 0
    ? [g({ transform, "font-family": tokens.font.sans, "font-size": tokens.cover.labelSize, "font-weight": tokens.cover.labelWeight, fill: tokens.color.ink, "text-anchor": "middle" }, ...held.text)]
    : [];
  return drawn([g({ "data-piece": "visor", transform, stroke: "none" }, ...(held?.body ?? []), body)], text);
};

const visorHeldSheetSchema: Schema = {
  width: { kind: "number", required: true, min: 80, max: 300 },
  height: { kind: "number", required: true, min: 80, max: 400 },
  rows: { kind: "array", required: true, minItems: 1, maxItems: 8, of: { kind: "object", fields: sheetRowSchema } },
  top: size(),
  step: size(),
  label: label(false),
};

export const visor = definePiece<VisorParams>(
  "visor",
  {
    x: pos(), y: pos(), surface: surfaceParam, scale: num({ min: 0.25, max: 4 }),
    expression: { kind: "enum", values: CAST_EXPRESSIONS }, view: { kind: "enum", values: CAST_VIEWS },
    holds: { kind: "boolean" },
    holdsSheet: { kind: "object", fields: visorHeldSheetSchema },
    points: { kind: "boolean" },
    facing: { kind: "enum", values: VISOR_FACINGS },
  } satisfies Schema,
  drawVisor,
  // A card or a sheet, not both; the sheet only in front (its back is not designed). The card is named first.
  (p) => p.holdsSheet === undefined ? [] : limits(
    p.holds === true && { path: "holdsSheet", message: "Visor holds a card or a sheet, not both" },
    p.holds !== true && p.view === "back" && { path: "holdsSheet", message: "Visor holds a sheet only in the front view" },
  ),
);

// ---------------------------------------------------------------- Drone (delivery pillar)
export type DroneParams = { x: number; y: number; surface?: SurfaceName; scale?: number; expression?: CastExpression; view?: CastView; carries?: boolean };

const drawDrone = (p: DroneParams): Drawn => {
  const s = skin(p.surface ?? "light");
  const expression = p.expression ?? "idle", view = p.view ?? "front", back = view === "back";
  const cargo = p.carries ?? true;
  const faceG = back ? null : faceAt(-27, -98, 54, 30, s, expression);
  const cap = back
    ? el("path", { d: "M-27.6 -109.6 A39 39 0 0 1 27.6 -109.6 Q0 -102 -27.6 -109.6 Z", fill: s.accent, stroke: s.outline, "stroke-width": 5 })
    : tipCap(s, 0, -82, 39, 14);
  const box = cargo
    ? [el("rect", { x: -15, y: -36, width: 30, height: 26, rx: 6, fill: s.accent }), el("path", { d: "M-15 -27 H15", stroke: s.body, "stroke-width": 3 })]
    : [];
  const body = g({},
    el("path", { d: "M-22 -106 L-46 -126 M22 -106 L46 -126", stroke: s.outline, "stroke-width": 7, "stroke-linecap": "round" }),
    el("rect", { x: -74, y: -132, width: 54, height: 9, rx: 4.5, fill: s.outline }),
    el("rect", { x: 20, y: -132, width: 54, height: 9, rx: 4.5, fill: s.outline }),
    el("circle", { cx: 0, cy: -82, r: 36, ...outlined(s) }), faceG, cap,
    el("path", { d: "M0 -46 V-36 M-10 -40 H10", stroke: s.outline, "stroke-width": 5, "stroke-linecap": "round" }),
    ...box);
  return drawn([g({ "data-piece": "drone", transform: `translate(${p.x} ${p.y}) scale(${p.scale ?? 1})`, stroke: "none" }, body)]);
};

export const drone = definePiece<DroneParams>(
  "drone",
  { x: pos(), y: pos(), surface: surfaceParam, scale: num({ min: 0.25, max: 4 }), expression: { kind: "enum", values: CAST_EXPRESSIONS }, view: { kind: "enum", values: CAST_VIEWS }, carries: { kind: "boolean" } } satisfies Schema,
  drawDrone,
);

// ---------------------------------------------------------------- Kiu (wiki and series)
export type KiuParams = { x: number; y: number; surface?: SurfaceName; scale?: number; expression?: CastExpression; view?: CastView; steps?: number };

const KIU_SEGMENTS: readonly (readonly [number, number])[] = [[-46, 19], [-84, 17], [-118, 15], [-148, 13], [-174, 11]];

const drawKiu = (p: KiuParams): Drawn => {
  const s = skin(p.surface ?? "light");
  const expression = p.expression ?? "idle", view = p.view ?? "front", back = view === "back";
  const n = p.steps ?? 4;
  const seg = KIU_SEGMENTS.slice(0, n);
  const parts: SvgNode[] = [];
  // Farthest segment first, nearest last (on top) — matches the sheet's `reversed(enumerate(seg))`.
  for (let i = seg.length - 1; i >= 0; i--) {
    const [dx, r] = seg[i];
    const cy = -(r + 10);
    parts.push(el("path", { d: `M${dx - 5} ${cy + r - 3} L${dx - 7} 0 M${dx + 5} ${cy + r - 3} L${dx + 7} 0`, stroke: s.outline, "stroke-width": 4, "stroke-linecap": "round" }));
    parts.push(el("circle", { cx: dx, cy, r, fill: s.body, stroke: s.outline, "stroke-width": 4.5 }));
    if (i % 2 === 0) parts.push(el("circle", { cx: dx, cy, r: r * 0.45, fill: s.accent }));
  }
  const head = [
    el("path", { d: "M-6 -10 L-8 0 M8 -10 L10 0", stroke: s.outline, "stroke-width": 4, "stroke-linecap": "round" }),
    el("circle", { cx: 0, cy: -40, r: 31, ...outlined(s) }),
    back
      ? el("path", { d: "M-24 -64 A34 34 0 0 1 24 -64 Q0 -58 -24 -64 Z", fill: s.accent, stroke: s.outline, "stroke-width": 5 })
      : g({}, faceAt(-21, -54, 44, 26, s, expression), tipCap(s, 0, -40, 34, 12)),
  ];
  const inner = g({ transform: "translate(70,0)" }, ...parts, ...head);
  const body = back ? g({ transform: "scale(-1,1)" }, inner) : inner;
  return drawn([g({ "data-piece": "kiu", transform: `translate(${p.x} ${p.y}) scale(${p.scale ?? 1})`, stroke: "none" }, body)]);
};

export const kiu = definePiece<KiuParams>(
  "kiu",
  { x: pos(), y: pos(), surface: surfaceParam, scale: num({ min: 0.25, max: 4 }), expression: { kind: "enum", values: CAST_EXPRESSIONS }, view: { kind: "enum", values: CAST_VIEWS }, steps: { kind: "number", integer: true, min: 2, max: 5 } } satisfies Schema,
  drawKiu,
);

// ---------------------------------------------------------------- Sinal (stackledger, no hood tip — I4)
export type SinalParams = { x: number; y: number; surface?: SurfaceName; scale?: number; expression?: CastExpression; view?: CastView };

const drawSinal = (p: SinalParams): Drawn => {
  const s = skin(p.surface ?? "light");
  const expression = p.expression ?? "idle", view = p.view ?? "front";
  const faceG = view === "back" ? null : faceAt(-25, -116, 50, 32, s, expression);
  const body = g({},
    el("rect", { x: -22, y: -12, width: 44, height: 12, rx: 6, fill: s.outline }),
    el("rect", { x: -6, y: -70, width: 12, height: 62, fill: s.outline }),
    el("circle", { cx: 0, cy: -100, r: 36, ...outlined(s) }),
    faceG);
  return drawn([g({ "data-piece": "sinal", transform: `translate(${p.x} ${p.y}) scale(${p.scale ?? 1})`, stroke: "none" }, body)]);
};

export const sinal = definePiece<SinalParams>(
  "sinal",
  { x: pos(), y: pos(), surface: surfaceParam, scale: num({ min: 0.25, max: 4 }), expression: { kind: "enum", values: CAST_EXPRESSIONS }, view: { kind: "enum", values: CAST_VIEWS } } satisfies Schema,
  drawSinal,
);

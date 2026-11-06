// The bank of objects for covers (identity studio I10, amended in 0.7.0): six
// objects that appear on track covers instead of a cast character with a role.
// Geometry ported from the approved phase-3 source
// (`~/.hermes/cache/scratch/ab267/casting3.py`: `courier`/`lume`/`carga`/`anel`/`modulo`/`hub`);
// in 0.7.0 every screen shows the cast's idle eyes and `modulo` loses the two
// inner strokes between its legs (the card 301 preview the owner approved).
//
// Why idle eyes and nothing more: an object with a face-like screen and no eyes
// reads as dead, so the screen is on; but a bank object is scenery, not a
// character with a story role (Mira, Visor, Drone, Kiu, Sinal), so it takes no
// expression. If a future piece needs the same object with expressions or a
// role in two or more places, it becomes a character with its own sheet (E8),
// not a change to this file.
import { drawn, el, g, r2, type Drawn, type SvgNode } from "./node.ts";
import { surfaceParam, type SurfaceName } from "./ink.ts";
import { pos, num, type Schema } from "./params.ts";
import { definePiece } from "./piece.ts";
import { outlined, skin, type Skin } from "./skin.ts";

export const BANK_OBJECT_NAMES = ["courier", "lume", "carga", "anel", "modulo", "hub"] as const;
export type BankObjectName = (typeof BANK_OBJECT_NAMES)[number];

/** The screen: the visor-coloured panel with the cast's idle eyes centred on it, and no other expression. */
const screen = (x: number, y: number, w: number, h: number, s: Skin, rx?: number): SvgNode => {
  // Two upright pills a fifth of the screen's width either side of its centre, 0.42 of its height.
  const cx = x + w / 2, cy = y + h / 2, dx = w * 0.2, ew = Math.max(5, w * 0.11), eh = h * 0.42;
  return g(
    {},
    el("rect", { x, y, width: w, height: h, rx: rx ?? h / 2.4, fill: s.visor }),
    ...[-dx, dx].map((sx) => el("rect", { x: r2(cx + sx - ew / 2), y: r2(cy - eh / 2), width: r2(ew), height: r2(eh), rx: r2(ew / 2), fill: s.eye, stroke: "none" })),
  );
};

const courier = (s: Skin): SvgNode =>
  g({},
    el("path", { d: "M-42 -100 L-60 -126 H-34 L-18 -100 Z", fill: s.outline }),
    el("path", { d: "M-42 -40 L-60 -14 H-34 L-18 -40 Z", fill: s.outline }),
    el("rect", { x: -72, y: -84, width: 14, height: 28, rx: 4, fill: s.outline }),
    el("path", { d: "M-50 -102 H18 C58 -102 80 -84 80 -70 C80 -56 58 -38 18 -38 H-50 A32 32 0 0 1 -50 -102 Z", ...outlined(s) }),
    el("rect", { x: -40, y: -82, width: 24, height: 24, rx: 5, fill: s.accent }),
    screen(-2, -90, 56, 38, s));

const lume = (s: Skin): SvgNode => {
  const rays = [0, 1, 2].map((i) => el("path", { d: `M${50 + i * 4} ${-104 + i * 22} L${78 + i * 8} ${-112 + i * 26}`, stroke: s.accent, "stroke-width": 7, "stroke-linecap": "round" }));
  return g({},
    el("path", { d: "M-20 -138 A20 20 0 0 1 20 -138", stroke: s.outline, "stroke-width": 6, fill: "none" }),
    el("path", { d: "M-30 -138 H30 L38 -124 H-38 Z", fill: s.outline }),
    el("rect", { x: -36, y: -126, width: 72, height: 80, rx: 14, ...outlined(s) }),
    screen(-25, -114, 50, 44, s),
    el("path", { d: "M-38 -46 H38 L30 -34 H-30 Z", fill: s.outline }),
    el("path", { d: "M-10 -34 H10 L0 -20 Z", fill: s.outline }),
    ...rays);
};

const carga = (s: Skin): SvgNode =>
  g({},
    el("rect", { x: -44, y: -152, width: 60, height: 28, rx: 4, fill: s.accent }),
    el("path", { d: "M-30 -152 V-124 M-14 -152 V-124 M2 -152 V-124", stroke: s.body, "stroke-width": 3 }),
    el("path", { d: "M-24 -60 L-38 -32 L-24 -6 M24 -60 L12 -32 L26 -6", stroke: s.outline, "stroke-width": 10, "stroke-linecap": "round", "stroke-linejoin": "round", fill: "none" }),
    el("rect", { x: -40, y: -8, width: 30, height: 9, rx: 4.5, fill: s.outline }),
    el("rect", { x: 12, y: -8, width: 30, height: 9, rx: 4.5, fill: s.outline }),
    el("rect", { x: -50, y: -126, width: 100, height: 70, rx: 16, ...outlined(s) }),
    screen(-30, -114, 62, 36, s),
    el("path", { d: "M50 -96 H66 V-74", stroke: s.outline, "stroke-width": 7, "stroke-linecap": "round", fill: "none" }),
    el("path", { d: "M58 -74 H74", stroke: s.outline, "stroke-width": 7, "stroke-linecap": "round" }));

const anel = (s: Skin): SvgNode =>
  g({},
    el("path", { d: "M-82 -78 A84 20 -12 0 1 82 -98", stroke: s.accent, "stroke-width": 9, fill: "none", "stroke-linecap": "round" }),
    el("circle", { cx: 0, cy: -88, r: 46, ...outlined(s) }),
    screen(-31, -112, 62, 32, s),
    el("path", { d: "M82 -98 A84 20 -12 0 1 -82 -78", stroke: s.accent, "stroke-width": 9, fill: "none", "stroke-linecap": "round" }),
    el("rect", { x: -66, y: -74, width: 14, height: 14, rx: 3, fill: s.outline }),
    el("rect", { x: 58, y: -92, width: 14, height: 14, rx: 3, fill: s.outline }));

const modulo = (s: Skin): SvgNode =>
  g({},
    el("path", { d: "M-44 -50 L-74 -2 M44 -50 L74 -2", stroke: s.outline, "stroke-width": 7, "stroke-linecap": "round" }),
    el("rect", { x: -88, y: -6, width: 28, height: 7, rx: 3.5, fill: s.outline }),
    el("rect", { x: 60, y: -6, width: 28, height: 7, rx: 3.5, fill: s.outline }),
    el("rect", { x: -46, y: -62, width: 92, height: 24, rx: 5, fill: s.accent }),
    el("path", { d: "M22 -134 L34 -154", stroke: s.outline, "stroke-width": 5, "stroke-linecap": "round" }),
    el("path", { d: "M26 -160 A10 10 0 0 0 44 -150 Z", fill: s.outline }),
    el("path", { d: "M-36 -136 H36 L52 -114 V-80 L36 -62 H-36 L-52 -80 V-114 Z", ...outlined(s) }),
    screen(-34, -122, 68, 42, s));

const hub = (s: Skin): SvgNode => {
  const arms: SvgNode[] = [];
  const spokes: readonly (readonly [number, number, number, number, number, number])[] = [
    [-30, -70, -70, -60, -84, -14], [-14, -64, -30, -30, -40, 0], [14, -64, 30, -30, 40, 0], [30, -70, 70, -60, 84, -14],
  ];
  for (const [x1, y1, cx, cy, x2, y2] of spokes) {
    arms.push(el("path", { d: `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`, stroke: s.outline, "stroke-width": 7, fill: "none", "stroke-linecap": "round" }));
    arms.push(el("rect", { x: x2 - 8, y: y2 - 4, width: 16, height: 12, rx: 3, fill: s.accent }));
  }
  return g({}, ...arms,
    el("path", { d: "M-50 -76 V-104 A50 50 0 0 1 50 -104 V-76 Q0 -60 -50 -76 Z", ...outlined(s) }),
    screen(-36, -130, 72, 40, s));
};

const DRAW: Record<BankObjectName, (s: Skin) => SvgNode> = { courier, lume, carga, anel, modulo, hub };

export type BankObjectParams = { name: BankObjectName; x: number; y: number; surface?: SurfaceName; scale?: number };

const drawBankObject = (p: BankObjectParams): Drawn => {
  const s = skin(p.surface ?? "light");
  const body = DRAW[p.name](s);
  return drawn([g({ "data-piece": `bank-${p.name}`, transform: `translate(${p.x} ${p.y}) scale(${p.scale ?? 1})`, stroke: "none" }, body)]);
};

/** One of the six prop-bank objects for covers (I10): Correio, Lume, Carga, Anel, Módulo, Hub, with idle eyes on the screen. */
export const bankObject = definePiece<BankObjectParams>(
  "bankObject",
  { name: { kind: "enum", required: true, values: BANK_OBJECT_NAMES }, x: pos(), y: pos(), surface: surfaceParam, scale: num({ min: 0.25, max: 4 }) } satisfies Schema,
  drawBankObject,
);

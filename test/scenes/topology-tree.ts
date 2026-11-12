// Reading the circuit-breaker topology scene's stage the way the layout,
// size, words and colour tests need it (change circuit-breaker-topology-scene,
// tasks 4.5 and 4.6): every drawn string with its box, every block, Payment's
// lights, the tokens, and which elements are moving or settling at a frame
// (design §6.3 item 7). Geometry is read from the piece trees stage.ts returns,
// with their transforms applied, and from the component props, so a test
// checks what the frame draws. Test-only.
import { tokens } from "../../tokens/generated/tokens";
import { callAppearance } from "../../src/brand/motion";
import { failureRateBarShapes } from "../../src/brand/rate-bar-shape";
import type { Point } from "../../src/brand/motion";
import type { SvgNode } from "../../src/pieces/node.ts";
import { type Appear, type TopologyState } from "../../src/scenes/circuit-breaker-topology/frame";
import { BAR, PAYMENT_LIGHTS, REWIND_MARK } from "../../src/scenes/circuit-breaker-topology/layout";
import type { Components, Stage } from "../../src/scenes/circuit-breaker-topology/stage";
import { timeline } from "../../src/scenes/circuit-breaker-topology/timeline";
import { textBox, type Box, type FaceName } from "./text-measure";

export type Frame = { frame: number; state: TopologyState; components: Components } & Stage;

// ---------------------------------------------------------------- tree geometry

type Matrix = [number, number, number, number, number, number];
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];
const multiply = (m: Matrix, n: Matrix): Matrix => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];
/** The matrix of a transform made of translate and scale (the forms stage.ts and the pieces write here). */
const parse = (value: unknown): Matrix => {
  let m = IDENTITY;
  for (const [, name, args] of String(value ?? "").matchAll(/(translate|scale)\(([^)]*)\)/g)) {
    const v = args.split(/[\s,]+/).filter(Boolean).map(Number);
    m = multiply(m, name === "translate" ? [1, 0, 0, 1, v[0], v[1] ?? 0] : [v[0], 0, 0, v[1] ?? v[0], 0, 0]);
  }
  return m;
};
const apply = (m: Matrix, p: Point): Point => ({ x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5] });

type Walked = { node: SvgNode; m: Matrix; element: string | null; family: string | null };
/** Every node with its accumulated transform, its `data-element` and its inherited font family, depth first. */
export const walk = (node: SvgNode, m: Matrix = IDENTITY, element: string | null = null, family: string | null = null, out: Walked[] = []): Walked[] => {
  const here = multiply(m, parse(node.attrs.transform));
  const name = node.attrs["data-element"] === undefined ? element : String(node.attrs["data-element"]);
  const fam = node.attrs["font-family"] === undefined ? family : String(node.attrs["font-family"]);
  out.push({ node, m: here, element: name, family: fam });
  for (const child of node.children) if (typeof child !== "string") walk(child, here, name, fam, out);
  return out;
};

const faceOf = (family: string | null): FaceName => (family === tokens.font.mono ? "mono" : "sans");
export type DrawnText = { element: string; text: string; size: number; box: Box };
/** Every text node of a layer: its words, its effective size (font-size × the transform's scale) and its box (design §6.3). */
export const textsOf = (layer: SvgNode): DrawnText[] =>
  walk(layer).filter((w) => w.node.tag === "text").map(({ node, m, element, family }) => {
    const runs = node.children.map((child) => (typeof child === "string" ? { text: child, face: faceOf(family) } : { text: child.children.join(""), face: faceOf(String(child.attrs["font-family"] ?? family)) }));
    const scale = Math.hypot(m[0], m[1]);
    const size = Number(node.attrs["font-size"]) * scale;
    const origin = apply(m, { x: Number(node.attrs.x), y: Number(node.attrs.y) });
    const anchor = String(node.attrs["text-anchor"] ?? "start") as "start" | "middle" | "end";
    return { element: element ?? "?", text: runs.map((r) => r.text).join(""), size, box: textBox(runs, origin.x, origin.y, size, anchor) };
  });

/** A shape's box (rect, circle) with half its stroke, in stage units; `round` is a rect's corner radius, for stadium and circle tests. */
export type Block = { element: string; box: Box; round: number };
const shapeBox = ({ node, m }: Walked): { box: Box; round: number } | null => {
  const a = node.attrs, n = (k: string) => Number(a[k]);
  const half = Number(a["stroke-width"] ?? tokens.outline.block) / 2;
  const s = Math.hypot(m[0], m[1]);
  if (node.tag === "rect") {
    const p = apply(m, { x: n("x"), y: n("y") });
    return { box: { x0: p.x - half * s, y0: p.y - half * s, x1: p.x + (n("width") + half) * s, y1: p.y + (n("height") + half) * s }, round: (Number(a.rx ?? 0) + half) * s };
  }
  if (node.tag === "circle") {
    const c = apply(m, { x: n("cx"), y: n("cy") }), r = (n("r") + half) * s;
    return { box: { x0: c.x - r, y0: c.y - r, x1: c.x + r, y1: c.y + r }, round: r };
  }
  return null;
};
/** The first outlined shape of an element (a pill's body, a badge's body, the breaker box, a window): its block. */
export const bodyOf = (layer: SvgNode, element: string): Block | null => {
  const shape = walk(layer).filter((w) => w.element === element && (w.node.tag === "rect" || w.node.tag === "circle") && w.node.attrs.stroke !== "none").map(shapeBox).find((b) => b !== null);
  return shape ? { element, ...shape } : null;
};

// ---------------------------------------------------------------- what a frame holds

const union = (boxes: Box[]): Box => ({ x0: Math.min(...boxes.map((b) => b.x0)), y0: Math.min(...boxes.map((b) => b.y0)), x1: Math.max(...boxes.map((b) => b.x1)), y1: Math.max(...boxes.map((b) => b.y1)) });

/** The blocks of design §6.3 item 5 at a frame. */
export const blocksOf = (f: Frame): Block[] => {
  const blocks: Block[] = [];
  const add = (b: Block | null) => { if (b) blocks.push(b); };
  add(bodyOf(f.below, "checkout"));
  const units = walk(f.below).filter((w) => w.element === "payment" && w.node.tag === "rect" && Number(w.node.attrs.height) === 40).map(shapeBox).filter((b) => b !== null);
  units.forEach((u, i) => blocks.push({ element: `payment unit ${i}`, ...u! }));
  add(bodyOf(f.below, "breaker"));
  for (const pill of ["checkout-label", "payment-label", "state-pill", "retry"]) add(bodyOf(f.above, pill));
  for (const badge of ["badge", "requests", "calls", "ghost"]) add(bodyOf(f.above, badge));
  if (f.state.rewindMark) blocks.push({ element: "rewind-mark", box: { x0: REWIND_MARK.x, y0: REWIND_MARK.y, x1: REWIND_MARK.x + REWIND_MARK.size, y1: REWIND_MARK.y + REWIND_MARK.size }, round: 0 });
  const w = f.components.window;
  if (w) {
    for (const q of w.squares) blocks.push({ element: `window ${q.id}`, box: { x0: q.x - 1.5, y0: q.y - 1.5, x1: q.x + q.size + 1.5, y1: q.y + q.size + 1.5 }, round: 0 });
    const tick = BAR.x + BAR.threshold * BAR.width;
    blocks.push({ element: "window bar", box: union([{ x0: BAR.x - 1.5, y0: BAR.y - 1.5, x1: BAR.x + BAR.width + 1.5, y1: BAR.y + BAR.height + 1.5 }, { x0: tick - 2, y0: BAR.y - BAR.height / 2 - 2, x1: tick + 2, y1: BAR.y + 1.5 * BAR.height + 2 }]), round: 0 });
  }
  const d = f.components.dropped;
  if (d) blocks.push({ element: "dropped", box: { x0: d.x, y0: d.y, x1: d.x + d.size, y1: d.y + d.size }, round: 0 });
  const c = f.components.clock;
  if (c) { const r = c.size / 2 - 5 + 1.5; blocks.push({ element: "clock", box: { x0: c.cx - r, y0: c.cy - r, x1: c.cx + r, y1: c.cy + r }, round: r }); }
  return blocks;
};

/** Payment's lights with their outline (serverStack: r 6, outline.small 3). */
export const LIGHTS = PAYMENT_LIGHTS.map((p, i) => ({ unit: i, centre: p, r: 6 + tokens.outline.small / 2 }));
/** A token's disc with its outline (PositionedToken: radius 10, outline.small + 1). */
export const tokenDiscs = (f: Frame) => f.components.tokens.map((t) => ({ id: t.id, centre: t.point, r: t.radius + (tokens.outline.small + 1) / 2 }));

/** The window results that arrive with the window full: each starts a slide (design §4.6). */
const SLIDES = (() => {
  let filled = 0;
  const slides: number[] = [];
  for (const e of timeline.window) {
    if ("clear" in e) filled = 0;
    else if (e.result !== "drop") { if (filled === 5) slides.push(e.at); else filled++; }
  }
  return slides;
})();

const isSettled = (a: Appear | null | undefined) => a !== null && a !== undefined && a.opacity === 1 && a.scale === 1;
/**
 * The elements a frame does not check (design §6.3 item 7): an element popping
 * in until a + `motion.fps`, during its leave, the breaker during its drop-in,
 * the window during its slides, the dropped square. Tokens are never exempt.
 */
export const exemptAt = (f: Frame): Set<string> => {
  const s = f.state, out = new Set<string>();
  const unless = (settled: boolean, ...names: string[]) => { if (!settled) for (const n of names) out.add(n); };
  if (s.checkout) unless(isSettled(s.checkout), "checkout", "checkout-label");
  if (s.payment) unless(isSettled(s.payment), "payment", "payment-label", ...[0, 1, 2].map((i) => `payment unit ${i}`));
  if (f.frame >= timeline.drop.from && f.frame < timeline.drop.to) out.add("breaker");
  if (s.state) unless(isSettled(s.state.appear), "state-pill");
  if (s.retry) unless(isSettled(s.retry), "retry");
  for (const place of ["direct", "left", "right"] as const) { const t = s.tags[place]; if (t) unless(isSettled(t.appear), `tag-${place}`); }
  if (s.clock) unless(isSettled(s.clock.appear), "clock", "clock-label");
  if (s.message) unless(isSettled(s.message), "message");
  if (s.counters) { unless(isSettled(s.counters.appear), "requests", "calls"); if (s.counters.ghost) unless(isSettled(s.counters.ghost), "ghost"); }
  if (s.badge) unless(isSettled(s.badge.appear), "badge");
  if (s.rewindMark) unless(isSettled(s.rewindMark), "rewind-mark");
  const w = f.components.window;
  if (w) {
    const sliding = SLIDES.some((a) => f.frame >= a && f.frame < a + tokens.motion.fade);
    if (!isSettled(w.appear) || sliding) out.add("window");
    for (const q of w.squares) if (q.kind !== "empty" && (f.frame < q.appearAt + tokens.motion.fps || q.opacity < 1)) out.add(`window ${q.id}`);
  }
  if (f.state.dropped) out.add("dropped");
  return out;
};
/** Is a block or text of `element` exempt (the window's parts follow the window)? */
export const isExempt = (exempt: Set<string>, element: string) => exempt.has(element) || (element.startsWith("window") && exempt.has("window"));

// ---------------------------------------------------------------- colours and glyphs

/** Every colour a frame paints, with its element: the trees' fills and strokes, and the components' colours. */
export const coloursOf = (f: Frame): { element: string; colour: string }[] => {
  const out: { element: string; colour: string }[] = [];
  for (const layer of [f.below, f.above]) for (const w of walk(layer)) {
    if (w.element === null) continue;
    for (const attr of ["fill", "stroke"]) { const v = w.node.attrs[attr]; if (typeof v === "string" && v.startsWith("#")) out.push({ element: w.element, colour: v }); }
  }
  const w = f.components.window;
  if (w) {
    for (const q of w.squares) { const look = callAppearance(q.kind); out.push({ element: `square ${q.kind}`, colour: look.fill }, { element: `square ${q.kind}`, colour: look.glyphColor }); }
    // The bar's colours as FailureRateBar draws them, read from its pure shapes.
    const { track, fill, tick } = failureRateBarShapes(w.bar);
    for (const rect of fill ? [track, fill] : [track]) out.push({ element: "bar", colour: rect.fill }, { element: "bar", colour: rect.stroke });
    out.push({ element: "bar", colour: tick.stroke });
  }
  for (const _ of f.components.tokens) out.push({ element: "token", colour: tokens.color.white }, { element: "token", colour: tokens.color.ink });
  if (f.components.clock) out.push({ element: "clock", colour: tokens.color.white }, { element: "clock", colour: tokens.color.ink });
  return out;
};

/** The glyphs `CallSquare` draws (✓ for ok, ✕ for fail), with the effective glyph size (size × 0.62). */
export const glyphsOf = (f: Frame): { glyph: string; size: number; settled: boolean }[] =>
  (f.components.window?.squares ?? []).filter((q) => q.kind !== "empty").map((q) => ({ glyph: callAppearance(q.kind).glyph, size: q.size * 0.62, settled: f.frame >= q.appearAt + tokens.motion.fps && q.opacity === 1 }));

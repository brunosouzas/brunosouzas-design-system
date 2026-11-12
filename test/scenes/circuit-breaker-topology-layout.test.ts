// The circuit-breaker topology scene's layout, layers, text size and text
// placement (spec scene-catalogue, "Topology layout and layers", "Topology
// text size", "Topology text placement"; change circuit-breaker-topology-scene,
// task 4.5). Text is measured with harfbuzzjs on the package's `fonts/` faces
// (test/scenes/text-measure.ts); geometry is read from the stage trees and the
// component props (test/scenes/topology-tree.ts).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import type { SvgNode } from "../../src/pieces/node.ts";
import {
  ANCHORS, BADGE, BAR, BREAKER, CALLS_COUNTER, CHECKOUT, CHECKOUT_LABEL, CLOCK, CLOCK_LABEL, DROP_PATH, GHOST_OPACITY, MESSAGE, PAYMENT, PAYMENT_LABEL, PAYMENT_LIGHTS,
  REQUESTS, RETRY, REWIND_MARK, RINGS_CENTRE, ROUTES, SQUARE, STAGE, STAGE_SCALE, STATE_PILL, TAGS, TAG_WIDTHS, TEXT_SIZE, TOKEN_RADIUS,
} from "../../src/scenes/circuit-breaker-topology/layout";
import { ABOVE_ORDER, BELOW_ORDER, stageAt } from "../../src/scenes/circuit-breaker-topology/stage";
import type { Box } from "./text-measure";
import { LIGHTS, blocksOf, exemptAt, glyphsOf, isExempt, textsOf, tokenDiscs, walk, type Block, type DrawnText, type Frame } from "./topology-tree";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const FRAMES: Frame[] = Array.from({ length: 1920 }, (_, frame) => ({ frame, ...stageAt(frame) }));

// ---------------------------------------------------------------- the rules of design §6.3

const MARGIN = 12;
const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
const fmt = (n: number) => Math.round(n * 100) / 100;
/** Distance from a point to a rounded box (a stadium when its corner radius is half its height). */
const distanceTo = (p: { x: number; y: number }, b: Block): number => {
  const r = Math.min(b.round, (b.box.y1 - b.box.y0) / 2, (b.box.x1 - b.box.x0) / 2);
  const inner = { x0: b.box.x0 + r, y0: b.box.y0 + r, x1: b.box.x1 - r, y1: b.box.y1 - r };
  const dx = Math.max(inner.x0 - p.x, 0, p.x - inner.x1), dy = Math.max(inner.y0 - p.y, 0, p.y - inner.y1);
  return Math.hypot(dx, dy) - r;
};
const discTouchesBox = (c: { x: number; y: number }, r: number, b: Box) => Math.hypot(c.x - Math.max(b.x0, Math.min(c.x, b.x1)), c.y - Math.max(b.y0, Math.min(c.y, b.y1))) < r;

const DIGITS = /^\d+$/;
/** The blocks a text labels (design §6.3 item 5): it may touch those and no other. */
const labels = (t: DrawnText): string[] => {
  switch (t.element) {
    case "checkout-label": return ["checkout", "checkout-label"];
    case "retry": return ["checkout", "retry"];
    case "payment-label": return ["payment unit 0", "payment unit 1", "payment unit 2", "payment-label"];
    case "state-pill": return ["breaker", "state-pill"];
    case "breaker": return ["breaker"];
    case "badge": return ["badge"];
    case "requests": case "calls": case "ghost": return DIGITS.test(t.text) ? [t.element] : [];
    default: return [];
  }
};
const BADGES = new Set(["badge", "requests", "calls", "ghost"]);
const PILLS = new Set(["checkout-label", "payment-label", "state-pill", "retry"]);

/** What a frame checks: its text boxes, blocks and tokens, minus the moving and settling elements. */
const checkedAt = (f: Frame) => {
  const exempt = exemptAt(f);
  return {
    texts: [...textsOf(f.below), ...textsOf(f.above)].filter((t) => !isExempt(exempt, t.element)),
    blocks: blocksOf(f).filter((b) => !isExempt(exempt, b.element)),
    tokens: tokenDiscs(f),
  };
};

/** Every placement problem of the frames (design §6.3 items 3 to 6), each naming its frame and elements. */
const placementProblems = (frames: readonly Frame[]): string[] => {
  const problems: string[] = [];
  for (const f of frames) {
    const { texts, blocks, tokens } = checkedAt(f);
    const inside = (what: string, b: Box) => {
      if (b.x0 < MARGIN || b.y0 < MARGIN || b.x1 > STAGE.width - MARGIN || b.y1 > STAGE.height - MARGIN) problems.push(`frame ${f.frame}: ${what} leaves the stage less ${MARGIN} (${fmt(b.x0)}, ${fmt(b.y0)}, ${fmt(b.x1)}, ${fmt(b.y1)})`);
    };
    for (const t of texts) inside(`${t.element} "${t.text}"`, t.box);
    const badges = blocks.filter((b) => BADGES.has(b.element));
    for (const b of badges) inside(`${b.element} badge`, b.box);
    // A badge body keeps clear of tokens, of every other block (the rewind mark among them) and of Payment's lights (design §6.3 item 5).
    for (const b of badges) {
      for (const k of tokens) if (discTouchesBox(k.centre, k.r, b.box)) problems.push(`frame ${f.frame}: ${b.element} badge touches token ${k.id}`);
      for (const other of blocks) if (other !== b && overlaps(b.box, other.box)) problems.push(`frame ${f.frame}: ${b.element} badge crosses ${other.element}`);
      for (const light of LIGHTS) if (discTouchesBox(light.centre, light.r, b.box)) problems.push(`frame ${f.frame}: ${b.element} badge covers unit ${light.unit}'s light`);
    }
    texts.forEach((a, i) => texts.slice(i + 1).forEach((b) => { if (overlaps(a.box, b.box)) problems.push(`frame ${f.frame}: ${a.element} "${a.text}" overlaps ${b.element} "${b.text}"`); }));
    for (const t of texts) for (const k of tokens) if (discTouchesBox(k.centre, k.r, t.box)) problems.push(`frame ${f.frame}: ${t.element} "${t.text}" touches token ${k.id}`);
    for (const t of texts) for (const b of blocks) if (!labels(t).includes(b.element) && overlaps(t.box, b.box)) problems.push(`frame ${f.frame}: ${t.element} "${t.text}" crosses ${b.element}`);
    for (const light of LIGHTS) {
      for (const b of blocks.filter((b) => PILLS.has(b.element))) if (distanceTo(light.centre, b) < light.r) problems.push(`frame ${f.frame}: ${b.element} covers unit ${light.unit}'s light`);
      for (const t of texts) if (discTouchesBox(light.centre, light.r, t.box)) problems.push(`frame ${f.frame}: ${t.element} "${t.text}" covers unit ${light.unit}'s light`);
    }
  }
  return problems;
};

const STRONG = (t: DrawnText) => t.element === "state-pill" || t.element === "badge" || (["requests", "calls", "ghost"].includes(t.element) && DIGITS.test(t.text));
/** Every settled string below its minimum (design §6.3 item 1), once per string, at the first frame it is drawn so. */
const sizeProblems = (frames: readonly Frame[]): string[] => {
  const seen = new Map<string, string>();
  for (const f of frames) {
    const exempt = exemptAt(f);
    for (const t of [...textsOf(f.below), ...textsOf(f.above)]) {
      if (isExempt(exempt, t.element)) continue;
      const min = STRONG(t) ? TEXT_SIZE.strong : TEXT_SIZE.word;
      const key = `${t.element} "${t.text}" drawn at ${fmt(t.size)} (minimum ${min})`;
      if (t.size < min - 1e-9 && !seen.has(key)) seen.set(key, `${key} from frame ${f.frame}`);
    }
    for (const g of glyphsOf(f)) {
      const key = `square glyph ${g.glyph} drawn at ${fmt(g.size)} (minimum 30)`;
      if (g.settled && g.size < 30 && !seen.has(key)) seen.set(key, `${key} from frame ${f.frame}`);
    }
  }
  return [...seen.values()];
};

// ---------------------------------------------------------------- fixtures

const mapTree = (node: SvgNode, fn: (node: SvgNode, element: string | null) => SvgNode, element: string | null = null): SvgNode => {
  const name = node.attrs["data-element"] === undefined ? element : String(node.attrs["data-element"]);
  const mapped = fn(node, name);
  return { ...mapped, children: mapped.children.map((c) => (typeof c === "string" ? c : mapTree(c, fn, name))) };
};
const textOf = (n: SvgNode): string => n.children.map((c) => (typeof c === "string" ? c : textOf(c))).join("");
const editText = (frames: Frame[], element: string, match: (text: string) => boolean, attrs: Record<string, string | number>): Frame[] =>
  frames.map((f) => ({ ...f, above: mapTree(f.above, (n, e) => (n.tag === "text" && e === element && match(textOf(n)) ? { ...n, attrs: { ...n.attrs, ...attrs } } : n)) }));

// ---------------------------------------------------------------- tests

describe("Topology layout and layers", () => {
  test("Layout equals the design", () => {
    // Design §6.1 and §4.3, transcribed by hand (stage units).
    expect([STAGE, STAGE_SCALE, TEXT_SIZE]).toEqual([{ width: 960, height: 540 }, 2, { word: 33, strong: 36 }]);
    expect(CHECKOUT).toEqual({ x: 24, y: 164, width: 180, height: 150 });
    expect(CHECKOUT_LABEL).toEqual({ cx: 114, cy: 146, width: 170, height: 50 });
    expect(PAYMENT).toEqual({ x: 756, ys: [164, 214, 264], width: 180 });
    expect(PAYMENT_LIGHTS).toEqual([{ x: 912, y: 184 }, { x: 912, y: 234 }, { x: 912, y: 284 }]);
    expect(PAYMENT_LABEL).toEqual({ cx: 846, cy: 146, width: 160, height: 50 });
    expect(BREAKER).toEqual({ x: 310, y: 196, width: 340, height: 110 });
    expect(STATE_PILL).toEqual({ cx: 480, cy: 184, height: 54, widths: { closed: 180, open: 180, halfOpen: 240 } });
    expect(RETRY).toEqual({ cx: 114, cy: 314, width: 150, height: 50 });
    expect(BADGE).toEqual({ cx: 912, cy: 52 });
    expect(REWIND_MARK).toEqual({ x: 826, y: 28, size: 48 });
    expect(CLOCK).toEqual({ cx: 330, cy: 70, size: 56 });
    expect(CLOCK_LABEL).toEqual({ x: 372, y: 82 });
    expect(TAGS).toEqual({ y: 362, x: { direct: 480, left: 257, right: 703 } });
    expect(TAG_WIDTHS).toEqual({ timeout: 262, open: 420, ok: 84, business: 84 });
    expect(MESSAGE).toEqual({ x: 24, y: 412 });
    expect(SQUARE).toEqual({ size: 50, x0: 360, step: 60, y: 382 });
    expect(BAR).toEqual({ x: 360, y: 442, width: 290, height: 16, threshold: 0.8 });
    expect(REQUESTS).toEqual({ badge: { cx: 60, cy: 500 }, label: { x: 106, y: 512 } });
    expect(CALLS_COUNTER).toEqual({ badge: { cx: 700, cy: 500 }, ghost: { cx: 622, cy: 500 }, label: { x: 936, y: 512 } });
    expect([GHOST_OPACITY, TOKEN_RADIUS]).toEqual([0.4, 10]);
    expect(ROUTES).toEqual({
      "direct-req": [{ x: 208, y: 228 }, { x: 752, y: 228 }], "direct-rep": [{ x: 752, y: 266 }, { x: 208, y: 266 }],
      "in-req": [{ x: 208, y: 228 }, { x: 306, y: 228 }], "out-req": [{ x: 654, y: 228 }, { x: 752, y: 228 }],
      "out-rep": [{ x: 752, y: 266 }, { x: 654, y: 266 }], "in-rep": [{ x: 306, y: 266 }, { x: 208, y: 266 }],
    });
    expect(DROP_PATH).toEqual([{ x: 480, y: -60 }, { x: 480, y: 251 }]);
    expect(RINGS_CENTRE).toEqual({ x: 960, y: 540 });
    expect(ANCHORS.window).toEqual({ x: 505, y: 420 });
  });

  test("Layer order", () => {
    for (const frame of [870, 1300]) {
      const f = FRAMES[frame];
      // Within each layer's bodies group and its words group, the elements follow the layer's order.
      const order = (group: SvgNode | string) => (typeof group === "string" ? [] : [...new Set(walk(group).flatMap((w) => (w.node.attrs["data-element"] === undefined ? [] : [String(w.node.attrs["data-element"])])))]);
      const sortedBy = (names: string[], list: readonly string[]) => expect(names.map((n) => list.indexOf(n)), `${frame}`).toEqual([...names.map((n) => list.indexOf(n))].sort((a, b) => a - b));
      for (const group of f.below.children) sortedBy(order(group), BELOW_ORDER);
      for (const group of f.above.children) sortedBy(order(group), ABOVE_ORDER);
      const below = order(f.below.children[0]);
      expect([...below, ...order(f.above.children[0])].every((n) => [...BELOW_ORDER, ...ABOVE_ORDER].includes(n as never))).toBe(true);
      expect(below.filter((n) => n.startsWith("arrow-")).length, `${frame}`).toBeGreaterThan(0);
      // Arrows first, then the blocks.
      expect(below.findIndex((n) => !n.startsWith("arrow-")), `${frame}`).toBe(below.filter((n) => n.startsWith("arrow-")).length);
      expect(f.components.tokens.length, `${frame} has tokens`).toBeGreaterThan(0);
    }
    expect(FRAMES[870].above).toBeDefined();
    // The composition's layers (design §6.2): rings, drop path, stage below (arrows, blocks), window/bar/clock, tokens, stage above (labels, tags).
    const source = readFileSync(join(repoRoot, "src/scenes/circuit-breaker-topology/Scene.tsx"), "utf8");
    const jsx = source.slice(source.indexOf("<AbsoluteFill"));
    const marks = ["<Rings", "<MotionPath", "node={stage.below}", "<Square", "<FailureRateBar", "<Countdown", "<PositionedToken", "node={stage.above}"];
    const positions = marks.map((mark) => jsx.indexOf(mark));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  test("Placement at every checked frame", () => {
    expect(placementProblems(FRAMES)).toEqual([]);
  });

  test("Exempt and checked frames", () => {
    const names = (frame: number) => { const c = checkedAt(FRAMES[frame]); return new Set([...c.texts.map((t) => t.element), ...c.blocks.map((b) => b.element)]); };
    const at531 = names(531), at560 = names(560), at1681 = names(1681);
    expect(at531.has("breaker")).toBe(false);
    for (const n of ["checkout", "checkout-label", "payment unit 0", "payment-label"]) expect(at531.has(n), n).toBe(true);
    for (const n of ["checkout", "payment unit 0", "breaker"]) expect(at560.has(n), n).toBe(true);
    // The state pill popped at 548 settles at 578, the window popped at 554 at 584 (design §6.3 item 7).
    expect(at560.has("state-pill")).toBe(false);
    expect(names(578).has("state-pill")).toBe(true);
    expect([...at560].some((n) => n.startsWith("window"))).toBe(false);
    expect(exemptAt(FRAMES[583]).has("window")).toBe(true);
    expect(exemptAt(FRAMES[584]).has("window")).toBe(false);
    expect([...at1681].some((n) => n.startsWith("window"))).toBe(false);
    for (const n of ["tag-left", "tag-right"]) expect(at1681.has(n), n).toBe(false);
    for (const n of ["checkout", "payment unit 0", "payment-label", "breaker", "state-pill"]) expect(at1681.has(n), n).toBe(true);
    expect(names(1684).has("tag-right")).toBe(true);
    expect(names(1706).has("tag-left")).toBe(true);
    expect(checkedAt(FRAMES[1681]).tokens.length).toBeGreaterThan(0);
  });

  test("Collision rejected", () => {
    const moved = editText(FRAMES, "message", () => true, { x: 300 });
    const problems = placementProblems(moved);
    expect(problems[0]).toMatch(/^frame 874: message "payment temporarily" crosses window /);
  });

  test("Badge collision rejected", () => {
    // The take badge moved 14 units left of where design §6.1 puts it, onto the rewind mark (whose box is
    // read from REWIND_MARK, as uiIcon draws paths the tree reader does not measure).
    const moved = FRAMES.map((f) => ({ ...f, above: mapTree(f.above, (n) => (n.attrs["data-element"] === "badge" ? { ...n, attrs: { ...n.attrs, transform: `translate(-14 0)${n.attrs.transform ? ` ${n.attrs.transform}` : ""}` } } : n)) }));
    const problems = placementProblems(moved);
    expect(problems.some((p) => / badge badge crosses rewind-mark$/.test(p))).toBe(true);
    expect(placementProblems(FRAMES).filter((p) => p.includes("rewind-mark"))).toEqual([]);
  });

  test("Covered light rejected", () => {
    const moved = FRAMES.map((f) => ({ ...f, above: mapTree(f.above, (n) => (n.attrs["data-element"] === "payment-label" ? { ...n, attrs: { ...n.attrs, transform: "translate(0 14)" } } : n)) }));
    expect(placementProblems(moved)).toContain("frame 38: payment-label covers unit 0's light");
  });
});

describe("Topology text size", () => {
  test("Every settled string at its minimum", () => {
    expect(sizeProblems(FRAMES)).toEqual([]);
    // Every word is drawn at least once settled, so the check reaches all of them.
    const sizes = new Map<string, number>();
    for (const f of FRAMES) { const exempt = exemptAt(f); for (const t of [...textsOf(f.below), ...textsOf(f.above)]) if (!isExempt(exempt, t.element)) sizes.set(t.text, Math.min(sizes.get(t.text) ?? Infinity, t.size)); }
    for (const word of ["CLOSED", "OPEN", "HALF_OPEN", "1", "2", "60", "20", "5"]) expect(sizes.get(word), word).toBeGreaterThanOrEqual(36);
    for (const word of ["Checkout", "Payment", "retry ×3", "circuit-breaker:", "execute", "HTTP:TIMEOUT", "CIRCUIT-BREAKER:OPEN", "payment temporarily", "unavailable", "200", "400", "resetTimeout 10s", "requests", "backend calls"]) {
      expect(sizes.get(word), word).toBeGreaterThanOrEqual(33);
    }
    expect(Math.min(...FRAMES.flatMap(glyphsOf).filter((g) => g.settled).map((g) => g.size))).toBeCloseTo(31, 9);
  });

  test("Too small rejected", () => {
    expect(sizeProblems(editText(FRAMES, "requests", (t) => t === "requests", { "font-size": 32 }))).toEqual(['requests "requests" drawn at 32 (minimum 33) from frame 54']);
    expect(sizeProblems(editText(FRAMES, "state-pill", () => true, { "font-size": 35 }))[0]).toBe('state-pill "CLOSED" drawn at 35 (minimum 36) from frame 578');
    const small = FRAMES.map((f) => (f.components.window === null ? f : { ...f, components: { ...f.components, window: { ...f.components.window, squares: f.components.window.squares.map((q) => ({ ...q, size: 48 })) } } }));
    expect(sizeProblems(small)).toEqual(["square glyph ✕ drawn at 29.76 (minimum 30) from frame 672", "square glyph ✓ drawn at 29.76 (minimum 30) from frame 1332"]);
  });
});

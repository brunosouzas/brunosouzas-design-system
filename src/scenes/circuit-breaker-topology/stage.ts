// The circuit-breaker topology scene's stage at a frame, as piece trees and
// component props with no React (change circuit-breaker-topology-scene, design
// §3 and §6): `stageOf(state)` gives the two stage SVG layers in 960 × 540
// stage units (`below`, layer 3: arrows, then Checkout, Payment and the
// breaker; `above`, layer 6: labels, state pill, `retry ×3`, tags, clock label,
// customer message, counters, badge and rewind mark), and `componentsOf(state)`
// the props of the React components (layer 4: window squares, the dropped
// square, the bar and the clock; layer 5: the tokens). Scene.tsx draws them;
// the tests read words, colours and positions from the same data.
//
// The scene draws only through the package's pieces and components (MOT-6):
// this file computes parameters, positions and pop-in wrappers and creates no
// shape of its own. Every element sits in a group named by `data-element`. An
// element that is not drawn (opacity 0 or scale at most 0.001) is left out.
import { tokens } from "../../../tokens/generated/tokens";
import type { Point } from "../../brand/motion";
import type { SlotKind } from "../../brand/motion";
import { browserWindow, countBadge, diagramBox, edgeLabel, messageArrow, serverStack, uiIcon } from "../../pieces/library.ts";
import { g, type Drawn, type SvgNode } from "../../pieces/node.ts";
import {
  ANCHORS, BADGE, BAR, BREAKER, CALLS_COUNTER, CHECKOUT, CHECKOUT_LABEL, CLOCK, CLOCK_LABEL, GHOST_OPACITY, MESSAGE, PAYMENT, PAYMENT_LABEL,
  REQUESTS, RETRY, REWIND_MARK, ROUTES, SQUARE, STATE_PILL, TAGS, TAG_WIDTHS, TEXT_SIZE, TOKEN_RADIUS, slotX,
} from "./layout";
import { drawn as isDrawn, frameAt, type Appear, type TopologyState } from "./frame";
import { text } from "./scene.ts";
import type { Route, StateName, TagPlace, TagText } from "./timeline";

const words = text.en;
const STATE_FILL: Record<StateName, string> = { closed: "color.state.healthy", open: "color.state.blocked", halfOpen: "color.state.transitional" };
const TAG_WORDS: Record<TagText, string> = { timeout: words.timeout, open: words.open, ok: words.ok, business: words.business };

// ---------------------------------------------------------------- groups

/** The cover command's groups (src/pieces/cover.ts): bodies outlined in ink, words in the label face. */
const outlinedGroup = (...bodies: SvgNode[]) => g({ stroke: tokens.color.ink, "stroke-width": tokens.outline.block, "stroke-linejoin": "round" }, ...bodies);
const labelsGroup = (...texts: SvgNode[]) =>
  g({ "font-family": tokens.font.sans, "font-size": tokens.cover.labelSize, "font-weight": tokens.cover.labelWeight, fill: tokens.color.ink, "text-anchor": "middle" }, ...texts);
const layer = (name: string, pieces: readonly Drawn[]): SvgNode =>
  g({ "data-layer": name }, outlinedGroup(...pieces.flatMap((d) => d.body)), labelsGroup(...pieces.flatMap((d) => d.text)));

const merge = (...parts: Drawn[]): Drawn => ({ body: parts.flatMap((d) => d.body), text: parts.flatMap((d) => d.text) });
const settled = (a: Appear) => a.opacity === 1 && a.scale === 1;
/** A piece popping about `anchor`, at an extra `opacity`: scaled and faded in a group; settled and opaque, the piece as it is. */
const shown = (drawn: Drawn, appear: Appear, anchor: Point, opacity = 1): Drawn => {
  if (settled(appear) && opacity === 1) return drawn;
  const attrs = {
    ...(appear.scale === 1 ? {} : { transform: `translate(${anchor.x} ${anchor.y}) scale(${appear.scale}) translate(${-anchor.x} ${-anchor.y})` }),
    opacity: appear.opacity * opacity,
  };
  return { body: drawn.body.length > 0 ? [g(attrs, ...drawn.body)] : [], text: drawn.text.length > 0 ? [g(attrs, ...drawn.text)] : [] };
};
/** One stage element, named so the tests can read the layers (SCN-6) and the colour roles. */
const element = (name: string, drawn: Drawn): Drawn => ({
  body: drawn.body.length > 0 ? [g({ "data-element": name }, ...drawn.body)] : [],
  text: drawn.text.length > 0 ? [g({ "data-element": name }, ...drawn.text)] : [],
});

// ---------------------------------------------------------------- pieces

/** A pill from `diagramBox`, centred: the pill piece itself has no text size (design §3). */
const pillBox = (cx: number, cy: number, width: number, height: number, line: string, fill: string, textSize: number) =>
  diagramBox({ shape: "pill", x: cx - width / 2, y: cy - height / 2, width, height, text: [line], fill, textSize });

export const breakerBox = (centre: Point) =>
  diagramBox({ x: centre.x - BREAKER.width / 2, y: centre.y - BREAKER.height / 2, width: BREAKER.width, height: BREAKER.height, text: [...words.breaker], fill: "color.white", textSize: TEXT_SIZE.word });

const arrowOf = (route: Route, a: NonNullable<TopologyState["arrows"][Route]>): Drawn => {
  const [from, to] = ROUTES[route];
  const drawn = messageArrow({ from: [from.x, from.y], to: [to.x, to.y], curve: "straight", width: tokens.outline.arrow, kind: a.kind, dashed: a.dashed });
  return a.opacity === 1 ? drawn : { body: [g({ opacity: a.opacity }, ...drawn.body)], text: [] };
};

const paymentUnits = (failing: TopologyState["failing"]): Drawn =>
  merge(...PAYMENT.ys.map((y, i) => serverStack({ x: PAYMENT.x, y, width: PAYMENT.width, units: 1, ...(failing[i] ? { fill: "color.state.failure", failing: 0 } : {}) })));

const tagOf = (place: TagPlace, t: NonNullable<TopologyState["tags"][TagPlace]>): Drawn =>
  shown(edgeLabel({ x: TAGS.x[place], y: TAGS.y, lines: [TAG_WORDS[t.text]], backdrop: true, width: TAG_WIDTHS[t.text], textSize: TEXT_SIZE.word, anchor: "middle" }), t.appear, { x: TAGS.x[place], y: TAGS.y - 9 });

// ---------------------------------------------------------------- layers

/** Layer 3, bottom to top: the arrows, then Checkout's window, Payment's units and the breaker box (design §6.2). */
export const BELOW_ORDER = ["arrow-direct-req", "arrow-direct-rep", "arrow-in-req", "arrow-out-req", "arrow-out-rep", "arrow-in-rep", "checkout", "payment", "breaker"] as const;
/** Layer 6, bottom to top. */
export const ABOVE_ORDER = [
  "checkout-label", "payment-label", "state-pill", "retry", "tag-direct", "tag-left", "tag-right", "clock-label", "message", "requests", "ghost", "calls", "badge", "rewind-mark",
] as const;

const belowOf = (s: TopologyState): SvgNode => {
  const parts: [string, Drawn | null][] = [
    ...(["direct-req", "direct-rep", "in-req", "out-req", "out-rep", "in-rep"] as const).map((route): [string, Drawn | null] => {
      const a = s.arrows[route];
      return [`arrow-${route}`, a === null || a.opacity <= 0 ? null : arrowOf(route, a)];
    }),
    ["checkout", isDrawn(s.checkout) ? shown(browserWindow(CHECKOUT), s.checkout, ANCHORS.checkout) : null],
    ["payment", isDrawn(s.payment) ? shown(paymentUnits(s.failing), s.payment, ANCHORS.payment) : null],
    ["breaker", s.breaker === null ? null : breakerBox(s.breaker)],
  ];
  return layer("below", parts.flatMap(([name, d]) => (d === null ? [] : [element(name, d)])));
};

const counterLabel = (x: number, line: string, anchor: "start" | "end") => edgeLabel({ x, y: REQUESTS.label.y, lines: [line], textSize: TEXT_SIZE.word, anchor });

const aboveOf = (s: TopologyState): SvgNode => {
  const parts: Record<(typeof ABOVE_ORDER)[number], Drawn | null> = {
    "checkout-label": isDrawn(s.checkout) ? shown(pillBox(CHECKOUT_LABEL.cx, CHECKOUT_LABEL.cy, CHECKOUT_LABEL.width, CHECKOUT_LABEL.height, words.checkout, "color.state.caller", TEXT_SIZE.word), s.checkout, ANCHORS.checkout) : null,
    "payment-label": isDrawn(s.payment) ? shown(pillBox(PAYMENT_LABEL.cx, PAYMENT_LABEL.cy, PAYMENT_LABEL.width, PAYMENT_LABEL.height, words.payment, "color.white", TEXT_SIZE.word), s.payment, ANCHORS.payment) : null,
    "state-pill": s.state !== null && isDrawn(s.state.appear)
      ? shown(pillBox(STATE_PILL.cx, STATE_PILL.cy, STATE_PILL.widths[s.state.name], STATE_PILL.height, words.states[s.state.name], STATE_FILL[s.state.name], TEXT_SIZE.strong), s.state.appear, ANCHORS.statePill)
      : null,
    retry: isDrawn(s.retry) ? shown(pillBox(RETRY.cx, RETRY.cy, RETRY.width, RETRY.height, words.retry, "color.white", TEXT_SIZE.word), s.retry, ANCHORS.retry) : null,
    "tag-direct": s.tags.direct !== null && isDrawn(s.tags.direct.appear) ? tagOf("direct", s.tags.direct) : null,
    "tag-left": s.tags.left !== null && isDrawn(s.tags.left.appear) ? tagOf("left", s.tags.left) : null,
    "tag-right": s.tags.right !== null && isDrawn(s.tags.right.appear) ? tagOf("right", s.tags.right) : null,
    "clock-label": s.clock !== null && isDrawn(s.clock.appear)
      ? shown(edgeLabel({ x: CLOCK_LABEL.x, y: CLOCK_LABEL.y, lines: [words.clock], textSize: TEXT_SIZE.word, anchor: "start" }), s.clock.appear, ANCHORS.clock, s.clock.opacity)
      : null,
    message: isDrawn(s.message) ? shown(edgeLabel({ x: MESSAGE.x, y: MESSAGE.y, lines: [...words.message], textSize: TEXT_SIZE.word, anchor: "start" }), s.message, { x: MESSAGE.x, y: MESSAGE.y }) : null,
    requests: s.counters !== null && isDrawn(s.counters.appear)
      ? shown(merge(countBadge({ ...REQUESTS.badge, text: String(s.counters.requests), textSize: TEXT_SIZE.strong }), counterLabel(REQUESTS.label.x, words.requests, "start")), s.counters.appear, ANCHORS.requests)
      : null,
    ghost: s.counters !== null && isDrawn(s.counters.ghost)
      ? shown(countBadge({ ...CALLS_COUNTER.ghost, text: "60", textSize: TEXT_SIZE.strong }), s.counters.ghost, ANCHORS.ghost, GHOST_OPACITY)
      : null,
    calls: s.counters !== null && isDrawn(s.counters.appear)
      ? shown(merge(countBadge({ ...CALLS_COUNTER.badge, text: String(s.counters.calls), textSize: TEXT_SIZE.strong }), counterLabel(CALLS_COUNTER.label.x, words.calls, "end")), s.counters.appear, ANCHORS.calls)
      : null,
    badge: s.badge !== null && isDrawn(s.badge.appear) ? shown(countBadge({ ...BADGE, text: words.takes[s.badge.take - 1], textSize: TEXT_SIZE.strong }), s.badge.appear, ANCHORS.badge) : null,
    "rewind-mark": isDrawn(s.rewindMark) ? shown(uiIcon({ name: "reset", ...REWIND_MARK }), s.rewindMark, ANCHORS.rewindMark) : null,
  };
  return layer("above", ABOVE_ORDER.flatMap((name) => (parts[name] === null ? [] : [element(name, parts[name]!)])));
};

export type Stage = { below: SvgNode; above: SvgNode };
export const stageOf = (s: TopologyState): Stage => ({ below: belowOf(s), above: aboveOf(s) });

// ---------------------------------------------------------------- components

/** A `CallSquare` at its place, in stage units: `appearAt` drives its own spring; `opacity` multiplies its look. */
export type SquareProps = { id: string; kind: SlotKind; appearAt: number; x: number; y: number; size: number; opacity: number };
export type Components = {
  /** The window group (squares and bar) and its pop and dim, about ANCHORS.window. */
  window: { appear: Appear; opacity: number; squares: readonly SquareProps[]; bar: { x: number; y: number; width: number; height: number; threshold: number; rate: number } } | null;
  dropped: (SquareProps & { appear: Appear }) | null;
  clock: { cx: number; cy: number; size: number; left: number; appear: Appear; opacity: number } | null;
  tokens: readonly { id: string; route: Route; point: Point; radius: number }[];
};

export const componentsOf = (s: TopologyState): Components => ({
  window: s.window === null || !isDrawn(s.window.appear) ? null : {
    appear: s.window.appear,
    opacity: s.window.opacity,
    squares: [
      ...s.window.empty.map((slot) => ({ id: `slot-${slot}`, kind: "empty" as const, appearAt: 0, x: slotX(slot), y: SQUARE.y, size: SQUARE.size, opacity: 1 })),
      ...s.window.squares.map((q) => ({ id: q.id, kind: q.kind, appearAt: q.appearAt, x: q.x, y: SQUARE.y, size: SQUARE.size, opacity: q.opacity })),
    ],
    bar: { x: BAR.x, y: BAR.y, width: BAR.width, height: BAR.height, threshold: BAR.threshold, rate: s.window.rate },
  },
  dropped: s.dropped === null || !isDrawn(s.dropped.appear) || s.dropped.opacity <= 0 ? null : {
    id: "dropped", kind: "empty", appearAt: 0, x: slotX(5), y: SQUARE.y + s.dropped.fall, size: SQUARE.size, opacity: s.dropped.opacity, appear: s.dropped.appear,
  },
  clock: s.clock === null || !isDrawn(s.clock.appear) ? null : { ...CLOCK, left: s.clock.left, appear: s.clock.appear, opacity: s.clock.opacity },
  tokens: s.tokens.map((t) => ({ ...t, radius: TOKEN_RADIUS })),
});

/**
 * The tree with every `font-family` that names the sans token stack replaced by
 * `family`. Why: the pieces name the face "Source Sans 3" (ADR 0008, the name
 * their embedded fonts use), but @remotion/google-fonts registers it as
 * "Source Sans Three", so in a video frame the SVG words would fall back to
 * Helvetica. Scene.tsx passes fonts.ts's `sans`, which starts with the loaded
 * family; the monospace face is registered under its own name and is left as is.
 */
export const withSansFamily = (node: SvgNode, family: string): SvgNode => ({
  ...node,
  attrs: node.attrs["font-family"] === tokens.font.sans ? { ...node.attrs, "font-family": family } : node.attrs,
  children: node.children.map((child) => (typeof child === "string" ? child : withSansFamily(child, family))),
});

/** The stage and the component props at `frame`. */
export const stageAt = (frame: number) => {
  const state = frameAt(frame);
  return { state, ...stageOf(state), components: componentsOf(state) };
};

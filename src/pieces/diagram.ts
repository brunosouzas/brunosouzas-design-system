// Body diagram pieces (spec illustration-pieces, change body-diagram-pieces,
// design §3 and §4): the shapes, lines and labels of the blog's body diagrams
// that the metro and diagram pieces lack. Like those, they paint what the caller
// lays out; positions, text measurement and truncation stay with the caller.
//
// What can go wrong: every parameter is checked by its schema first; the limits
// between parameters are checked in the order of design §3 and the first one is
// thrown as a RangeError naming the parameter.
import { tokens } from "../../tokens/generated/tokens.ts";
import { inkOf, inkSchema, limits, roomFor, sticker, surfaceParam, type Ink, type Point, type Shape, type SurfaceName } from "./ink.ts";
import { drawn, el, r2, type Attrs, type SvgNode } from "./node.ts";
import { col, colour, label, MAX_SIZE, pos, size, type ParamSpec, type Problem, type Schema } from "./params.ts";
import { definePiece } from "./piece.ts";

const ink = tokens.color.ink;
const font = tokens.font.sans;
const bold = tokens.font.weightBold;
const M = tokens.map;

const lines = (max: number): ParamSpec => ({ kind: "array", required: true, minItems: 1, maxItems: max, of: label() });
const textSize: ParamSpec = { kind: "number", min: 6, max: 48 };

// ---------- words ----------

/** Characters of a word for a width estimate: backticks do not count. */
const characters = (value: string) => Array.from(value.replace(/`/g, "")).length;

/** Backticks mark code (design §4): with an even number of them, each part between backticks becomes a tspan in
 * the monospace stack; empty parts are dropped. With an odd number, the string is drawn as is. */
const spans = (value: string): (SvgNode | string)[] => {
  const parts = value.split("`");
  if (parts.length % 2 === 0) return [value];
  return parts.flatMap<SvgNode | string>((part, i) => (part === "" ? [] : i % 2 === 1 ? [el("tspan", { "font-family": tokens.font.mono }, part)] : [part]));
};

// Every text sets its own anchor, size and weight, so a surrounding group (a cover's label style) does not leak in.
const words = (x: number, y: number, value: string, attrs: Attrs): SvgNode => el("text", { x: r2(x), y: r2(y), "font-family": font, ...attrs }, ...spans(value));

type Colours = { face: string; text: string; sub: string };
/** No fill: the surface's panel with its text; a fill: that token with ink words (ADR 0003). */
const coloursOf = (fill: string | undefined, params: Ink): Colours => {
  const { s } = inkOf(params);
  return fill === undefined ? { face: s.panel, text: s.text, sub: s.muted } : { face: colour(fill, "fill"), text: ink, sub: ink };
};

/** Centred lines (bold) and an optional subtitle (11, regular), centred on (cx, cy). */
const centred = (cx: number, cy: number, text: string[], subtitle: string | undefined, c: Colours, size_: number = M.labelSize): SvgNode[] => {
  const step = size_ * 1.25;
  const block = (text.length - 1) * step + (subtitle === undefined ? 0 : 15);
  const first = cy + (4.5 * size_) / 13 - block / 2;
  return [
    ...text.map((line, i) => words(cx, first + i * step, line, { fill: c.text, "font-size": size_, "font-weight": bold, "text-anchor": "middle" })),
    ...(subtitle === undefined ? [] : [words(cx, first + (text.length - 1) * step + 15, subtitle, { fill: c.sub, "font-size": 11, "font-weight": 400, "text-anchor": "middle" })]),
  ];
};

/** Room on the smaller of width and height, naming the smaller one. */
const roomOn = (width: number, height: number, params: Ink): Problem | false =>
  width < height ? roomFor("width", width, params) : roomFor("height", height, params);

const polygon = (points: Point[]): Shape => (dx, dy, attrs) => el("polygon", { points: points.map(([px, py]) => `${r2(px + dx)},${r2(py + dy)}`).join(" "), ...attrs });
const rect = (x: number, y: number, w: number, h: number, rx: number): Shape => (dx, dy, attrs) =>
  el("rect", { x: r2(x + dx), y: r2(y + dy), width: r2(w), height: r2(h), rx: r2(rx), ...attrs });

// ---------- shapes ----------

export type ShapeParams = Ink & { x: number; y: number; width: number; height?: number; text: string[]; subtitle?: string; fill?: string; textSize?: number };
const shapeSchema = (heightRequired: boolean): Schema => ({
  x: pos(),
  y: pos(),
  width: size(true),
  height: size(heightRequired),
  text: lines(3),
  subtitle: label(false),
  fill: col(),
  textSize,
  ...inkSchema,
});

export type DiagramBoxParams = ShapeParams & { radius?: number; shape?: "box" | "pill" };
/** A box or a pill with a fill and centred lines: a body diagram's step, system or note. */
export const diagramBox = definePiece<DiagramBoxParams>(
  "diagramBox",
  { ...shapeSchema(false), radius: { kind: "number", min: 0, max: MAX_SIZE }, shape: { kind: "enum", values: ["box", "pill"] } },
  (params) => {
    const { x, y, width, height = M.nodeHeight, text, subtitle, fill, shape = "box" } = params;
    const radius = shape === "pill" ? height / 2 : (params.radius ?? Math.min(M.nodeRadius, height / 2));
    const c = coloursOf(fill, params);
    return drawn(sticker(rect(x, y, width, height, radius), c.face, params), centred(x + width / 2, y + height / 2, text, subtitle, c, params.textSize));
  },
  (params) => {
    const height = params.height ?? M.nodeHeight;
    return limits(
      roomOn(params.width, height, params),
      params.shape === "pill" && params.radius !== undefined && { path: "radius", message: "cannot be combined with shape pill" },
      params.radius !== undefined && params.radius > height / 2 && { path: "radius", message: `must be at most half the height (${r2(height / 2)}), found ${r2(params.radius)}` },
    );
  },
);

/** A decision: a diamond in its bounds. */
export const decisionNode = definePiece<ShapeParams & { height: number }>(
  "decisionNode",
  shapeSchema(true),
  (params) => {
    const { x, y, width: w, height: h, text, subtitle, fill } = params;
    const c = coloursOf(fill, params);
    const shape = polygon([[x + w / 2, y], [x + w, y + h / 2], [x + w / 2, y + h], [x, y + h / 2]]);
    return drawn(sticker(shape, c.face, params), centred(x + w / 2, y + h / 2, text, subtitle, c, params.textSize));
  },
  (params) => limits(roomOn(params.width, params.height, params)),
);

export type StoreNodeParams = ShapeParams & { height: number; ry?: number };
/** A store: a cylinder in its bounds, with the front of its lid. */
export const storeNode = definePiece<StoreNodeParams>(
  "storeNode",
  { ...shapeSchema(true), ry: size() },
  (params) => {
    const { x, y, width: w, height: h, text, subtitle, fill, ry = 8 } = params;
    const c = coloursOf(fill, params);
    const { outline } = inkOf(params);
    const rx = r2(w / 2);
    const body: Shape = (dx, dy, attrs) =>
      el("path", { d: `M${r2(x + dx)},${r2(y + ry + dy)} A${rx},${ry} 0 0 1 ${r2(x + w + dx)},${r2(y + ry + dy)} V${r2(y + h - ry + dy)} A${rx},${ry} 0 0 1 ${r2(x + dx)},${r2(y + h - ry + dy)} Z`, ...attrs });
    const lid = el("path", { d: `M${r2(x)},${r2(y + ry)} A${rx},${ry} 0 0 0 ${r2(x + w)},${r2(y + ry)}`, fill: "none", stroke: ink, "stroke-width": r2(0.75 * outline) });
    return drawn([...sticker(body, c.face, params), lid], centred(x + w / 2, y + (h + ry) / 2, text, subtitle, c, params.textSize));
  },
  (params) => {
    const ry = params.ry ?? 8;
    return limits(roomOn(params.width, params.height, params), ry > params.height / 4 && { path: "ry", message: `must be at most a quarter of the height (${r2(params.height / 4)}), found ${r2(ry)}` });
  },
);

const RAIL = 10;
/** A queue: a box with a rail 10 in from each side. */
export const queueNode = definePiece<ShapeParams>(
  "queueNode",
  shapeSchema(false),
  (params) => {
    const { x, y, width: w, height: h = M.nodeHeight, text, subtitle, fill } = params;
    const c = coloursOf(fill, params);
    const { outline } = inkOf(params);
    const rails = el("path", { d: `M${r2(x + RAIL)},${r2(y)} V${r2(y + h)} M${r2(x + w - RAIL)},${r2(y)} V${r2(y + h)}`, fill: "none", stroke: ink, "stroke-width": r2(0.75 * outline) });
    return drawn([...sticker(rect(x, y, w, h, tokens.radius.small), c.face, params), rails], centred(x + w / 2, y + h / 2, text, subtitle, c, params.textSize));
  },
  (params) => {
    const height = params.height ?? M.nodeHeight;
    const least = Math.max(height, 2 * RAIL + 4 * inkOf(params).outline);
    return limits(
      roomFor("height", height, params),
      params.width < least && { path: "width", message: `must be at least the height and leave room for the rails (${r2(least)}), found ${r2(params.width)}` },
    );
  },
);

/** An exchange: a hexagon with its points 0.26 × height in, as the motion shape (src/brand/flow-shapes.ts). */
export const exchangeNode = definePiece<ShapeParams>(
  "exchangeNode",
  shapeSchema(false),
  (params) => {
    const { x, y, width: w, height: h = M.nodeHeight, text, subtitle, fill } = params;
    const c = coloursOf(fill, params);
    const k = 0.26 * h;
    const shape = polygon([[x + k, y], [x + w - k, y], [x + w, y + h / 2], [x + w - k, y + h], [x + k, y + h], [x, y + h / 2]]);
    return drawn(sticker(shape, c.face, params), centred(x + w / 2, y + h / 2, text, subtitle, c, params.textSize));
  },
  (params) => {
    const height = params.height ?? M.nodeHeight;
    return limits(roomFor("height", height, params), params.width < height && { path: "width", message: `must be at least the height (${r2(height)}), found ${r2(params.width)}` });
  },
);

// ---------- container ----------

const TAB = 24;
export type TaggedContainerParams = Ink & { x: number; y: number; width: number; height: number; tag: string; tagWidth?: number; tagFill?: string; fill?: string };
const tabWidth = (params: TaggedContainerParams) => params.tagWidth ?? 7.2 * characters(params.tag) + 24;
/** A container (a platform, a broker) with its name on a tab centred on the top edge. */
export const taggedContainer = definePiece<TaggedContainerParams>(
  "taggedContainer",
  { x: pos(), y: pos(), width: size(true), height: size(true), tag: label(), tagWidth: size(), tagFill: col(), fill: col(), ...inkSchema },
  (params) => {
    const { x, y, width, height, tag, tagFill = "color.transitional", fill } = params;
    const tw = tabWidth(params);
    const c = coloursOf(fill, params);
    return drawn(
      [...sticker(rect(x, y, width, height, M.nodeRadius), c.face, params), ...sticker(rect(x + 14, y - TAB / 2, tw, TAB, TAB / 2), colour(tagFill, "tagFill"), params)],
      [words(x + 14 + tw / 2, y + 4.5, tag, { fill: ink, "font-size": M.badgeTextSize, "font-weight": bold, "text-anchor": "middle" })],
    );
  },
  (params) => {
    const tw = tabWidth(params);
    const need = 4 * inkOf(params).outline;
    return limits(
      roomOn(params.width, params.height, params),
      tw < TAB && { path: "tagWidth", message: `must be at least the tab's height (${TAB}), found ${r2(tw)}` },
      TAB < need && { path: "inkScale", message: `leaves no room for the tab's outline: the tab is ${TAB} high and needs ${r2(need)}` },
      params.width < tw + 28 && { path: "width", message: `leaves no room for the tag: needs at least ${r2(tw + 28)}` },
    );
  },
);

// ---------- sequence ----------

export type LifelineParams = { x: number; y1: number; y2: number; state?: "active" | "inactive"; width?: number; surface?: SurfaceName };
/** A participant's lifeline: dashed while active, sparse dots once nothing calls it. */
export const lifeline = definePiece<LifelineParams>(
  "lifeline",
  { x: pos(), y1: pos(), y2: pos(), state: { kind: "enum", values: ["active", "inactive"] }, width: { kind: "number", min: 0, exclusiveMin: true, max: 12 }, surface: surfaceParam },
  ({ x, y1, y2, state = "active", width = 1.75, surface = "light" }) => {
    const active = state === "active";
    // Width as given, like pipe's: a valid hairline must not round to zero.
    return drawn([
      el("line", { x1: r2(x), y1: r2(y1), x2: r2(x), y2: r2(y2), stroke: tokens.surface[surface].muted, "stroke-width": width, "stroke-dasharray": active ? "5 5" : "1 6", "stroke-linecap": active ? "butt" : "round" }),
    ]);
  },
  ({ y1, y2 }) => limits(y1 === y2 && { path: "y2", message: "must differ from y1" }),
);

export type PhaseBandParams = Ink & { x: number; y: number; width: number; height?: number; text: string; fill: string; textSize?: number };
/** A phase of a sequence: a pill across the diagram in its state's colour. */
export const phaseBand = definePiece<PhaseBandParams>(
  "phaseBand",
  { x: pos(), y: pos(), width: size(true), height: size(), text: label(), fill: { kind: "color", required: true }, textSize, ...inkSchema },
  (params) => {
    const { x, y, width, height = 26, text, fill, textSize: size_ = M.labelSize } = params;
    return drawn(sticker(rect(x, y, width, height, height / 2), colour(fill, "fill"), params), [
      words(x + width / 2, y + height / 2 + (4.5 * size_) / 13, text, { fill: ink, "font-size": size_, "font-weight": bold, "text-anchor": "middle" }),
    ]);
  },
  (params) => {
    const height = params.height ?? 26;
    return limits(roomFor("height", height, params), params.width < height && { path: "width", message: `must be at least the height (${r2(height)}), found ${r2(params.width)}` });
  },
);

type Head = { tag: string; condition?: string; tagWidth?: number; conditionWidth?: number };
export type AltFrameParams = Head & { x: number; y: number; width: number; height: number; sections?: (Head & { y: number })[]; surface?: SurfaceName };
/** An alt/else frame: the frame, a dashed divider per section, and a tag (with its condition) per part. */
export const altFrame = definePiece<AltFrameParams>(
  "altFrame",
  {
    x: pos(),
    y: pos(),
    width: size(true),
    height: size(true),
    tag: label(),
    condition: label(false),
    tagWidth: size(),
    conditionWidth: size(),
    sections: {
      kind: "array",
      maxItems: 10,
      of: { kind: "object", fields: { y: pos(), tag: label(), condition: label(false), tagWidth: size(), conditionWidth: size() } },
    },
    surface: surfaceParam,
  },
  ({ x, y, width, height, sections = [], surface = "light", ...first }) => {
    const s = tokens.surface[surface];
    const head = (top: number, { tag, condition, tagWidth, conditionWidth }: Head) => {
      const tw = tagWidth ?? 6.4 * characters(tag) + 14;
      const body = [el("rect", { x: r2(x + 7), y: r2(top + 6), width: r2(tw), height: 17, rx: 4, fill: s.text, stroke: "none" })];
      const text = [words(x + 7 + tw / 2, top + 18.5, tag, { fill: s.panel, "font-size": 10, "font-weight": tokens.font.weightHeavy, "text-anchor": "middle" })];
      if (condition !== undefined) {
        body.push(el("rect", { x: r2(x + 7 + tw + 2), y: r2(top + 7.5), width: r2(conditionWidth ?? 6.2 * characters(condition) + 8), height: 14, rx: 3, fill: s.background, stroke: "none" }));
        text.push(words(x + 7 + tw + 6, top + 18.5, condition, { fill: s.text, "font-size": 11, "font-weight": bold, "text-anchor": "start" }));
      }
      return { body, text };
    };
    const heads = [head(y, first), ...sections.map((section) => head(section.y, section))];
    return drawn(
      [
        el("rect", { x: r2(x), y: r2(y), width: r2(width), height: r2(height), rx: 7, fill: "none", stroke: s.text, "stroke-width": 1.75 }),
        ...sections.map((section) => el("line", { x1: r2(x), y1: r2(section.y), x2: r2(x + width), y2: r2(section.y), stroke: s.text, "stroke-width": 1.4, "stroke-dasharray": "4 4" })),
        ...heads.flatMap((part) => part.body),
      ],
      heads.flatMap((part) => part.text),
    );
  },
  ({ y, height, sections = [] }) =>
    limits(...sections.map((section, i) => (section.y <= y || section.y >= y + height) && { path: `sections[${i}].y`, message: "must lie inside the frame" })),
);

// ---------- labels ----------

export type EdgeLabelParams = { x: number; y: number; lines: string[]; anchor?: "start" | "middle" | "end"; backdrop?: boolean; width?: number; textSize?: number; surface?: SurfaceName };
/** Words next to an arrow: lines down from the baseline (x, y), optionally on a backdrop that hides what is behind. */
export const edgeLabel = definePiece<EdgeLabelParams>(
  "edgeLabel",
  { x: pos(), y: pos(), lines: lines(4), anchor: { kind: "enum", values: ["start", "middle", "end"] }, backdrop: { kind: "boolean" }, width: size(), textSize, surface: surfaceParam },
  ({ x, y, lines: rows, anchor = "middle", backdrop = false, width, textSize: size_ = 11, surface = "light" }) => {
    const s = tokens.surface[surface];
    const k = size_ / 11;
    const body = backdrop
      ? rows.map((row, i) => {
          const w = width ?? (6.2 * characters(row) + 8) * k;
          const left = anchor === "start" ? x - 4 * k : anchor === "end" ? x - w + 4 * k : x - w / 2;
          return el("rect", { x: r2(left), y: r2(y + (i * 13 - 10) * k), width: r2(w), height: r2(14 * k), rx: 3, fill: s.background, stroke: "none" });
        })
      : [];
    return drawn(body, rows.map((row, i) => words(x, y + i * 13 * k, row, { fill: s.text, "font-size": size_, "font-weight": bold, "text-anchor": anchor })));
  },
);

/** The body diagram pieces, in catalogue order (design §3). */
export const DIAGRAM_PIECES = { diagramBox, decisionNode, storeNode, queueNode, exchangeNode, taggedContainer, lifeline, phaseBand, altFrame, edgeLabel } as const;

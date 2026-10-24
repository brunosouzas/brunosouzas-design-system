// Metro and diagram pieces (spec illustration-pieces, change
// metro-and-diagram-pieces; design §3). They paint what the caller lays out:
// positions, text measurement and truncation stay with the consumer
// (stackledger's map engine). Each draws on a surface, light or dark, with the
// ink sticker of stackledger's map: hard shadow in the surface's shadow colour,
// a light rim on dark, then the face outlined in ink.
//
// What can go wrong: every parameter is checked by its schema first; the
// cross-parameter limits (room for the outline, width against height, arrow
// length) are checked here and thrown as a RangeError naming the parameter.
import { tokens } from "../../tokens/generated/tokens.ts";
import { atLeast, inkOf, inkSchema, limits, roomFor, sticker, surfaceParam, words, type Ink, type Point, type Shape, type SurfaceName } from "./ink.ts";
import { drawn, el, g, r2, type SvgNode } from "./node.ts";
import { col, colour, label, MAX_SIZE, PATH_DATA, paint, pos, size, type ParamSpec, type Problem, type Schema } from "./params.ts";
import { definePiece } from "./piece.ts";

export { SURFACES, type Ink, type SurfaceName } from "./ink.ts";

const ink = tokens.color.ink;
const white = tokens.color.white;
const font = tokens.font.sans;
const bold = tokens.font.weightBold;
const M = tokens.map;

const dataColour = (required = true): ParamSpec => ({ kind: "dataColor", required });
const point = (required = true): ParamSpec => ({ kind: "point", required });

const pill = (x: number, y: number, w: number, h: number): Shape => (dx, dy, attrs) =>
  el("rect", { x: r2(x + dx), y: r2(y + dy), width: r2(w), height: r2(h), rx: r2(h / 2), ...attrs });

// ---------- metro ----------

export type LineBadgeParams = Ink & { x: number; y: number; text?: string; fill: string; width?: number; height?: number; flat?: boolean };
// Without a text, the default width is the one-character width (card 167).
const badgeWidth = ({ width, text }: LineBadgeParams) => width ?? Math.max(30, 7.6 * (text === undefined ? 1 : Array.from(text).length) + 18);
/** A line's terminal badge: a pill in the line colour with its code in white, centred on (x, y); without `text`, the pill alone. */
export const lineBadge = definePiece<LineBadgeParams>(
  "lineBadge",
  { x: pos(), y: pos(), text: label(false), fill: dataColour(), width: size(), height: size(), flat: { kind: "boolean" }, ...inkSchema },
  (params) => {
    const { x, y, text, fill, height = M.badgeHeight, flat = false } = params;
    const width = badgeWidth(params);
    const face = paint(fill);
    const { outline } = inkOf(params);
    const inset = flat ? outline / 2 : 0;
    const shape = pill(x - width / 2 + inset, y - height / 2 + inset, width - 2 * inset, height - 2 * inset);
    const body = flat ? [shape(0, 0, { fill: face, stroke: ink, "stroke-width": r2(outline), "stroke-linejoin": "round" })] : sticker(shape, face, params);
    return drawn(body, text === undefined ? [] : [words(x, y + 4.5, text, { fill: white, "font-size": M.badgeTextSize, "font-weight": bold, "text-anchor": "middle" })]);
  },
  (params) => {
    const height = params.height ?? M.badgeHeight;
    return limits(atLeast("width", badgeWidth(params), height, "the height"), roomFor("height", height, params));
  },
);

/** Closed capsule round the segment a-b (stackledger's capsulePath). */
const capsule = (a: Point, b: Point, r: number, dx: number, dy: number): string => {
  // The normal comes from the segment itself; the shadow's offset moves the result, so a very short
  // segment never collapses to zero length once moved.
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n: Point = [(-(b[1] - a[1]) / length) * r, ((b[0] - a[0]) / length) * r];
  const p = (q: Point, k: number) => `${r2(q[0] + dx + n[0] * k)},${r2(q[1] + dy + n[1] * k)}`;
  const radius = r2(r);
  return `M${p(a, 1)} L${p(b, 1)} A${radius},${radius} 0 0 0 ${p(b, -1)} L${p(a, -1)} A${radius},${radius} 0 0 0 ${p(a, 1)} Z`;
};

export type StationMarkerParams = Ink & { cx: number; cy: number; to?: Point; r?: number; state?: "normal" | "deprecated" };
const markerRadius = ({ r, to }: StationMarkerParams) => r ?? (to ? M.stopRadius + M.interchangeExtra : M.stopRadius);
/** A stop (disc), or with `to` an interchange (capsule from the centre to `to`); deprecated is muted. */
export const stationMarker = definePiece<StationMarkerParams>(
  "stationMarker",
  { cx: pos(), cy: pos(), to: point(false), r: size(), state: { kind: "enum", values: ["normal", "deprecated"] }, ...inkSchema },
  (params) => {
    const { cx, cy, to, state = "normal" } = params;
    const r = markerRadius(params);
    const face = state === "deprecated" ? inkOf(params).s.muted : white;
    const long = to !== undefined && Math.hypot(to[0] - cx, to[1] - cy) > 0;
    const shape: Shape = long
      ? (dx, dy, attrs) => el("path", { d: capsule([cx, cy], to, r, dx, dy), ...attrs })
      : (dx, dy, attrs) => el("circle", { cx: r2(cx + dx), cy: r2(cy + dy), r: r2(r), ...attrs });
    return drawn(sticker(shape, face, params));
  },
  (params) => limits(roomFor("r", 2 * markerRadius(params), params)),
);

export type PipeParams = { d: string; fill: string; width?: number; casing?: number };
const PIPE_PATH = { kind: "string", required: true, nonEmpty: true, pattern: new RegExp(`^\\s*[Mm]${PATH_DATA.source.slice(1, -2)}*$`), patternName: "SVG path data starting with M (commands, numbers, commas and spaces only)" } as const;
/** A line: its colour over an ink casing, round caps and joins, no shadow. */
export const pipe = definePiece<PipeParams>(
  "pipe",
  { d: PIPE_PATH, fill: dataColour(), width: { kind: "number", min: 0, exclusiveMin: true, max: 100 }, casing: { kind: "number", min: 0, max: 50 } },
  ({ d, fill, width = M.lineWidth, casing = M.casing }) => {
    const line = { d, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" } as const;
    return drawn([
      // Stroke widths as given: a valid hairline must not round to zero.
      ...(casing > 0 ? [el("path", { ...line, stroke: ink, "stroke-width": width + casing })] : []),
      el("path", { ...line, stroke: paint(fill), "stroke-width": width }),
    ]);
  },
);

export type CountBadgeParams = Ink & { cx: number; cy: number; text: string; width?: number; height?: number; textSize?: number };
// `textSize` scales the default height, the per-character width and the baseline with it (card 190);
// without it, k is 1 and every expression is the 0.5.0 one.
const countScale = ({ textSize }: CountBadgeParams) => (textSize ?? M.countTextSize) / M.countTextSize;
const countHeight = (params: CountBadgeParams) => params.height ?? (params.textSize === undefined ? M.countHeight : r2(M.countHeight * countScale(params)));
const countWidth = (params: CountBadgeParams) => {
  const { width, text } = params;
  const height = countHeight(params);
  const k = countScale(params);
  const characters = Array.from(text).length;
  return width ?? (characters === 1 ? height : Math.max(height, k === 1 ? 6.4 * characters + 8 : r2(k * (6.4 * characters + 8))));
};
/** A count (rules of a skill): a circle when as wide as high, a pill otherwise, in the surface's panel colour. */
export const countBadge = definePiece<CountBadgeParams>(
  "countBadge",
  { cx: pos(), cy: pos(), text: label(), width: size(), height: size(), textSize: { kind: "number", min: 6, max: 48 }, ...inkSchema },
  (params) => {
    const { cx, cy, text, textSize = M.countTextSize } = params;
    const height = countHeight(params);
    const width = countWidth(params);
    const { s } = inkOf(params);
    const shape: Shape =
      width === height ? (dx, dy, attrs) => el("circle", { cx: r2(cx + dx), cy: r2(cy + dy), r: r2(height / 2), ...attrs }) : pill(cx - width / 2, cy - height / 2, width, height);
    return drawn(sticker(shape, s.panel, params), [words(cx, cy + 4 * countScale(params), text, { fill: s.text, "font-size": textSize, "font-weight": bold, "text-anchor": "middle" })]);
  },
  (params) => {
    const height = countHeight(params);
    // A height derived from textSize is reported at textSize, the parameter the caller passed (card 190).
    const name = params.height === undefined && params.textSize !== undefined ? "textSize" : "height";
    return limits(atLeast("width", countWidth(params), height, "the height"), roomFor(name, height, params));
  },
);

// ---------- diagram nodes ----------

type NodeKind = "box" | "pill" | "hex";
export type NodeParams = Ink & { x: number; y: number; width: number; height?: number; title: string; subtitle?: string; state?: "normal" | "focus" | "placeholder" };
export type NodeBlockParams = NodeParams & { radius?: number };
const nodeSchema: Schema = {
  x: pos(),
  y: pos(),
  width: size(true),
  height: size(),
  title: label(),
  subtitle: label(false),
  state: { kind: "enum", values: ["normal", "focus", "placeholder"] },
  ...inkSchema,
};

const nodeLimits = (kind: NodeKind) => (params: NodeBlockParams): Problem[] => {
  const { width, height = M.nodeHeight, subtitle, state = "normal" } = params;
  const radius = params.radius ?? M.nodeRadius;
  return limits(
    atLeast("width", width, 2 * height, "twice the height"),
    kind === "box" && radius > height / 2 && { path: "radius", message: `must be at most half the height (${r2(height / 2)}), found ${r2(radius)}` },
    state !== "placeholder" && roomFor("height", height, params),
  );
};

const drawNode = (kind: NodeKind, params: NodeBlockParams) => {
  const { x, y, width, height = M.nodeHeight, title, subtitle, state = "normal" } = params;
  const inset = kind === "box" ? 12 : height / 2;
  const radius = kind === "pill" ? height / 2 : (params.radius ?? M.nodeRadius);
  const shape: Shape =
    kind === "hex"
      ? (dx, dy, attrs) => {
          const [l, t, c] = [x + dx, y + dy, height / 2];
          const points: Point[] = [[l + c, t], [l + width - c, t], [l + width, t + c], [l + width - c, t + height], [l + c, t + height], [l, t + c]];
          return el("polygon", { points: points.map(([px, py]) => `${r2(px)},${r2(py)}`).join(" "), ...attrs });
        }
      : (dx, dy, attrs) => el("rect", { x: r2(x + dx), y: r2(y + dy), width: r2(width), height: r2(height), rx: r2(radius), ...attrs });
  const { s } = inkOf(params);
  const middle = y + height / 2;
  if (state === "placeholder") {
    const dashed = [shape(0, 0, { fill: "none", stroke: s.muted, "stroke-width": 1.5, "stroke-dasharray": "5 4", "stroke-linejoin": "round" })];
    // With a subtitle, a normal node's text layout, every word muted (stackledger's unlinked box; card 167).
    return drawn(
      dashed,
      subtitle === undefined
        ? [words(x + width / 2, middle + 4.5, title, { fill: s.muted, "font-size": M.labelSize, "font-weight": 400, "text-anchor": "middle" })]
        : [
            words(x + inset, middle - 3, title, { fill: s.muted, "font-size": M.labelSize, "font-weight": bold, "text-anchor": "start" }),
            words(x + inset, middle + 14, subtitle, { fill: s.muted, "font-size": 11, "font-weight": 400, "text-anchor": "start" }),
          ],
    );
  }
  const focus = state === "focus";
  const titleFill = focus ? ink : s.text;
  const text = subtitle === undefined
    ? [words(x + inset, middle + 4.5, title, { fill: titleFill, "font-size": M.labelSize, "font-weight": bold, "text-anchor": "start" })]
    : [
        words(x + inset, middle - 3, title, { fill: titleFill, "font-size": M.labelSize, "font-weight": bold, "text-anchor": "start" }),
        words(x + inset, middle + 14, subtitle, { fill: focus ? ink : s.muted, "font-size": 11, "font-weight": 400, "text-anchor": "start" }),
      ];
  return drawn(sticker(shape, focus ? tokens.color.caller : s.panel, params), text);
};

/** A diagram box (a skill, a software item): rounded rect with a title and an optional subtitle. */
export const nodeBlock = definePiece<NodeBlockParams>("nodeBlock", { ...nodeSchema, radius: { kind: "number", min: 0, max: MAX_SIZE } }, (p) => drawNode("box", p), nodeLimits("box"));
/** A diagram pill (a playbook). */
export const pillNode = definePiece<NodeParams>("pillNode", nodeSchema, (p) => drawNode("pill", p), nodeLimits("pill"));
/** A diagram hexagon (an agent). */
export const hexNode = definePiece<NodeParams>("hexNode", nodeSchema, (p) => drawNode("hex", p), nodeLimits("hex"));

// ---------- arrow ----------

export type ArrowKind = "message" | "reply" | "failure" | "failFast";
export type ArrowHeads = "end" | "start" | "both";
export type MessageArrowParams = {
  from: Point;
  to: Point;
  curve?: "bezier" | "straight";
  controls?: [Point, Point];
  head?: boolean;
  heads?: ArrowHeads;
  dashed?: boolean;
  label?: string;
  width?: number;
  kind?: ArrowKind;
  surface?: SurfaceName;
};
/** An edge with a head at `to`: curved (leaves and enters horizontally), straight, or through the caller's two
 * control points, with an optional label. `kind` paints a reply, a failure or a fail-fast path (card 141). */
export const messageArrow = definePiece<MessageArrowParams>(
  "messageArrow",
  {
    from: point(),
    to: point(),
    curve: { kind: "enum", values: ["bezier", "straight"] },
    controls: { kind: "array", minItems: 2, maxItems: 2, of: point() },
    head: { kind: "boolean" },
    heads: { kind: "enum", values: ["end", "start", "both"] },
    dashed: { kind: "boolean" },
    label: label(false),
    width: { kind: "number", min: 1, max: 12 },
    kind: { kind: "enum", values: ["message", "reply", "failure", "failFast"] },
    surface: surfaceParam,
  },
  ({ from, to, curve = "bezier", controls, head = true, heads = "end", dashed, label: text, width = M.edgeWidth, kind = "message", surface = "light" }) => {
    const s = tokens.surface[surface];
    const paint_ = kind === "failure" ? tokens.color.failure : kind === "failFast" ? tokens.color.failFast : s.text;
    const length = 5 * width;
    const distance = Math.hypot(to[0] - from[0], to[1] - from[1]);
    const dx = to[0] - from[0];
    // A curve whose ends are almost above each other has no horizontal entry: draw it straight.
    const bent = controls === undefined && curve === "bezier" && Math.abs(dx) > 2 * length;
    // With controls, the head points from the last of c2, c1, from that differs from `to` (design §5).
    const towards = (q: Point): Point => {
      const l = Math.hypot(to[0] - q[0], to[1] - q[1]);
      return [(to[0] - q[0]) / l, (to[1] - q[1]) / l];
    };
    const tail = controls && [controls[1], controls[0], from].find((q) => q[0] !== to[0] || q[1] !== to[1]);
    const direction: Point = tail !== undefined ? towards(tail) : bent ? [Math.sign(dx), 0] : [dx / distance, (to[1] - from[1]) / distance];
    const atEnd = head && heads !== "start";
    const atStart = head && heads !== "end";
    const end: Point = atEnd ? [to[0] - direction[0] * length, to[1] - direction[1] * length] : to;
    // A head at `from` points back at it, from the first of c1, c2, to that differs from `from` (card 190).
    const away = (q: Point): Point => {
      const l = Math.hypot(from[0] - q[0], from[1] - q[1]);
      return [(from[0] - q[0]) / l, (from[1] - q[1]) / l];
    };
    const lead = controls && [controls[0], controls[1], to].find((q) => q[0] !== from[0] || q[1] !== from[1]);
    const back: Point = lead !== undefined ? away(lead) : bent ? [-Math.sign(dx), 0] : [-direction[0], -direction[1]];
    const start: Point = atStart ? [from[0] - back[0] * length, from[1] - back[1] * length] : from;
    const mx = (from[0] + to[0]) / 2;
    const at = (p: Point) => `${r2(p[0])},${r2(p[1])}`;
    const d = controls
      ? `M${at(start)} C${at(controls[0])} ${at(controls[1])} ${at(end)}`
      : bent
        ? `M${at(start)} C${r2(mx)},${r2(from[1])} ${r2(mx)},${r2(to[1])} ${at(end)}`
        : `M${at(start)} L${at(end)}`;
    const dash: Record<string, string> = !(dashed ?? kind !== "message") ? {} : { "stroke-dasharray": `${r2(2.4 * width)} ${r2(3.2 * width)}` };
    const body: SvgNode[] = [el("path", { d, fill: "none", stroke: paint_, "stroke-width": r2(width), "stroke-linecap": "round", ...dash })];
    const arrowhead = (tip: Point, base: Point, along: Point) => {
      const normal: Point = [-along[1] * 2 * width, along[0] * 2 * width];
      const points: Point[] = [tip, [base[0] + normal[0], base[1] + normal[1]], [base[0] - normal[0], base[1] - normal[1]]];
      body.push(el("polygon", { points: points.map(at).join(" "), fill: paint_, stroke: paint_, "stroke-width": 1, "stroke-linejoin": "round" }));
    };
    if (atEnd) arrowhead(to, end, direction);
    if (atStart) arrowhead(from, start, back);
    const words_: SvgNode[] = [];
    if (text !== undefined) {
      const middle: Point = [mx, (from[1] + to[1]) / 2];
      const w = 6.4 * Array.from(text).length + 16;
      body.push(el("rect", { x: r2(middle[0] - w / 2), y: r2(middle[1] - 9), width: r2(w), height: 18, rx: 9, fill: s.background, stroke: s.text, "stroke-width": 1.5 }));
      words_.push(words(middle[0], middle[1] + 4, text, { fill: s.text, "font-size": 11, "font-weight": 400, "text-anchor": "middle" }));
    }
    return drawn(body, words_);
  },
  ({ from, to, head = true, heads, width = M.edgeWidth, controls, curve }) => {
    const distance = Math.hypot(to[0] - from[0], to[1] - from[1]);
    const need = (heads === "both" ? 20 : 10) * width;
    return limits(
      head === false && heads !== undefined && { path: "heads", message: "cannot be combined with head: false" },
      distance === 0 && { path: "to", message: "must differ from from" },
      distance > 0 && head && distance < need && { path: "to", message: `is too close to from for the ${heads === "both" ? "heads" : "head"}: needs at least ${r2(need)}, found ${r2(distance)}` },
      controls !== undefined && curve !== undefined && { path: "controls", message: "cannot be combined with curve" },
    );
  },
);

// ---------- mark ----------

export type LedgerMarkParams = { x: number; y: number; size?: number; line?: string; surface?: SurfaceName };
/** stackledger's mark (favicon, header): an ink square with a bent line and two stations, 32 units scaled to `size`.
 * On a surface with a rim (dark), a light rim of 2 × rimWidth lines the square inside its 32 box (card 167). */
export const ledgerMark = definePiece<LedgerMarkParams>(
  "ledgerMark",
  { x: pos(), y: pos(), size: { kind: "number", min: 12, max: 512 }, line: col(), surface: surfaceParam },
  ({ x, y, size: side = 32, line = "illustration.accent", surface = "light" }) => {
    const { rimWidth, rim } = tokens.surface[surface];
    const band = 2 * rimWidth;
    const square =
      rimWidth > 0
        ? [
            el("rect", { x: 0, y: 0, width: 32, height: 32, rx: 7, fill: rim, stroke: "none" }),
            el("rect", { x: band, y: band, width: 32 - 2 * band, height: 32 - 2 * band, rx: 7 - band, fill: ink, stroke: "none" }),
          ]
        : [el("rect", { x: 0, y: 0, width: 32, height: 32, rx: 7, fill: ink, stroke: "none" })];
    return drawn([
      g(
        { transform: `translate(${r2(x)} ${r2(y)}) scale(${side / 32})` },
        ...square,
        el("path", { d: "M7 23 L14 16 L25 16", fill: "none", stroke: colour(line, "line"), "stroke-width": 4.5, "stroke-linecap": "round", "stroke-linejoin": "round" }),
        el("circle", { cx: 14, cy: 16, r: 4, fill: white, stroke: ink, "stroke-width": 2 }),
        el("circle", { cx: 25, cy: 16, r: 2.6, fill: white, stroke: ink, "stroke-width": 1.6 }),
      ),
    ]);
  },
);

// ---------- map markers and zones (card 167, design §3 of stackledger-map-and-link-pieces) ----------

export type RenewalRingParams = Ink & { cx: number; cy: number; r: number; width?: number };
/** The renewal ring: bands like a bent pipe round a station (rim on dark, ink, then color.blocked), no shadow. */
export const renewalRing = definePiece<RenewalRingParams>(
  "renewalRing",
  { cx: pos(), cy: pos(), r: size(true), width: { kind: "number", min: 0, exclusiveMin: true, max: 50 }, ...inkSchema },
  (params) => {
    const { cx, cy, r, width = M.ringWidth } = params;
    const { s, outline, rim } = inkOf(params);
    // Radius and band widths as given, like pipe's widths: a valid hairline must not round to zero.
    const band = (stroke: string, strokeWidth: number) => el("circle", { cx: r2(cx), cy: r2(cy), r, fill: "none", stroke, "stroke-width": strokeWidth });
    return drawn([...(s.rimWidth > 0 ? [band(s.rim, width + outline + 2 * rim)] : []), band(ink, width + outline), band(tokens.color.blocked, width)]);
  },
  (params) => {
    const { outline, rim } = inkOf(params);
    const need = ((params.width ?? M.ringWidth) + outline + 2 * rim) / 2;
    return limits(params.r < need && { path: "r", message: `leaves no room for the ring's bands: needs at least ${r2(need)}` });
  },
);

export type SuggestedHaloParams = { cx: number; cy: number; r: number; surface?: SurfaceName };
/** The suggested-position halo: a dashed muted circle, no ink. */
export const suggestedHalo = definePiece<SuggestedHaloParams>(
  "suggestedHalo",
  { cx: pos(), cy: pos(), r: size(true), surface: surfaceParam },
  ({ cx, cy, r, surface = "light" }) =>
    drawn([el("circle", { cx: r2(cx), cy: r2(cy), r, fill: "none", stroke: tokens.surface[surface].muted, "stroke-width": M.haloWidth, "stroke-dasharray": "4 3" })]),
);

export type LicenceMarkParams = Ink & { cx: number; cy: number; state?: "owned" | "toBuy"; size?: number };
/** A licence: a small disc sticker, green when held, white to buy. Its own room rule: size ≥ 3 × outline. */
export const licenceMark = definePiece<LicenceMarkParams>(
  "licenceMark",
  { cx: pos(), cy: pos(), state: { kind: "enum", values: ["owned", "toBuy"] }, size: size(), ...inkSchema },
  (params) => {
    const { cx, cy, state = "owned", size: side = M.licenceSize } = params;
    const shape: Shape = (dx, dy, attrs) => el("circle", { cx: r2(cx + dx), cy: r2(cy + dy), r: r2(side / 2), ...attrs });
    return drawn(sticker(shape, state === "owned" ? tokens.color.healthy : white, params));
  },
  (params) => {
    const need = 3 * inkOf(params).outline;
    const side = params.size ?? M.licenceSize;
    return limits(side < need && { path: "size", message: `leaves no room for the licence's face: needs at least ${r2(need)} at this ink scale` });
  },
);

export type ZoneParams = { points: Point[]; fill: string; title?: string; titleAt?: Point; surface?: SurfaceName };
/** Mixes a #RRGGBB colour with white by `amount` (stackledger's zone title tint). */
const tint = (hex: string, amount: number): string =>
  "#" + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - amount) + 255 * amount).toString(16).padStart(2, "0").toUpperCase()).join("");
/** A zone: the outline the caller gives (stackledger's hull), widened by a round stroke, at the surface's zone opacity; an optional title. */
export const zone = definePiece<ZoneParams>(
  "zone",
  { points: { kind: "array", required: true, minItems: 1, maxItems: 10000, of: point() }, fill: dataColour(), title: label(false), titleAt: point(false), surface: surfaceParam },
  ({ points, fill, title, titleAt, surface = "light" }) => {
    const colourOf = paint(fill);
    const pad = M.zonePadding;
    const at = (p: Point) => `${r2(p[0])},${r2(p[1])}`;
    const shape =
      points.length === 1
        ? el("circle", { cx: r2(points[0][0]), cy: r2(points[0][1]), r: pad, fill: colourOf })
        : points.length === 2
          ? el("line", { x1: r2(points[0][0]), y1: r2(points[0][1]), x2: r2(points[1][0]), y2: r2(points[1][1]), stroke: colourOf, "stroke-width": 2 * pad, "stroke-linecap": "round" })
          : el("polygon", { points: points.map(at).join(" "), fill: colourOf, stroke: colourOf, "stroke-width": 2 * pad, "stroke-linejoin": "round" });
    const titleFill = surface === "dark" ? tint(colourOf, M.zoneTitleTint) : colourOf;
    const text = title !== undefined && titleAt !== undefined
      ? [words(titleAt[0], titleAt[1] + 13, title, { fill: titleFill, "font-size": M.labelSize, "font-weight": bold, "text-anchor": "start" })]
      : [];
    return drawn([g({ opacity: tokens.surface[surface].zoneOpacity, stroke: "none" }, shape)], text);
  },
  ({ title, titleAt }) =>
    limits(
      title !== undefined && titleAt === undefined && { path: "titleAt", message: "is required with a title" },
      titleAt !== undefined && title === undefined && { path: "title", message: "is required with titleAt" },
    ),
);

export const METRO_PIECES = { lineBadge, stationMarker, pipe, countBadge, nodeBlock, pillNode, hexNode, messageArrow, ledgerMark, renewalRing, suggestedHalo, licenceMark, zone } as const;

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
import { drawn, el, g, r2, type Attrs, type SvgNode } from "./node.ts";
import { col, colour, label, MAX_SIZE, PATH_DATA, paint, pos, size, type ParamSpec, type Problem, type Schema } from "./params.ts";
import { definePiece } from "./piece.ts";

type Point = [number, number];
export const SURFACES = ["light", "dark"] as const;
export type SurfaceName = (typeof SURFACES)[number];
export type Ink = { surface?: SurfaceName; inkScale?: number };

const ink = tokens.color.ink;
const white = tokens.color.white;
const font = tokens.font.sans;
const bold = tokens.font.weightBold;
const M = tokens.map;

const surfaceParam: ParamSpec = { kind: "enum", values: SURFACES };
const inkScaleParam: ParamSpec = { kind: "number", min: 0.25, max: 8 };
const dataColour = (required = true): ParamSpec => ({ kind: "dataColor", required });
const point = (required = true): ParamSpec => ({ kind: "point", required });
const inkSchema: Schema = { surface: surfaceParam, inkScale: inkScaleParam };

/** Collects the limits between parameters (piece.ts, `relations`). */
const limits = (...checks: (Problem | false)[]): Problem[] => checks.filter((check): check is Problem => check !== false);

/** The surface's colours and the ink measures at a scale. */
const inkOf = ({ surface = "light", inkScale = 1 }: Ink) => {
  const s = tokens.surface[surface];
  return { s, outline: M.outline * inkScale, rim: s.rimWidth * inkScale, offset: M.shadow * inkScale };
};

/** Outlined shapes need room for their ink: smallest dimension ≥ 4 × outline. */
const roomFor = (name: string, smallest: number, inkParams: Ink): Problem | false => {
  const need = 4 * inkOf(inkParams).outline;
  return smallest < need && { path: name, message: `leaves no room for the outline: needs at least ${r2(need)} at this ink scale` };
};
const atLeast = (name: string, value: number, least: number, what: string): Problem | false =>
  value < least && { path: name, message: `must be at least ${what} (${r2(least)}), found ${r2(value)}` };

type Shape = (dx: number, dy: number, attrs: Attrs) => SvgNode;

/** The ink sticker (design §3): shadow copy, rim on dark, then the face. */
const sticker = (shape: Shape, face: string, inkParams: Ink): SvgNode[] => {
  const { s, outline, rim, offset } = inkOf(inkParams);
  const wide = r2(outline + 2 * rim);
  return [
    shape(offset, offset, { fill: s.shadow, stroke: s.shadow, "stroke-width": wide }),
    ...(s.rimWidth > 0 ? [shape(0, 0, { fill: s.rim, stroke: s.rim, "stroke-width": wide })] : []),
    shape(0, 0, { fill: face, stroke: ink, "stroke-width": r2(outline) }),
  ];
};

// Every text sets its own anchor, size and weight, so a surrounding group (a cover's label style) does not leak in.
const words = (x: number, y: number, value: string, attrs: Attrs): SvgNode => el("text", { x: r2(x), y: r2(y), "font-family": font, ...attrs }, value);
const pill = (x: number, y: number, w: number, h: number): Shape => (dx, dy, attrs) =>
  el("rect", { x: r2(x + dx), y: r2(y + dy), width: r2(w), height: r2(h), rx: r2(h / 2), ...attrs });

// ---------- metro ----------

export type LineBadgeParams = Ink & { x: number; y: number; text: string; fill: string; width?: number; height?: number; flat?: boolean };
const badgeWidth = ({ width, text }: LineBadgeParams) => width ?? Math.max(30, 7.6 * Array.from(text).length + 18);
/** A line's terminal badge: a pill in the line colour with its code in white, centred on (x, y). */
export const lineBadge = definePiece<LineBadgeParams>(
  "lineBadge",
  { x: pos(), y: pos(), text: label(), fill: dataColour(), width: size(), height: size(), flat: { kind: "boolean" }, ...inkSchema },
  (params) => {
    const { x, y, text, fill, height = M.badgeHeight, flat = false } = params;
    const width = badgeWidth(params);
    const face = paint(fill);
    const { outline } = inkOf(params);
    const inset = flat ? outline / 2 : 0;
    const shape = pill(x - width / 2 + inset, y - height / 2 + inset, width - 2 * inset, height - 2 * inset);
    const body = flat ? [shape(0, 0, { fill: face, stroke: ink, "stroke-width": r2(outline) })] : sticker(shape, face, params);
    return drawn(body, [words(x, y + 4.5, text, { fill: white, "font-size": M.badgeTextSize, "font-weight": bold, "text-anchor": "middle" })]);
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

export type CountBadgeParams = Ink & { cx: number; cy: number; text: string; width?: number; height?: number };
const countWidth = ({ width, text, height = M.countHeight }: CountBadgeParams) => {
  const characters = Array.from(text).length;
  return width ?? (characters === 1 ? height : Math.max(height, 6.4 * characters + 8));
};
/** A count (rules of a skill): a circle when as wide as high, a pill otherwise, in the surface's panel colour. */
export const countBadge = definePiece<CountBadgeParams>(
  "countBadge",
  { cx: pos(), cy: pos(), text: label(), width: size(), height: size(), ...inkSchema },
  (params) => {
    const { cx, cy, text, height = M.countHeight } = params;
    const width = countWidth(params);
    const { s } = inkOf(params);
    const shape: Shape =
      width === height ? (dx, dy, attrs) => el("circle", { cx: r2(cx + dx), cy: r2(cy + dy), r: r2(height / 2), ...attrs }) : pill(cx - width / 2, cy - height / 2, width, height);
    return drawn(sticker(shape, s.panel, params), [words(cx, cy + 4, text, { fill: s.text, "font-size": M.countTextSize, "font-weight": bold, "text-anchor": "middle" })]);
  },
  (params) => {
    const height = params.height ?? M.countHeight;
    return limits(atLeast("width", countWidth(params), height, "the height"), roomFor("height", height, params));
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
    state === "placeholder" && subtitle !== undefined && { path: "subtitle", message: "a placeholder has no subtitle" },
    state !== "placeholder" && roomFor("height", height, params),
  );
};

const drawNode = (kind: NodeKind, params: NodeBlockParams) => {
  const { x, y, width, height = M.nodeHeight, title, subtitle, state = "normal" } = params;
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
    return drawn(
      [shape(0, 0, { fill: "none", stroke: s.muted, "stroke-width": 1.5, "stroke-dasharray": "5 4" })],
      [words(x + width / 2, middle + 4.5, title, { fill: s.muted, "font-size": M.labelSize, "font-weight": 400, "text-anchor": "middle" })],
    );
  }
  const focus = state === "focus";
  const inset = kind === "box" ? 12 : height / 2;
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

export type MessageArrowParams = { from: Point; to: Point; curve?: "bezier" | "straight"; head?: boolean; label?: string; width?: number; surface?: SurfaceName };
/** An edge with a head at `to`: curved (leaves and enters horizontally) or straight, with an optional label. */
export const messageArrow = definePiece<MessageArrowParams>(
  "messageArrow",
  {
    from: point(),
    to: point(),
    curve: { kind: "enum", values: ["bezier", "straight"] },
    head: { kind: "boolean" },
    label: label(false),
    width: { kind: "number", min: 1, max: 12 },
    surface: surfaceParam,
  },
  ({ from, to, curve = "bezier", head = true, label: text, width = M.edgeWidth, surface = "light" }) => {
    const s = tokens.surface[surface];
    const length = 5 * width;
    const distance = Math.hypot(to[0] - from[0], to[1] - from[1]);
    const dx = to[0] - from[0];
    // A curve whose ends are almost above each other has no horizontal entry: draw it straight.
    const bent = curve === "bezier" && Math.abs(dx) > 2 * length;
    const direction: Point = bent ? [Math.sign(dx), 0] : [dx / distance, (to[1] - from[1]) / distance];
    const end: Point = head ? [to[0] - direction[0] * length, to[1] - direction[1] * length] : to;
    const mx = (from[0] + to[0]) / 2;
    const at = (p: Point) => `${r2(p[0])},${r2(p[1])}`;
    const d = bent ? `M${at(from)} C${r2(mx)},${r2(from[1])} ${r2(mx)},${r2(to[1])} ${at(end)}` : `M${at(from)} L${at(end)}`;
    const body: SvgNode[] = [el("path", { d, fill: "none", stroke: s.text, "stroke-width": r2(width), "stroke-linecap": "round" })];
    if (head) {
      const normal: Point = [-direction[1] * 2 * width, direction[0] * 2 * width];
      const points: Point[] = [to, [end[0] + normal[0], end[1] + normal[1]], [end[0] - normal[0], end[1] - normal[1]]];
      body.push(el("polygon", { points: points.map(at).join(" "), fill: s.text, stroke: s.text, "stroke-width": 1, "stroke-linejoin": "round" }));
    }
    const words_: SvgNode[] = [];
    if (text !== undefined) {
      const middle: Point = [mx, (from[1] + to[1]) / 2];
      const w = 6.4 * Array.from(text).length + 16;
      body.push(el("rect", { x: r2(middle[0] - w / 2), y: r2(middle[1] - 9), width: r2(w), height: 18, rx: 9, fill: s.background, stroke: s.text, "stroke-width": 1.5 }));
      words_.push(words(middle[0], middle[1] + 4, text, { fill: s.text, "font-size": 11, "font-weight": 400, "text-anchor": "middle" }));
    }
    return drawn(body, words_);
  },
  ({ from, to, head = true, width = M.edgeWidth }) => {
    const distance = Math.hypot(to[0] - from[0], to[1] - from[1]);
    return limits(
      distance === 0 && { path: "to", message: "must differ from from" },
      distance > 0 && head && distance < 10 * width && { path: "to", message: `is too close to from for the head: needs at least ${r2(10 * width)}, found ${r2(distance)}` },
    );
  },
);

// ---------- mark ----------

export type LedgerMarkParams = { x: number; y: number; size?: number; line?: string };
/** stackledger's mark (favicon, header): an ink square with a bent line and two stations, 32 units scaled to `size`. */
export const ledgerMark = definePiece<LedgerMarkParams>(
  "ledgerMark",
  { x: pos(), y: pos(), size: { kind: "number", min: 12, max: 512 }, line: col() },
  ({ x, y, size: side = 32, line = "illustration.accent" }) =>
    drawn([
      g(
        { transform: `translate(${r2(x)} ${r2(y)}) scale(${side / 32})` },
        el("rect", { x: 0, y: 0, width: 32, height: 32, rx: 7, fill: ink, stroke: "none" }),
        el("path", { d: "M7 23 L14 16 L25 16", fill: "none", stroke: colour(line, "line"), "stroke-width": 4.5, "stroke-linecap": "round", "stroke-linejoin": "round" }),
        el("circle", { cx: 14, cy: 16, r: 4, fill: white, stroke: ink, "stroke-width": 2 }),
        el("circle", { cx: 25, cy: 16, r: 2.6, fill: white, stroke: ink, "stroke-width": 1.6 }),
      ),
    ]),
);

export const METRO_PIECES = { lineBadge, stationMarker, pipe, countBadge, nodeBlock, pillNode, hexNode, messageArrow, ledgerMark } as const;

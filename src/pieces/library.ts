// The illustration pieces (spec illustration-pieces, "Piece catalogue";
// design §4). Each one is a pure function of its parameters and the tokens.
// Positions and sizes are cover pixels; colours are token paths, resolved here.
//
// Geometry: ported from the approved prototype
// (~/.hermes/spikes/design-system/illustration-pieces/pieces.ts), or, for the
// pieces it lacked, measured from the published covers named in design §4.
// Words: a piece draws only the words its caller passes (ADR 0004).
import { tokens } from "../../tokens/generated/tokens.ts";
import { EIP_ICONS, EIP_ICON_NAMES } from "./eip-icons.ts";
import { drawn, el, g, r2, shadowed, type SvgNode } from "./node.ts";
import { col, colour, count, label, MAX_SIZE, PATH_DATA, pos, size, type Schema } from "./params.ts";
import { definePiece } from "./piece.ts";
import { METRO_PIECES } from "./metro.ts";

export * from "./metro.ts";

const ink = tokens.color.ink;
const mono = tokens.font.mono;
type Point = [number, number];

// ---------- labels ----------

export type PillParams = { x: number; y: number; text: string; fill?: string; width?: number };
/** Pill label centred on (x, y), usually overlapping the top edge of what it names. */
export const pill = definePiece<PillParams>(
  "pill",
  { x: pos(), y: pos(), text: label(), fill: col(), width: size() },
  ({ x, y, text, fill = "color.white", width }) => {
    const h = tokens.cover.pillHeight;
    const w = width ?? Math.max(68, Math.round(text.length * 10.5 + 34));
    return drawn(
      [el("rect", { x: x - w / 2, y: y - h / 2, width: w, height: h, rx: h / 2, fill: colour(fill, "fill") })],
      [el("text", { x, y: y + 7 }, text)],
    );
  },
);

// ---------- background ----------

export const RING_COUNT = 14;
export type RingsParams = { cx: number; cy: number; radius?: number; color?: string };
/** Concentric rings around (cx, cy): 14 rings, step and width from the cover tokens. */
export const rings = definePiece<RingsParams>(
  "rings",
  { cx: pos(), cy: pos(), radius: size(), color: col() },
  ({ cx, cy, radius = tokens.cover.ringRadius, color = "color.ring" }) =>
    drawn([
      g(
        { fill: "none", stroke: colour(color, "color"), "stroke-width": tokens.cover.ringWidth },
        ...Array.from({ length: RING_COUNT }, (_, i) => el("circle", { cx, cy, r: radius + i * tokens.cover.ringStep })),
      ),
    ]),
);

// ---------- paper ----------

export type SheetRow = { lead?: "none" | "checkbox" | "checked" | "question"; bar: number; tail?: "none" | "check" };
export type SheetParams = {
  x: number;
  y: number;
  width: number;
  height: number;
  rows: SheetRow[];
  top?: number;
  step?: number;
  fill?: string;
  leadFill?: string;
  tick?: string;
};
const rowSchema: Schema = {
  lead: { kind: "enum", values: ["none", "checkbox", "checked", "question"] },
  bar: size(true),
  tail: { kind: "enum", values: ["none", "check"] },
};
/** A sheet of paper with rows of text bars, an optional lead mark and an optional tick at the end. */
export const sheet = definePiece<SheetParams>(
  "sheet",
  {
    x: pos(),
    y: pos(),
    width: size(true, 80),
    height: size(true),
    rows: { kind: "array", required: true, of: { kind: "object", fields: rowSchema } },
    top: size(),
    step: size(),
    fill: col(),
    leadFill: col(),
    tick: col(),
  },
  ({ x, y, width, height, rows, top = 46, step = 38, fill = "color.white", leadFill = "color.caller", tick = "illustration.accent" }) => {
    const marks: SvgNode[] = [];
    const bars: SvgNode[] = [];
    const ticks: SvgNode[] = [];
    const glyphs: SvgNode[] = [];
    rows.forEach((row, i) => {
      const cy = y + top + i * step + 11;
      let barX = x + 22;
      if (row.lead === "checkbox" || row.lead === "checked") {
        const checked = row.lead === "checked";
        marks.push(el("rect", { x: x + 22, y: cy - 11, width: 22, height: 22, rx: 5, fill: checked ? colour(leadFill, "leadFill") : tokens.color.white }));
        if (checked) ticks.push(el("path", { d: `M${x + 27},${cy} L${x + 32},${cy + 6} L${x + 40},${cy - 6}`, stroke: colour(tick, "tick") }));
        barX = x + 56;
      } else if (row.lead === "question") {
        marks.push(el("circle", { cx: x + 30, cy, r: 13, fill: tokens.color.transitional }));
        glyphs.push(el("text", { x: x + 30, y: cy + 7, "font-size": 19, "font-weight": tokens.font.weightHeavy }, "?"));
        barX = x + 52;
      }
      bars.push(el("rect", { x: barX, y: cy - 5, width: row.bar, height: 10, rx: 5 }));
      if (row.tail === "check") {
        const tx = x + width - 40;
        marks.push(el("rect", { x: tx, y: cy - 11, width: 22, height: 22, rx: 5, fill: tokens.color.healthy }));
        ticks.push(el("path", { d: `M${tx + 5},${cy} L${tx + 10},${cy + 6} L${tx + 18},${cy - 6}`, stroke: ink }));
      }
    });
    return drawn(
      [
        ...shadowed(el("rect", { x, y, width, height, rx: 14, fill: colour(fill, "fill") })),
        g({ "stroke-width": tokens.outline.small }, ...marks),
        g({ fill: "none", "stroke-width": 3.5, "stroke-linecap": "round" }, ...ticks),
        g({ stroke: "none", fill: tokens.illustration.textBar }, ...bars),
      ],
      glyphs,
    );
  },
);

const CODE_COLOURS = { healthy: tokens.color.healthy, caller: tokens.color.caller, white: tokens.color.white, backend: tokens.color.backend } as const;
export type CodeLine = { indent: number; w: number; color: keyof typeof CODE_COLOURS; tall?: boolean };
export type CodePanelParams = { x: number; y: number; width: number; height: number; lines: CodeLine[]; top?: number; step?: number };
/** Dark code panel with coloured lines; a tall line marks the one under review. */
export const codePanel = definePiece<CodePanelParams>(
  "codePanel",
  {
    x: pos(),
    y: pos(),
    width: size(true),
    height: size(true),
    lines: {
      kind: "array",
      required: true,
      of: {
        kind: "object",
        fields: { indent: { kind: "number", required: true, min: 0, max: MAX_SIZE }, w: size(true), color: { kind: "enum", required: true, values: Object.keys(CODE_COLOURS) }, tall: { kind: "boolean" } },
      },
    },
    top: size(),
    step: size(),
  },
  ({ x, y, width, height, lines, top = 38, step = 22 }) =>
    drawn([
      ...shadowed(el("rect", { x, y, width, height, rx: 14, fill: tokens.illustration.codePanel })),
      g(
        { stroke: "none" },
        ...lines.map((line, i) =>
          el("rect", {
            x: x + 20 + line.indent,
            y: y + top + i * step - (line.tall ? 3 : 0),
            width: line.w,
            height: line.tall ? 16 : 10,
            rx: line.tall ? 8 : 5,
            fill: CODE_COLOURS[line.color],
          }),
        ),
      ),
    ]),
);

export type SpeechBubbleParams = { x: number; y: number; width: number; height: number; fill?: string };
/** Chat slip with a tail at the bottom left and one white text line. */
export const speechBubble = definePiece<SpeechBubbleParams>(
  "speechBubble",
  { x: pos(), y: pos(), width: size(true, 60), height: size(true, 50), fill: col() },
  ({ x, y, width: w, height: h, fill = "color.caller" }) => {
    const r = 12;
    const b = y + h;
    const d = `M${x},${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${b - r} Q${x + w},${b} ${x + w - r},${b} H${x + 44} L${x + 20},${b + 20} L${x + 24},${b} H${x + r} Q${x},${b} ${x},${b - r} Z`;
    return drawn([
      ...shadowed(el("path", { d, fill: colour(fill, "fill") })),
      el("rect", { x: x + 22, y: y + 31, width: w - 44, height: 13, rx: 6.5, fill: tokens.color.white, stroke: "none" }),
    ]);
  },
);

export type BrowserWindowParams = { x: number; y: number; width?: number; height?: number };
/** Browser window: title bar with three dots, a hero block and two text lines. */
export const browserWindow = definePiece<BrowserWindowParams>(
  "browserWindow",
  { x: pos(), y: pos(), width: size(false, 60), height: size(false, 130) },
  ({ x, y, width: w = 200, height: h = 140 }) =>
    drawn([
      ...shadowed(el("rect", { x, y, width: w, height: h, rx: 12, fill: tokens.color.white })),
      el("path", { d: `M${x},${y + 30} H${x + w}`, fill: "none" }),
      ...[tokens.color.backend, tokens.color.transitional, tokens.color.healthy].map((fill, i) =>
        el("circle", { cx: x + 18 + i * 16, cy: y + 15, r: 5, fill, "stroke-width": 2.5 }),
      ),
      el("rect", { x: x + 20, y: y + 46, width: w - 40, height: 40, rx: 8, fill: tokens.color.caller, "stroke-width": tokens.outline.small }),
      el("rect", { x: x + 20, y: y + 100, width: r2(w * 0.6), height: 10, rx: 5, fill: tokens.illustration.textBar, stroke: "none" }),
      el("rect", { x: x + 20, y: y + 118, width: r2(w * 0.4), height: 10, rx: 5, fill: tokens.illustration.textBar, stroke: "none" }),
    ]),
);

export type FolderParams = { x: number; y: number; scale?: number };
/** Open folder with two sheets peeking out, measured from the write-in-obsidian cover (190x198 at scale 1). */
export const folder = definePiece<FolderParams>(
  "folder",
  { x: pos(), y: pos(), scale: size() },
  ({ x, y, scale: s = 1 }) => {
    const p = (dx: number, dy: number) => `${r2(x + dx * s)},${r2(y + dy * s)}`;
    const back = `M${p(0, 30)} L${p(0, 12)} Q${p(0, 0)} ${p(12, 0)} L${p(66, 0)} Q${p(76, 0)} ${p(80, 10)} L${p(86, 30)} L${p(178, 30)} Q${p(190, 30)} ${p(190, 42)} L${p(190, 198)} L${p(0, 198)} Z`;
    const front = `M${p(-6, 64)} Q${p(-6, 52)} ${p(6, 52)} L${p(184, 52)} Q${p(196, 52)} ${p(196, 64)} L${p(190, 198)} L${p(0, 198)} Z`;
    const paper = (dx: number, dy: number, rot: number) =>
      el("rect", { x: r2(x + dx * s), y: r2(y + dy * s), width: r2(96 * s), height: r2(120 * s), rx: 8, fill: tokens.color.white, transform: `rotate(${rot} ${r2(x + (dx + 48) * s)} ${r2(y + (dy + 60) * s)})` });
    return drawn([
      ...shadowed(el("path", { d: back, fill: tokens.illustration.transitionalShade })),
      paper(24, -8, -8),
      paper(66, -16, 6),
      el("path", { d: front, fill: tokens.color.transitional }),
    ]);
  },
);

export type BookParams = { x: number; y: number; width?: number; height?: number };
/** A closed book seen from the front: back page, front cover, spine and page edges. */
export const book = definePiece<BookParams>(
  "book",
  { x: pos(), y: pos(), width: size(false, 30), height: size(false, 30) },
  ({ x, y, width: w = 120, height: h = 200 }) =>
    drawn([
      el("rect", { x: x + 18, y: y + 14, width: w - 2, height: h, rx: 8, fill: ink, stroke: "none" }),
      el("rect", { x: x + 14, y: y + 10, width: w - 2, height: h, rx: 8, fill: tokens.color.white }),
      el("rect", { x, y, width: w, height: h, rx: 8, fill: ink, stroke: "none" }),
      el("rect", { x, y, width: w, height: h, rx: 8, fill: tokens.color.white }),
      el("rect", { x, y, width: 20, height: h, rx: 8, fill: ink }),
      el("path", { d: `M${x + w + 4},${y + 16} V${y + h - 6} M${x + w + 8},${y + 20} V${y + h - 2}`, "stroke-width": 2 }),
    ]),
);

// ---------- arrows and paths ----------

export type BlockArrowParams = { x: number; y: number; length?: number; fill?: string };
/** Chunky arrow pointing right, centred vertically on y. */
export const blockArrow = definePiece<BlockArrowParams>(
  "blockArrow",
  { x: pos(), y: pos(), length: size(), fill: col() },
  ({ x, y, length = 50, fill = "illustration.accent" }) => {
    const shaft = 12;
    const head = 26;
    const headLength = Math.min(30, length * 0.56);
    const hx = r2(x + length - headLength);
    return drawn([
      el("path", { d: `M${x},${y - shaft} H${hx} V${y - head} L${x + length},${y} L${hx},${y + head} V${y + shaft} H${x} Z`, fill: colour(fill, "fill") }),
    ]);
  },
);

export type ArcArrowParams = { from: Point; c1: Point; c2: Point; to: Point; color?: string; dashed?: boolean; width?: number };
/** Curved arrow (cubic Bézier) with a chevron head at `to`; solid or dashed. */
export const arcArrow = definePiece<ArcArrowParams>(
  "arcArrow",
  { from: { kind: "point", required: true }, c1: { kind: "point", required: true }, c2: { kind: "point", required: true }, to: { kind: "point", required: true }, color: col(), dashed: { kind: "boolean" }, width: size() },
  ({ from, c1, c2, to, color = "color.white", dashed = false, width }) => {
    const stroke = colour(color, "color");
    const strokeWidth = width ?? (dashed ? 4 : 6);
    const angle = Math.atan2(to[1] - c2[1], to[0] - c2[0]);
    const arm = 14;
    const spread = (40 * Math.PI) / 180;
    const wing = (sign: number): string => `${r2(to[0] - arm * Math.cos(angle + sign * spread))},${r2(to[1] - arm * Math.sin(angle + sign * spread))}`;
    const line: Record<string, string | number> = { d: `M${from[0]},${from[1]} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${to[0]},${to[1]}`, fill: "none", stroke, "stroke-width": strokeWidth, "stroke-linecap": "round" };
    if (dashed) line["stroke-dasharray"] = "9 8";
    return drawn([
      el("path", line),
      el("path", { d: `M${wing(1)} L${to[0]},${to[1]} L${wing(-1)}`, fill: "none", stroke, "stroke-width": strokeWidth, "stroke-linecap": "round", "stroke-linejoin": "round" }),
    ]);
  },
);

export type RailParams = { x: number; y: number; width: number; nodes: string[]; fill?: string; thickness?: number };
/** A rail (track) with square nodes spread along it. */
export const rail = definePiece<RailParams>(
  "rail",
  { x: pos(), y: pos(), width: size(true, 100), nodes: { kind: "array", required: true, minItems: 1, of: { kind: "color" } }, fill: col(), thickness: size() },
  ({ x, y, width: w, nodes, fill = "illustration.codePanel", thickness: t = 44 }) =>
    drawn([
      ...shadowed(el("rect", { x, y, width: w, height: t, rx: t / 2, fill: colour(fill, "fill") }), 8),
      el("path", { d: `M${x + 30},${y + t / 2} H${x + w - 30}`, fill: "none", stroke: tokens.color.white, "stroke-width": tokens.outline.small }),
      ...nodes.map((node, i) =>
        el("rect", { x: r2(x + 40 + i * ((w - 100) / Math.max(1, nodes.length - 1)) - 10), y: y + t / 2 - 10, width: 20, height: 20, rx: 4, fill: colour(node, `nodes[${i}]`), "stroke-width": tokens.outline.small }),
      ),
    ]),
);

export type RoadParams = { d: string };
/** A road: a wide grey band along a path with white dashes in the middle. */
export const road = definePiece<RoadParams>(
  "road",
  { d: { kind: "string", required: true, nonEmpty: true, pattern: PATH_DATA, patternName: "SVG path data (commands, digits, signs, dots, commas, spaces)" } },
  ({ d }) =>
  drawn([
    el("path", { d, fill: "none", stroke: tokens.illustration.road, "stroke-width": 40, "stroke-linecap": "round" }),
    el("path", { d, fill: "none", stroke: tokens.color.white, "stroke-width": tokens.outline.block, "stroke-dasharray": "14 12" }),
  ]),
);

export type MilestonePinParams = { x: number; y: number; text: string; fill?: string; stem?: number };
/** A pin standing on (x, y): a stem and a round head with a short label. */
export const milestonePin = definePiece<MilestonePinParams>(
  "milestonePin",
  { x: pos(), y: pos(), text: label(), fill: col(), stem: size() },
  ({ x, y, text, fill = "color.healthy", stem = 44 }) =>
    drawn(
      [el("line", { x1: x, y1: y, x2: x, y2: y - stem }), el("circle", { cx: x, cy: y - stem - 14, r: 18, fill: colour(fill, "fill"), "stroke-width": tokens.outline.small })],
      [el("text", { x, y: y - stem - 7, "font-size": 18, "font-weight": tokens.font.weightHeavy }, text)],
    ),
);

// ---------- tags ----------

export type PriceTagParams = { x: number; y: number; text: string; width?: number; fill?: string; stringFrom?: Point };
/** Price or version tag pointing left from its tip (x, y), with a hole and an optional string. */
export const priceTag = definePiece<PriceTagParams>(
  "priceTag",
  { x: pos(), y: pos(), text: label(), width: size(), fill: col(), stringFrom: { kind: "point" } },
  ({ x, y, text, width: w = 128, fill = "color.white", stringFrom }) => {
    const h = 48;
    const top = y - h / 2;
    const bottom = y + h / 2;
    const right = x + w;
    const d = `M${x + 20},${top} L${right - 10},${top} Q${right},${top} ${right},${top + 10} L${right},${bottom - 10} Q${right},${bottom} ${right - 10},${bottom} L${x + 20},${bottom} L${x},${y} Z`;
    const body: SvgNode[] = [];
    if (stringFrom) {
      body.push(el("path", { d: `M${stringFrom[0]},${stringFrom[1]} C${stringFrom[0] - 14},${r2((stringFrom[1] + y) / 2)} ${x + 2},${y + 4} ${x + 20},${y}`, fill: "none", stroke: tokens.color.white, "stroke-width": tokens.outline.block }));
    }
    body.push(...shadowed(el("path", { d, fill: colour(fill, "fill") }), 6), el("circle", { cx: x + 16, cy: y, r: 5, fill: ink, stroke: "none" }));
    return drawn(body, [el("text", { x: r2(x + 20 + (w - 20) / 2 - 2), y: y + 8, "font-family": mono, "font-size": 22 }, text)]);
  },
);

export type NameTagParams = { hangX: number; hangY: number; cx: number; top: number; rotate?: number; icon: string; fill?: string };
/** A name tag hanging on a string from (hangX, hangY), showing one EIP icon. */
export const nameTag = definePiece<NameTagParams>(
  "nameTag",
  { hangX: pos(), hangY: pos(), cx: pos(), top: pos(), rotate: { kind: "number" }, icon: { kind: "enum", required: true, values: EIP_ICON_NAMES }, fill: col() },
  ({ hangX: sx, hangY: sy, cx, top, rotate = 0, icon, fill = "color.transitional" }) => {
    const w = 96;
    const h = 92;
    const x = cx - w / 2;
    const d = `M${x},${top + 14} L${x + 18},${top} H${x + w - 18} L${x + w},${top + 14} V${top + h - 6} Q${x + w},${top + h} ${x + w - 6},${top + h} H${x + 6} Q${x},${top + h} ${x},${top + h - 6} Z`;
    return drawn([
      el("path", { d: `M${sx},${sy} C${sx - 13},${sy + 28} ${sx + 6},${sy + 36} ${cx},${top + 20}`, fill: "none", "stroke-width": tokens.outline.small }),
      g(
        { transform: `rotate(${rotate} ${cx} ${top + 20})` },
        ...shadowed(el("path", { d, fill: colour(fill, "fill") }), 8),
        el("circle", { cx, cy: top + 14, r: 5, fill: tokens.color.white, "stroke-width": tokens.outline.small }),
        ...eipIcon({ name: icon, x: cx - 38, y: top + 27, scale: 1.18 }).body,
      ),
    ]);
  },
);

// ---------- objects ----------

export type CheckBadgeParams = { cx: number; cy: number; r?: number };
/** Green round badge with a tick. */
export const checkBadge = definePiece<CheckBadgeParams>("checkBadge", { cx: pos(), cy: pos(), r: size() }, ({ cx, cy, r = 16 }) =>
  drawn([
    el("circle", { cx, cy, r, fill: tokens.color.healthy, "stroke-width": tokens.outline.small }),
    el("path", { d: `M${r2(cx - r * 0.42)},${cy} L${r2(cx - r * 0.1)},${r2(cy + r * 0.34)} L${r2(cx + r * 0.45)},${r2(cy - r * 0.32)}`, fill: "none", "stroke-width": 3.5, "stroke-linecap": "round" }),
  ]),
);

export type StampParams = { cx: number; cy: number; word: string; fill?: string; r?: number; rotate?: number; shape?: "round" | "rect" };
/** Rubber stamp, round (dashed inner ring) or rectangular, tilted, with one word. */
export const stamp = definePiece<StampParams>(
  "stamp",
  { cx: pos(), cy: pos(), word: label(), fill: col(), r: size(false, 12), rotate: { kind: "number" }, shape: { kind: "enum", values: ["round", "rect"] } },
  ({ cx, cy, word, fill = "color.healthy", r = 40, rotate = -12, shape = "round" }) => {
    const turn = `rotate(${rotate} ${cx} ${cy})`;
    const face =
      shape === "round"
        ? [
            ...shadowed(el("circle", { cx, cy, r, fill: colour(fill, "fill") }), 8),
            el("circle", { cx, cy, r: r - 10, fill: "none", stroke: tokens.color.white, "stroke-width": tokens.outline.small, "stroke-dasharray": "6 5" }),
          ]
        : [
            ...shadowed(el("rect", { x: cx - r * 1.6, y: cy - r * 0.7, width: r * 3.2, height: r * 1.4, rx: 8, fill: colour(fill, "fill") }), 8),
            el("rect", { x: cx - r * 1.6 + 8, y: cy - r * 0.7 + 8, width: r * 3.2 - 16, height: r * 1.4 - 16, rx: 4, fill: "none", stroke: tokens.color.white, "stroke-width": tokens.outline.small }),
          ];
    return drawn([g({ transform: turn }, ...face)], [el("text", { x: cx, y: cy + 10, "font-size": 27, "font-weight": tokens.font.weightHeavy, transform: turn }, word)]);
  },
);

export type RobotParams = { cx: number; top: number };
/** Robot: antenna, ears, green body with a visor and two eyes, mouth bars. Scale it with pose. */
export const robot = definePiece<RobotParams>("robot", { cx: pos(), top: pos() }, ({ cx, top }) => {
  const w = 160;
  const h = 152;
  const x = cx - w / 2;
  return drawn([
    el("line", { x1: cx, y1: top, x2: cx, y2: top - 28 }),
    el("circle", { cx, cy: top - 34, r: 10, fill: tokens.color.blocked }),
    el("rect", { x: x - 16, y: top + 44, width: 20, height: 52, rx: 6, fill: tokens.illustration.healthyShade }),
    el("rect", { x: x + w - 4, y: top + 44, width: 20, height: 52, rx: 6, fill: tokens.illustration.healthyShade }),
    ...shadowed(el("rect", { x, y: top, width: w, height: h, rx: 22, fill: tokens.color.healthy })),
    el("rect", { x: x + 22, y: top + 22, width: w - 44, height: 72, rx: 14, fill: ink }),
    el("circle", { cx: cx - 23, cy: top + 58, r: 11, fill: tokens.color.healthy, stroke: "none" }),
    el("circle", { cx: cx + 23, cy: top + 58, r: 11, fill: tokens.color.healthy, stroke: "none" }),
    g(
      { stroke: "none", fill: ink },
      el("rect", { x: x + 30, y: top + 108, width: 44, height: 9, rx: 4.5 }),
      el("rect", { x: x + 82, y: top + 108, width: 48, height: 9, rx: 4.5 }),
      el("rect", { x: x + 42, y: top + 124, width: 60, height: 9, rx: 4.5 }),
    ),
  ]);
});

export type MagnifierParams = { cx: number; cy: number; r?: number; color?: string };
/** Magnifier: lens centred on (cx, cy), handle to the bottom right. */
export const magnifier = definePiece<MagnifierParams>(
  "magnifier",
  { cx: pos(), cy: pos(), r: size(false, 12), color: col() },
  ({ cx, cy, r = 50, color = "illustration.accent" }) => {
    const c = colour(color, "color");
    const hx = r2(cx + r * 0.88);
    const hy = r2(cy + r * 0.74);
    return drawn([
      el("line", { x1: hx, y1: hy, x2: hx + 38, y2: hy + 42, "stroke-width": 24, "stroke-linecap": "round" }),
      el("line", { x1: hx, y1: hy, x2: hx + 38, y2: hy + 42, stroke: c, "stroke-width": 15, "stroke-linecap": "round" }),
      el("circle", { cx, cy, r, fill: tokens.color.white, "fill-opacity": 0.18, stroke: c, "stroke-width": 12 }),
      el("circle", { cx, cy, r: r + 6, fill: "none" }),
      el("circle", { cx, cy, r: r - 6, fill: "none" }),
    ]);
  },
);

export type ServerStackParams = { x: number; y: number; width?: number; units?: number; fill?: string; failing?: number };
/** Stack of server units; the `failing` unit (0-based) shows a red light. */
export const serverStack = definePiece<ServerStackParams>(
  "serverStack",
  { x: pos(), y: pos(), width: size(), units: count(1, 20), fill: col(), failing: count(0, 19) },
  ({ x, y, width: w = 150, units = 3, fill = "color.backend", failing }) => {
    const uh = 40;
    const gap = 10;
    return drawn(
      Array.from({ length: units }, (_, i) => {
        const uy = y + i * (uh + gap);
        return [
          ...shadowed(el("rect", { x, y: uy, width: w, height: uh, rx: 8, fill: colour(fill, "fill") })),
          el("rect", { x: x + 16, y: uy + 15, width: r2(w * 0.5), height: 10, rx: 5, fill: tokens.color.white, stroke: "none" }),
          el("circle", { cx: x + w - 24, cy: uy + 20, r: 6, fill: i === failing ? tokens.color.failure : tokens.color.white, "stroke-width": tokens.outline.small }),
        ];
      }).flat(),
    );
  },
);

export type CloudParams = { cx: number; cy: number; scale?: number; fill?: string };
export const cloud = definePiece<CloudParams>("cloud", { cx: pos(), cy: pos(), scale: size(), fill: col() }, ({ cx, cy, scale: s = 1, fill = "color.white" }) => {
  const p = (dx: number, dy: number) => `${r2(cx + dx * s)},${r2(cy + dy * s)}`;
  const d = `M${p(-70, 30)} Q${p(-96, 30)} ${p(-94, 4)} Q${p(-90, -20)} ${p(-62, -18)} Q${p(-52, -58)} ${p(-10, -54)} Q${p(26, -52)} ${p(36, -24)} Q${p(86, -30)} ${p(90, 6)} Q${p(92, 30)} ${p(66, 30)} Z`;
  return drawn(shadowed(el("path", { d, fill: colour(fill, "fill") }), 8));
});

export type GearParams = { cx: number; cy: number; r?: number; teeth?: number; fill?: string };
/** Gear with square teeth and a white hub, as on the maven-release cover. */
export const gear = definePiece<GearParams>(
  "gear",
  { cx: pos(), cy: pos(), r: size(), teeth: count(4, 64), fill: col() },
  ({ cx, cy, r = 84, teeth = 12, fill = "color.transitional" }) => {
    const root = r * 0.78;
    const points: string[] = [];
    const step = (2 * Math.PI) / teeth;
    const at = (radius: number, angle: number) => `${r2(cx + radius * Math.cos(angle))},${r2(cy + radius * Math.sin(angle))}`;
    for (let i = 0; i < teeth; i++) {
      const a = i * step;
      points.push(at(root, a - step * 0.3), at(r, a - step * 0.18), at(r, a + step * 0.18), at(root, a + step * 0.3));
    }
    return drawn([...shadowed(el("polygon", { points: points.join(" "), fill: colour(fill, "fill") })), el("circle", { cx, cy, r: r2(r * 0.36), fill: tokens.color.white })]);
  },
);

export type ParcelParams = { x: number; y: number; size?: number; fill?: string };
/** Parcel (box) with a lid line and a tape strip. */
export const parcel = definePiece<ParcelParams>("parcel", { x: pos(), y: pos(), size: size(), fill: col() }, ({ x, y, size: s = 96, fill = "color.blocked" }) =>
  drawn([
    ...shadowed(el("rect", { x, y, width: s, height: r2(s * 0.8), rx: 6, fill: colour(fill, "fill") })),
    el("path", { d: `M${x},${r2(y + s * 0.3)} H${x + s}`, fill: "none", "stroke-width": tokens.outline.small }),
    el("rect", { x: x + s / 2 - 12, y, width: 24, height: r2(s * 0.8), fill: tokens.illustration.tape, "stroke-width": tokens.outline.small }),
  ]),
);

export type StepsParams = { x: number; y: number; count?: number; width?: number; rise?: number; fill?: string };
/** Steps climbing to the right from the bottom-left corner (x, y), as on the obsidian-to-site guide cover. */
export const steps = definePiece<StepsParams>(
  "steps",
  { x: pos(), y: pos(), count: count(1, 20), width: size(), rise: size(), fill: col() },
  ({ x, y, count = 4, width: w = 145, rise = 40, fill = "color.caller" }) => {
    const blocks = Array.from({ length: count }, (_, i) => el("rect", { x: x + i * w, y: y - rise * (i + 1), width: w, height: rise * (i + 1), rx: 10, fill: colour(fill, "fill") }));
    return drawn([...blocks.map((b) => ({ ...b, attrs: { ...b.attrs, fill: ink, transform: `translate(${tokens.shadow.block} ${tokens.shadow.block})` } })), ...blocks]);
  },
);

// ---------- Mule ----------

export type MuleTile = { x: number; kind: "scatter-gather" | "choice" | "for-each" };
export type MuleFlowParams = { x: number; y: number; width: number; height?: number; tiles: MuleTile[]; tileWidth?: number; fill?: string };
const muleGlyph = (kind: MuleTile["kind"], cx: number, cy: number): SvgNode[] => {
  const line = { fill: "none", "stroke-linecap": "round" };
  if (kind === "scatter-gather")
    return [el("path", { ...line, d: `M${cx - 25},${cy - 20} V${cy + 20} M${cx + 25},${cy - 20} V${cy + 20} M${cx - 17},${cy - 12} H${cx + 17} M${cx - 17},${cy} H${cx + 17} M${cx - 17},${cy + 12} H${cx + 17}` })];
  if (kind === "choice")
    return [el("path", { ...line, d: `M${cx - 27},${cy} H${cx - 17} M${cx - 3},${cy - 14} L${cx + 11},${cy} L${cx - 3},${cy + 14} L${cx - 17},${cy} Z M${cx + 11},${cy} L${cx + 27},${cy - 14} M${cx + 11},${cy} L${cx + 27},${cy + 14}` })];
  return [
    el("path", { ...line, d: `M${r2(cx + 18.2)},${r2(cy - 10.5)} A21,21 0 1 1 ${r2(cx - 14.8)},${r2(cy - 14.8)}` }),
    el("path", { d: `M${r2(cx - 8.5)},${r2(cy - 21.2)} L${r2(cx - 9.9)},${r2(cy - 9.9)} L${r2(cx - 19.8)},${r2(cy - 19.8)} Z`, fill: ink, "stroke-width": 2 }),
    el("rect", { x: cx - 8, y: cy - 8, width: 16, height: 16, fill: tokens.color.white, "stroke-width": tokens.outline.small }),
  ];
};
/** A Mule flow: a bar with processor tiles linked left to right, each with its glyph. */
export const muleFlow = definePiece<MuleFlowParams>(
  "muleFlow",
  {
    x: pos(),
    y: pos(),
    width: size(true, 120),
    height: size(false, 40),
    tiles: { kind: "array", required: true, minItems: 1, of: { kind: "object", fields: { x: pos(), kind: { kind: "enum", required: true, values: ["scatter-gather", "choice", "for-each"] } } } },
    tileWidth: size(false, 40),
    fill: col(),
  },
  ({ x, y, width: w, height: h = 104, tiles, tileWidth = 86, fill = "color.caller" }) => {
    const cy = y + h / 2;
    const links: string[] = [`M${x + 18},${cy} H${tiles[0].x - 6}`];
    const heads: SvgNode[] = [];
    tiles.forEach((tile, i) => {
      const end = i + 1 < tiles.length ? tiles[i + 1].x - 6 : x + w - 16;
      links.push(`M${tile.x + tileWidth},${cy} H${end}`);
      heads.push(el("path", { d: `M${end - 8},${cy - 7} L${end + 1},${cy} L${end - 8},${cy + 7} Z`, fill: ink, "stroke-width": 2 }));
    });
    return drawn([
      ...shadowed(el("rect", { x, y, width: w, height: h, rx: 22, fill: colour(fill, "fill") })),
      el("path", { d: links.join(" "), "stroke-linecap": "round" }),
      ...heads,
      ...tiles.flatMap((tile) => shadowed(el("rect", { x: tile.x, y: y + 14, width: tileWidth, height: h - 28, rx: 14, fill: tokens.color.white }), 6)),
      ...tiles.flatMap((tile) => muleGlyph(tile.kind, tile.x + tileWidth / 2, cy)),
    ]);
  },
);

// ---------- EIP icons ----------

export type EipIconParams = { name: string; x: number; y: number; scale?: number };
/** One of the 26 EIP icons (64x40), placed at (x, y) and scaled; the cover's outline does not leak in. */
export const eipIcon = definePiece<EipIconParams>(
  "eipIcon",
  { name: { kind: "enum", required: true, values: EIP_ICON_NAMES }, x: pos(), y: pos(), scale: size() },
  ({ name, x, y, scale = 1 }) => {
    const icon = EIP_ICONS.find((candidate) => candidate.name === name)!;
    return drawn([g({ transform: `translate(${x} ${y}) scale(${scale})`, stroke: "none" }, ...icon.nodes)]);
  },
);

/** Every piece, by name, in catalogue order (spec illustration-pieces, "Piece catalogue"). */
export const PIECES = {
  pill,
  rings,
  sheet,
  blockArrow,
  arcArrow,
  rail,
  checkBadge,
  priceTag,
  nameTag,
  codePanel,
  serverStack,
  cloud,
  stamp,
  robot,
  magnifier,
  gear,
  parcel,
  road,
  milestonePin,
  browserWindow,
  speechBubble,
  steps,
  folder,
  book,
  muleFlow,
  eipIcon,
  ...METRO_PIECES,
} as const;
export type PieceName = keyof typeof PIECES;
export const PIECE_NAMES = Object.keys(PIECES) as PieceName[];

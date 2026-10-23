// `npm run pieces:sheet -- --out <file.svg>` (spec illustration-pieces,
// "Piece catalogue"): one SVG with every piece once, labelled with its name,
// on the neutral panel. The owner reviews the pieces from this sheet.
//
// What can go wrong: a missing or non-.svg --out, or a missing folder, prints
// the problem with the usage and exits 1 before writing.
import { existsSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { tokens } from "../tokens/generated/tokens.ts";
import * as P from "../src/pieces/library.ts";
import { el, g, type Drawn, type SvgNode } from "../src/pieces/node.ts";
import { toSvg } from "../src/pieces/render.ts";

export const SHEET_USAGE = "usage: npm run pieces:sheet -- --out <file.svg>";
const CELL = 240;
const GAP = 20;
const COLUMNS = 6;

/** Several drawings of one piece in a cell. */
const merge = (...parts: Drawn[]): Drawn => ({ body: parts.flatMap((part) => part.body), text: parts.flatMap((part) => part.text) });

/** Each piece drawn inside a 240x240 cell whose top-left corner is (x, y). */
export const SAMPLES: Record<P.PieceName, (x: number, y: number) => Drawn> = {
  pill: (x, y) => P.pill({ x: x + 120, y: y + 100, text: "label" }),
  rings: (x, y) => P.rings({ cx: x + 120, cy: y + 100, radius: 20, color: "color.caller" }),
  sheet: (x, y) => P.sheet({ x: x + 34, y: y + 14, width: 170, height: 180, top: 34, step: 36, rows: [{ lead: "checked", bar: 80 }, { lead: "question", bar: 60, tail: "check" }, { bar: 120 }, { lead: "checkbox", bar: 70 }] }),
  blockArrow: (x, y) => P.blockArrow({ x: x + 70, y: y + 100, length: 100 }),
  arcArrow: (x, y) => P.arcArrow({ from: [x + 40, y + 150], c1: [x + 60, y + 40], c2: [x + 180, y + 40], to: [x + 200, y + 140], color: "color.ink" }),
  rail: (x, y) => P.rail({ x: x + 18, y: y + 78, width: 204, nodes: ["color.healthy", "color.caller", "color.blocked"] }),
  checkBadge: (x, y) => P.checkBadge({ cx: x + 120, cy: y + 100, r: 26 }),
  priceTag: (x, y) => P.priceTag({ x: x + 50, y: y + 100, text: "v1.0.0" }),
  nameTag: (x, y) => P.nameTag({ hangX: x + 120, hangY: y + 18, cx: x + 120, top: y + 60, rotate: -6, icon: "scatter-gather" }),
  codePanel: (x, y) => P.codePanel({ x: x + 40, y: y + 28, width: 160, height: 160, lines: [{ indent: 0, w: 60, color: "healthy" }, { indent: 16, w: 90, color: "caller" }, { indent: 30, w: 80, color: "backend", tall: true }, { indent: 16, w: 70, color: "white" }, { indent: 0, w: 40, color: "healthy" }] }),
  serverStack: (x, y) => P.serverStack({ x: x + 40, y: y + 30, width: 160, failing: 2 }),
  cloud: (x, y) => P.cloud({ cx: x + 120, cy: y + 110 }),
  stamp: (x, y) => P.stamp({ cx: x + 120, cy: y + 100, word: "GO" }),
  robot: (x, y) => ({ body: [g({ transform: `translate(${x + 120} ${y + 46}) scale(0.72) translate(-400 -60)` }, ...P.robot({ cx: 400, top: 80 }).body)], text: [] }),
  magnifier: (x, y) => P.magnifier({ cx: x + 100, cy: y + 86 }),
  gear: (x, y) => P.gear({ cx: x + 120, cy: y + 100, r: 70 }),
  parcel: (x, y) => P.parcel({ x: x + 65, y: y + 50, size: 110 }),
  road: (x, y) => P.road({ d: `M${x + 24},${y + 170} C${x + 80},${y + 170} ${x + 90},${y + 90} ${x + 140},${y + 100} S${x + 190},${y + 60} ${x + 216},${y + 50}` }),
  milestonePin: (x, y) => P.milestonePin({ x: x + 120, y: y + 170, text: "1" }),
  browserWindow: (x, y) => P.browserWindow({ x: x + 20, y: y + 28 }),
  speechBubble: (x, y) => P.speechBubble({ x: x + 30, y: y + 70, width: 180, height: 74 }),
  steps: (x, y) => P.steps({ x: x + 20, y: y + 180, count: 3, width: 64, rise: 40 }),
  folder: (x, y) => P.folder({ x: x + 54, y: y + 44, scale: 0.7 }),
  book: (x, y) => {
    const cover = P.book({ x: x + 64, y: y + 14, width: 110, height: 172 });
    const icons = [P.eipIcon({ name: "splitter", x: x + 92, y: y + 50, scale: 0.66 }), P.eipIcon({ name: "dead-letter-channel", x: x + 134, y: y + 50, scale: 0.66 })];
    return { body: [...cover.body, ...icons.flatMap((i) => i.body)], text: [] };
  },
  muleFlow: (x, y) => ({
    body: [g({ transform: `translate(${x + 6} ${y + 72}) scale(0.54) translate(-272 -112)` }, ...P.muleFlow({ x: 272, y: 112, width: 420, tiles: [{ x: 312, kind: "scatter-gather" }, { x: 442, kind: "choice" }, { x: 572, kind: "for-each" }] }).body)],
    text: [],
  }),
  eipIcon: (x, y) => ({
    body: ["publish-subscribe-channel", "content-based-router", "splitter", "idempotent-receiver", "scatter-gather", "message-translator"].flatMap(
      (name, i) => P.eipIcon({ name, x: x + 26 + (i % 2) * 100, y: y + 18 + Math.floor(i / 2) * 64, scale: 1.3 }).body,
    ),
    text: [],
  }),
  lineBadge: (x, y) => merge(P.lineBadge({ x: x + 70, y: y + 70, text: "SH", fill: "illustration.accent" }), P.lineBadge({ x: x + 160, y: y + 70, text: "INV", fill: "color.blocked", flat: true }), P.lineBadge({ x: x + 115, y: y + 130, text: "OPS", fill: "color.healthy", surface: "dark", inkScale: 1.6, height: 28, width: 70 })),
  stationMarker: (x, y) => merge(P.stationMarker({ cx: x + 60, cy: y + 70 }), P.stationMarker({ cx: x + 120, cy: y + 70, state: "deprecated" }), P.stationMarker({ cx: x + 70, cy: y + 140, to: [x + 170, y + 140] })),
  pipe: (x, y) => merge(P.pipe({ d: `M${x + 24},${y + 60} L${x + 120},${y + 60} L${x + 200},${y + 140}`, fill: "illustration.accent" }), P.pipe({ d: `M${x + 24},${y + 140} L${x + 140},${y + 140}`, fill: "color.blocked" })),
  countBadge: (x, y) => merge(P.countBadge({ cx: x + 80, cy: y + 90, text: "3" }), P.countBadge({ cx: x + 150, cy: y + 90, text: "12", inkScale: 1.6, height: 26 })),
  nodeBlock: (x, y) => merge(P.nodeBlock({ x: x + 20, y: y + 30, width: 190, title: "designer", subtitle: "skill", inkScale: 1.6 }), P.nodeBlock({ x: x + 20, y: y + 110, width: 190, title: "Nothing", state: "placeholder" })),
  pillNode: (x, y) => merge(P.pillNode({ x: x + 20, y: y + 40, width: 190, title: "engineering", subtitle: "playbook", inkScale: 1.6 }), P.pillNode({ x: x + 20, y: y + 120, width: 190, title: "This item", subtitle: "focus", state: "focus", inkScale: 1.6 })),
  hexNode: (x, y) => P.hexNode({ x: x + 20, y: y + 80, width: 190, title: "reviewer", subtitle: "agent", inkScale: 1.6 }),
  messageArrow: (x, y) => merge(P.messageArrow({ from: [x + 20, y + 40], to: [x + 220, y + 110] }), P.messageArrow({ from: [x + 20, y + 160], to: [x + 220, y + 160], curve: "straight", label: "used by" })),
  ledgerMark: (x, y) => merge(P.ledgerMark({ x: x + 40, y: y + 60, size: 32 }), P.ledgerMark({ x: x + 90, y: y + 44, size: 64 }), P.ledgerMark({ x: x + 170, y: y + 68, size: 16 })),
  renewalRing: (x, y) => merge(P.renewalRing({ cx: x + 70, cy: y + 100, r: 30 }), P.stationMarker({ cx: x + 70, cy: y + 100 }), P.renewalRing({ cx: x + 170, cy: y + 100, r: 30, surface: "dark" })),
  suggestedHalo: (x, y) => merge(P.suggestedHalo({ cx: x + 120, cy: y + 100, r: 33 }), P.stationMarker({ cx: x + 120, cy: y + 100 })),
  licenceMark: (x, y) => merge(P.stationMarker({ cx: x + 100, cy: y + 100 }), P.licenceMark({ cx: x + 115, cy: y + 85 }), P.licenceMark({ cx: x + 170, cy: y + 100, state: "toBuy" })),
  zone: (x, y) => P.zone({ points: [[x + 50, y + 80], [x + 190, y + 70], [x + 160, y + 160], [x + 70, y + 150]], fill: "color.caller", title: "zone", titleAt: [x + 30, y + 10] }),
  diagramBox: (x, y) => merge(P.diagramBox({ x: x + 20, y: y + 30, width: 200, text: ["Orders API"], subtitle: "Mule application", fill: "color.healthy" }), P.diagramBox({ x: x + 20, y: y + 120, width: 200, text: ["Sender"], shape: "pill", fill: "color.caller" })),
  decisionNode: (x, y) => P.decisionNode({ x: x + 20, y: y + 50, width: 200, height: 110, text: ["Has ID 42", "been processed?"] }),
  storeNode: (x, y) => P.storeNode({ x: x + 50, y: y + 50, width: 140, height: 100, text: ["Processed IDs"] }),
  queueNode: (x, y) => merge(P.queueNode({ x: x + 20, y: y + 50, width: 200, text: ["`order-created`"] }), P.queueNode({ x: x + 20, y: y + 130, width: 200, text: ["DLQ"], fill: "color.blocked" })),
  exchangeNode: (x, y) => P.exchangeNode({ x: x + 20, y: y + 80, width: 200, text: ["Message exchange"] }),
  taggedContainer: (x, y) => P.taggedContainer({ x: x + 20, y: y + 50, width: 200, height: 140, tag: "Anypoint MQ" }),
  lifeline: (x, y) => merge(P.lifeline({ x: x + 90, y1: y + 20, y2: y + 200 }), P.lifeline({ x: x + 150, y1: y + 20, y2: y + 200, state: "inactive" })),
  phaseBand: (x, y) => merge(P.phaseBand({ x: x + 20, y: y + 60, width: 200, text: "Circuit CLOSED", fill: "color.healthy" }), P.phaseBand({ x: x + 20, y: y + 130, width: 200, text: "Circuit OPEN", fill: "color.blocked" })),
  altFrame: (x, y) => P.altFrame({ x: x + 14, y: y + 30, width: 212, height: 170, tag: "alt", condition: "[found]", sections: [{ y: y + 120, tag: "else", condition: "[not found]" }] }),
  edgeLabel: (x, y) => merge(
    P.messageArrow({ from: [x + 20, y + 80], to: [x + 220, y + 80], curve: "straight", kind: "reply" }),
    P.edgeLabel({ x: x + 120, y: y + 70, lines: ["`200 OK`"], backdrop: true }),
    P.messageArrow({ from: [x + 20, y + 150], to: [x + 220, y + 150], curve: "straight", kind: "failure" }),
    P.edgeLabel({ x: x + 120, y: y + 140, lines: ["error"], backdrop: true }),
  ),
  uiIcon: (x, y) => merge(...P.UI_ICON_NAMES.map((name, i) => P.uiIcon({ name, x: x + 20 + (i % 4) * 52, y: y + 50 + Math.floor(i / 4) * 52, size: 32 }))),
  linkIcon: (x, y) => merge(...P.LINK_ICON_NAMES.map((icon, i) => P.linkIcon({ icon, x: x + 20 + (i % 2) * 110, y: y + 30 + Math.floor(i / 2) * 80, size: 64 }))),
};

export const piecesSheet = (): SvgNode => {
  const rows = Math.ceil(P.PIECE_NAMES.length / COLUMNS);
  const width = GAP + COLUMNS * (CELL + GAP);
  const height = GAP + rows * (CELL + GAP + 10);
  const cells = P.PIECE_NAMES.map((name, i) => {
    const x = GAP + (i % COLUMNS) * (CELL + GAP);
    const y = GAP + Math.floor(i / COLUMNS) * (CELL + GAP + 10);
    const piece = SAMPLES[name](x, y);
    // Each cell clips its piece, so the rings (radius up to 400) stay in their cell.
    return {
      clip: el("clipPath", { id: `cell-${name}` }, el("rect", { x, y, width: CELL, height: CELL, rx: 12 })),
      shapes: g(
        { stroke: tokens.color.ink, "stroke-width": tokens.outline.block, "stroke-linejoin": "round", "clip-path": `url(#cell-${name})` },
        el("rect", { x, y, width: CELL, height: CELL, rx: 12, fill: tokens.color.white, "fill-opacity": 0.5, stroke: tokens.color.ring, "stroke-width": 2 }),
        ...piece.body,
      ),
      text: g({ "font-size": tokens.cover.labelSize, "font-weight": tokens.cover.labelWeight, fill: tokens.color.ink, "text-anchor": "middle" }, ...piece.text),
      label: el("text", { x: x + CELL / 2, y: y + CELL - 10, "font-family": tokens.font.mono, "font-size": 16, "font-weight": tokens.font.weightBold, "text-anchor": "middle", fill: tokens.color.ink }, name),
    };
  });
  return el(
    "svg",
    { xmlns: "http://www.w3.org/2000/svg", width, height, viewBox: `0 0 ${width} ${height}`, "font-family": tokens.font.sans },
    el("defs", {}, ...cells.map((cell) => cell.clip)),
    el("rect", { width, height, fill: tokens.color.panel }),
    ...cells.flatMap((cell) => [cell.shapes, cell.text, cell.label]),
  );
};

export const runPiecesSheet = (args: string[], io: { cwd: string; log: (l: string) => void; error: (l: string) => void }): number => {
  const fail = (problem: string) => {
    io.error(problem);
    io.error(SHEET_USAGE);
    return 1;
  };
  if (args.length !== 2 || args[0] !== "--out") return fail("expected exactly --out <file.svg>");
  const out = args[1];
  if (!out.endsWith(".svg")) return fail(`the output must be an .svg file, found ${out}`);
  const folder = dirname(resolve(io.cwd, out));
  if (!existsSync(folder) || !statSync(folder).isDirectory()) return fail(`the output folder does not exist: ${dirname(out)}`);
  writeFileSync(resolve(io.cwd, out), `${toSvg(piecesSheet())}\n`);
  io.log(`wrote ${out}`);
  return 0;
};

const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  process.exitCode = runPiecesSheet(process.argv.slice(2), { cwd: process.env.INIT_CWD ?? process.cwd(), log: console.log, error: console.error });
}

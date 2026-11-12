// Evidence renders for the owner's gate of change sdd-scene-pieces (AB#333):
// writes one SVG per sheet, with the Source faces embedded (ADR 0008), into the
// folder given as the first argument. `npm run png` then shows each through one
// <img> in headless Chrome (never rsvg-convert). Not part of the package.
//
//   npx tsx docs/spikes/2026-11-12-sdd-scene-pieces/evidence.ts <out-dir> [gate-0-folder]
//
// With the gate-0 folder (`~/.hermes/cache/scratch/ab144-scene1`, holding A2.png,
// A4.png, A6.png), it also writes the contact sheet that puts the gate-0 frames 4
// and 6 beside the same frames drawn with the 0.12.0 pieces. Every colour and size
// comes from the tokens; the stage of the frames is the 1920 x 1080 composition.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { stageRingRadii } from "../../../src/brand/motion.ts";
import { embedFonts } from "../../../src/fonts/embed.ts";
import * as L from "../../../src/pieces/library.ts";
import { el, g, type Drawn, type SvgNode } from "../../../src/pieces/node.ts";
import { toSvg } from "../../../src/pieces/render.ts";
import { tokens } from "../../../tokens/generated/tokens.ts";

const [outDir, gate0] = process.argv.slice(2);
if (!outDir) throw new Error("usage: npx tsx evidence.ts <out-dir> [gate-0-folder]");

type Surface = "light" | "dark";
const T = tokens;
const merge = (...parts: Drawn[]): Drawn => ({ body: parts.flatMap((part) => part.body), text: parts.flatMap((part) => part.text) });
const ground = (surface: Surface) => (surface === "light" ? T.color.panel : T.surface.dark.background);
const line = (surface: Surface) => (surface === "light" ? T.color.ink : T.surface.dark.muted);
const caption = (x: number, y: number, words: string, surface: Surface, size = 15) =>
  el("text", { x, y, "font-family": T.font.sans, "font-size": size, "font-weight": 400, fill: surface === "light" ? T.brand.light.textMuted : T.surface.dark.muted, "text-anchor": "middle" }, words);

/** Shapes in an outlined group (the cover command's), then the words; a ground under both. */
const scene = (width: number, height: number, surface: Surface, parts: Drawn[], notes: SvgNode[] = []): SvgNode =>
  g({},
    el("rect", { width, height, fill: ground(surface) }),
    g({ stroke: line(surface), "stroke-width": T.outline.block, "stroke-linejoin": "round" }, ...parts.flatMap((part) => part.body)),
    g({ "font-family": T.font.sans, "font-size": T.cover.labelSize, "font-weight": T.cover.labelWeight, fill: T.color.ink, "text-anchor": "middle" }, ...parts.flatMap((part) => part.text)),
    ...notes);

const write = async (name: string, width: number, height: number, body: SvgNode, title: string, desc: string, extra = ""): Promise<void> => {
  const tree = el("svg", { xmlns: "http://www.w3.org/2000/svg", width, height, viewBox: `0 0 ${width} ${height}`, role: "img", "aria-labelledby": `${name}-title` },
    el("title", { id: `${name}-title` }, title), el("desc", {}, desc), body);
  let svg = toSvg(await embedFonts(tree));
  if (extra) svg = svg.replace(/<\/svg>$/, `${extra}\n</svg>`);
  writeFileSync(join(outDir, `${name}.svg`), `${svg}\n`);
  console.log(`wrote ${join(outDir, `${name}.svg`)}`);
};

const S = 1.15;
const SHORT = { width: 150, height: 120, rows: [{ lead: "question" as const, bar: 60 }, { lead: "checkbox" as const, bar: 50 }], label: "proposal.md" };
const TALL = { width: 150, height: 218, rows: [{ lead: "question" as const, bar: 60 }, { lead: "question" as const, bar: 44 }, { lead: "checked" as const, bar: 56 }, { bar: 90 }], label: "proposal.md" };

// 1. Visor holding a short and a tall sheet, facing right and left, at scale 1.15.
for (const surface of ["light", "dark"] as const) {
  const cells: Drawn[] = [], notes: SvgNode[] = [];
  const at = [[300, 330], [720, 330], [300, 690], [720, 690]] as const;
  [["right", SHORT], ["right", TALL], ["left", SHORT], ["left", TALL]].forEach(([facing, held], i) => {
    const [x, y] = at[i];
    const dx = facing === "right" ? 40 : -40;
    cells.push(L.visor({ x: x + dx, y, scale: S, surface, holdsSheet: held as typeof SHORT, facing: facing as "right" | "left", points: false, expression: "waiting" }));
    notes.push(caption(x, y + 34, `facing ${facing}, ${(held as typeof SHORT).width} x ${(held as typeof SHORT).height}`, surface));
  });
  await write(`visor-holds-sheet-${surface}`, 1020, 740, scene(1020, 740, surface, cells, notes), `Visor holds a sheet (${surface})`,
    "Visor at scale 1.15 holding a short and a tall sheet with a proposal.md label in its left hand, facing right (top) and left (bottom); the sheet and its words are never mirrored.");
}

// 2. The label: on the smallest sheet (80 x 80) it reaches the ear; on a 150-wide sheet it fits; without a label.
{
  const parts = [
    L.visor({ x: 260, y: 330, scale: S, holdsSheet: { width: 80, height: 80, rows: [{ lead: "question", bar: 20 }], label: "proposal.md" }, points: false }),
    L.visor({ x: 700, y: 330, scale: S, holdsSheet: { width: 150, height: 160, rows: [{ lead: "question", bar: 60 }, { lead: "question", bar: 40 }], label: "proposal.md" }, points: false }),
    L.visor({ x: 1140, y: 330, scale: S, holdsSheet: { width: 150, height: 160, rows: [{ lead: "question", bar: 60 }, { lead: "question", bar: 40 }] }, points: false }),
  ];
  const notes = [caption(190, 370, "80 x 80, label", "light"), caption(610, 370, "150 x 160, label", "light"), caption(1050, 370, "150 x 160, no label", "light")];
  await write("visor-sheet-label", 1280, 400, scene(1280, 400, "light", parts, notes), "Visor's held sheet with and without its label",
    "Visor at scale 1.15 holding the smallest sheet with the proposal.md label (the label reaches behind the ear), a 150-wide sheet with the label, and the same sheet without it.");
}

// 3. Facing left and right, pointing, with and without the card.
for (const surface of ["light", "dark"] as const) {
  const calls = [
    { facing: "right" as const, holds: false, label: "right, points" },
    { facing: "left" as const, holds: false, label: "left, points" },
    { facing: "left" as const, holds: true, label: "left, points, card" },
    { facing: "right" as const, holds: true, label: "right, points, card" },
  ];
  const parts = calls.map((call, i) => L.visor({ x: 160 + i * 300, y: 250, scale: S, surface, facing: call.facing, holds: call.holds, points: true }));
  const notes = calls.map((call, i) => caption(160 + i * 300, 290, call.label, surface));
  await write(`visor-facing-${surface}`, 1220, 320, scene(1220, 320, surface, parts, notes), `Visor faces left or right (${surface})`,
    "Visor at scale 1.15 pointing, facing right and left, with and without the card; facing left is the mirror image with the same outline.");
}

// 4. The question token at scale 1, 1.5 and 2 beside a sheet's question row.
for (const surface of ["light", "dark"] as const) {
  const page = L.sheet({ x: 40, y: 40, width: 200, height: 140, top: 30, step: 38, rows: [{ lead: "question", bar: 90 }, { lead: "question", bar: 60 }] });
  // On dark, the page and its outline as Visor's held group draws them: outline muted, marks over the white page in ink.
  const marked: Drawn = { body: page.body.map((node) => (node.tag === "g" && node.attrs["stroke-width"] === T.outline.small ? { ...node, attrs: { ...node.attrs, stroke: T.color.ink } } : node)), text: page.text };
  const tokens3 = merge(...[1, 1.5, 2].map((scale, i) => L.questionToken({ cx: 330 + i * 90, cy: 87, scale, surface })));
  const notes = [caption(140, 210, "sheet's question rows", surface), ...[1, 1.5, 2].map((scale, i) => caption(330 + i * 90, 210, `scale ${scale}`, surface))];
  await write(`question-token-${surface}`, 560, 230, scene(560, 230, surface, [marked, tokens3], notes), `Question token (${surface})`,
    "A sheet with two question rows beside the question token at scale 1, 1.5 and 2: the same white disc and question mark.");
}

// 5. The stage in composition pixels (1920 x 1080): rings and a dashed path from the scene tokens, tokens on the path.
const stage = (parts: Drawn[], pathD: string | null, ringsAt = { cx: 960, cy: 600 }, pieceScale = 2): SvgNode =>
  g({},
    el("rect", { width: 1920, height: 1080, fill: T.color.panel }),
    g({ fill: "none", stroke: T.color.ring, "stroke-width": T.scene.ringWidth }, ...stageRingRadii(1920, 1080).map((r) => el("circle", { cx: ringsAt.cx, cy: ringsAt.cy, r }))),
    pathD === null ? null : el("path", { d: pathD, fill: "none", stroke: T.scene.pathColor, "stroke-width": T.scene.pathWidth, "stroke-dasharray": `${T.scene.pathDash} ${T.scene.pathGap}`, "stroke-linecap": "round" }),
    // The gate-0 layout was drawn on a 960 frame: the pieces are scaled into the 1920 composition.
    g({ transform: `scale(${pieceScale})` },
      g({ stroke: T.color.ink, "stroke-width": T.outline.block, "stroke-linejoin": "round" }, ...parts.flatMap((part) => part.body)),
      g({ "font-family": T.font.sans, "font-size": T.cover.labelSize, "font-weight": T.cover.labelWeight, fill: T.color.ink, "text-anchor": "middle" }, ...parts.flatMap((part) => part.text))));

const bez = (p: number[][], t: number) => {
  const u = 1 - t;
  return [0, 1].map((k) => u * u * u * p[0][k] + 3 * u * u * t * p[1][k] + 3 * u * t * t * p[2][k] + t * t * t * p[3][k]);
};
const P2 = [[332, 122], [430, 110], [610, 130], [770, 290]];
const pathOf = (p: number[][], k = 2) => `M${p[0].map((v) => v * k)} C${p[1].map((v) => v * k)} ${p[2].map((v) => v * k)} ${p[3].map((v) => v * k)}`;
await write("stage", 1920, 1080,
  stage([L.questionToken({ cx: bez(P2, 0.3)[0], cy: bez(P2, 0.3)[1] }), L.questionToken({ cx: bez(P2, 0.62)[0], cy: bez(P2, 0.62)[1] })], pathOf(P2)),
  "Stage of a video scene", "The 1920 x 1080 stage: concentric rings and a dashed motion path drawn from the scene tokens, two question tokens on the path.");

// 6. The gate-0 frames 4 and 6 of concept A, drawn with the 0.12.0 pieces.
if (gate0) {
  const VX = 480, GY = 440;
  const balloon = () => L.speechBubble({ x: 50, y: 56, width: 280, height: 110, fill: "color.state.caller" });
  const take = (n: string) => L.countBadge({ cx: 918, cy: 42, text: n, textSize: 22 });
  const rewind = () => L.uiIcon({ name: "reset", x: 852, y: 24, size: 38 });
  const lineSet = (n: number) => [
    { indent: 0, w: 90 }, { indent: 18, w: 120 }, { indent: 36, w: 80 }, { indent: 36, w: 110 },
    { indent: 18, w: 70 }, { indent: 36, w: 100 }, { indent: 18, w: 60 }, { indent: 0, w: 40 },
  ].slice(0, n).map((l) => ({ ...l, color: "white" as const }));
  const code = (n: number, x = 690) => L.codePanel({ x, y: 200, width: 210, height: 220, top: 34, step: 22, lines: lineSet(n) });
  const qRows = (answered: boolean) => Array.from({ length: 6 }, (_, i) => ({ lead: "question" as const, bar: [44, 34, 50, 40, 46, 30][i], tail: answered ? ("check" as const) : ("none" as const) }));
  const spec = (x: number, y: number) => merge(
    L.sheet({ x, y, width: 150, height: 244, top: 34, step: 27, rows: qRows(true) }),
    L.pill({ x: x + 75, y, text: "proposal.md", width: 140 }),
  );
  // Frame 4: Visor holds the sheet in its hand (no longer a sheet beside it); the path from the request to the sheet.
  const held = { width: 150, height: 204, top: 26, step: 29, rows: qRows(false), label: "proposal.md" };
  const f4 = stage([balloon(), code(0), L.visor({ x: VX, y: GY, scale: S, points: false, expression: "waiting", holdsSheet: held }), rewind(), take("2")],
    "M404 344 C 418 358, 432 372, 446 390");
  // Frame 6 as at gate 0, with the scene tokens.
  const f6 = stage([balloon(), code(8), spec(70, 204), L.stamp({ cx: 150, cy: 424, r: 32, word: "GO" }), L.visor({ x: VX, y: GY, scale: S, points: true, expression: "done" }), L.emote({ kind: "worked", x: 358, y: 300, scale: 0.72 }), take("2")],
    "M444 600 C 760 880, 1120 880, 1380 760");
  // Frame 2 of take 1: the open questions travel as question tokens on the dashed path.
  const travelling = merge(...[0.14, 0.3, 0.46, 0.62, 0.8].map((t) => { const [x, y] = bez(P2, t); return L.questionToken({ cx: x, cy: y }); }));
  const f2 = stage([balloon(), code(4), L.visor({ x: VX, y: GY, scale: S, points: true }), travelling, take("1")], pathOf(P2));
  // Frame 6 mirrored: the code on the left, Visor facing left and pointing at it (a layout gate 0 could not draw).
  const f6m = stage([L.speechBubble({ x: 630, y: 56, width: 280, height: 110, fill: "color.state.caller" }), code(8, 60), merge(L.sheet({ x: 740, y: 204, width: 150, height: 244, top: 34, step: 27, rows: qRows(true) }), L.pill({ x: 815, y: 204, text: "proposal.md", width: 140 })), L.stamp({ cx: 820, cy: 424, r: 32, word: "GO" }), L.visor({ x: VX, y: GY, scale: S, points: true, expression: "done", facing: "left" }), L.emote({ kind: "worked", x: 602, y: 300, scale: 0.72 }), take("2")],
    "M1476 600 C 1160 880, 800 880, 540 760");

  const FW = 640, FH = 360, M = 36, GAP = 28, CAP = 58, TOP = 96;
  const width = 2 * M + 2 * FW + GAP, rows = 3, height = TOP + rows * (FH + CAP + GAP) + M - GAP;
  const cells: { frame: SvgNode | string; title: string; line: string }[] = [
    { frame: "A4.png", title: "4 · gate 0: a sheet drawn beside Visor, not in its hand", line: "Prototype on 0.11.0: the sheet placed next to Visor; path and rings copied by hand" },
    { frame: "A6.png", title: "6 · gate 0: final still", line: "Prototype on 0.11.0: path 2 / 9 / 3 and rings copied by hand" },
    { frame: f4, title: "4 · 0.12.0: Visor holds the sheet (holdsSheet, label)", line: "Hand over the sheet's edge; six question rows; path and rings from scene.*" },
    { frame: f6, title: "6 · 0.12.0: final still with the scene tokens", line: "Path 4 / 18 / 6 in composition pixels; rings 100 / 34 / 2.5 (twice as dense)" },
    { frame: f2, title: "2 · 0.12.0: questionToken travelling on the path", line: "White disc and '?' of a sheet row, instead of the map's countBadge" },
    { frame: f6m, title: "6 mirrored · 0.12.0: facing left, code on the left", line: "facing: \"left\" points at the code; sheet and words unmirrored" },
  ];
  const kids: SvgNode[] = [
    el("rect", { width, height, fill: T.color.white }),
    el("text", { x: M, y: 46, "font-family": T.font.sans, "font-size": 24, "font-weight": 700, fill: T.color.ink }, "AB#144 concept A, frames 4 and 6: gate 0 versus the 0.12.0 pieces"),
    el("text", { x: M, y: 74, "font-family": T.font.sans, "font-size": 15, "font-weight": 400, fill: T.brand.light.textMuted }, "Change sdd-scene-pieces (AB#333): the four gate-0 workarounds closed. Frames are the 1920 x 1080 stage shown at 640 x 360."),
  ];
  const images: string[] = [];
  cells.forEach((cell, i) => {
    const x = M + (i % 2) * (FW + GAP), y = TOP + Math.floor(i / 2) * (FH + CAP + GAP);
    if (typeof cell.frame === "string") {
      const data = readFileSync(join(gate0, cell.frame)).toString("base64");
      images.push(`  <image x="${x}" y="${y}" width="${FW}" height="${FH}" href="data:image/png;base64,${data}"/>`);
    } else {
      kids.push(el("svg", { x, y, width: FW, height: FH, viewBox: "0 0 1920 1080" }, cell.frame));
    }
    kids.push(el("rect", { x, y, width: FW, height: FH, fill: "none", stroke: T.illustration.textBar, "stroke-width": 1.5 }));
    kids.push(el("text", { x, y: y + FH + 24, "font-family": T.font.sans, "font-size": 16, "font-weight": 700, fill: T.color.ink }, cell.title));
    kids.push(el("text", { x, y: y + FH + 45, "font-family": T.font.sans, "font-size": 14, "font-weight": 400, fill: T.brand.light.textMuted }, cell.line));
  });
  await write("concept-a-frames-4-6", width, height, g({}, ...kids), "Concept A frames 4 and 6, gate 0 and 0.12.0",
    "The gate-0 frames 4 and 6 of AB#144 concept A beside the same frames drawn with the 0.12.0 pieces: Visor holding the sheet, the scene tokens' rings and path, the question token travelling, and Visor facing left.", images.join("\n"));
}

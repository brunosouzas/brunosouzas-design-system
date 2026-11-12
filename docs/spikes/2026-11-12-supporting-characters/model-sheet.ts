// The model sheet of the supporting cast, Balão and Chaves (art-direction
// SHEET-1; change supporting-characters, task 6.1, design §8), drawn from the
// built pieces in src/pieces/ only: no character is drawn here. It writes, into
// the folder given as the first argument, one SVG per panel and the whole sheet,
// `model-sheet.svg`, each with the Source faces embedded (ADR 0008).
// `npm run png` then shows each panel through one <img> in headless Chrome
// (never rsvg-convert). Not part of the package; see README.md for the commands.
//
//   npx tsx docs/spikes/2026-11-12-supporting-characters/model-sheet.ts <out-dir>
//
// Panels: per character the front and back on light and dark, the silhouette,
// the four expressions, every action facing right and left, and an emote at its
// spot (design §8: (x ± 116·scale, y − 200·scale), at the character's scale);
// the seven characters on one ground line at one scale, light and dark (motion
// CAST-5); the same row shown 48 and 24 px tall. The only things this script
// draws itself are the sheet's tiles, captions and silhouettes (a piece's tree
// painted in ink). What can go wrong: a missing out-dir stops it with the usage.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { embedFonts } from "../../../src/fonts/embed.ts";
import * as L from "../../../src/pieces/library.ts";
import { el, g, type Drawn, type SvgNode } from "../../../src/pieces/node.ts";
import { toSvg } from "../../../src/pieces/render.ts";
import { tokens } from "../../../tokens/generated/tokens.ts";

const outDir = process.argv[2];
if (!outDir) throw new Error("usage: npx tsx docs/spikes/2026-11-12-supporting-characters/model-sheet.ts <out-dir>");

type Surface = "light" | "dark";
type Facing = "right" | "left";
const T = tokens;
const EXPRESSIONS = ["idle", "done", "waiting", "failed"] as const;
const merge = (...parts: Drawn[]): Drawn => ({ body: parts.flatMap((part) => part.body), text: parts.flatMap((part) => part.text) });
const ground = (surface: Surface) => (surface === "light" ? T.color.panel : T.surface.dark.background);
const line = (surface: Surface) => (surface === "light" ? T.color.ink : T.surface.dark.muted);
const text = (x: number, y: number, words: string, size: number, weight: number, fill: string, anchor = "middle") =>
  el("text", { x, y, "font-family": T.font.sans, "font-size": size, "font-weight": weight, fill, "text-anchor": anchor }, words);
const caption = (x: number, y: number, words: string) => text(x, y, words, 15, 400, T.brand.light.textMuted);

/** A tile: its ground, the pieces' shapes in an outlined group (as the cover command does), then their words. */
const tile = (x: number, y: number, w: number, h: number, surface: Surface, parts: Drawn[], note: string): SvgNode =>
  g({},
    el("rect", { x, y, width: w, height: h, rx: 14, fill: ground(surface) }),
    g({ stroke: line(surface), "stroke-width": T.outline.block, "stroke-linejoin": "round" }, ...parts.flatMap((part) => part.body)),
    g({ "font-family": T.font.sans, "font-size": T.cover.labelSize, "font-weight": T.cover.labelWeight, fill: T.color.ink, "text-anchor": "middle" }, ...parts.flatMap((part) => part.text)),
    caption(x + w / 2, y + h + 22, note));

/** A piece's tree painted in ink: the silhouette test (E11 q5 of the identity studio). */
const silhouette = (drawn: Drawn): Drawn => {
  const paint = (node: SvgNode | string): SvgNode | string => {
    if (typeof node === "string") return node;
    const attrs = { ...node.attrs };
    for (const key of ["fill", "stroke"] as const) if (attrs[key] !== undefined && attrs[key] !== "none") attrs[key] = T.color.ink;
    return { ...node, attrs, children: node.children.map(paint) };
  };
  return { body: drawn.body.map((node) => paint(node) as SvgNode), text: [] };
};

/** The emote spot of design §8, in scene coordinates. */
const spot = (x: number, y: number, scale: number, facing: Facing) => ({ x: x + (facing === "left" ? -116 : 116) * scale, y: y - 200 * scale });

const S = 0.85;
/** A tile wide enough for a character and an emote at its spot. */
const EMOTE_TILE = 280;
const TILE = 236, TILE_H = 250, GAP = 18, CAP = 34, LEFT = 30;

type Panel = { name: string; width: number; height: number; node: SvgNode; title: string; desc: string };

/** One character's panel: views, silhouette, expressions, actions and emotes. */
const characterPanel = (name: "balao" | "chaves", heading: string, actions: { label: string; w: number; draw: (x: number, y: number, surface: Surface) => Drawn[]; surface?: Surface }[][]): Panel => {
  const piece = (p: Record<string, unknown>) => (L.PIECES[name] as unknown as (q: Record<string, unknown>) => Drawn)(p);
  const kids: SvgNode[] = [text(LEFT, 44, heading, 24, 700, T.color.ink, "start")];
  let y = 70, right = 0;
  type Cell = { w: number; surface: Surface; parts: Drawn[]; note: string };
  const row = (cells: Cell[]) => {
    let x = LEFT;
    for (const cell of cells) {
      kids.push(tile(x, y, cell.w, TILE_H, cell.surface, cell.parts, cell.note));
      x += cell.w + GAP;
    }
    y += TILE_H + CAP + GAP;
    right = Math.max(right, x);
  };
  const base = (x: number, w: number) => ({ cx: x + w / 2, gy: y + TILE_H - 26 });
  // Row 1: front and back on light and dark, then the silhouette.
  const views = [["front", "light"], ["back", "light"], ["front", "dark"], ["back", "dark"]] as const;
  const cells1: Cell[] = views.map(([view, surface], i) => {
    const { cx, gy } = base(LEFT + i * (TILE + GAP), TILE);
    return { w: TILE, surface, parts: [piece({ x: cx, y: gy, scale: S, view, surface })], note: `${view} · ${surface}` };
  });
  const sil = base(LEFT + 4 * (TILE + GAP), TILE);
  cells1.push({ w: TILE, surface: "light", parts: [silhouette(piece({ x: sil.cx, y: sil.gy, scale: S }))], note: "silhouette" });
  row(cells1);
  // Row 2: the four expressions (the screen face only, CAST-2), then an emote at its spot on dark.
  const cells2: Cell[] = EXPRESSIONS.map((expression, i) => {
    const { cx, gy } = base(LEFT + i * (TILE + GAP), TILE);
    return { w: TILE, surface: "light", parts: [piece({ x: cx, y: gy, scale: S, expression })], note: expression };
  });
  const [emoteExpression, emoteKind] = name === "balao" ? (["waiting", "doubt"] as const) : (["failed", "problem"] as const);
  {
    // A wider tile: the emote at the character's scale sits beside the head, about its size (CAST-3).
    const { cx, gy } = base(LEFT + 4 * (TILE + GAP), EMOTE_TILE);
    const at = { x: cx - 30, y: gy };
    const where = spot(at.x, at.y, S, "right");
    cells2.push({ w: EMOTE_TILE, surface: "dark", parts: [piece({ ...at, scale: S, surface: "dark", expression: emoteExpression }), L.emote({ kind: emoteKind, ...where, scale: S, surface: "dark" })], note: `${emoteExpression} + emote '${emoteKind}' at its spot` });
  }
  row(cells2);
  // Rows 3 and on: the actions, each facing right and left.
  for (const cells of actions) {
    let cx = LEFT;
    row(cells.map((cell) => {
      const surface = cell.surface ?? "light";
      const parts = cell.draw(cx, y + TILE_H - 26, surface);
      const out = { w: cell.w, surface, parts, note: cell.label };
      cx += cell.w + GAP;
      return out;
    }));
  }
  const width = right - GAP + LEFT;
  return { name, width, height: y - GAP + 10, node: g({}, el("rect", { width, height: y - GAP + 10, fill: T.color.white }), ...kids), title: `${heading}: model sheet`, desc: "" };
};

const W2 = 280, W3 = 330;
const balaoPanel = characterPanel("balao", "Balão · the requester and approver", [
  [
    { label: "speaks · facing right", w: TILE, draw: (x, gy, surface) => [L.balao({ x: x + TILE / 2 - 6, y: gy, scale: S, surface, speaks: true })] },
    { label: "speaks · facing left", w: TILE, draw: (x, gy, surface) => [L.balao({ x: x + TILE / 2 + 6, y: gy, scale: S, surface, speaks: true, facing: "left" })] },
    { label: "holds the stamp GO · facing right", w: W2, draw: (x, gy, surface) => [L.balao({ x: x + 104, y: gy, scale: S, surface, holdsStamp: { word: "GO" } })] },
    { label: "holds the stamp GO · facing left", w: W2, draw: (x, gy, surface) => [L.balao({ x: x + W2 - 104, y: gy, scale: S, surface, holdsStamp: { word: "GO" }, facing: "left" })] },
    { label: "holds the stamp GO · dark", w: W2, surface: "dark", draw: (x, gy, surface) => [L.balao({ x: x + 104, y: gy, scale: S, surface, holdsStamp: { word: "GO" }, expression: "done" })] },
  ],
  [
    // "Answers" is a sheet beside the front hand (design §5), placed by the scene.
    { label: "answers: a sheet beside it (scene)", w: W3, draw: (x, gy, surface) => [
      L.balao({ x: x + 110, y: gy, scale: S, surface }),
      ((page: Drawn) => ({ body: [g({ transform: `translate(${x + 110} ${gy}) scale(${S})` }, ...page.body)], text: [g({ transform: `translate(${x + 110} ${gy}) scale(${S})` }, ...page.text)] }))(
        L.sheet({ x: 112, y: -166, width: 110, height: 132, top: 26, step: 30, rows: [{ lead: "question", bar: 30, tail: "check" }, { lead: "question", bar: 22, tail: "check" }, { lead: "question", bar: 34, tail: "check" }] })),
    ] },
    { label: "done + emote 'worked' · facing left", w: EMOTE_TILE, draw: (x, gy, surface) => {
      const at = { x: x + EMOTE_TILE / 2 + 30, y: gy };
      return [L.balao({ ...at, scale: S, surface, expression: "done", facing: "left" }), L.emote({ kind: "worked", ...spot(at.x, at.y, S, "left"), scale: S, surface })];
    } },
    { label: "speaks · dark", w: TILE, surface: "dark", draw: (x, gy, surface) => [L.balao({ x: x + TILE / 2 - 6, y: gy, scale: S, surface, speaks: true })] },
  ],
]);

const screen = (x: number, gy: number, facing: Facing): Drawn => {
  // The laptop's screen is a codePanel the scene places above the keyboard (design §4), low enough to clear the emote spot (design §8); one accent line is the command.
  const panelX = facing === "right" ? 106 : -238;
  const panel = L.codePanel({ x: panelX, y: -148, width: 132, height: 62, top: 20, step: 20, lines: [{ indent: 0, w: 84, color: "white" }, { indent: 0, w: 40, color: "white", tall: true }] });
  return { body: [g({ transform: `translate(${x} ${gy}) scale(${S})` }, ...panel.body)], text: [] };
};
const SHEET = { width: 150, height: 104, top: 30, step: 34, rows: [{ lead: "question" as const, bar: 50 }, { lead: "question" as const, bar: 36 }], label: "proposal.md" };
const chavesPanel = characterPanel("chaves", "Chaves · the developer", [
  [
    { label: "types at the keyboard · facing right", w: W3, draw: (x, gy, surface) => [screen(x + 100, gy, "right"), L.chaves({ x: x + 100, y: gy, scale: S, surface, types: true })] },
    { label: "types at the keyboard · facing left", w: W3, draw: (x, gy, surface) => [screen(x + W3 - 100, gy, "left"), L.chaves({ x: x + W3 - 100, y: gy, scale: S, surface, types: true, facing: "left" })] },
    { label: "points · facing right", w: TILE, draw: (x, gy, surface) => [L.chaves({ x: x + TILE / 2 - 10, y: gy, scale: S, surface, points: true })] },
    { label: "points · facing left", w: TILE, draw: (x, gy, surface) => [L.chaves({ x: x + TILE / 2 + 10, y: gy, scale: S, surface, points: true, facing: "left" })] },
  ],
  [
    { label: "hands a sheet over · facing right", w: W3, draw: (x, gy, surface) => [L.chaves({ x: x + 100, y: gy, scale: S, surface, holdsSheet: SHEET })] },
    { label: "hands a sheet over · facing left", w: W3, draw: (x, gy, surface) => [L.chaves({ x: x + W3 - 100, y: gy, scale: S, surface, holdsSheet: SHEET, facing: "left" })] },
    { label: "types · dark", w: W3, surface: "dark", draw: (x, gy, surface) => [screen(x + 100, gy, "right"), L.chaves({ x: x + 100, y: gy, scale: S, surface, types: true, expression: "waiting" })] },
    { label: "done + emote 'worked' · facing left", w: EMOTE_TILE, draw: (x, gy, surface) => {
      const at = { x: x + EMOTE_TILE / 2 + 30, y: gy };
      return [L.chaves({ ...at, scale: S, surface, expression: "done", facing: "left" }), L.emote({ kind: "worked", ...spot(at.x, at.y, S, "left"), scale: S, surface })];
    } },
  ],
]);

const CAST_NAMES = ["Mira", "Visor", "Balão (new)", "Chaves (new)", "Drone", "Kiu", "Sinal"];
/** Each character's centre along the row, at scale 1. */
const CAST_X = [90, 300, 550, 810, 1040, 1270, 1420];
/** The seven characters at one scale on one ground line (CAST-5); Drone flies, its body's bottom 40 above the line. */
const castRow = (surface: Surface, x0: number, gy: number, scale: number): Drawn[] => {
  const at = (dx: number) => x0 + dx * scale;
  return [
    L.mira({ x: at(CAST_X[0]), y: gy, scale, surface }),
    L.visor({ x: at(CAST_X[1]), y: gy, scale, surface }),
    L.balao({ x: at(CAST_X[2]), y: gy, scale, surface }),
    L.chaves({ x: at(CAST_X[3]), y: gy, scale, surface }),
    L.drone({ x: at(CAST_X[4]), y: gy - 40 * scale, scale, surface }),
    // Kiu's head is 70 to the right of its anchor, its segments to the left.
    L.kiu({ x: at(CAST_X[5] - 70), y: gy, scale, surface }),
    L.sinal({ x: at(CAST_X[6]), y: gy, scale, surface }),
  ];
};
const castPanel = (surface: Surface): Panel => {
  const width = 1540, height = 320, gy = 262;
  const names = CAST_NAMES.map((name, i) => text(20 + CAST_X[i], 40, name, 16, 700, surface === "light" ? T.color.ink : T.surface.dark.text));
  const parts = castRow(surface, 20, gy, 1);
  return {
    name: `cast-row-${surface}`, width, height,
    node: g({},
      el("rect", { width, height, fill: ground(surface) }),
      el("path", { d: `M24 ${gy + 2} H${width - 24}`, stroke: surface === "light" ? T.illustration.textBar : T.surface.dark.grid, "stroke-width": 2 }),
      g({ stroke: line(surface), "stroke-width": T.outline.block, "stroke-linejoin": "round" }, ...parts.flatMap((part) => part.body)),
      ...names),
    title: `The cast at one scale (${surface})`, desc: "",
  };
};

/** The cast row drawn at scale 1 and shown so that Balão, the tallest, is `px` tall. */
const BALAO_HEIGHT = 170;
const smallPanel = (): Panel => {
  const width = 1540, height = 210;
  const rowAt = (px: number, surface: Surface, x: number, y: number) => {
    const k = px / BALAO_HEIGHT;
    const parts = castRow(surface, 0, 0, 1);
    return g({ transform: `translate(${x} ${y}) scale(${k})` }, g({ stroke: line(surface), "stroke-width": T.outline.block, "stroke-linejoin": "round" }, ...parts.flatMap((part) => part.body)));
  };
  return {
    name: "small-sizes", width, height,
    node: g({},
      el("rect", { width, height, fill: T.color.white }),
      el("rect", { x: 20, y: 20, width: 740, height: 170, rx: 14, fill: ground("light") }),
      el("rect", { x: 780, y: 20, width: 740, height: 170, rx: 14, fill: ground("dark") }),
      rowAt(48, "light", 60, 92), rowAt(24, "light", 60, 160),
      rowAt(48, "dark", 820, 92), rowAt(24, "dark", 820, 160),
      text(40, 52, "48 px", 13, 700, T.brand.light.textMuted, "start"), text(40, 124, "24 px", 13, 700, T.brand.light.textMuted, "start"),
      text(800, 52, "48 px", 13, 700, T.surface.dark.muted, "start"), text(800, 124, "24 px", 13, 700, T.surface.dark.muted, "start")),
    title: "The cast at 48 and 24 px", desc: "",
  };
};

const SHEET_TITLE = "Balão and Chaves: model sheet";
const SHEET_DESC = "The supporting characters of the brunosouzas.com cast, Balão (the requester and approver) and Chaves (the developer): front and back, expressions, actions, size against the cast, and at 48 and 24 px.";

const write = async (name: string, width: number, height: number, body: SvgNode, title: string, desc: string): Promise<void> => {
  const tree = el("svg", { xmlns: "http://www.w3.org/2000/svg", width, height, viewBox: `0 0 ${width} ${height}`, role: "img", "aria-labelledby": `${name}-title` },
    el("title", { id: `${name}-title` }, title), el("desc", {}, desc), body);
  writeFileSync(join(outDir, `${name}.svg`), `${toSvg(await embedFonts(tree))}\n`);
  console.log(`wrote ${join(outDir, `${name}.svg`)}`);
};

const panels: Panel[] = [balaoPanel, chavesPanel, castPanel("light"), castPanel("dark"), smallPanel()];
const descs: Record<string, string> = {
  balao: "Balão: front and back on light and dark, the silhouette, the four expressions, an emote at its spot, speaking and holding the stamp facing right and left, and a sheet placed beside it.",
  chaves: "Chaves: front and back on light and dark, the silhouette, the four expressions, an emote at its spot, typing at the keyboard under a code panel, pointing and handing a sheet over, facing right and left.",
  "cast-row-light": "Mira, Visor, Balão, Chaves, Drone, Kiu and Sinal at one scale on one ground line, on the light surface.",
  "cast-row-dark": "Mira, Visor, Balão, Chaves, Drone, Kiu and Sinal at one scale on one ground line, on the dark surface.",
  "small-sizes": "The seven characters shown with Balão 48 and 24 pixels tall, on light and dark.",
};
for (const panel of panels) await write(panel.name, panel.width, panel.height, panel.node, panel.title, descs[panel.name]);

// The whole sheet: a heading, then every panel stacked.
{
  const width = Math.max(...panels.map((panel) => panel.width)) + 40;
  let y = 96;
  const placed: SvgNode[] = [];
  for (const panel of panels) {
    placed.push(g({ transform: `translate(20 ${y})` }, panel.node));
    y += panel.height + 24;
  }
  const height = y;
  await write("model-sheet", width, height,
    g({},
      el("rect", { width, height, fill: T.color.white }),
      text(40, 48, SHEET_TITLE, 30, 700, T.color.ink, "start"),
      text(40, 76, "Change supporting-characters (AB#337), drawn from the built pieces: balao, chaves and keyboard beside the pillar cast.", 16, 400, T.brand.light.textMuted, "start"),
      ...placed),
    SHEET_TITLE, SHEET_DESC);
}

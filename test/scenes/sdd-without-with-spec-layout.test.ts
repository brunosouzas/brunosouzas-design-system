// The SDD scene's layout, stage trees and files (spec scene-catalogue: "SDD
// layout and layers", "SDD words on screen", "SDD final still", "SDD cast
// rules", "SDD built from package pieces", "SDD take 2, the questions written
// down" (the hand-over); change sdd-without-with-spec-scene, tasks 4.3 and
// 4.4). Geometry is read from the piece trees stageAt returns, with their
// transforms applied, so a test checks what the frame draws, not a copy of it.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { pointAlong, type Point } from "../../src/brand/motion";
import type { SvgNode } from "../../src/pieces/node.ts";
import {
  ANCHORS, ANSWER_START, BADGE, BALLOON, CAST_SCALE, CODE_LINE_SHAPES, CODE_PANEL, EMOTES, FAILURE_ARROW, PAGE, PAGE_HELD, PAGE_REST, PATHS,
  QUESTION_BARS, REWIND_MARK, RINGS_CENTRE, ROUTES, STAMP, VISOR, rowMarkAt, slotAt,
} from "../../src/scenes/sdd-without-with-spec/layout";
import { text } from "../../src/scenes/sdd-without-with-spec/scene.ts";
import { PIECE_ORDER, stageAt, visorParams } from "../../src/scenes/sdd-without-with-spec/stage";
import { frameAt } from "../../src/scenes/sdd-without-with-spec/takes";
import { timeline } from "../../src/scenes/sdd-without-with-spec/timeline";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const SCENE_DIR = join(repoRoot, "src/scenes/sdd-without-with-spec");
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

// ---------------------------------------------------------------- tree geometry

type Matrix = [number, number, number, number, number, number]; // a b c d e f
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];
const multiply = (m: Matrix, n: Matrix): Matrix => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];
/** The matrix of an SVG transform made of translate, scale and rotate (the forms the pieces and pose write). */
const parseTransform = (value: string | number | undefined): Matrix => {
  let m = IDENTITY;
  for (const [, name, args] of String(value ?? "").matchAll(/(translate|scale|rotate)\(([^)]*)\)/g)) {
    const v = args.split(/[\s,]+/).filter(Boolean).map(Number);
    if (name === "translate") m = multiply(m, [1, 0, 0, 1, v[0], v[1] ?? 0]);
    else if (name === "scale") m = multiply(m, [v[0], 0, 0, v[1] ?? v[0], 0, 0]);
    else {
      const r = (v[0] * Math.PI) / 180, [cx, cy] = [v[1] ?? 0, v[2] ?? 0];
      m = multiply(m, [1, 0, 0, 1, cx, cy]);
      m = multiply(m, [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0]);
      m = multiply(m, [1, 0, 0, 1, -cx, -cy]);
    }
  }
  return m;
};
const apply = (m: Matrix, p: Point): Point => ({ x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5] });
type Box = { x0: number; y0: number; x1: number; y1: number };
const boxOf = (points: Point[]): Box => ({
  x0: Math.min(...points.map((p) => p.x)), y0: Math.min(...points.map((p) => p.y)),
  x1: Math.max(...points.map((p) => p.x)), y1: Math.max(...points.map((p) => p.y)),
});
const pad = (b: Box, d: number): Box => ({ x0: b.x0 - d, y0: b.y0 - d, x1: b.x1 + d, y1: b.y1 + d });
const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
const discTouchesBox = (c: Point, r: number, b: Box) => Math.hypot(c.x - Math.max(b.x0, Math.min(c.x, b.x1)), c.y - Math.max(b.y0, Math.min(c.y, b.y1))) < r;

/** Every node with its accumulated transform, depth first. */
const walk = (node: SvgNode, m: Matrix = IDENTITY, out: { node: SvgNode; m: Matrix }[] = []) => {
  const here = multiply(m, parseTransform(node.attrs.transform));
  out.push({ node, m: here });
  for (const child of node.children) if (typeof child !== "string") walk(child, here, out);
  return out;
};
const textOf = (node: SvgNode): string => node.children.map((c) => (typeof c === "string" ? c : textOf(c))).join("");
/** The words a tree draws: every text node's content. */
const words = (node: SvgNode): string[] => walk(node).filter(({ node: n }) => n.tag === "text").map(({ node: n }) => textOf(n));
const frameWords = (f: number) => { const s = stageAt(f); return [...words(s.pieces), ...words(s.tokens), ...words(s.emote)]; };

/** The points a shape covers (its box corners), in absolute stage units. */
const shapePoints = (node: SvgNode, m: Matrix): Point[] => {
  const a = node.attrs;
  const num = (k: string) => Number(a[k]);
  if (node.tag === "rect") return [[0, 0], [1, 0], [0, 1], [1, 1]].map(([i, j]) => apply(m, { x: num("x") + i * num("width"), y: num("y") + j * num("height") }));
  if (node.tag === "circle") return [[-1, 0], [1, 0], [0, -1], [0, 1]].map(([i, j]) => apply(m, { x: num("cx") + i * num("r"), y: num("cy") + j * num("r") }));
  if (node.tag === "path") {
    const points: Point[] = [];
    let current: Point = { x: 0, y: 0 };
    for (const [, cmd, args] of String(a.d).matchAll(/([MLHVCQZ])([^MLHVCQZ]*)/gi)) {
      const v = (args.match(/-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []).map(Number);
      if (cmd === "H") current = { x: v[0], y: current.y };
      else if (cmd === "V") current = { x: current.x, y: v[0] };
      else for (let i = 0; i + 1 < v.length; i += 2) { current = { x: v[i], y: v[i + 1] }; points.push(apply(m, current)); }
      if (cmd === "H" || cmd === "V") points.push(apply(m, current));
    }
    return points;
  }
  return [];
};
/** The box of every shape under `node`, padded by half its stroke where it sets one. */
const drawnBox = (node: SvgNode, m: Matrix = IDENTITY): Box => {
  const boxes = walk(node, m)
    .filter(({ node: n }) => ["rect", "circle", "path"].includes(n.tag))
    .map(({ node: n, m: here }) => pad(boxOf(shapePoints(n, here)), (Number(n.attrs["stroke-width"] ?? 0) / 2) * Math.hypot(here[0], here[1])));
  return { x0: Math.min(...boxes.map((b) => b.x0)), y0: Math.min(...boxes.map((b) => b.y0)), x1: Math.max(...boxes.map((b) => b.x1)), y1: Math.max(...boxes.map((b) => b.y1)) };
};
const find = (node: SvgNode, attr: string, value?: string) =>
  walk(node).filter(({ node: n }) => n.attrs[attr] !== undefined && (value === undefined || n.attrs[attr] === value));

// ---------------------------------------------------------------- layout

/** Visor's screen face, upright (design §6, from `faceAt(-42, -128, 84, 52)` at scale 1.15). */
const face: Box = { x0: 431.7, y0: 292.8, x1: 528.3, y1: 352.6 };

describe("SDD layout and layers", () => {
  test("Layout equals the design", () => {
    // Design §6, transcribed by hand (stage units).
    expect(BALLOON).toEqual({ x: 50, y: 16, width: 280, height: 110 });
    expect([0, 1, 2, 3, 4, 5].map(slotAt)).toEqual([86, 128, 170, 212, 254, 296].map((x) => ({ x, y: 94 })));
    expect(CODE_PANEL).toEqual({ x: 690, y: 200, width: 210, height: 220, top: 34, step: 22 });
    expect(CODE_LINE_SHAPES).toEqual([[0, 90], [18, 120], [36, 80], [36, 110], [18, 70], [36, 100], [18, 60], [0, 40]].map(([indent, w]) => ({ indent, w })));
    expect(VISOR).toEqual({ x: 480, y: 440 });
    expect(CAST_SCALE).toBe(1.15);
    expect(PAGE).toEqual({ width: 150, height: 240, top: 24, step: 31 });
    expect(QUESTION_BARS).toEqual([44, 34, 50, 40, 46, 30]);
    expect(PAGE_HELD.x).toBeCloseTo(194.8, 9);
    expect(PAGE_HELD.y).toBeCloseTo(159.4, 9);
    expect(PAGE_REST).toEqual({ x: 100, y: 196 });
    [235.3, 270.95, 306.6, 342.25, 377.9, 413.55].forEach((y, i) => { expect(rowMarkAt(PAGE_HELD, i + 1).x).toBeCloseTo(229.3, 9); expect(rowMarkAt(PAGE_HELD, i + 1).y).toBeCloseTo(y, 9); });
    [271.9, 307.55, 343.2, 378.85, 414.5, 450.15].forEach((y, i) => { expect(rowMarkAt(PAGE_REST, i + 1).x).toBeCloseTo(134.5, 9); expect(rowMarkAt(PAGE_REST, i + 1).y).toBeCloseTo(y, 9); });
    expect(STAMP).toEqual({ cx: 189, cy: 432.3, r: 32 });
    expect(BADGE).toEqual({ cx: 918, cy: 42, textSize: 22 });
    expect(REWIND_MARK).toEqual({ x: 852, y: 24, size: 38 });
    expect(EMOTES).toEqual({ problem: { x: 335, y: 296, scale: 0.8 }, worked: { x: 340, y: 292, scale: 0.72 } });
    expect(ANSWER_START).toEqual({ x: 70, y: 180 });
    expect(RINGS_CENTRE).toEqual({ x: 960, y: 600 });
    expect(ANCHORS).toEqual({ codePanel: { x: 795, y: 310 }, badge: { x: 918, y: 42 }, balloon: { x: 190, y: 71 }, rewindMark: { x: 871, y: 43 }, stamp: { x: 189, y: 432.3 } });
    expect(PATHS).toEqual({ p1: "M 332,82 C 430,96 610,130 770,290", p2: "M 94,148 C 120,176 150,186 194,196", p3: "M 272,330 C 380,470 600,470 690,380" });
    expect(FAILURE_ARROW).toEqual({ from: [700, 206], to: [332, 72], controls: [[620, 90], [420, 70]], kind: "failure" });
    const heldY = [235.3, 270.95, 306.6, 342.25, 377.9, 413.55], restY = [271.9, 307.55, 343.2, 378.85, 414.5, 450.15];
    [86, 128, 170, 212, 254, 296].forEach((x, i) => {
      expect(ROUTES[`guess-${i}`]).toBe(`M ${x},94 C 430,96 610,130 770,290`);
      expect(ROUTES[`ask-${i}`]).toBe(`M ${x},94 C 40,96 120,${heldY[i]} 229.3,${heldY[i]}`);
      expect(ROUTES[`answer-${i}`]).toBe(`M 70,180 C 62,${Math.round((restY[i] - 40) * 1000) / 1000} 80,${restY[i]} 134.5,${restY[i]}`);
    });
  });

  test("Layer order", () => {
    // Layer 3, bottom to top, at every frame: the drawn elements follow design §6's order.
    expect(PIECE_ORDER).toEqual(["failureArrow", "balloon", "codePanel", "page", "visor", "stamp", "badge", "rewindMark"]);
    const order = (f: number) => [...new Set(find(stageAt(f).pieces, "data-element").map(({ node }) => String(node.attrs["data-element"])))];
    for (let f = 0; f < 780; f++) {
      const indexes = order(f).map((name) => PIECE_ORDER.indexOf(name as (typeof PIECE_ORDER)[number]));
      expect(indexes, `frame ${f}`).toEqual([...indexes].sort((a, b) => a - b));
      expect(indexes, `frame ${f}`).not.toContain(-1);
    }
    expect(order(245)).toEqual(["failureArrow", "balloon", "codePanel", "visor", "badge"]);
    expect(order(600)).toEqual(["balloon", "codePanel", "page", "visor", "stamp", "badge"]);
    // The composition's layers (design §6): rings, paths, pieces, `?`, answers, emote.
    const source = readFileSync(join(SCENE_DIR, "Scene.tsx"), "utf8");
    const jsx = source.slice(source.indexOf("<AbsoluteFill"));
    const positions = ["<Rings", "<MotionPath", "node={stage.pieces}", "node={stage.tokens}", "<PositionedToken", "node={stage.emote}"].map((mark) => jsx.indexOf(mark));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  const pillAt = (page: Point): Box => ({ x0: page.x, y0: page.y - (36 * CAST_SCALE) / 2, x1: page.x + PAGE.width * CAST_SCALE, y1: page.y + (36 * CAST_SCALE) / 2 });
  /** Drawn outer radii: a `?` is the sheet mark (13) at the cast's scale plus half its outline; an answer is radius 17 plus half its 4-unit outline. */
  const QUESTION_R = 13 * CAST_SCALE + (3 * CAST_SCALE) / 2;
  const ANSWER_R = 17 + 2;
  /** Distance from `p` to the label pill drawn as what it is, a stadium (rx = half its height), with half its outline. */
  const pillGap = (p: Point, pill: Box) => {
    const r = (pill.y1 - pill.y0) / 2, cy = (pill.y0 + pill.y1) / 2;
    const x = Math.max(pill.x0 + r, Math.min(p.x, pill.x1 - r));
    return Math.hypot(p.x - x, p.y - cy) - r - (4 * CAST_SCALE) / 2;
  };

  test("Tokens clear the face and the label", () => {
    for (const [id, route] of Object.entries(ROUTES)) {
      const radius = id.startsWith("answer") ? ANSWER_R : QUESTION_R;
      const pill = id.startsWith("ask") ? pillAt(PAGE_HELD) : id.startsWith("answer") ? pillAt(PAGE_REST) : null;
      for (let step = 0; step <= 100; step++) {
        const p = pointAlong(route, step / 100)!;
        expect(discTouchesBox(p, radius, face), `${id} at ${step}% touches the face`).toBe(false);
        if (pill) expect(pillGap(p, pill), `${id} at ${step}% touches the label`).toBeGreaterThan(radius);
      }
    }
    // Frame by frame, no travelling token touches a `?` still waiting in a slot (both with their outlines).
    for (let f = 0; f < 780; f++) {
      const s = frameAt(f);
      for (const q of [...s.questions, ...s.answers]) s.slots.forEach((slot, i) => {
        if (slot === null) return;
        const r = q.id.startsWith("answer") ? ANSWER_R : QUESTION_R;
        expect(Math.hypot(q.point.x - slotAt(i).x, q.point.y - slotAt(i).y), `${q.id} over slot ${i} at ${f}`).toBeGreaterThan(r + QUESTION_R);
      });
    }
  });

  test("Label and stamp clearances", () => {
    // Shapes with their outlines: the balloon (outline.block 4), the pills (4 × 1.15), marks and checks (3 × 1.15).
    const balloon = pad({ x0: BALLOON.x, y0: BALLOON.y, x1: BALLOON.x + BALLOON.width, y1: BALLOON.y + BALLOON.height }, 2);
    const tail: Box = pad({ x0: 70, y0: BALLOON.y + BALLOON.height, x1: 94, y1: BALLOON.y + BALLOON.height + 20 }, 2);
    expect(BALLOON.y + BALLOON.height).toBe(126);
    for (const page of [PAGE_HELD, PAGE_REST]) {
      const pill = pad(pillAt(page), 2.3);
      expect(overlaps(pill, balloon), `pill at ${page.x}`).toBe(false);
      expect(overlaps(pill, tail), `pill at ${page.x}`).toBe(false);
    }
    const stampR = STAMP.r + 2;
    for (let k = 1; k <= 6; k++) {
      const mark = rowMarkAt(PAGE_REST, k);
      expect(Math.hypot(mark.x - STAMP.cx, mark.y - STAMP.cy), `mark ${k}`).toBeGreaterThan(stampR + 13 * CAST_SCALE + 1.725);
      const check = pad({ x0: 226.5, y0: mark.y - 11 * CAST_SCALE, x1: 251.8, y1: mark.y + 11 * CAST_SCALE }, 1.725);
      expect(discTouchesBox({ x: STAMP.cx, y: STAMP.cy }, stampR, check), `check ${k}`).toBe(false);
    }
  });

  test("The error reaches the balloon; the answers start outside it", () => {
    // "Arrow boundaries": at 250 the failure arrow's head is at the balloon's right edge (its outline included).
    const arrow = walk(stageAt(250).pieces).find(({ node }) => node.attrs["data-element"] === "failureArrow")!;
    const head = walk(arrow.node, arrow.m).find(({ node }) => node.tag === "polygon")!;
    const tip = String(head.node.attrs.points).split(" ")[0].split(",").map(Number);
    expect({ x: tip[0], y: tip[1] }).toEqual({ x: FAILURE_ARROW.to[0], y: FAILURE_ARROW.to[1] });
    expect(tip[0]).toBe(BALLOON.x + BALLOON.width + 2);
    expect(tip[1]).toBeGreaterThan(BALLOON.y);
    expect(tip[1]).toBeLessThan(BALLOON.y + BALLOON.height);
    // "First answer": at 512 the answer disc (radius 17 plus half its outline) clears the balloon and its tail tip.
    const answer = frameAt(512).answers[0].point;
    const balloon = pad({ x0: BALLOON.x, y0: BALLOON.y, x1: BALLOON.x + BALLOON.width, y1: BALLOON.y + BALLOON.height }, 2);
    expect(discTouchesBox(answer, 19, balloon)).toBe(false);
    expect(Math.hypot(answer.x - 70, answer.y - (BALLOON.y + BALLOON.height + 20))).toBeGreaterThan(19 + 2);
  });

  test("Row marks clear each other", () => {
    for (let k = 1; k < 6; k++) {
      const gap = rowMarkAt(PAGE_REST, k + 1).y - rowMarkAt(PAGE_REST, k).y;
      expect(gap, `marks ${k}, ${k + 1}`).toBeGreaterThan(2 * (13 * CAST_SCALE + 1.725));
      expect(gap, `checks ${k}, ${k + 1}`).toBeGreaterThan(22 * CAST_SCALE + 3.45);
    }
  });
});

// ---------------------------------------------------------------- hand-over

describe("SDD take 2, the hand-over", () => {
  /** Page, marks, bars, pill and words of the page in a stage tree, in absolute stage units. */
  const pageGeometry = (f: number) => {
    const s = stageAt(f);
    const nodes = walk(s.pieces);
    const held = nodes.find(({ node }) => node.attrs["data-held"] === "sheet");
    const loose = nodes.find(({ node }) => node.attrs["data-page"] === "proposal.md");
    const root = held ?? loose!;
    const shapes = walk(root.node, multiply(root.m, invert(parseTransform(root.node.attrs.transform))))
      .filter(({ node }) => ["rect", "circle"].includes(node.tag))
      .map(({ node, m }) => ({ tag: node.tag, box: boxOf(shapePoints(node, m)) }));
    const textNodes = nodes.filter(({ node }) => node.tag === "text").map(({ node, m }) => ({ word: textOf(node), at: apply(m, { x: Number(node.attrs.x), y: Number(node.attrs.y) }) }));
    return { held: held !== undefined, shapes, words: textNodes };
  };
  const invert = (m: Matrix): Matrix => {
    const det = m[0] * m[3] - m[1] * m[2];
    return [m[3] / det, -m[1] / det, -m[2] / det, m[0] / det, (m[2] * m[5] - m[3] * m[4]) / det, (m[1] * m[4] - m[0] * m[5]) / det];
  };
  const round = (b: Box) => [b.x0, b.y0, b.x1, b.y1].map((v) => Math.round(v * 1e6) / 1e6);

  test("Seamless hand-over", () => {
    const before = pageGeometry(479), after = pageGeometry(480);
    expect(before.held).toBe(true);
    expect(after.held).toBe(false);
    expect(after.shapes.map((s) => [s.tag, ...round(s.box)])).toEqual(before.shapes.map((s) => [s.tag, ...round(s.box)]));
    const norm = (w: { word: string; at: Point }[]) => w.filter((x) => x.word !== "2").map((x) => [x.word, Math.round(x.at.x * 1e6) / 1e6, Math.round(x.at.y * 1e6) / 1e6]);
    expect(norm(after.words)).toEqual(norm(before.words));
    expect(norm(after.words).map((w) => w[0])).toEqual(["?", "?", "?", "?", "?", "?", "proposal.md"]);
    // The same outline: the held sheet's group and the page's stroke group carry the same stroke, width and join.
    const strokeOf = (f: number, attr: string) => {
      const nodes = walk(stageAt(f).pieces);
      const root = nodes.find(({ node }) => node.attrs[attr] !== undefined)!.node;
      const group = attr === "data-held" ? root : (root.children[0] as SvgNode);
      return { stroke: group.attrs.stroke, width: group.attrs["stroke-width"], join: group.attrs["stroke-linejoin"] };
    };
    expect(strokeOf(480, "data-page")).toEqual(strokeOf(479, "data-held"));
    // Every node under the two roots draws with the same paint, in the same order, and every path lands in the same place.
    const paint = (f: number, attr: string) => {
      const nodes = walk(stageAt(f).pieces);
      const found = nodes.find(({ node }) => node.attrs[attr] !== undefined)!;
      const root = attr === "data-held" ? found.node : (found.node.children[0] as SvgNode);
      const m = attr === "data-held" ? found.m : multiply(found.m, parseTransform(undefined));
      return walk(root, attr === "data-held" ? multiply(found.m, invert(parseTransform(root.attrs.transform))) : m).slice(1).map(({ node, m: here }) => {
        const { x: _x, y: _y, width: _w, height: _h, cx: _cx, cy: _cy, d: _d, transform: _t, ...rest } = node.attrs;
        return { tag: node.tag, ...rest, ...(node.tag === "path" ? { at: boxOf(shapePoints(node, here)) } : {}) };
      });
    };
    const roundDeep = (v: unknown): unknown => JSON.parse(JSON.stringify(v, (_k, x) => (typeof x === "number" ? Math.round(x * 1e6) / 1e6 : x)));
    expect(roundDeep(paint(480, "data-page"))).toEqual(roundDeep(paint(479, "data-held")));
    for (let f = 480; f < 780; f++) expect(find(stageAt(f).pieces, "data-held").length, `frame ${f}`).toBe(0);
    expect(frameAt(491).page!.at.x).toBeCloseTo(147.4, 9);
    expect(frameAt(491).page!.at.y).toBeCloseTo(177.7, 9);
    for (const f of [502, 600, 779]) expect(frameAt(f).page!.at).toEqual(PAGE_REST);
  });
});

// ---------------------------------------------------------------- cast

describe("SDD cast rules", () => {
  test("Emote beside the head", () => {
    const restingPage: Box = { x0: PAGE_REST.x, y0: PAGE_REST.y - 20.7, x1: PAGE_REST.x + PAGE.width * CAST_SCALE, y1: PAGE_REST.y + PAGE.height * CAST_SCALE };
    let checked = 0;
    for (let f = 0; f < 780; f++) {
      const s = frameAt(f);
      if (s.emote === null) continue;
      checked++;
      const tree = stageAt(f);
      const emoteBox = drawnBox(tree.emote);
      const v = s.visor!;
      const posed = parseTransform(`translate(${VISOR.x} ${VISOR.y}) rotate(${v.tilt}) scale(${1 / Math.sqrt(v.squash)} ${v.squash}) translate(${-VISOR.x} ${-VISOR.y})`);
      const faceBox = boxOf([[face.x0, face.y0], [face.x1, face.y0], [face.x0, face.y1], [face.x1, face.y1]].map(([x, y]) => apply(posed, { x, y })));
      expect(overlaps(emoteBox, faceBox), `emote over the face at ${f}`).toBe(false);
      if (s.emote.kind === "worked") expect(overlaps(emoteBox, restingPage), `worked over the page at ${f}`).toBe(false);
    }
    expect(checked).toBe(59 + 119);
  });

  test("The held sheet's rows", () => {
    // "Sheet appears with its heading" and "Questions become rows", on what Visor draws.
    const rows = (f: number) => visorParams(frameAt(f).visor!).holdsSheet?.rows;
    expect(rows(389)).toBeUndefined();
    expect(rows(390)).toEqual([{ lead: "none", bar: 90 }]);
    expect(visorParams(frameAt(390).visor!).holdsSheet?.label).toBe("proposal.md");
    expect(rows(476)).toHaveLength(7);
    expect(rows(476)!.slice(1).every((row) => row.lead === "question" && row.tail === "none")).toBe(true);
    const tree = (f: number) => walk(stageAt(f).pieces).filter(({ node }) => node.attrs["data-held"] === "sheet");
    expect(tree(389)).toHaveLength(0);
    expect(tree(390)).toHaveLength(1);
  });

  test("One character, same skin", () => {
    for (const f of [89, 239, 309, 377, 450, 509, 599, 689, 779]) {
      const cast = find(stageAt(f).pieces, "data-piece").filter(({ node }) => ["mira", "visor", "drone", "kiu", "sinal"].includes(String(node.attrs["data-piece"])));
      expect(cast.map(({ node }) => node.attrs["data-piece"]), `frame ${f}`).toEqual(["visor"]);
      expect(String(cast[0].node.attrs.transform)).toBe("translate(480 440) scale(1.15)");
      const params = visorParams(frameAt(f).visor!);
      expect(params).toMatchObject({ x: 480, y: 440, scale: 1.15 });
      expect(Object.keys(params).filter((k) => !["x", "y", "scale", "expression", "points", "holdsSheet"].includes(k))).toEqual([]);
      expect("surface" in params).toBe(false); // the default, light
    }
  });
});

// ---------------------------------------------------------------- words

describe("SDD words on screen", () => {
  const ALLOWED = ["proposal.md", "GO", "?", "1", "2"];

  test("Words over the whole composition", () => {
    const union = new Set<string>();
    for (let f = 0; f < 780; f++) for (const w of frameWords(f)) {
      expect(ALLOWED, `frame ${f}`).toContain(w);
      union.add(w);
      if (w === "?") expect(w).toBe(text.en.question);
    }
    expect([...union].sort()).toEqual([...ALLOWED].sort());
  });

  test("Words at their boundaries", () => {
    expect(frameWords(18)).toEqual([]);
    for (let f = 19; f <= 377; f++) expect(frameWords(f), `frame ${f}`).toContain("1");
    expect(frameWords(378)).not.toContain("1");
    expect(frameWords(378)).not.toContain("2");
    for (let f = 379; f < 780; f++) { expect(frameWords(f), `frame ${f}`).toContain("2"); expect(frameWords(f), `frame ${f}`).not.toContain("1"); }
    for (let f = 0; f < 390; f++) expect(frameWords(f), `frame ${f}`).not.toContain("proposal.md");
    expect(frameWords(390)).toContain("proposal.md");
    expect(frameWords(584)).not.toContain("GO");
    expect(frameWords(585)).toContain("GO");
    for (let f = 0; f < 585; f++) expect(frameWords(f), `frame ${f}`).not.toContain("GO");
  });
});

describe("SDD final still", () => {
  test("Final hold identical", () => {
    // The rings fade from the real frame (`Rings`); they are settled long before the outro.
    expect(timeline.ringsFade[1]).toBeLessThan(timeline.outro);
    const layers = (f: number) => {
      const s = frameAt(f);
      return { stage: stageAt(f), paths: s.paths, answers: s.answers };
    };
    const last = layers(timeline.outro);
    for (let f = timeline.outro; f < timeline.duration; f++) expect(layers(f), `frame ${f}`).toEqual(last);
  });
});

// ---------------------------------------------------------------- files

describe("SDD built from package pieces", () => {
  test("No shape of its own", () => {
    const files = readdirSync(SCENE_DIR);
    expect(files.sort()).toEqual(["Scene.tsx", "layout.ts", "scene.ts", "stage.ts", "takes.ts", "timeline.ts"]);
    for (const name of files) {
      const source = readFileSync(join(SCENE_DIR, name), "utf8");
      expect(source, name).not.toMatch(/\bel\(\s*["'](path|rect|circle|ellipse|line|polygon|polyline)["']/);
      expect(source, name).not.toMatch(/<(path|rect|circle|ellipse|line|polygon|polyline)[\s/>]/);
    }
  });

  test("Registered entry: src/Root.tsx maps the scene", () => {
    const root = readFileSync(join(repoRoot, "src/Root.tsx"), "utf8");
    expect(root).toContain('import { SddWithoutWithSpecScene } from "./scenes/sdd-without-with-spec/Scene.tsx";');
    expect(root).toMatch(/"sdd-without-with-spec": SddWithoutWithSpecScene/);
  });
});

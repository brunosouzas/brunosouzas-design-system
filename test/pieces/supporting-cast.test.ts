// Unit tests of the supporting cast, `balao` and `chaves` (spec
// illustration-pieces: "Balão", "Balão parameters", "Chaves", "Chaves's
// silhouette", "Chaves parameters", "Supporting characters face left or
// right", "Supporting cast follows the cast rules", "Emote spot beside the
// head"; change supporting-characters, tasks 3.2 to 3.4b). Each test title is
// the spec scenario it proves.
import { describe, expect, test } from "vitest";
// The exported names of design §1, from the root entry (the package's `.` export): typecheck proves them.
import {
  CAST_EXPRESSIONS,
  CAST_FACINGS,
  PIECES,
  balao,
  chaves,
  keyboard,
  pill,
  pose,
  sheet,
  stamp,
  type BalaoParams,
  type CastFacing,
  type ChavesParams,
  type HeldSheet,
  type KeyboardParams,
  type VisorHeldSheet,
} from "../../src/pieces/index.ts";
import { faceAt, peak, pointingHand } from "../../src/pieces/brand-cast.ts";
import type { Drawn, SvgNode } from "../../src/pieces/node.ts";
import { skin } from "../../src/pieces/skin.ts";
import { tokens } from "../../tokens/generated/tokens.ts";

const kids = (node: SvgNode): SvgNode[] => node.children.filter((child): child is SvgNode => typeof child !== "string");
const nodesOf = (nodes: readonly SvgNode[]): SvgNode[] => nodes.flatMap((node) => [node, ...nodesOf(kids(node))]);
const plain = (value: unknown) => JSON.parse(JSON.stringify(value));
const callBalao = (params: Record<string, unknown>) => (balao as unknown as (p: Record<string, unknown>) => Drawn)(params);
const callChaves = (params: Record<string, unknown>) => (chaves as unknown as (p: Record<string, unknown>) => Drawn)(params);
/** The root group's children: the held prop's group (if any), then the body group. */
const rootKids = (drawn: Drawn) => kids(drawn.body[0]);
const bodyGroup = (drawn: Drawn) => rootKids(drawn).at(-1)!;
const stringsOf = (nodes: readonly SvgNode[]): string[] => nodesOf(nodes).flatMap((node) => node.children.filter((c): c is string => typeof c === "string"));
const circleAt = (nodes: readonly SvgNode[], cx: number, cy: number) => nodes.filter((node) => node.tag === "circle" && node.attrs.cx === cx && node.attrs.cy === cy && node.attrs.r === 15);

const LIGHT = skin("light");
const BALAO_BODY = "M-62 -132 Q-62 -162 -32 -162 H32 Q62 -162 62 -132 V-104 L94 -76 L56 -70 Q48 -60 32 -60 H-32 Q-62 -60 -62 -88 Z";
const CHAVES_BODY = "M-30 -150 H30 Q54 -150 54 -128 Q54 -112 44 -108 Q60 -96 90 -88 Q60 -80 44 -68 Q54 -64 54 -48 Q54 -26 30 -26 H-30 Q-54 -26 -54 -48 Q-54 -64 -44 -68 Q-60 -80 -90 -88 Q-60 -96 -44 -108 Q-54 -112 -54 -128 Q-54 -150 -30 -150 Z";
const BALAO_TIP_BACK = "M-28 -162 Q0 -170 28 -162 Q0 -154 -28 -162 Z";
const CHAVES_TIP_BACK = "M-28 -150 Q0 -158 28 -150 Q0 -142 -28 -150 Z";
const SHEET: HeldSheet = { width: 150, height: 160, rows: [{ lead: "question", bar: 40 }], label: "proposal.md" };

type Segment = { from: [number, number]; controls: [number, number][]; to: [number, number] };
/** The segments of an absolute path of M, L, H, V, Q and Z commands (the only ones these bodies use). */
const segmentsOf = (d: string): Segment[] => {
  const tokensOf = d.match(/[MLHVQZ]|-?\d+(?:\.\d+)?/g)!;
  const out: Segment[] = [];
  let at: [number, number] = [0, 0], start: [number, number] = [0, 0], i = 0;
  const num = () => Number(tokensOf[i++]);
  while (i < tokensOf.length) {
    const command = tokensOf[i++];
    if (command === "M") { at = [num(), num()]; start = at; continue; }
    let to: [number, number], controls: [number, number][] = [];
    if (command === "L") to = [num(), num()];
    else if (command === "H") to = [num(), at[1]];
    else if (command === "V") to = [at[0], num()];
    else if (command === "Q") { controls = [[num(), num()]]; to = [num(), num()]; }
    else to = start;
    out.push({ from: at, controls, to });
    at = to;
  }
  return out;
};
const endPoints = (d: string) => segmentsOf(d).map((segment) => segment.to);
const has = (points: [number, number][], [x, y]: [number, number]) => points.some(([px, py]) => px === x && py === y);

describe("Balão", () => {
  test("Balão at rest", () => {
    const { body, text } = balao({ x: 100, y: 300 });
    expect(body).toHaveLength(1);
    expect(body[0].tag).toBe("g");
    expect(body[0].attrs).toEqual({ "data-piece": "balao", transform: "translate(100 300) scale(1)", stroke: "none" });
    expect(kids(body[0])).toHaveLength(1);
    const group = kids(body[0])[0];
    expect(group.attrs).toEqual({});
    const parts = kids(group);
    expect(parts.map((node) => node.tag)).toEqual(["path", "rect", "rect", "path", "g", "rect", "path", "circle", "circle"]);
    expect(parts[0].attrs).toEqual({ d: "M-20 -62 L-28 0 M20 -62 L28 0", stroke: "#121212", "stroke-width": 8, "stroke-linecap": "round" });
    expect(parts[1].attrs).toMatchObject({ x: -38, y: -6, width: 20, height: 7 });
    expect(parts[2].attrs).toMatchObject({ x: 18, y: -6, width: 20, height: 7 });
    expect(parts[3].attrs).toEqual({ d: BALAO_BODY, fill: "#FFFFFF", stroke: "#121212", "stroke-width": 8, "stroke-linejoin": "round" });
    expect(parts[4]).toEqual(faceAt(-38, -146, 76, 40, LIGHT, "idle"));
    expect(parts[5].attrs).toEqual({ x: -30, y: -88, width: 60, height: 9, rx: 4.5, fill: "#D7D1C5" });
    expect(parts[6]).toEqual(peak(LIGHT, 0, -162, 28, 24));
    expect(parts[6].attrs.fill).toBe("#E04E17");
    expect(parts[7].attrs).toMatchObject({ cx: -86, cy: -100, r: 15 });
    expect(parts[8].attrs).toMatchObject({ cx: 92, cy: -132, r: 15 });
    expect(text).toEqual([]);
  });

  test("The tail points at the listener", () => {
    const d = String(nodesOf(balao({ x: 0, y: 0 }).body).find((node) => node.attrs.d === BALAO_BODY)?.attrs.d);
    const points = endPoints(d);
    const right = points.reduce((best, point) => (point[0] > best[0] ? point : best));
    expect(right).toEqual([94, -76]);
    expect(right[1]).toBeLessThan(-62);
    expect(Math.max(...points.map(([, y]) => y))).toBeLessThanOrEqual(-60);
  });

  test("Balão speaks", () => {
    for (const [surface, accent] of [["light", "#E04E17"], ["dark", "#FF7A45"]] as const) {
      const quiet = bodyGroup(balao({ x: 0, y: 0, surface }));
      const speaking = balao({ x: 0, y: 0, surface, speaks: true });
      const line = kids(bodyGroup(speaking))[5];
      expect(line.attrs, surface).toMatchObject({ x: -30, y: -88, width: 60, height: 9, fill: accent });
      // Every other node is the same: put the quiet fill back and compare the whole trees.
      const back = plain(speaking);
      back.body[0].children[0].children[5].attrs.fill = tokens.illustration.textBar;
      expect(back, surface).toEqual(plain(balao({ x: 0, y: 0, surface })));
      expect(kids(quiet)[5].attrs.fill).toBe("#D7D1C5");
    }
  });

  test("Balão holds the stamp", () => {
    const drawn = balao({ x: 0, y: 0, holdsStamp: { word: "GO" } });
    const [held, group] = rootKids(drawn);
    expect(held.attrs).toEqual({ "data-held": "stamp", stroke: "#121212", "stroke-width": 4, "stroke-linejoin": "round" });
    const expected = stamp({ cx: 132, cy: -70, r: 24, word: "GO" });
    expect(kids(held)).toEqual(expected.body);
    expect(circleAt(kids(group), 132, -100)).toHaveLength(1);
    expect(circleAt(kids(group), 92, -132)).toHaveLength(0);
    expect(drawn.text).toHaveLength(1);
    expect(drawn.text[0].attrs).toEqual({
      transform: drawn.body[0].attrs.transform, "font-family": tokens.font.sans, "font-size": 19, "font-weight": 700, fill: "#121212", "text-anchor": "middle",
    });
    expect(kids(drawn.text[0])).toEqual(expected.text);
    expect(kids(drawn.text[0])[0].attrs).toMatchObject({ x: 132, y: -60 });
    expect(stringsOf(drawn.text)).toEqual(["GO"]);
  });

  test("Balão from behind", () => {
    const trees = [...CAST_EXPRESSIONS.map((expression) => balao({ x: 0, y: 0, view: "back", expression })), balao({ x: 0, y: 0, view: "back", speaks: true })];
    for (const tree of trees) expect(tree).toEqual(trees[0]);
    const nodes = nodesOf(trees[0].body);
    for (const expression of CAST_EXPRESSIONS) expect(nodes.some((node) => JSON.stringify(node) === JSON.stringify(faceAt(-38, -146, 76, 40, LIGHT, expression)))).toBe(false);
    expect(nodes.some((node) => node.tag === "rect" && node.attrs.y === -88)).toBe(false);
    expect(nodes.filter((node) => node.tag === "rect" && node.attrs.width === 76 && node.attrs.height === 40)).toEqual([]);
    expect(nodes.some((node) => node.attrs.d === BALAO_BODY)).toBe(true);
    const tip = nodes.find((node) => node.attrs.d === BALAO_TIP_BACK);
    expect(tip?.attrs).toEqual({ d: BALAO_TIP_BACK, fill: "#E04E17", stroke: "#121212", "stroke-width": 5, "stroke-linejoin": "round" });
    expect(trees[0].text).toEqual([]);
  });
});

describe("Balão parameters", () => {
  test("Speaking and stamping together", () => {
    const both: BalaoParams = { x: 0, y: 0, speaks: true, holdsStamp: { word: "GO" } };
    const fromBehind: BalaoParams = { ...both, view: "back" };
    for (const params of [both, fromBehind]) expect(() => balao(params)).toThrow(new RangeError("balao: holdsStamp: Balão does one action at a time"));
    expect(PIECES.balao.relations!(fromBehind)).toEqual([{ path: "holdsStamp", message: "Balão does one action at a time" }]);
  });

  test("Stamp from behind", () => {
    expect(() => balao({ x: 0, y: 0, view: "back", holdsStamp: { word: "GO" } })).toThrow(new RangeError("balao: holdsStamp: Balão holds a stamp only in the front view"));
  });

  test("Bad stamp and parameters", () => {
    const cases: [Record<string, unknown>, RegExp][] = [
      [{ holdsStamp: {} }, /^balao: holdsStamp\.word: missing required parameter$/],
      [{ holdsStamp: { word: "" } }, /^balao: holdsStamp\.word: expected a non-empty string$/],
      [{ holdsStamp: { word: "GO", fill: "color.white" } }, /^balao: holdsStamp\.fill: unknown parameter/],
      [{ holdsStamp: true }, /^balao: holdsStamp: expected an object/],
      [{ scale: 5 }, /^balao: scale: expected a number at most 4/],
      [{ facing: "up" }, /^balao: facing: expected one of right, left, found "up"$/],
      [{ colour: "color.white" }, /^balao: colour: unknown parameter/],
      [{ speaks: true, holdsStamp: { word: "" } }, /^balao: holdsStamp\.word: expected a non-empty string$/],
    ];
    for (const [extra, message] of cases) expect(() => callBalao({ x: 0, y: 0, ...extra }), JSON.stringify(extra)).toThrow(message);
  });
});

describe("Chaves", () => {
  test("Chaves at rest", () => {
    const { body, text } = chaves({ x: 100, y: 300 });
    expect(body).toHaveLength(1);
    expect(body[0].attrs).toEqual({ "data-piece": "chaves", transform: "translate(100 300) scale(1)", stroke: "none" });
    expect(kids(body[0])).toHaveLength(1);
    const group = kids(body[0])[0];
    expect(group.attrs).toEqual({});
    const parts = kids(group);
    expect(parts.map((node) => node.tag)).toEqual(["path", "rect", "rect", "path", "g", "rect", "path", "circle", "circle"]);
    expect(parts[0].attrs.d).toBe("M-16 -30 L-26 0 M16 -30 L26 0");
    expect(parts[1].attrs).toMatchObject({ x: -36, y: -6 });
    expect(parts[2].attrs).toMatchObject({ x: 16, y: -6 });
    expect(parts[3].attrs).toEqual({ d: CHAVES_BODY, fill: "#FFFFFF", stroke: "#121212", "stroke-width": 8, "stroke-linejoin": "round" });
    expect(parts[4]).toEqual(faceAt(-34, -132, 68, 38, LIGHT, "idle"));
    expect(parts[5].attrs).toEqual({ x: -9, y: -76, width: 18, height: 8, rx: 2, fill: "#E04E17" });
    expect(parts[6]).toEqual(peak(LIGHT, 0, -150, 28, 24));
    expect(parts[7].attrs).toMatchObject({ cx: -100, cy: -50, r: 15 });
    expect(parts[8].attrs).toMatchObject({ cx: 100, cy: -50, r: 15 });
    expect(text).toEqual([]);
  });

  test("Chaves types", () => {
    for (const surface of ["light", "dark"] as const) {
      const drawn = chaves({ x: 0, y: 0, types: true, surface });
      const [held, group] = rootKids(drawn);
      expect(held.attrs, surface).toEqual({ "data-held": "keyboard" });
      expect(held.children, surface).toEqual(keyboard({ x: 98, y: -74, width: 150, surface }).body[0].children);
      // No `data-piece` inside Chaves but its own.
      expect(nodesOf(drawn.body).filter((node) => node.attrs["data-piece"] !== undefined).map((node) => node.attrs["data-piece"])).toEqual(["chaves"]);
      expect(circleAt(kids(group), 120, -80), surface).toHaveLength(1);
      expect(circleAt(kids(group), 100, -50), surface).toHaveLength(0);
      expect(drawn.text).toEqual([]);
    }
  });

  test("Chaves points", () => {
    const parts = kids(bodyGroup(chaves({ x: 0, y: 0, points: true })));
    const hand = parts.at(-1)!;
    expect(hand.tag).toBe("g");
    expect(hand.attrs).toEqual({ transform: "translate(104,-128) rotate(55)" });
    const [finger, palm] = kids(hand);
    expect(finger.attrs).toMatchObject({ x: -6, y: -30, width: 12, height: 26, rx: 6, "stroke-width": 4.5 });
    expect(palm.attrs).toMatchObject({ cx: 0, cy: 0, r: 15 });
    expect(hand).toEqual(pointingHand(LIGHT, 104, -128, 55));
    expect(circleAt(parts, 100, -50)).toHaveLength(0);
  });

  test("Chaves hands a sheet over", () => {
    const drawn = chaves({ x: 0, y: 0, holdsSheet: SHEET });
    const [held, group] = rootKids(drawn);
    expect(held.attrs).toEqual({ "data-held": "sheet", stroke: "#121212", "stroke-width": 4, "stroke-linejoin": "round" });
    const page = sheet({ x: 118, y: -200, width: 150, height: 160, rows: [{ lead: "question", bar: 40 }] });
    const marked = page.body.map((node) => (node.tag === "g" && node.attrs["stroke-width"] === tokens.outline.small ? { ...node, attrs: { ...node.attrs, stroke: "#121212" } } : node));
    expect(kids(held)).toEqual([...marked, ...pill({ x: 193, y: -200, text: "proposal.md" }).body]);
    expect(circleAt(kids(group), 112, -92)).toHaveLength(1);
    expect(drawn.text).toHaveLength(1);
    expect(drawn.text[0].attrs).toEqual({ transform: "translate(0 0) scale(1)", "font-family": tokens.font.sans, "font-size": 19, "font-weight": 700, fill: "#121212", "text-anchor": "middle" });
    const [question, label] = kids(drawn.text[0]);
    expect([question.attrs.x, question.attrs.y, question.children]).toEqual([148, -136, ["?"]]);
    expect([label.attrs.x, label.attrs.y, label.children]).toEqual([193, -193, ["proposal.md"]]);
  });

  test("Chaves from behind", () => {
    const trees = CAST_EXPRESSIONS.map((expression) => chaves({ x: 0, y: 0, view: "back", expression }));
    for (const tree of trees) expect(tree).toEqual(trees[0]);
    const nodes = nodesOf(trees[0].body);
    expect(nodes.some((node) => node.tag === "rect" && node.attrs.y === -76)).toBe(false);
    expect(nodes.filter((node) => node.tag === "rect" && node.attrs.width === 68 && node.attrs.height === 38)).toEqual([]);
    const tip = nodes.find((node) => node.attrs.d === CHAVES_TIP_BACK);
    expect(tip?.attrs).toEqual({ d: CHAVES_TIP_BACK, fill: "#E04E17", stroke: "#121212", "stroke-width": 5, "stroke-linejoin": "round" });
    const pointing = chaves({ x: 0, y: 0, view: "back", points: true });
    expect(kids(bodyGroup(pointing)).at(-1)).toEqual(pointingHand(LIGHT, 104, -128, 55));
  });
});

describe("Chaves's silhouette", () => {
  test("Brace points and waist", () => {
    const d = String(nodesOf(chaves({ x: 0, y: 0 }).body).find((node) => node.attrs.d === CHAVES_BODY)?.attrs.d);
    const segments = segmentsOf(d);
    const points = segments.map((segment) => segment.to);
    const xs = points.map(([x]) => x);
    expect(points.find(([x]) => x === Math.max(...xs))).toEqual([90, -88]);
    expect(points.find(([x]) => x === Math.min(...xs))).toEqual([-90, -88]);
    for (const point of [[44, -108], [44, -68], [-44, -108], [-44, -68], [54, -128], [54, -48], [-54, -128], [-54, -48]] as [number, number][]) expect(has(points, point), String(point)).toBe(true);
    // |x| of the waist < |x| of the corners < |x| of the points; on y, -128 < -108 < -88 < -68 < -48.
    expect(44).toBeLessThan(54);
    expect(54).toBeLessThan(90);
    expect([-128, -108, -88, -68, -48]).toEqual([-128, -108, -88, -68, -48].slice().sort((a, b) => a - b));
    // The curves into and out of the point (90, -88) are quadratics with the control points (60, -96) and (60, -80).
    const into = segments.find((segment) => segment.to[0] === 90 && segment.to[1] === -88)!;
    const outOf = segments.find((segment) => segment.from[0] === 90 && segment.from[1] === -88)!;
    expect(into.controls).toEqual([[60, -96]]);
    expect(outOf.controls).toEqual([[60, -80]]);
    // Symmetric about x 0: every end and control point has its mirror.
    const all = segments.flatMap((segment) => [segment.to, ...segment.controls]);
    for (const [x, y] of all) expect(has(all, [-x, y]), `${x},${y}`).toBe(true);
  });
});

describe("Chaves parameters", () => {
  test("One action at a time", () => {
    const cases: [ChavesParams, string][] = [
      [{ x: 0, y: 0, types: true, points: true }, "chaves: points: Chaves does one action at a time"],
      [{ x: 0, y: 0, points: true, holdsSheet: SHEET }, "chaves: holdsSheet: Chaves does one action at a time"],
      [{ x: 0, y: 0, types: true, points: true, holdsSheet: SHEET }, "chaves: points: Chaves does one action at a time"],
    ];
    for (const [params, message] of cases) expect(() => chaves(params)).toThrow(new RangeError(message));
    expect(PIECES.chaves.relations!(cases[2][0])).toHaveLength(1);
    expect(PIECES.chaves.relations!({ ...cases[2][0], view: "back" })).toEqual([{ path: "points", message: "Chaves does one action at a time" }]);
  });

  test("Props from behind", () => {
    expect(() => chaves({ x: 0, y: 0, view: "back", types: true })).toThrow(new RangeError("chaves: types: Chaves types only in the front view"));
    expect(() => chaves({ x: 0, y: 0, view: "back", holdsSheet: SHEET })).toThrow(new RangeError("chaves: holdsSheet: Chaves holds a sheet only in the front view"));
    expect(() => chaves({ x: 0, y: 0, view: "back", points: true })).not.toThrow();
  });

  test("Bad held sheet and parameters", () => {
    const cases: [Record<string, unknown>, RegExp][] = [
      [{ holdsSheet: { ...SHEET, width: 79 } }, /^chaves: holdsSheet\.width: expected a number at least 80/],
      [{ holdsSheet: { ...SHEET, rows: [] } }, /^chaves: holdsSheet\.rows: expected at least 1 item/],
      [{ holdsSheet: { ...SHEET, fill: "color.white" } }, /^chaves: holdsSheet\.fill: unknown parameter/],
      [{ types: "yes" }, /^chaves: types: expected true or false/],
      [{ facing: "up" }, /^chaves: facing: expected one of right, left/],
      [{ scale: 0.2 }, /^chaves: scale: expected a number at least 0.25/],
      [{ types: true, points: true, holdsSheet: { ...SHEET, width: 79 } }, /^chaves: holdsSheet\.width: /],
    ];
    for (const [extra, message] of cases) expect(() => callChaves({ x: 0, y: 0, ...extra }), JSON.stringify(extra)).toThrow(message);
  });

  test("Actions off by default", () => {
    expect(chaves({ x: 0, y: 0 })).toEqual(chaves({ x: 0, y: 0, types: false, points: false, facing: "right" }));
    expect(balao({ x: 0, y: 0 })).toEqual(balao({ x: 0, y: 0, speaks: false, facing: "right" }));
  });
});

describe("Supporting characters face left or right", () => {
  test("Mirror of the default", () => {
    const pieces = { balao: callBalao, chaves: callChaves };
    for (const [name, piece] of Object.entries(pieces)) {
      for (const view of ["front", "back"]) {
        const right = piece({ x: 100, y: 300, view });
        const left = piece({ x: 100, y: 300, view, facing: "left" });
        expect(left.body[0].attrs, `${name} ${view}`).toEqual(right.body[0].attrs);
        expect(kids(left.body[0]), `${name} ${view}`).toHaveLength(1);
        const mirrored = kids(left.body[0])[0];
        expect(mirrored.attrs, `${name} ${view}`).toEqual({ transform: "scale(-1,1)" });
        expect(mirrored.children, `${name} ${view}`).toEqual(kids(right.body[0])[0].children);
      }
    }
  });

  test("Props stay readable facing left", () => {
    const stamped = balao({ x: 0, y: 0, holdsStamp: { word: "GO" }, facing: "left" });
    expect(rootKids(stamped)[0]).toEqual({ tag: "g", attrs: { "data-held": "stamp", stroke: "#121212", "stroke-width": 4, "stroke-linejoin": "round" }, children: stamp({ cx: -132, cy: -70, r: 24, word: "GO" }).body });
    expect(kids(stamped.text[0])[0].attrs).toMatchObject({ x: -132, y: -60 });
    const typing = chaves({ x: 0, y: 0, types: true, facing: "left" });
    expect(rootKids(typing)[0]).toEqual({ tag: "g", attrs: { "data-held": "keyboard" }, children: keyboard({ x: -248, y: -74, width: 150 }).body[0].children });
    const handing = chaves({ x: 0, y: 0, holdsSheet: SHEET, facing: "left" });
    const right = chaves({ x: 0, y: 0, holdsSheet: SHEET });
    const held = rootKids(handing)[0];
    expect(held.attrs.transform).toBeUndefined();
    const page = sheet({ x: -268, y: -200, width: 150, height: 160, rows: SHEET.rows });
    const marked = page.body.map((node) => (node.tag === "g" && node.attrs["stroke-width"] === tokens.outline.small ? { ...node, attrs: { ...node.attrs, stroke: "#121212" } } : node));
    expect(kids(held)).toEqual([...marked, ...pill({ x: -193, y: -200, text: "proposal.md" }).body]);
    expect(held.attrs).toEqual(rootKids(right)[0].attrs);
    const [question, label] = kids(handing.text[0]);
    expect([question.attrs.x, question.attrs.y]).toEqual([-238, -136]);
    expect([label.attrs.x, label.attrs.y]).toEqual([-193, -193]);
    for (const drawn of [stamped, typing, handing]) expect(rootKids(drawn)[0].attrs.transform).toBeUndefined();
    expect(() => callBalao({ x: 0, y: 0, facing: "up" })).toThrow(/^balao: facing: /);
  });

  test("Same outline both ways", () => {
    const shapes = (drawn: Drawn) => nodesOf(drawn.body).filter((node) => node.tag !== "g").map((node) => [node.tag, node.attrs.fill, node.attrs.stroke, node.attrs["stroke-width"]]);
    const transforms = (drawn: Drawn) => nodesOf(drawn.body).map((node) => node.attrs.transform);
    for (const [name, piece] of [["balao", callBalao], ["chaves", callChaves]] as const) {
      for (const expression of CAST_EXPRESSIONS) {
        for (const surface of ["light", "dark"]) {
          const right = piece({ x: 0, y: 0, expression, surface });
          const left = piece({ x: 0, y: 0, expression, surface, facing: "left" });
          const label = `${name} ${expression} ${surface}`;
          expect(shapes(left), label).toEqual(shapes(right));
          const differing = transforms(right).flatMap((transform, i) => (transform === transforms(left)[i] ? [] : [[transform, transforms(left)[i]]]));
          expect(differing, label).toEqual([[undefined, "scale(-1,1)"]]);
        }
      }
    }
  });
});

describe("Supporting cast follows the cast rules", () => {
  test("Shared skin in every expression", () => {
    const outlines = { light: "#121212", dark: "#ADA79D" } as const;
    const visors = { light: "#121212", dark: "#121110" } as const;
    for (const [name, piece, body] of [["balao", callBalao, BALAO_BODY], ["chaves", callChaves, CHAVES_BODY]] as const) {
      for (const surface of ["light", "dark"] as const) {
        const trees = CAST_EXPRESSIONS.map((expression) => piece({ x: 0, y: 0, expression, surface }));
        for (const tree of trees) {
          const nodes = nodesOf(tree.body);
          expect(nodes.find((node) => node.attrs.d === body)?.attrs, `${name} ${surface}`).toMatchObject({ fill: "#FFFFFF", stroke: outlines[surface] });
          const face = kids(bodyGroup(tree)).find((node) => node.tag === "g")!;
          expect(kids(face)[0].attrs.fill, `${name} ${surface}`).toBe(visors[surface]);
          const eyes = kids(face).slice(1).map((eye) => eye.attrs.fill === "none" || eye.attrs.fill === undefined ? eye.attrs.stroke : eye.attrs.fill);
          expect(new Set(eyes), `${name} ${surface}`).toEqual(new Set(["#FFC98A"]));
        }
        // The four trees differ only inside the face group.
        const withoutFace = trees.map((tree) => {
          const copy = plain(tree);
          const parts = copy.body[0].children[0].children as SvgNode[];
          copy.body[0].children[0].children = parts.map((node) => (node.tag === "g" ? "face" : node));
          return JSON.stringify(copy);
        });
        expect(new Set(withoutFace).size, `${name} ${surface}`).toBe(1);
        expect(new Set(trees.map((tree) => JSON.stringify(tree))).size, `${name} ${surface}`).toBe(4);
      }
    }
  });

  test("Scale about the ground point", () => {
    for (const [name, piece, extra] of [["balao", callBalao, {}], ["chaves", callChaves, { types: true }]] as const) {
      const full = piece({ x: 0, y: 0, ...extra });
      const small = piece({ x: 0, y: 0, scale: 0.25, ...extra });
      expect(small.body[0].attrs.transform, name).toBe("translate(0 0) scale(0.25)");
      const restored = plain(small);
      restored.body[0].attrs.transform = full.body[0].attrs.transform;
      expect(restored, name).toEqual(plain(full));
    }
  });

  test("Feet on the ground point", () => {
    for (const [name, piece, foot] of [["balao", callBalao, 28], ["chaves", callChaves, 26]] as const) {
      const parts = kids(bodyGroup(piece({ x: 0, y: 0 })));
      const legEnds = endPoints(String(parts[0].attrs.d));
      expect(legEnds, name).toEqual([[-foot, 0], [foot, 0]]);
      const [left, right] = [parts[1], parts[2]];
      for (const pill of [left, right]) expect(pill.attrs, name).toMatchObject({ width: 20, height: 7, y: -6 });
      expect(Number(left.attrs.x) + 10, name).toBe(-(Number(right.attrs.x) + 10));
      // No other shape reaches below y 1 (its lowest end or control point, plus half its stroke).
      for (const node of nodesOf(parts.slice(3))) {
        const half = Number(node.attrs["stroke-width"] ?? 0) / 2;
        let low = -Infinity;
        if (node.tag === "rect") low = Number(node.attrs.y) + Number(node.attrs.height);
        else if (node.tag === "circle") low = Number(node.attrs.cy) + Number(node.attrs.r);
        else if (node.tag === "path") low = Math.max(...segmentsOf(String(node.attrs.d)).flatMap((s) => [s.to[1], ...s.controls.map((c) => c[1])]));
        expect(low + half, `${name} ${node.tag}`).toBeLessThan(1);
      }
      // Posed about the anchor, the centre of the feet's ground line (0, 0) stays at the anchor.
      const placed = piece({ x: 100, y: 300 });
      const posed = pose(placed.body[0], { x: 100, y: 300, tilt: 12, squash: 1.2 });
      const ground = applyAll([posed.attrs.transform as string, placed.body[0].attrs.transform as string], [0, 0]);
      expect(ground[0], name).toBeCloseTo(100, 3);
      expect(ground[1], name).toBeCloseTo(300, 3);
    }
  });

  test("Schemas list the shared and own parameters", () => {
    const shared = ["x", "y", "surface", "scale", "expression", "view", "facing"];
    expect(Object.keys(PIECES.balao.schema).sort()).toEqual([...shared, "speaks", "holdsStamp"].sort());
    expect(Object.keys(PIECES.chaves.schema).sort()).toEqual([...shared, "types", "points", "holdsSheet"].sort());
    for (const schema of [PIECES.balao.schema, PIECES.chaves.schema]) expect(Object.values(schema).filter((spec) => spec.kind === "color")).toEqual([]);
    expect(CAST_FACINGS).toEqual(["right", "left"]);
    const facing: CastFacing = "left";
    const board: KeyboardParams = { x: 0, y: 0 };
    const visorSheet: VisorHeldSheet = SHEET;
    expect([facing, board.width, visorSheet.label]).toEqual(["left", undefined, "proposal.md"]);
  });
});

// ---------------------------------------------------------------- geometry for the emote spot

type Matrix = [number, number, number, number, number, number];
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];
const multiply = (m: Matrix, n: Matrix): Matrix => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
/** The matrix of an SVG transform list of translate, rotate (about the origin or a point) and scale. */
const matrixOf = (transform: string | undefined): Matrix => {
  let m = IDENTITY;
  for (const [, name, args] of (transform ?? "").matchAll(/(translate|rotate|scale)\(([^)]*)\)/g)) {
    const v = args.split(/[\s,]+/).filter(Boolean).map(Number);
    if (name === "translate") m = multiply(m, [1, 0, 0, 1, v[0], v[1] ?? 0]);
    else if (name === "scale") m = multiply(m, [v[0], 0, 0, v[1] ?? v[0], 0, 0]);
    else {
      const a = (v[0] * Math.PI) / 180, [cx, cy] = [v[1] ?? 0, v[2] ?? 0];
      m = multiply(multiply(multiply(m, [1, 0, 0, 1, cx, cy]), [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0]), [1, 0, 0, 1, -cx, -cy]);
    }
  }
  return m;
};
const apply = (m: Matrix, [x, y]: [number, number]): [number, number] => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
/** A point through a list of transforms, outermost first. */
const applyAll = (transforms: string[], point: [number, number]) => apply(transforms.reduce((m, t) => multiply(m, matrixOf(t)), IDENTITY), point);

type Box = { x0: number; y0: number; x1: number; y1: number; what: string };
/**
 * The bounding boxes of every shape, in the character's units: a rect's or a
 * circle's box, a path's per segment (its end and control points hold the
 * curve), each through its transforms and grown by half its stroke width.
 * Texts are left out: the only ones are the held props' words, beside the props.
 */
const boxesOf = (nodes: readonly SvgNode[], m = IDENTITY, stroke = "none", width = 0): Box[] =>
  nodes.flatMap((node) => {
    const here = multiply(m, matrixOf(node.attrs.transform as string | undefined));
    const s = String(node.attrs.stroke ?? stroke), w = Number(node.attrs["stroke-width"] ?? width);
    if (node.tag === "g") return boxesOf(kids(node), here, s, w);
    const hulls: [number, number][][] = [];
    const a = node.attrs as Record<string, number>;
    if (node.tag === "rect") hulls.push([[a.x, a.y], [a.x + a.width, a.y], [a.x, a.y + a.height], [a.x + a.width, a.y + a.height]]);
    else if (node.tag === "circle") hulls.push([[a.cx - a.r, a.cy - a.r], [a.cx + a.r, a.cy - a.r], [a.cx - a.r, a.cy + a.r], [a.cx + a.r, a.cy + a.r]]);
    else if (node.tag === "path") for (const segment of segmentsOf(String(node.attrs.d).replace(/[,]/g, " "))) hulls.push([segment.from, ...segment.controls, segment.to]);
    else return [];
    const half = s === "none" ? 0 : (w / 2) * Math.hypot(here[0], here[1]);
    return hulls.map((hull) => {
      const points = hull.map((point) => apply(here, point));
      const xs = points.map(([x]) => x), ys = points.map(([, y]) => y);
      return { x0: Math.min(...xs) - half, y0: Math.min(...ys) - half, x1: Math.max(...xs) + half, y1: Math.max(...ys) + half, what: `${node.tag} ${node.attrs.d ?? ""}${node.attrs.cx ?? node.attrs.x ?? ""}` };
    });
  });
/** The distance from a point to a box (0 inside it). */
const distance = ([x, y]: [number, number], box: Box) => Math.hypot(Math.max(box.x0 - x, 0, x - box.x1), Math.max(box.y0 - y, 0, y - box.y1));
/** The emote's disc: radius 40 and its outline (design §8). */
const SPOT_RADIUS = 44;
const spotOf = (facing: CastFacing): [number, number] => [facing === "left" ? -116 : 116, -200];
/** The boxes inside the disc at the spot, for a character drawn at x 0, y 0, scale 1 (its root transform is the identity there). */
const overlapping = (drawn: Drawn, facing: CastFacing) => boxesOf(kids(drawn.body[0])).filter((box) => distance(spotOf(facing), box) < SPOT_RADIUS).map((box) => box.what);

describe("Emote spot beside the head", () => {
  test("Spot clear of the body and props", () => {
    for (const facing of CAST_FACINGS) {
      const calls: [string, Drawn][] = [
        ["balao at rest", balao({ x: 0, y: 0, facing })],
        ["balao holding a stamp", balao({ x: 0, y: 0, facing, holdsStamp: { word: "GO" } })],
        ["chaves at rest", chaves({ x: 0, y: 0, facing })],
        ["chaves pointing", chaves({ x: 0, y: 0, facing, points: true })],
        ["chaves typing", chaves({ x: 0, y: 0, facing, types: true })],
      ];
      for (const [label, drawn] of calls) {
        expect(drawn.body[0].attrs.transform).toBe("translate(0 0) scale(1)");
        expect(overlapping(drawn, facing), `${label} facing ${facing}`).toEqual([]);
      }
    }
  });

  test("The test sees a shape in the disc", () => {
    // A hand moved into the spot is caught, so an empty list above means clear, not unchecked.
    const moved = plain(balao({ x: 0, y: 0 }));
    const parts = moved.body[0].children[0].children as SvgNode[];
    const front = parts.at(-1)!;
    (front.attrs as Record<string, number>).cx = 116;
    (front.attrs as Record<string, number>).cy = -160;
    expect(overlapping(moved, "right")).toHaveLength(1);
  });

  test("A tall held sheet reaches the spot", () => {
    // The held group's shapes with the group's stroke: the page is its first rect, the pill the rect with the pill's radius.
    const heldBoxes = (drawn: Drawn, pick: (node: SvgNode) => boolean) => {
      const held = rootKids(drawn)[0];
      return boxesOf(kids(held).filter(pick), IDENTITY, String(held.attrs.stroke), Number(held.attrs["stroke-width"]));
    };
    const pageBox = (drawn: Drawn) => heldBoxes(drawn, (node) => node.tag === "rect" && node.attrs.rx === 14)[0];
    const pillBoxes = (drawn: Drawn) => heldBoxes(drawn, (node) => node.tag === "rect" && node.attrs.rx === tokens.cover.pillHeight / 2);
    for (const facing of CAST_FACINGS) {
      const spot = spotOf(facing);
      const tall = chaves({ x: 0, y: 0, facing, holdsSheet: SHEET });
      const short = chaves({ x: 0, y: 0, facing, holdsSheet: { ...SHEET, height: 100, label: undefined } });
      expect(distance(spot, pageBox(tall)), facing).toBeLessThan(SPOT_RADIUS);
      expect(distance(spot, pageBox(short)), facing).toBeGreaterThanOrEqual(SPOT_RADIUS);
      expect(overlapping(short, facing), facing).toEqual([]);
      // Taller than 114 the page reaches it; with a label, the pill on its top edge reaches it from taller than 96.
      expect(distance(spot, pageBox(chaves({ x: 0, y: 0, facing, holdsSheet: { ...SHEET, height: 115, label: undefined } }))), facing).toBeLessThan(SPOT_RADIUS);
      expect(overlapping(chaves({ x: 0, y: 0, facing, holdsSheet: { ...SHEET, height: 114, label: undefined } }), facing), facing).toEqual([]);
      const labelled = chaves({ x: 0, y: 0, facing, holdsSheet: { ...SHEET, height: 100 } });
      expect(pillBoxes(labelled).some((box) => distance(spot, box) < SPOT_RADIUS), facing).toBe(true);
      expect(overlapping(chaves({ x: 0, y: 0, facing, holdsSheet: { ...SHEET, height: 96 } }), facing), facing).toEqual([]);
    }
  });
});

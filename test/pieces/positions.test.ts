// Unit tests of positions of any size and the overflow check (spec
// illustration-pieces, "Positions of any size", "Drawing overflow"; change
// unbounded-positions, tasks 1.1 and 1.2). Each test title is the scenario it proves.
import { describe, expect, test } from "vitest";
import * as P from "../../src/pieces/library";
import type { Drawn, SvgNode } from "../../src/pieces/node";
import { toSvg } from "../../src/pieces/render";

const COORDINATE_ATTRS = new Set(["x", "y", "cx", "cy", "x1", "y1", "x2", "y2"]);
const NUMBER = /-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi;

type Pair = { far: number; near: number; shifts: boolean };

/** Path data as (number, shifts) pairs (polygon `points` shift entirely): points of M, L, C, Q and the end point of A shift; radii, rotation and flags do not. */
const pathNumbers = (d: string): { value: number; shifts: boolean }[] => {
  const out: { value: number; shifts: boolean }[] = [];
  for (const [, command, args] of d.matchAll(/([A-Za-z])([^A-Za-z]*)/g)) {
    const values = (args.match(NUMBER) ?? []).map(Number);
    values.forEach((value, i) => {
      if ("MLCQ".includes(command)) out.push({ value, shifts: true });
      else if (command === "A") out.push({ value, shifts: i % 7 >= 5 });
      else out.push({ value, shifts: false });
    });
  }
  return out;
};

/** Transform numbers: the translate pair shifts, everything else (scale, rotate) does not. */
const transformNumbers = (t: string): { value: number; shifts: boolean }[] =>
  [...t.matchAll(/(\w+)\(([^)]*)\)/g)].flatMap(([, fn, args]) => (args.match(NUMBER) ?? []).map((n) => ({ value: Number(n), shifts: fn === "translate" })));

/** Pairs every number of the far tree with the near tree's, saying which must shift. */
const pairs = (far: SvgNode | string, near: SvgNode | string, translated = false, out: Pair[] = []): Pair[] => {
  if (typeof far === "string" || typeof near === "string") {
    expect(far).toEqual(near);
    return out;
  }
  expect(far.tag).toBe(near.tag);
  expect(Object.keys(far.attrs)).toEqual(Object.keys(near.attrs));
  for (const [name, value] of Object.entries(far.attrs)) {
    const other = near.attrs[name];
    if (name === "points") {
      const a = String(value).match(NUMBER)!.map(Number);
      const b = String(other).match(NUMBER)!.map(Number);
      expect(a.length).toBe(b.length);
      a.forEach((v, i) => out.push({ far: v, near: b[i], shifts: !translated }));
    } else if (name === "d" || name === "transform") {
      const a = name === "d" ? pathNumbers(String(value)) : transformNumbers(String(value));
      const b = name === "d" ? pathNumbers(String(other)) : transformNumbers(String(other));
      expect(a.length).toBe(b.length);
      a.forEach((item, i) => out.push({ far: item.value, near: b[i].value, shifts: item.shifts && !(name === "d" && translated) }));
    } else if (typeof value === "number") {
      out.push({ far: value, near: other as number, shifts: COORDINATE_ATTRS.has(name) && !translated });
    } else expect(value).toBe(other);
  }
  const inside = translated || "transform" in far.attrs;
  far.children.forEach((child, i) => pairs(child, near.children[i], inside, out));
  return out;
};

const expectShifted = (far: Drawn, near: Drawn, shift: number) => {
  const list = [...far.body, ...far.text].flatMap((node, i) => pairs(node, [...near.body, ...near.text][i]));
  expect(far.body.length + far.text.length).toBe(near.body.length + near.text.length);
  expect(list.some((p) => p.shifts)).toBe(true);
  for (const p of list) expect(Math.abs(p.far - (p.near + (p.shifts ? shift : 0)))).toBeLessThanOrEqual(0.01);
};

type Call = [keyof typeof P, (at: number) => Record<string, unknown>];
const MAP_PIECES: Call[] = [
  ["stationMarker", (s) => ({ cx: s, cy: s })],
  ["lineBadge", (s) => ({ x: s, y: s, text: "A", fill: "#7B3FE4" })],
  ["countBadge", (s) => ({ cx: s, cy: s, text: "12" })],
  ["nodeBlock", (s) => ({ x: s, y: s, title: "Northwind", width: 160 })],
  ["pillNode", (s) => ({ x: s, y: s, title: "Northwind", width: 160 })],
  ["hexNode", (s) => ({ x: s, y: s, title: "Northwind", width: 160, surface: "dark" })],
  ["ledgerMark", (s) => ({ x: s, y: s, size: 64 })],
];
const draw = (name: keyof typeof P, params: Record<string, unknown>): Drawn => (P[name] as (p: object) => Drawn)(params);

describe("Positions of any size", () => {
  test.each(MAP_PIECES.flatMap(([name, at]) => [6400000, -6400000].map((shift) => [name, shift, at] as const)))("Far map position (%s at %d)", (name, shift, at) => {
    expectShifted(draw(name, at(shift)), draw(name, at(0)), shift);
  });

  test("Far interchange and arrow", () => {
    const S = 6400000;
    expectShifted(P.stationMarker({ cx: S, cy: S, to: [S, S + 640] }), P.stationMarker({ cx: 0, cy: 0, to: [0, 640] }), S);
    expectShifted(P.messageArrow({ from: [S - 100, S], to: [S + 100, S] }), P.messageArrow({ from: [-100, 0], to: [100, 0] }), S);
  });

  test("Not finite", () => {
    expect(() => P.stationMarker({ cx: NaN, cy: 0 })).toThrow(/^stationMarker: cx: /);
    expect(() => P.lineBadge({ x: 0, y: Infinity, text: "A", fill: "#7B3FE4" })).toThrow(/^lineBadge: y: /);
    expect(() => P.arcArrow({ from: [-Infinity, 0], c1: [0, 0], c2: [0, 0], to: [10, 0] })).toThrow(/^arcArrow: from: /);
    expect(() => draw("nodeBlock", { x: "6400000", y: 0, title: "a", width: 160 })).toThrow(/^nodeBlock: x: /);
    expect(() => draw("messageArrow", { from: [null, 0], to: [100, 0] })).toThrow(/^messageArrow: from: /);
  });

  test("Far rings centre", () => {
    const { body } = P.rings({ cx: 6400000, cy: -6400000 });
    const circles = (body[0] as SvgNode).children as SvgNode[];
    expect(circles).toHaveLength(14);
    for (const circle of circles) expect([circle.attrs.cx, circle.attrs.cy]).toEqual([6400000, -6400000]);
  });
});

describe("Drawing overflow", () => {
  test("Distance overflows", () => {
    expect(() => P.messageArrow({ from: [-1.7e308, 0], to: [1.7e308, 0], curve: "straight" })).toThrow(/^messageArrow: the drawing overflows/);
    expect(() => P.stationMarker({ cx: -1.7e308, cy: 0, to: [1.7e308, 0] })).toThrow(/^stationMarker: the drawing overflows/);
  });

  test("Large but finite", () => {
    const svg = toSvg(P.stationMarker({ cx: 1e15, cy: 0 }).body[1] as SvgNode);
    expect(svg).toContain('cx="1000000000000000"');
  });
});

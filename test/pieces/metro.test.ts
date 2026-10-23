// Unit tests of the ink sticker, the data colours and the metro pieces (spec
// illustration-pieces, change metro-and-diagram-pieces; tasks 2.1 to 2.3 and
// 3.1). Each test title is the spec scenario it proves.
import { describe, expect, test } from "vitest";
import { countBadge, lineBadge, nodeBlock, pipe, stationMarker } from "../../src/pieces/metro";
import type { SvgNode } from "../../src/pieces/node";

const attrs = (node: SvgNode) => node.attrs as Record<string, string | number>;
/** Every number in a path's d attribute, as [x, y] pairs. */
const pairs = (d: string): [number, number][] => {
  const numbers = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
  const out: [number, number][] = [];
  for (let i = 0; i + 1 < numbers.length; i += 2) out.push([numbers[i], numbers[i + 1]]);
  return out;
};

describe("Ink sticker on a surface", () => {
  test("Light sticker", () => {
    const { body } = stationMarker({ cx: 100, cy: 50 });
    expect(body.map((node) => node.tag)).toEqual(["circle", "circle"]);
    expect(body[0].attrs).toEqual({ cx: 103.5, cy: 53.5, r: 12, fill: "#0A1033", stroke: "#0A1033", "stroke-width": 3 });
    expect(body[1].attrs).toEqual({ cx: 100, cy: 50, r: 12, fill: "#FFFFFF", stroke: "#0A1033", "stroke-width": 3 });
  });

  test("Dark sticker with its rim", () => {
    const { body } = stationMarker({ cx: 100, cy: 50, surface: "dark" });
    expect(body).toHaveLength(3);
    expect(body[0].attrs).toMatchObject({ cx: 103.5, cy: 53.5, fill: "#4C5CB8", stroke: "#4C5CB8", "stroke-width": 5 });
    expect(body[1].attrs).toMatchObject({ cx: 100, cy: 50, fill: "#EEF2FF", stroke: "#EEF2FF", "stroke-width": 5 });
    expect(body[2].attrs).toMatchObject({ cx: 100, cy: 50, fill: "#FFFFFF", stroke: "#0A1033", "stroke-width": 3 });
  });

  test("Ink scale and its bounds", () => {
    const { body } = nodeBlock({ x: 0, y: 0, width: 200, title: "a", inkScale: 1.6 });
    expect(attrs(body[0])).toMatchObject({ x: 5.6, y: 5.6, "stroke-width": 4.8 });
    expect(attrs(body[1])).toMatchObject({ x: 0, y: 0, "stroke-width": 4.8 });
    expect(() => nodeBlock({ x: 0, y: 0, width: 200, title: "a", inkScale: 0.1 })).toThrow(/^nodeBlock: inkScale:/);
    expect(() => nodeBlock({ x: 0, y: 0, width: 200, title: "a", inkScale: 9 })).toThrow(/^nodeBlock: inkScale:/);
  });

  test("Unknown surface or a parameter a piece does not take", () => {
    expect(() => countBadge({ cx: 0, cy: 0, text: "3", surface: "sepia" as "dark" })).toThrow(/^countBadge: surface: expected one of light, dark/);
    expect(() => pipe({ d: "M0,0 L1,0", fill: "color.caller", surface: "dark" } as never)).toThrow(/^pipe: surface: unknown parameter/);
  });
});

describe("Room for the outline", () => {
  test("Badge too low for its ink", () => {
    expect(() => lineBadge({ x: 0, y: 0, text: "SH", fill: "color.healthy", flat: true, inkScale: 8 })).toThrow(/^lineBadge: height: leaves no room for the outline/);
    const { body } = lineBadge({ x: 0, y: 0, text: "SH", fill: "color.healthy", flat: true, inkScale: 8, height: 96, width: 120 });
    expect(body).toHaveLength(1);
    expect(body[0].attrs).toMatchObject({ x: -48, y: -36, width: 96, height: 72, "stroke-width": 24 });
  });

  test("Placeholder without ink", () => {
    const { body } = nodeBlock({ x: 0, y: 0, width: 40, height: 20, radius: 0, title: "Nothing", state: "placeholder", inkScale: 8 });
    expect(body).toHaveLength(1);
    expect(body[0].attrs["stroke-dasharray"]).toBe("5 4");
  });
});

describe("Line colours from data", () => {
  test("Catalogue line colour", () => {
    const { body } = pipe({ d: "M0,0 L100,0", fill: "#7B3FE4" });
    expect(body.map((node) => [node.attrs.stroke, node.attrs["stroke-width"]])).toEqual([
      ["#0A1033", 18],
      ["#7B3FE4", 12],
    ]);
  });

  test("Not a data colour", () => {
    for (const fill of ["#7B3FE4; onload", "red", "url(#x)"]) {
      expect(() => lineBadge({ x: 0, y: 0, text: "SH", fill }), fill).toThrow(/^lineBadge: fill:/);
    }
  });
});

describe("Piece parameters checked", () => {
  test("Pipe path with something else", () => {
    for (const d of ["", "L10,10", 'M0,0 L10,10" onload="x']) {
      expect(() => pipe({ d, fill: "color.caller" }), d).toThrow(/^pipe: d:/);
    }
  });
});

describe("Metro pieces", () => {
  test("Interchange capsule", () => {
    const { body } = stationMarker({ cx: 0, cy: 0, to: [40, 0] });
    const face = body.at(-1)!;
    expect(body.every((node) => node.tag === "path")).toBe(true);
    const d = String(face.attrs.d);
    expect(d.match(/A14,14 /g)).toHaveLength(2);
    expect(d.trim().endsWith("Z")).toBe(true);
    // Arc end points and line points: the capsule's extremes, before the arcs bulge out to x -14 and 54.
    const points = pairs(d.replace(/A14,14 0 0 0 /g, "L"));
    expect(Math.min(...points.map((p) => p[1]))).toBe(-14);
    expect(Math.max(...points.map((p) => p[1]))).toBe(14);
    expect(points.map((p) => p[0]).every((x) => x >= 0 && x <= 40)).toBe(true);
    // Each arc joins the two sides 28 apart through a half circle of radius 14 round an end, so the
    // capsule spans x -14 (round (0, 0)) to 54 (round (40, 0)).
    expect(d).toContain("L40,14 A14,14 0 0 0 40,-14");
    expect(d).toContain("L0,-14 A14,14 0 0 0 0,14");
  });

  test("Interchange whose ends almost meet", () => {
    // The shadow's offset must not collapse a tiny segment: no NaN anywhere.
    const { body } = stationMarker({ cx: 0, cy: 0, to: [1e-16, 0] });
    expect(JSON.stringify(body)).not.toMatch(/NaN|Infinity/);
  });

  test("Interchange at one point", () => {
    const { body } = stationMarker({ cx: 5, cy: 5, to: [5, 5] });
    expect(body.at(-1)!.attrs).toMatchObject({ cx: 5, cy: 5, r: 14 });
    expect(body.at(-1)!.tag).toBe("circle");
  });

  test("Flat badge", () => {
    const { body, text } = lineBadge({ x: 50, y: 20, text: "SH", fill: "color.healthy", flat: true });
    expect(body).toHaveLength(1);
    expect(body[0].attrs).toMatchObject({ y: 11.5, height: 17, rx: 8.5 });
    expect(text[0].children).toEqual(["SH"]);
    expect(text[0].attrs.fill).toBe("#FFFFFF");
  });

  test("Badge narrower than tall", () => {
    expect(() => lineBadge({ x: 0, y: 0, text: "SH", fill: "color.healthy", width: 10 })).toThrow(/^lineBadge: width: must be at least the height \(20\)/);
    expect(() => lineBadge({ x: 0, y: 0, text: "SH", fill: "color.healthy", height: 96 })).toThrow(/^lineBadge: width:/);
  });

  test("Pipe widths out of range", () => {
    for (const extra of [{ width: 0 }, { width: 101 }, { casing: -1 }, { casing: 51 }]) {
      expect(() => pipe({ d: "M0,0 L1,0", fill: "color.caller", ...extra }), JSON.stringify(extra)).toThrow(/^pipe: (width|casing):/);
    }
    expect(pipe({ d: "M0,0 L1,0", fill: "color.caller", width: 0.001, casing: 0 }).body[0].attrs["stroke-width"]).toBe(0.001);
    const { body } = pipe({ d: "M0,0 L1,0", fill: "color.caller", casing: 0 });
    expect(body).toHaveLength(1);
    expect(body[0].attrs.stroke).toBe("#8FB2FF");
  });

  test("Count shape follows its size", () => {
    expect(countBadge({ cx: 0, cy: 0, text: "3" }).body.at(-1)!.attrs).toMatchObject({ r: 8 });
    const many = countBadge({ cx: 0, cy: 0, text: "12" }).body.at(-1)!;
    expect(many.tag).toBe("rect");
    expect(Number(many.attrs.width)).toBeGreaterThan(16);
    expect(many.attrs.rx).toBe(8);
    expect(countBadge({ cx: 0, cy: 0, text: "3", width: 40 }).body.at(-1)!.attrs).toMatchObject({ width: 40 });
  });
});

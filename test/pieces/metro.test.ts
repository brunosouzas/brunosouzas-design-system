// Unit tests of the ink sticker, the data colours and the metro pieces (spec
// illustration-pieces, change metro-and-diagram-pieces; tasks 2.1 to 2.3 and
// 3.1). Each test title is the spec scenario it proves.
import { describe, expect, test } from "vitest";
import { countBadge, ledgerMark, licenceMark, lineBadge, nodeBlock, pipe, renewalRing, stationMarker, suggestedHalo, zone } from "../../src/pieces/metro";
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
    expect(body[0].attrs).toEqual({ cx: 103.5, cy: 53.5, r: 12, fill: "#0A1033", stroke: "#0A1033", "stroke-width": 3, "stroke-linejoin": "round" });
    expect(body[1].attrs).toEqual({ cx: 100, cy: 50, r: 12, fill: "#FFFFFF", stroke: "#0A1033", "stroke-width": 3, "stroke-linejoin": "round" });
  });

  test("Dark sticker with its rim", () => {
    const { body } = stationMarker({ cx: 100, cy: 50, surface: "dark" });
    expect(body).toHaveLength(3);
    expect(body[0].attrs).toMatchObject({ cx: 103.5, cy: 53.5, fill: "#4C5CB8", stroke: "#4C5CB8", "stroke-width": 5 });
    expect(body[1].attrs).toMatchObject({ cx: 100, cy: 50, fill: "#EEF2FF", stroke: "#EEF2FF", "stroke-width": 5 });
    expect(body[2].attrs).toMatchObject({ cx: 100, cy: 50, fill: "#FFFFFF", stroke: "#0A1033", "stroke-width": 3 });
    // Every layer carries its own stroke attributes, so a parent group (miter joins, another width) does not change it.
    expect(body.every((node) => node.attrs["stroke-linejoin"] === "round" && node.attrs["stroke-width"] !== undefined)).toBe(true);
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
    expect(() => ledgerMark({ x: 0, y: 0, inkScale: 2 } as never)).toThrow(/^ledgerMark: inkScale: unknown parameter/);
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
    expect(() => zone({ points: [[0, 0]], fill: "red" })).toThrow(/^zone: fill:/);
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

// ---------- change stackledger-map-and-link-pieces (AB#167), tasks 2.1 to 2.3 and 4.2 ----------

const strokes = (body: readonly SvgNode[]) => body.map((node) => [node.attrs.stroke, node.attrs["stroke-width"]]);

describe("Renewal ring", () => {
  test("Light ring", () => {
    const { body, text } = renewalRing({ cx: 0, cy: 0, r: 18 });
    expect(body.every((node) => node.tag === "circle" && node.attrs.r === 18 && node.attrs.fill === "none")).toBe(true);
    expect(strokes(body)).toEqual([["#0A1033", 6], ["#FF8A3D", 3]]);
    expect(text).toEqual([]);
  });

  test("Dark ring with its rim", () => {
    expect(strokes(renewalRing({ cx: 0, cy: 0, r: 18, surface: "dark" }).body)).toEqual([["#EEF2FF", 8], ["#0A1033", 6], ["#FF8A3D", 3]]);
  });

  test("Ring too small for its bands", () => {
    expect(renewalRing({ cx: 0, cy: 0, r: 3 }).body).toHaveLength(2);
    expect(() => renewalRing({ cx: 0, cy: 0, r: 3.9, surface: "dark" })).toThrow(/^renewalRing: r: leaves no room for the ring's bands: needs at least 4/);
    expect(() => renewalRing({ cx: 0, cy: 0, r: 18, width: 0 })).toThrow(/^renewalRing: width:/);
    expect(() => renewalRing({ cx: 0, cy: 0, r: 18, width: 51 })).toThrow(/^renewalRing: width:/);
    // A valid hairline keeps its width (Codex code review round 2).
    expect(renewalRing({ cx: 0, cy: 0, r: 18, width: 0.001 }).body.at(-1)!.attrs["stroke-width"]).toBe(0.001);
    expect(suggestedHalo({ cx: 0, cy: 0, r: 0.001 }).body[0].attrs.r).toBe(0.001);
  });
});

describe("Suggested halo", () => {
  test("Halo on both surfaces", () => {
    for (const [surface, stroke] of [["light", "#5B6694"], ["dark", "#8F9BD0"]] as const) {
      const { body } = suggestedHalo({ cx: 0, cy: 0, r: 21, surface });
      expect(body).toHaveLength(1);
      expect(body[0].attrs).toEqual({ cx: 0, cy: 0, r: 21, fill: "none", stroke, "stroke-width": 1.5, "stroke-dasharray": "4 3" });
    }
  });

  test("Halo without a radius", () => {
    expect(() => suggestedHalo({ cx: 0, cy: 0 } as never)).toThrow(/^suggestedHalo: r: missing required parameter/);
    expect(() => suggestedHalo({ cx: 0, cy: 0, r: 0 })).toThrow(/^suggestedHalo: r:/);
    expect(() => suggestedHalo({ cx: 0, cy: 0, r: 21, inkScale: 1 } as never)).toThrow(/^suggestedHalo: inkScale: unknown parameter/);
  });
});

describe("Licence mark", () => {
  test("Owned licence", () => {
    const { body } = licenceMark({ cx: 27, cy: -15 });
    expect(body).toHaveLength(2);
    expect(body[0].attrs).toMatchObject({ cx: 30.5, cy: -11.5, r: 5, fill: "#0A1033", stroke: "#0A1033", "stroke-width": 3 });
    expect(body[1].attrs).toMatchObject({ cx: 27, cy: -15, r: 5, fill: "#3DDC84", stroke: "#0A1033", "stroke-width": 3 });
  });

  test("Licence to buy on dark", () => {
    const { body } = licenceMark({ cx: 0, cy: 0, state: "toBuy", surface: "dark" });
    expect(body.map((node) => [node.attrs.r, node.attrs.fill])).toEqual([[5, "#4C5CB8"], [5, "#EEF2FF"], [5, "#FFFFFF"]]);
  });

  test("Unknown state", () => {
    expect(() => licenceMark({ cx: 0, cy: 0, state: "expired" as "owned" })).toThrow(/^licenceMark: state: expected one of owned, toBuy/);
  });
});

describe("Licence room", () => {
  test("Default size at the default ink", () => {
    expect(licenceMark({ cx: 0, cy: 0 }).body).toHaveLength(2);
    expect(licenceMark({ cx: 0, cy: 0, size: 9 }).body[1].attrs.r).toBe(4.5);
  });

  test("Too small for its ink", () => {
    expect(() => licenceMark({ cx: 0, cy: 0, size: 8.9 })).toThrow(/^licenceMark: size: leaves no room/);
    expect(() => licenceMark({ cx: 0, cy: 0, inkScale: 1.2 })).toThrow(/^licenceMark: size: leaves no room/);
  });
});

describe("Zone", () => {
  test("Three points", () => {
    const { body, text } = zone({ points: [[0, 0], [100, 0], [50, 80]], fill: "#7B3FE4" });
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({ tag: "g", attrs: { opacity: 0.12, stroke: "none" } });
    expect(body[0].children).toEqual([{ tag: "polygon", attrs: { points: "0,0 100,0 50,80", fill: "#7B3FE4", stroke: "#7B3FE4", "stroke-width": 64, "stroke-linejoin": "round" }, children: [] }]);
    expect(text).toEqual([]);
  });

  test("One and two points on dark", () => {
    const one = zone({ points: [[10, 20]], fill: "#7B3FE4", surface: "dark" }).body[0];
    expect(one.attrs.opacity).toBe(0.22);
    expect(one.children).toEqual([{ tag: "circle", attrs: { cx: 10, cy: 20, r: 32, fill: "#7B3FE4" }, children: [] }]);
    const two = zone({ points: [[0, 0], [100, 0]], fill: "#7B3FE4", surface: "dark" }).body[0];
    expect(two.children).toEqual([{ tag: "line", attrs: { x1: 0, y1: 0, x2: 100, y2: 0, stroke: "#7B3FE4", "stroke-width": 64, "stroke-linecap": "round" }, children: [] }]);
  });

  test("Points out of range", () => {
    expect(() => zone({ points: [], fill: "#7B3FE4" })).toThrow(/^zone: points: expected at least 1 item/);
    expect(() => zone({ points: Array.from({ length: 10001 }, () => [0, 0] as [number, number]), fill: "#7B3FE4" })).toThrow(/^zone: points: expected at most 10000 item/);
    expect(() => zone({ points: [[0, NaN]], fill: "#7B3FE4" })).toThrow(/^zone: points\[0\]:/);
  });
});

describe("Zone title", () => {
  test("Title on light and dark", () => {
    for (const [surface, fill] of [["light", "#7B3FE4"], ["dark", "#CAB2F4"]] as const) {
      const { text } = zone({ points: [[0, 0]], fill: "#7B3FE4", title: "Payments", titleAt: [-24, -56], surface });
      expect(text).toHaveLength(1);
      expect(text[0].children).toEqual(["Payments"]);
      expect(text[0].attrs).toMatchObject({ x: -24, y: -43, "font-size": 13, "font-weight": 700, fill, "text-anchor": "start" });
    }
  });

  test("Title without its position", () => {
    expect(() => zone({ points: [[0, 0]], fill: "#7B3FE4", title: "a" })).toThrow(/^zone: titleAt:/);
    expect(() => zone({ points: [[0, 0]], fill: "#7B3FE4", titleAt: [0, 0] })).toThrow(/^zone: title:/);
    expect(() => zone({ points: [[0, 0]], fill: "#7B3FE4", title: "", titleAt: [0, 0] })).toThrow(/^zone: title:/);
  });
});

describe("Badge without a letter", () => {
  test("Default badge without a letter", () => {
    const { body, text } = lineBadge({ x: 50, y: 20, fill: "color.healthy" });
    expect(body.at(-1)!.attrs).toMatchObject({ x: 35, y: 10, width: 30, height: 20, rx: 10 });
    expect(text).toEqual([]);
  });

  test("Banner badge without a letter", () => {
    const params = { x: 110, y: 300, fill: "color.healthy", height: 34, width: 54, surface: "dark", inkScale: 1.6 } as const;
    const bare = lineBadge(params);
    expect(bare.body).toEqual(lineBadge({ ...params, text: "B" }).body);
    expect(bare.text).toEqual([]);
  });

  test("Empty letter and narrow badge", () => {
    expect(() => lineBadge({ x: 0, y: 0, text: "", fill: "color.healthy" })).toThrow(/^lineBadge: text:/);
    expect(() => lineBadge({ x: 0, y: 0, fill: "color.healthy", height: 34 })).toThrow(/^lineBadge: width:/);
  });
});

// Change piece-params, task 2.2 (spec illustration-pieces, "Count badge text size").
describe("Count badge text size", () => {
  test("Larger count", () => {
    const one = countBadge({ cx: 0, cy: 0, text: "1", textSize: 22 });
    expect(one.body[1]).toMatchObject({ tag: "circle", attrs: { r: 16 } });
    expect(one.text[0].attrs).toMatchObject({ y: 8, "font-size": 22 });
    const two = countBadge({ cx: 0, cy: 0, text: "12", textSize: 22 });
    expect(two.body[1]).toMatchObject({ tag: "rect", attrs: { width: 41.6, height: 32 } });
    const given = countBadge({ cx: 0, cy: 0, text: "1", textSize: 20, height: 30 });
    expect(given.body[1]).toMatchObject({ tag: "circle", attrs: { r: 15 } });
    expect(given.text[0].attrs).toMatchObject({ y: 7.27, "font-size": 20 });
  });
  test("Count text size 11 is the default", () => {
    expect(countBadge({ cx: 13.605, cy: 0, text: "128", textSize: 11 })).toEqual(countBadge({ cx: 13.605, cy: 0, text: "128" }));
  });
  test("Count text size bounds", () => {
    const base = { cx: 0, cy: 0, text: "1" };
    const big = countBadge({ ...base, textSize: 48 });
    expect(big.body[1].attrs.r).toBe(34.91);
    expect(big.text[0].attrs).toMatchObject({ y: 17.45, "font-size": 48 });
    const small = countBadge({ ...base, textSize: 6, height: 12 });
    expect(small.body[1].attrs.r).toBe(6);
    expect(small.text[0].attrs).toMatchObject({ y: 2.18, "font-size": 6 });
    for (const textSize of [8.25, 8.249]) expect(countBadge({ ...base, textSize }).body[1].attrs.r).toBe(6);
    for (const textSize of [8.24, 5, 49]) expect(() => countBadge({ ...base, textSize })).toThrow(/^countBadge: textSize:/);
    expect(() => countBadge({ ...base, textSize: 20, height: 10 })).toThrow(/^countBadge: height:/);
  });
});

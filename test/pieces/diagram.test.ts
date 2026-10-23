// Unit tests of the diagram nodes, the message arrow and the ledger mark (spec
// illustration-pieces, change metro-and-diagram-pieces; tasks 3.2 to 3.4).
// Each test title is the spec scenario it proves.
import { describe, expect, test } from "vitest";
import { hexNode, ledgerMark, messageArrow, nodeBlock, pillNode } from "../../src/pieces/metro";

describe("Diagram nodes", () => {
  test("Default state", () => {
    const { body } = nodeBlock({ x: 0, y: 0, width: 160, title: "a" });
    expect(body.at(-1)!.attrs).toMatchObject({ fill: "#FFFFFF", stroke: "#0A1033" });
  });

  test("Node radius out of range", () => {
    expect(() => nodeBlock({ x: 0, y: 0, width: 160, title: "a", radius: -1 })).toThrow(/^nodeBlock: radius:/);
    expect(() => nodeBlock({ x: 0, y: 0, width: 160, title: "a", radius: 24 })).toThrow(/^nodeBlock: radius: must be at most half the height \(23\)/);
  });

  test("Focus node on dark", () => {
    const { body, text } = nodeBlock({ x: 0, y: 0, width: 160, title: "This item", state: "focus", surface: "dark" });
    expect(body.at(-1)!.attrs.fill).toBe("#8FB2FF");
    expect(text[0].attrs.fill).toBe("#0A1033");
  });

  test("Placeholder", () => {
    const { body, text } = hexNode({ x: 0, y: 0, width: 160, title: "Nothing", state: "placeholder" });
    expect(body).toHaveLength(1);
    expect(body[0].tag).toBe("polygon");
    expect(body[0].attrs).toMatchObject({ fill: "none", "stroke-dasharray": "5 4" });
    expect(text).toHaveLength(1);
    expect(text[0].children).toEqual(["Nothing"]);
    expect(text[0].attrs).toMatchObject({ x: 80, "text-anchor": "middle" });
  });

  test("Node too narrow, without a title, or a placeholder with a subtitle", () => {
    expect(() => pillNode({ x: 0, y: 0, width: 80, title: "a" })).toThrow(/^pillNode: width:/);
    expect(() => pillNode({ x: 0, y: 0, width: 160, title: "" })).toThrow(/^pillNode: title:/);
    expect(() => pillNode({ x: 0, y: 0, width: 160, title: "a", subtitle: "b", state: "placeholder" })).toThrow(/^pillNode: subtitle:/);
  });
});

describe("Message arrow", () => {
  test("Curved arrow with a head", () => {
    const { body } = messageArrow({ from: [0, 0], to: [200, 100] });
    expect(body[0].attrs.d).toBe("M0,0 C100,0 100,100 187.5,100");
    expect(body[1].tag).toBe("polygon");
    expect(body[1].attrs.points).toBe("200,100 187.5,105 187.5,95");
  });

  test("Vertical arrow and the fallback boundary", () => {
    const vertical = messageArrow({ from: [0, 0], to: [0, 100] });
    expect(vertical.body[0].attrs.d).toBe("M0,0 L0,87.5");
    expect(vertical.body[1].attrs.points).toBe("0,100 -5,87.5 5,87.5");
    const boundary = messageArrow({ from: [0, 0], to: [25, 100] });
    expect(String(boundary.body[0].attrs.d)).toMatch(/^M0,0 L/);
    const [tip, left, right] = String(boundary.body[1].attrs.points).split(" ").map((p) => p.split(",").map(Number));
    // The head's axis (tip to the middle of its base) runs along the segment from (0, 0) to (25, 100).
    const axis = [tip[0] - (left[0] + right[0]) / 2, tip[1] - (left[1] + right[1]) / 2];
    expect(axis[0] / axis[1]).toBeCloseTo(25 / 100, 2);
  });

  test("Labelled straight arrow", () => {
    const { body, text } = messageArrow({ from: [0, 0], to: [100, 0], curve: "straight", label: "used by" });
    expect(text).toHaveLength(1);
    expect(text[0].children).toEqual(["used by"]);
    expect(text[0].attrs).toMatchObject({ x: 50, y: 4 });
    const pill = body.find((node) => node.tag === "rect")!;
    expect(pill.attrs).toMatchObject({ y: -9, height: 18 });
    expect(Number(pill.attrs.x) + Number(pill.attrs.width) / 2).toBe(50);
  });

  test("Arrow too short", () => {
    expect(() => messageArrow({ from: [10, 10], to: [10, 10] })).toThrow(/^messageArrow: to:/);
    expect(() => messageArrow({ from: [0, 0], to: [20, 0] })).toThrow(/^messageArrow: to: is too close/);
  });
});

describe("Ledger mark", () => {
  test("Favicon size", () => {
    const { body, text } = ledgerMark({ x: 0, y: 0 });
    expect(text).toEqual([]);
    const [group] = body;
    expect(group.attrs.transform).toBe("translate(0 0) scale(1)");
    const [rect, path, big, small] = group.children as typeof body;
    expect(rect.attrs).toMatchObject({ width: 32, height: 32, rx: 7, fill: "#0A1033" });
    expect(path.attrs).toMatchObject({ d: "M7 23 L14 16 L25 16", stroke: "#1E6FEB", "stroke-width": 4.5 });
    expect(big.attrs).toMatchObject({ cx: 14, cy: 16, r: 4 });
    expect(small.attrs).toMatchObject({ cx: 25, cy: 16, r: 2.6 });
  });

  test("Scaled and too small", () => {
    const half = ledgerMark({ x: 0, y: 0, size: 16 });
    expect(half.body[0].attrs.transform).toBe("translate(0 0) scale(0.5)");
    expect(half.body[0].children).toEqual(ledgerMark({ x: 0, y: 0 }).body[0].children);
    expect(() => ledgerMark({ x: 0, y: 0, size: 8 })).toThrow(/^ledgerMark: size:/);
  });
});

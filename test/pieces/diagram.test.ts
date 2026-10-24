// Unit tests of the diagram nodes, the message arrow and the ledger mark (spec
// illustration-pieces, change metro-and-diagram-pieces; tasks 3.2 to 3.4).
// Each test title is the spec scenario it proves.
import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
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
    // AB#167: an empty subtitle is still refused; a placeholder's subtitle is not.
    expect(() => pillNode({ x: 0, y: 0, width: 160, title: "a", subtitle: "", state: "placeholder" })).toThrow(/^pillNode: subtitle:/);
    expect(pillNode({ x: 0, y: 0, width: 160, title: "a", subtitle: "agent", state: "placeholder" }).text).toHaveLength(2);
  });

  // Change stackledger-map-and-link-pieces (AB#167), task 4.1.
  test("Placeholder with a subtitle", () => {
    const { body, text } = nodeBlock({ x: 10, y: 10, width: 200, title: "Stripe", subtitle: "external service", state: "placeholder" });
    expect(body).toHaveLength(1);
    expect(body[0].attrs).toMatchObject({ x: 10, y: 10, width: 200, height: 46, fill: "none", "stroke-dasharray": "5 4" });
    expect(text.map((node) => [node.children[0], node.attrs.x, node.attrs.y, node.attrs["font-size"], node.attrs["font-weight"], node.attrs.fill, node.attrs["text-anchor"]])).toEqual([
      ["Stripe", 22, 30, 13, 700, "#5B6694", "start"],
      ["external service", 22, 47, 11, 400, "#5B6694", "start"],
    ]);
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
    // The smallest mark keeps its exact scale: 12 units, not 12.16.
    expect(ledgerMark({ x: 0, y: 0, size: 12 }).body[0].attrs.transform).toBe("translate(0 0) scale(0.375)");
  });
});

// Change stackledger-map-and-link-pieces (AB#167), task 4.3.
describe("Ledger mark on a surface", () => {
  test("Mark on a dark surface", () => {
    const light = ledgerMark({ x: 0, y: 0 }).body[0].children as unknown as { tag: string; attrs: Record<string, unknown> }[];
    const dark = ledgerMark({ x: 0, y: 0, surface: "dark" }).body[0].children as unknown as { tag: string; attrs: Record<string, unknown> }[];
    expect(dark[0]).toEqual({ tag: "rect", attrs: { x: 0, y: 0, width: 32, height: 32, rx: 7, fill: "#EEF2FF", stroke: "none" }, children: [] });
    expect(dark[1]).toEqual({ tag: "rect", attrs: { x: 2, y: 2, width: 28, height: 28, rx: 5, fill: "#0A1033", stroke: "none" }, children: [] });
    expect(dark.slice(2)).toEqual(light.slice(1));
  });

  test("Unknown surface on the mark", () => {
    expect(() => ledgerMark({ x: 0, y: 0, surface: "navy" as "dark" })).toThrow(/^ledgerMark: surface: expected one of light, dark/);
  });
});

// Change body-diagram-pieces, task 4.1: kinds and control points.
const paints = (drawn: ReturnType<typeof messageArrow>) => drawn.body.map((n) => [n.tag, n.attrs.stroke, n.attrs["stroke-dasharray"]]);
const straight = { from: [0, 0] as [number, number], to: [100, 0] as [number, number], curve: "straight" as const };

describe("Message arrow kinds", () => {
  test("Reply", () => {
    const { body } = messageArrow({ ...straight, kind: "reply" });
    expect(body[0].attrs).toEqual({ d: "M0,0 L87.5,0", fill: "none", stroke: "#0A1033", "stroke-width": 2.5, "stroke-linecap": "round", "stroke-dasharray": "6 8" });
    expect(body[1].attrs).toMatchObject({ points: "100,0 87.5,5 87.5,-5", fill: "#0A1033", stroke: "#0A1033" });
  });

  test("Failure and fail-fast", () => {
    expect(paints(messageArrow({ ...straight, kind: "failure" }))).toEqual([["path", "#E04848", "6 8"], ["polygon", "#E04848", undefined]]);
    expect(messageArrow({ ...straight, kind: "failure" }).body[1].attrs.fill).toBe("#E04848");
    expect(paints(messageArrow({ ...straight, kind: "failFast", surface: "dark" }))).toEqual([["path", "#E0661F", "6 8"], ["polygon", "#E0661F", undefined]]);
  });

  test("Message kind is the 0.3.1 drawing", () => {
    const frozen = JSON.parse(readFileSync(new URL("../fixtures/message-arrow-0.3.1.json", import.meta.url), "utf8")) as { params: Parameters<typeof messageArrow>[0]; tree: unknown }[];
    for (const { params, tree } of frozen) expect(JSON.parse(JSON.stringify(messageArrow({ ...params, kind: "message" })))).toEqual(tree);
  });

  test("Message arrow label stays plain", () => {
    expect(messageArrow({ from: [0, 0], to: [100, 0], label: "`x`" }).text[0].children).toEqual(["`x`"]);
  });
});

describe("Message arrow through control points", () => {
  test("Vertical curve", () => {
    const { body } = messageArrow({ from: [0, 0], to: [100, 100], controls: [[0, 50], [100, 50]] });
    expect(body[0].attrs.d).toBe("M0,0 C0,50 100,50 100,87.5");
    expect(body[1].attrs.points).toBe("100,100 95,87.5 105,87.5");
  });

  test("Last control point on the end", () => {
    const { body } = messageArrow({ from: [0, 0], to: [100, 100], controls: [[0, 50], [100, 100]] });
    expect(body[0].attrs.d).toBe("M0,0 C0,50 100,100 88.82,94.41");
    expect(body[1].attrs.points).toBe("100,100 86.58,98.88 91.06,89.94");
  });

  test("Controls with a curve, or three points", () => {
    expect(() => messageArrow({ from: [0, 0], to: [100, 100], controls: [[0, 50], [100, 50]], curve: "bezier" })).toThrow(/^messageArrow: controls:/);
    expect(() => messageArrow({ from: [0, 0], to: [100, 100], controls: [[0, 50], [100, 50], [1, 1]] as never })).toThrow(/^messageArrow: controls:/);
  });
});

// Change piece-params, task 2.4 (spec illustration-pieces, "Message arrow heads", "Message arrow dash").
describe("Message arrow heads", () => {
  test("Two heads on a straight arrow", () => {
    const { body } = messageArrow({ from: [0, 0], to: [100, 0], curve: "straight", heads: "both" });
    expect(body.map((n) => n.attrs.d ?? n.attrs.points)).toEqual(["M12.5,0 L87.5,0", "100,0 87.5,5 87.5,-5", "0,0 12.5,-5 12.5,5"]);
  });
  test("Head at the start of a curve", () => {
    const start = messageArrow({ from: [0, 0], to: [200, 100], heads: "start" }).body;
    expect(start.map((n) => n.attrs.d ?? n.attrs.points)).toEqual(["M12.5,0 C100,0 100,100 200,100", "0,0 12.5,-5 12.5,5"]);
    const both = messageArrow({ from: [0, 0], to: [100, 100], controls: [[0, 0], [100, 50]], heads: "both" }).body;
    expect(both[0].attrs.d).toBe("M11.18,5.59 C0,0 100,50 100,87.5");
    expect(both[2].attrs.points).toBe("0,0 13.42,1.12 8.94,10.06");
  });
  test("Heads against head and room", () => {
    const base = { from: [0, 0] as [number, number], to: [100, 0] as [number, number] };
    for (const heads of ["both", "end"] as const) expect(() => messageArrow({ ...base, head: false, heads })).toThrow(/^messageArrow: heads:/);
    expect(() => messageArrow({ ...base, heads: "up" as never })).toThrow(/^messageArrow: heads:/);
    expect(() => messageArrow({ from: [0, 0], to: [49.99, 0], heads: "both" })).toThrow(/^messageArrow: to:/);
    const { body } = messageArrow({ from: [0, 0], to: [50, 0], curve: "straight", heads: "both" });
    expect(body[0].attrs.d).toBe("M12.5,0 L37.5,0");
    expect(body.filter((n) => n.tag === "polygon")).toHaveLength(2);
  });
});

describe("Message arrow dash", () => {
  test("Solid failure and dashed message", () => {
    const base = { from: [0, 0] as [number, number], to: [100, 0] as [number, number], curve: "straight" as const };
    const solid = messageArrow({ ...base, kind: "failure", dashed: false }).body;
    expect(solid[0].attrs.stroke).toBe("#E04848");
    expect(solid[0].attrs).not.toHaveProperty("stroke-dasharray");
    expect(solid[1].attrs.fill).toBe("#E04848");
    const dashed = messageArrow({ ...base, dashed: true }).body[0].attrs;
    expect(dashed.stroke).toBe("#0A1033");
    expect(Object.entries(dashed).at(-1)).toEqual(["stroke-dasharray", "6 8"]);
    expect(() => messageArrow({ ...base, dashed: "no" as never })).toThrow(/^messageArrow: dashed:/);
  });
});

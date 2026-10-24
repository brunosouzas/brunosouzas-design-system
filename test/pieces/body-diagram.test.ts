// Unit tests of the body diagram pieces (spec illustration-pieces, change
// body-diagram-pieces, task 3.1). Each test title is the spec scenario it proves.
import { describe, expect, test } from "vitest";
import { altFrame, decisionNode, diagramBox, edgeLabel, exchangeNode, lifeline, phaseBand, queueNode, stateStart, storeNode, taggedContainer } from "../../src/pieces/diagram";
import { coverTree } from "../../src/pieces/cover";
import { pill } from "../../src/pieces/library";
import { toSvg } from "../../src/pieces/render";
import { messageArrow } from "../../src/pieces/metro";
import type { SvgNode } from "../../src/pieces/node";

const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
const at = (node: SvgNode) => [node.attrs.x, node.attrs.y];
const word = (node: SvgNode) => node.children[0];

describe("Diagram shapes", () => {
  test("Default diagram box", () => {
    const { body, text } = diagramBox({ x: 0, y: 0, width: 120, text: ["Orders API"] });
    expect(body.map((n) => n.attrs)).toEqual([
      { x: 3.5, y: 3.5, width: 120, height: 46, rx: 10, fill: "#0A1033", stroke: "#0A1033", "stroke-width": 3, "stroke-linejoin": "round" },
      { x: 0, y: 0, width: 120, height: 46, rx: 10, fill: "#FFFFFF", stroke: "#0A1033", "stroke-width": 3, "stroke-linejoin": "round" },
    ]);
    expect(text).toHaveLength(1);
    expect(text[0].attrs).toMatchObject({ x: 60, y: 27.5, fill: "#0A1033", "font-size": 13, "font-weight": 700, "text-anchor": "middle" });
    expect(text[0].children).toEqual(["Orders API"]);
  });

  test("Diamond", () => {
    const { body, text } = decisionNode({ x: 0, y: 0, width: 200, height: 100, text: ["Seen before?"] });
    expect(body.map((n) => n.attrs.points)).toEqual(["103.5,3.5 203.5,53.5 103.5,103.5 3.5,53.5", "100,0 200,50 100,100 0,50"]);
    expect(at(text[0])).toEqual([100, 54.5]);
  });

  test("Cylinder", () => {
    const { body, text } = storeNode({ x: 0, y: 0, width: 100, height: 60, text: ["IDs"] });
    expect(body.map((n) => n.attrs.d)).toEqual(["M3.5,11.5 A50,8 0 0 1 103.5,11.5 V55.5 A50,8 0 0 1 3.5,55.5 Z", "M0,8 A50,8 0 0 1 100,8 V52 A50,8 0 0 1 0,52 Z", "M0,8 A50,8 0 0 0 100,8"]);
    expect(body[2].attrs).toMatchObject({ fill: "none", stroke: "#0A1033", "stroke-width": 2.25 });
    expect(at(text[0])).toEqual([50, 38.5]);
  });

  test("Queue", () => {
    const { body } = queueNode({ x: 0, y: 0, width: 100, text: ["orders"] });
    expect(body.slice(0, 2).map((n) => [n.attrs.width, n.attrs.height, n.attrs.rx])).toEqual([[100, 46, 6], [100, 46, 6]]);
    expect(body.at(-1)!.attrs).toEqual({ d: "M10,0 V46 M90,0 V46", fill: "none", stroke: "#0A1033", "stroke-width": 2.25 });
  });

  test("Exchange", () => {
    expect(exchangeNode({ x: 0, y: 0, width: 120, text: ["exchange"] }).body[1].attrs.points).toBe("11.96,0 108.04,0 120,23 108.04,46 11.96,46 0,23");
  });

  test("Shape limits", () => {
    expect(() => diagramBox({ x: 0, y: 0, width: 120, text: ["a"], radius: 30 })).toThrow(/^diagramBox: radius:/);
    expect(() => storeNode({ x: 0, y: 0, width: 100, height: 60, text: ["a"], ry: 20 })).toThrow(/^storeNode: ry:/);
    expect(() => queueNode({ x: 0, y: 0, width: 40, text: ["a"] })).toThrow(/^queueNode: width:/);
    expect(() => diagramBox({ x: 0, y: 0, width: 120, text: ["a", "b", "c", "d"] })).toThrow(/^diagramBox: text:/);
    expect(() => diagramBox({ x: 0, y: 0, width: 120, text: ["a", ""] })).toThrow(/^diagramBox: text\[1\]:/);
    expect(() => diagramBox({ x: 0, y: 0, width: 120, text: ["a"], shape: "pill", radius: 5 })).toThrow(/^diagramBox: radius:/);
  });

  test("First limit wins", () => {
    expect(() => diagramBox({ x: 0, y: 0, width: 120, height: 10, radius: 30, text: ["a"] })).toThrow(/^diagramBox: height:/);
    expect(() => messageArrow({ from: [0, 0], to: [20, 0], controls: [[5, 0], [15, 0]], curve: "straight" })).toThrow(/^messageArrow: to:/);
  });

  test("Queue as narrow as its rails allow", () => {
    expect(() => queueNode({ x: 0, y: 0, width: 31, height: 12, text: ["a"] })).toThrow(/^queueNode: width:/);
    expect(queueNode({ x: 0, y: 0, width: 32, height: 12, text: ["a"] }).body.at(-1)!.attrs.d).toBe("M10,0 V12 M22,0 V12");
  });
});

describe("Sticker of the body diagram pieces", () => {
  test("Dark diagram box", () => {
    const { body, text } = diagramBox({ x: 0, y: 0, width: 120, text: ["Sender"], shape: "pill", surface: "dark" });
    expect(body.map((n) => [n.attrs.x, n.attrs.y, n.attrs.width, n.attrs.height, n.attrs.rx, n.attrs.fill, n.attrs.stroke, n.attrs["stroke-width"]])).toEqual([
      [3.5, 3.5, 120, 46, 23, "#4C5CB8", "#4C5CB8", 5],
      [0, 0, 120, 46, 23, "#EEF2FF", "#EEF2FF", 5],
      [0, 0, 120, 46, 23, "#1C2D74", "#0A1033", 3],
    ]);
    expect([...at(text[0]), text[0].attrs.fill]).toEqual([60, 27.5, "#EEF2FF"]);
  });

  test("Ink scale on a lifeline", () => {
    expect(() => lifeline({ x: 0, y1: 0, y2: 10, inkScale: 2 } as never)).toThrow(/^lifeline: inkScale: unknown parameter/);
  });
});

describe("Room in the body diagram pieces", () => {
  test("Diagram box too low", () => {
    expect(() => diagramBox({ x: 0, y: 0, width: 120, height: 10, text: ["a"] })).toThrow(/^diagramBox: height: leaves no room for the outline: needs at least 12/);
    expect(diagramBox({ x: 0, y: 0, width: 120, height: 12, text: ["a"] }).body[1].attrs).toMatchObject({ height: 12, rx: 6 });
  });

  test("Diamond too narrow", () => {
    expect(() => decisionNode({ x: 0, y: 0, width: 10, height: 100, text: ["a"] })).toThrow(/^decisionNode: width:/);
  });
});

describe("Diagram words", () => {
  test("Two lines and a subtitle on a fill", () => {
    const { body, text } = diagramBox({ x: 0, y: 0, width: 200, height: 70, text: ["Payment", "consumer"], subtitle: "Idempotent Receiver", fill: "color.healthy" });
    expect(body[1].attrs.fill).toBe("#3DDC84");
    expect(text.map((n) => [word(n), ...at(n), n.attrs["font-size"], n.attrs.fill])).toEqual([
      ["Payment", 100, 23.88, 13, "#0A1033"],
      ["consumer", 100, 40.13, 13, "#0A1033"],
      ["Idempotent Receiver", 100, 55.13, 11, "#0A1033"],
    ]);
  });

  // Code review round 1: the line step is not rounded before the baselines.
  test("Fractional text size", () => {
    expect(diagramBox({ x: 0, y: 0, width: 120, text: ["a", "b", "c"], textSize: 6.02 }).text[0].attrs.y).toBe(17.56);
  });

  // Code review round 1: a hole in a sparse array is a RangeError naming its index, not a TypeError.
  test("Sparse arrays", () => {
    expect(() => diagramBox({ x: 0, y: 0, width: 120, text: new Array(1) })).toThrow(/^diagramBox: text\[0\]: expected a string/);
    expect(() => edgeLabel({ x: 0, y: 0, lines: new Array(2) })).toThrow(/^edgeLabel: lines\[0\]:/);
    expect(() => altFrame({ x: 0, y: 0, width: 200, height: 100, tag: "a", sections: new Array(1) })).toThrow(/^altFrame: sections\[0\]:/);
    expect(() => messageArrow({ from: [0, 0], to: [100, 0], controls: new Array(2) as never })).toThrow(/^messageArrow: controls\[0\]:/);
    // Code review round 2: a hole inside a point.
    expect(() => messageArrow({ from: [0, 0], to: [100, 100], controls: [new Array(2), [100, 50]] as never })).toThrow(/^messageArrow: controls\[0\]: expected a point/);
    expect(() => messageArrow({ from: [0, 0], to: [100, 100], controls: [[0, 50], new Array(2)] as never })).toThrow(/^messageArrow: controls\[1\]: expected a point/);
    expect(() => messageArrow({ from: new Array(2) as never, to: [100, 100] })).toThrow(/^messageArrow: from: expected a point/);
  });

  test("Smaller text", () => {
    const { body, text } = diagramBox({ x: 0, y: 0, width: 160, height: 26, text: ["a note"], textSize: 11, radius: 6, fill: "color.transitional" });
    expect([...at(text[0]), text[0].attrs["font-size"]]).toEqual([80, 16.81, 11]);
    expect(body[1].attrs).toMatchObject({ fill: "#FFD25A", rx: 6 });
  });
});

describe("Code in words", () => {
  test("A code run inside a label", () => {
    const [node] = edgeLabel({ x: 0, y: 0, lines: ["adopts a `correlationId`"] }).text;
    expect(node.children).toEqual(["adopts a ", { tag: "tspan", attrs: { "font-family": MONO }, children: ["correlationId"] }]);
  });

  test("Only code, and an odd backtick", () => {
    expect(edgeLabel({ x: 0, y: 0, lines: ["`200 OK`"] }).text[0].children).toEqual([{ tag: "tspan", attrs: { "font-family": MONO }, children: ["200 OK"] }]);
    expect(edgeLabel({ x: 0, y: 0, lines: ["a `b"] }).text[0].children).toEqual(["a `b"]);
  });

  test("Code in a pill", () => {
    const code = pill({ x: 0, y: 0, text: "`main`" });
    expect(code.body[0].attrs.width).toBe(76);
    expect(code.text[0].children).toEqual([{ tag: "tspan", attrs: { "font-family": MONO }, children: ["main"] }]);
    expect(toSvg(code.text[0])).toBe(`<text x="0" y="7"><tspan font-family="${MONO}">main</tspan></text>`);
    const mixed = pill({ x: 0, y: 0, text: "deploy to `prod`" });
    expect(mixed.body[0].attrs.width).toBe(181);
    expect(mixed.text[0].children).toEqual(["deploy to ", { tag: "tspan", attrs: { "font-family": MONO }, children: ["prod"] }]);
    const odd = pill({ x: 0, y: 0, text: "a `b" });
    expect(odd.body[0].attrs.width).toBe(76);
    expect(odd.text[0].children).toEqual(["a `b"]);
    expect(pill({ x: 0, y: 0, text: "abcd`ef" }).body[0].attrs.width).toBe(108);
    expect(pill({ x: 0, y: 0, text: "abcd`e`f" }).body[0].attrs.width).toBe(97);
  });
});

describe("Tagged container", () => {
  test("Container with its tab", () => {
    const { body, text } = taggedContainer({ x: 0, y: 0, width: 300, height: 120, tag: "Anypoint MQ" });
    expect(body.map((n) => [n.attrs.x, n.attrs.y, n.attrs.width, n.attrs.height, n.attrs.rx, n.attrs.fill])).toEqual([
      [3.5, 3.5, 300, 120, 10, "#0A1033"],
      [0, 0, 300, 120, 10, "#FFFFFF"],
      [17.5, -8.5, 103.2, 24, 12, "#0A1033"],
      [14, -12, 103.2, 24, 12, "#FFD25A"],
    ]);
    expect([...at(text[0]), text[0].attrs["font-size"], text[0].attrs.fill]).toEqual([65.6, 4.5, 12, "#0A1033"]);
  });

  test("Tag wider than the frame", () => {
    expect(() => taggedContainer({ x: 0, y: 0, width: 100, height: 120, tag: "Anypoint MQ" })).toThrow(/^taggedContainer: width:/);
  });

  test("Room for the tab", () => {
    const base = { x: 0, y: 0, width: 300, height: 120, tag: "MQ" };
    expect(() => taggedContainer({ ...base, tagWidth: 23 })).toThrow(/^taggedContainer: tagWidth:/);
    expect(() => taggedContainer({ ...base, inkScale: 2.1 })).toThrow(/^taggedContainer: inkScale:/);
    expect(taggedContainer({ ...base, inkScale: 2 }).body[3].attrs).toMatchObject({ height: 24, "stroke-width": 6 });
  });
});

describe("Lifeline", () => {
  test("Active lifeline", () => {
    const { body, text } = lifeline({ x: 100, y1: 40, y2: 400 });
    expect(body).toEqual([{ tag: "line", attrs: { x1: 100, y1: 40, x2: 100, y2: 400, stroke: "#5B6694", "stroke-width": 1.75, "stroke-dasharray": "5 5", "stroke-linecap": "butt" }, children: [] }]);
    expect(text).toEqual([]);
  });

  test("Inactive lifeline on dark", () => {
    expect(lifeline({ x: 100, y1: 40, y2: 400, state: "inactive", surface: "dark" }).body[0].attrs).toMatchObject({ stroke: "#8F9BD0", "stroke-dasharray": "1 6", "stroke-linecap": "round" });
  });

  test("Lifeline of no length", () => {
    expect(() => lifeline({ x: 100, y1: 40, y2: 40 })).toThrow(/^lifeline: y2:/);
  });
});

describe("Phase band", () => {
  test("Band", () => {
    const { body, text } = phaseBand({ x: 0, y: 0, width: 400, text: "Circuit CLOSED", fill: "color.healthy" });
    expect(body[1].attrs).toMatchObject({ width: 400, height: 26, rx: 13, fill: "#3DDC84" });
    expect([...at(text[0]), text[0].attrs["font-size"], text[0].attrs.fill]).toEqual([200, 17.5, 13, "#0A1033"]);
  });

  test("Band without a fill, or too narrow", () => {
    expect(() => phaseBand({ x: 0, y: 0, width: 200, text: "x" } as never)).toThrow(/^phaseBand: fill:/);
    expect(() => phaseBand({ x: 0, y: 0, width: 20, text: "x", fill: "color.healthy" })).toThrow(/^phaseBand: width:/);
  });
});

describe("Alt frame", () => {
  test("Frame with one section", () => {
    const { body, text } = altFrame({ x: 0, y: 0, width: 300, height: 200, tag: "alt", condition: "[found]", sections: [{ y: 120, tag: "else", condition: "[not found]" }] });
    expect(body[0].attrs).toEqual({ x: 0, y: 0, width: 300, height: 200, rx: 7, fill: "none", stroke: "#0A1033", "stroke-width": 1.75 });
    expect(body[1].attrs).toEqual({ x1: 0, y1: 120, x2: 300, y2: 120, stroke: "#0A1033", "stroke-width": 1.4, "stroke-dasharray": "4 4" });
    expect(body.slice(2).map((n) => [n.attrs.x, n.attrs.y, n.attrs.width, n.attrs.height, n.attrs.fill])).toEqual([
      [7, 6, 33.2, 17, "#0A1033"],
      [42.2, 7.5, 51.4, 14, "#EEF2FF"],
      [7, 126, 39.6, 17, "#0A1033"],
      [48.6, 127.5, 76.2, 14, "#EEF2FF"],
    ]);
    expect(text.map((n) => [word(n), ...at(n)])).toEqual([["alt", 23.6, 18.5], ["[found]", 46.2, 18.5], ["else", 26.8, 138.5], ["[not found]", 52.6, 138.5]]);
    expect(text[0].attrs).toMatchObject({ fill: "#FFFFFF", "font-size": 10, "font-weight": 900 });
  });

  test("Measured widths in a section", () => {
    const { body, text } = altFrame({ x: 0, y: 0, width: 300, height: 200, tag: "alt", sections: [{ y: 120, tag: "else", condition: "[not found]", tagWidth: 50, conditionWidth: 90 }] });
    expect(body.slice(-2).map((n) => [n.attrs.x, n.attrs.y, n.attrs.width])).toEqual([[7, 126, 50], [59, 127.5, 90]]);
    expect(at(text.at(-1)!)).toEqual([63, 138.5]);
  });

  test("Section outside the frame", () => {
    expect(() => altFrame({ x: 0, y: 0, width: 300, height: 200, tag: "alt", sections: [{ y: 200, tag: "else" }] })).toThrow(/^altFrame: sections\[0\]\.y:/);
  });
});

describe("Edge label", () => {
  test("Two lines on a backdrop", () => {
    const { body, text } = edgeLabel({ x: 100, y: 50, lines: ["request", "X-ID"], backdrop: true });
    expect(body.map((n) => n.attrs)).toEqual([
      { x: 74.3, y: 40, width: 51.4, height: 14, rx: 3, fill: "#EEF2FF", stroke: "none" },
      { x: 83.6, y: 53, width: 32.8, height: 14, rx: 3, fill: "#EEF2FF", stroke: "none" },
    ]);
    expect(text.map((n) => [word(n), ...at(n), n.attrs["font-size"], n.attrs["font-weight"], n.attrs["text-anchor"]])).toEqual([
      ["request", 100, 50, 11, 700, "middle"],
      ["X-ID", 100, 63, 11, 700, "middle"],
    ]);
  });

  test("Anchored at the end with a measured width", () => {
    const { body, text } = edgeLabel({ x: 100, y: 50, lines: ["delivery 1"], anchor: "end", backdrop: true, width: 80 });
    expect([body[0].attrs.x, body[0].attrs.y, body[0].attrs.width, body[0].attrs.height]).toEqual([24, 40, 80, 14]);
    expect(text[0].attrs["text-anchor"]).toBe("end");
  });

  test("Backticks do not count in the estimate", () => {
    const [rect] = edgeLabel({ x: 0, y: 0, lines: ["`200 OK`"], backdrop: true }).body;
    expect([rect.attrs.x, rect.attrs.y, rect.attrs.width]).toEqual([-22.6, -10, 45.2]);
  });

  test("Too many lines", () => {
    expect(() => edgeLabel({ x: 0, y: 0, lines: ["a", "b", "c", "d", "e"] })).toThrow(/^edgeLabel: lines:/);
  });

  test("Text size bounds", () => {
    expect(() => edgeLabel({ x: 0, y: 0, lines: ["a"], textSize: 49 })).toThrow(/^edgeLabel: textSize:/);
    expect(() => phaseBand({ x: 0, y: 0, width: 200, text: "a", fill: "color.healthy", textSize: 5 })).toThrow(/^phaseBand: textSize:/);
    expect(edgeLabel({ x: 0, y: 0, lines: ["a"], textSize: 48 }).text[0].attrs["font-size"]).toBe(48);
  });
});

// Change designer-formats (AB#173), illustration-pieces "State start".
describe("State start", () => {
  test("Default start dot", () => {
    const { body, text } = stateStart({ cx: 30.8, cy: 84 });
    expect(body).toEqual([{ tag: "circle", attrs: { cx: 30.8, cy: 84, r: 7.7, fill: "#0A1033", stroke: "none" }, children: [] }]);
    expect(toSvg(body[0])).toBe('<circle cx="30.8" cy="84" r="7.7" fill="#0A1033" stroke="none"/>');
    expect(text).toEqual([]);
  });

  test("Start dot on the dark surface", () => {
    const { body } = stateStart({ cx: 0, cy: 0, r: 11, surface: "dark" });
    expect(body[0].attrs).toMatchObject({ r: 11, fill: "#EEF2FF" });
  });

  test("Start dot inside the outlined group", () => {
    const tree = coverTree({ id: "s", title: "t", description: "d", background: "navy", rings: { cx: 0, cy: 0 }, pieces: [{ piece: "stateStart", cx: 10, cy: 10 }] });
    const outlined = tree.children.find((c) => typeof c !== "string" && c.tag === "g" && c.attrs["stroke-width"] === 4) as SvgNode;
    expect(outlined.attrs.stroke).toBe("#0A1033");
    expect((outlined.children[0] as SvgNode).attrs.stroke).toBe("none");
  });

  test("Bad radius", () => {
    expect(() => stateStart({ cx: 0, cy: 0, r: 0 })).toThrow(RangeError);
    expect(() => stateStart({ cx: 0, cy: 0, r: 0 })).toThrow(/\br\b/);
    expect(() => stateStart({ cx: 0 } as never)).toThrow(/cy/);
  });
});

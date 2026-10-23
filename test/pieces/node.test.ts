// Unit tests of the node contract and its guards (spec illustration-pieces;
// tasks 2.1). Each test title is the spec scenario it proves.
import { describe, expect, test } from "vitest";
import { tokens } from "../../tokens/generated/tokens";
import { lineBadge, pill, sheet } from "../../src/pieces/library";
import { SVG_TAGS, el, shadowed } from "../../src/pieces/node";

describe("SVG node tree", () => {
  test("Shapes and words apart", () => {
    const drawn = pill({ x: 132, y: 174, text: "request" });
    expect(drawn.body).toHaveLength(1);
    expect(drawn.body[0]).toMatchObject({ tag: "rect", attrs: { height: 36 } });
    expect(drawn.text).toEqual([{ tag: "text", attrs: { x: 132, y: 181 }, children: ["request"] }]);
  });

  // Change body-diagram-pieces, task 2.1: a tspan is a tag of the tree.
  test("Tspan inside a text node", () => {
    expect(SVG_TAGS).toContain("tspan");
    const node = el("text", {}, "a ", el("tspan", { "font-family": "x" }, "b"));
    expect(node.children[1]).toMatchObject({ tag: "tspan", children: ["b"] });
  });

  test("Non-finite number", () => {
    expect(() => pill({ x: Number.NaN, y: 1, text: "a" })).toThrow(new RangeError("pill: x: expected a finite number, found null"));
    expect(() => pill({ x: 1, y: 1, text: "a", width: Number.POSITIVE_INFINITY })).toThrow(/^pill: width: expected a finite number/);
  });
});

describe("Colours only from tokens", () => {
  test("Hex passed as a colour", () => {
    expect(() => pill({ x: 1, y: 1, text: "a", fill: "#FFFFFF" })).toThrow(new RangeError("pill: fill: colour literals are not allowed; use a token path"));
    expect(() => pill({ x: 1, y: 1, text: "a", fill: "outline.block" })).toThrow(/^pill: fill: expected a colour token path such as color\.healthy/);
  });

  // change bend-radius-and-current-colour, task 2.1: only uiIcon.colour takes currentColor.
  test("Current colour elsewhere", () => {
    expect(() => pill({ x: 1, y: 1, text: "a", fill: "currentColor" })).toThrow(/^pill: fill: /);
    expect(() => lineBadge({ x: 1, y: 1, text: "SH", fill: "currentColor" })).toThrow(/^lineBadge: fill: /);
  });
});

describe("Hard shadow with the outline", () => {
  test("Default shadow", () => {
    const drawn = sheet({ x: 300, y: 112, width: 200, height: 222, rows: [{ bar: 60 }] });
    expect(drawn.body[0]).toEqual({
      tag: "rect",
      attrs: { x: 300, y: 112, width: 200, height: 222, rx: 14, fill: tokens.color.ink, transform: "translate(10 10)" },
      children: [],
    });
    expect(drawn.body[1]).toMatchObject({ tag: "rect", attrs: { x: 300, y: 112, fill: tokens.color.white } });
  });

  test("Shadow of a turned shape", () => {
    const [shadow] = shadowed(el("rect", { width: 10, height: 10, transform: "rotate(30)" }), 8);
    expect(shadow.attrs.transform).toBe("translate(8 8) rotate(30)");
  });
});

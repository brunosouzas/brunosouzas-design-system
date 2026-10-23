// Unit tests of the node contract and its guards (spec illustration-pieces;
// tasks 2.1). Each test title is the spec scenario it proves.
import { describe, expect, test } from "vitest";
import { tokens } from "../../tokens/generated/tokens";
import { pill, sheet } from "../../src/pieces/library";

describe("SVG node tree", () => {
  test("Shapes and words apart", () => {
    const drawn = pill({ x: 132, y: 174, text: "request" });
    expect(drawn.body).toHaveLength(1);
    expect(drawn.body[0]).toMatchObject({ tag: "rect", attrs: { height: 36 } });
    expect(drawn.text).toEqual([{ tag: "text", attrs: { x: 132, y: 181 }, children: ["request"] }]);
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
});

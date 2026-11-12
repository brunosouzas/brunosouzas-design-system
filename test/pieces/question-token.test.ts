// Unit tests of `questionToken` (spec illustration-pieces, "Question token",
// "Question token parameters"; change sdd-scene-pieces, task 4.1). Each test
// title is the spec scenario it proves.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { questionToken, sheet } from "../../src/pieces/library";
import { g, type SvgNode } from "../../src/pieces/node";
import { toReact } from "../../src/pieces/react";
import { toSvg } from "../../src/pieces/render";
import { tokens } from "../../tokens/generated/tokens";
import { normalForm } from "./normal-form";

const kids = (node: SvgNode): SvgNode[] => node.children.filter((child): child is SvgNode => typeof child !== "string");
/** Every node of a tree, depth first. */
const nodesOf = (nodes: readonly SvgNode[]): SvgNode[] => nodes.flatMap((node) => [node, ...nodesOf(kids(node))]);
const call = (params: Record<string, unknown>) => (questionToken as unknown as (p: Record<string, unknown>) => ReturnType<typeof questionToken>)(params);

describe("Question token", () => {
  test("Default token", () => {
    const { body, text } = questionToken({ cx: 100, cy: 50 });
    expect(body).toEqual([
      { tag: "g", attrs: { "data-piece": "questionToken" }, children: [{ tag: "circle", attrs: { cx: 100, cy: 50, r: 13, fill: "#FFFFFF", stroke: "#121212", "stroke-width": 3 }, children: [] }] },
    ]);
    expect(text).toEqual([
      {
        tag: "g",
        attrs: { "data-piece": "questionToken" },
        children: [{ tag: "text", attrs: { x: 100, y: 57, "font-family": tokens.font.sans, "font-size": 19, "font-weight": 900, fill: "#121212", "text-anchor": "middle" }, children: ["?"] }],
      },
    ]);
  });

  test("Same mark as a sheet's question row", () => {
    const page = sheet({ x: 0, y: 0, width: 100, height: 100, rows: [{ lead: "question", bar: 40 }] });
    const marks = page.body.find((node) => node.tag === "g" && node.attrs["stroke-width"] === tokens.outline.small)!;
    const rowCircle = kids(marks).find((node) => node.tag === "circle")!;
    const token = questionToken({ cx: 30, cy: 57 });
    const tokenCircle = kids(token.body[0])[0];
    for (const attr of ["cx", "cy", "r", "fill"]) expect(tokenCircle.attrs[attr], attr).toBe(rowCircle.attrs[attr]);
    expect(tokenCircle.attrs["stroke-width"]).toBe(marks.attrs["stroke-width"]);
    const rowGlyph = page.text[0];
    const tokenGlyph = kids(token.text[0])[0];
    for (const glyph of [rowGlyph, tokenGlyph]) {
      expect(glyph.attrs).toMatchObject({ x: 30, y: 64, "font-size": 19, "font-weight": 900 });
      expect(glyph.children).toEqual(["?"]);
    }
  });

  test("Scaled token", () => {
    const plain = questionToken({ cx: 100, cy: 50 });
    const scaled = questionToken({ cx: 100, cy: 50, scale: 2 });
    for (const group of [scaled.body[0], scaled.text[0]]) expect(group.attrs.transform).toBe("translate(100 50) scale(2) translate(-100 -50)");
    expect(kids(scaled.body[0])).toEqual(kids(plain.body[0]));
    expect(kids(scaled.text[0])).toEqual(kids(plain.text[0]));
  });

  test("Token on the dark surface", () => {
    const { body, text } = questionToken({ cx: 0, cy: 0, surface: "dark" });
    expect(kids(body[0])[0].attrs).toMatchObject({ fill: "#FFFFFF", stroke: "#ADA79D" });
    expect(kids(text[0])[0].attrs.fill).toBe("#121212");
  });

  test("Token carries its own stroke", () => {
    for (const surface of ["light", "dark"] as const) {
      for (const scale of [1, 2]) {
        const circles = nodesOf(questionToken({ cx: 0, cy: 0, surface, scale }).body).filter((node) => node.tag === "circle");
        expect(circles, `${surface} ${scale}`).toHaveLength(1);
        expect(circles[0].attrs.stroke, `${surface} ${scale}`).toBe(surface === "light" ? tokens.color.ink : tokens.surface.dark.muted);
        expect(circles[0].attrs["stroke-width"], `${surface} ${scale}`).toBe(tokens.outline.small);
      }
    }
  });

  test("Same token through React", () => {
    for (const params of [{ cx: 100, cy: 50 }, { cx: 0, cy: 0, surface: "dark" as const }, { cx: 100, cy: 50, scale: 2 }]) {
      const { body, text } = questionToken(params);
      const root = g({}, ...body, ...text);
      expect(normalForm(renderToStaticMarkup(toReact(root))), JSON.stringify(params)).toEqual(normalForm(toSvg(root)));
    }
  });
});

describe("Question token parameters", () => {
  test("Scale bounds", () => {
    expect(() => questionToken({ cx: 0, cy: 0, scale: 0 })).toThrow(RangeError);
    expect(() => questionToken({ cx: 0, cy: 0, scale: 0 })).toThrow(/^questionToken: scale: /);
    expect(() => questionToken({ cx: 0, cy: 0, scale: 10.01 })).toThrow(/^questionToken: scale: /);
    expect(questionToken({ cx: 0, cy: 0, scale: 10 }).body).toHaveLength(1);
    expect(questionToken({ cx: 0, cy: 0, scale: 0.01 }).body).toHaveLength(1);
  });

  test("Missing position and unknown parameters", () => {
    expect(() => call({ cx: 0 })).toThrow(/^questionToken: cy: missing required parameter/);
    expect(() => call({ cx: 0, cy: 0, text: "!" })).toThrow(/^questionToken: text: unknown parameter/);
    expect(() => call({ cx: 0, cy: 0, fill: "color.white" })).toThrow(/^questionToken: fill: unknown parameter/);
    expect(() => call({ cx: 0, cy: 0, surface: "navy" })).toThrow(/^questionToken: surface: expected one of light, dark/);
    for (const params of [{ cx: 0 }, { cx: 0, cy: 0, text: "!" }, { cx: 0, cy: 0, fill: "color.white" }, { cx: 0, cy: 0, surface: "navy" }]) expect(() => call(params)).toThrow(RangeError);
  });
});

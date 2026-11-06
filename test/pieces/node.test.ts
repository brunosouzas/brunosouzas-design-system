// Unit tests of the node contract and its guards (spec illustration-pieces;
// tasks 2.1). Each test title is the spec scenario it proves.
import { describe, expect, test } from "vitest";
import { tokens } from "../../tokens/generated/tokens";
import { lineBadge, pill, PIECES, PIECE_NAMES, sheet } from "../../src/pieces/library";
import { SVG_TAGS, el, shadowed, type SvgNode } from "../../src/pieces/node";
import { REQUIRED_ONLY } from "./required-only";

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
    expect(() => pill({ x: 1, y: 1, text: "a", fill: "outline.block" })).toThrow(/^pill: fill: expected a colour token path such as color\.state\.healthy/);
  });

  // Change identity-v2-type-pieces-cleanup, task 3.6: the top-level state colours are gone (ADR 0006's alias period ended).
  test("Removed top-level state path", () => {
    expect(() => pill({ x: 1, y: 1, text: "a", fill: "color.healthy" })).toThrow(/^pill: fill: expected a colour token path such as color\.state\.healthy, found "color\.healthy"/);
  });

  // change bend-radius-and-current-colour, task 2.1: only uiIcon.colour takes currentColor.
  test("Current colour elsewhere", () => {
    expect(() => pill({ x: 1, y: 1, text: "a", fill: "currentColor" })).toThrow(/^pill: fill: /);
    expect(() => lineBadge({ x: 1, y: 1, text: "SH", fill: "currentColor" })).toThrow(/^lineBadge: fill: /);
  });
});

/** Every node of a tree, the root included. */
const nodesOf = (nodes: readonly (SvgNode | string)[]): SvgNode[] => nodes.flatMap((node) => (typeof node === "string" ? [] : [node, ...nodesOf(node.children)]));
/** `a` is an ink-filled copy of `b`, translated: the 0.6.x hard shadow. */
const isShadowOf = (a: SvgNode, b: SvgNode): boolean => {
  if (a.tag !== b.tag || a.attrs.fill !== tokens.color.ink || !/^translate\(/.test(String(a.attrs.transform ?? ""))) return false;
  const { fill: _a, transform: _t, ...rest } = a.attrs;
  const { fill: _b, transform: _u, ...other } = b.attrs;
  return JSON.stringify(rest) === JSON.stringify(other);
};

// Change identity-v2-type-pieces-cleanup (card 301), task 3.1; ADR 0009.
describe("No hard offset shadow", () => {
  test("Sheet without a shadow", () => {
    const drawn = sheet({ x: 300, y: 112, width: 200, height: 222, rows: [{ bar: 60 }] });
    expect(drawn.body[0]).toEqual({ tag: "rect", attrs: { x: 300, y: 112, width: 200, height: 222, rx: 14, fill: "#FFFFFF" }, children: [] });
    expect(nodesOf(drawn.body).filter((node) => node.attrs.fill === "#121212" && /translate/.test(String(node.attrs.transform ?? "")))).toEqual([]);
  });

  test("Every cover piece is flat", () => {
    const cover = PIECE_NAMES.slice(0, 26);
    expect(cover.at(-1)).toBe("eipIcon");
    for (const name of cover) {
      const drawn = (PIECES[name] as (params: object) => { body: readonly SvgNode[] })(REQUIRED_ONLY[name]);
      // Siblings at every level of the piece's own body.
      const groups = [{ children: drawn.body }, ...nodesOf(drawn.body)];
      for (const group of groups) {
        const children = group.children.filter((child): child is SvgNode => typeof child !== "string");
        children.slice(0, -1).forEach((node, i) => expect(isShadowOf(node, children[i + 1]), `${name}: ${JSON.stringify(node.attrs)}`).toBe(false));
      }
    }
  });

  test("Shadow of a turned shape", () => {
    const shape = el("rect", { width: 10, height: 10, transform: "rotate(30)" });
    const [shadow, own] = shadowed(shape, 8);
    expect(shadow.attrs.transform).toBe("translate(8 8) rotate(30)");
    expect(shadow.attrs.fill).toBe(tokens.color.ink);
    expect(own).toBe(shape);
    expect(shadowed(shape, 0)).toEqual([shape]);
    // Its default offset is shadow.block, 0.
    expect(shadowed(shape)).toEqual([shape]);
  });
});

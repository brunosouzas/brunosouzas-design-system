// Unit tests of `keyboard` (spec illustration-pieces, "Keyboard", "Keyboard
// parameters"; change supporting-characters, task 2.1). Each test title is the
// spec scenario it proves.
import { describe, expect, test } from "vitest";
import { keyboard } from "../../src/pieces/library";
import type { SvgNode } from "../../src/pieces/node";
import { tokens } from "../../tokens/generated/tokens";

const kids = (node: SvgNode): SvgNode[] => node.children.filter((child): child is SvgNode => typeof child !== "string");
const call = (params: Record<string, unknown>) => (keyboard as unknown as (p: Record<string, unknown>) => ReturnType<typeof keyboard>)(params);
const keysOf = (params: Record<string, unknown>) => kids(kids(call(params).body[0])[1]);

describe("Keyboard", () => {
  test("Default keyboard", () => {
    const { body, text } = keyboard({ x: 0, y: 0 });
    expect(body).toEqual([
      {
        tag: "g",
        attrs: { "data-piece": "keyboard" },
        children: [
          { tag: "rect", attrs: { x: 0, y: 0, width: 150, height: 16, rx: 6, fill: "#FFFFFF", stroke: "#121212", "stroke-width": 4, "stroke-linejoin": "round" }, children: [] },
          {
            tag: "g",
            attrs: { stroke: "none" },
            children: [16, 37, 58, 79, 100, 121].map((x) => ({ tag: "rect", attrs: { x, y: 6, width: 12, height: 4, rx: 2, fill: "#121212" }, children: [] })),
          },
        ],
      },
    ]);
    expect(text).toEqual([]);
  });

  test("Keyboard on the dark surface", () => {
    const [slab, keys] = kids(keyboard({ x: 0, y: 0, surface: "dark" }).body[0]);
    expect(slab.attrs.stroke).toBe("#ADA79D");
    expect(slab.attrs.fill).toBe("#FFFFFF");
    expect(kids(keys).map((key) => key.attrs.fill)).toEqual(Array(6).fill("#121212"));
  });

  test("Key count follows the width", () => {
    for (const [width, count] of [[80, 2], [300, 13]] as const) {
      const keys = keysOf({ x: 10, y: 20, width });
      expect(keys, `width ${width}`).toHaveLength(count);
      const last = keys[keys.length - 1];
      const slabRight = 10 + width;
      expect(slabRight - (Number(last.attrs.x) + Number(last.attrs.width)), `width ${width}`).toBeGreaterThanOrEqual(16);
      expect(last.attrs.y).toBe(26);
    }
  });

  test("Keyboard carries its own stroke", () => {
    for (const surface of ["light", "dark"] as const) {
      const root = keyboard({ x: 0, y: 0, surface }).body[0];
      const [slab, keyGroup] = kids(root);
      expect(slab.attrs.stroke, surface).toBe(surface === "light" ? tokens.color.ink : tokens.surface.dark.muted);
      expect(slab.attrs["stroke-width"], surface).toBe(tokens.outline.block);
      // Every key: a fill of its own and an ancestor group inside the piece that sets `stroke: none`.
      expect(keyGroup.tag).toBe("g");
      expect(keyGroup.attrs.stroke).toBe("none");
      for (const key of kids(keyGroup)) {
        expect(key.attrs.fill, surface).toBe(tokens.color.ink);
        expect(key.attrs.stroke, surface).toBeUndefined();
      }
      // No other shape in the piece lacks a stroke of its own or a `stroke: none` ancestor.
      const unstroked = (node: SvgNode, covered: boolean): SvgNode[] => {
        const here = covered || (node.tag === "g" && node.attrs.stroke === "none");
        return node.tag === "g" ? kids(node).flatMap((child) => unstroked(child, here)) : here || node.attrs.stroke !== undefined ? [] : [node];
      };
      expect(unstroked(root, false), surface).toEqual([]);
    }
  });
});

describe("Keyboard parameters", () => {
  test("Width bounds and unknown parameters", () => {
    for (const width of [79, 301]) expect(() => call({ x: 0, y: 0, width }), `width ${width}`).toThrow(/^keyboard: width: /);
    for (const width of [80, 300]) expect(() => call({ x: 0, y: 0, width }), `width ${width}`).not.toThrow();
    expect(() => call({ x: 0 })).toThrow(/^keyboard: y: missing required parameter/);
    expect(() => call({ x: 0, y: 0, fill: "color.white" })).toThrow(/^keyboard: fill: unknown parameter/);
    expect(() => call({ x: 0, y: 0, surface: "navy" })).toThrow(/^keyboard: surface: expected one of light, dark/);
  });
});

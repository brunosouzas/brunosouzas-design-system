// Scenario tests of the identity v2 pieces (spec illustration-pieces: "Mira
// and the pillar cast pieces", "Bank objects", "Brand notation icons",
// "Category icon"; spec design-tokens: "Cast colour is not a token"). The
// pieces shipped in 0.6.0 with only smoke entries in the catalogue test; the
// review of the archive (card 268) asked for one test per scenario. Each test
// title is the scenario it proves.
import { describe, expect, test } from "vitest";
import {
  BANK_OBJECT_NAMES,
  BRAND_NOTATION_ICON_NAMES,
  CAST_EXPRESSIONS,
  EIP_ICON_NAMES,
  bankObject,
  brandNotationIcon,
  categoryIcon,
  drone,
  eipIcon,
  kiu,
  mira,
  sinal,
  visor,
} from "../../src/pieces/index.ts";
import { skin } from "../../src/pieces/skin.ts";
import type { SvgNode } from "../../src/pieces/node.ts";
import { tokens } from "../../tokens/generated/tokens.ts";

type Tree = { readonly body: readonly SvgNode[]; readonly text: readonly SvgNode[] };
const json = (t: Tree): string => JSON.stringify(t);
const valid = (t: Tree): void => {
  expect(Array.isArray(t.body)).toBe(true);
  expect(Array.isArray(t.text)).toBe(true);
  expect(t.body.length).toBeGreaterThan(0);
};
/** Every fill and stroke colour in a tree (attribute values that look like a hex colour). */
const colours = (nodes: readonly (SvgNode | string)[], out = new Set<string>()): Set<string> => {
  // Text children are strings: they carry no colour.
  for (const n of nodes) {
    if (typeof n === "string") continue;
    for (const [k, v] of Object.entries(n.attrs ?? {})) if ((k === "fill" || k === "stroke") && typeof v === "string" && v.startsWith("#")) out.add(v);
    colours(n.children ?? [], out);
  }
  return out;
};

const CAST = { mira, visor, drone, kiu, sinal } as const;

describe("Mira and the pillar cast pieces", () => {
  test("Mira state faces", () => {
    const done = mira({ x: 0, y: 0, expression: "done" });
    const waiting = mira({ x: 0, y: 0, expression: "waiting" });
    valid(done);
    valid(waiting);
    expect(json(done)).not.toBe(json(waiting));
  });

  test("Every expression, both themes", () => {
    for (const [name, piece] of Object.entries(CAST)) {
      for (const surface of ["light", "dark"] as const) {
        const drawnTrees = CAST_EXPRESSIONS.map((expression) => piece({ x: 0, y: 0, surface, expression }));
        drawnTrees.forEach(valid);
        const trees = drawnTrees.map(json);
        expect(new Set(trees).size, `${name} ${surface}`).toBe(CAST_EXPRESSIONS.length);
      }
    }
  });

  test("Back view has no face", () => {
    expect(json(mira({ x: 0, y: 0, view: "back", expression: "done" }))).toBe(json(mira({ x: 0, y: 0, view: "back", expression: "failed" })));
  });

  test("Scale resizes without changing the drawing", () => {
    const one = mira({ x: 0, y: 0 });
    const quarter = mira({ x: 0, y: 0, scale: 0.25 });
    expect(String(quarter.body[0].attrs.transform)).toContain("scale(0.25)");
    const strip = (t: Tree) => json(t).replace(/scale\([^)]*\)/g, "scale()");
    expect(strip(quarter)).toBe(strip(one));
  });

  test("Unknown expression rejected", () => {
    expect(() => visor({ x: 0, y: 0, expression: "confused" } as never)).toThrow(RangeError);
    expect(() => visor({ x: 0, y: 0, expression: "confused" } as never)).toThrow(/expression: expected one of idle, done, waiting, failed/);
    expect(() => visor({ x: 0, y: 0, face: "confused" } as never)).toThrow(/face: unknown parameter/);
  });
});

describe("Bank objects", () => {
  test("Every bank object draws", () => {
    for (const name of BANK_OBJECT_NAMES) for (const surface of ["light", "dark"] as const) valid(bankObject({ name, x: 0, y: 0, surface }));
  });

  // Change identity-v2-type-pieces-cleanup (card 301), task 4.2: the screen shows the cast's idle eyes (I10 amended).
  test("Idle eyes on every screen", () => {
    const nodes = (n: SvgNode | string): SvgNode[] => (typeof n === "string" ? [] : [n, ...n.children.flatMap(nodes)]);
    for (const name of BANK_OBJECT_NAMES) {
      const eyesOf = (surface: "light" | "dark") => {
        const all = nodes(bankObject({ name, x: 0, y: 0, surface }).body[0]);
        const eyes = all.filter((node) => node.attrs.fill === "#FFC98A");
        // Each eye sits inside the screen it is drawn on: the rect right before them in the same group.
        const screen = all.find((node) => node.tag === "g" && node.children.some((child) => typeof child !== "string" && child.attrs.fill === "#FFC98A"))!;
        const panel = screen.children[0] as SvgNode;
        for (const eye of eyes) {
          const [x, y, w, h] = [eye.attrs.x, eye.attrs.y, eye.attrs.width, eye.attrs.height].map(Number);
          expect(x >= Number(panel.attrs.x) && x + w <= Number(panel.attrs.x) + Number(panel.attrs.width), `${name} ${surface}`).toBe(true);
          expect(y >= Number(panel.attrs.y) && y + h <= Number(panel.attrs.y) + Number(panel.attrs.height), `${name} ${surface}`).toBe(true);
        }
        return eyes;
      };
      expect(eyesOf("light"), name).toHaveLength(2);
      expect(eyesOf("dark"), name).toEqual(eyesOf("light"));
    }
  });

  test("Modulo legs", () => {
    expect(JSON.stringify(bankObject({ name: "modulo", x: 0, y: 0 }).body)).not.toContain("M-22 -40 L-32 -2 M22 -40 L32 -2");
  });

  test("Bank object has no face", () => {
    expect(() => bankObject({ name: "carga", x: 0, y: 0, face: "done" } as never)).toThrow(RangeError);
    expect(() => bankObject({ name: "carga", x: 0, y: 0, face: "done" } as never)).toThrow(/face: unknown parameter/);
  });
});

describe("Brand notation icons", () => {
  test("Two families, no shared export", () => {
    expect(brandNotationIcon).not.toBe(eipIcon);
    expect(BRAND_NOTATION_ICON_NAMES).not.toBe(EIP_ICON_NAMES);
    // The same word may name a pattern in both lists; each piece draws only its own family.
    const shared = BRAND_NOTATION_ICON_NAMES.filter((n) => (EIP_ICON_NAMES as readonly string[]).includes(n));
    for (const name of shared) expect(json(brandNotationIcon({ name, x: 0, y: 0 }))).not.toBe(json(eipIcon({ name: name as never, x: 0, y: 0 })));
  });

  test("Notation icon count", () => {
    expect(BRAND_NOTATION_ICON_NAMES).toHaveLength(19);
  });

  test("Drawing a notation icon", () => {
    valid(brandNotationIcon({ name: "contentBasedRouter", x: 100, y: 100 }));
    expect(() => brandNotationIcon({ name: "content-based-router", x: 0, y: 0 } as never)).toThrow(RangeError);
    expect(() => brandNotationIcon({ name: "content-based-router", x: 0, y: 0 } as never)).toThrow(/name: expected one of/);
  });
});

describe("Category icon", () => {
  test("Personal tools category icon", () => {
    const icon = categoryIcon({ category: "personalTools", x: 0, y: 0, surface: "light" });
    valid(icon);
    expect([...colours(icon.body)].sort()).toEqual([tokens.brand.light.accent, tokens.brand.light.text].sort());
  });

  test("Unknown category rejected", () => {
    expect(() => categoryIcon({ category: "news", x: 0, y: 0 } as never)).toThrow(RangeError);
    expect(() => categoryIcon({ category: "news", x: 0, y: 0 } as never)).toThrow(/category: expected one of/);
  });
});

describe("Cast skin (spec design-tokens)", () => {
  test("Cast colour is not a token", () => {
    expect(skin("light")).toMatchObject({ body: tokens.color.white, outline: tokens.brand.light.text, visor: tokens.brand.light.text });
    expect(skin("dark")).toMatchObject({ body: tokens.color.white, outline: tokens.brand.dark.textMuted, visor: tokens.brand.dark.bg });
    expect(Object.keys(tokens.cast)).not.toContain("mira");
  });
});

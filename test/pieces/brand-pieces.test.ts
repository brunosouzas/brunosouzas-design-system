// Scenario tests of the identity v2 pieces (spec illustration-pieces: "Mira
// and the pillar cast pieces", "Bank objects", "Brand notation icons",
// "Category icon"; spec design-tokens: "Cast colour is not a token"). The
// pieces shipped in 0.6.0 with only smoke entries in the catalogue test; the
// review of the archive (card 268) asked for one test per scenario. Each test
// title is the scenario it proves.
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import {
  BANK_OBJECT_NAMES,
  BRAND_NOTATION_ICON_NAMES,
  CAST_EXPRESSIONS,
  CATEGORY_ICON_NAMES,
  EIP_ICON_NAMES,
  bankObject,
  brandNotationIcon,
  categoryIcon,
  drone,
  eipIcon,
  kiu,
  mira,
  PIECES,
  pill,
  sheet,
  sinal,
  visor,
} from "../../src/pieces/index.ts";
import { renderToStaticMarkup } from "react-dom/server";
import { g } from "../../src/pieces/node.ts";
import { toReact } from "../../src/pieces/react.ts";
import { toSvg } from "../../src/pieces/render.ts";
import { skin } from "../../src/pieces/skin.ts";
import { normalForm } from "./normal-form.ts";
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
  // Change site-palette-and-category-badges, task 2.1.
  const root = (category: (typeof CATEGORY_ICON_NAMES)[number], extra: { x?: number; y?: number; scale?: number } = {}) => {
    const icon = categoryIcon({ category, x: extra.x ?? 0, y: extra.y ?? 0, ...(extra.scale === undefined ? {} : { scale: extra.scale }) });
    valid(icon);
    expect(icon.body).toHaveLength(1);
    return icon.body[0] as SvgNode;
  };
  const child = (node: SvgNode, i: number) => node.children[i] as SvgNode;

  test("Integration badge", () => {
    const group = root("integration");
    expect(group.attrs.transform).toBe("translate(0 0) scale(1)");
    expect(child(group, 0)).toMatchObject({ tag: "circle", attrs: { cx: 21, cy: 21, r: 19.5, fill: "#F7C6A1", stroke: "#E3AB84", "stroke-width": 1 } });
    expect(child(group, 1)).toEqual(brandNotationIcon({ name: "pointToPointChannel", x: 9, y: 9, scale: 0.5, surface: "light" }).body[0]);
    expect(group.children).toHaveLength(2);
  });

  test("Personal tools category icon", () => {
    const group = root("personalTools");
    expect(child(group, 0).attrs).toMatchObject({ fill: "#F4DD8E", stroke: "#DDC46C" });
    const glyph = child(group, 1);
    expect(glyph.attrs.transform).toBe("translate(9 9) scale(0.5)");
    expect(child(glyph, 0).attrs).toMatchObject({ d: "M12 36 L28 20 M24 12 L36 24", stroke: tokens.brand.light.text });
    expect(child(glyph, 1).attrs).toMatchObject({ stroke: tokens.brand.light.accent });
  });

  test("One track tone per category", () => {
    expect([...CATEGORY_ICON_NAMES]).toEqual(["integration", "delivery", "aiEngineering", "personalTools"]);
    expect(CATEGORY_ICON_NAMES.map((name) => child(root(name), 0).attrs.fill)).toEqual(["#F7C6A1", "#B9DEC3", "#C5CDF2", "#F4DD8E"]);
    expect(CATEGORY_ICON_NAMES.map((name) => child(root(name), 0).attrs.stroke)).toEqual(["#E3AB84", "#98C6A5", "#A5AEDA", "#DDC46C"]);
    expect(child(root("delivery"), 1)).toEqual(brandNotationIcon({ name: "gateToProduction", x: 9, y: 9, scale: 0.5, surface: "light" }).body[0]);
    expect(child(root("aiEngineering"), 1)).toEqual(brandNotationIcon({ name: "contextWindow", x: 9, y: 9, scale: 0.5, surface: "light" }).body[0]);
  });

  test("Placed and scaled", () => {
    const placed = root("delivery", { x: 10, y: 20, scale: 4 });
    expect(placed.attrs.transform).toBe("translate(10 20) scale(4)");
    expect(placed.children).toEqual(root("delivery").children);
  });

  test("Unknown category rejected", () => {
    expect(() => categoryIcon({ category: "news", x: 0, y: 0 } as never)).toThrow(RangeError);
    expect(() => categoryIcon({ category: "news", x: 0, y: 0 } as never)).toThrow(/category: expected one of/);
  });

  test("Surface no longer a parameter", () => {
    expect(() => categoryIcon({ category: "delivery", x: 0, y: 0, surface: "dark" } as never)).toThrow(RangeError);
    expect(() => categoryIcon({ category: "delivery", x: 0, y: 0, surface: "dark" } as never)).toThrow(/surface: unknown parameter/);
  });
});

describe("Cast skin (spec design-tokens)", () => {
  test("Cast colour is not a token", () => {
    expect(skin("light")).toMatchObject({ body: tokens.color.white, outline: tokens.brand.light.text, visor: tokens.brand.light.text });
    expect(skin("dark")).toMatchObject({ body: tokens.color.white, outline: tokens.brand.dark.textMuted, visor: tokens.brand.dark.bg });
    expect(Object.keys(tokens.cast)).not.toContain("mira");
  });
});

// ---------------------------------------------------------------- change sdd-scene-pieces (AB#333), tasks 5.1 and 5.2

type Node = SvgNode;
const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const kids = (node: Node): Node[] => node.children.filter((child): child is Node => typeof child !== "string");
/** Every node of a tree, depth first. */
const nodesOf = (nodes: readonly Node[]): Node[] => nodes.flatMap((node) => [node, ...nodesOf(kids(node))]);
/** Every string of a tree, depth first. */
const stringsOf = (nodes: readonly (Node | string)[]): string[] => nodes.flatMap((node) => (typeof node === "string" ? [node] : stringsOf(node.children)));
const visorAny = visor as unknown as (params: Record<string, unknown>) => Tree;
const HELD = { width: 130, height: 218, rows: [{ lead: "question" as const, bar: 40 }], label: "proposal.md" };
const ROWS = [{ lead: "question" as const, bar: 40 }];
/** The sheet's body with the ink stroke Visor adds to its marks group (the `g` at stroke-width 3). */
const inked = (body: readonly Node[]): Node[] => body.map((node) => (node.tag === "g" && node.attrs["stroke-width"] === 3 ? { ...node, attrs: { ...node.attrs, stroke: "#121212" } } : node));
const heldGroupOf = (tree: Tree): Node | undefined => nodesOf(tree.body).find((node) => node.attrs["data-held"] === "sheet");

describe("Visor holds a sheet", () => {
  test("Sheet in the left hand", () => {
    const tree = visor({ x: 0, y: 0, holdsSheet: HELD });
    expect(tree.body).toHaveLength(1);
    const [held, body] = kids(tree.body[0]);
    expect(kids(tree.body[0])).toHaveLength(2);
    expect(held.attrs).toEqual({ "data-held": "sheet", stroke: "#121212", "stroke-width": 4, "stroke-linejoin": "round" });
    expect(plain(held.children)).toEqual(plain([...inked(sheet({ x: -228, y: -222, width: 130, height: 218, rows: ROWS }).body), ...pill({ x: -163, y: -222, text: "proposal.md" }).body]));
    expect(body.attrs).toEqual({});
    const withCard = kids(visor({ x: 0, y: 0, holds: true }).body[0])[0];
    const isCard = (node: Node | string) => typeof node !== "string" && node.tag === "rect" && node.attrs.fill === "#E04E17" && node.attrs.width === 28 && node.attrs.height === 24;
    expect(withCard.children.filter(isCard)).toHaveLength(1);
    expect(plain(body.children)).toEqual(plain(withCard.children.filter((node) => !isCard(node))));
    expect(kids(body).some((node) => node.tag === "circle" && node.attrs.cx === -92 && node.attrs.cy === -66 && node.attrs.r === 15)).toBe(true);
  });

  test("The sheet's words are Visor's text", () => {
    const { text } = visor({ x: 0, y: 0, holdsSheet: HELD });
    expect(plain(text)).toEqual([
      {
        tag: "g",
        attrs: { transform: "translate(0 0) scale(1)", "font-family": tokens.font.sans, "font-size": 19, "font-weight": 700, fill: "#121212", "text-anchor": "middle" },
        children: [
          { tag: "text", attrs: { x: -198, y: -158, "font-size": 19, "font-weight": 900 }, children: ["?"] },
          { tag: "text", attrs: { x: -163, y: -215 }, children: ["proposal.md"] },
        ],
      },
    ]);
    // The words carry their own font, so a scene (through toReact) draws the same as an SVG, both ways.
    for (const facing of ["right", "left"] as const) {
      const tree = visor({ x: 0, y: 0, holdsSheet: HELD, facing });
      const root = g({}, ...tree.body, ...tree.text);
      expect(normalForm(renderToStaticMarkup(toReact(root))), facing).toEqual(normalForm(toSvg(root)));
    }
  });

  test("Held sheet on the dark surface", () => {
    const tree = visor({ x: 0, y: 0, holdsSheet: HELD, surface: "dark" });
    const held = heldGroupOf(tree)!;
    expect(held.attrs.stroke).toBe("#ADA79D");
    const marks = kids(held).find((node) => node.tag === "g" && node.attrs["stroke-width"] === 3)!;
    expect(marks.attrs.stroke).toBe("#121212");
    expect(kids(held)[0]).toMatchObject({ tag: "rect", attrs: { fill: "#FFFFFF", width: 130, height: 218 } });
    expect(tree.text[0].attrs.fill).toBe("#121212");
  });

  test("Held sheet scales with Visor", () => {
    const one = visor({ x: 0, y: 0, holdsSheet: HELD });
    const tree = visor({ x: 480, y: 440, scale: 1.15, holdsSheet: HELD });
    expect(tree.body[0].attrs.transform).toBe("translate(480 440) scale(1.15)");
    expect(tree.text[0].attrs.transform).toBe("translate(480 440) scale(1.15)");
    expect(plain(heldGroupOf(tree)!.children)).toEqual(plain(heldGroupOf(one)!.children));
  });

  test("Answered sheet", () => {
    const held = heldGroupOf(visor({ x: 0, y: 0, holdsSheet: { width: 150, height: 120, rows: [{ lead: "question", bar: 40, tail: "check" }] } }))!;
    const nodes = nodesOf([held]);
    const box = nodes.filter((node) => node.tag === "rect" && node.attrs.fill === "#3DDC84");
    expect(box).toHaveLength(1);
    expect(box[0].attrs).toMatchObject({ width: 22, height: 22 });
    const tick = nodes.filter((node) => node.tag === "path" && node.attrs.stroke === "#121212");
    expect(tick).toHaveLength(1);
  });

  test("No sheet, no text", () => {
    for (const tree of [visor({ x: 0, y: 0 }), visor({ x: 0, y: 0, holds: true })]) {
      expect(tree.text).toEqual([]);
      expect(heldGroupOf(tree)).toBeUndefined();
    }
  });

  test("The hand clears the row marks", () => {
    // Design §2: the hand (radius 15, outline 8) overlaps the page's edge but no lead mark or tail check.
    const rows = [{ lead: "question" as const, bar: 40, tail: "check" as const }];
    for (const facing of ["right", "left"] as const) {
      const tree = visor({ x: 0, y: 0, facing, holdsSheet: { width: 150, height: 120, rows } });
      const [held, body] = kids(tree.body[0]);
      const marks = kids(held).find((node) => node.tag === "g" && node.attrs["stroke-width"] === 3)!;
      // The hand read from the tree: the body group's circle of radius 15 on the left, mirrored facing left.
      const hand = kids(body).find((node) => node.tag === "circle" && node.attrs.r === 15 && Number(node.attrs.cx) < 0)!;
      const handX = facing === "right" ? Number(hand.attrs.cx) : -Number(hand.attrs.cx);
      const reach = Number(hand.attrs.r) + Number(hand.attrs["stroke-width"]) / 2;
      // The hand overlaps the page's near edge.
      const page = kids(held)[0];
      const edge = facing === "right" ? Number(page.attrs.x) + Number(page.attrs.width) : Number(page.attrs.x);
      expect(handX - reach < edge && edge < handX + reach, `${facing}: edge ${edge}, hand ${handX}`).toBe(true);
      for (const mark of kids(marks)) {
        const [from, to] = mark.tag === "circle" ? [Number(mark.attrs.cx) - 13 - 1.5, Number(mark.attrs.cx) + 13 + 1.5] : [Number(mark.attrs.x) - 1.5, Number(mark.attrs.x) + Number(mark.attrs.width) + 1.5];
        expect(to < handX - reach || from > handX + reach, `${facing} ${mark.tag} ${from}..${to}`).toBe(true);
      }
    }
  });

  test("Sheet without words", () => {
    const tree = visor({ x: 0, y: 0, holdsSheet: { width: 130, height: 120, rows: [{ bar: 40 }, { lead: "checked", bar: 30 }] } });
    expect(heldGroupOf(tree)).toBeDefined();
    expect(tree.text).toEqual([]);
  });
});

describe("Held sheet parameters", () => {
  const CARD_AND_SHEET = new RangeError("visor: holdsSheet: Visor holds a card or a sheet, not both");

  test("Card and sheet together", () => {
    expect(() => visor({ x: 0, y: 0, holds: true, holdsSheet: { width: 130, height: 218, rows: [{ bar: 40 }] } })).toThrow(CARD_AND_SHEET);
  });

  test("Sheet seen from behind", () => {
    expect(() => visor({ x: 0, y: 0, view: "back", holdsSheet: HELD })).toThrow(new RangeError("visor: holdsSheet: Visor holds a sheet only in the front view"));
    expect(() => visor({ x: 0, y: 0, view: "back", holds: true, holdsSheet: HELD })).toThrow(CARD_AND_SHEET);
  });

  test("Schema before relation", () => {
    expect(() => visor({ x: 0, y: 0, holds: true, holdsSheet: { width: 79, height: 218, rows: [{ bar: 40 }] } })).toThrow(/^visor: holdsSheet\.width: /);
  });

  test("Sheet with holds false", () => {
    const held = { width: 130, height: 218, rows: [{ bar: 40 }] };
    expect(plain(visor({ x: 0, y: 0, holds: false, holdsSheet: held }))).toEqual(plain(visor({ x: 0, y: 0, holdsSheet: held })));
    expect(heldGroupOf(visor({ x: 0, y: 0, holds: false, holdsSheet: held }))).toBeDefined();
  });

  test("Sizes out of range", () => {
    const rows = [{ bar: 40 }];
    for (const [size, name] of [[{ width: 79, height: 218 }, "width"], [{ width: 301, height: 218 }, "width"], [{ width: 130, height: 79 }, "height"], [{ width: 130, height: 401 }, "height"]] as const) {
      expect(() => visor({ x: 0, y: 0, holdsSheet: { ...size, rows } }), JSON.stringify(size)).toThrow(RangeError);
      expect(() => visor({ x: 0, y: 0, holdsSheet: { ...size, rows } }), JSON.stringify(size)).toThrow(new RegExp(`^visor: holdsSheet\\.${name}: `));
    }
    expect(heldGroupOf(visor({ x: 0, y: 0, holdsSheet: { width: 80, height: 80, rows } }))).toBeDefined();
    expect(heldGroupOf(visor({ x: 0, y: 0, holdsSheet: { width: 300, height: 400, rows } }))).toBeDefined();
  });

  test("Rows out of range", () => {
    const page = { width: 130, height: 218 };
    for (const held of [page, { ...page, rows: [] }, { ...page, rows: Array.from({ length: 9 }, () => ({ bar: 40 })) }]) {
      expect(() => visorAny({ x: 0, y: 0, holdsSheet: held }), JSON.stringify(held)).toThrow(/^visor: holdsSheet\.rows: /);
    }
    expect(() => visorAny({ x: 0, y: 0, holdsSheet: { ...page, rows: [{ lead: "star", bar: 40 }] } })).toThrow(/^visor: holdsSheet\.rows\[0\]\.lead: /);
    expect(heldGroupOf(visor({ x: 0, y: 0, holdsSheet: { ...page, height: 400, rows: Array.from({ length: 8 }, () => ({ bar: 40 })) } }))).toBeDefined();
  });

  test("Unknown field and empty label", () => {
    expect(() => visorAny({ x: 0, y: 0, holdsSheet: { ...HELD, fill: "color.white" } })).toThrow(/^visor: holdsSheet\.fill: unknown parameter/);
    expect(() => visorAny({ x: 0, y: 0, holdsSheet: { ...HELD, label: "" } })).toThrow(/^visor: holdsSheet\.label: /);
    expect(() => visorAny({ x: 0, y: 0, holdsSheet: true })).toThrow(/^visor: holdsSheet: expected an object/);
  });
});

describe("Visor faces left or right", () => {
  test("Mirror of the default", () => {
    const right = visor({ x: 100, y: 300 });
    const left = visor({ x: 100, y: 300, facing: "left" });
    const rootAttrs = { "data-piece": "visor", transform: "translate(100 300) scale(1)", stroke: "none" };
    expect(right.body[0].attrs).toEqual(rootAttrs);
    expect(left.body[0].attrs).toEqual(rootAttrs);
    expect(kids(right.body[0])).toHaveLength(1);
    expect(kids(left.body[0])).toHaveLength(1);
    const mirrored = kids(left.body[0])[0];
    expect(mirrored.tag).toBe("g");
    expect(mirrored.attrs).toEqual({ transform: "scale(-1,1)" });
    expect(plain(mirrored.children)).toEqual(plain(kids(right.body[0])[0].children));
  });

  test("Facing right is the default", () => {
    const fixture = JSON.parse(readFileSync(new URL("../fixtures/cast-0.11.0.json", import.meta.url), "utf8")) as { piece: string; params: Record<string, unknown> }[];
    const calls = fixture.filter(({ piece }) => piece === "visor");
    expect(calls).toHaveLength(66);
    for (const { params } of calls) expect(plain(visorAny({ ...params, facing: "right" })), JSON.stringify(params)).toEqual(plain(visorAny(params)));
  });

  test("Back view and card mirrored", () => {
    const params = { x: 0, y: 0, view: "back" as const, holds: true, points: false };
    const left = visor({ ...params, facing: "left" });
    const right = visor({ ...params, facing: "right" });
    const body = kids(left.body[0])[0];
    expect(body.attrs.transform).toBe("scale(-1,1)");
    expect(plain(body.children)).toEqual(plain(kids(right.body[0])[0].children));
    // No face: the screen and its amber eyes are absent.
    expect(colours(left.body).has(tokens.cast.eyes)).toBe(false);
    expect(colours(visor({ x: 0, y: 0, facing: "left" }).body).has(tokens.cast.eyes)).toBe(true);
  });

  test("Unknown facing", () => {
    expect(() => visorAny({ x: 0, y: 0, facing: "up" })).toThrow(RangeError);
    expect(() => visorAny({ x: 0, y: 0, facing: "up" })).toThrow(/^visor: facing: expected one of right, left, found "up"/);
  });
});

/** (tag, fill, stroke, stroke-width) of every shape, depth first. */
const shapesOf = (tree: Tree): string[] =>
  nodesOf(tree.body).filter((node) => node.tag !== "g").map((node) => [node.tag, node.attrs.fill, node.attrs.stroke, node.attrs["stroke-width"]].join(" "));
/** Every node's transform, by its path in the tree, where the two trees differ (same structure assumed). */
const transformDiffs = (a: readonly Node[], b: readonly Node[], path = "body"): string[] =>
  a.flatMap((node, i) => {
    const other = b[i];
    const here = `${path}/${i}:${node.tag}`;
    const own = node.attrs.transform === other.attrs.transform ? [] : [`${here} ${node.attrs.transform} | ${other.attrs.transform}`];
    return [...own, ...transformDiffs(kids(node), kids(other), here)];
  });

describe("Mirrored Visor keeps its outline and words", () => {
  test("Same outline both ways", () => {
    for (const expression of CAST_EXPRESSIONS) {
      for (const surface of ["light", "dark"] as const) {
        const right = visor({ x: 0, y: 0, expression, surface, holds: true });
        const left = visor({ x: 0, y: 0, expression, surface, holds: true, facing: "left" });
        expect(shapesOf(left), `${expression} ${surface}`).toEqual(shapesOf(right));
        expect(transformDiffs(right.body, left.body), `${expression} ${surface}`).toEqual(["body/0:g/0:g undefined | scale(-1,1)"]);
      }
    }
  });

  test("Sheet on the right, unmirrored", () => {
    const tree = visor({ x: 0, y: 0, holdsSheet: HELD, facing: "left" });
    const [held, body] = kids(tree.body[0]);
    expect(held.attrs["data-held"]).toBe("sheet");
    expect(held.attrs.transform).toBeUndefined();
    expect(plain(held.children)).toEqual(plain([...inked(sheet({ x: 98, y: -222, width: 130, height: 218, rows: ROWS }).body), ...pill({ x: 163, y: -222, text: "proposal.md" }).body]));
    expect(body.attrs.transform).toBe("scale(-1,1)");
  });

  test("Words read the same", () => {
    const right = visor({ x: 0, y: 0, holdsSheet: HELD }).text;
    const left = visor({ x: 0, y: 0, holdsSheet: HELD, facing: "left" }).text;
    expect(stringsOf(left)).toEqual(stringsOf(right));
    expect(left[0].attrs).toEqual(right[0].attrs);
    const words = (text: readonly Node[]) => kids(text[0]);
    expect(words(left)).toHaveLength(2);
    words(left).forEach((node, i) => {
      const twin = words(right)[i];
      const { x, ...rest } = node.attrs;
      const { x: twinX, ...twinRest } = twin.attrs;
      expect(rest).toEqual(twinRest);
      expect(x).toBe(Number(twinX) + 326);
    });
    expect(words(left).map((node) => node.attrs.x)).toEqual([128, 163]);
    for (const node of nodesOf([...left, ...right])) expect(String(node.attrs.transform ?? "")).not.toMatch(/-\d/);
  });
});

describe("Visor's actions and words", () => {
  test("Visor's schema lists its actions", () => {
    const schema = PIECES.visor.schema;
    expect(schema.holds).toEqual({ kind: "boolean" });
    expect(schema.holdsSheet.kind).toBe("object");
    expect(schema.points).toEqual({ kind: "boolean" });
    expect(schema.facing).toEqual({ kind: "enum", values: ["right", "left"] });
    for (const name of ["mira", "drone", "kiu", "sinal"] as const) {
      expect(Object.keys(PIECES[name].schema), name).not.toContain("holdsSheet");
      expect(Object.keys(PIECES[name].schema), name).not.toContain("facing");
    }
  });

  test("Visor's words", () => {
    const { text } = visor({ x: 0, y: 0, holdsSheet: { width: 150, height: 218, rows: [{ lead: "question", bar: 40 }, { lead: "checkbox", bar: 40 }, { lead: "none", bar: 40 }], label: "proposal.md" } });
    expect(stringsOf(text)).toEqual(["?", "proposal.md"]);
  });
});

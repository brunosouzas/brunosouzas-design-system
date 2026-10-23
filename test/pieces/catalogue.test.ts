// Unit tests of the piece catalogue (spec illustration-pieces, "Piece
// catalogue", "Pure pieces", "Piece parameters checked", "Words come from the
// caller"; tasks 3.1).
import { describe, expect, test } from "vitest";
import * as P from "../../src/pieces/library";
import { SVG_TAGS, type SvgNode } from "../../src/pieces/node";
import { COLOUR_TOKENS } from "../../src/pieces/params";

/** The smallest valid call of each piece: only its required parameters. */
export const REQUIRED_ONLY: Record<P.PieceName, Record<string, unknown>> = {
  pill: { x: 0, y: 0, text: "a" },
  rings: { cx: 0, cy: 0 },
  sheet: { x: 0, y: 0, width: 100, height: 100, rows: [{ bar: 40 }] },
  blockArrow: { x: 0, y: 0 },
  arcArrow: { from: [0, 0], c1: [10, -10], c2: [20, -10], to: [30, 0] },
  rail: { x: 0, y: 0, width: 200, nodes: ["color.healthy"] },
  checkBadge: { cx: 0, cy: 0 },
  priceTag: { x: 0, y: 0, text: "v1" },
  nameTag: { hangX: 0, hangY: 0, cx: 0, top: 40, icon: "splitter" },
  codePanel: { x: 0, y: 0, width: 100, height: 100, lines: [{ indent: 0, w: 40, color: "healthy" }] },
  serverStack: { x: 0, y: 0 },
  cloud: { cx: 0, cy: 0 },
  stamp: { cx: 0, cy: 0, word: "GO" },
  robot: { cx: 0, top: 0 },
  magnifier: { cx: 0, cy: 0 },
  gear: { cx: 0, cy: 0 },
  parcel: { x: 0, y: 0 },
  road: { d: "M0,0 L100,0" },
  milestonePin: { x: 0, y: 0, text: "1" },
  browserWindow: { x: 0, y: 0 },
  speechBubble: { x: 0, y: 0, width: 100, height: 60 },
  steps: { x: 0, y: 0 },
  folder: { x: 0, y: 0 },
  book: { x: 0, y: 0 },
  muleFlow: { x: 0, y: 0, width: 300, tiles: [{ x: 20, kind: "choice" }] },
  eipIcon: { name: "splitter", x: 0, y: 0 },
};

const call = (name: P.PieceName, params: Record<string, unknown>) => (P.PIECES[name] as unknown as (p: Record<string, unknown>) => ReturnType<typeof P.pill>)(params);

const walk = (nodes: readonly (SvgNode | string)[], visit: (node: SvgNode) => void) => {
  for (const node of nodes) {
    if (typeof node === "string") continue;
    visit(node);
    walk(node.children, visit);
  }
};

const TOKEN_COLOURS = new Set(COLOUR_TOKENS.values());

describe("Piece catalogue", () => {
  test("Every piece draws with its defaults", () => {
    expect(P.PIECE_NAMES).toEqual(Object.keys(REQUIRED_ONLY));
    expect(P.PIECE_NAMES).toHaveLength(26);
    for (const name of P.PIECE_NAMES) {
      const drawn = call(name, REQUIRED_ONLY[name]);
      expect(drawn.body.length, name).toBeGreaterThan(0);
      walk([...drawn.body, ...drawn.text], (node) => {
        expect(SVG_TAGS, `${name}: ${node.tag}`).toContain(node.tag);
        for (const attr of ["fill", "stroke"]) {
          const value = node.attrs[attr];
          if (value === undefined || value === "none") continue;
          expect(TOKEN_COLOURS.has(String(value)), `${name}: ${attr}=${value}`).toBe(true);
        }
      });
    }
  });
});

describe("Pure pieces", () => {
  test("Same parameters, same tree", () => {
    const first = P.robot({ cx: 400, top: 140 });
    for (const name of P.PIECE_NAMES) call(name, REQUIRED_ONLY[name]);
    expect(P.robot({ cx: 400, top: 140 })).toEqual(first);
  });
});

describe("Piece parameters checked", () => {
  test("Missing and unknown parameters", () => {
    for (const name of P.PIECE_NAMES) {
      const required = Object.entries(P.PIECES[name].schema).filter(([, spec]) => spec.required).map(([key]) => key);
      for (const key of required) {
        const params = { ...REQUIRED_ONLY[name] };
        delete params[key];
        expect(() => call(name, params), `${name} without ${key}`).toThrow(new RangeError(`${name}: ${key}: missing required parameter`));
      }
    }
    expect(() => call("pill", { x: 0, y: 0, text: "a", colour: "color.white" })).toThrow(/^pill: colour: unknown parameter/);
  });

  test("Out of range", () => {
    expect(() => P.gear({ cx: 0, cy: 0, teeth: 3 })).toThrow(/^gear: teeth: expected a number at least 4/);
    expect(() => P.serverStack({ x: 0, y: 0, units: 1.5 })).toThrow(/^serverStack: units: expected an integer/);
    expect(() => call("sheet", { x: 0, y: 0, width: 100, height: 1, rows: [{ lead: "star", bar: 4 }] })).toThrow(/^sheet: rows\[0\]\.lead: expected one of/);
  });

  test("Sizes that would break the drawing", () => {
    // Sizes leave room for each piece's fixed insets, so no generated dimension is negative.
    expect(() => P.stamp({ cx: 0, cy: 0, word: "x", r: 1 })).toThrow(/^stamp: r: expected a number at least 12/);
    expect(() => P.browserWindow({ x: 0, y: 0, width: 20 })).toThrow(/^browserWindow: width: expected a number at least 60/);
    // Sizes and coordinates have an upper bound, so geometry never overflows to Infinity.
    expect(() => P.folder({ x: 0, y: 0, scale: 1e307 })).toThrow(/^folder: scale: expected a number at most 10000/);
    expect(() => P.pill({ x: 1e307, y: 0, text: "a" })).toThrow(/^pill: x: expected a number at most 10000/);
  });

  test("Road path with something else", () => {
    expect(() => P.road({ d: 'M0,0 L10,10" onload="x' })).toThrow(/^road: d: expected SVG path data/);
  });
});

describe("Words come from the caller", () => {
  test("Stamp word", () => {
    const drawn = P.stamp({ cx: 488, cy: 300, word: "GO" });
    expect(drawn.text).toHaveLength(1);
    expect(drawn.text[0].children).toEqual(["GO"]);
  });

  test("Empty label", () => {
    expect(() => P.pill({ x: 0, y: 0, text: "" })).toThrow(new RangeError("pill: text: expected a non-empty string"));
  });

  test("No piece invents a word", () => {
    for (const name of P.PIECE_NAMES) {
      const words: string[] = [];
      walk(call(name, REQUIRED_ONLY[name]).text, (node) => words.push(...node.children.filter((c): c is string => typeof c === "string")));
      const given = Object.values(REQUIRED_ONLY[name]).filter((v): v is string => typeof v === "string");
      for (const word of words) expect(word === "?" || given.includes(word), `${name}: ${word}`).toBe(true);
    }
  });
});

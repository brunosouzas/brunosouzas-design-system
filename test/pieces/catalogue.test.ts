// Unit tests of the piece catalogue (spec illustration-pieces, "Piece
// catalogue", "Pure pieces", "Piece parameters checked", "Words come from the
// caller"; tasks 3.1; stackledger-map-and-link-pieces task 5.1).
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
  lineBadge: { x: 0, y: 0, fill: "color.healthy" },
  stationMarker: { cx: 0, cy: 0 },
  pipe: { d: "M0,0 L100,0", fill: "color.caller" },
  countBadge: { cx: 0, cy: 0, text: "3" },
  nodeBlock: { x: 0, y: 0, width: 160, title: "a" },
  pillNode: { x: 0, y: 0, width: 160, title: "a" },
  hexNode: { x: 0, y: 0, width: 160, title: "a" },
  messageArrow: { from: [0, 0], to: [200, 100] },
  ledgerMark: { x: 0, y: 0 },
  renewalRing: { cx: 0, cy: 0, r: 18 },
  suggestedHalo: { cx: 0, cy: 0, r: 21 },
  licenceMark: { cx: 0, cy: 0 },
  zone: { points: [[0, 0], [100, 0], [50, 80]], fill: "color.caller" },
  uiIcon: { name: "sun", x: 0, y: 0 },
  linkIcon: { icon: "github", x: 0, y: 0 },
  diagramBox: { x: 0, y: 0, width: 120, text: ["a"] },
  decisionNode: { x: 0, y: 0, width: 120, height: 60, text: ["a"] },
  storeNode: { x: 0, y: 0, width: 120, height: 60, text: ["a"] },
  queueNode: { x: 0, y: 0, width: 120, text: ["a"] },
  exchangeNode: { x: 0, y: 0, width: 120, text: ["a"] },
  taggedContainer: { x: 0, y: 0, width: 200, height: 100, tag: "a" },
  lifeline: { x: 0, y1: 0, y2: 100 },
  phaseBand: { x: 0, y: 0, width: 200, text: "a", fill: "color.healthy" },
  altFrame: { x: 0, y: 0, width: 200, height: 100, tag: "a" },
  edgeLabel: { x: 0, y: 0, lines: ["a"] },
  stateStart: { cx: 0, cy: 0 },
  mascot: { who: "dev", x: 0, y: 0 },
  emote: { kind: "idea", x: 0, y: 0 },
};

/** The metro and diagram pieces have limits that depend on each other (width against height, room for
 * the ink), so their boundary calls are listed with valid companions instead of one value at a time. */
const METRO = new Set([
  "lineBadge", "stationMarker", "pipe", "countBadge", "nodeBlock", "pillNode", "hexNode", "messageArrow", "ledgerMark", "renewalRing", "suggestedHalo", "licenceMark", "zone",
  "diagramBox", "decisionNode", "storeNode", "queueNode", "exchangeNode", "taggedContainer", "lifeline", "phaseBand", "altFrame", "edgeLabel",
]);
const ink = (extra: Record<string, unknown>) => [{ ...extra, inkScale: 0.25 }, { ...extra, inkScale: 8 }];
export const METRO_BOUNDARY: Record<string, Record<string, unknown>[]> = {
  lineBadge: [
    { x: 0, y: 0, text: "a", fill: "color.healthy", height: 3, width: 3, inkScale: 0.25 },
    { x: 0, y: 0, text: "a", fill: "#7B3FE4", height: 96, width: 10000, inkScale: 8, flat: true },
    { x: 0, y: 0, text: "a", fill: "color.healthy", height: 10000, width: 10000, inkScale: 8 },
  ],
  stationMarker: [
    { cx: 0, cy: 0, r: 1.5, inkScale: 0.25 },
    { cx: 0, cy: 0, r: 10000, inkScale: 8, to: [10000, 10000], state: "deprecated", surface: "dark" },
  ],
  pipe: [
    { d: "M0,0 L1,0", fill: "color.caller", width: 0.01, casing: 0 },
    { d: "M0,0 L10000,0", fill: "#7B3FE4", width: 100, casing: 50 },
  ],
  countBadge: [
    { cx: 0, cy: 0, text: "3", height: 3, inkScale: 0.25 },
    { cx: 0, cy: 0, text: "999", height: 5000, width: 10000, inkScale: 8, surface: "dark" },
    { cx: 0, cy: 0, text: "3", height: 10000, width: 10000, inkScale: 8 },
  ],
  nodeBlock: [
    { x: 0, y: 0, title: "a", height: 3, width: 6, radius: 0, inkScale: 0.25 },
    { x: 0, y: 0, title: "a", height: 96, width: 192, radius: 0, inkScale: 8 },
    { x: 0, y: 0, title: "a", subtitle: "b", height: 5000, width: 10000, radius: 2500, state: "focus" },
    { x: 0, y: 0, title: "a", height: 0.01, width: 0.02, radius: 0, state: "placeholder" },
  ],
  pillNode: [{ x: 0, y: 0, title: "a", height: 3, width: 6, inkScale: 0.25 }, ...ink({ x: 0, y: 0, title: "a", height: 96, width: 192 }).slice(1), { x: 0, y: 0, title: "a", height: 5000, width: 10000 }],
  hexNode: [{ x: 0, y: 0, title: "a", height: 3, width: 6, inkScale: 0.25 }, ...ink({ x: 0, y: 0, title: "a", height: 96, width: 192 }).slice(1), { x: 0, y: 0, title: "a", height: 5000, width: 10000, surface: "dark" }],
  messageArrow: [
    { from: [0, 0], to: [5, 0], width: 1, head: false },
    { from: [0, 0], to: [120, 0], width: 12, label: "x" },
    { from: [-10000, -10000], to: [10000, 10000], width: 12, curve: "straight" },
  ],
  ledgerMark: [{ x: 0, y: 0, size: 12 }, { x: 10000, y: 10000, size: 512, surface: "dark" }],
  renewalRing: [
    { cx: 0, cy: 0, r: 0.75, width: 0.01, inkScale: 0.25 },
    { cx: 0, cy: 0, r: 10000, width: 50, inkScale: 8, surface: "dark" },
  ],
  suggestedHalo: [{ cx: 0, cy: 0, r: 0.01 }, { cx: 0, cy: 0, r: 10000, surface: "dark" }],
  licenceMark: [
    { cx: 0, cy: 0, size: 2.25, inkScale: 0.25 },
    { cx: 0, cy: 0, size: 10000, inkScale: 8, state: "toBuy", surface: "dark" },
  ],
  zone: [
    { points: [[0, 0]], fill: "#7B3FE4", title: "a", titleAt: [0, 0], surface: "dark" },
    { points: Array.from({ length: 10000 }, (_, i) => [i, i % 7]), fill: "color.caller" },
  ],
  // Body diagram pieces (change body-diagram-pieces, task 3.2).
  diagramBox: [
    { x: 0, y: 0, width: 3, height: 3, text: ["a"], radius: 0, textSize: 6, inkScale: 0.25 },
    { x: 0, y: 0, width: 10000, height: 10000, text: ["a", "b", "c"], subtitle: "d", radius: 5000, textSize: 48, inkScale: 8, surface: "dark" },
    { x: 0, y: 0, width: 96, height: 96, text: ["a"], shape: "pill", fill: "color.healthy", inkScale: 8 },
  ],
  decisionNode: [
    { x: 0, y: 0, width: 3, height: 3, text: ["a"], inkScale: 0.25 },
    { x: 0, y: 0, width: 10000, height: 10000, text: ["a"], inkScale: 8, surface: "dark" },
  ],
  storeNode: [
    { x: 0, y: 0, width: 3, height: 3, text: ["a"], ry: 0.75, inkScale: 0.25 },
    { x: 0, y: 0, width: 10000, height: 10000, text: ["a"], ry: 2500, inkScale: 8, surface: "dark" },
  ],
  queueNode: [
    { x: 0, y: 0, width: 23, height: 3, text: ["a"], inkScale: 0.25 },
    { x: 0, y: 0, width: 10000, height: 10000, text: ["a"], inkScale: 8, surface: "dark" },
  ],
  exchangeNode: [
    { x: 0, y: 0, width: 3, height: 3, text: ["a"], inkScale: 0.25 },
    { x: 0, y: 0, width: 10000, height: 10000, text: ["a"], inkScale: 8, surface: "dark" },
  ],
  taggedContainer: [
    { x: 0, y: 0, width: 52, height: 3, tag: "a", tagWidth: 24, inkScale: 0.25 },
    { x: 0, y: 0, width: 10000, height: 10000, tag: "a", tagWidth: 9972, inkScale: 2, surface: "dark" },
  ],
  lifeline: [{ x: 0, y1: 0, y2: 0.01, width: 0.01 }, { x: 0, y1: -10000, y2: 10000, width: 12, state: "inactive", surface: "dark" }],
  phaseBand: [
    { x: 0, y: 0, width: 3, height: 3, text: "a", fill: "color.healthy", textSize: 6, inkScale: 0.25 },
    { x: 0, y: 0, width: 10000, height: 10000, text: "a", fill: "color.blocked", textSize: 48, inkScale: 8, surface: "dark" },
  ],
  altFrame: [
    { x: 0, y: 0, width: 0.01, height: 0.02, tag: "a", tagWidth: 0.01, sections: [{ y: 0.01, tag: "b", conditionWidth: 0.01, condition: "c" }] },
    { x: 0, y: 0, width: 10000, height: 10000, tag: "a", condition: "b", tagWidth: 10000, conditionWidth: 10000, sections: Array.from({ length: 10 }, (_, i) => ({ y: 1 + i, tag: "c" })), surface: "dark" },
  ],
  edgeLabel: [
    { x: 0, y: 0, lines: ["a"], backdrop: true, width: 0.01, textSize: 6 },
    { x: 0, y: 0, lines: ["a", "b", "c", "d"], backdrop: true, width: 10000, textSize: 48, anchor: "end", surface: "dark" },
  ],
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
    expect(P.PIECE_NAMES).toHaveLength(54);
    for (const name of P.PIECE_NAMES) {
      const drawn = call(name, REQUIRED_ONLY[name]);
      // edgeLabel without a backdrop draws words only (change body-diagram-pieces).
      if (name === "edgeLabel") {
        expect(drawn.body, name).toHaveLength(0);
        expect(drawn.text.length, name).toBeGreaterThan(0);
      } else expect(drawn.body.length, name).toBeGreaterThan(0);
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
    // Every piece, called again after all the others (Codex code review round 2 of AB#167).
    const firsts = P.PIECE_NAMES.map((name) => call(name, REQUIRED_ONLY[name]));
    for (const name of [...P.PIECE_NAMES].reverse()) call(name, REQUIRED_ONLY[name]);
    P.PIECE_NAMES.forEach((name, i) => expect(call(name, REQUIRED_ONLY[name]), name).toEqual(firsts[i]));
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
    // Sizes have an upper bound (positions do not: see positions.test.ts).
    expect(() => P.folder({ x: 0, y: 0, scale: 1e307 })).toThrow(/^folder: scale: expected a number at most 10000/);
  });

  test("Smallest and largest accepted sizes draw valid geometry", () => {
    const bad: string[] = [];
    const check = (label: string, drawn: ReturnType<typeof P.pill>) =>
      walk([...drawn.body], (node) => {
        for (const [attr, v] of Object.entries(node.attrs)) {
          if (typeof v === "number" && (!Number.isFinite(v) || (["width", "height", "r", "rx", "ry", "stroke-width"].includes(attr) && v < 0))) bad.push(`${label}: ${attr}=${v}`);
          if (typeof v === "string" && /NaN|Infinity/.test(v)) bad.push(`${label}: ${attr}`);
        }
      });
    for (const [name, calls] of Object.entries(METRO_BOUNDARY)) calls.forEach((params, i) => check(`${name}[${i}]`, call(name as P.PieceName, params)));
    for (const name of P.PIECE_NAMES) {
      if (METRO.has(name)) continue;
      for (const [key, spec] of Object.entries(P.PIECES[name].schema)) {
        if (spec.kind !== "number" || spec.min === undefined || spec.min < 0 || spec.max === undefined) continue;
        const smallest = spec.exclusiveMin ? spec.min + 0.01 : spec.min;
        for (const value of [smallest, spec.max]) {
          walk([...call(name, { ...REQUIRED_ONLY[name], [key]: value }).body], (node) => {
            for (const [attr, v] of Object.entries(node.attrs)) {
              if (typeof v === "number" && (!Number.isFinite(v) || (["width", "height", "r", "rx", "ry"].includes(attr) && v < 0))) bad.push(`${name}.${key}=${value}: ${attr}=${v}`);
              if (typeof v === "string" && /NaN|Infinity/.test(v)) bad.push(`${name}.${key}=${value}: ${attr}`);
            }
          });
        }
      }
    }
    expect(bad).toEqual([]);
  });

  test("Too many repeated parts", () => {
    expect(() => P.steps({ x: 0, y: 0, count: 4294967296 })).toThrow(/^steps: count: expected a number at most 20/);
    expect(() => P.gear({ cx: 0, cy: 0, teeth: 65 })).toThrow(/^gear: teeth: expected a number at most 64/);
    expect(() => call("rail", { x: 0, y: 0, width: 200, nodes: Array(51).fill("color.healthy") })).toThrow(/^rail: nodes: expected at most 50 item\(s\)/);
    // Change body-diagram-pieces, task 3.2.
    expect(() => call("altFrame", { x: 0, y: 0, width: 200, height: 100, tag: "a", sections: Array.from({ length: 11 }, (_, i) => ({ y: 1 + i, tag: "b" })) })).toThrow(/^altFrame: sections: expected at most 10 item\(s\)/);
    expect(() => call("diagramBox", { x: 0, y: 0, width: 120, text: ["a", "b", "c", "d"] })).toThrow(/^diagramBox: text: expected at most 3 item\(s\)/);
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
      // The caller's words, in strings, string arrays and objects (change body-diagram-pieces); backticks are not drawn.
      const given: string[] = [];
      const collect = (value: unknown): void => {
        if (typeof value === "string") given.push(value, ...value.split("`").filter(Boolean));
        else if (Array.isArray(value)) value.forEach(collect);
        else if (typeof value === "object" && value !== null) Object.values(value).forEach(collect);
      };
      collect(REQUIRED_ONLY[name]);
      for (const word of words) expect(word === "?" || given.includes(word), `${name}: ${word}`).toBe(true);
    }
  });
});

// Change banner-format (AB#156), illustration-pieces "Ring count".
describe("Ring count", () => {
  const circles = (drawn: ReturnType<typeof P.rings>) => {
    expect(drawn.body).toHaveLength(1);
    expect(drawn.body[0].tag).toBe("g");
    return (drawn.body[0].children as SvgNode[]).map((c) => (expect(c.tag).toBe("circle"), c.attrs.r));
  };

  test("Default count", () => {
    const radii = circles(P.rings({ cx: 400, cy: 210 }));
    expect(radii).toHaveLength(14);
    expect([radii[0], radii[13]]).toEqual([90, 454]);
  });

  test("Given count", () => {
    const radii = circles(P.rings({ cx: 600, cy: 225, radius: 60, count: 22 }));
    expect(radii).toEqual(Array.from({ length: 22 }, (_, i) => 60 + 28 * i));
    expect(radii[21]).toBe(648);
  });

  test("Count out of range", () => {
    const cases: [number, string][] = [
      [0, "rings: count: expected a number at least 1, found 0"],
      [1001, "rings: count: expected a number at most 1000, found 1001"],
      [2.5, "rings: count: expected an integer, found 2.5"],
    ];
    for (const [count, message] of cases) {
      expect(() => P.rings({ cx: 0, cy: 0, count })).toThrow(RangeError);
      expect(() => P.rings({ cx: 0, cy: 0, count })).toThrow(message);
    }
  });
});

// Change piece-params, task 2.1 (spec illustration-pieces, "Milestone pin size").
describe("Milestone pin size", () => {
  const parts = (params: P.MilestonePinParams) => {
    const { body, text } = P.milestonePin(params);
    return { line: body[0].attrs, circle: body[1].attrs, text: text[0].attrs };
  };
  test("Larger pin", () => {
    const { line, circle, text } = parts({ x: 100, y: 200, text: "S", size: 27 });
    expect(line).toMatchObject({ x1: 100, y1: 200, x2: 100, y2: 156 });
    expect(circle).toMatchObject({ cx: 100, cy: 135, r: 27, "stroke-width": 4.5 });
    expect(text).toMatchObject({ y: 145.5, "font-size": 27 });
  });
  test("Pin size bounds", () => {
    const base = { x: 0, y: 100, text: "1" };
    expect(parts({ ...base, size: 6 }).circle).toMatchObject({ cy: 51.33, r: 6, "stroke-width": 1 });
    expect(parts({ ...base, size: 48 }).circle).toMatchObject({ cy: 18.67, r: 48, "stroke-width": 8 });
    for (const size of [5.99, 48.01, "26"]) expect(() => P.milestonePin({ ...base, size } as never)).toThrow(/^milestonePin: size:/);
  });
  test("Fractional pin size", () => {
    const { circle, text } = parts({ x: 0, y: 100, text: "1", size: 18.123 });
    expect(circle).toMatchObject({ cy: 41.9, r: 18.123, "stroke-width": 3.02 });
    expect(text).toMatchObject({ y: 48.95, "font-size": 18.123 });
  });
});

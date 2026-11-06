// Unit tests of the emotes (spec illustration-pieces, "Emote", "Emote colours",
// "Emotes carry their own stroke", "Ink on the dark surface", "Emote
// parameters", "Emote look frozen"; tasks 4.3 and 4.4 of
// identity-v2-type-pieces-cleanup). Each test title is the spec scenario it
// proves. They replace the emote parts of the removed cast.test.ts and
// cast-dark.test.ts.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { EMOTE_KINDS, emote, type EmoteKind, type EmoteParams } from "../../src/pieces/emote";
import { g, type SvgNode } from "../../src/pieces/node";
import { COLOUR_TOKENS } from "../../src/pieces/params";
import { toSvg } from "../../src/pieces/render";
import { tokens } from "../../tokens/generated/tokens";

const INK = tokens.color.ink;
const MUTED = tokens.surface.dark.muted;
const E = (params: EmoteParams): SvgNode => emote(params).body[0];
const kids = (node: SvgNode) => node.children.filter((child): child is SvgNode => typeof child !== "string");
const nodesOf = (nodes: readonly (SvgNode | string)[]): SvgNode[] => nodes.flatMap((node) => (typeof node === "string" ? [] : [node, ...nodesOf(node.children)]));
const isRay = (node: SvgNode) => node.tag === "path" && node.attrs["stroke-width"] === 6 && node.attrs["stroke-linecap"] === "round" && node.attrs.fill === undefined;
const calls = () => EMOTE_KINDS.flatMap((kind) => [true, false].flatMap((burst) => (["light", "dark"] as const).map((surface) => ({ kind, burst, surface }))));

describe("Emote", () => {
  test("Scaled check", () => {
    const drawn = emote({ kind: "worked", x: 10, y: 20, scale: 2 });
    expect(drawn.body).toHaveLength(1);
    expect(drawn.body[0].tag).toBe("g");
    expect(drawn.body[0].attrs).toEqual({ "data-emote": "worked", stroke: "none", transform: "translate(10 20) scale(2) translate(-10 -20)" });
    expect(drawn.text).toEqual([]);
    expect(E({ kind: "worked", x: 10, y: 20 }).attrs).toEqual({ "data-emote": "worked", stroke: "none" });
  });

  test("Idea without its burst", () => {
    for (const surface of ["light", "dark"] as const) {
      const bare = kids(E({ kind: "idea", x: 0, y: 0, burst: false, surface }));
      const full = kids(E({ kind: "idea", x: 0, y: 0, surface }));
      // The default holds every child of the bare idea, plus the seven rays only.
      expect(full.slice(-bare.length)).toEqual(bare);
      const added = full.slice(0, full.length - bare.length);
      expect(added).toHaveLength(7);
      expect(added.every(isRay), surface).toBe(true);
      // No disc behind the bulb, no shadow copy.
      expect(full.some((node) => node.tag === "circle")).toBe(false);
      expect(full.some((node) => /translate/.test(String(node.attrs.transform ?? "")))).toBe(false);
    }
    expect(kids(E({ kind: "idea", x: 0, y: 0, surface: "dark" }))).toHaveLength(kids(E({ kind: "idea", x: 0, y: 0 })).length);
    expect(kids(E({ kind: "idea", x: 0, y: 0, burst: false }))).toHaveLength(5);
  });

  test("Problem in failure red", () => {
    const main = (kind: EmoteKind) => kids(E({ kind, x: 0, y: 0, burst: false }))[0].attrs.fill;
    expect(main("problem")).toBe(tokens.color.state.failure);
    expect(main("refused")).toBe(tokens.color.state.failure);
    expect(main("worked")).toBe(tokens.color.state.healthy);
  });
});

describe("Emote colours", () => {
  test("Idea and liked", () => {
    const idea = kids(E({ kind: "idea", x: 0, y: 0, burst: false }));
    expect(idea[0].attrs.fill).toBe("#FFC98A");
    expect(idea.filter((node) => node.tag === "rect").map((node) => node.attrs.fill)).toEqual(["#D7D1C5", "#D7D1C5"]);
    expect(kids(E({ kind: "liked", x: 0, y: 0 }))[0].attrs.fill).toBe("#E04E17");
    for (const kind of ["idea", "liked"] as const) {
      expect(nodesOf([E({ kind, x: 0, y: 0 })]).some((node) => node.attrs.fill === INK && /translate/.test(String(node.attrs.transform ?? "")))).toBe(false);
    }
  });

  test("Every colour is allowed", () => {
    const allowed = new Set<string>(["none", tokens.color.white, INK, MUTED, tokens.cast.eyes, tokens.brand.light.border, tokens.brand.light.accent, tokens.color.state.failure, tokens.color.state.healthy]);
    const found = new Set<string>();
    for (const call of calls()) {
      for (const node of nodesOf([E({ ...call, x: 0, y: 0 })])) for (const attr of ["fill", "stroke"]) if (node.attrs[attr] !== undefined) found.add(String(node.attrs[attr]));
    }
    expect([...found].filter((value) => !allowed.has(value))).toEqual([]);
  });
});

describe("Emotes carry their own stroke", () => {
  test("Inside the outlined group", () => {
    const SHAPES = new Set(["circle", "ellipse", "rect", "path"]);
    const tokenValues = new Set(COLOUR_TOKENS.values());
    const problems: string[] = [];
    const walk = (node: SvgNode, stroked: boolean, where: string) => {
      const inherited = stroked || (node.tag === "g" && node.attrs.stroke !== undefined);
      if (SHAPES.has(node.tag) && node.attrs.stroke === undefined && !inherited) problems.push(`${where}: ${node.tag} without stroke`);
      for (const attr of ["fill", "stroke"]) {
        const value = node.attrs[attr];
        if (value !== undefined && value !== "none" && !tokenValues.has(String(value))) problems.push(`${where}: ${attr} ${value}`);
      }
      for (const child of kids(node)) walk(child, inherited, where);
    };
    for (const call of calls()) walk(E({ ...call, x: 0, y: 0 }), false, JSON.stringify(call));
    expect(problems).toEqual([]);
  });
});

describe("Ink on the dark surface", () => {
  test("Emote on dark", () => {
    for (const kind of ["problem", "waiting"] as const) {
      const light = E({ kind, x: 0, y: 0 });
      const dark = E({ kind, x: 0, y: 0, surface: "dark" });
      expect(kids(dark)).toHaveLength(kids(light).length);
      expect(nodesOf([dark]).some((node) => node.attrs["data-part"] === "rim")).toBe(false);
      expect(nodesOf([dark]).some((node) => /translate/.test(String(node.attrs.transform ?? "")))).toBe(false);
      // The same shapes; only the strokes on the background change, from ink to the muted grey.
      kids(dark).forEach((node, i) => {
        const before = kids(light)[i];
        expect({ ...node.attrs, stroke: undefined }).toEqual({ ...before.attrs, stroke: undefined });
        if (before.attrs.stroke === INK && node.attrs.stroke !== INK) expect(node.attrs.stroke).toBe(MUTED);
      });
    }
    const problem = kids(E({ kind: "problem", x: 0, y: 0, surface: "dark" }));
    // The rays and the triangle's outline are muted; the ! mark (its stroke and its dot) stays ink.
    expect(problem.filter(isRay).map((node) => node.attrs.stroke)).toEqual(Array(5).fill(MUTED));
    expect(problem.find((node) => node.attrs.fill === tokens.color.state.failure)!.attrs.stroke).toBe(MUTED);
    expect(problem.find((node) => node.attrs["stroke-width"] === 9)!.attrs.stroke).toBe(INK);
    expect(problem.at(-1)!.attrs.fill).toBe(INK);
    // Each Z: a muted casing under a white stroke.
    const zeds = kids(E({ kind: "waiting", x: 0, y: 0, surface: "dark" }));
    expect(zeds.map((node) => node.attrs.stroke)).toEqual([MUTED, "#FFFFFF", MUTED, "#FFFFFF", MUTED, "#FFFFFF"]);
  });

  test("Light surface unchanged", () => {
    for (const kind of ["problem", "waiting"] as const) {
      const light = E({ kind, x: 0, y: 0, surface: "light" });
      expect(light).toEqual(E({ kind, x: 0, y: 0 }));
      const strokes = nodesOf([light]).map((node) => node.attrs.stroke);
      expect(strokes).toContain(INK);
      expect(strokes).not.toContain(MUTED);
    }
  });
});

describe("Emote parameters", () => {
  test("Unknown kind", () => {
    expect(() => emote({ kind: "zzz" as never, x: 0, y: 0 })).toThrow(/^emote: kind: expected one of idea, doubt, problem, worked, refused, pressure, liked, waiting/);
  });

  test("Scale out of range", () => {
    expect(() => emote({ kind: "idea", x: 0, y: 0, scale: 0 })).toThrow(/^emote: scale: /);
    expect(() => emote({ kind: "idea", x: 0, y: 0, scale: 11 })).toThrow(/^emote: scale: /);
  });

  test("Unknown surface", () => {
    expect(() => emote({ kind: "idea", x: 0, y: 0, surface: "navy" as "dark" })).toThrow(/^emote: surface: expected one of light, dark/);
  });
});

// Frozen look (requirement "Emote look frozen", task 4.4). The fixture was written
// once by scripts/freeze-emote.ts from the drawing the owner approved in group 8.
type Call = { piece: "emote"; params: EmoteParams; sha256: string };
type Draw = (params: EmoteParams) => { body: readonly SvgNode[]; text: readonly SvgNode[] };
const FROZEN = JSON.parse(readFileSync(new URL("../fixtures/emote-0.7.0.json", import.meta.url), "utf8")) as Call[];
const sha = (text: string) => createHash("sha256").update(text).digest("hex");
/** The calls whose hash differs from the recorded one, drawn by `draw`. */
const changedCalls = (calls: readonly Call[], draw: Draw = emote): string[] =>
  calls
    .filter((call) => {
      const drawn = draw(call.params);
      return sha(toSvg(g({}, ...drawn.body, ...drawn.text))) !== call.sha256;
    })
    .map((call) => `${call.piece} ${JSON.stringify(call.params)}`);

describe("Emote look frozen", () => {
  test("Every call matches", () => {
    // Each kind, with and without its burst, on both surfaces, at scale 1 and 2.
    expect(FROZEN).toHaveLength(EMOTE_KINDS.length * 2 * 2 * 2);
    expect(new Set(FROZEN.map((call) => `${call.params.kind} ${call.params.burst} ${call.params.surface} ${call.params.scale}`)).size).toBe(FROZEN.length);
    expect(changedCalls(FROZEN)).toEqual([]);
  });

  test("A changed drawing is caught", () => {
    // Move the idea's bulb (the path filled with cast.eyes) one unit to the right.
    const moveBulb = (node: SvgNode): SvgNode => ({
      ...node,
      attrs: node.attrs.fill === tokens.cast.eyes ? { ...node.attrs, d: String(node.attrs.d).replace(/^M(-?[\d.]+)/, (_, x: string) => `M${Number(x) + 1}`) } : node.attrs,
      children: node.children.map((child) => (typeof child === "string" ? child : moveBulb(child))),
    });
    const altered: Draw = (params) => {
      const drawn = emote(params);
      return params.kind === "idea" ? { body: drawn.body.map(moveBulb), text: drawn.text } : drawn;
    };
    const ideas = FROZEN.filter((call) => call.params.kind === "idea").map((call) => `emote ${JSON.stringify(call.params)}`);
    expect(ideas).toHaveLength(8);
    expect(changedCalls(FROZEN, altered)).toEqual(ideas);
  });
});

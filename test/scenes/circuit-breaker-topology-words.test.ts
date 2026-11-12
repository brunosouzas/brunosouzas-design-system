// The circuit-breaker topology scene's words, colours and files (spec
// scene-catalogue, "Topology words on screen", "Topology colour roles",
// "Topology built from package pieces"; change circuit-breaker-topology-scene,
// task 4.6). Words and colours are read from the stage trees and the component
// props of every frame (test/scenes/topology-tree.ts).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { tokens } from "../../tokens/generated/tokens";
import type { SvgNode } from "../../src/pieces/node.ts";
import { text } from "../../src/scenes/circuit-breaker-topology/scene.ts";
import { drawn } from "../../src/scenes/circuit-breaker-topology/frame";
import { PAYMENT_UNIT_HEIGHT } from "../../src/scenes/circuit-breaker-topology/layout";
import { stageAt } from "../../src/scenes/circuit-breaker-topology/stage";
import type { Route } from "../../src/scenes/circuit-breaker-topology/timeline";
import { coloursOf, glyphsOf, textsOf, walk, type Frame } from "./topology-tree";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const SCENE_DIR = join(repoRoot, "src/scenes/circuit-breaker-topology");
const FRAMES: Frame[] = Array.from({ length: 1920 }, (_, frame) => ({ frame, ...stageAt(frame) }));

// ---------------------------------------------------------------- words

const flatten = (value: unknown): string[] => (typeof value === "string" ? [value] : Array.isArray(value) ? value.flatMap(flatten) : Object.values(value as object).flatMap(flatten));
/** The table's values as drawn: backticks mark code and are not drawn. */
const TABLE = flatten(text.en).map((word) => word.replace(/`/g, ""));
const COUNTERS = Array.from({ length: 61 }, (_, n) => String(n));
const GLYPHS = ["✓", "✕"];
const ALLOWED = new Set([...TABLE, ...COUNTERS, ...GLYPHS]);

const wordsAt = (f: Frame) => [...textsOf(f.below), ...textsOf(f.above)].map((t) => t.text).concat(glyphsOf(f).map((g) => g.glyph));
/** Every drawn string outside the allowed set, naming it and its first frame; and the table values never drawn. */
const wordProblems = (frames: readonly Frame[]): string[] => {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const f of frames) for (const word of wordsAt(f)) {
    if (!ALLOWED.has(word) && !seen.has(word)) problems.push(`"${word}" is not in text.en, first drawn at frame ${f.frame}`);
    seen.add(word);
  }
  for (const word of TABLE) if (!seen.has(word)) problems.push(`"${word}" of text.en is never drawn`);
  return problems;
};

const mapTree = (node: SvgNode, fn: (node: SvgNode, element: string | null) => SvgNode, element: string | null = null): SvgNode => {
  const name = node.attrs["data-element"] === undefined ? element : String(node.attrs["data-element"]);
  const mapped = fn(node, name);
  return { ...mapped, children: mapped.children.map((c) => (typeof c === "string" ? c : mapTree(c, fn, name))) };
};

describe("Topology words on screen", () => {
  test("Words over the whole composition", () => {
    expect(wordProblems(FRAMES)).toEqual([]);
    // No caption (SCN-2): no element of the stage is named one.
    for (const f of FRAMES) expect(JSON.stringify([f.below, f.above]).includes("caption"), `frame ${f.frame}`).toBe(false);
  });

  test("Words at their boundaries", () => {
    const words = (frame: number) => wordsAt(FRAMES[frame]);
    for (const frame of [843, 844]) for (const w of ["CIRCUIT-BREAKER:OPEN", "payment temporarily"]) expect(words(frame), `${w} at ${frame}`).not.toContain(w);
    for (const frame of [845, 949]) for (const w of ["CIRCUIT-BREAKER:OPEN", "payment temporarily"]) expect(words(frame), `${w} at ${frame}`).toContain(w);
    for (const w of ["CIRCUIT-BREAKER:OPEN", "payment temporarily"]) expect(words(960)).not.toContain(w);
    expect(words(1187)).not.toContain("200");
    expect(words(1189)).toContain("200");
    const last = words(1919);
    expect(last.filter((w) => w === "200")).toHaveLength(2);
    for (const w of ["CLOSED", "Checkout", "Payment", "circuit-breaker:", "execute", "2"]) expect(last, w).toContain(w);
    expect(last.filter((w) => w === "✓")).toHaveLength(5);
    for (const w of ["retry ×3", "requests", "resetTimeout 10s"]) expect(last, w).not.toContain(w);
  });

  test("Unlisted word rejected", () => {
    const edited = FRAMES.map((f) => (f.frame !== 870 ? f : {
      ...f,
      above: mapTree(f.above, (n, e) => (n.tag === "tspan" && e === "tag-left" ? { ...n, children: ["fallback"] } : n)),
    }));
    expect(wordProblems(edited)).toEqual(['"fallback" is not in text.en, first drawn at frame 870']);
  });
});

// ---------------------------------------------------------------- colours (design §2.9)

const { state, white } = tokens.color;
const NAMES: Record<string, string> = Object.fromEntries(Object.entries(state).map(([name, hex]) => [hex, `color.state.${name}`]));
const STATE_COLOURS = new Set<string>(Object.values(state));
const ARROW_KIND: Record<string, string> = { [state.failure]: "failure", [state.failFast]: "failFast" };

/** Every state colour on an element its role does not allow, naming both; and a `Payment` label that is not white. */
const colourProblems = (frames: readonly Frame[]): string[] => {
  const problems = new Set<string>();
  for (const f of frames) {
    for (const { element, colour } of coloursOf(f)) {
      if (element === "payment-label" && colour !== white && colour !== tokens.color.ink) problems.add(`payment-label is filled ${NAMES[colour] ?? colour}, not color.white`);
      if (!STATE_COLOURS.has(colour)) continue;
      const name = NAMES[colour];
      const allowed =
        colour === state.failure ? element === "payment" || element === "square fail" || element === "bar" || (element.startsWith("arrow-") && f.state.arrows[element.slice(6) as Route]?.kind === "failure")
        : colour === state.failFast ? element.startsWith("arrow-") && f.state.arrows[element.slice(6) as Route]?.kind === "failFast"
        : colour === state.blocked ? element === "state-pill" && f.state.state?.name === "open"
        : colour === state.healthy ? element === "state-pill" && f.state.state?.name === "closed"
        : colour === state.transitional ? element === "state-pill" && f.state.state?.name === "halfOpen"
        : colour === state.caller ? element === "checkout-label"
        : false;
      if (!allowed) problems.add(`${element} uses ${name} at frame ${f.frame}`);
    }
  }
  return [...problems];
};

describe("Topology colour roles", () => {
  test("Roles over the whole composition", () => {
    expect(colourProblems(FRAMES)).toEqual([]);
    // Each role is used somewhere, so the check is not vacuous.
    const used = new Set(FRAMES.flatMap((f) => coloursOf(f).map((c) => `${c.element.replace(/^arrow-.*/, "arrow")} ${NAMES[c.colour] ?? ""}`)));
    for (const role of ["payment color.state.failure", "square fail color.state.failure", "bar color.state.failure", "arrow color.state.failure", "arrow color.state.failFast", "state-pill color.state.blocked", "state-pill color.state.healthy", "state-pill color.state.transitional", "checkout-label color.state.caller"]) {
      expect(used.has(role), role).toBe(true);
    }
    expect(coloursOf(FRAMES[1919]).filter((c) => c.element === "payment-label").map((c) => c.colour)).toContain(white);
  });

  test("Red only on failing Payment units", () => {
    // A unit's body (serverStack, 40 high) is red exactly when frameAt says that unit is failing.
    for (const f of FRAMES) {
      const units = walk(f.below).filter((w) => w.element === "payment" && w.node.tag === "rect" && Number(w.node.attrs.height) === PAYMENT_UNIT_HEIGHT);
      const red = units.filter((w) => w.node.attrs.fill === state.failure).length;
      expect(units.length, `frame ${f.frame}`).toBe(drawn(f.state.payment) ? 3 : 0);
      expect(red, `frame ${f.frame}`).toBe(units.length === 0 ? 0 : f.state.failing.filter(Boolean).length);
    }
    expect(FRAMES.some((f) => f.state.failing.some(Boolean)) && FRAMES.some((f) => f.state.payment !== null && !f.state.failing.some(Boolean))).toBe(true);
  });

  test("Red payment label rejected", () => {
    const edited = FRAMES.map((f) => ({ ...f, above: mapTree(f.above, (n, e) => (e === "payment-label" && n.tag === "rect" ? { ...n, attrs: { ...n.attrs, fill: state.backend } } : n)) }));
    const problems = colourProblems(edited);
    expect(problems).toContain("payment-label is filled color.state.backend, not color.white");
    expect(problems.some((p) => p.startsWith("payment-label uses color.state.backend"))).toBe(true);
  });
});

// ---------------------------------------------------------------- files (MOT-6, CAST-1)

const sources = () => readdirSync(SCENE_DIR).filter((name) => /\.(ts|tsx)$/.test(name)).map((name) => ({ name, source: readFileSync(join(SCENE_DIR, name), "utf8") }));

describe("Topology built from package pieces", () => {
  test("No shape of its own", () => {
    const files = sources();
    expect(files.map((f) => f.name).sort()).toEqual(["Scene.tsx", "frame.ts", "layout.ts", "scene.ts", "stage.ts", "timeline.ts"]);
    for (const { name, source } of files) {
      expect(source, name).not.toMatch(/\bel\(\s*["'](path|rect|circle|ellipse|line|polygon|polyline)["']/);
      expect(source, name).not.toMatch(/<(path|rect|circle|ellipse|line|polygon|polyline)\b/);
      expect(source, name).not.toMatch(/\b(mira|visor|drone|kiu|sinal|emote)\b\s*[,}(]/);
      expect(source, name).not.toMatch(/from\s+["'][^"']*(brand-cast|emote)(\.ts)?["']/);
    }
    // The check would see one.
    expect(/\bel\(\s*["'](path|rect|circle|ellipse|line|polygon|polyline)["']/.test('el("rect", {})')).toBe(true);
  });

  test("No colour literal", () => {
    for (const { name, source } of sources()) expect(source, name).not.toMatch(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-zA-Z_])|\b(?:rgba?|hsla?)\(/);
    // The repository-wide scan (test/brand/no-colour-literals.test.ts) covers src/scenes/ and src/brand/ too.
  });
});

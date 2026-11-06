// Calls valid in an earlier release still draw the trees (and SVG bytes) pinned
// in the frozen fixtures (spec illustration-pieces, "Existing calls unchanged",
// "UI icon calls of 0.3.0 unchanged", "Message arrow calls of 0.3.1 unchanged",
// "Piece calls of 0.5.0 unchanged"). Each fixture was first written by its
// freeze script on the release it names (scripts/freeze-pieces.ts on 897f2ff,
// scripts/freeze-ui-icons.ts on 2bfe4a5, scripts/freeze-message-arrow.ts on the
// 0.3.1 tree, scripts/freeze-pieces-0.5.0.ts on f91ba2e), and re-run once for
// 0.7.0 (change identity-v2-type-pieces-cleanup, task 5.6) from the drawing the
// owner approved, with the same calls (each top-level color.<state> written
// color.state.<state>).
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { PIECES, type PieceName } from "../../src/pieces/library";
import type { SvgNode } from "../../src/pieces/node";
import { toSvg } from "../../src/pieces/render";

type Frozen = { piece: PieceName; params: Record<string, unknown>; tree: unknown };
type FrozenSvg = Frozen & { svg: string };
type Written = { body: readonly SvgNode[]; text?: readonly SvgNode[] };
type Draw = (piece: PieceName, params: Record<string, unknown>) => Written;
const load = <T>(name: string) => JSON.parse(readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), "utf8")) as T;
const call: Draw = (piece, params) => (PIECES[piece] as unknown as (p: Record<string, unknown>) => Written)(params);
/** Body nodes then text nodes, each through toSvg, joined with no separator. */
const svgOf = (drawn: Written) => [...drawn.body, ...(drawn.text ?? [])].map((node) => toSvg(node)).join("");
/** The calls whose tree or SVG bytes, drawn by `draw`, differ from the pinned ones. */
const changedCalls = (frozen: readonly FrozenSvg[], draw: Draw = call): string[] =>
  frozen
    .filter(({ piece, params, tree, svg }) => {
      const drawn = draw(piece, params);
      return JSON.stringify(JSON.parse(JSON.stringify(drawn))) !== JSON.stringify(tree) || svgOf(drawn) !== svg;
    })
    .map(({ piece, params }) => `${piece} ${JSON.stringify(params)}`);
const sha = (text: string) => createHash("sha256").update(text).digest("hex");

const frozen = load<Frozen[]>("pieces-0.2.0");

describe("Existing calls unchanged", () => {
  test("Frozen 0.2.0 calls", () => {
    expect(frozen).toHaveLength(55);
    for (const { piece, params, tree } of frozen) {
      expect(JSON.parse(JSON.stringify(call(piece, params))), `${piece} ${JSON.stringify(params)}`).toEqual(tree);
      if (piece === "ledgerMark") expect(JSON.parse(JSON.stringify(call(piece, { ...params, surface: "light" })))).toEqual(tree);
    }
  });
});

const frozenIcons = load<FrozenSvg[]>("ui-icons-0.3.0");

describe("UI icon calls of 0.3.0 unchanged", () => {
  test("Frozen 0.3.0 icon calls", () => {
    expect(frozenIcons).toHaveLength(21);
    for (const { piece, params, tree, svg } of frozenIcons) {
      const drawn = call(piece, params);
      expect(JSON.parse(JSON.stringify(drawn)), JSON.stringify(params)).toEqual(tree);
      expect(svgOf(drawn), JSON.stringify(params)).toBe(svg);
    }
  });

  test("White icons keep their 0.3.0 bytes", () => {
    const white = frozenIcons.filter(({ params }) => params.colour === "color.white");
    expect(white).toHaveLength(7);
    // SHA-256 of the seven color.white strings of the 0.6.1 fixture, joined with "\n".
    expect(sha(white.map(({ piece, params }) => svgOf(call(piece, params))).join("\n"))).toBe("1665c6dd1e4f0725de5c0083d2acd72049727e252fa9c006d059b685f576fb8b");
  });
});

const frozenArrows = load<FrozenSvg[]>("message-arrow-0.3.1");

describe("Message arrow calls of 0.3.1 unchanged", () => {
  test("Frozen 0.3.1 arrow calls", () => {
    expect(frozenArrows).toHaveLength(8);
    for (const { piece, params, tree, svg } of frozenArrows) {
      const drawn = call(piece, params);
      expect(JSON.parse(JSON.stringify(drawn)), JSON.stringify(params)).toEqual(tree);
      expect(svgOf(drawn), JSON.stringify(params)).toBe(svg);
    }
  });

  test("A changed arrow is caught", () => {
    // A longer head: each head polygon's two base points move one unit along x.
    const longerHead = (node: SvgNode): SvgNode =>
      node.tag === "polygon"
        ? { ...node, attrs: { ...node.attrs, points: String(node.attrs.points).split(" ").map((point, i) => (i === 0 ? point : point.replace(/^-?[\d.]+/, (x) => String(Number(x) - 1)))).join(" ") } }
        : node;
    const altered: Draw = (piece, params) => {
      const drawn = call(piece, params);
      return { ...drawn, body: drawn.body.map(longerHead) };
    };
    const withHead = frozenArrows.filter(({ params }) => params.head !== false).map(({ piece, params }) => `${piece} ${JSON.stringify(params)}`);
    expect(withHead).toHaveLength(7);
    expect(changedCalls(frozenArrows)).toEqual([]);
    expect(changedCalls(frozenArrows, altered)).toEqual(withHead);
  });
});

const frozen050 = load<FrozenSvg[]>("pieces-0.5.0");

describe("Piece calls of 0.5.0 unchanged", () => {
  test("Frozen 0.5.0 calls", () => {
    expect(frozen050).toHaveLength(44);
    expect(changedCalls(frozen050)).toEqual([]);
    const pill = call("pill", { x: 0, y: 0, text: "a `b` c" });
    expect(pill.text?.[0].children).toEqual(["a ", { tag: "tspan", attrs: { "font-family": "'Source Code Pro', ui-monospace, 'SF Mono', Menlo, Consolas, monospace" }, children: ["b"] }, " c"]);
  });

  test("A changed pin is caught", () => {
    // The default stem one unit longer (45 for 44): only the pin calls that give no stem differ.
    const altered: Draw = (piece, params) => call(piece, piece === "milestonePin" ? { stem: 45, ...params } : params);
    const defaultStem = frozen050.filter(({ piece, params }) => piece === "milestonePin" && params.stem === undefined).map(({ piece, params }) => `${piece} ${JSON.stringify(params)}`);
    expect(defaultStem).toHaveLength(2);
    expect(changedCalls(frozen050, altered)).toEqual(defaultStem);
  });
});

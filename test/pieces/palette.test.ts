// The v2 palette of every piece (spec illustration-pieces, "V2 palette of every
// piece", "State colours that keep a meaning"; task 3.7 of
// identity-v2-type-pieces-cleanup, ADR 0009). Each test title is the spec
// scenario it proves.
//
// Values are compared as hex, not as token paths: a piece that drew a
// decorative colour through another path with the same value would still pass,
// which is what the reader sees.
import { describe, expect, test } from "vitest";
import { EMOTE_KINDS } from "../../src/pieces/index";
import * as P from "../../src/pieces/library";
import type { Drawn, SvgNode } from "../../src/pieces/node";
import { tokens } from "../../tokens/generated/tokens";
import { REQUIRED_ONLY } from "./required-only";

const valuesOf = (tree: object): string[] =>
  Object.values(tree).flatMap((value) => (typeof value === "string" ? [value] : typeof value === "object" && value !== null ? valuesOf(value) : []));

/** The v2 palette: brand.* and surface.* of both themes, the four neutrals, illustration.*, the cast's eyes. */
const ALLOWED = new Set<string>([
  ...valuesOf(tokens.brand),
  ...valuesOf(tokens.surface),
  tokens.color.white,
  tokens.color.ink,
  tokens.color.ring,
  tokens.color.panel,
  ...valuesOf(tokens.illustration),
  tokens.cast.eyes,
  "none",
]);
const STATE = new Set<string>(valuesOf(tokens.color.state));
const S = tokens.color.state;

/**
 * Where a state colour keeps its meaning ("State colours that keep a meaning"),
 * per call label: the part, where its node sits (child indexes from the
 * drawing's body, then text: `at` the node itself, or `within` its subtree), the
 * attribute and the values it may take. A state value anywhere else in a call,
 * or a part with `at` that the call does not draw in its state colour, is a
 * problem: the allowance is per part, not per piece.
 */
type StatePart = { part: string; attr: "fill" | "stroke"; values: readonly string[] } & ({ at: string } | { within: string });
const EIP_STATES = [S.healthy, S.transitional, S.caller, S.backend];
const STATE_PARTS: Record<string, readonly StatePart[]> = {
  checkBadge: [{ part: "disc (done)", at: "0", attr: "fill", values: [S.healthy] }],
  "sheet:tail": [{ part: "tail check (done)", at: "1/1", attr: "fill", values: [S.healthy] }],
  stamp: [{ part: "face (approved)", at: "0/0", attr: "fill", values: [S.healthy] }],
  "serverStack:failing": [{ part: "failing unit's light", at: "5", attr: "fill", values: [S.failure] }],
  "emote:problem": [{ part: "warning sign (failure)", at: "0/5", attr: "fill", values: [S.failure] }],
  "emote:refused": [{ part: "disc (failure)", at: "0/0", attr: "fill", values: [S.failure] }],
  "emote:worked": [{ part: "disc (done)", at: "0/5", attr: "fill", values: [S.healthy] }],
  renewalRing: [{ part: "inner band (renewal due)", at: "1", attr: "stroke", values: [S.blocked] }],
  licenceMark: [{ part: "face (owned)", at: "0", attr: "fill", values: [S.healthy] }],
  // The published EIP notation ("Icon colours"), alone or on a name tag: anywhere in the icon.
  eipIcon: [{ part: "icon", within: "0", attr: "fill", values: EIP_STATES }],
  nameTag: [{ part: "icon", within: "1/2", attr: "fill", values: EIP_STATES }],
};

const nodesOf = (nodes: readonly (SvgNode | string)[]): SvgNode[] => nodes.flatMap((node) => (typeof node === "string" ? [] : [node, ...nodesOf(node.children)]));

type StateUse = { at: string; attr: "fill" | "stroke"; value: string };
/** Every state value a drawing uses, with where its node sits. */
const stateUses = (drawn: Drawn): StateUse[] => {
  const uses: StateUse[] = [];
  const visit = (nodes: readonly (SvgNode | string)[], prefix: string) =>
    nodes.forEach((node, index) => {
      if (typeof node === "string") return;
      const at = prefix === "" ? String(index) : `${prefix}/${index}`;
      for (const attr of ["fill", "stroke"] as const) {
        const value = String(node.attrs[attr]);
        if (STATE.has(value)) uses.push({ at, attr, value });
      }
      visit(node.children, at);
    });
  visit([...drawn.body, ...drawn.text], "");
  return uses;
};
const inPart = (use: StateUse, part: StatePart): boolean =>
  use.attr === part.attr && part.values.includes(use.value) && ("at" in part ? use.at === part.at : use.at.startsWith(`${part.within}/`));

/** Every fill and stroke of a drawing outside the palette or outside its state parts, as "<label>: <value>[ at <node>]". */
const paletteProblems = (label: string, drawn: Drawn): string[] => {
  const problems = new Set<string>();
  for (const node of nodesOf([...drawn.body, ...drawn.text])) {
    for (const attr of ["fill", "stroke"]) {
      const value = node.attrs[attr];
      if (value === undefined || ALLOWED.has(String(value)) || STATE.has(String(value))) continue;
      problems.add(`${label}: ${value}`);
    }
  }
  const parts = STATE_PARTS[label] ?? [];
  const uses = stateUses(drawn);
  for (const use of uses) if (!parts.some((part) => inPart(use, part))) problems.add(`${label}: ${use.value} at ${use.at} ${use.attr}`);
  for (const part of parts) if ("at" in part && uses.filter((use) => inPart(use, part)).length !== 1) problems.add(`${label}: ${part.part} not drawn once in its state colour`);
  return [...problems];
};

// The required colour parameters get the one accent, so the check sees the piece's own colours.
const ACCENT = "illustration.accent";
const COLOURED: Partial<Record<P.PieceName, Record<string, unknown>>> = {
  rail: { nodes: [ACCENT] },
  lineBadge: { fill: ACCENT },
  pipe: { fill: ACCENT },
  zone: { fill: ACCENT },
  phaseBand: { fill: ACCENT },
};
const draw = (name: P.PieceName, params: Record<string, unknown>): Drawn => (P.PIECES[name] as unknown as (p: Record<string, unknown>) => Drawn)(params);
const takesSurface = (name: P.PieceName) => Object.hasOwn((P.PIECES[name] as unknown as { schema: object }).schema, "surface");

// The calls that draw the state parts the required-only calls leave out.
const STATE_CALLS: Partial<Record<P.PieceName, { label: string; params: Record<string, unknown> }[]>> = {
  // A question row with a tail check (its tail rect is the second mark, 1/1), then a checked row without one.
  sheet: [{ label: "sheet:tail", params: { rows: [{ lead: "question", bar: 40, tail: "check" }, { lead: "checked", bar: 40 }] } }],
  serverStack: [{ label: "serverStack:failing", params: { units: 3, failing: 1 } }],
};

/** Each piece's required-only call (and its STATE_CALLS), on both surfaces when it takes one, and every emote kind. */
const calls = (): { label: string; drawn: Drawn }[] =>
  P.PIECE_NAMES.flatMap((name) => {
    const base = { ...REQUIRED_ONLY[name], ...COLOURED[name] };
    const variants =
      name === "emote"
        ? EMOTE_KINDS.map((kind) => ({ label: `emote:${kind}`, params: { ...base, kind } }))
        : [{ label: name, params: base }, ...(STATE_CALLS[name] ?? []).map(({ label, params }) => ({ label, params: { ...base, ...params } }))];
    const surfaces = takesSurface(name) ? (["light", "dark"] as const) : [undefined];
    return variants.flatMap(({ label, params }) => surfaces.map((surface) => ({ label, drawn: draw(name, surface === undefined ? params : { ...params, surface }) })));
  });

describe("V2 palette of every piece", () => {
  test("Every piece in the v2 palette", () => {
    const all = calls();
    expect(new Set(all.map((call) => call.label.split(":")[0]))).toEqual(new Set(P.PIECE_NAMES));
    expect(all.flatMap(({ label, drawn }) => paletteProblems(label, drawn))).toEqual([]);
  });

  test("Dark card on a piece without a surface", () => {
    expect(takesSurface("codePanel")).toBe(false);
    const lines: P.CodeLine[] = (["healthy", "caller", "white", "backend"] as const).map((color) => ({ indent: 0, w: 40, color }));
    const drawn = P.codePanel({ x: 0, y: 0, width: 200, height: 200, lines: [...lines, { indent: 0, w: 40, color: "healthy", tall: true }] });
    expect(paletteProblems("codePanel", drawn)).toEqual([]);
    const seen = new Set(nodesOf(drawn.body).map((node) => node.attrs.fill));
    for (const value of [tokens.brand.dark.cardBg, tokens.brand.dark.textMuted, tokens.brand.dark.text, tokens.brand.dark.accent]) expect(seen.has(value), value).toBe(true);
  });

  test("A decorative state colour is caught", () => {
    const gear = P.gear({ cx: 0, cy: 0 });
    const painted: Drawn = { ...gear, body: [{ ...gear.body[0], attrs: { ...gear.body[0].attrs, fill: S.transitional } }, ...gear.body.slice(1)] };
    expect(paletteProblems("gear", painted)).toEqual(["gear: #FFD25A at 0 fill"]);
    // Per part, not per piece: a listed piece's state value on another of its parts is caught too.
    const badge = P.checkBadge({ cx: 0, cy: 0 });
    const tick = badge.body.findIndex((node, index) => index > 0 && typeof node !== "string");
    const moved: Drawn = { ...badge, body: badge.body.map((node, index) => (index === tick && typeof node !== "string" ? { ...node, attrs: { ...node.attrs, stroke: S.healthy } } : node)) };
    expect(paletteProblems("checkBadge", moved)).toEqual([`checkBadge: #3DDC84 at ${tick} stroke`]);
  });
});

describe("State colours that keep a meaning", () => {
  test("State colours where they mean a state", () => {
    expect(P.checkBadge({ cx: 0, cy: 0 }).body[0].attrs.fill).toBe("#3DDC84");
    expect(nodesOf(P.stamp({ cx: 0, cy: 0, word: "GO" }).body).find((node) => node.tag === "circle")!.attrs.fill).toBe("#3DDC84");
    expect(P.licenceMark({ cx: 0, cy: 0 }).body[0].attrs.fill).toBe("#3DDC84");
    expect(P.renewalRing({ cx: 0, cy: 0, r: 18 }).body.at(-1)!.attrs.stroke).toBe("#FF8A3D");
  });

  test("Failing light only when failing", () => {
    const states = (drawn: Drawn) => nodesOf(drawn.body).filter((node) => STATE.has(String(node.attrs.fill)) || STATE.has(String(node.attrs.stroke)));
    expect(states(P.serverStack({ x: 0, y: 0, units: 3 }))).toEqual([]);
    const failing = P.serverStack({ x: 0, y: 0, units: 3, failing: 1 });
    const lit = states(failing);
    expect(lit).toHaveLength(1);
    expect(lit[0]).toMatchObject({ tag: "circle", attrs: { cy: 70, fill: "#E04848" } });
  });
});

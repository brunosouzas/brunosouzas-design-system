// Calls valid in 0.2.0 draw the same tree (spec illustration-pieces, "Existing
// calls unchanged", scenario "Frozen 0.2.0 calls"; change
// stackledger-map-and-link-pieces, task 4.4). The fixture was written once by
// scripts/freeze-pieces.ts on 897f2ff, before any code of the change.
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { PIECES, type PieceName } from "../../src/pieces/library";
import { toSvg } from "../../src/pieces/render";

type Frozen = { piece: PieceName; params: Record<string, unknown>; tree: unknown };
const frozen = JSON.parse(readFileSync(new URL("../fixtures/pieces-0.2.0.json", import.meta.url), "utf8")) as Frozen[];
const call = (piece: PieceName, params: Record<string, unknown>) => (PIECES[piece] as unknown as (p: Record<string, unknown>) => unknown)(params);

describe("Existing calls unchanged", () => {
  test("Frozen 0.2.0 calls", () => {
    expect(frozen).toHaveLength(55);
    for (const { piece, params, tree } of frozen) {
      expect(JSON.parse(JSON.stringify(call(piece, params))), `${piece} ${JSON.stringify(params)}`).toEqual(tree);
      if (piece === "ledgerMark") expect(JSON.parse(JSON.stringify(call(piece, { ...params, surface: "light" })))).toEqual(tree);
    }
  });
});

// Calls valid in 0.3.0 draw the same tree and SVG bytes (spec illustration-pieces,
// "UI icon calls of 0.3.0 unchanged"; change bend-radius-and-current-colour, task
// 2.0). The fixture was written once by scripts/freeze-ui-icons.ts on 2bfe4a5.
type FrozenIcon = Frozen & { svg: string };
const frozenIcons = JSON.parse(readFileSync(new URL("../fixtures/ui-icons-0.3.0.json", import.meta.url), "utf8")) as FrozenIcon[];

describe("UI icon calls of 0.3.0 unchanged", () => {
  test("Frozen 0.3.0 icon calls", () => {
    expect(frozenIcons).toHaveLength(21);
    for (const { piece, params, tree, svg } of frozenIcons) {
      const drawn = call(piece, params) as { body: Parameters<typeof toSvg>[0][] };
      expect(JSON.parse(JSON.stringify(drawn)), JSON.stringify(params)).toEqual(tree);
      expect(drawn.body.map((node) => toSvg(node)).join(""), JSON.stringify(params)).toBe(svg);
    }
  });
});

// Calls valid in 0.3.1 draw the same tree and SVG bytes (spec illustration-pieces,
// "Message arrow calls of 0.3.1 unchanged"; change body-diagram-pieces, task 1.1).
// The fixture was written once by scripts/freeze-message-arrow.ts on the 0.3.1 tree.
const frozenArrows = JSON.parse(readFileSync(new URL("../fixtures/message-arrow-0.3.1.json", import.meta.url), "utf8")) as FrozenIcon[];
type Written = { body: Parameters<typeof toSvg>[0][]; text: Parameters<typeof toSvg>[0][] };

describe("Message arrow calls of 0.3.1 unchanged", () => {
  test("Frozen 0.3.1 arrow calls", () => {
    expect(frozenArrows).toHaveLength(8);
    for (const { piece, params, tree, svg } of frozenArrows) {
      const drawn = call(piece, params) as Written;
      expect(JSON.parse(JSON.stringify(drawn)), JSON.stringify(params)).toEqual(tree);
      expect([...drawn.body, ...drawn.text].map((node) => toSvg(node)).join(""), JSON.stringify(params)).toBe(svg);
    }
  });
});

// Calls valid in 0.5.0 draw the same tree and SVG bytes, except a pill with paired
// backticks (spec illustration-pieces, "Piece calls of 0.5.0 unchanged"; change
// piece-params, task 1.2). The fixture was written once by
// scripts/freeze-pieces-0.5.0.ts on f91ba2e, before any code of the change.
const frozen050 = JSON.parse(readFileSync(new URL("../fixtures/pieces-0.5.0.json", import.meta.url), "utf8")) as FrozenIcon[];

describe("Piece calls of 0.5.0 unchanged", () => {
  test("Frozen 0.5.0 calls", () => {
    expect(frozen050).toHaveLength(44);
    const changed: string[] = [];
    for (const { piece, params, tree, svg } of frozen050) {
      const drawn = call(piece, params) as { body: Parameters<typeof toSvg>[0][]; text: Parameters<typeof toSvg>[0][] };
      const same = JSON.stringify(JSON.parse(JSON.stringify(drawn))) === JSON.stringify(tree) && [...drawn.body, ...drawn.text].map((node) => toSvg(node)).join("") === svg;
      if (!same) changed.push(`${piece} ${JSON.stringify(params)}`);
    }
    expect(changed).toEqual(['pill {"x":0,"y":0,"text":"a `b` c"}']);
    const pill = call("pill", { x: 0, y: 0, text: "a `b` c" }) as { text: { children: unknown[] }[] };
    expect(pill.text[0].children).toEqual(["a ", { tag: "tspan", attrs: { "font-family": "ui-monospace, 'SF Mono', Menlo, Consolas, monospace" }, children: ["b"] }, " c"]);
  });
});

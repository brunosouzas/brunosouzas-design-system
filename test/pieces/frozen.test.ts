// Calls valid in 0.2.0 draw the same tree (spec illustration-pieces, "Existing
// calls unchanged", scenario "Frozen 0.2.0 calls"; change
// stackledger-map-and-link-pieces, task 4.4). The fixture was written once by
// scripts/freeze-pieces.ts on 897f2ff, before any code of the change.
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { PIECES, type PieceName } from "../../src/pieces/library";

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

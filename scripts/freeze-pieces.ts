// Freezes the 0.2.0 drawings of the pieces that change
// stackledger-map-and-link-pieces touches (lineBadge, the three diagram nodes,
// ledgerMark), so test/pieces/frozen.test.ts can prove a 0.2.0 call still
// draws the same tree (spec illustration-pieces, "Existing calls unchanged";
// design §6b of the change).
//
// Run once on 897f2ff, the 0.2.0 tree, before any code change:
//   npx tsx scripts/freeze-pieces.ts
// It writes test/fixtures/pieces-0.2.0.json. Do not run it again on a later
// tree: the fixture is the record of 0.2.0.
import { writeFileSync } from "node:fs";
import { hexNode, ledgerMark, lineBadge, nodeBlock, pillNode } from "../src/pieces/metro.ts";

type Call = { piece: string; params: Record<string, unknown> };
const calls: Call[] = [];
const surfaces = ["light", "dark"] as const;

for (const surface of surfaces) {
  for (const flat of [false, true]) {
    const base = { x: 50, y: 20, text: "SH", fill: "color.healthy", surface, flat };
    calls.push({ piece: "lineBadge", params: { ...base } });
    calls.push({ piece: "lineBadge", params: { ...base, inkScale: 1.6 } });
    calls.push({ piece: "lineBadge", params: { ...base, inkScale: 1.6, height: 34, width: 54 } });
  }
}
for (const piece of ["nodeBlock", "pillNode", "hexNode"]) {
  for (const surface of surfaces) {
    const base = { x: 10, y: 10, width: 200, title: "Stripe", surface };
    const variants: Record<string, unknown>[] = [
      { state: "normal" },
      { state: "normal", subtitle: "kind" },
      { state: "focus" },
      { state: "focus", subtitle: "kind" },
      { state: "placeholder" },
    ];
    for (const variant of variants) {
      calls.push({ piece, params: { ...base, ...variant } });
      if (piece === "nodeBlock") calls.push({ piece, params: { ...base, ...variant, radius: 6 } });
    }
  }
}
calls.push({ piece: "ledgerMark", params: { x: 0, y: 0 } });
calls.push({ piece: "ledgerMark", params: { x: 0, y: 0, size: 16 } });
calls.push({ piece: "ledgerMark", params: { x: 0, y: 0, size: 120, line: "color.healthy" } });

const pieces: Record<string, (p: never) => unknown> = { lineBadge, nodeBlock, pillNode, hexNode, ledgerMark };
const frozen = calls.map(({ piece, params }) => ({ piece, params, tree: pieces[piece](params as never) }));
writeFileSync("test/fixtures/pieces-0.2.0.json", `${JSON.stringify(frozen, null, 2)}\n`);
console.log(`wrote test/fixtures/pieces-0.2.0.json (${frozen.length} calls)`);

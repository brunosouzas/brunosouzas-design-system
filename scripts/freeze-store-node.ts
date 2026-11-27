// Freezes the 0.14.1 drawing of the `storeNode` piece, so test/pieces/frozen.test.ts
// can prove every call still draws the same tree and SVG bytes after `text`
// becomes optional (spec illustration-pieces, "Store node calls of 0.14.1
// unchanged"; change store-node-without-words, task 1.1).
//
// Run once, on this branch while `src/` and `tokens/` still equal 0.14.1
// (d334273; the branch feature/sw-248-store-node-without-words had changed only
// openspec/ and added this script when it ran), before any code:
//   npx tsx scripts/freeze-store-node.ts
// It writes test/fixtures/store-node-0.14.1.json: 8 calls at x 0, y 0: at width
// 100, height 60, text ["IDs"] alone, with a subtitle, with a fill, with ry 15
// and on the dark surface; three lines at 160 x 120; a code run at textSize 36
// (200 x 122); and inkScale 2 at 120 x 80. Each entry holds the piece, its
// params, its tree and `svg`, the body then the text nodes through toSvg,
// joined with no separator (frozen.test.ts's `svgOf`). Do not run it again on a
// later tree: the fixture is the record of the 0.14.1 store. If it fails, the
// import path or the piece's schema changed; fix the script against d334273,
// never the fixture by hand.
import { writeFileSync } from "node:fs";
import { storeNode } from "../src/pieces/library.ts";
import { toSvg } from "../src/pieces/render.ts";

const base = { x: 0, y: 0, width: 100, height: 60, text: ["IDs"] };
const calls: Record<string, unknown>[] = [
  base,
  { ...base, subtitle: "in memory" },
  { ...base, fill: "color.state.healthy" },
  { ...base, ry: 15 },
  { ...base, surface: "dark" },
  { x: 0, y: 0, width: 160, height: 120, text: ["a", "b", "c"] },
  { x: 0, y: 0, width: 200, height: 122, text: ["`orderId`"], textSize: 36 },
  { x: 0, y: 0, width: 120, height: 80, text: ["IDs"], inkScale: 2 },
];

const frozen = calls.map((params) => {
  const drawn = storeNode(params as Parameters<typeof storeNode>[0]);
  return { piece: "storeNode", params, tree: JSON.parse(JSON.stringify(drawn)), svg: [...drawn.body, ...drawn.text].map((node) => toSvg(node)).join("") };
});
writeFileSync(new URL("../test/fixtures/store-node-0.14.1.json", import.meta.url), `[\n${frozen.map((entry) => JSON.stringify(entry)).join(",\n")}\n]\n`);
console.log(`wrote test/fixtures/store-node-0.14.1.json (${frozen.length} calls)`);

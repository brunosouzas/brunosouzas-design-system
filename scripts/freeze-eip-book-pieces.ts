// Freezes the 0.14.1 data of the 26 EIP icons and the 0.14.1 drawing of the
// `queueNode` piece, so the tests can prove that only the offset shadows left
// the icons (spec illustration-pieces, "EIP icons without offset shadows",
// scenario "Every face kept") and that every queue call still draws the same
// tree and SVG bytes after `text` becomes optional ("Queue node calls of 0.14.1
// unchanged"; change flat-eip-icons-and-empty-queue, task 1.1).
//
// Run once, on this branch while `src/` and `tokens/` still equal d26f254 (the
// branch feature/sw-249-flat-eip-icons-and-empty-queue had changed only
// openspec/ and docs/ and added this script when it ran), before any code:
//   npx tsx scripts/freeze-eip-book-pieces.ts
// In d26f254 the icons and `queueNode` draw as in 0.14.1: `git diff d334273
// d26f254 -- src tokens` touches only `storeNode`. It writes:
// - test/fixtures/eip-icons-0.14.1.json: each icon's name, title, description
//   and nodes, in EIP_ICONS order;
// - test/fixtures/queue-node-0.14.1.json: 8 calls at x 0, y 0: at width 100,
//   text ["orders"] alone, with a subtitle, with a fill and on the dark
//   surface; height 60; three lines at 160 x 120; a code run at textSize 36
//   (200 x 60); and inkScale 2 at 120 x 60. Each entry holds the piece, its
//   params, its tree and `svg`, the body then the text nodes through toSvg,
//   joined with no separator (frozen.test.ts's `svgOf`).
// Do not run it again on a later tree: the fixtures are the record of 0.14.1.
// If it fails, the import paths or the piece's schema changed; fix the script
// against d26f254, never the fixtures by hand.
import { writeFileSync } from "node:fs";
import { EIP_ICONS } from "../src/pieces/eip-icons.ts";
import { queueNode } from "../src/pieces/library.ts";
import { toSvg } from "../src/pieces/render.ts";

const write = (name: string, entries: readonly unknown[]) => {
  writeFileSync(new URL(`../test/fixtures/${name}.json`, import.meta.url), `[\n${entries.map((entry) => JSON.stringify(entry)).join(",\n")}\n]\n`);
  console.log(`wrote test/fixtures/${name}.json (${entries.length} entries)`);
};

write("eip-icons-0.14.1", EIP_ICONS.map(({ name, title, description, nodes }) => ({ name, title, description, nodes: JSON.parse(JSON.stringify(nodes)) })));

const base = { x: 0, y: 0, width: 100, text: ["orders"] };
const calls: Record<string, unknown>[] = [
  base,
  { ...base, subtitle: "durable" },
  { ...base, fill: "color.state.healthy" },
  { ...base, surface: "dark" },
  { ...base, height: 60 },
  { x: 0, y: 0, width: 160, height: 120, text: ["a", "b", "c"] },
  { x: 0, y: 0, width: 200, height: 60, text: ["`orderId`"], textSize: 36 },
  { x: 0, y: 0, width: 120, height: 60, text: ["orders"], inkScale: 2 },
];

write(
  "queue-node-0.14.1",
  calls.map((params) => {
    const drawn = queueNode(params as Parameters<typeof queueNode>[0]);
    return { piece: "queueNode", params, tree: JSON.parse(JSON.stringify(drawn)), svg: [...drawn.body, ...drawn.text].map((node) => toSvg(node)).join("") };
  }),
);

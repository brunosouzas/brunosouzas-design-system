// Freezes the 0.3.1 drawings of messageArrow, so test/pieces/frozen.test.ts can
// prove a 0.3.1 call still draws the same tree and the same SVG bytes (spec
// illustration-pieces, "Message arrow calls of 0.3.1 unchanged"; change
// body-diagram-pieces, design §5).
//
// Run once on the 0.3.1 tree (origin/main b0712a9; the spec commits on top of it
// change no source), before any code change:
//   npx tsx scripts/freeze-message-arrow.ts
// It writes test/fixtures/message-arrow-0.3.1.json. Do not run it again on a
// later tree: the fixture is the record of 0.3.1.
import { writeFileSync } from "node:fs";
import { messageArrow } from "../src/pieces/metro.ts";
import { toSvg } from "../src/pieces/render.ts";

const calls: Parameters<typeof messageArrow>[0][] = [
  { from: [0, 0], to: [200, 100] },
  { from: [0, 0], to: [0, 100] },
  { from: [0, 0], to: [25, 100] },
  { from: [0, 0], to: [100, 0], curve: "straight", label: "used by" },
  { from: [10, 20], to: [300, -40], head: false },
  { from: [-50, 10], to: [150, 90], width: 4, surface: "dark" },
  { from: [0, 0], to: [120, 60], curve: "straight", width: 1, label: "x" },
  { from: [300, 200], to: [0, 0], surface: "dark", label: "reads" },
];

const frozen = calls.map((params) => {
  const drawn = messageArrow(params);
  return { piece: "messageArrow", params, tree: JSON.parse(JSON.stringify(drawn)), svg: [...drawn.body, ...drawn.text].map((node) => toSvg(node)).join("") };
});
writeFileSync(new URL("../test/fixtures/message-arrow-0.3.1.json", import.meta.url), `${JSON.stringify(frozen, null, 2)}\n`);
console.log(`wrote ${frozen.length} calls`);

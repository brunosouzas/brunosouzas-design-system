// Freezes the 0.5.0 drawings of the four pieces change piece-params touches
// (milestonePin, countBadge, pill, messageArrow), so test/pieces/frozen.test.ts can
// prove a 0.5.0 call still draws the same tree and the same SVG bytes (spec
// illustration-pieces, "Piece calls of 0.5.0 unchanged"; change piece-params,
// design §2).
//
// Run once on the 0.5.0 tree (origin/main f91ba2e; the spec commits on top of it
// change no source), before any code change:
//   npx tsx scripts/freeze-pieces-0.5.0.ts
// It writes test/fixtures/pieces-0.5.0.json. Do not run it again on a later
// tree: the fixture is the record of 0.5.0.
import { writeFileSync } from "node:fs";
import { PIECES, type PieceName } from "../src/pieces/library.ts";
import { toSvg } from "../src/pieces/render.ts";

type Call = { piece: PieceName; params: Record<string, unknown> };
const calls: Call[] = [];
const add = (piece: PieceName, ...variants: Record<string, unknown>[]) => variants.forEach((params) => calls.push({ piece, params }));

add(
  "milestonePin",
  { x: 224, y: 292, text: "1" },
  { x: 306, y: 252, text: "S", fill: "color.transitional" },
  { x: 100, y: 200, text: "42", fill: "color.white", stem: 60 },
  { x: 0, y: 0, text: "D", stem: 0.5 },
);
for (const surface of ["light", "dark"] as const) {
  add(
    "countBadge",
    { cx: 20, cy: 20, text: "3", surface },
    { cx: 20, cy: 20, text: "12", surface },
    { cx: 20, cy: 20, text: "3", width: 40, surface },
    { cx: 294, cy: 206, text: "1", height: 30, inkScale: 1.34, surface },
    { cx: 50, cy: 50, text: "128", height: 24, surface },
  );
}
add(
  "pill",
  { x: 132, y: 174, text: "request" },
  { x: 200, y: 110, text: "main", width: 84 },
  { x: 445, y: 220, text: "uat", width: 68, fill: "color.transitional" },
  { x: 0, y: 0, text: "a `b` c" },
  { x: 0, y: 0, text: "Azure DevOps", width: 150, fill: "color.healthy" },
);
const ends = { from: [0, 0], to: [200, 100] };
const straight = { from: [0, 0], to: [100, 0], curve: "straight" };
const through = { from: [0, 0], to: [100, 100], controls: [[0, 50], [100, 50]] };
for (const kind of ["message", "reply", "failure", "failFast"] as const) {
  add("messageArrow", { ...ends, kind }, { ...straight, kind }, { ...through, kind }, { ...straight, kind, head: false }, { ...ends, kind, surface: "dark", label: "x" });
}
add(
  "messageArrow",
  { from: [0, 0], to: [100, 100], controls: [[0, 50], [100, 100]] },
  { from: [291, 136], to: [378, 136], curve: "straight", width: 2.1 },
  { from: [283, 86.8], to: [440, 86.8], curve: "straight", width: 2.1, kind: "failure", head: false },
  { from: [273, 257.6], to: [440, 328.5], width: 2.1, controls: [[336, 257.6], [425, 285]], kind: "failure" },
  { from: [0, 0], to: [-120, 40], width: 1, label: "`code`" },
);

const call = (piece: PieceName, params: Record<string, unknown>) => (PIECES[piece] as unknown as (p: Record<string, unknown>) => { body: unknown[]; text: unknown[] })(params);
const frozen = calls.map(({ piece, params }) => {
  const drawn = call(piece, params);
  return { piece, params, tree: JSON.parse(JSON.stringify(drawn)), svg: [...drawn.body, ...drawn.text].map((node) => toSvg(node as never)).join("") };
});
writeFileSync(new URL("../test/fixtures/pieces-0.5.0.json", import.meta.url), `${JSON.stringify(frozen, null, 2)}\n`);
console.log(`wrote ${frozen.length} calls`);

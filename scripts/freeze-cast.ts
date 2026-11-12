// Freezes the 0.11.0 drawings of the five cast pieces (mira, visor, drone, kiu,
// sinal), so test/pieces/frozen.test.ts can prove every 0.11.0 call still draws
// the same tree and SVG bytes after Visor gains `holdsSheet` and `facing`
// (spec illustration-pieces, "Cast calls of 0.11.0 unchanged"; change
// sdd-scene-pieces, task 1.1).
//
// Run once, on the code of 0.11.0 (d162a39; the branch
// feature/ab333-sdd-scene-pieces had changed only openspec/ when it ran),
// before any change to src/pieces/brand-cast.ts:
//   npx tsx scripts/freeze-cast.ts
// It writes test/fixtures/cast-0.11.0.json: 138 calls at x 100, y 300. Every
// surface, view and expression of mira, drone, kiu and sinal (64 calls), the
// same for visor over holds and points (64), and each piece at scale 0.25 and
// 4 (10). Each entry holds the piece, its params, its tree and
// `svg`, toSvg(g({}, ...body, ...text)). Do not run it again on a later tree:
// the fixture is the record of the 0.11.0 cast; a later change to the cast
// writes its own fixture, with the owner's approval of the renders. One call per
// line keeps the file small enough to read in a diff.
import { writeFileSync } from "node:fs";
import { CAST_EXPRESSIONS, CAST_VIEWS, drone, kiu, mira, sinal, visor } from "../src/pieces/brand-cast.ts";
import { g } from "../src/pieces/node.ts";
import type { Drawn } from "../src/pieces/node.ts";
import { toSvg } from "../src/pieces/render.ts";

type CastName = "mira" | "visor" | "drone" | "kiu" | "sinal";
const PIECES: Record<CastName, (params: never) => Drawn> = { mira, visor, drone, kiu, sinal };
const SURFACES = ["light", "dark"] as const;

const calls: { piece: CastName; params: Record<string, unknown> }[] = [];
for (const piece of ["mira", "drone", "kiu", "sinal"] as const) {
  for (const surface of SURFACES) {
    for (const view of CAST_VIEWS) {
      for (const expression of CAST_EXPRESSIONS) calls.push({ piece, params: { x: 100, y: 300, surface, view, expression } });
    }
  }
}
for (const surface of SURFACES) {
  for (const view of CAST_VIEWS) {
    for (const expression of CAST_EXPRESSIONS) {
      for (const holds of [true, false]) {
        for (const points of [true, false]) calls.push({ piece: "visor", params: { x: 100, y: 300, surface, view, expression, holds, points } });
      }
    }
  }
}
for (const piece of ["mira", "visor", "drone", "kiu", "sinal"] as const) {
  for (const scale of [0.25, 4]) calls.push({ piece, params: { x: 100, y: 300, scale } });
}

const frozen = calls.map(({ piece, params }) => {
  const drawn = (PIECES[piece] as (p: Record<string, unknown>) => Drawn)(params);
  return { piece, params, tree: JSON.parse(JSON.stringify(drawn)), svg: toSvg(g({}, ...drawn.body, ...drawn.text)) };
});
writeFileSync(new URL("../test/fixtures/cast-0.11.0.json", import.meta.url), `[\n${frozen.map((entry) => JSON.stringify(entry)).join(",\n")}\n]\n`);
console.log(`wrote test/fixtures/cast-0.11.0.json (${frozen.length} calls)`);

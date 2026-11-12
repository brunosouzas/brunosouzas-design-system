// Freezes the 0.12.0 drawing of the `stamp` piece, so test/pieces/frozen.test.ts
// can prove every call still draws the same tree and SVG bytes after `stamp`
// moves unchanged from src/pieces/library.ts to src/pieces/stamp.ts (spec
// illustration-pieces, "Stamp calls of 0.12.0 unchanged"; change
// supporting-characters, task 2.0). The move breaks an import cycle: Balão
// holds a stamp, and library.ts imports the supporting cast to list it.
//
// Run once, on the code of 0.12.0 (655525d; the branch
// feature/ab337-supporting-characters had changed only openspec/ when it ran),
// before the move:
//   npx tsx scripts/freeze-stamp.ts
// It writes test/fixtures/stamp-0.12.0.json: 8 calls at cx 100, cy 300, word
// GO: round and rect, at the default r and at 24, each once with the default
// rotate and fill and once with rotate 0 and fill illustration.accent. Each
// entry holds the piece, its params, its tree and `svg`, the body then the
// text nodes through toSvg, joined with no separator (frozen.test.ts's
// `svgOf`). Do not run it again on a later tree: the fixture is the record of
// the 0.12.0 stamp. If it fails, the import path or the piece's schema
// changed; fix the script against 655525d, never the fixture by hand.
import { writeFileSync } from "node:fs";
import { stamp } from "../src/pieces/library.ts";
import { toSvg } from "../src/pieces/render.ts";

const calls: Record<string, unknown>[] = [];
for (const shape of ["round", "rect"] as const) {
  for (const r of [undefined, 24]) {
    for (const set of [false, true]) {
      calls.push({ cx: 100, cy: 300, word: "GO", shape, ...(r === undefined ? {} : { r }), ...(set ? { rotate: 0, fill: "illustration.accent" } : {}) });
    }
  }
}

const frozen = calls.map((params) => {
  const drawn = stamp(params as Parameters<typeof stamp>[0]);
  return { piece: "stamp", params, tree: JSON.parse(JSON.stringify(drawn)), svg: [...drawn.body, ...drawn.text].map((node) => toSvg(node)).join("") };
});
writeFileSync(new URL("../test/fixtures/stamp-0.12.0.json", import.meta.url), `[\n${frozen.map((entry) => JSON.stringify(entry)).join(",\n")}\n]\n`);
console.log(`wrote test/fixtures/stamp-0.12.0.json (${frozen.length} calls)`);

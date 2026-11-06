// Freezes the 0.7.0 drawings of emote, so test/pieces/emote.test.ts can prove
// every emote call still draws the same SVG bytes (spec illustration-pieces,
// "Emote look frozen"; change identity-v2-type-pieces-cleanup, task 4.4). It
// replaces the emote parts of the retired cast-0.5.0.json and
// cast-dark-0.5.2.json.
//
// Run once for 0.7.0, on the drawing the owner approved from the renders of
// group 8 (2026-11-06, branch feature/ab300-identity-v2-0.7.0 at a70a032):
//   npx tsx scripts/freeze-emote.ts
// Re-run once more for the code review of 0.7.0 (2026-11-06), after the
// invisible white highlight of the `pressure` drops was removed; only the
// pressure entries changed. It writes test/fixtures/emote-0.7.0.json: each kind, with and without its
// burst, on both surfaces, at scale 1 and 2, with the SHA-256 of
// toSvg(g({}, ...body, ...text)). Do not run it again on a later tree: the
// fixture is the record of the approved 0.7.0 emotes.
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { EMOTE_KINDS, emote, type EmoteParams } from "../src/pieces/emote.ts";
import { g } from "../src/pieces/node.ts";
import { toSvg } from "../src/pieces/render.ts";

const calls: EmoteParams[] = [];
for (const kind of EMOTE_KINDS) {
  for (const burst of [true, false]) {
    for (const surface of ["light", "dark"] as const) {
      for (const scale of [1, 2]) calls.push({ kind, x: 100, y: 80, scale, burst, surface });
    }
  }
}

const frozen = calls.map((params) => {
  const drawn = emote(params);
  return { piece: "emote", params, sha256: createHash("sha256").update(toSvg(g({}, ...drawn.body, ...drawn.text))).digest("hex") };
});
writeFileSync(new URL("../test/fixtures/emote-0.7.0.json", import.meta.url), `${JSON.stringify(frozen, null, 2)}\n`);
console.log(`wrote test/fixtures/emote-0.7.0.json (${frozen.length} calls)`);

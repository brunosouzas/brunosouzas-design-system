// Freezes the 0.3.0 drawings of uiIcon, so test/pieces/frozen.test.ts can prove
// a 0.3.0 call still draws the same tree and the same SVG bytes (spec
// illustration-pieces, "UI icon calls of 0.3.0 unchanged"; change
// bend-radius-and-current-colour, design §2).
//
// Run once on 2bfe4a5, the 0.3.0 tree, before any code change:
//   npx tsx scripts/freeze-ui-icons.ts
// It writes test/fixtures/ui-icons-0.3.0.json. Do not run it again on a later
// tree: the fixture is the record of 0.3.0.
import { writeFileSync } from "node:fs";
import { toSvg } from "../src/pieces/render.ts";
import { UI_ICON_NAMES, uiIcon } from "../src/pieces/ui-icons.ts";

const calls: Record<string, unknown>[] = [];
for (const name of UI_ICON_NAMES) {
  calls.push({ name, x: 0, y: 0 });
  calls.push({ name, x: 0, y: 0, colour: "surface.dark.text" });
  calls.push({ name, x: 3.5, y: -2, size: 18, colour: "color.white" });
}

const frozen = calls.map((params) => {
  const drawn = uiIcon(params as Parameters<typeof uiIcon>[0]);
  return { piece: "uiIcon", params, tree: JSON.parse(JSON.stringify(drawn)), svg: drawn.body.map((node) => toSvg(node)).join("") };
});
writeFileSync(new URL("../test/fixtures/ui-icons-0.3.0.json", import.meta.url), `${JSON.stringify(frozen, null, 2)}\n`);
console.log(`wrote ${frozen.length} calls`);

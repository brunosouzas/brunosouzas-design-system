// Freezes the stage ring radii the circuit-breaker and publish-subscribe scenes
// draw in 0.11.0, so test/brand/stage-rings.test.ts can prove that `Rings`,
// once it reads the `scene.*` tokens through `stageRingRadii`, draws the same
// rings (spec motion-components, "Existing scenes keep their rings"; change
// sdd-scene-pieces, task 1.2).
//
// Run once, on the code of 0.11.0 (d162a39), before any change to
// src/brand/components.tsx:
//   npx tsx scripts/freeze-scene-rings.ts
// The loop and its four constants are copied here as literals from `Rings` in
// src/brand/components.tsx at d162a39, never read through the new helper, so the
// fixture records what 0.11.0 drew. It writes test/fixtures/scene-rings-0.11.0.json:
// one entry per scene and format (16:9 is 1920 x 1080, 4:5 is 1080 x 1350), with
// the stroke width and the radii. Do not run it again on a later tree.
import { writeFileSync } from "node:fs";

// The constants of `Rings` at d162a39 (src/brand/components.tsx, lines 31-35).
const RING_FIRST_RADIUS = 100;
const RING_STEP = 34;
const RING_STROKE = 2.5;
const RING_REACH = 1.2;

/** The loop of `Rings` at d162a39, unchanged. */
const radiiOf = (width: number, height: number): number[] => {
  const radii: number[] = [];
  for (let r = RING_FIRST_RADIUS; r < Math.max(width, height) * RING_REACH; r += RING_STEP) radii.push(r);
  return radii;
};

const FORMATS = [
  { format: "16:9", width: 1920, height: 1080 },
  { format: "4:5", width: 1080, height: 1350 },
] as const;

const entries = ["circuit-breaker-states", "publish-subscribe"].flatMap((scene) =>
  FORMATS.map(({ format, width, height }) => ({ scene, format, width, height, strokeWidth: RING_STROKE, radii: radiiOf(width, height) })),
);
writeFileSync(new URL("../test/fixtures/scene-rings-0.11.0.json", import.meta.url), `${JSON.stringify(entries, null, 2)}\n`);
for (const { scene, format, radii } of entries) console.log(`${scene} ${format}: ${radii.length} radii, ${radii[0]} to ${radii[radii.length - 1]}`);
console.log(`wrote test/fixtures/scene-rings-0.11.0.json (${entries.length} entries)`);

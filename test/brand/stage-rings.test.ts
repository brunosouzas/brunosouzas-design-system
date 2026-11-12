// The stage rings read the scene tokens and the existing scenes keep their
// rings (spec motion-components, "Stage rings from the scene tokens"; change
// sdd-scene-pieces, tasks 3.2 and 3.3). The fixture was written by
// scripts/freeze-scene-rings.ts from the 0.11.0 loop of `Rings` (d162a39),
// before any change to src/brand/components.tsx.
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { stageRingRadii } from "../../src/brand/motion";
import { tokens } from "../../tokens/generated/tokens";

type Entry = { scene: string; format: string; width: number; height: number; strokeWidth: number; radii: number[] };
const fixture = JSON.parse(readFileSync(new URL("../fixtures/scene-rings-0.11.0.json", import.meta.url), "utf8")) as Entry[];

describe("Stage rings from the scene tokens", () => {
  test("Existing scenes keep their rings", () => {
    expect(fixture.map(({ scene, format }) => `${scene} ${format}`)).toEqual([
      "circuit-breaker-states 16:9",
      "circuit-breaker-states 4:5",
      "publish-subscribe 16:9",
      "publish-subscribe 4:5",
    ]);
    for (const { scene, format, width, height, strokeWidth, radii } of fixture) {
      expect(stageRingRadii(width, height), `${scene} ${format}`).toEqual(radii);
      expect(tokens.scene.ringWidth, `${scene} ${format}`).toBe(strokeWidth);
    }
    expect(fixture[0].strokeWidth).toBe(2.5);
  });

  test("No ring constant in the component", () => {
    const source = readFileSync(new URL("../../src/brand/components.tsx", import.meta.url), "utf8");
    for (const name of ["RING_FIRST_RADIUS", "RING_STEP", "RING_STROKE", "RING_REACH"]) expect(source, name).not.toMatch(new RegExp(`\\b${name}\\b`));
    const rings = source.slice(source.indexOf("export const Rings"), source.indexOf("export const InkBlock"));
    expect(rings).toContain("stageRingRadii(width, height)");
    expect(rings).toContain("strokeWidth={scene.ringWidth}");
    expect(source).toMatch(/const \{[^}]*\bscene\b[^}]*\} = tokens;/);
  });
});

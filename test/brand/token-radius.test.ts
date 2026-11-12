// The optional token radius (spec motion-components, "Token radius"; change
// circuit-breaker-topology-scene, task 1.3). The default must draw exactly as
// before, because publish-subscribe passes no radius; its own tests run
// unedited (`test/scenes/publish-subscribe.test.ts`).
import { expect, test } from "vitest";
import { DEFAULT_TOKEN_RADIUS, positionedTokenDrawing, positionedTokenStyle } from "../../src/brand/flow-shapes";
import { tokens } from "../../tokens/generated/tokens";

const point = { x: 1, y: 2 };

test("Default unchanged", () => {
  // Today's fields, written out (0.12.0's positionedTokenStyle).
  const before = { point, radius: 17, fill: tokens.color.white, stroke: tokens.color.ink, strokeWidth: tokens.outline.small + 1, shadow: tokens.shadow.small };
  expect(DEFAULT_TOKEN_RADIUS).toBe(17);
  expect(positionedTokenStyle(point)).toEqual(before);
  expect(positionedTokenDrawing(point)).toEqual(before);
  expect(positionedTokenStyle(point, undefined, undefined, undefined)).toEqual(before);
});

test("Smaller token", () => {
  const small = positionedTokenStyle(point, undefined, undefined, 10);
  const { radius, ...rest } = small;
  const { radius: _default, ...defaults } = positionedTokenStyle(point);
  expect(radius).toBe(10);
  expect(rest).toEqual(defaults);
  expect(positionedTokenDrawing(point, undefined, undefined, 10)).toEqual(small);
});

test("Bad radius", () => {
  for (const radius of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    expect(() => positionedTokenStyle(point, undefined, undefined, radius), String(radius)).toThrow(RangeError);
    expect(() => positionedTokenStyle(point, undefined, undefined, radius), String(radius)).toThrow(/radius/);
  }
});

// The dashed motion path (spec motion-components, "Dashed motion path"; change
// scene-takes-infrastructure, task 4.1): the opacity helper and the pure
// drawing data `MotionPath` renders, so no Remotion context is needed.
import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { motionPathAt, motionPathDrawing } from "../../src/brand/motion";
import { tokens } from "../../tokens/generated/tokens";

const IN = [90, 100] as const;
const OUT = [220, 230] as const;

test("Fade in and out", () => {
  expect([89, 90, 95, 100, 219, 225, 230].map((frame) => motionPathAt(frame, IN, OUT))).toEqual([0, 0, 0.5, 1, 1, 0.5, 0]);
  expect(motionPathDrawing("M 0,0 L 10,10", motionPathAt(89, IN, OUT))).toBeNull();
  expect(motionPathDrawing("M 0,0 L 10,10", motionPathAt(230, IN, OUT))).toBeNull();
  expect(motionPathDrawing("M 0,0 L 10,10", motionPathAt(95, IN, OUT))?.opacity).toBe(0.5);
});

test("No fade-out", () => {
  expect(motionPathAt(610, [600, 610])).toBe(1);
  expect(motionPathAt(779, [600, 610])).toBe(1);
});

test("Drawn from the tokens", () => {
  expect(motionPathDrawing("M 0,0 L 10,10", 1)).toEqual({
    d: "M 0,0 L 10,10",
    opacity: 1,
    fill: "none",
    stroke: tokens.scene.pathColor,
    strokeWidth: tokens.scene.pathWidth,
    strokeDasharray: `${tokens.scene.pathDash} ${tokens.scene.pathGap}`,
    strokeLinecap: "round",
  });
  // The component draws the descriptor and reads no frame of its own.
  const source = readFileSync(new URL("../../src/brand/components.tsx", import.meta.url), "utf8");
  const component = source.slice(source.indexOf("export const MotionPath"));
  expect(component).toContain("motionPathDrawing(d, opacity)");
  expect(component).not.toContain("useCurrentFrame");
});

test("Bad ranges", () => {
  expect(() => motionPathAt(95, [100, 90])).toThrow(RangeError);
  expect(() => motionPathAt(95, [100, 90])).toThrow(/motionPathAt: fadeIn/);
  expect(() => motionPathAt(95, IN, [230, 220])).toThrow(/motionPathAt: fadeOut/);
  expect(() => motionPathAt(95, IN, [95, 105])).toThrow(/motionPathAt: fadeOut must start at or after fadeIn ends/);
  for (const frame of [Number.NaN, Number.POSITIVE_INFINITY]) {
    expect(() => motionPathAt(frame, IN, OUT)).toThrow(RangeError);
    expect(() => motionPathAt(frame, IN, OUT)).toThrow(/motionPathAt: frame/);
  }
});

// The failure-rate bar (spec motion-components, "Failure-rate bar" and
// "Failure-rate bar input"; change circuit-breaker-topology-scene, task 1.4).
// The shapes are pure data (rate-bar-shape.ts); the component only draws them.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import { failureRateBarShapes, type FailureRateBarProps } from "../../src/brand/rate-bar-shape";
import { tokens } from "../../tokens/generated/tokens";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const props = (edit: Partial<FailureRateBarProps> = {}): FailureRateBarProps => ({ rate: 0.2, threshold: 0.8, width: 290, height: 16, ...edit });

test("Fill and tick", () => {
  const { track, fill, tick } = failureRateBarShapes(props());
  expect(track).toEqual({ x: 0, y: 0, width: 290, height: 16, radius: 8, fill: tokens.color.white, stroke: tokens.color.ink, strokeWidth: tokens.outline.small });
  expect(fill).toEqual({ x: 0, y: 0, width: 58, height: 16, radius: 8, fill: tokens.color.state.failure, stroke: tokens.color.ink, strokeWidth: tokens.outline.small });
  expect(tick).toEqual({ x: 232, y1: -8, y2: 24, stroke: tokens.color.ink, strokeWidth: tokens.outline.small + 0.5, linecap: "round" });
});

test("Small and empty rates", () => {
  expect(failureRateBarShapes(props({ rate: 0.01 })).fill?.width).toBe(16);
  expect(failureRateBarShapes(props({ rate: 0 })).fill).toBeNull();
});

test("Narrow track", () => {
  const { fill, track } = failureRateBarShapes(props({ rate: 0.5, width: 10 }));
  expect(fill?.width).toBe(10);
  expect(fill!.width).toBeLessThanOrEqual(track.width);
  expect(fill?.radius).toBe(8);
});

test("Full rate", () => {
  const shapes = failureRateBarShapes(props({ rate: 1 }));
  expect(shapes.fill?.width).toBe(shapes.track.width);
  // Drawn in key order: track, fill, then the tick over them.
  expect(Object.keys(shapes)).toEqual(["track", "fill", "tick"]);
});

test("Drawn from the tokens", () => {
  // No colour literal in either file (the repository-wide scan is test/brand/no-colour-literals.test.ts).
  for (const name of ["rate-bar-shape.ts", "rate-bar.tsx"]) {
    const source = readFileSync(join(repoRoot, "src/brand", name), "utf8");
    expect(source, name).not.toMatch(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-zA-Z_])|\b(?:rgba?|hsla?)\(/);
  }
  // Every colour and outline the shapes carry is a token value.
  const colours = new Set<string>([tokens.color.white, tokens.color.ink, tokens.color.state.failure]);
  const { track, fill, tick } = failureRateBarShapes(props({ rate: 1 }));
  for (const shape of [track, fill!]) {
    expect(colours.has(shape.fill)).toBe(true);
    expect(shape.stroke).toBe(tokens.color.ink);
    expect(shape.strokeWidth).toBe(tokens.outline.small);
  }
  expect(tick.stroke).toBe(tokens.color.ink);
});

test("Bad props", () => {
  const cases: [Partial<FailureRateBarProps>, string][] = [
    [{ rate: -0.1 }, "rate"], [{ rate: 1.01 }, "rate"], [{ rate: Number.NaN }, "rate"],
    [{ threshold: 0 }, "threshold"], [{ threshold: 1 }, "threshold"], [{ threshold: Number.NaN }, "threshold"],
    [{ width: 0 }, "width"], [{ width: Number.NaN }, "width"], [{ height: Number.POSITIVE_INFINITY }, "height"],
  ];
  for (const [edit, name] of cases) {
    expect(() => failureRateBarShapes(props(edit)), JSON.stringify(edit)).toThrow(RangeError);
    expect(() => failureRateBarShapes(props(edit)), JSON.stringify(edit)).toThrow(new RegExp(`FailureRateBar: ${name} `));
  }
});

test("Boundary props accepted", () => {
  expect(() => failureRateBarShapes(props({ rate: 0, threshold: 0.5 }))).not.toThrow();
  expect(() => failureRateBarShapes(props({ rate: 1, threshold: 0.5 }))).not.toThrow();
});

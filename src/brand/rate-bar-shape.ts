// The failure-rate bar's geometry (spec motion-components, "Failure-rate bar"
// and "Failure-rate bar input"; change circuit-breaker-topology-scene, design
// §2.4): a white track, a red fill for the failure rate and an ink threshold
// tick, as plain data, so vitest checks the shapes without a browser.
// `FailureRateBar` (rate-bar.tsx) draws exactly what this returns.
//
// Why a file of its own: the circuit-breaker topology scene shows its sliding
// window's failure rate against the threshold; no piece or component had that
// shape (MOT-6: shared shapes live in src/brand/, never in a scene).
//
// How to run: `npm test -- test/brand/rate-bar.test.ts`.
// What can go wrong: a rate outside [0, 1], a threshold outside (0, 1), or a
// width or height that is not a finite number above 0 throws a RangeError
// naming the prop. The names differ from rate-bar.tsx so a case-insensitive
// file system (macOS) never resolves one to the other.
import { tokens } from "../../tokens/generated/tokens";

export type FailureRateBarProps = {
  /** Failures over the window, 0 to 1. */
  rate: number;
  /** Where the tick sits, strictly between 0 and 1. */
  threshold: number;
  width: number;
  height: number;
};

export type RateBarRect = { x: number; y: number; width: number; height: number; radius: number; fill: string; stroke: string; strokeWidth: number };
export type RateBarTick = { x: number; y1: number; y2: number; stroke: string; strokeWidth: number; linecap: "round" };
export type RateBarShapes = { track: RateBarRect; fill: RateBarRect | null; tick: RateBarTick };

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

/** Throws the first invalid prop as a RangeError naming it (spec "Failure-rate bar input"). */
const check = ({ rate, threshold, width, height }: FailureRateBarProps) => {
  if (!finite(rate) || rate < 0 || rate > 1) throw new RangeError(`FailureRateBar: rate must be a finite number from 0 to 1, found ${String(rate)}`);
  if (!finite(threshold) || threshold <= 0 || threshold >= 1) throw new RangeError(`FailureRateBar: threshold must be a finite number above 0 and below 1, found ${String(threshold)}`);
  if (!finite(width) || width <= 0) throw new RangeError(`FailureRateBar: width must be a finite number above 0, found ${String(width)}`);
  if (!finite(height) || height <= 0) throw new RangeError(`FailureRateBar: height must be a finite number above 0, found ${String(height)}`);
};

/**
 * The bar's three shapes, in the bar's own coordinates (track at 0, 0), drawn
 * in this order: track, fill, tick. The fill is at least `height` wide (a
 * small rate still reads as a round end) but never wider than the track, and
 * absent at rate 0. The tick reaches half the height beyond the track on both
 * sides, over the fill.
 */
export const failureRateBarShapes = (props: FailureRateBarProps): RateBarShapes => {
  check(props);
  const { rate, threshold, width, height } = props;
  const { color, outline } = tokens;
  const radius = height / 2;
  const base = { x: 0, y: 0, height, radius, stroke: color.ink, strokeWidth: outline.small };
  return {
    track: { ...base, width, fill: color.white },
    fill: rate > 0 ? { ...base, width: Math.min(width, Math.max(height, rate * width)), fill: color.state.failure } : null,
    tick: { x: threshold * width, y1: -0.5 * height, y2: 1.5 * height, stroke: color.ink, strokeWidth: outline.small + 0.5, linecap: "round" },
  };
};

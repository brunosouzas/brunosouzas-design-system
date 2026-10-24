// Timing helpers of the cast (spec motion-components, "Cast timing helpers";
// change cast-and-emotes, design §7): the approved motion test's pop, out,
// blinkAt, breathe, jiggle and hopAt, renamed. Pure functions of the frame.
//
// What can go wrong: a non-finite input, or a zero length or frame rate, would
// give NaN frames downstream; each helper throws a RangeError naming the first
// offending parameter instead.
import { Easing, interpolate, spring } from "remotion";
import { tokens } from "../../tokens/generated/tokens";

const finite = (helper: string, entries: readonly [string, number][]) => {
  for (const [name, value] of entries) {
    if (typeof value !== "number" || !Number.isFinite(value)) throw new RangeError(`${helper}: ${name} must be a finite number, found ${value}`);
  }
};
const positive = (helper: string, name: string, value: number) => {
  if (value <= 0) throw new RangeError(`${helper}: ${name} must be greater than 0, found ${value}`);
};

/** Emote pop-in: 0 until `at`, a quick overshoot (peak about 1.237 seven frames later), then 1. */
export const emotePop = (frame: number, at: number, fps: number = tokens.motion.fps): number => {
  finite("emotePop", [["frame", frame], ["at", at], ["fps", fps]]);
  positive("emotePop", "fps", fps);
  return spring({ frame: frame - at, fps, config: tokens.cast.emotePop });
};

/** Leaving: 1 until `at`, an ease-in fall to 0 over `len` frames, then 0. */
export const leave = (frame: number, at: number, len = 10): number => {
  finite("leave", [["frame", frame], ["at", at], ["len", len]]);
  positive("leave", "len", len);
  return interpolate(frame, [at, at + len], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
};

/** True during the four frames that start at any of `starts`. */
export const blinking = (frame: number, starts: readonly number[]): boolean => {
  finite("blinking", [["frame", frame]]);
  for (let i = 0; i < starts.length; i++) finite("blinking", [[`starts[${i}]`, starts[i]]]);
  return starts.some((start) => frame >= start && frame < start + 4);
};

/** Idle breathing: a 1.2 % vertical swell. */
export const breathe = (frame: number, phase: number): number => {
  finite("breathe", [["frame", frame], ["phase", phase]]);
  return 1 + 0.012 * Math.sin((frame + phase) / 14);
};

/** Squash after a landing or a surprise: 1 before `at`, then a decaying wobble of `amp`. */
export const squashAfter = (frame: number, at: number, amp: number): number => {
  finite("squashAfter", [["frame", frame], ["at", at], ["amp", amp]]);
  if (frame < at) return 1;
  const d = frame - at;
  return 1 + amp * Math.exp(-d / 7) * Math.cos(d / 2.2);
};

/** A hop of `height` pixels over `len` frames from `at`; 0 outside it. */
export const hop = (frame: number, at: number, height: number, len = 14): number => {
  finite("hop", [["frame", frame], ["at", at], ["height", height], ["len", len]]);
  positive("hop", "len", len);
  return frame < at || frame > at + len ? 0 : height * Math.sin((Math.PI * (frame - at)) / len);
};

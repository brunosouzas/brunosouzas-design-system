// Unit tests of the cast timing helpers (spec motion-components, "Cast timing
// helpers"; change cast-and-emotes, task 4.1). Each title is a spec scenario.
import { describe, expect, test } from "vitest";
import { blinking, breathe, emotePop, hop, leave, squashAfter } from "../../src/brand/cast-motion";

describe("Cast timing helpers", () => {
  test("Emote pop", () => {
    const at = 62;
    expect(emotePop(at - 1, at)).toBe(0);
    expect(emotePop(at, at)).toBe(0);
    expect(emotePop(at + 7, at)).toBeCloseTo(1.2371, 4);
    let peak = 0;
    for (let f = at; f < at + 60; f++) peak = Math.max(peak, emotePop(f, at));
    expect(peak).toBe(emotePop(at + 7, at));
    expect(Math.abs(emotePop(at + 30, at) - 1)).toBeLessThan(0.001);
  });

  test("Leave", () => {
    expect([99, 105, 110, 200].map((f) => leave(f, 100))).toEqual([1, 0.875, 0, 0]);
  });

  test("Squash after a landing", () => {
    expect(squashAfter(61, 62, 0.1)).toBe(1);
    expect(squashAfter(62, 62, 0.1)).toBeCloseTo(1.1, 10);
    expect(squashAfter(69, 62, 0.1)).toBeCloseTo(0.9632, 4);
  });

  test("Helper inputs checked", () => {
    expect(() => hop(0, 0, 10, 0)).toThrow(new RangeError("hop: len must be greater than 0, found 0"));
    expect(() => leave(0, 0, -1)).toThrow(new RangeError("leave: len must be greater than 0, found -1"));
    expect(() => emotePop(0, 0, 0)).toThrow(new RangeError("emotePop: fps must be greater than 0, found 0"));
    expect(() => emotePop(Number.NaN, 0)).toThrow(new RangeError("emotePop: frame must be a finite number, found NaN"));
    expect(() => blinking(0, [1, Infinity])).toThrow(new RangeError("blinking: starts[1] must be a finite number, found Infinity"));
    expect(breathe(0, 0)).toBe(1);
  });

  test("Hop and blink bounds", () => {
    expect([245, 253, 261].map((f) => hop(f, 246, 60))).toEqual([0, 60, 0]);
    expect([17, 18, 21, 22].map((f) => blinking(f, [18]))).toEqual([false, true, true, false]);
  });
});

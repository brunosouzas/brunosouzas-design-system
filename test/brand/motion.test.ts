// Unit tests of the components' frame logic (spec motion-components; tasks 3.1).
// They run over the circuit-breaker timeline where a scenario needs a scene.
import { getLength, getPointAtLength } from "@remotion/paths";
import { spring } from "remotion";
import { describe, expect, test } from "vitest";
import {
  arrowAt,
  arrowDash,
  arrowDrawAt,
  blockAppearance,
  blockContents,
  callAppearance,
  countdownLeft,
  focusFactors,
  tokenPositions,
} from "../../src/brand/motion";
import { timeline, type StateId } from "../../src/scenes/circuit-breaker-states/scene";
import { tokens } from "../../tokens/generated/tokens";

const { motion, color } = tokens;
const STATES: StateId[] = ["closed", "open", "half"];
const CURVE = "M1560,376 C1560,600 1440,715 1246,715"; // the 16:9 OPEN to HALF_OPEN arrow

describe("Self-drawing arrow", () => {
  const drawAt = arrowDrawAt(timeline, "toOpen");

  test("Before the draw frame", () => {
    const arrow = arrowAt(drawAt - 1, drawAt);
    expect(arrow.visible).toBe(false);
    expect(arrow.progress).toBe(0);
    expect(arrow.head).toBe(false);
  });

  test("Half way", () => {
    const arrow = arrowAt(drawAt + motion.drawArrow / 2, drawAt);
    expect(arrow.visible).toBe(true);
    expect(arrow.progress).toBeCloseTo(0.5, 5);
    expect(arrow.head).toBe(false);
    // The dash leaves half of the path's length undrawn.
    const dash = arrowDash(CURVE, arrow.progress);
    expect(Number(dash.strokeDashoffset)).toBeCloseTo(getLength(CURVE) / 2, 3);
  });

  test("Fully drawn", () => {
    for (const frame of [drawAt + motion.drawArrow, drawAt + motion.drawArrow + 1, timeline.duration - 1]) {
      const arrow = arrowAt(frame, drawAt);
      expect(arrow).toEqual({ visible: true, progress: 1, head: true });
      expect(Number(arrowDash(CURVE, arrow.progress).strokeDashoffset)).toBeCloseTo(0, 5);
    }
  });
});

describe("Travelling token", () => {
  test("Token position over a trip", () => {
    const fire = 380;
    const [atStart] = tokenPositions(fire, CURVE, [fire]);
    expect(atStart.x).toBeCloseTo(1560, 3);
    expect(atStart.y).toBeCloseTo(376, 3);

    const midpoint = getPointAtLength(CURVE, getLength(CURVE) / 2);
    const [halfWay] = tokenPositions(fire + motion.travel / 2, CURVE, [fire]);
    expect(halfWay.x).toBeCloseTo(midpoint!.x, 3);
    expect(halfWay.y).toBeCloseTo(midpoint!.y, 3);

    expect(tokenPositions(fire + motion.travel, CURVE, [fire])).toEqual([]);
    expect(tokenPositions(fire + motion.travel + 5, CURVE, [fire])).toEqual([]);
    expect(tokenPositions(fire - 1, CURVE, [fire])).toEqual([]);
  });

  test("Transition fires twice", () => {
    const fires = timeline.fires.toHalf; // [380, 630]
    expect(fires[1] - fires[0]).toBeGreaterThan(motion.travel);
    expect(tokenPositions(fires[0] + 5, CURVE, fires)).toHaveLength(1);
    for (const frame of [fires[0] + motion.travel, 500, fires[1] - 1]) expect(tokenPositions(frame, CURVE, fires)).toEqual([]);
    expect(tokenPositions(fires[1] + 5, CURVE, fires)).toHaveLength(1);
  });
});

describe("Focus on the active state", () => {
  test("Focus changes to the next state", () => {
    const { phases } = timeline;
    for (let i = 1; i < phases.length; i++) {
      const { state, from } = phases[i];
      const previous = phases[i - 1].state;
      expect(previous).not.toBe(state);
      const frame = from + 30;
      const next = focusFactors(frame, state, timeline);
      expect(Math.abs(next.opacity - 1)).toBeLessThanOrEqual(0.01);
      expect(Math.abs(next.scale - motion.focusScale)).toBeLessThanOrEqual(0.01);
      expect(Math.abs(focusFactors(frame, previous, timeline).opacity - motion.dimOpacity)).toBeLessThanOrEqual(0.01);
    }
  });

  test("Between two phases", () => {
    // Phase 1 (CLOSED) ends at 200, phase 2 (OPEN) starts at 245.
    for (const frame of [201, 220, 244]) {
      const closed = focusFactors(frame, "closed", timeline);
      expect(closed.opacity).toBeCloseTo(1, 2);
      expect(closed.scale).toBeCloseTo(motion.focusScale, 2);
      expect(focusFactors(frame, "open", timeline).opacity).toBeCloseTo(motion.dimOpacity, 5);
      expect(focusFactors(frame, "half", timeline).opacity).toBeCloseTo(motion.dimOpacity, 5);
    }
  });

  test("Intro and outro", () => {
    for (let frame = 0; frame < timeline.phases[0].from; frame++) {
      for (const state of STATES) expect(focusFactors(frame, state, timeline)).toEqual({ opacity: 1, scale: 1 });
    }
    for (const frame of [timeline.outro, 950, timeline.duration - 1]) {
      for (const state of STATES) expect(focusFactors(frame, state, timeline).opacity).toBe(1);
      expect(Math.abs(focusFactors(frame, "closed", timeline).scale - motion.focusScale)).toBeLessThanOrEqual(0.01);
      expect(Math.abs(focusFactors(frame, "open", timeline).scale - 1)).toBeLessThanOrEqual(0.01);
      expect(Math.abs(focusFactors(frame, "half", timeline).scale - 1)).toBeLessThanOrEqual(0.01);
    }
  });

  test("Pop-in during the intro", () => {
    const frame = 10;
    for (const state of STATES) expect(focusFactors(frame, state, timeline)).toEqual({ opacity: 1, scale: 1 });
    // The pilot's pop spring (damping 13, stiffness 140, mass 0.7), CLOSED popping in from frame 6.
    const pop = spring({ frame: frame - 6, fps: 30, config: { damping: 13, stiffness: 140, mass: 0.7 } });
    expect(pop).toBeGreaterThan(0);
    expect(pop).toBeLessThan(1);
    const closed = blockAppearance(frame, "closed", timeline);
    expect(closed.opacity).toBeCloseTo(Math.min(pop * 1.4, 1), 10);
    expect(closed.scale).toBeCloseTo(0.6 + 0.4 * pop, 10);
    expect(closed.scale).toBeLessThan(1);
    expect(blockAppearance(frame, "half", timeline).opacity).toBe(0);
  });
});

describe("Call results and countdown", () => {
  test("Blocked call inside the OPEN block", () => {
    const blocked = callAppearance("blocked");
    expect(blocked.fill).toBe(color.ink);
    expect(blocked.fill).not.toBe(color.blocked);
    expect(blocked.glyphColor).toBe(color.white);
    expect(callAppearance("ok")).toMatchObject({ fill: color.white, glyphColor: color.ink, glyph: "✓" });
    expect(callAppearance("fail")).toMatchObject({ fill: color.failure, glyphColor: color.white, glyph: "✕" });
    expect(callAppearance("empty")).toMatchObject({ fill: "transparent", dashed: true, glyph: "" });
  });

  test("Countdown at the phase boundaries", () => {
    const phase = timeline.phases[1]; // OPEN [245, 365]
    const middle = (phase.from + phase.to) / 2;
    expect(countdownLeft(phase.from, phase.from, phase.to)).toBe(1);
    expect(countdownLeft(middle, phase.from, phase.to)).toBeCloseTo(0.5, 10);
    expect(countdownLeft(phase.to, phase.from, phase.to)).toBe(0);
    expect(blockContents(phase.from, "open", timeline).countdown).toBe(1);
    expect(blockContents(middle, "open", timeline).countdown).toBeCloseTo(0.5, 10);
    expect(blockContents(phase.to, "open", timeline).countdown).toBe(0);
  });
});

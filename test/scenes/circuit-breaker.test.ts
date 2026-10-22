// Unit tests of the circuit-breaker scene: its timing against the approved pilot
// (design §8), its story, its captions and its block contents at given frames
// (specs scene-catalogue and motion-components; tasks 3.1 and 4.3).
import { describe, expect, test } from "vitest";
import { arrowDrawAt, blockContents, captionAt, pillAt, type CallKind } from "../../src/brand/motion";
import { circuitBreakerStates, text, timeline, type StateId, type TransitionId } from "../../src/scenes/circuit-breaker-states/scene";

// The pilot's timeline, copied from the table in design §8 (which was copied
// from the approved pilot's timeline.ts and StateMachine.tsx).
const PILOT = {
  duration: 1000,
  introEnd: 40,
  outro: 910,
  startMarkerFade: [4, 14],
  popIn: { closed: 6, open: 14, half: 22 },
  ringsFade: [0, 20],
  phases: [
    { state: "closed", from: 40, to: 200, events: [[56, "ok"], [73, "ok"], [90, "fail"], [107, "ok"], [124, "fail"], [141, "fail"], [158, "fail"], [175, "fail"]] },
    { state: "open", from: 245, to: 365, events: [[262, "blocked"], [288, "blocked"], [314, "blocked"], [340, "blocked"]] },
    { state: "half", from: 410, to: 500, events: [[424, "ok"], [458, "fail"]] },
    { state: "open", from: 545, to: 620, events: [[560, "blocked"], [586, "blocked"]] },
    { state: "half", from: 665, to: 775, events: [[680, "ok"], [710, "ok"], [740, "ok"]] },
    { state: "closed", from: 820, to: 990, events: [[834, "ok"], [843, "ok"], [852, "ok"], [861, "ok"], [870, "ok"], [879, "ok"], [888, "ok"], [897, "ok"]] },
  ],
  fires: { toOpen: [215], toHalf: [380, 630], halfToOpen: [515], halfToClosed: [790] },
  drawAt: { toOpen: 197, toHalf: 362, halfToOpen: 497, halfToClosed: 772 },
  pillAt: { toOpen: 205, toHalf: 370, halfToOpen: 505, halfToClosed: 780 },
  slots: { closed: 8, open: 4, half: 3 },
} as const;

const TRANSITIONS: TransitionId[] = ["toOpen", "toHalf", "halfToOpen", "halfToClosed"];
const kinds = (frame: number, state: StateId) => blockContents(frame, state, timeline).slots.map((slot) => slot.kind);

describe("Circuit-breaker state machine scene", () => {
  test("Timing equals the approved pilot", () => {
    expect(timeline.duration).toBe(PILOT.duration);
    expect(timeline.introEnd).toBe(PILOT.introEnd);
    expect(timeline.outro).toBe(PILOT.outro);
    expect(timeline.startMarkerFade).toEqual(PILOT.startMarkerFade);
    expect(timeline.popIn).toEqual(PILOT.popIn);
    expect(timeline.ringsFade).toEqual(PILOT.ringsFade);
    expect(
      timeline.phases.map((phase) => ({ state: phase.state, from: phase.from, to: phase.to, events: phase.events.map((e) => [e.at, e.kind]) })),
    ).toEqual(PILOT.phases);
    expect(timeline.fires).toEqual(PILOT.fires);
    for (const id of TRANSITIONS) {
      expect(arrowDrawAt(timeline, id)).toBe(PILOT.drawAt[id]);
      expect(pillAt(timeline, id)).toBe(PILOT.pillAt[id]);
    }
    expect(timeline.slots).toEqual(PILOT.slots);
  });

  test("Phase and transition order", () => {
    expect(timeline.phases.map((phase) => phase.state)).toEqual(["closed", "open", "half", "open", "half", "closed"]);
    const fired = TRANSITIONS.flatMap((id) => timeline.fires[id].map((frame) => ({ frame, ...timeline.transitions[id] })))
      .sort((a, b) => a.frame - b.frame)
      .map(({ from, to }) => `${from}->${to}`);
    expect(fired).toEqual(["closed->open", "open->half", "half->open", "open->half", "half->closed"]);
  });

  test("Failure crosses the threshold before OPEN", () => {
    const events = timeline.phases[0].events;
    const results = events.map((event) => event.kind);
    expect(results).toContain("ok");
    expect(results).toContain("fail");
    expect(results.slice(-2)).toEqual<CallKind[]>(["fail", "fail"]);
    expect(timeline.fires.toOpen[0]).toBeGreaterThan(events[events.length - 1].at);
  });

  test("The failed test reopens, the successful test closes", () => {
    const [firstTest, secondTest] = timeline.phases.filter((phase) => phase.state === "half");
    const firstLast = firstTest.events[firstTest.events.length - 1];
    expect(firstLast.kind).toBe("fail");
    const reopen = timeline.fires.halfToOpen[0];
    expect(reopen).toBeGreaterThan(firstLast.at);
    expect(reopen).toBeLessThan(timeline.phases[timeline.phases.indexOf(firstTest) + 1].from);

    expect(secondTest.events.every((event) => event.kind === "ok")).toBe(true);
    const close = timeline.fires.halfToClosed[0];
    expect(close).toBeGreaterThan(secondTest.events[secondTest.events.length - 1].at);
    expect(close).toBeLessThan(timeline.phases[timeline.phases.indexOf(secondTest) + 1].from);
  });

  test("Caption follows the active state", () => {
    for (const phase of timeline.phases) {
      const inside = Math.round((phase.from + phase.to) / 2);
      for (const frame of [inside, phase.to]) {
        const caption = captionAt(frame, timeline.phases);
        expect(caption?.state).toBe(phase.state);
        expect(caption?.opacity).toBe(1);
      }
    }
    // The caption shows the state's name and its sentence, in each language.
    for (const lang of circuitBreakerStates.languages) {
      for (const state of ["closed", "open", "half"] as StateId[]) {
        expect(text[lang].states[state]).toMatch(/^(CLOSED|OPEN|HALF_OPEN)$/);
        expect(text[lang].captions[state].length).toBeGreaterThan(0);
      }
      expect(text[lang].captions.closed).not.toBe(text[lang === "pt" ? "en" : "pt"].captions.closed);
    }
  });

  test("Caption outside phases", () => {
    expect(captionAt(0, timeline.phases)).toBeNull();
    expect(captionAt(timeline.phases[0].from - 1, timeline.phases)).toBeNull();
    expect(captionAt(220, timeline.phases)).toMatchObject({ state: "closed", opacity: 1 }); // between phases 1 and 2
    expect(captionAt(380, timeline.phases)).toMatchObject({ state: "open", opacity: 1 }); // between phases 2 and 3
    expect(captionAt(950, timeline.phases)).toMatchObject({ state: "closed", opacity: 1 }); // outro
  });
});

describe("State block contents at a frame", () => {
  test("OPEN between its two phases", () => {
    expect(kinds(620, "open")).toEqual(["blocked", "blocked", "empty", "empty"]);
    expect(blockContents(620, "open", timeline).countdown).toBe(0);
  });

  test("Results persist, then reset", () => {
    expect(kinds(400, "closed")).toEqual(["ok", "ok", "fail", "ok", "fail", "fail", "fail", "fail"]);
    expect(kinds(840, "closed")).toEqual(["ok", "empty", "empty", "empty", "empty", "empty", "empty", "empty"]);
  });

  test("Before the state's first phase", () => {
    expect(kinds(100, "open")).toEqual(["empty", "empty", "empty", "empty"]);
    expect(blockContents(100, "open", timeline).countdown).toBe(0);
    expect(kinds(100, "half")).toEqual(["empty", "empty", "empty"]);
  });
});

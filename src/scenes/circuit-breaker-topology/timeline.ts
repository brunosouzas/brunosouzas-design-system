// The circuit-breaker topology scene's timeline (change
// circuit-breaker-topology-scene, design §2.10 and §4): every phase, pop-in,
// leave, fade, ramp, trip, arrow change, counter value, light, tag, window
// result and clock run, in frames at 30 fps, built from the formulas of design
// §4.2 to §4.6 with no React, so the catalogue, the CLI scripts and the tests
// read it under tsx.
//
// Why generated: take 1 alone has 60 backend calls; writing 156 trips by hand
// would hide a typo. test/scenes/circuit-breaker-topology.test.ts compares
// every value with its own transcription of design §4.
//
// Take-1 frames (the attempts, the counters' take-1 values, the units' take-1
// failures, the direct arrows and tag, `retry ×3`) are object frames: the
// rewind plays them backwards (design §2.5, frame.ts). Everything else is a
// real frame. Element keys are `<element>@<frame>` (design §2.10), so an
// element that pops or leaves twice has two keys.
import { tokens } from "../../../tokens/generated/tokens";
import type { TakesPhase, TakesTimeline } from "../takes-kind";

export type Route = "direct-req" | "direct-rep" | "in-req" | "out-req" | "out-rep" | "in-rep";
export type ArrowKind = "message" | "reply" | "failure" | "failFast";
export type CallResult = "timeout" | "ok" | "business" | "failFast";
export type Call = { id: string; legs: readonly { route: Route; from: number }[]; result: CallResult };
export type ArrowChange = { at: number; kind: ArrowKind; dashed: boolean };
export type Ramp = { element: string; from: number; to: number; values: readonly [number, number] };
export type TagPlace = "direct" | "left" | "right";
export type TagText = "timeout" | "open" | "ok" | "business";
export type TagChange = { at: number; text: TagText } | { at: number; leave: true };
export type WindowEvent = { at: number; result: "ok" | "fail" | "drop" } | { at: number; clear: true };
export type CounterChange = { at: number; value: number };
export type StateName = "closed" | "open" | "halfOpen";

export type TopologyTimeline = TakesTimeline & {
  /** Opacity ramps between any two values, linear over `motion.fade` (design §4.5, §4.2). */
  ramps: readonly Ramp[];
  /** Per route, its kind and dash from each frame on (design §4.5); take-1 routes in object frames. */
  arrows: Readonly<Record<Route, readonly ArrowChange[]>>;
  /** Every request, attempt or test call with its legs (each `motion.travel` long) and its result. */
  calls: readonly Call[];
  /** The `requests` and `backend calls` values; `take1` in object frames, `take2` from frame 510 (design §4.4). */
  counters: Readonly<Record<"take1" | "take2", Readonly<Record<"requests" | "calls", readonly CounterChange[]>>>>;
  /** Payment's units failing or recovering; `take1` in object frames. */
  lights: Readonly<Record<"take1" | "take2", readonly { unit: 0 | 1 | 2; at: number; failing: boolean }[]>>;
  /** Per tag place, the text swaps and the leaves (design §2.8). */
  tags: Readonly<Record<TagPlace, readonly TagChange[]>>;
  /** The state pill's swaps. */
  states: readonly { at: number; state: StateName }[];
  /** Results arriving at the window, and its clear (design §4.6). */
  window: readonly WindowEvent[];
  /** The `resetTimeout` clock's runs: full at `at`, empty at `emptyAt`. */
  clock: readonly { at: number; full: true; emptyAt: number }[];
  /** The badge's take numbers: `1` pops at 12, `2` at the swap. */
  badge: readonly { at: number; take: 1 | 2 }[];
  /** The breaker box's drop-in: its centre travels the drop path from `from` to `to`, linear by length. */
  drop: { from: number; to: number };
};

/**
 * Builds the timeline from design §4's formulas. `travel` and `fade` default to
 * the tokens; a test passes another travel to prove the comparison with the
 * beat table catches it ("Travel token changed").
 */
export const buildTimeline = (T: number = tokens.motion.travel, F: number = tokens.motion.fade): TopologyTimeline => {
  // ---------------------------------------------------------------- calls (design §4.2)

  const legs = (...entries: [Route, number][]) => entries.map(([route, from]) => ({ route, from }));

  /** Take 1: request k (1–20) leaves as a group of three attempts j (0–2), two frames apart. */
  const TAKE1: Call[] = Array.from({ length: 20 }, (_, i) => i + 1).flatMap((k) =>
    [0, 1, 2].map((j) => ({ id: `t1-r${k}-a${j}`, legs: legs(["direct-req", 60 + 15 * (k - 1) + 2 * j]), result: "timeout" as const })),
  );
  /** A call through the breaker to Payment and back: in-req, out-req, out-rep, in-rep. */
  const through = (id: string, g: number, result: CallResult): Call => ({ id, legs: legs(["in-req", g], ["out-req", g + T], ["out-rep", g + 2 * T], ["in-rep", g + 3 * T]), result });
  /** A request the open breaker fails at once: in-req, then its reply on in-rep from the frame it arrives. */
  const failFast = (id: string, e: number): Call => ({ id, legs: legs(["in-req", e], ["in-rep", e + T]), result: "failFast" });
  /** A HALF_OPEN test call: from the breaker's right edge to Payment and back. */
  const test = (id: string, from: number, result: CallResult): Call => ({ id, legs: legs(["out-req", from], ["out-rep", from + T]), result });

  const CLOSED_CALLS = [0, 1, 2, 3, 4].map((i) => through(`closed-${i}`, 576 + 42 * i, "timeout"));
  const OPEN_CALLS = Array.from({ length: 15 }, (_, j) => failFast(`open-${6 + j}`, 822 + 6 * j));
  const OPEN_AGAIN_CALLS = [1040, 1070, 1100].map((e, i) => failFast(`open-again-${i}`, e));
  const NOISE_RESULTS: CallResult[] = ["ok", "ok", "timeout", "ok", "ok"];
  const NOISE_CALLS = NOISE_RESULTS.map((result, i) => through(`c${i}`, 1236 + 40 * i, result));
  const BUSINESS_CALL = through("c5", 1500, "business");
  const HEALTHY_CALLS = [1610, 1650, 1690].map((g, i) => through(`c${6 + i}`, g, "ok"));

  const CALLS: readonly Call[] = [
    ...TAKE1,
    ...CLOSED_CALLS,
    ...OPEN_CALLS,
    test("test-1", 966, "timeout"),
    ...OPEN_AGAIN_CALLS,
    test("test-2", 1166, "ok"),
    ...NOISE_CALLS,
    BUSINESS_CALL,
    ...HEALTHY_CALLS,
  ];

  const departs = (call: Call) => call.legs[0].from;
  const arrivalAtPayment = (call: Call) => call.legs.find((leg) => leg.route === "out-req" || leg.route === "direct-req")!.from + T;

  // ---------------------------------------------------------------- the rest of the beat table

  /** Design §4.4: take 1 counts requests leaving and attempts arriving; take 2 the calls through the breaker and the fail-fast requests. */
  const COUNTERS: TopologyTimeline["counters"] = {
    take1: {
      requests: Array.from({ length: 20 }, (_, i) => ({ at: 60 + 15 * i, value: i + 1 })),
      calls: TAKE1.map((call, n) => ({ at: arrivalAtPayment(call), value: n + 1 })).sort((a, b) => a.at - b.at),
    },
    take2: {
      requests: [...CLOSED_CALLS, ...OPEN_CALLS].map((call, i) => ({ at: departs(call), value: i + 1 })),
      calls: CLOSED_CALLS.map((call, i) => ({ at: arrivalAtPayment(call), value: i + 1 })),
    },
  };

  const ARROWS: TopologyTimeline["arrows"] = {
    "direct-req": [{ at: 16, kind: "message", dashed: false }],
    "direct-rep": [{ at: 82, kind: "failure", dashed: false }],
    "in-req": [{ at: 542, kind: "message", dashed: false }],
    "out-req": [
      { at: 542, kind: "message", dashed: false }, { at: 820, kind: "message", dashed: true }, { at: 950, kind: "message", dashed: false },
      { at: 1020, kind: "message", dashed: true }, { at: 1150, kind: "message", dashed: false },
    ],
    "out-rep": [
      { at: 620, kind: "failure", dashed: false }, { at: 820, kind: "failure", dashed: true }, { at: 950, kind: "failure", dashed: false },
      { at: 1020, kind: "failure", dashed: true }, { at: 1150, kind: "failure", dashed: false }, { at: 1188, kind: "reply", dashed: false },
      { at: 1360, kind: "failure", dashed: false }, { at: 1400, kind: "reply", dashed: false },
    ],
    "in-rep": [
      { at: 642, kind: "failure", dashed: false }, { at: 844, kind: "failFast", dashed: false }, { at: 1220, kind: "reply", dashed: false },
      { at: 1382, kind: "failure", dashed: false }, { at: 1422, kind: "reply", dashed: false },
    ],
  };

  const ramp = (element: string, from: number, values: [number, number]): Ramp => ({ element, from, to: from + F, values });
  /** Design §4.2 and §4.5: the cut line to Payment, the dimmed customer side in HALF_OPEN, the window and the clock. */
  const RAMPS: readonly Ramp[] = [
    ...["out-req", "out-rep"].flatMap((route) => [ramp(route, 820, [1, 0.25]), ramp(route, 950, [0.25, 1]), ramp(route, 1020, [1, 0.25]), ramp(route, 1150, [0.25, 1])]),
    ...["in-req", "in-rep"].flatMap((route) => [ramp(route, 950, [1, 0.25]), ramp(route, 1020, [0.25, 1]), ramp(route, 1150, [1, 0.25]), ramp(route, 1220, [0.25, 1])]),
    ramp("window", 950, [1, 0.3]), ramp("window", 1020, [0.3, 1]), ramp("window", 1150, [1, 0.3]), ramp("window", 1220, [0.3, 1]),
    ramp("clock", 950, [1, 0.6]), ramp("clock", 1020, [0.6, 1]), ramp("clock", 1150, [1, 0.6]),
  ];

  const TAGS: TopologyTimeline["tags"] = {
    direct: [{ at: 82, text: "timeout" }],
    right: [
      { at: 620, text: "timeout" }, { at: 820, leave: true }, { at: 988, text: "timeout" }, { at: 1020, leave: true }, { at: 1188, text: "ok" },
      { at: 1360, text: "timeout" }, { at: 1400, text: "ok" }, { at: 1544, text: "business" }, { at: 1654, text: "ok" },
    ],
    left: [
      { at: 642, text: "timeout" }, { at: 844, text: "open" }, { at: 950, leave: true }, { at: 1062, text: "open" }, { at: 1150, leave: true },
      { at: 1302, text: "ok" }, { at: 1382, text: "timeout" }, { at: 1422, text: "ok" }, { at: 1566, text: "business" }, { at: 1676, text: "ok" },
    ],
  };

  const STATES: TopologyTimeline["states"] = [
    { at: 548, state: "closed" }, { at: 820, state: "open" }, { at: 950, state: "halfOpen" },
    { at: 1020, state: "open" }, { at: 1150, state: "halfOpen" }, { at: 1220, state: "closed" },
  ];

  const WINDOW: readonly WindowEvent[] = [
    ...CLOSED_CALLS.map((call) => ({ at: departs(call) + 3 * T, result: "fail" as const })),
    { at: 1220, clear: true },
    ...NOISE_CALLS.map((call) => ({ at: departs(call) + 3 * T, result: call.result === "ok" ? ("ok" as const) : ("fail" as const) })),
    { at: departs(BUSINESS_CALL) + 3 * T, result: "drop" },
    ...HEALTHY_CALLS.map((call) => ({ at: departs(call) + 3 * T, result: "ok" as const })),
  ];

  const LIGHTS: TopologyTimeline["lights"] = {
    take1: [{ unit: 0, at: 174, failing: true }, { unit: 1, at: 277, failing: true }, { unit: 2, at: 371, failing: true }],
    take2: [{ unit: 0, at: 560, failing: true }, { unit: 0, at: 1188, failing: false }],
  };

  const CLOCK: TopologyTimeline["clock"] = [{ at: 820, full: true, emptyAt: 949 }, { at: 1020, full: true, emptyAt: 1149 }];
  const BADGE: TopologyTimeline["badge"] = [{ at: 12, take: 1 }, { at: 500, take: 2 }];
  const DROP = { from: 520, to: 520 + T };

  // ---------------------------------------------------------------- the TakesTimeline fields

  const key = (element: string, at: number) => `${element}@${at}`;
  const tagChanges = (place: TagPlace) => TAGS[place].map((change) => ({ place, ...change }));
  const allTagChanges = [...tagChanges("direct"), ...tagChanges("left"), ...tagChanges("right")];

  /** Pop-ins (design §4.2): one key per occurrence; window squares pop through `CallSquare`'s own spring at their arrival. */
  const POPS: Record<string, number> = Object.fromEntries([
    [key("checkout", 4), 4], [key("payment", 8), 8], [key("badge-1", 12), 12], [key("retry", 20), 20], [key("counters", 24), 24],
    [key("rewind-mark", 450), 450], [key("badge-2", 500), 500], [key("window", 554), 554],
    ...STATES.map((s) => [key(`state-${s.state}`, s.at), s.at]),
    [key("clock", 820), 820], [key("ghost", 912), 912],
    [key("message", 844), 844], [key("message", 1062), 1062], [key("dropped", 1566), 1566],
    ...allTagChanges.flatMap((change) => ("text" in change ? [[key(`tag-${change.place}`, change.at), change.at]] : [])),
    ...WINDOW.flatMap((event) => ("result" in event && event.result !== "drop" ? [[key("square", event.at), event.at]] : [])),
  ] as [string, number][]);

  /** Leaves over `LEAVE_FRAMES` (10) frames. */
  const LEAVES: Record<string, number> = Object.fromEntries([
    [key("retry", 510), 510], [key("rewind-mark", 520), 520],
    [key("counters", 950), 950], [key("ghost", 950), 950], [key("message", 950), 950], [key("message", 1150), 1150],
    [key("squares", 1220), 1220], [key("clock", 1220), 1220],
    ...allTagChanges.flatMap((change) => ("leave" in change ? [[key(`tag-${change.place}`, change.at), change.at]] : [])),
  ] as [string, number][]);

  /** 0→1 and →0 fades (design §2.10): the arrows' first fade-in, the direct request's fade-out and the drop path. */
  const FADES: TakesTimeline["fades"] = {
    "direct-req": { in: [16, 26], out: [510, 520] },
    "direct-rep": { in: [82, 92] },
    "in-req": { in: [542, 552] },
    "out-req": { in: [542, 552] },
    "out-rep": { in: [620, 630] },
    "in-rep": { in: [642, 652] },
    "drop-path": { in: [510, 520], out: [542, 552] },
  };

  const TRIPS: TakesTimeline["trips"] = CALLS.flatMap((call) => call.legs.map((leg) => ({ id: `${call.id}:${leg.route}`, route: leg.route, from: leg.from, to: leg.from + T })));

  const sorted = (frames: number[]) => [...new Set(frames)].sort((a, b) => a - b);
  /** Every movement end and every other change (design §2.10), so the takes kind's hold check sees it. */
  const CUES: TakesTimeline["cues"] = {
    ramps: sorted(RAMPS.map((r) => r.to)),
    arrows: sorted(Object.values(ARROWS).flat().map((change) => change.at)),
    lights: sorted([...LIGHTS.take1, ...LIGHTS.take2].map((light) => light.at)),
    tags: sorted(allTagChanges.map((change) => change.at)),
    states: sorted(STATES.map((s) => s.at)),
    counters: sorted([...COUNTERS.take1.requests, ...COUNTERS.take1.calls, ...COUNTERS.take2.requests, ...COUNTERS.take2.calls].map((c) => c.at)),
    window: sorted(WINDOW.flatMap((event) => [event.at, event.at + F])),
    dropped: [1576, 1586],
    clock: sorted(CLOCK.flatMap((run) => [run.at, run.emptyAt])),
    badge: sorted(BADGE.map((b) => b.at)),
    drop: [DROP.from, DROP.to],
  };

  /** Design §4.1: the thirteen phases with their takes, frames and cited English lines. */
  const PHASES: readonly Omit<TakesPhase, "events">[] = [
    { id: "setup", take: 1, from: 0, to: 59, cites: [23, 27, 29], devices: ["takeNumbers"] },
    { id: "retry", take: 1, from: 60, to: 389, cites: [23, 25, 27, 29] },
    { id: "down", take: 1, from: 390, to: 449, cites: [23, 29] },
    { id: "rewind", take: "rewind", from: 450, to: 509, cites: [27], devices: ["rewind", "takeNumbers"] },
    { id: "wrap", take: 2, from: 510, to: 569, cites: [30, 52, 59, 60, 61] },
    { id: "closed", take: 2, from: 570, to: 819, cites: [30, 42, 43, 46, 66, 150] },
    { id: "open", take: 2, from: 820, to: 949, cites: [30, 43, 71, 73, 77] },
    { id: "half-open-fail", take: 2, from: 950, to: 1019, cites: [44, 46, 77, 95] },
    { id: "open-again", take: 2, from: 1020, to: 1149, cites: [43, 46, 71, 77] },
    { id: "half-open-ok", take: 2, from: 1150, to: 1219, cites: [44, 46, 75, 81, 95] },
    { id: "closed-noise", take: 2, from: 1220, to: 1489, cites: [42, 66, 75, 150] },
    { id: "closed-business", take: 2, from: 1490, to: 1599, cites: [68, 92, 153] },
    { id: "closed-healthy", take: 2, from: 1600, to: 1799, cites: [42, 66, 75] },
  ];

  /** Every cue frame by name: pops, leaves, fades, trips, ramps and the cues, so each phase lists the events inside it. */
  const EVENT_FRAMES: { id: string; at: number }[] = [
    ...Object.entries(POPS).map(([id, at]) => ({ id: `pop ${id}`, at })),
    ...Object.entries(LEAVES).map(([id, at]) => ({ id: `leave ${id}`, at })),
    ...Object.entries(FADES).flatMap(([id, fade]) => [{ id: `fade ${id}`, at: fade.in[0] }, ...(fade.out ? [{ id: `fade-out ${id}`, at: fade.out[0] }] : [])]),
    ...TRIPS.flatMap((trip) => [{ id: `depart ${trip.id}`, at: trip.from }, { id: `arrive ${trip.id}`, at: trip.to }]),
    ...RAMPS.map((r) => ({ id: `ramp ${r.element}`, at: r.from })),
    ...Object.entries(CUES).flatMap(([name, frames]) => frames.map((at) => ({ id: `cue ${name}`, at }))),
  ];

  const phases: readonly TakesPhase[] = PHASES.map((phase) => ({
    ...phase,
    events: [...new Map(EVENT_FRAMES.filter((e) => e.at >= phase.from && e.at <= phase.to).map((e) => [`${e.id}@${e.at}`, e])).values()].sort(
      (a, b) => a.at - b.at || a.id.localeCompare(b.id),
    ),
  }));

  return {
    duration: 1920,
    outro: 1800,
    ringsFade: [0, 20],
    phases,
    rewind: { from: 450, to: 499, objects: [449, 59] },
    acts: [],
    faces: [],
    emotes: [],
    trips: TRIPS,
    pops: POPS,
    fades: FADES,
    leaves: LEAVES,
    cues: CUES,
    ramps: RAMPS,
    arrows: ARROWS,
    calls: CALLS,
    counters: COUNTERS,
    lights: LIGHTS,
    tags: TAGS,
    states: STATES,
    window: WINDOW,
    clock: CLOCK,
    badge: BADGE,
    drop: DROP,
  };
};

/** The scene's timeline, at the tokens' `motion.travel` (22) and `motion.fade` (10). */
export const timeline: TopologyTimeline = buildTimeline();

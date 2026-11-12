// The circuit-breaker topology scene's timeline and frame logic (spec
// scene-catalogue, "Topology beats and timing" and every "Topology …"
// behaviour requirement; change circuit-breaker-topology-scene, tasks 2.5 and
// 3.2). One `describe` per requirement, one test per scenario.
//
// The beat table below is this test's own transcription of design §4 (the
// phases of §4.1, the frames of §4.2, the arrows of §4.5, the window of §4.6),
// with the formulas re-implemented here, so the scene's generator
// (src/scenes/circuit-breaker-topology/timeline.ts) is checked against the
// design and not against itself.
import { describe, expect, test } from "vitest";
import { drawn, frameAt, objectFrame, type TopologyState } from "../../src/scenes/circuit-breaker-topology/frame";
import { SQUARE, slotX } from "../../src/scenes/circuit-breaker-topology/layout";
import { stageAt } from "../../src/scenes/circuit-breaker-topology/stage";
import { buildTimeline, timeline } from "../../src/scenes/circuit-breaker-topology/timeline";

// ---------------------------------------------------------------- design §4, transcribed

const TRAVEL = 22;
const FADE = 10;
type Leg = [route: string, from: number];
/** Design §4.2: every call's legs, by the table's formulas. */
const designCalls = (): { id: string; legs: Leg[]; result: string }[] => {
  const calls: { id: string; legs: Leg[]; result: string }[] = [];
  for (let k = 1; k <= 20; k++) for (let j = 0; j <= 2; j++) calls.push({ id: `t1-r${k}-a${j}`, legs: [["direct-req", 60 + 15 * (k - 1) + 2 * j]], result: "timeout" });
  const through = (id: string, g: number, result: string) => calls.push({ id, legs: [["in-req", g], ["out-req", g + 22], ["out-rep", g + 44], ["in-rep", g + 66]], result });
  for (let i = 0; i <= 4; i++) through(`closed-${i}`, 576 + 42 * i, "timeout");
  for (let j = 0; j <= 14; j++) calls.push({ id: `open-${6 + j}`, legs: [["in-req", 822 + 6 * j], ["in-rep", 822 + 6 * j + 22]], result: "failFast" });
  calls.push({ id: "test-1", legs: [["out-req", 966], ["out-rep", 988]], result: "timeout" });
  [1040, 1070, 1100].forEach((e, i) => calls.push({ id: `open-again-${i}`, legs: [["in-req", e], ["in-rep", e + 22]], result: "failFast" }));
  calls.push({ id: "test-2", legs: [["out-req", 1166], ["out-rep", 1188]], result: "ok" });
  ["ok", "ok", "timeout", "ok", "ok"].forEach((result, i) => through(`c${i}`, 1236 + 40 * i, result));
  through("c5", 1500, "business");
  [1610, 1650, 1690].forEach((g, i) => through(`c${6 + i}`, g, "ok"));
  return calls;
};

const PHASES = [
  ["setup", 1, 0, 59, [23, 27, 29], ["takeNumbers"]],
  ["retry", 1, 60, 389, [23, 25, 27, 29]],
  ["down", 1, 390, 449, [23, 29]],
  ["rewind", "rewind", 450, 509, [27], ["rewind", "takeNumbers"]],
  ["wrap", 2, 510, 569, [30, 52, 59, 60, 61]],
  ["closed", 2, 570, 819, [30, 42, 43, 46, 66, 150]],
  ["open", 2, 820, 949, [30, 43, 71, 73, 77]],
  ["half-open-fail", 2, 950, 1019, [44, 46, 77, 95]],
  ["open-again", 2, 1020, 1149, [43, 46, 71, 77]],
  ["half-open-ok", 2, 1150, 1219, [44, 46, 75, 81, 95]],
  ["closed-noise", 2, 1220, 1489, [42, 66, 75, 150]],
  ["closed-business", 2, 1490, 1599, [68, 92, 153]],
  ["closed-healthy", 2, 1600, 1799, [42, 66, 75]],
] as const;

/** The first trip whose arrival differs from the design's (design §4.2 at `motion.travel` 22), or null. */
const firstDifferentArrival = (trips: readonly { id: string; to: number }[]): string | null => {
  const expected = designCalls().flatMap((call) => call.legs.map(([route, from]) => ({ id: `${call.id}:${route}`, to: from + TRAVEL })));
  for (let i = 0; i < Math.max(expected.length, trips.length); i++) {
    const e = expected[i], a = trips[i];
    if (e === undefined || a === undefined || e.id !== a.id || e.to !== a.to) return `leg ${e?.id ?? a?.id} arrives at ${a?.to}, design says ${e?.to}`;
  }
  return null;
};

describe("Topology beats and timing", () => {
  test("Timeline equals the beat table", () => {
    const t = timeline;
    expect([t.duration, t.outro, t.ringsFade]).toEqual([1920, 1800, [0, 20]]);
    expect(t.phases.map((p) => [p.id, p.take, p.from, p.to, p.cites, ...(p.devices ? [p.devices] : [])])).toEqual(PHASES.map((p) => [...p]));
    // Every phase's events are the cue frames inside it.
    for (const p of t.phases) for (const e of p.events) expect(e.at >= p.from && e.at <= p.to, `${p.id} ${e.id}`).toBe(true);
    expect(t.rewind).toEqual({ from: 450, to: 499, objects: [449, 59] });
    expect([t.acts, t.faces, t.emotes]).toEqual([[], [], []]);
    // Calls and their trips (§4.2), each leg `motion.travel` long.
    expect(t.calls.map((c) => ({ id: c.id, legs: c.legs.map((l) => [l.route, l.from]), result: c.result }))).toEqual(designCalls());
    expect(t.trips).toHaveLength(156);
    expect(firstDifferentArrival(t.trips)).toBeNull();
    for (const trip of t.trips) expect(trip.to - trip.from).toBe(TRAVEL);
    expect(t.drop).toEqual({ from: 520, to: 542 });
    // Counters (§4.4).
    expect(t.counters.take1.requests).toEqual(Array.from({ length: 20 }, (_, i) => ({ at: 60 + 15 * i, value: i + 1 })));
    const arrivals = designCalls().slice(0, 60).map((c) => c.legs[0][1] + TRAVEL).sort((a, b) => a - b);
    expect(t.counters.take1.calls).toEqual(arrivals.map((at, n) => ({ at, value: n + 1 })));
    expect(t.counters.take2.requests).toEqual([...[0, 1, 2, 3, 4].map((i) => 576 + 42 * i), ...Array.from({ length: 15 }, (_, j) => 822 + 6 * j)].map((at, i) => ({ at, value: i + 1 })));
    expect(t.counters.take2.calls).toEqual([0, 1, 2, 3, 4].map((i) => ({ at: 576 + 42 * i + 44, value: i + 1 })));
    // Lights, states, tags, window, clock, badge (§4.2, §4.6).
    expect(t.lights).toEqual({ take1: [{ unit: 0, at: 174, failing: true }, { unit: 1, at: 277, failing: true }, { unit: 2, at: 371, failing: true }], take2: [{ unit: 0, at: 560, failing: true }, { unit: 0, at: 1188, failing: false }] });
    expect(t.states.map((s) => [s.at, s.state])).toEqual([[548, "closed"], [820, "open"], [950, "halfOpen"], [1020, "open"], [1150, "halfOpen"], [1220, "closed"]]);
    expect(t.tags.direct).toEqual([{ at: 82, text: "timeout" }]);
    expect(t.tags.right.map((c) => [c.at, "text" in c ? c.text : "leave"])).toEqual([[620, "timeout"], [820, "leave"], [988, "timeout"], [1020, "leave"], [1188, "ok"], [1360, "timeout"], [1400, "ok"], [1544, "business"], [1654, "ok"]]);
    expect(t.tags.left.map((c) => [c.at, "text" in c ? c.text : "leave"])).toEqual([[642, "timeout"], [844, "open"], [950, "leave"], [1062, "open"], [1150, "leave"], [1302, "ok"], [1382, "timeout"], [1422, "ok"], [1566, "business"], [1676, "ok"]]);
    expect(t.window.map((w) => [w.at, "clear" in w ? "clear" : w.result])).toEqual([
      [642, "fail"], [684, "fail"], [726, "fail"], [768, "fail"], [810, "fail"], [1220, "clear"],
      [1302, "ok"], [1342, "ok"], [1382, "fail"], [1422, "ok"], [1462, "ok"], [1566, "drop"], [1676, "ok"], [1716, "ok"], [1756, "ok"],
    ]);
    expect(t.clock).toEqual([{ at: 820, full: true, emptyAt: 949 }, { at: 1020, full: true, emptyAt: 1149 }]);
    expect(t.badge).toEqual([{ at: 12, take: 1 }, { at: 500, take: 2 }]);
    // Arrows (§4.5): kind and dash from each frame on.
    const arrows = Object.fromEntries(Object.entries(t.arrows).map(([route, changes]) => [route, changes.map((c) => [c.at, c.kind, c.dashed])]));
    expect(arrows).toEqual({
      "direct-req": [[16, "message", false]],
      "direct-rep": [[82, "failure", false]],
      "in-req": [[542, "message", false]],
      "out-req": [[542, "message", false], [820, "message", true], [950, "message", false], [1020, "message", true], [1150, "message", false]],
      "out-rep": [[620, "failure", false], [820, "failure", true], [950, "failure", false], [1020, "failure", true], [1150, "failure", false], [1188, "reply", false], [1360, "failure", false], [1400, "reply", false]],
      "in-rep": [[642, "failure", false], [844, "failFast", false], [1220, "reply", false], [1382, "failure", false], [1422, "reply", false]],
    });
    // Ramps and fades (§4.2, §4.5): linear over `motion.fade`.
    const ramps = (element: string) => t.ramps.filter((r) => r.element === element).map((r) => [r.from, r.to, ...r.values]);
    const cut = [[820, 830, 1, 0.25], [950, 960, 0.25, 1], [1020, 1030, 1, 0.25], [1150, 1160, 0.25, 1]];
    const customer = [[950, 960, 1, 0.25], [1020, 1030, 0.25, 1], [1150, 1160, 1, 0.25], [1220, 1230, 0.25, 1]];
    expect([ramps("out-req"), ramps("out-rep"), ramps("in-req"), ramps("in-rep")]).toEqual([cut, cut, customer, customer]);
    expect(ramps("window")).toEqual([[950, 960, 1, 0.3], [1020, 1030, 0.3, 1], [1150, 1160, 1, 0.3], [1220, 1230, 0.3, 1]]);
    expect(ramps("clock")).toEqual([[950, 960, 1, 0.6], [1020, 1030, 0.6, 1], [1150, 1160, 1, 0.6]]);
    expect(t.fades).toEqual({
      "direct-req": { in: [16, 26], out: [510, 520] }, "direct-rep": { in: [82, 92] }, "in-req": { in: [542, 552] }, "out-req": { in: [542, 552] },
      "out-rep": { in: [620, 630] }, "in-rep": { in: [642, 652] }, "drop-path": { in: [510, 520], out: [542, 552] },
    });
    // Pop-ins and leaves (§4.2), one key per occurrence.
    const squares = [642, 684, 726, 768, 810, 1302, 1342, 1382, 1422, 1462, 1676, 1716, 1756];
    expect(t.pops).toEqual(Object.fromEntries([
      ["checkout@4", 4], ["payment@8", 8], ["badge-1@12", 12], ["retry@20", 20], ["counters@24", 24], ["rewind-mark@450", 450], ["badge-2@500", 500], ["window@554", 554],
      ["state-closed@548", 548], ["state-open@820", 820], ["state-halfOpen@950", 950], ["state-open@1020", 1020], ["state-halfOpen@1150", 1150], ["state-closed@1220", 1220],
      ["clock@820", 820], ["ghost@912", 912], ["message@844", 844], ["message@1062", 1062], ["dropped@1566", 1566],
      ["tag-direct@82", 82], ...[642, 844, 1062, 1302, 1382, 1422, 1566, 1676].map((f) => [`tag-left@${f}`, f]), ...[620, 988, 1188, 1360, 1400, 1544, 1654].map((f) => [`tag-right@${f}`, f]),
      ...squares.map((f) => [`square@${f}`, f]),
    ]));
    expect(t.leaves).toEqual({
      "retry@510": 510, "rewind-mark@520": 520, "counters@950": 950, "ghost@950": 950, "message@950": 950, "message@1150": 1150, "squares@1220": 1220, "clock@1220": 1220,
      "tag-left@950": 950, "tag-left@1150": 1150, "tag-right@820": 820, "tag-right@1020": 1020,
    });
    // Every movement end is a cue, so the hold check sees it; the last is the window's last slide (1756 + F).
    expect(Math.max(...Object.values(t.cues).flat())).toBe(1756 + FADE);
  });

  test("Travel token changed", () => {
    expect(firstDifferentArrival(buildTimeline(20).trips)).toBe("leg t1-r1-a0:direct-req arrives at 80, design says 82");
    expect(firstDifferentArrival(buildTimeline(22).trips)).toBeNull();
  });

  test("Seeking in any order", () => {
    const frames = Array.from({ length: 1920 }, (_, f) => f);
    const forward = frames.map((f) => JSON.stringify(frameAt(f)));
    const backward = [...frames].reverse().map((f) => [f, JSON.stringify(frameAt(f))] as const);
    for (const [f, state] of backward) expect(state, `frame ${f}`).toBe(forward[f]);
    // A fixed shuffle (a linear congruential order), so a failure repeats.
    let seed = 7;
    const shuffled = [...frames].sort(() => ((seed = (seed * 48271) % 2147483647) / 2147483647) - 0.5);
    for (const f of shuffled) expect(JSON.stringify(frameAt(f)), `frame ${f}`).toBe(forward[f]);
  });
});

// ---------------------------------------------------------------- frame helpers

const at = frameAt;
const tokensOn = (s: TopologyState, route: string) => s.tokens.filter((t) => t.route === route);
/** The window's squares left to right, without the one sliding out. */
const kinds = (s: TopologyState) => [...(s.window?.squares ?? [])].filter((q) => q.opacity === 1).sort((a, b) => a.x - b.x).map((q) => q.kind);
const counters = (s: TopologyState) => (s.counters === null ? null : [s.counters.requests, s.counters.calls]);

describe("Topology take 1, retry only", () => {
  test("First request", () => {
    expect(at(59).tokens).toEqual([]);
    expect(counters(at(59))).toEqual([0, 0]);
    expect(at(60).tokens).toEqual([{ id: "t1-r1-a0:direct-req", route: "direct-req", point: { x: 208, y: 228 } }]);
    expect(at(60).counters?.requests).toBe(1);
    expect(at(62).tokens.map((t) => t.id)).toEqual(["t1-r1-a0:direct-req", "t1-r1-a1:direct-req"]);
    expect(at(64).tokens.map((t) => t.id)).toEqual(["t1-r1-a0:direct-req", "t1-r1-a1:direct-req", "t1-r1-a2:direct-req"]);
    expect(at(75).counters?.requests).toBe(2);
    expect(at(75).tokens.find((t) => t.id === "t1-r2-a0:direct-req")?.point).toEqual({ x: 208, y: 228 });
    expect(at(81).counters?.calls).toBe(0);
    expect(at(82).counters?.calls).toBe(1);
    expect(at(82).arrows["direct-rep"]).toEqual({ kind: "failure", dashed: false, opacity: 0 });
    expect(at(83).arrows["direct-rep"]?.opacity).toBeCloseTo(0.1, 9);
  });

  test("The service goes down", () => {
    const read = (f: number) => [at(f).failing, at(f).counters?.calls];
    expect(read(173)).toEqual([[false, false, false], 19]);
    expect(read(174)).toEqual([[true, false, false], 20]);
    expect(read(276)).toEqual([[true, false, false], 39]);
    expect(read(277)).toEqual([[true, true, false], 40]);
    expect(read(370)).toEqual([[true, true, false], 59]);
    expect(read(371)).toEqual([[true, true, true], 60]);
    expect([...read(389), at(389).counters?.requests, at(389).tokens]).toEqual([[true, true, true], 60, 20, []]);
  });

  test("Held down", () => {
    const held = JSON.stringify(at(390));
    for (let f = 390; f <= 449; f++) expect(JSON.stringify(at(f)), `frame ${f}`).toBe(held);
  });
});

describe("Topology rewind", () => {
  test("Object frame", () => {
    expect([449, 450, 475, 499, 500, 509].map((f) => objectFrame(f))).toEqual([449, 449, 250, 59, 59, 59]);
  });

  test("Same stage before each take", () => {
    const { badge: _b1, rewindMark: _r1, ...before } = at(59);
    const { badge: _b2, rewindMark: _r2, ...after } = at(509);
    expect(after).toEqual(before);
    expect(before.tokens).toEqual([]);
    expect(counters(at(509))).toEqual([0, 0]);
    expect(before.failing).toEqual([false, false, false]);
    expect(drawn(before.retry)).toBe(true);
    expect(before.arrows["direct-req"]).toEqual({ kind: "message", dashed: false, opacity: 1 });
    expect(before.arrows["direct-rep"]).toBeNull();
    expect(before.tags.direct).toBeNull();
  });

  test("Badge swap", () => {
    expect(at(499).badge?.take).toBe(1);
    expect(drawn(at(499).badge!.appear)).toBe(true);
    expect(drawn(at(500).badge?.appear ?? null)).toBe(false);
    expect(at(501).badge?.take).toBe(2);
    expect(drawn(at(501).badge!.appear)).toBe(true);
    for (const f of [499, 500, 501]) expect(drawn(at(f).rewindMark), `frame ${f}`).toBe(true);
  });
});

describe("Topology breaker wraps the call", () => {
  test("Drop-in frames", () => {
    expect(at(519).breaker).toBeNull();
    expect(at(531).breaker).toEqual({ x: 480, y: 95.5 });
    expect(at(542).breaker).toEqual({ x: 480, y: 251 });
    expect(at(548).state).toMatchObject({ name: "closed", at: 548 });
    expect(drawn(at(548).state!.appear)).toBe(false);
    expect(at(554).window?.appear.opacity).toBe(0);
    expect(at(553).window).toBeNull();
    expect(at(560).failing).toEqual([true, false, false]);
  });

  test("Retry gone in take 2", () => {
    for (let f = 520; f < 1920; f++) expect(at(f).retry, `frame ${f}`).toBeNull();
  });
});

describe("Topology CLOSED fills the window", () => {
  test("Results enter the window", () => {
    expect(at(641).window).toMatchObject({ empty: [0, 1, 2, 3, 4], squares: [], rate: 0 });
    expect(at(642).window?.squares).toEqual([{ id: "square@642", kind: "fail", appearAt: 642, x: 360, opacity: 1, appear: { opacity: 1, scale: 0.3 } }]);
    expect(at(652).window?.rate).toBeCloseTo(0.2, 12);
    expect(kinds(at(768))).toEqual(["fail", "fail", "fail", "fail"]);
    expect(at(768).state?.name).toBe("closed");
    expect(kinds(at(810))).toEqual(["fail", "fail", "fail", "fail", "fail"]);
  });

  test("At the threshold, still CLOSED", () => {
    for (let f = 778; f <= 809; f++) {
      expect(at(f).window?.rate, `frame ${f}`).toBe(0.8);
      expect(at(f).state?.name, `frame ${f}`).toBe("closed");
    }
    for (let f = 810; f <= 819; f++) expect(at(f).state?.name, `frame ${f}`).toBe("closed");
    expect(at(820).state?.name).toBe("open");
  });

  test("Calls counted on arrival", () => {
    expect([619, 620, 788].map((f) => at(f).counters?.calls)).toEqual([0, 1, 5]);
  });
});

describe("Topology OPEN fails fast", () => {
  test("Service left alone", () => {
    for (const [from, to] of [[820, 949], [1020, 1149]]) {
      for (let f = from; f <= to; f++) {
        const s = at(f);
        expect([...tokensOn(s, "out-req"), ...tokensOn(s, "out-rep")], `frame ${f}`).toEqual([]);
        if (s.counters !== null) expect(s.counters.calls, `frame ${f}`).toBe(5);
      }
    }
  });

  test("Fail-fast stream", () => {
    expect(tokensOn(at(822), "in-req").find((t) => t.id === "open-6:in-req")?.point).toEqual({ x: 208, y: 228 });
    expect(at(822).counters?.requests).toBe(6);
    expect(tokensOn(at(844), "in-rep").find((t) => t.id === "open-6:in-rep")?.point).toEqual({ x: 306, y: 266 });
    expect(at(906).counters?.requests).toBe(20);
    expect(at(912).counters).toMatchObject({ calls: 5, ghost: { opacity: 0, scale: 0.7 } });
    expect(at(911).counters?.ghost).toBeNull();
    expect(tokensOn(at(950), "in-rep")).toEqual([]);
  });

  test("Cut line drawn", () => {
    const read = (f: number) => (["out-req", "out-rep", "in-rep"] as const).map((r) => at(f).arrows[r]).map((a) => [a?.dashed, a?.opacity]);
    expect(read(830)).toEqual([[true, 0.25], [true, 0.25], [false, 1]]);
    expect(read(1030)).toEqual([[true, 0.25], [true, 0.25], [false, 1]]);
    expect(read(960)).toEqual([[false, 1], [false, 1], [false, 0.25]]);
    expect(read(1300)).toEqual([[false, 1], [false, 1], [false, 1]]);
  });

  test("Customer message beside the error", () => {
    const s = at(870);
    expect(s.tags.left?.text).toBe("open");
    expect(drawn(s.tags.left!.appear)).toBe(true);
    expect(drawn(s.message)).toBe(true);
  });
});

describe("Topology resetTimeout clock", () => {
  test("Clock frames", () => {
    expect([820, 885, 949, 1000, 1020, 1149].map((f) => at(f).clock?.left)).toEqual([1, 64 / 129, 0, 0, 1, 0]);
    expect(at(1000).clock?.opacity).toBeCloseTo(0.6, 12);
    expect(at(870).clock?.opacity).toBe(1);
  });

  test("Clock gone in CLOSED", () => {
    for (let f = 1230; f < 1920; f++) expect(at(f).clock, `frame ${f}`).toBeNull();
  });
});

describe("Topology HALF_OPEN test calls", () => {
  test("One test call each", () => {
    const legs: Record<string, [number, number, string]> = { "test-1:out-req": [966, 988, "out-req"], "test-1:out-rep": [988, 1010, "out-rep"], "test-2:out-req": [1166, 1188, "out-req"], "test-2:out-rep": [1188, 1210, "out-rep"] };
    for (const [from, to] of [[950, 1019], [1150, 1219]]) {
      for (let f = from; f <= to; f++) {
        const tokens = at(f).tokens;
        expect(tokens.length, `frame ${f}`).toBeLessThanOrEqual(1);
        for (const t of tokens) {
          const [start, end, route] = legs[t.id];
          expect(t.route === route && f >= start && f < end, `${t.id} at ${f}`).toBe(true);
        }
      }
    }
  });

  test("Test fails, OPEN again", () => {
    expect(at(988).tags.right).toMatchObject({ text: "timeout", at: 988 });
    expect(at(1019).state?.name).toBe("halfOpen");
    expect(at(1020).state).toMatchObject({ name: "open", at: 1020 });
  });

  test("Test succeeds, CLOSED", () => {
    expect(at(1187).failing[0]).toBe(true);
    expect(at(1188).failing[0]).toBe(false);
    expect(at(1188).tags.right).toMatchObject({ text: "ok", at: 1188 });
    expect(at(1219).state?.name).toBe("halfOpen");
    expect(at(1220).state).toMatchObject({ name: "closed", at: 1220 });
  });
});

describe("Topology CLOSED ignores noise", () => {
  test("Window cleared", () => {
    expect(kinds(at(1219))).toEqual(Array(5).fill("fail"));
    expect(at(1219).window?.opacity).toBeCloseTo(0.3, 12);
    for (const f of [1230, 1301]) expect(at(f).window, `frame ${f}`).toMatchObject({ empty: [0, 1, 2, 3, 4], squares: [], rate: 0, opacity: 1 });
  });

  test("One timeout is noise", () => {
    expect(at(1382).window?.squares.find((q) => q.appearAt === 1382)).toMatchObject({ kind: "fail", x: 480 });
    expect(at(1392).window?.rate).toBeCloseTo(0.2, 12);
    expect(kinds(at(1489))).toEqual(["ok", "ok", "fail", "ok", "ok"]);
    expect(at(1489).window?.rate).toBeCloseTo(0.2, 12);
    expect(at(1489).state?.name).toBe("closed");
  });

  test("Timeout shows on the lines", () => {
    expect([at(1360).arrows["out-rep"]?.kind, at(1360).tags.right?.text, at(1360).tags.right?.at]).toEqual(["failure", "timeout", 1360]);
    expect([at(1399).arrows["out-rep"]?.kind, at(1399).tags.right?.text, drawn(at(1399).tags.right!.appear)]).toEqual(["failure", "timeout", true]);
    expect([at(1400).arrows["out-rep"]?.kind, at(1400).tags.right?.text, at(1400).tags.right?.at]).toEqual(["reply", "ok", 1400]);
  });
});

describe("Topology business error not counted", () => {
  test("400 drops off", () => {
    for (const f of [1565, 1567, 1581, ...Array.from({ length: 14 }, (_, i) => 1586 + i)]) {
      expect(kinds(at(f)), `frame ${f}`).toEqual(["ok", "ok", "fail", "ok", "ok"]);
      expect(at(f).window?.rate, `frame ${f}`).toBeCloseTo(0.2, 12);
    }
    expect(drawn(at(1567).dropped?.appear ?? null)).toBe(true);
    expect(at(1567).dropped?.fall).toBe(0);
    expect(at(1581).dropped?.fall).toBeGreaterThan(0);
    expect(at(1581).dropped?.opacity).toBeLessThan(1);
    for (let f = 1586; f < 1600; f++) expect(at(f).dropped, `frame ${f}`).toBeNull();
    // Drawn at slot 5, beside the window, at the window's row (the dropped square is exempt from placement while it lives).
    expect(stageAt(1567).components.dropped).toMatchObject({ x: slotX(5), y: SQUARE.y });
  });

  test("Missing or doubled pop rejected", () => {
    const { ["checkout@4"]: _, ...without } = timeline.pops;
    expect(() => frameAt(0, { ...timeline, pops: without })).toThrow('expected one "checkout@<frame>" key, found 0');
    expect(() => frameAt(0, { ...timeline, pops: { ...timeline.pops, "checkout@5": 5 } })).toThrow('expected one "checkout@<frame>" key, found 2');
  });

  test("400 tags", () => {
    expect(at(1544).tags.right).toMatchObject({ text: "business", at: 1544 });
    expect(at(1566).tags.left).toMatchObject({ text: "business", at: 1566 });
  });
});

describe("Topology sliding window", () => {
  test("Slides", () => {
    expect(kinds(at(1686))).toEqual(["ok", "fail", "ok", "ok", "ok"]);
    expect(kinds(at(1726))).toEqual(["fail", "ok", "ok", "ok", "ok"]);
    expect(kinds(at(1766))).toEqual(Array(5).fill("ok"));
    expect(at(1766).window?.rate).toBe(0);
  });

  test("Mid-slide", () => {
    const squares = [...at(1681).window!.squares].sort((a, b) => a.x - b.x);
    expect(squares[0]).toMatchObject({ x: 360 - 30, opacity: 0.5 });
    expect(squares.slice(1, 5).map((q) => q.x)).toEqual([390, 450, 510, 570]);
    expect(squares[5]).toMatchObject({ x: 600, appearAt: 1676 });
  });
});

describe("Topology final still", () => {
  test("Final hold identical", () => {
    const held = at(1800);
    for (let f = 1800; f < 1920; f++) expect(at(f), `frame ${f}`).toEqual(held);
    expect(held.state?.name).toBe("closed");
    expect(kinds(held)).toEqual(Array(5).fill("ok"));
    expect(held.window?.rate).toBe(0);
    expect([held.tags.left?.text, held.tags.right?.text]).toEqual(["ok", "ok"]);
    expect(held.badge?.take).toBe(2);
    expect(held.failing).toEqual([false, false, false]);
    expect([held.tokens, held.counters, held.clock]).toEqual([[], null, null]);
  });

  test("Last movement before the hold", () => {
    expect(at(1777).tokens.map((t) => t.id)).toEqual(["c8:in-rep"]);
    expect(at(1778).tokens).toEqual([]);
    expect(at(1800).tokens).toEqual([]);
  });
});

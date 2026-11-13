// The SDD relay scene's timeline and frame logic (spec scene-catalogue, "SDD
// relay beats and timing", "SDD relay cast", "SDD relay take 1 relay", "SDD
// relay take 1 code alone", "SDD relay error and fright", "SDD relay rewind",
// "SDD relay open questions listed", "SDD relay carry and answer", "SDD relay
// implementation and final still"; change sdd-scene-1-relay, tasks 2.5 and
// 3.2). The beat table of design §4 is transcribed here by hand, independently
// of src/scenes/sdd-request-relay/timeline.ts, so a retiming of the scene or of
// the motion tokens fails here first.
import { describe, expect, test } from "vitest";
import { LEAVE_FRAMES } from "../../src/scenes/takes-kind";
import { frameAt, objectFrame, type RelayState } from "../../src/scenes/sdd-request-relay/frame";
import { CAST_SCALE, CAST_X, DESK, EMOTES, GROUND, HELD, aboveChaves, inScreen } from "../../src/scenes/sdd-request-relay/layout";
import { STAGE_LAYERS, balaoParams, chavesParams, stageOf, visorParams } from "../../src/scenes/sdd-request-relay/stage";
import { makeTimeline, timeline, type RelayTimeline } from "../../src/scenes/sdd-request-relay/timeline";
import { textsOf } from "./topology-tree";

const T = 22, F = 10, D = 400;
const r6 = [0, 1, 2, 3, 4, 5];
const FRAMES = Array.from({ length: 1080 }, (_, f) => f);
const STATES: RelayState[] = FRAMES.map((f) => frameAt(f));

// ---------------------------------------------------------------- design §4, transcribed

const BEATS = {
  duration: 1080,
  outro: 980,
  ringsFade: [0, 20],
  rewind: { from: 390, to: 439, objects: [389, 49] },
  phases: [
    ["setup", 1, 0, 49, [20, 26], ["takeNumbers"]],
    ["t1-request", 1, 50, 129, [20, 22, 24]],
    ["t1-relay", 1, 130, 219, [26, 32]],
    ["t1-code", 1, 220, 299, [26]],
    ["t1-error", 1, 300, 389, [122, 26], ["fright"]],
    ["rewind", "rewind", 390, 449, [22], ["rewind", "takeNumbers"]],
    ["t2-request", 2, 450, 529, [20, 22, 24]],
    ["t2-relay", 2, 530, 619, [26, 32]],
    ["t2-list", 2, 620, 699, [32, 72, 80, 98, 106, 108, 109, 110, 111, 112, 113]],
    ["t2-carry", 2, 700, 749, [116, 118]],
    ["t2-answer", 2, 750, 849, [34, 118, 120, 148], ["goStamp"]],
    ["t2-return", 2, 850, 889, [32, 148]],
    ["t2-implement", 2, 890, 979, [32, 152]],
  ] as const,
  acts: [
    ["balao", 56, 56], ["balao", 118, 118], ["chaves", 136, 210], ["visor", 226, 226],
    ["visor", 414, 414], ["chaves", 416, 427], ["balao", 430, 430], ["balao", 439, 439],
    ["balao", 456, 456], ["balao", 518, 518], ["chaves", 536, 610],
    ["visor", 626, 626], ["visor", 702, 702], ["chaves", 712, 734], ["balao", 752, 836], ["chaves", 852, 874], ["visor", 896, 896],
  ] as const,
  faces: [
    ["visor", 286, "done"], ["balao", 316, "failed"], ["visor", 366, "failed"],
    ["visor", 394, "done"], ["balao", 401, "idle"], ["visor", 405, "idle"],
    ["visor", 702, "waiting"], ["balao", 836, "done"], ["visor", 950, "done"],
  ] as const,
  emotes: [["balao", "problem", 316, 350], ["visor", "worked", 950, null]] as const,
  actions: [
    ["balao", 56, { speaks: true }], ["balao", 118, { speaks: false }], ["chaves", 136, { facing: "right", types: true }], ["chaves", 210, { types: false }], ["visor", 226, { points: true }],
    ["balao", 456, { speaks: true }], ["balao", 518, { speaks: false }], ["chaves", 536, { facing: "right", types: true }], ["chaves", 610, { types: false }],
    ["visor", 626, { points: true }], ["visor", 702, { points: false }], ["chaves", 712, { facing: "left" }], ["chaves", 734, { holdsSheet: true }],
    ["balao", 752, { speaks: true }], ["balao", 806, { speaks: false }], ["balao", 816, { holdsStamp: true }], ["balao", 836, { holdsStamp: false }],
    ["chaves", 852, { holdsSheet: false }], ["chaves", 874, { facing: "right" }], ["visor", 896, { points: true }],
  ] as const,
  trips: [
    ...r6.map((i) => [`ask-t1-${i}`, `ask-${i}`, 60 + 6 * (5 - i)]),
    ...r6.map((i) => [`hop-t1-${i}`, `hop-${i}`, 146 + 6 * (5 - i)]),
    ...r6.map((i) => [`ask-t2-${i}`, `ask-${i}`, 60 + 6 * (5 - i) + D]),
    ...r6.map((i) => [`hop-t2-${i}`, `hop-${i}`, 146 + 6 * (5 - i) + D]),
    ...r6.map((i) => [`list-${i}`, `list-${i}`, 636 + 8 * i]),
    ["carry", "carry", 712], ["return", "return", 852],
  ] as [string, string, number][],
  pops: { laptop: 4, balao: 8, chaves: 12, visor: 16, badge1: 20, rewindMark: 390, badge2: 440, sheet: 626, goMark: 836 },
  fades: { "p1-t1": [56, 118], "p2-t1": [142, 204], failureArrow: [300, null], "p1-t2": [456, 518], "p2-t2": [542, 604], "p4-carry": [712, 734], "p4-return": [852, 874] },
  leaves: { problem: 350, rewindMark: 450 },
  cues: {
    requestLine: [142, 542],
    codeLines1: r6.map((j) => 232 + 8 * j),
    sinks: r6.map((j) => 242 + 8 * j),
    rows: r6.map((j) => 658 + 8 * j),
    checks: r6.map((k) => 760 + 8 * k),
    codeLines2: r6.map((j) => 902 + 8 * j),
    badgeSwap: [440],
  },
  fright: { actor: "balao", at: 316, tilt: -5, squash: -0.07 },
};

/** The first difference between a timeline and the transcription, or null. */
const differs = (t: RelayTimeline): string | null => {
  const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  for (const k of ["duration", "outro", "ringsFade", "rewind", "fright"] as const) if (!eq(t[k], BEATS[k])) return k;
  const phases = t.phases.map((p) => [p.id, p.take, p.from, p.to, p.cites, ...(p.devices ? [p.devices] : [])]);
  for (const [i, p] of BEATS.phases.entries()) if (!eq(phases[i], p)) return `phase ${p[0]}`;
  if (phases.length !== BEATS.phases.length) return "phase count";
  const trips = new Map(t.trips.map((trip) => [trip.id, trip]));
  for (const [id, route, from] of BEATS.trips) {
    const trip = trips.get(id);
    if (!trip || trip.route !== route || trip.from !== from || trip.to !== from + T) return `trip ${id}`;
  }
  if (t.trips.length !== BEATS.trips.length) return "trip count";
  const acts = [...t.acts].map((a) => [a.actor, a.from, a.to]).sort((a, b) => (a[1] as number) - (b[1] as number));
  if (!eq(acts, BEATS.acts)) return "acts";
  const faces = [...t.faces].map((f) => [f.actor, f.at, f.expression]).sort((a, b) => (a[1] as number) - (b[1] as number));
  if (!eq(faces, BEATS.faces)) return "faces";
  if (!eq(t.emotes.map((e) => [e.actor, e.kind, e.at, e.leaveAt]), BEATS.emotes)) return "emotes";
  if (!eq([...t.actions].sort((a, b) => a.at - b.at).map((a) => [a.actor, a.at, a.set]), BEATS.actions)) return "actions";
  if (!eq(t.pops, BEATS.pops)) return "pops";
  for (const [name, pair] of Object.entries(BEATS.fades)) {
    const [inAt, outAt] = pair as [number, number | null];
    const want = { in: [inAt, inAt + F], ...(outAt === null ? {} : { out: [outAt, outAt + F] }) };
    if (!eq(t.fades[name], want)) return `fade ${name}`;
  }
  if (!eq(t.leaves, BEATS.leaves)) return "leaves";
  for (const [name, frames] of Object.entries(BEATS.cues)) if (!eq(t.cues[name], frames)) return `cue ${name}`;
  return null;
};

describe("SDD relay beats and timing", () => {
  test("Timeline equals the beat table", () => {
    expect(differs(timeline)).toBeNull();
    // Every phase event lies in its phase, and every action frame is an event of the phase it falls in.
    for (const p of timeline.phases) for (const e of p.events) expect(e.at >= p.from && e.at <= p.to, `${p.id} ${e.id}`).toBe(true);
    for (const a of timeline.actions) expect(timeline.phases.some((p) => p.events.some((e) => e.at === a.at))).toBe(true);
  });

  test("Travel token changed", () => {
    expect(differs(makeTimeline(20))).toBe("trip ask-t1-0");
    expect(differs(makeTimeline(22, 12))).toBe("fade p1-t1");
  });

  test("Seeking in any order", () => {
    const forward = FRAMES.map((f) => JSON.stringify(frameAt(f)));
    const backward = [...FRAMES].reverse().map((f) => [f, JSON.stringify(frameAt(f))] as const);
    for (const [f, s] of backward) expect(s).toBe(forward[f]);
    const shuffled = [...FRAMES].sort((a, b) => ((a * 7919) % 1080) - ((b * 7919) % 1080));
    for (const f of shuffled) expect(JSON.stringify(frameAt(f))).toBe(forward[f]);
  });
});

// ---------------------------------------------------------------- the cast

describe("SDD relay cast", () => {
  test("Cast in place at every frame", () => {
    for (const s of STATES) {
      const params = [
        s.balao && balaoParams(s.balao),
        s.chaves && chavesParams(s.chaves, s.sheet),
        s.visor && visorParams(s.visor),
      ].filter((p) => p !== null);
      for (const p of params) {
        expect(p.scale).toBe(CAST_SCALE);
        expect(p.y).toBe(GROUND);
        expect(Object.keys(p).some((k) => /fill|colou?r/i.test(k))).toBe(false);
      }
      if (s.balao) expect(balaoParams(s.balao)).toMatchObject({ x: CAST_X.balao, facing: "right" });
      if (s.chaves) expect(chavesParams(s.chaves, s.sheet).x).toBe(CAST_X.chaves);
      if (s.visor) expect(visorParams(s.visor)).toMatchObject({ x: CAST_X.visor, facing: "left" });
    }
  });

  test("Emotes beside the head", () => {
    expect(frameAt(347).emote).toEqual({ kind: "problem", ...EMOTES.problem, opacity: 1 });
    expect(frameAt(1000).emote).toEqual({ kind: "worked", ...EMOTES.worked, opacity: 1 });
    // At most one emote at any frame: the state holds one, and the timeline's never overlap.
    const shown = STATES.map((s) => s.emote?.kind ?? null);
    expect(shown.slice(316, 360).every((k) => k === "problem" || k === null)).toBe(true);
    expect(shown.slice(360, 950).every((k) => k === null)).toBe(true);
  });

  test("Every cast change inside an act or a face entry", () => {
    // CAST-4 against what is drawn: an action parameter changes only inside a declared act of its actor, and a
    // face changes only on a `faces` entry.
    const actionOf = (s: RelayState) => ({
      balao: s.balao && { speaks: s.balao.speaks, holdsStamp: s.balao.holdsStamp },
      chaves: s.chaves && { facing: s.chaves.facing, types: s.chaves.types, holdsSheet: s.chaves.holdsSheet },
      visor: s.visor && { points: s.visor.points },
    });
    for (let f = 1; f < 1080; f++) {
      const a = actionOf(STATES[f - 1]), b = actionOf(STATES[f]);
      for (const actor of ["balao", "chaves", "visor"] as const) {
        if (a[actor] === null || b[actor] === null) continue;
        if (JSON.stringify(a[actor]) !== JSON.stringify(b[actor])) {
          expect(timeline.acts.some((act) => act.actor === actor && f >= act.from && f <= act.to), `${actor} acts at ${f}`).toBe(true);
        }
        const before = STATES[f - 1][actor]!.expression, now = STATES[f][actor]!.expression;
        if (before !== now) expect(timeline.faces.some((face) => face.actor === actor && face.at === f && face.expression === now), `${actor} face at ${f}`).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------- take 1

const stageWithout = (f: number) => {
  const s = frameAt(f), st = stageOf(s);
  return JSON.stringify({ below: st.below, cast: st.cast, sheet: st.sheet, tokens: st.tokens, paths: s.paths, emote: s.emote, laptop: s.laptop });
};
const words = (f: number) => STAGE_LAYERS.flatMap((name) => textsOf(stageOf(frameAt(f))[name]).map((t) => t.text));

describe("SDD relay take 1 relay", () => {
  test("Request and relay frames", () => {
    const at = (f: number) => STATES[f];
    expect(at(55).balao!.speaks).toBe(false);
    expect(at(55).tokens).toEqual([]);
    expect(at(56).balao!.speaks).toBe(true);
    expect(at(81).tokens.find((q) => q.id === "q5")!.point).not.toEqual(aboveChaves(5));
    expect(at(82).tokens.find((q) => q.id === "q5")!.point).toEqual(aboveChaves(5));
    expect(at(113).tokens.map((q) => q.point)).toEqual(r6.map(aboveChaves));
    expect(at(113).chaves!.facing).toBe("left");
    expect(at(135).chaves).toMatchObject({ facing: "left", types: false });
    expect(at(136).chaves).toMatchObject({ facing: "right", types: true });
    expect(at(141).screen.requestLine).toBe(false);
    expect(at(142).screen.requestLine).toBe(true);
    expect(at(199).tokens.map((q) => q.point)).toEqual(r6.map(inScreen));
    expect(at(209).chaves!.types).toBe(true);
    expect(at(210).chaves!.types).toBe(false);
  });

  test("Take 2 repeats the relay", () => {
    for (let f = 50; f <= 225; f++) expect(stageWithout(f + D), `frame ${f}`).toBe(stageWithout(f));
  });
});

describe("SDD relay take 1 code alone", () => {
  test("The questions sink into the code", () => {
    expect(STATES[225].visor!.points).toBe(false);
    expect(STATES[226].visor!.points).toBe(true);
    expect(STATES[231].screen.codeLines).toBe(0);
    expect(STATES[232].screen.codeLines).toBe(1);
    expect(STATES[272].screen.codeLines).toBe(6);
    const q0 = (f: number) => STATES[f].tokens.find((q) => q.id === "q0");
    expect(q0(232)).toMatchObject({ opacity: 1 });
    expect(q0(237)!.opacity).toBeCloseTo(0.5);
    expect(q0(237)!.point.y).toBeCloseTo(inScreen(0).y + 8);
    expect(q0(242)).toBeUndefined();
    expect(STATES[281].tokens).toHaveLength(1);
    expect(STATES[282].tokens).toEqual([]);
    expect(STATES[285].visor!.expression).toBe("idle");
    expect(STATES[286].visor!.expression).toBe("done");
  });

  test("No sheet before take 2", () => {
    for (let f = 0; f <= 625; f++) {
      expect(STATES[f].sheet, `frame ${f}`).toBeNull();
      const w = words(f);
      expect(w.includes("proposal.md") || w.includes("GO"), `frame ${f}`).toBe(false);
    }
  });
});

describe("SDD relay error and fright", () => {
  test("Error frames", () => {
    expect(STATES[299].failureArrow).toBe(0);
    expect(STATES[305].failureArrow).toBeCloseTo(0.5);
    expect(STATES[310].failureArrow).toBe(1);
    expect(STATES[315].balao).toMatchObject({ expression: "idle", tilt: 0, squash: 1 });
    expect(STATES[316].balao).toMatchObject({ expression: "failed", tilt: -5 });
    expect(STATES[330].emote!.kind).toBe("problem");
    expect(STATES[360].emote).toBeNull();
    expect(timeline.emotes[0].leaveAt! + LEAVE_FRAMES).toBeLessThanOrEqual(366);
    expect(STATES[365].visor!.expression).toBe("done");
    expect(STATES[366].visor!.expression).toBe("failed");
  });
});

// ---------------------------------------------------------------- rewind

describe("SDD relay rewind", () => {
  test("Object frames", () => {
    expect([389, 390, 414, 439, 445].map((f) => objectFrame(f))).toEqual([389, 389, 222, 49, 49]);
  });

  test("Same stage before each take", () => {
    expect(stageWithout(449)).toBe(stageWithout(49));
    expect(stageWithout(450)).toBe(stageWithout(49));
    expect(STATES[439].badge!.take).toBe(1);
    expect(STATES[440].badge!.take).toBe(2);
  });

  test("Cast replayed backwards", () => {
    const inRewind = (at: number) => at >= 390 && at <= 449;
    expect(timeline.faces.filter((f) => inRewind(f.at)).map((f) => [f.actor, f.at, f.expression])).toEqual([["visor", 394, "done"], ["balao", 401, "idle"], ["visor", 405, "idle"]]);
    expect(timeline.acts.filter((a) => inRewind(a.from)).map((a) => [a.actor, a.from, a.to])).toEqual([["visor", 414, 414], ["chaves", 416, 427], ["balao", 430, 430], ["balao", 439, 439]]);
    expect(timeline.emotes.some((e) => inRewind(e.at))).toBe(false);
    for (let f = 390; f <= 449; f++) expect(STATES[f].emote, `frame ${f}`).toBeNull();
    // What is drawn follows: Visor stops pointing at 414, Chaves types again at 416 and turns back at 427.
    expect([STATES[413].visor!.points, STATES[414].visor!.points]).toEqual([true, false]);
    expect([STATES[415].chaves!.types, STATES[416].chaves!.types, STATES[427].chaves!.facing]).toEqual([false, true, "left"]);
  });
});

// ---------------------------------------------------------------- take 2

describe("SDD relay open questions listed", () => {
  test("Rows from the questions", () => {
    expect(STATES[625].sheet).toBeNull();
    expect(STATES[626].sheet).toBeNull();
    expect(STATES[626].visor!.points).toBe(true);
    expect(STATES[627].sheet).toMatchObject({ place: "desk", at: DESK, rows: 0, checked: 0 });
    expect(STATES[636].tokens.find((q) => q.id === "q0")!.point).toEqual(inScreen(0));
    expect(STATES[657].sheet!.rows).toBe(0);
    expect(STATES[658].sheet!.rows).toBe(1);
    expect(STATES[658].tokens.find((q) => q.id === "q0")).toBeUndefined();
    expect(STATES[698].sheet!.rows).toBe(6);
    expect(STATES[698].tokens).toEqual([]);
    expect(STATES[702].visor).toMatchObject({ points: false, expression: "waiting" });
  });

  test("No code before the approval", () => {
    for (let f = 450; f <= 901; f++) expect(STATES[f].screen, `frame ${f}`).toEqual({ requestLine: f >= 542, codeLines: 0 });
  });
});

describe("SDD relay carry and answer", () => {
  test("Carry frames", () => {
    expect(STATES[711].sheet).toMatchObject({ place: "desk", at: DESK });
    expect(STATES[711].chaves!.facing).toBe("right");
    expect(STATES[712].chaves!.facing).toBe("left");
    expect(STATES[712].sheet).toMatchObject({ place: "trip" });
    expect(STATES[712].sheet!.at.x).toBeCloseTo(DESK.x);
    const mid = STATES[723].sheet!.at;
    expect(mid.x).toBeLessThan(DESK.x);
    expect(mid.x).toBeGreaterThan(HELD.x);
    expect(STATES[733].chaves!.holdsSheet).toBe(false);
    expect(STATES[734].chaves!.holdsSheet).toBe(true);
    expect(STATES[734].sheet).toMatchObject({ place: "held", at: HELD, rows: 6 });
    expect(words(734)).toContain("proposal.md");
  });

  test("Answer and stamp frames", () => {
    expect(STATES[751].balao!.speaks).toBe(false);
    for (let f = 752; f <= 805; f++) expect(STATES[f].balao!.speaks).toBe(true);
    expect(STATES[806].balao!.speaks).toBe(false);
    expect(STATES[759].sheet!.checked).toBe(0);
    expect(STATES[760].sheet!.checked).toBe(1);
    expect(STATES[800].sheet!.checked).toBe(6);
    expect(STATES[815].balao!.holdsStamp).toBe(false);
    for (let f = 816; f <= 835; f++) expect(STATES[f].balao!.holdsStamp).toBe(true);
    expect(STATES[836].balao).toMatchObject({ holdsStamp: false, expression: "done" });
    expect(STATES[836].sheet!.go).toBeNull();
    expect(STATES[837].sheet!.go).not.toBeNull();
    expect(words(837).filter((w) => w === "GO")).toHaveLength(1);
  });
});

describe("SDD relay implementation and final still", () => {
  test("Return and implementation frames", () => {
    expect(STATES[851]).toMatchObject({ chaves: { holdsSheet: true }, sheet: { place: "held" } });
    expect(STATES[852]).toMatchObject({ chaves: { holdsSheet: false }, sheet: { place: "trip" } });
    expect(STATES[873].chaves!.facing).toBe("left");
    expect(STATES[874]).toMatchObject({ chaves: { facing: "right" }, sheet: { place: "desk", at: DESK, rows: 6, checked: 6 } });
    expect(STATES[874].sheet!.go).not.toBeNull();
    expect(STATES[895].visor!.points).toBe(false);
    expect(STATES[896].visor!.points).toBe(true);
    expect(STATES[901].screen.codeLines).toBe(0);
    expect(STATES[902].screen.codeLines).toBe(1);
    expect(STATES[942].screen.codeLines).toBe(6);
    expect(STATES[949].visor!.expression).toBe("waiting");
    expect(STATES[950].visor!.expression).toBe("done");
    expect(STATES[950].emote!.kind).toBe("worked");
  });

  test("Final hold identical", () => {
    const first = JSON.stringify({ state: STATES[980], stage: stageOf(STATES[980]) });
    for (let f = 981; f < 1080; f++) expect(JSON.stringify({ state: STATES[f], stage: stageOf(STATES[f]) }), `frame ${f}`).toBe(first);
  });
});

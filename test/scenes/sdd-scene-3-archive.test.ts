// The SDD archive scene's timeline and frame logic (spec scene-catalogue,
// "SDD archive beats and timing", "SDD archive cast", "SDD archive mechanics
// (first archive)", "SDD archive second request and propose", "SDD archive
// single review round", "SDD archive approval", "SDD archive mechanics
// (second archive), apply and ending"; change sdd-scene-3-archive, tasks 2.4
// and 3.2). The beat table of design §4 is transcribed here by hand,
// independently of src/scenes/sdd-scene-3-archive/timeline.ts, so a retiming
// of the scene or of the motion tokens fails here first.
import { describe, expect, test } from "vitest";
import { pointAlong } from "../../src/brand/motion";
import { frameAt, type ArchiveState } from "../../src/scenes/sdd-scene-3-archive/frame";
import { CAST_SCALE, CAST_X, EMOTES, GO, GROUND, ROUTES, VERDICT_CENTRE } from "../../src/scenes/sdd-scene-3-archive/layout";
import { STAGE_LAYERS, balaoParams, chavesParams, stageOf, visorParams } from "../../src/scenes/sdd-scene-3-archive/stage";
import { makeTimeline, timeline, type ArchiveTimeline } from "../../src/scenes/sdd-scene-3-archive/timeline";
import { textsOf } from "./topology-tree";

const T = 22, F = 10;
const FRAMES = Array.from({ length: 600 }, (_, f) => f);
const STATES: ArchiveState[] = FRAMES.map((f) => frameAt(f));

// ---------------------------------------------------------------- design §4, transcribed

const BEATS = {
  duration: 600,
  outro: 500,
  ringsFade: [0, 20],
  phases: [
    ["setup", 0, 39, [193, 199]],
    ["archive-1", 40, 119, [193, 195, 196, 197, 199]],
    ["request", 120, 179, [201, 203, 205]],
    ["propose", 180, 259, [207, 209, 211, 221, 223, 226, 227, 228, 232]],
    ["review", 260, 339, [236], ["findingMark"]],
    ["approve", 340, 399, [124, 148, 236], ["goStamp"]],
    ["apply", 400, 419, [152, 236]],
    ["archive-2", 420, 469, [193, 195, 196, 197, 236]],
    ["ending", 470, 499, [242, 264]],
  ] as const,
  acts: [["balao", 124, 164], ["visor", 184, 246], ["balao", 344, 360]] as const,
  faces: [["balao", 360, "done"], ["visor", 404, "done"], ["chaves", 474, "done"]] as const,
  emotes: [["visor", "worked", 404, null]] as const,
  actions: [
    ["balao", 124, { speaks: true }], ["balao", 164, { speaks: false }], ["visor", 184, { points: true }], ["visor", 246, { points: false }],
    ["balao", 344, { holdsStamp: true }], ["balao", 360, { holdsStamp: false }],
  ] as const,
  trips: [["archive-1", 44], ["go", 360], ["archive-2", 430]] as const,
  pops: { balao: 4, chaves: 6, visor: 8, book: 10, firstFolder: 12, fieldPill: 100, secondFolder: 190, findingMark: 268 },
  fades: { goGuide: [360, 382] },
  leaves: { findingMark: 304, go: 420 },
  jolts: [["book", 210], ["secondFolder", 268]] as const,
  cues: {
    request: [124], propose: [184, 190], breakJolt: [210], finding: [268], fix: [304], approve: [344], apply: [404],
    goLeaves: [420], archive2: [430], fieldFlip: [452], ending: [474],
  },
};

/** The first difference between a timeline and the transcription, or null. */
const differs = (t: ArchiveTimeline): string | null => {
  const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  for (const k of ["duration", "outro", "ringsFade"] as const) if (!eq(t[k], BEATS[k])) return k;
  const phases = t.phases.map((p) => [p.id, p.from, p.to, p.cites, ...(p.devices ? [p.devices] : [])]);
  for (const [i, p] of BEATS.phases.entries()) if (!eq(phases[i], p)) return `phase ${p[0]}`;
  if (phases.length !== BEATS.phases.length) return "phase count";
  const trips = new Map(t.trips.map((trip) => [trip.id, trip]));
  for (const [id, from] of BEATS.trips) {
    const trip = trips.get(id);
    if (!trip || trip.route !== id || trip.from !== from || trip.to !== from + T) return `trip ${id}`;
  }
  if (t.trips.length !== BEATS.trips.length) return "trip count";
  if (!eq([...t.acts].map((a) => [a.actor, a.from, a.to]).sort((a, b) => (a[1] as number) - (b[1] as number)), BEATS.acts)) return "acts";
  if (!eq([...t.faces].map((f) => [f.actor, f.at, f.expression]).sort((a, b) => (a[1] as number) - (b[1] as number)), BEATS.faces)) return "faces";
  if (!eq(t.emotes.map((e) => [e.actor, e.kind, e.at, e.leaveAt]), BEATS.emotes)) return "emotes";
  if (!eq([...t.actions].sort((a, b) => a.at - b.at).map((a) => [a.actor, a.at, a.set]), BEATS.actions)) return "actions";
  if (!eq(t.pops, BEATS.pops)) return "pops";
  for (const [name, [inAt, outAt]] of Object.entries(BEATS.fades)) if (!eq(t.fades[name], { in: [inAt, inAt + F], out: [outAt, outAt + F] })) return `fade ${name}`;
  if (Object.keys(t.fades).length !== Object.keys(BEATS.fades).length) return "fade count";
  if (!eq(t.leaves, BEATS.leaves)) return "leaves";
  if (!eq([...t.jolts].map((j) => [j.id, j.at]).sort((a, b) => (a[1] as number) - (b[1] as number)), BEATS.jolts)) return "jolts";
  for (const [name, frames] of Object.entries(BEATS.cues)) if (!eq(t.cues[name], frames)) return `cue ${name}`;
  if (!eq(Object.keys(t.cues).sort(), [...Object.keys(BEATS.cues), "actions"].sort())) return "cue keys";
  if (!eq(t.cues.actions, [...t.actions].map((a) => a.at))) return "cue actions";
  // Each phase's events are exactly the change frames of §4.2 inside it.
  const changes = [
    ...Object.values(BEATS.pops), ...Object.values(BEATS.fades).flatMap(([i, o]) => [i, i + F, o, o + F]),
    ...Object.values(BEATS.leaves).flatMap((at) => [at, at + 10]), ...BEATS.trips.flatMap(([, from]) => [from, from + T]),
    ...BEATS.jolts.flatMap(([, at]) => [at, at + 12]),
    ...Object.values(BEATS.cues).flat(), ...BEATS.actions.map((a) => a[1]), ...BEATS.faces.map((f) => f[1]), ...BEATS.emotes.map((e) => e[2]),
    ...BEATS.acts.flatMap((a) => [a[1], a[2]]),
  ];
  for (const p of t.phases) {
    const want = [...new Set(changes.filter((at) => at >= p.from && at <= p.to))].sort((a, b) => a - b);
    if (!eq([...new Set(p.events.map((e) => e.at))].sort((a, b) => a - b), want)) return `events of ${p.id}`;
  }
  return null;
};

describe("SDD archive beats and timing", () => {
  test("Archive timeline equals the beat table", () => {
    expect(differs(timeline)).toBeNull();
    for (const p of timeline.phases) for (const e of p.events) expect(e.at >= p.from && e.at <= p.to, `${p.id} ${e.id}`).toBe(true);
    for (const at of timeline.actions.map((a) => a.at)) {
      expect(timeline.phases.some((p) => p.events.some((e) => e.at === at)), `frame ${at}`).toBe(true);
    }
  });

  test("Archive travel token changed", () => {
    expect(differs(makeTimeline(20))).toBe("trip archive-1");
    expect(differs(makeTimeline(22, 12))).toBe("fade goGuide");
  });

  test("Archive seeking in any order", () => {
    const forward = FRAMES.map((f) => JSON.stringify(frameAt(f)));
    for (const f of [...FRAMES].reverse()) expect(JSON.stringify(frameAt(f))).toBe(forward[f]);
    const shuffled = [...FRAMES].sort((a, b) => ((a * 7919) % 600) - ((b * 7919) % 600));
    for (const f of shuffled) expect(JSON.stringify(frameAt(f))).toBe(forward[f]);
  });
});

// ---------------------------------------------------------------- the cast

describe("SDD archive cast", () => {
  test("Archive cast in place at every frame", () => {
    for (const s of STATES) {
      const params = [s.balao && balaoParams(s.balao), s.chaves && chavesParams(s.chaves), s.visor && visorParams(s.visor)].filter((p) => p !== null);
      for (const p of params) {
        expect(p.scale).toBe(CAST_SCALE);
        expect(p.y).toBe(GROUND);
        expect(Object.keys(p).some((k) => /fill|colou?r/i.test(k))).toBe(false);
      }
      if (s.balao) expect(balaoParams(s.balao)).toMatchObject({ x: CAST_X.balao, facing: "right" });
      if (s.chaves) {
        const params = chavesParams(s.chaves);
        expect(params).toMatchObject({ x: CAST_X.chaves, facing: "right" });
        expect(Object.keys(params)).toEqual(["x", "y", "scale", "facing", "expression"]);
      }
      if (s.visor) {
        expect(visorParams(s.visor)).toMatchObject({ x: CAST_X.visor, facing: "left" });
        expect(typeof visorParams(s.visor).points).toBe("boolean");
      }
    }
    // A pop-in scales a cast piece through `pose` about its ground point (frame 5: Balão popping).
    expect(STATES[5].balao!.appear.scale).toBeLessThan(1);
    expect(JSON.stringify(stageOf(STATES[5]).cast)).toMatch(new RegExp(`translate\\(${CAST_X.balao} ${GROUND}\\) rotate\\(0\\) scale\\([0-9.]+ [0-9.]+\\) translate\\(-${CAST_X.balao} -${GROUND}\\)`));
  });

  test("Archive emote beside the head", () => {
    expect(STATES[403].emote).toBeNull();
    expect(STATES[404].emote).toMatchObject({ kind: "worked", x: EMOTES.worked.x, y: EMOTES.worked.y, opacity: 1 });
    expect(STATES[550].emote).toEqual({ kind: "worked", ...EMOTES.worked, opacity: 1 });
    expect(STATES.slice(0, 404).every((s) => s.emote === null)).toBe(true);
  });

  test("Every cast change inside an act or a face entry", () => {
    const actionOf = (s: ArchiveState) => ({
      balao: s.balao && { speaks: s.balao.speaks, holdsStamp: s.balao.holdsStamp },
      visor: s.visor && { points: s.visor.points },
    });
    for (let f = 1; f < 600; f++) {
      const a = actionOf(STATES[f - 1]), b = actionOf(STATES[f]);
      for (const actor of ["balao", "visor"] as const) {
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

// ---------------------------------------------------------------- helpers

const words = (f: number) => STAGE_LAYERS.flatMap((name) => textsOf(stageOf(STATES[f])[name]).map((t) => t.text));
const near = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y) < 1e-6;

// ---------------------------------------------------------------- mechanics (first archive)

describe("SDD archive mechanics (first archive)", () => {
  test("Archive frames", () => {
    expect(STATES[11].firstFolder).toBeNull();
    expect(STATES[13].firstFolder).toMatchObject({ centre: { x: 480, y: 140 }, scale: 0.9, inFlight: false });
    expect(STATES[43].firstFolder).toMatchObject({ centre: { x: 480, y: 140 }, scale: 0.9, inFlight: false });
    expect(STATES[44].firstFolder!.inFlight).toBe(true);
    const half55 = pointAlong(ROUTES["archive-1"], (55 - 44) / T)!;
    expect(near(STATES[55].firstFolder!.centre, half55)).toBe(true);
    expect(STATES[66].firstFolder).toMatchObject({ centre: { x: 900, y: 70 }, scale: 0.4, inFlight: false });
    expect(STATES[99].fieldPill).toBeNull();
    expect(STATES[101].fieldPill).toMatchObject({ text: "was" });
  });
});

// ---------------------------------------------------------------- request and propose

describe("SDD archive second request and propose", () => {
  test("Request and propose frames", () => {
    expect(STATES[123].balao!.speaks).toBe(false);
    for (let f = 124; f <= 163; f++) expect(STATES[f].balao!.speaks, `frame ${f}`).toBe(true);
    expect(STATES[164].balao!.speaks).toBe(false);
    expect(STATES[183].visor!.points).toBe(false);
    for (let f = 184; f <= 245; f++) expect(STATES[f].visor!.points, `frame ${f}`).toBe(true);
    expect(STATES[246].visor!.points).toBe(false);
    expect(STATES[189].secondFolder).toBeNull();
    expect(STATES[191].secondFolder).toMatchObject({ centre: { x: 380, y: 150 }, scale: 0.95 });
    expect(STATES[209].book!.angle).toBe(0);
    expect(STATES[215].book!.angle).not.toBe(0);
    expect(STATES[222].book!.angle).toBe(0);
  });

  test("No second folder before propose", () => {
    for (let f = 0; f <= 189; f++) expect(STATES[f].secondFolder, `frame ${f}`).toBeNull();
  });
});

// ---------------------------------------------------------------- the single review round

describe("SDD archive single review round", () => {
  test("Break and finding frames", () => {
    expect(STATES[267].finding).toBeNull();
    expect(STATES[269].finding).not.toBeNull();
    expect(STATES[268].secondFolder!.angle).toBe(0);
    expect(STATES[272].secondFolder!.angle).not.toBe(0);
    expect(STATES[279].secondFolder!.angle).not.toBe(0);
    expect(STATES[280].secondFolder!.angle).toBe(0);
    expect(STATES[303].finding!.opacity).toBe(1);
    expect(STATES[304].finding!.opacity).toBe(1);
    expect(STATES[305].finding!.opacity).toBeLessThan(1);
    expect(STATES[313].finding).not.toBeNull();
    expect(STATES[314].finding).toBeNull();
  });

  test("No finding before the review", () => {
    for (let f = 0; f <= 267; f++) {
      expect(STATES[f].finding, `frame ${f}`).toBeNull();
      expect(STATES[f].secondFolder?.angle ?? 0, `frame ${f}`).toBe(0);
    }
  });

  test("At most one finding mark at a time", () => {
    for (let f = 0; f < 600; f++) {
      const marks = words(f).filter((w) => w === "?").length;
      expect(marks, `frame ${f}`).toBeLessThanOrEqual(1);
      expect(words(f).includes("NO-GO"), `frame ${f}`).toBe(false);
    }
  });
});

// ---------------------------------------------------------------- approval

describe("SDD archive approval", () => {
  test("Approval frames", () => {
    expect(STATES[343].balao!.holdsStamp).toBe(false);
    for (let f = 344; f <= 359; f++) expect(STATES[f].balao!.holdsStamp, `frame ${f}`).toBe(true);
    expect(STATES[360].balao).toMatchObject({ holdsStamp: false, expression: "done" });
    expect(STATES[360].go).toMatchObject({ landed: false, scale: GO.scaleFrom });
    expect(near(STATES[360].go!.centre, GO.from)).toBe(true);
    const half371 = pointAlong(ROUTES.go, (371 - 360) / T)!;
    expect(near(STATES[371].go!.centre, half371)).toBe(true);
    for (let f = 382; f <= 420; f++) expect(STATES[f].go, `frame ${f}`).toEqual({ centre: VERDICT_CENTRE, scale: GO.scaleTo, opacity: 1, landed: true });
    expect(STATES[421].go!.opacity).toBeLessThan(1);
  });

  test("No GO before the owner", () => {
    for (let f = 0; f <= 343; f++) {
      expect(words(f).includes("GO"), `frame ${f}`).toBe(false);
      expect(STATES[f].go, `frame ${f}`).toBeNull();
    }
  });
});

// ---------------------------------------------------------------- second archive, apply and ending

describe("SDD archive mechanics (second archive), apply and ending", () => {
  test("Second archive, apply and ending frames", () => {
    expect(STATES[403].visor).toMatchObject({ expression: "idle" });
    expect(STATES[403].emote).toBeNull();
    expect(STATES[404].visor!.expression).toBe("done");
    expect(STATES[404].emote!.kind).toBe("worked");
    expect(STATES[419].go).toMatchObject({ centre: VERDICT_CENTRE, scale: GO.scaleTo, opacity: 1 });
    expect(STATES[420].go!.opacity).toBe(1);
    expect(STATES[421].go!.opacity).toBeLessThan(1);
    expect(STATES[429].go!.opacity).toBeLessThan(1);
    expect(STATES[430].go).toBeNull();
    expect(STATES[429].secondFolder).toMatchObject({ centre: { x: 380, y: 150 }, scale: 0.95, inFlight: false });
    expect(STATES[430].secondFolder!.inFlight).toBe(true);
    for (let f = 452; f < 600; f++) expect(STATES[f].secondFolder, `frame ${f}`).toMatchObject({ centre: { x: 900, y: 170 }, scale: 0.4, inFlight: false });
    expect(STATES[451].fieldPill).toMatchObject({ text: "was" });
    expect(STATES[452].fieldPill).toMatchObject({ text: "now" });
    expect(STATES[473].chaves!.expression).toBe("idle");
    expect(STATES[474].chaves!.expression).toBe("done");
  });

  test("No field-count change before the second archive", () => {
    for (let f = 0; f <= 451; f++) {
      const pill = STATES[f].fieldPill;
      if (pill !== null) expect(pill.text, `frame ${f}`).toBe("was");
    }
    for (let f = 0; f < 100; f++) expect(STATES[f].fieldPill, `frame ${f}`).toBeNull();
  });

  test("No cast act during archive or review", () => {
    const banned: [number, number][] = [[40, 119], [260, 339], [420, 469]];
    for (const act of timeline.acts) {
      for (const [from, to] of banned) {
        expect(act.from > to || act.to < from, `act of ${act.actor} [${act.from}, ${act.to}] against [${from}, ${to}]`).toBe(true);
      }
    }
  });

  test("Archive final hold identical", () => {
    const first = JSON.stringify({ state: STATES[500], stage: stageOf(STATES[500]) });
    for (let f = 501; f < 600; f++) expect(JSON.stringify({ state: STATES[f], stage: stageOf(STATES[f]) }), `frame ${f}`).toBe(first);
  });
});

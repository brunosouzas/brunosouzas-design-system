// The SDD files scene's timeline and frame logic (spec scene-catalogue, "SDD
// files beats and timing", "SDD files cast", "SDD files init and propose",
// "SDD files questions and answers", "SDD files review round 1", "SDD files
// fix and review round 2", "SDD files approval", "SDD files apply and final
// still"; change sdd-scene-2-files, tasks 2.5 and 3.2). The beat table of
// design §4 is transcribed here by hand, independently of
// src/scenes/sdd-scene-2-files/timeline.ts, so a retiming of the scene or of
// the motion tokens fails here first.
import { describe, expect, test } from "vitest";
import { pointAlong } from "../../src/brand/motion";
import { frameAt, type FilesState } from "../../src/scenes/sdd-scene-2-files/frame";
import { CAST_SCALE, CAST_X, EMOTES, FOLDER_CENTRE, GO, GROUND, ROUTES, VERDICT_CENTRE, slotCentre } from "../../src/scenes/sdd-scene-2-files/layout";
import { STAGE_LAYERS, balaoParams, chavesParams, stageOf, visorParams } from "../../src/scenes/sdd-scene-2-files/stage";
import { makeTimeline, timeline, type FileId, type FilesTimeline } from "../../src/scenes/sdd-scene-2-files/timeline";
import { textsOf } from "./topology-tree";

const T = 22, F = 10;
const r6 = [0, 1, 2, 3, 4, 5];
const FRAMES = Array.from({ length: 870 }, (_, f) => f);
const STATES: FilesState[] = FRAMES.map((f) => frameAt(f));

// ---------------------------------------------------------------- design §4, transcribed

const BEATS = {
  duration: 870,
  outro: 770,
  ringsFade: [0, 20],
  phases: [
    ["setup", 0, 39, [20, 26]],
    ["init", 40, 89, [20, 44, 47, 50, 53, 86]],
    ["propose", 90, 149, [86, 89, 90, 91, 92, 93, 94, 95, 96, 98, 99, 100, 101]],
    ["list", 150, 209, [103, 106, 108, 109, 110, 111, 112, 113, 116]],
    ["answer", 210, 279, [118, 120]],
    ["review-1", 280, 409, [124, 126, 128, 129, 130, 131], ["findingMark", "noGoStamp"]],
    ["fix-1", 410, 459, [133, 146], ["findingMark"]],
    ["review-2", 460, 559, [133], ["findingMark", "noGoStamp"]],
    ["fix-2", 560, 599, [135, 146], ["findingMark"]],
    ["approve", 600, 669, [34, 124, 148], ["goStamp"]],
    ["apply", 670, 769, [152, 154, 157, 158, 159, 160, 161, 162]],
  ] as const,
  acts: [["chaves", 40, 84], ["visor", 90, 90], ["visor", 202, 202], ["balao", 210, 266], ["balao", 606, 626], ["visor", 676, 676]] as const,
  faces: [["visor", 202, "waiting"], ["balao", 626, "done"], ["visor", 736, "done"]] as const,
  emotes: [["visor", "worked", 736, null]] as const,
  actions: [
    ["chaves", 40, { types: true }], ["chaves", 84, { types: false }], ["visor", 90, { points: true }], ["visor", 202, { points: false }],
    ["balao", 210, { speaks: true }], ["balao", 266, { speaks: false }], ["balao", 606, { holdsStamp: true }], ["balao", 626, { holdsStamp: false }],
    ["visor", 676, { points: true }],
  ] as const,
  trips: [["file-proposal", 96], ["file-design", 102], ["file-tasks", 108], ["file-spec", 114], ["go", 626]] as const,
  pops: { laptop: 2, balao: 4, chaves: 6, visor: 8, folder: 52, noGo1: 364, noGo2: 514 },
  fades: { goGuide: [626, 648] },
  leaves: { folder: 140, noGo1: 410, noGo2: 560 },
  cues: {
    commandLine: [46],
    rows: r6.map((j) => 154 + 8 * j),
    answers: r6.map((k) => 218 + 8 * k),
    findings1: [290, 308, 326, 344],
    fixes1: [428, 434, 440, 446],
    findings2: [470, 494],
    fixes2: [578, 584],
    joltEnds: [302, 320, 338, 356, 482, 506],
    codeLines: r6.map((j) => 682 + 8 * j),
  },
  rows: [
    ...r6.map((j) => ["proposal", j + 1, 154 + 8 * j, "question"]),
    ...r6.map((k) => ["proposal", k + 1, 218 + 8 * k, "answered"]),
    ["spec", 1, 290, "flagged"], ["spec", 2, 308, "flagged"], ["spec", 3, 326, "flagged"], ["tasks", 3, 344, "flagged"],
    ["spec", 1, 428, "checked"], ["spec", 2, 434, "checked"], ["spec", 3, 440, "checked"], ["tasks", 3, 446, "checked"],
    ["spec", 4, 470, "flagged"], ["spec", 5, 494, "flagged"],
    ["spec", 4, 578, "checked"], ["spec", 5, 584, "checked"],
  ] as [FileId, number, number, string][],
};

/** The first difference between a timeline and the transcription, or null. */
const differs = (t: FilesTimeline): string | null => {
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
  for (const [name, frames] of Object.entries(BEATS.cues)) if (!eq(t.cues[name], frames)) return `cue ${name}`;
  if (!eq(Object.keys(t.cues).sort(), [...Object.keys(BEATS.cues), "actions"].sort())) return "cue keys";
  if (!eq(t.cues.actions, [...t.actions].map((a) => a.at))) return "cue actions";
  const rows = [...t.rows].map((r) => [r.file, r.row, r.at, r.to]).sort((a, b) => (a[2] as number) - (b[2] as number));
  if (!eq(rows, [...BEATS.rows].sort((a, b) => a[2] - b[2]))) return "rows";
  // Each phase's events are exactly the change frames of §4.2 inside it.
  const changes = [
    ...Object.values(BEATS.pops), ...Object.values(BEATS.fades).flatMap(([i, o]) => [i, i + F, o, o + F]),
    ...Object.values(BEATS.leaves).flatMap((at) => [at, at + 10]), ...BEATS.trips.flatMap(([, from]) => [from, from + T]),
    ...Object.values(BEATS.cues).flat(), ...BEATS.actions.map((a) => a[1]), ...BEATS.faces.map((f) => f[1]), ...BEATS.emotes.map((e) => e[2]),
    ...BEATS.acts.flatMap((a) => [a[1], a[2]]),
  ];
  for (const p of t.phases) {
    const want = [...new Set(changes.filter((at) => at >= p.from && at <= p.to))].sort((a, b) => a - b);
    if (!eq([...new Set(p.events.map((e) => e.at))].sort((a, b) => a - b), want)) return `events of ${p.id}`;
  }
  return null;
};

describe("SDD files beats and timing", () => {
  test("Files timeline equals the beat table", () => {
    expect(differs(timeline)).toBeNull();
    // Every phase event lies in its phase, and every action and row-change frame is an event of the phase it falls in.
    for (const p of timeline.phases) for (const e of p.events) expect(e.at >= p.from && e.at <= p.to, `${p.id} ${e.id}`).toBe(true);
    for (const at of [...timeline.actions.map((a) => a.at), ...timeline.rows.map((r) => r.at)]) {
      expect(timeline.phases.some((p) => p.events.some((e) => e.at === at)), `frame ${at}`).toBe(true);
    }
  });

  test("Files travel token changed", () => {
    expect(differs(makeTimeline(20))).toBe("trip file-proposal");
    expect(differs(makeTimeline(22, 12))).toBe("fade goGuide");
    // The pin also reads each phase's events: a stray event fails it.
    const stray = { ...timeline, phases: timeline.phases.map((p) => (p.id === "init" ? { ...p, events: [...p.events, { id: "stray", at: 41 }] } : p)) };
    expect(differs(stray)).toBe("events of init");
  });

  test("Files seeking in any order", () => {
    const forward = FRAMES.map((f) => JSON.stringify(frameAt(f)));
    for (const f of [...FRAMES].reverse()) expect(JSON.stringify(frameAt(f))).toBe(forward[f]);
    const shuffled = [...FRAMES].sort((a, b) => ((a * 7919) % 870) - ((b * 7919) % 870));
    for (const f of shuffled) expect(JSON.stringify(frameAt(f))).toBe(forward[f]);
  });
});

// ---------------------------------------------------------------- the cast

describe("SDD files cast", () => {
  test("Files cast in place at every frame", () => {
    for (const s of STATES) {
      const params = [s.balao && balaoParams(s.balao), s.chaves && chavesParams(s.chaves), s.visor && visorParams(s.visor)].filter((p) => p !== null);
      for (const p of params) {
        expect(p.scale).toBe(CAST_SCALE);
        expect(p.y).toBe(GROUND);
        expect(Object.keys(p).some((k) => /fill|colou?r/i.test(k))).toBe(false);
      }
      if (s.balao) expect(balaoParams(s.balao)).toMatchObject({ x: CAST_X.balao, facing: "right" });
      if (s.chaves) expect(chavesParams(s.chaves)).toMatchObject({ x: CAST_X.chaves, facing: "right" });
      if (s.visor) {
        expect(visorParams(s.visor)).toMatchObject({ x: CAST_X.visor, facing: "left" });
        expect(typeof visorParams(s.visor).points).toBe("boolean");
      }
    }
    expect(STATES[8].visor).toBeNull();
    expect(STATES[9].visor).not.toBeNull();
  });

  test("Files emote beside the head", () => {
    expect(STATES[735].emote).toBeNull();
    expect(STATES[736].emote).toMatchObject({ kind: "worked", x: EMOTES.worked.x, y: EMOTES.worked.y, opacity: 1 });
    expect(STATES[800].emote).toEqual({ kind: "worked", ...EMOTES.worked, opacity: 1 });
    expect(STATES.slice(0, 736).every((s) => s.emote === null)).toBe(true);
  });

  test("Every cast change inside an act or a face entry", () => {
    // CAST-4 against what is drawn: an action parameter changes only inside a declared act of its actor, and a
    // face changes only on a `faces` entry.
    const actionOf = (s: FilesState) => ({
      balao: s.balao && { speaks: s.balao.speaks, holdsStamp: s.balao.holdsStamp },
      chaves: s.chaves && { types: s.chaves.types },
      visor: s.visor && { points: s.visor.points },
    });
    for (let f = 1; f < 870; f++) {
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

// ---------------------------------------------------------------- helpers

const words = (f: number) => STAGE_LAYERS.flatMap((name) => textsOf(stageOf(STATES[f])[name]).map((t) => t.text));
const file = (f: number, id: FileId) => STATES[f].files.find((x) => x.id === id);
const rows = (f: number, id: FileId) => file(f, id)?.rows ?? [];
const near = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y) < 1e-6;

// ---------------------------------------------------------------- init and propose

describe("SDD files init and propose", () => {
  test("Init and propose frames", () => {
    expect(STATES[39].folder).toBeNull();
    expect(STATES[39].chaves!.types).toBe(false);
    for (let f = 40; f <= 83; f++) expect(STATES[f].chaves!.types, `frame ${f}`).toBe(true);
    expect(STATES[84].chaves!.types).toBe(false);
    expect(STATES[45].screen.commandLine).toBe(false);
    expect(STATES[46].screen.commandLine).toBe(true);
    expect(STATES[52].folder).toBeNull();
    expect(STATES[53].folder).not.toBeNull();
    expect(STATES[89].visor!.points).toBe(false);
    expect(STATES[90].visor!.points).toBe(true);
    const p96 = file(96, "proposal")!;
    expect(near(p96.centre, FOLDER_CENTRE)).toBe(true);
    expect(p96.scale).toBeCloseTo(0.4);
    const p107 = file(107, "proposal")!, half = pointAlong(ROUTES["file-proposal"], 0.5)!;
    expect(p107.centre.x).toBeCloseTo(half.x);
    expect(p107.centre.y).toBeCloseTo(half.y);
    expect(p107.scale).toBeCloseTo(0.7);
    expect(file(117, "proposal")!.inFlight).toBe(true);
    expect(file(118, "proposal")).toMatchObject({ inFlight: false, scale: 1, centre: slotCentre("proposal") });
    expect(STATES[135].files.filter((x) => !x.inFlight)).toHaveLength(3);
    for (const id of ["proposal", "design", "tasks", "spec"] as const) expect(file(136, id)).toMatchObject({ inFlight: false, scale: 1, centre: slotCentre(id) });
    expect(STATES[139].folder).toEqual({ opacity: 1, scale: 1 });
    expect(STATES[140].folder!.opacity).toBe(1);
    expect(STATES[141].folder!.opacity).toBeLessThan(1);
    expect(STATES[150].folder).toBeNull();
    expect(words(70)).toContain("openspec/");
    // A file's name pill in flight stays inside the stage less 12 (its top is centre.y − 117 × scale; design §4.3).
    // The layout test checks the drawn boxes of every flying name too (design §6.3 item 4).
    for (let f = 96; f < 136; f++) for (const x of STATES[f].files.filter((y) => y.inFlight)) expect(x.centre.y - 117 * x.scale, `${x.id} at ${f}`).toBeGreaterThanOrEqual(12);
  });

  test("No file before propose", () => {
    const names = ["proposal.md", "design.md", "tasks.md", "spec.md"];
    for (let f = 0; f <= 95; f++) {
      expect(STATES[f].files, `frame ${f}`).toEqual([]);
      expect(words(f).some((w) => names.includes(w)), `frame ${f}`).toBe(false);
    }
    expect(words(96)).toContain("proposal.md");
  });
});

// ---------------------------------------------------------------- questions and answers

describe("SDD files questions and answers", () => {
  test("Questions and answers frames", () => {
    for (let f = 118; f <= 153; f++) expect(rows(f, "proposal"), `frame ${f}`).toEqual([]);
    expect(rows(154, "proposal")).toEqual(["question"]);
    expect(rows(194, "proposal")).toEqual(Array(6).fill("question"));
    expect(STATES[201].visor).toMatchObject({ points: true, expression: "idle" });
    expect(STATES[202].visor).toMatchObject({ points: false, expression: "waiting" });
    expect(STATES[209].balao!.speaks).toBe(false);
    for (let f = 210; f <= 265; f++) expect(STATES[f].balao!.speaks, `frame ${f}`).toBe(true);
    expect(STATES[266].balao!.speaks).toBe(false);
    expect(rows(217, "proposal")[0]).toBe("question");
    expect(rows(218, "proposal")).toEqual(["answered", ...Array(5).fill("question")]);
    expect(rows(258, "proposal")).toEqual(Array(6).fill("answered"));
  });

  test("No finding before the review", () => {
    for (let f = 0; f <= 289; f++) {
      for (const x of STATES[f].files) {
        if (x.id !== "proposal") expect(x.rows.every((r) => r === "plain"), `${x.id} at ${f}`).toBe(true);
        expect(x.angle, `${x.id} at ${f}`).toBe(0);
      }
    }
  });
});

// ---------------------------------------------------------------- the reviews

const flagged = (f: number) => STATES[f].files.flatMap((x) => x.rows.flatMap((r, i) => (r === "flagged" ? [`${x.id} ${i + 1}`] : [])));

describe("SDD files review round 1", () => {
  test("Review 1 frames", () => {
    expect(flagged(289)).toEqual([]);
    expect(flagged(290)).toEqual(["spec 1"]);
    expect(file(290, "spec")!.angle).toBe(0);
    expect(file(291, "spec")!.angle).not.toBe(0);
    expect(file(301, "spec")!.angle).not.toBe(0);
    expect(file(302, "spec")!.angle).toBe(0);
    expect(file(345, "tasks")!.angle).not.toBe(0);
    expect(flagged(356)).toEqual(["tasks 3", "spec 1", "spec 2", "spec 3"]);
    expect(STATES[356].files.every((x) => x.angle === 0)).toBe(true);
    expect(STATES[364].noGo).toBeNull();
    expect(STATES[365].noGo!.id).toBe("no-go-1");
    for (let f = 394; f <= 409; f++) expect(STATES[f].noGo, `frame ${f}`).toEqual({ id: "no-go-1", appear: { opacity: 1, scale: 1 } });
    expect(words(394)).toContain("NO-GO");
  });
});

describe("SDD files fix and review round 2", () => {
  test("Fix and review 2 frames", () => {
    expect(STATES[410].noGo!.appear.opacity).toBe(1);
    expect(STATES[411].noGo!.appear.opacity).toBeLessThan(1);
    expect(STATES[420].noGo).toBeNull();
    expect(rows(427, "spec")[0]).toBe("flagged");
    expect(rows(428, "spec")[0]).toBe("checked");
    expect(rows(446, "spec").slice(0, 3)).toEqual(["checked", "checked", "checked"]);
    expect(rows(446, "tasks")[2]).toBe("checked");
    expect(flagged(446)).toEqual([]);
    expect(rows(469, "spec")[3]).toBe("plain");
    expect(rows(470, "spec")[3]).toBe("flagged");
    expect(file(471, "spec")!.angle).not.toBe(0);
    expect(flagged(494)).toEqual(["spec 4", "spec 5"]);
    expect(STATES[514].noGo).toBeNull();
    expect(STATES[515].noGo!.id).toBe("no-go-2");
    expect(STATES[561].noGo!.appear.opacity).toBeLessThan(1);
    expect(STATES[570].noGo).toBeNull();
    expect(rows(584, "spec")).toEqual(Array(5).fill("checked"));
    expect(rows(584, "tasks")).toEqual(["plain", "plain", "checked", "plain"]);
    expect(rows(584, "design")).toEqual(["plain", "plain", "plain"]);
    // No row is flagged twice in the scene: the second review finds rows the first did not (design §2.3).
    const flags = timeline.rows.filter((r) => r.to === "flagged").map((r) => `${r.file} ${r.row}`);
    expect(new Set(flags).size).toBe(flags.length);
    expect(flags).toHaveLength(6);
  });

  test("One NO-GO at a time", () => {
    const shown = (f: number) => STAGE_LAYERS.flatMap((name) => textsOf(stageOf(STATES[f])[name]).filter((t) => t.text === "NO-GO")).length;
    for (let f = 0; f < 870; f++) {
      expect(shown(f), `frame ${f}`).toBeLessThanOrEqual(1);
      const none = f <= 364 || (f >= 420 && f <= 514) || f >= 570;
      if (none) expect(STATES[f].noGo, `frame ${f}`).toBeNull();
    }
  });
});

// ---------------------------------------------------------------- approval

describe("SDD files approval", () => {
  test("Approval frames", () => {
    expect(STATES[605].balao!.holdsStamp).toBe(false);
    for (let f = 606; f <= 625; f++) expect(STATES[f].balao!.holdsStamp, `frame ${f}`).toBe(true);
    expect(words(616)).toContain("GO");
    expect(STATES[626].balao).toMatchObject({ holdsStamp: false, expression: "done" });
    expect(STATES[626].go).toMatchObject({ landed: false, scale: GO.scaleFrom });
    expect(near(STATES[626].go!.centre, GO.from)).toBe(true);
    const half = pointAlong(ROUTES.go, 0.5)!;
    expect(STATES[637].go!.centre.x).toBeCloseTo(half.x);
    expect(STATES[637].go!.centre.y).toBeCloseTo(half.y);
    expect(STATES[647].go!.landed).toBe(false);
    for (let f = 648; f < 870; f++) expect(STATES[f].go, `frame ${f}`).toEqual({ centre: VERDICT_CENTRE, scale: GO.scaleTo, landed: true });
  });

  test("No GO before the owner", () => {
    for (let f = 0; f <= 605; f++) {
      expect(words(f).includes("GO"), `frame ${f}`).toBe(false);
      expect(STATES[f].go, `frame ${f}`).toBeNull();
    }
  });
});

// ---------------------------------------------------------------- apply and final still

describe("SDD files apply and final still", () => {
  test("Apply frames", () => {
    expect(STATES[675].visor!.points).toBe(false);
    expect(STATES[676].visor!.points).toBe(true);
    expect(STATES[681].screen.codeLines).toBe(0);
    expect(STATES[682].screen.codeLines).toBe(1);
    expect(STATES[722].screen.codeLines).toBe(6);
    expect(STATES[735].visor!.expression).toBe("waiting");
    expect(STATES[736].visor!.expression).toBe("done");
    expect(STATES[736].emote!.kind).toBe("worked");
  });

  test("No code before the approval", () => {
    for (let f = 0; f <= 681; f++) expect(STATES[f].screen, `frame ${f}`).toEqual({ commandLine: f >= 46, codeLines: 0 });
  });

  test("Files final hold identical", () => {
    const first = JSON.stringify({ state: STATES[770], stage: stageOf(STATES[770]) });
    for (let f = 771; f < 870; f++) expect(JSON.stringify({ state: STATES[f], stage: stageOf(STATES[f]) }), `frame ${f}`).toBe(first);
  });
});

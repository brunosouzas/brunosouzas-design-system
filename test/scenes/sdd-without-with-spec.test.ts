// The SDD scene's data and frame logic (spec scene-catalogue: "SDD scene
// registration", "SDD beats and timing", "SDD take 1 …", "SDD rewind", "SDD same
// stage in both takes", "SDD take 2 …", "SDD final still", "SDD cast rules";
// change sdd-without-with-spec-scene, tasks 4.1 and 4.2). The beat table of
// design §4 is transcribed here by hand, frame by frame, so a change of the
// timeline or of `motion.travel` fails instead of silently retiming the scene.
import { describe, expect, test } from "vitest";
import { compositionsOf } from "../../src/scenes/catalogue";
import { findScene } from "../../src/scenes";
import { sddWithoutWithSpec as scene } from "../../src/scenes/sdd-without-with-spec/scene.ts";
import { frameAt, objectFrame, SETTLE, type SddState } from "../../src/scenes/sdd-without-with-spec/takes";
import { makeTimeline, timeline } from "../../src/scenes/sdd-without-with-spec/timeline";
import { pointAlong } from "../../src/brand/motion";
import { ROUTES, slotAt, ANSWER_START } from "../../src/scenes/sdd-without-with-spec/layout";
import type { TakesTimeline } from "../../src/scenes/takes-kind";
import { tokens } from "../../tokens/generated/tokens";

const FRAMES = Array.from({ length: 780 }, (_, f) => f);
const at = (f: number) => frameAt(f);
const i6 = [0, 1, 2, 3, 4, 5];

// ---------------------------------------------------------------- the beat table (design §4), by hand

const BEATS = {
  duration: 780,
  outro: 690,
  ringsFade: [0, 20],
  phases: [
    ["request", 1, 24, 89, [20, 22, 24, 108, 109, 110, 111, 112, 113]],
    ["guess", 1, 90, 239, [26, 80]],
    ["error", 1, 240, 309, [122, 26]],
    ["rewind", "rewind", 340, 377, [22]],
    ["ask", 2, 390, 509, [32, 72, 82, 98, 103, 106, 107, 108, 109, 110, 111, 112, 113, 116]],
    ["answer", 2, 510, 599, [120, 148, 34]],
    ["implement", 2, 600, 689, [32, 152, 34, 169]],
  ],
  rewind: { from: 344, to: 377, objects: [339, 89] },
  acts: [[90, 90], [344, 344], [390, 480], [600, 600]],
  faces: [[270, "failed"], [344, "idle"], [504, "waiting"], [600, "idle"], [660, "done"]],
  emotes: [["problem", 270, 320], ["worked", 660, null]],
  // id, from, to: the `?` of slot 5 leaves first in take 1; slot 0 first in take 2.
  trips: [
    ["guess-0", 172, 194], ["guess-1", 160, 182], ["guess-2", 148, 170], ["guess-3", 136, 158], ["guess-4", 124, 146], ["guess-5", 112, 134],
    ["ask-0", 404, 426], ["ask-1", 414, 436], ["ask-2", 424, 446], ["ask-3", 434, 456], ["ask-4", 444, 466], ["ask-5", 454, 476],
    ["handover", 480, 502],
    ["answer-0", 512, 534], ["answer-1", 520, 542], ["answer-2", 528, 550], ["answer-3", 536, 558], ["answer-4", 544, 566], ["answer-5", 552, 574],
  ],
  pops: { codePanel: 6, visor: 12, badge1: 18, balloon: 24, "slot-0": 30, "slot-1": 34, "slot-2": 38, "slot-3": 42, "slot-4": 46, "slot-5": 50, rewindMark: 340, badge2: 378, stamp: 584 },
  fades: { p1: [[90, 100], [220, 230]], failureArrow: [[240, 250]], p2: [[394, 404], [480, 490]], p3: [[600, 610]] },
  leaves: { rewindMark: 400 },
  cues: {
    take1Lines: [134, 146, 158, 170, 182, 194, 202, 210],
    rows: [426, 436, 446, 456, 466, 476],
    checks: [534, 542, 550, 558, 566, 574],
    take2Lines: [616, 621, 626, 631, 636, 641, 646, 651],
    handOver: [480],
    badgeSwap: [378],
  },
} as const;

/** The first difference between a timeline and the table, or null. Trips first, by id, so a travel change names its trip. */
const firstDifference = (t: TakesTimeline): string | null => {
  for (const [id, from, to] of BEATS.trips) {
    const trip = t.trips.find((candidate) => candidate.id === id);
    if (!trip || trip.from !== from || trip.to !== to) return `trip ${id}: expected ${from}–${to}, found ${trip ? `${trip.from}–${trip.to}` : "none"}`;
  }
  const table = {
    duration: BEATS.duration, outro: BEATS.outro, ringsFade: BEATS.ringsFade,
    phases: BEATS.phases.map(([id, take, from, to, cites]) => ({ id, take, from, to, cites })),
    rewind: BEATS.rewind,
    acts: BEATS.acts.map(([from, to]) => ({ actor: "visor", from, to })),
    faces: BEATS.faces.map(([frame, expression]) => ({ actor: "visor", at: frame, expression })),
    emotes: BEATS.emotes.map(([kind, frame, leaveAt]) => ({ actor: "visor", kind, at: frame, leaveAt })),
    pops: BEATS.pops,
    fades: Object.fromEntries(Object.entries(BEATS.fades).map(([k, [fadeIn, fadeOut]]) => [k, fadeOut ? { in: fadeIn, out: fadeOut } : { in: fadeIn }])),
    leaves: BEATS.leaves,
    cues: BEATS.cues,
    trips: BEATS.trips.length,
  };
  const actual = {
    duration: t.duration, outro: t.outro, ringsFade: t.ringsFade,
    phases: t.phases.map(({ id, take, from, to, cites }) => ({ id, take, from, to, cites })),
    rewind: t.rewind, acts: t.acts, faces: t.faces, emotes: t.emotes, pops: t.pops, fades: t.fades, leaves: t.leaves, cues: t.cues,
    trips: t.trips.length,
  };
  for (const key of Object.keys(table) as (keyof typeof table)[]) {
    if (JSON.stringify(table[key]) !== JSON.stringify(actual[key])) return `${key}: expected ${JSON.stringify(table[key])}, found ${JSON.stringify(actual[key])}`;
  }
  return null;
};

describe("SDD scene registration", () => {
  test("Registered entry", () => {
    expect(findScene("sdd-without-with-spec")).toBe(scene);
    expect(scene).toMatchObject({
      id: "sdd-without-with-spec", kind: "takes", neutral: true, formats: ["16x9"], languages: ["en"],
      sources: { en: "https://brunosouzas.com/blog/spec-driven-development-in-practice", pt: "https://brunosouzas.com/pt/blog/spec-driven-development-in-practice" },
      text: { en: { file: "proposal.md", approval: "GO", question: "?", takes: ["1", "2"] } },
    });
    expect(scene.timeline.duration).toBe(780);
    expect(scene.timeline.outro).toBe(690);
    expect(compositionsOf(scene)[0].fps).toBe(30);
  });

  test("No 4:5 and no second language", () => {
    expect(scene.formats).toEqual(["16x9"]);
    expect(scene.languages).toEqual(["en"]);
    for (const { id } of compositionsOf(scene)) expect(id).not.toMatch(/-(4x5|pt|en)$/);
  });
});

describe("SDD beats and timing", () => {
  test("Timeline equals the beat table", () => {
    expect(tokens.motion.travel).toBe(22);
    expect(firstDifference(timeline)).toBeNull();
    expect(timeline.phases.map((p) => `${p.id} ${p.from}–${p.to}`)).toEqual([
      "request 24–89", "guess 90–239", "error 240–309", "rewind 340–377", "ask 390–509", "answer 510–599", "implement 600–689",
    ]);
  });

  test("Travel token changed", () => {
    expect(firstDifference(makeTimeline(20))).toBe("trip guess-0: expected 172–194, found 172–192");
  });

  test("Seeking in any order", () => {
    const forward = FRAMES.map((f) => JSON.stringify(at(f)));
    const backward = [...FRAMES].reverse().map((f) => [f, JSON.stringify(at(f))] as const);
    for (const [f, state] of backward) expect(state, `frame ${f}`).toBe(forward[f]);
    // A fixed shuffle (a linear congruential order), so the test is reproducible.
    const shuffled = FRAMES.map((f) => (f * 557 + 13) % 780);
    expect(new Set(shuffled).size).toBe(780);
    for (const f of shuffled) expect(JSON.stringify(at(f)), `frame ${f}`).toBe(forward[f]);
  });
});

// ---------------------------------------------------------------- take 1

const question = (s: SddState, id: string) => s.questions.find((q) => q.id === id);

describe("SDD take 1, the questions sink into the code", () => {
  test("Request before the agent acts", () => {
    const s = at(89);
    expect(s.slots.every((slot) => slot !== null)).toBe(true);
    expect(s.codePanel?.lines).toBe(0);
    expect(s.visor).toMatchObject({ expression: "idle", points: false, held: null });
    expect(s.page).toBeNull();
  });

  test("First question in flight and arriving", () => {
    expect(at(111).slots[5]).not.toBeNull();
    expect(question(at(111), "guess-5")).toBeUndefined();
    expect(at(112).slots[5]).toBeNull();
    expect(question(at(112), "guess-5")?.point).toEqual(slotAt(5));
    expect(question(at(123), "guess-5")?.point).toEqual(pointAlong(ROUTES["guess-5"], 0.5));
    expect(question(at(134), "guess-5")).toBeUndefined();
    expect(at(133).codePanel?.lines).toBe(0);
    expect(at(134).codePanel?.lines).toBe(1);
    expect(at(171).slots[0]).not.toBeNull();
    expect(at(172).slots[0]).toBeNull();
    expect(question(at(172), "guess-0")?.progress).toBe(0);
  });

  test("Take 1 complete", () => {
    expect(at(209).codePanel?.lines).toBe(7);
    expect(at(210).codePanel?.lines).toBe(8);
    expect(at(239).codePanel?.lines).toBe(8);
    expect(at(239).slots.every((slot) => slot === null)).toBe(true);
    expect(at(239).questions).toEqual([]);
    expect(at(239).paths.p1).toBe(0);
    for (const s of [at(89), at(239)]) {
      expect(s.page).toBeNull();
      expect(s.answers).toEqual([]);
      expect(s.stamp).toBeNull();
    }
  });
});

describe("SDD take 1, the error comes back", () => {
  test("Arrow boundaries", () => {
    expect(at(239).failureArrow).toBe(0);
    expect(at(240).failureArrow).toBe(0);
    expect(at(245).failureArrow).toBe(0.5);
    expect(at(250).failureArrow).toBe(1);
  });

  test("Fright frames", () => {
    expect(at(269).visor).toMatchObject({ expression: "idle", tilt: 0, squash: 1 });
    expect(at(269).emote).toBeNull();
    expect(at(270).visor).toMatchObject({ expression: "failed", tilt: -5 });
    expect(at(270).emote).toBeNull();
    expect(at(271).emote?.kind).toBe("problem");
    expect(at(329).emote?.kind).toBe("problem");
    expect(at(329).emote!.opacity).toBeGreaterThan(0);
    expect(at(330).emote).toBeNull();
    expect(at(330).visor?.expression).toBe("failed");
  });
});

// ---------------------------------------------------------------- rewind

/** The objects of a state: what the rewind plays backwards. */
const objects = (s: SddState) => ({ slots: s.slots, questions: s.questions, lines: s.codePanel?.lines, p1: s.paths.p1, arrow: s.failureArrow });

describe("SDD rewind", () => {
  test("Object frame", () => {
    expect([343, 344, 360, 377, 378, 389].map((f) => objectFrame(f))).toEqual([343, 339, 218, 89, 89, 89]);
  });

  test("Rewind ends on the request", () => {
    const s = at(377);
    expect(objects(s)).toEqual(objects(at(89)));
    expect(s.visor).toMatchObject({ expression: "idle", points: false });
    expect(s.badge?.text).toBe("1");
    expect(s.rewindMark).not.toBeNull();
  });

  test("The fright is not replayed", () => {
    for (let f = 344; f <= 389; f++) {
      expect(at(f).visor, `frame ${f}`).toMatchObject({ expression: "idle", tilt: 0, squash: 1, points: false });
      expect(at(f).emote, `frame ${f}`).toBeNull();
    }
  });

  test("Take-1 objects gone in take 2", () => {
    for (let f = 390; f < 780; f++) {
      const s = at(f);
      expect(s.failureArrow, `frame ${f}`).toBe(0);
      expect(s.paths.p1, `frame ${f}`).toBe(0);
      expect(s.codePanel?.lines, `frame ${f}`).toBe(f < 616 ? 0 : Math.min(8, Math.floor((f - 616) / 5) + 1));
    }
  });
});

describe("SDD same stage in both takes", () => {
  test("Fair comparison", () => {
    const strip = ({ badge: _b, rewindMark: _r, ...rest }: SddState) => rest;
    expect(strip(at(389))).toEqual(strip(at(89)));
    expect(at(389).rewindMark).not.toBeNull();
    expect(at(389).badge?.text).toBe("2");
  });

  test("Settled pop-ins", () => {
    type Read = (s: SddState) => { opacity: number; scale: number } | null;
    const elements: [string, number, Read][] = [
      ["codePanel", 6, (s) => s.codePanel?.appear ?? null],
      ["visor", 12, (s) => s.visor?.appear ?? null],
      ["badge 1", 18, (s) => (s.badge?.text === "1" ? s.badge.appear : null)],
      ["balloon", 24, (s) => s.balloon],
      ...i6.map((i): [string, number, Read] => [`slot ${i}`, 30 + 4 * i, (s) => s.slots[i]]),
      ["rewind mark", 340, (s) => s.rewindMark],
      ["badge 2", 378, (s) => (s.badge?.text === "2" ? s.badge.appear : null)],
      ["stamp", 584, (s) => s.stamp],
      ["emote problem", 270, (s) => (s.emote?.kind === "problem" ? { opacity: s.emote.opacity, scale: s.emote.scale / 0.8 } : null)],
      ["emote worked", 660, (s) => (s.emote?.kind === "worked" ? { opacity: s.emote.opacity, scale: s.emote.scale / 0.72 } : null)],
    ];
    for (const [name, a, read] of elements) {
      if (name !== "badge 2") expect(read(at(a - 1)), `${name} at ${a - 1}`).toBeNull();
      else expect(at(a - 1).badge?.text).toBe("1");
      expect(read(at(a)), `${name} at ${a}`).toBeNull();
      expect(read(at(a + 1)), `${name} at ${a + 1}`).not.toBeNull();
      const settled = read(at(a + SETTLE));
      expect(settled?.opacity, `${name} at ${a + 30}`).toBe(1);
      expect(settled?.scale, `${name} at ${a + 30}`).toBeCloseTo(1, 12);
    }
  });
});

// ---------------------------------------------------------------- take 2

describe("SDD take 2, the questions written down", () => {
  test("Sheet appears with its heading", () => {
    expect(at(389).visor?.held).toBeNull();
    expect(at(390).visor?.held).toEqual({ questions: 0 });
  });

  test("Questions become rows", () => {
    const s425 = at(425), s426 = at(426), s476 = at(476);
    expect(s425.slots.map((slot) => slot !== null)).toEqual([false, false, false, true, true, true]);
    expect(s425.questions.map((q) => q.id)).toEqual(["ask-0", "ask-1", "ask-2"]);
    expect(1 + s425.visor!.held!.questions).toBe(1);
    expect(1 + s426.visor!.held!.questions).toBe(2);
    expect(s426.questions).toHaveLength(2);
    expect(s476.slots.every((slot) => slot === null)).toBe(true);
    expect(s476.questions).toEqual([]);
    expect(1 + s476.visor!.held!.questions).toBe(7);
    expect(s476.page).toBeNull();
  });

  test("Visor waits", () => {
    expect(at(503).visor?.expression).toBe("idle");
    expect(at(504).visor?.expression).toBe("waiting");
    expect(at(504).emote).toBeNull();
  });
});

describe("SDD take 2, answered and approved", () => {
  test("First answer", () => {
    expect(at(511).answers).toEqual([]);
    expect(at(512).answers).toEqual([{ id: "answer-0", point: ANSWER_START, progress: 0 }]);
    expect(at(512).balloon).not.toBeNull();
    expect(at(534).answers.find((a) => a.id === "answer-0")).toBeUndefined();
    expect(at(533).page?.checked).toBe(0);
    expect(at(534).page?.checked).toBe(1);
  });

  test("All answered, then GO", () => {
    expect(at(574).page?.checked).toBe(6);
    expect(at(574).stamp).toBeNull();
    expect(at(584).stamp).toBeNull();
    expect(at(585).stamp).not.toBeNull();
  });
});

describe("SDD take 2, implemented from the sheet", () => {
  test("Implementation frames", () => {
    expect(at(599).visor).toMatchObject({ expression: "waiting", points: false });
    expect(at(599).codePanel?.lines).toBe(0);
    expect(at(600).visor).toMatchObject({ expression: "idle", points: true });
    expect(at(615).codePanel?.lines).toBe(0);
    expect(at(616).codePanel?.lines).toBe(1);
    expect(at(651).codePanel?.lines).toBe(8);
    expect(at(660).visor?.expression).toBe("done");
    expect(at(660).emote).toBeNull();
    expect(at(661).emote?.kind).toBe("worked");
  });
});

describe("SDD final still", () => {
  test("Last movement before the hold", () => {
    expect(at(689).emote!.scale).not.toBe(0.72);
    expect(at(690).emote!.scale).toBe(0.72);
  });
});

describe("SDD cast rules", () => {
  test("Expression changes only at face frames", () => {
    for (let f = 1; f < 780; f++) {
      if (at(f).visor?.expression !== at(f - 1).visor?.expression && at(f - 1).visor) expect([270, 344, 504, 600, 660], `frame ${f}`).toContain(f);
    }
  });

  test("Actions only inside acts", () => {
    const inAct = (f: number) => timeline.acts.some((act) => f >= act.from && f <= act.to);
    for (let f = 1; f < 780; f++) {
      const before = at(f - 1).visor, now = at(f).visor;
      if (!before || !now) continue;
      if (before.points !== now.points || JSON.stringify(before.held) !== JSON.stringify(now.held)) expect(inAct(f), `frame ${f}`).toBe(true);
    }
  });
});

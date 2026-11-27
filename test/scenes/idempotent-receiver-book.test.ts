// The Idempotent Receiver book scene's timeline and frame logic (spec
// scene-catalogue, "Idempotent Receiver book beats and timing", "... take 1",
// "... rewind", "... take 2 deliveries", "... duplicate ignored", "... final
// still"; change idempotent-receiver-book-scene, tasks 2.2 and 3.2). The beat
// table of design §4 is transcribed here by hand, independently of
// src/scenes/idempotent-receiver-book/timeline.ts, so a retiming of the scene
// or of the motion tokens fails here first.
import { describe, expect, test } from "vitest";
import { frameAt, objectFrame, type BookState } from "../../src/scenes/idempotent-receiver-book/frame";
import { AT, ROUTES } from "../../src/scenes/idempotent-receiver-book/layout";
import { STAGE_LAYERS, stageOf } from "../../src/scenes/idempotent-receiver-book/stage";
import { makeTimeline, timeline, type BookTimeline } from "../../src/scenes/idempotent-receiver-book/timeline";
import { pointAlong } from "../../src/brand/motion";

const T = 22, F = 10, D = 280;
const FRAMES = Array.from({ length: 780 }, (_, f) => f);
const STATES: BookState[] = FRAMES.map((f) => frameAt(f));

// ---------------------------------------------------------------- design §4, transcribed

const BEATS = {
  duration: 780,
  outro: 680,
  ringsFade: [0, 20],
  rewind: { from: 260, to: 309, objects: [259, 39] },
  phases: [
    ["setup", 1, 0, 39, [28, 32], ["takeNumbers"]],
    ["t1-send", 1, 40, 99, [28, 32]],
    ["t1-lookup", 1, 100, 159, [28, 32], ["lookupMark"]],
    ["t1-process", 1, 160, 219, [28, 32]],
    ["t1-hold", 1, 220, 259, [28]],
    ["rewind", "rewind", 260, 319, [28], ["rewind", "takeNumbers"]],
    ["t2-send", 2, 320, 379, [28, 32]],
    ["t2-lookup", 2, 380, 439, [28, 32], ["lookupMark"]],
    ["t2-process", 2, 440, 499, [28, 32]],
    ["t2-deliver", 2, 500, 539, [28, 32]],
    ["t2-match", 2, 540, 589, [28, 32]],
    ["t2-ignore", 2, 590, 639, [28, 32]],
    ["t2-compare", 2, 640, 679, [28], ["ghost"]],
  ],
  trips: [
    ["send-t1", "send", 46], ["deliver-t1", "deliver", 76], ["process-t1", "process", 166],
    ["send-t2", "send", 326], ["deliver-t2", "deliver", 356], ["process-t2", "process", 446],
    ["deliver2-t2", "deliver", 500], ["ignore-t2", "ignore", 596],
  ],
  pops: {
    sender: 1, channel: 3, receiver: 5, store: 7, badge1: 9,
    "message-t1": 40, "question-t1": 104, "stored-t1": 160, "check-t1": 188,
    rewindMark: 260,
    "message-t2": 320, copy: 367, "question-t2": 384, "stored-t2": 440, "check-t2": 468,
  },
  fades: {
    "p1-t1": { in: [40, 50], out: [98, 108] },
    "p2-t1": { in: [160, 170], out: [188, 198] },
    "p1-t2": { in: [320, 330], out: [522, 532] },
    "p2-t2": { in: [440, 450], out: [468, 478] },
    "p3-t2": { in: [590, 600], out: [618, 628] },
    ghost: { in: [640, 650] },
  },
  leaves: { "question-t1": 140, "question-t2": 420, rewindMark: 320 },
  cues: { lookupOn: [100, 380, 540], lookupOff: [150, 430, 580], processed: [160, 440], ignored: [590], badgeSwap: [310] },
} as const;

/** The first difference between the beat table and a timeline, as a path, or null. */
const firstDifference = (t: BookTimeline): string | null => {
  const check = (path: string, a: unknown, b: unknown) => (JSON.stringify(a) === JSON.stringify(b) ? null : `${path}: expected ${JSON.stringify(b)}, found ${JSON.stringify(a)}`);
  for (const [i, [id, take, from, to, cites, devices]] of BEATS.phases.entries()) {
    const p = t.phases[i];
    const d = check(`phase ${id}`, [p?.id, p?.take, p?.from, p?.to, p?.cites, p?.devices], [id, take, from, to, cites, devices]);
    if (d) return d;
  }
  for (const [i, [id, route, from]] of BEATS.trips.entries()) {
    const d = check(`trip ${id}`, t.trips[i], { id, route, from, to: from + T });
    if (d) return d;
  }
  return check("duration", t.duration, BEATS.duration) ?? check("outro", t.outro, BEATS.outro) ?? check("ringsFade", t.ringsFade, BEATS.ringsFade)
    ?? check("rewind", t.rewind, BEATS.rewind) ?? check("pops", t.pops, BEATS.pops) ?? check("fades", t.fades, BEATS.fades)
    ?? check("leaves", t.leaves, BEATS.leaves) ?? check("cues", t.cues, BEATS.cues)
    ?? check("cast", [t.acts, t.faces, t.emotes], [[], [], []]);
};

describe("Idempotent Receiver book beats and timing", () => {
  test("Timeline equals the beat table", () => {
    expect(firstDifference(timeline)).toBeNull();
    expect(timeline.trips.length).toBe(BEATS.trips.length);
    expect(timeline.phases.length).toBe(BEATS.phases.length);
    expect(makeTimeline(T, F)).toEqual(timeline);
  });

  test("Travel token changed", () => {
    expect(firstDifference(makeTimeline(20, F))).toBe('trip send-t1: expected {"id":"send-t1","route":"send","from":46,"to":68}, found {"id":"send-t1","route":"send","from":46,"to":66}');
  });

  test("Seeking in any order", () => {
    const backward = [...FRAMES].reverse().map((f) => [f, frameAt(f)] as const);
    for (const [f, s] of backward) expect(s, `frame ${f}`).toEqual(STATES[f]);
    const shuffled = [...FRAMES].sort((a, b) => ((a * 7919) % 780) - ((b * 7919) % 780));
    for (const f of shuffled) expect(frameAt(f), `frame ${f}`).toEqual(STATES[f]);
  });

  test("Take 2 repeats take 1 by 280 frames", () => {
    expect(D).toBe(280);
    // From the send to the end of the processing the stage of f + 280 is the stage of f, but for the badge,
    // the copy of take 2 (it pops at 367) and the paths that take 2 keeps longer (P1 until the second delivery).
    const strip = (s: BookState) => ({ ...s, objectFrame: 0, take: 0, badge: null, rewindMark: null, messages: s.messages.filter((m) => m.id === "message"), paths: { ...s.paths, p1: 0 } });
    // Everything has settled by 39.
    for (let f = 40; f <= 219; f++) expect(strip(frameAt(f + D)), `frame ${f}`).toEqual(strip(STATES[f]));
  });
});

describe("Idempotent Receiver book take 1", () => {
  const msg = (s: BookState) => s.messages.find((m) => m.id === "message");
  test("One delivery, looked up, processed and stored", () => {
    expect(msg(STATES[40])).toBeUndefined();
    expect(msg(STATES[45])!.point).toEqual(AT.sender);
    expect(msg(STATES[70])!.point).toEqual(AT.channel);
    expect(msg(STATES[99])!.point).toEqual(AT.door);
    expect(STATES[99].lookup).toBe(false);
    expect(STATES[100].lookup).toBe(true);
    expect(STATES[104].question).toBeNull();
    expect(STATES[134].question).toEqual({ opacity: 1, scale: 1 });
    expect(STATES[149].lookup).toBe(true);
    expect(STATES[150].question).toBeNull();
    expect(STATES[150].lookup).toBe(false);
    expect(STATES[159].stored).toBeNull();
    expect(msg(STATES[159])!.fill).toBe("white");
    expect(msg(STATES[160])!.fill).toBe("healthy");
    expect(STATES[161].stored).not.toBeNull();
    expect(msg(STATES[177])!.point).toEqual(pointAlong(ROUTES.process, 11 / 22));
    expect(msg(STATES[188])!.point).toEqual(AT.processed);
    expect(STATES[188].check).toBeNull();
    expect(STATES[189].check).not.toBeNull();
    expect(STATES[218].check).toEqual({ opacity: 1, scale: 1 });
    for (const f of FRAMES.slice(0, 260)) expect(STATES[f].messages.some((m) => m.id === "copy"), `frame ${f}`).toBe(false);
  });
});

describe("Idempotent Receiver book rewind", () => {
  test("Object frames", () => {
    expect([259, 260, 285, 309, 315].map((f) => objectFrame(f))).toEqual([259, 259, 147, 39, 39]);
  });

  test("Same stage before each take", () => {
    const without = (f: number) => { const st = stageOf(STATES[f]); return STAGE_LAYERS.filter((l) => l !== "above").map((l) => st[l]); };
    expect(without(319)).toEqual(without(39));
    expect(without(320)).toEqual(without(39));
  });

  test("Badge and mark", () => {
    expect(STATES[309].badge!.take).toBe(1);
    expect(STATES[310].badge!.take).toBe(2);
    expect(STATES[259].rewindMark).toBeNull();
    expect(STATES[261].rewindMark).not.toBeNull();
    expect(STATES[330].rewindMark).toBeNull();
  });
});

describe("Idempotent Receiver book take 2 deliveries", () => {
  const copy = (s: BookState) => s.messages.find((m) => m.id === "copy");
  test("Sent once, delivered twice", () => {
    expect(copy(STATES[367])).toBeUndefined();
    expect(copy(STATES[368])!.point).toEqual(AT.channel);
    // The first delivery is on its way when the copy appears, so the two never sit on one point.
    expect(STATES[368].messages.find((m) => m.id === "message")!.point.x).toBeGreaterThan(AT.channel.x + 84);
    for (const f of FRAMES.slice(368, 500)) expect(copy(STATES[f])!.point, `frame ${f}`).toEqual(AT.channel);
    expect(copy(STATES[522])!.point).toEqual(AT.door);
  });
});

describe("Idempotent Receiver book duplicate ignored", () => {
  const copy = (s: BookState) => s.messages.find((m) => m.id === "copy")!;
  test("Found and set aside", () => {
    expect(STATES[539].lookup).toBe(false);
    expect(STATES[540].lookup).toBe(true);
    expect(STATES[540].stored).toEqual({ opacity: 1, scale: 1 });
    // No question at the match: the receiver finds 42 in the store.
    for (const f of FRAMES.slice(500, 680)) expect(STATES[f].question, `frame ${f}`).toBeNull();
    expect(STATES[580].lookup).toBe(false);
    expect(copy(STATES[589]).fill).toBe("white");
    expect(copy(STATES[590]).fill).toBe("blocked");
    expect(copy(STATES[618]).point).toEqual(AT.ignored);
    // The effect stays one processed message and one check.
    for (const f of FRAMES.slice(469, 780)) {
      expect(STATES[f].messages.filter((m) => m.fill === "healthy").length, `frame ${f}`).toBe(1);
      expect(STATES[f].check, `frame ${f}`).not.toBeNull();
    }
  });
});

describe("Idempotent Receiver book final still", () => {
  test("Take 1's result faded beside take 2's", () => {
    expect(STATES[639].ghost).toBe(0);
    expect(STATES[645].ghost).toBeCloseTo(0.5);
    expect(STATES[650].ghost).toBe(1);
  });

  test("Final hold identical", () => {
    const still = stageOf(STATES[680]);
    for (const f of FRAMES.slice(680)) {
      expect(STATES[f], `frame ${f}`).toEqual(STATES[680]);
      expect(stageOf(STATES[f]), `frame ${f}`).toEqual(still);
    }
  });
});

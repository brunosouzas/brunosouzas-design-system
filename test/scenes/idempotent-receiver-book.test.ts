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

const T = 22, F = 10, D = 340;
const FRAMES = Array.from({ length: 900 }, (_, f) => f);
const STATES: BookState[] = FRAMES.map((f) => frameAt(f));

// ---------------------------------------------------------------- design §4, transcribed

const BEATS = {
  duration: 900,
  outro: 800,
  ringsFade: [0, 20],
  rewind: { from: 320, to: 369, objects: [319, 39] },
  phases: [
    ["setup", 1, 0, 39, [28, 32], ["takeNumbers"]],
    ["t1-send", 1, 40, 119, [28, 32]],
    ["t1-lookup", 1, 120, 179, [28, 32], ["lookupMark"]],
    ["t1-process", 1, 180, 239, [28, 32]],
    ["t1-hold", 1, 240, 319, [28]],
    ["rewind", "rewind", 320, 379, [28], ["rewind", "takeNumbers"]],
    ["t2-send", 2, 380, 459, [28, 32]],
    ["t2-lookup", 2, 460, 519, [28, 32], ["lookupMark"]],
    ["t2-process", 2, 520, 579, [28, 32]],
    ["t2-deliver", 2, 580, 619, [28, 32]],
    ["t2-match", 2, 620, 679, [28, 32], ["matchFocus"]],
    ["t2-ignore", 2, 680, 739, [28, 32]],
    ["t2-compare", 2, 740, 799, [28], ["ghost"]],
  ],
  trips: [
    ["send-t1", "send", 46], ["deliver-t1", "deliver", 76], ["process-t1", "process", 186],
    ["send-t2", "send", 386], ["deliver-t2", "deliver", 416], ["process-t2", "process", 526],
    ["deliver2-t2", "deliver", 580], ["ignore-t2", "ignore", 686],
  ],
  pops: {
    sender: 1, channel: 3, receiver: 5, store: 7, badge1: 9,
    "message-t1": 40, "question-t1": 124, "stored-t1": 180, "check-t1": 208,
    rewindMark: 320,
    "message-t2": 380, copy: 427, "question-t2": 464, "stored-t2": 520, "check-t2": 548,
  },
  fades: {
    "p1-t1": { in: [40, 50], out: [98, 108] },
    "p2-t1": { in: [180, 190], out: [208, 218] },
    "p1-t2": { in: [380, 390], out: [602, 612] },
    "p2-t2": { in: [520, 530], out: [548, 558] },
    "p3-t2": { in: [680, 690], out: [708, 718] },
    ghost: { in: [740, 750] },
  },
  leaves: { "question-t1": 160, "question-t2": 500, rewindMark: 380 },
  cues: { lookupOn: [120, 460, 620], lookupOff: [170, 510, 670], processed: [180, 520], ignored: [680], badgeSwap: [370], focus: [625, 665] },
  focus: { on: 625, off: 665 },
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
    ?? check("leaves", t.leaves, BEATS.leaves) ?? check("cues", t.cues, BEATS.cues) ?? check("focus", t.focus, BEATS.focus)
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
    const shuffled = [...FRAMES].sort((a, b) => ((a * 7919) % 900) - ((b * 7919) % 900));
    for (const f of shuffled) expect(frameAt(f), `frame ${f}`).toEqual(STATES[f]);
  });

  test("Take 2 repeats take 1 by 340 frames", () => {
    expect(D).toBe(340);
    // From the send to the end of the processing the stage of f + 340 is the stage of f, but for the take, the object
    // frame, the badge, the rewind mark, the copy of take 2 (it pops at 427) and guide P1 (take 2 keeps it until the
    // second delivery). Everything has settled by 39.
    const strip = (s: BookState) => ({ ...s, objectFrame: 0, take: 0, badge: null, rewindMark: null, messages: s.messages.filter((m) => m.id === "message"), paths: { ...s.paths, p1: 0 } });
    for (let f = 40; f <= 239; f++) expect(strip(frameAt(f + D)), `frame ${f}`).toEqual(strip(STATES[f]));
  });
});

describe("Idempotent Receiver book take 1", () => {
  const msg = (s: BookState) => s.messages.find((m) => m.id === "message");
  test("One delivery, looked up, processed and stored", () => {
    expect(msg(STATES[40])).toBeUndefined();
    expect(msg(STATES[45])!.point).toEqual(AT.sender);
    expect(msg(STATES[70])!.point).toEqual(AT.channel);
    expect(msg(STATES[99])!.point).toEqual(AT.door);
    expect(STATES[119].lookup).toBe(false);
    expect(STATES[120].lookup).toBe(true);
    expect(STATES[124].question).toBeNull();
    expect(STATES[154].question).toEqual({ opacity: 1, scale: 1 });
    for (const f of FRAMES.slice(120, 170)) expect(STATES[f].lookup, `frame ${f}`).toBe(true);
    expect(STATES[170].question).toBeNull();
    expect(STATES[170].lookup).toBe(false);
    expect(STATES[179].stored).toBeNull();
    expect(msg(STATES[179])!.fill).toBe("white");
    expect(msg(STATES[180])!.fill).toBe("healthy");
    expect(STATES[181].stored).not.toBeNull();
    expect(msg(STATES[197])!.point).toEqual(pointAlong(ROUTES.process, 11 / 22));
    expect(msg(STATES[208])!.point).toEqual(AT.processed);
    expect(STATES[208].check).toBeNull();
    expect(STATES[209].check).not.toBeNull();
    expect(STATES[238].check).toEqual({ opacity: 1, scale: 1 });
    for (const f of FRAMES.slice(0, 320)) expect(STATES[f].messages.some((m) => m.id === "copy"), `frame ${f}`).toBe(false);
  });
});

describe("Idempotent Receiver book rewind", () => {
  test("Object frames", () => {
    expect([319, 320, 345, 369, 375].map((f) => objectFrame(f))).toEqual([319, 319, 176, 39, 39]);
  });

  test("Same stage before each take", () => {
    const without = (f: number) => { const st = stageOf(STATES[f]); return STAGE_LAYERS.filter((l) => l !== "above").map((l) => st[l]); };
    expect(without(379)).toEqual(without(39));
    expect(without(380)).toEqual(without(39));
  });

  test("Badge and mark", () => {
    expect(STATES[369].badge!.take).toBe(1);
    expect(STATES[370].badge!.take).toBe(2);
    expect(STATES[319].rewindMark).toBeNull();
    expect(STATES[321].rewindMark).not.toBeNull();
    expect(STATES[390].rewindMark).toBeNull();
  });
});

describe("Idempotent Receiver book take 2 deliveries", () => {
  const copy = (s: BookState) => s.messages.find((m) => m.id === "copy");
  test("Sent once, delivered twice", () => {
    expect(copy(STATES[427])).toBeUndefined();
    expect(copy(STATES[428])!.point).toEqual(AT.channel);
    // The first delivery is on its way when the copy appears, so the two never sit on one point.
    expect(STATES[428].messages.find((m) => m.id === "message")!.point.x).toBeGreaterThan(AT.channel.x + 84);
    for (const f of FRAMES.slice(428, 580)) expect(copy(STATES[f])!.point, `frame ${f}`).toEqual(AT.channel);
    expect(copy(STATES[602])!.point).toEqual(AT.door);
  });
});

describe("Idempotent Receiver book duplicate ignored", () => {
  const copy = (s: BookState) => s.messages.find((m) => m.id === "copy")!;
  test("Found and set aside", () => {
    expect(STATES[619].lookup).toBe(false);
    expect(STATES[620].lookup).toBe(true);
    expect(STATES[620].stored).toEqual({ opacity: 1, scale: 1 });
    // No question at the match: the receiver finds 42 in the store.
    for (const f of FRAMES.slice(580, 800)) expect(STATES[f].question, `frame ${f}`).toBeNull();
    expect(STATES[670].lookup).toBe(false);
    expect(copy(STATES[679]).fill).toBe("white");
    expect(copy(STATES[680]).fill).toBe("blocked");
    expect(copy(STATES[708]).point).toEqual(AT.ignored);
    // From the second check on, one message token is green and the check is drawn; the ghost is not a message token.
    for (const f of FRAMES.slice(549, 900)) {
      expect(STATES[f].messages.filter((m) => m.fill === "healthy").length, `frame ${f}`).toBe(1);
      expect(STATES[f].check, `frame ${f}`).not.toBeNull();
    }
  });

  test("The store in focus at the match", () => {
    for (const f of FRAMES.slice(0, 625)) expect(STATES[f].storeFocus, `frame ${f}`).toBe(1);
    expect(STATES[630].storeFocus).toBeGreaterThan(1);
    for (const f of FRAMES.slice(655, 666)) expect(STATES[f].storeFocus, `frame ${f}`).toBe(1.06);
    for (const f of FRAMES.slice(695, 900)) expect(STATES[f].storeFocus, `frame ${f}`).toBe(1);
  });
});

describe("Idempotent Receiver book final still", () => {
  test("Take 1's result faded beside take 2's", () => {
    expect(STATES[739].ghost).toBe(0);
    expect(STATES[745].ghost).toBeCloseTo(0.5);
    expect(STATES[750].ghost).toBe(1);
  });

  test("Final hold identical", () => {
    const still = stageOf(STATES[800]);
    for (const f of FRAMES.slice(800)) {
      expect(STATES[f], `frame ${f}`).toEqual(STATES[800]);
      expect(stageOf(STATES[f]), `frame ${f}`).toEqual(still);
    }
  });
});

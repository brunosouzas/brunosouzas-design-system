// The Idempotent Receiver Mule scene's timeline and frame logic (spec
// scene-catalogue, "Idempotent Receiver Mule beats and timing", "... take 1",
// "... rewind", "... take 2", "... final still"; change
// idempotent-receiver-mule-scene, tasks 2.2 and 3.2). The beat table of design
// §4 is transcribed here by hand, independently of
// src/scenes/idempotent-receiver-mule/timeline.ts, so a retiming of the scene
// or of the motion tokens fails here first. What a scenario says is drawn is
// read from the stage trees, not only from frameAt's state (the book scene's
// code review, round 1).
import { describe, expect, test } from "vitest";
import { pointAlong } from "../../src/brand/motion";
import type { SvgNode } from "../../src/pieces/node";
import { frameAt, objectFrame, type MuleState, type TokenId } from "../../src/scenes/idempotent-receiver-mule/frame";
import { AT, ROUTES } from "../../src/scenes/idempotent-receiver-mule/layout";
import { STAGE_LAYERS, stageOf } from "../../src/scenes/idempotent-receiver-mule/stage";
import { makeTimeline, timeline, type MuleTimeline } from "../../src/scenes/idempotent-receiver-mule/timeline";
import { tokens } from "../../tokens/generated/tokens";

const T = 22, F = 10, D = 630;
const FRAMES = Array.from({ length: 1350 }, (_, f) => f);
const STATES: MuleState[] = FRAMES.map((f) => frameAt(f));

/** The groups of one named element in a stage layer at frame `f`: what stage.ts draws. */
const drawnAt = (f: number, layer: (typeof STAGE_LAYERS)[number], name: string): SvgNode[] => {
  const find = (n: SvgNode | string): SvgNode[] => (typeof n === "string" ? [] : [...(n.attrs["data-element"] === name ? [n] : []), ...n.children.flatMap(find)]);
  return find(stageOf(STATES[f])[layer]);
};
/** The first shape under a group, through any pop-in or fade wrappers. */
const firstShape = (n: SvgNode): SvgNode => (n.tag === "g" ? firstShape(n.children.find((c): c is SvgNode => typeof c !== "string")!) : n);
/** Every string drawn under the element. */
const wordsOf = (f: number, layer: (typeof STAGE_LAYERS)[number], name: string): string[] => {
  const strings = (n: SvgNode | string): string[] => (typeof n === "string" ? [n] : n.children.flatMap(strings));
  return drawnAt(f, layer, name).flatMap((n) => n.children.flatMap(strings));
};
/** The lookup line as drawn: dashed or not, and its width. */
const lookupLine = (f: number) => {
  const line = firstShape(drawnAt(f, "below", "lookup")[0]);
  return { dashed: line.attrs["stroke-dasharray"] !== undefined, width: line.attrs["stroke-width"] };
};
const REST = { dashed: true, width: 2.5 };
const ACTIVE = { dashed: false, width: 4 };
const token = (s: MuleState, id: TokenId) => s.tokens.find((m) => m.id === id);
const fillOf = (f: number, id: TokenId) => firstShape(drawnAt(f, "tokens", id)[0]).attrs.fill;

// ---------------------------------------------------------------- design §4, transcribed

const BEATS = {
  duration: 1350,
  outro: 1250,
  ringsFade: [0, 20],
  rewind: { from: 610, to: 669, objects: [609, 39] },
  phases: [
    ["setup", 1, 0, 39, [38, 42], ["takeNumbers"]],
    ["t1-send", 1, 40, 119, [38, 42]],
    ["t1-lookup", 1, 120, 179, [36, 42], ["lookupMark"]],
    ["t1-charge", 1, 180, 239, [44, 109]],
    ["t1-answer", 1, 240, 329, [42, 44]],
    ["t1-retry", 1, 330, 419, [95, 159]],
    ["t1-match", 1, 420, 499, [36, 95], ["matchFocus"]],
    ["t1-duplicate", 1, 500, 609, [42, 44, 95]],
    ["rewind", "rewind", 610, 669, [122], ["rewind", "takeNumbers"]],
    ["t2-send", 2, 670, 749, [38, 42]],
    ["t2-lookup", 2, 750, 809, [36, 42], ["lookupMark"]],
    ["t2-charge", 2, 810, 869, [109]],
    ["t2-answer", 2, 870, 959, [109, 122]],
    ["t2-retry", 2, 960, 1049, [122]],
    ["t2-match", 2, 1050, 1129, [109, 122], ["matchFocus"]],
    ["t2-duplicate", 2, 1130, 1179, [122]],
    ["t2-compare", 2, 1180, 1249, [122], ["ghost"]],
  ],
  trips: [
    ["send-t1", "send", 46], ["pass-t1", "pass", 76], ["charge-t1", "charge", 186], ["reply-t1", "reply", 242],
    ["retrySend-t1", "retrySend", 346], ["retryPass-t1", "retryPass", 376], ["dupReply-t1", "dupReply", 506],
    ["send-t2", "send", 676], ["pass-t2", "pass", 706], ["charge-t2", "charge", 816], ["reply-t2", "reply", 872],
    ["retrySend-t2", "retrySend", 976], ["retryPass-t2", "retryPass", 1006], ["dupReply-t2", "dupReply", 1136],
  ],
  pops: {
    balao: 1, listener: 2, validator: 3, charge: 4, store: 5, statement: 6, badge1: 9,
    "request-t1": 40, "question-t1": 124, "stored-t1": 180, "count-t1": 216, "answer-t1": 236, "retry-t1": 340, "duplicate-t1": 500,
    rewindMark: 610,
    "request-t2": 670, "question-t2": 754, "stored-t2": 810, "answer-t2": 866, "retry-t2": 970, "duplicate-t2": 1130,
  },
  fades: {
    "p1-t1": { in: [40, 50], out: [208, 218] },
    "p2-t1": { in: [236, 246], out: [264, 274] },
    "p3-t1": { in: [340, 350], out: [398, 408] },
    "p4-t1": { in: [500, 510], out: [528, 538] },
    "p1-t2": { in: [670, 680], out: [838, 848] },
    "p2-t2": { in: [866, 876], out: [894, 904] },
    "p3-t2": { in: [970, 980], out: [1028, 1038] },
    "p4-t2": { in: [1130, 1140], out: [1158, 1168] },
    ghost: { in: [1180, 1190] },
  },
  leaves: {
    "question-t1": 160, "request-t1": 226, "answer-t1": 330, "retry-t1": 490,
    rewindMark: 670,
    "question-t2": 790, "request-t2": 856, "answer-t2": 960, "retry-t2": 1120,
  },
  cues: {
    lookupOn: [120, 420, 750, 1050], lookupOff: [170, 470, 800, 1100],
    charged: [216], failed: [846], duplicate: [480, 1110], badgeSwap: [660], focus: [425, 465, 1055, 1095],
  },
  focus: [{ on: 425, off: 465 }, { on: 1055, off: 1095 }],
  speaks: [{ from: 40, to: 68 }, { from: 340, to: 368 }, { from: 670, to: 698 }, { from: 970, to: 998 }],
  faces: [[264, "done"], [330, "idle"], [894, "failed"], [960, "idle"]],
  emotes: [["worked", 264, 300], ["problem", 894, 930]],
} as const;

/**
 * Each phase's events as design §4.1 defines them, from the transcription above: every change frame of the table
 * (a pop, the start and end of a fade, a leave and its end 10 frames later, a trip's departure and arrival, a cue,
 * Balão's faces, acts and emotes) that falls in the phase, ordered by frame then name. The rewind's reverse faces and
 * acts are read from the timeline itself (they are derived from take 1's, design §2.3) and checked apart.
 */
const expectedEvents = (t: MuleTimeline): { id: string; at: number }[][] => {
  const inRewind = (at: number) => at >= BEATS.rewind.from && at <= BEATS.rewind.to;
  const changes = [
    ...Object.entries(BEATS.pops).map(([id, at]) => ({ id: `pop-${id}`, at })),
    ...Object.entries(BEATS.fades).flatMap(([id, f]) => [
      { id: `${id}-in`, at: f.in[0] }, { id: `${id}-in-end`, at: f.in[1] },
      ...("out" in f ? [{ id: `${id}-out`, at: f.out[0] }, { id: `${id}-out-end`, at: f.out[1] }] : []),
    ]),
    ...Object.entries(BEATS.leaves).flatMap(([id, at]) => [{ id: `leave-${id}`, at }, { id: `leave-${id}-end`, at: at + 10 }]),
    ...BEATS.trips.flatMap(([id, , from]) => [{ id: `${id}-depart`, at: from }, { id: `${id}-arrive`, at: from + T }]),
    ...Object.entries(BEATS.cues).flatMap(([id, frames]) => frames.map((at, i) => ({ id: `${id}-${i}`, at }))),
    ...BEATS.faces.map(([at, expression]) => ({ id: `face-balao-${expression}`, at })),
    ...t.faces.filter((f) => inRewind(f.at)).map((f) => ({ id: `face-balao-${f.expression}`, at: f.at })),
    ...BEATS.speaks.flatMap((s) => [{ id: "act-balao", at: s.from }, { id: "act-balao-end", at: s.to }]),
    ...t.acts.filter((a) => inRewind(a.from)).flatMap((a) => [{ id: "act-balao", at: a.from }, { id: "act-balao-end", at: a.to }]),
    ...BEATS.emotes.map(([kind, at]) => ({ id: `emote-${kind}`, at })),
  ];
  return BEATS.phases.map(([, , from, to]) => changes.filter((e) => e.at >= from && e.at <= to).sort((a, b) => a.at - b.at || a.id.localeCompare(b.id)));
};

/** The first difference between the beat table and a timeline, as a path, or null. */
const firstDifference = (t: MuleTimeline): string | null => {
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
  const take12 = (at: number) => at < BEATS.rewind.from || at > BEATS.rewind.to;
  const d = check("duration", t.duration, BEATS.duration) ?? check("outro", t.outro, BEATS.outro) ?? check("ringsFade", t.ringsFade, BEATS.ringsFade)
    ?? check("rewind", t.rewind, BEATS.rewind) ?? check("pops", t.pops, BEATS.pops) ?? check("fades", t.fades, BEATS.fades)
    ?? check("leaves", t.leaves, BEATS.leaves) ?? check("cues", t.cues, BEATS.cues) ?? check("focus", t.focus, BEATS.focus)
    ?? check("speaks", t.speaks, BEATS.speaks)
    ?? check("faces", t.faces.filter((f) => take12(f.at)).map((f) => [f.at, f.expression]), BEATS.faces)
    ?? check("acts", t.acts.filter((a) => take12(a.from)).map((a) => ({ from: a.from, to: a.to })), BEATS.speaks)
    ?? check("emotes", t.emotes.map((e) => [e.kind, e.at, e.leaveAt]), BEATS.emotes);
  if (d) return d;
  // The events last: a changed table shows first where it changed, then what its phases saw.
  const events = expectedEvents(t);
  for (const [i, [id]] of BEATS.phases.entries()) {
    const e = check(`phase ${id} events`, t.phases[i]?.events, events[i]);
    if (e) return e;
  }
  return null;
};

describe("Idempotent Receiver Mule beats and timing", () => {
  test("Timeline equals the beat table", () => {
    expect(firstDifference(timeline)).toBeNull();
    expect(timeline.trips.length).toBe(BEATS.trips.length);
    expect(timeline.phases.length).toBe(BEATS.phases.length);
    // Every change frame lands in exactly one phase.
    expect(expectedEvents(timeline).flat().length).toBe(timeline.phases.flatMap((p) => p.events).length);
    expect(makeTimeline(T, F)).toEqual(timeline);
  });

  test("Travel token changed", () => {
    expect(firstDifference(makeTimeline(20, F))).toBe('trip send-t1: expected {"id":"send-t1","route":"send","from":46,"to":68}, found {"id":"send-t1","route":"send","from":46,"to":66}');
  });

  test("The rewind's reverse cast", () => {
    // Take 1's two acts and two faces, shown backwards: each reverse face restores the expression before it.
    const inRewind = (at: number) => at >= 610 && at <= 669;
    expect(timeline.faces.filter((f) => inRewind(f.at)).map((f) => [f.at, f.expression])).toEqual([[639, "done"], [646, "idle"]]);
    expect(timeline.acts.filter((a) => inRewind(a.from)).map((a) => [a.from, a.to])).toEqual([[635, 638], [667, 669]]);
  });

  test("Seeking in any order", () => {
    const backward = [...FRAMES].reverse().map((f) => [f, frameAt(f)] as const);
    for (const [f, s] of backward) expect(s, `frame ${f}`).toEqual(STATES[f]);
    const shuffled = [...FRAMES].sort((a, b) => ((a * 7919) % 1350) - ((b * 7919) % 1350));
    for (const f of shuffled) expect(frameAt(f), `frame ${f}`).toEqual(STATES[f]);
  });

  test("Take 2 repeats take 1 by 630 frames", () => {
    expect(D).toBe(630);
    // From the request to the trip's arrival at the charge, and from the retry to the 409's arrival, the stage of
    // f + 630 is the stage of f, but for the take, the object frame, the badge, the rewind mark and the emote; the
    // count is 1 in take 1 only from the charge (216), so the second range compares the statement apart.
    const strip = (s: MuleState) => ({ ...s, objectFrame: 0, take: 0, badge: null, rewindMark: null, emote: null });
    for (let f = 40; f <= 215; f++) expect(strip(frameAt(f + D)), `frame ${f}`).toEqual(strip(STATES[f]));
    const noCount = (s: MuleState) => ({ ...strip(s), charges: 0, count: null });
    for (let f = 340; f <= 528; f++) expect(noCount(frameAt(f + D)), `frame ${f}`).toEqual(noCount(STATES[f]));
  });
});

describe("Idempotent Receiver Mule take 1", () => {
  test("Charged once, 200", () => {
    expect(token(STATES[40], "request")).toBeUndefined();
    expect(token(STATES[45], "request")!.point).toEqual(AT.client);
    expect(token(STATES[57], "request")!.point).toEqual(pointAlong(ROUTES.send, 11 / 22));
    expect(token(STATES[99], "request")!.point).toEqual(AT.validator);
    expect(STATES[41].balao!.speaks).toBe(true);
    expect(STATES[68].balao!.speaks).toBe(false);
    expect([119, 120, 169, 170].map(lookupLine)).toEqual([REST, ACTIVE, ACTIVE, REST]);
    expect(STATES[124].question).toBeNull();
    expect(STATES[154].question).toEqual({ opacity: 1, scale: 1 });
    expect(STATES[170].question).toBeNull();
    expect(STATES[180].stored).toBeNull();
    expect(wordsOf(181, "nodes", "stored")).toEqual(["orderId"]);
    expect(token(STATES[208], "request")!.point).toEqual(AT.charge);
    expect(STATES[215].charges).toBe(0);
    expect(wordsOf(215, "nodes", "count")).toEqual(["0"]);
    expect(STATES[216].charges).toBe(1);
    expect(wordsOf(217, "nodes", "count")).toEqual(["1"]);
    // As drawn: the statement gains its row (a bar and a check) at 216.
    const shapes = (f: number) => JSON.stringify(drawnAt(f, "nodes", "statement")).match(/"tag":"(rect|path|polyline|circle)"/g)!.length;
    expect(shapes(216)).toBeGreaterThan(shapes(215));
    expect(token(STATES[236], "request")).toBeUndefined();
    expect(token(STATES[236], "answer")).toBeUndefined();
    expect(wordsOf(237, "tokens", "answer")).toEqual(["200"]);
    expect(fillOf(237, "answer")).toBe(tokens.color.state.healthy);
    expect(token(STATES[264], "answer")!.point).toEqual(AT.client);
    expect(STATES[263].balao!.expression).toBe("idle");
    expect(STATES[264].balao!.expression).toBe("done");
    expect(STATES[265].emote!.kind).toBe("worked");
    expect(STATES[310].emote).toBeNull();
  });

  test("The retry gets 409, still one charge", () => {
    expect(STATES[330].balao!.expression).toBe("idle");
    expect(token(STATES[340], "answer")).toBeUndefined();
    expect(token(STATES[345], "retry")!.point).toEqual(AT.client);
    expect(token(STATES[399], "retry")!.point).toEqual(AT.validator);
    expect([419, 420, 469, 470].map(lookupLine)).toEqual([REST, ACTIVE, ACTIVE, REST]);
    // No `?` at a match: the validator finds the orderId.
    for (const f of FRAMES.slice(330, 610)) expect(STATES[f].question, `frame ${f}`).toBeNull();
    expect(fillOf(479, "retry")).toBe(tokens.color.white);
    expect(fillOf(480, "retry")).toBe(tokens.color.state.blocked);
    expect(token(STATES[500], "retry")).toBeUndefined();
    expect(wordsOf(501, "tokens", "duplicate")).toEqual(["409"]);
    expect(fillOf(501, "duplicate")).toBe(tokens.color.state.blocked);
    expect(token(STATES[528], "duplicate")!.point).toEqual(AT.client);
    // No reaction on 409 (gate 0, q3).
    for (const f of FRAMES.slice(500, 610)) {
      expect(STATES[f].balao!.expression, `frame ${f}`).toBe("idle");
      expect(STATES[f].emote, `frame ${f}`).toBeNull();
    }
    for (const f of FRAMES.slice(216, 610)) expect(STATES[f].charges, `frame ${f}`).toBe(1);
  });

  test("The store in focus at each match", () => {
    // Outside the two matches and the rewind (which replays take 1's backwards), the store is at rest.
    for (const f of [...FRAMES.slice(0, 425), ...FRAMES.slice(495, 610), ...FRAMES.slice(670, 1055), ...FRAMES.slice(1125, 1350)]) {
      expect(STATES[f].storeFocus, `frame ${f}`).toBe(1);
    }
    for (const f of [...FRAMES.slice(455, 466), ...FRAMES.slice(1085, 1096)]) expect(STATES[f].storeFocus, `frame ${f}`).toBe(1.06);
    for (const name of ["store", "stored"]) {
      expect(drawnAt(460, "nodes", name)[0].children[0], name).toMatchObject({ tag: "g", attrs: { transform: "translate(533 435) scale(1.06) translate(-533 -435)" } });
      expect((drawnAt(400, "nodes", name)[0].children[0] as SvgNode).attrs.transform, name).toBeUndefined();
    }
  });
});

describe("Idempotent Receiver Mule rewind", () => {
  test("Object frames", () => {
    expect([609, 610, 640, 669].map((f) => objectFrame(f))).toEqual([609, 609, 319, 39]);
  });

  test("Same stage before each take", () => {
    const without = (f: number) => { const st = stageOf(STATES[f]); return STAGE_LAYERS.filter((l) => l !== "above").map((l) => st[l]); };
    expect(without(669)).toEqual(without(39));
  });

  test("Badge and mark", () => {
    expect(STATES[659].badge!.take).toBe(1);
    expect(STATES[660].badge!.take).toBe(2);
    expect(STATES[609].rewindMark).toBeNull();
    expect(STATES[611].rewindMark).not.toBeNull();
    expect(STATES[680].rewindMark).toBeNull();
  });
});

describe("Idempotent Receiver Mule take 2", () => {
  test("The charge fails: 500, the orderId stays", () => {
    expect(token(STATES[838], "request")!.point).toEqual(AT.charge);
    expect(fillOf(845, "request")).toBe(tokens.color.white);
    expect(fillOf(846, "request")).toBe(tokens.color.state.failure);
    expect(wordsOf(867, "tokens", "answer")).toEqual(["500"]);
    expect(fillOf(867, "answer")).toBe(tokens.color.state.failure);
    expect(token(STATES[894], "answer")!.point).toEqual(AT.client);
    expect(STATES[894].balao!.expression).toBe("failed");
    expect(STATES[895].emote!.kind).toBe("problem");
    expect(STATES[940].emote).toBeNull();
    // The orderId stays stored from 811 to the end, and the statement keeps no charge.
    for (const f of FRAMES.slice(811, 1350)) {
      expect(STATES[f].stored, `frame ${f}`).not.toBeNull();
      expect(STATES[f].charges, `frame ${f}`).toBe(0);
    }
  });

  test("The retry gets the same 409", () => {
    expect([1049, 1050, 1099, 1100].map(lookupLine)).toEqual([REST, ACTIVE, ACTIVE, REST]);
    for (const f of FRAMES.slice(960, 1250)) expect(STATES[f].question, `frame ${f}`).toBeNull();
    expect(fillOf(1110, "retry")).toBe(tokens.color.state.blocked);
    expect(wordsOf(1131, "tokens", "duplicate")).toEqual(["409"]);
    expect(fillOf(1131, "duplicate")).toBe(tokens.color.state.blocked);
    expect(token(STATES[1158], "duplicate")!.point).toEqual(AT.client);
    for (const f of FRAMES.slice(1130, 1350)) {
      expect(STATES[f].balao!.expression, `frame ${f}`).toBe("idle");
      expect(STATES[f].emote, `frame ${f}`).toBeNull();
    }
  });
});

describe("Idempotent Receiver Mule final still", () => {
  test("Take 1's count faded beside take 2's", () => {
    expect(STATES[1179].ghost).toBe(0);
    expect(STATES[1185].ghost).toBeCloseTo(0.5);
    expect(STATES[1190].ghost).toBe(1);
    expect(drawnAt(1179, "tokens", "ghost")).toEqual([]);
    const ghost = (f: number) => drawnAt(f, "tokens", "ghost")[0].children[0] as SvgNode;
    expect(ghost(1185).attrs.opacity).toBeCloseTo(tokens.motion.dimOpacity / 2);
    expect(ghost(1190).attrs.opacity).toBe(tokens.motion.dimOpacity);
    expect(wordsOf(1190, "tokens", "ghost")).toEqual(["1"]);
    expect(wordsOf(1190, "nodes", "count")).toEqual(["0"]);
  });

  test("Final hold identical", () => {
    const still = stageOf(STATES[1250]);
    for (const f of FRAMES.slice(1250)) {
      expect(STATES[f], `frame ${f}`).toEqual(STATES[1250]);
      expect(stageOf(STATES[f]), `frame ${f}`).toEqual(still);
    }
  });
});

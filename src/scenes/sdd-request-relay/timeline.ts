// The SDD relay scene's choreography (change sdd-scene-1-relay, design §4):
// the beat table as data, evaluated by absolute frame, never simulated. No
// React, so the catalogue, the stills and render scripts and the tests import it.
//
// `makeTimeline(travel, fade)` builds it from `motion.travel` and
// `motion.fade`, so a change of either token moves the arrivals and fade ends
// and fails the pinned beat-table test instead of silently retiming the scene;
// the scene uses `timeline`. Take 2 repeats take 1's request and relay 400
// frames later (design §2.7). The rewind's reverse acts and faces (design §4.3)
// are derived from take 1's with the object frame, so the `takes` checks see
// what the rewind draws.
//
// Retiming is a visual change: it goes back into design §4 and the pinned
// test in the same commit (MOT-5).
import { tokens } from "../../../tokens/generated/tokens";
import type { CastExpression } from "../../pieces/index.ts";
import type { TakesTimeline } from "../takes-kind";

/** The six open questions of the request (L24; L108–L113 number them). */
export const QUESTIONS = 6;
/** Code lines the screen ends with in each take. */
export const CODE_LINES = 6;
/** Take 2's request and relay are take 1's frames plus this (design §4). */
export const TAKE2_OFFSET = 400;

export type CastActor = "balao" | "chaves" | "visor";
export type Facing = "left" | "right";
/** The cast's action parameters (CAST-4): what an act may change. */
export type CastSet = { speaks?: boolean; holdsStamp?: boolean; facing?: Facing; types?: boolean; holdsSheet?: boolean; points?: boolean };
export type CastAction = { actor: CastActor; at: number; set: CastSet };

export type RelayTimeline = TakesTimeline & {
  /** The cast's action changes in real frames of take 1 (before the rewind) and take 2 (design §4.2). */
  actions: readonly CastAction[];
  /** Balão's fright pose (design §4.2, 316; q79 A). */
  fright: { actor: "balao"; at: number; tilt: number; squash: number };
};

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const ev = (id: string, at: number) => ({ id, at });

/** The rewind's object frame (design §2.7) for a rewind `{ from, to, objects }`. */
export const objectFrameOf = (f: number, rewind: TakesTimeline["rewind"]): number => {
  const { from, to, objects: [start, end] } = rewind;
  if (f < from) return f;
  if (f > to) return end;
  return Math.round(start - ((f - from) * (start - end)) / (to - from));
};

export const makeTimeline = (travel: number = tokens.motion.travel, fade: number = tokens.motion.fade): RelayTimeline => {
  const T = travel, F = fade, D = TAKE2_OFFSET;
  const span = (from: number): [number, number] => [from, from + F];
  const trip = (id: string, from: number) => ({ id, route: id.replace(/-t[12]-/, "-"), from, to: from + T });
  const rewind = { from: 390, to: 439, objects: [389, 49] as const };
  const take2 = 450;

  // ---------------------------------------------------------------- take 1 (frames 50–389)
  const askFrom = (i: number) => 60 + 6 * (QUESTIONS - 1 - i);
  const hopFrom = (i: number) => 146 + 6 * (QUESTIONS - 1 - i);
  const code1 = range(CODE_LINES).map((j) => 232 + 8 * j);
  const take1Actions: CastAction[] = [
    { actor: "balao", at: 56, set: { speaks: true } },
    { actor: "balao", at: 118, set: { speaks: false } },
    { actor: "chaves", at: 136, set: { facing: "right", types: true } },
    { actor: "chaves", at: 210, set: { types: false } },
    { actor: "visor", at: 226, set: { points: true } },
  ];
  const take1Acts = [
    { actor: "balao" as const, from: 56, to: 56 },
    { actor: "balao" as const, from: 118, to: 118 },
    { actor: "chaves" as const, from: 136, to: 210 },
    { actor: "visor" as const, from: 226, to: 226 },
  ];
  const take1Faces: { actor: CastActor; at: number; expression: CastExpression }[] = [
    { actor: "visor", at: 286, expression: "done" },
    { actor: "balao", at: 316, expression: "failed" },
    { actor: "visor", at: 366, expression: "failed" },
  ];
  const asks1 = range(QUESTIONS).map((i) => trip(`ask-t1-${i}`, askFrom(i)));
  const hops1 = range(QUESTIONS).map((i) => trip(`hop-t1-${i}`, hopFrom(i)));

  // ---------------------------------------------------------------- the rewind's reverse entries (design §4.3)
  /** The first rewind frame whose object frame is before take-1 frame `a`: where a change at `a` shows in reverse. */
  const flip = (a: number) => range(take2 - rewind.from).map((k) => rewind.from + k).find((f) => objectFrameOf(f, rewind) < a)!;
  const reverseActs = take1Acts.map((act) => ({ actor: act.actor, from: flip(act.to), to: flip(act.from) })).sort((a, b) => a.from - b.from);
  const before = (actor: CastActor, at: number): CastExpression =>
    take1Faces.filter((face) => face.actor === actor && face.at < at).sort((a, b) => a.at - b.at).at(-1)?.expression ?? "idle";
  const reverseFaces = take1Faces.map((face) => ({ actor: face.actor, at: flip(face.at), expression: before(face.actor, face.at) })).sort((a, b) => a.at - b.at);

  // ---------------------------------------------------------------- take 2 (frames 450–979)
  const listFrom = (j: number) => 636 + 8 * j;
  const checks = range(QUESTIONS).map((k) => 760 + 8 * k);
  const code2 = range(CODE_LINES).map((j) => 902 + 8 * j);
  const carry = trip("carry", 712);
  const back = trip("return", 852);
  const take2Actions: CastAction[] = [
    ...take1Actions.filter((a) => a.actor !== "visor").map((a) => ({ ...a, at: a.at + D })),
    { actor: "visor", at: 626, set: { points: true } },
    { actor: "visor", at: 702, set: { points: false } },
    { actor: "chaves", at: 712, set: { facing: "left" } },
    { actor: "chaves", at: carry.to, set: { holdsSheet: true } },
    { actor: "balao", at: 752, set: { speaks: true } },
    { actor: "balao", at: 806, set: { speaks: false } },
    { actor: "balao", at: 816, set: { holdsStamp: true } },
    { actor: "balao", at: 836, set: { holdsStamp: false } },
    { actor: "chaves", at: 852, set: { holdsSheet: false } },
    { actor: "chaves", at: back.to, set: { facing: "right" } },
    { actor: "visor", at: 896, set: { points: true } },
  ];
  const take2Acts = [
    ...take1Acts.filter((a) => a.actor !== "visor").map((a) => ({ ...a, from: a.from + D, to: a.to + D })),
    { actor: "visor" as const, from: 626, to: 626 },
    { actor: "visor" as const, from: 702, to: 702 },
    { actor: "chaves" as const, from: 712, to: carry.to },
    { actor: "balao" as const, from: 752, to: 836 },
    { actor: "chaves" as const, from: 852, to: back.to },
    { actor: "visor" as const, from: 896, to: 896 },
  ];
  const take2Faces: { actor: CastActor; at: number; expression: CastExpression }[] = [
    { actor: "visor", at: 702, expression: "waiting" },
    { actor: "balao", at: 836, expression: "done" },
    { actor: "visor", at: 950, expression: "done" },
  ];
  const asks2 = range(QUESTIONS).map((i) => trip(`ask-t2-${i}`, askFrom(i) + D));
  const hops2 = range(QUESTIONS).map((i) => trip(`hop-t2-${i}`, hopFrom(i) + D));
  const lists = range(QUESTIONS).map((j) => trip(`list-${j}`, listFrom(j)));

  const actions = [...take1Actions, ...take2Actions];
  const trips = [...asks1, ...hops1, ...asks2, ...hops2, ...lists, carry, back];
  const pops = { laptop: 4, balao: 8, chaves: 12, visor: 16, badge1: 20, rewindMark: 390, badge2: 440, sheet: 626, goMark: 836 };
  const fades = {
    "p1-t1": { in: span(56), out: span(118) },
    "p2-t1": { in: span(142), out: span(204) },
    failureArrow: { in: span(300) },
    "p1-t2": { in: span(56 + D), out: span(118 + D) },
    "p2-t2": { in: span(142 + D), out: span(204 + D) },
    "p4-carry": { in: span(carry.from), out: span(carry.to) },
    "p4-return": { in: span(back.from), out: span(back.to) },
  };
  const leaves = { problem: 350, rewindMark: take2 };
  const cues = {
    requestLine: [142, 142 + D],
    codeLines1: code1,
    sinks: code1.map((at) => at + F),
    rows: lists.map((t) => t.to),
    checks,
    codeLines2: code2,
    badgeSwap: [440],
    actions: actions.map((a) => a.at),
  };
  const faces = [...take1Faces, ...reverseFaces, ...take2Faces];
  const emotes = [
    { actor: "balao" as const, kind: "problem" as const, at: 316, leaveAt: leaves.problem },
    { actor: "visor" as const, kind: "worked" as const, at: 950, leaveAt: null },
  ];

  // Every change frame, assigned to the phase it falls in (design §4.1).
  const changes = [
    ...Object.entries(pops).map(([id, at]) => ev(`pop-${id}`, at)),
    ...Object.entries(fades).flatMap(([id, f]) => [ev(`${id}-in`, f.in[0]), ev(`${id}-in-end`, f.in[1]), ...("out" in f && f.out ? [ev(`${id}-out`, f.out[0]), ev(`${id}-out-end`, f.out[1])] : [])]),
    ...Object.entries(leaves).flatMap(([id, at]) => [ev(`leave-${id}`, at), ev(`leave-${id}-end`, at + 10)]),
    ...trips.flatMap((t) => [ev(`${t.id}-depart`, t.from), ev(`${t.id}-arrive`, t.to)]),
    ...Object.entries(cues).flatMap(([id, frames]) => frames.map((at, i) => ev(`${id}-${i}`, at))),
    ...faces.map((face) => ev(`face-${face.actor}-${face.expression}`, face.at)),
    ...[...take1Acts, ...reverseActs, ...take2Acts].flatMap((act) => [ev(`act-${act.actor}`, act.from), ev(`act-${act.actor}-end`, act.to)]),
  ];
  const phase = (id: string, take: 1 | 2 | "rewind", from: number, to: number, cites: number[], devices?: ("fright" | "rewind" | "takeNumbers" | "goStamp")[]) => ({
    id, take, from, to, cites, ...(devices ? { devices } : {}),
    events: changes.filter((e) => e.at >= from && e.at <= to).sort((a, b) => a.at - b.at || a.id.localeCompare(b.id)),
  });

  return {
    duration: 1080,
    outro: 980,
    ringsFade: [0, 20],
    phases: [
      phase("setup", 1, 0, 49, [20, 26], ["takeNumbers"]),
      phase("t1-request", 1, 50, 129, [20, 22, 24]),
      phase("t1-relay", 1, 130, 219, [26, 32]),
      phase("t1-code", 1, 220, 299, [26]),
      phase("t1-error", 1, 300, 389, [122, 26], ["fright"]),
      phase("rewind", "rewind", 390, 449, [22], ["rewind", "takeNumbers"]),
      phase("t2-request", 2, 450, 529, [20, 22, 24]),
      phase("t2-relay", 2, 530, 619, [26, 32]),
      phase("t2-list", 2, 620, 699, [32, 72, 80, 98, 106, 108, 109, 110, 111, 112, 113]),
      phase("t2-carry", 2, 700, 749, [116, 118]),
      phase("t2-answer", 2, 750, 849, [34, 118, 120, 148], ["goStamp"]),
      phase("t2-return", 2, 850, 889, [32, 148]),
      phase("t2-implement", 2, 890, 979, [32, 152]),
    ],
    rewind,
    acts: [...take1Acts, ...reverseActs, ...take2Acts],
    faces,
    emotes,
    trips,
    pops,
    fades,
    leaves,
    cues,
    actions,
    fright: { actor: "balao", at: 316, tilt: -5, squash: -0.07 },
  };
};

export const timeline: RelayTimeline = makeTimeline();

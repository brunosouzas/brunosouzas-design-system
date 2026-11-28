// The Idempotent Receiver Mule scene's choreography (card SW-160; change
// idempotent-receiver-mule-scene, design §4): the beat table as data,
// evaluated by absolute frame, never simulated. No React, so the catalogue,
// the stills and render scripts and the tests import it.
//
// `makeTimeline(travel, fade)` builds it from `motion.travel` and
// `motion.fade`, so a change of either token moves the arrivals and fade ends
// and fails the pinned beat-table test instead of silently retiming the scene;
// the scene uses `timeline`. Take 2 repeats take 1 630 frames later (design
// §2.3): the request, the lookup and the stored ID, the trip to the charge,
// the answer, the retry, the match and the 409. It differs only at the charge
// (it fails: the request turns red and the answer is 500, not a statement row
// and 200) and in Balão's reaction to it, then adds take 1's count beside the
// statement. The rewind's reverse acts and faces are derived from take 1's
// with the object frame, so the `takes` checks see what the rewind draws.
//
// Retiming is a visual change: it goes back into design §4 and the pinned
// test in the same commit (MOT-5).
import { tokens } from "../../../tokens/generated/tokens";
import type { CastExpression } from "../../pieces/index.ts";
import { LEAVE_FRAMES, type TakesDevice, type TakesTimeline } from "../takes-kind";

/** Take 2's frames are take 1's plus this (design §2.3). */
export const TAKE2_OFFSET = 630;

/** A store's focus: rises from `on`, falls from `off` (design §2.5, `matchFocus`). */
export type Focus = { on: number; off: number };
export type MuleTimeline = TakesTimeline & {
  /** The store's focus at each match, take 1 then take 2. */
  focus: readonly [Focus, Focus];
  /** Balão speaks while a request leaves: from the pop of each request to its arrival at the listener, in real frames of take 1 and take 2. */
  speaks: readonly { from: number; to: number }[];
};

const ev = (id: string, at: number) => ({ id, at });

/** The rewind's object frame (design §2.3) for a rewind `{ from, to, objects }`. */
export const objectFrameOf = (f: number, rewind: TakesTimeline["rewind"]): number => {
  const { from, to, objects: [start, end] } = rewind;
  if (f < from) return f;
  if (f > to) return end;
  return Math.round(start - ((f - from) * (start - end)) / (to - from));
};

export const makeTimeline = (travel: number = tokens.motion.travel, fade: number = tokens.motion.fade): MuleTimeline => {
  const T = travel, F = fade, D = TAKE2_OFFSET;
  const span = (from: number): [number, number] => [from, from + F];
  /** A trip on its route: the id without its take. */
  const trip = (id: string, from: number) => ({ id, route: id.replace(/-t[12]$/, ""), from, to: from + T });
  const rewind = { from: 610, to: 669, objects: [609, 39] as const };
  const take2 = 670;

  // ---------------------------------------------------------------- take 1 (frames 40–609): charged, then the retry's 409
  const send1 = trip("send-t1", 46);
  const pass1 = trip("pass-t1", send1.to + 8);
  const charge1 = trip("charge-t1", 186);
  const reply1 = trip("reply-t1", 242);
  const retrySend1 = trip("retrySend-t1", 346);
  const retryPass1 = trip("retryPass-t1", retrySend1.to + 8);
  const dupReply1 = trip("dupReply-t1", 506);
  const take1 = [send1, pass1, charge1, reply1, retrySend1, retryPass1, dupReply1];
  const take1Speaks = [{ from: 40, to: send1.to }, { from: 340, to: retrySend1.to }];
  const take1Faces: { actor: "balao"; at: number; expression: CastExpression }[] = [
    { actor: "balao", at: reply1.to, expression: "done" },
    { actor: "balao", at: 330, expression: "idle" },
  ];

  // ---------------------------------------------------------------- the rewind's reverse entries (design §2.3)
  /** The first rewind frame whose object frame is before take-1 frame `a`: where a change at `a` shows in reverse. */
  const flip = (a: number) => Array.from({ length: take2 - rewind.from }, (_, k) => rewind.from + k).find((f) => objectFrameOf(f, rewind) < a)!;
  const take1Acts = take1Speaks.map((s) => ({ actor: "balao" as const, from: s.from, to: s.to }));
  const reverseActs = take1Acts.map((act) => ({ actor: act.actor, from: flip(act.to), to: flip(act.from) })).sort((a, b) => a.from - b.from);
  const before = (at: number): CastExpression => take1Faces.filter((face) => face.at < at).sort((a, b) => a.at - b.at).at(-1)?.expression ?? "idle";
  const reverseFaces = take1Faces.map((face) => ({ actor: face.actor, at: flip(face.at), expression: before(face.at) })).sort((a, b) => a.at - b.at);

  // ---------------------------------------------------------------- take 2 (frames 670–1249): the charge fails, then the same 409
  const take2Trips = take1.map((t) => trip(t.id.replace(/-t1$/, "-t2"), t.from + D));
  const take2Speaks = take1Speaks.map((s) => ({ from: s.from + D, to: s.to + D }));
  const take2Faces: { actor: "balao"; at: number; expression: CastExpression }[] = [
    { actor: "balao", at: reply1.to + D, expression: "failed" },
    { actor: "balao", at: 330 + D, expression: "idle" },
  ];

  const trips = [...take1, ...take2Trips];
  const pops = {
    // The stage pops in and settles (pop + motion.fps) by frame 39, so the rewind lands on the stage take 2 starts from.
    balao: 1, listener: 2, validator: 3, charge: 4, store: 5, statement: 6, badge1: 9,
    "request-t1": 40, "question-t1": 124, "stored-t1": 180, "count-t1": 216, "answer-t1": 236, "retry-t1": 340, "duplicate-t1": 500,
    rewindMark: 610,
    "request-t2": 40 + D, "question-t2": 124 + D, "stored-t2": 180 + D, "answer-t2": 236 + D, "retry-t2": 340 + D, "duplicate-t2": 500 + D,
  };
  const fades = {
    "p1-t1": { in: span(40), out: span(charge1.to) },
    "p2-t1": { in: span(236), out: span(reply1.to) },
    "p3-t1": { in: span(340), out: span(retryPass1.to) },
    "p4-t1": { in: span(500), out: span(dupReply1.to) },
    "p1-t2": { in: span(40 + D), out: span(charge1.to + D) },
    "p2-t2": { in: span(236 + D), out: span(reply1.to + D) },
    "p3-t2": { in: span(340 + D), out: span(retryPass1.to + D) },
    "p4-t2": { in: span(500 + D), out: span(dupReply1.to + D) },
    ghost: { in: span(1180) },
  };
  const leaves = {
    "question-t1": 160, "request-t1": 226, "answer-t1": 330, "retry-t1": 490,
    rewindMark: take2,
    "question-t2": 160 + D, "request-t2": 226 + D, "answer-t2": 330 + D, "retry-t2": 490 + D,
  };
  const focus: [Focus, Focus] = [{ on: 425, off: 465 }, { on: 425 + D, off: 465 + D }];
  const cues = {
    lookupOn: [120, 420, 120 + D, 420 + D],
    lookupOff: [170, 470, 170 + D, 470 + D],
    charged: [216],
    failed: [216 + D],
    duplicate: [480, 480 + D],
    badgeSwap: [660],
    focus: [focus[0].on, focus[0].off, focus[1].on, focus[1].off],
  };
  const faces = [...take1Faces, ...reverseFaces, ...take2Faces];
  const emotes = [
    { actor: "balao" as const, kind: "worked" as const, at: reply1.to, leaveAt: 300 },
    { actor: "balao" as const, kind: "problem" as const, at: reply1.to + D, leaveAt: 300 + D },
  ];
  const acts = [...take1Acts, ...reverseActs, ...take2Speaks.map((s) => ({ actor: "balao" as const, from: s.from, to: s.to }))];

  // Every change frame, assigned to the phase it falls in (design §4.1).
  const changes = [
    ...Object.entries(pops).map(([id, at]) => ev(`pop-${id}`, at)),
    ...Object.entries(fades).flatMap(([id, f]) => [ev(`${id}-in`, f.in[0]), ev(`${id}-in-end`, f.in[1]), ...("out" in f && f.out ? [ev(`${id}-out`, f.out[0]), ev(`${id}-out-end`, f.out[1])] : [])]),
    ...Object.entries(leaves).flatMap(([id, at]) => [ev(`leave-${id}`, at), ev(`leave-${id}-end`, at + LEAVE_FRAMES)]),
    ...trips.flatMap((t) => [ev(`${t.id}-depart`, t.from), ev(`${t.id}-arrive`, t.to)]),
    ...Object.entries(cues).flatMap(([id, frames]) => frames.map((at, i) => ev(`${id}-${i}`, at))),
    ...faces.map((face) => ev(`face-${face.actor}-${face.expression}`, face.at)),
    ...acts.flatMap((act) => [ev(`act-${act.actor}`, act.from), ev(`act-${act.actor}-end`, act.to)]),
    ...emotes.map((e) => ev(`emote-${e.kind}`, e.at)),
  ];
  const phase = (id: string, take: 1 | 2 | "rewind", from: number, to: number, cites: number[], devices?: TakesDevice[]) => ({
    id, take, from, to, cites, ...(devices ? { devices } : {}),
    events: changes.filter((e) => e.at >= from && e.at <= to).sort((a, b) => a.at - b.at || a.id.localeCompare(b.id)),
  });

  return {
    duration: 1350,
    outro: 1250,
    ringsFade: [0, 20],
    phases: [
      phase("setup", 1, 0, 39, [38, 42], ["takeNumbers"]),
      phase("t1-send", 1, 40, 119, [38, 42]),
      phase("t1-lookup", 1, 120, 179, [36, 42], ["lookupMark"]),
      phase("t1-charge", 1, 180, 239, [44, 109]),
      phase("t1-answer", 1, 240, 329, [42, 44]),
      phase("t1-retry", 1, 330, 419, [95, 159]),
      phase("t1-match", 1, 420, 499, [36, 95], ["matchFocus"]),
      phase("t1-duplicate", 1, 500, 609, [42, 44, 95]),
      phase("rewind", "rewind", 610, 669, [122], ["rewind", "takeNumbers"]),
      phase("t2-send", 2, 670, 749, [38, 42]),
      phase("t2-lookup", 2, 750, 809, [36, 42], ["lookupMark"]),
      phase("t2-charge", 2, 810, 869, [109]),
      phase("t2-answer", 2, 870, 959, [109, 122]),
      phase("t2-retry", 2, 960, 1049, [122]),
      phase("t2-match", 2, 1050, 1129, [109, 122], ["matchFocus"]),
      phase("t2-duplicate", 2, 1130, 1179, [122]),
      phase("t2-compare", 2, 1180, 1249, [122], ["ghost"]),
    ],
    rewind,
    acts,
    faces,
    emotes,
    trips,
    pops,
    fades,
    leaves,
    cues,
    focus,
    speaks: [...take1Speaks, ...take2Speaks],
  };
};

export const timeline: MuleTimeline = makeTimeline();

// The Idempotent Receiver book scene's choreography (card SW-160; change
// idempotent-receiver-book-scene, design §4): the beat table as data,
// evaluated by absolute frame, never simulated. No React, so the catalogue,
// the stills and render scripts and the tests import it.
//
// `makeTimeline(travel, fade)` builds it from `motion.travel` and
// `motion.fade`, so a change of either token moves the arrivals and fade ends
// and fails the pinned beat-table test instead of silently retiming the scene;
// the scene uses `timeline`. Take 2 repeats take 1's send, delivery, lookup and
// processing 340 frames later (design §2.3), then adds the second delivery,
// the match and the ignore. The scene has no cast, so its acts, faces and
// emotes are empty. Reading pauses follow the owner's rule of 2026-11-27:
// understanding before length (design §2.8).
//
// Retiming is a visual change: it goes back into design §4 and the pinned
// test in the same commit (MOT-5).
import { tokens } from "../../../tokens/generated/tokens";
import { LEAVE_FRAMES, type TakesDevice, type TakesTimeline } from "../takes-kind";

/** Take 2's repeated frames are take 1's plus this (design §2.3). */
export const TAKE2_OFFSET = 340;

/** The match's focus on the store and its ID: rises from `on`, falls from `off` (design §2.8). */
export type BookTimeline = TakesTimeline & { focus: { on: number; off: number } };

const ev = (id: string, at: number) => ({ id, at });

/** The rewind's object frame (design §2.3) for a rewind `{ from, to, objects }`. */
export const objectFrameOf = (f: number, rewind: TakesTimeline["rewind"]): number => {
  const { from, to, objects: [start, end] } = rewind;
  if (f < from) return f;
  if (f > to) return end;
  return Math.round(start - ((f - from) * (start - end)) / (to - from));
};

export const makeTimeline = (travel: number = tokens.motion.travel, fade: number = tokens.motion.fade): BookTimeline => {
  const T = travel, F = fade, D = TAKE2_OFFSET;
  const span = (from: number): [number, number] => [from, from + F];
  /** A trip on its route: the id without its take, or `route` when two trips share one (the second delivery). */
  const trip = (id: string, from: number, route: string = id.replace(/-t[12]$/, "")) => ({ id, route, from, to: from + T });
  const rewind = { from: 320, to: 369, objects: [319, 39] as const };

  // ---------------------------------------------------------------- take 1 (frames 40–319): one delivery
  const send1 = trip("send-t1", 46);
  const deliver1 = trip("deliver-t1", send1.to + 8);
  const process1 = trip("process-t1", 186);

  // ---------------------------------------------------------------- take 2 (frames 380–799): two deliveries
  const send2 = trip("send-t2", send1.from + D);
  const deliver2 = trip("deliver-t2", deliver1.from + D);
  const process2 = trip("process-t2", process1.from + D);
  const second = trip("deliver2-t2", 580, "deliver");
  const ignore = trip("ignore-t2", 686);

  const trips = [send1, deliver1, process1, send2, deliver2, process2, second, ignore];
  const pops = {
    // The stage pops in and settles (pop + motion.fps) by frame 39, so the rewind lands on the stage take 2 starts from.
    sender: 1, channel: 3, receiver: 5, store: 7, badge1: 9,
    "message-t1": 40, "question-t1": 124, "stored-t1": 180, "check-t1": process1.to,
    rewindMark: 320,
    "message-t2": 40 + D, copy: deliver2.from + 11, "question-t2": 124 + D, "stored-t2": 180 + D, "check-t2": process2.to,
  };
  const fades = {
    "p1-t1": { in: span(40), out: span(deliver1.to) },
    "p2-t1": { in: span(180), out: span(process1.to) },
    "p1-t2": { in: span(40 + D), out: span(second.to) },
    "p2-t2": { in: span(180 + D), out: span(process2.to) },
    "p3-t2": { in: span(680), out: span(ignore.to) },
    ghost: { in: span(740) },
  };
  const leaves = { "question-t1": 160, "question-t2": 160 + D, rewindMark: 380 };
  const focus = { on: 625, off: 665 };
  const cues = {
    lookupOn: [120, 120 + D, 620],
    lookupOff: [170, 170 + D, 670],
    processed: [180, 180 + D],
    ignored: [680],
    badgeSwap: [370],
    focus: [focus.on, focus.off],
  };

  // Every change frame, assigned to the phase it falls in (design §4.1).
  const changes = [
    ...Object.entries(pops).map(([id, at]) => ev(`pop-${id}`, at)),
    ...Object.entries(fades).flatMap(([id, f]) => [ev(`${id}-in`, f.in[0]), ev(`${id}-in-end`, f.in[1]), ...("out" in f && f.out ? [ev(`${id}-out`, f.out[0]), ev(`${id}-out-end`, f.out[1])] : [])]),
    ...Object.entries(leaves).flatMap(([id, at]) => [ev(`leave-${id}`, at), ev(`leave-${id}-end`, at + LEAVE_FRAMES)]),
    ...trips.flatMap((t) => [ev(`${t.id}-depart`, t.from), ev(`${t.id}-arrive`, t.to)]),
    ...Object.entries(cues).flatMap(([id, frames]) => frames.map((at, i) => ev(`${id}-${i}`, at))),
  ];
  const phase = (id: string, take: 1 | 2 | "rewind", from: number, to: number, cites: number[], devices?: TakesDevice[]) => ({
    id, take, from, to, cites, ...(devices ? { devices } : {}),
    events: changes.filter((e) => e.at >= from && e.at <= to).sort((a, b) => a.at - b.at || a.id.localeCompare(b.id)),
  });

  return {
    duration: 900,
    outro: 800,
    ringsFade: [0, 20],
    phases: [
      phase("setup", 1, 0, 39, [28, 32], ["takeNumbers"]),
      phase("t1-send", 1, 40, 119, [28, 32]),
      phase("t1-lookup", 1, 120, 179, [28, 32], ["lookupMark"]),
      phase("t1-process", 1, 180, 239, [28, 32]),
      phase("t1-hold", 1, 240, 319, [28]),
      phase("rewind", "rewind", 320, 379, [28], ["rewind", "takeNumbers"]),
      phase("t2-send", 2, 380, 459, [28, 32]),
      phase("t2-lookup", 2, 460, 519, [28, 32], ["lookupMark"]),
      phase("t2-process", 2, 520, 579, [28, 32]),
      phase("t2-deliver", 2, 580, 619, [28, 32]),
      phase("t2-match", 2, 620, 679, [28, 32], ["matchFocus"]),
      phase("t2-ignore", 2, 680, 739, [28, 32]),
      phase("t2-compare", 2, 740, 799, [28], ["ghost"]),
    ],
    rewind,
    acts: [],
    faces: [],
    emotes: [],
    trips,
    pops,
    fades,
    leaves,
    cues,
    focus,
  };
};

export const timeline: BookTimeline = makeTimeline();

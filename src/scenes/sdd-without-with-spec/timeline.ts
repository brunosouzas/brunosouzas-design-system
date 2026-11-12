// The SDD scene's choreography (change sdd-without-with-spec-scene, design §4):
// the beat table as data, evaluated by absolute frame, never simulated. No
// React, so the catalogue, the stills and render scripts and the tests import it.
//
// Every trip and the hand-over end `motion.travel` frames after they start, so
// a change of that token moves the arrivals and fails the pinned beat-table
// test instead of silently retiming the scene. `makeTimeline(travel)` exists for
// that test; the scene uses `timeline`.
//
// Retiming is a visual change: the owner approves it on stills (MOT-5).
import { tokens } from "../../../tokens/generated/tokens";
import type { TakesTimeline } from "../takes-kind";

/** The six open questions of the request (article L108–L113). */
export const QUESTIONS = 6;
/** Code lines the panel ends with in each take. */
export const CODE_LINES = 8;

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const ev = (id: string, at: number) => ({ id, at });

export const makeTimeline = (travel: number = tokens.motion.travel): TakesTimeline => {
  // Take 1: the rightmost `?` (slot 5) leaves first, 12 frames apart, so no token crosses one still waiting.
  const guessFrom = (i: number) => 112 + 12 * (QUESTIONS - 1 - i);
  // Take 2: slot 0 leaves first, 10 frames apart (its route leaves to the left).
  const askFrom = (i: number) => 404 + 10 * i;
  const answerFrom = (i: number) => 512 + 8 * i;
  const trip = (kind: string, i: number, from: number) => ({ id: `${kind}-${i}`, route: `${kind}-${i}`, from, to: from + travel });
  const guesses = range(QUESTIONS).map((i) => trip("guess", i, guessFrom(i)));
  const asks = range(QUESTIONS).map((i) => trip("ask", i, askFrom(i)));
  const answers = range(QUESTIONS).map((i) => trip("answer", i, answerFrom(i)));
  const handOver = { id: "handover", route: "handover", from: 480, to: 480 + travel };
  // Take 1's code panel gains a line at each `?` arrival (in arrival order), then two more lines.
  const take1Lines = [...guesses.map((t) => t.to).sort((a, b) => a - b), 202, 210];
  const take2Lines = range(CODE_LINES).map((j) => 616 + 5 * j);
  const slotPops = range(QUESTIONS).map((i) => 30 + 4 * i);

  return {
    duration: 780,
    outro: 690,
    ringsFade: [0, 20],
    phases: [
      { id: "request", take: 1, from: 24, to: 89, cites: [20, 22, 24, 108, 109, 110, 111, 112, 113],
        events: [ev("balloon", 24), ...slotPops.map((at, i) => ev(`slot-${i}`, at))] },
      { id: "guess", take: 1, from: 90, to: 239, cites: [26, 80],
        events: [ev("act", 90), ev("p1-in", 90), ...guesses.flatMap((t) => [ev(`${t.id}-depart`, t.from), ev(`${t.id}-arrive`, t.to)]),
          ev("line-7", 202), ev("line-8", 210), ev("p1-out", 220)] },
      { id: "error", take: 1, from: 240, to: 309, cites: [122, 26], devices: ["fright"],
        events: [ev("failure-arrow-in", 240), ev("face-failed", 270), ev("emote-problem", 270)] },
      { id: "rewind", take: "rewind", from: 340, to: 377, cites: [22], devices: ["rewind", "takeNumbers"],
        events: [ev("rewind-mark", 340), ev("act", 344), ev("face-idle", 344)] },
      { id: "ask", take: 2, from: 390, to: 509, cites: [32, 72, 82, 98, 103, 106, 107, 108, 109, 110, 111, 112, 113, 116],
        events: [ev("act", 390), ev("p2-in", 394), ev("rewind-mark-leave", 400),
          ...asks.flatMap((t) => [ev(`${t.id}-depart`, t.from), ev(`${t.id}-arrive`, t.to)]),
          ev("handover", 480), ev("p2-out", 480), ev("face-waiting", 504)] },
      { id: "answer", take: 2, from: 510, to: 599, cites: [120, 148, 34], devices: ["goStamp"],
        events: [...answers.flatMap((t) => [ev(`${t.id}-depart`, t.from), ev(`${t.id}-arrive`, t.to)]), ev("stamp", 584)] },
      { id: "implement", take: 2, from: 600, to: 689, cites: [32, 152, 34, 169],
        events: [ev("act", 600), ev("face-idle", 600), ev("p3-in", 600), ...take2Lines.map((at, j) => ev(`line-${j + 1}`, at)),
          ev("face-done", 660), ev("emote-worked", 660)] },
    ],
    rewind: { from: 344, to: 377, objects: [339, 89] },
    acts: [
      { actor: "visor", from: 90, to: 90 },
      { actor: "visor", from: 344, to: 344 },
      { actor: "visor", from: 390, to: 480 },
      { actor: "visor", from: 600, to: 600 },
    ],
    faces: [
      { actor: "visor", at: 270, expression: "failed" },
      { actor: "visor", at: 344, expression: "idle" },
      { actor: "visor", at: 504, expression: "waiting" },
      { actor: "visor", at: 600, expression: "idle" },
      { actor: "visor", at: 660, expression: "done" },
    ],
    emotes: [
      { actor: "visor", kind: "problem", at: 270, leaveAt: 320 },
      { actor: "visor", kind: "worked", at: 660, leaveAt: null },
    ],
    trips: [...guesses, ...asks, handOver, ...answers],
    pops: {
      codePanel: 6, visor: 12, badge1: 18, balloon: 24,
      ...Object.fromEntries(slotPops.map((at, i) => [`slot-${i}`, at])),
      rewindMark: 340, badge2: 378, stamp: 584,
    },
    fades: {
      p1: { in: [90, 100], out: [220, 230] },
      failureArrow: { in: [240, 250] },
      p2: { in: [394, 404], out: [480, 490] },
      p3: { in: [600, 610] },
    },
    leaves: { rewindMark: 400 },
    cues: {
      take1Lines,
      rows: asks.map((t) => t.to),
      checks: answers.map((t) => t.to),
      take2Lines,
      handOver: [handOver.from],
      badgeSwap: [378],
    },
  };
};

export const timeline: TakesTimeline = makeTimeline();

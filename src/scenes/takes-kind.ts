// The `takes` scene kind (change sdd-without-with-spec-scene, design §2.2 and
// §5): two runs of the same stage, take 1, one rewind, take 2. Its timeline
// type and the checks the catalogue runs on it, with no React, so the CLI
// scripts and the tests import it under tsx.
//
// Why a kind of its own: a comparison is neither a state machine (no slots,
// no transition fires) nor a message flow (no queues, no ACK/NACK); what it
// needs checked is the take order, an article line per phase (MOT-1), one
// actor at a time (CAST-4), emotes on expression changes and gone before the
// next action (CAST-3), and nothing moving in the final reading hold (SCN-4).
//
// How to run: `npm test -- test/scenes/catalogue-takes.test.ts`.
// What can go wrong: nothing throws here; every problem is returned as a line
// that names the scene first, then the item and its frame.
import { tokens } from "../../tokens/generated/tokens";
import type { CastExpression, EmoteKind } from "../pieces/index.ts";

export type Actor = "mira" | "visor" | "drone" | "kiu" | "sinal";
export type Take = 1 | 2 | "rewind";
/** A reading device the article does not state, kept by the owner (MOT-1). */
export type TakesDevice = "fright" | "rewind" | "takeNumbers" | "goStamp";

export type TakesPhase = {
  id: string;
  take: Take;
  /** Inclusive frames. */
  from: number;
  to: number;
  /** Line numbers of the English source article this phase animates (MOT-1). */
  cites: readonly number[];
  devices?: readonly TakesDevice[];
  /** The cue frames inside the phase: pop-ins, departures, arrivals, lines, rows, checks, faces, acts, emote entrances. */
  events: readonly { id: string; at: number }[];
};

export type TakesTimeline = {
  duration: number;
  outro: number;
  ringsFade: readonly [number, number];
  phases: readonly TakesPhase[];
  /** The rewind: from `from` to `to` (inclusive) the object layer plays from object frame `objects[0]` back to `objects[1]`. */
  rewind: { from: number; to: number; objects: readonly [number, number] };
  /** Ranges (inclusive) in which a character's action parameters may change (CAST-4). */
  acts: readonly { actor: Actor; from: number; to: number }[];
  /** Expression changes of a character's screen face. */
  faces: readonly { actor: Actor; at: number; expression: CastExpression }[];
  /** Emotes: pop in at `at`, leave over 10 frames from `leaveAt` (null: they stay). */
  emotes: readonly { actor: Actor; kind: EmoteKind; at: number; leaveAt: number | null }[];
  /** Object trips along a route, `to` = `from` + `motion.travel`. */
  trips: readonly { id: string; route: string; from: number; to: number }[];
  /** Pop-in frame of each element. */
  pops: Readonly<Record<string, number>>;
  /** Linear fades; `in` reaches 1 at its end, `out` reaches 0 at its end. */
  fades: Readonly<Record<string, { in: readonly [number, number]; out?: readonly [number, number] }>>;
  /** Elements that leave over `LEAVE_FRAMES` frames from the given frame. */
  leaves: Readonly<Record<string, number>>;
  /** Any other frame something changes at (code lines, rows, checks, the hand-over, the badge swap). */
  cues: Readonly<Record<string, readonly number[]>>;
};

/** Frames an emote or another element takes to leave; scenes pass it to `leave` (src/brand/cast-motion.ts), so the check and the frames agree. */
export const LEAVE_FRAMES = 10;

const TAKE_LABEL = (take: Take): string => (take === "rewind" ? "rewind" : `take ${take}`);

/** Take order: one or more take-1 phases, exactly one rewind, one or more take-2 phases. */
const checkOrder = (id: string, phases: readonly TakesPhase[]): string[] => {
  // The stage the order is in: before any phase, in take 1, after the rewind, in take 2.
  type Stage = "start" | "take1" | "rewind" | "take2";
  let stage = "start" as Stage;
  for (const phase of phases) {
    const next: Stage | null =
      phase.take === 1 && (stage === "start" || stage === "take1") ? "take1"
      : phase.take === "rewind" && stage === "take1" ? "rewind"
      : phase.take === 2 && (stage === "rewind" || stage === "take2") ? "take2"
      : null;
    if (next === null) {
      return [`${id}: phase ${phase.id} (${TAKE_LABEL(phase.take)}) breaks the take order (take-1 phases, one rewind, then take-2 phases)`];
    }
    stage = next;
  }
  if (stage !== "take2") {
    const last = phases.at(-1);
    return [`${id}: the takes end at ${last ? `phase ${last.id}` : "no phase"} without completing the order (take-1 phases, one rewind, then take-2 phases)`];
  }
  return [];
};

const emoteEnd = (emote: TakesTimeline["emotes"][number], duration: number): number =>
  emote.leaveAt === null ? duration : emote.leaveAt + LEAVE_FRAMES;

/** Acts, faces and emotes (CAST-3, CAST-4). */
const checkCast = (id: string, t: TakesTimeline): string[] => {
  const problems: string[] = [];
  t.acts.forEach((a, i) => t.acts.slice(i + 1).forEach((b) => {
    if (a.actor !== b.actor && a.from <= b.to && b.from <= a.to) {
      problems.push(`${id}: act of ${a.actor} [${a.from}, ${a.to}] overlaps act of ${b.actor} [${b.from}, ${b.to}]`);
    }
  }));
  /** The actor's expression before `frame`: its latest face entry, `idle` before any. */
  const before = (actor: Actor, frame: number) => [...t.faces].filter((face) => face.actor === actor && face.at < frame).sort((a, b) => a.at - b.at).at(-1)?.expression ?? "idle";
  for (const emote of t.emotes) {
    const change = t.faces.find((face) => face.actor === emote.actor && face.at === emote.at);
    if (change === undefined || change.expression === before(emote.actor, emote.at)) {
      problems.push(`${id}: emote ${emote.kind} at frame ${emote.at} is not on an expression change of ${emote.actor}`);
    }
    // Gone before any act that starts after it enters.
    for (const act of t.acts.filter((candidate) => candidate.from > emote.at)) {
      const end = emoteEnd(emote, t.duration);
      if (end > act.from) problems.push(`${id}: emote ${emote.kind} is still visible at the act of ${act.actor} at frame ${act.from} (gone at ${end})`);
    }
  }
  t.emotes.forEach((a, i) => t.emotes.slice(i + 1).forEach((b) => {
    if (a.at < emoteEnd(b, t.duration) && b.at < emoteEnd(a, t.duration)) {
      problems.push(`${id}: emotes ${a.kind} [${a.at}, ${emoteEnd(a, t.duration)}) and ${b.kind} [${b.at}, ${emoteEnd(b, t.duration)}) are on screen together`);
    }
  }));
  return problems;
};

/** Nothing moves from the outro on (SCN-4): cues before it, pop-ins settled by it. */
const checkHold = (id: string, t: TakesTimeline, settle: number): string[] => {
  const problems: string[] = [];
  const before = (what: string, frame: number) => {
    if (frame >= t.outro) problems.push(`${id}: ${what} at frame ${frame} is at or after the outro (frame ${t.outro})`);
  };
  for (const act of t.acts) before(`act of ${act.actor} [${act.from}, ${act.to}]`, act.to);
  for (const face of t.faces) before(`face ${face.expression} of ${face.actor}`, face.at);
  for (const emote of t.emotes) if (emote.leaveAt !== null) before(`leave of emote ${emote.kind} (ends)`, emote.leaveAt + LEAVE_FRAMES);
  for (const trip of t.trips) before(`arrival of trip ${trip.id}`, trip.to);
  for (const [name, fade] of Object.entries(t.fades)) {
    before(`fade-in of ${name} (ends)`, fade.in[1]);
    if (fade.out) before(`fade-out of ${name} (ends)`, fade.out[1]);
  }
  before("rings fade (ends)", t.ringsFade[1]);
  for (const [name, at] of Object.entries(t.leaves)) before(`leave of ${name} (ends)`, at + LEAVE_FRAMES);
  for (const [name, frames] of Object.entries(t.cues)) for (const frame of frames) before(`cue ${name}`, frame);
  before("end of the rewind", t.rewind.to);
  const latest = t.outro - settle;
  const settled = (what: string, frame: number) => {
    if (frame > latest) problems.push(`${id}: ${what} at frame ${frame} is too late to settle by the outro (at most ${latest})`);
  };
  for (const [name, at] of Object.entries(t.pops)) settled(`pop-in ${name}`, at);
  for (const emote of t.emotes) settled(`emote ${emote.kind}`, emote.at);
  return problems;
};

/**
 * The takes rules (spec scene-catalogue, "Two-take scene kind", "Two-take cast
 * timing", "Two-take reading hold"); the common rules (phase ranges, order,
 * events inside phases) run before this in `checkTimeline`.
 */
export const checkTakes = (
  scene: { id: string; neutral?: boolean; timeline: TakesTimeline },
  readingHold: number = tokens.motion.readingHold,
  settle: number = tokens.motion.fps,
): string[] => {
  const { id, timeline: t } = scene;
  const problems: string[] = [];
  if (scene.neutral !== true) problems.push(`${id}: a takes scene is neutral (set neutral: true)`);
  if (t.outro > t.duration - readingHold) problems.push(`${id}: outro at frame ${t.outro} is inside the reading hold (must be at most ${t.duration - readingHold})`);
  t.phases.forEach((phase) => {
    if (phase.from >= t.outro) problems.push(`${id}: start of phase ${phase.id} at frame ${phase.from} is at or after the outro (frame ${t.outro})`);
    for (const event of phase.events) {
      if (event.at >= t.outro) problems.push(`${id}: event ${event.id} of phase ${phase.id} at frame ${event.at} is at or after the outro (frame ${t.outro})`);
    }
    if (phase.cites.length === 0 || phase.cites.some((line) => !Number.isInteger(line) || line < 1)) {
      problems.push(`${id}: phase ${phase.id} cites no valid article line (found ${JSON.stringify(phase.cites)}; each must be a positive integer)`);
    }
  });
  return [...problems, ...checkOrder(id, t.phases), ...checkCast(id, t), ...checkHold(id, t, settle)];
};

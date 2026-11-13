// The `sequence` scene kind (change sdd-scene-2-files, design §2.1): a neutral
// scene whose phases run once, in order, with no take and no rewind. Its
// timeline type and the checks the catalogue runs on it, with no React, so the
// CLI scripts and the tests import it under tsx.
//
// Why a kind of its own: the `takes` kind (takes-kind.ts) encodes a replay
// (take 1, one rewind, take 2), and the SDD files scene shows consecutive
// versions of one change (two NO-GO reviews, then the owner's GO), which a
// rewind would misstate. What it needs checked is the same as a `takes`
// scene's apart from the take order: an article line per phase (MOT-1), one
// actor at a time (CAST-4), emotes on expression changes and gone before the
// next action (CAST-3), and nothing moving in the final reading hold (SCN-4).
// Those rules are the `takes` kind's own `checkCast` and `checkHold`.
//
// How to run: `npm test -- test/scenes/catalogue-sequence.test.ts`.
// What can go wrong: nothing throws here; every problem is returned as a line
// that names the scene first, then the item and its frame.
import { tokens } from "../../tokens/generated/tokens";
import { checkCast, checkHold, type CueTimeline } from "./takes-kind";

/**
 * A reading device the article does not state, kept by the owner (MOT-1;
 * change sdd-scene-2-files, design §5): a finding marked on a row (and its
 * fix), a `NO-GO` stamp with no actor, the owner's `GO` stamp.
 */
export type SequenceDevice = "findingMark" | "noGoStamp" | "goStamp";

export type SequencePhase = {
  id: string;
  /** Inclusive frames. */
  from: number;
  to: number;
  /** Line numbers of the English source article this phase animates (MOT-1). */
  cites: readonly number[];
  devices?: readonly SequenceDevice[];
  /** The cue frames inside the phase: pop-ins, departures, arrivals, faces, acts, emote entrances and any other change the scene makes. */
  events: readonly { id: string; at: number }[];
};

export type SequenceTimeline = CueTimeline & { phases: readonly SequencePhase[] };

/**
 * The sequence rules (spec scene-catalogue, "Sequence scene kind", "Sequence
 * cast and hold"); the common rules (phase ranges, order, events inside
 * phases) run before this in `checkTimeline`.
 */
export const checkSequence = (
  scene: { id: string; neutral?: boolean; timeline: SequenceTimeline },
  readingHold: number = tokens.motion.readingHold,
  settle: number = tokens.motion.fps,
): string[] => {
  const { id, timeline: t } = scene;
  const problems: string[] = [];
  if (scene.neutral !== true) problems.push(`${id}: a sequence scene is neutral (set neutral: true)`);
  // The type has neither, but a fixture or a JSON-built entry can carry them at runtime.
  if ("rewind" in t) problems.push(`${id}: a sequence scene has no rewind`);
  for (const phase of t.phases) if ("take" in phase) problems.push(`${id}: phase ${phase.id} has a take; a sequence scene has none`);
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
  return [...problems, ...checkCast(id, t), ...checkHold(id, t, settle)];
};

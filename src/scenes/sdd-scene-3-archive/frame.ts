// The SDD archive scene at a frame (change sdd-scene-3-archive, design §2.2
// to §2.6 and §4): `frameAt(f)` returns the whole stage state as plain data
// with no React. stage.ts turns it into piece trees; Scene.tsx only draws
// them. Pure: a frame's state depends on nothing but `f`, so stills, renders
// and Studio can seek in any order, and vitest proves the timing without a
// browser.
//
// Pop-ins (design §2.5): an element popping at frame a is drawn once its
// opacity is above 0 and its scale above 0.001 (so from a + 1), and exactly
// settled from a + `motion.fps`. A folder or the `GO` stamp in flight is drawn
// from its trip's first frame, scaled as layout.ts says. A content change (a
// pill's text, a folder parking) is not a pop-in and takes effect at its own
// frame, with no +1 offset (design §2.5).
//
// How to run: `npm test -- test/scenes/sdd-scene-3-archive.test.ts`.
import { tokens } from "../../../tokens/generated/tokens";
import { emotePop, leave } from "../../brand/cast-motion";
import { blockPopIn, motionPathAt, pointAlong, type Point } from "../../brand/motion";
import type { CastExpression, EmoteKind } from "../../pieces/index.ts";
import { LEAVE_FRAMES } from "../takes-kind";
import {
  EMOTES, FIRST_FOLDER, GO, JOLT, JOLT_FRAMES, ROUTES, SECOND_FOLDER, VERDICT_CENTRE, folderScaleAt, goScaleAt,
} from "./layout";
import { timeline as defaultTimeline, type ArchiveTimeline, type CastActor, type CastSet } from "./timeline";

const { fps } = tokens.motion;
/** Below this scale an element is not drawn (and `pose` refuses scale 0). */
const MIN_SCALE = 0.001;

export type Appear = { opacity: number; scale: number };
const SETTLED: Appear = { opacity: 1, scale: 1 };
/** Is an element with this appearance drawn (design §2.5)? */
export const drawn = (a: Appear | null): a is Appear => a !== null && a.opacity > 0 && a.scale > MIN_SCALE;
const blockPop = (f: number, at: number): Appear | null => {
  if (f < at) return null;
  if (f >= at + fps) return SETTLED;
  const { opacity, scale } = blockPopIn(f, at);
  return drawn({ opacity, scale }) ? { opacity, scale } : null;
};
/** A pop-in that leaves over LEAVE_FRAMES from `leaveAt`: null once gone. */
const popAndLeave = (f: number, at: number, leaveAt: number): Appear | null => {
  const appear = blockPop(f, at);
  if (appear === null) return null;
  const opacity = appear.opacity * leave(f, leaveAt, LEAVE_FRAMES);
  return opacity > 0 ? { opacity, scale: appear.scale } : null;
};

export type BalaoState = { appear: Appear; expression: CastExpression; speaks: boolean; holdsStamp: boolean };
export type ChavesState = { appear: Appear; expression: CastExpression };
export type VisorState = { appear: Appear; expression: CastExpression; points: boolean };
/** A folder at a frame: its centre and scale, whether it is in flight, and its jolt angle. */
export type FolderState = { centre: Point; scale: number; inFlight: boolean; angle: number };
export type GoState = { centre: Point; scale: number; opacity: number; landed: boolean };
export type EmoteState = { kind: EmoteKind; x: number; y: number; scale: number; opacity: number };
export type BookState = { appear: Appear; angle: number };
export type FieldPillState = { appear: Appear; text: "was" | "now" };

export type ArchiveState = {
  balao: BalaoState | null;
  chaves: ChavesState | null;
  visor: VisorState | null;
  book: BookState | null;
  fieldPill: FieldPillState | null;
  firstFolder: FolderState | null;
  secondFolder: FolderState | null;
  /** The single finding's `?` pill above the second folder. */
  finding: Appear | null;
  go: GoState | null;
  paths: { go: number };
  emote: EmoteState | null;
};

/** The cast's action parameters at `f`: the defaults, then every action up to `f`. */
const castAt = (t: ArchiveTimeline, f: number) => {
  const pose = { balao: { speaks: false, holdsStamp: false }, visor: { points: false } };
  for (const a of [...t.actions].sort((p, q) => p.at - q.at)) {
    if (a.at > f) continue;
    const set: CastSet = a.set;
    if (a.actor === "balao") pose.balao = { speaks: set.speaks ?? pose.balao.speaks, holdsStamp: set.holdsStamp ?? pose.balao.holdsStamp };
    else if (a.actor === "visor") pose.visor = { points: set.points ?? pose.visor.points };
  }
  return pose;
};

/** An actor's expression at `f`: its latest face entry, `idle` before any. */
const faceAt = (t: ArchiveTimeline, actor: CastActor, f: number): CastExpression =>
  [...t.faces].filter((face) => face.actor === actor && face.at <= f).sort((a, b) => a.at - b.at).at(-1)?.expression ?? "idle";

const tripById = (t: ArchiveTimeline, id: string) => {
  const trip = t.trips.find((candidate) => candidate.id === id);
  if (!trip) throw new Error(`sdd-scene-3-archive: no trip ${id}`);
  return trip;
};
const along = (route: string, progress: number): Point => {
  const point = pointAlong(ROUTES[route], progress);
  if (point === null) throw new Error(`sdd-scene-3-archive: route ${route} gives no point at ${progress}`);
  return point;
};

/** The jolt angle of `id` at `f` (design §2.3, §2.6): from its single start, for JOLT_FRAMES frames, else 0. */
export const joltAt = (t: ArchiveTimeline, id: "book" | "secondFolder", f: number): number => {
  const j = t.jolts.find((candidate) => candidate.id === id && f >= candidate.at && f < candidate.at + JOLT_FRAMES);
  if (j === undefined) return 0;
  const k = f - j.at;
  return JOLT.amplitude * Math.sin((2 * Math.PI * k) / JOLT.period) * (1 - k / JOLT_FRAMES);
};

/** A folder before its trip (at its start slot), in flight, or parked (design §4.2). */
const folderAt = (
  t: ArchiveTimeline,
  popAt: number,
  tripId: string,
  start: { centre: Point; scale: number },
  parked: { centre: Point; scale: number },
  angle: number,
  f: number,
): FolderState | null => {
  if (f < popAt) return null;
  const trip = tripById(t, tripId);
  if (f < trip.from) return { centre: start.centre, scale: start.scale, inFlight: false, angle };
  if (f < trip.to) {
    const progress = (f - trip.from) / (trip.to - trip.from);
    return { centre: along(tripId, progress), scale: folderScaleAt(start.scale, parked.scale, progress), inFlight: true, angle: 0 };
  }
  return { centre: parked.centre, scale: parked.scale, inFlight: false, angle: 0 };
};

/** The `GO` stamp after Balão lets go: in flight, landed, then leaving (design §2.2, §2.6). */
const goAt = (t: ArchiveTimeline, f: number): GoState | null => {
  const trip = tripById(t, "go");
  if (f < trip.from) return null;
  if (f < trip.to) {
    const progress = (f - trip.from) / (trip.to - trip.from);
    return { centre: along("go", progress), scale: goScaleAt(progress), opacity: 1, landed: false };
  }
  const opacity = leave(f, t.leaves.go, LEAVE_FRAMES);
  return opacity > 0 ? { centre: VERDICT_CENTRE, scale: GO.scaleTo, opacity, landed: true } : null;
};

/** The one emote on screen at `f`: `worked` stays (leaveAt null), present from its own `at` (design §2.5). */
const emoteAt = (t: ArchiveTimeline, f: number): EmoteState | null => {
  for (const e of t.emotes) {
    if (f < e.at) continue;
    const base = EMOTES[e.kind as keyof typeof EMOTES];
    const pop = f >= e.at + fps ? 1 : emotePop(f, e.at);
    const scale = base.scale * Math.max(pop, MIN_SCALE / base.scale);
    return { kind: e.kind, x: base.x, y: base.y, scale, opacity: 1 };
  }
  return null;
};

/**
 * The state of every element at `frame`. From the outro the scene is a still
 * (design §4, "500-599 | everything | still"): every frame from `t.outro` on
 * reads as `t.outro` itself, so "Archive final hold identical" holds by construction.
 */
export const frameAt = (rawFrame: number, t: ArchiveTimeline = defaultTimeline): ArchiveState => {
  const f = Math.min(rawFrame, t.outro);
  const cast = castAt(t, f);
  const castPop = (actor: CastActor) => blockPop(f, t.pops[actor]);
  const balaoAppear = castPop("balao"), chavesAppear = castPop("chaves"), visorAppear = castPop("visor");
  const bookAppear = blockPop(f, t.pops.book);
  const fieldPillAppear = blockPop(f, t.pops.fieldPill);
  return {
    balao: balaoAppear === null ? null : { appear: balaoAppear, expression: faceAt(t, "balao", f), ...cast.balao },
    chaves: chavesAppear === null ? null : { appear: chavesAppear, expression: faceAt(t, "chaves", f) },
    visor: visorAppear === null ? null : { appear: visorAppear, expression: faceAt(t, "visor", f), ...cast.visor },
    book: bookAppear === null ? null : { appear: bookAppear, angle: joltAt(t, "book", f) },
    fieldPill: fieldPillAppear === null ? null : { appear: fieldPillAppear, text: f >= t.cues.fieldFlip[0] ? "now" : "was" },
    firstFolder: folderAt(t, t.pops.firstFolder, "archive-1", FIRST_FOLDER.start, FIRST_FOLDER.parked, 0, f),
    secondFolder: folderAt(t, t.pops.secondFolder, "archive-2", SECOND_FOLDER.start, SECOND_FOLDER.parked, joltAt(t, "secondFolder", f), f),
    finding: popAndLeave(f, t.pops.findingMark, t.leaves.findingMark),
    go: goAt(t, f),
    paths: { go: motionPathAt(f, t.fades.goGuide.in, t.fades.goGuide.out) },
    emote: emoteAt(t, f),
  };
};

// The SDD files scene at a frame (change sdd-scene-2-files, design §2.3 to
// §2.5, §2.7 and §4): `frameAt(f)` returns the whole stage state as plain data
// with no React. stage.ts turns it into piece trees; Scene.tsx only draws them.
// Pure: a frame's state depends on nothing but `f`, so stills, renders and
// Studio can seek in any order, and vitest proves the timing without a browser.
//
// Pop-ins (design §2.5): an element popping at frame a is drawn once its
// opacity is above 0 and its scale above 0.001 (so from a + 1), and exactly
// settled from a + `motion.fps`. A file or the `GO` stamp in flight is drawn
// from its trip's first frame, scaled as layout.ts says.
//
// How to run: `npm test -- test/scenes/sdd-scene-2-files.test.ts`.
import { tokens } from "../../../tokens/generated/tokens";
import { emotePop, leave } from "../../brand/cast-motion";
import { blockPopIn, motionPathAt, pointAlong, type Point } from "../../brand/motion";
import type { CastExpression, EmoteKind } from "../../pieces/index.ts";
import { LEAVE_FRAMES } from "../takes-kind";
import { EMOTES, GO, JOLT, ROUTES, ROW_BARS, VERDICT_CENTRE, fileScaleAt, goScaleAt, slotCentre } from "./layout";
import { FILES, JOLT_FRAMES, timeline as defaultTimeline, type CastActor, type CastSet, type FileId, type FilesTimeline, type RowState } from "./timeline";

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
export type ChavesState = { appear: Appear; expression: CastExpression; types: boolean };
export type VisorState = { appear: Appear; expression: CastExpression; points: boolean };
/**
 * A file at a frame: its centre and scale (in flight it grows, at its slot it is
 * 1), its jolt angle in degrees, and the state of each of its rows drawn so far.
 */
export type FileState = { id: FileId; centre: Point; scale: number; inFlight: boolean; angle: number; rows: readonly RowState[] };
export type StampState = { id: "no-go-1" | "no-go-2"; appear: Appear };
export type GoState = { centre: Point; scale: number; landed: boolean };
export type EmoteState = { kind: EmoteKind; x: number; y: number; scale: number; opacity: number };

export type FilesState = {
  laptop: Appear | null;
  screen: { commandLine: boolean; codeLines: number };
  balao: BalaoState | null;
  chaves: ChavesState | null;
  visor: VisorState | null;
  /** The `openspec/` folder and its name. */
  folder: Appear | null;
  files: readonly FileState[];
  /** The `NO-GO` on screen, if any (one at a time). */
  noGo: StampState | null;
  go: GoState | null;
  paths: { go: number };
  emote: EmoteState | null;
};

const count = (frames: readonly number[], at: number) => frames.filter((frame) => frame <= at).length;

/** The cast's action parameters at `f`: the defaults, then every action up to `f`. */
const castAt = (t: FilesTimeline, f: number) => {
  const pose = { balao: { speaks: false, holdsStamp: false }, chaves: { types: false }, visor: { points: false } };
  for (const a of [...t.actions].sort((p, q) => p.at - q.at)) {
    if (a.at > f) continue;
    const set: CastSet = a.set;
    if (a.actor === "balao") pose.balao = { speaks: set.speaks ?? pose.balao.speaks, holdsStamp: set.holdsStamp ?? pose.balao.holdsStamp };
    else if (a.actor === "chaves") pose.chaves = { types: set.types ?? pose.chaves.types };
    else pose.visor = { points: set.points ?? pose.visor.points };
  }
  return pose;
};

/** An actor's expression at `f`: its latest face entry, `idle` before any. */
const faceAt = (t: FilesTimeline, actor: CastActor, f: number): CastExpression =>
  [...t.faces].filter((face) => face.actor === actor && face.at <= f).sort((a, b) => a.at - b.at).at(-1)?.expression ?? "idle";

const tripById = (t: FilesTimeline, id: string) => {
  const trip = t.trips.find((candidate) => candidate.id === id);
  if (!trip) throw new Error(`sdd-scene-2-files: no trip ${id}`);
  return trip;
};
const along = (route: string, progress: number): Point => {
  const point = pointAlong(ROUTES[route], progress);
  if (point === null) throw new Error(`sdd-scene-2-files: route ${route} gives no point at ${progress}`);
  return point;
};

/** A row's state at `f`: its latest change at or before `f`, `plain` before any (design §2.7). */
const rowAt = (t: FilesTimeline, file: FileId, row: number, f: number): RowState =>
  t.rows.filter((c) => c.file === file && c.row === row && c.at <= f).sort((a, b) => a.at - b.at).at(-1)?.to ?? "plain";

/** The jolt angle of `file` at `f` (design §2.3): from each finding on its rows, for JOLT_FRAMES frames. */
export const joltAt = (t: FilesTimeline, file: FileId, f: number): number => {
  const start = t.rows.filter((c) => c.file === file && c.to === "flagged" && c.at <= f && f < c.at + JOLT_FRAMES).at(-1);
  if (start === undefined) return 0;
  const k = f - start.at;
  return JOLT.amplitude * Math.sin((2 * Math.PI * k) / JOLT.period) * (1 - k / JOLT_FRAMES);
};

/** The four files at `f`: none before its trip, in flight, then at its slot. `proposal.md`'s rows appear one by one. */
const filesAt = (t: FilesTimeline, f: number): FileState[] =>
  FILES.flatMap((id): FileState[] => {
    const trip = tripById(t, `file-${id}`);
    if (f < trip.from) return [];
    const inFlight = f < trip.to;
    const progress = inFlight ? (f - trip.from) / (trip.to - trip.from) : 1;
    const shown = id === "proposal" ? count(t.cues.rows, f) : ROW_BARS[id].length;
    return [{
      id,
      centre: inFlight ? along(trip.route, progress) : slotCentre(id),
      scale: inFlight ? fileScaleAt(progress) : 1,
      inFlight,
      angle: joltAt(t, id, f),
      rows: Array.from({ length: shown }, (_, i) => rowAt(t, id, i + 1, f)),
    }];
  });

/** The `GO` stamp after Balão lets go: in flight, then landed (design §2.4). */
const goAt = (t: FilesTimeline, f: number): GoState | null => {
  const trip = tripById(t, "go");
  if (f < trip.from) return null;
  if (f >= trip.to) return { centre: VERDICT_CENTRE, scale: GO.scaleTo, landed: true };
  const progress = (f - trip.from) / (trip.to - trip.from);
  return { centre: along(trip.route, progress), scale: goScaleAt(progress), landed: false };
};

/**
 * The one emote on screen at `f`. The `worked` emote stays (`leaveAt` null,
 * design §4.2, 736): it is present from its own `at`, its scale floored at
 * MIN_SCALE on that first frame (scene 1's rule, design §2.5).
 */
const emoteAt = (t: FilesTimeline, f: number): EmoteState | null => {
  for (const e of t.emotes) {
    if (f < e.at) continue;
    const base = EMOTES[e.kind as keyof typeof EMOTES];
    const pop = f >= e.at + fps ? 1 : emotePop(f, e.at);
    const scale = base.scale * (e.leaveAt === null ? Math.max(pop, MIN_SCALE / base.scale) : pop);
    const opacity = e.leaveAt === null ? 1 : leave(f, e.leaveAt, LEAVE_FRAMES);
    if (opacity > 0 && (e.leaveAt === null || scale > MIN_SCALE)) return { kind: e.kind, x: base.x, y: base.y, scale, opacity };
  }
  return null;
};

/**
 * The state of every element at `frame`. From the outro the scene is a still
 * (design §4, "770–869 | everything | still"): every frame from `t.outro` on
 * reads as `t.outro` itself, so "Files final hold identical" holds by construction.
 */
export const frameAt = (rawFrame: number, t: FilesTimeline = defaultTimeline): FilesState => {
  const f = Math.min(rawFrame, t.outro);
  const cast = castAt(t, f);
  const castPop = (actor: CastActor) => blockPop(f, t.pops[actor]);
  const balaoAppear = castPop("balao"), chavesAppear = castPop("chaves"), visorAppear = castPop("visor");
  const noGo1 = popAndLeave(f, t.pops.noGo1, t.leaves.noGo1), noGo2 = popAndLeave(f, t.pops.noGo2, t.leaves.noGo2);
  return {
    laptop: blockPop(f, t.pops.laptop),
    screen: { commandLine: f >= t.cues.commandLine[0], codeLines: count(t.cues.codeLines, f) },
    balao: balaoAppear === null ? null : { appear: balaoAppear, expression: faceAt(t, "balao", f), ...cast.balao },
    chaves: chavesAppear === null ? null : { appear: chavesAppear, expression: faceAt(t, "chaves", f), ...cast.chaves },
    visor: visorAppear === null ? null : { appear: visorAppear, expression: faceAt(t, "visor", f), ...cast.visor },
    folder: popAndLeave(f, t.pops.folder, t.leaves.folder),
    files: filesAt(t, f),
    noGo: noGo1 !== null ? { id: "no-go-1", appear: noGo1 } : noGo2 !== null ? { id: "no-go-2", appear: noGo2 } : null,
    go: goAt(t, f),
    paths: { go: motionPathAt(f, t.fades.goGuide.in, t.fades.goGuide.out) },
    emote: emoteAt(t, f),
  };
};

// The SDD scene's frame logic (change sdd-without-with-spec-scene, design §2.5,
// §2.6 and §4): what every element is at a frame, as plain data. Pure
// functions of the frame number, with no accumulated state, so stills,
// renders and Studio can seek in any order, and vitest proves the timing
// without a browser. stage.ts turns this state into piece trees; Scene.tsx
// draws them.
//
// The rewind: take 1's objects (the `?` in the balloon and in flight, the code
// lines, path P1, the failure arrow) are computed from an object frame
// `objectFrame(f)`, which runs take 1 backwards from 344 to 377 and holds the
// request's frame (89) until take 2 starts; Visor is not an object and resets
// at once. From take 2 on, take 1's objects are not drawn.
//
// Pop-ins (design §2.6): an element is drawn when its opacity is above 0 and
// its scale above 0.001, so it first shows one frame after its pop frame; from
// its pop frame + `motion.fps` it is exactly settled (opacity 1, scale 1), so
// the two takes' first frames and the final hold compare exactly.
import { tokens } from "../../../tokens/generated/tokens";
import { emotePop, leave, squashAfter } from "../../brand/cast-motion";
import { blockPopIn, fadeIn, motionPathAt, pillPopIn, pointAlong, type Appearance, type Point } from "../../brand/motion";
import type { CastExpression, EmoteKind } from "../../pieces/index.ts";
import { LEAVE_FRAMES, type TakesTimeline } from "../takes-kind";
import { EMOTES, PAGE_HELD, PAGE_REST, ROUTES } from "./layout";
import { QUESTIONS, timeline as sceneTimeline } from "./timeline";

/** Frames after its pop frame from which an element is drawn exactly settled. */
export const SETTLE = tokens.motion.fps;
/** Below this scale an element is not drawn (and `pose` refuses scale 0). */
const MIN_SCALE = 0.001;
/** Visor's fright (design §4, beat 3; a reading device, q48 A): tilt in degrees and squash amplitude. */
export const FRIGHT = { tilt: -5, squash: -0.07 } as const;

const SETTLED: Appearance = { opacity: 1, scale: 1 };
const isDrawn = (a: Appearance): boolean => a.opacity > 0 && a.scale > MIN_SCALE;
/** A pop-in at `at`, exactly settled from `at + SETTLE`; null while not drawn. */
const popAt = (frame: number, at: number, helper: (frame: number, at: number) => Appearance): Appearance | null => {
  if (frame >= at + SETTLE) return SETTLED;
  const { opacity, scale } = helper(frame, at);
  return isDrawn({ opacity, scale }) ? { opacity, scale } : null;
};
const block = (frame: number, at: number) => popAt(frame, at, blockPopIn);
const pill = (frame: number, at: number) => popAt(frame, at, pillPopIn);

export type InFlight = { id: string; point: Point; progress: number };
export type Emote = { kind: EmoteKind; x: number; y: number; scale: number; opacity: number };

export type SddState = {
  /** The frame take 1's objects are drawn from (design §2.5). */
  objectFrame: number;
  codePanel: { appear: Appearance; lines: number } | null;
  balloon: Appearance | null;
  /** The `?` waiting in slot i, or null once it left (or before it popped in). */
  slots: (Appearance | null)[];
  /** `?` travelling (take 1 into the code, take 2 into the sheet). */
  questions: InFlight[];
  /** Answers travelling from the balloon to the page (take 2). */
  answers: InFlight[];
  paths: { p1: number; p2: number; p3: number };
  failureArrow: number;
  visor: {
    appear: Appearance;
    expression: CastExpression;
    points: boolean;
    tilt: number;
    squash: number;
    /** Question rows on the sheet Visor holds, or null when it holds none. */
    held: { questions: number } | null;
  } | null;
  /** `proposal.md` after the hand-over: its top-left, its question rows and how many are checked. */
  page: { at: Point; questions: number; checked: number } | null;
  stamp: Appearance | null;
  badge: { text: "1" | "2"; appear: Appearance } | null;
  rewindMark: Appearance | null;
  emote: Emote | null;
};

const count = (frames: readonly number[], frame: number) => frames.filter((at) => at <= frame).length;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** First frame of take 2: the first take-2 phase's start. */
export const take2Start = (t: TakesTimeline = sceneTimeline): number => t.phases.find((phase) => phase.take === 2)!.from;

/** The object frame (design §2.5): `f` before the rewind; take 1 backwards during it; the rewind's end until take 2. */
export const objectFrame = (frame: number, t: TakesTimeline = sceneTimeline): number => {
  const { from, to, objects } = t.rewind;
  if (frame < from) return frame;
  if (frame <= to) return Math.round(objects[0] - ((frame - from) * (objects[0] - objects[1])) / (to - from));
  if (frame < take2Start(t)) return objects[1];
  return frame;
};

const tripsOf = (t: TakesTimeline, kind: string) => t.trips.filter((trip) => trip.id.startsWith(`${kind}-`));
const inFlight = (t: TakesTimeline, kind: string, frame: number): InFlight[] =>
  tripsOf(t, kind)
    .filter((trip) => frame >= trip.from && frame < trip.to)
    .map((trip) => {
      const progress = (frame - trip.from) / (trip.to - trip.from);
      const point = pointAlong(ROUTES[trip.route], progress);
      if (point === null) throw new Error(`sdd-without-with-spec: route ${trip.route} gives no point at ${progress}`);
      return { id: trip.id, point, progress };
    });

/** The state of every element at `frame`. */
export const frameAt = (frame: number, t: TakesTimeline = sceneTimeline): SddState => {
  const o = objectFrame(frame, t);
  const inTake2 = frame >= take2Start(t);
  const pops = t.pops;
  // Visor's four acts in frame order (design §4): it points, resets, holds the sheet, points again.
  const acts = t.acts.filter((act) => act.actor === "visor").sort((a, b) => a.from - b.from);
  const [pointAct, resetAct, holdAct, implementAct] = acts;
  const handOver = t.trips.find((trip) => trip.id === "handover")!;
  const fright = t.faces.find((face) => face.expression === "failed")!;

  // Slots: take 1 from the object frame, take 2 from the real frame.
  const slots = Array.from({ length: QUESTIONS }, (_, i) => {
    const leaves = inTake2 ? tripsOf(t, "ask")[i].from : tripsOf(t, "guess")[i].from;
    const at = inTake2 ? frame : o;
    return at < leaves ? pill(at, pops[`slot-${i}`]) : null;
  });

  const visorAppear = block(frame, pops.visor);
  const expression = t.faces.filter((face) => face.actor === "visor" && face.at <= frame).sort((a, b) => a.at - b.at).at(-1)?.expression ?? "idle";
  const frightened = frame >= fright.at && frame < resetAct.from;
  const holding = frame >= holdAct.from && frame < handOver.from;

  const emote = t.emotes
    .map((e): Emote | null => {
      if (frame < e.at) return null;
      const base = EMOTES[e.kind as keyof typeof EMOTES];
      const scale = base.scale * (frame >= e.at + SETTLE ? 1 : emotePop(frame, e.at));
      const opacity = e.leaveAt === null ? 1 : leave(frame, e.leaveAt, LEAVE_FRAMES);
      return opacity > 0 && scale > MIN_SCALE ? { kind: e.kind, x: base.x, y: base.y, scale, opacity } : null;
    })
    .find((e) => e !== null) ?? null;

  const rewindMark = (() => {
    const appear = pill(frame, pops.rewindMark);
    if (appear === null) return null;
    const opacity = appear.opacity * leave(frame, t.leaves.rewindMark, LEAVE_FRAMES);
    return opacity > 0 ? { opacity, scale: appear.scale } : null;
  })();

  const badgeSwap = t.cues.badgeSwap[0];
  const badgeAppear = frame < badgeSwap ? pill(frame, pops.badge1) : pill(frame, pops.badge2);
  const handOverT = Math.min(1, (frame - handOver.from) / (handOver.to - handOver.from));
  const codeAppear = block(frame, pops.codePanel);

  return {
    objectFrame: o,
    codePanel: codeAppear === null ? null : { appear: codeAppear, lines: inTake2 ? count(t.cues.take2Lines, frame) : count(t.cues.take1Lines, o) },
    balloon: block(frame, pops.balloon),
    slots,
    questions: inTake2 ? inFlight(t, "ask", frame) : inFlight(t, "guess", o),
    answers: inFlight(t, "answer", frame),
    paths: {
      p1: inTake2 ? 0 : motionPathAt(o, t.fades.p1.in, t.fades.p1.out),
      p2: motionPathAt(frame, t.fades.p2.in, t.fades.p2.out),
      p3: motionPathAt(frame, t.fades.p3.in),
    },
    failureArrow: inTake2 ? 0 : fadeIn(o, t.fades.failureArrow.in),
    visor: visorAppear === null ? null : {
      appear: visorAppear,
      expression,
      points: (frame >= pointAct.from && frame < resetAct.from) || frame >= implementAct.from,
      tilt: frightened ? FRIGHT.tilt : 0,
      squash: frightened ? squashAfter(frame, fright.at, FRIGHT.squash) : 1,
      held: holding ? { questions: count(t.cues.rows, frame) } : null,
    },
    page: frame < handOver.from ? null : {
      at: { x: lerp(PAGE_HELD.x, PAGE_REST.x, handOverT), y: lerp(PAGE_HELD.y, PAGE_REST.y, handOverT) },
      questions: QUESTIONS,
      checked: count(t.cues.checks, frame),
    },
    stamp: block(frame, pops.stamp),
    badge: badgeAppear === null ? null : { text: frame < badgeSwap ? "1" : "2", appear: badgeAppear },
    rewindMark,
    emote,
  };
};

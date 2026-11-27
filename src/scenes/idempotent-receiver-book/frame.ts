// The Idempotent Receiver book scene at a frame (card SW-160; change
// idempotent-receiver-book-scene, design §2.3 and §4): `frameAt(f)` returns
// the whole stage state as plain data with no React. stage.ts turns it into
// piece trees; Scene.tsx only draws them. Pure: a frame's state depends on
// nothing but `f`, so stills, renders and Studio can seek in any order, and
// vitest proves the timing without a browser.
//
// Takes (design §2.3): before take 2 the stage is drawn from the object frame
// `objectFrame(f)`, which runs take 1 backwards during the rewind; the badge
// and the rewind mark read the real frame. From take 2 everything reads the
// real frame, with take 2's own trips.
//
// Pop-ins: an element popping at frame a is drawn once its opacity is above 0
// and its scale above 0.001 (so from a + 1), and exactly settled from a +
// `motion.fps`.
//
// How to run: `npm test -- test/scenes/idempotent-receiver-book.test.ts`.
import { tokens } from "../../../tokens/generated/tokens";
import { leave } from "../../brand/cast-motion";
import { blockPopIn, fadeIn, motionPathAt, pillPopIn, pointAlong, type Point } from "../../brand/motion";
import { LEAVE_FRAMES } from "../takes-kind";
import { AT, ROUTES } from "./layout";
import { objectFrameOf, timeline as defaultTimeline, type BookTimeline } from "./timeline";

const { fps } = tokens.motion;
/** Below this scale an element is not drawn. */
const MIN_SCALE = 0.001;

export type Appear = { opacity: number; scale: number };
const SETTLED: Appear = { opacity: 1, scale: 1 };
/** Is an element with this appearance drawn? */
export const drawn = (a: Appear | null): a is Appear => a !== null && a.opacity > 0 && a.scale > MIN_SCALE;
const popWith = (helper: (f: number, at: number) => Appear) => (f: number, at: number): Appear | null => {
  if (f < at) return null;
  if (f >= at + fps) return SETTLED;
  const { opacity, scale } = helper(f, at);
  return drawn({ opacity, scale }) ? { opacity, scale } : null;
};
const blockPop = popWith(blockPopIn);
const pillPop = popWith(pillPopIn);
/** A pop-in that leaves over LEAVE_FRAMES from `leaveAt`: null once gone. */
const popAndLeave = (f: number, at: number, leaveAt: number): Appear | null => {
  const appear = pillPop(f, at);
  if (appear === null) return null;
  const opacity = appear.opacity * leave(f, leaveAt, LEAVE_FRAMES);
  return opacity > 0 ? { opacity, scale: appear.scale } : null;
};

/** A message token's outcome colour: white in flight, green once processed, orange once ignored (ADR 0006 `color.state.*`). */
export type TokenFill = "white" | "healthy" | "blocked";
export type TokenState = { id: "message" | "copy"; point: Point; fill: TokenFill; appear: Appear };

export type BookState = {
  /** The frame the stage is drawn from (design §2.3). */
  objectFrame: number;
  take: 1 | 2;
  sender: Appear | null;
  channel: Appear | null;
  receiver: Appear | null;
  store: Appear | null;
  /** The ID 42 in the store. */
  stored: Appear | null;
  /** Is the receiver looking up its store? */
  lookup: boolean;
  question: Appear | null;
  check: Appear | null;
  messages: readonly TokenState[];
  /** Take 1's result beside take 2's (0 until take 2's comparison), times `motion.dimOpacity` when drawn. */
  ghost: number;
  paths: { p1: number; p2: number; p3: number };
  badge: { take: 1 | 2; appear: Appear } | null;
  rewindMark: Appear | null;
};

/** The rewind's object frame (design §2.3). */
export const objectFrame = (f: number, t: BookTimeline = defaultTimeline): number => objectFrameOf(f, t.rewind);
/** First frame of take 2. */
export const take2Start = (t: BookTimeline = defaultTimeline): number => t.phases.find((phase) => phase.take === 2)!.from;

const tripById = (t: BookTimeline, id: string) => {
  const trip = t.trips.find((candidate) => candidate.id === id);
  if (!trip) throw new Error(`idempotent-receiver-book: no trip ${id}`);
  return trip;
};
const along = (route: string, progress: number): Point => {
  const point = pointAlong(ROUTES[route], progress);
  if (point === null) throw new Error(`idempotent-receiver-book: route ${route} gives no point at ${progress}`);
  return point;
};

/**
 * Where a token is at `x` along consecutive legs: at each leg's start until it
 * departs, on its route while it travels, at `rest` from the last arrival.
 */
const placeAt = (t: BookTimeline, x: number, legs: readonly { trip: string; start: Point }[], rest: Point): Point => {
  for (const leg of legs) {
    const trip = tripById(t, leg.trip);
    if (x < trip.from) return leg.start;
    if (x < trip.to) return along(trip.route, (x - trip.from) / (trip.to - trip.from));
  }
  return rest;
};

/** The message of a take, and in take 2 its copy (design §4.2). */
const messagesAt = (t: BookTimeline, take: 1 | 2, x: number): TokenState[] => {
  const s = `t${take}`;
  const out: TokenState[] = [];
  const message = pillPop(x, t.pops[`message-${s}`]);
  if (message !== null) {
    out.push({
      id: "message",
      appear: message,
      point: placeAt(t, x, [
        { trip: `send-${s}`, start: AT.sender },
        { trip: `deliver-${s}`, start: AT.channel },
        { trip: `process-${s}`, start: AT.door },
      ], AT.processed),
      fill: x >= t.cues.processed[take - 1] ? "healthy" : "white",
    });
  }
  if (take === 2) {
    const copy = pillPop(x, t.pops.copy);
    if (copy !== null) {
      out.push({
        id: "copy",
        appear: copy,
        point: placeAt(t, x, [
          { trip: "deliver2-t2", start: AT.channel },
          { trip: "ignore-t2", start: AT.door },
        ], AT.ignored),
        fill: x >= t.cues.ignored[0] ? "blocked" : "white",
      });
    }
  }
  return out;
};

/**
 * The state of every element at `frame`. From the outro the scene is a still:
 * every frame from `t.outro` on reads as `t.outro` itself, so "Final hold
 * identical" holds by construction.
 */
export const frameAt = (rawFrame: number, t: BookTimeline = defaultTimeline): BookState => {
  const frame = Math.min(rawFrame, t.outro);
  const start = take2Start(t);
  const take: 1 | 2 = frame >= start ? 2 : 1;
  const x = take === 2 ? frame : objectFrame(frame, t);
  const s = `t${take}`;
  const fade = (name: string) => t.fades[name];
  const lookup = t.cues.lookupOn.some((on, i) => x >= on && x < t.cues.lookupOff[i]);

  const rewindMark = (() => {
    const appear = pillPop(frame, t.pops.rewindMark);
    if (appear === null) return null;
    const opacity = appear.opacity * leave(frame, t.leaves.rewindMark, LEAVE_FRAMES);
    return opacity > 0 ? { opacity, scale: appear.scale } : null;
  })();
  // The badge pops once and never fades out; the swap only flips the take number it reads (as in sdd-request-relay).
  const badgeAppear = pillPop(frame, t.pops.badge1);

  return {
    objectFrame: x,
    take,
    sender: blockPop(x, t.pops.sender),
    channel: blockPop(x, t.pops.channel),
    receiver: blockPop(x, t.pops.receiver),
    store: blockPop(x, t.pops.store),
    stored: pillPop(x, t.pops[`stored-${s}`]),
    lookup,
    question: popAndLeave(x, t.pops[`question-${s}`], t.leaves[`question-${s}`]),
    check: blockPop(x, t.pops[`check-${s}`]),
    messages: messagesAt(t, take, x),
    ghost: take === 2 ? fadeIn(x, fade("ghost").in) : 0,
    paths: take === 1
      ? { p1: motionPathAt(x, fade("p1-t1").in, fade("p1-t1").out), p2: motionPathAt(x, fade("p2-t1").in, fade("p2-t1").out), p3: 0 }
      : {
          p1: motionPathAt(x, fade("p1-t2").in, fade("p1-t2").out),
          p2: motionPathAt(x, fade("p2-t2").in, fade("p2-t2").out),
          p3: motionPathAt(x, fade("p3-t2").in, fade("p3-t2").out),
        },
    badge: badgeAppear === null ? null : { take: frame < t.cues.badgeSwap[0] ? 1 : 2, appear: badgeAppear },
    rewindMark,
  };
};

// The Idempotent Receiver Mule scene at a frame (card SW-160; change
// idempotent-receiver-mule-scene, design §2.3 and §4): `frameAt(f)` returns
// the whole stage state as plain data with no React. stage.ts turns it into
// piece trees; Scene.tsx only draws them. Pure: a frame's state depends on
// nothing but `f`, so stills, renders and Studio can seek in any order, and
// vitest proves the timing without a browser.
//
// Takes (design §2.3): before take 2 the stage, Balão included, is drawn from
// the object frame `objectFrame(f)`, which runs take 1 backwards during the
// rewind; the badge, the rewind mark and the emotes read the real frame (an
// emote is not replayed by the rewind, as in sdd-request-relay). From take 2
// everything reads the real frame, with take 2's own trips.
//
// Pop-ins: an element popping at frame a is drawn once its opacity is above 0
// and its scale above 0.001 (so from a + 1), and exactly settled from a +
// `motion.fps`.
//
// How to run: `npm test -- test/scenes/idempotent-receiver-mule.test.ts`.
import { spring } from "remotion";
import { tokens } from "../../../tokens/generated/tokens";
import { emotePop, leave } from "../../brand/cast-motion";
import { blockPopIn, fadeIn, motionPathAt, pillPopIn, pointAlong, type Point } from "../../brand/motion";
import type { CastExpression, EmoteKind } from "../../pieces/index.ts";
import { LEAVE_FRAMES } from "../takes-kind";
import { AT, ROUTES } from "./layout";
import { objectFrameOf, timeline as defaultTimeline, type Focus, type MuleTimeline } from "./timeline";

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
const popAndLeave = (f: number, at: number, leaveAt: number | undefined): Appear | null => {
  const appear = pillPop(f, at);
  if (appear === null) return null;
  const opacity = appear.opacity * (leaveAt === undefined ? 1 : leave(f, leaveAt, LEAVE_FRAMES));
  return opacity > 0 ? { opacity, scale: appear.scale } : null;
};

/**
 * A store's focus at a match (design §2.5), 0 to 1: it rises with the focus
 * spring from `on`, falls with it from `off`, and is exactly 1 or 0 once the
 * spring has had `motion.fps` frames, so the final hold cannot move.
 */
const focusAt = (x: number, { on, off }: Focus): number => {
  const rise = (from: number) => (x >= from + fps ? 1 : spring({ frame: x - from, fps, config: tokens.motion.focus }));
  if (x < on) return 0;
  if (x < off) return rise(on);
  return 1 - rise(off);
};

/** A token's colour: white in flight, then the state its outcome means (ADR 0006 `color.state.*`). */
export type TokenFill = "white" | "healthy" | "blocked" | "failure";
export type TokenId = "request" | "retry" | "answer" | "duplicate";
export type TokenState = { id: TokenId; word: "id" | "accepted" | "duplicate" | "failed"; point: Point; fill: TokenFill; appear: Appear };
export type BalaoState = { appear: Appear; expression: CastExpression; speaks: boolean };
export type EmoteState = { kind: EmoteKind; scale: number; opacity: number };

export type MuleState = {
  /** The frame the stage is drawn from (design §2.3). */
  objectFrame: number;
  take: 1 | 2;
  balao: BalaoState | null;
  listener: Appear | null;
  validator: Appear | null;
  charge: Appear | null;
  store: Appear | null;
  /** The `orderId` in the store. */
  stored: Appear | null;
  /** The store's focus scale at a match, store and stored ID together (1 at rest, up to `motion.focusScale`). */
  storeFocus: number;
  /** Is the validator looking up its store? */
  lookup: boolean;
  question: Appear | null;
  statement: Appear | null;
  /** The statement's charges (its rows) and the count on it. */
  charges: 0 | 1;
  /** The count's appearance: the statement's until the charge, then its own pop as it reads 1. */
  count: Appear | null;
  tokens: readonly TokenState[];
  /** Take 1's count beside take 2's (0 until the comparison), times `motion.dimOpacity` when drawn. */
  ghost: number;
  paths: { p1: number; p2: number; p3: number; p4: number };
  badge: { take: 1 | 2; appear: Appear } | null;
  rewindMark: Appear | null;
  emote: EmoteState | null;
};

/** The rewind's object frame (design §2.3). */
export const objectFrame = (f: number, t: MuleTimeline = defaultTimeline): number => objectFrameOf(f, t.rewind);
/** First frame of take 2. */
export const take2Start = (t: MuleTimeline = defaultTimeline): number => t.phases.find((phase) => phase.take === 2)!.from;

const tripById = (t: MuleTimeline, id: string) => {
  const trip = t.trips.find((candidate) => candidate.id === id);
  if (!trip) throw new Error(`idempotent-receiver-mule: no trip ${id}`);
  return trip;
};
const along = (route: string, progress: number): Point => {
  const point = pointAlong(ROUTES[route], progress);
  if (point === null) throw new Error(`idempotent-receiver-mule: route ${route} gives no point at ${progress}`);
  return point;
};

/**
 * Where a token is at `x` along consecutive legs: at each leg's start until it
 * departs, on its route while it travels, at `rest` from the last arrival.
 */
const placeAt = (t: MuleTimeline, x: number, legs: readonly { trip: string; start: Point }[], rest: Point): Point => {
  for (const leg of legs) {
    const trip = tripById(t, leg.trip);
    if (x < trip.from) return leg.start;
    if (x < trip.to) return along(trip.route, (x - trip.from) / (trip.to - trip.from));
  }
  return rest;
};

/** The request, the answer, the retry and the 409 of a take (design §4.2). */
const tokensAt = (t: MuleTimeline, take: 1 | 2, x: number): TokenState[] => {
  const s = `t${take}`;
  const out: TokenState[] = [];
  const push = (id: TokenId, word: TokenState["word"], appear: Appear | null, point: Point, fill: TokenFill) => {
    if (appear !== null) out.push({ id, word, appear, point, fill });
  };
  push("request", "id", popAndLeave(x, t.pops[`request-${s}`], t.leaves[`request-${s}`]),
    placeAt(t, x, [{ trip: `send-${s}`, start: AT.client }, { trip: `pass-${s}`, start: AT.listener }, { trip: `charge-${s}`, start: AT.validator }], AT.charge),
    take === 2 && x >= t.cues.failed[0] ? "failure" : "white");
  push("answer", take === 1 ? "accepted" : "failed", popAndLeave(x, t.pops[`answer-${s}`], t.leaves[`answer-${s}`]),
    placeAt(t, x, [{ trip: `reply-${s}`, start: AT.charge }], AT.client),
    take === 1 ? "healthy" : "failure");
  push("retry", "id", popAndLeave(x, t.pops[`retry-${s}`], t.leaves[`retry-${s}`]),
    placeAt(t, x, [{ trip: `retrySend-${s}`, start: AT.client }, { trip: `retryPass-${s}`, start: AT.listener }], AT.validator),
    x >= t.cues.duplicate[take - 1] ? "blocked" : "white");
  push("duplicate", "duplicate", pillPop(x, t.pops[`duplicate-${s}`]),
    placeAt(t, x, [{ trip: `dupReply-${s}`, start: AT.validator }], AT.client),
    "blocked");
  return out;
};

/** Balão's expression at frame `x` of a take: its latest face of that take, `idle` before any. */
const faceAt = (t: MuleTimeline, take: 1 | 2, x: number): CastExpression => {
  const start = take2Start(t);
  return [...t.faces]
    .filter((face) => face.at <= x && (take === 1 ? face.at < t.rewind.from : face.at >= start))
    .sort((a, b) => a.at - b.at).at(-1)?.expression ?? "idle";
};

/** The one emote on screen at real frame `f` (emotes are not replayed by the rewind). */
const emoteAt = (t: MuleTimeline, f: number): EmoteState | null => {
  for (const e of t.emotes) {
    if (f < e.at || e.leaveAt === null) continue;
    const scale = f >= e.at + fps ? 1 : emotePop(f, e.at);
    const opacity = leave(f, e.leaveAt, LEAVE_FRAMES);
    if (opacity > 0 && scale > MIN_SCALE) return { kind: e.kind, scale, opacity };
  }
  return null;
};

/**
 * The state of every element at `frame`. From the outro the scene is a still:
 * every frame from `t.outro` on reads as `t.outro` itself, so "Final hold
 * identical" holds by construction.
 */
export const frameAt = (rawFrame: number, t: MuleTimeline = defaultTimeline): MuleState => {
  const frame = Math.min(rawFrame, t.outro);
  const start = take2Start(t);
  const take: 1 | 2 = frame >= start ? 2 : 1;
  const x = take === 2 ? frame : objectFrame(frame, t);
  const s = `t${take}`;
  const fade = (name: string) => t.fades[name];
  const lookup = t.cues.lookupOn.some((on, i) => x >= on && x < t.cues.lookupOff[i]);
  const charged = take === 1 && x >= t.cues.charged[0];
  const statement = blockPop(x, t.pops.statement);
  const balaoAppear = blockPop(x, t.pops.balao);
  const path = (id: string) => motionPathAt(x, fade(`${id}-${s}`).in, fade(`${id}-${s}`).out);

  const rewindMark = popAndLeave(frame, t.pops.rewindMark, t.leaves.rewindMark);
  // The badge pops once and never fades out; the swap only flips the take number it reads (as in sdd-request-relay).
  const badgeAppear = pillPop(frame, t.pops.badge1);

  return {
    objectFrame: x,
    take,
    balao: balaoAppear === null ? null : {
      appear: balaoAppear,
      expression: faceAt(t, take, x),
      speaks: t.speaks.some((span) => x >= span.from && x < span.to && (take === 1 ? span.from < t.rewind.from : span.from >= start)),
    },
    listener: blockPop(x, t.pops.listener),
    validator: blockPop(x, t.pops.validator),
    charge: blockPop(x, t.pops.charge),
    store: blockPop(x, t.pops.store),
    stored: pillPop(x, t.pops[`stored-${s}`]),
    storeFocus: 1 + (tokens.motion.focusScale - 1) * focusAt(x, t.focus[take - 1]),
    lookup,
    question: popAndLeave(x, t.pops[`question-${s}`], t.leaves[`question-${s}`]),
    statement,
    charges: charged ? 1 : 0,
    count: charged ? pillPop(x, t.pops["count-t1"]) : statement,
    tokens: tokensAt(t, take, x),
    ghost: take === 2 ? fadeIn(x, fade("ghost").in) : 0,
    paths: { p1: path("p1"), p2: path("p2"), p3: path("p3"), p4: path("p4") },
    badge: badgeAppear === null ? null : { take: frame < t.cues.badgeSwap[0] ? 1 : 2, appear: badgeAppear },
    rewindMark,
    emote: emoteAt(t, frame),
  };
};

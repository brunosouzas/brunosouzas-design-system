// Frame logic of the motion components: what is visible, where and how much at
// a given frame (design §5). The components in components.tsx only draw what
// these functions return, so the timing is unit-tested without a browser.
//
// Ported from the approved pilot (StateMachine.tsx and components.tsx) without
// changing a number: the springs, fades and the focus rule are the pilot's.
// No React here: `spring` and `interpolate` from remotion are pure functions.
import { interpolate, spring } from "remotion";
import { evolvePath, getLength, getPointAtLength } from "@remotion/paths";
import { tokens } from "../../tokens/generated/tokens";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Pop-in shapes of the pilot (component constants, design §8): a block grows
// from 60 % and is opaque at 1/1.4 of its spring; a pill from 70 % at 1/1.5; a
// call square from 30 %.
const BLOCK_POP_SCALE_FROM = 0.6;
const BLOCK_POP_OPACITY_GAIN = 1.4;
const PILL_POP_SCALE_FROM = 0.7;
const PILL_POP_OPACITY_GAIN = 1.5;
const SQUARE_POP_SCALE_FROM = 0.3;
/** Pixels the caption rises from while it fades in. */
const CAPTION_LIFT = 14;
/** Opacity of an empty call slot (component constant, design §8). */
export const EMPTY_SLOT_OPACITY = 0.35;

// ---------------------------------------------------------------- timeline types

export type CallKind = "ok" | "fail" | "blocked";
export type SlotKind = CallKind | "empty";
export type CallEvent = { at: number; kind: CallKind };
/** A phase of one state; `from` and `to` are inclusive frames. */
export type Phase<S extends string = string> = { state: S; from: number; to: number; events: readonly CallEvent[] };
export type Transition<S extends string = string> = { from: S; to: S };

/** A scene's choreography in frames (design §8). */
export type Timeline<S extends string = string, T extends string = string> = {
  duration: number;
  /** First phase starts and dimming starts. */
  introEnd: number;
  /** Every block back to full opacity for reading. */
  outro: number;
  startMarkerFade: readonly [number, number];
  ringsFade: readonly [number, number];
  /** Pop-in frame of each state block. */
  popIn: Readonly<Record<S, number>>;
  phases: readonly Phase<S>[];
  transitions: Readonly<Record<T, Transition<S>>>;
  /** Frames at which each transition fires (its token leaves the source state). */
  fires: Readonly<Record<T, readonly number[]>>;
  /** An arrow starts drawing this many frames before its transition first fires. */
  arrowLead: number;
  /** A pill pops in this many frames after its arrow starts drawing. */
  pillDelay: number;
  /** Call slots per state block. */
  slots: Readonly<Record<S, number>>;
};

export const arrowDrawAt = <T extends string>(timeline: Timeline<string, T>, transition: T): number =>
  timeline.fires[transition][0] - timeline.arrowLead;

export const pillAt = <T extends string>(timeline: Timeline<string, T>, transition: T): number =>
  arrowDrawAt(timeline, transition) + timeline.pillDelay;

/** The latest phase that has started at `frame`, or null before the first. */
export const activePhase = <S extends string>(frame: number, phases: readonly Phase<S>[]): Phase<S> | null => {
  let current: Phase<S> | null = null;
  for (const phase of phases) if (frame >= phase.from) current = phase;
  return current;
};

/** The latest started phase of one state, or null before its first. */
export const lastPhaseOf = <S extends string>(state: S, frame: number, phases: readonly Phase<S>[]): Phase<S> | null => {
  let current: Phase<S> | null = null;
  for (const phase of phases) if (phase.state === state && frame >= phase.from) current = phase;
  return current;
};

// ---------------------------------------------------------------- pop-in

export const popSpring = (frame: number, appearAt: number, fps: number = tokens.motion.fps): number =>
  spring({ frame: frame - appearAt, fps, config: tokens.motion.pop });

export type Appearance = { opacity: number; scale: number };

export const blockPopIn = (frame: number, appearAt: number, fps: number = tokens.motion.fps): Appearance => {
  const pop = popSpring(frame, appearAt, fps);
  return {
    opacity: Math.min(pop * BLOCK_POP_OPACITY_GAIN, 1),
    scale: interpolate(pop, [0, 1], [BLOCK_POP_SCALE_FROM, 1]),
  };
};

export const pillPopIn = (frame: number, appearAt: number, fps: number = tokens.motion.fps): Appearance & { visible: boolean } => {
  const pop = popSpring(frame, appearAt, fps);
  return {
    visible: frame >= appearAt,
    opacity: Math.min(pop * PILL_POP_OPACITY_GAIN, 1),
    scale: interpolate(pop, [0, 1], [PILL_POP_SCALE_FROM, 1]),
  };
};

// ---------------------------------------------------------------- focus

/**
 * How much a state is in focus, 0 to 1 (the pilot's useFocus). The state of the
 * latest started phase rises with the focus spring from that phase's start; the
 * state of the phase before it falls with the same spring.
 */
export const focusLevel = <S extends string>(
  frame: number,
  state: S,
  phases: readonly Phase<S>[],
  fps: number = tokens.motion.fps,
): number => {
  const active = activePhase(frame, phases);
  if (!active) return 0;
  const previous = phases[phases.indexOf(active) - 1];
  const rise = spring({ frame: frame - active.from, fps, config: tokens.motion.focus });
  if (active.state === state) return previous && previous.state === state ? 1 : rise;
  if (previous && previous.state === state) return 1 - rise;
  return 0;
};

/** Focus factors of a block: multiplied with its pop-in, never replacing it. */
export const focusFactors = <S extends string>(
  frame: number,
  state: S,
  timeline: Timeline<S>,
  fps: number = tokens.motion.fps,
): Appearance => {
  const level = focusLevel(frame, state, timeline.phases, fps);
  const dimmed = frame >= timeline.introEnd && frame < timeline.outro;
  return {
    opacity: dimmed ? interpolate(level, [0, 1], [tokens.motion.dimOpacity, 1]) : 1,
    scale: interpolate(level, [0, 1], [1, tokens.motion.focusScale]),
  };
};

/** Opacity and scale of a state block: pop-in times focus. */
export const blockAppearance = <S extends string>(
  frame: number,
  state: S,
  timeline: Timeline<S>,
  fps: number = tokens.motion.fps,
): Appearance => {
  const pop = blockPopIn(frame, timeline.popIn[state], fps);
  const focus = focusFactors(frame, state, timeline, fps);
  return { opacity: pop.opacity * focus.opacity, scale: pop.scale * focus.scale };
};

// ---------------------------------------------------------------- arrows and tokens

export type ArrowState = { visible: boolean; progress: number; head: boolean };

/** Invisible before `drawAt`, drawn over `motion.drawArrow` frames, head once fully drawn. */
export const arrowAt = (frame: number, drawAt: number, drawFrames: number = tokens.motion.drawArrow): ArrowState => {
  const progress = interpolate(frame, [drawAt, drawAt + drawFrames], [0, 1], clamp);
  return { visible: frame >= drawAt, progress, head: progress >= 1 };
};

/** Dash settings that draw `progress` of the path. */
export const arrowDash = (path: string, progress: number) => evolvePath(progress, path);

/** Progress (0 to <1) of every token travelling at `frame`, one per fire. */
export const tripsAt = (frame: number, fires: readonly number[], travel: number = tokens.motion.travel): number[] =>
  fires
    .map((fire) => ({ fire, t: interpolate(frame, [fire, fire + travel], [0, 1], clamp) }))
    .filter(({ fire, t }) => frame >= fire && t < 1)
    .map(({ t }) => t);

export type Point = { x: number; y: number };

/** Point at fraction `t` of the path's length. */
export const pointAlong = (path: string, t: number): Point | null => {
  const point = getPointAtLength(path, getLength(path) * t);
  return point ? { x: point.x, y: point.y } : null;
};

export const tokenPositions = (
  frame: number,
  path: string,
  fires: readonly number[],
  travel: number = tokens.motion.travel,
): Point[] =>
  tripsAt(frame, fires, travel)
    .map((t) => pointAlong(path, t))
    .filter((point): point is Point => point !== null);

/** Persistent stationary placement or one half-open path trip. The evaluator is
 * injectable for the null-path boundary; choreography belongs to the scene. */
export const positionedTokenAt = (
  frame: number,
  placement: { point: Point } | { path: string; departAt: number },
  evaluate: (path: string, progress: number) => Point | null = pointAlong,
): Point | null => {
  if ("point" in placement) return placement.point;
  const [progress] = tripsAt(frame, [placement.departAt]);
  return progress === undefined ? null : evaluate(placement.path, progress);
};

// ---------------------------------------------------------------- fades, caption, countdown

export const fadeIn = (frame: number, range: readonly [number, number]): number =>
  interpolate(frame, [range[0], range[1]], [0, 1], clamp);

export type Caption<S extends string> = { state: S; opacity: number; lift: number };

/** The caption at a frame: none before the first phase, else the latest started phase's. */
export const captionAt = <S extends string>(
  frame: number,
  phases: readonly Phase<S>[],
  fade: number = tokens.motion.fade,
): Caption<S> | null => {
  const active = activePhase(frame, phases);
  if (!active) return null;
  return {
    state: active.state,
    opacity: interpolate(frame - active.from, [0, fade], [0, 1], clamp),
    lift: interpolate(frame - active.from, [0, fade], [CAPTION_LIFT, 0], clamp),
  };
};

/** Fraction of the countdown left: 1 at `from`, 0 at `to`, linear between. */
export const countdownLeft = (frame: number, from: number, to: number): number =>
  interpolate(frame, [from, to], [1, 0], clamp);

// ---------------------------------------------------------------- call results

export type CallAppearance = {
  fill: string;
  glyph: string;
  glyphColor: string;
  dashed: boolean;
  shadow: boolean;
  opacity: number;
};

/** Fill and glyph of each call kind. A blocked call is ink, never the OPEN block's colour. */
export const callAppearance = (kind: SlotKind): CallAppearance => {
  const { color } = tokens;
  switch (kind) {
    case "ok":
      return { fill: color.white, glyph: "✓", glyphColor: color.ink, dashed: false, shadow: true, opacity: 1 };
    case "fail":
      return { fill: color.failure, glyph: "✕", glyphColor: color.white, dashed: false, shadow: true, opacity: 1 };
    case "blocked":
      return { fill: color.ink, glyph: "–", glyphColor: color.white, dashed: false, shadow: true, opacity: 1 };
    case "empty":
      return { fill: "transparent", glyph: "", glyphColor: color.white, dashed: true, shadow: false, opacity: EMPTY_SLOT_OPACITY };
  }
};

export const squarePopScale = (pop: number): number => interpolate(pop, [0, 1], [SQUARE_POP_SCALE_FROM, 1]);

export type Slot = { kind: SlotKind; at: number | null };
export type BlockContents = { slots: Slot[]; countdown: number; phaseFrom: number | null };

/**
 * What a state block holds at a frame: the results of its latest started phase
 * that have happened, in order, then empty slots; and its countdown. Before the
 * state's first phase every slot is empty and the countdown is empty.
 */
export const blockContents = <S extends string>(frame: number, state: S, timeline: Timeline<S>): BlockContents => {
  const phase = lastPhaseOf(state, frame, timeline.phases);
  const events = phase ? phase.events : [];
  const slots: Slot[] = Array.from({ length: timeline.slots[state] }, (_, i) => {
    const event = events[i];
    return event && frame >= event.at ? { kind: event.kind, at: event.at } : { kind: "empty", at: null };
  });
  return {
    slots,
    countdown: phase ? countdownLeft(frame, phase.from, phase.to) : 0,
    phaseFrom: phase ? phase.from : null,
  };
};

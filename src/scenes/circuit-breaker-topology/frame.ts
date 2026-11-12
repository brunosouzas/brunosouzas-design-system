// The circuit-breaker topology scene at a frame (change
// circuit-breaker-topology-scene, design §2.5 to §2.8 and §4): `frameAt(f)`
// returns the whole stage state, every element with its appearance, from the
// frame and the rewind's object frame `objectFrame(f)`, as plain data with no
// React. stage.ts turns it into piece trees and component props; Scene.tsx
// only draws them. Pure: a frame's state depends on nothing but `f`, so the
// renderer can seek in any order.
//
// Conventions (design §2.6): an element popping at frame a is in the state
// from a, drawn once its opacity is above 0 and its scale above 0.001, and
// exactly settled (opacity 1, scale 1) from a + `motion.fps`; a leave
// multiplies its opacity by `leave` (10 frames) and the element is gone at the
// leave's end. Take-1 objects read the object frame, everything else the frame.
//
// How to run: `npm test -- test/scenes/circuit-breaker-topology.test.ts`.
import { interpolate } from "remotion";
import { tokens } from "../../../tokens/generated/tokens";
import { leave } from "../../brand/cast-motion";
import { blockPopIn, countdownLeft, fadeIn, motionPathAt, pillPopIn, popSpring, squarePopScale, type Point } from "../../brand/motion";
import { LEAVE_FRAMES } from "../takes-kind";
import { DROP_FALL, DROP_PATH, ROUTES, SQUARE, slotX } from "./layout";
import { timeline as defaultTimeline, type ArrowKind, type Route, type StateName, type TagPlace, type TagText, type TopologyTimeline } from "./timeline";

const { fps, fade: F, travel: T } = tokens.motion;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type Appear = { opacity: number; scale: number };
export type ArrowState = { kind: ArrowKind; dashed: boolean; opacity: number };
/**
 * A window square. `appear` describes its pop for the tests and the layout
 * exemptions; `CallSquare` draws the pop itself from `appearAt` with its own
 * spring, which settles a little after `appear` says (design Risks).
 */
export type SquareState = { id: string; kind: "ok" | "fail"; appearAt: number; x: number; opacity: number; appear: Appear };
export type TokenState = { id: string; route: Route; point: Point };
export type TopologyState = {
  checkout: Appear | null;
  payment: Appear | null;
  /** Failing (red) Payment units, 0 to 2. */
  failing: readonly [boolean, boolean, boolean];
  badge: { take: 1 | 2; appear: Appear } | null;
  rewindMark: Appear | null;
  retry: Appear | null;
  arrows: Readonly<Record<Route, ArrowState | null>>;
  dropPath: number;
  /** The breaker box's centre while it is on stage. */
  breaker: Point | null;
  state: { name: StateName; at: number; appear: Appear } | null;
  window: {
    appear: Appear;
    opacity: number;
    /** Empty slots (0–4) with no result square in them. */
    empty: readonly number[];
    squares: readonly SquareState[];
    rate: number;
  } | null;
  dropped: { appear: Appear; fall: number; opacity: number } | null;
  clock: { left: number; appear: Appear; opacity: number } | null;
  counters: { requests: number; calls: number; appear: Appear; ghost: Appear | null } | null;
  tags: Readonly<Record<TagPlace, { text: TagText; at: number; appear: Appear } | null>>;
  message: Appear | null;
  tokens: readonly TokenState[];
};

// ---------------------------------------------------------------- helpers

/** The rewind's object frame (design §2.5): the frame before 450, take 1 backwards 450–499, 59 after. */
export const objectFrame = (f: number, t: TopologyTimeline = defaultTimeline): number => {
  const { from, to, objects: [start, end] } = t.rewind;
  if (f < from) return f;
  if (f > to) return end;
  return Math.round(start - ((f - from) * (start - end)) / (to - from));
};

/** Is an element with this appearance drawn (design §2.6)? */
export const drawn = (appear: Appear | null): appear is Appear => appear !== null && appear.opacity > 0 && appear.scale > 0.001;

const SETTLED: Appear = { opacity: 1, scale: 1 };
const settleWith = (pop: (f: number, a: number) => Appear) => (f: number, a: number): Appear | null =>
  f < a ? null : f >= a + fps ? SETTLED : (({ opacity, scale }) => ({ opacity, scale }))(pop(f, a));
export const blockPop = settleWith((f, a) => blockPopIn(f, a));
export const pillPop = settleWith((f, a) => pillPopIn(f, a));
/** A popped element times a leave (null once the leave has ended). */
const leaving = (appear: Appear | null, f: number, at: number | undefined): Appear | null => {
  if (appear === null || at === undefined || f < at) return appear;
  if (f >= at + LEAVE_FRAMES) return null;
  return { ...appear, opacity: appear.opacity * leave(f, at, LEAVE_FRAMES) };
};

/** The latest entry at or before `t`. */
const latest = <E extends { at: number }>(list: readonly E[], t: number): E | undefined => {
  let found: E | undefined;
  for (const entry of list) if (entry.at <= t) found = entry;
  return found;
};

/** An element's opacity after its ramps (design §4.5): 1 before the first, then linear over each. */
const rampValue = (t: TopologyTimeline, element: string, f: number): number => {
  let value = 1;
  for (const r of t.ramps) if (r.element === element && r.from <= f) value = interpolate(f, [r.from, r.to], [...r.values], clamp);
  return value;
};

const isTake1 = (id: string) => id.startsWith("t1-");
const along = ([a, b]: readonly [Point, Point], p: number): Point => ({ x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p });

// ---------------------------------------------------------------- elements

const TAKE1_ROUTES: readonly Route[] = ["direct-req", "direct-rep"];
const arrowAt = (t: TopologyTimeline, route: Route, f: number, o: number): ArrowState | null => {
  const take1 = TAKE1_ROUTES.includes(route);
  const clock = take1 ? o : f;
  const change = latest(t.arrows[route], clock);
  if (change === undefined) return null;
  const fade = t.fades[route];
  let opacity = fadeIn(clock, fade.in);
  // The direct request leaves in real frames when the breaker comes (510–520).
  if (fade.out) opacity *= 1 - fadeIn(f, fade.out);
  if (!take1) opacity *= rampValue(t, route, f);
  // In the state from its first fade-in frame (opacity 0, not drawn yet) until a fade-out has ended.
  if (fade.out && f >= fade.out[1]) return null;
  return { kind: change.kind, dashed: change.dashed, opacity };
};

const tokensAt = (t: TopologyTimeline, f: number, o: number): TokenState[] =>
  t.calls.flatMap((call) => {
    const clock = isTake1(call.id) ? o : f;
    return call.legs
      .filter((leg) => leg.from <= clock && clock < leg.from + T)
      .map((leg) => ({ id: `${call.id}:${leg.route}`, route: leg.route, point: along(ROUTES[leg.route], (clock - leg.from) / T) }));
  });

const valueAt = (list: readonly { at: number; value: number }[], t: number) => latest(list, t)?.value ?? 0;

const tagAt = (t: TopologyTimeline, place: TagPlace, f: number, o: number) => {
  const clock = place === "direct" ? o : f;
  const changes = t.tags[place];
  const change = latest(changes, clock);
  if (change === undefined) return null;
  if ("leave" in change) {
    // Leaving: the text it showed, fading over 10 frames.
    const shown = latest(changes.filter((c) => "text" in c && c.at < change.at), change.at);
    if (shown === undefined || !("text" in shown)) return null;
    const appear = leaving(pillPop(clock, shown.at), f, change.at);
    return appear === null ? null : { text: shown.text, at: shown.at, appear };
  }
  const appear = pillPop(clock, change.at);
  return appear === null ? null : { text: change.text, at: change.at, appear };
};

/**
 * The frame of the one `<name>@<frame>` key of a pops or leaves table. Throws
 * when there is none or more than one, so a timing change in timeline.ts fails
 * loudly instead of drawing NaN.
 */
const onlyAt = (keys: Readonly<Record<string, number>>, name: string): number => {
  const found = Object.entries(keys).filter(([k]) => k.startsWith(`${name}@`));
  if (found.length !== 1) throw new Error(`circuit-breaker-topology timeline: expected one "${name}@<frame>" key, found ${found.length}`);
  return found[0][1];
};

/** An element that pops and leaves more than once: its occurrences from `pops` and `leaves` keys `<name>@<frame>`. */
const occurrenceAt = (t: TopologyTimeline, name: string, f: number, pop: (f: number, a: number) => Appear | null): Appear | null => {
  const at = (keys: Readonly<Record<string, number>>) => Object.entries(keys).filter(([k]) => k.startsWith(`${name}@`)).map(([, v]) => v).sort((a, b) => a - b);
  const start = latest(at(t.pops).map((frame) => ({ at: frame })), f)?.at;
  if (start === undefined) return null;
  const end = at(t.leaves).find((frame) => frame >= start);
  return leaving(pop(f, start), f, end);
};

/** Design §4.6: results fill the first empty slot; a full window slides; a clear empties it; a `400` never enters. */
const windowAt = (t: TopologyTimeline, f: number) => {
  type Placed = { id: string; kind: "ok" | "fail"; at: number; slot: number; movedAt: number | null };
  let placed: Placed[] = [];
  const gone: { square: Placed; x: (f: number) => number; opacity: (f: number) => number; end: number }[] = [];
  let rate = 0;
  let rateChange: { at: number; from: number; to: number } | null = null;
  const fails = () => placed.filter((p) => p.kind === "fail").length / 5;
  for (const event of t.window) {
    if (event.at > f) break;
    if ("clear" in event) {
      for (const square of placed) gone.push({ square, x: () => slotX(square.slot), opacity: (g) => leave(g, event.at, LEAVE_FRAMES), end: event.at + LEAVE_FRAMES });
      placed = [];
    } else if (event.result === "drop") {
      continue;
    } else {
      const square: Placed = { id: `square@${event.at}`, kind: event.result, at: event.at, slot: placed.length, movedAt: null };
      if (placed.length === 5) {
        const out = placed.shift()!;
        const at = event.at;
        // Slides out of slot 0 to 60 units left, its opacity falling linearly (design §4.6).
        gone.push({ square: out, x: (g) => slotX(0) - SQUARE.step * interpolate(g, [at, at + F], [0, 1], clamp), opacity: (g) => interpolate(g, [at, at + F], [1, 0], clamp), end: at + F });
        for (const p of placed) { p.slot -= 1; p.movedAt = at; }
        square.slot = 4;
      }
      placed.push(square);
    }
    const next = fails();
    if (next !== rate) { rateChange = { at: event.at, from: rate, to: next }; rate = next; }
  }
  const settledSquare = (at: number): Appear => (f >= at + fps ? SETTLED : { opacity: 1, scale: squarePopScale(popSpring(f, at)) });
  const squares: SquareState[] = [
    ...gone.filter((g) => f < g.end).map(({ square, x, opacity }) => ({ id: square.id, kind: square.kind, appearAt: square.at, x: x(f), opacity: opacity(f), appear: settledSquare(square.at) })),
    ...placed.map((p) => ({
      id: p.id,
      kind: p.kind,
      appearAt: p.at,
      // A square moved by a slide comes from the slot to its right, linearly over F.
      x: slotX(p.slot) + (p.movedAt === null ? 0 : SQUARE.step * (1 - interpolate(f, [p.movedAt, p.movedAt + F], [0, 1], clamp))),
      opacity: 1,
      appear: settledSquare(p.at),
    })),
  ].filter((s) => s.opacity > 0);
  const occupied = new Set(placed.map((p) => p.slot));
  const value = rateChange === null ? 0 : interpolate(f, [rateChange.at, rateChange.at + F], [rateChange.from, rateChange.to], clamp);
  return { squares, empty: [0, 1, 2, 3, 4].filter((s) => !occupied.has(s)), rate: value };
};

// ---------------------------------------------------------------- the frame

/**
 * The whole stage at frame `f` (pure). `t` lets a test pass a changed
 * timeline; travel and fade still come from the tokens. Throws when `t` has no
 * or several pops or leaves of an element drawn once (`onlyAt`).
 */
export const frameAt = (f: number, t: TopologyTimeline = defaultTimeline): TopologyState => {
  const o = objectFrame(f, t);
  // From take 2's first frame (510) the take-1 objects stay those of object frame 59 and the counters and lights count take 2 (design §2.5).
  const take2 = f >= t.phases.find((phase) => phase.take === 2)!.from;
  const lightsList = take2 ? t.lights.take2 : t.lights.take1;
  const lightClock = take2 ? f : o;
  const failing = ([0, 1, 2] as const).map((unit) => latest(lightsList.filter((l) => l.unit === unit), lightClock)?.failing ?? false) as [boolean, boolean, boolean];

  const badgeEntry = latest(t.badge, f);
  const badgeAppear = badgeEntry ? pillPop(f, badgeEntry.at) : null;

  const counterAppear = occurrenceAt(t, "counters", f, pillPop);
  const counters = counterAppear === null ? null : {
    requests: take2 ? valueAt(t.counters.take2.requests, f) : valueAt(t.counters.take1.requests, o),
    calls: take2 ? valueAt(t.counters.take2.calls, f) : valueAt(t.counters.take1.calls, o),
    appear: counterAppear,
    ghost: occurrenceAt(t, "ghost", f, pillPop),
  };

  const stateEntry = latest(t.states, f);
  const statePop = stateEntry ? pillPop(f, stateEntry.at) : null;

  const windowPop = occurrenceAt(t, "window", f, blockPop);
  const contents = windowAt(t, f);

  const droppedAt = onlyAt(t.pops, "dropped");
  const fallFrom = t.cues.dropped[0], fallTo = t.cues.dropped[1];
  const droppedPop = f < fallTo ? blockPop(f, droppedAt) : null;
  const fallen = interpolate(f, [fallFrom, fallTo], [0, 1], clamp);

  const run = latest(t.clock, f);
  const clockPop = occurrenceAt(t, "clock", f, pillPop);

  const drop = t.drop;
  const breaker = f < drop.from ? null : along(DROP_PATH, interpolate(f, [drop.from, drop.to], [0, 1], clamp));

  return {
    checkout: blockPop(f, onlyAt(t.pops, "checkout")),
    payment: blockPop(f, onlyAt(t.pops, "payment")),
    failing,
    badge: badgeEntry && badgeAppear ? { take: badgeEntry.take, appear: badgeAppear } : null,
    rewindMark: occurrenceAt(t, "rewind-mark", f, pillPop),
    retry: leaving(pillPop(o, onlyAt(t.pops, "retry")), f, onlyAt(t.leaves, "retry")),
    arrows: Object.fromEntries((Object.keys(t.arrows) as Route[]).map((route) => [route, arrowAt(t, route, f, o)])) as Record<Route, ArrowState | null>,
    dropPath: motionPathAt(f, t.fades["drop-path"].in, t.fades["drop-path"].out),
    breaker,
    state: stateEntry && statePop ? { name: stateEntry.state, at: stateEntry.at, appear: statePop } : null,
    window: windowPop === null ? null : { appear: windowPop, opacity: rampValue(t, "window", f), ...contents },
    dropped: droppedPop === null ? null : { appear: droppedPop, fall: DROP_FALL * fallen, opacity: 1 - fallen },
    clock: run === undefined || clockPop === null ? null : { left: countdownLeft(f, run.at, run.emptyAt), appear: clockPop, opacity: rampValue(t, "clock", f) },
    counters,
    tags: { direct: tagAt(t, "direct", f, o), left: tagAt(t, "left", f, o), right: tagAt(t, "right", f, o) },
    message: occurrenceAt(t, "message", f, pillPop),
    tokens: tokensAt(t, f, o),
  };
};

// The SDD relay scene at a frame (change sdd-scene-1-relay, design §2.7 to
// §2.9 and §4): `frameAt(f)` returns the whole stage state as plain data with
// no React. stage.ts turns it into piece trees; Scene.tsx only draws them.
// Pure: a frame's state depends on nothing but `f`, so stills, renders and
// Studio can seek in any order, and vitest proves the timing without a browser.
//
// Takes (design §2.7): before take 2 the stage (cast included) is drawn from
// the object frame `objectFrame(f)`, which runs take 1 backwards during the
// rewind; the badge, the rewind mark and the emotes read the real frame. From
// take 2 everything reads the real frame, with take 2's own actions and trips.
//
// Pop-ins (design §2.8): an element popping at frame a is drawn once its
// opacity is above 0 and its scale above 0.001 (so from a + 1), and exactly
// settled from a + `motion.fps`.
//
// How to run: `npm test -- test/scenes/sdd-request-relay.test.ts`.
import { tokens } from "../../../tokens/generated/tokens";
import { emotePop, leave, squashAfter } from "../../brand/cast-motion";
import { blockPopIn, fadeIn, motionPathAt, pillPopIn, pointAlong, type Point } from "../../brand/motion";
import type { CastExpression, EmoteKind } from "../../pieces/index.ts";
import { LEAVE_FRAMES } from "../takes-kind";
import { DESK, EMOTES, HELD, ROUTES, SINK_DROP, aboveChaves, inScreen } from "./layout";
import { QUESTIONS, objectFrameOf, timeline as defaultTimeline, type CastActor, type CastSet, type Facing, type RelayTimeline } from "./timeline";

const { fps } = tokens.motion;
/** Below this scale an element is not drawn (and `pose` refuses scale 0). */
const MIN_SCALE = 0.001;

export type Appear = { opacity: number; scale: number };
const SETTLED: Appear = { opacity: 1, scale: 1 };
/** Is an element with this appearance drawn (design §2.8)? */
export const drawn = (a: Appear | null): a is Appear => a !== null && a.opacity > 0 && a.scale > MIN_SCALE;
const popWith = (helper: (f: number, at: number) => Appear) => (f: number, at: number): Appear | null => {
  if (f < at) return null;
  if (f >= at + fps) return SETTLED;
  const { opacity, scale } = helper(f, at);
  return drawn({ opacity, scale }) ? { opacity, scale } : null;
};
const blockPop = popWith(blockPopIn);
const pillPop = popWith(pillPopIn);

export type BalaoState = { appear: Appear; expression: CastExpression; speaks: boolean; holdsStamp: boolean; tilt: number; squash: number };
export type ChavesState = { appear: Appear; expression: CastExpression; facing: Facing; types: boolean; holdsSheet: boolean };
export type VisorState = { appear: Appear; expression: CastExpression; points: boolean };
export type TokenState = { id: string; point: Point; opacity: number };
/**
 * `proposal.md` (take 2). `place` is where it is drawn: `desk` and `trip` as a
 * free sheet at `at`; `held` in Chaves's hand (drawn by `chaves`), at `at` = HELD.
 */
export type SheetState = { place: "desk" | "trip" | "held"; at: Point; appear: Appear; rows: number; checked: number; go: Appear | null };
export type EmoteState = { kind: EmoteKind; x: number; y: number; scale: number; opacity: number };

export type RelayState = {
  /** The frame the stage is drawn from (design §2.7). */
  objectFrame: number;
  take: 1 | 2;
  laptop: Appear | null;
  screen: { requestLine: boolean; codeLines: number };
  balao: BalaoState | null;
  chaves: ChavesState | null;
  visor: VisorState | null;
  tokens: readonly TokenState[];
  sheet: SheetState | null;
  failureArrow: number;
  paths: { p1: number; p2: number; p4: number };
  badge: { take: 1 | 2; appear: Appear } | null;
  rewindMark: Appear | null;
  emote: EmoteState | null;
};

/** The rewind's object frame (design §2.7). */
export const objectFrame = (f: number, t: RelayTimeline = defaultTimeline): number => objectFrameOf(f, t.rewind);
/** First frame of take 2. */
export const take2Start = (t: RelayTimeline = defaultTimeline): number => t.phases.find((phase) => phase.take === 2)!.from;

const count = (frames: readonly number[], at: number) => frames.filter((frame) => frame <= at).length;

/** The cast's action parameters at frame `x` of a take: the defaults, then every action of that take up to `x`. */
const castAt = (t: RelayTimeline, take: 1 | 2, x: number) => {
  const start = take2Start(t);
  const pose: Record<CastActor, Required<Pick<CastSet, never>> & CastSet> = {
    balao: { speaks: false, holdsStamp: false },
    chaves: { facing: "left", types: false, holdsSheet: false },
    visor: { points: false },
  };
  for (const a of [...t.actions].sort((p, q) => p.at - q.at)) {
    const inTake = take === 1 ? a.at < t.rewind.from : a.at >= start;
    if (inTake && a.at <= x) pose[a.actor] = { ...pose[a.actor], ...a.set };
  }
  return pose;
};

/** An actor's expression at frame `x` of a take: its latest face entry of that take, `idle` before any. */
const faceAt = (t: RelayTimeline, take: 1 | 2, actor: CastActor, x: number): CastExpression => {
  const start = take2Start(t);
  return [...t.faces]
    .filter((face) => face.actor === actor && face.at <= x && (take === 1 ? face.at < t.rewind.from : face.at >= start))
    .sort((a, b) => a.at - b.at).at(-1)?.expression ?? "idle";
};

const tripById = (t: RelayTimeline, id: string) => {
  const trip = t.trips.find((candidate) => candidate.id === id);
  if (!trip) throw new Error(`sdd-request-relay: no trip ${id}`);
  return trip;
};
const along = (route: string, progress: number): Point => {
  const point = pointAlong(ROUTES[route], progress);
  if (point === null) throw new Error(`sdd-request-relay: route ${route} gives no point at ${progress}`);
  return point;
};
/** Where a trip's object is at `x`: null before it starts, on the route while it travels, null from its arrival. */
const onTrip = (t: RelayTimeline, id: string, x: number): Point | null => {
  const trip = tripById(t, id);
  if (x < trip.from || x >= trip.to) return null;
  return along(trip.route, (x - trip.from) / (trip.to - trip.from));
};

/** The six `?` at frame `x` of a take (design §4.2 and §4.4). */
const tokensAt = (t: RelayTimeline, take: 1 | 2, x: number): TokenState[] => {
  const out: TokenState[] = [];
  for (let i = 0; i < QUESTIONS; i++) {
    const ask = tripById(t, `ask-t${take}-${i}`), hop = tripById(t, `hop-t${take}-${i}`);
    const id = `q${i}`;
    if (x < ask.from) continue;
    if (x < ask.to) { out.push({ id, point: onTrip(t, ask.id, x)!, opacity: 1 }); continue; }
    if (x < hop.from) { out.push({ id, point: aboveChaves(i), opacity: 1 }); continue; }
    if (x < hop.to) { out.push({ id, point: onTrip(t, hop.id, x)!, opacity: 1 }); continue; }
    if (take === 1) {
      // The sink (design §4.2, 232 + 8i): fade and drop over `motion.fade` frames as code line i + 1 appears.
      const sink = t.cues.codeLines1[i], gone = t.cues.sinks[i];
      if (x < sink) { out.push({ id, point: inScreen(i), opacity: 1 }); continue; }
      if (x >= gone) continue;
      const k = (x - sink) / (gone - sink);
      out.push({ id, point: { x: inScreen(i).x, y: inScreen(i).y + SINK_DROP * k }, opacity: 1 - k });
    } else {
      const list = tripById(t, `list-${i}`);
      if (x < list.from) { out.push({ id, point: inScreen(i), opacity: 1 }); continue; }
      if (x < list.to) out.push({ id, point: onTrip(t, list.id, x)!, opacity: 1 });
      // From its arrival the `?` is the sheet's row i + 1.
    }
  }
  return out;
};

/** `proposal.md` at frame `f` of take 2 (design §2.9). */
const sheetAt = (t: RelayTimeline, f: number): SheetState | null => {
  const appear = blockPop(f, t.pops.sheet);
  if (appear === null) return null;
  const carry = tripById(t, "carry"), back = tripById(t, "return");
  const rows = count(t.cues.rows, f);
  const checked = count(t.cues.checks, f);
  const go = blockPop(f, t.pops.goMark);
  const base = { appear, rows, checked, go };
  if (f < carry.from) return { ...base, place: "desk", at: DESK };
  if (f < carry.to) return { ...base, place: "trip", at: onTrip(t, carry.id, f)! };
  if (f < back.from) return { ...base, place: "held", at: HELD };
  if (f < back.to) return { ...base, place: "trip", at: onTrip(t, back.id, f)! };
  return { ...base, place: "desk", at: DESK };
};

/**
 * The one emote on screen at `f` (real frame; emotes are not replayed by the
 * rewind). An emote that leaves pops in like a block (drawn once its scale is
 * above `MIN_SCALE`, so from `at` + 1); one that stays (`leaveAt` null, design
 * §4.2, 950, "worked emote (stays)") is already present from its own `at`,
 * since there is no entrance to miss once it is on screen for good.
 */
const emoteAt = (t: RelayTimeline, f: number): EmoteState | null => {
  for (const e of t.emotes) {
    if (f < e.at) continue;
    const base = EMOTES[e.kind as keyof typeof EMOTES];
    const pop = f >= e.at + fps ? 1 : emotePop(f, e.at);
    // A piece's own scale must be above 0 (src/pieces/params.ts); the emote that
    // stays is reported from its own `at` (design §4.2, 950), so its first frame
    // floors at MIN_SCALE instead of the true (zero) spring value.
    const scale = base.scale * (e.leaveAt === null ? Math.max(pop, MIN_SCALE / base.scale) : pop);
    const opacity = e.leaveAt === null ? 1 : leave(f, e.leaveAt, LEAVE_FRAMES);
    if (opacity > 0 && (e.leaveAt === null || scale > MIN_SCALE)) return { kind: e.kind, x: base.x, y: base.y, scale, opacity };
  }
  return null;
};

/**
 * The state of every element at `frame`. From the outro the scene is a still
 * (design §4, "980–1079 | everything | still"): every frame from `t.outro` on
 * reads as `t.outro` itself, so "Final hold identical" holds by construction.
 */
export const frameAt = (rawFrame: number, t: RelayTimeline = defaultTimeline): RelayState => {
  const frame = Math.min(rawFrame, t.outro);
  const start = take2Start(t);
  const take: 1 | 2 = frame >= start ? 2 : 1;
  const x = take === 2 ? frame : objectFrame(frame, t);
  const cast = castAt(t, take, x);
  const castPop = (actor: CastActor) => blockPop(x, t.pops[actor]);
  const balaoAppear = castPop("balao"), chavesAppear = castPop("chaves"), visorAppear = castPop("visor");
  const balaoFace = faceAt(t, take, "balao", x);
  const frightened = take === 1 && balaoFace === "failed";

  const rewindMark = (() => {
    const appear = pillPop(frame, t.pops.rewindMark);
    if (appear === null) return null;
    const opacity = appear.opacity * leave(frame, t.leaves.rewindMark, LEAVE_FRAMES);
    return opacity > 0 ? { opacity, scale: appear.scale } : null;
  })();
  // The badge circle pops once at `pops.badge1` and never fades out; the swap at
  // `badgeSwap` only flips which take number it reads (design §4.2, 440), so it
  // reuses that same appear instead of popping a second time.
  const swap = t.cues.badgeSwap[0];
  const badgeAppear = pillPop(frame, t.pops.badge1);
  const fade = (name: string) => t.fades[name];

  return {
    objectFrame: x,
    take,
    laptop: blockPop(x, t.pops.laptop),
    screen: take === 1
      ? { requestLine: x >= t.cues.requestLine[0], codeLines: count(t.cues.codeLines1, x) }
      : { requestLine: x >= t.cues.requestLine[1], codeLines: count(t.cues.codeLines2, x) },
    balao: balaoAppear === null ? null : {
      appear: balaoAppear, expression: balaoFace, speaks: cast.balao.speaks!, holdsStamp: cast.balao.holdsStamp!,
      tilt: frightened ? t.fright.tilt : 0,
      squash: frightened ? squashAfter(x, t.fright.at, t.fright.squash) : 1,
    },
    chaves: chavesAppear === null ? null : {
      appear: chavesAppear, expression: faceAt(t, take, "chaves", x), facing: cast.chaves.facing!, types: cast.chaves.types!, holdsSheet: cast.chaves.holdsSheet!,
    },
    visor: visorAppear === null ? null : { appear: visorAppear, expression: faceAt(t, take, "visor", x), points: cast.visor.points! },
    tokens: tokensAt(t, take, x),
    sheet: take === 2 ? sheetAt(t, frame) : null,
    failureArrow: take === 1 ? fadeIn(x, fade("failureArrow").in) : 0,
    paths: take === 1
      ? { p1: motionPathAt(x, fade("p1-t1").in, fade("p1-t1").out), p2: motionPathAt(x, fade("p2-t1").in, fade("p2-t1").out), p4: 0 }
      : {
          p1: motionPathAt(x, fade("p1-t2").in, fade("p1-t2").out),
          p2: motionPathAt(x, fade("p2-t2").in, fade("p2-t2").out),
          p4: Math.max(motionPathAt(x, fade("p4-carry").in, fade("p4-carry").out), motionPathAt(x, fade("p4-return").in, fade("p4-return").out)),
        },
    badge: badgeAppear === null ? null : { take: frame < swap ? 1 : 2, appear: badgeAppear },
    rewindMark,
    emote: emoteAt(t, frame),
  };
};

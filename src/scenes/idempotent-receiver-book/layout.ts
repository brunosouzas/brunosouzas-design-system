// The Idempotent Receiver book scene's stage layout (card SW-160; change
// idempotent-receiver-book-scene, design §6.1): every position, size and route
// in 960 × 540 stage units, drawn in an SVG with that viewBox over the
// 1920 × 1080 composition, as the gate-0 sheet (concept B, book) drew them.
// The rings and the motion guides are in composition pixels (stage ×
// STAGE_SCALE).
//
// A change here is a visual change (MOT-5): it goes back into design §6.1 and
// the pinned layout test (test/scenes/idempotent-receiver-book-layout.test.ts)
// in the same commit.
import type { Point } from "../../brand/motion";
import { LANE, type StoreBox } from "../eip-book";

export const STAGE = { width: 960, height: 540 } as const;
/** Composition pixels per stage unit (1920 × 1080 over 960 × 540). */
export const STAGE_SCALE = 2;

/** The sender: a pill in the caller's colour, its word at 33. */
export const SENDER = { x: 16, y: LANE - 32, width: 150, height: 64 } as const;
/** The two EIP icons on the lane: the point-to-point channel and the Idempotent Receiver. */
export const CHANNEL = { x: 196, scale: 2.8 } as const;
export const RECEIVER = { x: 520, scale: 3.4 } as const;
/** The processed IDs, under the receiver. */
export const STORE: StoreBox = { x: 560, y: 366, width: 160, height: 128 };
/** The lookup between the receiver and its store: dashed at rest, solid while the receiver looks up. */
export const LOOKUP = { from: [640, 274] as [number, number], to: [640, 362] as [number, number], rest: 2.5, active: 4 } as const;

/** Where a message token is (design §6.1): leaving the sender, in the channel, at the receiver's door, and the outcomes. */
export const AT = {
  sender: { x: 212, y: LANE },
  channel: { x: 286, y: LANE },
  door: { x: 488, y: LANE },
  processed: { x: 852, y: LANE },
  ghost: { x: 852, y: 320 },
  ignored: { x: 852, y: 428 },
} as const satisfies Record<string, Point>;
/** The check on the processed message. */
export const CHECK = { cx: 902, cy: 178, r: 22 } as const;
/** The `?` beside the lookup, at the sheet's scale. */
export const QUESTION = { cx: 700, cy: 318, scale: 2 } as const;

export const BADGE = { cx: 912, cy: 52 } as const;
export const REWIND_MARK = { x: 826, y: 28, size: 48 } as const;
/** Pop-in anchors of the pieces without a `scale` parameter. */
export const ANCHORS = {
  sender: { x: SENDER.x + SENDER.width / 2, y: LANE },
  channel: { x: CHANNEL.x + (64 * CHANNEL.scale) / 2, y: LANE },
  receiver: { x: RECEIVER.x + (64 * RECEIVER.scale) / 2, y: LANE },
  store: { x: STORE.x + STORE.width / 2, y: STORE.y + STORE.height / 2 },
  badge: { x: BADGE.cx, y: BADGE.cy },
  rewindMark: { x: REWIND_MARK.x + REWIND_MARK.size / 2, y: REWIND_MARK.y + REWIND_MARK.size / 2 },
} as const;

const n = (value: number) => Math.round(value * 1000) / 1000;
const p = (pt: Point) => `${n(pt.x)},${n(pt.y)}`;

/** The routes of the travelling tokens, stage units (design §6.1). */
export const ROUTES: Readonly<Record<string, string>> = {
  send: `M ${p(AT.sender)} L ${p(AT.channel)}`,
  deliver: `M ${p(AT.channel)} L ${p(AT.door)}`,
  process: `M ${p(AT.door)} C 600,110 760,140 ${p(AT.processed)}`,
  ignore: `M ${p(AT.door)} C 560,320 780,300 ${p(AT.ignored)}`,
};

/** The dashed guides (stage units), drawn × STAGE_SCALE by `MotionPath`: the lane, then the two ways out. */
export const GUIDES = {
  p1: `M ${n(SENDER.x + SENDER.width)},${LANE} L ${RECEIVER.x},${LANE}`,
  p2: ROUTES.process,
  p3: ROUTES.ignore,
} as const;

/** Composition-pixel centre of the rings: the stage's centre × 2. */
export const RINGS_CENTRE: Point = { x: 960, y: 540 };

/** A path of absolute commands with every number multiplied by `k` (stage units to composition pixels). */
export const scalePath = (d: string, k: number = STAGE_SCALE): string => d.replace(/-?\d+(?:\.\d+)?/g, (value) => String(n(Number(value) * k)));

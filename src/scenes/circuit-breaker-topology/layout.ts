// The circuit-breaker topology scene's stage layout (change
// circuit-breaker-topology-scene, design §4.3 and §6.1): every position, size
// and route in 960 × 540 stage units, drawn in an SVG with that viewBox over
// the 1920 × 1080 composition; the React components are drawn in a 960 × 540
// box scaled × 2, so their sizes are stage units too (design §2.3).
//
// A change here is a visual change (MOT-5): it goes back into design §6.1 and
// the pinned layout test (test/scenes/circuit-breaker-topology-layout.test.ts)
// in the same commit.
import type { Point } from "../../brand/motion";
import type { Route, StateName, TagPlace, TagText } from "./timeline";

export const STAGE = { width: 960, height: 540 } as const;
/** Composition pixels per stage unit (1920 × 1080 over 960 × 540). */
export const STAGE_SCALE = 2;

/** The smallest effective text sizes (design §2.2): words, then state names, take number and counters, then the square glyphs. */
export const TEXT_SIZE = { word: 33, strong: 36 } as const;

export const CHECKOUT = { x: 24, y: 164, width: 180, height: 150 } as const;
export const CHECKOUT_LABEL = { cx: 114, cy: 146, width: 170, height: 50 } as const;
export const PAYMENT = { x: 756, ys: [164, 214, 264], width: 180 } as const;
/** The height `serverStack` draws one unit at. */
export const PAYMENT_UNIT_HEIGHT = 40;
/** Where `serverStack` draws each unit's light (x + w − 24, y + 20), radius 6. */
export const PAYMENT_LIGHTS: readonly Point[] = PAYMENT.ys.map((y) => ({ x: PAYMENT.x + PAYMENT.width - 24, y: y + 20 }));
export const PAYMENT_LABEL = { cx: 846, cy: 146, width: 160, height: 50 } as const;
/** The breaker box once dropped in; its centre is (480, 251). */
export const BREAKER = { x: 310, y: 196, width: 340, height: 110 } as const;
export const STATE_PILL = { cx: 480, cy: 184, height: 54, widths: { closed: 180, open: 180, halfOpen: 240 } satisfies Record<StateName, number> } as const;
export const RETRY = { cx: 114, cy: 314, width: 150, height: 50 } as const;
export const BADGE = { cx: 912, cy: 52 } as const;
export const REWIND_MARK = { x: 826, y: 28, size: 48 } as const;
export const CLOCK = { cx: 330, cy: 70, size: 56 } as const;
export const CLOCK_LABEL = { x: 372, y: 82 } as const;
export const TAGS = { y: 362, x: { direct: 480, left: 257, right: 703 } satisfies Record<TagPlace, number> } as const;
/** How far above its baseline a tag's pop-in anchor sits (the middle of the words' x-height). */
export const TAG_POP_LIFT = 9;
/** Backdrop width of each tag text (design §6.1). */
export const TAG_WIDTHS: Readonly<Record<TagText, number>> = { timeout: 262, open: 420, ok: 84, business: 84 };
export const MESSAGE = { x: 24, y: 412 } as const;
export const SQUARE = { size: 50, x0: 360, step: 60, y: 382 } as const;
/** The left edge of window slot `s` (0–4; slot 5 is the dropped square's, −1 the slid-out one's). */
export const slotX = (s: number): number => SQUARE.x0 + SQUARE.step * s;
export const BAR = { x: 360, y: 442, width: 290, height: 16, threshold: 0.8 } as const;
export const REQUESTS = { badge: { cx: 60, cy: 500 }, label: { x: 106, y: 512 } } as const;
export const CALLS_COUNTER = { badge: { cx: 700, cy: 500 }, ghost: { cx: 622, cy: 500 }, label: { x: 936, y: 512 } } as const;
export const GHOST_OPACITY = 0.4;
export const TOKEN_RADIUS = 10;
/** How far the dropped `400` square falls (design §4.2, 1576–1586). */
export const DROP_FALL = 40;

/** The routes, stage units (design §4.3): each arrow is drawn on its route with a head at its end. */
export const ROUTES: Readonly<Record<Route, readonly [Point, Point]>> = {
  "direct-req": [{ x: 208, y: 228 }, { x: 752, y: 228 }],
  "direct-rep": [{ x: 752, y: 266 }, { x: 208, y: 266 }],
  "in-req": [{ x: 208, y: 228 }, { x: 306, y: 228 }],
  "out-req": [{ x: 654, y: 228 }, { x: 752, y: 228 }],
  "out-rep": [{ x: 752, y: 266 }, { x: 654, y: 266 }],
  "in-rep": [{ x: 306, y: 266 }, { x: 208, y: 266 }],
};
/** The breaker's centre travels this path in its drop-in, linear by length. */
export const DROP_PATH: readonly [Point, Point] = [{ x: 480, y: -60 }, { x: 480, y: 251 }];

/** Pop-in anchors (design §2.6) of the elements popped inside a scaled group: their centres. */
export const ANCHORS = {
  checkout: { x: CHECKOUT.x + CHECKOUT.width / 2, y: CHECKOUT.y + CHECKOUT.height / 2 },
  payment: { x: PAYMENT.x + PAYMENT.width / 2, y: (PAYMENT.ys[0] + PAYMENT.ys[2] + PAYMENT_UNIT_HEIGHT) / 2 },
  /** A tag pops about the middle of its words: 9 units above the baseline, about a third of the 33-unit text. */
  tag: (place: TagPlace): Point => ({ x: TAGS.x[place], y: TAGS.y - TAG_POP_LIFT }),
  retry: { x: RETRY.cx, y: RETRY.cy },
  badge: { x: BADGE.cx, y: BADGE.cy },
  rewindMark: { x: REWIND_MARK.x + REWIND_MARK.size / 2, y: REWIND_MARK.y + REWIND_MARK.size / 2 },
  statePill: { x: STATE_PILL.cx, y: STATE_PILL.cy },
  window: { x: (SQUARE.x0 + BAR.x + BAR.width) / 2, y: (SQUARE.y + BAR.y + BAR.height) / 2 },
  clock: { x: CLOCK.cx, y: CLOCK.cy },
  requests: { x: REQUESTS.badge.cx, y: REQUESTS.badge.cy },
  calls: { x: CALLS_COUNTER.badge.cx, y: CALLS_COUNTER.badge.cy },
  ghost: { x: CALLS_COUNTER.ghost.cx, y: CALLS_COUNTER.ghost.cy },
} as const;

/** Composition-pixel centre of the rings: the stage's centre × 2. */
export const RINGS_CENTRE: Point = { x: 960, y: 540 };

/** A straight path from `a` to `b` in composition pixels (stage × STAGE_SCALE), for `MotionPath`. */
export const compositionPath = ([a, b]: readonly [Point, Point], k: number = STAGE_SCALE): string => `M ${a.x * k},${a.y * k} L ${b.x * k},${b.y * k}`;

// The Idempotent Receiver Mule scene's stage layout (card SW-160; change
// idempotent-receiver-mule-scene, design §6.1): every position, size and route
// in 960 × 540 stage units, drawn in an SVG with that viewBox over the
// 1920 × 1080 composition, as the gate-0 sheet (concept B, Mule) drew them.
// The rings and the motion guides are in composition pixels (stage ×
// STAGE_SCALE).
//
// A change here is a visual change (MOT-5): it goes back into design §6.1 and
// the pinned layout test (test/scenes/idempotent-receiver-mule-layout.test.ts)
// in the same commit.
import type { Point } from "../../brand/motion";
import type { StoreBox } from "../eip-book";
import { restAbove, type ClientPlace, type ComponentBox } from "../eip-mule";

export const STAGE = { width: 960, height: 540 } as const;
/** Composition pixels per stage unit (1920 × 1080 over 960 × 540). */
export const STAGE_SCALE = 2;

/** Balão, the client, on the left (gate-0 sheet B-mule). */
export const CLIENT: ClientPlace = { x: 112, ground: 336, scale: 0.8 };
/** The published charge-flow diagram's three components, left to right (L42). */
export const LISTENER: ComponentBox = { x: 215, y: 150, width: 160, height: 112 };
export const VALIDATOR: ComponentBox = { x: 415, y: 132, width: 236, height: 148 };
export const CHARGE: ComponentBox = { x: 691, y: 150, width: 176, height: 112 };
/** The validator's object store, under it (L42 `eip-processed-orders-store`). */
export const STORE: StoreBox = { x: 433, y: 374, width: 200, height: 122 };
/** The lookup between the validator and its store: dashed at rest, solid while the validator looks up. */
export const LOOKUP = { from: [533, 284] as [number, number], to: [533, 370] as [number, number], rest: 2.5, active: 4 } as const;
/** The statement of charges under the charge (L44: each charge is an entry in a statement), one row per charge. */
export const STATEMENT = { x: 725, y: 314, width: 108, height: 190, top: 52, step: 44, bar: 52 } as const;
/** The statement's count of charges, on its top-right corner, and take 1's count beside it at the end (the ghost). */
export const COUNT = { cx: 833, cy: 314 } as const;
export const GHOST_COUNT = { cx: 903, cy: 314 } as const;

/** Where a token rests (design §6.1): above the client, and above each component. */
export const AT = {
  client: { x: CLIENT.x, y: 140 },
  listener: restAbove(LISTENER),
  validator: restAbove(VALIDATOR),
  charge: restAbove(CHARGE),
} as const satisfies Record<string, Point>;
/** The `?` beside the lookup, at the sheet's scale. */
export const QUESTION = { cx: 593, cy: 327, scale: 2 } as const;
/** Balão's emote, beside its head (CAST-3). */
export const EMOTE = { x: 34, y: 214, scale: 0.75 } as const;

export const BADGE = { cx: 912, cy: 52 } as const;
export const REWIND_MARK = { x: 826, y: 28, size: 48 } as const;
/** Pop-in anchors of the pieces without a `scale` parameter. */
export const ANCHORS = {
  balao: { x: CLIENT.x, y: CLIENT.ground },
  listener: { x: LISTENER.x + LISTENER.width / 2, y: LISTENER.y + LISTENER.height / 2 },
  validator: { x: VALIDATOR.x + VALIDATOR.width / 2, y: VALIDATOR.y + VALIDATOR.height / 2 },
  charge: { x: CHARGE.x + CHARGE.width / 2, y: CHARGE.y + CHARGE.height / 2 },
  store: { x: STORE.x + STORE.width / 2, y: STORE.y + STORE.height / 2 },
  statement: { x: STATEMENT.x + STATEMENT.width / 2, y: STATEMENT.y + STATEMENT.height / 2 },
  badge: { x: BADGE.cx, y: BADGE.cy },
  rewindMark: { x: REWIND_MARK.x + REWIND_MARK.size / 2, y: REWIND_MARK.y + REWIND_MARK.size / 2 },
} as const;

const n = (value: number) => Math.round(value * 1000) / 1000;
const p = (pt: Point) => `${n(pt.x)},${n(pt.y)}`;

const SEND = `M ${p(AT.client)} C 190,140 220,114 ${p(AT.listener)}`;
const PASS = `M ${p(AT.listener)} C 380,114 450,96 ${p(AT.validator)}`;
const CHARGE_LEG = `M ${p(AT.validator)} C 620,96 700,114 ${p(AT.charge)}`;
/** Each later leg of a guide, without its `M` (it starts where the leg before ends). */
const then = (leg: string) => leg.replace(/^M \S+ /, "");

/**
 * The routes of the travelling tokens, stage units (design §6.1): the
 * request's three legs, the retry's two (the same as the request's first two),
 * and the two ways back, from the charge and from the validator.
 */
export const ROUTES: Readonly<Record<string, string>> = {
  send: SEND,
  pass: PASS,
  charge: CHARGE_LEG,
  reply: `M ${p(AT.charge)} C 779,44 230,40 ${p(AT.client)}`,
  retrySend: SEND,
  retryPass: PASS,
  dupReply: `M ${p(AT.validator)} C 533,40 230,40 ${p(AT.client)}`,
};

/** The dashed guides (stage units), drawn × STAGE_SCALE by `MotionPath`: the request to the charge, the reply from it, the retry to the validator, the reply from it. */
export const GUIDES = {
  p1: `${SEND} ${then(PASS)} ${then(CHARGE_LEG)}`,
  p2: ROUTES.reply,
  p3: `${SEND} ${then(PASS)}`,
  p4: ROUTES.dupReply,
} as const;

/** Composition-pixel centre of the rings: the stage's centre × 2. */
export const RINGS_CENTRE: Point = { x: 960, y: 540 };

/** A path of absolute commands with every number multiplied by `k` (stage units to composition pixels). */
export const scalePath = (d: string, k: number = STAGE_SCALE): string => d.replace(/-?\d+(?:\.\d+)?/g, (value) => String(n(Number(value) * k)));

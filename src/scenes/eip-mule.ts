// The EIP "Mule" scene type (card SW-160; change idempotent-receiver-mule-scene,
// design §2.1): what every pattern's Mule scene shares, as the book scene type
// (src/scenes/eip-book.ts) does for the book scenes. The stage is the page's
// own Mule diagram laid left to right: the client (Balão, ADR 0007: the
// requester acting) on the left, the flow's components as boxes with the
// diagram's names, a store under the component that keeps the IDs, and the
// answers coming back above the client in their state colours.
//
// No React and no frame logic: the scene's frame.ts and stage.ts call these.
// The helpers draw only through the package's pieces (MOT-6).
import { balao, diagramBox } from "../pieces/library.ts";
import type { Drawn } from "../pieces/node.ts";
import type { CastExpression } from "../pieces/index.ts";
import { BOOK_TEXT } from "./eip-book";

/** The smallest effective text sizes, as in the book scenes: words, then IDs, codes, counts and take numbers. */
export const MULE_TEXT = BOOK_TEXT;

/** A component of the flow: a box with the diagram's name in centred lines at 33 (MULE_TEXT.word). */
export type ComponentBox = { x: number; y: number; width: number; height: number };
export const component = (b: ComponentBox, lines: readonly string[]): Drawn =>
  diagramBox({ x: b.x, y: b.y, width: b.width, height: b.height, text: [...lines], textSize: MULE_TEXT.word });

/** Where a token rests on a component: centred above its top edge, clear of its words (tokens are drawn above blocks, SCN-6). */
export const ABOVE_GAP = 36;
export const restAbove = (b: ComponentBox) => ({ x: b.x + b.width / 2, y: b.y - ABOVE_GAP });

/** The client: Balão facing the flow, standing on `ground`, scaled; its requests leave and its answers land above its head. */
export type ClientPlace = { x: number; ground: number; scale: number };
export type ClientPose = { expression: CastExpression; speaks: boolean };
export const client = (c: ClientPlace, pose: ClientPose): Drawn =>
  balao({ x: c.x, y: c.ground, scale: c.scale, facing: "right", expression: pose.expression, speaks: pose.speaks });

// The EIP "book" scene type (card SW-160; change idempotent-receiver-book-scene,
// design §2.1): what every pattern's book scene shares, so the next one (Dead
// Letter Channel, Correlation Identifier, Publish-Subscribe Channel) supplies
// only its icons, routes and timeline. The stage is the published book
// diagram laid left to right on one lane: the channel as the diagrams draw it
// (a queue without words), EIP icons from the package, a message as a pill
// token carrying its ID, a store under the receiver, the outcomes on the right
// in their state colours.
//
// No React and no frame logic: the scene's frame.ts and stage.ts call these.
// The helpers draw only through the package's pieces (MOT-6).
import { diagramBox, eipIcon, queueNode, storeNode } from "../pieces/library.ts";
import type { Drawn } from "../pieces/node.ts";

/** The smallest effective text sizes in stage units (circuit-breaker-topology design §2.2): words, then IDs, codes and take numbers. */
export const BOOK_TEXT = { word: 33, strong: 36 } as const;

/** The message path's y on the 960 × 540 stage: every icon's arrow and every token sit on it. */
export const LANE = 212;

/**
 * The y of each used icon's message arrow inside its 64 × 40 drawing: the y of
 * the arrow's line (its `M x,y H …` path in src/pieces/eip-icons.ts), so
 * `iconOnLane` puts that line on the lane. A pattern's scene adds its icons
 * here, read the same way.
 */
export const ICON_ARROW_Y = { "idempotent-receiver": 23 } as const;
export type LaneIcon = keyof typeof ICON_ARROW_Y;

/** An EIP icon at `x`, scaled, with its message arrow on the lane. */
export const iconOnLane = (name: LaneIcon, x: number, scale: number): Drawn => eipIcon({ name, x, y: LANE - ICON_ARROW_Y[name] * scale, scale });

/**
 * A message channel on the lane: a queue with no words (SW-249), centred on the
 * lane, the shape the pages' diagrams draw for a channel; the package has no
 * EIP icon for a plain Message Channel (change idempotent-receiver-book-scene,
 * design §7, point 5).
 */
export type ChannelBox = { x: number; width: number; height: number };
export const channelOnLane = (c: ChannelBox): Drawn => queueNode({ x: c.x, y: LANE - c.height / 2, width: c.width, height: c.height });

/** A message token: a pill 56 high with its ID at 36 (BOOK_TEXT.strong), white in flight, a state colour once it has an outcome. */
export const TOKEN = { height: 56, minWidth: 84, perCharacter: 19, padding: 44 } as const;
export const tokenWidth = (word: string): number => Math.max(TOKEN.minWidth, Math.round(word.replace(/`/g, "").length * TOKEN.perCharacter + TOKEN.padding));
export const messageToken = (cx: number, cy: number, word: string, fill: string = "color.white"): Drawn => {
  const width = tokenWidth(word);
  return diagramBox({ x: cx - width / 2, y: cy - TOKEN.height / 2, width, height: TOKEN.height, shape: "pill", text: [word], fill, textSize: BOOK_TEXT.strong });
};

/** A store's box; its words, when it holds an ID, at 36. */
export type StoreBox = { x: number; y: number; width: number; height: number };
/** The store empty (SW-248: `storeNode` without `text`). */
export const emptyStore = (s: StoreBox): Drawn => storeNode({ ...s });
/** The store holding `id`: its words only, to draw over `emptyStore` so the ID can pop in on its own. */
export const storedId = (s: StoreBox, id: string): Drawn => ({ body: [], text: storeNode({ ...s, text: [id], textSize: BOOK_TEXT.strong }).text });

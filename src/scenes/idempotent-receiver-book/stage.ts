// The Idempotent Receiver book scene's stage at a frame, as piece trees with no
// React (card SW-160; change idempotent-receiver-book-scene, design §3 and
// §6.2): `stageOf(state)` gives the four stage SVG layers in 960 × 540 stage
// units, bottom to top (SCN-6): `below` (the lookup arrow), `nodes` (the
// sender, the channel, the receiver, the store and the ID in it), `tokens`
// (take 1's faded result, the messages, the check and the `?`) and `above`
// (the badge, the rewind mark). Scene.tsx draws them; the tests read words,
// pieces and positions from the same trees.
//
// The scene draws only through the package's pieces, through the book scene
// type (src/scenes/eip-book.ts) that wraps them (MOT-6): this file computes
// parameters, positions and pop-in wrappers and creates no shape of its own.
// Every element sits in a group named by `data-element`; an element that is
// not drawn (opacity 0 or scale at most 0.001, frame.ts) is left out of the
// tree.
import { tokens } from "../../../tokens/generated/tokens";
import type { Point } from "../../brand/motion";
import { checkBadge, countBadge, diagramBox, messageArrow, questionToken, uiIcon } from "../../pieces/library.ts";
import { g, type Drawn, type SvgNode } from "../../pieces/node.ts";
import { BOOK_TEXT, channelOnLane, emptyStore, iconOnLane, messageToken, storedId } from "../eip-book";
import { frameAt, type Appear, type BookState, type TokenFill } from "./frame";
import { ANCHORS, AT, BADGE, CHANNEL, CHECK, LOOKUP, QUESTION, RECEIVER, REWIND_MARK, SENDER, STORE } from "./layout";
import { text } from "./scene.ts";

const words = text.en;
const FILL: Record<TokenFill, string> = { white: "color.white", healthy: "color.state.healthy", blocked: "color.state.blocked" };

// ---------------------------------------------------------------- groups

/** The cover command's groups (src/pieces/cover.ts): bodies outlined in ink, words in the label face. */
const outlinedGroup = (...bodies: SvgNode[]) => g({ stroke: tokens.color.ink, "stroke-width": tokens.outline.block, "stroke-linejoin": "round" }, ...bodies);
const labelsGroup = (...texts: SvgNode[]) =>
  g({ "font-family": tokens.font.sans, "font-size": tokens.cover.labelSize, "font-weight": tokens.cover.labelWeight, fill: tokens.color.ink, "text-anchor": "middle" }, ...texts);
const layer = (name: string, pieces: readonly Drawn[]): SvgNode =>
  g({ "data-layer": name }, outlinedGroup(...pieces.flatMap((d) => d.body)), labelsGroup(...pieces.flatMap((d) => d.text)));

const settled = (a: Appear) => a.opacity === 1 && a.scale === 1;
/** A piece popping about `anchor` at an extra `opacity`: scaled and faded in a group; settled and opaque, the piece as it is. */
const shown = (d: Drawn, appear: Appear, anchor: Point, opacity = 1): Drawn => {
  if (settled(appear) && opacity === 1) return d;
  const attrs = {
    ...(appear.scale === 1 ? {} : { transform: `translate(${anchor.x} ${anchor.y}) scale(${appear.scale}) translate(${-anchor.x} ${-anchor.y})` }),
    opacity: appear.opacity * opacity,
  };
  return { body: d.body.length > 0 ? [g(attrs, ...d.body)] : [], text: d.text.length > 0 ? [g(attrs, ...d.text)] : [] };
};
const faded = (d: Drawn, opacity: number): Drawn => (opacity === 1 ? d : shown(d, { opacity: 1, scale: 1 }, { x: 0, y: 0 }, opacity));
/** One stage element, named so the tests can read the layers (SCN-6). */
const element = (name: string, d: Drawn): Drawn => ({
  body: d.body.length > 0 ? [g({ "data-element": name }, ...d.body)] : [],
  text: d.text.length > 0 ? [g({ "data-element": name }, ...d.text)] : [],
});
const named = (parts: [string, Drawn | null][]): Drawn[] => parts.flatMap(([name, d]) => (d === null ? [] : [element(name, d)]));

// ---------------------------------------------------------------- layers

/** Element order inside each layer, bottom to top (design §6.2). */
export const BELOW_ORDER = ["lookup"] as const;
export const NODES_ORDER = ["sender", "channel", "receiver", "store", "stored"] as const;
export const TOKENS_ORDER = ["ghost", "message", "copy", "check", "question"] as const;
export const ABOVE_ORDER = ["badge", "rewind-mark"] as const;

const belowOf = (s: BookState): SvgNode =>
  layer("below", named([
    ["lookup", s.store === null ? null : shown(
      messageArrow({ from: LOOKUP.from, to: LOOKUP.to, curve: "straight", heads: "both", dashed: !s.lookup, width: s.lookup ? LOOKUP.active : LOOKUP.rest }),
      s.store, ANCHORS.store,
    )],
  ]));

const nodesOf = (s: BookState): SvgNode =>
  layer("nodes", named([
    ["sender", s.sender && shown(
      diagramBox({ x: SENDER.x, y: SENDER.y, width: SENDER.width, height: SENDER.height, shape: "pill", fill: "color.state.caller", text: [words.sender], textSize: BOOK_TEXT.word }),
      s.sender, ANCHORS.sender,
    )],
    ["channel", s.channel && shown(channelOnLane(CHANNEL), s.channel, ANCHORS.channel)],
    ["receiver", s.receiver && shown(iconOnLane("idempotent-receiver", RECEIVER.x, RECEIVER.scale), s.receiver, ANCHORS.receiver)],
    ["store", s.store && shown(emptyStore(STORE), { ...s.store, scale: s.store.scale * s.storeFocus }, ANCHORS.store)],
    ["stored", s.stored && shown(storedId(STORE, words.id), { ...s.stored, scale: s.stored.scale * s.storeFocus }, ANCHORS.store)],
  ]));

const tokensOf = (s: BookState): SvgNode =>
  layer("tokens", named([
    ["ghost", s.ghost > 0 ? faded(messageToken(AT.ghost.x, AT.ghost.y, words.id, FILL.healthy), s.ghost * tokens.motion.dimOpacity) : null],
    ...s.messages.map((m): [string, Drawn] => [m.id, shown(messageToken(m.point.x, m.point.y, words.id, FILL[m.fill]), m.appear, m.point)]),
    ["check", s.check && shown(checkBadge({ ...CHECK }), s.check, { x: CHECK.cx, y: CHECK.cy })],
    ["question", s.question && shown(questionToken({ ...QUESTION }), s.question, { x: QUESTION.cx, y: QUESTION.cy })],
  ]));

const aboveOf = (s: BookState): SvgNode =>
  layer("above", named([
    ["badge", s.badge && shown(countBadge({ ...BADGE, text: words.takes[s.badge.take - 1], textSize: BOOK_TEXT.strong }), s.badge.appear, ANCHORS.badge)],
    ["rewind-mark", s.rewindMark && shown(uiIcon({ name: "reset", ...REWIND_MARK }), s.rewindMark, ANCHORS.rewindMark)],
  ]));

export type Stage = { below: SvgNode; nodes: SvgNode; tokens: SvgNode; above: SvgNode };
export const STAGE_LAYERS = ["below", "nodes", "tokens", "above"] as const;
export const stageOf = (s: BookState): Stage => ({ below: belowOf(s), nodes: nodesOf(s), tokens: tokensOf(s), above: aboveOf(s) });

/** The stage at `frame`, with its state. */
export const stageAt = (frame: number) => {
  const state = frameAt(frame);
  return { state, ...stageOf(state) };
};

// The SDD scene's stage at a frame, as piece trees with no React (change
// sdd-without-with-spec-scene, design §5 and §6): `stageAt(frame)` gives the
// three stage layers (`pieces`, layer 3; `tokens`, layer 4; `emote`, layer 6),
// each a group of piece bodies inside the cover command's outlined group and
// the pieces' words inside its labels group, in 960 × 540 stage units.
// Scene.tsx draws them with `toReact`; the tests read words, pieces and
// positions from the same trees.
//
// The scene draws only through the package's pieces and `pose` (MOT-6,
// CAST-1): this file computes parameters, positions and pop-in wrappers, and
// creates no shape of its own. An element that is not drawn (opacity 0 or
// scale at most 0.001, takes.ts) is left out of the tree.
import { tokens } from "../../../tokens/generated/tokens";
import type { Point } from "../../brand/motion";
import { codePanel, countBadge, emote, messageArrow, pill, questionToken, sheet, speechBubble, stamp, uiIcon, visor } from "../../pieces/library.ts";
import { g, type Drawn, type SvgNode } from "../../pieces/node.ts";
import { pose } from "../../pieces/pose.ts";
import { skin } from "../../pieces/skin.ts";
import {
  ANCHORS, BADGE, BALLOON, CAST_SCALE, CODE_LINE_SHAPES, CODE_PANEL, FAILURE_ARROW, PAGE, REWIND_MARK, STAMP, VISOR, pageRows, slotAt,
} from "./layout";
import { text } from "./scene.ts";
import { frameAt, type SddState } from "./takes";

type Appearance = { opacity: number; scale: number };
const settled = (a: Appearance) => a.opacity === 1 && a.scale === 1;

/** The cover command's groups (src/pieces/cover.ts): bodies outlined in ink, words in the label face. */
const outlinedGroup = (...bodies: SvgNode[]) => g({ stroke: tokens.color.ink, "stroke-width": tokens.outline.block, "stroke-linejoin": "round" }, ...bodies);
const labelsGroup = (...words: SvgNode[]) =>
  g({ "font-family": tokens.font.sans, "font-size": tokens.cover.labelSize, "font-weight": tokens.cover.labelWeight, fill: tokens.color.ink, "text-anchor": "middle" }, ...words);
const layer = (name: string, pieces: readonly Drawn[]): SvgNode =>
  g({ "data-layer": name }, outlinedGroup(...pieces.flatMap((d) => d.body)), labelsGroup(...pieces.flatMap((d) => d.text)));

/** A piece popping in about `anchor`: scaled and faded in a group; settled, the piece as it is. */
const popped = (drawn: Drawn, appear: Appearance, anchor: Point): Drawn => {
  if (settled(appear)) return drawn;
  const attrs = { transform: `translate(${anchor.x} ${anchor.y}) scale(${appear.scale}) translate(${-anchor.x} ${-anchor.y})`, opacity: appear.opacity };
  return { body: [g(attrs, ...drawn.body)], text: drawn.text.length > 0 ? [g(attrs, ...drawn.text)] : [] };
};
const faded = (drawn: Drawn, opacity: number): Drawn =>
  opacity === 1 ? drawn : { body: [g({ opacity }, ...drawn.body)], text: drawn.text.length > 0 ? [g({ opacity }, ...drawn.text)] : [] };

const codeLines = (n: number) => CODE_LINE_SHAPES.slice(0, n).map((line) => ({ ...line, color: "white" as const }));

/** The page's marks group gets its ink stroke, as Visor's held sheet does (src/pieces/brand-cast.ts, `heldSheet`). */
const inkMarks = (node: SvgNode): SvgNode =>
  node.tag === "g" && node.attrs["stroke-width"] === tokens.outline.small && node.attrs.stroke === undefined
    ? { ...node, attrs: { ...node.attrs, stroke: tokens.color.ink } }
    : node;

/**
 * `proposal.md` after the hand-over: the `sheet` and `pill` pieces of Visor's
 * held page, in one group at CAST_SCALE with the held sheet's outline, so at
 * the hand-over frame it draws exactly where and as the held one did.
 */
const handedOverPage = (page: NonNullable<SddState["page"]>): Drawn => {
  const transform = `translate(${page.at.x} ${page.at.y}) scale(${CAST_SCALE})`;
  const paper = sheet({ x: 0, y: 0, width: PAGE.width, height: PAGE.height, top: PAGE.top, step: PAGE.step, rows: pageRows(page.questions, page.checked) });
  const tag = pill({ x: PAGE.width / 2, y: 0, text: text.en.file });
  const outline = skin("light").outline;
  return {
    body: [g({ "data-page": text.en.file, transform }, g({ stroke: outline, "stroke-width": tokens.outline.block, "stroke-linejoin": "round" }, ...paper.body.map(inkMarks), ...tag.body))],
    text: [g({ transform, "font-family": tokens.font.sans, "font-size": tokens.cover.labelSize, "font-weight": tokens.cover.labelWeight, fill: tokens.color.ink, "text-anchor": "middle" }, ...paper.text, ...tag.text)],
  };
};

/** The parameters of the one cast piece (CAST-5: scale 1.15 on the ground line; CAST-2: never recoloured). */
export const visorParams = (v: NonNullable<SddState["visor"]>) => ({
  x: VISOR.x,
  y: VISOR.y,
  scale: CAST_SCALE,
  expression: v.expression,
  points: v.points,
  ...(v.held === null ? {} : { holdsSheet: { width: PAGE.width, height: PAGE.height, top: PAGE.top, step: PAGE.step, label: text.en.file, rows: pageRows(v.held.questions, 0) } }),
});

const posedVisor = (v: NonNullable<SddState["visor"]>): Drawn => {
  const drawn = visor(visorParams(v));
  const at = { x: VISOR.x, y: VISOR.y, tilt: v.tilt, squash: v.squash, scale: v.appear.scale, opacity: v.appear.opacity };
  return { body: [pose(g({}, ...drawn.body), at)], text: drawn.text.length > 0 ? [pose(g({}, ...drawn.text), at)] : [] };
};

/** Layer 3: the stage pieces, bottom to top (design §6). */
const piecesLayer = (s: SddState): SvgNode => {
  const out: Drawn[] = [];
  if (s.failureArrow > 0) out.push(faded(messageArrow(FAILURE_ARROW), s.failureArrow));
  if (s.balloon) out.push(popped(speechBubble({ ...BALLOON, fill: "color.state.caller" }), s.balloon, ANCHORS.balloon));
  if (s.codePanel) out.push(popped(codePanel({ ...CODE_PANEL, lines: codeLines(s.codePanel.lines) }), s.codePanel.appear, ANCHORS.codePanel));
  if (s.page) out.push(handedOverPage(s.page));
  if (s.visor) out.push(posedVisor(s.visor));
  if (s.stamp) out.push(popped(stamp({ cx: STAMP.cx, cy: STAMP.cy, r: STAMP.r, word: text.en.approval }), s.stamp, ANCHORS.stamp));
  if (s.badge) out.push(popped(countBadge({ cx: BADGE.cx, cy: BADGE.cy, textSize: BADGE.textSize, text: text.en.takes[s.badge.text === "1" ? 0 : 1] }), s.badge.appear, ANCHORS.badge));
  if (s.rewindMark) out.push(popped(uiIcon({ name: "reset", ...REWIND_MARK }), s.rewindMark, ANCHORS.rewindMark));
  return layer("pieces", out);
};

/** Layer 4: the `?` waiting in the balloon and in flight, at the cast's scale. */
const tokensLayer = (s: SddState): SvgNode => {
  const out: Drawn[] = [];
  s.slots.forEach((appear, i) => {
    if (appear === null) return;
    const at = slotAt(i);
    out.push(faded(questionToken({ cx: at.x, cy: at.y, scale: CAST_SCALE * appear.scale }), appear.opacity));
  });
  for (const q of s.questions) out.push(questionToken({ cx: q.point.x, cy: q.point.y, scale: CAST_SCALE }));
  return layer("tokens", out);
};

/** Layer 6: the one emote beside Visor's head. */
const emoteLayer = (s: SddState): SvgNode =>
  layer("emote", s.emote === null ? [] : [faded(emote({ kind: s.emote.kind, x: s.emote.x, y: s.emote.y, scale: s.emote.scale }), s.emote.opacity)]);

export type Stage = { pieces: SvgNode; tokens: SvgNode; emote: SvgNode };

/** The three stage layers at `frame`, or of a state already computed. */
export const stageOf = (state: SddState): Stage => ({ pieces: piecesLayer(state), tokens: tokensLayer(state), emote: emoteLayer(state) });
export const stageAt = (frame: number): Stage => stageOf(frameAt(frame));

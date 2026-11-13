// The SDD relay scene's stage at a frame, as piece trees with no React (change
// sdd-scene-1-relay, design §3 and §6.2): `stageOf(state)` gives the five
// stage SVG layers in 960 × 540 stage units, bottom to top: `below` (the
// failure arrow, the keyboard, the screen), `cast` (Visor, Chaves, Balão),
// `sheet` (the free `proposal.md`, its label and the `GO` mark), `tokens` (the
// `?`) and `above` (the badge, the rewind mark, the emote). Scene.tsx draws
// them; the tests read words, pieces and positions from the same trees.
//
// The scene draws only through the package's pieces and `pose` (MOT-6,
// CAST-1): this file computes parameters, positions and pop-in wrappers and
// creates no shape of its own. Every element sits in a group named by
// `data-element`; an element that is not drawn (opacity 0 or scale at most
// 0.001, frame.ts) is left out of the tree.
import { tokens } from "../../../tokens/generated/tokens";
import type { Point } from "../../brand/motion";
import { balao, chaves, codePanel, countBadge, diagramBox, emote, keyboard, messageArrow, questionToken, sheet, stamp, uiIcon, visor } from "../../pieces/library.ts";
import { g, type Drawn, type SvgNode } from "../../pieces/node.ts";
import { pose } from "../../pieces/pose.ts";
import {
  ANCHORS, BADGE, CAST_SCALE, CAST_X, CODE_LINE_SHAPES, FAILURE_ARROW, GO_MARK, GROUND, KEYBOARD_LOCAL, LABEL, LAPTOP_ANCHOR, PAGE, REQUEST_LINE, REWIND_MARK, SCREEN,
  TEXT_SIZE, TOKEN_SCALE, goCentre, labelCentre, pageRows,
} from "./layout";
import { frameAt, type Appear, type RelayState, type SheetState } from "./frame";
import { text } from "./scene.ts";

const words = text.en;

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

// ---------------------------------------------------------------- the cast

/** A cast piece popped and posed about its ground point (CAST-5: one scale, one ground line). */
const posed = (d: Drawn, x: number, a: Appear, tilt = 0, squash = 1): Drawn => {
  const at = { x, y: GROUND, tilt, squash, scale: a.scale, opacity: a.opacity };
  return { body: d.body.map((node) => pose(node, at)), text: d.text.map((node) => pose(node, at)) };
};

/** The held sheet's parameters (design §2.2, §2.9): no label of its own; the scene draws the label at 33. */
export const heldSheet = (s: SheetState) => ({ width: PAGE.width, height: PAGE.height, top: PAGE.top, step: PAGE.step, rows: pageRows(s.rows, s.checked) });

export const balaoParams = (b: NonNullable<RelayState["balao"]>) => ({
  x: CAST_X.balao, y: GROUND, scale: CAST_SCALE, facing: "right" as const, expression: b.expression,
  ...(b.speaks ? { speaks: true } : {}), ...(b.holdsStamp ? { holdsStamp: { word: words.approval } } : {}),
});
export const chavesParams = (c: NonNullable<RelayState["chaves"]>, sheetState: SheetState | null) => ({
  x: CAST_X.chaves, y: GROUND, scale: CAST_SCALE, facing: c.facing, expression: c.expression,
  ...(c.types ? { types: true } : {}),
  ...(c.holdsSheet && sheetState !== null ? { holdsSheet: heldSheet(sheetState) } : {}),
});
export const visorParams = (v: NonNullable<RelayState["visor"]>) => ({
  x: CAST_X.visor, y: GROUND, scale: CAST_SCALE, facing: "left" as const, expression: v.expression, points: v.points,
});

// ---------------------------------------------------------------- props

const screenOf = (s: RelayState): Drawn =>
  codePanel({
    x: SCREEN.x, y: SCREEN.y, width: SCREEN.width, height: SCREEN.height, top: SCREEN.top, step: SCREEN.step,
    lines: [...(s.screen.requestLine ? [REQUEST_LINE] : []), ...CODE_LINE_SHAPES.slice(0, s.screen.codeLines).map((line) => ({ ...line, color: "white" as const }))],
  });

/** The laptop's base at Chaves's typing spot, in his units (so it is exactly the keyboard he types at). */
const keyboardProp = (): Drawn => {
  const board = keyboard({ ...KEYBOARD_LOCAL });
  return { body: [g({ transform: `translate(${CAST_X.chaves} ${GROUND}) scale(${CAST_SCALE})` }, ...board.body)], text: [] };
};

/** The sheet's marks group gets its ink stroke, as a held sheet's does (brand-cast.ts, `holdSheet`). */
const inkMarks = (node: SvgNode): SvgNode =>
  node.tag === "g" && node.attrs["stroke-width"] === tokens.outline.small && node.attrs.stroke === undefined
    ? { ...node, attrs: { ...node.attrs, stroke: tokens.color.ink } }
    : node;

/** `proposal.md` as a free sheet at `at` (design §2.9): the `sheet` piece at the cast scale, drawn as Chaves's held sheet is. */
const freeSheet = (s: SheetState): Drawn => {
  const transform = `translate(${s.at.x} ${s.at.y}) scale(${CAST_SCALE})`;
  const paper = sheet({ x: 0, y: 0, width: PAGE.width, height: PAGE.height, top: PAGE.top, step: PAGE.step, rows: pageRows(s.rows, s.checked) });
  return {
    body: [g({ transform }, g({ stroke: tokens.color.ink, "stroke-width": tokens.outline.block, "stroke-linejoin": "round" }, ...paper.body.map(inkMarks)))],
    text: paper.text.length > 0 ? [g({ transform }, ...paper.text)] : [],
  };
};
const labelOf = (s: SheetState): Drawn => {
  const c = labelCentre(s.at);
  return diagramBox({ shape: "pill", x: c.x - LABEL.width / 2, y: c.y - LABEL.height / 2, width: LABEL.width, height: LABEL.height, text: [words.file], fill: "color.white", textSize: TEXT_SIZE.word });
};
/** The `GO` mark: the `stamp` piece in a group scaled `GO_MARK.scale` about its centre, times its pop. */
const goMarkOf = (s: SheetState, a: Appear): Drawn => {
  const c = goCentre(s.at);
  const mark = stamp({ cx: 0, cy: 0, r: GO_MARK.r, word: words.approval });
  const attrs = { transform: `translate(${c.x} ${c.y}) scale(${GO_MARK.scale * a.scale})`, ...(a.opacity === 1 ? {} : { opacity: a.opacity }) };
  return { body: [g(attrs, ...mark.body)], text: [g(attrs, ...mark.text)] };
};

// ---------------------------------------------------------------- layers

/** Layer 3, bottom to top (design §6.2). */
export const BELOW_ORDER = ["failure-arrow", "keyboard", "screen"] as const;
export const CAST_ORDER = ["visor", "chaves", "balao"] as const;
export const SHEET_ORDER = ["sheet", "label", "go-mark"] as const;
export const ABOVE_ORDER = ["badge", "rewind-mark", "emote"] as const;

const belowOf = (s: RelayState): SvgNode => {
  const typing = s.chaves?.types === true;
  const parts: [string, Drawn | null][] = [
    ["failure-arrow", s.failureArrow > 0 ? faded(messageArrow(FAILURE_ARROW), s.failureArrow) : null],
    ["keyboard", s.laptop && !typing ? shown(keyboardProp(), s.laptop, LAPTOP_ANCHOR) : null],
    ["screen", s.laptop ? shown(screenOf(s), s.laptop, LAPTOP_ANCHOR) : null],
  ];
  return layer("below", parts.flatMap(([name, d]) => (d === null ? [] : [element(name, d)])));
};

const castOf = (s: RelayState): SvgNode => {
  const parts: [string, Drawn | null][] = [
    ["visor", s.visor ? posed(visor(visorParams(s.visor)), CAST_X.visor, s.visor.appear) : null],
    ["chaves", s.chaves ? posed(chaves(chavesParams(s.chaves, s.sheet)), CAST_X.chaves, s.chaves.appear) : null],
    ["balao", s.balao ? posed(balao(balaoParams(s.balao)), CAST_X.balao, s.balao.appear, s.balao.tilt, s.balao.squash) : null],
  ];
  return layer("cast", parts.flatMap(([name, d]) => (d === null ? [] : [element(name, d)])));
};

const sheetOf = (s: RelayState): SvgNode => {
  const sh = s.sheet;
  const parts: [string, Drawn | null][] = sh === null ? [] : [
    // In Chaves's hand the sheet is his; the label and the mark are drawn over it at the same places (design §2.9).
    ["sheet", sh.place === "held" ? null : shown(freeSheet(sh), sh.appear, { x: sh.at.x + (PAGE.width * CAST_SCALE) / 2, y: sh.at.y + (PAGE.height * CAST_SCALE) / 2 })],
    ["label", shown(labelOf(sh), sh.appear, { x: sh.at.x + (PAGE.width * CAST_SCALE) / 2, y: sh.at.y + (PAGE.height * CAST_SCALE) / 2 })],
    ["go-mark", sh.go === null ? null : goMarkOf(sh, sh.go)],
  ];
  return layer("sheet", parts.flatMap(([name, d]) => (d === null ? [] : [element(name, d)])));
};

const tokensOf = (s: RelayState): SvgNode =>
  layer("tokens", s.tokens.map((q) => element(`question-${q.id}`, faded(questionToken({ cx: q.point.x, cy: q.point.y, scale: TOKEN_SCALE }), q.opacity))));

const aboveOf = (s: RelayState): SvgNode => {
  const parts: [string, Drawn | null][] = [
    ["badge", s.badge ? shown(countBadge({ ...BADGE, text: words.takes[s.badge.take - 1], textSize: TEXT_SIZE.strong }), s.badge.appear, ANCHORS.badge) : null],
    ["rewind-mark", s.rewindMark ? shown(uiIcon({ name: "reset", ...REWIND_MARK }), s.rewindMark, ANCHORS.rewindMark) : null],
    ["emote", s.emote ? faded(emote({ kind: s.emote.kind, x: s.emote.x, y: s.emote.y, scale: s.emote.scale }), s.emote.opacity) : null],
  ];
  return layer("above", parts.flatMap(([name, d]) => (d === null ? [] : [element(name, d)])));
};

export type Stage = { below: SvgNode; cast: SvgNode; sheet: SvgNode; tokens: SvgNode; above: SvgNode };
export const STAGE_LAYERS = ["below", "cast", "sheet", "tokens", "above"] as const;
export const stageOf = (s: RelayState): Stage => ({ below: belowOf(s), cast: castOf(s), sheet: sheetOf(s), tokens: tokensOf(s), above: aboveOf(s) });

/** The stage at `frame`, with its state. */
export const stageAt = (frame: number) => {
  const state = frameAt(frame);
  return { state, ...stageOf(state) };
};

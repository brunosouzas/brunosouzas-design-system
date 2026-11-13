// The SDD archive scene's stage at a frame, as piece trees with no React
// (change sdd-scene-3-archive, design §3 and §6.2): `stageOf(state)` gives
// the five stage SVG layers in 960 x 540 stage units, bottom to top: `book`
// (the living spec and its field-count pill), `folders` (the two change
// folders and the single finding's `?` pill), `cast` (Visor, Chaves, Balão),
// `verdict` (the `GO` stamp) and `above` (the emote). Scene.tsx draws them;
// the tests read words, pieces and positions from the same trees.
//
// The scene draws only through the package's pieces and `pose` (MOT-6,
// CAST-1): this file computes parameters, positions and wrappers and creates
// no shape of its own. Every element sits in a group named by `data-element`;
// an element that is not drawn (opacity 0 or scale at most 0.001, frame.ts) is
// left out of the tree.
import { tokens } from "../../../tokens/generated/tokens";
import type { Point } from "../../brand/motion";
import { balao, book, chaves, diagramBox, emote, folder, stamp, visor } from "../../pieces/library.ts";
import { g, type Drawn, type SvgNode } from "../../pieces/node.ts";
import { pose } from "../../pieces/pose.ts";
import { frameAt, type Appear, type ArchiveState, type FolderState } from "./frame";
import { BOOK, BOOK_CENTRE, CAST_SCALE, CAST_X, FIELD_PILL, FINDING_PILL, GO, GROUND, TEXT_SIZE, folderTopLeft } from "./layout";
import { text } from "./scene.ts";

const words = text.en;

// ---------------------------------------------------------------- groups

const outlinedGroup = (...bodies: SvgNode[]) => g({ stroke: tokens.color.ink, "stroke-width": tokens.outline.block, "stroke-linejoin": "round" }, ...bodies);
const labelsGroup = (...texts: SvgNode[]) =>
  g({ "font-family": tokens.font.sans, "font-size": tokens.cover.labelSize, "font-weight": tokens.cover.labelWeight, fill: tokens.color.ink, "text-anchor": "middle" }, ...texts);
const layer = (name: string, pieces: readonly Drawn[]): SvgNode =>
  g({ "data-layer": name }, outlinedGroup(...pieces.flatMap((d) => d.body)), labelsGroup(...pieces.flatMap((d) => d.text)));

/** A drawing wrapped in one group's attributes, bodies and words alike. */
const wrapped = (d: Drawn, attrs: Record<string, string | number>): Drawn => ({
  body: d.body.length > 0 ? [g(attrs, ...d.body)] : [],
  text: d.text.length > 0 ? [g(attrs, ...d.text)] : [],
});
const settled = (a: Appear) => a.opacity === 1 && a.scale === 1;
/** A piece popping about `anchor`: scaled and faded in a group; settled, the piece as it is. */
const shown = (d: Drawn, appear: Appear, anchor: Point): Drawn => {
  if (settled(appear)) return d;
  return wrapped(d, {
    ...(appear.scale === 1 ? {} : { transform: `translate(${anchor.x} ${anchor.y}) scale(${appear.scale}) translate(${-anchor.x} ${-anchor.y})` }),
    opacity: appear.opacity,
  });
};
const faded = (d: Drawn, opacity: number): Drawn => (opacity === 1 ? d : wrapped(d, { opacity }));
/** One stage element, named so the tests can read the layers (SCN-6). */
const element = (name: string, d: Drawn): Drawn => wrapped(d, { "data-element": name });

// ---------------------------------------------------------------- the cast

/** A cast piece popped and posed about its ground point (CAST-5: one scale, one ground line). */
const posed = (d: Drawn, x: number, a: Appear): Drawn => {
  const at = { x, y: GROUND, tilt: 0, squash: 1, scale: a.scale, opacity: a.opacity };
  return { body: d.body.map((node) => pose(node, at)), text: d.text.map((node) => pose(node, at)) };
};

export const balaoParams = (b: NonNullable<ArchiveState["balao"]>) => ({
  x: CAST_X.balao, y: GROUND, scale: CAST_SCALE, facing: "right" as const, expression: b.expression,
  ...(b.speaks ? { speaks: true } : {}), ...(b.holdsStamp ? { holdsStamp: { word: words.verdict } } : {}),
});
export const chavesParams = (c: NonNullable<ArchiveState["chaves"]>) => ({
  x: CAST_X.chaves, y: GROUND, scale: CAST_SCALE, facing: "right" as const, expression: c.expression,
});
export const visorParams = (v: NonNullable<ArchiveState["visor"]>) => ({
  x: CAST_X.visor, y: GROUND, scale: CAST_SCALE, facing: "left" as const, expression: v.expression, points: v.points,
});

// ---------------------------------------------------------------- the book and its pill

const bookOf = (b: NonNullable<ArchiveState["book"]>): Drawn => {
  const d = book({ x: BOOK.x, y: BOOK.y, width: BOOK.width, height: BOOK.height });
  if (b.angle === 0) return d;
  return wrapped(d, { transform: `rotate(${b.angle} ${BOOK_CENTRE.x} ${BOOK_CENTRE.y})` });
};
const fieldPillOf = (p: NonNullable<ArchiveState["fieldPill"]>): Drawn =>
  diagramBox({
    shape: "pill", x: FIELD_PILL.cx - FIELD_PILL.width / 2, y: FIELD_PILL.cy - FIELD_PILL.height / 2, width: FIELD_PILL.width, height: FIELD_PILL.height,
    text: [p.text === "now" ? words.fieldCount.now : words.fieldCount.was], fill: "color.white", textSize: TEXT_SIZE.word,
  });

// ---------------------------------------------------------------- the folders and the finding

/** A folder's placement: about its centre, turned by its jolt (0 when it is not jolting). */
const folderTransform = (f: FolderState): string => (f.angle === 0 ? "" : `rotate(${f.angle} ${f.centre.x} ${f.centre.y})`);
const folderOf = (f: FolderState): Drawn => {
  const top = folderTopLeft(f.centre, f.scale);
  const d = folder({ x: top.x, y: top.y, scale: f.scale });
  const rotate = folderTransform(f);
  const rotated = rotate === "" ? d : wrapped(d, { transform: rotate });
  return shown(rotated, f.appear, f.centre);
};
const findingOf = (): Drawn =>
  diagramBox({ shape: "pill", x: FINDING_PILL.cx - FINDING_PILL.width / 2, y: FINDING_PILL.cy - FINDING_PILL.height / 2, width: FINDING_PILL.width, height: FINDING_PILL.height, text: [words.question], fill: "color.white", textSize: TEXT_SIZE.finding });

// ---------------------------------------------------------------- the GO stamp

const stampAt = (d: Drawn, at: Point, scale: number, opacity = 1): Drawn =>
  wrapped(d, { transform: `translate(${at.x} ${at.y}) scale(${scale})`, ...(opacity === 1 ? {} : { opacity }) });
const goOf = (s: NonNullable<ArchiveState["go"]>): Drawn => stampAt(stamp({ cx: 0, cy: 0, r: GO.r, word: words.verdict }), s.centre, s.scale, s.opacity);

// ---------------------------------------------------------------- layers

/** Each layer's elements, bottom to top (design §6.2). */
export const BOOK_ORDER = ["book", "field-pill"] as const;
export const FOLDERS_ORDER = ["first-folder", "second-folder", "finding-pill"] as const;
export const CAST_ORDER = ["visor", "chaves", "balao"] as const;
export const VERDICT_ORDER = ["go"] as const;
export const ABOVE_ORDER = ["emote"] as const;

const named = (parts: [string, Drawn | null][]): Drawn[] => parts.flatMap(([name, d]) => (d === null ? [] : [element(name, d)]));

const bookLayerOf = (s: ArchiveState): SvgNode =>
  layer("book", named([
    ["book", s.book ? shown(bookOf(s.book), s.book.appear, BOOK_CENTRE) : null],
    ["field-pill", s.fieldPill ? shown(fieldPillOf(s.fieldPill), s.fieldPill.appear, { x: FIELD_PILL.cx, y: FIELD_PILL.cy }) : null],
  ]));

const foldersLayerOf = (s: ArchiveState): SvgNode =>
  layer("folders", named([
    ["first-folder", s.firstFolder ? folderOf(s.firstFolder) : null],
    ["second-folder", s.secondFolder ? folderOf(s.secondFolder) : null],
    ["finding-pill", s.finding ? shown(findingOf(), s.finding, { x: FINDING_PILL.cx, y: FINDING_PILL.cy }) : null],
  ]));

const castOf = (s: ArchiveState): SvgNode =>
  layer("cast", named([
    ["visor", s.visor ? posed(visor(visorParams(s.visor)), CAST_X.visor, s.visor.appear) : null],
    ["chaves", s.chaves ? posed(chaves(chavesParams(s.chaves)), CAST_X.chaves, s.chaves.appear) : null],
    ["balao", s.balao ? posed(balao(balaoParams(s.balao)), CAST_X.balao, s.balao.appear) : null],
  ]));

const verdictOf = (s: ArchiveState): SvgNode => layer("verdict", named([["go", s.go ? goOf(s.go) : null]]));

const aboveOf = (s: ArchiveState): SvgNode =>
  layer("above", named([["emote", s.emote ? faded(emote({ kind: s.emote.kind, x: s.emote.x, y: s.emote.y, scale: s.emote.scale }), s.emote.opacity) : null]]));

export type Stage = { book: SvgNode; folders: SvgNode; cast: SvgNode; verdict: SvgNode; above: SvgNode };
export const STAGE_LAYERS = ["book", "folders", "cast", "verdict", "above"] as const;
export const stageOf = (s: ArchiveState): Stage => ({ book: bookLayerOf(s), folders: foldersLayerOf(s), cast: castOf(s), verdict: verdictOf(s), above: aboveOf(s) });

/** The stage at `frame`, with its state. */
export const stageAt = (frame: number) => {
  const state = frameAt(frame);
  return { state, ...stageOf(state) };
};

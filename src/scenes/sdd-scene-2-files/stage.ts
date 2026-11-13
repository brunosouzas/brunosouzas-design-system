// The SDD files scene's stage at a frame, as piece trees with no React (change
// sdd-scene-2-files, design §3 and §6.2): `stageOf(state)` gives the six
// stage SVG layers in 960 × 540 stage units, bottom to top: `below` (the
// keyboard, the screen), `folder` (`openspec/` and its name), `files` (the four
// files, each a sheet and its name), `cast` (Visor, Chaves, Balão), `verdicts`
// (the `NO-GO` stamps and the `GO`) and `above` (the emote). Scene.tsx draws
// them; the tests read words, pieces and positions from the same trees.
//
// The scene draws only through the package's pieces and `pose` (MOT-6,
// CAST-1): this file computes parameters, positions and wrappers and creates
// no shape of its own. Every element sits in a group named by `data-element`;
// an element that is not drawn (opacity 0 or scale at most 0.001, frame.ts) is
// left out of the tree.
import { tokens } from "../../../tokens/generated/tokens";
import type { Point } from "../../brand/motion";
import { balao, chaves, codePanel, diagramBox, emote, folder, keyboard, sheet, stamp, visor } from "../../pieces/library.ts";
import { g, type Drawn, type SvgNode } from "../../pieces/node.ts";
import { pose } from "../../pieces/pose.ts";
import {
  CAST_SCALE, CAST_X, CODE_LINE_SHAPES, COMMAND_LINE, FILE_SCALE, FOLDER, FOLDER_CENTRE, FOLDER_LABEL, GO, GROUND, KEYBOARD_LOCAL, LABEL_HEIGHT, LABEL_WIDTHS,
  LAPTOP_ANCHOR, NO_GO, PAGE, PAGE_STAGE, ROW_BARS, SCREEN, TEXT_SIZE, VERDICT_CENTRE, sheetRow,
} from "./layout";
import { frameAt, type Appear, type FileState, type FilesState } from "./frame";
import { text } from "./scene.ts";

const words = text.en;

// ---------------------------------------------------------------- groups

/** The cover command's groups (src/pieces/cover.ts): bodies outlined in ink, words in the label face. */
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

export const balaoParams = (b: NonNullable<FilesState["balao"]>) => ({
  x: CAST_X.balao, y: GROUND, scale: CAST_SCALE, facing: "right" as const, expression: b.expression,
  ...(b.speaks ? { speaks: true } : {}), ...(b.holdsStamp ? { holdsStamp: { word: words.verdicts.approved } } : {}),
});
export const chavesParams = (c: NonNullable<FilesState["chaves"]>) => ({
  x: CAST_X.chaves, y: GROUND, scale: CAST_SCALE, facing: "right" as const, expression: c.expression, ...(c.types ? { types: true } : {}),
});
export const visorParams = (v: NonNullable<FilesState["visor"]>) => ({
  x: CAST_X.visor, y: GROUND, scale: CAST_SCALE, facing: "left" as const, expression: v.expression, points: v.points,
});

// ---------------------------------------------------------------- props

const screenOf = (s: FilesState): Drawn =>
  codePanel({
    x: SCREEN.x, y: SCREEN.y, width: SCREEN.width, height: SCREEN.height, top: SCREEN.top, step: SCREEN.step,
    lines: [...(s.screen.commandLine ? [COMMAND_LINE] : []), ...CODE_LINE_SHAPES.slice(0, s.screen.codeLines).map((line) => ({ ...line, color: "white" as const }))],
  });

/** The laptop's base at Chaves's typing spot, in his units (so it is exactly the keyboard he types at). */
const keyboardProp = (): Drawn => {
  const board = keyboard({ ...KEYBOARD_LOCAL });
  return { body: [g({ transform: `translate(${CAST_X.chaves} ${GROUND}) scale(${CAST_SCALE})` }, ...board.body)], text: [] };
};

const folderOf = (): Drawn => folder({ x: FOLDER.x, y: FOLDER.y, scale: FOLDER.scale });
const folderLabel = (): Drawn =>
  diagramBox({
    shape: "pill", x: FOLDER_LABEL.cx - FOLDER_LABEL.width / 2, y: FOLDER_LABEL.cy - FOLDER_LABEL.height / 2, width: FOLDER_LABEL.width, height: FOLDER_LABEL.height,
    text: [words.folder], fill: "color.white", textSize: TEXT_SIZE.word,
  });

/** The sheet's marks group gets its ink stroke, as a held sheet's does (brand-cast.ts, `holdSheet`; scene 1's free sheet). */
const inkMarks = (node: SvgNode): SvgNode =>
  node.tag === "g" && node.attrs["stroke-width"] === tokens.outline.small && node.attrs.stroke === undefined
    ? { ...node, attrs: { ...node.attrs, stroke: tokens.color.ink } }
    : node;

/** A file's placement: about its centre, turned by its jolt and scaled in flight. */
const placement = (file: FileState, extraScale: number): string =>
  `translate(${file.centre.x} ${file.centre.y})${file.angle === 0 ? "" : ` rotate(${file.angle})`} scale(${file.scale * extraScale})`;

/** One file's sheet (design §6.1): the `sheet` at FILE_SCALE with its rows. */
const fileOf = (file: FileState): Drawn => {
  const bars = ROW_BARS[file.id];
  const paper = sheet({ x: -PAGE.width / 2, y: -PAGE.height / 2, width: PAGE.width, height: PAGE.height, top: PAGE.top, step: PAGE.step, rows: file.rows.map((state, i) => sheetRow(bars[i], state)) });
  const onPage = placement(file, FILE_SCALE);
  return {
    body: [g({ transform: onPage }, g({ stroke: tokens.color.ink, "stroke-width": tokens.outline.block, "stroke-linejoin": "round" }, ...paper.body.map(inkMarks)))],
    text: paper.text.length > 0 ? [g({ transform: onPage }, ...paper.text)] : [],
  };
};
/** One file's name: a pill on its top edge, turned and scaled with the file. */
const labelOf = (file: FileState): Drawn => {
  const width = LABEL_WIDTHS[file.id];
  const label = diagramBox({
    shape: "pill", x: -width / 2, y: -PAGE_STAGE.height / 2 - LABEL_HEIGHT / 2, width, height: LABEL_HEIGHT,
    text: [words.files[file.id]], fill: "color.white", textSize: TEXT_SIZE.word,
  });
  return wrapped(label, { transform: placement(file, 1) });
};

/** A stamp drawn about (0, 0), placed at `at` and scaled `scale`, at `opacity`. */
const stampAt = (d: Drawn, at: Point, scale: number, opacity = 1): Drawn =>
  wrapped(d, { transform: `translate(${at.x} ${at.y}) scale(${scale})`, ...(opacity === 1 ? {} : { opacity }) });
const noGoOf = (a: Appear): Drawn =>
  stampAt(stamp({ cx: 0, cy: 0, r: NO_GO.r, word: words.verdicts.rejected, fill: NO_GO.fill }), VERDICT_CENTRE, NO_GO.scale * a.scale, a.opacity);
const goOf = (s: NonNullable<FilesState["go"]>): Drawn => stampAt(stamp({ cx: 0, cy: 0, r: GO.r, word: words.verdicts.approved }), s.centre, s.scale);

// ---------------------------------------------------------------- layers

/** Each layer's elements, bottom to top (design §6.2). */
export const BELOW_ORDER = ["keyboard", "screen"] as const;
export const FOLDER_ORDER = ["folder", "folder-label"] as const;
export const FILES_ORDER = ["file-proposal", "label-proposal", "file-design", "label-design", "file-tasks", "label-tasks", "file-spec", "label-spec"] as const;
export const CAST_ORDER = ["visor", "chaves", "balao"] as const;
export const VERDICTS_ORDER = ["no-go-1", "no-go-2", "go"] as const;
export const ABOVE_ORDER = ["emote"] as const;

const named = (parts: [string, Drawn | null][]): Drawn[] => parts.flatMap(([name, d]) => (d === null ? [] : [element(name, d)]));

const belowOf = (s: FilesState): SvgNode => {
  const typing = s.chaves?.types === true;
  return layer("below", named([
    ["keyboard", s.laptop && !typing ? shown(keyboardProp(), s.laptop, LAPTOP_ANCHOR) : null],
    ["screen", s.laptop ? shown(screenOf(s), s.laptop, LAPTOP_ANCHOR) : null],
  ]));
};

const folderLayerOf = (s: FilesState): SvgNode =>
  layer("folder", named([
    ["folder", s.folder ? shown(folderOf(), s.folder, FOLDER_CENTRE) : null],
    ["folder-label", s.folder ? shown(folderLabel(), s.folder, FOLDER_CENTRE) : null],
  ]));

const filesOf = (s: FilesState): SvgNode =>
  layer("files", named(s.files.flatMap((file): [string, Drawn][] => [[`file-${file.id}`, fileOf(file)], [`label-${file.id}`, labelOf(file)]])));

const castOf = (s: FilesState): SvgNode =>
  layer("cast", named([
    ["visor", s.visor ? posed(visor(visorParams(s.visor)), CAST_X.visor, s.visor.appear) : null],
    ["chaves", s.chaves ? posed(chaves(chavesParams(s.chaves)), CAST_X.chaves, s.chaves.appear) : null],
    ["balao", s.balao ? posed(balao(balaoParams(s.balao)), CAST_X.balao, s.balao.appear) : null],
  ]));

const verdictsOf = (s: FilesState): SvgNode =>
  layer("verdicts", named([
    ["no-go-1", s.noGo?.id === "no-go-1" ? noGoOf(s.noGo.appear) : null],
    ["no-go-2", s.noGo?.id === "no-go-2" ? noGoOf(s.noGo.appear) : null],
    ["go", s.go ? goOf(s.go) : null],
  ]));

const aboveOf = (s: FilesState): SvgNode =>
  layer("above", named([["emote", s.emote ? faded(emote({ kind: s.emote.kind, x: s.emote.x, y: s.emote.y, scale: s.emote.scale }), s.emote.opacity) : null]]));

export type Stage = { below: SvgNode; folder: SvgNode; files: SvgNode; cast: SvgNode; verdicts: SvgNode; above: SvgNode };
export const STAGE_LAYERS = ["below", "folder", "files", "cast", "verdicts", "above"] as const;
export const stageOf = (s: FilesState): Stage => ({ below: belowOf(s), folder: folderLayerOf(s), files: filesOf(s), cast: castOf(s), verdicts: verdictsOf(s), above: aboveOf(s) });

/** The stage at `frame`, with its state. */
export const stageAt = (frame: number) => {
  const state = frameAt(frame);
  return { state, ...stageOf(state) };
};

// The SDD files scene's stage layout (change sdd-scene-2-files, design §4.3,
// §6.1 and §6.2): every position, size and route in 960 × 540 stage units,
// drawn in an SVG with that viewBox over the 1920 × 1080 composition, as scene
// 1 (sdd-request-relay) is. The rings and the motion guide are in composition
// pixels (stage × STAGE_SCALE). The cast and the laptop stand where scene 1
// left them, so the viewer of both sees one stage.
//
// A change here is a visual change (MOT-5): it goes back into design §6.1 and
// the pinned layout test (test/scenes/sdd-scene-2-files-layout.test.ts) in the
// same commit.
import type { Point } from "../../brand/motion";
import type { SheetRow } from "../../pieces/paper.ts";
import type { FileId, RowState } from "./timeline";

export const STAGE = { width: 960, height: 540 } as const;
/** Composition pixels per stage unit (1920 × 1080 over 960 × 540). */
export const STAGE_SCALE = 2;

/** The smallest effective text size of a word (design §2.2). */
export const TEXT_SIZE = { word: 33 } as const;

/** One scale and one ground line for the cast (CAST-5), at scene 1's places. */
export const CAST_SCALE = 0.95;
export const GROUND = 476;
export const CAST_X = { balao: 104, chaves: 505, visor: 852 } as const;

/** The laptop's screen (`codePanel`) and its pop-in anchor. */
export const SCREEN = { x: 584, y: 258, width: 162, height: 124, top: 20, step: 15 } as const;
export const LAPTOP_ANCHOR: Point = { x: 665, y: 320 };
/** The command line Chaves types (`init`, then `propose`): the tall line, drawn in the accent by `codePanel`. */
export const COMMAND_LINE = { indent: 0, w: 96, color: "white", tall: true } as const;
/** The six code lines Visor writes: the `if` / result pairs of L157–L162. */
export const CODE_LINE_SHAPES: readonly { indent: number; w: number }[] = [
  { indent: 0, w: 46 }, { indent: 16, w: 78 }, { indent: 0, w: 66 }, { indent: 16, w: 106 }, { indent: 0, w: 58 }, { indent: 16, w: 99 },
];
/** The laptop's base: the `keyboard` piece in Chaves's units at his typing spot (supporting-cast.ts, CHAVES_KEYBOARD). */
export const KEYBOARD_LOCAL = { x: 98, y: -74, width: 150 } as const;

/** The `openspec/` folder (`folder` is 190 × 198 at scale 1) and its centre, where the files start. */
export const FOLDER = { x: 394.5, y: 50, scale: 0.9 } as const;
export const FOLDER_CENTRE: Point = { x: FOLDER.x + 95 * FOLDER.scale, y: FOLDER.y + 99 * FOLDER.scale };
/** The folder's name: a pill on its front. */
export const FOLDER_LABEL = { cx: 480, cy: 162.5, width: 172, height: 44 } as const;

/** Every file is a `sheet` of these sheet units, drawn at FILE_SCALE (design §6.1). */
export const PAGE = { width: 160, height: 200, top: 32, step: 23 } as const;
export const FILE_SCALE = 0.95;
export const PAGE_STAGE = { width: PAGE.width * FILE_SCALE, height: PAGE.height * FILE_SCALE } as const;
/** Each file's slot (its top-left) and its name pill's width. */
export const FILE_SLOTS: Readonly<Record<FileId, Point>> = {
  proposal: { x: 123, y: 46 },
  design: { x: 343, y: 46 },
  tasks: { x: 537, y: 46 },
  spec: { x: 716, y: 46 },
};
export const LABEL_WIDTHS: Readonly<Record<FileId, number>> = { proposal: 206, design: 174, tasks: 154, spec: 144 };
export const LABEL_HEIGHT = 44;
/** A file's centre at its slot. */
export const slotCentre = (file: FileId): Point => ({ x: FILE_SLOTS[file].x + PAGE_STAGE.width / 2, y: FILE_SLOTS[file].y + PAGE_STAGE.height / 2 });
/** The text bars of each file's rows, top to bottom (design §6.1). */
export const ROW_BARS: Readonly<Record<FileId, readonly number[]>> = {
  proposal: [56, 44, 60, 50, 58, 40],
  design: [96, 70, 84],
  tasks: [80, 66, 56, 74],
  spec: [58, 50, 60, 54, 46],
};
/** A row as the `sheet` draws it (design §2.7): `?` lead for a question or a finding, tail check once answered or fixed. */
export const sheetRow = (bar: number, state: RowState): SheetRow => {
  switch (state) {
    case "question": case "flagged": return { lead: "question", bar };
    case "answered": return { lead: "question", bar, tail: "check" };
    case "checked": return { lead: "none", bar, tail: "check" };
    default: return { lead: "none", bar };
  }
};
/** Row k's (1-based) `?` centre on a file whose top-left is `topLeft`, at scale 1 (paper.ts: the disc at x + 30, cy = top + 11 + step (k − 1)). */
export const rowMark = (topLeft: Point, k: number): Point => ({ x: topLeft.x + FILE_SCALE * 30, y: topLeft.y + FILE_SCALE * (PAGE.top + 11 + PAGE.step * (k - 1)) });
/** The `?` disc's radius on stage (13 sheet units). */
export const ROW_MARK_RADIUS = 13 * FILE_SCALE;
/** The crest of the files' routes out of the folder: low enough that a file in flight keeps its name inside the stage (design §4.3, §6.3). */
export const FILE_ROUTE_CREST = 110;
/** A file's scale in flight at trip progress p (design §2.5). */
export const fileScaleAt = (p: number): number => 0.4 + 0.6 * p;

/** The jolt of a flagged file, in degrees, `k` frames after its finding (design §2.3). */
export const JOLT = { amplitude: 5, period: 6 } as const;

/** Where the verdicts land, and their stamps (design §2.2, §2.4). */
export const VERDICT_CENTRE: Point = { x: 512, y: 194 };
export const NO_GO = { r: 46, scale: 1.25, fill: "color.state.failure" } as const;
/** Balão's held stamp (supporting-cast.ts: radius 24, centre (132, −70) in its units) and the landed `GO`. */
export const GO = { r: 24, from: { x: CAST_X.balao + CAST_SCALE * 132, y: GROUND - CAST_SCALE * 70 } as Point, scaleFrom: CAST_SCALE, scaleTo: 1.6 } as const;
/** The `GO` stamp's scale in flight at trip progress p. */
export const goScaleAt = (p: number): number => GO.scaleFrom + (GO.scaleTo - GO.scaleFrom) * p;

const n = (value: number) => Math.round(value * 1000) / 1000;
const p = (pt: Point) => `${n(pt.x)},${n(pt.y)}`;
const fileRoute = (file: FileId) => {
  const c = slotCentre(file);
  return `M ${p(FOLDER_CENTRE)} C ${n(FOLDER_CENTRE.x)},${FILE_ROUTE_CREST} ${n(c.x)},${FILE_ROUTE_CREST} ${p(c)}`;
};
const GO_D = `M ${p(GO.from)} C 300,300 420,194 ${p(VERDICT_CENTRE)}`;

/** The routes of the travelling objects, stage units (design §4.3). */
export const ROUTES: Readonly<Record<string, string>> = {
  "file-proposal": fileRoute("proposal"),
  "file-design": fileRoute("design"),
  "file-tasks": fileRoute("tasks"),
  "file-spec": fileRoute("spec"),
  go: GO_D,
};

/** The dashed guide (stage units), drawn × STAGE_SCALE by `MotionPath`. */
export const GUIDES = { go: GO_D } as const;

/** Visor's `worked` emote beside its head (scene 1's spot). */
export const EMOTES = { worked: { x: 800, y: 292, scale: 0.75 } } as const;

/** The cast's body boxes for the placement test (design §6.2): bodies only, not hands or props. */
export const BODY_BOXES = {
  balao: { x0: CAST_X.balao - 62 * CAST_SCALE, y0: GROUND - 162 * CAST_SCALE, x1: CAST_X.balao + 94 * CAST_SCALE, y1: GROUND },
  chaves: { x0: CAST_X.chaves - 90 * CAST_SCALE, y0: GROUND - 150 * CAST_SCALE, x1: CAST_X.chaves + 90 * CAST_SCALE, y1: GROUND },
  visor: { x0: CAST_X.visor - 66 * CAST_SCALE, y0: GROUND - 142 * CAST_SCALE, x1: CAST_X.visor + 66 * CAST_SCALE, y1: GROUND },
} as const;

/** Composition-pixel centre of the rings: the stage's centre × 2. */
export const RINGS_CENTRE: Point = { x: 960, y: 540 };

/** A path of absolute commands with every number multiplied by `k` (stage units to composition pixels). */
export const scalePath = (d: string, k: number = STAGE_SCALE): string => d.replace(/-?\d+(?:\.\d+)?/g, (value) => String(n(Number(value) * k)));

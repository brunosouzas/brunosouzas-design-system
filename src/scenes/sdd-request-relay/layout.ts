// The SDD relay scene's stage layout (change sdd-scene-1-relay, design §4.4,
// §6.1 and §6.2): every position, size and route in 960 × 540 stage units,
// drawn in an SVG with that viewBox over the 1920 × 1080 composition, so the
// pieces keep the outline weights of the approved gate-0 sheet. The rings and
// the motion guides are in composition pixels (stage × STAGE_SCALE).
//
// A change here is a visual change (MOT-5): it goes back into design §6.1 and
// the pinned layout test (test/scenes/sdd-request-relay-layout.test.ts) in the
// same commit.
import type { Point } from "../../brand/motion";
import type { SheetRow } from "../../pieces/paper.ts";
import { QUESTIONS } from "./timeline";

export const STAGE = { width: 960, height: 540 } as const;
/** Composition pixels per stage unit (1920 × 1080 over 960 × 540). */
export const STAGE_SCALE = 2;

/** The smallest effective text sizes (design §2.2): words, then the take numbers. */
export const TEXT_SIZE = { word: 33, strong: 36 } as const;

/** One scale and one ground line for the cast (CAST-5). */
export const CAST_SCALE = 0.95;
export const GROUND = 476;
export const CAST_X = { balao: 104, chaves: 505, visor: 852 } as const;

/** The laptop's screen (`codePanel`) and its pop-in anchor. */
export const SCREEN = { x: 584, y: 258, width: 162, height: 124, top: 22, step: 16 } as const;
export const LAPTOP_ANCHOR: Point = { x: 665, y: 320 };
/** The request line Chaves types: the tall line, drawn in the accent by `codePanel`. */
export const REQUEST_LINE = { indent: 0, w: 96, color: "white", tall: true } as const;
/** The six code lines Visor writes, in order. */
export const CODE_LINE_SHAPES: readonly { indent: number; w: number }[] = [
  { indent: 0, w: 70 }, { indent: 16, w: 100 }, { indent: 32, w: 64 }, { indent: 32, w: 90 }, { indent: 16, w: 56 }, { indent: 0, w: 30 },
];
/** The laptop's base: the `keyboard` piece in Chaves's units at his typing spot (supporting-cast.ts, CHAVES_KEYBOARD). */
export const KEYBOARD_LOCAL = { x: 98, y: -74, width: 150 } as const;

/** `proposal.md` in sheet units, drawn at CAST_SCALE (design §2.2). */
export const PAGE = { width: 180, height: 226, top: 32, step: 23 } as const;
export const QUESTION_BARS: readonly number[] = [76, 58, 84, 66, 80, 52];
/** The first `n` question rows, the first `checked` with their check. */
export const pageRows = (n: number, checked: number): SheetRow[] =>
  QUESTION_BARS.slice(0, n).map((bar, i): SheetRow => ({ lead: "question", bar, tail: i < checked ? "check" : "none" }));
/** The sheet's size on stage. */
export const PAGE_STAGE = { width: PAGE.width * CAST_SCALE, height: PAGE.height * CAST_SCALE } as const;
/** The sheet's top-left above the screen, and in Chaves's hand facing left (supporting-cast.ts: edge 118, bottom −40). The base 251 (not the 250 of the first layout spike) keeps the label's outline clear of the stage margin; see design §6.1. */
export const DESK: Point = { x: 665 - PAGE_STAGE.width / 2, y: 251 - PAGE_STAGE.height };
export const HELD: Point = { x: CAST_X.chaves + CAST_SCALE * (-118 - PAGE.width), y: GROUND + CAST_SCALE * (-40 - PAGE.height) };
/** The label pill on the sheet's top edge (design §2.2). */
export const LABEL = { width: 206, height: 44 } as const;
export const labelCentre = (sheet: Point): Point => ({ x: sheet.x + PAGE_STAGE.width / 2, y: sheet.y });
/** The `GO` mark: a `stamp` of radius 24 scaled 1.25, so its word is 33.75 units. */
export const GO_MARK = { r: 24, scale: 1.25, dx: 58.9, dy: 183.35 } as const;
export const goCentre = (sheet: Point): Point => ({ x: sheet.x + GO_MARK.dx, y: sheet.y + GO_MARK.dy });
/** Row k's (1–6) question mark on a sheet whose top-left is `sheet`. */
export const rowMark = (sheet: Point, k: number): Point => ({ x: sheet.x + CAST_SCALE * 30, y: sheet.y + CAST_SCALE * (PAGE.top + 11 + PAGE.step * (k - 1)) });

/** The `?` scale: a sheet row's mark exactly (question-token.ts). */
export const TOKEN_SCALE = CAST_SCALE;
/** The row above Chaves and the row inside the screen (design §4.4). */
export const aboveChaves = (i: number): Point => ({ x: 437.5 + 27 * i, y: 300 });
export const inScreen = (i: number): Point => ({ x: 597.5 + 27 * i, y: 340 });
/** How far a `?` drops as it sinks into the code. */
export const SINK_DROP = 16;
/** Balão's tail tip facing right (supporting-cast.ts: (94, −76) at CAST_SCALE). */
export const TAIL: Point = { x: CAST_X.balao + CAST_SCALE * 94, y: GROUND - CAST_SCALE * 76 };

const n = (value: number) => Math.round(value * 1000) / 1000;
const p = (pt: Point) => `${n(pt.x)},${n(pt.y)}`;
const CARRY_D = `M ${p(DESK)} C ${n(DESK.x - 105)},10 ${n(HELD.x + 92.6)},90 ${p(HELD)}`;
const RETURN_D = `M ${p(HELD)} C ${n(HELD.x + 92.6)},90 ${n(DESK.x - 105)},10 ${p(DESK)}`;

/** The routes of the travelling objects, stage units (design §4.4). */
export const ROUTES: Readonly<Record<string, string>> = {
  ...Object.fromEntries(Array.from({ length: QUESTIONS }, (_, i) => {
    const a = aboveChaves(i), s = inScreen(i), r = rowMark(DESK, i + 1);
    return [
      [`ask-${i}`, `M ${p(TAIL)} C 230,250 340,215 ${p(a)}`],
      [`hop-${i}`, `M ${p(a)} C ${n(a.x + 60)},240 ${n(s.x - 40)},270 ${p(s)}`],
      [`list-${i}`, `M ${p(s)} C ${n(s.x)},290 ${n(r.x)},${n(r.y + 50)} ${p(r)}`],
    ];
  }).flat()),
  carry: CARRY_D,
  return: RETURN_D,
};

/** The dashed guides (stage units), drawn × STAGE_SCALE by `MotionPath`. */
export const GUIDES = {
  p1: `M ${p(TAIL)} C 230,250 340,215 505,300`,
  p2: "M 505,300 C 565,240 625,270 665,340",
  p4: `M ${n(DESK.x + PAGE_STAGE.width / 2)},${n(DESK.y)} C ${n(DESK.x - 105 + PAGE_STAGE.width / 2)},10 ${n(HELD.x + 92.6 + PAGE_STAGE.width / 2)},90 ${n(HELD.x + PAGE_STAGE.width / 2)},${n(HELD.y)}`,
} as const;

/** The error coming back to Balão (the gate-0 `messageArrow` call). */
export const FAILURE_ARROW = {
  from: [588, 266] as [number, number],
  to: [124, 284] as [number, number],
  controls: [[500, 80], [160, 100]] as [[number, number], [number, number]],
  kind: "failure" as const,
};

/** The emotes beside the heads. */
export const EMOTES = {
  problem: { x: CAST_X.balao + 116 * CAST_SCALE, y: GROUND - 200 * CAST_SCALE, scale: 0.8 },
  worked: { x: 800, y: 292, scale: 0.75 },
} as const;

export const BADGE = { cx: 912, cy: 52 } as const;
export const REWIND_MARK = { x: 826, y: 28, size: 48 } as const;
/** Pop-in anchors of the pieces without a `scale` parameter. */
export const ANCHORS = {
  badge: { x: BADGE.cx, y: BADGE.cy },
  rewindMark: { x: REWIND_MARK.x + REWIND_MARK.size / 2, y: REWIND_MARK.y + REWIND_MARK.size / 2 },
} as const;

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

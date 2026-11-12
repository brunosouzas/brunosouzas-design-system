// The SDD scene's stage layout (change sdd-without-with-spec-scene, design §6):
// every position, size and route in 960 × 540 stage units, the gate-0
// storyboard's frame, drawn in an SVG with that viewBox over the 1920 × 1080
// composition, so the pieces keep the outline weights the owner approved.
// Composition-pixel elements (the rings, the dashed paths) are stage × STAGE_SCALE.
//
// Values are copied from the gate-0 prototype with the deviations listed in
// design §6; a change here is a visual change (MOT-5) and goes back into that
// table and the pinned layout test in the same commit.
import type { Point } from "../../brand/motion";
import type { SheetRow } from "../../pieces/paper.ts";
import { QUESTIONS } from "./timeline";

export const STAGE = { width: 960, height: 540 } as const;
/** Composition pixels per stage unit (1920 × 1080 over 960 × 540). */
export const STAGE_SCALE = 2;

/** The cast and the tokens' scale (CAST-5: one scale for every cast piece in the frame). */
export const CAST_SCALE = 1.15;
/** Visor's ground point: x, and the ground line y. */
export const VISOR = { x: 480, y: 440 } as const;

export const BALLOON = { x: 50, y: 16, width: 280, height: 110 } as const;
/** Slot `i` of the balloon, where `?` `i` waits. */
export const slotAt = (i: number): Point => ({ x: 86 + 42 * i, y: 94 });

export const CODE_PANEL = { x: 690, y: 200, width: 210, height: 220, top: 34, step: 22 } as const;
/** The code lines, in the order they appear, all `white` (the code itself is not the failure, design §2.6). */
export const CODE_LINE_SHAPES: readonly { indent: number; w: number }[] = [
  { indent: 0, w: 90 }, { indent: 18, w: 120 }, { indent: 36, w: 80 }, { indent: 36, w: 110 },
  { indent: 18, w: 70 }, { indent: 36, w: 100 }, { indent: 18, w: 60 }, { indent: 0, w: 40 },
];

/** `proposal.md`, in page units (the `sheet` piece's), drawn at CAST_SCALE. */
export const PAGE = { width: 150, height: 240, top: 24, step: 31 } as const;
/** Row 0, the article's `## Open Questions` heading (L106), then one bar per question row. */
export const HEADING_ROW: SheetRow = { lead: "none", bar: 90 };
export const QUESTION_BARS: readonly number[] = [44, 34, 50, 40, 46, 30];
/** `n` question rows, the first `checked` with their tail check. */
export const pageRows = (questions: number, checked: number): SheetRow[] => [
  HEADING_ROW,
  ...QUESTION_BARS.slice(0, questions).map((bar, i): SheetRow => ({ lead: "question", bar, tail: i < checked ? "check" : "none" })),
];

/** Where Visor holds the page (its local (−248, −244) at CAST_SCALE) and where it rests after the hand-over. */
export const PAGE_HELD: Point = { x: VISOR.x + CAST_SCALE * (-98 - PAGE.width), y: VISOR.y + CAST_SCALE * (-4 - PAGE.height) };
export const PAGE_REST: Point = { x: 100, y: 196 };

/** Centre of question row `k` (1 to 6)'s `?` mark on the page whose top-left is `page`. */
export const rowMarkAt = (page: Point, k: number): Point => ({
  x: page.x + CAST_SCALE * 30,
  y: page.y + CAST_SCALE * (PAGE.top + k * PAGE.step + 11),
});

export const STAMP = { cx: 189, cy: 432.3, r: 32 } as const;
export const BADGE = { cx: 918, cy: 42, textSize: 22 } as const;
export const REWIND_MARK = { x: 852, y: 24, size: 38 } as const;
export const EMOTES = {
  problem: { x: 335, y: 296, scale: 0.8 },
  worked: { x: 340, y: 292, scale: 0.72 },
} as const;
/** The answer tokens: `PositionedToken` in stage units (radius 17, the `?`'s size and outline weight). */
export const ANSWER_START: Point = { x: 70, y: 180 };

/** Pop-in anchors (design §2.6) of the pieces that have no `scale` parameter. */
export const ANCHORS = {
  codePanel: { x: 795, y: 310 },
  badge: { x: 918, y: 42 },
  balloon: { x: 190, y: 71 },
  rewindMark: { x: 871, y: 43 },
  stamp: { x: 189, y: 432.3 },
} as const;

/** Composition-pixel centre of the rings: the gate-0 ring centre (480, 300) × 2. */
export const RINGS_CENTRE: Point = { x: 960, y: 600 };

const held = (k: number) => rowMarkAt(PAGE_HELD, k);
const rest = (k: number) => rowMarkAt(PAGE_REST, k);
const n = (value: number) => Math.round(value * 1000) / 1000;

/** The routes of the travelling objects, stage units (design §6). */
export const ROUTES: Readonly<Record<string, string>> = Object.fromEntries(
  Array.from({ length: QUESTIONS }, (_, i) => {
    const slot = slotAt(i), h = held(i + 1), r = rest(i + 1);
    return [
      [`guess-${i}`, `M ${slot.x},${slot.y} C 430,96 610,130 770,290`],
      [`ask-${i}`, `M ${slot.x},${slot.y} C 40,96 120,${n(h.y)} ${n(h.x)},${n(h.y)}`],
      [`answer-${i}`, `M ${ANSWER_START.x},${ANSWER_START.y} C 62,${n(r.y - 40)} 80,${n(r.y)} ${n(r.x)},${n(r.y)}`],
    ];
  }).flat(),
);

/** The storyboard's dashed guide lines, stage units; drawn × STAGE_SCALE by `MotionPath`. */
export const PATHS = {
  p1: "M 332,82 C 430,96 610,130 770,290",
  p2: "M 94,148 C 120,176 150,186 194,196",
  p3: "M 272,330 C 380,470 600,470 690,380",
} as const;

/** The error coming back: the gate-0 `messageArrow` call (design §6). */
export const FAILURE_ARROW = {
  from: [700, 206] as [number, number],
  to: [332, 72] as [number, number],
  controls: [[620, 90], [420, 70]] as [[number, number], [number, number]],
  kind: "failure" as const,
};

/** A path of absolute commands with every number multiplied by `k` (stage units to composition pixels). */
export const scalePath = (d: string, k: number = STAGE_SCALE): string => d.replace(/-?\d+(?:\.\d+)?/g, (value) => String(n(Number(value) * k)));

// The SDD archive scene's stage layout (change sdd-scene-3-archive, design
// §4.3, §6.1 and §6.2): every position, size and route in 960 x 540 stage
// units, drawn in an SVG with that viewBox over the 1920 x 1080 composition,
// as scenes 1-2 are. The rings and the motion guide are in composition
// pixels (stage x STAGE_SCALE). The cast stands where scenes 1-2 left it, so
// the viewer of all three sees one stage.
//
// A change here is a visual change (MOT-5): it goes back into design §6.1
// and the pinned layout test (test/scenes/sdd-scene-3-archive-layout.test.ts)
// in the same commit.
import type { Point } from "../../brand/motion";

export const STAGE = { width: 960, height: 540 } as const;
/** Composition pixels per stage unit (1920 x 1080 over 960 x 540). */
export const STAGE_SCALE = 2;

/** The smallest effective text size of a word (design §2.2). */
export const TEXT_SIZE = { word: 33, finding: 24 } as const;

/** One scale and one ground line for the cast (CAST-5), at scenes 1-2's places. */
export const CAST_SCALE = 0.95;
export const GROUND = 476;
export const CAST_X = { balao: 104, chaves: 505, visor: 852 } as const;

/** The living spec: a closed `book`, clear of Chaves's body box (design §2.4, §6.1). */
export const BOOK = { x: 620, y: 300, width: 90, height: 160 } as const;
export const BOOK_CENTRE: Point = { x: BOOK.x + BOOK.width / 2, y: BOOK.y + BOOK.height / 2 };

/** The field-count pill above the book (design §2.2, §6.1): centred, clear of the `worked` emote. */
export const FIELD_PILL = { cx: 665, cy: 230, width: 300, height: 44 } as const;

/** The two changes' folders (design §3, §4.3, §6.1): initial centre and scale, parked centre and scale. */
export const FIRST_FOLDER = { start: { centre: { x: 480, y: 140 } as Point, scale: 0.9 }, parked: { centre: { x: 900, y: 70 } as Point, scale: 0.4 } } as const;
export const SECOND_FOLDER = { start: { centre: { x: 380, y: 150 } as Point, scale: 0.95 }, parked: { centre: { x: 900, y: 170 } as Point, scale: 0.4 } } as const;
/** A folder's scale in flight at trip progress p, linear between its start and parked scale. */
export const folderScaleAt = (from: number, to: number, p: number): number => from + (to - from) * p;
/** A piece's drawing anchor (top-left) for a centred placement at `scale` (the `folder` piece's own 190x198 glyph at scale 1). */
export const folderTopLeft = (centre: Point, scale: number): Point => ({ x: centre.x - 95 * scale, y: centre.y - 99 * scale });

/** The single finding's `?` pill, beside the second folder, clear of its two peeking papers (round-2 fix, design §6.1: shrinking the pill to clear the papers vertically left the `?` glyph overflowing it; moved beside the folder instead, at its full size). */
export const FINDING_PILL = { cx: 505, cy: 50, width: 40, height: 32 } as const;

/** The jolt of the book or a flagged folder, in degrees, `k` frames after it starts (design §2.3). */
export const JOLT = { amplitude: 5, period: 6 } as const;
/** Frames a jolt lasts (design §4). */
export const JOLT_FRAMES = 12;

/** Where `GO` lands (the second folder's start slot), and Balão's held stamp (design §2.2, §6.1). */
export const VERDICT_CENTRE: Point = SECOND_FOLDER.start.centre;
export const GO = { r: 24, from: { x: CAST_X.balao + CAST_SCALE * 132, y: GROUND - CAST_SCALE * 70 } as Point, scaleFrom: CAST_SCALE, scaleTo: 1.6 } as const;
/** The `GO` stamp's scale in flight at trip progress p. */
export const goScaleAt = (p: number): number => GO.scaleFrom + (GO.scaleTo - GO.scaleFrom) * p;

/** Visor's `worked` emote beside its head (scenes 1-2's spot). */
export const EMOTES = { worked: { x: 800, y: 292, scale: 0.75 } } as const;

/** The cast's body boxes for the placement test (design §6.2): bodies only, not hands or props. */
export const BODY_BOXES = {
  balao: { x0: CAST_X.balao - 62 * CAST_SCALE, y0: GROUND - 162 * CAST_SCALE, x1: CAST_X.balao + 94 * CAST_SCALE, y1: GROUND },
  chaves: { x0: CAST_X.chaves - 90 * CAST_SCALE, y0: GROUND - 150 * CAST_SCALE, x1: CAST_X.chaves + 90 * CAST_SCALE, y1: GROUND },
  visor: { x0: CAST_X.visor - 66 * CAST_SCALE, y0: GROUND - 142 * CAST_SCALE, x1: CAST_X.visor + 66 * CAST_SCALE, y1: GROUND },
} as const;

/** Composition-pixel centre of the rings: the stage's centre x 2. */
export const RINGS_CENTRE: Point = { x: 960, y: 540 };

/** The routes of the travelling objects, stage units (design §4.3), verbatim. */
export const ROUTES: Readonly<Record<string, string>> = {
  "archive-1": "M 480,140 C 650,70 820,70 900,70",
  go: "M 229.4,409.5 C 320,280 380,190 380,150",
  "archive-2": "M 380,150 C 600,100 800,130 900,170",
};

/** The dashed guide (stage units), drawn x STAGE_SCALE by `MotionPath`. */
export const GUIDES = { go: ROUTES.go } as const;

const n = (value: number) => Math.round(value * 1000) / 1000;
/** A path of absolute commands with every number multiplied by `k` (stage units to composition pixels). */
export const scalePath = (d: string, k: number = STAGE_SCALE): string => d.replace(/-?\d+(?:\.\d+)?/g, (value) => String(n(Number(value) * k)));

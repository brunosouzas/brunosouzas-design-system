// One layout per format, in composition pixels (the pilot's, unchanged). The 4:5
// layout is drawn on its own, with its own arrow routes: scaling the 16:9 one
// does not work. Keep pills off the straight part of an arrow, or the
// travelling token hides under the pill for most of its trip.
import type { Format } from "../catalogue";
import type { StateId, TransitionId } from "./scene";

export type Box = { x: number; y: number; w: number; h: number };
export type Layout = {
  width: number;
  height: number;
  rings: { cx: number; cy: number };
  boxes: Record<StateId, Box>;
  start: { dot: [number, number]; d: string };
  arrows: Record<TransitionId, string>;
  pills: Record<TransitionId, [number, number]>;
  caption: { y: number; width: number };
  size: { state: number; pill: number; caption: number; square: number };
};

const landscape: Layout = {
  width: 1920,
  height: 1080,
  rings: { cx: 960, cy: 500 },
  boxes: {
    closed: { x: 190, y: 150, w: 480, h: 210 },
    open: { x: 1250, y: 150, w: 480, h: 210 },
    half: { x: 690, y: 610, w: 540, h: 210 },
  },
  start: { dot: [110, 255], d: "M128,255 L172,255" },
  arrows: {
    toOpen: "M684,255 L1232,255",
    toHalf: "M1560,376 C1560,600 1440,715 1246,715",
    halfToOpen: "M1080,598 C1150,500 1300,450 1400,378",
    halfToClosed: "M676,715 C470,715 380,560 420,378",
  },
  pills: {
    toOpen: [958, 160],
    toHalf: [1590, 540],
    halfToOpen: [1150, 470],
    halfToClosed: [360, 560],
  },
  caption: { y: 960, width: 1600 },
  size: { state: 56, pill: 30, caption: 40, square: 40 },
};

const portrait: Layout = {
  width: 1080,
  height: 1350,
  rings: { cx: 540, cy: 600 },
  boxes: {
    closed: { x: 100, y: 250, w: 410, h: 200 },
    open: { x: 580, y: 250, w: 410, h: 200 },
    half: { x: 290, y: 790, w: 500, h: 200 },
  },
  start: { dot: [40, 350], d: "M56,350 L86,350" },
  arrows: {
    toOpen: "M305,236 C305,110 785,110 785,236",
    toHalf: "M900,464 C900,650 880,860 804,890",
    halfToOpen: "M640,778 C660,690 700,580 760,466",
    halfToClosed: "M276,890 C140,885 110,650 220,466",
  },
  pills: {
    toOpen: [545, 140],
    toHalf: [880, 680],
    halfToOpen: [570, 590],
    halfToClosed: [170, 680],
  },
  caption: { y: 1170, width: 960 },
  size: { state: 54, pill: 30, caption: 40, square: 36 },
};

export const layouts: Record<Format, Layout> = { "16x9": landscape, "4x5": portrait };

// Reading the SDD archive scene's stage the way the layout, size and words
// tests need it (change sdd-scene-3-archive, tasks 4.4 and 4.5): every drawn
// string with its box and effective size, the pills, the book and the stamp
// disc of design §6.3, and which elements are popping, leaving, in flight or
// jolting at a frame. Geometry is read from the piece trees stage.ts returns,
// with their transforms applied (test/scenes/topology-tree.ts's walk, which
// reads translate and scale and ignores rotate). Test-only.
import { tokens } from "../../tokens/generated/tokens";
import { g, type SvgNode } from "../../src/pieces/node.ts";
import { frameAt, type Appear, type ArchiveState } from "../../src/scenes/sdd-scene-3-archive/frame";
import { BODY_BOXES } from "../../src/scenes/sdd-scene-3-archive/layout";
import { STAGE_LAYERS, stageOf, type Stage } from "../../src/scenes/sdd-scene-3-archive/stage";
import type { Box } from "./text-measure";
import { textsOf, walk, type DrawnText } from "./topology-tree";

export type Frame = { frame: number; state: ArchiveState } & Stage;
export const frameOf = (frame: number): Frame => { const state = frameAt(frame); return { frame, state, ...stageOf(state) }; };
export const FRAMES: Frame[] = Array.from({ length: 600 }, (_, f) => frameOf(f));

/** Every drawn string of a frame, every layer. */
export const textsAt = (f: Frame): DrawnText[] => STAGE_LAYERS.flatMap((name) => textsOf(f[name]));

export type Item = { name: string; box: Box; round?: { cx: number; cy: number; r: number } };
/** The first shape (rect or circle) of an element in a layer, with half its stroke: its body box (and, for a circle, the circle). */
export const bodyItem = (layer: SvgNode, element: string): Item | null => {
  for (const w of walk(layer)) {
    if (w.element !== element || (w.node.tag !== "rect" && w.node.tag !== "circle")) continue;
    const a = w.node.attrs, n = (k: string) => Number(a[k]);
    const s = Math.hypot(w.m[0], w.m[1]);
    const half = (Number(a["stroke-width"] ?? tokens.outline.block) / 2) * s;
    const at = (x: number, y: number) => ({ x: w.m[0] * x + w.m[2] * y + w.m[4], y: w.m[1] * x + w.m[3] * y + w.m[5] });
    if (w.node.tag === "rect") {
      const p = at(n("x"), n("y"));
      return { name: element, box: { x0: p.x - half, y0: p.y - half, x1: p.x + n("width") * s + half, y1: p.y + n("height") * s + half } };
    }
    const c = at(n("cx"), n("cy")), r = n("r") * s + half;
    return { name: element, box: { x0: c.x - r, y0: c.y - r, x1: c.x + r, y1: c.y + r }, round: { cx: c.x, cy: c.y, r } };
  }
  return null;
};

const settled = (a: Appear | null | undefined) => a !== null && a !== undefined && a.opacity === 1 && a.scale === 1;
/**
 * The elements a frame does not check for placement (design §6.3 item 6 /
 * spec "SDD archive text placement"): popping or leaving, and the `?` pill
 * while settling (its pop to pop + fps) or leaving (fix to fix + 10).
 */
export const exemptAt = (f: Frame): Set<string> => {
  const s = f.state, out = new Set<string>();
  if (s.book && !settled(s.book.appear)) out.add("book");
  if (s.fieldPill && !settled(s.fieldPill.appear)) out.add("field-pill");
  if (s.finding !== null && !settled(s.finding)) out.add("finding-pill");
  if (s.go && !s.go.landed) out.add("go");
  return out;
};

/** The pills, the book and the stamp disc design §6.3 checks at a frame, and the words (not the `?`). */
export const itemsAt = (f: Frame): { blocks: Item[]; words: (DrawnText & { name: string })[] } => {
  const blocks: Item[] = [];
  const add = (item: Item | null) => { if (item) blocks.push(item); };
  add(bodyItem(f.book, "book"));
  add(bodyItem(f.book, "field-pill"));
  add(bodyItem(f.folders, "finding-pill"));
  add(bodyItem(f.verdict, "go"));
  const words = textsAt(f).filter((t) => t.text !== "?").map((t) => ({ ...t, name: `${t.element} "${t.text}"` }));
  return { blocks, words };
};
export const CAST_BOXES: Item[] = Object.entries(BODY_BOXES).map(([name, box]) => ({ name: `${name} body`, box }));

/** A layer with one element moved by (dx, dy): a fixture for the placement test. */
export const moveElement = (node: SvgNode, element: string, dx: number, dy: number): SvgNode =>
  node.attrs["data-element"] === element
    ? g({ transform: `translate(${dx} ${dy})` }, node)
    : { ...node, children: node.children.map((c) => (typeof c === "string" ? c : moveElement(c, element, dx, dy))) };

/** A layer whose text nodes under `element` are drawn at `size`: a fixture for the size test. */
export const resizeText = (node: SvgNode, element: string, size: number, inside = false): SvgNode => {
  const here = inside || node.attrs["data-element"] === element;
  const attrs = here && node.tag === "text" ? { ...node.attrs, "font-size": size } : node.attrs;
  return { ...node, attrs, children: node.children.map((c) => (typeof c === "string" ? c : resizeText(c, element, size, here))) };
};

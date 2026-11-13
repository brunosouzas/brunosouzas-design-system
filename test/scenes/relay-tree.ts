// Reading the SDD relay scene's stage the way the layout, size and words
// tests need it (change sdd-scene-1-relay, tasks 4.4 and 4.5): every drawn
// string with its box and effective size, the boxes of design §6.3 item 5,
// and which elements are popping, leaving or travelling at a frame (item 6).
// Geometry is read from the piece trees stage.ts returns, with their
// transforms applied (test/scenes/topology-tree.ts's walk), so a test checks
// what the frame draws. Test-only.
import { tokens } from "../../tokens/generated/tokens";
import { g, type SvgNode } from "../../src/pieces/node.ts";
import { frameAt, type Appear, type RelayState } from "../../src/scenes/sdd-request-relay/frame";
import { BODY_BOXES, REWIND_MARK } from "../../src/scenes/sdd-request-relay/layout";
import { STAGE_LAYERS, stageOf, type Stage } from "../../src/scenes/sdd-request-relay/stage";
import { timeline } from "../../src/scenes/sdd-request-relay/timeline";
import type { Box } from "./text-measure";
import { textsOf, walk, type DrawnText } from "./topology-tree";

export type Frame = { frame: number; state: RelayState } & Stage;
export const frameOf = (frame: number): Frame => { const state = frameAt(frame); return { frame, state, ...stageOf(state) }; };

/** Every drawn string of a frame, every layer. */
export const textsAt = (f: Frame): DrawnText[] => STAGE_LAYERS.flatMap((name) => textsOf(f[name]));

/** The first shape (rect or circle) of an element in a layer, with half its stroke: its body box. */
export const bodyBox = (layer: SvgNode, element: string): Box | null => {
  for (const w of walk(layer)) {
    if (w.element !== element || (w.node.tag !== "rect" && w.node.tag !== "circle")) continue;
    const a = w.node.attrs, n = (k: string) => Number(a[k]);
    const s = Math.hypot(w.m[0], w.m[1]);
    const half = (Number(a["stroke-width"] ?? tokens.outline.block) / 2) * s;
    const at = (x: number, y: number) => ({ x: w.m[0] * x + w.m[2] * y + w.m[4], y: w.m[1] * x + w.m[3] * y + w.m[5] });
    if (w.node.tag === "rect") {
      const p = at(n("x"), n("y"));
      return { x0: p.x - half, y0: p.y - half, x1: p.x + n("width") * s + half, y1: p.y + n("height") * s + half };
    }
    const c = at(n("cx"), n("cy")), r = n("r") * s + half;
    return { x0: c.x - r, y0: c.y - r, x1: c.x + r, y1: c.y + r };
  }
  return null;
};

export type Item = { name: string; box: Box };
/** The boxes design §6.3 checks at a frame: the label pill, the `GO` mark, the badge, the rewind mark, and the words (not the `?`). */
export const itemsAt = (f: Frame): { blocks: Item[]; words: (DrawnText & { name: string })[] } => {
  const blocks: Item[] = [];
  const add = (name: string, box: Box | null) => { if (box) blocks.push({ name, box }); };
  add("label", bodyBox(f.sheet, "label"));
  add("go-mark", bodyBox(f.sheet, "go-mark"));
  add("badge", bodyBox(f.above, "badge"));
  if (f.state.rewindMark) add("rewind-mark", { x0: REWIND_MARK.x, y0: REWIND_MARK.y, x1: REWIND_MARK.x + REWIND_MARK.size, y1: REWIND_MARK.y + REWIND_MARK.size });
  const words = textsAt(f).filter((t) => t.text !== "?").map((t) => ({ ...t, name: `${t.element} "${t.text}"` }));
  return { blocks, words };
};
export const CAST_BOXES: Item[] = Object.entries(BODY_BOXES).map(([name, box]) => ({ name: `${name} body`, box }));

const settled = (a: Appear | null | undefined) => a !== null && a !== undefined && a.opacity === 1 && a.scale === 1;
/** The elements a frame does not check (design §6.3 item 6): popping, leaving, or the sheet on a trip. */
export const exemptAt = (f: Frame): Set<string> => {
  const s = f.state, out = new Set<string>();
  if (s.badge && !settled(s.badge.appear)) out.add("badge");
  if (s.rewindMark && !settled(s.rewindMark)) out.add("rewind-mark");
  if (s.sheet) {
    if (!settled(s.sheet.appear) || s.sheet.place === "trip") out.add("label").add("go-mark").add("sheet");
    if (s.sheet.go && !settled(s.sheet.go)) out.add("go-mark");
  }
  return out;
};

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

/** Balão's act in take 2, during which its held stamp's smaller `GO` may show (design §2.2). */
export const STAMP_ACT = timeline.acts.find((a) => a.actor === "balao" && a.from === 752)!;

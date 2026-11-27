// Reading the Idempotent Receiver book scene's stage the way the layout, size
// and words tests need it (change idempotent-receiver-book-scene, tasks 3.3
// and 3.4): every drawn string with its box and effective size, the blocks of
// design §6.3, and which elements are popping, fading or travelling at a frame.
// Geometry is read from the piece trees stage.ts returns, with their
// transforms applied (test/scenes/topology-tree.ts's walk), so a test checks
// what the frame draws. Test-only.
import { g, type SvgNode } from "../../src/pieces/node.ts";
import { frameAt, type Appear, type BookState } from "../../src/scenes/idempotent-receiver-book/frame";
import { AT, BADGE, REWIND_MARK } from "../../src/scenes/idempotent-receiver-book/layout";
import { STAGE_LAYERS, stageOf, type Stage } from "../../src/scenes/idempotent-receiver-book/stage";
import type { Box } from "./text-measure";
import { textsOf, type DrawnText } from "./topology-tree";

export type Frame = { frame: number; state: BookState } & Stage;
export const frameOf = (frame: number): Frame => { const state = frameAt(frame); return { frame, state, ...stageOf(state) }; };

/** Every drawn string of a frame, every layer. */
export const textsAt = (f: Frame): DrawnText[] => STAGE_LAYERS.flatMap((name) => textsOf(f[name]));

export type Item = { name: string; box: Box };
/** The blocks design §6.3 checks at a frame: the badge (its circle, radius 26.18 at text 36, with half its outline) and the rewind mark. */
export const blocksAt = (f: Frame): Item[] => {
  const out: Item[] = [];
  if (f.state.badge) out.push({ name: "badge", box: { x0: BADGE.cx - 28, y0: BADGE.cy - 28, x1: BADGE.cx + 28, y1: BADGE.cy + 28 } });
  if (f.state.rewindMark) out.push({ name: "rewind-mark", box: { x0: REWIND_MARK.x, y0: REWIND_MARK.y, x1: REWIND_MARK.x + REWIND_MARK.size, y1: REWIND_MARK.y + REWIND_MARK.size } });
  return out;
};

const settled = (a: Appear | null | undefined) => a !== null && a !== undefined && a.opacity === 1 && a.scale === 1;
const RESTS = Object.values(AT);
const atRest = (p: { x: number; y: number }) => RESTS.some((r) => Math.abs(r.x - p.x) < 1e-9 && Math.abs(r.y - p.y) < 1e-9);
/** The elements a frame does not check (design §6.3): popping, fading, leaving, or a token on a trip. */
export const exemptAt = (f: Frame): Set<string> => {
  const s = f.state, out = new Set<string>();
  const pop = (name: string, a: Appear | null) => { if (a !== null && !settled(a)) out.add(name); };
  pop("sender", s.sender); pop("store", s.store); pop("stored", s.stored); pop("question", s.question); pop("check", s.check);
  if (s.badge) pop("badge", s.badge.appear);
  pop("rewind-mark", s.rewindMark);
  if (s.ghost > 0 && s.ghost < 1) out.add("ghost");
  for (const m of s.messages) if (!settled(m.appear) || !atRest(m.point)) out.add(m.id);
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

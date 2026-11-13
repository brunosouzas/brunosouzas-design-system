// The SDD relay scene's layout, text size and placement (spec scene-catalogue,
// "SDD relay text size", "SDD relay text placement"; change sdd-scene-1-relay,
// task 4.4). Text is measured with harfbuzzjs on the package's `fonts/` faces
// (test/scenes/text-measure.ts); geometry is read from the stage trees
// (test/scenes/relay-tree.ts).
import { describe, expect, test } from "vitest";
import {
  BADGE, BODY_BOXES, CAST_SCALE, CAST_X, CODE_LINE_SHAPES, DESK, EMOTES, FAILURE_ARROW, GO_MARK, GROUND, GUIDES, HELD, KEYBOARD_LOCAL, LABEL, PAGE, QUESTION_BARS,
  REQUEST_LINE, REWIND_MARK, RINGS_CENTRE, ROUTES, SCREEN, STAGE, TEXT_SIZE, TOKEN_SCALE,
} from "../../src/scenes/sdd-request-relay/layout";
import { ABOVE_ORDER, BELOW_ORDER, CAST_ORDER, SHEET_ORDER } from "../../src/scenes/sdd-request-relay/stage";
import type { Box } from "./text-measure";
import { CAST_BOXES, STAMP_ACT, exemptAt, frameOf, itemsAt, moveElement, resizeText, textsAt, type Frame } from "./relay-tree";
import { walk } from "./topology-tree";
import type { SvgNode } from "../../src/pieces/node.ts";

const FRAMES: Frame[] = Array.from({ length: 1080 }, (_, f) => frameOf(f));
const MARGIN = 12;
const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;

describe("SDD relay layout", () => {
  test("Layout equals the design", () => {
    // design §6.1
    expect(CAST_SCALE).toBe(0.95);
    expect(GROUND).toBe(476);
    expect(CAST_X).toEqual({ balao: 104, chaves: 505, visor: 852 });
    expect(SCREEN).toEqual({ x: 584, y: 258, width: 162, height: 124, top: 22, step: 16 });
    expect(REQUEST_LINE).toEqual({ indent: 0, w: 96, color: "white", tall: true });
    expect(CODE_LINE_SHAPES).toEqual([{ indent: 0, w: 70 }, { indent: 16, w: 100 }, { indent: 32, w: 64 }, { indent: 32, w: 90 }, { indent: 16, w: 56 }, { indent: 0, w: 30 }]);
    expect(KEYBOARD_LOCAL).toEqual({ x: 98, y: -74, width: 150 });
    expect(PAGE).toEqual({ width: 180, height: 226, top: 32, step: 23 });
    expect(QUESTION_BARS).toEqual([76, 58, 84, 66, 80, 52]);
    expect(near(DESK.x, 579.5) && near(DESK.y, 36.3)).toBe(true);
    expect(near(HELD.x, 221.9) && near(HELD.y, 223.3)).toBe(true);
    expect(LABEL).toEqual({ width: 206, height: 44 });
    expect(GO_MARK).toEqual({ r: 24, scale: 1.25, dx: 58.9, dy: 183.35 });
    expect(TOKEN_SCALE).toBe(0.95);
    expect(FAILURE_ARROW).toEqual({ from: [588, 266], to: [124, 284], controls: [[500, 80], [160, 100]], kind: "failure" });
    expect(EMOTES.problem.scale).toBe(0.8);
    expect(near(EMOTES.problem.x, 214.2) && near(EMOTES.problem.y, 286)).toBe(true);
    expect(EMOTES.worked).toEqual({ x: 800, y: 292, scale: 0.75 });
    expect(BADGE).toEqual({ cx: 912, cy: 52 });
    expect(REWIND_MARK).toEqual({ x: 826, y: 28, size: 48 });
    expect(RINGS_CENTRE).toEqual({ x: 960, y: 540 });
    expect(TEXT_SIZE).toEqual({ word: 33, strong: 36 });
    // design §6.2
    const r = (b: Box) => [b.x0, b.y0, b.x1, b.y1].map((v) => Math.round(v * 10) / 10);
    expect(r(BODY_BOXES.balao)).toEqual([45.1, 322.1, 193.3, 476]);
    expect(r(BODY_BOXES.chaves)).toEqual([419.5, 333.5, 590.5, 476]);
    expect(r(BODY_BOXES.visor)).toEqual([789.3, 341.1, 914.7, 476]);
    // design §4.4
    for (let i = 0; i < 6; i++) {
      const x = 437.5 + 27 * i, y = 597.5 + 27 * i, rk = 77.15 + 21.85 * i;
      const n = (v: number) => String(Math.round(v * 1000) / 1000);
      expect(ROUTES[`ask-${i}`]).toBe(`M 193.3,403.8 C 230,250 340,215 ${n(x)},300`);
      expect(ROUTES[`hop-${i}`]).toBe(`M ${n(x)},300 C ${n(x + 60)},240 ${n(y - 40)},270 ${n(y)},340`);
      expect(ROUTES[`list-${i}`]).toBe(`M ${n(y)},340 C ${n(y)},290 608,${n(rk + 50)} 608,${n(rk)}`);
    }
    expect(ROUTES.carry).toBe("M 579.5,36.3 C 474.5,10 314.5,90 221.9,223.3");
    expect(ROUTES.return).toBe("M 221.9,223.3 C 314.5,90 474.5,10 579.5,36.3");
    expect(GUIDES).toEqual({ p1: "M 193.3,403.8 C 230,250 340,215 505,300", p2: "M 505,300 C 565,240 625,270 665,340", p4: "M 665,36.3 C 560,10 400,90 307.4,223.3" });
  });
});

// ---------------------------------------------------------------- size

/** Every size problem: a settled word below its minimum, naming it, its size and its first frame. */
const sizeProblems = (frames: readonly Frame[]): string[] => {
  const problems = new Map<string, string>();
  for (const f of frames) {
    const exempt = exemptAt(f);
    for (const t of textsAt(f)) {
      if (t.text === "?" || exempt.has(t.element)) continue;
      const min = t.text === "1" || t.text === "2" ? TEXT_SIZE.strong : TEXT_SIZE.word;
      // Balão's held stamp is part of its act (design §2.2): its `GO` may be smaller there only.
      if (t.element === "balao" && t.text === "GO" && f.frame >= STAMP_ACT.from && f.frame <= STAMP_ACT.to) continue;
      if (t.size < min - 1e-9) {
        const key = `${t.element} "${t.text}"`;
        if (!problems.has(key)) problems.set(key, `${key} at ${Math.round(t.size * 100) / 100} (minimum ${min}), first drawn at frame ${f.frame}`);
      }
    }
  }
  return [...problems.values()];
};

describe("SDD relay text size", () => {
  test("Every settled word at its minimum", () => {
    expect(sizeProblems(FRAMES)).toEqual([]);
    // The words are there to be measured, at the sizes design §2.2 gives.
    const label = textsAt(FRAMES[700]).find((t) => t.text === "proposal.md")!;
    expect(label.size).toBeCloseTo(33);
    const go = textsAt(FRAMES[1000]).filter((t) => t.text === "GO");
    expect(go).toHaveLength(1);
    expect(go[0].size).toBeCloseTo(33.75);
    const held = textsAt(FRAMES[825]).filter((t) => t.text === "GO");
    expect(held.map((t) => Math.round(t.size * 100) / 100)).toEqual([25.65]);
    expect(textsAt(FRAMES[1000]).find((t) => t.text === "2")!.size).toBe(36);
  });

  test("Too small rejected", () => {
    // Run over every frame, not a hand-picked slice: a slice's start frame would be
    // reported as "first drawn" regardless of where the real exemption boundary is
    // (it would report whatever frame the slice happens to start at), so this is
    // the only way the reported frame actually proves anything about the scene.
    const small = FRAMES.map((f) => ({ ...f, sheet: resizeText(f.sheet, "label", 32) }));
    expect(sizeProblems(small)).toEqual(['label "proposal.md" at 32 (minimum 33), first drawn at frame 656']);
    // The badge pops once (frame 20, settled at 50) and its digit swaps without a
    // fresh pop (design §4, 440: "no fresh pop"), so it is never exempt again after
    // 50 and the forced-too-small size is caught under both digits it ever shows.
    const badge = FRAMES.map((f) => ({ ...f, above: resizeText(f.above, "badge", 35) }));
    expect(sizeProblems(badge)).toEqual([
      'badge "1" at 35 (minimum 36), first drawn at frame 50',
      'badge "2" at 35 (minimum 36), first drawn at frame 440',
    ]);
  });
});

// ---------------------------------------------------------------- placement

const fmt = (b: Box) => [b.x0, b.y0, b.x1, b.y1].map((v) => Math.round(v * 10) / 10).join(", ");
/** Every placement problem of design §6.3 items 4 and 5, each naming its frame and the elements. */
const placementProblems = (frames: readonly Frame[]): string[] => {
  const problems: string[] = [];
  for (const f of frames) {
    const exempt = exemptAt(f);
    const { blocks, words } = itemsAt(f);
    const checked = [...blocks.filter((b) => !exempt.has(b.name)), ...words.filter((w) => !exempt.has(w.element)).map((w) => ({ name: w.name, box: w.box, element: w.element }))];
    for (const item of checked) {
      const b = item.box;
      if (b.x0 < MARGIN || b.y0 < MARGIN || b.x1 > STAGE.width - MARGIN || b.y1 > STAGE.height - MARGIN) problems.push(`frame ${f.frame}: ${item.name} leaves the stage less ${MARGIN} (${fmt(b)})`);
    }
    const owner = (item: { name: string; element?: string }) => item.element ?? item.name;
    for (const [i, a] of checked.entries()) {
      for (const b of checked.slice(i + 1)) if (owner(a) !== owner(b) && overlaps(a.box, b.box)) problems.push(`frame ${f.frame}: ${a.name} crosses ${b.name}`);
      // Balão's held stamp word belongs to Balão; the other words and blocks keep clear of every body.
      for (const c of CAST_BOXES) if (owner(a) !== c.name.replace(" body", "") && overlaps(a.box, c.box)) problems.push(`frame ${f.frame}: ${a.name} crosses ${c.name}`);
    }
  }
  return problems;
};

describe("SDD relay text placement", () => {
  test("Placement at every checked frame", () => {
    expect(placementProblems(FRAMES)).toEqual([]);
    // The check sees the elements it is meant to: the desk label and mark and the badge at the final still.
    expect(itemsAt(FRAMES[1000]).blocks.map((b) => b.name).sort()).toEqual(["badge", "go-mark", "label"]);
  });

  test("Collision rejected", () => {
    const moved = FRAMES.slice(600, 700).map((f) => ({ ...f, above: moveElement(f.above, "badge", 665 - 912, 40 - 52) }));
    const problems = placementProblems(moved);
    expect(problems[0]).toMatch(/^frame 656: (label crosses badge|badge crosses label)/);
  });
});

// ---------------------------------------------------------------- layer order and the hand-over (design §6.2, §2.9)

describe("SDD relay layer order", () => {
  test("Layer order", () => {
    // Within each layer's bodies group and its words group, the elements follow the layer's declared order
    // (design §6.2, SCN-6): below (failure-arrow, keyboard, screen), cast (visor, chaves, balao -- Balão last, so
    // its stamp is over the held sheet), sheet (sheet, label, go-mark), above (badge, rewind-mark, emote).
    const order = (group: unknown) =>
      [...new Set(walk(group as never).flatMap((w) => (w.node.attrs["data-element"] === undefined ? [] : [String(w.node.attrs["data-element"])])))];
    const sortedBy = (names: string[], list: readonly string[]) =>
      expect(names.map((n) => list.indexOf(n))).toEqual([...names.map((n) => list.indexOf(n))].sort((a, b) => a - b));
    for (const frame of [305, 395, 1000]) {
      const f = frameOf(frame);
      for (const group of f.below.children) sortedBy(order(group), BELOW_ORDER);
      for (const group of f.cast.children) sortedBy(order(group), CAST_ORDER);
      for (const group of f.sheet.children) sortedBy(order(group), SHEET_ORDER);
      for (const group of f.above.children) sortedBy(order(group), ABOVE_ORDER);
    }
    // Every element named in the constants actually appears at least once across the frames checked.
    const seen = new Set<string>();
    for (const frame of [305, 395, 1000]) {
      const f = frameOf(frame);
      for (const layer of [f.below, f.cast, f.sheet, f.above]) for (const n of order(layer)) seen.add(n);
    }
    for (const n of [...BELOW_ORDER, ...CAST_ORDER, ...SHEET_ORDER, ...ABOVE_ORDER]) expect(seen.has(n), n).toBe(true);
  });
});

describe("SDD relay hand-over", () => {
  /** The absolute stage point of a shape (its `x`/`y`, `cx`/`cy`, or a path's first `M`). */
  const shapePoint = (w: ReturnType<typeof walk>[number]): { x: number; y: number } | null => {
    const a = w.node.attrs, apply = (x: number, y: number) => ({ x: w.m[0] * x + w.m[2] * y + w.m[4], y: w.m[1] * x + w.m[3] * y + w.m[5] });
    if (w.node.tag === "rect") return apply(Number(a.x), Number(a.y));
    if (w.node.tag === "circle") return apply(Number(a.cx), Number(a.cy));
    if (w.node.tag === "path" && typeof a.d === "string") {
      const m = /M\s*([\d.-]+)[ ,]+([\d.-]+)/.exec(a.d);
      if (m) return apply(Number(m[1]), Number(m[2]));
    }
    return null;
  };
  /**
   * The held sheet's own nodes, re-rooted at the stage (brand-cast.ts's
   * `holdSheet`, the group tagged `data-held="sheet"`), not Chaves's whole
   * body: his limbs and head also hold 2-segment paths that the row-check
   * heuristic below would otherwise misread as checks (a false positive
   * `rowStates` found at frame 734, before any answer, from Chaves's own
   * body, not the sheet).
   */
  const heldSheetOf = (node: SvgNode): ReturnType<typeof walk> => {
    for (const w of walk(node)) if (w.node.attrs["data-held"] === "sheet") return walk(w.node, w.m);
    throw new Error("no held sheet");
  };
  /** The page's top-left corner (its 180 x 226 rect) among already-walked nodes. */
  const pageCorner = (nodes: ReturnType<typeof walk>): { x: number; y: number } => {
    for (const w of nodes) if (w.node.tag === "rect" && Number(w.node.attrs.width) === PAGE.width && Number(w.node.attrs.height) === PAGE.height) {
      const p = shapePoint(w);
      if (p) return p;
    }
    throw new Error("no page rect");
  };
  /**
   * Each of the 6 rows, top to bottom, true if it has a check (`paper.ts`'s tail
   * mark). A row's `?` disc and its tail check share one `cy` (paper.ts: the disc
   * at `(x + 30, cy)`, the tick's first point at `(tx + 5, cy)`), so pairing by `y`
   * identifies the row; pairing by distance from the disc is wrong, because the
   * tail sits far to the row's right (`x + width - 40`), not near the disc.
   */
  const rowStates = (nodes: ReturnType<typeof walk>): boolean[] => {
    const marks: { x: number; y: number }[] = [], checks: { x: number; y: number }[] = [];
    for (const w of nodes) {
      if (w.node.tag === "circle" && Number(w.node.attrs.r) === 13) { const p = shapePoint(w); if (p) marks.push(p); }
      if (w.node.tag === "path" && typeof w.node.attrs.d === "string" && (String(w.node.attrs.d).match(/L/g) ?? []).length === 2) {
        const p = shapePoint(w);
        if (p) checks.push(p);
      }
    }
    return marks.sort((a, b) => a.y - b.y).map((m) => checks.some((c) => Math.abs(c.y - m.y) < 5));
  };
  test("Seamless hand-over", () => {
    // At 734 and 852 the free sheet (just before/after Chaves holds it, the last/first frame it is drawn
    // that way) and the held sheet are at the same place, within the one-frame gap every trip leaves before
    // its destination (design §2.9: "no jump"; the carry/return trips end at T frames, drawn up to the frame
    // before arrival, design §4.4), with the same rows and checks: content does not reset across the switch
    // of drawing path (the free `sheet` piece to Chaves's own `holdsSheet`).
    const GAP = 25; // stage units: generous against the known one-frame interpolation shortfall (~19 units)
    const cases = [
      { free: 733, held: 734, checked: false }, // the carry: before any answer, every row unchecked
      { free: 852, held: 851, checked: true }, // the return: after the stamp, every answered row checked
    ];
    for (const { free, held, checked } of cases) {
      const freeNodes = walk(frameOf(free).sheet), heldNodes = heldSheetOf(frameOf(held).cast);
      const freeCorner = pageCorner(freeNodes), heldCorner = pageCorner(heldNodes);
      expect(Math.hypot(freeCorner.x - HELD.x, freeCorner.y - HELD.y)).toBeLessThan(GAP);
      expect(Math.hypot(heldCorner.x - HELD.x, heldCorner.y - HELD.y)).toBeLessThan(1);
      const freeRows = rowStates(freeNodes), heldRows = rowStates(heldNodes);
      expect(freeRows).toEqual(heldRows);
      // Non-vacuous: the shared result must actually be the expected all-false/all-true,
      // not an accidental match (e.g. both sides wrongly reading six falses).
      expect(freeRows).toEqual(Array(6).fill(checked));
    }
  });
});

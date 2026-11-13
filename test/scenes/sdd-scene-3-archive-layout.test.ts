// The SDD archive scene's layout, text size and placement (spec
// scene-catalogue, "SDD archive text size", "SDD archive text placement";
// change sdd-scene-3-archive, task 4.4). Text is measured with harfbuzzjs on
// the package's `fonts/` faces (test/scenes/text-measure.ts); geometry is read
// from the stage trees (test/scenes/archive-tree.ts).
import { describe, expect, test } from "vitest";
import {
  BODY_BOXES, BOOK, CAST_SCALE, CAST_X, EMOTES, FIELD_PILL, FINDING_PILL, GO, GROUND, GUIDES, JOLT, RINGS_CENTRE, ROUTES, STAGE, TEXT_SIZE, VERDICT_CENTRE,
} from "../../src/scenes/sdd-scene-3-archive/layout";
import { ABOVE_ORDER, BOOK_ORDER, CAST_ORDER, FOLDERS_ORDER, VERDICT_ORDER } from "../../src/scenes/sdd-scene-3-archive/stage";
import type { Box } from "./text-measure";
import { CAST_BOXES, FRAMES, bodyItem, exemptAt, itemsAt, moveElement, resizeText, type Frame } from "./archive-tree";
import { walk } from "./topology-tree";

const MARGIN = 12;
const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;

describe("SDD archive layout", () => {
  test("Layout equals the design", () => {
    // design §6.1
    expect(CAST_SCALE).toBe(0.95);
    expect(GROUND).toBe(476);
    expect(CAST_X).toEqual({ balao: 104, chaves: 505, visor: 852 });
    expect(BOOK).toEqual({ x: 620, y: 300, width: 90, height: 160 });
    expect(FIELD_PILL).toEqual({ cx: 665, cy: 230, width: 300, height: 44 });
    expect(FINDING_PILL).toEqual({ cx: 380, cy: 32, width: 40, height: 32 });
    expect(JOLT).toEqual({ amplitude: 5, period: 6 });
    expect(VERDICT_CENTRE).toEqual({ x: 380, y: 150 });
    expect(near(GO.from.x, 229.4) && near(GO.from.y, 409.5)).toBe(true);
    expect([GO.r, GO.scaleFrom, GO.scaleTo]).toEqual([24, 0.95, 1.6]);
    expect(EMOTES.worked).toEqual({ x: 800, y: 292, scale: 0.75 });
    expect(RINGS_CENTRE).toEqual({ x: 960, y: 540 });
    expect(TEXT_SIZE.word).toBe(33);
    // design §6.2
    const r = (b: Box) => [b.x0, b.y0, b.x1, b.y1].map((v) => Math.round(v * 10) / 10);
    expect(r(BODY_BOXES.balao)).toEqual([45.1, 322.1, 193.3, 476]);
    expect(r(BODY_BOXES.chaves)).toEqual([419.5, 333.5, 590.5, 476]);
    expect(r(BODY_BOXES.visor)).toEqual([789.3, 341.1, 914.7, 476]);
    // design §4.3, verbatim routes
    expect(ROUTES["archive-1"]).toBe("M 480,140 C 650,70 820,70 900,70");
    expect(ROUTES.go).toBe("M 229.4,409.5 C 320,280 380,190 380,150");
    expect(ROUTES["archive-2"]).toBe("M 380,150 C 600,100 800,130 900,170");
    expect(GUIDES).toEqual({ go: ROUTES.go });
    // The book is clear of Chaves's body box (design §2.4).
    expect(BOOK.x).toBeGreaterThan(BODY_BOXES.chaves.x1);
  });
});

// ---------------------------------------------------------------- size

/** Every size problem: a settled word below its minimum, naming it, its size and its first frame. */
const sizeProblems = (frames: readonly Frame[]): string[] => {
  const problems = new Map<string, string>();
  for (const f of frames) {
    const exempt = exemptAt(f);
    for (const { words } of [itemsAt(f)]) {
      for (const t of words) {
        if (t.text === "?") continue;
        // A smaller `GO` only while Balão holds it (344-359) or in flight (360-381, design §2.2).
        if (t.text === "GO" && f.frame >= 344 && f.frame <= 381) continue;
        if (exempt.has(t.element)) continue;
        if (t.size < TEXT_SIZE.word - 1e-9) {
          const key = `${t.element} "${t.text}"`;
          if (!problems.has(key)) problems.set(key, `${key} at ${Math.round(t.size * 100) / 100} (minimum ${TEXT_SIZE.word}), first drawn at frame ${f.frame}`);
        }
      }
    }
  }
  return [...problems.values()];
};

describe("SDD archive text size", () => {
  test("Every settled archive word at its minimum", () => {
    expect(sizeProblems(FRAMES)).toEqual([]);
    expect(itemsAt(FRAMES[450]).words.find((t) => t.text === "exactly two fields" || t.text === "exactly three fields")).toBeDefined();
  });

  test("Archive word too small rejected", () => {
    const small = FRAMES.map((f) => ({ ...f, book: resizeText(f.book, "field-pill", 32) }));
    expect(sizeProblems(small)).toEqual([
      'field-pill "exactly two fields" at 32 (minimum 33), first drawn at frame 130',
      'field-pill "exactly three fields" at 32 (minimum 33), first drawn at frame 452',
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
    const { blocks } = itemsAt(f);
    const checked = blocks.filter((b) => !exempt.has(b.name));
    for (const item of checked) {
      const b = item.box;
      if (b.x0 < MARGIN || b.y0 < MARGIN || b.x1 > STAGE.width - MARGIN || b.y1 > STAGE.height - MARGIN) problems.push(`frame ${f.frame}: ${item.name} leaves the stage less ${MARGIN} (${fmt(b)})`);
    }
    for (const [i, a] of checked.entries()) {
      for (const b of checked.slice(i + 1)) if (overlaps(a.box, b.box)) problems.push(`frame ${f.frame}: ${a.name} crosses ${b.name}`);
      for (const c of CAST_BOXES) if (overlaps(a.box, c.box)) problems.push(`frame ${f.frame}: ${a.name} crosses ${c.name}`);
    }
  }
  return problems;
};

describe("SDD archive text placement", () => {
  test("Archive placement at every checked frame", () => {
    expect(placementProblems(FRAMES)).toEqual([]);
    expect(itemsAt(FRAMES[450]).blocks.map((b) => b.name).sort()).toEqual(["book", "field-pill"]);
    expect(bodyItem(FRAMES[272].folders, "finding-pill")).toBeDefined();
    expect(bodyItem(FRAMES[400].verdict, "go")).toBeDefined();
  });

  test("Archive collision rejected", () => {
    const moved = FRAMES.map((f) => ({ ...f, book: moveElement(f.book, "field-pill", -300, -200) }));
    const problems = placementProblems(moved);
    // At frame 300 the `?` pill is not exempt (298-303, outside its settle 269-297 and leave 304-313 windows).
    expect(problems).toContain("frame 300: field-pill crosses finding-pill");
  });
});

// ---------------------------------------------------------------- layer order (design §6.2)

describe("SDD archive layer order", () => {
  test("Layer order", () => {
    const order = (group: unknown) =>
      [...new Set(walk(group as never).flatMap((w) => (w.node.attrs["data-element"] === undefined ? [] : [String(w.node.attrs["data-element"])])))];
    const sortedBy = (names: string[], list: readonly string[]) => {
      for (const n of names) expect(list, n).toContain(n);
      expect(names.map((n) => list.indexOf(n))).toEqual([...names.map((n) => list.indexOf(n))].sort((a, b) => a - b));
    };
    for (const frame of [20, 120, 280, 400, 480]) {
      const f = FRAMES[frame];
      const pairs = [[f.book, BOOK_ORDER], [f.folders, FOLDERS_ORDER], [f.cast, CAST_ORDER], [f.above, ABOVE_ORDER]] as const;
      for (const [layer, list] of pairs) for (const group of layer.children) if (typeof group !== "string") sortedBy(order(group), list);
    }
    expect(VERDICT_ORDER).toEqual(["go"]);
  });
});

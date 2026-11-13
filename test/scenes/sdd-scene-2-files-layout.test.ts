// The SDD files scene's layout, text size and placement (spec scene-catalogue,
// "SDD files text size", "SDD files text placement"; change
// sdd-scene-2-files, task 4.4). Text is measured with harfbuzzjs on the
// package's `fonts/` faces (test/scenes/text-measure.ts); geometry is read from
// the stage trees (test/scenes/files-tree.ts).
import { describe, expect, test } from "vitest";
import { tokens } from "../../tokens/generated/tokens";
import {
  BODY_BOXES, CAST_SCALE, CAST_X, CODE_LINE_SHAPES, COMMAND_LINE, EMOTES, FILE_ROUTE_CREST, FILE_SCALE, FILE_SLOTS, FOLDER, FOLDER_CENTRE, FOLDER_LABEL, GO, GROUND, GUIDES,
  KEYBOARD_LOCAL, LABEL_HEIGHT, LABEL_WIDTHS, NO_GO, PAGE, RINGS_CENTRE, ROUTES, ROW_BARS, ROW_MARK_RADIUS, SCREEN, STAGE, TEXT_SIZE, VERDICT_CENTRE, rowMark, slotCentre,
} from "../../src/scenes/sdd-scene-2-files/layout";
import { ABOVE_ORDER, BELOW_ORDER, CAST_ORDER, FILES_ORDER, FOLDER_ORDER, VERDICTS_ORDER } from "../../src/scenes/sdd-scene-2-files/stage";
import type { Box } from "./text-measure";
import { CAST_BOXES, FRAMES, exemptAt, frameOf, inFlightAt, itemsAt, moveElement, resizeText, textsAt, type Frame } from "./files-tree";
import { walk } from "./topology-tree";

const MARGIN = 12;
const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;

describe("SDD files layout", () => {
  test("Layout equals the design", () => {
    // design §6.1
    expect(CAST_SCALE).toBe(0.95);
    expect(GROUND).toBe(476);
    expect(CAST_X).toEqual({ balao: 104, chaves: 505, visor: 852 });
    expect(SCREEN).toEqual({ x: 584, y: 258, width: 162, height: 124, top: 20, step: 15 });
    expect(COMMAND_LINE).toEqual({ indent: 0, w: 96, color: "white", tall: true });
    expect(CODE_LINE_SHAPES).toEqual([{ indent: 0, w: 46 }, { indent: 16, w: 78 }, { indent: 0, w: 66 }, { indent: 16, w: 106 }, { indent: 0, w: 58 }, { indent: 16, w: 99 }]);
    expect(KEYBOARD_LOCAL).toEqual({ x: 98, y: -74, width: 150 });
    expect(FOLDER).toEqual({ x: 394.5, y: 50, scale: 0.9 });
    expect(near(FOLDER_CENTRE.x, 480) && near(FOLDER_CENTRE.y, 139.1)).toBe(true);
    expect(FOLDER_LABEL).toEqual({ cx: 480, cy: 162.5, width: 172, height: 44 });
    expect(PAGE).toEqual({ width: 160, height: 200, top: 32, step: 23 });
    expect(FILE_SCALE).toBe(0.95);
    expect(FILE_SLOTS).toEqual({ proposal: { x: 123, y: 46 }, design: { x: 343, y: 46 }, tasks: { x: 537, y: 46 }, spec: { x: 716, y: 46 } });
    expect(LABEL_WIDTHS).toEqual({ proposal: 206, design: 174, tasks: 154, spec: 144 });
    expect(LABEL_HEIGHT).toBe(44);
    expect(ROW_BARS).toEqual({ proposal: [56, 44, 60, 50, 58, 40], design: [96, 70, 84], tasks: [80, 66, 56, 74], spec: [58, 50, 60, 54, 46] });
    for (let k = 1; k <= 6; k++) expect(rowMark(FILE_SLOTS.spec, k).y).toBeCloseTo(86.85 + 21.85 * (k - 1));
    expect(rowMark(FILE_SLOTS.spec, 1).x).toBeCloseTo(716 + 28.5);
    expect(NO_GO).toEqual({ r: 46, scale: 1.25, fill: "color.state.failure" });
    expect(VERDICT_CENTRE).toEqual({ x: 512, y: 194 });
    expect(near(GO.from.x, 229.4) && near(GO.from.y, 409.5)).toBe(true);
    expect([GO.r, GO.scaleFrom, GO.scaleTo]).toEqual([24, 0.95, 1.6]);
    expect(EMOTES.worked).toEqual({ x: 800, y: 292, scale: 0.75 });
    expect(RINGS_CENTRE).toEqual({ x: 960, y: 540 });
    expect(TEXT_SIZE).toEqual({ word: 33 });
    // design §6.2
    const r = (b: Box) => [b.x0, b.y0, b.x1, b.y1].map((v) => Math.round(v * 10) / 10);
    expect(r(BODY_BOXES.balao)).toEqual([45.1, 322.1, 193.3, 476]);
    expect(r(BODY_BOXES.chaves)).toEqual([419.5, 333.5, 590.5, 476]);
    expect(r(BODY_BOXES.visor)).toEqual([789.3, 341.1, 914.7, 476]);
    // design §4.3
    expect(FILE_ROUTE_CREST).toBe(110);
    for (const [id, x] of [["proposal", 199], ["design", 419], ["tasks", 613], ["spec", 792]] as const) {
      expect(slotCentre(id)).toEqual({ x, y: 141 });
      expect(ROUTES[`file-${id}`]).toBe(`M 480,139.1 C 480,110 ${x},110 ${x},141`);
    }
    expect(ROUTES.go).toBe("M 229.4,409.5 C 300,300 420,194 512,194");
    expect(GUIDES).toEqual({ go: ROUTES.go });
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
      // Balão's held stamp is part of its act (design §2.2): its `GO` may be smaller there only.
      if (t.element === "balao" && t.text === "GO" && exempt.has("balao-go")) continue;
      if (t.size < TEXT_SIZE.word - 1e-9) {
        const key = `${t.element} "${t.text}"`;
        if (!problems.has(key)) problems.set(key, `${key} at ${Math.round(t.size * 100) / 100} (minimum ${TEXT_SIZE.word}), first drawn at frame ${f.frame}`);
      }
    }
  }
  return [...problems.values()];
};

describe("SDD files text size", () => {
  test("Every settled files word at its minimum", () => {
    expect(sizeProblems(FRAMES)).toEqual([]);
    // The words are there to be measured, at the sizes design §2.2 gives.
    for (const word of ["proposal.md", "design.md", "tasks.md", "spec.md"]) expect(textsAt(FRAMES[700]).find((t) => t.text === word)!.size).toBeCloseTo(33);
    expect(textsAt(FRAMES[85]).find((t) => t.text === "openspec/")!.size).toBeCloseTo(33);
    expect(textsAt(FRAMES[400]).find((t) => t.text === "NO-GO")!.size).toBeCloseTo(33.75);
    expect(textsAt(FRAMES[800]).filter((t) => t.text === "GO").map((t) => t.size)).toEqual([expect.closeTo(43.2)]);
    expect(textsAt(FRAMES[616]).filter((t) => t.text === "GO").map((t) => Math.round(t.size * 100) / 100)).toEqual([25.65]);
    // A smaller GO only in Balão's hand or in flight.
    for (const f of FRAMES) for (const t of textsAt(f)) if (t.text === "GO" && t.size < 33) expect(f.frame >= 606 && f.frame <= 647, `frame ${f.frame}`).toBe(true);
  });

  test("Files word too small rejected", () => {
    const small = FRAMES.map((f) => ({ ...f, files: ["proposal", "design", "tasks", "spec"].reduce((layer, id) => resizeText(layer, `label-${id}`, 32), f.files) }));
    expect(sizeProblems(small)).toEqual([
      'label-proposal "proposal.md" at 32 (minimum 33), first drawn at frame 118',
      'label-design "design.md" at 32 (minimum 33), first drawn at frame 124',
      'label-tasks "tasks.md" at 32 (minimum 33), first drawn at frame 130',
      'label-spec "spec.md" at 32 (minimum 33), first drawn at frame 136',
    ]);
    const stamp = FRAMES.map((f) => ({ ...f, verdicts: resizeText(resizeText(f.verdicts, "no-go-1", 27 * 1.2 / 1.25), "no-go-2", 27 * 1.2 / 1.25) }));
    expect(sizeProblems(stamp)).toEqual([
      'no-go-1 "NO-GO" at 32.4 (minimum 33), first drawn at frame 394',
      'no-go-2 "NO-GO" at 32.4 (minimum 33), first drawn at frame 544',
    ]);
  });
});

// ---------------------------------------------------------------- placement

const fmt = (b: Box) => [b.x0, b.y0, b.x1, b.y1].map((v) => Math.round(v * 10) / 10).join(", ");
const STAMPS = new Set(["no-go-1", "no-go-2", "go"]);
/** Every placement problem of design §6.3 items 4 and 5, each naming its frame and the elements. */
const placementProblems = (frames: readonly Frame[]): string[] => {
  const problems: string[] = [];
  for (const f of frames) {
    const exempt = exemptAt(f), flying = inFlightAt(f);
    const { blocks, words } = itemsAt(f);
    const all = [...blocks.map((b) => ({ ...b, element: b.name })), ...words.map((w) => ({ name: w.name, box: w.box, element: w.element, round: undefined }))];
    // Item 4: inside the stage, for every settled element and every element in flight.
    for (const item of all.filter((i) => !exempt.has(i.element) || flying.has(i.element))) {
      const b = item.box;
      if (b.x0 < MARGIN || b.y0 < MARGIN || b.x1 > STAGE.width - MARGIN || b.y1 > STAGE.height - MARGIN) problems.push(`frame ${f.frame}: ${item.name} leaves the stage less ${MARGIN} (${fmt(b)})`);
    }
    // Item 5: no overlaps among the settled ones, none on a cast body, no stamp on a flagged `?`.
    const checked = all.filter((i) => !exempt.has(i.element));
    for (const [i, a] of checked.entries()) {
      for (const b of checked.slice(i + 1)) if (a.element !== b.element && overlaps(a.box, b.box)) problems.push(`frame ${f.frame}: ${a.name} crosses ${b.name}`);
      for (const c of CAST_BOXES) if (a.element !== c.name.replace(" body", "") && overlaps(a.box, c.box)) problems.push(`frame ${f.frame}: ${a.name} crosses ${c.name}`);
    }
    for (const stamp of checked.filter((i) => STAMPS.has(i.element) && i.round)) {
      for (const file of f.state.files.filter((x) => !x.inFlight)) {
        file.rows.forEach((row, k) => {
          if (row !== "flagged") return;
          const mark = rowMark(FILE_SLOTS[file.id], k + 1), reach = ROW_MARK_RADIUS + (tokens.outline.small / 2) * FILE_SCALE;
          if (Math.hypot(mark.x - stamp.round!.cx, mark.y - stamp.round!.cy) < stamp.round!.r + reach) problems.push(`frame ${f.frame}: ${stamp.name} covers the ? of ${file.id} row ${k + 1}`);
        });
      }
    }
  }
  return problems;
};

describe("SDD files text placement", () => {
  test("Files placement at every checked frame", () => {
    expect(placementProblems(FRAMES)).toEqual([]);
    // The check sees the elements it is meant to.
    expect(itemsAt(FRAMES[400]).blocks.map((b) => b.name).sort()).toEqual(["label-design", "label-proposal", "label-spec", "label-tasks", "no-go-1"]);
    expect(itemsAt(FRAMES[80]).blocks.map((b) => b.name)).toEqual(["folder-label"]);
    expect(itemsAt(FRAMES[800]).blocks.map((b) => b.name).sort()).toEqual(["go", "label-design", "label-proposal", "label-spec", "label-tasks"]);
    expect(itemsAt(FRAMES[400]).blocks.find((b) => b.name === "no-go-1")!.round).toBeDefined();
    // Files in flight are checked against the stage's edges (frames 96–135).
    expect(FRAMES.slice(96, 136).every((f) => inFlightAt(f).size > 0)).toBe(true);
  });

  test("Files collision rejected", () => {
    const moved = FRAMES.map((f) => ({ ...f, verdicts: moveElement(moveElement(f.verdicts, "no-go-1", 0, -74), "no-go-2", 0, -74) }));
    const problems = placementProblems(moved);
    expect(problems[0]).toMatch(/^frame 394: (label-\w+ crosses no-go-1|no-go-1 crosses label-\w+)/);
  });
});

// ---------------------------------------------------------------- layer order (design §6.2)

describe("SDD files layer order", () => {
  test("Layer order", () => {
    const order = (group: unknown) =>
      [...new Set(walk(group as never).flatMap((w) => (w.node.attrs["data-element"] === undefined ? [] : [String(w.node.attrs["data-element"])])))];
    const sortedBy = (names: string[], list: readonly string[]) => {
      for (const n of names) expect(list, n).toContain(n);
      expect(names.map((n) => list.indexOf(n))).toEqual([...names.map((n) => list.indexOf(n))].sort((a, b) => a - b));
    };
    const seen = new Set<string>();
    for (const frame of [70, 120, 400, 616, 800]) {
      const f = frameOf(frame);
      const pairs = [[f.below, BELOW_ORDER], [f.folder, FOLDER_ORDER], [f.files, FILES_ORDER], [f.cast, CAST_ORDER], [f.verdicts, VERDICTS_ORDER], [f.above, ABOVE_ORDER]] as const;
      for (const [layer, list] of pairs) {
        for (const group of layer.children) if (typeof group !== "string") sortedBy(order(group), list);
        for (const n of order(layer)) seen.add(n);
      }
    }
    for (const n of [...BELOW_ORDER, ...FOLDER_ORDER, ...FILES_ORDER, ...CAST_ORDER, ...VERDICTS_ORDER, ...ABOVE_ORDER]) {
      if (n === "no-go-2") continue; // drawn 515–569 only; seen below
      expect(seen.has(n), n).toBe(true);
    }
    expect(order(frameOf(530).verdicts)).toEqual(["no-go-2"]);
  });
});

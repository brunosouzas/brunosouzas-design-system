// The Idempotent Receiver book scene's layout, text size and placement (spec
// scene-catalogue, "Idempotent Receiver book layout", "Idempotent Receiver
// book text size", "Idempotent Receiver book text placement"; change
// idempotent-receiver-book-scene, task 3.3). Text is measured with harfbuzzjs
// on the package's `fonts/` faces (test/scenes/text-measure.ts); geometry is
// read from the stage trees (test/scenes/book-tree.ts).
import { describe, expect, test } from "vitest";
import { BOOK_TEXT, ICON_ARROW_Y, LANE, TOKEN } from "../../src/scenes/eip-book";
import { AT, BADGE, CHANNEL, CHECK, GUIDES, LOOKUP, QUESTION, RECEIVER, REWIND_MARK, RINGS_CENTRE, ROUTES, SENDER, STAGE, STORE } from "../../src/scenes/idempotent-receiver-book/layout";
import { ABOVE_ORDER, BELOW_ORDER, NODES_ORDER, TOKENS_ORDER } from "../../src/scenes/idempotent-receiver-book/stage";
import type { Box } from "./text-measure";
import { blocksAt, exemptAt, frameOf, moveElement, resizeText, textsAt, type Frame } from "./book-tree";
import { walk } from "./topology-tree";

const FRAMES: Frame[] = Array.from({ length: 900 }, (_, f) => frameOf(f));
const MARGIN = 12;
const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

describe("Idempotent Receiver book layout", () => {
  test("Layout equals the design", () => {
    // design §6.1
    expect(STAGE).toEqual({ width: 960, height: 540 });
    expect(LANE).toBe(212);
    expect(BOOK_TEXT).toEqual({ word: 33, strong: 36 });
    expect(TOKEN).toEqual({ height: 56, minWidth: 84, perCharacter: 19, padding: 44 });
    expect(ICON_ARROW_Y).toEqual({ "idempotent-receiver": 23 });
    expect(SENDER).toEqual({ x: 16, y: 180, width: 150, height: 64 });
    expect(CHANNEL).toEqual({ x: 196, width: 180, height: 96 });
    // Centred on the channel's token rest (design §6.1).
    expect(CHANNEL.x + CHANNEL.width / 2).toBe(AT.channel.x);
    expect(RECEIVER).toEqual({ x: 520, scale: 3.4 });
    expect(STORE).toEqual({ x: 560, y: 366, width: 160, height: 128 });
    expect(LOOKUP).toEqual({ from: [640, 274], to: [640, 362], rest: 2.5, active: 4 });
    expect(AT).toEqual({ sender: { x: 212, y: 212 }, channel: { x: 286, y: 212 }, door: { x: 488, y: 212 }, processed: { x: 852, y: 212 }, ghost: { x: 852, y: 320 }, ignored: { x: 300, y: 428 } });
    expect(CHECK).toEqual({ cx: 902, cy: 178, r: 22 });
    expect(QUESTION).toEqual({ cx: 700, cy: 318, scale: 2 });
    expect(BADGE).toEqual({ cx: 912, cy: 52 });
    expect(REWIND_MARK).toEqual({ x: 826, y: 28, size: 48 });
    expect(RINGS_CENTRE).toEqual({ x: 960, y: 540 });
    expect(ROUTES).toEqual({
      send: "M 212,212 L 286,212",
      deliver: "M 286,212 L 488,212",
      process: "M 488,212 C 600,110 760,140 852,212",
      ignore: "M 488,212 C 470,330 380,428 300,428",
    });
    expect(GUIDES).toEqual({ p1: "M 166,212 L 520,212", p2: ROUTES.process, p3: ROUTES.ignore });
  });
});

// ---------------------------------------------------------------- size

/** Every size problem: a settled word below its minimum, naming it, its size and its first frame. The `?` is a symbol, exempt. */
const sizeProblems = (frames: readonly Frame[]): string[] => {
  const problems = new Map<string, string>();
  for (const f of frames) {
    const exempt = exemptAt(f);
    for (const t of textsAt(f)) {
      if (t.text === "?" || exempt.has(t.element)) continue;
      const min = t.text === "Sender" ? BOOK_TEXT.word : BOOK_TEXT.strong;
      if (t.size < min - 1e-9) {
        const key = `${t.element} "${t.text}"`;
        if (!problems.has(key)) problems.set(key, `${key} at ${Math.round(t.size * 100) / 100} (minimum ${min}), first drawn at frame ${f.frame}`);
      }
    }
  }
  return [...problems.values()];
};

describe("Idempotent Receiver book text size", () => {
  test("Every settled word at its minimum", () => {
    expect(sizeProblems(FRAMES)).toEqual([]);
    const at = (frame: number, word: string, element: string) => textsAt(FRAMES[frame]).find((t) => t.text === word && t.element === element)!.size;
    expect(at(800, "Sender", "sender")).toBe(33);
    expect(at(800, "42", "message")).toBe(36);
    expect(at(800, "42", "stored")).toBe(36);
    expect(at(800, "2", "badge")).toBe(36);
  });

  test("Too small rejected", () => {
    const small = FRAMES.map((f) => ({ ...f, nodes: resizeText(f.nodes, "sender", 32) }));
    expect(sizeProblems(small)).toEqual(['sender "Sender" at 32 (minimum 33), first drawn at frame 31']);
    const badge = FRAMES.map((f) => ({ ...f, above: resizeText(f.above, "badge", 35) }));
    expect(sizeProblems(badge)).toEqual(['badge "1" at 35 (minimum 36), first drawn at frame 39', 'badge "2" at 35 (minimum 36), first drawn at frame 370']);
  });
});

// ---------------------------------------------------------------- placement

const fmt = (b: Box) => [b.x0, b.y0, b.x1, b.y1].map((v) => Math.round(v * 10) / 10).join(", ");
/** Every placement problem of design §6.3: a settled word or block outside the stage less 12, or two of different elements crossing. */
const placementProblems = (frames: readonly Frame[]): string[] => {
  const problems: string[] = [];
  for (const f of frames) {
    const exempt = exemptAt(f);
    const checked = [
      ...blocksAt(f).filter((b) => !exempt.has(b.name)).map((b) => ({ ...b, element: b.name })),
      ...textsAt(f).filter((t) => !exempt.has(t.element)).map((t) => ({ name: `${t.element} "${t.text}"`, box: t.box, element: t.element })),
    ];
    for (const item of checked) {
      const b = item.box;
      if (b.x0 < MARGIN || b.y0 < MARGIN || b.x1 > STAGE.width - MARGIN || b.y1 > STAGE.height - MARGIN) problems.push(`frame ${f.frame}: ${item.name} leaves the stage less ${MARGIN} (${fmt(b)})`);
    }
    for (const [i, a] of checked.entries()) {
      for (const b of checked.slice(i + 1)) if (a.element !== b.element && overlaps(a.box, b.box)) problems.push(`frame ${f.frame}: ${a.name} crosses ${b.name}`);
    }
  }
  return problems;
};

describe("Idempotent Receiver book text placement", () => {
  test("Placement at every checked frame", () => {
    expect(placementProblems(FRAMES)).toEqual([]);
    // The check sees what it is meant to at the final still: the sender's word, four 42s (processed, faded, ignored, stored) and the badge.
    const words = textsAt(FRAMES[800]).filter((t) => t.text !== "?").map((t) => `${t.element}:${t.text}`).sort();
    expect(words).toEqual(["badge:2", "copy:42", "ghost:42", "message:42", "sender:Sender", "stored:42"]);
  });

  test("Collision rejected", () => {
    const moved = FRAMES.map((f) => ({ ...f, tokens: moveElement(f.tokens, "ghost", 300 - 852, 428 - 320) }));
    expect(placementProblems(moved)[0]).toBe('frame 750: ghost "42" crosses copy "42"');
  });
});

// ---------------------------------------------------------------- layer order (design §6.2, SCN-6)

describe("Idempotent Receiver book layer order", () => {
  test("Layer order", () => {
    const order = (group: unknown) =>
      [...new Set(walk(group as never).flatMap((w) => (w.node.attrs["data-element"] === undefined ? [] : [String(w.node.attrs["data-element"])])))];
    const sortedBy = (names: string[], list: readonly string[]) =>
      expect(names.map((n) => list.indexOf(n))).toEqual([...names.map((n) => list.indexOf(n))].sort((a, b) => a - b));
    const seen = new Set<string>();
    for (const frame of [140, 350, 700, 800]) {
      const f = frameOf(frame);
      for (const [layer, list] of [[f.below, BELOW_ORDER], [f.nodes, NODES_ORDER], [f.tokens, TOKENS_ORDER], [f.above, ABOVE_ORDER]] as const) {
        for (const group of layer.children) if (typeof group !== "string") sortedBy(order(group), list);
        for (const n of order(layer)) seen.add(n);
      }
    }
    for (const n of [...BELOW_ORDER, ...NODES_ORDER, ...TOKENS_ORDER, ...ABOVE_ORDER]) expect(seen.has(n), n).toBe(true);
  });
});

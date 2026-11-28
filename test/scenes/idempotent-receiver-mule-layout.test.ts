// The Idempotent Receiver Mule scene's layout, text size and placement (spec
// scene-catalogue, "Idempotent Receiver Mule layout", "Idempotent Receiver
// Mule text size", "Idempotent Receiver Mule text placement"; change
// idempotent-receiver-mule-scene, task 3.3). Text is measured with harfbuzzjs
// on the package's `fonts/` faces (test/scenes/text-measure.ts); geometry is
// read from the stage trees (test/scenes/mule-tree.ts).
import { describe, expect, test } from "vitest";
import { ABOVE_GAP, MULE_TEXT } from "../../src/scenes/eip-mule";
import {
  AT, BADGE, CHARGE, CLIENT, COUNT, EMOTE, GHOST_COUNT, GUIDES, LISTENER, LOOKUP, QUESTION, REWIND_MARK, RINGS_CENTRE, ROUTES, STAGE, STATEMENT, STORE, VALIDATOR,
} from "../../src/scenes/idempotent-receiver-mule/layout";
import { ABOVE_ORDER, BELOW_ORDER, CAST_ORDER, NODES_ORDER, STAGE_LAYERS, TOKENS_ORDER } from "../../src/scenes/idempotent-receiver-mule/stage";
import { text } from "../../src/scenes/idempotent-receiver-mule/scene.ts";
import type { Box } from "./text-measure";
import { blocksAt, exemptAt, frameOf, moveElement, resizeText, textsAt, type Frame } from "./mule-tree";
import { walk } from "./topology-tree";

const FRAMES: Frame[] = Array.from({ length: 1350 }, (_, f) => frameOf(f));
const MARGIN = 12;
const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

describe("Idempotent Receiver Mule layout", () => {
  test("Layout equals the design", () => {
    // design §6.1
    expect(STAGE).toEqual({ width: 960, height: 540 });
    expect(MULE_TEXT).toEqual({ word: 33, strong: 36 });
    expect(ABOVE_GAP).toBe(36);
    expect(CLIENT).toEqual({ x: 112, ground: 336, scale: 0.8 });
    expect(LISTENER).toEqual({ x: 215, y: 150, width: 160, height: 112 });
    expect(VALIDATOR).toEqual({ x: 415, y: 132, width: 236, height: 148 });
    expect(CHARGE).toEqual({ x: 691, y: 150, width: 176, height: 112 });
    expect(STORE).toEqual({ x: 433, y: 374, width: 200, height: 122 });
    expect(LOOKUP).toEqual({ from: [533, 284], to: [533, 370], rest: 2.5, active: 4 });
    expect(STATEMENT).toEqual({ x: 725, y: 314, width: 108, height: 190, top: 52, step: 44, bar: 52 });
    expect(COUNT).toEqual({ cx: 833, cy: 314 });
    expect(GHOST_COUNT).toEqual({ cx: 903, cy: 314 });
    expect(AT).toEqual({ client: { x: 112, y: 140 }, listener: { x: 295, y: 114 }, validator: { x: 533, y: 96 }, charge: { x: 779, y: 114 } });
    expect(QUESTION).toEqual({ cx: 593, cy: 327, scale: 2 });
    expect(EMOTE).toEqual({ x: 34, y: 214, scale: 0.75 });
    expect(BADGE).toEqual({ cx: 912, cy: 52 });
    expect(REWIND_MARK).toEqual({ x: 826, y: 28, size: 48 });
    expect(RINGS_CENTRE).toEqual({ x: 960, y: 540 });
    expect(ROUTES).toEqual({
      send: "M 112,140 C 190,140 220,114 295,114",
      pass: "M 295,114 C 380,114 450,96 533,96",
      charge: "M 533,96 C 620,96 700,114 779,114",
      reply: "M 779,114 C 779,44 230,40 112,140",
      retrySend: "M 112,140 C 190,140 220,114 295,114",
      retryPass: "M 295,114 C 380,114 450,96 533,96",
      dupReply: "M 533,96 C 533,40 230,40 112,140",
    });
    expect(GUIDES).toEqual({
      p1: "M 112,140 C 190,140 220,114 295,114 C 380,114 450,96 533,96 C 620,96 700,114 779,114",
      p2: ROUTES.reply,
      p3: "M 112,140 C 190,140 220,114 295,114 C 380,114 450,96 533,96",
      p4: ROUTES.dupReply,
    });
  });
});

// ---------------------------------------------------------------- size

const WORDS = new Set<string>([...text.en.listener, ...text.en.validator, ...text.en.charge]);
/** Every size problem: a settled word below its minimum, naming it, its size and its first frame. The `?` is a symbol, exempt. */
const sizeProblems = (frames: readonly Frame[]): string[] => {
  const problems = new Map<string, string>();
  for (const f of frames) {
    const exempt = exemptAt(f);
    for (const t of textsAt(f)) {
      if (t.text === "?" || exempt.has(t.element)) continue;
      const min = WORDS.has(t.text) ? MULE_TEXT.word : MULE_TEXT.strong;
      if (t.size < min - 1e-9) {
        const key = `${t.element} "${t.text}"`;
        if (!problems.has(key)) problems.set(key, `${key} at ${Math.round(t.size * 100) / 100} (minimum ${min}), first drawn at frame ${f.frame}`);
      }
    }
  }
  return [...problems.values()];
};

describe("Idempotent Receiver Mule text size", () => {
  test("Every settled word at its minimum", () => {
    expect(sizeProblems(FRAMES)).toEqual([]);
    const at = (frame: number, word: string, element: string) => textsAt(FRAMES[frame]).find((t) => t.text === word && t.element === element)!.size;
    expect(at(1250, "Listener", "listener")).toBe(33);
    expect(at(1250, "Validator", "validator")).toBe(33);
    expect(at(1250, "charge", "charge")).toBe(33);
    expect(at(1250, "orderId", "stored")).toBe(36);
    expect(at(1250, "409", "duplicate")).toBe(36);
    expect(at(1250, "0", "count")).toBe(36);
    expect(at(1250, "1", "ghost")).toBe(36);
    expect(at(1250, "2", "badge")).toBe(36);
  });

  test("Too small rejected", () => {
    const small = FRAMES.map((f) => ({ ...f, nodes: resizeText(f.nodes, "validator", 32) }));
    expect(sizeProblems(small)).toEqual([
      'validator "Idempotent" at 32 (minimum 33), first drawn at frame 33',
      'validator "Message" at 32 (minimum 33), first drawn at frame 33',
      'validator "Validator" at 32 (minimum 33), first drawn at frame 33',
    ]);
    const code = FRAMES.map((f) => ({ ...f, tokens: resizeText(f.tokens, "duplicate", 35) }));
    expect(sizeProblems(code)).toEqual(['duplicate "409" at 35 (minimum 36), first drawn at frame 530']);
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

describe("Idempotent Receiver Mule text placement", () => {
  test("Placement at every checked frame", () => {
    expect(placementProblems(FRAMES)).toEqual([]);
    // The check sees what it is meant to at the final still: the seven component words, the stored ID, the 409, both counts and the badge.
    const words = textsAt(FRAMES[1250]).map((t) => `${t.element}:${t.text}`).sort();
    expect(words).toEqual([
      "badge:2", "charge:Simulated", "charge:charge", "count:0", "duplicate:409", "ghost:1", "listener:HTTP", "listener:Listener",
      "stored:orderId", "validator:Idempotent", "validator:Message", "validator:Validator",
    ]);
  });

  test("Collision rejected", () => {
    const moved = FRAMES.map((f) => ({ ...f, tokens: moveElement(f.tokens, "ghost", COUNT.cx - GHOST_COUNT.cx, 0) }));
    expect(placementProblems(moved)[0]).toBe('frame 1190: count "0" crosses ghost "1"');
  });
});

// ---------------------------------------------------------------- layer order (design §6.2, SCN-6)

describe("Idempotent Receiver Mule layer order", () => {
  test("Layer order", () => {
    const order = (group: unknown) =>
      [...new Set(walk(group as never).flatMap((w) => (w.node.attrs["data-element"] === undefined ? [] : [String(w.node.attrs["data-element"])])))];
    const sortedBy = (names: string[], list: readonly string[]) => {
      // Every element drawn in a layer belongs to that layer, then in the layer's order.
      for (const n of names) expect(list, n).toContain(n);
      expect(names.map((n) => list.indexOf(n))).toEqual([...names.map((n) => list.indexOf(n))].sort((a, b) => a - b));
    };
    // Scene.tsx draws the layers in this order, bottom to top.
    expect(STAGE_LAYERS).toEqual(["below", "nodes", "cast", "tokens", "above"]);
    const seen = new Set<string>();
    for (const frame of [150, 270, 470, 640, 900, 1250]) {
      const f = FRAMES[frame];
      for (const [layer, list] of [[f.below, BELOW_ORDER], [f.nodes, NODES_ORDER], [f.cast, CAST_ORDER], [f.tokens, TOKENS_ORDER], [f.above, ABOVE_ORDER]] as const) {
        for (const group of layer.children) if (typeof group !== "string") sortedBy(order(group), list);
        for (const n of order(layer)) seen.add(n);
      }
    }
    for (const n of [...BELOW_ORDER, ...NODES_ORDER, ...CAST_ORDER, ...TOKENS_ORDER, ...ABOVE_ORDER]) expect(seen.has(n), n).toBe(true);
  });
});

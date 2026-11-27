// The Idempotent Receiver book scene's words and files (spec scene-catalogue,
// "Idempotent Receiver book words on screen", "Idempotent Receiver book built
// from package pieces"; change idempotent-receiver-book-scene, task 3.4).
// Words are read from the stage trees of every frame (test/scenes/book-tree.ts);
// the colour-literal rule is the existing test/brand/no-colour-literals.test.ts
// over src/scenes/ and src/brand/.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import type { SvgNode } from "../../src/pieces/node.ts";
import { text } from "../../src/scenes/idempotent-receiver-book/scene.ts";
import { frameOf, textsAt, type Frame } from "./book-tree";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const SCENE_DIR = join(repoRoot, "src/scenes/idempotent-receiver-book");
const FRAMES: Frame[] = Array.from({ length: 900 }, (_, f) => frameOf(f));

const flatten = (value: unknown): string[] => (typeof value === "string" ? [value] : Array.isArray(value) ? value.flatMap(flatten) : Object.values(value as object).flatMap(flatten));
const ALLOWED = new Set(flatten(text.en));

/** Every drawn string outside `text.en`, naming it and its first frame; and the table values never drawn. */
const wordProblems = (frames: readonly Frame[]): string[] => {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const f of frames) for (const t of textsAt(f)) {
    if (!ALLOWED.has(t.text) && !seen.has(t.text)) problems.push(`"${t.text}" is not in text.en, first drawn at frame ${f.frame}`);
    seen.add(t.text);
  }
  for (const word of ALLOWED) if (!seen.has(word)) problems.push(`"${word}" of text.en is never drawn`);
  return problems;
};

/** A layer with every text child equal to `from` replaced by `to`: a fixture. */
const replaceWord = (node: SvgNode, from: string, to: string): SvgNode => ({
  ...node,
  children: node.children.map((c) => (typeof c === "string" ? (c === from ? to : c) : replaceWord(c, from, to))),
});

describe("Idempotent Receiver book words on screen", () => {
  test("Words over the whole composition", () => {
    expect(wordProblems(FRAMES)).toEqual([]);
    expect([...ALLOWED].sort()).toEqual(["1", "2", "42", "?", "Sender"]);
  });

  test("Unlisted word rejected", () => {
    const frames = FRAMES.map((f) => (f.frame === 200 ? { ...f, nodes: replaceWord(f.nodes, "Sender", "Remetente") } : f));
    expect(wordProblems(frames)).toEqual(['"Remetente" is not in text.en, first drawn at frame 200']);
  });
});

describe("Idempotent Receiver book built from package pieces", () => {
  test("No shape of its own", () => {
    const files = readdirSync(SCENE_DIR);
    expect(files.sort()).toEqual(["Scene.tsx", "frame.ts", "layout.ts", "scene.ts", "stage.ts", "timeline.ts"]);
    for (const path of [...files.map((file) => join(SCENE_DIR, file)), join(repoRoot, "src/scenes/eip-book.ts")]) {
      const source = readFileSync(path, "utf8");
      expect(source, path).not.toMatch(/\bel\(\s*["'](path|rect|circle|ellipse|line|polygon|polyline)["']/);
      expect(source, path).not.toMatch(/<(path|rect|circle|ellipse|line|polygon|polyline)\b/);
    }
  });
});

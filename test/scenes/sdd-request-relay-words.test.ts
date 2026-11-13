// The SDD relay scene's words and files (spec scene-catalogue, "SDD relay
// words on screen", "SDD relay built from package pieces"; change
// sdd-scene-1-relay, task 4.5). Words are read from the stage trees of every
// frame (test/scenes/relay-tree.ts); the colour-literal rule is the existing
// test/brand/no-colour-literals.test.ts over src/scenes/ and src/brand/.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import type { SvgNode } from "../../src/pieces/node.ts";
import { text } from "../../src/scenes/sdd-request-relay/scene.ts";
import { frameOf, textsAt, type Frame } from "./relay-tree";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const SCENE_DIR = join(repoRoot, "src/scenes/sdd-request-relay");
const FRAMES: Frame[] = Array.from({ length: 1080 }, (_, f) => frameOf(f));

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

describe("SDD relay words on screen", () => {
  test("Words over the whole composition", () => {
    expect(wordProblems(FRAMES)).toEqual([]);
    expect([...ALLOWED].sort()).toEqual(["1", "2", "?", "GO", "proposal.md"]);
  });

  test("Unlisted word rejected", () => {
    const frames = FRAMES.map((f) => (f.frame === 700 ? { ...f, sheet: replaceWord(f.sheet, "proposal.md", "spec") } : f));
    expect(wordProblems(frames)).toEqual(['"spec" is not in text.en, first drawn at frame 700']);
  });
});

describe("SDD relay built from package pieces", () => {
  test("No shape of its own", () => {
    const files = readdirSync(SCENE_DIR);
    expect(files.sort()).toEqual(["Scene.tsx", "frame.ts", "layout.ts", "scene.ts", "stage.ts", "timeline.ts"]);
    for (const file of files) {
      const source = readFileSync(join(SCENE_DIR, file), "utf8");
      expect(source, file).not.toMatch(/\bel\(\s*["'](path|rect|circle|ellipse|line|polygon|polyline)["']/);
      expect(source, file).not.toMatch(/<(path|rect|circle|ellipse|line|polygon|polyline)\b/);
    }
  });
});

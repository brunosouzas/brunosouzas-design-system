// The SDD files scene's words and files (spec scene-catalogue, "SDD files
// words on screen", "SDD files built from package pieces"; change
// sdd-scene-2-files, task 4.5). Words are read from the stage trees of every
// frame (test/scenes/files-tree.ts); the colour-literal rule is the existing
// test/brand/no-colour-literals.test.ts over src/scenes/ and src/brand/.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { tokens } from "../../tokens/generated/tokens";
import { withSansFamily } from "../../src/brand/svg-fonts";
import type { SvgNode } from "../../src/pieces/node.ts";
import { STAGE_LAYERS } from "../../src/scenes/sdd-scene-2-files/stage";
import { text } from "../../src/scenes/sdd-scene-2-files/scene.ts";
import { FRAMES, textsAt, type Frame } from "./files-tree";
import { textsOf } from "./topology-tree";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const SCENE_DIR = join(repoRoot, "src/scenes/sdd-scene-2-files");

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

describe("SDD files words on screen", () => {
  test("Files words over the whole composition", () => {
    expect(wordProblems(FRAMES)).toEqual([]);
    expect([...ALLOWED].sort()).toEqual(["?", "GO", "NO-GO", "design.md", "openspec/", "proposal.md", "spec.md", "tasks.md"]);
  });

  test("Files words in the loaded face", () => {
    const families = (node: SvgNode): string[] => [
      ...(node.attrs["font-family"] === undefined ? [] : [String(node.attrs["font-family"])]),
      ...node.children.flatMap((c) => (typeof c === "string" ? [] : families(c))),
    ];
    let layers = 0;
    for (const frame of [85, 400, 869]) for (const name of STAGE_LAYERS) {
      const layer = FRAMES[frame][name];
      if (textsOf(layer).length === 0) continue;
      layers++;
      expect(families(layer), `${name} at ${frame}`).toContain(tokens.font.sans);
      expect(families(withSansFamily(layer, "Loaded Sans, sans-serif")), `${name} at ${frame}`).not.toContain(tokens.font.sans);
    }
    // 85: the folder; 400 and 869: the files and the verdicts.
    expect(layers).toBe(5);
  });

  test("Files unlisted word rejected", () => {
    const frames = FRAMES.map((f) => (f.frame === 700 ? { ...f, files: replaceWord(f.files, "spec.md", "spec") } : f));
    expect(wordProblems(frames)).toEqual(['"spec" is not in text.en, first drawn at frame 700']);
  });
});

describe("SDD files built from package pieces", () => {
  test("Files scene has no shape of its own", () => {
    const files = readdirSync(SCENE_DIR);
    expect(files.sort()).toEqual(["Scene.tsx", "frame.ts", "layout.ts", "scene.ts", "stage.ts", "timeline.ts"]);
    for (const file of files) {
      const source = readFileSync(join(SCENE_DIR, file), "utf8");
      expect(source, file).not.toMatch(/\bel\(\s*["'](path|rect|circle|ellipse|line|polygon|polyline)["']/);
      expect(source, file).not.toMatch(/<(path|rect|circle|ellipse|line|polygon|polyline)\b/);
    }
    // The pieces and components it draws through (spec "SDD files built from package pieces").
    const stage = readFileSync(join(SCENE_DIR, "stage.ts"), "utf8");
    const pieces = /import \{([^}]*)\} from "\.\.\/\.\.\/pieces\/library\.ts";/.exec(stage)![1].split(",").map((s) => s.trim()).filter(Boolean).sort();
    expect(pieces).toEqual(["balao", "chaves", "codePanel", "diagramBox", "emote", "folder", "keyboard", "sheet", "stamp", "visor"]);
    expect(stage).toContain('import { pose } from "../../pieces/pose.ts";');
    const scene = readFileSync(join(SCENE_DIR, "Scene.tsx"), "utf8");
    expect(scene).toContain('import { MotionPath, Rings } from "../../brand/components";');
  });
});

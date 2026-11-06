// Components take colours only from the tokens (spec motion-components; tasks
// 3.2): no `#` with three or six hex digits, `rgb(` or `hsl(` in src/brand/ or
// src/scenes/. `transparent` and `none` are allowed.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const COLOUR_LITERAL = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-zA-Z_])|\b(?:rgba?|hsla?)\(/g;

/** Every colour literal under `folder`, as "file:line: literal" relative to the repository. */
const colourLiterals = (folder: string): string[] => {
  const found: string[] = [];
  const visit = (path: string) => {
    if (statSync(path).isDirectory()) {
      for (const name of readdirSync(path).sort()) visit(join(path, name));
      return;
    }
    if (!/\.(ts|tsx)$/.test(path)) return;
    readFileSync(path, "utf8")
      .split("\n")
      .forEach((line, index) => {
        for (const match of line.matchAll(COLOUR_LITERAL)) found.push(`${relative(repoRoot, path)}:${index + 1}: ${match[0]}`);
      });
  };
  visit(join(repoRoot, folder));
  return found;
};

const TOP_LEVEL_STATE = /\bcolor\.(healthy|blocked|transitional|caller|backend|failure|failFast)\b/g;
/** Every read of a top-level state colour under `folder`, as "file:line: path". */
const topLevelStateColours = (folder: string): string[] => {
  const found: string[] = [];
  const visit = (path: string) => {
    if (statSync(path).isDirectory()) {
      for (const name of readdirSync(path).sort()) visit(join(path, name));
      return;
    }
    if (!/\.(ts|tsx)$/.test(path)) return;
    readFileSync(path, "utf8")
      .split("\n")
      .forEach((line, index) => {
        for (const match of line.matchAll(TOP_LEVEL_STATE)) found.push(`${relative(repoRoot, path)}:${index + 1}: ${match[0]}`);
      });
  };
  visit(join(repoRoot, folder));
  return found;
};

describe("Components take values only from the tokens", () => {
  test("Colour literal in a component", () => {
    expect(colourLiterals("test/fixtures/colour-literals")).toEqual([
      "test/fixtures/colour-literals/HexBlock.ts:4: #FF8A3D",
      "test/fixtures/colour-literals/RgbBlock.ts:5: rgb(",
    ]);
  });

  test("Real sources are clean", () => {
    expect(colourLiterals("src/brand")).toEqual([]);
    expect(colourLiterals("src/scenes")).toEqual([]);
    // No file reads a removed top-level state colour instead of color.state.* (change identity-v2-type-pieces-cleanup).
    expect([...topLevelStateColours("src/brand"), ...topLevelStateColours("src/scenes")]).toEqual([]);
  });

  // Spec illustration-pieces, "Colours only from tokens" (change illustration-pieces, tasks 2.4).
  test("Source without literals", () => {
    expect(colourLiterals("src/pieces")).toEqual([]);
  });

  // Spec illustration-pieces, "Pure pieces": piece modules read nothing (no node: imports).
  test("No file access in piece modules", () => {
    const offenders = readdirSync(join(repoRoot, "src/pieces"))
      .filter((name) => /\.(ts|tsx)$/.test(name))
      .filter((name) => /from\s+["']node:/.test(readFileSync(join(repoRoot, "src/pieces", name), "utf8")));
    expect(offenders).toEqual([]);
  });

  // Spec illustration-pieces, "Fonts entry point" (change identity-v2-type-pieces-cleanup, task 1.3):
  // the embedding reads files and loads WebAssembly, so only the subpath ./fonts exports it.
  test("Root entry stays pure", async () => {
    const offenders = readdirSync(join(repoRoot, "src/pieces"))
      .filter((name) => /\.(ts|tsx)$/.test(name))
      .filter((name) => /from\s+["'](node:|\.\.\/fonts\/)/.test(readFileSync(join(repoRoot, "src/pieces", name), "utf8")));
    expect(offenders).toEqual([]);
    const root = await import("../../src/pieces/index");
    expect("embedFonts" in root).toBe(false);
  });
});

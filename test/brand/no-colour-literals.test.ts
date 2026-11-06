// Components take colours only from the tokens (spec motion-components; tasks
// 3.2): no `#` with three or six hex digits, `rgb(` or `hsl(` in src/brand/ or
// src/scenes/. `transparent` and `none` are allowed.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const COLOUR_LITERAL = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-zA-Z_])|\b(?:rgba?|hsla?)\(/g;

/** An import of a `node:` module or of `../fonts/`, in any form: `from`, side-effect, dynamic `import()` or `require()`. */
const UNSAFE_IMPORT = /(?:from\s+|import\s*\(?\s*|require\(\s*)["'](?:node:|\.\.\/fonts\/)/;
/** Relative specifiers a module imports or re-exports, in any form. */
const relativeImports = (source: string): string[] =>
  [...source.matchAll(/(?:\bfrom\s+|\bimport\s*\(?\s*|\brequire\(\s*)["'](\.{1,2}\/[^"']+)["']/g)].map((m) => m[1]);
/** The source file a relative specifier names (`.js` written for `.ts`, or no extension). */
const resolveSource = (from: string, specifier: string): string => {
  const base = join(dirname(from), specifier);
  const candidates = [base, base.replace(/\.js$/, ".ts"), base.replace(/\.js$/, ".tsx"), `${base}.ts`, `${base}.tsx`, join(base, "index.ts")];
  const found = candidates.find((path) => existsSync(path) && statSync(path).isFile());
  if (found === undefined) throw new Error(`cannot resolve ${specifier} from ${relative(repoRoot, from)}`);
  return found;
};
/** The source of package.json `exports["."]` (its `import`, from dist/ back to the .ts in the repository). */
const rootEntry = (): string => {
  const manifest = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as { exports: { ".": { import: string } } };
  return join(repoRoot, manifest.exports["."].import.replace(/^\.\/dist\//, "").replace(/\.js$/, ".ts"));
};
/** Every module reachable from `entry` through relative imports, the entry included. */
const reachable = (entry: string): string[] => {
  const seen = new Set<string>();
  const visit = (path: string) => {
    if (seen.has(path)) return;
    seen.add(path);
    for (const specifier of relativeImports(readFileSync(path, "utf8"))) visit(resolveSource(path, specifier));
  };
  visit(entry);
  return [...seen].sort();
};

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
  // Every import form counts (static, side-effect, dynamic, require), in every
  // piece module and in every module the root entry reaches by relative imports.
  test("Root entry stays pure", async () => {
    for (const line of ['import "node:fs";', 'await import("node:fs")', 'import ( "../fonts/embed.ts" )', 'require("node:path")', 'require( "../fonts/x")', 'export * from "../fonts/embed.ts"']) {
      expect(UNSAFE_IMPORT.test(line), line).toBe(true);
    }
    expect(UNSAFE_IMPORT.test('import { el } from "./node.ts"')).toBe(false);
    const pieceModules = readdirSync(join(repoRoot, "src/pieces"))
      .filter((name) => /\.(ts|tsx)$/.test(name))
      .map((name) => join(repoRoot, "src/pieces", name));
    const reached = reachable(rootEntry());
    expect(reached.map((path) => relative(repoRoot, path))).toContain("src/pieces/library.ts");
    expect(reached.map((path) => relative(repoRoot, path))).toContain("tokens/generated/tokens.ts");
    const offenders = [...new Set([...pieceModules, ...reached])]
      .filter((path) => UNSAFE_IMPORT.test(readFileSync(path, "utf8")) || path.startsWith(join(repoRoot, "src/fonts")))
      .map((path) => relative(repoRoot, path));
    expect(offenders).toEqual([]);
    // The walk would see it: the fonts module itself is not pure.
    expect(UNSAFE_IMPORT.test(readFileSync(join(repoRoot, "src/fonts/embed.ts"), "utf8"))).toBe(true);
    const root = await import("../../src/pieces/index");
    expect("embedFonts" in root).toBe(false);
  });
});

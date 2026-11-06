// Spec motion-components, "Scene fonts" (change identity-v2-type-pieces-cleanup,
// task 6.1; ADR 0008). The font module fetches from Google Fonts when imported,
// so this test reads its source text and never imports it; the scan for Lato
// walks every file under src/. Each test title is the scenario it proves.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const source = readFileSync(join(repoRoot, "src/brand/fonts.ts"), "utf8");

/** Every file under `folder`, relative to the repository. */
const filesUnder = (folder: string): string[] =>
  readdirSync(join(repoRoot, folder))
    .sort()
    .flatMap((name) => {
      const path = join(folder, name);
      return statSync(join(repoRoot, path)).isDirectory() ? filesUnder(path) : [path];
    });

describe("Scene fonts", () => {
  test("Source families loaded", () => {
    // Each loader's import, then its weights, in the call bound to that import's name.
    const sans = /import \{ loadFont as (\w+) \} from "@remotion\/google-fonts\/SourceSans3";/.exec(source)?.[1];
    const mono = /import \{ loadFont as (\w+) \} from "@remotion\/google-fonts\/SourceCodePro";/.exec(source)?.[1];
    expect(sans).toBeDefined();
    expect(mono).toBeDefined();
    expect(source).toMatch(new RegExp(`= ${sans}\\("normal", \\{ weights: \\["400", "700", "900"\\]`));
    expect(source).toMatch(new RegExp(`= ${mono}\\("normal", \\{ weights: \\["400", "700"\\]`));
    expect(source).toMatch(/export const sans = `\$\{\w+\.fontFamily\}, \$\{tokens\.font\.sans\}`;/);
    expect(source).toMatch(/export const mono = `\$\{\w+\.fontFamily\}, \$\{tokens\.font\.mono\}`;/);
  });

  test("No Lato left", () => {
    const found = filesUnder("src").filter((path) => /google-fonts\/Lato|\bLato\b/.test(readFileSync(join(repoRoot, path), "utf8")));
    expect(found.map((path) => relative(".", path))).toEqual([]);
    // The scan sees the font module itself, and would see a stray mention.
    expect(filesUnder("src")).toContain(join("src", "brand", "fonts.ts"));
    expect(/\bLato\b/.test('import { loadFont } from "@remotion/google-fonts/Lato";')).toBe(true);
  });
});

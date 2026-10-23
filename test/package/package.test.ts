// The published package, as a consumer gets it (AB#155): packs the built
// package, installs the tarball into an empty project with no network, and uses
// every entry point from there. Needs `npm run build` first (CI runs it before
// the tests).
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

const ROOT = new URL("../..", import.meta.url).pathname;
const FIXTURE = join(ROOT, "test/fixtures/covers/spec-driven-development.json");
let work = "";
let files: string[] = [];

const run = (command: string, args: string[], cwd: string) => execFileSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

beforeAll(() => {
  if (!existsSync(join(ROOT, "dist/src/pieces/index.js"))) throw new Error("dist/ is missing: run npm run build before this test");
  work = mkdtempSync(join(tmpdir(), "ds-package-"));
  // --ignore-scripts: dist/ is already built; prepack would rebuild it.
  const [packed] = JSON.parse(run("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", work], ROOT)) as { filename: string; files: { path: string }[] }[];
  files = packed.files.map((file) => file.path).sort();
  const consumer = join(work, "consumer");
  run("mkdir", ["-p", consumer], work);
  writeFileSync(join(consumer, "package.json"), JSON.stringify({ name: "consumer", private: true, type: "module" }));
  run("npm", ["install", "--offline", "--no-audit", "--no-fund", "--ignore-scripts", join(work, packed.filename)], consumer);
}, 120_000);

afterAll(() => {
  if (work) rmSync(work, { recursive: true, force: true });
});

describe("Package contents", () => {
  test("Only the built code and the generated tokens ship", () => {
    expect(files).toContain("dist/src/pieces/index.js");
    expect(files).toContain("dist/src/pieces/index.d.ts");
    expect(files).toContain("dist/scripts/cover.js");
    expect(files).toContain("tokens/generated/tokens.css");
    expect(files).toContain("tokens/generated/tokens.json");
    expect(files.filter((file) => /^(src|test|scripts|openspec|docs)\//.test(file) || file.endsWith(".tsx"))).toEqual([]);
  });

  test("No runtime dependency", () => {
    const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
    expect(manifest.dependencies).toBeUndefined();
    expect(manifest.peerDependenciesMeta.react.optional).toBe(true);
  });
});

describe("Installed package", () => {
  const consumer = () => join(work, "consumer");
  const node = (code: string) => run("node", ["--input-type=module", "-e", code], consumer());

  test("Pieces and tokens import without React", () => {
    const out = node(`
      import { pill, toSvg, tokens, PIECE_NAMES } from "brunosouzas-design-system";
      import { tokens as fromTokens } from "brunosouzas-design-system/tokens";
      const svg = toSvg(pill({ x: 10, y: 10, text: "hi" }).body[0]);
      console.log(JSON.stringify({ svg, ink: tokens.color.ink, same: fromTokens === tokens || fromTokens.color.ink === tokens.color.ink, pieces: PIECE_NAMES.length }));
    `);
    const result = JSON.parse(out);
    expect(result.svg).toMatch(/^<rect /);
    expect(result.ink).toBe("#0A1033");
    expect(result.same).toBe(true);
    expect(result.pieces).toBe(26);
    expect(existsSync(join(consumer(), "node_modules/react"))).toBe(false);
  });

  test("Token files are exported", () => {
    const out = node(`
      import { createRequire } from "node:module";
      const require = createRequire(import.meta.url);
      console.log(require.resolve("brunosouzas-design-system/tokens.css") + "\\n" + require.resolve("brunosouzas-design-system/tokens.json"));
    `);
    const [css, json] = out.trim().split("\n");
    expect(readFileSync(css, "utf8")).toContain("--ds-color-ink: #0A1033;");
    expect(JSON.parse(readFileSync(json, "utf8")).color.ink).toBe("#0A1033");
  });

  test("The cover command runs as a bin", () => {
    const out = run(join(consumer(), "node_modules/.bin/brunosouzas-cover"), [FIXTURE, "--out", join(work, "cover.svg")], consumer());
    expect(out.trim()).toBe(`wrote ${join(work, "cover.svg")}`);
    expect(readFileSync(join(work, "cover.svg"), "utf8")).toBe(readFileSync(join(ROOT, "test/fixtures/covers/spec-driven-development.svg"), "utf8"));
  });
});

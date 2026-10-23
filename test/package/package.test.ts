// The published package, as a consumer gets it (AB#155): packs the built
// package, installs the tarball into an empty project with no network, and uses
// every entry point from there. Needs `npm run build` first (CI runs it before
// the tests).
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
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
  // A second consumer that has React: linked from this repository, so the test stays offline.
  const withReact = join(work, "with-react");
  mkdirSync(join(withReact, "node_modules"), { recursive: true });
  writeFileSync(join(withReact, "package.json"), JSON.stringify({ name: "with-react", private: true, type: "module" }));
  // A copy, not a link: Node resolves a linked package from its real folder, which has no React.
  cpSync(join(consumer, "node_modules/@brunosouzas/design-system"), join(withReact, "node_modules/@brunosouzas/design-system"), { recursive: true });
  for (const name of ["react", "react-dom", "@types"]) symlinkSync(join(ROOT, "node_modules", name), join(withReact, "node_modules", name));
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
    // The stylesheet must survive tree shaking in a consumer's bundle.
    expect(manifest.sideEffects).toEqual(["**/*.css"]);
    expect(manifest.peerDependenciesMeta.react.optional).toBe(true);
  });
});

describe("Installed package", () => {
  const consumer = () => join(work, "consumer");
  const node = (code: string) => run("node", ["--input-type=module", "-e", code], consumer());

  test("Pieces and tokens import without React", () => {
    const out = node(`
      import { pill, toSvg, tokens, PIECE_NAMES } from "@brunosouzas/design-system";
      import { tokens as fromTokens } from "@brunosouzas/design-system/tokens";
      const svg = toSvg(pill({ x: 10, y: 10, text: "hi" }).body[0]);
      const all = await import("@brunosouzas/design-system");
      const helpers = ["inkOf", "sticker", "words", "limits", "roomFor", "atLeast"].filter((name) => name in all);
      console.log(JSON.stringify({ svg, ink: tokens.color.ink, same: fromTokens === tokens || fromTokens.color.ink === tokens.color.ink, pieces: PIECE_NAMES.length, helpers }));
    `);
    const result = JSON.parse(out);
    // The ink helpers stay internal (change body-diagram-pieces, task 2.2).
    expect(result.helpers).toEqual([]);
    expect(result.svg).toMatch(/^<rect /);
    expect(result.ink).toBe("#0A1033");
    expect(result.same).toBe(true);
    expect(result.pieces).toBe(51);
    expect(existsSync(join(consumer(), "node_modules/react"))).toBe(false);
  });

  test("Token files are exported", () => {
    const out = node(`
      import { createRequire } from "node:module";
      const require = createRequire(import.meta.url);
      console.log(require.resolve("@brunosouzas/design-system/tokens.css") + "\\n" + require.resolve("@brunosouzas/design-system/tokens.json"));
    `);
    const [css, json] = out.trim().split("\n");
    expect(readFileSync(css, "utf8")).toContain("--ds-color-ink: #0A1033;");
    expect(JSON.parse(readFileSync(json, "utf8")).color.ink).toBe("#0A1033");
  });

  test("The React entry renders the same drawing as the SVG renderer", () => {
    const out = run("node", ["--input-type=module", "-e", `
      import { pill, g, toSvg } from "@brunosouzas/design-system";
      import { toReact } from "@brunosouzas/design-system/react";
      import { renderToStaticMarkup } from "react-dom/server";
      const tree = g({ "stroke-width": 4 }, ...pill({ x: 10, y: 10, text: "hi" }).body);
      console.log(JSON.stringify({ react: renderToStaticMarkup(toReact(tree)), svg: toSvg(tree) }));
    `], join(work, "with-react"));
    const { react, svg } = JSON.parse(out);
    expect(react).toContain('stroke-width="4"');
    expect(react.replace(/<\/rect>/g, "").replace(/\s+/g, "")).toBe(svg.replace(/\/>/g, ">").replace(/\s+/g, ""));
  });

  test("The type declarations compile in a TypeScript consumer", () => {
    const consumerDir = join(work, "with-react");
    writeFileSync(join(consumerDir, "use.ts"), [
      'import { pill, toSvg, tokens, type CoverSpec } from "@brunosouzas/design-system";',
      'import { toReact } from "@brunosouzas/design-system/react";',
      'import { tokens as t } from "@brunosouzas/design-system/tokens";',
      'const ink: "#0A1033" = tokens.color.ink;',
      'const spec: Pick<CoverSpec, "background"> = { background: "blush" };',
      'export const out = [toSvg(pill({ x: 1, y: 1, text: "a" }).body[0]), toReact, t.cover.width, ink, spec];',
    ].join("\n"));
    writeFileSync(join(consumerDir, "tsconfig.json"), JSON.stringify({ compilerOptions: { module: "nodenext", moduleResolution: "nodenext", strict: true, noEmit: true, skipLibCheck: false, types: [] }, files: ["use.ts"] }));
    const tsc = join(ROOT, "node_modules/typescript/bin/tsc");
    const result = spawnSync("node", [tsc, "-p", "."], { cwd: consumerDir, encoding: "utf8" });
    expect(result.stdout + result.stderr).toBe("");
    expect(result.status).toBe(0);
  });

  test("The cover command resolves relative paths from where npm was run", () => {
    const project = join(work, "project");
    mkdirSync(join(project, "covers"), { recursive: true });
    writeFileSync(join(project, "spec.json"), readFileSync(FIXTURE));
    // npm run / npx set INIT_CWD to the folder the person ran npm in; the bin runs from elsewhere.
    const out = execFileSync(join(consumer(), "node_modules/.bin/brunosouzas-cover"), ["spec.json", "--out", "covers/sdd.svg"], {
      cwd: consumer(),
      env: { ...process.env, INIT_CWD: project },
      encoding: "utf8",
    });
    expect(out.trim()).toBe("wrote covers/sdd.svg");
    expect(readFileSync(join(project, "covers/sdd.svg"), "utf8")).toBe(readFileSync(join(ROOT, "test/fixtures/covers/spec-driven-development.svg"), "utf8"));
  });

  test("The cover command runs as a bin", () => {
    const out = run(join(consumer(), "node_modules/.bin/brunosouzas-cover"), [FIXTURE, "--out", join(work, "cover.svg")], consumer());
    expect(out.trim()).toBe(`wrote ${join(work, "cover.svg")}`);
    expect(readFileSync(join(work, "cover.svg"), "utf8")).toBe(readFileSync(join(ROOT, "test/fixtures/covers/spec-driven-development.svg"), "utf8"));
  });
});

// Integration test of `npm run pieces:sheet` (spec illustration-pieces,
// "Piece catalogue", "Catalogue sheet in Source", "Dark catalogue sheet";
// tasks 3.3 of illustration-pieces and 1.5 of identity-v2-type-pieces-cleanup).
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import { runPiecesSheet, SHEET_USAGE } from "../../scripts/pieces-sheet";
import { PIECE_NAMES } from "../../src/pieces/library";
import { tokens } from "../../tokens/generated/tokens";

// Font reads can be failed on demand ("Sheet font failure").
const fontIo = vi.hoisted(() => ({ failing: new Set<string>() }));
vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  const readFile = async (...args: Parameters<typeof actual.readFile>) => {
    if ([...fontIo.failing].some((name) => String(args[0]).endsWith(name))) throw new Error("EACCES: permission denied (test)");
    return actual.readFile(...args);
  };
  return { ...actual, readFile, default: { ...actual, readFile } };
});

const folders: string[] = [];
afterEach(() => {
  fontIo.failing.clear();
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
});

const workspace = (command: typeof runPiecesSheet = runPiecesSheet) => {
  const root = mkdtempSync(join(tmpdir(), "sheet-"));
  folders.push(root);
  const out: string[] = [];
  const err: string[] = [];
  const io = { cwd: root, log: (l: string) => out.push(l), error: (l: string) => err.push(l) };
  return { root, out, err, run: (...args: string[]) => command(args, io) };
};

/** `family weight` of each @font-face of a sheet, in order. */
const fontFaces = (svg: string): string[] => [...svg.matchAll(/@font-face\{font-family:'([^']+)';font-weight:([\d ]+);font-style:normal;src:url\(data:font\/ttf;base64,/g)].map((m) => `${m[1]} ${m[2]}`);
/** The children of the group that clips a piece's cell, up to its first closing tag. */
const cellOf = (svg: string, name: string): string => {
  const cell = new RegExp(`<g [^>]*clip-path="url\\(#cell-${name}\\)"[^>]*>([\\s\\S]*?)</g>\\s*<g `).exec(svg);
  expect(cell, name).not.toBeNull();
  return cell![1];
};

describe("Piece catalogue", () => {
  test("Catalogue sheet", async () => {
    const ws = workspace();
    expect(await ws.run("--out", "sheet.svg")).toBe(0);
    expect(ws.out).toEqual(["wrote sheet.svg"]);
    const svg = readFileSync(join(ws.root, "sheet.svg"), "utf8");
    const labels = [...svg.matchAll(/<text [^>]*font-family="([^"]*)" font-size="16"[^>]*>([a-zA-Z]+)<\/text>/g)];
    expect(labels.map((m) => m[2])).toEqual(PIECE_NAMES);
    // Every cell draws its piece: its group holds more than the cell's own background.
    for (const name of PIECE_NAMES) {
      const shapes = cellOf(svg, name).match(/<(rect|circle|path|polygon|polyline|line|ellipse)\b/g) ?? [];
      expect(shapes.length, name).toBeGreaterThan(1);
    }
    expect(new Set(labels.map((m) => m[1].replace(/&#39;|&quot;/g, "'")))).toEqual(new Set([tokens.font.mono]));
    expect(await ws.run("--out", "sheet.png")).toBe(1);
    expect(ws.err).toEqual(["the output must be an .svg file, found sheet.png", SHEET_USAGE]);
  });
});

describe("Catalogue sheet in Source", () => {
  test("Sheet carries its faces", async () => {
    const ws = workspace();
    expect(await ws.run("--out", "sheet.svg")).toBe(0);
    expect(ws.out).toEqual(["wrote sheet.svg"]);
    const svg = readFileSync(join(ws.root, "sheet.svg"), "utf8");
    // The sheet has no desc: the style is the root's first child.
    expect(svg).toMatch(/^<svg [^>]*>\n  <style>@font-face/);
    expect(fontFaces(svg)).toEqual(expect.arrayContaining(["Source Code Pro 550 900", "Source Sans 3 550 799"]));
  });

  test("Sheet font failure", async () => {
    fontIo.failing.add("SourceCodePro-Bold.ttf");
    // A fresh module graph: no font loaded yet by an earlier test.
    vi.resetModules();
    const ws = workspace((await import("../../scripts/pieces-sheet")).runPiecesSheet);
    expect(await ws.run("--out", "sheet.svg")).toBe(1);
    expect(ws.err).toEqual([expect.stringContaining(join(new URL("../../fonts/", import.meta.url).pathname, "SourceCodePro-Bold.ttf"))]);
    expect(ws.out).toEqual([]);
    expect(existsSync(join(ws.root, "sheet.svg"))).toBe(false);
  });
});

describe("Dark catalogue sheet", () => {
  test("Dark sheet", async () => {
    const ws = workspace();
    expect(await ws.run("--out", "dark.svg", "--surface", "dark")).toBe(0);
    expect(await ws.run("--out", "light.svg", "--surface", "light")).toBe(0);
    expect(await ws.run("--out", "default.svg")).toBe(0);
    expect(ws.out).toEqual(["wrote dark.svg", "wrote light.svg", "wrote default.svg"]);
    const dark = readFileSync(join(ws.root, "dark.svg"), "utf8");
    const light = readFileSync(join(ws.root, "light.svg"), "utf8");
    expect(readFileSync(join(ws.root, "default.svg"), "utf8")).toBe(light);
    expect(dark).toMatch(new RegExp(`</defs>\\n  <rect width="\\d+" height="\\d+" fill="${tokens.surface.dark.background}"/>`));
    expect(cellOf(dark, "storeNode")).toContain(`fill="${tokens.surface.dark.panel}" stroke="${tokens.surface.dark.muted}"`);
    // gear takes no surface: it keeps its light cell and its shapes, as on the light sheet.
    const shapes = (svg: string) => cellOf(svg, "gear").split("\n").slice(2).join("\n");
    expect(shapes(dark)).toBe(shapes(light));
    expect(cellOf(dark, "gear")).toContain(`fill="${tokens.color.panel}" stroke="${tokens.color.ring}"`);
    expect(dark).toMatch(/^<svg [^>]*>\n  <style>@font-face/);
    expect(fontFaces(dark)).toContain("Source Code Pro 550 900");
    const labels = [...dark.matchAll(/<text [^>]*font-size="16"[^>]*fill="([^"]+)">[a-zA-Z]+<\/text>/g)].map((m) => m[1]);
    expect(labels).toHaveLength(PIECE_NAMES.length);
    expect(new Set(labels)).toEqual(new Set([tokens.surface.dark.text, tokens.color.ink]));
    const label = (name: string) => new RegExp(`fill="([^"]+)">${name}</text>`).exec(dark)?.[1];
    expect([label("storeNode"), label("gear")]).toEqual([tokens.surface.dark.text, tokens.color.ink]);
  });

  test("Unknown sheet surface", async () => {
    const ws = workspace();
    expect(await ws.run("--out", "dark.svg", "--surface", "blue")).toBe(1);
    expect(ws.err).toEqual(["--surface expects light or dark, found blue", "usage: npm run pieces:sheet -- --out <file.svg> [--surface light|dark]"]);
    expect(existsSync(join(ws.root, "dark.svg"))).toBe(false);
  });
});

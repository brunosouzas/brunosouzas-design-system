// Integration test of `npm run pieces:sheet` (spec illustration-pieces,
// "Piece catalogue"; tasks 3.3).
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { runPiecesSheet, SHEET_USAGE } from "../../scripts/pieces-sheet";
import { PIECE_NAMES } from "../../src/pieces/library";
import { tokens } from "../../tokens/generated/tokens";

const folders: string[] = [];
afterEach(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
});

describe("Piece catalogue", () => {
  test("Catalogue sheet", () => {
    const root = mkdtempSync(join(tmpdir(), "sheet-"));
    folders.push(root);
    const out: string[] = [];
    const err: string[] = [];
    const io = { cwd: root, log: (l: string) => out.push(l), error: (l: string) => err.push(l) };
    expect(runPiecesSheet(["--out", "sheet.svg"], io)).toBe(0);
    expect(out).toEqual(["wrote sheet.svg"]);
    const svg = readFileSync(join(root, "sheet.svg"), "utf8");
    const labels = [...svg.matchAll(/<text [^>]*font-family="([^"]*)" font-size="16"[^>]*>([a-zA-Z]+)<\/text>/g)];
    expect(labels.map((m) => m[2])).toEqual(PIECE_NAMES);
    // Every cell draws its piece: its group holds more than the cell's own background.
    for (const name of PIECE_NAMES) {
      const cell = new RegExp(`<g [^>]*clip-path="url\\(#cell-${name}\\)"[^>]*>([\\s\\S]*?)</g>\\s*<g `).exec(svg);
      expect(cell, name).not.toBeNull();
      const shapes = cell![1].match(/<(rect|circle|path|polygon|polyline|line|ellipse)\b/g) ?? [];
      expect(shapes.length, name).toBeGreaterThan(1);
    }
    expect(new Set(labels.map((m) => m[1].replace(/&#39;|&quot;/g, "'")))).toEqual(new Set([tokens.font.mono]));
    expect(runPiecesSheet(["--out", "sheet.png"], io)).toBe(1);
    expect(err).toEqual(["the output must be an .svg file, found sheet.png", SHEET_USAGE]);
  });
});

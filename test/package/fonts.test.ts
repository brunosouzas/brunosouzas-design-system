// The shipped font files are Adobe's release files, unmodified (spec
// illustration-pieces, "Fonts shipped with the package"; task 1.1 of
// identity-v2-type-pieces-cleanup): every TTF in fonts/ hashes to its entry in
// test/fixtures/fonts-sha256.json, and there are exactly six (Source Serif 4
// Bold since 0.9.0, change headline-piece).
import { createHash } from "node:crypto";
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import pinned from "../fixtures/fonts-sha256.json";

const FONTS = new URL("../../fonts/", import.meta.url).pathname;

/** Problems of a fonts folder against the pinned sums, each naming its file (empty when it matches). */
const fontProblems = (folder: string, expected: Record<string, string> = pinned): string[] => {
  const files = readdirSync(folder).filter((name) => name.endsWith(".ttf")).sort();
  const problems = files.flatMap((name) => {
    if (!Object.hasOwn(expected, name)) return [`${name}: not a pinned font file`];
    const sum = createHash("sha256").update(readFileSync(join(folder, name))).digest("hex");
    return sum === expected[name] ? [] : [`${name}: SHA-256 ${sum} differs from the pinned ${expected[name]}`];
  });
  const missing = Object.keys(expected).filter((name) => !files.includes(name)).map((name) => `${name}: missing`);
  return [...problems, ...missing].sort();
};

const folders: string[] = [];
afterEach(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
});
const copyOfFonts = () => {
  const folder = mkdtempSync(join(tmpdir(), "fonts-"));
  folders.push(folder);
  cpSync(FONTS, folder, { recursive: true });
  return folder;
};

describe("Fonts shipped with the package", () => {
  test("Release files verified", () => {
    expect(readdirSync(FONTS).filter((name) => name.endsWith(".ttf")).sort()).toEqual([
      "SourceCodePro-Bold.ttf",
      "SourceCodePro-Regular.ttf",
      "SourceSans3-Black.ttf",
      "SourceSans3-Bold.ttf",
      "SourceSans3-Regular.ttf",
      "SourceSerif4-Bold.ttf",
    ]);
    expect(Object.keys(pinned)).toHaveLength(6);
    expect(fontProblems(FONTS)).toEqual([]);
    expect(readFileSync(join(FONTS, "OFL.txt"), "utf8")).toContain("SIL Open Font License, Version 1.1");
  });

  test("A changed font file is caught", () => {
    const changed = copyOfFonts();
    const bytes = readFileSync(join(changed, "SourceSans3-Bold.ttf"));
    bytes[bytes.length - 1] ^= 1;
    writeFileSync(join(changed, "SourceSans3-Bold.ttf"), bytes);
    expect(fontProblems(changed)).toEqual([expect.stringMatching(/^SourceSans3-Bold\.ttf: SHA-256 [0-9a-f]{64} differs/)]);

    const extra = copyOfFonts();
    cpSync(join(extra, "SourceSans3-Bold.ttf"), join(extra, "SourceSans3-Semibold.ttf"));
    expect(fontProblems(extra)).toEqual(["SourceSans3-Semibold.ttf: not a pinned font file"]);
  });
});

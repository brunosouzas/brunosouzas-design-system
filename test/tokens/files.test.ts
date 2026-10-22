// Integration tests of the token build's write and check modes, in a temporary
// folder (spec design-tokens; tasks 2.4). The invalid sources of tasks 2.2 are
// run through a real build to prove that a failed build writes no file.
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { OUTPUT_FILES, runTokens } from "../../scripts/tokens";
import { remove, set, sourceWith, token, TRAILING_COMMA_SOURCE, type Source } from "./fixtures";

type Run = { code: number; out: string[]; err: string[] };

const folders: string[] = [];
afterEach(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
});

const workspace = (source: Source | string) => {
  const root = mkdtempSync(join(tmpdir(), "tokens-files-"));
  folders.push(root);
  const sourcePath = join(root, "source.json");
  const outDir = join(root, "generated");
  const writeSource = (next: Source | string) =>
    writeFileSync(sourcePath, typeof next === "string" ? next : JSON.stringify(next, null, 2));
  writeSource(source);
  const run = (check: boolean): Run => {
    const out: string[] = [];
    const err: string[] = [];
    const code = runTokens({ sourcePath, outDir, check, log: (l) => out.push(l), error: (l) => err.push(l) });
    return { code, out, err };
  };
  /** Every file under the workspace with its bytes, to prove nothing changed. */
  const snapshot = () => {
    const files: Record<string, string> = {};
    for (const name of readdirSync(root, { recursive: true }) as string[]) {
      const path = join(root, name);
      try {
        files[name] = readFileSync(path, "base64");
      } catch {
        files[name] = "<folder>";
      }
    }
    return files;
  };
  return { root, outDir, writeSource, run, snapshot };
};

describe("Deterministic build", () => {
  test("Same source, same bytes", () => {
    const ws = workspace(sourceWith());
    const first = ws.run(false);
    expect(first.code).toBe(0);
    expect(first.out).toHaveLength(3);
    const afterFirst = ws.snapshot();
    expect(ws.run(false).code).toBe(0);
    expect(ws.snapshot()).toEqual(afterFirst);
    expect(ws.run(true).code).toBe(0);
  });
});

describe("Freshness check", () => {
  test("Stale output", () => {
    const ws = workspace(sourceWith());
    expect(ws.run(false).code).toBe(0);
    ws.writeSource(sourceWith(set("color.ink", token("#FF0000", "color"))));
    const before = ws.snapshot();
    const check = ws.run(true);
    expect(check.code).toBe(1);
    for (const name of OUTPUT_FILES) expect(check.err).toContainEqual(expect.stringMatching(new RegExp(`^stale: .*${name.replace(".", "\\.")}$`)));
    expect(ws.snapshot()).toEqual(before);
  });

  test("Missing output", () => {
    const ws = workspace(sourceWith());
    expect(ws.run(false).code).toBe(0);
    unlinkSync(join(ws.outDir, "tokens.json"));
    const check = ws.run(true);
    expect(check.code).toBe(1);
    expect(check.err).toContainEqual(expect.stringMatching(/^missing: .*tokens\.json$/));
    expect(check.err.some((line) => /tokens\.(css|ts)$/.test(line))).toBe(false);
    expect(existsSync(join(ws.outDir, "tokens.json"))).toBe(false);
  });

  test("Invalid source during the check", () => {
    const ws = workspace(sourceWith(remove("color.failure")));
    const build = ws.run(false);
    const before = ws.snapshot();
    const check = ws.run(true);
    expect(check.code).toBe(1);
    expect(check.err).toEqual(build.err);
    expect(check.err[0]).toBe("color.failure: missing required token (type color)");
    expect(ws.snapshot()).toEqual(before);
  });
});

// The invalid-source scenarios of tasks 2.2 that say "writes no file": a failed
// build leaves the output folder byte-identical, whether it was empty or held
// earlier outputs.
const invalidSources: Record<string, Source | string> = {
  "Source file missing or not an object": "[]",
  "Source with an unknown group": sourceWith(set("spacing", { small: token(4, "dimension") })),
  "Token without a type": sourceWith(set("color.ink", { $value: "#0A1033" })),
  "Invalid JSON": TRAILING_COMMA_SOURCE,
  "Name that is not camelCase": sourceWith(set("color.fail-fast", token("#E0661F", "color"))),
  "Too deep or unknown token key": sourceWith(set("motion.pop.spring", { damping: token(13, "number") })),
  "Group that is not an object": sourceWith(set("outline", 4)),
  "Two paths with one CSS name": sourceWith(set("motion.popDamping", token(13, "number"))),
  "Malformed colour": sourceWith(set("color.ink", token("#12345", "color"))),
  "Zero or negative frame count": sourceWith(set("motion.travel", token(0, "frames"))),
  "Non-integer or off-step values": sourceWith(set("font.weightBold", token(450, "fontWeight"))),
  "Opacity above one": sourceWith(set("motion.dimOpacity", token(1.2, "opacity"))),
  "Font family that would break the CSS": sourceWith(set("font.sans", token("Lato; } body { color: red", "fontFamily"))),
  "Missing required token": sourceWith(remove("color.failure")),
  "Required token with the wrong type": sourceWith(set("outline.block", token(4, "number"))),
  "Missing motion token": sourceWith(remove("motion.focus.mass")),
  "Frame rate with the wrong type": sourceWith(set("motion.fps", token(30, "number"))),
};

describe("writes no file", () => {
  for (const [scenario, source] of Object.entries(invalidSources)) {
    test(scenario, () => {
      const empty = workspace(source);
      expect(empty.run(false).code).toBe(1);
      expect(existsSync(empty.outDir)).toBe(false);

      const earlier = workspace(sourceWith());
      expect(earlier.run(false).code).toBe(0);
      earlier.writeSource(source);
      const before = earlier.snapshot();
      expect(earlier.run(false).code).toBe(1);
      expect(earlier.snapshot()).toEqual(before);
    });
  }
});

// Unit tests of the token source validation (spec design-tokens; tasks 2.2).
// Each test title is the spec scenario it proves.
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { buildFromText, formatProblem, runTokens } from "../../scripts/tokens";
import { remove, set, sourceWith, token, TRAILING_COMMA_SOURCE, type Source } from "./fixtures";

/** Problem lines the build reports for a source (empty when it is valid). */
const problemsOf = (source: Source | string): string[] => {
  const result = buildFromText(typeof source === "string" ? source : JSON.stringify(source));
  return result.ok ? [] : result.problems.map(formatProblem);
};

const temporaryFolders: string[] = [];
afterEach(() => {
  for (const folder of temporaryFolders.splice(0)) rmSync(folder, { recursive: true, force: true });
});

describe("Token source", () => {
  test("Source file missing or not an object", () => {
    const folder = mkdtempSync(join(tmpdir(), "tokens-missing-"));
    temporaryFolders.push(folder);
    const errors: string[] = [];
    const code = runTokens({
      sourcePath: join(folder, "source.json"),
      outDir: join(folder, "generated"),
      check: false,
      log: () => {},
      error: (line) => errors.push(line),
    });
    expect(code).toBe(1);
    expect(errors[0]).toMatch(/source\.json does not exist/);
    expect(readdirSync(folder)).toEqual([]);

    expect(problemsOf("[]")).toEqual(["the root of tokens/source.json must be a JSON object, found an array"]);
    expect(problemsOf("null")).toEqual(["the root of tokens/source.json must be a JSON object, found null"]);
  });

  test("Source with an unknown group", () => {
    const problems = problemsOf(sourceWith(set("spacing", { small: token(4, "dimension") })));
    expect(problems).toEqual([expect.stringMatching(/^spacing: unknown group/)]);
  });

  test("Token without a type", () => {
    expect(problemsOf(sourceWith(set("color.ink", { $value: "#0A1033" })))).toEqual([
      expect.stringMatching(/^color\.ink: token without a type/),
    ]);
    expect(problemsOf(sourceWith(set("color.ink", token("#0A1033", "colour"))))).toEqual([
      expect.stringMatching(/^color\.ink: unsupported type "colour"/),
    ]);
  });
});

describe("Token shape, names and nesting", () => {
  test("Invalid JSON", () => {
    const problems = problemsOf(TRAILING_COMMA_SOURCE);
    expect(problems).toHaveLength(1);
    // The trailing comma ends line 3; the parser stops at the `}` on line 4, column 3.
    expect(problems[0]).toMatch(/invalid JSON at line 4, column 3/);
  });

  test("Name that is not camelCase", () => {
    const problems = problemsOf(
      sourceWith(set("color.fail-fast", token("#E0661F", "color")), set("color.Ink", token("#0A1033", "color"))),
    );
    expect(problems).toContainEqual(expect.stringMatching(/^color\.fail-fast: .*expected camelCase/));
    expect(problems).toContainEqual(expect.stringMatching(/^color\.Ink: .*expected camelCase/));
  });

  test("Too deep or unknown token key", () => {
    expect(problemsOf(sourceWith(set("motion.pop.spring", { damping: token(13, "number") })))).toEqual([
      expect.stringMatching(/^motion\.pop\.spring\.damping: nested too deep/),
    ]);
    expect(problemsOf(sourceWith(set("outline.block", { $value: 4, $type: "dimension", $unit: "px" })))).toEqual([
      expect.stringMatching(/^outline\.block: unknown key "\$unit"/),
    ]);
    expect(
      problemsOf(sourceWith(set("color.ink", { $value: "#0A1033", $type: "color", dark: token("#000000", "color") }))),
    ).toEqual([expect.stringMatching(/^color\.ink: unknown key "dark"/)]);
  });

  test("Group that is not an object", () => {
    expect(problemsOf(sourceWith(set("outline", 4)))).toEqual([expect.stringMatching(/^outline: group must be an object/)]);
    expect(problemsOf(sourceWith(set("color", [])))).toEqual([expect.stringMatching(/^color: group must be an object/)]);
  });
});

describe("CSS names", () => {
  test("Two paths with one CSS name", () => {
    const problems = problemsOf(sourceWith(set("motion.popDamping", token(13, "number"))));
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("motion.pop.damping");
    expect(problems[0]).toContain("motion.popDamping");
    expect(problems[0]).toContain("--ds-motion-pop-damping");
  });
});

describe("Every problem reported at once", () => {
  test("Unknown group and missing token together", () => {
    const problems = problemsOf(sourceWith(set("colour", { accent: token("#FF8A3D", "color") }), remove("color.failure")));
    expect(problems).toEqual([
      "color.failure: missing required token (type color)",
      expect.stringMatching(/^colour: unknown group/),
    ]);
  });

  test("Problems inside an unknown group are not reported", () => {
    const problems = problemsOf(sourceWith(set("colour", { ink: token("red", "color") })));
    expect(problems).toEqual([expect.stringMatching(/^colour: unknown group/)]);
  });

  test("Wrong required type hides the value check", () => {
    const problems = problemsOf(sourceWith(set("outline.block", token(1.5, "number"))));
    expect(problems).toEqual(["outline.block: expected type dimension, found number"]);
  });
});

describe("Supported token types and their values", () => {
  test("Malformed colour", () => {
    for (const value of ["#12345", "red"]) {
      expect(problemsOf(sourceWith(set("color.ink", token(value, "color"))))).toEqual([
        expect.stringMatching(/^color\.ink: expected #RRGGBB/),
      ]);
    }
  });

  test("Zero or negative frame count", () => {
    for (const value of [0, -5]) {
      expect(problemsOf(sourceWith(set("motion.travel", token(value, "frames"))))).toEqual([
        expect.stringMatching(/^motion\.travel: expected a positive integer frame count/),
      ]);
    }
  });

  test("Non-integer or off-step values", () => {
    const problems = problemsOf(
      sourceWith(
        set("motion.fps", token(0.5, "frames")),
        set("outline.block", token(1.5, "dimension")),
        set("font.weightBold", token(450, "fontWeight")),
        set("font.weightHeavy", token(950, "fontWeight")),
      ),
    );
    expect(problems.map((line) => line.split(":")[0])).toEqual([
      "font.weightBold",
      "font.weightHeavy",
      "motion.fps",
      "outline.block",
    ]);
  });

  test("Opacity above one", () => {
    expect(problemsOf(sourceWith(set("motion.dimOpacity", token(1.2, "opacity"))))).toEqual([
      expect.stringMatching(/^motion\.dimOpacity: expected a number greater than 0 and at most 1/),
    ]);
  });

  test("Font family that would break the CSS", () => {
    expect(problemsOf(sourceWith(set("font.sans", token("Lato; } body { color: red", "fontFamily"))))).toEqual([
      expect.stringMatching(/^font\.sans: expected a non-empty font family/),
    ]);
  });

  test("Boundary values accepted", () => {
    const source = sourceWith(
      set("motion.dimOpacity", token(1, "opacity")),
      set("font.weightHeavy", token(900, "fontWeight")),
      set("outline.small", token(1, "dimension")),
    );
    expect(problemsOf(source)).toEqual([]);
  });
});

describe("Required tokens", () => {
  test("Missing required token", () => {
    expect(problemsOf(sourceWith(remove("color.failure")))).toEqual(["color.failure: missing required token (type color)"]);
  });

  test("Required token with the wrong type", () => {
    expect(problemsOf(sourceWith(set("outline.block", token(4, "number"))))).toEqual([
      "outline.block: expected type dimension, found number",
    ]);
  });
});

describe("Required motion tokens", () => {
  test("Missing motion token", () => {
    expect(problemsOf(sourceWith(remove("motion.focus.mass")))).toEqual([
      "motion.focus.mass: missing required token (type number)",
    ]);
  });

  test("Frame rate with the wrong type", () => {
    expect(problemsOf(sourceWith(set("motion.fps", token(30, "number"))))).toEqual([
      "motion.fps: expected type frames, found number",
    ]);
  });

  test("Extra token in a known group", () => {
    expect(problemsOf(sourceWith(set("color.accent", token("#5B5BD6", "color"))))).toEqual([]);
  });
});

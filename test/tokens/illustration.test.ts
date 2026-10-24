// Unit tests of the illustration, cover and cover background tokens
// (spec design-tokens, change illustration-pieces; tasks 1.1 and 1.2).
// Each test title is the spec scenario it proves.
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { buildFromText, formatProblem } from "../../scripts/tokens";
import { tokens } from "../../tokens/generated/tokens";
import generatedJson from "../../tokens/generated/tokens.json";
import measured from "../fixtures/cover-backgrounds.json";
import { remove, set, sourceWith, token, type Source } from "./fixtures";

const problemsOf = (source: Source): string[] => {
  const result = buildFromText(JSON.stringify(source));
  return result.ok ? [] : result.problems.map(formatProblem);
};

const repoSource = (): Source => JSON.parse(readFileSync(new URL("../../tokens/source.json", import.meta.url), "utf8"));

type Pair = { fill: string; ring: string };

/** Names whose fill or ring differ between a source and the measured fixture (both directions). */
const driftedPairs = (source: Source): string[] => {
  const group = source.coverBackground as Record<string, { fill: { $value: string }; ring: { $value: string } }>;
  const expected = measured as Record<string, Pair>;
  const names = new Set([...Object.keys(group), ...Object.keys(expected)]);
  return [...names]
    .filter((name) => group[name]?.fill.$value !== expected[name]?.fill || group[name]?.ring.$value !== expected[name]?.ring)
    .sort();
};

describe("Token source", () => {
  test("Source with an unknown group", () => {
    expect(problemsOf(sourceWith(set("colour", { ink: token("#0A1033", "color") })))).toEqual([
      expect.stringMatching(/^colour: unknown group \(expected one of .*illustration, cover, coverBackground, surface, map, site, banner, bodyDiagram, cast\)/),
    ]);
  });

  test("New groups accepted", () => {
    const source = sourceWith(
      set("illustration.accent", token("#1E6FEB", "color")),
      set("cover.width", token(800, "dimension")),
      set("coverBackground.blush.fill", token("#F6CFE0", "color")),
      set("coverBackground.blush.ring", token("#ECBAD0", "color")),
      set("surface.dark.shadow", token("#4C5CB8", "color")),
      set("map.lineWidth", token(12, "dimension")),
      set("site.light.primary", token("#121212", "color")),
      set("banner.radius", token(20, "dimension")),
      set("bodyDiagram.radius", token(14, "dimension")),
      set("cast.dev.fill", token("#5B7CFA", "color")),
    );
    const result = buildFromText(JSON.stringify(source));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.outputs["tokens.css"]).toContain("--ds-cover-background-blush-fill: #F6CFE0;");
    expect(result.outputs["tokens.css"]).toContain("--ds-cover-width: 800px;");
    expect(result.outputs["tokens.css"]).toContain("--ds-surface-dark-shadow: #4C5CB8;");
    expect(result.outputs["tokens.css"]).toContain("--ds-banner-radius: 20px;");
    expect(result.outputs["tokens.css"]).toContain("--ds-body-diagram-radius: 14px;");
    expect(result.outputs["tokens.css"]).toContain("--ds-cast-dev-fill: #5B7CFA;");
    expect(JSON.parse(result.outputs["tokens.json"]).illustration.accent).toBe("#1E6FEB");
    expect(result.outputs["tokens.ts"]).toContain('"blush": {');
  });
});

describe("Required illustration tokens", () => {
  test("Missing illustration token", () => {
    expect(problemsOf(sourceWith(remove("illustration.iconLine")))).toEqual([
      "illustration.iconLine: missing required token (type color)",
    ]);
  });

  test("Measured values", () => {
    expect(generatedJson.illustration).toEqual({
      accent: "#1E6FEB",
      codePanel: "#14215A",
      healthyShade: "#2BB673",
      iconLine: "#B9C3E0",
      road: "#5B6478",
      tape: "#FFE2C8",
      textBar: "#C9D6F5",
      transitionalShade: "#E8B830",
    });
  });
});

describe("Required cover tokens", () => {
  test("Cover token with the wrong type", () => {
    expect(problemsOf(sourceWith(set("cover.labelWeight", token(800, "dimension"))))).toEqual([
      "cover.labelWeight: expected type fontWeight, found dimension",
    ]);
  });

  test("Measured cover values", () => {
    expect(tokens.cover).toEqual({
      height: 420,
      labelSize: 19,
      labelWeight: 800,
      pillHeight: 36,
      ringRadius: 90,
      ringStep: 28,
      ringWidth: 2,
      width: 800,
    });
  });
});

describe("Cover background pairs", () => {
  test("Entry without a ring", () => {
    expect(problemsOf(sourceWith(set("coverBackground.blush", { fill: token("#F6CFE0", "color") })))).toEqual([
      "coverBackground.blush.ring: missing required token (type color)",
    ]);
  });

  test("Extra token in an entry", () => {
    expect(problemsOf(sourceWith(set("coverBackground.sample.shadow", token("#0A1033", "color"))))).toEqual([
      "coverBackground.sample.shadow: unexpected token in a cover background (only fill and ring)",
    ]);
  });

  test("Token directly under the group", () => {
    expect(problemsOf(sourceWith(set("coverBackground.blush", token("#F6CFE0", "color"))))).toEqual([
      "coverBackground.blush: expected a group with fill and ring",
    ]);
  });

  test("Missing group", () => {
    expect(problemsOf(sourceWith(remove("coverBackground")))).toEqual([
      "coverBackground: missing required group (one entry per cover background, each with fill and ring)",
    ]);
  });

  test("Ring with another type", () => {
    expect(problemsOf(sourceWith(set("coverBackground.sample.ring", token(2, "dimension"))))).toEqual([
      "coverBackground.sample.ring: expected type color, found dimension",
    ]);
  });
});

describe("Measured cover backgrounds", () => {
  test("Source matches the measured table", () => {
    expect(Object.keys(measured)).toHaveLength(21);
    expect(driftedPairs(repoSource())).toEqual([]);
    expect(tokens.coverBackground.blush).toEqual({ fill: "#F6CFE0", ring: "#ECBAD0" });
  });

  test("A pair drifts", () => {
    const source = repoSource();
    (source.coverBackground as Record<string, Record<string, { $value: string }>>).blush.ring.$value = "#ECBAD1";
    expect(driftedPairs(source)).toEqual(["blush"]);
  });
});

// Change banner-format (AB#156), design-tokens "Required banner tokens".
describe("Required banner tokens", () => {
  test("Banner token missing", () => {
    expect(problemsOf(sourceWith(remove("banner.radius")))).toEqual(["banner.radius: missing required token (type dimension)"]);
  });

  test("Banner token with the wrong type", () => {
    expect(problemsOf(sourceWith(set("banner.width", token(1200, "number"))))).toEqual(["banner.width: expected type dimension, found number"]);
  });

  test("Measured banner values", () => {
    expect(tokens.banner).toEqual({ width: 1200, height: 420, radius: 20 });
    expect(readFileSync(new URL("../../tokens/generated/tokens.css", import.meta.url), "utf8")).toContain("--ds-banner-width: 1200px;");
  });
});

// Change designer-formats (AB#173), design-tokens "Required body diagram tokens".
describe("Required body diagram tokens", () => {
  test("Body diagram token missing", () => {
    expect(problemsOf(sourceWith(remove("bodyDiagram.layoutWidth")))).toEqual(["bodyDiagram.layoutWidth: missing required token (type dimension)"]);
  });
  test("Body diagram token with the wrong type", () => {
    expect(problemsOf(sourceWith(set("bodyDiagram.radius", token(14, "number"))))).toEqual(["bodyDiagram.radius: expected type dimension, found number"]);
  });
  test("Measured body diagram values", () => {
    expect(tokens.bodyDiagram).toEqual({ width: 800, layoutWidth: 560, radius: 14, ringRadius: 70, startRadius: 11 });
    expect(readFileSync(new URL("../../tokens/generated/tokens.css", import.meta.url), "utf8")).toContain("--ds-body-diagram-layout-width: 560px;");
  });
});

// Spec design-tokens, change cast-and-emotes (task 1.1).
describe("Required cast tokens", () => {
  test("Cast token missing", () => {
    expect(problemsOf(sourceWith(remove("cast.devops.fill")))).toEqual(["cast.devops.fill: missing required token (type color)"]);
  });
  test("Cast token with the wrong type", () => {
    expect(problemsOf(sourceWith(set("cast.emotePop.mass", token(0.7, "dimension"))))).toEqual(["cast.emotePop.mass: expected type number, found dimension"]);
  });
  test("Approved cast values", () => {
    expect(generatedJson.cast).toEqual({
      ground: "#D3DBF5",
      metal: "#C9D2E8",
      mouth: "#B94A3E",
      glow: "#7FD1FF",
      dev: { fill: "#5B7CFA", chin: "#8FA6FF", screen: "#DCE6FF" },
      agent: { neck: "#E3E8F5", shine: "#E6ECFF" },
      architect: { fill: "#22B5A4", shine: "#9CF0E4" },
      devops: { fill: "#D76AA5", shine: "#F3B8D6" },
      data: { fill: "#8C6CF0", lid: "#C2B1FF", shine: "#B39CFF", lens: "#EAF1FF" },
      request: { shine: "#D6E2FF" },
      emotePop: { damping: 9, stiffness: 170, mass: 0.7 },
    });
    expect(readFileSync(new URL("../../tokens/generated/tokens.css", import.meta.url), "utf8")).toContain("--ds-cast-dev-fill: #5B7CFA;");
  });
});

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

/**
 * Names that break the family rule of design.md Decision 6: each name is
 * `neutral`, a default `track<Name>`, or a tone `<name><Tone>` whose default
 * `track<Name>` is among the names.
 */
const orphanTones = (names: string[]): string[] => {
  const families = new Set(names.filter((name) => /^track[A-Z][A-Za-z]*$/.test(name)).map((name) => name.slice(5, 6).toLowerCase() + name.slice(6)));
  return names
    .filter((name) => name !== "neutral" && !/^track[A-Z]/.test(name))
    .filter((name) => {
      const match = /^([a-z]+)[A-Z][A-Za-z]*$/.exec(name);
      return !match || !families.has(match[1]);
    })
    .sort();
};

describe("Token source", () => {
  test("Source with an unknown group", () => {
    expect(problemsOf(sourceWith(set("colour", { ink: token("#0A1033", "color") })))).toEqual([
      expect.stringMatching(/^colour: unknown group \(expected one of .*illustration, cover, coverBackground, surface, brand, map, site, banner, bodyDiagram, cast\)/),
    ]);
  });

  test("New groups accepted", () => {
    const source = sourceWith(
      set("illustration.accent", token("#1E6FEB", "color")),
      set("cover.width", token(800, "dimension")),
      set("coverBackground.trackIntegration.fill", token("#F7C6A1", "color")),
      set("coverBackground.trackIntegration.ring", token("#E3AB84", "color")),
      set("surface.dark.shadow", token("#4C5CB8", "color")),
      set("map.lineWidth", token(12, "dimension")),
      set("site.light.primary", token("#121212", "color")),
      set("banner.radius", token(20, "dimension")),
      set("bodyDiagram.radius", token(14, "dimension")),
      set("cast.eyes", token("#FFC98A", "color")),
    );
    const result = buildFromText(JSON.stringify(source));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.outputs["tokens.css"]).toContain("--ds-cover-background-track-integration-fill: #F7C6A1;");
    expect(result.outputs["tokens.css"]).toContain("--ds-cover-width: 800px;");
    expect(result.outputs["tokens.css"]).toContain("--ds-surface-dark-shadow: #4C5CB8;");
    expect(result.outputs["tokens.css"]).toContain("--ds-banner-radius: 20px;");
    expect(result.outputs["tokens.css"]).toContain("--ds-body-diagram-radius: 14px;");
    expect(result.outputs["tokens.css"]).toContain("--ds-cast-eyes: #FFC98A;");
    expect(JSON.parse(result.outputs["tokens.json"]).illustration.accent).toBe("#1E6FEB");
    expect(result.outputs["tokens.ts"]).toContain('"trackIntegration": {');
  });
});

describe("Required illustration tokens", () => {
  test("Missing illustration token", () => {
    expect(problemsOf(sourceWith(remove("illustration.iconLine")))).toEqual([
      "illustration.iconLine: missing required token (type color)",
    ]);
  });

  test("Measured values", () => {
    // The v2 values of ADR 0009, each from a brand role.
    expect(generatedJson.illustration).toEqual({
      accent: "#E04E17",
      codePanel: "#1D1C1A",
      iconLine: "#D7D1C5",
      road: "#5C5852",
      tape: "#F4E4D8",
      textBar: "#D7D1C5",
    });
    expect(generatedJson.illustration.accent).toBe(generatedJson.brand.light.accent);
    expect(generatedJson.illustration.codePanel).toBe(generatedJson.brand.dark.cardBg);
    expect(generatedJson.illustration.road).toBe(generatedJson.brand.light.textMuted);
    // tape keeps the pale integration tint the pieces were approved with; the track roles moved to the families (design.md Decision 6).
    expect(generatedJson.illustration.tape).not.toBe(generatedJson.brand.light.trackIntegration);
    expect(generatedJson.illustration.textBar).toBe(generatedJson.brand.light.border);
    expect("healthyShade" in generatedJson.illustration || "transitionalShade" in generatedJson.illustration).toBe(false);
  });

  test("Shades no longer required", () => {
    // The synthetic source holds exactly the required tokens: no shade among them.
    expect(problemsOf(sourceWith(remove("illustration.healthyShade"), remove("illustration.transitionalShade")))).toEqual([]);
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
      labelWeight: 700,
      pillHeight: 36,
      ringRadius: 90,
      ringStep: 28,
      ringWidth: 2,
      signatureMargin: 24,
      width: 800,
    });
  });
});

describe("Cover background pairs", () => {
  test("Entry without a ring", () => {
    expect(problemsOf(sourceWith(set("coverBackground.trackIntegration", { fill: token("#F7C6A1", "color") })))).toEqual([
      "coverBackground.trackIntegration.ring: missing required token (type color)",
    ]);
  });

  test("Extra token in an entry", () => {
    expect(problemsOf(sourceWith(set("coverBackground.sample.shadow", token("#0A1033", "color"))))).toEqual([
      "coverBackground.sample.shadow: unexpected token in a cover background (only fill and ring)",
    ]);
  });

  test("Token directly under the group", () => {
    expect(problemsOf(sourceWith(set("coverBackground.trackIntegration", token("#F7C6A1", "color"))))).toEqual([
      "coverBackground.trackIntegration: expected a group with fill and ring",
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
    expect(Object.keys(measured).sort()).toEqual([
      "aiLilac",
      "aiSky",
      "deliveryMint",
      "deliveryOlive",
      "integrationClay",
      "integrationSand",
      "neutral",
      "personalRose",
      "trackAi",
      "trackDelivery",
      "trackIntegration",
      "trackPersonal",
    ]);
    expect(driftedPairs(repoSource())).toEqual([]);
    expect(tokens.coverBackground.trackIntegration).toEqual({ fill: "#F7C6A1", ring: "#E3AB84" });
    expect(tokens.coverBackground.deliveryMint).toEqual({ fill: "#A9DCD6", ring: "#88C4BD" });
    expect(tokens.coverBackground.trackPersonal).toEqual({ fill: "#F4DD8E", ring: "#DDC46C" });
    expect(tokens.coverBackground.neutral).toEqual({ fill: "#F6F3EC", ring: "#D8D6D0" });
  });

  test("Neutral background equals the brand background", () => {
    expect(tokens.coverBackground.neutral.fill).toBe(tokens.brand.light.bg);
    expect(tokens.coverBackground.neutral.ring).toBe("#D8D6D0");
  });

  test("Every tone belongs to a family", () => {
    expect(orphanTones(Object.keys(measured))).toEqual([]);
    const defaults = Object.keys(measured).filter((name) => /^track[A-Z]/.test(name)).sort();
    expect(defaults).toEqual(["trackAi", "trackDelivery", "trackIntegration", "trackPersonal"]);
    const brandLight = generatedJson.brand.light as Record<string, string>;
    for (const name of defaults) expect((measured as Record<string, Pair>)[name].fill).toBe(brandLight[name]);
  });

  test("A tone without its family", () => {
    const source = repoSource();
    (source.coverBackground as Record<string, unknown>).opsTeal = { fill: token("#B5E0E0", "color"), ring: token("#94C8C8", "color") };
    expect(orphanTones(Object.keys(source.coverBackground as Record<string, unknown>))).toEqual(["opsTeal"]);
    expect(driftedPairs(source)).toEqual(["opsTeal"]);
  });

  test("A pair drifts", () => {
    const source = repoSource();
    (source.coverBackground as Record<string, Record<string, { $value: string }>>).trackIntegration.ring.$value = "#E3AB85";
    expect(driftedPairs(source)).toEqual(["trackIntegration"]);
  });

  test("A removed pair comes back", () => {
    // blush is one of the 21 pairs measured before 0.6.0 and removed in 0.7.0.
    const source = repoSource();
    (source.coverBackground as Record<string, unknown>).blush = { fill: token("#F6CFE0", "color"), ring: token("#ECBAD0", "color") };
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
    expect(problemsOf(sourceWith(remove("cast.emotePop.damping")))).toEqual(["cast.emotePop.damping: missing required token (type number)"]);
  });
  test("Cast token with the wrong type", () => {
    expect(problemsOf(sourceWith(set("cast.emotePop.mass", token(0.7, "dimension"))))).toEqual(["cast.emotePop.mass: expected type number, found dimension"]);
  });
  test("Approved cast values", () => {
    expect(generatedJson.cast).toEqual({
      emotePop: { damping: 9, stiffness: 170, mass: 0.7 },
      eyes: "#FFC98A",
    });
    expect(readFileSync(new URL("../../tokens/generated/tokens.css", import.meta.url), "utf8")).not.toContain("--ds-cast-dev-fill");
  });
  test("Seven-role colour no longer required", () => {
    // The synthetic source holds exactly the required tokens: no seven-role colour among them.
    const source = sourceWith();
    expect(JSON.stringify(source)).not.toMatch(/"(ground|metal|mouth|glow|dev|agent|architect|devops|data|request)":/);
    expect(problemsOf(source)).toEqual([]);
  });
});

// Unit tests of the brand, state-alias, cast eyes and signature margin tokens
// (spec design-tokens, change identity-v2-guide-and-system, AB#268). Each test
// title is the spec scenario it proves.
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { buildFromText, formatProblem } from "../../scripts/tokens";
import { tokens } from "../../tokens/generated/tokens";
import generatedJson from "../../tokens/generated/tokens.json";
import { remove, set, sourceWith, token, type Source } from "./fixtures";

const problemsOf = (source: Source): string[] => {
  const result = buildFromText(JSON.stringify(source));
  return result.ok ? [] : result.problems.map(formatProblem);
};

// A third brand theme with the fifteen tokens of a valid one.
const SEPIA_BRAND: Source = Object.fromEntries(
  ["bg", "cardBg", "text", "textMuted", "border", "borderStrong", "accent", "accentText", "onAccent", "success", "failure", "warning", "trackIntegration", "trackDelivery", "trackAi"].map((key) => [
    key,
    token("#FFFFFF", "color"),
  ]),
);

describe("Brand colour roles", () => {
  test("Missing brand role", () => {
    expect(problemsOf(sourceWith(remove("brand.light.accent")))).toEqual(["brand.light.accent: missing required token (type color)"]);
  });

  test("Extra brand theme", () => {
    const problems = problemsOf(sourceWith(set("brand.sepia", SEPIA_BRAND)));
    expect(Object.keys(SEPIA_BRAND)).toHaveLength(15);
    expect(problems).toEqual([expect.stringMatching(/^brand\.sepia: unexpected surface \(expected light and dark\)/)]);
  });

  test("Measured brand roles, light theme", () => {
    expect(generatedJson.brand.light).toEqual({
      bg: "#F6F3EC",
      cardBg: "#FFFFFF",
      text: "#121212",
      textMuted: "#5C5852",
      border: "#D7D1C5",
      borderStrong: "#5C5852",
      accent: "#E04E17",
      accentText: "#B83A0C",
      onAccent: "#FFFFFF",
      success: "#2B7A4B",
      failure: "#A1124B",
      warning: "#8F5F00",
      trackIntegration: "#F4E4D8",
      trackDelivery: "#DFE8E1",
      trackAi: "#E2E4EC",
    });
  });

  test("Measured brand roles, dark theme", () => {
    expect(generatedJson.brand.dark).toEqual({
      bg: "#121110",
      cardBg: "#1D1C1A",
      text: "#F1EEE8",
      textMuted: "#ADA79D",
      border: "#3B3834",
      borderStrong: "#ADA79D",
      accent: "#FF7A45",
      accentText: "#FF7A45",
      onAccent: "#121110",
      success: "#5BBF86",
      failure: "#FF6696",
      warning: "#EBB34B",
      trackIntegration: "#2A1C15",
      trackDelivery: "#18231D",
      trackAi: "#1B1F28",
    });
  });
});

describe("State colour alias", () => {
  test("State alias matches the original", () => {
    expect(generatedJson.color.state.healthy).toBe(generatedJson.color.healthy);
    const css = readFileSync(new URL("../../tokens/generated/tokens.css", import.meta.url), "utf8");
    expect(css).toContain(`  --ds-color-healthy: ${generatedJson.color.healthy};\n`);
    expect(css).toContain(`  --ds-color-state-healthy: ${generatedJson.color.healthy};\n`);
  });

  test("Alias covers only the six meanings", () => {
    expect(Object.keys(generatedJson.color.state).sort()).toEqual(["backend", "blocked", "caller", "failFast", "failure", "healthy", "transitional"]);
  });
});

describe("Cast eyes colour and signature margin", () => {
  test("Cast eyes present", () => {
    expect(generatedJson.cast.eyes).toBe("#FFC98A");
  });

  test("Signature margin present", () => {
    expect(typeof tokens.cover.signatureMargin).toBe("number");
    expect(tokens.cover.signatureMargin).toBeGreaterThan(0);
  });
});

// Unit tests of the brand, state, type, v2 component, cast eyes and signature
// margin tokens (spec design-tokens, changes identity-v2-guide-and-system and
// identity-v2-type-pieces-cleanup). Each test title is the spec scenario it proves.
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

describe("State colours", () => {
  test("The seven state meanings", () => {
    expect(Object.keys(generatedJson.color.state).sort()).toEqual(["backend", "blocked", "caller", "failFast", "failure", "healthy", "transitional"]);
  });
});

const CSS = () => readFileSync(new URL("../../tokens/generated/tokens.css", import.meta.url), "utf8");
const repoSource = (): Source => JSON.parse(readFileSync(new URL("../../tokens/source.json", import.meta.url), "utf8"));

describe("Source type tokens", () => {
  test("Source stacks in the outputs", () => {
    expect(generatedJson.font.sans).toBe("'Source Sans 3', 'Helvetica Neue', Helvetica, Arial, sans-serif");
    expect(generatedJson.font.mono).toBe("'Source Code Pro', ui-monospace, 'SF Mono', Menlo, Consolas, monospace");
    expect(CSS()).toContain("  --ds-font-serif: 'Source Serif 4', Georgia, 'Times New Roman', serif;\n");
    expect(generatedJson.font.weightBold).toBe(700);
    expect(generatedJson.font.weightHeavy).toBe(900);
  });

  test("Missing serif stack", () => {
    expect(problemsOf(sourceWith(remove("font.serif")))).toEqual(["font.serif: missing required token (type fontFamily)"]);
  });

  test("Serif stack with another type", () => {
    expect(problemsOf(sourceWith(set("font.serif", token(400, "fontWeight"))))).toEqual(["font.serif: expected type fontFamily, found fontWeight"]);
  });
});

// The v2 values of ADR 0009 (design.md Decision 3), paths unchanged.
const V2_VALUES: Record<string, string | number> = {
  "color.ink": "#121212",
  "color.panel": "#F6F3EC",
  "color.ring": "#EDE8DE",
  "shadow.block": 0,
  "shadow.pill": 0,
  "shadow.small": 0,
  "map.shadow": 0,
};

/** Paths of `V2_VALUES` whose value in a source differs. */
const driftedV2 = (source: Source): string[] => {
  const valueAt = (path: string): unknown => (path.split(".").reduce<unknown>((node, name) => (node as Record<string, unknown> | undefined)?.[name], source) as { $value?: unknown } | undefined)?.$value;
  return Object.entries(V2_VALUES).filter(([path, value]) => valueAt(path) !== value).map(([path]) => path);
};

describe("V2 component values", () => {
  test("V2 values in the outputs", () => {
    expect(driftedV2(repoSource())).toEqual([]);
    expect(generatedJson.color.ink).toBe("#121212");
    expect(generatedJson.color.panel).toBe("#F6F3EC");
    expect(generatedJson.color.ring).toBe("#EDE8DE");
    expect(generatedJson.shadow).toEqual({ block: 0, pill: 0, small: 0 });
    expect(generatedJson.color.ink).toBe(generatedJson.brand.light.text);
    expect(generatedJson.color.panel).toBe(generatedJson.brand.light.bg);
  });

  test("Zero shadow is a valid dimension", () => {
    expect(problemsOf(sourceWith(set("shadow.block", token(0, "dimension"))))).toEqual([]);
    expect(CSS()).toContain("  --ds-shadow-block: 0px;\n");
  });

  test("A v2 value drifts", () => {
    const source = repoSource();
    ((source.color as Record<string, Record<string, unknown>>).ink).$value = "#0A1033";
    expect(driftedV2(source)).toEqual(["color.ink"]);
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

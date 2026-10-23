// Unit tests of the surface, map and site tokens (spec design-tokens, change
// metro-and-diagram-pieces, tasks 1.1 and 1.2; change
// stackledger-map-and-link-pieces, task 1.1). Each test title is the spec
// scenario it proves.
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
const json = generatedJson as unknown as Record<string, Record<string, Record<string, unknown>>>;

describe("Surface tokens", () => {
  test("Surface entry without its shadow", () => {
    expect(problemsOf(sourceWith(remove("surface.dark.shadow")))).toEqual(["surface.dark.shadow: missing required token (type color)"]);
  });

  test("Surface entry without its zone opacity", () => {
    expect(problemsOf(sourceWith(remove("surface.light.zoneOpacity")))).toEqual(["surface.light.zoneOpacity: missing required token (type opacity)"]);
  });

  test("Extra surface", () => {
    const sepia = Object.fromEntries(["background", "text", "muted", "grid", "panel", "shadow", "rim"].map((key) => [key, token("#FFFFFF", "color")]));
    const problems = problemsOf(sourceWith(set("surface.sepia", { ...sepia, rimWidth: token(0, "dimension"), zoneOpacity: token(0.12, "opacity") })));
    expect(problems).toEqual([expect.stringMatching(/^surface\.sepia: unexpected surface \(expected light and dark\)/)]);
  });

  test("Measured surfaces", () => {
    expect(json.surface.light).toEqual({ background: "#EEF2FF", text: "#0A1033", muted: "#5B6694", grid: "#E0E7FB", panel: "#FFFFFF", shadow: "#0A1033", rim: "#EEF2FF", rimWidth: 0, zoneOpacity: 0.12 });
    expect(json.surface.dark).toEqual({ background: "#14215A", text: "#EEF2FF", muted: "#8F9BD0", grid: "#1C2D74", panel: "#1C2D74", shadow: "#4C5CB8", rim: "#EEF2FF", rimWidth: 1, zoneOpacity: 0.22 });
  });
});

describe("Map tokens", () => {
  test("Map token with the wrong type", () => {
    expect(problemsOf(sourceWith(set("map.lineWidth", token(12, "number"))))).toEqual([expect.stringMatching(/^map\.lineWidth: expected type dimension, found number/)]);
    expect(problemsOf(sourceWith(set("map.zoneTitleTint", token(0.6, "dimension"))))).toEqual([expect.stringMatching(/^map\.zoneTitleTint: expected type number, found dimension/)]);
  });

  test("Measured map values", () => {
    expect(tokens.map).toEqual({
      outline: 3, shadow: 3.5, lineWidth: 12, casing: 6, badgeHeight: 20, badgeTextSize: 12, countHeight: 16, countTextSize: 11,
      stopRadius: 12, interchangeExtra: 2, nodeHeight: 46, nodeRadius: 10, edgeWidth: 2.5, labelSize: 13,
      ringWidth: 3, haloWidth: 1.5, licenceSize: 10, zonePadding: 32, zoneTitleTint: 0.6,
    });
    const css = readFileSync(new URL("../../tokens/generated/tokens.css", import.meta.url), "utf8");
    expect(css).toContain("--ds-map-line-width: 12px;");
    expect(css).toContain("--ds-map-halo-width: 1.5px;");
    expect(css).toContain("--ds-map-zone-title-tint: 0.6;");
  });
});

describe("Site palette tokens", () => {
  test("Site palette entry missing", () => {
    expect(problemsOf(sourceWith(remove("site.dark.textLight")))).toEqual(["site.dark.textLight: missing required token (type color)"]);
    expect(problemsOf(sourceWith(set("site.dark.accent", token("#9DA8FF", "color"))))).toEqual([expect.stringMatching(/^site\.dark\.accent: unexpected token in site/)]);
  });

  test("Measured site palette", () => {
    expect(json.site.light).toEqual({ primary: "#121212", body: "#FFFFFF", border: "#EAEAEA", light: "#F6F6F6", dark: "#040404", text: "#444444", textDark: "#040404", textLight: "#717171" });
    expect(json.site.dark).toEqual({ primary: "#FFFFFF", body: "#1C1C1C", border: "#3E3E3E", light: "#222222", dark: "#FFFFFF", text: "#B4AFB6", textDark: "#FFFFFF", textLight: "#B4AFB6" });
    expect(json.site.font).toEqual({ primary: "Heebo, sans-serif", secondary: "Signika, sans-serif" });
    expect(json.site.fontSize).toEqual({ base: 16, baseSmall: 12.8 });
    expect(json.site.heading).toEqual({ h1: 2.985984, h2: 2.48832, h3: 2.0736, h4: 1.728, h5: 1.44, h6: 1.2, h1Small: 2.6873856, h2Small: 2.239488, h3Small: 1.86624, h4Small: 1.5552, h5Small: 1.296, h6Small: 1.08 });
  });
});

// Unit tests of the surface, map and site tokens (spec design-tokens, change
// metro-and-diagram-pieces, tasks 1.1 and 1.2; change
// stackledger-map-and-link-pieces, task 1.1; change bend-radius-and-current-colour,
// task 1.1). Each test title is the spec
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
// A third surface with the thirteen tokens of a valid one (change backdrop-tokens).
const SEPIA: Source = {
  ...Object.fromEntries(["background", "text", "muted", "grid", "panel", "shadow", "rim", "backdropWater", "backdropWaterEdge", "backdropPark", "backdropCredit"].map((key) => [key, token("#FFFFFF", "color")])),
  rimWidth: token(0, "dimension"),
  zoneOpacity: token(0.12, "opacity"),
};

describe("Surface tokens", () => {
  test("Surface entry without its shadow", () => {
    expect(problemsOf(sourceWith(remove("surface.dark.shadow")))).toEqual(["surface.dark.shadow: missing required token (type color)"]);
  });

  test("Surface entry without its zone opacity", () => {
    expect(problemsOf(sourceWith(remove("surface.light.zoneOpacity")))).toEqual(["surface.light.zoneOpacity: missing required token (type opacity)"]);
  });

  test("Surface entry without its backdrop water", () => {
    expect(problemsOf(sourceWith(remove("surface.dark.backdropWater")))).toEqual(["surface.dark.backdropWater: missing required token (type color)"]);
  });

  test("Extra surface", () => {
    const problems = problemsOf(sourceWith(set("surface.sepia", SEPIA)));
    expect(Object.keys(SEPIA)).toHaveLength(13);
    expect(problems).toEqual([expect.stringMatching(/^surface\.sepia: unexpected surface \(expected light and dark\)/)]);
  });

  test("Measured surfaces", () => {
    expect(json.surface.light).toEqual({ background: "#F6F3EC", text: "#121212", muted: "#5C5852", grid: "#EDE8DE", panel: "#FFFFFF", shadow: "#121212", rim: "#F6F3EC", rimWidth: 0, zoneOpacity: 0.12, backdropWater: "#C9D8FF", backdropWaterEdge: "#B5C7F5", backdropPark: "#D4F2DF", backdropCredit: "#5A6385" });
    expect(json.surface.dark).toEqual({ background: "#121110", text: "#F1EEE8", muted: "#ADA79D", grid: "#3B3834", panel: "#1D1C1A", shadow: "#121110", rim: "#F1EEE8", rimWidth: 0, zoneOpacity: 0.22, backdropWater: "#1E3175", backdropWaterEdge: "#2A3F8A", backdropPark: "#183F52", backdropCredit: "#9AA6D6" });
  });

  test("Backdrop tokens in the CSS", () => {
    const css = readFileSync(new URL("../../tokens/generated/tokens.css", import.meta.url), "utf8");
    expect(css).toContain("  --ds-surface-light-backdrop-water: #C9D8FF;\n");
    expect(css).toContain("  --ds-surface-dark-backdrop-credit: #9AA6D6;\n");
  });
});

describe("Map tokens", () => {
  test("Map token with the wrong type", () => {
    expect(problemsOf(sourceWith(set("map.lineWidth", token(12, "number"))))).toEqual([expect.stringMatching(/^map\.lineWidth: expected type dimension, found number/)]);
    expect(problemsOf(sourceWith(set("map.bendRadius", token(32, "number"))))).toEqual([expect.stringMatching(/^map\.bendRadius: expected type dimension, found number/)]);
    expect(problemsOf(sourceWith(set("map.zoneTitleTint", token(0.6, "dimension"))))).toEqual([expect.stringMatching(/^map\.zoneTitleTint: expected type number, found dimension/)]);
  });

  test("Missing bend radius", () => {
    expect(problemsOf(sourceWith(remove("map.bendRadius")))).toEqual(["map.bendRadius: missing required token (type dimension)"]);
  });

  test("Described bend radius", () => {
    const source = JSON.parse(readFileSync(new URL("../../tokens/source.json", import.meta.url), "utf8")) as Record<string, Record<string, Record<string, unknown>>>;
    expect(source.map.bendRadius).toEqual({ $value: 32, $type: "dimension", $description: "Radius of a bundle's centre line at a 45° or 90° bend, in map units (stackledger round-bends, AB#166)." });
    expect(json.map.bendRadius).toBe(32);
  });

  test("Measured map values", () => {
    expect(tokens.map).toEqual({
      outline: 3, shadow: 0, lineWidth: 12, casing: 6, badgeHeight: 20, badgeTextSize: 12, countHeight: 16, countTextSize: 11,
      stopRadius: 12, interchangeExtra: 2, nodeHeight: 46, nodeRadius: 10, edgeWidth: 2.5, labelSize: 13,
      ringWidth: 3, haloWidth: 1.5, licenceSize: 10, zonePadding: 32, bendRadius: 32, zoneTitleTint: 0.6,
    });
    const css = readFileSync(new URL("../../tokens/generated/tokens.css", import.meta.url), "utf8");
    expect(json.map.bendRadius).toBe(32);
    expect(json.map.shadow).toBe(0);
    expect(css).toContain("--ds-map-shadow: 0px;");
    expect(css).toContain("--ds-map-line-width: 12px;");
    expect(css).toContain("--ds-map-halo-width: 1.5px;");
    expect(css).toContain("--ds-map-bend-radius: 32px;");
    expect(css).toContain("--ds-map-zone-title-tint: 0.6;");
    expect(Object.keys(tokens.map)).toHaveLength(20);
  });
});

describe("Site palette tokens", () => {
  test("Site palette entry missing", () => {
    expect(problemsOf(sourceWith(remove("site.dark.textLight")))).toEqual(["site.dark.textLight: missing required token (type color)"]);
    expect(problemsOf(sourceWith(remove("site.light.link")))).toEqual(["site.light.link: missing required token (type color)"]);
    expect(problemsOf(sourceWith(set("site.dark.accent", token("#9DA8FF", "color"))))).toEqual([expect.stringMatching(/^site\.dark\.accent: unexpected token in site/)]);
  });

  test("Measured site palette", () => {
    expect(json.site.light).toEqual({ primary: "#121212", body: "#F6F3EC", border: "#D7D1C5", light: "#FFFFFF", dark: "#121212", text: "#121212", textDark: "#121212", textLight: "#5C5852", link: "#B83A0C" });
    expect(json.site.dark).toEqual({ primary: "#F1EEE8", body: "#121110", border: "#3B3834", light: "#1D1C1A", dark: "#F1EEE8", text: "#F1EEE8", textDark: "#F1EEE8", textLight: "#ADA79D", link: "#FF7A45" });
    expect(json.site.font).toEqual({ primary: "'Source Sans 3', sans-serif", secondary: "'Source Serif 4', serif", mono: "'Source Code Pro', monospace" });
    expect(json.site.fontSize).toEqual({ base: 16, baseSmall: 12.8 });
    expect(json.site.heading).toEqual({ h1: 2.985984, h2: 2.48832, h3: 2.0736, h4: 1.728, h5: 1.44, h6: 1.2, h1Small: 2.6873856, h2Small: 2.239488, h3Small: 1.86624, h4Small: 1.5552, h5Small: 1.296, h6Small: 1.08 });
    const css = readFileSync(new URL("../../tokens/generated/tokens.css", import.meta.url), "utf8");
    expect(css).toContain("--ds-site-light-link: #B83A0C;");
    expect(css).toContain("--ds-site-font-mono: 'Source Code Pro', monospace;");
  });
});

// The brand role each site colour stands for (design.md Decision 1, change site-palette-and-category-badges).
const SITE_ROLES = { primary: "text", body: "bg", border: "border", light: "cardBg", dark: "text", text: "text", textDark: "text", textLight: "textMuted", link: "accentText" } as const;
type SourceTree = Record<string, Record<string, Record<string, { $value?: unknown }>>>;
const valueAt = (source: SourceTree, group: string, theme: string, name: string): string => String(source[group]?.[theme]?.[name]?.$value ?? "").toUpperCase();
const repoSource = (): SourceTree => JSON.parse(readFileSync(new URL("../../tokens/source.json", import.meta.url), "utf8")) as SourceTree;

/** Every site colour that differs from its brand role, as `<site path> ≠ <brand path>` (requirement "Site colours are brand roles"). */
const siteRoleMismatches = (source: SourceTree): string[] =>
  ["light", "dark"].flatMap((theme) =>
    Object.entries(SITE_ROLES)
      .filter(([site, role]) => valueAt(source, "site", theme, site) !== valueAt(source, "brand", theme, role))
      .map(([site, role]) => `site.${theme}.${site} ≠ brand.${theme}.${role}`),
  );

const luminance = (hex: string): number => {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
};
const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** Every text, textLight or link pair on body or light under `floor`, compared unrounded, reported rounded (requirement "Site palette contrast"). */
const siteContrastBelow = (source: SourceTree, floor: number): string[] =>
  ["light", "dark"].flatMap((theme) =>
    ["text", "textLight", "link"].flatMap((fg) =>
      ["body", "light"].flatMap((bg) => {
        const ratio = contrast(valueAt(source, "site", theme, fg), valueAt(source, "site", theme, bg));
        return ratio < floor ? [`site.${theme}.${fg} on site.${theme}.${bg} at ${ratio.toFixed(2)}`] : [];
      }),
    ),
  );

describe("Site colours are brand roles", () => {
  test("Every site colour matches its role", () => {
    expect(Object.keys(SITE_ROLES)).toHaveLength(9);
    expect(siteRoleMismatches(repoSource())).toEqual([]);
  });

  test("A site colour that drifts from its role", () => {
    const source = repoSource();
    source.site.dark.textLight = { $value: "#B4AFB6" };
    expect(siteRoleMismatches(source)).toEqual(["site.dark.textLight ≠ brand.dark.textMuted"]);
  });
});

describe("Site palette contrast", () => {
  test("Site pairs above the floor", () => {
    expect(siteContrastBelow(repoSource(), 4.5)).toEqual([]);
  });

  test("A link below the floor", () => {
    const source = repoSource();
    source.site.light.link = { $value: "#E04E17" };
    expect(siteContrastBelow(source, 4.5)).toEqual(["site.light.link on site.light.body at 3.59", "site.light.link on site.light.light at 3.98"]);
  });
});

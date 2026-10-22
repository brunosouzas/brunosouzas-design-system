// Unit tests of the three token emitters (spec design-tokens; tasks 2.3).
import { describe, expect, test } from "vitest";
import { buildFromText, cssName } from "../../scripts/tokens";
import { reverseKeys, set, sourceWith, token, type Source } from "./fixtures";

const outputsOf = (source: Source) => {
  const result = buildFromText(JSON.stringify(source));
  if (!result.ok) throw new Error(`fixture should be valid: ${JSON.stringify(result.problems)}`);
  return result.outputs;
};

/** The object literal the generated TypeScript module exports as `tokens`. */
const exportedTokens = (ts: string): unknown => {
  const match = /export const tokens = ([\s\S]*) as const;/.exec(ts);
  if (!match) throw new Error("tokens.ts does not export `tokens ... as const`");
  return JSON.parse(match[1]);
};

describe("CSS names", () => {
  test("Kebab case with capitals and digits", () => {
    expect(cssName("color.failFast")).toBe("--ds-color-fail-fast");
    expect(cssName("color.okHTTP")).toBe("--ds-color-ok-h-t-t-p");
    expect(cssName("color.ink2Dark")).toBe("--ds-color-ink2-dark");
  });
});

describe("Generated outputs", () => {
  test("CSS custom property names and units", () => {
    const css = outputsOf(sourceWith(set("outline.block", token(4, "dimension")), set("motion.pop.damping", token(13, "number"))))[
      "tokens.css"
    ];
    expect(css).toContain("  --ds-outline-block: 4px;\n");
    expect(css).toContain("  --ds-motion-pop-damping: 13;\n");
    expect(css).toMatch(/^\/\*.*\*\/\n:root \{\n/);
  });

  test("TypeScript and JSON keep the nesting", () => {
    const outputs = outputsOf(sourceWith(set("motion.pop.damping", token(13, "number"))));
    const ts = exportedTokens(outputs["tokens.ts"]) as { motion: { pop: { damping: unknown } } };
    expect(ts.motion.pop.damping).toBe(13);
    expect(outputs["tokens.ts"]).toContain("export type Tokens = typeof tokens;");
    const json = JSON.parse(outputs["tokens.json"]) as { motion: { pop: { damping: unknown } } };
    expect(json.motion.pop.damping).toBe(13);
  });

  test("Generated files say they are generated", () => {
    const outputs = outputsOf(sourceWith());
    for (const text of [outputs["tokens.css"], outputs["tokens.ts"]]) {
      const firstLine = text.split("\n")[0];
      expect(firstLine).toMatch(/^(\/\*|\/\/) Generated from tokens\/source\.json/);
      expect(firstLine).toContain("Do not edit by hand");
    }
  });
});

describe("Required motion tokens", () => {
  test("Extra token in a known group", () => {
    const outputs = outputsOf(sourceWith(set("color.accent", token("#5B5BD6", "color"))));
    expect(outputs["tokens.css"]).toContain("  --ds-color-accent: #5B5BD6;\n");
    expect((exportedTokens(outputs["tokens.ts"]) as { color: { accent: unknown } }).color.accent).toBe("#5B5BD6");
    expect((JSON.parse(outputs["tokens.json"]) as { color: { accent: unknown } }).color.accent).toBe("#5B5BD6");
  });
});

describe("Deterministic build", () => {
  test("Key order does not matter", () => {
    const source = sourceWith(set("color.accent", token("#5B5BD6", "color")));
    const reversed = reverseKeys(source) as Source;
    expect(Object.keys(reversed)[0]).not.toBe(Object.keys(source)[0]);
    expect(outputsOf(reversed)).toEqual(outputsOf(source));
  });
});

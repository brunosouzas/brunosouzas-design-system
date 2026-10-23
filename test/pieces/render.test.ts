// Unit tests of the two renderers (spec illustration-pieces, "SVG renderer"
// and "React renderer"; tasks 2.2 and 4.2).
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { coverTree, type CoverSpec } from "../../src/pieces/cover";
import { el } from "../../src/pieces/node";
import { toReact } from "../../src/pieces/react";
import { toSvg } from "../../src/pieces/render";
import { normalForm } from "./normal-form";

export const PROOF_COVERS = ["spec-driven-development", "ai-writes-code", "integration-patterns"] as const;
const fixture = (name: string): CoverSpec =>
  JSON.parse(readFileSync(new URL(`../fixtures/covers/${name}.json`, import.meta.url), "utf8")) as CoverSpec;

describe("SVG renderer", () => {
  test("Escaping", () => {
    expect(toSvg(el("text", { "data-note": 'say "hi" & <go>' }, 'a < b & "c"'))).toBe(
      '<text data-note="say &quot;hi&quot; &amp; &lt;go&gt;">a &lt; b &amp; &quot;c&quot;</text>',
    );
  });

  test("Deterministic text", () => {
    const spec = fixture("integration-patterns");
    expect(toSvg(coverTree(spec))).toBe(toSvg(coverTree(spec)));
  });
});

describe("React renderer", () => {
  test.each(PROOF_COVERS)("Same drawing through React (%s)", (name) => {
    const tree = coverTree(fixture(name));
    expect(normalForm(renderToStaticMarkup(toReact(tree)))).toEqual(normalForm(toSvg(tree)));
  });

  test("Unknown hyphenated attribute", () => {
    const tree = el("g", { "data-piece": "pill", "stroke-width": 4 }, el("rect", { "clip-path": "url(#f)", width: 2 }));
    const markup = renderToStaticMarkup(toReact(tree));
    expect(markup).toContain('data-piece="pill"');
    expect(normalForm(markup)).toEqual(normalForm(toSvg(tree)));
  });
});

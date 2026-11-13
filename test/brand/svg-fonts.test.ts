// The shared sans-family mapping (spec motion-components, "Sans family for SVG
// words in a frame"; change sdd-scene-1-relay, task 1.1). The pieces name the
// sans face `font.sans` ("Source Sans 3", ADR 0008) while @remotion/google-fonts
// registers it as "Source Sans Three"; without the mapping every SVG word of a
// video falls back to Helvetica.
import { describe, expect, test } from "vitest";
import { tokens } from "../../tokens/generated/tokens";
import { withSansFamily } from "../../src/brand/svg-fonts";
import { diagramBox, edgeLabel, sheet } from "../../src/pieces/library.ts";
import { g, type SvgNode } from "../../src/pieces/node.ts";
import { stageAt as relayStageAt, STAGE_LAYERS } from "../../src/scenes/sdd-request-relay/stage";
import { stageAt as topologyStageAt, withSansFamily as topologyReexport } from "../../src/scenes/circuit-breaker-topology/stage";

const LOADED = "Loaded Sans, sans-serif";
const families = (node: SvgNode, out: string[] = []): string[] => {
  if (node.attrs["font-family"] !== undefined) out.push(String(node.attrs["font-family"]));
  for (const child of node.children) if (typeof child !== "string") families(child, out);
  return out;
};

describe("Sans family for SVG words in a frame", () => {
  test("Sans mapped, mono kept", () => {
    const box = diagramBox({ x: 0, y: 0, width: 200, height: 80, text: ["proposal.md"], textSize: 33 });
    const label = edgeLabel({ x: 0, y: 120, lines: ["`circuit-breaker:` execute"], textSize: 33, anchor: "start" });
    const tree = g({ "font-family": tokens.font.sans }, ...box.body, ...box.text, ...label.body, ...label.text);
    const snapshot = JSON.stringify(tree);
    const before = families(tree);
    expect(before).toContain(tokens.font.sans);
    expect(before).toContain(tokens.font.mono);
    const after = families(withSansFamily(tree, LOADED));
    expect(after).not.toContain(tokens.font.sans);
    expect(after).toContain(LOADED);
    expect(after.filter((f) => f === tokens.font.mono)).toHaveLength(before.filter((f) => f === tokens.font.mono).length);
    expect(after).toHaveLength(before.length);
    expect(JSON.stringify(tree)).toBe(snapshot);
  });

  test("Tree without words", () => {
    const tree = g({ stroke: tokens.color.ink }, ...sheet({ x: 0, y: 0, width: 120, height: 160, rows: [{ bar: 40 }] }).body);
    expect(families(tree)).toEqual([]);
    expect(withSansFamily(tree, LOADED)).toEqual(tree);
  });

  test("Every scene word mapped", () => {
    // The topology scene keeps its import path: stage.ts re-exports the shared function.
    expect(topologyReexport).toBe(withSansFamily);
    for (const frame of [129, 849, 1079]) {
      const stage = relayStageAt(frame);
      const layers = STAGE_LAYERS.map((name) => stage[name]).filter((layer) => families(layer).length > 0);
      expect(layers.length, `relay frame ${frame}`).toBeGreaterThan(0);
      for (const layer of layers) {
        expect(families(layer), `relay frame ${frame}`).toContain(tokens.font.sans);
        expect(families(withSansFamily(layer, LOADED)), `relay frame ${frame}`).not.toContain(tokens.font.sans);
      }
    }
    for (const frame of [389, 949, 1919]) {
      const { below, above } = topologyStageAt(frame);
      for (const layer of [below, above]) {
        expect(families(layer), `topology frame ${frame}`).toContain(tokens.font.sans);
        expect(families(withSansFamily(layer, LOADED)), `topology frame ${frame}`).not.toContain(tokens.font.sans);
      }
    }
  });
});

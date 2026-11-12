// The stage's words in the faces Remotion loads (change
// circuit-breaker-topology-scene, code review round 1). The pieces name the
// sans face `tokens.font.sans` ("Source Sans 3", ADR 0008) while
// @remotion/google-fonts registers it as "Source Sans Three"; without
// `withSansFamily` every SVG word of the video falls back to Helvetica and the
// text-size proofs (measured in Source Sans 3) no longer describe it.
import { describe, expect, test } from "vitest";
import { tokens } from "../../tokens/generated/tokens";
import { diagramBox, edgeLabel } from "../../src/pieces/library.ts";
import { g, type SvgNode } from "../../src/pieces/node.ts";
import { stageAt, withSansFamily } from "../../src/scenes/circuit-breaker-topology/stage";

const LOADED = "Loaded Sans, sans-serif";
const families = (node: SvgNode, out: string[] = []): string[] => {
  if (node.attrs["font-family"] !== undefined) out.push(String(node.attrs["font-family"]));
  for (const child of node.children) if (typeof child !== "string") families(child, out);
  return out;
};

describe("Topology words in the loaded faces", () => {
  test("Sans mapped, mono kept", () => {
    const box = diagramBox({ x: 0, y: 0, width: 200, height: 80, text: ["Payment"], textSize: 33 });
    const label = edgeLabel({ x: 0, y: 120, lines: ["`circuit-breaker:` execute"], textSize: 33, anchor: "start" });
    const tree = g({}, ...box.body, ...box.text, ...label.body, ...label.text);
    const before = families(tree);
    expect(before).toContain(tokens.font.sans);
    expect(before).toContain(tokens.font.mono);
    const after = families(withSansFamily(tree, LOADED));
    expect(after).not.toContain(tokens.font.sans);
    expect(after).toContain(LOADED);
    expect(after.filter((f) => f === tokens.font.mono)).toHaveLength(before.filter((f) => f === tokens.font.mono).length);
    expect(after).toHaveLength(before.length);
  });

  test("Every sans word of the stage mapped", () => {
    for (const frame of [389, 949, 1919]) {
      const { below, above } = stageAt(frame);
      for (const layer of [below, above]) {
        const before = families(layer);
        expect(before, `frame ${frame}`).toContain(tokens.font.sans);
        expect(families(withSansFamily(layer, LOADED)), `frame ${frame}`).not.toContain(tokens.font.sans);
      }
    }
  });
});

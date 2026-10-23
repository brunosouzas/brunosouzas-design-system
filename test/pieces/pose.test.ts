// Unit tests of animation by parameter (spec illustration-pieces, "Animation
// by parameter", "Pose parameters checked", "Frame by frame"; tasks 2.3).
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { robot } from "../../src/pieces/library";
import { g } from "../../src/pieces/node";
import { pose } from "../../src/pieces/pose";
import { toReact } from "../../src/pieces/react";
import { toSvg } from "../../src/pieces/render";
import { normalForm } from "./normal-form";

const body = () => g({}, ...robot({ cx: 400, top: 148 }).body);

describe("Animation by parameter", () => {
  test("Squash keeps the base", () => {
    const posed = pose(body(), { x: 400, y: 300, squash: 1.21 });
    expect(posed.attrs.transform).toBe("translate(400 300) rotate(0) scale(0.9090909090909091 1.21) translate(-400 -300)");
    expect(posed.attrs.opacity).toBeUndefined();
  });

  test("Identity", () => {
    const node = body();
    expect(pose(node, { x: 400, y: 300 })).toBe(node);
  });
});

describe("Pose parameters checked", () => {
  test("Impossible values", () => {
    expect(() => pose(body(), { x: 0, y: 0, squash: 0 })).toThrow(new RangeError("pose: squash must be greater than 0, found 0"));
    expect(() => pose(body(), { x: 0, y: 0, scale: -1 })).toThrow(/^pose: scale must be greater than 0/);
    expect(() => pose(body(), { x: 0, y: 0, opacity: 1.5 })).toThrow(/^pose: opacity must be within 0 and 1/);
  });

  test("Non-finite values", () => {
    expect(() => pose(body(), { x: 0, y: 0, scale: Number.POSITIVE_INFINITY })).toThrow(/^pose: scale must be a finite number/);
    expect(() => pose(body(), { x: 0, y: 0, tilt: Number.NaN, hop: Number.POSITIVE_INFINITY })).toThrow(/^pose: tilt must be a finite number/);
    // The first offending parameter in order wins, whatever kind of problem it has.
    expect(() => pose(body(), { x: 0, y: 0, squash: 0, hop: Number.POSITIVE_INFINITY })).toThrow(/^pose: squash must be greater than 0/);
  });
});

describe("Frame by frame", () => {
  test("Hop over twenty frames", () => {
    const hops: number[] = [];
    for (let frame = 0; frame < 20; frame++) {
      const hop = 28 * Math.sin((Math.PI * frame) / 12);
      hops.push(hop);
      const tilt = frame % 5;
      const tree = pose(body(), { x: 400, y: 300, hop, tilt });
      if (hop !== 0 || tilt !== 0) expect(tree.attrs.transform).toBe(`translate(400 ${300 - hop}) rotate(${tilt}) scale(1 1) translate(-400 -300)`);
      expect(normalForm(renderToStaticMarkup(toReact(tree)))).toEqual(normalForm(toSvg(tree)));
    }
    expect(hops[6]).toBe(28);
    expect(pose(body(), { x: 400, y: 300, hop: hops[6] }).attrs.transform).toBe("translate(400 272) rotate(0) scale(1 1) translate(-400 -300)");
  });
});

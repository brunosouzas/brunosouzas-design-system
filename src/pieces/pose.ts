// Animation by parameter (spec illustration-pieces, "Animation by
// parameter"): the wrapper of the approved cast motion test. A scene computes
// the numbers from the frame and wraps the piece; the anchor (x, y) is the
// piece's base, usually its feet, so squash and tilt keep it on the ground.
import { g, type SvgNode } from "./node.ts";

export type Pose = {
  x: number;
  y: number;
  /** Degrees, clockwise. */
  tilt?: number;
  /** Vertical stretch; the width shrinks by its square root, so volume reads constant. */
  squash?: number;
  /** Pixels above the base. */
  hop?: number;
  scale?: number;
  /** Horizontal offset in pixels. */
  shake?: number;
  opacity?: number;
};

const finite = (name: string, value: number) => {
  if (!Number.isFinite(value)) throw new RangeError(`pose: ${name} must be a finite number, found ${value}`);
};

export const pose = (node: SvgNode, params: Pose): SvgNode => {
  const { x, y, tilt = 0, squash = 1, hop = 0, scale = 1, shake = 0, opacity = 1 } = params;
  // Each parameter is checked completely (finite, then range) before the next, in this order.
  for (const [name, value] of Object.entries({ x, y, tilt, squash, hop, scale, shake, opacity })) {
    finite(name, value);
    if ((name === "squash" || name === "scale") && value <= 0) throw new RangeError(`pose: ${name} must be greater than 0, found ${value}`);
    if (name === "opacity" && (value < 0 || value > 1)) throw new RangeError(`pose: opacity must be within 0 and 1, found ${value}`);
  }
  if (tilt === 0 && squash === 1 && hop === 0 && scale === 1 && shake === 0 && opacity === 1) return node;
  // Finite inputs can still overflow once combined (scale 1e308 with squash 4).
  const parts = { "x + shake": x + shake, "y - hop": y - hop, "horizontal scale": scale / Math.sqrt(squash), "vertical scale": scale * squash };
  for (const [name, value] of Object.entries(parts)) {
    if (!Number.isFinite(value)) throw new RangeError(`pose: ${name} overflows, found ${value}`);
  }
  const transform = `translate(${parts["x + shake"]} ${parts["y - hop"]}) rotate(${tilt}) scale(${parts["horizontal scale"]} ${parts["vertical scale"]}) translate(${-x} ${-y})`;
  return g(opacity < 1 ? { transform, opacity } : { transform }, node);
};

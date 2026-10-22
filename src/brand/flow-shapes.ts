// Token-driven pure geometry/styles for the generic flow shapes. React wrappers
// consume these descriptors so tests need neither browser nor font network.
import { tokens } from "../../tokens/generated/tokens";
import { blockPopIn, type Point } from "./motion";
export type Bounds = { x: number; y: number; w: number; h: number };
export const flowShape = (kind: "exchange" | "queue" | "container", bounds: Bounds, frame: number, appearAt: number) => {
  const {color, outline, shadow, radius} = tokens;
  const {w, h} = bounds;
  const inset = 22;
  return {
    ...bounds, kind,
    appearance: frame >= appearAt + 90 ? {opacity: 1, scale: 1} : blockPopIn(frame, appearAt),
    fill: color.white, stroke: color.ink, strokeWidth: outline.block,
    shadow: shadow.block, radius: radius.block,
    vertices: kind === "exchange" ? [[h * .26, 0], [w - h * .26, 0], [w, h/2], [w - h * .26, h], [h * .26, h], [0, h/2]] : [],
    rails: kind === "queue" ? [inset, w - inset] : [],
    tab: kind === "container" ? { fill: color.transitional, radius: radius.pill, strokeWidth: outline.small, shadow: shadow.pill } : null,
  };
};
export const positionedTokenStyle = (point: Point, stroke: string = tokens.color.ink) => ({
  point, radius: 17, fill: tokens.color.white, stroke, strokeWidth: tokens.outline.small + 1, shadow: tokens.shadow.small,
});

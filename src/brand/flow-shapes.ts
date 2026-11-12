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
    tab: kind === "container" ? { fill: color.white, radius: radius.pill, strokeWidth: outline.small, shadow: shadow.pill } : null,
  };
};
/** The travelling token's radius when the caller gives none (publish-subscribe draws it). */
export const DEFAULT_TOKEN_RADIUS = 17;

/** What PositionedToken draws: nothing when the path gave no point, else the token style. */
export const positionedTokenDrawing = (point: Point | null, stroke?: string, fill?: string, radius?: number) =>
  point === null ? null : positionedTokenStyle(point, stroke, fill, radius);

/**
 * The token's style. `radius` is optional (spec motion-components, "Token
 * radius"; change circuit-breaker-topology-scene, design §2.7): without it the
 * token is drawn as before; a radius that is not a finite number above 0
 * throws a RangeError naming `radius`.
 */
export const positionedTokenStyle = (point: Point, stroke: string = tokens.color.ink, fill: string = tokens.color.white, radius: number = DEFAULT_TOKEN_RADIUS) => {
  if (typeof radius !== "number" || !Number.isFinite(radius) || radius <= 0) {
    throw new RangeError(`positionedTokenStyle: radius must be a finite number above 0, found ${String(radius)}`);
  }
  return { point, radius, fill, stroke, strokeWidth: tokens.outline.small + 1, shadow: tokens.shadow.small };
};

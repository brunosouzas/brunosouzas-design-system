// SVG words in the face Remotion loads (spec motion-components, "Sans family
// for SVG words in a frame"; change sdd-scene-1-relay, design §2.5). Moved
// unchanged from src/scenes/circuit-breaker-topology/stage.ts, which
// re-exports it, so both scenes that draw piece trees in a video frame share
// one fix.
//
// Why it exists: the pieces name the sans face with the `font.sans` token stack
// ("Source Sans 3", ADR 0008, the name their embedded fonts use), but
// @remotion/google-fonts registers it as "Source Sans Three", so in a video
// frame the SVG words would fall back to Helvetica. A scene passes fonts.ts's
// `sans`, which starts with the loaded family; the monospace face is
// registered under its own name and is left as is.
//
// No React and no Remotion here, so tests import it without loading fonts.
// What can go wrong: nothing throws; a tree without the sans stack comes back
// equal to the input.
import { tokens } from "../../tokens/generated/tokens";
import type { SvgNode } from "../pieces/node.ts";

/** The tree with every `font-family` that names the sans token stack replaced by `family`; the input is not modified. */
export const withSansFamily = (node: SvgNode, family: string): SvgNode => ({
  ...node,
  attrs: node.attrs["font-family"] === tokens.font.sans ? { ...node.attrs, "font-family": family } : node.attrs,
  children: node.children.map((child) => (typeof child === "string" ? child : withSansFamily(child, family))),
});

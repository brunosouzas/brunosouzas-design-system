// The SDD scene 3, the archive (card 144; change sdd-scene-3-archive): on the
// stage scenes 1-2 left, the first change's folder is archived with no actor
// acting, and the living `book` gains "exactly two fields"; days later a
// second request breaks that promise (a jolt of the book, surfaced by the
// proposal); a single minor finding is flagged and fixed on the second
// folder (no `NO-GO` anywhere); Balão's `GO` lands; Visor's `worked` emote
// plays the implementation; the second folder is archived too, and only then
// does the field-count pill read "exactly three fields". Chaves, beside the
// book the whole time, settles into `done`.
//
// This file only draws: what is where at a frame comes from frame.ts
// (frameAt) and stage.ts (stageOf). Layers, bottom to top (design §6.2,
// SCN-6): 1 Rings; 2 the dashed guide of the GO's trip (composition pixels);
// 3-7 the stage layers book, folders, cast, verdict and above, in 960 x 540
// stage units over the 1920 x 1080 composition. No component here reads the
// frame except `Rings`; the composition's `lang` is ignored (a neutral
// scene). The stage's words go through `withSansFamily`, so they draw in the
// face Remotion loads.
//
// Review: `npm run stills -- sdd-scene-3-archive`, `npm run studio`.
// Rendering needs the network (fonts.ts loads Source Sans 3).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { tokens } from "../../../tokens/generated/tokens";
import { MotionPath, Rings } from "../../brand/components";
import { sans } from "../../brand/fonts";
import { withSansFamily } from "../../brand/svg-fonts";
import type { SvgNode } from "../../pieces/node.ts";
import { toReact } from "../../pieces/react.ts";
import type { SceneProps } from "../circuit-breaker-states/Scene.tsx";
import { frameAt } from "./frame";
import { GUIDES, RINGS_CENTRE, STAGE, STAGE_SCALE, scalePath } from "./layout";
import { STAGE_LAYERS, stageOf } from "./stage";
import { timeline } from "./timeline";

const WIDTH = STAGE.width * STAGE_SCALE;
const HEIGHT = STAGE.height * STAGE_SCALE;
const GUIDE_D = scalePath(GUIDES.go);

/** One stage layer: its piece tree in a 960 x 540 viewBox filling the composition. */
const StageLayer: React.FC<{ node: SvgNode }> = ({ node }) => (
  <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${STAGE.width} ${STAGE.height}`} style={{ position: "absolute", inset: 0 }}>
    {toReact(withSansFamily(node, sans))}
  </svg>
);

export const SddScene3ArchiveScene: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const state = frameAt(frame);
  const stage = stageOf(state);
  return (
    <AbsoluteFill style={{ background: tokens.color.panel, fontFamily: sans }}>
      <Rings width={WIDTH} height={HEIGHT} cx={RINGS_CENTRE.x} cy={RINGS_CENTRE.y} fade={timeline.ringsFade} />
      <MotionPath d={GUIDE_D} opacity={state.paths.go} width={WIDTH} height={HEIGHT} />
      {STAGE_LAYERS.map((name) => <StageLayer key={name} node={stage[name]} />)}
    </AbsoluteFill>
  );
};

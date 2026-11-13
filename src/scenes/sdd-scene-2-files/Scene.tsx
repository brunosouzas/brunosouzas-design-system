// The SDD scene 2, the files (card 144; change sdd-scene-2-files): on scene 1's
// stage, Chaves types and the `openspec/` folder appears; Visor points and the
// change's four files come out of it; `proposal.md` lists six `?` and Balão
// answers them. Then, with nobody on stage acting, two reviews flag rows of
// `spec.md` and `tasks.md` and stamp NO-GO, each followed by a fix; Balão's GO
// lands on the change, and only then does Visor write the code.
//
// This file only draws: what is where at a frame comes from frame.ts (frameAt)
// and stage.ts (stageOf). Layers, bottom to top (design §6.2, SCN-6): 1 Rings;
// 2 the dashed guide of the GO's trip (composition pixels); 3–8 the stage
// layers below, folder, files, cast, verdicts and above, in 960 × 540 stage
// units over the 1920 × 1080 composition. No component here reads the frame
// except `Rings`; the composition's `lang` is ignored (a neutral scene). The
// stage's words go through `withSansFamily`, so they draw in the face Remotion
// loads.
//
// Review: `npm run stills -- sdd-scene-2-files`, `npm run studio`. Rendering
// needs the network (fonts.ts loads Source Sans 3).
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

/** One stage layer: its piece tree in a 960 × 540 viewBox filling the composition. */
const StageLayer: React.FC<{ node: SvgNode }> = ({ node }) => (
  <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${STAGE.width} ${STAGE.height}`} style={{ position: "absolute", inset: 0 }}>
    {toReact(withSansFamily(node, sans))}
  </svg>
);

export const SddScene2FilesScene: React.FC<SceneProps> = () => {
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

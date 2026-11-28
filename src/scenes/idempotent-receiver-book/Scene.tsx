// The Idempotent Receiver book scene (card SW-160; change
// idempotent-receiver-book-scene): the pattern as the book describes it, one
// stage played twice. Take 1: the sender sends order 42, the channel delivers
// it once, the receiver looks up its processed IDs, processes the message and
// stores 42. A rewind. Take 2: the same order, sent once, is delivered twice;
// the first delivery is processed as in take 1, the second is found in the
// store and ignored, and take 2 ends with take 1's effect.
//
// This file only draws: what is where at a frame comes from frame.ts (frameAt)
// and stage.ts (stageOf). Layers, bottom to top (design §6.2, SCN-6): 1 Rings;
// 2 the dashed guides P1, P2, P3 (composition pixels); 3–6 the stage layers
// below, nodes, tokens and above, in 960 × 540 stage units over the
// 1920 × 1080 composition. No component here reads the frame except `Rings`;
// the composition's `lang` is ignored (a neutral scene). The stage's words go
// through `withSansFamily`, so they draw in the face Remotion loads.
//
// Review: `npm run stills -- idempotent-receiver-book`, `npm run studio`.
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
const GUIDE_D = { p1: scalePath(GUIDES.p1), p2: scalePath(GUIDES.p2), p3: scalePath(GUIDES.p3) } as const;

/** One stage layer: its piece tree in a 960 × 540 viewBox filling the composition. */
const StageLayer: React.FC<{ node: SvgNode }> = ({ node }) => (
  <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${STAGE.width} ${STAGE.height}`} style={{ position: "absolute", inset: 0 }}>
    {toReact(withSansFamily(node, sans))}
  </svg>
);

export const IdempotentReceiverBookScene: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const state = frameAt(frame);
  const stage = stageOf(state);
  return (
    <AbsoluteFill style={{ background: tokens.color.panel, fontFamily: sans }}>
      <Rings width={WIDTH} height={HEIGHT} cx={RINGS_CENTRE.x} cy={RINGS_CENTRE.y} fade={timeline.ringsFade} />
      {(["p1", "p2", "p3"] as const).map((id) => (
        <MotionPath key={id} d={GUIDE_D[id]} opacity={state.paths[id]} width={WIDTH} height={HEIGHT} />
      ))}
      {STAGE_LAYERS.map((name) => <StageLayer key={name} node={stage[name]} />)}
    </AbsoluteFill>
  );
};

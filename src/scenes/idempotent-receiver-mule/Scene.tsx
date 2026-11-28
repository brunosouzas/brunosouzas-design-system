// The Idempotent Receiver Mule scene (card SW-160; change
// idempotent-receiver-mule-scene): the trap of the page's caveat, one stage
// played twice. Take 1: Balão asks for the charge of an order; the Idempotent
// Message Validator stores the `orderId`, the charge goes through and the
// answer is 200; the retry gets 409. A rewind. Take 2: storing the charge
// fails, the answer is 500 and the `orderId` stays in the store; the retry
// gets the same 409, and the statement ends at 0 beside take 1's 1.
//
// This file only draws: what is where at a frame comes from frame.ts (frameAt)
// and stage.ts (stageOf). Layers, bottom to top (design §6.2, SCN-6): 1 Rings;
// 2 the dashed guides P1 to P4 (composition pixels); 3–7 the stage layers
// below, nodes, cast, tokens and above, in 960 × 540 stage units over the
// 1920 × 1080 composition. No component here reads the frame except `Rings`;
// the composition's `lang` is ignored (a neutral scene). The stage's words go
// through `withSansFamily`, so they draw in the face Remotion loads.
//
// Review: `npm run stills -- idempotent-receiver-mule`, `npm run studio`.
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
const GUIDE_IDS = ["p1", "p2", "p3", "p4"] as const;
const GUIDE_D = Object.fromEntries(GUIDE_IDS.map((id) => [id, scalePath(GUIDES[id])])) as Record<(typeof GUIDE_IDS)[number], string>;

/** One stage layer: its piece tree in a 960 × 540 viewBox filling the composition. */
const StageLayer: React.FC<{ node: SvgNode }> = ({ node }) => (
  <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${STAGE.width} ${STAGE.height}`} style={{ position: "absolute", inset: 0 }}>
    {toReact(withSansFamily(node, sans))}
  </svg>
);

export const IdempotentReceiverMuleScene: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const state = frameAt(frame);
  const stage = stageOf(state);
  return (
    <AbsoluteFill style={{ background: tokens.color.panel, fontFamily: sans }}>
      <Rings width={WIDTH} height={HEIGHT} cx={RINGS_CENTRE.x} cy={RINGS_CENTRE.y} fade={timeline.ringsFade} />
      {GUIDE_IDS.map((id) => (
        <MotionPath key={id} d={GUIDE_D[id]} opacity={state.paths[id]} width={WIDTH} height={HEIGHT} />
      ))}
      {STAGE_LAYERS.map((name) => <StageLayer key={name} node={stage[name]} />)}
    </AbsoluteFill>
  );
};

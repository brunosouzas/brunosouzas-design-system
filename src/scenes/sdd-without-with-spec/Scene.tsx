// The SDD scene 1, "without and with a spec" (card 144; change
// sdd-without-with-spec-scene): one request played twice on one stage. Take 1,
// the agent answers the open questions alone inside the code and an error comes
// back; a rewind; take 2, the questions go into `proposal.md`, the requester
// answers and stamps GO, and only then does the agent implement.
//
// This file only draws: what is where at a frame comes from takes.ts (frameAt)
// and stage.ts (stageOf). Layers, bottom to top (design §6, SCN-6): 1 Rings;
// 2 the dashed paths P1–P3 (composition pixels); 3 the stage pieces; 4 the `?`;
// 5 the answer tokens; 6 the emote. Layers 3, 4 and 6 are drawn in 960 × 540
// stage units over the 1920 × 1080 composition. No component here reads the
// frame except `Rings`; the composition's `lang` is ignored (a neutral scene).
//
// Review: `npm run stills -- sdd-without-with-spec`, `npm run studio`. Rendering
// needs the network (fonts.ts loads Source Sans 3).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { tokens } from "../../../tokens/generated/tokens";
import { MotionPath, Rings } from "../../brand/components";
import { PositionedToken } from "../../brand/flow-components";
import { sans } from "../../brand/fonts";
import type { SvgNode } from "../../pieces/node.ts";
import { toReact } from "../../pieces/react.ts";
import type { SceneProps } from "../circuit-breaker-states/Scene.tsx";
import { PATHS, RINGS_CENTRE, STAGE, STAGE_SCALE, scalePath } from "./layout";
import { stageOf } from "./stage";
import { frameAt } from "./takes";
import { timeline } from "./timeline";

const WIDTH = STAGE.width * STAGE_SCALE;
const HEIGHT = STAGE.height * STAGE_SCALE;
const COMPOSITION_PATHS = { p1: scalePath(PATHS.p1), p2: scalePath(PATHS.p2), p3: scalePath(PATHS.p3) } as const;

/** One stage layer: its piece tree in a 960 × 540 viewBox filling the composition. */
const StageLayer: React.FC<{ node: SvgNode }> = ({ node }) => (
  <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${STAGE.width} ${STAGE.height}`} style={{ position: "absolute", inset: 0 }}>
    {toReact(node)}
  </svg>
);

export const SddWithoutWithSpecScene: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const state = frameAt(frame);
  const stage = stageOf(state);
  return (
    <AbsoluteFill style={{ background: tokens.color.panel, fontFamily: sans }}>
      <Rings width={WIDTH} height={HEIGHT} cx={RINGS_CENTRE.x} cy={RINGS_CENTRE.y} fade={timeline.ringsFade} />
      {(["p1", "p2", "p3"] as const).map((id) => (
        <MotionPath key={id} d={COMPOSITION_PATHS[id]} opacity={state.paths[id]} width={WIDTH} height={HEIGHT} />
      ))}
      <StageLayer node={stage.pieces} />
      <StageLayer node={stage.tokens} />
      {/* The answers in stage units: the token's own SVG at 960 × 540, scaled × 2 like the stage. */}
      <div style={{ position: "absolute", left: 0, top: 0, width: STAGE.width, height: STAGE.height, transform: `scale(${STAGE_SCALE})`, transformOrigin: "0 0" }}>
        {state.answers.map((answer) => (
          <PositionedToken key={answer.id} point={answer.point} fill={tokens.color.state.caller} stroke={tokens.color.ink} width={STAGE.width} height={STAGE.height} />
        ))}
      </div>
      <StageLayer node={stage.emote} />
    </AbsoluteFill>
  );
};

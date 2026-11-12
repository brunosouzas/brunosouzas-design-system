// The circuit-breaker topology scene (card 334; change
// circuit-breaker-topology-scene): one checkout and one payment service, played
// twice. Take 1, retry only: 20 requests become 60 backend calls and the
// service goes down. A rewind. Take 2: `circuit-breaker:execute` wraps the
// call, opens at 5 of 5 failures, fails fast, tests recovery on its own,
// closes, ignores one timeout and a `400`, and ends healthy.
//
// This file only draws: what is where at a frame comes from frame.ts (frameAt)
// and stage.ts (stageOf, componentsOf). Layers, bottom to top (design §6.2,
// SCN-6): 1 Rings; 2 the drop path (composition pixels); 3 the stage pieces
// below (arrows, then Checkout, Payment and the breaker); 4 the window, the
// bar and the clock; 5 the tokens; 6 the stage pieces above (labels, pills,
// tags, counters, badge). Layers 3 and 6 are SVG in 960 × 540 stage units over
// the 1920 × 1080 composition; layers 4 and 5 are the React components in a
// 960 × 540 box scaled × 2. No component here reads the frame except `Rings`
// and `CallSquare` (its own pop); the composition's `lang` is ignored (a
// neutral scene).
//
// Review: `npm run stills -- circuit-breaker-topology`, `npm run studio`.
// Rendering needs the network (fonts.ts loads Source Sans 3 and Source Code Pro).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { tokens } from "../../../tokens/generated/tokens";
import { CallSquare, Countdown, MotionPath, Rings } from "../../brand/components";
import { PositionedToken } from "../../brand/flow-components";
import { sans } from "../../brand/fonts";
import { FailureRateBar } from "../../brand/rate-bar";
import type { SvgNode } from "../../pieces/node.ts";
import { toReact } from "../../pieces/react.ts";
import type { SceneProps } from "../circuit-breaker-states/Scene.tsx";
import { frameAt, type Appear } from "./frame";
import { ANCHORS, DROP_PATH, RINGS_CENTRE, STAGE, STAGE_SCALE, compositionPath } from "./layout";
import { componentsOf, stageOf, withSansFamily, type SquareProps } from "./stage";
import { timeline } from "./timeline";

const WIDTH = STAGE.width * STAGE_SCALE;
const HEIGHT = STAGE.height * STAGE_SCALE;
const DROP_D = compositionPath(DROP_PATH);

/** One stage layer: its piece tree in a 960 × 540 viewBox filling the composition. */
const StageLayer: React.FC<{ node: SvgNode }> = ({ node }) => (
  <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${STAGE.width} ${STAGE.height}`} style={{ position: "absolute", inset: 0 }}>
    {toReact(withSansFamily(node, sans))}
  </svg>
);

/** The 960 × 540 box the components draw in, scaled to the composition (design §2.3). */
const ComponentBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: STAGE.width, height: STAGE.height, transform: `scale(${STAGE_SCALE})`, transformOrigin: "0 0" }}>{children}</div>
);

/** A group popping about `anchor` at an extra `opacity` (design §2.6). */
const Popped: React.FC<{ appear: Appear; anchor: { x: number; y: number }; opacity?: number; children: React.ReactNode }> = ({ appear, anchor, opacity = 1, children }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      opacity: appear.opacity * opacity,
      transform: `translate(${anchor.x}px, ${anchor.y}px) scale(${appear.scale}) translate(${-anchor.x}px, ${-anchor.y}px)`,
      transformOrigin: "0 0",
    }}
  >
    {children}
  </div>
);

const Square: React.FC<{ square: SquareProps }> = ({ square }) => (
  <div style={{ position: "absolute", left: square.x, top: square.y, opacity: square.opacity }}>
    <CallSquare kind={square.kind} size={square.size} appearAt={square.appearAt} />
  </div>
);

export const CircuitBreakerTopologyScene: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const state = frameAt(frame);
  const stage = stageOf(state);
  const parts = componentsOf(state);
  return (
    <AbsoluteFill style={{ background: tokens.color.panel, fontFamily: sans }}>
      <Rings width={WIDTH} height={HEIGHT} cx={RINGS_CENTRE.x} cy={RINGS_CENTRE.y} fade={timeline.ringsFade} />
      <MotionPath d={DROP_D} opacity={state.dropPath} width={WIDTH} height={HEIGHT} />
      <StageLayer node={stage.below} />
      <ComponentBox>
        {parts.window === null ? null : (
          <Popped appear={parts.window.appear} anchor={ANCHORS.window} opacity={parts.window.opacity}>
            {parts.window.squares.map((square) => <Square key={square.id} square={square} />)}
            <div style={{ position: "absolute", left: parts.window.bar.x, top: parts.window.bar.y }}>
              <FailureRateBar rate={parts.window.bar.rate} threshold={parts.window.bar.threshold} width={parts.window.bar.width} height={parts.window.bar.height} />
            </div>
          </Popped>
        )}
        {parts.dropped === null ? null : (
          <Popped appear={parts.dropped.appear} anchor={{ x: parts.dropped.x + parts.dropped.size / 2, y: parts.dropped.y + parts.dropped.size / 2 }}>
            <Square square={parts.dropped} />
          </Popped>
        )}
        {parts.clock === null ? null : (
          <Popped appear={parts.clock.appear} anchor={{ x: parts.clock.cx, y: parts.clock.cy }} opacity={parts.clock.opacity}>
            <div style={{ position: "absolute", left: parts.clock.cx - parts.clock.size / 2, top: parts.clock.cy - parts.clock.size / 2 }}>
              <Countdown left={parts.clock.left} size={parts.clock.size} />
            </div>
          </Popped>
        )}
      </ComponentBox>
      <ComponentBox>
        {parts.tokens.map((token) => (
          <PositionedToken key={token.id} point={token.point} radius={token.radius} width={STAGE.width} height={STAGE.height} />
        ))}
      </ComponentBox>
      <StageLayer node={stage.above} />
    </AbsoluteFill>
  );
};

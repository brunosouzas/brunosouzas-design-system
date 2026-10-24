// Remotion view of the cast motion test: the pure frame tree rendered with
// toReact. No words on screen, so no font is loaded.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { toReact } from "../../pieces/react";
import { castMotionTestFrame } from "./frames";

export const CastMotionTest: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill>{toReact(castMotionTestFrame(frame))}</AbsoluteFill>;
};

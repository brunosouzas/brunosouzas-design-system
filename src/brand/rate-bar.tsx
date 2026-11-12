// The failure-rate bar (spec motion-components, "Failure-rate bar"; change
// circuit-breaker-topology-scene, design §2.4): draws the shapes of
// rate-bar-shape.ts, track at the SVG's origin, in the units of the box it is
// placed in. It reads no frame: the scene passes the rate of its frame.
//
// Why: the sliding window's failure rate against the circuit breaker's
// threshold, the one shape the topology scene needed that the package lacked.
// What can go wrong: invalid props throw a RangeError (rate-bar-shape.ts).
// Review it with `npm run stills -- circuit-breaker-topology`.
import React from "react";
import { failureRateBarShapes, type FailureRateBarProps } from "./rate-bar-shape";

export const FailureRateBar: React.FC<FailureRateBarProps> = (props) => {
  const { track, fill, tick } = failureRateBarShapes(props);
  return (
    <svg width={track.width} height={track.height} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {[track, fill].map((rect, i) =>
        rect === null ? null : (
          <rect key={i} x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx={rect.radius} fill={rect.fill} stroke={rect.stroke} strokeWidth={rect.strokeWidth} />
        ),
      )}
      <line x1={tick.x} y1={tick.y1} x2={tick.x} y2={tick.y2} stroke={tick.stroke} strokeWidth={tick.strokeWidth} strokeLinecap={tick.linecap} />
    </svg>
  );
};

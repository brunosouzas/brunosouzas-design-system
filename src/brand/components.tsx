// Motion components of the visual language: rings background, ink block with a
// hard offset shadow, pill label, self-drawing arrow, travelling token,
// call-result square and countdown ring (ADR 0001, ADR 0003).
//
// Every colour and every outline, shadow, radius, font and motion value comes
// from the generated tokens; what is visible at a frame comes from motion.ts.
// The numbers left here are the pilot's component constants (design §8): a
// change to any of them is a visual change and needs the owner's approval.
// Never write a colour literal in this folder (test/brand/no-colour-literals).
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { tokens } from "../../tokens/generated/tokens";
import { sans } from "./fonts";
import {
  arrowAt,
  arrowDash,
  callAppearance,
  fadeIn,
  pillPopIn,
  popSpring,
  squarePopScale,
  tokenPositions,
  type Appearance,
  type CallAppearance,
  type SlotKind,
} from "./motion";

const { color, font, outline, radius, shadow } = tokens;

// Component constants (design §8).
const RING_FIRST_RADIUS = 100;
const RING_STEP = 34;
const RING_STROKE = 2.5;
/** Rings cover the frame's larger side with 20 % to spare. */
const RING_REACH = 1.2;
const BLOCK_GAP = 18;
const TRAVELLING_TOKEN_RADIUS = 17;
const COUNTDOWN_INNER_STROKE = 10;
/** Gap between the countdown's outer circle and the frame edge, and between its two circles. */
const COUNTDOWN_EDGE = 5;
const COUNTDOWN_INSET = 7;
/** 31 (pilot 22): keeps the static body diagrams' head-to-stroke ratio at the bolder `outline.arrow`. */
const ARROW_HEAD_SIZE = 31;

// Full-bleed light panel with concentric rings (body-diagram background).
export const Rings: React.FC<{
  width: number;
  height: number;
  cx: number;
  cy: number;
  fade: readonly [number, number];
}> = ({ width, height, cx, cy, fade }) => {
  const frame = useCurrentFrame();
  const opacity = fadeIn(frame, fade);
  const radii: number[] = [];
  for (let r = RING_FIRST_RADIUS; r < Math.max(width, height) * RING_REACH; r += RING_STEP) radii.push(r);
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
      <rect width={width} height={height} fill={color.panel} />
      <g fill="none" stroke={color.ring} strokeWidth={RING_STROKE} opacity={opacity}>
        {radii.map((r) => (
          <circle key={r} cx={cx} cy={cy} r={r} />
        ))}
      </g>
    </svg>
  );
};

// Flat block with ink outline and hard offset shadow (STY-1). Opacity and scale
// are its pop-in times its focus (motion.blockAppearance).
export const InkBlock: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  appearance: Appearance;
  children?: React.ReactNode;
}> = ({ x, y, w, h, fill, appearance, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      background: fill,
      border: `${outline.block}px solid ${color.ink}`,
      borderRadius: radius.block,
      boxShadow: `${shadow.block}px ${shadow.block}px 0 ${color.ink}`,
      transform: `scale(${appearance.scale})`,
      opacity: appearance.opacity,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: BLOCK_GAP,
      fontFamily: sans,
      color: color.ink,
      boxSizing: "border-box",
    }}
  >
    {children}
  </div>
);

// White pill with outline and shadow; lines of text, the last line may be small.
export const Pill: React.FC<{
  cx: number;
  cy: number;
  lines: readonly string[];
  small?: string;
  size: number;
  appearAt: number;
  accent?: string;
}> = ({ cx, cy, lines, small, size, appearAt, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = pillPopIn(frame, appearAt, fps);
  if (!pop.visible) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: cx,
        top: cy,
        transform: `translate(-50%, -50%) scale(${pop.scale})`,
        opacity: pop.opacity,
        background: color.white,
        border: `${outline.small}px solid ${accent ?? color.ink}`,
        borderRadius: radius.pill,
        boxShadow: `${shadow.pill}px ${shadow.pill}px 0 ${accent ?? color.ink}`,
        padding: `${size * 0.35}px ${size * 0.8}px`,
        fontFamily: sans,
        color: color.ink,
        textAlign: "center",
        whiteSpace: "nowrap",
        lineHeight: 1.18,
      }}
    >
      {lines.map((line) => (
        <div key={line} style={{ fontSize: size, fontWeight: font.weightHeavy }}>
          {line}
        </div>
      ))}
      {small ? <div style={{ fontSize: size * 0.78, fontWeight: font.weightBold, marginTop: 2 }}>{small}</div> : null}
    </div>
  );
};

// A token travelling along a transition each time it fires. Keep pills off the
// straight part of an arrow, or the token spends most of its trip hidden.
export const Tokens: React.FC<{ d: string; fires: readonly number[]; stroke?: string; width: number; height: number }> = ({
  d,
  fires,
  stroke = color.ink,
  width,
  height,
}) => {
  const frame = useCurrentFrame();
  const points = tokenPositions(frame, d, fires);
  if (points.length === 0) return null;
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x + shadow.small} cy={p.y + shadow.small} r={TRAVELLING_TOKEN_RADIUS} fill={color.ink} />
          <circle cx={p.x} cy={p.y} r={TRAVELLING_TOKEN_RADIUS} fill={color.white} stroke={stroke} strokeWidth={outline.small + 1} />
        </g>
      ))}
    </svg>
  );
};

// Arrowhead marker shared by transition arrows and the start marker.
export const ArrowHead: React.FC<{ id: string; fill: string }> = ({ id, fill }) => (
  <marker
    id={id}
    viewBox="0 0 10 10"
    refX="8"
    refY="5"
    markerWidth={ARROW_HEAD_SIZE}
    markerHeight={ARROW_HEAD_SIZE}
    markerUnits="userSpaceOnUse"
    orient="auto"
  >
    <path d="M0,0.5 L10,5 L0,9.5 L3,5 Z" fill={fill} />
  </marker>
);

// Transition arrow, drawn once from `drawAt`; the head shows only when fully drawn.
export const Arrow: React.FC<{
  d: string;
  drawAt: number;
  stroke?: string;
  width: number;
  height: number;
}> = ({ d, drawAt, stroke = color.ink, width, height }) => {
  const frame = useCurrentFrame();
  const arrow = arrowAt(frame, drawAt);
  if (!arrow.visible) return null;
  const dash = arrowDash(d, arrow.progress);
  const id = `m-${stroke.slice(1)}`;
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <ArrowHead id={id} fill={stroke} />
      </defs>
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={outline.arrow}
        strokeLinecap="round"
        strokeDasharray={dash.strokeDasharray}
        strokeDashoffset={dash.strokeDashoffset}
        markerEnd={arrow.head ? `url(#${id})` : undefined}
      />
    </svg>
  );
};

// A call result: a square with a glyph (ok, fail, blocked) or a dashed empty slot.
export const CallSquare: React.FC<{ kind: SlotKind; size: number; appearAt: number; look?: CallAppearance }> = ({ kind, size, appearAt, look: override }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const look = override ?? callAppearance(kind);
  const pop = kind === "empty" ? 1 : popSpring(frame, appearAt, fps);
  const visible = kind === "empty" || frame >= appearAt;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius.small,
        border: `${outline.small}px ${look.dashed ? "dashed" : "solid"} ${color.ink}`,
        background: visible ? look.fill : "transparent",
        boxShadow: look.shadow && visible ? `${shadow.small}px ${shadow.small}px 0 ${color.ink}` : "none",
        transform: `scale(${visible ? squarePopScale(pop) : 1})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.62,
        fontWeight: font.weightHeavy,
        color: look.glyphColor,
        boxSizing: "border-box",
        opacity: look.opacity,
      }}
    >
      {visible ? look.glyph : ""}
    </div>
  );
};

// Countdown ring: the wait before a retry (resetTimeout). `left` is 1 when full, 0 when empty.
export const Countdown: React.FC<{ left: number; size: number }> = ({ left, size }) => {
  const r = size / 2 - COUNTDOWN_EDGE;
  const c = 2 * Math.PI * r;
  const inner = r - COUNTDOWN_INSET;
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill={color.white} stroke={color.ink} strokeWidth={outline.small} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={inner}
        fill="none"
        stroke={color.ink}
        strokeWidth={COUNTDOWN_INNER_STROKE}
        strokeDasharray={`${2 * Math.PI * inner * left} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
};

// Generic flow-shape wrappers; supplied bounds/content carry no broker semantics.
// Run Studio or npm run stills. Pure descriptors are tested without loading Lato.
import React from "react";
import { useCurrentFrame } from "remotion";
import { tokens } from "../../tokens/generated/tokens";
import { sans } from "./fonts";
import { flowShape, positionedTokenStyle, type Bounds } from "./flow-shapes";
import type { Point } from "./motion";

type ShapeProps = Bounds & { appearAt: number; children?: React.ReactNode };
const Shape: React.FC<ShapeProps & {kind: "exchange" | "queue" | "container"}> = ({kind, appearAt, children, ...bounds}) => {
  const frame = useCurrentFrame();
  const s = flowShape(kind, bounds, frame, appearAt);
  const polygon = s.vertices.map(p => p.join(",")).join(" ");
  return <div style={{position: "absolute", left:s.x, top:s.y, width:s.w, height:s.h, opacity:s.appearance.opacity, transform:`scale(${s.appearance.scale})`, fontFamily:sans, color:s.stroke}}>
    <svg width={s.w + s.shadow + s.strokeWidth} height={s.h + s.shadow + s.strokeWidth} style={{position:"absolute", overflow:"visible"}}>
      {kind === "exchange" ? <>
        <polygon points={polygon} transform={`translate(${s.shadow},${s.shadow})`} fill={s.stroke}/>
        <polygon points={polygon} fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth} strokeLinejoin="round"/>
      </> : <>
        <rect x={s.shadow} y={s.shadow} width={s.w} height={s.h} rx={s.radius} fill={s.stroke}/>
        <rect width={s.w} height={s.h} rx={s.radius} fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth}/>
        {s.rails.map(x => <path key={x} d={`M${x},4 V${s.h-4}`} stroke={s.stroke} strokeWidth={tokens.outline.small}/>)}
      </>}
    </svg>
    {children}
  </div>;
};
export const Exchange: React.FC<ShapeProps> = props => <Shape {...props} kind="exchange"/>;
export const Queue: React.FC<ShapeProps> = props => <Shape {...props} kind="queue"/>;
/** Label can be drawn separately above routes/tokens by the scene's layer order. */
export const TaggedContainer: React.FC<ShapeProps & { label?: string }> = ({label, children, ...props}) => <Shape {...props} kind="container">{children}{label ? <ContainerTab label={label}/> : null}</Shape>;
export const ContainerTab: React.FC<{label:string}> = ({label}) => {
  const {color, outline, shadow, radius, font} = tokens;
  return <div style={{position:"absolute", left:20, top:-28, background:color.transitional, border:`${outline.small}px solid ${color.ink}`, boxShadow:`${shadow.pill}px ${shadow.pill}px 0 ${color.ink}`, borderRadius:radius.pill, padding:"6px 24px", fontFamily:sans, fontSize:30, fontWeight:font.weightHeavy, whiteSpace:"nowrap"}}>{label}</div>;
};
export const PositionedToken: React.FC<{point:Point | null; stroke?:string; fill?:string; width:number; height:number}> = ({point, stroke, fill, width,height}) => {
  if (!point) return null;
  const s = positionedTokenStyle(point, stroke, fill);
  return <svg width={width} height={height} style={{position:"absolute", inset:0, overflow:"visible"}}>
    <circle cx={point.x+s.shadow} cy={point.y+s.shadow} r={s.radius} fill={tokens.color.ink}/>
    <circle cx={point.x} cy={point.y} r={s.radius} fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth}/>
  </svg>;
};

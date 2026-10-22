// Pub-sub view: pure frame ownership drives tokens and marks. Draw order keeps
// tokens above bodies and below labels; no active-state dimming or invented words.
// Review with npm run stills -- publish-subscribe; fonts/browser need network.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Arrow, CallSquare, InkBlock, Rings } from "../../brand/components";
import { Exchange, Queue, TaggedContainer, ContainerTab, PositionedToken } from "../../brand/flow-components";
import { sans } from "../../brand/fonts";
import { blockPopIn, pillPopIn, pointAlong } from "../../brand/motion";
import { tokens } from "../../../tokens/generated/tokens";
import type { Format, Lang } from "../catalogue";
import { consumers, consumerLines, layouts } from "./layout";
import { frameAt } from "./flow";
import { text } from "./text";
import { timeline } from "./timeline";
const {color,font}=tokens;
const settledPop = (frame:number, at:number) => frame >= at+90 ? {opacity:1,scale:1} : blockPopIn(frame,at);
export const PublishSubscribeScene:React.FC<{lang:Lang;format:Format}> = ({lang,format}) => {
  const frame=useCurrentFrame();
  const l=layouts[format], t=text[lang], state=frameAt(frame);
  const appIds=["api",...consumers];
  return <AbsoluteFill style={{background:color.panel,fontFamily:sans,color:color.ink}}>
    <Rings width={l.width} height={l.height} cx={l.width/2} cy={l.height/2} fade={timeline.ringsFade}/>
    <TaggedContainer {...l.mq} appearAt={14}/>
    {timeline.routes.map(route=><Arrow key={route.id} d={l.arrows[route.id]} drawAt={route.drawAt} stroke={route.id==="invoice-return"?color.failure:color.ink} width={l.width} height={l.height}/>)}
    <Exchange {...l.boxes.exchange} appearAt={22}>
      <div style={{position:"absolute",top:18,width:"100%",textAlign:"center",fontSize:l.size.name,fontWeight:font.weightHeavy,lineHeight:1.05}}>{t.exchange}</div>
      <div style={{position:"absolute",top:format==="4x5"?75:83,width:"100%",textAlign:"center",fontSize:l.size.label,fontFamily:font.mono,fontWeight:font.weightBold}}>{t.exchangeId}</div>
    </Exchange>
    {consumers.map((id,i)=><Queue key={id} {...l.boxes[`${id}-queue`]} appearAt={26}>
      <div style={{position:"absolute",left:28,right:28,top:10,textAlign:"center",fontSize:l.size.label,fontFamily:font.mono,fontWeight:font.weightBold,whiteSpace:"nowrap"}}>{t.queueIds[i]}</div>
      <div style={{position:"absolute",top:48,width:"100%",textAlign:"center",fontSize:l.size.label,fontWeight:font.weightBold}}>{t.queue}</div>
    </Queue>)}
    {appIds.map(id=>{
      const b=l.boxes[id], index=consumers.indexOf(id as typeof consumers[number]);
      const lines=id==="api"?[t.api]:consumerLines(lang,format,index);
      const footer=l.docks[id].y-b.y;
      return <InkBlock key={id} {...b} fill={state.fills[id]} appearance={settledPop(frame,timeline.popIn[id])}>
        <div style={{position:"absolute",top:format==="16x9"&&id!=="api"?4:8,left:10,right:10,textAlign:"center",fontSize:l.size.name,lineHeight:1,fontWeight:font.weightHeavy}}>{lines.map(line=><div key={line}>{line}</div>)}</div>
        <div style={{position:"absolute",top:footer-18,left:id==="api"?80:format==="4x5"?48:70,right:id==="api"?50:format==="4x5"?48:70,textAlign:"center",fontSize:l.size.label,whiteSpace:"nowrap",fontWeight:font.weightBold}}>{t.subtitle}</div>
      </InkBlock>;
    })}
    {state.tokens.map(item=>{
      const point=item.route ? pointAlong(l.routes[item.route],item.progress ?? 0) : item.node ? l.docks[item.node] : null;
      return <PositionedToken key={item.copy} point={point} stroke={item.stroke} fill={item.fill} width={l.width} height={l.height}/>;
    })}
    {timeline.routes.filter(route=>route.labelAt!==undefined).map(route=>{
      const at=route.labelAt!, p=l.labels[route.id], pop=frame>=at+90?{opacity:1,scale:1}:pillPopIn(frame,at);
      const label=route.id==="publish"?t.publish:route.id.endsWith("binding")?t.binding:t.subscriber;
      return <div key={route.id} style={{position:"absolute",left:p.x,top:p.y,transform:`translate(-50%,-50%) scale(${pop.scale})`,opacity:pop.opacity,fontSize:l.size.label,fontWeight:font.weightBold,whiteSpace:"nowrap"}}>{label}</div>;
    })}
    {state.marks.map(mark=>{
      const b=l.boxes[mark.node], dock=l.docks[mark.node];
      // The failure cross mirrors the ACK check: same size, same inset from the
      // block's right edge as the check's from its left, beside the subtitle.
      const p=mark.kind==="fail"?{x:b.x+b.w-(dock.x-b.x),y:dock.y}:dock;
      return <div key={mark.node} style={{position:"absolute",left:p.x-l.size.square/2,top:p.y-l.size.square/2,width:l.size.square,height:l.size.square}}><CallSquare kind={mark.kind} appearAt={mark.at} size={l.size.square} look={mark.appearance}/></div>;
    })}
    <div style={{position:"absolute",left:l.mq.x,top:l.mq.y,opacity:settledPop(frame,14).opacity}}><ContainerTab label={t.mq}/></div>
    {state.caption?<div style={{position:"absolute",left:l.caption.x,top:l.caption.y+state.caption.lift,width:l.caption.w,height:l.caption.h,opacity:state.caption.opacity,fontSize:l.size.caption,fontWeight:font.weightBold,lineHeight:1.15,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center"}}>{t.captions[state.caption.key]}</div>:null}
  </AbsoluteFill>;
};

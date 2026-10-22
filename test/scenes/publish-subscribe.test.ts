// Frozen choreography/provenance and mutation tests. No renderer, fonts or
// network; seeking is evaluated from absolute intervals in any request order.
import {expect,test} from "vitest";
import fixture from "../fixtures/publish-subscribe-text.json";
import {checkFlow,flowCaptionAt,frameAt} from "../../src/scenes/publish-subscribe/flow";
import {timeline,type FlowTimeline} from "../../src/scenes/publish-subscribe/timeline";
import {text} from "../../src/scenes/publish-subscribe/text";
import {publishSubscribe} from "../../src/scenes/publish-subscribe/scene.ts";
import {tokens} from "../../tokens/generated/tokens";
const owners=(frame:number)=>frameAt(frame).tokens.map(t=>[t.copy,t.node??t.route]);
const ids=["payment","inventory","invoice"];
test("Publish confirms exchange acceptance only",()=>{
  expect(owners(99)).toEqual([]);expect(owners(100)).toEqual([["original","publish"]]);
  expect(frameAt(111).tokens[0].progress).toBe(.5);
  expect(owners(122)).toEqual([["original","exchange"]]);
  expect(frameAt(121).marks).toEqual([]);
  expect(frameAt(122).marks.map(m=>[m.node,m.kind])).toEqual([["api","ok"]]);
  expect(timeline.duration).toBe(1000);expect(timeline.outro).toBe(910);
  expect(timeline.phases.map(p=>[p.id,p.from,p.to,p.events.map(e=>[e.id,e.at])])).toEqual([
    ["publish",40,239,[["publish",100],["accepted",122]]],
    ["fanOut",240,469,[["split",280],["queued",302]]],
    ["consume",470,609,[["depart",470],["consume",492],["payment-ack",550],["inventory-ack",580]]],
    ["failure",610,789,[["invoice-failure",610],["return",640],["returned",662]]],
    ["final",790,909,[]],
  ]);
  expect(timeline.popIn).toEqual({api:6,mq:14,exchange:22,"payment-queue":26,"inventory-queue":26,"invoice-queue":26,payment:30,inventory:32,invoice:34});
  expect(timeline.routes.map(r=>[r.id,r.from,r.to,r.drawAt,r.labelAt])).toEqual([
    ["publish","api","exchange",18,26],
    ...ids.map(id=>[`${id}-binding`,"exchange",`${id}-queue`,20,28]),
    ...ids.map(id=>[`${id}-subscriber`,`${id}-queue`,id,22,30]),
    ["invoice-return","invoice","invoice-queue",610,undefined],
  ]);
  expect(timeline.ringsFade).toEqual([0,20]);expect(checkFlow("publish-subscribe",timeline)).toEqual([]);
});
test("Three copies split and wait",()=>{
  expect(owners(279)).toEqual([["original","exchange"]]);
  expect(owners(280)).toEqual(ids.map(id=>[id,`${id}-binding`]));
  expect(frameAt(291).tokens.map(t=>t.progress)).toEqual([.5,.5,.5]);
  expect(owners(302)).toEqual(ids.map(id=>[id,`${id}-queue`]));
  expect(owners(469)).toEqual(owners(302));
});
test("ACKs and invoice NACK are independent",()=>{
  expect(owners(470)).toEqual(ids.map(id=>[id,`${id}-subscriber`]));
  expect(frameAt(481).tokens.map(t=>t.progress)).toEqual([.5,.5,.5]);
  expect(owners(492)).toEqual(ids.map(id=>[id,id]));
  expect(owners(550)).toEqual([["inventory","inventory"],["invoice","invoice"]]);
  expect(owners(580)).toEqual([["invoice","invoice"]]);expect(owners(610)).toEqual(owners(580));
  expect(owners(640)).toEqual([["invoice","invoice-return"]]);expect(frameAt(651).tokens[0].progress).toBe(.5);
  expect(owners(662)).toEqual([["invoice","invoice-queue"]]);
  expect(frameAt(662).marks.map(m=>[m.node,m.kind])).toEqual([["api","ok"],["payment","ok"],["inventory","ok"],["invoice","fail"]]);
});
test("Final scene holds without redelivery",()=>{
  for(let frame=910;frame<1000;frame++)expect(frameAt(frame)).toEqual(frameAt(910));
  expect(owners(999)).toEqual([["invoice","invoice-queue"]]);
  expect(timeline.nodes).toHaveLength(8);expect(timeline.marks.filter(m=>m.kind==="ok"&&m.node!=="api")).toHaveLength(2);
});
test("Unknown endpoint and impossible ownership",()=>{
  const check=(edit:Partial<FlowTimeline>)=>checkFlow("publish-subscribe",{...timeline,...edit}).join("\n");
  expect(check({routes:timeline.routes.map((r,i)=>i===0?{...r,to:"unknown"}:r)})).toContain("publish-subscribe: route publish has unknown node unknown");
  expect(check({ownership:[...timeline.ownership,{copy:"invoice",node:"invoice-queue",from:470,to:302}]})).toContain("copy invoice node invoice-queue has inverted");
  expect(check({ownership:[...timeline.ownership,{copy:"invoice",route:"invoice-return",from:480,to:502}]})).toContain("copy invoice overlapping ownership at frame 480");
  expect(check({ownership:[...timeline.ownership,{copy:"invoice",node:"invoice-queue",from:470,to:480}]})).toContain("copy invoice overlapping ownership at frame 470");
  expect(check({ownership:timeline.ownership.map((o,i)=>i===0?{...o,from:NaN}:o)})).toContain("invalid frame NaN");
  expect(check({split:{...timeline.split,copies:["payment","invoice"]}})).toContain("split must replace original");
});
test("Seeking and handoff boundaries",()=>{
  const boundaries=[100,122,280,302,470,492,550,580,610,640,662];
  const frames=[...new Set(boundaries.flatMap(f=>[f-1,f,f+1]).concat([111,291,481,651]))];
  const expected=new Map(frames.map(f=>[f,frameAt(f)]));
  for(const f of [...frames,...[...frames].reverse(),...[...frames].sort((a,b)=>(a%7)-(b%7))]){
    expect(frameAt(f)).toEqual(expected.get(f));const copies=frameAt(f).tokens.map(t=>t.copy);expect(new Set(copies).size).toBe(copies.length);
    // An independent interval oracle freezes every handoff neighbour, not just
    // a forward/backward comparison of the same implementation.
    const expectedOwners = f<100?[]:f<122?[["original","publish"]]:f<280?[["original","exchange"]]:f<302?ids.map(id=>[id,`${id}-binding`]):f<470?ids.map(id=>[id,`${id}-queue`]):f<492?ids.map(id=>[id,`${id}-subscriber`]):ids.filter(id=>id==="invoice"||f<(id==="payment"?550:580)).map(id=>[id,id!=="invoice"?id:f<640?"invoice":f<662?"invoice-return":"invoice-queue"]);
    expect(owners(f)).toEqual(expectedOwners);
  }
});
test("Pub-sub compositions and text provenance",()=>{
  for(const lang of ["pt","en"] as const){
    const t=text[lang];expect(publishSubscribe.sources[lang]).toBe(fixture[lang].source);expect(t.captions).toEqual(fixture[lang].captions);
    const labels=[t.mq,t.api,t.subtitle,t.exchange,t.exchangeId,...t.queueIds,t.queue,...t.consumers,t.publish,t.binding,t.subscriber];
    expect(new Set(labels)).toEqual(new Set(fixture[lang].labels));
    expect(fixture[lang].provenance.labels).toContain(`anypoint-mq-${lang}.svg`);
  }
});
test("Caption windows and final caption",()=>{
  for(const f of [0,39])expect(flowCaptionAt(f)).toBeNull();
  for(const [index,phase] of timeline.phases.entries()){
    expect(flowCaptionAt(phase.from)).toEqual({key:phase.id,opacity:0,lift:14});
    expect(flowCaptionAt(phase.from+5)).toEqual({key:phase.id,opacity:.5,lift:7});
    expect(flowCaptionAt(phase.from+10)).toEqual({key:phase.id,opacity:1,lift:0});
    expect(flowCaptionAt(phase.to)).toEqual({key:phase.id,opacity:1,lift:0});
    if(index>0)expect(flowCaptionAt(phase.from-1)?.key).toBe(timeline.phases[index-1].id);
  }
  for(const f of [909,910,999])expect(flowCaptionAt(f)).toEqual({key:"final",opacity:1,lift:0});
});
test("Failure stays local and marks remain visible",()=>{
  for(const f of [610,640,651,662,999]){
    const state=frameAt(f);expect(state.tokens[0].stroke).toBe(tokens.color.failure);
    // From the failure event the invoice block itself turns failure-red; the
    // others stay healthy. Every mark is white with an ink glyph, so none
    // shares its block's hue (ADR 0003): a check on green, a cross on red.
    expect(state.fills).toEqual({api:tokens.color.healthy,payment:tokens.color.healthy,inventory:tokens.color.healthy,invoice:tokens.color.failure});
    for(const mark of state.marks){
      expect(mark.appearance.fill).toBe(tokens.color.white);expect(mark.appearance.glyphColor).toBe(tokens.color.ink);
      expect(mark.appearance.fill).not.toBe(state.fills[mark.node]);expect(mark.appearance.glyph).toBe(mark.node==="invoice"?"✕":"✓");
    }
  }
  for(const f of [0,302,492,609]){
    const state=frameAt(f);expect(Object.values(state.fills)).toEqual(Array(4).fill(tokens.color.healthy));
    for(const t of state.tokens)expect(t.stroke).toBe(tokens.color.ink);
  }
  // Copies are filled with the caller colour at every frame, so they read
  // inside the white queues and on the panel, not as white on white.
  for(const f of [111,291,302,481,651,662,999])for(const t of frameAt(f).tokens){
    expect(t.fill).toBe(tokens.color.caller);expect(t.fill).not.toBe(tokens.color.white);
  }
});

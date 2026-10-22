// Geometry checks are necessary but not a substitute for actual Lato stills.
import {expect,test} from "vitest";
import {layouts,consumers,consumerLines} from "../../src/scenes/publish-subscribe/layout";
import {text} from "../../src/scenes/publish-subscribe/text";
import {pointAlong} from "../../src/brand/motion";
import {tokens} from "../../tokens/generated/tokens";
const contains=(a:{x:number;y:number;w:number;h:number},b:{x:number;y:number;w:number;h:number})=>b.x>=a.x&&b.y>=a.y&&b.x+b.w<=a.x+a.w&&b.y+b.h<=a.y+a.h;
test("Portrait identifiers and long Portuguese names fit",()=>{
  const l=layouts["4x5"];
  expect(l.size.name).toBeGreaterThanOrEqual(54);expect(l.size.label).toBeGreaterThanOrEqual(30);expect(l.size.caption).toBeGreaterThanOrEqual(38);
  expect(l.boxes["inventory-queue"].w-2*22).toBeGreaterThanOrEqual(420);
  for(const lang of ["pt","en"] as const)for(const [i,id] of consumers.entries()){
    expect(consumerLines(lang,"4x5",i).join(" ")).toBe(text[lang].consumers[i]);
    expect(consumerLines(lang,"4x5",i).length).toBeLessThanOrEqual(3);
    const queue=l.boxes[`${id}-queue`],app=l.boxes[id];expect(contains(l.mq,queue)).toBe(true);expect(app.x).toBeGreaterThan(l.mq.x+l.mq.w+tokens.shadow.block);
    expect(app.y+app.h+tokens.shadow.block).toBeLessThan(l.caption.y);
    expect(l.docks[`${id}-queue`].x).toBeLessThan(queue.x+100);
    expect(l.docks[id].x).toBeLessThan(app.x+50);
  }
  for(const [id,path]of Object.entries(l.routes))for(const t of [0,.25,.5,.75,1]){
    const p=pointAlong(path,t)!;expect(p.x, id).toBeGreaterThan(0);expect(p.x,id).toBeLessThan(l.width-20);expect(p.y+21,id).toBeLessThan(l.caption.y);
  }
  expect(l.caption.y+l.caption.h).toBeLessThanOrEqual(l.height);
});
test("Landscape preserves diagram topology",()=>{
  const l=layouts["16x9"];
  expect(l.boxes.api.y+l.boxes.api.h).toBeLessThan(l.mq.y);expect(contains(l.mq,l.boxes.exchange)).toBe(true);
  for(const id of consumers){
    const q=l.boxes[`${id}-queue`],app=l.boxes[id];expect(contains(l.mq,q)).toBe(true);expect(q.y).toBeGreaterThan(l.boxes.exchange.y+l.boxes.exchange.h);expect(app.y).toBeGreaterThan(l.mq.y+l.mq.h);
    for(const route of [`${id}-binding`,`${id}-subscriber`]){
      const target=pointAlong(l.routes[route],1)!;expect(target).toEqual(l.docks[route.endsWith("binding")?`${id}-queue`:id]);
    }
    expect(app.y+app.h+tokens.shadow.block).toBeLessThanOrEqual(l.caption.y);
  }
  expect(pointAlong(l.routes["invoice-return"],1)).toEqual(l.docks["invoice-queue"]);
  expect(l.routes["invoice-return"]).not.toBe(layouts["4x5"].routes["invoice-return"]);
});

// Pure shape/style contract; wrapper rendering is checked by local stills.
import {expect,test} from "vitest";
import {flowShape,positionedTokenStyle} from "../../src/brand/flow-shapes";
import {blockPopIn} from "../../src/brand/motion";
import {tokens} from "../../tokens/generated/tokens";
const bounds={x:10,y:20,w:520,h:140};
test("Generic shapes match the diagram language",()=>{
  const exchange=flowShape("exchange",bounds,200,22),queue=flowShape("queue",bounds,200,26),container=flowShape("container",bounds,200,14);
  expect(exchange.vertices).toEqual([[36.4,0],[483.6,0],[520,70],[483.6,140],[36.4,140],[0,70]]);
  expect(queue.rails).toEqual([22,498]);
  expect(container.tab).toEqual({fill:tokens.color.transitional,radius:tokens.radius.pill,strokeWidth:tokens.outline.small,shadow:tokens.shadow.pill});
  for(const s of [exchange,queue,container]){
    expect(s.fill).toBe(tokens.color.white);expect(s.stroke).toBe(tokens.color.ink);expect(s.shadow).toBe(tokens.shadow.block);expect(s.strokeWidth).toBe(tokens.outline.block);expect(s.radius).toBe(tokens.radius.block);
    expect(JSON.stringify(s)).not.toMatch(/Anypoint|order-created/);
  }
  expect(positionedTokenStyle({x:1,y:2})).toEqual({point:{x:1,y:2},radius:17,fill:tokens.color.white,stroke:tokens.color.ink,strokeWidth:tokens.outline.small+1,shadow:tokens.shadow.small});
});
test("Shapes before appearance",()=>{
  for(const kind of ["exchange","queue","container"] as const){
    expect(flowShape(kind,bounds,21,22).appearance.opacity).toBe(0);
    expect(flowShape(kind,bounds,22,22).appearance).toEqual(blockPopIn(22,22));
    expect(flowShape(kind,bounds,30,22).appearance).toEqual(blockPopIn(30,22));
    expect(flowShape(kind,bounds,999,22).appearance).toEqual({opacity:1,scale:1});
  }
});

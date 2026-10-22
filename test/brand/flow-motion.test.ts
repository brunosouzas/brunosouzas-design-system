// Persistent/path token placement has no copy identities or broker semantics.
import {expect,test} from "vitest";
import {getLength,getPointAtLength} from "@remotion/paths";
import {positionedTokenAt} from "../../src/brand/motion";
test("Stationary path and return placement",()=>{
  for(const path of ["M0,0 L40,0 L40,100","M40,100 L40,0 L0,0"]){
    const placement={path,departAt:100};
    for(const frame of [99,100,111,122]) expect(positionedTokenAt(frame,{point:{x:42,y:21}})).toEqual({x:42,y:21});
    expect(positionedTokenAt(99,placement)).toBeNull();expect(positionedTokenAt(122,placement)).toBeNull();
    for(const [frame,progress] of [[100,0],[111,.5]]){
      const actual=positionedTokenAt(frame,placement)!;
      const expected=getPointAtLength(path,getLength(path)*progress)!;
      expect(actual.x).toBeCloseTo(expected.x,5);expect(actual.y).toBeCloseTo(expected.y,5);
    }
  }
});
test("Token path cannot yield a point",()=>{expect(positionedTokenAt(111,{path:"M0,0 L10,0",departAt:100},()=>null)).toBeNull();});

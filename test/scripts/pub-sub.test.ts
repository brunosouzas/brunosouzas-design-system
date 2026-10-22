// Injected-runner integration checks for flow scenes; fake files are explicitly
// test fixtures, never render evidence. Temporary roots are removed after tests.
import {existsSync,mkdirSync,mkdtempSync,readFileSync,readdirSync,rmSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname,join} from "node:path";
import {afterEach,expect,test} from "vitest";
import {formatCommand,type Command,type Io} from "../../scripts/cli";
import {runStills,stillCommands} from "../../scripts/stills";
import {runRender,renderCommands} from "../../scripts/render";
import {publishSubscribe as scene} from "../../src/scenes/publish-subscribe/scene.ts";
const roots:string[]=[];
afterEach(()=>{for(const root of roots.splice(0))rmSync(root,{recursive:true,force:true});});
const harness=(failure:(c:Command)=>boolean=()=>false)=>{
  const root=mkdtempSync(join(tmpdir(),"pub-sub-"));roots.push(root);
  const ran:Command[]=[],out:string[]=[],err:string[]=[];
  const io:Io={root,now:()=>0,log:s=>out.push(s),error:s=>err.push(s),runner:async(c,cwd)=>{
    expect(cwd).toBe(root);ran.push(c);if(failure(c))return 1;
    const path=join(root,c.output);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,`fixture ${c.kind}`);return 0;
  }};
  return {root,io,ran,out,err};
};
const ids=["16x9-pt","16x9-en","4x5-pt","4x5-en"].map(s=>`publish-subscribe-${s}`);
const frames=[239,469,609,789,909,999];
test("Pub-sub phase stills",async()=>{
  const h=harness();
  for(const id of ids){const stale=join(h.root,`out/stills/${id}/123.png`);mkdirSync(dirname(stale),{recursive:true});writeFileSync(stale,"stale");}
  expect(stillCommands(scene).map(c=>[c.composition,c.frame])).toEqual(ids.flatMap(id=>frames.map(f=>[id,f])));
  expect(await runStills([scene.id],h.io)).toBe(0);expect(h.ran).toEqual(stillCommands(scene));
  expect(h.out).toEqual(ids.flatMap(id=>frames.map(f=>`out/stills/${id}/${f}.png`)));expect(h.err).toEqual([]);
  for(const c of h.ran){expect(c.args).toEqual(["remotion","still","src/index.ts",c.composition,c.output,`--frame=${c.frame}`,"--overwrite","--log=error"]);expect(existsSync(join(h.root,c.output))).toBe(true);}
  for(const id of ids)expect(readdirSync(join(h.root,`out/stills/${id}`)).sort()).toEqual(frames.map(f=>`${f}.png`).sort());
});
test("Pub-sub dry runs remain effect free",async()=>{
  const h=harness(),keep=join(h.root,`out/stills/${ids[0]}/123.png`);mkdirSync(dirname(keep),{recursive:true});writeFileSync(keep,"keep");
  const before=readdirSync(h.root,{recursive:true});
  expect(await runStills([scene.id,"--dry-run"],h.io)).toBe(0);expect(h.out).toEqual(stillCommands(scene).map(formatCommand));expect(h.out).toHaveLength(24);h.out.length=0;
  expect(await runRender([scene.id,"--dry-run"],h.io)).toBe(0);expect(h.out).toEqual(renderCommands(scene).map(formatCommand));expect(h.out).toHaveLength(8);h.out.length=0;
  expect(await runStills(["circuit-breaker-states","--dry-run"],h.io)).toBe(0);expect(h.out).toHaveLength(28);
  expect(h.ran).toEqual([]);expect(readdirSync(h.root,{recursive:true})).toEqual(before);expect(readFileSync(keep,"utf8")).toBe("keep");
});
test("Pub-sub render failure preserves earlier files",async()=>{
  const h=harness(c=>c.kind==="render"&&c.composition===ids[1]);
  expect(await runRender([scene.id],h.io)).toBe(1);expect(h.err).toEqual([`error: render failed: ${ids[1]} (exit code 1)`]);
  expect(h.ran.map(c=>[c.kind,c.composition])).toEqual([["render",ids[0]],["encode",ids[0]],["render",ids[1]]]);
  expect(readFileSync(join(h.root,`out/master/${ids[0]}.mp4`),"utf8")).toBe("fixture render");expect(readFileSync(join(h.root,`out/web/${ids[0]}.mp4`),"utf8")).toBe("fixture encode");
  expect(h.out).toHaveLength(1);expect(h.out[0]).toContain(ids[0]);
});

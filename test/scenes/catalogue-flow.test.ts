// Shared/flow catalogue regression scenarios. Broken fixtures prove rejection
// independently of rendering; legacy catalogue tests remain unchanged.
import { expect, test } from "vitest";
import { checkCatalogue, checkTimeline, compositionsOf, type FlowSceneData } from "../../src/scenes/catalogue";
import { scenes } from "../../src/scenes";
import { publishSubscribe as scene } from "../../src/scenes/publish-subscribe/scene.ts";
import type { FlowTimeline } from "../../src/scenes/publish-subscribe/timeline";
import { takesFixture } from "../fixtures/takes-scene";
const broken = (edit: Partial<FlowTimeline>):FlowSceneData => ({...scene,timeline:{...scene.timeline,...edit}});
const errors = (edit:Partial<FlowTimeline>) => checkTimeline(broken(edit)).join("\n");
test("Both kinds in the catalogue",()=>{
  expect(checkCatalogue(scenes)).toEqual([]);
  // Lists every registered scene (change circuit-breaker-topology-scene): the first two are the pilots, later scenes follow.
  expect(scenes.slice(0,2).map(s=>s.id)).toEqual(["circuit-breaker-states","publish-subscribe"]);
  const entries=scenes.slice(0,2).flatMap(compositionsOf);
  expect(entries).toHaveLength(8); expect(new Set(entries.map(e=>e.id)).size).toBe(8);
  expect(scenes.flatMap(compositionsOf).slice(0,8)).toEqual(entries);
});
test("Shared checks still reject a broken flow",()=>{
  expect(checkCatalogue([scene,scene]).join("\n")).toContain("duplicate composition id publish-subscribe-16x9-pt");
  const {api:_,...en}=scene.text.en;
  expect(checkCatalogue([{...scene,text:{...scene.text,en}}])).toContain("publish-subscribe: en lacks key api");
  expect(checkCatalogue([{...scene,sources:{...scene.sources,en:"http://invalid"}}]).join("\n")).toContain("publish-subscribe: en source article URL");
});
test("Phase beyond the composition",()=>{
  expect(errors({phases:scene.timeline.phases.map((p,i)=>i===4?{...p,to:1000}:p)})).toContain("publish-subscribe: phase 5 (final [790, 1000]) is outside");
});
test("Outro inside the reading hold",()=>{expect(errors({outro:950})).toContain("publish-subscribe: outro at frame 950 is inside the reading hold");});
test("Overlapping phases",()=>{expect(errors({phases:scene.timeline.phases.map((p,i)=>i===1?{...p,from:239}:p)})).toContain("phase 2 (fanOut [239, 469]) overlaps phase 1 (publish [40, 239])");});
test("Event outside its phase",()=>{expect(errors({phases:scene.timeline.phases.map((p,i)=>i===0?{...p,events:[{id:"late",at:240}]}:p)})).toContain("event at frame 240 is outside phase 1 (publish");});
test("Movement inside the reading hold",()=>{
  for(const field of ["drawAt","labelAt"] as const) expect(errors({routes:scene.timeline.routes.map((r,i)=>i===0?{...r,[field]:910}:r)})).toContain(`${field==="drawAt"?"arrow draw":"pill pop-in"} publish finishes`);
  expect(errors({popIn:{...scene.timeline.popIn,api:910}})).toContain("pop-in api finishes");
  expect(errors({phases:scene.timeline.phases.map((p,i)=>i===4?{...p,events:[{id:"late",at:910}]}:p)})).toContain("event of phase 5 (final [790, 909]) at frame 910 is at or after the outro");
});
test("Flow trip crosses the outro",()=>{
  expect(errors({ownership:[...scene.timeline.ownership,{copy:"invoice",route:"invoice-return",from:900,to:922}]})).toContain("publish-subscribe: copy invoice route invoice-return arrives at frame 922");
});
test("Pub-sub compositions and text provenance",()=>{
  expect(compositionsOf(scene)).toEqual([ ["16x9","pt",1920,1080],["16x9","en",1920,1080],["4x5","pt",1080,1350],["4x5","en",1080,1350] ].map(([format,lang,width,height])=>({id:`publish-subscribe-${format}-${lang}`,folder:"publish-subscribe",format,lang,width,height,fps:30,durationInFrames:1000})));
});

// A neutral takes scene beside the registered ones (spec scene-catalogue,
// "State-machine and flow catalogue compatibility"; change
// scene-takes-infrastructure, task 3.4). The fixture is test-only, so the
// catalogue itself keeps its two scenes.
test("Takes fixture beside the registered scenes",()=>{
  const before=scenes.flatMap(compositionsOf);
  const all=[...scenes,takesFixture];
  expect(checkCatalogue(all)).toEqual([]);
  const entries=all.flatMap(compositionsOf);
  // Lists every registered scene (change circuit-breaker-topology-scene): the registered compositions, then the fixture's.
  expect(entries).toHaveLength(before.length+1); expect(new Set(entries.map(e=>e.id)).size).toBe(before.length+1);
  expect(entries.slice(0,before.length)).toEqual(before);
  expect(entries.slice(0,4).every(e=>e.folder==="circuit-breaker-states")).toBe(true);
  expect(entries.slice(4,8).every(e=>e.folder==="publish-subscribe")).toBe(true);
  expect(entries.at(-1)!.id).toBe("takes-fixture-16x9");
  expect(scenes.map(s=>s.id)).toEqual(["circuit-breaker-states","publish-subscribe","circuit-breaker-topology"]);
});

// Every registered scene (spec scene-catalogue, "State-machine and flow catalogue
// compatibility", scenario "Three scenes in the catalogue"; change
// circuit-breaker-topology-scene, task 2.4). The commands' `available scenes:`
// line is checked in test/scripts/cli.test.ts.
test("Three scenes in the catalogue",()=>{
  expect(checkCatalogue(scenes)).toEqual([]);
  expect(scenes.map(s=>s.id)).toEqual(["circuit-breaker-states","publish-subscribe","circuit-breaker-topology"]);
  const entries=scenes.flatMap(compositionsOf);
  expect(entries).toHaveLength(9); expect(new Set(entries.map(e=>e.id)).size).toBe(9);
  expect(entries.map(e=>e.folder)).toEqual([...Array(4).fill("circuit-breaker-states"),...Array(4).fill("publish-subscribe"),"circuit-breaker-topology"]);
  expect(entries[8].id).toBe("circuit-breaker-topology-16x9");
});

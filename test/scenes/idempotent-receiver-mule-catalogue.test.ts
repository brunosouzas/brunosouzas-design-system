// The Idempotent Receiver Mule scene in the catalogue (spec scene-catalogue,
// "Idempotent Receiver Mule registration", "Idempotent Receiver Mule reading
// devices and cast"; change idempotent-receiver-mule-scene, tasks 2.3 and
// 2.4). No React or fonts: Root.tsx is read as text.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { checkCatalogue, checkTimeline, compositionsOf, type TakesSceneData } from "../../src/scenes/catalogue";
import { findScene, scenes } from "../../src/scenes";
import { idempotentReceiverMule as scene, text } from "../../src/scenes/idempotent-receiver-mule/scene.ts";
import { checkTakes } from "../../src/scenes/takes-kind";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const ID = "idempotent-receiver-mule";

describe("Idempotent Receiver Mule registration", () => {
  test("Registered entry", () => {
    const entry = findScene(ID);
    expect(entry).toBe(scene);
    expect(entry).toMatchObject({ id: ID, kind: "takes", neutral: true, formats: ["16x9"], languages: ["en"] });
    expect(Object.keys(entry!.text)).toEqual(["en"]);
    expect(entry!.sources).toEqual({ pt: "https://brunosouzas.com/pt/wiki/idempotent-receiver-in-mulesoft/", en: "https://brunosouzas.com/wiki/idempotent-receiver-in-mulesoft/" });
    expect(entry!.timeline.duration).toBe(1350);
    expect(entry!.timeline.outro).toBe(1250);
    const root = readFileSync(join(repoRoot, "src/Root.tsx"), "utf8");
    expect(root).toContain('import { IdempotentReceiverMuleScene } from "./scenes/idempotent-receiver-mule/Scene.tsx";');
    expect(root).toMatch(/"idempotent-receiver-mule": IdempotentReceiverMuleScene,/);
    expect(compositionsOf(scene).map((c) => c.id)).toEqual(["idempotent-receiver-mule-16x9"]);
  });

  test("Word table", () => {
    expect(text.en).toEqual({
      listener: ["HTTP", "Listener"],
      validator: ["Idempotent", "Message", "Validator"],
      charge: ["Simulated", "charge"],
      id: "`orderId`",
      accepted: "200",
      duplicate: "409",
      failed: "500",
      counts: ["0", "1"],
      question: "?",
      takes: ["1", "2"],
    });
    expect(scene.text).toBe(text);
  });

  test("One composition, after the book scene", () => {
    const entries = scenes.flatMap(compositionsOf);
    const before = scenes.slice(0, 6).flatMap(compositionsOf);
    expect(entries.slice(0, 12)).toEqual(before);
    expect(entries[11].id).toBe("idempotent-receiver-book-16x9");
    expect(entries[12]).toEqual({ id: "idempotent-receiver-mule-16x9", folder: ID, format: "16x9", lang: "en", width: 1920, height: 1080, fps: 30, durationInFrames: 1350 });
    expect(entries.at(-1)!.id).toBe("circuit-breaker-topology-16x9");
    expect(entries).toHaveLength(14);
    expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length);
  });

  test("Broken entry rejected", () => {
    const withPt = { ...scene, text: { ...scene.text, pt: scene.text.en } } as unknown as TakesSceneData;
    const httpPt = { ...scene, sources: { ...scene.sources, pt: "http://brunosouzas.com/pt/wiki/idempotent-receiver-in-mulesoft/" } };
    const lateOutro = { ...scene, timeline: { ...scene.timeline, outro: 1261 } };
    expect(checkCatalogue([withPt]).join("\n")).toContain(`${ID}: a neutral scene has no pt text table`);
    expect(checkCatalogue([httpPt]).join("\n")).toContain(`${ID}: pt source article URL must start with https://`);
    expect(checkCatalogue([lateOutro]).join("\n")).toContain(`${ID}: outro at frame 1261 is inside the reading hold`);
  });

  test("Takes checks pass", () => {
    expect(checkTimeline(scene)).toEqual([]);
    expect(checkCatalogue([scene])).toEqual([]);
    expect(checkTakes(scene)).toEqual([]);
  });
});

describe("Idempotent Receiver Mule reading devices and cast", () => {
  test("Devices as in the book scene", () => {
    const devices = scene.timeline.phases.flatMap((p) => (p.devices ?? []).map((d) => `${p.id}:${d}`));
    expect(devices).toEqual([
      "setup:takeNumbers", "t1-lookup:lookupMark", "t1-match:matchFocus", "rewind:rewind", "rewind:takeNumbers",
      "t2-lookup:lookupMark", "t2-match:matchFocus", "t2-compare:ghost",
    ]);
  });

  test("Balão the only actor, reacting to 200 and 500 only", () => {
    const t = scene.timeline;
    expect(new Set([...t.acts, ...t.faces, ...t.emotes].map((c) => c.actor))).toEqual(new Set(["balao"]));
    expect(t.emotes.map((e) => [e.kind, e.at, e.leaveAt])).toEqual([["worked", 264, 300], ["problem", 894, 930]]);
    // Each emote enters with its face: done with the 200, failed with the 500; no face or emote at a 409's arrival (528, 1158).
    expect(t.faces.filter((f) => f.at === 264 || f.at === 894).map((f) => [f.at, f.expression])).toEqual([[264, "done"], [894, "failed"]]);
    expect(t.faces.filter((f) => f.at === 528 || f.at === 1158)).toEqual([]);
    expect(t.emotes.filter((e) => e.at === 528 || e.at === 1158)).toEqual([]);
  });

  test("Bad emote rejected", () => {
    // An emote at the 409 of take 2, where Balão's face does not change (q3 of gate 0: no reaction on 409).
    const t = { ...scene.timeline, emotes: [...scene.timeline.emotes, { actor: "balao" as const, kind: "problem" as const, at: 1158, leaveAt: 1190 }] };
    expect(checkTakes({ ...scene, timeline: t })).toEqual([`${ID}: emote problem at frame 1158 is not on an expression change of balao`]);
  });

  test("Every phase cites the article", () => {
    const allowed = new Set([36, 38, 42, 44, 95, 109, 122, 159]);
    for (const p of scene.timeline.phases) expect(p.cites.every((line) => allowed.has(line)), p.id).toBe(true);
  });
});

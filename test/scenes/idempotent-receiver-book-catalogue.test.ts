// The Idempotent Receiver book scene in the catalogue (spec scene-catalogue,
// "Idempotent Receiver book registration", "Idempotent Receiver book reading
// devices"; change idempotent-receiver-book-scene, tasks 2.3 and 2.4). No
// React or fonts: Root.tsx is read as text.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { checkCatalogue, checkTimeline, compositionsOf, type TakesSceneData } from "../../src/scenes/catalogue";
import { findScene, scenes } from "../../src/scenes";
import { idempotentReceiverBook as scene, text } from "../../src/scenes/idempotent-receiver-book/scene.ts";
import { checkTakes } from "../../src/scenes/takes-kind";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const ID = "idempotent-receiver-book";

describe("Idempotent Receiver book registration", () => {
  test("Registered entry", () => {
    const entry = findScene(ID);
    expect(entry).toBe(scene);
    expect(entry).toMatchObject({ id: ID, kind: "takes", neutral: true, formats: ["16x9"], languages: ["en"] });
    expect(Object.keys(entry!.text)).toEqual(["en"]);
    expect(entry!.sources).toEqual({ pt: "https://brunosouzas.com/pt/wiki/idempotent-receiver-in-mulesoft/", en: "https://brunosouzas.com/wiki/idempotent-receiver-in-mulesoft/" });
    expect(entry!.timeline.duration).toBe(900);
    expect(entry!.timeline.outro).toBe(800);
    const root = readFileSync(join(repoRoot, "src/Root.tsx"), "utf8");
    expect(root).toContain('import { IdempotentReceiverBookScene } from "./scenes/idempotent-receiver-book/Scene.tsx";');
    expect(root).toMatch(/"idempotent-receiver-book": IdempotentReceiverBookScene,/);
    expect(compositionsOf(scene).map((c) => c.id)).toEqual(["idempotent-receiver-book-16x9"]);
  });

  test("Word table", () => {
    expect(text.en).toEqual({ sender: "Sender", id: "42", question: "?", takes: ["1", "2"] });
    expect(scene.text).toBe(text);
  });

  test("One composition, before the topology scene", () => {
    const entries = scenes.flatMap(compositionsOf);
    const before = scenes.slice(0, 5).flatMap(compositionsOf);
    expect(entries.slice(0, 11)).toEqual(before);
    expect(entries[11]).toEqual({ id: "idempotent-receiver-book-16x9", folder: ID, format: "16x9", lang: "en", width: 1920, height: 1080, fps: 30, durationInFrames: 900 });
    // Since change idempotent-receiver-mule-scene (SW-160) the Mule scene sits between this one and the topology scene.
    expect(entries[12].id).toBe("idempotent-receiver-mule-16x9");
    expect(entries.at(-1)!.id).toBe("circuit-breaker-topology-16x9");
    expect(entries).toHaveLength(14);
    expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length);
  });

  test("Broken entry rejected", () => {
    const withPt = { ...scene, text: { ...scene.text, pt: scene.text.en } } as unknown as TakesSceneData;
    const httpPt = { ...scene, sources: { ...scene.sources, pt: "http://brunosouzas.com/pt/wiki/idempotent-receiver-in-mulesoft/" } };
    const lateOutro = { ...scene, timeline: { ...scene.timeline, outro: 811 } };
    expect(checkCatalogue([withPt]).join("\n")).toContain(`${ID}: a neutral scene has no pt text table`);
    expect(checkCatalogue([httpPt]).join("\n")).toContain(`${ID}: pt source article URL must start with https://`);
    expect(checkCatalogue([lateOutro]).join("\n")).toContain(`${ID}: outro at frame 811 is inside the reading hold`);
  });

  test("Takes checks pass", () => {
    expect(checkTimeline(scene)).toEqual([]);
    expect(checkCatalogue([scene])).toEqual([]);
    expect(checkTakes(scene)).toEqual([]);
  });
});

describe("Idempotent Receiver book reading devices", () => {
  test("Devices where the owner approved them", () => {
    const devices = scene.timeline.phases.flatMap((p) => (p.devices ?? []).map((d) => `${p.id}:${d}`));
    expect(devices).toEqual(["setup:takeNumbers", "t1-lookup:lookupMark", "rewind:rewind", "rewind:takeNumbers", "t2-lookup:lookupMark", "t2-match:matchFocus", "t2-compare:ghost"]);
  });

  test("No cast", () => {
    expect([scene.timeline.acts, scene.timeline.faces, scene.timeline.emotes]).toEqual([[], [], []]);
  });

  test("Every phase cites the article", () => {
    for (const p of scene.timeline.phases) expect(p.cites.every((line) => line === 28 || line === 32), p.id).toBe(true);
  });
});

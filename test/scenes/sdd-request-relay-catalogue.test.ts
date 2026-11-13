// The SDD relay scene in the catalogue (spec scene-catalogue, "SDD relay
// registration", "SDD relay cast timing", "Existing scenes unchanged by the
// relay scene"; change sdd-scene-1-relay, tasks 1.2 and 2.3). No React or
// fonts: Root.tsx is read as text.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { checkCatalogue, checkTimeline, compositionsOf, type TakesSceneData } from "../../src/scenes/catalogue";
import { findScene, scenes } from "../../src/scenes";
import { sddRequestRelay as scene, text } from "../../src/scenes/sdd-request-relay/scene.ts";
import { checkTakes, LEAVE_FRAMES } from "../../src/scenes/takes-kind";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const ID = "sdd-request-relay";

describe("SDD relay registration", () => {
  test("Registered entry", () => {
    const entry = findScene(ID);
    expect(entry).toBe(scene);
    expect(entry).toMatchObject({ id: ID, kind: "takes", neutral: true, formats: ["16x9"], languages: ["en"] });
    expect(Object.keys(entry!.text)).toEqual(["en"]);
    expect(entry!.sources).toEqual({ en: "https://brunosouzas.com/blog/spec-driven-development-in-practice", pt: "https://brunosouzas.com/pt/blog/spec-driven-development-in-practice" });
    expect(entry!.timeline.duration).toBe(1080);
    expect(entry!.timeline.outro).toBe(980);
    const root = readFileSync(join(repoRoot, "src/Root.tsx"), "utf8");
    expect(root).toContain('import { SddRequestRelayScene } from "./scenes/sdd-request-relay/Scene.tsx";');
    expect(root).toMatch(/"sdd-request-relay": SddRequestRelayScene,/);
    expect(compositionsOf(scene).map((c) => c.id)).toEqual(["sdd-request-relay-16x9"]);
  });

  test("Word table", () => {
    expect(text.en).toEqual({ file: "proposal.md", approval: "GO", question: "?", takes: ["1", "2"] });
    expect(scene.text).toBe(text);
  });

  test("One composition, before the topology scene", () => {
    const entries = scenes.flatMap(compositionsOf);
    const first8 = scenes.slice(0, 2).flatMap(compositionsOf);
    expect(scenes.slice(0, 2).map((s) => s.id)).toEqual(["circuit-breaker-states", "publish-subscribe"]);
    expect(entries.slice(0, 8)).toEqual(first8);
    expect(entries[8]).toEqual({ id: "sdd-request-relay-16x9", folder: ID, format: "16x9", lang: "en", width: 1920, height: 1080, fps: 30, durationInFrames: 1080 });
    // Since change sdd-scene-3-archive (design §2.6) the archive scene sits between this one and the topology scene.
    expect(entries[9].id).toBe("sdd-scene-3-archive-16x9");
    expect(entries[10].id).toBe("circuit-breaker-topology-16x9");
    expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length);
  });

  test("Broken entry rejected", () => {
    const withPt = { ...scene, text: { ...scene.text, pt: scene.text.en } } as unknown as TakesSceneData;
    const httpPt = { ...scene, sources: { ...scene.sources, pt: "http://brunosouzas.com/pt/blog/spec-driven-development-in-practice" } };
    const lateOutro = { ...scene, timeline: { ...scene.timeline, outro: 991 } };
    expect(checkCatalogue([withPt]).join("\n")).toContain(`${ID}: a neutral scene has no pt text table`);
    expect(checkCatalogue([httpPt]).join("\n")).toContain(`${ID}: pt source article URL must start with https://`);
    expect(checkCatalogue([lateOutro]).join("\n")).toContain(`${ID}: outro at frame 991 is inside the reading hold`);
  });
});

describe("SDD relay cast timing", () => {
  test("Takes checks pass", () => {
    expect(checkTimeline(scene)).toEqual([]);
    expect(checkCatalogue([scene])).toEqual([]);
    expect(checkTakes(scene)).toEqual([]);
  });

  test("Overlapping acts of the supporting cast", () => {
    const overlapping = { ...scene, timeline: { ...scene.timeline, acts: [...scene.timeline.acts, { actor: "chaves" as const, from: 752, to: 760 }] } };
    const problems = checkTakes(overlapping).join("\n");
    expect(problems).toContain(`${ID}: act of balao [752, 836] overlaps act of chaves [752, 760]`);
  });

  test("Fright before the agent's failure", () => {
    const t = scene.timeline;
    expect(t.faces).toContainEqual({ actor: "balao", at: 316, expression: "failed" });
    expect(t.emotes).toContainEqual({ actor: "balao", kind: "problem", at: 316, leaveAt: 350 });
    expect(t.faces).toContainEqual({ actor: "visor", at: 366, expression: "failed" });
    // The emote is gone (its leaveAt + LEAVE_FRAMES) before Visor's face changes.
    const problem = t.emotes.find((e) => e.actor === "balao" && e.kind === "problem")!;
    expect(problem.leaveAt! + LEAVE_FRAMES).toBeLessThanOrEqual(366);
  });
});

describe("Existing scenes unchanged by the relay scene", () => {
  test("Other scenes' tests untouched", () => {
    // Their test files run unedited in the same `npm test`; the `git diff` half of the scenario is a local check
    // recorded in the pull request (CI checks out one commit).
    expect(scenes.map((s) => s.id)).toEqual(["circuit-breaker-states", "publish-subscribe", ID, "sdd-scene-3-archive", "circuit-breaker-topology"]);
  });
});

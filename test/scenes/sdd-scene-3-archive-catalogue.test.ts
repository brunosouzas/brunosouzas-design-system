// The SDD archive scene in the catalogue (spec scene-catalogue, "SDD archive
// registration", "Existing scenes unchanged by the archive scene", and the
// review's scenario "At most one finding mark at a time"; change
// sdd-scene-3-archive, task 2.3). No React or fonts: Root.tsx is read as text.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { checkCatalogue, compositionsOf, type SequenceSceneData } from "../../src/scenes/catalogue";
import { findScene, scenes } from "../../src/scenes";
import { sddScene3Archive as scene, text } from "../../src/scenes/sdd-scene-3-archive/scene.ts";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const ID = "sdd-scene-3-archive";

describe("SDD archive registration", () => {
  test("Archive registered entry", () => {
    const entry = findScene(ID);
    expect(entry).toBe(scene);
    expect(entry).toMatchObject({ id: ID, kind: "sequence", neutral: true, formats: ["16x9"], languages: ["en"] });
    expect(Object.keys(entry!.text)).toEqual(["en"]);
    expect(entry!.sources).toEqual({ en: "https://brunosouzas.com/blog/spec-driven-development-in-practice", pt: "https://brunosouzas.com/pt/blog/spec-driven-development-in-practice" });
    expect(entry!.timeline.duration).toBe(600);
    expect(entry!.timeline.outro).toBe(500);
    const root = readFileSync(join(repoRoot, "src/Root.tsx"), "utf8");
    expect(root).toContain('import { SddScene3ArchiveScene } from "./scenes/sdd-scene-3-archive/Scene.tsx";');
    expect(root).toMatch(/"sdd-scene-3-archive": SddScene3ArchiveScene,/);
    expect(compositionsOf(scene).map((c) => c.id)).toEqual(["sdd-scene-3-archive-16x9"]);
  });

  test("Archive word table", () => {
    expect(text.en).toEqual({
      fieldCount: { was: "exactly two fields", now: "exactly three fields" },
      verdict: "GO",
      question: "?",
    });
    expect(scene.text).toBe(text);
  });

  test("One composition, after this branch's earlier scenes", () => {
    const entries = scenes.flatMap(compositionsOf);
    const before = scenes.slice(0, 3).flatMap(compositionsOf);
    expect(scenes.slice(0, 3).map((s) => s.id)).toEqual(["circuit-breaker-states", "publish-subscribe", "sdd-request-relay"]);
    expect(entries.slice(0, 9)).toEqual(before);
    expect(entries[8].id).toBe("sdd-request-relay-16x9");
    expect(entries[9]).toEqual({ id: "sdd-scene-3-archive-16x9", folder: ID, format: "16x9", lang: "en", width: 1920, height: 1080, fps: 30, durationInFrames: 600 });
    expect(entries[10].id).toBe("circuit-breaker-topology-16x9");
    expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length);
  });

  test("Archive broken entry rejected", () => {
    const withPt = { ...scene, text: { ...scene.text, pt: scene.text.en } } as unknown as SequenceSceneData;
    const httpPt = { ...scene, sources: { ...scene.sources, pt: "http://brunosouzas.com/pt/blog/spec-driven-development-in-practice" } };
    const lateOutro = { ...scene, timeline: { ...scene.timeline, outro: 511 } };
    expect(checkCatalogue([withPt]).join("\n")).toContain(`${ID}: a neutral scene has no pt text table`);
    expect(checkCatalogue([httpPt]).join("\n")).toContain(`${ID}: pt source article URL must start with https://`);
    expect(checkCatalogue([lateOutro]).join("\n")).toContain(`${ID}: outro at frame 511 is inside the reading hold`);
  });
});

describe("Existing scenes unchanged by the archive scene", () => {
  test("Other scenes' code untouched", () => {
    // Their test files run in the same `npm test`; the `git diff` half of the scenario is a local check recorded
    // in the pull request (CI checks out one commit).
    expect(scenes.map((s) => s.id)).toEqual(["circuit-breaker-states", "publish-subscribe", "sdd-request-relay", ID, "circuit-breaker-topology"]);
  });
});

describe("SDD archive single review round", () => {
  test("No actor in the review", () => {
    // The reviewer is another agent, not a cast member (design §2.3): nobody on stage acts or changes face
    // during the review phase (260-339).
    const t = scene.timeline;
    expect(t.acts.filter((a) => a.to >= 260 && a.from <= 339)).toEqual([]);
    expect(t.faces.filter((f) => f.at >= 260 && f.at <= 339)).toEqual([]);
  });
});

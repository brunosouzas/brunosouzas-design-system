// The SDD files scene in the catalogue (spec scene-catalogue, "SDD files
// registration", "Existing scenes unchanged by the files scene", and the
// reviews' scenario "No actor in the reviews"; change sdd-scene-2-files, task
// 2.3). No React or fonts: Root.tsx is read as text.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { checkCatalogue, compositionsOf, type SequenceSceneData } from "../../src/scenes/catalogue";
import { findScene, scenes } from "../../src/scenes";
import { sddScene2Files as scene, text } from "../../src/scenes/sdd-scene-2-files/scene.ts";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const ID = "sdd-scene-2-files";

describe("SDD files registration", () => {
  test("Files registered entry", () => {
    const entry = findScene(ID);
    expect(entry).toBe(scene);
    expect(entry).toMatchObject({ id: ID, kind: "sequence", neutral: true, formats: ["16x9"], languages: ["en"] });
    expect(Object.keys(entry!.text)).toEqual(["en"]);
    expect(entry!.sources).toEqual({ en: "https://brunosouzas.com/blog/spec-driven-development-in-practice", pt: "https://brunosouzas.com/pt/blog/spec-driven-development-in-practice" });
    expect(entry!.timeline.duration).toBe(870);
    expect(entry!.timeline.outro).toBe(770);
    const root = readFileSync(join(repoRoot, "src/Root.tsx"), "utf8");
    expect(root).toContain('import { SddScene2FilesScene } from "./scenes/sdd-scene-2-files/Scene.tsx";');
    expect(root).toMatch(/"sdd-scene-2-files": SddScene2FilesScene,/);
    expect(compositionsOf(scene).map((c) => c.id)).toEqual(["sdd-scene-2-files-16x9"]);
  });

  test("Files word table", () => {
    expect(text.en).toEqual({
      folder: "openspec/",
      files: { proposal: "proposal.md", design: "design.md", tasks: "tasks.md", spec: "spec.md" },
      verdicts: { rejected: "NO-GO", approved: "GO" },
      question: "?",
    });
    expect(scene.text).toBe(text);
  });

  test("One composition, after the relay scene", () => {
    const entries = scenes.flatMap(compositionsOf);
    const before = scenes.slice(0, 3).flatMap(compositionsOf);
    expect(scenes.slice(0, 3).map((s) => s.id)).toEqual(["circuit-breaker-states", "publish-subscribe", "sdd-request-relay"]);
    expect(entries.slice(0, 9)).toEqual(before);
    expect(entries[8].id).toBe("sdd-request-relay-16x9");
    expect(entries[9]).toEqual({ id: "sdd-scene-2-files-16x9", folder: ID, format: "16x9", lang: "en", width: 1920, height: 1080, fps: 30, durationInFrames: 870 });
    expect(entries[10].id).toBe("sdd-scene-3-archive-16x9");
    expect(entries[11].id).toBe("circuit-breaker-topology-16x9");
    expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length);
  });

  test("Files broken entry rejected", () => {
    const withPt = { ...scene, text: { ...scene.text, pt: scene.text.en } } as unknown as SequenceSceneData;
    const httpPt = { ...scene, sources: { ...scene.sources, pt: "http://brunosouzas.com/pt/blog/spec-driven-development-in-practice" } };
    const lateOutro = { ...scene, timeline: { ...scene.timeline, outro: 781 } };
    expect(checkCatalogue([withPt]).join("\n")).toContain(`${ID}: a neutral scene has no pt text table`);
    expect(checkCatalogue([httpPt]).join("\n")).toContain(`${ID}: pt source article URL must start with https://`);
    expect(checkCatalogue([lateOutro]).join("\n")).toContain(`${ID}: outro at frame 781 is inside the reading hold`);
  });
});

describe("Existing scenes unchanged by the files scene", () => {
  test("Other scenes' code untouched", () => {
    // Their test files run in the same `npm test`; the `git diff` half of the scenario is a local check recorded
    // in the pull request (CI checks out one commit).
    expect(scenes.map((s) => s.id)).toEqual(["circuit-breaker-states", "publish-subscribe", "sdd-request-relay", ID, "sdd-scene-3-archive", "circuit-breaker-topology"]);
  });
});

describe("SDD files review round 1", () => {
  test("No actor in the reviews", () => {
    // The reviewer is another agent, not a cast member (design §2.4): nobody on stage acts or changes face.
    const t = scene.timeline;
    expect(t.acts.filter((a) => a.to >= 280 && a.from <= 599)).toEqual([]);
    expect(t.faces.filter((f) => f.at >= 280 && f.at <= 599)).toEqual([]);
  });
});

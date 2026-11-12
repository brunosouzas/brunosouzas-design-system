// The circuit-breaker topology scene in the catalogue (spec scene-catalogue,
// "Topology scene registration", "Existing scenes unchanged by the topology
// scene", "Topology beats and timing" (takes checks); change
// circuit-breaker-topology-scene, task 2.3). No React or fonts: Root.tsx is
// read as text.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { checkCatalogue, compositionsOf, type TakesSceneData } from "../../src/scenes/catalogue";
import { findScene, scenes } from "../../src/scenes";
import { circuitBreakerTopology as scene, text } from "../../src/scenes/circuit-breaker-topology/scene.ts";
import { checkTakes } from "../../src/scenes/takes-kind";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const ID = "circuit-breaker-topology";

describe("Topology scene registration", () => {
  test("Registered entry", () => {
    const entry = findScene(ID);
    expect(entry).toBe(scene);
    expect(entry).toMatchObject({ id: ID, kind: "takes", neutral: true, formats: ["16x9"], languages: ["en"] });
    expect(Object.keys(entry!.text)).toEqual(["en"]);
    expect(entry!.sources).toEqual({ en: "https://brunosouzas.com/blog/circuit-breaker-in-mulesoft", pt: "https://brunosouzas.com/pt/blog/circuit-breaker-in-mulesoft" });
    expect(entry!.timeline.duration).toBe(1920);
    expect(entry!.timeline.outro).toBe(1800);
    // Root.tsx maps the scene id to its component.
    const root = readFileSync(join(repoRoot, "src/Root.tsx"), "utf8");
    expect(root).toContain('import { CircuitBreakerTopologyScene } from "./scenes/circuit-breaker-topology/Scene.tsx";');
    expect(root).toMatch(/"circuit-breaker-topology": CircuitBreakerTopologyScene,/);
    expect(compositionsOf(scene).map((c) => c.id)).toEqual(["circuit-breaker-topology-16x9"]);
  });

  test("Word table", () => {
    expect(text.en).toEqual({
      checkout: "Checkout",
      payment: "Payment",
      retry: "retry ×3",
      breaker: ["`circuit-breaker:`", "`execute`"],
      states: { closed: "CLOSED", open: "OPEN", halfOpen: "HALF_OPEN" },
      timeout: "`HTTP:TIMEOUT`",
      open: "`CIRCUIT-BREAKER:OPEN`",
      message: ["payment temporarily", "unavailable"],
      ok: "`200`",
      business: "`400`",
      clock: "`resetTimeout 10s`",
      requests: "requests",
      calls: "backend calls",
      takes: ["1", "2"],
    });
    expect(scene.text).toBe(text);
  });

  test("One composition, last", () => {
    const entries = scenes.flatMap(compositionsOf);
    expect(entries.at(-1)).toEqual({ id: "circuit-breaker-topology-16x9", folder: ID, format: "16x9", lang: "en", width: 1920, height: 1080, fps: 30, durationInFrames: 1920 });
    expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length);
    const before = scenes.slice(0, scenes.indexOf(scene)).flatMap(compositionsOf);
    expect(entries.slice(0, before.length)).toEqual(before);
  });

  test("No 4:5 and no second language", () => {
    expect(scene.formats).toEqual(["16x9"]);
    for (const c of compositionsOf(scene)) expect(c.id).not.toMatch(/-(4x5|pt|en)$/);
  });

  test("Broken entry rejected", () => {
    const withPt = { ...scene, text: { ...scene.text, pt: scene.text.en } } as unknown as TakesSceneData;
    const httpPt = { ...scene, sources: { ...scene.sources, pt: "http://brunosouzas.com/pt/blog/circuit-breaker-in-mulesoft" } };
    const lateOutro = { ...scene, timeline: { ...scene.timeline, outro: 1831 } };
    expect(checkCatalogue([withPt]).join("\n")).toContain(`${ID}: a neutral scene has no pt text table`);
    expect(checkCatalogue([httpPt]).join("\n")).toContain(`${ID}: pt source article URL must start with https://`);
    expect(checkCatalogue([lateOutro]).join("\n")).toContain(`${ID}: outro at frame 1831 is inside the reading hold`);
  });
});

describe("Topology beats and timing", () => {
  test("Takes checks pass", () => {
    expect(checkCatalogue([scene])).toEqual([]);
    expect(checkTakes(scene)).toEqual([]);
  });
});

describe("Existing scenes unchanged by the topology scene", () => {
  test("Circuit-breaker states untouched", () => {
    // test/scenes/circuit-breaker.test.ts and its pinned timeline run unedited in the same `npm test`; the
    // `git diff` half of the scenario is a local check recorded in the pull request (CI checks out one commit).
    expect(scenes[0].id).toBe("circuit-breaker-states");
    expect(compositionsOf(scenes[0]).map((c) => c.id)).toEqual(["16x9-pt", "16x9-en", "4x5-pt", "4x5-en"].map((s) => `circuit-breaker-states-${s}`));
  });
});

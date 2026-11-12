// Neutral registration (spec scene-catalogue, "One composition per format and
// language", "Neutral scenes"; change sdd-without-with-spec-scene, task 1.1):
// a neutral scene has one composition per format, one English word table and
// both pages' sources. Fixtures are copies of the registered scene with one edit.
import { describe, expect, test } from "vitest";
import { checkCatalogue, checkText, compositionsOf, type CatalogueScene, type TakesSceneData } from "../../src/scenes/catalogue";
import { sddWithoutWithSpec as scene } from "../../src/scenes/sdd-without-with-spec/scene.ts";

const ID = "sdd-without-with-spec";
const edit = (change: Record<string, unknown>): CatalogueScene => ({ ...scene, ...change }) as unknown as TakesSceneData;
const problems = (change: Record<string, unknown>) => checkText(edit(change)).join("\n");

describe("One composition per format", () => {
  test("Neutral composition", () => {
    expect(compositionsOf(scene)).toEqual([
      { id: "sdd-without-with-spec-16x9", folder: ID, format: "16x9", lang: "en", width: 1920, height: 1080, fps: 30, durationInFrames: 780 },
    ]);
  });

  test("Duplicate neutral composition id", () => {
    expect(checkCatalogue([scene, scene]).join("\n")).toContain("duplicate composition id sdd-without-with-spec-16x9");
  });
});

describe("Neutral scenes", () => {
  test("Valid neutral scene", () => {
    expect(scene.languages).toEqual(["en"]);
    expect(Object.keys(scene.text)).toEqual(["en"]);
    expect(Object.keys(scene.sources).sort()).toEqual(["en", "pt"]);
    expect(checkText(scene)).toEqual([]);
  });

  test("Neutral scene with a Portuguese table", () => {
    expect(problems({ text: { ...scene.text, pt: scene.text.en } })).toContain(`${ID}: a neutral scene has no pt text table`);
  });

  test("Neutral scene in two languages", () => {
    expect(problems({ languages: ["pt", "en"] })).toContain(`${ID}: a neutral scene declares en only`);
    expect(problems({ languages: ["pt"] })).toContain(`${ID}: a neutral scene declares en only`);
  });

  test("Neutral scene missing a source", () => {
    expect(problems({ sources: { en: scene.sources.en } })).toContain(`${ID}: pt source article URL must start with https://`);
    expect(problems({ sources: { ...scene.sources, pt: "http://brunosouzas.com/pt/blog/spec-driven-development-in-practice" } })).toContain(
      `${ID}: pt source article URL must start with https://`,
    );
  });

  test("Neutral scene with an empty word", () => {
    expect(problems({ text: { en: { ...scene.text.en, approval: "" } } })).toContain(`${ID}: en approval is an empty string`);
    expect(problems({ text: { en: { ...scene.text.en, takes: [] } } })).toContain(`${ID}: en takes is an empty list`);
  });
});

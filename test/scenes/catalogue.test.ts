// Unit tests of the scene catalogue: composition registration data, and the
// checks of text tables and timelines run over every registered scene and over
// broken copies of it (spec scene-catalogue; tasks 4.1 and 4.2).
import { describe, expect, test } from "vitest";
import type { Phase, Timeline } from "../../src/brand/motion";
import { checkCatalogue, checkScene, checkText, checkTimeline, compositionsOf, type SceneData, type TextTable } from "../../src/scenes/catalogue";
import { scenes } from "../../src/scenes";
import { circuitBreakerStates } from "../../src/scenes/circuit-breaker-states/scene";

const base: SceneData = circuitBreakerStates;
const ID = base.id;

const withTimeline = (change: Partial<Timeline>): SceneData => ({ ...base, timeline: { ...base.timeline, ...change } });
const withPhases = (edit: (phases: Phase[]) => Phase[]): SceneData =>
  withTimeline({ phases: edit(base.timeline.phases.map((phase) => ({ ...phase, events: [...phase.events] }))) });
const withText = (lang: "pt" | "en", table: TextTable): SceneData => ({ ...base, text: { ...base.text, [lang]: table } });
const en = base.text.en as Record<string, TextTable>;
const pt = base.text.pt as Record<string, TextTable>;

describe("Registered scenes", () => {
  test("every registered scene passes the catalogue checks", () => {
    expect(scenes.length).toBeGreaterThan(0);
    expect(checkCatalogue(scenes)).toEqual([]);
  });
});

describe("One composition per format and language", () => {
  test("Circuit-breaker compositions", () => {
    const entries = scenes.flatMap(compositionsOf).filter((entry) => entry.folder === "circuit-breaker-states");
    expect(entries.map(({ id, width, height, fps, folder, durationInFrames }) => ({ id, width, height, fps, folder, durationInFrames }))).toEqual([
      { id: "circuit-breaker-states-16x9-pt", width: 1920, height: 1080, fps: 30, folder: "circuit-breaker-states", durationInFrames: 1000 },
      { id: "circuit-breaker-states-16x9-en", width: 1920, height: 1080, fps: 30, folder: "circuit-breaker-states", durationInFrames: 1000 },
      { id: "circuit-breaker-states-4x5-pt", width: 1080, height: 1350, fps: 30, folder: "circuit-breaker-states", durationInFrames: 1000 },
      { id: "circuit-breaker-states-4x5-en", width: 1080, height: 1350, fps: 30, folder: "circuit-breaker-states", durationInFrames: 1000 },
    ]);
  });

  test("Duplicate composition id", () => {
    const first: SceneData = { ...base, id: "fixture-scene" };
    const second: SceneData = { ...base, id: "fixture-scene" };
    const problems = checkCatalogue([first, second]);
    expect(problems).toContainEqual(expect.stringContaining("duplicate composition id fixture-scene-16x9-pt"));
  });

  test("scene id that could leave out/ fails the catalogue check", () => {
    for (const id of ["../victim", "a/b", "Upper"]) {
      expect(checkCatalogue([{ ...base, id }])).toContainEqual(expect.stringContaining(`invalid scene id ${JSON.stringify(id)}`));
    }
  });
});

describe("Text table per language", () => {
  test("Key missing in one language", () => {
    const { small: _dropped, ...toOpenWithoutSmall } = en.toOpen as { lines: string[]; small: string };
    const problems = checkText(withText("en", { ...en, toOpen: toOpenWithoutSmall }));
    expect(problems).toEqual([`${ID}: en lacks key toOpen.small`]);
  });

  test("Lists of different lengths", () => {
    const scene = withText("pt", { ...pt, halfToOpen: { lines: ["qualquer", "falha durante", "o teste"] } });
    expect((scene.text.pt.halfToOpen as { lines: string[] }).lines).toHaveLength(3);
    expect((scene.text.en.halfToOpen as { lines: string[] }).lines).toHaveLength(2);
    expect(checkScene(scene)).toEqual([]);
  });

  test("Empty list", () => {
    const problems = checkText(withText("pt", { ...pt, toHalf: { lines: [] } }));
    expect(problems).toEqual([`${ID}: pt toHalf.lines is an empty list`]);
  });

  test("Empty string or missing source", () => {
    const captions = en.captions as Record<string, string>;
    expect(checkText(withText("en", { ...en, captions: { ...captions, open: "" } }))).toEqual([
      `${ID}: en captions.open is an empty string`,
    ]);
    expect(checkText({ ...base, sources: { ...base.sources, pt: "http://brunosouzas.com/pt/blog/circuit-breaker-in-mulesoft" } })).toEqual([
      expect.stringMatching(new RegExp(`^${ID}: pt source article URL must start with https://`)),
    ]);
    expect(checkText({ ...base, sources: { en: base.sources.en } as SceneData["sources"] })).toEqual([
      expect.stringMatching(new RegExp(`^${ID}: pt source article URL`)),
    ]);
  });
});

describe("Valid timeline", () => {
  test("Phase beyond the composition", () => {
    for (const to of [1000, 1005]) {
      const problems = checkTimeline(withPhases((phases) => phases.map((p, i) => (i === 5 ? { ...p, to } : p))));
      expect(problems).toEqual([`${ID}: phase 6 (closed [820, ${to}]) is outside the composition [0, 999]`]);
    }
  });

  test("Fire outside its window", () => {
    const fireAt = (frame: number) => withTimeline({ fires: { ...base.timeline.fires, toOpen: [frame] } });
    // Before its CLOSED phase starts, and after the next (OPEN) phase starts.
    for (const frame of [30, 250]) {
      expect(checkTimeline(fireAt(frame))).toContainEqual(
        expect.stringMatching(new RegExp(`^${ID}: transition toOpen \\(closed to open\\) fires at frame ${frame}, outside its window`)),
      );
    }
    // The next phase is not OPEN.
    const notOpen = withPhases((phases) => phases.map((p, i) => (i === 1 ? { ...p, state: "half", events: [] } : p)));
    expect(checkTimeline(notOpen)).toContainEqual(
      expect.stringMatching(new RegExp(`^${ID}: transition toOpen \\(closed to open\\) fires at frame 215, outside its window`)),
    );
  });

  test("Outro inside the reading hold", () => {
    expect(base.timeline.duration).toBe(1000);
    const problems = checkTimeline(withTimeline({ outro: 950 }), 90);
    expect(problems).toEqual([`${ID}: outro at frame 950 is inside the reading hold (must be at most 910)`]);
  });

  test("Overlapping phases", () => {
    for (const from of [365, 300]) {
      const problems = checkTimeline(withPhases((phases) => phases.map((p, i) => (i === 2 ? { ...p, from } : p))));
      expect(problems).toContainEqual(`${ID}: phase 3 (half [${from}, 500]) overlaps phase 2 (open [245, 365])`);
    }
  });

  test("Event outside its phase", () => {
    const problems = checkTimeline(
      withPhases((phases) => phases.map((p, i) => (i === 2 ? { ...p, events: [...p.events, { at: 505, kind: "fail" }] } : p))),
    );
    expect(problems).toContainEqual(`${ID}: event at frame 505 is outside phase 3 (half [410, 500])`);
  });

  test("Movement inside the reading hold", () => {
    // An event at the outro frame.
    const lateEvent = withPhases((phases) =>
      phases.map((p, i) => (i === 5 ? { ...p, events: [...p.events, { at: 910, kind: "ok" }] } : p)),
    );
    expect(checkTimeline(lateEvent)).toEqual([`${ID}: event of phase 6 (closed [820, 990]) at frame 910 is at or after the outro (frame 910)`]);
    // A fire, and with it an arrow draw and a pill pop-in, after the outro.
    const lateTransition = withTimeline({
      phases: [...base.timeline.phases, { state: "open", from: 960, to: 999, events: [] }],
      fires: { ...base.timeline.fires, toOpen: [215, 950] },
    });
    expect(checkTimeline(lateTransition)).toEqual(
      expect.arrayContaining([
        `${ID}: fire of toOpen at frame 950 is at or after the outro (frame 910)`,
        `${ID}: start of phase 7 (open [960, 999]) at frame 960 is at or after the outro (frame 910)`,
      ]),
    );
    const lateArrow = withTimeline({ arrowLead: -900 });
    expect(checkTimeline(lateArrow)).toContainEqual(expect.stringMatching(/arrow draw of toOpen at frame 1115 is at or after the outro/));
    expect(checkTimeline(lateArrow)).toContainEqual(expect.stringMatching(/pill pop-in of toOpen at frame 1123 is at or after the outro/));
  });
});

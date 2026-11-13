// The `sequence` kind (spec scene-catalogue, "Sequence scene kind", "Sequence
// cast and hold"; change sdd-scene-3-archive, task 1.2, porting
// sdd-scene-2-files' test). Every fixture is the registered scene
// `sdd-scene-3-archive` with one edit, so each test proves one rule; the
// `takes` scenes and fixture are checked to get exactly what they got before
// `checkCast` and `checkHold` were shared.
import { describe, expect, test } from "vitest";
import { checkCatalogue, checkTimeline, type SequenceSceneData } from "../../src/scenes/catalogue";
import { scenes } from "../../src/scenes";
import { sddScene3Archive as scene } from "../../src/scenes/sdd-scene-3-archive/scene.ts";
import { checkSequence, type SequenceTimeline } from "../../src/scenes/sequence-kind";
import { checkTakes } from "../../src/scenes/takes-kind";
import { takesFixture } from "../fixtures/takes-scene";

const ID = "sdd-scene-3-archive";
const t: SequenceTimeline = scene.timeline;
const withTimeline = (change: Partial<SequenceTimeline>): SequenceSceneData => ({ ...scene, timeline: { ...t, ...change } });
const joined = (change: Partial<SequenceTimeline>) => checkTimeline(withTimeline(change)).join("\n");

describe("Sequence scene kind", () => {
  test("Valid sequence", () => {
    expect(checkTimeline(scene)).toEqual([]);
    expect(checkSequence(scene)).toEqual([]);
    expect(t.phases.map((p) => p.id)).toEqual(["setup", "archive-1", "request", "propose", "review", "approve", "apply", "archive-2", "ending"]);
    expect("rewind" in t).toBe(false);
  });

  test("Sequence phase without an article line", () => {
    for (const cites of [[], [0], [203.5]]) {
      const phases = t.phases.map((p) => (p.id === "request" ? { ...p, cites } : p));
      expect(joined({ phases })).toContain(`${ID}: phase request cites no valid article line`);
    }
  });

  test("Localised sequence scene", () => {
    const localised = { ...scene, neutral: false } as unknown as SequenceSceneData;
    expect(checkTimeline(localised).join("\n")).toContain(`${ID}: a sequence scene is neutral`);
  });

  test("Sequence with a take or a rewind rejected", () => {
    const phases = t.phases.map((p) => (p.id === "review" ? { ...p, take: 1 } : p));
    expect(joined({ phases })).toContain(`${ID}: phase review has a take; a sequence scene has none`);
    const rewound = { ...t, rewind: { from: 400, to: 410, objects: [399, 300] } } as SequenceTimeline;
    expect(checkTimeline({ ...scene, timeline: rewound }).join("\n")).toContain(`${ID}: a sequence scene has no rewind`);
  });

  test("Sequence outro inside the reading hold", () => {
    expect(joined({ outro: 515 })).toContain(`${ID}: outro at frame 515 is inside the reading hold (must be at most 510)`);
  });
});

describe("Sequence cast and hold", () => {
  test("Overlapping acts in a sequence", () => {
    const acts = [...t.acts, { actor: "chaves" as const, from: 350, to: 355 }];
    expect(joined({ acts })).toContain(`${ID}: act of balao [344, 360] overlaps act of chaves [350, 355]`);
  });

  test("Cue in the reading hold", () => {
    const cues = { ...t.cues, ending: [...t.cues.ending, 500] };
    expect(joined({ cues })).toContain(`${ID}: cue ending at frame 500 is at or after the outro (frame 500)`);
  });

  test("Takes scenes unchanged", () => {
    expect(checkTimeline(takesFixture)).toEqual([]);
    for (const s of scenes) if (s.kind === "takes") expect(checkTakes(s), s.id).toEqual([]);
    expect(checkCatalogue(scenes)).toEqual([]);
  });
});

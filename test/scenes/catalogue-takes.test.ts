// The `takes` kind (spec scene-catalogue, "Two-take scene kind", "Two-take cast
// timing", "Two-take reading hold", and the takes cases of "Valid timeline";
// change scene-takes-infrastructure, tasks 3.1 to 3.3). Every fixture is the
// test-only scene `takes-fixture` (test/fixtures/takes-scene.ts) with one
// edit, so each test proves one rule.
import { describe, expect, test } from "vitest";
import { checkTimeline, type TakesSceneData } from "../../src/scenes/catalogue";
import type { TakesTimeline } from "../../src/scenes/takes-kind";
import { TAKES_FIXTURE_ID as ID, takesFixture as scene } from "../fixtures/takes-scene";

const t: TakesTimeline = scene.timeline;
const withTimeline = (change: Partial<TakesTimeline>): TakesSceneData => ({ ...scene, timeline: { ...t, ...change } });
const errors = (change: Partial<TakesTimeline>) => checkTimeline(withTimeline(change));
const joined = (change: Partial<TakesTimeline>) => errors(change).join("\n");
const phases = (edit: (phase: TakesTimeline["phases"][number]) => TakesTimeline["phases"][number]) => t.phases.map(edit);

describe("Two-take scene kind", () => {
  test("Valid takes", () => {
    expect(t.phases.map((p) => [p.id, p.take])).toEqual([
      ["t1-open", 1], ["t1-act", 1], ["t1-result", 1], ["rewind", "rewind"], ["t2-open", 2], ["t2-act", 2], ["t2-result", 2],
    ]);
    for (const phase of t.phases) expect(phase.cites.length, phase.id).toBeGreaterThan(0);
    expect(checkTimeline(scene)).toEqual([]);
  });

  test("Takes out of order", () => {
    const breaks = (fixture: TakesTimeline["phases"]) => errors({ phases: fixture }).filter((line) => line.includes("breaks the take order"));
    const ORDER = "(take-1 phases, one rewind, then take-2 phases)";
    expect(breaks(phases((p) => (p.id === "t2-open" ? { ...p, take: 1 } : p)))).toEqual([`${ID}: phase t2-open (take 1) breaks the take order ${ORDER}`]);
    expect(breaks(phases((p) => (p.id === "t1-result" ? { ...p, take: 2 } : p)))).toEqual([`${ID}: phase t1-result (take 2) breaks the take order ${ORDER}`]);
    // A second rewind phase right after t2-open (t2-open shortened to make room).
    const second = { ...t.phases[3], id: "rewind-again", from: 505, to: 509, events: [] };
    const withSecond = [...t.phases.slice(0, 4), { ...t.phases[4], to: 504, events: t.phases[4].events.filter((e) => e.at <= 504) }, second, ...t.phases.slice(5)];
    expect(breaks(withSecond)).toEqual([`${ID}: phase rewind-again (rewind) breaks the take order ${ORDER}`]);
    expect(breaks(t.phases.filter((p) => p.take !== 1))).toEqual([`${ID}: phase rewind (rewind) breaks the take order ${ORDER}`]);
    // No take 2 at all: the order ends early.
    expect(joined({ phases: t.phases.filter((p) => p.take !== 2) })).toContain(`${ID}: the takes end at phase rewind without completing the order`);
  });

  test("Phase without an article line", () => {
    for (const cites of [[], [0], [26.5]]) {
      expect(joined({ phases: phases((p) => (p.id === "t1-act" ? { ...p, cites } : p)) })).toContain(`${ID}: phase t1-act cites no valid article line`);
    }
  });

  test("Localised takes scene", () => {
    const localised = { ...scene, neutral: false } as unknown as TakesSceneData;
    expect(checkTimeline(localised).join("\n")).toContain(`${ID}: a takes scene is neutral`);
  });
});

describe("Valid timeline, takes cases", () => {
  test("Takes scene needs no slots or fires", () => {
    expect("slots" in t || "transitions" in t || "fires" in t).toBe(false);
    const found = checkTimeline(scene).join("\n");
    expect(found).not.toMatch(/never fires|outside its window/);
    expect(found).toBe("");
  });

  test("Takes outro inside the reading hold", () => {
    expect(joined({ outro: 691 })).toContain(`${ID}: outro at frame 691 is inside the reading hold (must be at most 690)`);
  });

  test("Phase beyond the composition", () => {
    expect(joined({ phases: phases((p) => (p.id === "t2-result" ? { ...p, to: 780 } : p)) })).toContain(`${ID}: phase 7 (t2-result [600, 780]) is outside the composition`);
  });

  test("Overlapping phases", () => {
    expect(joined({ phases: phases((p) => (p.id === "t1-act" ? { ...p, from: 89 } : p)) })).toContain("phase 2 (t1-act [89, 239]) overlaps phase 1 (t1-open [24, 89])");
  });

  test("Event outside its phase", () => {
    expect(joined({ phases: phases((p) => (p.id === "t1-open" ? { ...p, events: [...p.events, { id: "late", at: 90 }] } : p)) })).toContain(
      `${ID}: event at frame 90 is outside phase 1 (t1-open [24, 89])`,
    );
  });

  test("Movement inside the reading hold", () => {
    expect(joined({ phases: phases((p) => (p.id === "t2-result" ? { ...p, events: [...p.events, { id: "late", at: 690 }] } : p)) })).toContain(
      `${ID}: event late of phase t2-result at frame 690 is at or after the outro (frame 690)`,
    );
    expect(joined({ pops: { ...t.pops, stamp: 690 } })).toContain(`${ID}: pop-in stamp at frame 690 is too late to settle by the outro`);
  });
});

describe("Two-take cast timing", () => {
  test("The fixture's own cues pass", () => {
    expect(t.acts).toEqual([
      { actor: "visor", from: 90, to: 90 }, { actor: "visor", from: 344, to: 344 }, { actor: "visor", from: 390, to: 480 }, { actor: "visor", from: 600, to: 600 },
    ]);
    expect(t.faces.map((f) => f.at)).toEqual([270, 344, 504, 600, 660]);
    expect(t.emotes).toEqual([
      { actor: "visor", kind: "problem", at: 270, leaveAt: 320 },
      { actor: "visor", kind: "worked", at: 660, leaveAt: null },
    ]);
    expect(checkTimeline(scene).filter((line) => /act|emote|face/.test(line))).toEqual([]);
  });

  test("Two actors at once", () => {
    expect(joined({ acts: [...t.acts, { actor: "mira", from: 470, to: 490 }] })).toContain(`${ID}: act of visor [390, 480] overlaps act of mira [470, 490]`);
  });

  test("Emote off an expression change", () => {
    expect(joined({ emotes: [{ ...t.emotes[0], at: 271 }, t.emotes[1]] })).toContain(`${ID}: emote problem at frame 271 is not on an expression change of visor`);
    // A face entry that repeats the current expression is not a change.
    const repeat: Partial<TakesTimeline> = {
      faces: [...t.faces, { actor: "visor", at: 400, expression: "idle" }],
      emotes: [...t.emotes, { actor: "visor", kind: "doubt", at: 400, leaveAt: 410 }],
    };
    expect(joined(repeat)).toContain(`${ID}: emote doubt at frame 400 is not on an expression change of visor`);
  });

  test("Two emotes on screen", () => {
    expect(joined({ emotes: [{ ...t.emotes[0], leaveAt: null }, t.emotes[1]] })).toContain(`${ID}: emotes problem [270, 780) and worked [660, 780) are on screen together`);
  });

  test("Emote still visible at the next action", () => {
    expect(joined({ emotes: [{ ...t.emotes[0], leaveAt: 336 }, t.emotes[1]] })).toContain(`${ID}: emote problem is still visible at the act of visor at frame 344 (gone at 346)`);
    expect(errors({ emotes: [{ ...t.emotes[0], leaveAt: 334 }, t.emotes[1]] })).toEqual([]);
  });
});

describe("Two-take reading hold", () => {
  test("The fixture's own hold passes", () => {
    expect(t.outro).toBe(690);
    expect(Math.max(...Object.values(t.pops), ...t.emotes.map((e) => e.at))).toBe(660);
    expect(Math.max(...Object.values(t.fades).flatMap((f) => [f.in[1], ...(f.out ? [f.out[1]] : [])]))).toBe(610);
    expect(checkTimeline(scene)).toEqual([]);
  });

  test("Cue at or after the outro", () => {
    expect(joined({ faces: [...t.faces, { actor: "visor", at: 690, expression: "idle" }] })).toContain(`${ID}: face idle of visor at frame 690 is at or after the outro`);
    expect(joined({ acts: [...t.acts, { actor: "visor", from: 700, to: 700 }] })).toContain(`${ID}: act of visor [700, 700] at frame 700 is at or after the outro`);
    expect(joined({ trips: [...t.trips, { id: "late", route: "route-1", from: 669, to: 691 }] })).toContain(`${ID}: arrival of trip late at frame 691 is at or after the outro`);
    expect(joined({ fades: { ...t.fades, pathB: { in: [685, 695] } } })).toContain(`${ID}: fade-in of pathB (ends) at frame 695 is at or after the outro`);
    expect(joined({ cues: { ...t.cues, lines: [...t.cues.lines, 690] } })).toContain(`${ID}: cue lines at frame 690 is at or after the outro`);
    expect(joined({ emotes: [t.emotes[0], { ...t.emotes[1], leaveAt: 685 }] })).toContain(`${ID}: leave of emote worked (ends) at frame 695 is at or after the outro`);
    expect(joined({ leaves: { rewindMark: 680 } })).toContain(`${ID}: leave of rewindMark (ends) at frame 690 is at or after the outro`);
    expect(joined({ rewind: { ...t.rewind, to: 690 } })).toContain(`${ID}: end of the rewind at frame 690 is at or after the outro`);
    expect(joined({ ringsFade: [0, 695] })).toContain(`${ID}: rings fade (ends) at frame 695 is at or after the outro`);
  });

  test("Pop-in too late to settle", () => {
    expect(joined({ pops: { ...t.pops, stamp: 661 } })).toContain(`${ID}: pop-in stamp at frame 661 is too late to settle by the outro (at most 660)`);
    const workedAt = (at: number): Partial<TakesTimeline> => ({
      faces: t.faces.map((f) => (f.at === 660 ? { ...f, at } : f)),
      emotes: t.emotes.map((e) => (e.kind === "worked" ? { ...e, at } : e)),
    });
    expect(joined(workedAt(661))).toContain(`${ID}: emote worked at frame 661 is too late to settle by the outro (at most 660)`);
    expect(errors({ pops: { ...t.pops, stamp: 660 } })).toEqual([]);
    expect(errors(workedAt(660))).toEqual([]);
  });
});

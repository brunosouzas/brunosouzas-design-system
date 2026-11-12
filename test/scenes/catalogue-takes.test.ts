// The `takes` kind (spec scene-catalogue, "Two-take scene kind", "Two-take cast
// timing", "Two-take reading hold", and the takes cases of "Valid timeline";
// change sdd-without-with-spec-scene, tasks 2.1 to 2.3). Every fixture is the
// registered scene's timeline with one edit, so each test proves one rule.
import { describe, expect, test } from "vitest";
import { checkTimeline, type TakesSceneData } from "../../src/scenes/catalogue";
import type { TakesTimeline } from "../../src/scenes/takes-kind";
import { sddWithoutWithSpec as scene } from "../../src/scenes/sdd-without-with-spec/scene.ts";

const ID = "sdd-without-with-spec";
const t = scene.timeline;
const withTimeline = (change: Partial<TakesTimeline>): TakesSceneData => ({ ...scene, timeline: { ...t, ...change } });
const errors = (change: Partial<TakesTimeline>) => checkTimeline(withTimeline(change));
const joined = (change: Partial<TakesTimeline>) => errors(change).join("\n");
const phases = (edit: (phase: TakesTimeline["phases"][number]) => TakesTimeline["phases"][number]) => t.phases.map(edit);

describe("Two-take scene kind", () => {
  test("Valid takes", () => {
    expect(t.phases.map((p) => [p.id, p.take])).toEqual([
      ["request", 1], ["guess", 1], ["error", 1], ["rewind", "rewind"], ["ask", 2], ["answer", 2], ["implement", 2],
    ]);
    for (const phase of t.phases) expect(phase.cites.length, phase.id).toBeGreaterThan(0);
    expect(checkTimeline(scene)).toEqual([]);
  });

  test("Takes out of order", () => {
    const breaks = (fixture: TakesTimeline["phases"]) => errors({ phases: fixture }).filter((line) => line.includes("breaks the take order"));
    expect(breaks(phases((p) => (p.id === "ask" ? { ...p, take: 1 } : p)))).toEqual([`${ID}: phase ask (take 1) breaks the take order (take-1 phases, one rewind, then take-2 phases)`]);
    expect(breaks(phases((p) => (p.id === "error" ? { ...p, take: 2 } : p)))).toEqual([`${ID}: phase error (take 2) breaks the take order (take-1 phases, one rewind, then take-2 phases)`]);
    const second = { ...t.phases[3], id: "rewind-again", from: 505, to: 509, events: [] };
    const withSecond = [...t.phases.slice(0, 4), { ...t.phases[4], to: 504, events: t.phases[4].events.filter((e) => e.at <= 504) }, second, ...t.phases.slice(5)];
    expect(breaks(withSecond)).toEqual([`${ID}: phase rewind-again (rewind) breaks the take order (take-1 phases, one rewind, then take-2 phases)`]);
    expect(breaks(t.phases.filter((p) => p.take !== 1))).toEqual([`${ID}: phase rewind (rewind) breaks the take order (take-1 phases, one rewind, then take-2 phases)`]);
  });

  test("Phase without an article line", () => {
    for (const cites of [[], [0], [26.5]]) {
      expect(joined({ phases: phases((p) => (p.id === "guess" ? { ...p, cites } : p)) })).toContain(`${ID}: phase guess cites no valid article line`);
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
    expect(joined({ phases: phases((p) => (p.id === "implement" ? { ...p, to: 780 } : p)) })).toContain(`${ID}: phase 7 (implement [600, 780]) is outside the composition`);
  });

  test("Overlapping phases", () => {
    expect(joined({ phases: phases((p) => (p.id === "guess" ? { ...p, from: 89 } : p)) })).toContain("phase 2 (guess [89, 239]) overlaps phase 1 (request [24, 89])");
  });

  test("Event outside its phase", () => {
    expect(joined({ phases: phases((p) => (p.id === "request" ? { ...p, events: [...p.events, { id: "late", at: 90 }] } : p)) })).toContain(
      `${ID}: event at frame 90 is outside phase 1 (request [24, 89])`,
    );
  });

  test("Movement inside the reading hold", () => {
    expect(joined({ phases: phases((p) => (p.id === "implement" ? { ...p, events: [...p.events, { id: "late", at: 690 }] } : p)) })).toContain(
      `${ID}: event late of phase implement at frame 690 is at or after the outro (frame 690)`,
    );
    expect(joined({ pops: { ...t.pops, stamp: 690 } })).toContain(`${ID}: pop-in stamp at frame 690 is too late to settle by the outro`);
  });
});

describe("Two-take cast timing", () => {
  test("The scene's own cues pass", () => {
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
  test("The scene's own hold passes", () => {
    expect(t.outro).toBe(690);
    expect(Math.max(...Object.values(t.pops), ...t.emotes.map((e) => e.at))).toBe(660);
    expect(Math.max(...Object.values(t.fades).flatMap((f) => [f.in[1], ...(f.out ? [f.out[1]] : [])]))).toBe(610);
    expect(checkTimeline(scene)).toEqual([]);
  });

  test("Cue at or after the outro", () => {
    expect(joined({ faces: [...t.faces, { actor: "visor", at: 690, expression: "idle" }] })).toContain(`${ID}: face idle of visor at frame 690 is at or after the outro`);
    expect(joined({ acts: [...t.acts, { actor: "visor", from: 700, to: 700 }] })).toContain(`${ID}: act of visor [700, 700] at frame 700 is at or after the outro`);
    expect(joined({ trips: [...t.trips, { id: "late", route: "answer-0", from: 669, to: 691 }] })).toContain(`${ID}: arrival of trip late at frame 691 is at or after the outro`);
    expect(joined({ fades: { ...t.fades, p3: { in: [685, 695] } } })).toContain(`${ID}: fade-in of p3 (ends) at frame 695 is at or after the outro`);
    expect(joined({ cues: { ...t.cues, take2Lines: [...t.cues.take2Lines, 690] } })).toContain(`${ID}: cue take2Lines at frame 690 is at or after the outro`);
    expect(joined({ emotes: [t.emotes[0], { ...t.emotes[1], leaveAt: 685 }] })).toContain(`${ID}: leave of emote worked (ends) at frame 695 is at or after the outro`);
    expect(joined({ leaves: { rewindMark: 680 } })).toContain(`${ID}: leave of rewindMark (ends) at frame 690 is at or after the outro`);
    expect(joined({ rewind: { ...t.rewind, to: 690 } })).toContain(`${ID}: end of the rewind at frame 690 is at or after the outro`);
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

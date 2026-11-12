// A test-only neutral `takes` scene (change scene-takes-infrastructure, design
// §2). It is not registered in src/scenes/index.ts: the catalogue's neutral and
// takes rules take any scene, and a registered scene must illustrate a
// published article (ADR 0004). Its frame numbers are those of the scenarios
// first written for PR #41, so each test edits one field and proves one rule.
//
// How to use: import `takesFixture` in a test and spread it with one change.
// What can go wrong: if a rule changes, `checkCatalogue([takesFixture])` must
// still return no problem ("Valid neutral scene", "Valid takes").
// Every word and URL here is synthetic (TEST-3).
import type { TakesSceneData } from "../../src/scenes/catalogue";

export const TAKES_FIXTURE_ID = "takes-fixture";

export const takesFixture = {
  id: TAKES_FIXTURE_ID,
  kind: "takes",
  neutral: true,
  formats: ["16x9"],
  languages: ["en"],
  text: { en: { label: "spec.md", takes: ["1", "2"] } },
  sources: { pt: "https://example.com/pt/article", en: "https://example.com/en/article" },
  timeline: {
    duration: 780,
    outro: 690,
    ringsFade: [0, 20],
    phases: [
      { id: "t1-open", take: 1, from: 24, to: 89, cites: [20, 22], events: [{ id: "request", at: 24 }] },
      { id: "t1-act", take: 1, from: 90, to: 239, cites: [26], events: [{ id: "act", at: 90 }, { id: "token-0", at: 100 }] },
      { id: "t1-result", take: 1, from: 240, to: 339, cites: [26], devices: ["fright"], events: [{ id: "face-failed", at: 270 }] },
      { id: "rewind", take: "rewind", from: 340, to: 377, cites: [22], devices: ["rewind"], events: [{ id: "reset", at: 344 }] },
      { id: "t2-open", take: 2, from: 390, to: 509, cites: [72], events: [{ id: "hold", at: 390 }, { id: "face-waiting", at: 504 }] },
      { id: "t2-act", take: 2, from: 510, to: 599, cites: [120], events: [{ id: "token-1", at: 512 }, { id: "stamp", at: 584 }] },
      { id: "t2-result", take: 2, from: 600, to: 689, cites: [152], events: [{ id: "act", at: 600 }, { id: "face-done", at: 660 }] },
    ],
    rewind: { from: 344, to: 377, objects: [339, 89] },
    acts: [
      { actor: "visor", from: 90, to: 90 },
      { actor: "visor", from: 344, to: 344 },
      { actor: "visor", from: 390, to: 480 },
      { actor: "visor", from: 600, to: 600 },
    ],
    faces: [
      { actor: "visor", at: 270, expression: "failed" },
      { actor: "visor", at: 344, expression: "idle" },
      { actor: "visor", at: 504, expression: "waiting" },
      { actor: "visor", at: 600, expression: "idle" },
      { actor: "visor", at: 660, expression: "done" },
    ],
    emotes: [
      { actor: "visor", kind: "problem", at: 270, leaveAt: 320 },
      { actor: "visor", kind: "worked", at: 660, leaveAt: null },
    ],
    trips: [
      { id: "token-0", route: "route-0", from: 100, to: 122 },
      { id: "token-1", route: "route-1", from: 512, to: 534 },
    ],
    pops: { request: 24, badge2: 378, stamp: 584 },
    fades: { pathA: { in: [90, 100], out: [220, 230] }, pathB: { in: [600, 610] } },
    leaves: { rewindMark: 400 },
    cues: { lines: [616, 651], rows: [426, 476] },
  },
} satisfies TakesSceneData;

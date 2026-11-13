// A test-only neutral `sequence` scene (change sdd-scene-3-archive, porting
// the `sequence` kind from `sdd-scene-2-files`, PR #48). It is not registered
// in src/scenes/index.ts: the catalogue's neutral and sequence rules take any
// scene, and a registered scene must illustrate a published article (ADR
// 0004). Mirrors test/fixtures/takes-scene.ts's shape, minus the rewind.
//
// How to use: import `sequenceFixture` in a test and spread it with one change.
// Every word and URL here is synthetic (TEST-3).
import type { SequenceSceneData } from "../../src/scenes/catalogue";

export const SEQUENCE_FIXTURE_ID = "sequence-fixture";

export const sequenceFixture = {
  id: SEQUENCE_FIXTURE_ID,
  kind: "sequence",
  neutral: true,
  formats: ["16x9"],
  languages: ["en"],
  text: { en: { label: "spec.md" } },
  sources: { pt: "https://example.com/pt/article", en: "https://example.com/en/article" },
  timeline: {
    duration: 300,
    outro: 210,
    ringsFade: [0, 20],
    phases: [
      { id: "open", from: 24, to: 89, cites: [20, 22], events: [{ id: "request", at: 24 }] },
      { id: "act", from: 90, to: 149, cites: [26], events: [{ id: "act", at: 90 }, { id: "token-0", at: 100 }] },
      { id: "result", from: 150, to: 209, cites: [120], events: [{ id: "face-done", at: 180 }] },
    ],
    acts: [{ actor: "visor", from: 90, to: 90 }],
    faces: [{ actor: "visor", at: 180, expression: "done" }],
    emotes: [{ actor: "visor", kind: "worked", at: 180, leaveAt: null }],
    trips: [{ id: "token-0", route: "route-0", from: 100, to: 122 }],
    pops: { request: 24 },
    fades: { pathA: { in: [90, 100] } },
    leaves: {},
    cues: { lines: [160] },
  },
} satisfies SequenceSceneData;

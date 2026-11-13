// The SDD files scene's choreography (change sdd-scene-2-files, design §4):
// the beat table as data, evaluated by absolute frame, never simulated. No
// React, so the catalogue, the stills and render scripts and the tests import it.
//
// `makeTimeline(travel, fade)` builds it from `motion.travel` and
// `motion.fade`, so a change of either token moves the arrivals and fade ends
// and fails the pinned beat-table test instead of silently retiming the scene;
// the scene uses `timeline`. A `sequence` scene (sequence-kind.ts): its phases
// run once, in order; the two review rounds and the owner's approval are
// consecutive moments of one change (design §2.1).
//
// Retiming is a visual change: it goes back into design §4 and the pinned
// test in the same commit (MOT-5).
import { tokens } from "../../../tokens/generated/tokens";
import type { CastExpression } from "../../pieces/index.ts";
import type { SequenceDevice, SequenceTimeline } from "../sequence-kind";

/** The four files of the change, left to right (L89–L96). */
export const FILES = ["proposal", "design", "tasks", "spec"] as const;
export type FileId = (typeof FILES)[number];
/** The six open questions of `proposal.md` (L108–L113). */
export const QUESTIONS = 6;
/** Code lines Visor writes: the DataWeave `if` / `else if` chain of L157–L162. */
export const CODE_LINES = 6;
/** Frames a flagged file jolts (design §2.3). */
export const JOLT_FRAMES = 12;

/**
 * A row's state (design §2.7): `question` a `?` row of `proposal.md`,
 * `answered` that row with its check, `flagged` a finding on a row (drawn as a
 * `?`), `checked` a fixed row (its tail check); `plain` before any change.
 */
export type RowState = "plain" | "question" | "answered" | "flagged" | "checked";
export type RowChange = { file: FileId; row: number; at: number; to: Exclude<RowState, "plain"> };

export type CastActor = "balao" | "chaves" | "visor";
/** The cast's action parameters (CAST-4): what an act may change. */
export type CastSet = { speaks?: boolean; holdsStamp?: boolean; types?: boolean; points?: boolean };
export type CastAction = { actor: CastActor; at: number; set: CastSet };

export type FilesTimeline = SequenceTimeline & {
  /** The cast's action changes (design §4.2). */
  actions: readonly CastAction[];
  /** Every row change of the four files (design §4.2, "Row changes"). */
  rows: readonly RowChange[];
};

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const ev = (id: string, at: number) => ({ id, at });

/** The findings of review 1 (L128–L131) and review 2 (L133), in order: file, row (design §2.3). */
const FINDINGS_1: readonly { file: FileId; row: number }[] = [{ file: "spec", row: 1 }, { file: "spec", row: 2 }, { file: "spec", row: 3 }, { file: "tasks", row: 3 }];
const FINDINGS_2: readonly { file: FileId; row: number }[] = [{ file: "spec", row: 4 }, { file: "spec", row: 5 }];

export const makeTimeline = (travel: number = tokens.motion.travel, fade: number = tokens.motion.fade): FilesTimeline => {
  const T = travel, F = fade;
  const span = (from: number): [number, number] => [from, from + F];
  const trip = (id: string, from: number) => ({ id, route: id, from, to: from + T });

  // ---------------------------------------------------------------- init and propose (40–149)
  const files = FILES.map((file, k) => trip(`file-${file}`, 96 + 6 * k));
  // ---------------------------------------------------------------- list and answer (150–279)
  const rowsAt = range(QUESTIONS).map((j) => 154 + 8 * j);
  const answersAt = range(QUESTIONS).map((k) => 218 + 8 * k);
  // ---------------------------------------------------------------- the reviews and fixes (280–599)
  const findings1 = [290, 308, 326, 344];
  const fixes1 = [428, 434, 440, 446];
  const findings2 = [470, 494];
  const fixes2 = [578, 584];
  // ---------------------------------------------------------------- approval and apply (600–769)
  const go = trip("go", 626);
  const codeLines = range(CODE_LINES).map((j) => 682 + 8 * j);

  const actions: CastAction[] = [
    { actor: "chaves", at: 40, set: { types: true } },
    { actor: "chaves", at: 84, set: { types: false } },
    { actor: "visor", at: 90, set: { points: true } },
    { actor: "visor", at: 202, set: { points: false } },
    { actor: "balao", at: 210, set: { speaks: true } },
    { actor: "balao", at: 266, set: { speaks: false } },
    { actor: "balao", at: 606, set: { holdsStamp: true } },
    { actor: "balao", at: go.from, set: { holdsStamp: false } },
    { actor: "visor", at: 676, set: { points: true } },
  ];
  const acts = [
    { actor: "chaves" as const, from: 40, to: 84 },
    { actor: "visor" as const, from: 90, to: 90 },
    { actor: "visor" as const, from: 202, to: 202 },
    { actor: "balao" as const, from: 210, to: 266 },
    { actor: "balao" as const, from: 606, to: go.from },
    { actor: "visor" as const, from: 676, to: 676 },
  ];
  const faces: { actor: CastActor; at: number; expression: CastExpression }[] = [
    { actor: "visor", at: 202, expression: "waiting" },
    { actor: "balao", at: go.from, expression: "done" },
    { actor: "visor", at: 736, expression: "done" },
  ];
  const emotes = [{ actor: "visor" as const, kind: "worked" as const, at: 736, leaveAt: null }];

  const rows: RowChange[] = [
    ...rowsAt.map((at, j): RowChange => ({ file: "proposal", row: j + 1, at, to: "question" })),
    ...answersAt.map((at, k): RowChange => ({ file: "proposal", row: k + 1, at, to: "answered" })),
    ...FINDINGS_1.map((f, i): RowChange => ({ ...f, at: findings1[i], to: "flagged" })),
    ...FINDINGS_1.map((f, i): RowChange => ({ ...f, at: fixes1[i], to: "checked" })),
    ...FINDINGS_2.map((f, i): RowChange => ({ ...f, at: findings2[i], to: "flagged" })),
    ...FINDINGS_2.map((f, i): RowChange => ({ ...f, at: fixes2[i], to: "checked" })),
  ].sort((a, b) => a.at - b.at);

  const trips = [...files, go];
  const pops = { laptop: 2, balao: 4, chaves: 6, visor: 8, folder: 52, noGo1: 364, noGo2: 514 };
  const fades = { goGuide: { in: span(go.from), out: span(go.to) } };
  const leaves = { folder: 140, noGo1: 410, noGo2: 560 };
  const cues = {
    commandLine: [46],
    rows: rowsAt,
    answers: answersAt,
    findings1,
    fixes1,
    findings2,
    fixes2,
    joltEnds: [...findings1, ...findings2].map((at) => at + JOLT_FRAMES),
    codeLines,
    actions: actions.map((a) => a.at),
  };

  // Every change frame, assigned to the phase it falls in (design §4.1).
  const changes = [
    ...Object.entries(pops).map(([id, at]) => ev(`pop-${id}`, at)),
    ...Object.entries(fades).flatMap(([id, f]) => [ev(`${id}-in`, f.in[0]), ev(`${id}-in-end`, f.in[1]), ev(`${id}-out`, f.out[0]), ev(`${id}-out-end`, f.out[1])]),
    ...Object.entries(leaves).flatMap(([id, at]) => [ev(`leave-${id}`, at), ev(`leave-${id}-end`, at + 10)]),
    ...trips.flatMap((t) => [ev(`${t.id}-depart`, t.from), ev(`${t.id}-arrive`, t.to)]),
    ...Object.entries(cues).flatMap(([id, frames]) => frames.map((at, i) => ev(`${id}-${i}`, at))),
    ...faces.map((face) => ev(`face-${face.actor}-${face.expression}`, face.at)),
    ...emotes.map((e) => ev(`emote-${e.kind}`, e.at)),
    ...acts.flatMap((act) => [ev(`act-${act.actor}`, act.from), ev(`act-${act.actor}-end`, act.to)]),
  ];
  const phase = (id: string, from: number, to: number, cites: number[], devices?: SequenceDevice[]) => ({
    id, from, to, cites, ...(devices ? { devices } : {}),
    events: changes.filter((e) => e.at >= from && e.at <= to).sort((a, b) => a.at - b.at || a.id.localeCompare(b.id)),
  });

  return {
    duration: 870,
    outro: 770,
    ringsFade: [0, 20],
    phases: [
      phase("setup", 0, 39, [20, 26]),
      phase("init", 40, 89, [44, 47, 50]),
      phase("propose", 90, 149, [86, 89, 98, 99, 100, 101]),
      phase("list", 150, 209, [103, 106, 108, 109, 110, 111, 112, 113, 116]),
      phase("answer", 210, 279, [118, 120]),
      phase("review-1", 280, 409, [124, 126, 128, 129, 130, 131], ["findingMark", "noGoStamp"]),
      phase("fix-1", 410, 459, [133, 146], ["findingMark"]),
      phase("review-2", 460, 559, [133], ["findingMark", "noGoStamp"]),
      phase("fix-2", 560, 599, [135, 146], ["findingMark"]),
      phase("approve", 600, 669, [34, 124, 148], ["goStamp"]),
      phase("apply", 670, 769, [152, 154, 157, 158, 159, 160, 161, 162]),
    ],
    acts,
    faces,
    emotes,
    trips,
    pops,
    fades,
    leaves,
    cues,
    actions,
    rows,
  };
};

export const timeline: FilesTimeline = makeTimeline();

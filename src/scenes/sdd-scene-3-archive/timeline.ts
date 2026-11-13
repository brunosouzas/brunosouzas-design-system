// The SDD archive scene's choreography (change sdd-scene-3-archive, design
// §4): the beat table as data, evaluated by absolute frame, never simulated.
// No React, so the catalogue, the stills and render scripts and the tests
// import it. A `sequence` scene (sequence-kind.ts): its phases run once, in
// order; the one review round and the owner's single `GO` are consecutive
// moments of the second change (design §2.1, §2.3).
//
// `makeTimeline(travel, fade)` builds it from `motion.travel` and
// `motion.fade`, so a change of either token moves the arrivals and fade ends
// and fails the pinned beat-table test instead of silently retiming the
// scene; the scene uses `timeline`.
//
// Retiming is a visual change: it goes back into design §4 and the pinned
// test in the same commit (MOT-5).
import { tokens } from "../../../tokens/generated/tokens";
import type { CastExpression } from "../../pieces/index.ts";
import type { SequenceDevice, SequenceTimeline } from "../sequence-kind";
import { LEAVE_FRAMES } from "../takes-kind";
import { JOLT_FRAMES } from "./layout";

export type CastActor = "balao" | "chaves" | "visor";
/** The cast's action parameters (CAST-4): what an act may change. Chaves carries none in this scene (design §2.4). */
export type CastSet = { speaks?: boolean; holdsStamp?: boolean; points?: boolean };
export type CastAction = { actor: CastActor; at: number; set: CastSet };
/** An element that jolts once, for `JOLT_FRAMES` frames, from `at` (design §2.3, §2.6). */
export type Jolt = { id: "book" | "secondFolder"; at: number };

export type ArchiveTimeline = SequenceTimeline & {
  /** The cast's action changes (design §4.2). */
  actions: readonly CastAction[];
  jolts: readonly Jolt[];
};

const ev = (id: string, at: number) => ({ id, at });

export const makeTimeline = (travel: number = tokens.motion.travel, fade: number = tokens.motion.fade): ArchiveTimeline => {
  const T = travel, F = fade;
  const span = (from: number): [number, number] => [from, from + F];
  const trip = (id: string, from: number) => ({ id, route: id, from, to: from + T });

  // ---------------------------------------------------------------- setup and the first archive (0-119)
  const archive1 = trip("archive-1", 44);
  const fieldPillAt = 100;

  // ---------------------------------------------------------------- request and propose (120-259)
  const requestAt = 124;
  const proposeAt = 184;
  const secondFolderAt = 190;
  const breakJoltAt = 210;

  // ---------------------------------------------------------------- the single review round (260-339)
  const findingAt = 268;
  const fixAt = 304;

  // ---------------------------------------------------------------- approval, apply and the second archive (340-499)
  const approveAt = 344;
  const go = trip("go", 360);
  const applyAt = 404;
  const goLeavesAt = 420;
  const archive2 = trip("archive-2", 430);
  const fieldFlipAt = 452;
  const endingAt = 474;

  const actions: CastAction[] = [
    { actor: "balao", at: requestAt, set: { speaks: true } },
    { actor: "balao", at: requestAt + 40, set: { speaks: false } },
    { actor: "visor", at: proposeAt, set: { points: true } },
    { actor: "visor", at: proposeAt + 62, set: { points: false } },
    { actor: "balao", at: approveAt, set: { holdsStamp: true } },
    { actor: "balao", at: go.from, set: { holdsStamp: false } },
  ];
  const acts = [
    { actor: "balao" as const, from: requestAt, to: requestAt + 40 },
    { actor: "visor" as const, from: proposeAt, to: proposeAt + 62 },
    { actor: "balao" as const, from: approveAt, to: go.from },
  ];
  const faces: { actor: CastActor; at: number; expression: CastExpression }[] = [
    { actor: "balao", at: go.from, expression: "done" },
    { actor: "visor", at: applyAt, expression: "done" },
    { actor: "chaves", at: endingAt, expression: "done" },
  ];
  const emotes = [{ actor: "visor" as const, kind: "worked" as const, at: applyAt, leaveAt: null }];
  const jolts: Jolt[] = [{ id: "book", at: breakJoltAt }, { id: "secondFolder", at: findingAt }];

  const trips = [archive1, go, archive2];
  const pops = { balao: 4, chaves: 6, visor: 8, book: 10, firstFolder: 12, fieldPill: fieldPillAt, secondFolder: secondFolderAt, findingMark: findingAt };
  const fades = { goGuide: { in: span(go.from), out: span(go.to) } };
  const leaves = { findingMark: fixAt, go: goLeavesAt };
  const cues = {
    request: [requestAt],
    propose: [proposeAt, secondFolderAt],
    breakJolt: [breakJoltAt],
    finding: [findingAt],
    fix: [fixAt],
    approve: [approveAt],
    apply: [applyAt],
    goLeaves: [goLeavesAt],
    archive2: [archive2.from],
    fieldFlip: [fieldFlipAt],
    ending: [endingAt],
    actions: actions.map((a) => a.at),
  };

  // Every change frame, assigned to the phase it falls in (design §4.1).
  const changes = [
    ...Object.entries(pops).map(([id, at]) => ev(`pop-${id}`, at)),
    ...Object.entries(fades).flatMap(([id, f]) => [ev(`${id}-in`, f.in[0]), ev(`${id}-in-end`, f.in[1]), ev(`${id}-out`, f.out[0]), ev(`${id}-out-end`, f.out[1])]),
    ...Object.entries(leaves).flatMap(([id, at]) => [ev(`leave-${id}`, at), ev(`leave-${id}-end`, at + LEAVE_FRAMES)]),
    ...trips.flatMap((t) => [ev(`${t.id}-depart`, t.from), ev(`${t.id}-arrive`, t.to)]),
    ...jolts.flatMap((j) => [ev(`jolt-${j.id}`, j.at), ev(`jolt-${j.id}-end`, j.at + JOLT_FRAMES)]),
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
    duration: 600,
    outro: 500,
    ringsFade: [0, 20],
    phases: [
      phase("setup", 0, 39, [193, 199]),
      phase("archive-1", 40, 119, [193, 195, 196, 197, 199]),
      phase("request", 120, 179, [201, 203, 205]),
      phase("propose", 180, 259, [207, 209, 211, 221, 223, 226, 227, 228, 232]),
      phase("review", 260, 339, [236], ["findingMark"]),
      phase("approve", 340, 399, [124, 148, 236], ["goStamp"]),
      phase("apply", 400, 419, [152, 236]),
      phase("archive-2", 420, 469, [193, 195, 196, 197, 236]),
      phase("ending", 470, 499, [242, 264]),
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
    jolts,
  };
};

export const timeline: ArchiveTimeline = makeTimeline();

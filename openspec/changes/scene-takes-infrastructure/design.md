# Design: scene-takes-infrastructure

See `proposal.md` for the why. Most of this design was decided and reviewed in draft PR #41's change `sdd-without-with-spec-scene`. That change's design §2.1 (neutral registration), §2.2 (the `takes` kind), §2.4 (the dashed motion path) and §5 (data and validation) are summarised in §1 below. This file adds the decisions of the extraction (§2 to §4).

Observed sources:

- #41's branch `feature/ab144-sdd-without-with-spec-scene` at `852bcd0`: commits `a2c00c1` (neutral scenes and the takes kind), `b5fa204` (MotionPath), `33178e3` (docs), and the parts of the review fixes `ae5940e` and `d6cf610` that touch `takes-kind.ts`, `catalogue-takes.test.ts`, the README and ADR 0004.
- `main` at `655525d` (0.12.0).
- AB#334's draft change `circuit-breaker-topology-scene` (PR #44). It reuses `TakesTimeline`, the `TakesDevice` union, `MotionPath` and `motionPathAt` as #41 defines them.

## 1. What is carried over unchanged (from #41)

- **Neutral registration** (#41 §2.1, option C):
  - A neutral scene sets `neutral: true` and `languages: ["en"]`, has only `text.en`, and keeps both `sources.pt` and `sources.en`.
  - `compositionsOf` gives one entry per format, id `<scene>-<format>`, `lang: "en"`; the scene ignores `lang`.
  - `checkText` checks the neutral rules. Localised scenes keep their code path unchanged.
- **The `takes` kind** (#41 §2.2, §5):
  - `src/scenes/takes-kind.ts` holds `TakesTimeline`, `TakesPhase`, `Actor`, `Take`, `TakesDevice`, `LEAVE_FRAMES` and `checkTakes`.
  - `catalogue.ts` adds `TakesSceneData` to `CatalogueScene`, and `checkTimeline` dispatches `kind: "takes"` to `checkTakes` after the common phase rules, as it does for `flow`. The state-machine branch is untouched.
  - The review fixes of #41 are included: an emote on a face entry that repeats the current expression is not a change, the "takes end early" message, and the `LEAVE_FRAMES` comment.
- **`MotionPath`** (#41 §2.4):
  - `motionPathAt(frame, fadeIn, fadeOut?)` and `motionPathDrawing(d, opacity)` live in `src/brand/motion.ts`.
  - The `MotionPath` component in `src/brand/components.tsx` reads no frame.

## 2. The test fixture: a test-only scene, not a registered one

#41 proved every catalogue rule on fixtures derived from its own registered scene. Without that scene, the rules need another valid neutral `takes` scene.

| Option | Result |
|---|---|
| A. Register a small demo scene in `src/scenes/` | It would be a catalogue scene with no published article, which breaks ADR 0004. It would show up in Studio and in the stills and render commands. It would change every assertion that lists the registered scenes, and #41 and #44 would then have to remove it again |
| **B. A test-only fixture scene, `test/fixtures/takes-scene.ts` (chosen)** | No requirement asks for a registered scene: every rule here is a property of the checks, and the checks take any scene. The catalogue keeps its two scenes, so their tests, compositions and stills do not change. The fixture uses synthetic data (TEST-3) |

The fixture is a `TakesSceneData` with id `takes-fixture`, kind `takes`, `neutral: true`, format `16x9` and language `en`. It has a synthetic word table `text.en = { label: "spec.md", takes: ["1", "2"] }` and sources `https://example.com/pt/article` and `https://example.com/en/article`. Its timeline keeps the frame numbers of #41's scenarios, so the scenarios carry over with only their names changed:

| Field | Value |
|---|---|
| `duration`, `outro`, `ringsFade` | 780, 690, [0, 20] |
| phases | `t1-open` 24–89, `t1-act` 90–239, `t1-result` 240–339 (take 1); `rewind` 340–377; `t2-open` 390–509, `t2-act` 510–599, `t2-result` 600–689 (take 2); each cites one or two positive lines and has its events inside it |
| `rewind` | from 344 to 377, objects [339, 89] |
| `acts` | visor 90–90, 344–344, 390–480, 600–600 |
| `faces` | visor 270 `failed`, 344 `idle`, 504 `waiting`, 600 `idle`, 660 `done` |
| `emotes` | `problem` at 270, leaving at 320; `worked` at 660, never leaving |
| `trips` | `token-0` 100 → 122, `token-1` 512 → 534 |
| `pops` | `request` 24, `badge2` 378, `stamp` 584 |
| `fades` | `pathA` in [90, 100], out [220, 230]; `pathB` in [600, 610] |
| `leaves`, `cues` | `rewindMark` 400; `lines` [616, 651], `rows` [426, 476] |

## 3. Cherry-pick or port

`a2c00c1` and `b5fa204` touch only infrastructure files, but `a2c00c1`'s tests import the SDD scene, and the review fixes `ae5940e` and `d6cf610` mix the scene with the infrastructure. So:

- `b5fa204` (MotionPath) is cherry-picked; only its comments change, so they name this change.
- The code of `a2c00c1` is cherry-picked. Its two test files are rewritten against the fixture, and the `takes-kind.ts` hunks of `ae5940e` and `d6cf610` are applied on top. The result equals #41's `takes-kind.ts`, except the header comments.
- The docs are ported by hand from `33178e3`, `ae5940e` and `d6cf610`, without the SDD scene's sentences.

The stills and render commands (`scripts/stills.ts`, `scripts/render.ts`) already read compositions through `compositionsOf` and stills frames from the phases. #41 registered its neutral scene with no script change, so none is needed here.

## 4. Interfaces kept as #41 has them

#41 (to be rebased on this) and AB#334 (#44, written against #41) both build on these names, so they stay exactly as #41 has them:

- `TakesTimeline` and its fields (`rewind`, `acts`, `faces`, `emotes`, `trips`, `pops`, `fades`, `leaves`, `cues`);
- `TakesSceneData`, `isNeutral`, `checkTakes` and `LEAVE_FRAMES`;
- `MotionPath`, `motionPathAt` and `motionPathDrawing`.

The `TakesDevice` union also stays verbatim, `goStamp` included. `goStamp` names the SDD scene's device, but #44 says it does not extend the union, and changing the type now would make #41's rebase edit this file again. Widening or renaming it is left to the scene that needs it.

## Risks / trade-offs

- [The fixture drifts from what a real scene does] → it is a valid `takes` scene by the same checks, and #41's and #44's own scenes run the same checks once they are registered.
- [#44's MODIFIED "State-machine and flow catalogue compatibility" was written against #41's text ("three scenes")] → this change words it as "every registered scene in registration order", which is what #44 wanted. #44's task 0.2 already compares its block with the merged text at its rebase.
- [Existing scenes change by accident] → their tests stay unchanged, and their stills are compared by SHA-256 before and after (task 5.2).

## Migration

None for consumers: the package builds only `src/pieces`, `src/fonts`, the tokens and the cover command (`tsconfig.build.json`). The scene catalogue, `MotionPath` and `motionPathAt` are not shipped. To roll back, revert the merge; nothing persisted depends on it.

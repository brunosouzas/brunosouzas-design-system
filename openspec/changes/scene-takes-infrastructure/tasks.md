# Tasks: scene-takes-infrastructure

Test levels: **unit** (vitest, pure functions and source reads, no React rendering and no network) and **local** (a real Remotion still; not in CI, because rendering needs the network). Existing tests stay green unless a task names the edit. Every scenario of the two spec deltas is named below with the test that proves it.

## 1. The test fixture

- [ ] 1.1 `test/fixtures/takes-scene.ts`: the fixture `takes-fixture` of design §2, typed `satisfies TakesSceneData`, with synthetic words and `https://example.com` sources (TEST-3). Check: `npm run typecheck`, and the fixture passes `checkCatalogue` in task 3.1 ("Valid neutral scene", "Valid takes").

## 2. Neutral registration (`scene-catalogue`)

- [ ] 2.1 `src/scenes/catalogue.ts`: `neutral`, `isNeutral` and `compositionsOf` giving `<scene>-<format>` for a neutral scene (`lang: "en"`); `checkText` with the neutral rules (no `pt` table, languages `["en"]` only, both `https://` sources, no empty word). This is the cherry-pick of `a2c00c1`'s `catalogue.ts`.
  - Unit tests in a new `test/scenes/catalogue-neutral.test.ts`, on the fixture: "Neutral composition", "Duplicate neutral composition id", "Valid neutral scene", "Neutral scene with a Portuguese table", "Neutral scene in two languages", "Neutral scene missing a source", "Neutral scene with an empty word".
  - "Circuit-breaker compositions", "Duplicate composition id", "Key missing in one language", "Lists of different lengths", "Empty list" and "Empty string or missing source" (`test/scenes/catalogue.test.ts`) stay green unchanged.
  - Check: `npm test -- test/scenes/catalogue-neutral.test.ts test/scenes/catalogue.test.ts`.

## 3. The `takes` kind (`scene-catalogue`)

- [ ] 3.1 `src/scenes/takes-kind.ts` (`TakesTimeline`, `checkTakes` with the order, cites, neutral-only, cast and hold rules; #41's review fixes included) and the `takes` branch of `checkTimeline`. Unit tests in a new `test/scenes/catalogue-takes.test.ts`, on the fixture:
  - "Valid takes", "Takes out of order", "Phase without an article line", "Localised takes scene";
  - "Takes scene needs no slots or fires", "Takes outro inside the reading hold";
  - `takes` fixture cases for "Phase beyond the composition", "Overlapping phases", "Event outside its phase" and "Movement inside the reading hold".

  The state-machine and flow cases in `test/scenes/catalogue.test.ts` and `test/scenes/catalogue-flow.test.ts` stay unchanged, as do "Fire outside its window", "Outro inside the reading hold" and "Flow trip crosses the outro". Check: `npm test -- test/scenes`.
- [ ] 3.2 Cast timing, unit tests in `test/scenes/catalogue-takes.test.ts`: "The fixture's own cues pass", "Two actors at once", "Emote off an expression change" (271, and a repeated expression), "Two emotes on screen", and "Emote still visible at the next action" (a leave at 336 fails, 334 passes). Check: `npm test -- test/scenes/catalogue-takes.test.ts`.
- [ ] 3.3 Reading hold, unit tests in `test/scenes/catalogue-takes.test.ts`: "The fixture's own hold passes", "Cue at or after the outro" (all nine items), and "Pop-in too late to settle" (661 fails, 660 passes). Check: `npm test -- test/scenes/catalogue-takes.test.ts`.
- [ ] 3.4 Compatibility, in `test/scenes/catalogue-flow.test.ts`:
  - a new test "Takes fixture beside the registered scenes": nine unique compositions, the registered eight unchanged and in order, `takes-fixture-16x9` last, and `scenes` still lists exactly `circuit-breaker-states` and `publish-subscribe`;
  - "Both kinds in the catalogue" and "Shared checks still reject a broken flow" stay unchanged.

  Check: `npm test -- test/scenes/catalogue-flow.test.ts`; `git diff origin/main -- test/` changes no existing line, except additions to `catalogue-flow.test.ts`.

## 4. The dashed motion path (`motion-components`)

- [ ] 4.1 `motionPathAt` and `motionPathDrawing` in `src/brand/motion.ts`, and `MotionPath` (`d`, `opacity`, `width`, `height`; no `useCurrentFrame`) in `src/brand/components.tsx`: the cherry-pick of `b5fa204`. Unit tests in a new `test/brand/motion-path.test.ts`: "Fade in and out", "No fade-out", "Drawn from the tokens" and "Bad ranges". "Real sources are clean" (`test/brand/no-colour-literals.test.ts`) stays green. Check: `npm test -- test/brand`.

## 5. Guards, the whole suite and the existing stills

- [ ] 5.1 TEST-4, one at a time in a scratch copy of the worktree: make each guard always pass, run its test, see it fail, and discard the copy. The guards are:
  - the neutral `pt` table, language and source rules;
  - the takes order, cites and neutral-only rules;
  - the act overlap, the emote on a face change (and the repeated expression), two emotes at once, and the emote before the next act;
  - the hold's cue-before-outro and pop-in-settle rules;
  - `motionPathAt`'s range checks.

  Record each guard and its failing test in the pull request.
- [ ] 5.2 Local: render the stills of `circuit-breaker-states` and `publish-subscribe` at `origin/main` (`655525d`) before any change, and again at the head. Every still's SHA-256 is equal (`shasum -a 256`).
- [ ] 5.3 `npm run typecheck && npm run tokens:check && npm run build && npm test` (what CI runs) green; `openspec validate scene-takes-infrastructure --strict` and `openspec validate --all --strict` pass.

## 6. Documentation

- [ ] 6.1 ADR 0004: an amendment dated 2026-11-12 (AB#144) for a neutral scene's one `en` table, plus its index row in `docs/adr/README.md`. Update the matching sentences of `AGENTS.md` and of the `openspec/config.yaml` context. Check: `openspec validate --all --strict` and the suite of 5.3.
- [ ] 6.2 `README.md` "How a scene is built": neutral registration, the `takes` kind and its checks, `MotionPath` and `motionPathAt`, and the flow diagram's line. Check: the suite of 5.3 (the package and README tests read these files).

## Workflow follow-up

- Two independent code reviews per round (at most two rounds), `openspec archive scene-takes-infrastructure -y`, `openspec validate --all --strict`. The pull request stays a draft for Bruno and ends with `Part of AB#144`.
- After the merge: rebase #41 on `main`, without its infrastructure commits. #44 then uses these interfaces from `main`.

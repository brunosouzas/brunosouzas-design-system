# Proposal: scene-takes-infrastructure (part of AB#144)

## Why

Draft PR #41 (AB#144, change `sdd-without-with-spec-scene`) built two things together: the first SDD scene and the catalogue infrastructure that scene needed. The infrastructure is neutral scenes (one composition for both pages), the `takes` scene kind and its validation, and the dashed `MotionPath`. The scene is waiting for new supporting characters (AB#337) and will be redone. Other scenes need the infrastructure now: AB#334, the circuit-breaker topology scene, is also a neutral `takes` scene that draws a `MotionPath`.

On 2026-11-12 the owner decided (q71 A) to move the infrastructure out of #41 into its own pull request from `main`, without the SDD scene. This change carries the requirements and scenarios #41's change wrote for that infrastructure, adapted so that none refers to a scene. It adds a few scenario cases for checks #41's code already runs but its spec did not state (design §1).

## What Changes

- **Neutral scenes in the catalogue.** A scene can be registered as `neutral`: one composition per format, id `<scene>-<format>` with no language suffix, `languages` `["en"]`, its few on-screen words in one English table `text.en`, and both pages' sources (`sources.pt`, `sources.en`), because its one video serves both pages (ADR 0005 as amended 2026-11-09, SCN-1). The catalogue rejects any other combination. Localised scenes keep their four compositions and their rules.
- **The `takes` scene kind** (`src/scenes/takes-kind.ts`). A comparison of two runs of one stage: take-1 phases, one rewind phase, take-2 phases. It is always neutral. On top of the common timeline rules, the catalogue checks:
  - the take order, and an article line cited by every phase (MOT-1);
  - one actor at a time (CAST-4);
  - every emote entering on its actor's expression change, one emote at a time, and gone before the next act (CAST-3);
  - nothing moving from the outro on, and every pop-in early enough to settle by it (SCN-4).
- **`MotionPath` and `motionPathAt`** (`src/brand/`). A dashed motion path drawn from the `scene.path*` tokens (0.12.0) at an opacity the scene gives. A pure helper computes that opacity from a frame, a fade-in range and an optional fade-out range.
- **Documentation:** a dated amendment of ADR 0004 for the neutral scene's English table, the matching sentences of `AGENTS.md` and the `openspec/config.yaml` context, and the README's "How a scene is built".
- **No scene is added.** The catalogue still registers `circuit-breaker-states` and `publish-subscribe`, and both keep their data, compositions, tests and stills byte for byte. The `takes` and neutral rules are proved on a test-only fixture scene (design §2).
- **Release.** The pull request title is `feat:` (the owner's), so release-please proposes a minor release that lists these features, although nothing in them is shipped in the npm package (design, Migration). Whether that release is wanted is a question for the owner in the pull request.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `scene-catalogue`: neutral registration (one composition per format), the neutral text and source rules, the `takes` kind and its validation, and the compatibility of the existing kinds with it.
- `motion-components`: the dashed motion path.

## Out of scope

- The SDD scene `sdd-without-with-spec` and everything that belongs to it: its data, timeline, layout, stage, composition, stills, render, its words (`proposal.md`, `GO`, the take numbers) and the reading devices the owner approved for it. These stay in #41, which is rebased on `main` after this merges and redone with the AB#337 characters.
- Registering any new scene in `src/scenes/index.ts` or `src/Root.tsx`.
- Converting the existing scenes to neutral, or changing their data, compositions or tests.
- Changes to the stills and render commands. They already read the compositions through `compositionsOf`, so a neutral scene's one composition reaches them unchanged (design §3); the first registered neutral scene proves its own stills.
- Whether a `takes` scene may show take numbers or other device words (ADR 0004; AB#334's G1 question 2).
- A new token, piece or character.

## Implicit requirements

- **Errors and invalid input:** requirement. The catalogue rejects these, each problem naming the scene and the offending item:
  - a neutral scene with a `pt` table, a language other than `en`, a missing or non-`https` source, or an empty word;
  - a `takes` scene that is not neutral, has its takes out of order, has a phase without a valid article line, has two actors acting at once, has an emote off an expression change, two emotes at once or an emote still visible at the next act, or has a cue at or after the outro or a pop-in too late to settle.

  `motionPathAt` throws a `RangeError` naming `frame`, `fadeIn` or `fadeOut`.
- **Limits:** requirement. The reading hold is `motion.readingHold` (90 frames). A pop-in settles in `motion.fps` (30) frames. An emote or element leaves over 10 frames.
- **Repetition and idempotency:** n/a. The checks and `motionPathAt` are pure functions of their input.
- **Concurrency:** n/a. No shared state; the checks run once per catalogue load.
- **Security:** n/a. No input from outside the repository, no new dependency, no network.
- **Logs and observability:** n/a. Problems are returned as lines that the catalogue test prints, as the other kinds do.

## Documentation

- `README.md`, "How a scene is built": neutral registration, the `takes` kind and its checks, `MotionPath` and `motionPathAt`, and the flow diagram's "MP4 per format (and language, for a localised scene)".
- `docs/adr/0004-scenes-illustrate-published-articles.md`: a dated amendment (2026-11-12, AB#144). Since ADR 0005's amendment of 2026-11-09, a neutral scene may show a few English words, and it keeps them in one `en` table with both pages as sources. This records a decision ADR 0005 already took, so it is no new ADR. The index row in `docs/adr/README.md` follows.
- `docs/roadmap.md`: a row 13f for this change, after `sdd-scene-pieces` (13e).
- `AGENTS.md` and the `openspec/config.yaml` context: the sentences that say a catalogue scene keeps its strings per language gain the neutral case.
- After the merge, outside this repository: the brain vault's project notes (`architecture.md`, `changelog.md`). The motion skill's SCN-1 check text ("until AB#144 the catalogue still registers a composition per language") becomes true once a neutral scene is registered; it changes in the kit with that scene.

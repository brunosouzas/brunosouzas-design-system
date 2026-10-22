# Proposal: tokens-and-motion-foundation

## Why

The repository holds the plan and four ADRs but no code. The approved motion pilot (`docs/spikes/2026-10-22-motion-pilot/`) lives in a throwaway folder with its tokens hard-coded in TypeScript, so nothing else can consume them and the pilot cannot be re-rendered from the repository. This change ports the pilot into the repository as its first working version: one token source (ADR 0002), the motion components (ADR 0001, ADR 0003) and the circuit-breaker scene (ADR 0004).

## What Changes

- A token source file and a build command that generates CSS custom properties, a TypeScript module and a JSON file from it, with a check mode that fails when the generated files are stale.
- The motion components from the pilot (ink block, pill, self-drawing arrow, travelling token, call-result square, countdown ring, rings background), reading every colour, size and timing from the generated TypeScript tokens.
- A scene catalogue with one scene, the circuit-breaker state machine, registered as four compositions (16:9 and 4:5, Portuguese and English) with the pilot's story, timing and captions.
- Commands to render a scene's key-frame stills for review and its videos (a hardware-encoded master and an x264 web copy), using the ffmpeg bundled with Remotion.
- A GitHub Actions workflow that type-checks, runs the unit tests and checks that the generated token files are fresh.
- README, `AGENTS.md` and roadmap updated to describe the implemented commands.

## Capabilities

### New Capabilities

- `design-tokens`: the token source, its validation, and the generated CSS, TypeScript and JSON exports with a freshness check.
- `motion-components`: the reusable animation components and the rule that they take their values only from the tokens.
- `scene-catalogue`: how scenes are registered (composition ids, formats, languages, text tables, timelines) and the circuit-breaker state-machine scene.
- `scene-rendering`: the stills and render commands, their outputs and their failure behaviour.

### Modified Capabilities

None (the repository has no specs yet).

## Out of scope

- Changing any token value: the values are the pilot's, taken from the designer skill's palette. Choosing a site accent is roadmap item 3.
- Consuming the tokens in the site (`brunosouzas.com`) or in the designer skill's SVG generators (roadmap items 3 and 4).
- Publishing an npm package, deploying the Remotion Studio, and any other scene (roadmap items 2 and 5).
- Audio, music and dark-mode variants of scenes.
- Rendering videos in CI: rendering downloads a headless browser and takes minutes per clip; renders are run locally and reviewed by the owner.
- Automated checking that a scene's strings match the source article: the article lives outside this repository; the owner checks it at review (ADR 0004).

## Implicit requirements

- **Errors and invalid input:** requirement. The token build rejects an invalid source (missing required token, malformed colour, non-positive frame count, unknown group) without writing any file. The render and stills commands reject an unknown scene and report a failed composition by name.
- **Limits:** requirement for what the scene must hold: the outro (every block at full opacity) starts at least the reading-hold token (90 frames, 3 s) before the end, and nothing new starts after it; springs started just before it settle in its first frames. No limit on the number of tokens or scenes is specified: n/a, the counts are small and owner-authored.
- **Repetition and idempotency:** requirement. The token build is deterministic: the same source gives byte-identical outputs, and running it twice changes nothing. Rendering again overwrites the previous outputs of the same composition.
- **Concurrency:** n/a. The commands are run by one person on one machine; two renders of the same scene at once are not supported and not guarded.
- **Security:** requirement. The commands write only inside the repository's output folders (`tokens/generated/` for the build, `out/` for renders) and make no network call of their own. Two network uses come from libraries: Remotion's first run downloads its headless browser, and every render fetches Lato from Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) through `@remotion/google-fonts`. No secrets are involved.
- **Logs and observability:** requirement. Each command prints one line per output written (or per composition rendered, with its elapsed seconds and file size) and a final error line naming the cause when it fails.

## Open questions

None. The decisions taken in the design (generated files committed, the CSS prefix, no Style Dictionary) are listed for Bruno at gate 1.

## Impact

- New: `tokens/`, `src/brand/`, `src/scenes/circuit-breaker-states/`, `scripts/`, `test/`, `package.json`, `tsconfig.json`, `.github/workflows/ci.yml`.
- Dependencies: `remotion`, `@remotion/cli`, `@remotion/paths`, `@remotion/google-fonts`, `react`, `react-dom` (runtime); `typescript`, `@types/react`, `@types/node`, `vitest`, `tsx` (development).
- Licence: rendering with Remotion follows Remotion's licence (README already says so).

## Documentation

- `README.md`: status, commands (build tokens, check, stills, render, studio), how a scene is structured.
- `AGENTS.md`: Build, Test and Run lines; the "nothing implemented" sentence replaced.
- `docs/roadmap.md`: row 1 delivered.
- Brain vault (after the pull request is ready, on the vault's `main`): the project's `architecture.md`, `roadmap.md`, `changelog.md` and `repos/brunosouzas-design-system.md`.

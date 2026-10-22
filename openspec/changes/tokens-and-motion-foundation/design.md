# Design: tokens-and-motion-foundation

## Context

Observed:

- The pilot (`~/.hermes/spikes/motion/pilot`, evidence in `docs/spikes/2026-10-22-motion-pilot/`) runs on Remotion 4.0.538, React 19, TypeScript, with `tokens.ts`, `components.tsx`, a scene in four files and a `render.sh` that calls `npx remotion render` and an external ffmpeg.
- `npx remotion ffmpeg` exposes the ffmpeg bundled with Remotion (n7.1 on the author's Mac), which includes `libx264` and `h264_videotoolbox`, so the web copy needs no external ffmpeg.
- The site's theme already defines `--color-primary`, `--color-text` and similar names (`brunosouzas.com/src/styles/generated-theme.css`).
- The SVG generators of the designer skill are Python scripts; they cannot import TypeScript.

Assumed: consumers outside this repository (the site, the Python scripts) will read the generated files straight from the repository (a raw URL, a copy or a Git submodule) rather than install an npm package, until a package is needed.

## Goals / Non-Goals

**Goals:** port the approved pilot without changing its look or timing; make the tokens the single source; make the logic that decides what is visible at a frame testable without rendering video.

**Non-Goals:** new scenes, new token values, publishing a package, rendering in CI.

## Decisions

### 1. Token file: a small JSON shape with `$value` and `$type`

Each token is `{ "$value": ..., "$type": ... }`, grouped by nesting, close to the W3C Design Tokens format (the `$value`/`$type` keys) without its aliases and composite types, which no consumer needs yet. The custom types `frames` and `opacity` exist because motion timing and dimming are tokens here.

Rejected: plain key–value JSON (no type, so a `frames` value of `0.5` could not be rejected); the full W3C format (aliases and composites add parsing for nothing used).

### 2. Build with a small TypeScript script, not Style Dictionary

`scripts/tokens.ts`, run with `tsx`: read, validate, sort keys, emit three strings, then write (or compare, in check mode). Validation happens before any write, so an invalid source writes nothing.

Rejected: Style Dictionary. It is the common tool, but for about forty tokens and three outputs it adds a dependency and a configuration, and the custom types would still need custom transforms. Revisit when a fourth output or theming (dark mode) arrives.

### 3. Generated files are committed, and CI checks they are fresh

`tokens/generated/` is in Git. The site and the Python scripts can read the files without running Node. CI runs `npm run tokens:check`, so a source edit without a rebuild fails the pull request.

Rejected: generating on install and ignoring the files (every consumer would need Node and this repository's build).

### 4. CSS prefix `--ds-`

`--ds-color-ink`, `--ds-motion-pop-damping`. A prefix avoids clashing with the site's existing `--color-*` names when the site imports the file next to its theme.

Rejected: no prefix (clashes with `--color-primary` and friends); `--brunosouzas-` (long in every rule).

### 5. Frame logic as pure functions

`src/brand/motion.ts` holds the decisions that the components draw: arrow progress and head visibility, token position along a path, focus and opacity of a state at a frame, countdown fraction, the fill and glyph of each call kind. Components stay thin wrappers. Unit tests prove the motion scenarios on these functions with vitest, without a browser.

Rejected: testing rendered components (needs a Remotion player context and screenshots; slow and brittle for numeric checks).

### 6. Scene data apart from React

Each scene folder has `scene.ts` (id, formats, duration, timeline, text table, sources; no React), `layout.ts` and `Scene.tsx`. `src/scenes/index.ts` lists scene data; `src/Root.tsx` registers compositions from it. The CLI scripts import only scene data, so they run under `tsx` without React or the bundler.

### 7. Render and stills through the Remotion CLI

`scripts/render.ts` and `scripts/stills.ts` build the command list from the scene data, print it in `--dry-run`, or run it in order with a child process, stopping at the first failure. Render: `npx remotion render src/index.ts <id> out/master/<id>.mp4 --codec=h264 --hardware-acceleration=if-possible --overwrite`; encode: `npx remotion ffmpeg -y -i <master> -c:v libx264 -crf 30 -preset slow -pix_fmt yuv420p -movflags +faststart -an out/web/<id>.mp4`; stills: `npx remotion still ... --frame=<n>`. The command runner is injectable, so tests prove ordering and stop-on-failure without rendering.

Rejected: the `@remotion/renderer` Node API (more code to keep, and the CLI is what the owner runs by hand when reviewing).

### 8. Layout

```text
tokens/source.json            tokens/generated/{tokens.css,tokens.ts,tokens.json}
scripts/{tokens,render,stills}.ts
src/index.ts  src/Root.tsx
src/brand/{fonts.ts,motion.ts,components.tsx}
src/scenes/index.ts  src/scenes/circuit-breaker-states/{scene.ts,layout.ts,Scene.tsx}
test/{tokens,brand,scenes,scripts}/*.test.ts
.github/workflows/ci.yml      (npm ci, tsc, tokens:check, vitest on Node 22)
```

## Risks / Trade-offs

- **Remotion licence:** free for the owner; a company of four or more people that renders with this code needs a licence. Stated in the README.
- **First render downloads a headless browser** (Remotion's behaviour); offline machines cannot render until it is cached.
- **Bundled ffmpeg varies with the Remotion version:** pinning Remotion in `package-lock.json` pins it; the dry-run test checks the command, not the encoder's presence.
- **Spring settle time** (the 30-frame bound in the focus scenario) depends on the `motion.focus` values; a token change that slows the spring will fail that test on purpose.

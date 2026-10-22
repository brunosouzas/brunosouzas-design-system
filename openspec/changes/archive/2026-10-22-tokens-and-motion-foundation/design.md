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

`src/brand/motion.ts` holds the decisions that the components draw: arrow progress and head visibility, token position along a path, focus and opacity of a state at a frame (intro, between phases and outro included), the caption shown at a frame, countdown fraction, the fill and glyph of each call kind. Components stay thin wrappers. Unit tests prove the motion scenarios on these functions with vitest, without a browser.

Rejected: testing rendered components (needs a Remotion player context and screenshots; slow and brittle for numeric checks).

### 6. Scene data apart from React

Each scene folder has `scene.ts` (id, formats, duration, timeline, text table, sources; no React), `layout.ts` and `Scene.tsx`. `src/scenes/index.ts` lists scene data; `src/Root.tsx` registers compositions from it. The CLI scripts import only scene data, so they run under `tsx` without React or the bundler.

Rejected: scene data inside `Scene.tsx`, as in the pilot (the scripts and the catalogue tests would have to load React and the font loader, which fetches from the network, just to read frame numbers).

### 7. Render and stills through the Remotion CLI

`scripts/cli.ts` parses the arguments (first problem only: unknown option, repeated `--dry-run`, extra name, missing name, unknown scene) and runs a command list; `scripts/render.ts` and `scripts/stills.ts` build the command list from the scene data, print it in `--dry-run`, or run it in order with a child process, stopping at the first failure. Render: `npx remotion render src/index.ts <id> out/master/<id>.mp4 --codec=h264 --hardware-acceleration=if-possible --overwrite`; encode: `npx remotion ffmpeg -y -i <master> -c:v libx264 -crf 30 -preset slow -pix_fmt yuv420p -movflags +faststart -an out/web/<id>.mp4`; stills: `npx remotion still ... --frame=<n>`. The command runner is injectable, so tests prove ordering and stop-on-failure without rendering.

Rejected: the `@remotion/renderer` Node API (more code to keep, and the CLI is what the owner runs by hand when reviewing).

### 8. The pilot's timeline, frame by frame

The approved pilot (`~/.hermes/spikes/motion/pilot/src/scenes/circuit-breaker/timeline.ts` and `StateMachine.tsx`) uses these values; the ported `scene.ts` must hold exactly them, and `test/scenes/circuit-breaker.test.ts` compares the two. Phase ranges are inclusive.

| Item | Frames |
|---|---|
| Duration | 1000 (30 fps, 33.33 s) |
| Intro end (first phase starts, dimming starts) | 40 |
| Outro (everything back to full opacity) | 910 |
| Start marker fade | 4 to 14 |
| Block pop-in (CLOSED, OPEN, HALF_OPEN) | 6, 14, 22 |
| Rings fade | 0 to 20 |
| Phase 1 CLOSED `[40, 200]` | events at 56, 73, 90, 107, 124, 141, 158, 175: ok, ok, fail, ok, fail, fail, fail, fail |
| Phase 2 OPEN `[245, 365]` | blocked at 262, 288, 314, 340 |
| Phase 3 HALF_OPEN `[410, 500]` | ok at 424, fail at 458 |
| Phase 4 OPEN `[545, 620]` | blocked at 560, 586 |
| Phase 5 HALF_OPEN `[665, 775]` | ok at 680, 710, 740 |
| Phase 6 CLOSED `[820, 990]` | ok at 834, 843, 852, 861, 870, 879, 888, 897 |
| Fires | CLOSED to OPEN 215; OPEN to HALF_OPEN 380 and 630; HALF_OPEN to OPEN 515; HALF_OPEN to CLOSED 790 |
| Arrow draw frame (first fire minus 18) | 197, 362, 497, 772 |
| Pill pop-in (draw frame plus 8) | 205, 370, 505, 780 |
| Slots | CLOSED 8, OPEN 4, HALF_OPEN 3 |

Component constants that stay in code, with the pilot's values (`components.tsx`): rings start at radius 100, step 34, stroke 2.5; the countdown's inner stroke 10; empty slot opacity 0.35; travelling token radius 17 with its shadow offset equal to `shadow.small`; block gap 18; the CSS keywords `transparent` and `none`. A change to any of them is a visual change and needs the owner's approval.

`font.sans` is `Lato, 'Helvetica Neue', Helvetica, Arial, sans-serif` (the designer skill's stack). In the animations, the Lato loaded through `@remotion/google-fonts` (weights 700 and 900) comes first, followed by this stack.

### 9. Layout

```text
tokens/source.json            tokens/generated/{tokens.css,tokens.ts,tokens.json}
scripts/{tokens,cli,render,stills}.ts
src/index.ts  src/Root.tsx
src/brand/{fonts.ts,motion.ts,components.tsx}
src/scenes/index.ts  src/scenes/circuit-breaker-states/{scene.ts,layout.ts,Scene.tsx}
test/{tokens,brand,scenes,scripts}/*.test.ts
.github/workflows/ci.yml      (npm ci, tsc, tokens:check, vitest on Node 22)
```

## Risks / Trade-offs

- **Remotion licence:** free for the owner; a company of four or more people that renders with this code needs a licence. Stated in the README.
- **Rendering needs the network:** the first render downloads a headless browser (Remotion's behaviour), and every render fetches Lato from Google Fonts through `@remotion/google-fonts`. Offline, a render waits on the font (the loader holds the frame with `delayRender` and retries) and then fails with a timeout; there is no fallback to the stack's next font. Self-hosting the font is a later option.
- **Bundled ffmpeg varies with the Remotion version:** pinning Remotion in `package-lock.json` pins it; the dry-run test checks the command, not the encoder's presence.
- **Spring settle time** (the 30-frame bound in the focus scenario) depends on the `motion.focus` values; a token change that slows the spring will fail that test on purpose.

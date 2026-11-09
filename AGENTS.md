# brunosouzas-design-system: project context

The public visual identity of the blog brunosouzas.com: one source of design tokens (exported to CSS, TypeScript and JSON), Remotion motion components, and a catalogue of animated scenes that illustrate the blog's published articles. Owner: Bruno Souza. Human documentation lives in the brain vault under `10-personal/projects/brunosouzas-design-system/`.

## Technology

Stack: TypeScript, Node.js, React, Remotion, vitest, GitHub Actions, OpenSpec, npm package
Delivery: B package (npm `@brunosouzas/design-system`)
Model: 2 release PR
Integration branch: `main`
Deliver and verify: a merge into `main` publishes nothing; release-please keeps the release pull request, Bruno merges it, and `release.yml` publishes after he approves the `npm` environment (`docs/release.md`); verify with `npm view @brunosouzas/design-system version`

Layout: `tokens/source.json` (the only place token values are written) generates `tokens/generated/` (committed; never edit by hand); `src/brand/` holds the motion components and their frame logic (`motion.ts`); `src/scenes/<scene>/` holds each scene (`scene.ts` data without React, `layout.ts`, `Scene.tsx`); `scripts/` holds the token build and the stills and render commands; `test/` the vitest suites. Node.js 22.12 or later.

- Build: `npm ci`, then `npm run tokens` after any change to `tokens/source.json` (`npm run tokens:check` fails on stale output)
- Test: `npm run typecheck && npm run tokens:check && npm run build && npm test` (what CI runs; no rendering, no network; the package test installs the packed build offline)
- Run locally: `npm run studio` (Remotion Studio), `npm run stills -- <scene>` (key-frame PNGs in `out/stills/`), `npm run render -- <scene>` (masters in `out/master/`, web copies in `out/web/`); both accept `--dry-run`. Rendering needs the network (headless browser on first use, Source Sans 3 and Source Code Pro from Google Fonts).

## Rules for this repository

- Integration branch: `main`.
- Releases to npm (`@brunosouzas/design-system`, org `brunosouzas`) only through `release.yml`: the merge of release-please's release pull request, which changes `version` in `package.json` (or a version tag pushed by the owner), then the owner-approved environment `npm`; see `docs/release.md`. Never set the version by hand in a change, and never publish from a local agent session.
- Pull request titles are Conventional Commits (`feat:`, `fix:`, `feat!:` …; the `Title` check): the squash merge makes the title the commit release-please reads. `feat`, `fix`, `perf` and `revert` release (or a `Release-As:` footer); `docs`, `ci`, `chore`, `test`, `refactor`, `build`, `style` do not.
- The package ships `dist/`, `tokens/generated/` and `fonts/` (with `OFL.txt`).
- The package's one runtime dependency is `harfbuzzjs`, pinned exactly: it subsets the `fonts/` faces embedded in every written SVG (ADR 0008). Another runtime dependency needs an ADR.
- Board area: `site` (Azure Boards, project `brunosouzas`).
- OpenSpec: yes, see `openspec/`. The order of the planned changes is in `docs/roadmap.md`.
- Project-wide decisions are ADRs in `docs/adr/` (index in `docs/adr/README.md`). Read them before a design; a change that contradicts one needs a new ADR that supersedes it.
- Every on-screen string of a scene or piece comes from an approved source: a published article of the blog (or its diagram labels), or a post or page the owner approved for publication (ADR 0004, amended 2026-10-30); a catalogue scene in `src/scenes/` still comes from a published article and keeps its strings in its per-language text table. New scenes are language-neutral by default and every gesture names its source line (ADR 0005). A scene or piece never adds a claim its source does not make. Reason: the animation illustrates an approved text; it must not say more than the text.
- Colours keep their meaning across every scene and diagram: green healthy or normal, orange blocked or fail-fast, yellow transitional, light blue caller, coral backend, red the failure path, read from `color.state.*` only. A piece uses a state colour only where it means that state (ADR 0009). Reason: the reader learns the code once.
- The v2 piece grammar (ADR 0009): flat shapes, one rounded ink outline, no hard offset shadow, white bodies and neutrals, one accent, and on the dark surface ink strokes in `surface.dark.muted`; never blur or gradients. `test/pieces/palette.test.ts` checks every piece's colours. Reason: the cast, the objects and the cover pieces read as one family.
- Every render is reproducible from code and committed sources; no hand-edited video in the repository. Rendered videos are build outputs and are not committed (only small evidence images in `docs/`).
- The owner approves every scene from rendered stills and videos; no model scores or chooses them.
- Public text (README, docs, specs, commit messages) is in English.

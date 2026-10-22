# brunosouzas-design-system: project context

The public visual identity of the blog brunosouzas.com: one source of design tokens (exported to CSS, TypeScript and JSON), Remotion motion components, and a catalogue of animated scenes that illustrate the blog's published articles. Owner: Bruno Souza. Human documentation lives in the brain vault under `10-personal/projects/brunosouzas-design-system/`.

## Technology

Stack: TypeScript, Node.js, React, Remotion, vitest, GitHub Actions, OpenSpec

Layout: `tokens/source.json` (the only place token values are written) generates `tokens/generated/` (committed; never edit by hand); `src/brand/` holds the motion components and their frame logic (`motion.ts`); `src/scenes/<scene>/` holds each scene (`scene.ts` data without React, `layout.ts`, `Scene.tsx`); `scripts/` holds the token build and the stills and render commands; `test/` the vitest suites. Node.js 22.12 or later.

- Build: `npm ci`, then `npm run tokens` after any change to `tokens/source.json` (`npm run tokens:check` fails on stale output)
- Test: `npm run typecheck && npm run tokens:check && npm test` (what CI runs; no rendering, no network)
- Run locally: `npm run studio` (Remotion Studio), `npm run stills -- <scene>` (key-frame PNGs in `out/stills/`), `npm run render -- <scene>` (masters in `out/master/`, web copies in `out/web/`); both accept `--dry-run`. Rendering needs the network (headless browser on first use, Lato from Google Fonts).

## Rules for this repository

- Integration branch: `main`.
- Board area: `site` (Azure Boards, project `brunosouzas`).
- OpenSpec: yes, see `openspec/`. The order of the planned changes is in `docs/roadmap.md`.
- Project-wide decisions are ADRs in `docs/adr/` (index in `docs/adr/README.md`). Read them before a design; a change that contradicts one needs a new ADR that supersedes it.
- Every on-screen string of a scene comes from an approved, published article of the blog (or its diagram labels), in the scene's per-language text table. A scene never adds a claim the article does not make. Reason: the animation illustrates an approved text; it must not say more than the text.
- Colours keep their meaning across every scene and diagram: green healthy or normal, orange blocked or fail-fast, yellow transitional, light blue caller, coral backend, red the failure path. Reason: the reader learns the code once.
- Flat shapes, ink outline, hard offset shadow; never blur or gradients. Reason: the outline and shadow pair is what makes the style recognisable.
- Every render is reproducible from code and committed sources; no hand-edited video in the repository. Rendered videos are build outputs and are not committed (only small evidence images in `docs/`).
- The owner approves every scene from rendered stills and videos; no model scores or chooses them.
- Public text (README, docs, specs, commit messages) is in English.

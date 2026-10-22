# brunosouzas-design-system: project context

The public visual identity of the blog brunosouzas.com: one source of design tokens (exported to CSS, TypeScript and JSON), Remotion motion components, and a catalogue of animated scenes that illustrate the blog's published articles. Owner: Bruno Souza. Human documentation lives in the brain vault under `10-personal/projects/brunosouzas-design-system/`.

## Technology

Stack: TypeScript, Node.js, React, Remotion, vitest, GitHub Actions, OpenSpec

Nothing is implemented yet: the repository holds the plan, the ADRs and the pilot's evidence (`docs/spikes/2026-10-22-motion-pilot/`). Say so instead of describing files that do not exist. The first change (`docs/roadmap.md`) adds the code, and with it these commands:

- Build: not available yet
- Test: not available yet
- Run locally: not available yet

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

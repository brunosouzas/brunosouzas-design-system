# Tasks: brand-link-icon

Test levels: **unit** (vitest, pure functions), **integration** (vitest, the cover command in temporary folders), **local** (a real Chrome and the owner's eyes; not in CI). Existing tests stay green unless a task names the change.

## 1. The brunosouzas link icon (`illustration-pieces`)

- [x] 1.1 Export `symbolShapes(text, moon)` from `src/pieces/symbol.ts` and draw `symbol` from it; the favicon and avatar goldens and "Default avatar unchanged" stay green unchanged. Check: `npm test -- test/scripts/cover.test.ts test/scripts/cover-formats.test.ts`.
- [x] 1.2 Append `brunosouzas` to `LINK_ICONS` in `src/pieces/link-icons.ts` (design §1: the glyph group, title, description, `face: "color.white"`) and update the file's header comment. Unit tests in `test/pieces/icons.test.ts`: "brunosouzas on light", "brunosouzas on dark", "Same drawing as the symbol", "Glyph inside the face, brunosouzas", "Link icon list"; update "Unknown icon" (six names) and "Faces and glyphs as designed" (six faces). "GitHub on light" and "Dark frame" stay green unchanged. Check: `npm test -- test/pieces/icons.test.ts`.
- [x] 1.3 "Every icon as a standalone file": the walk in `test/pieces/icons.test.ts` covers 26 trees (unit). "Inside the outlined group" (`test/pieces/icons.test.ts`), "Every piece in the v2 palette" (`test/pieces/palette.test.ts`) and the catalogue tests stay green unchanged. Check: `npm test -- test/pieces`.
- [x] 1.4 "brunosouzas in an icon spec": an integration test in the "Icon output" block of `test/scripts/cover-formats.test.ts` builds the icon spec and checks the 46 x 46 root; the palette check runs on the drawn tree on both surfaces.

- [x] 1.5 "Each link icon stands alone": "Two link icons in one icon spec" (integration, `test/scripts/cover-formats.test.ts`, the command refuses the spec and writes nothing) and "No combined link icons in the package" (unit, `test/pieces/icons.test.ts`, the root exports and `PIECES`). Check: `npm test -- test/pieces/icons.test.ts test/scripts/cover-formats.test.ts`.

## 2. Evidence, docs and checks

- [x] 2.1 Evidence (design §2) with `npm run png` in `docs/spikes/2026-11-11-brand-link-icon/`, with a `README.md` of the commands: `brunosouzas-icon-light.png`, `brunosouzas-icon-dark.png` (size 184), `evidence-row-light.png`, `evidence-row-dark.png` (the six separate icons side by side, a gate image only). Check (local): each file under 200 KB (`ls -l`); a 24 px render, outside the repository, shows a legible b with its moon.
- [x] 2.2 README "UI and link icons" (`brunosouzas`, and `website` for any other site) and `docs/roadmap.md` row `brand-link-icon`, AB#326. Check: `grep -n "brunosouzas\`" README.md` lists the section.
- [x] 2.3 The full suite, `npm run typecheck && npm run tokens:check && npm run build && npm test`, exits 0; `openspec validate brand-link-icon --strict` passes.
- [ ] 2.4 Release: the pull request is titled `feat: brunosouzas link icon, the brand symbol (AB#326)`, so release-please proposes one minor. The change is archived after the owner's gate, in the same branch (`openspec archive brand-link-icon -y`, then `openspec validate --all --strict`).

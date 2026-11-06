# Tasks: identity v2 guide and system

## 1. ADRs (docs only, no code)

- [x] 1.1 Write `docs/adr/0006-three-layer-tokens-and-brand-colour.md`, status accepted, superseding 0003: the three-layer model, the brand roles table with AA ratios (from the phase-3 evidence note), the track colours, the decision to keep diagram-state values unchanged under `color.state.*`.
- [x] 1.2 Write `docs/adr/0007-mira-and-the-pillar-cast.md`, status accepted, superseding 0005: Mira, Visor, Drone, Kiu, Sinal, their roles, the per-role mapping table from `design.md`, the signature device (hood tip) rule, the "never a product's own identity borrows the hood tip" rule (Sinal exception, I4).
- [x] 1.3 Add "Superseded by" cross-references in 0003 and 0005 pointing at 0006/0007 (ADRs are never deleted); update `docs/adr/README.md` index.

## 2. Tokens

- [x] 2.1 Restructure `tokens/source.json`: add a new top-level `brand` group (`light`/`dark`, exactly like `surface`) with `bg`/`cardBg`/`text`/`textMuted`/`border`/`borderStrong`/`accent`/`accentText`/`onAccent`/`success`/`failure`/`warning`/`trackIntegration`/`trackDelivery`/`trackAi` (values per `design.md`'s measured table); add `color.state.*` (literal duplicate of today's six-meaning `color.*` tokens, scenario-tested equal, for one release); add `cast.eyes` (new, shared) and `cover.signatureMargin`. The token build caps a path at three segments (`scripts/tokens.ts`), which is why `brand` is its own top-level group, not `color.brand`, and why the cast skin has no per-character or per-theme tokens (outline/visor/body are picked in piece code from `brand.*`/`color.white`, see `design.md` decision 1).
- [x] 2.1a Code change in `scripts/tokens.ts`: add `"brand"` to `GROUPS` and `CLOSED_GROUPS`; generalise the light/dark exact-match check (today hardcoded to `"surface"`) to a shared `LIGHT_DARK_GROUPS` list covering `surface` and `brand`; add the new `REQUIRED` entries. Unit tests in `test/tokens/` for the new closed-group and required-token scenarios (same pattern as the existing `surface` tests).
- [x] 2.2 Update `openspec/specs/design-tokens/spec.md`: new top-level/nested groups accepted, scenarios for the aliasing behaviour and its removal date, scenarios for the new required brand/track/cast tokens.
- [x] 2.3 `npm run tokens`, `npm run tokens:check`, confirm `tokens/generated/*` compiles with no manual edits.
- [x] 2.4 Consumers (`src/pieces/`, `src/brand/`) keep reading `color.*` directly; the migration to `color.state.*` is deferred to 0.7.0, when the alias is removed (no visual or behavioural change either way, confirmed by the full test suite staying green with both paths present).

## 3. Pieces: cast and bank objects

- [ ] 3.1 `mira` piece: front/back, light/dark, four state faces (idle/done/waiting/failed), reusing the phase-3/4 scratch generator geometry (`~/.hermes/cache/scratch/ab266/final.py`, `ab267/phase4.py`) as the starting point, ported to pure TypeScript token-driven functions (no literal colours, per STY-2/illustration-pieces spec).
- [ ] 3.2 `visor`, `drone`, `kiu`, `sinal` pieces: same treatment from the approved cast sheet (`ab266/sheet5.py`/`sheet6.py`/`sheet7.py`).
- [ ] 3.3 Bank objects: `correio`, `lume`, `carga`, `anel`, `modulo`, `hub`, each with a screen-off state (no face) and promotable to a character sheet later if reused with a face in 2+ pieces (E8).
- [ ] 3.4 Retire `MASCOTS`/`MASCOT_ACTIONS`/`MASCOT_FACES` of the old seven-role cast per the per-role mapping in `design.md`: keep what maps cleanly (reusing Visor for "AI agent", Drone for "DevOps") as named exports of the new pieces, drop `EMOTE_KINDS` entries that no longer apply, keep the rest. Dev/Architect/Data supporting-role pieces are **not** built in this task (out of scope, see proposal.md and design.md decision 2); they are created by the first AB#144-150 scene that needs one.
- [ ] 3.5 Update `openspec/specs/illustration-pieces/spec.md` with the new piece contracts and scenarios (shape, pure-function, token-only colour, overflow guard — same pattern as existing pieces).
- [ ] 3.6 `npm run pieces:sheet` to render every piece once for review; `vision_analyze` every new piece before moving on.

## 4. Pieces: notation (19 icons)

- [ ] 4.1 Pick the 13 EIP patterns for the brand notation (by published-catalogue and roadmap-card frequency), each redrawn as its market-recognised silhouette in the new ink/flat grammar (design.md, decision 3).
- [ ] 4.2 Draw the 3 delivery and 3 AI notation icons (new, no market precedent constraint beyond the brand's own visual rules).
- [ ] 4.3 Add `BRAND_NOTATION_ICONS`/`BRAND_NOTATION_ICON_NAMES` and a `brandNotationIcon({ name, x, y, scale })` drawing function (distinct from `EIP_ICON_NAMES`/`eipIcon`) to `src/pieces/`, spec scenarios distinguishing the new family from the diagram icon family (no shared names, no shared export surface).
- [ ] 4.4 Add the `categoryIcon` piece for "Ferramentas pessoais" (design.md decision 4): agent picks the glyph (triage TRI-1), neutral colour (`brand.<theme>.text`, picked by its `surface` parameter), its own spec scenarios.

## 5. Cover/banner/diagram/icon commands

- [x] 5.1 Cover command: add `coverBackground.trackIntegration`/`trackDelivery`/`trackAi` entries (fill/ring, literal values matching `brand.light.track*`) so `background: "trackIntegration"` works through the existing `background` field and `backgroundNames()` — no change to `cover.ts`'s resolution code (design.md, "Component layer, concretely"). The 21 literal entries stay for one release so already-committed specs in `brunosouzas-content` still build, removed in 0.7.0 once every cover is rebuilt (task 7.2).
- [x] 5.2 Add the Mira+symbol signature lockup as a composable piece addition to every cover/banner/og/favicon/avatar format.
- [x] 5.3 New formats/sizes per A3-A5: LinkedIn "new piece" card 1080×1080, og 1200×630 generic, favicon SVG with `prefers-color-scheme` (PNG set is the consuming site's build step, not this package's — Bruno's call), avatar 500×500 — each a new `format` value in the cover-cli spec with its own output-shape requirement (see spec delta task 5.4).
- [x] 5.4 Update `openspec/specs/cover-cli/spec.md` and `README.md` (`npm run cover`) with the new fields and formats.

## 6. Tests, build, release

- [x] 6.1 `npm run typecheck && npm run tokens:check && npm run build && npm test`.
- [x] 6.2 `npm run pieces:sheet` + rendered proof images attached to the pull request (preview, destination B).
- [x] 6.3 Bump `package.json` to `0.6.0` in a release pull request per `docs/release.md`; owner merges and approves the `npm` environment.
- [x] 6.4 Verify `npm view @brunosouzas/design-system version` after publish. Published (log: provenance signed, tag `v0.6.0`, GitHub release created); `npm view` still 404s minutes later, which matches npm's own "your package is being processed and may take a few minutes" notice in the publish log — re-check at the start of the next session before task 7.1.

## 7. Consumers (S8, after the release is published)

- [ ] 7.1 `illustration` kit skill: bump the pinned version in `SKILL.md` to 0.6.0, update `references/covers-and-banners.md` for the track-based background and the new signature, own PR with the rebuilt-proof reference.
- [ ] 7.2 `brunosouzas-content`: rebuild the 21 existing cover specs against 0.6.0 (reuse each spec, new track background, new signature, new type), render and diff every PNG, follow-up pull request, owner reviews the renders before merge (precedent AB#140).
- [ ] 7.3 Version-bump follow-up pull requests in `brunosouzas.com` and `stackledger` (level 1 once CI is green and review is clean).

## 8. Kit rules

- [ ] 8.1 `illustration`/rules.md: replace COV-4 with the track-based grouping rule; add a rule distinguishing the brand notation family from the diagram EIP icon family (WORK-7's "missing piece" test now names which family to request from).
- [ ] 8.2 `motion`/rules.md: point CAST-1..5 at the new cast; add a rule for when a technical scene may reuse a pillar character vs must request a new supporting role (design.md's per-role test).
- [ ] 8.3 `art-direction`/rules.md: remove STU-2 (resolved: the shipped pieces now have a real source in the design system's code, not a Penpot file).
- [ ] 8.4 Kit PR: `kit.py map --check`, stackledger skills validate, tests; independent review (skills are code).

# Architecture decision records

Project-wide decisions, one file each (`NNNN-<slug>.md`, with Status, Context, Options considered, Decision, Consequences). A change that contradicts an accepted ADR needs a new ADR that supersedes it.

| ADR | Decision | Status |
|---|---|---|
| [0001](0001-remotion-for-motion.md) | Animated explainers are made with Remotion (React rendered to video) | accepted |
| [0002](0002-one-token-source.md) | One token source, with generated CSS, TypeScript and JSON exports | accepted |
| [0003](0003-visual-language-and-colour-meaning.md) | Flat shapes, ink outline, hard shadow, and colours with one fixed meaning | accepted, amended by [0008](0008-type-inside-the-image.md) and [0009](0009-one-piece-grammar.md); colour superseded by [0006](0006-three-layer-tokens-and-brand-colour.md) |
| [0004](0004-scenes-illustrate-published-articles.md) | Every on-screen string of a scene or piece comes from an approved source: a published article, or a post or page the owner approved | accepted, amended 2026-11-12 (a neutral scene's few English words in one `en` table) |
| [0005](0005-neutral-videos-and-the-cast.md) | Neutral videos by default, told by a fixed cast and emotes; caption optional; every action tied to an article line | superseded by [0007](0007-mira-and-the-pillar-cast.md) |
| [0006](0006-three-layer-tokens-and-brand-colour.md) | Three-layer token architecture (primitive, semantic, component); the brand/site colour roles and track colours, AA-measured in both themes | accepted, amended by [0009](0009-one-piece-grammar.md), by the owner's track families (2026-11-06), by the site palette on the brand roles (2026-11-06) and by the stackledger accent and the v2 backdrop (2026-11-07) |
| [0007](0007-mira-and-the-pillar-cast.md) | Mira and four pillar characters (Visor, Drone, Kiu, Sinal) replace the engineering-role cast; reuse only where the story still reads | accepted, amended by [0009](0009-one-piece-grammar.md) |
| [0008](0008-type-inside-the-image.md) | Source Sans 3 and Source Code Pro reach every written SVG as a per-image subset embedded with `harfbuzzjs`; the fonts ship in the package | accepted, amended 2026-11-08 (Source Serif 4 Bold for `headline`) |
| [0009](0009-one-piece-grammar.md) | One piece grammar: no hard shadow, white bodies, one accent, colour only where it means something, ink muted on dark | accepted |

# Design: identity v2 guide and system

## Decision 1: token architecture (ADR 0006)

**Options considered**

1. Keep one flat token list (today's shape) and just add new brand colour entries beside the old ones. Cheapest, but leaves two colour systems (state tokens flat, brand tokens newly layered) with no shared rule, and does not answer the owner's "mudar o que for necessário para seguir o novo padrão".
2. Three layers (primitive → semantic → component), applied **only** to the new brand/site tokens, leaving `color.*` (state) exactly as it is today, in its own flat group.
3. Three layers applied to the **whole** colour system: primitives (raw hex, measured once), semantic roles (`color.state.*` for diagram states, a new top-level `brand.*` for bg/text/accent/success/failure/warning/track), and component tokens (`cover.background`, `cover.signatureMargin`, `cast.eyes`) that alias a semantic role for one specific use.

**Decision: option 3.** The owner's answer ("estamos reestruturando... devemos mudar o que for necessário") rules out leaving two colour systems side by side. Diagram-state colours keep their exact hex values and meaning (no published diagram or scene changes appearance); only their place in the token tree changes, from `color.healthy` to `color.state.healthy` (a literal duplicate kept at the old path for one release, removed in 0.7.0 — the token build has no alias mechanism, so "aliased" here means "the same value written twice", with a test asserting equality; the only consumers, `src/pieces/`, `src/brand/`, get a single, mechanical rename commit with no visual diff).

**Technical constraint that shaped this decision:** the token build (`scripts/tokens.ts`) caps a path at three segments — a top-level group, one optional sub-level of groups, then a token (`color.ink` or `motion.pop.damping`, never a fourth segment). `color.brand.light.bg` (four segments) is invalid; the brand roles need their own **top-level** group, `brand`, with `light`/`dark` sub-groups, exactly like the existing `surface` group (`brand.light.bg`, `brand.dark.bg`, and so on) — not nested under `color`. `scripts/tokens.ts` gains `brand` in `GROUPS` and `CLOSED_GROUPS` (exact `light`/`dark` entries enforced, the same rule `surface` already follows, generalised in this change to a shared `LIGHT_DARK_GROUPS` list).

**The cast's colour, simplified by the same constraint:** `cast.mira.light.outline` would also be four segments, and the identity table shows every character shares one skin anyway (body, outline, visor, eyes are the same for Mira and all four pillar characters — only shape and one signature part differ). So no per-character or per-theme cast colour tokens are added at all, except one new shared token, `cast.eyes` (`#FFC98A`, same both themes). Body is the existing `color.white`; outline and visor are **not tokens**: each piece picks `brand.light.text`/`brand.dark.textMuted` (outline) or `brand.light.text`/`brand.dark.text` (visor) itself from its `surface` parameter, exactly like the existing surface-aware map/diagram pieces (`zone`, `stationMarker`) already branch between `surface.light.*` and `surface.dark.*` in their own code rather than taking a token-path parameter.

**Component layer, concretely:** `coverBackground` already exists as the component-layer group a cover's `background` field resolves against (`src/pieces/cover.ts`, `backgroundNames()` over `tokens.coverBackground`); this change extends it rather than replacing its shape, adding `trackIntegration`, `trackDelivery` and `trackAi` entries (each a `fill`/`ring` pair, literal values matching `brand.light.track*`) alongside the 21 existing literal pairs, which stay for one release so already-committed specs in `brunosouzas-content` still build (removed once every cover is rebuilt on a track background, task 7.2). No change to `cover.ts`'s resolution code is needed, only to the token source and the `backgroundNames()` list it already reads.

**Naming:** the brand role the phase-3 table calls "surface" (cards, code panels) is named `cardBg` in the token tree, not `surface`, because the package already has an unrelated top-level `surface.*` group (the map/diagram background). Reusing the word would read as the same thing in the generated CSS variables (`--ds-brand-light-card-bg` vs `--ds-surface-light-background`) and is not.

## Measured values (committed)

Every value below is the phase-3 evidence note's measured table (`10-personal/projects/brunosouzas-design-system/evidence/2026-11-05-estudio-identidade-v2.md`, AA confirmed in both themes); this is the authoritative source `tokens/source.json` is written from, not the scratch renders.

| Role (`brand.<light|dark>.*`) | Light | Dark |
|---|---|---|
| `bg` | `#F6F3EC` | `#121110` |
| `cardBg` | `#FFFFFF` | `#1D1C1A` |
| `text` | `#121212` | `#F1EEE8` |
| `textMuted` | `#5C5852` | `#ADA79D` |
| `border` | `#D7D1C5` | `#3B3834` |
| `borderStrong` | `#5C5852` | `#ADA79D` |
| `accent` | `#E04E17` | `#FF7A45` |
| `accentText` | `#B83A0C` | `#FF7A45` |
| `onAccent` | `#FFFFFF` | `#121110` |
| `success` | `#2B7A4B` | `#5BBF86` |
| `failure` | `#A1124B` | `#FF6696` |
| `warning` | `#8F5F00` | `#EBB34B` |
| `trackIntegration` | `#F4E4D8` | `#2A1C15` |
| `trackDelivery` | `#DFE8E1` | `#18231D` |
| `trackAi` | `#E2E4EC` | `#1B1F28` |

Cast skin (shared by Mira and all four pillar characters, both themes): `body` = `color.white` (`#FFFFFF`); `outline` = `brand.light.text` in light, `brand.dark.textMuted` in dark; `visor` (the screen's ink) = `brand.light.text` in light, `brand.dark.text` in dark; `eyes` = the new `cast.eyes` token, `#FFC98A` both themes (12.5:1 over the visor). A character's own identity is its shape and its one signature part (the parent-brand hood tip, never on Sinal, I4), not a different skin palette.

## Decision 2: the cast (ADR 0007)

**Options considered**

1. Drop the seven engineering-role mascots outright and use only Mira + the four pillar characters for every future scene, reusing Visor (AI pillar) for "the AI agent", Drone (delivery) for "DevOps", etc.
2. Keep both casts side by side (old for scenes, new for brand pieces) until a future motion phase redesigns scene storytelling.
3. Per-role mapping: for each of the seven old roles, check whether a pillar character tells the same part of the story without the reader misreading it; keep the mapping only where it is unambiguous, and leave any role that has no honest match unresolved, created only when a real scene needs it to act.

**Decision: option 3**, per the owner's answer ("pensar se os personagens que temos se encaixam no contexto, caso contrário criamos novos... quem ver o vídeo e diagramas entenda a mensagem"). Mapping, to be confirmed while the cast pieces are built and reviewed against real storyboards (AB#144-150):

| Old role | Pillar fit | Resolution |
|---|---|---|
| AI agent | Visor (AI pillar) | Reuse: the story (an AI agent acting) is exactly what Visor already stands for. |
| Dev | no pillar matches "the human developer acting on their own" | No honest match; out of scope for this change (see below). |
| Architect | no pillar matches "designs the system" | No honest match; out of scope for this change (see below). |
| DevOps | Drone (delivery pillar) | Reuse: DevOps' story (shipping, running, operating) already maps to Drone's delivery role. |
| Data | no pillar matches "the datastore" as an actor | As scenery (not acting), a bank object (Módulo/Anel, screen-off) already covers it; no new character needed for that case. |
| Requester/caller | no pillar matches; this was never a character | `color.state.caller` stays a state colour on message/flow elements, unchanged. |
| Message | Kiu (wiki/series) only if the scene is about content moving through the wiki; otherwise stays the generic `message` flow token | Scene-by-scene call, not a blanket reuse. |

No role is reused where the reader would misread it (the owner's hard requirement); this table is the working hypothesis the first new or reused-character storyboard must confirm before AB#144 starts.

**Scope for this change:** only the two reuse mappings ship now (Visor standing in for "AI agent", Drone for "DevOps", both pillar characters this change already builds for A1-A9). The rows with no honest match (Dev, Architect, Data as acting characters) are **out of scope for AB#268**: no new supporting-role piece or sheet is built here. Those roles are created, with their own art-direction sheet and an ADR 0007 amendment, by whichever of AB#144-150 first needs one to act — never invented ahead of a real scene's storyboard.

## Decision 3: EIP notation icons

Two EIP icon families now coexist: the 26 **diagram** icons (`eip-icons.ts`, unchanged, used inside body-diagram SVGs) and the new 19-icon **brand notation** (13 EIP + 3 delivery + 3 AI, I11), used on covers, home, LinkedIn and GitHub. For the 13 EIP notation icons, the owner's rule applies: redraw each pattern's **market-recognised silhouette** (the shape EIP literature already associates with that pattern — a fork for Content-Based Router, a funnel for Message Filter, a megaphone/broadcast for Publish-Subscribe, and so on) in the new ink-outline/flat grammar (I1's line rule: solid now, dotted waits), never a literal copy of the EIP book's artwork (strategy's "o glifo é próprio, nunca o do Hohpe") and never an arbitrary new shape unconnected to the pattern's known meaning. The choice of which 13 patterns make the notation (out of the 26 already drawn) is the agent's design call (triage TRI-1 precedent), driven by which patterns appear most across the published catalogue and the planned EIP video cards (AB#144-150).

A notation icon needs a drawing contract too, not only data: `brandNotationIcon({ name, x, y, scale })` (parallel to the existing `eipIcon({ name, x, y, scale })`) draws one icon from `BRAND_NOTATION_ICON_NAMES` at its anchor point; the function, not just the name list, is what `src/pieces/cover.ts` and the site's category/home art call.

## Decision 4: the "Ferramentas pessoais" category icon

The site's fourth category icon is genuinely requested of the design system in this phase (it has no existing representation in either icon family, per the phase-4 evidence note) — it is in scope, only its final glyph is the agent's call, not a question for the owner (triage TRI-1 precedent: a single-use request the agent resolves). It is neither a diagram icon nor one of the 19 notation icons (it represents a site category, not an EIP/delivery/AI pattern): it ships as its own small piece, `categoryIcon({ category: "personalTools", x, y, scale, surface })`, drawn in the same ink/flat grammar, coloured from `brand.<theme>.text` (neutral: "Ferramentas pessoais" has no track colour, see Decision 1's track table, which defines only the three brand pillars).

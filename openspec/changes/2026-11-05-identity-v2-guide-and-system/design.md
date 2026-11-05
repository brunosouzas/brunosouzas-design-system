# Design: identity v2 guide and system

## Decision 1: token architecture (ADR 0006)

**Options considered**

1. Keep one flat token list (today's shape) and just add new brand colour entries beside the old ones. Cheapest, but leaves two colour systems (state tokens flat, brand tokens newly layered) with no shared rule, and does not answer the owner's "mudar o que for necessário para seguir o novo padrão".
2. Three layers (primitive → semantic → component), applied **only** to the new brand/site tokens, leaving `color.*` (state) exactly as it is today, in its own flat group.
3. Three layers applied to the **whole** colour system: primitives (raw hex, named `palette.*`), semantic roles (`color.state.*` for diagram states, `color.brand.*` for bg/text/accent/success/failure/warning/track, `color.cast.*` for character skin), and component tokens (`cover.background`, `cast.mira.body`, …) that alias a semantic role for one specific use.

**Decision: option 3.** The owner's answer ("estamos reestruturando... devemos mudar o que for necessário") rules out leaving two colour systems side by side. Diagram-state colours keep their exact hex values and meaning (no published diagram or scene changes appearance); only their place in the token tree changes, from `color.healthy` to `color.state.healthy` (an alias is kept at the old path for one release, removed in 0.7.0, so the only consumers — `src/pieces/`, `src/brand/` — get a single, mechanical rename commit with no visual diff). New brand roles live at `color.brand.*` (bg/surface/text/accent/success/failure/warning) and `color.brand.track*` (integration/delivery/ai, the semantic layer); the cast's skin/outline/visor/eyes roles are their own semantic group (`color.brand.cast.*`), documented in the identity studio's measured AA table (phase 3 evidence note).

**Component layer, concretely:** `coverBackground` already exists as the component-layer group a cover's `background` field resolves against (`src/pieces/cover.ts`, `backgroundNames()` over `tokens.coverBackground`); this change extends it rather than replacing its shape, adding `trackIntegration`, `trackDelivery` and `trackAi` entries (each a `fill`/`ring` pair aliasing `color.brand.track*`) alongside the 21 existing literal pairs, which stay for one release so already-committed specs in `brunosouzas-content` still build (removed once every cover is rebuilt on a track background, task 7.2). No change to `cover.ts`'s resolution code is needed, only to the token source and the `backgroundNames()` list it already reads.

## Decision 2: the cast (ADR 0007)

**Options considered**

1. Drop the seven engineering-role mascots outright and use only Mira + the four pillar characters for every future scene, reusing Visor (AI pillar) for "the AI agent", Drone (delivery) for "DevOps", etc.
2. Keep both casts side by side (old for scenes, new for brand pieces) until a future motion phase redesigns scene storytelling.
3. Per-role mapping: for each of the seven old roles, check whether a pillar character tells the same part of the story without the reader misreading it; keep the mapping only where it is unambiguous, and give any role that has no honest match in the new cast its own new character (with a sheet, following ADR 0007/SHEET-1), rather than forcing a pillar character into a role it was not designed for.

**Decision: option 3**, per the owner's answer ("pensar se os personagens que temos se encaixam no contexto, caso contrário criamos novos... quem ver o vídeo e diagramas entenda a mensagem"). Mapping, to be confirmed while the cast pieces are built and reviewed against real storyboards (AB#144-150):

| Old role | Pillar fit | Resolution |
|---|---|---|
| AI agent | Visor (AI pillar) | Reuse: the story (an AI agent acting) is exactly what Visor already stands for. |
| Dev | no pillar matches "the human developer acting on their own" | New supporting role, brand skin, sheet before use. |
| Architect | no pillar matches "designs the system" | New supporting role, or reuse Mira in a non-protagonist beat only where she is literally pointing out the route (needs a storyboard test, not assumed). |
| DevOps | Drone (delivery pillar) | Reuse: DevOps' story (shipping, running, operating) already maps to Drone's delivery role. |
| Data | no pillar matches "the datastore" | Keep as a bank object (Módulo/Anel, screen-off) when it is scenery, or a new small supporting role when it must act. |
| Requester/caller | no pillar matches; this is a state-colour role (`color.state.caller`), not a character | Stays a state colour on the message/flow elements, never a character. |
| Message | Kiu (wiki/series) only if the scene is about content moving through the wiki; otherwise stays the generic `message` flow token | Scene-by-scene call, not a blanket reuse. |

No role is reused where the reader would misread it (the owner's hard requirement); this table is the working hypothesis the first new or reused-character storyboard must confirm before AB#144 starts.

## Decision 3: EIP notation icons

Two EIP icon families now coexist: the 26 **diagram** icons (`eip-icons.ts`, unchanged, used inside body-diagram SVGs) and the new 19-icon **brand notation** (13 EIP + 3 delivery + 3 AI, I11), used on covers, home, LinkedIn and GitHub. For the 13 EIP notation icons, the owner's rule applies: redraw each pattern's **market-recognised silhouette** (the shape EIP literature already associates with that pattern — a fork for Content-Based Router, a funnel for Message Filter, a megaphone/broadcast for Publish-Subscribe, and so on) in the new ink-outline/flat grammar (I1's line rule: solid now, dotted waits), never a literal copy of the EIP book's artwork (strategy's "o glifo é próprio, nunca o do Hohpe") and never an arbitrary new shape unconnected to the pattern's known meaning. The choice of which 13 patterns make the notation (out of the 26 already drawn) is the agent's design call (triage TRI-1 precedent), driven by which patterns appear most across the published catalogue and the planned EIP video cards (AB#144-150).

# ADR 0007: Mira and the pillar cast

- Status: accepted
- Date: 2026-11-05
- Supersedes: ADR 0005 (the cast; its neutral-video and storyboard-gate rules are unchanged, only the characters themselves are replaced)

## Context

ADR 0005 gave the package a seven-role engineering cast (Dev, AI agent, Architect, DevOps, Data, Requester, Message), built for scene storytelling and used once, in the approved cast motion test. The visual identity redesign (epic AB#263) ran its own casting process in the identity studio (phases 3-4, decisions I2-I4, A1, A6-A8) and the owner approved a different cast, built around the brand's four content pillars rather than engineering roles: a protagonist, Mira, and four pillar characters. The owner's instruction, when asked whether to replace the old cast outright: "pensar se os personagens que temos se encaixam no contexto, caso contrário criamos novos... quem ver o vídeo e diagramas entenda a mensagem" — reuse only where the story still reads, invent where it does not, and never guess.

## Options considered

1. Drop the seven-role cast outright and force every old role onto a pillar character (Visor standing in for Architect, Drone for Data, and so on).
2. Keep both casts side by side, old for scenes, new for brand pieces, until a later motion phase redesigns scene storytelling.
3. A per-role test: keep the mapping only where a pillar character tells the same part of the story without the reader misreading it; leave every role with no honest match unresolved, created only when a real scene needs it to act.

## Decision

Option 3.

**The cast.** Mira is the protagonist: an astrolabe with a screen face, a needle that points the route, two legs, the parent-brand hood tip on her top edge (identity sheet, `evidence/2026-11-05-estudio-identidade-v2.md`). Four pillar characters stand for the brand's content pillars and may appear as supporting cast in a Mira-led piece, or lead a piece about their own pillar:

| Character | Pillar | Role |
|---|---|---|
| Visor | AI engineering | the AI pillar's actor |
| Drone | Delivery | the delivery pillar's actor |
| Kiu | Wiki and series | the content/wiki pillar's actor |
| Sinal | stackledger | the product's own actor (no parent-brand hood tip: stackledger has its own identity, I4) |

**Per-role mapping from the old cast, confirmed against real storyboards before use (AB#144-150):**

| Old role | Resolution |
|---|---|
| AI agent | Reuse Visor: the story (an AI agent acting) is exactly the AI pillar's own story. |
| DevOps | Reuse Drone: shipping, running and operating a system is the delivery pillar's own story. |
| Dev | No honest match. Out of scope for this ADR: a new supporting role, with its own sheet, is created only when a scene (AB#144-150) needs "the human developer acting" and cannot tell that part of the story with the existing cast. |
| Architect | No honest match, same treatment as Dev. |
| Data | No honest match as an actor; as scenery (the datastore, not acting), a bank object (Módulo or Anel, screen off) already covers it — no new character needed for that case. |
| Requester/caller | Was never a character: `color.state.caller` is a state colour on message/flow elements. Unchanged. |
| Message | Stays the generic message/flow token, except where a scene is specifically about content moving through the wiki, where Kiu may carry it — a scene-by-scene call, never a blanket reuse. |

**Skin and identity.** All five characters share one skin (body white, outline/visor/eyes per ADR 0006's `cast.*` table in both themes); a character's identity is its shape and its one signature part, never a different palette. The parent-brand hood tip marks every parent-brand character except Sinal (I4); the symbol ("b" with the moon accent, I5) and Mira together are the signature lockup used on every piece.

**Unchanged from ADR 0005:** neutral by default (one video for both languages, no on-screen words except identical pattern/state names); caption only when the motion cannot explain itself; one cast and one gesture/emote vocabulary; 16:9 only, 4:5 on demand; storyboard gate before any spec; a character's colour is its identity and never changes with state.

## Consequences

- No video or diagram loses its cast without a replacement: the two roles the pillars genuinely cover (AI agent, DevOps) are reused now; the three that are not are left open, not forced, so a future scene is never built on a character that would misread.
- `MASCOTS`/`MASCOT_ACTIONS`/`MASCOT_FACES` and the pieces for Dev, Architect, Data, Requester as characters are retired; `EMOTE_KINDS` keeps only the entries the new cast still uses.
- The planned EIP video cards (AB#144-150) each start with a storyboard that tests this ADR's mapping against a real beat, before any new supporting-role character is built — never speculatively ahead of a scene.
- stackledger's Sinal keeps its own identity (no hood tip): the parent-brand family and a product's own identity stay visually distinct, as the brand strategy's family architecture requires.

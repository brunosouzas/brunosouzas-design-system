# ADR 0005: Neutral videos, told by a fixed cast

- Status: proposed (AB#152; accepted when its pull request merges)
- Date: 2026-10-24
- Amends: ADR 0003 (the caption default), ADR 0004 (claims made by actions)

## Context

Every scene so far is rendered once per language from a per-language text table, and carries a caption by default (ADR 0003). Two scenes mean four videos to render, review and host, and every new article multiplies that. The articles and their body diagrams are already translated and carry the technical detail. On 2026-10-23 the owner approved a different direction from a spike: videos with no words on screen, told by characters, gestures and reaction symbols, with the text left to the article (brain note `brunosouzas-design-system/evidence/2026-10-23-elenco-e-emotes.md`; motion test `~/.hermes/spikes/motion/cast-motion-test/`, 12 s, approved).

## Options considered

1. **Keep localised videos with captions.** Exact, but the cost grows with every scene and language, and a caption repeats what the article next to it already says.
2. **Neutral videos by default, with a fixed cast and a fixed gesture vocabulary.** One file serves both pages; the story is carried by who acts and how. Risk: a silent gesture can be misread, or claim something the article does not say.

## Decision

Option 2.

- **Neutral by default.** A scene is one video for the Portuguese and English pages, with no words on screen. On-screen text is allowed only when it is identical in both articles (pattern and state names, identifiers, file names, HTTP codes). A localised pair (PT and EN text tables) is the exception, used only when nothing else can say it.
- **Caption optional.** A caption is added only when the motion cannot explain itself. This replaces the caption default of ADR 0003; the scenes that already have one (circuit breaker, publish-subscribe) keep it.
- **Actions are claims.** ADR 0004 is extended from strings to actions: every gesture, reaction and event in a scene's script names the article line that supports it (a robot typing says "the AI wrote the code"). A reading device the text does not state (a fright, a rewind) is marked as such and approved by the owner.
- **One cast, one vocabulary.** The characters (Dev, AI agent, Architect, DevOps, Data, Requester, Message) and the emotes are pieces of this package (`mascot`, `emote`), and every scene uses them. Each character carries its identity in three layers (body shape, a worn mark always visible, a signature prop) so no video introduces its cast. A character's colour is its identity and never changes with state; the six colour meanings of ADR 0003 stay with state elements and with the emotes (worked green, problem and refused red). Each emote and each face keeps one meaning across all videos, like the colours. Expressions use the face and the body only; hands and feet appear only in actions. New roles are added when a video needs one, in the same three layers.
- **16:9 only.** The LinkedIn 4:5 cut is made on demand, when the owner publishes a post.
- **Storyboard before the spec.** A new scene starts with two or three storyboard concepts (key frames with the beat and the article line under each) and the owner's pick, before any OpenSpec change.

## Consequences

- One render and one review per scene instead of one per language; the catalogue keeps supporting localised scenes for the exception.
- The scene catalogue still registers one composition per language. The first neutral scene (AB#144) changes that rule in its own change; until then the cast is shown by a composition outside the catalogue, the approved motion test.
- A silent scene is checked with a blind reading (someone narrates the stills without the article) before the owner approves it. That reading is evidence, never approval.
- Videos still do not replace the static diagrams: the diagram carries the detail and the alt text.

# ADR 0005: Neutral videos, told by a fixed cast

- Status: superseded by [ADR 0007](0007-mira-and-the-pillar-cast.md) (the cast only; every other rule here is unchanged except as amended on 2026-11-09)
- Date: 2026-10-24
- Amends: ADR 0003 (the caption default), ADR 0004 (claims made by actions)
- Amended: 2026-11-09, words on screen are English (card 316; see the last section)

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
- **One cast, one vocabulary.** The characters (Dev, AI agent, Architect, DevOps, Data, Requester, Message) and the emotes are pieces of this package (`mascot`, `emote`), and every scene that needs characters or reactions uses them. Existing scenes (circuit breaker, publish-subscribe) stay as they are. Each character carries its identity in three layers (body shape, a worn mark always visible, a signature prop) so no video introduces its cast. A character's colour is its identity and never changes with state; the six colour meanings of ADR 0003 stay with state elements and with the emotes (worked green, problem and refused red). Each emote and each face keeps one meaning across all videos, like the colours. An emote sits beside the head, never over the face, at about the head's size; it pops in on the frame the face changes, only one is on screen at a time, and it leaves before the next one comes. Expressions use the face and the body only; hands and feet appear only in actions. New roles are added when a video needs one, in the same three layers. No character hue sits next to a state colour (DevOps is magenta, not orange). Technologies (an IDE, a cloud, a CI server) appear only as generic props or accents on a character, never as a new character or a recoloured one. Each character also has a temperament that guides storyboards: Dev curious, Agent quick, Architect calm, DevOps energetic, Data analytical, Requester impatient, Message fast.
- **16:9 only.** The LinkedIn 4:5 cut is made on demand, when the owner publishes a post.
- **Storyboard before the spec.** A new scene starts with two or three storyboard concepts (key frames with the beat and the article line under each) and the owner's pick, before any OpenSpec change.

## Consequences

- One render and one review per scene instead of one per language; the catalogue keeps supporting localised scenes for the exception (amended 2026-11-09: only the two existing localised scenes).
- The scene catalogue still registers one composition per language. The first neutral scene (AB#144) changes that rule in its own change; until then the cast is shown by a composition outside the catalogue, the approved motion test.
- A silent scene can be misread. A blind reading (someone narrates the stills without the article) is a useful check to show the owner, as evidence, never as approval; it is not a required step.
- Videos still do not replace the static diagrams: the diagram carries the detail and the alt text.
- The cast motion test is a proof of the cast, not an article scene: it keeps its approved 12 s timing, whose last second still breathes and blinks, and is exempt from ADR 0003's three-second still final frame. Article scenes keep that rule.

## Superseded, 2026-11-05 (AB#268)

[ADR 0007](0007-mira-and-the-pillar-cast.md) replaces this ADR's cast (Dev, AI agent, Architect, DevOps, Data, Requester, Message) with Mira and four pillar characters (Visor, Drone, Kiu, Sinal), reusing only the roles whose story the new cast tells without ambiguity. Every other rule here (neutral by default, caption optional, actions are claims, one gesture vocabulary, 16:9 only, storyboard before the spec) is unchanged and still governs every scene.

## Amended, 2026-11-09: words on screen are English (card 316)

A scene still carries its message with motion and no words. When a word is truly needed on screen (a label, a state name, a caption), it is written in English, the language of the brand's channels, in the one video both the Portuguese and the English pages show. This replaces three rules above: on-screen text is no longer limited to text identical in both articles, and the localised pair (PT and EN text tables) is no longer an exception a new scene may take (in the Decision and in the first Consequence), because two videos per scene is the cost this ADR set out to remove. The scenes that already have localised versions (circuit breaker, publish-subscribe) keep them.

It applies to video the owner's rule for every image (2026-11-09, card 316, after card 307 made the share image one file per language; recorded in the illustration skill's STY-8): spot words are English in one file; a phrase or a sequence the reader follows, as in a body diagram or the share image's slogan, is written in each language. A video takes the first case: its words, if any, are few, and the article beside it carries the sentences in the page's language.

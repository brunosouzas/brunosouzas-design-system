# ADR 0004: Scenes illustrate published articles

- Status: accepted
- Date: 2026-10-22

## Context

An animation can say more than its source by accident: an extra label, a number, a step the article never describes. The blog's articles are reviewed and approved before publication; the scenes should carry the same guarantee without a second editorial review of every frame.

## Options considered

1. **Free scenes**, written for the animation. Flexible, but each scene needs its own editorial review, and claims can drift from the article.
2. **Scenes bound to a published article**: every on-screen string comes from the article or its diagram labels, kept in the scene's per-language text table.

## Decision

Option 2. A scene names its source article, and every string it shows exists in that article (or its approved diagram labels) in the same language. Movement can show what the text describes (calls accumulating, a timer running down), but never a fact the text does not state. The scene's length follows what it must show, not a platform's pacing; when an idea has no process to show, the static image is kept instead of an animation.

## Consequences

- Reviewing a scene means checking the movement and layout, not re-reviewing the content.
- Portuguese and English versions stay in step, because both come from the same text table that mirrors the two published versions.
- A scene for something not yet published waits for the article.
- Rendered videos are build outputs and are not committed; anyone can re-render them from the scene's code.

## Amendment, 2026-10-24 (AB#152)

Actions are claims too: every gesture, reaction and event in a scene names the article line that supports it ([ADR 0005](0005-neutral-videos-and-the-cast.md)). A neutral scene has no per-language text table, because it shows no words.

## Amendment, 2026-10-30 (AB#234)

The design system is used beyond the blog: other sites, LinkedIn posts, pages. The guarantee stays and its source widens. A scene or piece (here: an image or video made with the system outside the catalogue, for a LinkedIn post or a page; not a drawing function of `src/pieces/`) shows only words, facts and actions that come from an **approved source**: a published article of the blog (or its approved diagram labels), or a post or page the owner approved for publication. It names that source, and it never states what the source does not.

Catalogue scenes in `src/scenes/` keep illustrating published articles until a change to the `scene-catalogue` spec says how another source is named there. Two consequences above now apply to catalogue scenes only: a scene for something not yet published waits for the article, and the Portuguese and English versions mirror the two published versions. A piece for an approved post or page can exist in the language of its source only. Outside the catalogue, ADR 0005's "article line" reads as the line of the approved source.

## Amendment, 2026-11-12 (AB#144)

The 2026-10-24 amendment says "a neutral scene has no per-language text table, because it shows no words". Since [ADR 0005](0005-neutral-videos-and-the-cast.md)'s amendment of 2026-11-09, a neutral scene may show a few words when they are truly needed, in English, in the one video both pages show. Such a scene keeps those words in one English table (`text.en`) and names both pages as its sources (`sources.pt`, `sources.en`); it has no Portuguese table. Every word comes from the published article, and the table is where the review finds every word the scene shows. The catalogue checks this shape (change `scene-takes-infrastructure`). Which words a given scene may show, and whether a reading device (a take number, a stamp's word) may be one of them, is decided with that scene, not here.

This records a decision ADR 0005 already took, so it is an amendment and not a new ADR. The localised scenes (circuit breaker, publish-subscribe) keep their per-language tables.

## Amendment, 2026-11-12 (AB#334)

The take numbers `1` and `2` are reading devices, not article words: they tell the viewer which run of the stage is playing. The owner allowed them for every scene of the `takes` kind (G1 of change `circuit-breaker-topology-scene`, question 2), so a `takes` scene may show them in its `text.en` table (`takes: ["1", "2"]`) without an article line; the phase where a take number first appears and the phase where it changes list `takeNumbers` among their devices. Every other word still comes from the article. The first scene to use this is `circuit-breaker-topology`.

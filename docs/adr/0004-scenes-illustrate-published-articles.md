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

The design system is used beyond the blog: other sites, LinkedIn posts, pages. The guarantee stays and its source widens. A scene or piece shows only words, facts and actions that come from an **approved source**: a published article of the blog (or its approved diagram labels), or a post or page the owner approved for publication. It names that source, and it never states what the source does not.

Catalogue scenes in `src/scenes/` keep illustrating published articles until a change to the `scene-catalogue` spec says how another source is named there. Two consequences above now apply to catalogue scenes only: a scene for something not yet published waits for the article, and the Portuguese and English versions mirror the two published versions. A piece for an approved post or page can exist in the language of its source only. Outside the catalogue, ADR 0005's "article line" reads as the line of the approved source.

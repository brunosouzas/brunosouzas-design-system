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

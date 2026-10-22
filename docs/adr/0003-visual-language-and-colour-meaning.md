# ADR 0003: Visual language and fixed colour meanings

- Status: accepted
- Date: 2026-10-22

## Context

The blog's covers and body diagrams already follow one style, modelled on the illustration covers of the Spotify Engineering blog: flat shapes, a thick dark ink outline, a hard offset shadow, saturated colours on a calm page. The motion pilot carried the style into animation and the author approved it. Readers of several articles benefit when a colour always means the same thing.

## Options considered

1. **Free palette per scene.** Each scene picks the colours that look best for its topic. More variety, but the reader relearns the code every time and scenes stop looking like one family.
2. **Fixed style and fixed colour meanings**, with per-scene freedom only in composition, objects and movement.

## Decision

Option 2.

- Shapes are flat, with an ink outline (`#0A1033`) and a hard offset shadow drawn in the same ink. No blur, no gradients.
- Colours keep one meaning everywhere: green healthy or normal, orange blocked or fail-fast, yellow transitional, light blue caller, coral backend, red the failure path. White and ink are neutral.
- Small elements inside a coloured block use ink or white, never the block's own hue.
- Type is Lato (bold and black weights); code identifiers use the monospace stack. Text is never rotated.
- In animation, a bottom caption with the article's sentence for the current state is the default, and the last frame holds still for at least three seconds.

## Consequences

- New scenes start from the existing components and tokens, which makes them faster to build and review.
- A topic that needs a colour outside the code (a platform's brand colour) uses it only for that external system, as the static diagrams already do.
- The caption is a deliberate difference from the static diagrams, which carry no caption: a video often plays muted, and the caption explains what is moving.

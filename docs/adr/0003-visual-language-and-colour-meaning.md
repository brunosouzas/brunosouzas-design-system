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
- Type is Lato (bold and black weights); code identifiers use the monospace stack.
- In animation, a bottom caption with the article's sentence for the current state is the default, and the last frame holds still for at least three seconds.

## Consequences

- New scenes start from the existing components and tokens, which makes them faster to build and review.
- A topic that needs a colour outside the code (a platform's brand colour) uses it only for that external system, as the static diagrams already do.
- The caption is a deliberate difference from the static diagrams, which carry no caption: a video often plays muted, and the caption explains what is moving.

## Amendment, 2026-10-23 (AB#139)

The rule "text is never rotated" is removed. The published covers already turn a stamp's word with the stamp, and a fixed rule like this one limits the drawing more than it helps the reader. Whether a rotated word reads well is judged by the owner when he reviews each image, like any other layout choice. The colour meanings and the outline and shadow rules are unchanged.

## Amendment, 2026-10-23 (AB#157)

On a dark surface the hard shadow is no longer drawn in the ink: ink on the dark navy disappears, so the shadow takes the surface's shadow colour (`surface.dark.shadow`) and the ink outline gets a thin light rim (`surface.dark.rim`), as stackledger's map already draws it. On a light surface nothing changes. The surface tokens hold both values; the cover pieces keep the ink shadow. The colour meanings are unchanged; a map's line colours come from its catalogue, like the external brand colours above.

## Amendment, 2026-10-23 (AB#167)

A metro map marks a station's state with small markers, and they keep the meanings above. A held licence is green (normal: the licence is in place), and a licence still to buy is the empty white disc. A renewal due within 30 days is an orange ring, because the item will block if nothing is done. Before this, stackledger drew a held licence in yellow, a meaning ("transitional") that does not fit holding a licence. The six meanings are unchanged.

## Amendment, 2026-10-24 (AB#152)

The caption is no longer the default in animation: [ADR 0005](0005-neutral-videos-and-the-cast.md) makes new videos language-neutral, with a caption only when the motion cannot explain itself. The scenes that have one keep it. The three-second still final frame stays for article scenes. The cast's colours are identities, not states, and never take a state colour's hue.

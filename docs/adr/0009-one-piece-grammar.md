# ADR 0009: One piece grammar

- Status: accepted
- Date: 2026-11-06
- Supersedes: the outline and shadow values of ADR 0003 and ADR 0006 ("keep their exact values", "nothing published changes appearance"), and the dark-surface rim of cards 167 and 187

## Context

ADR 0003 made the style "flat shapes, ink outline, hard offset shadow" and ADR 0006 kept those values exact so nothing published would change. The identity studio (epic AB#263) then drew a new cast in a different grammar: flat shapes, one rounded ink outline, no hard shadow, white bodies, one accent, colour only when it means something. With 0.6.1 the package held two grammars: the cast in the new one, the 26 cover pieces and the diagram pieces in the old one (navy ink, blue accent, hard shadows, saturated defaults). The owner asked that every piece go through the grammar of the new cast, and approved the redraws from a preview of every piece on both surfaces (card 301).

## Options considered

1. **Keep two grammars.** The cast in the new one, the other pieces as published. No published image changes, but a cover mixing Mira and a gear reads as two styles.
2. **Tokens only.** Move the colour and shadow values to v2 and leave the drawings. Fast, but the saturated defaults (a green robot, a coral server stack, yellow gears) and the literal shadow offsets in code stay.
3. **One grammar at the token and code layers.** v2 values in the tokens, then each piece redrawn where its defaults or literals break the rules, with a test that checks every piece's colours.

## Decision

Option 3.

- **No hard offset shadow.** `shadow.block`, `shadow.pill`, `shadow.small` and `map.shadow` are 0, and no piece passes a literal offset of its own. `shadowed()` and the sticker draw no shadow copy at offset 0, so an output carries no hidden node.
- **White bodies, one accent.** A piece's default body is `color.white` with neutrals from `brand.light.*`; the one accent is `brand.light.accent` (`#E04E17`, `illustration.accent`). Ink is `#121212`, the diagram panel `#F6F3EC`, the rings `#EDE8DE`.
- **Colour only where it means something.** A state colour stays in a piece's default output only where it means that state: `checkBadge` and the sheet's tail check (done), `stamp`'s default face (approved), the failing light of `serverStack`, the emotes `problem` and `refused` (failure) and `worked` (done), `renewalRing`'s inner band (renewal due), an owned `licenceMark`, and the published EIP notation in `eipIcon` and `nameTag`. A colour a spec passes explicitly is still drawn.
- **The dark ink rule.** On the dark surface, an ink stroke on the dark background or on a dark face takes `surface.dark.muted` instead of ink (the cast's rule: ink vanishes on black); `surface.dark.rimWidth` is 0, so the light rim of cards 167 and 187 is off. Marks drawn over a light or state fill, and marks inside a piece's own ink face, stay ink.
- **The palette check.** `test/pieces/palette.test.ts` walks every piece's default output, on both surfaces where it takes one, against one allowlist compared as hex: every `brand.*` and `surface.*` value of either theme, `color.white`, `color.ink`, `color.ring`, `color.panel`, every `illustration.*` value and `cast.eyes`, plus the named state colours above. A new piece that paints a decorative state colour fails it.

The six state meanings of ADR 0003 and their hex values are unchanged, now only at `color.state.*`.

## Consequences

- Every published image changes appearance when its spec is rebuilt on 0.7.0; the owner reviews the renders before release instead of hashes, and the goldens are regenerated once.
- A cover reads as one family: the cast, the bank objects (now with the cast's idle eyes, ADR 0007 as amended) and the cover pieces share one outline, one accent and white bodies.
- stackledger's map turns to the v2 palette when it adopts 0.7.0 and passes its own line colours (AB#303).
- The palette check makes the grammar a test, not a review comment.

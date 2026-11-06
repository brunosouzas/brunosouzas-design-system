# Neutral cover background (card 299)

## Problem

0.6.0 gives every cover the background of its track (`trackIntegration`, `trackDelivery`, `trackAi`; ADR 0006). The site has a fourth category, Personal tools, that is not a track and has no track colour (design of the identity v2 change, decision 4). Its two published covers cannot be rebuilt on the new backgrounds, and the 21 literal pairs they use today go away in 0.7.0.

## What changes

- `coverBackground.neutral`: fill `#F6F3EC` (the value of `brand.light.bg`), ring `#D8D6D0` (the fill mixed 12% toward black, the rule of the track rings). Usable as the `background` of any cover, banner, LinkedIn card or og spec, like the track entries.
- README: the `background` field lists the track pairs, `neutral` and the 21 legacy pairs.
- Release 0.6.1 (patch: one new token entry, nothing changes for an existing spec).

## Out of scope

- Any other colour: `neutral` reuses the measured brand background; no new role in `brand.*`.
- Retiring the 21 literal pairs: 0.7.0, after the published covers are rebuilt.

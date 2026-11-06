## ADDED Requirements

### Requirement: Neutral cover background
`coverBackground` SHALL have a `neutral` entry whose `fill` equals `brand.light.bg` and whose `ring` is that fill mixed 12% toward black (`#D8D6D0`), usable as a spec's `background` like any other entry, for a cover of a category with no track.

#### Scenario: Neutral background equals the brand background
- **WHEN** the tokens are built
- **THEN** `coverBackground.neutral.fill` equals `brand.light.bg` and `coverBackground.neutral.ring` is `#D8D6D0`

#### Scenario: Neutral background accepted
- **WHEN** a cover spec has `background: "neutral"`
- **THEN** the command writes the cover with the fill and ring colours of `coverBackground.neutral`

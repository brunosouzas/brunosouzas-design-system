## ADDED Requirements

### Requirement: Track cover backgrounds
`coverBackground` SHALL gain three entries, `trackIntegration`, `trackDelivery`, `trackAi`, each with `fill` and `ring` (`color`) aliasing `color.brand.light.track*`, usable as a cover, banner or diagram spec's `background` like any existing entry. The 21 existing literal entries SHALL remain accepted for this release.

#### Scenario: Track background accepted
- **WHEN** a cover spec has `background: "trackIntegration"`
- **THEN** the command writes the cover with the background fill and ring colours of `coverBackground.trackIntegration`

#### Scenario: Old literal backgrounds still accepted
- **WHEN** a cover spec has `background: "peach"` (an existing entry)
- **THEN** the command still writes the cover exactly as before this change

### Requirement: Signature lockup
A `cover`, `banner`, `icon` format `favicon` and `icon` format `avatar` output SHALL accept an optional `signature: true` top-level key, which adds the Mira-and-symbol lockup in the frame's fixed corner, drawn after every other piece and before the label group.

#### Scenario: Signature drawn
- **WHEN** a cover spec has `signature: true`
- **THEN** the written SVG's outlined group ends with a group holding both the `mira` piece at its smallest size and the symbol, positioned in the same corner on every build

#### Scenario: No signature by default
- **WHEN** a cover spec omits `signature`
- **THEN** the written SVG is unchanged from this change (no signature group)

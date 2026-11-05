## ADDED Requirements

### Requirement: Track cover backgrounds
`coverBackground` SHALL gain three entries, `trackIntegration`, `trackDelivery`, `trackAi`, each with `fill` and `ring` (`color`) aliasing `brand.light.track*`, usable as a cover, banner or diagram spec's `background` like any existing entry. The 21 existing literal entries SHALL remain accepted for this release.

#### Scenario: Track background accepted
- **WHEN** a cover spec has `background: "trackIntegration"`
- **THEN** the command writes the cover with the background fill and ring colours of `coverBackground.trackIntegration`

#### Scenario: Old literal backgrounds still accepted
- **WHEN** a cover spec has `background: "peach"` (an existing entry)
- **THEN** the command still writes the cover exactly as before this change

### Requirement: Signature lockup
A `cover` or `banner` output, and a `favicon` or `avatar` icon output (see "New icon formats"), SHALL accept an optional `signature: true` key, adding the Mira-and-symbol lockup after every piece and before the labels, anchored to the frame's bottom-right corner by `cover.signatureMargin` from both edges, with `mira` at `scale: 0.25`.

#### Scenario: Signature drawn
- **WHEN** a cover spec has `signature: true`
- **THEN** the written SVG's outlined group ends with a group holding both the `mira` piece at `scale: 0.25` and the symbol, its bounding box's right and bottom edges `cover.signatureMargin` from the frame's right and bottom edges

#### Scenario: No signature by default
- **WHEN** a cover spec omits `signature`
- **THEN** the written SVG is unchanged from this change (no signature group)

### Requirement: New icon formats
`format` SHALL accept `favicon` (one SVG switching the symbol's fill by `prefers-color-scheme`, plus PNGs at 16/32/48/180/192/512 px beside it), `linkedin-card` (1080×1080, cover frame conventions) and `avatar` (500×500, symbol only, no background). A generic Open Graph image is a `banner`-format spec, not a new enum value.

#### Scenario: Favicon writes SVG and PNG set
- **WHEN** a spec with `format: "favicon"` is built with `--out icons/favicon.svg`
- **THEN** the command writes `icons/favicon.svg` (with the `prefers-color-scheme` style block) and `icons/favicon-16.png` through `icons/favicon-512.png` for every listed size

#### Scenario: LinkedIn card is square
- **WHEN** a spec with `format: "linkedin-card"` is built
- **THEN** the written SVG has `width="1080" height="1080" viewBox="0 0 1080 1080"`

#### Scenario: Avatar refuses a background
- **WHEN** a spec with `format: "avatar"` has `background: "trackIntegration"`
- **THEN** it is reported as "not used by the avatar format", the command exits 1 and writes nothing

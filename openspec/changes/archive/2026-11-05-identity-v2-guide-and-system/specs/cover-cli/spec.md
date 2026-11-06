## ADDED Requirements

### Requirement: Track cover backgrounds
`coverBackground` SHALL gain three entries, `trackIntegration`, `trackDelivery`, `trackAi`: `fill` equal to `brand.light.track*`, `ring` that fill mixed 12% toward black, usable as the `background` of a cover, banner, LinkedIn card or og spec like any existing entry. The 21 existing literal entries SHALL remain accepted for this release.

#### Scenario: Track background accepted
- **WHEN** a cover spec has `background: "trackIntegration"`
- **THEN** the command writes the cover with the background fill and ring colours of `coverBackground.trackIntegration`

#### Scenario: Old literal backgrounds still accepted
- **WHEN** a cover spec has `background: "peach"` (an existing entry)
- **THEN** the command still writes the cover exactly as before this change

### Requirement: Signature lockup
A `cover`, `banner`, `linkedin-card` or `og` spec SHALL accept an optional boolean `signature`; `true` adds the Mira-and-symbol lockup after every piece and before the labels, anchored to the frame's bottom-right corner by `cover.signatureMargin` from both edges, with `mira` at `scale: 0.25`. A `diagram`, `favicon` or `avatar` spec refuses the key; an `icon` spec draws no signature.

#### Scenario: Signature drawn
- **WHEN** a cover spec has `signature: true`
- **THEN** the written SVG's outlined group ends with a group holding both the `mira` piece at `scale: 0.25` and the symbol, its bounding box's right and bottom edges `cover.signatureMargin` from the frame's right and bottom edges

#### Scenario: No signature by default
- **WHEN** a cover spec omits `signature`
- **THEN** the written SVG is unchanged from this change (no signature group)

### Requirement: New icon formats
`format` SHALL accept `favicon` (the symbol, both themes, no `pieces`), `linkedin-card` (1080×1080, cover frame conventions), `og` (1200×630, cover frame conventions, the site's generic social-preview image) and `avatar` (500×500, the symbol on a square of `brand.light.accentText`; the `background` and `pieces` keys are refused). This command writes SVG only; a PNG set (favicon sizes, social previews) is the consuming site's build step.

#### Scenario: Favicon is the symbol, both themes, no pieces
- **WHEN** a spec with `format: "favicon"` is built
- **THEN** the written SVG is 32×32, holds a light-theme symbol group and a dark-theme symbol group with a `<style>` block switching them by `prefers-color-scheme`, and a `pieces` array in the spec is rejected (`"not used by the favicon format"`)

#### Scenario: LinkedIn card and og image are fixed sizes
- **WHEN** a spec with `format: "linkedin-card"` is built
- **THEN** the written SVG has `width="1080" height="1080" viewBox="0 0 1080 1080"`
- **WHEN** a spec with `format: "og"` is built
- **THEN** the written SVG has `width="1200" height="630" viewBox="0 0 1200 630"`

#### Scenario: Avatar refuses a background and pieces
- **WHEN** a spec with `format: "avatar"` has `background: "trackIntegration"` or a non-empty `pieces`
- **THEN** each is reported as "not used by the avatar format", the command exits 1 and writes nothing

## MODIFIED Requirements

### Requirement: Cover spec format
A spec SHALL be a JSON object with `id` (safe slug), `title` and `description` (non-empty strings), optional `format` (`cover`, `banner`, `diagram`, `icon`, `favicon`, `linkedin-card`, `og`, `avatar`; default `cover`), and the keys its format allows: `background`, `rings` (`cx`, `cy`, optional `radius`), `pieces`, `custom`, `customAt`, `height`, `text`, `signature`. Each format's requirement says which it refuses or needs. Any other top-level key is an error.

#### Scenario: Unknown background and piece
- **WHEN** a spec has `background: "pink"` and a piece `{ "piece": "rocket" }`
- **THEN** both are reported, `background` before `pieces[0].piece`, the second listing the 63 piece names

#### Scenario: Unsafe id
- **WHEN** `id` is `../sdd` or `SDD`
- **THEN** `id` is reported as not a safe slug

#### Scenario: Invalid JSON
- **WHEN** the spec has a trailing comma
- **THEN** the command prints the parser's line and column, exits 1 and writes nothing

#### Scenario: Unknown format
- **WHEN** a spec has `format: "poster"`, or `format: 1`
- **THEN** exactly one problem is printed for `format`: "expected one of cover, banner, diagram, icon, favicon, linkedin-card, og, avatar", the command exits 1 and writes nothing

#### Scenario: Ring count in a spec
- **WHEN** a cover, banner or diagram spec has `rings.count: 30`
- **THEN** `rings.count` is reported as "unknown parameter: the ring count comes from the format"

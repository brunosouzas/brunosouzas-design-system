# ADR 0006: Three-layer tokens and the brand colour system

- Status: accepted
- Amended by [ADR 0009](0009-one-piece-grammar.md) (outline, shadow and component values; the state duplicates removed), on 2026-11-06 by the owner's track families, and on 2026-11-06 by the site palette on the brand roles (see the last sections)
- Date: 2026-11-05
- Supersedes: ADR 0003 (colour meaning)

## Context

ADR 0003 gave the package one flat token list: the style (ink outline, hard shadow) and six colour meanings (healthy, blocked, transitional, caller, backend, failure/failFast), each a literal entry under `color`. That list served the technical-diagram identity well, but the visual identity redesign of 2026-11 (epic AB#263, phases 1-4: `10-personal/projects/brunosouzas-design-system/evidence/`, strategy decisions E1-E12, identity studio decisions I1-I13) produced a second, richer colour system — a brand/site palette with measured AA contrast in both themes, three content-pillar track colours, and a cast skin — with no shared architecture to the first one. Carrying both forward as separate flat lists would leave the design system describing two unrelated colour models side by side, which the owner rejected ("estamos reestruturando... devemos mudar o que for necessário para seguir o novo padrão").

## Options considered

1. **Leave `color.*` untouched, add the brand tokens as a second flat group.** Cheapest, but the package keeps two colour systems with no shared rule, and does not reflect that the whole visual identity was redesigned with one method.
2. **Layer only the new brand tokens** (primitive → semantic → component), leaving the diagram-state tokens flat. Half the system gets the new discipline, half does not.
3. **One three-layer architecture for the whole package.** Primitives are the raw hex values; semantic tokens give them a role (a new top-level `brand.*` group for the site/brand chrome, `color.state.*` for diagram/scene states); component tokens alias a semantic role for one specific use (`coverBackground.trackIntegration`, `cover.signatureMargin`, `cast.eyes`).

## Decision

Option 3. The existing diagram-state values (`color.healthy` `#3DDC84`, `blocked` `#FF8A3D`, `transitional` `#FFD25A`, `caller` `#8FB2FF`, `backend` `#FF6B6B`, `failure` `#E04848`, `failFast` `#E0661F`) keep their exact hex and meaning — nothing published (28 diagrams, two approved scenes) changes appearance — and move into the architecture as `color.state.*`, a literal duplicate kept at the original `color.*` path for one release (removed in 0.7.0, once every consumer reads the new path; the token build has no alias mechanism, so the two paths hold the same value, checked by a test).

**A three-segment limit shaped this ADR.** The token build (`scripts/tokens.ts`) caps every path at a top-level group, one optional sub-level of groups, then a token — three segments at most (`color.ink`, `motion.pop.damping`; never a fourth). A brand role nested as `color.brand.light.bg` would be four segments and is invalid. The brand roles get their own **top-level** group instead, `brand`, with `light`/`dark` sub-groups — exactly the shape `surface` already has (`brand.light.bg`, `brand.dark.bg`, and so on), not nested under `color`.

The new brand semantic roles, measured in the identity studio with WCAG AA confirmed in both themes (`10-personal/projects/brunosouzas-design-system/evidence/2026-11-05-estudio-identidade-v2.md`):

| Role (`brand.<light\|dark>.*`) | Light | Dark | For |
|---|---|---|---|
| `bg` | `#F6F3EC` | `#121110` | page background |
| `cardBg` | `#FFFFFF` | `#1D1C1A` | cards, code panels |
| `text` | `#121212` | `#F1EEE8` | text, ink of the drawings |
| `textMuted` | `#5C5852` | `#ADA79D` | secondary text; cast outline on dark |
| `border` | `#D7D1C5` | `#3B3834` | decorative border only |
| `borderStrong` | `#5C5852` | `#ADA79D` | meaningful border |
| `accent` | `#E04E17` | `#FF7A45` | the one accent: charts, the hood tip, large text |
| `accentText` | `#B83A0C` | `#FF7A45` | link and small text on the accent |
| `onAccent` | `#FFFFFF` | `#121110` | text over the accent |
| `success` | `#2B7A4B` | `#5BBF86` | success, done |
| `failure` | `#A1124B` | `#FF6696` | failure, dead letter |
| `warning` | `#8F5F00` | `#EBB34B` | waiting, retry |
| `trackIntegration` | `#F4E4D8` | `#2A1C15` | cover/track background, integration pillar |
| `trackDelivery` | `#DFE8E1` | `#18231D` | cover/track background, delivery pillar |
| `trackAi` | `#E2E4EC` | `#1B1F28` | cover/track background, AI pillar |

`cardBg` is named deliberately unlike the phase-3 note's own word for it ("surface"), because the package already has an unrelated top-level `surface.*` group (the map/diagram background); the two must not read as the same thing in the generated CSS (`--ds-brand-light-card-bg` vs `--ds-surface-light-background`).

**The cast's skin needs only one new token.** The same three-segment limit, plus the fact that the identity sheet gives every character (Mira and all four pillar characters) the same skin, means there is no per-character or per-theme cast colour group at all: body is the existing `color.white`; outline and visor are not tokens — each piece reads them itself from its own `surface` parameter, exactly as the existing surface-aware map/diagram pieces (`zone`, `stationMarker`) already branch between `surface.light.*` and `surface.dark.*` in code rather than taking a token-path parameter. Outline is `brand.light.text`/`brand.dark.textMuted`, so limbs stay visible on black. Visor is `brand.light.text`/`brand.dark.bg` — not the mirror of outline: the approved sheets draw the screen face near-black in both themes (contrast against the white body), and `brand.dark.text` (the light cream colour) would look wrong there. The only new cast token is `cast.eyes` (`#FFC98A`, shared, both themes, 12.5:1 over the visor).

`accent` at `#E04E17` on the light background is 3.59:1 — enough for graphics and large type, not small text, which uses `accentText` (5.19:1) instead; every other pair in the table clears 4.5:1 (text) or 3:1 (graphics/large text) in both themes.

Cover backgrounds are a component token, not a new concept: `coverBackground` already resolves a cover's `background` field (`src/pieces/cover.ts`); this ADR adds `trackIntegration`/`trackDelivery`/`trackAi` entries (fill/ring, literal values matching the track roles above) beside the 21 existing literal pairs from the per-article era, which stay for one release so already-published cover specs still build until they are rebuilt on a track background.

## Consequences

- One colour architecture, not two: a future addition (a new state, a new brand role, a new track) always answers "which layer, and is it a new top-level group or a component alias" the same way, bounded by the three-segment path limit.
- Nothing published breaks: diagrams, scenes and the two approved motion pilots keep their exact pixels; only their token's path gains a duplicate.
- The 21-pair literal `coverBackground` bank and COV-4 (the illustration skill's "never share a background within 9 places" rule) are retired once the published covers are rebuilt on track backgrounds (AB#268, task 7.2); until then both still work.
- A future theme or sub-brand (a product's own accent, per the brand strategy's "what a product gains") is a new value at the semantic layer, never a new flat list.

## Amended, 2026-11-06 (card 301)

[ADR 0009](0009-one-piece-grammar.md) moves the outline, shadow and component values to the v2 grammar, so published images change appearance when rebuilt (the owner reviews the renders): ink, panel and rings take `brand.light.*` values, the shadows are 0. As planned above, 0.7.0 removes the duplicate state paths (`color.healthy` … `color.failFast`; only `color.state.*` remains), the 21 literal `coverBackground` pairs (the four track and neutral pairs remain) and the seven-role `cast.*` colours; the state hex values and meanings are unchanged.

## Amended, 2026-11-06: track pairs become track families (owner decision)

After seeing the 0.7.0 renders, the owner found that the pale track tints of the table above (`#F4E4D8`, `#DFE8E1`, `#E2E4EC`, beside the cream `neutral`) read as one colour side by side: the covers did not look like a system with a colour palette. He chose, from renders, a family of tones per track (option C): each track has a default `track<Name>` and named tones `<track><Tone>`, and each article picks one tone of its track, so a series varies and the track stays recognisable. A fourth track, personal tools, joins (`trackPersonal`); `neutral` stays for a cover with no track. The rows of the table above are the 0.6.x values, kept as history.

| Track | `coverBackground` name | Tone | Fill | Ring |
|---|---|---|---|---|
| Integration | `trackIntegration` | peach, default | `#F7C6A1` | `#E3AB84` |
| Integration | `integrationClay` | clay | `#E9CDBE` | `#D3B3A3` |
| Integration | `integrationSand` | sand | `#EED7A8` | `#D8BF8C` |
| Delivery | `trackDelivery` | sage, default | `#B9DEC3` | `#98C6A5` |
| Delivery | `deliveryMint` | mint | `#A9DCD6` | `#88C4BD` |
| Delivery | `deliveryOlive` | olive | `#D3DFA8` | `#B9C78A` |
| AI | `trackAi` | periwinkle, default | `#C5CDF2` | `#A5AEDA` |
| AI | `aiSky` | sky | `#B5D5F2` | `#94BBDE` |
| AI | `aiLilac` | lilac | `#DCC7F0` | `#C3A9DC` |
| Personal tools | `trackPersonal` | butter, default (new) | `#F4DD8E` | `#DDC46C` |
| Personal tools | `personalRose` | rose | `#F5C9DA` | `#E0ABC0` |
| no track | `neutral` | cream (unchanged) | `#F6F3EC` | `#D8D6D0` |

- `brand.light.trackIntegration`, `trackDelivery` and `trackAi` take the default fills (`#F7C6A1`, `#B9DEC3`, `#C5CDF2`); `brand.light.trackPersonal` is `#F4DD8E` and `brand.dark.trackPersonal` `#29240F` (dark butter). The dark track roles keep their values.
- Rings are the values the owner approved with each fill, not the 12% mix of 0.6.x; `neutral` keeps its mix. Every name stays within the three-segment limit (`coverBackground.<name>.fill`).
- `color.ink` is at least 11.9:1 on every fill and `surface.light.muted` at least 4.5:1 (lowest on `trackAi`); the full table is in the change `identity-v2-type-pieces-cleanup`, `design.md` Decision 6.
- Body diagrams stay on `surface.light.background` (the cream page); the two approved Remotion scenes do not change; `illustration.tape` keeps `#F4E4D8` and no longer equals a track role.
- Which article takes which tone is the `illustration` skill's rule, not the package's.

## Amended, 2026-11-06: the site palette on the brand roles (card 302)

`site.light.*` and `site.dark.*` held the palette measured from brunosouzas.com's Astroplate theme before the redesign, so the site could not follow the brand. They become the site's component layer over the semantic roles above: the names stay (the site's theme and stackledger read `--ds-site-*`), and each value is the brand role it stands for, written as a literal and checked equal by a test, as the state duplicates were.

| `site.<theme>.` | Brand role |
|---|---|
| `primary`, `dark`, `text`, `textDark` | `text` |
| `body` | `bg` |
| `light` | `cardBg` |
| `border` | `border` |
| `textLight` | `textMuted` |
| `link` (new) | `accentText` |

`site.font.mono` (Source Code Pro) joins the site's fonts. The owner approved the mapping from renders of the site (AB#302, Q1). Text, muted text and links reach at least 5.19:1 on the page and the card backgrounds in both themes; the token test checks a 4.5:1 floor.


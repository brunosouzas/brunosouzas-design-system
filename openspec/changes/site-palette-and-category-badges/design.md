# Design: site palette on the brand roles, category badges

The owner approved the site's colour mapping, the category badge and the version on 2026-11-06 (AB#302, questions Q1, Q2 and Q7), from renders of a local site build and of the badges drawn with the 0.7.0 pieces. Evidence: `~/.hermes/cache/scratch/ab302/q/` (`q-cores.png`, `q-link.png`, `q-categorias.png`; the badge preview's source is `~/.hermes/cache/scratch/ab302/cat/cat.mjs`).

## Decision 1: `site.*` keeps its role names, its values become brand roles

Options considered:

1. **Remove `site.<theme>.*` and have the site read `brand.*`.** This leaves one name per colour. It breaks stackledger's CSS, which reads every `--ds-site-*` colour, and the Astroplate classes the site's markup uses (`bg-body`, `text-text-light`, `border-border`) would need a rename pass in both consumers.
2. **Keep the names and change the values (chosen).** `site.*` becomes the site's component layer of ADR 0006: each token names a role in the site's theme and holds the brand role it stands for. Consumers keep their CSS. The token build has no alias, so each value is written as a literal, and the token test's mapping check confirms it equals its brand role (as ADR 0006 did for `color.state.*`).

| `site.<theme>.` | Brand role | Light | Dark |
|---|---|---|---|
| `primary` (buttons) | `text` | `#121212` | `#F1EEE8` |
| `body` (page) | `bg` | `#F6F3EC` | `#121110` |
| `border` | `border` | `#D7D1C5` | `#3B3834` |
| `light` (cards, panels, code) | `cardBg` | `#FFFFFF` | `#1D1C1A` |
| `dark` | `text` | `#121212` | `#F1EEE8` |
| `text` (body text) | `text` | `#121212` | `#F1EEE8` |
| `textDark` (headings) | `text` | `#121212` | `#F1EEE8` |
| `textLight` (meta, quotes) | `textMuted` | `#5C5852` | `#ADA79D` |
| `link` (new) | `accentText` | `#B83A0C` | `#FF7A45` |

Contrast, WCAG 2.x, checked by the token test (requirement "Site palette contrast"). The figures on `bg` come from the identity studio (evidence note `2026-11-05-estudio-identidade-v2.md`). The figures on `cardBg` are new:

| Pair | Light on `body` | Light on `light` | Dark on `body` | Dark on `light` |
|---|---|---|---|---|
| `text` | 16.90 | 18.73 | 16.29 | 14.71 |
| `textLight` | 6.37 | 7.06 | 7.90 | 7.13 |
| `link` | 5.19 | 5.76 | 7.29 | 6.59 |

The site's primary button (`btn-primary`) is white on `primary` in light (18.73:1) and `#121212` on `primary` in dark (16.18:1). Against body text, a link is 3.25:1 in light and 2.23:1 in dark, so colour alone does not mark it (WCAG 1.4.1). The site therefore keeps its link underline, and the README says so.

**A consequence for the site (AB#302, outside this change).** With `primary` equal to `text`, a `hover:text-primary` on a text-coloured link no longer changes colour. Today the sidebar, the table of contents and the repository list do this. The site's change moves those hovers to `link`.

`site.font.mono` (`'Source Code Pro', monospace`) joins `primary` and `secondary`, so every face the site loads is named in the design system (I9). Loading the fonts is the site's job (the Astro fonts API); the token only names the family.

## Decision 2: one `categoryIcon` badge per site category

The 0.6.0 change gave `categoryIcon` only the category with no notation glyph (`personalTools`, its decision 4) and left the other three to `brandNotationIcon`. The badge the owner chose needs one piece per category for two reasons:

- an `icon` spec holds exactly one piece;
- the disc's tone belongs to the category, not to the glyph.

| `category` | Disc: fill and ring | Glyph |
|---|---|---|
| `integration` | `coverBackground.trackIntegration` (`#F7C6A1`, `#E3AB84`) | brand notation `pointToPointChannel` |
| `delivery` | `coverBackground.trackDelivery` (`#B9DEC3`, `#98C6A5`) | brand notation `gateToProduction` |
| `aiEngineering` | `coverBackground.trackAi` (`#C5CDF2`, `#A5AEDA`) | brand notation `contextWindow` |
| `personalTools` | `coverBackground.trackPersonal` (`#F4DD8E`, `#DDC46C`) | its own glyph (wrench and screwdriver, the bolt ring in `brand.light.accent`) |

**Geometry: the approved preview at a quarter of its size.** The preview is 168 × 168: a centred disc of radius 78 with a ring 4 wide, and the glyph at `translate(36 36) scale(2)`. The piece draws it in a 42 × 42 box before `scale`:

- a disc centred at 21, 21, with radius 19.5 and a ring 1 wide;
- then the glyph, on the light surface, at 9, 9 and scale 0.5.

At `scale` 4 the output matches the preview, figure for figure. Like every piece, the badge is one group, `translate(x y) scale(scale)`, that holds the circle and then the glyph's group.

**`surface` is removed.** The disc is a light tone on both themes, as a cover is, so the glyph is drawn in ink on both. Under ADR 0009's dark ink rule, marks over a light fill stay ink, so the dark surface would draw the same thing. A parameter that changes nothing was rejected. No consumer calls `categoryIcon` (checked in brunosouzas.com, brunosouzas-content, stackledger and the kit), so removing it breaks nothing that is published.

**The grammar (ADR 0009).** The disc is a background, the cover's own tone and ring, not a body. The white-body and ink-outline rules apply to the glyph on it, not to the disc. ADR 0009 gets an amendment that says so, as the owner chose in Q7.

**The palette check** gains the four default track rings: `coverBackground.trackIntegration.ring`, `trackDelivery.ring`, `trackAi.ring` and `trackPersonal.ring`. The fills are already `brand.light.track*` values. Admitting every `coverBackground.*` value was rejected: it would let any piece paint any cover tone, and only the badge draws one.

## Decision 3: the `icon` format takes `categoryIcon`

The `icon` format adds `categoryIcon` to its pieces, in a box `42 × scale` wide and high. `title` and `description` are required, as for `uiIcon` and `linkIcon`, because the badge has no data of its own to take them from. The site builds its four badges with the command at `scale` 4, like its other icons, with no script. The box size is written as JavaScript prints `42 × scale`, as the `eipIcon` box is today; rounding a fractional box is out of scope.

## Decision 4: the version is 0.8.0

The change removes a parameter (`categoryIcon.surface`) and changes every `site` colour a consumer reads, so in a 0.x package it is a minor release. The bump is its own pull request, which the owner merges.

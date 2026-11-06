# Design: site palette on the brand roles, category badges

The owner approved the site's colour mapping, the category badge and the version on 2026-11-06 (AB#302, questions Q1, Q2 and Q7), from renders of a local site build and of the badges drawn with the 0.7.0 pieces. Evidence: `~/.hermes/cache/scratch/ab302/q/` (`q-cores.png`, `q-link.png`, `q-categorias.png`).

## Decision 1: `site.*` keeps its role names, its values become brand roles

Options considered:

1. **Remove `site.<theme>.*` and have the site read `brand.*`.** This leaves one name per colour. It breaks stackledger's CSS, which reads every `--ds-site-*` colour, and the Astroplate classes the site's markup uses (`bg-body`, `text-text-light`, `border-border`) would need a rename pass in both consumers.
2. **Keep the names and change the values (chosen).** `site.*` becomes the site's component layer of ADR 0006: each token names a role in the site's theme and holds the brand role it stands for. Consumers keep their CSS. The token build has no alias, so each value is written as a literal, and a test checks that it equals its brand role (as ADR 0006 did for `color.state.*`).

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

Every pair a page uses is already measured in ADR 0006: text on bg is 16.90:1 light and 16.29:1 dark, textMuted on bg 6.37:1 and 7.90:1, accentText on bg 5.19:1 and 7.29:1. On `cardBg` the light pairs gain contrast (white is lighter than the cream page). The dark ones were not measured on `cardBg`: `#1D1C1A` is only slightly lighter than the dark `bg`, so they should stay close to the dark figures above; the token test computes all of them (task 1.3).

`site.font.mono` (`'Source Code Pro', monospace`) joins `primary` and `secondary`, so every face the site loads is named in the design system (I9). The site's font loading is the site's job (the Astro fonts API). The token only names the family.

## Decision 2: one `categoryIcon` badge per site category

The 0.6.0 change gave `categoryIcon` only the category with no notation glyph (`personalTools`, its decision 4) and left the other three to `brandNotationIcon`. The badge the owner chose needs one piece per category for two reasons:

- an `icon` spec holds exactly one piece;
- the disc's tone belongs to the category, not to the glyph.

| `category` | Disc: fill and ring | Glyph |
|---|---|---|
| `integration` | `coverBackground.trackIntegration` (`#F7C6A1`, `#E3AB84`) | brand notation `pointToPointChannel` |
| `delivery` | `coverBackground.trackDelivery` (`#B9DEC3`, `#98C6A5`) | brand notation `gateToProduction` |
| `aiEngineering` | `coverBackground.trackAi` (`#C5CDF2`, `#A5AEDA`) | brand notation `contextWindow` |
| `personalTools` | `coverBackground.trackPersonal` (`#F4DD8E`, `#DDC46C`) | its own glyph (wrench and screwdriver, the bolt ring in the accent) |

Geometry, in the piece's 48 × 48 box before `scale`: a disc centred at 24, 24 with radius 22 and a ring 1.25 wide, and the glyph drawn on the light surface at scale 0.6, centred (from 9.6, 9.6). At the site's `scale` 3.5 this is the approved preview (168 × 168, radius 77, glyph at 2.1).

**`surface` is removed.** The disc is a light tone on both themes, as a cover is, so the glyph is drawn in ink on both. Under ADR 0009's dark ink rule, marks over a light fill stay ink, so the dark surface would draw the same thing. Keeping a parameter that changes nothing was rejected. No consumer calls `categoryIcon` (checked in brunosouzas.com, brunosouzas-content, stackledger and the kit), so the removal breaks nothing published.

The palette check (ADR 0009) admits every `coverBackground.*` value for this reason: a piece now draws a cover tone and its ring, which the list of ADR 0009 never had to name. The track fills are already `brand.light.track*` values.

## Decision 3: the `icon` format takes `categoryIcon`

The `icon` format adds `categoryIcon` to its pieces, in a box `48 × scale` wide and high, with `title` and `description` required (as for `uiIcon` and `linkIcon`; the badge has no data of its own to take them from). The site builds its four badges with the command like its other icons, with no script.

## Decision 4: the version is 0.8.0

The change removes a parameter (`categoryIcon.surface`) and changes every `site` colour a consumer reads, so in a 0.x package it is a minor release. The bump is its own pull request, which the owner merges.

# Proposal: stackledger-map-and-link-pieces

## Why

stackledger still draws part of its map and pages with its own code and copied values, because the design system has no piece for them. They were left out of 0.1.x as "requested by stackledger, not blocking" (`docs/roadmap.md`, Out of scope for now). The items come from the inventory (`~/.hermes/spikes/design-system/stackledger-inventory/report.md`, sections 1 and 3). Read on stackledger `main` at `8db44fe`:

| Item | Today in stackledger | Measure and colour |
|---|---|---|
| E5 renewal ring | `src/map/svg.ts:58-66` (`ring`), `:154`, legend `:190` | bands around the station: colour 3, ink 3 + 3, on dark a rim of 3 + 3 + 2; `#FF8A3D` (`color.blocked`); no shadow; radius = half the capsule + marker radius + 6 (`layout.ts:91`) |
| E4 suggested halo | `svg.ts:151-153`, legend `:187-189` | circle at halo + 3, no fill, stroke `theme.muted` 1.5, dash `4 3`; legend radius 9 |
| E6 licence marker | `svg.ts:81`, `:155`, legend `:184`; position `layout.ts:93` | disc sticker of radius 5 (10 units), face `#FFD25A` (`color.transitional`) when owned, `#FFFFFF` to buy; ink outline 3, shadow 3.5 |
| E10/E11 zone and title | `svg.ts:113-129`, `zones.ts:13`, `:35-47`, `themes.ts` | convex hull drawn with a round 32-unit stroke (circle for one point, round line for two), the zone colour in a group at 12 % (dark 22 %); title bold 13 at the title box + 13, the zone colour mixed with white by 0 (dark 0.6) |
| E27/E28/E32 UI icons | `site/src/components/ThemeSwitch.astro:8-14`, `site/src/pages/map/index.astro:25-27`, `[reports].astro` | an Astroplate sun and moon as inline SVG (`#ffffff`, `#040404`), zoom buttons as the texts `+`, `−`, `Reset`, a download button without an icon |
| E18 placeholder subtitle | `src/map/neighbourhood.ts:81-94` | an unlinked resource is a dashed muted box with its title (bold 13) and its kind (11), both muted; `nodeBlock` refuses a subtitle on a placeholder (`src/pieces/metro.ts:184`), so stackledger PR #29 lost the kind |

On the same day stackledger asked for three more things for its home page (`~/.hermes/spikes/design-system/stackledger-pieces/request-2-from-stackledger.md`): `ledgerMark` readable on a dark header, a `lineBadge` without a letter (the 12-unit letters are unreadable when the 1200 banner shrinks to a phone), and link icons in the style of brunosouzas.com's social stickers (`public/images/home/social-*.svg`, `e29b3dd`). They need the same release, so this change carries them.

## What Changes

- **`renewalRing`** (new piece): the renewal ring of E5, in `color.blocked`, as bands like a bent pipe, on a surface, at an ink scale. No shadow.
- **`suggestedHalo`** (new piece): the dashed muted circle of E4.
- **`licenceMark`** (new piece): the licence disc of E6, 10 units by default, `owned` or `toBuy`. Its own room rule: size at least 3 × outline (design §3).
- **`zone`** (new piece): paints a zone from the outline the caller gives (stackledger's convex hull) with the 32-unit round stroke and the surface's zone opacity, and an optional title at a given position.
- **`uiIcon`** (new piece) and **`UI_ICONS`** (data, like `EIP_ICONS`): sun, moon, zoomIn, zoomOut, reset, calendar and download, in a 24-unit box, one token colour.
- **`linkIcon`** (new piece) and **`LINK_ICONS`** (data): github, linkedin, email and website stickers as brunosouzas.com draws them, light and dark.
- **`nodeBlock`, `pillNode`, `hexNode`**: a `placeholder` may have a `subtitle`, drawn as stackledger draws an unlinked resource. Without one, nothing changes.
- **`lineBadge`**: `text` becomes optional. Without it, only the pill is drawn. An empty `text` is still rejected.
- **`ledgerMark`**: takes `surface`. On `dark` a light rim lines the square. `light`, the default, draws today's mark.
- **Tokens**: `map.ringWidth` 3, `map.haloWidth` 1.5, `map.licenceSize` 10, `map.zonePadding` 32, `map.zoneTitleTint` 0.6, and `surface.<s>.zoneOpacity` 0.12 and 0.22.
- **Data colours**: `zone.fill` joins `pipe.fill` and `lineBadge.fill`, because a zone's colour comes from the consumer's catalogue.
- **ADR 0003 amendment**: the map's markers get meanings in the existing code: a held licence is green (normal), a renewal ring is orange (it will block soon).
- Release: minor `0.3.0`, through `docs/release.md` (the owner tags and approves).

Every existing piece, measure, token and golden stays as it is: a call that was valid in 0.2.0 draws the same tree.

## Capabilities

### Modified Capabilities

- `illustration-pieces`: six new pieces, the placeholder subtitle, the optional badge text, the mark on a dark surface, the zone's data colour.
- `design-tokens`: the new `map` and `surface` tokens.
- `cover-cli`: the unknown-piece message lists 41 names.

## Out of scope

- The bend radius of the map's lines (AB#166): stackledger decides it with its own spike.
- stackledger's banner, drawn in stackledger with the pieces.
- The rest of the roadmap.
- Computing the zone's hull or the title's position: the caller lays out (`metro-and-diagram-pieces` design §1).
- Any change in stackledger or brunosouzas.com. Each adopts the pieces in its own card.
- Contrast checks for a data colour, as for lines today.

## Implicit requirements

- **Errors and invalid input:** requirement. Each new parameter is checked like the existing ones, and the cross-parameter limits (ring and licence room, a title without its position) throw a `RangeError` naming the parameter.
- **Limits:** requirement. Sizes stay within 10000. A zone takes from 1 to 10000 points. Positions and points are unbounded, as in 0.1.1.
- **Repetition and idempotency:** requirement. The existing "Pure pieces" holds for the new pieces.
- **Concurrency:** n/a. Pure functions.
- **Security:** requirement. The new pieces emit only the node contract's tags. The icons hold no link, no style, no script and no external URL, so a consumer can ship their SVG under a strict content policy.
- **Logs and observability:** n/a. A library without I/O.

## Documentation

- `README.md`: the six pieces, the placeholder subtitle, the optional badge text, the mark's surface and the new tokens.
- `docs/roadmap.md`: the stackledger requests move from "Out of scope for now" to a delivered row (AB#167).
- `docs/adr/0003-visual-language-and-colour-meaning.md`: the amendment on the map's markers.
- Vault: `10-personal/projects/brunosouzas-design-system/{architecture,roadmap,changelog}.md`, after the pull request is ready.

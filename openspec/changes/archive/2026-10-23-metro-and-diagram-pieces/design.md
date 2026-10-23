# Design: metro-and-diagram-pieces

## Context

stackledger 0.4.1 draws its map and page diagrams with its own code (`src/map/svg.ts`, `strip.ts`, `neighbourhood.ts`, `relations.ts`), all through one sticker helper (`src/map/ink.ts`), with values copied from brunosouzas.com in `src/map/themes.ts` and `site/src/styles/tokens.css`. The approved inventory (`~/.hermes/spikes/design-system/stackledger-inventory/report.md`) chose the pieces below. A spike (`~/.hermes/spikes/design-system/metro-pieces/spike.mts`) drew them on the node contract of `illustration-pieces`; its sheet, next to stackledger's current pages, is the gate-1 evidence.

## 1. Pieces paint; the caller lays out

stackledger already places stations, badges and boxes with its own text measurement, collision checks and truncation (`labels.ts`, `badges.ts`, `layout.ts`). Moving layout into the design system would mean a text-measurement contract both repositories must agree on, for no gain in identity. So every new piece takes explicit geometry (centre, box, ends, path) and draws exactly that. Where a width depends on text, the piece accepts `width` and only estimates one when it is missing (7.6 units per character for 12-unit bold text, 6.4 for 11-unit), so the sheet and quick uses work without a layout.

Rejected: pieces that size themselves from text (needs font metrics in a pure library; would move stackledger's layout); a React-only kit (stackledger renders SVG strings at build time and in the browser without React).

## 2. Tokens

| Token | Light | Dark | Source |
|---|---|---|---|
| `surface.<s>.background` | `#EEF2FF` | `#14215A` | `themes.ts` background |
| `surface.<s>.text` | `#0A1033` | `#EEF2FF` | text (dark `#EEF1FF` aligned, §6) |
| `surface.<s>.muted` | `#5B6694` | `#8F9BD0` | muted |
| `surface.<s>.grid` | `#E0E7FB` | `#1C2D74` | grid |
| `surface.<s>.panel` | `#FFFFFF` | `#1C2D74` | panel |
| `surface.<s>.shadow` | `#0A1033` | `#4C5CB8` | shadow colour |
| `surface.<s>.rim` | `#EEF2FF` | `#EEF2FF` | rim colour (dark `#EEF1FF` aligned) |
| `surface.<s>.rimWidth` | 0 | 1 | rim off on light, as `rim.enabled: false` |

`surface` holds exactly the entries `light` and `dark`, each with exactly these eight tokens (seven `color`, `rimWidth` `dimension`). A piece's `surface` parameter is one of those names.

`map` (all `dimension`): `outline` 3, `shadow` 3.5, `lineWidth` 12, `casing` 6, `badgeHeight` 20, `badgeTextSize` 12, `countHeight` 16, `countTextSize` 11, `stopRadius` 12, `interchangeExtra` 2, `nodeHeight` 46, `nodeRadius` 10, `edgeWidth` 2.5, `labelSize` 13. Values from `themes.ts`, `badges.ts`, `layout.ts` (stop radius = (line + casing) / 2 + 3), `neighbourhood.ts` and `relations.ts`.

`site`, from brunosouzas.com `src/styles/generated-theme.css` (commit `e29b3dd`):

| Token | Light | Dark |
|---|---|---|
| `site.<s>.primary` | `#121212` | `#FFFFFF` |
| `site.<s>.body` | `#FFFFFF` | `#1C1C1C` |
| `site.<s>.border` | `#EAEAEA` | `#3E3E3E` |
| `site.<s>.light` | `#F6F6F6` | `#222222` |
| `site.<s>.dark` | `#040404` | `#FFFFFF` |
| `site.<s>.text` | `#444444` | `#B4AFB6` |
| `site.<s>.textDark` | `#040404` | `#FFFFFF` |
| `site.<s>.textLight` | `#717171` | `#B4AFB6` |

plus `site.font.primary` `Heebo, sans-serif` and `site.font.secondary` `Signika, sans-serif` (`fontFamily`), `site.fontSize.base` 16 and `site.fontSize.baseSmall` 12.8 (`dimension`), and the heading scale in rem as `number`: `site.heading.h1` 2.985984, `h2` 2.48832, `h3` 2.0736, `h4` 1.728, `h5` 1.44, `h6` 1.2, and `h1Small` 2.6873856, `h2Small` 2.239488, `h3Small` 1.86624, `h4Small` 1.5552, `h5Small` 1.296, `h6Small` 1.08. A rem value is a `number` because the token types have no rem unit; a consumer writes `calc(var(--ds-site-heading-h1) * 1rem)`. stackledger's accent (`#000F9F`, dark `#9DA8FF`) is stackledger's own addition, not brunosouzas.com's, so it stays there (§6).

## 3. Pieces

**Parameters per piece.** `surface` (`light` default, `dark`) is accepted by `lineBadge`, `stationMarker`, `countBadge`, `nodeBlock`, `pillNode`, `hexNode` and `messageArrow`; `inkScale` (0.25 to 8, default 1) by the same pieces except `messageArrow`. `pipe` and `ledgerMark` take neither: a pipe's casing is ink on both surfaces, and the mark is the same on both. An unknown parameter is rejected as for every piece.

**The sticker.** With `o = map.outline × inkScale`, `w = rimWidth × inkScale` and `k = map.shadow × inkScale`: (1) the shape moved by (k, k), fill and stroke `surface.shadow`, stroke-width o + 2w; (2) when `rimWidth` > 0, the shape in place, fill and stroke `surface.rim`, stroke-width o + 2w; (3) the shape in place with its face fill, stroke `color.ink`, stroke-width o. Each node carries its own stroke attributes, so a piece draws the same inside any group. The cover pieces keep their shadow (`illustration-pieces`, "Hard shadow with the outline").

**Room for the outline.** The smallest dimension of every outlined shape (the `height` of a `lineBadge`, flat or not, of a `countBadge` and of a node in `normal` or `focus`; `2 × r` of a `stationMarker`) SHALL be at least 4 × o; a smaller one is rejected naming that parameter (`height` or `r`). Equality is accepted. At the default ink this is 12 (radius 6). A `placeholder` node draws a fixed 1.5 dashed stroke and no ink, so the rule does not apply to it; its height only has to be greater than 0. Where a default width depends on the text, a `height` that makes it narrower than the piece's own minimum (`width ≥ height`, `≥ 2 × height`) is rejected naming `width`: the caller passes a width with a large height.

| Piece | Parameters (defaults) | Draws |
|---|---|---|
| `lineBadge` | `x`, `y` (centre), `text`, `fill` (token or data colour), `height` (`map.badgeHeight`), `width` (≥ height; default max(30, 7.6 × characters + 18)), `flat` (false), `surface`, `inkScale` | pill sticker, radius height / 2. `flat`: only the face, inset by o / 2 on every side (rect `width − o` × `height − o`, radius `(height − o) / 2`), no shadow or rim; `inkScale` still sets o. Text in `color.white`, bold, `map.badgeTextSize`, centred, baseline y + 4.5 |
| `stationMarker` | `cx`, `cy`, `to` (point, optional), `r` (`map.stopRadius`; plus `map.interchangeExtra` when `to` is given), `state` (`normal`, `deprecated`), `surface`, `inkScale` | disc sticker; with `to` different from (cx, cy), a capsule: the closed path `M a+n L b+n A r,r 0 0 0 b−n L a−n A r,r 0 0 0 a+n Z`, where n is the unit normal × r (stackledger's `capsulePath`); with `to` equal to (cx, cy), the disc with the interchange radius. Face `color.white`, or `surface.muted` when deprecated |
| `pipe` | `d` (path data: non-empty, path characters only, starting with `M` or `m`), `fill` (token or data colour), `width` (`map.lineWidth`; greater than 0, at most 100), `casing` (`map.casing`; 0 to 50, 0 = none) | ink path at width + casing (left out when casing is 0), then the colour path at width; round caps and joins; fill none; no shadow |
| `countBadge` | `cx`, `cy`, `text`, `height` (`map.countHeight`), `width` (≥ height; default height for one character, else max(height, 6.4 × characters + 8)), `surface`, `inkScale` | sticker in `surface.panel`: a circle of radius height / 2 when width equals height, otherwise a pill (rect, radius height / 2). The shape follows the dimensions, not the text. Text in `surface.text`, bold, `map.countTextSize`, centred, baseline cy + 4 |
| `nodeBlock` | `x`, `y`, `width` (≥ 2 × height), `height` (`map.nodeHeight`), `title`, `subtitle` (optional), `state` (`normal` default, `focus`, `placeholder`), `radius` (`map.nodeRadius`; 0 to height / 2), `surface`, `inkScale` | rounded box |
| `pillNode` | as `nodeBlock`, no `radius` | box with radius height / 2 |
| `hexNode` | as `nodeBlock`, no `radius` | hexagon (x + h/2, y) (x + w − h/2, y) (x + w, y + h/2) (x + w − h/2, y + h) (x + h/2, y + h) (x, y + h/2) |
| `messageArrow` | `from`, `to` (points), `curve` (`bezier`, `straight`), `head` (true), `label` (optional), `width` (`map.edgeWidth`, 1 to 12), `surface` | see "The arrow" |
| `ledgerMark` | `x`, `y` (top left), `size` (32; 12 to 512), `line` (token, `illustration.accent`) | see "The mark" |

**Nodes.** `normal` is a sticker in `surface.panel`, title in `surface.text` (bold, `map.labelSize`) and subtitle in `surface.muted` (11); `focus` is a sticker in `color.caller` with title and subtitle in `color.ink`, as the centre item of stackledger's diagrams; `placeholder` is the shape alone, fill none, stroke `surface.muted` at 1.5 with dasharray `5 4`, no shadow or rim, the title centred at (x + width / 2, y + height / 2 + 4.5) in `surface.muted`, and a `subtitle` rejected. Text inset from the left: 12 for `nodeBlock`, height / 2 for `pillNode` and `hexNode`; title baseline y + height / 2 − 3 and subtitle y + height / 2 + 14, or the title alone at y + height / 2 + 4.5.

**The arrow.** Head length L = 5 × width and half base 2 × width (12.5 and 5 at the default). `from` equal to `to` is rejected naming `to`; so is a distance below 2 × L when `head` is true. Direction at the end: for `straight`, the unit vector from `from` to `to`; for `bezier`, (sign of to.x − from.x, 0). A `bezier` whose |to.x − from.x| is at most 2 × L is drawn `straight`, so a near-vertical arrow keeps a defined head. With a head, the path ends at the base point B = to − direction × L and the head is the polygon `to`, B + normal × 2w, B − normal × 2w, filled and stroked `surface.text` at stroke-width 1 with round joins; without a head the path ends at `to`. Bezier path: `M from C mx,from.y mx,to.y end` with mx = (from.x + to.x) / 2. The path: fill none, stroke `surface.text` at `width`, round caps. The label sits at M = ((from.x + to.x) / 2, (from.y + to.y) / 2): a rect of height 18 and width 6.4 × characters + 16 centred on M, radius 9, fill `surface.background`, stroke `surface.text` at 1.5, then the text at (M.x, M.y + 4), 11, `surface.text`, centred.

**The mark.** A group `translate(x y) scale(size / 32)` holding, in 32-unit coordinates: `rect` 0, 0, 32 × 32, radius 7, fill `color.ink`; `path` `M7 23 L14 16 L25 16`, fill none, stroke `line`, width 4.5, round caps and joins; `circle` (14, 16) r 4, fill `color.white`, stroke `color.ink`, width 2; `circle` (25, 16) r 2.6, fill `color.white`, stroke `color.ink`, width 1.6. No text. On a dark page the square keeps its ink: it stands on its own like the brunosouzas.com favicon.

Words: the pieces draw only `text`, `title`, `subtitle` and `label`, each non-empty.

## 4. Data colours

A line's colour comes from the consumer's catalogue (a journey colour in stackledger), not from the identity. `pipe.fill` and `lineBadge.fill` accept a token path or `#RRGGBB` (six hex digits, nothing else). The check is a new parameter kind, `dataColor`; `color` keeps rejecting literals. The no-colour-literals test still scans `src/pieces/`: no hex in the code. The cover command keeps rejecting a colour literal anywhere in a spec (`cover-cli`, "Colour literal anywhere"), so covers stay on tokens.

ADR 0003 already allows a colour outside the tokens for an external system (a platform's brand colour); a catalogue's line colour is the same kind of thing: the consumer's, not a meaning of the identity.

Rejected: registering stackledger's line colours as tokens (they are user data and change per catalogue); accepting any CSS colour (opens `url(` and named colours).

## 5. Catalogue sheet

The sheet adds the nine pieces in the same 240 × 240 cells, on the light surface; `PIECE_NAMES` lists 35. The light and dark sheet next to stackledger's pages stays gate evidence, not a command.

## 6. Token types

Four measured values are not positive integers: `map.shadow` 3.5, `map.edgeWidth` 2.5, `site.fontSize.baseSmall` 12.8 and `surface.light.rimWidth` 0. The `dimension` type changes from "a positive integer of pixels" to "a number of pixels from 0 to 10000 with at most two decimal places". Nothing in the existing tokens relies on the integer rule: every current dimension stays valid, and the outputs write the number as given (`3.5px`). Rejected: a new type for fractional pixels (two pixel types for one CSS unit); rounding the measures (stackledger's layout counts the 3.5 offset).

## 7. Dark-surface shadow (ADR 0003 amendment)

ADR 0003 says the hard shadow is drawn "in the same ink". On the dark navy surface an ink shadow disappears, so stackledger's map (change `map-theme-ink`, approved by the owner) draws it in `#4C5CB8` with a light rim round the outline. This change records that as an amendment to ADR 0003 (on a dark surface the shadow takes the surface's shadow colour and the outline gets a light rim; on a light surface nothing changes), in the same pull request, as the AB#139 amendment did. A new ADR is not used: ADR 0005 is reserved for the cast (AB#152).

## 8. Decisions for gate 1

1. Dark text and rim `#EEF1FF` become `#EEF2FF` (`color.panel`): one unit of green apart, invisible, and one value fewer.
2. Line colours as data colours on `pipe` and `lineBadge` only (§4).
3. `site` holds today's brunosouzas.com palette; stackledger's accent stays in stackledger.
4. `ledgerMark` as drawn in the spike (§3, "The mark").
5. `pillNode` and `hexNode` as their own pieces, as approved in the inventory, over one shared drawing function.
6. The 26 cover pieces keep their cover scale: no `surface` or `inkScale` for them.
7. `dimension` accepts 0 and two decimals (§6).
8. ADR 0003 amended for the dark-surface shadow (§7).

## 9. Risks

- stackledger's layout counts the ink (`inkOf`, `widestInk`): it must read the same values from `map` and `surface`, or obstacles and drawing drift. The adoption in stackledger should replace its constants with the tokens, not copy them again.
- A data colour with poor contrast against the white badge text is the consumer's choice; the piece does not check contrast.

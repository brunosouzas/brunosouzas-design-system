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

Common parameters of the nine pieces: `surface` (`light` default, `dark`) and, on stickers, `inkScale` (0.25 to 8, default 1), which multiplies the outline (`map.outline`), the rim width and the shadow offset (`map.shadow`), not the geometry. The sticker is: a copy of the shape moved by the offset, filled and stroked in `surface.shadow` with the outline plus twice the rim width; when `rimWidth` > 0, the shape in `surface.rim` with that same width; then the shape with its fill and an ink (`color.ink`) outline. Each node carries its own stroke attributes, so a piece draws the same inside any group.

| Piece | Parameters (defaults) | Draws |
|---|---|---|
| `lineBadge` | `x`, `y` (centre), `text`, `fill` (token or data colour), `width` (≥ height; default max(30, 7.6 × characters + 18)), `height` (`map.badgeHeight`), `flat` (false), `surface`, `inkScale` | pill sticker; `flat` draws the face only, outline kept inside the box; text in `color.white`, bold, `map.badgeTextSize`, centred |
| `stationMarker` | `cx`, `cy`, `to` (point, optional), `r` (`map.stopRadius`, plus `map.interchangeExtra` when `to` is given), `state` (`normal`, `deprecated`), `surface`, `inkScale` | disc sticker; with `to`, a capsule from (cx, cy) to `to`; face `color.white`, or `surface.muted` when deprecated |
| `pipe` | `d` (path data), `fill` (token or data colour), `width` (`map.lineWidth`), `casing` (`map.casing`; 0 = none) | ink casing (width + casing) under the colour stroke, round caps and joins; no shadow |
| `countBadge` | `cx`, `cy`, `text`, `height` (`map.countHeight`), `width` (default: height for one character, else max(height, 6.4 × characters + 8)), `surface`, `inkScale` | disc or pill sticker in `surface.panel`; text in `surface.text`, bold, `map.countTextSize` |
| `nodeBlock` | `x`, `y`, `width` (≥ 2 × height), `height` (`map.nodeHeight`), `title`, `subtitle` (optional), `state` (`normal`, `focus`, `placeholder`), `radius` (`map.nodeRadius`), `surface`, `inkScale` | rounded box |
| `pillNode` | as `nodeBlock`, no `radius` | box with radius height / 2 |
| `hexNode` | as `nodeBlock`, no `radius` | hexagon cut by height / 2 at both ends |
| `messageArrow` | `from`, `to` (points), `curve` (`bezier`, `straight`), `head` (true), `label` (optional), `width` (`map.edgeWidth`), `surface` | path in `surface.text`; bezier leaves and enters horizontally (controls at the middle x); the head is a filled triangle at `to` along the end direction; the label sits in a small pill at the middle, `surface.background` with a `surface.text` outline |
| `ledgerMark` | `x`, `y` (top left), `size` (32), `line` (token, `illustration.accent`) | rounded ink square (radius 7/32 of size), a bent line in `line` with one white interchange and one white terminal, ink outlined: the stackledger favicon and header mark, in the shape of the brunosouzas.com favicon |

Node states: `normal` is a sticker in `surface.panel`, title in `surface.text` (bold, `map.labelSize`) and subtitle in `surface.muted` (11); `focus` is a sticker in `color.caller` with ink text, as the centre item of stackledger's diagrams; `placeholder` is the shape dashed (`5 4`) in `surface.muted`, stroke 1.5, no fill and no shadow, with the title centred in `surface.muted` and no subtitle. Text sits at `inset` from the left (12 for `nodeBlock`, height / 2 for `pillNode` and `hexNode`); title baseline at y + height / 2 − 3 and subtitle at y + height / 2 + 14, or the title alone at y + height / 2 + 4.5.

Words: the pieces draw only `text`, `title`, `subtitle` and `label`, non-empty.

## 4. Data colours

A line's colour comes from the consumer's catalogue (a journey colour in stackledger), not from the identity. `pipe.fill` and `lineBadge.fill` accept a token path or `#RRGGBB` (six hex digits, nothing else). The check is a new parameter kind, `dataColor`; `color` keeps rejecting literals. The no-colour-literals test still scans `src/pieces/`: no hex in the code. The cover command keeps rejecting a colour literal anywhere in a spec (`cover-cli`, "Colour literal anywhere"), so covers stay on tokens.

Rejected: registering stackledger's line colours as tokens (they are user data and change per catalogue); accepting any CSS colour (opens `url(` and named colours).

## 5. Catalogue sheet

The sheet adds the nine pieces in the same 240 × 240 cells, on the light surface; `PIECE_NAMES` lists 35. The light and dark sheet next to stackledger's pages stays gate evidence, not a command.

## 6. Decisions for gate 1

1. Dark text and rim `#EEF1FF` become `#EEF2FF` (`color.panel`): one unit of green apart, invisible, and one value fewer.
2. Line colours as data colours on `pipe` and `lineBadge` only (§4).
3. `site` holds today's brunosouzas.com palette; stackledger's accent stays in stackledger.
4. `ledgerMark` as drawn in the spike: an ink square like the brunosouzas.com favicon, with the line and two stations.
5. `pillNode` and `hexNode` as their own pieces, as approved in the inventory, over one shared drawing function.
6. The 26 cover pieces keep their cover scale: no `surface` or `inkScale` for them.

## 7. Risks

- stackledger's layout counts the ink (`inkOf`, `widestInk`): it must read the same values from `map` and `surface`, or obstacles and drawing drift. The adoption in stackledger should replace its constants with the tokens, not copy them again.
- A data colour with poor contrast against the white badge text is the consumer's choice; the piece does not check contrast.

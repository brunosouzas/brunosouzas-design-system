# Design: stackledger-map-and-link-pieces

## Context

Spike: `~/.hermes/spikes/design-system/stackledger-pieces/spike.mts`. It draws each candidate next to what stackledger and brunosouzas.com draw today, light and dark and at phone width. The sheet is `out/contact-sheet.png` (gate-1 evidence, outside the repository). Every measure below was read in stackledger `main` `8db44fe`, stackledger PR #29 `daff687` (the favicon) and brunosouzas.com `e29b3dd`. The values are in the proposal's table.

Principles kept from `metro-and-diagram-pieces` design §1: the pieces paint and the caller lays out. A new parameter has a default that keeps today's tree.

## 1. Halo and ring: their own pieces, not `stationMarker` parameters

Options: (a) `stationMarker({ …, halo: "suggested" | "renewal" })`; (b) two pieces.

Chosen: (b). stackledger's legend draws the ring and the halo with no station (`svg.ts:187-190`). Their radius comes from the layout (half the capsule + marker radius + 6, plus 3 for the halo), not from the marker. They are layered under the marker, while the licence goes over it. As parameters they would need a radius, an order and a way to draw without the marker, and `stationMarker`'s tree would change shape. As pieces, `stationMarker` stays byte-identical and the caller orders the layers as today: halo, ring, marker, licence.

## 2. Colour meanings (ADR 0003)

Today the map uses `color.transitional` for "owns a licence" and `color.blocked` for "renewal within 30 days". ADR 0003 defines yellow as transitional, and holding a licence is not a transition.

- Renewal ring: `color.blocked`. A licence about to lapse is the "will block" warning, close to the orange's meaning. The colour is fixed: the piece has no colour parameter.
- Licence mark: `owned` takes `color.healthy` (normal: the licence is in place), `toBuy` takes `color.white` (empty: not held yet), as stackledger's hollow disc today. Rejected: keeping yellow (a meaning ADR 0003 does not define), or yellow for `toBuy` (it reads as a warning, and the map already warns with the ring).
- ADR 0003 gets an amendment (as AB#139 and AB#157 did) saying so for the map's markers. The six meanings stay unchanged.

The spike sheet shows both (rows 1 and 2); the owner chooses at gate 1.

## 3. Pieces

`o = map.outline × inkScale`, `w = rimWidth × inkScale` and `k = map.shadow × inkScale`, as in `metro-and-diagram-pieces` §3.

| Piece | Parameters (defaults) | Draws |
|---|---|---|
| `renewalRing` | `cx`, `cy`, `r` (required size), `width` (`map.ringWidth`; greater than 0, at most 50), `surface`, `inkScale` | circles at (cx, cy) radius r, fill none, in order: when `rimWidth` > 0, stroke `surface.rim` at width + o + 2w; stroke `color.ink` at width + o; stroke `color.blocked` at width. No shadow. `r` must be at least (width + o + 2w) / 2, otherwise a `RangeError` naming `r` |
| `suggestedHalo` | `cx`, `cy`, `r` (required size), `surface` | one circle, fill none, stroke `surface.muted` at `map.haloWidth`, `stroke-dasharray` `4 3` |
| `licenceMark` | `cx`, `cy`, `state` (`owned` default, `toBuy`), `size` (`map.licenceSize`), `surface`, `inkScale` | a disc sticker of radius size / 2; face `color.healthy` when owned, `color.white` to buy |
| `zone` | `points` (1 to 10000 points, required), `fill` (token or data colour, required), `title` (optional), `titleAt` (point, optional), `surface` | body: a group with `opacity` `surface.zoneOpacity` and `stroke` none holding, for one point, a circle of radius `map.zonePadding`, fill `fill`; for two, a line between them, stroke `fill` at 2 × `map.zonePadding`, round caps; for three or more, a polygon of the points in the given order, fill and stroke `fill` at 2 × `map.zonePadding`, round joins. Text: the title at (titleAt.x, titleAt.y + 13), bold, `map.labelSize`, start anchor, in `fill` on light and in `fill` mixed with white by `map.zoneTitleTint` on dark |
| `uiIcon` | `name` (required, one of §5), `x`, `y` (top left), `size` (24), `colour` (token, `color.ink`) | a group `translate(x y) scale(size / 24)` with `fill` and `stroke` `colour`, holding the icon's nodes |
| `linkIcon` | `icon` (required: `github`, `linkedin`, `email`, `website`), `x`, `y` (top left), `size` (46), `surface` | a group `translate(x y) scale(size / 46)` with `stroke` none, holding the frame of §6, the face and the icon's glyph |

**Inside an outlined group.** The cover command and the catalogue sheet draw every body inside a group stroked in ink at 4 (`src/pieces/cover.ts:266`, `scripts/pieces-sheet.ts:86`), and the cover pieces rely on it. The metro pieces do not: each of their shapes carries its own stroke. The new pieces follow the metro rule. Every shape (`circle`, `ellipse`, `rect`, `line`, `polyline`, `polygon`, `path`) has its own `stroke` attribute, or sits inside a group of the piece that sets one (`stroke` none for `zone` and `linkIcon`, the colour for `uiIcon`). The rim rect of a dark `ledgerMark` has `stroke` none, like its square. So a new piece draws the same in a cover, on the sheet and in stackledger's map.

**Licence room.** The licence face is its meaning, and the disc is small. The general rule (smallest dimension at least 4 × o) would ask for 12 at ink scale 1, and stackledger draws 10. The licence uses its own rule: `size` at least 3 × o (9 at ink scale 1). The visible face is then at least 2 × o across, 7 units at the default 10. A smaller size throws a `RangeError` naming `size`, and equality is accepted. Rejected: default 12 (the map grows 2 units and the 24-unit legend symbol loses its margin); no minimum (the outline swallows the face). "Room for the outline" stays as it is.

**Zone.** Options: (a) the piece takes the member points and computes the convex hull; (b) the piece takes the outline ready and paints it. Chosen: (b). stackledger needs the hull for its layout already (`layout.ts:190` grows obstacles by it), and its title placement is layout too (`zones.ts`, `stackCornerTitles`). With (a) the hull would be computed twice, in two repositories that must agree. The piece draws the points in the given order. A convex hull in order gives stackledger's look, and a self-crossing list is the caller's error, as a wrong path is for `pipe`. `title` and `titleAt` go together: one without the other throws a `RangeError` naming the missing one. The dark title colour is computed from `fill` (each channel `round(c × (1 − t) + 255 × t)`, upper-case hex). It is a colour derived from data, like the data colour itself, not a literal in the code.

**Data colour.** `zone.fill` is a `dataColor`, like `pipe.fill` and `lineBadge.fill`: the colour comes from the catalogue. A cover spec still rejects every colour literal.

## 4. Changes to existing pieces

- **Placeholder subtitle.** `nodeBlock`, `pillNode` and `hexNode` with `state: "placeholder"` accept `subtitle`. With it, the text follows a normal node's layout (inset 12 for `nodeBlock`, height / 2 for the others; title at y + height / 2 − 3, bold, `map.labelSize`; subtitle at y + height / 2 + 14, 400, 11), every word in `surface.muted`, as stackledger's unlinked box (`neighbourhood.ts:91-92`). The shape is unchanged (dashed `5 4`, no ink). Without a subtitle the title stays centred at weight 400, as in 0.2.0.
- **Badge without a letter.** `lineBadge.text` is optional. Without it, the body is unchanged, `text` is empty, and the default width is the one-character width, max(30, 7.6 × 1 + 18) = 30. `width ≥ height` still applies, so a banner badge 34 high passes a `width`, as it does today. `text: ""` is still rejected: there is one way to say "no letter".
- **Mark on a dark surface.** `ledgerMark` takes `surface` (`light` default). When the surface's `rimWidth` is greater than 0, the group starts with a rect 0, 0, 32 × 32, radius 7, fill `surface.rim`, stroke none, and the ink square becomes x = y = 2 × rimWidth, side 32 − 4 × rimWidth, radius 7 − 2 × rimWidth (2, 28 and 5 on dark). The line and the stations do not move. The mark stays inside its 32 box, so the favicon's view box is unchanged. On light, `rimWidth` is 0 and the tree is today's. Rejected: a band of one rimWidth (0.9 px at the 28 px header, see the sheet); a rim outside the square (clipped by the favicon's view box).

## 5. UI icons

Data `UI_ICONS`: name, title, description and nodes in a 24 × 24 box, without colours. The group sets `fill` and `stroke`. Stroked parts are `path` nodes with `fill` none, `stroke-width` 2, round caps and joins. Filled parts have `stroke` none.

| Name | Title | Nodes |
|---|---|---|
| `sun` | Sun | circle (12, 12) r 4.5, stroke none; stroked path `M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8` |
| `moon` | Moon | filled path `M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1Z` |
| `zoomIn` | Zoom in | stroked path `M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13ZM15.3 15.3l5.2 5.2M7.5 10.5h6M10.5 7.5v6` |
| `zoomOut` | Zoom out | stroked path `M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13ZM15.3 15.3l5.2 5.2M7.5 10.5h6` |
| `reset` | Reset | stroked path `M4.5 12A7.5 7.5 0 1 0 6.7 6.7M4 3.5v4.5h4.5` |
| `calendar` | Calendar | stroked path `M5.5 5h13a2 2 0 0 1 2 2v11.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM3.5 10h17M8 3v4M16 3v4`; rect (7, 13) 3 × 3, radius 0.5, stroke none |
| `download` | Download | stroked path `M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5M4.5 16.5v3h15v-3` |

These are drawn for this package, not copied. Both sites use the same Astroplate switch, so `sun` and `moon` serve brunosouzas.com as well. The site adopts them in its own card. Rejected: ink-style stickers (at 16 px the outline and shadow are noise on a button), and `currentColor` (outside the token rule, and stackledger's map writer accepts only `#RRGGBB`).

## 6. Link icons

Data `LINK_ICONS`: name, title, description, face (a token path) and glyph nodes in the 46 × 46 box. The glyphs of `github`, `linkedin` and `email` are copied from brunosouzas.com `e29b3dd` `public/images/home/social-<name>.svg`, the nodes after the face rect, with their colours replaced by tokens (`#0A1033` to `color.ink`, `#FFFFFF` to `color.white`). The GitHub mark keeps its group `translate(9.5 9) scale(0.0455)` and its path as in the file. It is Font Awesome's, CC BY 4.0, and its description says so.

| Name | Title | Face | Glyph |
|---|---|---|---|
| `github` | GitHub | `color.white` | the Font Awesome mark, `color.ink` |
| `linkedin` | LinkedIn | `color.caller` | rect (12, 18.5) 4 × 11.5 r 1, circle (14, 13.8) r 2.4, the "in" path, all `color.ink` |
| `email` | Email | `color.transitional` | rect (9, 13) 24 × 17 r 3 white with an ink stroke 2.5; path `M10,15 L21,23 L32,15`, fill none, ink stroke 2.5, round joins |
| `website` | Website | `color.healthy` | circle (21, 21) r 10.5 white with an ink stroke 2.5; ellipse (21, 21) 4.6 × 10.5, fill none, ink stroke 2; path `M10.5 21H31.5M12.5 15.5H29.5M12.5 26.5H29.5`, fill none, ink stroke 2, round caps |

The site has no mark of its own as a vector (only `favicon.png`), so `website` is a globe in the same style.

Frame, from the site's files: on light, a rect (5, 5) 38 × 38, radius 9, fill `surface.light.shadow`; on dark, a rect (4, 4) 41 × 41, radius 11, fill `surface.dark.shadow`, then a rect (0.5, 0.5) 41 × 41, radius 11, fill `surface.dark.rim`. Then the face: rect (2, 2) 38 × 38, radius 9, fill the face, stroke `color.ink` at 2.5. These are the site's measures, not the map's sticker, so the brunosouzas.com files can be regenerated from the piece and look the same (rim `#EEF1FF` becomes `#EEF2FF`, as decided in AB#157).

No node carries `href`, `style`, a script or a URL.

## 6b. Frozen 0.2.0 drawings

The goldens hold no `lineBadge`, node or `ledgerMark`, so they cannot show that the three changed pieces still draw a 0.2.0 call the same. Before any code changes, a script run on `main` (`897f2ff`, the 0.2.0 tree) writes `test/fixtures/pieces-0.2.0.json`: a list of `{ piece, params, tree }`, where `tree` is the piece's `{ body, text }` as JSON. The calls are every combination of:

- `lineBadge` at (50, 20) with `text` `SH` and `fill` `color.healthy`: light and dark; `flat` false and true; `inkScale` 1 and 1.6 (the second also with `height` 34 and `width` 54).
- `nodeBlock`, `pillNode` and `hexNode` at (10, 10), `width` 200, `title` `Stripe`: states `normal`, `focus` (both with and without `subtitle` `kind`) and `placeholder` (without a subtitle); light and dark; `nodeBlock` also with `radius` 6.
- `ledgerMark` at (0, 0): no other parameter; `size` 16; `size` 120 with `line` `color.healthy`.

The test calls each again and expects a deep-equal tree. The script is committed as `scripts/freeze-pieces.ts` with a header saying it was run once on `897f2ff`, so the fixture can be checked.

## 7. Tokens

| Token | Type | Value | Source |
|---|---|---|---|
| `map.ringWidth` | dimension | 3 | `svg.ts:154` |
| `map.haloWidth` | dimension | 1.5 | `svg.ts:152` |
| `map.licenceSize` | dimension | 10 | `layout.ts:40` (radius 5) |
| `map.zonePadding` | dimension | 32 | `zones.ts:13` |
| `map.zoneTitleTint` | number | 0.6 | `themes.ts` dark `zoneTitleTint` (light is 0: no tint) |
| `surface.light.zoneOpacity` | opacity | 0.12 | `themes.ts` |
| `surface.dark.zoneOpacity` | opacity | 0.22 | `themes.ts` |

`map` is no longer "all `dimension`": `zoneTitleTint` is a `number`. `surface` entries hold nine tokens.

## 8. Catalogue and sheet

`PIECE_NAMES` grows from 35 to 41, in this order after `ledgerMark`: renewalRing, suggestedHalo, licenceMark, zone, uiIcon, linkIcon. The catalogue sheet draws them in its 240 × 240 cells with their required parameters.

## 9. Decisions for gate 1

1. This change also carries stackledger's second request (mark on dark, badge without a letter, link icons), released together as 0.3.0.
2. Halo and ring as their own pieces (§1).
3. Licence green when held and white to buy; ring orange; ADR 0003 amended (§2).
4. Licence at 10 units with its own room rule, size ≥ 3 × outline (§3).
5. The zone receives the outline ready (§3).
6. UI icons in one token colour, for both sites (§5).
7. Placeholder with a subtitle in a normal node's layout, all muted, title bold (§4).
8. Mark on dark with a 2-unit rim inside the square (§4).
9. `website` as a green globe; `text: ""` still rejected on `lineBadge` (§4, §6).

## 10. Risks

- stackledger's layout counts the zone padding and the licence radius. It must read the new `map` tokens, not keep its own constants, or the obstacles drift from the drawing.
- The licence colour changes on stackledger's map when it adopts the piece (yellow to green). Its legend explains it, and the owner sees it in the sheet.

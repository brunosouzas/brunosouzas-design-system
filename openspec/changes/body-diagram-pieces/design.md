# Design: body-diagram-pieces

Spike and evidence: `~/.hermes/spikes/design-system/ab141-body-diagram-pieces/` — `survey.py` and `survey.md` (the element table below, from the 28 files), `pieces.mts` (the pieces of §3 to §5 as throwaway code; the scenario numbers come from `numbers.mts` and `numbers.txt`), `sheet.mts` and `sheet.png` (the contact sheet: three published diagrams next to their redraw, light and dark, a 375 px phone row, and the pieces alone).

## 1. Survey of the published body diagrams

Source: `brain/50-writing/{circuit-breaker-in-mulesoft,integration-patterns-in-mulesoft,obsidian-to-site}/images/*-{pt,en}.svg`, 14 diagrams in 28 files (`solid-in-mulesoft` and `mulesoft-delivery-azure-devops` have covers only). PT and EN draw the same shapes; counts below are per diagram (EN file). Every hex is a token except the two marked.

| Element | Diagrams | Occurrences | Measure and paint as published | Drawn by |
|---|---|---|---|---|
| Box (rect, rx 14) in a semantic fill (healthy, caller, backend, blocked, transitional, white) | 14 | 49 | outline 4, ink shadow (8, 8); title 17 to 19 px weight 800, centred; subtitle 13 to 15 px | `diagramBox` |
| Pill (rect, rx h/2) | 6 | 6 | as the box | `diagramBox` `shape: "pill"` |
| Note of a sequence (rect, rx 8, yellow) | 3 | 7 | outline 3, shadow (5, 5); 15 px weight 800, centred | `diagramBox` `radius: 6`, `textSize` |
| Decision diamond | 3 | 3 | white, outline 4, shadow (8, 8); two centred lines | `decisionNode` |
| Store cylinder | 3 | 4 | white, outline 4, ry 11, lid arc 3; one to three lines | `storeNode` |
| Queue (rect rx 8 with two rails) | 5 | 11 | white or blocked; rails 3 wide, 14 in from each side, full height | `queueNode` |
| Exchange (hexagon) | 3 | 3 | white; points 26 in on a height of 64 (0.41 h) | `exchangeNode` |
| Container with a tab | 6 | 6 | white frame rx 18, outline 4, shadow (8, 8); tab 34 high, rx 17, yellow, outline 3, no shadow, 20 in from the left, centred on the top edge | `taggedContainer` |
| Lifeline | 4 | 13 | `illustration.road` 2.5, dash `7 7` | `lifeline` |
| Lifeline, backend no longer called | 1 | 1 | `illustration.iconLine` 2.5, dash `3 9` | `lifeline` `state: "inactive"` |
| Phase band (pill across the diagram) | 1 | 3 | 36 high, rx 18, outline 3, shadow (4, 5); healthy, transitional, blocked; 16 px weight 800 | `phaseBand` |
| Alt/else frame | 2 | 3 frames, 4 dividers, 7 tags | frame ink 2.5, rx 10, no fill; divider ink 2, dash `6 6`; tag ink 24 high, rx 6, word 13 px white; condition 14 px bold on a backdrop | `altFrame` |
| Label on a backdrop (sequence messages) | 3 | 30 lines | text 14 to 15 px weight 700; backdrop `color.panel`, rx 4, 20 high | `edgeLabel` `backdrop: true` |
| Free label next to an arrow (flows) | 11 | 94 lines at 14 or 15 px, weight 700, no backdrop (box subtitles included) | anchor start, middle or end | `edgeLabel` |
| Message arrow, ink, solid (straight 49, curved 17) | 14 | 66 | ink 3, notched marker head 13 | `messageArrow` |
| Reply, ink, dash `8 6` | 4 | 8 | ink 3 | `messageArrow` `kind: "reply"` |
| Failure, `color.failure`, dash `8 6` | 5 | 8 | red 3 | `messageArrow` `kind: "failure"` |
| Failure, `color.failure`, solid | 2 | 2 | red 3 and 3.5 | `messageArrow` `kind: "failure"` (dashed: one code, §6) |
| Fail-fast, `color.failFast`, dash `8 6` | 1 | 1 | orange 4, head 15 | `messageArrow` `kind: "failFast"` |
| Curved arrow with its own control points | 7 | 19 | 6 leave and enter vertically, 3 horizontally, 10 mixed | `messageArrow` `controls` |
| Code in the monospace stack | 9 | 52 whole texts, 39 runs inside a text | `font.mono` | backticks, §4 |
| Text colour `#C2501A` (**not a token**) | 1 | 1 | "(immediate)" under the fail-fast arrow | `edgeLabel`, surface text (§6) |
| Text colour `#B8322F` (**not a token**) | 1 | 1 | "something wrong" beside a failure arrow | `edgeLabel`, surface text (§6) |

Shadows: 72 shapes with outline 4 cast (8, 8); 11 with outline 3 cast (5, 5) or (4, 5).

**Left out** (one diagram each, so not a piece): the two-headed arrow (`idempotent-receiver-in-mulesoft-charge-flow`; two `messageArrow` calls from the middle draw it), the red cross on a blocked delivery (`dead-letter-channel-in-mulesoft-book`), the start dot of the state machine (`circuit-breaker-states`; a `stationMarker` or a circle of the port), and the folder-tab boxes (`publish-flow`, `setup-overview`: two diagrams, four boxes; the port draws a `diagramBox`, or asks for a card if the tab matters).

## 2. Scale and ink

The new pieces use the map ink of the metro and diagram pieces (`map.outline` 3, `map.shadow` 3.5, `map.labelSize` 13, `map.edgeWidth` 2.5, scaled by `inkScale`), so a body diagram and stackledger's diagrams share one ink, and `diagramBox` sits next to `nodeBlock` without a seam. A body diagram is 800 wide. Laid out in 560 units and shown 800 wide (scale 1.43), the pieces come out at about the published sizes: text 18.6 (published 17 to 19), outline 4.3 (4), edge 3.6 (3), edge labels 15.7 (15), box radius 14.3 (14). The shadow is the one visible difference: 5 instead of 8. The spike shows it (rows 1 to 3 of the sheet). No token is added: the scale is the port's layout choice, written in the README.

## 3. The pieces

Every piece checks its parameters (schema, then limits between parameters, each a `RangeError` naming the parameter) and draws in the order shadow, rim (dark), face, inner lines; text after every shape. `o = map.outline × inkScale`. "Sticker" is the sticker of `metro-and-diagram-pieces` design §3, unchanged. "Room" is the rule of the requirement "Room for the outline": smallest outlined dimension at least 4 × o.

Common parameters of the five shapes (`diagramBox`, `decisionNode`, `storeNode`, `queueNode`, `exchangeNode`): `x`, `y` (top-left of the bounds), `width` (required), `height`, `text` (array of 1 to 3 non-empty strings, required), `subtitle` (optional string), `fill` (optional colour token path), `textSize` (6 to 48, default `map.labelSize`), `surface`, `inkScale`.

| Piece | Own parameters and defaults | Drawing | Limits |
|---|---|---|---|
| `diagramBox` | `height` (`map.nodeHeight`), `radius` (`map.nodeRadius`; 0 to height / 2), `shape` (`box`, `pill`; pill sets radius height / 2) | rect sticker | room on min(width, height); radius ≤ height / 2 |
| `decisionNode` | `height` required | polygon sticker: (x + w/2, y), (x + w, y + h/2), (x + w/2, y + h), (x, y + h/2) | room on min(width, height) |
| `storeNode` | `height` required, `ry` (8; greater than 0, at most height / 4) | path sticker `M x,y+ry A w/2,ry 0 0 1 x+w,y+ry V y+h−ry A w/2,ry 0 0 1 x,y+h−ry Z`; then the lid `M x,y+ry A w/2,ry 0 0 0 x+w,y+ry`, fill none, ink, width 0.75 × o. Text centred on y + (h + ry) / 2 | room on min(width, height); ry ≤ height / 4 |
| `queueNode` | `height` (`map.nodeHeight`) | rect sticker, radius `radius.small` (6); then the rails `M x+10,y V y+h M x+w−10,y V y+h`, fill none, ink, width 0.75 × o | room on height; width ≥ height |
| `exchangeNode` | `height` (`map.nodeHeight`) | polygon sticker with points k = 0.26 × h in: (x+k, y), (x+w−k, y), (x+w, y+h/2), (x+w−k, y+h), (x+k, y+h), (x, y+h/2) | room on height; width ≥ height |
| `taggedContainer` | `x`, `y`, `width`, `height` (required), `tag` (string, required), `tagWidth` (default 7.2 × characters + 24, backticks not counted), `tagFill` (`color.transitional`), `fill` (optional), `surface`, `inkScale` | frame: rect sticker, radius `map.nodeRadius`; tab: rect sticker at (x + 14, y − 12), tagWidth × 24, radius 12, face `tagFill`; tag word at (x + 14 + tagWidth / 2, y + 4.5), ink, bold, `map.badgeTextSize`, middle | room on min(width, height); width ≥ tagWidth + 28 |
| `lifeline` | `x`, `y1`, `y2` (required), `state` (`active`, `inactive`), `width` (1.75; greater than 0, at most 12), `surface` | one `line` (x, y1) to (x, y2), stroke `surface.muted`; active: dash `5 5`, cap butt; inactive: dash `1 6`, cap round | y2 ≠ y1 |
| `phaseBand` | `x`, `y`, `width` (required), `height` (26), `text` (string, required), `fill` (colour token path, required), `textSize` (13), `surface`, `inkScale` | pill sticker (radius height / 2) in `fill`; text ink, bold, centred at (x + w/2, y + h/2 + 4.5 × textSize / 13) | room on height; width ≥ height |
| `altFrame` | `x`, `y`, `width`, `height` (required), `tag` (string, required), `condition` (optional), `sections` (0 to 10 of `{ y, tag, condition? }`), `surface` | frame: rect, fill none, stroke `surface.text`, width 1.75, rx 7; per section a `line` (x, y) to (x + w, y), stroke `surface.text`, width 1.4, dash `4 4`; per head (the frame's, then each section's, at top t): tag rect (x + 7, t + 6), 6.4 × characters + 14 wide, 17 high, rx 4, fill `surface.text`, stroke none; word at its centre, baseline t + 18.5, fill `surface.panel`, 10, `font.weightHeavy`; condition backdrop rect (x + 7 + tagW + 2, t + 7.5), 6.2 × characters + 8 wide, 14 high, rx 3, fill `surface.background`, stroke none; condition at (x + 7 + tagW + 6, t + 18.5), `surface.text`, 11, bold, start | each `sections[i].y` strictly inside (y, y + height) |
| `edgeLabel` | `x`, `y` (baseline of the first line), `lines` (1 to 4 non-empty strings, required), `anchor` (`start`, `middle`, `end`), `backdrop` (false), `width` (optional backdrop width), `textSize` (11), `surface` | each line i at (x, y + 13 × k × i), k = textSize / 11, `surface.text`, bold, the anchor; with `backdrop`, first, per line a rect of width `width` or (6.2 × characters + 8) × k, height 14 × k, y = baseline − 10 × k, rx 3, fill `surface.background`, stroke none; its left edge x − 4k (start), x − w + 4k (end) or x − w / 2 (middle) | — |

Words of a shape: lines centred on (x + w / 2, cy), where cy is the shape's centre (the store's is above). Line step s = textSize × 1.25; block = (lines − 1) × s, plus 15 with a subtitle; first baseline cy + 4.5 × textSize / 13 − block / 2; the subtitle 15 below the last line, size 11, weight 400. Every text node carries its own `font-family`, `fill`, `font-size`, `font-weight` and `text-anchor`, in that order after `x` and `y`.

Characters for every width estimate are counted with `Array.from` after removing backticks. The estimate is a default only: the caller measures (the map's rule) and passes `tagWidth` or `width`.

Every shape and line of the ten pieces carries its own `stroke` (`none` included), so they draw the same inside the cover command's outlined group.

## 4. Text and code

- **Face and text colour.** Without `fill`, the face is `surface.panel` and the text `surface.text` (subtitle `surface.muted`), as a normal `nodeBlock`. With `fill`, the face is that token and every word is `color.ink`: ADR 0003, small elements inside a coloured block are ink. `phaseBand` and the container's tab always have a fill and ink words.
- **Backticks mark code.** In every text parameter of the ten pieces (`text`, `subtitle`, `tag`, `condition`, sections' `tag` and `condition`, `lines`), a string is split on the backtick; with an even number of backticks, the odd parts become `tspan` children with `font-family` `font.mono`, the even parts stay strings, empty parts are dropped. With an odd number, the string is drawn as is. ADR 0003 asks for code identifiers in the monospace stack, and the diagrams mix both inside one label (39 runs in 6 diagrams), which one font per label cannot draw. `messageArrow`'s `label` and every other piece keep plain text.
- **`tspan`** joins the node tree's tags. It is an SVG text-content element: `toSvg` writes a text node with a `tspan` on one line (the existing "text written inline" rule), and `toReact` creates it like any tag.

## 5. The message arrow

- **`kind`** (`message` default, `reply`, `failure`, `failFast`). Paint: `message` and `reply` `surface.text`; `failure` `color.failure`; `failFast` `color.failFast`; the path's `stroke` and the head's `fill` and `stroke` take it. `reply`, `failure` and `failFast` add `stroke-dasharray` `2.4w 3.2w` (each through `r2`; `6 8` at the default width 2.5) as the path's last attribute. The label pill keeps `surface.text`. `kind: "message"` and no `kind` emit the 0.3.1 tree exactly.
- **`controls`** (array of exactly two points): the path is `M from C c1 c2 end`, with `end` the base of the head; the head points from the last of c2, c1, `from` that differs from `to`. `controls` with `curve` is rejected naming `controls`. The existing limits (`to` differs from `from`, room for the head) hold.
- **Frozen 0.3.1 calls.** Before any code, a one-off script `scripts/freeze-message-arrow.ts`, run on `origin/main` (`b0712a9`), writes `test/fixtures/message-arrow-0.3.1.json` with `{ piece, params, tree, svg }` per call (`svg` = the body nodes through `toSvg`, joined), committed alone. `pieces-0.2.0.json` has no `messageArrow` (it holds `nodeBlock`, `lineBadge`, `pillNode`, `hexNode`, `ledgerMark`). The eight calls:

```json
[
  { "from": [0, 0], "to": [200, 100] },
  { "from": [0, 0], "to": [0, 100] },
  { "from": [0, 0], "to": [25, 100] },
  { "from": [0, 0], "to": [100, 0], "curve": "straight", "label": "used by" },
  { "from": [10, 20], "to": [300, -40], "head": false },
  { "from": [-50, 10], "to": [150, 90], "width": 4, "surface": "dark" },
  { "from": [0, 0], "to": [120, 60], "curve": "straight", "width": 1, "label": "x" },
  { "from": [300, 200], "to": [0, 0], "surface": "dark", "label": "reads" }
]
```

No other existing piece changes, so no other fixture is needed: the moved helpers (§8) are covered by `pieces-0.2.0.json`, `ui-icons-0.3.0.json`, the goldens and the metro tests.

## 6. Colours (ADR 0003)

No new token and no amendment. The failure and fail-fast arrows use the tokens that already carry those meanings (`color.failure` "The failure path.", `color.failFast` "Text and lines of a fail-fast path.") and match ADR 0003 (orange blocked or fail-fast, red the failure path). The two published label hexes outside the tokens (`#C2501A`, `#B8322F`) are not kept: `edgeLabel` draws in `surface.text`, and the arrow's colour already says failure. The two solid red arrows become dashed, so a failure path has one look. Lifelines move from `illustration.road` and `illustration.iconLine` to `surface.muted` (light `#5B6694`, almost the published `#5B6478`), so they also read on the dark surface; the inactive one is told apart by its sparse round dots.

## 7. Motion shapes (`src/brand/flow-shapes.ts`, `flow-components.tsx`)

- **Exchange:** the static point inset is the motion one, 0.26 × h (the published diagrams use 0.41 × h; the port's hexagons become a little blunter).
- **Container tab:** as in motion, the tab has a shadow (the published tab has none), sits 20 px (14 units) in from the left and is centred on the top edge, in `color.transitional`.
- **Queue:** motion puts the rails 22 px in, 4 px short of each end, on a 1080p video; the static rails are 10 units in and full height, as the published queues, because the outline already closes their ends and a map-sized queue (46 high) has no room for 22.
- Radii: motion uses `radius.block` (18) at video scale; the static pieces use the map radii (`map.nodeRadius`, `radius.small` for the queue), as the published diagrams' 14 and 8 at 1.43.

## 8. Modules

- `src/pieces/ink.ts` (new, internal): `inkOf`, `sticker`, `words`, `limits`, `roomFor` and `atLeast`, moved from `metro.ts` without change. `metro.ts` imports them. They are not exported by the package: `library.ts` re-exports `metro.ts` and `diagram.ts` only.
- `src/pieces/diagram.ts` (new): the ten pieces and `DIAGRAM_PIECES`, in the order of §3; `PIECES` adds them after `linkIcon`.
- `src/pieces/node.ts`: `tspan` in `SVG_TAGS`.
- `scripts/pieces-sheet.ts` draws the new pieces with their required parameters, as it does for every piece.

## 9. Decisions for gate 1

1. Map ink at the port's scale (§2), shadow 5 instead of 8, no ink tokens for body diagrams. Alternative: `diagram.*` ink tokens and an `ink` parameter on every diagram piece.
2. Arrow colours from the existing tokens, no ADR amendment, labels in `surface.text` (§6).
3. Lifelines and phase bands are pieces: they own stroke, dash, colour and ink; the caller owns positions. Alternative: the caller draws them with `pipe` and `diagramBox`, and every port repeats the dash and colour.
4. Text measure and truncation stay with the caller: every width the piece estimates can be passed (`tagWidth`, `width`), and `textSize` lets the caller fit a long code label (§3, §4).
5. `messageArrow` gains parameters (`kind`, `controls`) instead of a new arrow piece; the frozen fixture of §5 proves 0.3.1 calls unchanged.
6. `diagramBox` is a new piece instead of `fill` and `align` on `nodeBlock`: the published boxes are coloured and centred (49 boxes in 14 diagrams), and a new piece leaves stackledger's nodes untouched. Not in the card's list, but without it the port cannot draw its most common element.
7. Backticks for code and the `tspan` tag (§4). Alternative: one font per label (`code: true`), and the 39 mixed runs drawn as two labels measured by the caller.
8. Motion geometry for the exchange and the tab, published geometry for the queue rails (§7).

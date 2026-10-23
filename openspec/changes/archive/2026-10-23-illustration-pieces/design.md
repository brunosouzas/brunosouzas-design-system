# Design: illustration-pieces

## Context

Observed on 2026-10-23 (DES-4), from the brain vault's `50-writing/*/images/`:

- 21 covers (`*-card.svg`), all 800x420, each with its own background and 14 rings of width 2, step 28, first radius 90 (18 covers), 96 (2) or 100 (1), around a centre that varies per cover. Each ring colour was picked by hand: the 21 background/ring pairs are listed in §2.
- 26 EIP icons (`integration-patterns-in-mulesoft/images/icons/eip-*.svg`), all `viewBox="0 0 64 40"`, each with a `<title>`, and a `<desc>` crediting the Enterprise Integration Patterns icons by Gregor Hohpe and Bobby Woolf (CC BY 4.0). Colours used: ink, white, healthy, transitional, caller, backend and `#B9C3E0` (in 14 icons). The eip-catalog and integration-patterns covers paste their markup.
- Colours outside `tokens/source.json` that recur in covers: `#C9D6F5` (10 covers), `#14215A` (9), `#1E6FEB` (3), `#2BB673`, `#B9C3E0`, `#FFE2C8`, `#5B6478` (2 each); `#E8B830` once, in the folder.
- Shadows: 12 covers stroke the shadow shape with the outline, 9 do not. 41 pills of height 36 (`rx="18"`) in 19 covers, label 19 px, weight 800.
- No generator exists for any cover or icon.

The prototype (`~/.hermes/spikes/design-system/illustration-pieces/`, `pieces.ts`, `build.ts`, `ipc.ts`) rebuilt `spec-driven-development-card`, `ai-writes-code-card` and `integration-patterns-card` at 39.4, 31.8 and 23.3 dB PSNR (`ffmpeg -lavfi psnr`, 800 px renders by `rsvg-convert`); the remaining difference is the drift above. Rendering its tree through `react-dom/server` gave identical pixels. The approved cast motion test (`~/.hermes/spikes/motion/cast-motion-test/src/Scene.tsx`) recomputes the pieces per frame and wraps them with an `actor` transform; `pose` (§3) is that wrapper.

## 1. Decision: how pieces are written (owner-approved option A)

| Option | What | For | Against |
|---|---|---|---|
| **A. TS functions → node tree → SVG string and React** | Each piece returns a plain tree; two small renderers | One drawing for covers, diagrams and scenes; pure and testable without a browser; reads the generated TS tokens; parameters animate per frame | A small renderer pair to maintain |
| B. SVG sprite (`<symbol>` + `<use>`) | Pieces drawn once as symbols | Light for static files | Symbols cannot be re-parameterised per frame (a squash, a face); colours fixed in the symbol; `<use>` across files breaks in many viewers |
| C. Python generators (like the designer skill's scripts) | Port the scripts' approach | Matches today's diagram scripts | Second language next to the TS tokens; React scenes would need a separate copy, which is the drift ADR 0002 forbids |
| D. React only | Pieces as components; covers via `renderToStaticMarkup` | One renderer | Every cover build loads React; pieces cannot be inspected as data in tests; a static SVG path depends on React's serialisation |

**Chosen: A**, approved by the owner after the prototype. B and D lose per-frame parameters or testability, C duplicates the drawing.

## 2. Tokens

New top-level groups, accepted by the validator next to the six existing ones:

- `illustration` (colour, all required): `accent` `#1E6FEB` (block arrows, magnifier), `codePanel` `#14215A` (dark code and screen panels), `textBar` `#C9D6F5` (text lines on sheets), `healthyShade` `#2BB673` (darker green side, robot ears), and four the card did not list but the pieces need, so that no hex lives outside the source: `transitionalShade` `#E8B830` (folder back), `road` `#5B6478` (road band), `tape` `#FFE2C8` (parcel tape), `iconLine` `#B9C3E0` (EIP icon lines).
- `cover` (required): `width` 800, `height` 420, `pillHeight` 36, `labelSize` 19, `ringStep` 28, `ringWidth` 2, `ringRadius` 90 (`dimension`); `labelWeight` 800 (`fontWeight`). The outline (4) and shadow (10) stay `outline.block` and `shadow.block`; no copy. Ring count 14 is a constant of the `rings` piece.
- `coverBackground.<name>.fill` and `.ring` (`color`): one entry per measured pair. Rule: `coverBackground` holds at least one entry; each entry is a group with exactly `fill` and `ring`. Names are hues, because a background has no meaning (ADR 0003 keeps meaning for state colours); the article each pair came from is recorded here, not in the name:

| Name | fill | ring | Measured from |
|---|---|---|---|
| peach | #F4D8BC | #EAC7A3 | ai-writes-code |
| navy | #14215A | #1C2D74 | circuit-breaker |
| raspberry | #C94F7C | #BE4572 | eip-catalog-in-mulesoft |
| lavender | #B8A6F0 | #AC98EA | integration-patterns |
| plum | #3D2B66 | #483577 | cloudhub-deploy |
| cobalt | #1E4FA0 | #2758AE | delivery-path |
| sky | #BFE3F7 | #AAD5EC | gitflow |
| slate | #2E3A59 | #38466A | maven-release |
| mustard | #F2C14E | #E6B33E | pipeline-templates |
| emerald | #2F9E6E | #38AB79 | obsidian-to-site-guide |
| violet | #5B3CC4 | #6748CF | write-in-obsidian-publish-on-your-site |
| wine | #6B2340 | #7A2D4C | dip |
| cream | #FFF1C9 | #F4E2AE | isp |
| forest | #24604F | #2B6E5B | lsp |
| olive | #8A9A3B | #7E8E33 | ocp |
| salmon | #FF9E7A | #F48D68 | solid-intro |
| deepTeal | #0F6E6E | #167A79 | solid-path |
| lime | #D4EC9C | #C4E086 | srp |
| blush | #F6CFE0 | #ECBAD0 | spec-driven-development |
| mint | #CDE5D3 | #BCDAC4 | validate-ai-api-contract-change |
| teal | #1F8A8A | #2A9A99 | where-the-work-moves |

`test/fixtures/cover-backgrounds.json` pins this table; the token test compares the source with it.

## 3. Node contract, renderers, pose

```ts
type SvgTag = "svg" | "g" | "title" | "desc" | "defs" | "clipPath" | "rect" | "circle" | "ellipse" | "line" | "polyline" | "polygon" | "path" | "text";
type SvgNode = { readonly tag: SvgTag; readonly attrs: Readonly<Record<string, string | number>>; readonly children: readonly (SvgNode | string)[] };
type Drawn = { readonly body: readonly SvgNode[]; readonly text: readonly SvgNode[] };
```

- A piece is `(params) => Drawn`. `body` holds shapes, drawn inside the cover's outlined group (ink stroke `outline.block`, round joins); `text` holds words and glyphs, drawn after every body, never stroked (STY-5 of the designer rules). Pieces import `tokens/generated/tokens.ts` and nothing with side effects (no `node:fs`), so the Remotion bundle can import them.
- Hard shadow: `shadowed(shape, offset = shadow.block)` returns the same shape filled with ink and translated by the offset, then the shape. Inside the outlined group the shadow keeps the outline, like the motion components (the card's "contorno incluído").
- `toSvg(node)` writes the tree with two-space indent, attributes in insertion order, numbers through `String(n)`, `&`, `<`, `>`, `"` escaped in text and attribute values, LF line ends. Same tree, same string.
- `toReact(node)` creates React elements with each attribute renamed for React (`stroke-width` → `strokeWidth`, `clip-path` → `clipPath`, `font-family` → `fontFamily`; `aria-*`, `xmlns` and `viewBox` kept), keys by index. `renderToStaticMarkup(toReact(n))` and `toSvg(n)` describe the same elements, attributes and text in the same order; the test compares both after parsing into one normal form.
- `pose(node, { x, y, tilt = 0, squash = 1, hop = 0, scale = 1, shake = 0, opacity = 1 })` wraps a node in a `g` whose transform is `translate(x+shake y-hop) rotate(tilt) scale(scale/√squash scale·squash) translate(-x -y)` (the anchor `x, y` is the piece's base, usually its feet), plus `opacity` when below 1. With every default it returns the node itself. `squash` and `scale` must be greater than 0 and `opacity` within 0..1, else `RangeError` naming the parameter. A face, a pose of the arms or a prop are ordinary discrete parameters of a piece (AB#152 adds them for the cast); nothing else is needed from this contract.

## 4. Pieces

Every piece is `definePiece(name, schema, draw)`: calling it checks the parameters against its schema (the first problem is thrown as a `RangeError` naming the parameter: missing required, unknown name, wrong JSON type, non-finite number, out of range, unknown enum value, a colour that is not a colour token path), then draws. The cover command uses the same schema to collect every problem. Positions and sizes are cover pixels. A colour parameter is a token path whose value is `#RRGGBB` (`"color.healthy"`, `"illustration.accent"`, `"coverBackground.blush.ring"`), never a hex. Required parameters in **bold**; `n > 0` is a number greater than zero; defaults are the measured published values. Every size and coordinate lies within ±10000, so computed geometry stays finite. Pieces with fixed insets have minimum sizes, so no drawn dimension goes negative: sheet width ≥ 80, rail width ≥ 100, speechBubble ≥ 60x50, browserWindow ≥ 60x130, stamp r ≥ 12, magnifier r ≥ 12, book ≥ 30x30, muleFlow width ≥ 120, height ≥ 40, tileWidth ≥ 40. Points `[x, y]` lie within ±10000. Counts: serverStack units 1–20 (failing 0–19), steps count 1–20, gear teeth 4–64. Lists (rows, lines, nodes, tiles) hold at most 50 items.

| Piece | Anchor | Parameters and defaults | Seen in (published covers) |
|---|---|---|---|
| `pill` | centre | **x**, **y**; **text** (non-empty); fill `color.white`; width `n > 0`, default `max(68, round(len(text)·10.5+34))`; height `cover.pillHeight`; label at y+7 | 19 covers, 41 pills |
| `rings` | centre | **cx**, **cy**; radius `n > 0` = `cover.ringRadius`; color `color.ring`; 14 circles, step `cover.ringStep`, width `cover.ringWidth` | all 21 |
| `sheet` | top-left | **x**, **y**, **width**, **height** (`n > 0`); **rows**: array of `{ lead: none\|checkbox\|checked\|question = none, **bar** n > 0, tail: none\|check = none }`; top 46; step 38; fill `color.white`; leadFill `color.caller`; tick `illustration.accent` | ai-writes-code, maven-release, isp, ocp, spec-driven, validate, where-the-work-moves |
| `blockArrow` | tail, vertical centre | **x**, **y**; length 50; fill `illustration.accent`; points right; shaft half-height 12, head half-height 26, head length `min(30, 0.56·length)` | ai-writes-code, spec-driven (blue); gitflow, maven-release, pipeline-templates, ocp (white) |
| `arcArrow` | its points | **from**, **c1**, **c2**, **to** (`[x, y]`, cubic Bézier); color `color.white`; dashed false (`9 8`); width 6, or 4 when dashed; chevron head at `to`, arms 14 at ±40° to the end tangent | circuit-breaker, cloudhub (dashed), dip, lsp, solid-intro (dashed), where-the-work-moves |
| `rail` | top-left | **x**, **y**, **width**; **nodes**: array (≥ 1) of colour tokens, spread evenly from x+40 to x+width−60; fill `illustration.codePanel`; thickness 44 | gitflow, pipeline-templates, solid-intro, srp |
| `checkBadge` | centre | **cx**, **cy**; r 16 | delivery-path, gitflow, solid-intro, validate |
| `priceTag` | left tip | **x**, **y**; **text**; width 128 (height 48); fill `color.white`; stringFrom `[x, y]` optional; text in the mono font, 22 px | maven-release, pipeline-templates, write-in-obsidian |
| `nameTag` | hang point and tag top | **hangX**, **hangY**, **cx**, **top**; rotate 0; **icon** (one of the 26 names, drawn at scale 1.18); fill `color.transitional`; tag 96x92 | integration-patterns (3) |
| `codePanel` | top-left | **x**, **y**, **width**, **height**; **lines**: array of `{ **indent** ≥ 0, **w** n > 0, **color** healthy\|caller\|white\|backend, tall false }`; top 38; step 22 | ai-writes-code, spec-driven, validate |
| `serverStack` | top-left | **x**, **y**; width 150; units 3 (integer ≥ 1); fill `color.backend`; failing: index (integer ≥ 0) of the unit with the red light, none by default | circuit-breaker, dip, lsp |
| `cloud` | centre | **cx**, **cy**; scale 1 (about 190x90 at 1); fill `color.white` | delivery-path, gitflow, obsidian-to-site-guide |
| `stamp` | centre | **cx**, **cy**; **word**; fill `color.healthy`; r 40; rotate −12; shape round (dashed inner ring) \| rect (3.2r x 1.4r) | spec-driven (round), validate (rect) |
| `robot` | top centre of the body | **cx**, **top**; 160x152 body; resized with `pose` | ai-writes-code, validate |
| `magnifier` | lens centre | **cx**, **cy**; r 50; color `illustration.accent` | ai-writes-code, eip-catalog |
| `gear` | centre | **cx**, **cy**; r 84 (root 0.78r, hub 0.36r); teeth 12 (integer ≥ 4); fill `color.transitional` | maven-release, obsidian-to-site-guide |
| `parcel` | top-left | **x**, **y**; size 96 (height 0.8·size); fill `color.blocked`; tape 24 wide `illustration.tape` | cloudhub (3), maven-release |
| `road` | its path | **d**: SVG path data (commands and numbers only); band `illustration.road` 40 px, white dashes `14 12` | delivery-path, solid-path |
| `milestonePin` | foot of the stem | **x**, **y**; **text**; fill `color.healthy`; stem 44; head r 18 | delivery-path, solid-path |
| `browserWindow` | top-left | **x**, **y**; width 200; height 140 | write-in-obsidian (1) |
| `speechBubble` | top-left | **x**, **y**, **width**, **height**; fill `color.caller`; tail at the bottom left | spec-driven, validate |
| `steps` | bottom-left | **x**, **y**; count 4 (integer ≥ 1); width 145; rise 40; fill `color.caller` | obsidian-to-site-guide (1) |
| `folder` | top-left of the back | **x**, **y**; scale 1 (190x198 at 1) | write-in-obsidian (1); the setup-overview body diagram draws two |
| `book` | top-left | **x**, **y**; width 120; height 200 | integration-patterns (1) |
| `muleFlow` | top-left | **x**, **y**, **width**; height 104; **tiles**: array (≥ 1) of `{ **x**, **kind** scatter-gather\|choice\|for-each }`; tileWidth 86; fill `color.caller` | integration-patterns: three repeated processor glyphs, so a piece by the repetition rule |
| `eipIcon` | top-left of the 64x40 box | **name** (one of the 26); **x**, **y**; scale 1 | eip-catalog, integration-patterns |

"(1)" marks a piece seen once among the covers, kept because the card lists it and a body diagram or the EIP series reuses it. Sources were checked by eye on a contact sheet of the 21 covers and by grep on 2026-10-23.

Words: only `pill.text`, `stamp.word`, `priceTag.text`, `milestonePin.text` and the cover's title and description carry words, all from the caller. The `?` of a question row and the tick are glyphs, not words. A piece never invents a label (ADR 0004). The stamp's word turns with the stamp, as on the published spec-driven cover; ADR 0003 no longer forbids rotated text (amended in this change, §9).

Geometry: the pieces present in the prototype are ported as they were approved; `arcArrow`, `gear`, `road`, `steps`, `folder`, `priceTag` and the rect `stamp` take their geometry from the covers listed. The implementation in this pull request is the reference for the exact coordinates; the golden SVGs (§7) lock them.

## 5. EIP icons as data

`src/pieces/eip-icons.ts` holds the 26 icons as `{ name, title, description, nodes }`, `name` being the file name without `eip-` and `.svg`. The 26 names, in order: aggregator, canonical-data-model, channel-adapter, claim-check, competing-consumers, content-based-router, content-enricher, content-filter, correlation-identifier, dead-letter-channel, event-driven-consumer, guaranteed-delivery, idempotent-receiver, invalid-message-channel, message-expiration, message-filter, message-translator, point-to-point-channel, polling-consumer, process-manager, publish-subscribe-channel, request-reply, return-address, scatter-gather, splitter, transactional-client, `nodes` the icon's drawing in its 64x40 box with every colour replaced by its token (the seven colours of §Context map to `color.ink`, `color.white`, `color.healthy`, `color.transitional`, `color.caller`, `color.backend`, `illustration.iconLine`). The module is source, not generated: it was imported once from the published files and is edited like any other code. `eipIcon({ name, x, y, scale })` wraps the nodes in `g transform="translate(x y) scale(s)" stroke="none"` so the cover's outline does not leak into the icon. The module header and the README carry the CC BY 4.0 credit; every icon keeps its `description`.

## 6. Cover spec and CLI

Cover spec (JSON, UTF-8), kept next to the article in the vault:

```json
{
  "id": "sdd",
  "title": "A one-line request becomes a reviewed spec before any code",
  "description": "Illustration. …",
  "background": "blush",
  "rings": { "cx": 400, "cy": 220, "radius": 96 },
  "pieces": [
    { "piece": "speechBubble", "x": 52, "y": 174, "width": 160, "height": 74 },
    { "piece": "pill", "x": 132, "y": 174, "text": "request", "width": 104 }
  ],
  "custom": { "tag": "g", "attrs": {}, "children": [] }
}
```

- `id`: safe slug (`^[a-z0-9]+(?:-[a-z0-9]+)*$`), prefixes the `title`, `desc` and clip-path ids so several covers can sit in one page. `title`, `description`: non-empty strings. `background`: a `coverBackground` name. `rings`: `cx`, `cy` required, `radius` optional. `pieces`: array in paint order, each with `piece` and that piece's parameters. `custom`: optional, one node tree.
- Values: numbers are finite; colours are token paths of type `color`; a string that looks like a colour literal (`#…`, `rgb(`, `hsl(`) is rejected anywhere in the spec.
- `custom` allows the drawing tags (`g`, `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon`, `path`, `text`) and only these attributes: geometry `x y width height rx ry cx cy r x1 y1 x2 y2 points d`, paint `fill stroke stroke-width stroke-linecap stroke-linejoin stroke-dasharray opacity fill-opacity stroke-opacity`, text `font-size font-weight font-family text-anchor`, and `transform`. Values are finite numbers or strings; no value may contain `url(` or `:` followed by `//` (no external or internal references); `fill` and `stroke` are `none` or a colour token path; `transform` holds only `translate(...)`, `rotate(...)` and `scale(...)`, so its value is always a plain transform; `d` and `points` hold only path commands, digits, signs, dots, commas and spaces. A text child (string) is only allowed inside a `text` node, and every `text` node of `custom` is written with `stroke="none"` so the outline does not stroke its letters. One `custom` per spec is structural (a single object, not an array). "A repeated object becomes a piece" is a review rule for AB#140: the CLI cannot tell a repeated object from two different ones.
- Output: `svg` 800x420 with `role="img"`, `aria-labelledby`, `font-family` sans; `title`, `desc`, a clip-path rect, the background rect, the rings (clipped), one `g` with the outline holding every body and then `custom`, then one `g` with the label style holding every text. Trailing LF.
- Validation runs in stages and every problem names its JSON path. Stage 1, JSON: invalid JSON is one problem, and nothing else is checked. Stage 2, shape: a root that is not an object is one problem. Stage 3, fields: unknown top-level keys, `id`, `title`, `description`, `background`, `rings`, each entry of `pieces` and `custom`. A container whose own shape is wrong (`pieces` not an array, an entry not an object, an unknown `piece`) is reported once and its children are not checked. A colour literal is reported once at its path ("colour literals are not allowed; use a token path") and replaces any other problem at that same path. Problems are sorted by path (segments compared one by one, array indexes as numbers, names by code point), then by message.
- `npm run cover -- <spec.json> --out <file.svg>`: one spec path and one `--out` ending in `.svg`, whose folder exists and which is not itself a folder. Invocation problems come first (only the first is reported, with the usage, as `stills`/`render` do), then every spec problem, one line each. Success prints `wrote <out>`. The file is written to a temporary file in the same folder and renamed over the target, so a failed write (`cannot write <out>: <reason>`, exit 1) leaves an existing cover untouched.

## 7. Parity proof

Fixtures: `test/fixtures/covers/{spec-driven-development,ai-writes-code,integration-patterns}.json`, the three published proof covers written as specs (title and description copied verbatim from the published files), and the SVGs the CLI writes from them (`*.svg`, golden). The goldens lock the output against regressions; they do not prove that it looks like the published cover. That proof is visual and local:

- Baseline: the published files in the vault (brain `f536637`), SHA-256 `2324684f…fc77e1` (`spec-driven-development-card.svg`), `36f6e214…58ca6` (`ai-writes-code-card.svg`), `e8c2ae0c…443692` (`integration-patterns-card.svg`); the full hashes are in `test/fixtures/covers/README.md`. They are the covers shown on brunosouzas.com with each article.
- Environment: `rsvg-convert` 2.63.2 (cairo 1.18.6, pango 1.58.2), ffmpeg 9.0.1, Lato installed locally.
- Command, per cover: `rsvg-convert -w 800 <svg> -o <png>` for both files, then `ffmpeg -i published.png -i rebuilt.png -lavfi psnr -f null -`; the `average` value must be at least 39.4, 31.8 and 23.3 dB, the prototype's measurement (first run of this implementation: 39.8, 35.2 and 23.4).
- The owner judges the side-by-side contact sheet at gate 1; no model scores it (AGENTS.md).

CI test: building each fixture equals its golden byte for byte, and the React path equals the SVG path (§3).

## 8. Risks

- Lato 800 is not in Google Fonts; covers name 800 and rely on the reader's font fallback, as today. Not changed here.
- Measured PSNR depends on `rsvg-convert` and the installed Lato; the thresholds are evidence for the owner, not a CI gate.
- The free-form object is author input that ends up public: the tag and attribute allowlist (§6) is the safeguard.

## 9. Decisions at gate 1 (owner, 2026-10-23)

1. **Hue names** for the 21 backgrounds. The owner also wants each background used by only one cover, with a record so the designer does not repeat one. The 21 measured fills are already distinct. Who uses which pair is a fact about vault covers, drafts included, so it cannot live in this public repository: the check belongs with the cover specs (AB#140, a command that scans the vault's cover specs and fails on a background used twice). A new cover beyond the 21 needs a new pair, added to `tokens/source.json` and the fixture in its own change.
2. **The four extra `illustration` colours:** accepted.
3. **The three proof covers as public fixtures:** accepted. The site is not announced yet, so the cover port (AB#140) can change published covers freely: port one cover, check it on the site, then port the rest in batches checked on the site (revert and redo on error), not one PSNR at a time and not all in one session, to spare the AI quota.
4. **`muleFlow` as a piece:** accepted.
5. **Rotated text:** the rule is removed from ADR 0003 (amendment in this change); the owner judges each image. Free-form transforms accept `rotate` too.

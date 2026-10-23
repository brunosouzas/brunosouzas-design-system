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

All take positions and sizes in cover pixels; every colour parameter is a token path (`"color.healthy"`, `"illustration.accent"`) resolved to its value, never a hex. Defaults are the measured published values. Sources: the published covers where the piece appears (checked by eye on a contact sheet of the 21 covers and by grep, 2026-10-23); "(1)" marks a piece seen once among covers, kept because the card lists it and a body diagram or the EIP series reuses it.

| Piece | Parameters (besides position) | Seen in |
|---|---|---|
| `pill` | `text`, `fill` (white), `width` (from text length: `max(68, round(len·10.5+34))`) | 19 covers, 41 pills |
| `rings` | `cx`, `cy`, `radius` (`cover.ringRadius`), `color` (the background's ring) | all 21 |
| `sheet` | `width`, `height`, `rows` (`lead`: none, checkbox, checked, question; `bar` width; `tail`: check), `top`, `step`, `fill` | ai-writes-code, maven-release, isp, ocp, spec-driven, validate, where-the-work-moves |
| `blockArrow` | `length`, `fill` (`illustration.accent`), direction right | ai-writes-code, spec-driven (blue); gitflow, maven-release, pipeline-templates, ocp (white) |
| `arcArrow` | `from`, `c1`, `c2`, `to` (cubic), `color` (white), `dashed`, `width` (6, dashed 4) and a chevron head at `to` | circuit-breaker, cloudhub (dashed), dip, lsp, solid-intro (dashed), where-the-work-moves |
| `rail` | `width`, `nodes` (colour tokens), `fill`, `thickness` | gitflow, pipeline-templates, solid-intro, srp |
| `checkBadge` | `r` | delivery-path, gitflow, solid-intro, validate |
| `priceTag` | `width`, `text`, `fill`, string to an anchor point | maven-release, pipeline-templates, write-in-obsidian |
| `nameTag` | `rotate`, string from a hang point, `content` (one EIP icon) | integration-patterns (3) |
| `codePanel` | `width`, `height`, `lines` (`indent`, `w`, colour role, `tall`), `top`, `step` | ai-writes-code, spec-driven, validate |
| `serverStack` | `width`, `units`, `fill`, `failing` unit | circuit-breaker, dip, lsp |
| `cloud` | `scale`, `fill` | delivery-path, gitflow, obsidian-to-site-guide |
| `stamp` | `word`, `fill`, `r`, `rotate`, `shape` (round, rect) | spec-driven (round), validate (rect) |
| `robot` | `width`, `height` | ai-writes-code, validate |
| `magnifier` | `r`, `color` | ai-writes-code, eip-catalog |
| `gear` | `r`, `teeth`, `fill`, hub `r` | maven-release, obsidian-to-site-guide |
| `parcel` | `size`, `fill` | cloudhub (3), maven-release |
| `road` | `d` (path), band `illustration.road` 40 px, white dashes `14 12` | delivery-path, solid-path |
| `milestonePin` | `text`, `fill`, stem height | delivery-path, solid-path |
| `browserWindow` | `width`, `height` | write-in-obsidian (1) |
| `speechBubble` | `width`, `height`, `fill` | spec-driven, validate |
| `steps` | `count`, step `width`, `rise`, `fill` | obsidian-to-site-guide (1) |
| `folder` | `width`, `height` | write-in-obsidian (1); the setup-overview body diagram draws two |
| `book` | `width`, `height` | integration-patterns (1) |
| `muleFlow` | `width`, `height`, `tiles` (x and kind: scatter-gather, choice, for-each), `fill` | integration-patterns: three repeated processor glyphs, so a piece by the repetition rule |
| `eipIcon` | `name` (one of the 26), `scale` | eip-catalog, integration-patterns |

Words: only `pill.text`, `stamp.word`, `priceTag.text`, `milestonePin.text` and the cover's title and description carry words, all from the caller. The `?` of a question row and the tick are glyphs, not words. A piece never invents a label (ADR 0004).

Geometry of the pieces present in the prototype is ported as is; `arcArrow`, `gear`, `road`, `steps`, `folder`, `priceTag` and the rect `stamp` take their geometry from the source covers above.

## 5. EIP icons as data

`src/pieces/eip-icons.ts` holds the 26 icons as `{ name, title, description, nodes }`, `name` being the file name without `eip-` and `.svg` (`aggregator` … `transactional-client`), `nodes` the icon's drawing in its 64x40 box with every colour replaced by its token (the seven colours of §Context map to `color.ink`, `color.white`, `color.healthy`, `color.transitional`, `color.caller`, `color.backend`, `illustration.iconLine`). The module is source, not generated: it was imported once from the published files and is edited like any other code. `eipIcon({ name, x, y, scale })` wraps the nodes in `g transform="translate(x y) scale(s)" stroke="none"` so the cover's outline does not leak into the icon. The module header and the README carry the CC BY 4.0 credit; every icon keeps its `description`.

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
- `custom` allows the drawing tags (`g`, `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon`, `path`, `text`) and attribute names matching `^[a-z][a-z-]*$`, except `on*`, `href`, `style` and `class`. One `custom` per spec is structural (a single object, not an array). "A repeated object becomes a piece" is a review rule for AB#140: the CLI cannot tell a repeated object from two different ones.
- Output: `svg` 800x420 with `role="img"`, `aria-labelledby`, `font-family` sans; `title`, `desc`, a clip-path rect, the background rect, the rings (clipped), one `g` with the outline holding every body and then `custom`, then one `g` with the label style holding every text. Trailing LF.
- `npm run cover -- <spec.json> --out <file.svg>`: one spec path and one `--out` ending in `.svg`, whose folder exists. Problems are found before anything is written: invocation problems first (only the first is reported, with the usage, as `stills`/`render` do), then every spec problem, one line each, `<json path>: <message>`, sorted by path. Success prints `wrote <out>`. An existing file is replaced.

## 7. Parity proof

Fixtures: `test/fixtures/covers/{spec-driven-development,ai-writes-code,integration-patterns}.json`, the three published proof covers as specs, and the SVGs the CLI writes from them (`*.svg`, golden). CI test: building each fixture equals its golden byte for byte, and the React path equals the SVG path (§3). Local check (needs `rsvg-convert` and ffmpeg, not in CI): render each golden and the published cover at 800 px and measure PSNR; expected at least the prototype's 39.4, 31.8 and 23.3 dB. The gate-1 contact sheet shows published and rebuilt side by side, plus the catalogue of every piece.

## 8. Risks

- Lato 800 is not in Google Fonts; covers name 800 and rely on the reader's font fallback, as today. Not changed here.
- Measured PSNR depends on `rsvg-convert` and the installed Lato; the thresholds are evidence for the owner, not a CI gate.
- The free-form object is author input that ends up public: the tag and attribute allowlist (§6) is the safeguard.

## 9. Decisions for gate 1 (recommendation first)

1. Hue names for the 21 backgrounds (alternative: names of the articles, which tie a colour to one article).
2. Four extra `illustration` colours (`transitionalShade`, `road`, `tape`, `iconLine`), so no piece holds a hex (alternative: draw those parts with existing tokens and accept a visible change).
3. The three proof covers as public fixtures: they are published, and CI needs them (alternative: keep them in the vault and run parity only locally).
4. `muleFlow` as a piece (alternative: the integration-patterns cover's one free-form object).

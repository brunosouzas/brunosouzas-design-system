# Design: designer-formats

## 1. Measures (from the published files)

Brain vault `50-writing`, commit `18ffd2e`, measured by script on 2026-10-24:

- **28 body diagrams** (14 PT/EN pairs): `width="800"`, height 360 to 1016, panel `rect rx="14"` in `#EEF2FF` (`color.panel`), rings stroked `#E0E7FB` (`color.ring`) at width 2, first radius 70, step 28, 30 to 41 rings (most off the frame, clipped).
- **Start dot** in `circuit-breaker-in-mulesoft/images/circuit-breaker-states-en.svg`: `<circle cx="44" cy="120" r="11" fill="#0A1033"/>`, no outline, no shadow.
- **26 EIP icons** in `integration-patterns-in-mulesoft/images/icons/eip-*.svg`: 64x40, `title` and `desc` (with the CC BY 4.0 credit), then the icon's nodes. They are the data of `EIP_ICONS` already.

Tokens: `bodyDiagram.width` 800, `layoutWidth` 560, `radius` 14, `ringRadius` 70, `startRadius` 11 (`dimension`, shown size). The frame divides by `width / layoutWidth` where it needs layout units: rx 9.8, first radius 49, ring step 19.6, ring width 1.4, start radius 7.7. Ring step and width stay the cover tokens (28, 2): one family, one ring.

## 2. Frame of a diagram

Order: `title`, `desc`, `defs` with the clip path (rect `rx` 9.8), panel rect (`rx` 9.8, `color.panel`), the rings clipped by `<id>-frame`, then one group clipped by `<id>-frame` holding the outlined group (ink, `map.outline` 3, round joins) and the label group (`map.labelSize` 13, `cover.labelWeight`, ink, middle). Root: `width` 800, `height` `height × 800 / 560` rounded to two decimals, `viewBox="0 0 560 <height>"`. Rounding to whole pixels would change the scale of small diagrams (`height` 1 would show 560 wide in an 800 box); two decimals keep the scale within 0.005 px at any height. Heights such as 322 (shown 460) give whole pixels.

The rings are drawn by the frame (circles in one stroked group), not by the `rings` piece, whose step and width are the cover's and whose `count` stops at 1000. A diagram's count can reach 1155 (`height` 10000, centre at -10000, -10000, radius near 0).

Why `map.outline` and `map.labelSize` and not the cover's 4 and 19: a diagram is drawn in map units; at 800/560 they show as 4.3 and 18.6, the published sizes. Pieces that set their own stroke and text size (every diagram piece) are not affected.

## 3. Text tables (decision)

| Option | For | Against |
|---|---|---|
| **A. `text` tables in the spec, `@key` references, `--lang`** (chosen) | One spec per diagram, as the published PT/EN pairs share every coordinate; the validator sees both languages' tables | A reference syntax to learn |
| B. Two specs written by a consumer script | No new syntax | Coordinates copied twice and drifting; the consumer needs a script again, the thing the format removes |

Rules: a reference is a whole string matching `^@[A-Za-z][A-Za-z0-9_-]*$`, anywhere outside `text` (pieces, `custom` text children, `title`, `description`). It is replaced by the table's value, string or array, once. Without `text` nothing is resolved, so every existing spec and golden keeps its bytes, and a label such as `@home` stays literal. Every language defines the same keys, checked whatever `--lang` names, so a missing translation is caught on the first build. The spec is resolved for the chosen language, then validated and drawn as today; problems keep the paths of the source.

Ids gain the language (`<id>-pt`) so a page that inlines both images, or a sheet that nests them, has no duplicate ids (decision 4).

API: `validateCoverSpec(spec, options?: { lang?: string })` and `coverTree(spec, options?: { lang?: string })`; `buildCover(text, label, lang?)` in the command. Calls without options behave as today.

## 4. `stateStart`

`{ cx, cy, r?, surface? }`, one circle, fill `tokens.surface[surface].text` (`#0A1033` light, `#EEF2FF` dark, where ink would disappear), `stroke="none"` so the cover command's outlined group does not add a 4-wide ink ring. Default `r` = 11 × 560 / 800 = 7.7, the published dot in layout units.

Rejected: a `state: "start"` on `stationMarker`. That piece is a white ink sticker with a hard shadow; the start dot has neither, so the new value would change every layer of the piece.

## 5. Icons

An icon spec is `{ id, format: "icon", pieces: [one icon piece], title?, description? }`. `x` and `y` default to 0 and must be 0; the box is the piece's own (64 × 40 × `scale`, `size` × `size`). No outlined or label group: icon pieces carry their strokes in their own group (`stroke: none`). For `eipIcon`, `title` and `description` are the icon's data (decision 3), so the credit cannot be dropped or misspelled. The spike drew all 26 EIP icons this way: each PNG at 256 px is pixel-identical to the published file (PSNR inf).

## 6. `customAt`

An integer from 0 to `pieces.length`; `custom` is spliced into the outlined group before the bodies of `pieces[customAt]`. Omitted means `pieces.length`, today's place. Labels stay in the label group, above every shape, as now. Refused in icon specs.

## 7. Spike evidence

`~/.hermes/spikes/design-system/designer-formats/` (outside the repository): `spike.mts` (prototype of the frame, tables, `stateStart`, icon box and `customAt`, from the pieces), `sheet.py`, `contact-sheet.png`. Rows: (1) the published EN state diagram next to the diagram format from one spec; (2) the PT build and a 375 px phone render; (3) the 26 EIP icons, a `uiIcon` and a `linkIcon` in icon format; (4) the consumer's circuit breaker cover with the OPEN pill over the breaker, today and with `customAt` 6. PSNR of the diagram format against the published diagram at 800: 22.4 dB (EN) and 22.1 dB (PT). The difference is the shadow depth (5 instead of 8 at 800, README "Body diagrams") and arrowheads; layout, rings and words match. At 375 px the edge labels are about 5 px high, as on the published diagram at that width.

## 8. Fixtures

Task 4.4 writes these files byte for byte (LF ending).

`test/fixtures/covers/circuit-breaker-states.json` is the file `~/.hermes/spikes/design-system/designer-formats/circuit-breaker-states.json` as rendered in the spike, reproduced here:

```json
{
  "id": "circuit-breaker-states",
  "format": "diagram",
  "height": 322,
  "title": "@title",
  "description": "@description",
  "rings": { "cx": 280, "cy": 161 },
  "text": {
    "en": {
      "title": "Circuit breaker states",
      "description": "State diagram. The circuit starts CLOSED. CLOSED moves to OPEN when the failure rate in the window exceeds the threshold, with a minimum call count. OPEN moves to HALF_OPEN when the wait period (resetTimeout) elapses. HALF_OPEN moves back to CLOSED after enough successful test calls, and back to OPEN on any failure during the test.",
      "open": ["failure rate in the window", "> threshold"],
      "openNote": ["(with a minimum call count)"],
      "half": ["wait period", "(`resetTimeout`)", "elapses"],
      "fail": ["any failure", "during the test"],
      "close": ["enough successful", "test calls"]
    },
    "pt": {
      "title": "Estados do circuit breaker",
      "description": "Diagrama de estados. O circuito começa em CLOSED. CLOSED vai para OPEN quando a taxa de falha na janela passa do limite, com um mínimo de chamadas. OPEN vai para HALF_OPEN quando o tempo de espera (resetTimeout) expira. HALF_OPEN volta para CLOSED quando há chamadas de teste com sucesso suficiente, e volta para OPEN com qualquer falha durante o teste.",
      "open": ["taxa de falha na janela", "> limite"],
      "openNote": ["(com mínimo de chamadas)"],
      "half": ["tempo de espera", "(`resetTimeout`)", "expira"],
      "fail": ["qualquer falha", "durante o teste"],
      "close": ["chamadas de", "teste com sucesso", "suficiente"]
    }
  },
  "pieces": [
    { "piece": "stateStart", "cx": 30.8, "cy": 84 },
    { "piece": "messageArrow", "from": [40, 84], "to": [67, 84], "curve": "straight", "width": 2.1 },
    { "piece": "messageArrow", "from": [203, 84], "to": [373, 84], "curve": "straight", "width": 2.1 },
    { "piece": "messageArrow", "from": [464.8, 116.2], "controls": [[464.8, 196], [437.5, 243.6]], "to": [366.8, 249.2], "width": 2.1 },
    { "piece": "messageArrow", "from": [329, 224], "controls": [[350, 189], [392, 154]], "to": [415.8, 119], "width": 2.1 },
    { "piece": "messageArrow", "from": [210, 249.2], "controls": [[126, 246.4], [105, 196]], "to": [133, 119], "width": 2.1 },
    { "piece": "diagramBox", "x": 70, "y": 56, "width": 130, "height": 56, "text": ["CLOSED"], "fill": "color.healthy", "textSize": 15.4 },
    { "piece": "diagramBox", "x": 375.2, "y": 56, "width": 130, "height": 56, "text": ["OPEN"], "fill": "color.blocked", "textSize": 15.4 },
    { "piece": "diagramBox", "x": 212.8, "y": 221.2, "width": 147, "height": 56, "text": ["HALF_OPEN"], "fill": "color.transitional", "textSize": 15.4 },
    { "piece": "edgeLabel", "x": 288, "y": 62, "lines": "@open", "textSize": 10.5 },
    { "piece": "edgeLabel", "x": 288, "y": 101.5, "lines": "@openNote", "textSize": 9.8 },
    { "piece": "edgeLabel", "x": 473.2, "y": 165.2, "lines": "@half", "anchor": "start", "textSize": 10.5 },
    { "piece": "edgeLabel", "x": 354.2, "y": 165.2, "lines": "@fail", "anchor": "end", "textSize": 10.5 },
    { "piece": "edgeLabel", "x": 66.5, "y": 176.4, "lines": "@close", "textSize": 10.5 }
  ]
}
```

Goldens: `circuit-breaker-states-pt.svg` and `circuit-breaker-states-en.svg`, written by the command with `--lang pt` and `--lang en`. Published sources: `50-writing/circuit-breaker-in-mulesoft/images/circuit-breaker-states-{pt,en}.svg`.

`test/fixtures/covers/eip-splitter.json`:

```json
{
  "id": "eip-splitter",
  "format": "icon",
  "pieces": [{ "piece": "eipIcon", "name": "splitter" }]
}
```

Golden `eip-splitter.svg`; published source `50-writing/integration-patterns-in-mulesoft/images/icons/eip-splitter.svg`.

Both may be public: they redraw images already published on brunosouzas.com, like the proof covers.

## 9. Gate-1 decisions

1. **Version.** Recommended: 0.4.0, because two formats and text tables are new features (the repository's rule: an additive token or piece is a patch, a feature is a minor); the cast (AB#152) then becomes 0.5.0. Alternative: 0.3.3, as the request proposed. The cast is not folded in either way: the designer uses none of its pieces.
2. **Backgrounds.** Recommended: no new pair now; the README's "Each pair is used by one cover only" becomes "Which covers may share a pair is the `designer` skill's rule", and COV-4 changes in the kit (for example, no two covers within the same listing page share a pair). Alternative A: new pairs in this release; then a contact sheet of candidates comes before implementation, and this blocks it.
3. **EIP icon text.** Recommended: title and description from the icon's data, refused in the spec (design §5). Alternative: allowed, with the credit required in the description.
4. **Ids per language.** Recommended: `<id>-<code>` (design §3). Alternative: the id as written, the consumer writing one id per language by hand.

## 10. Order of the new checks

Every new problem joins the existing sorted list. Format-specific refusals (`background` on a diagram, `height` on a cover, the icon keys) replace the key's usual check, so each path has one problem. The text checks run first. When the tables are broken or `--lang` cannot pick one, only those problems (`text.*`, `text`) are printed and the rest of the spec is not checked, because its references cannot be resolved and checking them unresolved would report false problems (`"@open"` is not an array of lines). Otherwise the resolved spec is checked as a whole.

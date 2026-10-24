# Design: piece-params

The normative drawing is the spike's candidate, `~/.hermes/spikes/design-system/ab190-piece-params/spike.diff` (SHA-256 in §6). The spike renders the port's seven specs (copied into `specs/` from the vault at `82496cb`) with 0.5.0 and with the candidate (`specs-candidate/`, written by `candidate-specs.py`), and the contact sheets `sheet-375.png` (published, 0.5.0, candidate at phone width) and `sheet-800.png` show them. Every number in the spec comes from `probe.mts` run on the candidate.

## 1. `milestonePin.size`

`size` is the head's radius, a number from 6 to 48, default 18. With k = `size` / 18: the head's centre is at `y − stem − 14k`, its `stroke-width` is `3k` (`outline.small` × k), and the label's baseline is at `y − stem − 7k`; these three are rounded to two decimals, and only when `size` is given. The head's `r` and the label's `font-size` are `size` as given (a size is never rounded); without it the piece evaluates the 0.5.0 expressions unchanged, so no 0.5.0 call changes a byte. The stem keeps its own `stem` and the group's ink outline.

Why the radius and not a scale factor: the request measured the published head as a radius (26), and the port writes measures, not ratios. Why 6 to 48: the same range as the body diagram pieces' `textSize`, so one rule covers every size of text a piece takes; at 6 the outline is 1 and still draws, at 48 the head is 96 across, wider than any published pin.

## 2. `countBadge.textSize`

`textSize` is a number from 6 to 48, default `map.countTextSize` (11). With k = `textSize` / 11: without `height`, the height is `map.countHeight × k` (16k, rounded to two decimals); without `width`, a text of more than one character is `max(height, (6.4 × characters + 8) × k)` wide, the product rounded to two decimals; the baseline is `cy + 4k`. A given `height` or `width` wins, as today. Without `textSize`, k is 1 and every expression is the 0.5.0 one.

The room rule ("Room for the outline") applies to the derived height too. When the height comes from `textSize` (no `height` given), the rounded derived height is checked, and a height below 4 × `map.outline` × `inkScale` is reported naming `textSize`, the parameter the caller passed. At `inkScale` 1, `textSize` 8.249 still passes (16 × 8.249 / 11 rounds to 12) and 8.24 does not (11.99).

## 3. Code in a pill

`pill.text` follows "Code in words": with an even number of backticks, each part between them becomes a `tspan` with `font-family` `font.mono`. With an even number of backticks, the default width counts the characters without them; otherwise it uses `length` as in 0.5.0, backticks included (`"abcd\`ef"` stays 108 wide).

Options (gate-1 decision 1):

| | Backticks (chosen) | `mono: true` |
|---|---|---|
| Fits the package | Same syntax as the ten body diagram pieces (AB#141), which the `designer` skill already writes | A second way to say "code" |
| Partial code | `deploy to \`prod\`` works | Whole text only |
| 0.5.0 bytes | A pill whose text has an even number of backticks changes (it drew the backticks literally); no vault spec has one (all 32 specs checked) | No call changes |

The frozen fixture keeps one such call (`text: "a \`b\` c"`); its test expects the new drawing, so the exception is explicit.

## 4. `messageArrow.heads`

`heads` is `end` (default), `start` or `both`. A head at `from` mirrors the one at `to`: it points back at `from` from the first of `c1`, `c2`, `to` that differs from `from` when `controls` are given; from the horizontal when the curve is `bezier` and not straight; otherwise along the segment. The path starts at the base of that head (`from` moved 5 × `width` along it); with `controls` this is the `start` of `M start C c1 c2 end` ("Message arrow through control points", modified). The middle label, the fallback to straight and the controls rule do not change.

Room: one head needs a distance of 10 × `width` as today; `both` needs 20 × `width`, rejected naming `to` below it.

`head: false` with any `heads` value is rejected naming `heads` (gate-1 decision 2). Alternatives: `head: false` wins (silently drops what the caller asked for), or `heads` wins (`head` becomes meaningless). `head: true` with `heads` is accepted: `true` is the default.

## 5. `messageArrow.dashed`

`dashed` is a boolean. Without it, `reply`, `failure` and `failFast` are dashed and `message` is solid, as in 0.5.0. `dashed: false` draws any kind solid; `dashed: true` dashes a `message`. The dash keeps its values and its place as the path's last attribute.

## 6. Proof that 0.5.0 calls keep their bytes

`test/fixtures/pieces-0.5.0.json` (44 calls: 4 `milestonePin`, 10 `countBadge` in both surfaces, 5 `pill`, 25 `messageArrow` over the four kinds, straight, curved, through controls, without a head, on dark with a label) was written by `scripts/freeze-pieces-0.5.0.ts` on `origin/main` (`f91ba2e`) and committed alone as `d65acda`, before any code. File SHA-256: `3f205082b3f3b35476c9d38d17e014cae9fe9e8e0ec950dcdedbdd9828fe2b01`. Each entry is `{ piece, params, tree, svg }`, `svg` being the body then the text nodes through `toSvg`, joined with no separator. On the candidate, 43 calls are unchanged and the pill `"a \`b\` c"` changes as §3 says (`check-frozen.mts`). The cover goldens in `test/fixtures/covers/` stay byte-identical.

Spike files: `spike.diff` SHA-256 `0e67b2e36c203ba9ec45683200132966a2a9682dc080e1958ab429cc61c3e9f9`; `probe.mts` output in `probe-output.txt`.

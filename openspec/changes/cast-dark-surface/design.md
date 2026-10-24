# Design: cast-dark-surface

## 1. Source

Spike: `~/.hermes/spikes/design-system/ab187-cast-dark-surface/`.

- `sheet.mts` / `contact-sheet.png`: the three gate-1 options (rim none / whole outline / body only; ground `cast.ground` / `surface.dark.shadow` / `surface.dark.grid`; faces at 2x).
- `spike.diff` (SHA-256 `443df1c1a6823838471aea8f00dcd7667b39b58a670871a4739ef660b6f6da4d`): the candidate code, normative for the implementation.
- `candidate.mts` / `candidate.png`: the candidate on light and dark, with the 375 px row.
- `probe.mts` / `probe-output.txt`: hashes per call for `surface` omitted, `light`, `dark`. Omitted equals `light` for every one of the 45 pairs.
- `fixture.mts`: writes `test/fixtures/cast-dark-0.5.2.json`.

Gate-1 answers (Bruno, 2026-10-24): rim on the whole outline; ground `surface.dark.grid`; faces unchanged.

## 2. Options considered

| Rim | Effect on navy (contact sheet rows 1a–1c) |
|---|---|
| None | Shadows back, but ink arms and legs disappear |
| Body only | Body reads, arms in `wave`/`reach` still lost |
| **Whole outline** (chosen) | Every limb and prop reads, also at 375 px |

| Ground | Effect |
|---|---|
| `cast.ground` (today) | Light patch, the defect AB#187 reports |
| `surface.dark.shadow` | Too strong; competes with the hard shadow |
| **`surface.dark.grid`** (chosen) | As discreet as `cast.ground` on white |

## 3. The dark drawing

The light tree is built as in 0.5.0, then rewritten when `surface` is `dark`, so the light path is untouched code:

1. **Shadows.** A hard shadow is a shape the piece made with its shadow helper (`hard`): the `shade` copies (mascot bodies, heads, the architect's board), the emote discs' offset circle, the idea bulb's and the problem triangle's offset copies. The helper records each node in a module `WeakSet`, so the dark drawing finds shadows by identity; the light tree is unchanged (same tags, attributes, order). Its fill becomes `surface.dark.shadow`. Feet, mittens, eyes, the doubt dot and other ink fills are not shadows and stay `color.ink`.
2. **Ground.** The ellipse in `data-part` `ground` is filled `surface.dark.grid`.
3. **Rim.** A copy of the light drawing (taken before step 1) without ground, shadows, `face` and shapes with `opacity`, where every shape gets `stroke` `surface.dark.rim`, `stroke-width` = its own stroke width (0 when it has no stroke) + 4 × `surface.dark.rimWidth`, `stroke-linejoin` `round`, and a non-`none` fill becomes `surface.dark.rim`. Groups keep their attributes (the agent's head turns with it). The copy is one `g` with `data-part` `rim`.
4. **Order.** The piece group's children become: `ground` (mascot only), `rim`, then the drawing in its 0.5.0 order. The group's own attributes are unchanged. The `rim` group repeats part names (`arm-left`, `legs`…) of the shapes it copies; a consumer that lists parts reads the piece group's children outside `rim`.

## 5. Spec review

Codex round 1 (approve-with-fixes): the rim copied the shadows (it was taken from the recoloured tree); the part-order requirements did not cover `rim`; shadow detection by look (ink fill plus `translate`, or a circle 6 to the right of its twin) was fragile. Fixed: rim taken from the light tree, shadows by identity, "Mascot parts" and "Expression without limbs" modified, negative scenarios added. `spike.diff` and the fixture were regenerated.

Faces stay as drawn (ink on light bodies; `cast.glow` on the agent's dark screen).

## 4. Fixture

`test/fixtures/cast-dark-0.5.2.json` (SHA-256 `d671f0fccc850b96be826461835db47fb99b67f2acb3c9b31b127dc2c8057805`): `{ version, calls: [{ piece, params, sha256 }] }`, 73 calls: 7 characters × 8 actions, one agent call with every option, 8 emotes × `burst` true/false, all with `surface: "dark"`. Hash = SHA-256 of `toSvg(g({}, ...body, ...text))`. It is committed with the spec, written by the spike's `fixture.mts` on the candidate code.

# Design: backdrop-tokens

## 1. Values

Taken from the stackledger spike (`~/.hermes/spikes/stackledger/map-backgrounds/render.mjs`, `PROVISIONAL`), which drew them under the example map's zones, lines and labels in both themes. None of them is already a token.

| Token | light | dark |
|---|---|---|
| `backdropWater` | `#C9D8FF` | `#1E3175` |
| `backdropWaterEdge` | `#B5C7F5` | `#2A3F8A` |
| `backdropPark` | `#D4F2DF` | `#183F52` |
| `backdropCredit` | `#5A6385` | `#9AA6D6` |

`backdropCredit` is close to `muted` (`#5B6694`, `#8F9BD0`) but kept apart: its contrast (WCAG) is higher on the three grounds the credit can sit on. Light, on background / water / park: 5.28, 4.15, 4.94 against muted's 4.98, 3.91, 4.66. Dark: 6.31, 5.02, 4.70 against 5.57, 4.43, 4.15.

The backdrop is decorative, not a state, so ADR 0003's meanings do not apply to it: the water and park tones are pale on light and deep on dark, far from `color.caller` (`#8FB2FF`) and `color.healthy` (`#3DDC84`), and the spike's sheet shows no confusion with the green licence marker or the light blue caller.

## 2. Flat names, not a nested group

stackledger's draft spec names the tokens `surface.<s>.backdrop.water`. The token source allows a group to nest only one more level (spec `design-tokens`, "Token source"); `surface.light.backdrop.water` would be a fourth level, which the build rejects as "nested too deep". Options:

- **A. Flat names** `surface.<s>.backdropWater` (chosen): no rule changes, same pattern as `rimWidth` and `zoneOpacity`. stackledger renames four paths in its draft spec before its gate 1.
- B. Allow a fourth level for `surface` only: changes the depth rule, the CSS-name builder and their tests for one consumer's naming.

## 3. Release

Patch 0.5.3: four additive tokens a consumer asked for. Existing outputs keep every token they had; the three generated files gain the eight new ones.

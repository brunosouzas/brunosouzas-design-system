# Design: stackledger's product layer

## Where the accent lives

| Option | Path | Verdict |
|---|---|---|
| A new closed group named after the product | `stackledger.<theme>.accent` | **chosen**: a product's layer sits beside `site` (brunosouzas.com's component layer), closed and light/dark like `brand` |
| A role in `brand` | `brand.<theme>.productAccent` | no: `brand` holds the parent brand's semantic roles (ADR 0006); a product accent is not one |
| Under `site` | `site.<theme>.accent` | no: `site` is brunosouzas.com's page palette, checked equal to brand roles |
| `product.stackledger.<theme>.accent` | four segments | impossible: the token build caps a path at three |

The group is closed (`CLOSED_GROUPS`) and light/dark (`LIGHT_DARK_GROUPS`), holding exactly `accent` per theme. No other product has its own identity today (E7), so no generic mechanism is added.

## Values and contrast (WCAG 2.x, unrounded in the test)

| Token | Value | on `site.<theme>.body` | on `site.<theme>.light` | against `site.<theme>.text` |
|---|---|---|---|---|
| `stackledger.light.accent` | `#3B5BDB` | 5.11 | 5.67 | 3.31 |
| `stackledger.dark.accent` | `#7D8CFF` | 6.35 | 5.73 | 2.57 |

The test floor is 4.5:1 on body and light (a link or small text in the accent). The difference from the text colour is not a requirement; stackledger keeps its link underline.

## Backdrop

The approved preview (AB#303, Q6) recoloured water, its edge and parks toward the v2 neutrals and set the credit to the muted text role, so the credit text keeps the 6.37:1 and 7.90:1 of `textMuted` on the background. Values are literals, like every surface value. The credit is checked equal to `brand.<theme>.textMuted` in the token test, as `site` is checked against its roles.

## ledgerMark "Folha"

Light: `rect` (0.625, 0.625) 30.75 × 30.75, radius 6.6, fill `color.white`, stroke `color.ink` 1.25. Dark: the same rect with stroke `surface.dark.muted`. Then the unchanged path and circles. The stroke is half outside the rect and stays inside the 32 box. The owner approved it from renders at 96, 32 and 16 px in both themes (AB#303, Q5b).

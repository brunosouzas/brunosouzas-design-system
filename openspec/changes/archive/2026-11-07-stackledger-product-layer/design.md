# Design: stackledger's product layer

## Where the accent lives

ADR 0006 already answers it: "a future theme or sub-brand (a product's own accent, per the brand strategy's 'what a product gains') is a new value at the semantic layer, never a new flat list". So the accent is one more role of `brand.<theme>`, `stackledgerAccent`, with no new group and no change to `GROUPS` or `CLOSED_GROUPS`. "Semantic" here is ADR 0006's layer name (the roles between primitives and components); the strategy's E7 "not a semantic colour" means not a state colour with a meaning (success, failure…). The accent is the first and not the second: no piece draws it by default (the palette check excludes it from the allowed values, scenario "The product accent is caught"); a spec names it where the product's line is meant (the stackledger banner). The ADR 0006 amendment records it.

| Option | Path | Verdict |
|---|---|---|
| A role in `brand` | `brand.<theme>.stackledgerAccent` | **chosen**: what ADR 0006 prescribes |
| A new closed group | `stackledger.<theme>.accent` | no: a new flat list, which the ADR rules out |
| Under `site` | `site.<theme>.accent` | no: `site` is brunosouzas.com's page palette, checked equal to brand roles |

## Values and contrast (WCAG 2.x, unrounded in the test)

| Token | Value | on `site.<theme>.body` | on `site.<theme>.light` | against `site.<theme>.text` |
|---|---|---|---|---|
| `brand.light.stackledgerAccent` | `#3B5BDB` | 5.11 | 5.67 | 3.31 |
| `brand.dark.stackledgerAccent` | `#7D8CFF` | 6.35 | 5.73 | 2.57 |

The test floor is 4.5:1 on body and light (a link or small text in the accent). The difference from the text colour is not a requirement; stackledger keeps its link underline.

## Backdrop

The approved preview (AB#303, Q6) recoloured water, its edge and parks toward the v2 neutrals and set the credit to the muted text role, so the credit text keeps the 6.37:1 and 7.90:1 of `textMuted` on the background. Values are literals, like every surface value. The credit is checked equal to `brand.<theme>.textMuted` by `backdropCreditMismatches` in the token test, as `site` is checked against its roles.

## ledgerMark "Folha"

Light: `rect` (0.625, 0.625) 30.75 × 30.75, radius 6.6, fill `color.white`, stroke `color.ink` 1.25. Dark: the same rect with stroke `surface.dark.muted`. Then the unchanged path and circles. The stroke is half outside the rect and stays inside the 32 box. The owner approved it from renders at 96, 32 and 16 px in both themes (AB#303, Q5b).

The frozen fixture `test/fixtures/pieces-0.2.0.json` holds three `ledgerMark` calls (`{x:0,y:0}`, `size: 16`, and a third with a `line`); only their trees are regenerated, by `scripts/freeze-pieces.ts` run once for 0.8.1 with a header line saying so, and a test compares the new fixture with the 0.8.0 one ("Only the mark trees change in 0.8.1").

# Proof cover fixtures

The three published covers that proved the pieces (change `illustration-pieces`, design §7), written as cover specs, with the SVG the cover command writes from each (`*.svg`, golden; regenerate with `npm run cover -- <spec> --out <golden>`, adding `--lang pt` or `--lang en` for the diagram, only when a change means to alter the drawing).

The goldens were regenerated once for 0.7.0 (change `identity-v2-type-pieces-cleanup`, task 5.6) from the v2 drawing the owner approved: Source type with its faces embedded (ADR 0008), the v2 piece grammar (ADR 0009), and the specs' state colours written `color.state.*`. They no longer match the published originals, and no PSNR against those originals applies: the v2 colours and type differ from them by design. Their descriptions (`<desc>`) were rewritten to the v2 drawing in the same release, which changed only that line of each golden. Parity is now the owner's review of each golden rendered in headless Chrome through an `<img>` next to its 0.6.1 golden (layout, rings and words match; spec cover-cli, "Visual parity (local)").

These are the only cover specs in this public repository: they describe images already published on brunosouzas.com. Every other cover spec lives with its article in the author's private vault.

`home-banner.json` (change `banner-format`, AB#156) is the one banner: brunosouzas.com's home banner (`public/images/home/home-banner.svg` in the site repository, commit `e8ad098`), redrawn from the pieces. It may be public because the banner it redraws is already public. It has a golden SVG but no parity value, because it is a new drawing of the same idea rather than a copy (the hub is a Mule flow, cream since 0.7.0, where the published banner uses an orange block).

Published sources the fixtures redraw (brain vault commit `f536637`; until 0.6.1 they were also the reference of a PSNR parity check):

| Fixture | Published file | SHA-256 |
|---|---|---|
| `spec-driven-development.json` | `50-writing/spec-driven-development-in-practice/images/spec-driven-development-card.svg` | `2324684fcc7c441194bb12df24895ae4ffa7ba713affa2ea08c0295c83fc77e1` |
| `ai-writes-code.json` | `50-writing/ai-writes-code/images/ai-writes-code-card.svg` | `36f6e2145fcc41e94f47f60c877f9524c97069ba58dfa2304ea6f57991c58ca6` |
| `integration-patterns.json` | `50-writing/integration-patterns-in-mulesoft/images/integration-patterns-card.svg` | `e8c2ae0c23b61b927c3021b6d9373a3c6d97ae5c2a411a28b6f032315b443692` |

`circuit-breaker-states.json` (change `designer-formats`, AB#173) is the one body diagram: the circuit breaker article's state diagram, PT and EN from one spec with text tables, with a golden per language (`circuit-breaker-states-pt.svg`, `circuit-breaker-states-en.svg`, written with `--lang`). `eip-splitter.json` is the one icon (format `icon`), with golden `eip-splitter.svg`. Both may be public because the images they redraw are already published. Until 0.6.1 the diagram goldens were at 22.1 dB (PT) and 22.4 dB (EN) against the published files at 800 px and the icon was pixel-identical; since 0.7.0 no PSNR applies (see above).

Published sources of the `designer-formats` fixtures (brain vault commit `016a990`):

| Fixture | Published file | SHA-256 |
|---|---|---|
| `circuit-breaker-states-pt.svg` | `50-writing/circuit-breaker-in-mulesoft/images/circuit-breaker-states-pt.svg` | `bb7f6efcd62878bbad1ae4e56fa9ac583441d8cda2d6c6c99cb46ff20d76a137` |
| `circuit-breaker-states-en.svg` | `50-writing/circuit-breaker-in-mulesoft/images/circuit-breaker-states-en.svg` | `0d82f2a064f8b1b00241ee7d764ab6c7d407f662d0a687da9317bbd06e13b18e` |
| `eip-splitter.svg` | `50-writing/integration-patterns-in-mulesoft/images/icons/eip-splitter.svg` | `678ef8f6fb1cbfaa88dabbf420cd5107b01a46fc2358dd5afe40ee4fd5f4301e` |

`og-headline.json` (change `headline-piece`, AB#307) is brunosouzas.com's default share image in English, the concept the owner chose from renders: the slogan in three `headline` lines, the symbol, the four category badges and the signature, with golden `og-headline.svg`. Its words are the brand's published slogan (brand strategy E2, studio decision I13), approved by the owner for this image (AB#307 Q1), so it may be public (ADR 0004).

`avatar-0.9.1.svg` (change `presence-formats`, AB#325, task 1.1) is the baseline of the default avatar, captured before the avatar took an optional `background`: the `av` avatar spec of `test/scripts/cover.test.ts` (`{ "id": "av", "title": "Symbol", "description": "The b-with-moon symbol, filling the frame.", "format": "avatar" }`) built by the published 0.9.1, from a folder outside this repository (inside it `npx` resolves the local package of the same name and finds no `brunosouzas-cover`):

```
npx -y -p @brunosouzas/design-system@0.9.1 brunosouzas-cover av.json --out test/fixtures/covers/avatar-0.9.1.svg
```

SHA-256 `e2526829b5cbf4c3f6ec9ac2c0e3dd7282b7f5d616c8d38a31df8af48dcb6f81`. The test "Default avatar unchanged" compares the command's output against it, byte for byte. It is not a golden of a fixture: it is never regenerated.

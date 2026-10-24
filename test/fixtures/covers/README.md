# Proof cover fixtures

The three published covers that proved the pieces (change `illustration-pieces`, design §7), written as cover specs, with the SVG the cover command writes from each (`*.svg`, golden; regenerate with `npm run cover -- <spec> --out <golden>` only when a change means to alter the drawing).

These are the only cover specs in this public repository: they describe images already published on brunosouzas.com. Every other cover spec lives with its article in the author's private vault.

`home-banner.json` (change `banner-format`, AB#156) is the one banner: brunosouzas.com's home banner (`public/images/home/home-banner.svg` in the site repository, commit `e8ad098`), redrawn from the pieces. It may be public because the banner it redraws is already public. It has a golden SVG but no parity value, because it is a new drawing of the same idea rather than a copy (the hub is a Mule flow in the caller colour, where the published banner uses an orange block).

Published sources used for the visual parity check (brain vault commit `f536637`):

| Fixture | Published file | SHA-256 |
|---|---|---|
| `spec-driven-development.json` | `50-writing/spec-driven-development-in-practice/images/spec-driven-development-card.svg` | `2324684fcc7c441194bb12df24895ae4ffa7ba713affa2ea08c0295c83fc77e1` |
| `ai-writes-code.json` | `50-writing/ai-writes-code/images/ai-writes-code-card.svg` | `36f6e2145fcc41e94f47f60c877f9524c97069ba58dfa2304ea6f57991c58ca6` |
| `integration-patterns.json` | `50-writing/integration-patterns-in-mulesoft/images/integration-patterns-card.svg` | `e8c2ae0c23b61b927c3021b6d9373a3c6d97ae5c2a411a28b6f032315b443692` |

`circuit-breaker-states.json` (change `designer-formats`, AB#173) is the one body diagram: the circuit breaker article's state diagram, PT and EN from one spec with text tables, with a golden per language (`circuit-breaker-states-pt.svg`, `circuit-breaker-states-en.svg`, written with `--lang`). `eip-splitter.json` is the one icon (format `icon`), with golden `eip-splitter.svg`. Both may be public because the images they redraw are already published. Parity: the diagram goldens are at 22.1 dB (PT) and 22.4 dB (EN) against the published files at 800 px (the shadow is shallower and the arrowheads differ; layout, rings and words match), and the icon is pixel-identical (PSNR inf).

Published sources of the `designer-formats` fixtures (brain vault commit `016a990`):

| Fixture | Published file | SHA-256 |
|---|---|---|
| `circuit-breaker-states-pt.svg` | `50-writing/circuit-breaker-in-mulesoft/images/circuit-breaker-states-pt.svg` | `bb7f6efcd62878bbad1ae4e56fa9ac583441d8cda2d6c6c99cb46ff20d76a137` |
| `circuit-breaker-states-en.svg` | `50-writing/circuit-breaker-in-mulesoft/images/circuit-breaker-states-en.svg` | `0d82f2a064f8b1b00241ee7d764ab6c7d407f662d0a687da9317bbd06e13b18e` |
| `eip-splitter.svg` | `50-writing/integration-patterns-in-mulesoft/images/icons/eip-splitter.svg` | `678ef8f6fb1cbfaa88dabbf420cd5107b01a46fc2358dd5afe40ee4fd5f4301e` |

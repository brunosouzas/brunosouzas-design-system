# Proof cover fixtures

The three published covers that proved the pieces (change `illustration-pieces`, design §7), written as cover specs, with the SVG the cover command writes from each (`*.svg`, golden; regenerate with `npm run cover -- <spec> --out <golden>` only when a change means to alter the drawing).

These are the only cover specs in this public repository: they describe covers already published on brunosouzas.com. Every other cover spec lives with its article in the author's private vault.

`home-banner.json` (change `banner-format`, AB#156) is the one banner: brunosouzas.com's home banner (`public/images/home/home-banner.svg` in the site repository, commit `e8ad098`), redrawn from the pieces. It may be public because the banner it redraws is already public. It has a golden SVG but no parity value, because it is a new drawing of the same idea rather than a copy (the hub is a Mule flow in the caller colour, where the published banner uses an orange block).

Published sources used for the visual parity check (brain vault commit `f536637`):

| Fixture | Published file | SHA-256 |
|---|---|---|
| `spec-driven-development.json` | `50-writing/spec-driven-development-in-practice/images/spec-driven-development-card.svg` | `2324684fcc7c441194bb12df24895ae4ffa7ba713affa2ea08c0295c83fc77e1` |
| `ai-writes-code.json` | `50-writing/ai-writes-code/images/ai-writes-code-card.svg` | `36f6e2145fcc41e94f47f60c877f9524c97069ba58dfa2304ea6f57991c58ca6` |
| `integration-patterns.json` | `50-writing/integration-patterns-in-mulesoft/images/integration-patterns-card.svg` | `e8c2ae0c23b61b927c3021b6d9373a3c6d97ae5c2a411a28b6f032315b443692` |

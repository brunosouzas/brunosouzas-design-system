# Roadmap

Planned changes, in order. Each one is a card in Azure Boards (area `site`), a branch and one pull request with its OpenSpec change. Nothing below is implemented until its row says so.

| # | Change | What it delivers | Status |
|---|---|---|---|
| 1 | `tokens-and-motion-foundation` | The token source and its CSS, TypeScript and JSON exports; the motion components; the circuit-breaker state machine as the first catalogue scene (16:9 and 4:5, PT and EN); the render script with a web copy | planned |
| 2 | Variety scenes | About four scenes from other published articles, in the same identity, to test the components before any batch (pilot, variety, batch) | planned |
| 3 | Site palette | Two or three palette options (shared ink, one brand accent) shown on a real page; the chosen one becomes a change in the site repository that consumes the CSS tokens | planned |
| 4 | Static diagrams on the tokens | The SVG generators of covers and body diagrams read the JSON tokens instead of copying colour values | planned |
| 5 | Published catalogue | The Remotion Studio deployed as a static site, so the catalogue can be browsed without a local install | later |

## Out of scope for now

- Sound and music: added per scene only when its context asks for it (a narrated presentation).
- A site banner as video: a header animation is better as light CSS or SVG generated from the same tokens, because a video in the page header weighs on loading.

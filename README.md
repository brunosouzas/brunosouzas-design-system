# brunosouzas-design-system

[![OpenSpec](https://github.com/brunosouzas/brunosouzas-design-system/actions/workflows/openspec.yml/badge.svg)](https://github.com/brunosouzas/brunosouzas-design-system/actions/workflows/openspec.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

The visual identity of [brunosouzas.com](https://brunosouzas.com): design tokens, and animated explainers made with code.

![Four frames of the animated circuit-breaker state machine: CLOSED collecting call results, the arrow to OPEN, HALF_OPEN testing calls, and the full loop back to CLOSED.](docs/spikes/2026-10-22-motion-pilot/contact-sheet-16x9-en.png)

## Contents

- [Status](#status)
- [What it is](#what-it-is)
- [How it works](#how-it-works)
- [Decisions](#decisions)
- [How this project is built](#how-this-project-is-built)
- [Security](#security)
- [Contributing](#contributing)
- [Licence](#licence)

## Status

Early. The repository holds its plan, the decisions and the evidence of the pilot. **Nothing in it is implemented yet**: the first change ports the pilot into `src/` (see the [roadmap](docs/roadmap.md)). The commands below are planned, not available.

## What it is

The blog's articles explain how systems behave: a circuit breaker opening, a pipeline promoting a build, a message being retried. Static diagrams show the states; an animation shows the change. This repository keeps both in one visual language, so a reader recognises the site in an article, on LinkedIn and on a slide.

- **Design tokens, one source.** Colours with fixed meanings (green healthy, orange blocked, yellow transitional, red the failure path), the Lato type scale, the thick ink outline, the hard offset shadow, radii, and motion timings. Exported as CSS variables for the site, TypeScript for the animations and JSON for anything else (the SVG generators of the static diagrams).
- **Motion components.** React components for [Remotion](https://www.remotion.dev): an ink block with a hard shadow, a pill label, an arrow that draws itself, a token travelling along a transition, call-result squares, a countdown ring.
- **A catalogue of scenes.** Each scene animates something a published article already says, in 16:9 (article) and 4:5 (LinkedIn), in Portuguese and English from one text table. The first is the [circuit-breaker state machine](docs/spikes/2026-10-22-motion-pilot/README.md).

The style follows the illustration covers of the [Spotify Engineering blog](https://engineering.atspotify.com/): flat shapes, a dark ink outline, a hard shadow with no blur, saturated colours on a calm page.

## How it works

Planned for the first change:

```text
tokens (one source) ──► CSS variables  ──► brunosouzas.com (site repository)
                    ├─► TypeScript     ──► motion components ──► scenes ──► MP4 per format and language
                    └─► JSON           ──► static diagram generators
```

A scene is four small files: the strings per language (taken from the article), the timeline in frames, one layout per format, and the composition. Everything else comes from the components and tokens, so a new scene reuses what earlier scenes proved.

## Decisions

Project-wide decisions are recorded as ADRs in [`docs/adr/`](docs/adr/README.md).

- **Animations are code, made with Remotion.** A scene is React components and data, so a correction is a re-render and every format and language comes from one composition. AI video generators were rejected because their outputs are not consistent between clips. [ADR 0001](docs/adr/0001-remotion-for-motion.md)
- **One token source.** Colours, type, outline, shadow and motion timings live in one file; the site, the animations and the SVG scripts read generated exports instead of keeping their own copies. [ADR 0002](docs/adr/0002-one-token-source.md)
- **One visual language, fixed colour meanings.** Green is always healthy, orange always blocked, red always the failure path, so a reader learns the code once. [ADR 0003](docs/adr/0003-visual-language-and-colour-meaning.md)
- **Scenes illustrate published articles.** Every string on screen comes from the article, so an animation never says more than the reviewed text. [ADR 0004](docs/adr/0004-scenes-illustrate-published-articles.md)

## How this project is built

- Changes are specified first with [OpenSpec](https://github.com/Fission-AI/OpenSpec): active changes in [`openspec/changes/`](openspec/changes/), the current behaviour in [`openspec/specs/`](openspec/specs/).
- Decisions: [`docs/adr/`](docs/adr/README.md).
- Order of work: [`docs/roadmap.md`](docs/roadmap.md).
- Evidence from experiments: [`docs/spikes/`](docs/spikes/).

## Security

No secrets, credentials or telemetry belong in this repository. Report a vulnerability privately: see [SECURITY.md](SECURITY.md).

## Contributing

Issues and pull requests are welcome, especially corrections and ideas for the components. The scenes illustrate the author's own articles, so new scenes come from the blog.

## Licence

Code and tokens: [Apache-2.0](LICENSE). The licence does not grant use of the name or of the brunosouzas.com identity as someone else's brand: to build your own, fork it and change the token values.

The animations use [Remotion](https://www.remotion.dev), which has its own licence: free for individuals and for companies of up to three people, a company licence above that ([terms](https://www.remotion.dev/docs/license)). Check it before you render with this code at work.

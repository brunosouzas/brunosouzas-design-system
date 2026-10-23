# Roadmap

Planned changes, in order, as agreed on 2026-10-22 and revised on 2026-10-23 after the inventory of the published covers and a review of all 28 articles, and again the same day to put first what a second site needs (package, banner, diagram pieces, designer skill). Each one is a card in Azure Boards (area `site`), a branch and one pull request with its OpenSpec change. Nothing below is implemented until its row says so.

## Foundation

| # | Change | What it delivers | Card | Status |
|---|---|---|---|---|
| 1 | `tokens-and-motion-foundation` | The token source and its CSS, TypeScript and JSON exports; the motion components; the circuit-breaker state machine as the first catalogue scene (16:9 and 4:5, PT and EN); the render script with a web copy | AB#132 | delivered |
| 2 | Variety scenes | Became the per-article video list below | AB#138 | `publish-subscribe` implemented; owner media approval pending |
| 3 | `illustration-pieces` | New tokens (illustration colours, cover backgrounds with their measured rings, cover measures); pieces as TypeScript functions rendered to SVG and React; the 26 EIP icons as data; the cover command | AB#139 | delivered |
| 4 | Package for both sites | Both of the owner's sites (same Astro template) install the design system as a versioned git dependency: tokens CSS, pieces and the cover command | AB#155 | planned |
| 5 | Static banner format | The cover spec gains a banner format with its measures in tokens; static SVG | AB#156 | planned |
| 6 | Diagram pieces and icons | Node block, pill node, decision, store, queue, exchange, tagged container, lifelines, phase band, alt frame, message arrows; new icons as data | AB#157 | planned |
| 7 | Designer skill on the pieces | The kit's `designer` skill makes covers, banners, icons and diagrams from specs and pieces | AB#151 | planned |
| 8 | Cast and emotes | The mascot cast and emotes on the pieces, and ADR 0005 (neutral videos, optional caption, every action tied to an article line, 4:5 on demand, storyboard gate before the spec). Every new video depends on it | AB#152 | planned |
| 9 | Covers on the pieces | Port the 21 published covers to cover specs, one first and then in batches checked on the site | AB#140 | planned |
| 10 | Body diagram kit | Port the 14 body diagrams to the diagram pieces | AB#141 | planned |
| 11 | Video on the site | Muted looping `<video>` that plays when visible, with a pause button and `prefers-reduced-motion`; first use, the circuit breaker | AB#142 | planned |
| 12 | Designer skill for videos | The `designer` skill decides where a video belongs and writes its script | AB#158 | planned |
| 13 | Site palette | Two or three palette options (shared ink, one brand accent) shown on a real page; the chosen one becomes a change in the site repository that consumes the CSS tokens | — | planned |
| 14 | Animated site banner | Animated SVG/CSS banner built from the pieces | AB#143 | after the palette |
| 15 | Published catalogue | The Remotion Studio deployed as a static site, so the catalogue can be browsed without a local install | — | later |

## Videos per article

A video only where it shows a process unfolding; the other 19 pages keep their static images. Since 2026-10-23 every video is language-neutral by default (one file for PT and EN, no words on screen, told by the cast, gestures and emotes), with a storyboard of two or three concepts before the spec. One scene per change.

| Article or wiki | Scenes | Card |
|---|---|---|
| Spec-driven development in practice | 3: without vs with a spec; the stages and what the AI does with each file; what remains after delivery and how it is reused | AB#144 |
| EIP Idempotent Receiver | book + Mule | AB#145 |
| EIP Dead Letter Channel | book + Mule | AB#146 |
| EIP Correlation Identifier | book + Mule | AB#147 |
| EIP Publish-Subscribe Channel | book (new) + Mule (existing scene) | AB#148 |
| Write in Obsidian, publish on your own site | 1: the publishing flow, success and failure | AB#149 |
| Deploying to CloudHub 2.0 | 1: release, production gate, verification | AB#150 |
| Circuit breaker | existing scene, embedded by AB#142 | AB#142 |

EIP series: every new pattern gets two neutral videos, the pattern as the book describes it and as Mule implements it. A page may publish with its static diagrams; the videos follow in their own cards.

## Out of scope for now

- Sound and music: added per scene only when its context asks for it (a narrated presentation).
- A site banner as video: a header animation is better as light CSS or SVG generated from the same tokens, because a video in the page header weighs on loading.
- The Remotion Player on the site: it autoplays and loops, but ships React, Remotion and the font to the page; an MP4 in `<video>` does the same with less weight.
- Without a card for now: the Maven release (a git timeline) and the retry vs circuit-breaker race.

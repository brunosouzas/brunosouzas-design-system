# Roadmap

Planned changes, in order, as agreed on 2026-10-22 and revised on 2026-10-23 after the inventory of the published covers and a review of all 28 articles, and again the same day to put first what a second site needs (package, banner, diagram pieces, designer skill), and once more on the same day: the diagram pieces before the designer skill, and the ports of covers and body diagrams done by that skill in brunosouzas.com. Each one is a card in Azure Boards (area `site`), a branch and one pull request with its OpenSpec change. Nothing below is implemented until its row says so.

## Foundation

| # | Change | What it delivers | Card | Status |
|---|---|---|---|---|
| 1 | `tokens-and-motion-foundation` | The token source and its CSS, TypeScript and JSON exports; the motion components; the circuit-breaker state machine as the first catalogue scene (16:9 and 4:5, PT and EN); the render script with a web copy | AB#132 | delivered |
| 2 | Variety scenes | Became the per-article video list below | AB#138 | `publish-subscribe` implemented; owner media approval pending |
| 3 | `illustration-pieces` | New tokens (illustration colours, cover backgrounds with their measured rings, cover measures); pieces as TypeScript functions rendered to SVG and React; the 26 EIP icons as data; the cover command | AB#139 | delivered |
| 4 | Package for both sites | `@brunosouzas/design-system` on npm, with provenance: tokens CSS and JSON, pieces, the React entry and the cover command, no runtime dependency | AB#155 | delivered |
| 5 | Static banner format | The cover spec gains a banner format with its measures in tokens; static SVG | AB#156 | delivered |
| 6 | `metro-and-diagram-pieces` | Surface (light and dark), map and site palette tokens; line badge, station marker, pipe, count badge, node block, pill and hex nodes, message arrow and stackledger's mark, for stackledger's map and diagrams. Decision, store, queue, exchange, lifelines, phase band and alt frame stay with AB#141 | AB#157 | delivered |
| 6a | `stackledger-map-and-link-pieces` | stackledger's remaining requests in one release (0.3.0): renewal ring, suggested halo, licence mark, map zone, UI icons and link icons as pieces; a subtitle on a placeholder node, a line badge without a letter, the mark on a dark surface | AB#167 | delivered |
| 6b | `bend-radius-and-current-colour` | stackledger's last requests before its next release (0.3.1): `map.bendRadius` (32) for its round bends, `uiIcon` with `colour: "currentColor"` for icons in buttons | AB#170 | delivered (0.3.1) |
| 7 | Body diagram pieces | The diagram pieces the body diagrams need and the package lacks: decision, store, queue, exchange, tagged container, lifelines, phase band, alt/else frame, and message arrow variants (reply, failure, fail-fast). Release 0.3.2. Porting the 14 diagrams is not here: brunosouzas.com does it with the `designer` skill (row 9). Also `diagramBox`, code in words (backticks), `messageArrow` `controls` | AB#141 | delivered (0.3.2) |
| 8 | Designer skill on the pieces | The kit's `designer` skill makes covers, banners, icons and diagrams from specs and pieces. It comes before the ports, because the skill does them | AB#151 | planned |
| 8a | `designer-formats` | The designer's requests in one release (0.4.0): the cover command's `diagram` and `icon` formats, per-language text tables with `--lang`, `customAt`, the `stateStart` piece and the `bodyDiagram` tokens. No new background pair: which covers share one is the skill's rule (COV-4) | AB#173 | delivered (0.4.0) |
| 9 | Covers and body diagrams on the pieces | Done in brunosouzas.com by the `designer` skill, not in this repository: port the 21 published covers to cover specs (one first, then batches checked on the site) and the 14 body diagrams to the diagram pieces | AB#140 | planned |
| 10 | Cast and emotes | The mascot cast and emotes on the pieces, and ADR 0005 (neutral videos, optional caption, every action tied to an article line, 4:5 on demand, storyboard gate before the spec). Every new video depends on it. Release 0.5.0 (0.4.0 went to AB#173) | AB#152 | delivered (0.5.0) |
| 10a | `piece-params` | The port's requests (0.5.1): `milestonePin.size`, `countBadge.textSize`, code in backticks in a `pill`, `messageArrow` `heads` and `dashed`, each optional and byte-compatible with 0.5.0 | AB#190 | delivered (0.5.1) |
| 10b | `cast-dark-surface` | `surface` on `mascot` and `emote`: shadow, ground and a light rim on the dark surface, byte-compatible on light | AB#187 | delivered (0.5.2) |
| 10c | `backdrop-tokens` | stackledger's city backdrop (map-backgrounds, AB#134): `surface.*.backdropWater`, `backdropWaterEdge`, `backdropPark`, `backdropCredit`. The neutral dashed arrow asked in the same card already exists (`messageArrow` with `dashed: true`, 0.5.1) | AB#180 | delivered (0.5.3) |
| 11 | Video on the site | Muted looping `<video>` that plays when visible, with a pause button and `prefers-reduced-motion`; first use, the circuit breaker | AB#142 | planned |
| 12 | Designer skill for videos | The `designer` skill decides where a video belongs and writes its script | AB#158 | planned |
| 13 | Site palette | The `site.*` colours become the brand roles (ADR 0006, amended), with `link` and `site.font.mono`; the site's category badges as `categoryIcon` on a track-tone disc, built by the `icon` format (`site-palette-and-category-badges`, 0.8.0). The site's own adoption is its change in brunosouzas.com | AB#302 | delivered (0.8.0) |
| 13a | `stackledger-product-layer` | stackledger's accent as a brand role (`brand.<theme>.stackledgerAccent`), the city backdrop on the v2 neutrals, and the `ledgerMark` as a white page with one outline (0.8.1). stackledger's own adoption is its change in that repository | AB#303 | delivered (0.8.1) |
| 13b | `headline-piece` | A serif title, `headline`, and Source Serif 4 Bold in `fonts/` (ADR 0008 amended), for brunosouzas.com's default share image in English and Portuguese (0.9.0). The site's own change is in brunosouzas.com | AB#307 | in review |
| 13c | `presence-formats` | A LinkedIn profile background, `linkedin-banner` (1584x396), with the profile photo's measured zones exported (`LINKEDIN_PHOTO_ZONES`) and drawn over a render by `npm run png -- … --zones`, a repository script that is not in the package; the avatar takes a cover background as its ground (the release App's icon); and the `stackledger` link icon (0.10.0) | AB#325 | in review |
| 13d | `brand-link-icon` | The `brunosouzas` link icon: the brand symbol (the favicon's and the avatar's b with the moon) on the link family's white face, light and dark, for every link to brunosouzas.com; `website` stays the generic globe. First consumer: stackledger's home links, its own change after the release | AB#326 | in review |
| 14 | Animated site banner | Animated SVG/CSS banner built from the pieces | AB#143 | after the palette |
| 15 | Published catalogue | The Remotion Studio deployed as a static site, so the catalogue can be browsed without a local install | — | later |

## Videos per article

A video only where it shows a process unfolding; the other 19 pages keep their static images. Since 2026-10-23 every video is language-neutral by default (one file for PT and EN, no words on screen, told by the cast, gestures and emotes), with a storyboard of two or three concepts before the spec ([ADR 0005](adr/0005-neutral-videos-and-the-cast.md)). They use the cast and emotes of AB#152. One scene per change.

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

- Candidate pieces from the blog port (AB#189, closed with the owner's approval on 2026-11-06): each enters only when a new cover or diagram needs it again, or when two covers use it; until then the port draws it with `custom` or existing pieces. Checked against 0.6.1: no candidate has a second use, and none fits a bank object (the six objects of ADR 0007 are scenery with a screen, not these symbols). A candidate becomes a card when its second use appears. The specs are in `brunosouzas-content`, under `writing/<article>/design/`.

  | Candidate | Where it is `custom` today | Uses | State in 0.6.1 |
  |---|---|---|---|
  | Open electrical circuit breaker | `circuit-breaker-in-mulesoft/design/circuit-breaker-card.json` | 1 | still `custom` |
  | Rocket | `obsidian-to-site/design/obsidian-to-site-guide-card.json` | 1 | still `custom` (Astro) |
  | Padlock | `solid-in-mulesoft/design/ocp-card.json` | 1 | still `custom` ("closed for modification") |
  | Shield with a check | `solid-in-mulesoft/design/srp-card.json` | 1 | still `custom` (validation) |
  | Lab flask | `mulesoft-delivery-azure-devops/design/gitflow-card.json` | 1 | still `custom` (test environment) |
  | Git branch sign | `mulesoft-delivery-azure-devops/design/delivery-path-card.json` | 1 | still `custom` |
  | Monitor with a heartbeat | `mulesoft-delivery-azure-devops/design/cloudhub-deploy-card.json` | 1 | still `custom` (health check) |
  | Approval barrier | left `cloudhub-deploy-card.json`, because a cover takes one `custom` | 0 | out of the image; returns only if another cover needs it |
  | Crossed-out pencil (editing forbidden) | `mulesoft-delivery-azure-devops/design/maven-release-card.json` | 1 | still `custom` |
  | Plug and socket | `solid-in-mulesoft/design/lsp-card.json` | 1 | still `custom` (substitution) |
  | Hexagonal port and pin | `solid-in-mulesoft/design/dip-card.json` | 1 | still `custom` (abstraction); a `hexNode` variation could cover it |
  | Filter layer (funnel) | `solid-in-mulesoft/design/isp-card.json` | 1 | still `custom` |
  | Gap / empty slot | `where-the-work-moves/design/where-the-work-moves-card.json` | 1 | still `custom` (replaced the puzzle) |
  | Wavy "partial" seal | `solid-in-mulesoft/design/solid-intro-card.json` | 1 | still `custom` |
  | Filled lens in the magnifier | `integration-patterns-in-mulesoft/design/eip-catalog-in-mulesoft-card.json` | 1 | still `custom`; could become a `magnifier` parameter |
  | X mark (delivery failed) | `integration-patterns-in-mulesoft/design/dead-letter-channel-in-mulesoft-book.json` (arrow segments) | 1 | still drawn with segments; a diagram piece |
  | Robot holding an object | `validate-ai-api-contract-change/design/validate-ai-api-contract-change-card.json` (the 200 became a loose label) | 1 | no `custom` in the spec; could become a `robot` parameter |
- Technology props for the cast (an IDE accent, a cloud, a CI badge) and new roles (writer, reviewer): added with the scene that needs them (ADR 0005).

- Sound and music: added per scene only when its context asks for it (a narrated presentation).
- A site banner as video: a header animation is better as light CSS or SVG generated from the same tokens, because a video in the page header weighs on loading.
- The Remotion Player on the site: it autoplays and loops, but ships React, Remotion and the font to the page; an MP4 in `<video>` does the same with less weight.
- Without a card for now: the Maven release (a git timeline) and the retry vs circuit-breaker race.
- New `coverBackground` tones: none until a series needs a tone its track family lacks; a new tone joins its family (`<track><Tone>`) only from renders the owner approves (ADR 0006, amended 2026-11-06).
- A dark-surface body diagram, a second layout width and text that wraps by itself (not asked by the designer, AB#173).
- Drawing stackledger's round bends (AB#166): stackledger draws the arcs with `map.bendRadius`; the banner keeps its own `Q` curves.

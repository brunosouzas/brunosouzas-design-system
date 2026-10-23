# Proposal: body-diagram-pieces

## Why

The blog's 14 body diagrams (28 files, PT and EN, in the brain vault under `50-writing/*/images/`, published on brunosouzas.com) are hand-written SVG from per-article scripts. Card AB#140 will port them to the package's pieces in brunosouzas.com, with the kit's `designer` skill (after AB#151). The package lacks the shapes those diagrams draw: a decision diamond, a store cylinder, a queue, an exchange, a container with a tab, sequence lifelines, phase bands, alt/else frames, the reply and failure variants of the message arrow, and the free labels next to arrows. The survey (design §1, `~/.hermes/spikes/design-system/ab141-body-diagram-pieces/survey.md`) counts each one. Scope decided by the owner on 2026-10-23 (gate 1 of AB#170): pieces only, release 0.3.2.

## What Changes

- **Ten new pieces** (nine from the card's list, plus `diagramBox`, which the owner decides at gate 1: design §9, decision 6) on the model of the metro and diagram pieces (they paint what the caller lays out; ink sticker on a `surface` with an `inkScale`): `diagramBox`, `decisionNode`, `storeNode`, `queueNode`, `exchangeNode`, `taggedContainer`, `lifeline`, `phaseBand`, `altFrame` and `edgeLabel` (design §3). The catalogue goes from 41 to 51 pieces.
- **One text model for the new pieces:** one to three centred bold lines plus an optional subtitle, an optional `textSize`, ink text on a coloured `fill` (ADR 0003), and backticks that mark code, drawn in the monospace stack as a `tspan` (design §4). The node tree gains the `tspan` tag.
- **`messageArrow` gains two optional parameters:** `kind` (`message`, `reply`, `failure`, `failFast`) and `controls` (two control points of a cubic curve). Without them it draws as in 0.3.1, proven by a frozen fixture written on `main` before any code (design §5).
- Release: patch `0.3.2` (additive, for a consumer), through `docs/release.md`. The owner tags and approves.

## Capabilities

### Modified Capabilities

- `illustration-pieces`: ten pieces, the `tspan` tag, two `messageArrow` parameters, and the lists of the sticker, room and own-stroke rules.
- `cover-cli`: the unknown-piece message lists 51 names.

## Out of scope

- Porting the 14 body diagrams and the 21 covers, and retiring the kit's `circuit-breaker-diagrams.py`: AB#140, in brunosouzas.com, with the `designer` skill.
- Elements drawn once or in one diagram only (design §1, "Left out"): the two-headed arrow, the red cross on a blocked path, the state machine's start dot, the folder-tab boxes of the Obsidian diagrams. The port draws them with existing pieces or asks for a card.
- The background rings of the published diagrams: the cover piece `rings` exists; whether the ported diagrams keep them is the port's choice.
- Layout, text measurement, wrapping and truncation: the caller's, as on the map.
- Changes to `nodeBlock`, `pillNode`, `hexNode` or any other existing piece, and any new token or colour.
- Any change in stackledger (it does not use these pieces: inventory `~/.hermes/spikes/design-system/stackledger-inventory/report.md`, line 129) or brunosouzas.com.

## Implicit requirements

- **Errors and invalid input:** requirement. Every new parameter is checked by the piece's schema and the limits between parameters (room for the outline, tag width, section inside the frame, `controls` with `curve`) throw a `RangeError` naming the parameter.
- **Limits:** requirement. Text lines 1 to 3 (labels 1 to 4), sections at most 10, sizes within 10000, positions any finite number (the existing rule).
- **Repetition and idempotency:** the existing "Pure pieces" requirement holds.
- **Concurrency:** n/a. Pure functions.
- **Security:** requirement. Words are text children, escaped by the renderer; a `tspan` carries only `font-family`. No piece draws a link or a style.
- **Logs and observability:** n/a.

## Documentation

- `README.md`: the ten pieces, the text model (backticks, `textSize`) and the `messageArrow` parameters; the port's scale note of design §2.
- `docs/roadmap.md`: the delivered row for AB#141.
- Vault: `10-personal/projects/brunosouzas-design-system/{architecture,roadmap,changelog}.md`, after the pull request is ready.

# Proposal: piece-params

## Why

The port of the blog's images (brunosouzas.com, AB#140) rebuilt 21 covers and 14 body diagrams from cover specs on the package. In four places a piece without a parameter left the image weaker than the published one (request: `~/.hermes/spikes/design-system/ab190-piece-params/ab140-piece-params-request.md`, AB#190). Measured on the published files (vault commits before the port, `measure.py` in the spike folder):

- **`milestonePin`** draws a head of radius 18 with text 18 (`src/pieces/library.ts`). The published pins had radius 26 and text 24; at 375 px wide the port's pins shrink to a head of about 8 px. Used by `solid-path-card` and `delivery-path-card`.
- **`countBadge`** writes its text at `map.countTextSize` (11), about 5 px when a cover is shown 375 wide. Used by `srp-card` (three badges "1").
- **`pill`** writes its text in the sans font only. The published `gitflow-card` and `cloudhub-deploy-card` wrote branch and environment names (`main`, `develop`, `test`, `uat`, `prod`) in monospace.
- **`messageArrow`** draws one head, at `to`, and `failure` and `failFast` are always dashed. The published `idempotent-receiver-in-mulesoft-charge-flow` had one two-headed arrow validator ↔ store (the port draws two arrows); the published `dead-letter-channel-in-mulesoft-book` drew "Dead message → DLC" solid red.

## What Changes

- `milestonePin` gains `size`, the head's radius (default 18, from 6 to 48); the head's centre offset, its outline and the label's size and baseline scale with it.
- `countBadge` gains `textSize` (default `map.countTextSize`, from 6 to 48); without `height`, the height, the per-character width and the baseline scale with it.
- `pill` draws code in backticks in monospace, as the body diagram pieces do ("Code in words").
- `messageArrow` gains `heads` (`end` default, `start`, `both`) and `dashed` (default: dashed for every kind but `message`). `heads` together with `head: false` is rejected.
- Every 0.5.0 call without the new parameters draws the same tree and bytes, proven by a frozen fixture written on `main` before any code. The one exception is a `pill` whose text has an even number of backticks (gate-1 decision 1).
- Release: patch 0.5.1 (additive parameters a consumer asked for). The request file proposed 0.4.1; 0.5.0 shipped first.

## Capabilities

### Modified Capabilities

- `illustration-pieces`: the four parameters, the pill's code runs, and the frozen 0.5.0 calls.

## Out of scope

- New pieces the port listed as candidates (AB#189, backlog: they enter when a cover or diagram needs one again, or when two covers use it). Only its roadmap line is added here.
- The cast on a dark surface (AB#187): its own change and release (0.5.2).
- Scenes, tokens and the cover command: a cover spec checks each piece entry with the piece's own schema, so the new parameters reach cover specs without a cover-cli change.
- Any change in brunosouzas.com or the vault: the port re-renders its seven specs after the release.

## Implicit requirements

- **Errors and invalid input:** requirement. Each new parameter has a type, an enum or a range, rejected by name; `heads` with `head: false` and a count badge whose derived height leaves no room for the outline are rejected by name.
- **Limits:** requirement. `size` and `textSize` from 6 to 48; two heads need twice the room of one. No new array or point parameter, so no sparse-array case.
- **Repetition and idempotency:** the existing "Pure pieces" requirement holds.
- **Concurrency:** n/a. Pure functions.
- **Security:** n/a. No new string reaches an attribute; code runs become `tspan` children, as in the body diagram pieces.
- **Logs and observability:** n/a. Pieces do not log.

## Documentation

- `README.md`: the four parameters in the piece list.
- `docs/roadmap.md`: the delivered row for AB#190 and, under "Out of scope for now", the candidate pieces of AB#189 with their rule.
- Vault: none in this change (read-only here). Its project notes (`10-personal/projects/brunosouzas-design-system/`) are updated after the release, outside this pull request.

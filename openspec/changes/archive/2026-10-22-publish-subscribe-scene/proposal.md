# Proposal: publish-subscribe-scene

## Why

The catalogue has one approved state-machine scene. The published Publish-Subscribe article supplies a different process: an accepted event fans out to independent queues, and one consumer's failure does not reach the publisher. This is the first variety scene in roadmap item 2 and tests whether the catalogue can express message flow without pretending nodes are states.

## What Changes

- Generalise catalogue consumption to common scene metadata and phase ranges, retaining the existing state-machine timeline and checks as one supported form.
- Add `publish-subscribe` as four compositions (16:9 and 4:5, PT and EN), 1000 frames at 30 fps: intro, publish acceptance, fan-out, independent consumption, invoice NACK return, final reading hold.
- Add only the reusable shapes and token-placement logic needed by this scene; reuse existing tokens without changing their values.
- Keep circuit-breaker data, timing, behaviour and regression assertions unchanged; both scene kinds work through the existing Studio, stills and render commands.
- Review all key-frame stills with the owner before rendering videos; update the README scene list and roadmap after implementation.

## Capabilities

### New Capabilities

None: scene behaviour belongs in the existing catalogue capability.

### Modified Capabilities

- `scene-catalogue`: common phase validation plus scene-specific validation; pub-sub registration, source-bound text, timeline, message ownership and readable layouts.
- `motion-components`: generic exchange, queue and tagged container shapes, and persistent/path-based message token placement.
- `scene-rendering`: pub-sub stills and videos through existing commands, preserving circuit-breaker outputs.

`design-tokens` remains unchanged: no new token or token value is needed.

## Out of scope

- A fourth subscriber, successful invoice redelivery, repeated publishes, routing rules, TTL, DLQ, duplicate handling, real broker access or XML execution.
- New narration, sound, invented captions, changes to the published articles, the circuit-breaker pilot or its pinned timeline.
- A general-purpose graph editor, arbitrary scene plug-ins, an event simulator or package publication.
- Rendering in CI, site integration and deployment. Videos stay ignored under `out/`.
- Code changes in this spec-only commit; implementation waits for gate 1. Independent spec review is performed afterwards by Codex, not by the spec executor.

## Implicit requirements

- **Errors and invalid input:** requirement. Common validation retains phase, text, source, id and reading-hold checks; flow validation rejects missing routes/nodes, impossible ownership, invalid event timing and animation crossing the outro. CLI errors and their precedence remain unchanged.
- **Limits:** requirement. Exactly three copies, two ACKs and one NACK; 1000 frames at 30 fps; the last 90 frames are static. 4:5 node names >=54 px, labels >=30 px, captions >=38 px. No arbitrary graph-size limits: owner-authored choreography, not external input.
- **Repetition and idempotency:** requirement. Frame evaluation is pure and seekable in any order, with no accumulated simulation state; existing overwrite/dry-run behaviour remains in force.
- **Concurrency:** n/a. No parallel render coordination is added; concurrent runs for the same output remain unsupported.
- **Security:** requirement. Existing safe scene ids and containment of every media output in `out/` remain unchanged. No secrets or broker requests; browser/font network dependencies remain as documented.
- **Logs and observability:** requirement. Existing printed still paths, render progress and failure messages apply to the new scene; validation diagnostics name the scene and offending phase, event, node or route.

Happy-path-only visual requirements need no artificial runtime error: their boundary checks are source fidelity, exact event frames and layout containment, not user-controlled component props. Source-string matching is reviewed against the article/diagram and frozen as local fixtures; no live-network test is added.

## Impact

Implementation affects `src/scenes/catalogue.ts`, `src/scenes/index.ts`, `src/Root.tsx`, `src/brand/`, a new `src/scenes/publish-subscribe/`, and corresponding `test/` suites; scripts may consume a narrowed common type but CLI syntax and output policy do not change. No new dependency. Existing circuit-breaker `scene.ts`, layout, composition and pinned regression test remain unmodified. No ADR is superseded.

## Open questions

Gate 1: approve the precise timing, the portrait row layout and the catalogue boundary in the design. No story decision is left to implementation. The movement depicts AUTO acknowledgment with a propagated invoice error; it must not imply all acknowledgment modes return failures to queues or that Publish confirms queue delivery.

## Documentation

- `README.md`: add the scene and its source URLs, describe common metadata versus state-machine/flow timelines, and list commands.
- `docs/roadmap.md`: record this as the first variety scene, not all variety work delivered.
- ADRs 0001–0004 remain unchanged. Brain project architecture/roadmap/changelog notes are a later owner/parent-session handover, not writes in this repository-only task.

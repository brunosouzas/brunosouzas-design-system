## ADDED Requirements

### Requirement: Pub-sub stills through existing commands
`npm run stills -- publish-subscribe` SHALL render each phase end plus the final frame for all four compositions, using the existing paths, stale-folder cleanup and stop-on-failure policy. The flow scene SHALL NOT require state-machine slots or transitions to build its commands. Owner approval of these stills SHALL precede video rendering.

#### Scenario: Pub-sub phase stills
- **GIVEN** the design's five phases ending at 239, 469, 609, 789 and 909
- **WHEN** `npm run stills -- publish-subscribe` completes
- **THEN** each composition has PNGs at 239, 469, 609, 789, 909 and 999 under `out/stills/<composition-id>/`, and 24 paths are printed; the owner reviews all four sets before videos

#### Scenario: Pub-sub dry runs remain effect free
- **GIVEN** existing outputs and a flow scene registered beside circuit-breaker
- **WHEN** stills and render are invoked for `publish-subscribe` with `--dry-run`
- **THEN** 24 still commands and eight render/encode commands respectively are printed in standard composition order, with no output written or deleted; circuit-breaker dry-run stills remain the same 28 commands

### Requirement: Pub-sub master and web copies
`npm run render -- publish-subscribe` SHALL produce four masters and four web copies with the existing encoding, order, progress and overwrite policies. Each SHALL have 1000 frames at 30 fps in its composition's dimensions, without audio. The web copy SHALL be smaller than its master; the owner SHALL review contact sheets taken from the web files and all four videos before approval.

#### Scenario: Pub-sub videos verified from output
- **GIVEN** owner-approved stills
- **WHEN** the render command finishes and its outputs are inspected
- **THEN** four progress lines name the compositions, four masters and four smaller web copies exist, media inspection confirms frame count, fps, dimensions and no audio, and web-derived contact sheets show the story and final hold

#### Scenario: Pub-sub render failure preserves earlier files
- **GIVEN** the first pub-sub composition completed
- **WHEN** rendering the second composition fails
- **THEN** the command exits 1 naming `publish-subscribe-16x9-en`, does not encode it or start portrait compositions, and preserves the completed first composition's files

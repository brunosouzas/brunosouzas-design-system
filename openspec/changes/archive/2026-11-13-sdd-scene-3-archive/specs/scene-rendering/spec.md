# Spec delta: scene-rendering (sdd-scene-3-archive)

## ADDED Requirements

### Requirement: SDD archive stills through existing commands
`npm run stills -- sdd-scene-3-archive` SHALL render its one composition's phase ends and last frame with the existing paths, stale-folder cleanup and stop-on-failure policy, needing no state-machine or flow data.

#### Scenario: Archive key-frame stills
- **GIVEN** the phases ending at 39, 119, 179, 259, 339, 399, 419, 469, 499 and the last frame 599
- **WHEN** `npm run stills -- sdd-scene-3-archive` completes
- **THEN** `out/stills/sdd-scene-3-archive-16x9/` holds exactly those 10 PNGs named `<frame>.png`, and 10 paths are printed

#### Scenario: Archive stills dry run
- **GIVEN** existing files in `out/`
- **WHEN** `npm run stills -- sdd-scene-3-archive --dry-run` runs
- **THEN** it prints 10 still commands for `sdd-scene-3-archive-16x9` in frame order, exits 0, and `out/` is unchanged

#### Scenario: Archive still failure
- **GIVEN** a runner that fails the still at frame 339
- **WHEN** the stills command runs
- **THEN** it exits 1 naming `sdd-scene-3-archive-16x9` and frame 339, starts no further still, and the stills at 39 to 259 stay

### Requirement: SDD archive master and web copy
`npm run render -- sdd-scene-3-archive` SHALL produce `out/master/sdd-scene-3-archive-16x9.mp4` and `out/web/sdd-scene-3-archive-16x9.mp4` with the existing encoding, progress and overwrite policies: 600 frames at 30 fps, 1920x1080, no audio stream, the web copy smaller than the master.

#### Scenario: Archive render dry run
- **WHEN** `npm run render -- sdd-scene-3-archive --dry-run` runs
- **THEN** it prints 2 commands (one render, one encode with `-an`), exits 0, and `out/` is unchanged

#### Scenario: Archive render failure
- **GIVEN** a runner that fails the render of `sdd-scene-3-archive-16x9`
- **WHEN** the render command runs
- **THEN** it exits 1 naming `sdd-scene-3-archive-16x9` and runs no encode

#### Scenario: Archive video verified from output (local)
- **WHEN** the render finishes and `npx remotion ffmpeg -hide_banner -i out/web/sdd-scene-3-archive-16x9.mp4` is read
- **THEN** the web copy is 1920x1080, 30 fps, 20 s (600 frames), has no audio stream and is smaller than the master; a contact sheet taken from the web file at the 9 still frames shows the beats of the change's design §4, and frames 500 and 599 of the composition render to identical PNGs

# Spec delta: scene-rendering (sdd-scene-1-relay)

## ADDED Requirements

### Requirement: SDD relay stills through existing commands
`npm run stills -- sdd-request-relay` SHALL render its one composition's phase ends and last frame with the existing paths, stale-folder cleanup and stop-on-failure policy, needing no state-machine or flow data.

#### Scenario: SDD relay key-frame stills
- **GIVEN** the phases ending at 49, 129, 219, 299, 389, 449, 529, 619, 699, 749, 849, 889 and 979, and the last frame 1079
- **WHEN** `npm run stills -- sdd-request-relay` completes
- **THEN** `out/stills/sdd-request-relay-16x9/` holds exactly those 14 PNGs named `<frame>.png`, and 14 paths are printed

#### Scenario: SDD relay stills dry run
- **GIVEN** existing files in `out/`
- **WHEN** `npm run stills -- sdd-request-relay --dry-run` runs
- **THEN** it prints 14 still commands for `sdd-request-relay-16x9` in frame order, exits 0, and `out/` is unchanged

#### Scenario: SDD relay still failure
- **GIVEN** a runner that fails the still at frame 699
- **WHEN** the stills command runs
- **THEN** it exits 1 naming `sdd-request-relay-16x9` and frame 699, starts no further still, and the stills at 49 to 619 stay

### Requirement: SDD relay master and web copy
`npm run render -- sdd-request-relay` SHALL produce `out/master/sdd-request-relay-16x9.mp4` and `out/web/sdd-request-relay-16x9.mp4` with the existing encoding, progress and overwrite policies: 1080 frames at 30 fps, 1920x1080, no audio stream, the web copy smaller than the master.

#### Scenario: SDD relay render dry run
- **WHEN** `npm run render -- sdd-request-relay --dry-run` runs
- **THEN** it prints 2 commands (one render, one encode with `-an`), exits 0, and `out/` is unchanged

#### Scenario: SDD relay render failure
- **GIVEN** a runner that fails the render of `sdd-request-relay-16x9`
- **WHEN** the render command runs
- **THEN** it exits 1 naming `sdd-request-relay-16x9` and runs no encode

#### Scenario: SDD relay video verified from output (local)
- **WHEN** the render finishes and `npx remotion ffmpeg -hide_banner -i out/web/sdd-request-relay-16x9.mp4` is read
- **THEN** the web copy is 1920x1080, 30 fps, 36 s (1080 frames), has no audio stream and is smaller than the master; a contact sheet taken from the web file at the 14 still frames shows the beats of the change's design §4, and frames 980 and 1079 of the composition render to identical PNGs

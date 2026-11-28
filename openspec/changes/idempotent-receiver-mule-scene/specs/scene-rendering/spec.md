# Spec delta: scene-rendering (idempotent-receiver-mule-scene)

## ADDED Requirements

### Requirement: Idempotent Receiver Mule stills through existing commands
`npm run stills -- idempotent-receiver-mule` SHALL render its one composition's phase ends and last frame with the existing paths, stale-folder cleanup and stop-on-failure policy, needing no state-machine or flow data.

#### Scenario: Idempotent Receiver Mule key-frame stills
- **GIVEN** the phases ending at 39, 119, 179, 239, 329, 419, 499, 609, 669, 749, 809, 869, 959, 1049, 1129, 1179 and 1249, and the last frame 1349
- **WHEN** `npm run stills -- idempotent-receiver-mule` completes
- **THEN** `out/stills/idempotent-receiver-mule-16x9/` holds exactly those 18 PNGs named `<frame>.png`, and 18 paths are printed

#### Scenario: Idempotent Receiver Mule stills dry run
- **GIVEN** existing files in `out/`
- **WHEN** `npm run stills -- idempotent-receiver-mule --dry-run` runs
- **THEN** it prints 18 still commands for `idempotent-receiver-mule-16x9` in frame order, exits 0, and `out/` is unchanged

#### Scenario: Idempotent Receiver Mule still failure
- **GIVEN** a runner that fails the still at frame 869
- **WHEN** the stills command runs
- **THEN** it exits 1 naming `idempotent-receiver-mule-16x9` and frame 869, starts no further still, and the stills at 39 to 809 stay

### Requirement: Idempotent Receiver Mule master and web copy
`npm run render -- idempotent-receiver-mule` SHALL produce `out/master/idempotent-receiver-mule-16x9.mp4` and `out/web/idempotent-receiver-mule-16x9.mp4` with the existing encoding, progress and overwrite policies: 1350 frames at 30 fps, 1920x1080, no audio stream, the web copy smaller than the master.

#### Scenario: Idempotent Receiver Mule render dry run
- **WHEN** `npm run render -- idempotent-receiver-mule --dry-run` runs
- **THEN** it prints 2 commands (one render, one encode with `-an`), exits 0, and `out/` is unchanged

#### Scenario: Idempotent Receiver Mule render failure
- **GIVEN** a runner that fails the render of `idempotent-receiver-mule-16x9`
- **WHEN** the render command runs
- **THEN** it exits 1 naming `idempotent-receiver-mule-16x9` and runs no encode

#### Scenario: Idempotent Receiver Mule video verified from output (local)
- **WHEN** the render finishes and `npx remotion ffmpeg -hide_banner -i out/web/idempotent-receiver-mule-16x9.mp4` is read
- **THEN** the web copy is 1920x1080, 30 fps, 45 s (1350 frames), has no audio stream and is smaller than the master; a contact sheet taken from the web file at the 18 still frames shows the beats of the change's design §4, and frames 1250 and 1349 of the composition render to identical PNGs

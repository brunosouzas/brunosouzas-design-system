# Spec delta: scene-rendering (sdd-scene-2-files)

## ADDED Requirements

### Requirement: SDD files stills through existing commands
`npm run stills -- sdd-scene-2-files` SHALL render its one composition's phase ends and last frame with the existing paths, stale-folder cleanup and stop-on-failure policy, needing no state-machine or flow data.

#### Scenario: SDD files key-frame stills
- **GIVEN** the phases ending at 39, 89, 149, 209, 279, 409, 459, 559, 599, 669 and 769, and the last frame 869
- **WHEN** `npm run stills -- sdd-scene-2-files` completes
- **THEN** `out/stills/sdd-scene-2-files-16x9/` holds exactly those 12 PNGs named `<frame>.png`, and 12 paths are printed

#### Scenario: SDD files stills dry run
- **GIVEN** existing files in `out/`
- **WHEN** `npm run stills -- sdd-scene-2-files --dry-run` runs
- **THEN** it prints 12 still commands for `sdd-scene-2-files-16x9` in frame order, exits 0, and `out/` is unchanged

#### Scenario: SDD files still failure
- **GIVEN** a runner that fails the still at frame 409
- **WHEN** the stills command runs
- **THEN** it exits 1 naming `sdd-scene-2-files-16x9` and frame 409, starts no further still, and the stills at 39 to 279 stay

### Requirement: SDD files master and web copy
`npm run render -- sdd-scene-2-files` SHALL produce `out/master/sdd-scene-2-files-16x9.mp4` and `out/web/sdd-scene-2-files-16x9.mp4` with the existing encoding, progress and overwrite policies: 870 frames at 30 fps, 1920x1080, no audio stream, the web copy smaller than the master.

#### Scenario: SDD files render dry run
- **WHEN** `npm run render -- sdd-scene-2-files --dry-run` runs
- **THEN** it prints 2 commands (one render, one encode with `-an`), exits 0, and `out/` is unchanged

#### Scenario: SDD files render failure
- **GIVEN** a runner that fails the render of `sdd-scene-2-files-16x9`
- **WHEN** the render command runs
- **THEN** it exits 1 naming `sdd-scene-2-files-16x9` and runs no encode

#### Scenario: SDD files video verified from output (local)
- **WHEN** the render finishes and `npx remotion ffmpeg -hide_banner -i out/web/sdd-scene-2-files-16x9.mp4` is read
- **THEN** the web copy is 1920x1080, 30 fps, 29 s (870 frames), has no audio stream and is smaller than the master; a contact sheet taken from the web file at the 12 still frames shows the beats of the change's design §4, and frames 770 and 869 of the composition render to identical PNGs

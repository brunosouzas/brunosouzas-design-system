# Spec delta: scene-rendering (idempotent-receiver-book-scene)

## ADDED Requirements

### Requirement: Idempotent Receiver book stills through existing commands
`npm run stills -- idempotent-receiver-book` SHALL render its one composition's phase ends and last frame with the existing paths, stale-folder cleanup and stop-on-failure policy, needing no state-machine or flow data.

#### Scenario: Idempotent Receiver book key-frame stills
- **GIVEN** the phases ending at 39, 99, 159, 219, 259, 319, 379, 439, 499, 539, 589, 639 and 679, and the last frame 779
- **WHEN** `npm run stills -- idempotent-receiver-book` completes
- **THEN** `out/stills/idempotent-receiver-book-16x9/` holds exactly those 14 PNGs named `<frame>.png`, and 14 paths are printed

#### Scenario: Idempotent Receiver book stills dry run
- **GIVEN** existing files in `out/`
- **WHEN** `npm run stills -- idempotent-receiver-book --dry-run` runs
- **THEN** it prints 14 still commands for `idempotent-receiver-book-16x9` in frame order, exits 0, and `out/` is unchanged

#### Scenario: Idempotent Receiver book still failure
- **GIVEN** a runner that fails the still at frame 499
- **WHEN** the stills command runs
- **THEN** it exits 1 naming `idempotent-receiver-book-16x9` and frame 499, starts no further still, and the stills at 39 to 439 stay

### Requirement: Idempotent Receiver book master and web copy
`npm run render -- idempotent-receiver-book` SHALL produce `out/master/idempotent-receiver-book-16x9.mp4` and `out/web/idempotent-receiver-book-16x9.mp4` with the existing encoding, progress and overwrite policies: 780 frames at 30 fps, 1920x1080, no audio stream, the web copy smaller than the master.

#### Scenario: Idempotent Receiver book render dry run
- **WHEN** `npm run render -- idempotent-receiver-book --dry-run` runs
- **THEN** it prints 2 commands (one render, one encode with `-an`), exits 0, and `out/` is unchanged

#### Scenario: Idempotent Receiver book render failure
- **GIVEN** a runner that fails the render of `idempotent-receiver-book-16x9`
- **WHEN** the render command runs
- **THEN** it exits 1 naming `idempotent-receiver-book-16x9` and runs no encode

#### Scenario: Idempotent Receiver book video verified from output (local)
- **WHEN** the render finishes and `npx remotion ffmpeg -hide_banner -i out/web/idempotent-receiver-book-16x9.mp4` is read
- **THEN** the web copy is 1920x1080, 30 fps, 26 s (780 frames), has no audio stream and is smaller than the master; a contact sheet taken from the web file at the 14 still frames shows the beats of the change's design §4, and frames 680 and 779 of the composition render to identical PNGs

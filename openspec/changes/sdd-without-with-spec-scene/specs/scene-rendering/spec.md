## ADDED Requirements

### Requirement: SDD stills through existing commands
`npm run stills -- sdd-without-with-spec` SHALL render its one composition's phase ends and last frame, using the existing paths, stale-folder cleanup and stop-on-failure policy, with no state-machine or flow data needed to build the commands. The owner's approval of these stills SHALL precede any video render of the scene.

#### Scenario: SDD key-frame stills
- **GIVEN** the phases ending at 89, 239, 309, 377, 509, 599 and 689, and the last frame 779
- **WHEN** `npm run stills -- sdd-without-with-spec` completes
- **THEN** `out/stills/sdd-without-with-spec-16x9/` holds exactly `89.png`, `239.png`, `309.png`, `377.png`, `509.png`, `599.png`, `689.png` and `779.png`, and 8 paths are printed

#### Scenario: SDD stills dry run
- **GIVEN** existing files in `out/`
- **WHEN** `npm run stills -- sdd-without-with-spec --dry-run` runs
- **THEN** it prints 8 still commands for `sdd-without-with-spec-16x9`, in frame order, exits 0, and `out/` is unchanged; the circuit-breaker dry run still prints 28 commands and pub-sub's 24

#### Scenario: SDD still failure
- **GIVEN** a runner that fails the still at frame 377
- **WHEN** the stills command runs
- **THEN** it exits 1 naming `sdd-without-with-spec-16x9` and frame 377, starts no further still, and the stills at 89 to 309 stay

### Requirement: SDD master and web copy
`npm run render -- sdd-without-with-spec` SHALL produce one master `out/master/sdd-without-with-spec-16x9.mp4` and one web copy `out/web/sdd-without-with-spec-16x9.mp4`, with the existing encoding, progress and overwrite policies: 780 frames at 30 fps, 1920x1080, no audio, the web copy smaller than the master.

#### Scenario: SDD render dry run
- **WHEN** `npm run render -- sdd-without-with-spec --dry-run` runs
- **THEN** it prints 2 commands (one render, one encode, with `-an`), exits 0, and `out/` is unchanged

#### Scenario: SDD video verified from output (local)
- **GIVEN** owner-approved stills
- **WHEN** the render finishes and `npx remotion ffmpeg -hide_banner -i out/web/sdd-without-with-spec-16x9.mp4` is read
- **THEN** one progress line names the composition; the web copy is 1920x1080, 30 fps, 26 s (780 frames), has no audio stream and is smaller than the master; a contact sheet taken from the web file shows the eight beats and a final still in which frames 690 and 779 match

#### Scenario: SDD render failure
- **GIVEN** a runner that fails the render of `sdd-without-with-spec-16x9`
- **WHEN** the render command runs
- **THEN** it exits 1 naming `sdd-without-with-spec-16x9` and runs no encode

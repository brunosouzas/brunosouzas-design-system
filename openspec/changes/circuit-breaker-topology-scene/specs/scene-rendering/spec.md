## ADDED Requirements

### Requirement: Topology stills through existing commands
`npm run stills -- circuit-breaker-topology` SHALL render its one composition's phase ends and last frame with the existing paths, stale-folder cleanup and stop-on-failure policy, needing no state-machine or flow data. The owner's approval of these stills SHALL come before any video render of the scene.

#### Scenario: Topology key-frame stills
- **GIVEN** the phases ending at 59, 389, 449, 509, 569, 819, 949, 1019, 1149, 1219, 1489, 1599 and 1799, and the last frame 1919
- **WHEN** `npm run stills -- circuit-breaker-topology` completes
- **THEN** `out/stills/circuit-breaker-topology-16x9/` holds exactly those 14 PNGs named `<frame>.png`, and 14 paths are printed

#### Scenario: Topology stills dry run
- **GIVEN** existing files in `out/`
- **WHEN** `npm run stills -- circuit-breaker-topology --dry-run` runs
- **THEN** it prints 14 still commands for `circuit-breaker-topology-16x9` in frame order, exits 0, and `out/` is unchanged; the circuit-breaker dry run still prints 28 commands, pub-sub's 24 and `sdd-without-with-spec`'s 8

#### Scenario: Topology still failure
- **GIVEN** a runner that fails the still at frame 819
- **WHEN** the stills command runs
- **THEN** it exits 1 naming `circuit-breaker-topology-16x9` and frame 819, starts no further still, and the stills at 59 to 569 stay

### Requirement: Topology master and web copy
`npm run render -- circuit-breaker-topology` SHALL produce `out/master/circuit-breaker-topology-16x9.mp4` and `out/web/circuit-breaker-topology-16x9.mp4` with the existing encoding, progress and overwrite policies: 1920 frames at 30 fps, 1920x1080, no audio stream, the web copy smaller than the master.

#### Scenario: Topology render dry run
- **WHEN** `npm run render -- circuit-breaker-topology --dry-run` runs
- **THEN** it prints 2 commands (one render, one encode with `-an`), exits 0, and `out/` is unchanged

#### Scenario: Topology video verified from output (local)
- **GIVEN** owner-approved stills
- **WHEN** the render finishes and `npx remotion ffmpeg -hide_banner -i out/web/circuit-breaker-topology-16x9.mp4` is read
- **THEN** the web copy is 1920x1080, 30 fps, 64 s (1920 frames), has no audio stream and is smaller than the master; a contact sheet taken from the web file at the 14 still frames shows the beats of the change's design §4.2

#### Scenario: Topology render failure
- **GIVEN** a runner that fails the render of `circuit-breaker-topology-16x9`
- **WHEN** the render command runs
- **THEN** it exits 1 naming `circuit-breaker-topology-16x9` and runs no encode

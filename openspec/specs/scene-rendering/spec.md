# scene-rendering Specification

## Purpose
Turns a catalogue scene into the files the owner reviews and publishes: key-frame stills for review, and per composition a fast master video plus a small web copy, without any tool outside the project's dependencies.

## Requirements

### Requirement: Stills for review
`npm run stills -- <scene>` SHALL render, for every composition of the scene, one PNG per phase (at the phase's `to` frame) plus the composition's last frame, to `out/stills/<composition-id>/<frame>.png`, and print each path after it is written. Before rendering a composition's stills it empties that composition's folder, so stills from an earlier timeline do not linger.

#### Scenario: Stills of the circuit-breaker scene
- **WHEN** the owner runs `npm run stills -- circuit-breaker-states`
- **THEN** each of the four compositions gets seven PNGs (frames 200, 365, 500, 620, 775, 990 and 999) under its own folder, and 28 paths are printed

#### Scenario: Stale stills removed
- **WHEN** `out/stills/circuit-breaker-states-16x9-pt/` holds `123.png` from an earlier run
- **THEN** after the stills run that folder holds only the seven current PNGs

### Requirement: Master and web videos
`npm run render -- <scene>` SHALL render each composition to `out/master/<composition-id>.mp4` (H.264, hardware acceleration when available), then re-encode it with Remotion's bundled ffmpeg to `out/web/<composition-id>.mp4` (x264, CRF 30, `yuv420p`, fast start, no audio). Order: 16x9-pt, 16x9-en, 4x5-pt, 4x5-en, each rendered and encoded before the next. One line per composition gives its id, elapsed seconds and both sizes.

#### Scenario: Render of the circuit-breaker scene
- **WHEN** the owner runs `npm run render -- circuit-breaker-states`
- **THEN** four masters and four web copies exist, each web copy plays for 1000 frames at 30 frames per second and is smaller than its master, and four progress lines are printed

#### Scenario: Progress line
- **WHEN** a composition finishes rendering and encoding
- **THEN** one line with its id, the elapsed seconds and the master and web sizes is printed before the next composition starts

#### Scenario: Rendering again
- **WHEN** the same scene is rendered twice
- **THEN** the second run overwrites the files of the first

### Requirement: Dry run
Both commands SHALL accept `--dry-run` (exactly that spelling, at most once), which prints every command they would run, in order, and writes or deletes nothing.

#### Scenario: Dry run of a render
- **WHEN** `npm run render -- circuit-breaker-states --dry-run` runs
- **THEN** it prints eight commands (four renders, four encodes), exits 0, and `out/` is unchanged

#### Scenario: Dry run of stills
- **WHEN** `npm run stills -- circuit-breaker-states --dry-run` runs
- **THEN** it prints 28 still commands, exits 0, and `out/` is unchanged (no folder emptied)

### Requirement: Invalid invocation and failures
Both commands SHALL take one scene name and the optional `--dry-run`, in any order, and SHALL exit 1 without writing anything on a bad invocation, reporting only the first problem in this order: unknown option (including `--dry-run=…`), repeated `--dry-run`, more than one name, missing name, unknown scene; the message lists the available scenes. When a render, encode or still fails, the command SHALL stop, exit 1 and name the composition; files already finished stay.

#### Scenario: Unknown scene
- **WHEN** `npm run render -- circuit-break` runs
- **THEN** it exits 1, prints `circuit-breaker-states` among the available scenes, and writes nothing

#### Scenario: Missing argument
- **WHEN** `npm run stills` runs with no scene
- **THEN** it exits 1 and prints the usage and the available scenes

#### Scenario: Unknown option
- **WHEN** `npm run render -- circuit-breaker-states --fast` runs
- **THEN** it exits 1, names `--fast` as unknown, and writes nothing

#### Scenario: Two scene names
- **WHEN** `npm run render -- circuit-breaker-states other` runs
- **THEN** it exits 1, says only one scene is accepted, and writes nothing

#### Scenario: Repeated or valued dry run
- **WHEN** `npm run render -- circuit-breaker-states --dry-run --dry-run` runs, or `--dry-run=1` is given
- **THEN** it exits 1, naming the repeated option or `--dry-run=1` as unknown, and writes nothing

#### Scenario: Still failure
- **WHEN** the still at frame 500 of `circuit-breaker-states-16x9-en` fails
- **THEN** the command exits 1, names that composition and frame, and starts no further still

#### Scenario: Unknown option and unknown scene together
- **WHEN** `npm run render -- circuit-break --fast` runs
- **THEN** it exits 1 naming only `--fast` as unknown

#### Scenario: Render failure
- **WHEN** the render of `circuit-breaker-states-16x9-en` fails
- **THEN** the command exits 1, names that composition, runs no encode for it, and does not start `circuit-breaker-states-4x5-pt`

#### Scenario: Encode failure
- **WHEN** the encode of `circuit-breaker-states-4x5-pt` fails
- **THEN** the command exits 1, names that composition, does not start `circuit-breaker-states-4x5-en`, and the files of the two 16x9 compositions are still in `out/`

### Requirement: Output location
Every media file the commands produce (masters, web copies, stills) SHALL be inside `out/` in the repository, which Git ignores. Remotion also keeps its own caches (the bundler cache in `node_modules/.cache/` and its browser in `node_modules/.remotion/`, both ignored with `node_modules/`, plus temporary files in the system temp folder); those are the library's, not outputs of these commands.

#### Scenario: Paths of every media output
- **WHEN** the command list of a render or stills run is built
- **THEN** every output path in it (master, web copy, still) is under `out/`

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

### Requirement: Topology stills through existing commands
`npm run stills -- circuit-breaker-topology` SHALL render its one composition's phase ends and last frame with the existing paths, stale-folder cleanup and stop-on-failure policy, needing no state-machine or flow data. The owner's approval of these stills SHALL come before any video render of the scene.

#### Scenario: Topology key-frame stills
- **GIVEN** the phases ending at 59, 389, 449, 509, 569, 819, 949, 1019, 1149, 1219, 1489, 1599 and 1799, and the last frame 1919
- **WHEN** `npm run stills -- circuit-breaker-topology` completes
- **THEN** `out/stills/circuit-breaker-topology-16x9/` holds exactly those 14 PNGs named `<frame>.png`, and 14 paths are printed

#### Scenario: Topology stills dry run
- **GIVEN** existing files in `out/`
- **WHEN** `npm run stills -- circuit-breaker-topology --dry-run` runs
- **THEN** it prints 14 still commands for `circuit-breaker-topology-16x9` in frame order, exits 0, and `out/` is unchanged; the circuit-breaker dry run still prints 28 commands and pub-sub's 24

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

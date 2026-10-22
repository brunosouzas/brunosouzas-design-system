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

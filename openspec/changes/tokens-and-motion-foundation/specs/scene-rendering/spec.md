# Spec Delta

## Purpose

Turns a catalogue scene into the files the owner reviews and publishes: key-frame stills for review, and per composition a fast master video plus a small web copy, without any tool outside the project's dependencies.

## ADDED Requirements

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
Every file the commands name as an output SHALL be inside `out/` in the repository, which Git ignores. Remotion's own temporary bundle and browser cache, which the library manages outside the repository, are not outputs of these commands.

#### Scenario: Paths of every written file
- **WHEN** a render or stills run finishes
- **THEN** every file it wrote is under `out/`

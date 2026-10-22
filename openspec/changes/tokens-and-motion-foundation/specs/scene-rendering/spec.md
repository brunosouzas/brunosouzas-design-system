# Spec Delta

## Purpose

Turns a catalogue scene into the files the owner reviews and publishes: key-frame stills for review, and per composition a fast master video plus a small web copy, without any tool outside the project's dependencies.

## ADDED Requirements

### Requirement: Stills for review
`npm run stills -- <scene>` SHALL render, for every composition of the scene, one PNG per phase (at the phase's last frame) plus the composition's last frame, to `out/stills/<composition-id>/<frame>.png`, and print each path.

#### Scenario: Stills of the circuit-breaker scene
- **WHEN** the owner runs `npm run stills -- circuit-breaker-states`
- **THEN** each of the four compositions gets seven PNGs (six phases and the last frame) under its own folder

### Requirement: Master and web videos
`npm run render -- <scene>` SHALL render every composition of the scene to `out/master/<composition-id>.mp4` (H.264, hardware acceleration used when the machine offers it) and then re-encode it to `out/web/<composition-id>.mp4` (H.264 with x264, CRF 30, `yuv420p`, fast start, no audio) using the ffmpeg bundled with Remotion. It prints one line per composition with the elapsed seconds and both file sizes.

#### Scenario: Render of the circuit-breaker scene
- **WHEN** the owner runs `npm run render -- circuit-breaker-states`
- **THEN** four masters and four web copies exist, each web copy plays for 1000 frames at 30 frames per second and is smaller than its master

#### Scenario: Rendering again
- **WHEN** the same scene is rendered twice
- **THEN** the second run overwrites the files of the first

### Requirement: Dry run
Both commands SHALL accept `--dry-run`, which prints every render and encode command they would run, in order, and writes nothing.

#### Scenario: Dry run of a render
- **WHEN** `npm run render -- circuit-breaker-states --dry-run` runs
- **THEN** it prints eight commands (four renders, four encodes), exits 0, and `out/` is unchanged

### Requirement: Invalid invocation and failures
Both commands SHALL exit 1 without writing anything when the scene argument is missing or names no scene, printing the available scene names. When a render or encode fails, the command SHALL stop, exit 1 and name the composition; files already finished stay.

#### Scenario: Unknown scene
- **WHEN** `npm run render -- circuit-break` runs
- **THEN** it exits 1, prints `circuit-breaker-states` among the available scenes, and writes nothing

#### Scenario: Missing argument
- **WHEN** `npm run stills` runs with no scene
- **THEN** it exits 1 and prints the usage and the available scenes

#### Scenario: Unknown option
- **WHEN** `npm run render -- circuit-breaker-states --fast` runs
- **THEN** it exits 1, names `--fast` as unknown, and writes nothing

#### Scenario: Encode failure
- **WHEN** the encode of `circuit-breaker-states-4x5-pt` fails
- **THEN** the command exits 1, names that composition, and does not start the next one

### Requirement: Output location
The commands SHALL write only inside `out/` in the repository, which Git ignores.

#### Scenario: Paths of every written file
- **WHEN** a render or stills run finishes
- **THEN** every file it wrote is under `out/`

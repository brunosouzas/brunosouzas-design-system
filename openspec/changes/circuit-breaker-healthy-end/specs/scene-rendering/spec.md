## MODIFIED Requirements

### Requirement: Stills for review
`npm run stills -- <scene>` SHALL render, for every composition of the scene, one PNG per phase (at the phase's `to` frame) plus the composition's last frame, to `out/stills/<composition-id>/<frame>.png`, and print each path after it is written. Before rendering a composition's stills it empties that composition's folder, so stills from an earlier timeline do not linger.

#### Scenario: Stills of the circuit-breaker scene
- **WHEN** the owner runs `npm run stills -- circuit-breaker-states`
- **THEN** each of the four compositions gets seven PNGs (frames 200, 365, 500, 620, 775, 1140 and 1149) under its own folder, and 28 paths are printed

#### Scenario: Stale stills removed
- **WHEN** `out/stills/circuit-breaker-states-16x9-pt/` holds `123.png` from an earlier run
- **THEN** after the stills run that folder holds only the seven current PNGs

### Requirement: Master and web videos
`npm run render -- <scene>` SHALL render each composition to `out/master/<composition-id>.mp4` (H.264, hardware acceleration when available), then re-encode it with Remotion's bundled ffmpeg to `out/web/<composition-id>.mp4` (x264, CRF 30, `yuv420p`, fast start, no audio). Order: 16x9-pt, 16x9-en, 4x5-pt, 4x5-en, each rendered and encoded before the next. One line per composition gives its id, elapsed seconds and both sizes.

#### Scenario: Render of the circuit-breaker scene
- **WHEN** the owner runs `npm run render -- circuit-breaker-states`
- **THEN** four masters and four web copies exist, each web copy plays for 1150 frames at 30 frames per second and is smaller than its master, and four progress lines are printed

#### Scenario: Progress line
- **WHEN** a composition finishes rendering and encoding
- **THEN** one line with its id, the elapsed seconds and the master and web sizes is printed before the next composition starts

#### Scenario: Rendering again
- **WHEN** the same scene is rendered twice
- **THEN** the second run overwrites the files of the first

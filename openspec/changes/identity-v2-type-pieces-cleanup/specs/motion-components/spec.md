## ADDED Requirements

### Requirement: Scene fonts
The scenes SHALL load Source Sans 3 (400, 700, 900) and Source Code Pro (400, 700) through `@remotion/google-fonts`, in the font module `src/brand/fonts.ts`, and compose each loaded family with its token stack (`font.sans`, `font.mono`). No file under `src/` loads Lato. Tests and scripts never import the font module, so they need no network.

#### Scenario: Source families loaded
- **WHEN** the test reads `src/brand/fonts.ts`
- **THEN** it imports `@remotion/google-fonts/SourceSans3` with weights 400, 700 and 900 and `@remotion/google-fonts/SourceCodePro` with weights 400 and 700, and exports a sans and a mono family that end with `font.sans` and `font.mono`

#### Scenario: No Lato left
- **WHEN** the test scans `src/` for `google-fonts/Lato` or the word `Lato`
- **THEN** it finds nothing

## MODIFIED Requirements

### Requirement: Components take values only from the tokens
Every colour, and every value a token group defines (outlines, shadows, radii, fonts, motion timings), SHALL come from the generated TypeScript tokens. Files under `src/brand/` and `src/scenes/` SHALL contain no colour literal (`#` with three or six hex digits, `rgb(`, `hsl(`); `transparent` and `none` are allowed. The component constants listed in the design stay in code; choreography frames belong to the scene's timeline.

#### Scenario: Colour literal in a component
- **WHEN** a component file contains `#FF8A3D`, or another contains `rgb(255, 138, 61)`
- **THEN** the component test fails and names each file and line

#### Scenario: Real sources are clean
- **WHEN** the test scans the repository's `src/brand/` and `src/scenes/`
- **THEN** it reports no colour literal, and no file reads a top-level state colour (`color.healthy` … `color.failFast`) instead of `color.state.*`

#### Scenario: Token change reaches the components
- **WHEN** `color.ink` changes in the source and the tokens are rebuilt
- **THEN** a still rendered afterwards draws outlines in the new ink, and with the `shadow` tokens at 0 it shows no offset shadow

### Requirement: Call results and countdown
A call-result square SHALL show one of four kinds: `ok` (white fill, ink check mark), `fail` (failure colour, white cross), `blocked` (ink fill, white dash) and `empty` (dashed outline, no fill). A countdown ring SHALL be full at its phase's `from` frame and empty at its `to` frame (phase ranges are inclusive), decreasing linearly between them.

#### Scenario: Blocked call inside the OPEN block
- **WHEN** a `blocked` result is shown inside a block filled with `color.state.blocked`
- **THEN** the square is filled with `color.ink`, not with the block's colour

#### Scenario: Countdown at the phase boundaries
- **WHEN** the frame is the phase's `from`, its midpoint, and its `to`
- **THEN** the ring is full, half full, and empty

### Requirement: Exchange queue and tagged container shapes
Reusable exchange, queue and tagged-container shapes SHALL use generated tokens for colours, type, outlines, radii and motion, with no visible hard offset shadow (the `shadow` tokens are 0, ADR 0009). The exchange SHALL be a white elongated hexagon; the queue a white rounded rectangle with two inset end rails; the container white with a `color.white` pill tab, as the `taggedContainer` piece. Contents and placement SHALL be supplied by the scene, not hard-coded broker names or topology.

#### Scenario: Generic shapes match the diagram language
- **GIVEN** shapes with scene-supplied text and bounds
- **WHEN** their settled appearance is inspected
- **THEN** they have ink outlines and a shadow offset of 0, the exchange's six vertices, queue's two end rails and container's white tab; they contain no hard-coded Anypoint or order labels and use existing token values only

#### Scenario: Shapes before appearance
- **GIVEN** each shape's pop-in frame
- **WHEN** the preceding frame and the pop-in frame are evaluated
- **THEN** it is invisible before appearance and uses the existing token-driven pop spring on appearance, without replacing its opacity with scene focus

### Requirement: Failure and confirmation contrast
Checks SHALL be white squares with ink checks. From the invoice failure on, the Invoice consumer block SHALL be filled with `color.state.failure` and carry a white square with an ink cross, sized and placed like the ACK checks. The return path and returned token outline SHALL use `color.state.failure`, other outlines ink; tokens SHALL be filled with `color.state.caller`. Other blocks SHALL stay healthy; no mark SHALL take its block's hue.

#### Scenario: Failure stays local and marks remain visible
- **GIVEN** the invoice failure and NACK frames
- **WHEN** scene appearance data and review stills are inspected
- **THEN** only the invoice block turns `color.state.failure`, with a white square and ink cross, and only invoice has the red return path/token outline; payment, inventory and API checks remain white/ink against green application blocks; every token is filled with `color.state.caller`; there is no orange blocked path or red publisher

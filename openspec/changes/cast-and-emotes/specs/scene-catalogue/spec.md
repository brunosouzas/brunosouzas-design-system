## ADDED Requirements

### Requirement: Cast motion test
The Studio SHALL register the approved cast motion test as composition `cast-motion-test` in a folder `cast`: 1920×1080, `motion.fps`, 360 frames, no words. It SHALL draw `castMotionTestFrame(frame)` from `src/scenes/cast-motion-test/frames.ts`, the timeline of design §8 of `cast-and-emotes`. It SHALL NOT be a catalogue scene: it illustrates no article (ADR 0004), so it is not in `src/scenes/index.ts`.

#### Scenario: Registered outside the catalogue
- **WHEN** the test calls `RemotionRoot()` and walks the returned element tree
- **THEN** it finds exactly one `Composition` with id `cast-motion-test`, inside a `Folder` named `cast`, with width 1920, height 1080, fps 30 and 360 frames, and `scenes` from `src/scenes/index.ts` has no scene with that id

#### Scenario: Not a scene for the commands
- **WHEN** `npm run stills -- cast-motion-test --dry-run` runs
- **THEN** it fails as for any unknown scene, listing the catalogue's scenes

### Requirement: One emote at a time in the motion test
The motion test SHALL show at most one emote per frame, each popping in with its character's face change and gone before the next emote appears, as design §8: `idea` with the agent's `happy` at 62, `doubt` with the requester's `thinking` at 142, `problem` with the dev's `surprised` at 246.

#### Scenario: Emote windows
- **WHEN** the test lists the `data-emote` groups of every frame
- **THEN** frames 63–121 hold only `idea`, 143–215 only `doubt`, 247–319 only `problem`, and every other frame none

#### Scenario: Onset with the face
- **WHEN** frames 62, 142 and 246 are drawn
- **THEN** the agent's face is `happy`, the requester's `thinking` and the dev's `surprised` respectively, and the emote is absent at that frame and present at the next

### Requirement: Motion test frames frozen
For each frame f from 0 to 359, the SHA-256 of `toSvg(castMotionTestFrame(f))` SHALL equal entry f of `frames` in `test/fixtures/cast-0.5.0.json`. The frame has no text node.

#### Scenario: Every frame matches
- **WHEN** the test renders all 360 frames to SVG strings
- **THEN** every hash matches its entry, and no frame holds a `text` node

#### Scenario: A changed beat is caught
- **WHEN** the idea emote's pop-in moves from frame 62 to 63
- **THEN** the test fails and names frames 63 to 111, and only those (the emote is absent at 62 either way, and leaves from 112 on the same curve)

#### Scenario: React path matches
- **WHEN** frames 0, 75, 160 and 280 are rendered with `toReact` inside an `svg` root and with `toSvg`
- **THEN** their normal forms match

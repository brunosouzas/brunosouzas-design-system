## ADDED Requirements

### Requirement: Dashed motion path
A `MotionPath` component SHALL draw a scene-supplied SVG path with no fill, stroked `scene.pathColor` at `scene.pathWidth`, dashed `scene.pathDash` / `scene.pathGap` with round caps, in composition pixels. Its opacity at a frame SHALL come from a pure helper of the frame, a fade-in range and an optional fade-out range, rising and falling linearly; at opacity 0 nothing is drawn.

#### Scenario: Fade in and out
- **GIVEN** fade-in [90, 100] and fade-out [220, 230]
- **WHEN** the helper is read at 89, 90, 95, 100, 219, 225 and 230
- **THEN** it gives 0, 0, 0.5, 1, 1, 0.5 and 0, and the component draws nothing at 89 and 230

#### Scenario: No fade-out
- **GIVEN** fade-in [590, 600] and no fade-out
- **WHEN** the helper is read at 600 and 779
- **THEN** both give 1

#### Scenario: Drawn from the tokens
- **GIVEN** the component's drawing data for a path at opacity 1
- **WHEN** it is read
- **THEN** stroke, width and dash equal `scene.pathColor`, `scene.pathWidth` and `scene.pathDash scene.pathGap`, line caps are round, fill is none, and the source file holds no colour literal

#### Scenario: Bad ranges
- **GIVEN** a fade-in [100, 90], a fade-out [230, 220], a fade-out starting before the fade-in ends, or a non-finite frame
- **WHEN** the helper is called
- **THEN** each throws a `RangeError` naming `fadeIn`, `fadeOut`, `fadeOut` or `frame`

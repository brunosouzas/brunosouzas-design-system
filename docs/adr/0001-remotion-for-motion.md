# ADR 0001: Remotion for animated explainers

- Status: accepted
- Date: 2026-10-22

## Context

The blog explains how systems behave. Static diagrams show states; an animation can show the change between them. The animations must look like the blog's static diagrams, stay consistent across many scenes, render the same scene in several formats (16:9 for articles, 4:5 for LinkedIn) and languages (Portuguese, English), and be written mostly by an AI coding agent directed in plain language by the author, who is not a motion designer.

A pilot (`docs/spikes/2026-10-22-motion-pilot/`) built the circuit-breaker state machine with Remotion, and the author approved it with no changes.

## Options considered

1. **Remotion** (React components rendered to video). Code is the source; agent skills published by the Remotion team; a Studio for frame-by-frame review; parameterised compositions; local rendering.
2. **Motion Canvas** (TypeScript generators rendered to video). Code-first and open source (MIT), but a smaller ecosystem and no official agent skills; the components would not share React with anything else.
3. **AI video generators** (prompt to video). Fast for one clip, but each output differs: no shared components, no exact colours or labels, no reproducible re-render after a correction.
4. **Hand animation** (After Effects or similar). Full control, but the author would have to animate by hand, every format and language is a separate edit, and an agent cannot write it.
5. **Lottie or CSS/SVG animation only.** Light on a web page, but weak for 30-second explainers with captions and video export for LinkedIn.

## Decision

Use Remotion 4 for every animated explainer. A scene is a set of React components and data files rendered with the Remotion CLI.

## Consequences

- Scenes are reproducible from code, and a correction is a code change followed by a re-render.
- The same composition renders every format and language through props.
- Remotion's licence applies to anyone who renders with this code: free for individuals and companies of up to three people; larger companies need a company licence. The README says so.
- A light animation inside a web page (a site banner) is not a video: it should be CSS or SVG generated from the same tokens (see ADR 0002).
- Rendering needs Node.js and a headless Chrome that Remotion downloads; a 33-second scene takes one to two minutes on an Apple M3.

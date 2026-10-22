# ADR 0002: One token source, generated exports

- Status: accepted
- Date: 2026-10-22

## Context

The identity is used in three places today, each with its own copy of the values: the site's CSS theme (`#121212` text, greys), the SVG generators of covers and diagrams (hex values written in each script and in the designer skill's references), and the motion pilot (`tokens.ts`). The copies have already drifted: the site's dark ink is not the illustrations' ink. Every new consumer would add another copy.

## Options considered

1. **Keep a copy per consumer.** No build step, but drift is guaranteed and a palette change means editing every copy.
2. **One TypeScript module as the source**, imported where possible. Simple for the animations, but the site's CSS and the Python SVG scripts cannot import TypeScript.
3. **One data file as the source, with generated exports** for each consumer: CSS custom properties for the site, a typed TypeScript module for the components, plain JSON for scripts in any language.

## Decision

Option 3. The tokens live in one data file in the repository. A build step generates the CSS, TypeScript and JSON exports, and the consumers read only those exports. The file format and the build tool are decided in the first change's design, which must justify any new dependency.

## Consequences

- A palette change is one edit plus a build; consumers pick it up when they update.
- Tokens carry semantic names (`healthy`, `blocked`, `transitional`, `failure`), not hue names, so a value can change without changing its meaning (ADR 0003).
- Motion timings (springs, frame counts, reading hold) are tokens too, so the rhythm is shared like the colours.
- The site and the SVG generators still need their own changes to consume the exports; until then they keep their copies (roadmap items 3 and 4).

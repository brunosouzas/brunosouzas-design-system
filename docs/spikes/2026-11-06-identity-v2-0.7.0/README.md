# Spike: how Source reaches an image shown through `<img>` (card 300, 2026-11-06)

Evidence for [ADR 0008](../../adr/0008-type-inside-the-image.md) and Decision 1 of the change `identity-v2-type-pieces-cleanup` (`openspec/changes/identity-v2-type-pieces-cleanup/design.md`).

## Question

The site shows covers and body diagrams as SVG files inside `<img>`, which cannot load web fonts or any external resource. Which way of bringing the Source faces into the image gives the reader Source, at what cost?

## How it was measured

- Four published images, built with package 0.6.1: two covers (`spec-driven-development-card`, labels in Sans 800/900; `srp-card`, with code in mono) and two body diagrams (`correlation-identifier` payment callback, Portuguese; `circuit-breaker-states`, Portuguese).
- Each image was written in four variants: the font stack only, a per-image subset embedded as `@font-face` (only the glyphs the image's text uses), the whole Latin file of each face embedded, and the text converted to outlines.
- Sizes are the SVG files after `gzip -9`, as the site serves them.
- Every variant was rendered by headless Chrome with the SVG inside an `<img>`, as the site shows it. `rsvg-convert` was not used: it ignores embedded fonts.
- The subsetter that was kept, `harfbuzzjs` 1.6.4 through its raw wasm exports, wrote the same bytes on every run.

## Sizes (gzip -9)

| Option | Reader sees | Cover (spec-driven development) | Diagram (callback) |
|---|---|---|---|
| Stack only (`'Source Sans 3', …`) | Helvetica/Arial (same as today with Lato) | 1.8 KB | 2.9 KB |
| **Per-image subset embedded** | Source | 4.2 KB | 10.8 KB |
| Whole Latin file of each face embedded | Source | 33 KB | 46 KB |
| Text converted to outlines | Source, text no longer text | 6.6 KB | 113 KB |

Result: only the embedded subset gives the reader Source at a cost close to today's file. Outlines were rejected for their size on diagrams and because the text stops being text; the whole Latin file adds 29-46 KB per image, on a listing page that shows about 20 covers.

## Renders

The sheets were made for the owner's review, so their captions are in Portuguese ("Hoje" is the 0.6.1 stack, "Source embutida" the embedded subset, "Texto em contorno" the outlines). Each was reduced to under 200 KB.

- [`sheet-capas.png`](sheet-capas.png): the two covers, every option side by side, with the file sizes. Its embedded variant is a WOFF2 subset, drawn before the format was settled; the table above holds the TrueType subset that ships (for this cover, 4.0 KB as WOFF2 against 4.2 KB as TrueType, after gzip).
- [`sheet-diagramas.png`](sheet-diagramas.png): the two diagrams, cropped at 2x.
- [`sheet-zoom.png`](sheet-zoom.png): the same region of each image at 2x in three outputs (stack, embedded subset, outlines), where the letter shapes can be compared.

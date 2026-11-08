# ADR 0008: Type inside the image

- Status: accepted
- Date: 2026-11-06
- Supersedes: ADR 0003's type line ("Type is Lato (bold and black weights)")
- Amended: 2026-11-08, Source Serif 4 Bold for the headline piece (card 307; see the last section)

## Context

The identity studio chose the Source superfamily for the brand (decision I9, epic AB#263): Source Sans 3 for text and labels, Source Code Pro for code, Source Serif 4 for titles. The package's pieces write SVG files that the site shows through `<img>` (covers, body diagrams, icons). An SVG shown through `<img>` cannot load the page's web fonts or any external resource: it uses a font installed on the reader's machine, or a font embedded in the file. Until 0.6.1 every image named Lato and almost every reader saw Helvetica or Arial instead.

The card 300 spike measured four ways to bring Source into an image, on four published images, with sizes after gzip -9 and every option rendered by Chrome through `<img>` (evidence in [`docs/spikes/2026-11-06-identity-v2-0.7.0/`](../spikes/2026-11-06-identity-v2-0.7.0/)):

| Option | Reader sees | Cover (spec-driven development) | Diagram (callback) |
|---|---|---|---|
| Stack only (`'Source Sans 3', …`) | Helvetica/Arial (same as with Lato) | 1.8 KB | 2.9 KB |
| Per-image subset embedded | Source | 4.2 KB | 10.8 KB |
| Whole Latin file of each face embedded | Source | 33 KB | 46 KB |
| Text converted to outlines | Source, but no longer text | 6.6 KB | 113 KB |

## Options considered

1. **Stack only.** The token names Source first and the reader gets a fallback. No cost, and no Source for nearly every reader.
2. **Per-image subset embedded.** Each written image carries, as `@font-face` rules in one `<style>`, only the glyphs its own text uses.
3. **Whole Latin file embedded.** The same, without subsetting: 29-46 KB more per image, and a listing page shows about 20 covers.
4. **Text as outlines.** Exact shapes, but the text stops being text for search, copy and screen readers, and a diagram grows to 113 KB.

## Decision

Option 2: every SVG the package writes (the cover command in every format, and `npm run pieces:sheet`) embeds a per-image subset of the Source faces its text uses.

- **Faces shipped.** Only the faces a piece draws today, as the unmodified static TTFs of Adobe's releases: Source Sans 3 3.052R Regular, Bold and Black, and Source Code Pro 2.042R Regular and Bold, in `fonts/` with `OFL.txt`. Their SHA-256 sums are pinned in `test/fixtures/fonts-sha256.json`. No italic (an italic run takes the upright face; the browser slants it) and no Source Serif 4 until a piece draws serif text.
- **Subsetter.** `harfbuzzjs` (HarfBuzz's own subsetter compiled to WebAssembly, MIT, no dependencies), called through its raw wasm exports, keeping kerning and ligatures. It is the package's one runtime dependency, pinned exactly. The spike proved it deterministic: the same tree gives the same bytes on every run.
- **Format.** TrueType as HarfBuzz writes it (`data:font/ttf;base64`, `format('truetype')`). WOFF2 would need a Brotli encoder and the WOFF2 table transforms; the site serves SVG compressed, where the two differ by 1-3 KB per image.
- **Entry point.** `embedFonts(tree)` is exported only from `@brunosouzas/design-system/fonts` (`src/fonts/embed.ts`). The root entry stays pure (no file access, no WebAssembly) so the site's browser bundle can import the pieces.
- **Weights.** Each `@font-face` declares the weight range it stands for, so CSS font matching picks the embedded face for every weight the text names. Source Sans 3 has no static 800, so `cover.labelWeight` moves to 700.
- **Licence.** The files keep the Reserved Font Name "Source" because they are unmodified; a subset inside an image is an embedded document font (OFL-FAQ 1.12) and may keep the family name.
- **Animation.** Remotion loads the same families through `@remotion/google-fonts` (`src/brand/fonts.ts`), composed with the `font.sans` and `font.mono` tokens.

## Consequences

- Readers see Source in every cover, diagram and icon, at 2-8 KB more per image than today.
- The package gains its first runtime dependency and ships `fonts/`; a font or wasm failure stops the cover command before it writes, so no image ships without its faces.
- The embedded output is for written files and `<img>`. An SVG inlined in an HTML page skips `embedFonts` and uses the page's fonts: its `<style>` would become document-wide, and its `@font-face` subsets would override the page's full Source faces.
- `rsvg-convert` ignores embedded fonts: renders for review, and the kit's illustration check, use headless Chrome through `<img>`.
- A future piece that draws serif or italic text adds its face file in its own change, with its hash pinned.

## Amended, 2026-11-08: Source Serif 4 Bold for the headline piece (card 307)

The first piece that draws serif text, `headline`, ships with its face, as the Consequences above foresaw: Adobe's Source Serif 4 4.005R Bold (`fonts/SourceSerif4-Bold.ttf`, unmodified, its SHA-256 pinned). Only Bold ships, the one weight the piece draws and the weight brunosouzas.com sets its titles in. Its `@font-face` declares `100 900`, so every weight a text names in that family takes it; italic still takes the upright face. Its first use is brunosouzas.com's default share image, the slogan in three serif lines on an `og` image, in English and Portuguese from one spec with text tables. A wordmark, a subtitle or an italic comes with the change that first draws it, each face then added with its hash.

# A serif headline piece (card 307)

## Problem

The site's default share image (`og.image.png`) is still a pre-identity HTML screenshot. Card 307 rebuilds it in the `og` format, and the owner chose the concept that leads with type (concept C, AB#307 Q1): the slogan "Code that runs / for the problem / you have." in three large serif lines, the symbol, and the four category badges. Decision I9 sets titles in Source Serif 4, but no piece draws a title, and `fonts/` ships no serif face (ADR 0008: "no Source Serif 4 until a piece draws serif text"). The text can only be a preview today.

## What changes

- **New piece `headline`:** 1 to 4 lines of a title in `font.serif` at `font.weightBold`, `size` 24 to 160 (default 64), slightly tight letter-spacing (−size/100), line step 1.1 × size, `anchor` start/middle/end, `surface` light/dark for the text colour (`brand.<surface>.text`). It returns its group as `text` (like `edgeLabel`), so a cover-frame format writes it in the labels group and never strokes its letters.
- **Source Serif 4 Bold ships:** `fonts/SourceSerif4-Bold.ttf`, Adobe's unmodified 4.005R static TTF, its SHA-256 pinned. `embedFonts` recognises the family and embeds a subset as one face, declared `100 900`.
- **ADR 0008 amended:** the serif face ships with the first piece that draws it.
- README: the piece, the faces, "Upgrading to 0.9.0". Version **0.9.0**: a new piece and a new shipped file; nothing existing changes.

## Out of scope

- A wordmark, a subtitle, italic, a serif Regular or Semibold, or a sans option in `headline`: concept C draws only the bold serif title. **Owner, G1 Q7 ("ok"):** the owner's Q4 "ok" was to a generic piece for title, wordmark and subtitle with Serif Bold and Italic; the title with Bold only ships now; the rest comes with the change that first needs it (the LinkedIn card), each face then added with its hash.
- A dark background for cover-frame formats, or a `surface` on the signature (owner chose cream, Q2).
- Anything new for languages: the site builds its English and Portuguese og images from one spec with text tables, whose references already resolve to a `lines` array (cover-cli "Text references"); "Headline from text tables" proves it for this piece.
- The site's change (spec, PNG, meta tags): its own change in `brunosouzas.com`, after this release.
- Wrapping or measuring text: the spec author breaks the lines.

## Implicit requirements

- **Errors and invalid input:** `headline` checks its parameters like every piece (`RangeError` naming the parameter); the cover command reports them at their JSON path and writes nothing ("Headline out of range in a spec").
- **Limits:** 1 to 4 lines, `size` 24 to 160. A character Source Serif 4 lacks falls back to the next family of `font.serif` (existing "Character the faces lack" behaviour).
- **Repetition and idempotency:** the same spec gives the same bytes; `embedFonts` is already deterministic per face, proved again for the new face by the golden of "Title on the og image".
- **Concurrency:** n/a, a build-time library.
- **Security:** the font is a pinned, hashed file from Adobe's release (OFL 1.1, embedding allowed by OFL-FAQ 1.12); no new dependency.
- **Logs and observability:** n/a, the command already prints every problem with its path.

## Compatibility

Additive. Every 0.8.1 spec and call builds byte-identical (goldens unchanged). `PIECES` gains one name (63), so a consumer that checks the exact list must add it. The package grows by one TTF (about 265 KB unpacked); an image embeds only the glyphs it draws.

## Documentation

- `docs/adr/0008-type-inside-the-image.md`: amendment "Source Serif 4 Bold for the headline piece (card 307)", and the "Amended" line at the top.
- `README.md`: `headline` in the pieces, "Type in a written image" (faces shipped), "Upgrading to 0.9.0".
- `NOTICE` if it lists the font files.
- Brain vault (after merge): the project's changelog and roadmap, in the AB#307 note.

# Design: a serif headline piece

## A piece, not a format key

The owner approved a generic piece over a `title` key of the `og` format (AB#307 Q4): any cover-frame format can then carry a title (the LinkedIn card is the next likely one), and the spec keeps one shape (`pieces`). The piece follows `edgeLabel`'s shape: an empty `body` and its drawing in `text`, which `coverTree` places in the labels group, outside the ink-outlined group (`src/pieces/cover.ts`), so no stroke reaches the letters.

## Drawing

One `g` with `data-piece="headline"` carrying every shared attribute (`font-family` = `font.serif`, `font-size`, `font-weight` = `font.weightBold`, `letter-spacing`, `fill` = `brand.<surface>.text`, `text-anchor`), and one `text` per line with only `x` and `y`. The group's attributes override what the labels group sets (`font-size`, weight, `fill`, `text-anchor`). Values come from the approved preview (`approved/preview-gen.py`, `concept_c`; the art spec is `approved/og-concept-c.art.json` and the render `approved/og-concept-c.png`): 96 units, −0.01 em tracking, a line step of 106 units. The piece's step is 1.1 × size (105.6 at 96, baselines 190, 295.6 and 401.2 against the preview's 190, 296 and 402): a round rule beats a literal, and 0.8 units on the third line is invisible at 1200 wide; the release renders show it beside the preview. The tracking is written as a number in user units (−0.96 at 96), the same as −0.01 em; `size` is an integer so it always has two decimals at most.

## The face

Only Bold ships, the one weight the piece draws and the site's own title weight (`astro.config.mjs`: Source Serif 4 at 700). It is declared `100 900`, so any weight a text names in that family takes it, the same rule as Source Code Pro's top face. Source is Adobe's `source-serif` release 4.005R, file `TTF/SourceSerif4-Bold.ttf` of `source-serif-4.005_Desktop.zip`, unmodified (OFL-FAQ 1.12: an embedded subset keeps the name).

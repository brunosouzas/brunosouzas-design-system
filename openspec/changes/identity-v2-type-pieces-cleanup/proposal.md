# Identity v2, release 0.7.0: Source type, one piece grammar, cleanup (AB#300, AB#301, AB#263)

## Problem

The 0.6.x release carries the identity v2 colour, cast and formats, but three parts of the approved identity are still missing or half-done:

- **Type (AB#300).** The studio chose the Source superfamily (I9: Source Serif 4 for titles and the wordmark, Source Sans 3 for text and labels, Source Code Pro for code). `font.sans` is still the Lato stack, and it is written as `font-family` in every SVG (`cover.ts`, `diagram.ts`, `ink.ts`). The site shows covers and diagrams through `<img>`, which never loads a page's web fonts, and Lato is not installed on most readers' machines: readers see Helvetica or Arial today, and a Source stack alone would change nothing for them (spike AB#300: Chrome renders of four published images, `~/.hermes/cache/scratch/ab300-fonts/`). The Remotion scenes download Lato from Google Fonts.
- **Pieces (AB#301).** The pieces drawn before 0.6.0 (`robot`, `serverStack`, `gear`, `parcel`, `folder`, `sheet`, `codePanel`, the diagram stickers…) keep the v1 look: navy ink, hard offset shadow, decorative saturated fills. The owner asked that they go through the same grammar as the new cast (`skin.ts`, `brand.*`) instead of shipping as they are. On seeing the rendered bank objects with their screen off, he also asked for eyes: an object with a face-like screen and no eyes reads as dead, and a robot without eyes reads as an old tube TV.
- **Cleanup deferred to 0.7.0** (archived change `2026-11-05-identity-v2-guide-and-system`, task 3.4, ADR 0006): the 21 pre-0.6.0 `coverBackground` pairs, the duplicated `color.*` state colours, the seven-role cast (`MASCOTS`, `MASCOT_ACTIONS`, `MASCOT_FACES`, the `mascot` piece), and an `icon` spec that accepts `signature` and silently draws nothing.

## What changes

- **Type tokens.** `font.sans` becomes the Source Sans 3 stack, `font.mono` the Source Code Pro stack, and a new `font.serif` holds the Source Serif 4 stack (no piece draws serif text yet; the site and future brand pieces read it). `site.font.primary` and `site.font.secondary` move to Source Sans 3 and Source Serif 4. `cover.labelWeight` moves from 800 to 700: Source Sans 3 ships no static 800.
- **Type in the image.** Every SVG the cover command writes embeds the Source faces its text uses, as a subset holding only the characters it draws, so the reader sees Source inside an `<img>`. The package ships the unmodified Adobe TTF files it subsets (SIL OFL 1.1, with `OFL.txt`) and gains its first runtime dependency, `harfbuzzjs` (MIT, no dependencies of its own), the subsetter. The same embedding is exported for consumers that write their own SVG files from the pieces.
- **Remotion.** The scenes load Source Sans 3 and Source Code Pro from `@remotion/google-fonts` instead of Lato.
- **One piece grammar.** Every piece follows the v2 rules of the identity sheet: flat shapes and one rounded ink outline, no hard offset shadow, white bodies and neutrals, one accent, and colour only where it means something (a failure light, a done check, the line under review, the diagram state colours). This happens at two layers: the component tokens take v2 values (ink, panel, ring, illustration and surface colours; the shadow offsets become 0), and the pieces whose own defaults or drawing carry a v1 decorative colour are redrawn one by one (list in `design.md`).
- **Eyes.** The six bank objects and the `robot` show the cast's idle eyes on their screen (amber `cast.eyes` on the visor), with no other expression; `modulo` loses the two inner strokes between its legs. This amends I10 ("screen off") and ADR 0007; an object that needs expressions or a story role in two or more pieces still becomes a character with its own sheet (E8).
- **Emotes stay.** The eight emotes (`EMOTE_KINDS`) are kept and redrawn in the v2 grammar; the original plan to retire them is withdrawn by the owner (2026-11-06: a piece that exists and is useful is kept, restyled).
- **Cleanup (breaking).** Remove the 21 pre-0.6.0 `coverBackground` pairs (keep `trackIntegration`, `trackDelivery`, `trackAi`, `neutral`); remove the top-level `color.healthy` … `color.failFast` duplicates and migrate `src/pieces`, `src/brand` and `src/scenes` to `color.state.*`; remove `MASCOTS`, `MASCOT_ACTIONS`, `MASCOT_FACES`, the `mascot` piece, the seven-role `cast.*` colour tokens and the `cast-motion-test` composition; an `icon` spec refuses `signature`.
- **Decisions recorded.** ADR 0008 (type delivered inside the image), ADR 0009 (one piece grammar, no hard shadow), and an amendment to ADR 0007 (eyes on bank objects, emotes kept). `AGENTS.md` updates its style rule and its "no runtime dependency" rule.
- **Release** `0.7.0` (breaking; the package is 0.x).

## Out of scope

- Rebuilding the published images in `brunosouzas-content` (21 covers, 28 diagrams, 26 icons) and cleaning the decorative colours their specs pass explicitly: a follow-up pull request there, after the release, with before/after renders the owner approves.
- The kit: the `illustration` pin to 0.7.0, its verification step in Chrome instead of `rsvg-convert`, COV-10 (bank objects with idle eyes), the motion CAST rules on emotes. A kit pull request with its own independent review.
- Adopting 0.7.0 in brunosouzas.com (AB#302: site fonts and colours, the home banner and the 404 redesigned as visual pieces, the About avatar, the category icons) and in stackledger (AB#303). Until then both stay on 0.6.x; the site's banner and 404 SVGs stay as published.
- New category icons for the three tracks (AB#302) and any new piece.
- The `site.*` colour tokens and the stackledger map backdrop colours (`surface.*.backdrop*`): their consumers decide them in AB#302 and AB#303.
- Text set as outlines (paths): measured in the spike at up to 113 KB gzip per diagram, rejected (`design.md`).

## Implicit requirements

- **Errors and invalid input:** an `icon` spec with `signature` is refused with its JSON path; a spec whose text needs a character the embedded font lacks still writes the image, and the browser falls back to the next family of the stack for that character only. A missing font file in the installed package is a build error of the package, caught by the package test.
- **Limits:** embedding adds the subset of each face used (measured 2 to 10 KB gzip per image); faces with no text are not embedded; a text-free SVG gets no `<style>`.
- **Repetition and idempotency:** the same spec gives byte-identical output on every run (the subset is deterministic; tested).
- **Concurrency:** n/a: the command builds one image per process; the exported embedding has no shared state across calls besides the loaded wasm module.
- **Security:** the font data is the package's own files, never fetched; `harfbuzzjs` runs as WebAssembly with no file or network access of its own. The new dependency is pinned exactly.
- **Logs and observability:** unchanged: the command prints `wrote <file>` or the spec's problems.

## Documentation

`README.md` (type, embedding, the removed exports, the new catalogue sheet), `AGENTS.md` (style and dependency rules, Lato mentions), `docs/adr/0008-*.md`, `docs/adr/0009-*.md`, the 0007 amendment and `docs/adr/README.md`, `docs/roadmap.md` (AB#189's candidate table under "Out of scope for now"), `NOTICE`/`OFL.txt` for the fonts. Vault notes after the merge: the project's `architecture.md`, `roadmap.md`, `changelog.md`, the I10 amendment in the identity evidence note, and the catalogue page of what the package has.

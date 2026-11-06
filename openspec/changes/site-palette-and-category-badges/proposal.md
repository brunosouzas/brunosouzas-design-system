# Site palette on the brand roles, category badges (AB#302)

## Problem

brunosouzas.com adopts identity v2 (AB#302). Release 0.7.0 already moved `site.font` to Source Sans 3 and Source Serif 4, but two things the site needs from the design system are still missing:

- **Site colours.** `site.light.*` and `site.dark.*` still hold the Astroplate theme's palette (`#FFFFFF` body, `#444444` text, `#1C1C1C` dark body…), measured from the site before the identity redesign. The brand roles of ADR 0006 (`brand.<theme>.*`) were never mapped onto them, so the site cannot follow the design system's colours. The group also has no role for a link: the site draws links in the text colour, and the brand gives links their own role (`accentText`). The site uses Source Code Pro for code (I9), but `site.font` names only the text and title faces.
- **Category icons.** The site shows one icon per category (integration, delivery, AI engineering, personal tools) on the home page, the categories page and the article sidebar. Today a local Python script draws them in the v1 look. On 2026-11-06 the owner chose, from renders, a badge: a disc in the default tone of the category's track family, with the ring that tone has on a cover, and a glyph from the brand notation on it. The package cannot build it. `categoryIcon` draws only `personalTools`, with no disc, and an `icon` spec accepts only `eipIcon`, `uiIcon` and `linkIcon`.

## What changes

- **`site.<theme>.*` values** become the brand roles they stand for. The role names stay, because the site's Tailwind theme and stackledger's CSS read them (`--ds-site-*`). The mapping and the values are in `design.md`. Each `site` colour equals a `brand` role of the same theme, and a test checks it.
- **`site.<theme>.link`**, a new colour token: `brand.light.accentText` (`#B83A0C`) and `brand.dark.accentText` (`#FF7A45`).
- **`site.font.mono`**, a new token: `'Source Code Pro', monospace`, the site's code face (I9).
- **`categoryIcon`** draws a category badge for each of the four site categories (`integration`, `delivery`, `aiEngineering`, `personalTools`). The badge is a disc filled with the default tone of the category's track (`coverBackground.track<Name>`), outlined in that tone's ring colour, with a glyph on it. The three first categories take a brand notation glyph (`pointToPointChannel`, `gateToProduction`, `contextWindow`), and `personalTools` keeps its own glyph. The disc is light on both themes, so the glyph is ink on both and the piece drops its `surface` parameter (breaking).
- **The `icon` format** accepts `categoryIcon` too, written in a box 48 × `scale` wide and high.
- **ADR 0006** gets an amendment: `site.*` is the site's component layer over the brand roles.
- **README:** "Upgrading to 0.8.0", the site tokens and the icon format.

## Out of scope

- The release itself (version bump to `0.8.0`): its own pull request, merged by the owner.
- The site's own change: the theme reading `tokens.css`, the font loading, the rebuilt art, the banner and the 404 (brunosouzas.com, AB#302).
- stackledger's adoption (AB#303). It reads `--ds-site-*`, so its pages take the new values when it moves to 0.8.0, and that card shows the renders.
- A serif title in an image and the site's og image (a new card; no piece draws serif text).
- Any other change to `brand.*`, `coverBackground` or the notation glyphs.
- The kit's `illustration` pin and its icon rule (they stay on 0.7.0 until a kit change moves them).

## Implicit requirements

- **Errors and invalid input:** an unknown `category`, and a `surface` passed to `categoryIcon` (no longer a parameter), throw a `RangeError` naming the parameter. In the CLI, an `icon` spec with any piece outside `eipIcon`, `uiIcon`, `linkIcon` and `categoryIcon` is refused with the updated message. A missing or extra `site` token fails the token build, as today.
- **Limits:** `categoryIcon.scale` keeps its 0.25 to 8 range.
- **Repetition and idempotency:** same input, same bytes (no text in the badge, so nothing is embedded).
- **Concurrency:** n/a: pure functions and a one-shot command.
- **Security:** n/a: no input crosses a trust boundary beyond the spec checks that already exist.
- **Logs and observability:** n/a: the command's output lines are unchanged.

## Documentation

`README.md` (site tokens, icon format, Upgrading to 0.8.0), ADR 0006 (amendment), `docs/roadmap.md` (the row for this change). Vault notes (the project's changelog and roadmap) are updated after the merge.

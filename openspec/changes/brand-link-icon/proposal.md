# Proposal: brand-link-icon (AB#326)

## Why

The owner decided on 2026-11-11 that brunosouzas.com has its own link icon, the brand symbol, used wherever a link points to the site. Its first consumer is stackledger's home links, which will show icons only, side by side, with no descriptions. A generic icon needs an explanation; an own icon does not. Today the only icon for a site is `website`, a generic globe, so a link to brunosouzas.com cannot be told from any other site without words.

## What changes

- **`linkIcon` `brunosouzas`:** a sixth link icon, the brand symbol (the "b" with the moon that the favicon and the avatar draw, `symbol`) on the link family's white face, with the same box, face, outline and surfaces as the other five. The glyph is the symbol's own three shapes, scaled and centred on the face; its colours are the light symbol's (`brand.light.text`, `brand.light.accent`) on both surfaces, because the face is white on both. Title `brunosouzas.com`, description `brunosouzas.com icon: the brand symbol, a b with a moon.`
- **One drawing:** the symbol's shapes are written once, in `src/pieces/symbol.ts`, and the link icon takes them from there, so the icon cannot drift from the favicon and the avatar. The symbol's own output does not change (the favicon and avatar goldens stay byte-identical).
- `LINK_ICONS` keeps `website` (the generic globe) and appends `brunosouzas`: `LINK_ICON_NAMES` is `github`, `linkedin`, `email`, `website`, `stackledger`, `brunosouzas`.
- **Release:** one minor from a `feat:` pull request title; release-please sets the version.

## Capabilities

### Modified Capabilities

- `illustration-pieces`: `LINK_ICONS` gains `brunosouzas`; the icon walk covers 26 trees.

No token is added: the colours are existing brand roles. `cover-cli` does not change: an icon spec already takes any `linkIcon` name.

## Out of scope

- stackledger's adoption of the icon (its own change after the release).
- Removing or renaming `website`, or any change to the other five link icons and to `symbol`.
- A dark-coloured glyph on the dark surface: the glyph sits on the white face, as every other glyph does.
- A colour or size parameter on `linkIcon`.

## Implicit requirements

- **Errors and invalid input:** requirement. An unknown icon name is still rejected by the schema; the message lists the six names ("Unknown icon").
- **Limits:** requirement. Every glyph shape lies inside the face, 2 to 40 on both axes ("Glyph inside the face, brunosouzas").
- **Repetition and idempotency:** n/a: a pure function of its parameters, as every piece.
- **Concurrency:** n/a: no state.
- **Security:** requirement. The icon holds no link, style, script or URL, like the others ("Every icon as a standalone file", 26 trees).
- **Logs and observability:** n/a: a piece prints nothing.

## Documentation

- `README.md`: "UI and link icons" (`brunosouzas`, when to use it rather than `website`).
- `docs/roadmap.md`: a row `brand-link-icon`, AB#326.
- Evidence for the owner's gate in `docs/spikes/2026-11-11-brand-link-icon/` (small PNGs and the commands).
- Vault, after the merge: `10-personal/projects/brunosouzas-design-system/` changelog and roadmap.
- No ADR: the icon follows ADR 0009 and reuses the approved symbol.

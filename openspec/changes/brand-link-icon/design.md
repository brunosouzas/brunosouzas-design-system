# Design: brand-link-icon

## 1. The glyph

Same box (46), face (2, 2) 38 x 38, radius 9, white, outline 2.5 (ink on light, `surface.dark.muted` on dark), drawn by `linkIcon` unchanged. The glyph is one group, `translate(5.56 6.52) scale(0.875)`, holding the symbol's three shapes exactly as `symbol` draws them in its 32-unit box:

| Shape | In the 32 box | Colour |
|---|---|---|
| haste | rect (5, 3) 5.5 x 26, radius 2.75 | `brand.light.text` (`#121212`) |
| ring | circle (17.5, 20.5) r 7.3, no fill, width 4.6 | `brand.light.text` |
| moon | circle (27.5, 9) r 2.8 | `brand.light.accent` (`#E04E17`) |

**Size and place (the one choice).** The favicon and the avatar let the symbol fill its box (content x 5 to 30.3, y 3 to 30.1, the ring's stroke included). Mapped the way `stackledger` maps its mark (the 32 box onto the 38 face, x 1.1875 + 2) the moon would sit about 0.4 units from the face's rounded corner. So the glyph is sized like the other glyphs instead: at 0.875 it is about 22 x 24 units (GitHub's mark is 22.6 x 22.5, the globe 23.5), and the translate puts the centre of its content box on the face's centre (21, 21): it spans about x 9.9 to 32.1 and y 9.1 to 32.9. The ring's stroke becomes 4.0 units, heavier than the family's 2.5, as the symbol is drawn; the stackledger line is 5.3.

**Colours.** The face is white on both surfaces, so the glyph keeps the light symbol's colours on both (as every glyph keeps ink); on dark only the face's outline changes. `brand.light.accent` equals `illustration.accent`; the palette check passes unchanged.

**One drawing.** `src/pieces/symbol.ts` exports `symbolShapes(text, moon)`, the three nodes; `symbol` draws them in its own group and `LINK_ICONS` puts them in the glyph group. `symbol`'s output is unchanged (favicon and avatar goldens).

Title `brunosouzas.com`, description `brunosouzas.com icon: the brand symbol, a b with a moon.`, `face: "color.white"`. Appended after `stackledger`.

## 2. Evidence

`npm run png` renders, in `docs/spikes/2026-11-11-brand-link-icon/` with a `README.md` of the commands: `brunosouzas-icon-light.png` and `brunosouzas-icon-dark.png` (the icon spec at size 184, on `surface.light.background` and with `surface: "dark"` on `surface.dark.background`), and `link-icons-light.png`, `link-icons-dark.png` (the six link icons side by side). The legibility at 24 px is checked on a render kept out of the repository.

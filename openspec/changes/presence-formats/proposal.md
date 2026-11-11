# Proposal: presence-formats (AB#325)

## Why

The brand's English showcase is LinkedIn, GitHub and stackledger's site (brand strategy, "the English is the showcase"), and the package cannot yet draw three of the images those places need:

1. **LinkedIn profile background.** LinkedIn takes a 1584x396 (4:1) background for a personal profile, as PNG or JPG. No format has that size, and none knows that the profile photo covers the lower left of the image: on desktop the round photo overlaps the bottom-left corner, on a phone it sits further right and the sides are cropped. A piece placed there is hidden for every visitor. A phone shows the image at about a quarter of its size, so a 19-unit label shows at about 5 px.
2. **stackledger link icon.** stackledger's home links (`spec.site.home.links[].icon`) take the design system's link icon names (`github`, `linkedin`, `email`, `website`). There is no icon for stackledger itself, although its mark (`ledgerMark`, the "Folha" of card 303) is already a piece.
3. **GitHub App icon.** The release App (`brunosouzas-design-system-release`) needs a 500x500 PNG that is not Bruno's own avatar. The `avatar` format draws the symbol on one fixed ground (`brand.light.accentText`) and writes SVG only, so the App's icon would be Bruno's avatar.

## What changes

- **`"format": "linkedin-banner"`** in the cover command: 1584x396, square corners, the cover frame conventions (`background`, `rings`, `pieces`, `custom`, `customAt`, `text`), rings out to the farthest corner like a banner. `signature` and `height` are refused.
- **Profile photo zones**, documented and checked: two circles in banner units, the photo on desktop and on a phone. A piece (or `custom`) whose drawn box reaches either circle is a spec problem; the command writes nothing.
- **Words that read on a phone:** every word drawn in a LinkedIn banner is 44 units or more (about 11 px at a quarter of the size). Smaller words are a spec problem; `headline` is the way to put words on it.
- **`--png <file.png>`** on the command, for the `linkedin-banner` and `avatar` formats: the image is rendered through an `<img>` in a locally installed Google Chrome or Chromium at the format's own size (1584x396, 500x500), checked, and written next to the SVG. Both files or neither. No new npm dependency.
- **Avatar ground:** an `avatar` spec takes an optional `background` (a `coverBackground` name). Without it the output is byte-identical to 0.9.1's.
- **`linkIcon` `stackledger`:** a fifth link icon, the mark's bent line and two stations on the white link face, same size and outline rules as the other four, light and dark, with an English title and description.
- **Fixture:** `test/fixtures/covers/linkedin-banner.json` (no words) and its golden.
- **Release:** one minor, 0.10.0, from a `feat:` pull request title; release-please sets the version.

## Capabilities

### Modified Capabilities

- `cover-cli`: the `linkedin-banner` format, its keys, frame, photo zones and word size; `--png`; the avatar's ground; the new fixture.
- `illustration-pieces`: `LINK_ICONS` gains `stackledger`.

`design-tokens`, `motion-components`, `scene-catalogue` and `scene-rendering` do not change. No token is added: the frame size and the zones are platform measures, kept as constants beside `AVATAR_SIZE` and `OG_WIDTH`.

## Out of scope

- The owner's actual LinkedIn banner and the App icon's spec: consumer specs, composed with the `illustration` skill outside this repository, then uploaded by the owner. The package only gives the format, the checks and the PNG.
- stackledger's adoption of the icon (its own change after 0.10.0).
- A LinkedIn company page cover (1128x191), an X or YouTube header, JPG output, a 2x PNG, and PNG for any other format (see Open questions).
- A check of the phone's side crop: documented, not checked (design §3).
- A warning channel in the command: every problem stays an error that writes nothing.
- A dark-surface LinkedIn banner: `coverBackground` has no dark pair; LinkedIn's dark mode only changes the page around the image.
- Any change to `ledgerMark` or the other four link icons.

## Open questions (gate 1)

1. **Zone values.** The circles come from a model of LinkedIn's layout (design §2) that a live measurement must confirm before code (task 1.1). Recommended: accept the model now; the measurement may only move the numbers, not the rule.
2. **`--png` for `linkedin-card` and `og` too.** Both are platform images that platforms take as raster. Recommended: yes, in this release, at no extra cost; this proposal keeps to the two formats asked.
3. **The App icon's ground.** Recommended: `neutral` (the brand's cream page, `#F6F3EC`), clearly not Bruno's orange avatar.
4. **The signature on the banner.** Recommended: refused (design §4); Mira can still be a piece.
5. **The stackledger icon's line colour.** Recommended: the mark's default, `illustration.accent`, as `ledgerMark` draws it; stackledger's own accent would need a colour parameter on `linkIcon` that nobody asked for.

## Implicit requirements

- **Errors and invalid input:** requirement. Every new key and option has its problem: unknown or refused keys by JSON path, a piece in a photo zone, words under 44 units, `--png` without a value, repeated, not `.png`, in a missing folder, for another format, no browser found, a browser that fails, times out or writes the wrong size. Nothing is written on any problem.
- **Limits:** requirement. Frame 1584x396; zones as in "Profile photo zones"; words of 44 units or more; rings centre within ±10000 as for every spec; the browser has 60 s.
- **Repetition and idempotency:** requirement. The same spec gives the same SVG bytes (existing "Running twice"). A PNG is checked for its size, not its bytes: Chrome versions may differ in anti-aliasing. An avatar spec without `background` gives 0.9.1's bytes.
- **Concurrency:** n/a. One-shot command; temporary files have unpredictable names, as today.
- **Security:** requirement. The browser is started without a shell, with an argument list, a fresh profile in a temporary folder, and every host name resolving nowhere (the SVG embeds its fonts and needs no network); the page is a local file that shows one `<img>`. The new icon holds no link, style or script, like the others.
- **Logs and observability:** requirement. `wrote <file.svg>` then `wrote <file.png>`; on a browser failure, `cannot render <file.png>: <reason>` with the first line of the browser's error output.

## Documentation

- `README.md`: a "LinkedIn banner" section (size, frame, the zones with a figure, the word size, `--png`); "Social and platform formats" (the new format, the avatar's ground, `--png`); "Signature lockup" (refused by the new format); "UI and link icons" (`stackledger`); "Commands" (`--png`); "Upgrading to 0.10.0".
- `docs/roadmap.md`: a row `presence-formats`, AB#325.
- `test/fixtures/covers/README.md`: the new fixture.
- Evidence for the owner's gate in `docs/spikes/<date>-presence-formats/` (small PNGs).
- Vault, after the merge: `10-personal/projects/brunosouzas-design-system/` changelog and roadmap.
- No ADR. The PNG path adds no npm dependency (AGENTS.md) and uses the renderer ADR 0008 already names for written images (headless Chrome through `<img>`); the zones and the word size are rules of one format; the icon follows ADR 0009.

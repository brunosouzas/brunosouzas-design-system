# Proposal: presence-formats (AB#325)

## Why

The brand's English showcase is LinkedIn, GitHub and stackledger's site (brand strategy, "the English is the showcase"), and the package cannot yet draw three of the images those places need:

1. **LinkedIn profile background.** LinkedIn takes a 1584x396 (4:1) background for a personal profile, as PNG or JPG. No format has that size, and nothing tells the person composing it where the round profile photo covers the image: on desktop it overlaps the lower left; in the iOS app it sits a little further right and lower. A piece placed there is hidden. A 440-pt-wide phone shows the image at about 0.28 of its size, so a 19-unit label shows at about 5 pt.
2. **stackledger link icon.** stackledger's home links (`spec.site.home.links[].icon`) take the design system's link icon names (`github`, `linkedin`, `email`, `website`). There is no icon for stackledger itself, although its mark (`ledgerMark`, the "Folha" of card 303) is already a piece.
3. **GitHub App icon.** The release App (`brunosouzas-design-system-release`) needs a 500x500 PNG that is not Bruno's own avatar. The `avatar` format draws the symbol on one fixed ground (`brand.light.accentText`), so the App's icon would be Bruno's avatar.

## What changes

The owner chose the simple version (gate 1, q36 A): the package gives the format, the measured photo zones as documented constants and a way to see them on a render; the person composing the banner keeps pieces out of the zones, and the owner checks it at his gate. No automatic zone check, no box measurement of pieces, no minimum word size check, no PNG option on the published command.

- **`"format": "linkedin-banner"`** in the cover command: 1584x396, square corners, the cover frame conventions (`background`, `rings`, `pieces`, `custom`, `customAt`), rings out to the farthest corner like a banner. `text` is accepted with an English table only (STY-8: the words in the image are English). `signature` and `height` are refused.
- **Profile photo zones, measured and documented:** two circles in banner units, measured on the owner's screenshots of 2026-11-11 (white ring included, about ±2 units): desktop web, centre (207, 362), radius 160; iOS app, centre (244, 409), radius 187. Each has a safe area 16 units wider. The package exports them (`LINKEDIN_PHOTO_ZONES`, `LINKEDIN_PHOTO_MARGIN`); the command does not check pieces against them.
- **Written guidance for words:** few and large, as the site banner rule; the README gives the phone scale (about 0.28) and what common sizes become.
- **`bannerRingCount`** takes optional frame `width` and `height` after `radius`; without them its results are unchanged. Nothing is removed from the public API.
- **Avatar ground:** an `avatar` spec takes an optional `background` (a `coverBackground` name). Without it the output is byte-identical to 0.9.1's, proved against a golden captured from 0.9.1 before any change.
- **`linkIcon` `stackledger`:** a fifth link icon, the mark's bent line (`illustration.accent`) and two stations on the white link face, same size and outline rules as the other four, light and dark, with an English title and description.
- **PNG by a development script:** `npm run png` (`scripts/png.ts`, in the repository, not in the package) renders a written SVG to PNG at its own size through a local headless Chrome via one `<img>` (the path ADR 0008 and the kit's illustration check already use); `--zones` draws the photo zones over a LinkedIn banner for the owner's gate. Used for the LinkedIn banner and the App icon. No new dependency.
- **Fixture:** `test/fixtures/covers/linkedin-banner.json` (no words) and its golden.
- **Release:** one minor, 0.10.0, from a `feat:` pull request title; release-please sets the version.

## Capabilities

### Modified Capabilities

- `cover-cli`: the `linkedin-banner` format, its keys, frame and rings; the exported photo zones; the avatar's ground; the development PNG script; the new fixture.
- `illustration-pieces`: `LINK_ICONS` gains `stackledger`.

`design-tokens`, `motion-components`, `scene-catalogue` and `scene-rendering` do not change. No token is added: the frame size and the zones are platform measures, kept as constants beside `AVATAR_SIZE` and `OG_WIDTH`.

## Out of scope

- An automatic check that pieces stay out of the photo zones, a drawn-box measurement of pieces, a minimum word size check (owner's choice, q36 A).
- `--png` on the published command, and PNG for consumers: a consumer renders the SVG with its own tools.
- Android and narrow desktop layouts: not measured (design §2).
- The owner's actual LinkedIn banner and the App icon's spec: consumer specs, composed with the `illustration` skill outside this repository, then uploaded by the owner.
- stackledger's adoption of the icon (its own change after 0.10.0).
- A LinkedIn company page cover (1128x191), an X or YouTube header, JPG output, a 2x PNG.
- A dark-surface LinkedIn banner: `coverBackground` has no dark pair; LinkedIn's dark mode only changes the page around the image.
- Any change to `ledgerMark` or the other four link icons.

## Open questions (gate 1)

1. **The screenshots.** The measurements come from the owner's screenshots of his own profile. Recommended: keep them out of the public repository (they show his profile page) and record only the numbers, in design §2 and the README.
2. **Android and narrow desktop.** Not measured. Recommended: ship with the two measured zones; measure again only if a banner shows a covered piece on another surface.
3. **The App icon's ground.** Recommended: `neutral` (the brand's cream page, `#F6F3EC`), clearly not Bruno's orange avatar.
4. **The signature on the banner.** Recommended: refused (design §4); Mira can still be a piece.

## Implicit requirements

- **Errors and invalid input:** requirement. Unknown or refused keys by JSON path (`signature`, `height`, a non-English text table); the PNG script's own argument and browser problems, each exiting 1 without writing. A piece inside a photo zone is not an error: the zones are documented and the owner checks the render.
- **Limits:** requirement. Frame 1584x396; zones as measured (±2 units), with a 16-unit margin; rings centre within ±10000 as for every spec; the PNG script stops the browser after 60 s.
- **Repetition and idempotency:** requirement. The same spec gives the same SVG bytes (existing "Running twice"). A PNG is not byte-reproducible across Chrome versions; its reproducible source is the SVG, and the script checks only its size. An avatar spec without `background` gives 0.9.1's bytes.
- **Concurrency:** n/a. One-shot command and script; temporary files have unpredictable names.
- **Security:** requirement. The PNG script starts the browser without a shell, with an argument list, a fresh profile in a temporary folder, and every host name resolving nowhere (the SVG embeds its fonts and needs no network); it ships in no package. The new icon holds no link, style or script, like the others.
- **Logs and observability:** requirement. The command prints `wrote <file.svg>` as today; the script prints `wrote <file.png>`, or `cannot render <file.png>: <reason>`.

## Documentation

- `README.md`: a "LinkedIn banner" section (size, frame, the measured zones and their margin with the overlay figure, how they were measured and what was not, words few, large and English, making the PNG); "Social and platform formats" (the new format, the avatar's ground); "Signature lockup" (refused by the new format); "UI and link icons" (`stackledger`); "Commands" (`npm run png`, a repository script); "Upgrading to 0.10.0".
- `docs/roadmap.md`: a row `presence-formats`, AB#325.
- `test/fixtures/covers/README.md`: the new fixture, and the 0.9.1 avatar golden with its SHA-256.
- Evidence for the owner's gate in `docs/spikes/<date>-presence-formats/` (small PNGs).
- Vault, after the merge: `10-personal/projects/brunosouzas-design-system/` changelog and roadmap.
- No ADR. No npm dependency is added (AGENTS.md); the PNG path is the renderer ADR 0008 already names for written images (headless Chrome through `<img>`); the zones are measures of one format; the icon follows ADR 0009.

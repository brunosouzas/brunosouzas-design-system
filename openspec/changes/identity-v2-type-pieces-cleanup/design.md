# Design: identity v2, release 0.7.0

## Decision 1: how Source reaches an image shown through `<img>` (ADR 0008)

An SVG shown through `<img>` cannot load the page's web fonts or any external resource; it can only use fonts installed on the reader's machine or fonts embedded in the file. Spike AB#300 (four published images, Chrome renders through `<img>`, sizes gzip -9):

| Option | Reader sees | Capa sdd | Diagram callback |
|---|---|---|---|
| Stack only (`'Source Sans 3', …`) | Helvetica/Arial (same as today with Lato) | 1.8 KB | 2.9 KB |
| **Per-image subset embedded** | Source | 4.2 KB | 10.8 KB |
| Whole Latin file of each face embedded | Source | 33 KB | 46 KB |
| Text converted to outlines | Source, text no longer text | 6.6 KB | 113 KB |

**Decision: embed a per-image subset.** Only it gives the reader Source at a cost close to today's file. Outlines are rejected (size, and the text stops being text for search and copy); the whole Latin file is rejected (29-46 KB more per image, 20 covers on a listing page).

- **Subsetter:** `harfbuzzjs` (MIT, no dependencies; HarfBuzz's own subsetter compiled to WebAssembly), called through its raw wasm exports. It becomes the package's only runtime dependency, pinned exactly. Alternatives: `subset-font` (adds `fontverter` and `p-limit`), a hand-written TrueType subsetter (loses kerning and ligatures, and is code to maintain). The spike proved determinism: the same input gives the same bytes on every run.
- **Font files:** the unmodified static TTFs of Adobe's releases (Source Sans 3 3.052R, Source Code Pro 2.042R, Source Serif 4 4.005R; the faces are listed under "Resolutions" below), shipped in `fonts/` with `OFL.txt`. Unmodified files keep the Reserved Font Name "Source"; the subset inside an image is an embedded document font (OFL-FAQ 1.12), so it may keep the family name.
- **Format:** the subset is embedded as TrueType (`data:font/ttf;base64`, `format('truetype')`), as HarfBuzz writes it. WOFF2 would need a Brotli encoder with the WOFF2 table transforms (another dependency); the site serves SVG compressed, where TTF and WOFF2 differ by 1-3 KB per image.
- **Placement:** one `<style>` element right after `<desc>` (or as the first child when the tree has no `<desc>`), with one `@font-face` per face the drawn text uses, ordered by family name (code point), then weight ascending, then style (`normal` before `italic`). Drawn text is the string children of `text` and `tspan` nodes, outside any `title`, `desc` or `style` subtree. A face is the first comma-separated entry of the text's resolved `font-family` (trimmed, quotes stripped, compared case-sensitively with the three Source names), its resolved `font-weight` snapped to a shipped weight, and its `font-style`. Text-free trees get no `<style>`.
- **Weight snapping and ranges:** Source Sans 3 100-549 → 400, 550-799 → 700, 800-900 → 900; Source Code Pro and Source Serif 4 100-549 → 400, 550-900 → 700. Each `@font-face` declares the range it stands for (`font-weight:100 549`, `550 799`, `800 900`; `100 549`, `550 900`), so the browser's CSS font matching picks the embedded face for every weight the text names, not only the exact one.
- **API:** `embedFonts(tree: SvgNode): Promise<SvgNode>`, exported only from the new subpath `@brunosouzas/design-system/fonts` (`package.json` `exports["./fonts"]`, module `src/fonts/embed.ts`), not from the package root. The root entry (`src/pieces/index.ts`) stays pure: no file access, no WebAssembly, importable in a browser bundle, so "Pure pieces" needs no exception. The wasm module and the font files load lazily on the first call, never at import. It is async because WebAssembly instantiation is. The cover command and `npm run pieces:sheet` call it before writing. Alternative rejected: exporting it from the root, which would pull `node:fs` and the wasm into every consumer of the pieces, the site's browser bundle included.
- **Failure:** an unreadable font file or a wasm module that fails to load makes `embedFonts` reject with an `Error` naming the cause (the file path, or `harfbuzzjs`); the cover command and the sheet print that message, exit 1 and write nothing, so no image ships without its faces.
- **Weights:** Source Sans 3 has no static 800, so `cover.labelWeight` moves from 800 to 700 (Bold); `font.weightHeavy` stays 900 (Black).
- **Verification:** `rsvg-convert` ignores embedded fonts, so the owner-facing renders of this change, and later the kit's `illustration` check, use headless Chrome through `<img>`.

## Decision 2: type tokens

| Token | 0.6.1 | 0.7.0 |
|---|---|---|
| `font.sans` | `Lato, 'Helvetica Neue', Helvetica, Arial, sans-serif` | `'Source Sans 3', 'Helvetica Neue', Helvetica, Arial, sans-serif` |
| `font.mono` | `ui-monospace, 'SF Mono', Menlo, Consolas, monospace` | `'Source Code Pro', ui-monospace, 'SF Mono', Menlo, Consolas, monospace` |
| `font.serif` (new, required) | — | `'Source Serif 4', Georgia, 'Times New Roman', serif` |
| `site.font.primary` | `Heebo, sans-serif` | `'Source Sans 3', sans-serif` |
| `site.font.secondary` | `Signika, sans-serif` | `'Source Serif 4', serif` |
| `cover.labelWeight` | 800 | 700 |

Remotion (`src/brand/fonts.ts`) loads `SourceSans3` (400, 700, 900) and `SourceCodePro` (400, 700) through `@remotion/google-fonts` (already a dependency), and composes them with the tokens as it did with Lato.

## Decision 3: one piece grammar (ADR 0009)

The v2 rules (identity sheet, `skin.ts`): flat shapes, one rounded ink outline, **no hard offset shadow**, white bodies and neutrals for most of a piece, one accent, colour only when it means something. Applied at two layers.

**Token layer** (values only; paths unchanged, so consumers' CSS keeps working):

| Token | 0.6.1 | 0.7.0 | v2 source |
|---|---|---|---|
| `color.ink` | `#0A1033` | `#121212` | `brand.light.text` |
| `color.panel` | `#EEF2FF` | `#F6F3EC` | `brand.light.bg` |
| `color.ring` | `#E0E7FB` | `#EDE8DE` | new primitive between `bg` and `border` (the `border` value was too heavy for 14 rings) |
| `illustration.accent` | `#1E6FEB` | `#E04E17` | `brand.light.accent` |
| `illustration.codePanel` | `#14215A` | `#1D1C1A` | `brand.dark.cardBg` |
| `illustration.textBar`, `iconLine` | `#C9D6F5`, `#B9C3E0` | `#D7D1C5` | `brand.light.border` |
| `illustration.road` | `#5B6478` | `#5C5852` | `brand.light.textMuted` |
| `illustration.tape` | `#FFE2C8` | `#F4E4D8` | `brand.light.trackIntegration` |
| `shadow.block`, `shadow.pill`, `shadow.small`, `map.shadow` | 10, 6, 4, 3.5 | 0 | no hard shadow |
| `surface.light` background, text, muted, grid, shadow, rim | `#EEF2FF`, `#0A1033`, `#5B6694`, `#E0E7FB`, `#0A1033`, `#EEF2FF` | `#F6F3EC`, `#121212`, `#5C5852`, `#EDE8DE`, `#121212`, `#F6F3EC` | `brand.light.*` |
| `surface.dark` background, text, muted, grid, panel, shadow, rimWidth | `#14215A`, `#EEF2FF`, `#8F9BD0`, `#1C2D74`, `#1C2D74`, `#4C5CB8`, 1 | `#121110`, `#F1EEE8`, `#ADA79D`, `#3B3834`, `#1D1C1A`, `#121110`, 0 | `brand.dark.*` |

`illustration.healthyShade` and `illustration.transitionalShade` are removed: after the redraws no piece reads them. `surface.*.backdrop*`, `surface.*.zoneOpacity` and `surface.*.panel` (light) keep their values (stackledger's map, AB#303).

**Code layer:**

- `shadowed()` and the sticker (`ink.ts`) draw no shadow copy when the offset is 0, so outputs carry no hidden node.
- On the dark surface a sticker's outline is `surface.dark.muted` instead of `color.ink` (the cast's rule: ink vanishes on black); `surface.dark.rimWidth` 0 turns the old light rim off. The same holds for every ink stroke that sits on the dark face or background: the store lid, the queue rails, a flat `lineBadge` outline, the emote outlines, rays and Z casings, and the `linkIcon` face outline. Marks drawn over a light or state fill (the ?, !, tick, X, the bulb filament, link glyphs inside the white face) stay `color.ink`. The emote's dark output no longer goes through the old rim and shadow pass (`darken`). Owner check on the dark renders, 2026-11-06.
- Per-piece redraws (defaults and drawing; a colour a spec passes explicitly is still drawn):

| Piece | 0.6.1 | 0.7.0 |
|---|---|---|
| `robot` | green body (`color.healthy`), green ears (`illustration.healthyShade`), green eyes on navy visor, three mouth bars, orange antenna tip (`color.blocked` `#FF8A3D`) | white body and ears, `brand.light.text` visor with the cast's idle eyes (`cast.eyes`), one grille bar `brand.light.border` (`#D7D1C5`), antenna tip `brand.light.accent` |
| `serverStack` | default fill `color.backend` (coral), white bars | default `color.white`, bars `illustration.textBar`; the failing light stays `color.state.failure` |
| `gear` | default `color.transitional`, white hub | default `color.white`, hub `brand.light.bg` |
| `parcel` | default `color.blocked` | default `color.white` |
| `folder` | yellow front and back | white front, `brand.light.border` back |
| `steps`, `speechBubble`, `nameTag`, `milestonePin` | blue/yellow/green defaults | default `color.white` (the bubble's line `illustration.textBar`) |
| `browserWindow` | coral, yellow and green dots (`color.backend` `#FF6B6B`, `color.transitional` `#FFD25A`, `color.healthy` `#3DDC84`), blue hero block | dots `color.white`, hero block `brand.light.bg` |
| `codePanel` | lines coloured by `color` (healthy, caller, white, backend) | lines `brand.dark.textMuted` (`white` lines `brand.dark.text`); a `tall` line, the one under review, `brand.dark.accent`. The `color` enum is kept so existing specs stay valid |
| `sheet` | checked box `color.caller`, tick accent, question mark on yellow | checked box `color.ink` with a white tick, question mark on white |
| `rail` | navy band, white centre line | default band `color.white`, centre line `brand.light.border` |
| `arcArrow` | default `color.white` | default `color.ink` (white vanishes on pale backgrounds) |
| `priceTag` | white string | ink string |
| `muleFlow` | default bar `color.caller` | default bar `brand.light.bg` |
| `book` | an ink back page offset behind the stack, an ink rect behind the front cover, an ink spine | the offset ink back page and the ink rect behind the cover go (they read as the old shadow); the white back page stays and the spine stays `color.ink` |
| `linkIcon` | coloured faces, shadow frame | white face, outline only, no frame |
| `emote` | hard shadows, yellow bulb and burst, `cast.metal`, `cast.glow`, coral heart, blue Zs | no shadow, bulb `cast.eyes`, no burst disc (rays only), base `brand.light.border`, drops and Zs `color.white`, heart `brand.light.accent`; `problem`, `refused`, `worked` keep their state colours |
| `bankObject` | screen off | the cast's idle eyes on the screen; `modulo` without the two inner strokes between its legs |

`checkBadge`, `stamp`, `blockArrow`, `magnifier`, `cloud`, `pill`, `road`, `rings` and the diagram and map pieces change through the token layer only.

## Decision 4: what is removed

| Removed | Consumers in this repository | Outside (follow-up) |
|---|---|---|
| 21 pre-0.6.0 `coverBackground` pairs | `test/fixtures/cover-backgrounds.json`; the proof fixtures `test/fixtures/covers/*.json` (`blush`, `peach`, `lavender`, `navy`) and their goldens; tests that pass a removed name (`test/scripts/cover.test.ts`, `test/scripts/cover-formats.test.ts`, `test/pieces/body-diagram.test.ts`, `test/package/package.test.ts`, `test/tokens/illustration.test.ts`) | content specs already on tracks; site banner (`navy`) and 404 (`mustard`) frozen until AB#302; stackledger banner (`navy`) AB#303 |
| `color.healthy` … `color.failFast` | `src/pieces`, `src/brand`, `src/scenes` migrate to `color.state.*`; so do `test/fixtures/covers/*.json`, `scripts/pieces-sheet.ts`, `scripts/freeze-pieces.ts`, `scripts/freeze-pieces-0.5.0.ts`, the two pinned fixtures that pass one, and every test that passes one | 33 content specs (rebuild PR), stackledger (AB#303), two kit templates (kit PR) |
| `MASCOTS`, `MASCOT_ACTIONS`, `MASCOT_FACES`, `mascot`, seven-role `cast.*` tokens | `cast.ts` (emote part kept, moved to `emote.ts`), `cast-motion-test` composition and `Root.tsx`, freeze fixtures, the `mascot` sample of `scripts/pieces-sheet.ts`, the `mascot` entry of the catalogue test, the mascot cases of `test/scripts/cover.test.ts`, the seven-role cases of `test/tokens/illustration.test.ts` | site banner and 404 (frozen) |
| `illustration.healthyShade`, `illustration.transitionalShade` | `scripts/tokens.ts` `REQUIRED`, `test/tokens/illustration.test.ts` | none |
| `icon` + `signature` accepted | validation now refuses it | none |

`EMOTE_KINDS`, `emote`, `cast.eyes`, `cast.emotePop` and the timing helpers in `src/brand/cast-motion.ts` (`emotePop`, `leave`, `blinking`, `breathe`, `squashAfter`, `hop`) stay: emotes and the new cast use them.

## Resolutions taken while writing the spec deltas

The spec author listed the points below as open; the agent resolved them as follows (the owner can veto at G1).

- **Every hard offset goes, literal ones included.** `rail`, `priceTag`, `nameTag`, `stamp`, `cloud` (8), the `muleFlow` tiles (6), `steps` and the emote shadows pass their own offsets today; they draw no shadow in 0.7.0 ("No hard offset shadow").
- **Where the embedding lives.** `src/fonts/embed.ts`, outside `src/pieces/` (whose modules stay pure, without `node:` imports), exported only from the subpath `@brunosouzas/design-system/fonts` (Decision 1, API); the root entry imports nothing from `src/fonts/`. The font files are in `fonts/` at the package root.
- **Faces shipped and how a text picks one.** Twelve files. Source Sans 3: Regular, Italic, Bold, Bold Italic, Black, Black Italic. Source Code Pro: Regular, Bold (no italic: an italic code run uses the upright face). Source Serif 4: Regular, Italic, Bold, Bold Italic. The italics ship because the wordmark is set in Source Serif 4 italic (I9) and a diagram label may use italic. `font-weight` missing or `normal` is 400, `bold` is 700, numbers snap as in Decision 1. Faces are ordered by family name (code-point order), then weight ascending, then style (`normal` before `italic`).
- **Fixtures.** The frozen-call fixtures (`pieces-0.2.0.json`, `pieces-0.5.0.json`, `ui-icons-0.3.0.json`, `message-arrow-0.3.1.json`) keep their calls, except that every top-level `color.<state>` parameter value becomes `color.state.<state>` (only `pieces-0.2.0.json` and `pieces-0.5.0.json` hold any), and are regenerated once with 0.7.0 output by their freeze scripts (`scripts/freeze-pieces.ts`, `scripts/freeze-pieces-0.5.0.ts`, `scripts/freeze-ui-icons.ts`, `scripts/freeze-message-arrow.ts`), migrated the same way, after the owner approves the renders of group 8. Their requirement names stay, so history reads. The emote freeze moves to `test/fixtures/emote-0.7.0.json`, replacing `cast-0.5.0.json` and `cast-dark-0.5.2.json`. PSNR parity with the published originals is replaced by the owner's review of Chrome renders against the 0.6.1 goldens.
- **Proof fixtures' backgrounds.** Each proof cover takes the track its article's spec in `brunosouzas-content` already uses; the `home-banner` fixture takes `trackIntegration`.
- **Piece count.** 62 (the 63 exported today minus `mascot`); the main spec's 54 was never updated by the archived change.
- **Dark surface leftovers.** The `renewalRing` ink band follows the dark-ink rule (`surface.dark.muted`). `ledgerMark` keeps a 2-unit band in `surface.dark.muted` around its ink square on the dark surface, no longer tied to `rimWidth` (otherwise `#121212` on `#121110` vanishes). `surface.dark.rim` becomes `#F1EEE8` (`brand.dark.text`), unused while `rimWidth` is 0.
- **ledgerMark line.** Its default `illustration.accent` turns orange with the token; stackledger keeps its own identity by passing its line colour when it adopts 0.7.0 (AB#303). It stays on 0.6.x until then.
- **Emote and robot details.** The idea's glow disc is dropped (rays only). The robot's grille bar is `brand.light.border` (`#D7D1C5`).
- **Palette of every piece.** The owner asked that every piece go through the same grammar as the new cast, so a test walks every piece's default output on both surfaces against one allowlist (`color.white`, `color.ink`, `surface.*`, `brand.*`, `illustration.*`, `cast.eyes`, `none`). A state colour stays in a default output only where it means a state, read from `src/pieces/*.ts`: `checkBadge` (done), `sheet`'s tail check (done), `stamp`'s default face (approved), `serverStack`'s failing light (failure), emotes `problem`/`refused` (failure) and `worked` (done), `renewalRing`'s inner band (renewal due), an owned `licenceMark`, the EIP icon data in `eipIcon` and `nameTag` (the published notation, "Icon colours"). `nodeBlock`'s focus face and `messageArrow`'s failure kinds use state colours only when asked, not by default. **Open for the owner (G1):** `taggedContainer`'s default tab is `color.state.transitional`, a tag rather than a state; it is listed so the token-layer-only decision holds, and the owner decides whether it moves to a neutral.
- **Error message.** A colour parameter's problem names `color.state.healthy` as its example instead of the removed `color.healthy`.

## Decision 5: release and order

One minor release, `0.7.0`, carrying the three parts, so every consumer rebuilds its art once. This pull request holds the change and its archive; the version bump is its own release pull request (`docs/release.md`). Golden fixtures and the frozen piece hashes are regenerated in this change and reviewed as renders, not as hashes.

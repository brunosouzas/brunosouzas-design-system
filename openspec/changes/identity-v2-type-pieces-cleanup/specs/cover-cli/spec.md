## ADDED Requirements

### Requirement: Fonts embedded in every written image
Before writing, the command SHALL pass every format's tree through `embedFonts` of `@brunosouzas/design-system/fonts` ("Fonts embedded in an SVG tree"), so the written SVG carries the subset Source faces its text uses and a reader sees Source inside an `<img>` without the fonts installed. A spec whose text needs a character the faces lack is still written; the browser draws that character from the next family of the stack.

#### Scenario: Proof cover carries its faces
- **WHEN** the `spec-driven-development` fixture is built
- **THEN** the written SVG has exactly one `<style>`, right after `<desc>`, holding two `@font-face` rules in this order: `Source Sans 3` with `font-weight:550 799` and `font-style:normal` (the labels, at `cover.labelWeight` 700), then `Source Sans 3` with `font-weight:800 900` and `font-style:normal` (the `?` marks and the `GO` stamp, at 900); each `src` is a `data:font/ttf;base64,` URL with `format('truetype')`, and the file equals its golden

#### Scenario: Diagram carries its code face
- **WHEN** the `circuit-breaker-states` fixture is built with `--lang en`
- **THEN** its `<style>` holds two `@font-face` rules in this order: `Source Code Pro` at `550 900` (the `resetTimeout` run, which inherits weight 700), then `Source Sans 3` at `550 799` (every other word, at 700)

#### Scenario: Text-free output gets no font style
- **WHEN** the `eip-splitter` icon fixture and a `favicon` spec are built
- **THEN** the icon holds no `<style>`, and the favicon holds only its theme `<style>` of "New icon formats", with no `@font-face`

#### Scenario: Character the faces lack
- **WHEN** a cover spec holds a `pill` with `text: "漢 ok"`
- **THEN** the command writes the cover and exits 0, and the embedded subset holds the glyphs of `o`, `k` and the space but none for `漢`

#### Scenario: Embedding is deterministic
- **WHEN** the same diagram spec is built twice with `--lang pt`
- **THEN** both files are byte-identical, embedded fonts included

### Requirement: Font embedding failure in the command
When `embedFonts` rejects (a font file cannot be read, or the WebAssembly module fails to load), the command SHALL print the `Error`'s message, which names the file path or `harfbuzzjs`, exit 1 and write nothing: an existing output file keeps its bytes.

#### Scenario: Unreadable font file
- **WHEN** the test makes the read of the Source Sans 3 Bold file fail and runs the command on the `home-banner` fixture with `--out` naming an existing file
- **THEN** the command prints one line holding that file's path, exits 1, prints no `wrote` line, and the existing file keeps its bytes

#### Scenario: WebAssembly fails to load
- **WHEN** the test makes the instantiation of the `harfbuzzjs` wasm module fail and runs the command on a valid cover spec with no output file yet
- **THEN** the command prints one line naming `harfbuzzjs`, exits 1, and no output file exists

### Requirement: Emote on a cover
A cover, banner or diagram spec SHALL accept `emote` in `pieces` like any other piece, checked with the same schema and relations, with problems reported at their JSON path. `mascot` is no longer a piece: an entry naming it is an unknown piece.

#### Scenario: Emote drawn
- **WHEN** a cover spec has the piece `{ "piece": "emote", "kind": "idea", "x": 520, "y": 160 }`
- **THEN** the command writes the cover, and its outlined group holds a `g` with `data-emote` `idea`

#### Scenario: Mascot refused
- **WHEN** a cover spec has `{ "piece": "mascot", "who": "dev", "x": 0, "y": 0 }` and `{ "piece": "emote", "kind": "zzz", "x": 0, "y": 0 }`
- **THEN** both are reported, `pieces[0].piece` ("unknown piece \"mascot\"", listing the 62 piece names) before `pieces[1].kind`, the command exits 1 and writes nothing

### Requirement: Only track and neutral cover backgrounds
`coverBackground` SHALL hold the three track entries `trackIntegration`, `trackDelivery`, `trackAi`: `fill` equal to `brand.light.track*`, `ring` that fill mixed 12% toward black, usable as the `background` of a cover, banner, LinkedIn card or og spec. The 21 entries measured before 0.6.0 are removed: with `neutral`, these are the only four backgrounds.

#### Scenario: Track background accepted
- **WHEN** a cover spec has `background: "trackIntegration"`
- **THEN** the command writes the cover with the background fill and ring colours of `coverBackground.trackIntegration`

#### Scenario: Removed background refused
- **WHEN** a cover spec has `background: "peach"`, or a banner spec `background: "navy"`
- **THEN** the command prints `background: expected one of neutral, trackAi, trackDelivery, trackIntegration, found "peach"` (or `"navy"`), exits 1 and writes nothing

## MODIFIED Requirements

### Requirement: Cover spec format
A spec SHALL be a JSON object with `id` (safe slug), `title` and `description` (non-empty strings), optional `format` (`cover`, `banner`, `diagram`, `icon`, `favicon`, `linkedin-card`, `og`, `avatar`; default `cover`), and the keys its format allows: `background`, `rings` (`cx`, `cy`, optional `radius`), `pieces`, `custom`, `customAt`, `height`, `text`, `signature`. Each format's requirement says which it refuses or needs. Any other top-level key is an error.

#### Scenario: Unknown background and piece
- **WHEN** a spec has `background: "pink"` and a piece `{ "piece": "rocket" }`
- **THEN** both are reported, `background` before `pieces[0].piece`, the second listing the 62 piece names

#### Scenario: Unsafe id
- **WHEN** `id` is `../sdd` or `SDD`
- **THEN** `id` is reported as not a safe slug

#### Scenario: Invalid JSON
- **WHEN** the spec has a trailing comma
- **THEN** the command prints the parser's line and column, exits 1 and writes nothing

#### Scenario: Unknown format
- **WHEN** a spec has `format: "poster"`, or `format: 1`
- **THEN** exactly one problem is printed for `format`: "expected one of cover, banner, diagram, icon, favicon, linkedin-card, og, avatar", the command exits 1 and writes nothing

#### Scenario: Ring count in a spec
- **WHEN** a cover, banner or diagram spec has `rings.count: 30`
- **THEN** `rings.count` is reported as "unknown parameter: the ring count comes from the format"

### Requirement: One free-form object
A spec SHALL have at most one free-form object, `custom`, a single JSON node tree (not an array) drawn in the outlined group after the pieces' bodies, or before `pieces[customAt]` when `customAt` is given, with its colour token paths resolved and every `text` node written with `stroke="none"`.

#### Scenario: Array of objects
- **WHEN** `custom` is an array of two trees
- **THEN** `custom` is reported as "one free-form object per cover; a repeated object must be a piece"

#### Scenario: Allowed object
- **WHEN** `custom` is a `g` with a `path` whose `fill` is `color.state.blocked` and a `text` node `v1`
- **THEN** the cover draws them after the pieces' bodies, with `fill` resolved to the token's value and the text with `stroke="none"`

#### Scenario: Removed top-level colour in custom
- **WHEN** a `custom` `path` has `fill: "color.blocked"`
- **THEN** that path is reported as not a colour token path, the command exits 1 and writes nothing

### Requirement: Cover output
When `format` is `cover` or absent, the output SHALL be an 800x420 `svg` with `role="img"`, `aria-labelledby` naming `<id>-title` and `<id>-desc`, the sans font, then `title`, `desc`, the font `<style>` when there is text, a clip-path `<id>-frame`, the background fill, the clipped rings (14) in the background's ring colour, one outlined group with every piece body in paint order and `custom` where "Free-form object's place" puts it, and one label group with every text, ending in LF.

#### Scenario: Layer order
- **WHEN** a spec has a `pill` before a `sheet`
- **THEN** the pill's rect comes before the sheet's shapes in the outlined group, and the pill's label is in the label group after all shapes

#### Scenario: Ring colour from the pair
- **WHEN** a spec has `background: "trackIntegration"` and `rings.radius` 100
- **THEN** the background is `#F4E4D8`, the 14 rings are stroked `#D7C9BE`, width 2, radii 100 to 464 in steps of 28

#### Scenario: Default format is the cover
- **WHEN** each proof cover fixture is built once as it is and once with `format: "cover"` added
- **THEN** both outputs equal its golden SVG byte for byte

### Requirement: Parity with the published proof covers
The repository SHALL keep as spec fixtures, with their golden SVG output: the three published proof covers (`spec-driven-development`, `ai-writes-code`, `integration-patterns`), the banner `home-banner`, the body diagram `circuit-breaker-states` (one spec, a golden per language, `-pt` and `-en`) and the icon `eip-splitter`. No other spec enters the repository. Cover and banner fixtures use a remaining background; goldens are drawn in the v2 grammar.

#### Scenario: Golden output
- **WHEN** the test builds each fixture, the diagram once with `--lang pt` and once with `--lang en`
- **THEN** each of the seven results equals its golden SVG byte for byte

#### Scenario: Visual parity (local)
- **WHEN** the owner renders each golden at its width (800, 1200 for the banner, 64 for the icon) in headless Chrome through an `<img>`, next to the 0.6.1 golden
- **THEN** the text shows in Source, the layout, rings and words match the 0.6.1 golden, and the owner approves the pair; no PSNR against the published originals applies, because the v2 colours and type differ from them by design

#### Scenario: Golden drifts
- **WHEN** one byte of a golden differs from what the command writes
- **THEN** the golden test fails naming that fixture

### Requirement: Banner output
When `format` is `banner`, the output SHALL be a `banner.width` x `banner.height` (1200x420) `svg` with the attributes, `title`, `desc` and LF ending of a cover. The clip-path `<id>-frame` and the background rect both have `rx` `banner.radius` (20). After the background come the clipped rings, then one group clipped by `<id>-frame` holding the outlined group and the label group.

#### Scenario: Banner frame
- **WHEN** a spec with `format: "banner"`, `background: "trackDelivery"` and one `pill` is built
- **THEN** the root has `width="1200" height="420" viewBox="0 0 1200 420"`, the clip rect and the background rect have `rx="20"`, the background is `#DFE8E1`, and the pill's rect and label sit inside the clipped group

#### Scenario: Piece past a corner
- **WHEN** a banner spec places a `cloud` at `cx` -20, `cy` 10
- **THEN** the command writes the banner, and the cloud's path is inside the group clipped by `<id>-frame`

#### Scenario: Same command for both formats
- **WHEN** the owner runs `npm run cover -- banner.json --out out/banner.svg` on a valid banner spec
- **THEN** it prints `wrote out/banner.svg`, exits 0, and a second run leaves the file byte-identical

### Requirement: No current colour in a spec
A spec of any format SHALL refuse `currentColor` in `uiIcon.colour`, the one parameter that accepts it, with the problem "currentColor is for icons inline in a page; a cover uses a token path" at that path, sorted and printed with any other problem; the command exits 1 and writes nothing, because every output is a standalone image. `currentColor` in any other colour parameter gets that parameter's usual token-path problem.

#### Scenario: Current colour in a cover
- **WHEN** `pieces[0]` is a `uiIcon` with `name: "sun"`, `x: 10`, `y: 10` and `colour: "currentColor"`
- **THEN** the command prints `pieces[0].colour: currentColor is for icons inline in a page; a cover uses a token path`, exits 1, and an existing output file keeps its bytes

#### Scenario: Current colour on another piece
- **WHEN** `pieces[0]` is a `pill` with valid parameters and `fill: "currentColor"`
- **THEN** the command prints `pieces[0].fill: expected a colour token path such as color.state.healthy, found "currentColor"` and exits 1

#### Scenario: Token colour in a cover
- **WHEN** `pieces[0]` is the same `uiIcon` with `colour: "color.white"`
- **THEN** the spec is valid and the cover is written with the icon's group filled and stroked `#FFFFFF`

#### Scenario: Current colour in an icon spec
- **WHEN** an icon spec holds a `uiIcon` `sun` with `colour: "currentColor"`
- **THEN** `pieces[0].colour` gets the same problem and nothing is written

### Requirement: Diagram output
When `format` is `diagram`, the output SHALL be an `svg` `bodyDiagram.width` (800) wide and `height × width / layoutWidth` high (two decimals), with `viewBox="0 0 560 <height>"` (`bodyDiagram.layoutWidth`), and a cover's attributes, `title`, `desc` and LF ending. The clip-path `<id>-frame` and the panel rect, filled `color.panel`, have `rx` `bodyDiagram.radius × 560 / 800` (9.8). Then the clipped rings, then one group clipped by `<id>-frame` holding the outlined group and the label group.

#### Scenario: Diagram frame
- **WHEN** a diagram spec with `height` 322 and one `diagramBox` is built
- **THEN** the root has `width="800" height="460" viewBox="0 0 560 322"`, the clip rect and the panel rect have `rx="9.8"`, the panel is `#F6F3EC`, and the box's shapes sit inside the clipped group

#### Scenario: Smallest diagram
- **WHEN** a diagram spec has `height` 1
- **THEN** the root has `width="800" height="1.43"` and `viewBox="0 0 560 1"`, so the panel still fills the 800 width at the scale 800 / 560, and the command writes it

### Requirement: Diagram keys
A diagram spec SHALL need `height`, a number from 1 to 10000 in layout units, and refuse `background` with "a diagram is drawn on color.panel; background is for covers and banners". A cover or banner spec SHALL refuse `height` with "only a diagram takes a height". A cover or banner still needs `background`.

#### Scenario: Height out of range
- **WHEN** a diagram spec has no `height`, then `height: 0`, then `height: 10001`, then `height: "322"`
- **THEN** each run prints one problem for `height`, "expected a number from 1 to 10000", exits 1 and writes nothing

#### Scenario: Background in a diagram
- **WHEN** a diagram spec has `background: "trackIntegration"`
- **THEN** `background` is reported as "a diagram is drawn on color.panel; background is for covers and banners"

#### Scenario: Height on a cover
- **WHEN** a cover spec has `height: 420`
- **THEN** `height` is reported as "only a diagram takes a height"

### Requirement: Diagram outline and labels
In a diagram the outlined group SHALL be stroked `color.ink` at `map.outline` (3) with round joins, and the label group SHALL set `map.labelSize` (13), `cover.labelWeight`, fill `color.ink` and `text-anchor` middle, so pieces sized in map units show at the published sizes at 800.

#### Scenario: Pill in a diagram
- **WHEN** a diagram spec holds one `pill`
- **THEN** the outlined group has `stroke="#121212" stroke-width="3" stroke-linejoin="round"`, the label group has `font-size="13"` and `font-weight="700"`, and the pill's rect and text sit in them

#### Scenario: Piece with its own stroke
- **WHEN** a diagram spec holds a `diagramBox`
- **THEN** its shapes keep the stroke widths they have when drawn on their own, whatever the group sets

### Requirement: Diagram rings at the shown scale
In a diagram the rings SHALL be stroked `color.ring` at `cover.ringWidth × 560 / 800` (1.4), with radii from `rings.radius` (default `bodyDiagram.ringRadius × 560 / 800`, 49) in steps of `cover.ringStep × 560 / 800` (19.6), rounded to two decimals. Their count is `max(1, ceil((d − radius) / 19.6) + 1)`, where `d` is the distance from (`cx`, `cy`) to the farthest corner of the 560 × `height` frame.

#### Scenario: Published rings
- **WHEN** a diagram spec has `height` 322 and `rings` `cx` 280, `cy` 161 and no `radius`
- **THEN** 15 rings are drawn, stroked `#EDE8DE` at width 1.4, radii 49 to 323.4 in steps of 19.6, which show at step 28 and width 2 at 800

#### Scenario: First ring beyond every corner
- **WHEN** the same spec has `rings.radius` 400
- **THEN** exactly one ring is drawn, of radius 400

#### Scenario: Centre far outside the diagram
- **WHEN** a diagram spec has `height` 10000 and `rings` `cx` -10000, `cy` -10000, no `radius`
- **THEN** the diagram is written with 1153 rings, radii 49 to 22628.2

#### Scenario: Most rings
- **WHEN** the same spec has `rings.radius` 0.01
- **THEN** the diagram is written with 1155 rings, radii 0.01 to 22618.41, the most a diagram spec can draw

### Requirement: Icon output
When `format` is `icon`, the spec SHALL hold exactly one piece, an `eipIcon`, `uiIcon` or `linkIcon`, at `x` 0 and `y` 0 (their default in an icon spec). The output is an `svg` the size of the piece (64 × 40 × `scale` for `eipIcon`, `size` × `size` for the others, defaults 24 and 46) with a `viewBox` from 0 0, the attributes of a cover, `title`, `desc`, then the piece's body, ending in LF.

#### Scenario: EIP icon
- **WHEN** the `eip-splitter` fixture is built
- **THEN** the root has `width="64" height="40" viewBox="0 0 64 40"`, the title is `Splitter`, the description is the icon's own with its CC BY 4.0 credit, and the body is `eipIcon` `splitter` drawn at 0,0

#### Scenario: UI icon box
- **WHEN** an icon spec holds a `uiIcon` `sun` with `size` 48 and `colour` `color.state.blocked`
- **THEN** the root has `width="48" height="48" viewBox="0 0 48 48"`

#### Scenario: Not one icon piece
- **WHEN** an icon spec holds two pieces, or one `pill`
- **THEN** `pieces` is reported as "an icon spec holds exactly one piece: eipIcon, uiIcon or linkIcon"

#### Scenario: Icon off the origin
- **WHEN** an icon spec's `eipIcon` has `x: 4`
- **THEN** `pieces[0].x` is reported as "an icon is drawn at 0, 0"

### Requirement: Icon keys
An icon spec SHALL refuse `background`, `rings`, `custom`, `customAt`, `height` and `signature`, each with "not used by the icon format". An `eipIcon` spec SHALL refuse `title` and `description` with "comes from the EIP icon, with its CC BY 4.0 credit", because both come from the icon's data; a `uiIcon` or `linkIcon` spec needs both.

#### Scenario: Rings in an icon
- **WHEN** an icon spec has `rings` `cx` 0, `cy` 0
- **THEN** `rings` is reported as "not used by the icon format" and nothing is written

#### Scenario: Signature in an icon
- **WHEN** an icon spec has `signature: true`, and then `signature: false`
- **THEN** each run reports `signature` as "not used by the icon format", exits 1 and writes nothing

#### Scenario: Title on an EIP icon
- **WHEN** an `eipIcon` spec has `title: "Splitter"`
- **THEN** `title` is reported as "comes from the EIP icon, with its CC BY 4.0 credit"

#### Scenario: UI icon without a title
- **WHEN** a `uiIcon` spec has no `title`
- **THEN** `title` is reported as "expected a non-empty string"

### Requirement: Signature lockup
A `cover`, `banner`, `linkedin-card` or `og` spec SHALL accept an optional boolean `signature`; `true` adds the Mira-and-symbol lockup after every piece and before the labels, anchored to the frame's bottom-right corner by `cover.signatureMargin` from both edges, with `mira` at `scale: 0.25`. A `diagram`, `favicon`, `avatar` or `icon` spec refuses the key (for the icon: "Icon keys").

#### Scenario: Signature drawn
- **WHEN** a cover spec has `signature: true`
- **THEN** the written SVG's outlined group ends with a group holding both the `mira` piece at `scale: 0.25` and the symbol, its bounding box's right and bottom edges `cover.signatureMargin` from the frame's right and bottom edges

#### Scenario: No signature by default
- **WHEN** a cover spec omits `signature`
- **THEN** the written SVG has no signature group

#### Scenario: Signature refused by an icon
- **WHEN** an icon spec has `signature: true`
- **THEN** `signature` is reported as "not used by the icon format" and nothing is written, where 0.6.x accepted it and drew nothing

## REMOVED Requirements

### Requirement: Cast on a cover
**Reason**: The seven-role cast and its `mascot` piece are removed in 0.7.0 (ADR 0007 amendment); only `emote` stays.
**Migration**: Use "Emote on a cover" for emotes; draw a character with `mira`, `visor`, `drone`, `kiu` or `sinal`. A spec with a `mascot` entry now fails as an unknown piece.

### Requirement: Track cover backgrounds
**Reason**: It kept the 21 pre-0.6.0 backgrounds accepted for one release; they are removed in 0.7.0.
**Migration**: "Only track and neutral cover backgrounds" holds the same three track entries; move a spec on a removed background (`peach`, `navy`…) to `trackIntegration`, `trackDelivery`, `trackAi` or `neutral`.

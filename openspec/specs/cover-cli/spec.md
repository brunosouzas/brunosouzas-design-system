# cover-cli Specification

## Purpose
Builds a blog cover from a JSON spec kept with the article in the private vault, using only the public pieces and tokens, so every cover is reproducible and draft covers never enter the public repository.

## Requirements

### Requirement: Cover command
`npm run cover -- <spec.json> --out <file.svg>` SHALL read one cover spec, build the cover and write it to the `--out` path, replacing an existing file, then print `wrote <file.svg>` and exit 0.

#### Scenario: Proof cover
- **WHEN** the owner runs `npm run cover -- test/fixtures/covers/spec-driven-development.json --out out/covers/sdd.svg` with `out/covers/` present
- **THEN** `out/covers/sdd.svg` equals `test/fixtures/covers/spec-driven-development.svg` and `wrote out/covers/sdd.svg` is printed

#### Scenario: Running twice
- **WHEN** the same command runs twice
- **THEN** the file is byte-identical after both runs

### Requirement: Invocation problems
The command SHALL exit 1 with the problem and the usage line, writing nothing, when: an option other than `--out` or `--lang` is given, `--out` has no value, is missing or is repeated, the out path does not end in `.svg`, its folder does not exist, it names a folder, `--lang` has no value, is repeated or is not a language code, no spec path or more than one is given, or the spec cannot be read. Only the first is reported, in that order.

#### Scenario: Missing out
- **WHEN** the owner runs `npm run cover -- cover.json`
- **THEN** it prints `--out <file.svg> is required` and the usage, exits 1, and writes nothing

#### Scenario: Wrong extension and two specs
- **WHEN** the owner runs `npm run cover -- a.json b.json --out cover.png`
- **THEN** only the out-path problem is printed, because it comes first in the order, and the command exits 1

#### Scenario: Missing folder
- **WHEN** `--out` names `missing/cover.svg` and `missing/` does not exist
- **THEN** it prints that the folder does not exist and exits 1

#### Scenario: Out names a folder
- **WHEN** `--out` names `covers.svg` and `covers.svg/` is a folder
- **THEN** it prints that the output is a folder and exits 1

#### Scenario: Language option problems
- **WHEN** the owner runs the command with a valid `--out` and `--lang` with no value, then with `--lang pt --lang en`, then with `--lang PT`
- **THEN** it prints `--lang needs a value: <code>`, then `--lang given more than once`, then `--lang expects a language code such as pt or en, found PT`, each with the usage, exits 1 and writes nothing

### Requirement: Safe write
The command SHALL write the cover to a new temporary file with an unpredictable name, created exclusively in the output folder, and rename it over the target, so it never writes through an existing path or link. When the write fails at any point after the temporary file is created, it prints `cannot write <out>: <reason>`, exits 1, removes that temporary file and leaves an existing file at the target unchanged.

#### Scenario: Write fails
- **WHEN** the output folder is read-only and already holds `cover.svg`
- **THEN** the command prints `cannot write`, exits 1, and `cover.svg` keeps its bytes

#### Scenario: Output that is a symlink
- **WHEN** `cover.svg` is a symlink to another file
- **THEN** the other file keeps its bytes and `cover.svg` becomes a regular file holding the cover

### Requirement: Cover spec format
A spec SHALL be a JSON object with `id` (safe slug), `title` and `description` (non-empty strings), optional `format` (`cover`, `banner`, `diagram`, `icon`, `favicon`, `linkedin-card`, `og`, `avatar`, `linkedin-banner`; default `cover`), and the keys its format allows: `background`, `rings` (`cx`, `cy`, optional `radius`), `pieces`, `custom`, `customAt`, `height`, `text`, `signature`. Each format's requirement says which it refuses or needs. Any other top-level key is an error.

#### Scenario: Unknown background and piece
- **WHEN** a spec has `background: "pink"` and a piece `{ "piece": "rocket" }`
- **THEN** both are reported, `background` before `pieces[0].piece`, the second listing the 63 piece names

#### Scenario: Unsafe id
- **WHEN** `id` is `../sdd` or `SDD`
- **THEN** `id` is reported as not a safe slug

#### Scenario: Invalid JSON
- **WHEN** the spec has a trailing comma
- **THEN** the command prints the parser's line and column, exits 1 and writes nothing

#### Scenario: Unknown format
- **WHEN** a spec has `format: "poster"`, or `format: 1`
- **THEN** exactly one problem is printed for `format`: "expected one of cover, banner, diagram, icon, favicon, linkedin-card, og, avatar, linkedin-banner", the command exits 1 and writes nothing

#### Scenario: Ring count in a spec
- **WHEN** a cover, banner or diagram spec has `rings.count: 30`
- **THEN** `rings.count` is reported as "unknown parameter: the ring count comes from the format"

### Requirement: Piece parameters checked
Each entry of `pieces` SHALL be checked against its piece's parameters: a required one missing, an unknown one, a wrong JSON type, a non-finite or out-of-range number, an unknown enum value, or a colour that is not a token path of type `color` is a problem naming its JSON path.

#### Scenario: Several problems in one piece
- **WHEN** `pieces[2]` is a `sheet` without `rows`, with `colour: "color.white"` and `width: -5`
- **THEN** three problems are printed for `pieces[2].colour`, `pieces[2].rows` and `pieces[2].width`, in that order

#### Scenario: Colour literal anywhere
- **WHEN** any string in the spec is `#FFFFFF`, `#fff`, `rgb(0,0,0)` or `hsl(0,0%,0%)`
- **THEN** that path is reported with "colour literals are not allowed; use a token path"

### Requirement: Every spec problem at once
When a readable spec breaks several rules, the command SHALL print every problem as `<json path>: <message>`, sorted by path (indexes as numbers, names by code point), then by message, exit 1 and write nothing. Exceptions: a wrong container (`pieces` not an array, an entry not an object, an unknown `piece`) is one problem, children unchecked; a colour literal is reported once and replaces any other problem at its path, format refusals included; text problems stop the check ("Language choice").

#### Scenario: Problems sorted
- **WHEN** a spec has a bad `title`, a bad `pieces[10]` and a bad `pieces[2]`
- **THEN** the order is `pieces[2]`, `pieces[10]`, `title`

#### Scenario: One problem per path
- **WHEN** `pieces[0]` is a `pill` with `fill: "#fff"`
- **THEN** exactly one problem is printed for `pieces[0].fill`: "colour literals are not allowed; use a token path"

#### Scenario: Wrong container
- **WHEN** `pieces` is an object holding `fill: "#fff"`, or an entry has an unknown `piece` and a colour literal
- **THEN** one problem is printed for `pieces` (or for that entry's `piece`) and nothing inside it is reported

#### Scenario: Paths in code-point order
- **WHEN** two problem paths differ only in a character above U+FFFF and one in the private-use area U+E000
- **THEN** the U+E000 path comes first

#### Scenario: Colour literal in a refused key
- **WHEN** a diagram spec has `background: "#fff"`
- **THEN** exactly one problem is printed for `background`: "colour literals are not allowed; use a token path"

#### Scenario: Table problems stop the check
- **WHEN** a spec has `text.en.open: 5` and `title: ""`
- **THEN** only `text.en.open` is reported; after the table is fixed, a second run reports `title`

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

### Requirement: Free-form content
`custom` SHALL use only the tags `g`, `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon`, `path`, `text`, and the attributes of `design.md` §6. No value contains `url(` or `//`; `fill`, `stroke` and the grammar attributes (`transform`, `d`, `points`) are strings; `fill` and `stroke` are `none` or a colour token path; `transform` holds only `translate`, `rotate` and `scale`; `d` and `points` hold path characters only; strings appear only in `text`.

#### Scenario: Forbidden content
- **WHEN** `custom` holds a `script` or `image` node, or an attribute `onload`, `href` or `style`
- **THEN** each is reported by its path and nothing is written

#### Scenario: External reference
- **WHEN** a `custom` node has `filter: "url(https://example.com/f.svg#f)"` or `fill: "url(#g)"`
- **THEN** each is reported by its path

#### Scenario: Numbers in grammar attributes
- **WHEN** a `custom` node has `fill: 123`, `transform: 5` and `d: 5`
- **THEN** each is reported as "expected a string"

#### Scenario: Transform outside the grammar
- **WHEN** a `custom` node has `transform: "matrix(1 0 0 1 0 0)"`, and another `transform: "rotate(-12 400 200)"`
- **THEN** only the first is reported, as "only translate, rotate and scale are allowed"

### Requirement: Cover output
When `format` is `cover` or absent, the output SHALL be an 800x420 `svg` with `role="img"`, `aria-labelledby` naming `<id>-title` and `<id>-desc`, the sans font, then `title`, `desc`, the font `<style>` when there is text, a clip-path `<id>-frame`, the background fill, the clipped rings (14) in the background's ring colour, one outlined group with every piece body in paint order and `custom` where "Free-form object's place" puts it, and one label group with every text, ending in LF.

#### Scenario: Layer order
- **WHEN** a spec has a `pill` before a `sheet`
- **THEN** the pill's rect comes before the sheet's shapes in the outlined group, and the pill's label is in the label group after all shapes

#### Scenario: Ring colour from the pair
- **WHEN** a spec has `background: "trackIntegration"` and `rings.radius` 100
- **THEN** the background is `#F7C6A1`, the 14 rings are stroked `#E3AB84`, width 2, radii 100 to 464 in steps of 28

#### Scenario: Default format is the cover
- **WHEN** each proof cover fixture is built once as it is and once with `format: "cover"` added
- **THEN** both outputs equal its golden SVG byte for byte

### Requirement: Parity with the published proof covers
The repository SHALL keep as spec fixtures, with their golden SVG output: the three published proof covers (`spec-driven-development`, `ai-writes-code`, `integration-patterns`), the banner `home-banner`, the body diagram `circuit-breaker-states` (one spec, a golden per language), the icon `eip-splitter`, the og image `og-headline` and `linkedin-banner`. No other spec enters the repository. Cover and banner fixtures use a remaining background; goldens are drawn in the v2 grammar.

#### Scenario: Golden output
- **WHEN** the test builds each fixture, the diagram once with `--lang pt` and once with `--lang en`
- **THEN** each of the nine results equals its golden SVG byte for byte

#### Scenario: Visual parity (local)
- **WHEN** the owner renders each golden at its width (800, 1200 for the banner and the og image, 1584 for the LinkedIn banner, 64 for the icon) in headless Chrome through an `<img>`, next to the 0.6.1 golden
- **THEN** the text shows in Source, the layout, rings and words match the 0.6.1 golden, and the owner approves the pair; no PSNR against the published originals applies, because the v2 colours and type differ from them by design; `og-headline` and `linkedin-banner` have no 0.6.1 golden and are approved from their own renders

#### Scenario: Golden drifts
- **WHEN** one byte of a golden differs from what the command writes
- **THEN** the golden test fails naming that fixture

### Requirement: Spec positions stay in the frame's range
A cover spec SHALL keep the `rings` centre (`rings.cx`, `rings.cy`) within ±10000, as before this change, although the `rings` piece itself takes any finite number. Piece positions in `pieces` follow the pieces' own rules.

#### Scenario: Rings centre out of range in a spec
- **WHEN** a cover spec has `rings.cy: -10001`
- **THEN** `rings.cy` is reported as "expected a number at least -10000", the command exits 1 and writes nothing

#### Scenario: Far piece in a spec
- **WHEN** a cover spec places a `pill` at `x` 20000
- **THEN** the spec is valid and the cover is written, with the pill outside the visible frame

### Requirement: Overflow reported as a spec problem
When a piece of a valid spec throws "the drawing overflows", the command SHALL report it as a spec problem at that entry's path (`pieces[<i>]: the drawing overflows`), sorted and printed with any other problem, exit 1 and write nothing. Each overflowing entry is reported once.

#### Scenario: Overflowing arrow in a spec
- **WHEN** `pieces[1]` is a `messageArrow` with `from` [-1.7e308, 0], `to` [1.7e308, 0] and `curve: "straight"`
- **THEN** the command prints `pieces[1]: the drawing overflows`, exits 1, and an existing output file keeps its bytes

### Requirement: Banner output
When `format` is `banner`, the output SHALL be a `banner.width` x `banner.height` (1200x420) `svg` with the attributes, `title`, `desc` and LF ending of a cover. The clip-path `<id>-frame` and the background rect both have `rx` `banner.radius` (20). After the background come the clipped rings, then one group clipped by `<id>-frame` holding the outlined group and the label group.

#### Scenario: Banner frame
- **WHEN** a spec with `format: "banner"`, `background: "trackDelivery"` and one `pill` is built
- **THEN** the root has `width="1200" height="420" viewBox="0 0 1200 420"`, the clip rect and the background rect have `rx="20"`, the background is `#B9DEC3`, and the pill's rect and label sit inside the clipped group

#### Scenario: Piece past a corner
- **WHEN** a banner spec places a `cloud` at `cx` -20, `cy` 10
- **THEN** the command writes the banner, and the cloud's path is inside the group clipped by `<id>-frame`

#### Scenario: Same command for both formats
- **WHEN** the owner runs `npm run cover -- banner.json --out out/banner.svg` on a valid banner spec
- **THEN** it prints `wrote out/banner.svg`, exits 0, and a second run leaves the file byte-identical

### Requirement: Banner rings reach the corners
On a banner the rings SHALL be drawn with `count = max(1, ceil((d - radius) / cover.ringStep) + 1)`, where `d` is the distance from (`cx`, `cy`) to the farthest corner of the 1200x420 frame and `radius` is the spec's first radius or `cover.ringRadius`. They are stroked in the background's ring colour, width `cover.ringWidth`.

#### Scenario: Published centre
- **WHEN** a banner spec has `rings` `cx` 600, `cy` 225, `radius` 60
- **THEN** 22 rings are drawn, radii 60 to 648 in steps of 28

#### Scenario: First ring beyond every corner
- **WHEN** a banner spec has `rings` `cx` 600, `cy` 210, `radius` 700
- **THEN** exactly one ring is drawn, of radius 700

#### Scenario: Centre far outside the frame
- **WHEN** a banner spec has `rings` `cx` -10000, `cy` -10000 and no `radius`
- **THEN** the banner is written with 545 rings, radii 90 to 15322

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
When `format` is `icon`, the spec SHALL hold exactly one piece, an `eipIcon`, `uiIcon`, `linkIcon` or `categoryIcon`, at `x` 0 and `y` 0 (their default in an icon spec). The output is an `svg` the size of the piece (64 × 40 × `scale` for `eipIcon`, 42 × 42 × `scale` for `categoryIcon`, `size` × `size` for the others, defaults 24 and 46) with a `viewBox` from 0 0, the attributes of a cover, `title`, `desc`, then the piece's body, ending in LF.

#### Scenario: EIP icon
- **WHEN** the `eip-splitter` fixture is built
- **THEN** the root has `width="64" height="40" viewBox="0 0 64 40"`, the title is `Splitter`, the description is the icon's own with its CC BY 4.0 credit, and the body is `eipIcon` `splitter` drawn at 0,0

#### Scenario: UI icon box
- **WHEN** an icon spec holds a `uiIcon` `sun` with `size` 48 and `colour` `color.state.blocked`
- **THEN** the root has `width="48" height="48" viewBox="0 0 48 48"`

#### Scenario: Category badge box
- **WHEN** an icon spec holds a `categoryIcon` `integration` with `scale` 4, a `title` and a `description`
- **THEN** the root has `width="168" height="168" viewBox="0 0 168 168"`, the body is that badge drawn at 0,0, and the file holds no `<style>`

#### Scenario: Not one icon piece
- **WHEN** an icon spec holds two pieces, or one `pill`
- **THEN** `pieces` is reported as "an icon spec holds exactly one piece: eipIcon, uiIcon, linkIcon or categoryIcon"

#### Scenario: Icon off the origin
- **WHEN** an icon spec's `eipIcon` has `x: 4`
- **THEN** `pieces[0].x` is reported as "an icon is drawn at 0, 0"

### Requirement: Icon keys
An icon spec SHALL refuse `background`, `rings`, `custom`, `customAt`, `height` and `signature`, each with "not used by the icon format". An `eipIcon` spec SHALL refuse `title` and `description` with "comes from the EIP icon, with its CC BY 4.0 credit", because both come from the icon's data; a `uiIcon`, `linkIcon` or `categoryIcon` spec needs both.

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

#### Scenario: Category badge without a description
- **WHEN** a `categoryIcon` spec has a `title` and no `description`
- **THEN** `description` is reported as "expected a non-empty string" and nothing is written

### Requirement: Text tables
A spec MAY have `text`, an object of one or more languages matching `^[a-z]{2}(-[a-z]{2})?$`, each an object of keys matching `^[A-Za-z][A-Za-z0-9_-]*$` whose values are non-empty strings or non-empty arrays of non-empty strings. Every language SHALL define the same keys; a key that one language lacks is reported at `text.<lang>.<key>` as "missing: another language defines it".

#### Scenario: Missing translation
- **WHEN** `text.en` has `open` and `text.pt` does not
- **THEN** `text.pt.open` is reported as "missing: another language defines it", whatever `--lang` names

#### Scenario: Bad table
- **WHEN** `text` has a language `PT`, or `text.en.open` is `5`, or `text.en.close` is `[]`
- **THEN** each is reported at its path and nothing is written

### Requirement: Text references
With `text`, the command SHALL replace every string outside `text` that is exactly `@<key>` by that key's value in the table `--lang` names, once (a value is not resolved again), then check and draw the result; a problem keeps the reference's path. A reference to a key the tables lack is reported at its path as "unknown text key <key>", which replaces any other problem at that path; other paths are checked as usual. Without `text`, every string is drawn as written.

#### Scenario: One spec, two languages
- **WHEN** the `circuit-breaker-states` fixture is built with `--lang pt` and with `--lang en`
- **THEN** each output equals its golden, the edge labels carry that language's lines, and the title is `Estados do circuit breaker` or `Circuit breaker states`

#### Scenario: Unknown key
- **WHEN** a spec with `text` has `pieces[3].lines: "@opne"` (an `edgeLabel`) and `title: ""`
- **THEN** exactly two problems are printed: `pieces[3].lines: unknown text key opne` and `title: expected a non-empty string`

#### Scenario: Value of the wrong type
- **WHEN** `text.en.open` is an array and `pieces[0]` is a `pill` with `text: "@open"`
- **THEN** with `--lang en`, `pieces[0].text` gets the pill's usual problem for a non-string label

#### Scenario: At sign without tables
- **WHEN** a spec without `text` has a `pill` with `text: "@home"`
- **THEN** the cover is written with the label `@home`

### Requirement: Language choice
A spec with `text` SHALL need `--lang` naming one of its languages: without it the problem is at `text`, "choose a language with --lang (<languages>)"; with another one, "no table for <code> (<languages>)", languages sorted and comma-separated. `--lang` on a spec without `text` is reported at `text` as "--lang needs text tables". While a table problem or a language problem exists, nothing else is checked. With a language, the output's ids use `<id>-<code>`.

#### Scenario: No language chosen
- **WHEN** the `circuit-breaker-states` fixture is built without `--lang`
- **THEN** `text: choose a language with --lang (en, pt)` is printed, the command exits 1 and writes nothing

#### Scenario: Unknown language
- **WHEN** it is built with `--lang fr`
- **THEN** `text: no table for fr (en, pt)` is printed and nothing is written

#### Scenario: Language without tables
- **WHEN** the `spec-driven-development` fixture is built with `--lang en`
- **THEN** `text: --lang needs text tables` is printed and nothing is written

#### Scenario: Ids per language
- **WHEN** the fixture is built with `--lang pt`
- **THEN** the root's `aria-labelledby` is `circuit-breaker-states-pt-title circuit-breaker-states-pt-desc` and the clip-path is `circuit-breaker-states-pt-frame`

### Requirement: Free-form object's place
`customAt`, an integer from 0 to the number of pieces, SHALL put `custom` before the body of `pieces[customAt]` in the outlined group; equal to the count, the default, it stays after every body. Labels stay in the label group. Without `custom` it is reported as "needs custom", its value unchecked; with `custom`, a value outside that range or not an integer is "expected an integer from 0 to <count>" (to "the number of pieces" when `pieces` is not an array).

#### Scenario: Custom under a pill
- **WHEN** a cover spec has two pills, `A` then `B`, a `custom` `rect`, and `customAt: 1`
- **THEN** the outlined group holds `A`'s rect, then the custom rect, then `B`'s rect, and the label group holds both labels after every shape

#### Scenario: Default place
- **WHEN** the same spec is built without `customAt` and with `customAt: 2`
- **THEN** both outputs are byte-identical, with the custom rect after both pills' rects

#### Scenario: Bad customAt
- **WHEN** a spec without `custom` has `customAt: 0`, then `customAt: 9` with two pieces, and a spec with `custom` and 8 pieces has `customAt: 9`, then `customAt: 1.5`
- **THEN** `customAt` is reported as "needs custom" twice (one problem each run), then "expected an integer from 0 to 8" twice

### Requirement: Signature lockup
A `cover`, `banner`, `linkedin-card` or `og` spec SHALL accept an optional boolean `signature`; `true` adds the Mira-and-symbol lockup after every piece and before the labels, anchored to the frame's bottom-right corner by `cover.signatureMargin` from both edges, with `mira` at `scale: 0.25`. A `diagram`, `favicon`, `avatar`, `icon` or `linkedin-banner` spec refuses the key (for the icon: "Icon keys").

#### Scenario: Signature drawn
- **WHEN** a cover spec has `signature: true`
- **THEN** the written SVG's outlined group ends with a group holding both the `mira` piece at `scale: 0.25` and the symbol, its bounding box's right and bottom edges `cover.signatureMargin` from the frame's right and bottom edges

#### Scenario: No signature by default
- **WHEN** a cover spec omits `signature`
- **THEN** the written SVG has no signature group

#### Scenario: Signature refused by an icon
- **WHEN** an icon spec has `signature: true`
- **THEN** `signature` is reported as "not used by the icon format" and nothing is written, where 0.6.x accepted it and drew nothing

#### Scenario: Signature refused by a LinkedIn banner
- **WHEN** a `linkedin-banner` spec has `signature: true`, then `signature: false`
- **THEN** each run reports `signature` as "not used by the linkedin-banner format", exits 1 and writes nothing

### Requirement: New icon formats
`format` SHALL accept `favicon` (the symbol, both themes, no `pieces`), `linkedin-card` (1080×1080, cover frame conventions), `og` (1200×630, cover frame conventions, the site's generic social-preview image) and `avatar` (500×500, the symbol on a square ground, "Avatar ground"; `pieces`, `rings`, `custom`, `customAt`, `height` and `signature` are refused). This command writes SVG only; the repository's PNG script ("PNG from a written SVG") is a development tool, and a favicon or social-preview PNG set is the consuming site's build step.

#### Scenario: Favicon is the symbol, both themes, no pieces
- **WHEN** a spec with `format: "favicon"` is built
- **THEN** the written SVG is 32×32, holds a light-theme symbol group and a dark-theme symbol group with a `<style>` block switching them by `prefers-color-scheme`, and a `pieces` array in the spec is rejected (`"not used by the favicon format"`)

#### Scenario: LinkedIn card and og image are fixed sizes
- **WHEN** a spec with `format: "linkedin-card"` is built
- **THEN** the written SVG has `width="1080" height="1080" viewBox="0 0 1080 1080"`
- **WHEN** a spec with `format: "og"` is built
- **THEN** the written SVG has `width="1200" height="630" viewBox="0 0 1200 630"`

#### Scenario: Avatar refuses a background and pieces
- **WHEN** a spec with `format: "avatar"` has a non-empty `pieces`, then `rings` `{ "cx": 0, "cy": 0 }`, then `background: "pink"`
- **THEN** the first two are reported as "not used by the avatar format", the third as `background: expected one of <the cover background names>, found "pink"`; each run exits 1 and writes nothing

### Requirement: Neutral cover background
`coverBackground` SHALL have a `neutral` entry whose `fill` equals `brand.light.bg` and whose `ring` is that fill mixed 12% toward black (`#D8D6D0`), usable as the `background` of a cover, banner, LinkedIn card or og spec, for a cover of a category with no track.

#### Scenario: Neutral background equals the brand background
- **WHEN** the tokens are built
- **THEN** `coverBackground.neutral.fill` equals `brand.light.bg` and `coverBackground.neutral.ring` is `#D8D6D0`

#### Scenario: Neutral background accepted
- **WHEN** a cover spec has `background: "neutral"`
- **THEN** the command writes the cover with the fill and ring colours of `coverBackground.neutral`

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
- **THEN** both are reported, `pieces[0].piece` ("unknown piece \"mascot\"", listing the 63 piece names) before `pieces[1].kind`, the command exits 1 and writes nothing

### Requirement: Only track and neutral cover backgrounds
`coverBackground` SHALL hold the track families of design-tokens "Measured cover backgrounds": the four defaults `trackIntegration`, `trackDelivery`, `trackAi`, `trackPersonal` (`fill` equal to `brand.light.track*`), their seven named tones and `neutral`, each usable as the `background` of a cover, banner, LinkedIn card or og spec. The 21 entries measured before 0.6.0 are removed: these twelve are the only backgrounds.

#### Scenario: Track background accepted
- **WHEN** a cover spec has `background: "trackIntegration"`, then `background: "deliveryMint"`
- **THEN** the command writes each cover with the background fill and ring colours of `coverBackground.trackIntegration` (`#F7C6A1`, `#E3AB84`), then of `coverBackground.deliveryMint` (`#A9DCD6`, `#88C4BD`)

#### Scenario: Removed background refused
- **WHEN** a cover spec has `background: "peach"`, or a banner spec `background: "navy"`
- **THEN** the command prints `background: expected one of aiLilac, aiSky, deliveryMint, deliveryOlive, integrationClay, integrationSand, neutral, personalRose, trackAi, trackDelivery, trackIntegration, trackPersonal, found "peach"` (or `"navy"`), exits 1 and writes nothing

### Requirement: Headline in a written image
Every format that takes `pieces` but `icon` (cover, banner, linkedin-card, og, diagram) SHALL accept `headline` like any piece, checked against its parameters. Its group is written in the labels group, outside the outlined group, so its letters are never stroked, and the written SVG embeds the Source Serif 4 face its lines use ("Fonts embedded in every written image").

#### Scenario: Title on the og image
- **WHEN** an `og` spec with `background: "neutral"`, `signature: true` and one `headline` with `lines: ["Code that runs", "for the problem", "you have."]` and `size: 96` is built
- **THEN** the written SVG is 1200×630, its `<style>` holds exactly one `@font-face`, `Source Serif 4` with `font-weight:100 900` and `font-style:normal`, and the `headline` group has no ancestor carrying a `stroke` attribute

#### Scenario: Title on a diagram
- **WHEN** a `diagram` spec holds one `headline` with `lines: ["States"]`
- **THEN** the command writes the diagram, its `headline` group has no ancestor carrying a `stroke` attribute, and its `<style>` holds a `Source Serif 4` face at `100 900`

#### Scenario: Headline from text tables
- **WHEN** an `og` spec has `text` tables `en` and `pt`, each with `slogan` as an array of three lines, and one `headline` with `lines: "@slogan"`, built with `--lang pt`
- **THEN** the `headline` group's three `text` nodes hold the `pt` lines in order, and the output's ids use `-pt`

#### Scenario: Headline out of range in a spec
- **WHEN** an `og` spec has a `headline` with `size: 200` and `lines: []`
- **THEN** `pieces[0].lines` and `pieces[0].size` are reported, the command exits 1 and writes nothing

### Requirement: LinkedIn banner output
When `format` is `linkedin-banner`, the output SHALL be a 1584x396 `svg` (`viewBox="0 0 1584 396"`, LinkedIn's personal profile background) with a cover's attributes, `title`, `desc`, LF ending and layers: the clip-path `<id>-frame` and the background rect, both without `rx`, the clipped rings, then the outlined group and the label group, unclipped as on a cover.

#### Scenario: LinkedIn banner frame
- **WHEN** a spec with `format: "linkedin-banner"`, `background: "trackDelivery"`, `rings` (1188, 198, radius 60) and one `headline` with `lines: ["Integration"]` and `size: 64` at (900, 120) is built
- **THEN** the root has `width="1584" height="396" viewBox="0 0 1584 396"`, the clip rect and the background rect have no `rx`, the background is `#B9DEC3`, and the `headline` group is in the label group

#### Scenario: Same command, same bytes
- **WHEN** the owner runs `npm run cover -- linkedin.json --out out/linkedin.svg` twice on a valid LinkedIn banner spec
- **THEN** each run prints `wrote out/linkedin.svg` and exits 0, and the file is byte-identical after both

### Requirement: LinkedIn banner keys
A `linkedin-banner` spec SHALL need `background` (a `coverBackground` name), `rings` and `pieces`, and accept `custom` and `customAt` as a cover does. It SHALL accept `text` with one table, `en`, because the words in the image are English (STY-8); any other language is reported at `text.<lang>` as "a LinkedIn banner's words are English". It SHALL refuse `height` with "only a diagram takes a height" and `signature` with "not used by the linkedin-banner format".

#### Scenario: Missing background
- **WHEN** a `linkedin-banner` spec has no `background`
- **THEN** `background` is reported as `expected one of <the cover background names>, found nothing`, the command exits 1 and writes nothing

#### Scenario: Height on a LinkedIn banner
- **WHEN** a `linkedin-banner` spec has `height: 396`
- **THEN** `height` is reported as "only a diagram takes a height" and nothing is written

#### Scenario: English table
- **WHEN** a `linkedin-banner` spec has `text.en.claim: "Integration"` and a `headline` with `lines: ["@claim"]`, built with `--lang en`
- **THEN** the image is written with the headline `Integration` and ids `<id>-en`

#### Scenario: Another language on a LinkedIn banner
- **WHEN** a `linkedin-banner` spec has tables `en` and `pt` with the same keys
- **THEN** `text.pt` is reported as "a LinkedIn banner's words are English", whatever `--lang` names, and nothing is written

### Requirement: LinkedIn banner rings reach the corners
On a LinkedIn banner the rings SHALL be drawn with `count = max(1, ceil((d - radius) / cover.ringStep) + 1)`, where `d` is the distance from (`cx`, `cy`) to the farthest corner of the 1584x396 frame and `radius` is the spec's first radius or `cover.ringRadius`, stroked in the background's ring colour at `cover.ringWidth`.

#### Scenario: Rings of the fixture
- **WHEN** a LinkedIn banner spec has `rings` `cx` 1188, `cy` 198, `radius` 60
- **THEN** 42 rings are drawn, radii 60 to 1208 in steps of 28

#### Scenario: First ring beyond every corner on a LinkedIn banner
- **WHEN** a LinkedIn banner spec has `rings` `cx` 1100, `cy` 150, `radius` 2000
- **THEN** exactly one ring is drawn, of radius 2000

#### Scenario: Centre far outside a LinkedIn banner
- **WHEN** a LinkedIn banner spec has `rings` `cx` -10000, `cy` -10000 and no `radius`
- **THEN** the image is written with 554 rings, radii 90 to 15574

### Requirement: Ring count takes a frame size
`bannerRingCount(cx, cy, radius, width, height)` SHALL take the frame size as two optional parameters after `radius`, defaulting to the banner's 1200x420, so every existing call keeps its result and nothing is removed from the public API.

#### Scenario: Banner ring count unchanged
- **WHEN** `bannerRingCount(600, 225, 60)` and `bannerRingCount(1188, 198, 60, 1584, 396)` are called
- **THEN** they return 22 and 42

### Requirement: LinkedIn profile photo zones
The package SHALL export from its root entry `LINKEDIN_PHOTO_ZONES`, a frozen array of the circles LinkedIn's profile photo covers, in banner units, white ring included, as measured on the owner's screenshots of 2026-11-11 (about ±2 units), and `LINKEDIN_PHOTO_MARGIN`, 16. Each zone's `safeRadius` is its `r` plus the margin.

#### Scenario: Zone values
- **WHEN** `LINKEDIN_PHOTO_ZONES` and `LINKEDIN_PHOTO_MARGIN` are read from the package root
- **THEN** the margin is 16 and the zones are exactly `{ name: "desktop", cx: 207, cy: 362, r: 160, safeRadius: 176 }` and `{ name: "ios", cx: 244, cy: 409, r: 187, safeRadius: 203 }`, in that order; the array and every entry are frozen, so in strict mode `LINKEDIN_PHOTO_ZONES[0].cx = 1` and `LINKEDIN_PHOTO_ZONES.push(x)` both throw

### Requirement: Photo zones are not checked by the command
The cover command SHALL NOT check pieces, `custom` or words against the photo zones or against a word size: keeping pieces out of the zones is the composer's job, checked by the owner on a render with the zones drawn ("Photo zones overlay").

#### Scenario: A piece in a zone is not refused
- **WHEN** a valid LinkedIn banner spec has a `stationMarker` centred at (207, 362)
- **THEN** the image is written and the command prints only `wrote <file.svg>`

### Requirement: PNG script outside the package
The repository SHALL hold a development script, `scripts/png.ts`, run as `npm run png -- <file.svg> --out <file.png> [--width <px>] [--ground <#rrggbb>] [--zones]`. It is not compiled into the package, not a `bin`, and not part of the cover command.

#### Scenario: Not in the package
- **WHEN** the package test packs the build
- **THEN** no packed file is a `png` script and `bin` names only `brunosouzas-cover`

### Requirement: PNG render
The PNG script SHALL render the SVG through one `<img>` at the SVG's own size (or `--width`, the height in proportion), device scale 1. The window is the page's size; `--ground` adds a 24 px margin of that colour on every side ("Page on a ground"). The script SHALL check that the result is a PNG of the page's size, and write it through a temporary file and a rename. Any problem SHALL exit 1 and leave the target as it was.

#### Scenario: PNG size read
- **WHEN** the header reader gets a PNG of 1584 x 309 while the page is 1584 x 396
- **THEN** the script reports `cannot render <file.png>: the browser wrote 1584x309, expected 1584x396` and writes nothing

#### Scenario: Page on a ground
- **WHEN** the page is built for a 1584x396 SVG with `--width 792 --ground #1B1D24 --zones`
- **THEN** the page and the window are 840 x 246, the body is `#1B1D24`, the `<img>` and the zones `svg` both sit at (24, 24), and the expected PNG size is 840 x 246

#### Scenario: Real PNG (local)
- **WHEN** the owner runs `npm run png` on the `linkedin-banner` golden and on an avatar on `neutral` with his own Chrome
- **THEN** the PNGs are 1584 x 396 and 500 x 500, and their words and pieces match the SVG shown through `<img>` in Chrome

### Requirement: Browser for the PNG script
The PNG script SHALL use `BRUNOSOUZAS_CHROME` when set, else the macOS Chrome and Chromium application paths, else `google-chrome` or `chromium` on `PATH`; start it without a shell, with a fresh profile in a temporary folder it removes, `--host-resolver-rules="MAP * ~NOTFOUND"` so every host name resolves nowhere, and stop it after 60 s.

#### Scenario: Browser arguments
- **WHEN** the script builds the browser's argument list for a page
- **THEN** it holds `--headless`, `--user-data-dir=<a temporary folder>`, `--force-device-scale-factor=1`, `--window-size=<page width>,<page height>` and `--host-resolver-rules=MAP * ~NOTFOUND`, and never `--no-sandbox`

#### Scenario: Lookup order
- **WHEN** `BRUNOSOUZAS_CHROME` is unset and both the macOS Chrome path and `chromium` on `PATH` exist
- **THEN** the macOS Chrome path is used

#### Scenario: No browser
- **WHEN** `BRUNOSOUZAS_CHROME` names a file that does not exist
- **THEN** the script prints `npm run png needs Google Chrome or Chromium: set BRUNOSOUZAS_CHROME to its executable`, exits 1 and writes nothing

### Requirement: Photo zones overlay
With `--zones`, for a 1584x396 SVG only, the PNG script SHALL draw each zone's photo circle and safe circle from `LINKEDIN_PHOTO_ZONES` over the image, dashed, in the page and never in the image.

#### Scenario: Page with zones
- **WHEN** the page is built for a 1584x396 SVG with `--width 792` and `--zones`
- **THEN** it holds one `<img src="image.svg" width="792" height="198">` and, over it, an `svg` with `viewBox="0 0 1584 396"` holding four dashed circles at the two zones' centres, of radii 160, 176, 187 and 203

#### Scenario: Zones on another size
- **WHEN** the script gets `--zones` with a 500x500 SVG
- **THEN** it prints `--zones is for a 1584x396 LinkedIn banner, found 500x500` with the usage, exits 1 and writes nothing

### Requirement: Avatar ground
An `avatar` spec SHALL accept an optional `background`, a `coverBackground` name; the square behind the symbol takes that pair's `fill`, and its ring colour is unused. Without `background` the square stays `brand.light.accentText` and the output is byte-identical to 0.9.1's.

#### Scenario: Avatar on the neutral ground
- **WHEN** an avatar spec has `background: "neutral"`
- **THEN** the written SVG is 500x500 and its square is filled `#F6F3EC`, with the same symbol group as without `background`

#### Scenario: Default avatar unchanged
- **WHEN** the `av` avatar spec of `test/scripts/cover.test.ts` (no `background`) is built
- **THEN** the output equals, byte for byte, `test/fixtures/covers/avatar-0.9.1.svg`, captured from the published 0.9.1 before any change, whose SHA-256 is recorded in `test/fixtures/covers/README.md`

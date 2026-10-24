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
A spec SHALL be a JSON object with `id` (safe slug), `title` and `description` (non-empty strings), optional `format` (`cover`, `banner`, `diagram` or `icon`; default `cover`), `background` (a `coverBackground` name), `rings` (`cx`, `cy`, optional `radius`; finite numbers), `pieces` (array of objects with `piece` and its parameters), and the optional `custom`, `customAt`, `height` and `text`. Each format's requirement says which keys it refuses or needs. Any other top-level key is an error.

#### Scenario: Unknown background and piece
- **WHEN** a spec has `background: "pink"` and a piece `{ "piece": "rocket" }`
- **THEN** both are reported, `background` before `pieces[0].piece`, the second listing the 54 piece names

#### Scenario: Unsafe id
- **WHEN** `id` is `../sdd` or `SDD`
- **THEN** `id` is reported as not a safe slug

#### Scenario: Invalid JSON
- **WHEN** the spec has a trailing comma
- **THEN** the command prints the parser's line and column, exits 1 and writes nothing

#### Scenario: Unknown format
- **WHEN** a spec has `format: "poster"`, or `format: 1`
- **THEN** exactly one problem is printed for `format`: "expected one of cover, banner, diagram, icon", the command exits 1 and writes nothing

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
- **WHEN** `custom` is a `g` with a `path` whose `fill` is `color.blocked` and a `text` node `v1`
- **THEN** the cover draws them after the pieces' bodies, with `fill` resolved to the token's value and the text with `stroke="none"`

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
When `format` is `cover` or absent, the output SHALL be an 800x420 `svg` with `role="img"`, `aria-labelledby` naming `<id>-title` and `<id>-desc`, the sans font, then `title`, `desc`, a clip-path `<id>-frame`, the background fill, the clipped rings (14) in the background's ring colour, one outlined group with every piece body in paint order and `custom` where "Free-form object's place" puts it, and one label group with every text, ending in LF.

#### Scenario: Layer order
- **WHEN** a spec has a `pill` before a `sheet`
- **THEN** the pill's rect comes before the sheet's shapes in the outlined group, and the pill's label is in the label group after all shapes

#### Scenario: Ring colour from the pair
- **WHEN** a spec has `background: "peach"` and `rings.radius` 100
- **THEN** the background is `#F4D8BC`, the 14 rings are stroked `#EAC7A3`, width 2, radii 100 to 464 in steps of 28

#### Scenario: Default format is the cover
- **WHEN** each proof cover fixture is built once as it is and once with `format: "cover"` added
- **THEN** both outputs equal its golden SVG byte for byte

### Requirement: Parity with the published proof covers
The repository SHALL keep as spec fixtures, with their golden SVG output: the three published proof covers (`spec-driven-development`, `ai-writes-code`, `integration-patterns`), the banner `home-banner`, the body diagram `circuit-breaker-states` (one spec, a golden per language, `-pt` and `-en`) and the icon `eip-splitter`. No other spec enters the repository.

#### Scenario: Golden output
- **WHEN** the test builds each fixture, the diagram once with `--lang pt` and once with `--lang en`
- **THEN** each of the seven results equals its golden SVG byte for byte

#### Scenario: Visual parity (local)
- **WHEN** the owner renders each golden and its published original at its width (800, or 64 for the icon) with `rsvg-convert` and measures PSNR with ffmpeg
- **THEN** the proof covers reach at least 39.4, 31.8 and 23.3 dB, both diagram goldens at least 22.0 dB, and the icon is pixel-identical (PSNR inf); the banner has no parity value

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
- **WHEN** a spec with `format: "banner"`, `background: "navy"` and one `pill` is built
- **THEN** the root has `width="1200" height="420" viewBox="0 0 1200 420"`, the clip rect and the background rect have `rx="20"`, the background is `#14215A`, and the pill's rect and label sit inside the clipped group

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
- **THEN** the command prints `pieces[0].fill: expected a colour token path such as color.healthy, found "currentColor"` and exits 1

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
- **THEN** the root has `width="800" height="460" viewBox="0 0 560 322"`, the clip rect and the panel rect have `rx="9.8"`, the panel is `#EEF2FF`, and the box's shapes sit inside the clipped group

#### Scenario: Smallest diagram
- **WHEN** a diagram spec has `height` 1
- **THEN** the root has `width="800" height="1.43"` and `viewBox="0 0 560 1"`, so the panel still fills the 800 width at the scale 800 / 560, and the command writes it

### Requirement: Diagram keys
A diagram spec SHALL need `height`, a number from 1 to 10000 in layout units, and refuse `background` with "a diagram is drawn on color.panel; background is for covers and banners". A cover or banner spec SHALL refuse `height` with "only a diagram takes a height". A cover or banner still needs `background`.

#### Scenario: Height out of range
- **WHEN** a diagram spec has no `height`, then `height: 0`, then `height: 10001`, then `height: "322"`
- **THEN** each run prints one problem for `height`, "expected a number from 1 to 10000", exits 1 and writes nothing

#### Scenario: Background in a diagram
- **WHEN** a diagram spec has `background: "navy"`
- **THEN** `background` is reported as "a diagram is drawn on color.panel; background is for covers and banners"

#### Scenario: Height on a cover
- **WHEN** a cover spec has `height: 420`
- **THEN** `height` is reported as "only a diagram takes a height"

### Requirement: Diagram outline and labels
In a diagram the outlined group SHALL be stroked `color.ink` at `map.outline` (3) with round joins, and the label group SHALL set `map.labelSize` (13), `cover.labelWeight`, fill `color.ink` and `text-anchor` middle, so pieces sized in map units show at the published sizes at 800.

#### Scenario: Pill in a diagram
- **WHEN** a diagram spec holds one `pill`
- **THEN** the outlined group has `stroke="#0A1033" stroke-width="3" stroke-linejoin="round"`, the label group has `font-size="13"`, and the pill's rect and text sit in them

#### Scenario: Piece with its own stroke
- **WHEN** a diagram spec holds a `diagramBox`
- **THEN** its shapes keep the stroke widths they have when drawn on their own, whatever the group sets

### Requirement: Diagram rings at the shown scale
In a diagram the rings SHALL be stroked `color.ring` at `cover.ringWidth × 560 / 800` (1.4), with radii from `rings.radius` (default `bodyDiagram.ringRadius × 560 / 800`, 49) in steps of `cover.ringStep × 560 / 800` (19.6), rounded to two decimals. Their count is `max(1, ceil((d − radius) / 19.6) + 1)`, where `d` is the distance from (`cx`, `cy`) to the farthest corner of the 560 × `height` frame.

#### Scenario: Published rings
- **WHEN** a diagram spec has `height` 322 and `rings` `cx` 280, `cy` 161 and no `radius`
- **THEN** 15 rings are drawn, stroked `#E0E7FB` at width 1.4, radii 49 to 323.4 in steps of 19.6, which show at step 28 and width 2 at 800

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
- **WHEN** an icon spec holds a `uiIcon` `sun` with `size` 48 and `colour` `color.blocked`
- **THEN** the root has `width="48" height="48" viewBox="0 0 48 48"`

#### Scenario: Not one icon piece
- **WHEN** an icon spec holds two pieces, or one `pill`
- **THEN** `pieces` is reported as "an icon spec holds exactly one piece: eipIcon, uiIcon or linkIcon"

#### Scenario: Icon off the origin
- **WHEN** an icon spec's `eipIcon` has `x: 4`
- **THEN** `pieces[0].x` is reported as "an icon is drawn at 0, 0"

### Requirement: Icon keys
An icon spec SHALL refuse `background`, `rings`, `custom`, `customAt` and `height`, each with "not used by the icon format". An `eipIcon` spec SHALL refuse `title` and `description` with "comes from the EIP icon, with its CC BY 4.0 credit", because both come from the icon's data; a `uiIcon` or `linkIcon` spec needs both.

#### Scenario: Rings in an icon
- **WHEN** an icon spec has `rings` `cx` 0, `cy` 0
- **THEN** `rings` is reported as "not used by the icon format" and nothing is written

#### Scenario: Title on an EIP icon
- **WHEN** an `eipIcon` spec has `title: "Splitter"`
- **THEN** `title` is reported as "comes from the EIP icon, with its CC BY 4.0 credit"

#### Scenario: UI icon without a title
- **WHEN** a `uiIcon` spec has no `title`
- **THEN** `title` is reported as "expected a non-empty string"

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

### Requirement: Cast on a cover
A cover, banner or diagram spec SHALL accept `mascot` and `emote` in `pieces` like any other piece, checked with the same schema and relations, with problems reported at their JSON path.

#### Scenario: Mascot and emote drawn
- **WHEN** a cover spec has the pieces `{ "piece": "mascot", "who": "architect", "x": 400, "y": 380, "action": "rest" }` and `{ "piece": "emote", "kind": "idea", "x": 520, "y": 160 }`
- **THEN** the command writes the cover, and its outlined group holds a `g` with `data-mascot` `architect` and a `g` with `data-emote` `idea`

#### Scenario: Head tilt on a dev in a spec
- **WHEN** a cover spec has `{ "piece": "mascot", "who": "dev", "x": 0, "y": 0, "headTilt": 5 }` and `{ "piece": "emote", "kind": "zzz", "x": 0, "y": 0 }`
- **THEN** both are reported, `pieces[0].headTilt` ("applies only to the agent") before `pieces[1].kind`, the command exits 1 and writes nothing

## MODIFIED Requirements

### Requirement: Cover spec format
A spec SHALL be a JSON object with `id` (safe slug), `title` and `description` (non-empty strings), optional `format` (`cover` or `banner`, default `cover`), `background` (a `coverBackground` name), `rings` (`cx`, `cy`, optional `radius`; finite numbers), `pieces` (array of objects with `piece` and its parameters) and optional `custom`. Any other top-level key is an error.

#### Scenario: Unknown background and piece
- **WHEN** a spec has `background: "pink"` and a piece `{ "piece": "rocket" }`
- **THEN** both are reported, `background` before `pieces[0].piece`, the second listing the 35 piece names

#### Scenario: Unsafe id
- **WHEN** `id` is `../sdd` or `SDD`
- **THEN** `id` is reported as not a safe slug

#### Scenario: Invalid JSON
- **WHEN** the spec has a trailing comma
- **THEN** the command prints the parser's line and column, exits 1 and writes nothing

#### Scenario: Unknown format
- **WHEN** a spec has `format: "poster"`, or `format: 1`
- **THEN** exactly one problem is printed for `format`: "expected one of cover, banner", the command exits 1 and writes nothing

#### Scenario: Ring count in a spec
- **WHEN** a spec of either format has `rings.count: 30`
- **THEN** `rings.count` is reported as "unknown parameter: the ring count comes from the format"

### Requirement: Cover output
When `format` is `cover` or absent, the output SHALL be an 800x420 `svg` with `role="img"`, `aria-labelledby` naming `<id>-title` and `<id>-desc`, the sans font, then `title`, `desc`, a clip-path `<id>-frame`, the background fill, the clipped rings (14) in the background's ring colour, one outlined group with every piece body in paint order and then `custom`, and one label group with every text, ending in LF.

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
The repository SHALL keep the three published proof covers (`spec-driven-development`, `ai-writes-code`, `integration-patterns`) and one banner, `home-banner` (the brunosouzas.com home banner drawn from the pieces), as spec fixtures with their golden SVG output. No other cover or banner spec enters the repository.

#### Scenario: Golden output
- **WHEN** the test builds each of the four fixtures
- **THEN** each result equals its golden SVG byte for byte

#### Scenario: Visual parity (local)
- **WHEN** the owner renders each proof cover's golden and its published cover at 800 px with `rsvg-convert` and measures PSNR with ffmpeg
- **THEN** the values are at least 39.4, 31.8 and 23.3 dB; the banner fixture has no parity value, because it redraws the published banner from pieces

## ADDED Requirements

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

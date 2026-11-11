## MODIFIED Requirements

### Requirement: Link icons as data
The library SHALL hold `LINK_ICONS`, six stickers: the four of `stackledger-map-and-link-pieces` design §6 (`github`, `linkedin`, `email`, `website`), `stackledger` (the product's mark) and `brunosouzas` (the brand symbol). `linkIcon({ icon, x, y, size, surface })` SHALL draw one in a group `translate(x y) scale(size / 46)`: the face rect, white with its outline and no frame behind it, then the glyph. `size` defaults to 46. The `github` description credits Font Awesome and CC BY 4.0.

#### Scenario: GitHub on light
- **WHEN** `linkIcon({ icon: "github", x: 0, y: 0 })` is called
- **THEN** its group has transform `translate(0 0) scale(1)` and holds first the face rect (2, 2) 38 × 38 radius 9 fill `#FFFFFF` stroke `#121212` at 2.5, then a group `translate(9.5 9) scale(0.0455)` with the path of brunosouzas.com `social-github.svg` (`e29b3dd`)

#### Scenario: Dark frame
- **WHEN** `linkIcon({ icon: "email", x: 0, y: 0, surface: "dark" })` is called
- **THEN** its group starts with the face rect (2, 2) 38 × 38 radius 9 filled `#FFFFFF` and stroked `#ADA79D`, with no frame rect before it

#### Scenario: Unknown icon
- **WHEN** `linkIcon` gets `icon: "x"`, or no `icon`
- **THEN** each call throws a `RangeError` naming `icon`, the first listing `github, linkedin, email, website, stackledger, brunosouzas`

#### Scenario: Link icon list
- **WHEN** `LINK_ICON_NAMES` is read
- **THEN** it is `github`, `linkedin`, `email`, `website`, `stackledger`, `brunosouzas`, in that order, and every entry of `LINK_ICONS` has a non-empty English `title` and `description`

### Requirement: Icons hold no link, style or script
Every `uiIcon` and `linkIcon` tree, on both surfaces, SHALL use only the node contract's tags, hold no attribute named `href`, `xlink:href`, `style` or starting with `on`, and no attribute value or text containing `url(` or `://`. So a consumer can wrap it in a standalone SVG and ship it under a strict content policy.

#### Scenario: Every icon as a standalone file
- **WHEN** the test walks the node tree of each of the 7 UI icons and each of the 6 link icons, on light and dark (26 trees), and then writes each wrapped in `el("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 46 46" }, …body)` with `toSvg`
- **THEN** in the trees no tag is outside `SVG_TAGS`, no attribute is `href`, `xlink:href`, `style` or `on…`, and no attribute value or text holds `url(` or `://`; and each written string holds `://` exactly once, in the root's `xmlns`

## ADDED Requirements

### Requirement: The brunosouzas link icon
`linkIcon` with `icon: "brunosouzas"` SHALL draw, after the face, one group `translate(5.56 6.52) scale(0.875)` holding the brand symbol's three shapes exactly as `symbol` draws them on the light surface (`brand.light.text` haste and ring, `brand.light.accent` moon), on both surfaces, every shape inside the face. Its title is `brunosouzas.com` and its description `brunosouzas.com icon: the brand symbol, a b with a moon.`

#### Scenario: brunosouzas on light
- **WHEN** `linkIcon({ icon: "brunosouzas", x: 0, y: 0 })` is called
- **THEN** its group holds, in order, the face rect (2, 2) 38 × 38 radius 9 fill `#FFFFFF` stroke `#121212` at 2.5 and a group `translate(5.56 6.52) scale(0.875)` holding the rect (5, 3) 5.5 × 26 radius 2.75 filled `#121212`, the circle (17.5, 20.5) r 7.3 with no fill stroked `#121212` at 4.6, then the circle (27.5, 9) r 2.8 filled `#E04E17`, and nothing else

#### Scenario: brunosouzas on dark
- **WHEN** `linkIcon({ icon: "brunosouzas", x: 0, y: 0, surface: "dark" })` is called
- **THEN** only the face rect's stroke differs from the light call, `#ADA79D`; the haste and ring stay `#121212` and the moon `#E04E17`

#### Scenario: Same drawing as the symbol
- **WHEN** the glyph group's children are compared with the shapes inside the group of `symbol({ x: 0, y: 0 })`
- **THEN** they are equal, node for node

#### Scenario: Glyph inside the face, brunosouzas
- **WHEN** the test computes the box of each glyph shape through the group's transform, widened by half its stroke width
- **THEN** every box lies within 2 to 40 on both axes, and the box of all three (about x 9.9 to 32.1, y 9.1 to 32.9) has its centre within 0.01 of the face's centre (21, 21)

#### Scenario: brunosouzas in an icon spec
- **WHEN** an icon spec holds `{ "piece": "linkIcon", "icon": "brunosouzas" }` with a title and a description, on light and with `surface: "dark"`
- **THEN** the command writes a 46 x 46 SVG holding the icon, and the palette check passes the drawn tree on both surfaces

# Spec delta: cover-cli (png-capture-check)

## MODIFIED Requirements

### Requirement: PNG render
The PNG script SHALL render the SVG through one `<img>` at the SVG's own size (or `--width`, the height in proportion), device scale 1; `--ground` adds a 24 px margin of that colour on every side. The window is the page, then a `#FF00FF` band down to at least 400 px. The script SHALL check the PNG is the window's size and the band reaches its last row, cut the page out and write it through a temporary file and a rename. Any problem SHALL exit 1 and leave the target as it was.

#### Scenario: PNG size read
- **WHEN** the header reader gets a PNG of 1584 x 309 while the window is 1584 x 404
- **THEN** the script reports `cannot render <file.png>: the browser wrote 1584x309, expected 1584x404` and writes nothing

#### Scenario: Page on a ground
- **WHEN** the page is built for a 1584x396 SVG with `--width 792 --ground #1B1D24 --zones`
- **THEN** the page is 840 x 246 and the window 840 x 400, the body is `#1B1D24`, the `<img>` and the zones `svg` both sit at (24, 24), and the PNG written is 840 x 246

#### Scenario: Short, wide page
- **WHEN** the window of a 512x112 SVG is 512 x 400 and the browser's screenshot has only its top 25 rows drawn
- **THEN** the script reports `cannot render <file.png>: the browser drew the page only in part (row 112 of 400 is not drawn)` and writes nothing; with the whole window drawn it writes a 512 x 112 PNG

#### Scenario: Real PNG (local)
- **WHEN** the owner runs `npm run png` on the `linkedin-banner` golden and on an avatar on `neutral` with his own Chrome
- **THEN** the PNGs are 1584 x 396 and 500 x 500, and their words and pieces match the SVG shown through `<img>` in Chrome

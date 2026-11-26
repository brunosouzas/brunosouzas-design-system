# Proposal: png-capture-check

## Why

`npm run png` checked only the size of Chrome's screenshot (SW-180, found in the review of #37). Headless Chrome draws a short window only in part: a 512x112 SVG without `--ground` came out 512x112 with only its top 25 rows drawn, and the script exited 0. Measured with Chrome 158: windows of 200, 300 and 600 px are drawn whole, 112 is not.

## What Changes

- The browser's window is at least 400 px tall: the page, then a check band of one colour (`#FF00FF`) from the page's bottom to the window's last row.
- The script reads the screenshot's pixels (`node:zlib`, no npm dependency) and fails with `cannot render <file.png>: the browser drew the page only in part (row <y> of <h> is not drawn)` when the band's left or right pixel is not drawn on a row below the page.
- When the band is whole, the script cuts the page out of the screenshot and writes that PNG; the PNG written is still the page's size.

Out of scope: other renderers, the CDP clip option the card also named, colour profiles, any change to the cover command or the package.

## Implicit requirements

- Errors and invalid input: a screenshot that is not an 8-bit RGB or RGBA non-interlaced PNG is reported as a problem, exit 1, target unchanged (the existing rule).
- Limits: the window is `max(page height + 8, 400)` px tall; no other limit changes.
- Repetition and idempotency: n/a, each run renders again from the SVG.
- Concurrency: n/a, one browser per run in its own temporary folder (unchanged).
- Security: n/a, no new input, file or network access.
- Logs and observability: the new problem is one line on stderr, like the others.

## Documentation

None beyond the spec: `scripts/png.ts`'s header comment says what can go wrong.

# EIP icons without offset shadows: sheets for gate 1 (SW-249)

Evidence for gate 1 of change `flat-eip-icons-and-empty-queue`, drawn on 2026-11-27. The sheets come from a scratch copy of `d26f254` with the 46 shadow nodes of design §1 removed. The branch has no code yet: task 3.2 rebuilds the sheets from the branch after the code lands.

| File | What it shows | How it was made |
|---|---|---|
| `icons-sheet.png` | The 26 EIP icons at scale 3: the 0.14.1 drawing on the left, the drawing without offset shadows on the right. | `eipIcon` trees through `toSvg`, laid out in an HTML grid and screenshotted by headless Chrome. |
| `goldens-sheet.png` | The two cover goldens that draw an EIP icon, `integration-patterns.svg` and `eip-splitter.svg` (at 64 px and 320 px), 0.14.1 next to the regenerated ones. | `npm run cover -- <spec> --out <file>`, each SVG shown through an `<img>` in headless Chrome. |

The empty queue joins the sheets in task 3.2. Without words, it draws the same body as `queueNode` with words.

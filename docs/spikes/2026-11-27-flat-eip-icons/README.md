# EIP icons without offset shadows, and an empty queue (SW-249)

Evidence for change `flat-eip-icons-and-empty-queue`. At gate 1 (2026-11-27) the owner saw the icons and goldens sheets drawn from a scratch copy of `d26f254` with the 46 shadow nodes of design §1 removed, and approved them on `174d80e`. Task 3.2 rebuilt every sheet from this branch on 2026-11-28, after the code (`src/pieces/eip-icons.ts` without the 46 nodes, `queueNode` without words) and the regenerated goldens. The regenerated goldens are byte-identical to the ones the gate 1 sheet showed, and so are the rebuilt `icons-sheet.png` and `goldens-sheet.png`; `queue-sheet.png` is new. The 0.14.1 side of each sheet comes from a detached checkout of `d26f254`, where the icons and `queueNode` draw as in 0.14.1.

| File | What it shows | How it was made |
|---|---|---|
| `icons-sheet.png` | The 26 EIP icons at scale 3: the 0.14.1 drawing on the left, the drawing without offset shadows on the right. | `eipIcon` trees through `toSvg`, from `d26f254` and from the branch, laid out in an HTML grid and screenshotted by headless Chrome. |
| `goldens-sheet.png` | The two cover goldens that draw an EIP icon, `integration-patterns.svg` and `eip-splitter.svg` (at 64 px and 320 px), the 0.14.1 golden next to the regenerated one. | `npm run cover -- <spec> --out <golden>`, each SVG shown through an `<img>` in headless Chrome. |
| `queue-sheet.png` | `queueNode` at width 160, 2x, on the light and dark surfaces: with `text: ["orders"]`, without words, and without words at `inkScale` 2. Without words it draws the same body and no text. | `queueNode` trees through `toSvg`, screenshotted by headless Chrome. These SVGs embed no font, so the word is in the browser's sans; covers and scenes embed Source Sans 3 (ADR 0008). |

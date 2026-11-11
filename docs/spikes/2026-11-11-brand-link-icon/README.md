# Evidence: brand-link-icon (AB#326)

Renders for the owner's gate of change `brand-link-icon` (design §2), made on 2026-11-11 with `npm run png` and Google Chrome on macOS (`/Applications/Google Chrome.app`, headless, device scale 1). Each PNG is a build output kept here only as evidence (under 10 KB each).

| File | Size | What it shows |
|---|---|---|
| `brunosouzas-icon-light.png` | 232 x 232 | the `brunosouzas` link icon from an icon spec at size 184, on `surface.light.background` `#F6F3EC` |
| `brunosouzas-icon-dark.png` | 232 x 232 | the same with `surface: "dark"`, on `surface.dark.background` `#121110` |
| `evidence-row-light.png` | 512 x 184 | evidence only: the six separate link icons drawn side by side at size 64 (`github`, `linkedin`, `email`, `website`, `stackledger`, `brunosouzas`), on `#F6F3EC` |
| `evidence-row-dark.png` | 512 x 184 | evidence only: the same with `surface: "dark"`, on `#121110` |

**The row is not an asset.** Every link icon is its own piece call and its own file: `brunosouzas`, like `github`, `linkedin` or `stackledger`, is written alone by an icon spec holding one `linkIcon` (46 x 46; the command refuses an icon spec with two pieces). The package has no combined icon and no row (spec illustration-pieces "Each link icon stands alone"). The `evidence-row-*` images only show the owner, at the gate, how the separate icons sit next to each other where a consumer lays them out side by side; never ship or reuse them.

At 24 px (renders kept out of the repository: the icon spec with `--width 24`, and the row at size 24) the b's haste and ring read and the moon shows as a separate orange dot, on both surfaces.

## Commands

From the repository root, after `npm ci`:

```sh
D=docs/spikes/2026-11-11-brand-link-icon
npm run cover -- brunosouzas-icon.json --out brunosouzas-icon.svg
npm run cover -- brunosouzas-icon-dark.json --out brunosouzas-icon-dark.svg
npm run png -- brunosouzas-icon.svg --out $D/brunosouzas-icon-light.png --ground '#F6F3EC'
npm run png -- brunosouzas-icon-dark.svg --out $D/brunosouzas-icon-dark.png --ground '#121110'

PAD_Y=60 npx tsx row.ts light 64 link-icons-light.svg
PAD_Y=60 npx tsx row.ts dark 64 link-icons-dark.svg
npm run png -- link-icons-light.svg --out $D/evidence-row-light.png
npm run png -- link-icons-dark.svg --out $D/evidence-row-dark.png

# 24 px checks, not committed
npm run png -- brunosouzas-icon.svg --out brand-icon-24-light.png --width 24 --ground '#F6F3EC'
PAD_Y=80 npx tsx row.ts dark 24 link-icons-dark-24.svg && npm run png -- link-icons-dark-24.svg --out brand-icon-row-24-dark.png
```

The specs and the row script are kept out of the repository (only fixtures enter it, spec cover-cli "Parity with the published proof covers"); they were:

```json
{ "id": "brunosouzas-icon", "format": "icon", "title": "brunosouzas.com", "description": "brunosouzas.com icon: the brand symbol, a b with a moon.",
  "pieces": [{ "piece": "linkIcon", "icon": "brunosouzas", "size": 184 }] }
```

`brunosouzas-icon-dark.json` is the same with `"id": "brunosouzas-icon-dark"` and `"surface": "dark"` on the piece.

`row.ts`, an evidence script kept out of the repository (paths to `src/pieces/` adjusted to where it runs), draws every name of `LINK_ICON_NAMES` with `linkIcon` at `size`, a quarter of the size apart, on a ground rect of the surface's background with a 24-unit margin left and right and `PAD_Y` above and below:

```ts
import { writeFileSync } from "node:fs";
import { LINK_ICON_NAMES, linkIcon } from "./src/pieces/link-icons.ts";
import { el } from "./src/pieces/node.ts";
import { toSvg } from "./src/pieces/render.ts";
const [surface, size, out] = [process.argv[2] as "light" | "dark", Number(process.argv[3]), process.argv[4]];
const ground = surface === "dark" ? "#121110" : "#F6F3EC";
const pad = 24;
const padY = Number(process.env.PAD_Y ?? pad);
const gap = size / 4;
const body = LINK_ICON_NAMES.flatMap((icon, i) => linkIcon({ icon, x: pad + i * (size + gap), y: padY, size, surface }).body);
const width = 2 * pad + LINK_ICON_NAMES.length * size + (LINK_ICON_NAMES.length - 1) * gap;
const height = 2 * padY + size;
writeFileSync(out, toSvg(el("svg", { xmlns: "http://www.w3.org/2000/svg", width, height, viewBox: `0 0 ${width} ${height}` }, el("rect", { width, height, fill: ground }), ...body)) + "\n");
```

**A finding about `npm run png`.** The row first rendered as a short page (512 x 112, the margin from `--ground`, then with the ground drawn in the SVG): Chrome wrote a PNG of the right size that did not hold the whole image (with `--ground`, only the ground; with the ground drawn in the SVG, only its top 40 or so pixels), and the script's size check passed it. Pages of 464 x 64, 222 x 72, 232 x 232 and 512 x 184 rendered whole. The rows above are therefore 184 high (`PAD_Y=60`). The script was not changed in this change.

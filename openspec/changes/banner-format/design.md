# Design: banner-format

## 1. Measures (from the published banner)

`brunosouzas.com/public/images/home/home-banner.svg` (commit `e8ad098`): `width="1200" height="420"`, background `rect rx="20"` in `#14215A` (= `coverBackground.navy.fill`), rings in `#1C2D74` (= `coverBackground.navy.ring`), width 2, step 28, centre (600, 225), first radius 60. `Banner.astro` shows it at `max-w-[1200px]`, below the HTML title and intro.

stackledger's home has no image. Its container is 1320px wide (`--container`, `site/src/styles/tokens.css:38`), so a 1200x420 banner fits under the title as on brunosouzas.com.

Tokens: `banner.width` 1200, `banner.height` 420, `banner.radius` 20 (`dimension`). Ring step, ring width, pill and label measures are shared with the cover through the `cover` tokens. One family keeps one label size.

## 2. One spec, a `format` key (decision)

| Option | For | Against |
|---|---|---|
| **A. `format` in the cover spec, same command** (chosen) | One validator, one bin, one fixture style; the card asked for it | "cover spec" now also names banners |
| B. A sibling command `npm run banner` with its own spec | Clear name | A second parser, invocation rules and bin, and the same validation copied |

`format` is optional and defaults to `cover`, so every existing spec and golden keeps its meaning and bytes.

## 3. Rings reach the corners (decision)

On a cover, 14 rings from radius 90 cover an 800x420 frame centred near the middle. On a 1200x420 banner they stop at radius 454 (90 + 13 × 28), and the farthest corner from (600, 225) lies at 640.8, so the corners would be bare. The published banner draws 50 rings, most of them off the frame.

- **Chosen:** the banner frame computes `count = max(1, ceil((d − radius) / ringStep) + 1)`, where `d` is the distance from (cx, cy) to the frame's farthest corner, and passes it to `rings` as `count`. For the published centre and radius 60 that gives 22 rings, the last at 648.
- Rejected: a fixed `banner.ringCount` token. It is right for one centre only.
- Rejected: changing covers too. That would break the proof goldens for no visible gain.

`rings.count` is an integer from 1 to 1000. With positions limited to ±10000 the formula stays below 600. A spec may not set it, as it may not set `rings.color`.

## 4. Clip to the rounded frame

On a cover only the rings are clipped, because the square SVG viewport already trims the pieces. A banner's corners are rounded, so the outlined group and the label group are clipped by the same `<id>-frame`. Order of a banner: `title`, `desc`, `defs` with the clip path (rect `rx` 20), background rect (`rx` 20), clipped rings, then one clipped group holding the outlined group and the label group.

## 5. Spike evidence

`~/.hermes/cache/scratch/ab156/contact-sheet.png` (outside the repository): (1) the published banner; (2) spike A, the same idea from pieces only; (3) spike B, a stackledger metro banner (pipes, station markers at `inkScale` 1.6 and `r` 20, line badges at height 34, `ledgerMark` 120); (4) both at phone width, 375px, next to a cover at the same scale. Findings: no new piece is needed. Pill labels drop to about 6px at 375px. Metro badge text stays 12px whatever the `inkScale`. Both are out of scope.

## 6. The `home-banner` fixture

Task 3.3 writes this file as `test/fixtures/covers/home-banner.json`, byte for byte (two-space indent, LF ending). It is spike A. The pieces, positions and parameters are the ones rendered in the spike sheet, and the title and description describe that drawing. The labels are the words of the published banner (`APIs`, `Integration`, `CI/CD`).

```json
{
  "id": "home-banner",
  "title": "Integration, delivery and AI between systems",
  "description": "Illustration. On the left, a browser window labelled APIs and a stack of three server units send blue pipes into a light blue Mule flow labelled Integration, with a Choice and a For Each component. From the flow a pipe runs right through two passing checks labelled CI/CD into a white cloud. A green robot stands above the pipe on the right.",
  "format": "banner",
  "background": "navy",
  "rings": {
    "cx": 600,
    "cy": 225,
    "radius": 60
  },
  "pieces": [
    {
      "piece": "pipe",
      "d": "M250,118 C360,118 380,196 470,196",
      "fill": "illustration.accent",
      "width": 22,
      "casing": 8
    },
    {
      "piece": "pipe",
      "d": "M244,262 C360,262 380,244 470,244",
      "fill": "illustration.accent",
      "width": 22,
      "casing": 8
    },
    {
      "piece": "pipe",
      "d": "M730,255 H1010",
      "fill": "illustration.accent",
      "width": 22,
      "casing": 8
    },
    {
      "piece": "browserWindow",
      "x": 50,
      "y": 62,
      "width": 200,
      "height": 130
    },
    {
      "piece": "serverStack",
      "x": 64,
      "y": 210,
      "width": 180,
      "units": 3
    },
    {
      "piece": "muleFlow",
      "x": 470,
      "y": 190,
      "width": 262,
      "height": 130,
      "tiles": [
        {
          "x": 498,
          "kind": "choice"
        },
        {
          "x": 618,
          "kind": "for-each"
        }
      ],
      "tileWidth": 86
    },
    {
      "piece": "robot",
      "cx": 980,
      "top": 54
    },
    {
      "piece": "checkBadge",
      "cx": 790,
      "cy": 255,
      "r": 24
    },
    {
      "piece": "checkBadge",
      "cx": 860,
      "cy": 255,
      "r": 24
    },
    {
      "piece": "cloud",
      "cx": 1090,
      "cy": 262,
      "scale": 1.05
    },
    {
      "piece": "pill",
      "x": 150,
      "y": 62,
      "text": "APIs"
    },
    {
      "piece": "pill",
      "x": 601,
      "y": 190,
      "text": "Integration"
    },
    {
      "piece": "pill",
      "x": 825,
      "y": 210,
      "text": "CI/CD",
      "fill": "color.transitional"
    }
  ]
}
```

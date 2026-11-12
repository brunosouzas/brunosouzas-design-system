# Design: sdd-scene-pieces

See `proposal.md` for the why. Six decisions; the numbers come from the gate-0 prototype (`~/.hermes/cache/scratch/ab144-scene1/`, observed) and from the code at `d162a39` (0.11.0, observed). What is assumed is marked.

## 1. How Visor holds a sheet: a sibling parameter

The schema of a piece (`src/pieces/params.ts`) has no union kind: a parameter is a number, colour, string, enum, boolean, point, array or object.

| Option | Fit | Compatibility | Cost |
|---|---|---|---|
| A. Widen `holds` to `boolean \| object` | reads as "holds" | every `holds: true` still valid | a new `oneOf` schema kind, its error messages and its JSON-path reporting in the cover command, for one parameter |
| B. `holds` as an enum `none \| card \| sheet`, plus a `sheet` object | one switch | **breaks** every `holds: true` / `false` call and spec | a migration for nothing gained |
| C. A sibling object `holdsSheet` (chosen) | reads as "holds a sheet" | additive; without it Visor draws as in 0.11.0 | two relations: `holds: true` with `holdsSheet` is refused, and so is `view: "back"` (a sheet's back is not designed; G1 question 8), so one input has one outcome (REQ-5); the schema's problems come first, as for every piece |

`holdsSheet` takes the `sheet` piece's page parameters except position and colours (`width`, `height`, `rows`, `top`, `step`) plus `label`: the caller already knows that shape, and no colour parameter keeps the held sheet in the cast's palette (ADR 0009). Ranges: `width` 80 (the `sheet` minimum) to 300, `height` 80 to 400, 1 to 8 rows (the prototype used 6; 8 still fits a 400 page at the default step).

## 2. Where the sheet sits, and who draws what

Visor's local units (scale 1; the ground line is y 0; the body spans x −66 to 66, the top of the head is at about y −150). The card hand is at (−92, −66) today; the held sheet reuses that hand.

| Part | Facing right | Facing left |
|---|---|---|
| Page box | right edge x −84, bottom y −4: `x = −84 − width`, `y = −4 − height` | left edge x 84: `x = 84`, `y = −4 − height` |
| Label pill | centred on the page's top edge: (`x + width / 2`, `y`) | same rule |
| Left hand | circle (−92, −66), r 15, outlined, drawn after the sheet, over its right edge | mirrored with the body: (92, −66), over the page's left edge |
| Card | not drawn | not drawn |

The label pill takes `pill`'s default width (150 for `proposal.md`), so on a page narrower than its label it hangs over both edges, and on the smallest page (80 × 80) its end reaches behind Visor's left ear (the held group is drawn first); both are accepted and shown in the evidence, and the scene uses a page at least as wide as its label. The bottom at −4 keeps the page off the ground line; the hand at −66 lies inside any page at least 80 high (−84 to −4). Assumed, to be confirmed on the stills at the owner's gate: these positions read as "holding" at the scene's scale (1.15 in the prototype).

The page, rows and pill are the `sheet` and `pill` pieces' own drawings, called with those positions, inside one group (`data-held` `sheet`) that sets Visor's outline (`stroke` the skin's outline, `stroke-width` `outline.block`, round joins). Cast pieces set `stroke: none` on their root and outline each shape themselves, while `sheet` and `pill` rely on the cover command's outlined group; the held group gives them that stroke inside Visor, so the held sheet draws the same in a cover and in a scene. On the dark surface the page and the pill sit on the dark background (outline `surface.dark.muted`, as Visor's own body), but the marks sit on the white page, so the sheet's marks group gets `stroke` `color.ink` (ADR 0009's dark ink rule). On light both are `#121212`.

The sheet's `?` glyphs and the label become Visor's `text`, in one group with the root's transform and its own `font-family` (`font.sans`), `font-size` and `font-weight` (`cover.labelSize`, `cover.labelWeight`), `fill` `color.ink` and `text-anchor` `middle`: in a cover the labels group sets these already, but a scene has no labels group, so the words carry them. The `?` nodes keep their own size 19 and weight 900.

Rejected: leave the caller to place a `sheet` beside Visor (what the prototype did, frame 4). The hand cannot be drawn over the sheet's edge from outside without splitting Visor into two calls, and every scene would redo the geometry.

## 3. Mirroring: one transform on the body group

| Option | Strokes | Words | Cost |
|---|---|---|---|
| A. `scale(-1,1)` on the body group (chosen) | a uniform −1 scale keeps every stroke width and colour exactly (ADR 0009) | the sheet and the text sit outside the group, so they are never mirrored | none: Kiu's back view already uses `scale(-1,1)` |
| B. Redraw the geometry with negated x | same | same | every path of Visor rewritten twice; drift risk between the two |
| C. Let the caller wrap Visor in `scale(-1 1)` | same | mirrors the held sheet's words | breaks STY-8 readability; no parameter to check |

`facing` defaults to `right`, the drawing of 0.11.0, so the transform is added only facing left and every existing tree stays deep-equal. The face is symmetric in all four expressions, so the mirror changes no meaning.

## 4. The question token: a new piece, sized like the sheet's mark

`countBadge` is a stackledger map sticker: its face is the surface's panel (dark on the dark surface), its size grows from `textSize` with map tokens, and its outline is `map.outline`. Giving it a "question" mode would tie the scene's object to the map's evolution. The token is a new piece, `questionToken`, whose mark is exactly the `sheet` question row's (radius 13, `?` at size 19, weight 900, baseline +7): in the scene the token travels into the sheet and becomes a row, so both must be the same mark. It is sized with `scale` (as `emote`), which scales the outline with it, rather than with a radius at a fixed outline width, so a large token keeps the row's proportions. The text carries its own font attributes, as in §2, so it reads the same in a scene through `toReact`.

## 5. The scene tokens: a new group in composition pixels

| Option | Why not, or why |
|---|---|
| Extend `motion` | `motion` holds timings and springs; rings and dashes are sizes |
| Reuse `cover.ring*` | covers use 90 / 28 / 2 at 800 wide; the scenes use 100 / 34 / 2.5 at 1920 wide; changing either changes published images or videos |
| A `scene` group (chosen) | the stage of a video, in the 16:9 composition's pixels (1920 × 1080), next to `cover`, `banner` and `bodyDiagram` |

- **Rings** keep the values the scenes draw today, so the existing videos do not change: `ringRadius` 100, `ringStep` 34, `ringWidth` 2.5, `ringReach` 1.2 (the rings cover the frame's larger side with 20 % to spare). `ringReach` is a ratio, type `number`.
- **Path.** The prototype drew 2 / 9 / 3 on a 960 × 540 frame; in composition pixels that is 4 / 18 / 6 (dash, gap, width, round caps), the look the owner saw at gate 0 (G1 question 2). Round caps are the drawing rule of a dotted path, not a token: token types have no string.
- **Colour.** Tokens have no aliases, so `scene.pathColor` holds `#5C5852` and a check keeps it equal to `brand.light.textMuted`, as `surface.*.backdropCredit` does (card 303). Only the light role: scenes are drawn on `color.panel`.

The gate-0 sheet drew the rings with the 1920 values on a 960 frame, so the AB#144 scene will show them twice as dense relative to the frame as the sheet did (G1 question 3).

## 6. Proving the existing scenes unchanged

The repository renders no React component in its tests ("wrapper rendering is checked by local stills", `test/brand/flow-components.test.ts`), and `Rings` needs Remotion's frame context. So the ring logic moves to a pure helper, `stageRingRadii(width, height, values = tokens.scene)`, in `src/brand/motion.ts` (frame logic in pure functions, the repository's code shape); `values` lets a unit test try other values without rebuilding the tokens, as `checkTimeline(scene, readingHold)` does. Three proofs, from cheapest:

1. A fixture, `test/fixtures/scene-rings-0.11.0.json`, written before any change from the 0.11.0 loop for both frames of both scenes, compared with the helper's output (unit).
2. A source test: `components.tsx` keeps no ring constant and its `Rings` calls the helper and reads `scene.ringWidth` (unit).
3. The stills of both scenes, before and after, equal by SHA-256 on one machine (local; rendering needs the network).

The helper refuses a step of 0 (an endless loop) and more than 1000 radii, the cover `rings` piece's limit, held in a local constant: `src/brand/` imports nothing from `src/pieces/` today, and the frame logic should not pull the pieces library in for one number.

## Risks / trade-offs

- [The held sheet's position may not read as "holding" at every size] → the positions are one table (§2); the owner's gate sees stills of a short and a tall sheet, both ways.
- [A pinned fixture freezes today's cast] → intended: any later change to the cast regenerates it in its own change, with the owner's approval of the renders.
- [Stills may differ across machines] → the local proof compares stills from one machine; the CI proof is the radii fixture.

## Migration

None. Every 0.11.0 call, spec and scene draws the same; consumers adopt the new parameters when they need them (DES-3). The public surface grows only: `PieceName` and `PIECE_NAMES` gain `questionToken` (a consumer that switches exhaustively over `PieceName` gets a compile error and adds the case; neither consumer does: brunosouzas.com imports only the tokens, stackledger reads named pieces), the `tokens` type and `tokens.css` gain `scene` (new names only), and the illustration skill's pinned covers keep their bytes (the cover goldens are unchanged). Roll back: a patch release reverting the change; nothing persisted depends on it.

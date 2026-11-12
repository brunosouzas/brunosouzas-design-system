# Proposal: sdd-scene-pieces (AB#333)

## Why

Scene 1 of AB#144 ("what spec-driven development solves", without a spec × with a spec) passed gate 0 on 2026-11-12: the owner picked concept A, "one stage, two takes" (q47 A, MOT-3), and asked that the design system's gaps the storyboard had to work around be closed before the scene's own spec (q50 A). The gate-0 prototype (`~/.hermes/cache/scratch/ab144-scene1/lib.ts`, `concept-a.ts`; sheets in the vault's `10-personal/projects/brunosouzas-design-system/evidence/2026-11-12-sdd-cena-1-gate-0/`) shows four workarounds:

1. **Visor can only hold its own small card.** In take 2 the agent writes the open questions down and hands the sheet over, but `visor({ holds: true })` draws a 28 × 24 accent card; the prototype drew a `sheet` with a `proposal.md` pill beside Visor, not in its hand (frame 4).
2. **Visor points only to its right.** The code panel sits on the right in every frame because `points` can only reach right; a layout with the code on the left, or Visor turning to the requester, cannot be drawn.
3. **The `?` is a map piece.** The open question travels as an object, drawn with `countBadge({ text: "?" })`: a stackledger map sticker sized from `textSize`, whose face on the dark surface is the dark panel, not a v2 white body (ADR 0009).
4. **The stage literals are copied.** The prototype copied the stage rings' 100 / 34 / 2.5 / 1.2 from `src/brand/components.tsx` and wrote the dashed motion path's 2 / 9 / 3 and its colour by hand. MOT-6: every size and colour of a scene comes from the tokens.

## What changes

- **`visor` holds a sheet.** A new optional parameter, `holdsSheet`, an object with the `sheet` piece's own page parameters (`width`, `height`, `rows`, `top`, `step`) and an optional `label` (the file name pill, for example `proposal.md`). Visor draws the sheet in its left hand instead of the card, with the hand over the sheet's edge, in Visor's own outline; the sheet's `?` and the label are Visor's `text`. `holds` keeps its meaning (the card); `holds: true` with `holdsSheet` is refused.
- **`visor` faces left or right.** A new optional parameter, `facing` (`right`, the default and today's drawing, or `left`, the mirror image). Mirroring flips the body only: every stroke colour and width stays (ADR 0009), and a held sheet and every word stay unmirrored.
- **`questionToken`**, a new piece: the open question as an object in the v2 grammar, the same white disc and `?` as a sheet's question row (radius 13, outline `outline.small`, ink on light, `surface.dark.muted` on dark), sized with `scale`. Usable in SVG (covers, storyboards) and in scenes through the React renderer. `countBadge` is unchanged.
- **`scene` tokens**: `scene.ringRadius` 100, `ringStep` 34, `ringWidth` 2.5, `ringReach` 1.2 (the stage rings), and `scene.pathDash` 4, `pathGap` 18, `pathWidth` 6, `pathColor` `#5C5852` (the dashed motion path, in 16:9 composition pixels; the colour checked equal to `brand.light.textMuted`).
- **The stage rings read the tokens.** A pure helper, `stageRingRadii(width, height)`, in `src/brand/motion.ts`, gives the radii; the `Rings` component draws them and keeps no ring constant. The circuit-breaker and publish-subscribe scenes draw the same rings as in 0.11.0, proved against radii pinned before any change and by identical stills.
- **Backwards compatible.** Every existing call, spec and scene gives the same output unless it uses a new parameter: the five cast pieces are pinned against a fixture written from 0.11.0 before any change; the existing fixtures and goldens (`pieces-0.2.0`, `pieces-0.5.0`, `pieces-0.8.0`, `emote-0.7.0`, the cover goldens) stay byte-identical. Nothing is removed or renamed.
- **Release:** one minor, 0.12.0, from a `feat:` pull request title; release-please sets the version (Model 2).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `illustration-pieces`: Visor's `holdsSheet` and `facing`; the `questionToken` piece; the catalogue grows to 64 pieces; the `?` glyph of the token among the words a piece may draw; the cast pinned at 0.11.0; the palette and state-colour rules cover the held sheet.
- `design-tokens`: the `scene` group and its required tokens; the path colour checked equal to its role.
- `motion-components`: the stage ring radii helper and the `Rings` component on the scene tokens, existing scenes unchanged.
- `cover-cli`: a spec accepts `questionToken` and Visor's new parameters; the unknown-piece message lists 64 names.

`scene-catalogue` and `scene-rendering` do not change: no scene is added or altered.

## Out of scope

- Scene 1 of AB#144 itself (its own change after 0.12.0, with its spec, stills and gate 1).
- A piece or component that draws the dashed motion path: this change adds its tokens only; the scene that draws it first decides whether it becomes a shared shape (G1 question 7).
- `facing` or a held sheet on `mira`, `drone`, `kiu`, `sinal` (G1 question 5).
- A dark-surface stage (rings or path): scenes are drawn on `color.panel`; `scene.pathColor` is the light role only.
- Changing `countBadge`, `sheet`, `pill` or the cover `rings` piece (its `cover.*` ring tokens stay as they are).
- Rows that overflow a held sheet's page: drawn as given, as `sheet` draws them (no fit check).
- New emotes, expressions or characters; a new ADR (nothing here contradicts ADRs 0004 to 0009).

## Gate 0 (owner, 2026-11-12)

Concept A, one stage and two takes, about 26 s (q47 A); the fright, the rewind and the take numbers are reading devices the owner kept (q48 A); the stamp says GO (q49 B); the gaps go to the design system first, in AB#333 (q50 A). This change covers exactly those four gaps.

## Questions for gate 1

Each with the recommended answer; the spec is written as recommended.

1. **Held sheet API.** A sibling `holdsSheet` object (recommended: additive, `holds` keeps its meaning) or widening `holds` to `boolean | object` (needs a new schema kind for one parameter)? Design §1.
2. **Path values.** The prototype's 2 / 9 / 3 were drawn on a 960-wide frame; the tokens are in 1920-wide composition pixels. Recommended: 4 / 18 / 6, the look of the gate-0 sheet; the alternative keeps 2 / 9 / 3, half as heavy in the video.
3. **Ring density.** The tokens keep the existing scenes' 100 / 34 / 2.5 / 1.2 (required for their videos to stay identical). The gate-0 sheet drew those values on a 960 frame, so the AB#144 scene will show rings twice as dense as the sheet. Recommended: accept, one stage for every scene; the alternative is a second ring set for new scenes.
4. **Token size.** Base radius 13, the sheet row's mark, sized with `scale` (recommended: the token becomes a row in the scene) or a radius parameter with a fixed outline width?
5. **Mirroring.** `facing` on Visor only (recommended: the only character the scene mirrors; the others when a scene needs it) or on all five cast pieces now?
6. **Changelog.** One line from the squash title, or three lines through `BEGIN_COMMIT_OVERRIDE` (recommended, one per feature)?
7. **Path piece.** Tokens only (recommended: the scene that first draws the path decides whether it is a shared shape in `src/brand/`) or a `motionPath` piece now?

## Implicit requirements

- **Errors and invalid input:** requirement. Each new parameter is checked by the piece's schema and throws a `RangeError` naming its path (`facing`, `holdsSheet.width`, `holdsSheet.rows`, `scale`, …); `holds: true` with `holdsSheet` is refused naming `holdsSheet`; `stageRingRadii` refuses a non-positive or non-finite size; the token build refuses a missing or mistyped `scene.*` token; a cover spec reports each problem at its JSON path.
- **Limits:** requirement. Held sheet `width` 80 to 300 and `height` 80 to 400 (Visor units), 1 to 8 rows; token `scale` above 0 and at most 10; at most 1000 stage rings (`MAX_RINGS`) per call.
- **Repetition and idempotency:** requirement. Pieces stay pure: the same parameters give deep-equal trees and the same `toSvg` bytes; the 0.11.0 cast outputs and the existing scenes' rings are pinned.
- **Concurrency:** n/a. Pure functions and a one-shot token build.
- **Security:** n/a beyond today's rules. No new dependency; a label is a caller string escaped by `toSvg` like every label; the new piece holds no link, style or script.
- **Logs and observability:** n/a. Pieces and helpers print nothing; the token build prints its files as today.

STY-8: no piece in this change writes a `title` or `desc`; the only words are the caller's label and the `?` glyph. Any title or description the package or its evidence adds is English.

## Changelog

The squash title is what release-please reads: `feat: pieces for the SDD scene: Visor holds a sheet and mirrors, question token, motion path and ring tokens (AB#333)`. For one line per feature in `CHANGELOG.md` (recommended, G1 question 6), the pull request description ends with:

```
BEGIN_COMMIT_OVERRIDE
feat: visor holds a sheet (`holdsSheet`) and faces left or right (`facing`) (AB#333)
feat: `questionToken` piece, the open question in the v2 grammar (AB#333)
feat: `scene.*` tokens for the stage rings and the dashed motion path; `Rings` reads them (AB#333)
END_COMMIT_OVERRIDE
```

## Documentation

- `README.md`: "The cast and the emotes" (Visor's `holdsSheet` and `facing`, `questionToken`); "Illustration pieces and covers" (64 pieces, `questionToken`); "How a scene is built" (the `scene` tokens, `stageRingRadii`); "Upgrading to 0.12.0" (added names, nothing removed, every 0.11.0 call unchanged).
- `docs/roadmap.md`: row 13e `sdd-scene-pieces`, AB#333.
- `test/fixtures/` README notes for `cast-0.11.0.json` and `scene-rings-0.11.0.json` (how they were written, from which commit).
- Evidence for the owner's gate in `docs/spikes/<date>-sdd-scene-pieces/` (small PNGs of Visor holding a sheet both ways, the token, the path and rings).
- Vault, after the merge: the project's `architecture.md`, `roadmap.md` and `changelog.md`.
- No ADR.

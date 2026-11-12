# Proposal: supporting-characters (AB#337)

## Why

Watching the storyboard of scene 1 of AB#144 (the SDD scene), the owner could not tell who talks to whom: the person who asks for the change was only a loose speech balloon, and the developer had no character at all. ADR 0007 left "Dev" with no honest match in the pillar cast, and the "requester" was never a character, so the motion skill's CAST-6 sends such a role to the design system as a new supporting character with its own model sheet before a scene uses it.

The owner ran the art-direction studio for it on 2026-11-12 (three model-sheet concepts, SHEET-1; evidence in the brain vault, `10-personal/projects/brunosouzas-design-system/evidence/2026-11-12-personagens-de-apoio/`, approved sheet `concept-C-the-notation.png`, prototype `~/.hermes/cache/scratch/ab337-characters/chars.ts`) and approved every recommendation:

- **q65 A, concept C, "the notation".** **Balão**, the requester and approver: a speech balloon on legs whose tail points at the listener; a request line on its belly, lit in the accent while it speaks; it holds the `stamp` piece to approve (`GO` in the SDD scene). **Chaves**, the developer: a `{ }` body on legs with a cursor in the accent; it types at a keyboard, hands a sheet over, and points. Chaves's silhouette must be reinforced: at 24 px the sheet's draft reads as a pillow.
- **q66 A.** Both wear the parent-brand hood tip (ADR 0007: every parent-brand character except Sinal).
- **q67 A.** The names are Balão and Chaves.

The keyboard Chaves types at is not in the package (the prototype drew a "laptop deck" by hand), so it comes in as a prop piece.

## What changes

- **`balao`**, a new cast piece (ASCII id for Balão): the shared parameters of the cast (`x`, `y` the centre of the ground line, `scale` 0.25 to 4, `surface`, `expression` `idle`, `done`, `waiting`, `failed`, `view` `front`, `back`), plus `facing` (`right`, the default, or `left`: the side the tail points to, the listener's side), and two actions: `speaks` (the request line lit in the accent) and `holdsStamp: { word }` (the `stamp` piece in the front hand, with the caller's word). The hood tip on top. One action at a time; no stamp from behind.
- **`chaves`**, a new cast piece (ASCII id for Chaves): the same shared parameters and `facing`, and three actions: `types` (the `keyboard` piece under the front hand), `points` (the front hand points up and forward, Visor's pointing hand) and `holdsSheet` (hands a sheet over: Visor's held-sheet object, held out in the front hand). The hood tip on top; a reinforced brace silhouette with sharp points and a waist. One action at a time; no keyboard or sheet from behind.
- **`keyboard`**, a new prop piece: the laptop's base, a white slab with key marks, carrying its own outline on both surfaces. Chaves draws it when typing; a cover can draw it alone, under a `codePanel` as the screen.
- **Shared skin and grammar** (ADR 0006, ADR 0009): white bodies, the cast's outline, visor and eyes from `skin(surface)`, the one accent on the request line and the cursor; no colour parameter; state only on the screen face; state colours only where they mean a state (the stamp's face, a held sheet's tail check).
- **Fit with the cast rules** (motion CAST-2 to CAST-5): every action defaults to off; the ground point and `scale` work as for the five cast pieces, so `pose` and the timing helpers of `src/brand/cast-motion.ts` apply unchanged; the README gives each character's emote spot beside the head.
- **ADR 0007 amended**: the two supporting characters, with the role mapping requester/approver → Balão, developer → Chaves, the AI agent still Visor.
- **README**: the cast becomes a table (character, piece, role, actions, hood tip, emote spot); "Illustration pieces and covers" counts 67 pieces; "Upgrading to 0.13.0".
- **The model sheet in `docs/`** (art-direction SHEET-1), rendered from the built pieces: front and back, the four expressions, every action both ways, both surfaces, size against the cast on one ground line, and the 48 px and 24 px row.
- **Backwards compatible.** Every existing call, spec and scene draws the same: the five cast pieces stay pinned by `test/fixtures/cast-0.11.0.json`, and every other fixture and golden stays byte-identical. Nothing is removed or renamed; `PIECE_NAMES` grows from 64 to 67, the three new names last.
- **Release:** one minor, 0.13.0, from a `feat:` pull request title; release-please sets the version (Model 2).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `illustration-pieces`: the `balao`, `chaves` and `keyboard` pieces and their parameters; the catalogue grows to 67 pieces; the words they may draw; the v2 palette and state colours over them; the cast-piece schema scenario narrowed to the five pillar pieces; the outputs of every existing piece pinned.
- `cover-cli`: a spec accepts the three pieces like any other, with their problems at their JSON paths; the unknown-piece messages ("Cover spec format", "Emote on a cover") list 67 names, the last `keyboard`.

`design-tokens`, `motion-components`, `scene-catalogue` and `scene-rendering` do not change: no token, helper or scene is added or altered.

## Out of scope

- Scene 1 of AB#144 itself and its storyboard update (its own change after 0.13.0, with gate 0 again for the new cast).
- A side view: the cast has front and back only since the identity studio's round 7b.
- The screen of the laptop as part of `types` (G1 question 2): the screen is a `codePanel` the caller places.
- A `holdsSheet` for Balão (the sheet's "answer" frame): the scene puts a sheet beside its front hand; a pointing hand for Balão (the sheet's "ask" frame); temperaments and walking `stride`.
- An exported helper that places an emote beside any character's head (G1 question 6): the README gives the spot.
- New emotes, expressions, tokens or colours; any change to the five cast pieces, to `stamp`, `sheet`, `pill` or `codePanel`.
- A role for the architect, or data that acts (still unresolved in ADR 0007).
- The approved concept sheet itself in this repository: it is exploration (art-direction DIV-2) and stays in the vault; the repository gets a model sheet drawn from the built pieces.
- The kit's skills (motion CAST-1 and CAST-6 list the cast; illustration pins the package version): a kit change after the release.

## Studio decisions (owner, 2026-11-12)

q65 A (concept C, the notation; reinforce Chaves at 24 px), q66 A (both wear the hood tip), q67 A (Balão and Chaves). Piece ids are ASCII: `balao` and `chaves`; the prop is `keyboard`.

## Questions for gate 1

Each with the recommended answer; the spec is written as recommended.

1. **Stamp API.** `holdsStamp: { word }`, the word from the caller (recommended: every word of a piece comes from the caller, "Words come from the caller"), or `approves: true` with a fixed `GO` (breaks that rule)?
2. **Typing.** `types: true` draws only the keyboard under the front hand and the scene places a `codePanel` as the screen (recommended: the screen's lines are scene data, and the same panel stands alone when Chaves points), or `types: { lines }` drawing a whole laptop?
3. **Chaves's silhouette.** Sharp brace points 36 units outside the corners and a waist notch (recommended, design §3, confirmed on the 24 px row at gate 3), braces drawn as two ink strokes beside a rounded body, or curled brace ends?
4. **Back views.** Not on the approved sheet. Each back view draws the same body with no face, no request line or cursor, and the hood tip's back (recommended: the cast's shared `view` parameter), or front-only pieces?
5. **Speaking while stamping.** Refused, one action at a time (recommended: the sheet's approval frame shows the line unlit), or allowed?
6. **Emotes beside the head.** Documented emote spots in the README (recommended), or a helper exported for all seven characters now?
7. **The prop's name.** `keyboard` (recommended: what it draws), or `laptop` / `laptopBase`?
8. **Changelog.** Three lines through `BEGIN_COMMIT_OVERRIDE` (recommended), or one line from the squash title?

## Implicit requirements

- **Errors and invalid input:** requirement. Each new parameter is checked by its piece's schema and throws a `RangeError` naming its path (`facing`, `holdsStamp.word`, `holdsSheet.rows`, `width`, …); two actions together and a prop seen from behind are refused with a fixed message and path, after the schema's problems; a cover spec reports each problem at its JSON path.
- **Scenarios without a failure case:** "Supporting cast follows the cast rules" and "Existing outputs unchanged by the supporting cast" take no input of their own; their invalid inputs are the parameter requirements'.
- **Limits:** requirement. `scale` 0.25 to 4; a held sheet as Visor's (`width` 80 to 300, `height` 80 to 400, 1 to 8 rows); `keyboard.width` 80 to 300.
- **Repetition and idempotency:** requirement. Pieces stay pure: the same parameters give deep-equal trees and the same `toSvg` bytes; existing outputs are pinned.
- **Concurrency:** n/a. Pure functions.
- **Security:** n/a beyond today's rules. No new dependency; the stamp word and the sheet label are caller strings escaped by `toSvg`; the pieces hold no link, style or script.
- **Logs and observability:** n/a. Pieces print nothing.

STY-8: no piece in this change writes a `title` or `desc`; the only words are the caller's stamp word and sheet label and the sheet's `?`. The model sheet SVG in `docs/` carries an English `<title>` and `<desc>`, as one-file images do.

## Changelog

The squash title is what release-please reads: `feat: supporting characters Balão (requester) and Chaves (developer) (AB#337)`. For one line per piece (recommended, G1 question 8), the pull request description ends with:

```
BEGIN_COMMIT_OVERRIDE
feat: `balao`, the requester and approver: speaks, holds a stamp, faces left or right (AB#337)
feat: `chaves`, the developer: types, points, hands a sheet over, faces left or right (AB#337)
feat: `keyboard` prop piece, the laptop's base (AB#337)
END_COMMIT_OVERRIDE
```

## Documentation

- `README.md`: "The cast and the emotes" as a table of the seven characters (Mira, Visor, Drone, Kiu, Sinal, Balão, Chaves) with piece, role, actions, hood tip and emote spot, plus the `keyboard` prop; "Illustration pieces and covers" (67 pieces); "Upgrading to 0.13.0" (added names; nothing removed or renamed; every 0.12.0 call unchanged).
- `docs/adr/0007-mira-and-the-pillar-cast.md`: the amendment of 2026-11-12 (design §6), and its row in `docs/adr/README.md`.
- `docs/roadmap.md`: row 13f `supporting-characters`, AB#337.
- The model sheet in `docs/spikes/<date>-supporting-characters/` (SHEET-1), with its script and a README naming the commands.
- Vault, after the merge: the project's `architecture.md`, `roadmap.md` and `changelog.md`.
- No new ADR: ADR 0007 itself foresees the new roles; it is amended, not superseded.

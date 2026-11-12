# Design: supporting-characters

See `proposal.md` for the why. The drawings come from the approved concept C sheet and its prototype (`~/.hermes/cache/scratch/ab337-characters/chars.ts`, functions `balao` and `chaves`; observed) and from the code at `655525d` (0.12.0; observed). What is new or assumed is marked. Coordinates are a character's local units at `scale` 1, facing right: the ground line is y 0, up is negative, the centre of the ground line is (0, 0), as in `src/pieces/brand-cast.ts`.

## 1. Where the pieces live, and what they share

| Option | Fit | Risk to the pinned cast |
|---|---|---|
| A. Add Balão and Chaves to `brand-cast.ts` | one file for the cast | every edit sits next to the five pinned drawings |
| B. A new module, `src/pieces/supporting-cast.ts` (chosen) | the supporting cast apart from the pillar cast, as ADR 0007 tells them apart | low: it imports `faceAt`, `peak`, `CAST_EXPRESSIONS`, `CAST_VIEWS` and the skin; the one edit in `brand-cast.ts` is the held sheet taking a position (below), pinned by §7 |
| C. A generic "glyph character" piece with a `glyph` parameter | one piece for both | two different bodies, actions and relations behind one schema; an enum of two |

`keyboard` lives in a new `src/pieces/keyboard.ts`, a prop module beside `paper.ts` (which holds `sheet` and `pill`). All three join `PIECES` last, in the order `balao`, `chaves`, `keyboard`, so every existing name keeps its place in `PIECE_NAMES` and in the cover command's messages.

**Import cycle (observed).** Balão draws `stamp`, defined in `src/pieces/library.ts`, and `library.ts` must import `supporting-cast.ts` to list Balão in `PIECES`: an ES module cycle in which `PIECES` can be built before `balao` exists. 0.12.0 met the same cycle for Visor's sheet and moved `pill` and `sheet` unchanged to `paper.ts` (its header says so). So `stamp` (with `StampParams`) moves unchanged to `src/pieces/stamp.ts`; `library.ts` imports and re-exports it and keeps it at its place in `PIECES`; the `pieces-*` fixtures and the cover goldens prove it draws the same. `supporting-cast.ts` imports `stamp.ts`, `keyboard.ts`, `paper.ts` and `brand-cast.ts`, never `library.ts`.

**Exported names (new).** From the root entry and `library.ts`: `balao`, `chaves`, `keyboard`; the types `BalaoParams`, `ChavesParams`, `KeyboardParams` and `HeldSheet` (the held-sheet object; `VisorHeldSheet` stays as its alias); `CAST_FACINGS` (`right`, `left`) and `CastFacing`, which `balao` and `chaves` use (`VISOR_FACINGS` and `VisorFacing` stay, same values).

Shared with the cast, unchanged: the skin (`skin(surface)`: body `color.white`, outline `brand.light.text` / `brand.dark.textMuted`, visor `brand.light.text` / `brand.dark.bg`, eyes `cast.eyes`, accent `brand.<theme>.accent`; ADR 0006 and 0009), `outlined(s, width)`, the screen face `faceAt(x, y, w, h, s, expression)` (symmetric in all four expressions, so mirroring changes no meaning), the hood tip `peak(s, cx, top, w, dip)`, Mira's legs (two strokes of width 8 with round caps and two foot pills 20 × 7, radius 3.5, filled with the outline), Visor's hands (circles of radius 15, `outlined(s)`) and Visor's pointing hand (a finger `rect` −6, −30, 12 × 26, radius 6, `outlined(s, 4.5)`, and the palm circle, in one group with `translate` and `rotate`).

The held sheet reuses Visor's: its schema (`width` 80 to 300, `height` 80 to 400, 1 to 8 rows, `top`, `step`, `label`) and its drawing (the `sheet` and `pill` pieces in one `data-held` `sheet` group with the skin's outline at `outline.block`, the marks group stroked `color.ink`, the words in the text group). Visor's private `heldSheet(held, s, facing)` becomes a shared function that takes the page's position; Visor calls it with its own position, so its trees do not change (proved by the 0.12.0 scenarios of "Visor holds a sheet" and by the frozen cast).

Every piece's tree has Visor's shape: the root `g` with `data-piece` `<name>`, `transform` `translate(x y) scale(s)` and `stroke` `none`; its children are the held prop's group (if any: `data-held` `stamp`, `sheet` or `keyboard`, so a selector of `[data-piece]` counts one piece per character), then the body group, which carries `transform` `scale(-1,1)` facing left and no attribute facing right; the words, if any, in one text `g` with the root's `transform`, `font-family` `font.sans`, `font-size` `cover.labelSize`, `font-weight` `cover.labelWeight`, `fill` `color.ink` and `text-anchor` `middle`. A held prop sits outside the mirrored group at the mirrored position, so its words and marks are never mirrored.

## 2. Balão

| Part | Drawing (facing right) |
|---|---|
| Legs | path `M-20 -62 L-28 0 M20 -62 L28 0`, feet at x −38 and 18, y −6 |
| Body | path `M-62 -132 Q-62 -162 -32 -162 H32 Q62 -162 62 -132 V-104 L94 -76 L56 -70 Q48 -60 32 -60 H-32 Q-62 -60 -62 -88 Z`, `outlined(s)`: the rounded balloon with its tail low on the front side, pointing out and down at (94, −76), never between the legs |
| Face | `faceAt(-38, -146, 76, 40, s, expression)` |
| Request line | `rect` (−30, −88), 60 × 9, radius 4.5; `illustration.textBar` at rest, the skin's accent with `speaks: true` |
| Hood tip | `peak(s, 0, -162, 28, 24)` |
| Hands | back (−86, −100), front (92, −132); with `holdsStamp`, front (132, −100), over the stamp's top edge (new: the prototype pressed the stamp on a sheet at (166, −58); held without a sheet, it moves in beside the tail) |
| Held stamp | `stamp({ cx: 132, cy: -70, r: 24, word })` (the piece's default fill `color.state.healthy` and rotation −12) in a `data-held` `stamp` group with the skin's outline at `outline.block`, round joins; facing left at `cx` −132 |
| Back view | legs, body, the hood tip's back (`M-28 -162 Q0 -170 28 -162 Q0 -154 -28 -162 Z`, accent, outline 5, as Visor's back), the hands at rest; no face, no request line |

Draw order: legs, body, face, request line, hood tip, back hand, front hand. The tail is the signature part: `facing` puts it, and the front hand, on the listener's side, in both views (from behind the tail still points at whom Balão talks to). The request line is a bar, not a word: Balão draws no word of its own ("Words come from the caller").

## 3. Chaves, and a silhouette that reads at 24 px

The concept sheet's body bowed softly to two rounded points 30 units outside its corners (`chars.ts`, `chaves`, x ±80 against ±50): at 24 px tall the corners and points blur into a pillow (the sheet's own reading, "the weakest silhouette of the pair").

| Option | At 24 px | Cost |
|---|---|---|
| A. Sharp points and a waist (chosen) | a brace's outline: a bulge at each corner, a notch, a sharp point at mid height, a notch, a bulge | one path; the body stays one outlined shape, as every cast body |
| B. Two ink braces beside a rounded white body | reads as `{ }` around a box, but the box is Visor's | a second shape vocabulary (open strokes as limbs) |
| C. Curled brace ends above and below the body | adds detail that vanishes at 24 px | longer path, no gain at small size |

The chosen contour (new; confirmed on the 24 px row of the model sheet at gate 3): the points reach x ±90 at y −88, 36 units outside the corners (±54) and 46 outside the waist (±44); each point is a corner where two curves meet at about 30°.

| Part | Drawing (facing right) |
|---|---|
| Legs | path `M-16 -30 L-26 0 M16 -30 L26 0`, feet at x −36 and 16, y −6 (new: hips at −30, not the prototype's −34, to meet the new body's bottom at −26) |
| Body | path `M-30 -150 H30 Q54 -150 54 -128 Q54 -112 44 -108 Q60 -96 90 -88 Q60 -80 44 -68 Q54 -64 54 -48 Q54 -26 30 -26 H-30 Q-54 -26 -54 -48 Q-54 -64 -44 -68 Q-60 -80 -90 -88 Q-60 -96 -44 -108 Q-54 -112 -54 -128 Q-54 -150 -30 -150 Z`, `outlined(s)` |
| Face | `faceAt(-34, -136, 68, 38, s, expression)` (new: 8 higher than the prototype's −128, as the body's top moved from −146 to −150) |
| Cursor | `rect` (−9, −80), 18 × 8, radius 2, the skin's accent (new: 8 higher than −72, under the face and above the lower waist notch) |
| Hood tip | `peak(s, 0, -150, 28, 24)` (new: on the new top edge, −150) |
| Hands | back (−100, −50), front (100, −50); typing, front (120, −80), over the keyboard's top edge; holding a sheet, front (112, −92), over the page's edge; pointing, Visor's pointing hand at `translate(104,-128) rotate(55)`, reaching up and forward |
| Keyboard | `keyboard({ x: 98, y: -74, width: 150, surface })` in a `g` with `data-held` `keyboard`; facing left at x −248 |
| Held sheet | (new: the prototype's page edge was 112, under the hand's centre) page at x 118 and y −40 − `height` (its near edge under the front hand, its bottom 40 above the ground); label pill centred on the top edge; facing left at x −118 − `width` |
| Back view | legs, body, the hood tip's back (`M-28 -150 Q0 -158 28 -150 Q0 -142 -28 -150 Z`), the hands at rest or pointing; no face, no cursor |

The held page's near edge at 118 puts the front hand (x 112, radius 15, outline 8, so 19 with its outline) 13 units over the page, and 2.5 units clear of a row's lead mark (which starts 15.5 inside the edge with its outline), as Visor's hand is at its edge of 98. The page's bottom at −40 keeps the hand's y (−92) inside the smallest page (−120 to −40).

## 4. The keyboard

`keyboard({ x, y, width, surface })`: the top-left corner at (`x`, `y`), `width` 80 to 300 (default 150), 16 high. One `g` with `data-piece` `keyboard`: a `rect` with radius 6, filled `color.white`, stroked ink on light and `surface.dark.muted` on dark at `outline.block`, round joins; then a `g` with `stroke` `none` holding `n = floor((width − 44) / 21) + 1` key marks, `rect` at (`x` + 16 + 21·i, `y` + 6), 12 × 4, radius 2, filled `color.ink` on both surfaces (marks over a white face stay ink, ADR 0009). The cover command wraps every body in an ink-stroked group (`src/pieces/cover.ts`, the outlined group), so a key with only a fill would take a 4-unit outline there; the `stroke: none` group keeps the keys as drawn alone, as `sheet` does for its bars. New against the prototype's deck: outline `outline.block` (4, the props' outline) instead of 5, and ink keys instead of the skin's outline colour, which on dark would put a muted mark on a white face. At 150 that is six keys (the prototype's deck), at 80 two, at 300 thirteen. It takes no colour and no text. The screen above it, when wanted, is a `codePanel` the caller places (G1 question 2).

## 5. Actions, defaults and relations

| Piece | Action | Default | Refused with |
|---|---|---|---|
| `balao` | `speaks` (boolean) | `false` | — (from behind it changes nothing, like `expression`) |
| `balao` | `holdsStamp` (`{ word }`, `word` a non-empty label) | none | `speaks: true` (one action at a time); `view: "back"` |
| `chaves` | `types` (boolean) | `false` | another action; `view: "back"` |
| `chaves` | `points` (boolean) | `false` | another action |
| `chaves` | `holdsSheet` (held-sheet object) | none | another action; `view: "back"` |
| both | `facing` (`right`, `left`) | `right` | — |

Every action is off by default, unlike Visor's `points` (default true) and Drone's `carries`: a frame where a supporting character does nothing is its call without actions, which keeps CAST-4's check ("every action parameter has the value it had in the frame before") simple. `false` and an absent parameter draw the same.

One input, one outcome (REQ-5): the schema's problems come first, as for every piece; then the relations, of which each piece returns at most one problem (the cover command prints every problem a piece's relations return, so returning one keeps a spec's report to one line per piece), the first that holds in this order:

1. Two actions: `balao` names `holdsStamp` ("Balão does one action at a time"); `chaves` names the second of `types`, `points`, `holdsSheet` that is on ("Chaves does one action at a time").
2. A prop from behind: `holdsStamp`, `types` or `holdsSheet` with `view: "back"` ("Balão holds a stamp only in the front view", "Chaves types only in the front view", "Chaves holds a sheet only in the front view").

Rejected: drawing the second action anyway, or the prop's front from behind: both put two hands on one arm or a prop no sheet designed.

## 6. The amendment of ADR 0007

Appended to `docs/adr/0007-mira-and-the-pillar-cast.md`, with a status line "Amended 2026-11-12 (AB#337): the supporting characters Balão and Chaves" and the index row in `docs/adr/README.md`:

> ## Amended, 2026-11-12 (card 337): the supporting characters
>
> The first scene to need the human developer and the person who asks for a change (the SDD scene, AB#144) could not tell who talks to whom with the pillar cast and a loose speech balloon. As this ADR foresaw, the roles with no honest match are created when a scene needs them, each with its model sheet. The owner chose concept C, "the notation" (identity studio, 2026-11-12, q65 to q67): each human role is a glyph of its trade, on Mira's legs; no character is a human (brand strategy, E5).
>
> | Character | Piece | Role | Signature part |
> |---|---|---|---|
> | Balão | `balao` | the requester and approver: whoever asks for the change and approves it | a speech balloon whose tail points at the listener; the request line on its belly, lit in the accent while it speaks |
> | Chaves | `chaves` | the developer: the human on the team who works with Visor and runs the commands | a `{ }` body with sharp brace points and the cursor in the accent |
>
> Both are supporting characters, not pillar characters: they never lead a piece about a pillar. Both wear the parent-brand hood tip, as every parent-brand character except Sinal, and share the one skin.
>
> The per-role mapping changes in two rows: **Dev** → Chaves; **Requester/caller** → Balão when the requester acts (asks, answers, approves); `color.state.caller` stays the state colour of the caller on message and flow elements. **AI agent** stays Visor; **Architect** and **Data** as an actor stay unresolved.

## 7. Proving existing outputs unchanged

The five cast pieces are pinned by `test/fixtures/cast-0.11.0.json` (138 calls, "Cast calls of 0.11.0 unchanged"); Visor's 0.12.0 additions by the exact trees of "Visor holds a sheet", "Held sheet parameters", "Visor faces left or right" and "Mirrored Visor keeps its outline and words"; every other piece by `pieces-0.2.0`, `pieces-0.5.0`, `pieces-0.8.0`, `emote-0.7.0`, `message-arrow-0.3.1`, `ui-icons-0.3.0` and the cover goldens. They stay green and byte-identical with no fixture rewritten. No new fixture: the new pieces' scenarios pin their trees.

## 8. The model sheet in `docs/`

The concept sheet is exploration and stays in the vault (art-direction DIV-2). The repository gets the model sheet the change makes true (SHEET-1), drawn by a script from `src/pieces/` only: `docs/spikes/2026-11-12-supporting-characters/model-sheet.ts` writes `model-sheet.svg` (fonts embedded, `<title>` and `<desc>` in English, STY-8) and PNG panels through Chrome and `<img>` (never `rsvg-convert`, ADR 0008), each under 200 KB: per character the front and back on light and dark, the silhouette, the four expressions, every action facing right and left, an emote at its spot; the seven characters on one ground line at one scale on light and dark (CAST-5); the row at 48 px and 24 px tall. The side view of SHEET-1 does not exist in this cast (front and back since the identity studio's round 7b).

Emote spots (new, for the README and the sheet), where the approved sheet puts them: on the front side, above and beside the head (its "waiting + doubt" and "failed + problem" panels). In local units facing right, the emote's centre is (116, −200) for both, at `scale` equal to the character's: an emote is about 80 units across at scale 1 (radius 40, observed in `emote.ts`'s `doubt` and `worked`), beside a head about 124 (Balão) and 108 (Chaves) wide, "about the head's size" (CAST-3). It clears the body, the hood tip, the front hand at rest and the pointing hand, and Balão's held stamp. In a scene the centre is (`x` + 116·`scale`, `y` − 200·`scale`), with −116 facing left. A sheet Chaves holds that is taller than 120 reaches under the spot; a scene that shows an emote then moves it or the sheet, on its stills (CAST-3). The sheet drew its emotes smaller than the head; G1 question 6 asks which size wins. The five pillar characters get no documented spot in this change.

## Risks / trade-offs

- [The reinforced brace may still read soft at 24 px] → the path is one table row (§3); the owner sees the 24 px row at gate 3 before the pull request leaves draft, and a change there changes the path and its scenario in the same commit.
- [Back views were not on the approved sheet] → G1 question 4; they reuse the cast's back rule (no face, the tip's back).
- [Emote spots are a documented convention, not a checked helper] → G1 question 6; a scene that misplaces one is caught on its stills (CAST-3).

## Migration

None. Every 0.12.0 call, spec and scene draws the same; consumers adopt the new pieces when they need them (DES-3). The public surface grows only: `PieceName` and `PIECE_NAMES` gain `balao`, `chaves` and `keyboard` (a consumer that switches exhaustively over `PieceName` adds the cases; neither consumer does: brunosouzas.com imports only `tokens`, stackledger imports named pieces, `coverTree`, `toSvg`, `validateCoverSpec` and the tokens, as recorded in `sdd-scene-pieces` design §Migration), and the root entry gains the three pieces and their parameter types. Roll back: a patch release reverting the change; nothing persisted depends on it.

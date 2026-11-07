# stackledger's product layer (card 303)

## Problem

stackledger has its own identity on top of the design system (brand strategy E7: a product gains its name, a wordmark, one accent that is not a semantic colour, and its character). Moving it to 0.8.0 showed three gaps the package must close, because the design system owns every colour and piece and a spec cannot carry a colour literal:

1. **No product accent.** stackledger's accent (`#000f9f` / `#9da8ff`) lives as a literal in its CSS. Against the 0.8.0 text colour it is 1.4:1, so a hovered link barely changes. Its home banner cannot draw a line in the product's colour, because `pipe` accepts only token paths in a spec.
2. **City backdrop still v1.** `surface.*.backdropWater`, `backdropWaterEdge`, `backdropPark` and `backdropCredit` kept their v1 blues through 0.7.0 and 0.8.0, and now sit on the warm cream and near-black surfaces. The dark river (`#1E3175`) reads as a navy patch.
3. **`ledgerMark` is an ink square.** At banner size it is a heavy black block; the v2 grammar (ADR 0009) draws a white body with one outline.

The owner chose each fix from renders (AB#303, Q3, Q5b, Q6).

## What changes

- **Product accent at the semantic layer** (ADR 0006: "a product's own accent is a new value at the semantic layer"): `brand.light.stackledgerAccent` `#3B5BDB` and `brand.dark.stackledgerAccent` `#7D8CFF`, the blue line of the approved stackledger sample (phase 4, A7). CSS: `--ds-brand-light-stackledger-accent`, `--ds-brand-dark-stackledger-accent`. Usable as a colour token path in any spec. A test keeps each at 4.5:1 or more on `site.<theme>.body` and `site.<theme>.light`.
- **Backdrop retuned to v2 neutrals:**
  - light: water `#C7DAEA`, water edge `#A9C4DA`, park `#D6E4CF`, credit `#5C5852` (= `brand.light.textMuted`);
  - dark: water `#1C2733`, water edge `#2A3846`, park `#1A241D`, credit `#ADA79D` (= `brand.dark.textMuted`).
- **`ledgerMark` "Folha":** the square becomes a white page with one outline, 1.25 units wide inside the 32 box: ink on light, `surface.dark.muted` on dark. The 2-unit dark band goes away. The line, its colour parameter and the two stations stay.
- ADR 0006 amended (the product accent and the backdrop values); README (`ledgerMark`, backdrop, the brand roles); version 0.8.1.

## Out of scope

- Any change in stackledger itself (its own change, after this release).
- An accent for any other product (the kit has the parent brand until it opens, E7).
- Other `surface.*` values, `map.*`, or any other piece.
- The `sinal` character, already shipped.

## Implicit requirements

- **Errors and invalid input:** a missing, extra or wrongly typed brand role fails the token build naming the path, as today.
- **Limits:** contrast floor 4.5:1 for the accent on the page and card backgrounds, tested.
- **Repetition and idempotency:** `npm run tokens` stays deterministic; `tokens:check` fails on stale output.
- **Concurrency:** n/a, a build-time library.
- **Security:** n/a, no input from outside the repository.
- **Logs and observability:** n/a, the token build already names failing paths.

## Compatibility

Nothing is removed or renamed: every 0.8.0 spec and call still builds. What a consumer sees: images and pages that use the backdrop tokens or `ledgerMark` change appearance on rebuild (only stackledger uses either), and `brand.*` gains one role per theme (a consumer that checks the exact list of brand roles must add it).

## Documentation

- `docs/adr/0006-three-layer-tokens-and-brand-colour.md`: amendment "a product's own layer" and the backdrop values.
- `README.md`: `ledgerMark` description, the backdrop line, the brand roles, and "Upgrading to 0.8.1" (a table: `brand.<theme>.stackledgerAccent` added; the eight backdrop values old → new; `ledgerMark` ink square → white page with one outline).
- Code comments the change makes false: the `ledgerMark` comment in `src/pieces/metro.ts`, the headers of `scripts/freeze-pieces.ts` and `test/pieces/frozen.test.ts`.
- Brain vault (after merge): the project's changelog and roadmap, in the AB#303 note.

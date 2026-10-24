# Proposal: cast-dark-surface

## Why

The cast (`mascot`, `emote`, 0.5.0, AB#152) draws for the light page only. On the dark surface (`surface.dark.background`) the hard shadow is ink and disappears, the `cast.ground` ellipse becomes a light patch, and the ink arms, legs and outlines merge with the navy (contact sheet of AB#152, dark band; AB#187). The metro and diagram pieces already solve this with `surface` (ADR 0003, amendment AB#157): shadow in `surface.dark.shadow`, a light rim round the ink outline.

## What Changes

- `mascot` and `emote` gain `surface` (`light` default, `dark`), the same enum as the metro pieces.
- On `dark`: every hard shadow takes `surface.dark.shadow`; the mascot's ground takes `surface.dark.grid`; a light rim (`surface.dark.rim`) lines the whole outline, arms, legs and props included; faces are unchanged (Bruno's gate-1 answers, 2026-10-24).
- Without `surface`, or with `light`, every call draws the 0.5.0 bytes (`cast-0.5.0.json` unchanged).
- The dark look is frozen in a new hash fixture, `test/fixtures/cast-dark-0.5.2.json` (73 calls).
- Release: patch 0.5.2 (additive parameter).

## Capabilities

### Modified Capabilities

- `illustration-pieces`: `surface` on `mascot` and `emote`, the dark drawing, its frozen fixture.

## Out of scope

- New tokens: the dark drawing uses only `surface.dark.*`.
- The idea emote's glow (`color.transitional` at 0.35 opacity) reads darker on navy; it stays as is and gets no rim.
- Scenes and the cover command: a cover spec checks each piece with its own schema, so `surface` reaches cover specs with no cover-cli change.
- brunosouzas.com, stackledger and the vault: consumers adopt after the release.

## Implicit requirements

- **Errors and invalid input:** requirement. `surface` outside the enum is rejected by name.
- **Limits:** n/a. No new number or array.
- **Repetition and idempotency:** the existing "Pure pieces" requirement holds.
- **Concurrency:** n/a. Pure functions.
- **Security:** n/a. No new string reaches an attribute.

# Tasks

Requested by stackledger (`~/.hermes/spikes/design-system/stackledger-0.3.1-prompt.md`, AB#170). Gate 1 with the owner, then tests before code; Codex reviews, Claude implements. Test level: **unit** (vitest). Existing tests stay unchanged except the ones named below.

## 1. Token (`design-tokens`)

- [ ] 1.1 Tests first in `test/tokens/metro.test.ts`: "Map token with the wrong type" gains the `map.bendRadius` case; "Measured map values" checks twenty values, `tokens.json` and `--ds-map-bend-radius: 32px;`; new "Missing bend radius" and "Described bend radius". Then the token in `tokens/source.json` (design §1), the token validator's map list, and `npm run tokens`. Check: `npm run tokens:check` exits 0 and the three tests pass.

## 2. Current colour (`illustration-pieces`)

- [ ] 2.0 Before any code: a one-off script on `origin/main` writes `test/fixtures/ui-icons-0.3.0.json` (design §2), committed alone. Test "Frozen 0.3.0 icon calls" in `test/pieces/frozen.test.ts`. Check: it passes on that commit.
- [ ] 2.1 Tests first in `test/pieces/icons.test.ts`: "Unknown icon or a hex colour" gains `currentcolor`, `inherit` and ` currentColor`; new "Current colour" and "Current colour on every icon" (`toSvg` and `toReact`). In `test/pieces/catalogue.test.ts` (or where "Hex passed as a colour" lives): new "Current colour elsewhere". Then the `currentColor` option of the `color` kind in `src/pieces/params.ts` and its use in `src/pieces/ui-icons.ts` (design §2). Check: those tests pass and "Default sun", "The seven names", "Frozen 0.2.0 calls" and "Frozen 0.3.0 icon calls" pass unchanged.

## 3. Cover spec (`cover-cli`)

- [ ] 3.1 Tests first in `test/scripts/cover.test.ts`: "Current colour in a cover", "Current colour on another piece" and "Token colour in a cover". Then the check in `src/pieces/cover.ts` (design §2). Check: both pass and the proof cover goldens stay byte-identical.

## 4. Version and documentation

- [ ] 4.1 `npm version 0.3.1 --no-git-tag-version`. Check: `package.json` and the root of `package-lock.json` both say `0.3.1`. Tag and publication are the owner's (`docs/release.md`).
- [ ] 4.2 README (map tokens, `uiIcon` with `currentColor` and the inline note of design §3) and `docs/roadmap.md` (AB#170 row). Vault notes on the vault's `main` after the pull request is ready. Check: `npm run typecheck && npm run tokens:check && npm run build && npm test` exits 0.

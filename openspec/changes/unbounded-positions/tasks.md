# Tasks

Requested by the stackledger session (AB#164). Gate 1 with the owner, then implementation; Codex reviews, Claude implements. Test levels: **unit** (vitest). Existing tests stay unchanged, except the two that expected the old position bound (`pill` `x: 1e307` and `arcArrow` `from: [10001, 0]` in `test/pieces/catalogue.test.ts`), which move to the new scenarios.

## 1. Limits (`illustration-pieces`)

- [ ] 1.1 `pos()` without bounds and `point` checking only for finite numbers, in `src/pieces/params.ts`. Unit tests in `test/pieces/positions.test.ts`: "Far map position", "Far interchange and arrow", "Not finite" (non-finite numbers and non-numbers, scalar and point), "Far rings centre".
- [ ] 1.4 In `src/pieces/cover.ts`, keep `rings.cx` and `rings.cy` within ±10000 and report an overflow at `pieces[<i>]` (design §4). Integration tests in `test/scripts/cover.test.ts`: "Rings centre out of range in a spec", "Far piece in a spec", "Overflowing arrow in a spec".
- [ ] 1.2 Overflow check in `src/pieces/piece.ts` (design §2). Unit tests in `test/pieces/positions.test.ts`: "Distance overflows", "Large but finite".
- [ ] 1.3 The modified requirement's scenarios keep passing in `test/pieces/catalogue.test.ts`: "Missing and unknown parameters", "Out of range", "Sizes that would break the drawing", "Smallest and largest accepted sizes draw valid geometry", "Too many repeated parts" (now without `arcArrow`), "Road path with something else". "Pipe path with something else" in `test/pieces/metro.test.ts` keeps passing too. The three proof cover goldens stay byte-identical. Check: `npm run typecheck && npm run tokens:check && npm run build && npm test` exits 0.

## 2. Version

- [ ] 2.1 `npm version 0.1.1 --no-git-tag-version` (`package.json` and `package-lock.json`). Check: `package.json` and the root of `package-lock.json` both say `0.1.1`. Tag and publication are the owner's, after the merge (`docs/release.md`).

## 3. Documentation

- [ ] 3.1 README (the limits), and `docs/roadmap.md` (the stackledger requests that do not block: placeholder subtitle; renewal ring, halo, licence marker, zones; UI icons). Vault notes after the pull request is ready.

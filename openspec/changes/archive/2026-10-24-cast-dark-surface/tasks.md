# Tasks: cast-dark-surface

## 1. Spec

- [x] 1.1 Spike, contact sheet and gate-1 answers (design §1–§2)
- [x] 1.2 Frozen dark fixture `test/fixtures/cast-dark-0.5.2.json` (design §4)

## 2. Code

- [x] 2.1 Scenario tests for `surface` on `mascot` and `emote`, failing on `main`
- [x] 2.2 Apply `spike.diff` (design §1) to `src/pieces/cast.ts`; tests pass
- [x] 2.3 Full check: `npm run typecheck && npm run tokens:check && npm run build && npm test`

## 3. Delivery

- [x] 3.1 README and `docs/roadmap.md`: `surface` on the cast
- [x] 3.2 Version 0.5.2, archive, `openspec validate --specs --strict`

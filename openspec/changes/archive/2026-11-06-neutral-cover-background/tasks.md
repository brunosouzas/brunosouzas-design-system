# Tasks: neutral cover background

- [x] 1.1 `tokens/source.json`: `coverBackground.neutral` (fill `#F6F3EC`, ring `#D8D6D0`); `test/fixtures/cover-backgrounds.json` gains the same pair. Proves "Neutral background equals the brand background" (`test/tokens/illustration.test.ts`).
- [x] 1.2 `npm run tokens`; the cover command accepts `background: "neutral"`. Proves "Neutral background accepted" (`test/scripts/cover.test.ts`).
- [x] 1.3 README: the `background` field.
- [x] 1.4 `npm version 0.6.1 --no-git-tag-version`.
- [x] 1.5 Spec delta for design-tokens "Measured cover backgrounds" (25 names); proved by "Source matches the measured table" (`test/tokens/illustration.test.ts`, 25 entries).
- [x] 1.6 After brunosouzas-design-system#23 merges: rebase on `main` (in `test/scripts/cover.test.ts` keep both sides: both branches add tests after `describe("Cover spec format"`), tick this task, then `openspec archive 2026-11-06-neutral-cover-background -y` in the same commit (CI's `openspec validate --archived` refuses an archived change with an open task), so the v0.6.1 tag carries the updated main specs.

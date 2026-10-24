# Tasks: backdrop-tokens

## 1. Code

- [x] 1.1 Unit tests in `test/tokens/metro.test.ts`, failing on `main`: "Surface entry without its backdrop water" (new), "Extra surface" (sepia with the thirteen tokens), "Measured surfaces" (the eight new values). "Surface entry without its shadow" and "Surface entry without its zone opacity" keep their existing tests there.
- [x] 1.2 Integration tests in `test/tokens/files.test.ts`, list `invalidSources` of "writes no file" (each checks an empty and an earlier output folder): add the four failure scenarios, "Surface entry without its shadow" (`remove("surface.dark.shadow")`), "Surface entry without its zone opacity" (`remove("surface.light.zoneOpacity")`), "Surface entry without its backdrop water" (`remove("surface.dark.backdropWater")`, failing on `main`) and "Extra surface" (`surface.sepia` with the thirteen tokens).
- [x] 1.3 Unit test "Backdrop tokens in the CSS" in `test/tokens/metro.test.ts`: the built `tokens.css` declares `--ds-surface-light-backdrop-water: #C9D8FF` and `--ds-surface-dark-backdrop-credit: #9AA6D6`; failing on `main`.
- [x] 1.4 `scripts/tokens.ts` required list and `tokens/source.json` values (design §1); regenerate `tokens/generated`; 1.1 to 1.3 pass.
- [x] 1.5 Full check: `npm run typecheck && npm run tokens:check && npm run build && npm test`

## 2. Delivery

- [x] 2.1 README (surface tokens line) and `docs/roadmap.md` (AB#180 delivered; the dashed arrow exists since 0.5.1)
- [x] 2.2 Version 0.5.3, archive, `openspec validate --specs --strict`
- [x] 2.3 Reply for the stackledger session at `~/.hermes/spikes/design-system/ab180-backdrop-tokens/reply-to-stackledger.md`; check: it names the eight paths exactly as in `tokens/generated/tokens.json`, the version in `package.json`, and `messageArrow({ dashed: true })` from 0.5.1
- [x] 2.4 Vault notes `roadmap.md`, `changelog.md`, `architecture.md` under `10-personal/projects/brunosouzas-design-system/`, on the vault's `main`; check: each names AB#180 and 0.5.3

# Tasks: backdrop-tokens

## 1. Code

- [ ] 1.1 Scenario tests in `test/tokens/metro.test.ts` ("Surface entry without its backdrop water", "Extra surface" with thirteen tokens, "Measured surfaces" with the eight values), failing on `main`
- [ ] 1.2 `scripts/tokens.ts` required list and `tokens/source.json` values (design §1); regenerate `tokens/generated`; tests pass
- [ ] 1.3 Full check: `npm run typecheck && npm run tokens:check && npm run build && npm test`

## 2. Delivery

- [ ] 2.1 README (surface tokens line) and `docs/roadmap.md` (AB#180 delivered, dashed arrow already present)
- [ ] 2.2 Version 0.5.3, archive, `openspec validate --specs --strict`
- [ ] 2.3 Reply for the stackledger session (rename to flat names, version, the existing dashed arrow)

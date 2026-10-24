# Tasks: backdrop-tokens

## 1. Code

- [ ] 1.1 Unit tests in `test/tokens/metro.test.ts`, failing on `main`: "Surface entry without its backdrop water" (new), "Extra surface" (sepia with the thirteen tokens), "Measured surfaces" (the eight new values). "Surface entry without its shadow" and "Surface entry without its zone opacity" keep their existing tests there.
- [ ] 1.2 Integration tests in `test/tokens/files.test.ts`, list `invalidSources` of "writes no file": add "Surface entry without its backdrop water" (`remove("surface.dark.backdropWater")`), which proves the no-write side of the four failure scenarios through the same validator path; failing on `main` (the build succeeds there).
- [ ] 1.3 Unit test "Backdrop tokens in the CSS" in `test/tokens/metro.test.ts`: the built `tokens.css` declares `--ds-surface-light-backdrop-water: #C9D8FF` and `--ds-surface-dark-backdrop-credit: #9AA6D6`; failing on `main`.
- [ ] 1.4 `scripts/tokens.ts` required list and `tokens/source.json` values (design §1); regenerate `tokens/generated`; 1.1 to 1.3 pass.
- [ ] 1.5 Full check: `npm run typecheck && npm run tokens:check && npm run build && npm test`

## 2. Delivery

- [ ] 2.1 README (surface tokens line) and `docs/roadmap.md` (AB#180 delivered; the dashed arrow exists since 0.5.1)
- [ ] 2.2 Version 0.5.3, archive, `openspec validate --specs --strict`
- [ ] 2.3 Reply for the stackledger session at `~/.hermes/spikes/design-system/ab180-backdrop-tokens/reply-to-stackledger.md` (flat names, version, the existing dashed arrow)

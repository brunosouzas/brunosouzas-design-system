# Tasks

At gate 1 the owner sees this spec, ADR 0005, the contact sheet (`~/.hermes/spikes/design-system/cast-and-emotes/contact-sheet.png`) and the frames sheet (`frames-sheet.png`), both outside the repository and built with the recommended answers of design §10. Implementation starts from the approved commit. Codex reviews and Claude implements.

Test levels: **unit** (vitest, pure functions), **integration** (vitest, commands with temporary folders), **local** (render and look; needs `rsvg-convert`, ffmpeg and the network for Lato, not in CI). Existing tests stay, except those that count token groups (fourteen to fifteen) and pieces (52 to 54).

## 0. Frozen look (committed with the spec)

- [x] 0.1 `test/fixtures/cast-0.5.0.json`, copied byte for byte from the spike port (`~/.hermes/spikes/design-system/cast-and-emotes/out/cast-0.5.0.json`, written by `fixture.mts`). Check: `shasum -a 256` gives design §9's hash. If decision 4 picks coral, rewrite it from the port (`PROBLEM_COLOUR=color.backend`) and update §9 before task 2.

## 1. Tokens (`design-tokens`)

- [ ] 1.1 Add `cast` to `GROUPS` and its 21 required tokens to `REQUIRED` in `scripts/tokens.ts`; add them to `tokens/source.json` as text (one token per line, `$description` as design §6) from `proposed-tokens.json`; run `npm run tokens`. Unit tests in `test/tokens/illustration.test.ts`: "Cast token missing", "Cast token with the wrong type", "Approved cast values". In the same file: "Source with an unknown group" (fifteen) and "New groups accepted" (with `cast.dev.fill`). "Source with an unknown group" in `test/tokens/validate.test.ts` and `test/tokens/files.test.ts`, "Source file missing or not an object" and "Token without a type" (`test/tokens/validate.test.ts`) keep passing. Check: `npm test -- test/tokens` and `npm run tokens:check` exit 0.

## 2. Pieces (`illustration-pieces`)

- [ ] 2.1 `src/pieces/cast.ts`: `mascot` and `emote` with their schemas and the `headTilt` relation, ported from the spike's `cast.mts` with `colour()` in place of the proposed-token lookup; register both in `PIECES` after `stateStart`; export `MascotParams` and `EmoteParams`. Unit tests in a new `test/pieces/cast.test.ts`: "Default dev", "Message at twice the size", "Unknown character and face", "Out of range", "Head tilt on the dev", "Parts at rest", "Head tilt", "Face only", "Hold puts the arms in front", "Prop switched off or not held", "Agent's glowing face", "No brows on a normal face", "Gaze", "Scaled check", "Idea without its burst", "Problem in failure red", "Unknown kind", "Scale out of range", "Inside the outlined group" (requirement "Cast pieces carry their own stroke").
- [ ] 2.2 Frozen look: in `test/pieces/cast.test.ts`, "Every call matches" over the 130 calls and "A changed drawing is caught" (the comparison names each differing call; the test feeds it one altered hash). Check: `npm test -- test/pieces/cast.test.ts`.
- [ ] 2.3 Piece count 52 to 54 in `test/pieces/catalogue.test.ts` ("Every piece draws with its defaults", with `mascot` and `emote` required parameters in its table), `test/package/package.test.ts`, and `scripts/pieces-sheet.ts` with a cell each ("Catalogue sheet", `test/scripts/pieces-sheet.test.ts`). Check: `npm test -- test/pieces test/package test/scripts/pieces-sheet.test.ts`.

## 3. Cover command (`cover-cli`)

- [ ] 3.1 Integration tests in `test/scripts/cover.test.ts`: "Mascot and emote drawn", "Head tilt on a dev in a spec", and "Unknown background and piece" (54). "Unsafe id", "Invalid JSON", "Unknown format" and "Ring count in a spec" (all in `test/scripts/cover.test.ts`) keep passing. Golden outputs stay byte-identical. Check: `npm test -- test/scripts`.

## 4. Timing helpers (`motion-components`)

- [ ] 4.1 `src/brand/cast-motion.ts` (design §7). Unit tests in a new `test/brand/cast-motion.test.ts`: "Emote pop", "Leave", "Squash after a landing", "Helper inputs checked", "Hop and blink bounds". "Real sources are clean" (`test/brand/no-colour-literals.test.ts`) covers the new file. Check: `npm test -- test/brand`.

## 5. Motion test (`scene-catalogue`)

- [ ] 5.1 `src/scenes/cast-motion-test/frames.ts` (`castMotionTestFrame`, design §8, ported from the spike's `motion-test.mts` on `cast-motion.ts`) and `src/scenes/cast-motion-test/CastMotionTest.tsx`; register `cast-motion-test` in a `cast` folder in `src/Root.tsx`, outside `scenes`. Unit tests in a new `test/scenes/cast-motion-test.test.ts`: "Registered outside the catalogue" (reads the composition list the root registers through an exported constant `castCompositions`), "Every frame matches", "A changed beat is caught" (comparison over a copy of the timeline with the idea at 63), "React path matches". Integration test in `test/scripts/cli.test.ts`: "Not a scene for the commands" (next to the existing unknown-scene case). "Real sources are clean" (`test/brand/no-colour-literals.test.ts`) covers the new folder. Check: `npm test -- test/scenes test/scripts test/brand`.
- [ ] 5.2 Local, two comparisons kept apart. (a) Port parity: for frames 20, 50, 75, 160, 260 and 280, `npx remotion still src/index.ts cast-motion-test out/stills/cast-f<N>.png --frame=<N>` against `rsvg-convert -w 1920` of the spike port's frame (`frames.mts`), PSNR ≥ 35 dB each (`ffmpeg -i a.png -i b.png -lavfi "[0]format=rgb24[a];[1]format=rgb24[b];[a][b]psnr" -f null -`). (b) The documented differences against the approved original (design §1: face highlights, red problem) are shown, not measured: a sheet of the six Remotion stills next to `~/.hermes/spikes/motion/cast-motion-test/out/stills/f<N>.png`. Then a master and web copy for the owner: `npx remotion render src/index.ts cast-motion-test out/master/cast-motion-test.mp4` and `npx remotion ffmpeg -y -i out/master/cast-motion-test.mp4 -c:v libx264 -crf 30 -pix_fmt yuv420p -movflags +faststart out/web/cast-motion-test.mp4`. Check: the PSNR lines, the sheet and the web copy in the pull request.

## 6. Documentation and release

- [ ] 6.1 ADR 0005 status `accepted`; amendment lines in ADR 0003 (caption default) and ADR 0004 (actions); `AGENTS.md` rules on captions and per-language text point to ADR 0005; README (cast, emotes and meanings, `cast` tokens, the Studio folder); `docs/roadmap.md` row 10 delivered. Check: `npm run typecheck && npm run tokens:check && npm run build && npm test` exits 0.
- [ ] 6.2 Version 0.5.0 with `npm version 0.5.0 --no-git-tag-version`, after reading `release.yml` and `docs/release.md` on `origin/main`. Check: `package.json` and `package-lock.json` show it.
- [ ] 6.3 Vault: `architecture.md`, `roadmap.md` and `changelog.md` in `10-personal/projects/brunosouzas-design-system/`, directly on the vault's `main`, before `openspec archive`.

# Proposal: cast-and-emotes

## Why

Every new video on the roadmap (AB#144 to AB#150) is language-neutral since 2026-10-23: told by characters, gestures and reaction symbols instead of words (owner's decision, brain note `brunosouzas-design-system/evidence/2026-10-23-elenco-e-emotes.md`). The cast and the emotes exist only in a spike outside the repository (`~/.hermes/spikes/motion/sdd-without-with-spec/`, `~/.hermes/spikes/motion/cast-motion-test/`), drawn with 30 colour literals and two different face drawings, so no scene can use them. The decision itself (neutral by default, caption optional, actions as claims) contradicts the caption default of ADR 0003 and is not recorded. Card AB#152; roadmap row 10.

## What Changes

- **ADR 0005** (`docs/adr/0005-neutral-videos-and-the-cast.md`): neutral videos by default, caption optional (amends ADR 0003), every action tied to an article line (extends ADR 0004), one fixed cast and emote vocabulary, 16:9 only with 4:5 on demand, storyboard before the spec.
- **`mascot`**, a new piece: one of seven characters (`dev`, `agent`, `architect`, `devops`, `data`, `request`, `message`) standing on a point, with a face (eight), an action (none or seven), a scale, a gaze, the agent's head tilt and the signature prop. Every part is a named group (`data-part`), so a scene can animate it. Geometry ported from the approved spike (design §2 to §4).
- **`emote`**, a new piece: one of eight reaction symbols with a fixed meaning (`idea`, `doubt`, `problem`, `worked`, `refused`, `pressure`, `liked`, `waiting`), placed beside a head (design §5).
- **Tokens:** a fifteenth group, `cast`: 18 colours (the characters' hues, ground, metal, mouth, glow) and `cast.emotePop`, the emote's spring (design §6).
- **Timing helpers** in `src/brand/cast-motion.ts`: emote pop, leave, blink, breathe, squash after a landing, hop (design §7).
- **The approved motion test as a composition** (`cast-motion-test`, 16:9, 360 frames, no words) in its own Studio folder, outside the scene catalogue (design §8).
- **Frozen look:** `test/fixtures/cast-0.5.0.json` holds the SHA-256 of 130 piece calls and of all 360 motion-test frames, written by the spike port Bruno approves at gate 1; tests re-make each one (design §9).
- **Release 0.5.0** (0.4.0 went to AB#173).

## Capabilities

### Modified Capabilities

- `illustration-pieces`: `mascot` and `emote`; the catalogue count (52 to 54).
- `design-tokens`: the `cast` group.
- `motion-components`: the cast timing helpers.
- `cover-cli`: the piece count in "Unknown background and piece" (54); covers may use the new pieces like any other.
- `scene-catalogue`: the cast motion test, registered outside the catalogue.

`scene-rendering` does not change.

## Out of scope

- Any scene for an article (AB#144 to AB#150, one change each, after this one) and the video on the site (AB#142).
- Walking, picking up and handing over objects (tested in the SDD scene 1 storyboard; they come with the scene that needs them), and roles not in the card (writer, reviewer).
- Neutral compositions in the scene catalogue (one composition for both languages): the first neutral scene, AB#144, changes the catalogue rule in its own change.
- A dark-surface variant of the cast (decision 5). The pieces draw the same on any background.
- The 4:5 layout of the motion test.
- Any change to an existing piece: `robot` and the cover pieces stay as they are, so no frozen fixture of an existing piece changes.
- Kit (`designer` skill, AB#158) and brunosouzas.com: read only.

## Implicit requirements

- **Errors and invalid input:** requirement. Both pieces check their parameters with the shared schema (unknown `who`, `face`, `action` or `kind`; non-finite numbers; `scale` out of range; `look` out of range; `headTilt` on a character other than the agent), as a `RangeError` from code and a JSON-path problem in a cover spec.
- **Limits:** requirement. `scale` greater than 0 and at most 10; `look` from -1 to 1; `headTilt` from -30 to 30 degrees; positions of any size, as every piece (`Positions of any size`), with the existing overflow check.
- **Repetition and idempotency:** requirement. Same parameters give the same tree and the same bytes; the frozen fixture pins them.
- **Concurrency:** n/a. Pure functions.
- **Security:** n/a beyond the existing rules: the pieces emit only tags in `SVG_TAGS`, colours from tokens, no text, no link and no style.
- **Logs and observability:** n/a. Pieces print nothing.

## Documentation

- `docs/adr/0005-neutral-videos-and-the-cast.md` (new) and the ADR index; ADR 0003 and 0004 point to it in an amendment line.
- `README.md`: the cast and the emotes, their meanings, the `cast` tokens, the Studio folder.
- `docs/roadmap.md`: row 10 delivered; the video rows refer to ADR 0005.
- `AGENTS.md`: the caption rule and the per-language rule point to ADR 0005.
- Vault: `10-personal/projects/brunosouzas-design-system/{architecture,roadmap,changelog}.md`, after the pull request is ready.

# Proposal: banner-format

## Why

Both sites built on the Astro template need a home banner, and neither can make one from the design system today:

- brunosouzas.com shows a hand-drawn SVG, `public/images/home/home-banner.svg`: 1200x420, corners rounded at 20, the navy background with its rings (`#14215A`, `#1C2D74`), centred at (600, 225) with a first radius of 60, drawn by hand on 2026-10-13 (commit `e8ad098`). Nothing ties it to the tokens or the pieces, so it drifts like the covers did.
- stackledger's home (`site/src/pages/index.astro:15-20`, `site/src/styles/pages.css:257-271`; item E24 of the stackledger inventory) is a grey CSS band with the title and a lead paragraph, and no illustration. The inventory recommends a banner made of `rings`, `pipe`, `stationMarker` and `lineBadge` once a banner format exists. That is this change.

The cover command already validates a JSON spec and draws it from the pieces, but only at 800x420. A spike on 2026-10-23 redrew the brunosouzas.com banner and a stackledger metro banner at 1200x420 from the existing pieces, with no new piece. Only the frame was missing.

## What Changes

- **Spec format.** A cover spec takes an optional `format`, either `cover` (the default, today's 800x420 cover) or `banner`. The command, the bin `brunosouzas-cover`, the validation, the pieces and the `custom` object all stay the same.
- **Banner frame.** A `banner` is `banner.width` x `banner.height` (1200x420) with its background and its clip path rounded at `banner.radius` (20), like the published brunosouzas.com banner. Rings, pieces and labels are clipped to that rounded frame, so nothing pokes past a corner.
- **Rings to the corners.** On a banner, the rings continue until they reach the frame's farthest corner (22 rings for the published banner's centre and radius). A cover keeps its 14 rings, so the three proof covers stay byte-identical.
- **`rings.count`.** The `rings` piece takes an optional ring count (default 14), which the banner frame passes to it. A spec cannot set it.
- **Tokens.** A new group `banner` with `width` 1200, `height` 420 and `radius` 20, taken from the published brunosouzas.com banner.
- **Fixture.** One banner fixture, `home-banner`: the brunosouzas.com home banner redrawn from the pieces (spike A), with its golden SVG.
- **Docs.** README (the format), `docs/roadmap.md` (item 5 delivered), the fixtures README.

## Capabilities

### Modified Capabilities

- `cover-cli`: the `format` key, the banner frame and its rings, the format problems, and the banner fixture beside the proof covers.
- `design-tokens`: the thirteenth group, `banner`, and its required tokens.
- `illustration-pieces`: the `rings` count.

`motion-components`, `scene-catalogue` and `scene-rendering` do not change.

## Out of scope

- The animated banner (AB#143, after the site palette).
- Any change in stackledger or brunosouzas.com. Each site adopts the banner in its own repository and session.
- A second banner size, a phone crop or art direction per breakpoint. The banner scales down as one image, as the published one does today.
- A light or dark variant of one banner. Like the published one, a banner is a self-contained panel on its own background.
- Placing pieces with `pose` or a `scale` from the JSON, or new pieces. The spike needed neither.
- Scaling the metro pieces' text (`map.badgeTextSize` stays 12 at any `inkScale`).
- A rule on words in a banner. The command accepts pills as on a cover; what a banner should say belongs to the `designer` skill (AB#151).
- The registry of unique backgrounds (AB#140), which is for covers.
- Publishing a version. Releases follow `docs/release.md` after the merge.

## Implicit requirements

- **Errors and invalid input:** requirement. An unknown or non-string `format` is a spec problem at `format`. A `rings.count` in a spec is a problem. The command keeps its error handling and still writes nothing on any problem.
- **Limits:** requirement. `rings.count` is an integer from 1 to 1000, enough for a centre anywhere within ±10000 of the frame. Positions keep the ±10000 limit.
- **Repetition and idempotency:** requirement. The same spec gives the same bytes (existing "Running twice"), banners included.
- **Concurrency:** n/a. A one-shot command and pure functions, with no shared state.
- **Security:** requirement. `format` is checked against two names, and nothing else new enters the SVG. `custom` keeps its allowlist.
- **Logs and observability:** n/a. The command prints `wrote <file>` or its problems, as today.

## Documentation

- `README.md`: the cover command section shows a banner spec and the `banner` tokens.
- `docs/roadmap.md`: item 5 (AB#156) delivered.
- `test/fixtures/covers/README.md`: the banner fixture and why it is public.
- Vault: `10-personal/projects/brunosouzas-design-system/{architecture,roadmap,changelog}.md`, after the pull request is ready.
- No ADR. The frame follows ADR 0003 (rings, ink outline, hard shadow), and a banner is not a scene, so ADR 0004 does not apply.

# Proposal: circuit-breaker-healthy-end (AB#334)

## Why

On 2026-11-12, watching the render of `circuit-breaker-states`, Bruno felt that the end does not show the circuit breaker working without errors: after HALF_OPEN goes back to CLOSED, the video should keep going and show that the circuit is healthy. Today the last CLOSED phase shows eight `ok` calls in about two seconds (frames 834 to 897), and at the outro (frame 910) every block jumps back to full opacity, so the final still shows OPEN and HALF_OPEN as lit as CLOSED. The article says CLOSED is the state where "calls pass through normally; the circuit watches the outcomes" (EN and PT L42); the end of the video does not show that state on its own.

Bruno's decisions, 2026-11-12 (card AB#334, child of epic AB#324):

- **q53 A.** The three states stay on screen: in CLOSED the circuit keeps watching the outcomes and can open again (article L40-44), so no state disappears. At the end OPEN and HALF_OPEN dim and only CLOSED stays lit. The healthy closing stretch gets longer (about 8 s of `ok` calls), and the final still (SCN-4, at least 3 s of identical frames) shows that state.
- **HTTP codes on the calls (replaces q54, same day).** First decided "no HTTP status codes"; Bruno then changed it: the article's evidence section cites them (L84-91: "Closed circuit — calls pass through normally"; "the first 5 calls are real 502s; the 6th is already 503, without the backend being called"; the replica table, L103-107), so the video shows the outcome of calls with codes where it helps the reader: real failures `502`, calls blocked by OPEN `503` (without touching the backend), `ok` calls `200`, above all in the healthy stretch after HALF_OPEN to CLOSED. `200` is implied by "pass through normally"; Bruno approved it as a reading choice on 2026-11-12 (MOT-1). The article also has it in the sequence diagram's description, L75: "Circuit CLOSED: ... and 200 OK comes back". Codes are words allowed on screen (SCN-1: HTTP codes), the same in PT and EN. His brief: "use your creativity; the only rule is to follow what the article says, so the reader understands how the circuit breaker works in a simple, easy way."
- **q55 A.** The article's content pull request waits for this change.
- Keep the PT/EN pair, the captions and the 4:5 format (this scene's exemptions from SCN-1, SCN-2 and SCN-3). The final caption uses only article text. The pilot's timeline test changes on purpose. The end reuses the dimming the scene already applies to inactive states during the run (MOT-6, tokens only), and every beat cites its article line (MOT-1).

## What Changes

- **A code on every call.** Each state block gets a code tag at its top edge that shows the HTTP code of its latest call: `200` for `ok`, `502` for `fail`, `503` for `blocked`. The tag pops in on each call's frame, with the call square's fill (white, failure red, ink), and dims and scales with its block. A block whose latest phase has no call yet shows no tag. The squares and their glyphs do not change.
- **Earlier frames change where codes appear, honestly.** The first call is at frame 56, so from 56 on every phase shows codes: those frames are not identical to 0.12.0 any more. What stays pinned: frames 0 to 55 are byte-identical (stills SHA-256 at frame 55 recorded from 0.12.0), and every element that existed in 0.12.0 (blocks, squares, countdown, arrows, tokens, pills, caption) keeps its frame logic at every frame from 0 to 819; only the code tags are added on top.
- **A longer healthy end.** The final CLOSED phase runs from frame 820 to 1140 and holds eight `ok` calls, one every 26 frames (834 to 1016), each answered `200`; from its start to the outro (frame 1060) is 240 frames, 8.0 s. No `fail` or `blocked` result and no transition after HALF_OPEN to CLOSED (frame 790).
- **Only CLOSED lit at the end.** The focus rule no longer lifts the dimming at the outro: from the outro to the last frame CLOSED keeps opacity 1 and `motion.focusScale`, and OPEN and HALF_OPEN keep `motion.dimOpacity`, exactly as during the CLOSED phase. No new token, colour or size.
- **A longer final still.** Duration 1150 frames (38.33 s at 30 fps, was 1000); outro 1060; frames 1060 to 1149 (90 frames, 3 s) are identical: CLOSED lit with eight `ok` and `200`, OPEN dimmed with `503`, HALF_OPEN dimmed with `200`.
- **Same caption.** The final caption stays the CLOSED pill and the article's CLOSED sentence, per language: EN "Calls pass through normally; the circuit watches the outcomes.", PT "Chamadas passam normalmente; o circuito observa os resultados." The text table gains one key, `codes` (`200`, `502`, `503`), equal in both languages; no other string changes.
- **Stills:** `npm run stills -- circuit-breaker-states` renders frames 200, 365, 500, 620, 775, 1140 and 1149 (still seven per composition, 28 in all).
- **Release:** a minor from a `feat:` pull request title (release-please, Model 2). The request suggested `fix:` (it restores what the article says CLOSED is); with the codes the change also adds a visible element, a text key and layout positions, so `feat:` describes it more honestly.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `scene-catalogue`: the circuit-breaker scene's timing (pilot up to frame 819 for the existing elements, the healthy end after it), its call codes and their layout, its healthy end, its final still with only CLOSED lit, its final caption and text table, and the catalogue compatibility requirement that pinned the scene as unchanged.
- `motion-components`: "Focus on the active state" (the outro keeps the focus and dimming of the last phase); a new "Latest call of a state block" (what the code tag shows at a frame).
- `scene-rendering`: the circuit-breaker stills frames and the rendered length (1150 frames).

## Out of scope

- A backend element or call tokens travelling to a backend: the calls stay the squares in the blocks, and the `503` tag plus the OPEN caption ("without touching the backend") say the backend was not called (G1 question 1).
- Any HTTP code or string other than `200`, `502` and `503`: no `400` (business errors are outside the states loop), no `circuit_open`, `CIRCUIT-BREAKER:OPEN`, `HTTP:TIMEOUT` or reason phrase (`OK`, `Bad Gateway`).
- A code under or inside every square (decision 4 in the design).
- A rolling (sliding) window in the CLOSED block, more than eight calls, or results that shift.
- Showing the circuit open again, a new failure, or any outcome after the healthy end (the article says it can happen, L42-43; the video keeps the three states on screen instead).
- Changes to the timing of frames 0 to 819, the existing layout values, the captions, the colours and every token value.
- The `publish-subscribe` scene (its flow logic does not use the state focus rule; its data, stills and tests stay byte-identical).
- The site's embed and the article's content pull request (q55 A: it waits for this change and its release).

## Implicit requirements

- **Errors and invalid input:** the catalogue checks stay and run on the new timeline and text table (a `codes` entry empty or missing in one language fails "Text table per language"; no movement at or after the outro; outro at most `duration - motion.readingHold`). "Healthy end has no failure" fails on any `fail` or `blocked` result or fire after frame 790.
- **Limits:** duration 1150 frames; outro exactly `duration - motion.readingHold` (1060); eight CLOSED slots, eight calls; the last call 44 frames before the outro so its pop-ins have settled; three codes, three digits each.
- **Repetition and idempotency:** frames are pure functions of the frame number; stills rendered twice on one machine have the same SHA-256 (checked when the baseline was recorded).
- **Concurrency:** n/a: a scene renders one frame at a time from data; nothing is shared.
- **Security:** n/a: no input, secret, network call or permission changes.
- **Logs and observability:** n/a: the stills and render commands keep their output lines; only the frame numbers they print change.

## Documentation

- `README.md`: the scene table row says "approved pilot, unchanged" and the render line says "about 28 MB for 33 s": update both (pilot timing with HTTP codes, healthy end; 38 s).
- `docs/roadmap.md`: none: the circuit-breaker row is delivered and its embed (AB#142) is unchanged.
- No ADR: ADR 0004 and 0005 hold (the codes are in the article, every beat cites it; SCN-1 allows HTTP codes), ADR 0006 and 0009 hold (state colours unchanged, the tags reuse the call squares' fills, dimming by token).
- Brain vault, after the merge: `10-personal/projects/brunosouzas-design-system/changelog.md` and `architecture.md` (the focus rule keeps dimming in the outro; the code tags).

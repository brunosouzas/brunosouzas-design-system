# Design: cast-and-emotes

## 1. Survey

What the approved spike draws, and where each part goes:

| Spike file (approved 2026-10-23) | What it draws | In this change |
|---|---|---|
| `cast-motion-test/src/macs.ts` | `devMac`, `agentMac` (computer bodies), the shared `face` (nine faces), arm targets `rest wave hold up shrug type`, a `symbol` badge | `mascot` for `dev` and `agent`; the face for everyone; `symbol` dropped (emotes replace it, except the agent's spark, kept as its mark) |
| `cast-motion-test/src/mascots4.ts` | architect, devops, data, request, message (plus an older keycap `dev` and robot `agent`, superseded by `macs.ts`), its own face drawing, props, arms `rest wave hold up shrug reach` | `mascot` for the other five; its props; its face replaced by the shared one |
| `cast-motion-test/src/emotes.ts` | eight emotes, burst rays | `emote` |
| `cast-motion-test/src/Scene.tsx` | the 12 s motion test, its timing helpers | §7 helpers, §8 composition |
| `sdd-without-with-spec/{cast,storyboard*,characters,mascots}.ts` | props for the SDD storyboard (laptop, decision chip), earlier drafts | not ported (scene AB#144) |

The spike's code is copied, unchanged in geometry, into `~/.hermes/spikes/design-system/cast-and-emotes/cast.mts` (SHA-256 `8bd766f9…76a80`) and `motion-test.mts` (`cfe83abd…beaa8`) on the package's node contract (`el`, `g`, `drawn`, `pose`). That port is the normative drawing: the implementation moves its functions into `src/pieces/cast.ts` and `src/scenes/cast-motion-test/`, replacing the proposed-token lookup with `colour()`, and must reproduce every hash of §9. The port differs from the approved files only in these points, each visible on the gate-1 sheets:

1. One face drawing for every character (`macs.ts` `face`, with the eye highlight), split into `eyes`, `brows` and `mouth` groups; `proud` is dropped, because it drew the same as `happy`. The requester's eyes gain the highlight.
2. Hands and feet only with an action (`action: "none"` draws neither), for every character. In `mascots4.ts` they were always drawn.
3. Parts are named with `data-part` (not `id`): several mascots share one SVG, and ids must be unique in a document.
4. `problem` and `refused` are filled `color.failure` (gate-1 decision 4; the spike used `color.backend`).
5. The `waiting` emote draws its three Z as stroked paths (a piece draws no words, requirement "Words come from the caller"); the spike used `text`.
6. Every root group sets `stroke: none`, so the cover command's outlined group adds no outline (requirement "New pieces carry their own stroke").

Parity with the approved motion test: frames 20, 50, 75, 160, 260 and 280 of the port, rendered with `rsvg-convert -w 1920`, against the approved stills (`cast-motion-test/out/stills/f<N>.png`, from the Remotion render) give PSNR 40.30, 40.11, 40.00, 39.38, 37.31 and 36.73 dB (`ffmpeg -lavfi "[0]format=rgb24[a];[1]format=rgb24[b];[a][b]psnr"`). The difference is points 1 and 4 and the rasteriser. Sheet: `~/.hermes/spikes/design-system/cast-and-emotes/frames-sheet.png`.

What exists in the repository: `pose` (`src/pieces/pose.ts`) is already the motion test's actor wrapper (spec "Animation by parameter"); `toReact` renders any piece in a scene; `robot` is the cover's robot and stays. Nothing in `src/brand/` draws a character.

Where each character goes: all seven become one piece, `mascot`, usable in covers, diagrams and scenes (gate-1 decision 1). Scenes animate it by recomputing its parameters per frame and wrapping it in `pose`, as the motion test does.

## 2. `mascot`

`mascot({ who, x, y, face?, action?, scale?, look?, headTilt?, prop? })`, in `src/pieces/cast.ts`, registered in `PIECES` after `stateStart`.

| Parameter | Type | Default | Range |
|---|---|---|---|
| `who` | enum `dev agent architect devops data request message` | required | |
| `x`, `y` | number | required | any finite (anchor: centre of the ground line) |
| `face` | enum (§3) | `normal` | |
| `action` | enum (§4) | `none` | |
| `scale` | number | 1 | greater than 0, at most 10 |
| `look` | number | 0 | -1 to 1 (gaze: the face moves `6·look` right) |
| `headTilt` | number | 0 | -30 to 30 degrees; non-zero only for `agent` (relation problem at `headTilt`: "applies only to the agent") |
| `prop` | boolean | true | draws the signature prop when `action` is `rest` or `hold` and the character has one |

Output: `body` holds one group `g { data-mascot: <who>, transform: "translate(x y) scale(k) translate(-ax -ay)", stroke: "none" }`, where `k = scale × characterScale` and `(ax, ay)` the character's anchor; `text` is empty. Drawing order inside it: `ground` (a group holding the ellipse), the arms when behind, `legs`, the character's parts, `face`, `prop`, the arms when in front (`hold`, `type`). The transform group means the piece is for covers, diagrams and scenes, not for stackledger's map writer.

| `who` | Source | Anchor | Scale | Ground rx | Parts (in order) | Mark | Prop |
|---|---|---|---|---|---|---|---|
| `dev` | `macs.ts` | 110, 230 | 1 | 80 | `stand`, `body` (frame, chin, screen, `screen-code`), `mark` | `</>` on the chin | none (the screen is the work) |
| `agent` | `macs.ts` | 110, 250 | 1 | 82 | `neck`, `body` (dome), `mark`, `head` (holds `face`; rotates `headTilt` round its neck top `110 + 1.4·headTilt, 110`) | AI spark on the dome | none |
| `architect` | `mascots4.ts` | 105, 216 | 1 | 76 | `pencil`, `body` (set square, hole, shine), `mark` | ruler ticks | diagram board |
| `devops` | `mascots4.ts` | 105, 216 | 1 | 76 | `body` (gear, shine), `mark` | ∞ | wrench |
| `data` | `mascots4.ts` | 105, 216 | 1 | 76 | `body`, `mark`, `lid` | two bands | magnifier |
| `request` | `mascots4.ts` | 105, 216 | 1 | 76 | `body` (bubble, shine), `mark` | request line | none |
| `message` | `mascots4.ts` | 105, 216 | 0.7 | 76 | `body` (envelope), `mark` | flap and seal | none |

Colours per character are the `cast` tokens of §6 plus `color.white` (agent, message), `color.caller` (request), `illustration.codePanel` (agent's screen), and `color.transitional`, `color.backend`, `color.healthy`, `color.panel` in small parts (pencil, seal, board, screen code, the set square's hole), as in the spike.

## 3. Faces

`normal`, `blink`, `happy`, `wink`, `surprised`, `worried`, `thinking`, `focused` (gate-1 decision 2). One drawing for all: eye centres at horizontal offsets −24 and +24 from the face anchor, brows 22 above (worried, surprised, thinking only), mouth 26 below. The face is ink on every character except the agent, whose face is `cast.glow` on its dark screen (its open mouths are `cast.glow` too; the others' are `cast.mouth`). Face anchors: dev 110, 88; agent 110 (+1.4·headTilt), 58; architect 110, 132; devops 110, 100; data 105, 104; request 105, 82; message 105, 136. Groups: `face` holds `eyes`, `brows` (only when drawn) and `mouth`.

Expression rule (ADR 0005): a face never needs hands. Body acting (squash, tilt, hop, shake) comes from `pose` and the agent's `headTilt`.

## 4. Actions

`none` (no arms, no legs), `rest`, `wave`, `hold`, `reach`, `up`, `shrug`, `type`. Arms are ink strokes from the shoulder to a mitten (ellipse rx 15, ry 12, turned 20° outwards), with a quadratic bend `side·14` out and 8 down; width 15 (computer family: dev, agent) or 16 (object family). Legs are drawn with every action except `none`. Mitten targets are offsets from the shoulders (left, right):

| Action | Computer family | Object family |
|---|---|---|
| `rest` | (-20, 40), (20, 40) | (-22, 34), (22, 34) |
| `wave` | (-20, 40), (30, -86) | (-22, 34), (34, -92) |
| `hold` | (30, 50), (-30, 50) | both at the character's hold point, the right mirrored round x 105: architect 64, 168; devops 72, 160; data 70, 170; request 70, 150; message 70, 170 |
| `reach` | (-20, 40), (70, -4) | (-22, 34), (70, -4) |
| `up` | (-30, -90), (30, -90) | (-34, -96), (34, -96) |
| `shrug` | (-44, -26), (44, -26) | (-46, -30), (46, -30) |
| `type` | (26, 58), (-26, 58) | (26, 58), (-26, 58) |

Shoulders and hips per character are those of the spike files (`sh` in `macs.ts`, `shoulders`/`hips` in `mascots4.ts`).

## 5. `emote`

`emote({ kind, x, y, scale?, burst? })`, in `src/pieces/cast.ts`, registered after `mascot`. `(x, y)` is the emote's centre; place it beside the head, never over the face. `scale` greater than 0, at most 10, default 1 (1 = beside a mascot of scale 1); with `scale` other than 1 the root group gets `transform: translate(x y) scale(s) translate(-x -y)`. `burst` (default true) draws the rays (and the idea's glow) of `idea`, `problem` and `worked`. Root group: `g { data-emote: <kind>, stroke: "none" }`; `text` is empty.

| `kind` | Shape | Meaning (fixed) | Colour |
|---|---|---|---|
| `idea` | bulb with glow and rays | an idea | `color.transitional`, base `cast.metal` |
| `doubt` | question mark on a disc | doubt, not understood | `color.white` |
| `problem` | warning triangle with `!` and rays | a problem appears | `color.failure` |
| `worked` | check on a disc, rays | it worked | `color.healthy` |
| `refused` | cross on a disc | refused, rejected | `color.failure` |
| `pressure` | two sweat drops | under pressure | `cast.glow` |
| `liked` | heart | liked | `color.backend` |
| `waiting` | three Z | waiting | `color.caller` on an ink casing |

Names are by meaning, so a scene picks the emote for what it says (gate-1 decision 2). Motion rule (ADR 0005): one emote at a time, popping in with the face change (§7) and leaving before the next action.

## 6. Tokens

New group `cast` (the fifteenth), all `color` except `emotePop`:

| Token | Value | Token | Value |
|---|---|---|---|
| `cast.ground` | `#D3DBF5` | `cast.devops.fill` | `#F2873A` |
| `cast.metal` | `#C9D2E8` | `cast.devops.shine` | `#FFCDA6` |
| `cast.mouth` | `#B94A3E` | `cast.data.fill` | `#8C6CF0` |
| `cast.glow` | `#7FD1FF` | `cast.data.lid` | `#C2B1FF` |
| `cast.dev.fill` | `#5B7CFA` | `cast.data.shine` | `#B39CFF` |
| `cast.dev.chin` | `#8FA6FF` | `cast.data.lens` | `#EAF1FF` |
| `cast.dev.screen` | `#DCE6FF` | `cast.request.shine` | `#D6E2FF` |
| `cast.agent.neck` | `#E3E8F5` | `cast.emotePop.damping` | 9 (`number`) |
| `cast.agent.shine` | `#E6ECFF` | `cast.emotePop.stiffness` | 170 (`number`) |
| `cast.architect.fill` | `#22B5A4` | `cast.emotePop.mass` | 0.7 (`number`) |
| `cast.architect.shine` | `#9CF0E4` | | |

Values are the spike's, unchanged. `$description` on `cast.ground` ("Flat ground shadow under a mascot."), `cast.metal`, `cast.mouth`, `cast.glow`, each `*.fill` and `cast.emotePop.damping` ("Emote pop-in: a quick overshoot, then rest."), as written in `~/.hermes/spikes/design-system/cast-and-emotes/proposed-tokens.json`. The agent has no hue of its own: white body, dark screen, glowing face (gate-1 decision 3). The requester's bubble is `color.caller` on purpose: it is the caller.

## 7. Timing helpers

`src/brand/cast-motion.ts`, pure functions of the frame (no React):

| Helper | Value |
|---|---|
| `emotePop(frame, at, fps = motion.fps)` | `spring({ frame: frame - at, fps, config: cast.emotePop })`: 0 at and before `at`, peaks at 1.237 seven frames later, within 0.001 of 1 from 30 frames on |
| `leave(frame, at, len = 10)` | `interpolate(frame, [at, at + len], [1, 0])`, clamped, `Easing.in(Easing.cubic)` |
| `blinking(frame, starts)` | true when `start ≤ frame < start + 4` for some start |
| `breathe(frame, phase)` | `1 + 0.012·sin((frame + phase) / 14)` |
| `squashAfter(frame, at, amp)` | 1 before `at`; then `1 + amp·e^(−d/7)·cos(d/2.2)` with `d = frame − at` |
| `hop(frame, at, height, len = 14)` | 0 outside `[at, at + len]`; else `height·sin(π·(frame − at)/len)` |

These are the motion test's `pop`, `out`, `blinkAt`, `breathe`, `jiggle` and `hopAt`, renamed. Every number they take SHALL be finite, `fps` and `len` greater than 0, and `starts` an array of finite numbers; otherwise the helper throws a `RangeError` naming the first offending parameter in its argument order (`frame` first). `amp` and `height` may be any finite number, negative included.

## 8. The motion test composition

`src/scenes/cast-motion-test/frames.ts` exports `castMotionTestFrame(frame): SvgNode` (pure, the port's `frameTree`), and `src/scenes/cast-motion-test/CastMotionTest.tsx` renders it with `toReact`. The folder sits under `src/scenes/`, so the colour-literal rule of `motion-components` covers it, but it is not registered as a scene. `src/Root.tsx` registers it as `cast-motion-test` in a Studio folder `cast`: 1920×1080, `motion.fps`, 360 frames. It is not in `src/scenes/index.ts`, so the catalogue checks, `npm run stills` and `npm run render` do not see it (gate-1 decision 6): it illustrates no article, and ADR 0004 binds catalogue scenes to articles. It renders from the Studio or with `npx remotion render src/index.ts cast-motion-test`.

Frame by frame (all frames inclusive of the start, exclusive of the end unless said):

| What | Frames and values |
|---|---|
| Background | `color.panel`; 22 rings `color.ring`, width 2, centre 960, 640, radius `120 + 56k` |
| Agent | x 450, y 960, scale 1.9; enters with `emotePop(f, 0)` as `pose` scale (opacity `min(1, 1.4·pop)`; left out while pop ≤ 0.001) |
| Requester | x 960, y 960, scale 1.9, action `rest`, no prop; enters `emotePop(f, 6)` |
| Dev | x 1450, y 960, scale 1.9; enters `emotePop(f, 12)` |
| Beat A, agent | `thinking` 30–62 (look 1, head tilt adds `2·sin(f/4)`), `happy` 62–118, else `blink` at 18, 150, 262, 340 (4 frames), else `normal`; head tilt keyframes (30, 0), (44, 12), (62, 12), (72, −8), (118, −8), (132, 0) clamped; squash `squashAfter(f, 62, 0.1)·breathe(f, 0)`; hop `hop(f, 62, 28, 12)` |
| Beat A, emote | `idea` at 720, 400; scale `emotePop(f, 62)` until 112, then `leave(f, 112)`; × `1 + 0.05·sin((f − 62)/3)` while 62–118; × 2.2 |
| Beat B, requester | `thinking` 142–214 (look 1), else `blink` at 44, 96, 240, 318, else `normal`; tilt keyframes (138, 0), (150, −7), (206, −7), (220, 0) clamped; squash `squashAfter(f, 142, 0.08)·breathe(f, 20)` |
| Beat B, emote | `doubt` at 1200, 540; scale `emotePop(f, 142)` until 206, then `leave(f, 206)`; × 2.2; tilt `9·sin((f − 142)/6)` while 142–214 |
| Beat C, dev | `surprised` 246–272, `worried` 272–316, else `blink` at 70, 120, 200, 350, else `normal`; hop `hop(f, 246, 60, 14)`; squash `squashAfter(f, 260, 0.12)·breathe(f, 40)`; shake `7·sin((f − 246)·2.4)` while 260–274 |
| Beat C, emote | `problem` at 1740, 510; scale `emotePop(f, 246)` until 310, then `leave(f, 310)`; × 2.2 |
| End | 320–359 no emote; still but for breathing and the dev's blink at 350. The composition is exempt from the three-second still final frame (ADR 0005, consequences): it is a proof of the cast, not an article scene |

Emotes on screen (design check, frozen by the fixture): `idea` 63–121, `doubt` 143–215, `problem` 247–319, none elsewhere; each starts the frame after its character's face change (62, 142, 246), when its pop leaves 0, and no two overlap.

Emotes and actors are wrapped with `pose` (emote: `x`, `y` at its centre, `tilt`, `scale`); an emote whose scale is ≤ 0.001 is left out.

## 9. Frozen look

`test/fixtures/cast-0.5.0.json` (SHA-256 `266e3a021c5285594749884f53dc9faa1ef8132629b04620a690eb0c1b4ba302`), committed with this spec, written by `fixture.mts` in the spike folder from the port:

- `pieces`: 130 calls with their parameters and `sha256` of `toSvg(g({}, ...body, ...text))`: every character in every face (56), every character in every action except `none` (49), every character at x 300, y 500, `happy`, `rest`, scale 1.9, look 1, no prop (7), the agent with `thinking`, headTilt 12, look −1, and with headTilt −8, `wave` (2), every emote at 0, 0 (8) and at 100, 50, scale 2.2, no burst (8).
- `frames`: `sha256` of `toSvg(castMotionTestFrame(f))` for f = 0 to 359.

A test re-makes every call and frame and expects each hash. If gate-1 decision 4 picks coral, the fixture is rewritten from the port with `PROBLEM_COLOUR=color.backend` before implementation, and this paragraph gets the new SHA-256. No existing piece changes, so the existing frozen fixtures (`pieces-0.2.0.json`, `ui-icons-0.3.0.json`, `message-arrow-0.3.1.json`) and the cover goldens must stay byte-identical.

## 10. Gate-1 decisions (built with the recommended answers)

1. The cast as pieces (covers and diagrams may use them) or only as video components. Recommended: pieces.
2. Names: faces `normal blink happy wink surprised worried thinking focused`; actions `none rest wave hold reach up shrug type`; emotes by meaning (`idea doubt problem worked refused pressure liked waiting`). Alternative for emotes: by shape (`bulb question alert check cross sweat heart zzz`).
3. The agent's colour: no green (white, dark screen, glowing face), so green stays "healthy". The cover `robot` stays green.
4. `problem` and `refused` in `color.failure` (ADR 0003: red is the failure path) or in coral as approved.
5. Dark surface: none now; the pieces draw the same on any background (sheet row 2 shows the shadow lost on navy). A `surface` parameter comes when a consumer needs it.
6. The motion test outside the catalogue (Studio folder `cast`) rather than as a catalogue scene with no article.

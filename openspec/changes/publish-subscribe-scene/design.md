# Design: publish-subscribe-scene

## Context

See proposal.md for motivation. Observed (DES-4):

- `src/brand/motion.ts` exposes `Timeline<S,T>`, state phases, `blockContents`, slots, focus, transition fires and captions selected by state. These describe a state machine, not message ownership.
- `SceneData` in `src/scenes/catalogue.ts` currently requires that timeline. `compositionsOf` only needs its duration; `scripts/stills.ts` only needs phase ends and duration. `checkTimeline` combines common range checks with state-machine fire-window checks.
- `src/Root.tsx` maps ids to React components. `scripts/{cli,stills,render}.ts` import data without React/font loading. Keep this boundary.
- `test/scenes/circuit-breaker.test.ts` pins the approved pilot; `catalogue.test.ts` constructs legacy `SceneData` fixtures and asserts diagnostics. The circuit-breaker `scene.ts`, `layout.ts`, `Scene.tsx` and existing test files are not migration targets (the owner-requested line-weight change in §7 adds two collision fixes to its `layout.ts` and `Scene.tsx`, never its timeline).
- Source: brain `50-writing/integration-patterns-in-mulesoft/publish-subscribe-in-mulesoft.{pt,en}.md`, and `images/publish-subscribe-in-mulesoft-anypoint-mq-{pt,en}.svg`. Diagram shapes are white MQ container/yellow tab, green applications, white hexagonal exchange, white rail-ended queues. The article explicitly distinguishes Publish acceptance from queue delivery and describes AUTO ACK/NACK after flow completion.

This is a new choreography, not a port of an approved animation. The diagram is the visual reference, not a scaled video layout. No new dependency or ADR is necessary.

## Goals / Non-Goals

**Goals:** generalise only the catalogue's consumer boundary; keep legacy state-machine semantics unchanged; prove copy ownership by pure frame evaluation; make both language/format variants readable before rendering.

**Non-Goals:** build a graph engine or model broker timing guarantees. Animation frames are explanatory ordering, not latency claims. No real retries, DLQ, fourth subscriber, or successful invoice redelivery.

## Decisions

### 1. A narrow common contract, two timeline validators

Options (DES-2, DES-3):

| Option | Fit / compatibility | Failure and recovery / operation | Cost to reverse |
|---|---|---|---|
| Force flows into `Timeline<S,T>` (nodes as states, copies as slots) | Few type edits, but misrepresents three simultaneously live copies; forces fake transitions and captions | Existing fire-window checker rejects valid fan-out, or must be weakened for every scene | High: semantics spread into each scene |
| Replace every timeline with one graph/event engine | Can represent both; requires rewriting a proven pilot and its validation | New interpreter and migration create failure modes unrelated to this scene | High; unrequested abstraction |
| **Common read-only metadata/ranges with legacy state-machine and new flow variants** | Consumers get exactly what they use; old `SceneData` fixtures and timeline stay valid | Common checks plus deterministic kind-specific checks; errors retain item context; no side effects | Low: one catalogue boundary, one new scene validator |
| Separate catalogue/CLI for flows | Protects pilot but duplicates registration, lookup, source checks and commands | Two operational paths and differing output policies | Medium; unnecessary duplication |

Choose the third. Implement a structural `SceneContract<TTimeline>` whose minimum timeline is duration, outro and phases `{from,to,events: readonly {at:number}[]}`; metadata stays id, formats, languages, text and sources. Preserve exported `SceneData` as the legacy state-machine alias with its current default `Timeline`, so existing fixture annotations continue to compile. Add a flow variant with explicit `kind: "flow"`; legacy absence of kind means state machine, not an invalid scene. A catalogue union (for example `CatalogueScene`) is used by `scenes`, lookup, composition enumeration, text validation and scripts. Do not widen `Timeline`, `Phase<S>`, `blockContents`, slots, transitions or fires to fake optional state-machine fields.

`checkTimeline` accepts the catalogue union and dispatches: common phase/range/outro rules, then the current state-machine fire/draw/pill rules for legacy scenes or the pub-sub flow rules. Factor common logic without changing old diagnostic wording, ordering or assertions. Common event records have `at`; a flow trip's `at` is departure and its arrival is checked by the flow validator. Common checks still catch duplicate ids, unsafe ids, mismatched text keys and missing source URLs for either kind. Every phase start/event/draw/pop precedes outro. For this flow, all travel, fades and springs finish before outro too. Do not add global integer checks that would silently change legacy error behaviour; validate new flow fields as finite integer frames in `[0,999]` with ordered ranges.

Caption selection is by flow phase id (`publish`, `fanOut`, `consume`, `failure`, `final`), not by active node. Add a flow-specific pure caption resolver; leave legacy `captionAt` and focus rules unchanged. No state-chip captions are invented for this scene. CLI still frames continue to use common phase ends plus final frame. No callback, React component or font module enters scene data.

Verification: new catalogue/flow suites plus **all existing tests unchanged**, particularly the pinned timeline, except catalogue-dependent assertions that list every registered scene (the CLI usage line `available scenes: …` in `test/scripts/cli.test.ts`), which gain `publish-subscribe`. Composition ids, output directories, frame sets and circuit-breaker playback do not change. No security/operational change: safe ids and `out/` containment remain; no new network use beyond existing browser/font loading.

### 2. Scene-owned choreography, reusable drawing primitives

Keep `src/scenes/publish-subscribe/{scene.ts,text.ts,timeline.ts,layout.ts,flow.ts,Scene.tsx}`. `scene.ts` exports metadata with a React-free timeline. `flow.ts` returns token ownership, positions/route progress, marks and caption key from a frame; validation checks the authored event/dwell tables. Absolute-frame interval evaluation, never hooks accumulating state or random timers: arbitrary Studio seeks produce the same result.

Generic additions to `src/brand/components.tsx` (or adjacent brand module):

- `Exchange`: elongated six-vertex outline, white fill and hard shadow; arbitrary children and scene bounds.
- `Queue`: white rounded body with two inset vertical rails; arbitrary children and bounds.
- `TaggedContainer`: white rounded body and yellow pill tab accepting supplied label/content, bounds and pop-in. It owns no topology or MQ string. Reuse existing `InkBlock`, `Pill` styling internally where suitable; allow a token-supplied fill for the tab rather than recolouring all existing pills.
- A positioned token primitive using the existing circle radius 17, hard `shadow.small`, a fill (white by default; the scene supplies `color.caller`, see below) and `outline.small + 1` stroke. Position may be a stationary point or the result of `pointAlong(path,progress)`. Null path points are guarded. Do not change existing `Tokens` behaviour.

Reuse existing Arrow, Rings, CallSquare and pop/fade functions. Generic path travel stays in `src/brand/motion.ts`; **split identities, dwell ownership, ACK/NACK, route selection and copy counts remain in the scene**, not branded components. A return path is an ordinary scene-supplied path, not a new brand component. Reject broker-specific components in brand (would couple identity to article claims); reject a generic token-splitting engine (one declarative fan-out in one scene does not justify it).

All colours, outline/shadow/radius/font-family/weight and motion values come from generated tokens. API and all three consumers start in `color.healthy`; exchange/queues/container use `color.white`; tab uses `color.transitional` as in the source diagram; normal strokes ink, return stroke and returned-token outline `color.failure`. No orange fail-fast or red API.

**Failure salience (designer review).** From the failure event (610) to the end, the Invoice consumer block's fill becomes `color.failure`, with the usual ink outline and hard block shadow; the others stay healthy. Its text stays ink: ink on `#E04848` is about 4.6:1 against about 4.1:1 for white, so ink is the more legible choice at 30 px. The failure mark is the same `CallSquare` `fail` cross at the format's square size (16:9 36 px, 4:5 32 px), but white with an ink cross, because a failure-red square would vanish into the red block (ADR 0003: small marks use ink or white, never the block's hue). It sits on the subtitle's centre line, mirroring the ACK check: inset from the block's right edge by the check's inset from the left edge, with the subtitle padded symmetrically so neither square touches it. `CallSquare` gains an optional appearance override for this; its default per kind, and so the circuit-breaker scene, is unchanged.

**Token contrast (designer review).** White tokens inside white queues read poorly. Options with existing tokens: (a) a thicker ink outline on a white fill, which still leaves a white disc on a white queue and only reads as a ring; (b) an ink fill, maximal contrast but heavy, and it hides the failure outline of the returning copy; (c) `color.caller` fill with the existing ink outline. Choose (c): the light blue is a filled mass distinct from the white queues, the white exchange and the blue-grey panel alike (the ink outline and hard shadow carry the edge on the panel), it stays distinct on green and red application blocks, and the returning invoice copy keeps its `color.failure` outline readable around it. In the brand palette light blue already means the caller, and the message is what the publishing API sends. Every copy has this fill on every frame, so a copy does not change colour when it leaves the MQ container.

Check squares stay white/ink; there is no failure-red square. There is no extra on-screen `ACK`, `NACK`, title or phase label; those terms below describe behaviour, not new labels.

**No new tokens:** current travel 22, draw 20, fade 10, pop spring, readingHold 90, palette, typography and outlines suffice. Layout coordinates, dimensions, text sizes, rail insets/hexagon geometry, token centres and authored phase/event frames are composition constants, as in the foundation design, not duplicated design-token values. Travel/arrow/fade durations must read their existing tokens. Numeric timeline expectations below pin current values; future rhythm-token changes intentionally require retiming/review, not hidden drift.

### 3. Exact timeline and ownership

Duration **1000 frames**, fps `motion.fps` = 30; inclusive phase ranges below. Intro `[0,39]`, outro `[910,999]` (90 fully static frames). No active-state dimming or pulsing: pop the objects in, then hold the diagram stable. Clamp settled appearance to its final value by frame 910 so spring tails cannot animate the reading hold.

| Item / phase | Inclusive frames / actions | Caption / still |
|---|---|---|
| Intro | Rings fade 0–20; API pop 6; MQ body + tab 14; exchange 22; all queues 26; consumers payment/inventory/invoice 30/32/34 | None; supplementary still 39 |
| Arrow draw / route labels | Publish draw 18, binding draws 20, Subscriber draws 22; each takes `motion.drawArrow` 20; associated labels pop at draw+8 | Labels exact from diagram; keep off travelled path |
| `publish` | `[40,239]`; event leaves API at 100, trip `[100,122)`; arrival/acceptance at 122; exchange dwell `[122,280)`; API check from 122 onward | C1 from 40; phase still 239; supplementary 111 and 122 |
| `fanOut` | `[240,469]`; at 280 exchange token replaced by copies `payment`, `inventory`, `invoice`; each binding trip `[280,302)`; each queue dwell `[302,470)` | C2 from 240; phase still 469; supplementary 291 and 302 |
| `consume` | `[470,609]`; all Subscriber trips `[470,492)`; consumer dwell begins 492; payment ACK 550, inventory ACK 580; their tokens disappear exactly on their ACK frames and checks persist | C3 from 470; phase still 609; supplementary 481, 550, 580 |
| `failure` | `[610,789]`; at 610 the invoice block turns `color.failure` and gains its white/ink cross, invoice copy still at consumer until 640; return arrow draws 610–630 with failure stroke and no extra label; return trip `[640,662)`; invoice queue dwell `[662,1000)` | C4 from 610; phase still 789; supplementary 610, 651, 662 |
| `final` | `[790,909]`; API check remains; two ACK marks remain; red invoice block and its cross remain; invoice copy waits with failure outline | C5 from 790; phase still 909 |
| Outro | `[910,999]`; exactly the same settled diagram, marks, caption and queued invoice copy on every frame | C5 persists; final still 999 |

Caption windows: C1 `[40,239]`, C2 `[240,469]`, C3 `[470,609]`, C4 `[610,789]`, C5 `[790,999]`. Fade/lift in over `motion.fade` = 10 frames at each window start; replace old fragment at that frame, no cross-fade with mixed text. No caption before 40; no caption reset at 910. Intro springs use the existing pop values; objects do not pop again on split or ACK except the standard result-square pop, which has long settled before 910.

Travel is by path length: at departure+11, halfway; at departure+22, ownership transfers atomically. Intervals are half-open for token presence despite inclusive phase ranges: departure owns the route, arrival owns the destination. Split deletes the original and creates exactly three copies on the same frame; no retained exchange original. No extra illustrative acceptance-return token: the check at frame 122 is the confirmation. The return path belongs only to invoice, outside its outbound Subscriber label, never to the exchange or API. Returned invoice token keeps the failure outline; no successful redelivery is implied.

Validation of flow data: unique node/route/copy ids; known source/target nodes; finite integer event and dwell boundaries; from <= to for phases, start < end for travel/dwell; events in their phase; route duration equals `motion.travel`; explicit dwell endpoints match travel endpoints; split is exactly one-to-three at exchange; no overlapping ownership for a copy or creation/consumption outside the table; ACK removes only its copy; invoice return ends at its own queue. Every animation endpoint is <910; the terminal queue dwell may end at duration 1000 because it is stationary, not an animation. No need to reject the final phase ending at 909, or a stationary copy persisting through outro.

Pure frame tests freeze the table and evaluate `F−1/F/F+1` at all boundaries, trip midpoints and forward/backward/shuffled seeks. Tests cannot prove visual fit: owner stills are a separate gate.

### 4. Source text table and provenance

Sources:

- EN `https://brunosouzas.com/wiki/publish-subscribe-in-mulesoft/`
- PT `https://brunosouzas.com/pt/wiki/publish-subscribe-in-mulesoft/`

Read Markdown inline-code backticks as formatting, not screen characters. C2 is a verbatim **lowercase** fragment of the article sentence, not the capitalised paraphrase in the brief. C3/C4 split the semicolon sentence without adding punctuation. No rewriting or added ellipses.

| Key | EN | PT |
|---|---|---|
| API | Orders API | API de pedidos |
| Application subtitle (every app) | (Mule application) | (aplicação Mule) |
| MQ tab | Anypoint MQ | Anypoint MQ |
| Exchange kind | Message exchange | Message exchange |
| Exchange identifier | order-created | order-created |
| Publish edge | Publish | Publish |
| Binding edge (each) | binding | binding |
| Queue kind (each) | queue | fila |
| Queue ids | order-created-payment; order-created-inventory; order-created-invoice | order-created-payment; order-created-inventory; order-created-invoice |
| Subscriber edge (each) | Subscriber | Subscriber |
| Payment app | Payment consumer | Consumidor de pagamento |
| Inventory app | Inventory consumer | Consumidor de estoque |
| Invoice app | Invoice consumer | Consumidor de nota fiscal |
| C1 | The orders API publishes the event to the order-created message exchange. | A API de pedidos publica o evento no message exchange order-created. |
| C2 | by default, it sends each message to every bound queue | por padrão, ele envia cada mensagem a todas as filas ligadas |
| C3 | If the invoice consumer fails, its copy goes back to the order-created-invoice queue for redelivery; | Se o consumidor de nota fiscal falhar, a cópia dele volta para a fila order-created-invoice para nova entrega; |
| C4 | the payment and inventory copies are on other queues and carry on normally | as cópias do pagamento e do estoque estão em outras filas e seguem normalmente |
| C5 | The orders API has already received the Publish confirmation and never learns about the failure. | A API de pedidos já recebeu a confirmação do Publish e não fica sabendo da falha. |

C1 comes from “The order-created event…” / “O evento…” paragraph immediately after the MQ diagram. C2 from the first MQ section paragraph; C3–C5 from the comparison section's final paragraph. Freeze expected strings and diagram labels in `test/fixtures/publish-subscribe-text.json` with URLs/section provenance and check both text tables against it. This tests transcription drift, not live publication; owner compares it to the sources at gate 1/stills review. Both language tables have identical key structure; wrapping is view data, never an identifier rewrite.

### 5. Independent layout per format

**16:9**: preserve source topology with API above, MQ enclosing exchange and three columns of queues, consumers below. Suggested allocation (composition pixels): API band y30–175; Publish corridor 175–260; MQ body x50–1870, y260–700; exchange centred in y290–435; binding corridor y435–535; queues y535–665; Subscriber corridor y700–790; consumers y790–965; caption band y985–1075 (after §7). Queue columns ~540 px wide allow mono identifiers at 30 px (22 chars ~396 px plus rails/padding). Consumer names can wrap at word boundaries to keep >=54 px; subtitles 30 px. Reserve invoice return lane to the right of its outbound lane, inside the canvas, not through captions. These are bands, not a requirement to copy static SVG coordinates.

**4:5**: reject three side-by-side queues: `order-created-inventory` alone takes roughly 396 px at mono 30, before padding. Use three **rows** with queues in a left MQ column and consumer apps on the right outside it. API remains above; exchange above queues inside MQ. Bindings leave the exchange as one trunk (x 40) down the container's left side with one short branch into each queue row, like the landscape's single drop line, not three parallel lanes; Subscriber routes leave each queue rightward to its matching consumer. Return path leaves the invoice consumer's bottom edge, runs below the MQ body (y 1180) and enters the invoice queue from below, separated from its Subscriber path and from the trunk.

Concrete portrait budget (after the designer review spread the rows, and after the §7 line-weight change budgeted the 19 px shadows): API x235–845, y20–165; Publish corridor (x 645) to exchange; MQ body x20–615, y220–1140, tab at its upper-left; exchange x55–575, y275–420, so its shadow ends above the first row's labels; queue rows x90–580 at y490–615, 735–860, 980–1105 (pitch 245), shadows inside the MQ body. Queue id remains one complete mono line at 30 px with at least 420 px clear text width (rail insets included); queue kind 30 px; parked tokens at x145, y+95, clear of rail and outline. Right consumer column x690–1058 on its own rhythm (y356–600, 631–875, 906–1150, height 244 so a three-line Portuguese name and its subtitle clear the 9 px border), joined to its queue row by a short jog at x 645 outside the MQ shadow; names wrap to up to three lines at 54 px, subtitle 30 px, padded 48 px on both sides, with the ACK check left of it and the failure cross mirrored right of it. “Consumidor / de nota / fiscal” and “Consumidor / de / pagamento” are valid word wrapping, not different text. If a name needs four lines, increase its row's height within the diagram band rather than shrinking the font. Subscriber label is 30 px, **above** its short path; text may extend into clear space beside the queue/consumer, never across their names. The final result must satisfy bounds, not blindly enforce these provisional coordinates.

Caption region x40–1040, y1210–1345: 38 px bold Lato, line height 1.15, up to three lines (the longest, PT C3, needs three at 1000 px), no state chip; the diagram, return lane included, ends by y1201. Reserve this region even for the short captions. Longest C3 in PT fits by wrapping; no identifier truncation, font shrinking, scrolling or extra sentence invention. In diagrams, application and exchange names use >=54 px; identifiers/edge labels/subtitles/queue-kind labels >=30 px. Use 700/900 font tokens, mono identifiers and unrotated type. No uniform scaling of landscape.

Layer order: rings, MQ body, arrows, shape bodies, tokens, labels/marks/tab, captions. Clip neither shadows nor routes. Endpoint anchors/queue token parking points have their own blank space separate from identifier text. Keep text away from travel paths, even if tokens draw above shape bodies. New layout tests check diagram and caption bounding boxes, text-size minima and route anchors; rendered stills remain the authority for real font metrics and overlap.

### 6. Review and render evidence

Standard stills: phase ends 239, 469, 609, 789, 909 plus 999, **24 PNGs** across four compositions. Supplementary frames 39, 111, 122, 291, 302, 481, 550, 580, 610, 651, 662 prove intro, travel/split and acknowledgment boundaries that phase-end stills miss. Render these with `npx remotion still src/index.ts <composition-id> out/stills/<composition-id>/<frame>.png --frame=<frame> --overwrite` **after** the standard stills run (which clears the folder). Standard command/count remains 24; supplemental review output adds 44 PNGs. Review all PT/EN/format variants, not just a representative pair.

The owner approves stills before `npm run render -- publish-subscribe`. Render four hardware-when-available masters and x264 CRF30 web copies via existing script. Inspect metadata with bundled ffmpeg; count decoded frames using `npx remotion ffmpeg -i out/web/<id>.mp4 -map 0:v:0 -f null -` (final frame counter 1000), inspect 30 fps/dimensions and no audio, compare file sizes. Extract phase, travel, failure and final frames from **web copies**, build a contact sheet with available full ffmpeg or an image compositor (bundled ffmpeg lacks `tile`), and review all videos. Record actual time and size; never predict them as results. No offline-font fallback claim.

### 7. Scene-diagram line weight (owner request after gate-1 stills)

**Request.** The owner asked for outlines and hard shadows as bold as the site's static body diagram (`eip-architecture-en.svg` in the brain, 800 px wide, shown at about 800 px). Covers and banners stay exactly as they are: they are not in this repository and nothing in them reads these tokens (README: the site and the diagram generators do not consume the tokens yet).

**Measured reason.** The static diagram draws blocks with stroke 4, arrows with stroke 3, a 13 px arrowhead and an 8 px hard shadow at its display size. A 1920x1080 scene is shown at about 800 px (factor 2.4) and a 1080x1350 one at about 420 px on a phone (factor 2.57), so the old tokens displayed about 2.3x thinner than the diagram (block outline 4 → 1.7 px, shadow 10 → 4.2 px). Values were tuned by downscaling a 16:9 still to 800 px beside the static SVG rendered at 800 px (`out/review/compare-static-vs-scene.png`) and by viewing the 4:5 stills at phone width.

| Token | Old | New | Displayed at 800 px (16:9) |
| --- | --- | --- | --- |
| `outline.block` | 4 | 9 | 3.75 (diagram 4) |
| `outline.arrow` | 4 | 7 | 2.9 (diagram 3) |
| `outline.small` | 3 | 6 | 2.5 (diagram tab/rails 3) |
| `shadow.block` | 10 | 19 | 7.9 (diagram 8) |
| `shadow.pill` | 6 | 12 | 5 |
| `shadow.small` | 4 | 6 | 2.5 |
| `radius.block` | 18 | 28 | 11.7 (diagram 14) |
| `radius.pill` | 22 | 30 | keeps one-line pills and tabs fully rounded |
| `radius.small` | 6 | 10 | 4.2 |

`shadow.small` stops at 6 (not 8): with 8, an ink "blocked" call square's shadow joined the next ink square. Shadows stay hard ink offsets; nothing is blurred.

**Component constants (foundation design §8).** Only `ARROW_HEAD_SIZE` grows, 22 → 31, so the head keeps the diagram's head-to-stroke ratio (13/3). Unchanged on purpose: rings stroke 2.5 and step 34 (background, not an outline), travelling/positioned token radius 17 (it already reads at its outline of `outline.small + 1`), countdown inner stroke 10 (a fill indicator, not an outline), countdown inset 7, block gap 18.

**Layout changes caused by the thicker outlines and shadows.**
- Publish-subscribe 16:9: consumer blocks 165 → 175 high with docks at y930, so the 9 px border no longer cuts the subtitle; caption band y965/h105 → y985/h90 so block shadows (to y984) stay above it; queues 130 → 125 high and queue docks y650 → y635 so parked tokens clear the queue outline and queue shadows stay inside the MQ body; Subscriber labels y730 → y740, below the MQ shadow; consumer docks x+24 → x+30, clear of the border. The subtitle sits at `footer − 14 − outline.block` in `Scene.tsx`, the same distance from the block's outer edge as before.
- Publish-subscribe 4:5: the portrait budget in §5 (exchange lowered and narrowed into the MQ, rows at pitch 245, consumer column on its own rhythm, jog at x 645, MQ 595 wide).
- Circuit breaker: the TIMELINE and `test/scenes/circuit-breaker.test.ts` are unchanged. Three collision fixes only: the six arrows that end on a block's shadowed side (right or bottom: 16:9 `toHalf`, `halfToOpen`, `halfToClosed`; 4:5 the same three) end about 11 px earlier along their last direction, so the 31 px arrowhead meets the 19 px shadow instead of entering it (the old ends touched the 10 px shadow); call-square gap `0.28 × size` → `0.35 × size` (`SQUARE_GAP` in `Scene.tsx`), because ink "blocked" squares merged with their neighbours' shadows; 4:5 `size.square` 36 → 34, so eight squares with the wider gap still fit the 410 px CLOSED block. The scene is re-rendered; its approved look changes only in line weight, shadow offset and that spacing.

## Risks / Trade-offs

- Portrait crowding → independent rows, minimum type sizes, blank routing lanes and stills gate; adjust coordinates, not story or words. Geometry above is a starting allocation, not visual approval.
- C3 describes the failure slightly before its mark → it introduces the conditional while copies are consumed; C4 then explains independence during the failure/return. This follows the requested order but should be checked in owner review.
- AUTO acknowledgment is not universal → scene depicts the article's AUTO configuration with a propagated error; no claim about IMMEDIATE or MANUAL and no extra explanatory label.
- Publish check mistaken for queue-delivery acknowledgment → show check at 122, queue copies only at 302, and keep final source caption. Do not animate an ACK back from queues to API.
- Over-generalising the catalogue → keep state-machine alias and semantics; new tests in separate files so unchanged old tests demonstrate compatibility.
- Springs may never be mathematically static → clamp settled flow appearance before outro; compare all 90 final frames' returned visual state.

## Migration Plan

Spec-only commit on `ab138-publish-subscribe-scene`, draft PR, independent Codex review, then owner gate 1. Claude implements after approval, tests catalogue first, then primitives and scene; no pilot data or pinned-test edits. Owner stills gate precedes render. Update README/roadmap, run full checks, archive on this branch only after implementation, and send gate 2 for owner merge. No deployment. Rollback is reverting this scene/contract change to the previous commit; generated media is rebuildable and not committed (DEL-3/4).

## Decisions taken for gate 1

1. Keep a compatible legacy `SceneData` alias and add a narrow common union rather than replacing the pilot timeline.
2. Use 1000 frames, exact phase/event windows above, final caption from 790 and static outro from 910.
3. Split the failure sentence into C3/C4; preserve lowercase C2 and punctuation as literal fragments rather than use the brief's capitalisation/full stop.
4. Show confirmation/ACK/failure by existing glyph squares, with no extra ACK/NACK text; keep the returned copy failure-outlined and the API check persistent.
5. Promote only the three shapes and positioned-token drawing to brand; scene owns split and return semantics. Add no token or dependency (token values change at the owner's request, §7).
6. Use a left MQ/right-consumer portrait row layout and the text-size/band budget above, landscape columns, and supplementary stills beyond standard phase ends.

No unresolved implementation decision; these choices are proposals for owner approval, not evidence of visual approval. Independent spec review is intentionally left to Codex after this executor's commit.

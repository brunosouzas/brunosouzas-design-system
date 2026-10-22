# Design: publish-subscribe-scene

## Context

See proposal.md for motivation. Observed (DES-4):

- `src/brand/motion.ts` exposes `Timeline<S,T>`, state phases, `blockContents`, slots, focus, transition fires and captions selected by state. These describe a state machine, not message ownership.
- `SceneData` in `src/scenes/catalogue.ts` currently requires that timeline. `compositionsOf` only needs its duration; `scripts/stills.ts` only needs phase ends and duration. `checkTimeline` combines common range checks with state-machine fire-window checks.
- `src/Root.tsx` maps ids to React components. `scripts/{cli,stills,render}.ts` import data without React/font loading. Keep this boundary.
- `test/scenes/circuit-breaker.test.ts` pins the approved pilot; `catalogue.test.ts` constructs legacy `SceneData` fixtures and asserts diagnostics. The circuit-breaker `scene.ts`, `layout.ts`, `Scene.tsx` and existing test files are not migration targets.
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

Verification: new catalogue/flow suites plus **all existing tests unchanged**, particularly the pinned timeline. Composition ids, output directories, frame sets and circuit-breaker playback do not change. No security/operational change: safe ids and `out/` containment remain; no new network use beyond existing browser/font loading.

### 2. Scene-owned choreography, reusable drawing primitives

Keep `src/scenes/publish-subscribe/{scene.ts,text.ts,timeline.ts,layout.ts,flow.ts,Scene.tsx}`. `scene.ts` exports metadata with a React-free timeline. `flow.ts` returns token ownership, positions/route progress, marks and caption key from a frame; validation checks the authored event/dwell tables. Absolute-frame interval evaluation, never hooks accumulating state or random timers: arbitrary Studio seeks produce the same result.

Generic additions to `src/brand/components.tsx` (or adjacent brand module):

- `Exchange`: elongated six-vertex outline, white fill and hard shadow; arbitrary children and scene bounds.
- `Queue`: white rounded body with two inset vertical rails; arbitrary children and bounds.
- `TaggedContainer`: white rounded body and yellow pill tab accepting supplied label/content, bounds and pop-in. It owns no topology or MQ string. Reuse existing `InkBlock`, `Pill` styling internally where suitable; allow a token-supplied fill for the tab rather than recolouring all existing pills.
- A positioned token primitive using the existing circle radius 17, hard `shadow.small`, white fill and `outline.small + 1` stroke. Position may be a stationary point or the result of `pointAlong(path,progress)`. Null path points are guarded. Do not change existing `Tokens` behaviour.

Reuse existing Arrow, Rings, CallSquare and pop/fade functions. Generic path travel stays in `src/brand/motion.ts`; **split identities, dwell ownership, ACK/NACK, route selection and copy counts remain in the scene**, not branded components. A return path is an ordinary scene-supplied path, not a new brand component. Reject broker-specific components in brand (would couple identity to article claims); reject a generic token-splitting engine (one declarative fan-out in one scene does not justify it).

All colours, outline/shadow/radius/font-family/weight and motion values come from generated tokens. API and all three consumers keep `color.healthy`; exchange/queues/container use `color.white`; tab uses `color.transitional` as in the source diagram; normal strokes ink, invoice failure mark and return stroke `color.failure`. No orange fail-fast or red API. Check/cross squares retain existing white/ink and failure/white styling. There is no extra on-screen `ACK`, `NACK`, title or phase label; those terms below describe behaviour, not new labels.

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
| `failure` | `[610,789]`; invoice failure mark at 610, invoice copy still at consumer until 640; return arrow draws 610–630 with failure stroke and no extra label; return trip `[640,662)`; invoice queue dwell `[662,1000)` | C4 from 610; phase still 789; supplementary 610, 651, 662 |
| `final` | `[790,909]`; API check remains; two ACK marks remain; failure mark remains; invoice copy waits with failure outline | C5 from 790; phase still 909 |
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

**16:9**: preserve source topology with API above, MQ enclosing exchange and three columns of queues, consumers below. Suggested allocation (composition pixels): API band y30–175; Publish corridor 175–260; MQ body x50–1870, y260–700; exchange centred in y290–435; binding corridor y435–535; queues y535–665; Subscriber corridor y700–790; consumers y790–940; caption band y960–1060. Queue columns ~540 px wide allow mono identifiers at 30 px (22 chars ~396 px plus rails/padding). Consumer names can wrap at word boundaries to keep >=54 px; subtitles 30 px. Reserve invoice return lane to the right of its outbound lane, inside the canvas, not through captions. These are bands, not a requirement to copy static SVG coordinates.

**4:5**: reject three side-by-side queues: `order-created-inventory` alone takes roughly 396 px at mono 30, before padding. Use three **rows** with queues in a left MQ column and consumer apps on the right outside it. API remains above; exchange above queues inside MQ. Bindings route from the exchange down separate left-side lanes into the queue rows; Subscriber routes leave each queue rightward to its matching consumer. Return path uses an offset route from invoice consumer back to the invoice queue, separated vertically from its Subscriber path.

Concrete portrait budget: API x240–840, y20–165; Publish corridor to exchange; MQ body x30–620, y220–1020, tab at its upper-left; exchange x90–585, y270–390; queue rows x95–585 at y410–540, 635–765, 860–990. Queue id remains one complete mono line at 30 px with at least 420 px clear text width (rail insets included); queue kind 30 px. Right consumer column x700–1040, with corresponding row centres 475/700/925; app boxes use up to 220 px height and names wrap to up to three lines at 54 px (line height 1.05), subtitle 30 px and result square in an allocated corner or beside the subtitle. “Consumidor / de nota / fiscal” and “Consumidor / de / pagamento” are valid word wrapping, not different text. If a name needs four lines, increase its row's height within the diagram band rather than shrinking the font. Subscriber label is 30 px, **above** its short path; text may extend into clear space beside the queue/consumer, never across their names. The final result must satisfy bounds, not blindly enforce these provisional coordinates.

Caption region x40–1040, y1060–1330: 38 px bold Lato, line height 1.15, up to six lines, no state chip. Reserve this region even for the short captions. Longest C3 in PT fits by wrapping; no identifier truncation, font shrinking, scrolling or extra sentence invention. In diagrams, application and exchange names use >=54 px; identifiers/edge labels/subtitles/queue-kind labels >=30 px. Use 700/900 font tokens, mono identifiers and unrotated type. No uniform scaling of landscape.

Layer order: rings, MQ body, arrows, shape bodies, tokens, labels/marks/tab, captions. Clip neither shadows nor routes. Endpoint anchors/queue token parking points have their own blank space separate from identifier text. Keep text away from travel paths, even if tokens draw above shape bodies. New layout tests check diagram and caption bounding boxes, text-size minima and route anchors; rendered stills remain the authority for real font metrics and overlap.

### 6. Review and render evidence

Standard stills: phase ends 239, 469, 609, 789, 909 plus 999, **24 PNGs** across four compositions. Supplementary frames 39, 111, 122, 291, 302, 481, 550, 580, 610, 651, 662 prove intro, travel/split and acknowledgment boundaries that phase-end stills miss. Render these with `npx remotion still src/index.ts <composition-id> out/stills/<composition-id>/<frame>.png --frame=<frame> --overwrite` **after** the standard stills run (which clears the folder). Standard command/count remains 24; supplemental review output adds 44 PNGs. Review all PT/EN/format variants, not just a representative pair.

The owner approves stills before `npm run render -- publish-subscribe`. Render four hardware-when-available masters and x264 CRF30 web copies via existing script. Inspect metadata with bundled ffmpeg; count decoded frames using `npx remotion ffmpeg -i out/web/<id>.mp4 -map 0:v:0 -f null -` (final frame counter 1000), inspect 30 fps/dimensions and no audio, compare file sizes. Extract phase, travel, failure and final frames from **web copies**, build a contact sheet with available full ffmpeg or an image compositor (bundled ffmpeg lacks `tile`), and review all videos. Record actual time and size; never predict them as results. No offline-font fallback claim.

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
5. Promote only the three shapes and positioned-token drawing to brand; scene owns split and return semantics. Add no token or dependency.
6. Use a left MQ/right-consumer portrait row layout and the text-size/band budget above, landscape columns, and supplementary stills beyond standard phase ends.

No unresolved implementation decision; these choices are proposals for owner approval, not evidence of visual approval. Independent spec review is intentionally left to Codex after this executor's commit.

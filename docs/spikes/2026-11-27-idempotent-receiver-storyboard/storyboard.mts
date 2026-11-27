// Gate 0 storyboard of SW-160 (EIP videos: Idempotent Receiver, book + Mule):
// three concepts, each drawn for both reusable scene types (the "book" scene
// with EIP icons and the "Mule" scene with components), as contact sheets.
//
// Storyboard notation, not a scene: every frame is a 960 x 540 stage drawn only
// with the package's pieces (src/pieces), serialised with toSvg and the Source
// faces embedded (embedFonts, ADR 0008). The words under each frame (number,
// beat, article line) are on the sheet, never inside the frame (motion skill,
// "Storyboards and the cast"). Nothing here is shipped or tested.
//
// Source of every beat: brunosouzas-content at 0162e3a,
// writing/integration-patterns-in-mulesoft/idempotent-receiver-in-mulesoft.{en,pt}.md
// (the Portuguese page has the same line numbers).
//
// How to run (from the repository root):
//   npx tsx docs/spikes/2026-11-27-idempotent-receiver-storyboard/storyboard.mts <out-dir> [A|B|C]
// It writes <out-dir>/<concept>-<scene>.svg; render.sh in this folder also
// turns each sheet into a PNG with `npm run png` and times each concept.
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { tokens } from "../../../tokens/generated/tokens.ts";
import { embedFonts } from "../../../src/fonts/embed.ts";
import {
  balao, checkBadge, countBadge, diagramBox, eipIcon, emote, messageArrow, priceTag, questionToken, rings, serverStack, sheet, stamp, storeNode,
} from "../../../src/pieces/library.ts";
import { el, g, type Drawn, type SvgNode } from "../../../src/pieces/node.ts";
import { toSvg } from "../../../src/pieces/render.ts";

const W = 960;
const H = 540;
const WORD = 33; // the scenes' minimum word size in stage units (circuit-breaker-topology design §2.2)
const STRONG = 36; // states, codes and counters

// ------------------------------------------------------------------ helpers

type Frame = { beat: string; source: string; draw: Drawn[] };
type Sheet = { id: string; title: string; subtitle: string; frames: Frame[] };

const wrap = (d: Drawn, attrs: Record<string, string | number>): Drawn => ({
  body: d.body.length > 0 ? [g(attrs, ...d.body)] : [],
  text: d.text.length > 0 ? [g(attrs, ...d.text)] : [],
});
/** A drawing left over from take 1, shown faded beside take 2 (the topology scene's "ghost"). */
const ghost = (d: Drawn): Drawn => wrap(d, { opacity: tokens.motion.dimOpacity });
/** A drawing scaled about a point (a prop whose own type is too small for the 33-unit rule). */
const scaled = (d: Drawn, k: number, cx: number, cy: number): Drawn => wrap(d, { transform: `translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})` });

/** The dashed motion path a travelling object follows (scene.* tokens). */
const motionPath = (d: string): Drawn => ({
  body: [el("path", {
    d, fill: "none", stroke: tokens.scene.pathColor, "stroke-width": tokens.scene.pathWidth,
    "stroke-dasharray": `${tokens.scene.pathDash} ${tokens.scene.pathGap}`, "stroke-linecap": "round",
  })],
  text: [],
});

/** A store with nothing in it: the piece's shape without its words (storeNode requires a line of text). */
const emptyStore = (x: number, y: number, width: number, height: number): Drawn => ({ body: storeNode({ x, y, width, height, text: ["-"] }).body, text: [] });
const store = (x: number, y: number, width: number, height: number, word: string | null): Drawn =>
  word === null ? emptyStore(x, y, width, height) : storeNode({ x, y, width, height, text: [word], textSize: STRONG });

/** A message token: a pill with one word or number (white in flight, a state colour once it has one). */
const token = (cx: number, cy: number, word: string, fill = "color.white"): Drawn => {
  const width = Math.max(84, Math.round(word.replace(/`/g, "").length * 19 + 44));
  return diagramBox({ x: cx - width / 2, y: cy - 28, width, height: 56, shape: "pill", text: [word], fill, textSize: STRONG });
};
/** A counter (the statement's charges, a take number), scaled so its figure reads at 36 units or more. */
const counter = (cx: number, cy: number, text: string): Drawn => scaled(countBadge({ cx, cy, text, textSize: STRONG }), 1.25, cx, cy);

/** One frame: the panel, faint rings, then each drawing's shapes outlined in ink and its words above them. */
const stage = (draw: Drawn[]): SvgNode[] => [
  el("rect", { width: W, height: H, fill: tokens.color.panel }),
  ...rings({ cx: W / 2, cy: H / 2 + 20, radius: tokens.scene.ringRadius, count: 9 }).body,
  ...draw.flatMap((d) => [
    g({ stroke: tokens.color.ink, "stroke-width": tokens.outline.block, "stroke-linejoin": "round" }, ...d.body),
    g({ "font-family": tokens.font.sans, "font-size": WORD, "font-weight": tokens.font.weightBold, fill: tokens.color.ink, "text-anchor": "middle" }, ...d.text),
  ]),
];

// ------------------------------------------------------------------ contact sheet

const K = 0.45; // frame scale on the sheet
const FW = W * K;
const FH = H * K;
const GAP = 28;
const COLS = 3;
const CAPTION = 112;
const HEADER = 116;

/** Splits a text into lines of about `max` characters. */
const lines = (text: string, max: number): string[] => {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line.length > 0 && line.length + 1 + word.length > max) {
      out.push(line);
      line = word;
    } else line = line.length > 0 ? `${line} ${word}` : word;
  }
  if (line.length > 0) out.push(line);
  return out;
};

const contactSheet = (s: Sheet): SvgNode => {
  const rows = Math.ceil(s.frames.length / COLS);
  const width = COLS * FW + (COLS + 1) * GAP;
  const height = HEADER + rows * (FH + CAPTION + GAP);
  const sans = { "font-family": tokens.font.sans, fill: tokens.color.ink };
  const cells = s.frames.map((f, i) => {
    const x = GAP + (i % COLS) * (FW + GAP);
    const y = HEADER + Math.floor(i / COLS) * (FH + CAPTION + GAP);
    const beat = lines(`${i + 1}. ${f.beat}`, 58);
    const source = lines(f.source, 70);
    return g({},
      // A nested svg scales the 960 x 540 stage into the cell and clips what falls outside it.
      el("svg", { x, y, width: FW, height: FH, viewBox: `0 0 ${W} ${H}` }, ...stage(f.draw)),
      el("rect", { x, y, width: FW, height: FH, fill: "none", stroke: tokens.brand.light.border, "stroke-width": 1.5 }),
      ...beat.map((line, j) => el("text", { ...sans, x, y: y + FH + 22 + j * 19, "font-size": 15, "font-weight": j === 0 ? 700 : 400 }, line)),
      ...source.map((line, j) => el("text", { ...sans, x, y: y + FH + 26 + beat.length * 19 + j * 16, "font-size": 13, fill: tokens.brand.light.textMuted }, line)),
    );
  });
  return el("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: `0 0 ${width} ${height}`, width, height },
    el("rect", { width, height, fill: tokens.color.white }),
    el("text", { ...sans, x: GAP, y: 44, "font-size": 26, "font-weight": 700 }, s.title),
    ...lines(s.subtitle, 150).map((line, j) => el("text", { ...sans, x: GAP, y: 74 + j * 20, "font-size": 15, fill: tokens.brand.light.textMuted }, line)),
    ...cells,
  );
};

// ------------------------------------------------------------------ article lines

const L = {
  once: "L28 (+ book diagram, L30-32): the sender sends a message only once",
  twice: "L28 (+ book diagram, L30-32): the receiver may receive it more than once",
  keeps: "L28 (+ book diagram): the receiver keeps the ID of each processed message; looks up the processed IDs",
  ignores: "L28 (+ book diagram): it ignores any message that arrives with a known ID",
  same: "L28: idempotent = the same effect whether received once or several times",
  receives: "L38: the endpoint receives { orderId, amount }; the validator sits in the flow, after the source",
  stores: "L109: the validator stores the ID when it accepts the message, before the rest of the flow runs",
  fails: "L109 + L122: the test makes storing the charge fail; the first attempt answers 500",
  stays: "L109 + L122: the validator does not remove the ID; the orderId stays in the store",
  retry409: "L122: the retry gets 409, duplicate (L36: MULE:DUPLICATE_MESSAGE; L44: answers 409)",
  zero: "L122: the statement ends with zero charges: the order is never charged",
  quiet: "L122: a quieter error than a double charge, because the retry got back a 409",
  charged: "L44: with a new ID the flow charges and answers accepted; each charge is an entry in a statement",
  once409: "L95 + L159: the same order in two requests is charged once; the second comes back as duplicate",
};

// ------------------------------------------------------------------ the book stage (concepts A and B)
// Sender -> channel (point-to-point) -> Idempotent Receiver, the processed IDs below the receiver,
// the outcomes on the right: the processed message (green) and the ignored duplicate (orange),
// the colours of the published book diagram's two exits.

const LANE = 212; // the message path
const bookStage = (o: { stored: boolean; lookup: boolean }): Drawn[] => [
  motionPath(`M166,${LANE} H520`),
  diagramBox({ x: 16, y: LANE - 32, width: 150, height: 64, shape: "pill", fill: "color.state.caller", text: ["Sender"], textSize: WORD }),
  eipIcon({ name: "point-to-point-channel", x: 196, y: LANE - 19.5 * 2.8, scale: 2.8 }),
  eipIcon({ name: "idempotent-receiver", x: 520, y: LANE - 24 * 3.4, scale: 3.4 }),
  messageArrow({ from: [640, 274], to: [640, 362], curve: "straight", heads: "both", dashed: !o.lookup, width: o.lookup ? 4 : 2.5 }),
  store(560, 366, 160, 128, o.stored ? "42" : null),
];
const processed = (cx = 852, cy = LANE): Drawn[] => [token(cx, cy, "42", "color.state.healthy"), checkBadge({ cx: cx + 50, cy: cy - 34, r: 22 })];
const ignored = (cx = 852, cy = 428): Drawn => token(cx, cy, "42", "color.state.blocked");
const inChannel = token(290, LANE, "42");
const atReceiver = token(492, LANE, "42");
const twoCopies = [token(448, LANE - 38, "42"), token(448, LANE + 38, "42")];

// ------------------------------------------------------------------ the Mule stage (concepts A and B)
// HTTP Listener -> Idempotent Message Validator -> Simulated charge (the published charge-flow
// diagram's names), the store under the validator, the statement (one sheet row per charge)
// under the charge. `left` makes room for the client in concept B.

type MuleOpts = { left: number; stored: boolean; lookup: boolean; charges: number };
const boxes = (left: number) => {
  const lis = { x: left, y: 150, w: 160, h: 112 };
  const val = { x: left + 200, y: 132, w: 236, h: 148 };
  const chg = { x: left + 476, y: 150, w: 176, h: 112 };
  return { lis, val, chg, statement: { x: chg.x + 34, y: 314 } };
};
const muleStage = (o: MuleOpts): Drawn[] => {
  const { lis, val, chg, statement } = boxes(o.left);
  return [
    motionPath(`M${o.left - 60},206 H${chg.x}`),
    diagramBox({ x: lis.x, y: lis.y, width: lis.w, height: lis.h, text: ["HTTP", "Listener"], textSize: WORD }),
    diagramBox({ x: val.x, y: val.y, width: val.w, height: val.h, text: ["Idempotent", "Message", "Validator"], textSize: WORD }),
    diagramBox({ x: chg.x, y: chg.y, width: chg.w, height: chg.h, text: ["Simulated", "charge"], textSize: WORD }),
    messageArrow({ from: [val.x + val.w / 2, val.y + val.h + 4], to: [val.x + val.w / 2, 370], curve: "straight", heads: "both", dashed: !o.lookup, width: o.lookup ? 4 : 2.5 }),
    store(val.x + 18, 374, 200, 122, o.stored ? "`orderId`" : null),
    sheet({ x: statement.x, y: statement.y, width: 108, height: 190, top: 52, step: 44, rows: Array.from({ length: o.charges }, () => ({ bar: 52, tail: "check" as const })) }),
  ];
};
/** The statement's charge count, on the statement's top-right corner. */
const charges = (left: number, n: number): Drawn => {
  const { statement } = boxes(left);
  return counter(statement.x + 108, statement.y, String(n));
};
/** An object riding on top of a box (tokens are drawn above blocks, SCN-6). */
const onBox = (b: { x: number; y: number; w: number }, word: string): Drawn => token(b.x + b.w / 2, b.y - 36, word);

// ------------------------------------------------------------------ concept A: the diagram comes alive (sequence)

const A_LEFT = 30;
const A = boxes(A_LEFT);
const conceptA = (): Sheet[] => [
  {
    id: "A-book",
    title: "Concept A, book scene: the diagram comes alive",
    subtitle: "One sequence on the published book diagram, laid left to right: the order travels, the receiver looks up, stores and ignores. EIP icons, no cast. About 18 s.",
    frames: [
      { beat: "The sender sends order 42 once into the channel.", source: L.once, draw: [...bookStage({ stored: false, lookup: false }), inChannel] },
      { beat: "The channel delivers it twice: two copies of 42 travel to the receiver.", source: L.twice, draw: [...bookStage({ stored: false, lookup: false }), ...twoCopies] },
      { beat: "Delivery 1 reaches the receiver; it looks up the processed IDs: 42 is not there. Delivery 2 waits in the channel.", source: L.keeps, draw: [...bookStage({ stored: false, lookup: true }), inChannel, atReceiver, questionToken({ cx: 700, cy: 318, scale: 1.6 })] },
      { beat: "It processes the message (green) and stores 42 with the processed IDs.", source: L.keeps, draw: [...bookStage({ stored: true, lookup: false }), ...processed(), inChannel] },
      { beat: "Delivery 2 reaches the receiver; the lookup finds 42, so the duplicate is ignored (orange).", source: L.ignores, draw: [...bookStage({ stored: true, lookup: true }), ...processed(), ignored()] },
      { beat: "Final hold (3 s): one processed message, 42 stored once, the duplicate set aside.", source: L.same, draw: [...bookStage({ stored: true, lookup: false }), ...processed(), ignored()] },
    ],
  },
  {
    id: "A-mule",
    title: "Concept A, Mule scene: the charge flow comes alive",
    subtitle: "One sequence on the published charge-flow diagram: the trap of lines 109 and 122, with the store and the statement on screen the whole time. Components, no cast. About 20 s.",
    frames: [
      { beat: "A charge request for orderId passes the HTTP Listener on its way to the validator.", source: L.receives, draw: [...muleStage({ left: A_LEFT, stored: false, lookup: false, charges: 0 }), onBox(A.lis, "`orderId`")] },
      { beat: "The validator stores orderId before the rest of the flow runs.", source: L.stores, draw: [...muleStage({ left: A_LEFT, stored: true, lookup: true, charges: 0 }), onBox(A.val, "`orderId`")] },
      { beat: "Storing the charge fails: the first attempt answers 500 (the red failure path).", source: L.fails, draw: [...muleStage({ left: A_LEFT, stored: true, lookup: false, charges: 0 }), messageArrow({ from: [A.chg.x + A.chg.w + 4, 206], to: [800, 206], curve: "straight", kind: "failure", width: 4 }), token(866, 206, "500", "color.state.failure")] },
      { beat: "The ID is not removed: orderId stays in the store, and the statement is empty.", source: L.stays, draw: [...muleStage({ left: A_LEFT, stored: true, lookup: false, charges: 0 }), token(866, 206, "500", "color.state.failure"), charges(A_LEFT, 0)] },
      { beat: "The retry arrives; the validator finds orderId and answers 409, duplicate (orange).", source: L.retry409, draw: [...muleStage({ left: A_LEFT, stored: true, lookup: true, charges: 0 }), onBox(A.lis, "`orderId`"), token(A.val.x + A.val.w / 2, 70, "409", "color.state.blocked")] },
      { beat: "Final hold (3 s): orderId in the store, the statement at 0 charges.", source: L.zero, draw: [...muleStage({ left: A_LEFT, stored: true, lookup: false, charges: 0 }), token(A.val.x + A.val.w / 2, 70, "409", "color.state.blocked"), charges(A_LEFT, 0)] },
    ],
  },
];

// ------------------------------------------------------------------ concept B: one stage, two takes (recommended)

const take = (n: string): Drawn => counter(912, 44, n);

const B_LEFT = 215;
const B = boxes(B_LEFT);
const CLIENT = { x: 112, ground: 336, scale: 0.8 };
/** Balão, the client that asks for the charge (ADR 0007: the requester acting), with its answer above its head and an emote beside it. */
const client = (o: { expression?: "idle" | "done" | "failed"; speaks?: boolean; answer?: [string, string]; emote?: "worked" | "problem" }): Drawn[] => [
  balao({ x: CLIENT.x, y: CLIENT.ground, scale: CLIENT.scale, facing: "right", expression: o.expression ?? "idle", speaks: o.speaks ?? false }),
  ...(o.answer ? [token(CLIENT.x, 140, o.answer[0], o.answer[1])] : []),
  ...(o.emote ? [emote({ kind: o.emote, x: 34, y: 214, scale: 0.75 })] : []),
];
/** The answer's way back to the client: from the top of the box that answers, over the stage, to the answer. */
const answerPath = (from: { x: number; y: number; w: number }, kind: "reply" | "failure"): Drawn =>
  messageArrow({ from: [from.x + from.w / 2, from.y - 4], to: [CLIENT.x + 60, 140], controls: [[from.x + from.w / 2, 60], [CLIENT.x + 160, 60]], kind, width: 3.5 });

const conceptB = (): Sheet[] => [
  {
    id: "B-book",
    title: "Concept B, book scene: one stage, two takes (recommended)",
    subtitle: "Take 1: the channel delivers order 42 once. Rewind. Take 2: it delivers it twice. Same stage, same effect: the book's definition of idempotent, shown. EIP icons, no cast. About 24 s.",
    frames: [
      { beat: "Take 1: the channel delivers order 42 once; the receiver looks up the processed IDs: not there.", source: L.keeps, draw: [...bookStage({ stored: false, lookup: true }), atReceiver, questionToken({ cx: 700, cy: 318, scale: 1.6 }), take("1")] },
      { beat: "Take 1 ends: processed once (green), 42 stored.", source: L.keeps, draw: [...bookStage({ stored: true, lookup: false }), ...processed(), take("1")] },
      { beat: "Rewind. Take 2: the same order, sent once, is delivered twice.", source: `${L.twice}; the rewind and the take numbers are the takes kind's reading devices (ADR 0004, 2026-11-12)`, draw: [...bookStage({ stored: false, lookup: false }), ...twoCopies, take("2")] },
      { beat: "Delivery 1 is processed and 42 is stored, as in take 1; delivery 2 waits in the channel.", source: L.keeps, draw: [...bookStage({ stored: true, lookup: false }), ...processed(), inChannel, take("2")] },
      { beat: "Delivery 2: the lookup finds 42; the duplicate is ignored (orange).", source: L.ignores, draw: [...bookStage({ stored: true, lookup: true }), ...processed(), ignored(), take("2")] },
      { beat: "Final hold: take 2 ends with take 1's effect (take 1's result faded beside it): one processed message.", source: L.same, draw: [...bookStage({ stored: true, lookup: false }), ...processed(), ghost(token(852, 320, "42", "color.state.healthy")), ignored(), take("2")] },
    ],
  },
  {
    id: "B-mule",
    title: "Concept B, Mule scene: one stage, two takes (recommended)",
    subtitle: "The client (Balão) sends the same order twice in both takes. Take 1: charged, 200, then 409. Take 2: 500, then 409. The same quiet 409; a statement of 1 against 0. Components and one cast member. About 30 s.",
    frames: [
      { beat: "Take 1: the validator stores orderId; the charge goes through (one statement row); 200 back to the client.", source: L.charged, draw: [...muleStage({ left: B_LEFT, stored: true, lookup: false, charges: 1 }), answerPath(B.chg, "reply"), ...client({ expression: "done", answer: ["200", "color.state.healthy"], emote: "worked" }), charges(B_LEFT, 1), take("1")] },
      { beat: "Take 1: the client sends the same order again; the validator finds orderId: 409. Still one charge.", source: L.once409, draw: [...muleStage({ left: B_LEFT, stored: true, lookup: true, charges: 1 }), answerPath(B.val, "reply"), ...client({ answer: ["409", "color.state.blocked"] }), charges(B_LEFT, 1), take("1")] },
      { beat: "Rewind. Take 2: the client asks for the charge; the validator stores orderId before the charge runs.", source: L.stores, draw: [...muleStage({ left: B_LEFT, stored: true, lookup: true, charges: 0 }), ...client({ speaks: true }), onBox(B.val, "`orderId`"), take("2")] },
      { beat: "Storing the charge fails: 500 back to the client (red); orderId stays in the store.", source: L.fails, draw: [...muleStage({ left: B_LEFT, stored: true, lookup: false, charges: 0 }), answerPath(B.chg, "failure"), ...client({ expression: "failed", answer: ["500", "color.state.failure"], emote: "problem" }), take("2")] },
      { beat: "The client retries; the validator finds orderId: the same 409 as in take 1.", source: L.retry409, draw: [...muleStage({ left: B_LEFT, stored: true, lookup: true, charges: 0 }), answerPath(B.val, "reply"), ...client({ answer: ["409", "color.state.blocked"] }), take("2")] },
      { beat: "Final hold: the statement at 0, take 1's 1 faded beside it. The 409 looked the same; this order was never charged.", source: `${L.zero}; ${L.quiet.slice(6)}`, draw: [...muleStage({ left: B_LEFT, stored: true, lookup: false, charges: 0 }), ...client({ answer: ["409", "color.state.blocked"] }), charges(B_LEFT, 0), ghost(counter(B.statement.x + 178, B.statement.y, "1")), take("2")] },
    ],
  },
];

// ------------------------------------------------------------------ concept C: the ID tag (close-up)
// The camera sits on the receiver's door. The message is a sheet with its ID on a tag; the processed
// IDs are a rack of tags (a store); a duplicate is caught when its tag matches one on the rack.

const TAG = 1.5; // the price tag's mono 22 scaled to 33 units
const tag = (x: number, y: number, word: string, width = 112): Drawn => scaled(priceTag({ x, y, text: word, width }), TAG, x, y);
const message = (x: number, y: number, word: string, o: { fill?: string; tagWidth?: number } = {}): Drawn[] => [
  sheet({ x, y, width: 92, height: 116, top: 40, step: 30, rows: [{ bar: 50 }, { bar: 40 }, { bar: 46 }], fill: o.fill ?? "color.white" }),
  tag(x + 92, y + 58, word, o.tagWidth),
];
const C_LANE = 240;
const doorBook = (stored: boolean): Drawn[] => [
  motionPath(`M20,${C_LANE} H330`),
  eipIcon({ name: "idempotent-receiver", x: 330, y: C_LANE - 24 * 4, scale: 4 }),
  emptyStore(350, 340, 260, 172),
  ...(stored ? [tag(400, 440, "42")] : []),
];
const tray = (): Drawn => sheet({ x: 720, y: 160, width: 110, height: 140, top: 46, step: 36, rows: [{ bar: 60 }, { bar: 46, tail: "check" }] });

const doorMule = (o: { stored: boolean; failing?: boolean; charges: number }): Drawn[] => [
  motionPath("M20,186 H330"),
  diagramBox({ x: 330, y: 112, width: 236, height: 148, text: ["Idempotent", "Message", "Validator"], textSize: WORD }),
  emptyStore(330, 330, 236, 172),
  ...(o.stored ? [tag(352, 424, "orderId", 128)] : []),
  serverStack({ x: 664, y: 112, width: 140, units: 2, ...(o.failing ? { failing: 1 } : {}) }),
  sheet({ x: 834, y: 300, width: 108, height: 204, top: 52, step: 44, rows: Array.from({ length: o.charges }, () => ({ bar: 52, tail: "check" as const })) }),
];

const conceptC = (): Sheet[] => [
  {
    id: "C-book",
    title: "Concept C, book scene: the ID tag (close-up)",
    subtitle: "Close on the receiver's door. Each message carries its ID on a tag; the processed IDs are a rack of tags. A duplicate is caught when its tag matches one on the rack. EIP icon, no cast. About 18 s.",
    frames: [
      { beat: "Delivery 1: order 42, with its ID tag, comes to the receiver.", source: L.twice, draw: [...doorBook(false), ...message(20, C_LANE - 58, "42")] },
      { beat: "The receiver checks the rack of processed IDs: no tag 42.", source: L.keeps, draw: [...doorBook(false), ...message(70, C_LANE - 58, "42"), questionToken({ cx: 666, cy: 400, scale: 1.6 })] },
      { beat: "Tag 42 goes on the rack; the message is processed (the checked sheet on the right).", source: L.keeps, draw: [...doorBook(true), tray()] },
      { beat: "Delivery 2: the same order 42 comes again.", source: L.twice, draw: [...doorBook(true), tray(), ...message(20, C_LANE - 58, "42")] },
      { beat: "Its tag matches the one on the rack: the duplicate is ignored (orange, set aside).", source: L.ignores, draw: [...doorBook(true), tray(), ...message(20, 380, "42", { fill: "color.state.blocked" })] },
      { beat: "Final hold: one tag on the rack, one processed message.", source: L.same, draw: [...doorBook(true), tray()] },
    ],
  },
  {
    id: "C-mule",
    title: "Concept C, Mule scene: the ID tag (close-up)",
    subtitle: "Close on the validator: it hangs the orderId tag on the rack (the object store) before the charge; the tag outlives the failed charge. Components as objects (server for the charge, a sheet for the statement), no cast. About 20 s.",
    frames: [
      { beat: "A charge request comes to the validator with its orderId tag.", source: L.receives, draw: [...doorMule({ stored: false, charges: 0 }), ...message(10, 128, "orderId", { tagWidth: 128 })] },
      { beat: "The validator hangs the tag on the rack before the charge runs; the request moves on.", source: L.stores, draw: [...doorMule({ stored: true, charges: 0 }), sheet({ x: 574, y: 140, width: 84, height: 104, top: 38, step: 28, rows: [{ bar: 44 }, { bar: 34 }] })] },
      { beat: "The charge fails (the server's red light): 500.", source: L.fails, draw: [...doorMule({ stored: true, failing: true, charges: 0 }), stamp({ cx: 734, cy: 290, word: "500", fill: "color.state.failure", r: 56 })] },
      { beat: "The tag stays on the rack.", source: L.stays, draw: [...doorMule({ stored: true, charges: 0 })] },
      { beat: "The retry's tag matches the one on the rack: 409 (orange stamp).", source: L.retry409, draw: [...doorMule({ stored: true, charges: 0 }), ...message(10, 128, "orderId", { tagWidth: 128 }), stamp({ cx: 70, cy: 300, word: "409", fill: "color.state.blocked", r: 56 })] },
      { beat: "Final hold: the tag on the rack, the statement with no rows: 0 charges.", source: L.zero, draw: [...doorMule({ stored: true, charges: 0 }), counter(888, 300, "0")] },
    ],
  },
];

// ------------------------------------------------------------------ main

const out = resolve(process.argv[2] ?? "out/storyboard");
const only = process.argv[3]; // "A", "B" or "C": one concept, for timing
mkdirSync(out, { recursive: true });
const concepts: Record<string, () => Sheet[]> = { A: conceptA, B: conceptB, C: conceptC };
for (const [key, make] of Object.entries(concepts)) {
  if (only !== undefined && only !== key) continue;
  for (const s of make()) {
    writeFileSync(resolve(out, `${s.id}.svg`), toSvg(await embedFonts(contactSheet(s))));
    console.log(`wrote ${s.id}.svg`);
  }
}

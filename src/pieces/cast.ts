// The cast (spec illustration-pieces, change cast-and-emotes, card 152):
// `mascot`, seven characters with a shared face, actions and named parts, and
// `emote`, eight reaction symbols with a fixed meaning (ADR 0005).
//
// Why here: covers, diagrams and scenes draw the same characters from one
// source; a scene animates them by recomputing parameters per frame and
// wrapping the piece in `pose`.
//
// The geometry is the approved spike's, ported unchanged
// (~/.hermes/spikes/design-system/cast-and-emotes/cast.mts). The frozen fixture
// test/fixtures/cast-0.5.0.json pins every call's output, so a refactor here
// must keep every hash.
import { drawn, el, g, type Drawn, type SvgNode } from "./node.ts";
import { colour, pos, type Schema } from "./params.ts";
import { definePiece } from "./piece.ts";

const c = (path: string): string => colour(path);

export const MASCOTS = ["dev", "agent", "architect", "devops", "data", "request", "message"] as const;
export const MASCOT_FACES = ["normal", "blink", "happy", "wink", "surprised", "worried", "thinking", "focused"] as const;
export const MASCOT_ACTIONS = ["none", "rest", "wave", "hold", "reach", "up", "shrug", "type"] as const;
export const EMOTE_KINDS = ["idea", "doubt", "problem", "worked", "refused", "pressure", "liked", "waiting"] as const;
export type MascotName = (typeof MASCOTS)[number];
export type MascotFace = (typeof MASCOT_FACES)[number];
export type MascotAction = (typeof MASCOT_ACTIONS)[number];
export type EmoteKind = (typeof EMOTE_KINDS)[number];
type Pt = [number, number];

const ink = () => c("color.ink");
const O = () => ({ stroke: ink(), "stroke-width": 4, "stroke-linejoin": "round" as const });
const shade = (d: string, dx = 8) => el("path", { d, fill: ink(), transform: `translate(${dx} ${dx})` });
const solid = (d: string, fill: string, dx = 8) => [shade(d, dx), el("path", { d, fill, ...O() })];
const shine = (d: string, col: string) => el("path", { d, fill: "none", stroke: col, "stroke-width": 9, "stroke-linecap": "round" });
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} H${x + r} Q${x},${y + h} ${x},${y + h - r} V${y + r} Q${x},${y} ${x + r},${y} Z`;

// ---------------------------------------------------------------- face (macs.ts)
export const face = (cx: number, cy: number, f: MascotFace, col: string, mouthFill: string): SvgNode => {
  const k = 1, dx = 24 * k;
  const eye = (x: number, right: boolean) => {
    if (f === "blink") return el("path", { d: `M${x - 9 * k},${cy} H${x + 9 * k}`, stroke: col, "stroke-width": 5 * k, "stroke-linecap": "round" });
    if (f === "happy" || (f === "wink" && right)) return el("path", { d: `M${x - 10 * k},${cy + 3 * k} Q${x},${cy - 10 * k} ${x + 10 * k},${cy + 3 * k}`, fill: "none", stroke: col, "stroke-width": 5 * k, "stroke-linecap": "round" });
    if (f === "focused") return el("path", { d: right ? `M${x + 10 * k},${cy - 6 * k} L${x - 8 * k},${cy} L${x + 10 * k},${cy + 6 * k}` : `M${x - 10 * k},${cy - 6 * k} L${x + 8 * k},${cy} L${x - 10 * k},${cy + 6 * k}`, fill: "none", stroke: col, "stroke-width": 5 * k, "stroke-linecap": "round", "stroke-linejoin": "round" });
    const s = f === "surprised" ? 1.35 : 1, o = f === "thinking" ? 5 * k : 0;
    return g({}, el("ellipse", { cx: x + o, cy: cy - o, rx: 7 * k * s, ry: 10 * k * s, fill: col }),
      el("circle", { cx: x + o + 2.5 * k, cy: cy - o - 4 * k, r: 2.6 * k, fill: c("color.white") }));
  };
  const by = cy - 22 * k, brow = (x: number, a: number, b: number) => el("path", { d: `M${x - 9 * k},${by + a * k} L${x + 9 * k},${by + b * k}`, stroke: col, "stroke-width": 4.5 * k, "stroke-linecap": "round" });
  const brows = f === "worried" ? [brow(cx - dx, 4, -3), brow(cx + dx, -3, 4)]
    : f === "surprised" ? [brow(cx - dx, -6, -8), brow(cx + dx, -8, -6)]
    : f === "thinking" ? [brow(cx + dx, 0, -7)] : [];
  const my = cy + 26 * k, ln = (d: string, fill = "none") => el("path", { d, fill, stroke: col, "stroke-width": 5 * k, "stroke-linecap": "round", "stroke-linejoin": "round" });
  const smile = ln(`M${cx - 12 * k},${my - 2 * k} Q${cx},${my + 11 * k} ${cx + 12 * k},${my - 2 * k}`);
  const mouth = {
    blink: smile,
    normal: smile,
    happy: ln(`M${cx - 15 * k},${my - 4 * k} Q${cx},${my + 16 * k} ${cx + 15 * k},${my - 4 * k} Z`, mouthFill),
    wink: ln(`M${cx - 12 * k},${my - 2 * k} Q${cx + 2 * k},${my + 12 * k} ${cx + 14 * k},${my - 6 * k}`),
    surprised: el("ellipse", { cx, cy: my + 4 * k, rx: 7 * k, ry: 9 * k, fill: mouthFill, stroke: col, "stroke-width": 4 * k }),
    worried: ln(`M${cx - 12 * k},${my + 5 * k} Q${cx},${my - 6 * k} ${cx + 12 * k},${my + 5 * k}`),
    thinking: ln(`M${cx - 7 * k},${my + 2 * k} L${cx + 10 * k},${my - 2 * k}`),
    focused: ln(`M${cx - 8 * k},${my} L${cx + 8 * k},${my}`),
  }[f];
  return g({ "data-part": "face" },
    g({ "data-part": "eyes" }, eye(cx - dx, false), eye(cx + dx, true)),
    brows.length ? g({ "data-part": "brows" }, ...brows) : null,
    g({ "data-part": "mouth" }, mouth));
};

// ---------------------------------------------------------------- limbs
type Family = { armWidth: number; legWidth: number; bend: number; offsets: Record<Exclude<MascotAction, "none">, [Pt, Pt]> };
// Arm targets as offsets from the shoulders (left, right). "computer" = macs.ts, "object" = mascots4.ts.
const COMPUTER: Family = {
  armWidth: 15, legWidth: 15, bend: 8,
  offsets: { rest: [[-20, 40], [20, 40]], wave: [[-20, 40], [30, -86]], hold: [[30, 50], [-30, 50]], reach: [[-20, 40], [70, -4]], up: [[-30, -90], [30, -90]], shrug: [[-44, -26], [44, -26]], type: [[26, 58], [-26, 58]] },
};
const OBJECT: Family = {
  armWidth: 16, legWidth: 16, bend: 8,
  offsets: { rest: [[-22, 34], [22, 34]], wave: [[-22, 34], [34, -92]], hold: [[0, 0], [0, 0]], reach: [[-22, 34], [70, -4]], up: [[-34, -96], [34, -96]], shrug: [[-46, -30], [46, -30]], type: [[26, 58], [-26, 58]] },
};
const arm = (from: Pt, to: Pt, side: number, w: number) => [
  el("path", { d: `M${from[0]},${from[1]} Q${(from[0] + to[0]) / 2 + side * 14},${Math.max(from[1], to[1]) + 8} ${to[0]},${to[1]}`, fill: "none", stroke: ink(), "stroke-width": w, "stroke-linecap": "round" }),
  el("ellipse", { cx: to[0], cy: to[1], rx: 15, ry: 12, fill: ink(), transform: `rotate(${side * 20} ${to[0]} ${to[1]})` }),
];

// ---------------------------------------------------------------- props (mascots4.ts)
const boardProp = (x: number, y: number) => [
  shade(rr(x, y, 104, 78, 10), 6), el("path", { d: rr(x, y, 104, 78, 10), fill: c("color.white"), ...O() }),
  el("path", { d: `M${x + 30},${y + 28} H${x + 52} V${y + 52} H${x + 74}`, fill: "none", stroke: ink(), "stroke-width": 3 }),
  el("rect", { x: x + 12, y: y + 18, width: 22, height: 20, rx: 4, fill: c("color.caller"), stroke: ink(), "stroke-width": 3 }),
  el("rect", { x: x + 70, y: y + 42, width: 22, height: 20, rx: 4, fill: c("color.healthy"), stroke: ink(), "stroke-width": 3 }),
  el("rect", { x: x + 42, y: y + 8, width: 20, height: 18, rx: 4, fill: c("color.transitional"), stroke: ink(), "stroke-width": 3 }),
];
const wrenchProp = (x: number, y: number) => {
  const d = `M${x},${y} L${x + 50},${y - 50} M${x + 50},${y - 50}`;
  return [
    el("path", { d, stroke: ink(), "stroke-width": 18, "stroke-linecap": "round" }),
    el("path", { d, stroke: c("cast.metal"), "stroke-width": 10, "stroke-linecap": "round" }),
    el("path", { d: `M${x + 40},${y - 74} A24,24 0 1 0 ${x + 76},${y - 40} L${x + 62},${y - 46} L${x + 56},${y - 60} Z`, fill: c("cast.metal"), ...O() }),
  ];
};
const magnifierProp = (x: number, y: number) => [
  el("path", { d: `M${x},${y} L${x + 24},${y - 24}`, stroke: ink(), "stroke-width": 16, "stroke-linecap": "round" }),
  el("circle", { cx: x + 44, cy: y - 44, r: 30, fill: c("cast.data.lens"), stroke: ink(), "stroke-width": 9 }),
  el("circle", { cx: x + 44, cy: y - 44, r: 30, fill: "none", stroke: c("color.caller"), "stroke-width": 4 }),
  el("path", { d: `M${x + 30},${y - 56} Q${x + 36},${y - 66} ${x + 48},${y - 66}`, fill: "none", stroke: c("color.white"), "stroke-width": 5, "stroke-linecap": "round" }),
];

// ---------------------------------------------------------------- the cast
type Char = {
  family: Family;
  /** Ground centre in the character's own box: the piece's anchor. */
  anchor: Pt;
  scale?: number;
  ground: number; // ground shadow rx
  shoulders: [Pt, Pt]; hips: [Pt, Pt]; foot: number;
  hold?: Pt; // object family: left mitten for "hold" (right one mirrored round x 105)
  faceAt: Pt; faceColour: string; mouthFill: string;
  /** Parts drawn between the legs and the face, in order. */
  parts: (headTilt: number) => SvgNode[];
  /** MascotFace inside the head group (agent) rather than on top of the body. */
  faceInHead?: boolean;
  prop?: () => SvgNode[];
};

const spark = (x: number, y: number) => el("path", { d: `M${x},${y - 14} L${x + 4},${y - 4} L${x + 14},${y} L${x + 4},${y + 4} L${x},${y + 14} L${x - 4},${y + 4} L${x - 14},${y} L${x - 4},${y - 4} Z`, fill: c("color.transitional"), ...O(), "stroke-width": 3 });

const CAST = (): Record<MascotName, Char> => ({
  // DEV: modern all-in-one. Screen frame = body, code on the screen, face on the screen, </> on the chin, stand.
  dev: {
    family: COMPUTER, anchor: [110, 230], ground: 80, shoulders: [[22, 118], [198, 118]], hips: [[86, 200], [134, 200]], foot: 226,
    faceAt: [110, 88], faceColour: ink(), mouthFill: c("cast.mouth"),
    parts: () => [
      g({ "data-part": "stand" }, ...solid("M88,184 H132 L140,212 H80 Z", c("cast.metal"), 6), ...solid(rr(62, 208, 96, 12, 6), c("cast.metal"), 5)),
      g({ "data-part": "body" },
        ...solid(rr(4, 24, 212, 168, 18), c("cast.dev.fill")),
        el("path", { d: "M8,152 H212 V174 Q212,188 198,188 H22 Q8,188 8,174 Z", fill: c("cast.dev.chin"), stroke: "none" }),
        el("path", { d: "M4,152 H216", stroke: ink(), "stroke-width": 4 }),
        el("path", { d: rr(18, 36, 184, 108, 10), fill: c("cast.dev.screen"), stroke: ink(), "stroke-width": 3.5 }),
        g({ "data-part": "screen-code", stroke: "none" },
          el("rect", { x: 30, y: 48, width: 34, height: 7, rx: 3.5, fill: c("color.healthy") }), el("rect", { x: 36, y: 61, width: 22, height: 7, rx: 3.5, fill: c("cast.dev.fill") }),
          el("rect", { x: 156, y: 48, width: 34, height: 7, rx: 3.5, fill: c("color.healthy") }), el("rect", { x: 162, y: 61, width: 22, height: 7, rx: 3.5, fill: c("cast.dev.fill") }))),
      g({ "data-part": "mark" }, el("path", { d: "M98,163 L90,170 L98,177 M122,163 L130,170 L122,177 M114,160 L106,180", fill: "none", stroke: c("color.white"), "stroke-width": 4.5, "stroke-linecap": "round", "stroke-linejoin": "round" })),
    ],
  },
  // AI AGENT: retro lamp all-in-one. Dome = body, chrome neck, the screen is the head (tilts on the neck).
  agent: {
    family: COMPUTER, anchor: [110, 250], ground: 82, shoulders: [[44, 196], [176, 196]], hips: [[84, 236], [136, 236]], foot: 248,
    faceAt: [110, 58], faceColour: c("cast.glow"), mouthFill: c("cast.glow"), faceInHead: true,
    parts: (tilt) => {
      const top: Pt = [110 + tilt * 1.4, 110];
      const neck = `M110,176 Q${108 + tilt},150 ${top[0]},${top[1]}`;
      return [
        g({ "data-part": "neck" }, el("path", { d: neck, fill: "none", stroke: ink(), "stroke-width": 16, "stroke-linecap": "round" }),
          el("path", { d: neck, fill: "none", stroke: c("cast.agent.neck"), "stroke-width": 8, "stroke-linecap": "round" })),
        g({ "data-part": "body" },
          ...solid("M30,240 Q30,166 110,164 Q190,166 190,240 Z", c("color.white")),
          el("path", { d: "M44,226 H176", stroke: c("cast.metal"), "stroke-width": 4, "stroke-dasharray": "3 6", "stroke-linecap": "round" }),
          el("path", { d: "M58,196 Q80,180 104,178", fill: "none", stroke: c("cast.agent.shine"), "stroke-width": 8, "stroke-linecap": "round" })),
        g({ "data-part": "mark" }, spark(110, 206)),
      ];
    },
  },
  // ARCHITECT: drafting set square with its hole, ruler ticks (mark), pencil; board as prop.
  architect: {
    family: OBJECT, anchor: [105, 216], ground: 76, shoulders: [[46, 152], [174, 152]], hips: [[78, 190], [146, 190]], foot: 212, hold: [64, 168],
    faceAt: [110, 132], faceColour: ink(), mouthFill: c("cast.mouth"),
    parts: () => [
      g({ "data-part": "pencil", transform: "rotate(28 128 40)" },
        el("path", { d: "M120,6 H136 V60 L128,74 L120,60 Z", fill: c("color.transitional"), ...O(), "stroke-width": 3.5 }),
        el("path", { d: "M120,6 H136 V16 H120 Z", fill: c("color.backend"), ...O(), "stroke-width": 3.5 })),
      g({ "data-part": "body" },
        ...solid("M99,30 Q110,13 121,30 L198,158 Q210,184 177,193 H35 Q6,187 21,160 Z", c("cast.architect.fill")),
        el("path", { d: "M110,58 L130,94 H90 Z", fill: c("color.panel"), stroke: ink(), "stroke-width": 3.5, "stroke-linejoin": "round" }),
        shine("M70,110 Q78,92 88,80", c("cast.architect.shine"))),
      g({ "data-part": "mark", stroke: ink(), "stroke-width": 3, "stroke-linecap": "round" },
        ...Array.from({ length: 9 }, (_, i) => { const x = 42 + i * 16; const h = i % 2 ? 9 : 15; return el("path", { d: `M${x},193 V${193 - h}` }); })),
    ],
    prop: () => boardProp(118, 152),
  },
  // DEVOPS: gear with the infinity loop (mark); wrench as prop.
  devops: {
    family: OBJECT, anchor: [105, 216], ground: 76, shoulders: [[34, 138], [184, 138]], hips: [[68, 176], [146, 176]], foot: 212, hold: [72, 160],
    faceAt: [110, 100], faceColour: ink(), mouthFill: c("cast.mouth"),
    parts: () => {
      const loop = "M110,160 C98,146 76,146 76,160 C76,174 98,174 110,160 C122,146 144,146 144,160 C144,174 122,174 110,160 Z";
      return [
        g({ "data-part": "body" },
          ...solid("M86,22H128L137,42L161,36L183,58L175,82L196,94V128L174,141L182,163L158,187L136,178L124,197H87L77,180L54,186L28,163L37,138L16,125V93L39,81L31,57L53,35L76,42Z", c("cast.devops.fill")),
          shine("M60,60 Q80,46 104,46", c("cast.devops.shine"))),
        g({ "data-part": "mark" },
          el("path", { d: loop, fill: "none", stroke: c("color.white"), "stroke-width": 11, "stroke-linejoin": "round" }),
          el("path", { d: loop, fill: "none", stroke: ink(), "stroke-width": 4, "stroke-linejoin": "round" })),
      ];
    },
    prop: () => wrenchProp(168, 178),
  },
  // DATA: cylinder with lid and two bands (mark); magnifier as prop.
  data: {
    family: OBJECT, anchor: [105, 216], ground: 76, shoulders: [[38, 140], [172, 140]], hips: [[68, 196], [142, 196]], foot: 212, hold: [70, 170],
    faceAt: [105, 104], faceColour: ink(), mouthFill: c("cast.mouth"),
    parts: () => [
      g({ "data-part": "body" },
        ...solid("M35,60 V174 Q35,205 105,205 Q175,205 175,174 V60 Z", c("cast.data.fill"))),
      g({ "data-part": "mark", fill: "none", stroke: ink(), "stroke-width": 4 }, el("path", { d: "M35,128 Q105,158 175,128" }), el("path", { d: "M35,166 Q105,196 175,166" })),
      g({ "data-part": "lid" },
        el("ellipse", { cx: 105, cy: 61, rx: 70, ry: 25, fill: c("cast.data.lid"), ...O() }),
        shine("M50,84 V112", c("cast.data.shine"))),
    ],
    prop: () => magnifierProp(164, 186),
  },
  // REQUESTER: speech bubble in caller blue, the request line (mark).
  request: {
    family: OBJECT, anchor: [105, 216], ground: 76, shoulders: [[30, 120], [180, 120]], hips: [[78, 176], [134, 176]], foot: 212, hold: [70, 150],
    faceAt: [105, 82], faceColour: ink(), mouthFill: c("cast.mouth"),
    parts: () => [
      g({ "data-part": "body" },
        ...solid("M54,30 H156 Q186,30 186,60 V130 Q186,160 156,160 H96 L66,190 L72,160 H54 Q24,160 24,130 V60 Q24,30 54,30 Z", c("color.caller")),
        shine("M44,62 Q56,46 78,46", c("cast.request.shine"))),
      g({ "data-part": "mark" }, el("rect", { x: 62, y: 134, width: 86, height: 12, rx: 6, fill: c("color.white"), stroke: ink(), "stroke-width": 3 })),
    ],
  },
  // MESSAGE: envelope (0.7 of the others), seal (mark).
  message: {
    family: OBJECT, anchor: [105, 216], scale: 0.7, ground: 76, shoulders: [[40, 140], [170, 140]], hips: [[78, 190], [132, 190]], foot: 212, hold: [70, 170],
    faceAt: [105, 136], faceColour: ink(), mouthFill: c("cast.mouth"),
    parts: () => [
      g({ "data-part": "body" }, ...solid(rr(32, 88, 146, 106, 16), c("color.white"))),
      g({ "data-part": "mark" },
        el("path", { d: "M36,94 L105,140 L174,94", fill: "none", stroke: ink(), "stroke-width": 4, "stroke-linejoin": "round" }),
        el("circle", { cx: 105, cy: 140, r: 9, fill: c("color.transitional"), stroke: ink(), "stroke-width": 3 })),
    ],
  },
});

export type MascotParams = { who: MascotName; x: number; y: number; face?: MascotFace; action?: MascotAction; scale?: number; look?: number; headTilt?: number; prop?: boolean };

const drawMascot = (p: MascotParams): Drawn => {
  const ch = CAST()[p.who];
  const f = p.face ?? "normal", act = p.action ?? "none", look = p.look ?? 0, tilt = p.headTilt ?? 0;
  const k = (p.scale ?? 1) * (ch.scale ?? 1);
  const fam = ch.family;
  const [L, R] = ch.shoulders;
  let arms: SvgNode[] = [];
  let legs: SvgNode | null = null;
  const front = act === "hold" || act === "type";
  if (act !== "none") {
    const [ol, or] = fam.offsets[act];
    let targetL: Pt = [L[0] + ol[0], L[1] + ol[1]], targetR: Pt = [R[0] + or[0], R[1] + or[1]];
    // mascots4: "hold" puts both mittens at the hold point, mirrored round x 105.
    if (act === "hold" && ch.hold) { targetL = ch.hold; targetR = [210 - ch.hold[0], ch.hold[1]]; }
    arms = [g({ "data-part": "arm-left" }, ...arm(L, targetL, -1, fam.armWidth)), g({ "data-part": "arm-right" }, ...arm(R, targetR, 1, fam.armWidth))];
    legs = g({ "data-part": "legs" }, ...ch.hips.flatMap(([hx, hy], i) => {
      const s = i ? 1 : -1;
      return fam === COMPUTER
        ? [el("path", { d: `M${hx},${hy} L${hx + s * 4},${ch.foot - 6}`, stroke: ink(), "stroke-width": fam.legWidth, "stroke-linecap": "round" }), el("ellipse", { cx: hx + s * 11, cy: ch.foot, rx: 19, ry: 11, fill: ink() })]
        : [el("path", { d: `M${hx},${hy} L${hx + s * 6},${ch.foot - 6}`, stroke: ink(), "stroke-width": fam.legWidth, "stroke-linecap": "round" }), el("ellipse", { cx: hx + s * 13, cy: ch.foot, rx: 19, ry: 11, fill: ink() })];
    }));
  }
  let faceWrapped = face(ch.faceAt[0] + (ch.faceInHead ? tilt * 1.4 : 0), ch.faceAt[1], f, ch.faceColour, ch.mouthFill);
  if (look !== 0) faceWrapped = { ...faceWrapped, attrs: { ...faceWrapped.attrs, transform: `translate(${look * 6} 0)` } };
  const showProp = (p.prop ?? true) && ch.prop && (act === "rest" || act === "hold");
  const [ax, ay] = ch.anchor;
  let parts = ch.parts(tilt);
  if (ch.faceInHead) {
    const top: Pt = [110 + tilt * 1.4, 110];
    parts = [...parts, g({ "data-part": "head", transform: `rotate(${tilt} ${top[0]} ${top[1]})` },
      ...solid(rr(top[0] - 96, 0, 192, 132, 22), c("color.white")),
      el("path", { d: rr(top[0] - 80, 14, 160, 104, 12), fill: c("illustration.codePanel"), stroke: ink(), "stroke-width": 4 }),
      faceWrapped)];
  }
  const root = g({ "data-mascot": p.who, transform: `translate(${p.x} ${p.y}) scale(${k}) translate(${-ax} ${-ay})`, stroke: "none" },
    g({ "data-part": "ground" }, el("ellipse", { cx: ax, cy: ay, rx: ch.ground, ry: 9, fill: c("cast.ground") })),
    ...(front ? [] : arms),
    legs,
    ...parts,
    ch.faceInHead ? null : faceWrapped,
    showProp ? g({ "data-part": "prop" }, ...ch.prop!()) : null,
    ...(front ? arms : []),
  );
  return drawn([root]);
};

// ---------------------------------------------------------------- emotes (emotes.ts)
const rays = (cx: number, cy: number, r1: number, r2: number, n: number, from = -150, to = -30) =>
  Array.from({ length: n }, (_, i) => {
    const a = ((from + (i * (to - from)) / (n - 1)) * Math.PI) / 180;
    const r = (v: number) => Math.round(v * 100) / 100;
    return el("path", { d: `M${r(cx + r1 * Math.cos(a))},${r(cy + r1 * Math.sin(a))} L${r(cx + r2 * Math.cos(a))},${r(cy + r2 * Math.sin(a))}`, stroke: ink(), "stroke-width": 6, "stroke-linecap": "round" });
  });
const EO = () => ({ stroke: ink(), "stroke-width": 5, "stroke-linejoin": "round" as const, "stroke-linecap": "round" as const });
const disc = (cx: number, cy: number, r: number, fill: string) => [el("circle", { cx: cx + 6, cy: cy + 6, r, fill: ink() }), el("circle", { cx, cy, r, fill, ...EO() })];
const zed = (x: number, y: number, s: number) => {
  // A Z of height s with its top-left at (x, y - s): ink casing, caller fill.
  const w = s * 0.72, d = `M${x},${y - s} H${x + w} L${x},${y} H${x + w}`;
  return [el("path", { d, fill: "none", stroke: ink(), "stroke-width": s * 0.34, "stroke-linecap": "round", "stroke-linejoin": "round" }),
    el("path", { d, fill: "none", stroke: c("color.caller"), "stroke-width": s * 0.16, "stroke-linecap": "round", "stroke-linejoin": "round" })];
};

export type EmoteParams = { kind: EmoteKind; x: number; y: number; scale?: number; burst?: boolean };

const drawEmote = (p: EmoteParams): Drawn => {
  const { kind, x: cx, y: cy } = p, burst = p.burst ?? true, s = p.scale ?? 1;
  const parts: SvgNode[] = [];
  switch (kind) {
    case "idea": {
      if (burst) parts.push(el("circle", { cx, cy: cy - 6, r: 62, fill: c("color.transitional"), opacity: 0.35 }), ...rays(cx, cy - 6, 50, 72, 7, -180, 0));
      const bulb = `M${cx - 30},${cy - 10} A34,34 0 1 1 ${cx + 30},${cy - 10} Q${cx + 22},${cy + 6} ${cx + 18},${cy + 22} H${cx - 18} Q${cx - 22},${cy + 6} ${cx - 30},${cy - 10} Z`;
      parts.push(
        el("path", { d: bulb, fill: ink(), transform: "translate(6 6)" }),
        el("path", { d: bulb, fill: c("color.transitional"), ...EO() }),
        el("path", { d: `M${cx - 16},${cy - 22} Q${cx - 12},${cy - 32} ${cx - 2},${cy - 34}`, fill: "none", stroke: c("color.white"), "stroke-width": 6, "stroke-linecap": "round" }),
        el("path", { d: `M${cx - 8},${cy + 22} V${cy} L${cx},${cy + 8} L${cx + 8},${cy} V${cy + 22}`, fill: "none", stroke: ink(), "stroke-width": 4, "stroke-linejoin": "round" }),
        el("rect", { x: cx - 18, y: cy + 22, width: 36, height: 12, rx: 3, fill: c("cast.metal"), ...EO(), "stroke-width": 4 }),
        el("rect", { x: cx - 14, y: cy + 34, width: 28, height: 10, rx: 5, fill: c("cast.metal"), ...EO(), "stroke-width": 4 }));
      break;
    }
    case "doubt":
      parts.push(...disc(cx, cy, 40, c("color.white")),
        el("path", { d: `M${cx - 14},${cy - 12} Q${cx - 14},${cy - 28} ${cx},${cy - 28} Q${cx + 16},${cy - 28} ${cx + 16},${cy - 13} Q${cx + 16},${cy - 2} ${cx + 2},${cy + 4} V${cy + 10}`, fill: "none", stroke: ink(), "stroke-width": 9, "stroke-linecap": "round", "stroke-linejoin": "round" }),
        el("circle", { cx: cx + 2, cy: cy + 24, r: 6, fill: ink() }));
      break;
    case "problem":
      if (burst) parts.push(...rays(cx, cy, 48, 70, 5));
      parts.push(el("path", { d: `M${cx},${cy - 44} L${cx + 46},${cy + 34} H${cx - 46} Z`, fill: ink(), transform: "translate(6 6)" }),
        el("path", { d: `M${cx},${cy - 44} L${cx + 46},${cy + 34} H${cx - 46} Z`, fill: c("color.failure"), ...EO() }),
        el("path", { d: `M${cx},${cy - 18} V${cy + 8}`, stroke: ink(), "stroke-width": 9, "stroke-linecap": "round" }),
        el("circle", { cx, cy: cy + 22, r: 5.5, fill: ink() }));
      break;
    case "pressure":
      for (const [dx, dy, k] of [[0, 0, 1], [30, 22, 0.6]]) parts.push(
        el("path", { d: `M${cx + dx},${cy + dy - 34 * k} Q${cx + dx + 24 * k},${cy + dy} ${cx + dx},${cy + dy + 12 * k} Q${cx + dx - 24 * k},${cy + dy} ${cx + dx},${cy + dy - 34 * k} Z`, fill: c("cast.glow"), ...EO(), "stroke-width": 4 }),
        el("path", { d: `M${cx + dx - 6 * k},${cy + dy - 2 * k} Q${cx + dx - 8 * k},${cy + dy + 6 * k} ${cx + dx - 2 * k},${cy + dy + 8 * k}`, fill: "none", stroke: c("color.white"), "stroke-width": 3, "stroke-linecap": "round" }));
      break;
    case "liked":
      parts.push(el("path", { d: `M${cx},${cy + 30} C${cx - 50},${cy} ${cx - 34},${cy - 40} ${cx},${cy - 16} C${cx + 34},${cy - 40} ${cx + 50},${cy} ${cx},${cy + 30} Z`, fill: c("color.backend"), ...EO() }));
      break;
    case "worked":
      if (burst) parts.push(...rays(cx, cy, 48, 68, 5));
      parts.push(...disc(cx, cy, 38, c("color.healthy")), el("path", { d: `M${cx - 16},${cy} L${cx - 4},${cy + 12} L${cx + 18},${cy - 12}`, fill: "none", stroke: ink(), "stroke-width": 8, "stroke-linecap": "round", "stroke-linejoin": "round" }));
      break;
    case "refused":
      parts.push(...disc(cx, cy, 38, c("color.failure")), el("path", { d: `M${cx - 13},${cy - 13} L${cx + 13},${cy + 13} M${cx + 13},${cy - 13} L${cx - 13},${cy + 13}`, stroke: ink(), "stroke-width": 8, "stroke-linecap": "round" }));
      break;
    case "waiting":
      parts.push(...zed(cx - 12, cy + 12, 26), ...zed(cx + 20, cy - 20, 20), ...zed(cx + 44, cy - 46, 14));
      break;
  }
  const attrs: Record<string, string> = s === 1 ? { "data-emote": kind, stroke: "none" } : { "data-emote": kind, stroke: "none", transform: `translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})` };
  return drawn([g(attrs, ...parts)]);
};

const unit = { kind: "number", min: 0, exclusiveMin: true, max: 10 } as const;

/** One character standing with the centre of its ground line at (x, y). */
export const mascot = definePiece<MascotParams>(
  "mascot",
  {
    who: { kind: "enum", required: true, values: MASCOTS },
    x: pos(),
    y: pos(),
    face: { kind: "enum", values: MASCOT_FACES },
    action: { kind: "enum", values: MASCOT_ACTIONS },
    scale: unit,
    look: { kind: "number", min: -1, max: 1 },
    headTilt: { kind: "number", min: -30, max: 30 },
    prop: { kind: "boolean" },
  } satisfies Schema,
  drawMascot,
  ({ who, headTilt }) => (headTilt !== undefined && headTilt !== 0 && who !== "agent" ? [{ path: "headTilt", message: "applies only to the agent" }] : []),
);

/** One reaction symbol with a fixed meaning, centred on (x, y), beside a head. */
export const emote = definePiece<EmoteParams>(
  "emote",
  { kind: { kind: "enum", required: true, values: EMOTE_KINDS }, x: pos(), y: pos(), scale: unit, burst: { kind: "boolean" } } satisfies Schema,
  drawEmote,
);

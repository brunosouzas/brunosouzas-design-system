// The supporting cast (ADR 0007, amended 2026-11-12; spec illustration-pieces,
// "Balão", "Chaves" and their parameters; change supporting-characters, design
// §1 to §5): two characters for the human roles the pillar cast cannot tell,
// drawn from the approved concept C sheet, "the notation" (identity studio,
// 2026-11-12; prototype ~/.hermes/cache/scratch/ab337-characters/chars.ts).
//
//   balao   the requester and approver: a speech balloon on Mira's legs whose
//           tail points at the listener; `speaks` lights the request line on
//           its belly, `holdsStamp` holds the `stamp` piece to approve.
//   chaves  the developer: a `{ }` body with sharp brace points and a waist (so
//           it reads as a brace at 24 px, not a pillow) and the accent cursor;
//           `types` at the `keyboard`, `points`, `holdsSheet` hands a sheet over.
//
// Both wear the shared skin (skin.ts), the screen face and the parent-brand hood
// tip (brand-cast.ts), take the cast's shared parameters plus `facing`, and do
// one action at a time, every action off unless set (motion CAST-2 to CAST-5).
// Coordinates are local units at scale 1 facing right: the ground line is y 0,
// up is negative, the anchor (x, y) is the centre of the ground line.
//
// Why a module of its own: the supporting cast stays apart from the five pinned
// pillar drawings (design §1, option B). It imports stamp.ts, keyboard.ts,
// paper.ts and brand-cast.ts, never library.ts, which imports it (the cycle
// stamp.ts was moved out to break).
//
// What can go wrong: the schema rejects a bad parameter, naming it; then each
// piece returns at most one relation problem (two actions together, or a prop
// seen from behind), so a cover spec reports one line per piece.
import { tokens } from "../../tokens/generated/tokens.ts";
import { CAST_EXPRESSIONS, CAST_VIEWS, faceAt, heldSheetSchema, holdSheet, peak, pointingHand, type CastExpression, type CastView, type HeldSheet } from "./brand-cast.ts";
import { surfaceParam, type SurfaceName } from "./ink.ts";
import { drawn, el, g, type Drawn, type SvgNode } from "./node.ts";
import { label, num, pos, type Problem, type Schema } from "./params.ts";
import { definePiece } from "./piece.ts";
import { outlined, skin, type Skin } from "./skin.ts";
import { keyboard } from "./keyboard.ts";
import { stamp } from "./stamp.ts";

export const CAST_FACINGS = ["right", "left"] as const;
/** The side a supporting character faces: its signature part and front hand go there. */
export type CastFacing = (typeof CAST_FACINGS)[number];

/** The parameters every supporting character shares with the cast, plus `facing`. */
const sharedSchema = {
  x: pos(), y: pos(), surface: surfaceParam,
  scale: num({ min: 0.25, max: 4 }),
  expression: { kind: "enum", values: CAST_EXPRESSIONS },
  view: { kind: "enum", values: CAST_VIEWS },
  facing: { kind: "enum", values: CAST_FACINGS },
} satisfies Schema;

type Shared = { x: number; y: number; surface?: SurfaceName; scale?: number; expression?: CastExpression; view?: CastView; facing?: CastFacing };

/** Mira's legs (two strokes of width 8 and two foot pills) from the hips at (±hip, top) to the feet at (±foot, 0). */
const legs = (s: Skin, top: number, hip: number, foot: number): SvgNode[] => [
  el("path", { d: `M${-hip} ${top} L${-foot} 0 M${hip} ${top} L${foot} 0`, stroke: s.outline, "stroke-width": 8, "stroke-linecap": "round" }),
  el("rect", { x: -foot - 10, y: -6, width: 20, height: 7, rx: 3.5, fill: s.outline }),
  el("rect", { x: foot - 10, y: -6, width: 20, height: 7, rx: 3.5, fill: s.outline }),
];

/** Visor's hand: a circle of radius 15 with the cast's outline. */
const hand = (s: Skin, cx: number, cy: number): SvgNode => el("circle", { cx, cy, r: 15, ...outlined(s) });

/** The hood tip seen from behind, a flat lens on the top edge (Visor's back, at the character's top). */
const tipBack = (s: Skin, top: number): SvgNode =>
  el("path", { d: `M-28 ${top} Q0 ${top - 8} 28 ${top} Q0 ${top + 8} -28 ${top} Z`, fill: s.accent, stroke: s.outline, "stroke-width": 5, "stroke-linejoin": "round" });

/** A held prop's group: the prop's shapes with the skin's outline (the cast's root sets `stroke: none`). */
const heldGroup = (name: string, s: Skin, ...children: SvgNode[]): SvgNode =>
  g({ "data-held": name, stroke: s.outline, "stroke-width": tokens.outline.block, "stroke-linejoin": "round" }, ...children);

/**
 * The character's tree (design §1, Visor's shape): the root group at the anchor
 * and scale with `stroke: none`; the held prop first (outside the mirror, at its
 * mirrored position, so its words and marks read), then the body group, mirrored
 * facing left; the words in one text group with the root's transform.
 */
const assemble = (name: string, p: Shared, held: Drawn | null, parts: SvgNode[]): Drawn => {
  const transform = `translate(${p.x} ${p.y}) scale(${p.scale ?? 1})`;
  // Facing left mirrors the body only: a uniform -1 scale keeps every stroke width and colour (ADR 0009).
  const body = g((p.facing ?? "right") === "left" ? { transform: "scale(-1,1)" } : {}, ...parts);
  const words = held?.text ?? [];
  const text = words.length > 0
    ? [g({ transform, "font-family": tokens.font.sans, "font-size": tokens.cover.labelSize, "font-weight": tokens.cover.labelWeight, fill: tokens.color.ink, "text-anchor": "middle" }, ...words)]
    : [];
  return drawn([g({ "data-piece": name, transform, stroke: "none" }, ...(held?.body ?? []), body)], text);
};

/** -1 facing left, 1 facing right: the side of a held prop drawn outside the mirrored body. */
const side = (p: Shared): number => ((p.facing ?? "right") === "left" ? -1 : 1);

// ---------------------------------------------------------------- Balão (requester and approver)

export type BalaoParams = Shared & {
  /** The request line on the belly lit in the accent: Balão is asking. */
  speaks?: boolean;
  /** The `stamp` piece in the front hand, with the caller's word (the SDD scene's `GO`); refused with `speaks` or from behind. */
  holdsStamp?: { word: string };
};

/** Balão's body: the rounded balloon with its tail low on the front side, pointing out and down at (94, -76), never between the legs (design §2). */
const BALAO_BODY = "M-62 -132 Q-62 -162 -32 -162 H32 Q62 -162 62 -132 V-104 L94 -76 L56 -70 Q48 -60 32 -60 H-32 Q-62 -60 -62 -88 Z";
const BALAO_TOP = -162;
/** The held stamp's centre and radius, beside the tail (design §2); the front hand sits over its top edge. */
const BALAO_STAMP = { cx: 132, cy: -70, r: 24 } as const;

const drawBalao = (p: BalaoParams): Drawn => {
  const s = skin(p.surface ?? "light");
  const back = (p.view ?? "front") === "back";
  const held = p.holdsStamp === undefined ? null : stamp({ ...BALAO_STAMP, cx: BALAO_STAMP.cx * side(p), word: p.holdsStamp.word });
  const front: SvgNode[] = back
    ? [tipBack(s, BALAO_TOP)]
    : [
        faceAt(-38, -146, 76, 40, s, p.expression ?? "idle"),
        // The request is a bar, not a word: Balão draws no word of its own.
        el("rect", { x: -30, y: -88, width: 60, height: 9, rx: 4.5, fill: p.speaks === true ? s.accent : tokens.illustration.textBar }),
        peak(s, 0, BALAO_TOP, 28, 24),
      ];
  const parts = [
    ...legs(s, -62, 20, 28),
    el("path", { d: BALAO_BODY, ...outlined(s) }),
    ...front,
    hand(s, -86, -100),
    held ? hand(s, BALAO_STAMP.cx, BALAO_STAMP.cy - 30) : hand(s, 92, -132),
  ];
  return assemble("balao", p, held && { body: [heldGroup("stamp", s, ...held.body)], text: held.text }, parts);
};

/** Balão's relation problem, at most one (design §5): one action at a time, then no stamp from behind. */
const balaoRelations = (p: BalaoParams): Problem[] => {
  if (p.holdsStamp === undefined) return [];
  if (p.speaks === true) return [{ path: "holdsStamp", message: "Balão does one action at a time" }];
  if (p.view === "back") return [{ path: "holdsStamp", message: "Balão holds a stamp only in the front view" }];
  return [];
};

/** Balão, the requester and approver: a speech balloon whose tail points at the listener. */
export const balao = definePiece<BalaoParams>(
  "balao",
  { ...sharedSchema, speaks: { kind: "boolean" }, holdsStamp: { kind: "object", fields: { word: label() } } } satisfies Schema,
  drawBalao,
  balaoRelations,
);

// ---------------------------------------------------------------- Chaves (developer)

export type ChavesParams = Shared & {
  /** Types at the `keyboard`, held under the front hand; refused with another action or from behind. */
  types?: boolean;
  /** The front hand becomes Visor's pointing hand, reaching up and forward; refused with another action. */
  points?: boolean;
  /** Hands a sheet over, held out in the front hand (Visor's held sheet); refused with another action or from behind. */
  holdsSheet?: HeldSheet;
};

/**
 * Chaves's body, a brace outline that reads at 24 px (design §3, option A): the
 * points reach x ±90 at mid height (y -88), 36 outside the corners (±54) and 46
 * outside the waist (±44), each a corner between two curves.
 */
const CHAVES_BODY = "M-30 -150 H30 Q54 -150 54 -128 Q54 -112 44 -108 Q60 -96 90 -88 Q60 -80 44 -68 Q54 -64 54 -48 Q54 -26 30 -26 H-30 Q-54 -26 -54 -48 Q-54 -64 -44 -68 Q-60 -80 -90 -88 Q-60 -96 -44 -108 Q-54 -112 -54 -128 Q-54 -150 -30 -150 Z";
const CHAVES_TOP = -150;
/** Where the held props sit (design §3): the keyboard's top-left corner, and the held page's near edge and bottom. */
const CHAVES_KEYBOARD = { x: 98, y: -74, width: 150 } as const;
const CHAVES_SHEET_EDGE = 118;
const CHAVES_SHEET_BOTTOM = -40;

const drawChaves = (p: ChavesParams): Drawn => {
  const s = skin(p.surface ?? "light");
  const back = (p.view ?? "front") === "back";
  const turn = side(p);
  let held: Drawn | null = null;
  let frontHand = hand(s, 100, -50);
  if (p.types === true) {
    // The keyboard's own shapes (its slab carries its stroke, its keys sit in a `stroke: none` group), without its
    // `data-piece` root, so a selector of `[data-piece]` counts one piece per character.
    const board = keyboard({ ...CHAVES_KEYBOARD, x: turn > 0 ? CHAVES_KEYBOARD.x : -CHAVES_KEYBOARD.x - CHAVES_KEYBOARD.width, surface: p.surface });
    held = { body: [g({ "data-held": "keyboard" }, ...board.body[0].children.filter((child): child is SvgNode => typeof child !== "string"))], text: [] };
    frontHand = hand(s, 120, -80);
  } else if (p.holdsSheet !== undefined) {
    const page = p.holdsSheet;
    held = holdSheet(page, s, turn > 0 ? CHAVES_SHEET_EDGE : -CHAVES_SHEET_EDGE - page.width, CHAVES_SHEET_BOTTOM - page.height);
    frontHand = hand(s, 112, -92);
  } else if (p.points === true) {
    frontHand = pointingHand(s, 104, -128, 55);
  }
  const front: SvgNode[] = back
    ? [tipBack(s, CHAVES_TOP)]
    : [
        faceAt(-34, -132, 68, 38, s, p.expression ?? "idle"),
        el("rect", { x: -9, y: -76, width: 18, height: 8, rx: 2, fill: s.accent }),
        peak(s, 0, CHAVES_TOP, 28, 24),
      ];
  const parts = [...legs(s, -30, 16, 26), el("path", { d: CHAVES_BODY, ...outlined(s) }), ...front, hand(s, -100, -50), frontHand];
  return assemble("chaves", p, held, parts);
};

/** Chaves's relation problem, at most one (design §5): one action at a time (naming the second on), then no prop from behind. */
const chavesRelations = (p: ChavesParams): Problem[] => {
  const on = ([["types", p.types === true], ["points", p.points === true], ["holdsSheet", p.holdsSheet !== undefined]] as const).filter(([, isOn]) => isOn).map(([name]) => name);
  if (on.length > 1) return [{ path: on[1], message: "Chaves does one action at a time" }];
  if (p.view === "back" && on[0] === "types") return [{ path: "types", message: "Chaves types only in the front view" }];
  if (p.view === "back" && on[0] === "holdsSheet") return [{ path: "holdsSheet", message: "Chaves holds a sheet only in the front view" }];
  return [];
};

/** Chaves, the developer: a `{ }` body with sharp brace points and the cursor in the accent. */
export const chaves = definePiece<ChavesParams>(
  "chaves",
  { ...sharedSchema, types: { kind: "boolean" }, points: { kind: "boolean" }, holdsSheet: { kind: "object", fields: heldSheetSchema } } satisfies Schema,
  drawChaves,
  chavesRelations,
);

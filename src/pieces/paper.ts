// The paper pieces, `pill` and `sheet` (spec illustration-pieces, "Piece
// catalogue"), moved unchanged from library.ts by change sdd-scene-pieces
// (card 333): Visor draws them in its hand (`holdsSheet`, brand-cast.ts), and
// brand-cast.ts cannot import library.ts, which imports it. library.ts
// re-exports both, so the catalogue and its order are the same.
//
// What can go wrong: the schemas reject an empty label, a sheet narrower than
// 80 and an unknown row lead or tail, naming the parameter.
import { tokens } from "../../tokens/generated/tokens.ts";
import { drawn, el, g, shadowed, type SvgNode } from "./node.ts";
import { col, colour, label, pos, size, type Schema } from "./params.ts";
import { definePiece } from "./piece.ts";
import { codeLength, spans } from "./ink.ts";

const ink = tokens.color.ink;

// ---------- labels ----------

export type PillParams = { x: number; y: number; text: string; fill?: string; width?: number };
/** Pill label centred on (x, y), usually overlapping the top edge of what it names. Backticks mark code (card 190). */
export const pill = definePiece<PillParams>(
  "pill",
  { x: pos(), y: pos(), text: label(), fill: col(), width: size() },
  ({ x, y, text, fill = "color.white", width }) => {
    const h = tokens.cover.pillHeight;
    const w = width ?? Math.max(68, Math.round(codeLength(text) * 10.5 + 34));
    return drawn(
      [el("rect", { x: x - w / 2, y: y - h / 2, width: w, height: h, rx: h / 2, fill: colour(fill, "fill") })],
      [el("text", { x, y: y + 7 }, ...spans(text))],
    );
  },
);

// ---------- paper ----------

export type SheetRow = { lead?: "none" | "checkbox" | "checked" | "question"; bar: number; tail?: "none" | "check" };
export type SheetParams = {
  x: number;
  y: number;
  width: number;
  height: number;
  rows: SheetRow[];
  top?: number;
  step?: number;
  fill?: string;
  leadFill?: string;
  tick?: string;
};
/** The shape of one sheet row; Visor's held sheet takes the same rows (brand-cast.ts). */
export const sheetRowSchema: Schema = {
  lead: { kind: "enum", values: ["none", "checkbox", "checked", "question"] },
  bar: size(true),
  tail: { kind: "enum", values: ["none", "check"] },
};
/** A sheet of paper with rows of text bars, an optional lead mark and an optional tick at the end. */
export const sheet = definePiece<SheetParams>(
  "sheet",
  {
    x: pos(),
    y: pos(),
    width: size(true, 80),
    height: size(true),
    rows: { kind: "array", required: true, of: { kind: "object", fields: sheetRowSchema } },
    top: size(),
    step: size(),
    fill: col(),
    leadFill: col(),
    tick: col(),
  },
  ({ x, y, width, height, rows, top = 46, step = 38, fill = "color.white", leadFill = "color.ink", tick = "color.white" }) => {
    const marks: SvgNode[] = [];
    const bars: SvgNode[] = [];
    const ticks: SvgNode[] = [];
    const glyphs: SvgNode[] = [];
    rows.forEach((row, i) => {
      const cy = y + top + i * step + 11;
      let barX = x + 22;
      if (row.lead === "checkbox" || row.lead === "checked") {
        const checked = row.lead === "checked";
        marks.push(el("rect", { x: x + 22, y: cy - 11, width: 22, height: 22, rx: 5, fill: checked ? colour(leadFill, "leadFill") : tokens.color.white }));
        if (checked) ticks.push(el("path", { d: `M${x + 27},${cy} L${x + 32},${cy + 6} L${x + 40},${cy - 6}`, stroke: colour(tick, "tick") }));
        barX = x + 56;
      } else if (row.lead === "question") {
        marks.push(el("circle", { cx: x + 30, cy, r: 13, fill: tokens.color.white }));
        glyphs.push(el("text", { x: x + 30, y: cy + 7, "font-size": 19, "font-weight": tokens.font.weightHeavy }, "?"));
        barX = x + 52;
      }
      bars.push(el("rect", { x: barX, y: cy - 5, width: row.bar, height: 10, rx: 5 }));
      if (row.tail === "check") {
        const tx = x + width - 40;
        marks.push(el("rect", { x: tx, y: cy - 11, width: 22, height: 22, rx: 5, fill: tokens.color.state.healthy }));
        ticks.push(el("path", { d: `M${tx + 5},${cy} L${tx + 10},${cy + 6} L${tx + 18},${cy - 6}`, stroke: ink }));
      }
    });
    return drawn(
      [
        ...shadowed(el("rect", { x, y, width, height, rx: 14, fill: colour(fill, "fill") })),
        g({ "stroke-width": tokens.outline.small }, ...marks),
        g({ fill: "none", "stroke-width": 3.5, "stroke-linecap": "round" }, ...ticks),
        g({ stroke: "none", fill: tokens.illustration.textBar }, ...bars),
      ],
      glyphs,
    );
  },
);

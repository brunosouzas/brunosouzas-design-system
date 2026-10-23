// A piece: a named pure function with its parameter schema. Calling it checks
// the parameters first (RangeError with the first problem), then draws.
//
// `relations` holds the limits that tie parameters together (a width against a
// height, room for the outline): the cover command collects them with the
// schema's problems, and a call from code throws the first one.
import type { Drawn, SvgNode } from "./node.ts";
import { assertParams, type Problem, type Schema } from "./params.ts";

// A number the piece computed and would draw: finite, or the drawing overflows
// (spec illustration-pieces, "Drawing overflow"). Strings are the piece's own
// path data and transforms; caller path data (road.d, pipe.d) has its own check
// and only ever holds path characters, never the words Infinity or NaN.
const NON_FINITE = /Infinity|NaN/;
const overflows = (node: SvgNode | string): boolean => {
  if (typeof node === "string") return false;
  for (const value of Object.values(node.attrs)) {
    if (typeof value === "number" ? !Number.isFinite(value) : NON_FINITE.test(value)) return true;
  }
  return node.children.some(overflows);
};

export type Relations<P> = (params: P) => Problem[];
export type Piece<P extends object> = ((params: P) => Drawn) & { readonly pieceName: string; readonly schema: Schema; readonly relations?: Relations<P> };

export const definePiece = <P extends object>(name: string, schema: Schema, draw: (params: P) => Drawn, relations?: Relations<P>): Piece<P> => {
  const piece = (params: P): Drawn => {
    assertParams(name, schema, params as Record<string, unknown>);
    const problems = relations?.(params) ?? [];
    if (problems.length > 0) throw new RangeError(`${name}: ${problems[0].path}: ${problems[0].message}`);
    const drawn = draw(params);
    if ([...drawn.body, ...drawn.text].some(overflows)) throw new RangeError(`${name}: the drawing overflows`);
    return drawn;
  };
  return Object.assign(piece, { pieceName: name, schema, relations });
};

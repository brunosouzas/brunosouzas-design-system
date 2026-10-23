// A piece: a named pure function with its parameter schema. Calling it checks
// the parameters first (RangeError with the first problem), then draws.
//
// `relations` holds the limits that tie parameters together (a width against a
// height, room for the outline): the cover command collects them with the
// schema's problems, and a call from code throws the first one.
import type { Drawn } from "./node.ts";
import { assertParams, type Problem, type Schema } from "./params.ts";

export type Relations<P> = (params: P) => Problem[];
export type Piece<P extends object> = ((params: P) => Drawn) & { readonly pieceName: string; readonly schema: Schema; readonly relations?: Relations<P> };

export const definePiece = <P extends object>(name: string, schema: Schema, draw: (params: P) => Drawn, relations?: Relations<P>): Piece<P> => {
  const piece = (params: P): Drawn => {
    assertParams(name, schema, params as Record<string, unknown>);
    const problems = relations?.(params) ?? [];
    if (problems.length > 0) throw new RangeError(`${name}: ${problems[0].path}: ${problems[0].message}`);
    return draw(params);
  };
  return Object.assign(piece, { pieceName: name, schema, relations });
};

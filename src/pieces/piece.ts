// A piece: a named pure function with its parameter schema. Calling it checks
// the parameters first (RangeError with the first problem), then draws.
import type { Drawn } from "./node.ts";
import { assertParams, type Schema } from "./params.ts";

export type Piece<P extends object> = ((params: P) => Drawn) & { readonly pieceName: string; readonly schema: Schema };

export const definePiece = <P extends object>(name: string, schema: Schema, draw: (params: P) => Drawn): Piece<P> => {
  const piece = (params: P): Drawn => {
    assertParams(name, schema, params as Record<string, unknown>);
    return draw(params);
  };
  return Object.assign(piece, { pieceName: name, schema });
};

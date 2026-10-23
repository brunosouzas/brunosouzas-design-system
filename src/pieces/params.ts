// Parameter schemas of the pieces: one description per piece, used both when
// code calls a piece (first problem thrown as a RangeError) and by the cover
// command (every problem collected, with its JSON path).
//
// Why one schema: the cover spec and a scene must accept exactly the same
// parameters, or a cover that validates could fail to draw.
import { tokens } from "../../tokens/generated/tokens.ts";

export type ParamSpec =
  | { kind: "number"; required?: boolean; min?: number; exclusiveMin?: boolean; max?: number; integer?: boolean }
  /** A token path; with `currentColor`, also that exact keyword (uiIcon.colour only, card 170). */
  | { kind: "color"; required?: boolean; currentColor?: boolean }
  /** A token path, or a colour from the consumer's data (#RRGGBB): pipe and lineBadge fills only. */
  | { kind: "dataColor"; required?: boolean }
  | { kind: "string"; required?: boolean; nonEmpty?: boolean; pattern?: RegExp; patternName?: string }
  | { kind: "enum"; required?: boolean; values: readonly string[] }
  | { kind: "boolean"; required?: boolean }
  | { kind: "point"; required?: boolean }
  | { kind: "array"; required?: boolean; minItems?: number; maxItems?: number; of: ParamSpec }
  | { kind: "object"; required?: boolean; fields: Schema };

export type Schema = Readonly<Record<string, ParamSpec>>;
export type Problem = { path: string; message: string };

/** A data colour: exactly six hex digits after the sign, nothing else. */
export const DATA_COLOUR = /^#[0-9A-Fa-f]{6}$/;

/** The hex value of a data colour parameter: a token path resolved, a data colour as given. */
export const paint = (value: string, name = "fill"): string => (DATA_COLOUR.test(value) ? value : colour(value, name));

const COLOUR_LITERAL = /^\s*(#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\()/;

/** Every colour token, by its dotted path: any token whose value is #RRGGBB. */
export const COLOUR_TOKENS: ReadonlyMap<string, string> = (() => {
  const found = new Map<string, string>();
  const visit = (prefix: string, node: unknown) => {
    if (typeof node === "string") {
      if (/^#[0-9a-fA-F]{6}$/.test(node)) found.set(prefix, node);
      return;
    }
    if (typeof node === "object" && node !== null) {
      for (const [name, child] of Object.entries(node)) visit(prefix ? `${prefix}.${name}` : name, child);
    }
  };
  visit("", tokens);
  return found;
})();

export const isColourLiteral = (value: string): boolean => COLOUR_LITERAL.test(value);

/** The hex value of a colour token path; throws a RangeError for anything else. */
export const colour = (path: string, name = "colour"): string => {
  const value = COLOUR_TOKENS.get(path);
  if (value === undefined) throw new RangeError(`${name}: expected a colour token path such as color.healthy, found ${JSON.stringify(path)}`);
  return value;
};

const describe = (value: unknown): string => (value === undefined ? "nothing" : JSON.stringify(value));
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const checkValue = (spec: ParamSpec, value: unknown, path: string, out: Problem[]): void => {
  const report = (message: string): void => {
    out.push({ path, message });
  };
  switch (spec.kind) {
    case "number": {
      if (typeof value !== "number" || !Number.isFinite(value)) return report(`expected a finite number, found ${describe(value)}`);
      if (spec.integer && !Number.isInteger(value)) return report(`expected an integer, found ${value}`);
      if (spec.min !== undefined && (spec.exclusiveMin ? value <= spec.min : value < spec.min)) {
        return report(`expected a number ${spec.exclusiveMin ? "greater than" : "at least"} ${spec.min}, found ${value}`);
      }
      if (spec.max !== undefined && value > spec.max) return report(`expected a number at most ${spec.max}, found ${value}`);
      return;
    }
    case "color":
      if (spec.currentColor && value === CURRENT_COLOUR) return;
      if (typeof value !== "string") return report(`expected a colour token path, found ${describe(value)}`);
      if (isColourLiteral(value)) return report("colour literals are not allowed; use a token path");
      if (!COLOUR_TOKENS.has(value)) return report(`expected a colour token path such as color.healthy, found ${describe(value)}`);
      return;
    case "dataColor":
      if (typeof value !== "string") return report(`expected a colour token path or #RRGGBB, found ${describe(value)}`);
      if (DATA_COLOUR.test(value) || COLOUR_TOKENS.has(value)) return;
      return report(`expected a colour token path or a data colour #RRGGBB, found ${describe(value)}`);
    case "string":
      if (typeof value !== "string") return report(`expected a string, found ${describe(value)}`);
      if (spec.nonEmpty && value.trim() === "") return report("expected a non-empty string");
      if (spec.pattern && !spec.pattern.test(value)) return report(`expected ${spec.patternName ?? spec.pattern.source}`);
      return;
    case "enum":
      if (typeof value !== "string" || !spec.values.includes(value)) {
        return report(`expected one of ${spec.values.join(", ")}, found ${describe(value)}`);
      }
      return;
    case "boolean":
      if (typeof value !== "boolean") return report(`expected true or false, found ${describe(value)}`);
      return;
    case "point":
      // Any finite number: a map position has no maximum (spec illustration-pieces, "Positions of any size").
      // Both indices read directly: every() skips the holes of a sparse array.
      if (!Array.isArray(value) || value.length !== 2 || ![value[0], value[1]].every((n) => typeof n === "number" && Number.isFinite(n))) {
        return report(`expected a point [x, y] of finite numbers, found ${describe(value)}`);
      }
      return;
    case "array":
      if (!Array.isArray(value)) return report(`expected an array, found ${describe(value)}`);
      if (spec.minItems !== undefined && value.length < spec.minItems) return report(`expected at least ${spec.minItems} item(s)`);
      if (value.length > (spec.maxItems ?? MAX_ITEMS)) return report(`expected at most ${spec.maxItems ?? MAX_ITEMS} item(s)`);
      // An index loop, not forEach: a hole in a sparse array is checked as a missing item, not skipped.
      for (let index = 0; index < value.length; index++) checkValue(spec.of, value[index], `${path}[${index}]`, out);
      return;
    case "object":
      if (!isPlainObject(value)) return report(`expected an object, found ${describe(value)}`);
      out.push(...checkParams(spec.fields, value, path));
      return;
  }
};

/** Every problem of `params` against `schema`; paths are `prefix.name`. */
export const checkParams = (schema: Schema, params: Record<string, unknown>, prefix = ""): Problem[] => {
  const out: Problem[] = [];
  const at = (name: string) => (prefix ? `${prefix}.${name}` : name);
  for (const name of Object.keys(params)) {
    if (!Object.hasOwn(schema, name)) out.push({ path: at(name), message: `unknown parameter (expected ${Object.keys(schema).join(", ")})` });
  }
  for (const [name, spec] of Object.entries(schema)) {
    if (!Object.hasOwn(params, name) || params[name] === undefined) {
      if (spec.required) out.push({ path: at(name), message: "missing required parameter" });
      continue;
    }
    checkValue(spec, params[name], at(name), out);
  }
  return out;
};

/** Validates params for a call from code; the first problem becomes a RangeError. */
export const assertParams = (piece: string, schema: Schema, params: Record<string, unknown>): void => {
  const problems = checkParams(schema, params);
  if (problems.length > 0) throw new RangeError(`${piece}: ${problems[0].path}: ${problems[0].message}`);
};

// Shorthands for schemas.
export const num = (extra: Omit<Extract<ParamSpec, { kind: "number" }>, "kind"> = {}): ParamSpec => ({ kind: "number", ...extra });
/** Largest size a piece accepts, far above any banner. Positions and points have no bound. */
export const MAX_SIZE = 10000;
/** Most items in any list parameter (rows, lines, nodes, tiles). */
export const MAX_ITEMS = 50;
/** A count of repeated parts (units, steps, teeth): an integer from `min` to `max`. */
export const count = (min: number, max: number): ParamSpec => ({ kind: "number", integer: true, min, max });

/** A size: greater than 0 (or at least `min`, where fixed insets need room), at most MAX_SIZE. */
export const size = (required = false, min?: number): ParamSpec =>
  min === undefined ? { kind: "number", min: 0, exclusiveMin: true, max: MAX_SIZE, required } : { kind: "number", min, max: MAX_SIZE, required };
/** A position: any finite number, because a map position has no maximum. */
export const pos = (): ParamSpec => ({ kind: "number", required: true });
export const col = (): ParamSpec => ({ kind: "color" });
/** The paint keyword that follows the text colour of an inline SVG's element. */
export const CURRENT_COLOUR = "currentColor";
/** A token path or `currentColor`: for icons written inline in a page. */
export const colOrCurrent = (): ParamSpec => ({ kind: "color", currentColor: true });
/** SVG path data: commands, digits, signs, dots, commas and spaces only. */
export const PATH_DATA = /^[MmLlHhVvCcSsQqTtAaZz0-9eE.,+\-\s]+$/;

export const label = (required = true): ParamSpec => ({ kind: "string", nonEmpty: true, required });

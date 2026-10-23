// Cover specs (spec cover-cli; design §6): validation of the JSON a cover is
// written in, and the 800x420 frame that draws it from the pieces.
//
// Why here and not in scripts/: the validation and the frame are pure, so the
// tests and a future site build can use them without the command line.
//
// What can go wrong: an invalid spec returns every problem with its JSON path
// and draws nothing. A free-form object is limited to drawing tags and safe
// attributes, because the cover is published as SVG.
import { tokens } from "../../tokens/generated/tokens.ts";
import { PIECE_NAMES, PIECES, rings, type PieceName } from "./library.ts";
import { el, g, type SvgNode, type SvgTag } from "./node.ts";
import { COLOUR_TOKENS, checkParams, isColourLiteral, PATH_DATA, type Problem } from "./params.ts";

export const SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TOP_LEVEL = ["id", "title", "description", "background", "rings", "pieces", "custom"] as const;
const CUSTOM_TAGS: readonly SvgTag[] = ["g", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "text"];
// Attributes a free-form object may use (design §6): geometry, paint, text and transform.
const CUSTOM_ATTRS = new Set([
  "x", "y", "width", "height", "rx", "ry", "cx", "cy", "r", "x1", "y1", "x2", "y2", "points", "d",
  "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-dasharray", "opacity", "fill-opacity", "stroke-opacity",
  "font-size", "font-weight", "font-family", "text-anchor", "transform",
]);
const COLOUR_ATTRS = new Set(["fill", "stroke"]);
// Attributes whose value is a grammar, never a bare number.
const STRING_ONLY_ATTRS = new Set(["transform", "d", "points", "font-family", "text-anchor", "stroke-linecap", "stroke-linejoin"]);
const TRANSFORM = /^\s*(?:(?:translate|rotate|scale)\(\s*-?[\d.]+(?:[\s,]+-?[\d.]+){0,2}\s*\)\s*)+$/;

export type CoverPiece = { piece: PieceName } & Record<string, unknown>;
export type CustomNode = { tag: string; attrs?: Record<string, unknown>; children?: (CustomNode | string)[] };
export type CoverSpec = {
  id: string;
  title: string;
  description: string;
  background: string;
  rings: { cx: number; cy: number; radius?: number };
  pieces: CoverPiece[];
  custom?: CustomNode;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const describe = (value: unknown): string => (value === undefined ? "nothing" : JSON.stringify(value));

export const backgroundNames = (): string[] => Object.keys(tokens.coverBackground);

/** Every string in the spec that looks like a colour literal, by path. */
const colourLiterals = (value: unknown, path: string, out: Problem[]): void => {
  if (typeof value === "string") {
    if (isColourLiteral(value)) out.push({ path, message: "colour literals are not allowed; use a token path" });
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => colourLiterals(item, `${path}[${index}]`, out));
  } else if (isPlainObject(value)) {
    for (const [key, child] of Object.entries(value)) colourLiterals(child, path ? `${path}.${key}` : key, out);
  }
};

const checkCustom = (node: unknown, path: string, out: Problem[]): void => {
  if (!isPlainObject(node)) return void out.push({ path, message: `expected a node object, found ${describe(node)}` });
  for (const key of Object.keys(node)) {
    if (!["tag", "attrs", "children"].includes(key)) out.push({ path: `${path}.${key}`, message: "unknown key (expected tag, attrs, children)" });
  }
  if (typeof node.tag !== "string" || !(CUSTOM_TAGS as readonly string[]).includes(node.tag)) {
    out.push({ path: `${path}.tag`, message: `tag not allowed in a free-form object (allowed: ${CUSTOM_TAGS.join(", ")}), found ${describe(node.tag)}` });
  }
  if (node.attrs !== undefined) {
    if (!isPlainObject(node.attrs)) out.push({ path: `${path}.attrs`, message: "expected an object" });
    else {
      for (const [name, value] of Object.entries(node.attrs)) {
        const at = `${path}.attrs.${name}`;
        if (!CUSTOM_ATTRS.has(name)) {
          out.push({ path: at, message: "attribute not allowed in a free-form object" });
          continue;
        }
        if (typeof value === "number") {
          if (COLOUR_ATTRS.has(name) || STRING_ONLY_ATTRS.has(name)) out.push({ path: at, message: "expected a string" });
          else if (!Number.isFinite(value)) out.push({ path: at, message: "expected a finite number" });
          continue;
        }
        if (typeof value !== "string") {
          out.push({ path: at, message: `expected a string or a number, found ${describe(value)}` });
          continue;
        }
        if (/url\(|\/\//i.test(value)) {
          out.push({ path: at, message: "references are not allowed (url( or //)" });
          continue;
        }
        if (COLOUR_ATTRS.has(name) && value !== "none" && !isColourLiteral(value) && !COLOUR_TOKENS.has(value)) {
          out.push({ path: at, message: `expected none or a colour token path, found ${describe(value)}` });
        } else if (name === "transform" && !TRANSFORM.test(value)) {
          out.push({ path: at, message: "only translate, rotate and scale are allowed" });
        } else if ((name === "d" || name === "points") && !PATH_DATA.test(value)) {
          out.push({ path: at, message: "expected path characters only (commands, digits, signs, dots, commas, spaces)" });
        }
      }
    }
  }
  if (node.children !== undefined) {
    if (!Array.isArray(node.children)) out.push({ path: `${path}.children`, message: "expected an array" });
    else
      node.children.forEach((child, index) => {
        const at = `${path}.children[${index}]`;
        if (typeof child === "string") {
          if (node.tag !== "text") out.push({ path: at, message: "text is only allowed inside a text node" });
        } else checkCustom(child, at, out);
      });
  }
};

/** Orders strings by Unicode code point (JS `<` compares UTF-16 code units). */
const compareCodePoints = (a: string, b: string): number => {
  const left = Array.from(a);
  const right = Array.from(b);
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    const diff = left[i].codePointAt(0)! - right[i].codePointAt(0)!;
    if (diff !== 0) return diff;
  }
  return left.length - right.length;
};

/** Compares JSON paths: segment by segment, array indexes as numbers, names by code point. */
export const comparePaths = (a: string, b: string): number => {
  const split = (path: string) => path.match(/[^.[\]]+|\[\d+\]/g) ?? [];
  const left = split(a);
  const right = split(b);
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    const x = left[i];
    const y = right[i];
    if (x === y) continue;
    const xi = /^\[\d+\]$/.test(x);
    const yi = /^\[\d+\]$/.test(y);
    if (xi && yi) return Number(x.slice(1, -1)) - Number(y.slice(1, -1));
    return compareCodePoints(x, y);
  }
  return left.length - right.length;
};

/** Every problem of a parsed spec, sorted by path; empty when the spec is valid. */
export const validateCoverSpec = (spec: unknown): Problem[] => {
  if (!isPlainObject(spec)) return [{ path: "(root)", message: `a cover spec must be a JSON object, found ${Array.isArray(spec) ? "an array" : describe(spec)}` }];
  const out: Problem[] = [];
  colourLiterals(spec, "", out);
  for (const key of Object.keys(spec)) {
    if (!(TOP_LEVEL as readonly string[]).includes(key)) out.push({ path: key, message: `unknown key (expected ${TOP_LEVEL.join(", ")})` });
  }
  if (typeof spec.id !== "string" || !SAFE_ID.test(spec.id)) out.push({ path: "id", message: `expected a safe slug (lowercase letters, digits, single hyphens), found ${describe(spec.id)}` });
  for (const key of ["title", "description"] as const) {
    if (typeof spec[key] !== "string" || spec[key].trim() === "") out.push({ path: key, message: "expected a non-empty string" });
  }
  if (typeof spec.background !== "string" || !backgroundNames().includes(spec.background)) {
    out.push({ path: "background", message: `expected one of ${backgroundNames().join(", ")}, found ${describe(spec.background)}` });
  }
  if (!isPlainObject(spec.rings)) out.push({ path: "rings", message: "missing or not an object (expected cx, cy and an optional radius)" });
  else out.push(...checkParams(rings.schema, spec.rings, "rings").filter((problem) => problem.path !== "rings.color"));
  if (isPlainObject(spec.rings) && Object.hasOwn(spec.rings, "color")) out.push({ path: "rings.color", message: "unknown parameter: the ring colour comes from the background" });
  if (!Array.isArray(spec.pieces)) out.push({ path: "pieces", message: "missing or not an array" });
  else
    spec.pieces.forEach((entry, index) => {
      const at = `pieces[${index}]`;
      if (!isPlainObject(entry)) return void out.push({ path: at, message: "expected an object with piece and its parameters" });
      const { piece, ...params } = entry;
      if (typeof piece !== "string" || !(PIECE_NAMES as string[]).includes(piece)) {
        return void out.push({ path: `${at}.piece`, message: `unknown piece ${describe(piece)} (expected one of ${PIECE_NAMES.join(", ")})` });
      }
      if (piece === "rings") return void out.push({ path: `${at}.piece`, message: "rings belong to the cover's rings field" });
      const definition = PIECES[piece as PieceName] as { schema: typeof rings.schema; relations?: (p: Record<string, unknown>) => Problem[] };
      const own = checkParams(definition.schema, params, at);
      out.push(...own);
      // Limits between parameters are checked once each parameter is valid on its own.
      if (own.length === 0 && definition.relations) out.push(...definition.relations(params).map((problem) => ({ path: `${at}.${problem.path}`, message: problem.message })));
    });
  if (spec.custom !== undefined) {
    if (Array.isArray(spec.custom)) out.push({ path: "custom", message: "one free-form object per cover; a repeated object must be a piece" });
    else checkCustom(spec.custom, "custom", out);
  }
  // A colour literal is reported once, by the literal check, not again as a bad token path.
  // A container with the wrong shape is one problem: nothing inside it is reported.
  const blocked: string[] = [];
  if (!Array.isArray(spec.pieces) && spec.pieces !== undefined) blocked.push("pieces");
  if (Array.isArray(spec.pieces)) {
    spec.pieces.forEach((entry, index) => {
      const known = isPlainObject(entry) && typeof entry.piece === "string" && (PIECE_NAMES as string[]).includes(entry.piece) && entry.piece !== "rings";
      if (!known) blocked.push(`pieces[${index}]`);
    });
  }
  if (Array.isArray(spec.custom)) blocked.push("custom");
  if (!isPlainObject(spec.rings) && spec.rings !== undefined) blocked.push("rings");
  const insideBlocked = (path: string) => blocked.some((b) => (path.startsWith(`${b}.`) || path.startsWith(`${b}[`)) && path !== `${b}.piece`);
  out.splice(0, out.length, ...out.filter((p) => !insideBlocked(p.path)));
  const literalPaths = new Set(out.filter((p) => p.message.startsWith("colour literals")).map((p) => p.path));
  const seen = new Set<string>();
  const unique = out.filter((p) => {
    const key = `${p.path}\u0000${p.message}`;
    if (seen.has(key) || (literalPaths.has(p.path) && !p.message.startsWith("colour literals"))) return false;
    seen.add(key);
    return true;
  });
  return unique.sort((a, b) => comparePaths(a.path, b.path) || compareCodePoints(a.message, b.message));
};

const resolveCustom = (node: CustomNode): SvgNode => {
  const attrs: Record<string, string | number> = {};
  for (const [name, value] of Object.entries(node.attrs ?? {})) {
    attrs[name] = typeof value === "string" && COLOUR_ATTRS.has(name) && value !== "none" ? COLOUR_TOKENS.get(value)! : (value as string | number);
  }
  // The outlined group would stroke the letters; free-form words are never outlined.
  if (node.tag === "text") attrs.stroke = "none";
  return el(node.tag as SvgTag, attrs, ...(node.children ?? []).map((child) => (typeof child === "string" ? child : resolveCustom(child))));
};

/** The cover's node tree. The spec must be valid (validateCoverSpec returned no problem). */
export const coverTree = (spec: CoverSpec): SvgNode => {
  const { width, height } = tokens.cover;
  const pair = tokens.coverBackground[spec.background as keyof typeof tokens.coverBackground];
  const drawnPieces = spec.pieces.map(({ piece, ...params }) => (PIECES[piece] as (p: object) => { body: readonly SvgNode[]; text: readonly SvgNode[] })(params));
  const ringPath = `coverBackground.${spec.background}.ring`;
  return el(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      role: "img",
      "aria-labelledby": `${spec.id}-title ${spec.id}-desc`,
      "font-family": tokens.font.sans,
    },
    el("title", { id: `${spec.id}-title` }, spec.title),
    el("desc", { id: `${spec.id}-desc` }, spec.description),
    el("defs", {}, el("clipPath", { id: `${spec.id}-frame` }, el("rect", { width, height }))),
    el("rect", { width, height, fill: pair.fill }),
    g({ "clip-path": `url(#${spec.id}-frame)` }, ...rings({ ...spec.rings, color: ringPath }).body),
    g(
      { stroke: tokens.color.ink, "stroke-width": tokens.outline.block, "stroke-linejoin": "round" },
      ...drawnPieces.flatMap((d) => d.body),
      spec.custom ? resolveCustom(spec.custom) : null,
    ),
    g(
      { "font-size": tokens.cover.labelSize, "font-weight": tokens.cover.labelWeight, fill: tokens.color.ink, "text-anchor": "middle" },
      ...drawnPieces.flatMap((d) => d.text),
    ),
  );
};

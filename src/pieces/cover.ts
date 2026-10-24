// Cover specs (spec cover-cli; design §6): validation of the JSON a cover is
// written in, and the frames that draw it from the pieces: the 800x420 cover,
// the banner, the body diagram and the icon (change designer-formats).
//
// Why here and not in scripts/: the validation and the frame are pure, so the
// tests and a future site build can use them without the command line.
//
// What can go wrong: an invalid spec returns every problem with its JSON path
// and draws nothing. A free-form object is limited to drawing tags and safe
// attributes, because the cover is published as SVG.
import { tokens } from "../../tokens/generated/tokens.ts";
import { PIECE_NAMES, PIECES, rings, type PieceName } from "./library.ts";
import { EIP_ICON_HEIGHT, EIP_ICON_WIDTH, EIP_ICONS } from "./eip-icons.ts";
import { LINK_ICON_SIZE } from "./link-icons.ts";
import { el, g, r2, type SvgNode, type SvgTag } from "./node.ts";
import { UI_ICON_SIZE } from "./ui-icons.ts";
import { COLOUR_TOKENS, CURRENT_COLOUR, checkParams, isColourLiteral, MAX_SIZE, PATH_DATA, type Problem } from "./params.ts";

export const SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TOP_LEVEL = ["id", "title", "description", "format", "background", "rings", "pieces", "custom", "customAt", "height", "text"] as const;
/** Cover (800x420, the default), banner (1200x420, rounded corners), body diagram (560 laid out, 800 shown) or icon:
 * spec cover-cli, "Banner output", "Diagram output", "Icon output". */
export const FORMATS = ["cover", "banner", "diagram", "icon"] as const;
export type CoverFormat = (typeof FORMATS)[number];
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
export type CoverRings = { cx: number; cy: number; radius?: number };
type SpecCommon = {
  id: string;
  pieces: CoverPiece[];
  /** One table per language; `"@key"` strings elsewhere are replaced for the language asked. */
  text?: Record<string, Record<string, string | string[]>>;
};
type Framed = SpecCommon & {
  title: string;
  description: string;
  rings: CoverRings;
  custom?: CustomNode;
  /** `custom` is drawn before `pieces[customAt]`; default after every piece. */
  customAt?: number;
};
/** A cover spec, by format (spec cover-cli, "Cover spec format" and each format's keys). */
export type CoverSpec =
  | (Framed & { format?: "cover" | "banner"; background: string; height?: never })
  | (Framed & { format: "diagram"; /** Layout units. */ height: number; background?: never })
  | (SpecCommon & {
      format: "icon";
      /** Not in an eipIcon spec: the icon's own title and description, with the credit, are drawn. */
      title?: string;
      description?: string;
      background?: never;
      rings?: never;
      custom?: never;
      customAt?: never;
      height?: never;
    });

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

// ---------- text tables (spec cover-cli "Text tables", "Text references", "Language choice"; design §3) ----------

/** A language of a text table and of `--lang`: `pt`, `en`, `pt-br`. */
export const LANGUAGE = /^[a-z]{2}(-[a-z]{2})?$/;
const TEXT_KEY = /^[A-Za-z][A-Za-z0-9_-]*$/;
const REFERENCE = /^@([A-Za-z][A-Za-z0-9_-]*)$/;
type TextValue = string | string[];
export type CoverOptions = { lang?: string };

const isTextValue = (value: unknown): value is TextValue =>
  (typeof value === "string" && value !== "") ||
  (Array.isArray(value) && value.length > 0 && Array.from({ length: value.length }, (_, i) => value[i]).every((item) => typeof item === "string" && item !== ""));

/** The table `lang` picks, or the problems of the tables and of the language choice. */
const pickTable = (spec: Record<string, unknown>, lang: string | undefined): { table?: Record<string, TextValue>; problems: Problem[] } => {
  if (spec.text === undefined) return { problems: lang === undefined ? [] : [{ path: "text", message: "--lang needs text tables" }] };
  const text = spec.text;
  if (!isPlainObject(text) || Object.keys(text).length === 0) return { problems: [{ path: "text", message: "expected an object of languages (such as en, pt), each a table of text keys" }] };
  const problems: Problem[] = [];
  const tables = new Map<string, Record<string, unknown>>();
  for (const [code, table] of Object.entries(text)) {
    if (!LANGUAGE.test(code)) problems.push({ path: `text.${code}`, message: "expected a language code such as pt or en" });
    else if (!isPlainObject(table)) problems.push({ path: `text.${code}`, message: "expected an object of text keys" });
    else tables.set(code, table);
  }
  const keys = new Set<string>();
  for (const [code, table] of tables) {
    for (const [key, value] of Object.entries(table)) {
      keys.add(key);
      if (!TEXT_KEY.test(key)) problems.push({ path: `text.${code}.${key}`, message: "expected a text key (a letter, then letters, digits, _ or -)" });
      else if (!isTextValue(value)) problems.push({ path: `text.${code}.${key}`, message: "expected a non-empty string or a non-empty array of non-empty strings" });
    }
  }
  for (const [code, table] of tables) {
    for (const key of keys) if (!Object.hasOwn(table, key)) problems.push({ path: `text.${code}.${key}`, message: "missing: another language defines it" });
  }
  if (problems.length > 0) return { problems };
  const codes = [...tables.keys()].sort().join(", ");
  if (lang === undefined) return { problems: [{ path: "text", message: `choose a language with --lang (${codes})` }] };
  if (!tables.has(lang)) return { problems: [{ path: "text", message: `no table for ${lang} (${codes})` }] };
  return { table: tables.get(lang) as Record<string, TextValue>, problems: [] };
};

/** The spec with every `@key` outside `text` replaced once by the table's value; unknown keys by path. */
const resolveText = (spec: Record<string, unknown>, table: Record<string, TextValue>): { spec: Record<string, unknown>; unknown: Problem[] } => {
  const unknown: Problem[] = [];
  const visit = (value: unknown, path: string): unknown => {
    if (typeof value === "string") {
      const match = REFERENCE.exec(value);
      if (!match) return value;
      if (!Object.hasOwn(table, match[1])) {
        unknown.push({ path, message: `unknown text key ${match[1]}` });
        return value;
      }
      const found = table[match[1]];
      return Array.isArray(found) ? [...found] : found;
    }
    if (Array.isArray(value)) return Array.from({ length: value.length }, (_, i) => visit(value[i], `${path}[${i}]`));
    if (isPlainObject(value)) return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, visit(child, path ? `${path}.${key}` : key)]));
    return value;
  };
  const { text, ...rest } = spec;
  return { spec: { ...(visit(rest, "") as Record<string, unknown>), text }, unknown };
};

/** The spec the frame draws: resolved for `lang`, with the language in its id (decision 4). */
const forLanguage = (spec: CoverSpec, lang: string | undefined): CoverSpec => {
  if (spec.text === undefined || lang === undefined) return spec;
  const resolved = resolveText(spec as unknown as Record<string, unknown>, spec.text[lang]).spec as unknown as CoverSpec;
  // The id may be a reference too: the language goes on the resolved id.
  return { ...resolved, id: `${resolved.id}-${lang}` };
};

// ---------- validation ----------

/** Icon pieces and the box each draws in (spec cover-cli, "Icon output"). */
const ICON_PIECES = ["eipIcon", "uiIcon", "linkIcon"] as const;
const iconBox = (entry: CoverPiece): [number, number] => {
  if (entry.piece === "eipIcon") {
    const scale = (entry.scale as number | undefined) ?? 1;
    return [EIP_ICON_WIDTH * scale, EIP_ICON_HEIGHT * scale];
  }
  const side = (entry.size as number | undefined) ?? (entry.piece === "uiIcon" ? UI_ICON_SIZE : LINK_ICON_SIZE);
  return [side, side];
};

/** Problems of one `pieces` entry against its piece's parameters (spec cover-cli, "Piece parameters checked"). */
const checkEntry = (piece: PieceName, params: Record<string, unknown>, at: string, out: Problem[]): void => {
  const definition = PIECES[piece] as { schema: typeof rings.schema; relations?: (p: Record<string, unknown>) => Problem[] };
  const own = checkParams(definition.schema, params, at);
  // Every output is a standalone image: currentColor (accepted by uiIcon for inline page icons) is refused.
  for (const [name, spec] of Object.entries(definition.schema)) {
    if (spec.kind === "color" && spec.currentColor && params[name] === CURRENT_COLOUR) {
      own.push({ path: `${at}.${name}`, message: "currentColor is for icons inline in a page; a cover uses a token path" });
    }
  }
  out.push(...own);
  // Limits between parameters are reported with the schema's problems, except on a parameter
  // already reported; a relation that cannot read a broken parameter reports nothing.
  let related: Problem[] = [];
  if (definition.relations) {
    try {
      related = definition.relations(params);
    } catch {
      related = [];
    }
    const reported = new Set(own.map((problem) => problem.path));
    out.push(...related.map((problem) => ({ path: `${at}.${problem.path}`, message: problem.message })).filter((problem) => !reported.has(problem.path)));
  }
  // A valid entry is drawn once: an overflow is a spec problem at the entry, not a crash.
  if (own.length === 0 && related.length === 0) {
    try {
      (PIECES[piece] as (p: object) => unknown)(params);
    } catch (error) {
      if (error instanceof RangeError && error.message.endsWith(": the drawing overflows")) out.push({ path: at, message: "the drawing overflows" });
    }
  }
};

const checkRings = (spec: Record<string, unknown>, out: Problem[]): void => {
  if (!isPlainObject(spec.rings)) return void out.push({ path: "rings", message: "missing or not an object (expected cx, cy and an optional radius)" });
  const ringProblems = checkParams(rings.schema, spec.rings, "rings").filter((problem) => problem.path !== "rings.color" && problem.path !== "rings.count");
  out.push(...ringProblems);
  // The piece takes any finite centre; a spec keeps 0.1.0's ±10000, which bounds a banner's and a diagram's ring count.
  for (const axis of ["cx", "cy"] as const) {
    const value = spec.rings[axis];
    if (ringProblems.some((p) => p.path === `rings.${axis}`) || typeof value !== "number") continue;
    if (value < -MAX_SIZE) out.push({ path: `rings.${axis}`, message: `expected a number at least -${MAX_SIZE}, found ${value}` });
    else if (value > MAX_SIZE) out.push({ path: `rings.${axis}`, message: `expected a number at most ${MAX_SIZE}, found ${value}` });
  }
  if (Object.hasOwn(spec.rings, "color")) out.push({ path: "rings.color", message: "unknown parameter: the ring colour comes from the background" });
  if (Object.hasOwn(spec.rings, "count")) out.push({ path: "rings.count", message: "unknown parameter: the ring count comes from the format" });
};

const NOT_FOR_ICONS = "not used by the icon format";
const EIP_TEXT = "comes from the EIP icon, with its CC BY 4.0 credit";

/** Every problem of a resolved spec (no text references left to resolve). */
const validateResolved = (spec: Record<string, unknown>): { problems: Problem[]; blocked: string[] } => {
  const out: Problem[] = [];
  const blocked: string[] = [];
  colourLiterals(spec, "", out);
  for (const key of Object.keys(spec)) {
    if (!(TOP_LEVEL as readonly string[]).includes(key)) out.push({ path: key, message: `unknown key (expected ${TOP_LEVEL.join(", ")})` });
  }
  if (spec.format !== undefined && (typeof spec.format !== "string" || !(FORMATS as readonly string[]).includes(spec.format))) {
    out.push({ path: "format", message: `expected one of ${FORMATS.join(", ")}` });
  }
  // An unknown format is checked as a cover, as before this change.
  const format: CoverFormat = (FORMATS as readonly unknown[]).includes(spec.format) ? (spec.format as CoverFormat) : "cover";
  if (typeof spec.id !== "string" || !SAFE_ID.test(spec.id)) out.push({ path: "id", message: `expected a safe slug (lowercase letters, digits, single hyphens), found ${describe(spec.id)}` });

  const pieces = spec.pieces;
  const eipIconSpec = format === "icon" && Array.isArray(pieces) && pieces.length === 1 && isPlainObject(pieces[0]) && pieces[0].piece === "eipIcon";
  for (const key of ["title", "description"] as const) {
    if (eipIconSpec) {
      if (spec[key] !== undefined) out.push({ path: key, message: EIP_TEXT });
    } else if (typeof spec[key] !== "string" || spec[key].trim() === "") out.push({ path: key, message: "expected a non-empty string" });
  }

  if (format === "icon") {
    for (const key of ["background", "rings", "custom", "customAt", "height"]) if (spec[key] !== undefined) out.push({ path: key, message: NOT_FOR_ICONS });
    for (const key of ["background", "rings", "custom"]) if (spec[key] !== undefined) blocked.push(key);
  } else {
    if (format === "diagram") {
      if (spec.background !== undefined) out.push({ path: "background", message: "a diagram is drawn on color.panel; background is for covers and banners" });
      const height = spec.height;
      if (typeof height !== "number" || !Number.isFinite(height) || height < 1 || height > MAX_SIZE) out.push({ path: "height", message: `expected a number from 1 to ${MAX_SIZE}` });
    } else {
      if (typeof spec.background !== "string" || !backgroundNames().includes(spec.background)) {
        out.push({ path: "background", message: `expected one of ${backgroundNames().join(", ")}, found ${describe(spec.background)}` });
      }
      if (spec.height !== undefined) out.push({ path: "height", message: "only a diagram takes a height" });
    }
    checkRings(spec, out);
    if (!isPlainObject(spec.rings) && spec.rings !== undefined) blocked.push("rings");
    if (spec.custom !== undefined) {
      if (Array.isArray(spec.custom)) {
        out.push({ path: "custom", message: "one free-form object per cover; a repeated object must be a piece" });
        blocked.push("custom");
      } else checkCustom(spec.custom, "custom", out);
    }
    if (spec.customAt !== undefined) {
      const at = spec.customAt;
      if (spec.custom === undefined) out.push({ path: "customAt", message: "needs custom" });
      else if (Array.isArray(pieces) && (typeof at !== "number" || !Number.isInteger(at) || at < 0 || at > pieces.length)) {
        out.push({ path: "customAt", message: `expected an integer from 0 to ${pieces.length}` });
      }
    }
  }

  if (!Array.isArray(pieces)) {
    out.push({ path: "pieces", message: "missing or not an array" });
    if (pieces !== undefined) blocked.push("pieces");
  } else if (format === "icon") {
    const entry = pieces[0];
    if (pieces.length !== 1 || !isPlainObject(entry) || !(ICON_PIECES as readonly unknown[]).includes(entry.piece)) {
      out.push({ path: "pieces", message: "an icon spec holds exactly one piece: eipIcon, uiIcon or linkIcon" });
      blocked.push("pieces");
    } else {
      const { piece, ...params } = entry;
      for (const axis of ["x", "y"] as const) if (params[axis] !== undefined && params[axis] !== 0) out.push({ path: `pieces[0].${axis}`, message: "an icon is drawn at 0, 0" });
      checkEntry(piece as PieceName, { ...params, x: 0, y: 0 }, "pieces[0]", out);
    }
  } else {
    for (let index = 0; index < pieces.length; index++) {
      const entry: unknown = pieces[index];
      const at = `pieces[${index}]`;
      if (!isPlainObject(entry)) {
        out.push({ path: at, message: "expected an object with piece and its parameters" });
        blocked.push(at);
        continue;
      }
      const { piece, ...params } = entry;
      if (typeof piece !== "string" || !(PIECE_NAMES as string[]).includes(piece)) {
        out.push({ path: `${at}.piece`, message: `unknown piece ${describe(piece)} (expected one of ${PIECE_NAMES.join(", ")})` });
        blocked.push(at);
        continue;
      }
      if (piece === "rings") {
        out.push({ path: `${at}.piece`, message: "rings belong to the cover's rings field" });
        blocked.push(at);
        continue;
      }
      checkEntry(piece as PieceName, params, at, out);
    }
  }
  return { problems: out, blocked };
};

/** Under a path (the path itself included): `a` covers `a`, `a.b` and `a[0]`. */
const under = (path: string, base: string) => path === base || path.startsWith(`${base}.`) || path.startsWith(`${base}[`);

/** Sorted, one per path and message; a colour literal replaces any other problem at its path. */
const finish = (out: Problem[]): Problem[] => {
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

/** Every problem of a parsed spec, sorted by path; empty when the spec is valid. `lang` picks a text table. */
export const validateCoverSpec = (spec: unknown, options: CoverOptions = {}): Problem[] => {
  if (!isPlainObject(spec)) return [{ path: "(root)", message: `a cover spec must be a JSON object, found ${Array.isArray(spec) ? "an array" : describe(spec)}` }];
  // Text problems stop the check: references cannot be resolved, so the rest would report false problems.
  const { table, problems: textProblems } = pickTable(spec, options.lang);
  if (textProblems.length > 0) return finish(textProblems);
  const { spec: resolved, unknown } = table ? resolveText(spec, table) : { spec, unknown: [] };
  const { problems, blocked } = validateResolved(resolved);
  // A container with the wrong shape is one problem: nothing inside it is reported (its `piece` problem stays).
  // An unknown text key replaces every other problem at its path.
  const insideBlocked = (path: string) => blocked.some((b) => under(path, b) && path !== b && path !== `${b}.piece`);
  // Unknown references inside a wrong container are not reported either: the container is one problem.
  const unknownKept = unknown.filter((u) => !insideBlocked(u.path));
  const kept = problems.filter((p) => !insideBlocked(p.path) && !unknownKept.some((u) => under(p.path, u.path)));
  return finish([...kept, ...unknownKept]);
};

// ---------- drawing ----------

const resolveCustom = (node: CustomNode): SvgNode => {
  const attrs: Record<string, string | number> = {};
  for (const [name, value] of Object.entries(node.attrs ?? {})) {
    attrs[name] = typeof value === "string" && COLOUR_ATTRS.has(name) && value !== "none" ? COLOUR_TOKENS.get(value)! : (value as string | number);
  }
  // The outlined group would stroke the letters; free-form words are never outlined.
  if (node.tag === "text") attrs.stroke = "none";
  return el(node.tag as SvgTag, attrs, ...(node.children ?? []).map((child) => (typeof child === "string" ? child : resolveCustom(child))));
};

/** Rings a banner draws: out to the frame's farthest corner (spec cover-cli, "Banner rings reach the corners"). */
export const bannerRingCount = (cx: number, cy: number, radius: number = tokens.cover.ringRadius): number => {
  const { width, height } = tokens.banner;
  const far = Math.max(...[[0, 0], [width, 0], [0, height], [width, height]].map(([x, y]) => Math.hypot(x - cx, y - cy)));
  return Math.max(1, Math.ceil((far - radius) / tokens.cover.ringStep) + 1);
};

/** Layout units per shown pixel of a body diagram (560 / 800). */
const LAYOUT_SCALE = tokens.bodyDiagram.layoutWidth / tokens.bodyDiagram.width;

/** Rings of a diagram (spec cover-cli, "Diagram rings at the shown scale"): the cover's step and width at the shown scale. */
export const diagramRings = (cx: number, cy: number, height: number, radius: number = tokens.bodyDiagram.ringRadius * LAYOUT_SCALE): { count: number; step: number; width: number; radius: number } => {
  const width = tokens.bodyDiagram.layoutWidth;
  const step = tokens.cover.ringStep * LAYOUT_SCALE;
  const far = Math.max(...[[0, 0], [width, 0], [0, height], [width, height]].map(([x, y]) => Math.hypot(x - cx, y - cy)));
  return { count: Math.max(1, Math.ceil((far - radius) / step) + 1), step, width: tokens.cover.ringWidth * LAYOUT_SCALE, radius };
};

type Drawing = { body: readonly SvgNode[]; text: readonly SvgNode[] };
const draw = (entry: CoverPiece): Drawing => {
  const { piece, ...params } = entry;
  return (PIECES[piece] as (p: object) => Drawing)(params);
};

/** The outlined group's children: every body in paint order, `custom` before `pieces[customAt]` (default: last). */
const bodies = (spec: Extract<CoverSpec, { rings: CoverRings }>, drawnPieces: Drawing[]): (SvgNode | null)[] => {
  const custom = spec.custom ? resolveCustom(spec.custom) : null;
  const at = spec.customAt ?? drawnPieces.length;
  return [...drawnPieces.slice(0, at).flatMap((d) => d.body), custom, ...drawnPieces.slice(at).flatMap((d) => d.body)];
};

const root = (id: string, width: number, height: number, viewBox: string, ...children: (SvgNode | null)[]): SvgNode =>
  el(
    "svg",
    { xmlns: "http://www.w3.org/2000/svg", width, height, viewBox, role: "img", "aria-labelledby": `${id}-title ${id}-desc`, "font-family": tokens.font.sans },
    ...children,
  );

/** An icon (spec cover-cli, "Icon output"): the piece at 0,0 in a box of its own size. */
const iconTree = (spec: Extract<CoverSpec, { format: "icon" }>): SvgNode => {
  const entry = spec.pieces[0];
  const [width, height] = iconBox(entry);
  const eip = entry.piece === "eipIcon" ? EIP_ICONS.find((icon) => icon.name === entry.name) : undefined;
  return root(
    spec.id,
    width,
    height,
    `0 0 ${width} ${height}`,
    el("title", { id: `${spec.id}-title` }, eip?.title ?? spec.title),
    el("desc", { id: `${spec.id}-desc` }, eip?.description ?? spec.description),
    ...draw({ ...entry, x: 0, y: 0 }).body,
  );
};

/** A body diagram (spec cover-cli, "Diagram output"): laid out 560 wide, shown 800 wide, on the panel. */
const diagramTree = (spec: Extract<CoverSpec, { format: "diagram" }>): SvgNode => {
  const width = tokens.bodyDiagram.layoutWidth;
  const height = spec.height;
  const rx = r2(tokens.bodyDiagram.radius * LAYOUT_SCALE);
  const frame = `url(#${spec.id}-frame)`;
  const ring = diagramRings(spec.rings.cx, spec.rings.cy, height, spec.rings.radius);
  const drawnPieces = spec.pieces.map(draw);
  return root(
    spec.id,
    tokens.bodyDiagram.width,
    r2(height / LAYOUT_SCALE),
    `0 0 ${width} ${height}`,
    el("title", { id: `${spec.id}-title` }, spec.title),
    el("desc", { id: `${spec.id}-desc` }, spec.description),
    el("defs", {}, el("clipPath", { id: `${spec.id}-frame` }, el("rect", { width, height, rx }))),
    el("rect", { width, height, rx, fill: tokens.color.panel }),
    g(
      { "clip-path": frame },
      g(
        { fill: "none", stroke: tokens.color.ring, "stroke-width": r2(ring.width) },
        ...Array.from({ length: ring.count }, (_, i) => el("circle", { cx: spec.rings.cx, cy: spec.rings.cy, r: r2(ring.radius + i * ring.step) })),
      ),
    ),
    g(
      { "clip-path": frame },
      g({ stroke: tokens.color.ink, "stroke-width": tokens.map.outline, "stroke-linejoin": "round" }, ...bodies(spec, drawnPieces)),
      g({ "font-size": tokens.map.labelSize, "font-weight": tokens.cover.labelWeight, fill: tokens.color.ink, "text-anchor": "middle" }, ...drawnPieces.flatMap((d) => d.text)),
    ),
  );
};

/** The cover's (banner's, diagram's, icon's) node tree. The spec must be valid for `lang` (validateCoverSpec returned no problem). */
export const coverTree = (input: CoverSpec, options: CoverOptions = {}): SvgNode => {
  const spec = forLanguage(input, options.lang);
  if (spec.format === "icon") return iconTree(spec);
  if (spec.format === "diagram") return diagramTree(spec);
  const banner = spec.format === "banner";
  const { width, height } = banner ? tokens.banner : tokens.cover;
  // A banner's corners are rounded; a cover keeps today's square frame, attribute for attribute.
  const corner: Record<string, number> = banner ? { rx: tokens.banner.radius } : {};
  const pair = tokens.coverBackground[spec.background as keyof typeof tokens.coverBackground];
  const drawnPieces = spec.pieces.map(draw);
  const ringPath = `coverBackground.${spec.background}.ring`;
  const ringCount: { count?: number } = banner ? { count: bannerRingCount(spec.rings.cx, spec.rings.cy, spec.rings.radius) } : {};
  const frame = `url(#${spec.id}-frame)`;
  const outlined = g({ stroke: tokens.color.ink, "stroke-width": tokens.outline.block, "stroke-linejoin": "round" }, ...bodies(spec, drawnPieces));
  const labels = g(
    { "font-size": tokens.cover.labelSize, "font-weight": tokens.cover.labelWeight, fill: tokens.color.ink, "text-anchor": "middle" },
    ...drawnPieces.flatMap((d) => d.text),
  );
  return root(
    spec.id,
    width,
    height,
    `0 0 ${width} ${height}`,
    el("title", { id: `${spec.id}-title` }, spec.title),
    el("desc", { id: `${spec.id}-desc` }, spec.description),
    el("defs", {}, el("clipPath", { id: `${spec.id}-frame` }, el("rect", { width, height, ...corner }))),
    el("rect", { width, height, ...corner, fill: pair.fill }),
    g({ "clip-path": frame }, ...rings({ ...spec.rings, color: ringPath, ...ringCount }).body),
    // On a banner, pieces and labels are clipped too, so nothing pokes past a rounded corner.
    ...(banner ? [g({ "clip-path": frame }, outlined, labels)] : [outlined, labels]),
  );
};

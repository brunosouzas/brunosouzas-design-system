// Source faces embedded in an SVG tree (spec illustration-pieces, "Fonts
// embedded in an SVG tree"; design.md Decision 1, ADR 0008), exported from the
// subpath `@brunosouzas/design-system/fonts`.
//
// Why: the site shows covers and diagrams through `<img>`, which never loads a
// page's web fonts, and Source is not installed on most readers' machines. So
// every written image carries, as a TrueType subset in a `<style>`, only the
// characters it draws in each Source face; the reader sees Source, at 2-10 KB
// gzip per image.
//
// How: `await embedFonts(tree)` returns a new tree with one `style` after the
// root's `desc` (or first), one `@font-face` per face its drawn text uses. The
// cover command and `npm run pieces:sheet` call it before writing.
//
// What can go wrong: an unreadable font file or a WebAssembly module that does
// not load rejects with an Error naming the file or `harfbuzzjs`; a failed load
// is not cached, so the next call retries. A character no shipped face has is
// left out of the subset (the browser takes it from the next family of the
// stack). This module reads files, so it lives outside src/pieces/, whose
// modules stay pure (the root entry must import in a browser bundle).
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { SvgNode } from "../pieces/node.ts";

const PACKAGE_NAME = "@brunosouzas/design-system";

// The shipped faces: the five unmodified Adobe files in fonts/. `upTo` is the
// upper bound of the range its @font-face declares (`range`). A weight up to it
// takes this face; a fraction between two ranges (549.5, 799.5) takes the next,
// heavier face, which is what the browser's font matching picks for a weight
// above 500 that no range holds, so the subset and the drawn face agree.
type Face = { readonly family: string; readonly weight: number; readonly upTo: number; readonly range: string; readonly file: string };
const FACES: readonly Face[] = [
  { family: "Source Code Pro", weight: 400, upTo: 549, range: "100 549", file: "SourceCodePro-Regular.ttf" },
  { family: "Source Code Pro", weight: 700, upTo: Infinity, range: "550 900", file: "SourceCodePro-Bold.ttf" },
  { family: "Source Sans 3", weight: 400, upTo: 549, range: "100 549", file: "SourceSans3-Regular.ttf" },
  { family: "Source Sans 3", weight: 700, upTo: 799, range: "550 799", file: "SourceSans3-Bold.ttf" },
  { family: "Source Sans 3", weight: 900, upTo: Infinity, range: "800 900", file: "SourceSans3-Black.ttf" },
];
// FACES is already in the order of the rules: family name by code point, then weight.

/** Subtrees whose strings are never drawn. */
const NOT_DRAWN = new Set(["title", "desc", "style"]);

type Inherited = { family?: string; weight?: string | number };

/** First family of a `font-family` list, trimmed and unquoted. */
const firstFamily = (value: string): string => value.split(",")[0].trim().replace(/^(["'])(.*)\1$/, "$2");

/** CSS weight of a `font-weight` value: keywords other than `bold`, and anything non-numeric, are 400. */
const weightOf = (value: string | number | undefined): number => {
  if (typeof value === "number") return value;
  if (value === undefined) return 400;
  const trimmed = value.trim();
  if (trimmed === "bold") return 700;
  return /^\d+(\.\d+)?$/.test(trimmed) ? Number(trimmed) : 400;
};

/** The shipped face a text is drawn in, or undefined (another family, or none). Italic and oblique take the upright face. */
const faceOf = (inherited: Inherited): Face | undefined => {
  if (inherited.family === undefined) return undefined;
  const family = firstFamily(inherited.family);
  const weight = weightOf(inherited.weight);
  const ofFamily = FACES.filter((face) => face.family === family);
  // Snapped to the first face whose declared range reaches the weight (549.5
  // goes to 700 and 799.5 to 900, as in the browser); above 900, the heaviest.
  return ofFamily.find((face) => weight <= face.upTo);
};

/** Drawn characters per face: the strings of text and tspan nodes, outside title, desc and style. */
const drawnText = (node: SvgNode, inherited: Inherited, out: Map<Face, Set<string>>): void => {
  if (NOT_DRAWN.has(node.tag)) return;
  const own: Inherited = {
    family: node.attrs["font-family"] === undefined ? inherited.family : String(node.attrs["font-family"]),
    weight: node.attrs["font-weight"] ?? inherited.weight,
  };
  const isText = node.tag === "text" || node.tag === "tspan";
  for (const child of node.children) {
    if (typeof child !== "string") drawnText(child, own, out);
    else if (isText) {
      const face = faceOf(own);
      if (face === undefined) continue;
      const characters = out.get(face) ?? new Set<string>();
      for (const character of child) characters.add(character);
      out.set(face, characters);
    }
  }
};

// ---------- loading (lazy, once per process, failures not cached) ----------

let fontsFolder: string | undefined;
/** `fonts/` of this package: the nearest package.json above this module named @brunosouzas/design-system (works from src/ and dist/). */
const fontsDir = (): string => {
  if (fontsFolder !== undefined) return fontsFolder;
  const start = dirname(fileURLToPath(import.meta.url));
  for (let dir = start; ; dir = dirname(dir)) {
    const manifest = join(dir, "package.json");
    if (existsSync(manifest) && (JSON.parse(readFileSync(manifest, "utf8")) as { name?: string }).name === PACKAGE_NAME) {
      fontsFolder = join(dir, "fonts");
      return fontsFolder;
    }
    if (dirname(dir) === dir) throw new Error(`cannot find the fonts/ folder of ${PACKAGE_NAME} above ${start}`);
  }
};

const message = (error: unknown): string => (error instanceof Error ? error.message : String(error));

const fontFiles = new Map<string, Promise<Uint8Array>>();
const fontFile = (file: string): Promise<Uint8Array> => {
  const path = join(fontsDir(), file);
  let loading = fontFiles.get(path);
  if (loading === undefined) {
    loading = readFile(path).then(
      (bytes) => new Uint8Array(bytes),
      (error: unknown) => {
        fontFiles.delete(path); // not cached: the next call reads it again
        throw new Error(`cannot read the font file ${path}: ${message(error)}`);
      },
    );
    fontFiles.set(path, loading);
  }
  return loading;
};

// The raw exports of harfbuzzjs's subset module (HarfBuzz's own C API).
type HarfBuzz = {
  memory: WebAssembly.Memory;
  _initialize: () => void;
  malloc: (size: number) => number;
  free: (pointer: number) => void;
  hb_blob_create: (data: number, length: number, mode: number, userData: number, destroy: number) => number;
  hb_blob_destroy: (blob: number) => void;
  hb_blob_get_data: (blob: number, length: number) => number;
  hb_blob_get_length: (blob: number) => number;
  hb_face_create: (blob: number, index: number) => number;
  hb_face_destroy: (face: number) => void;
  hb_face_reference_blob: (face: number) => number;
  hb_set_add: (set: number, value: number) => void;
  hb_set_clear: (set: number) => void;
  hb_subset_input_create_or_fail: () => number;
  hb_subset_input_destroy: (input: number) => void;
  hb_subset_input_set: (input: number, kind: number) => number;
  hb_subset_input_get_flags: (input: number) => number;
  hb_subset_input_set_flags: (input: number, flags: number) => void;
  hb_subset_or_fail: (face: number, input: number) => number;
};

let harfBuzz: Promise<HarfBuzz> | undefined;
const subsetter = (): Promise<HarfBuzz> => {
  if (harfBuzz !== undefined) return harfBuzz;
  const loading = (async () => {
    try {
      const wasm = createRequire(import.meta.url).resolve("harfbuzzjs/dist/harfbuzz-subset.wasm");
      const { instance } = await WebAssembly.instantiate(await readFile(wasm));
      const hb = instance.exports as unknown as HarfBuzz;
      hb._initialize();
      return hb;
    } catch (error) {
      throw new Error(`harfbuzzjs: cannot load the WebAssembly subsetter: ${message(error)}`);
    }
  })();
  // Cached only once assigned, and cleared on rejection, so a failure thrown
  // before the first await (the module cannot be resolved) is not cached either.
  harfBuzz = loading;
  loading.catch(() => {
    if (harfBuzz === loading) harfBuzz = undefined; // not cached: the next call loads it again
  });
  return loading;
};

// ---------- subsetting ----------

// The mode of the spike that proved the routine (card 300): HarfBuzz may use the copy in place; it is freed after.
const HB_MEMORY_MODE_WRITABLE = 2;
const HB_SUBSET_SETS_UNICODE = 1;
const HB_SUBSET_SETS_LAYOUT_FEATURE_TAG = 6;
const HB_SUBSET_FLAGS_NO_HINTING = 0x1;
// Kerning and the ligatures the text may use; every other layout feature is dropped.
const LAYOUT_FEATURES = ["kern", "liga", "calt"];
const tag = (name: string): number => [...name].reduce((value, character) => ((value << 8) | character.charCodeAt(0)) >>> 0, 0);

/** A TrueType subset of `font` holding the glyphs of `characters` (deterministic: same input, same bytes). */
const subset = (hb: HarfBuzz, font: Uint8Array, characters: Set<string>, file: string): Uint8Array => {
  const input = hb.hb_subset_input_create_or_fail();
  if (input === 0) throw new Error(`harfbuzzjs: cannot create a subset input for ${file}`);
  const data = hb.malloc(font.byteLength);
  new Uint8Array(hb.memory.buffer).set(font, data);
  const blob = hb.hb_blob_create(data, font.byteLength, HB_MEMORY_MODE_WRITABLE, 0, 0);
  const face = hb.hb_face_create(blob, 0);
  hb.hb_blob_destroy(blob);
  try {
    const unicodes = hb.hb_subset_input_set(input, HB_SUBSET_SETS_UNICODE);
    for (const character of characters) hb.hb_set_add(unicodes, character.codePointAt(0)!);
    const features = hb.hb_subset_input_set(input, HB_SUBSET_SETS_LAYOUT_FEATURE_TAG);
    hb.hb_set_clear(features);
    for (const feature of LAYOUT_FEATURES) hb.hb_set_add(features, tag(feature));
    hb.hb_subset_input_set_flags(input, hb.hb_subset_input_get_flags(input) | HB_SUBSET_FLAGS_NO_HINTING);
    const result = hb.hb_subset_or_fail(face, input);
    if (result === 0) throw new Error(`harfbuzzjs: subsetting ${file} failed`);
    const out = hb.hb_face_reference_blob(result);
    const offset = hb.hb_blob_get_data(out, 0);
    const bytes = new Uint8Array(hb.memory.buffer).slice(offset, offset + hb.hb_blob_get_length(out));
    hb.hb_blob_destroy(out);
    hb.hb_face_destroy(result);
    return bytes;
  } finally {
    hb.hb_subset_input_destroy(input);
    hb.hb_face_destroy(face);
    hb.free(data);
  }
};

/** Glyph count of a TrueType font (its `maxp` table); a subset with only `.notdef` draws none of its characters. */
const glyphCount = (font: Uint8Array): number => {
  const view = new DataView(font.buffer, font.byteOffset, font.byteLength);
  const tables = view.getUint16(4);
  for (let i = 0; i < tables; i++) {
    const record = 12 + i * 16;
    if (view.getUint32(record) === tag("maxp")) return view.getUint16(view.getUint32(record + 8) + 4);
  }
  return 0;
};

const fontFace = (face: Face, font: Uint8Array): string =>
  `@font-face{font-family:'${face.family}';font-weight:${face.range};font-style:normal;src:url(data:font/ttf;base64,${Buffer.from(font).toString("base64")}) format('truetype')}`;

/**
 * The tree with the Source faces its drawn text uses embedded as subsets, in
 * one `style` right after the root's `desc` (or as its first child). A tree
 * with no face to embed resolves to the input; the input is never modified.
 */
export const embedFonts = async (tree: SvgNode): Promise<SvgNode> => {
  const used = new Map<Face, Set<string>>();
  drawnText(tree, {}, used);
  const faces = FACES.filter((face) => used.has(face));
  if (faces.length === 0) return tree;
  const hb = await subsetter();
  const rules: string[] = [];
  for (const face of faces) {
    const font = subset(hb, await fontFile(face.file), used.get(face)!, face.file);
    if (glyphCount(font) > 1) rules.push(fontFace(face, font));
  }
  if (rules.length === 0) return tree;
  const style: SvgNode = { tag: "style", attrs: {}, children: [rules.join("\n")] };
  const at = tree.children.findIndex((child) => typeof child !== "string" && child.tag === "desc") + 1;
  return { ...tree, children: [...tree.children.slice(0, at), style, ...tree.children.slice(at)] };
};

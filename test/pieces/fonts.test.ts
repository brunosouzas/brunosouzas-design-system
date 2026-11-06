// Unit tests of the font embedding (spec illustration-pieces, "Fonts embedded in
// an SVG tree", "Drawn text", "Face of a text", "Face weights", "Order of the
// faces", "Fonts loaded on first need", "Font embedding failure", "Fonts entry
// point"; task 1.2 of identity-v2-type-pieces-cleanup). Each test title is the
// spec scenario it proves.
//
// File reads are observed (and failed on demand) through a mock of
// node:fs/promises; the resolution of the harfbuzzjs wasm file through a mock
// of node:module's createRequire; the WebAssembly instantiation through a spy
// on WebAssembly.instantiate. Each test imports a fresh copy of the module, so the
// once-per-process caches start empty.
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { coverTree, type CoverSpec } from "../../src/pieces/cover";
import { edgeLabel } from "../../src/pieces/library";
import { el, g, type SvgNode } from "../../src/pieces/node";
import { toSvg } from "../../src/pieces/render";
import { tokens } from "../../tokens/generated/tokens";
import { codePoints } from "./cmap";

const io = vi.hoisted(() => ({ failing: new Set<string>(), reads: [] as string[], unresolvable: 0, resolves: [] as string[] }));
vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  const readFile = async (...args: Parameters<typeof actual.readFile>) => {
    const path = String(args[0]);
    io.reads.push(path);
    if ([...io.failing].some((name) => path.endsWith(name))) throw new Error("EACCES: permission denied (test)");
    return actual.readFile(...args);
  };
  return { ...actual, readFile, default: { ...actual, readFile } };
});
// `io.unresolvable` calls of `resolve` throw, as when harfbuzzjs is not installed.
vi.mock("node:module", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:module")>();
  const createRequire = (...args: Parameters<typeof actual.createRequire>) => {
    const require = actual.createRequire(...args);
    const original = require.resolve;
    const resolve = (request: string, options?: { paths?: string[] }) => {
      io.resolves.push(request);
      if (io.unresolvable > 0) {
        io.unresolvable -= 1;
        throw new Error(`Cannot find module '${request}' (test)`);
      }
      return original(request, options);
    };
    return Object.assign(require, { resolve: Object.assign(resolve, { paths: original.paths }) });
  };
  return { ...actual, createRequire, default: { ...actual, createRequire } };
});

const FONTS = new URL("../../fonts/", import.meta.url).pathname;
const BOLD = "SourceSans3-Bold.ttf";
const fontReads = () => io.reads.filter((path) => path.endsWith(".ttf"));
const fresh = async () => {
  vi.resetModules();
  return (await import("../../src/fonts/embed")).embedFonts;
};

beforeEach(() => {
  io.failing.clear();
  io.reads.length = 0;
  io.unresolvable = 0;
  io.resolves.length = 0;
});
afterEach(() => vi.restoreAllMocks());

type Rule = { family: string; weight: string; style: string; characters: string };
/** The @font-face rules of a tree's style, each with the characters its subset maps. */
const rulesOf = (tree: SvgNode): Rule[] => {
  const style = tree.children.find((child): child is SvgNode => typeof child !== "string" && child.tag === "style");
  if (style === undefined) return [];
  const css = style.children.join("");
  return [...css.matchAll(/@font-face\{font-family:'([^']+)';font-weight:([\d ]+);font-style:(\w+);src:url\(data:font\/ttf;base64,([A-Za-z0-9+/=]+)\) format\('truetype'\)\}/g)].map((m) => ({
    family: m[1],
    weight: m[2],
    style: m[3],
    characters: String.fromCodePoint(...codePoints(Buffer.from(m[4], "base64"))),
  }));
};
const faces = (tree: SvgNode) => rulesOf(tree).map((rule) => `${rule.family} ${rule.weight}`);
const sorted = (characters: string) => [...new Set(characters)].sort().join("");

const SANS = tokens.font.sans;
const MONO = tokens.font.mono;
const svg = (...children: SvgNode[]) => el("svg", { xmlns: "http://www.w3.org/2000/svg", "font-family": SANS }, ...children);
const text = (value: string, attrs: Record<string, string | number> = {}) => el("text", attrs, value);

const COVER: CoverSpec = {
  id: "t",
  title: "Title",
  description: "Description",
  background: "trackIntegration",
  rings: { cx: 400, cy: 215 },
  pieces: [{ piece: "pill", x: 100, y: 100, text: "request" }],
} as CoverSpec;

describe("Fonts embedded in an SVG tree", () => {
  test("Cover tree with labels", async () => {
    const embedFonts = await fresh();
    const tree = coverTree(COVER);
    const result = await embedFonts(tree);
    const tags = result.children.map((child) => (typeof child === "string" ? child : child.tag));
    expect(tags.slice(0, 3)).toEqual(["title", "desc", "style"]);
    expect(tags.filter((tag) => tag === "style")).toHaveLength(1);
    const rules = rulesOf(result);
    expect(rules.map(({ family, weight, style }) => ({ family, weight, style }))).toEqual([{ family: "Source Sans 3", weight: "550 799", style: "normal" }]);
    expect(sorted(rules[0].characters)).toBe(sorted("request"));
  });

  test("Tree without text", async () => {
    const embedFonts = await fresh();
    const { eipIcon, stateStart } = await import("../../src/pieces/library");
    for (const tree of [svg(...eipIcon({ name: "splitter", x: 0, y: 0 }).body), svg(...stateStart({ cx: 10, cy: 10 }).body)]) {
      const result = await embedFonts(tree);
      expect(result).toEqual(tree);
      expect(faces(result)).toEqual([]);
    }
  });

  test("Character the face lacks", async () => {
    const embedFonts = await fresh();
    const result = await embedFonts(svg(text("漢 ok")));
    const rules = rulesOf(result);
    expect(faces(result)).toEqual(["Source Sans 3 100 549"]);
    expect(sorted(rules[0].characters)).toBe(sorted(" ko"));
  });

  test("Same tree, same bytes", async () => {
    const embedFonts = await fresh();
    const tree = svg(text("Payment", { "font-weight": 700 }), text("`id`", { "font-family": MONO }));
    const before = JSON.stringify(tree);
    const first = toSvg(await embedFonts(tree));
    await embedFonts(svg(text("something else", { "font-weight": 900 })));
    const second = toSvg(await embedFonts(tree));
    expect(second).toBe(first);
    expect(JSON.stringify(tree)).toBe(before);
  });
});

describe("Drawn text", () => {
  test("Title inside a text", async () => {
    const embedFonts = await fresh();
    // A text inside a desc subtree is not drawn either, wherever that subtree sits.
    const rules = rulesOf(await embedFonts(svg(el("text", { "font-weight": 700 }, "a", el("title", {}, "tooltip"), "b"), g({}, el("desc", {}, el("text", { "font-weight": 700 }, "xyz"))))));
    expect(rules.map((rule) => `${rule.family} ${rule.weight}`)).toEqual(["Source Sans 3 550 799"]);
    expect(sorted(rules[0].characters)).toBe("ab");
  });

  test("Icon with only a title and a description", async () => {
    const embedFonts = await fresh();
    const spec = JSON.parse(readFileSync(new URL("../fixtures/covers/eip-splitter.json", import.meta.url), "utf8")) as CoverSpec;
    const tree = coverTree(spec);
    expect(tree.children.some((child) => typeof child !== "string" && child.tag === "title")).toBe(true);
    const result = await embedFonts(tree);
    expect(result).toEqual(tree);
    expect(faces(result)).toEqual([]);
  });
});

describe("Face of a text", () => {
  test("Label with a code run", async () => {
    const embedFonts = await fresh();
    const label = edgeLabel({ x: 0, y: 0, lines: ["adopts a `correlationId`"] });
    const rules = rulesOf(await embedFonts(svg(...label.text)));
    expect(rules.map((rule) => `${rule.family} ${rule.weight}`)).toEqual(["Source Code Pro 550 900", "Source Sans 3 550 799"]);
    expect(sorted(rules[0].characters)).toBe(sorted("correlationId"));
    expect(sorted(rules[1].characters)).toBe(sorted("adopts a "));
  });

  test("Family names compared exactly", async () => {
    const embedFonts = await fresh();
    const result = await embedFonts(
      el(
        "svg",
        {},
        text("a", { "font-family": '"Source Sans 3", serif', "font-weight": 400 }),
        text("b", { "font-family": " 'Source Code Pro' , monospace", "font-weight": 400 }),
        text("c", { "font-family": "source sans 3, sans-serif", "font-weight": 400 }),
        text("d", { "font-family": "'Source Serif 4', serif", "font-weight": 400 }),
      ),
    );
    expect(faces(result)).toEqual(["Source Code Pro 100 549", "Source Sans 3 100 549"]);
    expect(rulesOf(result).map((rule) => rule.characters)).toEqual(["b", "a"]);
  });

  test("First family outside Source", async () => {
    const embedFonts = await fresh();
    const tree = el("svg", {}, text("Georgia", { "font-family": "Georgia, serif" }));
    expect(await embedFonts(tree)).toEqual(tree);
  });

  test("Italic and oblique runs", async () => {
    const embedFonts = await fresh();
    const result = await embedFonts(
      svg(g({ "font-style": "oblique", "font-weight": 700 }, text("ab")), text("cd", { "font-style": "italic", "font-weight": 700 }), text("ef", { "font-weight": 700 })),
    );
    const rules = rulesOf(result);
    expect(rules.map(({ family, weight, style }) => `${family} ${weight} ${style}`)).toEqual(["Source Sans 3 550 799 normal"]);
    expect(sorted(rules[0].characters)).toBe("abcdef");
  });

  test("Text the face lacks", async () => {
    const embedFonts = await fresh();
    const tree = svg(text("漢字", { "font-weight": 700 }));
    const result = await embedFonts(tree);
    expect(result).toEqual(tree);
    expect(faces(result)).toEqual([]);
  });
});

describe("Face weights", () => {
  test("Weights snapped", async () => {
    const embedFonts = await fresh();
    const result = await embedFonts(
      svg(
        text("a", { "font-weight": 549 }),
        text("b", { "font-weight": 550 }),
        text("c", { "font-weight": 799 }),
        text("d", { "font-weight": 800 }),
        text("e", { "font-family": MONO, "font-weight": 549 }),
        text("f", { "font-family": MONO, "font-weight": 550 }),
        text("g", { "font-family": MONO, "font-weight": 900 }),
        text("h", { "font-weight": 549.5 }),
        text("i", { "font-weight": "799.5" }),
        text("j", { "font-family": MONO, "font-weight": 549.5 }),
      ),
    );
    expect(rulesOf(result).map((rule) => `${rule.family} ${rule.weight} ${sorted(rule.characters)}`)).toEqual([
      "Source Code Pro 100 549 ej",
      "Source Code Pro 550 900 fg",
      "Source Sans 3 100 549 ah",
      "Source Sans 3 550 799 bci",
      "Source Sans 3 800 900 d",
    ]);
  });

  test("Weight keywords", async () => {
    const embedFonts = await fresh();
    const result = await embedFonts(
      svg(
        text("a"),
        text("b", { "font-weight": "normal" }),
        text("c", { "font-weight": "bold" }),
        text("d", { "font-weight": "bolder" }),
        text("e", { "font-weight": "lighter" }),
        text("f", { "font-weight": "heavy" }),
      ),
    );
    expect(rulesOf(result).map((rule) => `${rule.family} ${rule.weight} ${sorted(rule.characters)}`)).toEqual(["Source Sans 3 100 549 abdef", "Source Sans 3 550 799 c"]);
  });
});

describe("Order of the faces", () => {
  test("Every sort key", async () => {
    const embedFonts = await fresh();
    const result = await embedFonts(
      svg(
        text("a", { "font-weight": 900 }),
        text("b", { "font-family": MONO, "font-weight": 700 }),
        text("c", { "font-style": "italic", "font-weight": 400 }),
        text("d", { "font-family": MONO, "font-weight": 400 }),
      ),
    );
    expect(rulesOf(result).map((rule) => `${rule.family} ${rule.weight} ${rule.style}`)).toEqual([
      "Source Code Pro 100 549 normal",
      "Source Code Pro 550 900 normal",
      "Source Sans 3 100 549 normal",
      "Source Sans 3 800 900 normal",
    ]);
  });
});

describe("Fonts loaded on first need", () => {
  const boldTree = () => svg(text("Bold", { "font-weight": 700 }));

  test("Only the faces used", async () => {
    io.failing.add("SourceCodePro-Regular.ttf");
    const embedFonts = await fresh();
    expect(faces(await embedFonts(boldTree()))).toEqual(["Source Sans 3 550 799"]);
    expect(faces(await embedFonts(boldTree()))).toEqual(["Source Sans 3 550 799"]);
    expect(fontReads()).toEqual([`${FONTS}${BOLD}`]);
  });

  test("No shipped face, nothing loaded", async () => {
    const instantiate = vi.spyOn(WebAssembly, "instantiate").mockRejectedValue(new Error("no wasm (test)"));
    const embedFonts = await fresh();
    const textFree = el("svg", {}, el("rect", { width: 10, height: 10 }));
    const serif = el("svg", {}, text("Title", { "font-family": tokens.font.serif }));
    expect(await embedFonts(textFree)).toEqual(textFree);
    expect(await embedFonts(serif)).toEqual(serif);
    expect(fontReads()).toEqual([]);
    expect(instantiate).not.toHaveBeenCalled();
  });

  test("Failure not cached", async () => {
    io.failing.add(BOLD);
    const embedFonts = await fresh();
    await expect(embedFonts(boldTree())).rejects.toThrow(`${FONTS}${BOLD}`);
    io.failing.clear();
    expect(faces(await embedFonts(boldTree()))).toEqual(["Source Sans 3 550 799"]);
    expect(fontReads()).toEqual([`${FONTS}${BOLD}`, `${FONTS}${BOLD}`]);
  });

  test("Subsetter not resolvable, not cached", async () => {
    io.unresolvable = 1;
    const embedFonts = await fresh();
    await expect(embedFonts(svg(text("words")))).rejects.toThrow(/harfbuzzjs/);
    expect(faces(await embedFonts(svg(text("words"))))).toEqual(["Source Sans 3 100 549"]);
    expect(io.resolves).toEqual(["harfbuzzjs/dist/harfbuzz-subset.wasm", "harfbuzzjs/dist/harfbuzz-subset.wasm"]);
  });
});

describe("Font embedding failure", () => {
  test("Unreadable font file", async () => {
    io.failing.add(BOLD);
    const embedFonts = await fresh();
    const failure = embedFonts(svg(text("Bold", { "font-weight": 700 })));
    await expect(failure).rejects.toBeInstanceOf(Error);
    await expect(failure).rejects.toThrow(`${FONTS}${BOLD}`);
  });

  test("WebAssembly fails to load", async () => {
    vi.spyOn(WebAssembly, "instantiate").mockRejectedValueOnce(new Error("no wasm (test)"));
    const embedFonts = await fresh();
    const failure = embedFonts(svg(text("words")));
    await expect(failure).rejects.toBeInstanceOf(Error);
    await expect(failure).rejects.toThrow(/harfbuzzjs/);
    // Not cached either: the next call loads the module.
    expect(faces(await embedFonts(svg(text("words"))))).toEqual(["Source Sans 3 100 549"]);
  });
});

describe("Fonts entry point", () => {
  test("Nothing loads at import", async () => {
    const instantiate = vi.spyOn(WebAssembly, "instantiate");
    const embedFonts = await fresh();
    expect(fontReads()).toEqual([]);
    expect(instantiate).not.toHaveBeenCalled();
    await embedFonts(svg(text("one text")));
    expect(fontReads()).toEqual([`${FONTS}SourceSans3-Regular.ttf`]);
    expect(instantiate).toHaveBeenCalledTimes(1);
  });
});

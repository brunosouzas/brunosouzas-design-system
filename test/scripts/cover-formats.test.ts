// Integration tests of the cover command's diagram and icon formats, text tables,
// --lang and customAt (spec cover-cli; change designer-formats, tasks 3.1-3.4).
// Each test title is the spec scenario it proves.
import { chmodSync, cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { buildCover, COVER_USAGE, runCover } from "../../scripts/cover";
import { coverTree, validateCoverSpec, type CoverSpec } from "../../src/pieces/cover";
import { EIP_ICONS } from "../../src/pieces/eip-icons";

const FIXTURES = new URL("../fixtures/covers/", import.meta.url).pathname;
const STATES = join(FIXTURES, "circuit-breaker-states.json");

const folders: string[] = [];
afterEach(() => {
  for (const folder of folders.splice(0)) {
    chmodSync(folder, 0o755);
    rmSync(folder, { recursive: true, force: true });
  }
});

const workspace = () => {
  const root = mkdtempSync(join(tmpdir(), "cover-formats-"));
  folders.push(root);
  const out: string[] = [];
  const err: string[] = [];
  const run = (...args: string[]) => {
    out.length = 0;
    err.length = 0;
    return runCover(args, { cwd: root, log: (l) => out.push(l), error: (l) => err.push(l) });
  };
  const write = (name: string, spec: unknown) => writeFileSync(join(root, name), typeof spec === "string" ? spec : JSON.stringify(spec));
  return { root, out, err, run, write };
};

const cover = (extra: Record<string, unknown> = {}) => ({ id: "t", title: "Title", description: "Description", background: "peach", rings: { cx: 400, cy: 215 }, pieces: [] as unknown[], ...extra });
const diagram = (extra: Record<string, unknown> = {}) => ({ id: "d", title: "Title", description: "Description", format: "diagram", height: 322, rings: { cx: 280, cy: 161 }, pieces: [] as unknown[], ...extra });
const icon = (piece: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({ id: "i", format: "icon", pieces: [piece], ...extra });
const tables = (en: Record<string, unknown>, pt: Record<string, unknown> = en) => ({ en, pt });

const problems = (spec: unknown, lang?: string): string[] => {
  const result = buildCover(JSON.stringify(spec), "spec.json", lang);
  return result.ok ? [] : result.lines;
};
const svgOf = (spec: unknown, lang?: string): string => {
  const result = buildCover(JSON.stringify(spec), "s", lang);
  expect(result.ok ? [] : result.lines).toEqual([]);
  return result.ok ? result.svg : "";
};
const rootOf = (svg: string) => /^<svg [^>]*>/.exec(svg)![0];
const ringRadii = (svg: string, stroke = "#E0E7FB", width = "1.4"): number[] => {
  const group = new RegExp(`<g fill="none" stroke="${stroke}" stroke-width="${width}">([\\s\\S]*?)</g>`).exec(svg)![1];
  return [...group.matchAll(/ r="([\d.]+)"/g)].map((m) => Number(m[1]));
};
/** The children of the first group whose opening tag matches. */
const groupOf = (svg: string, opening: string): string => {
  const start = svg.indexOf(opening);
  expect(start, opening).toBeGreaterThan(-1);
  const indent = svg.lastIndexOf("\n", start);
  const pad = svg.slice(indent + 1, start);
  const end = svg.indexOf(`\n${pad}</g>`, start);
  return svg.slice(start, end);
};

describe("Invocation problems", () => {
  test("Language option problems", () => {
    const ws = workspace();
    cpSync(STATES, join(ws.root, "spec.json"));
    expect(ws.run("spec.json", "--out", "d.svg", "--lang")).toBe(1);
    expect(ws.err).toEqual(["--lang needs a value: <code>", COVER_USAGE]);
    expect(ws.run("spec.json", "--out", "d.svg", "--lang", "pt", "--lang", "en")).toBe(1);
    expect(ws.err).toEqual(["--lang given more than once", COVER_USAGE]);
    expect(ws.run("spec.json", "--out", "d.svg", "--lang", "PT")).toBe(1);
    expect(ws.err).toEqual(["--lang expects a language code such as pt or en, found PT", COVER_USAGE]);
    expect(COVER_USAGE).toBe("usage: npm run cover -- <spec.json> --out <file.svg> [--lang <code>]");
    expect(readdirSync(ws.root)).toEqual(["spec.json"]);
  });
});

describe("Every spec problem at once", () => {
  test("Colour literal in a refused key", () => {
    expect(problems(diagram({ background: "#fff" }))).toEqual(["background: colour literals are not allowed; use a token path"]);
  });

  test("Table problems stop the check", () => {
    const spec = diagram({ title: "", text: { en: { open: 5 }, pt: { open: "x" } } });
    expect(problems(spec, "en")).toEqual(["text.en.open: expected a non-empty string or a non-empty array of non-empty strings"]);
    expect(problems({ ...spec, text: tables({ open: "x" }) }, "en")).toEqual(["title: expected a non-empty string"]);
  });
});

describe("No current colour in a spec", () => {
  test("Current colour in an icon spec", () => {
    const ws = workspace();
    ws.write("spec.json", icon({ piece: "uiIcon", name: "sun", colour: "currentColor" }, { title: "Sun", description: "Light theme" }));
    expect(ws.run("spec.json", "--out", "i.svg")).toBe(1);
    expect(ws.err[0]).toBe("pieces[0].colour: currentColor is for icons inline in a page; a cover uses a token path");
    expect(readdirSync(ws.root)).toEqual(["spec.json"]);
  });
});

describe("Diagram output", () => {
  test("Diagram frame", () => {
    const svg = svgOf(diagram({ pieces: [{ piece: "diagramBox", x: 70, y: 56, width: 130, text: ["CLOSED"], fill: "color.healthy" }] }));
    expect(rootOf(svg)).toContain('width="800" height="460" viewBox="0 0 560 322"');
    expect(svg).toContain('<rect width="560" height="322" rx="9.8"/>');
    expect(svg).toContain('<rect width="560" height="322" rx="9.8" fill="#EEF2FF"/>');
    const clipped = groupOf(svg, '<g clip-path="url(#d-frame)">\n    <g stroke=');
    expect(clipped).toContain('<rect x="70" y="56" width="130"');
  });

  test("Smallest diagram", () => {
    const ws = workspace();
    ws.write("spec.json", diagram({ height: 1 }));
    expect(ws.run("spec.json", "--out", "d.svg")).toBe(0);
    expect(rootOf(readFileSync(join(ws.root, "d.svg"), "utf8"))).toContain('width="800" height="1.43" viewBox="0 0 560 1"');
  });
});

describe("Diagram keys", () => {
  test("Height out of range", () => {
    const { height: _, ...without } = diagram();
    for (const spec of [without, diagram({ height: 0 }), diagram({ height: 10001 }), diagram({ height: "322" })]) {
      expect(problems(spec)).toEqual(["height: expected a number from 1 to 10000"]);
    }
    const ws = workspace();
    ws.write("spec.json", diagram({ height: 0 }));
    expect(ws.run("spec.json", "--out", "d.svg")).toBe(1);
    expect(readdirSync(ws.root)).toEqual(["spec.json"]);
  });

  test("Background in a diagram", () => {
    expect(problems(diagram({ background: "navy" }))).toEqual(["background: a diagram is drawn on color.panel; background is for covers and banners"]);
  });

  test("Height on a cover", () => {
    expect(problems(cover({ height: 420 }))).toEqual(["height: only a diagram takes a height"]);
  });
});

describe("Diagram outline and labels", () => {
  test("Pill in a diagram", () => {
    const svg = svgOf(diagram({ pieces: [{ piece: "pill", x: 100, y: 100, text: "OPEN" }] }));
    const outlined = groupOf(svg, '<g stroke="#0A1033" stroke-width="3" stroke-linejoin="round">');
    expect(outlined).toContain("<rect ");
    const labels = groupOf(svg, '<g font-size="13" font-weight="800" fill="#0A1033" text-anchor="middle">');
    expect(labels).toContain(">OPEN</text>");
  });

  test("Piece with its own stroke", () => {
    const params = { piece: "diagramBox", x: 70, y: 56, width: 130, text: ["CLOSED"], fill: "color.healthy" };
    const own = svgOf(diagram({ pieces: [params] }));
    expect(own).toContain('stroke="#0A1033" stroke-width="3" stroke-linejoin="round"/>');
    // The same piece in a cover's outlined group (width 4) keeps its own width 3.
    expect(svgOf(cover({ pieces: [params] }))).toContain('fill="#3DDC84" stroke="#0A1033" stroke-width="3" stroke-linejoin="round"/>');
  });
});

describe("Diagram rings at the shown scale", () => {
  test("Published rings", () => {
    const radii = ringRadii(svgOf(diagram()));
    expect(radii).toHaveLength(15);
    expect(radii).toEqual(Array.from({ length: 15 }, (_, i) => Math.round((49 + 19.6 * i) * 100) / 100));
    expect([radii[0], radii[14]]).toEqual([49, 323.4]);
    // At 800 / 560 they show at step 28 and width 2.
    expect(Math.round((radii[1] - radii[0]) * (800 / 560) * 100) / 100).toBe(28);
    expect(Math.round(1.4 * (800 / 560) * 100) / 100).toBe(2);
  });

  test("First ring beyond every corner", () => {
    expect(ringRadii(svgOf(diagram({ rings: { cx: 280, cy: 161, radius: 400 } })))).toEqual([400]);
  });

  test("Centre far outside the diagram", () => {
    const radii = ringRadii(svgOf(diagram({ height: 10000, rings: { cx: -10000, cy: -10000 } })));
    expect(radii).toHaveLength(1153);
    expect([radii[0], radii[1152]]).toEqual([49, 22628.2]);
  });

  test("Most rings", () => {
    const radii = ringRadii(svgOf(diagram({ height: 10000, rings: { cx: -10000, cy: -10000, radius: 0.01 } })));
    expect(radii).toHaveLength(1155);
    expect([radii[0], radii[1154]]).toEqual([0.01, 22618.41]);
  });
});

describe("Icon output", () => {
  test("EIP icon", () => {
    const svg = svgOf(JSON.parse(readFileSync(join(FIXTURES, "eip-splitter.json"), "utf8")));
    const splitter = EIP_ICONS.find((i) => i.name === "splitter")!;
    expect(rootOf(svg)).toContain('width="64" height="40" viewBox="0 0 64 40"');
    expect(svg).toContain('<title id="eip-splitter-title">Splitter</title>');
    expect(svg).toContain(`<desc id="eip-splitter-desc">${splitter.description}</desc>`);
    expect(splitter.description).toContain("CC BY 4.0");
    expect(svg).toContain('<g transform="translate(0 0) scale(1)" stroke="none">');
  });

  test("UI icon box", () => {
    const svg = svgOf(icon({ piece: "uiIcon", name: "sun", size: 48, colour: "color.blocked" }, { title: "Sun", description: "Light theme" }));
    expect(rootOf(svg)).toContain('width="48" height="48" viewBox="0 0 48 48"');
  });

  test("Not one icon piece", () => {
    const message = "pieces: an icon spec holds exactly one piece: eipIcon, uiIcon or linkIcon";
    expect(problems({ id: "i", title: "T", description: "D", format: "icon", pieces: [{ piece: "eipIcon", name: "splitter" }, { piece: "eipIcon", name: "aggregator" }] })).toEqual([message]);
    expect(problems(icon({ piece: "pill", x: 0, y: 0, text: "a" }, { title: "T", description: "D" }))).toEqual([message]);
  });

  test("Icon off the origin", () => {
    expect(problems(icon({ piece: "eipIcon", name: "splitter", x: 4 }))).toEqual(["pieces[0].x: an icon is drawn at 0, 0"]);
  });
});

describe("Icon keys", () => {
  test("Rings in an icon", () => {
    const ws = workspace();
    ws.write("spec.json", icon({ piece: "eipIcon", name: "splitter" }, { rings: { cx: 0, cy: 0 } }));
    expect(ws.run("spec.json", "--out", "i.svg")).toBe(1);
    expect(ws.err[0]).toBe("rings: not used by the icon format");
    expect(readdirSync(ws.root)).toEqual(["spec.json"]);
    for (const key of ["background", "custom", "customAt", "height"]) {
      const value = key === "custom" ? { tag: "rect" } : key === "background" ? "navy" : 1;
      expect(problems(icon({ piece: "eipIcon", name: "splitter" }, { [key]: value }))).toEqual([`${key}: not used by the icon format`]);
    }
  });

  test("Title on an EIP icon", () => {
    expect(problems(icon({ piece: "eipIcon", name: "splitter" }, { title: "Splitter" }))).toEqual(["title: comes from the EIP icon, with its CC BY 4.0 credit"]);
  });

  test("UI icon without a title", () => {
    expect(problems(icon({ piece: "uiIcon", name: "sun" }, { description: "Light theme" }))).toEqual(["title: expected a non-empty string"]);
  });
});

describe("Text tables", () => {
  test("Missing translation", () => {
    const spec = diagram({ text: { en: { open: "a", close: "b" }, pt: { close: "c" } } });
    for (const lang of ["en", "pt", undefined]) expect(problems(spec, lang)).toEqual(["text.pt.open: missing: another language defines it"]);
  });

  test("Bad table", () => {
    expect(problems(diagram({ text: { en: { a: "x" }, PT: { a: "y" } } }), "en")).toEqual(["text.PT: expected a language code such as pt or en"]);
    expect(problems(diagram({ text: tables({ open: 5 }) }), "en")).toEqual([
      "text.en.open: expected a non-empty string or a non-empty array of non-empty strings",
      "text.pt.open: expected a non-empty string or a non-empty array of non-empty strings",
    ]);
    expect(problems(diagram({ text: tables({ close: [] }) }), "en")[0]).toBe("text.en.close: expected a non-empty string or a non-empty array of non-empty strings");
    const ws = workspace();
    ws.write("spec.json", diagram({ text: tables({ close: [] }) }));
    expect(ws.run("spec.json", "--out", "d.svg", "--lang", "en")).toBe(1);
    expect(readdirSync(ws.root)).toEqual(["spec.json"]);
  });
});

describe("Text references", () => {
  test("One spec, two languages", () => {
    const ws = workspace();
    cpSync(STATES, join(ws.root, "spec.json"));
    for (const [lang, title, line] of [["pt", "Estados do circuit breaker", "taxa de falha na janela"], ["en", "Circuit breaker states", "failure rate in the window"]]) {
      expect(ws.run("spec.json", "--lang", lang, "--out", `${lang}.svg`)).toBe(0);
      const svg = readFileSync(join(ws.root, `${lang}.svg`), "utf8");
      expect(svg).toBe(readFileSync(join(FIXTURES, `circuit-breaker-states-${lang}.svg`), "utf8"));
      expect(svg).toContain(`>${title}</title>`);
      expect(svg).toContain(`>${line}</text>`);
    }
  });

  test("Unknown key", () => {
    const spec = diagram({
      title: "",
      text: tables({ open: ["a"] }),
      pieces: [
        { piece: "stateStart", cx: 10, cy: 10 },
        { piece: "stateStart", cx: 20, cy: 10 },
        { piece: "stateStart", cx: 30, cy: 10 },
        { piece: "edgeLabel", x: 0, y: 0, lines: "@opne" },
      ],
    });
    expect(problems(spec, "en")).toEqual(["pieces[3].lines: unknown text key opne", "title: expected a non-empty string"]);
  });

  test("Value of the wrong type", () => {
    const spec = cover({ text: tables({ open: ["a", "b"] }), pieces: [{ piece: "pill", x: 100, y: 100, text: "@open" }] });
    const lines = problems(spec, "en");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^pieces\[0\]\.text: /);
    // The same message the pill gives for a non-string label written in place.
    expect(lines).toEqual(problems(cover({ pieces: [{ piece: "pill", x: 100, y: 100, text: ["a", "b"] }] })));
  });

  test("At sign without tables", () => {
    expect(svgOf(cover({ pieces: [{ piece: "pill", x: 100, y: 100, text: "@home" }] }))).toContain(">@home</text>");
  });
});

describe("Language choice", () => {
  test("No language chosen", () => {
    const ws = workspace();
    cpSync(STATES, join(ws.root, "spec.json"));
    expect(ws.run("spec.json", "--out", "d.svg")).toBe(1);
    expect(ws.err).toEqual(["text: choose a language with --lang (en, pt)", "cover: 1 problem(s) in spec.json; no file written"]);
    expect(readdirSync(ws.root)).toEqual(["spec.json"]);
  });

  test("Unknown language", () => {
    const ws = workspace();
    cpSync(STATES, join(ws.root, "spec.json"));
    expect(ws.run("spec.json", "--out", "d.svg", "--lang", "fr")).toBe(1);
    expect(ws.err[0]).toBe("text: no table for fr (en, pt)");
    expect(readdirSync(ws.root)).toEqual(["spec.json"]);
  });

  test("Language without tables", () => {
    const ws = workspace();
    cpSync(join(FIXTURES, "spec-driven-development.json"), join(ws.root, "spec.json"));
    expect(ws.run("spec.json", "--out", "c.svg", "--lang", "en")).toBe(1);
    expect(ws.err[0]).toBe("text: --lang needs text tables");
    expect(readdirSync(ws.root)).toEqual(["spec.json"]);
  });

  test("Ids per language", () => {
    const svg = svgOf(JSON.parse(readFileSync(STATES, "utf8")), "pt");
    expect(rootOf(svg)).toContain('aria-labelledby="circuit-breaker-states-pt-title circuit-breaker-states-pt-desc"');
    expect(svg).toContain('<clipPath id="circuit-breaker-states-pt-frame">');
  });
});

describe("Free-form object's place", () => {
  const custom = { tag: "rect", attrs: { x: 0, y: 0, width: 10, height: 10, fill: "color.blocked" } };
  const pills = [
    { piece: "pill", x: 100, y: 100, text: "A", fill: "color.white" },
    { piece: "pill", x: 300, y: 100, text: "B", fill: "color.healthy" },
  ];

  test("Custom under a pill", () => {
    const svg = svgOf(cover({ pieces: pills, custom, customAt: 1 }));
    const outlined = groupOf(svg, '<g stroke="#0A1033" stroke-width="4" stroke-linejoin="round">');
    const a = outlined.indexOf('fill="#FFFFFF"');
    const c = outlined.indexOf('<rect x="0" y="0" width="10" height="10" fill="#FF8A3D"/>');
    const b = outlined.indexOf('fill="#3DDC84"');
    expect(a).toBeGreaterThan(-1);
    expect(a < c && c < b).toBe(true);
    expect(svg.indexOf(">A</text>")).toBeGreaterThan(svg.indexOf("</g>", b));
    expect(svg.indexOf(">B</text>")).toBeGreaterThan(svg.indexOf("</g>", b));
  });

  test("Default place", () => {
    const without = svgOf(cover({ pieces: pills, custom }));
    expect(svgOf(cover({ pieces: pills, custom, customAt: 2 }))).toBe(without);
    expect(without.indexOf('width="10" height="10"')).toBeGreaterThan(without.indexOf('fill="#3DDC84"'));
  });

  test("Bad customAt", () => {
    expect(problems(cover({ customAt: 0 }))).toEqual(["customAt: needs custom"]);
    expect(problems(cover({ pieces: pills, customAt: 9 }))).toEqual(["customAt: needs custom"]);
    const eight = Array.from({ length: 8 }, (_, i) => ({ piece: "pill", x: 50 * i, y: 100, text: "a" }));
    expect(problems(cover({ pieces: eight, custom, customAt: 9 }))).toEqual(["customAt: expected an integer from 0 to 8"]);
    expect(problems(cover({ pieces: eight, custom, customAt: 1.5 }))).toEqual(["customAt: expected an integer from 0 to 8"]);
  });
});

// Code review round 1 (AB#173): references in the id, references inside a wrong container, typed specs per format.
describe("Code review round 1", () => {
  test("A reference in the id gets the language on its resolved value", () => {
    const svg = svgOf(diagram({ id: "@slug", text: tables({ slug: "states" }) }), "en");
    expect(rootOf(svg)).toContain('aria-labelledby="states-en-title states-en-desc"');
  });

  test("Unknown references inside a wrong container are not reported", () => {
    expect(problems(diagram({ pieces: { label: "@missing" }, text: tables({ a: "x" }) }), "en")).toEqual(["pieces: missing or not an array"]);
    expect(problems(diagram({ pieces: [{ piece: "rocket", text: "@missing" }], text: tables({ a: "x" }) }), "en")).toEqual([
      expect.stringMatching(/^pieces\[0\]\.piece: unknown piece "rocket"/),
    ]);
  });

  test("Diagram and icon specs type-check without casts", () => {
    const states: CoverSpec = { id: "d", title: "T", description: "D", format: "diagram", height: 100, rings: { cx: 0, cy: 0 }, pieces: [] };
    const splitter: CoverSpec = { id: "i", format: "icon", pieces: [{ piece: "eipIcon", name: "splitter" }] };
    expect(validateCoverSpec(states)).toEqual([]);
    expect(validateCoverSpec(splitter)).toEqual([]);
    expect(coverTree(splitter).attrs.width).toBe(64);
  });
});

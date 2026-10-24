// Integration tests of `npm run cover` (spec cover-cli; tasks 4.1 and 4.2),
// run in temporary folders. Each test title is the spec scenario it proves.
import { chmodSync, cpSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { buildCover, COVER_USAGE, runCover } from "../../scripts/cover";
import { comparePaths } from "../../src/pieces/cover";
import { tokens } from "../../tokens/generated/tokens";

const FIXTURES = new URL("../fixtures/covers/", import.meta.url).pathname;
const PROOF_COVERS = ["spec-driven-development", "ai-writes-code", "integration-patterns"];

const folders: string[] = [];
afterEach(() => {
  for (const folder of folders.splice(0)) {
    chmodSync(folder, 0o755);
    rmSync(folder, { recursive: true, force: true });
  }
});

const workspace = () => {
  const root = mkdtempSync(join(tmpdir(), "cover-"));
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

const minimal = () => ({
  id: "t",
  title: "Title",
  description: "Description",
  background: "peach",
  rings: { cx: 400, cy: 215 },
  pieces: [] as unknown[],
});

/** Problem lines of a spec (empty when valid). */
const problems = (spec: unknown): string[] => {
  const result = buildCover(JSON.stringify(spec), "spec.json");
  return result.ok ? [] : result.lines;
};

describe("Cover command", () => {
  test("Proof cover", () => {
    const ws = workspace();
    mkdirSync(join(ws.root, "out/covers"), { recursive: true });
    cpSync(join(FIXTURES, "spec-driven-development.json"), join(ws.root, "spec.json"));
    expect(ws.run("spec.json", "--out", "out/covers/sdd.svg")).toBe(0);
    expect(ws.out).toEqual(["wrote out/covers/sdd.svg"]);
    expect(readFileSync(join(ws.root, "out/covers/sdd.svg"), "utf8")).toBe(readFileSync(join(FIXTURES, "spec-driven-development.svg"), "utf8"));
  });

  test("Running twice", () => {
    const ws = workspace();
    cpSync(join(FIXTURES, "ai-writes-code.json"), join(ws.root, "spec.json"));
    ws.run("spec.json", "--out", "a.svg");
    const first = readFileSync(join(ws.root, "a.svg"));
    expect(ws.run("spec.json", "--out", "a.svg")).toBe(0);
    expect(readFileSync(join(ws.root, "a.svg")).equals(first)).toBe(true);
    expect(readdirSync(ws.root).sort()).toEqual(["a.svg", "spec.json"]);
  });
});

describe("Invocation problems", () => {
  test("Missing out", () => {
    const ws = workspace();
    expect(ws.run("cover.json")).toBe(1);
    expect(ws.err).toEqual(["--out <file.svg> is required", COVER_USAGE]);
    expect(readdirSync(ws.root)).toEqual([]);
  });

  test("Wrong extension and two specs", () => {
    const ws = workspace();
    expect(ws.run("a.json", "b.json", "--out", "cover.png")).toBe(1);
    expect(ws.err).toEqual(["the output must be an .svg file, found cover.png", COVER_USAGE]);
  });

  test("Missing folder", () => {
    const ws = workspace();
    expect(ws.run("a.json", "--out", "missing/cover.svg")).toBe(1);
    expect(ws.err[0]).toBe("the output folder does not exist: missing");
  });

  test("Out names a folder", () => {
    const ws = workspace();
    mkdirSync(join(ws.root, "covers.svg"));
    expect(ws.run("a.json", "--out", "covers.svg")).toBe(1);
    expect(ws.err[0]).toBe("the output is a folder: covers.svg");
  });

  test("Invalid JSON", () => {
    const ws = workspace();
    ws.write("spec.json", '{\n  "id": "t",\n}\n');
    expect(ws.run("spec.json", "--out", "c.svg")).toBe(1);
    expect(ws.err[0]).toMatch(/^spec\.json: invalid JSON at line 3, column 1/);
    expect(readdirSync(ws.root)).toEqual(["spec.json"]);
  });
});

describe("Safe write", () => {
  test.skipIf(process.getuid?.() === 0)("Write fails", () => {
    const ws = workspace();
    cpSync(join(FIXTURES, "ai-writes-code.json"), join(ws.root, "spec.json"));
    writeFileSync(join(ws.root, "cover.svg"), "old");
    chmodSync(ws.root, 0o555);
    expect(ws.run("spec.json", "--out", "cover.svg")).toBe(1);
    expect(ws.err[0]).toMatch(/^cannot write cover\.svg: /);
    chmodSync(ws.root, 0o755);
    expect(readFileSync(join(ws.root, "cover.svg"), "utf8")).toBe("old");
    expect(readdirSync(ws.root).sort()).toEqual(["cover.svg", "spec.json"]);
  });
});

describe("Safe write through a link", () => {
  test("Output that is a symlink", () => {
    const ws = workspace();
    cpSync(join(FIXTURES, "ai-writes-code.json"), join(ws.root, "spec.json"));
    writeFileSync(join(ws.root, "outside.txt"), "keep");
    symlinkSync(join(ws.root, "outside.txt"), join(ws.root, "cover.svg"));
    expect(ws.run("spec.json", "--out", "cover.svg")).toBe(0);
    expect(readFileSync(join(ws.root, "outside.txt"), "utf8")).toBe("keep");
    expect(lstatSync(join(ws.root, "cover.svg")).isSymbolicLink()).toBe(false);
    expect(readdirSync(ws.root).sort()).toEqual(["cover.svg", "outside.txt", "spec.json"]);
  });
});

describe("Every spec problem at once", () => {
  test("Limits between parameters are listed with their paths", () => {
    const lines = problems({
      ...minimal(),
      pieces: [
        { piece: "lineBadge", x: 0, y: 0, text: "SH", fill: "color.healthy", height: 96 },
        { piece: "nodeBlock", x: 0, y: 0, width: 80, title: "a" },
        { piece: "messageArrow", from: [0, 0], to: [20, 0] },
      ],
    });
    expect(lines.map((line) => line.split(":")[0])).toEqual(["pieces[0].width", "pieces[1].width", "pieces[2].to"]);
    // A schema problem and a limit on another parameter of the same piece are both reported.
    const mixed = problems({ ...minimal(), pieces: [{ piece: "nodeBlock", x: 0, y: 0, width: 80, title: "" }] });
    expect(mixed.map((line) => line.split(":")[0])).toEqual(["pieces[0].title", "pieces[0].width"]);
  });
});

describe("Line colours from data", () => {
  test("Data colour in a cover spec", () => {
    const lines = problems({ ...minimal(), pieces: [{ piece: "pipe", d: "M0,0 L100,0", fill: "#7B3FE4" }] });
    expect(lines).toEqual([expect.stringMatching(/^pieces\[0\]\.fill: colour literals are not allowed/)]);
  });
});

describe("Code panel indent bound", () => {
  test("An indent beyond the size bound is rejected in code and in a cover spec", async () => {
    const { codePanel } = await import("../../src/pieces/library");
    const { validateCoverSpec } = await import("../../src/pieces/cover");
    const line = { indent: 1e308, w: 40, color: "healthy" as const };
    expect(() => codePanel({ x: 0, y: 0, width: 100, height: 100, lines: [line] })).toThrow(RangeError);
    const spec = JSON.parse(readFileSync(new URL("../fixtures/covers/spec-driven-development.json", import.meta.url), "utf8"));
    spec.pieces = [{ piece: "codePanel", x: 0, y: 0, width: 100, height: 100, lines: [line] }];
    expect(validateCoverSpec(spec).map((problem) => problem.path)).toEqual(["pieces[0].lines[0].indent"]);
  });
});

describe("Cover spec format", () => {
  test("Unknown background and piece", () => {
    const lines = problems({ ...minimal(), background: "pink", pieces: [{ piece: "rocket" }] });
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(/^background: expected one of blush, cobalt, .*, wine, found "pink"$/);
    expect(lines[1]).toMatch(/^pieces\[0\]\.piece: unknown piece "rocket" \(expected one of pill, rings, sheet, .*, eipIcon, lineBadge, .*, ledgerMark, renewalRing, suggestedHalo, licenceMark, zone, uiIcon, linkIcon, diagramBox, decisionNode, storeNode, queueNode, exchangeNode, taggedContainer, lifeline, phaseBand, altFrame, edgeLabel, stateStart, mascot, emote\)$/);
    expect(lines[1].split("expected one of ")[1].replace(/\)$/, "").split(", ")).toHaveLength(54);
  });

  test("Unsafe id", () => {
    expect(problems({ ...minimal(), id: "../sdd" })).toEqual([expect.stringMatching(/^id: expected a safe slug/)]);
    expect(problems({ ...minimal(), id: "SDD" })).toEqual([expect.stringMatching(/^id: expected a safe slug/)]);
  });
});

describe("Piece parameters checked", () => {
  test("Several problems in one piece", () => {
    const spec = { ...minimal(), pieces: [{ piece: "pill", x: 1, y: 1, text: "a" }, { piece: "pill", x: 1, y: 1, text: "b" }, { piece: "sheet", x: 0, y: 0, height: 10, colour: "color.white", width: -5 }] };
    expect(problems(spec)).toEqual([
      "pieces[2].colour: unknown parameter (expected x, y, width, height, rows, top, step, fill, leadFill, tick)",
      "pieces[2].rows: missing required parameter",
      "pieces[2].width: expected a number at least 80, found -5",
    ]);
  });

  test("Colour literal anywhere", () => {
    for (const literal of ["#FFFFFF", "#fff", "rgb(0,0,0)", "hsl(0,0%,0%)"]) {
      expect(problems({ ...minimal(), title: literal })).toEqual(["title: colour literals are not allowed; use a token path"]);
    }
  });
});

describe("Every spec problem at once", () => {
  test("Problems sorted", () => {
    const pieces: unknown[] = Array.from({ length: 11 }, () => ({ piece: "checkBadge", cx: 1, cy: 1 }));
    pieces[2] = { piece: "checkBadge", cx: 1 };
    pieces[10] = { piece: "checkBadge", cy: 1 };
    const lines = problems({ ...minimal(), title: "", pieces });
    expect(lines.map((line) => line.split(":")[0])).toEqual(["pieces[2].cy", "pieces[10].cx", "title"]);
  });

  test("One problem per path", () => {
    expect(problems({ ...minimal(), pieces: [{ piece: "pill", x: 1, y: 1, text: "a", fill: "#fff" }] })).toEqual([
      "pieces[0].fill: colour literals are not allowed; use a token path",
    ]);
  });

  test("Wrong container", () => {
    expect(problems({ ...minimal(), pieces: { a: { piece: "pill" } } })).toEqual(["pieces: missing or not an array"]);
    expect(problems({ ...minimal(), pieces: { fill: "#fff" } })).toEqual(["pieces: missing or not an array"]);
    expect(problems({ ...minimal(), pieces: [{ piece: "rocket", fill: "#fff" }] })).toEqual([expect.stringMatching(/^pieces\[0\]\.piece: unknown piece "rocket"/)]);
    expect(problems({ ...minimal(), custom: [{ tag: "g", attrs: { fill: "#fff" } }] })).toEqual(["custom: one free-form object per cover; a repeated object must be a piece"]);
  });

  test("Paths in code-point order", () => {
    expect(comparePaths("\u{10000}", "\uE000")).toBeGreaterThan(0);
    expect(comparePaths("pieces[2]", "pieces[10]")).toBeLessThan(0);
  });
});

describe("One free-form object", () => {
  test("Array of objects", () => {
    expect(problems({ ...minimal(), custom: [{ tag: "g" }, { tag: "g" }] })).toEqual([
      "custom: one free-form object per cover; a repeated object must be a piece",
    ]);
  });

  test("Allowed object", () => {
    const custom = { tag: "g", children: [{ tag: "path", attrs: { d: "M0,0 L10,10", fill: "color.blocked" } }, { tag: "text", attrs: { x: 5, y: 5 }, children: ["v1"] }] };
    const result = buildCover(JSON.stringify({ ...minimal(), pieces: [{ piece: "checkBadge", cx: 1, cy: 1 }], custom }), "spec.json");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.svg).toContain(`<path d="M0,0 L10,10" fill="${tokens.color.blocked}"/>`);
    expect(result.svg).toContain('<text x="5" y="5" stroke="none">v1</text>');
    expect(result.svg.indexOf("<g>")).toBeGreaterThan(result.svg.indexOf(`r="16" fill="${tokens.color.healthy}"`));
  });
});

describe("Free-form content", () => {
  test("Forbidden content", () => {
    const custom = { tag: "g", attrs: { onload: "x", href: "#a", style: "x" }, children: [{ tag: "script" }, { tag: "image" }] };
    expect(problems({ ...minimal(), custom }).map((line) => line.split(":")[0])).toEqual([
      "custom.attrs.href",
      "custom.attrs.onload",
      "custom.attrs.style",
      "custom.children[0].tag",
      "custom.children[1].tag",
    ]);
  });

  test("External reference", () => {
    const custom = { tag: "g", attrs: { fill: "url(#g)" }, children: [{ tag: "rect", attrs: { filter: "url(https://example.com/f.svg#f)" } }] };
    expect(problems({ ...minimal(), custom })).toEqual([
      "custom.attrs.fill: references are not allowed (url( or //)",
      "custom.children[0].attrs.filter: attribute not allowed in a free-form object",
    ]);
    expect(problems({ ...minimal(), custom: { tag: "rect", attrs: { d: "url(https://x)" } } })).toEqual(["custom.attrs.d: references are not allowed (url( or //)"]);
  });

  test("Numbers in grammar attributes", () => {
    const custom = { tag: "path", attrs: { fill: 123, transform: 5, d: 5 } };
    expect(problems({ ...minimal(), custom })).toEqual([
      "custom.attrs.d: expected a string",
      "custom.attrs.fill: expected a string",
      "custom.attrs.transform: expected a string",
    ]);
  });

  test("Transform outside the grammar", () => {
    const custom = { tag: "g", attrs: { transform: "matrix(1 0 0 1 0 0)" }, children: [{ tag: "text", attrs: { transform: "rotate(-12 400 200)" }, children: ["GO"] }] };
    expect(problems({ ...minimal(), custom })).toEqual(["custom.attrs.transform: only translate, rotate and scale are allowed"]);
  });
});

describe("Cover output", () => {
  test("Layer order", () => {
    const result = buildCover(JSON.stringify({ ...minimal(), pieces: [{ piece: "pill", x: 100, y: 100, text: "first" }, { piece: "sheet", x: 200, y: 50, width: 100, height: 100, rows: [{ bar: 40 }] }] }), "s");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const pillRect = result.svg.indexOf('height="36" rx="18"');
    const sheetRect = result.svg.indexOf('x="200" y="50"');
    const label = result.svg.indexOf(">first</text>");
    expect(pillRect).toBeGreaterThan(0);
    expect(sheetRect).toBeGreaterThan(pillRect);
    expect(label).toBeGreaterThan(result.svg.lastIndexOf(tokens.illustration.textBar));
  });

  test("Ring colour from the pair", () => {
    const result = buildCover(JSON.stringify({ ...minimal(), rings: { cx: 400, cy: 215, radius: 100 } }), "s");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.svg).toContain('<rect width="800" height="420" fill="#F4D8BC"/>');
    expect(result.svg).toContain('<g fill="none" stroke="#EAC7A3" stroke-width="2">');
    const radii = [...result.svg.matchAll(/<circle cx="400" cy="215" r="(\d+)"\/>/g)].map((m) => Number(m[1]));
    expect(radii).toEqual(Array.from({ length: 14 }, (_, i) => 100 + 28 * i));
  });
});

describe("Parity with the published proof covers", () => {
  // Seven goldens: three proof covers, the banner, the icon, and the diagram in both languages (change designer-formats).
  test.each([
    ...[...PROOF_COVERS, "home-banner", "eip-splitter"].map((name) => [name, name, undefined]),
    ["circuit-breaker-states-pt", "circuit-breaker-states", "pt"],
    ["circuit-breaker-states-en", "circuit-breaker-states", "en"],
  ] as [string, string, string | undefined][])("Golden output (%s)", (golden, spec, lang) => {
    const result = buildCover(readFileSync(join(FIXTURES, `${spec}.json`), "utf8"), spec, lang);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.svg).toBe(readFileSync(join(FIXTURES, `${golden}.svg`), "utf8"));
  });
});

// Change unbounded-positions (cover-cli "Spec positions stay in the frame's range", "Overflow reported as a spec problem").
describe("Positions in a cover spec", () => {
  test("Rings centre out of range in a spec", () => {
    const ws = workspace();
    ws.write("spec.json", { ...minimal(), rings: { cx: 400, cy: -10001 } });
    expect(ws.run("spec.json", "--out", "cover.svg")).toBe(1);
    expect(ws.err[0]).toBe("rings.cy: expected a number at least -10000, found -10001");
    expect(readdirSync(ws.root)).toEqual(["spec.json"]);
  });

  test("Far piece in a spec", () => {
    const ws = workspace();
    ws.write("spec.json", { ...minimal(), pieces: [{ piece: "pill", x: 20000, y: 100, text: "far" }] });
    expect(ws.run("spec.json", "--out", "cover.svg")).toBe(0);
    expect(readFileSync(join(ws.root, "cover.svg"), "utf8")).toMatch(/<text x="20000" y="107">far<\/text>/);
  });

  test("Overflowing arrow in a spec", () => {
    const ws = workspace();
    ws.write("spec.json", {
      ...minimal(),
      pieces: [
        { piece: "pill", x: 100, y: 100, text: "ok" },
        { piece: "messageArrow", from: [-1.7e308, 0], to: [1.7e308, 0], curve: "straight" },
      ],
    });
    writeFileSync(join(ws.root, "cover.svg"), "old");
    expect(ws.run("spec.json", "--out", "cover.svg")).toBe(1);
    expect(ws.err[0]).toBe("pieces[1]: the drawing overflows");
    expect(readFileSync(join(ws.root, "cover.svg"), "utf8")).toBe("old");
  });
});

// Change banner-format (AB#156): cover-cli "Cover spec format", "Cover output", "Banner output", "Banner rings reach the corners".
const banner = (extra: Record<string, unknown> = {}) => ({ ...minimal(), format: "banner", background: "navy", rings: { cx: 600, cy: 225, radius: 60 }, ...extra });
const svgOf = (spec: unknown): string => {
  const result = buildCover(JSON.stringify(spec), "s");
  expect(result.ok).toBe(true);
  return result.ok ? result.svg : "";
};
const ringRadii = (svg: string): number[] => {
  const group = /<g fill="none" stroke="#1C2D74" stroke-width="2">([\s\S]*?)<\/g>/.exec(svg)![1];
  return [...group.matchAll(/ r="([\d.]+)"/g)].map((m) => Number(m[1]));
};

describe("Banner format", () => {
  test("Unknown format", () => {
    expect(problems({ ...minimal(), format: "poster" })).toEqual(["format: expected one of cover, banner, diagram, icon"]);
    expect(problems({ ...minimal(), format: 1 })).toEqual(["format: expected one of cover, banner, diagram, icon"]);
    const ws = workspace();
    ws.write("spec.json", { ...minimal(), format: "poster" });
    expect(ws.run("spec.json", "--out", "cover.svg")).toBe(1);
    expect(readdirSync(ws.root)).toEqual(["spec.json"]);
  });

  test("Ring count in a spec", () => {
    const diagram = { id: "d", title: "T", description: "D", format: "diagram", height: 100, rings: { cx: 0, cy: 0, count: 30 }, pieces: [] };
    for (const spec of [{ ...minimal(), rings: { cx: 400, cy: 215, count: 30 } }, banner({ rings: { cx: 600, cy: 225, count: 30 } }), diagram]) {
      expect(problems(spec)).toEqual(["rings.count: unknown parameter: the ring count comes from the format"]);
    }
  });

  test("Default format is the cover", () => {
    for (const name of PROOF_COVERS) {
      const spec = JSON.parse(readFileSync(join(FIXTURES, `${name}.json`), "utf8"));
      const golden = readFileSync(join(FIXTURES, `${name}.svg`), "utf8");
      expect(svgOf(spec)).toBe(golden);
      expect(svgOf({ ...spec, format: "cover" })).toBe(golden);
    }
  });

  test("Banner frame", () => {
    const svg = svgOf(banner({ pieces: [{ piece: "pill", x: 300, y: 100, text: "APIs" }] }));
    expect(svg).toMatch(/^<svg [^>]*width="1200" height="420" viewBox="0 0 1200 420"/);
    expect(svg).toContain('<clipPath id="t-frame">\n      <rect width="1200" height="420" rx="20"/>');
    expect(svg).toContain('<rect width="1200" height="420" rx="20" fill="#14215A"/>');
    const clipped = svg.lastIndexOf('<g clip-path="url(#t-frame)">');
    expect(clipped).toBeGreaterThan(svg.indexOf('<g clip-path="url(#t-frame)">'));
    expect(svg.indexOf('height="36" rx="18"')).toBeGreaterThan(clipped);
    expect(svg.indexOf(">APIs</text>")).toBeGreaterThan(clipped);
  });

  test("Piece past a corner", () => {
    const ws = workspace();
    ws.write("spec.json", banner({ pieces: [{ piece: "cloud", cx: -20, cy: 10 }] }));
    expect(ws.run("spec.json", "--out", "banner.svg")).toBe(0);
    const svg = readFileSync(join(ws.root, "banner.svg"), "utf8");
    expect(svg.indexOf("<path d=\"M-90,40")).toBeGreaterThan(svg.lastIndexOf('<g clip-path="url(#t-frame)">'));
  });

  test("Same command for both formats", () => {
    const ws = workspace();
    mkdirSync(join(ws.root, "out"));
    ws.write("banner.json", banner());
    expect(ws.run("banner.json", "--out", "out/banner.svg")).toBe(0);
    expect(ws.out).toEqual(["wrote out/banner.svg"]);
    const first = readFileSync(join(ws.root, "out/banner.svg"));
    expect(ws.run("banner.json", "--out", "out/banner.svg")).toBe(0);
    expect(readFileSync(join(ws.root, "out/banner.svg")).equals(first)).toBe(true);
  });

  test("Published centre", () => {
    expect(ringRadii(svgOf(banner()))).toEqual(Array.from({ length: 22 }, (_, i) => 60 + 28 * i));
  });

  test("First ring beyond every corner", () => {
    expect(ringRadii(svgOf(banner({ rings: { cx: 600, cy: 210, radius: 700 } })))).toEqual([700]);
  });

  test("Centre far outside the frame", () => {
    const radii = ringRadii(svgOf(banner({ rings: { cx: -10000, cy: -10000 } })));
    expect(radii).toHaveLength(545);
    expect([radii[0], radii[544]]).toEqual([90, 15322]);
  });
});

// Change bend-radius-and-current-colour (AB#170), task 3.1: cover-cli "No current colour in a spec".
describe("No current colour in a spec", () => {
  test("Current colour in a cover", () => {
    const ws = workspace();
    ws.write("spec.json", { ...minimal(), pieces: [{ piece: "uiIcon", name: "sun", x: 10, y: 10, colour: "currentColor" }] });
    writeFileSync(join(ws.root, "cover.svg"), "old");
    expect(ws.run("spec.json", "--out", "cover.svg")).toBe(1);
    expect(ws.err).toEqual(["pieces[0].colour: currentColor is for icons inline in a page; a cover uses a token path", "cover: 1 problem(s) in spec.json; no file written"]);
    expect(readFileSync(join(ws.root, "cover.svg"), "utf8")).toBe("old");
  });

  test("Current colour on another piece", () => {
    const ws = workspace();
    ws.write("spec.json", { ...minimal(), pieces: [{ piece: "pill", x: 100, y: 100, text: "ok", fill: "currentColor" }] });
    expect(ws.run("spec.json", "--out", "cover.svg")).toBe(1);
    expect(ws.err).toEqual(['pieces[0].fill: expected a colour token path such as color.healthy, found "currentColor"', "cover: 1 problem(s) in spec.json; no file written"]);
  });

  test("Token colour in a cover", () => {
    const ws = workspace();
    ws.write("spec.json", { ...minimal(), pieces: [{ piece: "uiIcon", name: "sun", x: 10, y: 10, colour: "color.white" }] });
    expect(ws.run("spec.json", "--out", "cover.svg")).toBe(0);
    expect(readFileSync(join(ws.root, "cover.svg"), "utf8")).toContain('<g transform="translate(10 10) scale(1)" fill="#FFFFFF" stroke="#FFFFFF">');
  });
});

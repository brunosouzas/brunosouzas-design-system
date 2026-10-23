// Integration tests of `npm run cover` (spec cover-cli; tasks 4.1 and 4.2),
// run in temporary folders. Each test title is the spec scenario it proves.
import { chmodSync, cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { buildCover, COVER_USAGE, runCover } from "../../scripts/cover";
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

describe("Cover spec format", () => {
  test("Unknown background and piece", () => {
    const lines = problems({ ...minimal(), background: "pink", pieces: [{ piece: "rocket" }] });
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(/^background: expected one of blush, cobalt, .*, wine, found "pink"$/);
    expect(lines[1]).toMatch(/^pieces\[0\]\.piece: unknown piece "rocket" \(expected one of pill, rings, sheet, .*, eipIcon\)$/);
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
      "pieces[2].width: expected a number greater than 0, found -5",
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
  test.each(PROOF_COVERS)("Golden output (%s)", (name) => {
    const result = buildCover(readFileSync(join(FIXTURES, `${name}.json`), "utf8"), name);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.svg).toBe(readFileSync(join(FIXTURES, `${name}.svg`), "utf8"));
  });
});

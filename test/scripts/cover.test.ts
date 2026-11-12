// Integration tests of `npm run cover` (spec cover-cli; tasks 4.1 and 4.2),
// run in temporary folders. Each test title is the spec scenario it proves.
import { chmodSync, cpSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import { buildCover, COVER_USAGE, runCover } from "../../scripts/cover";
import { codePoints } from "../pieces/cmap";
import { normalForm, type NormalNode } from "../pieces/normal-form";
import { comparePaths } from "../../src/pieces/cover";
import { tokens } from "../../tokens/generated/tokens";

const FIXTURES = new URL("../fixtures/covers/", import.meta.url).pathname;
const FONTS = new URL("../../fonts/", import.meta.url).pathname;

// Font reads can be failed on demand (cover-cli "Font embedding failure in the command").
const fontIo = vi.hoisted(() => ({ failing: new Set<string>() }));
vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  const readFile = async (...args: Parameters<typeof actual.readFile>) => {
    if ([...fontIo.failing].some((name) => String(args[0]).endsWith(name))) throw new Error("EACCES: permission denied (test)");
    return actual.readFile(...args);
  };
  return { ...actual, readFile, default: { ...actual, readFile } };
});
const PROOF_COVERS = ["spec-driven-development", "ai-writes-code", "integration-patterns"];

const folders: string[] = [];
afterEach(() => {
  for (const folder of folders.splice(0)) {
    chmodSync(folder, 0o755);
    rmSync(folder, { recursive: true, force: true });
  }
});

const workspace = (command: typeof runCover = runCover) => {
  const root = mkdtempSync(join(tmpdir(), "cover-"));
  folders.push(root);
  const out: string[] = [];
  const err: string[] = [];
  const run = (...args: string[]) => {
    out.length = 0;
    err.length = 0;
    return command(args, { cwd: root, log: (l) => out.push(l), error: (l) => err.push(l) });
  };
  const write = (name: string, spec: unknown) => writeFileSync(join(root, name), typeof spec === "string" ? spec : JSON.stringify(spec));
  return { root, out, err, run, write };
};

/** The cover command from a fresh module graph: nothing loaded yet, so a failed font read is seen. */
const freshCommand = async (): Promise<typeof runCover> => {
  vi.resetModules();
  return (await import("../../scripts/cover")).runCover;
};

/** `family weight style` of each @font-face of a written SVG, in order. */
const fontFaces = (svg: string): string[] =>
  [...svg.matchAll(/@font-face\{font-family:'([^']+)';font-weight:([\d ]+);font-style:(\w+);src:url\(data:font\/ttf;base64,[A-Za-z0-9+/=]+\) format\('truetype'\)\}/g)].map((m) => `${m[1]} ${m[2]} ${m[3]}`);
/** The characters each embedded subset maps, in rule order. */
const subsetCharacters = (svg: string): string[] =>
  [...svg.matchAll(/base64,([A-Za-z0-9+/=]+)\)/g)].map((m) => String.fromCodePoint(...codePoints(Buffer.from(m[1], "base64"))));

const minimal = () => ({
  id: "t",
  title: "Title",
  description: "Description",
  background: "trackIntegration",
  rings: { cx: 400, cy: 215 },
  pieces: [] as unknown[],
});

/** Problem lines of a spec (empty when valid). */
const problems = async (spec: unknown): Promise<string[]> => {
  const result = await buildCover(JSON.stringify(spec), "spec.json");
  return result.ok ? [] : result.lines;
};

describe("Cover command", () => {
  test("Proof cover", async () => {
    const ws = workspace();
    mkdirSync(join(ws.root, "out/covers"), { recursive: true });
    cpSync(join(FIXTURES, "spec-driven-development.json"), join(ws.root, "spec.json"));
    expect(await ws.run("spec.json", "--out", "out/covers/sdd.svg")).toBe(0);
    expect(ws.out).toEqual(["wrote out/covers/sdd.svg"]);
    expect(readFileSync(join(ws.root, "out/covers/sdd.svg"), "utf8")).toBe(readFileSync(join(FIXTURES, "spec-driven-development.svg"), "utf8"));
  });

  test("Running twice", async () => {
    const ws = workspace();
    cpSync(join(FIXTURES, "ai-writes-code.json"), join(ws.root, "spec.json"));
    await ws.run("spec.json", "--out", "a.svg");
    const first = readFileSync(join(ws.root, "a.svg"));
    expect(await ws.run("spec.json", "--out", "a.svg")).toBe(0);
    expect(readFileSync(join(ws.root, "a.svg")).equals(first)).toBe(true);
    expect(readdirSync(ws.root).sort()).toEqual(["a.svg", "spec.json"]);
  });
});

describe("Invocation problems", () => {
  test("Missing out", async () => {
    const ws = workspace();
    expect(await ws.run("cover.json")).toBe(1);
    expect(ws.err).toEqual(["--out <file.svg> is required", COVER_USAGE]);
    expect(readdirSync(ws.root)).toEqual([]);
  });

  test("Wrong extension and two specs", async () => {
    const ws = workspace();
    expect(await ws.run("a.json", "b.json", "--out", "cover.png")).toBe(1);
    expect(ws.err).toEqual(["the output must be an .svg file, found cover.png", COVER_USAGE]);
  });

  test("Missing folder", async () => {
    const ws = workspace();
    expect(await ws.run("a.json", "--out", "missing/cover.svg")).toBe(1);
    expect(ws.err[0]).toBe("the output folder does not exist: missing");
  });

  test("Out names a folder", async () => {
    const ws = workspace();
    mkdirSync(join(ws.root, "covers.svg"));
    expect(await ws.run("a.json", "--out", "covers.svg")).toBe(1);
    expect(ws.err[0]).toBe("the output is a folder: covers.svg");
  });

  test("Invalid JSON", async () => {
    const ws = workspace();
    ws.write("spec.json", '{\n  "id": "t",\n}\n');
    expect(await ws.run("spec.json", "--out", "c.svg")).toBe(1);
    expect(ws.err[0]).toMatch(/^spec\.json: invalid JSON at line 3, column 1/);
    expect(readdirSync(ws.root)).toEqual(["spec.json"]);
  });
});

describe("Safe write", () => {
  test.skipIf(process.getuid?.() === 0)("Write fails", async () => {
    const ws = workspace();
    cpSync(join(FIXTURES, "ai-writes-code.json"), join(ws.root, "spec.json"));
    writeFileSync(join(ws.root, "cover.svg"), "old");
    chmodSync(ws.root, 0o555);
    expect(await ws.run("spec.json", "--out", "cover.svg")).toBe(1);
    expect(ws.err[0]).toMatch(/^cannot write cover\.svg: /);
    chmodSync(ws.root, 0o755);
    expect(readFileSync(join(ws.root, "cover.svg"), "utf8")).toBe("old");
    expect(readdirSync(ws.root).sort()).toEqual(["cover.svg", "spec.json"]);
  });
});

describe("Safe write through a link", () => {
  test("Output that is a symlink", async () => {
    const ws = workspace();
    cpSync(join(FIXTURES, "ai-writes-code.json"), join(ws.root, "spec.json"));
    writeFileSync(join(ws.root, "outside.txt"), "keep");
    symlinkSync(join(ws.root, "outside.txt"), join(ws.root, "cover.svg"));
    expect(await ws.run("spec.json", "--out", "cover.svg")).toBe(0);
    expect(readFileSync(join(ws.root, "outside.txt"), "utf8")).toBe("keep");
    expect(lstatSync(join(ws.root, "cover.svg")).isSymbolicLink()).toBe(false);
    expect(readdirSync(ws.root).sort()).toEqual(["cover.svg", "outside.txt", "spec.json"]);
  });
});

describe("Every spec problem at once", () => {
  test("Limits between parameters are listed with their paths", async () => {
    const lines = await problems({
      ...minimal(),
      pieces: [
        { piece: "lineBadge", x: 0, y: 0, text: "SH", fill: "color.state.healthy", height: 96 },
        { piece: "nodeBlock", x: 0, y: 0, width: 80, title: "a" },
        { piece: "messageArrow", from: [0, 0], to: [20, 0] },
      ],
    });
    expect(lines.map((line) => line.split(":")[0])).toEqual(["pieces[0].width", "pieces[1].width", "pieces[2].to"]);
    // A schema problem and a limit on another parameter of the same piece are both reported.
    const mixed = await problems({ ...minimal(), pieces: [{ piece: "nodeBlock", x: 0, y: 0, width: 80, title: "" }] });
    expect(mixed.map((line) => line.split(":")[0])).toEqual(["pieces[0].title", "pieces[0].width"]);
  });
});

describe("Line colours from data", () => {
  test("Data colour in a cover spec", async () => {
    const lines = await problems({ ...minimal(), pieces: [{ piece: "pipe", d: "M0,0 L100,0", fill: "#7B3FE4" }] });
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
  test("Track background accepted", async () => {
    const result = await buildCover(JSON.stringify({ ...minimal(), background: "trackIntegration" }), "spec.json");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.svg).toContain(`fill="${tokens.coverBackground.trackIntegration.fill}"`);
    expect(result.svg).toContain(`stroke="${tokens.coverBackground.trackIntegration.ring}"`);
    expect(result.svg).toContain('fill="#F7C6A1"');
    expect(result.svg).toContain('stroke="#E3AB84"');
    // A named tone of a track family (design.md Decision 6).
    const tone = await buildCover(JSON.stringify({ ...minimal(), background: "deliveryMint" }), "spec.json");
    expect(tone.ok).toBe(true);
    if (!tone.ok) return;
    expect(tone.svg).toContain('fill="#A9DCD6"');
    expect(tone.svg).toContain('stroke="#88C4BD"');
  });

  // Change identity-v2-type-pieces-cleanup: the 21 pre-0.6.0 backgrounds are removed; only the twelve pairs of the track families and neutral remain.
  test("Removed background refused", async () => {
    const ws = workspace();
    ws.write("cover.json", { ...minimal(), background: "peach" });
    expect(await ws.run("cover.json", "--out", "cover.svg")).toBe(1);
    expect(ws.err[0]).toBe('background: expected one of aiLilac, aiSky, deliveryMint, deliveryOlive, integrationClay, integrationSand, neutral, personalRose, trackAi, trackDelivery, trackIntegration, trackPersonal, found "peach"');
    ws.write("banner.json", banner({ background: "navy" }));
    expect(await ws.run("banner.json", "--out", "banner.svg")).toBe(1);
    expect(ws.err).toContain('background: expected one of aiLilac, aiSky, deliveryMint, deliveryOlive, integrationClay, integrationSand, neutral, personalRose, trackAi, trackDelivery, trackIntegration, trackPersonal, found "navy"');
    expect(readdirSync(ws.root).sort()).toEqual(["banner.json", "cover.json"]);
  });

  test("Neutral background accepted", async () => {
    const result = await buildCover(JSON.stringify({ ...minimal(), background: "neutral" }), "spec.json");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.svg).toContain(`fill="${tokens.coverBackground.neutral.fill}"`);
    expect(result.svg).toContain(`stroke="${tokens.coverBackground.neutral.ring}"`);
  });

  test("Unknown background and piece", async () => {
    const lines = await problems({ ...minimal(), background: "pink", pieces: [{ piece: "rocket" }] });
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe('background: expected one of aiLilac, aiSky, deliveryMint, deliveryOlive, integrationClay, integrationSand, neutral, personalRose, trackAi, trackDelivery, trackIntegration, trackPersonal, found "pink"');
    expect(lines[1]).toMatch(/^pieces\[0\]\.piece: unknown piece "rocket" \(expected one of pill, rings, sheet, .*, eipIcon, lineBadge, .*, ledgerMark, renewalRing, suggestedHalo, licenceMark, zone, uiIcon, linkIcon, diagramBox, decisionNode, storeNode, queueNode, exchangeNode, taggedContainer, lifeline, phaseBand, altFrame, edgeLabel, stateStart, emote, mira, visor, drone, kiu, sinal, bankObject, symbol, brandNotationIcon, categoryIcon, headline, questionToken, balao, chaves, keyboard\)$/);
    expect(lines[1].split("expected one of ")[1].replace(/\)$/, "").split(", ")).toHaveLength(67);
  });

  test("Unsafe id", async () => {
    expect(await problems({ ...minimal(), id: "../sdd" })).toEqual([expect.stringMatching(/^id: expected a safe slug/)]);
    expect(await problems({ ...minimal(), id: "SDD" })).toEqual([expect.stringMatching(/^id: expected a safe slug/)]);
  });
});

describe("Piece parameters checked", () => {
  test("Several problems in one piece", async () => {
    const spec = { ...minimal(), pieces: [{ piece: "pill", x: 1, y: 1, text: "a" }, { piece: "pill", x: 1, y: 1, text: "b" }, { piece: "sheet", x: 0, y: 0, height: 10, colour: "color.white", width: -5 }] };
    expect(await problems(spec)).toEqual([
      "pieces[2].colour: unknown parameter (expected x, y, width, height, rows, top, step, fill, leadFill, tick)",
      "pieces[2].rows: missing required parameter",
      "pieces[2].width: expected a number at least 80, found -5",
    ]);
  });

  test("Colour literal anywhere", async () => {
    for (const literal of ["#FFFFFF", "#fff", "rgb(0,0,0)", "hsl(0,0%,0%)"]) {
      expect(await problems({ ...minimal(), title: literal })).toEqual(["title: colour literals are not allowed; use a token path"]);
    }
  });
});

describe("Every spec problem at once", () => {
  test("Problems sorted", async () => {
    const pieces: unknown[] = Array.from({ length: 11 }, () => ({ piece: "checkBadge", cx: 1, cy: 1 }));
    pieces[2] = { piece: "checkBadge", cx: 1 };
    pieces[10] = { piece: "checkBadge", cy: 1 };
    const lines = await problems({ ...minimal(), title: "", pieces });
    expect(lines.map((line) => line.split(":")[0])).toEqual(["pieces[2].cy", "pieces[10].cx", "title"]);
  });

  test("One problem per path", async () => {
    expect(await problems({ ...minimal(), pieces: [{ piece: "pill", x: 1, y: 1, text: "a", fill: "#fff" }] })).toEqual([
      "pieces[0].fill: colour literals are not allowed; use a token path",
    ]);
  });

  test("Wrong container", async () => {
    expect(await problems({ ...minimal(), pieces: { a: { piece: "pill" } } })).toEqual(["pieces: missing or not an array"]);
    expect(await problems({ ...minimal(), pieces: { fill: "#fff" } })).toEqual(["pieces: missing or not an array"]);
    expect(await problems({ ...minimal(), pieces: [{ piece: "rocket", fill: "#fff" }] })).toEqual([expect.stringMatching(/^pieces\[0\]\.piece: unknown piece "rocket"/)]);
    expect(await problems({ ...minimal(), custom: [{ tag: "g", attrs: { fill: "#fff" } }] })).toEqual(["custom: one free-form object per cover; a repeated object must be a piece"]);
  });

  test("Paths in code-point order", async () => {
    expect(comparePaths("\u{10000}", "\uE000")).toBeGreaterThan(0);
    expect(comparePaths("pieces[2]", "pieces[10]")).toBeLessThan(0);
  });
});

describe("One free-form object", () => {
  test("Array of objects", async () => {
    expect(await problems({ ...minimal(), custom: [{ tag: "g" }, { tag: "g" }] })).toEqual([
      "custom: one free-form object per cover; a repeated object must be a piece",
    ]);
  });

  // Change identity-v2-type-pieces-cleanup, task 3.6: the top-level state colours are no longer token paths.
  test("Removed top-level colour in custom", async () => {
    const ws = workspace();
    ws.write("spec.json", { ...minimal(), custom: { tag: "g", children: [{ tag: "path", attrs: { d: "M0,0 L10,10", fill: "color.blocked" } }] } });
    expect(await ws.run("spec.json", "--out", "cover.svg")).toBe(1);
    expect(ws.err[0]).toBe('custom.children[0].attrs.fill: expected none or a colour token path, found "color.blocked"');
    expect(readdirSync(ws.root)).toEqual(["spec.json"]);
  });

  test("Allowed object", async () => {
    const custom = { tag: "g", children: [{ tag: "path", attrs: { d: "M0,0 L10,10", fill: "color.state.blocked" } }, { tag: "text", attrs: { x: 5, y: 5 }, children: ["v1"] }] };
    const result = await buildCover(JSON.stringify({ ...minimal(), pieces: [{ piece: "checkBadge", cx: 1, cy: 1 }], custom }), "spec.json");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.svg).toContain(`<path d="M0,0 L10,10" fill="${tokens.color.state.blocked}"/>`);
    expect(result.svg).toContain('<text x="5" y="5" stroke="none">v1</text>');
    expect(result.svg.indexOf("<g>")).toBeGreaterThan(result.svg.indexOf(`r="16" fill="${tokens.color.state.healthy}"`));
  });
});

describe("Free-form content", () => {
  test("Forbidden content", async () => {
    const custom = { tag: "g", attrs: { onload: "x", href: "#a", style: "x" }, children: [{ tag: "script" }, { tag: "image" }] };
    expect((await problems({ ...minimal(), custom })).map((line) => line.split(":")[0])).toEqual([
      "custom.attrs.href",
      "custom.attrs.onload",
      "custom.attrs.style",
      "custom.children[0].tag",
      "custom.children[1].tag",
    ]);
  });

  test("External reference", async () => {
    const custom = { tag: "g", attrs: { fill: "url(#g)" }, children: [{ tag: "rect", attrs: { filter: "url(https://example.com/f.svg#f)" } }] };
    expect(await problems({ ...minimal(), custom })).toEqual([
      "custom.attrs.fill: references are not allowed (url( or //)",
      "custom.children[0].attrs.filter: attribute not allowed in a free-form object",
    ]);
    expect(await problems({ ...minimal(), custom: { tag: "rect", attrs: { d: "url(https://x)" } } })).toEqual(["custom.attrs.d: references are not allowed (url( or //)"]);
  });

  test("Numbers in grammar attributes", async () => {
    const custom = { tag: "path", attrs: { fill: 123, transform: 5, d: 5 } };
    expect(await problems({ ...minimal(), custom })).toEqual([
      "custom.attrs.d: expected a string",
      "custom.attrs.fill: expected a string",
      "custom.attrs.transform: expected a string",
    ]);
  });

  test("Transform outside the grammar", async () => {
    const custom = { tag: "g", attrs: { transform: "matrix(1 0 0 1 0 0)" }, children: [{ tag: "text", attrs: { transform: "rotate(-12 400 200)" }, children: ["GO"] }] };
    expect(await problems({ ...minimal(), custom })).toEqual(["custom.attrs.transform: only translate, rotate and scale are allowed"]);
  });
});

describe("Cover output", () => {
  test("Layer order", async () => {
    const result = await buildCover(JSON.stringify({ ...minimal(), pieces: [{ piece: "pill", x: 100, y: 100, text: "first" }, { piece: "sheet", x: 200, y: 50, width: 100, height: 100, rows: [{ bar: 40 }] }] }), "s");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const pillRect = result.svg.indexOf('height="36" rx="18"');
    const sheetRect = result.svg.indexOf('x="200" y="50"');
    const label = result.svg.indexOf(">first</text>");
    expect(pillRect).toBeGreaterThan(0);
    expect(sheetRect).toBeGreaterThan(pillRect);
    expect(label).toBeGreaterThan(result.svg.lastIndexOf(tokens.illustration.textBar));
  });

  test("Ring colour from the pair", async () => {
    const result = await buildCover(JSON.stringify({ ...minimal(), rings: { cx: 400, cy: 215, radius: 100 } }), "s");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.svg).toContain('<rect width="800" height="420" fill="#F7C6A1"/>');
    expect(result.svg).toContain('<g fill="none" stroke="#E3AB84" stroke-width="2">');
    const radii = [...result.svg.matchAll(/<circle cx="400" cy="215" r="(\d+)"\/>/g)].map((m) => Number(m[1]));
    expect(radii).toEqual(Array.from({ length: 14 }, (_, i) => 100 + 28 * i));
  });
});

describe("Parity with the published proof covers", () => {
  // Nine goldens: three proof covers, the banner, the icon, and the diagram in both languages (change designer-formats),
  // the og image (change headline-piece) and the LinkedIn banner (change presence-formats, AB#325).
  test.each([
    ...[...PROOF_COVERS, "home-banner", "eip-splitter", "og-headline", "linkedin-banner"].map((name) => [name, name, undefined]),
    ["circuit-breaker-states-pt", "circuit-breaker-states", "pt"],
    ["circuit-breaker-states-en", "circuit-breaker-states", "en"],
  ] as [string, string, string | undefined][])("Golden output (%s)", async (golden, spec, lang) => {
    const result = await buildCover(readFileSync(join(FIXTURES, `${spec}.json`), "utf8"), spec, lang);
    expect(result.ok).toBe(true);
    if (result.ok) expect(goldenDrift(golden, result.svg, readFileSync(join(FIXTURES, `${golden}.svg`), "utf8"))).toEqual([]);
  });

  // Change identity-v2-type-pieces-cleanup (cover-cli "Golden drifts").
  test("Golden drifts", async () => {
    const result = await buildCover(readFileSync(join(FIXTURES, "ai-writes-code.json"), "utf8"), "ai-writes-code");
    expect(result.ok).toBe(true);
    const golden = readFileSync(join(FIXTURES, "ai-writes-code.svg"), "utf8");
    const at = golden.indexOf("<title");
    const drifted = `${golden.slice(0, at)}<Title${golden.slice(at + 6)}`;
    if (result.ok) expect(goldenDrift("ai-writes-code", result.svg, drifted)).toEqual([`ai-writes-code: differs from its golden at offset ${at + 1}`]);
    // The LinkedIn banner's golden, one byte changed (change presence-formats).
    const banner = await buildCover(readFileSync(join(FIXTURES, "linkedin-banner.json"), "utf8"), "linkedin-banner");
    expect(banner.ok).toBe(true);
    const bannerGolden = readFileSync(join(FIXTURES, "linkedin-banner.svg"), "utf8");
    const ring = bannerGolden.indexOf('r="60"');
    const bannerDrifted = `${bannerGolden.slice(0, ring)}r="61"${bannerGolden.slice(ring + 6)}`;
    if (banner.ok) expect(goldenDrift("linkedin-banner", banner.svg, bannerDrifted)).toEqual([`linkedin-banner: differs from its golden at offset ${ring + 4}`]);
  });
});

/** Empty when `built` equals the golden byte for byte, otherwise one line naming the fixture and the offset of the first character that differs. */
function goldenDrift(name: string, built: string, golden: string): string[] {
  if (built === golden) return [];
  let at = 0;
  while (at < built.length && built[at] === golden[at]) at++;
  return [`${name}: differs from its golden at offset ${at}`];
}

// Change unbounded-positions (cover-cli "Spec positions stay in the frame's range", "Overflow reported as a spec problem").
describe("Positions in a cover spec", () => {
  test("Rings centre out of range in a spec", async () => {
    const ws = workspace();
    ws.write("spec.json", { ...minimal(), rings: { cx: 400, cy: -10001 } });
    expect(await ws.run("spec.json", "--out", "cover.svg")).toBe(1);
    expect(ws.err[0]).toBe("rings.cy: expected a number at least -10000, found -10001");
    expect(readdirSync(ws.root)).toEqual(["spec.json"]);
  });

  test("Far piece in a spec", async () => {
    const ws = workspace();
    ws.write("spec.json", { ...minimal(), pieces: [{ piece: "pill", x: 20000, y: 100, text: "far" }] });
    expect(await ws.run("spec.json", "--out", "cover.svg")).toBe(0);
    expect(readFileSync(join(ws.root, "cover.svg"), "utf8")).toMatch(/<text x="20000" y="107">far<\/text>/);
  });

  test("Overflowing arrow in a spec", async () => {
    const ws = workspace();
    ws.write("spec.json", {
      ...minimal(),
      pieces: [
        { piece: "pill", x: 100, y: 100, text: "ok" },
        { piece: "messageArrow", from: [-1.7e308, 0], to: [1.7e308, 0], curve: "straight" },
      ],
    });
    writeFileSync(join(ws.root, "cover.svg"), "old");
    expect(await ws.run("spec.json", "--out", "cover.svg")).toBe(1);
    expect(ws.err[0]).toBe("pieces[1]: the drawing overflows");
    expect(readFileSync(join(ws.root, "cover.svg"), "utf8")).toBe("old");
  });
});

// Change banner-format (AB#156): cover-cli "Cover spec format", "Cover output", "Banner output", "Banner rings reach the corners".
const banner = (extra: Record<string, unknown> = {}) => ({ ...minimal(), format: "banner", background: "trackIntegration", rings: { cx: 600, cy: 225, radius: 60 }, ...extra });
const svgOf = async (spec: unknown): Promise<string> => {
  const result = await buildCover(JSON.stringify(spec), "s");
  expect(result.ok).toBe(true);
  return result.ok ? result.svg : "";
};
const ringRadii = (svg: string): number[] => {
  const group = /<g fill="none" stroke="#E3AB84" stroke-width="2">([\s\S]*?)<\/g>/.exec(svg)![1];
  return [...group.matchAll(/ r="([\d.]+)"/g)].map((m) => Number(m[1]));
};

describe("Banner format", () => {
  test("Unknown format", async () => {
    expect(await problems({ ...minimal(), format: "poster" })).toEqual(["format: expected one of cover, banner, diagram, icon, favicon, linkedin-card, og, avatar, linkedin-banner"]);
    expect(await problems({ ...minimal(), format: 1 })).toEqual(["format: expected one of cover, banner, diagram, icon, favicon, linkedin-card, og, avatar, linkedin-banner"]);
    const ws = workspace();
    ws.write("spec.json", { ...minimal(), format: "poster" });
    expect(await ws.run("spec.json", "--out", "cover.svg")).toBe(1);
    expect(readdirSync(ws.root)).toEqual(["spec.json"]);
  });

  test("Ring count in a spec", async () => {
    const diagram = { id: "d", title: "T", description: "D", format: "diagram", height: 100, rings: { cx: 0, cy: 0, count: 30 }, pieces: [] };
    for (const spec of [{ ...minimal(), rings: { cx: 400, cy: 215, count: 30 } }, banner({ rings: { cx: 600, cy: 225, count: 30 } }), diagram]) {
      expect(await problems(spec)).toEqual(["rings.count: unknown parameter: the ring count comes from the format"]);
    }
  });

  test("Default format is the cover", async () => {
    for (const name of PROOF_COVERS) {
      const spec = JSON.parse(readFileSync(join(FIXTURES, `${name}.json`), "utf8"));
      const golden = readFileSync(join(FIXTURES, `${name}.svg`), "utf8");
      expect(await svgOf(spec)).toBe(golden);
      expect(await svgOf({ ...spec, format: "cover" })).toBe(golden);
    }
  });

  test("Banner frame", async () => {
    const svg = await svgOf(banner({ background: "trackDelivery", pieces: [{ piece: "pill", x: 300, y: 100, text: "APIs" }] }));
    expect(svg).toMatch(/^<svg [^>]*width="1200" height="420" viewBox="0 0 1200 420"/);
    expect(svg).toContain('<clipPath id="t-frame">\n      <rect width="1200" height="420" rx="20"/>');
    expect(svg).toContain('<rect width="1200" height="420" rx="20" fill="#B9DEC3"/>');
    const clipped = svg.lastIndexOf('<g clip-path="url(#t-frame)">');
    expect(clipped).toBeGreaterThan(svg.indexOf('<g clip-path="url(#t-frame)">'));
    expect(svg.indexOf('height="36" rx="18"')).toBeGreaterThan(clipped);
    expect(svg.indexOf(">APIs</text>")).toBeGreaterThan(clipped);
  });

  test("Piece past a corner", async () => {
    const ws = workspace();
    ws.write("spec.json", banner({ pieces: [{ piece: "cloud", cx: -20, cy: 10 }] }));
    expect(await ws.run("spec.json", "--out", "banner.svg")).toBe(0);
    const svg = readFileSync(join(ws.root, "banner.svg"), "utf8");
    expect(svg.indexOf("<path d=\"M-90,40")).toBeGreaterThan(svg.lastIndexOf('<g clip-path="url(#t-frame)">'));
  });

  test("Same command for both formats", async () => {
    const ws = workspace();
    mkdirSync(join(ws.root, "out"));
    ws.write("banner.json", banner());
    expect(await ws.run("banner.json", "--out", "out/banner.svg")).toBe(0);
    expect(ws.out).toEqual(["wrote out/banner.svg"]);
    const first = readFileSync(join(ws.root, "out/banner.svg"));
    expect(await ws.run("banner.json", "--out", "out/banner.svg")).toBe(0);
    expect(readFileSync(join(ws.root, "out/banner.svg")).equals(first)).toBe(true);
  });

  test("Published centre", async () => {
    expect(ringRadii(await svgOf(banner()))).toEqual(Array.from({ length: 22 }, (_, i) => 60 + 28 * i));
  });

  test("First ring beyond every corner", async () => {
    expect(ringRadii(await svgOf(banner({ rings: { cx: 600, cy: 210, radius: 700 } })))).toEqual([700]);
  });

  test("Centre far outside the frame", async () => {
    const radii = ringRadii(await svgOf(banner({ rings: { cx: -10000, cy: -10000 } })));
    expect(radii).toHaveLength(545);
    expect([radii[0], radii[544]]).toEqual([90, 15322]);
  });
});

// Change bend-radius-and-current-colour (AB#170), task 3.1: cover-cli "No current colour in a spec".
describe("No current colour in a spec", () => {
  test("Current colour in a cover", async () => {
    const ws = workspace();
    ws.write("spec.json", { ...minimal(), pieces: [{ piece: "uiIcon", name: "sun", x: 10, y: 10, colour: "currentColor" }] });
    writeFileSync(join(ws.root, "cover.svg"), "old");
    expect(await ws.run("spec.json", "--out", "cover.svg")).toBe(1);
    expect(ws.err).toEqual(["pieces[0].colour: currentColor is for icons inline in a page; a cover uses a token path", "cover: 1 problem(s) in spec.json; no file written"]);
    expect(readFileSync(join(ws.root, "cover.svg"), "utf8")).toBe("old");
  });

  test("Current colour on another piece", async () => {
    const ws = workspace();
    ws.write("spec.json", { ...minimal(), pieces: [{ piece: "pill", x: 100, y: 100, text: "ok", fill: "currentColor" }] });
    expect(await ws.run("spec.json", "--out", "cover.svg")).toBe(1);
    expect(ws.err).toEqual(['pieces[0].fill: expected a colour token path such as color.state.healthy, found "currentColor"', "cover: 1 problem(s) in spec.json; no file written"]);
  });

  test("Token colour in a cover", async () => {
    const ws = workspace();
    ws.write("spec.json", { ...minimal(), pieces: [{ piece: "uiIcon", name: "sun", x: 10, y: 10, colour: "color.white" }] });
    expect(await ws.run("spec.json", "--out", "cover.svg")).toBe(0);
    expect(readFileSync(join(ws.root, "cover.svg"), "utf8")).toContain('<g transform="translate(10 10) scale(1)" fill="#FFFFFF" stroke="#FFFFFF">');
  });
});

// Spec cover-cli, change identity-v2-type-pieces-cleanup (task 4.5): only the emote stays of the cast pieces.
describe("Emote on a cover", () => {
  test("Emote drawn", async () => {
    const ws = workspace();
    ws.write("spec.json", { ...minimal(), pieces: [{ piece: "emote", kind: "idea", x: 520, y: 160 }] });
    expect(await ws.run("spec.json", "--out", "emote.svg")).toBe(0);
    const svg = readFileSync(join(ws.root, "emote.svg"), "utf8");
    const outlined = svg.slice(svg.indexOf(`<g stroke="${tokens.color.ink}" stroke-width="4" stroke-linejoin="round">`));
    expect(outlined.length).toBeLessThan(svg.length);
    expect(outlined).toContain('<g data-emote="idea" stroke="none">');
  });

  test("Mascot refused", async () => {
    const ws = workspace();
    ws.write("spec.json", {
      ...minimal(),
      pieces: [
        { piece: "mascot", who: "dev", x: 0, y: 0 },
        { piece: "emote", kind: "zzz", x: 0, y: 0 },
      ],
    });
    expect(await ws.run("spec.json", "--out", "cast.svg")).toBe(1);
    expect(ws.err[0]).toMatch(/^pieces\[0\]\.piece: unknown piece "mascot"/);
    expect(ws.err[0].split(", ")).toHaveLength(67);
    expect(ws.err[0]).toMatch(/, headline, questionToken, balao, chaves, keyboard\)$/);
    expect(ws.err[1]).toMatch(/^pieces\[1\]\.kind: expected one of idea, doubt, problem, worked, refused, pressure, liked, waiting, found "zzz"$/);
    expect(readdirSync(ws.root)).toEqual(["spec.json"]);
  });
});

// Change identity-v2 (AB#268): cover-cli "Signature lockup", "New icon formats".
describe("Signature lockup", () => {
  test("Signature drawn", async () => {
    const result = await buildCover(JSON.stringify({ ...minimal(), signature: true }), "s");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const svg = result.svg;
    // The lockup closes the outlined group: after it, only the closing tags before the words.
    const start = svg.indexOf('<g data-piece="signature">');
    expect(start).toBeGreaterThan(0);
    const lockup = svg.slice(start);
    expect(lockup).toContain('data-piece="mira"');
    // Anchored by cover.signatureMargin: Mira 55 x 43.75, a gap of 6, the symbol 24 (scale 0.75), on an 800 x 420 frame.
    const m = tokens.cover.signatureMargin;
    const left = 800 - m - (220 * 0.25 + 6 + 24);
    const top = 420 - m - 175 * 0.25;
    const r2 = (n: number) => Math.round(n * 100) / 100;
    expect(lockup).toContain(`translate(${r2(left + 27.5)} ${r2(top + 43.75)}) scale(0.25)`);
    expect(lockup).toContain(`translate(${r2(left + 55 + 6)} ${r2(top + (43.75 - 24) / 2)}) scale(0.75)`);
  });

  test("No signature by default", async () => {
    const svg = await svgOf(minimal());
    expect(svg).not.toContain('data-piece="signature"');
  });

  test("Signature rejected on a diagram", async () => {
    const diagram = { id: "d", title: "T", description: "D", format: "diagram", height: 100, rings: { cx: 0, cy: 0 }, pieces: [], signature: true };
    expect(await problems(diagram)).toEqual(["signature: not used by the diagram format"]);
  });

  test("Signature refused by an icon", async () => {
    const icon = { id: "i", title: "Sun", description: "D", format: "icon", pieces: [{ piece: "uiIcon", name: "sun" }], signature: true };
    expect(await problems(icon)).toEqual(["signature: not used by the icon format"]);
    const ws = workspace();
    ws.write("icon.json", icon);
    expect(await ws.run("icon.json", "--out", "icon.svg")).toBe(1);
    expect(readdirSync(ws.root)).toEqual(["icon.json"]);
  });

  test("Signature must be a boolean", async () => {
    expect(await problems({ ...minimal(), signature: "yes" })).toEqual(["signature: expected true or false"]);
  });
});

describe("New icon formats", () => {
  const favicon = () => ({ id: "fav", title: "Symbol", description: "The b-with-moon symbol, favicon-sized.", format: "favicon" });
  const avatar = () => ({ id: "av", title: "Symbol", description: "The b-with-moon symbol, filling the frame.", format: "avatar" });

  test("Favicon is the symbol, both themes, no pieces", async () => {
    const svg = await svgOf(favicon());
    expect(svg).toContain('width="32" height="32" viewBox="0 0 32 32"');
    expect(svg).toContain("prefers-color-scheme:dark");
    expect(svg).toContain('class="ds-favicon-light"');
    expect(svg).toContain('class="ds-favicon-dark"');
    expect(await problems({ ...favicon(), pieces: [{ piece: "mira", x: 0, y: 0 }] })).toEqual(["pieces: not used by the favicon format"]);
    for (const key of ["background", "rings", "custom", "customAt", "height", "signature"]) {
      const value = key === "height" ? 100 : key === "signature" ? true : key === "rings" ? { cx: 0, cy: 0 } : "x";
      expect(await problems({ ...favicon(), [key]: value })).toEqual([`${key}: not used by the favicon format`]);
    }
  });

  test("LinkedIn card and og image are fixed sizes", async () => {
    expect(await svgOf({ ...banner(), id: "li", format: "linkedin-card" })).toContain('width="1080" height="1080" viewBox="0 0 1080 1080"');
    expect(await svgOf({ ...banner(), id: "og", format: "og" })).toContain('width="1200" height="630" viewBox="0 0 1200 630"');
  });

  test("Avatar draws the symbol filling the frame, no background or pieces", async () => {
    const svg = await svgOf(avatar());
    expect(svg).toContain('width="500" height="500" viewBox="0 0 500 500"');
  });

  // Change presence-formats (AB#325), task 3.3: cover-cli "New icon formats" (modified), "Avatar ground".
  test("Avatar refuses a background and pieces", async () => {
    const backgrounds = Object.keys(tokens.coverBackground).join(", ");
    const cases: [Record<string, unknown>, string][] = [
      [{ pieces: [{ piece: "mira", x: 0, y: 0 }] }, "pieces: not used by the avatar format"],
      [{ rings: { cx: 0, cy: 0 } }, "rings: not used by the avatar format"],
      [{ background: "pink" }, `background: expected one of ${backgrounds}, found "pink"`],
    ];
    for (const [extra, line] of cases) {
      expect(await problems({ ...avatar(), ...extra })).toEqual([line]);
      const ws = workspace();
      ws.write("a.json", { ...avatar(), ...extra });
      expect(await ws.run("a.json", "--out", "a.svg")).toBe(1);
      expect(readdirSync(ws.root)).toEqual(["a.json"]);
    }
  });

  test("Avatar on the neutral ground", async () => {
    const plain = await svgOf(avatar());
    const svg = await svgOf({ ...avatar(), background: "neutral" });
    expect(svg).toContain('width="500" height="500" viewBox="0 0 500 500"');
    expect(svg).toContain('<rect width="500" height="500" fill="#F6F3EC"/>');
    expect(tokens.coverBackground.neutral.fill).toBe("#F6F3EC");
    const symbolGroup = (text: string) => text.slice(text.indexOf('<g transform="scale(15.625)">'));
    expect(symbolGroup(svg)).toBe(symbolGroup(plain));
    expect(svg.replace('fill="#F6F3EC"', `fill="${tokens.brand.light.accentText}"`)).toBe(plain);
  });

  test("Default avatar unchanged", async () => {
    const baseline = readFileSync(join(FIXTURES, "avatar-0.9.1.svg"));
    expect(Buffer.from(await svgOf(avatar())).equals(baseline)).toBe(true);
    const sha = createHash("sha256").update(baseline).digest("hex");
    expect(readFileSync(join(FIXTURES, "README.md"), "utf8")).toContain(`SHA-256 \`${sha}\``);
  });
});

// Change identity-v2-type-pieces-cleanup (card 300), task 1.4: cover-cli "Fonts embedded in every written image",
// "Font embedding failure in the command".
describe("Fonts embedded in every written image", () => {
  const fixture = async (name: string, lang?: string) => {
    const result = await buildCover(readFileSync(join(FIXTURES, `${name}.json`), "utf8"), name, lang);
    expect(result.ok ? [] : result.lines).toEqual([]);
    return result.ok ? result.svg : "";
  };

  test("Proof cover carries its faces", async () => {
    const svg = await fixture("spec-driven-development");
    expect(svg.match(/<style>/g)).toHaveLength(1);
    expect(svg).toMatch(/<\/desc>\n  <style>@font-face/);
    expect(fontFaces(svg)).toEqual(["Source Sans 3 550 799 normal", "Source Sans 3 800 900 normal"]);
    expect(svg).toBe(readFileSync(join(FIXTURES, "spec-driven-development.svg"), "utf8"));
  });

  test("Diagram carries its code face", async () => {
    expect(fontFaces(await fixture("circuit-breaker-states", "en"))).toEqual(["Source Code Pro 550 900 normal", "Source Sans 3 550 799 normal"]);
  });

  test("Text-free output gets no font style", async () => {
    expect(await fixture("eip-splitter")).not.toContain("<style>");
    const favicon = await buildCover(JSON.stringify({ id: "fav", title: "Symbol", description: "The symbol, favicon-sized.", format: "favicon" }), "fav");
    const svg = favicon.ok ? favicon.svg : "";
    expect(svg.match(/<style>/g)).toHaveLength(1);
    expect(svg).toContain("prefers-color-scheme:dark");
    expect(svg).not.toContain("@font-face");
  });

  test("Character the faces lack", async () => {
    const ws = workspace();
    ws.write("spec.json", { ...minimal(), pieces: [{ piece: "pill", x: 100, y: 100, text: "漢 ok" }] });
    expect(await ws.run("spec.json", "--out", "cover.svg")).toBe(0);
    const svg = readFileSync(join(ws.root, "cover.svg"), "utf8");
    expect(svg).toContain(">漢 ok</text>");
    expect(subsetCharacters(svg)).toEqual([" ko"]);
  });

  test("Embedding is deterministic", async () => {
    const ws = workspace();
    ws.write("d.json", {
      id: "d",
      title: "Title",
      description: "Description",
      format: "diagram",
      height: 200,
      rings: { cx: 280, cy: 100 },
      text: { pt: { box: "Pedido `id`" }, en: { box: "Order `id`" } },
      pieces: [{ piece: "diagramBox", x: 20, y: 20, width: 200, text: ["@box"] }],
    });
    expect(await ws.run("d.json", "--out", "a.svg", "--lang", "pt")).toBe(0);
    expect(await ws.run("d.json", "--out", "b.svg", "--lang", "pt")).toBe(0);
    const first = readFileSync(join(ws.root, "a.svg"), "utf8");
    expect(fontFaces(first)).toEqual(["Source Code Pro 550 900 normal", "Source Sans 3 550 799 normal"]);
    expect(readFileSync(join(ws.root, "b.svg"), "utf8")).toBe(first);
  });
});

describe("Font embedding failure in the command", () => {
  afterEach(() => {
    fontIo.failing.clear();
    vi.restoreAllMocks();
  });

  test("Unreadable font file", async () => {
    fontIo.failing.add("SourceSans3-Bold.ttf");
    const ws = workspace(await freshCommand());
    cpSync(join(FIXTURES, "home-banner.json"), join(ws.root, "banner.json"));
    writeFileSync(join(ws.root, "banner.svg"), "old");
    expect(await ws.run("banner.json", "--out", "banner.svg")).toBe(1);
    expect(ws.err).toEqual([expect.stringContaining(join(FONTS, "SourceSans3-Bold.ttf"))]);
    expect(ws.out).toEqual([]);
    expect(readFileSync(join(ws.root, "banner.svg"), "utf8")).toBe("old");
  });

  test("WebAssembly fails to load", async () => {
    vi.spyOn(WebAssembly, "instantiate").mockRejectedValue(new Error("no wasm (test)"));
    const ws = workspace(await freshCommand());
    ws.write("spec.json", { ...minimal(), pieces: [{ piece: "pill", x: 100, y: 100, text: "words" }] });
    expect(await ws.run("spec.json", "--out", "cover.svg")).toBe(1);
    expect(ws.err).toEqual([expect.stringContaining("harfbuzzjs")]);
    expect(readdirSync(ws.root)).toEqual(["spec.json"]);
  });
});

// Change stackledger-product-layer (card 303), task 1.5: design-tokens "Product accent in a spec".
describe("Brand colour roles", () => {
  test("Product accent in a spec", async () => {
    const svg = await svgOf(banner({ pieces: [{ piece: "pipe", d: "M0,0 L100,0", fill: "brand.light.stackledgerAccent" }] }));
    const pipePaths = [...svg.matchAll(/<path d="M0,0 L100,0"[^>]*>/g)].map((m) => m[0]);
    expect(pipePaths.some((path) => path.includes('stroke="#3B5BDB"'))).toBe(true);
  });
});

// Spec cover-cli, change sdd-scene-pieces (AB#333), task 6.1: "Question token and held sheet in a spec".
describe("Question token and held sheet in a spec", () => {
  const attr = (node: NormalNode, name: string) => node.attrs.find(([key]) => key === name)?.[1];
  /** Every element with its ancestors, depth first. */
  const withAncestors = (node: NormalNode, ancestors: NormalNode[] = []): { node: NormalNode; ancestors: NormalNode[] }[] =>
    node.children.flatMap((child) => (typeof child === "string" ? [] : [{ node: child, ancestors }, ...withAncestors(child, [...ancestors, child])]));
  const textOf = (node: NormalNode): string => node.children.map((child) => (typeof child === "string" ? child : textOf(child))).join("");

  test("Token and held sheet drawn", async () => {
    const ws = workspace();
    ws.write("spec.json", {
      ...minimal(),
      pieces: [
        { piece: "visor", x: 520, y: 380, facing: "left", holdsSheet: { width: 120, height: 160, rows: [{ lead: "question", bar: 40 }], label: "proposal.md" } },
        { piece: "questionToken", cx: 200, cy: 120, scale: 1.5 },
      ],
    });
    expect(await ws.run("spec.json", "--out", "sdd.svg")).toBe(0);
    const tree = normalForm(readFileSync(join(ws.root, "sdd.svg"), "utf8"));
    const all = withAncestors(tree);
    const isOutlined = (node: NormalNode) => node.tag === "g" && attr(node, "stroke") === tokens.color.ink && attr(node, "stroke-width") === "4" && attr(node, "stroke-linejoin") === "round" && attr(node, "data-held") === undefined;
    const outlined = all.find(({ node }) => isOutlined(node))!.node;
    const inOutlined = withAncestors(outlined).map(({ node }) => node);
    const visorGroup = inOutlined.find((node) => attr(node, "data-piece") === "visor")!;
    expect(visorGroup).toBeDefined();
    const first = visorGroup.children.find((child): child is NormalNode => typeof child !== "string")!;
    expect(attr(first, "data-held")).toBe("sheet");
    expect(inOutlined.some((node) => attr(node, "data-piece") === "questionToken" && node.children.some((child) => typeof child !== "string" && child.tag === "circle"))).toBe(true);
    const labels = all.find(({ node }) => node.tag === "g" && attr(node, "font-size") === String(tokens.cover.labelSize) && attr(node, "text-anchor") === "middle" && attr(node, "fill") === tokens.color.ink && attr(node, "stroke") === undefined)!;
    const texts = withAncestors(labels.node, [...labels.ancestors, labels.node]).filter(({ node }) => node.tag === "text");
    expect(texts.map(({ node }) => textOf(node)).sort()).toEqual(["?", "?", "proposal.md"]);
    for (const { node, ancestors } of texts) expect(ancestors.filter((ancestor) => attr(ancestor, "stroke") !== undefined), textOf(node)).toEqual([]);
  });

  test("Problems at their paths", async () => {
    const ws = workspace();
    ws.write("spec.json", {
      ...minimal(),
      pieces: [
        { piece: "visor", x: 200, y: 380, holds: true, holdsSheet: { width: 130, height: 218, rows: [{ bar: 40 }] } },
        { piece: "visor", x: 400, y: 380, holdsSheet: { width: 130, height: 218, rows: [] } },
        { piece: "questionToken", cx: 200, cy: 120, scale: 0 },
      ],
    });
    expect(await ws.run("spec.json", "--out", "sdd.svg")).toBe(1);
    expect(ws.err.slice(0, 3)).toEqual([
      "pieces[0].holdsSheet: Visor holds a card or a sheet, not both",
      expect.stringMatching(/^pieces\[1\]\.holdsSheet\.rows: /),
      expect.stringMatching(/^pieces\[2\]\.scale: /),
    ]);
    expect(ws.err).toHaveLength(4);
    expect(readdirSync(ws.root)).toEqual(["spec.json"]);
  });
});

// Spec cover-cli, change supporting-characters (AB#337), task 4.1: "Supporting cast in a spec".
describe("Supporting cast in a spec", () => {
  const attr = (node: NormalNode, name: string) => node.attrs.find(([key]) => key === name)?.[1];
  /** Every element with its ancestors, depth first. */
  const withAncestors = (node: NormalNode, ancestors: NormalNode[] = []): { node: NormalNode; ancestors: NormalNode[] }[] =>
    node.children.flatMap((child) => (typeof child === "string" ? [] : [{ node: child, ancestors }, ...withAncestors(child, [...ancestors, child])]));
  const textOf = (node: NormalNode): string => node.children.map((child) => (typeof child === "string" ? child : textOf(child))).join("");
  const firstChild = (node: NormalNode) => node.children.find((child): child is NormalNode => typeof child !== "string")!;

  test("Supporting cast drawn", async () => {
    const ws = workspace();
    ws.write("spec.json", {
      ...minimal(),
      pieces: [
        { piece: "balao", x: 200, y: 380, holdsStamp: { word: "GO" } },
        { piece: "chaves", x: 560, y: 380, facing: "left", holdsSheet: { width: 150, height: 160, rows: [{ lead: "question", bar: 40 }], label: "proposal.md" } },
        { piece: "keyboard", x: 300, y: 300 },
      ],
    });
    expect(await ws.run("spec.json", "--out", "cast.svg")).toBe(0);
    const tree = normalForm(readFileSync(join(ws.root, "cast.svg"), "utf8"));
    const all = withAncestors(tree);
    const isOutlined = (node: NormalNode) => node.tag === "g" && attr(node, "stroke") === tokens.color.ink && attr(node, "stroke-width") === "4" && attr(node, "stroke-linejoin") === "round" && attr(node, "data-held") === undefined;
    const outlined = all.find(({ node }) => isOutlined(node))!.node;
    const inOutlined = withAncestors(outlined);
    const group = (name: string) => inOutlined.find(({ node }) => attr(node, "data-piece") === name)!.node;
    expect(attr(firstChild(group("balao")), "data-held")).toBe("stamp");
    expect(attr(firstChild(group("chaves")), "data-held")).toBe("sheet");
    // Every key of the keyboard has an ancestor inside the keyboard group with `stroke: none`, so none takes the outline.
    const board = group("keyboard");
    const keys = withAncestors(board).filter(({ node }) => node.tag === "rect" && attr(node, "width") === "12" && attr(node, "height") === "4");
    expect(keys).toHaveLength(6);
    for (const { ancestors } of keys) expect(ancestors.some((ancestor) => attr(ancestor, "stroke") === "none")).toBe(true);
    const labels = all.find(({ node }) => node.tag === "g" && attr(node, "font-size") === String(tokens.cover.labelSize) && attr(node, "text-anchor") === "middle" && attr(node, "fill") === tokens.color.ink && attr(node, "stroke") === undefined)!;
    const texts = withAncestors(labels.node, [...labels.ancestors, labels.node]).filter(({ node }) => node.tag === "text");
    expect(texts.map(({ node }) => textOf(node)).sort()).toEqual(["?", "GO", "proposal.md"]);
    for (const { node, ancestors } of texts) expect(ancestors.filter((ancestor) => attr(ancestor, "stroke") !== undefined), textOf(node)).toEqual([]);
    // No word sits inside the outlined group.
    expect(inOutlined.filter(({ node }) => node.tag === "text")).toEqual([]);
  });

  test("Supporting cast problems at their paths", async () => {
    const ws = workspace();
    ws.write("spec.json", {
      ...minimal(),
      pieces: [
        { piece: "balao", x: 200, y: 380, speaks: true, view: "back", holdsStamp: { word: "GO" } },
        { piece: "chaves", x: 400, y: 380, types: true, points: true, holdsSheet: { width: 150, height: 160, rows: [{ bar: 40 }] } },
        { piece: "keyboard", x: 300, y: 300, width: 79 },
      ],
    });
    expect(await ws.run("spec.json", "--out", "cast.svg")).toBe(1);
    expect(ws.err.slice(0, 3)).toEqual([
      "pieces[0].holdsStamp: Balão does one action at a time",
      "pieces[1].points: Chaves does one action at a time",
      expect.stringMatching(/^pieces\[2\]\.width: expected a number at least 80/),
    ]);
    // Three problems, then the command's closing line.
    expect(ws.err).toHaveLength(4);
    expect(ws.err[3]).not.toMatch(/^pieces/);
    expect(readdirSync(ws.root)).toEqual(["spec.json"]);
  });
});

// Unit tests of the PNG script (spec cover-cli, "PNG script outside the
// package", "PNG render", "Browser for the PNG script", "Photo zones overlay";
// change presence-formats, task 4.1). No browser runs here: the browser and the
// file checks are injected (CI renders nothing). Each test title is the spec
// scenario it proves.
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { browserArgs, findBrowser, MAC_BROWSERS, NO_BROWSER, parsePngArgs, PNG_USAGE, pngPage, pngProblem, pngSize, runPng, svgSize } from "../../scripts/png";

const folders: string[] = [];
afterEach(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
});

/** A PNG header of the given size (signature, IHDR length, type, width, height). */
const pngOf = (width: number, height: number): Buffer => {
  const bytes = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(bytes, 0);
  bytes.writeUInt32BE(13, 8);
  bytes.write("IHDR", 12, "latin1");
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
};
const svgOfSize = (width: number, height: number) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"></svg>\n`;

const workspace = () => {
  const root = mkdtempSync(join(tmpdir(), "png-"));
  folders.push(root);
  const out: string[] = [];
  const err: string[] = [];
  const calls: string[][] = [];
  /** A stand-in browser that writes a PNG of `shot` to its --screenshot path. */
  const run = (args: string[], shot?: { width: number; height: number }, env: Record<string, string | undefined> = { BRUNOSOUZAS_CHROME: "/fake/chrome" }) => {
    out.length = 0;
    err.length = 0;
    return runPng(
      args,
      { cwd: root, log: (l) => out.push(l), error: (l) => err.push(l) },
      {
        env,
        isFile: (path) => path === "/fake/chrome" || path.startsWith(root),
        exec: async (_file, list) => {
          calls.push(list);
          if (shot) writeFileSync(list.find((a) => a.startsWith("--screenshot="))!.slice("--screenshot=".length), pngOf(shot.width, shot.height));
        },
      },
    );
  };
  return { root, out, err, calls, run };
};

describe("Photo zones overlay", () => {
  test("Page with zones", () => {
    const page = pngPage({ width: 1584, height: 396 }, { width: 792, zones: true });
    expect([page.width, page.height]).toEqual([792, 198]);
    expect(page.html.match(/<img /g)).toHaveLength(1);
    expect(page.html).toContain('<img src="image.svg" width="792" height="198"');
    const overlay = /<svg [^>]*viewBox="0 0 1584 396"[^>]*>([\s\S]*?)<\/svg>/.exec(page.html)!;
    expect(page.html.indexOf(overlay[0])).toBeGreaterThan(page.html.indexOf("<img "));
    const circles = [...overlay[1].matchAll(/<circle cx="(\d+)" cy="(\d+)" r="(\d+)"[^>]*stroke-dasharray="[^"]+"/g)].map((m) => m.slice(1).map(Number));
    expect(circles).toEqual([
      [207, 362, 160],
      [207, 362, 176],
      [244, 409, 187],
      [244, 409, 203],
    ]);
    expect(overlay[1]).toContain(">desktop</text>");
    expect(overlay[1]).toContain(">ios</text>");
    // Without --zones, no overlay.
    expect(pngPage({ width: 1584, height: 396 }, { width: 792 }).html).not.toContain("<svg");
  });

  test("Zones on another size", async () => {
    const ws = workspace();
    writeFileSync(join(ws.root, "avatar.svg"), svgOfSize(500, 500));
    expect(await ws.run(["avatar.svg", "--out", "avatar.png", "--zones"], { width: 500, height: 500 })).toBe(1);
    expect(ws.err).toEqual(["--zones is for a 1584x396 LinkedIn banner, found 500x500", PNG_USAGE]);
    expect(ws.calls).toEqual([]);
    expect(readdirSync(ws.root)).toEqual(["avatar.svg"]);
  });
});

describe("PNG render", () => {
  test("Page on a ground", () => {
    const page = pngPage({ width: 1584, height: 396 }, { width: 792, ground: "#1B1D24", zones: true });
    expect([page.width, page.height]).toEqual([840, 246]);
    expect(page.image).toEqual({ x: 24, y: 24, width: 792, height: 198 });
    expect(page.html).toContain('<body style="margin:0;background:#1B1D24">');
    expect(page.html).toMatch(/<img src="image.svg" width="792" height="198" style="[^"]*left:24px;top:24px/);
    expect(page.html).toMatch(/<svg [^>]*viewBox="0 0 1584 396" width="792" height="198" style="position:absolute;left:24px;top:24px"/);
  });

  test("Own size by default", () => {
    const page = pngPage({ width: 500, height: 500 });
    expect([page.width, page.height]).toEqual([500, 500]);
    expect(page.html).toContain('<body style="margin:0">');
    expect(page.html).toContain('<img src="image.svg" width="500" height="500"');
    // --width rounds the height.
    expect(pngPage({ width: 1584, height: 396 }, { width: 1000 }).height).toBe(250);
  });

  test("PNG size read", async () => {
    expect(pngSize(pngOf(1584, 309))).toEqual({ width: 1584, height: 309 });
    expect(pngSize(Buffer.from("<svg/>"))).toBeUndefined();
    expect(pngProblem(pngOf(1584, 309), { width: 1584, height: 396 })).toBe("the browser wrote 1584x309, expected 1584x396");
    expect(pngProblem(Buffer.from("not a png at all, not a png at all"), { width: 1, height: 1 })).toBe("the browser did not write a PNG");
    const ws = workspace();
    writeFileSync(join(ws.root, "banner.svg"), svgOfSize(1584, 396));
    writeFileSync(join(ws.root, "banner.png"), "old");
    expect(await ws.run(["banner.svg", "--out", "banner.png"], { width: 1584, height: 309 })).toBe(1);
    expect(ws.err).toEqual(["cannot render banner.png: the browser wrote 1584x309, expected 1584x396"]);
    expect(readFileSync(join(ws.root, "banner.png"), "utf8")).toBe("old");
    expect(readdirSync(ws.root).sort()).toEqual(["banner.png", "banner.svg"]);
  });

  test("PNG written through a rename, temporary folder removed", async () => {
    const ws = workspace();
    writeFileSync(join(ws.root, "banner.svg"), svgOfSize(1584, 396));
    expect(await ws.run(["banner.svg", "--out", "banner.png", "--width", "792", "--ground", "#f6f3ec", "--zones"], { width: 840, height: 246 })).toBe(0);
    expect(ws.out).toEqual(["wrote banner.png (840x246)"]);
    expect(pngSize(readFileSync(join(ws.root, "banner.png")))).toEqual({ width: 840, height: 246 });
    expect(readdirSync(ws.root).sort()).toEqual(["banner.png", "banner.svg"]);
    const folder = ws.calls[0].find((a) => a.startsWith("--user-data-dir="))!.slice("--user-data-dir=".length, -"/profile".length);
    expect(() => readdirSync(folder)).toThrow();
  });

  test("Browser failure", async () => {
    const ws = workspace();
    writeFileSync(join(ws.root, "a.svg"), svgOfSize(500, 500));
    // The stand-in browser writes nothing.
    expect(await ws.run(["a.svg", "--out", "a.png"])).toBe(1);
    expect(ws.err).toEqual(["cannot render a.png: the browser wrote no screenshot"]);
    expect(readdirSync(ws.root)).toEqual(["a.svg"]);
  });
});

describe("Browser for the PNG script", () => {
  test("Browser arguments", () => {
    const args = browserArgs("/tmp/png-x", { width: 840, height: 246 });
    expect(args).toContain("--headless");
    expect(args).toContain("--user-data-dir=/tmp/png-x/profile");
    expect(args).toContain("--force-device-scale-factor=1");
    expect(args).toContain("--window-size=840,246");
    expect(args).toContain("--host-resolver-rules=MAP * ~NOTFOUND");
    expect(args).toContain("--screenshot=/tmp/png-x/image.png");
    expect(args.at(-1)).toBe("file:///tmp/png-x/page.html");
    expect(args).not.toContain("--no-sandbox");
  });

  test("Lookup order", () => {
    const present = new Set([MAC_BROWSERS[0], "/usr/bin/chromium"]);
    const isFile = (path: string) => present.has(path);
    expect(findBrowser({ PATH: "/usr/bin" }, isFile)).toBe(MAC_BROWSERS[0]);
    expect(findBrowser({ PATH: "/usr/bin" }, (path) => path === "/usr/bin/chromium")).toBe("/usr/bin/chromium");
    expect(findBrowser({ PATH: "/usr/bin", BRUNOSOUZAS_CHROME: "/usr/bin/chromium" }, isFile)).toBe("/usr/bin/chromium");
    expect(findBrowser({ PATH: "/usr/bin" }, () => false)).toBeUndefined();
  });

  test("No browser", async () => {
    expect(findBrowser({ BRUNOSOUZAS_CHROME: "/nowhere/chrome" }, (path) => path === MAC_BROWSERS[0])).toBeUndefined();
    const ws = workspace();
    writeFileSync(join(ws.root, "a.svg"), svgOfSize(500, 500));
    expect(await ws.run(["a.svg", "--out", "a.png"], { width: 500, height: 500 }, { BRUNOSOUZAS_CHROME: "/nowhere/chrome" })).toBe(1);
    expect(ws.err).toEqual([NO_BROWSER]);
    expect(NO_BROWSER).toBe("npm run png needs Google Chrome or Chromium: set BRUNOSOUZAS_CHROME to its executable");
    expect(ws.calls).toEqual([]);
    expect(readdirSync(ws.root)).toEqual(["a.svg"]);
  });
});

describe("PNG script arguments", () => {
  test("Argument problems", async () => {
    const problem = (args: string[]) => {
      const parsed = parsePngArgs(args);
      return parsed.ok ? undefined : parsed.problem;
    };
    expect(problem(["a.svg"])).toBe("missing --out <file.png>");
    expect(problem(["a.png", "--out", "b.png"])).toBe("the input must be an .svg file, found a.png");
    expect(problem(["a.svg", "--out", "b.jpg"])).toBe("the output must be a .png file, found b.jpg");
    for (const width of ["0", "-5", "1.5", "big", "10001"]) expect(problem(["a.svg", "--out", "b.png", "--width", width])).toMatch(/^--width expects a whole number of pixels from 1 to 10000, found /);
    expect(problem(["a.svg", "--out", "b.png", "--width"])).toBe("--width needs a value");
    for (const ground of ["black", "#123", "#12345G"]) expect(problem(["a.svg", "--out", "b.png", "--ground", ground])).toBe(`--ground expects a colour such as #1B1D24, found ${ground}`);
    expect(problem(["a.svg", "--out", "b.png", "--png"])).toBe("unknown option --png");
    expect(problem(["--out", "b.png"])).toBe("expected one <file.svg>");
    expect(parsePngArgs(["a.svg", "--zones", "--out", "b.png", "--width", "792", "--ground", "#1b1d24"])).toEqual({ ok: true, value: { svg: "a.svg", out: "b.png", width: 792, ground: "#1B1D24", zones: true } });
    const ws = workspace();
    expect(await ws.run(["a.svg"])).toBe(1);
    expect(ws.err).toEqual(["missing --out <file.png>", PNG_USAGE]);
    expect(readdirSync(ws.root)).toEqual([]);
  });

  test("SVG size read", () => {
    expect(svgSize(svgOfSize(1584, 396))).toEqual({ width: 1584, height: 396 });
    expect(svgSize('<svg viewBox="0 0 10 10"/>')).toBeUndefined();
  });
});

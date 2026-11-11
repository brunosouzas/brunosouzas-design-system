// `npm run png -- <file.svg> --out <file.png> [--width <px>] [--ground <#rrggbb>] [--zones]`
// (spec cover-cli, "PNG script outside the package", "PNG render", "Browser for
// the PNG script", "Photo zones overlay"; change presence-formats design §6): a
// repository script, not compiled into the package and not a bin, that shows a
// written SVG through one `<img>` in headless Chrome and saves the screenshot.
// Chrome is the renderer ADR 0008 names for written images: it honours the
// embedded faces. No npm dependency; the PNG header is read with node:fs.
//
// `--width` shows the image smaller (the height follows, rounded), `--ground`
// puts it on a page of that colour with a 24 px margin, and `--zones` (a
// 1584x396 LinkedIn banner only) draws LinkedIn's profile photo zones over it,
// in the page, never in the image.
//
// What can go wrong: a bad argument prints the problem with the usage; no
// browser, a browser that fails, times out (60 s) or writes the wrong size
// prints `cannot render <file.png>: <reason>`. Each exits 1 and leaves the
// target as it was; the temporary folder is removed in every case.
import { execFile as nodeExecFile } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, delimiter, dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { tokens } from "../tokens/generated/tokens.ts";
import { LINKEDIN_BANNER_HEIGHT, LINKEDIN_BANNER_WIDTH, LINKEDIN_PHOTO_ZONES } from "../src/pieces/cover.ts";

export const PNG_USAGE = "usage: npm run png -- <file.svg> --out <file.png> [--width <px>] [--ground <#rrggbb>] [--zones]";
export const NO_BROWSER = "npm run png needs Google Chrome or Chromium: set BRUNOSOUZAS_CHROME to its executable";
/** The page's margin around the image on a `--ground`. */
export const GROUND_MARGIN = 24;
/** The browser is stopped after this long. */
export const BROWSER_TIMEOUT_MS = 60_000;
const MAX_WIDTH = 10_000;
const HEX = /^#[0-9A-Fa-f]{6}$/;

export type PngArgs = { svg: string; out: string; width?: number; ground?: string; zones: boolean };

/** The arguments, or the first problem (printed with the usage). */
export const parsePngArgs = (args: string[]): { ok: true; value: PngArgs } | { ok: false; problem: string } => {
  const inputs: string[] = [];
  const values: Record<"--out" | "--width" | "--ground", string[]> = { "--out": [], "--width": [], "--ground": [] };
  let zones = 0;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--out" || arg === "--width" || arg === "--ground") {
      const value = args[i + 1];
      if (value === undefined || value.startsWith("--")) return { ok: false, problem: `${arg} needs a value` };
      values[arg].push(value);
      i++;
    } else if (arg === "--zones") zones++;
    else if (arg.startsWith("--")) return { ok: false, problem: `unknown option ${arg}` };
    else inputs.push(arg);
  }
  for (const [name, list] of Object.entries(values)) if (list.length > 1) return { ok: false, problem: `${name} given more than once` };
  if (zones > 1) return { ok: false, problem: "--zones given more than once" };
  if (inputs.length !== 1) return { ok: false, problem: inputs.length === 0 ? "expected one <file.svg>" : "expected one <file.svg>, found several" };
  const [svg] = inputs;
  if (!svg.endsWith(".svg")) return { ok: false, problem: `the input must be an .svg file, found ${svg}` };
  const [out] = values["--out"];
  if (out === undefined) return { ok: false, problem: "missing --out <file.png>" };
  if (!out.endsWith(".png")) return { ok: false, problem: `the output must be a .png file, found ${out}` };
  const value: PngArgs = { svg, out, zones: zones === 1 };
  const [width] = values["--width"];
  if (width !== undefined) {
    const n = Number(width);
    if (!/^\d+$/.test(width) || n < 1 || n > MAX_WIDTH) return { ok: false, problem: `--width expects a whole number of pixels from 1 to ${MAX_WIDTH}, found ${width}` };
    value.width = n;
  }
  const [ground] = values["--ground"];
  if (ground !== undefined) {
    if (!HEX.test(ground)) return { ok: false, problem: `--ground expects a colour such as #1B1D24, found ${ground}` };
    value.ground = ground.toUpperCase();
  }
  return { ok: true, value };
};

/** The root `<svg>`'s own width and height, or undefined. */
export const svgSize = (text: string): { width: number; height: number } | undefined => {
  const tag = /<svg\b[^>]*>/.exec(text)?.[0];
  if (tag === undefined) return undefined;
  const read = (name: string) => {
    const found = new RegExp(`\\s${name}="([\\d.]+)"`).exec(tag)?.[1];
    return found === undefined ? undefined : Number(found);
  };
  const width = read("width");
  const height = read("height");
  return width && height ? { width, height } : undefined;
};

export type Page = { html: string; width: number; height: number; image: { x: number; y: number; width: number; height: number } };

/** The zones overlay: each zone's photo circle (dashed ink) and safe circle (dashed accent), named, in banner units. */
const zonesOverlay = (x: number, y: number, width: number, height: number): string => {
  const circles = LINKEDIN_PHOTO_ZONES.flatMap((zone) => [
    `<circle cx="${zone.cx}" cy="${zone.cy}" r="${zone.r}" fill="none" stroke="${tokens.color.ink}" stroke-width="3" stroke-dasharray="12 8"/>`,
    `<circle cx="${zone.cx}" cy="${zone.cy}" r="${zone.safeRadius}" fill="none" stroke="${tokens.illustration.accent}" stroke-width="3" stroke-dasharray="12 8"/>`,
  ]);
  // Each name above its safe circle, the second one line lower so the two do not overlap.
  const names = LINKEDIN_PHOTO_ZONES.map(
    (zone, i) =>
      `<text x="${zone.cx + (i === 0 ? -40 : 40)}" y="${zone.cy - zone.safeRadius - 10}" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="700" fill="${tokens.color.ink}" stroke="${tokens.color.white}" stroke-width="4" paint-order="stroke">${zone.name}</text>`,
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LINKEDIN_BANNER_WIDTH} ${LINKEDIN_BANNER_HEIGHT}" width="${width}" height="${height}" style="position:absolute;left:${x}px;top:${y}px">${[...circles, ...names].join("")}</svg>`;
};

/** The page that shows `image.svg` at its size (or `width`), on a `ground` with a margin, with the zones if asked. */
export const pngPage = (size: { width: number; height: number }, options: { width?: number; ground?: string; zones?: boolean } = {}): Page => {
  const width = options.width ?? size.width;
  const height = options.width === undefined ? size.height : Math.round((size.height * options.width) / size.width);
  const margin = options.ground === undefined ? 0 : GROUND_MARGIN;
  const image = { x: margin, y: margin, width, height };
  const body = `margin:0${options.ground === undefined ? "" : `;background:${options.ground}`}`;
  const img = `<img src="image.svg" width="${width}" height="${height}" style="display:block;position:absolute;left:${margin}px;top:${margin}px">`;
  const html = [
    "<!doctype html>",
    `<html><head><meta charset="utf-8"><title>png</title></head><body style="${body}">`,
    img,
    ...(options.zones ? [zonesOverlay(margin, margin, width, height)] : []),
    "</body></html>",
    "",
  ].join("\n");
  return { html, width: width + 2 * margin, height: height + 2 * margin, image };
};

/** The problem of `--zones` on another size, or undefined. */
export const zonesProblem = (size: { width: number; height: number }): string | undefined =>
  size.width === LINKEDIN_BANNER_WIDTH && size.height === LINKEDIN_BANNER_HEIGHT ? undefined : `--zones is for a ${LINKEDIN_BANNER_WIDTH}x${LINKEDIN_BANNER_HEIGHT} LinkedIn banner, found ${size.width}x${size.height}`;

/** The browser's argument list: a fresh profile, device scale 1, the page's window, no host resolved. Never --no-sandbox. */
export const browserArgs = (folder: string, page: { width: number; height: number }): string[] => [
  "--headless",
  "--disable-gpu",
  "--hide-scrollbars",
  "--no-first-run",
  "--no-default-browser-check",
  `--user-data-dir=${join(folder, "profile")}`,
  "--force-device-scale-factor=1",
  `--window-size=${page.width},${page.height}`,
  "--host-resolver-rules=MAP * ~NOTFOUND",
  `--screenshot=${join(folder, "image.png")}`,
  pathToFileURL(join(folder, "page.html")).href,
];

export const MAC_BROWSERS = ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium"];
export const PATH_BROWSERS = ["google-chrome", "chromium"];

/** The browser to start: BRUNOSOUZAS_CHROME when set (even if missing), else the macOS apps, else PATH. */
export const findBrowser = (env: Record<string, string | undefined>, isFile: (path: string) => boolean): string | undefined => {
  const chosen = env.BRUNOSOUZAS_CHROME;
  if (chosen !== undefined && chosen !== "") return isFile(chosen) ? chosen : undefined;
  for (const path of MAC_BROWSERS) if (isFile(path)) return path;
  const dirs = (env.PATH ?? "").split(delimiter).filter((dir) => dir !== "");
  for (const name of PATH_BROWSERS) for (const dir of dirs) if (isFile(join(dir, name))) return join(dir, name);
  return undefined;
};

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
/** A PNG's size from its IHDR chunk, or undefined when the bytes are not a PNG. */
export const pngSize = (bytes: Buffer): { width: number; height: number } | undefined => {
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(SIGNATURE) || bytes.toString("latin1", 12, 16) !== "IHDR") return undefined;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
};

/** The problem of the browser's output against the page's size, or undefined. */
export const pngProblem = (bytes: Buffer, expected: { width: number; height: number }): string | undefined => {
  const size = pngSize(bytes);
  if (size === undefined) return "the browser did not write a PNG";
  if (size.width !== expected.width || size.height !== expected.height) return `the browser wrote ${size.width}x${size.height}, expected ${expected.width}x${expected.height}`;
  return undefined;
};

type Exec = (file: string, args: string[], options: { timeout: number }) => Promise<void>;
const execBrowser: Exec = (file, args, options) =>
  new Promise((done, fail) => {
    nodeExecFile(file, args, { timeout: options.timeout, maxBuffer: 16 * 1024 * 1024 }, (error) => (error ? fail(error) : done()));
  });
const isFile = (path: string) => existsSync(path) && statSync(path).isFile();

export type PngIo = { cwd: string; log: (line: string) => void; error: (line: string) => void };
export type PngDeps = { env?: Record<string, string | undefined>; isFile?: (path: string) => boolean; exec?: Exec };

export const runPng = async (args: string[], io: PngIo, deps: PngDeps = {}): Promise<number> => {
  const usage = (problem: string) => {
    io.error(problem);
    io.error(PNG_USAGE);
    return 1;
  };
  const parsed = parsePngArgs(args);
  if (!parsed.ok) return usage(parsed.problem);
  const { svg, out, width, ground, zones } = parsed.value;
  const cannot = (reason: string) => {
    io.error(`cannot render ${out}: ${reason}`);
    return 1;
  };
  const source = resolve(io.cwd, svg);
  if (!isFile(source)) return usage(`no such file: ${svg}`);
  const text = readFileSync(source, "utf8");
  const size = svgSize(text);
  if (size === undefined) return cannot(`${svg} has no root width and height`);
  if (zones) {
    const problem = zonesProblem(size);
    if (problem !== undefined) return usage(problem);
  }
  const target = resolve(io.cwd, out);
  if (!existsSync(dirname(target)) || !statSync(dirname(target)).isDirectory()) return usage(`the output folder does not exist: ${dirname(out)}`);
  const browser = findBrowser(deps.env ?? process.env, deps.isFile ?? isFile);
  if (browser === undefined) {
    io.error(NO_BROWSER);
    return 1;
  }
  const page = pngPage(size, { width, ground, zones });
  const folder = mkdtempSync(join(tmpdir(), "brunosouzas-png-"));
  const partial = join(dirname(target), `.${basename(target)}.${process.pid}.tmp`);
  try {
    writeFileSync(join(folder, "image.svg"), text);
    writeFileSync(join(folder, "page.html"), page.html);
    try {
      await (deps.exec ?? execBrowser)(browser, browserArgs(folder, page), { timeout: BROWSER_TIMEOUT_MS });
    } catch (error) {
      const killed = typeof error === "object" && error !== null && "killed" in error && (error as { killed?: boolean }).killed;
      return cannot(killed ? `the browser did not finish in ${BROWSER_TIMEOUT_MS / 1000} s` : `the browser failed: ${error instanceof Error ? error.message.split("\n")[0] : String(error)}`);
    }
    const shot = join(folder, "image.png");
    if (!existsSync(shot)) return cannot("the browser wrote no screenshot");
    const bytes = readFileSync(shot);
    const problem = pngProblem(bytes, page);
    if (problem !== undefined) return cannot(problem);
    writeFileSync(partial, bytes);
    renameSync(partial, target);
  } finally {
    rmSync(partial, { force: true });
    rmSync(folder, { recursive: true, force: true });
  }
  io.log(`wrote ${out} (${page.width}x${page.height})`);
  return 0;
};

const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  process.exitCode = await runPng(process.argv.slice(2), { cwd: process.env.INIT_CWD ?? process.cwd(), log: console.log, error: console.error });
}

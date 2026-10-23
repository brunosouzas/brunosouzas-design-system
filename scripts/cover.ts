#!/usr/bin/env node
// `npm run cover -- <spec.json> --out <file.svg>`, installed as the bin
// `brunosouzas-cover` (spec cover-cli; design §6):
// builds one blog cover from a cover spec kept with its article in the vault.
//
// Why: covers were drawn by hand and drifted; a spec plus the shared pieces
// makes every cover reproducible, and only the pieces live in this public
// repository.
//
// What can go wrong: a bad invocation reports its first problem with the
// usage; an invalid spec reports every problem by JSON path. In both cases the
// command exits 1 and writes nothing. An existing output file is replaced.
import { closeSync, existsSync, openSync, readFileSync, realpathSync, renameSync, rmSync, statSync, writeSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { coverTree, validateCoverSpec, type CoverSpec } from "../src/pieces/cover.ts";
import { toSvg } from "../src/pieces/render.ts";

export const COVER_USAGE = "usage: npm run cover -- <spec.json> --out <file.svg>";

export type CoverIo = { cwd: string; log: (line: string) => void; error: (line: string) => void };

/** The first invocation problem, in the order of the spec, or the two paths. */
export const parseCoverArgs = (args: string[], cwd: string): { ok: true; spec: string; out: string } | { ok: false; problem: string } => {
  const specs: string[] = [];
  const outs: string[] = [];
  let unknown: string | undefined;
  let outWithoutValue = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--out") {
      const value = args[i + 1];
      if (value === undefined || value.startsWith("--")) outWithoutValue = true;
      else {
        outs.push(value);
        i++;
      }
    } else if (arg.startsWith("-")) unknown ??= arg;
    else specs.push(arg);
  }
  if (unknown !== undefined) return { ok: false, problem: `unknown option ${unknown}` };
  if (outWithoutValue) return { ok: false, problem: "--out needs a value: <file.svg>" };
  if (outs.length === 0) return { ok: false, problem: "--out <file.svg> is required" };
  if (outs.length > 1) return { ok: false, problem: "--out given more than once" };
  const out = outs[0];
  if (!out.endsWith(".svg")) return { ok: false, problem: `the output must be an .svg file, found ${out}` };
  const folder = dirname(resolve(cwd, out));
  if (!existsSync(folder) || !statSync(folder).isDirectory()) return { ok: false, problem: `the output folder does not exist: ${dirname(out)}` };
  const target = resolve(cwd, out);
  if (existsSync(target) && statSync(target).isDirectory()) return { ok: false, problem: `the output is a folder: ${out}` };
  if (specs.length === 0) return { ok: false, problem: "missing the cover spec: <spec.json>" };
  if (specs.length > 1) return { ok: false, problem: `one cover spec at a time, found ${specs.length}` };
  return { ok: true, spec: specs[0], out };
};

/** Parses the spec text; a syntax error names the line and column. */
const parseJson = (text: string, label: string): { value: unknown } | { problem: string } => {
  try {
    return { value: JSON.parse(text) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const lineColumn = /line (\d+) column (\d+)/.exec(message);
    const position = /position (\d+)/.exec(message);
    let where = "";
    if (lineColumn) where = ` at line ${lineColumn[1]}, column ${lineColumn[2]}`;
    else if (position) {
      const before = text.slice(0, Number(position[1])).split("\n");
      where = ` at line ${before.length}, column ${before[before.length - 1].length + 1}`;
    }
    return { problem: `${label}: invalid JSON${where} (${message})` };
  }
};

/** Builds the cover text for a spec file's contents, or the problem lines. */
export const buildCover = (text: string, label: string): { ok: true; svg: string } | { ok: false; lines: string[] } => {
  const parsed = parseJson(text, label);
  if ("problem" in parsed) return { ok: false, lines: [parsed.problem] };
  const problems = validateCoverSpec(parsed.value);
  if (problems.length > 0) return { ok: false, lines: problems.map((p) => `${p.path}: ${p.message}`) };
  return { ok: true, svg: `${toSvg(coverTree(parsed.value as CoverSpec))}\n` };
};

export const runCover = (args: string[], io: CoverIo): number => {
  const invocation = parseCoverArgs(args, io.cwd);
  if (!invocation.ok) {
    io.error(invocation.problem);
    io.error(COVER_USAGE);
    return 1;
  }
  const specPath = resolve(io.cwd, invocation.spec);
  let text: string;
  try {
    text = readFileSync(specPath, "utf8");
  } catch (error) {
    io.error(`cannot read ${invocation.spec}: ${error instanceof Error ? error.message : String(error)}`);
    io.error(COVER_USAGE);
    return 1;
  }
  const result = buildCover(text, invocation.spec);
  if (!result.ok) {
    for (const line of result.lines) io.error(line);
    io.error(`cover: ${result.lines.length} problem(s) in ${invocation.spec}; no file written`);
    return 1;
  }
  // Write beside the target and rename, so a failed write never leaves half a cover.
  const target = resolve(io.cwd, invocation.out);
  // Unpredictable name, created exclusively ("wx"): never follows or reuses an existing path.
  const temporary = `${target}.${randomUUID()}.tmp`;
  let created = false;
  try {
    const fd = openSync(temporary, "wx");
    created = true; // ours from here on: remove it on any later failure
    try {
      writeSync(fd, result.svg);
    } finally {
      closeSync(fd);
    }
    renameSync(temporary, target);
  } catch (error) {
    if (created) rmSync(temporary, { force: true });
    io.error(`cannot write ${invocation.out}: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
  io.log(`wrote ${invocation.out}`);
  return 0;
};

// Real paths on both sides: an installed bin is a symlink in node_modules/.bin.
const isMain = (() => {
  if (process.argv[1] === undefined) return false;
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
  } catch {
    return false;
  }
})();
if (isMain) {
  process.exitCode = runCover(process.argv.slice(2), { cwd: process.env.INIT_CWD ?? process.cwd(), log: console.log, error: console.error });
}

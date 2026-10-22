// Shared command-line plumbing of `npm run stills` and `npm run render`
// (design §7): argument parsing, scene lookup, the command type and the
// injectable runner that executes commands one at a time.
//
// Why a runner is injected: the tests replace it with a fake that writes the
// expected files, so ordering, stop-on-failure and printed lines are proven
// without rendering. The default runner spawns `npx` in the repository root.
//
// What can go wrong: a bad invocation exits 1 before anything is written,
// reporting only the first problem (unknown option, repeated --dry-run, more
// than one name, missing name, unknown scene) with the usage and the scenes.
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { SceneData } from "../src/scenes/catalogue";

export const DRY_RUN = "--dry-run";

/** One external command; `output` is the media file it writes, relative to the repository. */
export type Command = {
  kind: "render" | "encode" | "still";
  composition: string;
  frame?: number;
  output: string;
  program: "npx";
  args: string[];
};

export const formatCommand = (command: Command): string => [command.program, ...command.args].join(" ");

/** Runs one command in `cwd` and resolves with its exit code. */
export type Runner = (command: Command, cwd: string) => Promise<number>;

export const spawnRunner: Runner = (command, cwd) =>
  new Promise((resolve) => {
    const child = spawn(command.program, command.args, { cwd, stdio: "inherit" });
    child.on("error", (error) => {
      console.error(`cannot start ${command.program}: ${error.message}`);
      resolve(127);
    });
    child.on("close", (code) => resolve(code ?? 1));
  });

export type Io = {
  /** Repository root: commands run here and every output path is relative to it. */
  root: string;
  runner: Runner;
  log: (line: string) => void;
  error: (line: string) => void;
  /** Milliseconds, for the elapsed time of a render. */
  now: () => number;
};

export const repositoryRoot = (): string => join(dirname(fileURLToPath(import.meta.url)), "..");

export const defaultIo = (): Io => ({
  root: repositoryRoot(),
  runner: spawnRunner,
  log: (line) => console.log(line),
  error: (line) => console.error(line),
  now: () => Date.now(),
});

export type Invocation = { ok: true; scene: SceneData; dryRun: boolean } | { ok: false; problem: string };

/** Parses `<scene> [--dry-run]` in any order; reports only the first problem, in the spec's order. */
export const parseInvocation = (argv: readonly string[], scenes: readonly SceneData[]): Invocation => {
  const options = argv.filter((arg) => arg.startsWith("-"));
  const names = argv.filter((arg) => !arg.startsWith("-"));
  const unknown = options.find((option) => option !== DRY_RUN);
  if (unknown !== undefined) return { ok: false, problem: `unknown option: ${unknown}` };
  if (options.length > 1) return { ok: false, problem: `${DRY_RUN} given more than once` };
  if (names.length > 1) return { ok: false, problem: `only one scene is accepted, got: ${names.join(" ")}` };
  if (names.length === 0) return { ok: false, problem: "missing scene name" };
  const scene = scenes.find((candidate) => candidate.id === names[0]);
  if (!scene) return { ok: false, problem: `unknown scene: ${names[0]}` };
  return { ok: true, scene, dryRun: options.length === 1 };
};

/** Prints a bad invocation's problem, the usage and the available scenes. */
export const reportInvocationProblem = (problem: string, tool: "stills" | "render", scenes: readonly SceneData[], io: Io): number => {
  io.error(`error: ${problem}`);
  io.error(`usage: npm run ${tool} -- <scene> [${DRY_RUN}]`);
  io.error(`available scenes: ${scenes.map((scene) => scene.id).join(", ")}`);
  return 1;
};

export const isMainModule = (moduleUrl: string): boolean =>
  process.argv[1] !== undefined && moduleUrl === pathToFileURL(process.argv[1]).href;

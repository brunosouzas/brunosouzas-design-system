// `npm run render -- <scene> [--dry-run]`: renders every composition of a scene
// to out/master/<id>.mp4 (H.264, hardware encoder when available), then
// re-encodes it with Remotion's bundled ffmpeg to out/web/<id>.mp4 (x264 CRF 30,
// yuv420p, fast start, no audio). Order: 16x9-pt, 16x9-en, 4x5-pt, 4x5-en, each
// rendered and encoded before the next; one progress line per composition.
//
// Why two files: the hardware master renders fast but is large (~28 MB for
// 33 s); the web copy (~1 MB) is what a page should load. The bundled ffmpeg
// means nothing outside `npm ci` is needed.
//
// Rendering again overwrites (`--overwrite`, `-y`). --dry-run prints the eight
// commands and touches nothing. What can go wrong: a failed render or encode
// stops the run (exit 1) naming the composition; finished files stay. Remotion
// needs the network on first use (headless browser) and on every render (Lato).
import { existsSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { compositionsOf, type SceneData } from "../src/scenes/catalogue";
import { scenes } from "../src/scenes";
import {
  defaultIo,
  formatCommand,
  isMainModule,
  outputOutsideOut,
  parseInvocation,
  reportInvocationProblem,
  type Command,
  type Io,
} from "./cli";

export const masterPath = (compositionId: string): string => `out/master/${compositionId}.mp4`;
export const webPath = (compositionId: string): string => `out/web/${compositionId}.mp4`;

/** Render then encode, per composition, in catalogue order. */
export const renderCommands = (scene: SceneData): Command[] =>
  compositionsOf(scene).flatMap(({ id }) => [
    {
      kind: "render" as const,
      composition: id,
      output: masterPath(id),
      program: "npx" as const,
      args: [
        "remotion",
        "render",
        "src/index.ts",
        id,
        masterPath(id),
        "--codec=h264",
        "--hardware-acceleration=if-possible",
        "--overwrite",
        "--log=error",
      ],
    },
    {
      kind: "encode" as const,
      composition: id,
      output: webPath(id),
      program: "npx" as const,
      args: [
        "remotion",
        "ffmpeg",
        "-v",
        "error",
        "-y",
        "-i",
        masterPath(id),
        "-c:v",
        "libx264",
        "-crf",
        "30",
        "-preset",
        "slow",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        "-an",
        webPath(id),
      ],
    },
  ]);

export const formatSize = (bytes: number): string => {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
};

export const runRender = async (argv: readonly string[], io: Io): Promise<number> => {
  const invocation = parseInvocation(argv, scenes);
  if (!invocation.ok) return reportInvocationProblem(invocation.problem, "render", scenes, io);
  const commands = renderCommands(invocation.scene);
  const outside = outputOutsideOut(io.root, commands);
  if (outside !== null) {
    io.error(`error: refusing to run: ${outside} is not inside out/`);
    return 1;
  }
  if (invocation.dryRun) {
    for (const command of commands) io.log(formatCommand(command));
    return 0;
  }
  mkdirSync(join(io.root, "out", "master"), { recursive: true });
  mkdirSync(join(io.root, "out", "web"), { recursive: true });
  for (const { id } of compositionsOf(invocation.scene)) {
    const started = io.now();
    for (const command of commands.filter((candidate) => candidate.composition === id)) {
      const code = await io.runner(command, io.root);
      if (code !== 0) {
        io.error(`error: ${command.kind} failed: ${id} (exit code ${code})`);
        return 1;
      }
      if (!existsSync(join(io.root, command.output))) {
        io.error(`error: ${command.kind} of ${id} exited 0 but ${command.output} is missing`);
        return 1;
      }
    }
    const seconds = Math.round((io.now() - started) / 1000);
    const master = statSync(join(io.root, masterPath(id))).size;
    const web = statSync(join(io.root, webPath(id))).size;
    io.log(`${id}: ${seconds} s, master ${formatSize(master)}, web ${formatSize(web)}`);
  }
  return 0;
};

if (isMainModule(import.meta.url)) {
  process.exitCode = await runRender(process.argv.slice(2), defaultIo());
}

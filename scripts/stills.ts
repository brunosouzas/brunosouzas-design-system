// `npm run stills -- <scene> [--dry-run]`: renders the key frames of every
// composition of a scene for review, one PNG per phase (at the phase's `to`
// frame) plus the last frame, to out/stills/<composition-id>/<frame>.png.
//
// Why: the owner reviews layout and contrast on stills before any video is
// rendered (motion skill, "stills before animation").
//
// Each composition's folder is emptied before its stills, so stills of an
// earlier timeline do not linger. --dry-run prints the commands and touches
// nothing. What can go wrong: a failed still stops the run (exit 1) naming the
// composition and frame; stills already written stay. Remotion needs the
// network on first use (headless browser) and on every render (Lato).
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { compositionsOf, type CatalogueScene } from "../src/scenes/catalogue";
import { scenes } from "../src/scenes";
import {
  defaultIo,
  formatCommand,
  isInsideOut,
  isMainModule,
  outputOutsideOut,
  parseInvocation,
  reportInvocationProblem,
  type Command,
  type Io,
} from "./cli";

export const stillsFolder = (compositionId: string): string => `out/stills/${compositionId}`;

/** Frames reviewed per composition: every phase's end and the last frame. */
export const stillFrames = (scene: CatalogueScene): number[] =>
  [...new Set([...scene.timeline.phases.map((phase) => phase.to), scene.timeline.duration - 1])].sort((a, b) => a - b);

export const stillCommands = (scene: CatalogueScene): Command[] =>
  compositionsOf(scene).flatMap((composition) =>
    stillFrames(scene).map((frame) => {
      const output = `${stillsFolder(composition.id)}/${frame}.png`;
      return {
        kind: "still" as const,
        composition: composition.id,
        frame,
        output,
        program: "npx" as const,
        args: ["remotion", "still", "src/index.ts", composition.id, output, `--frame=${frame}`, "--overwrite", "--log=error"],
      };
    }),
  );

export const runStills = async (argv: readonly string[], io: Io): Promise<number> => {
  const invocation = parseInvocation(argv, scenes);
  if (!invocation.ok) return reportInvocationProblem(invocation.problem, "stills", scenes, io);
  const commands = stillCommands(invocation.scene);
  const outside = outputOutsideOut(io.root, commands);
  if (outside !== null) {
    io.error(`error: refusing to run: ${outside} is not inside out/`);
    return 1;
  }
  if (invocation.dryRun) {
    for (const command of commands) io.log(formatCommand(command));
    return 0;
  }
  for (const composition of compositionsOf(invocation.scene)) {
    // The folder that is emptied must itself sit inside out/ (checked again, right before the deletion).
    if (!isInsideOut(io.root, stillsFolder(composition.id))) {
      io.error(`error: refusing to empty ${stillsFolder(composition.id)}: not inside out/`);
      return 1;
    }
    const folder = join(io.root, stillsFolder(composition.id));
    rmSync(folder, { recursive: true, force: true });
    mkdirSync(folder, { recursive: true });
    for (const command of commands.filter((candidate) => candidate.composition === composition.id)) {
      const code = await io.runner(command, io.root);
      if (code !== 0) {
        io.error(`error: still failed: ${command.composition} frame ${command.frame} (exit code ${code})`);
        return 1;
      }
      io.log(command.output);
    }
  }
  return 0;
};

if (isMainModule(import.meta.url)) {
  process.exitCode = await runStills(process.argv.slice(2), defaultIo());
}

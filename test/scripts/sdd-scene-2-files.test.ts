// The stills and render commands for the SDD files scene (spec
// scene-rendering, "SDD files stills through existing commands", "SDD files
// master and web copy"; change sdd-scene-2-files, task 5.1). The injected
// runner writes fixture files, never render evidence; temporary roots are
// removed after each test.
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, expect, test } from "vitest";
import { formatCommand, type Command, type Io } from "../../scripts/cli";
import { renderCommands, runRender } from "../../scripts/render";
import { runStills, stillCommands } from "../../scripts/stills";
import { sddScene2Files as scene } from "../../src/scenes/sdd-scene-2-files/scene.ts";

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
const harness = (failure: (c: Command) => boolean = () => false) => {
  const root = mkdtempSync(join(tmpdir(), "files-")); roots.push(root);
  const ran: Command[] = [], out: string[] = [], err: string[] = [];
  const io: Io = { root, now: () => 0, log: (s) => out.push(s), error: (s) => err.push(s), runner: async (c, cwd) => {
    expect(cwd).toBe(root); ran.push(c); if (failure(c)) return 1;
    const path = join(root, c.output); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, `fixture ${c.kind}`); return 0;
  } };
  return { root, io, ran, out, err };
};
const ID = "sdd-scene-2-files-16x9";
const FRAMES = [39, 89, 149, 209, 279, 409, 459, 559, 599, 669, 769, 869];

test("SDD files key-frame stills", async () => {
  const h = harness();
  const stale = join(h.root, `out/stills/${ID}/123.png`); mkdirSync(dirname(stale), { recursive: true }); writeFileSync(stale, "stale");
  expect(await runStills([scene.id], h.io)).toBe(0);
  expect(h.out).toEqual(FRAMES.map((f) => `out/stills/${ID}/${f}.png`));
  expect(h.err).toEqual([]);
  expect(readdirSync(join(h.root, `out/stills/${ID}`)).sort()).toEqual(FRAMES.map((f) => `${f}.png`).sort());
});

test("SDD files stills dry run", async () => {
  const h = harness(), keep = join(h.root, "out/web/keep.mp4"); mkdirSync(dirname(keep), { recursive: true }); writeFileSync(keep, "keep");
  const before = readdirSync(h.root, { recursive: true });
  expect(await runStills([scene.id, "--dry-run"], h.io)).toBe(0);
  expect(h.out).toEqual(stillCommands(scene).map(formatCommand));
  expect(h.out).toHaveLength(12);
  expect(stillCommands(scene).map((c) => [c.composition, c.frame])).toEqual(FRAMES.map((f) => [ID, f]));
  expect(h.ran).toEqual([]);
  expect(readdirSync(h.root, { recursive: true })).toEqual(before);
  expect(readFileSync(keep, "utf8")).toBe("keep");
});

test("SDD files still failure", async () => {
  const h = harness((c) => c.kind === "still" && c.frame === 409);
  expect(await runStills([scene.id], h.io)).toBe(1);
  expect(h.err).toEqual([`error: still failed: ${ID} frame 409 (exit code 1)`]);
  expect(h.ran.map((c) => c.frame)).toEqual([39, 89, 149, 209, 279, 409]);
  for (const f of [39, 89, 149, 209, 279]) expect(existsSync(join(h.root, `out/stills/${ID}/${f}.png`))).toBe(true);
  expect(existsSync(join(h.root, `out/stills/${ID}/409.png`))).toBe(false);
});

test("SDD files render dry run", async () => {
  const h = harness();
  const before = readdirSync(h.root, { recursive: true });
  expect(await runRender([scene.id, "--dry-run"], h.io)).toBe(0);
  expect(h.out).toEqual(renderCommands(scene).map(formatCommand));
  expect(renderCommands(scene).map((c) => [c.kind, c.composition, c.output])).toEqual([
    ["render", ID, `out/master/${ID}.mp4`],
    ["encode", ID, `out/web/${ID}.mp4`],
  ]);
  expect(renderCommands(scene)[1].args).toContain("-an");
  expect(h.ran).toEqual([]);
  expect(readdirSync(h.root, { recursive: true })).toEqual(before);
});

test("SDD files render failure", async () => {
  const h = harness((c) => c.kind === "render");
  expect(await runRender([scene.id], h.io)).toBe(1);
  expect(h.err).toEqual([`error: render failed: ${ID} (exit code 1)`]);
  expect(h.ran.map((c) => c.kind)).toEqual(["render"]);
});

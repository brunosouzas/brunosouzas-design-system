// Integration tests of `npm run stills` and `npm run render` (spec
// scene-rendering; tasks 5.1). The runner is replaced by a fake that writes the
// file each command would write into a temporary repository root, so ordering,
// stop-on-failure and the printed lines are proven without rendering.
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { SAFE_ID, formatCommand, isInsideOut, outputOutsideOut, parseInvocation, type Command, type Io } from "../../scripts/cli";
import { renderCommands, runRender } from "../../scripts/render";
import { stillCommands, runStills } from "../../scripts/stills";
import { circuitBreakerStates } from "../../src/scenes/circuit-breaker-states/scene";

const SCENE = "circuit-breaker-states";
const IDS = ["16x9-pt", "16x9-en", "4x5-pt", "4x5-en"].map((suffix) => `${SCENE}-${suffix}`);
const FRAMES = [200, 365, 500, 620, 775, 990, 999];
const MASTER_BYTES = 28_000_000;
const WEB_BYTES = 900_000;
const COMMAND_MS = 36_000;

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

type Harness = { io: Io; root: string; events: string[]; out: string[]; err: string[]; ran: Command[] };

/** A temporary root and a fake runner; `fails` picks the command that exits 1. */
const harness = (fails: (command: Command) => boolean = () => false): Harness => {
  const root = mkdtempSync(join(tmpdir(), "scene-cli-"));
  roots.push(root);
  const events: string[] = [];
  const out: string[] = [];
  const err: string[] = [];
  const ran: Command[] = [];
  let clock = 0;
  const io: Io = {
    root,
    runner: async (command, cwd) => {
      expect(cwd).toBe(root);
      ran.push(command);
      clock += COMMAND_MS;
      events.push(`run ${command.kind} ${command.composition}`);
      if (fails(command)) return 1;
      const target = join(root, command.output);
      mkdirSync(dirname(target), { recursive: true });
      // Fake media: only the sizes matter, for the progress line.
      writeFileSync(target, Buffer.alloc(command.kind === "render" ? MASTER_BYTES : command.kind === "encode" ? WEB_BYTES : 10));
      return 0;
    },
    log: (line) => {
      out.push(line);
      events.push(`log ${line}`);
    },
    error: (line) => {
      err.push(line);
      events.push(`error ${line}`);
    },
    // Each fake command takes 36 s, so a composition (render + encode) takes 72 s.
    now: () => clock,
  };
  return { io, root, events, out, err, ran };
};

const outListing = (root: string): string[] =>
  existsSync(join(root, "out")) ? (readdirSync(join(root, "out"), { recursive: true }) as string[]).sort() : [];

describe("Dry run", () => {
  test("Dry run of a render", async () => {
    const h = harness();
    expect(await runRender([SCENE, "--dry-run"], h.io)).toBe(0);
    expect(h.out).toEqual(renderCommands(circuitBreakerStates).map(formatCommand));
    expect(h.out).toHaveLength(8);
    expect(h.out.filter((line) => line.startsWith("npx remotion render "))).toHaveLength(4);
    expect(h.out.filter((line) => line.startsWith("npx remotion ffmpeg "))).toHaveLength(4);
    expect(h.ran).toEqual([]);
    expect(outListing(h.root)).toEqual([]);
  });

  test("Dry run of stills", async () => {
    const h = harness();
    const stale = join(h.root, "out", "stills", `${SCENE}-16x9-pt`, "123.png");
    mkdirSync(dirname(stale), { recursive: true });
    writeFileSync(stale, "old");
    const before = outListing(h.root);
    expect(await runStills(["--dry-run", SCENE], h.io)).toBe(0);
    expect(h.out).toHaveLength(28);
    expect(h.out.every((line) => line.startsWith("npx remotion still src/index.ts "))).toBe(true);
    expect(h.ran).toEqual([]);
    expect(outListing(h.root)).toEqual(before);
  });
});

describe("Stills for review", () => {
  test("Stills of the circuit-breaker scene", async () => {
    const commands = stillCommands(circuitBreakerStates);
    expect(commands.map((c) => [c.composition, c.frame])).toEqual(IDS.flatMap((id) => FRAMES.map((frame) => [id, frame])));
    for (const command of commands) expect(command.args).toContain(`--frame=${command.frame}`);

    const h = harness();
    expect(await runStills([SCENE], h.io)).toBe(0);
    const expectedPaths = IDS.flatMap((id) => FRAMES.map((frame) => `out/stills/${id}/${frame}.png`));
    expect(h.out).toEqual(expectedPaths);
    for (const id of IDS) {
      expect(readdirSync(join(h.root, "out", "stills", id)).sort()).toEqual(FRAMES.map((f) => `${f}.png`).sort());
    }
    // Each path is printed after its still is written.
    expect(h.events.indexOf(`log ${expectedPaths[0]}`)).toBeGreaterThan(h.events.indexOf(`run still ${IDS[0]}`));
  });

  test("Stale stills removed", async () => {
    const h = harness();
    const folder = join(h.root, "out", "stills", `${SCENE}-16x9-pt`);
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, "123.png"), "old");
    expect(await runStills([SCENE], h.io)).toBe(0);
    expect(readdirSync(folder).sort()).toEqual(FRAMES.map((f) => `${f}.png`).sort());
  });
});

describe("Invalid invocation and failures", () => {
  const expectNothingWritten = (h: Harness) => {
    expect(h.ran).toEqual([]);
    expect(outListing(h.root)).toEqual([]);
  };

  test("Unknown scene", async () => {
    const h = harness();
    expect(await runRender(["circuit-break"], h.io)).toBe(1);
    expect(h.err[0]).toBe("error: unknown scene: circuit-break");
    expect(h.err).toContainEqual(expect.stringMatching(/^available scenes: .*circuit-breaker-states/));
    expectNothingWritten(h);
  });

  test("Missing argument", async () => {
    const h = harness();
    expect(await runStills([], h.io)).toBe(1);
    expect(h.err).toEqual([
      "error: missing scene name",
      "usage: npm run stills -- <scene> [--dry-run]",
      `available scenes: ${SCENE}, publish-subscribe`,
    ]);
    expectNothingWritten(h);
  });

  test("Unknown option", async () => {
    const h = harness();
    expect(await runRender([SCENE, "--fast"], h.io)).toBe(1);
    expect(h.err[0]).toBe("error: unknown option: --fast");
    expectNothingWritten(h);
  });

  test("Two scene names", async () => {
    const h = harness();
    expect(await runRender([SCENE, "other"], h.io)).toBe(1);
    expect(h.err[0]).toBe(`error: only one scene is accepted, got: ${SCENE} other`);
    expectNothingWritten(h);
  });

  test("Repeated or valued dry run", async () => {
    const repeated = harness();
    expect(await runRender([SCENE, "--dry-run", "--dry-run"], repeated.io)).toBe(1);
    expect(repeated.err[0]).toBe("error: --dry-run given more than once");
    expect(repeated.out).toEqual([]);
    expectNothingWritten(repeated);

    const valued = harness();
    expect(await runRender([SCENE, "--dry-run=1"], valued.io)).toBe(1);
    expect(valued.err[0]).toBe("error: unknown option: --dry-run=1");
    expect(valued.out).toEqual([]);
    expectNothingWritten(valued);
  });

  test("Unknown option and unknown scene together", async () => {
    const h = harness();
    expect(await runRender(["circuit-break", "--fast"], h.io)).toBe(1);
    expect(h.err[0]).toBe("error: unknown option: --fast");
    expect(h.err.filter((line) => line.startsWith("error:"))).toHaveLength(1);
    expect(h.err.join("\n")).not.toContain("unknown scene");
    expectNothingWritten(h);
  });

  test("Render failure", async () => {
    const h = harness((c) => c.kind === "render" && c.composition === `${SCENE}-16x9-en`);
    expect(await runRender([SCENE], h.io)).toBe(1);
    expect(h.err).toEqual([`error: render failed: ${SCENE}-16x9-en (exit code 1)`]);
    expect(h.ran.map((c) => `${c.kind} ${c.composition}`)).toEqual([
      `render ${SCENE}-16x9-pt`,
      `encode ${SCENE}-16x9-pt`,
      `render ${SCENE}-16x9-en`,
    ]);
  });

  test("Still failure", async () => {
    const h = harness((c) => c.composition === `${SCENE}-16x9-en` && c.frame === 500);
    expect(await runStills([SCENE], h.io)).toBe(1);
    expect(h.err).toEqual([`error: still failed: ${SCENE}-16x9-en frame 500 (exit code 1)`]);
    const last = h.ran[h.ran.length - 1];
    expect([last.composition, last.frame]).toEqual([`${SCENE}-16x9-en`, 500]);
    expect(h.ran).toHaveLength(7 + 3);
  });

  test("Encode failure", async () => {
    const h = harness((c) => c.kind === "encode" && c.composition === `${SCENE}-4x5-pt`);
    expect(await runRender([SCENE], h.io)).toBe(1);
    expect(h.err).toEqual([`error: encode failed: ${SCENE}-4x5-pt (exit code 1)`]);
    expect(h.ran.some((c) => c.composition === `${SCENE}-4x5-en`)).toBe(false);
    for (const id of [`${SCENE}-16x9-pt`, `${SCENE}-16x9-en`]) {
      expect(existsSync(join(h.root, "out", "master", `${id}.mp4`))).toBe(true);
      expect(existsSync(join(h.root, "out", "web", `${id}.mp4`))).toBe(true);
    }
  });
});

describe("Master and web videos", () => {
  test("Rendering again", async () => {
    const commands = renderCommands(circuitBreakerStates);
    for (const c of commands.filter((c) => c.kind === "render")) expect(c.args).toContain("--overwrite");
    for (const c of commands.filter((c) => c.kind === "encode")) expect(c.args).toContain("-y");
    const h = harness();
    expect(await runRender([SCENE], h.io)).toBe(0);
    expect(await runRender([SCENE], h.io)).toBe(0);
    expect(readdirSync(join(h.root, "out", "master")).sort()).toEqual(IDS.map((id) => `${id}.mp4`).sort());
  });

  test("Progress line", async () => {
    const h = harness();
    expect(await runRender([SCENE], h.io)).toBe(0);
    expect(h.out).toEqual(IDS.map((id) => `${id}: 72 s, master 28.0 MB, web 900 KB`));
    for (let i = 0; i < IDS.length; i++) {
      const line = h.events.indexOf(`log ${h.out[i]}`);
      expect(line).toBeGreaterThan(h.events.indexOf(`run encode ${IDS[i]}`));
      if (i + 1 < IDS.length) expect(line).toBeLessThan(h.events.indexOf(`run render ${IDS[i + 1]}`));
    }
  });
});

describe("Encoder settings", () => {
  // Written out by hand from design §7, not derived from renderCommands, so a
  // change to CRF, codec, audio or overwrite flags fails here.
  test("render and encode arguments match the design", () => {
    const id = `${SCENE}-16x9-pt`;
    const [render, encode] = renderCommands(circuitBreakerStates).filter((c) => c.composition === id);
    expect(render.args).toEqual([
      "remotion", "render", "src/index.ts", id, `out/master/${id}.mp4`,
      "--codec=h264", "--hardware-acceleration=if-possible", "--overwrite", "--log=error",
    ]);
    expect(encode.args).toEqual([
      "remotion", "ffmpeg", "-v", "error", "-y", "-i", `out/master/${id}.mp4`,
      "-c:v", "libx264", "-crf", "30", "-preset", "slow", "-pix_fmt", "yuv420p",
      "-movflags", "+faststart", "-an", `out/web/${id}.mp4`,
    ]);
  });

  test("still arguments match the design", () => {
    const [first] = stillCommands(circuitBreakerStates);
    expect(first.args).toEqual([
      "remotion", "still", "src/index.ts", `${SCENE}-16x9-pt`, `out/stills/${SCENE}-16x9-pt/200.png`,
      "--frame=200", "--overwrite", "--log=error",
    ]);
  });
});

describe("Path containment", () => {
  // Regression (Codex code review): a scene id with `..` once made stills
  // empty a folder outside the repository.
  const hostile = (id: string) => ({ ...circuitBreakerStates, id });

  test("a scene id that could leave out/ is refused before any effect", async () => {
    expect(SAFE_ID.test("-a")).toBe(false);
    for (const id of ["../../../victim", "a/b", "..", "UPPER", "a--b"]) {
      expect(SAFE_ID.test(id)).toBe(false);
      const parsed = parseInvocation([id], [hostile(id)]);
      expect(parsed.ok).toBe(false);
      if (!parsed.ok) expect(parsed.problem).toMatch(/^invalid scene id/);
    }
    expect(SAFE_ID.test(SCENE)).toBe(true);
  });

  test("hostile composition paths are detected as outside out/", async () => {
    const h = harness();
    const victim = join(h.root, "..", `${basename(h.root)}-victim-16x9-pt`);
    mkdirSync(victim, { recursive: true });
    writeFileSync(join(victim, "keep.txt"), "keep");
    roots.push(victim);
    const outputs = stillCommands(hostile(`../../../${basename(h.root)}-victim`));
    expect(outputOutsideOut(h.root, outputs)).not.toBeNull();
    expect(existsSync(join(victim, "keep.txt"))).toBe(true);
  });

  test("containment check", () => {
    const root = "/repo";
    expect(isInsideOut(root, "out/stills/x/1.png")).toBe(true);
    expect(isInsideOut(root, "out")).toBe(false);
    expect(isInsideOut(root, "out/../src/x")).toBe(false);
    expect(isInsideOut(root, "out/stills/../../../etc")).toBe(false);
    expect(isInsideOut(root, "/etc/passwd")).toBe(false);
    expect(isInsideOut(root, "outside/x")).toBe(false);
  });
});

describe("Output location", () => {
  test("Paths of every media output", () => {
    const commands = [...renderCommands(circuitBreakerStates), ...stillCommands(circuitBreakerStates)];
    expect(commands).toHaveLength(8 + 28);
    for (const command of commands) {
      expect(command.output.startsWith("out/")).toBe(true);
      expect(command.output).not.toContain("..");
      expect(command.args[command.args.length - 1] === command.output || command.args.includes(command.output)).toBe(true);
      // Every path-like argument the command writes or reads is the source entry or under out/.
      for (const arg of command.args.filter((a) => /\.(mp4|png)$/.test(a))) expect(arg.startsWith("out/")).toBe(true);
    }
  });
});

// The release safeguards (AB#155, docs/release.md): the tag check and the
// release detection (AB#171) against a synthetic Git history, and the publish
// script with stub `npm` and `gh` on the PATH. Nothing here talks to npm or GitHub.
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";

const ROOT = new URL("../..", import.meta.url).pathname;
const folders: string[] = [];
afterEach(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
});
const temp = (prefix: string) => {
  const folder = mkdtempSync(join(tmpdir(), prefix));
  folders.push(folder);
  return folder;
};

describe("Release tag check", () => {
  /** A repository whose origin/main holds one commit, plus a side commit that is not on main. */
  const history = (version: string) => {
    const repo = temp("tag-");
    const git = (...args: string[]) => execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    git("init", "-q", "-b", "main");
    git("config", "user.email", "test@example.com");
    git("config", "user.name", "test");
    writeFileSync(join(repo, "package.json"), JSON.stringify({ version }));
    git("add", ".");
    git("commit", "-qm", "main");
    git("update-ref", "refs/remotes/origin/main", "HEAD");
    git("tag", `v${version}`);
    git("switch", "-qc", "side");
    writeFileSync(join(repo, "side.txt"), "x");
    git("add", ".");
    git("commit", "-qm", "side");
    git("tag", "v9.9.9");
    git("switch", "-q", "main");
    return repo;
  };
  const check = (repo: string, tag: string, commit?: string) =>
    spawnSync("node", [join(ROOT, "scripts/check-release-tag.mjs"), tag, ...(commit === undefined ? [] : [commit])], { cwd: repo, encoding: "utf8" });

  test("A tag on main that matches the version passes", () => {
    expect(check(history("0.1.0"), "v0.1.0").status).toBe(0);
  });

  test("Wrong shape, wrong version or not on main stops the release", () => {
    const repo = history("0.1.0");
    expect(check(repo, "v0.1.0-beta").stderr).toMatch(/digits only/);
    expect(check(repo, "v0.2.0").stderr).toMatch(/does not match package.json version 0\.1\.0/);
    writeFileSync(join(repo, "package.json"), JSON.stringify({ version: "9.9.9" }));
    expect(check(repo, "v9.9.9").stderr).toMatch(/must be on main/);
  });

  test("From main: a commit on main with the version passes before the tag exists", () => {
    const repo = history("0.1.0");
    execFileSync("git", ["tag", "-d", "v0.1.0"], { cwd: repo, stdio: "ignore" });
    expect(check(repo, "v0.1.0", "main").status).toBe(0);
    expect(check(repo, "v0.1.0", "side").stderr).toMatch(/must be on main/);
    expect(check(repo, "v0.1.0", "nothing").stderr).toMatch(/does not name a commit/);
  });

  test("From main: an existing tag on another commit stops the release", () => {
    const repo = history("0.1.0");
    execFileSync("git", ["tag", "-f", "v0.1.0", "side"], { cwd: repo, stdio: "ignore" });
    expect(check(repo, "v0.1.0", "main").stderr).toMatch(/already exists on/);
  });
});

describe("Release detection", () => {
  /** main with three commits: version 0.1.0, then 0.2.0 (the version pull request), then a README fix. */
  const history = () => {
    const repo = temp("detect-");
    const git = (...args: string[]) => execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    git("init", "-q", "-b", "main");
    git("config", "user.email", "test@example.com");
    git("config", "user.name", "test");
    const commit = (files: Record<string, string>, message: string) => {
      for (const [name, text] of Object.entries(files)) writeFileSync(join(repo, name), text);
      git("add", ".");
      git("commit", "-qm", message);
      return git("rev-parse", "HEAD");
    };
    const first = commit({ "package.json": JSON.stringify({ version: "0.1.0" }) }, "0.1.0");
    git("tag", "v0.1.0");
    const bump = commit({ "package.json": JSON.stringify({ version: "0.2.0" }) }, "0.2.0");
    const readme = commit({ "README.md": "fix" }, "readme");
    return { repo, git, first, bump, readme };
  };
  const detect = (repo: string, ...args: string[]) => {
    const result = spawnSync("node", [join(ROOT, "scripts/release-detect.mjs"), ...args], { cwd: repo, encoding: "utf8" });
    return { status: result.status, out: result.stdout, why: result.stderr };
  };

  test("The merge that changes the version releases it", () => {
    const { repo, first, bump } = history();
    expect(detect(repo, "branch", "main", first, bump)).toMatchObject({ status: 0, out: "release=true\ntag=v0.2.0\n" });
  });

  test("A later push with the same version releases nothing, even before the tag exists", () => {
    const { repo, bump, readme } = history();
    const result = detect(repo, "branch", "main", bump, readme);
    expect(result).toMatchObject({ status: 0, out: "release=false\ntag=v0.2.0\n" });
    expect(result.why).toMatch(/unchanged/);
  });

  test("A version whose tag exists releases nothing", () => {
    const { repo, git, first, bump } = history();
    git("tag", "v0.2.0", bump);
    expect(detect(repo, "branch", "main", first, bump).out).toBe("release=false\ntag=v0.2.0\n");
  });

  test("A pushed tag goes to the tag check; other branches and a missing before release nothing", () => {
    const { repo, first, bump } = history();
    expect(detect(repo, "tag", "v0.2.0", "0000000000000000000000000000000000000000", bump).out).toBe("release=true\ntag=v0.2.0\n");
    expect(detect(repo, "branch", "ab171-x", first, bump).out).toBe("release=false\ntag=\n");
    expect(detect(repo, "branch", "main", "0000000000000000000000000000000000000000", bump).out).toBe("release=false\ntag=v0.2.0\n");
    expect(detect(repo, "branch", "main").status).toBe(1);
  });
});

describe("Release workflow publish step", () => {
  /** The `run: |` block of the step named `name` in release.yml, as the runner would hand it to bash. */
  const runBlock = (name: string) => {
    const lines = readFileSync(join(ROOT, ".github/workflows/release.yml"), "utf8").split("\n");
    const start = lines.findIndex((line) => line.trim() === `- name: ${name}`);
    expect(start, `step "${name}" in release.yml`).toBeGreaterThan(-1);
    const run = lines.findIndex((line, i) => i > start && /^\s+run: \|$/.test(line));
    const indent = lines[run]!.search(/\S/);
    const body: string[] = [];
    for (const line of lines.slice(run + 1)) {
      if (line.trim() !== "" && line.search(/\S/) <= indent) break;
      body.push(line.slice(indent + 2));
    }
    return body.join("\n");
  };

  test("Hands the publish script the packed tarball and the integrity file", () => {
    const dir = temp("workflow-");
    mkdirSync(join(dir, "scripts"));
    const log = join(dir, "args.json");
    writeFileSync(join(dir, "scripts/release-publish.sh"), `#!/bin/sh\nnode -e 'require("node:fs").writeFileSync(process.argv[1], JSON.stringify(process.argv.slice(2)))' "${log}" "$@"\n`);
    chmodSync(join(dir, "scripts/release-publish.sh"), 0o755);
    writeFileSync(join(dir, "step.sh"), runBlock("Publish and create the release"));
    const runnerTemp = join(dir, "runner");
    // GitHub runs a step's script as `bash -e {0}`.
    const result = spawnSync("bash", ["-e", join(dir, "step.sh")], {
      cwd: dir,
      encoding: "utf8",
      env: { ...process.env, RELEASE_TAG: "v0.1.0", RUNNER_TEMP: runnerTemp },
    });
    expect(result.status, result.stderr).toBe(0);
    const { name } = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as { name: string };
    // npm pack names @scope/name-<version>.tgz as scope-name-<version>.tgz.
    const tarball = `${name.replace(/^@/, "").replace("/", "-")}-0.1.0.tgz`;
    expect(JSON.parse(readFileSync(log, "utf8"))).toEqual([join(runnerTemp, "release", tarball), join(runnerTemp, "release", "integrity")]);
  });
});

describe("Release publish script", () => {
  /** Stub npm and gh that log their arguments and answer from environment variables. */
  const stubs = () => {
    const dir = temp("stubs-");
    const bin = join(dir, "bin");
    mkdirSync(bin);
    const log = join(dir, "calls.log");
    writeFileSync(join(bin, "npm"), `#!/bin/sh\necho "npm $*" >> "${log}"\nif [ "$1" = view ]; then printf '%s' "$NPM_VIEW_OUT"; exit "$NPM_VIEW_STATUS"; fi\nexit 0\n`);
    writeFileSync(join(bin, "gh"), `#!/bin/sh\necho "gh $*" >> "${log}"\nif [ "$2" = view ]; then echo "$GH_VIEW_ERR" >&2; exit "$GH_VIEW_STATUS"; fi\nexit 0\n`);
    chmodSync(join(bin, "npm"), 0o755);
    chmodSync(join(bin, "gh"), 0o755);
    writeFileSync(join(dir, "integrity"), "sha512-good\n");
    writeFileSync(join(dir, "pkg.tgz"), "data");
    const run = (env: Record<string, string>) => {
      const result = spawnSync("bash", [join(ROOT, "scripts/release-publish.sh"), join(dir, "pkg.tgz"), join(dir, "integrity")], {
        encoding: "utf8",
        env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, GITHUB_REF_NAME: "v0.1.0", GH_VIEW_STATUS: "1", GH_VIEW_ERR: "release not found", ...env },
      });
      let calls: string[] = [];
      try {
        calls = readFileSync(log, "utf8").trim().split("\n");
      } catch {
        calls = [];
      }
      return { status: result.status, stderr: result.stderr, calls };
    };
    return run;
  };
  const published = (calls: string[]) => calls.some((call) => call.startsWith("npm publish"));

  test("Absent version: publishes with provenance, then creates the release", () => {
    const run = stubs();
    const result = run({ NPM_VIEW_STATUS: "1", NPM_VIEW_OUT: '{"error":{"code":"E404"}}' });
    expect(result.status).toBe(0);
    expect(result.calls).toContain(`npm publish ${result.calls.find((c) => c.startsWith("npm publish"))!.split(" ")[2]} --provenance --access public --ignore-scripts`);
    expect(result.calls.some((call) => call.startsWith("gh release create v0.1.0 --verify-tag"))).toBe(true);
  });

  test("From main: publishes, then the release creates the tag on the commit", () => {
    const run = stubs();
    const result = run({ NPM_VIEW_STATUS: "1", NPM_VIEW_OUT: '{"error":{"code":"E404"}}', GITHUB_REF_NAME: "main", RELEASE_TAG: "v0.1.0", RELEASE_COMMIT: "abc123" });
    expect(result.status, result.stderr).toBe(0);
    const publish = result.calls.findIndex((call) => call.startsWith("npm publish"));
    const create = result.calls.findIndex((call) => call === "gh release create v0.1.0 --target abc123 --generate-notes");
    expect(publish).toBeGreaterThan(-1);
    expect(create).toBeGreaterThan(publish);
  });

  test("Same bytes with provenance: does not publish again", () => {
    const run = stubs();
    const result = run({ NPM_VIEW_STATUS: "0", NPM_VIEW_OUT: '{"integrity":"sha512-good","attestations":{"provenance":{}}}', GH_VIEW_STATUS: "0" });
    expect(result.status).toBe(0);
    expect(published(result.calls)).toBe(false);
  });

  test("Other bytes, no provenance or an npm error: stops without publishing", () => {
    for (const env of [
      { NPM_VIEW_STATUS: "0", NPM_VIEW_OUT: '{"integrity":"sha512-other","attestations":{"provenance":{}}}' },
      { NPM_VIEW_STATUS: "0", NPM_VIEW_OUT: '{"integrity":"sha512-good"}' },
      { NPM_VIEW_STATUS: "1", NPM_VIEW_OUT: '{"error":{"code":"E401"}}' },
    ]) {
      const result = stubs()(env);
      expect(result.status, JSON.stringify(env)).toBe(1);
      expect(published(result.calls)).toBe(false);
      expect(result.calls.some((call) => call.startsWith("gh"))).toBe(false);
    }
  });
});

#!/usr/bin/env node
/** The first job of a release: does this push release a version, and which tag?
 *
 * Why: .github/workflows/release.yml runs on every push to main and on every pushed tag v*. Most pushes
 * to main release nothing. A push to main releases only when it changes the `version` in package.json
 * (the version pull request was merged) and the tag v<version> does not exist yet. So a later merge
 * (a README fix) never releases again, even while the version still waits for the owner's approval.
 * A pushed tag v* always goes on to the tag check, as before: that is how the owner releases by hand
 * or retries.
 *
 * Run from the repository root, after a checkout with the full history and the tags (fetch-depth: 0):
 *   node scripts/release-detect.mjs <ref-type> <ref-name> <before-sha> <after-sha>
 * (in the workflow: github.ref_type, github.ref_name, github.event.before, github.sha).
 * Prints `release=<true|false>` and `tag=<tag>` on stdout, one per line, for $GITHUB_OUTPUT, and one
 * line on stderr that says why. Exit 0 in both cases; exit 1 only when it cannot tell (an unreadable
 * package.json, a Git failure, wrong arguments).
 */
import { spawnSync } from 'node:child_process';

function fail(message) {
  process.stderr.write(`release detect: ${message}\n`);
  process.exit(1);
}

function git(...args) {
  return spawnSync('git', args, { encoding: 'utf8' });
}

/** The version in package.json at a commit, or undefined when the file or the field is not there. */
function versionAt(sha) {
  const shown = git('show', `${sha}:package.json`);
  if (shown.status !== 0) return undefined;
  try {
    const { version } = JSON.parse(shown.stdout);
    return typeof version === 'string' ? version : undefined;
  } catch {
    fail(`package.json at ${sha} is not JSON`);
  }
}

function answer(release, tag, why) {
  process.stdout.write(`release=${release}\ntag=${tag}\n`);
  process.stderr.write(`release detect: ${why}\n`);
  process.exit(0);
}

const [refType, refName, before, after] = process.argv.slice(2);
if (!refType || !refName || before === undefined || !after) {
  fail('usage: release-detect.mjs <ref-type> <ref-name> <before-sha> <after-sha>');
}

if (refType === 'tag') answer(true, refName, `tag ${refName} pushed: the tag check decides`);
if (refType !== 'branch' || refName !== 'main') answer(false, '', `push to ${refType} ${refName}: nothing to release`);

const version = versionAt(after);
if (version === undefined) fail(`cannot read the version from package.json at ${after}`);
const tag = `v${version}`;

// A new branch or a push without a previous commit has no "before" to compare with.
if (/^0+$/.test(before) || git('cat-file', '-e', `${before}^{commit}`).status !== 0) {
  answer(false, tag, `no previous commit to compare with (${before || 'none'}): nothing to release`);
}
const previous = versionAt(before);
if (previous === version) answer(false, tag, `version ${version} unchanged by this push: nothing to release`);

const existing = git('rev-parse', '--verify', '--quiet', `refs/tags/${tag}`);
if (existing.status === 0) answer(false, tag, `tag ${tag} already exists: nothing to release`);
if (existing.status !== 1) fail(`cannot check whether ${tag} exists: ${existing.stderr.trim() || 'git failed'}`);

answer(true, tag, `version changed from ${previous ?? 'none'} to ${version} and ${tag} does not exist: release ${tag}`);

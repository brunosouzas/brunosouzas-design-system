# Releasing @brunosouzas/design-system

A version reaches npm when a commit on `main` changes the `version` in `package.json` (the version pull request is merged) and the owner approves the publishing job; the workflow then creates the tag `v<major>.<minor>.<patch>` and the GitHub release. The owner can also push the tag by hand, as before (to retry, or to release a version whose run he rejected). The workflow is [`.github/workflows/release.yml`](../.github/workflows/release.yml). This page says how to release, how the very first version is set up, and how to check what was published.

## What the workflow does

The workflow runs on every push to `main` and on every pushed tag `v*`, in three jobs, so the identity that can publish never exists while dependencies install or run their scripts.

0. **`detect`** has only read access. [`scripts/release-detect.mjs`](../scripts/release-detect.mjs) decides whether the push releases anything:
   - a push to `main` releases only when it moves `main` forward (a merge; never a forced push), changes the `version` in `package.json` compared with the commit before the push, and the tag `v<version>` does not exist yet. A README fix merged later, while the version still waits for approval, releases nothing;
   - a pushed tag always goes on to `check`;
   - anything else stops here, in seconds, and the run is green.
1. **`check`** has only read access to the repository. It runs [`scripts/check-release-tag.mjs`](../scripts/check-release-tag.mjs) first: the tag must be `v` plus the `version` in `package.json`, digits only (no `-beta`), on a commit that is on `origin/main` (from `main`: the pushed commit, and if the tag already exists it must name that commit). Then `npm ci`, the type-check, the token freshness check, the build, the full test suite (which packs the built package, installs it into an empty project with no network and uses every entry point) and `npm audit --omit=dev` (the package has no runtime dependency; any finding stops the release). Then `npm pack --ignore-scripts` packs the files just built. The tarball and its integrity go to the next job as an artifact.
2. **`publish`** runs in the GitHub environment `npm`, which waits for the owner's approval. It installs nothing and builds nothing. It checks out the released commit only to run [`scripts/release-publish.sh`](../scripts/release-publish.sh) on the downloaded files. The script asks npm whether the version exists:
   - absent: it publishes the tarball with `npm publish --provenance --access public --ignore-scripts`;
   - present with the same integrity and a provenance attestation: it skips publishing;
   - present with other bytes, or without provenance, or npm cannot answer: it stops with exit 1 and changes nothing.

   Then it creates the GitHub release, or leaves an existing one. From `main` the release creates the tag on the released commit, after npm has the version: the tag records what was published. Because the owner may push the same tag by hand meanwhile, the script reads the tag on GitHub before publishing and again after the release: if it names another commit, it stops (before npm, nothing is published). A tag created by the workflow does not start the workflow again (GitHub does not run workflows for events of its own token).

There is no SBOM: nothing ships but this package's own files.

If a run fails after npm publishing (for example while creating the GitHub release), use "Re-run failed jobs". The script sees the same bytes on npm and only finishes the release.

## Releasing a version

1. In a pull request, set the new version: `npm version 0.2.0 --no-git-tag-version` (it updates `package.json` and `package-lock.json`). The version may travel with the change it releases or in a pull request of its own; the diff shows the line `"version": "0.2.0"`, and that line is what releases.
2. Merge it. The run of that merge in the Actions tab goes through `detect` and `check`, then the `publish` job waits for you: review it and approve. To not release it, reject the run; nothing is published and no tag is created.
3. Check the result (see [Checking a release](#checking-a-release)): the version on npm with provenance, and the tag and GitHub release `v0.2.0`.

**By hand, or to retry.** Tag the commit on `main` and push the tag:

```sh
git switch main && git pull --ff-only
git tag v0.2.0
git push origin v0.2.0
```

A tag that does not match the version, or a tag on a commit that is not on `main`, fails in the first step of `check`. Delete the tag (`git push origin :refs/tags/v0.2.0`), fix, and tag again. If a run fails after npm publishing, "Re-run failed jobs" finishes it.

## Who can release

Three controls, so neither a merge nor a pushed tag alone publishes:

- **The tag check.** Only a commit on `main`, so only merged and reviewed code, is released, and only when its version is the tag's.
- **The environment `npm`.** Its required reviewer is the owner, so every publishing run waits for his approval.
- **The trusted publisher on npm** (after the first version). npm accepts a publication only from the workflow `release.yml` of `brunosouzas/brunosouzas-design-system`, running in the environment `npm`.

The owner also adds a tag ruleset, so a `v*` tag cannot be moved or deleted except by him.

## Setting up the first version

npm lets a package trust a GitHub workflow only once the package exists. So version 0.1.0 is published with a short-lived token, and the token is removed right after. The owner does every step below; the agent does none of them.

### 1. The npm account

1. Sign in to [npmjs.com](https://www.npmjs.com/) and turn on two-factor authentication for the account ([npm docs](https://docs.npmjs.com/configuring-two-factor-authentication)), if it is not on yet.
2. Create a granular access token ([npm docs](https://docs.npmjs.com/creating-and-viewing-access-tokens)): Access Tokens → Generate New Token → Granular Access Token.
   - Name: `brunosouzas-design-system first release`.
   - Expiration: 7 days.
   - Packages and scopes: permission **Read and write**, for the scope **`@brunosouzas`** (the package does not exist yet, so it cannot be selected; the scope limits the token to the org's packages).
   - Tick **Bypass two-factor authentication**: the job cannot answer a two-factor prompt.
   - Organisations: no access (publishing to the scope needs only the package permission above; the account must be a member of the org `brunosouzas` with publish rights, which its owner is).

   Copy the token once; it is shown only once. Never paste it anywhere but the secret below.

### 2. The GitHub environment `npm`

In the repository: Settings → Environments → New environment, named `npm` ([GitHub docs](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)).

- **Required reviewers:** the owner. Leave "Prevent self-review" off: the owner pushes the tag and approves his own run.
- **Deployment branches and tags:** "Selected branches and tags", with the branch rule `main` and the tag rule `v*`.
- **Environment secrets:** add `NPM_TOKEN` with the token from step 1. It is an environment secret, not a repository secret, so only the approved `publish` job can read it.

### 3. The tag ruleset

Settings → Rules → Rulesets → New ruleset → New tag ruleset ([GitHub docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository)):

- Name: `release tags`; enforcement: Active.
- Target tags: include by pattern `v*`.
- Rules: restrict updates, restrict deletions. Not "restrict creations": the `publish` job creates the tag with the workflow's own token, and the ruleset would refuse it. If the bypass list offers the GitHub Actions app, it may keep "restrict creations" with that app allowed instead.
- Bypass list: Repository admin (the owner), always allowed.

### 4. Release 0.1.0

Follow [Releasing a version](#releasing-a-version) from step 2 (`package.json` already says `0.1.0`):

```sh
git switch main && git pull --ff-only
git tag v0.1.0
git push origin v0.1.0
```

Approve the `publish` job when it waits. npm publishes with the token and with provenance.

### 5. Trusted publishing only

Right after 0.1.0 is on npm:

1. On npmjs.com, open the package `@brunosouzas/design-system` → Settings → Trusted Publisher → GitHub Actions ([npm docs](https://docs.npmjs.com/trusted-publishers)): user `brunosouzas`, repository `brunosouzas-design-system`, workflow filename `release.yml`, environment `npm`. Save.
2. In the same settings, Publishing access: choose "Require two-factor authentication and disallow tokens". From now on only the trusted workflow can publish.
3. Revoke the token: Access Tokens → the `brunosouzas-design-system first release` token → Delete.
4. Delete the environment secret `NPM_TOKEN` in Settings → Environments → `npm`.

The workflow still passes `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`. With the secret gone it is empty, and npm publishes through OpenID Connect: the job proves who it is with a short-lived token from GitHub, and no long-lived npm token exists anywhere.

## Checking a release

**On npm.** The package page on npmjs.com shows a provenance badge naming the repository, the workflow and the commit. From the command line:

```sh
npm view @brunosouzas/design-system@0.1.0 dist --json   # integrity and attestations.provenance
```

**Signatures and provenance of an install.** In a scratch folder, not in a project:

```sh
mkdir ds-check && cd ds-check
npm init -y
npm install @brunosouzas/design-system@0.1.0
npm audit signatures
```

`npm audit signatures` checks the registry signature of every installed package and the provenance attestation of those that have one; @brunosouzas/design-system must be counted under "verified attestation". Then delete the folder.

**What this proves.** Provenance says the tarball on npm was built by `release.yml` in `brunosouzas/brunosouzas-design-system` from the tagged commit; it does not say the code is safe. The tarball on npm is the one the `check` job tested and audited: `publish` uploads those bytes and builds nothing.

## Moving an existing repository to release on merge

Before the first version that should release on merge (card 171), the owner changes two settings once:

1. Settings → Environments → `npm` → Deployment branches and tags: add the branch rule `main` (keep `v*`). Without it the `publish` job of a push to `main` cannot enter the environment.
2. Settings → Rules → Rulesets → `release tags`: untick "Restrict creations" (or add the GitHub Actions app to the bypass list, if it is offered). Without it the release is published on npm but the tag and the GitHub release fail; "Re-run failed jobs" after the fix finishes them.

The trusted publisher on npm does not change: it names the workflow file `release.yml` and the environment `npm`, not the trigger.
